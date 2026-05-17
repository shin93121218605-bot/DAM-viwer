"use client";
import { useState } from "react";

const DAM_URL =
  "https://www.clubdam.com/app/damtomo/scoring/GetScoringAiListXML.do";
const IMPORT_URL = "https://dam-viwer-febw.vercel.app/api/import-xml";

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
    setOk(true);
    setTimeout(() => setOk(false), 2000);
  };
  return (
    <div style={{ margin: "8px 0" }}>
      {label && <div style={{ fontSize: "11px", color: "#888", marginBottom: "3px" }}>{label}</div>}
      <div style={{ display: "flex", gap: "6px", alignItems: "stretch" }}>
        <code style={{
          flex: 1, background: "#f0f4ff", padding: "8px 10px", borderRadius: "6px",
          fontSize: "11px", wordBreak: "break-all", border: "1px solid #d0d8ff", lineHeight: 1.5,
        }}>
          {text}
        </code>
        <button onClick={copy} style={{
          padding: "0 14px", background: ok ? "#28a745" : "#667eea", color: "white",
          border: "none", borderRadius: "6px", fontSize: "14px", cursor: "pointer", flexShrink: 0,
        }}>
          {ok ? "✅" : "📋"}
        </button>
      </div>
    </div>
  );
}

const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#667eea",
  color: "white",
  borderRadius: "50%",
  width: "26px",
  height: "26px",
  fontSize: "13px",
  fontWeight: "bold",
  marginRight: "8px",
  flexShrink: 0,
};

function Tag({ children }: { children: string }) {
  return (
    <span style={{
      background: "#fff3cd", border: "1px solid #ffc107", borderRadius: "4px",
      padding: "1px 6px", fontSize: "12px", fontWeight: "bold", margin: "0 2px",
    }}>{children}</span>
  );
}

function Blue({ children }: { children: string }) {
  return <span style={{ color: "#1565c0", fontWeight: "bold" }}>{children}</span>;
}

function ActionBox({ num, title, children, dark }: { num: number; title: string; children?: React.ReactNode; dark?: boolean }) {
  return (
    <div style={{
      background: dark ? "#e3f2fd" : "#f8f9fa",
      border: `1px solid ${dark ? "#90caf9" : "#e0e0e0"}`,
      borderRadius: "10px", padding: "12px 14px", marginBottom: "10px",
    }}>
      <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "6px", display: "flex", alignItems: "center" }}>
        <span style={{ ...pillStyle, background: dark ? "#1565c0" : "#667eea" }}>{num}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

const sub: React.CSSProperties = { fontSize: "13px", color: "#444", lineHeight: 1.9, paddingLeft: "34px" };

function InnerAction({ num, title, children }: { num: number; title: string; children?: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #ccc", borderRadius: "8px", padding: "10px 12px", marginBottom: "8px" }}>
      <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: children ? "4px" : 0 }}>
        {num} {title}
      </div>
      {children && <div style={{ fontSize: "13px", color: "#444", lineHeight: 1.9 }}>{children}</div>}
    </div>
  );
}

export default function BookmarkletPage() {
  return (
    <main style={{ padding: "20px", maxWidth: "580px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "20px", marginBottom: "6px" }}>📲 ショートカット設定</h1>
      <p style={{ color: "#666", fontSize: "13px", marginBottom: "16px" }}>
        全ページ自動取得版。ショートカットアプリで「＋」→「新規ショートカット」を作り、アクションを順番に追加してください。
      </p>

      <div style={{ background: "#e8f5e9", border: "1px solid #81c784", borderRadius: "8px", padding: "10px 12px", marginBottom: "16px", fontSize: "13px" }}>
        <b>✅ 事前確認：</b> SafariでSafariで clubdam.com にログインしておくこと
      </div>

      {/* Copy URLs */}
      <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "10px", padding: "14px", marginBottom: "20px" }}>
        <div style={{ fontWeight: "bold", marginBottom: "10px", fontSize: "14px" }}>🔗 先にコピーしておくURL</div>
        <CopyBtn label="① DAMとも APIのURL（アクション⑦で使う）" text={DAM_URL} />
        <CopyBtn label="② アプリのURL（アクション⑨で使う）" text={IMPORT_URL} />
      </div>

      {/* Action 1 */}
      <ActionBox num={1} title="「入力を要求」を追加">
        <div style={sub}>
          • <Tag>プロンプト</Tag> カードIDを入力してください<br />
          • <Tag>入力の種類</Tag> テキスト<br />
          • その後「変数を設定」が自動追加 → 変数名を <Blue>「cardId」</Blue> に変更
        </div>
      </ActionBox>

      {/* Action 2 */}
      <ActionBox num={2} title="「変数を設定」を追加">
        <div style={sub}>
          • <Tag>変数</Tag> done<br />
          • <Tag>値</Tag> 0（数字のゼロ）
        </div>
      </ActionBox>

      {/* Loop block */}
      <ActionBox num={3} title="「繰り返す」を追加" dark>
        <div style={sub}>• <Tag>回数</Tag> 50</div>

        <div style={{ borderLeft: "3px solid #90caf9", marginLeft: "8px", marginTop: "12px", paddingLeft: "10px", paddingBottom: "4px" }}>
          <div style={{ fontSize: "12px", color: "#1565c0", fontWeight: "bold", marginBottom: "10px" }}>
            ── 繰り返しの中に ④〜⑪ を追加 ──
          </div>

          <InnerAction num={4} title="「もし」を追加">
            • <Tag>入力</Tag> 変数「done」<br />
            • <Tag>条件</Tag> 等しい<br />
            • <Tag>値</Tag> 1
          </InnerAction>

          <InnerAction num={5} title="「繰り返しを終了する」← 「もし」の内側に追加" />

          <InnerAction num={6} title="「終了条件」← 自動追加" />

          <InnerAction num={7} title="「URLの内容を取得」を追加（DAMとも → XML取得）">
            • <Tag>メソッド</Tag> GET<br />
            • <Tag>URL</Tag> 下記の手順で設定：
            <div style={{ background: "#fffde7", border: "1px solid #fdd835", borderRadius: "6px", padding: "10px", marginTop: "6px", lineHeight: 2.2 }}>
              <b>URLの入力手順：</b><br />
              ① 「DAMとも APIのURL」をペースト<br />
              ② その後ろに続けて入力: <code>?cdmCardNo=</code><br />
              ③ <Blue>変数アイコン（青い丸↑）</Blue> →「cardId」を挿入<br />
              ④ 続けて入力: <code>&amp;pageNo=</code><br />
              ⑤ <Blue>変数アイコン</Blue> →「繰り返し回数」を挿入
            </div>
            <div style={{ marginTop: "6px", fontSize: "12px", color: "#888" }}>
              完成形: <code style={{ fontSize: "10px" }}>{DAM_URL}?cdmCardNo=[cardId]&pageNo=[繰り返し回数]</code>
            </div>
          </InnerAction>

          <InnerAction num={8} title="「変数を設定」を追加">
            • <Tag>変数</Tag> xml<br />
            • <Tag>値</Tag> URLの内容（⑦の結果が自動で入る）
          </InnerAction>

          <InnerAction num={9} title="「URLの内容を取得」を追加（アプリに送信）">
            • <Tag>URL</Tag> 「アプリのURL」をペースト<br />
            • <Tag>メソッド</Tag> POST<br />
            • <Tag>リクエストの本文</Tag> <Blue>「ファイル」</Blue> を選択<br />
            　→ ファイル欄に変数 <Blue>「xml」</Blue> を挿入
          </InnerAction>

          <InnerAction num={10} title="「辞書の値を取得」を追加">
            • <Tag>辞書</Tag> URLの内容（⑨の結果）<br />
            • <Tag>キー</Tag> doneNum
          </InnerAction>

          <InnerAction num={11} title="「変数を設定」を追加">
            • <Tag>変数</Tag> done<br />
            • <Tag>値</Tag> 辞書の値（⑩の結果が自動で入る）
          </InnerAction>

          <div style={{ fontSize: "12px", color: "#1565c0", fontWeight: "bold", marginTop: "4px" }}>
            ── ここまでが繰り返しの中 ──
          </div>
        </div>
      </ActionBox>

      {/* Action 12 */}
      <ActionBox num={12} title="「繰り返し終了」← 自動追加" />

      {/* Action 13 */}
      <ActionBox num={13} title="「テキストを表示」を追加">
        <div style={sub}>• <Tag>テキスト</Tag> 取り込み完了！</div>
      </ActionBox>

      <div style={{ background: "#e8f5e9", border: "1px solid #81c784", borderRadius: "8px", padding: "10px 12px", marginBottom: "20px", fontSize: "13px" }}>
        <b>✅ 保存：</b> 右上「完了」→ 名前を <b>「DAM全取込」</b> にして保存
      </div>

      {/* Usage */}
      <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
        <b style={{ fontSize: "14px" }}>▶ 使い方</b>
        <ol style={{ margin: "8px 0 0", paddingLeft: "20px", lineHeight: 2.2, fontSize: "13px" }}>
          <li>Safariで clubdam.com にログインしておく</li>
          <li>ショートカットアプリで「DAM全取込」を実行</li>
          <li>カードIDを入力（例: 12345678）</li>
          <li>自動で全ページ取得・保存が始まる</li>
          <li>「取り込み完了！」が出たら完了</li>
        </ol>
      </div>

      <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: "8px", padding: "10px 12px", fontSize: "12px" }}>
        <b>⚠️</b> 初回実行時「clubdam.comへのアクセスを許可しますか？」→ <b>「許可」</b> をタップ
      </div>
    </main>
  );
}
