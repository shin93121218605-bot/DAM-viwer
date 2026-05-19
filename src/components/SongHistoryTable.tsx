"use client";

import { useState } from "react";
import Link from "next/link";

export interface HistRec {
  scoringAiId: string;
  performedAt: string;
  score: number | null;
  radarChartPitch: number | null;
  radarChartStability: number | null;
  radarChartExpressive: number | null;
  radarChartVibratoLongtone: number | null;
  radarChartRhythm: number | null;
  aiSensitivityPoints: number | null;
}

type SortKey = keyof Omit<HistRec, "scoringAiId">;

const COLS: { key: SortKey; label: string }[] = [
  { key: "performedAt",              label: "日付" },
  { key: "score",                    label: "スコア" },
  { key: "radarChartPitch",          label: "音程" },
  { key: "radarChartStability",      label: "安定性" },
  { key: "radarChartExpressive",     label: "表現力" },
  { key: "radarChartVibratoLongtone",label: "ビブラート" },
  { key: "radarChartRhythm",         label: "リズム" },
  { key: "aiSensitivityPoints",      label: "AI感性" },
];

function sortVal(r: HistRec, key: SortKey): number | string {
  if (key === "performedAt") return r.performedAt;
  return r[key] ?? -Infinity;
}

export default function SongHistoryTable({ records }: { records: HistRec[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("performedAt");
  const [asc, setAsc] = useState(false);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setAsc((p) => !p);
    else { setSortKey(key); setAsc(key === "performedAt" ? false : false); }
  }

  const sorted = [...records].sort((a, b) => {
    const va = sortVal(a, sortKey);
    const vb = sortVal(b, sortKey);
    if (va === -Infinity && vb === -Infinity) return 0;
    if (va === -Infinity) return 1;
    if (vb === -Infinity) return -1;
    const diff = va < vb ? -1 : va > vb ? 1 : 0;
    return asc ? diff : -diff;
  });

  function Th({ col }: { col: (typeof COLS)[number] }) {
    const active = sortKey === col.key;
    const isScore = col.key === "score";
    return (
      <th
        onClick={() => toggleSort(col.key)}
        className={`px-3 py-2 text-xs font-medium uppercase tracking-wide cursor-pointer select-none whitespace-nowrap ${isScore ? "text-left" : "text-right"} ${active ? "text-pink-600" : "text-gray-500 hover:text-gray-800"}`}
      >
        {col.label} {active ? (asc ? "↑" : "↓") : ""}
      </th>
    );
  }

  function fmt(r: HistRec, key: SortKey): string {
    if (key === "performedAt") return new Date(r.performedAt).toLocaleDateString("ja-JP");
    if (key === "score") return r.score != null ? r.score.toFixed(3) : "—";
    const v = r[key] as number | null;
    return v != null ? String(Math.round(v)) : "—";
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {COLS.map((col) => <Th key={col.key} col={col} />)}
            <th className="px-3 py-2 text-xs font-medium text-gray-400 uppercase"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((r) => (
            <tr key={r.scoringAiId} className="hover:bg-gray-50">
              {COLS.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-2 whitespace-nowrap ${
                    col.key === "performedAt" ? "text-gray-500" :
                    col.key === "score" ? "font-semibold text-pink-600" :
                    col.key === "aiSensitivityPoints" ? "text-right text-purple-600 font-semibold" :
                    "text-right text-gray-700"
                  }`}
                >
                  {fmt(r, col.key)}
                </td>
              ))}
              <td className="px-3 py-2 text-right">
                <Link
                  href={`/records/${r.scoringAiId}`}
                  className="text-xs text-pink-400 hover:text-pink-600 whitespace-nowrap"
                >
                  詳細 ›
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
