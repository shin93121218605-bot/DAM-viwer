export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import Link from "next/link";

const medalColor = (i: number) =>
  i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-700" : "text-gray-300";

async function getRankings() {
  const [topByCount, topByScore, monthlyCounts] = await Promise.all([
    // 練習回数ランキング（曲別集計）
    prisma.$queryRaw<{
      requestNo: string;
      dContentsName: string;
      dArtistName: string;
      playCount: number;
      bestScore: number | null;
    }[]>`
      SELECT requestNo, dContentsName, dArtistName,
        COUNT(*) as playCount, MAX(score) as bestScore
      FROM ScoringRecord
      GROUP BY requestNo
      ORDER BY playCount DESC
      LIMIT 10
    `,
    // 点数ランキング（個別レコード）
    prisma.$queryRaw<{
      scoringAiId: string;
      requestNo: string;
      dContentsName: string;
      dArtistName: string;
      score: number;
      performedAt: string;
    }[]>`
      SELECT scoringAiId, requestNo, dContentsName, dArtistName, score, performedAt
      FROM ScoringRecord
      WHERE score IS NOT NULL
      ORDER BY score DESC
      LIMIT 20
    `,
    // 月別
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
    topByScore: topByScore.map((s) => ({ ...s, score: Number(s.score) })),
    monthlyCounts: monthlyCounts.map((m) => ({ ...m, count: Number(m.count) })),
  };
}

export default async function RankingsPage() {
  const { topByCount, topByScore, monthlyCounts } = await getRankings();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">ランキング・統計</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 練習回数ランキング → 曲サマリーへ */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-1">練習回数ランキング</h2>
          <p className="text-xs text-gray-400 mb-4">タップで曲サマリーへ</p>
          {topByCount.length === 0 ? (
            <p className="text-sm text-gray-400">データなし</p>
          ) : (
            <ol className="space-y-1">
              {topByCount.map((song, i) => (
                <li key={song.requestNo}>
                  <Link
                    href={`/songs/${encodeURIComponent(song.requestNo)}`}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <span className={`w-6 text-center text-sm font-bold shrink-0 ${medalColor(i)}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate group-hover:text-pink-600">
                        {song.dContentsName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{song.dArtistName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-semibold text-blue-600 block">{song.playCount}回</span>
                      {song.bestScore != null && (
                        <span className="text-xs text-gray-400">最高 {song.bestScore.toFixed(3)}</span>
                      )}
                    </div>
                    <span className="text-gray-300 text-xs shrink-0">›</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* 点数ランキング → 個別結果へ */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-1">点数ランキング</h2>
          <p className="text-xs text-gray-400 mb-4">タップで個別結果へ（全時間・全曲）</p>
          {topByScore.length === 0 ? (
            <p className="text-sm text-gray-400">データなし</p>
          ) : (
            <ol className="space-y-1">
              {topByScore.map((rec, i) => (
                <li key={rec.scoringAiId}>
                  <Link
                    href={`/records/${rec.scoringAiId}`}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <span className={`w-6 text-center text-sm font-bold shrink-0 ${medalColor(i)}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate group-hover:text-pink-600">
                        {rec.dContentsName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {rec.dArtistName} · {new Date(rec.performedAt).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-pink-600 block">{rec.score.toFixed(3)}</span>
                    </div>
                    <span className="text-gray-300 text-xs shrink-0">›</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* 月別練習回数 */}
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
                    <div className="h-4 bg-pink-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-xs text-gray-600 text-right shrink-0">{m.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
