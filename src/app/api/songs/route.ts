import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const rows = await prisma.$queryRaw<
    {
      requestNo: string;
      dContentsName: string;
      dArtistName: string;
      playCount: number;
      bestPitch: number | null;
      bestStability: number | null;
      bestExpressive: number | null;
      bestVibrato: number | null;
      bestRhythm: number | null;
      lastPlayed: string | null;
    }[]
  >`
    SELECT
      requestNo,
      dContentsName,
      dArtistName,
      COUNT(*) as playCount,
      MAX(radarChartPitch) as bestPitch,
      MAX(radarChartStability) as bestStability,
      MAX(radarChartExpressive) as bestExpressive,
      MAX(radarChartVibratoLongtone) as bestVibrato,
      MAX(radarChartRhythm) as bestRhythm,
      MAX(performedAt) as lastPlayed
    FROM ScoringRecord
    GROUP BY requestNo
    ORDER BY playCount DESC
  `;

  const songs = rows.map((r) => ({
    ...r,
    playCount: Number(r.playCount),
  }));

  return NextResponse.json({ songs });
}
