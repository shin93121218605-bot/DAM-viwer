"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface RecordRow {
  scoringAiId: string;
  dContentsName: string;
  dArtistName: string;
  score: number | null;
  radarChartPitch: number | null;
  radarChartStability: number | null;
  radarChartExpressive: number | null;
  radarChartVibratoLongtone: number | null;
  radarChartRhythm: number | null;
  aiSensitivityPoints: number | null;
  performedAt: string;
  requestNo: string;
}

type SortKey = "performedAt" | "score" | "radarChartPitch" | "radarChartStability" | "radarChartExpressive" | "radarChartVibratoLongtone" | "radarChartRhythm" | "aiSensitivityPoints";

const METRIC_COLS: { key: SortKey; label: string }[] = [
  { key: "score",                    label: "スコア" },
  { key: "radarChartPitch",          label: "音程" },
  { key: "radarChartStability",      label: "安定性" },
  { key: "radarChartExpressive",     label: "表現力" },
  { key: "radarChartVibratoLongtone",label: "ビブラート" },
  { key: "radarChartRhythm",         label: "リズム" },
  { key: "aiSensitivityPoints",      label: "AI感性" },
];

function fmtScore(v: number | null, decimals = 3) {
  return v != null ? v.toFixed(decimals) : "—";
}

function fmtMetric(v: number | null) {
  return v != null ? String(Math.round(v)) : "—";
}

export default function HistoryPage() {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");
  const [inputQ, setInputQ] = useState("");
  const [sort, setSort] = useState<SortKey>("performedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setSelected(new Set());
    const params = new URLSearchParams({
      page: String(page),
      limit: "30",
      sortBy: sort,
      sortDir,
    });
    if (q) params.set("q", q);
    fetch(`/api/records?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setRecords(d.records ?? []);
        setTotal(d.total ?? 0);
        setTotalPages(d.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [page, q, sort, sortDir]);

  useEffect(() => { load(); }, [load]);

  function toggleSort(key: SortKey) {
    if (sort === key) {
      setSortDir((d) => d === "desc" ? "asc" : "desc");
    } else {
      setSort(key);
      setSortDir("desc");
      setPage(1);
    }
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(selected.size === records.length ? new Set() : new Set(records.map((r) => r.scoringAiId)));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQ(inputQ);
  };

  const handleDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`選択中の ${selected.size} 件を削除しますか？\nこの操作は取り消せません。`)) return;
    setDeleting(true);
    setDeleteResult(null);
    try {
      const res = await fetch("/api/records", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      const json = await res.json();
      if (res.ok) {
        setDeleteResult(`✅ ${json.deleted} 件を削除しました`);
        load();
      } else {
        setDeleteResult(`❌ 削除失敗: ${json.error}`);
      }
    } catch (e) {
      setDeleteResult(`❌ ${String(e)}`);
    } finally {
      setDeleting(false);
    }
  };

  function Th({ colKey, label, right = true }: { colKey: SortKey; label: string; right?: boolean }) {
    const active = sort === colKey;
    return (
      <th
        onClick={() => toggleSort(colKey)}
        className={`px-3 py-3 text-xs font-medium uppercase tracking-wide cursor-pointer select-none whitespace-nowrap ${right ? "text-right" : "text-left"} ${active ? "text-pink-600" : "text-gray-500 hover:text-gray-800"}`}
      >
        {label} {active ? (sortDir === "asc" ? "↑" : "↓") : ""}
      </th>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">全曲分析</h1>
          <p className="text-sm text-gray-500">{total.toLocaleString()} 件</p>
        </div>
        {selected.size > 0 && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
          >
            🗑️ {selected.size} 件を削除
          </button>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={inputQ}
          onChange={(e) => setInputQ(e.target.value)}
          placeholder="曲名・アーティストで絞り込み"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
        <button type="submit" className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold rounded-lg transition-colors">
          検索
        </button>
        {q && (
          <button
            type="button"
            onClick={() => { setInputQ(""); setQ(""); setPage(1); }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg"
          >
            クリア
          </button>
        )}
      </form>

      {deleteResult && (
        <div className={`text-sm px-4 py-2 rounded-lg ${deleteResult.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {deleteResult}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">読み込み中...</p>
      ) : records.length === 0 ? (
        <p className="text-gray-400 text-sm">データなし</p>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.size === records.length && records.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4 accent-pink-500"
                    />
                  </th>
                  <Th colKey="performedAt" label="日付" right={false} />
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    曲名
                  </th>
                  {METRIC_COLS.map((c) => <Th key={c.key} colKey={c.key} label={c.label} />)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((r) => (
                  <tr
                    key={r.scoringAiId}
                    onClick={() => toggle(r.scoringAiId)}
                    className={`cursor-pointer transition-colors ${selected.has(r.scoringAiId) ? "bg-red-50" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(r.scoringAiId)}
                        onChange={() => toggle(r.scoringAiId)}
                        className="w-4 h-4 accent-pink-500"
                      />
                    </td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                      {new Date(r.performedAt).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-3 py-2 min-w-[120px]" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/records/${r.scoringAiId}`}
                        className="font-medium text-gray-800 hover:text-pink-600 block truncate max-w-[160px]"
                      >
                        {r.dContentsName}
                      </Link>
                      <p className="text-xs text-gray-400 truncate max-w-[160px]">{r.dArtistName}</p>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-pink-600 whitespace-nowrap">
                      {fmtScore(r.score)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700 whitespace-nowrap">
                      {fmtMetric(r.radarChartPitch)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700 whitespace-nowrap">
                      {fmtMetric(r.radarChartStability)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700 whitespace-nowrap">
                      {fmtMetric(r.radarChartExpressive)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700 whitespace-nowrap">
                      {fmtMetric(r.radarChartVibratoLongtone)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700 whitespace-nowrap">
                      {fmtMetric(r.radarChartRhythm)}
                    </td>
                    <td className="px-3 py-2 text-right text-purple-600 font-semibold whitespace-nowrap">
                      {fmtMetric(r.aiSensitivityPoints)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2 justify-center">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                前へ
              </button>
              <span className="text-sm text-gray-600">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                次へ
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
