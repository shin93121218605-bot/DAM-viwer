export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const migrations: { name: string; sql: string }[] = [
  { name: "score", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "score" REAL` },
  { name: "lastPerformKey", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "lastPerformKey" INTEGER` },
  { name: "intonation", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "intonation" INTEGER` },
  { name: "kobushiCount", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "kobushiCount" INTEGER` },
  { name: "shakuriCount", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "shakuriCount" INTEGER` },
  { name: "fallCount", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "fallCount" INTEGER` },
  { name: "timing", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "timing" INTEGER` },
  { name: "longtoneSkill", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "longtoneSkill" INTEGER` },
  { name: "vibratoSkill", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "vibratoSkill" INTEGER` },
  { name: "vibratoType", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "vibratoType" INTEGER` },
  { name: "vibratoTotalSecond", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "vibratoTotalSecond" REAL` },
  { name: "vibratoCount", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "vibratoCount" INTEGER` },
  { name: "accentCount", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "accentCount" INTEGER` },
  { name: "aiSensitivityMeterAdd", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "aiSensitivityMeterAdd" INTEGER` },
  { name: "aiSensitivityMeterDeduct", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "aiSensitivityMeterDeduct" INTEGER` },
  { name: "aiSensitivityPoints", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "aiSensitivityPoints" INTEGER` },
  { name: "aiSensitivityBonus", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "aiSensitivityBonus" REAL` },
  { name: "nationalAverageTotalPoints", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "nationalAverageTotalPoints" REAL` },
  { name: "nationalAveragePitch", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "nationalAveragePitch" REAL` },
  { name: "nationalAverageStability", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "nationalAverageStability" REAL` },
  { name: "nationalAverageExpression", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "nationalAverageExpression" REAL` },
  { name: "nationalAverageVibratoAndLongtone", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "nationalAverageVibratoAndLongtone" REAL` },
  { name: "nationalAverageRhythm", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "nationalAverageRhythm" REAL` },
  { name: "maxTotalPoints", sql: `ALTER TABLE "ScoringRecord" ADD COLUMN "maxTotalPoints" REAL` },
];

export async function POST() {
  const results: string[] = [];

  for (const { name, sql } of migrations) {
    try {
      await prisma.$executeRawUnsafe(sql);
      results.push(`${name}: added`);
    } catch (e) {
      const msg = String(e);
      results.push(`${name}: ${msg.includes("duplicate") || msg.includes("already") ? "already exists" : msg.slice(0, 60)}`);
    }
  }

  try {
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "ScoringRecord_scoringAiId_key" ON "ScoringRecord"("scoringAiId")`
    );
    results.push("unique index: ok");
  } catch (e) {
    results.push(`unique index: ${String(e).slice(0, 60)}`);
  }

  return NextResponse.json({ ok: true, results });
}
