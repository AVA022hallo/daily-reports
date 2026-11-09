/* =============================================================================
 * core.js v4 — 计划内核（纯函数，浏览器 + Node 双用）
 * 设计要点：
 *   1. 不排日历、不算天数：每个阶段固定「概念 → 刷题（可省略）→ 手写」三段，
 *      只累计工时；顺序即执行顺序，做到哪算哪。
 *   2. 计划是派生出来的：只存进度（done / 一半 / 跳过 / HDLBits 计数），
 *      每次打开重新算各段工时与完成度。
 * ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FPC = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SEG_ORDER = ['C', 'D', 'B'];
  const SEG_NAME = { C: '概念', D: '刷题', B: '手写' };
  const pad = n => (n < 10 ? '0' + n : '' + n);
  const round1 = x => Math.round(x * 10) / 10;

  function s2d(s) { const p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2] || 1); }
  function d2s(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addDays(s, n) { const d = s2d(s); d.setDate(d.getDate() + n); return d2s(d); }
  function diffDays(a, b) { return Math.round((s2d(b) - s2d(a)) / 86400000); }
  function todayStr(now) { return d2s(now || new Date()); }
  const WD = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  function wdName(s) { return WD[s2d(s).getDay()]; }
  function cnDate(s) { const d = s2d(s); return (d.getMonth() + 1) + '月' + d.getDate() + '日'; }

  function fmtMin(m) {
    m = Math.max(0, Math.round(m));
    if (m < 60) return m + ' 分';
    const h = Math.floor(m / 60), r = m % 60;
    return r ? h + ' 时 ' + r + ' 分' : h + ' 时';
  }
  function fmtH(h) {
    if (h == null) return '—';
    const v = round1(h);
    return (Number.isInteger(v) ? v : v.toFixed(1)) + ' h';
  }

  /* ---------------------------------------------------------------- state */
  function defaultState(meta, nowISO) {
    return {
      v: 4,
      createdAt: nowISO || todayStr(),
      settings: {},
      progress: {
        done: {}, ratio: {}, skip: {},
        hb: Object.assign({}, meta.hbInit),
        jd: {},
        logs: {}
      },
      ui: { tab: 'road', theme: 'dark', openPhase: {}, showOpt: true }
    };
  }

  /* ---------------------------------------------------------------- hdlbits */
  function hbSections(meta) {
    const out = [];
    meta.hbGroups.forEach(g => g.items.forEach(it => out.push(Object.assign({ gid: g.id, gname: g.name }, it))));
    return out;
  }
  function hbAgg(state, meta) {
    const secs = hbSections(meta).map(s => {
      const got = Math.max(0, Math.min(s.total, Number(state.progress.hb[s.id] || 0)));
      return { id: s.id, gid: s.gid, gname: s.gname, name: s.name, total: s.total, done: got, anchor: s.anchor,
               pct: Math.round(got / s.total * 100), left: s.total - got };
    });
    const total = secs.reduce((a, s) => a + s.total, 0);
    const done = secs.reduce((a, s) => a + s.done, 0);
    const groups = meta.hbGroups.map(g => {
      const items = secs.filter(s => s.gid === g.id);
      return { id: g.id, name: g.name,
               done: items.reduce((a, s) => a + s.done, 0),
               total: items.reduce((a, s) => a + s.total, 0), items };
    });
    return { sections: secs, groups, done, total, pct: total ? Math.round(done / total * 100) : 0, left: total - done };
  }
  const HB_URL = 'https://hdlbits.01xz.net/wiki/Problem_sets';
  function hbUrl(anchor) { return anchor ? HB_URL + '#' + anchor : HB_URL; }

  /* ---------------------------------------------------------------- units */
  function hbOf(u) {
    if (!u || !u.hb) return [];
    return Array.isArray(u.hb) ? u.hb : [u.hb];
  }
  function hbUnitDone(state, u) {
    const list = hbOf(u);
    if (!list.length) return false;
    return list.every(x => Number(state.progress.hb[x.sec] || 0) >= x.until);
  }
  function unitDone(state, u) {
    if (hbOf(u).length) return hbUnitDone(state, u);   // 题库任务：只看章节计数
    return !!(state.progress.done && state.progress.done[u.id]);
  }
  function unitSkipped(state, u) { return !!(state.progress.skip && state.progress.skip[u.id]); }
  function unitRatio(state, u) { return Number((state.progress.ratio || {})[u.id] || 0); }
  function unitDoneHours(state, u) {
    if (unitDone(state, u)) return u.h;
    return u.h * Math.min(0.9, Math.max(0, unitRatio(state, u)));
  }
  function unitRemMin(state, u) {
    if (unitDone(state, u) || unitSkipped(state, u)) return 0;
    return Math.max(0, u.h * 60 * (1 - Math.min(0.9, Math.max(0, unitRatio(state, u)))));
  }

  /* ---------------------------------------------------------------- plan */
  /* 每个阶段固定三段：概念(C) → 刷题(D) → 手写(B)；段内保持数据顺序 */
  function buildPlan(meta, units) {
    const phases = meta.phases.map(p => {
      const us = units.filter(u => u.ph === p.id);
      const segs = SEG_ORDER.map(k => {
        const list = us.filter(u => u.seg === k);
        return {
          key: k,
          name: k === 'B' ? (p.bName || '手写实现') : (k === 'C' ? (p.cName || SEG_NAME.C) : (k === 'D' ? (p.dName || SEG_NAME.D) : SEG_NAME[k])),
          units: list,
          count: list.length,
          hours: round1(list.reduce((a, u) => a + u.h, 0))
        };
      }).filter(s => s.count > 0);
      return Object.assign({}, p, {
        segs: segs,
        count: us.length,
        hours: round1(us.reduce((a, u) => a + u.h, 0))
      });
    }).filter(p => p.count > 0);

    const order = [];
    phases.forEach(p => p.segs.forEach(s => s.units.forEach(u => order.push(u))));

    return {
      phases: phases,
      order: order,
      totalUnits: units.length,
      totalH: round1(units.reduce((a, u) => a + u.h, 0)),
      coreH: round1(units.filter(u => u.pri <= 2).reduce((a, u) => a + u.h, 0)),
      optH: round1(units.filter(u => u.opt).reduce((a, u) => a + u.h, 0))
    };
  }

  /* 完成度：阶段 / 段 / 全局，全部按工时算 */
  function planStats(plan, state) {
    const bySeg = {};
    SEG_ORDER.forEach(k => { bySeg[k] = { key: k, hours: 0, doneH: 0, count: 0, doneCount: 0 }; });

    const phases = plan.phases.map(p => {
      let pDoneH = 0, pDoneN = 0;
      const segs = p.segs.map(s => {
        let h = 0, n = 0;
        s.units.forEach(u => {
          h += unitDoneHours(state, u);
          if (unitDone(state, u)) n++;
          bySeg[s.key].hours += u.h;
          bySeg[s.key].doneH += unitDoneHours(state, u);
          bySeg[s.key].count++;
          if (unitDone(state, u)) bySeg[s.key].doneCount++;
        });
        pDoneH += h; pDoneN += n;
        return Object.assign({}, s, { doneH: round1(h), doneCount: n, pct: s.hours ? Math.round(h / s.hours * 100) : 0 });
      });
      return Object.assign({}, p, {
        segs: segs, doneH: round1(pDoneH), doneCount: pDoneN,
        pct: p.hours ? Math.round(pDoneH / p.hours * 100) : 0
      });
    });

    const skipped = units_skippedH(plan, state);
    let doneH = 0, doneCount = 0;
    Object.keys(bySeg).forEach(k => {
      bySeg[k].doneH = round1(bySeg[k].doneH);
      bySeg[k].hours = round1(bySeg[k].hours);
      bySeg[k].pct = bySeg[k].hours ? Math.round(bySeg[k].doneH / bySeg[k].hours * 100) : 0;
      doneH += bySeg[k].doneH; doneCount += bySeg[k].doneCount;
    });

    return {
      phases: phases,
      bySeg: bySeg,
      totalH: plan.totalH,
      doneH: round1(doneH),
      skipH: round1(skipped),
      remainH: round1(plan.totalH - doneH - skipped),
      pct: plan.totalH ? Math.round(doneH / plan.totalH * 100) : 0,
      totalUnits: plan.totalUnits,
      doneCount: doneCount
    };
  }

  function units_skippedH(plan, state) {
    let h = 0;
    plan.order.forEach(u => { if (unitSkipped(state, u)) h += u.h; });
    return h;
  }

  function nextUnits(plan, state, n) {
    const out = [];
    for (let i = 0; i < plan.order.length; i++) {
      const u = plan.order[i];
      if (unitDone(state, u) || unitSkipped(state, u)) continue;
      out.push(u);
      if (out.length >= n) break;
    }
    return out;
  }

  function phaseOf(plan, id) { return plan.phases.filter(p => p.id === id)[0] || null; }
  function segOf(plan, unit) {
    const p = phaseOf(plan, unit.ph);
    if (!p) return null;
    return p.segs.filter(s => s.key === unit.seg)[0] || null;
  }

  /* ---------------------------------------------------------------- core focus */
  function coreProgress(state, meta, units) {
    const byId = new Map(units.map(u => [u.id, u]));
    return (meta.core || []).map(c => {
      const us = (c.units || []).map(id => byId.get(id)).filter(Boolean);
      const done = us.filter(u => unitDone(state, u)).length;
      const next = us.filter(u => !unitDone(state, u) && !unitSkipped(state, u))[0] || null;
      return Object.assign({}, c, {
        done: done, total: us.length,
        pct: us.length ? Math.round(done / us.length * 100) : 0,
        next: next
      });
    });
  }

  /* ---------------------------------------------------------------- skills */
  function skillScores(state, meta, units) {
    return meta.skills.map(sk => {
      let doneW = 0, totalW = 0, covered = 0, total = 0;
      units.forEach(u => {
        const w = (u.sk || {})[sk.id];
        if (!w) return;
        totalW += w; total++;
        if (unitDone(state, u)) { doneW += w; covered++; }
        else if (unitRatio(state, u)) doneW += w * unitRatio(state, u);
      });
      const next = units.filter(u => (u.sk || {})[sk.id] && !unitDone(state, u) && !unitSkipped(state, u))
        .sort((a, b) => (a.pri - b.pri) || ((b.sk[sk.id]) - (a.sk[sk.id])))[0];
      return {
        id: sk.id, name: sk.name, short: sk.short || sk.name, target: sk.target,
        score: totalW ? Math.round(doneW / totalW * 100) : 0,
        jd: sk.jd, how: sk.how, points: sk.points || [],
        totalW: totalW, doneW: doneW, covered: covered, total: total,
        next: next || null
      };
    });
  }

  /* ---------------------------------------------------------------- records */
  function doneRecords(state, units) {
    const recs = [];
    units.forEach(u => {
      if (!unitDone(state, u)) return;
      const rec = (state.progress.done || {})[u.id] || {};
      recs.push({ id: u.id, unit: u, date: rec.date || '', hours: u.h, auto: !!rec.auto });
    });
    return recs.sort((a, b) => a.date < b.date ? 1 : -1);
  }

  /* ---------------------------------------------------------------- 每天干了多少 */
  /* 每天工时 = 当天「完成任务」的工时之和；如果手动补记了，就用补记值覆盖 */
  function dayMap(state, units) {
    const map = {};
    doneRecords(state, units).forEach(r => {
      if (!r.date) return;
      const d = map[r.date] || (map[r.date] = { date: r.date, doneH: 0, logH: null, tasks: [] });
      d.doneH += r.hours;
      d.tasks.push(r.id);
    });
    Object.keys(map).forEach(k => {
      const d = map[k];
      d.hours = round1(d.doneH);
      d.doneH = round1(d.doneH);
      d.manual = false;
    });
    return map;
  }

  function dayTotals(map) {
    let hours = 0, days = 0, tasks = 0;
    Object.keys(map).forEach(k => {
      if (map[k].hours > 0) { hours += map[k].hours; days++; tasks += map[k].tasks.length; }
    });
    return { hours: round1(hours), days: days, tasks: tasks };
  }

  function lastNDays(map, todayISO, n) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const iso = addDays(todayISO, -i);
      const d = map[iso];
      out.push({
        date: iso, wd: wdName(iso),
        hours: d ? d.hours : 0,
        doneH: d ? d.doneH : 0,
        manual: d ? d.manual : false,
        tasks: d ? d.tasks.slice() : []
      });
    }
    return out;
  }

  function weekRange(todayISO) {
    const wd = s2d(todayISO).getDay();
    const monday = addDays(todayISO, -(wd === 0 ? 6 : wd - 1));
    return { from: monday, to: addDays(monday, 6) };
  }

  function sumRange(map, from, to) {
    let hours = 0, days = 0, tasks = 0;
    let cur = from;
    let guard = 0;
    while (diffDays(cur, to) >= 0 && guard++ < 800) {
      const d = map[cur];
      if (d && d.hours > 0) { hours += d.hours; days++; tasks += d.tasks.length; }
      cur = addDays(cur, 1);
    }
    return { hours: round1(hours), days: days, tasks: tasks };
  }

  function streak(map, todayISO) {
    let d = todayISO, n = 0;
    const has = iso => !!(map[iso] && map[iso].hours > 0);
    if (!has(d)) d = addDays(d, -1);
    while (has(d) && n < 999) { n++; d = addDays(d, -1); }
    return n;
  }

  function heat(map, todayISO, weeks) {
    weeks = weeks || 18;
    const todayD = s2d(todayISO);
    const sunday = new Date(todayD.getTime());
    sunday.setDate(todayD.getDate() - todayD.getDay());
    const start = new Date(sunday.getTime());
    start.setDate(sunday.getDate() - (weeks - 1) * 7);
    const cells = [];
    for (let i = 0; i < weeks * 7; i++) {
      const d = new Date(start.getTime()); d.setDate(start.getDate() + i);
      const iso = d2s(d);
      const h = (map[iso] && map[iso].hours) || 0;
      let lv = 0;
      if (h > 0) lv = h < 1 ? 1 : h < 2 ? 2 : h < 3 ? 3 : 4;
      cells.push({ date: iso, hours: h, lv: lv, future: diffDays(iso, todayISO) < 0 });
    }
    const rows = [];
    for (let w = 0; w < weeks; w++) rows.push(cells.slice(w * 7, w * 7 + 7));
    return { cells: cells, rows: rows, start: d2s(start) };
  }

  /* ---------------------------------------------------------------- diff */
  function scheduleDiff(oldP, newP, units) { return null; }   // v4 不再重排，保留兼容
  function summarizeDiff() { return ''; }

  return {
    SEG_ORDER, SEG_NAME,
    s2d, d2s, addDays, diffDays, todayStr, wdName, cnDate, WD,
    fmtMin, fmtH, round1,
    defaultState,
    hbSections, hbAgg, hbUrl, hbUnitDone, hbOf,
    unitDone, unitSkipped, unitRatio, unitDoneHours, unitRemMin,
    buildPlan, planStats, nextUnits, phaseOf, segOf,
    coreProgress, skillScores, doneRecords,
    dayMap, dayTotals, lastNDays, weekRange, sumRange, streak, heat,
    scheduleDiff, summarizeDiff
  };
});
