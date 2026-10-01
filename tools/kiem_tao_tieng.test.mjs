// Kiem thu cong cu "Tao tieng Sensei cho video demo" (js/tao-tieng-demo.js) trong Chrome headless THAT, KHONG goi Gemini:
//   node tools/kiem_tao_tieng.test.mjs [--giu]     (anh chup + zip vao E:/sensei-tam/tmp/kiem-tao-tieng)
// Cong 3500-3599 (http.server + khong mo cong CDP: --remote-debugging-pipe), ho so Chrome rieng, TEMP/TMP = E:/sensei-tam/tmp,
// env.js / .env bi chan, khoa gia TESTKEY_... chen bang addScriptToEvaluateOnNewDocument.
//   A  khong khoa: hien thong bao tieng Viet, nut Tao tat ca bi khoa
//   B  bo tong hop gia (am thanh tong hop, do dai ngau nhien co hat giong): Tao tat ca / Dung / chay tiep, thu lai toi da 2 lan,
//      dong loi khong chan cac dong khac, khoang nghi 800 ms, Tao lai dong nay, so do cat im lang / chuan hoa, nut Tai zip,
//      kiem zip trong Node (cau truc, CRC32, 21 WAV, manifest), nap kich ban khac qua <input file>
//   C  duong THAT cua VoiceActorPool voi WebSocket gia: giong Charon, model chinh hong -> du phong, ACTOR_BRIEF, mot phien mot luc,
//      loi co chua khoa duoc che
//   D  tai lai trang: tiep tuc tu bo nho IndexedDB 'sensei_tts' (khong goi lai WebSocket cho dong da xong)
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TAM = 'E:/sensei-tam/tmp';
const RA = path.join(TAM, 'kiem-tao-tieng');
const KICH_BAN = 'E:/sensei-tam/demo2/kich-ban.json';
const KHOA_GIA = 'TESTKEY_abcdefghijklmnop_NOTREAL';
const giu = process.argv.includes('--giu');
const ngu = (ms) => new Promise(r => setTimeout(r, ms));

const bang = [];
const kt = (nhom, ten, ok, chiTiet = '') => { bang.push({ nhom, ten, ok: !!ok, chiTiet: String(chiTiet) }); };

// ------------------------------------------------------------------ ha tang Chrome (cong 3500-3599)
function giet(pid) {
  return new Promise(r => { const k = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' }); k.on('exit', () => r()); k.on('error', () => r()); });
}
async function congTrong(a = 3500, b = 3599) {
  for (let i = 0; i < 80; i++) {
    const p = a + Math.floor(Math.random() * (b - a + 1));
    const ok = await new Promise(r => { const s = net.createServer(); s.once('error', () => r(false)); s.listen(p, '127.0.0.1', () => s.close(() => r(true))); });
    if (ok) return p;
  }
  throw new Error('het cong 3500-3599');
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

// Chen truoc moi tai trang: khoa gia (tru khi ?tt=nokey), WebSocket gia (khi ?tt=ws), bo sinh am nguyen am gia
const CHEN = String.raw`(() => {
  const f = (new URLSearchParams(location.search).get('tt') || '').split(',');
  if (!f.includes('nokey')) window.SENSEI_ENV = { key1: '${KHOA_GIA}', key2: '' };
  window.__bomUrl = [];
  const oc = URL.createObjectURL.bind(URL);
  URL.createObjectURL = (b) => { try { window.__bomUrl.push(b); } catch (e) {} return oc(b); };

  // am thanh gia: im lang dau (nhieu -60 dBFS) + "nguyen am" co formant + im lang cuoi. p: {lead, dur, tail, amp}
  window.__giaAm = function (p) {
    const SR = 24000, n = Math.round((p.lead + p.dur + p.tail) * SR), x = new Float32Array(n);
    let s = 12345; for (let i = 0; i < n; i++) { s = (s * 1664525 + 1013904223) >>> 0; x[i] = ((s / 4294967296) - 0.5) * 0.002; }
    const a0 = Math.round(p.lead * SR), len = Math.round(p.dur * SR), F = [[720, 1200], [300, 2250], [330, 1150], [500, 1850], [480, 850]];
    const tone = new Float32Array(len); let pk = 0;
    for (let j = 0; j < len; j++) {
      const t = j / SR, seg = Math.floor(j / (0.15 * SR)) % 5, f1 = F[seg][0], f2 = F[seg][1], f0 = 118 - 8 * (j / len);
      const env = Math.min(1, j / (0.02 * SR), (len - j) / (0.02 * SR)) * (0.8 + 0.2 * Math.sin(2 * Math.PI * 4 * t));   // dốc 20 ms hai đầu
      let w = 0;
      for (let h = 1; h * f0 < 4000; h++) { const fr = h * f0; w += (Math.exp(-Math.pow((fr - f1) / 110, 2)) + 0.8 * Math.exp(-Math.pow((fr - f2) / 160, 2))) / h * Math.sin(2 * Math.PI * fr * t); }
      tone[j] = env * w; if (Math.abs(tone[j]) > pk) pk = Math.abs(tone[j]);
    }
    for (let j = 0; j < len; j++) x[a0 + j] += tone[j] / pk * p.amp;
    const u8 = new Uint8Array(n * 2), dv = new DataView(u8.buffer);
    for (let i = 0; i < n; i++) dv.setInt16(i * 2, Math.max(-1, Math.min(1, x[i])) * 32767, true);
    return u8;
  };

  if (f.includes('ws')) {
    const L = window.__ws = { mo: 0, toiDaMo: 0, url: [], setup: [], luot: [] };
    const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s); };
    window.WebSocket = class FakeWS {
      constructor(url) {
        this.url = url; this.readyState = 0;
        L.url.push(String(url).replace(/key=[^&]*/, 'key=***')); L.mo++; L.toiDaMo = Math.max(L.toiDaMo, L.mo);
        setTimeout(() => { this.readyState = 1; if (this.onopen) this.onopen({}); }, 5);
      }
      _tra(o) { setTimeout(() => { if (this.readyState === 1 && this.onmessage) this.onmessage({ data: JSON.stringify(o) }); }, 5); }
      send(raw) {
        const m = JSON.parse(raw);
        if (m.setup) {
          L.setup.push({ model: m.setup.model, voice: (((m.setup.generationConfig || {}).speechConfig || {}).voiceConfig || {}).prebuiltVoiceConfig.voiceName, brief: ((m.setup.systemInstruction || {}).parts || [{}])[0].text || '' });
          if (/3\.1-flash/.test(m.setup.model)) { setTimeout(() => this.close(1008, 'model khong duoc phep voi key=${KHOA_GIA}'), 5); return; }
          this._tra({ setupComplete: {} });
        } else if (m.clientContent) {
          const text = m.clientContent.turns[0].parts[0].text;
          L.luot.push({ model: L.setup[L.setup.length - 1].model, text });
          if (text.includes('Hẹn gặp lại')) { this._tra({ error: { message: 'API key khong hop le: key=${KHOA_GIA} AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456' } }); return; }
          const n = text.replace(/^[^\n]*\n/, '').length;
          const pcm = window.__giaAm({ lead: 0.3, dur: Math.min(4, 0.07 * n + 0.4), tail: 0.5, amp: 0.3 });
          const h = pcm.length >> 1;
          this._tra({ serverContent: { modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: b64(pcm.subarray(0, h)) } }] } } });
          setTimeout(() => this._tra({ serverContent: { modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: b64(pcm.subarray(h)) } }] } } }), 12);
          setTimeout(() => this._tra({ serverContent: { turnComplete: true } }), 24);
        }
      }
      close(code, reason) {
        if (this.readyState === 3) return;
        this.readyState = 3; L.mo--;
        setTimeout(() => { if (this.onclose) this.onclose({ code: code || 1000, reason: reason || '' }); }, 0);
      }
    };
  }
})();`;

async function moTrinhDuyet() {
  fs.mkdirSync(RA, { recursive: true });
  process.env.TEMP = TAM; process.env.TMP = TAM;
  const PID = [];
  const port = await congTrong();
  const srv = spawn('python', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: GOC, stdio: 'ignore', windowsHide: true, env: { ...process.env, TEMP: TAM, TMP: TAM } });
  PID.push(srv.pid);
  const goc = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 60; i++) { try { const r = await fetch(goc + '/index.html'); if (r.ok) break; } catch {} await ngu(200); }
  const prof = path.join(TAM, 'prof-taotieng-' + process.pid + '-' + Date.now());
  const chromeP = spawn(CHROME, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--mute-audio',
    '--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
    '--window-size=1440,900', '--remote-debugging-pipe', `--user-data-dir=${prof}`, 'about:blank'],
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
  c.on('Runtime.consoleAPICalled', p => { log.push(p.type + ': ' + p.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 400)); });
  c.on('Runtime.exceptionThrown', p => log.push('EXC: ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text || '').slice(0, 600)));
  c.on('Log.entryAdded', p => { if (p.entry.level === 'error') log.push('LOG error: ' + (p.entry.text + ' ' + (p.entry.url || '')).slice(0, 300)); });
  await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Log.enable'); await c.send('Network.enable'); await c.send('DOM.enable');
  await c.send('Network.setBlockedURLs', { urls: ['*env.js*', '*/.env*'] });
  await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: CHEN });
  const ev = async (expr) => {
    const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true, userGesture: true });
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || r.exceptionDetails.text).slice(0, 600));
    return r.result.value;
  };
  const t = {
    goc, log, ev, c,
    async vao(d) { await c.send('Page.navigate', { url: goc + d }); await ngu(300); },
    async chup(file) {
      const r = await c.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    },
    async cho(dk, ms = 15000, buoc = 100) {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { if (await ev(dk)) return true; } catch {} await ngu(buoc); }
      return false;
    },
    async dong() {
      try { await Promise.race([kn.send('Browser.close'), ngu(1500)]); } catch {}
      for (const p of PID) await giet(p);
    },
  };
  return t;
}

// ------------------------------------------------------------------ tien ich
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const nutBam = (ten) => `[...document.querySelectorAll('#tao-tieng button')].find(b => b.textContent.trim() === ${JSON.stringify(ten)})`;
const bam = (t, ten) => t.ev(`(() => { const b = ${nutBam(ten)}; if (!b || b.disabled) return false; b.click(); return true; })()`);
const bamHang = (t, id, ten) => t.ev(`(() => { const tr = document.querySelector('#tao-tieng tr[data-id="${id}"]'); const b = [...tr.querySelectorAll('button')].find(x => x.textContent.trim() === ${JSON.stringify(ten)}); if (!b || b.disabled) return false; b.click(); return true; })()`);
const dongNgay = (t) => t.ev(`JSON.stringify(TaoTiengDemo.dong)`).then(JSON.parse);
const xongChay = (t, ms = 90000) => t.cho(`(() => { const b = ${nutBam('Dừng')}; const a = ${nutBam('Tạo tất cả')}; return b && b.disabled && a && !a.disabled; })()`, ms, 80);
const dB = (x) => 20 * Math.log10(x);

// ------------------------------------------------------------------ kiem zip trong Node
function kiemZip(buf, kb, thamSo) {
  const loi = [];
  const bao = (ok, m) => { if (!ok) loi.push(m); };
  const eocd = buf.length - 22;
  bao(buf.readUInt32LE(eocd) === 0x06054b50, 'EOCD sai chu ky');
  const n = buf.readUInt16LE(eocd + 10), cdLen = buf.readUInt32LE(eocd + 12), cdOff = buf.readUInt32LE(eocd + 16);
  bao(n === kb.length + 1, `so muc ${n} != ${kb.length + 1}`);
  bao(cdOff + cdLen === eocd, 'thu muc trung tam khong ke EOCD');
  const files = {};
  let p = cdOff;
  for (let i = 0; i < n; i++) {
    bao(buf.readUInt32LE(p) === 0x02014b50, 'central sig #' + i);
    const flags = buf.readUInt16LE(p + 8), method = buf.readUInt16LE(p + 10), crc = buf.readUInt32LE(p + 16);
    const cs = buf.readUInt32LE(p + 20), us = buf.readUInt32LE(p + 24), nl = buf.readUInt16LE(p + 28), el = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    const ten = buf.subarray(p + 46, p + 46 + nl).toString('utf8');
    bao(method === 0 && cs === us, 'khong phai STORE: ' + ten);
    bao((flags & 0x800) !== 0, 'thieu co UTF-8: ' + ten);
    // local header
    bao(buf.readUInt32LE(off) === 0x04034b50, 'local sig ' + ten);
    const lnl = buf.readUInt16LE(off + 26), lel = buf.readUInt16LE(off + 28);
    bao(buf.subarray(off + 30, off + 30 + lnl).toString('utf8') === ten, 'ten local != ten central ' + ten);
    bao(buf.readUInt32LE(off + 14) === crc && buf.readUInt32LE(off + 22) === us, 'crc/size local != central ' + ten);
    const du = buf.subarray(off + 30 + lnl + lel, off + 30 + lnl + lel + us);
    bao(du.length === us, 'cat ngan ' + ten);
    bao(zlib.crc32(du) === crc, 'CRC32 sai: ' + ten);
    files[ten] = du;
    p += 46 + nl + el + cl;
  }
  bao(p === eocd, 'thu muc trung tam doc het khong khop EOCD');
  const manifest = JSON.parse(files['manifest.json'].toString('utf8'));
  bao(manifest.phienBan === 1 && manifest.giong === 'Charon', 'manifest phienBan/giong');
  bao(typeof manifest.model === 'string' && manifest.model.length > 0 && !/key|AIza|TESTKEY/i.test(manifest.model), 'manifest.model: ' + manifest.model);
  bao(manifest.clips.length === kb.length, 'manifest.clips = ' + manifest.clips.length);
  const wav = [];
  manifest.clips.forEach((c, i) => {
    const l = kb[i];
    bao(c.id === l.id && c.text === l.text, 'manifest id/text lech o ' + i);
    bao(c.ketHoach && c.ketHoach.t === l.t && c.ketHoach.dur === l.dur, 'ketHoach lech: ' + c.id);
    bao(c.file === c.id + '.wav' && files[c.file], 'thieu tep ' + c.file);
    const w = files[c.file];
    if (!w) return;
    const dv = new DataView(w.buffer, w.byteOffset, w.length);
    const tag = (o) => w.subarray(o, o + 4).toString('latin1');
    bao(tag(0) === 'RIFF' && tag(8) === 'WAVE' && tag(12) === 'fmt ' && tag(36) === 'data', 'WAV thieu khoi: ' + c.id);
    bao(dv.getUint32(4, true) === w.length - 8, 'RIFF size sai: ' + c.id);
    bao(dv.getUint32(16, true) === 16 && dv.getUint16(20, true) === 1 && dv.getUint16(22, true) === 1, 'fmt khong phai PCM mono: ' + c.id);
    bao(dv.getUint32(24, true) === 24000 && dv.getUint32(28, true) === 48000 && dv.getUint16(32, true) === 2 && dv.getUint16(34, true) === 16, 'fmt 24k/16bit sai: ' + c.id);
    const nd = dv.getUint32(40, true);
    bao(nd === w.length - 44 && nd % 2 === 0, 'data size sai: ' + c.id);
    const giay = nd / 48000;
    let dinh = 0;
    for (let k = 0; k < nd / 2; k++) { const v = Math.abs(dv.getInt16(44 + k * 2, true)); if (v > dinh) dinh = v; }
    const dBd = dB(dinh / 32768);
    bao(Math.abs(giay - c.doDaiGiay) < 0.0015, `doDaiGiay ${c.doDaiGiay} != tep ${giay.toFixed(4)} (${c.id})`);
    bao(Math.abs(dBd - c.dinhDBFS) < 0.02, `dinhDBFS ${c.dinhDBFS} != tep ${dBd.toFixed(3)} (${c.id})`);
    bao(Math.abs(dBd + 3) < 0.03, `dinh ${dBd.toFixed(3)} dBFS khong ~ -3 (${c.id})`);
    bao(c.quaDai === (c.doDaiGiay > l.dur * 1.15), 'co quaDai sai: ' + c.id);
    if (thamSo && thamSo[c.id]) {
      const mong = thamSo[c.id].dur + 0.06 + 0.12;
      bao(Math.abs(giay - mong) <= 0.015, `${c.id}: dai ${giay.toFixed(3)} s, mong ${mong.toFixed(3)} s (tone ${thamSo[c.id].dur.toFixed(3)} + 60 ms + 120 ms)`);
    }
    wav.push({ id: c.id, giay, dBd });
  });
  const thuaTep = Object.keys(files).filter(k => k !== 'manifest.json' && !manifest.clips.some(c => c.file === k));
  bao(!thuaTep.length, 'tep thua: ' + thuaTep.join(','));
  const mauKhoa = Buffer.concat(Object.values(files)).includes(KHOA_GIA) || /AIza/.test(files['manifest.json'].toString('utf8'));
  bao(!mauKhoa, 'ZIP chua khoa API');
  return { loi, manifest, wav, soTep: n };
}

// ------------------------------------------------------------------ chay
let t = null;
const phanDau = Date.now();
try {
  const kb = JSON.parse(fs.readFileSync(KICH_BAN, 'utf8'));
  const dongKb = [];
  kb.beats.forEach(b => (b.loi || []).forEach((l, i) => dongKb.push({ id: b.id + '-' + (i + 1), t: l.t, dur: l.dur, text: l.text })));

  t = await moTrinhDuyet();

  // ================================================================== A: khong co khoa
  await t.vao('/index.html?noLive&taoTiengDemo=1&tt=nokey');
  const sanSang = await t.cho(`window.TaoTiengDemo && document.querySelector('#tao-tieng tbody tr')`, 20000);
  kt('A', 'panel hien thi sau khi nap tep theo ?taoTiengDemo=1', sanSang);
  if (!sanSang) throw new Error('panel khong hien thi: ' + t.log.slice(-5).join(' | '));
  const a = JSON.parse(await t.ev(`JSON.stringify({
    tieuDe: document.querySelector('#tao-tieng h1').textContent,
    hang: document.querySelectorAll('#tao-tieng tbody tr').length,
    baoHien: !document.querySelector('#tao-tieng .bao').hidden,
    baoChu: document.querySelector('#tao-tieng .bao').textContent,
    tatCaKhoa: ${nutBam('Tạo tất cả')}.disabled,
    cacNut: [...document.querySelectorAll('#tao-tieng button')].map(b => b.textContent.trim()),
    buoc: document.querySelectorAll('#tao-tieng ol li').length,
    toanTrang: (() => { const r = document.getElementById('tao-tieng').getBoundingClientRect(); return r.width === innerWidth && r.height === innerHeight; })(),
  })`));
  kt('A', 'tieu de dung, 3 buoc huong dan, 21 hang', a.tieuDe === 'Tạo tiếng Sensei cho video demo' && a.buoc === 3 && a.hang === 21, JSON.stringify([a.tieuDe, a.buoc, a.hang]));
  kt('A', 'du cac nut: Tao tat ca / Dung / Tai zip, moi hang co Nghe + Tao lai dong nay', ['Tạo tất cả', 'Dừng', 'Tải tất cả (.zip)'].every(x => a.cacNut.includes(x)) && a.cacNut.filter(x => x === 'Nghe').length === 21 && a.cacNut.filter(x => x === 'Tạo lại dòng này').length === 21, a.cacNut.slice(0, 4).join(' | '));
  kt('A', 'thieu khoa: thong bao tieng Viet + Tao tat ca bi khoa', a.baoHien && /Không thấy khóa API/.test(a.baoChu) && a.tatCaKhoa, a.baoChu.slice(0, 60));
  kt('A', 'overlay phu kin trang', a.toanTrang);
  // kich ban noi bo khop kich-ban.json goc
  const noiBo = JSON.parse(await t.ev(`JSON.stringify(TaoTiengDemo.kichBanNoiBo.dong.map(d => ({ id: d.id, t: d.t, dur: d.dur, text: d.text })))`));
  kt('A', 'kich ban nhung san = 21 dong cua kich-ban.json (id, t, dur, text)', JSON.stringify(noiBo) === JSON.stringify(dongKb), `${noiBo.length} dong`);
  // pure: xuLy
  const don = JSON.parse(await t.ev(`(() => {
    const T = TaoTiengDemo._t, o = {};
    try { T.xuLy(new Uint8Array(48000)); o.imLang = 'khong nem loi'; } catch (e) { o.imLang = 'nem: ' + e.message; }
    const x = T.xuLy(__giaAm({ lead: 0.5, dur: 1.0, tail: 0.7, amp: 0.02 }));   // dinh -34 dBFS: can +31 dB > tran 30 dB
    o.nho = { biChan: x.biChanGain, gainDB: x.gainDB, dinhDB: x.dinhDB };
    const y = T.xuLy(__giaAm({ lead: 0.5, dur: 1.0, tail: 0.7, amp: 0.4 }));
    o.thuong = { giay: y.giay, dinhDB: y.dinhDB, goc: y.goc, catDau: y.catDau, catDuoi: y.catDuoi };
    o.crc = T.crc32(new TextEncoder().encode('123456789'));
    return JSON.stringify(o);
  })()`));
  kt('A', 'xuLy: am thanh im lang -> loi ro rang', /^nem:.*(trống|im lặng)/.test(don.imLang), don.imLang);
  kt('A', 'xuLy: khuech dai toi da 30 dB (dinh -34 dBFS khong keo len -3)', don.nho.biChan && Math.abs(don.nho.gainDB - 30) < 0.01 && don.nho.dinhDB < -3.5, JSON.stringify(don.nho));
  kt('A', 'xuLy: dai 1.0 s + 60 ms + 120 ms, dinh -3 dBFS, nhieu -60 dBFS khong bi giu', Math.abs(don.thuong.giay - 1.18) < 0.015 && Math.abs(don.thuong.dinhDB + 3) < 0.01, JSON.stringify(don.thuong));
  kt('A', 'CRC32("123456789") = 0xCBF43926', don.crc === 0xCBF43926, don.crc.toString(16));

  // ================================================================== B: bo tong hop gia
  await t.vao('/index.html?noLive&taoTiengDemo=1&tt=gia');
  await t.cho(`window.TaoTiengDemo && document.querySelector('#tao-tieng tbody tr')`, 20000);
  const rnd = mulberry32(20261001);
  const HE_SO = [0.8, 1.0, 1.1, 1.3, 1.6, 0.9];
  const thamSo = {};
  dongKb.forEach((l, i) => {
    const hs = HE_SO[i % HE_SO.length];
    thamSo[l.id] = { lead: 0.25 + rnd() * 0.6, dur: Math.round(l.dur * hs * 1000) / 1000, tail: 0.3 + rnd() * 0.7, amp: 0.05 + rnd() * 0.45 };
  });
  await t.ev(`(() => {
    window.__tham = ${JSON.stringify(thamSo)};
    window.__cfg = { tre: 40, hongMai: {}, hongSoLan: {}, run: 1 };
    window.__nhat = [];
    window.__soLan = {};
    TaoTiengDemo.datTongHop(async (q) => {
      const t0 = performance.now();
      window.__soLan[q.id] = (window.__soLan[q.id] || 0) + 1;
      await new Promise(r => setTimeout(r, window.__cfg.tre));
      const hong = window.__cfg.hongMai[q.id] || (window.__cfg.hongSoLan[q.id] || 0) >= window.__soLan[q.id];
      window.__nhat.push({ id: q.id, lan: q.lan, t0, t1: performance.now(), run: window.__cfg.run, hong: !!hong, text: q.text, voice: q.voice });
      if (hong) throw new Error('loi gia lap tu bo tong hop (key=${KHOA_GIA})');
      return __giaAm(window.__tham[q.id]);
    });
    return 1;
  })()`);
  kt('B', 'co bo tong hop gia: nut Tao tat ca bat lai du khong co khoa that', await t.ev(`!${nutBam('Tạo tất cả')}.disabled`));
  const che = await t.ev(`TaoTiengDemo._t.che('wss://x/ws?key=ABCDEF123456 loi ${KHOA_GIA} AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456 xong')`);
  kt('B', 'che khoa: key=..., AIza..., gia tri khoa that trong env deu thanh ***', !/ABCDEF123456|TESTKEY|AIza/.test(che) && /key=\*\*\*/.test(che), che);

  // B1: chay roi DUNG, chay tiep
  await bam(t, 'Tạo tất cả');
  await t.cho(`TaoTiengDemo.dong.filter(d => d.tt === 'xong').length >= 3`, 20000, 30);
  await bam(t, 'Dừng');
  const dungOk = await xongChay(t, 15000);
  const sauDung = await dongNgay(t);
  const nXongDung = sauDung.filter(d => d.tt === 'xong').length;
  kt('B', 'Dung: dung lai giua chung, khong dong nao con "dang", cac dong chua chay ve "cho"', dungOk && nXongDung >= 3 && nXongDung < 21 && !sauDung.some(d => d.tt === 'dang') && sauDung.filter(d => d.tt === 'cho').length === 21 - nXongDung, `xong ${nXongDung}/21`);
  const huyTrong = await t.ev(`JSON.stringify(window.__soLan)`).then(JSON.parse);
  const dsXongDung = sauDung.filter(d => d.tt === 'xong').map(d => d.id);

  // B2: chay tiep voi loi gia lap: tu-gakusei-1 hong 2 lan roi duoc; cau-hoi-2 hong mai
  await t.ev(`(() => { window.__cfg.run = 2; window.__cfg.hongSoLan['tu-gakusei-1'] = 2; window.__cfg.hongMai['cau-hoi-2'] = true; })()`);
  const soLanTruoc = { ...huyTrong };
  await bam(t, 'Tạo tất cả');
  const xongB2 = await xongChay(t, 120000);
  const b2 = await dongNgay(t);
  const nhatB2 = JSON.parse(await t.ev(`JSON.stringify(window.__nhat)`));
  const soLan = await t.ev(`JSON.stringify(window.__soLan)`).then(JSON.parse);
  kt('B', 'chay tiep xong: 20 dong xong, 1 dong loi (cau-hoi-2), khong dung giua chung', xongB2 && b2.filter(d => d.tt === 'xong').length === 20 && b2.filter(d => d.tt === 'loi').length === 1 && b2.find(d => d.tt === 'loi').id === 'cau-hoi-2', JSON.stringify(b2.filter(d => d.tt !== 'xong').map(d => [d.id, d.tt])));
  kt('B', 'bo qua dong da xong khi chay tiep (dong da xong truoc khi Dung khong bi goi lai)', dsXongDung.every(id => (soLan[id] || 0) === (soLanTruoc[id] || 0)), dsXongDung.join(','));
  kt('B', 'dong hong 2 lan roi thanh cong o lan 3 (thu lai toi da 2 lan)', soLan['tu-gakusei-1'] - (soLanTruoc['tu-gakusei-1'] || 0) === 3 && b2.find(d => d.id === 'tu-gakusei-1').tt === 'xong', `goi ${soLan['tu-gakusei-1']}`);
  kt('B', 'dong hong mai: dung 3 lan goi (1 + 2 thu lai) roi bao loi, cac dong sau van chay', soLan['cau-hoi-2'] - (soLanTruoc['cau-hoi-2'] || 0) === 3 && b2.find(d => d.id === 'cau-hoi-3').tt === 'xong' && b2.find(d => d.id === 'ket-bai-2').tt === 'xong', `goi ${soLan['cau-hoi-2']}`);
  const gap = [];
  for (let i = 1; i < nhatB2.length; i++) if (nhatB2[i].run === 2 && nhatB2[i - 1].run === 2) gap.push(nhatB2[i].t0 - nhatB2[i - 1].t1);
  kt('B', 'khoang nghi >= 800 ms giua hai lan goi (ca khi thu lai)', gap.length > 15 && Math.min(...gap) >= 780, `n=${gap.length} min=${Math.min(...gap).toFixed(0)} ms`);
  const hangLoi = JSON.parse(await t.ev(`JSON.stringify((() => { const tr = document.querySelector('#tao-tieng tr[data-id="cau-hoi-2"]'); return { chu: tr.children[3].textContent, lop: tr.className }; })())`));
  kt('B', 'hang loi hien loi (da che khoa), khong lo khoa trong DOM', /lỗi:.*key=\*\*\*/.test(hangLoi.chu) && !/TESTKEY/.test(hangLoi.chu) && hangLoi.lop === 'loi-hang', hangLoi.chu.slice(0, 90));
  await t.chup(path.join(RA, 'bang-co-loi.png'));

  // B3: bo loi, chay lai: chi dong loi duoc goi
  await t.ev(`(() => { window.__cfg.run = 3; window.__cfg.hongMai = {}; })()`);
  const nhat3 = (await t.ev(`window.__nhat.length`));
  await bam(t, 'Tạo tất cả');
  const xongB3 = await xongChay(t, 30000);
  const nhatB3 = JSON.parse(await t.ev(`JSON.stringify(window.__nhat.slice(${nhat3}))`));
  const b3 = await dongNgay(t);
  kt('B', 'bam Tao tat ca lan nua: chi goi dong loi, dong da xong giu nguyen -> du 21', xongB3 && b3.every(d => d.tt === 'xong') && nhatB3.length === 1 && nhatB3[0].id === 'cau-hoi-2', JSON.stringify(nhatB3.map(x => x.id)));
  const giongSensei = JSON.parse(await t.ev(`JSON.stringify([...new Set(window.__nhat.map(x => x.voice))])`));
  kt('B', 'moi lan tong hop deu khoa giong Charon (Sensei)', giongSensei.length === 1 && giongSensei[0] === 'Charon', giongSensei.join(','));
  const vanDoc = JSON.parse(await t.ev(`JSON.stringify(window.__nhat.filter(x => x.id === 'cau-hoi-1').map(x => x.text)[0])`));
  kt('B', 'dong cau-hoi-1: doc "cho trong" thay vi ___', /chỗ trống/.test(vanDoc) && !/___/.test(vanDoc), vanDoc);

  // B4: Tao lai dong nay (doi do dai de thay ket qua doi)
  const giayCu = (await dongNgay(t)).find(d => d.id === 'mo-dau-1').giay;
  thamSo['mo-dau-1'].dur = 3.4; thamSo['mo-dau-1'].amp = 0.2;
  await t.ev(`window.__tham['mo-dau-1'] = ${JSON.stringify(thamSo['mo-dau-1'])}; window.__cfg.run = 4; window.__soLan['mo-dau-1'] = 0;`);
  await bamHang(t, 'mo-dau-1', 'Tạo lại dòng này');
  await xongChay(t, 15000);
  const sauLai = await dongNgay(t);
  const nLai = await t.ev(`window.__soLan['mo-dau-1']`);
  const giayMoi = sauLai.find(d => d.id === 'mo-dau-1').giay;
  kt('B', 'Tao lai dong nay: chi goi dong do, ket qua thay bang ban moi', nLai === 1 && Math.abs(giayMoi - 3.58) < 0.015 && giayCu < 3 && sauLai.every(d => d.tt === 'xong'), `${giayCu.toFixed(2)} s -> ${giayMoi.toFixed(2)} s`);

  // so lieu hien thi tren hang
  const chuHang = JSON.parse(await t.ev(`JSON.stringify([...document.querySelectorAll('#tao-tieng tbody tr')].map(tr => tr.children[3].textContent))`));
  kt('B', 'moi hang "xong" hien do dai + dinh dBFS (vd: xong · 2,41 s · −3,0 dBFS)', chuHang.every(x => /xong · \d+,\d\d s · −3,0 dBFS/.test(x)), chuHang[0]);
  const soDai = chuHang.filter(x => /dài hơn kế hoạch/.test(x)).length;
  const kyVong = Object.keys(thamSo).filter(id => { const l = dongKb.find(d => d.id === id); return thamSo[id].dur + 0.18 > l.dur * 1.15; }).length;
  kt('B', 'canh bao "dai hon ke hoach" dung cho cac dong > 15%', soDai === kyVong && soDai > 0 && soDai < 21, `${soDai} dong (mong ${kyVong})`);
  const tongTxt = await t.ev(`document.querySelector('#tao-tieng .tong').textContent`);
  kt('B', 'thanh tong hop: xong 21/21, quá dài khớp', /Xong 21\/21/.test(tongTxt) && new RegExp('quá dài ' + kyVong).test(tongTxt), tongTxt);

  // ---- zip: bam nut that, bat Blob qua URL.createObjectURL
  await t.ev(`window.__bomUrl.length = 0`);
  await bam(t, 'Tải tất cả (.zip)');
  const zipB64 = await t.ev(`(async () => {
    const b = window.__bomUrl[window.__bomUrl.length - 1];
    if (!b) return '';
    const u8 = new Uint8Array(await b.arrayBuffer()); let s = '';
    for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
    return btoa(s);
  })()`);
  const tenTai = await t.ev(`(() => { const as = [...document.querySelectorAll('a[download]')]; return as.length; })()`);
  const baoZip = await t.ev(`document.querySelector('#tao-tieng .thanh').textContent`);
  const zipBuf = Buffer.from(zipB64, 'base64');
  fs.writeFileSync(path.join(RA, 'tieng-sensei-bai1.zip'), zipBuf);
  kt('B', 'bam Tai tat ca (.zip) tao Blob, thong bao ghi ten tieng-sensei-bai1.zip', zipBuf.length > 100000 && /tieng-sensei-bai1\.zip: 21 dòng/.test(baoZip), `${zipBuf.length} byte; ${baoZip.slice(-70)}`);
  const kz = kiemZip(zipBuf, dongKb, thamSo);
  kt('B', 'ZIP: STORE, CRC32 dung, 22 muc (21 wav + manifest.json), thu muc trung tam khop', kz.soTep === 22 && !kz.loi.some(x => /CRC|EOCD|local|central|STORE|thu muc|UTF|cat ngan|ten /.test(x)), kz.loi.filter(x => /CRC|EOCD|local|central|STORE|thu muc|UTF|cat ngan|ten /.test(x)).join('; '));
  kt('B', 'ZIP: 21 WAV hop le (RIFF/fmt 24 kHz mono 16-bit, data size), dinh -3 dBFS, do dai = tone + 60 ms + 120 ms, khop manifest', kz.wav.length === 21 && kz.loi.length === 0, kz.loi.slice(0, 4).join('; '));
  kt('B', 'ZIP: manifest {phienBan, giong, model (khong khoa), clips[21]} dung thu tu kich ban, khong chua khoa API', kz.manifest.clips.length === 21 && kz.manifest.giong === 'Charon' && !kz.loi.some(x => /manifest|khoa/.test(x)), `model=${kz.manifest.model}`);
  let pyOk = true, pyMsg = '';
  try { execFileSync('python', ['-c', 'import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; assert len(z.namelist())==22; print(len(z.namelist()))', path.join(RA, 'tieng-sensei-bai1.zip')], { env: { ...process.env, TEMP: TAM, TMP: TAM } }); } catch (e) { pyOk = false; pyMsg = String(e.stderr || e.message).slice(0, 200); }
  kt('B', 'ZIP doc duoc bang python zipfile (testzip OK, 22 muc)', pyOk, pyMsg);
  await t.chup(path.join(RA, 'bang.png'));

  // ---- nap kich ban khac qua <input type=file>
  const kbKhac = { bai: 'n5-2', tongThoiGian: 12.5, beats: [{ id: 'a', loi: [{ t: 0.2, dur: 2, text: 'Một hai ba.' }, { t: 2.4, dur: 2, text: 'こんにちは.' }] }, { id: 'b', loi: [{ t: 5, dur: 3, text: 'Xong rồi nhé.' }] }] };
  const tepKb = path.join(RA, 'kich-ban-khac.json');
  fs.writeFileSync(tepKb, JSON.stringify(kbKhac));
  const doc = await t.c.send('DOM.getDocument', { depth: 1 });
  const o = await t.c.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#tao-tieng input[type=file]' });
  await t.c.send('DOM.setFileInputFiles', { files: [tepKb], nodeId: o.nodeId });
  await t.cho(`document.querySelectorAll('#tao-tieng tbody tr').length === 3`, 5000, 50);
  const kh = JSON.parse(await t.ev(`JSON.stringify({ hang: document.querySelectorAll('#tao-tieng tbody tr').length, ids: [...document.querySelectorAll('#tao-tieng tbody tr')].map(tr => tr.dataset.id), nguon: document.querySelector('#tao-tieng .dau').textContent, tt: TaoTiengDemo.dong.map(d => d.tt) })`));
  kt('B', 'nap kich ban khac qua file input: 3 dong (id beat-so thu tu), tt = cho, nhan nguon doi', kh.hang === 3 && kh.ids.join() === 'a-1,a-2,b-1' && kh.tt.every(x => x === 'cho') && /kich-ban-khac\.json/.test(kh.nguon), JSON.stringify(kh.ids));
  await t.ev(`window.__bomUrl.length = 0; for (const id of ['a-1', 'a-2', 'b-1']) window.__tham[id] = { lead: 0.3, dur: 1.2, tail: 0.4, amp: 0.3 };`);
  await bam(t, 'Tạo tất cả');
  await xongChay(t, 30000);
  const zip2 = await t.ev(`(() => { const z = TaoTiengDemo.zipBlob(); return z.tenTep + '|' + z.soDong; })()`);
  kt('B', 'kich ban khac: tao du 3 dong, ten zip theo bai (tieng-sensei-n5-2.zip)', zip2 === 'tieng-sensei-n5-2.zip|3', zip2);

  // ================================================================== C: duong THAT voi WebSocket gia
  await t.vao('/index.html?noLive&taoTiengDemo=1&tt=ws');
  await t.cho(`window.TaoTiengDemo && document.querySelector('#tao-tieng tbody tr') && window.__ws`, 20000);
  const tC0 = Date.now();
  await bam(t, 'Tạo tất cả');
  const xongC = await xongChay(t, 150000);
  const c = await dongNgay(t);
  const W = JSON.parse(await t.ev(`JSON.stringify(window.__ws)`));
  kt('C', 'duong that (VoiceActorPool + WebSocket gia): 20 dong xong, ket-bai-2 loi sau 3 lan', xongC && c.filter(d => d.tt === 'xong').length === 20 && c.find(d => d.id === 'ket-bai-2').tt === 'loi', `${((Date.now() - tC0) / 1000).toFixed(0)} s`);
  kt('C', 'moi phien setup khoa giong Charon va mang ACTOR_BRIEF (khong dich, khong them bot)', W.setup.length >= 2 && W.setup.every(s => s.voice === 'Charon' && /KHÔNG dịch/.test(s.brief) && /ĐỌC LẠI ĐÚNG NGUYÊN VĂN/.test(s.brief) && /đúng ngôn ngữ của chính văn bản/.test(s.brief)), `${W.setup.length} phien`);
  kt('C', 'model chinh hong (ma 1008) -> du phong gemini-3.8-live, sau do uu tien model dang chay', W.setup[0].model === 'models/gemini-3.1-flash-live-preview' && W.setup[1].model === 'models/gemini-3.8-live' && W.luot.slice(0, 20).every(l => l.model === 'models/gemini-3.8-live'), W.setup.slice(0, 3).map(s => s.model.replace('models/', '')).join(' > '));
  kt('C', 'luot noi gui di: "Đọc nguyên văn câu này:" + dung van ban (21 dong, ke ca doc "chỗ trống")', (() => {
    const mong = new Set(dongKb.map(l => 'Đọc nguyên văn câu này:\n' + (l.id === 'cau-hoi-1' ? 'Thử nhé: わたし, chỗ trống, ナムです. Điền trợ từ nào?' : l.text)));
    const co = new Set(W.luot.map(l => l.text));
    return [...mong].every(x => co.has(x)) && [...co].every(x => mong.has(x));
  })(), `${W.luot.length} luot`);
  kt('C', 'chi mot phien Live mo cung luc (tuan tu)', W.toiDaMo === 1, 'toi da ' + W.toiDaMo);
  const hangC = JSON.parse(await t.ev(`JSON.stringify({ chu: document.querySelector('#tao-tieng tr[data-id="ket-bai-2"]').children[3].textContent, trang: document.body.innerText })`));
  kt('C', 'loi tu may chu co chua khoa: DOM chi thay key=*** (khong TESTKEY, khong AIza), khong khoa trong console', /lỗi:.*key=\*\*\*/.test(hangC.chu) && !/TESTKEY|AIzaSy/.test(hangC.trang) && !t.log.some(l => /TESTKEY|AIzaSy/.test(l)), hangC.chu.slice(0, 120));
  kt('C', 'URL WebSocket (chi trong stub) co khoa nhung tool khong in ra DOM/console', W.url.length > 0);

  // ================================================================== D: tai lai -> tiep tuc tu IndexedDB
  await t.vao('/index.html?noLive&taoTiengDemo=1&tt=ws');
  await t.cho(`window.TaoTiengDemo && document.querySelector('#tao-tieng tbody tr') && window.__ws`, 20000);
  await ngu(500);
  const tD0 = Date.now();
  await bam(t, 'Tạo tất cả');
  const xongD = await xongChay(t, 60000);
  const d = await dongNgay(t);
  const WD = JSON.parse(await t.ev(`JSON.stringify(window.__ws)`));
  kt('D', 'tai lai trang: 20 dong tiep tuc tu bo nho IndexedDB sensei_tts (khong goi lai WebSocket)', xongD && d.filter(x => x.tuBoNho).length === 20 && WD.luot.every(l => /Hẹn gặp lại/.test(l.text)), `tuBoNho=${d.filter(x => x.tuBoNho).length}, luot WS=${WD.luot.length}, ${((Date.now() - tD0) / 1000).toFixed(0)} s`);
  const chuD = await t.ev(`document.querySelector('#tao-tieng tr[data-id="mo-dau-1"]').children[3].textContent`);
  kt('D', 'hang tu bo nho ghi ro "tu bo nho" va co so do', /từ bộ nhớ/.test(chuD) && /xong · \d,\d\d s · −3,0 dBFS/.test(chuD), chuD.slice(0, 80));
  // Tao lai dong nay phai bo qua bo nho
  const luotTruoc = WD.luot.length;
  await bamHang(t, 'mo-dau-1', 'Tạo lại dòng này');
  await xongChay(t, 30000);
  const WD2 = JSON.parse(await t.ev(`JSON.stringify(window.__ws)`));
  kt('D', 'Tao lai dong nay bo qua bo nho (goi WebSocket that)', WD2.luot.length === luotTruoc + 1 && /Chào các bạn/.test(WD2.luot[WD2.luot.length - 1].text));

  const loiTrang = t.log.filter(l => /^EXC|^LOG error|^error/.test(l) && !/favicon|ERR_FILE_NOT_FOUND|404 \(File not found\)|Failed to load resource|env\.js/.test(l));
  kt('Chung', 'khong co loi console / exception', loiTrang.length === 0, loiTrang.slice(0, 3).join(' | '));
  kt('Chung', 'khong co khoa API (gia) nao lot ra console', !t.log.some(l => /TESTKEY|AIzaSy/.test(l)));
} catch (e) {
  kt('Chung', 'khong co ngoai le trong luc chay', false, (e && e.stack || e).toString().slice(0, 600));
} finally {
  if (t) await t.dong();
}

// ------------------------------------------------------------------ bao cao
let hong = 0;
const nhomDang = {};
for (const r of bang) {
  if (!nhomDang[r.nhom]) { nhomDang[r.nhom] = 1; console.log(`\n== ${r.nhom} ==`); }
  console.log(`${r.ok ? '  OK  ' : ' LOI  '} ${r.ten}${r.chiTiet && (!r.ok || giu) ? '  -> ' + r.chiTiet : ''}`);
  if (!r.ok) hong++;
}
console.log(`\n${bang.length - hong}/${bang.length} dat, ${hong} loi, ${((Date.now() - phanDau) / 1000).toFixed(0)} s. Anh + zip: ${RA}`);
process.exit(hong ? 1 : 0);
