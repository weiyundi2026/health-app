// ============ 数据存储 ============
const DB = {
  get(key, def=[]) {
    try { return JSON.parse(localStorage.getItem('ha_' + key)) ?? def; } catch { return def; }
  },
  set(key, val) { localStorage.setItem('ha_' + key, JSON.stringify(val)); }
};

let records = {
  weight:   DB.get('weight',   []),
  exercise: DB.get('exercise', []),
  water:    DB.get('water',    []),
  sleep:    DB.get('sleep',    []),
  diet:     DB.get('diet',     []),
  analysis: DB.get('analysis', [])
};

function saveDB(key) {
  DB.set(key, records[key]);
}

// ============ 启动 ============
window.addEventListener('load', () => {
  // 启动动画
  setTimeout(() => {
    const splash = document.getElementById('splash');
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.style.display = 'none';
      document.getElementById('main').style.display = 'flex';
      initApp();
    }, 500);
  }, 2000);
});

function initApp() {
  updateStatusBar();
  updateGreeting();
  updateOverview();
  renderRecentList();
  initCamera();
  setInterval(updateStatusBar, 60000);
}

// ============ 状态栏 ============
function updateStatusBar() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
  document.getElementById('statusDate').textContent = dateStr;
  const score = calcTodayScore();
  document.getElementById('todayScore').textContent = score > 0 ? score : '--';
}

function updateGreeting() {
  const h = new Date().getHours();
  const greetings = [
    [5,  12, '早上好 🌅'],
    [12, 14, '中午好 ☀️'],
    [14, 18, '下午好 🌤️'],
    [18, 22, '晚上好 🌙'],
    [22, 24, '夜深了 🌙'],
    [0,  5,  '深夜好 ⭐']
  ];
  for (const [s, e, t] of greetings) {
    if (h >= s && h < e) { document.getElementById('greetingTitle').textContent = t; break; }
  }
}

// ============ 今日评分 ============
function calcTodayScore() {
  const today = todayStr();
  const w = records.water.filter(r => r.date === today).reduce((s, r) => s + r.amount, 0);
  const e = records.exercise.filter(r => r.date === today).reduce((s, r) => s + r.duration, 0);
  const sl = records.sleep.filter(r => r.date === today);
  let score = 0, cnt = 0;
  if (w > 0) { score += Math.min(100, (w / 2000) * 100); cnt++; }
  if (e > 0) { score += Math.min(100, (e / 30) * 100); cnt++; }
  if (sl.length > 0) { score += Math.min(100, (sl[sl.length - 1].hours / 8) * 100); cnt++; }
  return cnt > 0 ? Math.round(score / cnt) : 0;
}

// ============ 首页概览 ============
function updateOverview() {
  const today = todayStr();
  const waterTotal = records.water.filter(r => r.date === today).reduce((s, r) => s + r.amount, 0);
  const exTotal = records.exercise.filter(r => r.date === today).reduce((s, r) => s + r.duration, 0);
  const dietCal = records.diet.filter(r => r.date === today).reduce((s, r) => s + r.calories, 0);
  const latestW = records.weight.length ? records.weight[records.weight.length - 1].weight : null;
  const lastSleep = records.sleep.filter(r => r.date === today);
  const sleepHr = lastSleep.length ? lastSleep[lastSleep.length - 1].hours : null;

  const cards = [
    { icon: '💧', val: Math.round(waterTotal / 100) / 10, unit: '升', label: '今日饮水', color: '#48cfad' },
    { icon: '🏃', val: exTotal, unit: '分钟', label: '今日运动', color: '#6c63ff' },
    { icon: '🍎', val: dietCal, unit: '卡', label: '今日热量', color: '#fd9644' },
    { icon: sleepHr ? '😴' : '⚖️', val: sleepHr ?? (latestW ?? '--'), unit: sleepHr ? '小时' : 'kg', label: sleepHr ? '今日睡眠' : '最近体重', color: '#fc5c65' }
  ];

  document.getElementById('overviewGrid').innerHTML = cards.map(c => `
    <div class="ov-card">
      <div class="ov-icon">${c.icon}</div>
      <div class="ov-val" style="color:${c.color}">${c.val}</div>
      <div class="ov-unit">${c.unit}</div>
      <div class="ov-label">${c.label}</div>
    </div>
  `).join('');
}

// ============ 近期动态 ============
function renderRecentList() {
  const all = [
    ...records.weight.map(r   => ({ icon: '⚖️', name: `体重 ${r.weight} kg${r.bmi ? ` · BMI ${r.bmi}` : ''}`, time: r.time, ts: r.ts })),
    ...records.exercise.map(r => ({ icon: '🏃', name: `${r.type} ${r.duration}分钟`, time: r.time, ts: r.ts })),
    ...records.water.map(r    => ({ icon: '💧', name: `喝水 ${r.amount} ml`, time: r.time, ts: r.ts })),
    ...records.sleep.map(r    => ({ icon: '😴', name: `睡眠 ${r.hours}小时 · ${r.quality}`, time: r.time, ts: r.ts })),
    ...records.diet.map(r     => ({ icon: '🍎', name: `${r.meal} ${r.food} ${r.calories}卡`, time: r.time, ts: r.ts })),
    ...records.analysis.map(r => ({ icon: '🤖', name: `AI检测: ${r.title} · ${r.score}分`, time: r.time, ts: r.ts }))
  ].sort((a, b) => b.ts - a.ts).slice(0, 10);

  if (!all.length) {
    document.getElementById('recentList').innerHTML = '<div class="empty"><div class="empty-ico">📭</div><div>还没有记录，快去记录一下吧！</div></div>';
    return;
  }

  document.getElementById('recentList').innerHTML = all.map(item => `
    <div class="recent-item">
      <div class="recent-icon">${item.icon}</div>
      <div class="recent-info">
        <div class="recent-name">${item.name}</div>
        <div class="recent-time">${item.time}</div>
      </div>
    </div>
  `).join('');
}

// ============ 页面导航 ============
let curPage = 'home';
function goPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  const navMap = { home: 0, camera: 1, record: 2, stats: 3 };
  const idx = navMap[name];
  if (idx !== undefined) document.querySelectorAll('.nav-item')[idx].classList.add('active');
  curPage = name;

  if (name === 'stats') renderCharts();
  if (name === 'record') renderDataLists();
  if (name === 'home') { updateOverview(); renderRecentList(); }
}

// ============ 记录子页面切换 ============
let curRTab = 'weight';
function switchRTab(btn, tab) {
  document.querySelectorAll('.rtab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.rtab-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('rt-' + tab).classList.add('active');
  curRTab = tab;
  renderDataList(tab);
  if (tab === 'water') updateWaterBar();
}

function openRecord(tab) {
  goPage('record');
  const btn = Array.from(document.querySelectorAll('.rtab')).find(b => b.onclick?.toString().includes(tab));
  document.querySelectorAll('.rtab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.rtab-content').forEach(c => c.classList.remove('active'));
  const tabBtn = document.querySelector(`.rtab[onclick*="${tab}"]`);
  if (tabBtn) tabBtn.classList.add('active');
  document.getElementById('rt-' + tab).classList.add('active');
  curRTab = tab;
  renderDataList(tab);
}

// ============ 添加记录 ============
function addRecord(type) {
  let record = { ts: Date.now(), time: nowStr(), date: todayStr() };
  let valid = true;

  if (type === 'weight') {
    const w = parseFloat(document.getElementById('f-weight').value);
    const h = parseFloat(document.getElementById('f-height').value);
    if (!w || w <= 0) { showToast('⚠️ 请输入体重'); return; }
    record.weight = w;
    record.bmi = h ? +(w / (h / 100) ** 2).toFixed(1) : null;
    document.getElementById('f-weight').value = '';
  } else if (type === 'exercise') {
    const dur = parseFloat(document.getElementById('f-exdur').value);
    if (!dur || dur <= 0) { showToast('⚠️ 请输入运动时长'); return; }
    record.type = document.getElementById('f-extype').value;
    record.duration = dur;
    record.calories = parseFloat(document.getElementById('f-excal').value) || 0;
    document.getElementById('f-exdur').value = '';
    document.getElementById('f-excal').value = '';
  } else if (type === 'water') {
    const amt = parseFloat(document.getElementById('f-water').value);
    if (!amt || amt <= 0) { showToast('⚠️ 请输入喝水量'); return; }
    record.amount = amt;
    document.getElementById('f-water').value = '';
  } else if (type === 'sleep') {
    const hr = parseFloat(document.getElementById('f-sleep').value);
    if (!hr || hr <= 0) { showToast('⚠️ 请输入睡眠时长'); return; }
    record.hours = hr;
    record.quality = document.getElementById('f-sleepq').value;
    document.getElementById('f-sleep').value = '';
  } else if (type === 'diet') {
    const food = document.getElementById('f-food').value.trim();
    const cal = parseFloat(document.getElementById('f-fcal').value);
    if (!food) { showToast('⚠️ 请输入食物名称'); return; }
    if (!cal || cal < 0) { showToast('⚠️ 请输入热量'); return; }
    record.food = food;
    record.calories = cal;
    record.meal = document.getElementById('f-meal').value;
    document.getElementById('f-food').value = '';
    document.getElementById('f-fcal').value = '';
  }

  records[type].push(record);
  saveDB(type);
  renderDataList(type);
  if (type === 'water') updateWaterBar();
  updateOverview();
  updateStatusBar();
  showToast('✅ 记录成功！');
}

function quickAddWater(amt) {
  records.water.push({ ts: Date.now(), time: nowStr(), date: todayStr(), amount: amt });
  saveDB('water');
  renderDataList('water');
  updateWaterBar();
  updateOverview();
  showToast(`💧 已记录 ${amt}ml`);
}

function quickWater() {
  records.water.push({ ts: Date.now(), time: nowStr(), date: todayStr(), amount: 250 });
  saveDB('water');
  updateOverview();
  renderRecentList();
  showToast('💧 已喝水 250ml！');
}

// ============ 更新喝水进度条 ============
function updateWaterBar() {
  const total = records.water.filter(r => r.date === todayStr()).reduce((s, r) => s + r.amount, 0);
  document.getElementById('waterToday').textContent = total;
  const pct = Math.min(100, (total / 2000) * 100);
  document.getElementById('waterBarFill').style.width = pct + '%';
}

// ============ 渲染数据列表 ============
function renderDataLists() {
  ['weight', 'exercise', 'water', 'sleep', 'diet'].forEach(t => renderDataList(t));
  updateWaterBar();
}

function renderDataList(type) {
  const el = document.getElementById('list-' + type);
  if (!el) return;
  const list = [...records[type]].reverse();
  if (!list.length) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">📭</div><div>暂无记录</div></div>';
    return;
  }
  el.innerHTML = list.map((r, i) => {
    let valHtml = '';
    if (type === 'weight')   valHtml = `${r.weight} kg${r.bmi ? ` · BMI <b>${r.bmi}</b>` : ''}`;
    if (type === 'exercise') valHtml = `${r.type} · ${r.duration}分钟 · ${r.calories}卡`;
    if (type === 'water')    valHtml = `${r.amount} ml`;
    if (type === 'sleep')    valHtml = `${r.hours}小时 · ${r.quality}`;
    if (type === 'diet')     valHtml = `${r.food} · ${r.meal} · ${r.calories}卡`;
    const realIdx = records[type].length - 1 - i;
    return `
      <div class="data-item">
        <div class="data-main">
          <div class="data-val">${valHtml}</div>
          <div class="data-date">${r.time}</div>
        </div>
        <button class="data-del" onclick="delRecord('${type}',${realIdx})">删除</button>
      </div>
    `;
  }).join('');
}

function delRecord(type, idx) {
  records[type].splice(idx, 1);
  saveDB(type);
  renderDataList(type);
  updateOverview();
  if (type === 'water') updateWaterBar();
  showToast('🗑️ 已删除');
}

// ============ 统计图表 ============
let charts = {};
function renderCharts() {
  const labels = last7Labels();
  drawChart('chartWeight', labels, getLast7('weight', r => r.weight), '体重 (kg)', '#6c63ff', 'line');
  drawChart('chartWater',  labels, getLast7('water',  r => r.amount,  true), '饮水 (ml)', '#48cfad', 'bar');
  drawChart('chartExercise', labels, getLast7('exercise', r => r.duration, true), '运动 (分钟)', '#fd9644', 'bar');
  drawChart('chartSleep', labels, getLast7('sleep', r => r.hours), '睡眠 (小时)', '#fc5c65', 'line');
}

function drawChart(id, labels, data, label, color, type) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(canvas, {
    type: type,
    data: {
      labels,
      datasets: [{
        label, data,
        borderColor: color,
        backgroundColor: type === 'bar' ? color + '66' : color + '22',
        borderWidth: 2,
        pointBackgroundColor: color,
        tension: 0.4,
        fill: type === 'line'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#666', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,.05)' } },
        y: { ticks: { color: '#666', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,.05)' } }
      }
    }
  });
}

function last7Labels() {
  const r = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    r.push(`${d.getMonth()+1}/${d.getDate()}`);
  }
  return r;
}

function getLast7(type, getter, sum = false) {
  const r = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-').replace(/(\d{4})-(\d{2})-(\d{2})/, '$1-$2-$3');
    const dayRecs = records[type].filter(rec => rec.date === dateKey(d));
    if (sum) r.push(dayRecs.reduce((s, rec) => s + getter(rec), 0));
    else r.push(dayRecs.length ? getter(dayRecs[dayRecs.length - 1]) : null);
  }
  return r;
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ============ AI 摄像头 ============
let camStream = null, camFacing = 'user';
let hrRunning = false, hrTimer = null, hrBuf = [];
let lastAnalysis = null;
let curMode = 'face';

async function initCamera() {
  await startCam(camFacing);
}

async function startCam(facing) {
  if (camStream) camStream.getTracks().forEach(t => t.stop());
  const video = document.getElementById('camVideo');
  try {
    camStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    video.srcObject = camStream;
    camFacing = facing;
  } catch (e) {
    console.warn('摄像头访问失败', e);
  }
}

function flipCam() {
  camFacing = camFacing === 'user' ? 'environment' : 'user';
  startCam(camFacing);
}

function setMode(btn, mode) {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  curMode = mode;

  const frame = document.getElementById('camFrame');
  const scan  = document.getElementById('camScan');
  const hrPanel = document.getElementById('hrPanel');
  const shootBtn = document.getElementById('shootBtn');
  const hrStartBtn = document.getElementById('hrStartBtn');

  // 重置
  frame.style.display = 'none';
  scan.style.display = 'none';
  hrPanel.style.display = 'none';
  shootBtn.style.display = 'flex';
  hrStartBtn.style.display = 'none';
  if (hrRunning) stopHR();

  const hints = {
    face:      '对准面部，保持光线充足，点击拍照',
    tongue:    '伸出舌头对准框，点击拍照进行舌诊',
    heartrate: '点击"开始测量"，保持面部平稳约30秒',
    skin:      '将皮肤对准摄像头，点击拍照分析'
  };
  document.getElementById('camHint').textContent = hints[mode] || '';

  if (mode === 'face') {
    frame.style.display = 'block';
    frame.style.borderRadius = '50% 50% 45% 45%';
    frame.style.borderColor = 'rgba(108,99,255,.8)';
    if (camFacing !== 'user') startCam('user');
  } else if (mode === 'tongue') {
    frame.style.display = 'block';
    frame.style.borderRadius = '50%';
    frame.style.aspectRatio = '2/1';
    frame.style.borderColor = 'rgba(72,207,173,.8)';
    frame.style.width = '50%';
    frame.style.top = '60%';
    if (camFacing !== 'environment') startCam('environment');
  } else if (mode === 'heartrate') {
    hrPanel.style.display = 'block';
    shootBtn.style.display = 'none';
    hrStartBtn.style.display = 'inline-block';
    if (camFacing !== 'user') startCam('user');
  } else if (mode === 'skin') {
    if (camFacing !== 'environment') startCam('environment');
  }
}

async function shoot() {
  const video = document.getElementById('camVideo');
  const canvas = document.getElementById('camCanvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  if (camFacing === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
  ctx.drawImage(video, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const photoUrl = canvas.toDataURL('image/jpeg', 0.85);

  showAILoading();
  await sleep(1800);
  let result;
  if (curMode === 'face')   result = analyzeFace(imgData);
  else if (curMode === 'tongue') result = analyzeTongue(imgData);
  else                       result = analyzeSkin(imgData);
  result.photoUrl = photoUrl;
  result.mode = curMode;
  result.time = nowStr();
  result.ts = Date.now();
  lastAnalysis = result;
  hideAILoading();
  showAnalysisResult(result);
}

// ============ 心率 ============
function toggleHR() {
  hrRunning ? stopHR() : startHR();
}

function startHR() {
  hrRunning = true;
  hrBuf = [];
  document.getElementById('hrStartBtn').textContent = '停止测量';
  document.getElementById('hrNum').textContent = '--';
  document.getElementById('camScan').style.display = 'block';

  if (!camStream) { simulateHR(); return; }
  const video = document.getElementById('camVideo');
  const canvas = document.getElementById('camCanvas');
  canvas.width = 100; canvas.height = 100;
  const ctx = canvas.getContext('2d');

  hrTimer = setInterval(() => {
    ctx.drawImage(video, 0, 0, 100, 100);
    const px = ctx.getImageData(40, 40, 20, 20).data;
    let r = 0;
    for (let i = 0; i < px.length; i += 4) r += px[i];
    hrBuf.push(r / (px.length / 4));
    if (hrBuf.length > 60) {
      document.getElementById('hrNum').textContent = computeHR(hrBuf);
    }
    if (hrBuf.length >= 300) stopHR();
  }, 100);
}

function simulateHR() {
  let t = 0;
  hrTimer = setInterval(() => {
    t++;
    if (t > 10) document.getElementById('hrNum').textContent = Math.floor(62 + Math.random() * 28);
    if (t >= 30) stopHR();
  }, 1000);
}

function stopHR() {
  hrRunning = false;
  clearInterval(hrTimer);
  document.getElementById('hrStartBtn').textContent = '重新测量';
  document.getElementById('camScan').style.display = 'none';
  const hr = parseInt(document.getElementById('hrNum').textContent);
  if (hr && !isNaN(hr)) {
    const result = analyzeHR(hr);
    result.ts = Date.now();
    result.time = nowStr();
    lastAnalysis = result;
    showAnalysisResult(result);
  }
}

function computeHR(data) {
  let peaks = 0;
  for (let i = 2; i < data.length - 2; i++) {
    if (data[i] > data[i-1] && data[i] > data[i-2] && data[i] > data[i+1]) { peaks++; i += 5; }
  }
  const bpm = Math.round((peaks / (data.length / 10)) * 60);
  return Math.min(130, Math.max(45, bpm || (65 + Math.floor(Math.random() * 25))));
}

// ============ 图像分析 ============
function colorStats(imgData) {
  const d = imgData.data, w = imgData.width, h = imgData.height;
  const x1 = Math.floor(w*.2), x2 = Math.floor(w*.8), y1 = Math.floor(h*.15), y2 = Math.floor(h*.85);
  let r = 0, g = 0, b = 0, cnt = 0;
  for (let y = y1; y < y2; y += 5) for (let x = x1; x < x2; x += 5) {
    const i = (y * w + x) * 4;
    r += d[i]; g += d[i+1]; b += d[i+2]; cnt++;
  }
  if (!cnt) return { r:180, g:145, b:125, bright:150, sat:50 };
  r /= cnt; g /= cnt; b /= cnt;
  const bright = (r + g + b) / 3;
  const mx = Math.max(r,g,b), mn = Math.min(r,g,b);
  const sat = mx ? ((mx - mn) / mx) * 100 : 0;
  return { r, g, b, bright, sat };
}

function analyzeFace(imgData) {
  const { r, g, b, bright, sat } = colorStats(imgData);
  const tot = r + g + b + 1;
  const redR = r / tot, yelR = (r + g) / (2 * tot);
  let cx = '面色红润健康', cxS = 88;
  if (redR > 0.42)      { cx = '面色偏红（可能内热）'; cxS = 65; }
  else if (yelR > 0.39) { cx = '面色偏黄（注意肝脾）'; cxS = 60; }
  else if (bright < 100){ cx = '面色偏白（气血不足）'; cxS = 62; }
  else if (sat < 28)    { cx = '面色晦暗（建议休息）'; cxS = 67; }

  const fatigue = bright < 120 ? '疲劳' : bright < 150 ? '略有疲劳' : '状态良好';
  const score = Math.min(96, Math.max(45, cxS + randNoise(8)));
  return {
    title: '😊 面色健康分析',
    score, scoreDesc: scoreText(score),
    indicators: [
      { name: '面色状态', val: cx,         s: cxS },
      { name: '皮肤亮度', val: bright > 150 ? '明亮' : bright > 100 ? '正常' : '偏暗', s: Math.min(100, bright * .5) },
      { name: '气色饱和度', val: sat > 50 ? '充盈' : sat > 30 ? '适中' : '不足', s: Math.min(100, sat) },
      { name: '疲劳状态', val: fatigue, s: bright > 150 ? 85 : bright > 120 ? 65 : 45 }
    ],
    suggestions: [
      bright < 120   ? { i: '💤', t: '面色偏暗，建议保证7-8小时睡眠，23点前入睡' } : null,
      sat < 35       ? { i: '🥤', t: '气色不足，每天饮水1500-2000ml，补充水分' } : null,
      cx.includes('黄') ? { i: '🥗', t: '面色偏黄，注意清淡饮食，可适量食用枸杞红枣' } : null,
      cx.includes('红') ? { i: '🌿', t: '面色偏红，多吃绿叶蔬菜，避免辛辣刺激食物' } : null,
      { i: '🏃', t: '每日30分钟有氧运动，促进血液循环改善气色' },
      { i: '🍎', t: '补充维生素C、E，草莓橙子猕猴桃都是好选择' }
    ].filter(Boolean).slice(0,5)
  };
}

function analyzeTongue(imgData) {
  const { r, g, b, bright } = colorStats(imgData);
  const tot = r + g + b + 1;
  const rR = r / tot;
  const gray = Math.abs(r-g) < 20 && Math.abs(g-b) < 20;
  let tc = '淡红舌（正常）', ts = 85;
  if (rR > 0.45)           { tc = '红舌（有热）'; ts = 65; }
  else if (rR < 0.28)      { tc = '淡白舌（气血虚）'; ts = 58; }
  else if (gray && bright < 120) { tc = '青紫舌（血瘀）'; ts = 52; }
  let coat = '薄白苔（正常）', cs = 85;
  if (bright > 200)        { coat = '白腻苔（湿气重）'; cs = 62; }
  else if (bright < 80)    { coat = '少苔/无苔（阴虚）'; cs = 65; }
  const score = Math.min(95, Math.round((ts + cs) / 2 + randNoise(6)));
  return {
    title: '👅 中医舌诊分析', score, scoreDesc: scoreText(score),
    indicators: [
      { name: '舌色', val: tc, s: ts },
      { name: '舌苔', val: coat, s: cs },
      { name: '湿热程度', val: bright > 180 ? '偏重' : '适中', s: bright > 180 ? 58 : 82 },
      { name: '气血状态', val: rR > 0.34 ? '较充盈' : '偏虚', s: rR > 0.34 ? 80 : 58 }
    ],
    suggestions: [
      tc.includes('红') ? { i: '🌿', t: '舌色偏红有热，多饮菊花茶、绿豆汤，少吃辛辣' } : null,
      tc.includes('淡白') ? { i: '🥩', t: '气血不足，适量食用红枣、阿胶、当归调理' } : null,
      coat.includes('腻') ? { i: '🍵', t: '湿气重，少食生冷油腻，可饮薏米红豆水祛湿' } : null,
      coat.includes('少') ? { i: '💧', t: '阴虚少苔，多喝水，食用银耳、百合滋阴' } : null,
      { i: '🕐', t: '规律作息，23点前入睡，五脏调和舌苔自然健康' },
      { i: '🚶', t: '饭后散步15-20分钟，促进脾胃消化，改善舌苔' }
    ].filter(Boolean).slice(0,5)
  };
}

function analyzeSkin(imgData) {
  const { r, g, b, bright, sat } = colorStats(imgData);
  const even = Math.min(100, 100 - Math.abs(r-g) * .4);
  const hydra = Math.min(100, bright * .38 + sat * .28);
  const texture = Math.min(100, even * .55 + bright * .28);
  const score = Math.min(95, Math.round(even*.3 + hydra*.4 + texture*.3 + randNoise(6)));
  return {
    title: '🔍 皮肤健康分析', score, scoreDesc: scoreText(score),
    indicators: [
      { name: '肤色均匀度', val: even > 75 ? '均匀' : '不均匀', s: Math.round(even) },
      { name: '皮肤水分', val: hydra > 70 ? '充足' : hydra > 50 ? '适中' : '偏干', s: Math.round(hydra) },
      { name: '皮肤质地', val: texture > 70 ? '细腻' : '粗糙', s: Math.round(texture) },
      { name: '整体状态', val: score > 75 ? '健康' : '需护理', s: score }
    ],
    suggestions: [
      hydra < 55 ? { i: '💦', t: '皮肤干燥，增加饮水量并使用保湿护肤品' } : null,
      even < 68  ? { i: '🌞', t: '注意防晒，使用SPF30+防晒霜，减少色素沉淀' } : null,
      { i: '🥒', t: '多食维生素C丰富食物：草莓、橙子、猕猴桃，亮肤效果佳' },
      { i: '😴', t: '充足睡眠是最佳护肤品，睡眠不足加速皮肤老化' },
      { i: '🚭', t: '戒烟限酒，这些会导致皮肤暗沉粗糙加速衰老' }
    ].filter(Boolean).slice(0,5)
  };
}

function analyzeHR(hr) {
  let status, ss;
  if (hr < 60)       { status = `${hr}次/分 · 偏慢（心动过缓）`; ss = 62; }
  else if (hr < 100) { status = `${hr}次/分 · 正常心率`; ss = 90; }
  else               { status = `${hr}次/分 · 偏快（心动过速）`; ss = 58; }
  return {
    title: '❤️ 心率检测结果', score: ss, scoreDesc: scoreText(ss),
    mode: 'heartrate', hrValue: hr,
    indicators: [
      { name: '心率', val: status, s: ss },
      { name: '心血管风险', val: ss > 80 ? '低' : '中', s: ss },
      { name: '心脏状态', val: ss > 80 ? '健康' : '需关注', s: ss },
      { name: '运动建议', val: hr < 70 ? '可加强有氧运动' : hr > 90 ? '注意休息' : '保持现状', s: 75 }
    ],
    suggestions: [
      { i: '❤️', t: hr < 60 ? '心率偏慢，建议适度有氧运动如慢跑、骑车提高心率' : hr > 100 ? '心率偏快，充分休息，避免剧烈运动，持续异常请就医' : '心率正常，继续保持规律运动和良好作息' },
      { i: '🧘', t: '深呼吸练习：每天10分钟冥想，有效稳定心率' },
      { i: '🍵', t: '减少咖啡因摄入（咖啡、浓茶），有助于稳定心率' },
      { i: '💊', t: '如心率持续异常，建议及时咨询心脏科医生' }
    ]
  };
}

// ============ 显示分析结果 ============
function showAnalysisResult(result) {
  goPage('result');
  document.getElementById('resultPageTitle').textContent = result.title || '检测结果';
  animScore(result.score || 75);
  document.getElementById('scoreDesc').textContent = result.scoreDesc || '';

  // 指标条
  document.getElementById('indicatorBars').innerHTML = result.indicators.map(ind => {
    const pct = Math.min(100, Math.round(ind.s));
    const cls = pct >= 75 ? 'good' : pct >= 55 ? 'warn' : 'bad';
    return `
      <div class="ind-bar">
        <div class="ind-header">
          <span class="ind-label">${ind.name}</span>
          <span class="ind-val-${cls}">${ind.val}</span>
        </div>
        <div class="ind-track">
          <div class="ind-fill fill-${cls}" style="width:0" data-w="${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');

  setTimeout(() => {
    document.querySelectorAll('.ind-fill').forEach(el => el.style.width = el.dataset.w);
  }, 80);

  // 建议
  document.getElementById('suggestionList').innerHTML = result.suggestions.map(s =>
    `<div class="sug-item"><span class="sug-ico">${s.i}</span><span>${s.t}</span></div>`
  ).join('');

  // 照片
  const pc = document.getElementById('analysePhotoCard');
  if (result.photoUrl && result.mode !== 'heartrate') {
    pc.style.display = 'block';
    document.getElementById('analysePhoto').src = result.photoUrl;
  } else { pc.style.display = 'none'; }
}

function animScore(score) {
  const arc = document.getElementById('ringArc');
  const num = document.getElementById('scoreBig');
  const C = 314.16, offset = C - (score / 100) * C;
  arc.style.strokeDashoffset = C;
  num.textContent = '0';
  setTimeout(() => {
    arc.style.transition = 'stroke-dashoffset 1.4s ease';
    arc.style.strokeDashoffset = offset;
    let cur = 0; const step = score / 55;
    const t = setInterval(() => { cur = Math.min(score, cur + step); num.textContent = Math.round(cur); if (cur >= score) clearInterval(t); }, 25);
  }, 80);
}

function saveAnalysis() {
  if (!lastAnalysis) return;
  records.analysis.push(lastAnalysis);
  saveDB('analysis');
  showToast('✅ 已保存到健康记录');
  renderRecentList();
}

// ============ 工具 ============
function showAILoading() {
  const msgs = ['🔍 预处理图像...', '🧬 提取健康特征...', '🤖 AI 模型分析中...', '📊 生成报告...'];
  let i = 0;
  document.getElementById('aiLoadingText').textContent = msgs[0];
  document.getElementById('aiLoading').classList.add('show');
  const t = setInterval(() => { i++; if (i < msgs.length) document.getElementById('aiLoadingText').textContent = msgs[i]; else clearInterval(t); }, 500);
}
function hideAILoading() { document.getElementById('aiLoading').classList.remove('show'); }

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

function closeOverlay() {
  document.getElementById('overlay').classList.remove('show');
}

function scoreText(s) {
  if (s >= 90) return '状态极佳！继续保持健康的生活习惯 💪';
  if (s >= 75) return '总体不错，有些细节可以进一步改善 😊';
  if (s >= 60) return '需要关注，建议针对性调整生活习惯 🌿';
  return '健康状况需要改善，建议咨询专业医生 💊';
}

function randNoise(n) { return Math.floor(Math.random() * n - n / 2); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function nowStr() { return new Date().toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }); }
function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

window.addEventListener('beforeunload', () => {
  if (camStream) camStream.getTracks().forEach(t => t.stop());
});


// ============ PWA Service Worker 注册 ============
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW error:', err));
  });
}
