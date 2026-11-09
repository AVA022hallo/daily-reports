/* =============================================================================
 * app.js v4 — 阶段内「概念 → 刷题 → 手写」三段式；只算工时，不排日历
 * 视图：路线图 / HDLBits / 能力矩阵 / 项目 / 岗位对照 / 数据复盘 / 设置
 * ========================================================================== */
(function () {
  'use strict';

  const META = window.FP_META, UNITS = window.FP_UNITS, FPC = window.FPC;
  if (!META || !UNITS || !FPC) {
    document.body.innerHTML = '<div style="padding:40px;font-family:sans-serif">数据文件加载失败：请确认 assets/ 下四个 js 文件都存在。</div>';
    return;
  }

  UNITS.forEach(u => {
    const ex = (META.unitRes || {})[u.id];
    if (ex && ex.length) u.res = Array.from(new Set((u.res || []).concat(ex)));
  });

  const UMAP = new Map(UNITS.map(u => [u.id, u]));
  const PHMAP = new Map(META.phases.map(p => [p.id, p]));
  const KEY = 'fpga-logic-plan.v2';
  const LEGACY_KEY = 'fpga-logic-plan.v1';

  let state = null, PLAN = null, PS = null, SK = null, HB = null, CORE = null;
  let HBMAP = new Map();
  let storageOK = true, uid = 0;

  /* ---------------------------------------------------------------- utils */
  const viewEl = () => document.getElementById('view');
  const TODAY = () => FPC.todayStr();
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pctOf = (a, b) => (b ? clamp(Math.round(a / b * 100), 0, 100) : 0);
  const md = s => (s || '').slice(5);
  const hh = v => FPC.fmtH(v);

  function toast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 3000);
  }

  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); toast('已复制：' + t); return; } catch (e) { /* fallback */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      toast('已复制：' + t);
    } catch (e2) { toast('复制失败，请手动复制：' + t); }
  }

  /* ---------------------------------------------------------------- storage */
  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) return JSON.parse(legacy);
      return null;
    } catch (e) { storageOK = false; return null; }
  }
  function saveState() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { storageOK = false; }
  }

  /* v2 → v3：P1/P2 重排后的 id 映射（只在 state.v < 3 时执行一次） */
  const UNIT_MAP = {
    'P1-01': 'P1-08', 'P1-02': 'P1-03', 'P1-03': 'P2-03', 'P1-04': 'P2-06', 'P1-05': 'P1-02',
    'P1-06': 'P1-04', 'P1-07': 'P1-05', 'P1-08': 'P1-06', 'P1-09': 'P1-07', 'P1-10': 'P2-09',
    'P1-11': 'P1-10', 'P1-12': 'P2-01', 'P1-13': 'P1-11', 'P1-14': 'P1-12',
    'P2-01': 'P2-02', 'P2-02': 'P2-03', 'P2-03': 'P2-04', 'P2-04': 'P2-07', 'P2-05': 'P2-14',
    'P2-06': 'P2-15', 'P2-07': 'P2-10', 'P2-08': 'P2-11', 'P2-09': 'P2-12', 'P2-10': 'P2-16',
    'P2-11': 'P2-17', 'P2-12': 'P2-18'
  };
  function migrateIds(s) {
    ['done', 'ratio', 'skip'].forEach(k => {
      const src = s.progress[k] || {}, out = {};
      Object.keys(src).forEach(id => { out[UNIT_MAP[id] || id] = src[id]; });
      s.progress[k] = out;
    });
  }

  function ensureShape(s) {
    const d = FPC.defaultState(META, TODAY());
    if (Number(s.v || 1) < 3) migrateIds(s);

    s.progress = Object.assign({}, d.progress, s.progress || {});
    ['done', 'ratio', 'skip', 'hb', 'jd'].forEach(k => {
      if (!s.progress[k] || typeof s.progress[k] !== 'object') s.progress[k] = {};
    });
    delete s.progress.auto;
    delete s.progress.notes;
    delete s.progress.logs;          // 每日工时不再使用手写时间
    META.hbGroups.forEach(g => g.items.forEach(it => {
      if (typeof s.progress.hb[it.id] !== 'number') s.progress.hb[it.id] = d.progress.hb[it.id] || 0;
    }));

    /* 题库自动完成的任务没有"完成动作"，这里补一个完成日期，否则它们进不了最近完成与每日统计 */
    const bootISO = TODAY();
    UNITS.forEach(u => {
      const list = FPC.hbOf(u);
      if (!list.length) return;
      const ok = list.every(x => Number(s.progress.hb[x.sec] || 0) >= x.until);
      if (ok && !s.progress.done[u.id]) s.progress.done[u.id] = { date: bootISO, hours: u.h, auto: true };
      if (!ok && s.progress.done[u.id] && s.progress.done[u.id].auto) delete s.progress.done[u.id];
    });

    s.settings = Object.assign({}, d.settings, s.settings || {});
    ['startDate', 'targetDate', 'studyDays', 'dayHours', 'pace', 'includeOptional', 'weekdayBlocks', 'weekendBlocks']
      .forEach(k => { delete s.settings[k]; });

    s.ui = Object.assign({}, d.ui, s.ui || {});
    if (s.ui.tab === 'today') s.ui.tab = 'road';
    s.v = 4;
    return s;
  }

  /* ---------------------------------------------------------------- derive */
  function recompute() {
    PLAN = FPC.buildPlan(META, UNITS);
    PS = FPC.planStats(PLAN, state);
    SK = FPC.skillScores(state, META, UNITS);
    CORE = FPC.coreProgress(state, META, UNITS);
    HB = FPC.hbAgg(state, META);
    HBMAP = new Map(HB.sections.map(s => [s.id, s]));
  }
  /* 题库计数变化后，同步"完成日期"记录：达标补记今天，退回则删掉 */
  function syncHbStamps(dateISO) {
    UNITS.forEach(u => {
      const list = FPC.hbOf(u);
      if (!list.length) return;
      const ok = list.every(x => Number(state.progress.hb[x.sec] || 0) >= x.until);
      if (ok) {
        if (!state.progress.done[u.id]) state.progress.done[u.id] = { date: dateISO || TODAY(), hours: u.h, auto: true };
      } else if (state.progress.done[u.id] && state.progress.done[u.id].auto) {
        delete state.progress.done[u.id];
      }
    });
  }

  function mutate(msg) {
    recompute(); saveState(); render();
    if (msg) toast(msg);
  }

  /* ---------------------------------------------------------------- atoms */
  const SEC_SHORT = {
    'hb-start': 'GettingStarted', 'hb-gates': 'Gates', 'hb-mux': 'MUX', 'hb-arith': 'Arith',
    'hb-kmap': 'KMap', 'hb-more': 'MoreVerilog', 'hb-tb': 'Testbench', 'hb-ff': 'FF',
    'hb-cnt': 'Counters', 'hb-shift': 'Shift', 'hb-morecirc': 'MoreCirc', 'hb-fsm': 'FSM',
    'hb-large': 'LargeCirc', 'hb-read': 'ReadSim'
  };
  const SEG_CLS = { C: 'b', D: 'g', B: 'r' };

  function resChips(keys) {
    return (keys || []).map(k => {
      const r = META.resources[k];
      if (!r) return '';
      if (r.url) return '<a class="chip b" href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.label) + ' ↗</a>';
      if (r.path) return '<button class="chip" data-act="copy" data-path="' + esc(r.path) + '" title="点击复制路径">' + esc(r.label) + ' ⧉</button>';
      return '<span class="chip v" title="' + esc(r.note || '') + '">' + esc(r.label) + '</span>';
    }).join('');
  }

  function segName(u) {
    const p = PHMAP.get(u.ph) || {};
    if (u.seg === 'B') return p.bName || '手写';
    if (u.seg === 'C') return p.cName || FPC.SEG_NAME.C;
    if (u.seg === 'D') return p.dName || FPC.SEG_NAME.D;
    return FPC.SEG_NAME[u.seg] || '';
  }
  function segChip(u) {
    return '<span class="chip ' + (SEG_CLS[u.seg] || '') + '">' + esc(segName(u)) + '</span>';
  }
  function phaseChip(u) {
    const p = PHMAP.get(u.ph); if (!p) return '';
    return '<span class="chip" style="color:' + p.color + ';border-color:' + p.color + '55">' + p.id + ' · ' + esc(p.name) + '</span>';
  }
  function preChips(u, onlyMissing) {
    const list = u.pre || [];
    if (!list.length) return '';
    return list.map(id => {
      const s = HBMAP.get(id); if (!s) return '';
      const ok = s.done >= s.total;
      if (onlyMissing && ok) return '';
      return '<span class="chip ' + (ok ? 'g' : 'y') + '" title="前置真题：' + esc(s.name) + '（' + s.done + '/' + s.total + '）">' +
        (ok ? '前置 ' : '⚠ 前置 ') + (SEC_SHORT[id] || esc(s.name)) + ' ' + s.done + '/' + s.total + '</span>';
    }).join('');
  }
  function hbStepper(sec, compact) {
    if (!sec) return '';
    return '<div class="stepper">' +
      '<button data-act="hb-" data-sec="' + sec.id + '" aria-label="减一">−</button>' +
      '<span class="val">' + sec.done + '/' + sec.total + '</span>' +
      '<button data-act="hb+" data-sec="' + sec.id + '" aria-label="加一">+</button>' +
      (compact ? '' : '<button data-act="hball" data-sec="' + sec.id + '" title="整章完成">全</button>') +
      '</div>';
  }

  function ringSVG(pct, opt) {
    opt = opt || {};
    const id = 'rg' + (++uid);
    const size = opt.size || 104, r = 52, c = 2 * Math.PI * r;
    const off = c * (1 - clamp(pct, 0, 100) / 100);
    return '<div class="ring-box" style="width:' + size + 'px;height:' + size + 'px">' +
      '<svg class="ring" viewBox="0 0 120 120" style="width:100%;height:100%">' +
        '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="' + (opt.c1 || '#e11d2b') + '"/>' +
          '<stop offset="1" stop-color="' + (opt.c2 || '#ff8a6a') + '"/>' +
        '</linearGradient></defs>' +
        '<circle class="track" cx="60" cy="60" r="' + r + '"/>' +
        '<circle class="fill" cx="60" cy="60" r="' + r + '" style="stroke:url(#' + id + ')"' +
          ' stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/>' +
      '</svg>' +
      '<div class="ring-center"><div class="num" style="font-size:' + (opt.fs || 23) + 'px">' + pct + '%</div>' +
      (opt.cap ? '<div class="cap">' + esc(opt.cap) + '</div>' : '') + '</div></div>';
  }

  /* ---------------------------------------------------------------- cards */
  function taskCard(u) {
    const done = FPC.unitDone(state, u), skipped = FPC.unitSkipped(state, u);
    const ratio = FPC.unitRatio(state, u);
    const secs = FPC.hbOf(u).map(x => HBMAP.get(x.sec)).filter(Boolean);

    let chips = segChip(u) + phaseChip(u);
    if (u.plat) chips += '<span class="chip b">' + esc(u.plat) + '</span>';
    /* 工时在右侧单独显示，避免重复 */
    if (u.pri === 3) chips += '<span class="chip v">加分</span>';
    if (u.opt) chips += '<span class="chip v">选做</span>';
    if (u.proj) chips += '<span class="chip y">' + esc(u.proj) + '</span>';
    if (ratio && !done) chips += '<span class="chip g">已完成 ' + Math.round(ratio * 100) + '%</span>';
    chips += preChips(u);

    return '<article class="task' + (done ? ' is-done' : '') + (u.opt ? ' opt' : '') + '">' +
      '<div class="task-h">' +
        '<button class="check" data-act="done" data-id="' + u.id + '" aria-label="标记完成">' + (done ? '✓' : '') + '</button>' +
        '<div style="flex:1;min-width:0">' +
          '<div class="task-t">' + u.id + '　' + esc(u.t) + '</div>' +
          '<div class="task-meta">' + chips + '</div>' +
        '</div>' +
        '<div class="task-hrs"><b>' + hh(u.h) + '</b><span>工时</span></div>' +
      '</div>' +
      '<div class="task-body">' +
        '<div class="task-line"><span class="lab">怎么做</span><span>' + esc(u.d) + '</span></div>' +
        '<div class="task-line"><span class="lab">验收</span><span>' + esc(u.chk) + '</span></div>' +
        '<div class="task-line"><span class="lab">产出</span><span>' + esc(u.out) + '</span></div>' +
        '<div class="task-line"><span class="lab">资源</span><span class="task-res">' + resChips(u.res) + '</span></div>' +
      '</div>' +
      '<div class="task-acts">' +
        '<button class="btn btn-mini ' + (done ? 'btn-ok' : 'btn-primary') + '" data-act="done" data-id="' + u.id + '">' + (done ? '✓ 已完成' : '标记完成') + '</button>' +
        '<button class="btn btn-mini' + (ratio ? ' btn-ok' : '') + '" data-act="half" data-id="' + u.id + '">' + (ratio ? '✓ 做了一半' : '只做一半') + '</button>' +
        '<button class="btn btn-mini btn-ghost" data-act="skip" data-id="' + u.id + '">' + (skipped ? '恢复' : '跳过') + '</button>' +
        (secs.length ? '<div class="hb-inline">' + secs.map(s => hbStepper(s, true)).join('') + '</div>' : '') +
      '</div>' +
      '</article>';
  }

  function unitRow(u) {
    const done = FPC.unitDone(state, u), skipped = FPC.unitSkipped(state, u);
    const secs = FPC.hbOf(u).map(x => HBMAP.get(x.sec)).filter(Boolean);
    const ratio = FPC.unitRatio(state, u);
    return '<div class="unit' + (done ? ' done' : '') + (skipped ? ' skip' : '') + '">' +
      '<button class="check" data-act="done" data-id="' + u.id + '" aria-label="完成">' + (done ? '✓' : '') + '</button>' +
      '<div style="min-width:0;flex:1">' +
        '<div class="u-t">' + u.id + '　' + esc(u.t) +
          (u.opt ? ' <span class="chip v" style="font-size:10px">选做</span>' : '') +
          (ratio && !done ? ' <span class="chip g" style="font-size:10px">' + Math.round(ratio * 100) + '%</span>' : '') + '</div>' +
        '<div class="u-s">' + esc(u.out) + '</div>' +
      '</div>' +
      '<div class="u-meta">' +
        preChips(u, true) +
        (secs.length ? secs.map(s => '<span class="chip b">' + s.done + '/' + s.total + '</span>').join('') : '') +
        '<span class="u-h">' + hh(u.h) + '</span></div>' +
      '</div>';
  }

  /* ---------------------------------------------------------------- top bar */
  function renderTop() {
    const a = document.getElementById('top-hours');
    if (a) a.querySelector('.tstat-v').textContent = hh(PS.totalH);
    document.getElementById('top-progress').querySelector('.tstat-v').textContent = PS.pct + '%';
    document.getElementById('top-load').querySelector('.tstat-v').textContent = hh(PS.remainH);
    document.getElementById('nav-progress-bar').style.width = PS.pct + '%';
    document.getElementById('nav-progress-label').textContent = '完成 ' + hh(PS.doneH) + ' / ' + hh(PS.totalH);
  }

  /* ---------------------------------------------------------------- roadmap */
  function viewRoad() {
    const nx = FPC.nextUnits(PLAN, state, 3);

    /* 阶段结构条 */
    const struct = PS.phases.map(p => {
      const segs = p.segs.map(s => {
        const w = p.hours ? (s.hours / p.hours * 100) : 0;
        return '<i class="s' + s.key + '" style="width:' + w.toFixed(1) + '%" title="' + esc(s.name) + ' ' + hh(s.hours) + '"></i>';
      }).join('');
      return '<div class="struct-row">' +
        '<div class="struct-lab" style="color:' + p.color + '"><b>' + p.id + '</b> ' + esc(p.name) + '</div>' +
        '<div class="struct-bar">' + segs + '</div>' +
        '<div class="struct-h">' + hh(p.hours) + '<span class="faint"> · ' + p.pct + '%</span></div>' +
        '</div>';
    }).join('');

    /* 阶段详情 */
    const phases = PS.phases.map(p => {
      const open = !!state.ui.openPhase[p.id];
      const segs = p.segs.map(s => {
        const rows = s.units.map(unitRow).join('');
        return '<div class="seg">' +
          '<div class="seg-h">' +
            '<span class="seg-k s' + s.key + '">' + esc(s.name) + '</span>' +
            '<span class="seg-meta">' + s.count + ' 项 · ' + hh(s.hours) + '</span>' +
            '<div class="seg-bar"><i class="s' + s.key + '" style="width:' + s.pct + '%"></i></div>' +
            '<span class="seg-pct">' + s.pct + '%</span>' +
          '</div>' +
          '<div class="seg-body">' + rows + '</div>' +
          '</div>';
      }).join('');

      return '<div class="phase' + (open ? ' open' : '') + '">' +
        '<div class="phase-h" data-act="phase" data-ph="' + p.id + '">' +
          '<span class="phase-dot" style="background:' + p.color + '"></span>' +
          '<span class="pn">' + p.id + '</span>' +
          '<span class="pt">' + esc(p.name) + '</span>' +
          '<span class="pw">' + p.count + ' 项 · ' + hh(p.hours) + '</span>' +
          '<span class="pp"><span class="pct">' + p.pct + '%</span><span class="caret">▶</span></span>' +
        '</div>' +
        '<div class="phase-bar"><i style="width:' + p.pct + '%;background:' + p.color + '"></i></div>' +
        '<div class="phase-b">' +
          '<div class="phase-goal">目标：' + esc(p.goal) + '</div>' +
          (p.path ? '<div class="phase-path"><span class="pp-k">学习路径</span>' + esc(p.path) + '</div>' : '') +
          '<div class="phase-cols">' +
            '<div><div class="pc-h">核心技能</div>' + p.core.map(x => '<div class="pc-i">' + esc(x) + '</div>').join('') + '</div>' +
            '<div><div class="pc-h">关键知识</div>' + p.knowledge.map(x => '<div class="pc-i">' + esc(x) + '</div>').join('') + '</div>' +
            '<div><div class="pc-h">出口标准</div>' + p.exit.map(x => '<div class="pc-i ok">✓ ' + esc(x) + '</div>').join('') + '</div>' +
          '</div>' +
          segs +
          '</div>' +
        '</div>';
    }).join('');

    const kpi = (k, v, s) => '<div class="card"><div class="kpi"><div class="k">' + k + '</div><div class="v">' + v + '</div><div class="d">' + s + '</div></div></div>';
    const coreHtml = CORE.map(c => {
      const typeCls = c.type === 'skill' ? 'r' : c.type === 'know' ? 'b' : 'y';
      const typeTxt = c.type === 'skill' ? '技能' : c.type === 'know' ? '知识' : '项目';
      return '<div class="core-item">' +
        '<div class="core-row"><span class="chip ' + typeCls + '" style="font-size:10px">' + typeTxt + '</span>' +
          '<b>' + esc(c.t) + '</b><span class="core-pct">' + c.done + '/' + c.total + '</span></div>' +
        '<div class="bar ' + (c.pct === 100 ? 'g' : '') + '" style="height:4px;margin:5px 0 3px"><i style="width:' + c.pct + '%"></i></div>' +
        '<div class="core-note">' + esc(c.note || '') + '</div>' +
        '</div>';
    }).join('');

    return '<div class="view-head"><div><h2>核心技能路线图</h2>' +
      '<div class="sub">' + PS.phases.length + ' 个阶段 · ' + PLAN.totalUnits + ' 项 · 总 ' + hh(PS.totalH) +
      '（概念 ' + hh(PS.bySeg.C.hours) + ' / 刷题 ' + hh(PS.bySeg.D.hours) + ' / 手写 ' + hh(PS.bySeg.B.hours) + '）' +
      ' · 已完成 ' + hh(PS.doneH) + '</div></div>' +
      '<div class="head-acts"><button class="btn btn-mini" data-act="expandall">全部展开</button>' +
      '<button class="btn btn-mini" data-act="collapseall">全部收起</button></div></div>' +
      '<div class="banner info">每个阶段固定 <b>概念 → 刷题（没有可跳过）→ 手写</b> 三段；<b>不排日历</b>，只按顺序做、只记工时。' +
      '手写的任务如果 HDLBits 里有对应章节，会标「前置」，建议先刷完再动手。</div>' +
      '<div class="grid g-kpi" style="margin-bottom:14px">' +
        kpi('总工时', hh(PS.totalH), '核心 ' + hh(PLAN.coreH) + ' + 选做 ' + hh(PLAN.optH)) +
        kpi('已完成', hh(PS.doneH), PS.doneCount + ' / ' + PS.totalUnits + ' 项') +
        kpi('剩余工时', hh(PS.remainH), PS.pct + '% 已完成') +
        kpi('三段构成', hh(PS.bySeg.C.hours) + ' / ' + hh(PS.bySeg.D.hours), '概念 / 刷题，手写 ' + hh(PS.bySeg.B.hours)) +
      '</div>' +
      '<div class="grid g-main" style="margin-bottom:14px">' +
        '<div class="card"><div class="card-h"><h3>下一步做什么</h3><span class="sp faint">按计划顺序取前 3 项（先概念、再刷题、后手写）</span></div>' +
          '<div class="stack-sm">' + (nx.length ? nx.map(taskCard).join('') : '<div class="empty">全部任务完成 🎉</div>') + '</div></div>' +
        '<div class="card"><div class="card-h"><h3>核心 15 项</h3><span class="sp faint">' + CORE.filter(c => c.pct === 100).length + '/' + CORE.length + ' 已达成</span></div>' +
          coreHtml + '</div>' +
      '</div>' +
      '<div class="card" style="margin-bottom:14px"><div class="card-h"><h3>阶段结构</h3>' +
        '<span class="sp faint"><span class="lg"><i class="sC"></i>概念</span> <span class="lg"><i class="sD"></i>刷题</span> <span class="lg"><i class="sB"></i>手写</span></span></div>' +
        struct + '</div>' +
      phases;
  }

  /* ---------------------------------------------------------------- hdlbits */
  function viewHb() {
    const left = HB.left;
    const hbUnits = UNITS.filter(u => FPC.hbOf(u).length);
    const restH = hbUnits.reduce((a, u) => a + (FPC.unitDone(state, u) ? 0 : u.h), 0);
    const groups = HB.groups.map(g => {
      const rows = g.items.map(s => {
        const sec = HBMAP.get(s.id);
        const done = sec.done >= sec.total;
        return '<div class="hb-sec' + (done ? ' done' : '') + '">' +
          '<div class="hb-name">' + (done ? '✓ ' : '') + '<span>' + esc(sec.name) + '</span>' +
            '<a href="' + FPC.hbUrl(sec.anchor) + '" target="_blank" rel="noopener">题 ↗</a></div>' +
          '<div class="hb-prog"><div class="bar c"><i style="width:' + sec.pct + '%"></i></div>' +
            '<span class="n">' + sec.done + '/' + sec.total + '</span></div>' +
          '<div class="stepper">' +
            '<button data-act="hb-" data-sec="' + sec.id + '">−</button>' +
            '<button data-act="hb+" data-sec="' + sec.id + '">+</button>' +
            '<button data-act="hball" data-sec="' + sec.id + '" title="整章完成">全</button>' +
          '</div></div>';
      }).join('');
      return '<div class="hb-group"><div class="hb-group-h"><span class="gt">' + esc(g.name) + '</span>' +
        '<span class="gc">' + g.done + ' / ' + g.total + '</span></div>' + rows + '</div>';
    }).join('');
    const nextSec = HB.sections.filter(s => s.left > 0 && s.gid !== 'start').slice(0, 3);

    return '<div class="view-head"><div><h2>HDLBits 题库进度</h2>' +
      '<div class="sub">已刷 ' + HB.done + ' / ' + HB.total + ' 题 · 剩 ' + left + ' 题 · 关联任务还剩 ' + hh(restH) + '</div></div>' +
      '<div class="head-acts"><a class="btn btn-primary" href="' + FPC.hbUrl('') + '" target="_blank" rel="noopener">打开 HDLBits ↗</a></div></div>' +
      '<div class="banner info">本页 <b>+ / −</b> 直接改章节进度；刷满题数后，标注了该章节的任务<b>自动完成</b>，不用两头记。</div>' +
      '<div class="grid g-main">' +
        '<div class="stack">' +
          '<div class="card"><div class="card-h"><h3>总进度</h3></div>' +
            '<div class="ring-wrap">' + ringSVG(HB.pct, { size: 128, cap: '题库', c1: '#0ea5e9', c2: '#67e8f9' }) +
            '<div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
              '<div class="kpi"><div class="k">已完成</div><div class="v">' + HB.done + '</div><div class="d">共 ' + HB.total + ' 题</div></div>' +
              '<div class="kpi"><div class="k">剩余</div><div class="v">' + left + '</div><div class="d">分散在 ' + hbUnits.filter(u => !FPC.unitDone(state, u)).length + ' 个任务里</div></div>' +
              '<div class="kpi"><div class="k">关联任务工时</div><div class="v">' + hh(restH) + '</div><div class="d">未完成部分</div></div>' +
              '<div class="kpi"><div class="k">当前章节</div><div class="v" style="font-size:15px">' + (nextSec[0] ? esc(nextSec[0].name) : '已全部完成') + '</div><div class="d">' + (nextSec[0] ? nextSec[0].done + '/' + nextSec[0].total : '') + '</div></div>' +
            '</div></div>' +
          '</div>' +
          '<div class="card">' + groups + '</div>' +
        '</div>' +
        '<div class="stack">' +
          '<div class="card"><div class="card-h"><h3>下一步刷什么</h3></div>' +
            (nextSec.length ? nextSec.map((s, i) => '<div class="nextrow"><span class="idx">' + (i + 1) + '</span>' +
              '<span style="flex:1">' + esc(s.name) + '</span><span class="faint mono">剩 ' + s.left + '</span></div>').join('')
              : '<div class="faint">题库刷完了，去刷第二遍错题。</div>') +
            '<div class="divider"></div><div class="faint" style="font-size:11.5px">刷题章节都挂在对应「概念」段之后、「手写」段之前；顺序按阶段里的排列来。</div>' +
          '</div>' +
          '<div class="card"><div class="card-h"><h3>分区题量</h3></div>' +
            HB.groups.map(g => '<div class="hb-group-h" style="margin-top:8px"><span class="gt" style="font-size:11.5px">' + esc(g.name) + '</span>' +
              '<span class="gc">' + g.done + '/' + g.total + '</span></div>' +
              '<div class="bar" style="height:5px"><i style="width:' + pctOf(g.done, g.total) + '%"></i></div>').join('') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /* ---------------------------------------------------------------- skills */
  function radarSVG(scores) {
    const W = 460, H = 400, cx = 230, cy = 186, R = 124;
    const n = scores.length;
    const ang = i => (-90 + i * 360 / n) * Math.PI / 180;
    const pt = (i, v) => [cx + Math.cos(ang(i)) * R * v / 100, cy + Math.sin(ang(i)) * R * v / 100];
    const poly = vals => vals.map((v, i) => pt(i, v).map(x => x.toFixed(1)).join(',')).join(' ');
    let grid = '';
    [25, 50, 75, 100].forEach(g => {
      grid += '<polygon points="' + poly(scores.map(() => g)) + '" fill="none" stroke="var(--line)" stroke-width="1"' +
        (g === 100 ? ' stroke-opacity=".9"' : ' stroke-dasharray="2 4"') + '/>';
    });
    let axes = '', labels = '';
    scores.forEach((s, i) => {
      const p = pt(i, 100), c = pt(i, 107);
      axes += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" stroke="var(--line)" stroke-width="1"/>';
      const cos = Math.cos(ang(i));
      const anchor = Math.abs(cos) < 0.25 ? 'middle' : cos > 0 ? 'start' : 'end';
      labels += '<text x="' + c[0].toFixed(1) + '" y="' + (c[1] + 3).toFixed(1) + '" text-anchor="' + anchor + '" font-size="11" fill="var(--text-2)">' +
        esc(s.short || s.name) + '</text>';
    });
    return '<svg class="radar" viewBox="0 0 ' + W + ' ' + H + '">' + grid + axes +
      '<polygon points="' + poly(scores.map(s => Math.min(100, s.target))) + '" fill="none" stroke="var(--cyan)" stroke-width="1.4" stroke-dasharray="5 4" opacity=".85"/>' +
      '<polygon points="' + poly(scores.map(s => s.score)) + '" fill="rgba(225,29,43,.18)" stroke="var(--accent)" stroke-width="1.8"/>' +
      scores.map((s, i) => { const p = pt(i, s.score); return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.6" fill="var(--accent)"/>'; }).join('') +
      labels + '</svg>';
  }

  function viewSkills() {
    const avg = Math.round(SK.reduce((a, s) => a + s.score, 0) / SK.length);
    const rows = SK.map(s => {
      const gap = s.target - s.score;
      return '<div class="skill-block">' +
        '<div class="skill-row">' +
          '<span class="sn">' + esc(s.name) + '</span>' +
          '<div class="bar"><i style="width:' + s.score + '%"></i><span class="tick" style="left:' + clamp(s.target, 0, 100) + '%"></span></div>' +
          '<span class="sv" style="color:' + (gap > 0 ? 'var(--warn)' : 'var(--ok)') + '">' + s.score + '</span>' +
        '</div>' +
        '<div class="skill-meta">目标 ' + s.target + (gap > 0 ? ' · 还差 ' + gap : ' · 已达标') +
          '　·　覆盖任务 ' + s.covered + '/' + s.total +
          (s.next ? '　·　下一步 <b>' + s.next.id + '</b> ' + esc(s.next.t) : '') + '</div>' +
        '<div class="pts">' + s.points.map(p => '<span class="pt">' + esc(p) + '</span>').join('') + '</div>' +
        '<div class="skill-how">' + esc(s.how) + '</div>' +
        '</div>';
    }).join('');

    return '<div class="view-head"><div><h2>能力矩阵</h2>' +
      '<div class="sub">8 项核心能力 + 关键知识点清单 · 当前均分 ' + avg + ' · 由已完成任务加权计算</div></div></div>' +
      '<div class="grid g-main">' +
        '<div class="card"><div class="card-h"><h3>能力雷达</h3><span class="sp faint">实线=当前　虚线=目标</span></div>' +
          radarSVG(SK) +
          '<div class="faint" style="text-align:center;font-size:11.5px;margin-top:6px">目标线按岗位 JD 与实习面试强度设定，不追求满分</div>' +
        '</div>' +
        '<div class="card"><div class="card-h"><h3>逐项拆解</h3></div>' + rows + '</div>' +
      '</div>' +
      '<div class="card" style="margin-top:14px"><div class="card-h"><h3>这些点要能被追问</h3></div>' +
        '<div class="faint" style="font-size:12px;margin-bottom:8px">上面每个「关键知识点」都需要能：一句话定义 → 一个手写例子 → 一个踩过的坑。做不到的，就去对应阶段的任务里补。</div>' +
        '<table class="stat-tbl"><thead><tr><th>能力</th><th>对应 JD</th><th>提升方式</th><th class="r">当前/目标</th></tr></thead><tbody>' +
        SK.map(s => '<tr><td>' + esc(s.name) + '</td><td class="faint">' + esc(s.jd) + '</td>' +
          '<td style="color:var(--text-2)">' + esc(s.how) + '</td><td class="r">' + s.score + ' / ' + s.target + '</td></tr>').join('') +
        '</tbody></table></div>';
  }

  /* ---------------------------------------------------------------- projects */
  function viewProj() {
    const cards = META.projects.map(p => {
      const ms = p.ms.map(m => {
        let ok = !!m.done;
        if (m.unit && UMAP.get(m.unit)) ok = FPC.unitDone(state, UMAP.get(m.unit));
        return '<div class="ms' + (ok ? ' ok' : '') + '"><span class="dot"></span><span>' + esc(m.t) +
          (m.unit ? ' <span class="faint mono" style="font-size:10px">' + m.unit + '</span>' : '') + '</span></div>';
      }).join('');
      const sk = (p.skills || []).map(id => {
        const s = SK.find(x => x.id === id);
        return s ? '<span class="chip" title="' + esc(s.name) + '">' + esc(s.short) + '</span>' : '';
      }).join('');
      const hrs = (p.ms || []).reduce((a, m) => {
        const u = m.unit ? UMAP.get(m.unit) : null;
        return a + (u ? u.h : 0);
      }, 0);
      return '<div class="proj">' +
        '<div class="proj-h"><div class="tag">' + esc(p.tag) + '　' + (p.state === 'done' ? '已交付' : '规划/进行中') + '</div>' +
          '<h3>' + esc(p.name) + '</h3><div class="goal">' + esc(p.goal) + '</div>' +
          '<div class="proj-skills">' + sk + (hrs ? '<span class="chip" style="margin-left:auto">里程碑 ≈ ' + hh(hrs) + '</span>' : '') + '</div></div>' +
        '<div class="proj-b">' + ms +
          (p.metric ? '<div class="metric"><b>验收指标：</b>' + esc(p.metric) + '</div>' : '') +
          (p.resume ? '<div class="resume"><b>简历一句话：</b>' + esc(p.resume) + '</div>' : '') +
        '</div>' +
        '<div class="proj-f">' + resChips(p.paths) + '</div>' +
      '</div>';
    }).join('');

    return '<div class="view-head"><div><h2>项目工程</h2>' +
      '<div class="sub">8 个项目支撑作品集：1 个已交付 + 5 个阶梯项目 + 1 个面试弹药包；每个都对应 JD 里的一句话</div></div></div>' +
      '<div class="banner info">项目不是另起炉灶：<b>P1/P2/P3 的模块会被 P4/P6 复用</b>，最后集成成一个 SoC 原型 + 验证平台，正好对上 JD「自研芯片技术原型和 FPGA 验证平台的构建和维护」。</div>' +
      '<div class="grid g2">' + cards + '</div>';
  }

  /* ---------------------------------------------------------------- jd */
  function viewJd() {
    const rows = META.jd.map(j => {
      const lv = Number((state.progress.jd || {})[j.id] || j.level || 0);
      const stars = [1, 2, 3, 4, 5].map(i =>
        '<button class="star' + (i <= lv ? ' on' : '') + '" data-act="jd" data-jd="' + j.id + '" data-v="' + i + '" title="自评 ' + i + ' 分">' + (i <= lv ? '★' : '☆') + '</button>').join('');
      const mods = (j.units || []).map(id => {
        const u = UMAP.get(id); if (!u) return '';
        return '<span class="chip' + (FPC.unitDone(state, u) ? ' g' : '') + '" title="' + esc(u.t) + '">' + id + '</span>';
      }).join('');
      return '<div class="jd-row">' +
        '<div class="jd-orig"><span class="jt">' + j.tag + '</span>' + esc(j.orig) + '</div>' +
        '<div class="jd-cov">' + esc(j.cover) + (mods ? '<div class="mods">' + mods + '</div>' : '') + '</div>' +
        '<div class="stars">' + stars + '</div>' +
        '</div>';
    }).join('');
    const avg = (META.jd.reduce((a, j) => a + Number((state.progress.jd || {})[j.id] || j.level || 0), 0) / META.jd.length).toFixed(1);

    return '<div class="view-head"><div><h2>岗位对照</h2>' +
      '<div class="sub">JD 原文 → 我们的覆盖方式 → 你自己打星（1~5），每月回看一次</div></div>' +
      '<div class="head-acts"><span class="chip">当前自评均值 ' + avg + ' / 5</span></div></div>' +
      '<div class="jd-legend"><span>★ = 完全没有准备</span><span>★★★ = 能讲但没项目支撑</span><span>★★★★★ = 有项目 + 数据 + 能抗追问</span></div>' +
      rows +
      '<div class="banner info" style="margin-top:14px">' + esc(META.jdNote) +
        '　JD 里最容易翻车的是 <b>SystemVerilog / VCS / Verdi / Vivado</b> 这些「没用过但要显得不陌生」的词——用选做池补认知，面试时诚实说「用 ModelSim 做过等价的事，VCS 的编译流程我理解为…」。</div>';
  }

  /* ---------------------------------------------------------------- stats */
  function viewStats() {
    const recs = FPC.doneRecords(state, UNITS).slice(0, 10);
    const recRows = recs.length ? recs.map(r =>
      '<div class="recent"><span class="mono faint">' + (r.date ? md(r.date) : '—') + '</span>' +
      '<span class="recent-t">' + r.id + '　' + esc(r.unit.t) + '</span>' +
      '<span class="mono faint">' + hh(r.hours) + '</span></div>').join('')
      : '<div class="faint">还没有完成记录。去「路线图」把第一项打勾。</div>';

    /* ---------- 每天干了多少（记录口径，不是排期） ---------- */
    const today = TODAY();
    const dmap = FPC.dayMap(state, UNITS);
    const totals = FPC.dayTotals(dmap);
    const days30 = FPC.lastNDays(dmap, today, 30);
    const last7 = days30.slice(-7);
    const wr = FPC.weekRange(today);
    const wk = FPC.sumRange(dmap, wr.from, today < wr.to ? today : wr.to);
    const todayH = dmap[today] ? dmap[today].hours : 0;
    const todayIds = dmap[today] ? dmap[today].tasks : [];
    const avg7 = FPC.round1(last7.reduce((x, d) => x + d.hours, 0) / 7);
    const stk = FPC.streak(dmap, today);
    const max30 = Math.max(1, ...days30.map(d => d.hours));

    /* 近 30 天柱图：SVG 画，避免 flex 高度在某些缩放/字体下塌陷 */
    const CW = 620, CH = 120, PADX = 4, PADB = 20, GAP = 3;
    const n30 = days30.length;
    const bw = (CW - PADX * 2 - GAP * (n30 - 1)) / n30;
    const topH = CH - PADB - 6;
    const bars = days30.map((d, i) => {
      const x = PADX + i * (bw + GAP);
      const hh2 = d.hours > 0 ? Math.max(2, topH * d.hours / max30) : 1.5;
      const y = CH - PADB - hh2;
      const fill = d.date === today ? '#e11d2b' : (d.hours > 0 ? '#38bdf8' : 'rgba(125,139,163,.35)');
      return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hh2.toFixed(1) +
        '" rx="1.5" fill="' + fill + '"><title>' + d.date + ' ' + d.wd + '：' + hh(d.hours) + '</title></rect>';
    }).join('');
    const ticks = days30.map((d, i) => (i % 7 === 0 || i === n30 - 1)
      ? '<text x="' + (PADX + i * (bw + GAP) + bw / 2).toFixed(1) + '" y="' + (CH - 5) + '" text-anchor="middle" font-size="9" fill="#8b97ab">' + d.date.slice(5) + '</text>'
      : '').join('');
    const dayChart = '<svg class="daychart" viewBox="0 0 ' + CW + ' ' + CH + '" role="img" aria-label="近 30 天每日投入">' +
      '<line x1="' + PADX + '" y1="' + (CH - PADB) + '" x2="' + (CW - PADX) + '" y2="' + (CH - PADB) + '" stroke="rgba(125,139,163,.35)" stroke-width="1"/>' +
      bars + ticks + '</svg>';

    const heatCells = FPC.heat(dmap, today, 18).rows.map(row => row.map(c =>
      '<div class="hm l' + c.lv + '" title="' + c.date + '：' + hh(c.hours) + '"></div>').join('')).join('');

    const week7 = last7.map(d => '<div class="wkline">' +
      '<span class="mono faint" style="width:88px;font-size:11px">' + md(d.date) + ' ' + d.wd + '</span>' +
      '<div class="bar" style="flex:1"><i style="width:' + pctOf(d.hours, Math.max(2, ...last7.map(x => x.hours))) + '%"></i></div>' +
      '<span class="mono" style="width:58px;text-align:right;font-size:11px">' + (d.hours ? hh(d.hours) : '—') + '</span></div>').join('');

    const todayList = todayIds.length ? todayIds.map(id => {
      const u = UMAP.get(id);
      return '<div class="recent"><span class="mono faint">' + md(today) + '</span>' +
        '<span class="recent-t">' + id + '　' + esc(u ? u.t : '') + '</span>' +
        '<span class="mono faint">' + hh(u ? u.h : 0) + '</span></div>';
    }).join('') : '<div class="faint">今天还没有完成任务：做完一个回「路线图」打勾，或去 HDLBits 把对应章节刷满。</div>';

    const segCards = ['C', 'D', 'B'].map(k => {
      const s = PS.bySeg[k];
      const nm = k === 'C' ? '概念' : k === 'D' ? '刷题' : '手写';
      return '<div class="card"><div class="card-h"><h3>' + nm + '</h3>' +
        '<span class="sp faint">' + s.count + ' 项 · ' + hh(s.hours) + '</span></div>' +
        '<div class="bar ' + (k === 'D' ? 'c' : k === 'B' ? '' : 'g') + '" style="height:8px"><i style="width:' + s.pct + '%"></i></div>' +
        '<div class="kpi" style="margin-top:8px"><div class="v" style="font-size:19px">' + hh(s.doneH) + ' <small>/ ' + hh(s.hours) + '</small></div>' +
        '<div class="d">' + s.pct + '% 完成 · ' + s.doneCount + '/' + s.count + ' 项</div></div></div>';
    }).join('');

    const phaseRows = PS.phases.map(p => '<tr><td><span style="color:' + p.color + '">' + p.id + '</span> ' + esc(p.name) + '</td>' +
      ['C', 'D', 'B'].map(k => {
        const s = p.segs.filter(x => x.key === k)[0];
        return '<td class="r">' + (s ? hh(s.hours) + '<span class="faint"> · ' + s.pct + '%</span>' : '<span class="faint">—</span>') + '</td>';
      }).join('') +
      '<td class="r">' + hh(p.hours) + '</td><td class="r">' + p.pct + '%</td></tr>').join('');

    return '<div class="view-head"><div><h2>数据复盘</h2>' +
      '<div class="sub">上面看总量（工时进度），下面看每天（今天 / 本周 / 近 30 天 / 18 周热力图）</div></div></div>' +

      '<div class="grid g-kpi" style="margin-bottom:12px">' +
        '<div class="card"><div class="kpi"><div class="k">总工时</div><div class="v">' + hh(PS.totalH) + '</div><div class="d">' + PS.totalUnits + ' 项</div></div></div>' +
        '<div class="card"><div class="kpi"><div class="k">已完成</div><div class="v">' + hh(PS.doneH) + '</div><div class="d">' + PS.doneCount + ' 项</div></div></div>' +
        '<div class="card"><div class="kpi"><div class="k">剩余</div><div class="v">' + hh(PS.remainH) + '</div><div class="d">' + (100 - PS.pct) + '% 未完成</div></div></div>' +
        '<div class="card"><div class="kpi"><div class="k">完成率</div><div class="v">' + PS.pct + '<small>%</small></div><div class="d">按工时加权</div></div></div>' +
      '</div>' +

      '<div class="grid g-kpi" style="margin-bottom:14px">' +
        '<div class="card hot"><div class="kpi"><div class="k">今天</div><div class="v">' + hh(todayH) + '</div><div class="d">' + (todayIds.length ? todayIds.length + ' 项完成' : '还没完成任何任务') + '</div></div></div>' +
        '<div class="card"><div class="kpi"><div class="k">本周（' + md(wr.from) + ' 起）</div><div class="v">' + hh(wk.hours) + '</div><div class="d">' + wk.days + ' 天有产出 · ' + wk.tasks + ' 项</div></div></div>' +
        '<div class="card"><div class="kpi"><div class="k">近 7 天日均</div><div class="v">' + avg7 + '<small>h</small></div><div class="d">近 7 天合计 ' + hh(FPC.round1(last7.reduce((x, d) => x + d.hours, 0))) + '</div></div></div>' +
        '<div class="card"><div class="kpi"><div class="k">连续投入</div><div class="v">' + stk + '<small>天</small></div><div class="d">累计 ' + totals.days + ' 天有产出 · ' + hh(totals.hours) + '</div></div></div>' +
      '</div>' +

      '<div class="grid g-main" style="margin-bottom:14px">' +
        '<div class="stack">' +
          '<div class="card"><div class="card-h"><h3>每日投入</h3><span class="sp faint">近 30 天 · 今天高亮 · 悬停看日期</span></div>' +
            dayChart +
            '<div class="dayaxis"><span>' + md(days30[0].date) + '</span><span>今天</span></div>' +
          '</div>' +
          '<div class="card"><div class="card-h"><h3>投入热力图</h3><span class="sp faint">最近 18 周 · 颜色越深投入越多</span></div>' +
            '<div class="heat">' + heatCells + '</div>' +
            '<div class="hm-legend"><span>少</span><i class="hm"></i><i class="hm l1"></i><i class="hm l2"></i><i class="hm l3"></i><i class="hm l4"></i><span>多</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="stack">' +
          '<div class="card hot"><div class="card-h"><h3>今天完成</h3><span class="sp mono faint">' + today + '</span></div>' +
            '<div class="kpi"><div class="v" style="font-size:26px">' + hh(todayH) + '</div>' +
            '<div class="d">' + (todayIds.length ? todayIds.length + ' 项任务' : '还没有完成记录') + '</div></div>' +
            '<div class="divider"></div>' + todayList +
            '<div class="divider"></div>' +
            '<div class="faint" style="font-size:11.5px">工时按「当天完成的任务」累计；HDLBits 章节刷满会自动完成任务，同样计入当天。</div>' +
          '</div>' +
          '<div class="card"><div class="card-h"><h3>近 7 天</h3><span class="sp faint">' + hh(FPC.round1(last7.reduce((x, d) => x + d.hours, 0))) + '</span></div>' + week7 + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="grid g3" style="margin-bottom:14px">' + segCards + '</div>' +
      '<div class="grid g-main">' +
        '<div class="stack">' +
          '<div class="card"><div class="card-h"><h3>阶段明细</h3><span class="sp faint">三段各自工时 · 完成率</span></div>' +
            '<table class="stat-tbl"><thead><tr><th>阶段</th><th class="r">概念</th><th class="r">刷题</th><th class="r">手写</th><th class="r">合计</th><th class="r">完成</th></tr></thead><tbody>' + phaseRows + '</tbody></table>' +
          '</div>' +
          '<div class="card"><div class="card-h"><h3>阶段工时构成</h3></div>' +
            PS.phases.map(p => '<div class="struct-row">' +
              '<div class="struct-lab" style="color:' + p.color + '"><b>' + p.id + '</b> ' + esc(p.name) + '</div>' +
              '<div class="struct-bar">' + p.segs.map(s => '<i class="s' + s.key + '" style="width:' + (p.hours ? s.hours / p.hours * 100 : 0).toFixed(1) + '%" title="' + esc(s.name) + ' ' + hh(s.hours) + '"></i>').join('') + '</div>' +
              '<div class="struct-h">' + hh(p.hours) + '</div></div>').join('') +
          '</div>' +
        '</div>' +
        '<div class="stack">' +
          '<div class="card"><div class="card-h"><h3>最近完成</h3><span class="sp faint">最近 ' + Math.min(10, PS.doneCount) + ' 条 / 共 ' + PS.doneCount + ' 项</span></div>' + recRows + '</div>' +
          '<div class="card"><div class="card-h"><h3>诊断</h3></div>' + diagnose() + '</div>' +
        '</div>' +
      '</div>';
  }

  function diagnose() {
    const out = [];
    if (!PS.doneCount) {
      out.push(['info', '还没有完成记录：从 P0 的「工具链与板卡自检」开始，1.5 h 就能把环境验通。']);
    } else {
      const c = PS.bySeg.C, d = PS.bySeg.D, b = PS.bySeg.B;
      if (c.pct < d.pct - 25) out.push(['warn', '「概念」段明显落后（' + c.pct + '% vs 刷题 ' + d.pct + '%）：可能是跳读直接刷题了，回头补关键知识会更省时间。']);
      if (b.pct < d.pct - 25) out.push(['warn', '「手写」段明显落后（' + b.pct + '% vs 刷题 ' + d.pct + '%）：刷题会了但没落到自己代码上，面试会吃亏。']);
      if (d.pct < b.pct - 25) out.push(['info', '刷题段落后于手写段：确认手写任务的前置章节是否都刷完了。']);
      out.push(['info', '已完成 ' + hh(PS.doneH) + '，还剩 ' + hh(PS.remainH) + '：按你在能力矩阵里最弱的一项目标，优先推进它所在的阶段。']);
    }
    const doneCore = CORE.filter(x => x.pct === 100).length;
    out.push(['info', '核心 15 项已达成 ' + doneCore + ' 项：' + (doneCore < 5 ? '先把「技能」类啃下来，它们决定面试下限。' : '接下来补「知识」与「项目」类，面试更看这个。')]);
    const slow = SK.filter(s => s.score < s.target - 25).sort((x, y) => (x.score - x.target) - (y.score - y.target)).map(s => s.short);
    if (slow.length) out.push(['warn', '缺口最大的能力：' + slow.slice(0, 3).join('、') + (slow.length > 3 ? ' 等' : '') + '。']);
    return out.map(x => '<div class="banner ' + (x[0] === 'good' ? 'good' : x[0] === 'warn' ? 'warn' : 'info') + '" style="margin-bottom:8px">' + x[1] + '</div>').join('');
  }

  /* ---------------------------------------------------------------- setup */
  function resLibrary() {
    const online = [], local = [], books = [];
    Object.keys(META.resources).forEach(k => {
      const r = META.resources[k];
      if (r.url && /^https?:/.test(r.url)) online.push(r);
      else if (r.path) local.push(r);
      else books.push(r);
    });
    const line = r => {
      if (r.url && /^https?:/.test(r.url)) return '<a class="resline" href="' + esc(r.url) + '" target="_blank" rel="noopener"><span>' + esc(r.label) + '</span><span class="faint">↗</span></a>';
      if (r.path) return '<button class="resline" data-act="copy" data-path="' + esc(r.path) + '"><span>' + esc(r.label) + '</span><span class="faint">⧉</span></button>';
      return '<div class="resline" title="' + esc(r.note || '') + '"><span>' + esc(r.label) + '</span><span class="faint">书/论文</span></div>';
    };
    return '<div class="res-grid">' +
      '<div><div class="pc-h">在线（可点开）</div>' + online.map(line).join('') + '</div>' +
      '<div><div class="pc-h">本机资料（点击复制路径）</div>' + local.map(line).join('') + '</div>' +
      '<div><div class="pc-h">书 / 论文</div>' + books.map(line).join('') +
        '<div class="faint" style="font-size:11px;margin-top:6px">书和论文没有稳定直链，按书名/标题搜即可；Cummings 的两篇是 CDC 与异步 FIFO 的经典，P3 阶段必看。</div></div>' +
      '</div>';
  }

  function viewSetup() {
    return '<div class="view-head"><div><h2>设置</h2><div class="sub">这份计划不排日历、不设每日配额；这里只管理数据和资料</div></div></div>' +
      '<div class="card"><div class="card-h"><h3>数据</h3><span class="sp ' + (storageOK ? 'chip g' : 'chip r') + '">' +
        (storageOK ? '本地存储正常' : '本地存储不可用') + '</span></div>' +
        '<div class="btn-row">' +
          '<button class="btn" data-act="export">导出进度 JSON</button>' +
          '<button class="btn" data-act="import">导入 JSON</button>' +
          '<button class="btn danger" data-act="reset">清空并重新开始</button>' +
        '</div>' +
        '<div class="faint" style="font-size:11.5px;margin-top:10px">数据存在浏览器 localStorage（键名 <code>' + KEY + '</code>）。<b>换电脑 / 清缓存前先导出 JSON</b>。' +
        '若提示存储不可用，在本目录双击 <code>start.cmd</code>，用 http://127.0.0.1:8777 打开。</div>' +
      '</div>' +
      '<div class="card" style="margin-top:14px"><div class="card-h"><h3>学习资源</h3><span class="sp faint">在线 ' +
        Object.keys(META.resources).filter(k => META.resources[k].url).length + ' 个 · 本机 ' +
        Object.keys(META.resources).filter(k => META.resources[k].path).length + ' 个</span></div>' + resLibrary() + '</div>' +
      '<div class="card" style="margin-top:14px"><div class="card-h"><h3>关于这份计划</h3></div>' +
        '<div style="font-size:12.5px;color:var(--text-2);line-height:1.75">' +
        '共 <b>' + PLAN.totalUnits + '</b> 个任务、<b>' + hh(PS.totalH) + '</b>；' + PS.phases.length + ' 个阶段，每个阶段固定 ' +
        '<b>概念 → 刷题（没有可跳过）→ 手写</b> 三段，段内按顺序执行，只累计工时、不排日期。' +
        '早期阶段的手写是小模块（四件套、计数器、FIFO），后期阶段的手写是综合项目（迷你 CPU、以太网通路、SoC 与验证平台）。<br>' +
        '工时构成：概念 ' + hh(PS.bySeg.C.hours) + ' · 刷题 ' + hh(PS.bySeg.D.hours) + ' · 手写 ' + hh(PS.bySeg.B.hours) +
        '（其中选做 ' + hh(PLAN.optH) + '，可在任务上标「跳过」，工时随之从剩余里扣）。<br>' +
        '每天投入在「数据复盘」里按「当天完成的任务」折算（HDLBits 自动完成的也算），不影响任务顺序。' + '<br>' +
        '<span class="faint">版本 ' + META.version + ' · 生成于 ' + META.updated + ' · 这只是一份把你的时间、资料、目标对齐的草稿。</span>' +
        '</div>' +
      '</div>';
  }

  /* ---------------------------------------------------------------- render */
  const VIEWS = { road: viewRoad, hb: viewHb, skills: viewSkills, proj: viewProj, jd: viewJd, stats: viewStats, setup: viewSetup };

  function render() {
    document.documentElement.dataset.theme = state.ui.theme === 'light' ? 'light' : 'dark';
    document.querySelectorAll('.navitem').forEach(b => b.classList.toggle('active', b.dataset.tab === state.ui.tab));
    renderTop();
    const fn = VIEWS[state.ui.tab] || viewRoad;
    viewEl().innerHTML = fn();
  }

  /* ---------------------------------------------------------------- events */
  function onNav(e) {
    const b = e.target.closest('.navitem');
    if (!b) return;
    state.ui.tab = b.dataset.tab;
    saveState(); render();
    try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (err) { /* ignore */ }
  }

  function onClick(e) {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;

    if (act === 'tab') {
      e.preventDefault();
      state.ui.tab = el.dataset.tab; saveState(); render();
      try { window.scrollTo({ top: 0 }); } catch (err) { /* ignore */ }
      return;
    }

    switch (act) {
      case 'done': {
        const u = UMAP.get(el.dataset.id); if (!u) return;
        const done = FPC.unitDone(state, u);
        const hbList = FPC.hbOf(u);
        if (hbList.length) {
          if (done) {
            let undone = false;
            hbList.forEach(x => {
              if (Number(state.progress.hb[x.sec] || 0) === x.until) {
                state.progress.hb[x.sec] = Math.max(0, x.until - 1); undone = true;
              }
            });
            syncHbStamps();
            if (undone) mutate('已撤销：' + u.id);
            else toast('这些章节的题量已超出本任务要求，请用 + / − 微调');
            return;
          }
          hbList.forEach(x => {
            state.progress.hb[x.sec] = Math.max(Number(state.progress.hb[x.sec] || 0), x.until);
          });
          syncHbStamps();
          mutate('✓ ' + u.id + ' 完成（HDLBits 已同步）');
          return;
        }
        if (done) { delete state.progress.done[u.id]; mutate('已撤销：' + u.id); }
        else {
          state.progress.done[u.id] = { date: TODAY(), hours: u.h };
          delete state.progress.ratio[u.id]; delete state.progress.skip[u.id];
          const miss = (u.pre || []).filter(id => { const s = HBMAP.get(id); return s && s.done < s.total; });
          mutate('✓ ' + u.id + ' 完成 · ' + hh(u.h) +
            (miss.length ? '（提示：前置 ' + miss.map(id => SEC_SHORT[id] || id).join('/') + ' 还没刷完）' : ''));
        }
        return;
      }
      case 'half': {
        const u = UMAP.get(el.dataset.id); if (!u) return;
        if (FPC.hbOf(u).length) { toast('HDLBits 任务用题目进度计数更准'); return; }
        const cur = FPC.unitRatio(state, u);
        if (cur) { delete state.progress.ratio[u.id]; mutate('已取消「一半」标记'); }
        else { state.progress.ratio[u.id] = 0.5; delete state.progress.done[u.id]; mutate('记一半：' + u.id + '（剩 ' + hh(u.h / 2) + '）'); }
        return;
      }
      case 'skip': {
        const u = UMAP.get(el.dataset.id); if (!u) return;
        if (state.progress.skip[u.id]) { delete state.progress.skip[u.id]; mutate('已恢复：' + u.id); }
        else { state.progress.skip[u.id] = TODAY(); delete state.progress.done[u.id]; delete state.progress.ratio[u.id]; mutate('已跳过：' + u.id + '（' + hh(u.h) + ' 不计入剩余）'); }
        return;
      }
      case 'hb+': case 'hb-': case 'hball': {
        const sec = HBMAP.get(el.dataset.sec); if (!sec) return;
        const cur = Number(state.progress.hb[sec.id] || 0);
        let v = cur;
        if (act === 'hb+') v = Math.min(sec.total, cur + 1);
        if (act === 'hb-') v = Math.max(0, cur - 1);
        if (act === 'hball') v = sec.total;
        state.progress.hb[sec.id] = v;
        syncHbStamps();
        mutate(sec.name + '：' + v + '/' + sec.total);
        return;
      }
      case 'phase': {
        const id = el.dataset.ph;
        state.ui.openPhase[id] = !state.ui.openPhase[id];
        saveState(); render(); return;
      }
      case 'expandall': META.phases.forEach(p => state.ui.openPhase[p.id] = true); saveState(); render(); return;
      case 'collapseall': state.ui.openPhase = {}; saveState(); render(); return;
      case 'copy': copyText(el.dataset.path); return;
      case 'jd': state.progress.jd[el.dataset.jd] = Number(el.dataset.v); saveState(); render(); return;

      case 'export': exportJSON(); return;
      case 'import': document.getElementById('file-import').click(); return;
      case 'reset': {
        if (!confirm('清空所有进度记录？建议先「导出进度 JSON」。此操作不可撤销。')) return;
        state = FPC.defaultState(META, TODAY());
        saveState(); recompute(); render(); toast('已重置');
        return;
      }
    }
  }

  function exportJSON() {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'fpga-plan-' + TODAY() + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
      toast('已导出 JSON');
    } catch (e) { toast('导出失败：' + e.message); }
  }

  function importJSON(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(String(r.result));
        if (!data || !data.progress) throw new Error('不是本工具导出的文件');
        state = ensureShape(data);
        saveState(); recompute(); render(); toast('已导入进度');
      } catch (err) { toast('导入失败：' + err.message); }
      e.target.value = '';
    };
    r.readAsText(f, 'utf-8');
  }

  /* ---------------------------------------------------------------- boot */
  function boot() {
    const loaded = loadState();
    state = loaded ? ensureShape(loaded) : FPC.defaultState(META, TODAY());
    recompute();
    saveState();          // 规范化后的状态（补完成日期、清掉旧字段）立即落盘

    if (!state.ui.openPhase || !Object.keys(state.ui.openPhase).length) {
      const first = PS.phases.find(p => p.pct < 100);
      if (first) state.ui.openPhase[first.id] = true;
    }

    document.querySelector('.sidenav').addEventListener('click', onNav);
    document.getElementById('btn-theme').addEventListener('click', () => {
      state.ui.theme = state.ui.theme === 'light' ? 'dark' : 'light';
      saveState(); render();
    });
    document.getElementById('btn-export').addEventListener('click', exportJSON);
    document.getElementById('btn-import').addEventListener('click', () => document.getElementById('file-import').click());
    document.getElementById('file-import').addEventListener('change', importJSON);
    viewEl().addEventListener('click', onClick);

    render();
  }

  window.__FP = { ensureShape: ensureShape, recompute: recompute, state: function () { return state; }, plan: function () { return PLAN; } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
