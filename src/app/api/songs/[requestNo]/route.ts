import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { requestNo: string } }
) {
  const { requestNo } = params;

  const records = await prisma.scoringRecord.findMany({
    where: { requestNo },
    orderBy: { performedAt: "asc" },
  });

  if (records.length === 0) {
    return NextResponse.json({ error: "曲が見つかりません" }, { status: 404 });
  }

  return NextResponse.json({ records });
}
