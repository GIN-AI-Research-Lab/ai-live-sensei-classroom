// perf.mjs — do khung hinh (rAF) + long task trong luc giang. node perf.mjs --bai N5-1 --tu 0 --giay 60 --cpu 1 --them "&phongCach=h" [--w 1440 --h 900] [--ra file.json] [--trace file.json]
import { moServer, moChrome, Trang, donDep, sleep } from './cdp-lib.mjs';
import fs from 'node:fs';
const A = {}; const av = process.argv.slice(2);
for (let i = 0; i < av.length; i += 2) A[av[i].replace(/^--/, '')] = av[i + 1];
const them = A.them || '&phongCach=h', [cap, so] = (A.bai || 'N5-1').split('-');
const tu = +(A.tu || 0), giay = +(A.giay || 60), cpu = +(A.cpu || 1), w = +(A.w || 1440), h = +(A.h || 900);
const goc = await moServer(); const ch = await moChrome({ w, h });
try {
  const t = new Trang(ch.cdp, goc); await t.batDau(w, h);
  await t.moApp({ them, bai: [cap, +so], truocTrang: `
    window.__pf = { d: [], lt: [], t0: 0 };
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__pf.lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ entryTypes: ['longtask'] }); } catch (e) {}
    (function f(t) { const p = window.__pf; if (p.t0) { p.d.push(t - p.t0); if (t - p.t0 > 33) (p.sp = p.sp || []).push([Math.round(t), Math.round(t - p.t0)]); } p.t0 = t; requestAnimationFrame(f); })(0);
  ` });
  if (A.css) await t.ev(`(() => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(A.css)}; document.head.appendChild(s); return 1; })()`);
  await t.ev(`__moPhong.datDen(${tu + 40})`);
  if (cpu > 1) await t.c.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  if (A.trace) await t.c.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.invalidationTracking,blink.user_timing', transferMode: 'ReturnAsStream' }).catch(() => {});
  if (tu === 0) await t.bam('#autoLectureBtn'); else await t.ev(`__lecture.startFrom(${tu}).then(() => true)`);
  await t.cho(`__lecture.state().lectureState === 'PLAYING'`, 8000);
  await sleep(+(A.warm || 8) * 1000);
  await t.ev(`window.__pf.sp = []; window.__cdH && (window.__cdH.tm.length = 0); window.__pf.d.length = 0; window.__pf.lt.length = 0; window.__pf.t0 = 0; true`);
  const t0 = Date.now();
  while (Date.now() - t0 < giay * 1000) {
    const s = await t.ev(`({ che: (__motion.trangThai() || {}).che, i: __lecture.index() })`);
    if (s.che === 'cho') { await sleep(500); await t.bam(`=[...document.querySelectorAll('#sanKhauGiang .qz-opt')].find(b => !b.disabled)`); }
    await sleep(400);
  }
  const r = await t.ev(`(() => { const d = window.__pf.d.slice().sort((a, b) => a - b); const q = (p) => d[Math.min(d.length - 1, Math.floor(d.length * p))];
    const tot = window.__pf.d.reduce((a, b) => a + b, 0);
    return { khung: d.length, giay: +(tot / 1000).toFixed(1), p50: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1), p99: +q(0.99).toFixed(1), max: +d[d.length - 1].toFixed(1),
      tren20_moiPhut: Math.round(d.filter((x) => x > 20).length * 60000 / tot), tren33_moiPhut: Math.round(d.filter((x) => x > 33).length * 60000 / tot),
      longtask: window.__pf.lt.length, longtaskMax: window.__pf.lt.reduce((a, b) => Math.max(a, b[1]), 0), lopDOM: document.querySelectorAll('.cd-lop *').length, spikes: (window.__pf.sp || []).slice(0, 40), tm: window.__cdH ? window.__cdH.tm.slice(-14) : null, dn: (__motion.doNhip ? __motion.doNhip() : []).filter((x) => !x.truoc).slice(-6).map((x) => [x.nhip, x.dau, x.dung, x.gan, x.ms, x.vaoSau]) }; })()`);
  r.cfg = { bai: A.bai || 'N5-1', w, h, cpu, them, giay };
  console.log(JSON.stringify(r));
  if (A.ra) fs.writeFileSync(A.ra, JSON.stringify(r, null, 1));
  if (A.trace) {
    const done = new Promise((res) => t.c.on('Tracing.tracingComplete', res));
    await t.c.send('Tracing.end');
    const e = await Promise.race([done, sleep(20000)]);
    if (e && e.stream) {
      let out = ''; for (;;) { const rd = await t.c.send('IO.read', { handle: e.stream }); out += rd.data; if (rd.eof) break; }
      fs.writeFileSync(A.trace, out);
    }
  }
  await t.dungGiang();
} finally { await ch.dong(); await donDep(); }
