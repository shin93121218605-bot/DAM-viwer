export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type SortDir = "asc" | "desc";

const ORDER_MAP: Record<string, object> = {
  performedAt:              (dir: SortDir) => ({ performedAt: dir }),
  score:                    (dir: SortDir) => ({ score: dir }),
  radarChartPitch:          (dir: SortDir) => ({ radarChartPitch: dir }),
  radarChartStability:      (dir: SortDir) => ({ radarChartStability: dir }),
  radarChartExpressive:     (dir: SortDir) => ({ radarChartExpressive: dir }),
  radarChartVibratoLongtone:(dir: SortDir) => ({ radarChartVibratoLongtone: dir }),
  radarChartRhythm:         (dir: SortDir) => ({ radarChartRhythm: dir }),
  aiSensitivityPoints:      (dir: SortDir) => ({ aiSensitivityPoints: dir }),
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "30", 10));
  const q = searchParams.get("q")?.trim() ?? "";
  const sortBy = searchParams.get("sortBy") ?? "performedAt";
  const sortDir: SortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

  const orderByFn = ORDER_MAP[sortBy] ?? ORDER_MAP["performedAt"];
  const orderBy = (orderByFn as (d: SortDir) => object)(sortDir);

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
      orderBy,
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
        aiSensitivityPoints: true,
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
