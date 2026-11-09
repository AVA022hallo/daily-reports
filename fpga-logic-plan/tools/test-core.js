/* Node 测试 v4：验证「阶段内 概念→刷题→手写 三段 + 只算工时」的计划模型 */
const path = require('path');
const base = path.join(__dirname, '..', 'assets');
require(path.join(base, 'data-meta.js'));
require(path.join(base, 'data-units.js'));
const FPC = require(path.join(base, 'core.js'));

const meta = globalThis.FP_META;
const units = globalThis.FP_UNITS;
let fails = 0;
function ok(cond, msg) {
  if (cond) console.log('  PASS  ' + msg);
  else { console.log('  FAIL  ' + msg); fails++; }
}

console.log('\n=== 数据完整性 ===');
ok(!!meta && !!units, '元数据与任务单元已加载');
ok(units.length >= 110, '任务单元数量 = ' + units.length);
const ids = new Set(); let dup = 0;
units.forEach(u => { if (ids.has(u.id)) dup++; ids.add(u.id); });
ok(dup === 0, '任务 id 无重复');
ok(units.every(u => ['C', 'D', 'B'].indexOf(u.seg) >= 0), '每项都有合法 seg（C/D/B）');
ok(units.filter(u => u.seg === 'C').length > 0 && units.filter(u => u.seg === 'D').length > 0 && units.filter(u => u.seg === 'B').length > 0,
  '三种段都有任务：C ' + units.filter(u => u.seg === 'C').length + ' / D ' + units.filter(u => u.seg === 'D').length + ' / B ' + units.filter(u => u.seg === 'B').length);
const resKeys = new Set(Object.keys(meta.resources));
const badRes = [];
units.forEach(u => (u.res || []).forEach(r => { if (!resKeys.has(r)) badRes.push(u.id + '->' + r); }));
ok(badRes.length === 0, '资源键全部存在' + (badRes.length ? '：' + badRes.join(',') : ''));
const phIds = new Set(meta.phases.map(p => p.id));
ok(units.every(u => phIds.has(u.ph)), '所有单元阶段合法');
const badCore = [];
meta.core.forEach(c => c.units.forEach(id => { if (!ids.has(id)) badCore.push(c.t + '->' + id); }));
ok(badCore.length === 0, '核心 15 项引用都存在');
const badJd = [];
meta.jd.forEach(j => (j.units || []).forEach(id => { if (!ids.has(id)) badJd.push(j.id + '->' + id); }));
ok(badJd.length === 0, 'JD 引用的任务都存在');
const badProj = [];
meta.projects.forEach(p => (p.ms || []).forEach(m => { if (m.unit && !ids.has(m.unit)) badProj.push(p.id + '->' + m.unit); }));
ok(badProj.length === 0, '项目里程碑引用的任务都存在');
const badPre = [];
const hbSecIds = new Set();
meta.hbGroups.forEach(g => g.items.forEach(i => hbSecIds.add(i.id)));
units.forEach(u => (u.pre || []).forEach(s => { if (!hbSecIds.has(s)) badPre.push(u.id + '->' + s); }));
ok(badPre.length === 0, '前置真题引用都存在');
ok(meta.phases.every(p => p.core && p.knowledge && p.exit && p.path), '每个阶段都有路径/核心技能/关键知识/出口标准');

console.log('\n=== 题库覆盖 ===');
const hb = FPC.hbAgg(FPC.defaultState(meta), meta);
ok(hb.total === 179 && hb.done === 34, '题库 179 题，已刷 34 题');
const covered = units.reduce((a, u) => a + FPC.hbOf(u).reduce((s, x) => s + x.until, 0), 0);
const fsmFirstBatch = units.reduce((a, u) => a + FPC.hbOf(u).filter(x => x.sec === 'hb-fsm' && x.until === 20).reduce((s, x) => s + x.until, 0), 0);
ok(covered - fsmFirstBatch === 145, '剩余 145 题全部绑到任务（覆盖 ' + (covered - fsmFirstBatch) + '）');

console.log('\n=== 计划结构：阶段内 概念 → 刷题 → 手写 ===');
const plan = FPC.buildPlan(meta, units);
ok(plan.phases.length === meta.phases.length, '阶段数 = ' + plan.phases.length);
ok(Math.abs(plan.totalH - units.reduce((a, u) => a + u.h, 0)) < 0.01, '总工时 = ' + plan.totalH + ' h');
ok(plan.order.length === units.length, '计划序列包含全部任务（' + plan.order.length + '）');
const orderBad = [];
plan.phases.forEach(p => {
  const seq = p.segs.map(s => s.key);
  const expect = FPC.SEG_ORDER.filter(k => seq.indexOf(k) >= 0);
  if (seq.join(',') !== expect.join(',')) orderBad.push(p.id + '：' + seq.join(','));
  if (!p.segs.some(s => s.key === 'B')) orderBad.push(p.id + ' 没有手写段');
  const sum = p.segs.reduce((a, s) => a + s.hours, 0);
  if (Math.abs(sum - p.hours) > 0.01) orderBad.push(p.id + ' 段工时加总不等于阶段工时');
});
ok(orderBad.length === 0, '每个阶段都是 C→D→B（缺刷题则跳过）' + (orderBad.length ? '：' + orderBad.join('；') : ''));
ok(plan.phases.filter(p => p.segs.some(s => s.key === 'D')).length >= 5, '有刷题段的阶段数 = ' + plan.phases.filter(p => p.segs.some(s => s.key === 'D')).length);
ok(plan.phases.some(p => !p.segs.some(s => s.key === 'D')), '存在没有刷题段的阶段（如体系结构），符合"没有可省略"');

console.log('\n=== 学习路径：真题在手写之前 ===');
(function () {
  const idx = new Map(plan.order.map((u, i) => [u.id, i]));
  const secTask = {};
  units.forEach(u => FPC.hbOf(u).forEach(x => { if (!secTask[x.sec]) secTask[x.sec] = u; }));
  const withPre = units.filter(u => u.pre && u.pre.length);
  const bad = [];
  withPre.forEach(u => u.pre.forEach(sec => {
    const cover = secTask[sec];
    if (!cover) { bad.push(u.id + ' 的前置 ' + sec + ' 无对应任务'); return; }
    if (!(idx.get(cover.id) < idx.get(u.id))) bad.push(u.id + ' 排在 ' + cover.id + ' 之前');
  }));
  ok(withPre.length >= 5, '带前置真题的手写任务 = ' + withPre.length);
  ok(bad.length === 0, '手写任务都排在对应真题之后' + (bad.length ? '：' + bad.join('；') : ''));
})();

console.log('\n=== 工时统计 ===');
const st = FPC.defaultState(meta);
let ps = FPC.planStats(plan, st);
ok(ps.doneH === 0 && ps.pct === 0, '初始完成 0 h / 0%');
ok(Math.abs(ps.remainH - ps.totalH) < 0.01, '初始剩余 = 总工时 ' + ps.remainH);
const segSum = FPC.SEG_ORDER.reduce((a, k) => a + ps.bySeg[k].hours, 0);
ok(Math.abs(segSum - ps.totalH) < 0.01, '三段工时加总 = 总工时（' + segSum + '）');
ok(!('daysLeft' in ps) && !('lastUsed' in ps), '统计结果里没有任何"天/日期"字段');

console.log('\n=== 完成 / 一半 / 跳过 ===');
const u1 = units[0];
st.progress.done[u1.id] = { date: '2026-11-05' };
ps = FPC.planStats(plan, st);
ok(Math.abs(ps.doneH - u1.h) < 0.01, '标记完成后已完成工时 = ' + ps.doneH + ' h');
ok(Math.abs(ps.remainH - (ps.totalH - u1.h)) < 0.01, '剩余工时相应减少');

const u2 = units[1];
st.progress.ratio[u2.id] = 0.5;
ps = FPC.planStats(plan, st);
ok(Math.abs(ps.doneH - FPC.round1(u1.h + u2.h / 2)) < 0.01, '「做一半」按 50% 计入（' + ps.doneH + ' h）');

const u3 = units[2];
st.progress.skip[u3.id] = '2026-11-05';
ps = FPC.planStats(plan, st);
ok(Math.abs(ps.skipH - u3.h) < 0.01, '跳过的工时单独统计 = ' + ps.skipH);
ok(Math.abs(ps.remainH - (ps.totalH - ps.doneH - ps.skipH)) < 0.01, '剩余 = 总 − 已完成 − 跳过');

console.log('\n=== HDLBits 联动 ===');
const hbUnit = units.filter(u => FPC.hbOf(u).length)[0];
const st2 = FPC.defaultState(meta);
ok(!FPC.unitDone(st2, hbUnit), '题目未刷完时任务未完成');
FPC.hbOf(hbUnit).forEach(x => { st2.progress.hb[x.sec] = x.until; });
ok(FPC.unitDone(st2, hbUnit), '刷满后任务自动完成');
ok(FPC.unitRemMin(st2, hbUnit) === 0, '自动完成后剩余工时为 0');

console.log('\n=== 下一步顺序 ===');
const st3 = FPC.defaultState(meta);
const nx = FPC.nextUnits(plan, st3, 6);
ok(nx.length === 6, '取到 6 项');
ok(nx[0].ph === plan.phases[0].id, '第一项来自第一个阶段（' + nx[0].id + '）');
ok(nx.filter(u => u.seg === 'C').length >= 2, '先给概念段任务（' + nx.map(u => u.seg).join('') + '）');
st3.progress.done[nx[0].id] = { date: '2026-11-05' };
const nx2 = FPC.nextUnits(plan, st3, 6);
ok(nx2[0].id !== nx[0].id, '完成一项后自动跳到下一项（' + nx2[0].id + '）');

console.log('\n=== 能力 / 核心项 / 记录 ===');
const sk = FPC.skillScores(st3, meta, units);
ok(sk.length === meta.skills.length, '能力项 = ' + sk.length);
ok(sk.every(s => s.score >= 0 && s.score <= 100), '能力分 0~100');
ok(sk.some(s => s.score > 0), '完成的任务能提升能力分');
const cp = FPC.coreProgress(st3, meta, units);
ok(cp.length === 15, '核心 15 项');
ok(cp.every(c => c.pct >= 0 && c.pct <= 100), '核心项进度合法');
st3.progress.done[units[3].id] = { date: '2026-11-06' };
const recs = FPC.doneRecords(st3, units);
ok(recs.length === 2 && recs[0].date >= recs[1].date, '完成记录按日期倒序');

console.log('\n=== 每日口径（记录，不是排期） ===');
(function () {
  const s = FPC.defaultState(meta);
  s.progress.done['P0-01'] = { date: '2026-11-05' };
  s.progress.done['P0-04'] = { date: '2026-11-05' };
  s.progress.hb['hb-start'] = 2;                          // P0-05 是题库任务，靠章节计数完成
  s.progress.done['P0-05'] = { date: '2026-11-06', auto: true };
  s.progress.logs = { '2026-11-04': { hours: 1.5 } };      // 旧字段：应被完全忽略
  const map = FPC.dayMap(s, units);
  ok(map['2026-11-05'].hours === 3, '11-05 = P0-01 + P0-04 = 3 h（实际 ' + map['2026-11-05'].hours + '）');
  ok(map['2026-11-05'].tasks.length === 2, '当天完成 2 项');
  ok(!map['2026-11-04'], '手写时间不再参与统计（旧 logs 被忽略）');
  const tot = FPC.dayTotals(map);
  ok(tot.days === 2 && Math.abs(tot.hours - 4) < 0.01, '有产出 2 天 / 共 4 h（11-05 3 + 11-06 1，实际 ' + tot.hours + '）');

  /* 题库自动完成的任务也要计入当天 */
  s.progress.hb['hb-kmap'] = 8;
  s.progress.done['P1-07'] = { date: '2026-11-06', auto: true };
  const map2 = FPC.dayMap(s, units);
  ok(map2['2026-11-06'].hours === 3, '11-06 = P0-05(1) + P1-07(2) = 3 h（实际 ' + map2['2026-11-06'].hours + '）');
  const recs2 = FPC.doneRecords(s, units);
  ok(recs2.some(r => r.id === 'P1-07' && r.date === '2026-11-06'), '题库自动完成的任务进了完成记录');
  const u107 = units.filter(u => u.id === 'P1-07')[0];
  ok(FPC.unitDone(s, u107), '章节刷满即完成');
  s.progress.hb['hb-kmap'] = 7;
  ok(!FPC.unitDone(s, u107), '章节退回后回到未完成（旧记录不伪造完成）');
  s.progress.hb['hb-kmap'] = 8;

  const wr = FPC.weekRange('2026-11-06');
  ok(wr.from === '2026-11-02' && wr.to === '2026-11-08', '本周区间 ' + wr.from + ' ~ ' + wr.to);
  const wk = FPC.sumRange(map, wr.from, '2026-11-06');
  ok(Math.abs(wk.hours - 4) < 0.01, '本周至今 = 4 h（实际 ' + wk.hours + '）');

  ok(FPC.streak(map2, '2026-11-06') === 2, '连续投入 2 天（实际 ' + FPC.streak(map2, '2026-11-06') + '）');
  ok(FPC.streak(map, '2026-11-20') === 0, '断档后连续天数为 0');

  const l7 = FPC.lastNDays(map, '2026-11-06', 7);
  ok(l7.length === 7 && l7[6].date === '2026-11-06', '近 7 天序列以今天结尾');
  ok(l7.filter(d => d.hours > 0).length === 2, '近 7 天有 2 天有产出');
  ok(Math.abs(FPC.round1(l7.reduce((a, d) => a + d.hours, 0) / 7) - 0.6) < 0.01, '近 7 天日均 0.6 h');

  const h = FPC.heat(map, '2026-11-06', 18);
  ok(h.cells.length === 126, '热力图 126 格');
  ok(h.cells.filter(c => c.hours > 0).length === 2, '热力图 2 格有值');
  ok(h.rows.length === 18 && h.rows[0].length === 7, '热力图按 18 周 × 7 天排布');
})();
console.log('\n=== 全部完成 ===');
const stAll = FPC.defaultState(meta);
meta.hbGroups.forEach(g => g.items.forEach(it => { stAll.progress.hb[it.id] = it.total; }));
units.forEach(u => { stAll.progress.done[u.id] = { date: '2026-11-05' }; });
const psAll = FPC.planStats(plan, stAll);
ok(Math.abs(psAll.doneH - psAll.totalH) < 0.01, '完成工时 = 总工时');
ok(psAll.remainH === 0 && psAll.pct === 100, '剩余 0 / 100%');
ok(FPC.nextUnits(plan, stAll, 3).length === 0, '没有下一步任务');
ok(FPC.coreProgress(stAll, meta, units).every(c => c.pct === 100), '核心 15 项全达成');

console.log('\n=== 结果 ===');
if (fails) { console.log('共 ' + fails + ' 项失败'); process.exit(1); }
console.log('全部通过 ✅');
