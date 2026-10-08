// kiem-che-do.mjs — harness kiem thu MOT che do san khau (js/che-do/<id>.js) tren mock lecture ?noLive&moPhong.
//
//   node kiem-che-do.mjs <id> [phan...] [tuy chon]
//     id      : a..j (che do moi) — ban mau: demo-bai1/<id>/index.html hoac E:/sensei-tam/demo2/<id>/index.html
//     phan    : kiem | anh | so-sanh | video | all   (mac dinh: all)
//        kiem    : mock lecture N5-1 (nhip 0-6) + KANA-1 (0-4) + N5-10/N4-30/N1-3/KANA-5 (moi dang nhip 1 lan)
//                  -> khong loi console; tam dung = luoi tinh (lop go, #slideContent hien); cong bai tap (the that
//                  vao o cua che do, tra loi dung / sai, id khong trung); doi che do giua bai giang (ranh gioi nhip)
//        anh     : 6 khoanh khac cua video (tieu de, 私, 先生, cong thuc, vi du, bai tap dung) o 1440x900 + 390x844
//        so-sanh : khung ban mau (__seek tai kich-ban 4.9/10.4/21.1/28.0/35.9/51.5 s) canh anh that -> so-sanh.jpg
//        video   : CDP screencast ~20 s bai giang mo phong (N5-1 tu dau) -> demo-<id>.mp4
//     --ra DIR      thu muc ket qua (mac dinh scratchpad/che-do/<id>)
//     --proto FILE  duong dan index.html ban mau (mac dinh tu tim)
//     --giay 20     do dai video
//     --them "&k=v" them tham so URL cho app
//     --tu np       video bat dau o nhip dau cua dang (np | vd | kj | kw | kwi | qz | tu1) — mac dinh: dau bai
//     --ten -np     hau to ten video (demo-<id>-np.mp4)
//   In JSON tong ket ra stdout. Can: node 18+, ffmpeg trong PATH, Chrome. Khong bao gio mo Gemini Live.
import { moServer, moChrome, Trang, donDep, sleep, ffmpeg, SCR, TAM } from './cdp-lib.mjs';
import fs from 'node:fs';
import path from 'node:path';

const av = process.argv.slice(2);
const ID = av[0];
if (!ID || !/^[a-z]$/.test(ID)) { console.error('dung: node kiem-che-do.mjs <a..j> [kiem|anh|so-sanh|video|all] [--ra DIR] [--proto FILE]'); process.exit(2); }
const TUY = { phan: [], ra: path.join(SCR, 'che-do', ID), proto: null, giay: 20, them: '', tu: null, ten: '' };
for (let i = 1; i < av.length; i++) {
  const a = av[i];
  if (a === '--ra') TUY.ra = av[++i];
  else if (a === '--proto') TUY.proto = av[++i];
  else if (a === '--giay') TUY.giay = +av[++i];
  else if (a === '--them') TUY.them += av[++i];
  else if (a === '--tu') TUY.tu = av[++i];          // video bat dau o dang nhip nay (np | vd | kj | kw | qz) thay vi dau bai
  else if (a === '--ten') TUY.ten = av[++i];        // hau to ten video: demo-<id><ten>.mp4
  else TUY.phan.push(a);
}
if (!TUY.phan.length || TUY.phan.includes('all')) TUY.phan = ['kiem', 'anh', 'so-sanh', 'video'];
fs.mkdirSync(TUY.ra, { recursive: true });
const PROTO = TUY.proto || [path.join(SCR, 'demo-bai1', ID, 'index.html'), `E:/sensei-tam/demo2/${ID}/index.html`].find((f) => fs.existsSync(f));
const THEM = `&phongCach=${ID}${TUY.them}`;
const MAN = [[1440, 900], [390, 844]];
const KHOANH = [   // 6 khoanh khac cua video (kich-ban.json) <-> dieu kien tren bai giang that N5-1
  { ten: 'tieu-de', t: 4.9 },
  { ten: 'watashi', t: 10.4 },
  { ten: 'sensei', t: 21.1 },
  { ten: 'cong-thuc', t: 28.0 },
  { ten: 'vi-du', t: 35.9 },
  { ten: 'bai-tap-dung', t: 51.5 },
];
const KQ = { id: ID, luc: new Date().toISOString(), phan: {}, loi: [] };
const locLoi = (ds) => ds.filter((x) => !/favicon|env\.js|tailwindcss\.com should not/.test(x.text));

// ------------------------------------------------------------------ tien ich trang
async function batDau(t, tu, den, nut) {
  await t.ev(`__moPhong.datDen(${den == null ? 'null' : den})`);
  if (nut) await t.bam('#autoLectureBtn');   // nut "Bat dau giang" (bai moi: nhip dau la mo dau buoi giang)
  else await t.ev(`__lecture.startFrom(${tu}).then(() => true)`);
  return t.cho(`__lecture.state().lectureState === 'PLAYING' && (__motion.trangThai() || {}).che !== 'tat'`, 10000);
}
/** Cho cue id cua nhip i ban (nhat ky dao dien). Tra luc ban (perf) hoac null */
async function choCue(t, i, ids, ms = 30000) {
  const ds = JSON.stringify([].concat(ids));
  return t.cho(`(() => { const e = (__motion.nhatKy() || []).find((x) => x.nhip === ${i} && ${ds}.includes(x.id) && x.via !== 'bo'); return e ? e.firedPerf || 1 : null; })()`, ms, 80);
}
async function viTri(t) {
  return t.ev(`(() => { const bs = __lecture.beats(); const f = (p) => bs.findIndex(p);
    const tu3 = f((b) => b.kind === 'vocab' && b.data && b.data.kanji === '先生');
    return { tu1: f((b) => b.kind === 'vocab'), tu3: tu3 >= 0 ? tu3 : bs.map((b, i) => (b.kind === 'vocab' ? i : -1)).filter((i) => i >= 0)[2],
      np: f((b) => b.kind === 'grammar-intro'), vd: f((b) => b.kind === 'example'), qz: f((b) => b.kind === 'quiz'),
      kj: f((b) => b.kind === 'kanji'), kw: f((b) => b.kind === 'kaiwa'), kwi: f((b) => b.kind === 'kaiwa-intro'), n: bs.length }; })()`);
}
async function traLoi(t, dung) {
  return t.ev(`(() => { const c = document.querySelector('#sanKhauGiang .qz-card[id^="card-"]'); if (!c) return null;
    const id = c.id.replace(/^card-/, ''); const b = __lecture.beats().find((x) => x.kind === 'quiz' && x.data && x.data.id === id);
    const k = b ? b.data.correctIndex : 0; const i = ${dung ? 'k' : '(k + 1) % 4'};
    const nut = document.getElementById('btn-opt-' + id + '-' + i); if (!nut) return null; const r = nut.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, id, i, k }; })()`).then(async (p) => { if (p) await t.click(p.x, p.y); return p; });
}
async function trungId(t) { return t.ev(`(() => { const d = {}; document.querySelectorAll('[id]').forEach((e) => { d[e.id] = (d[e.id] || 0) + 1; }); return Object.keys(d).filter((k) => d[k] > 1); })()`); }

// ------------------------------------------------------------------ kiem
async function kiem(t) {
  const out = { buoc: [] };
  const ghi = (ten, dat, ct) => { out.buoc.push({ ten, dat: !!dat, ...(ct || {}) }); };
  // 1) N5-1 nhip 0..6 lien mach
  await t.coManHinh(1440, 900);
  t.log.length = 0;
  await t.moApp({ them: THEM, bai: ['N5', 1] });
  await batDau(t, 0, 6, true);
  const t0 = Date.now();
  let cd = null;
  while (Date.now() - t0 < 120000) {
    const s = await t.ev(`({ i: __lecture.index(), st: __lecture.state().lectureState, cd: __motion.cheDo() })`);
    if (s.cd && s.cd.id) cd = s.cd;
    if (s.st !== 'PLAYING') break;
    await sleep(400);
  }
  ghi('n5-1 nhip 0-6: che do bat, khong loi', cd && cd.id === ID && !locLoi(t.loi()).length, { cd, loi: locLoi(t.loi()).slice(0, 5) });
  // 2) tam dung giua nhip -> luoi tinh
  t.log.length = 0;
  await t.moApp({ them: THEM, bai: ['N5', 1] });
  await batDau(t, 2, 4);
  await sleep(2500);
  await t.bam('#autoLectureBtn');
  await sleep(700);
  const tam = await t.ev(`(() => { const sc = document.getElementById('slideContent'), st = document.getElementById('sanKhauGiang');
    return { st: __lecture.state().lectureState, san: !!(st && !st.hidden), lop: !!document.querySelector('.cd-lop'), vis: getComputedStyle(sc).visibility, inert: sc.inert, cd: __motion.cheDo() }; })()`);
  ghi('tam dung: luoi tinh hien, lop che do go', tam.st !== 'PLAYING' && !tam.san && !tam.lop && tam.vis === 'visible' && !tam.inert, tam);
  // tiep tuc: che do bat lai
  await t.bam('#autoLectureBtn');
  await t.cho(`__lecture.state().lectureState === 'PLAYING'`, 5000);
  await sleep(1800);
  const lai = await t.ev(`__motion.cheDo()`);
  ghi('giang tiep: che do bat lai', lai.id === ID && lai.lop && lai.phu, lai);
  await t.dungGiang();
  // 3) cong bai tap
  t.log.length = 0;
  const vt = await viTri(t);
  await batDau(t, vt.qz, vt.qz + 2);
  const cho = await t.cho(`(__motion.trangThai() || {}).che === 'cho'`, 40000, 150);
  await sleep(1400);
  const cong = await t.ev(`(() => { const c = document.querySelector('#sanKhauGiang .qz-card[id^="card-"]'); return { che: __motion.trangThai().che, cong: __motion.cong(), trongLop: !!(c && c.closest('.cd-lop')), chan: !!document.querySelector('.cd-lop .sk-the-chan.cd-chan') }; })()`);
  await t.chup(path.join(TUY.ra, 'kiem-cong.jpg'));
  const sai = await traLoi(t, false);
  await sleep(700);
  const kq1 = await t.ev(`(() => { const c = document.querySelector('#sanKhauGiang .qz-card[id^="card-"]'); return { sai: !!(c && c.querySelector('.qz-opt.is-wrong')), khoa: !!(c && c.querySelector('.opt-locked, .qz-opt:disabled')) }; })()`);
  await t.chup(path.join(TUY.ra, 'kiem-cong-sai.jpg'));
  const tr = await trungId(t);
  ghi('cong bai tap: the that trong o che do, cham sai giu nguyen, id khong trung', !!cho && cong.trongLop && cong.chan && sai && kq1.sai && !tr.length, { cong, kq1, trungId: tr });
  // tiep tuc -> cau sau, tra loi dung
  await t.bam(`=[...document.querySelectorAll('#sanKhauGiang button')].find(b => /Tiếp tục/.test(b.textContent))`);
  const cho2 = await t.cho(`(__motion.trangThai() || {}).che === 'cho' && __lecture.index() === ${vt.qz + 1}`, 40000, 150);
  if (cho2) await sleep(1400);
  const dung = cho2 ? await traLoi(t, true) : null;
  await sleep(900);
  const kq2 = await t.ev(`(() => { const c = document.querySelector('#sanKhauGiang .qz-card[id^="card-"]'); return { dung: !!(c && c.querySelector('.qz-opt.is-correct')), trongLop: !!(c && c.closest('.cd-lop')) }; })()`);
  await t.chup(path.join(TUY.ra, 'kiem-cong-dung.jpg'));
  ghi('cau 2: tra loi dung trong o che do', !!dung && kq2.dung && kq2.trongLop, kq2);
  await t.dungGiang();
  await sleep(500);
  const sauDung = await t.ev(`({ luoi: getComputedStyle(document.getElementById('slideContent')).visibility, the: !!document.querySelector('#slideContent [id^="card-"]'), lop: !!document.querySelector('.cd-lop') })`);
  ghi('dung: the bai tap ve luoi, lop go', sauDung.luoi === 'visible' && sauDung.the && !sauDung.lop, sauDung);
  ghi('cong bai tap: khong loi console', !locLoi(t.loi()).length, { loi: locLoi(t.loi()).slice(0, 5) });
  // 4) doi che do giua bai giang: ap o ranh gioi nhip ke tiep
  t.log.length = 0;
  await batDau(t, vt.tu1, vt.tu1 + 4);
  await choCue(t, vt.tu1, ['V0', 'V1'], 15000);
  const iTruoc = await t.ev(`__lecture.index()`);
  await t.ev(`SenseiCheDo.chon('mac-dinh')`);
  await sleep(300);
  const giua = await t.ev(`({ cd: __motion.cheDo(), i: __lecture.index() })`);
  await t.cho(`__lecture.index() > ${iTruoc}`, 30000, 100);
  await sleep(600);
  const sau = await t.ev(`({ cd: __motion.cheDo(), i: __lecture.index(), the: !!document.querySelector('#sanKhauGiang .sk-the'), phu: document.getElementById('sanKhauGiang').dataset.cdPhu })`);
  await t.ev(`SenseiCheDo.chon(${JSON.stringify(ID)})`);
  await t.cho(`__lecture.index() > ${sau.i}`, 30000, 100);
  await sleep(600);
  const lai2 = await t.ev(`({ cd: __motion.cheDo(), i: __lecture.index() })`);
  const tr2 = await trungId(t);
  ghi('doi che do giua bai: giu toi het nhip, doi o nhip sau, doi lai duoc', giua.cd.id === ID && giua.i === iTruoc && !sau.cd.id && sau.phu !== '1' && lai2.cd.id === ID && !tr2.length && !locLoi(t.loi()).length,
    { giua, sau, lai2, trungId: tr2, loi: locLoi(t.loi()).slice(0, 5) });
  await t.dungGiang();
  await t.ev(`SenseiCheDo.chon(${JSON.stringify(ID)})`);
  // 5) moi dang nhip cua nhieu bai: dung duoc, khong loi, khong trung id
  const BAI = [['N5', 10], ['N4', 30], ['N1', 3], ['KANA', 1], ['KANA', 5]];
  for (const [cap, so] of BAI) {
    t.log.length = 0;
    await t.moApp({ them: THEM, bai: [cap, so] });
    const v = await viTri(t);
    const ds = [v.tu1, v.kj, v.np, v.vd, v.kwi, v.kw].filter((x) => x != null && x >= 0);
    const moi = [];
    for (const i of ds) {
      await batDau(t, i, i + 1);
      await sleep(2600);
      const s = await t.ev(`({ i: __lecture.index(), kind: (__motion.trangThai() || {}).kind, cd: __motion.cheDo(), trong: (() => { const l = document.querySelector('.cd-lop'); if (!l) return null; const r = l.getBoundingClientRect(); let n = 0, co = 0; for (let y = .08; y < 1; y += .12) for (let x = .06; x < 1; x += .12) { n++; const e = document.elementFromPoint(r.left + r.width * x, r.top + r.height * y); if (e && e.closest('.a-o, [class*="-o"], .cd-lop > *:not(.a-cham)')) co++; } return +(co / n).toFixed(2); })() })`);
      moi.push(s);
      await t.chup(path.join(TUY.ra, `kiem-${cap}-${so}-${s.kind || i}.jpg`));
      await t.dungGiang();
    }
    const tr3 = await trungId(t);
    ghi(`${cap}-${so}: moi dang nhip do che do dung`, moi.every((s) => s.cd && s.cd.id === ID && s.cd.phu) && !locLoi(t.loi()).length && !tr3.length, { moi, loi: locLoi(t.loi()).slice(0, 4), trungId: tr3 });
  }
  // 6) giam chuyen dong: van dung, khong loi
  t.log.length = 0;
  await t.media(true);
  await t.moApp({ them: THEM, bai: ['N5', 1] });
  await batDau(t, 1, 2);
  await sleep(3000);
  const gi = await t.ev(`({ cd: __motion.cheDo(), giam: __motion.trangThai().giam })`);
  await t.chup(path.join(TUY.ra, 'kiem-giam.jpg'));
  await t.dungGiang();
  await t.media(false);
  ghi('giam chuyen dong: che do van dung, khong loi', gi.cd.id === ID && gi.giam && !locLoi(t.loi()).length, gi);
  out.dat = out.buoc.every((b) => b.dat);
  return out;
}

// ------------------------------------------------------------------ anh 6 khoanh khac
async function chupKhoanh(t, w, h) {
  await t.coManHinh(w, h);
  const ra = (ten) => path.join(TUY.ra, `${ten}-${w}.jpg`);
  const ghi = [];
  await t.moApp({ them: THEM, bai: ['N5', 1] });
  const v = await viTri(t);
  // 1) tieu de: nhip dau, sau tieng dau (Sensei chao) — truoc khi doc tu
  await batDau(t, 0, 1, true);
  await choCue(t, 0, ['V0'], 15000);
  await sleep(1300);
  await t.chup(ra('tieu-de')); ghi.push('tieu-de');
  // 2) 私: sau khi nghia hien (V3)
  await choCue(t, 0, ['V3'], 20000);
  await sleep(1100);
  await t.chup(ra('watashi')); ghi.push('watashi');
  await t.dungGiang();
  // 3) 先生: sau luu y (V4) hoac nghia
  await batDau(t, v.tu3, v.tu3 + 1);
  (await choCue(t, v.tu3, ['V4'], 16000)) || (await choCue(t, v.tu3, ['V3'], 8000));
  await sleep(1000);
  await t.chup(ra('sensei')); ghi.push('sensei');
  await t.dungGiang();
  // 4) cong thuc: mau cau dau, sau khi du khoi + giai thich
  await batDau(t, v.np, v.np + 2);
  (await choCue(t, v.np, ['G4.0', 'G4.1'], 20000));
  await sleep(1400);
  await t.chup(ra('cong-thuc')); ghi.push('cong-thuc');
  // 5) vi du: chay tiep sang vi du dau (ghep vao mau), sau nghia (E5)
  await t.cho(`__lecture.index() === ${v.vd}`, 40000, 100);
  (await choCue(t, v.vd, ['E5'], 25000));
  await sleep(900);
  await t.chup(ra('vi-du')); ghi.push('vi-du');
  await t.dungGiang();
  // 6) bai tap: den luot hoc vien, tra loi dung
  await batDau(t, v.qz, v.qz + 1);
  await t.cho(`(__motion.trangThai() || {}).che === 'cho'`, 40000, 150);
  await sleep(1400);   // o bai tap cua che do con dang lon ra (FLIP ~0.9 s): bam khi da dung yen
  await traLoi(t, true);
  await sleep(1300);
  await t.chup(ra('bai-tap-dung')); ghi.push('bai-tap-dung');
  await t.dungGiang();
  return ghi;
}

// ------------------------------------------------------------------ khung ban mau (__seek)
async function chupBanMau(ch) {
  if (!PROTO) return { loi: 'khong tim thay ban mau' };
  const thu = path.dirname(path.dirname(PROTO));    // demo-bai1/ hoac demo2/
  const goc = await moServer(thu);
  const t = new Trang(ch.cdp, goc);
  await t.batDau(1920, 1080);
  const url = `${goc}/${ID}/index.html?render=1`;
  await t.c.send('Page.navigate', { url });
  await t.cho(`!!(window.__ready)`, 30000);
  await t.ev(`window.__ready.then(() => true)`);
  const ds = [];
  for (const k of KHOANH) {
    await t.ev(`window.__seek(${k.t}); true`);
    await sleep(120);
    const f = path.join(TUY.ra, `mau-${k.ten}.jpg`);
    await t.chup(f);
    ds.push(f);
  }
  return { ds };
}
async function soSanh() {
  const hang = [];
  const tmp = path.join(TAM, 'ss-' + ID);
  fs.mkdirSync(tmp, { recursive: true });
  for (const k of KHOANH) {
    const mau = path.join(TUY.ra, `mau-${k.ten}.jpg`), rong = path.join(TUY.ra, `${k.ten}-1440.jpg`), hep = path.join(TUY.ra, `${k.ten}-390.jpg`);
    if (![mau, rong, hep].every((f) => fs.existsSync(f))) continue;
    const f = path.join(tmp, `hang-${k.ten}.jpg`);
    await ffmpeg(['-i', mau, '-i', rong, '-i', hep, '-filter_complex',
      `[0]scale=1600:900,pad=1620:900:0:0:white[a];[1]scale=1440:900,pad=1460:900:0:0:white[b];[2]scale=416:900[c];[a][b][c]hstack=3,drawtext=fontfile=arial.ttf:text='${k.ten}  t=${k.t}s  | ban mau | 1440x900 | 390x844':x=16:y=16:fontsize=34:fontcolor=white:box=1:boxcolor=black@0.6`,
      '-frames:v', '1', '-q:v', '3', f]);
    hang.push(f);
  }
  if (!hang.length) return { loi: 'thieu anh' };
  const ra = path.join(TUY.ra, 'so-sanh.jpg');
  const vao = hang.flatMap((f) => ['-i', f]);
  await ffmpeg([...vao, '-filter_complex', `${hang.map((_, i) => `[${i}]`).join('')}vstack=${hang.length},scale=iw*0.5:-1`, '-frames:v', '1', '-q:v', '3', ra]);
  fs.rmSync(tmp, { recursive: true, force: true });
  return { ra, hang: hang.length };
}

// ------------------------------------------------------------------ video (screencast)
async function video(t) {
  await t.coManHinh(1440, 900);
  await t.moApp({ them: THEM, bai: ['N5', 1] });
  const thu = path.join(TAM, 'sc-' + ID);
  fs.rmSync(thu, { recursive: true, force: true });
  fs.mkdirSync(thu, { recursive: true });
  const khung = [];
  t.c.on('Page.screencastFrame', (p) => {
    const f = path.join(thu, `f${String(khung.length).padStart(5, '0')}.jpg`);
    fs.writeFileSync(f, Buffer.from(p.data, 'base64'));
    khung.push({ f, ts: p.metadata.timestamp });
    t.c.send('Page.screencastFrameAck', { sessionId: p.sessionId }).catch(() => {});
  });
  await t.c.send('Page.startScreencast', { format: 'jpeg', quality: 82, maxWidth: 1440, maxHeight: 900, everyNthFrame: 1 });
  if (TUY.tu) { const v = await viTri(t); const i = v[TUY.tu] != null ? v[TUY.tu] : +TUY.tu; await batDau(t, i, i + 8); }
  else await batDau(t, 0, 8, true);
  const t0 = Date.now();
  while (Date.now() - t0 < TUY.giay * 1000) {
    const s = await t.ev(`({ che: (__motion.trangThai() || {}).che, st: __lecture.state().lectureState })`);
    if (s.che === 'cho') { await sleep(600); await traLoi(t, true); }
    if (s.st !== 'PLAYING') break;
    await sleep(250);
  }
  await t.c.send('Page.stopScreencast');
  await t.dungGiang();
  if (khung.length < 5) return { loi: 'qua it khung ' + khung.length };
  const ds = path.join(thu, 'ds.txt');
  const dong = [];
  for (let i = 0; i < khung.length; i++) {
    const d = i + 1 < khung.length ? Math.max(0.001, khung[i + 1].ts - khung[i].ts) : 0.04;
    dong.push(`file '${khung[i].f.replace(/\\/g, '/')}'`, `duration ${d.toFixed(4)}`);
  }
  dong.push(`file '${khung[khung.length - 1].f.replace(/\\/g, '/')}'`);
  fs.writeFileSync(ds, dong.join('\n'));
  const ra = path.join(TUY.ra, `demo-${ID}${TUY.ten}.mp4`);
  await ffmpeg(['-f', 'concat', '-safe', '0', '-i', ds, '-vf', 'fps=30,scale=1440:900:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-movflags', '+faststart', ra]);
  const giay = khung[khung.length - 1].ts - khung[0].ts;
  const soKhung = khung.length;
  fs.rmSync(thu, { recursive: true, force: true });
  return { ra, soKhung, giay: +giay.toFixed(1), fpsTB: +(soKhung / giay).toFixed(1) };
}

// ------------------------------------------------------------------ chay
const goc = await moServer();
const ch = await moChrome();
try {
  const t = new Trang(ch.cdp, goc);
  await t.batDau();
  if (TUY.phan.includes('kiem')) { KQ.phan.kiem = await kiem(t); }
  if (TUY.phan.includes('anh')) {
    KQ.phan.anh = {};
    for (const [w, h] of MAN) { t.log.length = 0; KQ.phan.anh[w] = await chupKhoanh(t, w, h); KQ.phan.anh['loi' + w] = locLoi(t.loi()).slice(0, 5); }
  }
  if (TUY.phan.includes('video')) KQ.phan.video = await video(t);
  if (TUY.phan.includes('so-sanh')) {
    const ch2 = await moChrome({ w: 1920, h: 1080 });
    try { KQ.phan.banMau = await chupBanMau(ch2); } finally { await ch2.dong(); }
    KQ.phan.soSanh = await soSanh();
  }
  KQ.loi = locLoi(t.loi()).slice(0, 10);
} catch (e) {
  KQ.hong = String(e && e.stack || e);
} finally {
  await ch.dong();
  await donDep();
}
fs.writeFileSync(path.join(TUY.ra, 'ket-qua.json'), JSON.stringify(KQ, null, 1));
console.log(JSON.stringify(KQ, null, 1));
