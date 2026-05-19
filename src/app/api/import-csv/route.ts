export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function toFloat(v: string | undefined): number | null {
  if (!v || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function parseDateTime(dt: string | undefined): Date {
  if (!dt) return new Date();
  // "2025/11/01 07:54" or "2025/11/01 07:54:00"
  const normalized = dt
    .replace(/^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}:\d{2}:\d{2})$/, "$1-$2-$3T$4+09:00")
    .replace(/^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}:\d{2})$/, "$1-$2-$3T$4:00+09:00");
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? new Date() : d;
}

export async function POST(req: NextRequest) {
  const csvText = await req.text();
  if (!csvText.trim()) {
    return NextResponse.json({ error: "empty body" }, { status: 400 });
  }

  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return NextResponse.json({ error: "no data rows" }, { status: 400 });
  }

  const headers = parseCSVLine(lines[0]);

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const r: Record<string, string> = {};
    headers.forEach((h, idx) => { r[h] = values[idx] ?? ""; });

    const id = r["scoringAiId"];
    if (!id) { skipped++; continue; }

    const scoreRaw = toFloat(r["score"]);
    const score = scoreRaw != null ? scoreRaw / 1000 : null;

    const row = {
      requestNo: r["requestNo"] ?? "",
      contentsName: r["contentsName"] ?? "",
      artistName: r["artistName"] ?? "",
      dContentsName: r["dContentsName"] || r["contentsName"] || "",
      dArtistName: r["dArtistName"] || r["artistName"] || "",
      damserial: r["damserial"] ?? "",
      dataKind: r["dataKind"] ?? "",
      clubDamCardNo: r["clubDamCardNo"] ?? "",
      entryCount: r["entryCount"] ? Number(r["entryCount"]) : null,
      analysisReportCommentNo: r["analysisReportCommentNo"] || null,
      radarChartPitch: toFloat(r["radarChartPitch"]),
      radarChartStability: toFloat(r["radarChartStability"]),
      radarChartExpressive: toFloat(r["radarChartExpressive"]),
      radarChartVibratoLongtone: toFloat(r["radarChartVibratoLongtone"]),
      radarChartRhythm: toFloat(r["radarChartRhythm"]),
      singingRangeHighest: r["singingRangeHighest"] || null,
      singingRangeLowest: r["singingRangeLowest"] || null,
      vocalRangeHighest: r["vocalRangeHighest"] || null,
      vocalRangeLowest: r["vocalRangeLowest"] || null,
      score,
      performedAt: parseDateTime(r["scoringDateTime"]),
    };

    try {
      await prisma.scoringRecord.upsert({
        where: { scoringAiId: id },
        update: row,
        create: { scoringAiId: id, ...row },
      });
      imported++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`行${i + 1}: ${msg}`);
      if (errors.length >= 5) break;
    }
  }

  return NextResponse.json({
    imported,
    skipped,
    total: lines.length - 1,
    ...(errors.length > 0 && { errors: errors.slice(0, 3) }),
  });
}
