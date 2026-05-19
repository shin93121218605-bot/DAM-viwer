export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "30", 10));
  const q = searchParams.get("q")?.trim() ?? "";

  const where = q
    ? {
        OR: [
          { dContentsName: { contains: q } },
          { dArtistName: { contains: q } },
        ],
      }
    : undefined;

  const [records, total] = await Promise.all([
    prisma.scoringRecord.findMany({
      where,
      orderBy: { performedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        scoringAiId: true,
        dContentsName: true,
        dArtistName: true,
        score: true,
        radarChartPitch: true,
        radarChartStability: true,
        radarChartExpressive: true,
        radarChartVibratoLongtone: true,
        radarChartRhythm: true,
        performedAt: true,
        requestNo: true,
      },
    }),
    prisma.scoringRecord.count({ where }),
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

export async function DELETE(req: NextRequest) {
  const { ids } = (await req.json()) as { ids: string[] };
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }
  const { count } = await prisma.scoringRecord.deleteMany({
    where: { scoringAiId: { in: ids } },
  });
  return NextResponse.json({ deleted: count });
}
