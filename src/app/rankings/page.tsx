export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";

async function getRankings() {
  const [topByCount, monthlyCounts] = await Promise.all([
    prisma.$queryRaw<{
      requestNo: string;
      dContentsName: string;
      dArtistName: string;
      playCount: number;
      bestScore: number | null;
    }[]>`
      SELECT
        requestNo, dContentsName, dArtistName,
        COUNT(*) as playCount,
        MAX(score) as bestScore
      FROM ScoringRecord
      GROUP BY requestNo
      ORDER BY playCount DESC
      LIMIT 20
    `,
    prisma.$queryRaw<{ month: string; count: number }[]>`
      SELECT strftime('%Y-%m', performedAt) as month, COUNT(*) as count
      FROM ScoringRecord GROUP BY month ORDER BY month DESC LIMIT 12
    `,
  ]);

  return {
    topByCount: topByCount.map((s) => ({
      ...s,
      playCount: Number(s.playCount),
      bestScore: s.bestScore != null ? Number(s.bestScore) : null,
    })),
    monthlyCounts: monthlyCounts.map((m) => ({ ...m, count: Number(m.count) })),
  };
}

export default async function RankingsPage() {
  const { topByCount, monthlyCounts } = await getRankings();

  const topByScore = [...topByCount]
    .filter((s) => s.bestScore != null)
    .sort((a, b) => (b.bestScore ?? 0) - (a.bestScore ?? 0))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">ランキング・統計</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most played */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            練習回数ランキング
          </h2>
          {topByCount.length === 0 ? (
            <p className="text-sm text-gray-400">データなし</p>
          ) : (
            <ol className="space-y-2">
              {topByCount.slice(0, 10).map((song, i) => (
                <li key={song.requestNo} className="flex items-center gap-3">
                  <span
                    className={`w-6 text-center text-sm font-bold ${
                      i === 0
                        ? "text-yellow-500"
                        : i === 1
                        ? "text-gray-400"
                        : i === 2
                        ? "text-amber-700"
                        : "text-gray-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {song.dContentsName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{song.dArtistName}</p>
                  </div>
                  <span className="text-sm font-semibold text-blue-600 shrink-0">
                    {song.playCount}回
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Best score */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            最高スコアランキング
          </h2>
          {topByScore.length === 0 ? (
            <p className="text-sm text-gray-400">データなし</p>
          ) : (
            <ol className="space-y-2">
              {topByScore.map((song, i) => (
                <li key={song.requestNo} className="flex items-center gap-3">
                  <span
                    className={`w-6 text-center text-sm font-bold ${
                      i === 0
                        ? "text-yellow-500"
                        : i === 1
                        ? "text-gray-400"
                        : i === 2
                        ? "text-amber-700"
                        : "text-gray-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {song.dContentsName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{song.dArtistName}</p>
                  </div>
                  <span className="text-sm font-semibold text-pink-600 shrink-0">
                    {song.bestScore!.toFixed(3)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Monthly activity */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-4">月別練習回数</h2>
        {monthlyCounts.length === 0 ? (
          <p className="text-sm text-gray-400">データなし</p>
        ) : (
          <div className="space-y-2">
            {[...monthlyCounts].reverse().map((m) => {
              const max = Math.max(...monthlyCounts.map((x) => x.count));
              const pct = max > 0 ? (m.count / max) * 100 : 0;
              return (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="w-16 text-xs text-gray-500 shrink-0">{m.month}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-4 bg-pink-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-xs text-gray-600 text-right shrink-0">
                    {m.count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
