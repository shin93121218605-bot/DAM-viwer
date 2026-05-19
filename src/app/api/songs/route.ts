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
      lastPlayed: string | null;
      bestAiBonus: number | null;
    }[]
  >`
    SELECT
      requestNo,
      dContentsName,
      dArtistName,
      COUNT(*) as playCount,
      MAX(score) as bestScore,
      MAX(performedAt) as lastPlayed,
      MAX(aiSensitivityBonus) as bestAiBonus
    FROM ScoringRecord
    GROUP BY requestNo
    ORDER BY playCount DESC
  `;

  const songs = rows.map((r) => ({
    ...r,
    playCount: Number(r.playCount),
    bestScore: r.bestScore != null ? Number(r.bestScore) : null,
    bestAiBonus: r.bestAiBonus != null ? Number(r.bestAiBonus) : null,
  }));

  return NextResponse.json({ songs });
}
