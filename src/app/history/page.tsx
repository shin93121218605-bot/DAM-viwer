"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Record {
  scoringAiId: string;
  dContentsName: string;
  dArtistName: string;
  score: number | null;
  performedAt: string;
  requestNo: string;
}

export default function HistoryPage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");
  const [inputQ, setInputQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setSelected(new Set());
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (q) params.set("q", q);
    fetch(`/api/records?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setRecords(d.records ?? []);
        setTotal(d.total ?? 0);
        setTotalPages(d.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [page, q]);

  useEffect(() => { load(); }, [load]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === records.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(records.map((r) => r.scoringAiId)));
    }
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">採点履歴</h1>
          <p className="text-sm text-gray-500">{total.toLocaleString()} 件</p>
        </div>

        {/* Delete button */}
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

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={inputQ}
          onChange={(e) => setInputQ(e.target.value)}
          placeholder="曲名・アーティストで絞り込み"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold rounded-lg transition-colors"
        >
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

      {/* Delete result */}
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
            <table className="min-w-full divide-y divide-gray-200">
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
                  {["日付", "曲名", "スコア"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
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
                    <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(r.performedAt).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/songs/${r.requestNo}`}
                        className="text-sm font-medium text-gray-800 hover:text-pink-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {r.dContentsName}
                      </Link>
                      <p className="text-xs text-gray-400">{r.dArtistName}</p>
                    </td>
                    <td className="px-4 py-2 text-sm font-semibold text-pink-600 whitespace-nowrap">
                      {r.score != null ? r.score.toFixed(3) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
