export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { prisma } from "@/lib/db";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseAttributeValue: true,
  parseTagValue: true,
  isArray: (name) => name === "scoring",
});

function toFloat(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function parseDateTime(dt: string | undefined): Date {
  if (!dt) return new Date();
  if (/^\d{14}$/.test(dt)) {
    return new Date(
      `${dt.slice(0,4)}-${dt.slice(4,6)}-${dt.slice(6,8)}T${dt.slice(8,10)}:${dt.slice(10,12)}:${dt.slice(12,14)}+09:00`
    );
  }
  return new Date(dt);
}

export async function POST(req: NextRequest) {
  const xmlText = await req.text();

  if (!xmlText || xmlText.trim().length === 0) {
    return NextResponse.json({ error: "empty body" }, { status: 400, headers: CORS });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = parser.parse(xmlText);
  } catch {
    return NextResponse.json({ error: "XML parse error" }, { status: 400, headers: CORS });
  }

  // Navigate to root element
  const root = (parsed["document"] ?? parsed[Object.keys(parsed)[0]] ?? {}) as Record<string, unknown>;
  const result = (root["result"] ?? {}) as Record<string, unknown>;
  const statusCode = String(result["statusCode"] ?? "0");
  const status = String(result["status"] ?? "");

  // NG status = no more pages or auth error → signal done
  if (status === "NG" || (statusCode !== "0" && statusCode !== "")) {
    return NextResponse.json({ imported: 0, hasNext: false, done: true }, { headers: CORS });
  }

  const data = (root["data"] ?? {}) as Record<string, unknown>;
  const page = (data["page"] ?? {}) as Record<string, unknown>;
  const hasNext = page["hasNext"] === true || page["hasNext"] === "1" || page["hasNext"] === 1;

  const rawList = (data["scoring"] ?? []) as Record<string, unknown>[];
  const records = Array.isArray(rawList) ? rawList : [rawList];

  let imported = 0;
  for (const r of records) {
    const id = String(r["scoringAiId"] ?? "");
    if (!id) continue;

    const scoreRaw = toFloat(r["#text"]);
    const score = scoreRaw != null && scoreRaw > 200 ? scoreRaw / 1000 : scoreRaw;

    const row = {
      requestNo: String(r["requestNo"] ?? ""),
      contentsName: String(r["contentsName"] ?? ""),
      artistName: String(r["artistName"] ?? ""),
      dContentsName: String(r["dContentsName"] ?? r["contentsName"] ?? ""),
      dArtistName: String(r["dArtistName"] ?? r["artistName"] ?? ""),
      damserial: String(r["damserial"] ?? ""),
      dataKind: String(r["dataKind"] ?? ""),
      clubDamCardNo: String(r["clubDamCardNo"] ?? ""),
      entryCount: r["entryCount"] != null ? Number(r["entryCount"]) : null,
      analysisReportCommentNo: r["analysisReportCommentNo"] ? String(r["analysisReportCommentNo"]) : null,
      radarChartPitch: toFloat(r["radarChartPitch"]),
      radarChartStability: toFloat(r["radarChartStability"]),
      radarChartExpressive: toFloat(r["radarChartExpressive"]),
      radarChartVibratoLongtone: toFloat(r["radarChartVibratoLongtone"]),
      radarChartRhythm: toFloat(r["radarChartRhythm"]),
      singingRangeHighest: r["singingRangeHighest"] ? String(r["singingRangeHighest"]) : null,
      singingRangeLowest: r["singingRangeLowest"] ? String(r["singingRangeLowest"]) : null,
      vocalRangeHighest: r["vocalRangeHighest"] ? String(r["vocalRangeHighest"]) : null,
      vocalRangeLowest: r["vocalRangeLowest"] ? String(r["vocalRangeLowest"]) : null,
      score,
      performedAt: parseDateTime(String(r["scoringDateTime"] ?? "")),
    };

    await prisma.scoringRecord.upsert({
      where: { scoringAiId: id },
      update: row,
      create: { scoringAiId: id, ...row },
    });
    imported++;
  }

  return NextResponse.json({ imported, hasNext, done: !hasNext }, { headers: CORS });
}
