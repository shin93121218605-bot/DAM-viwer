import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.$queryRaw<
    {
      requestNo: string;
      dContentsName: string;
      dArtistName: string;
      playCount: number;
      bestScore: number | null;
      avgScore: number | null;
      lastPlayed: string | null;
      bestAiBonus: number | null;
      avgPitch: number | null;
      avgStability: number | null;
      avgExpressive: number | null;
      avgVibrato: number | null;
      avgRhythm: number | null;
      avgAiSensitivity: number | null;
    }[]
  >`
    SELECT
      requestNo,
      dContentsName,
      dArtistName,
      COUNT(*) as playCount,
      MAX(score) as bestScore,
      AVG(score) as avgScore,
      MAX(performedAt) as lastPlayed,
      MAX(aiSensitivityBonus) as bestAiBonus,
      AVG(radarChartPitch) as avgPitch,
      AVG(radarChartStability) as avgStability,
      AVG(radarChartExpressive) as avgExpressive,
      AVG(radarChartVibratoLongtone) as avgVibrato,
      AVG(radarChartRhythm) as avgRhythm,
      AVG(aiSensitivityPoints) as avgAiSensitivity
    FROM ScoringRecord
    GROUP BY requestNo
    ORDER BY playCount DESC
  `;

  const n = (v: number | null) => (v != null ? Number(v) : null);

  const songs = rows.map((r) => ({
    ...r,
    playCount: Number(r.playCount),
    bestScore: n(r.bestScore),
    avgScore: n(r.avgScore),
    bestAiBonus: n(r.bestAiBonus),
    avgPitch: n(r.avgPitch),
    avgStability: n(r.avgStability),
    avgExpressive: n(r.avgExpressive),
    avgVibrato: n(r.avgVibrato),
    avgRhythm: n(r.avgRhythm),
    avgAiSensitivity: n(r.avgAiSensitivity),
  }));

  return NextResponse.json({ songs });
}
