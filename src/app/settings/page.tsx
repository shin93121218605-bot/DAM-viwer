"use client";

import { useEffect, useState } from "react";
import SyncButton from "@/components/ui/SyncButton";

export default function SettingsPage() {
  const [cardNo, setCardNo] = useState("");
  const [saved, setSaved] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [migrateStatus, setMigrateStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [migrateResults, setMigrateResults] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.cdmCardNo) setCardNo(data.cdmCardNo);
        if (data.lastSyncedAt) setLastSyncedAt(data.lastSyncedAt);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setError("");
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cdmCardNo: cardNo }),
    });
    if (res.ok) {
      setSaved(true);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "保存に失敗しました");
    }
  }

  if (loading) return <p className="text-gray-500">読み込み中...</p>;

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">設定</h1>

      <section className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">CLUB DAM CARD ID</h2>
        <p className="text-sm text-gray-500">
          clubdam.com にログインし、ブラウザの開発者ツール（ネットワークタブ）で{" "}
          <code className="bg-gray-100 px-1 rounded">cdmCardNo</code>{" "}
          パラメータを確認してください。
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={cardNo}
            onChange={(e) => { setCardNo(e.target.value); setSaved(false); }}
            placeholder="例: 1234567890"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 transition-colors"
          >
            保存
          </button>
        </div>
        {saved && <p className="text-sm text-green-600">保存しました</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </section>

      <section className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">DBマイグレーション</h2>
        <p className="text-sm text-gray-500">
          アプリ更新後に新しいDB列を追加します。初回または更新後に一度だけ実行してください。
        </p>
        <button
          onClick={async () => {
            setMigrateStatus("running");
            setMigrateResults([]);
            try {
              const res = await fetch("/api/migrate", { method: "POST" });
              const data = await res.json();
              setMigrateResults(data.results ?? []);
              setMigrateStatus(data.ok ? "done" : "error");
            } catch {
              setMigrateStatus("error");
              setMigrateResults(["通信エラー"]);
            }
          }}
          disabled={migrateStatus === "running"}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {migrateStatus === "running" ? "実行中..." : "マイグレーション実行"}
        </button>
        {migrateStatus === "done" && (
          <p className="text-sm text-green-600">完了しました</p>
        )}
        {migrateStatus === "error" && (
          <p className="text-sm text-red-600">エラーが発生しました</p>
        )}
        {migrateResults.length > 0 && (
          <ul className="text-xs text-gray-500 space-y-0.5 font-mono bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
            {migrateResults.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">データ同期</h2>
        {lastSyncedAt && (
          <p className="text-sm text-gray-500">
            最終同期: {new Date(lastSyncedAt).toLocaleString("ja-JP")}
          </p>
        )}
        <SyncButton onComplete={() => {
          setLastSyncedAt(new Date().toISOString());
        }} />
        <p className="text-xs text-gray-400">
          DAMともの採点データ（最大200件/ページ）を取得してローカルDBに蓄積します。
        </p>
      </section>
    </div>
  );
}
