/* ===== 状态管理 ===== */
const AppState = {
  _key: 'find_your_calling_state',
  _default: {
    userName: '',
    diagnosis: {},
    path: [],
    values: { answers: {}, selected: [], top: [], sorted: {}, reasons: {}, purpose: '' },
    strengths: { answers: {}, selected: [], top: [], holland: {} },
    passions: { answers: {}, selected: [], top: [], ikigai: {} },
    personality: { type: '', scores: {} },
    crossResults: [],
    crossUserMarks: {},
    completed: {}
  },

  load() {
    try {
      const raw = localStorage.getItem(this._key);
      if (!raw) return { ...this._default };
      const data = JSON.parse(raw);
      // 兼容旧数据：修复之前嵌套 completed 的 bug
      if (data.completed && data.completed.completed && typeof data.completed.completed === 'object') {
        data.completed = data.completed.completed;
        this.save(data);
      }
      return { ...this._default, ...data };
    } catch { return { ...this._default }; }
  },

  save(data) {
    localStorage.setItem(this._key, JSON.stringify(data));
  },

  update(partial, key) {
    const all = this.load();
    if (key) { all[key] = { ...all[key], ...partial }; }
    else { Object.assign(all, partial); }
    this.save(all);
    return all;
  },

  get() { return this.load(); },

  getProgress() {
    const s = this.load();
    let done = 0;
    const total = 6; // myths, values, strengths, passions, personality, cross
    if (s.completed.myths) done++;
    if (s.completed.values) done++;
    if (s.completed.strengths) done++;
    if (s.completed.passions) done++;
    if (s.completed.personality) done++;
    if (s.completed.cross) done++;
    return Math.round((done / total) * 100);
  },

  clear() { localStorage.removeItem(this._key); }
};

/* ===== UI 工具 ===== */
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.remove(); }, 2500);
}

function renderProgress() {
  const pct = AppState.getProgress();
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-text').textContent = pct + '%';
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.getElementById(id).style.display = 'block';
  window.scrollTo(0, 0);
}

/* ===== 路由 ===== */
function route(hash) {
  const raw = hash || window.location.hash.slice(1) || 'home';
  const h = raw.split('?')[0];
  showPage('page-' + h);

  switch (h) {
    case 'home': renderHome(); break;
    case 'diagnosis': renderDiagnosis(); break;
    case 'modulemap': renderModuleMap(); break;
    case 'myths': renderMyths(); break;
    case 'values': renderValues(); break;
    case 'strengths': renderStrengths(); break;
    case 'passions': renderPassions(); break;
    case 'personality': renderPersonality(); break;
    case 'cross': renderCrossAnalysis(); break;
    case 'report': renderReport(); break;
  }
}

window.addEventListener('hashchange', () => route());

function navigate(hash) {
  window.location.hash = hash;
}

/* ===== 首页 ===== */
function renderHome() {
  const el = document.getElementById('page-home');
  el.innerHTML = `
    <div class="hero">
      <h1>寻己</h1>
      <p style="font-size:18px; color:var(--gray-600);">Find Your Calling</p>
      <div class="quote">
        "在成为你自己这件事上，没有人比得过你。"
      </div>
      <div class="intro-box">
        <p>这个工具诞生于一个追问了近十年的问题：<strong>我真正想做的事是什么？</strong></p>
        <p>如果你也曾在深夜问过自己同样的问题，翻过很多书、做过很多测试，却依然没有答案——你不是一个人。我也是。</p>
        <p>基于八木仁平《如何找到想做的事》的核心理念，融合 IKIGAI、霍兰德、价值观澄清等成熟理论，这个工具不是为了给你一个"正确答案"，而是陪你走完一场系统性的自我对话。</p>
        <p>你不需要立刻知道答案。你只需要愿意开始。</p>
        <div class="author">—— 一个同样在路上的探索者</div>
      </div>
      <button class="btn btn-primary btn-lg" onclick="navigate('modulemap')">开始探索</button>
      <p style="margin-top:16px; font-size:13px; color:var(--gray-400);">
        约需 5-10 分钟 · 所有数据仅保存在你的浏览器中
      </p>
    </div>
  `;
}

/* ===== 诊断页 ===== */
function renderDiagnosis() {
  const state = AppState.get();
  const answers = state.diagnosis || {};

  let html = `<div class="page-header">
    <button class="back-btn" onclick="navigate('home')">← 返回首页</button>
    <h1>快速诊断</h1>
    <p class="subtitle">5个问题，看看你目前卡在哪里</p>
  </div>`;

  DIAGNOSIS_QUESTIONS.forEach((q, i) => {
    html += `<div class="card diag-question">
      <div class="q-num">问题 ${i + 1} / 5</div>
      <div class="q-text">${q.question}</div>
      <div class="diag-options">
        ${q.options.map(o => `
          <div class="diag-option ${answers[q.id] === o.value ? 'selected' : ''}"
               onclick="selectDiagnosis('${q.id}', '${o.value}')">
            <div class="radio"></div>
            ${o.label}
          </div>
        `).join('')}
      </div>
    </div>`;
  });

  const allAnswered = DIAGNOSIS_QUESTIONS.every(q => answers[q.id]);
  html += `<div style="text-align:center; margin-top:24px;">
    <button class="btn btn-primary btn-lg" ${allAnswered ? '' : 'disabled'}
            onclick="finishDiagnosis()">
      查看推荐路径
    </button>
  </div>`;

  document.getElementById('page-diagnosis').innerHTML = html;
}

function selectDiagnosis(qid, value) {
  const state = AppState.get();
  state.diagnosis[qid] = value;
  AppState.update({ diagnosis: state.diagnosis });
  renderDiagnosis();
}

function finishDiagnosis() {
  const state = AppState.get();
  const path = generatePath(state.diagnosis);
  AppState.update({ path });
  navigate('modulemap');
}

/* ===== 模块地图 ===== */
function resetAll() {
  if (!confirm('确定要重新探索吗？所有已有的探索记录将被清空。')) return;
  AppState.clear();
  navigate('home');
}

function renderModuleMap() {
  const state = AppState.get();
  const path = state.path || [];
  const comp = state.completed || {};

  const modules = [
    { id: 'myths', icon: '🔍', name: '误区破除', desc: '五大思维误区', rec: path.includes('myths'), done: comp.myths },
    { id: 'values', icon: '🧭', name: '价值观探索', desc: '找到你的北极星', rec: path.includes('values'), done: comp.values },
    { id: 'strengths', icon: '💪', name: '擅长识别', desc: '发现你的独特优势', rec: path.includes('strengths'), done: comp.strengths },
    { id: 'passions', icon: '🔥', name: '喜欢探索', desc: '找到你的热情所在', rec: path.includes('passions'), done: comp.passions },
    { id: 'personality', icon: '🧩', name: '性格参考', desc: 'MBTI快速自评', rec: false, done: comp.personality },
    { id: 'cross', icon: '🎯', name: '交叉分析', desc: '公式收敛 · 找到方向', rec: false, done: comp.cross }
  ];

  const html = `
    <div class="page-header">
      <button class="back-btn" onclick="navigate('home')">← 返回首页</button>
      <h1>你的探索地图</h1>
      <p class="subtitle">${path.includes('myths') ? '建议先从误区破除开始，再依次探索' : '按推荐顺序或自由选择'}</p>
    </div>
    <div class="module-map">
      ${modules.map(m => `
        <div class="module-item ${m.rec ? 'recommended' : ''} ${m.done ? 'completed' : ''}"
             onclick="navigate('${m.id}')">
          <div class="module-icon">${m.icon}</div>
          <div class="module-name">${m.name}</div>
          <div style="font-size:12px;color:var(--gray-400);margin:4px 0;">${m.desc}</div>
          <div class="module-badge">${m.done ? '✓ 已完成' : m.rec ? '推荐优先' : ''}</div>
        </div>
      `).join('')}
    </div>
    <div style="text-align:center; margin-top:32px;">
      <button class="btn btn-outline" onclick="navigate('report')">查看PDF报告预览</button>
    </div>
    <div style="text-align:center; margin-top:16px;">
      <button style="background:var(--gray-100); color:var(--gray-500); border:1px solid var(--gray-200); padding:10px 28px; border-radius:8px; font-size:14px; cursor:pointer;" onclick="resetAll()">重新探索</button>
    </div>
  `;
  document.getElementById('page-modulemap').innerHTML = html;
}

/* ===== 误区破除 ===== */
const MYTHS = [
  { num: '误区一', myth: '必须是能坚持一生的事', truth: '真相：做现在最想做的事就可以了。想做的事可以变化，你在每个阶段积累的经验都会在下一件事上发挥作用。' },
  { num: '误区二', myth: '找到时会有命中注定的感觉', truth: '真相：即使找到了想做的事，一开始也只是感兴趣的阶段。热情需要时间去培养和验证，不需要一见钟情。' },
  { num: '误区三', myth: '必须是对别人有益的事', truth: '真相：为自己而活也是在帮助别人。强行压抑自己为别人努力，只是自我牺牲。真正可持续的贡献来自你真实的热情。' },
  { num: '误区四', myth: '多试试，总能碰到喜欢的', truth: '真相：了解自己才能找到想做的事。盲目尝试只是在消耗精力。自我认知是找到方向的前提。' },
  { num: '误区五', myth: '想做的事不能变成工作', truth: '真相：想做的事在你心中，实现手段在社会中。任何想做的事都有让它成为工作的方式，只是需要找到。' }
];

function renderMyths() {
  let html = `
    <div class="page-header">
      <button class="back-btn" onclick="navigate('modulemap')">← 模块地图</button>
      <h1>误区破除</h1>
      <p class="subtitle">点击每张卡片翻转，看看你是否也被这些思维定式困住</p>
    </div>`;

  MYTHS.forEach((m, i) => {
    html += `
      <div class="flip-card" id="flip-${i}" onclick="document.getElementById('flip-${i}').classList.toggle('flipped')">
        <div class="flip-card-inner">
          <div class="flip-card-front">
            <div class="myth-num">${m.num}</div>
            <div class="myth-text">${m.myth}</div>
            <div class="hint">点击翻转查看真相 →</div>
          </div>
          <div class="flip-card-back">${m.truth}</div>
        </div>
      </div>`;
  });

  html += `
    <div class="card" style="text-align:center;">
      <p style="font-size:14px; color:var(--gray-500); margin-bottom:12px;">你已理解这五个误区了吗？</p>
      <button class="btn btn-primary" onclick="completeMyths()">我已理解，继续</button>
    </div>`;

  document.getElementById('page-myths').innerHTML = html;
}

function completeMyths() {
  AppState.update({ myths: true }, 'completed');
  toast('误区破除完成 ✓');
  navigate('modulemap');
}

/* ===== 价值观探索 ===== */
const VALUE_QUESTIONS = [
  { id: 'vq1', q: '你尊敬的人是谁？尊敬他们什么特质？（你尊敬的特质往往是你内心看重的价值）', example: '例：我尊敬我的一位大学老师，他给本科生上课坚持用黑板板书，很少用PPT，不是照本宣科，而是真心在乎学生成长。' },
  { id: 'vq2', q: '小时候让你感到开心的事是什么？（童年的快乐常常指向你未被社会规训的真实需求）', example: '例：小时候暑假去外婆家，跟着她一起种菜浇水，看着种子发芽长大，每天起床第一件事就是跑去菜地看变化。' },
  { id: 'vq3', q: '你无法容忍的事是什么？（愤怒指向的往往是你希望改善的领域）', example: '例：明明有更高效的方法，却因为"一直都是这么干的"就拒绝改变。' },
  { id: 'vq4', q: '回顾人生，你最骄傲的时刻是什么？（骄傲的时刻揭示了你在意什么）', example: '例：高三下学期数学成绩很差，每天坚持刷题，遇到不理解的及时请教老师，高考数学成绩有很大提升。' },
  { id: 'vq5', q: '如果钱不是问题，你会用余生做什么？（这个问题帮你剥离外在约束，看到内核）', example: '例：开一间茶馆，听不同的人讲述自己的经历，哪怕不收钱也行。' }
];

function renderValues() {
  const state = AppState.get();
  const a = state.values.answers || {};
  const selected = state.values.selected || [];
  const top = state.values.top || [];
  const reasons = state.values.reasons || {};
  const purpose = state.values.purpose || '';
  const step = new URLSearchParams(window.location.hash.split('?')[1]).get('step') || '1';

  let html = `
    <div class="page-header">
      <button class="back-btn" onclick="navigate('modulemap')">← 模块地图</button>
      <h1>价值观探索</h1>
      <p class="subtitle">找到你生命中真正重要的事</p>
    </div>`;

  if (step === '1') {
    html += '<div class="card"><div class="card-title">第一步：回答5个问题</div><div class="card-desc">不用想太久，写下你脑海中最先出现的答案。</div>';
    VALUE_QUESTIONS.forEach(q => {
      html += `
        <div style="margin-bottom:16px;">
          <label style="font-size:14px;font-weight:500;color:var(--gray-700);display:block;margin-bottom:6px;">${q.q}</label>
          ${q.example ? `<p style="font-size:12px;color:var(--gray-400);margin-bottom:6px;">${q.example}</p>` : ''}
          <textarea class="textarea" id="va-${q.id}" placeholder="写下你的答案...">${a[q.id] || ''}</textarea>
        </div>`;
    });
    html += `<div style="text-align:center;margin-top:16px;">
      <button class="btn btn-primary" onclick="saveValueAnswers()">保存并进入下一步</button>
    </div></div>`;
  } else if (step === '2') {
    html += `<div class="card"><div class="card-title">第二步：提取价值观关键词</div>
      <div class="card-desc">从你的答案中，选出最能代表你看重的价值的词（可多选，也可自填）</div>
      <div class="check-grid">`;
    VALUES_POOL.forEach(v => {
      const checked = selected.some(s => s.word === v.word);
      html += `<div class="check-item ${checked ? 'checked' : ''}" onclick="toggleValue('${v.word}')">
        <span class="check-icon">✓</span> ${v.word}
      </div>`;
    });
    html += `</div>
      <div style="margin-top:12px;">
        <input class="input-text" id="custom-value" placeholder="自定义价值观..." />
        <button class="btn btn-outline" style="margin-top:8px;" onclick="addCustomValue()">添加</button>
      </div>
      <div style="text-align:center;margin-top:20px;">
        <button class="btn btn-outline" onclick="navigate('values?step=1')">← 上一步</button>
        <button class="btn btn-primary" style="margin-left:8px;" onclick="navigate('values?step=3')" ${selected.length === 0 ? 'disabled' : ''}>下一步 →</button>
      </div></div>`;
  } else if (step === '3') {
    html += `<div class="card"><div class="card-title">第三步：排序</div>
      <div class="card-desc">将选中的价值观拖入对应位置，选出最重要的5个</div>`;

    html += renderSortZone('最重要（选5个）', 'top', 5);
    html += renderSortZone('重要', 'mid', 99);
    html += renderSortZone('一般', 'low', 99);

    const sortedTop = (state.values.sorted && state.values.sorted.top) || [];
    html += `<div style="text-align:center;margin-top:20px;">
      <button class="btn btn-outline" onclick="navigate('values?step=2')">← 上一步</button>
      <button class="btn btn-primary" style="margin-left:8px;" onclick="saveValueSort()" ${sortedTop.length === 0 ? 'disabled' : ''}>下一步 →</button>
    </div></div>`;
  } else if (step === '4') {
    html += `<div class="card"><div class="card-title">第四步：价值观陈述（选填）</div>
      <div class="card-desc">对你选出的Top价值观，写下你为什么看重它</div>`;
    top.forEach(v => {
      html += `
        <div style="margin-bottom:12px;">
          <label style="font-size:14px;font-weight:600;color:var(--primary);">${v.word}</label>
          <textarea class="textarea" id="vr-${v.word}" placeholder="我为什么看重${v.word}...">${reasons[v.word] || ''}</textarea>
        </div>`;
    });
    html += `<div style="text-align:center;margin-top:16px;">
      <button class="btn btn-outline" onclick="navigate('values?step=3')">← 上一步</button>
      <button class="btn btn-outline" style="margin-left:8px;" onclick="navigate('values?step=5')">跳过</button>
      <button class="btn btn-primary" style="margin-left:8px;" onclick="saveValueReasons()">保存并继续 →</button>
    </div></div>`;
  } else if (step === '5') {
    html += `<div class="card"><div class="card-title">第五步：工作目的宣言</div>
      <div class="card-desc">基于你的价值观，完成这句话，形成你的工作目的</div>
      <p style="font-size:15px;color:var(--gray-700);margin-bottom:12px;">
        我希望通过工作，<input class="input-text" id="vp-purpose" style="width:120px;display:inline-block;" placeholder="动词" value="${purpose.split('，')[0] || ''}" />，
        <input class="input-text" id="vp-object" style="width:120px;display:inline-block;" placeholder="对象" value="${purpose.split('，')[1] || ''}" />，
        <input class="input-text" id="vp-value" style="width:140px;display:inline-block;" placeholder="带来什么价值" value="${purpose.split('，')[2] || ''}" />
      </p>
      <p style="font-size:12px;color:var(--gray-400);">例：我希望通过工作，<strong>支持</strong>迷茫的人，<strong>找到自己的人生方向</strong></p>
      <div style="text-align:center;margin-top:20px;">
        <button class="btn btn-outline" onclick="navigate('values?step=4')">← 上一步</button>
        <button class="btn btn-primary" style="margin-left:8px;" onclick="completeValues()">完成价值观探索</button>
      </div></div>`;
  }

  document.getElementById('page-values').innerHTML = html;
}

function renderSortZone(label, zone, max) {
  const state = AppState.get();
  const sorted = state.values.sorted || {};
  const items = sorted[zone] || [];

  // 获取未分配的
  const allSorted = [...(sorted.top||[]), ...(sorted.mid||[]), ...(sorted.low||[])];
  const selected = state.values.selected || [];
  const unsorted = selected.filter(s => !allSorted.some(a => a.word === s.word));

  let html = `<div class="sort-zone">
    <div class="sort-zone-label">${label} (${items.length}${max < 99 ? '/' + max : ''})</div>
    <div class="sort-items">`;
  items.forEach((item, idx) => {
    html += `<div class="sort-item">
      ${item.word}
      <span class="move-up" onclick="moveSortItem('${zone}',${idx},-1)">▲</span>
      <span class="move-down" onclick="moveSortItem('${zone}',${idx},1)">▼</span>
      <span style="cursor:pointer;color:var(--gray-400);margin-left:2px;" onclick="removeSortItem('${zone}',${idx})">×</span>
    </div>`;
  });
  html += `</div>`;

  if (unsorted.length > 0 && items.length < max) {
    html += `<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">
      ${unsorted.map(u => `<span class="sort-item" style="cursor:pointer;" onclick="addSortItem('${zone}','${u.word}')">+ ${u.word}</span>`).join('')}
    </div>`;
  }

  html += `</div>`;
  return html;
}

function toggleValue(word) {
  const state = AppState.get();
  const selected = state.values.selected || [];
  const idx = selected.findIndex(s => s.word === word);
  if (idx >= 0) selected.splice(idx, 1);
  else selected.push({ word });
  AppState.update({ selected }, 'values');
  renderValues();
}

function addCustomValue() {
  const input = document.getElementById('custom-value');
  const word = input.value.trim();
  if (!word) return;
  const selected = AppState.get().values.selected || [];
  if (selected.some(s => s.word === word)) { toast('该词已存在'); return; }
  selected.push({ word });
  AppState.update({ selected }, 'values');
  input.value = '';
  renderValues();
}

function addSortItem(zone, word) {
  const state = AppState.get();
  const sorted = state.values.sorted || {};
  if (!sorted[zone]) sorted[zone] = [];
  if (zone === 'top' && sorted[zone].length >= 5) { toast('最重要最多选5个'); return; }
  sorted[zone].push({ word });
  AppState.update({ sorted }, 'values');
  renderValues();
}

function removeSortItem(zone, idx) {
  const state = AppState.get();
  const sorted = state.values.sorted || {};
  sorted[zone].splice(idx, 1);
  AppState.update({ sorted }, 'values');
  renderValues();
}

function moveSortItem(zone, idx, dir) {
  const state = AppState.get();
  const sorted = state.values.sorted || {};
  const arr = sorted[zone] || [];
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= arr.length) return;
  [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
  AppState.update({ sorted }, 'values');
  renderValues();
}

function saveValueAnswers() {
  const answers = {};
  VALUE_QUESTIONS.forEach(q => {
    answers[q.id] = document.getElementById('va-' + q.id)?.value || '';
  });
  AppState.update({ answers }, 'values');
  navigate('values?step=2');
}

function saveValueSort() {
  const state = AppState.get();
  const sorted = state.values.sorted || {};
  const top = sorted.top || [];
  AppState.update({ top }, 'values');
  navigate('values?step=4');
}

function saveValueReasons() {
  const state = AppState.get();
  const reasons = {};
  (state.values.top || []).forEach(v => {
    reasons[v.word] = document.getElementById('vr-' + v.word)?.value || '';
  });
  AppState.update({ reasons }, 'values');
  navigate('values?step=5');
}

function completeValues() {
  const v = document.getElementById('vp-purpose')?.value || '';
  const o = document.getElementById('vp-object')?.value || '';
  const va = document.getElementById('vp-value')?.value || '';
  const purpose = v && o && va ? `${v}，${o}，${va}` : (v || o || va);
  AppState.update({ purpose }, 'values');
  AppState.update({ values: true }, 'completed');
  toast('价值观探索完成 ✓');
  navigate('modulemap');
}

/* ===== 擅长识别 ===== */
const STRENGTH_QUESTIONS = [
  { id: 'sq1', q: '你觉得充实的体验是什么？（充实的瞬间往往藏着你的擅长模式）', example: '例：考试之前的突击复习，十分充实。' },
  { id: 'sq2', q: '最近让你烦躁或心慌的是什么事？（让你烦躁的事，反过来说明你在意什么、你比别人敏锐什么）', example: '例：工作中要开始一个新项目，没有什么头绪，很烦。' },
  { id: 'sq3', q: '别人经常夸你什么？（别人眼中的你，常常是你自己视而不见的优势）', example: '例："你太有耐心了"——其实我只是觉得把事讲清楚是应该的。' },
  { id: 'sq4', q: '你做事时，有哪些是你无意识就会做的？（无意识的行为模式最接近你的天赋）', example: '例：拿到一个新东西，我会不由自主地琢磨"它为什么这么设计""还能怎么改进"。' },
  { id: 'sq5', q: '回顾过去，哪些事你做起来比大多数人都轻松？（你做起来轻松而别人吃力的事，就是你的擅长）', example: '例：学新软件从来不看教程，自己点一遍就全摸通了。' }
];

function renderStrengths() {
  const state = AppState.get();
  const a = state.strengths.answers || {};
  const selected = state.strengths.selected || [];
  const holland = state.strengths.holland || {};
  const step = new URLSearchParams(window.location.hash.split('?')[1]).get('step') || '1';

  let html = `
    <div class="page-header">
      <button class="back-btn" onclick="navigate('modulemap')">← 模块地图</button>
      <h1>擅长识别</h1>
      <p class="subtitle">发现你自然而然就比别人做得好的事</p>
    </div>`;

  if (step === '1') {
    html += '<div class="card"><div class="card-title">第一步：回答5个问题</div>';
    STRENGTH_QUESTIONS.forEach(q => {
      html += `<div style="margin-bottom:14px;">
        <label style="font-size:14px;font-weight:500;color:var(--gray-700);display:block;margin-bottom:6px;">${q.q}</label>
        ${q.example ? `<p style="font-size:12px;color:var(--gray-400);margin-bottom:6px;">${q.example}</p>` : ''}
        <textarea class="textarea" id="sa-${q.id}" placeholder="写下你的答案...">${a[q.id] || ''}</textarea>
      </div>`;
    });
    html += `<div style="text-align:center;margin-top:16px;">
      <button class="btn btn-primary" onclick="saveStrengthAnswers()">保存并进入下一步</button>
    </div></div>`;
  } else if (step === '2') {
    html += `<div class="card"><div class="card-title">第二步：识别你的擅长模式</div>
      <div class="card-desc">从你的答案中，选出最能描述你"无意识就做得好"的模式（可多选）</div>
      <div class="check-grid">`;
    STRENGTHS_POOL.forEach(s => {
      const checked = selected.some(x => x.word === s.word);
      html += `<div class="check-item ${checked ? 'checked' : ''}" onclick="toggleStrength('${s.word}')">
        <span class="check-icon">✓</span> ${s.word}
      </div>`;
    });
    html += `</div>
      <div style="font-size:12px;color:var(--gray-400);margin-top:8px;">提示：擅长模式不是技能，而是你无意识的思考/行为习惯</div>
      <div style="text-align:center;margin-top:20px;">
        <button class="btn btn-outline" onclick="navigate('strengths?step=1')">← 上一步</button>
        <button class="btn btn-primary" style="margin-left:8px;" onclick="saveStrengthsSelected()" ${selected.length === 0 ? 'disabled' : ''}>下一步 →</button>
      </div></div>`;
  } else if (step === '3') {
    html += `<div class="card"><div class="card-title">第三步：霍兰德六型自评</div>
      <div class="card-desc">每题1-5分评估，1=完全不符合，5=完全符合</div>`;
    HOLLAND_QUESTIONS.forEach(hq => {
      html += `<div style="margin-bottom:16px;"><div style="font-size:14px;font-weight:600;color:var(--primary);margin-bottom:4px;">${hq.typeName}（${hq.type}型）</div>`;
      hq.questions.forEach((q, qi) => {
        html += `<div class="likert-row">
          <div class="q-text">${q}</div>
          <div class="likert-scale">
            ${[1,2,3,4,5].map(v => `
              <div class="likert-btn ${(holland[hq.type+'_'+qi] || 0) === v ? 'selected' : ''}"
                   onclick="setHolland('${hq.type}_${qi}', ${v})">${v}</div>
            `).join('')}
          </div>
        </div>`;
      });
      html += `</div>`;
    });
    html += `<div style="text-align:center;margin-top:20px;">
      <button class="btn btn-outline" onclick="navigate('strengths?step=2')">← 上一步</button>
      <button class="btn btn-primary" style="margin-left:8px;" onclick="completeStrengths()">完成擅长识别</button>
    </div></div>`;
  }

  document.getElementById('page-strengths').innerHTML = html;
}

function toggleStrength(word) {
  const state = AppState.get();
  const selected = state.strengths.selected || [];
  const idx = selected.findIndex(s => s.word === word);
  if (idx >= 0) selected.splice(idx, 1);
  else selected.push({ word });
  AppState.update({ selected }, 'strengths');
  renderStrengths();
}

function saveStrengthAnswers() {
  const answers = {};
  STRENGTH_QUESTIONS.forEach(q => {
    answers[q.id] = document.getElementById('sa-' + q.id)?.value || '';
  });
  AppState.update({ answers }, 'strengths');
  navigate('strengths?step=2');
}

function saveStrengthsSelected() {
  const state = AppState.get();
  AppState.update({ top: state.strengths.selected.slice(0, 3) }, 'strengths');
  navigate('strengths?step=3');
}

function setHolland(key, val) {
  const state = AppState.get();
  const holland = state.strengths.holland || {};
  holland[key] = val;
  AppState.update({ holland }, 'strengths');
  renderStrengths();
}

function completeStrengths() {
  // 汇总霍兰德分数
  const state = AppState.get();
  const holland = state.strengths.holland || {};
  const scores = {};
  HOLLAND_QUESTIONS.forEach(hq => {
    const q1 = holland[hq.type + '_0'] || 0;
    const q2 = holland[hq.type + '_1'] || 0;
    scores[hq.type] = q1 + q2;
  });
  AppState.update({ holland: { ...holland, scores } }, 'strengths');
  AppState.update({ strengths: true }, 'completed');
  toast('擅长识别完成 ✓');
  navigate('modulemap');
}

/* ===== 喜欢探索 ===== */
const PASSION_QUESTIONS = [
  { id: 'pq1', q: '你现在有即使花钱也想学习的事情吗？（愿意花钱花时间的事，就是真喜欢）', example: '例：关于探索自己，人生规划、职业规划相关领域的知识。' },
  { id: 'pq2', q: '在你的书架上（或收藏夹里）最多的是什么类型的书/内容？（收藏夹不会骗人，它暴露了你最自然的注意力流向）', example: '例：视频博主讲"XX背后的原理"类——飞机餐为什么那么难吃、奶茶店怎么定价，这种我一看就停不下来。' },
  { id: 'pq3', q: '有没有遇到过让你产生"真是太好了！它拯救了我！"这种感觉的领域或事物？（拯救过你的事，往往是你最想传递给他人的）', example: '例：健身。曾经有段时间很消沉，开始规律运动后整个人状态都变了，现在虽然没那么多时间，但依然坚持慢跑或快走。' },
  { id: 'pq4', q: '你生活中想感谢的"工作"或"创造者"是谁？（你感谢的，往往就是你向往的）', example: '例：很感谢我关注的某个科普博主，他把复杂的科学原理讲得像故事一样，让我重新对"学习"这件事产生了兴趣。' },
  { id: 'pq5', q: '你会对社会中的什么现象感到愤怒？（愤怒指向的是你希望改善的领域）', example: '例：有一些不公平的现象发生，弱势群体难以发声，受到关注较少。' }
];

function renderPassions() {
  const state = AppState.get();
  const a = state.passions.answers || {};
  const selected = state.passions.selected || [];
  const ikigai = state.passions.ikigai || {};
  const step = new URLSearchParams(window.location.hash.split('?')[1]).get('step') || '1';

  let html = `
    <div class="page-header">
      <button class="back-btn" onclick="navigate('modulemap')">← 模块地图</button>
      <h1>喜欢探索</h1>
      <p class="subtitle">找到让你眼睛发光的领域</p>
    </div>`;

  if (step === '1') {
    html += '<div class="card"><div class="card-title">第一步：回答5个问题</div>';
    PASSION_QUESTIONS.forEach(q => {
      html += `<div style="margin-bottom:14px;">
        <label style="font-size:14px;font-weight:500;color:var(--gray-700);display:block;margin-bottom:6px;">${q.q}</label>
        ${q.example ? `<p style="font-size:12px;color:var(--gray-400);margin-bottom:6px;">${q.example}</p>` : ''}
        <textarea class="textarea" id="pa-${q.id}" placeholder="写下你的答案...">${a[q.id] || ''}</textarea>
      </div>`;
    });
    html += `<div style="text-align:center;margin-top:16px;">
      <button class="btn btn-primary" onclick="savePassionAnswers()">保存并进入下一步</button>
    </div></div>`;
  } else if (step === '2') {
    html += `<div class="card"><div class="card-title">第二步：兴趣领域归类</div>
      <div class="card-desc">从你的答案中，选出最让你感兴趣的领域（可多选）</div>
      <div class="check-grid">`;
    PASSIONS_POOL.forEach(p => {
      const checked = selected.some(x => x.word === p.word);
      html += `<div class="check-item ${checked ? 'checked' : ''}" onclick="togglePassion('${p.word}')">
        <span class="check-icon">✓</span> ${p.word}
      </div>`;
    });
    html += `</div>
      <div style="text-align:center;margin-top:20px;">
        <button class="btn btn-outline" onclick="navigate('passions?step=1')">← 上一步</button>
        <button class="btn btn-primary" style="margin-left:8px;" onclick="savePassionsSelected()" ${selected.length === 0 ? 'disabled' : ''}>下一步 →</button>
      </div></div>`;
  } else if (step === '3') {
    html += `<div class="card"><div class="card-title">第三步：IKIGAI 热情验证</div>
      <div class="card-desc">针对你选出的领域，快速验证热情的深度</div>`;
    IKIGAI_CHECKS.forEach((q, i) => {
      html += `<div class="likert-row">
        <div class="q-text">${q}</div>
        <div class="likert-scale">
          ${['是','倾向于是','不确定','倾向于否','否'].map((label, vi) => `
            <div class="likert-btn ${ikigai['ik'+i] === 5-vi ? 'selected' : ''}"
                 onclick="setIkigai('ik${i}', ${5-vi})" style="width:auto;padding:0 10px;border-radius:6px;">${label}</div>
          `).join('')}
        </div>
      </div>`;
    });
    html += `<div style="text-align:center;margin-top:20px;">
      <button class="btn btn-outline" onclick="navigate('passions?step=2')">← 上一步</button>
      <button class="btn btn-primary" style="margin-left:8px;" onclick="completePassions()">完成喜欢探索</button>
    </div></div>`;
  }

  document.getElementById('page-passions').innerHTML = html;
}

function togglePassion(word) {
  const state = AppState.get();
  const selected = state.passions.selected || [];
  const idx = selected.findIndex(s => s.word === word);
  if (idx >= 0) selected.splice(idx, 1);
  else selected.push({ word });
  AppState.update({ selected }, 'passions');
  renderPassions();
}

function savePassionAnswers() {
  const answers = {};
  PASSION_QUESTIONS.forEach(q => {
    answers[q.id] = document.getElementById('pa-' + q.id)?.value || '';
  });
  AppState.update({ answers }, 'passions');
  navigate('passions?step=2');
}

function savePassionsSelected() {
  const state = AppState.get();
  AppState.update({ top: state.passions.selected.slice(0, 3) }, 'passions');
  navigate('passions?step=3');
}

function setIkigai(key, val) {
  const state = AppState.get();
  const ikigai = state.passions.ikigai || {};
  ikigai[key] = val;
  AppState.update({ ikigai }, 'passions');
  renderPassions();
}

function completePassions() {
  AppState.update({ passions: true }, 'completed');
  toast('喜欢探索完成 ✓');
  navigate('modulemap');
}

/* ===== 性格参考 (MBTI) ===== */
const MBTI_DIMS = [
  { id: 'EI', q: '在社交场合中，你通常感觉：', options: [{v:'E',label:'精力充沛，享受与人交流'},{v:'I',label:'消耗能量，更喜欢独处或少人交流'}] },
  { id: 'SN', q: '在处理信息时，你更倾向于：', options: [{v:'S',label:'关注具体事实和细节'},{v:'N',label:'关注整体模式和可能性'}] },
  { id: 'TF', q: '在做决定时，你更依赖：', options: [{v:'T',label:'逻辑分析和客观标准'},{v:'F',label:'价值观和对人的影响'}] },
  { id: 'JP', q: '在生活方式上，你更喜欢：', options: [{v:'J',label:'有计划、有条理、喜欢确定'},{v:'P',label:'灵活、开放、喜欢留有余地'}] }
];

const MBTI_DESCS = {
  'INTJ': '建筑师——战略思维，独立，高标准',
  'INTP': '逻辑学家——创新，好奇，喜欢分析',
  'ENTJ': '指挥官——果断，领导力，目标导向',
  'ENTP': '辩论家——机智，善辩，喜欢挑战',
  'INFJ': '提倡者——理想主义，有深度，关心他人',
  'INFP': '调停者——富有同情心，创造力，追求意义',
  'ENFJ': '主人公——感染力，利他，善于激励',
  'ENFP': '竞选者——热情，自由精神，善于连接',
  'ISTJ': '物流师——可靠，务实，注重细节',
  'ISFJ': '守卫者——奉献，温暖，保护他人',
  'ESTJ': '总经理——高效，管理能力强，果断',
  'ESFJ': '执政官——关怀，社交，乐于助人',
  'ISTP': '鉴赏家——动手能力强，冷静，实用主义',
  'ISFP': '探险家——艺术感，灵活，活在当下',
  'ESTP': '企业家——精力充沛，敏锐，喜欢冒险',
  'ESFP': '表演者——自发，热情，享受生活'
};

function renderPersonality() {
  const state = AppState.get();
  const scores = state.personality.scores || {};
  const type = state.personality.type || '';

  let html = `
    <div class="page-header">
      <button class="back-btn" onclick="navigate('modulemap')">← 模块地图</button>
      <h1>性格参考（MBTI简要）</h1>
      <p class="subtitle">4个维度，快速了解你的性格倾向（仅供参考）</p>
    </div>`;

  MBTI_DIMS.forEach(dim => {
    html += `<div class="card">
      <div class="card-title">${dim.q}</div>
      <div class="diag-options">
        ${dim.options.map(o => `
          <div class="diag-option ${scores[dim.id] === o.v ? 'selected' : ''}"
               onclick="setMBTI('${dim.id}','${o.v}')">
            <div class="radio"></div> ${o.label}
          </div>
        `).join('')}
      </div>
    </div>`;
  });

  const allDone = MBTI_DIMS.every(d => scores[d.id]);
  if (type) {
    html += `<div class="card" style="text-align:center;">
      <div style="font-size:28px;font-weight:800;color:var(--primary);margin-bottom:8px;">${type}</div>
      <div style="font-size:14px;color:var(--gray-600);">${MBTI_DESCS[type] || ''}</div>
    </div>`;
  }

  html += `<div style="text-align:center;margin-top:16px;">
    <button class="btn btn-outline" onclick="navigate('modulemap')">← 模块地图</button>
    <button class="btn btn-primary" style="margin-left:8px;" ${allDone ? '' : 'disabled'}
            onclick="completePersonality()">保存并完成</button>
  </div>`;

  document.getElementById('page-personality').innerHTML = html;
}

function setMBTI(id, val) {
  const state = AppState.get();
  const scores = state.personality.scores || {};
  scores[id] = val;
  const type = (scores.EI||'')+(scores.SN||'')+(scores.TF||'')+(scores.JP||'');
  AppState.update({ scores, type: type.length===4 ? type : '' }, 'personality');
  renderPersonality();
}

function completePersonality() {
  AppState.update({ personality: true }, 'completed');
  toast('性格参考完成 ✓');
  navigate('modulemap');
}

/* ===== 交叉分析 ===== */
function renderCrossAnalysis() {
  const state = AppState.get();
  const valuesTop = (state.values.top || []).map(v => v.word);
  const strengthsTop = (state.strengths.top || []).map(s => s.word);
  const passionsTop = (state.passions.top || []).map(p => p.word);

  if (valuesTop.length === 0 || strengthsTop.length === 0 || passionsTop.length === 0) {
    document.getElementById('page-cross').innerHTML = `
      <div class="page-header">
        <button class="back-btn" onclick="navigate('modulemap')">← 模块地图</button>
        <h1>交叉分析</h1>
      </div>
      <div class="card" style="text-align:center;padding:40px;">
        <p style="font-size:16px;color:var(--gray-500);">请先完成价值观、擅长和喜欢三个核心模块</p>
        <button class="btn btn-primary" style="margin-top:16px;" onclick="navigate('modulemap')">前往模块地图</button>
      </div>`;
    return;
  }

  // 运行A1引擎
  const rawResults = ENGINE.match(valuesTop, strengthsTop, passionsTop);
  const results = rawResults.map(r => ENGINE.describe(r));

  // 获取落地建议
  const enhancedResults = results.map(r => ({
    ...r,
    paths: ENGINE.getPathSuggestions(r.field)
  }));

  // 保存结果
  if (!state.crossResults || state.crossResults.length === 0) {
    const merged = enhancedResults.map(r => ({ ...r, feel: '' }));
    AppState.update({ crossResults: merged });
  }

  const crossResults = AppState.get().crossResults || enhancedResults.map(r => ({ ...r, feel: '' }));
  const userMarks = AppState.get().crossUserMarks || {};

  let html = `
    <div class="page-header">
      <button class="back-btn" onclick="navigate('modulemap')">← 模块地图</button>
      <h1>交叉分析</h1>
      <p class="subtitle">喜欢 × 擅长 × 重要 = 真正想做的事</p>
    </div>

    <div class="cross-summary">
      <div class="cross-box values">
        <div class="box-label">🧭 价值观 Top 5</div>
        <div class="box-tags">${valuesTop.slice(0,5).map(v => `<span class="box-tag">${v}</span>`).join('')}</div>
      </div>
      <div class="cross-box strengths">
        <div class="box-label">💪 擅长模式 Top 3</div>
        <div class="box-tags">${strengthsTop.slice(0,3).map(s => `<span class="box-tag">${s}</span>`).join('')}</div>
      </div>
      <div class="cross-box passions">
        <div class="box-label">🔥 喜欢领域 Top 3</div>
        <div class="box-tags">${passionsTop.slice(0,3).map(p => `<span class="box-tag">${p}</span>`).join('')}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">🎯 候选方向</div>
      <div class="card-desc">以下是基于八木仁平公式 + 语义推理为你匹配的方向。选出最有感觉的。</div>`;

  crossResults.forEach((r, i) => {
    let feedbackHTML = '';
    if (r.feel === 'yes') {
      feedbackHTML = `
        <div class="feel-feedback feel-yes">
          <div class="ff-title">🔥 太好了！这个方向与你产生了共鸣</div>
          <p>当一个方向让你感到兴奋，说明它击中了「喜欢 × 擅长 × 重要」的交汇点。这份感觉本身就是重要信号。</p>
          <p><strong>下一步行动建议：</strong></p>
          <ul>
            <li>找一位在该领域工作的人聊一次（信息访谈），了解真实的日常</li>
            <li>用一周时间做一个小实验：写一篇文章 / 完成一个迷你项目 / 参与一次相关活动</li>
            <li>问自己：「如果我五年后回头看，会因为没尝试这个方向而后悔吗？」</li>
          </ul>
        </div>`;
    } else if (r.feel === 'maybe') {
      feedbackHTML = `
        <div class="feel-feedback feel-maybe">
          <div class="ff-title">🤔 不确定很正常——这说明值得进一步了解</div>
          <p>「不确定」往往不是因为方向不对，而是信息不够。在完全了解之前不做判断，本身就是一种智慧。</p>
          <p><strong>帮你理清思路的问题：</strong></p>
          <ul>
            <li>这个方向的哪部分吸引你？哪部分让你犹豫？把它们分别写下来</li>
            <li>如果去掉「害怕失败」和「别人怎么想」这两个因素，你的感觉会变吗？</li>
            <li>试着搜索这个领域的入门资源（一本书、一门课、一个社区），花 2 小时浅尝一下</li>
          </ul>
        </div>`;
    } else if (r.feel === 'no') {
      feedbackHTML = `
        <div class="feel-feedback feel-no">
          <div class="ff-title">排除也是收获</div>
          <p>知道自己「不想做什么」和知道自己「想做什么」同样重要。每一次排除都在缩小范围。</p>
          <p><strong>换个角度看：</strong></p>
          <ul>
            <li>回顾你「有感觉」的方向，它们的共性是什么？这可能比单个方向更重要</li>
            <li>考虑这个方向的相邻领域：有时候真正的匹配不在核心，而在边缘交叉处</li>
            <li>如果所有候选都没感觉，可能是某个模块的输入还不够精准——回到模块地图，重新审视价值观或擅长模块</li>
          </ul>
        </div>`;
    }

    html += `<div class="direction-card">
      <div class="dir-name">${r.field}</div>
      <div class="dir-formula">${r.formula}</div>
      ${r.fieldDesc ? `<div class="dir-desc">${r.fieldDesc}</div>` : ''}
      ${r.paths ? `<ul class="dir-paths">${r.paths.map(p => `<li>${p}</li>`).join('')}</ul>` : ''}
      <div class="feel-btns">
        <button class="btn ${r.feel === 'yes' ? 'btn-primary' : 'btn-outline'}" style="font-size:13px;padding:6px 14px;"
                onclick="markCross(${i}, 'yes')">✓ 有感觉</button>
        <button class="btn ${r.feel === 'maybe' ? 'btn-primary' : 'btn-outline'}" style="font-size:13px;padding:6px 14px;"
                onclick="markCross(${i}, 'maybe')">? 不确定</button>
        <button class="btn ${r.feel === 'no' ? 'btn-primary' : 'btn-outline'}" style="font-size:13px;padding:6px 14px;"
                onclick="markCross(${i}, 'no')">✗ 没感觉</button>
      </div>
      ${feedbackHTML}
    </div>`;
  });

  // AI增强选项
  html += `<div style="margin-top:16px;">
    <div class="toggle-wrap">
      <label class="toggle-switch">
        <input type="checkbox" id="ai-toggle" onchange="toggleAI()">
        <span class="toggle-slider"></span>
      </label>
      <span style="font-size:14px;color:var(--gray-600);">启用 AI 深度分析（需联网 + API密钥）</span>
    </div>
    <div id="ai-config" style="display:none;margin-top:8px;">
      <p style="font-size:12px;color:var(--gray-400);margin-bottom:6px;">选择API服务商（自动填充地址和推荐模型）</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
        <button class="btn btn-outline btn-sm" onclick="setAIProvider('aliyun')" id="ai-provider-aliyun">阿里云百炼</button>
        <button class="btn btn-outline btn-sm" onclick="setAIProvider('deepseek')" id="ai-provider-deepseek">DeepSeek</button>
        <button class="btn btn-outline btn-sm" onclick="setAIProvider('zhipu')" id="ai-provider-zhipu">智谱 GLM</button>
        <button class="btn btn-outline btn-sm" onclick="setAIProvider('custom')" id="ai-provider-custom">自定义</button>
      </div>
      <input class="input-text" id="ai-endpoint" value="https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions" style="margin-bottom:6px;" />
      <input class="input-text" id="ai-key" placeholder="输入 API Key..." style="margin-bottom:6px;" />
      <p style="font-size:12px;color:var(--gray-400);" id="ai-model-hint">推荐模型：qwen-plus</p>
      <button class="btn btn-primary" onclick="runAIAnalysis()">开始深度分析</button>
      <div id="ai-result" style="margin-top:12px;"></div>
    </div>
  </div>`;

  html += `<div style="text-align:center;margin-top:24px;">
    <button class="btn btn-primary btn-lg" onclick="completeCross()">完成交叉分析</button>
  </div></div>`;

  document.getElementById('page-cross').innerHTML = html;
}

function markCross(idx, feel) {
  const state = AppState.get();
  const results = state.crossResults || [];
  if (results[idx]) results[idx].feel = feel;
  AppState.update({ crossResults: results });
  renderCrossAnalysis();
}

function toggleAI() {
  const checked = document.getElementById('ai-toggle').checked;
  document.getElementById('ai-config').style.display = checked ? 'block' : 'none';
}

const AI_PROVIDERS = {
  aliyun:   { endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', model: 'qwen-plus', desc: '推荐模型：qwen-plus' },
  deepseek: { endpoint: 'https://api.deepseek.com/v1/chat/completions',          model: 'deepseek-chat', desc: '推荐模型：deepseek-chat' },
  zhipu:    { endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', model: 'glm-4-flash', desc: '推荐模型：glm-4-flash' },
  custom:   { endpoint: '', model: '', desc: '请手动填写地址和模型名' }
};

function setAIProvider(provider) {
  const p = AI_PROVIDERS[provider] || AI_PROVIDERS.custom;
  const ep = document.getElementById('ai-endpoint');
  ep.value = p.endpoint;
  ep.setAttribute('data-model', p.model);
  document.getElementById('ai-model-hint').textContent = p.desc;

  ['aliyun','deepseek','zhipu','custom'].forEach(k => {
    const btn = document.getElementById('ai-provider-' + k);
    if (btn) btn.className = k === provider ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
  });
}

async function runAIAnalysis() {
  const key = document.getElementById('ai-key').value.trim();
  const endpoint = document.getElementById('ai-endpoint')?.value.trim();
  const model = document.getElementById('ai-endpoint')?.getAttribute('data-model');
  if (!key) { toast('请输入API密钥'); return; }

  const state = AppState.get();
  const valuesTop = (state.values.top || []).map(v => v.word);
  const strengthsTop = (state.strengths.top || []).map(s => s.word);
  const passionsTop = (state.passions.top || []).map(p => p.word);

  AI_ENGINE.configure(key, endpoint || undefined, model || undefined);
  const resultEl = document.getElementById('ai-result');
  resultEl.innerHTML = '<p style="color:var(--gray-500);">正在分析中...</p>';

  try {
    const result = await AI_ENGINE.analyze(valuesTop, strengthsTop, passionsTop,
      (state.crossResults || []).slice(0, 5));

    let html = '<div class="card-title" style="margin-top:16px;">🤖 AI 深度分析结果</div>';
    result.directions.forEach(d => {
      html += `<div class="direction-card">
        <div class="dir-name">${d.name}</div>
        <div class="dir-desc">${d.reason}</div>
        <ul class="dir-paths">${d.paths.map(p => `<li>${p}</li>`).join('')}</ul>
      </div>`;
    });
    resultEl.innerHTML = html;
  } catch (err) {
    let errMsg = err.message;
    if (errMsg === 'Failed to fetch') {
      errMsg = '网络请求失败，请检查：1) API密钥是否正确 2) 网络连接是否正常 3) 是否被浏览器CORS策略拦截（可尝试用HTTP服务器方式打开而非直接双击文件）';
    }
    resultEl.innerHTML = `<p style="color:var(--danger);">分析失败：${errMsg}</p>`;
  }
}

function completeCross() {
  AppState.update({ cross: true }, 'completed');
  toast('交叉分析完成 ✓');
  navigate('report');
}

/* ===== 报告预览 ===== */
function renderReport() {
  const state = AppState.get();
  const valuesTop = (state.values.top || []);
  const strengthsTop = (state.strengths.top || []);
  const passionsTop = (state.passions.top || []);
  const crossResults = state.crossResults || [];

  let html = `
    <div class="page-header">
      <button class="back-btn" onclick="navigate('cross')">← 交叉分析</button>
      <h1>你的方向地图</h1>
      <p class="subtitle">真正想做的事探索报告 · 预览</p>
    </div>

    <div class="pdf-preview">
      <h2>我的方向地图</h2>
      <p style="text-align:center;font-size:14px;color:var(--gray-500);margin-bottom:24px;">
        真正想做的事探索报告 · ${new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric'})}
      </p>

      <div class="pdf-section">
        <h3>🧭 核心价值观 Top 5</h3>
        <div class="value">${valuesTop.map(v => v.word).join(' · ') || '尚未完成'}</div>
      </div>

      <div class="pdf-section">
        <h3>💪 擅长模式 Top 3</h3>
        <div class="value">${strengthsTop.map(s => s.word).join(' · ') || '尚未完成'}</div>
      </div>

      <div class="pdf-section">
        <h3>🔥 喜欢领域 Top 3</h3>
        <div class="value">${passionsTop.map(p => p.word).join(' · ') || '尚未完成'}</div>
      </div>`;

  if (crossResults.length > 0) {
    html += `<div class="pdf-section"><h3>🎯 交叉分析 · 候选方向</h3>`;
    crossResults.forEach(r => {
      html += `<div style="margin-bottom:10px;padding:10px 14px;border-radius:8px;background:${r.feel==='yes'?'#ECFDF5':'#F9FAFB'};border:1px solid ${r.feel==='yes'?'#059669':'#E5E7EB'};">
        <p style="font-size:15px;font-weight:600;margin:0 0 4px;">${r.field} ${r.feel==='yes'?'✓ 有感觉':''}</p>
        <p style="font-size:13px;color:#6B7280;margin:0;">${r.formula}</p>
      </div>`;
    });
    html += `</div>`;
  }

  html += `<div style="margin-top:24px;padding:16px;background:#EEF2FF;border-radius:10px;text-align:center;">
    <p style="font-size:14px;color:#4F46E5;margin:0;">
      下一步，你可以选择最有感觉的方向，找一件小事开始尝试。<br/>
      想做的事在心中，实现手段在社会中。
    </p>
  </div></div>

  <div style="text-align:center;margin-top:24px;">
    <button class="btn btn-primary btn-lg" onclick="PDFUtil.generate()">📄 导出PDF报告</button>
    <button class="btn btn-outline" style="margin-left:8px;" onclick="navigate('modulemap')">返回模块地图</button>
  </div>`;

  document.getElementById('page-report').innerHTML = html;
}

/* ===== 初始化 ===== */
function init() {
  // 创建所有页面容器
  const pages = ['home','diagnosis','modulemap','myths','values','strengths','passions','personality','cross','report'];
  const app = document.getElementById('app');

  pages.forEach(id => {
    const div = document.createElement('div');
    div.className = 'page';
    div.id = 'page-' + id;
    app.appendChild(div);
  });

  // 初始路由
  route();
}

document.addEventListener('DOMContentLoaded', init);
