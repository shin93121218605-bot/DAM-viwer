import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [totalRecords, uniqueSongsResult, recentRecords, topSongs, monthlyCounts] =
    await Promise.all([
      prisma.scoringRecord.count(),
      prisma.$queryRaw<{ cnt: number }[]>`
        SELECT COUNT(DISTINCT requestNo) as cnt FROM ScoringRecord
      `,
      prisma.scoringRecord.findMany({
        orderBy: { performedAt: "desc" },
        take: 10,
        select: {
          scoringAiId: true,
          dContentsName: true,
          dArtistName: true,
          radarChartPitch: true,
          radarChartStability: true,
          radarChartExpressive: true,
          radarChartVibratoLongtone: true,
          radarChartRhythm: true,
          performedAt: true,
          requestNo: true,
        },
      }),
      prisma.$queryRaw<{ requestNo: string; dContentsName: string; dArtistName: string; playCount: number }[]>`
        SELECT requestNo, dContentsName, dArtistName, COUNT(*) as playCount
        FROM ScoringRecord
        GROUP BY requestNo
        ORDER BY playCount DESC
        LIMIT 10
      `,
      prisma.$queryRaw<{ month: string; count: number }[]>`
        SELECT strftime('%Y-%m', performedAt) as month, COUNT(*) as count
        FROM ScoringRecord
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
      `,
    ]);

  const uniqueSongs = Number(uniqueSongsResult[0]?.cnt ?? 0);

  return NextResponse.json({
    totalRecords,
    uniqueSongs,
    recentRecords: recentRecords.map((r) => ({
      ...r,
      performedAt: r.performedAt.toISOString(),
    })),
    topSongs: topSongs.map((s) => ({ ...s, playCount: Number(s.playCount) })),
    monthlyCounts: monthlyCounts.map((m) => ({ ...m, count: Number(m.count) })),
  });
}
