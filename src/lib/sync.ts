import { prisma, setSetting } from "@/lib/db";
import { fetchPage } from "@/lib/damtomo";
import type { DamtomoRecord } from "@/types/damtomo";

export interface SyncProgress {
  page: number;
  pageCount: number;
  recordsThisPage: number;
  totalFetched: number;
  done: boolean;
  error?: string;
}

export interface SyncResult {
  upserted: number;
  total: number;
  durationMs: number;
}

async function upsertRecords(records: DamtomoRecord[]): Promise<number> {
  let count = 0;
  await prisma.$transaction(
    records.map((r) =>
      prisma.scoringRecord.upsert({
        where: { scoringAiId: r.scoringAiId },
        update: {
          requestNo: r.requestNo,
          contentsName: r.contentsName,
          artistName: r.artistName,
          dContentsName: r.dContentsName,
          dArtistName: r.dArtistName,
          damserial: r.damserial,
          dataKind: r.dataKind,
          clubDamCardNo: r.clubDamCardNo,
          entryCount: r.entryCount,
          analysisReportCommentNo: r.analysisReportCommentNo,
          radarChartPitch: r.radarChartPitch,
          radarChartStability: r.radarChartStability,
          radarChartExpressive: r.radarChartExpressive,
          radarChartVibratoLongtone: r.radarChartVibratoLongtone,
          radarChartRhythm: r.radarChartRhythm,
          singingRangeHighest: r.singingRangeHighest,
          singingRangeLowest: r.singingRangeLowest,
          vocalRangeHighest: r.vocalRangeHighest,
          vocalRangeLowest: r.vocalRangeLowest,
          score: r.score,
          performedAt: r.performedAt,
        },
        create: {
          scoringAiId: r.scoringAiId,
          requestNo: r.requestNo,
          contentsName: r.contentsName,
          artistName: r.artistName,
          dContentsName: r.dContentsName,
          dArtistName: r.dArtistName,
          damserial: r.damserial,
          dataKind: r.dataKind,
          clubDamCardNo: r.clubDamCardNo,
          entryCount: r.entryCount,
          analysisReportCommentNo: r.analysisReportCommentNo,
          radarChartPitch: r.radarChartPitch,
          radarChartStability: r.radarChartStability,
          radarChartExpressive: r.radarChartExpressive,
          radarChartVibratoLongtone: r.radarChartVibratoLongtone,
          radarChartRhythm: r.radarChartRhythm,
          singingRangeHighest: r.singingRangeHighest,
          singingRangeLowest: r.singingRangeLowest,
          vocalRangeHighest: r.vocalRangeHighest,
          vocalRangeLowest: r.vocalRangeLowest,
          score: r.score,
          performedAt: r.performedAt,
        },
      })
    )
  );
  count += records.length;
  return count;
}

export async function* syncStream(
  cdmCardNo: string
): AsyncGenerator<SyncProgress> {
  const startedAt = Date.now();
  let page = 1;
  let totalFetched = 0;

  while (true) {
    let pageResponse;
    try {
      pageResponse = await fetchPage(cdmCardNo, page);
    } catch (err) {
      yield {
        page,
        pageCount: page,
        recordsThisPage: 0,
        totalFetched,
        done: true,
        error: err instanceof Error ? err.message : String(err),
      };
      return;
    }

    const { records, meta } = pageResponse;
    await upsertRecords(records);
    totalFetched += records.length;

    yield {
      page,
      pageCount: meta.pageCount || page,
      recordsThisPage: records.length,
      totalFetched,
      done: !meta.hasNext,
    };

    if (!meta.hasNext) break;

    page++;
    // Polite delay between pages
    await new Promise((r) => setTimeout(r, 300));
  }

  await setSetting("lastSyncedAt", new Date().toISOString());
  await setSetting("lastSyncedCardNo", cdmCardNo);
  void startedAt;
}
