import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/db";

export async function GET() {
  const cdmCardNo = await getSetting("cdmCardNo");
  const lastSyncedAt = await getSetting("lastSyncedAt");
  return NextResponse.json({ cdmCardNo, lastSyncedAt });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { cdmCardNo } = body;

  if (!cdmCardNo || typeof cdmCardNo !== "string") {
    return NextResponse.json(
      { error: "cdmCardNoが必要です" },
      { status: 400 }
    );
  }

  await setSetting("cdmCardNo", cdmCardNo.trim());
  return NextResponse.json({ ok: true });
}
