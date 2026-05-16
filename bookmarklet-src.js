(function () {
  'use strict';

  // ★ここにあなたのアプリURLを入力してください（末尾スラッシュなし）★
  const APP_URL = 'https://あなたのアプリ名.vercel.app';

  const CONFIG = { maxPages: 40, delay: 500 };

  // --- スタイル ---
  const style = document.createElement('style');
  style.textContent = `
    #damDownloader { position: fixed; top: 20px; right: 20px; width: 420px; background: white;
      border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); z-index: 999999; font-family: sans-serif; }
    #damDownloader .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; padding: 20px; border-radius: 12px 12px 0 0; }
    #damDownloader .header h3 { margin: 0; font-size: 18px; }
    #damDownloader .close-btn { background: rgba(255,255,255,0.2); border: none; color: white;
      font-size: 20px; cursor: pointer; padding: 5px 10px; border-radius: 4px; float: right; }
    #damDownloader .content { padding: 20px; }
    #damDownloader .status { margin: 10px 0; padding: 12px; border-radius: 8px; font-size: 14px; }
    #damDownloader .status.info    { background: #e3f2fd; color: #1565c0; }
    #damDownloader .status.success { background: #e8f5e9; color: #2e7d32; }
    #damDownloader .status.error   { background: #ffebee; color: #c62828; }
    #damDownloader button { width: 100%; padding: 14px; margin: 6px 0; border: none;
      border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; }
    #damDownloader .btn-primary  { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    #damDownloader .btn-secondary { background: #6c757d; color: white; }
    #damDownloader .btn-success  { background: #28a745; color: white; }
    #damDownloader .btn-send     { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; }
    #damDownloader button:disabled { opacity: 0.5; cursor: not-allowed; }
    #damDownloader .stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 15px 0; }
    #damDownloader .stat-box { background: #f8f9fa; padding: 12px; border-radius: 8px; text-align: center; }
    #damDownloader .stat-label { font-size: 11px; color: #666; }
    #damDownloader .stat-value { font-size: 22px; font-weight: 700; color: #667eea; }
    #damDownloader .progress-bar { width: 100%; height: 8px; background: #e0e0e0;
      border-radius: 4px; overflow: hidden; margin: 10px 0; }
    #damDownloader .progress-fill { height: 100%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      width: 0%; transition: width 0.3s; }
  `;
  document.head.appendChild(style);

  const existing = document.getElementById('damDownloader');
  if (existing) existing.remove();

  const ui = document.createElement('div');
  ui.id = 'damDownloader';
  ui.innerHTML = `
    <div class="header">
      <button class="close-btn" onclick="this.parentElement.parentElement.remove()">✕</button>
      <h3>🎤 DAM採点履歴</h3>
    </div>
    <div class="content">
      <div class="status info" id="statusMsg">準備完了</div>
      <div class="progress-bar" id="progressBar" style="display:none;">
        <div class="progress-fill" id="progressFill"></div>
      </div>
      <div class="stats" id="stats" style="display:none;">
        <div class="stat-box">
          <div class="stat-label">取得件数</div>
          <div class="stat-value" id="countValue">0</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">平均点</div>
          <div class="stat-value" id="avgValue">-</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">最高点</div>
          <div class="stat-value" id="maxValue">-</div>
        </div>
      </div>
      <button class="btn-secondary" id="testBtn">🔌 接続テスト</button>
      <button class="btn-primary"   id="fetchBtn">▶ データ取得開始</button>
      <button class="btn-send"      id="sendBtn"  disabled>📤 アプリに送信</button>
      <button class="btn-success"   id="csvBtn"   disabled>💾 CSV保存</button>
      <button class="btn-success"   id="jsonBtn"  disabled>💾 JSON保存</button>
    </div>
  `;
  document.body.appendChild(ui);

  let allData = [];
  let cardNo = '';

  function updateStatus(msg, type) {
    const el = document.getElementById('statusMsg');
    if (el) { el.textContent = msg; el.className = 'status ' + type; }
  }

  function updateProgress(current, total) {
    const bar = document.getElementById('progressBar');
    const fill = document.getElementById('progressFill');
    if (bar && fill) {
      bar.style.display = 'block';
      fill.style.width = (current / total * 100) + '%';
    }
  }

  function updateStats() {
    if (!allData.length) return;
    document.getElementById('stats').style.display = 'grid';
    document.getElementById('countValue').textContent = allData.length;
    const scores = allData.map(d => parseInt(d.score || '0')).filter(s => s > 0);
    if (scores.length) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const max = Math.max(...scores);
      document.getElementById('avgValue').textContent = (avg / 1000).toFixed(3);
      document.getElementById('maxValue').textContent = (max / 1000).toFixed(3);
    }
  }

  async function testConnection() {
    const input = prompt('CLUB DAM CARD IDを入力してください:', cardNo);
    if (!input) return;
    cardNo = input.trim();
    updateStatus('接続テスト中...', 'info');
    document.getElementById('testBtn').disabled = true;
    try {
      const url = `https://www.clubdam.com/app/damtomo/scoring/GetScoringAiListXML.do?cdmCardNo=${encodeURIComponent(cardNo)}&pageNo=1`;
      const res = await fetch(url);
      const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');
      const status = xml.querySelector('status')?.textContent;
      if (status === 'OK') {
        const count = xml.querySelector('page')?.getAttribute('dataCount');
        updateStatus('✅ 接続成功！ ' + count + '件のデータがあります', 'success');
      } else {
        const msg = xml.querySelector('message')?.textContent || '不明なエラー';
        updateStatus('❌ ' + msg, 'error');
      }
    } catch (e) {
      updateStatus('❌ ' + e.message, 'error');
    } finally {
      document.getElementById('testBtn').disabled = false;
    }
  }

  async function fetchPage(pageNo) {
    const url = `https://www.clubdam.com/app/damtomo/scoring/GetScoringAiListXML.do?cdmCardNo=${encodeURIComponent(cardNo)}&pageNo=${pageNo}`;
    const res = await fetch(url);
    const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');
    const status = xml.querySelector('status')?.textContent;
    if (status !== 'OK') {
      throw new Error(xml.querySelector('message')?.textContent || '不明なエラー');
    }
    const page = xml.querySelector('page');
    const dataCount = parseInt(page?.getAttribute('dataCount') || '0');
    const pageCount = parseInt(page?.getAttribute('pageCount') || '0');
    const hasNext = page?.getAttribute('hasNext') === '1';
    const records = Array.from(xml.querySelectorAll('scoring')).map(s => {
      const data = { score: s.textContent.trim() };
      for (let i = 0; i < s.attributes.length; i++) {
        data[s.attributes[i].name] = s.attributes[i].value;
      }
      return data;
    });
    return { records, dataCount, pageCount, hasNext };
  }

  async function fetchAllData() {
    if (!cardNo) {
      alert('先に「接続テスト」でカードIDを設定してください');
      return;
    }
    updateStatus('データ取得開始...', 'info');
    allData = [];
    document.getElementById('fetchBtn').disabled = true;
    document.getElementById('sendBtn').disabled = true;
    document.getElementById('csvBtn').disabled = true;
    document.getElementById('jsonBtn').disabled = true;
    try {
      let pageNo = 1;
      let hasNext = true;
      while (hasNext && pageNo <= CONFIG.maxPages) {
        const result = await fetchPage(pageNo);
        allData.push(...result.records);
        updateStatus('📥 取得中... ' + allData.length + '/' + result.dataCount + '件', 'info');
        updateProgress(allData.length, result.dataCount);
        updateStats();
        hasNext = result.hasNext;
        pageNo++;
        if (hasNext) await new Promise(r => setTimeout(r, CONFIG.delay));
      }
      updateStatus('✅ 完了！ ' + allData.length + '件取得', 'success');
      document.getElementById('sendBtn').disabled = false;
      document.getElementById('csvBtn').disabled = false;
      document.getElementById('jsonBtn').disabled = false;
    } catch (e) {
      updateStatus('❌ ' + e.message, 'error');
    } finally {
      document.getElementById('fetchBtn').disabled = false;
    }
  }

  async function sendToApp() {
    if (!allData.length) return;
    updateStatus('📤 アプリに送信中...', 'info');
    document.getElementById('sendBtn').disabled = true;
    try {
      const res = await fetch(APP_URL + '/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allData),
      });
      const json = await res.json();
      if (res.ok) {
        updateStatus('✅ 送信完了！ ' + json.imported + '件インポート（重複スキップ: ' + (json.total - json.imported) + '件）', 'success');
      } else {
        updateStatus('❌ 送信エラー: ' + (json.error || res.status), 'error');
      }
    } catch (e) {
      updateStatus('❌ 送信失敗: ' + e.message, 'error');
    } finally {
      document.getElementById('sendBtn').disabled = false;
    }
  }

  function saveCSV() {
    if (!allData.length) return;
    let csv = '﻿';
    const keys = [...new Set(allData.flatMap(r => Object.keys(r)))];
    csv += keys.map(h => '"' + h + '"').join(',') + '\n';
    allData.forEach(r => {
      csv += keys.map(h => {
        const v = r[h] ?? '';
        return (typeof v === 'string' && v.includes(',')) ? '"' + v + '"' : v;
      }).join(',') + '\n';
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = 'dam_scores_' + new Date().toISOString().slice(0, 10) + '.csv';
    link.click();
    updateStatus('✅ CSV保存完了', 'success');
  }

  function saveJSON() {
    if (!allData.length) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' }));
    link.download = 'dam_scores_' + new Date().toISOString().slice(0, 10) + '.json';
    link.click();
    updateStatus('✅ JSON保存完了', 'success');
  }

  document.getElementById('testBtn').onclick = testConnection;
  document.getElementById('fetchBtn').onclick = fetchAllData;
  document.getElementById('sendBtn').onclick = sendToApp;
  document.getElementById('csvBtn').onclick = saveCSV;
  document.getElementById('jsonBtn').onclick = saveJSON;
})();
