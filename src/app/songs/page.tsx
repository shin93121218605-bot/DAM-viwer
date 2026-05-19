"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SongRow {
  requestNo: string;
  dContentsName: string;
  dArtistName: string;
  playCount: number;
  bestScore: number | null;
  avgScore: number | null;
  lastPlayed: string | null;
  bestAiBonus: number | null;
  avgPitch: number | null;
  avgStability: number | null;
  avgExpressive: number | null;
  avgVibrato: number | null;
  avgRhythm: number | null;
  avgAiSensitivity: number | null;
}

type SortKey = keyof Omit<SongRow, "requestNo" | "dContentsName" | "dArtistName">;

const COLS: { key: SortKey; label: string; fmt: (v: SongRow) => string }[] = [
  { key: "playCount",      label: "練習回数",    fmt: (s) => `${s.playCount}回` },
  { key: "bestScore",      label: "最高点",      fmt: (s) => s.bestScore != null ? s.bestScore.toFixed(3) : "—" },
  { key: "avgScore",       label: "平均点",      fmt: (s) => s.avgScore != null ? s.avgScore.toFixed(3) : "—" },
  { key: "avgPitch",       label: "音程(avg)",   fmt: (s) => s.avgPitch != null ? s.avgPitch.toFixed(1) : "—" },
  { key: "avgStability",   label: "安定(avg)",   fmt: (s) => s.avgStability != null ? s.avgStability.toFixed(1) : "—" },
  { key: "avgExpressive",  label: "表現(avg)",   fmt: (s) => s.avgExpressive != null ? s.avgExpressive.toFixed(1) : "—" },
  { key: "avgVibrato",     label: "VB(avg)",     fmt: (s) => s.avgVibrato != null ? s.avgVibrato.toFixed(1) : "—" },
  { key: "avgRhythm",      label: "リズム(avg)", fmt: (s) => s.avgRhythm != null ? s.avgRhythm.toFixed(1) : "—" },
  { key: "avgAiSensitivity", label: "AI感性(avg)", fmt: (s) => s.avgAiSensitivity != null ? s.avgAiSensitivity.toFixed(1) : "—" },
  { key: "lastPlayed",     label: "最終練習",    fmt: (s) => s.lastPlayed ? new Date(s.lastPlayed).toLocaleDateString("ja-JP") : "—" },
];

function numVal(s: SongRow, key: SortKey): number {
  if (key === "lastPlayed") return s.lastPlayed ? new Date(s.lastPlayed).getTime() : 0;
  const v = s[key];
  return typeof v === "number" ? v : -Infinity;
}

export default function SongsPage() {
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("lastPlayed");
  const [asc, setAsc] = useState(false);

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
      const diff = numVal(a, sort) - numVal(b, sort);
      return asc ? diff : -diff;
    });

  function toggleSort(key: SortKey) {
    if (sort === key) setAsc((p) => !p);
    else { setSort(key); setAsc(false); }
  }

  function Th({ colKey, label }: { colKey: SortKey; label: string }) {
    const active = sort === colKey;
    return (
      <th
        onClick={() => toggleSort(colKey)}
        className={`px-3 py-3 text-xs font-medium uppercase tracking-wide cursor-pointer select-none whitespace-nowrap text-right ${active ? "text-pink-600" : "text-gray-500 hover:text-gray-800"}`}
      >
        {label} {active ? (asc ? "↑" : "↓") : ""}
      </th>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-800">曲別分析</h1>
        {!loading && <span className="text-sm text-gray-500">{filtered.length} 曲</span>}
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
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 min-w-[130px]">
                  曲名
                </th>
                {COLS.map((c) => <Th key={c.key} colKey={c.key} label={c.label} />)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((song) => (
                <tr key={song.requestNo} className="hover:bg-gray-50">
                  <td className="px-3 py-2 sticky left-0 bg-white hover:bg-gray-50 min-w-[130px]">
                    <Link
                      href={`/songs/${encodeURIComponent(song.requestNo)}`}
                      className="font-medium text-gray-800 hover:text-pink-600 block truncate max-w-[200px]"
                    >
                      {song.dContentsName}
                    </Link>
                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{song.dArtistName}</p>
                  </td>
                  {COLS.map((c) => (
                    <td key={c.key} className={`px-3 py-2 whitespace-nowrap text-right ${
                      c.key === "playCount" ? "text-blue-600 font-semibold" :
                      c.key === "bestScore" || c.key === "avgScore" ? "text-pink-600 font-semibold" :
                      c.key === "avgAiSensitivity" ? "text-purple-600 font-semibold" :
                      "text-gray-700"
                    }`}>
                      {c.fmt(song)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
