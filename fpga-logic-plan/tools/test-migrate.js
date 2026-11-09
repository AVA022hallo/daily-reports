const { JSDOM } = require('./domtest/node_modules/jsdom');

const v1 = {
  v: 1,
  settings: { startDate:'2026-11-04', targetDate:'2027-03-15', studyDays:[1,2,3,4,5,6],
    weekdayBlocks:[{k:'m',minutes:30},{k:'e',minutes:120}], weekendBlocks:[{k:'a',minutes:150}],
    pace:'standard', includeOptional:true },
  progress: { done:{'P0-01':{date:'2026-11-04',minutes:90}}, ratio:{}, skip:{},
    hb:{'hb-basics':8,'hb-vectors':9,'hb-modules':9,'hb-procedures':8},
    logs:{'2026-11-04':{minutes:90}}, auto:{}, jd:{}, notes:{} },
  ui: { tab:'today', theme:'dark', openPhase:{} }
};
const v2 = {
  v: 2,
  settings: { startDate:'2026-11-05', targetDate:'2027-03-15', studyDays:[1,2,3,4,5,6],
    dayHours:{'0':0,'1':2,'6':5}, pace:'standard', includeOptional:true },
  progress: { done:{ 'P1-02':{date:'2026-11-06'}, 'P2-05':{date:'2026-11-30'} },
    ratio:{ 'P1-03':0.5 }, skip:{ 'P1-08':'2026-11-10' },
    hb:{'hb-basics':8,'hb-vectors':9,'hb-modules':9,'hb-procedures':8,'hb-more':7}, jd:{} },
  ui: { tab:'road' }
};
const v3 = {
  v: 3,
  settings: {},
  progress: { done:{ 'P1-08':{date:'2026-11-06'} }, ratio:{}, skip:{}, hb:{}, jd:{} },
  ui: { tab:'road' }
};

(async () => {
  const dom = await JSDOM.fromURL('http://127.0.0.1:8765/index.html', { runScripts:'dangerously', resources:'usable', pretendToBeVisual:true });
  const w = dom.window;
  await new Promise(r => w.addEventListener('load', r));
  await new Promise(r => setTimeout(r, 400));

  const a = w.__FP.ensureShape(JSON.parse(JSON.stringify(v1)));
  console.log('[v1→v4] v:', a.v, '| 日期设置已删:', !('startDate' in a.settings) && !('dayHours' in a.settings), '| tab:', a.ui.tab);
  console.log('[v1→v4] 旧打卡日志已丢弃（每日改按完成任务算）:', !('logs' in a.progress));
  console.log('[v1→v4] done 保留:', JSON.stringify(a.progress.done));

  const b = w.__FP.ensureShape(JSON.parse(JSON.stringify(v2)));
  console.log('[v2→v4] v:', b.v, '| done 键:', Object.keys(b.progress.done).join(','), '（P1-02→P1-03、P2-05→P2-14；P1-08 是题库自动完成，补了日期）');
  console.log('[v2→v4] ratio:', Object.keys(b.progress.ratio).join(','), '（应为 P2-03） | skip:', Object.keys(b.progress.skip).join(','), '（应为 P1-06）');
  console.log('[v2→v4] dayHours 已删:', !('dayHours' in b.settings));

  const c = w.__FP.ensureShape(JSON.parse(JSON.stringify(v3)));
  console.log('[v3→v4] v:', c.v, '| done 键不变:', Object.keys(c.progress.done).join(','), '（应为 P1-08）');

  const d = w.__FP.ensureShape(JSON.parse(JSON.stringify(b)));
  console.log('[幂等] done 键一致:', Object.keys(d.progress.done).join(',') === Object.keys(b.progress.done).join(','));
  w.close(); setTimeout(()=>process.exit(0),150);
})();
