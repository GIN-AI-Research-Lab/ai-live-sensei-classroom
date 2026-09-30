// Tien ich chung cho cac bai kiem thu trinh duyet (khong dung API that): server tinh + Chrome headless qua CDP pipe.
//   import { moTrinhDuyet } from './_kiem_chrome.mjs';
//   const t = await moTrinhDuyet({ duong: '/index.html?noLive&moPhong', w: 1280, h: 800, dpr: 1 });
//   await t.ev('1+1'); await t.chup('E:/.../a.png'); await t.dong();
// Quy tac: cong 3700-3799, ho so Chrome rieng, TEMP/TMP = E:/sensei-tam/tmp, chan env.js / .env (khong doc khoa).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TAM = 'E:/sensei-tam/tmp';
export const ngu = (ms) => new Promise(r => setTimeout(r, ms));

function giet(pid) {
  return new Promise(r => { const k = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' }); k.on('exit', () => r()); k.on('error', () => r()); });
}
async function congTrong(a = 3700, b = 3799) {
  for (let i = 0; i < 80; i++) {
    const p = a + Math.floor(Math.random() * (b - a + 1));
    const ok = await new Promise(r => { const s = net.createServer(); s.once('error', () => r(false)); s.listen(p, '127.0.0.1', () => s.close(() => r(true))); });
    if (ok) return p;
  }
  throw new Error('het cong 3700-3799');
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
      this.cho.set(i, m => (m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result)));
      const g = { id: i, method, params }; if (sid) g.sessionId = sid; this.gui(JSON.stringify(g));
    });
  }
  phien(sid) { return { send: (m, p) => this.send(m, p, sid), on: (m, f) => this.nghe.push([sid, m, f]) }; }
}

export async function moTrinhDuyet({ duong = '/index.html?noLive&moPhong', w = 1280, h = 800, dpr = 1, chanFetch = null, hienLog = false } = {}) {
  fs.mkdirSync(TAM, { recursive: true });
  process.env.TEMP = TAM; process.env.TMP = TAM;
  const PID = [];
  const port = await congTrong();
  const srv = spawn('python', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: GOC, stdio: 'ignore', windowsHide: true, env: { ...process.env, TEMP: TAM, TMP: TAM } });
  PID.push(srv.pid);
  const goc = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 60; i++) { try { const r = await fetch(goc + '/index.html'); if (r.ok) break; } catch {} await ngu(200); }
  const prof = path.join(TAM, 'prof-kiem-' + process.pid + '-' + Date.now());
  const chromeP = spawn(CHROME, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--mute-audio',
    '--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
    `--window-size=${w},${h}`, '--remote-debugging-pipe', `--user-data-dir=${prof}`, 'about:blank'],
  { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'], windowsHide: true, env: { ...process.env, TEMP: TAM, TMP: TAM } });
  PID.push(chromeP.pid);
  const vao = chromeP.stdio[3], ra = chromeP.stdio[4];
  const kn = new KetNoi(s => vao.write(s + '\0'));
  let dem = Buffer.alloc(0);
  ra.on('data', d => { dem = dem.length ? Buffer.concat([dem, d]) : d; let k; while ((k = dem.indexOf(0)) >= 0) { const s = dem.subarray(0, k).toString('utf8'); dem = dem.subarray(k + 1); kn.nhan(s); } });
  vao.on('error', () => {}); ra.on('error', () => {});
  let trang = null;
  for (let i = 0; i < 80 && !trang; i++) {
    try { const r = await Promise.race([kn.send('Target.getTargets'), ngu(1500).then(() => null)]); trang = r && r.targetInfos.find(x => x.type === 'page'); } catch {}
    if (!trang) await ngu(200);
  }
  if (!trang) throw new Error('khong mo duoc Chrome');
  const { sessionId } = await kn.send('Target.attachToTarget', { targetId: trang.targetId, flatten: true });
  const c = kn.phien(sessionId);
  const log = [];
  c.on('Runtime.consoleAPICalled', p => { const s = p.type + ': ' + p.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 400); log.push(s); if (hienLog) console.log('  [console]', s); });
  c.on('Runtime.exceptionThrown', p => log.push('EXC: ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text || '').slice(0, 600)));
  c.on('Log.entryAdded', p => { if (p.entry.level === 'error') log.push('LOG error: ' + (p.entry.text + ' ' + (p.entry.url || '')).slice(0, 300)); });
  await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Log.enable'); await c.send('Network.enable');
  await c.send('Network.setBlockedURLs', { urls: ['*env.js*', '*/.env*'] });
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
  const ev = async (expr) => {
    const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true, userGesture: true });
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || r.exceptionDetails.text).slice(0, 600));
    return r.result.value;
  };
  const t = {
    goc, log, ev, c, kn,
    async vao(d) { await c.send('Page.navigate', { url: goc + d }); await ngu(300); },
    async chup(file, clip) {
      const p = { format: 'png' }; if (clip) p.clip = { ...clip, scale: 1 };
      const r = await c.send('Page.captureScreenshot', p);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    },
    async cho(dk, ms = 15000, buoc = 100) {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { if (await ev(dk)) return true; } catch {} await ngu(buoc); }
      return false;
    },
    loi() { return log.filter(l => /^EXC|^LOG error|^error/.test(l) && !/favicon|ERR_FILE_NOT_FOUND|404 \(File not found\)|Failed to load resource/.test(l)); },
    async dong() {
      try { await Promise.race([kn.send('Browser.close'), ngu(1500)]); } catch {}
      for (const p of PID) await giet(p);
    },
  };
  await t.vao(duong);
  return t;
}
