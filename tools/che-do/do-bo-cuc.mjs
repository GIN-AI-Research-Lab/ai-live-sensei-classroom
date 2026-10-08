// do-bo-cuc.mjs — DAU DO BO CUC TU DONG cho che do san khau (js/che-do/<k>.js). Chay sau moi lan Gemini sua code;
// ket qua la VAN BAN (Markdown) de dua nguoc cho coding agent khong nhin duoc anh.
//
//   node do-bo-cuc.mjs <che-do a..j> [--ra <json>] [tuy chon]
//     --ra FILE      JSON ket qua (mac dinh E:\sensei-tam\tmp\bo-cuc-<che-do>.json); ban Markdown nam canh (.md)
//     --tuan-tu      do lan luot 1440x900 roi 390x844 (mac dinh: hai Chrome song song)
//     --chi 1440|390 chi do mot man hinh
//     --anh DIR      luu anh chup (jpg) tung diem do vao DIR (de nguoi xem lai)
//     --js FILE      thay js/che-do/<k>.js bang tep nay (chan bang CDP Fetch; dung de do ban chup "dong bang")
//     --css FILE     thay css/che-do/<k>.css bang tep nay
//     --css-them F   chen them CSS (tep F) vao trang — de thu "trang thai xau" khong sua ma nguon
//     --day          do nhieu nhip hon (vocab thu 3, example thu 2, kaiwa-run)
//     --chon a,b     chi do cac nhip co ten nay (vocab-1[+tieu-de],vocab-2,vocab-3,kanji,mau-cau,vi-du,kaiwa-intro,kaiwa,bai-tap,the-chuong,the-ket-bai,kana) — de chay nhanh
//   Exit 0: khong co van de muc FAIL. Exit 1: co it nhat mot FAIL (hoac khong do duoc gi). Exit 2: sai cach dung.
//
// Cach chay (mock lecture ?noLive&moPhong&hat=7&sensei=video&phongCach=<k>, khong bao gio mo Gemini Live): moi man hinh
// (1440x900 va 390x844) mo N5-1 va KANA-5, di qua cac dang nhip dai dien (tieu de, tu vung x2-3, kanji, mau cau, vi du,
// kaiwa-intro, kaiwa, bai tap [cho + tra loi dung], the chuong, the ket bai; KANA-5: chu kana), cho moi cue cua nhip da chay xong
// + 1,5 s roi DO TRONG TRANG hai lan cach nhau 0,7 s (chi giu van de xuat hien ca hai lan -> loai bo hieu ung dang chay).
//
// 7 phep do (chi tren .cd-lop va con chau). Hop chu dung de do = hop Range cua node chu thu bot 0,20 em phia tren / 0,08 em phia duoi
// (hop "content area" cua font cao hon net chu that, nhat la chu Nhat -> tranh bao dong gia khi line-height chat).
//   a CLIP    : chu nhin thay (opacity > .05, chu khong rong, dien tich > 0) bi cat > 2 px boi to tien co overflow hidden/clip/auto/scroll
//               (theo containing block: absolute / fixed bo qua to tien khong phai CB), hoac ra ngoai khung nhin > 2 px. So Range.getClientRects
//               cua node chu voi hop (tru vien) cua to tien; kem scrollW/clientW cua to tien. Bi cat >= 15 % dong chu / > 12 px = FAIL, con lai WARN
//               (<= 3 px chi ghi INFO); vung cuon cua app = WARN; cat co chu y bang text-overflow:ellipsis / line-clamp = INFO (WARN neu mat >= 50 %).
//   b MEO     : chu nhin thay chong len hinh chu nhat cua meo THAT > 4 px theo CA HAI truc. Hop meo = __motion.cheDo().meo (chinh la api.meo():
//               cdMeo() cua js/motion.js, goc phai duoi lop, toa do lop; --sensei-rong / --sensei-cao cua meo) doi ra toa do trang, thu bot 36 px
//               phia tren (dem 36 px co san trong cdMeo, khong phai than meo). Chong >= 25 % dong chu / > 12 px theo ca hai truc = FAIL.
//   c CHU-CHONG-CHU : hai node chu khac cha cat nhau > 20 % cua cai nho hon (bo qua ruby/rt cung mot ruby, lop trang tri: data-decor / lop chua
//               decor|ghost|watermark|net-bong (V2: 'bong' tran KHONG con la trang tri — j-bong-* la bong thoai that) / opacity < .25, chu bi vat mo (nen dac, img/video/canvas) che khuat). > 40 % = FAIL.
//   d CHU NHO : font-size tinh (nhan he so scale cua khoi block gan nhat; the chuong / ket bai bo qua scale) < 14 px (1440) / 13 px (390);
//               nhan trang tri (chu HOA + letter-spacing, < 24 ky tu) cho 11 px; rt (furigana) cho 9 px; the bai tap that (.sk-cong / .qz-* /
//               .sk-the-chan) khong tinh. < 70 % muc toi thieu = FAIL; con lai WARN (gop MOT bullet cho moi man hinh); dung sai lam tron 0,6 px.
//   e TRONG   : chup anh phan .cd-lop, chia luoi 12x8; o "trong" = PHANG (< 0,5 % diem lech > 22 so voi mau chu dao cua o) VA mau chu dao gan
//               (<= 30 khoang cach RGB) mau chu dao cua cac o lang gieng => vung phang cung mau (nen hay tam the khong noi dung) la khoang trong;
//               o chua meo khong tinh. FAIL neu trong > 25 % so o (khong ke o meo) hoac mot hinh chu nhat trong lien tuc > 20 % khung
//               (WARN o 18 % / 14 %).
//   f TOKEN   : nhip example / kaiwa: moi token cua cau trong du lieu (kanji | text | furigana) phai co trong chu nhin thay luc cuoi nhip
//               (doi toi 25 s cho karaoke hien het; neu nhip het truoc thi lay lan do cuoi TRONG nhip). Thieu = FAIL.
//   g HIDDEN  : chu co opacity > 0 nhung bi cat het (< 3 % nhin thay) boi overflow hidden / dat ngoai khung: noi dung khong bao gio hien. WARN,
//               gop mot bullet cho moi man hinh (bo qua vung cuon cua app va danh sach cho phep).
// Moi phep do thuc hien HAI LAN cach nhau 0,7 s (the chuong / ket bai: 0,2 s); chi giu van de xuat hien ca hai lan.
//
// ---- V2 (them): DO TRONG LUC CHUYEN CANH + NOI DUNG XAU NHAT + BAN GHI DAI (bo-cuc-mau.mjs, bo-cuc-noidung.mjs, bo-cuc-may.mjs)
//   Moi nhip duoc LAY MAU moi 100 ms (7 s dau va 7 s sau moi lan doi nhip / moi cue; con lai moi 150 ms) tu luc nhip bat dau, qua luc do tinh,
//   den khi nhip KE TIEP chay them ~6 s (tu nhien, khong ep) — nen thay ca luc chuyen tu nhip cu sang nhip moi. Moi mau chay a,b,c,d (nhu tren, nhung
//   chu opacity < .25 = dang mo/tat dan bi bo) + cac phep sau. Mot van de chi duoc bao khi GIU >= 3 mau lien tiep (>= 300 ms; mau cham: >= 2 mau):
//   T-CLIPPED / T-ON-CAT / T-OVERLAP / T-SMALL : a,b,c,d luc chuyen canh; chi bao neu phan tu KHONG bi phep do tinh bao o cung nhip; T-CLIPPED bo qua
//               phan tu dang truot >= 40 px (bang chay chu, hieu ung truot vao). FAIL chi khi vuot nguong FAIL cua phep do tinh VA giu >= 700 ms, con lai WARN.
//   FADED-TEXT  : chu nhin thay co opacity (nhan cac to tien) trong 0,15..0,85, gan nhu khong doi (bien do < 0,09) >= 600 ms. WARN, FAIL neu >= 1,5 s.
//               (bo qua the bai tap that qz-*/sk-cong va lop trang tri decor|ghost|watermark) — chu "cho" nua mo.
//   PLACEHOLDER : nut chu chi co "?" / "？" nhin thay (opacity >= .25) song > 800 ms (o "NGHIA ?" cho nghia). FAIL.
//   DUPLICATE-TEXT : (1) chuoi >= 12 ky tu xuat hien o hai nut chu khac nhau khong long nhau, giu >= 600 ms; (2) dong loi Sensei (bong thoai) lap lai
//               chuoi >= 12 ky tu (bo khoang trang, dau cau) da co o cho khac tren san khau, giu >= 500 ms. WARN.
//   BALLOON-*   : dong loi Sensei o duoi (selector: a .a-s-dong, j .j-bong-dong, them bang --bong SEL); poll 40 ms, so voi ban ghi that cua luot:
//               CUT-MIDWORD (FAIL): ket thuc/bat dau bang "…" ma o ngay canh trong ban ghi la chu Latin (cat giua tu) giu >= 400 ms;
//               TRUNCATED: bi cat bang "…" / text-overflow / line-clamp giu >= 400 ms (FAIL neu >= 20 ky tu cua cau dang noi khong hien o dau, hoac
//               line-clamp >= 1,5 s; con lai WARN); OVERFLOW (FAIL): chu bi cat/tran hop > 2 px (scrollW/scrollH hoac to tien overflow/clip-path/khung nhin) >= 300 ms;
//               JITTER: trong 1 s: >= 2 lan viet lai (WARN) / >= 4 (FAIL); doi co chu >= 3 (WARN) / >= 6 (FAIL); doi vi tri-cao >= 4 / >= 8; hoac >= 8 lan doi chu;
//               COLLAPSE (WARN): dong dai >= 30 ky tu tut ve <= 40 % giua chung mot cau (khong ket thuc bang dau cau) va giu >= 400 ms;
//               LATE (WARN, khi phat ban ghi gia): dong loi trong > 1,2 s sau manh dau tien.
//   BLANK-FLASH : phu noi dung (chu nhin thay + hinh; luoi 24x16, o phu >= 18 %) < 40 % va < 40 % muc on dinh cua nhip: > 250 ms luc CHUYEN NHIP = FAIL,
//               >= 120 ms = WARN; khi vao nhip tu trang thai DUNG (san khau mo lai) chi WARN.  SLOW-CONTENT (WARN): noi dung co nghia dau tien (>= 3 nut chu
//               va phu >= 50 % muc on dinh) cua nhip ke tiep den sau > 2,5 s.  MANY-MOVERS (WARN): >= 30 phan tu goc doc lap cung chuyen dong/mo (do rect > 1,5 px / opacity > .03 giua hai mau).
//   Pass STRESS (mac dinh chay them song song): thay noi dung N5-1 / KANA-5 (chi trong trang, boc fetch — khong dong vao repo) bang muc XAU NHAT that quet tu
//   curriculum/*/N.json (vocab nghia dai nhat va trong am dai nhat, kanji nhieu tu ghep nhat, slide giang dai nhat va cong thuc dai nhat, cau vi du nhieu token
//   nhat, loi thoai dai nhat, bai tap cau hoi dai nhat va dap an dai nhat; kana: meo nho dai nhat) va phat 'ban ghi' gia 240-390 ky tu theo manh 1-3 token,
//   moi 90-260 ms, tre 0,35 s (khoa loi() that cua mo phong trong luc phat) vao canh.loi cua che do. Danh sach muc da chon nam trong JSON (noiDungStress).
//     --stress        chi chay pass stress            --khong-stress   chi chay pass thuong (van co lay mau)
//     --nhanh         tap con nhanh: N5-1, 5 nhip (vocab-1, vocab-2, mau-cau, vi-du, kaiwa), bo Nhap mon, cho nhip ke ngan hon
//     --loi-that      khong phat ban ghi gia (chi quan sat ban ghi cua mo phong)      --khong-sang   khong cho nhip ke tiep
//     --nhom N        chia moi (man hinh x pass) thanh N Chrome chay song song (mac dinh 2 => 8 Chrome; 1 => 4 Chrome, cham hon ~2x)
//     --bong SEL      them selector cho dong loi Sensei      --luu-mau FILE  ghi hang mau tho (debug)      --anh DIR  them anh cua tung mau bi bao (mau-*.jpg)
//   Tom tat: dong "Summary:" dem FAIL/WARN theo tung phep do. Toi da 30 gach dau dong. Cong 3950-3999, Chrome --remote-debugging-pipe.
//
// NGUONG va DANH SACH CHO PHEP (khai bao o TH / CHO_PHEP ben duoi; moi ngoai le co chu thich ly do).
import { pathToFileURL, fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------- thu vien harness (khong sua)
const KHUNG = process.env.SENSEI_KHUNG
  || path.join(path.dirname(fileURLToPath(import.meta.url)), 'khung');   // thu vien CDP nam trong repo: tools/che-do/khung
const { moChrome, Trang, donDep, sleep, TAM } = await import(pathToFileURL(path.join(KHUNG, 'cdp-lib.mjs')).href);
const { moServer, donServer } = await import(pathToFileURL(path.join(import.meta.dirname, 'bo-cuc-may.mjs')).href);   // server rieng, cong 3950-3999
const MAU = await import(pathToFileURL(path.join(import.meta.dirname, 'bo-cuc-mau.mjs')).href);       // lay mau 100 ms + phan tich chuyen canh / bong thoai
const NOIDUNG = await import(pathToFileURL(path.join(import.meta.dirname, 'bo-cuc-noidung.mjs')).href); // noi dung xau nhat + bai stress
const { NG } = MAU;

// ---------------------------------------------------------------- nguong
const TH = {
  clipPx: 2,            // cat > 2 px moi tinh
  clipWarnPx: 3,        // cat <= 3 px tren hop chu (ink) chi ghi INFO (khong thanh bullet)
  clipFailFrac: 0.15,   // bi cat >= 15 % chieu rong / cao cua dong chu => FAIL
  clipFailPx: 12,       // hoac > 12 px
  catPx: 4,             // chong meo > 4 px theo ca hai truc
  catFailFrac: 0.25,    // chong >= 25 % dien tich dong chu => FAIL
  catFailPx: 12,
  overlapFrac: 0.20,    // chu-chong-chu: > 20 % cua cai nho hon
  overlapFailFrac: 0.40,
  minFs: { 1440: 14, 390: 13 },   // co chu toi thieu (px)
  minFsEyebrow: 11,     // nhan trang tri: chu HOA + letter-spacing, < 24 ky tu
  minFsRt: 9,           // furigana (rt)
  smallFailRatio: 0.7,  // < 70 % muc toi thieu => FAIL (giua 70 % va 100 %: WARN, gop mot bullet moi man hinh)
  emptyWarn: 18, emptyFail: 25,   // % o trong (khong ke o meo)
  rectWarn: 14, rectFail: 20,     // % khung cua hinh chu nhat trong lon nhat
  cols: 12, rows: 8,
  smallSlack: 0.6,      // dung sai lam tron co chu (13,5 px van tinh dat 14 px)
  inkTop: 0.20, inkBottom: 0.08,   // hop chu dung de do = hop Range thu vao (em): hop Range la "content area" cua font (CJK ~1,45 em) nen cao hon net chu that;
                                   // bo 0,20 em phia tren va 0,08 em phia duoi de khong bao dong gia khi line-height chat (chu that khong bi cat)
  meoPadTop: 36,        // api.meo() = cdMeo() cua motion.js co chua 36 px dem phia tren dau meo; hop "meo that" thu bot 36 px phia tren
  ellipsisWarnFrac: 0.5,// chu bi cat boi text-overflow:ellipsis / line-clamp (chu y thiet ke): chi WARN neu mat >= 50 %, con lai chi ghi JSON
  opaqueMin: 0.05,      // opacity (nhan cac to tien) toi thieu de tinh la nhin thay
  decorOpacity: 0.25,   // chu mo hon muc nay coi la lop trang tri khi xet chu-chong-chu
  maxBullets: 30,
};
// DANH SACH CHO PHEP (khoa theo TIEN TO lop CSS, khop voi bat ky lop nao cua phan tu hoac to tien toi .cd-lop).
const CHO_PHEP = {
  // The bai tap that (cong): giao dien cua app, che do chi sap xep — khong tinh chu nho
  chuNho: ['sk-cong', 'qz-', 'sk-the-chan', 'cd-chan'],
  // Lop trang tri (chu mo lam nen): khong tinh chu-chong-chu / chu nho. Ngoai ra: thuoc tinh data-decor va lop chua bong|decor|ghost|watermark
  trangTri: [],
  // Moc ngoai le rieng theo che do (them khi can). Che do a / j da bi xoa (2026-10-06)
  theoChedo: {},
};
const RE_TRANG_TRI = /bong|decor|ghost|watermark/i;

// ---------------------------------------------------------------- tham so dong lenh
const av = process.argv.slice(2);
const ID = av[0];
if (!ID || !/^[a-z]$/.test(ID)) { console.error('dung: node do-bo-cuc.mjs <a..j> [--ra FILE] [--tuan-tu] [--chi 1440|390] [--anh DIR] [--js F] [--css F] [--css-them F] [--day] [--chon a,b] [--stress|--khong-stress] [--nhanh] [--loi-that] [--khong-sang] [--bong SEL] [--nhom N] [--luu-mau FILE]'); process.exit(2); }
const TUY = { ra: `E:/sensei-tam/tmp/bo-cuc-${ID}.json`, tuanTu: false, chi: null, anh: null, js: null, css: null, cssThem: null, day: false, chon: null,
  stress: false, khongStress: false, nhanh: false, loiThat: false, khongSang: false, bong: [], nhom: 2, luuMau: null };
for (let i = 1; i < av.length; i++) {
  const a = av[i];
  if (a === '--ra') TUY.ra = av[++i];
  else if (a === '--tuan-tu') TUY.tuanTu = true;
  else if (a === '--chi') TUY.chi = +av[++i];
  else if (a === '--anh') TUY.anh = av[++i];
  else if (a === '--js') TUY.js = av[++i];
  else if (a === '--css') TUY.css = av[++i];
  else if (a === '--css-them') TUY.cssThem = av[++i];
  else if (a === '--them') TUY.them = (TUY.them || '') + av[++i];   // them tham so URL cho app (vd. "&hCo=1.25")
  else if (a === '--day') TUY.day = true;
  else if (a === '--chon') TUY.chon = av[++i].split(',');
  else if (a === '--stress') TUY.stress = true;
  else if (a === '--khong-stress') TUY.khongStress = true;
  else if (a === '--nhanh') TUY.nhanh = true;
  else if (a === '--loi-that') TUY.loiThat = true;
  else if (a === '--khong-sang') TUY.khongSang = true;
  else if (a === '--bong') TUY.bong.push(av[++i]);
  else if (a === '--luu-mau') TUY.luuMau = av[++i];
  else if (a === '--nhom') TUY.nhom = Math.max(1, +av[++i] || 1);
  else { console.error('tham so la: ' + a); process.exit(2); }
}
TUY.ra = path.resolve(TUY.ra);
fs.mkdirSync(path.dirname(TUY.ra), { recursive: true });
if (TUY.anh) fs.mkdirSync(TUY.anh, { recursive: true });
const THEM = `&phongCach=${ID}&sensei=video${TUY.them || ''}`;
const MAN = [[1440, 900], [390, 844]].filter(([w]) => !TUY.chi || w === TUY.chi);

// =================================================================================================
//  PHAN TRONG TRANG (duoc chuyen thanh chuoi va chay bang Runtime.evaluate) — khong dung bien ngoai
// =================================================================================================
/** Do mot lan: tra ve cac phat hien tho (nguong tinh o Node) */
function doTrang(opt) {
  const lop = document.querySelector('.cd-lop');
  if (!lop) return { ok: false, lyDo: 'khong co .cd-lop tren san khau (che do khong ve nhip nay, hoac da go lop)' };
  if (getComputedStyle(lop).visibility === 'hidden') return { ok: false, lyDo: '.cd-lop dang an (visibility hidden): dungNhip tra null hoac the mac dinh dang hien' };
  const vw = innerWidth, vh = innerHeight;
  // cho phep hit-test qua lop (lop co pointer-events none) — chi trong luc do
  const pe = document.createElement('style');
  pe.textContent = '.cd-lop, .cd-lop * { pointer-events: auto !important; }';
  document.head.appendChild(pe);
  try {
    const lr = lop.getBoundingClientRect();
    let meo = null;
    try {
      const m = window.__motion && __motion.cheDo().meo;
      if (m) meo = { l: lr.left + m.x, t: lr.top + m.y + opt.meoPadTop, r: lr.left + m.x + m.w, b: lr.top + m.y + m.h };
    } catch (e) {}
    const cache = new Map();
    const estado = (el) => {
      if (cache.has(el)) return cache.get(el);
      let r;
      const cs = getComputedStyle(el);
      const p = el === lop ? { op: 1, disp: true } : estado(el.parentElement);
      r = { op: p.op * (parseFloat(cs.opacity) || 0), disp: p.disp && cs.display !== 'none', vis: cs.visibility === 'visible' };
      cache.set(el, r);
      return r;
    };
    const lopChuoi = (el) => (el.getAttribute && el.getAttribute('class')) || '';
    const laTrangTri = (el) => {
      for (let x = el; x && x !== lop.parentElement; x = x.parentElement) {
        if (x.hasAttribute && x.hasAttribute('data-decor')) return true;
        if (opt.trangTri.some((p) => lopChuoi(x).split(/\s+/).some((c) => c.startsWith(p)))) return true;
        // trang tri that: decor / ghost / watermark / net-bong (net do bong) / a-bong (bong do). KHONG dung 'bong' tran: j-bong-* la BONG THOAI (noi dung that)
        if (lopChuoi(x).split(/\s+/).some((c) => /decor|ghost|watermark|net-bong/i.test(c) || c === 'a-bong' || c === 'bong')) return true;
      }
      return false;
    };
    const khop = (el, ds) => { for (let x = el; x && x !== lop.parentElement; x = x.parentElement) { const c = lopChuoi(x).split(/\s+/); if (ds.some((p) => c.some((k) => k.startsWith(p)))) return true; } return false; };
    const duong = (el) => { const a = []; for (let x = el; x && x !== lop; x = x.parentElement) { const p = x.parentElement; a.push(x.tagName.toLowerCase() + (p ? ':' + Array.prototype.indexOf.call(p.children, x) : '')); } return a.reverse().join('>'); };
    const lopTen = (el) => lopChuoi(el).split(/\s+/).filter(Boolean).slice(0, 2).join('.');
    const mota = (el, txt) => ({ tag: el.tagName.toLowerCase(), cls: lopTen(el), path: duong(el), txt: String(txt || '').replace(/\s+/g, ' ').trim().slice(0, 40) });
    const alpha = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return 1; const p = m[1].split(/[,\s/]+/).filter(Boolean); return p.length >= 4 ? parseFloat(p[3]) : 1; };
    // ---- hop cat cua to tien (theo containing block)
    const coCB = (p, mode) => {
      const cs = getComputedStyle(p);
      if (mode === 'fixed') return cs.transform !== 'none' || cs.filter !== 'none' || /paint|layout|strict|content/.test(cs.contain) || /transform/.test(cs.willChange);
      return cs.position !== 'static' || cs.transform !== 'none' || cs.filter !== 'none' || /paint|layout|strict|content/.test(cs.contain) || /transform/.test(cs.willChange);
    };
    const hopCat = (el) => {
      const boxes = [];
      let x = el, guard = 0;
      while (x && guard++ < 60) {
        const cs = getComputedStyle(x);
        const ox = cs.overflowX, oy = cs.overflowY;
        const cx = ox !== 'visible', cy = oy !== 'visible';
        if ((cx || cy) && cs.display !== 'inline' && cs.display !== 'contents') {
          const r = x.getBoundingClientRect();
          const bl = parseFloat(cs.borderLeftWidth) || 0, bt = parseFloat(cs.borderTopWidth) || 0, br = parseFloat(cs.borderRightWidth) || 0, bb = parseFloat(cs.borderBottomWidth) || 0;
          const kx = /auto|scroll/.test(ox) ? 'cuon' : 'cat', ky = /auto|scroll/.test(oy) ? 'cuon' : 'cat';
          boxes.push({ l: r.left + bl, t: r.top + bt, r: r.right - br, b: r.bottom - bb, cx, cy, kind: (cx && kx === 'cat') || (cy && ky === 'cat') ? 'cat' : 'cuon',
            el: x, sw: x.scrollWidth, cw: x.clientWidth, sh: x.scrollHeight, ch: x.clientHeight });
        }
        if (x === lop) break;
        let p = x.parentElement;
        if (cs.position === 'absolute') { while (p && p !== lop && !coCB(p, 'abs')) p = p.parentElement; }
        else if (cs.position === 'fixed') { while (p && p !== lop && !coCB(p, 'fixed')) p = p.parentElement; }
        x = p;
      }
      return boxes;
    };
    const dt = (a) => Math.max(0, a.r - a.l) * Math.max(0, a.b - a.t);
    const giao = (a, b) => ({ l: Math.max(a.l, b.l), t: Math.max(a.t, b.t), r: Math.min(a.r, b.r), b: Math.min(a.b, b.b) });
    const scCache = new Map();
    const scaleCua = (el) => {
      if (scCache.has(el)) return scCache.get(el);
      const v = scaleCua0(el);
      scCache.set(el, v);
      return v;
    };
    const scaleCua0 = (el) => {
      let x = el;
      while (x && x !== lop && getComputedStyle(x).display.startsWith('inline')) x = x.parentElement;
      if (!x || !(x instanceof HTMLElement) || !x.offsetWidth || !x.offsetHeight) return 1;
      const r = x.getBoundingClientRect();
      const sx = r.width / x.offsetWidth, sy = r.height / x.offsetHeight;
      if (Math.abs(sx - sy) > 0.15 || Math.abs(sx - 1) < 0.03) return 1;
      return Math.max(0.3, Math.min(3, sx));
    };
    // ---- duyet node chu nhin thay
    const out = { ok: true, vw, vh, lop: { l: lr.left, t: lr.top, w: lr.width, h: lr.height }, meo, clip: [], ruoc: [], meoChong: [], camChong: [], chong: [], nho: [], thieu: [], an: [], soAn: 0, soChu: 0 };
    const tw = document.createTreeWalker(lop, NodeFilter.SHOW_TEXT);
    const items = [];
    const rg = document.createRange();
    let n;
    while ((n = tw.nextNode())) {
      const s = n.nodeValue;
      if (!s || !s.trim()) continue;
      const el = n.parentElement;
      if (!el || el.closest('script,style,noscript,title')) continue;
      const st = estado(el);
      if (!st.disp || !st.vis || st.op < opt.opaqueMin) continue;
      const cs = getComputedStyle(el);
      if (alpha(cs.color) < 0.05 && !/text/.test(cs.webkitBackgroundClip || cs.backgroundClip || '')) continue;
      rg.selectNodeContents(n);
      const fsTho = (parseFloat(cs.fontSize) || 0) * scaleCua(el);
      const rects = Array.prototype.filter.call(rg.getClientRects(), (r) => r.width >= 1 && r.height >= 1)
        .map((r) => ({ l: r.left, t: r.top + opt.inkTop * fsTho, r: r.right, b: Math.max(r.top + opt.inkTop * fsTho + 1, r.bottom - opt.inkBottom * fsTho) }));
      if (!rects.length) continue;
      const boxes = hopCat(el);
      boxes.push({ l: 0, t: 0, r: vw, b: vh, cx: true, cy: true, kind: 'viewport', el: null });
      let tongDt = 0, tongThay = 0, cutMax = 0, cutBox = null, cutSide = '', thay = [];
      for (const rc of rects) {
        let v = { l: rc.l, t: rc.t, r: rc.r, b: rc.b };
        tongDt += dt(rc);
        for (const bx of boxes) {
          const cut = { l: bx.cx ? Math.max(0, bx.l - rc.l) : 0, r: bx.cx ? Math.max(0, rc.r - bx.r) : 0, t: bx.cy ? Math.max(0, bx.t - rc.t) : 0, b: bx.cy ? Math.max(0, rc.b - bx.b) : 0 };
          for (const k of ['l', 'r', 't', 'b']) if (cut[k] > cutMax) { cutMax = cut[k]; cutBox = bx; cutSide = k; }
          if (bx.cx) { v.l = Math.max(v.l, bx.l); v.r = Math.min(v.r, bx.r); }
          if (bx.cy) { v.t = Math.max(v.t, bx.t); v.b = Math.min(v.b, bx.b); }
        }
        const a = dt(v);
        tongThay += a;
        if (a > 0) thay.push(v);
      }
      const frac = tongDt ? tongThay / tongDt : 0;
      const bb = rects.reduce((a, r) => ({ l: Math.min(a.l, r.l), t: Math.min(a.t, r.t), r: Math.max(a.r, r.r), b: Math.max(a.b, r.b) }), { l: 1e9, t: 1e9, r: -1e9, b: -1e9 });
      if (frac < 0.03) {
        // chu co opacity > 0 nhung bi cat het (hoac dat ngoai khung): "an" — noi dung khong bao gio hien / do di khuat
        out.soAn++;
        if (out.an.length < 12 && !laTrangTri(el)) out.an.push(Object.assign(mota(el, s), { opTong: +st.op.toFixed(2), boKind: cutBox ? cutBox.kind : null, ok: khop(el, opt.choPhepAn) }));
        continue;
      }
      const it = { el, txt: s, rects: thay, bb, op: st.op, frac, mo: mota(el, s), cs };
      items.push(it);
      out.soChu++;
      if (cutMax > opt.clipPx) {
        const dim = cutSide === 'l' || cutSide === 'r' ? (bb.r - bb.l) : (bb.b - bb.t);
        const cb = cutBox;
        out.clip.push(Object.assign({}, it.mo, {
          rect: { l: +bb.l.toFixed(0), t: +bb.t.toFixed(0), w: +(bb.r - bb.l).toFixed(0), h: +(bb.b - bb.t).toFixed(0) },
          cut: +cutMax.toFixed(1), side: cutSide, frac: +(cutMax / Math.max(1, dim)).toFixed(3), thay: +frac.toFixed(2),
          boKind: cb.kind, boTag: cb.el ? cb.el.tagName.toLowerCase() : 'viewport', boCls: cb.el ? lopTen(cb.el) : 'viewport',
          boRect: { l: +cb.l.toFixed(0), t: +cb.t.toFixed(0), r: +cb.r.toFixed(0), b: +cb.b.toFixed(0) },
          sw: cb.el ? cb.sw : null, cw: cb.el ? cb.cw : null, sh: cb.el ? cb.sh : null, ch: cb.el ? cb.ch : null,
          ok: khop(el, opt.choPhepClip),
          ell: !!(cb.el && ((getComputedStyle(cb.el).textOverflow || '').indexOf('ellipsis') >= 0 || (getComputedStyle(cb.el).webkitLineClamp || 'none') !== 'none')),
        }));
      }
    }
    // ---- b: meo
    if (meo) {
      for (const it of items) {
        let best = null;
        for (const v of it.rects) {
          const ix = Math.min(v.r, meo.r) - Math.max(v.l, meo.l), iy = Math.min(v.b, meo.b) - Math.max(v.t, meo.t);
          if (ix > opt.catPx && iy > opt.catPx) { const f = (ix * iy) / Math.max(1, dt(v)); if (!best || ix * iy > best.ix * best.iy) best = { ix, iy, f }; }
        }
        if (best) out.meoChong.push(Object.assign({}, it.mo, { ix: +best.ix.toFixed(0), iy: +best.iy.toFixed(0), f: +best.f.toFixed(2), rect: { l: +it.bb.l.toFixed(0), t: +it.bb.t.toFixed(0), w: +(it.bb.r - it.bb.l).toFixed(0), h: +(it.bb.b - it.bb.t).toFixed(0) }, ok: khop(it.el, opt.choPhepMeo) }));
      }
    }
    // ---- b2: chu nam duoi lop trang tri phu (vung cam cua che do)
    for (const vc of (opt.vungCam || [])) {
      const tf = lr.height > lr.width && vc.tDoc != null ? vc.tDoc : vc.t;
      const z = { l: lr.left, r: lr.right, t: lr.top + lr.height * tf, b: lr.bottom };
      for (const it of items) {
        let best = null;
        for (const v of it.rects) {
          const ix = Math.min(v.r, z.r) - Math.max(v.l, z.l), iy = Math.min(v.b, z.b) - Math.max(v.t, z.t);
          if (ix > opt.catPx && iy > opt.catPx) { const f = iy / Math.max(1, v.b - v.t); if (!best || f > best.f) best = { ix, iy, f }; }
        }
        if (best) out.camChong.push(Object.assign({}, it.mo, { vung: vc.ten, zt: +(z.t - lr.top).toFixed(0), iy: +best.iy.toFixed(0), f: +best.f.toFixed(2), rect: { l: +it.bb.l.toFixed(0), t: +it.bb.t.toFixed(0), w: +(it.bb.r - it.bb.l).toFixed(0), h: +(it.bb.b - it.bb.t).toFixed(0) } }));
      }
    }
    // ---- c: chu-chong-chu
    const lonA = items.length > 700 ? items.filter((_, i) => i % Math.ceil(items.length / 700) === 0) : items;
    const trangTriCache = new Map();
    const tt = (it) => { if (!trangTriCache.has(it)) trangTriCache.set(it, it.op < opt.decorOpacity || laTrangTri(it.el)); return trangTriCache.get(it); };
    const trungBo = new Set();
    for (let i = 0; i < lonA.length; i++) {
      const a = lonA[i];
      for (let j = i + 1; j < lonA.length; j++) {
        const b = lonA[j];
        if (a.el === b.el) continue;
        const ra = a.el.closest('ruby'), rb = b.el.closest('ruby');
        if (ra && ra === rb) continue;
        // bao gia nhanh
        if (a.bb.r <= b.bb.l || b.bb.r <= a.bb.l || a.bb.b <= b.bb.t || b.bb.b <= a.bb.t) continue;
        let best = null;
        for (const va of a.rects) for (const vb of b.rects) {
          const g = giao(va, vb);
          const A = dt(g);
          if (A <= 0) continue;
          const f = A / Math.max(1, Math.min(dt(va), dt(vb)));
          if (f > opt.overlapFrac && (!best || f > best.f)) best = { f, g, ix: g.r - g.l, iy: g.b - g.t };
        }
        if (!best || tt(a) || tt(b)) continue;
        // bi vat khac (nen dac) che mot trong hai => khong chong that
        const cx = (best.g.l + best.g.r) / 2, cy = (best.g.t + best.g.b) / 2;
        const top = document.elementFromPoint(cx, cy);
        if (top && !(top === a.el || a.el.contains(top) || top === b.el || b.el.contains(top))) {
          const cst = getComputedStyle(top);
          if (alpha(cst.backgroundColor) >= 0.9 || /^(img|video|canvas)$/i.test(top.tagName)) continue;
        }
        const k = duong(a.el) + '|' + duong(b.el);
        if (trungBo.has(k)) continue;
        trungBo.add(k);
        out.chong.push({ a: a.mo, b: b.mo, f: +best.f.toFixed(2), ix: +best.ix.toFixed(0), iy: +best.iy.toFixed(0), at: { l: +best.g.l.toFixed(0), t: +best.g.t.toFixed(0) },
          ok: khop(a.el, opt.choPhepChong) || khop(b.el, opt.choPhepChong) });
      }
    }
    // ---- d: chu nho
    for (const it of items) {
      const cs = it.cs;
      const fs0 = parseFloat(cs.fontSize) || 0;
      const sc = opt.ignoraScale ? 1 : scaleCua(it.el);   // the chuong / ket bai: chip dang "no" (scale) -> dung co CSS
      const fs = fs0 * sc;
      if (fs >= 15.5) continue;
      if (laTrangTri(it.el)) continue;
      const txt = it.txt.replace(/\s+/g, ' ').trim();
      const chu = txt.replace(/[^A-Za-zÀ-ỹ]/g, '');
      const hoa = cs.textTransform === 'uppercase' || (chu.length >= 2 && chu === chu.toUpperCase() && chu !== chu.toLowerCase());
      const ls = parseFloat(cs.letterSpacing) || 0;
      out.nho.push(Object.assign({}, it.mo, {
        fs: +fs.toFixed(1), fs0: +fs0.toFixed(1), sc: +sc.toFixed(2), nhanHoa: !!(hoa && ls > 0 && txt.length < 24), rt: !!it.el.closest('rt'),
        cong: khop(it.el, opt.choPhepNho), rect: { l: +it.bb.l.toFixed(0), t: +it.bb.t.toFixed(0), w: +(it.bb.r - it.bb.l).toFixed(0), h: +(it.bb.b - it.bb.t).toFixed(0) },
      }));
    }
    // ---- f: token
    if (opt.tokens && opt.tokens.length) {
      const chuan = (s) => String(s || '').normalize('NFKC').replace(/[\s\u200b]+/g, '');
      const dong = chuan(items.map((it) => it.txt).join(''));
      out.thieu = opt.tokens.filter((alts) => alts.some(Boolean) && !alts.some((a) => a && dong.includes(chuan(a)))).map((alts) => alts.find(Boolean));
      out.chuDong = dong.slice(0, 200);
    }
    return out;
  } finally {
    pe.remove();
  }
}

/** Phan tich anh (PNG base64 cua .cd-lop): luoi o trong. meo: hop meo theo toa do anh (hoac null) */
async function phanTichAnh(b64, opt) {
  const img = new Image();
  img.src = 'data:image/png;base64,' + b64;
  await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0);
  const px = cx.getImageData(0, 0, W, H).data;
  const key = (r, g, b) => ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
  const modeMau = (x0, y0, x1, y1, buoc) => {
    const h = new Map();
    for (let y = y0; y < y1; y += buoc) for (let x = x0; x < x1; x += buoc) {
      const i = (y * W + x) * 4;
      const k = key(px[i], px[i + 1], px[i + 2]);
      const e = h.get(k);
      if (e) { e.n++; e.r += px[i]; e.g += px[i + 1]; e.b += px[i + 2]; } else h.set(k, { n: 1, r: px[i], g: px[i + 1], b: px[i + 2] });
    }
    let best = null;
    h.forEach((e) => { if (!best || e.n > best.n) best = e; });
    return best ? [best.r / best.n, best.g / best.n, best.b / best.n] : [0, 0, 0];
  };
  const kc = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const dom = modeMau(0, 0, W, H, 3);
  const cw = W / opt.cols, ch = H / opt.rows;
  // luot 1: moi o -> mau chu dao cua o, phang (it diem lech) hay khong, o meo
  const o = [];
  let soMeo = 0;
  for (let r = 0; r < opt.rows; r++) {
    o.push([]);
    for (let c = 0; c < opt.cols; c++) {
      const x0 = Math.round(c * cw), x1 = Math.round((c + 1) * cw), y0 = Math.round(r * ch), y1 = Math.round((r + 1) * ch);
      let laMeo = false;
      if (opt.meo) {
        const ix = Math.min(x1, opt.meo.r) - Math.max(x0, opt.meo.l), iy = Math.min(y1, opt.meo.b) - Math.max(y0, opt.meo.t);
        laMeo = ix > 0 && iy > 0 && (ix * iy) / ((x1 - x0) * (y1 - y0)) > 0.35;
      }
      if (laMeo) { o[r].push({ meo: true }); soMeo++; continue; }
      const mc = modeMau(x0, y0, x1, y1, 2);
      let lech = 0, n = 0;
      for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
        const i = (y * W + x) * 4;
        n++;
        if (Math.hypot(px[i] - mc[0], px[i + 1] - mc[1], px[i + 2] - mc[2]) > opt.lech) lech++;
      }
      o[r].push({ mc, phang: lech / Math.max(1, n) < opt.lechTiLe, lech: lech / Math.max(1, n) });
    }
  }
  // luot 2: o "trong" = phang VA mau bang mau chu dao cua cac o lang gieng (kem chinh no; o meo bo qua) — vung phang cung mau
  // (nen hoac tam the trong) la khoang trong, nhung o phang nam giua noi dung khac mau thi khong
  const luoi = [];
  for (let r = 0; r < opt.rows; r++) {
    const hang = [];
    for (let c = 0; c < opt.cols; c++) {
      const e = o[r][c];
      if (e.meo) { hang.push('c'); continue; }
      let bang = false;
      if (e.phang) {
        const h = new Map();
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          const q = o[r + dr] && o[r + dr][c + dc];
          if (!q || q.meo || !q.phang) continue;
          const k = key(q.mc[0], q.mc[1], q.mc[2]);
          const z = h.get(k);
          if (z) z.n++; else h.set(k, { n: 1, mc: q.mc });
        }
        let best = null;
        h.forEach((z) => { if (!best || z.n > best.n) best = z; });
        bang = !!best && kc(e.mc, best.mc) <= opt.gan;
      }
      hang.push(bang ? 'e' : '.');
    }
    luoi.push(hang.join(''));
  }
  return { W, H, dom: dom.map((v) => Math.round(v)), luoi, soMeo };
}

// =================================================================================================
//  PHAN NODE: dieu khien bai giang mo phong, do, tong hop
// =================================================================================================
const CSS_THEM = TUY.cssThem ? fs.readFileSync(TUY.cssThem, 'utf8') : '';
const cheDoTuyChon = (extra) => Object.assign({
  clipPx: TH.clipPx, catPx: TH.catPx, inkTop: TH.inkTop, inkBottom: TH.inkBottom, meoPadTop: TH.meoPadTop, overlapFrac: TH.overlapFrac, opaqueMin: TH.opaqueMin, decorOpacity: TH.decorOpacity,
  trangTri: CHO_PHEP.trangTri.concat((CHO_PHEP.theoChedo[ID] && CHO_PHEP.theoChedo[ID].trangTri) || []),
  choPhepClip: (CHO_PHEP.theoChedo[ID] || {}).clip || [], choPhepMeo: (CHO_PHEP.theoChedo[ID] || {}).meo || [],
  vungCam: VUNG_CAM[ID] || [], choPhepChong: (CHO_PHEP.theoChedo[ID] || {}).chong || [], choPhepAn: (CHO_PHEP.theoChedo[ID] || {}).an || [], choPhepNho: CHO_PHEP.chuNho.concat((CHO_PHEP.theoChedo[ID] || {}).chuNho || []),
}, extra || {});

/** Chan tep js/css cua che do bang tep khac (ban chup dong bang) — CDP Fetch */
async function chanTep(t) {
  const map = [];
  if (TUY.js) map.push([`js/che-do/${ID}.js`, TUY.js, 'application/javascript']);
  if (TUY.css) map.push([`css/che-do/${ID}.css`, TUY.css, 'text/css']);
  if (!map.length) return;
  await t.c.send('Fetch.enable', { patterns: map.map(([u]) => ({ urlPattern: '*/' + u + '*', requestStage: 'Request' })) });
  t.c.on('Fetch.requestPaused', (p) => {
    const url = p.request.url.split('?')[0];
    const m = map.find(([u]) => url.endsWith('/' + u));
    if (!m) { t.c.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {}); return; }
    const body = fs.readFileSync(m[1]);
    t.c.send('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: m[2] }, { name: 'Cache-Control', value: 'no-store' }], body: body.toString('base64') }).catch(() => {});
  });
}

/** Bai stress (noi dung xau nhat that): tao mot lan, dung cho moi Chrome */
let STRESS = null;
function baiStress() {
  if (STRESS) return STRESS;
  const xau = NOIDUNG.quetNoiDungXau();
  const map = {}, ghi = {};
  for (const [cap, so] of [['N5', 1], ['KANA', 5]]) {
    const r = NOIDUNG.taoBaiStress(cap, NOIDUNG.docBaiGoc(cap, so), xau);
    map[`curriculum/${cap.toLowerCase()}/${so}.json`] = r.json;
    ghi[`${cap}-${so}`] = r.ghiChu;
  }
  STRESS = { map, ghi };
  return STRESS;
}
const BAL_MAC_DINH = { h: ['.h-khong-bong'], s: ['.s-khong-bong'] };   // H, S khong co bong loi Sensei (thiet ke): chi WARN NOT-FOUND, khong doan bua chu tinh
// Vung bi lop trang tri phu len (chu nam duoi = bi che). t = mep tren theo ti le chieu cao .cd-lop; ngang (doc) = man dung (dien thoai).
//   h: co truoc (lop h-l-truoc, z 15 > the gioi z 10) ve tu ~0,79 H; dien thoai ha co xuong 0,09 H.
const VUNG_CAM = { h: [{ ten: 'front grass layer', t: 0.795, tDoc: 0.88 }] };
const balSel = () => TUY.bong.concat(BAL_MAC_DINH[ID] || []);

async function moBai(t, bai, stress) {
  let sc = `(() => { const add = () => { const s = document.createElement('style'); s.id = 'do-bo-cuc-them'; s.textContent = ${JSON.stringify(CSS_THEM)}; (document.head || document.documentElement).appendChild(s); }; if (${JSON.stringify(!!CSS_THEM)}) { if (document.head) add(); else document.addEventListener('DOMContentLoaded', add); } })();`;
  if (stress) {
    const ST = baiStress();
    const key = `curriculum/${bai[0].toLowerCase()}/${bai[1]}.json`;
    if (ST.map[key]) sc += '\n' + NOIDUNG.scriptBocFetch({ [key]: ST.map[key] });
  }
  await t.moApp({ them: THEM, bai, truocTrang: sc });
  await t.cho(`!!(window.SenseiCheDo)`, 5000);
  // cho tep che do nap xong (apDung) roi bao tay 2 ham the de biet luc nao the chuong / ket bai duoc goi
  await t.cho(`!!SenseiCheDo.def(${JSON.stringify(ID)})`, 15000, 150);
  await t.ev(`(() => { const d = SenseiCheDo.def(${JSON.stringify(ID)}); if (!d) return false; window.__probeThe = { theChuong: 0, theXong: 0 };
    ['theChuong', 'theXong'].forEach((k) => { if (typeof d[k] === 'function' && !d['__p' + k]) { const f = d[k]; d['__p' + k] = 1; d[k] = function () { window.__probeThe[k] = performance.now(); return f.apply(this, arguments); }; } });
    // bao dungNhip: nho doi tuong nhip (window.__probeCanh) + cho phep khoa loi() that cua mo phong khi probe phat ban ghi gia
    if (!d.__pDung && typeof d.dungNhip === 'function') { d.__pDung = 1; const g = d.dungNhip;
      d.dungNhip = function () { const m = g.apply(this, arguments); window.__probeCanh = m;
        if (m && typeof m === 'object' && typeof m.loi === 'function' && !m.__pl) { const l0 = m.loi; try { m.loiGoc = l0; m.__pl = 1; m.loi = function () { if (window.__samp && window.__samp.khoaLoi) return; return l0.apply(this, arguments); }; } catch (e) {} }
        return m; }; }
    return true; })()`);
  // bo lay mau (window.__samp)
  const cfg = { opt: cheDoTuyChon({ tokens: null, opaqueMin: 0.25 }), balSel: balSel(), nhanhMs: 7000, kcNhanh: 100, kcCham: 150 };
  await t.ev(`(${MAU.khoiSampler.toString()})(${JSON.stringify(cfg)}, ${doTrang.toString()})`);
}

async function dsNhip(t) {
  return t.ev(`__lecture.beats().map((b, i) => ({ i, kind: b.kind, chapter: b.chapter, id: b.data && (b.data.id || b.data.character || b.data.kanji), kanji: b.data && b.data.kanji, sub: b.subIndex,
    tokens: b.data && Array.isArray(b.data.tokens) ? b.data.tokens.map((k) => [k.kanji, k.text, k.furigana]).filter((a) => a.some((x) => x && !/^[\\s\\p{P}\\p{S}]+$/u.test(x))) : null }))`);
}

/** Chon nhip dai dien theo dang (khong ghi cung chi so). stress: them mau-cau-2 va bai-tap-2 (muc xau thu hai); nhanh: tap con */
function chonNhip(ds, cap, stress) {
  const cua = (k) => ds.filter((b) => b.kind === k);
  const vocab = cua('vocab');
  const out = [];
  const them = (ten, b, o) => { if (b) out.push(Object.assign({ ten, i: b.i, kind: b.kind, tokens: b.tokens }, o || {})); };
  if (cap === 'KANA') {
    if (TUY.nhanh) return out;   // --nhanh: bo Nhap mon
    them('kana', cua('kanji')[0]);
    if (TUY.day) { them('vocab', vocab[1]); them('example', cua('example')[0]); them('kaiwa', cua('kaiwa')[0]); }
    return out;
  }
  them('vocab-1', vocab[0], { nut: true, dau: true });
  them('vocab-2', vocab[1]);
  them('vocab-3', vocab.find((b) => b.kanji === '先生') || vocab[2]);
  if (TUY.day) them('vocab-4', vocab[5]);
  them('kanji', cua('kanji')[0]);
  them('mau-cau', cua('grammar-intro')[0]);
  if (stress) them('mau-cau-2', cua('grammar-intro')[1]);
  them('vi-du', cua('example')[0]);
  if (TUY.day) them('vi-du-2', cua('example')[4]);
  them('kaiwa-intro', cua('kaiwa-intro')[0]);
  if (TUY.day) them('kaiwa-run', cua('kaiwa-run')[0], { chiCho: 9000 });
  them('kaiwa', cua('kaiwa')[0]);
  them('bai-tap', cua('quiz')[0], { quiz: true });
  if (stress) them('bai-tap-2', cua('quiz')[1], { quiz: true });
  const kj = cua('kanji')[0];
  if (kj) out.push({ ten: 'the-chuong', i: Math.max(0, kj.i - 1), kind: 'chuong', the: 'theChuong' });
  const qz = cua('quiz');
  if (qz.length) out.push({ ten: 'the-ket-bai', i: qz[qz.length - 1].i, kind: 'xong', the: 'theXong', quiz: true, cuoi: true });
  if (TUY.nhanh) return out.filter((n) => ['vocab-1', 'vocab-2', 'mau-cau', 'vi-du', 'kaiwa'].includes(n.ten));
  return out;
}

async function traLoiDung(t) {
  const p = await t.ev(`(() => { const c = document.querySelector('#sanKhauGiang .qz-card[id^="card-"]'); if (!c) return null;
    const id = c.id.replace(/^card-/, ''); const b = __lecture.beats().find((x) => x.kind === 'quiz' && x.data && x.data.id === id);
    const k = b ? b.data.correctIndex : 0; const nut = document.getElementById('btn-opt-' + id + '-' + k); if (!nut) return null; const r = nut.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  if (p) await t.click(p.x, p.y);
  return !!p;
}

/** Do mot diem: 2 lan DOM (cach gap ms, mac dinh 0,7 s) roi 1 anh. Tra ve { m1, m2, anh } */
async function doDiem(t, nhan, tokens, gap = 700, extra = {}) {
  const opt = cheDoTuyChon(Object.assign({ tokens: tokens || null }, extra));
  const chay = () => t.ev(`(${doTrang.toString()})(${JSON.stringify(opt)})`);
  const m1 = await chay();
  if (!m1.ok) return { ok: false, lyDo: m1.lyDo };
  await sleep(gap);
  const m2 = await chay();
  // anh .cd-lop (chup SAU hai lan do DOM: the chuong / ket bai chi hien ~1,4 s)
  let anhPT = null;
  try {
    const lr = m1.lop;
    const shot = await t.c.send('Page.captureScreenshot', { format: 'png', clip: { x: lr.l, y: lr.t, width: lr.w, height: lr.h, scale: 1 } });
    const meoAnh = m1.meo ? { l: m1.meo.l - lr.l, t: m1.meo.t - lr.t, r: m1.meo.r - lr.l, b: m1.meo.b - lr.t } : null;
    anhPT = await t.ev(`(${phanTichAnh.toString()})(${JSON.stringify(shot.data)}, ${JSON.stringify({ cols: TH.cols, rows: TH.rows, meo: meoAnh, lech: 22, gan: 30, lechTiLe: 0.005 })})`);
    if (TUY.anh) {
      await t.chup(path.join(TUY.anh, `${t.w}-${nhan}.jpg`));
      fs.writeFileSync(path.join(TUY.anh, `lop-${t.w}-${nhan}.png`), Buffer.from(shot.data, 'base64'));
      fs.writeFileSync(path.join(TUY.anh, `lop-${t.w}-${nhan}.json`), JSON.stringify({ meo: meoAnh, lop: lr }));
    }
  } catch (e) { anhPT = { loi: String(e).slice(0, 200) }; }
  return { ok: true, m1, m2: m2.ok ? m2 : null, anh: anhPT };
}

/** Cho cho toi khi moi cue cua nhip da chay (hoac bi bo), toi da ms. Tra ve 'xong' | 'doi' (nhip da qua) | 'het-gio' */
async function choCue(t, i, ms = 50000) {
  const t0 = Date.now();
  let khongCue = 0;
  while (Date.now() - t0 < ms) {
    const r = await t.ev(`(() => { if (__lecture.index() !== ${i}) return 'doi'; const ts = __motion.trangThai() || {}; if (ts.che === 'tat') return 'tat';
      const cs = __motion.cues(); if (!cs.length) return 'khong';
      return cs.every((c) => c.firedPerf || c.via === 'bo') ? 'xong' : 'cho'; })()`);
    if (r === 'xong') return 'xong';
    if (r === 'doi') return 'doi';
    if (r === 'khong') { if (++khongCue > 25) return 'xong'; } else khongCue = 0;
    await sleep(80);
  }
  return 'het-gio';
}

/** Ket qua cua mot nhip: tra ve danh sach diem do */
async function chayNhipTrong(t, cap, spec, ket, moc) {
  const ghiDiem = (nhan, kq, extra) => ket.push(Object.assign({ man: t.w, bai: cap, nhip: spec.ten, kind: spec.kind, i: spec.i, nhan, kq, stress: !!spec.stress }, extra || {}));
  if (spec.nut) await t.bam('#autoLectureBtn');
  else await t.ev(`__lecture.startFrom(${spec.i}).then(() => true)`);
  const len = await t.cho(`__lecture.state().lectureState === 'PLAYING' && (__motion.trangThai() || {}).che !== 'tat'`, 12000);
  if (!len) { ghiDiem(spec.ten, null, { loiChay: 'nhip khong chay duoc (khong PLAYING sau 12 s)' }); return; }

  if (spec.the) {
    // the chuong / ket bai: cho den luc che do duoc goi ve the, +2,2 s
    const kh = spec.the;
    let goiLuc = 0;
    const t0 = Date.now();
    while (Date.now() - t0 < 70000) {
      const r = await t.ev(`({ cho: (__motion.trangThai() || {}).che, i: __lecture.index(), the: (window.__probeThe || {})[${JSON.stringify(kh)}] || 0,
        macDinh: !!document.querySelector(${JSON.stringify(kh === 'theChuong' ? '.sk-the-chuong' : '.sk-the-xong')}) })`);
      if (spec.quiz && r.cho === 'cho') { await sleep(900); await traLoiDung(t); await sleep(500); continue; }
      if (r.the || r.macDinh) { goiLuc = Date.now(); break; }
      await sleep(150);
    }
    if (!goiLuc) { ghiDiem(spec.ten, null, { loiChay: `khong thay ${kh} duoc goi trong 70 s (nhip cuoi bai / chuyen chuong khong toi)` }); await t.dungGiang(); return; }
    // the chuong / ket bai chi hien ~1,4 s truoc nhip ke (mock): do luc 0,7 s, hai lan cach nhau 0,2 s
    await sleep(700);
    const kq = await doDiem(t, spec.ten, null, 200, { ignoraScale: true });
    ghiDiem(spec.ten, kq);
    await t.dungGiang();
    return;
  }

  if (spec.quiz) {
    const ok = await t.cho(`(__motion.trangThai() || {}).che === 'cho'`, 50000, 150);
    if (!ok) { ghiDiem(spec.ten, null, { loiChay: 'bai tap khong den luot hoc vien (che != cho sau 50 s)' }); await t.dungGiang(); return; }
    await sleep(1400);
    ghiDiem(spec.ten + ':cho', await doDiem(t, spec.ten + '-cho', null));
    if (await traLoiDung(t)) {
      await sleep(1300);
      ghiDiem(spec.ten + ':dung', await doDiem(t, spec.ten + '-dung', null));
    }
    await t.dungGiang();
    return;
  }

  // nhip thuong: (tieu de) diem giua + cuoi nhip
  const dungKind = spec.kind;
  if (spec.dau) {
    // diem "tieu de": sau cue V0 + 1,3 s
    const dat = await t.cho(`(() => { const c = __motion.cues().find((x) => x.id === 'V0'); return !!(c && (c.firedPerf || c.via === 'bo')); })()`, 20000, 80);
    if (dat) { await sleep(1300); ghiDiem('tieu-de', await doDiem(t, 'tieu-de', null)); }
  }
  let trangThai = spec.chiCho ? (await sleep(spec.chiCho), 'xong') : await choCue(t, spec.i);
  if (trangThai === 'xong') await sleep(1500);
  // token (example / kaiwa): doi toi 25 s cho karaoke hien het; neu nhip ket thuc truoc thi lay lan do cuoi TRONG nhip
  let tokens = null, lastGood = null, hetNhip = false;
  if (spec.tokens && (dungKind === 'example' || dungKind === 'kaiwa') && spec.tokens.length) {
    tokens = spec.tokens;
    const t0 = Date.now();
    while (Date.now() - t0 < 25000) {
      const s = await t.ev(`__lecture.index()`);
      if (s !== spec.i) { hetNhip = true; break; }
      const th = await t.ev(`(${doTrang.toString()})(${JSON.stringify(cheDoTuyChon({ tokens }))})`);
      if (th.ok) lastGood = th;
      if (th.ok && !th.thieu.length) break;
      await sleep(500);
    }
  }
  if (hetNhip && lastGood) {
    // nhip ket thuc ma van con token chua hien: giu ket qua do cuoi cua CHINH nhip nay (khong do lai canh nhip ke)
    ghiDiem(spec.ten, { ok: true, m1: lastGood, m2: lastGood, anh: null, trangThaiCue: trangThai, muon: false, cuoiNhip: true, nTok: tokens.length });
    await t.dungGiang();
    return;
  }
  const idx = await t.ev(`__lecture.index()`);
  const kq = await doDiem(t, spec.ten, tokens);
  kq.trangThaiCue = trangThai;
  kq.nTok = tokens ? tokens.length : 0;
  kq.muon = idx !== spec.i || trangThai === 'doi';   // do luc canh nhip ke da len: van tinh bo cuc, bo qua token
  if (kq.muon && kq.m1) { kq.m1.thieu = []; if (kq.m2) kq.m2.thieu = []; }
  ghiDiem(spec.ten, kq);
  // khong dung giang ngay: ben ngoai (chayNhip) cho nhip ke tiep chay tu nhien de lay mau luc CHUYEN nhip
  moc.tDo = Date.now();
  moc.choSang = !TUY.khongSang;
  if (!moc.choSang) await t.dungGiang();
}

// ------------------------------------------------------------------ lay mau lien tuc quanh mot nhip (bo-cuc-mau.mjs)
const TXT_GIA = {
  A: 'Từ tiếp theo là 先生, đọc là せんせい. Nghĩa là thầy giáo, cô giáo, hoặc người mình kính trọng vì đã dạy mình điều gì đó. Mẹo nhớ nhé: chữ 先 là đi trước, chữ 生 là sinh ra, vậy người sinh ra trước mình chính là thầy. Ví dụ: 田中さんは先生です。Cô Tanaka là giáo viên. Bây giờ mày đọc theo tao ba lần thật to nào, せんせい, せんせい, せんせい.',
  B: 'Mẫu câu này dùng để giới thiệu bản thân hoặc nói người khác là gì. Cấu trúc là danh từ một, trợ từ は, danh từ hai, rồi です ở cuối câu. Chữ は viết là ha nhưng khi làm trợ từ thì đọc thành wa, chỗ này người mới học sai nhiều nhất đấy. Ví dụ わたしは学生です nghĩa là tôi là sinh viên. Người Nhật hay lược bỏ わたしは khi ngữ cảnh đã rõ, nên chỉ nói 学生です là đủ hiểu rồi. Lát nữa có bài tập kiểm tra đấy nhé.',
  C: 'Câu hội thoại này Satou nói với đồng nghiệp mới rất lịch sự và nhẹ nhàng, dùng はじめまして để chào lần đầu gặp mặt rồi mới giới thiệu tên mình là Satou Keiko và nhớ cúi đầu chào một chút khi nói xong để người nghe cảm thấy được tôn trọng đấy nhé mày',
};
const feedCho = (kind) => ({ vocab: TXT_GIA.A, kanji: TXT_GIA.A, 'grammar-intro': TXT_GIA.B, 'kaiwa-intro': TXT_GIA.B, example: TXT_GIA.C, kaiwa: TXT_GIA.C, quiz: TXT_GIA.B })[kind] || null;

/** Chup khung hinh nen (jpeg) lien tuc khi --anh: vong dem toi da 400 khung, moc thoi gian Date.now() */
function batDauChup(t) {
  const buf = [];
  let chay = true;
  const vong = (async () => {
    while (chay) {
      try { const r = await t.c.send('Page.captureScreenshot', { format: 'jpeg', quality: 50 }); buf.push({ t: Date.now(), data: r.data }); if (buf.length > 400) buf.shift(); } catch (e) {}
      await sleep(80);
    }
  })();
  return { buf, dung: async () => { chay = false; await vong; } };
}
function luuKhung(chup, tMs, ten) {
  if (!chup || !chup.buf.length || !TUY.anh) return null;
  let best = null;
  for (const f of chup.buf) if (!best || Math.abs(f.t - tMs) < Math.abs(best.t - tMs)) best = f;
  if (!best || Math.abs(best.t - tMs) > 1500) return null;
  const fn = ten.replace(/[^\w.+-]+/g, '_') + '.jpg';
  fs.writeFileSync(path.join(TUY.anh, fn), Buffer.from(best.data, 'base64'));
  return fn;
}

/** Chay mot nhip co lay mau: dat sampler -> (phat ban ghi gia) -> chayNhipTrong -> (cho nhip ke) -> phan tich */
async function chayNhip(t, cap, spec, ket, cx) {
  const moc = { tDo: null, choSang: false, ket0: ket.length };
  await t.dungGiang();
  await t.ev(`__moPhong.datDen(${spec.i + 1})`);
  const chup = TUY.anh ? batDauChup(t) : null;
  const feed = cx.stress && !TUY.loiThat && !spec.the ? feedCho(spec.kind) : null;
  let batDau = false;
  try {
    await t.ev(`__samp.bat(${JSON.stringify(spec.ten)})`);
    batDau = true;
    if (feed) await t.ev(`__samp.tuyen(${JSON.stringify(feed)}, { doi: true, seed: ${spec.i + 7} })`);
    await chayNhipTrong(t, cap, spec, ket, moc);
    if (moc.choSang) {
      const co = await t.cho(`__lecture.index() !== ${spec.i}`, TUY.nhanh ? 8000 : 14000, 100);
      if (co) await sleep(TUY.nhanh ? 3500 : 6000);
      await t.dungGiang();
    }
  } finally {
    if (batDau) {
      try {
        const fin = await t.ev(`__samp.dung()`);
        // cac lan san khau giu luoi cu luc mo (js/motion.js cdGiuVao): trong luc do man hinh KHONG trong (luoi cu van thay)
        try { fin.giu = await t.ev(`(window.__motion && __motion.cheoGiu) ? __motion.cheoGiu() : []`); } catch (e) { fin.giu = []; }
        const tCuoi = Date.now();
        if (chup) await chup.dung();
        ket.push({ isMau: true, man: t.w, bai: cap, nhip: spec.ten, kind: spec.kind, i: spec.i, stress: !!spec.stress, mau: tomTatMau(fin, tCuoi, spec, moc, chup, t.w, ket.slice(moc.ket0)) });
      } catch (e) { ket.push({ isMau: true, man: t.w, bai: cap, nhip: spec.ten, kind: spec.kind, i: spec.i, stress: !!spec.stress, mau: null, loiMau: String(e && e.message || e).slice(0, 200) }); }
    }
    if (chup) { try { await chup.dung(); } catch (e) {} }
  }
}

/** rows/bal -> ket qua da phan tich (nho, dua vao JSON) */
const MAU_THO = [];
function tomTatMau(fin, tCuoi, spec, moc, chup, man, tinhKet) {
  if (TUY.luuMau) MAU_THO.push({ man, nhip: spec.ten, t0: fin.t0, rows: fin.rows, bal: fin.bal, feeds: fin.feeds });
  const rows = (fin.rows || []).slice().sort((a, b) => a.t - b.t);
  const seg = { rows, bal: fin.bal || [], t0: fin.t0, feeds: fin.feeds || [], tCuoi };
  // luc sang nhip ke: mau dau tien co idx khac spec.i sau khi da thay idx == spec.i
  let tSang = null, thay = false;
  for (const r of rows) { if (r.idx === spec.i) thay = true; else if (thay && r.idx != null && r.idx !== -1) { tSang = r.t; break; } }
  const A = MAU.phanTichNhip(seg);
  const B = MAU.phanTichBong(seg);
  const dsRows = rows.filter((r) => r.lop);
  const msAll = dsRows.map((r) => r.ms || 0);
  const msTB = dsRows.length ? Math.round(msAll.reduce((a, b) => a + b, 0) / msAll.length) : 0;
  let vaoRows = tSang ? rows.filter((r) => r.t < tSang - 300) : rows;
  // Luc mo san khau tu luc dung, motion.js giu luoi cu tren man hinh (san khau opacity 0) toi khi lop che do co noi dung dau tien roi
  // cheo mo ~180 ms: lop co mat nhung KHONG phai khung trong. Mau trong khoang [bat dau giu, het cheo] tinh la khung day (luoi cu / cheo mo).
  // Sau cheo mo van do that: lop con it noi dung > 120 ms = BLANK-FLASH.
  const giuWin = (fin.giu || []).filter((g) => g.t0 >= fin.t0 - 1500 && g.t0 <= tCuoi).map((g) => [g.t0 - 50, (g.t2 != null ? g.t2 : (g.t1 != null ? g.t1 + 250 : tCuoi))]);
  if (giuWin.length) vaoRows = vaoRows.map((r) => (giuWin.some(([a, b]) => r.t >= a && r.t <= b) ? Object.assign({}, r, { lop: true, cover: Math.max(r.cover || 0, 1) }) : r));
  // Mo san khau: khung chi "trong" khi gan nhu KHONG co noi dung (< 6 % o luoi). Canh dau dung len tung phan (vd bai tap: cau hoi truoc,
  // cac lua chon sau ~0,6 s) co the chi dat 11 % so voi 33 % luc on dinh — do la nhip xep canh, khong phai khung trong (luat 40 %
  // muc on dinh van dung cho chuyen nhip that 'sang').
  const abs0 = NG.blankAbs;
  NG.blankAbs = Math.min(abs0, 0.06);
  let chuyenVao;
  try { chuyenVao = MAU.phanTichChuyen({ rows: vaoRows, t0: fin.t0, tChuyen: fin.t0 }); } finally { NG.blankAbs = abs0; }
  // 'Bat dau nhip tu luc dung' chi la LUC MO SAN KHAU: tinh cac doan trong den luc lop che do lan dau dat muc noi dung binh thuong
  // (>= 40 % muc on dinh hoac >= 40 % tuyet doi). Chỗ tut sau do (vd the ket bai vao cuoi bai tap: bai tap ra, the xep tung o vao) la
  // chuyen dong BEN TRONG nhip, khong phai man hinh trong — khung van co nen che do va dang xep the.
  if (chuyenVao.blank && chuyenVao.blank.length) {
    const tot = rows.find((r) => r.lop && r.cover != null && (r.cover >= 0.06 || r.cover >= NG.blankRatio * chuyenVao.settled));
    if (tot) chuyenVao.blank = chuyenVao.blank.filter((b) => b.t0 <= tot.t);
  }
  // chu cua nhip cu (cac mau truoc luc doi nhip): noi dung 'moi' cua nhip ke tiep = chu khong co trong tap nay
  let oldSet = null;
  if (tSang) { oldSet = new Set(); rows.filter((r) => r.t < tSang && r.t >= tSang - 1500).forEach((r) => (r.sig || []).forEach((h) => oldSet.add(h))); }
  const chuyenSang = tSang ? MAU.phanTichChuyen({ rows: rows.filter((r) => r.t >= tSang - 400), t0: tSang - 400, tChuyen: tSang, oldSet }) : null;
  const off = (tt) => Math.round(tt - fin.t0);
  // bo cac van de da co o phep do TINH cua nhip nay va cac cha nho khong dat muc (de khong chup anh thua)
  const daTinh = { clip: new Set(), meo: new Set(), chong: new Set(), nho: new Set() };
  for (const d of tinhKet || []) if (d.kq && d.kq.ok) for (const m of [d.kq.m1, d.kq.m2]) if (m) {
    (m.clip || []).forEach((x) => daTinh.clip.add(x.path)); (m.meoChong || []).forEach((x) => daTinh.meo.add(x.path));
    (m.chong || []).forEach((x) => daTinh.chong.add(x.a.path + '|' + x.b.path)); (m.nho || []).forEach((x) => daTinh.nho.add(x.path));
  }
  const minFs = TH.minFs[man];
  const giuPv = (x) => {
    const it = x.it;
    if (x.loai === 'clip') return !daTinh.clip.has(x.key) && it.cut > TH.clipWarnPx;
    if (x.loai === 'meo') return !daTinh.meo.has(x.key);
    if (x.loai === 'chong') return !daTinh.chong.has(x.key);
    if (x.loai === 'nho') { const mt = it.rt ? TH.minFsRt : it.nhanHoa ? TH.minFsEyebrow : minFs; return !daTinh.nho.has(x.key) && it.fs < mt - TH.smallSlack; }
    return true;
  };
  const pv = A.pv.filter(giuPv).map((x) => ({ loai: x.loai, key: x.key, n: x.d.n, ms: Math.round(x.d.ms), off: off(x.d.t0), it: x.it, anh: null }));
  // anh cho tung phat hien (toi da 8 / nhip)
  let dem = 0;
  const chupKhung = (tt, ten) => (dem++ < 14 ? luuKhung(chup, tt, `mau-${man}-${spec.ten}-${ten}`) : null);
  pv.forEach((p) => { p.anh = chupKhung(fin.t0 + p.off + Math.min(400, p.ms / 2), `${p.loai}-${p.off}ms`); });
  const bong = { el: (fin.bal[0] && fin.bal[0].el) || null, khong: !fin.bal.length, n: B.n, doi: B.doi, viet: B.viet, fsDoi: B.fsDoi, dich: B.dich, doiMax: B.doiMax, vietMax: B.vietMax, fsMax: B.fsMax, dichMax: B.dichMax,
    giua: (B.giua || []).map((x) => ({ off: off(x.t), ms: Math.round(x.ms), text: x.e.text, fs: x.e.fs, h: x.e.h, sauRaw: x.e.sauRaw, rawLen: x.e.rawLen, anh: chupKhung(x.t + Math.min(300, x.ms / 2), `bong-giua-${off(x.t)}ms`) })),
    cat: (B.cat || []).map((x) => ({ off: off(x.t), ms: Math.round(x.ms), text: x.e.text, giua: !!x.e.giua, cssEll: !!x.e.cssEll, clamp: !!x.e.clamp, clampAn: x.e.clampAn || 0, sauRaw: x.e.sauRaw, rawLen: x.e.rawLen, anh: chupKhung(x.t + Math.min(300, x.ms / 2), `bong-cat-${off(x.t)}ms`) })),
    tran: (B.tran || []).map((x) => ({ off: off(x.t), ms: Math.round(x.ms), text: x.e.text, cut: x.e.cut, side: x.e.side, ovf: x.e.ovf, fs: x.e.fs, h: x.e.h, anh: chupKhung(x.t + Math.min(300, x.ms / 2), `bong-tran-${off(x.t)}ms`) })),
    suy: (B.suy || []).map((x) => ({ off: off(x.off), ms: x.ms, tu: x.tu, den: x.den, anh: chupKhung(x.off, `bong-suy-${off(x.off)}ms`) })), tre: B.tre, ellDau: (fin.bal || []).filter((e) => e.ellDau).length,
    mau: (fin.bal || []).slice(0, 60).map((e) => ({ off: off(e.t), text: e.text, fs: e.fs, h: e.h, top: e.top, op: e.op, cut: e.cut, ell: e.ell, giua: e.giua })) };
  const cv = (c, ten) => { if (!c) return null; c.blank.forEach((b) => { b.anh = chupKhung(b.t0 + Math.min(200, b.ms / 2), `${ten}-blank-${Math.round(b.t0 - fin.t0)}ms`); }); return c; };
  const serie = rows.map((r) => [off(r.t), r.idx, r.lop ? 1 : 0, r.nText == null ? null : r.nText, r.nHien == null ? null : r.nHien, r.cover == null ? null : r.cover, r.movers == null ? null : r.movers, r.ms == null ? null : r.ms, r.pha === 'nhanh' ? 1 : 0]);
  return { n: rows.length, nLop: dsRows.length, msTB, msMax: Math.max(0, ...msAll), tSang: tSang ? off(tSang) : null, serie, pv, bong,
    chuyen: { vao: cv(chuyenVao, 'vao'), sang: cv(chuyenSang, 'sang') },
    feeds: seg.feeds.map((f) => ({ len: f.len, chunks: f.chunks, loi: f.loi || null, tXong: f.tXong ? off(f.tXong) : null, tBatDau: f.tBatDau ? off(f.tBatDau) : null })), tDo: moc.tDo ? off(moc.tDo) : null,
    giu: giuWin.map(([a, b]) => ({ tu: off(a + 50), den: off(b) })) };
}

async function chayMan(w, h, goc, pass, nhom, soNhom) {
  const stress = pass === 'stress';
  await sleep(1500 * (nhom + soNhom * (stress ? 1 : 0) + (w < 800 ? 2 * soNhom : 0)));   // so le khoi dong (tranh 8 Chrome cung nap trang mot luc)
  const ch = await moChrome({ w, h });
  const ket = [], loiTrang = [], daChayBai = [];
  try {
    const t = new Trang(ch.cdp, goc);
    await t.batDau(w, h);
    await chanTep(t);
    for (const [cap, so] of [['N5', 1], ['KANA', 5]]) {
      if (TUY.nhanh && cap === 'KANA') continue;
      if (cap === 'KANA' && soNhom > 1 && nhom !== soNhom - 1) continue;   // Nhap mon: chi mot nhom lam
      try {
        t.log.length = 0;
        let loi0 = null;
        for (let lan = 0; lan < 4; lan++) { try { await moBai(t, [cap, so], stress); loi0 = null; break; } catch (e) { loi0 = e; await sleep(2500); } }
        if (loi0) throw loi0;
        const ds = await dsNhip(t);
        const ns = chonNhip(ds, cap, stress).filter((n) => !TUY.chon || TUY.chon.includes(n.ten)).filter((n, k, arr) => soNhom <= 1 || arr.indexOf(n) % soNhom === nhom);
        ns.forEach((n) => { if (stress) { n.stress = true; n.ten += '[stress]'; } });
        daChayBai.push(`${cap}-${so}${stress ? '[stress]' : ''}: ${ns.map((n) => n.ten + '#' + n.i).join(', ')}`);
        for (const spec of ns) {
          try { await chayNhip(t, `${cap}-${so}`, spec, ket, { stress }); }
          catch (e) { ket.push({ man: w, bai: `${cap}-${so}`, nhip: spec.ten, kind: spec.kind, i: spec.i, nhan: spec.ten, kq: null, stress, loiChay: String(e && e.message || e).slice(0, 200) }); try { await t.dungGiang(); } catch (x) {} }
        }
        loiTrang.push(...t.loi().filter((x) => !/favicon|env\.js|tailwindcss\.com should not/.test(x.text)).slice(0, 5).map((x) => x.text.slice(0, 200)));
      } catch (e) {
        ket.push({ man: w, bai: `${cap}-${so}`, nhip: '*', kq: null, stress, loiChay: 'khong mo duoc bai: ' + String(e && e.message || e).slice(0, 200) });
      }
    }
  } finally {
    await ch.dong();
  }
  return { ket, loiTrang, daChayBai };
}

// =================================================================================================
//  TONG HOP: chuyen do tho -> van de co muc do -> Markdown
// =================================================================================================
function hcnTrongLonNhat(luoi) {
  const R = luoi.length, C = luoi[0].length;
  const e = luoi.map((s) => Array.from(s).map((c) => (c === 'e' ? 1 : 0)));
  let best = { n: 0 };
  for (let r1 = 0; r1 < R; r1++) for (let c1 = 0; c1 < C; c1++) {
    let cMax = C;
    for (let r2 = r1; r2 < R; r2++) {
      let c2 = c1;
      while (c2 < cMax && e[r2][c2]) c2++;
      cMax = c2;
      if (cMax === c1) break;
      const n = (r2 - r1 + 1) * (cMax - c1);
      if (n > best.n) best = { n, r1, r2, c1, c2: cMax - 1 };
    }
  }
  return best;
}

const so0 = (x) => Math.round(x);

/** Gom cac diem do thanh danh sach van de: { sev:'FAIL'|'WARN'|'INFO', loai, score, khoa, mo, sua, viTri } (van ban tieng Anh cho agent viet ma) */
function phanTich(ket) {
  const vd = new Map();   // khoa gop -> van de
  const nhoWarn = new Map();
  const anGop = new Map();
  const dem = { diem: 0, khongDo: 0 };
  const nen = (CHO_PHEP.theoChedo[ID] || {}).nenTang || [];
  const them = (khoa, sev, loai, score, viTri, mo, sua) => {
    // NEN TANG (baseline): loi da biet cua ban chap nhan duoc -> ha xuong INFO (chi ghi JSON + 1 dong cuoi Markdown)
    if (sev !== 'INFO' && nen.some((k) => khoa.startsWith(k))) { sev = 'INFO'; mo = '[baseline: known, accepted] ' + mo; }
    const e = vd.get(khoa);
    if (e) { e.viTri.add(viTri); if (sev === 'FAIL') e.sev = 'FAIL'; if (score > e.score) { e.score = score; e.mo = mo; } e.n++; }
    else vd.set(khoa, { khoa, sev, loai, score, viTri: new Set([viTri]), mo, sua, n: 1 });
  };
  const el = (c) => `${c.tag}${c.cls ? '.' + c.cls : ''}`;
  const Rc = (r) => `x=${r.l} y=${r.t} w=${r.w} h=${r.h}`;
  // tap duong dan (path) da bao boi phep do TINH cua tung nhip: chuyen canh khong bao lai cung phan tu
  const tinh = new Map();
  for (const d of ket) {
    if (d.isMau || !d.kq || !d.kq.ok) continue;
    const k = `${d.man}|${d.nhip}`;
    if (!tinh.has(k)) tinh.set(k, { clip: new Set(), meo: new Set(), chong: new Set(), nho: new Set() });
    const S = tinh.get(k);
    for (const m of [d.kq.m1, d.kq.m2]) {
      if (!m) continue;
      (m.clip || []).forEach((x) => S.clip.add(x.path)); (m.meoChong || []).forEach((x) => S.meo.add(x.path));
      (m.chong || []).forEach((x) => S.chong.add(x.a.path + '|' + x.b.path)); (m.nho || []).forEach((x) => S.nho.add(x.path));
    }
  }
  for (const d of ket) {
    if (d.isMau) continue;
    const nhanViTri = `${d.nhip}${d.kq && d.kq.muon ? '(late)' : ''}@${d.man}`;
    if (!d.kq || !d.kq.ok) {
      const ly = d.loiChay || (d.kq && d.kq.lyDo) || 'could not measure';
      them(`khong-do|${d.nhip}|${d.man}`, 'WARN', 'NOT-MEASURED', 50, nhanViTri, ly,
        d.kq && d.kq.lyDo
          ? 'dungNhip returned null (or the layer was removed) for this beat kind, so the default scene shows: add a builder for it (see DUNG[kind] in js/che-do/s.js) or accept the default.'
          : 'The beat did not play to the measuring point: look for console errors or a stuck state (quiz waiting, cue never fired).');
      dem.khongDo++;
      continue;
    }
    dem.diem++;
    const m1 = d.kq.m1, m2 = d.kq.m2 || d.kq.m1;
    const giu = (ds1, ds2, kf) => { const s2 = new Set(ds2.map(kf)); return ds1.filter((x) => s2.has(kf(x))); };
    const min = TH.minFs[d.man];
    // a CLIP
    for (const c of giu(m1.clip, m2.clip, (x) => x.path)) {
      if (c.ok) continue;
      const cn = c.boKind === 'cuon';
      const fail = !cn && (c.frac >= TH.clipFailFrac || c.cut > TH.clipFailPx);
      let sev = fail ? 'FAIL' : (c.cut <= TH.clipWarnPx ? 'INFO' : 'WARN');
      if (c.ell) sev = c.frac >= TH.ellipsisWarnFrac ? 'WARN' : 'INFO';   // cat co chu y (ellipsis / line-clamp)
      const bien = c.boTag === 'viewport' ? 'the viewport' : `${c.boTag}${c.boCls ? '.' + c.boCls : ''}`;
      const huong = { l: 'left', r: 'right', t: 'top', b: 'bottom' }[c.side];
      const ngang = c.side === 'l' || c.side === 'r';
      const sw = c.sw != null && (c.sw > c.cw + 2 || c.sh > c.ch + 2) ? ` (scrollW ${c.sw} vs clientW ${c.cw}, scrollH ${c.sh} vs clientH ${c.ch})` : '';
      them(`clip|${d.man}|${c.tag}.${c.cls}|${c.side}`, sev, c.ell ? 'CLIPPED-ELLIPSIS' : 'CLIPPED', 100 + c.frac * 100 + c.cut, nhanViTri,
        `${el(c)} "${c.txt}" rect ${Rc(c.rect)}: ${c.cut}px cut off at the ${huong} by ${bien}${c.boTag === 'viewport' ? '' : ` (${cn ? 'scroll box' : 'overflow hidden'} x=${c.boRect.l}..${c.boRect.r} y=${c.boRect.t}..${c.boRect.b})`}${sw}; ${so0(c.thay * 100)}% still visible`,
        c.ell ? 'the text is truncated with an ellipsis: give it more room (wider box) or shorten it.'
          : ngang ? `let the text wrap (min-width:0; overflow-wrap:anywhere) or widen the box by >= ${so0(c.cut)}px or reduce font-size until ${so0(c.rect.w)}px fits; nothing may extend past ${bien}.`
            : `heighten the box by >= ${so0(c.cut)}px, or reduce font-size/line-height/padding, or drop overflow:hidden on ${bien} if the cut is only a reveal mask.`);
    }
    // b MEO
    for (const c of giu(m1.meoChong, m2.meoChong, (x) => x.path)) {
      if (c.ok) continue;
      const fail = c.f >= TH.catFailFrac || Math.min(c.ix, c.iy) > TH.catFailPx;
      const lopX = so0(m1.meo.l - m1.lop.l), lopY = so0(m1.meo.t - m1.lop.t);
      them(`meo|${d.man}|${c.tag}.${c.cls}`, fail ? 'FAIL' : 'WARN', 'ON-CAT', 200 + c.f * 100 + Math.min(c.ix, c.iy), nhanViTri,
        `${el(c)} "${c.txt}" rect ${Rc(c.rect)} overlaps the cat rectangle by ${c.ix}x${c.iy}px (${so0(c.f * 100)}% of the line); cat rect x=${so0(m1.meo.l)}..${so0(m1.meo.r)} y=${so0(m1.meo.t)}..${so0(m1.meo.b)} (layer coords x>=${lopX}, y>=${lopY})`,
        `keep the bottom-right corner free: api.meo() gives {x,y,w,h} in layer coords, so end the block at right <= ${lopX} (or bottom <= ${lopY}) or shrink its width.`);
    }
    // b2 UNDER-DECOR (vung cam)
    for (const c of giu(m1.camChong || [], m2.camChong || [], (x) => x.path)) {
      const fail = c.f >= TH.catFailFrac || c.iy > TH.catFailPx;
      them(`cam|${d.man}|${c.tag}.${c.cls}`, fail ? 'FAIL' : 'WARN', 'UNDER-DECOR', 200 + c.f * 100 + c.iy, nhanViTri,
        `${el(c)} "${c.txt}" rect ${Rc(c.rect)} sits ${c.iy}px (${so0(c.f * 100)}% of its line height) under the ${c.vung}, which is painted ABOVE the content from layer y=${c.zt}`,
        `end the block above layer y=${c.zt} (move it up, shrink it, or reduce font-size).`);
    }
    // c CHU-CHONG-CHU
    for (const c of giu(m1.chong, m2.chong, (x) => x.a.path + '|' + x.b.path)) {
      if (c.ok) continue;
      them(`chong|${d.man}|${c.a.tag}.${c.a.cls}|${c.b.tag}.${c.b.cls}`, c.f >= TH.overlapFailFrac ? 'FAIL' : 'WARN', 'TEXT-OVERLAP', 150 + c.f * 100, nhanViTri,
        `${el(c.a)} "${c.a.txt}" overlaps ${el(c.b)} "${c.b.txt}" by ${c.ix}x${c.iy}px (${so0(c.f * 100)}% of the smaller) at x=${c.at.l} y=${c.at.t}`,
        'give the two blocks separate regions (grid/flex column with a gap instead of position:absolute); if one is a faint decoration add data-decor or a class containing "decor"/"bong".');
    }
    // d CHU NHO
    for (const c of giu(m1.nho, m2.nho, (x) => x.path)) {
      if (c.cong) continue;
      let toiThieu = min;
      if (c.rt) toiThieu = TH.minFsRt;
      else if (c.nhanHoa) toiThieu = TH.minFsEyebrow;
      if (c.fs >= toiThieu - TH.smallSlack) continue;
      const fail = c.fs < toiThieu * TH.smallFailRatio;
      const mota = `${el(c)} "${c.txt}" ${c.fs}px${c.sc !== 1 ? ` (css ${c.fs0}px x scale ${c.sc})` : ''}`;
      if (fail) {
        them(`nho|${d.man}|${c.tag}.${c.cls}`, 'FAIL', 'SMALL-TYPE', 120 + (toiThieu - c.fs) * 4, nhanViTri,
          `${mota}; minimum here is ${toiThieu}px${c.rt ? ' (furigana)' : c.nhanHoa ? ' (uppercase decorative label)' : ''}`,
          `set font-size >= ${toiThieu}px on ${el(c)} (use max(${toiThieu}px, ...) if it is clamp()/cqh/vw based)${c.sc !== 1 ? '; remove the transform scale that shrinks it' : ''}.`);
      } else {
        // WARN: gop MOT bullet cho moi man hinh (tranh ngap bullet vi nhan nho 12-13 px)
        const k = `${d.man}`;
        if (!nhoWarn.has(k)) nhoWarn.set(k, { ds: new Map(), viTri: new Set(), min: min });
        const g = nhoWarn.get(k);
        g.viTri.add(nhanViTri);
        const kk = `${c.tag}.${c.cls}|${toiThieu}`;
        if (!g.ds.has(kk) || g.ds.get(kk).fs > c.fs) g.ds.set(kk, { mota, fs: c.fs, toiThieu });
      }
    }
    // g AN (chu bi cat het)
    {
      const an2 = new Set((m2.an || []).map((x) => x.path));
      for (const c of (m1.an || []).filter((x) => an2.has(x.path))) {
        if (c.ok || c.boKind === 'cuon') continue;   // vung cuon cua app (the bai tap) / danh sach cho phep: khong tinh
        const k = `${d.man}`;
        if (!anGop.has(k)) anGop.set(k, { ds: new Map(), viTri: new Set() });
        const g = anGop.get(k);
        g.viTri.add(nhanViTri);
        g.ds.set(`${c.tag}.${c.cls}`, `${el(c)} "${c.txt}"`);
      }
    }
    // f TOKEN
    if (m2.thieu && m2.thieu.length && m1.thieu) {
      const chung = m1.thieu.filter((x) => m2.thieu.includes(x));
      if (chung.length) them(`token|${d.man}|${d.nhip}`, 'FAIL', 'MISSING-TOKENS', 400 + chung.length, nhanViTri,
        `${chung.length} of ${d.kq.nTok || chung.length} tokens of the sentence are not visible at the end of the beat: ${chung.map((x) => '"' + x + '"').join(' ')} (visible text starts: "${String(m2.chuDong || '').slice(0, 50)}...")`,
        'every token in data.tokens (kanji or text) must be visible text when the beat ends: check the karaoke/cue reveals all of them, that late tokens are not clipped or left at opacity 0, and that a long sentence wraps instead of being cut.');
    }
    // e TRONG
    const a = d.kq.anh;
    if (a && a.luoi) {
      const soO = TH.cols * TH.rows - a.soMeo;
      let nTrong = 0;
      a.luoi.forEach((s) => { for (const c of s) if (c === 'e') nTrong++; });
      const pct = soO ? (nTrong * 100) / soO : 0;
      const hcn = hcnTrongLonNhat(a.luoi);
      const pctHcn = (hcn.n * 100) / (TH.cols * TH.rows);
      d.trong = { pct: +pct.toFixed(1), pctHcn: +pctHcn.toFixed(1), hcn };
      const lopW = m1.lop.w, lopH = m1.lop.h;
      const rectPx = hcn.n ? { x: so0(m1.lop.l + (hcn.c1 * lopW) / TH.cols), y: so0(m1.lop.t + (hcn.r1 * lopH) / TH.rows), w: so0(((hcn.c2 - hcn.c1 + 1) * lopW) / TH.cols), h: so0(((hcn.r2 - hcn.r1 + 1) * lopH) / TH.rows) } : null;
      d.trong.rectPx = rectPx;
      const fail = pct > TH.emptyFail || pctHcn > TH.rectFail;
      const warn = pct > TH.emptyWarn || pctHcn > TH.rectWarn;
      if ((fail || warn) && rectPx) {
        them(`trong|${d.man}|${d.nhip}`, fail ? 'FAIL' : 'WARN', 'EMPTY-AREA', 300 + Math.max(pct, pctHcn * 1.5), nhanViTri,
          `${so0(pct)}% of the frame cells hold no content (limit ${TH.emptyFail}%); largest empty rectangle = ${so0(pctHcn)}% of the frame (limit ${TH.rectFail}%): x=${rectPx.x} y=${rectPx.y} w=${rectPx.w} h=${rectPx.h}, ${vungTen(rectPx, m1.lop)}`,
          'fill that region: scale the content up (bigger type / illustration, flex:1 1 auto so the box stretches), centre it vertically in its box, or re-flow the layout so no flat panel is left mostly blank.');
      }
    }
  }
  // ===================================================================== V2: cac phep do lay mau
  const gonTen = (x) => x.length > 60 ? x.slice(0, 57) + '...' : x;
  const guiChuoi = (a) => a.replace(/\s+/g, ' ');
  const tbBong = new Map();
  for (const d of ket) {
    if (!d.isMau) continue;
    const m = d.mau;
    dem.mau = (dem.mau || 0) + (m ? 1 : 0);
    if (!m) { them(`khong-do-mau|${d.nhip}|${d.man}`, 'WARN', 'NOT-MEASURED', 40, `${d.nhip}@${d.man}`, `sampler failed: ${d.loiMau || 'no data'}`, 'check the console errors of the page; the transition sampler could not read the beat.'); continue; }
    const viTri = `${d.nhip}@${d.man}`;
    const min = TH.minFs[d.man];
    const ST = tinh.get(`${d.man}|${d.nhip}`) || { clip: new Set(), meo: new Set(), chong: new Set(), nho: new Set() };
    const at = (p) => `t+${p.off}ms for ${p.ms}ms`;
    const fr = (p) => (p.anh ? ` [frame ${p.anh}]` : '');
    for (const p of m.pv) {
      const it = p.it;
      const dur = p.ms >= NG.failMs;
      if (p.loai === 'clip') {
        if (ST.clip.has(p.key)) continue;
        const cn = it.boKind === 'cuon';
        const fail = !cn && (it.frac >= TH.clipFailFrac || it.cut > TH.clipFailPx);
        let sev = fail && dur ? 'FAIL' : (it.cut <= TH.clipWarnPx ? 'INFO' : 'WARN');
        if (it.ell) sev = it.frac >= TH.ellipsisWarnFrac ? 'WARN' : 'INFO';
        if (sev === 'INFO') continue;
        const huong = { l: 'left', r: 'right', t: 'top', b: 'bottom' }[it.side];
        const bien = it.boTag === 'viewport' ? 'the viewport' : `${it.boTag}${it.boCls ? '.' + it.boCls : ''}`;
        them(`t-clip|${d.man}|${it.tag}.${it.cls}|${it.side}`, sev, 'T-CLIPPED', 90 + it.frac * 100 + it.cut, viTri,
          `during the beat (${at(p)}) ${it.tag}${it.cls ? '.' + it.cls : ''} "${it.txt}" rect x=${it.rect.l} y=${it.rect.t} w=${it.rect.w} h=${it.rect.h} is cut ${it.cut}px at the ${huong} by ${bien}${fr(p)}`,
          'this clipping exists only mid-beat (not in the final state): let the box grow with its content, or make the entrance animation finish before the text is placed; a reveal mask (overflow:hidden) must not hold text for > 300 ms.');
      } else if (p.loai === 'meo') {
        if (ST.meo.has(p.key)) continue;
        const fail = it.f >= TH.catFailFrac || Math.min(it.ix, it.iy) > TH.catFailPx;
        them(`t-meo|${d.man}|${it.tag}.${it.cls}`, fail && dur ? 'FAIL' : 'WARN', 'T-ON-CAT', 180 + it.f * 100, viTri,
          `during the beat (${at(p)}) ${it.tag}${it.cls ? '.' + it.cls : ''} "${it.txt}" overlaps the cat by ${it.ix}x${it.iy}px (${so0(it.f * 100)}% of the line)${fr(p)}`,
          'the block passes under the cat while it enters/settles: keep the bottom-right corner (api.meo()) free for the whole beat, not only for the final layout.');
      } else if (p.loai === 'chong') {
        if (ST.chong.has(p.key)) continue;
        const fail = it.f >= TH.overlapFailFrac;
        them(`t-chong|${d.man}|${it.a.tag}.${it.a.cls}|${it.b.tag}.${it.b.cls}`, fail && dur ? 'FAIL' : 'WARN', 'T-OVERLAP', 140 + it.f * 100, viTri,
          `during the beat (${at(p)}) ${it.a.tag}${it.a.cls ? '.' + it.a.cls : ''} "${it.a.txt}" overlaps ${it.b.tag}${it.b.cls ? '.' + it.b.cls : ''} "${it.b.txt}" by ${it.ix}x${it.iy}px (${so0(it.f * 100)}% of the smaller) at x=${it.at.l} y=${it.at.t}${fr(p)}`,
          'two visible blocks share the same space for > 300 ms while one enters or leaves: sequence them (outgoing block fully faded / removed before the incoming block is placed), or give them separate regions.');
      } else if (p.loai === 'nho') {
        if (ST.nho.has(p.key)) continue;
        let toiThieu = min; if (it.rt) toiThieu = TH.minFsRt; else if (it.nhanHoa) toiThieu = TH.minFsEyebrow;
        if (it.fs >= toiThieu - TH.smallSlack) continue;
        const fail = it.fs < toiThieu * TH.smallFailRatio;
        them(`t-nho|${d.man}|${it.tag}.${it.cls}`, fail && dur ? 'FAIL' : 'WARN', 'T-SMALL', 100 + (toiThieu - it.fs) * 3, viTri,
          `during the beat (${at(p)}) ${it.tag}${it.cls ? '.' + it.cls : ''} "${it.txt}" is ${it.fs}px${it.sc !== 1 ? ` (css ${it.fs0}px x scale ${it.sc})` : ''}, minimum ${toiThieu}px${fr(p)}`,
          it.sc < 0.9 ? 'text scaled down by an entrance transform stays small for > 300 ms: start from scale >= 0.85 and finish within 250 ms, or animate opacity/translate only.' : `in this state of the beat the font is below the minimum (it is not caught by the settled-state measurement): raise font-size to >= ${toiThieu}px for ${it.tag}${it.cls ? '.' + it.cls : ''}.`);
      } else if (p.loai === 'mo') {
        them(`mo|${d.man}|${it.tag}.${it.cls}`, p.ms >= 1500 ? 'FAIL' : 'WARN', 'FADED-TEXT', 260 + Math.min(50, p.ms / 100), viTri,
          `${it.tag}${it.cls ? '.' + it.cls : ''} "${it.txt}" stays at opacity ${it.op} (between ${NG.fadeLo} and ${NG.fadeHi}) without changing ${at(p)} — a half-faded "waiting" placeholder${fr(p)}`,
          'either show the final text at full opacity when the beat starts, or keep it hidden (opacity 0 / visibility hidden) until its cue fires; never park real words at 40-60% opacity as a placeholder.');
      } else if (p.loai === 'glyph') {
        them(`glyph|${d.man}|${it.tag}.${it.cls}`, 'FAIL', 'PLACEHOLDER', 270 + Math.min(50, p.ms / 100), viTri,
          `${it.tag}${it.cls ? '.' + it.cls : ''} shows a lone "${it.txt}" tile (${it.rect.w}x${it.rect.h}px at x=${it.rect.l} y=${it.rect.t}, opacity ${it.op}) for ${p.ms}ms (from t+${p.off}ms)${fr(p)}`,
          'a "?" placeholder tile must not stay on screen: reveal the real content with its cue, or hide the tile until then (visibility hidden), or replace it by a real label.');
      } else if (p.loai === 'baldup') {
        them(`baldup|${d.man}`, 'WARN', 'DUPLICATE-TEXT', 205 + Math.min(40, p.ms / 100), viTri,
          `the live-transcript balloon repeats text that is already visible on the stage (${at(p)}): balloon "${gonTen(it.tb)}" shares "${it.g}" with ${it.ca ? '.' + it.ca : 'another node'} "${gonTen(it.ta)}"${fr(p)}`,
          'do not echo on the balloon what the board already shows: skip the balloon while a cue on the same sentence is on screen, or show only the words the board does not show (explanations, tips).');
      } else if (p.loai === 'dup') {
        if (p.ms < 600) continue;
        them(`dup|${d.man}|${it.ca}|${it.cb}`, 'WARN', 'DUPLICATE-TEXT', 200 + Math.min(40, p.ms / 100), viTri,
          `the same text appears twice on screen (${at(p)}): ${it.ca ? '.' + it.ca : 'node'} "${gonTen(it.ta)}"  <->  ${it.cb ? '.' + it.cb : 'node'} "${gonTen(it.tb)}" (shared string "${it.g}")${fr(p)}`,
          'show each sentence once: if the live transcript balloon repeats what the board already shows, drop it from one of them (or show only the part not yet visible).');
      }
    }
    // ---- BONG THOAI (dong loi Sensei)
    const bg = m.bong;
    const giaLoi = m.feeds && m.feeds.length;
    if (bg) {
      if (giaLoi && bg.khong) tbBong.set(d.man, 'khong');
      const nhanB = bg.el ? bg.el : 'balloon';
      const kt = (x) => guiChuoi(gonTen(x.text));
      if (bg.giua.length) {
        const x = bg.giua.reduce((a, b) => (b.ms > a.ms ? b : a));
        them(`bong-giua|${d.man}`, 'FAIL', 'BALLOON-CUT-MIDWORD', 380 + Math.min(20, x.ms / 100), viTri,
          `the live-transcript balloon (${nhanB}) ends in the middle of a word: "${kt(x)}" for ${x.ms}ms (from t+${x.off}ms), font ${x.fs}px, ${x.sauRaw != null ? x.sauRaw + ' more character(s) of the same sentence are hidden' : 'the spoken sentence continues'}${x.anh ? ` [frame ${x.anh}]` : ''}`,
          'do not truncate with a hard character count (ngan(cau, N) cuts inside words and shows the START of a long sentence while Sensei is already saying the end): keep the latest words instead (cut at a word boundary from the front, prefix "…"), let the font fit / line-clamp handle the size, and keep the newest word visible.');
      }
      const soCat = bg.cat.filter((x) => !x.giua);
      if (soCat.length) {
        const x = soCat.reduce((a, b) => (((b.sauRaw || 0) + (b.clampAn || 0) * 30 + b.ms / 1000) > ((a.sauRaw || 0) + (a.clampAn || 0) * 30 + a.ms / 1000) ? b : a));
        const hid = x.sauRaw || 0;
        const fail = hid >= 20 || (x.clamp && x.ms >= 1500);
        them(`bong-cat|${d.man}`, fail ? 'FAIL' : 'WARN', 'BALLOON-TRUNCATED', 340 + Math.min(20, hid / 5 + x.ms / 1000), viTri,
          `the balloon (${nhanB}) shows a truncated text ${x.clamp ? `(line-clamp hides the last ${x.clampAn || 1} line(s))` : 'ending with an ellipsis'}: "${kt(x)}" for ${x.ms}ms (from t+${x.off}ms); ${hid ? hid + ' character(s) of the current sentence are not shown anywhere' : x.clamp ? 'the words Sensei is saying right now are the ones cut off' : 'the full text is not available'}${x.anh ? ` [frame ${x.anh}]` : ''}`,
          'an ellipsis is fine only when the full text is shown elsewhere; here it hides part of what Sensei is saying: shrink the font step by step to fit, or show the last words (tail) instead of the head, or scroll/marquee the line.');
      }
      if (bg.tran.length) {
        const x = bg.tran.reduce((a, b) => ((b.cut + b.ovf) > (a.cut + a.ovf) ? b : a));
        them(`bong-tran|${d.man}`, 'FAIL', 'BALLOON-OVERFLOW', 370 + Math.min(20, x.ms / 100), viTri,
          `the balloon (${nhanB}) text overflows or is clipped: "${kt(x)}" cut ${x.cut}px at ${x.side || '-'} (scroll overflow ${x.ovf}px) for ${x.ms}ms from t+${x.off}ms, font ${x.fs}px${x.anh ? ` [frame ${x.anh}]` : ''}`,
          'the box is too small for a long sentence even at the minimum font: raise the minimum font only if the box grows too, allow 3 lines, or keep only the newest words; never let text run past the bubble outline.');
      }
      if (bg.suy && bg.suy.length) {
        const x = bg.suy[0];
        them(`bong-suy|${d.man}`, 'WARN', 'BALLOON-COLLAPSE', 320 + Math.min(20, x.ms / 100), viTri,
          `the balloon (${nhanB}) drops from a long line to a fragment in the middle of a sentence (${bg.suy.length}x): "${gonTen(guiChuoi(x.tu))}" -> "${gonTen(guiChuoi(x.den))}" and stays so for ${x.ms}ms (t+${x.off}ms)${x.anh ? ` [frame ${x.anh}]` : ''}`,
          'while a sentence is still being spoken keep showing its latest words (a sliding window of at least the last ~6 words); only start a new line at a sentence end.');
      }
      if (giaLoi && bg.tre != null && bg.tre > NG.balLateMs) {
        them(`bong-tre|${d.man}`, 'WARN', 'BALLOON-LATE', 310 + Math.min(20, bg.tre / 500), viTri,
          `the balloon (${nhanB}) stayed empty for ${bg.tre}ms after the first transcript chunk arrived (limit ${NG.balLateMs}ms): the early chunks are dropped`,
          'keep the raw transcript even when the balloon layer is not built yet (store it before the "if (!layer) return"), and draw it as soon as the layer exists.');
      }
      const sevJ = (bg.vietMax >= NG.balRewriteFail || bg.fsMax >= NG.balFsFail || bg.dichMax >= NG.balShiftFail) ? 'FAIL'
        : ((bg.vietMax >= NG.balRewriteWarn || bg.fsMax >= NG.balFsWarn || bg.dichMax >= NG.balShiftWarn || bg.doiMax >= NG.balRateWarn) ? 'WARN' : null);
      if (sevJ && bg.n > 4) {
        const chi = [];
        if (bg.vietMax >= NG.balRewriteWarn) chi.push(`${bg.vietMax} full rewrites in 1 s (total ${bg.viet})`);
        if (bg.fsMax >= NG.balFsWarn) chi.push(`${bg.fsMax} font-size changes in 1 s (total ${bg.fsDoi})`);
        if (bg.dichMax >= NG.balShiftWarn) chi.push(`${bg.dichMax} box/height shifts in 1 s (total ${bg.dich})`);
        if (bg.doiMax >= NG.balRateWarn) chi.push(`${bg.doiMax} text changes in 1 s (limit ${NG.balRateWarn})`);
        them(`bong-nhay|${d.man}`, sevJ, 'BALLOON-JITTER', 330 + bg.vietMax * 3 + bg.fsMax, viTri,
          `the balloon (${nhanB}) jumps while text streams: ${chi.join('; ')} (total ${bg.doi} changes over the beat)`,
          'update the balloon at most every 400 ms, append instead of rewriting, keep the font size fixed while a sentence grows (fit once per sentence), and do not swap between "previous + current sentence" and "current sentence" as the length crosses a threshold.');
      }
    }
    // ---- CHUYEN CANH
    for (const ph of ['vao', 'sang']) {
      const c = m.chuyen && m.chuyen[ph];
      if (!c) continue;
      const nh = ph === 'sang' ? `${d.nhip}>next` : `${d.nhip}`;
      const vt = `${nh}@${d.man}`;
      for (const b of c.blank) {
        // 'vao' = bat dau nhip tu trang thai DUNG (san khau mo lai): chi WARN; 'sang' = chuyen nhip that: > 250 ms = FAIL
        const fail = b.ms > NG.blankFailMs && ph === 'sang';
        if (!fail && b.ms < NG.blankWarnMs) continue;
        them(`trang|${d.man}|${ph}`, fail ? 'FAIL' : 'WARN', 'BLANK-FLASH', 290 + Math.min(40, b.ms / 20), vt,
          `${ph === 'sang' ? 'while changing to the next beat' : 'while starting the beat from idle (includes the stage opening)'} the frame content drops to ${so0(b.min * 100)}% coverage (settled state ${so0(c.settled * 100)}%) for ${b.ms}ms from t+${b.off}ms${b.lopVang ? ' (stage layer absent)' : ''}${b.anh ? ` [frame ${b.anh}]` : ''}`,
          'a blank flash between beats: build the incoming layout before removing the outgoing one (cross-fade / overlap the last 150 ms of exit with the first 150 ms of entrance), and never clear the layer before the new content is in the DOM.');
      }
      if (ph === 'sang' && c.dauMs != null && c.dauMs > NG.dauSlowMs) {
        them(`cham|${d.man}`, 'WARN', 'SLOW-CONTENT', 120 + Math.min(40, c.dauMs / 200), vt,
          `the first meaningful content of the next beat appears ${c.dauMs}ms after the beat change (limit ${NG.dauSlowMs}ms)`,
          'show the beat title/first block at once when the beat starts; reveal the detail with the cues.');
      }
      if (c.maxMovers >= NG.moversWarn) {
        them(`chuyen|${d.man}|${ph}`, 'WARN', 'MANY-MOVERS', 110 + Math.min(40, c.maxMovers), vt,
          `${c.maxMovers} independent elements move or fade at the same time (t+${c.maxMoversT}ms); limit ${NG.moversWarn}`,
          'stagger the entrance (30-60 ms per block) or animate the group as one element so the eye can follow.');
      }
    }
  }
  // thong ke chuyen canh (nhip > nhip ke tiep): do tre den noi dung co nghia dau tien, so phan tu chuyen dong dong thoi, so lan chop trang
  {
    const dau = [], mov = [], perMan = {};
    let blank = 0, n = 0;
    for (const d of ket) {
      const c = d.isMau && d.mau && d.mau.chuyen && d.mau.chuyen.sang;
      if (!c) continue;
      n++;
      if (c.dauMs != null) dau.push(c.dauMs);
      mov.push(c.maxMovers || 0);
      blank += c.blank.filter((b) => b.ms >= NG.blankWarnMs).length;
    }
    const med = (a) => { if (!a.length) return 0; const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
    dem.trans = { n, dauMed: med(dau), dauMax: Math.max(0, ...dau), movMed: med(mov), movMax: Math.max(0, ...mov), blank };
  }
  tbBong.forEach((v, man) => {
    if (v === 'khong') them(`bong-ko|${man}`, 'WARN', 'BALLOON-NOT-FOUND', 60, `balloon@${man}`, 'the probe fed a long transcript but found no balloon element to observe (selector list: ' + balSel().join(', ') + ')', 'run with --bong <css selector> for the element that shows the live transcript.');
  });
  anGop.forEach((g, man) => {
    const ds = [...g.ds.values()];
    vd.set(`an|${man}`, { khoa: `an|${man}`, sev: 'WARN', loai: 'HIDDEN-TEXT', score: 90 + ds.length, viTri: g.viTri, n: ds.length,
      mo: `${ds.length} text element type(s) are completely clipped away although opacity > 0, e.g. ${ds.slice(0, 4).join(' ; ')}${ds.length > 4 ? ' ; ...' : ''}`,
      sua: 'content that is never revealed or is parked outside its overflow:hidden box is lost to the viewer: make sure the reveal ends with translate/clip reset, enlarge the box, or remove the element for that beat.' });
  });
  nhoWarn.forEach((g, man) => {
    const ds = [...g.ds.values()].sort((a, b) => a.fs - b.fs);
    const ten = ds.slice(0, 5).map((x) => x.mota).join(' ; ');
    vd.set(`nho-tong|${man}`, { khoa: `nho-tong|${man}`, sev: 'WARN', loai: 'SMALL-TYPE', score: 100 + ds.length, viTri: g.viTri, n: ds.length,
      mo: `${ds.length} element type(s) below ${g.min}px but above the fail level; smallest: ${ten}${ds.length > 5 ? ' ; ...' : ''}`,
      sua: `raise them to >= ${g.min}px (uppercase decorative labels >= ${TH.minFsEyebrow}px, furigana >= ${TH.minFsRt}px); with cqh/vw/em units wrap in max(${g.min}px, ...).` });
  });
  return { vd: [...vd.values()], dem };
}
const vwHint = (man) => (man === 390 ? '390x844' : '1440x900');
function vungTen(r, lop) {
  const cx = (r.x + r.w / 2 - lop.l) / lop.w, cy = (r.y + r.h / 2 - lop.t) / lop.h;
  return (cy < 0.34 ? 'top' : cy > 0.66 ? 'bottom' : 'middle') + '-' + (cx < 0.34 ? 'left' : cx > 0.66 ? 'right' : 'centre');
}

function viTriGon(set) {
  const a = [...set];
  const tg = new Map();
  a.forEach((s) => { const [nhip, man] = s.split('@'); if (!tg.has(nhip)) tg.set(nhip, []); tg.get(nhip).push(man); });
  const ds = [...tg.entries()].map(([n, ms]) => `${n}@${ms.join('+')}`);
  return ds.length > 6 ? ds.slice(0, 6).join(', ') + `, +${ds.length - 6} more` : ds.join(', ');
}

const ORD = { FAIL: 0, WARN: 1, INFO: 2 };
function viet(kq) {
  const { vd, dem } = kq;
  const info = vd.filter((x) => x.sev === 'INFO').length;
  const fail = vd.filter((x) => x.sev === 'FAIL').length, warn = vd.length - fail - info;
  vd.sort((a, b) => (a.sev === b.sev ? b.score - a.score : ORD[a.sev] - ORD[b.sev]));
  const dong = [];
  const tieuDe = fail ? `LAYOUT PROBE FAILED: mode "${ID}" — ${fail} FAIL, ${warn} WARN` : (warn ? `LAYOUT PROBE PASSED with ${warn} warning(s): mode "${ID}"` : `LAYOUT PROBE PASSED: mode "${ID}" — no problems`);
  dong.push('# ' + tieuDe, '');
  dong.push(`Measured ${dem.diem} settled states (${MAN.map(([w, h]) => w + 'x' + h).join(' and ')}; beats: title, vocab, kanji, grammar, example, kaiwa, quiz, chapter card, finish card; KANA-5 kana) after every cue finished + 1.5 s, plus ${dem.mau || 0} beat timelines sampled every 100 ms from beat start to the next beat (${PASSES.map((x) => (x === 'stress' ? 'STRESS = worst real curriculum content + long streaming transcript' : 'normal content')).join(' and ')}). Coordinates are CSS px in the viewport. Each bullet = one problem, worst first; "beat@width" lists where it occurs ("(late)" = measured just after the next beat started; "[stress]" = worst-content pass; "beat>next" = while changing to the next beat; "t+N ms" = offset from the beat start).`, '');
  {
    const CHECK = { 'CLIPPED': 'CLIP', 'CLIPPED-ELLIPSIS': 'CLIP', 'T-CLIPPED': 'CLIP', 'ON-CAT': 'CAT', 'T-ON-CAT': 'CAT', 'UNDER-DECOR': 'DECOR', 'TEXT-OVERLAP': 'OVERLAP', 'T-OVERLAP': 'OVERLAP', 'SMALL-TYPE': 'SMALL', 'T-SMALL': 'SMALL',
      'EMPTY-AREA': 'EMPTY', 'MISSING-TOKENS': 'TOKENS', 'HIDDEN-TEXT': 'HIDDEN', 'FADED-TEXT': 'FADED', 'PLACEHOLDER': 'PLACEHOLDER', 'DUPLICATE-TEXT': 'DUP', 'BLANK-FLASH': 'BLANK', 'SLOW-CONTENT': 'SLOW', 'MANY-MOVERS': 'MOVERS', 'NOT-MEASURED': 'NOT-MEASURED' };
    const cnt = new Map();
    vd.filter((x) => x.sev !== 'INFO').forEach((x) => {
      const k = CHECK[x.loai] || (/^BALLOON/.test(x.loai) ? x.loai : x.loai);
      const e = cnt.get(k) || { F: 0, W: 0 };
      if (x.sev === 'FAIL') e.F++; else e.W++;
      cnt.set(k, e);
    });
    const parts = [...cnt.entries()].sort((a, b) => (b[1].F - a[1].F) || (b[1].W - a[1].W)).map(([k, e]) => `${k} ${e.F ? e.F + ' FAIL' : ''}${e.F && e.W ? ' / ' : ''}${e.W ? e.W + ' WARN' : ''}`);
    dong.push(`Summary: ${fail} FAIL, ${warn} WARN${parts.length ? ' | ' + parts.join(' | ') : ''}`);
    const T = dem.trans;
    if (T && T.n) dong.push(`Transitions (beat>next, ${T.n} sampled): first meaningful content of the next beat after ${T.dauMed} ms (median) / ${T.dauMax} ms (max); simultaneous moving elements ${T.movMed} (median) / ${T.movMax} (max); blank flashes >= ${NG.blankWarnMs} ms: ${T.blank}.`);
    dong.push('');
  }
  const cap = vd.filter((x) => x.sev !== 'INFO').slice(0, TH.maxBullets);
  cap.forEach((x, i) => {
    dong.push(`- **[${x.sev}] ${x.loai}** | ${viTriGon(x.viTri)}${x.n > 1 ? ` (x${x.n})` : ''} | ${x.mo} | FIX: ${x.sua}`);
  });
  if (fail + warn > cap.length) dong.push(`- (+${fail + warn - cap.length} more lower-priority problems omitted; see the JSON)`);
  if (!fail && !warn) dong.push('- Nothing to fix.');
  if (info) dong.push('', `(${info} minor/known item(s) not listed: intentional ellipsis / line-clamp truncation, cuts <= ${TH.clipWarnPx}px, accepted baseline items; see the JSON.)`);
  return { md: dong.join('\n') + '\n', fail, warn };
}

// ---------------------------------------------------------------- chay
const t0 = Date.now();
const PASSES = TUY.stress ? ['stress'] : (TUY.khongStress ? ['thuong'] : ['thuong', 'stress']);
const goc = await moServer();
let ketQua = { man: {} };
try {
  const dv = [];
  for (const pass of PASSES) for (const [w, h] of MAN) for (let k = 0; k < TUY.nhom; k++) dv.push([w, h, pass, k]);
  let res;
  if (TUY.tuanTu) { res = []; for (const [w, h, pass, k] of dv) res.push(await chayMan(w, h, goc, pass, k, TUY.nhom)); }
  else res = await Promise.all(dv.map(([w, h, pass, k]) => chayMan(w, h, goc, pass, k, TUY.nhom)));
  ketQua = res;
} catch (e) {
  ketQua = { hong: String(e && e.stack || e) };
} finally {
  await donDep();
  await donServer();
}
const tat = ketQua.hong ? [] : ketQua.flatMap((r) => r.ket);
const tp = ketQua.hong ? { vd: [], dem: { diem: 0 } } : phanTich(tat);
let { md, fail, warn } = viet(tp);
if (ketQua.hong || tp.dem.diem === 0) {
  fail += 1;
  md = `# LAYOUT PROBE FAILED: mode "${ID}" — the probe could not measure anything\n\n- **[FAIL] PROBE** | ${ketQua.hong ? ketQua.hong.slice(0, 300) : 'no beat could be measured; first errors: ' + tat.filter((d) => d.loiChay).slice(0, 3).map((d) => d.man + ' ' + d.nhip + ': ' + d.loiChay).join(' | ')} | FIX: check that js/che-do/${ID}.js loads without console errors (node --check) and that dungNhip does not throw.\n` + md.split('\n').slice(1).join('\n');
}
const json = {
  che_do: ID, luc: new Date().toISOString(), giay: +((Date.now() - t0) / 1000).toFixed(0), nguong: TH, nguongMau: NG, choPhep: CHO_PHEP, luot: PASSES,
  ketLuan: { fail, warn, dat: fail === 0, diem: tp.dem.diem, khongDo: tp.dem.khongDo || 0, dongThoiGian: tp.dem.mau || 0 },
  vanDe: tp.vd.map((x) => Object.assign({}, x, { viTri: [...x.viTri] })).sort((a, b) => (a.sev === b.sev ? b.score - a.score : ORD[a.sev] - ORD[b.sev])),
  chayBai: ketQua.hong ? null : ketQua.flatMap((r) => r.daChayBai),
  noiDungStress: PASSES.includes('stress') ? (() => { try { return baiStress().ghi; } catch (e) { return String(e); } })() : null,
  loiTrang: ketQua.hong ? null : ketQua.flatMap((r) => r.loiTrang),
  diem: tat.filter((d) => !d.isMau).map((d) => ({ man: d.man, bai: d.bai, nhip: d.nhip, i: d.i, kind: d.kind, loiChay: d.loiChay || null, lyDo: d.kq && d.kq.lyDo || null, trangThaiCue: d.kq && d.kq.trangThaiCue || null, muon: d.kq && d.kq.muon || null,
    trong: d.trong || null, soChu: d.kq && d.kq.m1 ? d.kq.m1.soChu : null, meo: d.kq && d.kq.m1 ? d.kq.m1.meo : null, an: d.kq && d.kq.m1 ? d.kq.m1.an : null, thieu: d.kq && d.kq.m2 ? d.kq.m2.thieu : null, luoi: d.kq && d.kq.anh ? d.kq.anh.luoi : null })),
  dongThoiGian: tat.filter((d) => d.isMau).map((d) => ({ man: d.man, bai: d.bai, nhip: d.nhip, kind: d.kind, stress: d.stress, loiMau: d.loiMau || null, mau: d.mau })),
};
fs.writeFileSync(TUY.ra, JSON.stringify(json, null, 1));
if (TUY.luuMau) fs.writeFileSync(path.resolve(TUY.luuMau), JSON.stringify(MAU_THO));
const mdFile = TUY.ra.replace(/\.json$/i, '') + '.md';
fs.writeFileSync(mdFile, md);
process.stdout.write(md);
process.exit(fail ? 1 : 0);
