import { prisma, getSetting } from "@/lib/db";
import Link from "next/link";

async function getStats() {
  const [totalRecords, uniqueSongsResult, recentRecords, topSongs, lastSyncedAt] =
    await Promise.all([
      prisma.scoringRecord.count(),
      prisma.$queryRaw<{ cnt: number }[]>`
        SELECT COUNT(DISTINCT requestNo) as cnt FROM ScoringRecord
      `,
      prisma.scoringRecord.findMany({
        orderBy: { performedAt: "desc" },
        take: 5,
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
        FROM ScoringRecord GROUP BY requestNo ORDER BY playCount DESC LIMIT 5
      `,
      getSetting("lastSyncedAt"),
    ]);

  return {
    totalRecords,
    uniqueSongs: Number(uniqueSongsResult[0]?.cnt ?? 0),
    recentRecords,
    topSongs: topSongs.map((s) => ({ ...s, playCount: Number(s.playCount) })),
    lastSyncedAt,
  };
}

function avgScore(record: {
  radarChartPitch: number | null;
  radarChartStability: number | null;
  radarChartExpressive: number | null;
  radarChartVibratoLongtone: number | null;
  radarChartRhythm: number | null;
}) {
  const vals = [
    record.radarChartPitch,
    record.radarChartStability,
    record.radarChartExpressive,
    record.radarChartVibratoLongtone,
    record.radarChartRhythm,
  ].filter((v): v is number => v != null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export default async function DashboardPage() {
  const { totalRecords, uniqueSongs, recentRecords, topSongs, lastSyncedAt } =
    await getStats();

  const noData = totalRecords === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
        {lastSyncedAt && (
          <p className="text-sm text-gray-500">
            最終同期: {new Date(lastSyncedAt).toLocaleString("ja-JP")}
          </p>
        )}
      </div>

      {noData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-700 font-medium mb-2">データがありません</p>
          <p className="text-yellow-600 text-sm mb-4">
            設定画面でCLUB DAM CARD IDを設定し、同期を実行してください。
          </p>
          <Link
            href="/settings"
            className="inline-block px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600"
          >
            設定へ
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "蓄積レコード", value: totalRecords.toLocaleString(), unit: "件", color: "pink" },
          { label: "曲数", value: uniqueSongs.toLocaleString(), unit: "曲", color: "blue" },
          { label: "DAMとも上限", value: "200", unit: "件", color: "gray" },
          { label: "超過保護", value: Math.max(0, totalRecords - 200).toLocaleString(), unit: "件", color: "green" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{stat.label}</p>
            <p className="mt-1">
              <span className="text-3xl font-bold text-gray-800">{stat.value}</span>
              <span className="text-sm text-gray-500 ml-1">{stat.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Records */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">直近の採点</h2>
          {recentRecords.length === 0 ? (
            <p className="text-sm text-gray-400">データなし</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentRecords.map((r) => {
                const avg = avgScore(r);
                return (
                  <li key={r.scoringAiId} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/songs/${r.requestNo}`}
                        className="text-sm font-medium text-gray-800 hover:text-pink-600 truncate block"
                      >
                        {r.dContentsName}
                      </Link>
                      <p className="text-xs text-gray-400 truncate">{r.dArtistName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {avg != null && (
                        <span className="text-sm font-semibold text-pink-600">
                          {avg.toFixed(1)}
                        </span>
                      )}
                      <p className="text-xs text-gray-400">
                        {new Date(r.performedAt).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/history" className="mt-3 block text-xs text-pink-500 hover:underline text-right">
            全履歴を見る →
          </Link>
        </div>

        {/* Top Songs */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">練習回数TOP5</h2>
          {topSongs.length === 0 ? (
            <p className="text-sm text-gray-400">データなし</p>
          ) : (
            <ul className="space-y-2">
              {topSongs.map((song, i) => (
                <li key={song.requestNo} className="flex items-center gap-3">
                  <span className="w-5 text-center text-sm font-bold text-gray-400">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/songs/${song.requestNo}`}
                      className="text-sm font-medium text-gray-800 hover:text-pink-600 block truncate"
                    >
                      {song.dContentsName}
                    </Link>
                    <p className="text-xs text-gray-400 truncate">{song.dArtistName}</p>
                  </div>
                  <span className="text-sm font-semibold text-blue-600 shrink-0">
                    {song.playCount}回
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/songs" className="mt-3 block text-xs text-pink-500 hover:underline text-right">
            曲一覧を見る →
          </Link>
        </div>
      </div>
    </div>
  );
}
