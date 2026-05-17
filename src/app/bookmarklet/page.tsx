"use client";
import { useState } from "react";

const SCRIPT_CODE = `(function(){var APP='https://dam-viwer-febw.vercel.app';var C={maxPages:40,delay:500};var st=document.createElement('style');st.textContent='#dDL{position:fixed;top:16px;right:16px;width:300px;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.4);z-index:999999;font-family:sans-serif;font-size:14px}#dDL .hd{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:14px;border-radius:12px 12px 0 0}#dDL .hd h3{margin:0;font-size:15px}#dDL .x{float:right;background:rgba(255,255,255,.2);border:none;color:#fff;font-size:16px;cursor:pointer;padding:2px 8px;border-radius:4px}#dDL .bd{padding:14px}#dDL .st{margin:6px 0;padding:10px;border-radius:8px}#dDL .info{background:#e3f2fd;color:#1565c0}#dDL .ok{background:#e8f5e9;color:#2e7d32}#dDL .err{background:#ffebee;color:#c62828}#dDL button{width:100%;padding:11px;margin:4px 0;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer}#dDL .b1{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff}#dDL .b2{background:#6c757d;color:#fff}#dDL .b3{background:#28a745;color:#fff}#dDL .b4{background:linear-gradient(135deg,#f093fb,#f5576c);color:#fff}#dDL button:disabled{opacity:.4}#dDL .bar{width:100%;height:6px;background:#e0e0e0;border-radius:4px;overflow:hidden;margin:6px 0}#dDL .fill{height:100%;background:linear-gradient(90deg,#667eea,#764ba2);width:0;transition:width .3s}#dDL .nums{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:6px 0}#dDL .nb{background:#f8f9fa;padding:8px;border-radius:8px;text-align:center}#dDL .nl{font-size:10px;color:#666}#dDL .nv{font-size:18px;font-weight:700;color:#667eea}';document.head.appendChild(st);var old=document.getElementById('dDL');if(old)old.remove();var ui=document.createElement('div');ui.id='dDL';ui.innerHTML='<div class="hd"><button class="x" onclick="document.getElementById(\'dDL\').remove()">✕<\/button><h3>🎤 DAM採点履歴<\/h3><\/div><div class="bd"><div class="st info" id="dSt">準備完了<\/div><div class="bar" id="dBar" style="display:none"><div class="fill" id="dFill"><\/div><\/div><div class="nums" id="dNums" style="display:none"><div class="nb"><div class="nl">取得件数<\/div><div class="nv" id="dCnt">0<\/div><\/div><div class="nb"><div class="nl">平均点<\/div><div class="nv" id="dAvg">-<\/div><\/div><div class="nb"><div class="nl">最高点<\/div><div class="nv" id="dMax">-<\/div><\/div><\/div><button class="b2" id="dT">🔌 接続テスト<\/button><button class="b1" id="dF">▶ データ取得開始<\/button><button class="b4" id="dS" disabled>📤 アプリに送信<\/button><\/div>';document.body.appendChild(ui);var all=[],card='';function s(m,t){var e=document.getElementById('dSt');e.textContent=m;e.className='st '+t;}function px(str){return new DOMParser().parseFromString(str,'text/xml');}document.getElementById('dT').onclick=async function(){var i=prompt('CLUB DAM CARD IDを入力:',card);if(!i)return;card=i.trim();s('接続テスト中...','info');this.disabled=true;try{var r=await fetch('https://www.clubdam.com/app/damtomo/scoring/GetScoringAiListXML.do?cdmCardNo='+encodeURIComponent(card)+'&pageNo=1');var x=px(await r.text());if(x.querySelector('status')?.textContent==='OK'){s('✅ 接続成功！ '+x.querySelector('page')?.getAttribute('dataCount')+'件','ok');}else{s('❌ '+(x.querySelector('message')?.textContent||'エラー'),'err');}}catch(e){s('❌ '+e.message,'err');}this.disabled=false;};document.getElementById('dF').onclick=async function(){if(!card){alert('先に接続テストでIDを設定してください');return;}s('取得開始...','info');all=[];this.disabled=true;document.getElementById('dS').disabled=true;try{var pg=1,hn=true;while(hn&&pg<=C.maxPages){var r=await fetch('https://www.clubdam.com/app/damtomo/scoring/GetScoringAiListXML.do?cdmCardNo='+encodeURIComponent(card)+'&pageNo='+pg);var x=px(await r.text());if(x.querySelector('status')?.textContent!=='OK')throw new Error(x.querySelector('message')?.textContent||'エラー');var p=x.querySelector('page');var tot=parseInt(p?.getAttribute('dataCount')||'0');hn=p?.getAttribute('hasNext')==='1';Array.from(x.querySelectorAll('scoring')).forEach(function(sc){var d={score:sc.textContent.trim()};for(var i=0;i<sc.attributes.length;i++)d[sc.attributes[i].name]=sc.attributes[i].value;all.push(d);});s('📥 '+all.length+'/'+tot+'件','info');document.getElementById('dBar').style.display='block';document.getElementById('dFill').style.width=(all.length/tot*100)+'%';document.getElementById('dNums').style.display='grid';document.getElementById('dCnt').textContent=all.length;var sc=all.map(function(d){return parseInt(d.score||'0');}).filter(function(v){return v>0;});if(sc.length){document.getElementById('dAvg').textContent=(sc.reduce(function(a,b){return a+b;},0)/sc.length/1000).toFixed(3);document.getElementById('dMax').textContent=(Math.max.apply(null,sc)/1000).toFixed(3);}pg++;if(hn)await new Promise(function(resolve){setTimeout(resolve,C.delay);});}}catch(e){s('❌ '+e.message,'err');}this.disabled=false;if(all.length)document.getElementById('dS').disabled=false;s('✅ 完了！ '+all.length+'件','ok');};document.getElementById('dS').onclick=async function(){if(!all.length)return;s('📤 送信中...','info');this.disabled=true;try{var r=await fetch(APP+'/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(all)});var j=await r.json();if(r.ok){s('✅ '+j.imported+'件をアプリに保存しました！','ok');}else{s('❌ '+(j.error||r.status),'err');}}catch(e){s('❌ '+e.message,'err');}this.disabled=false;};})();completion(null);`;

export default function BookmarkletPage() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // fallback
      const el = document.getElementById("script-box") as HTMLTextAreaElement;
      if (el) { el.select(); document.execCommand("copy"); }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <main style={{ padding: "20px", maxWidth: "560px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "20px", marginBottom: "16px" }}>📲 データ取込の設定</h1>

      {/* ショートカット方法 */}
      <div style={{ background: "#e8f5e9", border: "1px solid #4caf50", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
        <b style={{ fontSize: "15px" }}>✅ おすすめ：ショートカットアプリを使う方法</b>
      </div>

      <h2 style={{ fontSize: "16px", margin: "0 0 10px" }}>① コードをコピー</h2>
      <textarea
        id="script-box"
        readOnly
        value={SCRIPT_CODE}
        style={{
          width: "100%", height: "80px", fontSize: "10px", fontFamily: "monospace",
          background: "#1e1e1e", color: "#aaa", border: "none", borderRadius: "8px",
          padding: "10px", resize: "none", boxSizing: "border-box",
        }}
      />
      <button
        onClick={copy}
        style={{
          width: "100%", padding: "14px", marginTop: "8px", border: "none",
          borderRadius: "8px", fontSize: "16px", fontWeight: 700, cursor: "pointer",
          background: copied ? "#28a745" : "linear-gradient(135deg,#667eea,#764ba2)",
          color: "white",
        }}
      >
        {copied ? "✅ コピーしました！" : "📋 コードをコピー"}
      </button>

      <h2 style={{ fontSize: "16px", margin: "20px 0 10px" }}>② ショートカットに貼り付け</h2>
      <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "16px" }}>
        <ol style={{ margin: 0, paddingLeft: "20px", lineHeight: 2.2 }}>
          <li>ショートカットアプリを開く（青いアプリ）</li>
          <li>右上の <b>「＋」</b> をタップ</li>
          <li><b>「アクションを追加」</b> →「スクリプト」か「Web」で検索 →<br />
            <b>「Webページでスクリプトを実行」</b> をタップ</li>
          <li>スクリプト欄に <b>①でコピーしたコード</b> を貼り付け</li>
          <li>右上 <b>「完了」</b> → 名前は <b>「DAM取込」</b></li>
        </ol>
      </div>

      <h2 style={{ fontSize: "16px", margin: "20px 0 10px" }}>③ 使い方</h2>
      <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "16px" }}>
        <ol style={{ margin: 0, paddingLeft: "20px", lineHeight: 2.2 }}>
          <li>Safari で <b>clubdam.com</b> を開いてログイン</li>
          <li>画面下の <b>共有ボタン</b>（□から↑が出るアイコン）をタップ</li>
          <li>メニューから <b>「DAM取込」</b> をタップ</li>
          <li>画面に操作パネルが出る！</li>
          <li>「接続テスト」→「データ取得」→「アプリに送信」</li>
        </ol>
      </div>

      <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: "8px", padding: "12px", marginTop: "20px", fontSize: "13px" }}>
        <b>⚠️</b> ショートカットを初めて使うとき「Webサイトへのアクセスを許可しますか？」と聞かれます。<b>「許可」</b> をタップしてください。
      </div>
    </main>
  );
}
