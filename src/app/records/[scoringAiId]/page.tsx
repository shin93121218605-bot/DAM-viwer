export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import RadarScoreChart from "@/components/charts/RadarScoreChart";

function fmtKey(k: number | null | undefined) {
  if (k == null) return null;
  if (k === 0) return "±0";
  return k > 0 ? `+${k}` : String(k);
}

function fmtNum(v: number | null | undefined, decimals = 1) {
  return v != null ? v.toFixed(decimals) : "—";
}

function fmtInt(v: number | null | undefined) {
  return v != null ? String(v) : "—";
}

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
    record.radarChartExpressive != null;

  const hasNational =
    record.nationalAveragePitch != null ||
    record.nationalAverageStability != null;

  const radarSeries = [];
  if (hasRadar) {
    radarSeries.push({
      values: {
        pitch: record.radarChartPitch,
        stability: record.radarChartStability,
        expressive: record.radarChartExpressive,
        vibrato: record.radarChartVibratoLongtone,
        rhythm: record.radarChartRhythm,
      },
      label: "この採点",
      color: "#ec4899",
    });
  }
  if (hasNational) {
    radarSeries.push({
      values: {
        pitch: record.nationalAveragePitch,
        stability: record.nationalAverageStability,
        expressive: record.nationalAverageExpression,
        vibrato: record.nationalAverageVibratoAndLongtone,
        rhythm: record.nationalAverageRhythm,
      },
      label: "全国平均",
      color: "#94a3b8",
    });
  }

  const keyStr = fmtKey(record.lastPerformKey);

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

      {/* Main info */}
      <div className="bg-white rounded-xl shadow p-5">
        <h1 className="text-xl font-bold text-gray-800">{record.dContentsName}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{record.dArtistName}</p>
        <div className="mt-4 flex flex-wrap gap-6 items-end">
          {record.score != null && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">スコア</p>
              <p className="text-4xl font-bold text-pink-600">{record.score.toFixed(3)}</p>
              {record.maxTotalPoints != null && (
                <p className="text-xs text-gray-400">
                  満点: {record.maxTotalPoints.toFixed(3)}
                </p>
              )}
            </div>
          )}
          {record.aiSensitivityBonus != null && (
            <div>
              <p className="text-xs text-gray-400">AI感性ボーナス</p>
              <p className="text-2xl font-bold text-purple-600">
                +{record.aiSensitivityBonus.toFixed(3)}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400">採点日</p>
            <p className="text-base font-semibold text-gray-700">
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
          {keyStr && (
            <div>
              <p className="text-xs text-gray-400">設定キー</p>
              <p className="text-base font-semibold text-gray-700">{keyStr}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar chart */}
        {radarSeries.length > 0 && (
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-base font-semibold text-gray-700 mb-1">採点項目</h2>
            {hasNational && (
              <p className="text-xs text-gray-400 mb-3">全国平均との比較</p>
            )}
            <RadarScoreChart series={radarSeries} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { label: "音程", mine: record.radarChartPitch, avg: record.nationalAveragePitch },
                { label: "安定性", mine: record.radarChartStability, avg: record.nationalAverageStability },
                { label: "表現力", mine: record.radarChartExpressive, avg: record.nationalAverageExpression },
                { label: "ビブラート", mine: record.radarChartVibratoLongtone, avg: record.nationalAverageVibratoAndLongtone },
                { label: "リズム", mine: record.radarChartRhythm, avg: record.nationalAverageRhythm },
              ].map(({ label, mine, avg }) => (
                <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-pink-600">
                      {fmtNum(mine)}
                    </span>
                    {avg != null && (
                      <span className="text-xs text-gray-400">全国 {fmtNum(avg)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed scoring */}
        <div className="bg-white rounded-xl shadow p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-700">採点詳細</h2>

          {/* AI感性 */}
          {(record.aiSensitivityMeterAdd != null || record.aiSensitivityPoints != null) && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">AI感性</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "AIメーター（＋）", value: fmtInt(record.aiSensitivityMeterAdd) },
                  { label: "AIメーター（ー）", value: fmtInt(record.aiSensitivityMeterDeduct) },
                  { label: "スコア-AI感性", value: fmtInt(record.aiSensitivityPoints) },
                  { label: "AI感性ボーナス", value: record.aiSensitivityBonus != null ? record.aiSensitivityBonus.toFixed(3) : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-purple-700">{label}</span>
                    <span className="text-sm font-semibold text-purple-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 技術スコア */}
          {(record.intonation != null || record.longtoneSkill != null) && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">技術スコア</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "スコア-抑揚", value: fmtInt(record.intonation) },
                  { label: "スコア-ロングトーン", value: fmtInt(record.longtoneSkill) },
                  { label: "スコア-ビブラート", value: fmtInt(record.vibratoSkill) },
                  { label: "リズム位置", value: fmtInt(record.timing) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-blue-700">{label}</span>
                    <span className="text-sm font-semibold text-blue-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ビブラート */}
          {record.vibratoType != null && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">ビブラート</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "ビブラートタイプ", value: fmtInt(record.vibratoType) },
                  { label: "ビブラート時間", value: fmtNum(record.vibratoTotalSecond) + "秒" },
                  { label: "回数-ビブラート", value: fmtInt(record.vibratoCount) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between bg-pink-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-pink-700">{label}</span>
                    <span className="text-sm font-semibold text-pink-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* カウント系 */}
          {record.kobushiCount != null && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">テクニック回数</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "回数-こぶし", value: fmtInt(record.kobushiCount) },
                  { label: "回数-しゃくり", value: fmtInt(record.shakuriCount) },
                  { label: "回数-フォール", value: fmtInt(record.fallCount) },
                  { label: "アクセント", value: fmtInt(record.accentCount) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-green-700">{label}</span>
                    <span className="text-sm font-semibold text-green-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 全国平均比較 */}
          {record.nationalAverageTotalPoints != null && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">全国平均</p>
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-600">全国平均-合計点</span>
                <span className="text-sm font-semibold text-gray-800">
                  {record.nationalAverageTotalPoints.toFixed(3)}
                </span>
              </div>
              {record.score != null && record.nationalAverageTotalPoints != null && (
                <p className="text-xs text-gray-500 mt-1 text-right">
                  全国差: {(record.score - record.nationalAverageTotalPoints) >= 0 ? "+" : ""}
                  {(record.score - record.nationalAverageTotalPoints).toFixed(3)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Metadata footer */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-3">基本情報</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-xs text-gray-400">採点ID</dt>
            <dd className="font-mono text-xs text-gray-600 break-all">{record.scoringAiId}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">リクエストNo</dt>
            <dd className="font-mono text-gray-700">{record.requestNo}</dd>
          </div>
          {record.singingRangeLowest && record.singingRangeHighest && (
            <div>
              <dt className="text-xs text-gray-400">歌唱音域</dt>
              <dd className="text-gray-700">{record.singingRangeLowest} — {record.singingRangeHighest}</dd>
            </div>
          )}
          {record.vocalRangeLowest && record.vocalRangeHighest && (
            <div>
              <dt className="text-xs text-gray-400">声域</dt>
              <dd className="text-gray-700">{record.vocalRangeLowest} — {record.vocalRangeHighest}</dd>
            </div>
          )}
          {record.entryCount != null && (
            <div>
              <dt className="text-xs text-gray-400">通算回数</dt>
              <dd className="text-gray-700">{record.entryCount}回</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
