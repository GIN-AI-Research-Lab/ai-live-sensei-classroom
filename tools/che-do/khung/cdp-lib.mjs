// cdp-lib.mjs — thu vien chung cho harness che do san khau (kiem-che-do.mjs, chup-mau.mjs)
// Chrome headless rieng qua --remote-debugging-pipe (khong mo cong nao) + http.server rieng 3900-3999.
// Luon dat TEMP/TMP = E:\sensei-tam\tmp (o C gan day). Moi PID tu mo deu bi giet khi xong.
import { spawn, execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';

export const SCR = 'C:/Users/OS/AppData/Local/Temp/claude/E--ai-live-sensei-classroom/85f3af15-28af-4f9f-8bfc-2fc053ff9125/scratchpad';
export const DU_AN = 'E:/ai-live-sensei-classroom';
export const TAM = 'E:/sensei-tam/tmp';
export const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
fs.mkdirSync(TAM, { recursive: true });
// phong chu cho nhan anh so sanh (ffmpeg drawtext, chay voi cwd = TAM)
try { if (!fs.existsSync(TAM + '/arial.ttf')) fs.copyFileSync('C:/Windows/Fonts/arial.ttf', TAM + '/arial.ttf'); } catch (e) {}
const ENV = Object.assign({}, process.env, { TEMP: TAM.replace(/\//g, '\\'), TMP: TAM.replace(/\//g, '\\') });

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PID = [];
export function giet(pid) {
  return new Promise((r) => {
    if (!pid) return r();
    if (process.platform === 'win32') execFile('taskkill', ['/PID', String(pid), '/T', '/F'], () => r());
    else { try { process.kill(pid, 'SIGKILL'); } catch {} r(); }
  });
}
const PROF = [];   // thu muc profile Chrome tam (~100 MB moi cai): xoa khi don dep (truoc day chi giet tien trinh -> day o E:)
export async function donDep() {
  for (const p of PID.splice(0)) await giet(p);
  for (const d of PROF.splice(0)) { try { fs.rmSync(d, { recursive: true, force: true }); } catch {} }
}
process.on('exit', () => { for (const d of PROF) { try { fs.rmSync(d, { recursive: true, force: true }); } catch {} } });
process.on('SIGINT', async () => { await donDep(); process.exit(130); });

export async function congTrong(a, b) {
  for (let i = 0; i < 60; i++) {
    const p = a + Math.floor(Math.random() * (b - a + 1));
    const ok = await new Promise((r) => { const s = net.createServer(); s.once('error', () => r(false)); s.listen(p, '127.0.0.1', () => s.close(() => r(true))); });
    if (ok) return p;
  }
  throw new Error('khong con cong trong');
}
/** http.server rieng tu thu muc goc (mac dinh du an). Tra ve goc URL */
export async function moServer(thuMuc = DU_AN) {
  const port = await congTrong(9700, 9749);
  // http.server mac dinh chi xep hang 5 ket noi -> nhieu Chrome cung luc bi ERR_CONNECTION_REFUSED: dung ThreadingHTTPServer hang doi 256
  const PY = ['import functools, http.server as h, sys',
    'class S(h.ThreadingHTTPServer):',
    '  request_queue_size = 256',
    '  daemon_threads = True',
    'S(("127.0.0.1", int(sys.argv[1])), functools.partial(h.SimpleHTTPRequestHandler, directory=".")).serve_forever()'].join('\n');
  const p = spawn('python', ['-c', PY, String(port)], { cwd: thuMuc, stdio: 'ignore', windowsHide: true, env: ENV });
  PID.push(p.pid);
  const goc = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 60; i++) { try { const r = await fetch(goc + '/'); if (r.ok) return goc; } catch {} await sleep(200); }
  throw new Error('server khong len: ' + thuMuc);
}

class KetNoi {
  constructor(gui) { this.gui = gui; this.id = 0; this.cho = new Map(); this.nghe = []; }
  nhan(txt) {
    let m; try { m = JSON.parse(txt); } catch { return; }
    if (m.id && this.cho.has(m.id)) { const f = this.cho.get(m.id); this.cho.delete(m.id); f(m); return; }
    if (m.method) for (const [sid, method, f] of this.nghe) if (sid === (m.sessionId || null) && method === m.method) f(m.params);
  }
  send(method, params = {}, sid = null) {
    return new Promise((res, rej) => {
      const i = ++this.id;
      this.cho.set(i, (m) => (m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result)));
      const goi = { id: i, method, params };
      if (sid) goi.sessionId = sid;
      this.gui(JSON.stringify(goi));
    });
  }
  phien(sid) { return { send: (m, p) => this.send(m, p, sid), on: (m, f) => this.nghe.push([sid, m, f]) }; }
}

/** Chrome headless (pipe). Tra ve { cdp, dong } */
export async function moChrome({ w = 1440, h = 900 } = {}) {
  const prof = path.join(TAM, 'prof-cd-' + process.pid + '-' + Math.floor(Math.random() * 1e5));
  const co = ['--headless=new', '--no-first-run', '--no-default-browser-check', '--mute-audio',
    '--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
    '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars', `--window-size=${w},${h}`,
    '--remote-debugging-pipe', `--user-data-dir=${prof}`, 'about:blank'];
  const p = spawn(CHROME, co, { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'], windowsHide: true, env: ENV });
  // uu tien thap: de may van muot khi chay nhieu Chrome (tien trinh con ke thua). Dat SENSEI_UU_TIEN=thuong khi do hieu nang (perf).
  if (process.env.SENSEI_UU_TIEN !== 'thuong') { try { os.setPriority(p.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch (e) {} }
  PID.push(p.pid); PROF.push(prof);
  const vao = p.stdio[3], ra = p.stdio[4];
  const kn = new KetNoi((s) => vao.write(s + '\0'));
  let dem = Buffer.alloc(0);
  ra.on('data', (d) => {
    dem = dem.length ? Buffer.concat([dem, d]) : d;
    let k;
    while ((k = dem.indexOf(0)) >= 0) { const s = dem.subarray(0, k).toString('utf8'); dem = dem.subarray(k + 1); kn.nhan(s); }
  });
  vao.on('error', () => {}); ra.on('error', () => {});
  let trang = null;
  for (let i = 0; i < 80 && !trang; i++) {
    try { const r = await Promise.race([kn.send('Target.getTargets'), sleep(1500).then(() => null)]); trang = r && r.targetInfos.find((x) => x.type === 'page'); } catch {}
    if (!trang) await sleep(200);
  }
  if (!trang) throw new Error('chrome khong mo duoc trang');
  const { sessionId } = await kn.send('Target.attachToTarget', { targetId: trang.targetId, flatten: true });
  return {
    cdp: kn.phien(sessionId), pid: p.pid, prof,
    dong: async () => { try { await Promise.race([kn.send('Browser.close'), sleep(1500)]); } catch {} await giet(p.pid); try { fs.rmSync(prof, { recursive: true, force: true }); } catch {} },
  };
}

export class Trang {
  constructor(cdp, goc) {
    this.c = cdp; this.goc = goc; this.log = [];
    cdp.on('Runtime.consoleAPICalled', (p) => this.log.push({ loai: p.type, text: p.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 400) }));
    cdp.on('Runtime.exceptionThrown', (p) => this.log.push({ loai: 'exception', text: (p.exceptionDetails.exception?.description || p.exceptionDetails.text || '').slice(0, 600) }));
    cdp.on('Log.entryAdded', (p) => { if (p.entry.level === 'error') this.log.push({ loai: 'log-error', text: (p.entry.text + ' ' + (p.entry.url || '')).slice(0, 300) }); });
  }
  async batDau(w = 1440, h = 900) {
    await this.c.send('Page.enable'); await this.c.send('Runtime.enable'); await this.c.send('Log.enable');
    this.c.on('Page.frameNavigated', (p) => {
      const u = p.frame && !p.frame.parentId ? p.frame.url : null;
      if (u && this.goc && !u.startsWith(this.goc) && u !== 'about:blank' && !u.startsWith('file:')) this.log.push({ loai: 'exception', text: 'trang bi dieu huong ra ngoai: ' + u });
    });
    await this.coManHinh(w, h);
  }
  loi() { return this.log.filter((x) => x.loai === 'exception' || x.loai === 'error' || x.loai === 'log-error'); }
  async ev(expr) {
    const r = await this.c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true, userGesture: true });
    if (r.exceptionDetails) throw new Error('ev: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text).slice(0, 500));
    return r.result.value;
  }
  async cho(expr, ms = 20000, buoc = 100) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      try { const v = await this.ev(expr); if (v) return v; } catch {}
      await sleep(buoc);
    }
    return null;
  }
  async coManHinh(w, h, mobile = w < 768) {
    this.w = w; this.h = h;
    await this.c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
    await this.c.send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
  }
  async media(giam) {
    await this.c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: giam ? 'reduce' : 'no-preference' }] });
  }
  async click(x, y) {
    await this.c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await this.c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await this.c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  }
  /** Bam that vao giua phan tu (sel CSS, hoac '=' + bieu thuc tra ve Element) */
  async bam(sel) {
    const expr = sel.startsWith('=') ? sel.slice(1) : `document.querySelector(${JSON.stringify(sel)})`;
    const r = await this.ev(`(() => { const e = ${expr}; if (!e) return null; e.scrollIntoView && e.scrollIntoView({ block: 'nearest' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, h: b.height }; })()`);
    if (!r || !r.w) return null;
    await this.click(r.x, r.y);
    return r;
  }
  async chup(file, o = {}) {
    const r = await this.c.send('Page.captureScreenshot', Object.assign({ format: file.endsWith('.jpg') ? 'jpeg' : 'png' }, file.endsWith('.jpg') ? { quality: 88 } : {}, o));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    return file;
  }
  /** Mo app voi ?noLive&moPhong + tham so; mo bai (cap, so). truocTrang: JS chay truoc moi tai lieu */
  async moApp({ them = '', bai = ['N5', 1], truocTrang = '' } = {}) {
    if (this._sc) { try { await this.c.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: this._sc }); } catch {} this._sc = null; }
    const src = `try { localStorage.removeItem('sk.dongBo'); } catch (e) {}\n${truocTrang}`;
    this._sc = (await this.c.send('Page.addScriptToEvaluateOnNewDocument', { source: src })).identifier;
    const url = `${this.goc}/?noLive&moPhong&hat=7${them}`;
    this.url = url;
    await this.c.send('Page.navigate', { url });
    const ok = await this.cho(`!!(window.__lecture && window.jumpToLesson && window.__moPhong && document.querySelector('#pickerBody .lesson-card'))`, 30000, 150);
    if (!ok) throw new Error('app chua san sang: ' + url);
    await this.ev(`window.jumpToLesson(${JSON.stringify(bai[0])}, ${bai[1]}).then(() => true)`);
    await this.cho(`__lecture.beats().length > 0`, 15000);
    await sleep(400);
  }
  async dungGiang() {
    const st = await this.ev(`__lecture.state().lectureState`);
    if (st === 'PLAYING') await this.bam('#autoLectureBtn');
    await this.cho(`__lecture.state().lectureState !== 'PLAYING'`, 4000);
  }
}

/** Ghep anh bang ffmpeg (xstack / hstack) — ffmpeg phai co trong PATH */
export function ffmpeg(args) {
  return new Promise((res, rej) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { cwd: TAM, stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true, env: ENV });
    let err = '';
    p.stderr.on('data', (d) => { err += d; });
    p.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c + ': ' + err.slice(0, 800)))));
  });
}
