// quet-bai.mjs — QUET BO CUC TOAN GIAO TRINH cho mot che do san khau (js/che-do/<k>.js): moi bai (curriculum/kana, n5..n1), moi
// dang nhip, nhip co noi dung DAI NHAT va NGAN NHAT, tieu de, mot the chuong, the ket bai, bai tap (cho + tra loi sai).
// Ket qua la VAN BAN (JSON + Markdown) cho nguoi sua che do; khong sua ma nguon app.
//
//   node tools/che-do/quet-bai.mjs <che-do a..j> [--man 1440|390] [--cap KANA,N5,...] [--bai N5-3,KANA-1,...] [--so-mau 2]
//                                  [--ra DIR] [--r 0.04] [--anh] [--anh-moi] [--tiep] [--log FILE] [--khong-giu] [--ten TEN]
//     --man      chi mot man hinh (1440x900 hoac 390x844); mac dinh ca hai, hai Chrome song song
//     --cap      chi cac cap nay (KANA, N5, N4, N3, N2, N1); --bai: danh sach bai cu the (uu tien hon --cap)
//     --so-mau N so nhip moi dang: dai nhat, ngan nhat, dai thu 2, ngan thu 2, ... (mac dinh 2)
//     --nhip 1,30,38  (kiem thu) do DUNG cac chi so nhip nay thay cho dai/ngan nhat (van co tieu de, the chuong, the ket bai)
//     --ra DIR   thu muc ket qua (mac dinh E:/sensei-tam/tmp/quet); tep quet-<k>-<man|ca>[-TEN].json/.md/.log
//     --r S      giay moi don vi tieng cua mo phong (mac dinh 0.04 = nhanh; app mac dinh 0.15)
//     --anh      luu JPG cho moi diem do co FAIL (DIR/anh/<k>-<man>/...);  --anh-moi: luu JPG moi diem do (de xem lai)
//     --tiep     doc JSON cu, bo qua bai da quet xong (chay tiep sau khi hong)
//     --khong-giu  khong "giu nhip" (xem duoi) — de so sanh
//   Exit 0: khong co FAIL; 1: co FAIL hoac khong do duoc gi; 2: sai cach dung.
//
// CACH DO. Mock lecture ?noLive&moPhong&hat=7&sensei=video&phongCach=<k>&r=<r> (khong bao gio mo Gemini Live). Moi man hinh mot Chrome
// (cdp-lib, --remote-debugging-pipe) nap trang MOT lan, doi bai bang window.jumpToLesson (che do / CSS nap mot lan -> ca luot do cung
// mot phien ban; hash cac tep ghi trong JSON). Moi bai:
//   - chon nhip: voi MOI dang nhip co trong bai (vocab, kanji, grammar-intro, example, kaiwa-intro, kaiwa-run, kaiwa, quiz) lay nhip co
//     "do dai noi dung" lon nhat va nho nhat (dsNhipTrang: ky tu Nhat tinh 2): vocab = chu + kana + nghia + ghi chu am; kanji = chu + Han
//     Viet + nghia + am On/Kun + tu ghep + meo nho / so sanh (kana); grammar-intro = ten + 1,5 x cong thuc + giai thich + luu y; example /
//     kaiwa = token (+ 0,5 furigana) + nghia (+ nguoi noi); quiz = cau hoi + dap an; kaiwa-intro / kaiwa-run = ca doan.
//   - TIEU DE: startFrom(0) (laBatDau, nhip 0 -> canh mo bai), do sau cue V0 + 1,3 s (nhu do-bo-cuc); nhip 0 neu duoc chon do tiep.
//   - nhip thuong: datDen(i+1), startFrom(i), cho moi cue cua nhip chay xong (nhu do-bo-cuc choCue) + 1,2 s + cho canh DUNG YEN (<= 4 %
//     phan tu chu doi > 2 px / opacity qua 150 ms, toi da 3 s), do 2 lan cach 0,6 s, chi giu van de co o CA HAI lan VA cung vi tri
//     (lech <= 2 px; phan tu con chay hieu ung bi bo, dem o diem.dangChay). "GIU NHIP": trong luc do, window.__audioEngine.isPlaybackActive() bao "con tieng" -> app khong sang nhip
//     (checkAutoLectureStepComplete dung o "loa con doc"), canh cuoi cua nhip dung yen den khi do xong (mock r nho -> tieng ngan, khong
//     giu thi nhip ke len truoc khi do). Diem do chi hop le khi __lecture.index() van la i va khong co the chuong / ket bai chen vao.
//   - kaiwa-run (client tu phat ca doan, khong giu duoc): do cuon moi ~0,7 s, giu cap do hop le cuoi cung.
//   - quiz: cho luot hoc vien (che === 'cho') + 1,4 s -> do; bam dap an SAI -> + 1,6 s (dau X + bang giai thich) -> do.
//   - THE CHUONG: mot chuong moi bai (xoay vong kanji / grammar / kaiwa / quiz theo so bai): chay nhip ngay truoc chuong, cho theChuong
//     cua che do duoc goi (bao ham nhu do-bo-cuc); khoang nghi 1,6 s cua app duoc KEO DAI them 2,6 s (boc SenseiMotion.khiHetNhip: chi
//     setTimeout ngay sau no voi do tre = gapMs) vi trang co the ban ~1,4 s luc dung the; + 0,5 s + dung yen, do 2 lan cach 0,3 s.
//   - THE KET BAI: nhip quiz cuoi (neu da chon thi noi tiep sau lan do sai, khong thi tra loi dung), cho theXong + 1,2 s, do 2 lan.
// Phep do: doTrang() cua do-bo-cuc.mjs (doc NGUYEN VAN ham tu tep do, cung nguong TH / CHO_PHEP / VUNG_CAM / cheDoTuyChon) = CLIPPED /
// CLIPPED-ELLIPSIS / ON-CAT / UNDER-DECOR / TEXT-OVERLAP / SMALL-TYPE / HIDDEN-TEXT, phan loai FAIL/WARN/INFO nhu phanTich() cua do-bo-cuc
// (ke ca nenTang -> INFO); va doThem() cua quet-trang.mjs = ORPHAN / WORD-SPLIT / EDGE / OVERFLOW-BOX / OCCLUDED / CLIP-PATH (WARN).
// Ket qua: JSON (moi van de: che do, man hinh, bai, chi so nhip, dang, cach chon, phan tu, chu, so do) + Markdown gom theo
// (loai, phan tu, dang nhip): so lan, so bai, vi du xau nhat. Ghi lai sau MOI bai (xem duoc khi dang chay); tien do + ETA vao tep .log.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Trang, sleep } from './khung/cdp-lib.mjs';
import { moChromeGon } from './quet-chrome.mjs';   // Chrome nhu cdp-lib.moChrome, ho so tam gon (~20 MB)
import { moServer, donServer } from './bo-cuc-may.mjs';
import { doThem } from './quet-trang.mjs';

const DU_AN = path.resolve(import.meta.dirname, '../..');

// ---------------------------------------------------------------- tham so
const av = process.argv.slice(2);
const ID = av[0];
const DUNG = 'dung: node tools/che-do/quet-bai.mjs <a..j> [--man 1440|390] [--cap KANA,N5] [--bai N5-3,KANA-1] [--so-mau 2] [--nhip i,j] [--ra DIR] [--r 0.04] [--anh] [--anh-moi] [--tiep] [--log FILE] [--khong-giu] [--ten TEN]';
if (!ID || !/^[a-z]$/.test(ID)) { console.error(DUNG); process.exit(2); }
const TUY = { man: null, cap: null, bai: null, nhip: null, soMau: 2, ra: 'E:/sensei-tam/tmp/quet', r: 0.04, anh: false, anhMoi: false, tiep: false, log: null, giu: true, ten: '' };
for (let i = 1; i < av.length; i++) {
  const a = av[i];
  if (a === '--man') TUY.man = +av[++i];
  else if (a === '--cap') TUY.cap = av[++i].toUpperCase().split(',').filter(Boolean);
  else if (a === '--bai') TUY.bai = av[++i].toUpperCase().split(',').filter(Boolean);
  else if (a === '--so-mau') TUY.soMau = Math.max(1, +av[++i] || 2);
  else if (a === '--nhip') TUY.nhip = av[++i].split(',').map(Number).filter((x) => x >= 0);
  else if (a === '--ra') TUY.ra = av[++i];
  else if (a === '--r') TUY.r = +av[++i];
  else if (a === '--anh') TUY.anh = true;
  else if (a === '--anh-moi') { TUY.anh = true; TUY.anhMoi = true; }
  else if (a === '--tiep') TUY.tiep = true;
  else if (a === '--log') TUY.log = av[++i];
  else if (a === '--khong-giu') TUY.giu = false;
  else if (a === '--ten') TUY.ten = av[++i];
  else { console.error('tham so la: ' + a + '\n' + DUNG); process.exit(2); }
}
if (TUY.man && ![1440, 390].includes(TUY.man)) { console.error('--man chi nhan 1440 hoac 390'); process.exit(2); }
if (!(TUY.r > 0)) { console.error('--r phai > 0'); process.exit(2); }
const MAN = [[1440, 900], [390, 844]].filter(([w]) => !TUY.man || w === TUY.man);
const TEN = `quet-${ID}-${TUY.man || 'ca'}${TUY.ten ? '-' + TUY.ten : ''}`;
TUY.ra = path.resolve(TUY.ra);
fs.mkdirSync(TUY.ra, { recursive: true });
const F_JSON = path.join(TUY.ra, TEN + '.json'), F_MD = path.join(TUY.ra, TEN + '.md'), F_LOG = TUY.log ? path.resolve(TUY.log) : path.join(TUY.ra, TEN + '.log');
const D_ANH = path.join(TUY.ra, 'anh', `${ID}-${TUY.man || 'ca'}${TUY.ten ? '-' + TUY.ten : ''}`);
if (TUY.anh) fs.mkdirSync(D_ANH, { recursive: true });
const THEM = `&phongCach=${ID}&sensei=video&r=${TUY.r}`;

// ---------------------------------------------------------------- doTrang + nguong cua do-bo-cuc.mjs (doc nguyen van tu tep, khong sao chep)
const SRC = fs.readFileSync(path.join(import.meta.dirname, 'do-bo-cuc.mjs'), 'utf8');
/** Khoi ma tu dong bat dau bang `dau` den dong dau tien bat dau bang '}' o cot 0 (kieu viet cua do-bo-cuc) */
function layKhoi(dau) {
  const i = SRC.indexOf(dau);
  if (i < 0) throw new Error('do-bo-cuc.mjs khong con "' + dau + '" — cap nhat quet-bai.mjs');
  const re = /\n\}[^\n]*(\n|$)/g;
  re.lastIndex = i;
  const m = re.exec(SRC);
  if (!m) throw new Error('khong tim thay cuoi khoi "' + dau + '"');
  return SRC.slice(i, m.index + m[0].length);
}
const DO_TRANG_SRC = layKhoi('function doTrang(opt) {');
const TH = new Function(layKhoi('const TH = {') + '\nreturn TH;')();
const CHO_PHEP = new Function(layKhoi('const CHO_PHEP = {') + '\nreturn CHO_PHEP;')();
const VUNG_CAM = new Function((/\nconst VUNG_CAM = [^\n]*;/.exec(SRC) || ['const VUNG_CAM = {};'])[0] + '\nreturn VUNG_CAM;')();
const cheDoTuyChon = new Function('TH', 'CHO_PHEP', 'VUNG_CAM', 'ID', layKhoi('const cheDoTuyChon = ') + '\nreturn cheDoTuyChon;')(TH, CHO_PHEP, VUNG_CAM, ID);
new Function('return (' + DO_TRANG_SRC + ')');   // kiem cu phap ngay (loi = do-bo-cuc doi kieu viet)
const DO_THEM_SRC = doThem.toString();
// nguong cua phep do them (quet-trang.mjs)
const TH2 = { opMin: 0.25, mepNgang: 4, mepDoc: 1 };   // EDGE: < 4 px ngang / < 1 px doc (hop net do bang canvas)
const OPT_A = cheDoTuyChon({ tokens: null });
const OPT_B = { opMin: TH2.opMin, meoPadTop: TH.meoPadTop, inkTop: TH.inkTop, inkBottom: TH.inkBottom, mepNgang: TH2.mepNgang, mepDoc: TH2.mepDoc, trangTri: OPT_A.trangTri || [] };
const NEN_TANG = (CHO_PHEP.theoChedo[ID] || {}).nenTang || [];

// ---------------------------------------------------------------- danh sach bai
const CAP_DS = ['KANA', 'N5', 'N4', 'N3', 'N2', 'N1'];
function dsBai() {
  if (TUY.bai) return TUY.bai.map((s) => { const m = /^(KANA|N[1-5])-(\d+)$/.exec(s); if (!m) { console.error('bai sai: ' + s); process.exit(2); } return [m[1], +m[2]]; });
  const out = [];
  for (const cap of CAP_DS) {
    if (TUY.cap && !TUY.cap.includes(cap)) continue;
    const d = path.join(DU_AN, 'curriculum', cap.toLowerCase());
    const so = fs.readdirSync(d).map((f) => /^(\d+)\.json$/.exec(f)).filter(Boolean).map((m) => +m[1]).sort((a, b) => a - b);
    so.forEach((n) => out.push([cap, n]));
  }
  return out;
}
const BAI = dsBai();
const baiFile = (cap, so) => JSON.parse(fs.readFileSync(path.join(DU_AN, 'curriculum', cap.toLowerCase(), so + '.json'), 'utf8'));
const hashTep = () => {
  const o = {};
  for (const f of [`js/che-do/${ID}.js`, `css/che-do/${ID}.css`, 'js/che-do/che-do.js', 'css/che-do/chung.css', 'js/motion.js']) {
    try { const b = fs.readFileSync(path.join(DU_AN, f)); o[f] = crypto.createHash('sha1').update(b).digest('hex').slice(0, 10) + ' ' + fs.statSync(path.join(DU_AN, f)).mtime.toISOString(); } catch (e) { o[f] = null; }
  }
  return o;
};

// ---------------------------------------------------------------- ghi tien do
const T0 = Date.now();
const phut = (ms) => { const s = Math.round(ms / 1000); return `${Math.floor(s / 3600)}h${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m${String(s % 60).padStart(2, '0')}s`; };
function ghiLog(s) {
  const d = `[${new Date().toISOString().slice(11, 19)} +${phut(Date.now() - T0)}] ${s}`;
  try { fs.appendFileSync(F_LOG, d + '\n'); } catch (e) {}
  console.log(d);
}

// =================================================================================================
//  TRONG TRANG
// =================================================================================================
/** Danh sach nhip + do dai noi dung (ky tu Nhat tinh 2) */
function dsNhipTrang() {
  const W = (s) => { let n = 0; for (const c of String(s == null ? '' : s)) n += /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/.test(c) ? 2 : 1; return n; };
  const tok = (ts) => (ts || []).reduce((a, t) => a + W(t.kanji || t.text) + 0.5 * W(t.kanji && t.furigana ? t.furigana : ''), 0);
  const tokTxt = (ts) => (ts || []).map((t) => t.kanji || t.text).join('');
  return __lecture.beats().map((b, i) => {
    const d = b.data || {};
    let len = 0, tom = '';
    if (b.kind === 'vocab') { len = W(d.kanji || d.word) + (d.furigana && d.furigana !== (d.kanji || d.word) ? W(d.furigana) : 0) + W(d.meaningVi) + W(d.accentNote); tom = (d.kanji || d.word) + ' = ' + d.meaningVi; }
    else if (b.kind === 'kanji') { len = W(d.character) + W(d.hanViet) + W(d.meaningVi) + W((d.onyomi || []).join(' ')) + W((d.kunyomi || []).join(' ')) + (d.commonWords || []).reduce((a, w) => a + W(w.word) + W(w.furigana) + W(w.meaningVi), 0) + W(d.meoNho) + W(d.sosanh); tom = d.character + ' ' + (d.hanViet || d.romaji || '') + ' ' + (d.meaningVi || ''); }
    else if (b.kind === 'grammar-intro') { len = W(d.title) + 1.5 * W(d.grammarFormula) + W(d.explanation) + W(d.teacherTips); tom = d.grammarFormula; }
    else if (b.kind === 'example') { len = tok(d.tokens) + W(d.meaningVi); tom = tokTxt(d.tokens); }
    else if (b.kind === 'kaiwa') { len = tok(d.tokens) + W(d.meaningVi) + W(d.speaker); tom = d.speaker + ': ' + tokTxt(d.tokens); }
    else if (b.kind === 'kaiwa-intro' || b.kind === 'kaiwa-run') { const ds = Array.isArray(b.data) ? b.data : []; len = ds.reduce((a, x) => a + tok(x.tokens) + W(x.meaningVi), 0); tom = ds.length + ' lines'; }
    else if (b.kind === 'quiz') { len = W(d.question) + (d.options || []).reduce((a, o) => a + W(o), 0); tom = d.question; }
    return { i, kind: b.kind, chapter: b.chapter, dau: !!b.isChapterStart, len: Math.round(len), tom: String(tom == null ? '' : tom).replace(/\s+/g, ' ').slice(0, 70), id: d.id || null };
  });
}
/** Bao: theChuong / theXong cua che do (luc goi) + giu nhip (isPlaybackActive). Goi lai sau moi lan doi bai (def co the duoc tao lai). */
function caiBaoTrang(ID) {
  const d = window.SenseiCheDo && SenseiCheDo.def(ID);
  if (!d) return 'khong co def';
  if (!window.__probeThe) window.__probeThe = { theChuong: 0, theXong: 0 };
  ['theChuong', 'theXong'].forEach((k) => { if (typeof d[k] === 'function' && !d['__p' + k]) { const f = d[k]; d['__p' + k] = 1; d[k] = function () { window.__probeThe[k] = performance.now(); return f.apply(this, arguments); }; } });
  // keo dai khoang nghi sau khiHetNhip (the chuong 1,6 s) khi window.__keoGap.bat: chi lenh setTimeout NGAY SAU khiHetNhip (app.js hen
  // sang nhip ke, cung tac vu) co do tre = gapMs moi bi keo them __keoGap.them ms — de do duoc the chuong khi trang ban (dung the nang)
  const sm = window.SenseiMotion;
  if (sm && !sm.__keoBoc && typeof sm.khiHetNhip === 'function') {
    const f0 = sm.khiHetNhip;
    sm.khiHetNhip = function (o) {
      const r = f0.apply(this, arguments);
      const k = window.__keoGap;
      if (k && k.bat && o && o.gapMs) {
        const st0 = window.setTimeout, gap = o.gapMs;
        window.setTimeout = function (fn, ms) { window.setTimeout = st0; const a = Array.prototype.slice.call(arguments, 2); if (ms === gap) { ms = gap + k.them; k.lan = (k.lan || 0) + 1; } return st0.apply(window, [fn, ms].concat(a)); };
        Promise.resolve().then(() => { window.setTimeout = st0; });
      }
      return r;
    };
    sm.__keoBoc = 1;
  }
  const ae = window.__audioEngine;
  if (!ae) return 'khong co __audioEngine';
  if (!ae.__giuBoc) { const f = ae.isPlaybackActive; ae.isPlaybackActive = function () { return window.__giuNhip ? true : f.apply(this, arguments); }; ae.__giuBoc = 1; }
  return 'ok';
}

// =================================================================================================
//  NODE: dieu khien
// =================================================================================================
// cai MOT lan vao trang (sau moi lan nap trang): window.__qb.do() = doTrang + doThem + trang thai truoc / sau (moi lan do chi goi ham ngan)
const EXPR_CAI = `(() => { window.__qb = { doTrang: (${DO_TRANG_SRC}), doThem: (${DO_THEM_SRC}), optA: ${JSON.stringify(OPT_A)}, optB: ${JSON.stringify(OPT_B)} };
  window.__qb.do = () => { const s = () => Object.assign({ i: __lecture.index(), che: (__motion.trangThai() || {}).che, st: __lecture.state().lectureState, lop: !!document.querySelector('.cd-lop') }, window.__probeThe || {});
    const s0 = s(); const t0 = performance.now(); let a, b;
    try { a = __qb.doTrang(__qb.optA); } catch (e) { a = { ok: false, lyDo: 'doTrang loi: ' + String(e && e.message || e).slice(0, 160) }; }
    try { b = __qb.doThem(__qb.optB); } catch (e) { b = { ok: false, lyDo: 'doThem loi: ' + String(e && e.message || e).slice(0, 160) }; }
    return { a, b, s0, s1: s(), ms: Math.round(performance.now() - t0) }; };
  return true; })()`;

/** Mot lan do (doTrang + doThem) + trang thai truoc / sau */
async function doMot(t) {
  if (!(await t.ev(`!!(window.__qb && __qb.do)`))) await t.ev(EXPR_CAI);
  return t.ev(`__qb.do()`);
}

/** Hai lan do cach gap ms; chup anh (base64) ngay sau lan 2 neu --anh */
const DONG_BANG = `(() => { try { const s = window.SenseiBoard && SenseiBoard.trangThai(); if (s && s.bangDangMo) { SenseiBoard.dongBang(); return true; } } catch (e) {} return false; })()`;
async function doCap(t, gap) {
  // Bang cua Sensei (aside#bangPhan, ngoai che do) do cong cu cua mo phong mo ra se che san khau: cat di truoc khi do, ghi lai
  const bangMo = await t.ev(DONG_BANG).catch(() => false);
  if (bangMo) await sleep(350);
  const m1 = await doMot(t);
  await sleep(gap);
  const m2 = await doMot(t);
  let anh = null;
  if (TUY.anh) { try { anh = (await t.c.send('Page.captureScreenshot', { format: 'jpeg', quality: 72 })).data; } catch (e) {} }
  return { m1, m2, anh, bangMo };
}

/** Hinh hoc cua chu nhin thay trong .cd-lop: [l, t, w, opacity x 10] moi phan tu chua chu (thu tu DOM) — de cho canh dung yen */
function chuKyTrang() {
  const lop = document.querySelector('.cd-lop');
  if (!lop) return null;
  const tw = document.createTreeWalker(lop, NodeFilter.SHOW_TEXT);
  const da = new Set();
  const out = [];
  let x;
  while ((x = tw.nextNode())) {
    const el = x.parentElement;
    if (!el || da.has(el) || !x.nodeValue.trim()) continue;
    da.add(el);
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.right < 0 || r.left > innerWidth) continue;
    let op = 1;
    for (let e = el; e && e !== lop.parentElement; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity) || 0;
    out.push(Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(op * 10));
  }
  return out;
}
/** Cho canh dung yen: hai lan doc cach 150 ms, so phan tu doi (> 2 px / opacity) <= max(1, 4 %) — mot the dung dua nhe khong chan.
 *  Toi da ms. Tra ve true neu dung yen */
async function choOnDinh(t, ms) {
  const t0 = Date.now();
  const doc = () => t.ev(`(${chuKyTrang.toString()})()`).catch(() => null);
  let a = await doc();
  while (Date.now() - t0 < ms) {
    await sleep(150);
    const b = await doc();
    if (a && b && a.length === b.length) {
      let doi = 0;
      for (let k = 0; k < a.length; k += 4) if (Math.abs(a[k] - b[k]) > 2 || Math.abs(a[k + 1] - b[k + 1]) > 2 || Math.abs(a[k + 2] - b[k + 2]) > 2 || a[k + 3] !== b[k + 3]) doi++;
      if (doi <= Math.max(1, Math.round(a.length / 4 * 0.04))) return true;
    }
    a = b;
  }
  return false;
}

async function dungHan(t) {
  try { await t.ev(`window.__giuNhip = false; true`); } catch (e) {}
  for (let k = 0; k < 3; k++) {
    let st;
    try { st = await t.ev(`__lecture.state().lectureState`); } catch (e) { return; }
    if (st !== 'PLAYING') break;
    await t.bam('#autoLectureBtn');
    if (await t.cho(`__lecture.state().lectureState !== 'PLAYING'`, 4000)) break;
  }
  await t.cho(`(__motion.trangThai() || {}).che === 'tat'`, 3000);
}

/** Bat nhip i (dung truoc). giu: giu nhip; den: datDen */
async function batNhip(t, i, giu, den) {
  await dungHan(t);
  await t.ev(`window.__giuNhip = ${!!giu}; __moPhong.datDen(${den == null ? 'null' : den}); window.__probeThe = { theChuong: 0, theXong: 0 }; window.__keoGap = { bat: false }; ${DONG_BANG}; true`);
  await t.ev(`__lecture.startFrom(${i}).then(() => true)`);
  return t.cho(`__lecture.state().lectureState === 'PLAYING' && (__motion.trangThai() || {}).che !== 'tat' && __lecture.index() === ${i}`, 15000, 100);
}

/** Cho moi cue cua nhip i da chay (hoac bi bo) — giong choCue cua do-bo-cuc. 'xong' | 'doi' | 'tat' | 'het-gio' */
async function choCue(t, i, ms = 60000) {
  const t0 = Date.now();
  let khongCue = 0;
  while (Date.now() - t0 < ms) {
    let r;
    try {
      r = await t.ev(`(() => { if (__lecture.index() !== ${i}) return 'doi'; const ts = __motion.trangThai() || {}; if (ts.che === 'tat') return 'tat';
        const cs = __motion.cues(); if (!cs.length) return 'khong';
        return cs.every((c) => c.firedPerf || c.via === 'bo') ? 'xong' : 'cho'; })()`);
    } catch (e) { r = 'cho'; }
    if (r === 'xong' || r === 'doi' || r === 'tat') return r;
    if (r === 'khong') { if (++khongCue > 25) return 'xong'; } else khongCue = 0;
    await sleep(80);
  }
  return 'het-gio';
}

async function traLoi(t, dung) {
  const p = await t.ev(`(() => { const c = document.querySelector('#sanKhauGiang .qz-card[id^="card-"]'); if (!c) return null;
    const id = c.id.replace(/^card-/, ''); const b = __lecture.beats().find((x) => x.kind === 'quiz' && x.data && x.data.id === id);
    const k = b ? b.data.correctIndex : 0; const n = b && b.data.options ? b.data.options.length : 4; const i = ${dung ? 'k' : '(k + 1) % n'};
    const nut = document.getElementById('btn-opt-' + id + '-' + i); if (!nut) return null; const r = nut.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, i, k, id }; })()`);
  if (!p) return p;
  await t.click(p.x, p.y);
  // bam that khong an (bi lop khac che nut): sau 1,5 s van chua cham -> bam bang DOM
  const daCham = `(() => { const c = document.getElementById(${JSON.stringify('card-' + p.id)}); return !!(c && c.querySelector('.qz-opt.is-correct, .qz-opt.is-wrong, .opt-locked, .qz-opt:disabled')); })()`;
  if (!(await t.cho(daCham, 1500, 100))) {
    await t.ev(`(() => { const n = document.getElementById('btn-opt-' + ${JSON.stringify(p.id)} + '-' + ${p.i}); if (n) n.click(); return !!n; })()`);
    p.domClick = true;
  }
  return p;
}
const bamTiepTuc = (t) => t.bam(`=[...document.querySelectorAll('#sanKhauGiang button')].find(b => /Tiếp tục/.test(b.textContent))`).catch(() => null);

// ---------------------------------------------------------------- chon nhip
const CHUONG_XOAY = ['kanji', 'grammar', 'kaiwa', 'quiz'];
function chonNhip(ds, soMau) {
  const theo = new Map();
  for (const b of ds) { if (!theo.has(b.kind)) theo.set(b.kind, []); theo.get(b.kind).push(b); }
  const chon = new Map();
  theo.forEach((a0, kind) => {
    const a = a0.slice().sort((x, y) => y.len - x.len || x.i - y.i);
    const n = Math.min(soMau, a.length);
    let lo = 0, hi = a.length - 1;
    for (let k = 0; k < n; k++) {
      const dai = k % 2 === 0;
      const b = dai ? a[lo++] : a[hi--];
      const bac = Math.floor(k / 2) + 1;
      let nhan = a.length === 1 ? 'duy-nhat' : (dai ? 'dai' : 'ngan') + (bac > 1 ? '-' + bac : '');
      const cu = chon.get(b.i);
      if (cu) cu.nhan += '+' + nhan; else chon.set(b.i, Object.assign({}, b, { nhan }));
    }
  });
  return [...chon.values()].sort((x, y) => x.i - y.i);
}

// ---------------------------------------------------------------- phan loai (giong phanTich() cua do-bo-cuc cho cac phep do tinh)
const elTen = (c) => `${c.tag}${c.cls ? '.' + c.cls : ''}`;
const rc = (r) => r ? `x=${r.l} y=${r.t} w=${r.w} h=${r.h}` : '';
const so0 = Math.round;
/** d: { man, bai, i, kind, nhan, kq: { m1, m2 } } -> danh sach van de */
function phanLoai(d) {
  const out = [];
  const A1 = d.kq.m1.a, A2 = d.kq.m2.a, B1 = d.kq.m1.b, B2 = d.kq.m2.b;
  // duong dan chu ngoai san khau / mat sau the lat (doThem, ca hai lan do)
  const ngoai = new Set([...((B1 && B1.ngoai) || []), ...((B2 && B2.ngoai) || [])]);
  const sau = new Set([...((B1 && B1.matSau) || []), ...((B2 && B2.matSau) || [])]);
  const them = (khoa, sev, loai, c, mo, so, score) => {
    if (sev !== 'INFO' && NEN_TANG.some((k) => khoa.startsWith(k))) { sev = 'INFO'; mo = '[baseline do-bo-cuc] ' + mo; }
    if (sev !== 'INFO' && String(c.path || '').split(' + ').some((p) => sau.has(p))) { sev = 'INFO'; mo = '[back face / collapsed (flip) element] ' + mo; }
    if (sev !== 'INFO' && loai === 'HIDDEN-TEXT' && ngoai.has(c.path)) { sev = 'INFO'; mo = '[offstage: outside .cd-lop] ' + mo; }
    out.push({ che: ID, man: d.man, bai: d.bai, i: d.i, kind: d.kind, chon: d.nhan, loai, sev, el: elTen(c), path: c.path, txt: c.txt, mo, so, score: +score.toFixed(2), khoa });
  };
  // chi giu van de co o CA HAI lan do VA cung vi tri (lech <= 2 px): phan tu con dang chay hieu ung bi bo (dem vao dangChay)
  const giu = (ds1, ds2, kf) => {
    const m2 = new Map((ds2 || []).map((x) => [kf(x), x]));
    return (ds1 || []).filter((x) => {
      const y = m2.get(kf(x));
      if (!y) return false;
      const a = x.rect || x.at, b = y.rect || y.at;
      if (a && b && (Math.abs(a.l - b.l) > 2 || Math.abs(a.t - b.t) > 2)) { d.dangChay = (d.dangChay || 0) + 1; return false; }
      return true;
    });
  };
  if (A1 && A1.ok && A2 && A2.ok) {
    const min = TH.minFs[d.man];
    for (const c of giu(A1.clip, A2.clip, (x) => x.path)) {
      if (c.ok) continue;
      const cn = c.boKind === 'cuon';
      const fail = !cn && (c.frac >= TH.clipFailFrac || c.cut > TH.clipFailPx);
      let sev = fail ? 'FAIL' : (c.cut <= TH.clipWarnPx ? 'INFO' : 'WARN');
      if (c.ell) sev = c.frac >= TH.ellipsisWarnFrac ? 'WARN' : 'INFO';
      const bien = c.boTag === 'viewport' ? 'viewport' : `${c.boTag}${c.boCls ? '.' + c.boCls : ''}`;
      them(`clip|${d.man}|${c.tag}.${c.cls}|${c.side}`, sev, c.ell ? 'CLIPPED-ELLIPSIS' : 'CLIPPED', c,
        `"${c.txt}" ${rc(c.rect)} cut ${c.cut}px at ${c.side} by ${bien}${cn ? ' (scroll box)' : ''}; ${so0(c.thay * 100)}% visible`,
        { cut: c.cut, side: c.side, frac: c.frac, thay: c.thay, bo: bien, rect: c.rect, sw: c.sw, cw: c.cw, sh: c.sh, ch: c.ch }, c.cut + c.frac * 100);
    }
    for (const c of giu(A1.meoChong, A2.meoChong, (x) => x.path)) {
      if (c.ok) continue;
      const fail = c.f >= TH.catFailFrac || Math.min(c.ix, c.iy) > TH.catFailPx;
      them(`meo|${d.man}|${c.tag}.${c.cls}`, fail ? 'FAIL' : 'WARN', 'ON-CAT', c, `"${c.txt}" ${rc(c.rect)} overlaps the cat by ${c.ix}x${c.iy}px (${so0(c.f * 100)}% of the line)`,
        { ix: c.ix, iy: c.iy, f: c.f, rect: c.rect, meo: A1.meo ? { l: so0(A1.meo.l), t: so0(A1.meo.t), r: so0(A1.meo.r), b: so0(A1.meo.b) } : null }, c.f * 100 + Math.min(c.ix, c.iy));
    }
    for (const c of giu(A1.camChong, A2.camChong, (x) => x.path)) {
      const fail = c.f >= TH.catFailFrac || c.iy > TH.catFailPx;
      them(`cam|${d.man}|${c.tag}.${c.cls}`, fail ? 'FAIL' : 'WARN', 'UNDER-DECOR', c, `"${c.txt}" ${rc(c.rect)} ${c.iy}px (${so0(c.f * 100)}% of line height) under the ${c.vung} (from layer y=${c.zt})`,
        { iy: c.iy, f: c.f, zt: c.zt, vung: c.vung, rect: c.rect }, c.f * 100 + c.iy);
    }
    for (const c of giu(A1.chong, A2.chong, (x) => x.a.path + '|' + x.b.path)) {
      if (c.ok) continue;
      const o = Object.assign({}, c.a, { path: c.a.path + ' + ' + c.b.path });
      them(`chong|${d.man}|${c.a.tag}.${c.a.cls}|${c.b.tag}.${c.b.cls}`, c.f >= TH.overlapFailFrac ? 'FAIL' : 'WARN', 'TEXT-OVERLAP', o,
        `"${c.a.txt}" overlaps ${elTen(c.b)} "${c.b.txt}" by ${c.ix}x${c.iy}px (${so0(c.f * 100)}% of the smaller) at x=${c.at.l} y=${c.at.t}`,
        { f: c.f, ix: c.ix, iy: c.iy, at: c.at, b: elTen(c.b), bTxt: c.b.txt }, c.f * 100);
      out[out.length - 1].el = `${elTen(c.a)} x ${elTen(c.b)}`;
    }
    for (const c of giu(A1.nho, A2.nho, (x) => x.path)) {
      if (c.cong) continue;
      let toiThieu = min;
      if (c.rt) toiThieu = TH.minFsRt; else if (c.nhanHoa) toiThieu = TH.minFsEyebrow;
      if (c.fs >= toiThieu - TH.smallSlack) continue;
      const fail = c.fs < toiThieu * TH.smallFailRatio;
      them(`nho|${d.man}|${c.tag}.${c.cls}`, fail ? 'FAIL' : 'WARN', 'SMALL-TYPE', c, `"${c.txt}" ${c.fs}px${c.sc !== 1 ? ` (css ${c.fs0}px x scale ${c.sc})` : ''}, minimum ${toiThieu}px${c.rt ? ' (furigana)' : c.nhanHoa ? ' (uppercase label)' : ''}`,
        { fs: c.fs, fs0: c.fs0, sc: c.sc, min: toiThieu, rect: c.rect }, toiThieu - c.fs);
    }
    {
      const an2 = new Set((A2.an || []).map((x) => x.path));
      for (const c of (A1.an || []).filter((x) => an2.has(x.path))) {
        if (c.ok || c.boKind === 'cuon') continue;
        them(`an|${d.man}|${c.tag}.${c.cls}`, 'WARN', 'HIDDEN-TEXT', c, `"${c.txt}" has opacity ${c.opTong} but is completely clipped away / off-screen`, { op: c.opTong, bo: c.boKind }, 1);
      }
    }
  }
  if (B1 && B1.ok && B2 && B2.ok) {
    for (const c of giu(B1.mo, B2.mo, (x) => x.path + '|' + x.cuoi)) {
      them(`mo|${d.man}|${c.tag}.${c.cls}`, 'WARN', 'ORPHAN', c, `${c.soDong}-line ${c.dang === 'token' ? 'token row' : 'text block'} ends with a lone "${c.cuoi}" (last line ${c.wCuoi}px of ${c.wMax}px) in ${c.elCuoi}`,
        { cuoi: c.cuoi, soDong: c.soDong, wCuoi: c.wCuoi, wMax: c.wMax, dang: c.dang, rect: c.rect, fs: c.fs }, 1 - c.wCuoi / Math.max(1, c.wMax));
    }
    for (const c of giu(B1.tach, B2.tach, (x) => x.path + '|' + (x.tu || '') + '|' + x.dang)) {
      them(`tach|${d.man}|${c.tag}.${c.cls}`, 'WARN', 'WORD-SPLIT', c, `${c.dang === 'token' ? 'token' : c.dang === 'jp' ? 'Japanese word' : c.dang === 'jp-dai' ? 'Japanese sentence (mid-word break)' : 'word'} "${c.tu || c.txt}" is broken over ${c.soDong} lines: ${c.phan}`,
        { dang: c.dang, tu: c.tu || null, phan: c.phan, soDong: c.soDong, rect: c.rect, fs: c.fs }, c.soDong);
    }
    for (const c of giu(B1.mep, B2.mep, (x) => x.path)) {
      them(`mep|${d.man}|${c.tag}.${c.cls}`, 'WARN', 'EDGE', c, `"${c.txt}" ink is ${c.gap}px from the ${c.canh} edge of its card ${c.the} (min ${c.canh === 'l' || c.canh === 'r' ? TH2.mepNgang : TH2.mepDoc}px)`,
        { gap: c.gap, canh: c.canh, the: c.the, rect: c.rect, theRect: c.theRect, fs: c.fs }, (c.canh === 'l' || c.canh === 'r' ? TH2.mepNgang : TH2.mepDoc) - c.gap);
    }
    for (const c of giu(B1.canBang || [], B2.canBang || [], (x) => x.path)) {
      them(`canbang|${d.man}|${c.the}`, 'WARN', 'BALANCE', c, `content of card ${c.the} is off-balance (${c.truc === 'ngang' ? 'left ' + c.g.l + 'px vs right ' + c.g.r + 'px' : 'top ' + c.g.t + 'px vs bottom ' + c.g.b + 'px'}): one side hugs the border, the other is loose`,
        { the: c.the, g: c.g, truc: c.truc, theRect: c.theRect }, Math.abs(c.truc === 'ngang' ? c.g.l - c.g.r : c.g.t - c.g.b));
    }
    for (const c of giu(B1.thua || [], B2.thua || [], (x) => x.path)) {
      them(`thua|${d.man}|${c.the}`, 'WARN', 'SPARSE', c, `text fills only ${Math.round(c.fill * 100)}% of card ${c.the} (${c.theRect.r - c.theRect.l}x${c.theRect.b - c.theRect.t}px): wasted space — enlarge the text or shrink the card`,
        { the: c.the, fill: c.fill, theRect: c.theRect }, 1 - c.fill);
    }
    for (const c of giu(B1.tran, B2.tran, (x) => x.path)) {
      them(`tran|${d.man}|${c.tag}.${c.cls}`, 'WARN', 'OVERFLOW-BOX', c, `"${c.txt}" sticks out ${c.ra}px at the ${c.canh} of its card ${c.the} (not clipped; ${so0(c.trong * 100)}% inside)`,
        { ra: c.ra, canh: c.canh, the: c.the, trong: c.trong, rect: c.rect, theRect: c.theRect, fs: c.fs }, c.ra);
    }
    for (const c of giu(B1.cat, B2.cat, (x) => x.path)) {
      them(`cat|${d.man}|${c.tag}.${c.cls}`, 'WARN', 'CLIP-PATH', c, `"${c.txt}" ${rc(c.rect)}: ${so0(c.f * 100)}% of ${c.diem} sample points do not hit the text (clipped by ${c.boi ? 'clip-path/mask of ' + c.boi : 'clip-path / mask / overflow'})`,
        { f: c.f, diem: c.diem, boi: c.boi, rect: c.rect }, c.f * 100);
    }
    for (const c of giu(B1.che, B2.che, (x) => x.path)) {
      them(`che|${d.man}|${c.tag}.${c.cls}`, 'WARN', 'OCCLUDED', c, `"${c.txt}" ${rc(c.rect)} is covered at ${so0(c.f * 100)}% of ${c.diem} sample points by ${c.vat}${c.vatTrangTri ? ' (decor layer)' : ''}${c.vatTrongLop ? '' : ' (outside .cd-lop)'}`,
        { f: c.f, diem: c.diem, vat: c.vat, vatTrangTri: c.vatTrangTri, vatTrongLop: c.vatTrongLop, rect: c.rect, vatRect: c.vatRect }, c.f * 100);
    }
  }
  return haChuBiChe(out);
}
/** Chu bi lop mo duc che >= 67 % (OCCLUDED) thi cac van de bo cuc KHAC cua chinh no (chong chu, cat, nho, mo coi...) khong nhin thay:
 *  ha xuong INFO (vd canh cu con nam duoi tam the chuong). OCCLUDED van giu. quet-tong-hop.mjs ap lai cung quy tac. */
function haChuBiChe(ds) {
  const che = new Set(ds.filter((x) => x.loai === 'OCCLUDED' && x.so && x.so.f >= 0.67).map((x) => x.path));
  if (!che.size) return ds;
  for (const x of ds) {
    if (x.loai === 'OCCLUDED' || x.sev === 'INFO') continue;
    if (String(x.path || '').split(' + ').some((p) => che.has(p))) { x.sev = 'INFO'; x.mo = '[hidden under an opaque layer] ' + x.mo; }
  }
  return ds;
}

// ---------------------------------------------------------------- mot diem do
/** Ghi diem do: kiem tinh hop le, phan loai, anh */
function ghiDiem(ctx, spec, nhan, kq, hopLe) {
  const d = { man: ctx.w, bai: ctx.bai, i: spec.i, kind: spec.kind, nhan, kq };
  const diem = { i: spec.i, kind: spec.kind, nhan, len: spec.len != null ? spec.len : null, tom: spec.tom || null, ok: false, lyDo: null, ms: null, soChu: null, soVanDe: 0, fail: 0 };
  if (!kq || !kq.m1 || !kq.m2) { diem.lyDo = (kq && kq.lyDo) || 'khong do duoc'; ctx.diem.push(diem); return []; }
  const a = kq.m1.a, b = kq.m1.b;
  const lyDoHL = hopLe(kq.m1) || hopLe(kq.m2);
  if (lyDoHL) { diem.lyDo = lyDoHL; ctx.diem.push(diem); return []; }
  if (!a || !a.ok) { diem.lyDo = 'doTrang: ' + ((a && a.lyDo) || '?'); ctx.diem.push(diem); return []; }
  diem.ok = true;
  diem.ms = [kq.m1.ms, kq.m2.ms];
  diem.soChu = a.soChu;
  diem.trangThai = { s0: kq.m1.s0, s1: kq.m2.s1 };
  if (b && !b.ok) diem.loiThem = b.lyDo;
  const vd = phanLoai(d);
  if (d.dangChay) diem.dangChay = d.dangChay;
  if (kq.bangMo) diem.bangMo = true;
  const vdTinh = vd.filter((x) => x.sev !== 'INFO');
  diem.soVanDe = vdTinh.length;
  diem.fail = vdTinh.filter((x) => x.sev === 'FAIL').length;
  diem.info = vd.length - vdTinh.length;
  if (kq.anh && (TUY.anhMoi || diem.fail)) {
    const fn = `${ctx.bai}-${ctx.w}-${String(spec.i).padStart(3, '0')}-${spec.kind}-${nhan}`.replace(/[^\w.+-]+/g, '_') + '.jpg';
    try { fs.writeFileSync(path.join(D_ANH, fn), Buffer.from(kq.anh, 'base64')); diem.anh = fn; vd.forEach((x) => { x.anh = fn; }); } catch (e) {}
  }
  ctx.diem.push(diem);
  ctx.vanDe.push(...vd);
  return vd;
}

const hlNhip = (i) => (m) => {
  if (!m) return 'khong co ket qua';
  for (const s of [m.s0, m.s1]) {
    if (s.i !== i) return `nhip da doi (index ${s.i} != ${i})`;
    if (s.che === 'tat') return 'san khau da tat (che=tat)';
    if (s.theChuong || s.theXong) return 'the chuong / ket bai chen vao luc do';
    if (!s.lop) return 'khong co .cd-lop';
  }
  return null;
};

/** Nhip thuong (giu nhip) — kem tieu de khi spec.tieuDe; spec.do = co do trang thai cuoi cua nhip */
async function doNhipThuong(t, ctx, spec) {
  const kaiwaRun = spec.kind === 'kaiwa-run';
  const ok = await batNhip(t, spec.i, TUY.giu && !kaiwaRun, spec.i + 1);
  if (!ok) { ghiDiem(ctx, spec, spec.tieuDe ? 'tieu-de' : spec.nhan, { lyDo: 'nhip khong chay (khong PLAYING / che=tat sau 15 s)' }, () => null); return; }
  if (spec.tieuDe) {
    const dat = await t.cho(`(() => { if (__lecture.index() !== ${spec.i}) return 'doi'; const c = __motion.cues().find((x) => x.id === 'V0'); return !!(c && (c.firedPerf || c.via === 'bo')); })()`, 20000, 80);
    if (dat === true) {
      await sleep(1300);
      await choOnDinh(t, 800);
      const kq = await doCap(t, 600);
      ghiDiem(ctx, Object.assign({}, spec, { kind: 'title', len: null }), 'tieu-de', kq, hlNhip(spec.i));
      try { ctx.tieuDeTxt = await t.ev(`(() => { const l = document.querySelector('.cd-lop'); return l ? l.innerText.replace(/\\s+/g, ' ').slice(0, 160) : null; })()`); } catch (e) {}
    } else ghiDiem(ctx, Object.assign({}, spec, { kind: 'title' }), 'tieu-de', { lyDo: dat === 'doi' ? 'nhip 0 qua truoc cue V0' : 'khong thay cue V0 trong 20 s' }, () => null);
    if (!spec.do) return;
  }
  if (kaiwaRun) {
    // client tu phat ca doan roi tu sang nhip: do cuon, giu cap do hop le cuoi cung
    await sleep(2000);
    let truoc = null, cap = null;
    const hl = hlNhip(spec.i);
    const t0 = Date.now();
    while (Date.now() - t0 < 90000) {
      const m = await doMot(t);
      if (hl(m)) break;
      if (truoc) cap = { m1: truoc, m2: m };
      truoc = m;
      await sleep(600);
    }
    if (cap && TUY.anh) { /* anh cua cap cuoi khong con tren man hinh: bo */ }
    ghiDiem(ctx, spec, spec.nhan, cap || { lyDo: 'kaiwa-run: khong co hai lan do hop le lien tiep' }, () => null);
    return;
  }
  const tt = await choCue(t, spec.i, 60000);
  if (tt === 'doi' || tt === 'tat') { ghiDiem(ctx, spec, spec.nhan, { lyDo: `nhip ket thuc truoc khi do (cue: ${tt})` }, () => null); return; }
  await sleep(1200);
  const yen = await choOnDinh(t, 3000);
  const kq = await doCap(t, 600);
  if (tt === 'het-gio') kq.ghiChu = 'cue chua xong sau 60 s';
  ghiDiem(ctx, spec, spec.nhan, kq, hlNhip(spec.i));
  if (tt === 'het-gio') ctx.diem[ctx.diem.length - 1].cue = 'het-gio';
  if (!yen) ctx.diem[ctx.diem.length - 1].khongYen = true;
}

/** Bai tap: cho -> do; bam sai -> do; (cuoi: noi tiep the ket bai) */
async function doQuiz(t, ctx, spec, ketBai) {
  const ok = await batNhip(t, spec.i, false, spec.i + 1);
  if (!ok) { ghiDiem(ctx, spec, spec.nhan + ':cho', { lyDo: 'nhip khong chay' }, () => null); return false; }
  const cho = await t.cho(`(__motion.trangThai() || {}).che === 'cho' && __lecture.index() === ${spec.i}`, 60000, 150);
  if (!cho) { ghiDiem(ctx, spec, spec.nhan + ':cho', { lyDo: 'khong den luot hoc vien (che != cho sau 60 s)' }, () => null); return false; }
  await sleep(1400);
  await choOnDinh(t, 1500);
  const hlCho = (m) => hlNhip(spec.i)(m) || (m.s0.che !== 'cho' ? 'khong con cho hoc vien (che=' + m.s0.che + ')' : null);
  ghiDiem(ctx, spec, spec.nhan + ':cho', await doCap(t, 600), hlCho);
  const p = await traLoi(t, false);
  if (!p) { ghiDiem(ctx, spec, spec.nhan + ':sai', { lyDo: 'khong tim thay nut dap an' }, () => null); return false; }
  await sleep(1600);
  await choOnDinh(t, 1500);
  ghiDiem(ctx, spec, spec.nhan + ':sai', await doCap(t, 600), hlNhip(spec.i));
  if (!ketBai) return false;
  return doTheXong(t, ctx, spec, true);
}

/** The ket bai: nhip quiz cuoi; noiTiep = vua tra loi sai trong cung luot */
async function doTheXong(t, ctx, spec, noiTiep) {
  const sp = { i: spec.i, kind: 'finish-card', len: null, tom: null };
  if (!noiTiep) {
    const ok = await batNhip(t, spec.i, false, spec.i + 1);
    if (!ok) { ghiDiem(ctx, sp, 'the-ket-bai', { lyDo: 'nhip quiz cuoi khong chay' }, () => null); return false; }
  }
  const t0 = Date.now();
  let daTL = noiTiep, daBam = 0, thay = false;
  while (Date.now() - t0 < 70000) {
    const r = await t.ev(`({ che: (__motion.trangThai() || {}).che, i: __lecture.index(), the: (window.__probeThe || {}).theXong || 0, md: !!document.querySelector('.sk-the-xong'), st: __lecture.state().lectureState })`);
    if (r.the || r.md) { thay = true; break; }
    if (r.st !== 'PLAYING') break;
    if (r.che === 'cho') {
      if (!daTL) { await sleep(900); await traLoi(t, true); daTL = true; await sleep(600); continue; }
      if (Date.now() - t0 > 4000 && daBam < 3) { daBam++; await bamTiepTuc(t); await sleep(800); continue; }
    }
    await sleep(150);
  }
  if (!thay) { ghiDiem(ctx, sp, 'the-ket-bai', { lyDo: 'khong thay theXong duoc goi trong 70 s' }, () => null); return false; }
  await sleep(1200);
  await choOnDinh(t, 1500);
  const hl = (m) => (!m.s0.lop || !m.s1.lop ? 'khong co .cd-lop' : m.s1.st !== 'PLAYING' ? 'bai giang da dung (the ket bai het gio)' : null);
  ghiDiem(ctx, sp, 'the-ket-bai', await doCap(t, 600), hl);
  return true;
}

/** The chuong: nhip p ngay truoc chuong (chuong) -> theChuong */
async function doTheChuong(t, ctx, p, chuong, lan = 0) {
  const sp = { i: p, kind: 'chapter-card', len: null, tom: chuong };
  const ok = await batNhip(t, p, false, p + 1);
  await t.ev(`window.__keoGap = { bat: true, them: 2600, lan: 0 }; true`);
  if (!ok) { ghiDiem(ctx, sp, 'the-chuong:' + chuong, { lyDo: 'nhip truoc chuong khong chay' }, () => null); return; }
  const t0 = Date.now();
  let thay = false;
  while (Date.now() - t0 < 90000) {
    const r = await t.ev(`({ che: (__motion.trangThai() || {}).che, i: __lecture.index(), the: (window.__probeThe || {}).theChuong || 0, md: !!document.querySelector('.sk-the-chuong'), st: __lecture.state().lectureState })`);
    if (r.the || r.md) { thay = true; break; }
    if (r.che === 'cho') { await sleep(700); await traLoi(t, true); await sleep(500); continue; }
    if (r.i !== p || r.st !== 'PLAYING') break;
    await sleep(100);
  }
  if (!thay) { ghiDiem(ctx, sp, 'the-chuong:' + chuong, { lyDo: 'khong thay theChuong duoc goi (nhip truoc chuong ket thuc / qua 90 s)' }, () => null); return; }
  // khoang nghi da keo dai them 2,6 s (__keoGap): +0,5 s, cho dung yen (toi da 0,8 s), do 2 lan cach 0,3 s; lo -> chay lai mot lan
  await sleep(500);
  await choOnDinh(t, 800);
  const hl = (m) => (m.s0.i !== p || m.s1.i !== p ? `the chuong da het (index ${m.s1.i})` : !m.s0.lop || !m.s1.lop ? 'khong co .cd-lop' : null);
  const kq = await doCap(t, 300);
  const keo = await t.ev(`(() => { const k = window.__keoGap || {}; const n = k.lan || 0; window.__keoGap = { bat: false }; return n; })()`).catch(() => 0);
  if (lan === 0 && (hl(kq.m1) || hl(kq.m2))) return doTheChuong(t, ctx, p, chuong, 1);
  ghiDiem(ctx, sp, 'the-chuong:' + chuong, kq, hl);
  if (!keo) ctx.diem[ctx.diem.length - 1].khongKeo = true;
}

// ---------------------------------------------------------------- mo trang / mo bai
async function moTrang(t, cap, so) {
  await t.moApp({ them: THEM, bai: [cap, so] });
  const def = await t.cho(`!!(window.SenseiCheDo && SenseiCheDo.def(${JSON.stringify(ID)}))`, 20000, 150);
  if (!def) throw new Error(`SenseiCheDo.def('${ID}') khong nap (loi cu phap trong js/che-do/${ID}.js?)`);
  const r = await t.ev(`(${caiBaoTrang.toString()})(${JSON.stringify(ID)})`);
  if (r !== 'ok') throw new Error('cai bao: ' + r);
  // san khau phai bat (motion.js nap loi -> SenseiMotion.bat = false, che luon 'tat')
  const bat = await t.ev(`!!(window.SenseiMotion && SenseiMotion.bat)`);
  if (!bat) throw new Error('SenseiMotion.bat = false (js/motion.js nap loi?)');
  await t.ev(EXPR_CAI);
  const hs = hashTep();
  const loiNap = t.loi().filter((x) => !/favicon|env\.js|tailwindcss\.com should not/.test(x.text)).slice(0, 3).map((x) => x.text.slice(0, 160));
  if (loiNap.length) hs.loiNap = loiNap;
  return hs;
}
async function moBai(t, cap, so) {
  await dungHan(t);
  const goc = baiFile(cap, so);
  const v0 = (goc.vocabList || [])[0];
  await t.ev(`window.jumpToLesson(${JSON.stringify(cap)}, ${so}).then(() => true)`);
  const ok = await t.cho(`(() => { const b = __lecture.beats(); return b.length === ${dsSoNhip(goc)} && (${JSON.stringify(v0 ? v0.id : null)} === null || (b[0] && b[0].data && b[0].data.id === ${JSON.stringify(v0 ? v0.id : null)})); })()`, 20000, 150);
  if (!ok) throw new Error(`jumpToLesson(${cap}, ${so}): ke hoach nhip khong khop tep bai`);
  const r = await t.ev(`(${caiBaoTrang.toString()})(${JSON.stringify(ID)})`);
  if (r !== 'ok') throw new Error('cai bao: ' + r);
  await sleep(300);
}
function dsSoNhip(j) {
  return (j.vocabList || []).length + (j.kanjiList || []).length + (j.slides || []).reduce((a, s) => a + 1 + (s.examples || []).length, 0)
    + ((j.dialogue || []).length ? 2 + j.dialogue.length : 0) + (j.exercises || []).length;
}

/** Quet mot bai tren mot man hinh. Tra ve ban ghi bai */
async function quetBai(t, w, cap, so) {
  const tb = Date.now();
  const ctx = { w, bai: `${cap}-${so}`, diem: [], vanDe: [], loi: [] };
  t.log.length = 0;
  const ds = await t.ev(`(${dsNhipTrang.toString()})()`);
  { const g = baiFile(cap, so); const v0 = (g.vocabList || [])[0]; if (ds.length !== dsSoNhip(g) || (v0 && ds[0] && ds[0].id !== v0.id)) throw new Error(`trang dang mo khong phai ${cap}-${so} (nhip 0 = ${ds[0] && ds[0].id}, ${ds.length} nhip)`); }
  const chon = TUY.nhip ? ds.filter((b) => TUY.nhip.includes(b.i)).map((b) => Object.assign({}, b, { nhan: 'chi-dinh' })) : chonNhip(ds, TUY.soMau);
  const theoI = new Map(chon.map((b) => [b.i, b]));
  const quiz = ds.filter((b) => b.kind === 'quiz');
  const quizCuoi = quiz.length ? quiz[quiz.length - 1].i : null;
  // the chuong: xoay vong theo so bai
  const coChuong = CHUONG_XOAY.filter((c) => { const k = ds.findIndex((b) => b.chapter === c && b.dau); return k > 0; });
  const chuong = coChuong.length ? coChuong[(so - 1) % coChuong.length] : null;
  const pChuong = chuong ? ds.findIndex((b) => b.chapter === chuong && b.dau) - 1 : null;
  ctx.chon = chon.map((b) => ({ i: b.i, kind: b.kind, nhan: b.nhan, len: b.len, tom: b.tom }));
  ctx.chuong = chuong;
  // 1) tieu de (+ nhip 0 neu duoc chon)
  const b0 = ds[0];
  await doNhipThuong(t, ctx, Object.assign({}, b0, { nhan: theoI.has(0) ? theoI.get(0).nhan : 'tieu-de', tieuDe: true, do: theoI.has(0) && b0.kind !== 'quiz' }));
  // 2) nhip duoc chon
  let daKetBai = false;
  for (const b of chon) {
    if (b.i === 0 && b.kind !== 'quiz') continue;
    try {
      if (b.kind === 'quiz') { if (await doQuiz(t, ctx, b, b.i === quizCuoi)) daKetBai = true; }
      else await doNhipThuong(t, ctx, b);
    } catch (e) {
      ghiDiem(ctx, b, b.nhan, { lyDo: 'loi chay: ' + String(e && e.message || e).slice(0, 200) }, () => null);
    }
  }
  // 3) the chuong
  if (chuong != null && pChuong >= 0) {
    try { await doTheChuong(t, ctx, pChuong, chuong); } catch (e) { ghiDiem(ctx, { i: pChuong, kind: 'chapter-card' }, 'the-chuong:' + chuong, { lyDo: 'loi chay: ' + String(e && e.message || e).slice(0, 200) }, () => null); }
  }
  // 4) the ket bai
  if (!daKetBai && quizCuoi != null) {
    try { await doTheXong(t, ctx, { i: quizCuoi }, false); } catch (e) { ghiDiem(ctx, { i: quizCuoi, kind: 'finish-card' }, 'the-ket-bai', { lyDo: 'loi chay: ' + String(e && e.message || e).slice(0, 200) }, () => null); }
  }
  await dungHan(t);
  ctx.loi = t.loi().filter((x) => !/favicon|env\.js|tailwindcss\.com should not/.test(x.text)).slice(0, 6).map((x) => x.text.slice(0, 220));
  ctx.giay = Math.round((Date.now() - tb) / 1000);
  return ctx;
}

// =================================================================================================
//  KET QUA: JSON + Markdown
// =================================================================================================
let KQ = { che: ID, tuy: { man: MAN.map(([w]) => w), r: TUY.r, soMau: TUY.soMau, giu: TUY.giu }, batDau: new Date().toISOString(), nguong: { TH, TH2 }, phienBan: {}, bai: [], vanDe: [] };
if (TUY.tiep && fs.existsSync(F_JSON)) {
  try { const cu = JSON.parse(fs.readFileSync(F_JSON, 'utf8')); if (cu.che === ID) { KQ = cu; KQ.tiepTu = (KQ.tiepTu || []).concat(new Date().toISOString()); KQ.giayTruoc = cu.giay || 0; delete KQ.xong; } } catch (e) {}
}
const daXong = new Set(KQ.bai.filter((b) => !b.hong).map((b) => b.man + '|' + b.bai));

const ORD = { FAIL: 0, WARN: 1, INFO: 2 };
function nhom(vd) {
  const g = new Map();
  for (const x of vd) {
    if (x.sev === 'INFO') continue;
    const k = `${x.loai}|${x.el}|${x.kind}`;
    let e = g.get(k);
    if (!e) { e = { loai: x.loai, el: x.el, kind: x.kind, F: 0, W: 0, n: 0, bai: new Set(), man: new Set(), vd: [] }; g.set(k, e); }
    e.n++; if (x.sev === 'FAIL') e.F++; else e.W++;
    e.bai.add(x.bai); e.man.add(x.man);
    e.vd.push(x);
  }
  const ds = [...g.values()];
  ds.forEach((e) => { e.vd.sort((a, b) => (ORD[a.sev] - ORD[b.sev]) || b.score - a.score); e.vd = e.vd.slice(0, 3); e.sev = e.F ? 'FAIL' : 'WARN'; });
  ds.sort((a, b) => (ORD[a.sev] - ORD[b.sev]) || (b.F - a.F) || (b.n - a.n));
  return ds;
}
const gonBai = (set) => { const a = [...set]; return a.length > 8 ? a.slice(0, 8).join(', ') + ` +${a.length - 8}` : a.join(', '); };
function vietMd() {
  const vd = KQ.vanDe;
  const tinh = vd.filter((x) => x.sev !== 'INFO');
  const F = tinh.filter((x) => x.sev === 'FAIL').length, W = tinh.length - F;
  const diem = KQ.bai.flatMap((b) => b.diem.map((d) => Object.assign({ bai: b.bai, man: b.man }, d)));
  const hong = diem.filter((d) => !d.ok);
  const L = [];
  L.push(`# Layout sweep — mode "${ID}" (${KQ.tuy.man.join(' + ')})`, '');
  L.push(`${KQ.bai.length} lesson runs, ${diem.length - hong.length} measured points (${hong.length} not measured), mock r=${KQ.tuy.r}, ${KQ.tuy.giu ? 'beat hold on' : 'no beat hold'}, ${KQ.tuy.soMau} beats per kind (longest/shortest). Started ${KQ.batDau}${KQ.xong ? ', finished ' + KQ.xong : ' (running)'}; ${KQ.giay ? phut(KQ.giay * 1000) : ''}.`, '');
  L.push(`**Total: ${F} FAIL, ${W} WARN** (issue instances; ${vd.length - tinh.length} INFO not counted).`, '');
  const theoLoai = new Map();
  tinh.forEach((x) => { const e = theoLoai.get(x.loai) || { F: 0, W: 0, bai: new Set() }; if (x.sev === 'FAIL') e.F++; else e.W++; e.bai.add(x.man + '|' + x.bai); theoLoai.set(x.loai, e); });
  L.push('| type | FAIL | WARN | lesson runs |', '|---|---:|---:|---:|');
  [...theoLoai.entries()].sort((a, b) => (b[1].F - a[1].F) || (b[1].W - a[1].W)).forEach(([k, e]) => L.push(`| ${k} | ${e.F} | ${e.W} | ${e.bai.size} |`));
  L.push('');
  const G = nhom(vd);
  L.push(`## Issue groups (type, element, beat kind) — ${G.length} groups, FAIL first`, '');
  L.push('| # | sev | type | element | beat kind | FAIL | WARN | lessons | worst example |', '|---:|---|---|---|---|---:|---:|---:|---|');
  G.slice(0, 150).forEach((e, k) => {
    const x = e.vd[0];
    L.push(`| ${k + 1} | ${e.sev} | ${e.loai} | \`${e.el}\` | ${e.kind} | ${e.F} | ${e.W} | ${e.bai.size} (${gonBai(e.bai)}) | ${x.bai}#${x.i} ${x.chon} @${x.man}: ${String(x.mo).replace(/\|/g, '/').slice(0, 220)} |`);
  });
  if (G.length > 150) L.push(`| | | | | | | | | +${G.length - 150} more groups in the JSON |`);
  L.push('');
  if (hong.length) {
    L.push(`## Not measured (${hong.length})`, '');
    const lyDo = new Map();
    hong.forEach((d) => { const k = `${d.kind} ${String(d.nhan).split(':')[0].replace(/-\d+$/, '')}: ${d.lyDo}`; if (!lyDo.has(k)) lyDo.set(k, []); lyDo.get(k).push(`${d.bai}#${d.i}@${d.man}`); });
    [...lyDo.entries()].sort((a, b) => b[1].length - a[1].length).forEach(([k, a]) => L.push(`- ${a.length}x ${k} — ${a.slice(0, 10).join(', ')}${a.length > 10 ? ' ...' : ''}`));
    L.push('');
  }
  const loiTrang = KQ.bai.filter((b) => b.loi && b.loi.length);
  if (loiTrang.length) {
    L.push(`## Console errors (${loiTrang.length} lesson runs)`, '');
    loiTrang.slice(0, 15).forEach((b) => L.push(`- ${b.bai}@${b.man}: ${b.loi.slice(0, 2).join(' | ').slice(0, 300)}`));
    L.push('');
  }
  return L.join('\n') + '\n';
}
function luu() {
  KQ.capNhat = new Date().toISOString();
  KQ.giay = Math.round((Date.now() - T0) / 1000) + (KQ.giayTruoc || 0);
  // dia day (ENOSPC): khong lam hong lan chay — giu ket qua trong bo nho, ghi lai o lan luu sau
  try {
    fs.writeFileSync(F_JSON + '.tmp', JSON.stringify(KQ, null, 1));
    fs.renameSync(F_JSON + '.tmp', F_JSON);
    fs.writeFileSync(F_MD, vietMd());
  } catch (e) { try { console.error('luu loi: ' + (e && e.message)); fs.rmSync(F_JSON + '.tmp', { force: true }); } catch (x) {} }
}

// =================================================================================================
//  CHAY
// =================================================================================================
async function chayMan(w, h, goc) {
  const viec = BAI.filter(([cap, so]) => !daXong.has(w + '|' + cap + '-' + so));
  if (!viec.length) return;
  let ch = null, t = null, dangMo = null, demHong = 0;   // dangMo: bai trang dang mo ('N5-1')
  const moLai = async (cap, so) => {
    if (ch) await dongChrome(ch);
    ch = await moChromeGon({ w, h });
    // canh gac: lenh CDP treo (Chrome chet / dia day) -> loi sau 45 s thay vi cho mai (vong thu lai se mo lai Chrome)
    const send0 = ch.cdp.send;
    ch.cdp.send = (m, prm) => Promise.race([send0(m, prm), sleep(45000).then(() => { throw new Error('CDP ' + m + ' treo > 45 s'); })]);
    t = new Trang(ch.cdp, goc);
    await t.batDau(w, h);
    dangMo = null;
    const hs = await moTrang(t, cap, so);
    KQ.phienBan[`${w}@${new Date().toISOString()}`] = hs;
    dangMo = `${cap}-${so}`;
  };
  const vaoBai = async (cap, so) => {
    if (!t) await moLai(cap, so);
    if (dangMo !== `${cap}-${so}`) { dangMo = null; await moBai(t, cap, so); dangMo = `${cap}-${so}`; }
  };
  const t0 = Date.now();
  let k = 0;
  for (const [cap, so] of viec) {
    k++;
    let ban = null, loiCuoi = '';
    // app co the dang duoc sua dong thoi (loi cu phap / ReferenceError luc nap): thu lai toi 5 lan, cho tang dan 2 s .. 2 phut
    for (let lan = 0; lan < 5 && !ban; lan++) {
      try {
        await vaoBai(cap, so);
        ban = await quetBai(t, w, cap, so);
        const dk = ban.diem.filter((d) => d.ok).length;
        if (ban.diem.length >= 4 && dk < ban.diem.length * 0.3 && lan < 4) {
          const ly = ban.diem.filter((d) => !d.ok).map((d) => d.lyDo)[0];
          ban = null;
          throw new Error(`trang hong: chi ${dk} diem do duoc (${ly})`);
        }
      } catch (e) {
        loiCuoi = String(e && e.message || e).replace(/\s+/g, ' ').slice(0, 200);
        ghiLog(`${w} ${cap}-${so}: LOI (lan ${lan + 1}) ${loiCuoi} -> mo lai Chrome`);
        demHong++;
        await sleep(lan === 0 ? 2000 : Math.min(120000, 15000 * 2 ** (lan - 1)));
        try { await moLai(cap, so); } catch (e2) { ghiLog(`${w}: mo lai that bai: ${String(e2 && e2.message || e2).replace(/\s+/g, ' ').slice(0, 200)}`); t = null; }
      }
    }
    if (!ban) ban = { w, bai: `${cap}-${so}`, diem: [], vanDe: [], loi: [], hong: 'khong quet duoc sau 5 lan: ' + loiCuoi };
    const rec = { man: w, bai: ban.bai, giay: ban.giay || null, chon: ban.chon || null, chuong: ban.chuong || null, tieuDe: ban.tieuDeTxt || null, diem: ban.diem, loi: ban.loi, hong: ban.hong || null };
    KQ.bai.push(rec);
    KQ.vanDe.push(...ban.vanDe);
    luu();
    const F = ban.vanDe.filter((x) => x.sev === 'FAIL').length, W = ban.vanDe.filter((x) => x.sev === 'WARN').length;
    const dk = ban.diem.filter((d) => d.ok).length;
    const tb = (Date.now() - t0) / k;
    ghiLog(`${w} [${k}/${viec.length}] ${ban.bai}: ${dk}/${ban.diem.length} points, ${F} FAIL ${W} WARN, ${ban.giay || '?'} s${ban.hong ? ' HONG' : ''} | avg ${Math.round(tb / 1000)} s/lesson, ETA ${phut(tb * (viec.length - k))}`);
  }
  // vong cuoi: thu lai cac bai hong (vd app dang sua do luc dau)
  const hong = KQ.bai.filter((b) => b.man === w && b.hong);
  for (const b of hong) {
    const [cap, so] = [b.bai.split('-')[0], +b.bai.split('-')[1]];
    try {
      await vaoBai(cap, so);
      const ban = await quetBai(t, w, cap, so);
      KQ.bai.splice(KQ.bai.indexOf(b), 1, { man: w, bai: ban.bai, giay: ban.giay, chon: ban.chon, chuong: ban.chuong, tieuDe: ban.tieuDeTxt || null, diem: ban.diem, loi: ban.loi, hong: null, thuLai: true });
      KQ.vanDe.push(...ban.vanDe);
      luu();
      ghiLog(`${w} thu lai ${ban.bai}: ${ban.diem.filter((d) => d.ok).length}/${ban.diem.length} points`);
    } catch (e) { ghiLog(`${w} thu lai ${b.bai}: van loi ${String(e && e.message || e).replace(/\s+/g, ' ').slice(0, 160)}`); try { await moLai(cap, so); } catch (e2) { t = null; } }
  }
  if (ch) await dongChrome(ch);
}
/** Dong Chrome + xoa ho so tam (cdp-lib xoa mot lan, Windows con khoa tep thi bo sot -> thu lai) */
async function dongChrome(ch) {
  try { await ch.dong(); } catch (e) {}
  await sleep(600);
  try { fs.rmSync(ch.prof, { recursive: true, force: true, maxRetries: 6, retryDelay: 400 }); } catch (e) {}
}

ghiLog(`START mode ${ID}, screens ${MAN.map(([w, h]) => w + 'x' + h).join(' + ')}, ${BAI.length} lessons, r=${TUY.r}, soMau=${TUY.soMau}, hold=${TUY.giu}${TUY.tiep ? ', resume (' + daXong.size + ' done)' : ''} -> ${F_JSON}`);
// may ban (nhieu Chrome / server cung luc): server co the len cham hon 12 s cua bo-cuc-may -> thu lai toi 4 lan
let goc = null;
for (let lan = 0; lan < 4 && !goc; lan++) {
  try { goc = await moServer(); } catch (e) { ghiLog(`server chua len (lan ${lan + 1}): ${String(e && e.message || e).slice(0, 120)}`); await donServer(); await sleep(5000 * (lan + 1)); }
}
if (!goc) { ghiLog('HONG: khong mo duoc server'); process.exit(1); }
let hongChung = null;
try {
  await Promise.all(MAN.map(([w, h], k) => sleep(k * 2500).then(() => chayMan(w, h, goc))));
} catch (e) {
  hongChung = String(e && e.stack || e);
  ghiLog('HONG: ' + hongChung.slice(0, 400));
} finally {
  await donServer();
}
KQ.xong = new Date().toISOString();
if (hongChung) KQ.hong = hongChung;
luu();
const tinh = KQ.vanDe.filter((x) => x.sev !== 'INFO');
const nF = tinh.filter((x) => x.sev === 'FAIL').length;
const nDiem = KQ.bai.reduce((a, b) => a + b.diem.filter((d) => d.ok).length, 0);
ghiLog(`DONE ${KQ.bai.length} lesson runs, ${nDiem} points, ${nF} FAIL, ${tinh.length - nF} WARN -> ${F_MD}`);
process.exit(nF || !nDiem ? 1 : 0);
