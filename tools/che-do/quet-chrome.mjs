// quet-chrome.mjs — Chrome headless "gon" cho quet-bai.mjs: giong moChrome() cua khung/cdp-lib.mjs (--remote-debugging-pipe, ho so tam
// rieng trong E:/sensei-tam/tmp, cung dang tra ve { cdp, pid, prof, dong }) nhung TAT tai thanh phan nen (component updater, Safe Browsing,
// optimization guide, TTS...) va gioi han cache dia: ho so ~20 MB thay vi ~200 MB (6 Chrome chay hang gio + cac lan chay khac lam day o E:).
import { spawn, execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TAM = 'E:/sensei-tam/tmp';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ENV = Object.assign({}, process.env, { TEMP: TAM.replace(/\//g, '\\'), TMP: TAM.replace(/\//g, '\\') });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const giet = (pid) => new Promise((r) => { if (!pid) return r(); if (process.platform === 'win32') execFile('taskkill', ['/PID', String(pid), '/T', '/F'], () => r()); else { try { process.kill(pid, 'SIGKILL'); } catch (e) {} r(); } });

class KetNoi {
  constructor(gui) { this.gui = gui; this.id = 0; this.cho = new Map(); this.nghe = []; }
  nhan(txt) {
    let m; try { m = JSON.parse(txt); } catch (e) { return; }
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

/** Chrome headless (pipe), ho so tam gon. Tra ve { cdp, pid, prof, dong } nhu cdp-lib.moChrome */
export async function moChromeGon({ w = 1440, h = 900 } = {}) {
  const prof = path.join(TAM, 'prof-qb-' + process.pid + '-' + Math.floor(Math.random() * 1e5));
  const co = ['--headless=new', '--no-first-run', '--no-default-browser-check', '--mute-audio',
    '--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
    '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars', `--window-size=${w},${h}`,
    // gon ho so: khong tai thanh phan / mo hinh nen, cache dia nho
    '--disable-component-update', '--disable-background-networking', '--disable-sync', '--disable-default-apps', '--disable-extensions',
    '--safebrowsing-disable-auto-update', '--disable-breakpad', '--no-pings', '--metrics-recording-only', '--disable-domain-reliability',
    '--disable-features=OptimizationGuideModelDownloading,OptimizationHintsFetching,OptimizationTargetPrediction,OptimizationHints,Translate,MediaRouter,SafeBrowsing,WasmTtsComponentUpdater,OnDeviceHeadSuggest',
    '--disk-cache-size=8388608', '--media-cache-size=1048576',
    '--remote-debugging-pipe', `--user-data-dir=${prof}`, 'about:blank'];
  const p = spawn(CHROME, co, { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'], windowsHide: true, env: ENV });
  // uu tien thap: de may van muot khi chay nhieu Chrome (tien trinh con ke thua). Dat SENSEI_UU_TIEN=thuong khi do hieu nang (perf).
  if (process.env.SENSEI_UU_TIEN !== 'thuong') { try { os.setPriority(p.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch (e) {} }
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
    try { const r = await Promise.race([kn.send('Target.getTargets'), sleep(1500).then(() => null)]); trang = r && r.targetInfos.find((x) => x.type === 'page'); } catch (e) {}
    if (!trang) await sleep(200);
  }
  if (!trang) { await giet(p.pid); throw new Error('chrome khong mo duoc trang'); }
  const { sessionId } = await kn.send('Target.attachToTarget', { targetId: trang.targetId, flatten: true });
  return {
    cdp: kn.phien(sessionId), pid: p.pid, prof,
    dong: async () => {
      try { await Promise.race([kn.send('Browser.close'), sleep(1500)]); } catch (e) {}
      await giet(p.pid);
      await sleep(500);
      try { fs.rmSync(prof, { recursive: true, force: true, maxRetries: 6, retryDelay: 400 }); } catch (e) {}
    },
  };
}
