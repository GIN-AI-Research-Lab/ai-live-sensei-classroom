// prof.mjs — CPU profile (CDP Profiler) quanh mot nhip: node prof.mjs --bai N5-1 --tu 1 --giay 6
import { moServer, moChrome, Trang, donDep, sleep } from './cdp-lib.mjs';
const A = {}; const av = process.argv.slice(2);
for (let i = 0; i < av.length; i += 2) A[av[i].replace(/^--/, '')] = av[i + 1];
const [cap, so] = (A.bai || 'N5-1').split('-'); const tu = +(A.tu || 1), giay = +(A.giay || 6);
const goc = await moServer(); const ch = await moChrome({ w: 1440, h: 900 });
try {
  const t = new Trang(ch.cdp, goc); await t.batDau(1440, 900);
  await t.moApp({ them: '&phongCach=h', bai: [cap, +so] });
  await t.ev(`__moPhong.datDen(${tu + 4})`);
  await t.ev(`__lecture.startFrom(${tu}).then(() => true)`); await sleep(7000);
  await t.c.send('Profiler.enable');
  await t.c.send('Profiler.setSamplingInterval', { interval: 200 });
  await t.c.send('Profiler.start');
  await sleep(giay * 1000);
  const { profile } = await t.c.send('Profiler.stop');
  const self = new Map();
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const dt = profile.timeDeltas; const ids = profile.samples;
  for (let i = 0; i < ids.length; i++) { const n = byId.get(ids[i]); const cf = n.callFrame; const k = (cf.functionName || '(anon)') + ' ' + (cf.url || '').split('/').pop() + ':' + cf.lineNumber; self.set(k, (self.get(k) || 0) + (dt[i] || 0)); }
  const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k, v]) => (v / 1000).toFixed(1) + 'ms ' + k);
  console.log(top.join('\n'));
  await t.dungGiang();
} finally { await ch.dong(); await donDep(); }
