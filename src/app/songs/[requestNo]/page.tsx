export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import ScoreTrendChart from "@/components/charts/ScoreTrendChart";
import RadarScoreChart from "@/components/charts/RadarScoreChart";

export default async function SongDetailPage({
  params,
}: {
  params: { requestNo: string };
}) {
  const requestNo = decodeURIComponent(params.requestNo);
  const records = await prisma.scoringRecord.findMany({
    where: { requestNo },
    orderBy: { performedAt: "asc" },
  });

  if (records.length === 0) notFound();

  const latest = records[records.length - 1];
  const bestScore = Math.max(...records.map((r) => r.score ?? 0)) || null;

  const best = {
    pitch: Math.max(...records.map((r) => r.radarChartPitch ?? 0)),
    stability: Math.max(...records.map((r) => r.radarChartStability ?? 0)),
    expressive: Math.max(...records.map((r) => r.radarChartExpressive ?? 0)),
    vibrato: Math.max(...records.map((r) => r.radarChartVibratoLongtone ?? 0)),
    rhythm: Math.max(...records.map((r) => r.radarChartRhythm ?? 0)),
  };

  const trendData = records.map((r) => ({
    date: new Date(r.performedAt).toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
    }),
    score: r.score,
    pitch: r.radarChartPitch,
    stability: r.radarChartStability,
    expressive: r.radarChartExpressive,
    vibrato: r.radarChartVibratoLongtone,
    rhythm: r.radarChartRhythm,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/songs" className="text-sm text-gray-400 hover:text-pink-500">
          ← 曲一覧
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <h1 className="text-xl font-bold text-gray-800">{latest.dContentsName}</h1>
        <p className="text-sm text-gray-500">{latest.dArtistName}</p>
        <div className="flex gap-6 mt-3 text-sm flex-wrap">
          <span className="text-blue-600 font-semibold">{records.length}回練習</span>
          {bestScore != null && (
            <span className="text-pink-600 font-semibold">
              最高点: {bestScore.toFixed(3)}
            </span>
          )}
          <span className="text-gray-500">
            最終: {new Date(latest.performedAt).toLocaleDateString("ja-JP")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">スコア推移</h2>
          <ScoreTrendChart data={trendData} bestScore={bestScore} />
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">採点項目（最高値）</h2>
          <RadarScoreChart
            series={[
              { values: best, label: "最高記録", color: "#f59e0b" },
              {
                values: {
                  pitch: latest.radarChartPitch,
                  stability: latest.radarChartStability,
                  expressive: latest.radarChartExpressive,
                  vibrato: latest.radarChartVibratoLongtone,
                  rhythm: latest.radarChartRhythm,
                },
                label: "最新",
                color: "#ec4899",
              },
            ]}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <h2 className="text-base font-semibold text-gray-700 p-5 pb-3">採点履歴</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["日付", "スコア", "音程", "安定性", "表現力", "ビブラート", "リズム"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[...records].reverse().map((r) => (
              <tr key={r.scoringAiId} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">
                  {new Date(r.performedAt).toLocaleDateString("ja-JP")}
                </td>
                <td className="px-4 py-2 text-sm font-semibold text-pink-600 whitespace-nowrap">
                  {r.score != null ? r.score.toFixed(3) : "-"}
                </td>
                {[
                  r.radarChartPitch,
                  r.radarChartStability,
                  r.radarChartExpressive,
                  r.radarChartVibratoLongtone,
                  r.radarChartRhythm,
                ].map((val, i) => (
                  <td key={i} className="px-4 py-2 text-sm text-gray-700">
                    {val != null ? val.toFixed(1) : "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
