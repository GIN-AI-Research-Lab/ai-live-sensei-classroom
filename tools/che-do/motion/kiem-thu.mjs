// kiem-thu.mjs — harness kiem thu san khau giang (motion-spec §4.5, §6). Builder D.
//
//   node kiem-thu.mjs <ten...> [tuy chon]
//     ten: T1 ... T15 (§6) | T3R (T3 duoi giam chuyen dong) | A1 ... A5 (bo sung v2 §D) | all (T1-T15 + T3R + A1-A5) | v2 (A1-A5 + ANH)
//          | DV | DC | WAV | ANH | VCH | R1D | RB | smoke   (--liet-ke: in danh sach)
//       RB    furigana chi tren chu Han (okurigana viet thang): helper, luoi, san khau — N5-1, N4-30, N1-3
//       KB    the ket bai: init.khiKetBai(dich) (nut 'phat-am' / 'xem-lai' tren the), voi SenseiMotion GIA
//       DV    don vi diem noi D (app / slide-engine / board) + mo phong, voi SenseiMotion GIA
//       DC    diem noi D voi dao dien THAT + canh chung (nen dung kem --chung)
//       WAV   xem bang tieng TTS that (scratchpad/lipsync/A/tts), khong co su that
//       ANH   anh chup 1440x900 + 390x844 moi dang nhip (+ the chuong, cho, the ket bai) -> motion/anh-v2/
//       smoke nap trang, chay 3 nhip, chup anh
//       VCH   hoi quy SenseiBoard.vietChuHan (san khau + bang phan + Viet lai, chi phi)
//     --loai a,b     A1/A2/A4/ANH/T10 chi duyet cac dang nay (vocab,kanji,grammar-intro,example,kaiwa-intro,kaiwa-run,kaiwa,quiz,the-chuong,the-ket-bai)
//     --man WxH,...  A1/A2/A4/ANH chi o cac co man hinh nay (mac dinh 1440x900,390x844); T10 (mac dinh 6 co cua §6)
//     --sel JSON     doi bo chon v2, vd '{"dau":".sk-dong-dau","tro":".sk-con-tro","chip":".sk-chip"}'
//                    (the: .sk-the, phim: .sk-phim, dau: dong tieu de tren the, tro: con tro doc, chip: chip tro tu)
//     --goc URL      dung server co san (mac dinh: tu mo python -m http.server 3900-3999, tat khi xong)
//     --them "&k=v"  them tham so URL (vd "&tre=0.8&rung=0.15"); luon co ?noLive&moPhong&hat=7
//     --gia          nap SenseiMotion GIA (ghi lai loi goi) thay js/motion.js — thu rieng diem noi D
//     --chung        chan js/motion-canh-chu.js + motion-canh-hoi.js (+ css): dao dien chi co canh chung
//     --cong         CDP qua cong 9700-9799 (mac dinh: --remote-debugging-pipe, khong ai khac noi vao duoc)
//     --r 0.1        giay/don vi cua mo phong (nho = chay nhanh hon)
//     --w 1440 --h 900   kich thuoc mac dinh
//     --doan tu-den  gioi han nhip cho T4/T5/T7/T8/T9/T11 (vd 0-20)
//     --han 45       han mac dinh (phut) cua moi lan chayDoan (het han: dong 'harness' + hetHan o tong ket)
//   In JSON tong ket ra stdout; bao cao chi tiet: scratchpad/motion/ket-qua/<ten>-<gio>.json (+ anh chup)
//
// Khong bao gio mo phien Gemini Live: luon ?noLive&moPhong (http.server khong sinh env.js -> khong co key).
import { spawn, execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';

const SCR = 'C:/Users/OS/AppData/Local/Temp/claude/E--ai-live-sensei-classroom/85f3af15-28af-4f9f-8bfc-2fc053ff9125/scratchpad';
const MOTION = path.join(SCR, 'motion');
const VIEC = path.join(MOTION, 'D');
const KQ = path.join(MOTION, 'ket-qua');
const DU_AN = 'E:/ai-live-sensei-classroom';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
fs.mkdirSync(VIEC, { recursive: true });
fs.mkdirSync(KQ, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const gio = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

// ------------------------------------------------------------------ tham so dong lenh
const argv = process.argv.slice(2);
const TUY = { ten: [], goc: null, them: '', gia: false, chung: false, cong: false, lietKe: false, r: null, w: 1440, h: 900, doan: null, sel: null, loai: null, man: null, han: 45 };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--goc') TUY.goc = argv[++i];
  else if (a === '--sel') TUY.sel = JSON.parse(argv[++i]);
  else if (a === '--loai') TUY.loai = argv[++i].split(',').map((x) => x.trim()).filter(Boolean);
  else if (a === '--man') TUY.man = argv[++i].split(',').map((x) => x.split('x').map(Number));
  else if (a === '--them') TUY.them += argv[++i];
  else if (a === '--gia') TUY.gia = true;
  else if (a === '--chung') TUY.chung = true;
  else if (a === '--cong') TUY.cong = true;
  else if (a === '--liet-ke') TUY.lietKe = true;
  else if (a === '--r') TUY.r = Number(argv[++i]);
  else if (a === '--w') TUY.w = Number(argv[++i]);
  else if (a === '--h') TUY.h = Number(argv[++i]);
  else if (a === '--han') TUY.han = Number(argv[++i]);
  else if (a === '--doan') { const [x, y] = argv[++i].split('-').map(Number); TUY.doan = [x, y]; }
  else TUY.ten.push(a);
}
if (!TUY.ten.length) TUY.ten = ['smoke'];
const BO_V2 = ['A1', 'A2', 'A3', 'A4', 'A5'];
// T14 (console) luon chay cuoi: no tinh tu nhat ky cua ca lan chay
// T3R (tester r2): T3 duoi prefers-reduced-motion — nam trong 'all' ngay sau T3
const moRong = (ds) => ds.flatMap((x) => (x === 'all' ? [...Array.from({ length: 15 }, (_, i) => 'T' + (i + 1)).flatMap((k) => (k === 'T3' ? ['T3', 'T3R'] : [k])), ...BO_V2] : x === 'v2' ? [...BO_V2, 'ANH'] : [x]));
TUY.ten = [...new Set(moRong(TUY.ten))];
if (TUY.ten.includes('T14')) TUY.ten = [...TUY.ten.filter((x) => x !== 'T14'), 'T14'];
const ANH_V2 = path.join(MOTION, 'anh-v2');

// ------------------------------------------------------------------ tien trinh (chi PID cua minh)
const PID = [];
function giet(pid) {
  return new Promise((r) => {
    if (!pid) return r();
    if (process.platform === 'win32') execFile('taskkill', ['/PID', String(pid), '/T', '/F'], () => r());
    else { try { process.kill(pid, 'SIGKILL'); } catch {} r(); }
  });
}
async function donDep() { for (const p of PID.splice(0)) await giet(p); }
process.on('SIGINT', async () => { await donDep(); process.exit(130); });
process.on('SIGTERM', async () => { await donDep(); process.exit(143); });

async function congTrong(a, b) {
  for (let i = 0; i < 60; i++) {
    const p = a + Math.floor(Math.random() * (b - a + 1));
    const ok = await new Promise((r) => { const s = net.createServer(); s.once('error', () => r(false)); s.listen(p, '127.0.0.1', () => s.close(() => r(true))); });
    if (ok) return p;
  }
  throw new Error('khong con cong trong ' + a + '-' + b);
}

async function moServer() {
  if (TUY.goc) return TUY.goc.replace(/\/$/, '');
  const port = await congTrong(3900, 3999);
  const p = spawn('python', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: DU_AN, stdio: 'ignore', windowsHide: true });
  PID.push(p.pid);
  const goc = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 50; i++) { try { const r = await fetch(goc + '/index.html'); if (r.ok) return goc; } catch {} await sleep(200); }
  throw new Error('server khong len');
}

// ------------------------------------------------------------------ CDP
// Mot duong CDP (pipe hoac websocket), nhieu phien (sessionId). phien(sid) -> { send, on }.
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

const CO_CHROME = () => ['--headless=new', '--no-first-run', '--no-default-browser-check', '--mute-audio',
  '--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
  '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', `--window-size=${TUY.w},${TUY.h}`];

/**
 * Chrome headless rieng (ho so rieng). Mac dinh --remote-debugging-pipe: khong mo cong nao, nen harness
 * cua nguoi khac (cong co dinh 97xx) khong the noi nham vao va dieu huong tab cua minh (da xay ra: T2
 * lan truoc nap trang tu server 3947 la cua builder khac). --cong: cach cu qua cong 9700-9799.
 */
async function moChrome() {
  const ma = TUY.cong ? await congTrong(9700, 9799) : 'p' + process.pid + '-' + Math.floor(Math.random() * 1e4);
  const prof = path.join(VIEC, 'prof-' + ma);
  let kn, p, dongWs = () => {};
  if (TUY.cong) {
    p = spawn(CHROME, [...CO_CHROME(), `--remote-debugging-port=${ma}`, `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore', windowsHide: true });
    PID.push(p.pid);
    let ds = [];
    for (let i = 0; i < 80; i++) {
      try { ds = await (await fetch(`http://127.0.0.1:${ma}/json/list`)).json(); if (ds.find((t) => t.type === 'page')) break; } catch {}
      await sleep(200);
    }
    const t = ds.find((x) => x.type === 'page');
    if (!t) throw new Error('chrome khong mo duoc trang');
    const ws = new WebSocket(t.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r, { once: true }));
    kn = new KetNoi((s) => ws.send(s));
    ws.addEventListener('message', (e) => kn.nhan(e.data));
    dongWs = () => { try { ws.close(); } catch {} };
    return { cdp: kn.phien(null), pid: p.pid, prof, dong: async () => { dongWs(); await giet(p.pid); } };
  }
  p = spawn(CHROME, [...CO_CHROME(), '--remote-debugging-pipe', `--user-data-dir=${prof}`, 'about:blank'],
    { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'], windowsHide: true });
  PID.push(p.pid);
  const vao = p.stdio[3], ra = p.stdio[4];
  kn = new KetNoi((s) => vao.write(s + '\0'));
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
  if (!trang) { try { trang = { targetId: (await kn.send('Target.createTarget', { url: 'about:blank' })).targetId }; } catch {} }
  if (!trang) throw new Error('chrome (pipe) khong mo duoc trang');
  const { sessionId } = await kn.send('Target.attachToTarget', { targetId: trang.targetId, flatten: true });
  return { cdp: kn.phien(sessionId), pid: p.pid, prof, dong: async () => { try { await Promise.race([kn.send('Browser.close'), sleep(1500)]); } catch {} await giet(p.pid); } };
}

// ------------------------------------------------------------------ trang
const CHAN_CANH = ['*/js/motion-canh-chu.js*', '*/js/motion-canh-hoi.js*', '*/css/motion-chu.css*', '*/css/motion-hoi.css*'];
class Trang {
  constructor(cdp, goc) {
    this.c = cdp; this.goc = goc; this.log = []; this.nap = 0;
    cdp.on('Runtime.consoleAPICalled', (p) => this.log.push({ loai: p.type, text: p.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 400), luc: Date.now() }));
    cdp.on('Runtime.exceptionThrown', (p) => this.log.push({ loai: 'exception', text: (p.exceptionDetails.exception?.description || p.exceptionDetails.text || '').slice(0, 600), luc: Date.now() }));
    cdp.on('Log.entryAdded', (p) => { if (p.entry.level === 'error') this.log.push({ loai: 'log-error', text: (p.entry.text + ' ' + (p.entry.url || '')).slice(0, 300), luc: Date.now() }); });
  }
  async batDau() {
    await this.c.send('Page.enable'); await this.c.send('Runtime.enable'); await this.c.send('Log.enable');
    await this.c.send('Network.enable', { maxTotalBufferSize: 0, maxResourceBufferSize: 0 });
    // Trang chi duoc o tren server cua minh: bi ai dieu huong sang goc khac thi ghi lai (bao cao se thay)
    this.c.on('Page.frameNavigated', (p) => {
      const u = p.frame && !p.frame.parentId ? p.frame.url : null;
      if (u && this.goc && !u.startsWith(this.goc) && u !== 'about:blank') this.log.push({ loai: 'exception', text: 'trang bi dieu huong ra ngoai: ' + u, luc: Date.now() });
    });
    await this.coManHinh(TUY.w, TUY.h);
  }
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
  /** Bam that vao giua phan tu (sel CSS hoac bieu thuc tra ve Element khi bat dau bang '=') */
  async bam(sel) {
    const expr = sel.startsWith('=') ? sel.slice(1) : `document.querySelector(${JSON.stringify(sel)})`;
    const r = await this.ev(`(() => { const e = ${expr}; if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, h: b.height }; })()`);
    if (!r || !r.w) return null;
    await this.click(r.x, r.y);
    return r;
  }
  async phim(key) {
    const code = /^[a-z]$/i.test(key) ? 'Key' + key.toUpperCase() : /^\d$/.test(key) ? 'Digit' + key : key;
    const vk = /^[a-z]$/i.test(key) ? key.toUpperCase().charCodeAt(0) : /^\d$/.test(key) ? key.charCodeAt(0)
      : ({ ArrowRight: 39, ArrowLeft: 37, Enter: 13, Escape: 27 })[key] || 0;
    const text = key.length === 1 ? key : undefined;
    await this.c.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk, text });
    await this.c.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk });
  }
  async go(text) { await this.c.send('Input.insertText', { text }); }
  async chup(ten, thu = KQ) {
    const r = await this.c.send('Page.captureScreenshot', { format: 'png' });
    fs.mkdirSync(thu, { recursive: true });
    const f = path.join(thu, ten);
    fs.writeFileSync(f, Buffer.from(r.data, 'base64'));
    return f;
  }
  /** Anh cho buoi duyet thiet ke v2 (motion/anh-v2/) */
  async chupV2(ten) { return this.chup(ten, ANH_V2); }
  /** Mo trang moi voi tham so; cho app san sang, cai do dac, mo bai N5-1 */
  async moBai({ them = '', gia = TUY.gia, chung = TUY.chung, xoaHoc = true, bai = ['N5', 1], w, h } = {}) {
    if (w) await this.coManHinh(w, h);
    // --chung: dao dien khong co builder canh nao (B / C) -> chi dung canh chung cua A.
    // --gia: chan luon js/motion.js (no gan de window.SenseiMotion / __motion len ban GIA)
    await this.c.send('Network.setBlockedURLs', { urls: [...(chung ? CHAN_CANH : []), ...(gia ? ['*/js/motion.js*'] : [])] });
    this.chung = !!chung;
    const truoc = [];
    if (xoaHoc) truoc.push(`try { localStorage.removeItem('sk.dongBo'); } catch (e) {}`);
    if (gia) truoc.push(`(${saoGia.toString()})();`);
    if (this._sc) { try { await this.c.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: this._sc }); } catch {} this._sc = null; }
    if (truoc.length) this._sc = (await this.c.send('Page.addScriptToEvaluateOnNewDocument', { source: truoc.join('\n') })).identifier;
    const r = TUY.r != null && !/[?&]r=/.test(them) ? `&r=${TUY.r}` : '';
    const url = `${this.goc}/?noLive&moPhong&hat=7${r}${TUY.them}${them}`;
    this.url = url;
    await this.c.send('Page.navigate', { url });
    this.nap++;
    const ok = await this.cho(`!!(window.__lecture && window.jumpToLesson && window.__moPhong && document.querySelector('#pickerBody .lesson-card'))`, 20000, 150);
    if (!ok) throw new Error('app chua san sang: ' + url);
    await this.ev(`window.__ktSel = ${JSON.stringify(TUY.sel || {})}; true`);
    await this.ev(`(${caiKt.toString()})()`);
    await this.ev(`window.jumpToLesson(${JSON.stringify(bai[0])}, ${bai[1]}).then(() => true)`);
    await this.cho(`__lecture.beats().length > 0`, 10000);
    await this.cho(`!document.querySelector('#pickerModal:not(.hidden), .picker:not(.hidden)') || true`, 2000);
    await sleep(300);
  }
}

// ------------------------------------------------------------------ SenseiMotion GIA (--gia): chi ghi lai loi goi
function saoGia() {
  if (window.SenseiMotion) return;
  const tat = /[?&]khongSanKhau\b/i.test(location.search);
  const goi = window.__goiSK = [];
  let che = 'tat', epoch = 0, nhip = null, kind = null, luot = 0;
  const ghi = (ten, a) => goi.push({ ten, luc: performance.now(), a });
  const doi = (c) => { if (c !== che) { che = c; epoch++; } };
  const SM = {
    bat: !tat, __gia: true,
    init(o) { ghi('init', Object.keys(o || {})); SM._o = o; },
    batDauNhip(b, ctx) {
      ghi('batDauNhip', { i: b.index, kind: b.kind, focus: window.__slideEngine && __slideEngine.activeFocusId,
        ctx: { i: ctx.i, n: ctx.n, chuong: ctx.chuong, laBatDau: ctx.laBatDau, isResume: ctx.isResume, truoc: ctx.truoc && ctx.truoc.index,
               coBai: !!ctx.bai, capDo: ctx.capDo, soNhip: ctx.cacNhip && ctx.cacNhip.length } });
      nhip = b.index; kind = b.kind; doi('giang');
    },
    khiHetNhip(o) { ghi('khiHetNhip', { tiep: o.tiep ? o.tiep.index : null, gapMs: o.gapMs, tongKet: o.tongKet, soChuong: o.cacNhipChuongTiep ? o.cacNhipChuongTiep.length : null }); doi('chuyen'); },
    tamDung() { ghi('tamDung'); doi('tat'); },
    tiepTuc() { ghi('tiepTuc'); },
    dung() { ghi('dung'); doi('tat'); nhip = null; },
    dongBo(s, o) { ghi('dongBo', { s, gio: !!(o && o.isRaisingHand) }); if (s !== 'PLAYING') doi('tat'); },
    khiGuiLuot() { ghi('khiGuiLuot', { che }); if (che === 'giang' || che === 'chuyen') luot++; },
    khiCoAmThanh(b64, t0, t1) { ghi('khiCoAmThanh', { n: b64.length, t0, t1 }); },
    khiMatAmThanh(b64, ly) { ghi('khiMatAmThanh', { n: b64.length, ly }); },
    khiCoLoi(d, qEnd) { ghi('khiCoLoi', { d, qEnd, luot }); },
    khiTuNgat() { ghi('khiTuNgat'); },
    khiXaHang() { ghi('khiXaHang'); },
    khiLuotXong(t) { ghi('khiLuotXong', { t }); },
    khiCongCu(n, a) { ghi('khiCongCu', { n, a }); return null; },
    khiDongThoai(l, i) { ghi('khiDongThoai', { id: l && l.id, i }); },
    khiClip(id, o) { ghi('khiClip', { id, t0: o.t0, dur: o.dur, n: o.pcm ? (o.pcm.length || 0) : 0 }); },
    khiGiongMay(id, su, ci) { ghi('khiGiongMay', { id, su, ci }); },
    khiXongDong(id) { ghi('khiXongDong', { id }); },
    vaoCho(b) { ghi('vaoCho', { i: b.index, id: b.data && b.data.id }); doi('cho'); },
    raCho() { ghi('raCho'); doi('chuyen'); },
    khiTraLoi(id, d) { ghi('khiTraLoi', { id, d }); },
    datDemTiep(ms) { ghi('datDemTiep', { ms }); },
    dangGiang: () => che !== 'tat',
    dangCho: () => che === 'cho',
    trangThai: () => ({ che, epoch, nhip, kind, cues: [], luot }),
    dangKyCanh() {},
    hu: {},
  };
  window.SenseiMotion = SM;
  window.__motion = { nhatKy: () => [], cues: () => [], trangThai: SM.trangThai, luotHienTai: () => luot, datThamSo() {}, xoaNhatKy() {} };
}

// ------------------------------------------------------------------ do dac trong trang (__kt)
function caiKt() {
  if (window.__kt) return 'co san';
  const kt = window.__kt = {
    dong: [], nhipDoi: [], raCanh: [], trungId: [], cuesHet: [], karaoke: [], hoat: { vuot: [], dongThoiMax: 0, netMax: 0, mau: 0, giamVuot: [] },
    khung: [], lt: [], coBangKhiGiang: [], lucVaoCho: {}, boCuc: null, doBoCuc: false, loiDo: [],
  };
  const bg = () => { try { return window.__moPhong.bayGio(); } catch (e) { return null; } };
  const tt = () => { try { return window.__motion ? window.__motion.trangThai() : null; } catch (e) { return null; } };
  const cues = () => { try { return window.__motion && window.__motion.cues ? JSON.parse(JSON.stringify(window.__motion.cues() || [])) : []; } catch (e) { return [{ loi: String(e) }]; } };
  kt.bg = bg;

  // Doi nhip (khong can SenseiMotion — dung cho ca ?khongSanKhau)
  let iTruoc = -9;
  setInterval(() => {
    const i = window.__lecture ? window.__lecture.index() : -1;
    if (i !== iTruoc) { kt.nhipDoi.push({ i, luc: performance.now(), ctx: bg(), st: window.__lecture.state().lectureState }); iTruoc = i; }
  }, 20);

  // Id trung
  kt.trungIdNay = () => {
    const dem = {};
    document.querySelectorAll('[id]').forEach((e) => { dem[e.id] = (dem[e.id] || 0) + 1; });
    return Object.keys(dem).filter((k) => dem[k] > 1);
  };

  // Khung cuoi cua canh dang song (T6)
  kt.khungCuoi = () => {
    // Goc canh: .sk-canh ngoai cung moi nhat (bo cuc v1 .sk-san > .sk-canh hay v2 the .sk-the ben trong)
    const stg = document.getElementById('sanKhauGiang');
    const ds = stg ? [...stg.querySelectorAll('.sk-canh')].filter((e) => !e.closest('.sk-lop-bay') && !(e.parentElement && e.parentElement.closest('.sk-canh'))
      && !/sk-the-(chuong|xong)/.test(e.className)) : [];
    let canh = ds[ds.length - 1];
    if (!canh && stg) canh = [...stg.querySelectorAll((window.__ktSel && window.__ktSel.the) || '.sk-the')].pop();
    if (!canh) return { coCanh: false };
    const an = [...canh.querySelectorAll('.sk-an')].filter((e) => !e.closest('.sk-phu-bo') && !/goi-?y|hint/i.test(e.className));
    return {
      coCanh: true, lop: canh.className, soAn: an.length,
      an: an.slice(0, 6).map((e) => e.className + ' | ' + (e.textContent || '').trim().slice(0, 40)),
      text: (canh.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 600),
      soLuaChon: canh.querySelectorAll('[class*="sk-bt"][class*="dap"], [class*="sk-bt"][class*="opt"], [class*="sk-bt"][class*="lc"], [class*="sk-bt"][class*="lua"], .qz-opt').length,
      soIdSt: canh.querySelectorAll('[id^="st-"]').length,
    };
  };

  // Bo cuc (T10)
  kt.boCucNay = () => {
    const st = document.getElementById('sanKhauGiang');
    if (!st || st.hidden || getComputedStyle(st).display === 'none') return { coSanKhau: false, vw: innerWidth, scrollW: document.documentElement.scrollWidth };
    const vw = innerWidth, vh = innerHeight;
    const cs = getComputedStyle(st), r0 = st.getBoundingClientRect();
    const hop = { l: r0.left + parseFloat(cs.paddingLeft), t: r0.top + parseFloat(cs.paddingTop), r: r0.right - parseFloat(cs.paddingRight), b: r0.bottom - parseFloat(cs.paddingBottom) };
    const root = getComputedStyle(document.documentElement);
    const sr = parseFloat(root.getPropertyValue('--sensei-rong')) || 0, sc = parseFloat(root.getPropertyValue('--sensei-cao')) || 0;
    const bot = document.querySelector('.deck-bottom');
    const bt = bot ? bot.getBoundingClientRect().top : vh;
    const meo = { l: vw - sr, t: bt - sc - 36, r: vw, b: bt };
    const loi = [], catDoc = [];
    const lopP = (p) => String(p.className && p.className.baseVal !== undefined ? p.className.baseVal : p.className || p.id || p.tagName).slice(0, 44);
    // (tester r2) khung cat = overflow != visible HOAC contain paint / strict / content (.sk-canh co contain: layout paint)
    const catPaint = (cs2) => /paint|strict|content/.test(cs2.contain || '');
    const w = document.createTreeWalker(st, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      if (!n.textContent.trim()) continue;
      const el = n.parentElement;
      if (!el || el.closest('.sk-lop-bay, .sk-sr')) continue;
      if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, opacityProperty: true, visibilityProperty: true })) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      // (tester r1) cat theo khung overflow cua to tien: day phim (.sk-phim overflow:hidden) va dong
      // text-overflow:ellipsis bi cat that, nhung Range.getClientRects tra hop CHUA cat -> T10 bao sai
      const cl = { l: -1e9, t: -1e9, r: 1e9, b: 1e9 };
      const catY = [];   // to tien cat theo chieu doc (cho do 'cat-doc')
      for (let p = el; p && p !== st.parentElement; p = p.parentElement) {
        const cs2 = getComputedStyle(p);
        const cp = catPaint(cs2), cx = cp || cs2.overflowX !== 'visible', cy = cp || cs2.overflowY !== 'visible';
        if (cx || cy) {
          const bb = p.getBoundingClientRect();
          if (cx) { cl.l = Math.max(cl.l, bb.left); cl.r = Math.min(cl.r, bb.right); }
          if (cy) { cl.t = Math.max(cl.t, bb.top); cl.b = Math.min(cl.b, bb.bottom); catY.push({ p, bb, cs2 }); }
        }
      }
      const trongPhim = !!el.closest('.sk-phim');   // day phim cat co chu y (cua so truot) -> khong tinh cat-doc
      for (const r0 of rg.getClientRects()) {
        const r = { left: Math.max(r0.left, cl.l), right: Math.min(r0.right, cl.r), top: Math.max(r0.top, cl.t), bottom: Math.min(r0.bottom, cl.b) };
        r.width = r.right - r.left; r.height = r.bottom - r.top;
        if (r.width < 1 || r.height < 1) continue;
        const tx = n.textContent.trim().slice(0, 24);
        // (tester r2, P10C) cat DOC mot phan: dong chu con thay (> 1 px) nhung lo tren / duoi khung cat > 2 px
        // -> chu bi cat nua dong. Phan con thay van 'trong hop' nen 'ngoai-hop' khong bat duoc.
        if (!trongPhim && (cl.t - r0.top > 2 || r0.bottom - cl.b > 2)) {
          const boi = catY.filter((k) => k.bb.top - r0.top > 2 || r0.bottom - k.bb.bottom > 2)
            .map((k) => lopP(k.p) + '|' + k.cs2.overflowY + '|' + (k.cs2.contain || 'none'));
          catDoc.push({ loai: 'cat-doc', tx, lop: lopP(el), boi: boi.slice(0, 2), tren: Math.round(cl.t - r0.top), duoi: Math.round(r0.bottom - cl.b), r: [r0.left, r0.top, r0.right, r0.bottom].map(Math.round) });
        }
        if (r.left < hop.l - 1 || r.right > hop.r + 1 || r.top < hop.t - 1 || r.bottom > hop.b + 1) loi.push({ loai: 'ngoai-hop', tx, r: [r.left, r.top, r.right, r.bottom].map(Math.round) });
        if (vw < 1000 && sr && r.right > meo.l && r.left < meo.r && r.bottom > meo.t && r.top < meo.b) loi.push({ loai: 'de-meo', tx, r: [r.left, r.top, r.right, r.bottom].map(Math.round) });
        if (vw >= 1000 && sr && r.right > vw - sr + 1) loi.push({ loai: 'lan-lan-meo', tx, r: [r.left, r.top, r.right, r.bottom].map(Math.round) });
      }
    }
    const the = [...st.querySelectorAll('.sk-the')].filter((e) => !e.classList.contains('is-vo')).pop();
    const skCo = the ? getComputedStyle(the.querySelector('.sk-canh') || the).getPropertyValue('--sk-co').trim() || null : null;
    return { coSanKhau: true, vw, vh, scrollW: document.documentElement.scrollWidth, hop, meo, sr, sc, soLoi: loi.length, loi: loi.slice(0, 12),
      soCatDoc: catDoc.length, catDoc: catDoc.slice(0, 8), skCo };
  };

  // Boc SenseiMotion (neu co va ghi duoc): moc thoi gian + chup canh truoc khi roi
  const SM = window.SenseiMotion;
  const boc = (ten, truoc, sau) => {
    try {
      const g = SM && SM[ten];
      if (typeof g !== 'function') return;
      SM[ten] = function (...a) {
        try { truoc && truoc(...a); } catch (e) { kt.loiDo.push(ten + ': ' + e); }
        const r = g.apply(this, a);
        try { sau && sau(r, ...a); } catch (e) { kt.loiDo.push(ten + ': ' + e); }
        return r;
      };
    } catch (e) { kt.khongBoc = String(e); }
  };
  let nhipSong = null;
  const v2 = () => { try { return kt.doV2 && kt.v2Nay ? kt.v2Nay() : null; } catch (e) { return { loi: String(e) }; } };
  if (SM && SM.bat) {
    boc('batDauNhip', (beat) => {
      kt._tBd = performance.now();
      kt.raCanh.push({ i: nhipSong, luc: performance.now(), ctx: bg(), khung: kt.khungCuoi(), cues: cues(), boCuc: kt.doBoCuc ? kt.boCucNay() : null, v2: v2(), tiep: beat.index });
    }, (r, beat) => {
      nhipSong = beat.index;
      kt.dong.push({ ten: 'batDauNhip', i: beat.index, kind: beat.kind, luc: performance.now(), ctx: bg(), tt: tt() });
      kt.trungId.push({ khi: 'batDauNhip', i: beat.index, trung: kt.trungIdNay() });
      if (kt.xetVao) kt.xetVao(beat, kt._tBd);
    });
    boc('khiHetNhip', (o) => {
      kt.cuesHet.push({ i: nhipSong, pha: 'truoc', luc: performance.now(), cues: cues() });
      kt.dong.push({ ten: 'khiHetNhip', i: nhipSong, luc: performance.now(), ctx: bg(), tiep: o && o.tiep ? o.tiep.index : null, gapMs: o && o.gapMs });
      const i = nhipSong, tre = o && o.tiep ? 450 : 250;
      setTimeout(() => { if (nhipSong === i) kt.raCanh.push({ i, luc: performance.now(), ctx: bg(), khung: kt.khungCuoi(), cues: cues(), boCuc: kt.doBoCuc ? kt.boCucNay() : null, v2: v2(), tiep: o && o.tiep ? o.tiep.index : null, khi: 'khoang-nghi' }); }, tre);
    }, () => { kt.cuesHet.push({ i: nhipSong, pha: 'sau', luc: performance.now(), cues: cues() }); });
    boc('vaoCho', (b) => {
      kt.lucVaoCho[b.index] = performance.now();
      kt.dong.push({ ten: 'vaoCho', i: b.index, luc: performance.now(), ctx: bg() });
      kt.raCanh.push({ i: b.index, luc: performance.now(), khung: kt.khungCuoi(), cues: cues(), khi: 'vaoCho' });
      setTimeout(() => kt.trungId.push({ khi: 'cho', i: b.index, trung: kt.trungIdNay() }), 600);
      if (kt.a5Vao) kt.a5Vao(b);
    });
    ['raCho', 'tamDung', 'dung', 'tiepTuc', 'khiTraLoi', 'datDemTiep'].forEach((ten) => boc(ten, (...a) => {
      kt.dong.push({ ten, i: window.__lecture.index(), luc: performance.now(), ctx: bg(), a: ten === 'khiTraLoi' ? a : ten === 'datDemTiep' ? a[0] : undefined });
    }, ['raCho', 'tamDung', 'dung'].includes(ten) ? () => { if (kt.a5Ra) kt.a5Ra(ten); } : null));
  }

  // Dao dien THAT: ghi moi loi goi app -> SenseiMotion vao __goiSK (cung dang voi ban GIA) de
  // doi chieu voi su that mo phong (DC). GIA tu ghi roi. init da chay truoc khi cai (khong ghi duoc).
  if (SM && SM.bat && !SM.__gia) {
    const goi = window.__goiSK = window.__goiSK || [];
    const luotId = () => { try { return window.__motion.luotHienTai(); } catch (e) { return null; } };
    const ghi = (ten, a) => { if (goi.length < 60000) goi.push({ ten, luc: performance.now(), a }); };
    const TOM = {
      batDauNhip: (b, ctx) => ({ i: b.index, kind: b.kind, focus: window.__slideEngine && __slideEngine.activeFocusId,
        ctx: ctx && { i: ctx.i, n: ctx.n, chuong: ctx.chuong, laBatDau: ctx.laBatDau, isResume: ctx.isResume, truoc: ctx.truoc && ctx.truoc.index,
          coBai: !!ctx.bai, capDo: ctx.capDo, soNhip: ctx.cacNhip && ctx.cacNhip.length } }),
      khiHetNhip: (o) => ({ tiep: o && o.tiep ? o.tiep.index : null, gapMs: o && o.gapMs, tongKet: o && o.tongKet, soChuong: o && o.cacNhipChuongTiep ? o.cacNhipChuongTiep.length : null }),
      tamDung: () => null, tiepTuc: () => null, dung: () => null,
      dongBo: (s, o) => ({ s, gio: !!(o && o.isRaisingHand) }),
      khiGuiLuot: () => ({ che: (tt() || {}).che }),
      khiCoAmThanh: (b64, t0, t1) => ({ n: b64.length, t0, t1 }),
      khiMatAmThanh: (b64, ly) => ({ n: b64.length, ly }),
      khiCoLoi: (d, qEnd) => ({ d, qEnd, luot: luotId() }),
      khiTuNgat: () => null, khiXaHang: () => null,
      khiLuotXong: (t) => ({ t }),
      khiDongThoai: (l, i) => ({ id: l && l.id, i }),
      khiClip: (id, o) => ({ id, t0: o && o.t0, dur: o && o.dur, n: o && o.pcm ? (o.pcm.length || 0) : 0 }),
      khiGiongMay: (id, su, ci) => ({ id, su, ci }),
      khiXongDong: (id) => ({ id }),
      vaoCho: (b) => ({ i: b.index, id: b.data && b.data.id }),
      raCho: () => null,
      khiTraLoi: (id, d) => ({ id, d }),
      datDemTiep: (ms) => ({ ms }),
    };
    Object.keys(TOM).forEach((ten) => boc(ten, (...a) => ghi(ten, TOM[ten](...a)), ten === 'khiGuiLuot' ? () => { goi[goi.length - 1] && goi[goi.length - 1].ten === 'khiGuiLuot' && (goi[goi.length - 1].a.luot = luotId()); } : null));
    boc('khiCongCu', null, (r, n, a) => ghi('khiCongCu', { n, a, kq: r == null ? null : JSON.parse(JSON.stringify(r)), che: (tt() || {}).che }));
  }

  // Karaoke: token st-<id> nhan .is-doc (T4)
  new MutationObserver((ms) => {
    for (const m of ms) {
      const e = m.target;
      if (m.type !== 'attributes' || !e.id || !e.id.startsWith('st-')) continue;
      const co = e.classList.contains('is-doc'), cu = (m.oldValue || '').split(/\s+/).includes('is-doc');
      if (co && !cu) kt.karaoke.push({ id: e.id.slice(3), luc: performance.now(), ctx: bg() });
    }
    // body.co-bang trong luc giang (T12)
    const b = document.body.classList;
    if (b.contains('co-bang') && b.contains('dang-giang')) kt.coBangKhiGiang.push(performance.now());
    // (tester r1) khoang dang giang theo dong ho trang: T8 gan tac vu dai theo startTime (khong theo luc callback)
    const gg = b.contains('dang-giang'); kt.giangKhoang = kt.giangKhoang || [];
    if (gg !== !!kt._gg) { kt._gg = gg; if (gg) kt.giangKhoang.push([performance.now(), null]); else if (kt.giangKhoang.length) kt.giangKhoang[kt.giangKhoang.length - 1][1] = performance.now(); }
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });

  // Hoat anh (T7/T8/T9): moc Element.animate + lay mau getAnimations()
  const trongSan = (el) => !!(el && el.closest && (el.closest('#sanKhauGiang') || (document.body.classList.contains('sk-cho') && el.closest('#slideContent .qz-card, #slideContent [id^="card-"]'))));
  const DUOC = new Set(['translate', 'scale', 'opacity']);
  const NET = new Set(['stroke-dashoffset', 'strokeDashoffset', 'fill-opacity', 'fillOpacity']);
  const tenTT = (kf) => { const s = new Set(); (kf || []).forEach((k) => Object.keys(k).forEach((p) => { if (!['offset', 'easing', 'composite', 'computedOffset'].includes(p)) s.add(p); })); return [...s]; };
  kt.hetHoatAnh = 0;
  const gocAnimate = Element.prototype.animate;
  Element.prototype.animate = function (kf, op) {
    const a = gocAnimate.call(this, kf, op);
    try {
      if (trongSan(this)) {
        const d = typeof op === 'number' ? op : (op && (op.duration || 0) + (op.delay || 0)) || 0;
        kt.hetHoatAnh = Math.max(kt.hetHoatAnh, performance.now() + d);
      }
      if (kt.ghiHoat) kt.ghiHoat(this, 'waapi', kf, op);
    } catch (e) {}
    return a;
  };
  setInterval(() => {
    let dem = 0, net = 0, demHd = 0;
    const giam = matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const a of document.getAnimations()) {
      if (a.playState !== 'running') continue;
      const el = a.effect && a.effect.target;
      if (!trongSan(el)) continue;
      dem++;
      // (tester r1) pha hoat dong: bo hoat anh con dang cho delay (vd net chu Han xep hang)
      try { const tm = a.effect.getComputedTiming(); const lt = a.currentTime; const d0 = tm.delay || 0; if (lt != null && lt >= d0 && lt < d0 + (tm.activeDuration || 0)) demHd++; } catch (e) { demHd++; }
      let props = [];
      try { props = tenTT(a.effect.getKeyframes()); } catch (e) {}
      const laNet = el.closest('.bang-kanji-duong, .sk-ve') || el.matches('.bang-kanji-duong, .sk-ve *');
      if (props.some((p) => NET.has(p))) net++;
      const sai = props.filter((p) => !DUOC.has(p) && !(laNet && NET.has(p)));
      if (sai.length && kt.hoat.vuot.length < 40) kt.hoat.vuot.push({ props: sai, lop: String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).slice(0, 60), ten: a.animationName || a.id || '' });
      if (giam && props.some((p) => p === 'translate' || p === 'scale' || p === 'transform') && kt.hoat.giamVuot.length < 40) kt.hoat.giamVuot.push({ props, lop: String(el.className).slice(0, 60) });
    }
    kt.hoat.mau++;
    kt.hoat.dongThoiMaxHd = Math.max(kt.hoat.dongThoiMaxHd || 0, demHd);
    if (demHd > 12) {
      kt.hoat.qua12Hd = (kt.hoat.qua12Hd || 0) + 1;
      // (tester r2) mau: lop + ten hoat anh dang chay khi vuot 12
      kt.hoat.dtMau = kt.hoat.dtMau || [];
      if (kt.hoat.dtMau.length < 6) kt.hoat.dtMau.push({ nhip: window.__lecture ? __lecture.index() : null, dem: demHd, ds: document.getAnimations().filter(a => a.playState === 'running' && trongSan(a.effect && a.effect.target)).slice(0, 18).map(a => String(a.effect.target.className && a.effect.target.className.baseVal !== undefined ? a.effect.target.className.baseVal : a.effect.target.className).slice(0, 28) + '@' + (a.animationName || 'waapi')) });
    }
    kt.hoat.dongThoiMax = Math.max(kt.hoat.dongThoiMax, dem);
    kt.hoat.netMax = Math.max(kt.hoat.netMax, net);
    if (dem > 12) kt.hoat.qua12 = (kt.hoat.qua12 || 0) + 1;
  }, 100);

  // Khe khung hinh rAF luc co hoat anh (T8)
  let tr = performance.now();
  const khung = (t) => {
    if (t < kt.hetHoatAnh + 16) kt.khung.push(t - tr);
    tr = t;
    requestAnimationFrame(khung);
  };
  requestAnimationFrame(khung);

  // Tac vu dai (T8)
  try {
    new PerformanceObserver((l) => l.getEntries().forEach((e) => kt.lt.push({ luc: e.startTime, ms: e.duration, giang: document.body.classList.contains('dang-giang') })))
      .observe({ type: 'longtask', buffered: true });
  } catch (e) {}

  // ---------------------------------------------------------------- bo sung v2 (A1-A5)
  // Bo chon: the trinh bay .sk-the, dai phim .sk-phim (ten co dinh trong ban bo sung); dong tieu de
  // khong co ten co dinh -> nhan theo hinh hoc (ngay tren the). tro = con tro doc, chip = chip tro tu.
  const SEL = Object.assign({ the: '.sk-the', phim: '.sk-phim',
    // (tester r1) + con tro doc cua B (.sk-chu-tro[data-sk-tro]) — ghi chu ban giao cua B
    tro: '[class*="con-tro"], [class*="contro"], .sk-tro, .sk-chu-tro, [data-sk-tro], [class*="sk-cursor"], [class*="doc-tro"]', chip: '.sk-chip' }, window.__ktSel || {});
  kt.sel = SEL;
  const hienRo = (el) => !!el && (!el.checkVisibility || el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }));
  const sanHien = () => { const st = document.getElementById('sanKhauGiang'); return st && !st.hidden && getComputedStyle(st).display !== 'none' && st.getBoundingClientRect().height > 0 ? st : null; };
  const hopSan = (st) => { const cs = getComputedStyle(st), r0 = st.getBoundingClientRect();
    return { l: r0.left + parseFloat(cs.paddingLeft), t: r0.top + parseFloat(cs.paddingTop), r: r0.right - parseFloat(cs.paddingRight), b: r0.bottom - parseFloat(cs.paddingBottom) }; };
  const lopCua = (el) => String(el && el.className && el.className.baseVal !== undefined ? el.className.baseVal : (el && el.className) || '').slice(0, 60);
  // The long nhau: dao dien .sk-o-the > .sk-the (co the chi la vo .is-vo) + canh tu ve .sk-the ben trong.
  // theNay = the NHIN THAY (bo vo), moi nhat theo thu tu DOM (the vao); ngoaiCung = the cap dao dien (dinh danh)
  const ngoaiCung = (el) => { let x = el && el.closest ? el.closest(SEL.the) : null; while (x && x.parentElement && x.parentElement.closest(SEL.the)) x = x.parentElement.closest(SEL.the); return x; };
  kt.theNay = () => {
    const st = sanHien(); if (!st) return null;
    const ds = [...st.querySelectorAll(SEL.the)].filter((e) => !e.closest('.sk-lop-bay') && !e.classList.contains('is-vo') && hienRo(e) && e.getBoundingClientRect().width > 10);
    return ds[ds.length - 1] || null;
  };
  // A1: the phu bao nhieu phan hop noi dung cua san khau
  kt.a1Nay = () => {
    const st = sanHien(); if (!st) return { coSanKhau: false };
    const hop = hopSan(st), the = kt.theNay();
    const dt = Math.max(1, (hop.r - hop.l) * (hop.b - hop.t));
    if (!the) return { coSanKhau: true, coThe: false, tiLe: 0 };
    const r = the.getBoundingClientRect();
    const ix = Math.max(0, Math.min(r.right, hop.r) - Math.max(r.left, hop.l)), iy = Math.max(0, Math.min(r.bottom, hop.b) - Math.max(r.top, hop.t));
    return { coSanKhau: true, coThe: true, tiLe: +(ix * iy / dt).toFixed(3), the: [r.left, r.top, r.width, r.height].map(Math.round), hop: [hop.l, hop.t, hop.r - hop.l, hop.b - hop.t].map(Math.round) };
  };
  // A2: moi chu hien tren san khau nam trong the, dai phim, hoac dong tieu de ngay tren the (<= 72 px, trong be ngang the)
  kt.a2Nay = () => {
    const st = sanHien(); if (!st) return { coSanKhau: false, soLac: 0, lac: [] };
    const the = kt.theNay(); const rt = the && the.getBoundingClientRect();
    const lac = []; let soChu = 0;
    const w = document.createTreeWalker(st, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const tx = n.textContent.replace(/\s+/g, ' ').trim(); if (!tx) continue;
      const el = n.parentElement;
      if (!el || el.closest('.sk-lop-bay, .sk-sr') || !hienRo(el)) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      const rs = [...rg.getClientRects()].filter((r) => r.width >= 1 && r.height >= 1);
      if (!rs.length) continue;
      soChu++;
      if (el.closest(SEL.the) || el.closest(SEL.phim)) continue;
      if (rt && rs.every((r) => r.bottom <= rt.top + 2 && r.top >= rt.top - 72 && r.left >= rt.left - 8 && r.right <= rt.right + 8)) continue;
      lac.push({ tx: tx.slice(0, 30), lop: lopCua(el), r: [rs[0].left, rs[0].top, rs[0].right, rs[0].bottom].map(Math.round) });
    }
    return { coSanKhau: true, coThe: !!the, soChu, soLac: lac.length, lac: lac.slice(0, 10) };
  };
  // A4: khong chuoi >= 12 ky tu nao hien hai lan (bang nhau hoac nam trong chuoi khac) tren san khau
  const chuan = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().replace(/^[“”"'«»\s.,:;!?…·—–-]+|[“”"'«»\s.,:;!?…·—–-]+$/g, '');
  kt.a4Nay = () => {
    const st = sanHien(); if (!st) return { coSanKhau: false, soTrung: 0, trung: [] };
    const ds = [];
    st.querySelectorAll('*').forEach((el) => {
      if (el.closest('.sk-lop-bay, .sk-sr')) return;
      let own = ''; for (const c of el.childNodes) if (c.nodeType === 3) own += c.textContent;
      own = chuan(own); if (own.length < 12 || !hienRo(el)) return;
      const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return;
      ds.push({ el, tx: own });
    });
    const trung = [];
    for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++) {
      const a = ds[i], b = ds[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const [ngan, dai] = a.tx.length <= b.tx.length ? [a, b] : [b, a];
      if (dai.tx.includes(ngan.tx)) trung.push({ tx: ngan.tx.slice(0, 40), o: [lopCua(ngan.el), lopCua(dai.el)], giong: a.tx === b.tx });
    }
    return { coSanKhau: true, soDoan: ds.length, soTrung: trung.length, trung: trung.slice(0, 8) };
  };
  kt.v2Nay = () => ({ luc: Math.round(performance.now()), nhip: window.__lecture ? __lecture.index() : null, che: (tt() || {}).che, a1: kt.a1Nay(), a2: kt.a2Nay(), a4: kt.a4Nay() });

  // A3: nhat ky hoat anh tren san khau (WAAPI + CSS animation + transition), ma so the de biet the vao
  const idThe = new WeakMap(); let demThe = 0;
  const maThe = (el) => { if (!el) return null; if (!idThe.has(el)) idThe.set(el, ++demThe); return idThe.get(el); };
  kt.v2 = { hoat: [], a3: { mau: 0, max: 0, qua2: [], scale: [], vao: [] }, a5: [], _a5: [], goc: {}, lechStage: 0 };
  const kf0 = (kf) => { try { if (Array.isArray(kf)) return kf[0] || {}; if (kf && typeof kf === 'object') { const o = {}; for (const k of Object.keys(kf)) o[k] = Array.isArray(kf[k]) ? kf[k][0] : kf[k]; return o; } } catch (e) {} return {}; };
  const tenKf = (kf) => { const s = new Set(); const them = (k) => { if (!['offset', 'easing', 'composite', 'computedOffset'].includes(k)) s.add(k); };
    if (Array.isArray(kf)) kf.forEach((k) => Object.keys(k || {}).forEach(them)); else if (kf && typeof kf === 'object') Object.keys(kf).forEach(them); return [...s]; };
  const coScale = (kf, props) => props.includes('scale') || (props.includes('transform') && /scale/.test(JSON.stringify(kf || '')));
  const laVao = (k) => { const op = parseFloat(k.opacity); if (Number.isFinite(op) && op < 0.5) return true; const m = String(k.translate || k.transform || '').match(/(-?[\d.]+)px/); return !!(m && parseFloat(m[1]) > 0); };
  kt.ghiHoat = (el, loai, kf) => {
    if (!el || !el.closest) return;
    const st = document.getElementById('sanKhauGiang');
    if (!st || !st.contains(el)) return;
    const the = ngoaiCung(el);
    const props = tenKf(kf);
    const e = { luc: performance.now(), loai, lop: lopCua(el), the: maThe(the), laThe: !!(el.matches && el.matches(SEL.the)), tro: !!el.closest(SEL.tro), chip: !!el.closest(SEL.chip),
      phim: !!el.closest(SEL.phim), props, scale: coScale(kf, props), vao: laVao(kf0(kf)) };
    if (kt.v2.hoat.length < 20000) kt.v2.hoat.push(e);
    // (tester r1) con tro doc truot bang translate/scale la dieu bo sung B.3 cho phep -> khong tinh vao luat scale
    // (tester r2) ban sao FLIP ghep cau cua B (.sk-bay / .sk-vd-bay: translate+scale kich thuoc token -> o) la 'demo' ghep cau
    // cua bo sung C -> ghi rieng (scaleBay), khong tinh vao luat scale
    const laBay = !!el.closest('.sk-bay, .sk-vd-bay');
    if (e.scale && laBay) { kt.v2.a3.scaleBay = kt.v2.a3.scaleBay || []; if (kt.v2.a3.scaleBay.length < 40) kt.v2.a3.scaleBay.push({ lop: e.lop, loai, props }); }
    if (e.scale && !e.chip && !e.tro && !laBay && kt.v2.a3.scale.length < 40) kt.v2.a3.scale.push({ lop: e.lop, loai, props, laThe: e.laThe, nhip: window.__lecture ? __lecture.index() : null });
  };
  document.addEventListener('animationstart', (ev) => {
    try { const el = ev.target; const a = el.getAnimations ? el.getAnimations().find((x) => x.animationName === ev.animationName) : null;
      kt.ghiHoat(el, 'css:' + ev.animationName, a && a.effect ? a.effect.getKeyframes() : []); } catch (e) {}
  }, true);
  document.addEventListener('transitionrun', (ev) => { try { kt.ghiHoat(ev.target, 'tr:' + ev.propertyName, [{ [ev.propertyName]: '' }]); } catch (e) {} }, true);
  setInterval(() => {
    const ds0 = document.querySelector('.deck-stage');
    if (ds0 && document.body.classList.contains('dang-giang')) kt.v2.lechStage = Math.max(kt.v2.lechStage, ds0.scrollTop, ds0.scrollLeft);
    const st = sanHien(); if (!st) return;
    let dem = 0; const ds = [];
    for (const a of document.getAnimations()) {
      if (a.playState !== 'running') continue;
      const el = a.effect && a.effect.target; if (!el || !el.closest || !st.contains(el)) continue;
      if (!el.closest(SEL.the) || el.matches(SEL.the) || el.closest(SEL.tro)) continue;
      // (tester r1) net chu Han (board.js vietChuHan: moi net mot hoat anh CSS xep hang bang delay) mien tru nhu T7
      // (ghi chu cua B); chi dem hoat anh DANG O PHA HOAT DONG (dang cho delay thi chua chuyen dong)
      if (el.closest('.bang-kanji, .bang-kanji-o')) continue;
      try { const tm = a.effect.getComputedTiming(); const lt = a.currentTime; const d0 = tm.delay || 0; if (lt == null || lt < d0 || lt >= d0 + (tm.activeDuration || 0)) continue; } catch (e) {}
      dem++; if (ds.length < 6) ds.push(lopCua(el) + (a.animationName ? '@' + a.animationName : ''));
    }
    const A3 = kt.v2.a3; A3.mau++; A3.max = Math.max(A3.max, dem);
    if (dem > 2 && A3.qua2.length < 30) A3.qua2.push({ luc: Math.round(performance.now()), nhip: window.__lecture ? __lecture.index() : null, dem, ds });
  }, 50);
  // Vao nhip: dem hoat anh cap the (the vao) + hoat anh noi dung trong 450 ms dau (phai = 0, tru con tro)
  kt.xetVao = (beat, T) => {
    const cuoi = kt.dong.filter((d) => d.luc < T - 1).pop();
    const tuTat = !cuoi || ['tamDung', 'dung', 'tiepTuc'].includes(cuoi.ten);
    // Goc the bai tap tren luoi (A5), neu the con o luoi luc nhip bat dau
    if (beat.kind === 'quiz' && beat.data && beat.data.id) {
      const c = document.getElementById('card-' + beat.data.id);
      if (c && c.closest('#slideContent')) kt.v2.goc[beat.data.id] = { cha: c.parentNode, truoc: c.previousSibling, sau: c.nextSibling };
    }
    setTimeout(() => {
      const the = kt.theNay(); const ma = maThe(ngoaiCung(the));
      const log = kt.v2.hoat.filter((x) => x.luc >= T - 20 && x.luc <= T + 700);
      const tren = log.filter((x) => x.laThe && x.the === ma);
      const noi = log.filter((x) => !x.laThe && x.the === ma && !x.tro && x.luc <= T + 450);
      kt.v2.a3.vao.push({ i: beat.index, kind: beat.kind, tuTat, coThe: !!the, ma, soTheVao: tren.filter((x) => x.vao).length, soTheHoat: tren.length,
        mauThe: tren.slice(0, 4).map((x) => x.loai + ':' + x.props.join('/') + (x.vao ? ':vao' : '')),
        noiDung: noi.length, mauNoiDung: noi.slice(0, 5).map((x) => x.lop + ':' + x.loai + ':' + x.props.join('/')) });
    }, 720);
  };
  // A5: the bai tap that duoc dua len the san khau luc cho, ra cho / tam dung thi ve dung cho cu
  const oCho = (r) => !!(r.card && r.card.parentNode === r.cha && r.card.previousSibling === r.truoc && r.card.nextSibling === r.sau);
  kt.a5Vao = (b) => {
    const id = b.data && b.data.id; const card = id && document.getElementById('card-' + id);
    const trongLuoi = !!(card && card.closest('#slideContent'));
    const g = trongLuoi ? { cha: card.parentNode, truoc: card.previousSibling, sau: card.nextSibling } : (kt.v2.goc[id] || {});
    const tom = { i: b.index, id, coThe: !!card, trongLuoiLucVao: trongLuoi, coGoc: !!g.cha };
    const rec = { i: b.index, id, card, cha: g.cha, truoc: g.truoc, sau: g.sau, lucVao: performance.now(), tom };
    kt.v2._a5.push(rec); kt.v2.a5.push(tom);
    setTimeout(() => { tom.trongThe700 = !!(card && card.closest(SEL.the) && card.closest('#sanKhauGiang')); tom.trung700 = kt.trungIdNay(); tom.che700 = (tt() || {}).che; }, 700);
  };
  kt.a5Ra = (ten) => {
    const r = kt.v2._a5.filter((x) => !x.tom.ra).pop(); if (!r) return;
    r.tom.ra = ten; r.tom.veNgay = oCho(r); r.tom.msCho = Math.round(performance.now() - r.lucVao);
    setTimeout(() => { r.tom.ve400 = oCho(r); r.tom.trung400 = kt.trungIdNay(); r.tom.conTrongSan400 = !!(r.card && r.card.closest('#sanKhauGiang')); }, 400);
  };
  kt.a5Nay = (i) => { const r = kt.v2._a5.filter((x) => x.i === i).pop(); if (!r) return null;
    return { ...r.tom, trongTheNay: !!(r.card && r.card.closest(SEL.the) && r.card.closest('#sanKhauGiang')), oChoNay: oCho(r), trungNay: kt.trungIdNay() }; };
  // Moi scrollIntoView tren phan tu cua san khau (se cuon lech .deck-stage) — diem noi D phai chan
  kt.cuonSan = [];
  const gocCuon = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (...a) {
    try { if (this.closest && this.closest('#sanKhauGiang') && kt.cuonSan.length < 50) kt.cuonSan.push({ luc: Math.round(performance.now()), lop: lopCua(this), id: this.id || '', ngan: String(new Error().stack || '').split('\n').slice(2, 4).join(' | ').slice(0, 200) }); } catch (e) {}
    return gocCuon.apply(this, a);
  };
  return 'da cai';
}

// ------------------------------------------------------------------ tien ich thong ke
const trungVi = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor((s.length - 1) / 2)]; };
const phanVi = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)]; };
const tron = (x, n = 3) => (x == null ? null : Math.round(x * 10 ** n) / 10 ** n);
const coMotion = async (t) => t.ev(`!!(window.SenseiMotion && window.SenseiMotion.bat && !window.SenseiMotion.__gia)`);

/** Chay lecture tu nhip tu toi het nhip den; tu xu ly luc cho (bo qua / tra loi) */
// (tester r2) han 20 phut cu cat ngang lan chay tron 84 nhip o ~nhip 70 (T4/T5/T11 khong phu chuong Bai tap) -> 45 phut + ghi lai khi het han
async function chayDoan(t, tu, den, { traLoi = 'boqua', hanMs = TUY.han * 60 * 1000, moiNhip = null } = {}) {
  await t.ev(`__moPhong.datDen(${den == null ? 'null' : den})`);
  if (tu == null) await t.bam('#autoLectureBtn');
  else await t.ev(`__lecture.startFrom(${tu}).then(() => true)`);
  await t.cho(`__lecture.state().lectureState === 'PLAYING'`, 8000);
  const t0 = Date.now();
  let daCho = -1, iCu = -1;
  while (Date.now() - t0 < hanMs) {
    const s = await t.ev(`window.__lecture ? ({ st: __lecture.state().lectureState, i: __lecture.index(), che: window.__motion ? (__motion.trangThai() || {}).che : null, dung: __moPhong.daDung })
      : ({ mat: true, href: location.href, to: performance.timeOrigin, ready: document.readyState })`);
    if (s.mat) { t.log.push({ loai: 'harness', text: 'mat __lecture: ' + JSON.stringify(s), luc: Date.now() }); throw new Error('trang mat __lecture: ' + JSON.stringify(s)); }
    if (s.i !== iCu) { iCu = s.i; if (moiNhip) await moiNhip(s.i); }
    if (s.st !== 'PLAYING') break;
    if (s.che === 'cho' && daCho !== s.i) {
      daCho = s.i;
      await sleep(400);
      if (traLoi === 'boqua') await boQuaCho(t);
      else await traLoiCho(t, s.i, traLoi === 'dung');
    }
    await sleep(250);
  }
  if (Date.now() - t0 >= hanMs) { t.hetHan = (t.hetHan || 0) + 1; t.log.push({ loai: 'harness', text: 'chayDoan het han ' + +(hanMs / 60000).toFixed(2) + ' phut o nhip ' + iCu + ' (' + tu + '-' + den + ')', luc: Date.now() }); }
  await t.ev(`__moPhong.datDen(null)`);
}
async function boQuaCho(t) {
  const r = await t.bam(`=[...document.querySelectorAll('#sanKhauGiang button')].find(b => /Bỏ qua/.test(b.textContent))`);
  if (!r) await t.ev(`window.SenseiMotion && SenseiMotion._o && SenseiMotion._o.khiBoQua && SenseiMotion._o.khiBoQua()`);
  return r;
}
async function traLoiCho(t, i, dung) {
  const q = await t.ev(`(() => { const b = __lecture.beats()[${i}]; return b && b.data ? { id: b.data.id, dung: b.data.correctIndex, n: (b.data.options || []).length } : null; })()`);
  if (!q) return null;
  const k = dung ? q.dung : (q.dung + 1) % q.n;
  return { ...q, k, r: await t.bam(`#btn-opt-${q.id}-${k}`) };
}
async function dungGiang(t) {
  const st = await t.ev(`__lecture.state().lectureState`);
  if (st === 'PLAYING') await t.bam('#autoLectureBtn');
  await t.cho(`__lecture.state().lectureState !== 'PLAYING'`, 3000);
}
const nhipDau = async (t, kind) => t.ev(`__lecture.beats().findIndex(b => b.kind === ${JSON.stringify(kind)})`);

// ------------------------------------------------------------------ kiem diem noi D (dung chung DV / DC)
/** resolveElement chuyen huong st-<id> chi khi body.dang-giang; boQuaTheTrai; tuKhoanhNguPhap im */
async function kiemChuyenHuong(t) {
  return t.ev(`(() => {
    const se = __slideEngine; const id = 'voc-n5-1-1';
    const st = document.createElement('div'); st.id = 'st-' + id; document.body.appendChild(st);
    const truoc = se.resolveElement(id) === st;
    document.body.classList.add('dang-giang');
    const trong = se.resolveElement(id) === st;
    const bo = se.boQuaTheTrai({ tab: 'vocab' }, false);
    let khoanh = null;
    // Co guard thi ham ve truoc khi dat hen khoanh (_khoanhTimer khong doi)
    try { const h0 = se._khoanhTimer; se.tuKhoanhNguPhap({ tab: 'grammar', type: 'example', data: { id: 'x-kt', tokens: [{ id: 'y-kt', isKeyGrammar: true, text: 'は' }] } }); khoanh = se._khoanhTimer === h0; } catch (e) { khoanh = 'loi: ' + e; }
    document.body.classList.remove('dang-giang'); st.remove();
    const sau = se.resolveElement(id) && se.resolveElement(id).id === id;
    const boSau = se.boQuaTheTrai({ tab: 'vocab' }, false);
    return { truocKhongDoi: !truoc, trongDoi: trong, boQuaTheTrai: bo, boQuaTheTraiSau: boSau, khongTuKhoanh: khoanh, sauVeLuoi: sau };
  })()`);
}
const datChuyenHuong = (c) => !!(c && c.truocKhongDoi && c.trongDoi && c.sauVeLuoi && c.boQuaTheTrai === true && c.khongTuKhoanh === true);

/** board.vietBang(..., {im:true}): khong mo bang, khong body.co-bang; bang dang mo thi van mo */
async function kiemBangIm(t) {
  return t.ev(`(() => {
    const B = SenseiBoard; B.lauSach();
    const coBangTruoc = document.body.classList.contains('co-bang');
    B.vietBang('dòng ngầm', 'nhat', { im: true });
    const an = B.bang && B.bang.khung.classList.contains('hidden');
    const khongCoBang = !document.body.classList.contains('co-bang');
    const coDong = B.trangThai().soDongTrenBang;
    B.moBang(); const moRa = document.body.classList.contains('co-bang') && !B.bang.khung.classList.contains('hidden');
    const conDong = [...document.querySelectorAll('#bangPhan .bang-dong')].some(d => d.textContent === 'dòng ngầm');
    B.vietBang('dòng mở', 'thuong', { im: true }); const vanMo = !B.bang.khung.classList.contains('hidden');
    B.vietBang('dòng thường'); const thuongMo = document.body.classList.contains('co-bang');
    B.lauSach();
    return { coBangTruoc, an, khongCoBang, coDong, moRa, conDong, vanMo, thuongMo };
  })()`);
}
const datBangIm = (b) => !!(b && b.an && b.khongCoBang && b.coDong && b.moRa && b.conDong && b.vanMo && b.thuongMo);

/**
 * Phan tu tren san khau (the bai tap dua len / st-<id>): applyFocusStyle + board veLen KHONG scrollIntoView,
 * khong gan huy hieu "Dang doc…" luc body.dang-giang. Doi chung: phan tu ngoai san khau van duoc cuon.
 * Chay luc IDLE (khong dung nhip nao); san khau that (neu co) chi bi gan tam 2 phan tu con.
 */
async function kiemCuonSan(t) {
  return t.ev(`(() => {
    const se = __slideEngine, B = SenseiBoard;
    let st = document.getElementById('sanKhauGiang'); const tuTao = !st;
    if (tuTao) { st = document.createElement('section'); st.id = 'sanKhauGiang'; document.body.appendChild(st); }
    const the = document.createElement('div'); the.id = 'card-kt-cuon'; the.innerHTML = '<h3>kt</h3>';
    const tok = document.createElement('span'); tok.id = 'st-kt-tok'; tok.textContent = 'kt';
    tok.style.cssText = 'position:fixed;left:10px;bottom:0;';
    st.appendChild(the); st.appendChild(tok);
    const ngoai = document.createElement('div'); ngoai.id = 'kt-ngoai-cuon'; ngoai.innerHTML = '<h3>kt</h3>'; document.body.appendChild(ngoai);
    const goi = []; const goc = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function () { goi.push(this.id || this.className); };
    const out = {};
    try {
      document.body.classList.add('dang-giang');
      se.applyFocusStyle('card-kt-cuon', 'reading_focus');
      out.cuonTheSan = goi.includes('card-kt-cuon');
      out.huyHieuKhiGiang = !!the.querySelector('.reading-badge-indicator');
      goi.length = 0; B.veLen('kt-tok', 'khoanh');
      out.cuonTokSan = goi.includes('st-kt-tok');
      document.body.classList.remove('dang-giang');
      goi.length = 0; se.applyFocusStyle('kt-ngoai-cuon', 'reading_focus');
      out.cuonNgoai = goi.includes('kt-ngoai-cuon');
      out.huyHieuNgoaiIdle = !!ngoai.querySelector('.reading-badge-indicator');
    } catch (e) { out.loi = String(e); }
    finally {
      Element.prototype.scrollIntoView = goc;
      document.body.classList.remove('dang-giang');
      try { B.xoaHetGhiChu(); } catch (e) {}
      try { se.clearHighlights(); } catch (e) {}
      the.remove(); tok.remove(); ngoai.remove(); if (tuTao) st.remove();
    }
    return out;
  })()`);
}
const datCuonSan = (c) => !!(c && !c.loi && c.cuonTheSan === false && c.huyHieuKhiGiang === false && c.cuonTokSan === false && c.cuonNgoai === true && c.huyHieuNgoaiIdle === true);

/**
 * Tong hop loi goi app -> SenseiMotion (__goiSK, GIA hoac ban ghi cua caiKt) doi chieu su that mo phong:
 * t0/t1 khiCoAmThanh == bang chunk that, chu khiCoLoi == chu cua luot, khiLuotXong t == tEnd,
 * khiClip t0/dur == lan phat that, focusItem chua chay khi batDauNhip (chuyen huong den / meo).
 */
async function tongHopGoi(t) {
  return t.ev(`(() => {
    const g = window.__goiSK || []; const dem = {};
    g.forEach(x => { dem[x.ten] = (dem[x.ten] || 0) + 1; });
    const beats = __lecture.beats();
    const bd = g.filter(x => x.ten === 'batDauNhip');
    const am = g.filter(x => x.ten === 'khiCoAmThanh');
    const lech = am.map(x => Math.abs((x.a.t1 - x.a.t0) - (Math.floor(Math.floor(x.a.n * 3 / 4) / 2) / 24000))).filter(d => d > 0.002).length;
    // focusItem cua nhip i chay SAU batDauNhip(i): luc goi, den con o muc cua nhip truoc (nhip lien tiep)
    const focusSai = [];
    bd.forEach((x, k) => { const tr = bd[k - 1]; const b = beats[x.a.i], bt = beats[x.a.i - 1];
      if (tr && tr.a.i === x.a.i - 1 && b && bt && b.targetId && b.targetId !== bt.targetId && x.a.focus === b.targetId) focusSai.push(x.a.i); });
    // khiGuiLuot sau batDauNhip cua cung nhip (luot moi thuoc nhip moi)
    const guiTruoc = [];
    bd.forEach((x) => { const k = g.indexOf(x); const sau = g.slice(k + 1).find(y => y.ten === 'khiGuiLuot' || y.ten === 'batDauNhip');
      if (sau && sau.ten === 'batDauNhip' && beats[x.a.i] && !beats[x.a.i].clientOnly && beats[x.a.i].kind !== 'kaiwa-run') guiTruoc.push(x.a.i); });
    const goi = { dem, soBatDauNhip: bd.length, ctxMau: bd[0] && bd[0].a, focusTruocBatDau: bd.slice(0, 6).map(x => x.a.focus), focusSai,
      laBatDau: bd.map(x => x.a.ctx && x.a.ctx.laBatDau), amLechDoDai: lech, guiLuotThieu: guiTruoc.slice(0, 10),
      hetNhip: g.filter(x => x.ten === 'khiHetNhip').slice(0, 5).map(x => x.a), clip: g.filter(x => x.ten === 'khiClip').length,
      dongThoai: g.filter(x => x.ten === 'khiDongThoai').length, xongDong: g.filter(x => x.ten === 'khiXongDong').length };

    const loiG = g.filter(x => x.ten === 'khiCoLoi');
    const xongG = g.filter(x => x.ten === 'khiLuotXong');
    const luot = __moPhong.luot();
    const giang = luot.filter(l => l.loai === 'giang' && l.xong && !l.biNgat);
    const chiTiet = __moPhong.luot(true);
    const kt = giang.slice(0, 12).map(l => {
      // Cac luot cung the (luot cham bai luc cho) -> nhan chu cua tat ca, noi theo thu tu.
      // Manh cu cua luot vua bi ngat co the toi trong 100 ms dau (tham so cu) -> chi can khop duoi.
      const cungThe = luot.filter(x => x.tag === l.tag).map(x => x.chu).join('');
      const nhan = loiG.filter(x => x.a.luot === l.tag).map(x => x.a.d).join('');
      let donDieu = true, truoc = -1, nul = 0;
      for (let i = 0; i < l.chu.length; i++) { const v = __moPhong.thoiDiemThat(l.tag, i); if (v == null) { nul++; continue; } if (v + 1e-6 < truoc) donDieu = false; truoc = v; }
      const ct = chiTiet.find(x => x.so === l.so);
      const khopAm = ct.chunks.filter(c => c.t1 != null).every(c => am.some(a => Math.abs(a.a.t1 - c.t1) < 1e-6 && Math.abs(a.a.t0 - c.t0) < 1e-6));
      const khopXong = l.tEnd == null ? null : xongG.some(x => Math.abs(x.a.t - l.tEnd) < 1e-6);
      const treChu = ct.manh.map(m => { const nh = ct.chunks.filter(c => c.guiLuc != null && c.guiLuc <= m.guiLuc + 0.5); return nh.length ? nh[nh.length - 1].a1 - m.aEnd : null; }).filter(x => x != null).sort((a, b) => a - b);
      const dai = ct.chunks.map(c => c.a1 - c.a0);
      return { tag: l.tag, kind: l.kind, nhip: l.nhip, dai: l.chu.length, khopChu: nhan === cungThe || (nhan.length > cungThe.length && nhan.endsWith(cungThe)), donDieu, nul, khopAm, khopXong,
        tong: l.tong, tFirst: l.tFirst, treChuTrungVi: treChu.length ? +treChu[Math.floor(treChu.length / 2)].toFixed(3) : null,
        chunkMs: [Math.round(Math.min(...dai) * 1000), Math.round(Math.max(...dai) * 1000)],
        soManhDiKem: ct.manh.filter(m => m.di).length, soManh: ct.manh.length,
        cc: l.congCu.map(c => c.name + '@' + (c.T == null ? null : c.T.toFixed(3))) };
    });
    const suThat = { soLuot: luot.length, loai: luot.map(l => l.loai).join(','), kt };
    const c = g.filter(x => x.ten === 'khiClip'); let khop = 0;
    c.forEach(x => { const k = __moPhong.karaokeThat(x.a.id); if (k && k.lanPhat.some(p => Math.abs(p.t0 - x.a.t0) < 1e-6) && Math.abs(k.dur - x.a.dur) < 1e-3) khop++; });
    const run = beats.find(b => b.kind === 'kaiwa-run');
    const karaoke = run ? run.data.slice(0, 3).map(l => __moPhong.karaokeThat(l.id)).map(k => k && { lanPhat: k.lanPhat, dur: k.dur, tok: k.tokens.slice(0, 4).map(x => x.id + '@' + x.t.toFixed(3)) }) : null;
    return { goi, suThat, clipKhop: { soClip: c.length, khop }, karaoke };
  })()`);
}
const datSuThat = (s) => !!(s && s.kt.length && s.kt.every((x) => x.khopChu && x.donDieu && x.khopAm && x.khopXong !== false));

// ------------------------------------------------------------------ cac bai kiem
const KIEM = {};

// DV: kiem tra don vi cac diem noi cua D (app/slide-engine/board) + mo phong, voi SenseiMotion GIA
KIEM.DV = async (t) => {
  const kq = {};
  await t.moBai({ gia: true });
  kq.laGia = await t.ev(`!!(window.SenseiMotion && SenseiMotion.__gia)`);
  kq.chuyenHuong = await kiemChuyenHuong(t);
  kq.bang = await kiemBangIm(t);
  kq.cuonSan = await kiemCuonSan(t);
  // Chay nhip 0..2 (vocab), roi 30 (kanji), 38-39 (ngu phap), kaiwa-run, 2 cau quiz
  await chayDoan(t, 0, 1);
  const kaiwaRun = await nhipDau(t, 'kaiwa-run');
  const q0 = await nhipDau(t, 'quiz');
  const g0 = await nhipDau(t, 'grammar-intro');
  await sleep(500);
  // GIA khong nhan tool (khiCongCu -> null): write_on_board luc giang van phai ghi NGAM (app { im }), khong mo bang
  kq.bangTuVung = await t.ev(`({ coBang: document.body.classList.contains('co-bang'),
    soWob: (window.__goiSK || []).filter(g => g.ten === 'khiCongCu' && g.a.n === 'write_on_board').length, soDong: SenseiBoard.trangThai().soDongTrenBang })`);
  // Bang co the da mo do tool cua nhip tu vung (GIA khong chan tool) -> lau truoc
  await t.ev(`SenseiBoard.lauSach()`);
  await chayDoan(t, g0, g0);
  kq.bangNguPhap = await t.ev(`({ coBang: document.body.classList.contains('co-bang'), soDong: SenseiBoard.trangThai().soDongTrenBang,
    dong: [...document.querySelectorAll('#bangPhan .bang-dong')].map(d => d.textContent.slice(0, 40)) })`);
  await sleep(500);
  await chayDoan(t, kaiwaRun, kaiwaRun, { hanMs: 120000 });
  // quiz: dung (cho -> tra loi dung -> tu sang), sai (cham bai giu PLAYING -> sang sau 2.5 s)
  await t.ev(`__moPhong.datDen(${q0 + 2})`);
  await t.ev(`__lecture.startFrom(${q0}).then(() => true)`);
  const quiz = {};
  for (const [j, dung] of [[q0, true], [q0 + 1, false]]) {
    const vao = await t.cho(`(window.__goiSK || []).some(g => g.ten === 'vaoCho' && g.a.i === ${j})`, 90000, 100);
    const r = { vaoCho: !!vao };
    if (dung) {
      // Luc cho: tool doi chuong / mo bai / roi den KHONG duoc ve lai luoi (the that dang tren san khau)
      await sleep(200);
      const G = (n, a) => t.ev(`JSON.parse(JSON.stringify(__moPhong.goiCongCu(${JSON.stringify(n)}, ${JSON.stringify(a)}) || null))`);
      const tab0 = await t.ev(`__slideEngine.activeTab`);
      const cs = await G('change_section', { section: 'vocab' });
      const oe = await G('open_exercise', { exercise_index: 3 });
      const he = await G('highlight_element', { target_id: 'voc-n5-1-1' });
      const sl = await G('change_slide', { level: 'N5', lesson_id: 1, slide_index: 0 });
      const kh = await G('change_slide', { level: 'N5', lesson_id: 2, slide_index: 0 });
      r.congCuLucCho = { tab0, tabSau: await t.ev(`__slideEngine.activeTab`), cs, oe, he, sl, kh,
        conThe: await t.ev(`!!document.getElementById('card-' + __lecture.beats()[${j}].data.id)`), trung: await t.ev(`__kt.trungIdNay()`) };
    }
    await sleep(300);
    const trc = await t.ev(`({ st: __lecture.state().lectureState, i: __lecture.index() })`);
    const tl = await traLoiCho(t, j, dung);
    const lucBam = Date.now();
    let dungLai = false, sang = null;
    while (Date.now() - lucBam < 40000) {
      const s = await t.ev(`({ st: __lecture.state().lectureState, i: __lecture.index() })`);
      if (s.st === 'PAUSED') dungLai = true;
      if (s.i > j) { sang = Date.now() - lucBam; break; }
      await sleep(50);
    }
    r.truoc = trc; r.traLoi = tl && { k: tl.k, bam: !!tl.r }; r.msSang = sang; r.coLucPAUSED = dungLai;
    r.goi = await t.ev(`(window.__goiSK || []).filter(g => ['vaoCho','khiTraLoi','datDemTiep','raCho','khiHetNhip'].includes(g.ten) && g.luc > ${0}).slice(-8).map(g => g.ten + ':' + JSON.stringify(g.a || ''))`);
    if (!dung) r.luotCham = await t.ev(`__moPhong.luot().filter(l => l.loai === 'cham').map(l => ({ tag: l.tag, tFirst: l.tFirst, tEnd: l.tEnd, xong: l.xong }))`);
    quiz[dung ? 'dung' : 'sai'] = r;
  }
  kq.quiz = quiz;
  await dungGiang(t);
  Object.assign(kq, await tongHopGoi(t));
  kq.mau = await t.ev(`__moPhong.luot(true).filter(l => l.loai === 'giang').slice(0, 1).map(l => ({ chu: l.chu.slice(0, 160), manh: l.manh.slice(0, 8), chunks: l.chunks.slice(0, 4) }))`);
  await t.chup('DV.png');
  // Danh gia
  const loi = [];
  if (!datChuyenHuong(kq.chuyenHuong)) loi.push('resolveElement/boQuaTheTrai/tuKhoanhNguPhap');
  if (!datBangIm(kq.bang)) loi.push('board im');
  if (!datCuonSan(kq.cuonSan)) loi.push('cuon / huy hieu phan tu san khau (slide-engine / board)');
  if (kq.bangNguPhap.coBang) loi.push('grammar-intro mo bang');
  if (!kq.goi.dem.init || kq.goi.dem.init !== 1) loi.push('init != 1');
  if (kq.goi.focusSai.length) loi.push('focusItem chay truoc batDauNhip');
  if (kq.goi.amLechDoDai) loi.push('t0/t1 lech ' + kq.goi.amLechDoDai);
  if (!kq.quiz.dung.vaoCho || kq.quiz.dung.coLucPAUSED || kq.quiz.dung.msSang == null) loi.push('quiz dung');
  if (!kq.quiz.sai.vaoCho || kq.quiz.sai.coLucPAUSED || kq.quiz.sai.msSang == null) loi.push('quiz sai');
  {
    const x = kq.quiz.dung.congCuLucCho || {};
    const ok = (v) => !!(v && v.success);
    if (!(x.tab0 === 'quiz' && x.tabSau === 'quiz' && ok(x.cs) && ok(x.oe) && ok(x.he) && ok(x.sl) && x.kh && x.kh.success === false && x.conThe && !(x.trung || []).length)) loi.push('tool luc cho ve lai luoi');
  }
  if (kq.bangTuVung.soWob && kq.bangTuVung.coBang) loi.push('write_on_board luc giang mo bang (app khong ghi ngam)');
  if (!datSuThat(kq.suThat)) loi.push('su that mo phong');
  if (!kq.goi.clip || kq.clipKhop.khop !== kq.clipKhop.soClip) loi.push('khiClip (kaiwa-run)');
  if (kq.goi.laBatDau[0] !== true) loi.push('laBatDau');
  return { dat: loi.length === 0, loi, chiTiet: kq };
};

// DC: diem noi D voi dao dien THAT (js/motion.js). Dung kem --chung: khong co canh B / C, chi canh chung
KIEM.DC = async (t) => {
  const kq = {}; const loi = [];
  const soLog = t.log.length;
  await t.moBai();
  kq.moiTruong = await t.ev(`({ bat: !!(window.SenseiMotion && SenseiMotion.bat), gia: !!(window.SenseiMotion && SenseiMotion.__gia), motion: !!window.__motion,
    canhChu: !!window.__motionChu, canhHoi: !!window.__motionHoi, chung: ${!!t.chung}, soGoiLucCai: (window.__goiSK || []).length })`);
  if (!kq.moiTruong.bat || kq.moiTruong.gia) return { dat: false, loi: ['khong co dao dien that (js/motion.js)'], chiTiet: kq };
  if (t.chung && (kq.moiTruong.canhChu || kq.moiTruong.canhHoi)) loi.push('--chung nhung canh B/C van nap');
  kq.chuyenHuong = await kiemChuyenHuong(t);
  kq.bang = await kiemBangIm(t);
  kq.cuonSan = await kiemCuonSan(t);
  if (!datChuyenHuong(kq.chuyenHuong)) loi.push('resolveElement/boQuaTheTrai/tuKhoanhNguPhap');
  if (!datBangIm(kq.bang)) loi.push('board im');
  if (!datCuonSan(kq.cuonSan)) loi.push('cuon / huy hieu phan tu san khau (slide-engine / board)');
  const beats = await t.ev(`__lecture.beats().map(b => ({ kind: b.kind, id: b.targetId || null, ch: b.chapter }))`);
  const lay = (kind, k = 0) => beats.map((b, i) => (b.kind === kind ? i : -1)).filter((i) => i >= 0)[k];
  const G = (n, a) => t.ev(`(() => { const r = __moPhong.goiCongCu(${JSON.stringify(n)}, ${JSON.stringify(a)}); return r && typeof r.then === 'function' ? r : JSON.parse(JSON.stringify(r == null ? null : r)); })()`);
  const MAU = `(() => {
    const tt = __motion.trangThai() || {}; const sc = document.getElementById('slideContent'), st = document.getElementById('sanKhauGiang');
    const b = __lecture.beats()[__lecture.index()] || {};
    const r = b.targetId ? __slideEngine.resolveElement(b.targetId) : null;
    const g = b.targetId ? document.getElementById(b.targetId) : null;
    return { che: tt.che, nhip: tt.nhip, i: __lecture.index(), st: __lecture.state().lectureState, dangGiang: document.body.classList.contains('dang-giang'),
      inert: sc.inert, vis: getComputedStyle(sc).visibility, sanHien: !!(st && !st.hidden && getComputedStyle(st).display !== 'none' && st.getBoundingClientRect().height > 0),
      soCanh: st ? st.querySelectorAll('.sk-san > .sk-canh').length : 0, soCanhChung: st ? st.querySelectorAll('.sk-canh-chung').length : 0,
      targetId: b.targetId || null, heroSt: !!(b.targetId && document.getElementById('st-' + b.targetId)), resolveTrongSan: !!(r && r.closest('#sanKhauGiang')),
      theLuoiSang: !!(g && g.classList.contains('reading-focus')), coBang: document.body.classList.contains('co-bang'), trung: __kt.trungIdNay(),
      huyHieu: document.querySelectorAll('.reading-badge-indicator').length };
  })()`;

  // 1. Bat dau bang nut that (startLecture: laBatDau), nhip 0 -> 1; giua nhip 0: khoa luoi + cong cu
  kq.batDau = {};
  await chayDoan(t, null, 1, { hanMs: 150000, moiNhip: async (i) => {
    if (i < 0 || kq.batDau.giua) return;   // nhip dau tien nut Bat dau chon (chuong dang mo)
    kq.batDau.nhipDau = i;
    await t.cho(`(__motion.trangThai() || {}).che === 'giang'`, 8000, 50);
    await sleep(1500);
    kq.batDau.giua = await t.ev(MAU);
    const tab0 = await t.ev(`__slideEngine.activeTab`);
    const id = kq.batDau.giua.targetId;
    kq.congCu = {
      change_section: await G('change_section', { section: 'quiz' }),
      open_exercise: await G('open_exercise', { exercise_id: 'x' }),
      write_on_board: await G('write_on_board', { text: 'dòng DC giữa nhịp', style: 'thuong' }),
      highlight_element: await G('highlight_element', { target_id: id }),
      draw_on_board: await G('draw_on_board', { target_id: id, kind: 'khoanh' }),
      clear_board: await G('clear_board', {}),
    };
    kq.congCu.tabTruoc = tab0;
    kq.congCu.tabSau = await t.ev(`__slideEngine.activeTab`);
    kq.congCu.coBang = await t.ev(`document.body.classList.contains('co-bang')`);
    kq.congCu.bangAnCoDong = await t.ev(`(() => { const k = document.getElementById('bangPhan'); return { coBang: !!k, an: !!(k && k.classList.contains('hidden')) }; })()`);
  } });
  const g1 = kq.batDau.giua || {};
  if (!(g1.che === 'giang' && g1.dangGiang && g1.inert === true && g1.vis === 'hidden' && g1.sanHien && g1.soCanh >= 1)) loi.push('nhip 0: san khau / khoa luoi');
  if (t.chung && !g1.soCanhChung) loi.push('--chung nhung khong thay canh chung');
  if (g1.targetId && g1.heroSt && !g1.resolveTrongSan) loi.push('resolveElement khong tro vao san khau luc giang');
  if (g1.trung && g1.trung.length) loi.push('id trung luc giang: ' + g1.trung.slice(0, 3).join(','));
  if (g1.huyHieu) loi.push('huy hieu "Dang doc" gan vao luoi luc giang (se theo the len san khau)');
  const cc = kq.congCu || {};
  if (!(cc.change_section && cc.change_section.success && cc.tabSau === cc.tabTruoc)) loi.push('change_section luc giang');
  if (!(cc.open_exercise && cc.open_exercise.success && cc.tabSau === cc.tabTruoc)) loi.push('open_exercise luc giang');
  if (!(cc.write_on_board && cc.write_on_board.success) || cc.coBang) loi.push('write_on_board luc giang');
  if (!(cc.highlight_element && cc.highlight_element.success)) loi.push('highlight_element');
  if (!(cc.draw_on_board && 'success' in cc.draw_on_board)) loi.push('draw_on_board');

  // 2. Tam dung bang nut -> luoi tinh; Giang tiep -> nhip lai tu dau (isResume, laBatDau)
  {
    const v = lay('vocab', 3);
    await t.ev(`__moPhong.datDen(null)`);
    await t.ev(`__lecture.startFrom(${v}).then(() => true)`);
    await t.cho(`(__motion.trangThai() || {}).che === 'giang'`, 8000, 50);
    await sleep(1800);
    await t.bam('#autoLectureBtn');
    const ngay = await t.ev(`new Promise(r => requestAnimationFrame(() => { const sc = document.getElementById('slideContent'), st = document.getElementById('sanKhauGiang');
      r({ dangGiang: document.body.classList.contains('dang-giang'), pe: st ? getComputedStyle(st).pointerEvents : 'none', vis: getComputedStyle(sc).visibility, inert: sc.inert,
          st: __lecture.state().lectureState, che: (__motion.trangThai() || {}).che }); }))`);
    await sleep(260);
    const sau = await t.ev(`(() => { const sc = document.getElementById('slideContent'), st = document.getElementById('sanKhauGiang');
      const chay = document.getAnimations().filter(a => a.playState === 'running').map(a => a.effect && a.effect.target).filter(e => e && (sc.contains(e) || (st && st.contains(e))) && !e.closest('.deck-wave'));
      return { soChay: chay.length, chay: chay.slice(0, 4).map(e => String(e.className).slice(0, 40)), huyHieu: sc.querySelectorAll('.reading-badge-indicator').length, anSan: !st || st.hidden }; })()`);
    const n0 = await t.ev(`(window.__goiSK || []).length`);
    await t.bam('#autoLectureBtn');   // Giang tiep
    const lai = await t.cho(`(() => { const x = (window.__goiSK || []).slice(${n0}).find(g => g.ten === 'batDauNhip'); return x ? x.a : null; })()`, 5000, 50);
    await sleep(600);
    const giua = await t.ev(MAU);
    await dungGiang(t);
    kq.tamDung = { ngay, sau, lai, giua };
    if (ngay.dangGiang || ngay.pe !== 'none' || ngay.vis === 'hidden' || ngay.inert || ngay.st !== 'PAUSED' || ngay.che !== 'tat') loi.push('tam dung: luoi chua tinh ngay');
    if (sau.soChay || sau.huyHieu || !sau.anSan) loi.push('tam dung: con chuyen dong / huy hieu / san khau');
    if (!lai || lai.i !== v || !lai.ctx || lai.ctx.isResume !== true || lai.ctx.laBatDau !== true) loi.push('giang tiep: ctx isResume / laBatDau');
    if (!(giua.che === 'giang' && giua.dangGiang && giua.inert)) loi.push('giang tiep: san khau khong bat lai');
  }

  // 3. Ngu phap: bang ghi ngam (khong mo), vi du dau: khong tu khoanh tro tu duoi san khau
  {
    const g0 = lay('grammar-intro');
    await t.ev(`SenseiBoard.lauSach()`);
    kq.nguPhap = {};
    await chayDoan(t, g0, g0 + 1, { hanMs: 180000, moiNhip: async (i) => {
      if (i === g0) { await sleep(900); kq.nguPhap.bang = await t.ev(`(() => { const k = document.getElementById('bangPhan'); return { coBang: document.body.classList.contains('co-bang'), an: !!(k && k.classList.contains('hidden')), dong: k ? [...k.querySelectorAll('.bang-dong')].map(d => d.textContent.slice(0, 40)) : [] }; })()`); }
      if (i === g0 + 1) { await sleep(1300); kq.nguPhap.viDu = await t.ev(`({ khoanh: SenseiBoard.ghiChu.filter(x => x.kieu === 'khoanh').length, coBang: document.body.classList.contains('co-bang'), che: (__motion.trangThai() || {}).che })`); }
    } });
    const b = kq.nguPhap.bang || {};
    if (b.coBang || !b.an || b.dong.length < 2) loi.push('grammar-intro: bang phai ghi ngam (an, co dong)');
    if (!kq.nguPhap.viDu || kq.nguPhap.viDu.khoanh) loi.push('example: tuKhoanhNguPhap van khoanh duoi san khau');
  }

  // 4. Hoi thoai: kaiwa-run (10 cau client phat) + kaiwa cau 1
  {
    const kr = lay('kaiwa-run');
    const ids = await t.ev(`__lecture.beats()[${kr}].data.map(l => l.id)`);
    const id1 = await t.ev(`__lecture.beats()[${kr + 1}].data && __lecture.beats()[${kr + 1}].data.id`);
    const n0 = await t.ev(`(window.__goiSK || []).length`);
    await chayDoan(t, kr, kr + 1, { hanMs: 240000 });
    const g = await t.ev(`(window.__goiSK || []).slice(${n0}).filter(x => ['batDauNhip','khiDongThoai','khiClip','khiXongDong','khiGiongMay'].includes(x.ten)).map(x => ({ ten: x.ten, a: x.a }))`);
    // Nhip kaiwa phat clip TRUOC khi gui loi -> mo phong chi dung (datDen) sau khi clip nhip kr+2 da phat:
    // cat dung doan cua tung nhip theo batDauNhip
    const bdK = g.findIndex((x) => x.ten === 'batDauNhip' && x.a.i === kr + 1);
    const bdK2 = g.findIndex((x) => x.ten === 'batDauNhip' && x.a.i === kr + 2);
    const run = bdK < 0 ? g : g.slice(0, bdK), mot = bdK < 0 ? [] : g.slice(bdK, bdK2 < 0 ? g.length : bdK2);
    const dt = run.filter((x) => x.ten === 'khiDongThoai');
    kq.hoiThoai = {
      soCau: ids.length, dongThoai: dt.map((x) => x.a.i), dungId: dt.every((x) => ids[x.a.i] === x.a.id),
      clip: run.filter((x) => x.ten === 'khiClip').length, xongDong: run.filter((x) => x.ten === 'khiXongDong').map((x) => ids.indexOf(x.a.id)),
      giongMay: run.filter((x) => x.ten === 'khiGiongMay').length,
      kaiwa: { dongThoai: mot.filter((x) => x.ten === 'khiDongThoai').map((x) => x.a), clip: mot.filter((x) => x.ten === 'khiClip').map((x) => x.a.id), xongDong: mot.filter((x) => x.ten === 'khiXongDong').map((x) => x.a.id), id1 },
    };
    const h = kq.hoiThoai;
    if (h.dongThoai.join(',') !== ids.map((_, i) => i).join(',') || !h.dungId) loi.push('kaiwa-run: khiDongThoai(line, i) sai thu tu / id');
    if (h.clip !== ids.length || h.xongDong.join(',') !== ids.map((_, i) => i).join(',')) loi.push('kaiwa-run: khiClip / khiXongDong');
    if (!(h.kaiwa.dongThoai.length === 1 && h.kaiwa.dongThoai[0].id === id1 && h.kaiwa.dongThoai[0].i === 0 && h.kaiwa.clip[0] === id1 && h.kaiwa.xongDong[0] === id1)) loi.push('kaiwa: khiDongThoai / khiClip / khiXongDong');
  }

  // 5. Cho hoc vien lam bai (dung / sai / Bo qua / Tiep tuc / phim)
  kq.cho = await kiemCho(t);
  if (!kq.cho.dat) loi.push('cho hoc vien: ' + Object.entries(kq.cho.chiTiet).filter(([, v]) => !v.dat).map(([k]) => k).join(','));

  // 6. Het bai: cau hoi cuoi -> the ket bai 5 s (KET_BAI_MS, polish: 2.4 s cu the chi hien ~1.9 s -> cut)
  //    -> finishLecture -> san khau mo het (~160-240 ms) roi moi nhay xuong Phat am (KET_BAI_TRE_CUON 280 ms)
  {
    const cuoi = beats.length - 1;
    await t.ev(`__moPhong.datDen(null)`);
    const n0 = await t.ev(`(window.__goiSK || []).length`);
    await t.ev(`__lecture.startFrom(${cuoi}).then(() => true)`);
    const vao = await t.cho(`(__motion.trangThai() || {}).che === 'cho'`, 120000, 100);
    await t.ev(`(() => { window.__ktBamPhatAm = null; const n = document.querySelector('#slideContent [data-qz-toi="qz-phat-am"]');
      if (n) n.addEventListener('click', () => { window.__ktBamPhatAm = { luc: performance.now(), st: __lecture.state().lectureState }; }, { once: true }); return !!n; })()`);
    await sleep(300);
    const tl = await traLoiCho(t, cuoi, true);
    const het = await t.cho(`(() => { const x = (window.__goiSK || []).slice(${n0}).find(g => g.ten === 'khiHetNhip'); return x ? { a: x.a, luc: x.luc } : null; })()`, 20000, 50);
    // luc the ket bai hien (dao dien that; --gia khong co the -> null, bo qua do thoi gian hien)
    const theHien = await t.cho(`document.querySelector('#sanKhauGiang:not([hidden]) .sk-the-xong') ? performance.now() : (__lecture.state().lectureState === 'IDLE' ? -1 : null)`, 8000, 40);
    const idle = await t.cho(`__lecture.state().lectureState === 'IDLE' ? performance.now() : null`, 9000, 50);
    await sleep(1200);
    const sau = await t.ev(`(() => { const st = document.getElementById('sanKhauGiang'), sc = document.getElementById('slideContent'); const nut = document.querySelector('#slideContent [data-qz-toi="qz-phat-am"]');
      const pa = document.getElementById('qz-phat-am'); const r = pa && pa.getBoundingClientRect();
      return { anSan: !st || st.hidden, dangGiang: document.body.classList.contains('dang-giang'), inert: sc.inert, tab: __slideEngine.activeTab,
        nutPhatAm: !!nut, bamPhatAm: window.__ktBamPhatAm, phatAmTop: r ? Math.round(r.top) : null, vh: innerHeight }; })()`);
    const mong = { tu: beats.filter((b) => b.kind === 'vocab').length, chu: beats.filter((b) => b.kind === 'kanji').length, mau: beats.filter((b) => b.kind === 'grammar-intro').length,
      cau: beats.filter((b) => b.kind === 'example').length, thoai: beats.filter((b) => b.kind === 'kaiwa').length, bt: beats.filter((b) => b.kind === 'quiz').length };
    const msTheHien = theHien > 0 && idle ? Math.round(idle - theHien) : null;
    const msCuonSauIdle = sau.bamPhatAm && idle ? Math.round(sau.bamPhatAm.luc - idle) : null;
    kq.hetBai = { vao: !!vao, traLoi: tl && tl.k, het, msToiIdle: het && idle ? Math.round(idle - het.luc) : null, msTheHien, msCuonSauIdle, sau, mong };
    if (!het || het.a.tiep !== null || het.a.gapMs !== 5000 || JSON.stringify(het.a.tongKet) !== JSON.stringify(mong)) loi.push('khiHetNhip({tiep:null, gapMs:5000, tongKet})');
    if (!idle || Math.abs((idle - het.luc) - 5000) > 400) loi.push('finishLecture khong dung 5 s sau the ket bai');
    // the ket bai doc duoc: hien >= 4.2 s truoc khi san khau tat (dao dien that)
    if (!TUY.gia && theHien !== -1 && !(msTheHien >= 4200)) loi.push('the ket bai hien qua ngan: ' + msTheHien + ' ms');
    if (!sau.anSan || sau.dangGiang || sau.inert) loi.push('het bai: luoi chua ve tinh');
    if (sau.tab === 'quiz' && sau.nutPhatAm && !(sau.bamPhatAm && sau.bamPhatAm.st === 'IDLE')) loi.push('het bai: chua nhay xuong Phat am (sau finishLecture)');
    // cuon SAU khi san khau mo het (khong chong hai chuyen dong), nhung khong lau
    if (sau.bamPhatAm && !(msCuonSauIdle >= 200 && msCuonSauIdle <= 700)) loi.push('het bai: nhay Phat am khong doi san khau mo het (' + msCuonSauIdle + ' ms)');
  }

  // 7. Tong hop loi goi + su that mo phong, id trung, console
  Object.assign(kq, await tongHopGoi(t));
  kq.trungId = await t.ev(`__kt.trungId.filter(x => x.trung.length).slice(0, 8)`);
  kq.soLanKiemId = await t.ev(`__kt.trungId.length`);
  if (kq.goi.focusSai.length) loi.push('focusItem chay truoc batDauNhip: ' + kq.goi.focusSai.slice(0, 5).join(','));
  if (kq.goi.amLechDoDai) loi.push('khiCoAmThanh t0/t1 lech do dai goi: ' + kq.goi.amLechDoDai);
  if (kq.goi.guiLuotThieu.length) loi.push('nhip khong co khiGuiLuot: ' + kq.goi.guiLuotThieu.join(','));
  if (!datSuThat(kq.suThat)) loi.push('su that mo phong / tin hieu am thanh-chu-luot');
  if (!kq.goi.clip || kq.clipKhop.khop !== kq.clipKhop.soClip) loi.push('khiClip t0/dur != lan phat that');
  if (kq.goi.laBatDau[0] !== true) loi.push('laBatDau nhip dau');
  if (kq.trungId.length) loi.push('id trung');
  // scrollIntoView tren phan tu san khau (cuon lech .deck-stage): cua D (app / slide-engine / board) thi hong,
  // cua dao dien / canh thi chi ghi lai de bao chu file
  kq.cuonSanChay = await t.ev(`({ goi: __kt.cuonSan.slice(0, 10), lechStage: __kt.v2.lechStage })`);
  const cuonD = kq.cuonSanChay.goi.filter((x) => /app\.js|slide-engine\.js|board\.js/.test(x.ngan));
  if (cuonD.length) loi.push('scrollIntoView tren san khau tu diem noi D: ' + cuonD.length);
  if (kq.cuonSanChay.lechStage) loi.push('.deck-stage bi cuon lech luc giang: ' + kq.cuonSanChay.lechStage);
  const cs = t.log.slice(soLog).filter((x) => x.loai === 'exception' || x.loai === 'error');
  kq.console = { loi: cs.slice(0, 10), canhBaoMotion: t.log.slice(soLog).filter((x) => x.loai === 'warning' && /\[motion\]/.test(x.text)).slice(0, 10) };
  if (cs.length) loi.push('console co loi: ' + cs.length);
  await t.chup('DC.png');
  return { dat: loi.length === 0, loi, chiTiet: kq };
};

/** WAV PCM 24 kHz mono Int16 -> Buffer du lieu (bo header RIFF) */
function docWav(f) {
  const b = fs.readFileSync(f);
  let o = 12;
  while (o + 8 <= b.length) {
    const id = b.toString('ascii', o, o + 4), n = b.readUInt32LE(o + 4);
    if (id === 'data') return b.subarray(o + 8, o + 8 + n);
    o += 8 + n + (n & 1);
  }
  throw new Error('WAV khong co khoi data: ' + f);
}

// WAV: nhip giang dung tieng TTS that (Charon) — chi de xem bang mat, khong co su that
KIEM.WAV = async (t) => {
  await t.moBai();
  const thu = path.join(SCR, 'lipsync', 'A');
  const chu = {};
  fs.readFileSync(path.join(thu, 'stt_cau.txt'), 'utf8').split(/\r?\n/).forEach((l) => { const m = l.match(/^(\S+)\s*\|\s*(.*)$/); if (m) chu[m[1]] = m[2]; });
  const ten = ['cau_05', 'cau_09', 'cau_06', 'cau_01'];
  const nap = [];
  for (const id of ten) {
    const pcm = docWav(path.join(thu, 'tts', id + '.wav'));
    nap.push({ id, giay: await t.ev(`__moPhong.napWav(${JSON.stringify(id)}, ${JSON.stringify(pcm.toString('base64'))}, ${JSON.stringify(chu[id] || '')})`) });
  }
  const anh = [];
  await chayDoan(t, null, ten.length - 1, { hanMs: 180000, moiNhip: async (i) => {
    if (i < 0 || i >= ten.length) return;
    await sleep(2600);
    anh.push(path.basename(await t.chup(`WAV-${i}.png`)));
  } });
  const r = await t.ev(`({ luot: __moPhong.luot().filter(l => l.laWav).map(l => ({ nhip: l.nhip, kind: l.kind, xong: l.xong, tong: +l.tong.toFixed(2), chunkMat: l.chunkMat })),
    nhatKy: window.__motion ? (__motion.nhatKy() || []).length : null,
    via: window.__motion ? (__motion.nhatKy() || []).reduce((o, e) => { o[e.via] = (o[e.via] || 0) + 1; return o; }, {}) : null })`);
  return { dat: r.luot.length === ten.length && r.luot.every((l) => l.xong && !l.chunkMat), chiTiet: { nap, anh, ...r } };
};

// smoke: nap trang, chay 3 nhip, chup anh
KIEM.smoke = async (t) => {
  await t.moBai();
  const motion = await coMotion(t);
  await chayDoan(t, null, 2, { hanMs: 180000 });
  const r = await t.ev(`({ nhatKy: window.__motion ? (__motion.nhatKy() || []).length : null, luot: __moPhong.luot().map(l => l.loai + ':' + l.kind + ':' + (l.xong ? 'xong' : l.biNgat ? 'ngat' : 'dang')), dong: __kt.dong.length, goi: (window.__goiSK || []).length })`);
  await t.chup('smoke.png');
  return { dat: true, chiTiet: { motionThat: motion, ...r } };
};

// T1: khoa luoi khi dang giang
KIEM.T1 = async (t) => {
  await t.moBai();
  const beats = await t.ev(`__lecture.beats().map(b => b.kind)`);
  const lay = (kind, k = 0) => beats.map((b, i) => (b === kind ? i : -1)).filter((i) => i >= 0)[k];
  const NHIP = [lay('vocab', 1), lay('vocab', 6), lay('kanji', 0), lay('kanji', 3), lay('grammar-intro', 0), lay('example', 0),
    lay('example', 5), lay('kaiwa-intro', 0), lay('kaiwa', 2), lay('quiz', 1)].filter((x) => x != null);
  const mau = [];
  for (const i of NHIP) {
    await dungGiang(t);
    await t.ev(`__moPhong.datDen(${i})`);
    await t.ev(`__lecture.startFrom(${i}).then(() => true)`);
    await t.cho(`(__motion.trangThai() || {}).che === 'giang'`, 8000);
    for (let s = 0; s < 5; s++) {
      await sleep(300 + Math.random() * 1200);
      const v = await t.ev(`(() => {
        const tt = __motion.trangThai() || {}; if (tt.che !== 'giang') return { boQua: tt.che };
        const sc = document.getElementById('slideContent'), st = document.getElementById('sanKhauGiang');
        const r = sc.getBoundingClientRect(); const pts = [];
        for (const fx of [.2, .5, .8]) for (const fy of [.2, .5, .8]) {
          const x = Math.max(1, Math.min(innerWidth - 2, r.left + r.width * fx)), y = Math.max(1, Math.min(innerHeight - 2, r.top + r.height * fy));
          const e = document.elementFromPoint(x, y); pts.push(!!(e && sc.contains(e)));
        }
        const the = [...sc.querySelectorAll('.deck-card, [id^="card-"]')].find(e => { const b = e.getBoundingClientRect(); return b.width > 20 && b.height > 20 && b.top > 0 && b.bottom < innerHeight; });
        const b = the && the.getBoundingClientRect();
        return { nhip: tt.nhip, kind: tt.kind, dangGiang: document.body.classList.contains('dang-giang'), inert: sc.inert, vis: getComputedStyle(sc).visibility,
          sanHien: !!(st && !st.hidden && getComputedStyle(st).display !== 'none' && st.getBoundingClientRect().height > 0),
          trungDiem: pts.filter(Boolean).length, the: b ? { x: b.left + b.width / 2, y: b.top + b.height / 2 } : null,
          focus: __slideEngine.activeFocusId, khoa: document.querySelectorAll('.opt-locked').length };
      })()`);
      if (v.boQua) { mau.push({ i, boQua: v.boQua }); continue; }
      if (s === 2 && v.the) {
        await t.click(v.the.x, v.the.y);
        await sleep(150);
        const sau = await t.ev(`({ focus: __slideEngine.activeFocusId, khoa: document.querySelectorAll('.opt-locked').length, st: __lecture.state().lectureState })`);
        v.bamDoi = sau.focus !== v.focus || sau.khoa !== v.khoa || sau.st !== 'PLAYING';
      }
      v.dat = v.dangGiang && v.inert === true && v.vis === 'hidden' && v.sanHien && v.trungDiem === 0 && !v.bamDoi;
      mau.push({ i, ...v });
    }
  }
  await dungGiang(t);
  const tinh = mau.filter((m) => !m.boQua);
  return { dat: tinh.length >= 10 && tinh.every((m) => m.dat), chiTiet: { soMau: tinh.length, hong: tinh.filter((m) => !m.dat), boQua: mau.length - tinh.length } };
};

// T2: cho hoc vien lam bai
KIEM.T2 = async (t) => {
  await t.moBai();
  return kiemCho(t);
};

/** 5 ca cho cua 5 cau quiz dau (dung / sai / Bo qua / Tiep tuc / phim B). Dung chung cho T2 va DC */
async function kiemCho(t) {
  const q0 = await nhipDau(t, 'quiz');
  const ca = {};
  await t.ev(`__moPhong.datDen(null)`);
  await t.ev(`__lecture.startFrom(${q0}).then(() => true)`);
  const choVao = async (j) => {
    const ok = await t.cho(`__kt.lucVaoCho[${j}] != null`, 120000, 50);
    if (!ok) return null;
    const v = await t.cho(`(() => { const tt = __motion.trangThai() || {}; if (tt.che !== 'cho') return null;
      return { ms: performance.now() - __kt.lucVaoCho[${j}], inert: document.getElementById('slideContent').inert }; })()`, 2000, 20);
    return v;
  };
  const kiemMo = async (j) => t.ev(`(() => { const b = __lecture.beats()[${j}]; const id = b.data.id; const out = { id };
    const o = document.getElementById('btn-opt-' + id + '-0'); if (!o) return { id, loi: 'khong co nut' };
    const r = o.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    out.trung = !!(e && e.closest('[id^="btn-opt-"]') && e.closest('[id^="btn-opt-"]').id === o.id);
    const the = document.getElementById('card-' + id);
    const khac = [...document.querySelectorAll('#slideContent [id^="card-"]')].filter(c => c !== the);
    out.khacInert = khac.length ? khac.every(c => !!c.closest('[inert]')) : null;
    // Bo sung v2 (portal): the that nam trong .sk-the; the khac khong bam duoc (inert HOAC an duoi san khau)
    out.theTrongSan = !!(the && the.closest('#sanKhauGiang') && the.closest(__kt.sel.the));
    out.khacKhongBam = khac.length ? khac.every(c => !!c.closest('[inert]') || getComputedStyle(c).visibility === 'hidden') : null;
    return out; })()`);
  const choSang = async (j, lucBam, han = 30000) => {
    let dungLai = false;
    while (Date.now() - lucBam < han) {
      const s = await t.ev(`({ st: __lecture.state().lectureState, i: __lecture.index() })`);
      if (s.st === 'PAUSED') dungLai = true;
      if (s.i > j) return { ms: Date.now() - lucBam, dungLai };
      await sleep(30);
    }
    return { ms: null, dungLai };
  };
  // A. dung
  {
    const j = q0, v = await choVao(j), mo = await kiemMo(j);
    const tl = await traLoiCho(t, j, true); const lb = Date.now();
    const s = await choSang(j, lb);
    const nx = await t.ev(`(() => { const id = __lecture.beats()[${j}].data.id; const e = document.getElementById('explain-' + id); if (!e) return 0;
      const a = e.querySelector('.qz-fb-loi'), b = e.querySelector('.qz-fb-tip'); return (a ? a.textContent.length : 0) + (b ? b.textContent.length : 0); })()`);
    const han = (Math.max(2.5, 0.04 * nx) + 1.2) * 1000;
    // §6 T2 goc doi #slideContent.inert === false (tra ve luoi); ban bo sung v2 dua the len san khau
    // -> chap nhan mot trong hai: luoi mo khoa (v1) HOAC the that trong .sk-the (v2)
    ca.dung = { vao: v, mo, traLoi: tl && tl.k, ...s, chu: nx, hanMs: han,
      dat: !!(v && v.ms <= 450 && (v.inert === false || mo.theTrongSan) && mo.trung && mo.khacKhongBam !== false && s.ms != null && s.ms <= han && !s.dungLai) };
  }
  // B. sai: luot cham bai phat trong PLAYING, sang nhip 2.5 s (+-0.5) sau khi het tieng cham
  {
    const j = q0 + 1, v = await choVao(j);
    const tl = await traLoiCho(t, j, false); const lb = Date.now();
    const s = await choSang(j, lb, 60000);
    const r = await t.ev(`(() => { const c = __moPhong.luot().filter(l => l.loai === 'cham').pop(); const bd = __kt.dong.filter(d => d.ten === 'batDauNhip' && d.i === ${j + 1}).pop();
      const rc = __kt.dong.filter(d => d.ten === 'raCho' && d.i === ${j}).pop();
      const giang = __kt.nhipDoi.filter(x => x.luc >= ${'${lb0}'}).every(x => x.st === 'PLAYING');
      return { tEnd: c && c.tEnd, xong: c && c.xong, ctxNhipSau: bd && bd.ctx, ctxRaCho: rc && rc.ctx }; })()`.replace('${lb0}', '0'));
    // tEnd = het hang doi audio cua luot cham (kem 200 ms im cuoi). App: het tieng -> 350 ms (debounce
    // onPlayStateChange) -> ketThucChenNgang hen 1450 ms -> raCho -> 700 ms khoang nghi -> batDauNhip
    // = 2.5 s. Tieu chi T2 do toi luc NHIP SAU BAT DAU (batDauNhip), khong phai raCho.
    const treRa = r.ctxRaCho != null && r.tEnd != null ? r.ctxRaCho - r.tEnd : null;
    const treNhip = r.ctxNhipSau != null && r.tEnd != null ? r.ctxNhipSau - r.tEnd : null;
    const luotChamTrongGiang = await t.ev(`(() => { const c = __moPhong.luot().filter(l => l.loai === 'cham').pop(); if (!c || c.batDau == null) return null;
      return __kt.nhipDoi.filter(x => x.luc >= c.batDau).every(x => x.st === 'PLAYING') && __lecture.state().lectureState !== 'PAUSED'; })()`);
    ca.sai = { vao: v, traLoi: tl && tl.k, ...s, ...r, giayHetTiengToiRaCho: tron(treRa), giayHetTiengToiNhipSau: tron(treNhip), luotChamTrongGiang,
      dat: !!(v && s.ms != null && !s.dungLai && r.xong && treNhip != null && Math.abs(treNhip - 2.5) <= 0.5) };
  }
  // C. Bo qua
  {
    const j = q0 + 2; await choVao(j); await sleep(300);
    const lb = Date.now(); const r = await boQuaCho(t);
    const s = await choSang(j, lb, 5000);
    ca.boQua = { nut: !!r, ...s, dat: !!(r && s.ms != null && s.ms <= 900) };
  }
  // D. Tiep tuc
  {
    const j = q0 + 3; await choVao(j); await sleep(300);
    await traLoiCho(t, j, true);
    const nut = await t.cho(`[...document.querySelectorAll('#sanKhauGiang button')].some(b => /Tiếp tục/.test(b.textContent))`, 5000, 50);
    const lb = Date.now();
    const r = nut ? await t.bam(`=[...document.querySelectorAll('#sanKhauGiang button')].find(b => /Tiếp tục/.test(b.textContent))`) : null;
    const s = await choSang(j, lb, 5000);
    ca.tiepTuc = { nut: !!r, ...s, dat: !!(r && s.ms != null && s.ms <= 900) };
  }
  // E. Phim A-D
  {
    const j = q0 + 4; await choVao(j); await sleep(300);
    await t.phim('b');
    const id = await t.ev(`__lecture.beats()[${j}].data.id`);
    const ok = await t.cho(`!!document.querySelector('#btn-opt-${id}-1.opt-locked')`, 1500, 50);
    ca.phim = { dat: !!ok };
  }
  await dungGiang(t);
  return { dat: Object.values(ca).every((c) => c.dat), chiTiet: ca };
};

// T3: tam dung tra lai bo cuc tinh. T3R: y het duoi prefers-reduced-motion: reduce (tester r2) — them dieu
// §1.10.3: san khau an NGAY (khong mo dan 160 ms). Mau khung ke tiep ghi ca mq / giam / so chuyen tiep CSS
// 'visibility' dang cho trong #slideContent (quy tac giam chuyen dong chung cua styles.css cho moi phan tu
// transition all .01ms -> khung dau cua chuyen tiep visibility hidden->visible van la hidden)
KIEM.T3 = (t) => chayT3(t, false);
KIEM.T3R = (t) => chayT3(t, true);
async function chayT3(t, giam) {
  await t.media(giam);
  try { return await chayT3Than(t, giam); } finally { await t.media(false); }
}
async function chayT3Than(t, giam) {
  const DUONG = {
    nutTamDung: async () => t.bam('#autoLectureBtn'),
    gioTay: async () => t.bam('#raiseHandBtn'),
    bamTab: async () => t.bam('#tabKanjiBtn'),
    phimPhai: async () => t.phim('ArrowRight'),
    guiChat: async () => { await t.bam('#chatToggleBtn'); await sleep(150); await t.bam('#chatInput'); await t.go('Sensei ơi cho em hỏi'); return t.bam('#sendChatBtn'); },
    doiBai: async () => t.ev(`window.jumpToLesson('N5', 2).then(() => true)`),
    dongPhien: async () => t.ev(`__moPhong.dongPhien()`),
    noiChen: async () => t.ev(`__moPhong.ngatLoi()`),
  };
  const kq = {};
  for (const [ten, lam] of Object.entries(DUONG)) {
    await t.moBai();
    const tu = ten === 'phimPhai' ? await nhipDau(t, 'example') : 1;
    await t.ev(`__moPhong.datDen(null)`);
    await t.ev(`__lecture.startFrom(${tu}).then(() => true)`);
    await t.cho(`(__motion.trangThai() || {}).che === 'giang'`, 8000);
    await sleep(2200);
    const lucDung = await t.ev(`performance.now()`);
    await lam();
    const ngay = await t.ev(`new Promise(r => requestAnimationFrame(() => { const sc = document.getElementById('slideContent'), st = document.getElementById('sanKhauGiang');
      r({ dangGiang: document.body.classList.contains('dang-giang'), pe: st ? getComputedStyle(st).pointerEvents : 'none', anSk: !st || st.hidden,
          vis: getComputedStyle(sc).visibility, inert: sc.inert, st: __lecture.state().lectureState, mq: matchMedia('(prefers-reduced-motion: reduce)').matches,
          giam: (window.__motion && __motion.trangThai() || {}).giam,
          soChuyenTiep: document.getAnimations().filter(a => a.transitionProperty === 'visibility' && a.effect && a.effect.target && sc.contains(a.effect.target)).length,
          tuChuyenTiep: sc.getAnimations().filter(a => a.transitionProperty).map(a => a.transitionProperty + ':' + a.playState).slice(0, 4),
          trSc: getComputedStyle(sc).transitionProperty + '/' + getComputedStyle(sc).transitionDuration }); }))`);
    await sleep(250);
    const sau = await t.ev(`(() => { const sc = document.getElementById('slideContent'), st = document.getElementById('sanKhauGiang');
      const chay = document.getAnimations().filter(a => a.playState === 'running').map(a => a.effect && a.effect.target).filter(e => e && (sc.contains(e) || (st && st.contains(e))) && !e.closest('.deck-wave'));
      return { chay: chay.slice(0, 5).map(e => String(e.className).slice(0, 50)), soChay: chay.length, huyHieu: sc.querySelectorAll('.reading-badge-indicator').length };
    })()`);
    // ban sau luc dung: so voi moc tamDung/dung that
    const moc = await t.ev(`(() => { const d = __kt.dong.filter(x => (x.ten === 'tamDung' || x.ten === 'dung') && x.luc >= ${lucDung} - 5).shift(); return d ? d.luc : null; })()`);
    const banSau = await t.ev(`(window.__motion ? (__motion.nhatKy() || []) : []).filter(e => e.firedPerf > ${moc == null ? lucDung : moc} + 1).length`);
    sau.banSau = banSau;
    const loi = [];
    if (ngay.dangGiang) loi.push('con body.dang-giang');
    if (!(ngay.pe === 'none' || ngay.anSk)) loi.push('san khau con nhan con tro');
    if (ngay.vis === 'hidden') loi.push('#slideContent visibility hidden o khung ke tiep' + (ngay.soChuyenTiep ? ' (' + ngay.soChuyenTiep + ' chuyen tiep CSS visibility dang cho)' : ''));
    if (ngay.inert) loi.push('#slideContent con inert');
    if (giam && !ngay.anSk) loi.push('giam chuyen dong: san khau chua an ngay (§1.10.3)');
    if (giam && !ngay.mq) loi.push('media giam chuyen dong khong ap duoc');
    if (sau.soChay) loi.push(sau.soChay + ' hoat anh con chay sau 250 ms');
    if (banSau) loi.push(banSau + ' cue ban sau luc dung');
    if (sau.huyHieu) loi.push('con .reading-badge-indicator');
    kq[ten] = { ngay, sau, mocTamDung: moc, dat: loi.length === 0, loi };
    if (ten === 'gioTay') { await t.bam('#askCancelBtn'); await sleep(300); await dungGiang(t); }
  }
  return { dat: Object.values(kq).every((x) => x.dat), chiTiet: kq };
}

/** Sai so dong bo cua cac cue khop tu mot lan chay (T4 / T9) */
async function saiSoDongBo(t, LEAD = 0.12) {
  return t.ev(`(() => {
    const nk = (window.__motion ? __motion.nhatKy() : []) || [];
    const luot = __moPhong.luot();
    const nhipBo = new Set(); const thuTu = [];
    __kt.dong.filter(d => d.ten === 'batDauNhip').forEach(d => { if (!thuTu.includes(d.i)) thuTu.push(d.i); });
    thuTu.slice(0, 2).forEach(i => nhipBo.add(i));
    const khop = [], dau = [], cc = [];
    for (const e of nk) {
      if (e.firedCtx == null) continue;
      const L = luot.find(l => l.tag === e.luot);
      if (e.via === 'khop' && !nhipBo.has(e.nhip) && e.viTri != null) {
        const that = __moPhong.thoiDiemThat(e.luot, e.viTri);
        if (that != null) khop.push({ nhip: e.nhip, kind: e.kind, id: e.id, loai: e.loai, err: e.firedCtx + ${LEAD} - that });
      } else if (e.via === 'dauTien' && L && L.tFirst != null) dau.push({ nhip: e.nhip, id: e.id, err: e.firedCtx + ${LEAD} - L.tFirst });
      else if (e.via === 'congCu') {
        const that = __moPhong.thoiDiemCongCu(e.luot, e.congCu || e.tool || 'write_kanji');
        if (that != null) cc.push({ nhip: e.nhip, id: e.id, err: e.firedCtx + ${LEAD} - that });
      }
    }
    // Karaoke kaiwa-run: .is-doc tren st-<token> so voi karaokeThat
    const kar = [];
    const run = __lecture.beats().find(b => b.kind === 'kaiwa-run');
    if (run) for (const line of run.data) {
      const k = __moPhong.karaokeThat(line.id); if (!k) continue;
      // lan phat trong nhip kaiwa-run (cau 1 con duoc phat lai o nhip kaiwa)
      const lp = k.lanPhat.find(p => p.nhip === run.index); if (!lp) continue;
      for (const tk of k.tokens) {
        if (tk.dau) continue;
        const T = lp.t0 + tk.t;
        const m = __kt.karaoke.find(x => x.id === tk.id && x.ctx != null && x.ctx >= lp.t0 - 0.3 && x.ctx <= lp.t0 + k.dur + 0.5);
        if (m) kar.push({ id: tk.id, err: m.ctx - T });
      }
    }
    return { soNhatKy: nk.length, khop, dau, cc, kar, via: nk.reduce((o, e) => { o[e.via] = (o[e.via] || 0) + 1; return o; }, {}) };
  })()`);
}
const thongKe = (ds) => { const a = ds.map((x) => Math.abs(x.err)); return { n: a.length, trungVi: tron(trungVi(a)), p90: tron(phanVi(a, 0.9)), max: tron(a.length ? Math.max(...a) : null) }; };

// T4: dong bo loi noi
KIEM.T4 = async (t) => {
  const [tu, den] = TUY.doan || [0, 83];
  const lan = [{ ten: 'tre035', them: '&tre=0.35&rung=0.15', han: [0.15, 0.35] }, { ten: 'tre-03', them: '&tre=-0.3&rung=0.15', han: [0.15, 0.35] }, { ten: 'tre08', them: '&tre=0.8&rung=0.15', han: [null, 0.45] }];
  const kq = {};
  for (const l of lan) {
    await t.moBai({ them: l.them });
    await chayDoan(t, tu, den, { traLoi: 'boqua' });
    const s = await saiSoDongBo(t);
    const k = thongKe(s.khop), d = thongKe(s.dau), c = thongKe(s.cc), kr = thongKe(s.kar);
    const dat = k.n > 0 && (l.han[0] == null || k.trungVi <= l.han[0]) && k.p90 <= l.han[1]
      && (!d.n || d.max <= 0.05) && (!c.n || c.p90 <= 0.3) && (l.ten !== 'tre035' || !kr.n || kr.p90 <= 0.15);
    kq[l.ten] = { khop: k, dauTien: d, congCu: c, karaoke: kr, via: s.via, dat, xauNhat: s.khop.sort((a, b) => Math.abs(b.err) - Math.abs(a.err)).slice(0, 8) };
  }
  return { dat: Object.values(kq).every((x) => x.dat), chiTiet: kq };
};

/** Cue bat buoc (hien/lam) cua tung canh: da ban truoc khi canh roi? (T5) */
async function kiemCut(t) {
  return t.ev(`(() => {
    const nk = (window.__motion ? __motion.nhatKy() : []) || [];
    const dong = __kt.dong;
    const bd = dong.filter(d => d.ten === 'batDauNhip');
    const dungs = dong.filter(d => d.ten === 'tamDung' || d.ten === 'dung').map(d => d.luc);
    const hetCanh = [];
    const theoNhip = {};
    bd.forEach((d, k) => {
      const tiep = bd[k + 1];
      const het = dong.find(x => x.ten === 'khiHetNhip' && x.luc >= d.luc && (!tiep || x.luc < tiep.luc));
      let ra = tiep ? tiep.luc : Infinity;
      if (het) ra = Math.min(ra, het.luc + (het.tiep == null ? 300 : 500));
      const dg = dungs.find(x => x > d.luc && x < ra);
      theoNhip[d.i + '@' + k] = { i: d.i, kind: d.kind, batDau: d.luc, ra, biDung: dg != null };
    });
    // (tester r1) cue tuy chon (batBuoc:false trong __motion.cues(), vd R.i cua kaiwa-run — tuyChon:true) khong phai bat buoc
    const tuyChon = new Set(); __kt.cuesHet.forEach(x => (x.cues || []).forEach(c => { if (c.batBuoc === false) tuyChon.add(x.i + ':' + c.id); }));
    const batBuoc = nk.filter(e => (e.loai === 'hien' || e.loai === 'lam') && !tuyChon.has(e.nhip + ':' + e.id));
    const nen = batBuoc.filter(e => e.via === 'nen').length;
    // Cue ban khi nhip khac dang song / sau luc dung
    let lech = 0; const lechMau = [];
    for (const e of nk) {
      // (tester r1) cue bi bo (via 'bo', firedPerf null) khong ban -> khong phai 'ban o nhip khac'
      if (e.firedPerf == null) continue;
      const song = bd.filter(d => d.luc <= e.firedPerf).pop();
      const dg = song && dungs.find(x => x > song.luc && x < e.firedPerf);
      if (!song || song.i !== e.nhip || dg != null) { lech++; if (lechMau.length < 5) lechMau.push({ id: e.id, nhip: e.nhip, song: song && song.i }); }
    }
    // Cue bat buoc chua ban luc canh roi: lay tu anh chup cues() luc khiHetNhip (sau nen)
    let chuaBan = 0; const chuaMau = [];
    const daBan = (c) => c && (c.firedAt != null || c.firedCtx != null || c.firedPerf != null || c.daBan === true || /ban|fired|xong/.test(String(c.trangThai || c.state || '')));
    __kt.cuesHet.filter(x => x.pha === 'sau').forEach(x => (x.cues || []).forEach(c => {
      if ((c.loai === 'hien' || c.loai === 'lam') && c.batBuoc !== false && !daBan(c)) { chuaBan++; if (chuaMau.length < 8) chuaMau.push({ nhip: x.i, id: c.id }); }
    }));
    // Cue ban SAU luc canh roi
    let tre = 0;
    batBuoc.forEach(e => { const n = Object.values(theoNhip).find(v => v.i === e.nhip && e.firedPerf >= v.batDau && e.firedPerf <= v.ra + 50); if (!n) tre++; });
    return { soBatBuoc: batBuoc.length, nen, tiLeNen: batBuoc.length ? nen / batBuoc.length : null, lech, lechMau, chuaBan, chuaMau, tre, soCanh: bd.length };
  })()`);
}

// T5: khong cut
KIEM.T5 = async (t) => {
  const [tu, den] = TUY.doan || [0, 83];
  const kq = {};
  for (const [ten, them, hanNen] of [['thuong', '', 0.05], ['mat05', '&mat=0.5', 0.15]]) {
    await t.moBai({ them });
    await chayDoan(t, tu, den, { traLoi: 'dung' });
    const k = await kiemCut(t);
    kq[ten] = { ...k, dat: k.soBatBuoc > 0 && k.chuaBan === 0 && k.tre === 0 && k.lech === 0 && k.tiLeNen <= hanNen };
  }
  return { dat: Object.values(kq).every((x) => x.dat), chiTiet: kq };
};

// T6: khung cuoi + thong ke canhCau tren 867 vi du
KIEM.T6 = async (t) => {
  await t.moBai();
  const beats = await t.ev(`__lecture.beats().map(b => b.kind)`);
  const lay = (kind) => beats.indexOf(kind);
  const ex1 = await t.ev(`__lecture.beats().findIndex(b => b.targetId === 'ex-n5-l1-s1-1')`);
  const kq = { canh: {} };
  for (const [ten, i] of [['vocab', lay('vocab')], ['kanji', lay('kanji')], ['grammar-intro', lay('grammar-intro')], ['ex-n5-l1-s1-1', ex1], ['quiz', lay('quiz')]]) {
    await dungGiang(t);
    await t.ev(`__kt.raCanh.length = 0`);
    await chayDoan(t, i, i, { traLoi: 'boqua', hanMs: 180000 });
    const anh = await t.ev(`__kt.raCanh.filter(x => x.i === ${i}).map(x => ({ khi: x.khi || 'roi', khung: x.khung }))`);
    const k = (anh.find((x) => x.khi === 'khoang-nghi') || anh.find((x) => x.khi === 'vaoCho') || anh[0] || {}).khung || {};
    let dat = !!k.coCanh && k.soAn === 0;
    if (ten === 'ex-n5-l1-s1-1') dat = dat && /私|わたし/.test(k.text) && /は/.test(k.text) && /マイク・ミラー/.test(k.text) && /です/.test(k.text) && /đọc: wa/.test(k.text) && /Mike Miller/.test(k.text);
    if (ten === 'quiz') { const kv = anh.find((x) => x.khi === 'vaoCho'); dat = !!(kv && kv.khung.coCanh) && (kv.khung.soLuaChon === 4 || /A[\s\S]*B[\s\S]*C[\s\S]*D/.test(kv.khung.text)); }
    kq.canh[ten] = { i, dat, khung: k, soAnh: anh.length };
  }
  await dungGiang(t);
  kq.canhCau = await t.ev(`(async () => {
    const M = window.__motionChu; if (!M || !M.tachCongThuc || !M.canhCau) return { khongCo: true };
    let n = 0, ghep = 0, nem = 0; const che = {}; const loi = [];
    for (const lvl of ['n5', 'n4', 'n3', 'n2', 'n1']) {
      const idx = await (await fetch('curriculum/' + lvl + '/index.json')).json();
      for (const l of idx) {
        const bai = await (await fetch('curriculum/' + lvl + '/' + l.lessonNumber + '.json')).json();
        for (const sl of bai.slides || []) {
          let parts = null; try { parts = M.tachCongThuc(sl.grammarFormula || ''); } catch (e) { nem++; loi.push('tach ' + sl.slideId + ': ' + e); continue; }
          for (const ex of sl.examples || []) {
            n++;
            try { const r = M.canhCau(parts, ex.tokens || []); const m = String(r && (r.che || r.kieu || r.mode || r.loai || (r.ghep ? 'ASSEMBLE' : '')) || ''); che[m] = (che[m] || 0) + 1; if (/ghep|assemble|lap/i.test(m)) ghep++; }
            catch (e) { nem++; if (loi.length < 5) loi.push(ex.id + ': ' + e); }
          }
        }
      }
    }
    return { n, ghep, nem, che, loi };
  })()`);
  const cc = kq.canhCau;
  const datCc = !!cc && !cc.khongCo && cc.nem === 0 && cc.ghep >= 110 && cc.ghep <= 130;
  return { dat: Object.values(kq.canh).every((x) => x.dat) && datCc, chiTiet: kq };
};

// T7: chi translate / scale / opacity (+ net chu Han / net minh hoa)
KIEM.T7 = async (t) => {
  await t.moBai();
  const beats = await t.ev(`__lecture.beats().map(b => b.kind)`);
  const [tu, den] = TUY.doan || [beats.indexOf('kanji'), beats.indexOf('kanji') + 1];
  await chayDoan(t, tu, den, { traLoi: 'dung' });
  const q0 = beats.indexOf('quiz');
  await chayDoan(t, q0, q0, { traLoi: 'dung' });
  const h = await t.ev(`__kt.hoat`);
  return { dat: h.vuot.length === 0 && h.netMax <= 20 && h.mau > 0, chiTiet: h };
};

// T8: hieu nang
KIEM.T8 = async (t) => {
  await t.moBai();
  const [tu, den] = TUY.doan || [0, 59];
  await chayDoan(t, tu, den, { traLoi: 'dung' });
  const r = await t.ev(`(() => {
    const nk = (window.__motion ? __motion.nhatKy() : []) || [];
    const ms = nk.map(e => e.msLam).filter(x => x != null);
    const s = [...ms].sort((a, b) => a - b); const p99 = s.length ? s[Math.min(s.length - 1, Math.ceil(.99 * s.length) - 1)] : null;
    // (tester r1) co 'giang' ghi luc callback PerformanceObserver (tre, buffered) -> gan theo startTime vao khoang dang giang
    const kk = __kt.giangKhoang || []; const trong = (e) => kk.some(([a, b]) => e.luc + e.ms > a && (b == null || e.luc < b));
    const lt = __kt.lt.filter(e => e.ms > 50 && trong(e));
    const kh = __kt.khung; const dai = kh.filter(d => d > 24).length;
    // (tester r2) gan tac vu dai voi moc dao dien gan nhat truoc no (batDauNhip / khiHetNhip / vaoCho ...) + cue lam cham nhat
    const moc = (x) => { const d = __kt.dong.filter(y => y.luc <= x.luc + 5).pop(); return d ? d.ten + ':' + d.i + (d.kind ? ':' + d.kind : '') + '@+' + Math.round(x.luc - d.luc) : null; };
    const ltTom = lt.map(e => ({ luc: Math.round(e.luc), ms: Math.round(e.ms), moc: moc(e) }));
    const cham = nk.filter(e => e.msLam != null).sort((a, b) => b.msLam - a.msLam).slice(0, 8).map(e => ({ nhip: e.nhip, kind: e.kind, id: e.id, ms: +e.msLam.toFixed(1) }));
    return { soLam: ms.length, p99, lt: lt.length, ltMau: ltTom.slice(0, 30), lamCham: cham, dongThoiMax: __kt.hoat.dongThoiMax, qua12: __kt.hoat.qua12 || 0, dongThoiMau: (__kt.hoat.dtMau || []).slice(0, 6),
      dongThoiMaxPhaHoatDong: __kt.hoat.dongThoiMaxHd || 0, qua12PhaHoatDong: __kt.hoat.qua12Hd || 0, soKhung: kh.length, khungDai: dai, tiLe: kh.length ? dai / kh.length : null };
  })()`);
  // (tester r1) dong thoi: dem hoat anh o pha hoat dong (net chu Han xep hang bang delay chua chuyen dong); so tho van bao cao
  return { dat: r.p99 != null && r.p99 <= 8 && r.lt <= 2 && r.dongThoiMaxPhaHoatDong <= 12 && (r.tiLe == null || r.tiLe <= 0.05), chiTiet: r };
};

// T9: giam chuyen dong
KIEM.T9 = async (t) => {
  const beats0 = [];
  const [tu, den] = TUY.doan || [0, 3];
  const chay = async (giam) => {
    await t.media(giam);
    await t.moBai();
    await chayDoan(t, tu, den, { traLoi: 'dung' });
    const r = await t.ev(`(() => { const nk = (window.__motion ? __motion.nhatKy() : []) || []; const luot = __moPhong.luot();
      return { cues: nk.filter(e => e.firedCtx != null).map(e => { const L = luot.find(l => l.tag === e.luot); return { k: e.nhip + ':' + e.id, rel: L && L.tFirst != null ? e.firedCtx - L.tFirst : null }; }), via: nk.map(e => e.nhip + ':' + e.id + ':' + e.via), giamVuot: __kt.hoat.giamVuot }; })()`);
    return r;
  };
  const a = await chay(false), b = await chay(true);
  await t.media(false);
  const lech = [];
  for (const c of a.cues) { const d = b.cues.find((x) => x.k === c.k); if (d && c.rel != null && d.rel != null) lech.push({ k: c.k, ms: (d.rel - c.rel) * 1000 }); }
  const vuot = lech.filter((x) => Math.abs(x.ms) > 20);
  void beats0;
  // (tester r2) chi tiet tung cue: thieu / thua o lan giam, do lech, via cua ca hai lan
  return { dat: b.giamVuot.length === 0 && lech.length > 0 && vuot.length === 0, chiTiet: { soSoSanh: lech.length, vuot: vuot.slice(0, 10), giamVuot: b.giamVuot.slice(0, 10), thieu: a.cues.length - lech.length, thieuDs: a.cues.filter((c) => !b.cues.some((x) => x.k === c.k)).map((c) => c.k), thuaDs: b.cues.filter((c) => !a.cues.some((x) => x.k === c.k)).map((c) => c.k), lech: lech.map((x) => x.k + ':' + x.ms.toFixed(1)), viaA: a.via, viaB: b.via } };
};

// T10: bo cuc tren 6 co man hinh x 6 dang canh (+ kaiwa-intro, kaiwa: mau phu, bao rieng — tester r2).
// Moi mau do 3 luc: giua nhip (1,8 s; kaiwa-run 5 s), luc cho (quiz, 0,9 s sau vaoCho) va khung cuoi (khoang nghi).
// Loi: scrollWidth > innerWidth, 'ngoai-hop' / 'de-meo' / 'lan-lan-meo' (§6 T10) va 'cat-doc' (tester r2, P10C):
// dong chu bi to tien overflow != visible hoac contain: paint cat mat mot phan tren / duoi.
KIEM.T10 = async (t) => {
  const MAN = TUY.man || [[1440, 900], [1280, 720], [1024, 768], [390, 844], [360, 740], [844, 390]];
  const kq = [];
  for (const [w, h] of MAN) {
    await t.moBai({ w, h });
    await t.ev(`__kt.doBoCuc = true`);
    const beats = await t.ev(`__lecture.beats().map(b => b.kind)`);
    const ex1 = await t.ev(`__lecture.beats().findIndex(b => b.targetId === 'ex-n5-l1-s1-1')`);
    for (const [ten, i] of [['vocab', beats.indexOf('vocab')], ['kanji', beats.indexOf('kanji')], ['grammar-intro', beats.indexOf('grammar-intro')], ['example', ex1], ['kaiwa-run', beats.indexOf('kaiwa-run')], ['quiz', beats.indexOf('quiz')], ['kaiwa-intro', beats.indexOf('kaiwa-intro')], ['kaiwa', beats.indexOf('kaiwa')]]) {
      if (TUY.loai && !TUY.loai.includes(ten)) continue;
      if (i < 0) { kq.push({ w, h, ten, i, phu: ten === 'kaiwa-intro' || ten === 'kaiwa', dat: false, loi: 'khong co nhip ' + ten }); continue; }
      await dungGiang(t);
      await t.ev(`__kt.raCanh.length = 0`);
      await t.ev(`__moPhong.datDen(${i})`);
      await t.ev(`__lecture.startFrom(${i}).then(() => true)`);
      await t.cho(`(__motion.trangThai() || {}).che === 'giang'`, 8000);
      await sleep(ten === 'kaiwa-run' ? 5000 : 1800);
      const giua = await t.ev(`__kt.boCucNay()`);
      const anh = await t.chup(`T10-${w}x${h}-${ten}.png`);
      await t.cho(`__moPhong.daDung || __lecture.state().lectureState !== 'PLAYING' || (__motion.trangThai() || {}).che === 'cho'`, 180000, 250);
      let cho = null;
      if ((await t.ev(`(__motion.trangThai() || {}).che`)) === 'cho') {
        await sleep(900);
        cho = await t.ev(`__kt.boCucNay()`);
        await t.chup(`T10-${w}x${h}-${ten}-cho.png`);
        await boQuaCho(t);
      }
      await sleep(300);
      const cuoi = await t.ev(`(__kt.raCanh.filter(x => x.i === ${i} && x.boCuc).pop() || {}).boCuc || null`);
      const bad = (b) => !b || !b.coSanKhau ? 0 : (b.scrollW > b.vw ? 1 : 0) + b.soLoi + (b.soCatDoc || 0);
      kq.push({ w, h, ten, i, phu: ten === 'kaiwa-intro' || ten === 'kaiwa', anh: path.basename(anh), giua, cuoi, cho,
        dat: !!(giua && giua.coSanKhau) && bad(giua) === 0 && bad(cuoi) === 0 && bad(cho) === 0 });
    }
  }
  await t.coManHinh(TUY.w, TUY.h);
  const gon = (b) => b && { soLoi: b.soLoi, scrollW: b.scrollW, vw: b.vw, loi: b.loi, soCatDoc: b.soCatDoc || 0, catDoc: b.catDoc, skCo: b.skCo };
  const tong = (ds) => ({ soMau: ds.length, soDat: ds.filter((x) => x.dat).length,
    soCatDoc: ds.reduce((n, x) => n + ['giua', 'cho', 'cuoi'].reduce((m, k) => m + ((x[k] && x[k].soCatDoc) || 0), 0), 0),
    soNgoaiHop: ds.reduce((n, x) => n + ['giua', 'cho', 'cuoi'].reduce((m, k) => m + ((x[k] && x[k].soLoi) || 0), 0), 0) });
  const chinh = kq.filter((x) => !x.phu), phu = kq.filter((x) => x.phu);
  return { dat: kq.length > 0 && (chinh.length ? chinh : phu).every((x) => x.dat),
    chiTiet: { chinh: tong(chinh), phu: { ...tong(phu), dat: phu.every((x) => x.dat) },
      hong: kq.filter((x) => !x.dat).map((x) => `${x.w}x${x.h} ${x.ten}${x.phu ? ' (phu)' : ''}`),
      mau: kq.map((x) => ({ ...x, giua: gon(x.giua), cuoi: gon(x.cuoi), cho: gon(x.cho) })) } };
};

// T10K: doi chung duong cho do 'cat-doc' cua T10 — ep cat that (the .sk-canh thap bot bang contain: paint, roi
// bang overflow: hidden, ca hai co cat mot phan dong chu) phai bao > 0; trang thai that truoc / sau phai = 0
KIEM.T10K = async (t) => {
  await t.moBai();
  const i = await nhipDau(t, 'vocab');
  await t.ev(`__moPhong.datDen(${i})`);
  await t.ev(`__lecture.startFrom(${i}).then(() => true)`);
  await t.cho(`(__motion.trangThai() || {}).che === 'giang'`, 8000);
  await sleep(1800);
  const kq = { truoc: await t.ev(`(() => { const b = __kt.boCucNay(); return { soCatDoc: b.soCatDoc, soLoi: b.soLoi }; })()`) };
  for (const [ten, css] of [['paint', 'contain: layout paint !important; overflow: visible !important;'], ['overflow', 'contain: none !important; overflow: hidden !important;']]) {
    kq[ten] = await t.ev(`(() => {
      const st = document.getElementById('sanKhauGiang');
      const the = [...st.querySelectorAll('.sk-the')].filter(e => !e.classList.contains('is-vo')).pop();
      const canh = the && (the.querySelector('.sk-canh') || the); if (!canh) return { loi: 'khong co canh' };
      // chon dong chu hien dau tien trong canh, cat ngang giua dong do
      const w = document.createTreeWalker(canh, NodeFilter.SHOW_TEXT); let n, r = null;
      while ((n = w.nextNode())) { if (!n.textContent.trim() || !n.parentElement.checkVisibility({ checkOpacity: true })) continue; const rg = document.createRange(); rg.selectNodeContents(n); const x = rg.getClientRects()[0]; if (x && x.height > 8) { r = x; break; } }
      if (!r) return { loi: 'khong co dong chu' };
      const rc = canh.getBoundingClientRect();
      const hCu = canh.getAttribute('style') || '';
      const ep = (h) => canh.setAttribute('style', hCu + ';${css} height: ' + Math.max(4, Math.round(h)) + 'px !important; max-height: none !important; min-height: 0 !important;');
      ep(r.top + r.height / 2 - rc.top);
      // (tester r3) canh can giua theo chieu doc (flex) -> bot chieu cao lam noi dung troi len, dong chu da chon
      // thoat khoi mep cat (1440x900: nhan 'TÔI' cua hinh). Do lai va ha mep cat toi giua dong (toi da 6 lan)
      for (let k = 0; k < 6; k++) {
        const rg2 = document.createRange(); rg2.selectNodeContents(n); const x2 = rg2.getClientRects()[0], rc2 = canh.getBoundingClientRect();
        if (!x2 || (x2.top < rc2.bottom - 2 && x2.bottom > rc2.bottom + 2)) break;
        ep(x2.top + x2.height / 2 - rc2.top);
      }
      const b = __kt.boCucNay();
      canh.setAttribute('style', hCu);
      return { soCatDoc: b.soCatDoc, catDoc: (b.catDoc || []).slice(0, 2) };
    })()`);
  }
  kq.sau = await t.ev(`(() => { const b = __kt.boCucNay(); return { soCatDoc: b.soCatDoc, soLoi: b.soLoi }; })()`);
  await dungGiang(t);
  const boiCo = (x, s) => !!(x && x.catDoc && x.catDoc.some((c) => c.boi.some((b) => b.includes(s))));
  const dat = kq.truoc.soCatDoc === 0 && kq.sau.soCatDoc === 0 && kq.paint.soCatDoc > 0 && boiCo(kq.paint, 'paint') && kq.overflow.soCatDoc > 0 && boiCo(kq.overflow, 'hidden');
  return { dat, chiTiet: kq };
};

// T11: id khong trung
KIEM.T11 = async (t) => {
  await t.moBai();
  const [tu, den] = TUY.doan || [0, 83];
  await chayDoan(t, tu, den, { traLoi: 'dung' });
  const r = await t.ev(`__kt.trungId.filter(x => x.trung.length)`);
  const n = await t.ev(`__kt.trungId.length`);
  return { dat: n > 0 && r.length === 0, chiTiet: { soLanKiem: n, trung: r.slice(0, 10) } };
};

// T12: cong cu bang / chu Han / doi chuong
KIEM.T12 = async (t) => {
  await t.moBai();
  const beats = await t.ev(`__lecture.beats().map(b => b.kind)`);
  const kq = {};
  // write_on_board trong luc giang: khong co body.co-bang; dong ngam vao #bangPhan
  // (tester r1) ban cu goi tool SAU khi chayDoan xong (bai giang da IDLE) -> app mo bang that (dung, vi khong
  // giang) -> bang con mo sang nhip sau (coBang=true) va nut bat bang lai DONG bang. Sua: goi tool GIUA nhip dang giang.
  const g0 = beats.indexOf('grammar-intro');
  await t.ev(`__moPhong.datDen(${g0})`);
  await t.ev(`__lecture.startFrom(${g0}).then(() => true)`);
  await t.cho(`(__motion.trangThai() || {}).che === 'giang'`, 8000);
  await sleep(1500);
  const cheLucGoi = await t.ev(`(__motion.trangThai() || {}).che`);
  const wob = await t.ev(`(() => { const r1 = __moPhong.goiCongCu('write_on_board', { text: 'dòng thử T12', style: 'nhat' }); return r1; })()`);
  await sleep(400);
  kq.writeOnBoard = { cheLucGoi, traVe: wob, coBangSauGoi: await t.ev(`document.body.classList.contains('co-bang')`) };
  await t.cho(`__moPhong.daDung || __lecture.state().lectureState !== 'PLAYING'`, 120000, 200);
  kq.writeOnBoard.coBangKhiGiang = await t.ev(`__kt.coBangKhiGiang.length`);
  // Giang lai mot nhip roi goi tool giua nhip
  const v0 = beats.indexOf('vocab');
  await t.ev(`__moPhong.datDen(${v0})`);
  await t.ev(`__lecture.startFrom(${v0}).then(() => true)`);
  await t.cho(`(__motion.trangThai() || {}).che === 'giang'`, 8000);
  await sleep(1500);
  kq.writeOnBoard.giuaNhip = await t.ev(`__moPhong.goiCongCu('write_on_board', { text: 'mẹo T12 giữa nhịp', style: 'thuong' })`);
  kq.writeOnBoard.coBang = await t.ev(`document.body.classList.contains('co-bang')`);
  const tab0 = await t.ev(`__slideEngine.activeTab`);
  kq.changeSection = { traVe: await t.ev(`__moPhong.goiCongCu('change_section', { section: 'quiz' })`), tabTruoc: tab0, tabSau: await t.ev(`__slideEngine.activeTab`) };
  await dungGiang(t);
  await t.bam('#boardToggleBtn');
  await sleep(300);
  kq.moBangSauDung = await t.ev(`({ mo: document.body.classList.contains('co-bang'), dong: [...document.querySelectorAll('#bangPhan .bang-dong')].map(d => d.textContent).slice(-6) })`);
  await t.bam('#boardToggleBtn');
  // write_kanji ve trong o san khau
  const k0 = beats.indexOf('kanji');
  await t.ev(`__moPhong.datDen(${k0})`);
  await t.ev(`__lecture.startFrom(${k0}).then(() => true)`);
  await t.cho(`(__motion.trangThai() || {}).che === 'giang'`, 8000);
  await sleep(1200);
  const ch = await t.ev(`__lecture.beats()[${k0}].data.character`);
  kq.writeKanji = { traVe: await t.ev(`__moPhong.goiCongCu('write_kanji', { character: ${JSON.stringify(ch)} })`) };
  await sleep(1500);
  kq.writeKanji.netTrongSan = await t.ev(`document.querySelectorAll('#sanKhauGiang .bang-kanji-duong').length`);
  kq.writeKanji.netNgoaiSan = await t.ev(`[...document.querySelectorAll('.bang-kanji-duong')].filter(e => !e.closest('#sanKhauGiang')).length`);
  await dungGiang(t);
  const dat = kq.writeOnBoard.coBangKhiGiang === 0 && !kq.writeOnBoard.coBang && !kq.writeOnBoard.coBangSauGoi && kq.writeOnBoard.cheLucGoi === 'giang' && kq.moBangSauDung.mo
    && kq.changeSection.tabSau === kq.changeSection.tabTruoc && kq.changeSection.traVe && kq.changeSection.traVe.success
    && kq.moBangSauDung.dong.some((d) => /T12/.test(d)) && kq.writeKanji.netTrongSan > 0;
  return { dat, chiTiet: kq };
};

// VCH: hoi quy SenseiBoard.vietChuHan (board.js r2: ghi het net roi moi do mot luot; canvas co theo ResizeObserver
// lan dau) — tren san khau (write_kanji vao o) va luc nghi (bang phan + nut "Viết lại"): du net, do dai net > 5,
// du chi so, canvas = o, chi phi goi <= 8 ms (tester r2: PVC / PK1)
KIEM.VCH = async (t) => {
  const doO = (sel) => `(() => { const hop = [...document.querySelectorAll(${JSON.stringify(sel)})].pop(); if (!hop) return null;
    const ps = [...hop.querySelectorAll('.bang-kanji-duong')], ts = hop.querySelectorAll('.bang-kanji-chiso'), cv = hop.querySelector('canvas'), o = hop.querySelector('.bang-kanji-o');
    const ro = o.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    return { soNet: ps.length, dash: ps.map(p => +parseFloat(p.style.strokeDasharray).toFixed(1)), soSo: ts.length, so0: ts[0] && [ts[0].getAttribute('x'), ts[0].getAttribute('y')],
      cv: [cv.width, cv.height], o: [Math.round(ro.width * dpr), Math.round(ro.height * dpr)] }; })()`;
  const ok = (x, n) => !!x && x.soNet === n && x.dash.every((d) => d > 5) && x.soSo === n && x.cv[0] > 50 && Math.abs(x.cv[0] - x.o[0]) <= 1 && Math.abs(x.cv[1] - x.o[1]) <= 1;
  const boc = `(() => { const g = window.__vch = []; const f = SenseiBoard.vietChuHan; if (f.__boc) return true;
    SenseiBoard.vietChuHan = function (...a) { const t0 = performance.now(); try { return f.apply(this, a); } finally { g.push({ ms: +(performance.now() - t0).toFixed(2), giang: document.body.classList.contains('dang-giang') }); } };
    SenseiBoard.vietChuHan.__boc = true; return true; })()`;
  await t.moBai();
  await t.ev(boc);
  const kq = {};
  const k0 = await nhipDau(t, 'kanji');
  const ch = await t.ev(`__lecture.beats()[${k0}].data.character`);
  const n = await t.ev(`(SenseiStrokes.get(${JSON.stringify(ch)}) || []).length`);
  // san khau: write_kanji vao o chu Han cua canh
  await t.ev(`__moPhong.datDen(${k0})`);
  await t.ev(`__lecture.startFrom(${k0}).then(() => true)`);
  await t.cho(`(__motion.trangThai() || {}).che === 'giang'`, 8000);
  await sleep(1200);
  kq.traVe = await t.ev(`__moPhong.goiCongCu('write_kanji', { character: ${JSON.stringify(ch)} })`);
  await sleep(600);
  kq.san = await t.ev(doO('#sanKhauGiang .bang-kanji'));
  await dungGiang(t);
  // luc nghi: bang phan + "Viết lại"
  await t.ev(`SenseiBoard.vietChuHan(${JSON.stringify(ch)})`);
  await sleep(400);
  kq.bang = await t.ev(doO('#bangPhan .bang-kanji'));
  await t.bam('#bangPhan .bang-kanji-lai');
  await sleep(300);
  kq.vietLai = await t.ev(doO('#bangPhan .bang-kanji'));
  kq.msGoi = await t.ev(`window.__vch || []`);
  await t.chup('VCH-bang.png');
  const loi = [];
  if (!ok(kq.san, n)) loi.push('o san khau sai: ' + JSON.stringify(kq.san));
  if (!ok(kq.bang, n)) loi.push('bang phan sai: ' + JSON.stringify(kq.bang));
  if (!ok(kq.vietLai, n)) loi.push('Viết lại sai: ' + JSON.stringify(kq.vietLai));
  // ngan sach 8 ms chi tinh luc dang giang (luc nghi lan dau con dung bang phan)
  const msSan = kq.msGoi.filter((x) => x.giang).map((x) => x.ms);
  if (!msSan.length || Math.max(...msSan) > 8) loi.push('chi phi vietChuHan tren san khau > 8 ms (hoac khong goi): ' + JSON.stringify(kq.msGoi));
  return { dat: loi.length === 0, loi, chiTiet: { ch, n, ...kq } };
};

// T13: cong tat ?khongSanKhau
KIEM.T13 = async (t) => {
  await t.moBai({ them: '&khongSanKhau', gia: false });
  const q0 = await nhipDau(t, 'quiz');
  const ke = await t.ev(`__lecture.plan().map(b => b.label)`);
  await chayDoan(t, q0, q0 + 2, { traLoi: 'khong', hanMs: 180000 });
  const r = await t.ev(`(() => { const st = document.getElementById('sanKhauGiang');
    const seq = __kt.nhipDoi.map(x => x.i).filter(i => i >= 0);
    return { sanHien: !!(st && !st.hidden && getComputedStyle(st).display !== 'none'), coDangGiang: __kt.coBangKhiGiang.length, bat: !!(window.SenseiMotion && SenseiMotion.bat), seq,
      labels: seq.map(i => __lecture.beats()[i] && __lecture.beats()[i].label) }; })()`);
  const dayDu = r.seq.every((x, k) => k === 0 || x === r.seq[k - 1] + 1);
  const khopKe = r.labels.every((l, k) => l === ke[r.seq[k]]);
  const quaCauHoi = r.seq.includes(q0 + 1);
  return { dat: !r.sanHien && !r.bat && dayDu && khopKe && quaCauHoi, chiTiet: { ...r, dayDu, khopKe, quaCauHoi } };
};

// T15: dung luc cho cau 3, tu lam cau 3 tren luoi, Giang tiep -> cau 4
KIEM.T15 = async (t) => {
  await t.moBai();
  const q0 = await nhipDau(t, 'quiz');
  const j = q0 + 2;
  await t.ev(`__moPhong.datDen(null)`);
  await t.ev(`__lecture.startFrom(${j}).then(() => true)`);
  const vao = await t.cho(`(__motion.trangThai() || {}).che === 'cho'`, 120000, 100);
  await sleep(300);
  await t.bam('#autoLectureBtn');   // tam dung
  await t.cho(`__lecture.state().lectureState === 'PAUSED'`, 3000);
  const tl = await traLoiCho(t, j, true);
  await sleep(600);
  await t.bam('#autoLectureBtn');   // giang tiep
  const toi = await t.cho(`(() => { const i = __lecture.index(); return __lecture.state().lectureState === 'PLAYING' && i >= 0 ? i : null; })()`, 5000, 50);
  await sleep(300);
  const i = await t.ev(`__lecture.index()`);
  await dungGiang(t);
  return { dat: !!vao && !!(tl && tl.r) && i === j + 1, chiTiet: { cau3: j, vaoCho: !!vao, traLoi: tl && tl.k, nhipSauGiangTiep: i, toi } };
};

// ------------------------------------------------------------------ bo sung v2 (motion-spec-bo-sung.md §D)
/**
 * Duyet moi dang nhip o mot co man hinh: giua nhip, luc cho (quiz), sau khi tra loi sai, khung cuoi (khoang nghi),
 * the chuong, the ket bai. Moi mau: __kt.v2Nay() = { a1 (the phu), a2 (chu lac), a4 (chu trung) } + anh -> anh-v2/.
 * Ket qua giu lai theo co man hinh (A1 / A2 / A4 / ANH dung chung mot lan duyet).
 */
const V2CACHE = {};
async function duyetV2(t, w, h) {
  const khoa = `${w}x${h}`;
  if (V2CACHE[khoa]) return V2CACHE[khoa];
  await t.moBai({ w, h });
  await t.ev(`__kt.doV2 = true`);
  const beats = await t.ev(`__lecture.beats().map(b => ({ kind: b.kind, id: b.targetId || null }))`);
  const lay = (k) => beats.findIndex((b) => b.kind === k);
  const ex1 = beats.findIndex((b) => b.id === 'ex-n5-l1-s1-1');
  const DS = [['vocab', lay('vocab')], ['kanji', lay('kanji')], ['grammar-intro', lay('grammar-intro')], ['example', ex1 >= 0 ? ex1 : lay('example')],
    ['kaiwa-intro', lay('kaiwa-intro')], ['kaiwa-run', lay('kaiwa-run')], ['kaiwa', lay('kaiwa')], ['quiz', lay('quiz')]];
  const canh = [];
  const can = (ten) => !TUY.loai || TUY.loai.includes(ten);
  const tuMoc = (ten, i) => `(() => { const d = __kt.dong.filter(x => x.ten === ${JSON.stringify(ten)} && x.i === ${i}).pop(); return d ? performance.now() - d.luc + 0.001 : null; })()`;
  for (const [ten, i] of DS) {
    if (i < 0 || !can(ten)) continue;
    const r = { ten, i, anh: [] };
    try {
      await dungGiang(t);
      await t.ev(`__kt.raCanh.length = 0`);
      await t.ev(`__moPhong.datDen(${i})`);
      await t.ev(`__lecture.startFrom(${i}).then(() => true)`);
      await t.cho(`(__motion.trangThai() || {}).che === 'giang'`, 8000);
      await sleep(ten === 'kaiwa-run' ? 5000 : 2400);
      r.giua = await t.ev(`__kt.v2Nay()`);
      r.anh.push(path.basename(await t.chupV2(`${khoa}-${ten}-giua.png`)));
      await t.cho(`__moPhong.daDung || __lecture.state().lectureState !== 'PLAYING' || (__motion.trangThai() || {}).che === 'cho'`, 240000, 200);
      if ((await t.ev(`(__motion.trangThai() || {}).che`)) === 'cho') {
        await sleep(900);
        r.cho = await t.ev(`__kt.v2Nay()`);
        r.anh.push(path.basename(await t.chupV2(`${khoa}-${ten}-cho.png`)));
        await traLoiCho(t, i, false);   // sai: phan hoi + dap an dung hien trong the
        await sleep(1600);
        r.traLoi = await t.ev(`__kt.v2Nay()`);
        r.anh.push(path.basename(await t.chupV2(`${khoa}-${ten}-tra-loi-sai.png`)));
      }
      await t.cho(`__moPhong.daDung || __lecture.state().lectureState !== 'PLAYING'`, 120000, 200);
      r.cuoi = await t.ev(`(__kt.raCanh.filter(x => x.i === ${i} && x.v2 && x.khi === 'khoang-nghi').pop() || {}).v2 || null`);
    } catch (e) { r.loi = String(e).slice(0, 300); }
    canh.push(r);
  }
  // The chuong (tu vung cuoi -> Chu Han): ~1 s vao khoang nghi 1600 ms
  const kj = lay('kanji');
  if (kj > 0 && can('the-chuong')) {
    const r = { ten: 'the-chuong', i: kj - 1, anh: [] };
    try {
      await dungGiang(t);
      await t.ev(`__moPhong.datDen(${kj - 1})`);
      await t.ev(`__lecture.startFrom(${kj - 1}).then(() => true)`);
      const da = await t.cho(tuMoc('khiHetNhip', kj - 1), 120000, 40);
      if (da != null) {
        await sleep(Math.max(0, 1000 - da));
        r.giua = await t.ev(`__kt.v2Nay()`);
        r.anh.push(path.basename(await t.chupV2(`${khoa}-the-chuong.png`)));
      }
      await t.cho(`__moPhong.daDung || __lecture.state().lectureState !== 'PLAYING'`, 30000, 200);
    } catch (e) { r.loi = String(e).slice(0, 300); }
    canh.push(r);
  }
  // The ket bai (cau hoi cuoi, tra loi dung): ~1.2 s vao khoang 5000 ms (KET_BAI_MS)
  if (can('the-ket-bai')) {
    const cuoi = beats.length - 1;
    const r = { ten: 'the-ket-bai', i: cuoi, anh: [] };
    try {
      await dungGiang(t);
      await t.ev(`__moPhong.datDen(null)`);
      await t.ev(`__lecture.startFrom(${cuoi}).then(() => true)`);
      if (await t.cho(`(__motion.trangThai() || {}).che === 'cho'`, 120000, 100)) {
        await sleep(500);
        await traLoiCho(t, cuoi, true);
        const da = await t.cho(tuMoc('khiHetNhip', cuoi), 30000, 40);
        if (da != null) {
          await sleep(Math.max(0, 1200 - da));
          r.giua = await t.ev(`__kt.v2Nay()`);
          r.anh.push(path.basename(await t.chupV2(`${khoa}-the-ket-bai.png`)));
        }
      }
      await t.cho(`__lecture.state().lectureState !== 'PLAYING'`, 8000, 100);
    } catch (e) { r.loi = String(e).slice(0, 300); }
    canh.push(r);
  }
  V2CACHE[khoa] = { w, h, canh };
  return V2CACHE[khoa];
}
const mauV2 = (c) => [['giua', c.giua], ['cho', c.cho], ['traLoi', c.traLoi], ['cuoi', c.cuoi]].filter(([, v]) => v && !v.loi);
const MAN_V2 = [[1440, 900, 0.55], [390, 844, 0.70]].filter(([w, h]) => !TUY.man || TUY.man.some(([a, b]) => a === w && b === h));

// A1: the trinh bay phu >= 55% hop noi dung san khau (1440x900), >= 70% (390x844), moi dang nhip
KIEM.A1 = async (t) => {
  const kq = {}; let dat = true;
  for (const [w, h, nguong] of MAN_V2) {
    const d = await duyetV2(t, w, h);
    const ds = d.canh.filter((c) => !/^the-/.test(c.ten)).map((c) => {
      const mau = mauV2(c).filter(([, v]) => v.a1 && v.a1.coSanKhau);
      const thap = mau.filter(([, v]) => !(v.a1.tiLe >= nguong)).map(([k, v]) => ({ k, tiLe: v.a1.tiLe, the: v.a1.the, hop: v.a1.hop, coThe: v.a1.coThe }));
      return { ten: c.ten, tiLe: mau.map(([k, v]) => k + ':' + v.a1.tiLe), dat: !c.loi && mau.length > 0 && thap.length === 0, thap, loi: c.loi };
    });
    kq[`${w}x${h}`] = { nguong, canh: ds };
    if (!ds.length || !ds.every((x) => x.dat)) dat = false;
  }
  await t.coManHinh(TUY.w, TUY.h);
  return { dat, chiTiet: kq };
};

// A2: moi chu hien tren san khau nam trong .sk-the, dong tieu de ngay tren the, hoac .sk-phim
KIEM.A2 = async (t) => {
  const kq = {}; let dat = true;
  for (const [w, h] of MAN_V2) {
    const d = await duyetV2(t, w, h);
    const ds = d.canh.map((c) => {
      const mau = [...mauV2(c)].filter(([, v]) => v.a2 && v.a2.coSanKhau);
      const lac = mau.filter(([, v]) => v.a2.soLac > 0).map(([k, v]) => ({ k, soLac: v.a2.soLac, lac: v.a2.lac.slice(0, 6), coThe: v.a2.coThe }));
      return { ten: c.ten, soMau: mau.length, dat: !c.loi && mau.length > 0 && lac.length === 0, lac, loi: c.loi };
    });
    kq[`${w}x${h}`] = ds;
    if (!ds.every((x) => x.dat)) dat = false;
  }
  await t.coManHinh(TUY.w, TUY.h);
  return { dat, chiTiet: kq };
};

// A4: khong chuoi >= 12 ky tu nao hien hai lan tren san khau (ke ca chuoi nam trong chuoi khac, vd meo + "Sensei ghi")
KIEM.A4 = async (t) => {
  const kq = {}; let dat = true;
  for (const [w, h] of MAN_V2) {
    const d = await duyetV2(t, w, h);
    const ds = d.canh.map((c) => {
      const mau = mauV2(c).filter(([, v]) => v.a4 && v.a4.coSanKhau);
      const trung = mau.filter(([, v]) => v.a4.soTrung > 0).map(([k, v]) => ({ k, soTrung: v.a4.soTrung, trung: v.a4.trung.slice(0, 5) }));
      return { ten: c.ten, soMau: mau.length, dat: !c.loi && mau.length > 0 && trung.length === 0, trung, loi: c.loi };
    });
    kq[`${w}x${h}`] = ds;
    if (!ds.every((x) => x.dat)) dat = false;
  }
  await t.coManHinh(TUY.w, TUY.h);
  return { dat, chiTiet: kq };
};

// A3: em diu — <= 2 hoat anh chay trong .sk-the (tru con tro doc); khong ai animate scale (tru chip tro tu);
// vao nhip (chuyen nhip thuong) = dung MOT hoat anh cap the, 0 hoat anh noi dung trong 450 ms dau
KIEM.A3 = async (t) => {
  await t.moBai();
  await t.ev(`__kt.doV2 = true`);
  const beats = await t.ev(`__lecture.beats().map(b => b.kind)`);
  const idx = (k) => beats.indexOf(k);
  const doan = TUY.doan ? [TUY.doan] : [[0, 2], [idx('kanji') - 1, idx('kanji') + 1], [idx('grammar-intro'), idx('grammar-intro') + 2],
    [idx('kaiwa-run'), idx('kaiwa-run') + 1], [idx('quiz'), idx('quiz') + 1]].filter(([a]) => a >= 0);
  for (const [tu, den] of doan) { await dungGiang(t); await chayDoan(t, tu, den, { traLoi: 'sai', hanMs: 300000 }); }
  await dungGiang(t);
  const v = await t.ev(`__kt.v2.a3`);
  const vao = v.vao.filter((x) => !x.tuTat);
  const vaoSai = vao.filter((x) => !(x.coThe && x.soTheVao === 1 && x.noiDung === 0));
  const dat = v.mau > 0 && v.max <= 2 && v.scale.length === 0 && vao.length > 0 && vaoSai.length === 0;
  return { dat, chiTiet: { doan, soMau: v.mau, dongThoiMax: v.max, qua2: v.qua2.slice(0, 10), scale: v.scale.slice(0, 12), scaleBay: (v.scaleBay || []).slice(0, 6), soScaleBay: (v.scaleBay || []).length,
    soVao: vao.length, vaoSai: vaoSai.slice(0, 12), vaoMau: vao.slice(0, 4), batDauGiangTiep: v.vao.filter((x) => x.tuTat).slice(0, 6) } };
};

// A5: luc cho, #card-<id> that nam trong .sk-the; ra cho / tam dung -> ve dung cho cu (cung previousSibling /
// nextSibling), khong id trung; phan hoi tra loi phat trong the san khau
KIEM.A5 = async (t) => {
  await t.moBai();
  const q0 = await nhipDau(t, 'quiz');
  await t.ev(`__moPhong.datDen(null)`);
  await t.ev(`__lecture.startFrom(${q0}).then(() => true)`);
  const kq = { cau1: {}, cau2: {} };
  // Cau 1: cho -> tra loi dung -> "Tiếp tục" (hoac tu sang) -> raCho
  kq.cau1.vao = !!(await t.cho(`(__motion.trangThai() || {}).che === 'cho' && __lecture.index() === ${q0}`, 120000, 100));
  await sleep(900);
  kq.cau1.luc900 = await t.ev(`__kt.a5Nay(${q0})`);
  const tl = await traLoiCho(t, q0, true);
  kq.cau1.bamDapAn = !!(tl && tl.r);
  await sleep(1200);
  kq.cau1.sauTraLoi = await t.ev(`__kt.a5Nay(${q0})`);
  const nut = await t.cho(`[...document.querySelectorAll('#sanKhauGiang button')].some(b => /Tiếp tục/.test(b.textContent) && !b.closest('[id^="card-"]'))`, 3000, 50);
  kq.cau1.nutTiep = !!nut;
  if (nut) await t.bam(`=[...document.querySelectorAll('#sanKhauGiang button')].find(b => /Tiếp tục/.test(b.textContent) && !b.closest('[id^="card-"]'))`);
  await t.cho(`(() => { const x = __kt.a5Nay(${q0}); return x && x.ra; })()`, 10000, 50);
  await sleep(600);
  kq.cau1.sauRa = await t.ev(`__kt.a5Nay(${q0})`);
  // Cau 2: cho -> Tam dung (nut that) -> the ve luoi
  kq.cau2.vao = !!(await t.cho(`(__motion.trangThai() || {}).che === 'cho' && __lecture.index() === ${q0 + 1}`, 120000, 100));
  await sleep(900);
  kq.cau2.luc900 = await t.ev(`__kt.a5Nay(${q0 + 1})`);
  await t.bam('#autoLectureBtn');
  await sleep(600);
  kq.cau2.sauDung = await t.ev(`__kt.a5Nay(${q0 + 1})`);
  kq.cuonSan = await t.ev(`__kt.cuonSan.slice(0, 8)`);
  kq.lechStage = await t.ev(`__kt.v2.lechStage`);
  await dungGiang(t);
  const trongThe = (x) => !!(x && (x.trongThe700 || x.trongTheNay));
  const ve = (x) => !!(x && x.coGoc && x.ve400 && x.oChoNay && !x.conTrongSan400);
  const khongTrung = (x) => !!(x && !(x.trung700 || []).length && !(x.trungNay || []).length && !(x.trung400 || []).length);
  const loi = [];
  if (!kq.cau1.vao || !trongThe(kq.cau1.luc900)) loi.push('cau 1: the that khong nam trong .sk-the luc cho');
  if (!(kq.cau1.sauTraLoi && kq.cau1.sauTraLoi.trongTheNay)) loi.push('cau 1: phan hoi khong o trong the san khau');
  if (!ve(kq.cau1.sauRa)) loi.push('cau 1: raCho khong tra the ve cho cu');
  if (!khongTrung(kq.cau1.sauRa)) loi.push('cau 1: id trung');
  if (!kq.cau2.vao || !trongThe(kq.cau2.luc900)) loi.push('cau 2: the that khong nam trong .sk-the luc cho');
  if (!ve(kq.cau2.sauDung)) loi.push('cau 2: tamDung khong tra the ve cho cu');
  if (!khongTrung(kq.cau2.sauDung)) loi.push('cau 2: id trung');
  if (kq.lechStage) loi.push('.deck-stage bi cuon lech: ' + kq.lechStage);
  return { dat: loi.length === 0, loi, chiTiet: kq };
};

// ANH: anh chup cho buoi duyet thiet ke (1440x900 + 390x844, moi dang nhip + cho + the chuong / ket bai)
KIEM.ANH = async (t) => {
  const kq = {};
  for (const [w, h] of MAN_V2) { const d = await duyetV2(t, w, h); kq[`${w}x${h}`] = d.canh.map((c) => ({ ten: c.ten, anh: c.anh, loi: c.loi })); }
  await t.coManHinh(TUY.w, TUY.h);
  const soAnh = Object.values(kq).flat().reduce((n, c) => n + c.anh.length, 0);
  return { dat: soAnh > 0, chiTiet: { thuMuc: ANH_V2, soAnh, ...kq } };
};

// KB (polish D): the ket bai -> init.khiKetBai(dich) cho nut tren the (A): chi nhan khi the ket bai dang hien;
// 'phat-am' xong bai ngay + nhay Phat am sau khi san khau mo het; 'xem-lai' xong bai, luoi o yen. SenseiMotion GIA.
KIEM.KB = async (t) => {
  const kq = {}, loi = [];
  const goiKB = (d) => t.ev(`(() => { const f = SenseiMotion._o && SenseiMotion._o.khiKetBai; return typeof f === 'function' ? f(${JSON.stringify(d)}) : 'khong-co'; })()`);
  for (const dich of ['phat-am', 'xem-lai']) {
    const r = {};
    // trang moi moi luot: cau hoi cuoi chua tra loi (da tra loi thi nhip bai tap khong cho)
    await t.moBai({ gia: true });
    const cuoi = await t.ev(`__lecture.beats().length - 1`);
    await t.ev(`__moPhong.datDen(null)`);
    await t.ev(`__lecture.startFrom(${cuoi}).then(() => true)`);
    await t.cho(`__lecture.state().lectureState === 'PLAYING'`, 8000);
    await sleep(600);
    r.giuaNhip = await goiKB(dich);   // chua toi the ket bai -> false, khong doi gi
    r.stGiua = await t.ev(`__lecture.state().lectureState`);
    const n0 = await t.ev(`(window.__goiSK || []).length`);
    const vao = await t.cho(`(window.__goiSK || []).slice(${n0}).some(g => g.ten === 'vaoCho')`, 90000, 100);
    await t.ev(`(() => { window.__ktBamPhatAm = null; const n = document.querySelector('#slideContent [data-qz-toi="qz-phat-am"]');
      if (n) n.addEventListener('click', () => { window.__ktBamPhatAm = { luc: performance.now(), st: __lecture.state().lectureState }; }, { once: true }); return !!n; })()`);
    await sleep(300);
    if (vao) await traLoiCho(t, cuoi, true);
    const het = await t.cho(`(window.__goiSK || []).slice(${n0}).some(g => g.ten === 'khiHetNhip' && g.a && g.a.tiep === null)`, 20000, 50);
    await sleep(1000);
    const t0 = await t.ev(`performance.now()`);
    r.traVe = await goiKB(dich);
    r.stNgay = await t.ev(`__lecture.state().lectureState`);
    await sleep(900);
    r.bam = await t.ev(`window.__ktBamPhatAm`);
    r.msBam = r.bam ? Math.round(r.bam.luc - t0) : null;
    r.tab = await t.ev(`__slideEngine.activeTab`);
    r.lanHai = await goiKB(dich);   // da xong bai -> false
    kq[dich] = { vao: !!vao, het: !!het, ...r };
    if (r.giuaNhip !== false || r.stGiua !== 'PLAYING') loi.push(`${dich}: khiKetBai giua nhip phai bi bo qua (${r.giuaNhip}, ${r.stGiua})`);
    if (!het || r.traVe !== true || r.stNgay !== 'IDLE') loi.push(`${dich}: khiKetBai luc the ket bai khong xong bai ngay (${r.traVe}, ${r.stNgay})`);
    if (dich === 'phat-am' && !(r.bam && r.bam.st === 'IDLE' && r.msBam >= 200 && r.msBam <= 700)) loi.push(`phat-am: khong nhay Phat am sau khi san khau mo (${JSON.stringify(r.bam)}, ${r.msBam} ms)`);
    if (dich === 'xem-lai' && r.bam) loi.push('xem-lai: van nhay Phat am');
    if (r.lanHai !== false) loi.push(`${dich}: goi lan hai sau khi xong bai phai false`);
  }
  return { dat: loi.length === 0, loi, chiTiet: kq };
};

// RB (polish D): furigana chi nam tren chu Han, okurigana viet thang (準備します -> [準備|じゅんび]します).
// Loi = mot <ruby> ma chu goc bat dau / ket thuc bang kana VA furigana cung bat dau / ket thuc bang kana do
// (furigana trai len ca okurigana), tru khi slideEngine.tachRuby co y giu ca tu (du lieu lech, vd 止めます／辞めます).
// (a) helper rubyCau / rubyTu tren moi token + tu cua bai; (b) luoi (Tu vung, moi slide Ngu phap, Hoi thoai);
// (c) san khau giang (tu vung / vi du / hoi thoai co okurigana) — ghi theo chu file (D: rubyCau; B / C / A: canh cua ho)
const KT_RUBY = `(() => {
  const KANA = /[\\u3041-\\u3096\\u30a1-\\u30f4\\u30fc]/, HAN = /[\\u3400-\\u9fff\\u3005]/;
  const hira = (s) => s.replace(/[\\u30a1-\\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  window.__ktRubyLech = (goc) => [...goc.querySelectorAll('ruby')].map((r) => {
    const rt = [...r.querySelectorAll('rt')].map((x) => x.textContent).join('');
    const base = [...r.childNodes].filter((n) => !(n.nodeType === 1 && (n.tagName === 'RT' || n.tagName === 'RP'))).map((n) => n.textContent).join('');
    if (!rt || !HAN.test(base)) return null;
    const b = hira(base), d = hira(rt);
    const lech = (KANA.test(base[0]) && b[0] === d[0]) || (KANA.test(base[base.length - 1]) && b[b.length - 1] === d[d.length - 1]);
    if (!lech || __slideEngine.tachRuby(base, rt).length === 1) return null;
    const o = r.closest('[class]');
    return { base, rt, lop: o ? String(o.className).slice(0, 60) : '' };
  }).filter(Boolean);
  return true; })()`;
KIEM.RB = async (t) => {
  const kq = {}, loi = [], chuKhac = [];
  for (const bai of [['N5', 1], ['N4', 30], ['N1', 3]]) {
    const k = bai.join('-');
    await t.moBai({ bai });
    await t.ev(KT_RUBY);
    // (a) helper
    kq[k] = { helper: await t.ev(`(() => {
      const se = __slideEngine, L = se.loader.getLesson(se.currentLevel, se.currentLesson) || {}, h = document.createElement('div');
      let soTok = 0, soTach = 0; const sai = [];
      const quet = (html, nguon) => { h.innerHTML = html; const x = __ktRubyLech(h); x.forEach((y) => sai.push({ ...y, nguon })); if (h.querySelectorAll('ruby').length > 1 || /<\\/ruby>[^<]/.test(html)) soTach++; };
      const cau = (tks, nguon) => (tks || []).forEach((tk, i) => { const rt = se.rtCua(tk); if (!rt) return; soTok++; quet(se.rubyCau(tk, rt, i, tks), nguon); });
      (L.slides || []).forEach((s) => (s.examples || []).forEach((e) => cau(e.tokens, e.id)));
      (L.dialogue || []).forEach((d) => cau(d.tokens, d.id));
      (L.vocabList || []).forEach((v) => { if (v.kanji && v.furigana && v.furigana !== v.kanji) { soTok++; quet(se.rubyTu(v.kanji, v.furigana), v.id); } });
      return { soTok, soTach, sai: sai.slice(0, 12), soSai: sai.length };
    })()`) };
    // (b) luoi
    const luoi = [];
    const quetLuoi = async (tab, sub) => {
      await t.ev(`__slideEngine.setTab(${JSON.stringify(tab)}${sub != null ? ', ' + sub : ''})`);
      await sleep(350);
      const x = await t.ev(`__ktRubyLech(document.getElementById('slideContent'))`);
      x.forEach((y) => luoi.push({ tab, sub, ...y }));
    };
    await quetLuoi('vocab');
    await t.chup(`RB-${k}-luoi-tu-vung.png`);
    const soSlide = await t.ev(`((__slideEngine.loader.getLesson(__slideEngine.currentLevel, __slideEngine.currentLesson) || {}).slides || []).length`);
    for (let s = 0; s < soSlide; s++) await quetLuoi('grammar', s);
    await quetLuoi('kaiwa');
    kq[k].luoi = { soSai: luoi.length, sai: luoi.slice(0, 12) };
    await t.chup(`RB-${k}-luoi.png`);
    // (c) san khau: nhip dau tien co okurigana cua moi dang
    const nhip = await t.ev(`(() => { const b = __lecture.beats(), se = __slideEngine;
      const tron = (c, r) => c && r && se.tachRuby(c, r).length > 1;
      const tk = (x) => (x.data && x.data.tokens || []).some((t) => tron(t.kanji, se.rtCua(t)));
      return { vocab: b.findIndex((x) => x.kind === 'vocab' && x.data && tron(x.data.kanji, x.data.furigana !== x.data.kanji ? x.data.furigana : '')),
        example: b.findIndex((x) => x.kind === 'example' && tk(x)), kaiwa: b.findIndex((x) => x.kind === 'kaiwa' && tk(x)) }; })()`);
    kq[k].san = {};
    for (const [loai, i] of Object.entries(nhip)) {
      if (i < 0) continue;
      await t.ev(`__moPhong.datDen(${i})`);
      await t.ev(`__lecture.startFrom(${i}).then(() => true)`);
      await t.cho(`(__motion.trangThai() || {}).che === 'giang'`, 8000);
      await sleep(2500);
      const x = await t.ev(`__ktRubyLech(document.getElementById('sanKhauGiang'))`);
      // chu file: token cau (rubyCau cua D) nam trong .sk-vd-tok / .sk-ht-tok; chu dau tu vung .sk-tv-tu (B), o mau (B), canh chung (A)
      const chu = (y) => (/sk-tv-tu/.test(y.lop) ? 'B (motion-canh-chu.js dungTuVung: chu dau)' : /sk-np|sk-vd-dien|sk-vd-mau/.test(y.lop) ? 'B (motion-canh-chu.js noiDung: o mau)'
        : /sk-c-/.test(y.lop) ? 'A (motion.js canh chung)' : 'D (rubyCau)');
      kq[k].san[loai] = { i, sai: x.map((y) => ({ ...y, chu: chu(y) })) };
      await t.chup(`RB-${k}-san-${loai}.png`);
      await dungGiang(t);
      await t.ev(`__moPhong.datDen(null)`);
    }
    if (kq[k].helper.soSai) loi.push(`${k} helper: ${kq[k].helper.soSai} ruby trum okurigana`);
    if (kq[k].luoi.soSai) loi.push(`${k} luoi: ${kq[k].luoi.soSai} ruby trum okurigana`);
    for (const [loai, v] of Object.entries(kq[k].san)) {
      const cuaD = v.sai.filter((y) => /^D/.test(y.chu)), khac = v.sai.filter((y) => !/^D/.test(y.chu));
      if (cuaD.length) loi.push(`${k} san khau ${loai}: ${cuaD.length} ruby trum okurigana (rubyCau)`);
      khac.forEach((y) => chuKhac.push({ bai: k, loai, ...y }));
    }
  }
  return { dat: loi.length === 0, loi, chiTiet: { ...kq, chuKhac } };
};

// R1D: hoi quy loi vong 1 cua D — (a) luc nghi doi tab van co hieu ung 200 ms (§0.1.8); (b) meo KHONG chi tay
// tu focusItem khi san khau dang giang (chi doi mat); (c) toast "Đã tạm dừng tại…" / "Đã hủy câu hỏi" khong con
// de len dong dau san khau khi giang tiep; (d) body.vua-dung-giang ~1 s roi tu go; (e) ?khongSanKhau: khong gan lop do
KIEM.R1D = async (t) => {
  const kq = {}, loi = [];
  const soAnimTrongLuoi = `document.getAnimations().filter(a => a.playState === 'running' && a.effect && a.effect.target && document.getElementById('slideContent').contains(a.effect.target)).length`;
  // (a)
  await t.moBai();
  await t.bam('#tabKanjiBtn');
  kq.nghiDoiTab = await t.ev(`new Promise(r => requestAnimationFrame(() => r({ lop: document.getElementById('slideContent').className, chay: ${soAnimTrongLuoi} })))`);
  if (!/slide-fade-enter/.test(kq.nghiDoiTab.lop) || !kq.nghiDoiTab.chay) loi.push('(a) luc nghi doi tab mat hieu ung vao: ' + JSON.stringify(kq.nghiDoiTab));
  // (b)
  await t.moBai();
  const boc = await t.ev(`(() => { const av = window.SenseiAvatar; const g = window.__ktChi = []; if (!av) return false;
    for (const ten of ['chiVao', 'bamVao', 'khiRoiMuc', 'camXuc']) { const f = av[ten]; if (typeof f !== 'function') continue;
      av[ten] = function (...a) { if (document.body.classList.contains('dang-giang')) g.push({ ten, tu: (new Error().stack || '').split('\\n').slice(2, 4).map(s => s.trim().replace(/https?:\\/\\/[^/]+\\//, '')).join(' < ') }); return f.apply(this, a); }; }
    return true; })()`);
  const doan = await t.ev(`(() => { const b = __lecture.beats(); const f = (k) => b.findIndex(x => x.kind === k); return { vocab: 0, kanji: f('kanji'), kaiwa: f('kaiwa') }; })()`);
  for (const [k, i] of Object.entries(doan)) if (i >= 0) { await chayDoan(t, i, i + 1, { hanMs: 60000 }); await dungGiang(t); }
  const goi = await t.ev(`window.__ktChi || []`);
  const tuSe = goi.filter((g) => /slide-engine\.js/.test(g.tu) && /chiVao|bamVao|khiRoiMuc/.test(g.ten));
  kq.meo = { bocDuoc: boc, doan, soGoi: goi.length, theoTen: goi.reduce((o, g) => { o[g.ten] = (o[g.ten] || 0) + 1; return o; }, {}),
    chiTuSlideEngine: tuSe.length, chiNoiKhac: goi.filter((g) => /chiVao|bamVao/.test(g.ten) && !/slide-engine\.js/.test(g.tu)).slice(0, 6) };
  if (!boc) loi.push('(b) khong boc duoc SenseiAvatar');
  if (tuSe.length) loi.push('(b) focusItem van chi tay khi dang giang: ' + tuSe.length);
  // (c) + (d)
  await t.moBai();
  await t.ev(`__moPhong.datDen(null)`);
  await t.ev(`__lecture.startFrom(1).then(() => true)`);
  await t.cho(`(__motion.trangThai() || {}).che === 'giang'`, 8000);
  await sleep(1500);
  await t.bam('#autoLectureBtn');   // tam dung (nut) -> toast
  await sleep(200);
  const c = { toastSauDung: await t.ev(`document.querySelectorAll('#toastHost .toast:not(.is-out)').length`),
    vuaDung: await t.ev(`document.body.classList.contains('vua-dung-giang')`) };
  await sleep(300);
  await t.bam('#autoLectureBtn');   // giang tiep trong 4,2 s
  await t.cho(`(__motion.trangThai() || {}).che === 'giang'`, 8000);
  await sleep(500);
  c.toastSauGiangTiep = await t.ev(`document.querySelectorAll('#toastHost .toast').length`);
  await sleep(1200);
  c.vuaDungSau2s = await t.ev(`document.body.classList.contains('vua-dung-giang')`);
  // gio tay roi huy -> giang tiep: khong toast "Đã hủy câu hỏi" de len
  await t.bam('#raiseHandBtn');
  await sleep(600);
  await t.bam('#askCancelBtn');
  await t.cho(`(__motion.trangThai() || {}).che === 'giang'`, 8000);
  await sleep(500);
  c.toastSauHuyHoi = await t.ev(`[...document.querySelectorAll('#toastHost .toast:not(.is-out)')].map(e => e.textContent.trim())`);
  await dungGiang(t);
  kq.toast = c;
  if (!c.toastSauDung) loi.push('(c) tam dung bang nut khong con toast (mong doi co)');
  if (c.toastSauGiangTiep) loi.push('(c) toast con de len san khau sau giang tiep: ' + c.toastSauGiangTiep);
  if (c.toastSauHuyHoi.length) loi.push('(c) toast sau huy cau hoi: ' + JSON.stringify(c.toastSauHuyHoi));
  if (!c.vuaDung || c.vuaDungSau2s) loi.push('(d) vua-dung-giang sai: ' + JSON.stringify(c));
  // (e)
  await t.moBai({ them: '&khongSanKhau', gia: false });
  await t.ev(`__lecture.startFrom(1).then(() => true)`);
  await t.cho(`__lecture.state().lectureState === 'PLAYING'`, 8000);
  await sleep(1500);
  await t.bam('#tabKanjiBtn');
  kq.tatSanKhau = await t.ev(`new Promise(r => requestAnimationFrame(() => r({ vuaDung: document.body.classList.contains('vua-dung-giang'),
    lop: document.getElementById('slideContent').className, st: __lecture.state().lectureState, chay: ${soAnimTrongLuoi} })))`);
  if (kq.tatSanKhau.vuaDung || !/slide-fade-enter/.test(kq.tatSanKhau.lop)) loi.push('(e) khongSanKhau bi doi hanh vi: ' + JSON.stringify(kq.tatSanKhau));
  return { dat: loi.length === 0, loi, chiTiet: kq };
};

// T14 tinh tu nhat ky console cua ca lan chay (chay cuoi cung)
function kiemConsole(t) {
  const loi = t.log.filter((x) => x.loai === 'exception' || x.loai === 'error');
  const canhBao = t.log.filter((x) => x.loai === 'warning' && /\[motion\]/.test(x.text));
  const net = t.log.filter((x) => x.loai === 'log-error');
  return { dat: loi.length === 0 && canhBao.length <= 5, chiTiet: { soLoi: loi.length, loi: loi.slice(0, 15), canhBaoMotion: canhBao.length, mauCanhBao: canhBao.slice(0, 5), loiMang: net.slice(0, 10) } };
}

// ------------------------------------------------------------------ chay
if (TUY.lietKe) {
  console.log(JSON.stringify({ baiKiem: [...Object.keys(KIEM), 'T14'].sort((a, b) => a.localeCompare(b, 'en', { numeric: true })) }, null, 2));
  process.exit(0);
}
const khongCo = TUY.ten.filter((x) => !KIEM[x] && x !== 'T14');
if (khongCo.length) console.error('[kiem-thu] khong co bai kiem: ' + khongCo.join(', ') + ' (xem --liet-ke)');
const tongKet = { batDau: new Date().toISOString(), tuy: TUY, ketQua: [] };
let chrome = null;
try {
  const goc = await moServer();
  chrome = await moChrome();
  const t = new Trang(chrome.cdp, goc);
  await t.batDau();
  tongKet.goc = goc;
  for (const ten of TUY.ten) {
    if (ten === 'T14') continue;
    const f = KIEM[ten];
    if (!f) { tongKet.ketQua.push({ ten, dat: null, loi: 'khong co bai kiem nay' }); continue; }
    const t0 = Date.now();
    const soLog = t.log.length;
    const hh0 = t.hetHan || 0;
    let kq;
    try { kq = await f(t); } catch (e) { kq = { dat: false, loi: String(e && e.stack || e).slice(0, 1500) }; }
    // chayDoan het han (cat ngang lan chay) -> hien ngay o tong ket, khong chi trong console cua bao cao
    const hetHan = (t.hetHan || 0) - hh0 || undefined;
    // lan chay bi cat ngang = chua phu het pham vi -> khong duoc tinh la dat
    if (hetHan && kq.dat) kq = { ...kq, dat: false, loi: [...(Array.isArray(kq.loi) ? kq.loi : kq.loi ? [String(kq.loi)] : []), 'chayDoan het han ' + hetHan + ' lan (xem harness): pham vi chua chay het'] };
    const bc = { ten, dat: kq.dat, giay: Math.round((Date.now() - t0) / 1000), url: t.url, hetHan, loi: kq.loi, chiTiet: kq.chiTiet,
      harness: t.log.slice(soLog).filter((x) => x.loai === 'harness').slice(0, 10),
      console: t.log.slice(soLog).filter((x) => x.loai !== 'log' && x.loai !== 'info' && x.loai !== 'debug').slice(0, 40) };
    const tep = path.join(KQ, `${ten}-${gio()}.json`);
    fs.writeFileSync(tep, JSON.stringify(bc, null, 2));
    tongKet.ketQua.push({ ten, dat: kq.dat, giay: bc.giay, tep, hetHan, loi: Array.isArray(kq.loi) ? kq.loi : kq.loi ? String(kq.loi).slice(0, 300) : undefined });
  }
  if (TUY.ten.includes('T14')) {
    const k = kiemConsole(t);
    const tep = path.join(KQ, `T14-${gio()}.json`);
    fs.writeFileSync(tep, JSON.stringify({ ten: 'T14', ...k }, null, 2));
    tongKet.ketQua.push({ ten: 'T14', dat: k.dat, tep });
  }
} catch (e) {
  tongKet.loi = String(e && e.stack || e);
} finally {
  if (chrome) await chrome.dong();
  await donDep();
  // Ho so Chrome tam cua lan chay nay (trong thu muc lam viec cua D) — xoa cho gon
  if (chrome && chrome.prof && chrome.prof.startsWith(VIEC)) {
    for (let i = 0; i < 5; i++) { try { fs.rmSync(chrome.prof, { recursive: true, force: true }); break; } catch { await sleep(400); } }
  }
}
tongKet.xong = new Date().toISOString();
const tepTong = path.join(KQ, `tong-${gio()}.json`);
fs.writeFileSync(tepTong, JSON.stringify(tongKet, null, 2));
console.log(JSON.stringify({ ...tongKet, tepTong }, null, 2));
process.exit(0);
