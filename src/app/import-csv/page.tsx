"use client";
import { useRef, useState } from "react";

type Result = {
  imported: number;
  skipped: number;
  total: number;
  errors?: string[];
};

export default function ImportCsvPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const handleFile = (f: File) => {
    if (!f.name.endsWith(".csv")) {
      setError("CSVファイルを選択してください");
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const text = await file.text();
      const res = await fetch("/api/import-csv", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: text,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "インポートエラー");
      } else {
        setResult(json);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: "560px", margin: "0 auto", padding: "24px 16px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "6px" }}>📂 CSVインポート</h1>
      <p style={{ color: "#666", fontSize: "13px", marginBottom: "24px" }}>
        DAMとも採点データのCSVファイルを取り込みます。同じIDのデータは上書きされます。
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${drag ? "#667eea" : "#ccc"}`,
          borderRadius: "12px",
          padding: "40px 20px",
          textAlign: "center",
          cursor: "pointer",
          background: drag ? "#f0f4ff" : "#fafafa",
          transition: "all 0.2s",
          marginBottom: "16px",
        }}
      >
        <div style={{ fontSize: "40px", marginBottom: "10px" }}>📄</div>
        {file ? (
          <>
            <div style={{ fontWeight: "bold", fontSize: "15px", color: "#333" }}>{file.name}</div>
            <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
              {(file.size / 1024).toFixed(1)} KB
            </div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: "bold", fontSize: "15px", color: "#555" }}>
              CSVファイルをここにドロップ
            </div>
            <div style={{ fontSize: "13px", color: "#999", marginTop: "6px" }}>
              またはタップして選択
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {/* Import button */}
      <button
        onClick={handleImport}
        disabled={!file || loading}
        style={{
          width: "100%",
          padding: "14px",
          border: "none",
          borderRadius: "10px",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: file && !loading ? "pointer" : "not-allowed",
          background: file && !loading
            ? "linear-gradient(135deg, #667eea, #764ba2)"
            : "#ccc",
          color: "white",
          marginBottom: "20px",
          transition: "background 0.2s",
        }}
      >
        {loading ? "⏳ インポート中..." : "▶ インポート開始"}
      </button>

      {/* Error */}
      {error && (
        <div style={{
          background: "#ffebee", border: "1px solid #ef9a9a", borderRadius: "8px",
          padding: "12px 14px", color: "#c62828", fontSize: "14px", marginBottom: "16px",
        }}>
          ❌ {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{
          background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: "12px",
          padding: "20px", marginBottom: "16px",
        }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#2e7d32", marginBottom: "14px" }}>
            ✅ インポート完了！
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            {[
              { label: "取込件数", value: result.imported, color: "#1565c0" },
              { label: "スキップ", value: result.skipped, color: "#f57c00" },
              { label: "合計行数", value: result.total, color: "#555" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: "white", borderRadius: "8px", padding: "12px",
                textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,.1)",
              }}>
                <div style={{ fontSize: "11px", color: "#888" }}>{label}</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color }}>{value}</div>
              </div>
            ))}
          </div>
          {result.errors && result.errors.length > 0 && (
            <div style={{ marginTop: "12px", fontSize: "12px", color: "#c62828" }}>
              <b>エラー（最大3件）:</b>
              {result.errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}
        </div>
      )}

      {/* Format note */}
      <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "14px", fontSize: "13px", color: "#555" }}>
        <b>対応フォーマット:</b><br />
        DAMとも採点CSVの標準形式（scoringAiId, score, contentsName, artistName, scoringDateTime 等を含むもの）
      </div>
    </main>
  );
}
