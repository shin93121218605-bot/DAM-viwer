export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import RadarScoreChart from "@/components/charts/RadarScoreChart";

export default async function RecordDetailPage({
  params,
}: {
  params: { scoringAiId: string };
}) {
  const record = await prisma.scoringRecord.findUnique({
    where: { scoringAiId: params.scoringAiId },
  });

  if (!record) notFound();

  const hasRadar =
    record.radarChartPitch != null ||
    record.radarChartStability != null ||
    record.radarChartExpressive != null ||
    record.radarChartVibratoLongtone != null ||
    record.radarChartRhythm != null;

  const radarValues = {
    pitch: record.radarChartPitch,
    stability: record.radarChartStability,
    expressive: record.radarChartExpressive,
    vibrato: record.radarChartVibratoLongtone,
    rhythm: record.radarChartRhythm,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/rankings" className="text-sm text-gray-400 hover:text-pink-500">
          ← ランキング
        </Link>
        <Link
          href={`/songs/${encodeURIComponent(record.requestNo)}`}
          className="text-sm text-pink-500 hover:underline ml-auto"
        >
          同じ曲の履歴 →
        </Link>
      </div>

      {/* Main info card */}
      <div className="bg-white rounded-xl shadow p-5">
        <h1 className="text-xl font-bold text-gray-800">{record.dContentsName}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{record.dArtistName}</p>
        <div className="mt-4 flex flex-wrap gap-6 items-end">
          {record.score != null && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">スコア</p>
              <p className="text-4xl font-bold text-pink-600">{record.score.toFixed(3)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">採点日</p>
            <p className="text-lg font-semibold text-gray-700">
              {new Date(record.performedAt).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-sm text-gray-400">
              {new Date(record.performedAt).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar chart */}
        {hasRadar && (
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-base font-semibold text-gray-700 mb-4">採点項目</h2>
            <RadarScoreChart best={radarValues} latest={radarValues} />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { label: "音程", value: record.radarChartPitch },
                { label: "安定性", value: record.radarChartStability },
                { label: "表現力", value: record.radarChartExpressive },
                { label: "ビブラート", value: record.radarChartVibratoLongtone },
                { label: "リズム", value: record.radarChartRhythm },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {value != null ? value.toFixed(1) : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="bg-white rounded-xl shadow p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-700">詳細情報</h2>
          <dl className="space-y-3">
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">採点ID</dt>
              <dd className="text-gray-700 font-mono text-xs break-all text-right max-w-[60%]">
                {record.scoringAiId}
              </dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">リクエストNo</dt>
              <dd className="text-gray-700 font-mono">{record.requestNo}</dd>
            </div>
            {record.singingRangeLowest && record.singingRangeHighest && (
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">歌唱音域</dt>
                <dd className="text-gray-700">
                  {record.singingRangeLowest} — {record.singingRangeHighest}
                </dd>
              </div>
            )}
            {record.vocalRangeLowest && record.vocalRangeHighest && (
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">声域</dt>
                <dd className="text-gray-700">
                  {record.vocalRangeLowest} — {record.vocalRangeHighest}
                </dd>
              </div>
            )}
            {record.entryCount != null && (
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">通算回数</dt>
                <dd className="text-gray-700">{record.entryCount}回</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
