"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SongRow {
  requestNo: string;
  dContentsName: string;
  dArtistName: string;
  playCount: number;
  bestScore: number | null;
  lastPlayed: string | null;
  bestAiBonus: number | null;
}

type SortKey = "playCount" | "lastPlayed" | "bestScore" | "bestAiBonus";

export default function SongsPage() {
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("lastPlayed");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetch("/api/songs")
      .then((r) => r.json())
      .then((d) => setSongs(d.songs ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = songs
    .filter(
      (s) =>
        s.dContentsName.toLowerCase().includes(query.toLowerCase()) ||
        s.dArtistName.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => {
      let va: number, vb: number;
      if (sort === "playCount") {
        va = a.playCount;
        vb = b.playCount;
      } else if (sort === "lastPlayed") {
        va = a.lastPlayed ? new Date(a.lastPlayed).getTime() : 0;
        vb = b.lastPlayed ? new Date(b.lastPlayed).getTime() : 0;
      } else if (sort === "bestScore") {
        va = a.bestScore ?? -1;
        vb = b.bestScore ?? -1;
      } else {
        va = a.bestAiBonus ?? -1;
        vb = b.bestAiBonus ?? -1;
      }
      return sortAsc ? va - vb : vb - va;
    });

  function toggleSort(key: SortKey) {
    if (sort === key) setSortAsc((p) => !p);
    else { setSort(key); setSortAsc(false); }
  }

  const th = (key: SortKey, label: string) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-800 select-none whitespace-nowrap"
      onClick={() => toggleSort(key)}
    >
      {label} {sort === key ? (sortAsc ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-800">曲一覧</h1>
        {!loading && (
          <span className="text-sm text-gray-500">{filtered.length} 曲</span>
        )}
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="曲名・アーティスト名で検索..."
        className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
      />

      {loading ? (
        <p className="text-gray-400 text-sm">読み込み中...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">データがありません</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  曲名
                </th>
                {th("bestScore", "最高点")}
                {th("bestAiBonus", "AI感性")}
                {th("playCount", "練習回数")}
                {th("lastPlayed", "最終練習")}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((song) => (
                <tr key={song.requestNo} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/songs/${encodeURIComponent(song.requestNo)}`}
                      className="font-medium text-gray-800 hover:text-pink-600"
                    >
                      {song.dContentsName}
                    </Link>
                    <p className="text-xs text-gray-400">{song.dArtistName}</p>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-pink-600 whitespace-nowrap">
                    {song.bestScore != null ? song.bestScore.toFixed(3) : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-purple-600 whitespace-nowrap">
                    {song.bestAiBonus != null ? `+${song.bestAiBonus.toFixed(3)}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-blue-600 font-semibold whitespace-nowrap">
                    {song.playCount}回
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {song.lastPlayed
                      ? new Date(song.lastPlayed).toLocaleDateString("ja-JP")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
