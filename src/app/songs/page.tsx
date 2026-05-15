"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SongRow {
  requestNo: string;
  dContentsName: string;
  dArtistName: string;
  playCount: number;
  bestPitch: number | null;
  bestStability: number | null;
  bestExpressive: number | null;
  bestVibrato: number | null;
  bestRhythm: number | null;
  lastPlayed: string | null;
}

type SortKey = "playCount" | "lastPlayed" | "bestAvg";

function calcAvg(song: SongRow): number | null {
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

export default function SongsPage() {
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("playCount");
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
      } else {
        va = calcAvg(a) ?? -1;
        vb = calcAvg(b) ?? -1;
      }
      return sortAsc ? va - vb : vb - va;
    });

  function toggleSort(key: SortKey) {
    if (sort === key) setSortAsc((p) => !p);
    else { setSort(key); setSortAsc(false); }
  }

  const th = (key: SortKey, label: string) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-800 select-none"
      onClick={() => toggleSort(key)}
    >
      {label} {sort === key ? (sortAsc ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">曲一覧</h1>

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
                {th("playCount", "練習回数")}
                {th("bestAvg", "最高平均")}
                {th("lastPlayed", "最終練習")}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((song) => {
                const avg = calcAvg(song);
                return (
                  <tr key={song.requestNo} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/songs/${song.requestNo}`}
                        className="font-medium text-gray-800 hover:text-pink-600"
                      >
                        {song.dContentsName}
                      </Link>
                      <p className="text-xs text-gray-400">{song.dArtistName}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-blue-600 font-semibold">
                      {song.playCount}回
                    </td>
                    <td className="px-4 py-3 text-sm text-pink-600 font-semibold">
                      {avg != null ? avg.toFixed(1) : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {song.lastPlayed
                        ? new Date(song.lastPlayed).toLocaleDateString("ja-JP")
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="px-4 py-2 text-xs text-gray-400">{filtered.length} 曲</p>
        </div>
      )}
    </div>
  );
}
