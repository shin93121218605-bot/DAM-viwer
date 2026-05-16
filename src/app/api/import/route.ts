export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// CORS headers — allow POST from clubdam.com (where bookmarklet runs)
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://www.clubdam.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

interface RawRecord {
  score?: string | number;
  scoringAiId?: string;
  requestNo?: string;
  contentsName?: string;
  artistName?: string;
  dContentsName?: string;
  dArtistName?: string;
  damserial?: string;
  dataKind?: string;
  clubDamCardNo?: string;
  entryCount?: string | number;
  analysisReportCommentNo?: string;
  radarChartPitch?: string | number;
  radarChartStability?: string | number;
  radarChartExpressive?: string | number;
  radarChartVibratoLongtone?: string | number;
  radarChartRhythm?: string | number;
  singingRangeHighest?: string;
  singingRangeLowest?: string;
  vocalRangeHighest?: string;
  vocalRangeLowest?: string;
  scoringDateTime?: string;
}

function toFloat(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function parseDateTime(dt: string | undefined): Date {
  if (!dt) return new Date();
  // Bookmarklet format: YYYYMMDDHHmmss (14 chars)
  if (/^\d{14}$/.test(dt)) {
    return new Date(
      `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}T${dt.slice(8, 10)}:${dt.slice(10, 12)}:${dt.slice(12, 14)}+09:00`
    );
  }
  return new Date(dt);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid JSON" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const records: RawRecord[] = Array.isArray(body)
    ? body
    : (body as { records?: RawRecord[] })?.records ?? [];

  if (records.length === 0) {
    return NextResponse.json(
      { error: "records is empty" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  let imported = 0;
  let skipped = 0;

  for (const r of records) {
    if (!r.scoringAiId) {
      skipped++;
      continue;
    }

    // Bookmarklet stores score as text content integer (e.g. 87123 = 87.123 pts)
    const scoreRaw = toFloat(r.score);
    const score =
      scoreRaw != null && scoreRaw > 200
        ? scoreRaw / 1000
        : scoreRaw;

    const data = {
      requestNo: r.requestNo ?? "",
      contentsName: r.contentsName ?? "",
      artistName: r.artistName ?? "",
      dContentsName: r.dContentsName ?? r.contentsName ?? "",
      dArtistName: r.dArtistName ?? r.artistName ?? "",
      damserial: r.damserial ?? "",
      dataKind: r.dataKind ?? "",
      clubDamCardNo: r.clubDamCardNo ?? "",
      entryCount: r.entryCount != null ? Number(r.entryCount) : null,
      analysisReportCommentNo: r.analysisReportCommentNo ?? null,
      radarChartPitch: toFloat(r.radarChartPitch),
      radarChartStability: toFloat(r.radarChartStability),
      radarChartExpressive: toFloat(r.radarChartExpressive),
      radarChartVibratoLongtone: toFloat(r.radarChartVibratoLongtone),
      radarChartRhythm: toFloat(r.radarChartRhythm),
      singingRangeHighest: r.singingRangeHighest ?? null,
      singingRangeLowest: r.singingRangeLowest ?? null,
      vocalRangeHighest: r.vocalRangeHighest ?? null,
      vocalRangeLowest: r.vocalRangeLowest ?? null,
      score,
      performedAt: parseDateTime(r.scoringDateTime),
    };

    await prisma.scoringRecord.upsert({
      where: { scoringAiId: r.scoringAiId },
      update: data,
      create: { scoringAiId: r.scoringAiId, ...data },
    });
    imported++;
  }

  return NextResponse.json(
    { imported, skipped, total: records.length },
    { headers: CORS_HEADERS }
  );
}
