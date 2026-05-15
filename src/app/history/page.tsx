"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Record {
  scoringAiId: string;
  dContentsName: string;
  dArtistName: string;
  radarChartPitch: number | null;
  radarChartStability: number | null;
  radarChartExpressive: number | null;
  radarChartVibratoLongtone: number | null;
  radarChartRhythm: number | null;
  performedAt: string;
  requestNo: string;
}

const PAGE_SIZE = 30;

export default function HistoryPage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setRecords(d.recentRecords ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Fetch all records separately
  const [allRecords, setAllRecords] = useState<Record[]>([]);
  const [allLoaded, setAllLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/songs")
      .then((r) => r.json())
      .then(async (d) => {
        // Fetch history for all songs to build full list
        const songs = d.songs ?? [];
        const all: Record[] = [];
        for (const song of songs) {
          const res = await fetch(`/api/songs/${song.requestNo}`);
          if (res.ok) {
            const data = await res.json();
            all.push(...(data.records ?? []));
          }
        }
        all.sort(
          (a, b) =>
            new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
        );
        setAllRecords(all);
      })
      .finally(() => setAllLoaded(true));
  }, []);

  const displayRecords = allLoaded ? allRecords : records;
  const totalPages = Math.ceil(displayRecords.length / PAGE_SIZE);
  const paged = displayRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">採点履歴</h1>
      <p className="text-sm text-gray-500">
        {displayRecords.length} 件 {!allLoaded && "(読み込み中...)"}
      </p>

      {loading ? (
        <p className="text-gray-400 text-sm">読み込み中...</p>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["日付", "曲名", "音程", "安定性", "表現力", "ビブラート", "リズム"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.map((r) => (
                  <tr key={r.scoringAiId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(r.performedAt).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/songs/${r.requestNo}`}
                        className="text-sm font-medium text-gray-800 hover:text-pink-600"
                      >
                        {r.dContentsName}
                      </Link>
                      <p className="text-xs text-gray-400">{r.dArtistName}</p>
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

          {totalPages > 1 && (
            <div className="flex items-center gap-2 justify-center">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                前へ
              </button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
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
