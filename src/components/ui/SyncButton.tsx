"use client";

import { useState } from "react";

interface SyncProgress {
  page: number;
  pageCount: number;
  recordsThisPage: number;
  totalFetched: number;
  done: boolean;
  error?: string;
}

interface SyncButtonProps {
  onComplete?: () => void;
}

export default function SyncButton({ onComplete }: SyncButtonProps) {
  const [status, setStatus] = useState<"idle" | "syncing" | "done" | "error">(
    "idle"
  );
  const [progress, setProgress] = useState<SyncProgress | null>(null);

  async function handleSync() {
    setStatus("syncing");
    setProgress(null);

    try {
      const res = await fetch("/api/sync", { method: "POST" });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        for (const line of text.split("\n").filter(Boolean)) {
          try {
            const p: SyncProgress = JSON.parse(line);
            setProgress(p);
            if (p.done) {
              if (p.error) {
                setStatus("error");
              } else {
                setStatus("done");
                onComplete?.();
              }
            }
          } catch {
            // ignore malformed lines
          }
        }
      }
    } catch (err) {
      setProgress((prev) => ({
        ...(prev ?? { page: 0, pageCount: 0, recordsThisPage: 0, totalFetched: 0, done: true }),
        done: true,
        error: err instanceof Error ? err.message : String(err),
      }));
      setStatus("error");
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleSync}
        disabled={status === "syncing"}
        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
          status === "syncing"
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : status === "error"
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-pink-500 text-white hover:bg-pink-600"
        }`}
      >
        {status === "syncing"
          ? "同期中..."
          : status === "done"
          ? "同期完了 - 再同期"
          : status === "error"
          ? "エラー - 再試行"
          : "今すぐ同期"}
      </button>

      {status === "syncing" && progress && (
        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 bg-gray-200 rounded-full flex-1">
              <div
                className="h-2 bg-pink-500 rounded-full transition-all"
                style={{
                  width: `${
                    progress.pageCount > 0
                      ? (progress.page / progress.pageCount) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <span className="text-xs whitespace-nowrap">
              {progress.page} / {progress.pageCount} ページ
            </span>
          </div>
          <p>取得済み: {progress.totalFetched} 件</p>
        </div>
      )}

      {status === "done" && progress && (
        <p className="text-sm text-green-600">
          {progress.totalFetched} 件のデータを同期しました
        </p>
      )}

      {status === "error" && progress?.error && (
        <p className="text-sm text-red-600">エラー: {progress.error}</p>
      )}
    </div>
  );
}
