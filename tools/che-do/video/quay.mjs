// quay.mjs — luot 3: quay VIDEO bai giang day du cua mot che do san khau, chay tren mock ?noLive&moPhong voi TIENG THAT nap tu
// <ra>/tieng (tao-tieng.mjs). Hinh: CDP screencast -> ffmpeg (30 fps co dinh, gan khung theo moc thoi gian cua chinh khung).
// Am thanh: KHONG thu lai tu trang; script ghi cac moc phat that (luc AudioContext -> giay video) vao timeline.json, ghep-tieng.py tron WAV.
//   node tools/che-do/video/quay.mjs --che s [--bai n5-1] [--cap N5 --so 1] [--ra DIR] [--w 1920 --h 1080] [--fps 30]
//        [--tu <nhip>] [--den <nhip>]   (quay thu mot doan)  [--giay-toi-da N] [--hau -thu] [--crf 23] [--css "..."]
import { moServer, moChrome, Trang, donDep, sleep } from '../khung/cdp-lib.mjs';
import { THAM_SO_MOCK, batDauGiang, chayDenHet } from './chung.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const av = process.argv.slice(2);
const opt = (k, d) => { const i = av.indexOf(k); return i >= 0 ? av[i + 1] : d; };
const CHE = opt('--che', 's'), BAI = opt('--bai', 'n5-1'), CAP = opt('--cap', 'N5'), SO = +opt('--so', 1);
const RA = opt('--ra', 'E:/sensei-tam/video/n5-1');
const W = +opt('--w', 1920), H = +opt('--h', 1080), FPS = +opt('--fps', 30);
const TU = opt('--tu', null), DEN = opt('--den', null), GIAY_MAX = +opt('--giay-toi-da', 0);
const HAU = opt('--hau', '');
// Khung hinh = SAN KHAU 1920x1080: viewport cao hon 124 px (thanh tren 56 + thanh duoi 68) roi cat bo (do bang dbg: header 56, footer 68)
const THANH = +opt('--thanh', 124), CAT_Y = +opt('--cat-y', 56);
const VH = H + THANH;
const CRF = opt('--crf', '23');
const manifest = JSON.parse(fs.readFileSync(path.join(RA, 'tieng', 'manifest.json'), 'utf8'));
const mp4 = path.join(RA, `video-${CHE}${HAU}.noaudio.mp4`);
const tlPath = path.join(RA, `timeline-${CHE}${HAU}.json`);

// CSS cho video: an nhan MO PHONG; them quy tac an khung app bang --css neu can
const CSS_VIDEO = opt('--css', '#moPhongNhan,.sensei-nut{display:none!important}');
const truocTrang = `document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(CSS_VIDEO)}; document.head.appendChild(s); });`;

const goc = await moServer();
const ch = await moChrome({ w: W, h: VH });
const t = new Trang(ch.cdp, goc);
let ff = null, khungDaGhi = 0, loiFf = '';
try {
  await t.batDau(W, VH);
  await t.media(false);   // Windows dang bat "giam chuyen dong" -> app tat hoat canh, meo chi con anh tinh: ep prefers-reduced-motion = no-preference
  await t.moApp({ them: `&phongCach=${CHE}${THAM_SO_MOCK}`, bai: [CAP, SO], truocTrang });
  await t.ev(`(window.SenseiVoices && SenseiVoices.ready ? Promise.resolve(SenseiVoices.ready).catch(() => 0) : 0).then(() => true)`);

  // ---- nap tieng that (luot tach nhieu doan: noi lai theo thu tu, nghi 120 ms giua cac doan)
  let nTurn = 0, nThoai = 0;
  const nhom = new Map();     // khoaLuot -> [dong...]
  for (const l of Object.values(manifest.lines)) {
    if (l.loai === 'luot') { if (!nhom.has(l.khoaLuot)) nhom.set(l.khoaLuot, []); nhom.get(l.khoaLuot).push(l); }
    else {
      const wav = fs.readFileSync(path.join(RA, 'tieng', l.id + '.wav'));
      await t.ev(`__moPhong.datTiengThoai(${JSON.stringify(l.idCau)}, ${JSON.stringify(wav.subarray(44).toString('base64'))})`); nThoai++;
    }
  }
  for (const [khoa, ds] of nhom) {
    ds.sort((x, y) => (x.phan || 0) - (y.phan || 0));
    const bufs = [];
    ds.forEach((l, i) => { if (i) bufs.push(Buffer.alloc(5760)); bufs.push(fs.readFileSync(path.join(RA, 'tieng', l.id + '.wav')).subarray(44)); });
    await t.ev(`__moPhong.datTieng(${JSON.stringify(khoa)}, ${JSON.stringify(Buffer.concat(bufs).toString('base64'))})`); nTurn++;
  }
  // ep phan "them" (mo bai / cau noi / chem) theo kich ban luot 1 -> loi doc giong het van ban da tao tieng
  const kb1 = JSON.parse(fs.readFileSync(path.join(RA, 'kich-ban-' + BAI + '.json'), 'utf8'));
  let nThem = 0;
  for (const l of kb1.luot) if (l.them !== undefined) { await t.ev(`__moPhong.datThem(${JSON.stringify(l.khoa)}, ${JSON.stringify(l.them)})`); nThem++; }
  console.log(`da nap tieng: ${nTurn} luot Sensei + ${nThoai} cau hoi thoai | ep phan them cho ${nThem} luot`);
  await t.ev(`__moPhong.napThoai(), true`);
  await sleep(1500);

  // ---- ffmpeg (hinh)
  fs.mkdirSync(path.dirname(mp4), { recursive: true });
  ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-vf', `crop=${W}:${H}:0:${CAT_Y},format=yuv420p`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', CRF, '-r', String(FPS), '-movflags', '+faststart', mp4],
    { stdio: ['pipe', 'ignore', 'pipe'], windowsHide: true });
  ff.stderr.on('data', (d) => { loiFf += d; });
  ff.stdin.on('error', () => {});
  try { os.setPriority(ff.pid, os.constants.priority.PRIORITY_BELOW_NORMAL); } catch (e) {}

  // ---- screencast: gan khung theo moc thoi gian cua chinh khung (khong theo luc nhan)
  const khung = [];            // { ts, buf }
  const tsNhan = [];           // moc thoi gian cua MOI khung screencast nhan duoc (do toc do khung that)
  let batDauTs = null, k = 0, daDung = false;
  t.c.on('Page.screencastFrame', (p) => {
    const ts = p.metadata.timestamp;
    if (batDauTs == null) batDauTs = ts;
    khung.push({ ts, buf: Buffer.from(p.data, 'base64') });
    tsNhan.push(ts);
    t.c.send('Page.screencastFrameAck', { sessionId: p.sessionId }).catch(() => {});
  });
  const bom = async () => {
    if (batDauTs == null) return;
    const chan = Date.now() / 1000 - 0.15;         // doi 150 ms cho khung toi kip
    while (batDauTs + k / FPS <= chan) {
      const dich = batDauTs + k / FPS;
      let i = 0;
      while (i + 1 < khung.length && khung[i + 1].ts <= dich) i++;
      const f = khung[i];
      if (!ff.stdin.write(f.buf)) await new Promise((r) => ff.stdin.once('drain', r));
      khungDaGhi++; k++;
      if (i > 0) khung.splice(0, i);
    }
  };
  const vong = (async () => { while (!daDung) { await bom(); await sleep(15); } })();

  const tuyen = Date.now();
  await t.c.send('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: W, maxHeight: VH, everyNthFrame: 1 });
  // moc quy doi dong ho AudioContext -> epoch (giay)
  const ctxMoc = async () => t.ev(`(() => { const ae = window.__audioEngine, c = ae && ae.outCtx; if (!c || !c.getOutputTimestamp) return null; const o = c.getOutputTimestamp(); return { ctx: o.contextTime, epoch: (performance.timeOrigin + o.performanceTime) / 1000 }; })()`);
  await sleep(600);
  let moc0 = null;   // lay luc co AudioContext (sau khi bat dau giang), xem onNhip

  // ---- chay bai
  if (TU != null || DEN != null) {
    await t.ev(`__moPhong.datDen(${DEN == null ? 'null' : +DEN})`);
    await t.ev(`__lecture.startFrom(${TU == null ? 0 : +TU}).then(() => true)`);
  } else await batDauGiang(t);
  const nhipLog = [];
  const kq = await chayDenHet(t, { timeoutMs: (GIAY_MAX || 7200) * 1000, onNhip: (i) => { nhipLog.push({ i, epoch: Date.now() / 1000 }); process.stdout.write(i + ' '); if (!moc0) ctxMoc().then((m) => { if (m && !moc0) moc0 = m; }).catch(() => {}); } });
  console.log('\nket thuc', JSON.stringify(kq));
  await sleep(1500);
  const moc1 = await ctxMoc();
  if (!moc0) moc0 = moc1;

  // ---- su kien am thanh that
  const du = await t.ev(`(() => { const L = __moPhong.luot(); const ev = [];
    L.forEach((x) => { if (x.tFirst != null) ev.push({ loai: 'luot', so: x.so, nhip: x.nhip, kind: x.kind, lan: x.lan, ctx: x.tFirst, tong: x.tong }); });
    const ids = []; __lecture.beats().forEach((b) => { if (b.kind === 'kaiwa-run' || b.kind === 'kaiwa') (Array.isArray(b.data) ? b.data : [b.data]).forEach((l) => { if (l && l.id && !ids.includes(l.id)) ids.push(l.id); }); });
    ids.forEach((id) => { const k = __moPhong.karaokeThat(id); if (k && k.lanPhat) k.lanPhat.forEach((lp, j) => ev.push({ loai: 'thoai', idCau: id, lan: j, ctx: lp.t0, nhip: lp.nhip, dur: k.dur })); });
    return { ev, noi: __moPhong.noiLuot() }; })()`);
  await t.c.send('Page.stopScreencast');
  await sleep(500);
  daDung = true; await vong; await bom();
  const giayVideo = k / FPS;
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  if (loiFf.trim()) console.log('ffmpeg:', loiFf.slice(0, 400));

  // ---- doi chieu van ban luot (tieng that khop kich ban dang chay?)
  const khoaCuaSo = new Map(du.noi.map((x) => [x.khoa, x.text]));
  const lech = [...nhom].filter(([khoa, ds]) => khoaCuaSo.has(khoa) && khoaCuaSo.get(khoa) !== (ds[0].vanGoc || ds[0].text)).map(([khoa]) => khoa);
  const khongTieng = du.noi.filter((x) => !nhom.has(x.khoa)).map((x) => x.khoa);
  // quy doi ctx -> epoch -> giay video
  const heSo = moc1 && moc0 && moc1.ctx !== moc0.ctx ? (moc1.epoch - moc0.epoch) / (moc1.ctx - moc0.ctx) : 1;
  const sangEpoch = (c) => moc0.epoch + (c - moc0.ctx) * heSo;
  const soKhoa = new Map(du.noi.map((x) => [x.so, x.khoa]));
  const ev = du.ev.map((e) => ({ ...e, khoa: e.loai === 'luot' ? soKhoa.get(e.so) || null : null, giay: +(sangEpoch(e.ctx) - batDauTs).toFixed(3) }));
  // toc do khung that: so khung screencast MOI giay (cac giay co chuyen dong: >= 10 khung)
  const moiGiay = new Map();
  tsNhan.forEach((x) => { const g = Math.floor(x - batDauTs); moiGiay.set(g, (moiGiay.get(g) || 0) + 1); });
  const dong = [...moiGiay.values()].filter((n) => n >= 10).sort((x, y) => x - y);
  const tk = { khungNhan: tsNhan.length, giayCoChuyenDong: dong.length, tongGiay: moiGiay.size, trungVi: dong[Math.floor(dong.length / 2)] || 0, p10: dong[Math.floor(dong.length * 0.1)] || 0, toiDa: dong[dong.length - 1] || 0, giayDat55: dong.filter((n) => n >= 55).length };
  console.log('toc do khung that:', JSON.stringify(tk));
  const loi = t.loi().filter((x) => !/favicon|env\.js|tailwindcss/.test(x.text));
  const tl = { che: CHE, bai: BAI, w: W, h: H, fps: FPS, giayVideo: +giayVideo.toFixed(2), khungGhi: khungDaGhi, heSoDongHo: +heSo.toFixed(6), batDauTs, ev, nhip: nhipLog.map((n) => ({ i: n.i, giay: +(n.epoch - batDauTs).toFixed(2) })), lechVanBan: lech, thongKeKhung: tk, khongTieng, loiConsole: loi.slice(0, 10), ketThuc: kq, tuyenGiay: (Date.now() - tuyen) / 1000 };
  fs.writeFileSync(tlPath, JSON.stringify(tl, null, 1));
  console.log(`video: ${giayVideo.toFixed(1)} s, ${khungDaGhi} khung ghi (${FPS} fps co dinh) | su kien am thanh ${ev.length} | luot lech van ban ${lech.length} | luot khong co tieng ${khongTieng.length} | loi console ${loi.length} | he so dong ho ${heSo.toFixed(5)}`);
} finally { try { ff && ff.stdin.end(); } catch (e) {} await ch.dong(); await donDep(); }
