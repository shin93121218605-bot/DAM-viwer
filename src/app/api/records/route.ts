import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "30", 10));

  const [records, total] = await Promise.all([
    prisma.scoringRecord.findMany({
      orderBy: { performedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
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
    prisma.scoringRecord.count(),
  ]);

  return NextResponse.json({
    records: records.map((r) => ({
      ...r,
      performedAt: r.performedAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
