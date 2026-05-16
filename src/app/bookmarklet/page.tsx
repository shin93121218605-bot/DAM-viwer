export const dynamic = "force-dynamic";

const APP_URL = "https://dam-viwer-febw-jrb75ge0a-kun-s-projects4.vercel.app";
const LOADER =
  `javascript:(function(){var s=document.createElement('script');s.src='${APP_URL}/bookmarklet.js?t='+Date.now();document.body.appendChild(s);})()`;

export default function BookmarkletPage() {
  return (
    <main style={{ padding: "24px", maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "22px", marginBottom: "8px" }}>📲 ブックマークレットの設定</h1>
      <p style={{ color: "#555", marginBottom: "24px", lineHeight: 1.6 }}>
        スマホのブラウザに登録することで、DAMとものサイトからワンタップでデータを取得・保存できます。
      </p>

      <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
        <b>⚠️ 注意</b>：このブックマークレットは <b>clubdam.com にログインした状態</b> で使います。
      </div>

      <h2 style={{ fontSize: "17px", marginBottom: "12px" }}>📋 ステップ1：下のコードをコピー</h2>
      <div style={{
        background: "#1e1e1e", color: "#d4d4d4", padding: "16px", borderRadius: "8px",
        fontSize: "12px", wordBreak: "break-all", lineHeight: 1.5, marginBottom: "8px",
        userSelect: "all", WebkitUserSelect: "all"
      }}>
        {LOADER}
      </div>
      <p style={{ color: "#888", fontSize: "13px", marginBottom: "24px" }}>
        ↑ 長押し → 「すべて選択」→「コピー」
      </p>

      <h2 style={{ fontSize: "17px", marginBottom: "12px" }}>📌 ステップ2：ブックマークとして保存</h2>
      <div style={{ background: "#f8f9fa", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
        <p style={{ margin: "0 0 12px 0" }}><b>Safari の場合</b></p>
        <ol style={{ margin: 0, paddingLeft: "20px", lineHeight: 2 }}>
          <li>このページを普通にブックマーク（共有ボタン →「ブックマークに追加」）</li>
          <li>ブックマーク一覧を開いて、いま追加したものを<b>編集</b></li>
          <li><b>URLの欄</b>を全部消して、上でコピーしたコードを貼り付け</li>
          <li>「完了」で保存</li>
        </ol>
        <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid #ddd" }} />
        <p style={{ margin: "0 0 12px 0" }}><b>Chrome の場合</b></p>
        <ol style={{ margin: 0, paddingLeft: "20px", lineHeight: 2 }}>
          <li>このページをブックマーク（⋮ メニュー →「ブックマークに追加」）</li>
          <li>アドレスバーに <code>chrome://bookmarks</code> と入力</li>
          <li>追加したブックマークの「⋮」→「編集」</li>
          <li><b>URLの欄</b>を全部消して、上でコピーしたコードを貼り付け</li>
          <li>「保存」</li>
        </ol>
      </div>

      <h2 style={{ fontSize: "17px", marginBottom: "12px" }}>🎤 ステップ3：使い方</h2>
      <ol style={{ paddingLeft: "20px", lineHeight: 2.2, marginBottom: "24px" }}>
        <li><a href="https://www.clubdam.com" target="_blank" style={{ color: "#667eea" }}>clubdam.com</a> にログイン</li>
        <li>保存したブックマークをタップ</li>
        <li>画面右上に操作パネルが表示される</li>
        <li>「🔌 接続テスト」→ カードIDを入力</li>
        <li>「▶ データ取得開始」でデータを取得</li>
        <li>「📤 アプリに送信」でこのアプリに保存！</li>
      </ol>

      <div style={{ background: "#e8f5e9", border: "1px solid #4caf50", borderRadius: "8px", padding: "16px" }}>
        <b>✅ 送信が成功すると</b>、このアプリのダッシュボードにデータが表示されます。<br />
        何度でも実行できます（重複データは自動的にスキップします）。
      </div>
    </main>
  );
}
