// tinh-chinh-che-do.mjs — do tung nhip cua mot che do san khau va ghi GHI DE THEO BAI (curriculum/che-do/<che-do>/<cap>-<bai>.json).
//
//   node tools/tinh-chinh-che-do.mjs --che-do h --bai N5-1,N5-10,N4-30,N1-3,KANA-5 [--ra curriculum/che-do] [--cong 9700-9749]
//                                     [--man 1440x900,390x844] [--toi-da 4] [--chi 0,5,12] [--chrome <duong dan chrome.exe>]
//
// Moi nhip (mo phong ?noLive&moPhong, KHONG bao gio mo Gemini Live) duoc dung roi cho "het" (khung cuoi du, GSAP tua nhanh),
// do bang logic cua do-bo-cuc: (a) chu bi cat boi to tien overflow / ra ngoai khung, (b) chu de len goc meo that, (c) hai khoi chu de len nhau.
// Co van de -> ha co chu LON NHAT cua vai chu gay loi (x0.9, toi da --toi-da lan) cho toi khi het loi; ghi vao ghi de { fs: { vai: max } }.
// Nhip khong co van de: de tu vua khung (khong ghi). Tep ghi de mang `hash` noi dung bai (che do bo qua tep neu hash khac).
// Hai man hinh: 1440x900 (fs tinh bang px thiet ke 1920) va 390x844 (px that). index.json: { bai: { "N5-1": "<hash>" } } de che do khong goi 404.
import { spawn, execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = {}; const av = process.argv.slice(2);
for (let i = 0; i < av.length; i += 2) arg[av[i].replace(/^--/, '')] = av[i + 1];
const CHE_DO = arg['che-do'] || 'h';
const BAI = (arg.bai || 'N5-1').split(',').map((s) => s.trim()).filter(Boolean);
const RA = path.resolve(GOC, arg.ra || 'curriculum/che-do');
const [P0, P1] = (arg.cong || '9700-9749').split('-').map(Number);
const MAN = (arg.man || '1440x900,390x844').split(',').map((s) => s.split('x').map(Number));
const TOI_DA = +(arg['toi-da'] || 4);
const CHI = arg.chi ? arg.chi.split(',').map(Number) : null;
const CHROME = arg.chrome || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TAM = process.env.TEMP || process.env.TMP || 'E:/sensei-tam/tmp';
const ENV = Object.assign({}, process.env, { TEMP: TAM, TMP: TAM });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PIDS = [];
const giet = (pid) => new Promise((r) => { if (!pid) return r(); if (process.platform === 'win32') execFile('taskkill', ['/PID', String(pid), '/T', '/F'], () => r()); else { try { process.kill(pid, 'SIGKILL'); } catch {} r(); } });
async function congTrong() {
  for (let i = 0; i < 80; i++) {
    const p = P0 + Math.floor(Math.random() * (P1 - P0 + 1));
    const ok = await new Promise((r) => { const s = net.createServer(); s.once('error', () => r(false)); s.listen(p, '127.0.0.1', () => s.close(() => r(true))); });
    if (ok) return p;
  }
  throw new Error('khong con cong trong ' + P0 + '-' + P1);
}
async function moServer() {
  const port = await congTrong();
  const p = spawn('python', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: GOC, stdio: 'ignore', windowsHide: true, env: ENV });
  PIDS.push(p.pid);
  const goc = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 60; i++) { try { const r = await fetch(goc + '/'); if (r.ok) return goc; } catch {} await sleep(200); }
  throw new Error('server khong len');
}
class KetNoi {
  constructor(gui) { this.gui = gui; this.id = 0; this.cho = new Map(); this.nghe = []; }
  nhan(txt) { let m; try { m = JSON.parse(txt); } catch { return; } if (m.id && this.cho.has(m.id)) { const f = this.cho.get(m.id); this.cho.delete(m.id); f(m); return; } if (m.method) for (const [sid, method, f] of this.nghe) if (sid === (m.sessionId || null) && method === m.method) f(m.params); }
  send(method, params = {}, sid = null) { return new Promise((res, rej) => { const i = ++this.id; this.cho.set(i, (m) => (m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result))); const g = { id: i, method, params }; if (sid) g.sessionId = sid; this.gui(JSON.stringify(g)); }); }
}
async function moChrome(w, h) {
  const prof = path.join(TAM, 'prof-tc-' + process.pid + '-' + Math.floor(Math.random() * 1e5));
  const co = ['--headless=new', '--no-first-run', '--no-default-browser-check', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars', `--window-size=${w},${h}`, '--remote-debugging-pipe', `--user-data-dir=${prof}`, 'about:blank'];
  const p = spawn(CHROME, co, { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'], windowsHide: true, env: ENV });
  PIDS.push(p.pid);
  const vao = p.stdio[3], ra = p.stdio[4];
  const kn = new KetNoi((s) => vao.write(s + '\0'));
  let dem = Buffer.alloc(0);
  ra.on('data', (d) => { dem = dem.length ? Buffer.concat([dem, d]) : d; let k; while ((k = dem.indexOf(0)) >= 0) { kn.nhan(dem.subarray(0, k).toString('utf8')); dem = dem.subarray(k + 1); } });
  vao.on('error', () => {}); ra.on('error', () => {});
  let trang = null;
  for (let i = 0; i < 80 && !trang; i++) { try { const r = await Promise.race([kn.send('Target.getTargets'), sleep(1500).then(() => null)]); trang = r && r.targetInfos.find((x) => x.type === 'page'); } catch {} if (!trang) await sleep(200); }
  if (!trang) throw new Error('chrome khong mo duoc trang');
  const { sessionId } = await kn.send('Target.attachToTarget', { targetId: trang.targetId, flatten: true });
  const gui = (m, pr) => kn.send(m, pr, sessionId);
  return { gui, dong: async () => { try { await Promise.race([kn.send('Browser.close'), sleep(1500)]); } catch {} await giet(p.pid); try { fs.rmSync(prof, { recursive: true, force: true }); } catch {} } };
}
async function ev(c, expr) {
  const r = await c.gui('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true, userGesture: true });
  if (r.exceptionDetails) throw new Error('ev: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text).slice(0, 300));
  return r.result.value;
}
async function cho(c, expr, ms = 15000, buoc = 100) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = await ev(c, expr); if (v) return v; } catch {} await sleep(buoc); } return null; }

// ---- do trong trang: tra { van: [{ vai, loai, ... }], co: { vai: px that } }
const DO = `(() => {
  const lop = document.querySelector('.cd-lop'); if (!lop) return { loi: 'khong co lop' };
  const L = lop.getBoundingClientRect();
  const cd = __motion.cheDo(); const meo = cd && cd.meo ? { x: L.left + cd.meo.x, y: L.top + cd.meo.y + 36, w: cd.meo.w, h: Math.max(0, cd.meo.h - 36) } : null;
  const vai = (e) => { const c = [...e.classList].find((x) => /^h-r-/.test(x)) || (e.closest && e.closest('[class*="h-r-"]') && [...e.closest('[class*="h-r-"]').classList].find((x) => /^h-r-/.test(x))); return c ? c.slice(4) : ''; };
  const ds = []; const van = []; const co = {};
  const w = document.createTreeWalker(lop, NodeFilter.SHOW_TEXT);
  let n; while ((n = w.nextNode())) {
    const t = (n.nodeValue || '').trim(); if (!t) continue;
    const e = n.parentElement; if (!e || e.closest('.h-mesur, .h-am-nut, .sk-cong, .cd-chan, rt, .h-rt, .h-rem')) continue;
    let op = 1, v = e; while (v && v !== lop) { const cs = getComputedStyle(v); op *= +cs.opacity; if (cs.visibility === 'hidden' || cs.display === 'none') { op = 0; break; } v = v.parentElement; }
    if (op < 0.3) continue;
    const r = document.createRange(); r.selectNodeContents(n); const b = r.getBoundingClientRect(); if (b.width < 2 || b.height < 2) continue;
    const fs = parseFloat(getComputedStyle(e).fontSize); const vv = vai(e); if (vv) co[vv] = Math.max(co[vv] || 0, fs);
    const ink = { l: b.left, r: b.right, t: b.top + 0.2 * fs, b: b.bottom - 0.08 * fs };
    // (a) cat / ra ngoai khung
    let bi = 0;
    if (ink.l < L.left - 2 || ink.r > L.right + 2 || ink.t < L.top - 2 || ink.b > L.bottom + 2) bi = 1;
    let a = e; while (a && a !== lop && !bi) { const cs = getComputedStyle(a); if (/(hidden|clip|auto|scroll)/.test(cs.overflow + cs.overflowX + cs.overflowY) && a !== e) { const ar = a.getBoundingClientRect(); if (ink.l < ar.left - 2 || ink.r > ar.right + 2 || ink.t < ar.top - 2 || ink.b > ar.bottom + 2) { bi = 1; break; } } a = a.parentElement; }
    if (bi) van.push({ vai: vv, loai: 'cat', t: t.slice(0, 24) });
    // (b) goc meo
    if (meo) { const ox = Math.min(ink.r, meo.x + meo.w) - Math.max(ink.l, meo.x), oy = Math.min(ink.b, meo.y + meo.h) - Math.max(ink.t, meo.y); if (ox > 4 && oy > 4) van.push({ vai: vv, loai: 'meo', t: t.slice(0, 24) }); }
    ds.push({ ink, vv, t: t.slice(0, 24), cha: e.parentElement, ph: e.closest('.h-hang, .h-gn, .h-noi, .h-giay, .h-dan, .h-ruy, .h-khoi, .h-cau-bai') });
  }
  // (c) de len nhau (khac khoi cha)
  for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++) {
    const p = ds[i], q = ds[j]; if (p.ph && p.ph === q.ph) continue; if (p.cha && q.cha && (p.cha.contains(q.cha) || q.cha.contains(p.cha))) continue;
    const ox = Math.min(p.ink.r, q.ink.r) - Math.max(p.ink.l, q.ink.l), oy = Math.min(p.ink.b, q.ink.b) - Math.max(p.ink.t, q.ink.t);
    if (ox > 2 && oy > 2) { const s = Math.min((p.ink.r - p.ink.l) * (p.ink.b - p.ink.t), (q.ink.r - q.ink.l) * (q.ink.b - q.ink.t)); if (ox * oy > 0.2 * s) van.push({ vai: p.vv || q.vv, loai: 'de', t: p.t + ' / ' + q.t }); }
  }
  return { van, co, hu: parseFloat(getComputedStyle(lop).getPropertyValue('--hu')) || 1 };
})()`;

async function moBai(c, goc, w, h, cap, so) {
  await c.gui('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 768 });
  await c.gui('Page.navigate', { url: `${goc}/?noLive&moPhong&hat=7&phongCach=${CHE_DO}` });
  const ok = await cho(c, `!!(window.__lecture && window.jumpToLesson && window.__moPhong && document.querySelector('#pickerBody .lesson-card'))`, 30000, 150);
  if (!ok) throw new Error('app chua san sang');
  await ev(c, `window.jumpToLesson(${JSON.stringify(cap)}, ${so}).then(() => true)`);
  await cho(c, `__lecture.beats().length > 0`, 15000);
  await sleep(400);
}
async function dungNhip(c, i) {
  await ev(c, `__moPhong.datDen(${i + 1})`);
  await ev(c, `__lecture.startFrom(${i}).then(() => true)`);
  const ok = await cho(c, `(() => { const m = window.__cdH && __cdH.m(); const n = window.__cdH && __cdH.nh(); return !!(m && n && n.i === ${i} && __motion.cheDo().phu); })()`, 8000, 80);
  if (!ok) return false;
  await ev(c, `__cdH.het(); gsap.globalTimeline.timeScale(40); true`);
  await sleep(750);
  await ev(c, `gsap.globalTimeline.timeScale(1); true`);
  await sleep(80);
  return true;
}
async function dungGiang(c) { try { const st = await ev(c, `__lecture.state().lectureState`); if (st === 'PLAYING') await ev(c, `document.querySelector('#autoLectureBtn').click(); true`); } catch {} await sleep(300); }

const goc = await moServer();
const KQ = {};
try {
  for (const b of BAI) {
    const [cap, soS] = b.split('-'); const so = +soS;
    const out = { mode: CHE_DO, cap, bai: so, hash: '', tao: new Date().toISOString(), profiles: {} };
    let tomTat = {};
    for (const [w, h] of MAN) {
      const ch = await moChrome(w, h);
      const pk = `${w}x${h}`;
      try {
        await ch.gui('Page.enable'); await ch.gui('Runtime.enable');
        const c = ch;
        let okBai = false;
        for (let lan = 0; lan < 3 && !okBai; lan++) { try { await moBai(c, goc, w, h, cap, so); okBai = true; } catch (e) { await sleep(1500); } }
        if (!okBai) throw new Error('khong mo duoc bai ' + b);
        const n = await ev(c, `__lecture.beats().length`);
        const kinds = await ev(c, `__lecture.beats().map((b) => b.kind)`);
        const beats = {}; let soVan = 0, soDo = 0, soSua = 0;
        for (let i = 0; i < n; i++) {
          if (CHI && !CHI.includes(i)) continue;
          if (!(await dungNhip(c, i))) { continue; }
          if (!out.hash) out.hash = await ev(c, `__cdH.hashBai(__cdH.nh().bai)`);
          soDo++;
          const key = `${i}:${kinds[i]}`;
          let fsDat = {};
          let r = await ev(c, DO);
          for (let lan = 0; lan < TOI_DA && r.van && r.van.length; lan++) {
            // ha co chu lon nhat cua cac vai gay loi (x0.9). co do duoc la px that -> doi ve px thiet ke (may tinh: / hu) hoac px that (dien thoai)
            const vais = [...new Set(r.van.map((x) => x.vai).filter(Boolean))];
            if (!vais.length) break;
            vais.forEach((v) => { const hienTai = fsDat[v] != null ? fsDat[v] : (w < 640 ? r.co[v] : r.co[v] / r.hu); fsDat[v] = Math.max(w < 640 ? 13 : 18, Math.round(hienTai * 0.9)); });
            await ev(c, `__cdH.datTam(${JSON.stringify(key)}, ${JSON.stringify(fsDat)}); true`);
            if (!(await dungNhip(c, i))) break;
            r = await ev(c, DO);
          }
          await ev(c, `__cdH.datTam(null); true`);
          if (r.van && r.van.length) { soVan++; if (arg['chi-tiet']) console.log('  van', pk, key, JSON.stringify(r.van.slice(0, 3))); }
          if (Object.keys(fsDat).length) { beats[key] = { fs: fsDat }; soSua++; }
        }
        out.profiles[pk] = { beats };
        tomTat[pk] = { nhip: n, do: soDo, suaCoChu: soSua, conVan: soVan };
        await dungGiang(c);
      } finally { await ch.dong(); }
    }
    fs.mkdirSync(path.join(RA, CHE_DO), { recursive: true });
    const tep = path.join(RA, CHE_DO, `${cap}-${so}.json`);
    fs.writeFileSync(tep, JSON.stringify(out, null, 1) + '\n');
    const ip = path.join(RA, CHE_DO, 'index.json');
    let idx = { mode: CHE_DO, bai: {} };
    try { idx = JSON.parse(fs.readFileSync(ip, 'utf8')); } catch {}
    idx.bai = idx.bai || {}; if (out.hash) idx.bai[`${cap}-${so}`] = out.hash;
    fs.writeFileSync(ip, JSON.stringify(idx, null, 1) + '\n');
    KQ[b] = { tep: path.relative(GOC, tep), hash: out.hash, tomTat };
    console.log(b, JSON.stringify(KQ[b]));
  }
} finally {
  for (const p of PIDS.splice(0)) await giet(p);
}
console.log(JSON.stringify(KQ, null, 1));
