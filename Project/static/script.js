/* ═══════════════════════════════════════════════════════════
   script.js — NeuralText  |  All Pages Combined
   Each section runs only if its key elements exist on the page
   ═══════════════════════════════════════════════════════════ */

/* ════════════════════════════════
   SHARED HELPERS
════════════════════════════════ */
function sentPill(label) {
  const map = {
    'Strongly Positive': 'pill pill-spos',
    'Positive':          'pill pill-pos',
    'Neutral':           'pill pill-neu',
    'Negative':          'pill pill-neg',
    'Strongly Negative': 'pill pill-sneg'
  };
  return `<span class="${map[label] || 'pill pill-neu'}">${label || 'Neutral'}</span>`;
}

function scoreClass(s) {
  return s > 0 ? 'score-pos' : s < 0 ? 'score-neg' : 'score-neu';
}

function showAlert(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'alert show ' + type;
  setTimeout(() => el.classList.remove('show'), 5000);
}

function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

/* ── Wave crash page transition ── */
function triggerWave(href) {
  const w = document.getElementById('waveCrash');
  if (!w) { if (href) window.location.href = href; return; }
  w.classList.remove('active');
  void w.offsetWidth;
  w.classList.add('active');
  if (href) setTimeout(() => { window.location.href = href; }, 260);
  setTimeout(() => w.classList.remove('active'), 540);
}


/* ════════════════════════════════════════════════════════════
   PAGE: INDEX  (Upload & Processing)
════════════════════════════════════════════════════════════ */
if (document.getElementById('dropZone')) {

  /* ── Particles ── */
  (function () {
    const c = document.getElementById('particles');
    if (!c) return;
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const sz = Math.random() * 4 + 2;
      p.style.cssText = `
        width:${sz}px; height:${sz}px;
        left:${Math.random() * 100}%;
        animation-duration:${Math.random() * 20 + 15}s;
        animation-delay:${Math.random() * 20}s;
        opacity:${Math.random() * 0.2};
      `;
      c.appendChild(p);
    }
  })();

  /* ── Drag & Drop ── */
  const dz = document.getElementById('dropZone');
  dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('dragover'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
  dz.addEventListener('drop', e => {
    e.preventDefault();
    dz.classList.remove('dragover');
    const f = e.dataTransfer.files[0];
    if (f) { document.getElementById('fileInput').files = e.dataTransfer.files; onFileChosen(f.name); }
  });
  document.getElementById('fileInput').addEventListener('change', e => {
    if (e.target.files[0]) onFileChosen(e.target.files[0].name);
  });

  /* ── CHANGE 3: Show badge + X, lock textarea when file chosen ── */
  function onFileChosen(name) {
    document.getElementById('fileName').textContent = name;
    document.getElementById('fileBadgeWrap').classList.add('show');
    // Lock textarea so only file is used
    document.getElementById('rawText').classList.add('textarea-locked');
    document.getElementById('rawText').placeholder = '⚠ File selected — remove file with ✕ to use text input instead.';
  }

  /* ── Cancel / remove file ── */
  window.cancelFile = function () {
    // Clear the file input
    const fi = document.getElementById('fileInput');
    fi.value = '';
    // Hide badge
    document.getElementById('fileBadgeWrap').classList.remove('show');
    document.getElementById('fileName').textContent = '';
    // Unlock textarea
    document.getElementById('rawText').classList.remove('textarea-locked');
    document.getElementById('rawText').placeholder = 'Paste any text here — articles, reviews, tweets, news, research papers, logs...\n\nExample: Good good good results were seen today. Bad terrible outcomes in energy sector...';
    // Clear any alerts
    const al = document.getElementById('fileAlert');
    al.className = 'alert'; al.textContent = '';
  };

  /* ── Upload — file takes strict priority, no mixing ── */
  async function uploadInput() {
    const file = document.getElementById('fileInput').files[0];
    const text = document.getElementById('rawText').value.trim();
    const fd   = new FormData();

    if (file) {
      fd.append('file', file);
    } else if (text) {
      fd.append('text', text);
    } else {
      showAlert('fileAlert', '⚠ No input provided — upload a file or paste text first.', 'error');
      return false;
    }

    const r = await fetch('/upload', { method: 'POST', body: fd });
    const d = await r.json();
    if (d.error)   { showAlert('fileAlert', d.error,   'error');   return false; }
    if (d.warning) { showAlert('fileAlert', d.warning, 'error');   return false; }
    showAlert('fileAlert', d.message, 'success');
    return true;
  }

  /* ── Start Processing ── */
  let pollTimer = null;

  window.startProcessing = async function () {
    const ok = await uploadInput();
    if (!ok) return;

    /* CHANGE 4: read from number inputs, not sliders */
    const workers = parseInt(document.getElementById('workersInput').value, 10) || 4;
    const chunk   = parseInt(document.getElementById('chunkInput').value,   10) || 100;

    if (workers < 1 || workers > 64) { showAlert('fileAlert', '⚠ Workers must be between 1 and 64.', 'error'); return; }
    if (chunk   < 10)                { showAlert('fileAlert', '⚠ Chunk size must be at least 10 words.', 'error'); return; }

    document.getElementById('startBtn').disabled = true;
    document.getElementById('progressWrap').classList.add('show');
    document.getElementById('ctaRow').classList.remove('show');

    setPhase('seq');
    setStatus('running', 'Processing…');
    clearLog();

    await fetch('/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workers, chunk })
    });

    pollTimer = setInterval(poll, 800);
  };

  /* ── Poll Status ── */
  async function poll() {
    const r = await fetch('/status');
    const d = await r.json();

    const pct = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0;
    document.getElementById('progressBar').style.width = pct + '%';
    document.getElementById('progressPct').textContent = pct + '%';

    const logs    = d.logs || [];
    const lastLog = logs.slice(-5).join(' ');
    if (lastLog.includes('Phase 2') || lastLog.includes('Parallel')) setPhase('par');
    if (lastLog.includes('Storing'))  setPhase('store');

    /* CHANGE 2: Only render parallel chunk logs (filter out sequential) */
    renderParallelLogs(logs);

    if (d.status === 'done') {
      clearInterval(pollTimer);
      document.getElementById('progressBar').style.width = '100%';
      document.getElementById('progressPct').textContent = '100%';
      setPhase('done');
      setStatus('done', 'Processing Complete ✓');
      document.getElementById('startBtn').disabled = false;
      document.getElementById('ctaRow').classList.add('show');

      /* CHANGE 1: Show timing at top — Sequential total + Parallel total + Speedup */
      const tr = await fetch('/timing');
      const td = await tr.json();
      if (td.parallel_time != null) {
        document.getElementById('tSeq').textContent   = td.sequential_time + 's';
        document.getElementById('tPar').textContent   = td.parallel_time + 's';
        document.getElementById('tSpeed').textContent = td.speedup + 'x faster';
        document.getElementById('timingPanel').classList.add('show');
      }

      // Build per-chunk comparison chart at bottom of sidebar
      buildChunkChart();
    }

    if (d.status === 'error') {
      clearInterval(pollTimer);
      setStatus('error', 'Error Occurred');
      document.getElementById('startBtn').disabled = false;
    }
  }

  /* ── Per-chunk data collectors ── */
  let seqChunkTimes = {};   // { chunkId: seconds }
  let parChunkTimes = {};   // { chunkId: seconds }

  /* ── Log renderer: skips sequential, shows each parallel chunk with its time ── */
  let renderedCount = 0;

  function renderParallelLogs(logs) {
    const area = document.getElementById('logArea');

    for (let i = renderedCount; i < logs.length; i++) {
      const l = logs[i];

      // ── Collect sequential per-chunk time (don't render in log) ──────
      const seqMatch = l.match(/\[Sequential\].*?Chunk\s+(\d+).*?(\d+\.\d+)s/);
      if (seqMatch) {
        seqChunkTimes[seqMatch[1]] = parseFloat(seqMatch[2]);
        renderedCount = i + 1;
        continue;
      }

      // ── Skip other sequential / phase-1 lines ────────────────────────
      if (l.includes('Phase 1') || l.startsWith('── Phase 1') || l.includes('Sequential done')) {
        renderedCount = i + 1;
        continue;
      }

      const div = document.createElement('div');

      // ── Parallel chunk line: render as mini card + collect time ──────
      const parMatch = l.match(/\[Parallel #(\d+)\].*?Chunk\s+(\d+).*?(\d+\.\d+)s/);
      if (parMatch) {
        const order   = parMatch[1];
        const chunkId = parMatch[2];
        const secs    = parMatch[3];
        const ms      = (parseFloat(secs) * 1000).toFixed(1);

        // Collect for chart
        parChunkTimes[chunkId] = parseFloat(secs);

        div.className = 'log-entry chunk-card';
        div.innerHTML = `
          <div class="chunk-card-top">
            <span class="chunk-order">#${order}</span>
            <span class="chunk-id">Chunk ${chunkId}</span>
            <span class="chunk-time">${ms} ms</span>
          </div>
          <div class="chunk-bar-bg">
            <div class="chunk-bar-fill" style="width:0%" data-ms="${ms}"></div>
          </div>`;
        area.appendChild(div);
        area.scrollTop = area.scrollHeight;

        requestAnimationFrame(() => {
          const bar = div.querySelector('.chunk-bar-fill');
          const pct = Math.min((parseFloat(ms) / 2000) * 100, 100);
          bar.style.width = pct + '%';
        });

        renderedCount = i + 1;
        continue;
      }

      // ── System / status lines ─────────────────────────────────────────
      div.className = 'log-entry';
      if (l.startsWith('✔') || l.includes('done'))  div.classList.add('success');
      else if (l.startsWith('🚀'))                   div.classList.add('success');
      else if (l.startsWith('⚠'))                    div.classList.add('warn');
      else if (l.startsWith('ERROR'))                 div.classList.add('error');
      else                                            div.classList.add('info');

      div.textContent = l;
      area.appendChild(div);
      area.scrollTop = area.scrollHeight;
    }

    renderedCount = logs.length;
  }

  /* ── Build per-chunk comparison chart after processing ── */
  function buildChunkChart() {
    const allIds = Array.from(
      new Set([...Object.keys(seqChunkTimes), ...Object.keys(parChunkTimes)])
    ).sort((a, b) => +a - +b);

    if (!allIds.length) return;

    // Cap display at 30 chunks max so chart stays readable
    const ids     = allIds.slice(0, 30);
    const labels  = ids.map(id => `C${id}`);
    const seqData = ids.map(id => seqChunkTimes[id] != null ? +(seqChunkTimes[id] * 1000).toFixed(2) : 0);
    const parData = ids.map(id => parChunkTimes[id] != null ? +(parChunkTimes[id] * 1000).toFixed(2) : 0);

    const panel = document.getElementById('chunkChartPanel');
    panel.classList.add('show');

    const ctx = document.getElementById('chunkChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Sequential (ms)',
            data: seqData,
            backgroundColor: 'rgba(100,116,139,0.6)',
            borderColor: 'rgba(100,116,139,0.9)',
            borderWidth: 1,
            borderRadius: 3,
          },
          {
            label: 'Parallel (ms)',
            data: parData,
            backgroundColor: 'rgba(0,245,196,0.55)',
            borderColor: 'rgba(0,245,196,0.9)',
            borderWidth: 1,
            borderRadius: 3,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: items => `Chunk ${ids[items[0].dataIndex]}`,
              label: item => `${item.dataset.label}: ${item.parsed.y} ms`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 8, family: "'Space Mono', monospace" }, maxRotation: 0 }
          },
          y: {
            grid: { color: 'rgba(30,45,69,0.8)' },
            ticks: { color: '#64748b', font: { size: 8, family: "'Space Mono', monospace" },
                     callback: v => v + 'ms' }
          }
        }
      }
    });
  }

  function clearLog() {
    renderedCount = 0;
    seqChunkTimes = {};
    parChunkTimes = {};
    document.getElementById('logArea').innerHTML = '';
    const panel = document.getElementById('chunkChartPanel');
    if (panel) panel.classList.remove('show');
  }

  /* ── Status & Phases ── */
  function setStatus(cls, txt) {
    const b = document.getElementById('statusBadge');
    b.className = 'status-badge ' + cls;
    document.getElementById('statusText').textContent = txt;
  }

  const phaseMap = { seq: 'phaseSeq', par: 'phasePar', store: 'phaseStore', done: 'phaseDone' };
  function setPhase(p) {
    Object.entries(phaseMap).forEach(([k, id]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('active', 'done');
      if (k === p) el.classList.add('active');
      else if (Object.keys(phaseMap).indexOf(k) < Object.keys(phaseMap).indexOf(p)) el.classList.add('done');
    });
  }

} /* end INDEX page */


/* ════════════════════════════════════════════════════════════
   PAGE: RESULTS  (Analytics Dashboard)
════════════════════════════════════════════════════════════ */
if (document.getElementById('pageContent')) {

  const COLORS_PIE = ['#00f5c4','#7c3aed','#f59e0b','#ef4444','#22c55e','#3b82f6','#ec4899'];
  const COLORS_BAR = ['rgba(0,245,196,0.8)','rgba(124,58,237,0.8)','rgba(245,158,11,0.8)','rgba(239,68,68,0.8)','rgba(34,197,94,0.8)'];

  if (typeof Chart !== 'undefined') {
    Chart.defaults.color       = '#64748b';
    Chart.defaults.borderColor = '#1e2d45';
    Chart.defaults.font.family = "'Space Mono', monospace";
  }

  function guessDataType(themes) {
    const t = themes.map(x => x[0].toLowerCase()).join(' ');
    if (t.includes('sports'))                              return '🏆 Sports Content';
    if (t.includes('economy') || t.includes('politics'))  return '📰 News / Articles';
    if (t.includes('technology'))                          return '💻 Tech Content';
    if (t.includes('health'))                              return '🏥 Health / Medical';
    if (t.includes('environment'))                         return '🌱 Environmental';
    return '📄 General Text';
  }

  async function loadResults() {
    try {
      const r = await fetch('/results');
      const d = await r.json();

      if (!d.total) {
        document.getElementById('pageContent').innerHTML = `
          <div class="empty">
            <div class="empty-icon">📭</div>
            <h3>No Results Yet</h3>
            <p>Process some text first, then come back here to see your analytics.</p>
            <a href="/" class="btn btn-primary" style="margin-top:1.5rem;display:inline-flex">⬆ Go Upload</a>
          </div>`;
        return;
      }

      const sentMap      = Object.fromEntries(d.sentiment.map(x => [x[0], x[1]]));
      const dataTypeLabel = guessDataType(d.themes);

      document.getElementById('pageContent').innerHTML = `
        <div class="page-header">
          <div>
            <div class="page-eyebrow">Text Intelligence</div>
            <h1 class="page-title">Analytics Dashboard</h1>
          </div>
          <div class="header-actions">
            <a href="/search_page" class="btn btn-outline btn-sm">🔍 Search</a>
            <button class="btn btn-outline btn-sm" onclick="exportData('csv')">⬇ Export CSV</button>
            <button class="btn btn-purple btn-sm" onclick="exportData('excel')">📊 Export Excel</button>
          </div>
        </div>

        <div class="data-type-badge">🔍 Auto-detected: ${dataTypeLabel}</div>

        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-icon">📄</div>
            <div class="stat-val" id="animTotal">0</div>
            <div class="stat-label">Total Chunks</div>
            <div class="stat-sub">Text segments processed</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-val" id="animAvg">0.00</div>
            <div class="stat-label">Avg Sentiment Score</div>
            <div class="stat-sub">${d.avg > 0 ? 'Overall Positive' : d.avg < 0 ? 'Overall Negative' : 'Balanced'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-val" style="color:var(--success)">${sentMap['Positive'] || 0}</div>
            <div class="stat-label">Positive Chunks</div>
            <div class="stat-sub">incl. Strongly Positive: ${sentMap['Strongly Positive'] || 0}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">❌</div>
            <div class="stat-val" style="color:var(--danger)">${sentMap['Negative'] || 0}</div>
            <div class="stat-label">Negative Chunks</div>
            <div class="stat-sub">incl. Strongly Negative: ${sentMap['Strongly Negative'] || 0}</div>
          </div>
        </div>

        <div class="charts-row">
          <div class="chart-card">
            <div class="chart-title">🥧 Sentiment Distribution</div>
            <div class="chart-subtitle">Breakdown of all sentiment labels</div>
            <div class="chart-wrap"><canvas id="chartSentiment"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-title">📊 Theme Frequency</div>
            <div class="chart-subtitle">Detected content categories</div>
            <div class="chart-wrap"><canvas id="chartThemes"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-title">📉 Score Distribution</div>
            <div class="chart-subtitle">Positive vs Negative vs Neutral</div>
            <div class="chart-wrap"><canvas id="chartDist"></canvas></div>
          </div>
        </div>

        <div class="table-section">
          <div class="table-header">
            <div class="table-title">📋 Processed Results — Top 100</div>
            <div style="display:flex;gap:0.5rem">
              <button class="btn btn-outline btn-sm" onclick="exportData('csv')">⬇ CSV</button>
              <button class="btn btn-purple btn-sm" onclick="exportData('excel')">📊 Excel</button>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr>
                <th>#</th><th>Text Chunk</th><th>Sentiment</th>
                <th>Score</th><th>Keywords</th>
              </tr></thead>
              <tbody id="tableBody"></tbody>
            </table>
          </div>
        </div>

        <div class="email-section">
          <h4>📧 Email Results</h4>
          <div class="field">
            <label>Recipient Email</label>
            <input type="email" id="emailInputR" placeholder="you@example.com"/>
          </div>
          <button class="btn btn-primary" onclick="sendEmailResults()">📤 Send Report</button>
          <div class="alert email-alert" id="emailAlertR"></div>
        </div>`;

      /* Counters */
      animateCount('animTotal', 0, d.total, 800, false);
      animateCount('animAvg',   0, d.avg,   800, true);

      /* Table */
      const tbody = document.getElementById('tableBody');
      d.rows.forEach((row, i) => {
        const [text, kw, label, score] = row;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="color:var(--muted)">${i + 1}</td>
          <td class="td-text" title="${text || ''}">${text || '—'}</td>
          <td>${sentPill(label)}</td>
          <td><span class="score-badge ${scoreClass(score)}">${score > 0 ? '+' + score : score}</span></td>
          <td style="color:var(--muted);font-size:0.65rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${kw || '—'}</td>`;
        tbody.appendChild(tr);
      });

      /* Charts */
      buildPieChart('chartSentiment', d.sentiment.map(x => x[0]), d.sentiment.map(x => x[1]));
      buildBarChart('chartThemes',    d.themes.map(x => x[0]),    d.themes.map(x => x[1]));
      buildPolarChart('chartDist',
        ['Pos', 'S.Pos', 'Neu', 'Neg', 'S.Neg'],
        [sentMap['Positive'] || 0, sentMap['Strongly Positive'] || 0,
         sentMap['Neutral']  || 0, sentMap['Negative']          || 0, sentMap['Strongly Negative'] || 0]
      );

    } catch (e) {
      document.getElementById('pageContent').innerHTML =
        `<div class="empty"><div class="empty-icon">⚠</div><h3>Error Loading Data</h3><p>${e.message}</p></div>`;
    }
  }

  /* Counter animation */
  function animateCount(id, from, to, dur, isFloat) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = performance.now();
    function step(now) {
      const p   = Math.min((now - start) / dur, 1);
      const val = from + (to - from) * (1 - (1 - p) ** 3);
      el.textContent = isFloat ? val.toFixed(2) : Math.round(val).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* Chart builders */
  function buildPieChart(id, labels, data) {
    new Chart(document.getElementById(id), {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: COLORS_PIE, borderWidth: 2, borderColor: '#0f1829', hoverOffset: 8 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 10, font: { size: 10 } } } },
        animation: { animateScale: true, duration: 1200 }
      }
    });
  }

  function buildBarChart(id, labels, data) {
    new Chart(document.getElementById(id), {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Count', data, backgroundColor: COLORS_BAR, borderRadius: 6, borderSkipped: false }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 9 } } },
          y: { grid: { color: 'rgba(30,45,69,0.8)' }, ticks: { font: { size: 9 }, stepSize: 1 } }
        },
        animation: { duration: 1000 }
      }
    });
  }

  function buildPolarChart(id, labels, data) {
    new Chart(document.getElementById(id), {
      type: 'polarArea',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: ['rgba(34,197,94,0.7)','rgba(0,245,196,0.7)','rgba(100,116,139,0.5)','rgba(239,68,68,0.7)','rgba(239,68,68,0.4)'],
          borderWidth: 1, borderColor: '#0f1829'
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 8, font: { size: 9 } } } },
        animation: { duration: 1200 }
      }
    });
  }

  window.exportData = function (type) {
    window.location.href = `/export_all?type=${type}`;
  };

  window.sendEmailResults = async function () {
    const email = document.getElementById('emailInputR').value.trim();
    if (!email || !email.includes('@')) { showAlert('emailAlertR', 'Please enter a valid email address.', 'error'); return; }
    try {
      const r = await fetch('/send_email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const d = await r.json();
      if (d.success) showAlert('emailAlertR', '✅ Results sent to ' + email + ' successfully!', 'success');
      else           showAlert('emailAlertR', '❌ ' + d.error, 'error');
    } catch (e) {
      showAlert('emailAlertR', '❌ Email service unavailable. Export CSV and send manually.', 'error');
    }
  };

  loadResults();

} /* end RESULTS page */


/* ════════════════════════════════════════════════════════════
   PAGE: SEARCH
════════════════════════════════════════════════════════════ */
if (document.getElementById('searchInput')) {

  let allKeywords  = [];
  let lastResults  = [];

  /* ── Load keyword suggestions ── */
  async function loadKeywords() {
    try {
      const r   = await fetch('/keywords');
      allKeywords = await r.json();
      renderSuggestions(allKeywords);
    } catch (e) {
      document.getElementById('suggestions').innerHTML =
        '<span class="no-suggestions">No data processed yet — upload a file first.</span>';
    }
  }

  function renderSuggestions(kws) {
    const wrap = document.getElementById('suggestions');
    if (!kws || !kws.length) {
      wrap.innerHTML = '<span class="no-suggestions">No keywords found in processed data.</span>';
      return;
    }
    wrap.innerHTML = kws.slice(0, 40).map(k =>
      `<span class="suggestion-chip" onclick="useSuggestion('${k}')">${k}</span>`
    ).join('');
  }

  window.debounceFilterSuggestions = function () {
    const q        = document.getElementById('searchInput').value.toLowerCase().trim();
    const filtered = q ? allKeywords.filter(k => k.toLowerCase().includes(q)) : allKeywords;
    renderSuggestions(filtered.length ? filtered : allKeywords);
  };

  window.useSuggestion = function (kw) {
    document.getElementById('searchInput').value = kw;
    runSearch();
  };

  /* ── Mode tabs ── */
  window.setMode = function (mode, el) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    const placeholders = {
      keyword:  'Type a keyword to search across all processed text…',
      sentence: 'Enter a full phrase or sentence to find matches…',
      both:     'Type anything — keyword or full phrase — to search…'
    };
    document.getElementById('searchInput').placeholder = placeholders[mode];
  };

  /* ── Run search ── */
  window.runSearch = async function () {
    const kw  = document.getElementById('searchInput').value.trim();
    const min = document.getElementById('minScore').value;
    const max = document.getElementById('maxScore').value;

    hideAlert('searchAlert');

    if (!kw && !min && !max) {
      const el = document.getElementById('searchAlert');
      el.textContent = 'Please enter a keyword, phrase, or score range to search.';
      el.className = 'alert error'; el.style.display = 'block';
      setTimeout(() => { el.style.display = 'none'; }, 5000);
      return;
    }

    let url = `/search_api?keyword=${encodeURIComponent(kw)}`;
    if (min) url += `&min_score=${min}`;
    if (max) url += `&max_score=${max}`;

    document.getElementById('resultsArea').innerHTML = `
      <div class="state-box"><div class="state-icon">⚙</div>
      <div class="state-msg">Searching through processed data…</div></div>`;

    try {
      const r = await fetch(url);
      const d = await r.json();
      lastResults = d.data || [];
      renderResults(lastResults, kw);
    } catch (e) {
      const el = document.getElementById('searchAlert');
      el.textContent = 'Search failed: ' + e.message;
      el.className = 'alert error'; el.style.display = 'block';
      document.getElementById('resultsArea').innerHTML = '';
    }
  };

  function renderResults(rows, keyword) {
    document.getElementById('resultCount').textContent = rows.length;
    document.getElementById('resultBar').style.display = 'flex';

    if (!rows.length) {
      document.getElementById('resultsArea').innerHTML = `
        <div class="state-box">
          <div class="state-icon">🔎</div>
          <div class="state-msg"><strong>No results found</strong> for "${keyword}".<br>
          Try a different keyword, widen your score range, or check the keyword suggestions above.</div>
        </div>`;
      document.getElementById('emailSection').style.display = 'none';
      return;
    }

    const tableRows = rows.map((row, i) => {
      const [text, kw, label, score] = row;
      const ht        = keyword ? hlText(text || '', keyword) : (text || '');
      const kws       = (kw || '').split(',').filter(Boolean);
      const kwHtml    = kws.slice(0, 6).map(k => `<span class="kw-chip">${k.trim()}</span>`).join('');
      const scoreVal  = score || 0;
      const sc        = scoreVal > 0 ? 'score-pos' : scoreVal < 0 ? 'score-neg' : 'score-neu';
      return `<tr style="animation-delay:${i * 0.03}s">
        <td style="color:var(--muted)">${i + 1}</td>
        <td class="td-text" style="font-size:0.72rem;line-height:1.6;max-width:320px">${ht}</td>
        <td>${sentPill(label)}</td>
        <td><span class="score-badge ${sc}">${scoreVal > 0 ? '+' + scoreVal : scoreVal}</span></td>
        <td style="max-width:200px">${kwHtml || '<span style="color:var(--muted)">—</span>'}</td>
      </tr>`;
    }).join('');

    document.getElementById('resultsArea').innerHTML = `
      <div class="table-section">
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>#</th><th>Text Chunk</th><th>Sentiment</th>
              <th>Score</th><th>Keywords</th>
            </tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      </div>`;

    document.getElementById('emailSection').style.display = 'grid';
  }

  function hlText(text, kw) {
    if (!kw || !text) return text;
    const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${esc})`, 'gi'), '<mark>$1</mark>');
  }

  /* ── Export ── */
  window.exportSearch = function (type) {
    if (!lastResults.length) {
      const el = document.getElementById('searchAlert');
      el.textContent = 'No results to export. Run a search first.';
      el.className = 'alert error'; el.style.display = 'block';
      setTimeout(() => { el.style.display = 'none'; }, 5000);
      return;
    }
    window.location.href = `/export_search?type=${type}&filename=search_results`;
  };

  /* ── Email ── */
  window.sendEmailSearch = async function () {
    const email = document.getElementById('emailInputS').value.trim();
    if (!email || !email.includes('@')) { showEmailAlert('Please enter a valid email address.', 'error'); return; }
    if (!lastResults.length)            { showEmailAlert('No search results to send.', 'error'); return; }
    try {
      const r = await fetch('/send_email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'search' })
      });
      const d = await r.json();
      if (d.success) showEmailAlert('✅ Results sent to ' + email + ' successfully!', 'success');
      else           showEmailAlert('❌ ' + d.error, 'error');
    } catch (e) {
      showEmailAlert('❌ Email service unavailable. Use the Export buttons instead.', 'error');
    }
  };

  function showEmailAlert(msg, type) {
    const el = document.getElementById('emailAlertS');
    if (!el) return;
    el.textContent = msg;
    el.style.background  = type === 'success' ? 'rgba(34,197,94,0.1)'  : 'rgba(239,68,68,0.1)';
    el.style.border      = type === 'success' ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)';
    el.style.color       = type === 'success' ? '#86efac' : '#fca5a5';
    el.style.padding     = '0.6rem 0.8rem';
    el.style.borderRadius = '8px';
    el.className = 'email-alert show';
    setTimeout(() => el.classList.remove('show'), 6000);
  }

  loadKeywords();

} /* end SEARCH page */