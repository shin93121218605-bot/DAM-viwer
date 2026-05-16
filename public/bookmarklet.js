(function () {
  'use strict';
  var APP_URL = 'https://dam-viwer-febw-jrb75ge0a-kun-s-projects4.vercel.app';
  var CONFIG = { maxPages: 40, delay: 500 };
  var style = document.createElement('style');
  style.textContent = '#damDL{position:fixed;top:20px;right:20px;width:320px;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.4);z-index:999999;font-family:sans-serif;font-size:14px}'
    + '#damDL .hd{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:16px;border-radius:12px 12px 0 0}'
    + '#damDL .hd h3{margin:0;font-size:16px}'
    + '#damDL .hd .x{float:right;background:rgba(255,255,255,.2);border:none;color:#fff;font-size:18px;cursor:pointer;padding:2px 8px;border-radius:4px}'
    + '#damDL .bd{padding:16px}'
    + '#damDL .st{margin:8px 0;padding:10px;border-radius:8px}'
    + '#damDL .st.info{background:#e3f2fd;color:#1565c0}'
    + '#damDL .st.ok{background:#e8f5e9;color:#2e7d32}'
    + '#damDL .st.err{background:#ffebee;color:#c62828}'
    + '#damDL button{width:100%;padding:12px;margin:4px 0;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer}'
    + '#damDL .b1{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff}'
    + '#damDL .b2{background:#6c757d;color:#fff}'
    + '#damDL .b3{background:#28a745;color:#fff}'
    + '#damDL .b4{background:linear-gradient(135deg,#f093fb,#f5576c);color:#fff}'
    + '#damDL button:disabled{opacity:.4;cursor:not-allowed}'
    + '#damDL .bar{width:100%;height:8px;background:#e0e0e0;border-radius:4px;overflow:hidden;margin:8px 0}'
    + '#damDL .fill{height:100%;background:linear-gradient(90deg,#667eea,#764ba2);width:0;transition:width .3s}'
    + '#damDL .nums{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:8px 0}'
    + '#damDL .nb{background:#f8f9fa;padding:10px;border-radius:8px;text-align:center}'
    + '#damDL .nl{font-size:10px;color:#666}'
    + '#damDL .nv{font-size:20px;font-weight:700;color:#667eea}';
  document.head.appendChild(style);
  var old = document.getElementById('damDL');
  if (old) old.remove();
  var ui = document.createElement('div');
  ui.id = 'damDL';
  ui.innerHTML = '<div class="hd"><button class="x" onclick="document.getElementById(\'damDL\').remove()">✕</button><h3>🎤 DAM採点履歴</h3></div>'
    + '<div class="bd">'
    + '<div class="st info" id="dSt">準備完了</div>'
    + '<div class="bar" id="dBar" style="display:none"><div class="fill" id="dFill"></div></div>'
    + '<div class="nums" id="dNums" style="display:none">'
    + '<div class="nb"><div class="nl">取得件数</div><div class="nv" id="dCnt">0</div></div>'
    + '<div class="nb"><div class="nl">平均点</div><div class="nv" id="dAvg">-</div></div>'
    + '<div class="nb"><div class="nl">最高点</div><div class="nv" id="dMax">-</div></div>'
    + '</div>'
    + '<button class="b2" id="dTest">🔌 接続テスト</button>'
    + '<button class="b1" id="dFetch">▶ データ取得開始</button>'
    + '<button class="b4" id="dSend" disabled>📤 アプリに送信</button>'
    + '<button class="b3" id="dJson" disabled>💾 JSONで保存</button>'
    + '</div>';
  document.body.appendChild(ui);
  var allData = [];
  var cardNo = '';
  function st(msg, type) {
    var el = document.getElementById('dSt');
    el.textContent = msg; el.className = 'st ' + type;
  }
  function prog(cur, tot) {
    document.getElementById('dBar').style.display = 'block';
    document.getElementById('dFill').style.width = (cur / tot * 100) + '%';
  }
  function nums() {
    if (!allData.length) return;
    document.getElementById('dNums').style.display = 'grid';
    document.getElementById('dCnt').textContent = allData.length;
    var scores = allData.map(function(d){ return parseInt(d.score||'0'); }).filter(function(s){ return s>0; });
    if (scores.length) {
      var avg = scores.reduce(function(a,b){return a+b;},0)/scores.length;
      var max = Math.max.apply(null, scores);
      document.getElementById('dAvg').textContent = (avg/1000).toFixed(3);
      document.getElementById('dMax').textContent = (max/1000).toFixed(3);
    }
  }
  function parseXML(s){ return new DOMParser().parseFromString(s,'text/xml'); }
  document.getElementById('dTest').onclick = async function() {
    var input = prompt('CLUB DAM CARD IDを入力してください:', cardNo);
    if (!input) return;
    cardNo = input.trim();
    st('接続テスト中...','info');
    this.disabled = true;
    try {
      var res = await fetch('https://www.clubdam.com/app/damtomo/scoring/GetScoringAiListXML.do?cdmCardNo='+encodeURIComponent(cardNo)+'&pageNo=1');
      var xml = parseXML(await res.text());
      if (xml.querySelector('status')?.textContent==='OK') {
        st('✅ 接続成功！ '+xml.querySelector('page')?.getAttribute('dataCount')+'件あります','ok');
      } else {
        st('❌ '+(xml.querySelector('message')?.textContent||'エラー'),'err');
      }
    } catch(e){ st('❌ '+e.message,'err'); }
    this.disabled = false;
  };
  document.getElementById('dFetch').onclick = async function() {
    if (!cardNo) { alert('先に「接続テスト」でカードIDを設定してください'); return; }
    st('取得開始...','info');
    allData = [];
    ['dFetch','dSend','dJson'].forEach(function(id){ document.getElementById(id).disabled=true; });
    try {
      var page=1, hasNext=true;
      while (hasNext && page<=CONFIG.maxPages) {
        var res = await fetch('https://www.clubdam.com/app/damtomo/scoring/GetScoringAiListXML.do?cdmCardNo='+encodeURIComponent(cardNo)+'&pageNo='+page);
        var xml = parseXML(await res.text());
        if (xml.querySelector('status')?.textContent!=='OK') throw new Error(xml.querySelector('message')?.textContent||'エラー');
        var pg = xml.querySelector('page');
        var tot = parseInt(pg?.getAttribute('dataCount')||'0');
        hasNext = pg?.getAttribute('hasNext')==='1';
        Array.from(xml.querySelectorAll('scoring')).forEach(function(s){
          var d = {score:s.textContent.trim()};
          for(var i=0;i<s.attributes.length;i++) d[s.attributes[i].name]=s.attributes[i].value;
          allData.push(d);
        });
        st('📥 取得中... '+allData.length+'/'+tot+'件','info');
        prog(allData.length, tot);
        nums();
        page++;
        if (hasNext) await new Promise(function(r){setTimeout(r,CONFIG.delay);});
      }
      st('✅ 完了！ '+allData.length+'件取得','ok');
      document.getElementById('dSend').disabled = false;
      document.getElementById('dJson').disabled = false;
    } catch(e){ st('❌ '+e.message,'err'); }
    document.getElementById('dFetch').disabled = false;
  };
  document.getElementById('dSend').onclick = async function() {
    if (!allData.length) return;
    st('📤 アプリに送信中...','info');
    this.disabled = true;
    try {
      var res = await fetch(APP_URL+'/api/import', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(allData)
      });
      var json = await res.json();
      if (res.ok) {
        st('✅ 送信完了！ '+json.imported+'件をアプリに保存しました','ok');
      } else {
        st('❌ エラー: '+(json.error||res.status),'err');
      }
    } catch(e){ st('❌ '+e.message,'err'); }
    this.disabled = false;
  };
  document.getElementById('dJson').onclick = function() {
    if (!allData.length) return;
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(allData,null,2)],{type:'application/json'}));
    a.download = 'dam_scores_'+new Date().toISOString().slice(0,10)+'.json';
    a.click();
    st('✅ JSON保存完了','ok');
  };
})();
