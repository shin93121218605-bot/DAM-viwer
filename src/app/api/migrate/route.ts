export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST() {
  const results: string[] = [];

  // Add score column if missing
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "ScoringRecord" ADD COLUMN "score" REAL`);
    results.push("score column: added");
  } catch (e) {
    results.push(`score column: ${String(e).includes("duplicate") || String(e).includes("already") ? "already exists" : String(e)}`);
  }

  // Create unique index on scoringAiId if missing
  try {
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "ScoringRecord_scoringAiId_key" ON "ScoringRecord"("scoringAiId")`
    );
    results.push("unique index: created");
  } catch (e) {
    results.push(`unique index: ${String(e)}`);
  }

  return NextResponse.json({ ok: true, results });
}
