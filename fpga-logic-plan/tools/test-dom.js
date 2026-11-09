/* jsdom 端到端测试 v4：真实执行 index.html，验证「概念→刷题→手写、只算工时」 */
const { JSDOM, VirtualConsole } = (function () {
  try { return require('./domtest/node_modules/jsdom'); } catch (e) { return require('jsdom'); }
})();

const URL_ = process.argv[2] || 'http://127.0.0.1:8765/index.html';
const errors = [];
const cssWarn = [];
let fails = 0;

function ok(cond, msg, extra) {
  if (cond) console.log('  PASS  ' + msg);
  else { console.log('  FAIL  ' + msg + (extra ? '  → ' + extra : '')); fails++; }
}

const vc = new VirtualConsole();
vc.on('jsdomError', e => {
  const m = String(e.message || e);
  if (/Not implemented: (Window's|window\.)\s*scrollTo/i.test(m)) return;
  if (/Could not parse CSS/i.test(m)) { cssWarn.push(m); return; }
  errors.push('jsdomError: ' + m);
});
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));
vc.on('warn', () => {}); vc.on('log', () => {});

(async () => {
  const dom = await JSDOM.fromURL(URL_, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window, d = w.document;
  await new Promise(r => { if (d.readyState === 'complete') r(); else w.addEventListener('load', r); });
  await new Promise(r => setTimeout(r, 400));

  const view = () => d.getElementById('view');
  const txt = () => (view().textContent || '').replace(/\s+/g, ' ');
  const click = el => { el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true })); };
  const nav = t => click(d.querySelector('.navitem[data-tab="' + t + '"]'));

  console.log('\n=== 启动 ===');
  ok(!!view(), '页面已挂载');
  ok(/核心技能路线图/.test(txt()), '默认进入路线图');
  ok(/总工时/.test(d.getElementById('top-hours').textContent), '顶部显示总工时：' + d.getElementById('top-hours').textContent.trim());
  ok(!/\d{4}-\d{2}-\d{2}/.test(txt()), '页面不出现具体日期（不按天安排）');
  ok(!/按周|倒计时|距目标|每天可投入/.test(txt()), '没有按周/倒计时/每日配额');

  console.log('\n=== 三段结构 ===');
  ok(view().querySelectorAll('.phase').length === 9, '阶段数 = ' + view().querySelectorAll('.phase').length);
  ok(view().querySelectorAll('.seg').length >= 20, '段落块 = ' + view().querySelectorAll('.seg').length);
  const segKinds = new Set(Array.from(view().querySelectorAll('.seg-k')).map(e => e.textContent.trim()));
  ok(segKinds.size >= 3, '至少三种段名：' + Array.from(segKinds).join(' / '));
  ok(/概念/.test(txt()) && /刷题/.test(txt()), '有「概念」「刷题」段');
  const p1 = Array.from(view().querySelectorAll('.phase')).find(p => /P1/.test(p.textContent));
  const p1segs = Array.from(p1.querySelectorAll('.seg-k')).map(e => e.textContent.trim());
  ok(p1segs.length >= 3 && p1segs[0].indexOf('概念') === 0, 'P1 段顺序：' + p1segs.join(' → '));
  ok(/学习路径/.test(p1.textContent), '阶段展开后有学习路径');
  const p4 = Array.from(view().querySelectorAll('.phase')).find(p => /P4/.test(p.textContent));
  const p4segs = Array.from(p4.querySelectorAll('.seg-k')).map(e => e.textContent.trim());
  ok(p4segs.length === 2, 'P4（无 HDLBits）只有两段：' + p4segs.join(' → '));

  console.log('\n=== 下一步 / 工时 ===');
  const cards = view().querySelectorAll('.task');
  ok(cards.length >= 1, '下一步任务卡 = ' + cards.length);
  ok(/怎么做/.test(cards[0].textContent) && /验收/.test(cards[0].textContent), '任务卡含怎么做/验收');
  ok(/工时/.test(cards[0].textContent), '任务卡标了工时');
  ok(!/\d{1,2}:\d{2}/.test(txt()), '没有"几点"');

  console.log('\n=== 完成交互 ===');
  const before = d.getElementById('top-progress').textContent;
  const fresh = view().querySelector('.task');
  click(fresh.querySelector('[data-act="done"]'));
  await new Promise(r => setTimeout(r, 150));
  const raw = w.localStorage.getItem('fpga-logic-plan.v2');
  ok(!!raw && raw.length > 100, 'localStorage 已写入 ' + (raw ? raw.length : 0) + ' 字节');
  const st = JSON.parse(raw);
  ok(st.v === 4, 'state 版本 = ' + st.v);
  ok(!('startDate' in (st.settings || {})) && !('dayHours' in (st.settings || {})), '旧版日期/时段设置已清除');
  ok(Object.keys(st.progress.done).length === 1, '完成记录落库：' + Object.keys(st.progress.done).join(','));
  ok(d.getElementById('top-progress').textContent !== before || /已完成/.test(view().textContent), '工时进度已更新');

  console.log('\n=== 逐个视图 ===');
  const tabs = [['hb', 'HDLBits'], ['skills', '能力矩阵'], ['proj', '项目工程'], ['jd', '岗位对照'], ['stats', '数据复盘'], ['setup', '设置'], ['road', '核心技能路线图']];
  for (const t of tabs) {
    nav(t[0]);
    await new Promise(r => setTimeout(r, 100));
    ok(txt().indexOf(t[1]) >= 0, t[0] + ' → 「' + t[1] + '」（' + view().innerHTML.length + ' 字符）');
    ok(errors.length === 0, t[0] + ' → 无脚本错误', errors[0]);
  }

  console.log('\n=== HDLBits ===');
  nav('hb'); await new Promise(r => setTimeout(r, 100));
  ok(view().querySelectorAll('.hb-sec').length === 18, '章节 = ' + view().querySelectorAll('.hb-sec').length);
  const n0 = view().querySelector('.hb-sec .n').textContent;
  click(view().querySelector('.hb-sec [data-act="hb+"]'));
  await new Promise(r => setTimeout(r, 120));
  ok(view().querySelector('.hb-sec .n').textContent !== n0, '题目计数可 +1（' + n0 + ' → ' + view().querySelector('.hb-sec .n').textContent + '）');
  // 把入门章节刷满（2/2），应自动完成 P0-05 并写入今天的日期
  click(view().querySelector('.hb-sec [data-act="hball"]'));
  await new Promise(r => setTimeout(r, 150));
  const stHb = JSON.parse(w.localStorage.getItem('fpga-logic-plan.v2'));
  ok(stHb.progress.done['P0-05'] && stHb.progress.done['P0-05'].auto, '题库刷满后自动写入完成记录');
  ok(/\d{4}-\d{2}-\d{2}/.test(stHb.progress.done['P0-05'].date || ''), '自动完成带日期：' + (stHb.progress.done['P0-05'] || {}).date);

  console.log('\n=== 能力矩阵 / 项目 / 岗位 ===');
  nav('skills'); await new Promise(r => setTimeout(r, 100));
  ok(!!view().querySelector('svg.radar'), '雷达图已渲染');
  ok(view().querySelectorAll('.skill-block').length === 8, '能力拆解块 = ' + view().querySelectorAll('.skill-block').length);
  nav('proj'); await new Promise(r => setTimeout(r, 100));
  ok(view().querySelectorAll('.proj').length === 8, '项目卡 = ' + view().querySelectorAll('.proj').length);
  nav('jd'); await new Promise(r => setTimeout(r, 100));
  ok(view().querySelectorAll('.jd-row').length === 8, 'JD 条目 = ' + view().querySelectorAll('.jd-row').length);

  console.log('\n=== 数据复盘 ===');
  nav('stats'); await new Promise(r => setTimeout(r, 100));
  ok(/总工时/.test(txt()) && /已完成/.test(txt()) && /剩余/.test(txt()), 'KPI 为工时口径');
  ok(/每日投入/.test(txt()), '有「每日投入」柱图');
  ok(view().querySelectorAll('.daychart rect').length === 30, '近 30 天柱数 = ' + view().querySelectorAll('.daychart rect').length);
  ok(view().querySelectorAll('.heat .hm').length === 126, '热力图 126 格 = ' + view().querySelectorAll('.heat .hm').length);
  ok(/P0-05/.test(txt()), '「今天完成」里能看到 HDLBits 自动完成的 P0-05');
  ok(/2\.5 h/.test(view().querySelector('.card.hot .kpi .v').textContent), '今日工时 = 2.5 h（P0-01 1.5 + P0-05 1，实际 ' + view().querySelector('.card.hot .kpi .v').textContent.trim() + '）');
  ok(/今天/.test(txt()) && /本周/.test(txt()) && /连续投入/.test(txt()), '有今天/本周/连续投入指标');
  ok(/阶段明细/.test(txt()), '有阶段明细表');
  ok(view().querySelectorAll('.struct-row').length > 0, '阶段工时构成条 = ' + view().querySelectorAll('.struct-row').length);
  ok(!/燃尽/.test(txt()), '计划侧没有燃尽图（不按天排期）');

  console.log('\n=== 每日口径 ===');
  const stD = JSON.parse(w.localStorage.getItem('fpga-logic-plan.v2'));
  ok(!('logs' in stD.progress) || !Object.keys(stD.progress.logs || {}).length, '状态里不再保存手写时间');
  ok(!view().querySelector('#log-hours'), '页面上没有「补记工时」输入框');
  ok(view().querySelectorAll('.recent').length >= 2, '最近完成/今天完成都有记录（' + view().querySelectorAll('.recent').length + ' 行）');

  console.log('\n=== 设置 ===');
  nav('setup'); await new Promise(r => setTimeout(r, 100));
  ok(!view().querySelector('input[type="date"]'), '没有日期输入框');
  ok(!view().querySelector('[data-set="dh"]') && !view().querySelector('.daychip'), '没有学习日/每日时长设置');
  ok(view().querySelectorAll('.resline').length > 30, '资源库条目 = ' + view().querySelectorAll('.resline').length);

  console.log('\n=== 无错误 ===');
  ok(cssWarn.length === 0, '无 CSS 解析告警', cssWarn.slice(0, 2).join(' | '));
  ok(errors.length === 0, '全程无 JS 错误', errors.slice(0, 3).join(' | '));

  console.log('\n=== 结果 ===');
  if (fails) console.log('共 ' + fails + ' 项失败');
  else console.log('全部通过 ✅');
  dom.window.close();
  setTimeout(() => process.exit(fails ? 1 : 0), 200);
})().catch(e => { console.error('测试崩溃：', e); process.exit(2); });
