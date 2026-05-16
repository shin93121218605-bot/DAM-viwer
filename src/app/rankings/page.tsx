export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";

async function getRankings() {
  const [topByCount, monthlyCounts] = await Promise.all([
    prisma.$queryRaw<{
      requestNo: string;
      dContentsName: string;
      dArtistName: string;
      playCount: number;
      bestPitch: number | null;
      bestStability: number | null;
      bestExpressive: number | null;
      bestVibrato: number | null;
      bestRhythm: number | null;
    }[]>`
      SELECT
        requestNo, dContentsName, dArtistName,
        COUNT(*) as playCount,
        MAX(radarChartPitch) as bestPitch,
        MAX(radarChartStability) as bestStability,
        MAX(radarChartExpressive) as bestExpressive,
        MAX(radarChartVibratoLongtone) as bestVibrato,
        MAX(radarChartRhythm) as bestRhythm
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
    topByCount: topByCount.map((s) => ({ ...s, playCount: Number(s.playCount) })),
    monthlyCounts: monthlyCounts.map((m) => ({ ...m, count: Number(m.count) })),
  };
}

function bestAvg(song: {
  bestPitch: number | null;
  bestStability: number | null;
  bestExpressive: number | null;
  bestVibrato: number | null;
  bestRhythm: number | null;
}): number | null {
  const vals = [
    song.bestPitch,
    song.bestStability,
    song.bestExpressive,
    song.bestVibrato,
    song.bestRhythm,
  ].filter((v): v is number => v != null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export default async function RankingsPage() {
  const { topByCount, monthlyCounts } = await getRankings();

  const topByScore = [...topByCount]
    .map((s) => ({ ...s, avg: bestAvg(s) }))
    .filter((s) => s.avg != null)
    .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0))
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
                    {song.avg!.toFixed(1)}
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
