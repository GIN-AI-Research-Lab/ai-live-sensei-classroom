// perf.mjs — do khung hinh (rAF) + long task trong luc giang. node perf.mjs --bai N5-1 --tu 0 --giay 60 --cpu 1 --them "&phongCach=h" [--w 1440 --h 900] [--ra file.json] [--trace file.json]
// CONG CHAT LUONG (P2): sau khi do, in them dong "PERF PASS"/"PERF FAIL ..." va dat exit code (0 = dat, 1 = vuot nguong).
//   Nguong mac dinh: p95 frame time <= 20 ms VA long-task <= 5/phut (chuan hoa tu cua so do --giay).
//   Chinh nguong qua bien moi truong: PERF_P95_MAX (ms), PERF_LONGTASK_MAX (so/phut).
// Kiem tra logic nguong khong can Chrome: node perf.mjs --kiem-nguong file-so-lieu.json [--giay 60]
//   file JSON can co truong p95 (ms) va longtask (tong so trong cua so do); exit 0/1 nhu khi do that.
import { moServer, moChrome, Trang, donDep, sleep } from './cdp-lib.mjs';
import fs from 'node:fs';
const A = {}; const av = process.argv.slice(2);
for (let i = 0; i < av.length; i += 2) A[av[i].replace(/^--/, '')] = av[i + 1];
// --- nguong pass/fail (ham thuan, tach rieng de kiem chung bang --kiem-nguong) ---
const NGUONG = { p95Max: +(process.env.PERF_P95_MAX || 20), ltMax: +(process.env.PERF_LONGTASK_MAX || 5) };
function danhGiaPerf(p95, longtask, giayDo) {
  const ltPhut = giayDo > 0 ? (longtask * 60) / giayDo : longtask;
  const loi = [];
  if (p95 > NGUONG.p95Max) loi.push(`p95=${p95}ms > ${NGUONG.p95Max}ms`);
  if (ltPhut > NGUONG.ltMax) loi.push(`longtask=${+ltPhut.toFixed(2)}/phut > ${NGUONG.ltMax}/phut`);
  return { dat: !loi.length, ltPhut: +ltPhut.toFixed(2), loi };
}
const dongVerdict = (v, p95) => `PERF ${v.dat ? 'PASS' : 'FAIL'}: p95=${p95}ms (nguong <= ${NGUONG.p95Max}ms), longtask=${v.ltPhut}/phut (nguong <= ${NGUONG.ltMax}/phut)${v.loi.length ? ' — vuot: ' + v.loi.join('; ') : ''}`;
if (A['kiem-nguong']) {
  let d; try { d = JSON.parse(fs.readFileSync(A['kiem-nguong'], 'utf8')); } catch (e) { console.error('khong doc duoc file so lieu: ' + e.message); process.exit(2); }
  if (typeof d.p95 !== 'number') { console.error('file so lieu thieu truong p95 (so, ms)'); process.exit(2); }
  const v = danhGiaPerf(d.p95, d.longtask || 0, +(A.giay || d.giay || 60));
  console.log(dongVerdict(v, d.p95));
  process.exit(v.dat ? 0 : 1);
}
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
  const v = danhGiaPerf(r.p95, r.longtask, giay);
  r.verdict = { dat: v.dat, p95Max: NGUONG.p95Max, longtaskPhut: v.ltPhut, longtaskMax: NGUONG.ltMax, loi: v.loi };
  console.log(dongVerdict(v, r.p95));
  process.exitCode = v.dat ? 0 : 1;
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
