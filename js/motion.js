/* ==========================================================================
   San khau giang (motion design) — DAO DIEN (builder A, motion-spec §1–§3.11)

   Chi chay khi bai giang dang chay (lectureState PLAYING). Tam dung / dung / het
   bai: san khau tat ngay trong khung hinh do, luoi the tro lai tinh, bam duoc.

   - window.SenseiMotion : API §1.3 (app.js goi qua SK()), dangKyCanh cho B / C
   - window.__motion      : chan doan §1.14
   - Moi hen gio la setTimeout gan voi "the he" canh (S.the): doi canh, tam dung,
     dung -> tat ca chet. Khong rAF, khong doi animationend.
   - Moi hieu ung dat trang thai cuoi TRUOC, WAAPI chi trang tri (fill backwards).
   - ?khongSanKhau: bat = false, moi ham la no-op.
   - Bo sung v2 (motion-spec-bo-sung.md): moi nhip MOT the trinh chieu .sk-the o giua; dong dau (ten
     chuong · dem + thanh chia doan) ngay tren the, day phim .sk-phim ngay duoi. Vao nhip = mot chuyen
     dong cua ca the (-32px ra / +32px vao); dong phu hien theo loi noi, xep hang 600 ms; nhan manh /
     doc = MOT con tro doc luot; ghi chu cua Sensei = dong "Sensei ghi" o chan the; cho hoc vien =
     cong (portal) chinh the bai tap cua luoi vao the san khau.
   ========================================================================== */
(function () {
  'use strict';

  const TAT_HAN = /[?&]khongSanKhau\b/i.test(String(location.search || ''));

  const E = {
    out: 'cubic-bezier(.22,1,.36,1)',
    in: 'cubic-bezier(.4,0,1,1)',
    io: 'cubic-bezier(.65,0,.35,1)',
    spring: 'cubic-bezier(.34,1.4,.5,1)',
  };
  // Thoi luong uoc cua moi dang nhip (giay) — chi de dat han chot du phong (§1.6.4)
  const PRIOR = { vocab: 14, kanji: 24, 'grammar-intro': 30, example: 20, 'kaiwa-intro': 20, 'kaiwa-run': 40, kaiwa: 18, quiz: 16 };
  const TEN_CHUONG = { vocab: 'Từ vựng', kanji: 'Chữ Hán', grammar: 'Ngữ pháp', kaiwa: 'Hội thoại', quiz: 'Bài tập' };
  /** Ten chuong theo cap: bai Nhap mon (KANA) goi chuong chu la "Chữ cái" (window.SenseiCapDo) */
  function tenChuong(ch, capDo) {
    const C = window.SenseiCapDo;
    if (ch === 'kanji' && C) {
      let lvl = capDo;
      if (!lvl) { try { lvl = se() && se().currentLevel; } catch (e) { lvl = ''; } }
      return C.tenChuongChu(lvl);
    }
    return TEN_CHUONG[ch] || '';
  }
  // Cum dan (§1.6.1) — da chuan hoa
  const DAN = {
    NGHIA: ['nghia la', 'co nghia', 'dich la', 'y la', 'tuc la'],
    MEO: ['meo', 'de nho', 'cach nho'],
    LUU_Y: ['luu y', 'chu y', 'can than'],
    VAN_HOA: ['van hoa', 'nguoi nhat'],
    GOI_Y: ['goi y'],
  };
  const TOI_DA_HIEU_UNG = 12;
  const LEAD_KARAOKE = 0.04;  // karaoke: moc tu da la luc nghe that -> chi bu 1 khung hinh (khong dung LEAD cua cue)
  const MAX_NHAT_KY = 6000;
  // Bo sung v2: mot the trinh chieu moi nhip, vao = MOT chuyen dong cua ca the
  // Duyet r2: MAT THE (nen + bong) dung yen; moi nhip chi noi dung cua the truot / hien -> khong nhap nhay
  const THE_RA = 180;      // noi dung the cu: -32px + mo, ease-in
  const THE_VAO = 320;     // noi dung the moi: tu +32px + hien, ease-out
  const THE_CHONG = 170;   // noi dung moi bat dau khi noi dung cu da mo < 10% (gan noi tiep: khong in de chu)
  const CUNG_RA = 180;     // cung slide: khoi cau / giai thich cu lui -24px + mo; hang cong thuc dung yen
  const CUNG_VAO = 220;    // cung slide: the moi (co nen) hoa tan tai cho len the cu (nhanh: o doi be rong chi thoang qua)
  const LAT_RA = 160;      // lat the chuong / ket bai: noi dung cu mo di 160 ms ...
  const LAT_VAO = 200;     // ... roi noi dung moi hien 200 ms (noi tiep, khong chong -> khong in de chu)
  const LAT_MS = LAT_RA + LAT_VAO;
  const HIEN_CACH = 600;   // hai lan hien dong phu cach nhau >= 600 ms (xep hang)
  const HIEN_TRE_MAX = 1800;
  const CON_TRO_MS = 260;  // con tro doc luot tu cho nay sang cho khac
  const PHIM_MS = 360;     // day phim truot mot o moi nhip
  const DOAN_MIN_PX = 4;   // thanh tien do chia doan khi moi doan >= 4 px, hep hon thi thanh lien
  const CO_MIN = 0.72;     // vua khung: --sk-co nho nhat (duoi nua moi an .sk-phu-bo)
  const CO_MAX = 1.3;      // nhip thua (hoi thoai, vi du ngan): chu to len toi da 1.3 lan
  const LAP_DAY = 0.62;    // ... cho toi khi noi dung cao ~62% than the
  const VAO_CHEO = 180;    // bat dau / giang tiep: luoi mo di, san khau hien (cheo mo)

  // ------------------------------------------------------------------ trang thai
  const S = {
    bat: !TAT_HAN,
    daInit: false,
    ae: null, se: null, khiTiepTuc: null, khiBoQua: null,
    che: 'tat', epoch: 0, the: 0,
    hen: new Set(),
    giam: false, kho: 'rong', wall: false,
    L: 0, r: 0.15, LEAD: 0.12,
    rV: 0.15,              // giay CO TIENG / don vi (bo khoang lang >= 120 ms) — ngoai suy uoc luong manh chu
    rJ: 0.15, rL: 0.17,    // giay co tieng / don vi: chu Nhat / chu Viet (can chinh moc cum, §1.5.4 ban 3)
    soHoc: 0,              // so luot da hoc L / r trong phien trang (hai luot dau hoc nhanh hon)
    doNhip: [],            // do thoi gian batDauNhip (chan doan T8)
    truoc: null,           // canh dung san cho nhip ke tiep (dung trong khoang nghi, §T8)
    builders: Object.create(null),
    canh: null,            // canh dang song (w)
    soCanh: 0,
    dangRa: new Set(),     // canh dang lui ra (cho go khoi DOM)
    laBatDau: false,
    luotId: 0,
    nhatKy: [], canhLog: [], karaokeLog: [],
    nhanEl: null, nhanLuc: 0,
    theChuong: null, theXong: null,
    cho: null,
    cong: null,            // cong (portal) the bai tap that: { card, cho: comment giu cho, vo }
    traLoi: Object.create(null),
    phim: { khoa: '', muc: [], chuong: null, cur: -1, vd: -1, tx: null },
    henAn: null, nhacLuc: -1e9, henNhac: null,
    dangSinh: false,       // mot luot Sensei da gui ma chua turnComplete (du lieu tam, §1.5.2)
  };
  const dom = {};

  // ------------------------------------------------------------------ tien ich
  const daBao = new Map();
  function canhBao(noi, e) {
    const k = noi + ':' + (e && e.message ? e.message : String(e));
    const n = (daBao.get(k) || 0) + 1;
    daBao.set(k, n);
    if (n <= 2) { try { console.warn('[motion]', noi, e); } catch (x) {} }
  }
  const $id = (id) => (id ? document.getElementById(id) : null);
  const mang = (x) => (x == null ? [] : Array.isArray(x) ? x
    : (typeof NodeList !== 'undefined' && x instanceof NodeList) || (typeof HTMLCollection !== 'undefined' && x instanceof HTMLCollection) ? [...x] : [x]);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const perfGiay = () => performance.now() / 1000;
  const RE_JP = /[぀-ヿ一-鿿々ｦ-ﾟ]/;
  const RE_LATIN = /[a-zA-ZÀ-ɏḀ-ỿ]/;
  // Dau ngat cum (thuong kem mot khoang nghi trong loi noi): dau cau, phay, hai cham, gach dai, xuong dong
  const RE_NGAT = /[、。，．,.！？!?…‥:;：；—–\n]/;
  const laJP = (ch) => !!ch && RE_JP.test(ch);
  const laLatin = (ch) => !!ch && RE_LATIN.test(ch);
  const coJP = (s) => RE_JP.test(String(s || ''));
  const slideContent = () => $id('slideContent');
  const ae = () => S.ae || window.__audioEngine || null;
  const se = () => S.se || window.__slideEngine || null;
  const amCtx = () => { const a = ae(); return a && a.outCtx ? a.outCtx : null; };
  const laTuong = () => { const c = amCtx(); return !(c && c.state === 'running'); };
  function mqGiam() {
    try { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
  }
  function tinhKho() {
    const W = window.innerWidth || 1024, H = window.innerHeight || 768;
    if (W <= 640) return 'hep';
    if (H <= 500) return 'thap';
    return 'rong';
  }

  // ------------------------------------------------------------------ dong ho (§1.5.1)
  function dongHoAm(ctx) {
    const K = window.SenseiKhauHinh;
    if (K && typeof K.bayGio === 'function') {
      try { const t = K.bayGio(ctx); if (typeof t === 'number' && isFinite(t)) return t; } catch (e) {}
    }
    try {
      if (ctx.getOutputTimestamp) {
        const ts = ctx.getOutputTimestamp();
        if (ts && ts.contextTime > 0 && ts.performanceTime > 0) {
          const t = ts.contextTime + (performance.now() - ts.performanceTime) / 1000;
          if (t >= ctx.currentTime - 0.5 && t <= ctx.currentTime + 0.01) return t;
        }
      }
    } catch (e) {}
    return ctx.currentTime - (ctx.outputLatency || 0) - (ctx.baseLatency || 0);
  }
  /** Dong ho dao dien (giay): thoi diem dang NGHE THAY tren AudioContext; khong co thi dong ho tuong */
  function dongHo() {
    if (!S.wall) { const c = amCtx(); if (c) return dongHoAm(c); }
    return perfGiay();
  }

  // ------------------------------------------------------------------ hen gio
  /** setTimeout gan voi the he canh — doi canh / tam dung / dung la chet */
  function henThe(fn, ms) {
    const g = S.the;
    const id = setTimeout(() => {
      S.hen.delete(id);
      if (g !== S.the) return;
      try { fn(); } catch (e) { canhBao('hen', e); }
    }, Math.max(0, ms || 0));
    S.hen.add(id);
    return id;
  }
  function huyHen(id) {
    if (id == null) return;
    if (typeof id === 'object') { id.huy = true; return; }
    clearTimeout(id); S.hen.delete(id);
  }
  /** Chay ngay sau tac vu hien tai (vi tac vu, khong cho mot vong setTimeout) — gan the he, huy duoc */
  function henNgay(fn) {
    const g = S.the, tok = { huy: false };
    const chay = () => { if (tok.huy || g !== S.the) return; try { fn(); } catch (e) { canhBao('hen', e); } };
    if (typeof queueMicrotask === 'function') queueMicrotask(chay); else Promise.resolve().then(chay);
    return tok;
  }
  function huyHetHen() { S.hen.forEach((id) => clearTimeout(id)); S.hen.clear(); }
  /** Hen don dep (go node, an san khau) — khong gan the he */
  function henDon(fn, ms) { return setTimeout(() => { try { fn(); } catch (e) { canhBao('don', e); } }, Math.max(0, ms || 0)); }
  // Cua ban som toi da (s): cue / viec hen gio chi chay som hon moc <= 4 ms (T9: hai lan chay cung hat giong
  // lech nhau chi do tre bo hen gio, khong phai ca cua 20 ms). Hen gio xa thi dat truoc 30 ms roi hen lai sat moc.
  const SOM = 0.004;
  const msHen = (con) => (con > 0.1 ? con * 1000 - 30 : con * 1000);
  /** Chay fn luc dongHo() >= T - lead (gan the he). Da qua thi chay ngay (dong bo). */
  function henLuc(T, fn, lead) {
    const ld = lead == null ? S.LEAD : lead;
    const buoc = () => {
      const con = T - ld - dongHo();
      if (con > SOM) { henThe(buoc, msHen(con)); return; }
      fn();
    };
    const con = T - ld - dongHo();
    if (con <= SOM) { try { fn(); } catch (e) { canhBao('henLuc', e); } return; }
    henThe(buoc, msHen(con));
  }

  // ------------------------------------------------------------------ so dang ky hieu ung
  const HU = { ds: new Set(), cho: [], henCho: null };
  const wc = new WeakMap();
  function donHieuUng() {
    const now = performance.now();
    HU.ds.forEach((a) => {
      if (a.playState === 'finished' || a.playState === 'idle' || (a.__het && now > a.__het + 80)) HU.ds.delete(a);
    });
  }
  function soDangChay() { let n = 0; HU.ds.forEach((a) => { if (!a.__nhom) n++; }); return n; }
  function giuWillChange(el, ms) {
    const n = (wc.get(el) || 0) + 1;
    wc.set(el, n);
    if (n === 1) el.style.willChange = 'transform, opacity';
    setTimeout(() => {
      const m = (wc.get(el) || 1) - 1;
      wc.set(el, m);
      if (m <= 0) el.style.willChange = '';
    }, ms + 60);
  }
  function batDauHieuUng(el, kf, tuy, nhom) {
    let a;
    try { a = el.animate(kf, tuy); } catch (e) { canhBao('animate', e); return null; }
    const lap = tuy.iterations && isFinite(tuy.iterations) ? tuy.iterations : 1;
    const tong = (tuy.delay || 0) + (tuy.duration || 0) * lap;
    a.__het = performance.now() + tong;
    if (nhom) a.__nhom = nhom;
    HU.ds.add(a);
    if (!tuy.pseudoElement && !nhom) giuWillChange(el, tong);
    return a;
  }
  /** el.animate co dang ky + gioi han 12 hieu ung cung luc (qua thi xep hang, cho > 400 ms thi bo) */
  function chay(el, kf, o, nhom) {
    if (!el || typeof el.animate !== 'function') return null;
    const tuy = Object.assign({ fill: 'backwards', easing: E.out, duration: 200 }, o || {});
    donHieuUng();
    if (!nhom && soDangChay() >= TOI_DA_HIEU_UNG) {
      HU.cho.push({ el, kf, o: tuy, luc: performance.now() });
      henHangCho();
      return null;
    }
    return batDauHieuUng(el, kf, tuy, nhom);
  }
  function henHangCho() {
    if (HU.henCho) return;
    const chayCho = () => {
      HU.henCho = null;
      donHieuUng();
      const now = performance.now();
      HU.cho = HU.cho.filter((x) => now - x.luc <= 400 && x.el.isConnected);
      while (HU.cho.length && soDangChay() < TOI_DA_HIEU_UNG) {
        const x = HU.cho.shift();
        batDauHieuUng(x.el, x.kf, x.o);
      }
      if (HU.cho.length) HU.henCho = setTimeout(chayCho, 40);
    };
    HU.henCho = setTimeout(chayCho, 40);
  }
  /** Tam dung: cho moi hieu ung (ca cua B / C trong san khau va luoi) ve trang thai cuoi */
  function xongHetHieuUng() {
    HU.cho.length = 0;
    HU.ds.forEach((a) => { try { a.finish(); } catch (e) { try { a.cancel(); } catch (x) {} } });
    HU.ds.clear();
    try {
      const noi = [dom.san, slideContent()].filter(Boolean);
      if (!noi.length || typeof document.getAnimations !== 'function') return;
      document.getAnimations().forEach((a) => {
        if (typeof CSSAnimation !== 'undefined' && a instanceof CSSAnimation) return;
        if (typeof CSSTransition !== 'undefined' && a instanceof CSSTransition) return;
        const t = a.effect && a.effect.target;
        if (!t || !noi.some((n) => n.contains(t))) return;
        try { a.finish(); } catch (e) { try { a.cancel(); } catch (x) {} }
      });
    } catch (e) {}
  }
  function veLaiBang() {
    try { const B = window.SenseiBoard; if (B && B.ghiChu && B.ghiChu.length && typeof B.veLaiTatCa === 'function') B.veLaiTatCa(); } catch (e) {}
  }

  // ------------------------------------------------------------------ primitive (§1.8)
  function boId(root, caGoc) {
    if (!root || !root.querySelectorAll) return;
    if (caGoc && root.removeAttribute) root.removeAttribute('id');
    root.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
  }
  function hopRect(rs) {
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    rs.forEach((x) => { if (!x || !x.width) return; l = Math.min(l, x.left); t = Math.min(t, x.top); r = Math.max(r, x.right); b = Math.max(b, x.bottom); });
    if (!isFinite(l)) return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 };
    return { left: l, top: t, right: r, bottom: b, width: r - l, height: b - t };
  }
  function chepKieuChu(src, dst) {
    try {
      const cs = getComputedStyle(src);
      dst.style.fontFamily = cs.fontFamily; dst.style.fontSize = cs.fontSize; dst.style.fontWeight = cs.fontWeight;
      dst.style.lineHeight = cs.lineHeight; dst.style.color = cs.color; dst.style.letterSpacing = cs.letterSpacing;
    } catch (e) {}
  }

  /** Khung the cua dao dien (con truc tiep cua .sk-o-the) chua el — canh co the tu dung .sk-the rieng ben trong */
  const theCua = (el) => (el && el.closest ? el.closest('.sk-o-the > .sk-the') : null);
  /** The dang vao (chua dap xong) / dang ra / dang nen dong bo: noi dung trong the xuat hien CUNG the, khong nhay rieng */
  function theDangDong(el) {
    if (HQ.tuc) return true;
    const t = theCua(el);
    if (!t) return false;
    return t.classList.contains('sk-ra') || (t.__den != null && performance.now() < t.__den);
  }
  function lopBayCua(el) { const t = theCua(el); return t ? t.querySelector(':scope > .sk-lop-bay') : null; }

  // ---- hang hien dong phu (bo sung B.2): toi da mot lan hien moi 600 ms, xep hang bang hen gio.
  //      Trang thai cuoi dat ngay (bo .sk-an); dong cho luot chi mang .sk-doi-hien (opacity 0) toi luot minh.
  const HQ = { luc: 0, goi: -1e9, hang: [], nen: false, tuc: false };
  /** Moi dong dang cho luot: hien ngay, khong hieu ung (truoc khi canh roi / lat the / tam dung) */
  function xaHangHien() {
    const ds = HQ.hang.splice(0);
    ds.forEach((it) => { huyHen(it.hen); it.ds.forEach((x) => x.classList.remove('sk-doi-hien')); });
  }
  function datLaiHangHien() { xaHangHien(); HQ.luc = 0; HQ.goi = -1e9; HQ.nen = false; HQ.tuc = false; }
  function phatHien(ds, ms) {
    ds.forEach((x) => x.classList.remove('sk-doi-hien'));
    ds.forEach((x) => chay(x, S.giam ? [{ opacity: 0, offset: 0 }] : [{ opacity: 0, translate: '0 6px', offset: 0 }],
      { duration: S.giam ? 120 : ms, easing: S.giam ? 'linear' : E.out }));
  }

  // ---- con tro doc (bo sung B.3): MOT vet to nhe, tuyet doi trong the, luot (translate + scale) tu cho
  //      dang noi sang cho ke tiep. Thay cho nhip scale / vach rieng tung token / chip nhay khap noi.
  /** Canh tu ve bo cuc the (tu-ve) co con tro rieng: dao dien khong dat them con tro thu hai */
  function conTroCua(the) { return the && !the.classList.contains('tu-ve') ? the.querySelector(':scope > .sk-con-tro') : null; }
  function datConTro(el, o) {
    o = o || {};
    const the = theCua(el);
    const ct = conTroCua(the);
    if (!ct || !el || !el.isConnected) return 0;
    const rt = the.getBoundingClientRect();
    const re = el.getBoundingClientRect();
    if (!re.width || !re.height) return 0;
    const px = o.karaoke ? 3 : 8, py = o.karaoke ? 2 : 4;
    // the co the dang truot luc vao: lech cua the va cua phan tu bu tru nhau (chi translate, khong scale)
    const moi = { x: re.left - rt.left - the.clientLeft - px, y: re.top - rt.top - the.clientTop - py, w: re.width + 2 * px, h: re.height + 2 * py };
    let tu = null;
    if (the.__ct && ct.classList.contains('is-hien')) {
      const rc = ct.getBoundingClientRect();   // vi tri dang thay (ke ca giua mot lan luot)
      if (rc.width && rc.height) tu = { x: rc.left - rt.left - the.clientLeft, y: rc.top - rt.top - the.clientTop, w: rc.width, h: rc.height };
    }
    if (the.__ctAnim) { try { the.__ctAnim.cancel(); } catch (e) {} the.__ctAnim = null; }
    ct.style.left = moi.x.toFixed(1) + 'px';
    ct.style.top = moi.y.toFixed(1) + 'px';
    ct.style.width = moi.w.toFixed(1) + 'px';
    ct.style.height = moi.h.toFixed(1) + 'px';
    ct.classList.add('is-hien');
    the.__ct = moi;
    the.__ctEl = el;
    const v = ct.firstElementChild;
    if (v && !o.ngay) {
      if (v.__a) { try { v.__a.cancel(); } catch (e) {} v.__a = null; }
      v.classList.toggle('is-quet', !!o.quet);
      v.classList.toggle('is-mo', !!o.mo);
      if (o.quet && !S.giam) v.__a = chay(v, [{ translate: '-100% 0', offset: 0 }], { duration: o.quet, easing: 'linear' }, 'contro');
    }
    if (o.ngay || S.giam || theDangDong(el)) return 0;
    if (!tu) { the.__ctAnim = chay(ct, [{ opacity: 0, offset: 0 }], { duration: 160, easing: E.out }, 'contro'); return 160; }
    const dx = tu.x - moi.x, dy = tu.y - moi.y, sx = tu.w / moi.w, sy = tu.h / moi.h;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) return 0;
    const ms = o.ms || CON_TRO_MS;
    the.__ctAnim = chay(ct, [{ translate: `${dx.toFixed(1)}px ${dy.toFixed(1)}px`, scale: `${sx.toFixed(4)} ${sy.toFixed(4)}`, offset: 0 }],
      { duration: ms, easing: E.out }, 'contro');
    return ms;
  }
  function anConTro(the, ngay) {
    const ct = conTroCua(the);
    if (!ct || !ct.classList.contains('is-hien')) return;
    if (the.__ctAnim) { try { the.__ctAnim.cancel(); } catch (e) {} the.__ctAnim = null; }
    ct.classList.remove('is-hien');
    the.__ct = null; the.__ctEl = null;
    if (!ngay && !S.giam) chay(ct, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: E.in }, 'contro');
  }
  /** Sau doi co / vua khung: dat lai con tro dung cho, khong hieu ung */
  function datLaiConTro(the) {
    if (!the || !the.__ctEl) return;
    if (!the.__ctEl.isConnected) { anConTro(the, true); return; }
    datConTro(the.__ctEl, { ngay: true });
  }

  const hu = {
    /** v2 (B.1): canh vao = MOT chuyen dong cua ca the (dao dien lo). O day chi dat trang thai cuoi */
    vao(els) {
      mang(els).filter((e) => e && e.classList).forEach((e) => e.classList.remove('sk-doi-hien'));
      return 0;
    },
    /**
     * Hien dong phu: bo .sk-an, them .is-hien; hien dan + nhich 6px, 240 ms. Xep hang: toi da mot lan
     * hien / 600 ms (nen: 60 ms). Trong luc the dang vao / ra: hien cung the, khong hieu ung rieng.
     */
    hien(el, o) {
      o = o || {};
      const ds = mang(el).filter((x) => x && x.classList);
      if (!ds.length) return 0;
      ds.forEach((x) => { x.classList.remove('sk-an'); x.classList.add('is-hien'); });
      if (theDangDong(ds[0])) { ds.forEach((x) => x.classList.remove('sk-doi-hien')); return 0; }
      const ms = S.giam ? 120 : (o.ms || 240);
      const now = performance.now();
      let slot = now - HQ.goi < 30 ? Math.max(HQ.luc, now + (o.tre || 0))          // cung mot cue: chung luot
        : Math.max(now + (o.tre || 0), HQ.luc + (HQ.nen ? 60 : HIEN_CACH));
      slot = Math.min(slot, now + HIEN_TRE_MAX);
      HQ.luc = Math.max(HQ.luc, slot);
      HQ.goi = now;
      const cho = slot - now;
      if (cho <= 16) { phatHien(ds, ms); return ms; }
      ds.forEach((x) => x.classList.add('sk-doi-hien'));
      const it = { ds, hen: null };
      it.hen = henThe(() => {
        const k = HQ.hang.indexOf(it);
        if (k < 0) return;
        HQ.hang.splice(k, 1);
        phatHien(ds, ms);
      }, cho);
      HQ.hang.push(it);
      return Math.round(cho) + ms;
    },
    /** Nhan manh = con tro doc luot toi el (khong nhip scale). el mang .sk-nhan cho CSS rieng cua canh */
    nhan(el) {
      if (!el || !el.classList) return 0;
      const cu = S.nhanEl;
      if (cu && cu !== el && cu.classList) cu.classList.remove('sk-nhan');
      el.classList.add('sk-nhan');
      S.nhanEl = el;
      S.nhanLuc = dongHo();
      return datConTro(el, {}) || CON_TRO_MS;
    },
    /** Doc luot: con tro dung tren el, vach 3px trong con tro keo tu trai sang trong ms (350–3500); mo = lan 2 */
    quet(el, ms, o) {
      o = o || {};
      if (!el || !el.classList) return 0;
      ms = clamp(Number(ms) || 800, 350, 3500);
      datConTro(el, { quet: ms, mo: !!o.mo });
      return ms;
    },
    /**
     * Karaoke: luc times[k] (giay, dong ho dao dien = dongHo(); o.tuongDoi: ms tinh tu bay gio) con tro
     * luot sang token k (.is-doc). times.ket (neu co) = luc het cau.
     */
    karaoke(toks, times, o) {
      o = o || {};
      toks = mang(toks).filter(Boolean);
      if (!toks.length || !times || !times.length) return 0;
      const now = dongHo();
      const T = toks.map((_, k) => {
        const t = Number(times[Math.min(k, times.length - 1)]) || 0;
        return o.tuongDoi ? now + t / 1000 : t;
      });
      const ket = times.ket != null ? (o.tuongDoi ? now + times.ket / 1000 : Number(times.ket)) : null;
      const buoc = T.slice(1).map((t, k) => t - T[k]).filter((x) => x > 0);
      const tb = buoc.length ? buoc.reduce((a, b) => a + b, 0) / buoc.length : 0.3;
      const khoang = (k) => (k + 1 < T.length ? Math.max(0.06, T[k + 1] - T[k])
        : clamp(ket != null && ket > T[k] ? ket - T[k] : (o.cuoi != null ? o.cuoi : tb), 0.12, 1.5));
      const nhan = o.nhan || '';
      toks.forEach((t) => t.classList.remove('is-doc', 'sk-doc-cho'));
      toks.forEach((t, k) => henLuc(T[k], () => {
        t.classList.add('is-doc');
        if (S.karaokeLog.length < MAX_NHAT_KY) S.karaokeLog.push({ nhan, k, T: T[k], firedCtx: dongHo(), firedPerf: performance.now() });
        datConTro(t, { ms: Math.round(clamp(khoang(k) * 700, 90, CON_TRO_MS)), mo: !!o.mo, karaoke: true });
      }, o.lead != null ? o.lead : LEAD_KARAOKE));
      return Math.max(0, (T[T.length - 1] + khoang(T.length - 1) - now) * 1000);
    },
    /**
     * Chip nho tren / duoi anchor, dinh tuyet doi trong offsetParent. Chi hien dan (khong scale) —
     * rieng chip "đọc: …" dau tien cua canh (tro tu trong vi du) duoc bat len mot lan (scale .9 -> 1).
     */
    chip(anchor, text, o) {
      o = o || {};
      if (!anchor || text == null || text === '') return 0;
      const par = anchor.offsetParent;
      if (!par) return 0;
      const ra = anchor.getBoundingClientRect(), rp = par.getBoundingClientRect();
      const sx = par.offsetWidth ? rp.width / par.offsetWidth : 1;
      const sy = par.offsetHeight ? rp.height / par.offsetHeight : 1;
      const duoi = o.ben === 'duoi';
      const x = (ra.left + ra.width / 2 - rp.left) / (sx || 1) - par.clientLeft + par.scrollLeft;
      const y = ((duoi ? ra.bottom : ra.top) - rp.top) / (sy || 1) - par.clientTop + par.scrollTop;
      const c = document.createElement('span');
      c.className = 'sk-chip ' + (duoi ? 'sk-chip-duoi' : 'sk-chip-tren') + (o.lop ? ' ' + o.lop : '');
      c.textContent = String(text);
      c.style.left = x.toFixed(1) + 'px';
      c.style.top = y.toFixed(1) + 'px';
      par.appendChild(c);
      if (S.giam || theDangDong(anchor)) return 0;
      if (/^đọc\b/i.test(String(text).trim()) && !S.chipDoc) {
        S.chipDoc = true;
        chay(c, [{ opacity: 0, scale: '0.9', offset: 0 }], { duration: 260, easing: E.spring });
        return 260;
      }
      chay(c, [{ opacity: 0, offset: 0 }], { duration: 220, easing: E.out });
      return 220;
    },
    /**
     * FLIP bay: do het truoc, roi ghi. srcEls[i] (phan tu hoac mang phan tu) bay vao dichEls[i].
     * Dich hien khi ban sao toi noi; ban sao (khong id) nam trong lop bay cua the, go bang hen gio.
     */
    bay(srcEls, dichEls, o) {
      o = o || {};
      const srcs = mang(srcEls), dichs = mang(dichEls);
      const n = Math.min(srcs.length, dichs.length);
      if (!n) return 0;
      const buoc = o.buoc != null ? o.buoc : 90;
      const hienNgay = () => {
        dichs.slice(0, n).forEach((d) => { if (!d) return; d.classList.remove('sk-an'); d.classList.add('is-hien', 'sk-to-tinh'); });
        return 0;
      };
      const d0 = dichs.find(Boolean);
      const lop = lopBayCua(d0);
      if (S.giam || !lop || theDangDong(d0)) return hienNgay();
      const rl = lop.getBoundingClientRect();
      const doi = [];
      for (let i = 0; i < n; i++) {
        const g = mang(srcs[i]).filter(Boolean), d = dichs[i];
        if (!g.length || !d) { doi.push(null); continue; }
        const rs = g.map((e) => e.getBoundingClientRect());
        doi.push({ g, d, rs, rd: d.getBoundingClientRect(), ru: hopRect(rs) });
      }
      let tong = 0;
      doi.forEach((x, i) => {
        if (!x) return;
        const tre = i * buoc;
        x.d.classList.remove('sk-an');
        x.d.classList.add('is-hien');
        chay(x.d, [{ opacity: 0, offset: 0 }], { duration: 140, delay: tre + 360, easing: 'linear' });
        tong = Math.max(tong, tre + 500);
        if (!x.ru.width || !x.ru.height || !x.rd.width || !x.rd.height) return;
        const w = document.createElement('div');
        w.className = 'sk-bay';
        w.setAttribute('aria-hidden', 'true');
        w.style.left = (x.ru.left - rl.left) + 'px';
        w.style.top = (x.ru.top - rl.top) + 'px';
        w.style.width = x.ru.width + 'px';
        w.style.height = x.ru.height + 'px';
        x.g.forEach((e, k) => {
          const cl = e.cloneNode(true);
          boId(cl, true);
          if (cl.classList) cl.classList.remove('sk-an', 'sk-mo', 'sk-doc-cho', 'sk-doi-hien');
          chepKieuChu(e, cl);
          cl.style.position = 'absolute';
          cl.style.margin = '0';
          cl.style.left = (x.rs[k].left - x.ru.left) + 'px';
          cl.style.top = (x.rs[k].top - x.ru.top) + 'px';
          cl.style.width = x.rs[k].width + 'px';
          cl.style.height = x.rs[k].height + 'px';
          cl.style.whiteSpace = 'nowrap';
          cl.style.opacity = '1';
          w.appendChild(cl);
        });
        const s = clamp(x.rd.height / x.ru.height, 0.3, 3);
        const tx = (x.rd.left + x.rd.width / 2) - (x.ru.left + x.ru.width / 2);
        const ty = (x.rd.top + x.rd.height / 2) - (x.ru.top + x.ru.height / 2);
        // trang thai cuoi truoc: ban sao nam o dich; hieu ung dua no tu nguon toi
        w.style.translate = `${tx.toFixed(1)}px ${ty.toFixed(1)}px`;
        w.style.scale = s.toFixed(3);
        lop.appendChild(w);
        chay(w, [{ translate: '0px 0px', scale: '1', offset: 0 }], { duration: 420, delay: tre, easing: E.out });
        henDon(() => w.remove(), tre + 460);
      });
      henDon(veLaiBang, tong + 30);
      return Math.max(0, (n - 1) * buoc + 420);
    },
    /** Doi duoi: cu truot len -40% + mo (160 ms), moi tu 40% vao (220 ms); goc tu dung yen */
    doi(cu, moi) {
      if (S.giam || theDangDong(cu || moi)) {
        if (cu) { cu.classList.add('sk-an'); cu.classList.remove('is-hien'); }
        if (moi) { moi.classList.remove('sk-an'); moi.classList.add('is-hien'); if (S.giam) moi.classList.add('sk-mau-nhan'); }
        return 0;
      }
      if (cu) {
        cu.classList.add('sk-an');
        cu.classList.remove('is-hien');
        chay(cu, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 -40%' }], { duration: 160, easing: E.in });
      }
      if (moi) {
        moi.classList.remove('sk-an');
        moi.classList.add('is-hien');
        chay(moi, [{ opacity: 0, translate: '0 40%', offset: 0 }], { duration: 220, delay: 160, easing: E.out });
      }
      return 380;
    },
    /** Lam mo (.45) / tra lai (1), 200 ms. Giam chuyen dong: khong lam mo */
    mo(els, on) {
      if (S.giam) return 0;
      mang(els).filter(Boolean).forEach((e) => {
        if (e.classList.contains('sk-mo') === !!on) return;
        e.classList.toggle('sk-mo', !!on);
        if (!theDangDong(e)) chay(e, [{ opacity: on ? 1 : 0.45, offset: 0 }], { duration: 200, easing: E.out });
      });
      return 200;
    },
    /** Truot noi dung: ra -12px + mo 180 ms; vao tu +12px 240 ms, chong 60 ms */
    truot(ra, vao) {
      // Da lui (sk-ra) thi khong hien lai de truot ra
      if (ra && !ra.classList.contains('sk-ra')) {
        ra.classList.add('sk-ra');
        chay(ra, S.giam ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '-12px 0' }],
          { duration: S.giam ? 120 : 180, easing: E.in });
      }
      if (vao) {
        vao.classList.remove('sk-ra');
        if (!theDangDong(vao)) {
          chay(vao, S.giam ? [{ opacity: 0, offset: 0 }] : [{ opacity: 0, translate: '12px 0', offset: 0 }],
            { duration: S.giam ? 120 : 240, delay: S.giam ? 0 : 120, easing: E.out });
        }
      }
      henDon(veLaiBang, 400);
      return S.giam ? 120 : 360;
    },
    /** Mang (FLIP): tu fromRect ve cho hien tai, translate + scale deu. 520 ms io (o.ms) */
    mang(el, tu, o) {
      o = o || {};
      if (!el || !tu || !tu.width || !tu.height || theDangDong(el)) return 0;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return 0;
      if (S.giam) { chay(el, [{ opacity: 0, offset: 0 }], { duration: 120, easing: 'linear' }); return 120; }
      const ms = o.ms || 520;
      const s = clamp((tu.width / r.width + tu.height / r.height) / 2, 0.2, 5);
      const dx = (tu.left + tu.width / 2) - (r.left + r.width / 2);
      const dy = (tu.top + tu.height / 2) - (r.top + r.height / 2);
      chay(el, [{ translate: `${dx.toFixed(1)}px ${dy.toFixed(1)}px`, scale: s.toFixed(3), offset: 0 }], { duration: ms, easing: E.io });
      henDon(veLaiBang, ms + 30);
      return ms;
    },
    /** Lui ra: mo (va rot 8px), 200 ms */
    ra(el, o) {
      o = o || {};
      if (!el || !el.classList) return 0;
      if (el.classList.contains('sk-ra')) return 0;   // da an: khong nhay lai opacity 1 roi mo
      el.classList.add('sk-ra');
      const roi = !S.giam && (o.kieu === 'len' || o.roi);
      chay(el, roi ? [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 8px' }] : [{ opacity: 1 }, { opacity: 0 }],
        { duration: S.giam ? 120 : 200, easing: E.in });
      return S.giam ? 120 : 200;
    },
    /** Hinh minh hoa ve dan: <= 12 net -> stroke-dashoffset 1 -> 0 + fill-opacity; nhieu hon -> hien dan */
    ve(svg, ms) {
      if (!svg || !svg.querySelectorAll) return 0;
      ms = Number(ms) || 600;
      svg.classList.add('sk-ve');
      if (S.giam || theDangDong(svg)) return 0;
      const hinh = [...svg.querySelectorAll('path, line, polyline, circle')];
      if (!hinh.length || hinh.length > 12) {
        chay(svg, [{ opacity: 0, offset: 0 }], { duration: Math.min(ms, 300), easing: E.out });
        return Math.min(ms, 300);
      }
      const tra = [];
      hinh.forEach((h) => {
        let net = true;
        try { const cs = getComputedStyle(h); net = cs.strokeDasharray === 'none' && cs.stroke !== 'none'; } catch (e) {}
        const kf = [{ fillOpacity: 0, offset: 0 }, { fillOpacity: 0, offset: 0.45 }];
        if (net && !h.hasAttribute('pathLength')) {
          h.setAttribute('pathLength', '1');
          h.style.strokeDasharray = '1';
          h.style.strokeDashoffset = '0';
          kf[0].strokeDashoffset = '1';
          tra.push(h);
        }
        chay(h, kf, { duration: ms, easing: E.out }, 've');
      });
      henDon(() => tra.forEach((h) => { h.removeAttribute('pathLength'); h.style.strokeDasharray = ''; h.style.strokeDashoffset = ''; }), ms + 60);
      return ms;
    },
    /** Hich nhe (kieu nudge co san), 2 lan x 300 ms */
    nhay(el) {
      if (!el || S.giam) return 0;
      chay(el, [{ translate: '0 0' }, { translate: '3px 0' }, { translate: '0 0' }], { duration: 300, iterations: 2, easing: E.out });
      return 600;
    },
  };

  // ------------------------------------------------------------------ chuan hoa + don vi (§1.5.3, §1.6.1)
  function jpChu(d) {
    let cp = d.codePointAt(0);
    if (cp >= 0x30a1 && cp <= 0x30f6) cp -= 0x60;
    let x = String.fromCodePoint(cp);
    if (x === 'ぢ') x = 'じ'; else if (x === 'づ') x = 'ず';
    return /[぀-ゟ一-鿿々ー]/.test(x) ? x : '';
  }
  function chuanJP(s) { let o = ''; for (const d of String(s || '').normalize('NFKC')) o += jpChu(d); return o; }
  function chuanVN(s) {
    return String(s || '').normalize('NFKC').toLowerCase().normalize('NFD')
      .replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim();
  }
  /** 3 am tiet dau cua cau Viet, chi nhan khi >= 8 ky tu va >= 2 tu */
  function vn3(text) {
    const tu = chuanVN(text).split(' ').filter(Boolean).slice(0, 3);
    return tu.length >= 2 && tu.join('').length >= 8 ? [tu.join(' ')] : [];
  }
  const KANA_NHO = /[ぁぃぅぇぉゃゅょゎゕゖァィゥェォャュョヮヵヶㇰ-ㇿ]/;
  function trongSo(ch, truoc) {
    const n = ch.normalize('NFKC');
    const d = n.charAt(0);
    if (!d) return 0;
    const cp = d.codePointAt(0);
    if (KANA_NHO.test(d)) return 0;
    if (d === 'ー' || d === 'っ' || d === 'ッ') return 1;
    if ((cp >= 0x3041 && cp <= 0x3096) || (cp >= 0x30a1 && cp <= 0x30fa)) return 1;
    if ((cp >= 0x4e00 && cp <= 0x9fff) || d === '々') return 1.7;
    if (RE_LATIN.test(d)) return laLatin(truoc) ? 0 : 1.3;
    if (d >= '0' && d <= '9') return 1;
    return 0;
  }
  function donVi(text) {
    let u = 0, truoc = '';
    for (const ch of String(text || '')) { u += trongSo(ch, truoc); truoc = ch; }
    return u;
  }

  // ------------------------------------------------------------------ san khau DOM (§1.7 + bo sung v2 A)
  //  <section #sanKhauGiang>
  //    .sk-khung (cot giua, rong min(1080px, 100% - 48px))
  //      header.sk-dau   : ten chuong · dem | trang thai | thanh tien do chia doan (phai)
  //      .sk-o-the       : o dat the; moi nhip mot .sk-the (the cu truot ra, the moi truot vao)
  //      .sk-phim        : day phim cac muc cua chuong, muc hien tai to + vien accent
  function taoSan() {
    if (dom.san && dom.san.isConnected) return true;
    const canvas = document.querySelector('main.deck-stage > .deck-canvas') || document.querySelector('.deck-canvas');
    if (!canvas || !canvas.parentElement) return false;
    const s = document.createElement('section');
    s.id = 'sanKhauGiang';
    s.className = 'deck-canvas san-khau-giang';
    s.setAttribute('role', 'region');
    s.setAttribute('aria-label', 'Bài giảng đang chạy');
    s.hidden = true;
    s.dataset.che = 'tat';
    s.innerHTML = `
      <div class="sk-khung">
        <header class="sk-dau">
          <span class="sk-nhan-nhip"></span>
          <span class="sk-trang-thai" aria-live="polite"></span>
          <span class="sk-nhac" aria-hidden="true"></span>
          <span class="sk-tien-do" aria-hidden="true"></span>
        </header>
        <div class="sk-o-the"><div class="sk-mat" aria-hidden="true"></div></div>
        <div class="sk-phim" aria-hidden="true"><div class="sk-phim-ray"></div></div>
      </div>
      <p class="sk-sr" aria-live="polite"></p>`;
    canvas.after(s);
    dom.san = s;
    dom.khung = s.querySelector('.sk-khung');
    dom.dau = s.querySelector('.sk-dau');
    dom.nhan = s.querySelector('.sk-nhan-nhip');
    dom.tt = s.querySelector('.sk-trang-thai');
    dom.nhac = s.querySelector('.sk-nhac');
    dom.tienDo = s.querySelector('.sk-tien-do');
    dom.oThe = s.querySelector('.sk-o-the');
    dom.mat = s.querySelector('.sk-mat');
    dom.phim = s.querySelector('.sk-phim');
    dom.phimRay = s.querySelector('.sk-phim-ray');
    dom.sr = s.querySelector('.sk-sr');
    s.addEventListener('pointerdown', () => { if (S.che === 'giang' || S.che === 'chuyen') nhacKhoa(); });
    if (window.ResizeObserver) {
      let hr = null;
      new ResizeObserver(() => {
        clearTimeout(hr);
        hr = setTimeout(() => {
          try {
            S.kho = tinhKho();
            if (dom.san) dom.san.dataset.kho = S.kho;
            if (S.canh && S.che !== 'tat') { vuaKhung(S.canh); datLaiConTro(S.canh.the); }
            if (S.che !== 'tat') datPhim(false);
          } catch (e) { canhBao('resize', e); }
        }, 150);
      }).observe(dom.oThe);
    }
    return true;
  }
  /** Mot the trinh chieu cho mot nhip: than (canh), chan (Sensei ghi / luot ban + nut), con tro doc, lop bay */
  function taoThe(kind) {
    const t = document.createElement('div');
    t.className = 'sk-the';
    t.dataset.kind = kind || '';
    t.innerHTML = `<div class="sk-the-than sk-san"></div>
      <div class="sk-the-chan"><div class="sk-chan-chu"></div><span class="sk-nut"></span></div>
      <i class="sk-con-tro" aria-hidden="true"><i class="sk-con-tro-vach"></i></i>
      <div class="sk-lop-bay" aria-hidden="true"></div>`;
    return t;
  }
  /**
   * Canh tu ve mat the: dau hieu data-sk-the do builder dat (B: data-sk-the="chu"). KHONG doc kieu tinh
   * (getComputedStyle ngay sau khi gan the = tinh lai kieu ca trang ~15 ms trong batDauNhip, T8). Chi kiem
   * tep CSS cua builder da nap (khong co CSS thi the cua canh khong co mat -> khung dao dien la the that).
   */
  const cssDaNap = Object.create(null);
  function coCss(ten) {
    if (cssDaNap[ten]) return true;
    try {
      const l = document.querySelector(`link[rel="stylesheet"][href*="${ten}"]`);
      if (!l) return false;
      const ok = !!(l.sheet && l.sheet.cssRules && l.sheet.cssRules.length);
      if (ok) cssDaNap[ten] = true;
      return ok;
    } catch (e) { return true; }
  }
  function coMatThe(cel) {
    const goc = cel.matches && cel.matches('[data-sk-the]') ? cel : cel.querySelector('[data-sk-the]');
    if (!goc) return false;
    const k = goc.getAttribute('data-sk-the');
    return k === 'chu' ? coCss('motion-chu.css') : k === 'hoi' ? coCss('motion-hoi.css') : true;
  }
  function ganThe(w, t) {
    w.the = t;
    w.than = t.querySelector('.sk-the-than');
    w.chan = t.querySelector('.sk-the-chan');
    w.chanChu = t.querySelector('.sk-chan-chu');
    w.nut = t.querySelector('.sk-nut');
  }

  function nhacKhoa() {
    const now = performance.now();
    if (now - S.nhacLuc < 30000 || !dom.nhac) return;
    S.nhacLuc = now;
    dom.nhac.textContent = 'Đang giảng — bấm Tạm dừng để thao tác';
    dom.dau.classList.add('co-nhac');
    clearTimeout(S.henNhac);
    S.henNhac = setTimeout(() => { if (dom.dau) dom.dau.classList.remove('co-nhac'); }, 2500);
  }

  /** Trang thai tren dong dau (chi "Sensei đang chuẩn bị…" — cham cho duy nhat duoc lap) */
  function datTrangThai(text, kieu) {
    const el = dom.tt;
    if (!el) return;
    el.className = 'sk-trang-thai' + (kieu ? ' is-' + kieu : '');
    el.dataset.kieu = kieu || '';
    const chu = text ? `<span class="sk-tt-chu">${esc(text)}</span>` : '';
    el.innerHTML = kieu === 'chuan-bi' ? chu + '<span class="sk-ba-cham" aria-hidden="true"><i></i><i></i><i></i></span>' : chu;
    el.title = text || '';
  }
  /**
   * Dong chan the: "Sensei ghi · …" (write_on_board, thay ghi chu truoc) hoac trang thai luot hoc vien
   * (luot-ban / goi-y / dung / sai). Chieu cao chan giu co dinh -> khong day bo cuc the.
   */
  function datChan(w, text, kieu, dayDu) {
    if (!w || !w.chanChu) return;
    const el = w.chanChu;
    w.chan.className = 'sk-the-chan' + (text ? ' co-noi' : '') + (kieu ? ' is-' + kieu : '');
    w.chan.dataset.kieu = kieu || '';
    let h = '';
    if (text && kieu === 'ghi') {
      h = `<span class="sk-ghi-nhan">Sensei ghi</span><span class="sk-ghi-chu"${coJP(text) ? ' lang="ja"' : ''}>${esc(text)}</span>`;
    } else if (text) {
      h = (kieu === 'luot-ban' ? '<i class="sk-cham-ban" aria-hidden="true"></i>' : '') + `<span class="sk-chan-tt">${esc(text)}</span>`;
    }
    el.innerHTML = h;
    el.title = dayDu || text || '';
  }
  /** write_on_board luc cho hoc vien: noi vao dong trang thai o chan the (1 dong, cat ...) */
  function themChanPhu(text) {
    const w = S.canh;
    if (!w || !w.chanChu || !text) return;
    let p = w.chanChu.querySelector('.sk-chan-phu');
    if (!p) { p = document.createElement('span'); p.className = 'sk-chan-phu'; w.chanChu.appendChild(p); }
    p.textContent = ' · ' + String(text);
    if (coJP(text)) p.lang = 'ja'; else p.removeAttribute('lang');
    w.chanChu.title = w.chanChu.textContent.trim();
  }
  function datNut(w, ds) {
    if (!w || !w.nut) return;
    w.nut.innerHTML = '';
    (ds || []).forEach((d) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sk-btn ' + (d.lop || '');
      b.textContent = d.nhan;
      if (d.title) b.title = d.title;
      b.addEventListener('click', (e) => { e.stopPropagation(); try { d.bam && d.bam(); } catch (x) { canhBao('nut', x); } });
      w.nut.appendChild(b);
    });
  }

  // ---- tien trinh (§3.11 + bo sung A.2 / A.3): nhan dong dau, thanh chia doan, day phim
  const cacNhipChuong = (ctx, ch) => ((ctx && ctx.cacNhip) || []).filter((b) => b && b.chapter === ch);
  const cungNhip = (a, b) => a === b || (a && b && a.index != null && a.index === b.index);
  function trangThaiThe(exId) {
    const card = $id('card-' + exId);
    if (card) {
      if (card.querySelector('.qz-opt.is-wrong')) return false;
      if (card.querySelector('.qz-opt.is-correct')) return true;
    }
    return exId in S.traLoi ? !!S.traLoi[exId] : null;
  }
  /** "N1 [chủ đề] + は + N2 + です" -> "N1 は N2 です" (bo chu thich vai tro va dau +) */
  function tenMau(d) {
    d = d || {};
    const fm = String(d.grammarFormula || '').split(/\s{2,}|　|\(|（| \/ |—|→| vs |=|;/)[0]
      .replace(/\[[^\]]*\]/g, ' ').replace(/\s*\+\s*/g, ' ').replace(/\s+/g, ' ').trim();
    return fm || String(d.title || '').trim();
  }
  function tenNganMau(d) {
    const s = tenMau(d);
    const a = Array.from(s);
    return a.length <= 11 ? s : a.slice(0, 10).join('').trim() + '…';
  }
  function chuDau(sp) {
    const s = String(sp || '').trim();
    const m = s.match(/[぀-ヿ一-鿿々]/);
    if (m) return m[0];
    const l = s.match(/[A-Za-zÀ-ỹ]/);
    return l ? l[0].toUpperCase() : '·';
  }
  /** Chu tren o phim: ngan (<= 8 ky tu) — khong nhac lai nguyen chu lon dang tren the */
  const ngan = (s, n) => { const a = Array.from(String(s || '')); return a.length <= n ? a.join('') : a.slice(0, n - 1).join('') + '…'; };
  function mucChuong(ch, ds) {
    const loc = (k) => ds.filter((b) => b.kind === k);
    if (ch === 'vocab') return loc('vocab').map((b) => ({ chu: ngan((b.data && (b.data.kanji || b.data.word)) || '', 8), jp: true, nhip: b }));
    if (ch === 'kanji') return loc('kanji').map((b) => ({ chu: String((b.data && b.data.character) || ''), jp: true, nhip: b }));
    if (ch === 'grammar') {
      return loc('grammar-intro').map((b, i) => {
        const ten = tenNganMau(b.data);
        return { so: i + 1, chu: ten, jp: coJP(ten), sub: b.subIndex, soVd: ds.filter((x) => x.kind === 'example' && x.subIndex === b.subIndex).length, nhip: b };
      });
    }
    if (ch === 'kaiwa') return loc('kaiwa').map((b) => { const c = chuDau(b.data && b.data.speaker); return { chu: c, jp: coJP(c), id: b.data && b.data.id, nhip: b }; });
    if (ch === 'quiz') return loc('quiz').map((b, i) => ({ so: i + 1, exId: b.data && b.data.id, nhip: b }));
    return [];
  }
  function viTriMuc(beat, ds, muc) {
    if (!beat) return -1;
    const k = beat.kind;
    if (k === 'vocab' || k === 'kanji' || k === 'quiz' || k === 'kaiwa') return ds.filter((b) => b.kind === k).findIndex((b) => cungNhip(b, beat));
    if (k === 'grammar-intro' || k === 'example') return muc.findIndex((m) => m.sub === beat.subIndex);
    return -1;
  }
  function viTriVd(beat, ds) {
    if (!beat || beat.kind !== 'example') return -1;
    return ds.filter((b) => b.kind === 'example' && b.subIndex === beat.subIndex).findIndex((b) => cungNhip(b, beat));
  }
  /** "Từ vựng · 3/30", "Ngữ pháp · 2/6 · ví dụ 1/3", "Hội thoại · câu 4/10" */
  function nhanDau(beat, ctx) {
    const ten = (ctx && ctx.chuong && ctx.chuong.ten) || tenChuong(beat.chapter, ctx && ctx.capDo) || '';
    const ds = cacNhipChuong(ctx, beat.chapter);
    if (!ds.length) return beat.label || ten;
    const vt = (k) => { const a = ds.filter((b) => b.kind === k); return [a.findIndex((b) => cungNhip(b, beat)) + 1, a.length]; };
    let dem = '';
    const k = beat.kind;
    if (k === 'vocab' || k === 'kanji' || k === 'quiz' || k === 'grammar-intro') { const [i, n] = vt(k); if (i > 0) dem = `${i}/${n}`; }
    else if (k === 'example') {
      const gi = ds.filter((b) => b.kind === 'grammar-intro');
      const si = gi.findIndex((b) => b.subIndex === beat.subIndex);
      const vd = ds.filter((b) => b.kind === 'example' && b.subIndex === beat.subIndex);
      const e = vd.findIndex((b) => cungNhip(b, beat));
      dem = (si >= 0 ? `${si + 1}/${gi.length}` : '') + (e >= 0 ? `${si >= 0 ? ' · ' : ''}ví dụ ${e + 1}/${vd.length}` : '');
    } else if (k === 'kaiwa-intro') dem = 'bối cảnh & nhân vật';
    else if (k === 'kaiwa-run') dem = 'nghe trọn đoạn';
    else if (k === 'kaiwa') { const [i, n] = vt('kaiwa'); if (i > 0) dem = `câu ${i}/${n}`; }
    return dem ? `${ten} · ${dem}` : (ten || beat.label || '');
  }
  /** O phim: dau xong / dung / sai nam TRONG o, ngay sau nhan (khong de len vien accent cua o hien tai) */
  function veMucPhim(m, k) {
    const dau = '<i class="sk-phim-dau" aria-hidden="true"></i>';
    let h = '';
    if (m.exId !== undefined) h = `<span class="sk-phim-dong"><span class="sk-phim-so">${m.so}</span>${dau}</span>`;
    else if (m.sub !== undefined) {
      h = `<span class="sk-phim-dong is-mau"><span class="sk-phim-so">${m.so}</span><span class="sk-phim-chu"${m.jp ? ' lang="ja"' : ''}>${esc(m.chu)}</span>${dau}</span>`
        + (m.soVd ? `<span class="sk-phim-vd">${'<i></i>'.repeat(Math.min(m.soVd, 12))}</span>` : '');
    } else h = `<span class="sk-phim-dong"><span class="sk-phim-chu"${m.jp ? ' lang="ja"' : ''}>${esc(m.chu)}</span>${dau}</span>`;
    return `<span class="sk-phim-o${m.exId !== undefined ? ' is-so' : ''}" data-k="${k}">${h}</span>`;
  }
  /** Nap muc cua mot chuong vao day phim + thanh chia doan. Doi chuong: day cu mo, day moi hien (240 ms) */
  function napChuong(ch, ds, hieuUng) {
    const P = S.phim;
    const khoa = ch + '|' + ds.length + '|' + (ds[0] && ds[0].index != null ? ds[0].index : '');
    if (P.khoa === khoa) return false;
    P.khoa = khoa;
    P.chuong = ch;
    P.muc = mucChuong(ch, ds);
    P.cur = -1; P.vd = -1; P.tx = null;
    if (dom.phimRay) {
      dom.phimRay.innerHTML = P.muc.map(veMucPhim).join('');
      dom.phimRay.dataset.chuong = ch || '';
      if (hieuUng && !S.giam) chay(dom.phimRay, [{ opacity: 0, offset: 0 }], { duration: LAT_VAO, easing: E.out });
    }
    if (dom.phim) dom.phim.hidden = !P.muc.length;
    if (dom.tienDo) { dom.tienDo.innerHTML = ''; dom.tienDo.dataset.n = ''; }
    return true;
  }
  /**
   * Thanh tien do chia doan (dong dau, phai, <= 240px): xong / hien tai / chua; chuong Bai tap: dung / sai.
   * Chon theo BE RONG (khong theo so muc): moi doan hep hon 4 px (dien thoai 96 px, 20-30 muc) -> thanh lien.
   */
  function veDoan() {
    const el = dom.tienDo, P = S.phim;
    if (!el) return;
    const n = P.muc.length;
    if (!n) { el.innerHTML = ''; el.hidden = true; return; }
    el.hidden = false;
    const xong = P.cur >= n ? n : Math.max(0, P.cur);
    const rong = S.tdRong || (S.kho === 'hep' ? 96 : 240);
    if ((rong - 2 * (n - 1)) / n < DOAN_MIN_PX) {
      if (!el.querySelector('.sk-td-lien')) { el.innerHTML = '<i class="sk-td-lien"></i>'; el.classList.add('is-lien'); }
      el.firstElementChild.style.scale = `${((xong + (P.cur >= 0 && P.cur < n ? 0.5 : 0)) / n).toFixed(4)} 1`;
      return;
    }
    el.classList.remove('is-lien');
    if (el.dataset.n !== String(n) || el.childElementCount !== n) { el.dataset.n = String(n); el.innerHTML = '<i></i>'.repeat(n); }
    [...el.children].forEach((d, k) => {
      const m = P.muc[k];
      const kq = m && m.exId !== undefined ? trangThaiThe(m.exId) : null;
      d.className = (k < xong ? 'is-xong' : '') + (k === P.cur ? ' is-nay' : '') + (kq === true ? ' is-dung' : kq === false ? ' is-sai' : '');
    });
  }
  /** Day phim: lop trang thai tung o + truot de o hien tai dung o moc 30% chieu ngang (360 ms, tre: cho the moi) */
  function datPhim(hieuUng, tre) {
    const P = S.phim, ray = dom.phimRay;
    if (!ray || !dom.phim || !P.muc.length) return;
    const n = P.muc.length;
    const cur = P.cur;
    [...ray.children].forEach((o, k) => {
      const m = P.muc[k];
      const kq = m && m.exId !== undefined ? trangThaiThe(m.exId) : null;
      const xong = cur >= n || (cur >= 0 && k < cur);
      o.classList.toggle('is-xong', xong);
      o.classList.toggle('is-nay', k === cur);
      o.classList.toggle('is-sap', cur < n && (cur >= 0 ? k > cur && k <= cur + 5 : k < 5));
      o.classList.toggle('is-dung', kq === true);
      o.classList.toggle('is-sai', kq === false);
      const vd = o.querySelector('.sk-phim-vd');
      if (vd) [...vd.children].forEach((d, j) => { d.className = k === cur ? (j < P.vd ? 'is-xong' : j === P.vd ? 'is-nay' : '') : ''; });
    });
    // be rong that cua thanh tien do (doc bo cuc o day — tac vu sau, khong trong batDauNhip): doi -> ve lai doan
    if (dom.tienDo && !dom.tienDo.hidden) {
      const bw = dom.tienDo.clientWidth;
      if (bw && Math.abs(bw - (S.tdRong || 0)) > 1) { S.tdRong = bw; veDoan(); }
    }
    const neo = ray.children[clamp(cur < 0 ? 0 : cur, 0, n - 1)];
    const vp = dom.phim.clientWidth;
    if (!neo || !vp) return;
    // Het chuong / ket bai (khong con o hien tai): ca day dung giua (vua khung), khong thi o cuoi o moc 70%
    const rong = ray.scrollWidth;
    const tx = Math.round(cur >= n ? (rong <= vp * 0.8 ? (vp - rong) / 2 : vp * 0.7 - (neo.offsetLeft + neo.offsetWidth / 2))
      : vp * 0.3 - (neo.offsetLeft + neo.offsetWidth / 2));
    const cu = P.tx;
    ray.style.translate = `${tx}px 0`;
    P.tx = tx;
    if (hieuUng && cu != null && cu !== tx && !S.giam) chay(ray, [{ translate: `${cu}px 0`, offset: 0 }], { duration: PHIM_MS, delay: tre || 0, easing: E.out });
  }
  /**
   * Moi nhip: nhan dong dau + thanh chia doan + day phim cua chuong (truot mot o). tre (ms): the cu dang
   * lui ra — nhan / doan doi va day phim bat dau truot CUNG luc the moi vao (khong bao truoc noi dung)
   */
  function capNhatTienTrinh(beat, ctx, hieuUng, tre) {
    const ds = cacNhipChuong(ctx, beat.chapter);
    const moi = napChuong(beat.chapter, ds, hieuUng);
    S.phim.cur = viTriMuc(beat, ds, S.phim.muc);
    S.phim.vd = viTriVd(beat, ds);
    const nhan = nhanDau(beat, ctx);
    const doiDau = () => { if (dom.nhan.textContent !== nhan) dom.nhan.textContent = nhan; veDoan(); };
    if (tre > 0 && !moi) henThe(doiDau, tre); else doiDau();
    // day phim doc bo cuc (offsetLeft / scrollWidth): tac vu sau, khong ep bo cuc trong batDauNhip (T8)
    const m0 = performance.now();
    henThe(() => datPhim(hieuUng && !moi, Math.max(0, (tre || 0) - (performance.now() - m0))), 0);
  }

  // ---- ghi chu cua Sensei (bo sung B.5): mot dong "Sensei ghi" o chan the, ghi moi thay ghi cu
  const chuanSoSanh = (s) => String(s || '').normalize('NFKC').toLowerCase()
    .replace(/[\s　、。，．,.!?！？:：;；·・\-—–~〜"'“”‘’()（）[\]「」『』]+/g, '');
  /** Noi dung da nam trong the (vd meo cua tu dang hien) -> khong nhac lai o chan the */
  function daCoTrongThe(w, s) {
    const n = chuanSoSanh(s);
    if (n.length < 4 || !w.than) return false;
    return chuanSoSanh(w.than.textContent).includes(n);
  }
  function ghiChu(text, kieu) {
    const w = S.canh;
    if (!w || !w.chan || text == null) return false;
    const s = String(text).trim();
    if (!s) return false;
    if (S.che === 'cho') { themChanPhu(s); return true; }
    if (daCoTrongThe(w, s)) return true;
    const cu = w.chanChu.querySelector('.sk-ghi-chu');
    if (cu && chuanSoSanh(cu.textContent) === chuanSoSanh(s)) return true;
    datChan(w, s, 'ghi');
    if (kieu) w.chan.dataset.kieuGhi = String(kieu).replace(/[^a-z_-]/gi, '');
    if (!S.giam && !theDangDong(w.chan)) chay(w.chanChu, [{ opacity: 0, offset: 0 }], { duration: 240, easing: E.out });
    return true;
  }
  /** write_kanji ngoai canh chu Han: o 88px viet theo net o goc phai duoi cua the */
  function vietKanjiGhi(ch) {
    const B = window.SenseiBoard;
    const w = S.canh;
    if (!w || !w.the || !B || typeof B.vietChuHan !== 'function') return false;
    w.the.querySelectorAll(':scope > .sk-the-kj').forEach((x) => x.remove());
    const o = document.createElement('div');
    o.className = 'sk-the-kj';
    o.setAttribute('role', 'img');
    o.setAttribute('aria-label', 'Chữ ' + ch);
    w.the.appendChild(o);
    let ok = false;
    try { ok = !!B.vietChuHan(ch, { noi: o, tocDo: 0.3 }); } catch (e) { canhBao('vietChuHan', e); }
    if (!ok) { o.remove(); return false; }
    if (!S.giam) chay(o, [{ opacity: 0, offset: 0 }], { duration: 220, easing: E.out });
    return true;
  }
  function xoaGhi(w) {
    if (!w || !w.the) return;
    if (S.che !== 'cho') datChan(w, '', '');
    w.the.querySelectorAll(':scope > .sk-the-kj').forEach((x) => x.remove());
  }
  /** Ghi vao lich su bang ma KHONG mo bang (board.js vietBang(..., {im:true})) */
  function vietBangAn(text, kieu) {
    const B = window.SenseiBoard;
    if (!B || !text || typeof B.vietBang !== 'function') return;
    // Chi goi khi board co che do an (_bangAn) — ban cu mo bang, day canvas 390 px giua nhip
    if (typeof B._bangAn !== 'function') return;
    try { B.vietBang(text, kieu || 'thuong', { im: true }); } catch (e) { canhBao('vietBang', e); }
  }

  // ------------------------------------------------------------------ khop chu (§1.6.1)
  function themView(w, ch, rIdx) {
    const n = ch.normalize('NFKC');
    for (const d of n) { const j = jpChu(d); if (j) { w.jv += j; w.jvM.push(rIdx); } }
    const v = n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
    for (const d of v) {
      if (/[a-z0-9]/.test(d)) { w.vv += d; w.vvM.push(rIdx); }
      else if (w.vv.length && w.vv[w.vv.length - 1] !== ' ') { w.vv += ' '; w.vvM.push(rIdx); }
    }
  }
  /** Noi chu vao ban ghi cua nhip (w.R) va cua luot t (t = null: dau ngan luot) */
  function themChuoi(w, t, text) {
    const R0 = w.R.length;
    w.R += text;
    let off = t ? t.raw.length : 0;
    if (t) t.raw += text;
    let i = 0;
    while (i < text.length) {
      const cp = text.codePointAt(i);
      const ch = String.fromCodePoint(cp);
      const len = ch.length;
      for (let k = 0; k < len; k++) { w.rT.push(t ? t.idx : -1); w.rO.push(t ? off + k : -1); }
      if (t) {
        const ws = trongSo(ch, t.chTruoc);
        t.chTruoc = ch;
        t.uP.push(t.uP[t.uP.length - 1] + ws);
        t.cumJ.push(t.cumJ[t.cumJ.length - 1] + (laJP(ch) ? ws : 0));   // don vi chu Nhat (rJ) / con lai (rL)
        for (let k = 1; k < len; k++) { t.uP.push(t.uP[t.uP.length - 1]); t.cumJ.push(t.cumJ[t.cumJ.length - 1]); }
        // Moc cum: chu co tieng dau tien cua luot / sau dau ngat / khi doi chu Viet <-> Nhat
        const lop = laJP(ch) ? 'j' : (laLatin(ch) || (ch >= '0' && ch <= '9')) ? 'l' : RE_NGAT.test(ch) ? 'n' : '';
        if (lop === 'n') t.ngat = true;
        else if (lop) {
          if (t.lopTruoc == null || t.ngat || t.lopTruoc !== lop) {
            t.bien.push(off);
            t.bienLoai.push(t.lopTruoc == null ? 'dau' : t.lopTruoc !== lop ? 'doi' : 'ngat');
          }
          t.lopTruoc = lop; t.ngat = false;
        }
      }
      themView(w, ch, R0 + i);
      i += len;
      off += len;
    }
  }
  function dungLaiView(w) {
    w.jv = ''; w.jvM = []; w.vv = ''; w.vvM = [];
    let i = 0;
    while (i < w.R.length) {
      const ch = String.fromCodePoint(w.R.codePointAt(i));
      themView(w, ch, i);
      i += ch.length;
    }
  }
  function chuanKhoa(k, riengChung) {
    const jp = [], vn = [], daJ = new Set(), daV = new Set();
    if (!k) return { jp, vn };
    const rc = !!(riengChung || k.rieng);
    (k.jp || []).forEach((x) => {
      const s = typeof x === 'string' ? x : (x && (x.k || x.text));
      const r = x && typeof x === 'object' && 'rieng' in x ? !!x.rieng : rc;
      const n = chuanJP(s);
      if (n && !daJ.has(n + r)) { daJ.add(n + r); jp.push({ n, rieng: r }); }
    });
    (k.vn || []).forEach((x) => {
      const n = chuanVN(typeof x === 'string' ? x : (x && (x.k || x.text)));
      if (n && !daV.has(n)) { daV.add(n); vn.push(n); }
    });
    return { jp, vn };
  }
  function dauTu(arr, tu) {
    let lo = 0, hi = arr.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] < tu) lo = m + 1; else hi = m; }
    return lo;
  }
  /**
   * Doan R[s, e) cua mot lan khop co lien mach khong: khoa Nhat chi duoc cach nhau bang khoang trang / dau
   * (khong chu Latin / so, vd "私 là ...; trợ từ は" KHONG phai "私は"); khoa Viet khong vat qua chu Nhat;
   * khong khoa nao vat qua ranh gioi luot ("\n").
   */
  function lienMach(w, s, e, jp) {
    for (let i = s; i < e; i++) {
      const c = w.R[i];
      if (c === '\n') return false;
      if (jp ? (RE_LATIN.test(c) || (c >= '0' && c <= '9')) : laJP(c)) return false;
    }
    return true;
  }
  /** Moi lan khop (R index [s, e)) tu vi tri tu tro di, sap theo vi tri, bo chong lan */
  function timHits(w, kh, tu, het) {
    const hits = [];
    if (kh.jp.length && w.jv.length) {
      const p0 = dauTu(w.jvM, tu);
      for (const k of kh.jp) {
        let p = w.jv.indexOf(k.n, p0);
        while (p >= 0) {
          const s = w.jvM[p], e = w.jvM[p + k.n.length - 1] + 1;
          let ok = lienMach(w, s, e, true), cho = false;
          if (ok && k.rieng) {
            if (s > 0 && laJP(w.R[s - 1])) ok = false;
            if (ok) { if (e >= w.R.length) { if (!het) cho = true; } else if (laJP(w.R[e])) ok = false; }
          }
          if (ok && !cho) hits.push({ s, e });
          p = w.jv.indexOf(k.n, p + 1);
        }
      }
    }
    if (kh.vn.length && w.vv.length) {
      const p0 = dauTu(w.vvM, tu);
      for (const k of kh.vn) {
        let p = w.vv.indexOf(k, p0);
        while (p >= 0) {
          let ok = p === 0 || w.vv[p - 1] === ' ';
          let cho = false;
          if (ok && k.length <= 3) {
            const q = p + k.length;
            if (q >= w.vv.length) { if (!het) cho = true; } else if (w.vv[q] !== ' ') ok = false;
          }
          const s = w.vvM[p], e = w.vvM[p + k.length - 1] + 1;
          if (ok && !lienMach(w, s, e, false)) ok = false;
          if (ok && !cho) hits.push({ s, e });
          p = w.vv.indexOf(k, p + 1);
        }
      }
    }
    hits.sort((a, b) => a.s - b.s || b.e - a.e);
    const kq = [];
    let den = -1;
    for (const h of hits) { if (h.s < den) continue; kq.push(h); den = h.e; }
    return kq;
  }

  // ------------------------------------------------------------------ luot (§1.5.2)
  function luotMoi(w) {
    const t = {
      id: S.luotId, idx: w.turns.length, tGui: performance.now(),
      raw: '', uP: [0], chTruoc: '', frags: [], chunks: [], env: [], hist: new Uint32Array(101), soKhung: 0,
      A: 0, Tfirst: null, Tend: null, tam: true, xong: false, rStart: 0, duByte: -1, xa: 0,
      bien: [], bienLoai: [], lopTruoc: null, ngat: false, langC: null,   // moc cum (vi tri chu) + khoang lang (bo nho dem)
      cumJ: [0], ccC: null,                                   // don vi chu Nhat luy ke + can chinh (bo nho dem)
    };
    if (w.R.length) themChuoi(w, null, '\n');
    t.rStart = w.R.length;
    w.turns.push(t);
    w.luot = t;
    return t;
  }
  /** Bao hinh 20 ms (dBFS) cua mot goi PCM16 LE base64 */
  function baoHinh(t, b64) {
    let bin;
    try { bin = atob(b64); } catch (e) { return new Float32Array(0); }
    let off = 0, dau = -1;
    if (t.duByte >= 0) { dau = t.duByte; t.duByte = -1; }
    const tong = bin.length + (dau >= 0 ? 1 : 0);
    const n = tong >> 1;
    if (tong % 2) t.duByte = bin.charCodeAt(bin.length - 1);
    const F = 480;
    const db = new Float32Array(Math.max(0, Math.ceil(n / F)));
    const byteAt = (j) => (dau >= 0 ? (j === 0 ? dau : bin.charCodeAt(j - 1)) : bin.charCodeAt(j));
    for (let f = 0; f < db.length; f++) {
      let acc = 0, dem = 0;
      const a0 = f * F, a1 = Math.min(n, a0 + F);
      for (let i = a0; i < a1; i++) {
        let v = byteAt(2 * i + off) | (byteAt(2 * i + 1 + off) << 8);
        if (v >= 32768) v -= 65536;
        const x = v / 32768;
        acc += x * x;
        dem++;
      }
      const d = acc > 0 && dem ? 10 * Math.log10(acc / dem) : -100;
      db[f] = Math.max(-100, d);
      t.hist[clamp(Math.round(-db[f]), 0, 100)]++;
      t.soKhung++;
    }
    return db;
  }
  function p90(t) {
    if (!t.soKhung) return -30;
    const can = t.soKhung * 0.9;
    let dem = 0;
    for (let b = 100; b >= 0; b--) { dem += t.hist[b]; if (dem >= can) return -b; }
    return 0;
  }
  // ------------------------------------------------------------------ chu -> am thanh (§1.5.4, ban 3: can chinh)
  //  Ban 1 noi suy don vi deu tren TOAN BO am thanh giua hai moc manh chu: chu sau khoang nghi bi dat som, L
  //  hoc duoc lech len ~2 lan. Ban 2 chot TUNG moc cum vao khoang lang gan uoc luong (A_k - L) nhat: uoc
  //  luong moi manh lech 0.2-0.6 s (rung + goi 40-400 ms) -> "X. X. X," / "Từ ghép: 先月" chot nham khoang
  //  lang ke ben (sai 0.6-0.9 s). Ban 3: CAN CHINH ca day moc cum (chu) voi day khoang lang (am thanh):
  //   - "thoi gian co tieng": bo moi khoang lang >= 120 ms (bao hinh 20 ms);
  //   - moc cum (dau luot / sau dau ngat / doi chu Viet <-> Nhat) i khop khoang lang j (dau cum = diem cat
  //     tieng) hoac khong co khoang nghi (dau ngat doc lien, vd "Dịch: …"); quy hoach dong, chi phi:
  //       do dai co tieng giua hai moc khop lien tiep ~ don vi x giay / don vi (chu Nhat rJ, chu Viet rL),
  //       lech so voi uoc luong manh chu V(A_k - L), phat moc doi chu khong co khoang nghi, phat khoang lang
  //       khong thuoc moc nao;
  //   - chu giua cum noi suy tren thoi gian co tieng giua hai moc (theo don vi tung loai chu);
  //   - L, rJ, rL hoc cuoi luot tu chinh can chinh (hocLuot).
  const LANG_MIN = 0.12;
  const CC = { sc0: 0.08, sc: 0.15, sl: 0.35, bDoi: 4, bNgat: 0.6, bKhac: 0.3, pLang: 2.5, cuaB: 10, cuaR: 5, xa: 1.2, bam: 0.35 };
  /** Cac khoang lang >= 120 ms cua luot (giay am thanh trong luot), bo nho dem theo so khung + nguong */
  function langCua(t) {
    const nguong = Math.max(-50, p90(t) - 28);
    const khoa = t.soKhung + '|' + Math.round(nguong * 2) + '|' + (t.xong ? 1 : 0);
    if (t.langC && t.langC.khoa === khoa) return t.langC;
    const runs = [];
    let s = null, cuoi = null;
    for (const c of t.env) {
      const db = c.db;
      if (s !== null && cuoi !== null && c.a0 - cuoi > 0.005) {   // lo hong (goi bi bo): dong khoang lang o day
        if (cuoi - s >= LANG_MIN - 1e-6) runs.push({ s, e: cuoi });
        s = null;
      }
      for (let k = 0; k < db.length; k++) {
        const a = c.a0 + k * 0.02;
        if (db[k] < nguong) { if (s === null) s = a; }
        else if (s !== null) { if (a - s >= LANG_MIN - 1e-6) runs.push({ s, e: a }); s = null; }
        cuoi = Math.min(c.a0 + (k + 1) * 0.02, c.a1);
      }
    }
    // khoang lang con mo o cuoi am thanh da nhan: chua biet luc cat tieng (het luot: lang cuoi luot)
    if (s !== null && cuoi - s >= LANG_MIN - 1e-6) runs.push({ s, e: cuoi, mo: true });
    const cs = new Float64Array(runs.length), vr = new Float64Array(runs.length);
    let tong = 0;
    for (let i = 0; i < runs.length; i++) { cs[i] = tong; vr[i] = runs[i].s - tong; tong += runs[i].e - runs[i].s; }
    t.langC = { khoa, runs, cs, vr, tong };
    return t.langC;
  }
  /** Giay co tieng tu dau luot toi vi tri am thanh a */
  function vTaiA(Lc, a) {
    const R = Lc.runs;
    let lo = 0, hi = R.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (R[m].s < a) lo = m + 1; else hi = m; }
    if (!lo) return a;
    const i = lo - 1, r = R[i];
    return a - Lc.cs[i] - (Math.min(a, r.e) - r.s);
  }
  /** Vi tri am thanh nho nhat co v giay co tieng (dung o cuoi tieng truoc khoang lang) */
  function aTuV(Lc, v) {
    const R = Lc.runs, vr = Lc.vr;
    if (!(v > 0)) return Math.max(0, v || 0);
    let lo = 0, hi = R.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (vr[m] < v - 1e-9) lo = m + 1; else hi = m; }
    if (lo < R.length) return Math.max(lo ? R[lo - 1].e : 0, R[lo].s - (vr[lo] - v));
    return v + Lc.tong;
  }
  /** Uoc luong tho (giay co tieng) cua don vi u tu cac moc manh chu (U_k, V(A_k - L)) */
  function vUoc(t, Lc, u, L) {
    const f = t.frags;
    if (!f.length) return null;
    const LL = L == null ? S.L : L;
    let lo = 0, hi = f.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (f[m].u1 < u - 1e-9) lo = m + 1; else hi = m; }
    const yA = (k) => vTaiA(Lc, Math.max(0, f[k].A - LL));
    const U1 = f[lo].u1, Y1 = yA(lo);
    if (u > U1 + 1e-9) return Y1 + (u - U1) * S.rV;
    let j = lo - 1;
    while (j >= 0 && f[j].u1 >= U1 - 1e-9) j--;
    const U0 = j >= 0 ? f[j].u1 : 0, Y0 = j >= 0 ? yA(j) : 0;
    const Yb = Math.max(Y0, Y1);
    return U1 > U0 ? Y0 + (Yb - Y0) * (u - U0) / (U1 - U0) : Yb;
  }
  const laBien = (t, off) => { const b = t.bien; let lo = 0, hi = b.length; while (lo < hi) { const m = (lo + hi) >> 1; if (b[m] < off) lo = m + 1; else hi = m; } return lo < b.length && b[lo] === off ? lo : -1; };
  /** Chi so moc cum cuoi cung <= off (-1: khong co) */
  const bienTruoc = (t, off) => { const b = t.bien; let lo = 0, hi = b.length; while (lo < hi) { const m = (lo + hi) >> 1; if (b[m] <= off) lo = m + 1; else hi = m; } return lo - 1; };
  /** Chi so moc cum cua chu co tieng ke sau off (-1: cung cum / chua co chu) */
  function mocSau(t, off) {
    const raw = t.raw;
    for (let i = off + 1; i < raw.length; i++) {
      const c = raw[i];
      if (laJP(c) || laLatin(c) || (c >= '0' && c <= '9')) return laBien(t, i);
    }
    return -1;
  }
  /** Giay co tieng du kien cua chu raw[o0, o1) (chu Nhat x rJ, con lai x rL) */
  function duKien(t, o0, o1) {
    const n = t.uP.length - 1;
    o0 = clamp(o0, 0, n); o1 = clamp(o1, 0, n);
    const j = t.cumJ[o1] - t.cumJ[o0];
    return j * S.rJ + (t.uP[o1] - t.uP[o0] - j) * S.rL;
  }
  /**
   * Can chinh moc cum <-> khoang lang (quy hoach dong). Ket qua (nho dem theo du lieu + tham so):
   *  { v[i]: giay co tieng cua dau cum i, j[i]: khoang lang (chi so trong Lc.runs) hoac -1, a0: luc cat tieng
   *    dau luot, gia: chi phi, Lc }.
   */
  function canChinh(t, Lx) {
    const Lc = langCua(t);
    const L = Lx == null ? S.L : Lx;
    const khoa = Lc.khoa + '|' + t.frags.length + '|' + t.bien.length + '|' + L.toFixed(3) + '|' + S.rJ.toFixed(4) + '|' + S.rL.toFixed(4) + '|' + S.rV.toFixed(4);
    if (Lx == null && t.ccC && t.ccC.khoa === khoa) return t.ccC;
    const R = Lc.runs, b = t.bien, n = b.length;
    const r0 = R[0] && R[0].s <= 0.03 && !R[0].mo ? R[0] : null;   // lang dau luot
    const a0 = r0 ? r0.e : 0;
    // khoang lang dung duoc: da dong, khong phai lang dau luot
    const ds = [];
    for (let k = 0; k < R.length; k++) if (!R[k].mo && R[k] !== r0) ds.push(k);
    const m = ds.length;
    const q = ds.map((k) => Lc.vr[k]);
    const pL = new Float64Array(n);
    const coPL = new Uint8Array(n);
    for (let i = 0; i < n; i++) { const x = vUoc(t, Lc, t.uP[b[i]], L); if (x != null) { pL[i] = x; coPL[i] = 1; } }
    const Vnhan = vTaiA(Lc, t.A);
    const eT = vUoc(t, Lc, t.uP[t.uP.length - 1], L);
    const hetChu = eT == null ? Infinity : eT - 0.15;
    const phatB = (i) => {
      if (!coPL[i]) return 0;
      if (!t.xong && pL[i] > Vnhan - 0.3) return 0;   // khoang lang cua no co the chua toi
      const l = t.bienLoai[i];
      return l === 'doi' ? CC.bDoi : l === 'ngat' ? CC.bNgat : CC.bKhac;
    };
    const phatR = (jj) => (q[jj] >= hetChu ? 0 : CC.pLang);   // lang sau chu da co: cua cum chua toi
    const INF = 1e18, W = m + 1;
    const dp = new Float64Array(n * W).fill(INF);
    const tr = new Int32Array(n * W * 2).fill(-1);
    dp[0] = 0;   // (moc 0, "lang -1") = dau luot, v = 0
    const pB = new Float64Array(n);
    for (let i = 0; i < n; i++) pB[i] = phatB(i);
    const pR = new Float64Array(m);
    for (let jj = 0; jj < m; jj++) pR[jj] = phatR(jj);
    const du = new Float64Array(n);   // du[i] = giay co tieng du kien tu dau luot toi moc i
    for (let i = 0; i < n; i++) du[i] = duKien(t, b[0], b[i]);
    for (let i = 1; i < n; i++) {
      if (!coPL[i]) continue;
      for (let jj = 0; jj < m; jj++) {
        const dv = q[jj] - pL[i];
        if (dv < -CC.xa) continue;
        if (dv > CC.xa) break;
        let best = INF, bi = -1, bj = -1;
        let skipB = 0;
        for (let i0 = i - 1; i0 >= Math.max(0, i - CC.cuaB); i0--) {
          if (i0 < i - 1) skipB += pB[i0 + 1];
          let skipR = 0;
          for (let j0 = jj - 1; j0 >= Math.max(-1, jj - CC.cuaR); j0--) {
            if (j0 < jj - 1) skipR += pR[j0 + 1];
            const c0 = dp[i0 * W + j0 + 1];
            if (c0 >= INF) continue;
            const kv = du[i] - du[i0], thuc = q[jj] - (j0 < 0 ? 0 : q[j0]);
            const sc = CC.sc0 + CC.sc * Math.max(0, kv);
            const c = c0 + ((thuc - kv) / sc) ** 2 + skipB + skipR;
            if (c < best) { best = c; bi = i0; bj = j0; }
          }
        }
        if (best < INF) {
          const o = i * W + jj + 1;
          dp[o] = best + (dv / CC.sl) ** 2;
          tr[o * 2] = bi; tr[o * 2 + 1] = bj;
        }
      }
    }
    // ket: moc khop cuoi (i, j) + phat moc / lang sau no
    let gia = INF, ei = 0, ej = -1;
    const sauB = new Float64Array(n + 1);
    for (let i = n - 1; i >= 0; i--) sauB[i] = sauB[i + 1] + pB[i];
    const sauR = new Float64Array(m + 1);
    for (let jj = m - 1; jj >= 0; jj--) sauR[jj] = sauR[jj + 1] + pR[jj];
    for (let i = 0; i < n; i++) {
      for (let jj = -1; jj < m; jj++) {
        const c0 = dp[i * W + jj + 1];
        if (c0 >= INF) continue;
        const c = c0 + sauB[i + 1] + sauR[jj + 1];
        if (c < gia) { gia = c; ei = i; ej = jj; }
      }
    }
    const jOf = new Int32Array(n).fill(-1);
    let ci = ei, cj = ej;
    while (ci > 0) {
      jOf[ci] = ds[cj];
      const o = ci * W + cj + 1;
      const bi = tr[o * 2], bj = tr[o * 2 + 1];
      ci = bi; cj = bj;
    }
    // v cua moi moc: khop -> diem lang; khong khop -> noi suy theo don vi giua hai moc khop ke ben / ngoai suy
    // (bam trong [pL - 0.35, pL + 0.35]: xa moc khop thi uoc luong manh chu dang tin hon)
    const v = new Float64Array(n);
    const khop = (i) => i === 0 || jOf[i] >= 0;
    for (let i = 1; i < n; i++) if (jOf[i] >= 0) v[i] = Lc.vr[jOf[i]];
    let truoc = 0;
    for (let i = 1; i < n; i++) {
      if (khop(i)) { truoc = i; continue; }
      let sau = -1;
      for (let k = i + 1; k < n; k++) if (jOf[k] >= 0) { sau = k; break; }
      if (sau >= 0) {
        const a = du[i] - du[truoc], bb = du[sau] - du[truoc];
        v[i] = v[truoc] + (v[sau] - v[truoc]) * (bb > 0 ? clamp(a / bb, 0, 1) : 0);
      } else {
        const x = v[truoc] + (du[i] - du[truoc]);
        v[i] = coPL[i] ? clamp(x, pL[i] - CC.bam, pL[i] + CC.bam) : x;
        if (v[i] < v[i - 1]) v[i] = v[i - 1];
      }
    }
    const kq = { khoa, v, j: jOf, a0, gia, Lc, pL, coPL, L };
    if (Lx == null) t.ccC = kq;
    return kq;
  }
  /**
   * Vi tri am thanh (giay trong luot) cua ky tu off: dau ky tu, hoac (sau) diem cuoi ky tu.
   * nguon: 'chot' (dau / cuoi cum khop khoang lang) | 'moc' (noi suy tu moc khop) | 'uoc' (chua co moc khop).
   */
  function aKyTu(t, off, sau, ccX) {
    if (!t.frags.length) return null;
    const cc = ccX || canChinh(t);
    const Lc = cc.Lc, b = t.bien, n = b.length;
    const bi = bienTruoc(t, off);
    if (bi < 0 || !n) return { a: cc.a0, nguon: 'moc' };
    const R = Lc.runs;
    if (!sau && b[bi] === off) {
      if (bi === 0) return { a: cc.a0, nguon: 'chot' };
      if (cc.j[bi] >= 0) return { a: R[cc.j[bi]].e, nguon: 'chot' };
    }
    if (sau) {
      const b1 = mocSau(t, off);
      if (b1 > 0 && cc.j[b1] >= 0) return { a: R[cc.j[b1]].s, nguon: 'chot' };   // cuoi cum: diem tat tieng
    }
    const o1 = Math.min(sau ? off + 1 : off, t.raw.length);
    let v, nguon;
    const neo = bi === 0 || cc.j[bi] >= 0;
    if (bi + 1 < n) {
      const a = duKien(t, b[bi], o1), bb = duKien(t, b[bi], b[bi + 1]);
      v = cc.v[bi] + (cc.v[bi + 1] - cc.v[bi]) * (bb > 0 ? clamp(a / bb, 0, 1) : 0);
      nguon = neo || cc.j[bi + 1] >= 0 ? 'moc' : 'uoc';
    } else {
      v = cc.v[bi] + duKien(t, b[bi], o1);
      nguon = neo ? 'moc' : 'uoc';
      const v0 = vUoc(t, Lc, t.uP[o1], cc.L);
      if (v0 != null) v = clamp(v, v0 - CC.bam, v0 + CC.bam);
    }
    return { a: Math.max(cc.a0, aTuV(Lc, Math.max(0, v))), nguon };
  }
  /**
   * R index s -> { t, a (giay am thanh trong luot t), nguon }. sau: DIEM CUOI ky tu s. (chot: giu tham so cu —
   * can chinh luon dung khoang lang khi co)
   */
  function viTriA(w, s, chot, sau) {
    void chot;
    while (s > 0 && w.rT[s] < 0) s--;
    const t = w.turns[w.rT[s]];
    if (!t || !t.frags.length) return null;
    const x = aKyTu(t, w.rO[s], sau);
    return x ? { t, a: x.a, nguon: x.nguon } : null;
  }
  /** Thoi diem (dong ho dao dien) -> vi tri am thanh trong luot t (nguoc cua tTuA) */
  function aTaiT(t, T) {
    const c = t.chunks;
    if (!c.length) return 0;
    if (T <= c[0].t0) return c[0].a0 - (c[0].t0 - T);
    let lo = 0, hi = c.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (c[m].t0 <= T) lo = m; else hi = m - 1; }
    const x = c[lo];
    if (lo === c.length - 1 && T > x.t1) return x.a1 + (T - x.t1);
    return x.a0 + Math.min(T - x.t0, x.t1 - x.t0);
  }
  function tTuA(t, a) {
    const c = t.chunks;
    if (!c.length) return null;
    const cuoi = c[c.length - 1];
    if (a >= t.A) return cuoi.t1 + (a - t.A);
    if (a < c[0].a0) return c[0].t0 - (c[0].a0 - a);
    let lo = 0, hi = c.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (c[m].a0 <= a) lo = m; else hi = m - 1; }
    const x = c[lo];
    return x.t0 + Math.min(a - x.a0, x.t1 - x.t0);
  }
  /** R index -> thoi diem (dong ho dao dien). sau: lay DIEM CUOI cua ky tu s. null = chua co am thanh */
  function viTriT(w, s, chot, sau) {
    const x = viTriA(w, s, chot, sau);
    return x ? tTuA(x.t, x.a) : null;
  }
  /** Thoi diem T -> R index cua chu dang duoc noi luc do (con tro cho cue phu thuoc sau mot cue ban du phong) */
  function rTaiT(w, T) {
    let t = null;
    for (let k = w.turns.length - 1; k >= 0; k--) {
      const x = w.turns[k];
      if (x.chunks.length && x.frags.length) { t = x; if (x.Tfirst != null && T >= x.Tfirst) break; }
    }
    if (!t) return w.R.length;
    const n = t.raw.length;
    const tai = (off) => { const x = aKyTu(t, off, false); return x ? tTuA(t, x.a) : Infinity; };
    let lo = 0, hi = n;
    while (lo < hi) { const m = (lo + hi) >> 1; if (tai(m) <= T) lo = m + 1; else hi = m; }
    return t.rStart + Math.max(0, lo - 1);
  }

  // ------------------------------------------------------------------ cue (§1.6)
  function taoCue(cue, i) {
    const khi = (cue && cue.khi) || {};
    const loai = cue.loai || 'hien';
    const batBuoc = (loai === 'hien' || loai === 'lam') && cue.batBuoc !== false && !cue.tuyChon;
    const dp = cue.duPhong || null;
    return {
      cue, id: cue.id || ('c' + i), i, loai, khi, dp, batBuoc, thuTu: batBuoc && !cue.docLap,
      tt: 'cho', Tp: null, viaP: null, Td: null, viaD: null, Tf: null, Tdu: null, To: null, viaO: null, Teff: null, keo: false,
      khopS: null, khopE: null, dpS: null, cumI: null, luot: null, viTri: null,
      timer: null, henT: null, tiLe: typeof cue.tiLe === 'number' ? cue.tiLe : (batBuoc ? 0.5 : null),
      kh: khi.khop ? chuanKhoa(khi.khop, khi.rieng) : null,
      kc: cue.khopCuoi ? chuanKhoa(cue.khopCuoi, cue.khopCuoi.rieng) : null,
      kd: dp && dp.khop ? chuanKhoa(dp.khop, dp.rieng) : null,
      firedCtx: null, firedPerf: null, via: null, T: null, dur: null,
    };
  }
  const conSong = (st) => st.tt === 'cho' || st.tt === 'hen';
  function ownT(st) {
    if (st.Tp != null) return { T: st.Tp, via: st.viaP };
    if (st.Td != null) return { T: st.Td, via: st.viaD };
    if (st.Tf != null) return { T: st.Tf, via: 'tiLe' };
    if (st.Tdu != null) return { T: st.Tdu, via: 'tiLe' };
    return null;
  }
  /** Lap lich: moi cue noi dung (thuTu) ban truoc cue noi dung sau no >= 120 ms (keo len neu can) */
  function lapLich(w) {
    if (!w || w !== S.canh) return;
    let tiep = Infinity;
    for (let k = w.cues.length - 1; k >= 0; k--) {
      const st = w.cues[k];
      if (!conSong(st)) continue;
      const o = ownT(st);
      st.To = o ? o.T : null;
      st.viaO = o ? o.via : null;
      if (st.thuTu) {
        const eff = Math.min(st.To != null ? st.To : Infinity, tiep - 0.12);
        st.keo = isFinite(eff) && (st.To == null || eff < st.To - 1e-6);
        st.Teff = eff;
        if (isFinite(eff)) tiep = eff;
      } else {
        st.Teff = st.To != null ? st.To : Infinity;
        st.keo = false;
      }
    }
    for (const st of w.cues) {
      if (!conSong(st)) continue;
      if (isFinite(st.Teff)) henCue(w, st);
      else if (st.timer != null) { huyHen(st.timer); st.timer = null; st.henT = null; st.tt = 'cho'; }
    }
  }
  function henCue(w, st) {
    if (st.timer != null && st.henT === st.Teff) return;
    if (st.timer != null) huyHen(st.timer);
    st.henT = st.Teff;
    st.tt = 'hen';
    const con = st.Teff - S.LEAD - dongHo();
    // Da toi han (vd goi am dau chi xep truoc 35 ms): ban ngay sau tac vu nay, khong cho them mot vong hen gio
    if (con <= SOM) st.timer = henNgay(() => { st.timer = null; thucThi(w, st); });
    else st.timer = henThe(() => { st.timer = null; thucThi(w, st); }, msHen(con));
  }
  const viaBan = (st) => (st.keo ? 'thuTu' : (st.viaO || 'tiLe'));
  function thucThi(w, st) {
    if (!conSong(st) || w !== S.canh) return;
    const now = dongHo();
    const moc = st.Teff - S.LEAD;
    if (now < moc - SOM) {
      st.timer = henThe(() => { st.timer = null; thucThi(w, st); }, msHen(moc - now));
      return;
    }
    if (st.loai === 'nhan' || st.loai === 'doc') {
      const To = st.To != null ? st.To : st.Teff;
      if (now - To > 0.40) { boCue(w, st); return; }
      if (st.loai === 'nhan' && S.nhanLuc && now < S.nhanLuc + 0.6) {
        const t2 = S.nhanLuc + 0.6;
        if (t2 - To > 0.40) { boCue(w, st); return; }
        st.Teff = t2 + S.LEAD;
        st.henT = st.Teff;
        st.timer = henThe(() => { st.timer = null; thucThi(w, st); }, (t2 - now) * 1000);
        return;
      }
    }
    if (st.thuTu) {
      const truoc = w.cues.filter((x) => x.thuTu && x.i < st.i && conSong(x));
      if (truoc.length) {
        const chuoi = [...truoc, st];
        chuoi.forEach((x) => { if (x.timer != null) { huyHen(x.timer); x.timer = null; } x.tt = 'xep'; });
        chuoi.forEach((x, k) => {
          const via = x === st ? viaBan(x) : 'thuTu';
          if (k === 0) banCue(w, x, via);
          else henThe(() => banCue(w, x, via), k * 120);
        });
        return;
      }
    }
    banCue(w, st, viaBan(st));
  }
  function tinhDur(w, st, T) {
    if (st.kc && (st.kc.jp.length || st.kc.vn.length)) {
      const tu = st.khopS != null ? st.khopS : 0;
      const h = timHits(w, st.kc, tu, true).find((x) => x.e > tu);
      if (h) {
        const Te = viTriT(w, h.e - 1, true, true);
        if (Te != null && Te > T + 0.05) return clamp((Te - T) * 1000, 350, 3500);
      }
    }
    const u = st.cue.donVi != null ? Number(st.cue.donVi) || 0
      : (st.khopS != null ? donVi(w.R.slice(st.khopS, st.khopE)) : 0);
    return clamp(u * S.r * 1.2 * 1000, 350, 3500);
  }
  function ghiNhatKy(x) {
    if (S.nhatKy.length >= MAX_NHAT_KY) S.nhatKy.splice(0, 500);
    S.nhatKy.push(x);
  }
  function banCue(w, st, via) {
    if (st.tt === 'da' || st.tt === 'bo') return;
    if (st.timer != null) { huyHen(st.timer); st.timer = null; }
    st.tt = 'da';
    const firedCtx = dongHo(), firedPerf = performance.now();
    const T = st.To != null && via !== 'nen' && via !== 'thuTu' ? st.To : firedCtx + S.LEAD;
    const dur = st.loai === 'doc' ? tinhDur(w, st, T) : undefined;
    const tt = { T, via, dur };
    if (via === 'nen') tt.nen = true;
    const m0 = performance.now();
    try { if (typeof st.cue.lam === 'function') st.cue.lam(tt); } catch (e) { canhBao('lam ' + st.id, e); }
    const msLam = performance.now() - m0;
    Object.assign(st, { via, firedCtx, firedPerf, T, dur: dur == null ? null : dur, mocT: via === 'khop' ? null : firedCtx + S.LEAD });
    ghiNhatKy({
      nhip: w.beat.index, kind: w.kind, id: st.id, loai: st.loai, via, T, firedCtx, firedPerf,
      luot: st.luot, viTri: st.viTri, msLam, canh: w.so, the: w.the, epoch: S.epoch, dur: st.dur, khopPerf: st.khopPerf || null,
      khopCtx: st.khopCtx != null ? st.khopCtx : null, giaiCtx: st.giaiCtx != null ? st.giaiCtx : null,
      congCu: via === 'congCu' ? st.congCu || null : null, nguon: st.nguonT || null,
      denCtx: via === 'dauTien' && w.denCtx != null ? w.denCtx : null, Tfirst: via === 'dauTien' ? w.Tfirst : null,
      // T4 "first audio": LEAD dang dung + lead THUC co duoc (T_first - luc biet am dau; audio-engine chi xep goi
      // dau truoc 35 ms + do tre dau ra) va do tre ban sau khi biet (treBan, dao dien: ~1 ms)
      lead: S.LEAD,
      leadThuc: via === 'dauTien' && w.denCtx != null && w.Tfirst != null ? Math.min(S.LEAD, w.Tfirst - w.denCtx) : null,
      treBan: via === 'dauTien' && w.denCtx != null ? firedCtx - w.denCtx : null,
    });
    sauKhiBan(w, st);
    kiemXong(w);
  }
  function boCue(w, st) {
    if (st.tt === 'da' || st.tt === 'bo') return;
    if (st.timer != null) { huyHen(st.timer); st.timer = null; }
    st.tt = 'bo';
    st.via = 'bo';
    st.mocT = dongHo();
    ghiNhatKy({
      nhip: w.beat.index, kind: w.kind, id: st.id, loai: st.loai, via: 'bo', T: st.To, firedCtx: null, firedPerf: null,
      luot: st.luot, viTri: st.viTri, msLam: 0, canh: w.so, the: w.the, epoch: S.epoch, boCtx: dongHo(), khopPerf: st.khopPerf || null,
    });
  }
  const dieuKien = (k, ref) => !k.neuVia || ref.via === k.neuVia;
  function sauKhiBan(w, st) {
    const goc = st.firedCtx + S.LEAD;
    let doi = false;
    for (const x of w.cues) {
      if (!conSong(x)) continue;
      if (x.khi.sauCue === st.id && x.Tp == null && dieuKien(x.khi, st)) { x.Tp = goc + (x.khi.ms || 0) / 1000; x.viaP = 'sauCue'; doi = true; }
      if (x.dp && x.dp.sauCue === st.id && x.Td == null && dieuKien(x.dp, st)) { x.Td = goc + (x.dp.ms || 0) / 1000; x.viaD = 'sauCue'; doi = true; }
    }
    if (doi) lapLich(w);
  }
  function kiemXong(w) {
    if (w.daXong) return;
    const bb = w.cues.filter((x) => x.batBuoc);
    if ((bb.length && bb.every((x) => x.tt === 'da')) || (!bb.length && w.daNen)) {
      w.daXong = true;
      try { if (typeof w.canh.xong === 'function') w.canh.xong(); } catch (e) { canhBao('xong', e); }
    }
  }
  /** Nen (§1.6.4.5): moi cue bat buoc chua ban -> ban ngay (so le 60 ms, <= 480 ms); con lai bo */
  function nenCanh(w, dongBo) {
    if (!w) return 0;
    w.cues.forEach((x) => { if (conSong(x) && !x.batBuoc) boCue(w, x); });
    const con = w.cues.filter((x) => x.batBuoc && conSong(x));
    w.daNen = true;
    if (!con.length) { kiemXong(w); return 0; }
    const buoc = con.length > 1 ? Math.min(60, 480 / (con.length - 1)) : 0;
    con.forEach((x) => { if (x.timer != null) { huyHen(x.timer); x.timer = null; } x.tt = 'xep'; });
    con.forEach((x, k) => {
      if (dongBo || k === 0) banCue(w, x, 'nen');
      else henThe(() => banCue(w, x, 'nen'), k * buoc);
    });
    return dongBo ? 0 : Math.round((con.length - 1) * buoc) + 200;
  }
  /** Tim khop moi cho moi cue con song (sau moi manh chu) */
  /**
   * Con tro tim cua cue theo `sau` (§1.6.2 / §3.4 "first match after E2"): cuoi lan khop cua cue tham chieu.
   * Tham chieu con song ma CHUA khop -> null: chua tim (khong de cue phu thuoc ban truoc tham chieu cua no).
   * Tham chieu da ban du phong / da bo ma khong khop -> tim tu chu dang noi luc no ban / bo.
   */
  function tuCua(w, st) {
    const id = st.cue.sau;
    if (!id) return 0;
    const ref = w.byId[id];
    if (!ref || ref === st) return 0;
    if (ref.khopE != null) return ref.khopE;
    if (conSong(ref)) return null;
    if (ref.rMoc == null) ref.rMoc = ref.mocT != null ? rTaiT(w, ref.mocT) : 0;
    return ref.rMoc;
  }
  function timKhopCanh(w, het) {
    let doi = false;
    for (const st of w.cues) {
      if (!conSong(st)) continue;
      if (st.kh && st.khopS == null && (st.kh.jp.length || st.kh.vn.length)) {
        const tu = tuCua(w, st);
        const h = tu == null ? null : timHits(w, st.kh, tu, het)[(st.khi.lan || 1) - 1];
        if (h) {
          st.khopS = h.s; st.khopE = h.e; st.viaP = 'khop'; st.khopPerf = performance.now(); st.khopCtx = dongHo();
          const t = w.turns[w.rT[h.s]];
          st.luot = t ? t.id : null;
          st.viTri = w.rO[h.s];
          doi = true;
        }
      }
      if (st.khi.cumSau != null && st.cumI == null) {
        const ref = w.byId[st.khi.cumSau];
        if (ref && ref.khopE != null) {
          let b = null;
          for (let i = ref.khopE; i < w.R.length; i++) {
            const c = w.R[i];
            if (RE_NGAT.test(c)) { b = i; break; }
            const tt = w.turns[w.rT[i]];
            if (tt && i > ref.khopE && laBien(tt, w.rO[i]) >= 0) { b = i; break; }   // doi chu Viet <-> Nhat
          }
          if (b == null && het && w.R.length > ref.khopE) b = w.R.length;
          if (b != null && b > 0) { st.cumI = b - 1; st.viaP = 'cumSau'; const t = w.turns[w.rT[b - 1]]; st.luot = t ? t.id : null; doi = true; }
        }
      }
      if (st.kd && st.dpS == null && st.khopS == null && (st.kd.jp.length || st.kd.vn.length)) {
        const tu = tuCua(w, st);
        const h = tu == null ? null : timHits(w, st.kd, tu, het)[((st.dp && st.dp.lan) || 1) - 1];
        if (h) { st.dpS = h.s; st.viaD = 'khop'; doi = true; }
      }
    }
    if (doi) giaiLai(w);
  }
  /** Tinh lai thoi diem cho moi cue da khop chu nhung chua ban (co goi am moi / L moi) */
  function giaiLai(w) {
    for (const st of w.cues) {
      if (!conSong(st)) continue;
      if (st.khopS != null) {
        const x = viTriA(w, st.khopS, true, false);
        st.Tp = x ? tTuA(x.t, x.a) : null; st.nguonT = x ? x.nguon : null;
        if (st.Tp != null && st.giaiCtx == null) st.giaiCtx = dongHo();   // chan doan: luc biet T lan dau
      }
      else if (st.cumI != null) st.Tp = viTriT(w, st.cumI, true, true);
      if (st.dpS != null && st.khopS == null) {
        const T = viTriT(w, st.dpS, true, false);
        st.Td = T != null ? T + ((st.dp && st.dp.ms) || 0) / 1000 : null;
      }
      // moc tool (§1.5.5): cho tieng sau tool hien ra trong bao hinh
      if (st.cc && st.Tp == null) { const T = giaiMocCongCu(st.cc); if (T != null) { st.Tp = T + st.ccMs; st.viaP = 'congCu'; } }
      if (st.ccD && st.Td == null) { const T = giaiMocCongCu(st.ccD); if (T != null) { st.Td = T + st.ccDMs; st.viaD = 'congCu'; } }
    }
    giaiViecCongCu(w);
    lapLich(w);
  }
  function khiAmDau(w) {
    // luc dao dien biet am dau (chan doan T4 "first audio": cue dauTien ban ngay trong tac vu nay; goi dau chi
    // duoc audio-engine xep truoc 35 ms + do tre dau ra -> sai so san = LEAD - (T_first - denCtx))
    w.denCtx = dongHo();
    if (dom.tt && dom.tt.dataset.kieu === 'chuan-bi') datTrangThai('', '');
    const k = PRIOR[w.kind] || 20;
    for (const st of w.cues) {
      if (!conSong(st)) continue;
      if (st.khi.dauTien && st.Tp == null) { st.Tp = w.Tfirst; st.viaP = 'dauTien'; st.luot = w.turns[0] ? w.turns[0].id : null; }
      if (st.dp && st.dp.dauTien && st.Td == null) { st.Td = w.Tfirst + (st.dp.ms || 0) / 1000; st.viaD = 'dauTien'; }
      if (st.batBuoc && st.tiLe != null) st.Tdu = w.Tfirst + (st.tiLe + 0.15) * k * 1.6;
    }
  }
  /** Doi mien dong ho (tuong <-> AudioContext) giua nhip: doi het moc da hen */
  function doiMien(w, tuong) {
    if (S.wall === tuong) return;
    const cu = dongHo();
    S.wall = tuong;
    const d = dongHo() - cu;
    if (!w) return;
    for (const st of w.cues) {
      if (!conSong(st)) continue;
      ['Tp', 'Td', 'Tf', 'Tdu'].forEach((k) => { if (st[k] != null) st[k] += d; });
      st.henT = null;
    }
    if (w.vaoT != null) w.vaoT += d;
    lapLich(w);
  }
  function boLuotTam(w, t) {
    const cuFirst = w.Tfirst != null && t.Tfirst != null && w.Tfirst === t.Tfirst;
    t.raw = ''; t.uP = [0]; t.chTruoc = ''; t.frags = []; t.chunks = []; t.env = []; t.hist.fill(0); t.soKhung = 0;
    t.A = 0; t.Tfirst = null; t.duByte = -1;
    t.bien = []; t.bienLoai = []; t.lopTruoc = null; t.ngat = false; t.langC = null; t.cumJ = [0]; t.ccC = null;
    w.R = w.R.slice(0, t.rStart);
    w.rT.length = t.rStart;
    w.rO.length = t.rStart;
    dungLaiView(w);
    if (cuFirst) w.Tfirst = null;
    for (const st of w.cues) {
      if (!conSong(st)) continue;
      if (st.khopS != null && st.khopS >= t.rStart) { st.khopS = null; st.khopE = null; st.Tp = null; st.viaP = null; st.luot = null; st.viTri = null; st.khopCtx = null; st.giaiCtx = null; }
      if (st.cumI != null && st.cumI >= t.rStart) { st.cumI = null; st.Tp = null; st.viaP = null; }
      if (st.dpS != null && st.dpS >= t.rStart) { st.dpS = null; st.Td = null; st.viaD = null; }
      if (cuFirst) {
        if (st.viaP === 'dauTien') { st.Tp = null; st.viaP = null; }
        if (st.viaD === 'dauTien') { st.Td = null; st.viaD = null; }
        st.Tdu = null;
      }
    }
    lapLich(w);
  }
  /**
   * Hoc L / r / rJ / rL cuoi luot (§1.5.6, ban 3). L_i = A_i - (vi tri cuoi chu cua manh i theo CHINH can
   * chinh dat cue). Luot dau cua trang: lap diem bat dong (can chinh it phu thuoc L nho rang buoc do dai giua
   * cac moc; L lech -> can chinh van dung -> L tinh lai dung). rJ / rL: giay co tieng / don vi cua cac cum
   * Nhat / Viet nam giua hai moc khop lien tiep.
   */
  function hocLuot(w, t) {
    void w;
    const Atot = t.A;
    if (Atot < 1 || t.frags.length < 2) return;
    const Utot = t.uP[t.uP.length - 1];
    if (!(Utot > 0)) return;
    const Lc = langCua(t);
    const cuoiR = Lc.runs[Lc.runs.length - 1];
    const lang = cuoiR && cuoiR.e >= Atot - 0.03 ? cuoiR.e - cuoiR.s : 0;
    const Aeff = Math.max(0.1, Atot - Math.min(lang, Atot * 0.5));
    const Veff = Math.max(0.1, vTaiA(Lc, Aeff));
    const trungVi = (a) => { if (!a.length) return null; a.sort((x, y) => x - y); return a[a.length >> 1]; };
    const uocL = (Lx) => {
      const cc = canChinh(t, Lx);
      const tot = [], moi = [];
      for (const f of t.frags) {
        if (!(f.off > 0)) continue;
        const x = aKyTu(t, f.off - 1, true, cc);
        if (!x) continue;
        moi.push(f.A - x.a);
        if (x.nguon !== 'uoc') tot.push(f.A - x.a);
      }
      return { L: trungVi(tot.length >= 5 ? tot : moi), cc };
    };
    let Lt = S.L, cc = null;
    const lap = S.soHoc === 0 ? 4 : 2;
    for (let k = 0; k < lap; k++) {
      const x = uocL(clamp(Lt, -1.5, 1.5));
      cc = x.cc;
      if (x.L == null || !isFinite(x.L)) break;
      const moi = S.soHoc > 0 ? clamp(x.L, S.L - 0.4, S.L + 0.4) : x.L;
      const xong = Math.abs(moi - Lt) < 0.01;
      Lt = moi;
      if (xong) break;
    }
    // luot dau cua trang (du dai): lay thang; hai luot sau hoc nhanh, roi on dinh
    const k = S.soHoc === 0 && t.frags.length >= 10 ? 1 : S.soHoc < 3 ? 0.5 : 0.3;
    if (Lt != null && isFinite(Lt)) S.L = clamp((1 - k) * S.L + k * Lt, -1.5, 1.5);
    // rJ / rL tu cac cum giua hai moc khop lien tiep (moi cum mot loai chu: doi chu la mot moc)
    if (cc) {
      let sJ = 0, uJ = 0, sL = 0, uL = 0;
      const b = t.bien;
      for (let i = 1; i < b.length; i++) {
        const k0 = i - 1;
        if (cc.j[i] < 0 || (k0 > 0 && cc.j[k0] < 0)) continue;
        const dv = cc.v[i] - cc.v[k0];
        const uj = t.cumJ[b[i]] - t.cumJ[b[k0]], ul = (t.uP[b[i]] - t.uP[b[k0]]) - uj;
        if (!(dv > 0)) continue;
        if (uj > 0 && ul === 0) { sJ += dv; uJ += uj; } else if (ul > 0 && uj === 0) { sL += dv; uL += ul; }
      }
      const kr = S.soHoc === 0 ? 0.7 : 0.4;
      if (uJ >= 5) S.rJ = clamp((1 - kr) * S.rJ + kr * (sJ / uJ), 0.06, 0.35);
      if (uL >= 5) S.rL = clamp((1 - kr) * S.rL + kr * (sL / uL), 0.06, 0.35);
    }
    if (Utot >= 20) {
      S.r = clamp(0.7 * S.r + 0.3 * (Aeff / Utot), 0.08, 0.3);
      S.rV = clamp((1 - k) * S.rV + k * (Veff / Utot), 0.06, 0.3);
    }
    S.soHoc++;
    try { localStorage.setItem('sk.dongBo', JSON.stringify({ L: +S.L.toFixed(4), r: +S.r.toFixed(4), rV: +S.rV.toFixed(4), rJ: +S.rJ.toFixed(4), rL: +S.rL.toFixed(4) })); } catch (e) {}
  }
  function napThamSo() {
    try {
      const v = JSON.parse(localStorage.getItem('sk.dongBo') || 'null');
      if (v && isFinite(v.L)) S.L = clamp(+v.L, -1.5, 1.5);
      if (v && isFinite(v.r)) S.r = clamp(+v.r, 0.08, 0.3);
      if (v && isFinite(v.rV)) S.rV = clamp(+v.rV, 0.06, 0.3);
      if (v && isFinite(v.rJ)) S.rJ = clamp(+v.rJ, 0.06, 0.35);
      if (v && isFinite(v.rL)) S.rL = clamp(+v.rL, 0.06, 0.35);
    } catch (e) {}
  }

  // ------------------------------------------------------------------ moc tool (§1.5.5, ban 2)
  //  Ban 1: T = cuoi hang am thanh luc goi. Mo hinh ta cho tool toi SOM hon loi di kem toi 0.3-1.5 s (am thanh
  //  truoc tool con dang toi), nen T som dung bang do som. Ban 2: cuoi hang luc goi chi la CAN DUOI; loi di
  //  kem tool bat dau o diem cat tieng dau tien sau mot khoang lang (tool goi giua hai cum) trong
  //  [T0 - 0.15, T0 + 1.5]; tool toi truoc moi am thanh cua luot -> dung luc tieng dau tien (T_first).
  //  Khong thay khoang lang nao khi da nhan du am thanh toi T0 + 1.5 (hoac het luot) -> T0.
  function taoMocCongCu(w, T0) {
    const t = w && w.luot && !w.luot.xong && (S.che === 'giang' || S.che === 'chuyen') ? w.luot : null;
    const c = { T0, t, truocAm: !!(t && !t.chunks.length), a0: null, T: null };
    if (t && !c.truocAm) c.a0 = aTaiT(t, T0);
    return c;
  }
  function giaiMocCongCu(c) {
    if (c.T != null) return c.T;
    const t = c.t;
    if (!t) return (c.T = c.T0);
    if (c.truocAm) {
      if (t.Tfirst != null && !t.giu) return (c.T = Math.max(c.T0, t.Tfirst));
      return t.xong ? (c.T = c.T0) : null;
    }
    const Lc = langCua(t), R = Lc.runs;
    for (const r of R) {
      if (r.e < c.a0 - 0.15) continue;
      if (r.e > c.a0 + 1.5) break;
      if (r.mo) { if (t.xong) break; return null; }   // chua biet luc cat tieng / lang cuoi luot
      return (c.T = tTuA(t, r.e));
    }
    if (t.xong || t.A >= c.a0 + 1.5) return (c.T = c.T0);
    return null;
  }
  /** Viec cua tool (ghi chu, ve bang, nhan manh) cho moc tool; chay o T - lead */
  function henCongCu(w, c, fn, lead) {
    const T = giaiMocCongCu(c);
    if (T != null || !w) { henLuc(T != null ? T : c.T0, fn, lead); return; }
    (w.ccViec || (w.ccViec = [])).push({ c, fn, lead });
  }
  function giaiViecCongCu(w) {
    if (!w || !w.ccViec || !w.ccViec.length) return;
    const con = [];
    for (const x of w.ccViec) {
      const T = giaiMocCongCu(x.c);
      if (T != null) henLuc(T, x.fn, x.lead); else con.push(x);
    }
    w.ccViec = con;
  }

  // ------------------------------------------------------------------ canh
  function taoC(w, cu, giu, rectGiu) {
    const doGiu = new Map();
    (giu || []).forEach((e, i) => { if (rectGiu && rectGiu[i]) doGiu.set(e, rectGiu[i]); });
    return {
      beat: w.beat, ctx: w.ctx,
      canhTruoc: cu ? cu.canh : null,
      giuLai: giu && giu.length ? giu : null,
      giam: S.giam, kho: S.kho,
      se: se(), hu,
      // canh dung san (khoang nghi): hen gio luc dung duoc giu lai toi khi canh len san khau
      hen: (fn, ms) => { if (w.chuaNhan) { (w.henCho || (w.henCho = [])).push([fn, ms]); return null; } return henThe(fn, ms); },
      donVi, r: () => S.r,
      // v2 (bo sung B.3/B.5): meo KHONG chi tay vao san khau — duong laser cua meo cat ngang the (va day phim
      // tren dien thoai) la tieu diem chuyen dong thu hai. Con tro doc la vet duy nhat -> khong lam gi.
      // (D cung da bo chi tay cua focusItem luc dang giang.) SenseiAvatar khong co "nhin" khong laser.
      chiVao: () => false,
      ghiChu: (text, kieu) => ghiChu(text, kieu),
      idSt: (id) => 'st-' + id,
      // them (ngoai spec, co kiem tra truoc khi dung): dong ho dao dien, rect cua phan tu giu lai, tien ich khoa
      dongHo, rectGiu: rectGiu || null, rectCu: (el) => doGiu.get(el) || null,
      vn3, dan: DAN, chuanVN, chuanJP,
      theV2: true,   // v2: canh nam trong .sk-the (dao dien dung khung the, dong dau, day phim, chan the)
    };
  }
  function dungCanh(beat, ctx, cu, giu, rectGiu, truoc) {
    const w = {
      so: ++S.soCanh, the: S.the, beat, ctx: ctx || {}, kind: beat.kind || 'khac',
      turns: [], luot: null, R: '', rT: [], rO: [], jv: '', jvM: [], vv: '', vvM: [],
      Tfirst: null, daXong: false, daNen: false, vaoT: null, kieuVao: 'len', canh: null, cues: [], byId: Object.create(null),
      chuaNhan: !!truoc, henCho: null,
    };
    const c = taoC(w, cu, giu, rectGiu);
    let canh = null;
    const bd = S.builders[w.kind];
    if (bd && typeof bd.dung === 'function') {
      try { canh = bd.dung(beat, c); } catch (e) { canhBao('dung canh ' + w.kind, e); canh = null; }
    }
    if (!canh || !canh.el) canh = canhChung(beat, c);
    canh.el.classList.add('sk-canh');
    if (!canh.el.classList.contains('sk-canh-' + w.kind)) canh.el.classList.add('sk-canh-' + w.kind);
    w.canh = canh;
    w.kieuVao = canh.kieuVao || 'len';
    w.cues = (Array.isArray(canh.cues) ? canh.cues : []).filter(Boolean).map((q, i) => taoCue(q, i));
    w.cues.forEach((st) => { if (!(st.id in w.byId)) w.byId[st.id] = st; });
    return w;
  }
  const LOAI_TU = {
    noun: 'Danh từ', verb: 'Động từ', 'adj-i': 'Tính từ -i', 'adj-na': 'Tính từ -na',
    particle: 'Trợ từ', adnominal: 'Đại từ chỉ định', counter: 'Lượng từ đếm',
    phrase: 'Thành ngữ / Câu', adjective: 'Tính từ', adverb: 'Phó từ', pronoun: 'Đại từ',
    expression: 'Cụm từ / Mẫu câu', determiner: 'Từ chỉ định',
  };
  /**
   * Canh chung (chua co builder B / C, hoac builder loi): toan bo noi dung hien ngay, khong cue.
   * Bo cuc v2: >= 1000px hai cot (hinh / chu lon trai 40%, chu phai 60%), duoi mot cot.
   */
  function canhChung(beat, c) {
    const S_ = c.se;
    const e = (s) => (S_ && typeof S_.escapeHtml === 'function' ? S_.escapeHtml(s) : esc(s));
    const cx = (m) => { try { return S_ && typeof S_.camXucAttr === 'function' ? S_.camXucAttr(m) : ''; } catch (x) { return ''; } };
    const j = (s) => `<span lang="ja">${e(s)}</span>`;
    const d = beat.data || {};
    const kind = beat.kind || 'khac';
    const idHero = beat.targetId ? ` id="st-${e(beat.targetId)}"` : '';
    const cau = (tokens) => {
      const ds = (tokens || []).map((t) => Object.assign({}, t, { id: t && t.id ? 'st-' + t.id : '' }));
      if (S_ && typeof S_.ghepTokenCau === 'function') {
        try {
          return S_.ghepTokenCau(ds, (tok, i, all) => {
            const rt = typeof S_.rtCua === 'function' ? S_.rtCua(tok) : '';
            const inner = rt && typeof S_.rubyCau === 'function' ? S_.rubyCau(tok, rt, i, all) : e(tok.text || tok.kanji || '');
            return `<span${tok.id ? ` id="${e(tok.id)}"` : ''} class="sk-c-tok${tok.isKeyGrammar ? ' is-key' : ''}">${inner}</span>`;
          });
        } catch (x) {}
      }
      return ds.map((t) => `<span${t.id ? ` id="${e(t.id)}"` : ''} class="sk-c-tok">${e(t.kanji || t.text || '')}</span>`).join('');
    };
    let trai = '', phai = '', mot = '', thuoc = '', sr = beat.label || '';
    if (kind === 'vocab') {
      const chu = d.kanji || d.word || '';
      const rt = d.kanji && d.furigana && d.furigana !== d.kanji ? d.furigana : '';
      trai = `<div class="sk-c-dau jp-serif" lang="ja">${rt ? `<ruby>${e(chu)}<rt>${e(rt)}</rt></ruby>` : e(chu)}</div>`;
      const meta = [d.romaji, LOAI_TU[d.wordType] || d.wordType].filter(Boolean).join(' · ');
      phai = (meta ? `<p class="sk-c-phu">${e(meta)}</p>` : '')
        + (d.meaningVi ? `<p class="sk-c-nghia">${e(d.meaningVi)}</p>` : '')
        + (d.accentNote ? `<p class="sk-c-meo deck-note">${e(d.accentNote)}</p>` : '');
      thuoc = cx(d);
      sr = `${beat.label || 'Từ vựng'}: ${chu} — ${d.meaningVi || ''}`;
    } else if (kind === 'kanji' && window.SenseiCapDo && window.SenseiCapDo.laChuKana(d)) {
      // Canh chung cho chu cai kana (builder chu loi): romaji + cach doc + meo nho, khong Han Viet / On / Kun
      trai = `<div class="sk-c-o jp-serif" lang="ja">${e(d.character || '')}</div>`;
      const tu = (Array.isArray(d.commonWords) ? d.commonWords : []).slice(0, 3);
      phai = `<p class="sk-c-hv">${e(d.romaji || '')}${d.strokeCount ? `<span class="sk-c-phu-nho"> · ${e(d.strokeCount)} nét</span>` : ''}</p>`
        + (d.meaningVi ? `<p class="sk-c-nghia">${e(d.meaningVi)}</p>` : '')
        + (d.meoNho ? `<p class="sk-c-meo deck-note">${e(d.meoNho)}</p>` : '')
        + (tu.length ? `<ul class="sk-c-ghep">${tu.map((w) => `<li>${j(w.word || '')}${w.meaningVi ? `<span>${e(w.meaningVi)}</span>` : ''}</li>`).join('')}</ul>` : '');
      sr = `${beat.label || 'Chữ cái'}: ${d.character || ''} — ${d.romaji || ''}`;
    } else if (kind === 'kanji') {
      trai = `<div class="sk-c-o jp-serif" lang="ja">${e(d.character || '')}</div>`;
      const doc = (x) => (Array.isArray(x) ? x : x ? [x] : []).filter(Boolean).join('、');
      const on = doc(d.onyomi), kun = doc(d.kunyomi);
      const tu = (Array.isArray(d.commonWords) ? d.commonWords : []).slice(0, 3);
      phai = `<p class="sk-c-hv">${e(d.hanViet || '')}${d.strokeCount ? `<span class="sk-c-phu-nho"> · ${e(d.strokeCount)} nét</span>` : ''}</p>`
        + (d.meaningVi ? `<p class="sk-c-nghia">${e(d.meaningVi)}</p>` : '')
        + (on || kun ? `<dl class="sk-c-am">${on ? `<div><dt>On</dt><dd lang="ja">${e(on)}</dd></div>` : ''}${kun ? `<div><dt>Kun</dt><dd lang="ja">${e(kun)}</dd></div>` : ''}</dl>` : '')
        + (tu.length ? `<ul class="sk-c-ghep">${tu.map((w) => `<li>${j(w.word || '')}${w.furigana ? `<span class="sk-c-phu-nho" lang="ja">${e(w.furigana)}</span>` : ''}${w.meaningVi ? `<span>${e(w.meaningVi)}</span>` : ''}</li>`).join('')}</ul>` : '');
      sr = `${beat.label || 'Chữ Hán'}: ${d.character || ''} — ${d.hanViet || ''}`;
    } else if (kind === 'grammar-intro') {
      const cs = String(d.explanation || '').split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 3);
      mot = `<p class="sk-c-tieu">${e(d.title || '')}</p>`
        + (d.grammarFormula ? `<p class="sk-c-cong-thuc" lang="ja">${e(d.grammarFormula)}</p>` : '')
        + (cs.length ? `<div class="sk-c-giai">${cs.map((x) => `<p>${e(x)}</p>`).join('')}</div>` : '')
        + (d.teacherTips ? `<p class="sk-c-meo deck-note">${e(d.teacherTips)}</p>` : '');
      sr = `Mẫu câu: ${d.title || ''}`;
    } else if (kind === 'example' || kind === 'kaiwa') {
      mot = (kind === 'kaiwa' && d.speaker ? `<p class="sk-c-phu" lang="ja">${e(d.speaker)}</p>` : '')
        + `<div class="sk-c-cau jp-sentence" lang="ja">${cau(d.tokens)}</div>`
        + (d.meaningVi ? `<p class="sk-c-nghia sk-c-dich">${e(d.meaningVi)}</p>` : '');
      thuoc = cx(d);
      sr = `${beat.label || ''}: ${(d.tokens || []).map((t) => t.kanji || t.text || '').join('')} — ${d.meaningVi || ''}`;
    } else if (kind === 'kaiwa-intro' || kind === 'kaiwa-run') {
      const ds = Array.isArray(beat.data) ? beat.data : [];
      const nguoi = [...new Set(ds.map((x) => x && x.speaker).filter(Boolean))];
      mot = `<p class="sk-c-tieu">${kind === 'kaiwa-run' ? 'Nghe trọn đoạn hội thoại' : 'Bối cảnh & nhân vật'}</p>`
        + (nguoi.length ? `<ul class="sk-c-vai">${nguoi.map((n) => `<li><span class="sk-c-vai-chu" aria-hidden="true">${e(chuDau(n))}</span><span lang="ja">${e(n)}</span></li>`).join('')}</ul>` : '')
        + `<p class="sk-c-phu">${ds.length} lượt thoại</p>`;
    } else if (kind === 'quiz') {
      const L = (k) => String.fromCharCode(65 + k);
      const opts = Array.isArray(d.options) ? d.options : [];
      const dai = opts.reduce((m, x) => Math.max(m, Array.from(String(x || '')).length), 0);
      mot = `<p class="sk-c-hoi">${e(String(d.question || '').replace(/^\[(Dễ|Vừa|Khó)\]\s*/, ''))}</p>`
        + `<div class="sk-c-dap${c.kho !== 'hep' && dai <= 28 ? ' is-hai' : ''}">${opts.map((o, k) =>
          `<div class="sk-c-dap-o"><span class="sk-c-phim" aria-hidden="true">${L(k)}</span><span>${e(o)}</span></div>`).join('')}</div>`;
      sr = `${beat.label || 'Bài tập'}: ${d.question || ''}`;
    } else {
      mot = `<p class="sk-c-tieu">${e(beat.label || '')}</p>`;
    }
    const el = document.createElement('div');
    el.className = `sk-canh sk-canh-chung sk-canh-${kind}`;
    el.innerHTML = trai
      ? `<div class="sk-c-giua is-2cot sk-c-hero"${idHero}${thuoc}><div class="sk-c-trai">${trai}</div><div class="sk-c-phai">${phai}</div></div>`
      : `<div class="sk-c-giua sk-c-hero${kind === 'quiz' ? ' sk-bt-khoi' : ''}"${idHero}${thuoc}>${mot}</div>`;
    return { el, cues: [], sr, heroEl: el.querySelector('.sk-c-hero') };
  }
  /**
   * Chieu cao noi dung THAT cua canh: hop cac dong chu + hinh (khong tinh hop cha keo gian het khung), chi
   * phan nam trong goc canh (bong thoai da truot khuat khong tinh). Dong "Sensei ghi" chua co chu, chip,
   * lop bay: bo qua.
   */
  function caoNoiDung(el) {
    const re = el.getBoundingClientRect();
    let t = Infinity, b = -Infinity;
    const them = (r) => {
      if (!r || r.width < 1 || r.height < 1 || r.bottom < re.top + 1 || r.top > re.bottom - 1) return;
      t = Math.min(t, r.top); b = Math.max(b, r.bottom);
    };
    const bo = '.sk-lop-bay, .sk-chip, .sk-sr, .sk-chu-ghi[data-co="0"], .sk-the-chan, [data-sk-tro]';
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const rg = document.createRange();
    let n, dem = 0;
    while ((n = tw.nextNode()) && dem < 400) {
      if (!n.textContent.trim()) continue;
      const p = n.parentElement;
      if (!p || p.closest(bo)) continue;
      dem++;
      rg.selectNodeContents(n);
      them(rg.getBoundingClientRect());
    }
    el.querySelectorAll('img, svg').forEach((x) => { if (!x.closest(bo) && !(x.parentElement && x.parentElement.closest('svg'))) them(x.getBoundingClientRect()); });
    return isFinite(t) ? b - t : 0;
  }
  /**
   * Nhip thua chu (duyet r2 "the lon ma trong"): mot cau thoai, nghe tron doan, cau vi du khong co hang cong
   * thuc -> { tran: co lon nhat, he: noi dung se cao them bao nhieu lan trong nhip } ; null = khong phong
   */
  function coThePhong(w, el) {
    if (w.kind === 'kaiwa') return { tran: CO_MAX, he: 1 };
    if (w.kind === 'kaiwa-run') return { tran: 1.2, he: 1.6 };   // luc dung moi co dong dau; sau do them dong truoc
    if (w.kind === 'example' && !el.querySelector('.sk-vd-mau, .sk-np-hang')) return { tran: CO_MAX, he: 1 };
    return null;
  }
  /** Khung .sk-cong (bai tap): bo neo (tro lai can giua cua CSS) */
  function thaNeoCong(c) { if (c.style.paddingTop) c.style.paddingTop = ''; if (c.style.justifyContent) c.style.justifyContent = ''; }
  /**
   * Neo khung .sk-cong (duyet r2): KHONG can giua dong — tinh do lech can giua MOT lan roi dong bang
   * (flex-start + padding-top), chua san ~30% chieu cao cho khung nhan xet sau khi cham -> cau hoi va dap an
   * khong bao gio nhay luc nhan xet mo ra. The da cham: giu nguyen (canh C tu neo tiep).
   */
  function neoCong(c) {
    const card = c && c.querySelector(':scope > .qz-card');
    if (!card || card.classList.contains('sk-da-cham') || card.querySelector('.opt-locked')) return;
    thaNeoCong(c);
    const H = c.clientHeight, h0 = card.offsetHeight;
    if (!H || !h0) return;
    const du = Math.max(0, H - h0);
    const R = Math.min(du, Math.round(H * 0.3));
    c.style.justifyContent = 'flex-start';
    c.style.paddingTop = Math.round((du - R) / 2) + 'px';
  }
  /**
   * Vua khung (§1.7.4, duyet r2): tran -> tim nhi phan --sk-co lon nhat trong [.72, 1] ma vua; van tran o .72
   * moi an .sk-phu-bo (roi tim lai). Nhip thua chu (coThePhong): chu to len toi da 1.3 lan cho toi khi noi
   * dung cao ~62% than the (buoc 0.1). Khong hieu ung.
   */
  function vuaKhung(w) {
    const el = w && w.canh && w.canh.el, than = w && w.than;
    if (!el || !than || !el.isConnected) return;
    const v0 = performance.now();
    const H = than.clientHeight, W = than.clientWidth;
    if (!H || !W) return;
    let soDo = 0;
    // khung cuon ben trong canh (ban mau cong bai tap .sk-cong, ke ca dong goi y ngay duoi): tran trong khung
    // cung la tran — khong de the bai tap cuon / hien thanh cuon
    const cuon = [...el.querySelectorAll('.sk-cong')];
    cuon.forEach(thaNeoCong);
    el.classList.remove('is-gon-2');
    const dat = (x) => { if (Math.abs(x - 1) < 0.001) el.style.removeProperty('--sk-co'); else el.style.setProperty('--sk-co', x.toFixed(3)); };
    const tran = () => { soDo++; return el.scrollHeight > H + 1 || el.scrollWidth > W + 1
      || cuon.some((c) => c.clientHeight > 0 && c.scrollHeight > c.clientHeight + 1); };
    // Tim co lon nhat vua khung: uoc tu ti le tran (noi dung ~ ti le voi co), roi noi suy day cung 1-2 lan
    // (2-4 lan do bo cuc thay vi 7 — moi lan ~8 ms o nhip dau / dien thoai). null: o lo van tran.
    const cao = () => Math.max(el.scrollHeight - H, ...cuon.map((c) => c.scrollHeight - c.clientHeight), 0);
    const tim = (lo, hi, dh) => {
      let m = Math.floor(hi * H / (H + dh) * 100) / 100;
      for (let k = 0; k < 4; k++) {
        m = clamp(m, lo, hi - 0.01);
        dat(m);
        if (!tran()) {
          // uoc thuong hoi nho (le / khoang cach co dinh khong co lai): thu them mot lan o giua m va hi
          const g = Math.floor((m + hi) / 2 * 100) / 100;
          if (g - m >= 0.02) { dat(g); if (!tran()) return g; dat(m); }
          return m;
        }
        if (m <= lo + 0.001) return null;
        const dm = cao();
        const m2 = dh > dm + 0.5 ? m - (hi - m) * dm / (dh - dm) : m * H / (H + dm);
        hi = m; dh = dm;
        m = Math.floor(Math.min(m2, m - 0.01) * 100) / 100;
      }
      dat(lo);
      return tran() ? null : lo;
    };
    let co = 1;
    dat(1);
    if (tran()) {
      co = tim(CO_MIN, 1, cao());
      if (co == null) {
        // van tran o .72: moi an phan phu bo roi tim lai
        el.classList.add('is-gon-2');
        dat(1);
        co = tran() ? tim(CO_MIN, 1, cao()) : 1;
        if (co == null) co = CO_MIN;
      }
    } else {
      const ph = coThePhong(w, el);
      const h1 = ph ? caoNoiDung(el) * ph.he : 0, muc = LAP_DAY * H;
      if (h1 > 0 && h1 < muc) {
        for (let x = Math.floor(Math.min(ph.tran, muc / h1) * 10) / 10; x > 1.04; x = +(x - 0.1).toFixed(2)) {
          dat(x);
          if (!tran() && caoNoiDung(el) * ph.he <= 0.78 * H) { co = x; break; }
        }
      }
    }
    dat(co);
    w.co = co;
    cuon.forEach(neoCong);
    dongBoCong(w);
    w.msVua = +(performance.now() - v0).toFixed(2); w.soDo = soDo;
    // phong chu chua tai xong luc do: do lai mot lan khi tai xong
    try {
      if (!w.choFont && document.fonts && document.fonts.status === 'loading') {
        w.choFont = true;
        document.fonts.ready.then(() => { if (w.canh && w.canh.el && w.canh.el.isConnected && !w.daBo) { vuaKhung(w); datLaiConTro(w.the); } });
      }
    } catch (e) {}
  }
  /**
   * Noi dung lon len sau luc vua khung (vach xuong thanh chu, khung nhan xet...) ma tran than the: vua lai
   * (chi khi tran — khong doi co chu giua nhip neu khong can). Ban mau bai tap doi co: neo lai.
   */
  function theoDoiTran(w) {
    const el = w && w.canh && w.canh.el;
    if (!el || w.roTran || !window.ResizeObserver) return;
    let hen = null;
    try {
      w.roTran = new ResizeObserver(() => {
        clearTimeout(hen);
        hen = setTimeout(() => {
          try {
            if (w.daBo || !el.isConnected || !w.than) return;
            if (S.che === 'giang' || S.che === 'chuyen') el.querySelectorAll('.sk-cong').forEach(neoCong);
            const H = w.than.clientHeight;
            if (H && (el.scrollHeight > H + 1)) { vuaKhung(w); datLaiConTro(w.the); }
          } catch (e) { canhBao('theoDoiTran', e); }
        }, 60);
      });
      [...el.children].forEach((x) => w.roTran.observe(x, { box: 'border-box' }));
      el.querySelectorAll('.sk-cong > .qz-card').forEach((x) => w.roTran.observe(x, { box: 'border-box' }));
    } catch (e) { w.roTran = null; }
  }
  function boTheoDoi(w) { if (w && w.roTran) { try { w.roTran.disconnect(); } catch (e) {} w.roTran = null; } }
  /** Cong the that dung cung --sk-co + cung vi tri neo voi ban mau cua canh: trao tay khong nhay */
  function dongBoCong(w) {
    const cg = S.cong;
    if (!cg || !cg.vo || !w || !w.canh || !w.canh.el || cg.vo.parentNode !== w.than) return;
    const co = w.canh.el.style.getPropertyValue('--sk-co');
    if (co) cg.vo.style.setProperty('--sk-co', co); else cg.vo.style.removeProperty('--sk-co');
    if (cg.card.classList.contains('sk-da-cham') || cg.card.querySelector('.opt-locked')) return;
    const bm = w.canh.el.querySelector('.sk-cong');
    if (bm && bm.style.paddingTop) { cg.vo.style.justifyContent = 'flex-start'; cg.vo.style.paddingTop = bm.style.paddingTop; }
    else neoCong(cg.vo);
  }
  /**
   * Cuon trong cong (canh C cuon toi khung nhan xet khi tran): cuon ngay roi the truot FLIP 240 ms ease-out
   * tu cho cu — mot chuyen dong muot, khong co khung hinh nhay.
   */
  function cuonMuot(vo, card) {
    const lam = (top, o) => {
      const s0 = vo.scrollTop;
      Element.prototype.scrollTo.call(vo, { top: Math.max(0, top), left: vo.scrollLeft, behavior: 'instant' });
      const d = vo.scrollTop - s0;
      if (!S.giam && Math.abs(d) > 1 && !(o && o.behavior === 'auto') && card.parentNode === vo) {
        chay(card, [{ translate: `0 ${d.toFixed(1)}px`, offset: 0 }], { duration: 240, easing: E.out });
      }
    };
    vo.scrollTo = function (a, b) {
      const top = a && typeof a === 'object' ? a.top : b;
      if (top == null || !isFinite(top)) return Element.prototype.scrollTo.apply(vo, arguments);
      lam(Number(top), a && typeof a === 'object' ? a : null);
    };
    vo.scrollBy = function (a, b) {
      const dy = a && typeof a === 'object' ? a.top : b;
      if (dy == null || !isFinite(dy)) return Element.prototype.scrollBy.apply(vo, arguments);
      lam(vo.scrollTop + Number(dy), a && typeof a === 'object' ? a : null);
    };
  }
  function ghiRa(w) {
    const g = S.canhLog.find((x) => x.so === w.so);
    if (g && g.raPerf == null) g.raPerf = performance.now();
  }
  /** Go canh (va ca the cua no) sau ms; huy() cua canh chay luc go */
  function boCanh(w, ms) {
    if (!w || w.daBo) return;
    w.daBo = true;
    ghiRa(w);
    S.dangRa.add(w);
    boTheoDoi(w);
    const go = () => {
      S.dangRa.delete(w);
      try { (w.the || w.canh.el).remove(); } catch (e) {}
      try { if (typeof w.canh.huy === 'function') w.canh.huy(); } catch (e) { canhBao('huy', e); }
    };
    if (!ms) go(); else { w.henBo = henDon(go, ms); w.go = go; }
  }
  function goHetCanh() {
    boTruoc();
    S.dangRa.forEach((w) => { clearTimeout(w.henBo); if (w.go) w.go(); });
    S.dangRa.clear();
    if (S.canh) { const w = S.canh; S.canh = null; w.daBo = false; boCanh(w, 0); }
    // chi go cac the (mat the tinh .sk-mat o lai)
    if (dom.oThe) dom.oThe.querySelectorAll(':scope > :not(.sk-mat)').forEach((x) => x.remove());
    S.theChuong = null; S.theXong = null;
  }

  // ---- the chuong (§3.9) / the ket bai (§3.10) — bo sung B.6: lat noi dung trong CUNG khung the
  function demChuong(ds, chuong) {
    const dem = (k) => ds.filter((b) => b && b.kind === k).length;
    if (chuong === 'vocab') return dem('vocab') ? `${dem('vocab')} từ` : '';
    if (chuong === 'kanji') return dem('kanji') ? `${dem('kanji')} chữ` : '';
    if (chuong === 'grammar') return dem('grammar-intro') ? `${dem('grammar-intro')} mẫu câu · ${dem('example')} ví dụ` : '';
    if (chuong === 'kaiwa') return dem('kaiwa') ? `${dem('kaiwa')} câu thoại` : '';
    if (chuong === 'quiz') return dem('quiz') ? `${dem('quiz')} câu hỏi` : '';
    return '';
  }
  /** Net bang (draw_on_board, tu khoanh) khong bao gio song qua canh cua no */
  function xoaNetBang() {
    try { if (window.SenseiBoard && typeof SenseiBoard.xoaHetGhiChu === 'function') SenseiBoard.xoaHetGhiChu(); } catch (e) {}
  }
  /**
   * Lat the: noi dung dang co (canh, cong, ban sao) mo di 160 ms ROI lop moi hien 200 ms trong cung the (noi
   * tiep: khong khung hinh nao in de hai lop chu). doiDau: doi dong dau + day phim CUNG khung hinh lop moi
   * bat dau hien (khong bao truoc noi dung).
   */
  function latThe(w, lop, html, doiDau) {
    if (!w || !w.the || !w.than) return null;
    xaHangHien();
    anConTro(w.the);
    xoaNetBang();
    const ra = S.giam ? 0 : LAT_RA;
    [...w.than.children].forEach((x) => {
      boId(x, true);
      if (x.classList.contains('sk-ra')) return;
      x.classList.add('sk-ra');
      if (ra) chay(x, [{ opacity: 1 }, { opacity: 0 }], { duration: ra, easing: E.in });
    });
    datChan(w, '', '');
    datNut(w, []);
    w.the.querySelectorAll(':scope > .sk-the-kj').forEach((x) => x.remove());
    const el = document.createElement('div');
    el.className = 'sk-canh sk-the-lat ' + lop;
    el.innerHTML = html;
    w.than.appendChild(el);
    w.the.dataset.lat = lop;
    chay(el, [{ opacity: 0, offset: 0 }], { duration: S.giam ? 120 : LAT_VAO, delay: ra, easing: S.giam ? 'linear' : E.out });
    if (typeof doiDau === 'function') { if (ra) henThe(doiDau, ra); else doiDau(); }
    return el;
  }
  const SO_MUC_THE = { rong: 16, hep: 9, thap: 10 };
  /** Cac muc cua chuong moi tren the chuong (noi dung cua day phim, phong to) — de the chuong khong trong */
  function mucTheChuong(ch, ds) {
    const toi = SO_MUC_THE[S.kho] || 12;
    const loc = (k) => ds.filter((b) => b && b.kind === k);
    let lop = '', li = [];
    if (ch === 'vocab') {
      lop = 'is-tu';
      li = loc('vocab').map((b) => `<li lang="ja">${esc(ngan((b.data && (b.data.kanji || b.data.word)) || '', 10))}</li>`);
    } else if (ch === 'kanji') {
      lop = 'is-chu';
      li = loc('kanji').map((b) => `<li class="jp-serif" lang="ja">${esc((b.data && b.data.character) || '')}</li>`);
    } else if (ch === 'grammar') {
      lop = 'is-mau';
      li = loc('grammar-intro').map((b, i) => { const t = tenNganMau(b.data); return `<li><span class="sk-tc-so">${i + 1}</span><span${coJP(t) ? ' lang="ja"' : ''}>${esc(t)}</span></li>`; });
    } else if (ch === 'kaiwa') {
      lop = 'is-vai';
      const nguoi = [...new Set(loc('kaiwa').map((b) => b.data && String(b.data.speaker || '').trim()).filter(Boolean))];
      li = nguoi.map((n) => `<li><span class="sk-tc-vai-chu" aria-hidden="true">${esc(chuDau(n))}</span><span${coJP(n) ? ' lang="ja"' : ''}>${esc(n)}</span></li>`);
    } else if (ch === 'quiz') {
      lop = 'is-so';
      li = loc('quiz').map((b, i) => `<li>${i + 1}</li>`);
    }
    if (!li.length) return '';
    if (li.length > toi) li = li.slice(0, toi - 1).concat(`<li class="is-them">+${li.length - toi + 1}</li>`);
    return `<ul class="sk-tc-muc ${lop}" aria-hidden="true">${li.join('')}</ul>`;
  }
  function hienTheChuong(o, w) {
    const capDo = w.ctx && w.ctx.capDo;
    const tenCu = (w.ctx && w.ctx.chuong && w.ctx.chuong.ten) || tenChuong(w.beat.chapter, capDo) || '';
    const tenMoi = tenChuong(o.tiep.chapter, capDo) || o.tiep.chapter || '';
    const ds = Array.isArray(o.cacNhipChuongTiep) && o.cacNhipChuongTiep.length ? o.cacNhipChuongTiep : cacNhipChuong(w.ctx, o.tiep.chapter);
    const meta = demChuong(ds, o.tiep.chapter);
    // Dong dau + day phim sang chuong moi CUNG luc noi dung the chuong hien (chua co muc hien tai)
    const doiDau = () => {
      napChuong(o.tiep.chapter, ds, true);
      S.phim.cur = -1; S.phim.vd = -1;
      dom.nhan.textContent = tenMoi;
      veDoan();
      datPhim(false);
    };
    S.theChuong = latThe(w, 'sk-the-chuong', `<div class="sk-tc-khoi">
        ${tenCu ? `<p class="sk-tc-xong">Xong ${esc(tenCu)} ✓</p>` : ''}
        <h2 class="sk-tc-ten">${esc(tenMoi)}</h2>
        ${meta ? `<p class="sk-tc-meta">${esc(meta)}</p>` : ''}
        <i class="sk-tc-vach" aria-hidden="true"></i>
        ${mucTheChuong(o.tiep.chapter, ds)}
      </div>`, doiDau);
    dom.sr.textContent = `Xong ${tenCu}. Tiếp theo: ${tenMoi}${meta ? ', ' + meta : ''}`;
  }
  /** Hang tong ket moi chuong: [nhan, so (html), mau muc (chu), jp?, cham dung / sai] */
  function hangTongKet(w, tk, quiz) {
    const ds = (w.ctx && w.ctx.cacNhip) || [];
    const theo = (k) => ds.filter((b) => b && b.kind === k);
    const mau = (arr, n, cach) => { const a = arr.filter(Boolean); return a.slice(0, n).join(cach) + (a.length > n ? ' …' : ''); };
    const so = (n, don) => `<b>${esc(String(n))}</b> ${esc(don)}`;
    const hang = [];
    const tu = theo('vocab');
    if (tk.tu || tu.length) hang.push(['Từ vựng', so(tk.tu || tu.length, 'từ'), mau(tu.map((b) => b.data && (b.data.kanji || b.data.word)), 6, ' · '), true]);
    const chu = theo('kanji');
    if (tk.chu || chu.length) hang.push([tenChuong('kanji', w.ctx && w.ctx.capDo), so(tk.chu || chu.length, 'chữ'), mau(chu.map((b) => b.data && b.data.character), 10, ' '), true]);
    const gi = theo('grammar-intro');
    if (tk.mau || gi.length) hang.push(['Ngữ pháp', so(tk.mau || gi.length, 'mẫu câu'), gi.map((b) => tenMau(b.data)).filter(Boolean).join(' · '), true]);
    const th = theo('kaiwa');
    if (tk.thoai || th.length) hang.push(['Hội thoại', so(tk.thoai || th.length, 'câu thoại'), mau([...new Set(th.map((b) => b.data && String(b.data.speaker || '').trim()))], 3, ' · '), true]);
    if (tk.bt || quiz.length) {
      let dung = 0;
      const cham = quiz.map((b) => { const k = trangThaiThe(b.data.id); if (k === true) dung++; return k === true ? 'is-dung' : k === false ? 'is-sai' : ''; });
      hang.push(['Bài tập', `<b>${dung}/${esc(String(tk.bt || quiz.length))}</b> đúng`, '', false, cham]);
    }
    return hang;
  }
  function hienTheXong(o, w) {
    const tk = (o && o.tongKet) || {};
    const bai = (w.ctx && w.ctx.bai && (w.ctx.bai.lessonNumber || w.ctx.bai.lesson)) || (se() && se().currentLesson) || '';
    const quiz = ((w.ctx && w.ctx.cacNhip) || []).filter((b) => b && b.kind === 'quiz' && b.data && b.data.id);
    const hang = hangTongKet(w, tk, quiz);
    const oBaiTap = w.beat && w.beat.chapter === 'quiz';
    const htmlHang = ([nhan, soH, m, jp, cham]) => `<li class="sk-tx-hang"><span class="sk-tx-nhan">${esc(nhan)}</span><span class="sk-tx-so">${soH}</span>`
      + (cham ? `<span class="sk-tx-cham" aria-hidden="true">${cham.map((k) => `<i${k ? ` class="${k}"` : ''}></i>`).join('')}</span>`
        : `<span class="sk-tx-mau"${jp && coJP(m) ? ' lang="ja"' : ''}>${esc(m)}</span>`) + '</li>';
    const doiDau = () => {
      S.phim.cur = S.phim.muc.length;
      S.phim.vd = -1;
      dom.nhan.textContent = 'Tổng kết';
      veDoan();
      datPhim(false);
    };
    S.theXong = latThe(w, 'sk-the-xong', `<div class="sk-tx-khoi">
        <h2 class="sk-tx-ten">Xong bài ${esc(bai)}</h2>
        ${hang.length ? `<ul class="sk-tx-ds">${hang.map(htmlHang).join('')}</ul>` : ''}
        <p class="sk-tx-tiep">${oBaiTap ? 'Luyện tiếp: Phát âm · Viết tay — ngay bên dưới' : 'Luyện tiếp ở chương Bài tập: Phát âm · Viết tay'}</p>
      </div>`, doiDau);
    const chuSo = (h) => h.replace(/<[^>]+>/g, '');
    dom.sr.textContent = `Xong bài ${bai}. ${hang.map((x) => `${x[0]}: ${chuSo(x[1])}`).join(', ')}.`;
  }

  // ------------------------------------------------------------------ chuyen canh (§1.9 + bo sung B.1)
  /** Cung slide (mau cau -> vi du dau, vi du -> vi du): canh truoc trao hang cong thuc (giu) cho canh nay */
  const laCungSlide = (cu, w) => !!(cu && w && w.giuLai && w.giuLai.length && cu.canh && cu.canh._chu && w.canh && w.canh._chu
    && w.kind === 'example' && cu.beat && w.beat && cu.beat.subIndex === w.beat.subIndex && w.giuLai[0].isConnected);
  /**
   * Cung slide (duyet r2): the dung yen. Khoi cau / giai thich cua canh cu lui (-24px + mo); hang cong thuc o
   * nguyen cho. The moi (co nen, nam tren) hoa tan tai cho len the cu: hang cong thuc cua hai canh o cung
   * cho nen khong roi di / quay lai — chi phan dien trong o mo di, cau moi hien len. Nhip moi van chi co
   * MOT hieu ung cap the (bo sung A3). Tra ve ms toi luc the moi bat dau hien.
   */
  function chuyenCungSlide(cu, w) {
    const t = w.the, tc = cu.the;
    const giu = w.giuLai[0];
    const L = giu.closest ? giu.closest('.sk-np-luoi, .sk-vd-luoi') : null;
    // (khong doc bo cuc o day: dang trong tac vu batDauNhip — ep tinh kieu + bo cuc ca the)
    const khoi = L ? [...L.children].filter((x) => !x.contains(giu) && !x.hidden) : [];
    if (khoi.length && khoi.length <= 2) {
      khoi.forEach((x) => {
        x.classList.add('sk-ra');
        chay(x, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '-24px 0' }], { duration: CUNG_RA, easing: E.in });
      });
    } else {
      // bo cuc la: ca the cu mo di (van khong truot)
      tc.classList.add('sk-ra');
      chay(tc, [{ opacity: 1 }, { opacity: 0 }], { duration: CUNG_RA, easing: E.in });
    }
    // con tro doc cua canh cu (vd dang o dong nghia) mo cung
    // (mot khung hinh khoa: mo tu do mo hien tai cua no toi 0 va giu — the cu bi go ngay sau do)
    tc.querySelectorAll('.sk-chu-tro.is-hien, .sk-con-tro.is-hien').forEach((x) => {
      chay(x, [{ opacity: 0 }], { duration: CUNG_RA, easing: E.in, fill: 'forwards' }, 'contro');
    });
    tc.style.pointerEvents = 'none';
    const tre = THE_CHONG;
    t.classList.add('is-phu');
    t.__den = performance.now() + tre + CUNG_VAO;
    chay(t, [{ opacity: 0, offset: 0 }], { duration: CUNG_VAO, delay: tre, easing: E.out });
    const het = tre + CUNG_VAO + 40;
    boCanh(cu, het);
    henDon(() => t.classList.remove('is-phu'), het);
    return tre;
  }
  /** Bat dau / giang tiep: luoi (van thay, inert) mo di trong khi san khau hien — cheo mo, khong khung trang */
  function cheoVao() {
    const ms = S.giam ? 120 : VAO_CHEO;
    chay(dom.san, [{ opacity: 0, offset: 0 }], { duration: ms, easing: S.giam ? 'linear' : E.out }, 'cheo');
    const sc = slideContent();
    if (sc && document.body.classList.contains('sk-vao')) {
      // luoi an han dung han chot cua hienSan (T1); may cham -> mo nhanh hon
      const con = Math.max(0, Math.min(ms, (S.cheoDen || 0) - performance.now() - 10));
      if (con < 40) { ketCheo(); return; }
      sc.style.opacity = '0';
      chay(sc, [{ opacity: 1, offset: 0 }], { duration: con, easing: S.giam ? 'linear' : E.in }, 'cheo');
      clearTimeout(S.henCheo);
      S.henCheo = henDon(ketCheo, con);
    } else ketCheo();
  }
  function ketCheo() {
    clearTimeout(S.henCheo);
    S.henCheo = null;
    document.body.classList.remove('sk-vao');
    const sc = slideContent();
    if (sc && sc.style.opacity) sc.style.opacity = '';
  }
  /**
   * MOT chuyen dong cho ca nhip, tren mat the dung yen: noi dung cu -32px + mo (180 ms, ease-in); noi dung
   * moi tu +32px + hien (320 ms, ease-out) bat dau luc cu da mo gan het (170 ms: khong in de chu, mat the
   * khong bao gio tat). Noi dung nhan dien cua nhip da o san trong the khi the dap. Tra ve ms toi luc the moi
   * bat dau hien.
   */
  function chuyenThe(cu, w, o) {
    o = o || {};
    const t = w.the;
    let tre = 0;
    // the cu chua kip vao (con opacity 0 cho tac vu vua khung) thi go luon, khong "ra"
    const coCu = !!(cu && cu.the && cu.the.isConnected && cu.the.style.opacity !== '0');
    if (coCu) xoaNetBang();
    if (coCu && !S.giam && laCungSlide(cu, w)) tre = chuyenCungSlide(cu, w);
    else {
      if (coCu) {
        const tc = cu.the;
        const ra = S.giam ? 120 : THE_RA;
        tc.classList.add('sk-ra');
        chay(tc, S.giam ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '-32px 0' }],
          { duration: ra, easing: S.giam ? 'linear' : E.in });
        tre = S.giam ? 60 : THE_CHONG;
        boCanh(cu, ra + 40);
      } else if (cu) boCanh(cu, 0);
      const ms = S.giam ? 120 : THE_VAO;
      t.__den = performance.now() + tre + ms;
      chay(t, S.giam ? [{ opacity: 0, offset: 0 }] : [{ opacity: 0, translate: '32px 0', offset: 0 }],
        { duration: ms, delay: tre, easing: S.giam ? 'linear' : E.out });
    }
    if (o.sanMoi) cheoVao();
    henDon(veLaiBang, tre + 400);
    return tre;
  }

  // ------------------------------------------------------------------ vong doi bai giang
  function datChe(che) {
    if (S.che !== che) { S.che = che; S.epoch++; }
    if (dom.san) dom.san.dataset.che = che;
  }
  /** Bat san khau (luoi an nhung giu bo cuc, inert). Tra ve true neu san khau vua tu an chuyen sang hien */
  function hienSan() {
    clearTimeout(S.henAn);
    S.henAn = null;
    if (S.anAnim) { try { S.anAnim.cancel(); } catch (e) {} S.anAnim = null; }
    const moi = !!dom.san.hidden;
    if (moi) dom.san.hidden = false;
    if (dom.san.style.opacity) dom.san.style.opacity = '';
    // Luoi dang thay (bat dau / giang tiep): giu no thay (inert) toi luc cheo mo xong (cheoVao) — khong co khung
    // giay trang giua luoi va the. Chan an toan: toi da 260 ms (T1: luoi an han truoc mau 300 ms dau).
    if (moi && !document.body.classList.contains('dang-giang')) {
      document.body.classList.add('sk-vao');
      clearTimeout(S.henCheo);
      S.cheoDen = performance.now() + 260;
      S.henCheo = henDon(ketCheo, 260);
    }
    // chi ghi khi doi: ghi lai cung gia tri van lam mat hieu luc kieu cua ca cay (T8)
    // (giam chuyen dong: luoi khong co transition nao — css/motion.css, T3 — nen an / hien ngay khung sau)
    if (!document.body.classList.contains('dang-giang')) document.body.classList.add('dang-giang');
    const sc = slideContent();
    if (sc && !sc.inert) sc.inert = true;
    return moi;
  }
  const datThuocTinh = (el, k, v) => { if (el && el.dataset[k] !== v) el.dataset[k] = v; };
  /** Do thoi gian batDauNhip (chan doan T8, __motion.doNhip()) */
  function ghiDo(x) { S.doNhip.push(x); if (S.doNhip.length > 200) S.doNhip.splice(0, 50); }

  /**
   * Dung canh + khung the (chua gan vao DOM song): dung chung cho batDauNhip va dung truoc trong khoang nghi.
   * truoc: dung san — hen gio cua builder luc dung duoc giu lai toi khi canh len san khau.
   */
  function dungThe(beat, ctx, cu, truoc) {
    let giu = null, rectGiu = null;
    if (cu && typeof cu.canh.giu === 'function') {
      try { giu = mang(cu.canh.giu(beat)).filter((x) => x && x.nodeType === 1); } catch (e) { canhBao('giu', e); giu = null; }
      if (giu && giu.length) rectGiu = giu.map((x) => x.getBoundingClientRect()); else giu = null;
    }
    const w = dungCanh(beat, ctx, cu, giu, rectGiu, truoc);
    w.giuLai = giu;
    ganThe(w, taoThe(w.kind));
    // Canh tu ve bo cuc the (dau hieu data-sk-the, vd canh chu cua B: le, con tro, dong ghi rieng): khung dao
    // dien khong le, khong con tro (van mot chuyen dong vao / ra, lop bay, the chuong); mat the la .sk-mat tinh
    const cel = w.canh.el;
    if (coMatThe(cel)) w.the.classList.add('tu-ve');
    w.than.appendChild(cel);
    return w;
  }
  /** Id trong the dung san: cat vao data-sk-id (khong trung id, meo / bang khong tim thay) — tra lai luc len */
  function catId(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('[id]').forEach((e) => { e.setAttribute('data-sk-id', e.id); e.removeAttribute('id'); });
  }
  function traId(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('[data-sk-id]').forEach((e) => { if (!e.id) e.id = e.getAttribute('data-sk-id'); e.removeAttribute('data-sk-id'); });
  }
  /** Bo canh dung san (khong dung toi) */
  function boTruoc() {
    const p = S.truoc;
    if (!p) return;
    S.truoc = null;
    clearTimeout(p.hen);
    const w = p.w;
    if (!w) return;
    boTheoDoi(w);
    try { w.the.remove(); } catch (e) {}
    try { if (typeof w.canh.huy === 'function') w.canh.huy(); } catch (e) { canhBao('huy', e); }
  }
  /** ctx cua nhip ke tiep dung tu ctx nhip nay (D dua ctx that luc batDauNhip — so khop truoc khi dung) */
  function ctxTiep(w, tiep) {
    const c0 = w.ctx || {};
    const ds = Array.isArray(c0.cacNhip) ? c0.cacNhip : [];
    const i = ds.indexOf(tiep);
    if (i < 0) return null;
    const cung = ds.filter((b) => b && b.chapter === tiep.chapter);
    const ten = tiep.chapter === w.beat.chapter && c0.chuong ? c0.chuong.ten : (tenChuong(tiep.chapter, c0.capDo) || '');
    return { i, n: c0.n != null ? c0.n : ds.length, chuong: { ten, i: cung.indexOf(tiep) + 1, n: cung.length },
      bai: c0.bai, capDo: c0.capDo, isResume: false, laBatDau: false, truoc: w.beat, cacNhip: ds };
  }
  /**
   * T8: dung truoc canh cua nhip ke tiep trong khoang nghi (builder, DOM, kieu + bo cuc, vua khung), gan an
   * (opacity 0, inert, id cat) ngay truoc the song trong o the -> batDauNhip chi con mo the + chuyen dong.
   */
  function dungTruoc(tiep) {
    boTruoc();
    const cu = S.canh;
    if (!cu || !tiep || S.che !== 'chuyen' || !dom.oThe) return;
    const ctx = ctxTiep(cu, tiep);
    if (!ctx) return;
    const m0 = performance.now();
    const giam = mqGiam(), kho = tinhKho();
    const giamCu = S.giam, khoCu = S.kho;
    S.giam = giam; S.kho = kho;
    let w = null;
    try { w = dungThe(tiep, ctx, cu, true); } catch (e) { canhBao('dung truoc', e); w = null; }
    S.giam = giamCu; S.kho = khoCu;
    if (!w) return;
    catId(w.the);
    w.the.classList.add('sk-the-truoc');
    w.the.inert = true;
    w.the.setAttribute('aria-hidden', 'true');
    dom.oThe.prepend(w.the);
    S.truoc = { w, beat: tiep, ctx, giam, kho, cu, hen: null };
    // vua khung o tac vu sau (tach khoi tac vu dung)
    S.truoc.hen = henDon(() => { if (S.truoc && S.truoc.w === w) { try { vuaKhung(w); } catch (e) {} } }, 0);
    ghiDo({ nhip: tiep.index, kind: w.kind, truoc: true, ms: +(performance.now() - m0).toFixed(2) });
  }
  /** Nhan canh dung san neu dung nhip va dieu kien khong doi; khong thi bo */
  function layTruoc(beat, ctx, cu) {
    const p = S.truoc;
    if (!p) return null;
    S.truoc = null;
    clearTimeout(p.hen);
    const hop = p.beat === beat && p.cu === cu && p.w && p.w.the.isConnected && p.giam === S.giam && p.kho === S.kho
      && !ctx.laBatDau && !ctx.isResume && (ctx.i == null || ctx.i === p.ctx.i);
    if (!hop) { S.truoc = p; boTruoc(); return null; }
    const w = p.w;
    w.ctx = ctx;
    w.the.classList.remove('sk-the-truoc');
    w.the.inert = false;
    w.the.removeAttribute('aria-hidden');
    return w;
  }

  function batDauNhip(beat, ctx) {
    const m0 = performance.now();
    if (!beat || !taoSan()) return;
    ctx = ctx || {};
    const cu0 = S.canh;
    const tuTat = S.che === 'tat' || S.laBatDau || !!ctx.laBatDau || !cu0;
    S.laBatDau = false;
    // Khung cuoi cua canh cu phai du truoc khi no roi san khau (khong cut) — hien ngay, the cu sap ra
    if (cu0) { HQ.tuc = true; try { nenCanh(cu0, true); } finally { HQ.tuc = false; } }
    xaHangHien();
    if (S.cong) traCong(false);            // an toan: D luon raCho truoc
    S.cho = null;
    S.theChuong = null; S.theXong = null;
    // The he moi: moi hen gio cu chet
    S.the++;
    huyHetHen();
    datChe('giang');
    S.epoch++;
    S.giam = mqGiam();
    S.kho = tinhKho();
    S.wall = laTuong();
    S.nhanEl = null; S.nhanLuc = 0; S.chipDoc = false;
    datLaiHangHien();
    if (tuTat) goHetCanh();
    const cu = tuTat ? null : cu0;
    const sanMoi = hienSan();
    if (document.body.classList.contains('sk-cho')) document.body.classList.remove('sk-cho');
    datThuocTinh(dom.san, 'che', 'giang');
    datThuocTinh(dom.san, 'kho', S.kho);
    xoaNetBang();
    datTrangThai('', '');
    const m1 = performance.now();
    // Canh dung san trong khoang nghi (T8) — khong thi dung ngay
    let w = cu ? layTruoc(beat, ctx, cu) : null;
    const daCo = !!w;
    if (!w) { boTruoc(); w = dungThe(beat, ctx, cu, false); }
    const m2 = performance.now();
    if (cu) boId(cu.the || cu.canh.el);   // the cu mat id truoc khi the moi co id (khong trung id)
    if (daCo) {
      traId(w.the);
      w.chuaNhan = false;
      (w.henCho || []).splice(0).forEach(([fn, ms]) => henThe(fn, ms));
    } else dom.oThe.prepend(w.the);        // the song dung truoc the cu dang ra
    // Vua khung (§1.7.4): the dung san da vua trong khoang nghi. The dung ngay (nhip dau / tiep tuc / dung san
    // hong): vua khung + chuyen dong o TAC VU SAU — doc scrollHeight ngay day ep tinh kieu + bo cuc ca trang
    // (body.dang-giang vua bat) trong tac vu cua app (T8: 50-65 ms luc nhip 0). The moi (va san khau vua hien)
    // giu opacity 0 toi luc do: khong khung hinh nao thay noi dung chua vua.
    const hoan = !daCo;
    // The moi an (opacity 0) toi luc chuyen dong bat dau — ke ca the dung san: chuyen dong bat dau o TAC VU SAU
    // (duyet r2, T8: app doi tab luoi / ve lai luoi an ngay truoc batDauNhip -> khung hinh ke tiep rat nang; bat
    // dau hieu ung truoc khung do thi khung dau cua hieu ung bi giat 55-90 ms)
    w.the.style.opacity = '0';
    if (hoan && sanMoi) dom.san.style.opacity = '0';
    const HOAN_MS = hoan ? 40 : 30;
    S.canh = w;
    S.canhLog.push({ so: w.so, nhip: beat.index, kind: w.kind, vaoPerf: performance.now(), raPerf: null, soCue: w.cues.length, batBuoc: w.cues.filter((x) => x.batBuoc).length });
    if (S.canhLog.length > 800) S.canhLog.splice(0, 100);
    dom.sr.textContent = w.canh.sr || beat.label || '';
    const m3 = performance.now();
    const coCuRa = !!(cu && cu.the && cu.the.isConnected && cu.the.style.opacity !== '0');
    capNhatTienTrinh(beat, ctx, !tuTat, (coCuRa ? (S.giam ? 60 : THE_CHONG) : 0) + HOAN_MS);
    const vao = () => {
      const v0 = performance.now();
      w.the.style.opacity = '';
      if (hoan) {
        if (sanMoi) dom.san.style.opacity = '';
        vuaKhung(w);
      }
      theoDoiTran(w);
      let vaoTre = 0;
      try { vaoTre = chuyenThe(cu, w, { tuTat, sanMoi }) || 0; } catch (e) { canhBao('chuyen canh', e); }
      // Cue theo luc vao (ban dung luc: + LEAD)
      w.vaoT = dongHo() + vaoTre / 1000;
      for (const st of w.cues) {
        if (st.khi.luc === 'vao' && st.Tp == null) { st.Tp = w.vaoT + (st.khi.ms || 0) / 1000 + S.LEAD; st.viaP = 'luc'; }
        if (st.dp && st.dp.luc === 'vao' && st.Td == null) { st.Td = w.vaoT + (st.dp.ms || 0) / 1000 + S.LEAD; st.viaD = 'luc'; }
      }
      lapLich(w);
      return performance.now() - v0;
    };
    const msVao = null;
    // 40 ms (dung ngay) / 30 ms (dung san): sau mot luot ve cua trinh duyet (tinh kieu + bo cuc da xong trong
    // buoc ve, khong trong tac vu nao cua ta) -> doc scrollHeight re; the moi con opacity 0 nen khung hinh do
    // khong thay gi (the cu van dung yen)
    henThe(() => { const d = vao(); const g = S.doNhip[S.doNhip.length - 1]; if (g && g.so === w.so) { g.vaoSau = +d.toFixed(2); g.vua = hoan ? w.msVua : null; g.soDo = hoan ? w.soDo : null; } }, HOAN_MS);
    const m4 = performance.now();
    ghiDo({ nhip: beat.index, kind: w.kind, so: w.so, truoc: false, daCo, L: +S.L.toFixed(3), dau: +(m1 - m0).toFixed(2), dung: +(m2 - m1).toFixed(2),
      gan: +(m3 - m2).toFixed(2), tienTrinh: +(m4 - m3).toFixed(2), vao: msVao != null ? +msVao.toFixed(2) : null, ms: +(m4 - m0).toFixed(2) });
  }

  function khiHetNhip(o) {
    const w = S.canh;
    if (!w || S.che === 'tat') return;
    o = o || {};
    if (S.cho) raCho();
    HQ.nen = true;
    const nenMs = nenCanh(w, false);
    datChe('chuyen');
    if (dom.tt && dom.tt.dataset.kieu === 'chuan-bi') datTrangThai('', '');
    const tiep = o.tiep == null ? null : o.tiep;
    let lat = 0;
    if (!tiep) henThe(() => hienTheXong(o, w), Math.max(300, nenMs + 20));
    else if (tiep.isChapterStart) {
      // duyet r2: the chuong thay duoc ~1.3-1.4 s (lat som, gan het khoang nghi 1600 ms)
      lat = Math.max(Math.min(160, (o.gapMs || 1600) * 0.1), nenMs + 20);
      henThe(() => hienTheChuong(o, w), lat);
    }
    // T8: dung truoc canh nhip ke tiep trong khoang nghi — sau khi nen / lat the chuong da xong chuyen dong,
    // truoc khi D goi batDauNhip (gap 700 / 1600 ms)
    if (tiep) {
      const gap = Number(o.gapMs) || 700;
      const luc = lat ? lat + LAT_MS + 220 : Math.max(nenMs + 40, 160);
      if (luc < gap - 120) henThe(() => { try { dungTruoc(tiep); } catch (e) { canhBao('dung truoc', e); } }, luc);
    }
  }

  function tatSan(huyHet) {
    const dangHien = !!(dom.san && !dom.san.hidden);
    boTruoc();
    xaHangHien();
    S.the++;
    huyHetHen();
    traCong(false);
    xongHetHieuUng();
    S.epoch++;
    S.che = 'tat';
    S.cho = null;
    ketCheo();
    // luoi hien lai NGAY khung sau, ke ca khi giam chuyen dong (css/motion.css: khong CSSTransition visibility treo)
    document.body.classList.remove('dang-giang', 'sk-cho');
    const sc = slideContent();
    if (sc) {
      sc.inert = false;
      sc.querySelectorAll('.reading-badge-indicator').forEach((b) => b.remove());
    }
    xoaNetBang();
    if (dom.san) {
      dom.san.dataset.che = 'tat';
      if (S.canh) datNut(S.canh, []);
      datTrangThai('', '');
      if (dom.dau) dom.dau.classList.remove('co-nhac');
      clearTimeout(S.henAn);
      const an = () => {
        S.henAn = null; S.anAnim = null;
        if (S.che !== 'tat') return;
        dom.san.hidden = true;
        dom.san.style.opacity = '';
        goHetCanh();
      };
      if (dangHien && !S.giam) {
        dom.san.style.opacity = '0';
        S.anAnim = chay(dom.san, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: E.in });
        S.henAn = henDon(an, 170);
      } else an();
    }
    S.nhanEl = null;
    if (huyHet) {
      S.traLoi = Object.create(null);
      S.phim = { khoa: '', muc: [], chuong: null, cur: -1, vd: -1, tx: null };
      if (dom.phimRay) { dom.phimRay.textContent = ''; dom.phimRay.style.translate = ''; }
      if (dom.tienDo) { dom.tienDo.textContent = ''; dom.tienDo.dataset.n = ''; }
      if (dom.nhan) dom.nhan.textContent = '';
      S.laBatDau = false;
    }
  }

  // ------------------------------------------------------------------ cho hoc vien (§3.8 + bo sung C: cong the that)
  /**
   * Cong (portal): chuyen CHINH the bai tap #card-<id> cua luoi vao than the san khau (luoi giu cho bang
   * mot comment). Id giu nguyen duy nhat, moi handler / phan hoi cham bai chay nhu cu, hoc vien tra loi
   * ngay cho dang nhin. Tra ve bang raCho / tamDung / dung (traCong).
   */
  function moCong(w, card) {
    traCong(false);
    const giu = document.createComment('sk-cong');
    card.replaceWith(giu);
    const vo = document.createElement('div');
    vo.className = 'sk-cong';
    const dai = [...card.querySelectorAll('.qz-opt-text')].reduce((m, x) => Math.max(m, Array.from((x.textContent || '').trim()).length), 0);
    if (dai > 28 || S.kho === 'hep') vo.classList.add('is-mot-cot');
    vo.appendChild(card);
    w.than.appendChild(vo);
    card.classList.add('sk-trong-cong');
    card.querySelectorAll('.reading-badge-indicator').forEach((b) => b.remove());
    S.cong = { card, giu, vo };
    dongBoCong(w);   // cung --sk-co + cung vi tri neo voi ban mau cua canh (vuaKhung) — khong nhay
    cuonMuot(vo, card);
    return vo;
  }
  /** Tra the that ve dung cho cu. banSao: de lai ban sao tinh (khong id, inert) trong the san khau cho khoang nghi */
  function traCong(banSao) {
    const cg = S.cong;
    if (!cg) return null;
    S.cong = null;
    const { card, giu, vo } = cg;
    let cl = null;
    if (banSao && vo.isConnected && card.parentNode === vo) {
      cl = card.cloneNode(true);
      boId(cl, true);
      cl.inert = true;
      cl.setAttribute('aria-hidden', 'true');
      cl.classList.add('sk-ban-sao');
      card.before(cl);
    }
    card.classList.remove('sk-trong-cong');
    if (giu.isConnected) giu.replaceWith(card);
    else card.remove();   // luoi da ve lai (co the moi cung id): bo the cu, khong de trung id
    if (!cl) vo.remove();
    return cl;
  }
  /** Bo id trong root, tru cay cua giu (the bai tap that dang nam trong canh) */
  function boIdTru(root, giu) {
    if (!root || !root.querySelectorAll) return;
    const ngoai = (e) => !giu || (e !== giu && !giu.contains(e));
    if (ngoai(root) && root.removeAttribute) root.removeAttribute('id');
    root.querySelectorAll('[id]').forEach((e) => { if (ngoai(e)) e.removeAttribute('id'); });
  }
  function vaoCho(beat) {
    const w = S.canh;
    if (!w || !w.the || S.che === 'tat' || S.che === 'cho' || S.cho) return;
    const exId = beat && beat.data && beat.data.id;
    const card = exId ? $id('card-' + exId) : null;
    const sc = slideContent();
    if (!card || !sc || !sc.contains(card)) {
      // Khong co the that de bam -> khong ket o day
      henThe(() => { if (typeof S.khiBoQua === 'function') S.khiBoQua(); }, 0);
      return;
    }
    HQ.nen = true;
    nenCanh(w, false);
    xoaNetBang();
    if (dom.tt && dom.tt.dataset.kieu === 'chuan-bi') datTrangThai('', '');
    const g = S.the;
    const cho = { exId, card, beat, xong: false, daTraLoi: false };
    S.cho = cho;
    anConTro(w.the);
    const song = () => g === S.the && S.cho === cho && document.body.classList.contains('dang-giang');
    const trongSan = () => !!(card.isConnected && card.closest('#sanKhauGiang'));
    const xong = () => {
      if (!song() || cho.xong) return;
      cho.xong = true;
      datChe('cho');
      document.body.classList.add('sk-cho');
      // Khoi cau cua canh thoi la dich cua meo / bang: id chi con o the that
      boIdTru(w.canh.el, card);
      const b0 = $id(`btn-opt-${exId}-0`);
      try { if (b0 && !b0.disabled && !card.contains(document.activeElement)) b0.focus({ preventScroll: true }); } catch (e) {}
      // Dien thoai: cau ngan (khung chan chi ~180 px canh nut) — ban day du van nam o title / aria
      datChan(w, S.kho === 'hep' ? 'Đến lượt bạn: chọn A–D' : 'Đến lượt bạn — chọn A, B, C hoặc D', 'luot-ban', 'Đến lượt bạn — chọn A, B, C hoặc D');
      datNut(w, [{ nhan: 'Bỏ qua', lop: 'sk-btn-ma', title: 'Bỏ qua câu này, giảng tiếp', bam: () => { if (typeof S.khiBoQua === 'function') S.khiBoQua(); } }]);
      const q = beat.data || {};
      if (q.hint) {
        henThe(() => {
          if (S.che !== 'cho' || S.cho !== cho || cho.daTraLoi) return;
          datChan(w, 'Gợi ý: ' + q.hint, 'goi-y');
          hu.nhay(card);
        }, 20000);
      }
    };
    let ms = 0;
    // 1) Canh (C) tu trao tay — thuong la dua CHINH the that vao o cua khoi cau hoi (portal cua canh)
    if (typeof w.canh.vaoCho === 'function') {
      try { const r = w.canh.vaoCho(xong, () => {}, { card }); ms = typeof r === 'number' ? r : 0; }
      catch (e) { canhBao('vaoCho', e); ms = 0; }
    }
    if (cho.xong || !song()) return;
    // 2) Canh khong dua the len san khau -> dao dien mo cong: the that thay cho khoi cau hoi cua canh
    if (!trongSan() && card.isConnected) {
      const vo = moCong(w, card);
      const r = hu.ra(w.canh.el);
      ms = Math.max(ms, r);
      // noi tiep, khong chong: khoi cu mo het roi the that moi hien (khong luc nao hai cau hoi cung thay)
      if (!S.giam) chay(vo, [{ opacity: 0, offset: 0 }], { duration: 200, delay: r, easing: E.out });
      ms = Math.max(ms, r + 200);
    }
    if (S.giam || ms <= 0) { xong(); return; }
    henThe(xong, ms + 60);
  }
  function raCho() {
    const cho = S.cho;
    if (!cho) return;
    S.cho = null;
    const w = S.canh;
    try { if (w && typeof w.canh.raCho === 'function') w.canh.raCho(); } catch (e) { canhBao('raCho', e); }
    traCong(true);
    document.body.classList.remove('sk-cho');
    const sc = slideContent();
    if (sc) sc.inert = true;
    if (w) datNut(w, []);
    if (S.che !== 'tat') datChe('chuyen');
  }
  function khiTraLoi(exId, dung) {
    if (exId == null) return;
    S.traLoi[exId] = !!dung;
    veDoan();
    datPhim(false);
    if (S.che === 'cho' && S.cho && S.cho.exId === exId) {
      S.cho.daTraLoi = true;
      const w = S.canh;
      const sai = S.kho === 'hep' ? 'Chưa đúng — nghe Sensei' : 'Chưa đúng — nghe Sensei giảng';
      datChan(w, dung ? 'Đúng rồi!' : sai, dung ? 'dung' : 'sai', dung ? '' : 'Chưa đúng — nghe Sensei giảng');
      datNut(w, [{ nhan: 'Tiếp tục ▸', lop: 'sk-btn-chinh sk-nut-tiep', title: 'Sang phần tiếp theo', bam: () => { if (typeof S.khiTiepTuc === 'function') S.khiTiepTuc(); } }]);
    }
    try { if (S.canh && typeof S.canh.canh.khiTraLoi === 'function') S.canh.canh.khiTraLoi(exId, dung); } catch (e) { canhBao('khiTraLoi', e); }
  }
  /** Dem nguoc tu tiep tuc: vach duoi "Tiếp tục ▸" day dan (translate) trong ms; null = "…" cho loi cham */
  function datDemTiep(ms) {
    const w = S.canh;
    if (S.che !== 'cho' || !w || !w.nut) return;
    const nut = w.nut.querySelector('.sk-nut-tiep');
    if (!nut) return;
    let v = nut.querySelector('.sk-dem');
    let ba = w.nut.querySelector('.sk-dem-cho');
    if (ms == null) {
      if (v) v.remove();
      if (!ba) { ba = document.createElement('span'); ba.className = 'sk-dem-cho'; ba.setAttribute('aria-hidden', 'true'); ba.textContent = '…'; w.nut.insertBefore(ba, nut); }
      return;
    }
    if (ba) ba.remove();
    if (!v) { v = document.createElement('i'); v.className = 'sk-dem'; v.setAttribute('aria-hidden', 'true'); v.innerHTML = '<i></i>'; nut.appendChild(v); }
    if (!S.giam) chay(v.firstElementChild, [{ translate: '-100% 0', offset: 0 }], { duration: Math.max(1, Number(ms) || 0), easing: 'linear' });
  }
  function khiPhim(e) {
    if (S.che !== 'cho' || !S.cho || e.defaultPrevented) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.isComposing) return;
    const t = e.target;
    if (t && t.closest && t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return;
    const k = String(e.key || '').toLowerCase();
    let i = 'abcd'.indexOf(k);
    if (i < 0) i = '1234'.indexOf(k);
    if (i < 0 || k.length !== 1) return;
    const b = $id(`btn-opt-${S.cho.exId}-${i}`);
    if (b && !b.disabled) { e.preventDefault(); b.click(); }
  }

  // ------------------------------------------------------------------ tin hieu tieng / chu
  function khiGuiLuot() {
    S.luotId++;
    // Luot cu cua Sensei con dang sinh (chua turnComplete) -> goi / chu 500 ms dau co the la cua no
    const coCu = S.dangSinh;
    S.dangSinh = true;
    const w = S.canh;
    if (!w || (S.che !== 'giang' && S.che !== 'chuyen')) return;
    if (!w.turns.some((t) => t.chunks.length)) doiMien(w, laTuong());
    const t = luotMoi(w);
    t.giu = coCu;
    henThe(() => {
      t.tam = false;
      if (t.giu) { t.giu = false; nhaGiu(w, t); }   // qua 500 ms khong ai bao cu -> chot la cua luot moi
    }, 500);
    if (w.turns.length === 1) {
      henThe(() => {
        if (S.canh !== w || w.Tfirst != null) return;
        if (S.che === 'giang') datTrangThai('Sensei đang chuẩn bị', 'chuan-bi');
        let doi = false;
        for (const st of w.cues) {
          if (conSong(st) && st.khi.dauTien && st.Tp == null) { st.Tp = dongHo() + S.LEAD; st.viaP = 'tiLe'; doi = true; }
        }
        if (doi) lapLich(w);
      }, 2500);
      henThe(() => {
        if (S.canh !== w || w.Tfirst != null) return;
        if (S.che === 'giang') datTrangThai('Sensei vẫn đang soạn lời', 'chuan-bi');
      }, 12000);
    }
  }
  function luotSong() {
    const w = S.canh;
    if (!w || (S.che !== 'giang' && S.che !== 'chuyen')) return null;
    const t = w.luot;
    return t && !t.xong ? { w, t } : null;
  }
  function khiCoAmThanh(b64, t0, t1) {
    const x = luotSong();
    if (!x) return;
    const { w, t } = x;
    const dur = Math.max(0, (Number(t1) || 0) - (Number(t0) || 0));
    if (!(dur > 0)) return;
    let T0 = Number(t0), T1 = Number(t1);
    const cuoi = t.chunks[t.chunks.length - 1];
    if (S.wall) { T0 = Math.max(perfGiay(), cuoi ? cuoi.t1 : 0); T1 = T0 + dur; }
    t.chunks.push({ t0: T0, t1: T1, a0: t.A, a1: t.A + dur });
    if (typeof b64 === 'string' && b64) t.env.push({ t0: T0, a0: t.A, a1: t.A + dur, db: baoHinh(t, b64) });
    t.A += dur;
    if (t.Tfirst == null) t.Tfirst = T0;
    if (t.giu) return;   // tam: chua biet cua luot nao -> chua giai cue (§1.5.2)
    if (w.Tfirst == null) { w.Tfirst = T0; khiAmDau(w); }
    giaiLai(w);
  }
  /** Het giu tam (500 ms, khong bi bo): giai cue bang du lieu da nhan */
  function nhaGiu(w, t) {
    if (w !== S.canh || t.xong) return;
    if (t.Tfirst != null && w.Tfirst == null) { w.Tfirst = t.Tfirst; khiAmDau(w); }
    timKhopCanh(w, false);
    giaiLai(w);
  }
  function khiMatAmThanh(b64, lyDo) {
    const x = luotSong();
    if (!x) return;
    const { w, t } = x;
    const s = String(b64 || '');
    const pad = s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0;
    const dur = Math.max(0, Math.floor(s.length * 3 / 4) - pad) / 2 / 24000;
    if (!(dur > 0)) return;
    const cuoi = t.chunks[t.chunks.length - 1];
    const T0 = Math.max(dongHo(), cuoi ? cuoi.t1 : 0);
    t.chunks.push({ t0: T0, t1: T0 + dur, a0: t.A, a1: t.A + dur, mat: lyDo || true });
    t.A += dur;
    if (t.Tfirst == null) t.Tfirst = T0;
    if (t.giu) return;
    if (w.Tfirst == null) { w.Tfirst = T0; khiAmDau(w); }
    giaiLai(w);
  }
  function khiCoLoi(doan, qEnd) {
    const x = luotSong();
    if (!x || doan == null || doan === '') return;
    const { w, t } = x;
    themChuoi(w, t, String(doan));
    t.frags.push({ u1: t.uP[t.uP.length - 1], A: t.A, qEnd: Number(qEnd) || 0, perf: performance.now(), off: t.raw.length });
    if (t.giu) return;
    timKhopCanh(w, false);
  }
  function khiTuNgat() {
    const w = S.canh;
    const t = w && w.luot;
    if (!t || !t.tam || performance.now() - t.tGui > 500) return;
    boLuotTam(w, t);
    // Sau interrupted cua luot cu, moi goi / chu deu la cua luot moi
    if (t.giu) { t.giu = false; nhaGiu(w, t); }
  }
  function khiXaHang() {
    const x = luotSong();
    if (x) x.t.xa++;
  }
  function khiLuotXong(tEnd) {
    S.dangSinh = false;
    const x = luotSong();
    if (!x) return;
    const { w, t } = x;
    if (t.giu) {
      // turnComplete cua LUOT CU (vua het tu nhien luc ta gui luot moi): du lieu tam la duoi cua no -> bo
      boLuotTam(w, t);
      t.giu = false;
      S.dangSinh = true;   // luot moi van dang sinh
      return;
    }
    t.xong = true;
    const cuoi = t.chunks[t.chunks.length - 1];
    t.Tend = S.wall ? (cuoi ? cuoi.t1 : dongHo()) : (Number(tEnd) > 0 ? Number(tEnd) : (cuoi ? cuoi.t1 : dongHo()));
    hocLuot(w, t);
    timKhopCanh(w, true);
    giaiLai(w);
    // Du phong 3 (§1.6.4.3): chi khi nhip co tieng (khong thi cho luot noi tiep / nen)
    const tongAm = w.turns.reduce((a, x2) => a + x2.A, 0);
    if (w.Tfirst != null && tongAm >= 2) {
      const now = dongHo();
      const han = t.Tend - 0.3;
      const qua = [];
      for (const st of w.cues) {
        if (!conSong(st) || !st.batBuoc) continue;
        if (st.Tp == null && st.Td == null) {
          st.Tf = Math.min(w.Tfirst + (st.tiLe != null ? st.tiLe : 0.5) * (t.Tend - w.Tfirst), han);
          if (st.Tf - S.LEAD <= now) qua.push(st);
        }
      }
      if (qua.length) {
        const cua = Math.max(0, han - now);
        const buoc = qua.length > 1 ? Math.max(0.06, Math.min(0.15, cua / (qua.length - 1))) : 0;
        qua.forEach((st, k) => { st.Tf = now + S.LEAD + k * buoc; });
      }
      // nhan / doc chua khop: bo — tru khi con cho mot cue khac dang song (sauCue / cumSau)
      for (const st of w.cues) {
        if (!conSong(st) || st.batBuoc) continue;
        if (st.Tp == null && st.Td == null && !conHyVong(w, st)) boCue(w, st);
      }
      lapLich(w);
    }
  }
  function conHyVong(w, st) {
    return [st.khi.sauCue, st.khi.cumSau, st.dp && st.dp.sauCue]
      .filter((x) => x != null).map((id) => w.byId[id]).some((r) => r && conSong(r));
  }

  // ------------------------------------------------------------------ cong cu (§2.5)
  function thoiDiemCongCu() {
    const now = dongHo();
    if (S.wall) {
      const t = S.canh && S.canh.luot;
      const c = t && t.chunks[t.chunks.length - 1];
      return Math.max(now, c ? c.t1 : now);
    }
    const a = ae();
    return Math.max(now, (a && a.scheduledTime) || 0);
  }
  /** Gan tool cho cue cho tool (khi.congCu / duPhong.congCu): moc giai bang giaiMocCongCu (§1.5.5 ban 2) */
  function ganCongCu(w, name, args, c) {
    let co = false;
    for (const st of w.cues) {
      if (!conSong(st)) continue;
      const hop = (k) => k && k.congCu === name && (typeof k.neu !== 'function' || k.neu(args));
      if (hop(st.khi) && st.Tp == null && !st.cc) { st.cc = c; st.ccMs = (st.khi.ms || 0) / 1000; st.luot = w.luot ? w.luot.id : null; st.congCu = name; co = true; }
      else if (hop(st.dp) && st.Td == null && !st.ccD) { st.ccD = c; st.ccDMs = (st.dp.ms || 0) / 1000; st.luot = st.luot || (w.luot ? w.luot.id : null); st.congCu = name; co = true; }
    }
    if (co) giaiLai(w);
    return co;
  }
  function lapNghi(elId) {
    const el = $id('st-' + elId);
    if (!el || !dom.san) return 0;
    let max = 0;
    let n = el;
    while (n && n !== dom.san) {
      try {
        (n.getAnimations ? n.getAnimations() : []).forEach((a) => {
          if (a.playState !== 'running' || !a.effect) return;
          const ct = a.effect.getComputedTiming();
          if (ct && isFinite(ct.endTime)) max = Math.max(max, ct.endTime - (ct.localTime || 0));
        });
      } catch (e) {}
      n = n.parentElement;
    }
    return Math.min(450, Math.max(0, max)) / 1000;
  }
  function nhanKenh(el, T) {
    const now = dongHo();
    if (S.nhanLuc && now < S.nhanLuc + 0.6) {
      const t2 = S.nhanLuc + 0.6;
      if (t2 - T > 0.4) return;
      henLuc(t2, () => { if (el.isConnected) hu.nhan(el); }, 0);
      return;
    }
    hu.nhan(el);
  }
  function khiCongCu(name, args) {
    if (S.che === 'tat') return null;
    args = args || {};
    const w = S.canh;
    const T0 = thoiDiemCongCu();
    if (w && typeof w.canh.congCu === 'function') {
      try { const r = w.canh.congCu(name, args); if (r != null) return r; } catch (e) { canhBao('congCu canh', e); }
    }
    const cho = S.che === 'cho';
    const B = window.SenseiBoard;
    const c = taoMocCongCu(w, T0);   // moc cua loi di kem tool (giai dan khi am thanh toi)
    switch (name) {
      case 'write_kanji': {
        if (cho) return null;
        const ch = String(args.character || '').trim();
        const coNet = !!(ch && window.SenseiStrokes && typeof SenseiStrokes.get === 'function' && SenseiStrokes.get(ch));
        const dungChu = !!(w && w.kind === 'kanji' && w.beat.data && w.beat.data.character === ch);
        const coCue = !!(w && w.cues.some((st) => (st.khi.congCu === 'write_kanji') || (st.dp && st.dp.congCu === 'write_kanji')));
        if (dungChu && coCue) ganCongCu(w, name, args, c);
        else if (coNet && !dungChu) henCongCu(w, c, () => vietKanjiGhi(ch));   // cung chu dang tren the: khong ve lan hai
        return coNet ? { success: true, wrote: ch } : { success: false, error: 'chua co du lieu net cua chu ' + ch };
      }
      case 'write_on_board': {
        const text = args.text == null ? '' : String(args.text);
        const kieu = args.style || 'thuong';
        if (w) ganCongCu(w, name, args, c);
        vietBangAn(text, kieu);
        if (text.trim()) {
          if (cho) themChanPhu(text.trim());
          else henCongCu(w, c, () => ghiChu(text, kieu));
        }
        return { success: true };
      }
      case 'draw_on_board': {
        // Duyet r2: dang giang KHONG ve len san khau (net do cat ngang chu / furigana, sai bang mau, la kenh
        // nhan manh thu hai, song qua canh). Dich ra ngon ngu cua the: khoanh / gach / khung = con tro doc toi
        // muc do; mui_ten = con tro luot A -> B. Luot hoc vien (cho): the bai tap tu phan hoi dung / sai.
        const id = args.target_id, toId = args.to_id;
        if (w) ganCongCu(w, name, args, c);
        const trong = (x) => { const e = x ? $id('st-' + x) : null; return e && w && w.the && w.the.contains(e) && e.getClientRects().length ? e : null; };
        const el = trong(id), den = String(args.kind || '') === 'mui_ten' ? trong(toId) : null;
        if (!cho && w && el) {
          if (w.the.classList.contains('tu-ve') && typeof w.canh.congCu === 'function') {
            // con tro cua canh (B): hai lan lien tiep — canh giu cho cu >= 600 ms roi moi luot sang B
            try { w.canh.congCu('highlight_element', { target_id: id }); if (den && den !== el) w.canh.congCu('highlight_element', { target_id: toId }); }
            catch (e) { canhBao('draw_on_board', e); }
          } else {
            henCongCu(w, c, () => {
              // doi hoat anh dang chay cua dich (toi da 450 ms) roi moi dua con tro toi
              const lam = () => {
                if (!el.isConnected) return;
                nhanKenh(el, c.T != null ? c.T : T0);
                if (den && den !== el) henThe(() => { if (den.isConnected) hu.nhan(den); }, 700);
              };
              const nghi = lapNghi(id);
              if (nghi > 0.02) henThe(lam, nghi * 1000); else lam();
            });
          }
        }
        return { success: !!(id && ($id('st-' + id) || $id(id))) };
      }
      case 'clear_board': {
        if (cho) return null;
        try { if (B && typeof B.xoaBang === 'function') B.xoaBang(); } catch (e) {}
        xoaGhi(S.canh);
        return { success: true };
      }
      case 'highlight_element': {
        if (cho) return null;
        const el = $id('st-' + args.target_id);
        if (el) henCongCu(w, c, () => { if (el.isConnected) nhanKenh(el, c.T != null ? c.T : T0); });
        return { success: true, highlighted: args.target_id };
      }
      case 'change_section':
      case 'open_exercise':
        if (cho) return null;
        return { success: true, ghiChu: 'màn hình tự chuyển theo giáo án' };
      case 'change_slide': {
        if (cho) return null;
        // Cung mac dinh voi app.js (level N5, bai 1) de "cung bai" khop dung cach app hieu tool nay
        const s = se();
        const lvl = window.SenseiCapDo ? window.SenseiCapDo.ma(args.level, 'N5') : String(args.level || 'N5').toUpperCase();
        const no = Number(args.lesson_id) || 1;
        const cung = !s || (lvl === String(s.currentLevel || '').toUpperCase() && no === Number(s.currentLesson));
        return cung ? { success: true } : null;
      }
      default:
        if (w) ganCongCu(w, name, args, c);
        return null;
    }
  }

  // ------------------------------------------------------------------ hoi thoai (chuyen tiep cho canh)
  function goiCanh(ten, args) {
    const w = S.canh;
    if (!w || S.che === 'tat' || S.che === 'cho') return;
    const f = w.canh[ten];
    if (typeof f !== 'function') return;
    try { f.apply(w.canh, args); } catch (e) { canhBao(ten, e); }
  }

  // ------------------------------------------------------------------ API
  function trangThai() {
    const w = S.canh;
    return {
      che: S.che, epoch: S.epoch, the: S.the,
      nhip: w ? w.beat.index : null, kind: w ? w.kind : null,
      cues: w ? w.cues.map((st) => ({ id: st.id, loai: st.loai, tt: st.tt, via: st.via || st.viaO, T: st.T != null ? st.T : st.To, batBuoc: st.batBuoc })) : [],
      luot: w ? w.turns.length : 0, luotId: S.luotId,
      L: S.L, r: S.r, LEAD: S.LEAD, wall: S.wall, giam: S.giam, kho: S.kho,
      cho: S.cho ? S.cho.exId : null,
    };
  }
  function init(o) {
    o = o || {};
    S.ae = o.audioEngine || S.ae;
    S.se = o.slideEngine || S.se;
    if (typeof o.khiTiepTuc === 'function') S.khiTiepTuc = o.khiTiepTuc;
    if (typeof o.khiBoQua === 'function') S.khiBoQua = o.khiBoQua;
    if (S.daInit) return;
    S.daInit = true;
    napThamSo();
    S.giam = mqGiam();
    try {
      const mq = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)');
      if (mq && mq.addEventListener) mq.addEventListener('change', () => { S.giam = mq.matches; });
    } catch (e) {}
    document.addEventListener('keydown', (e) => { try { khiPhim(e); } catch (x) { canhBao('phim', x); } });
    window.addEventListener('resize', () => { S.kho = tinhKho(); if (dom.san) dom.san.dataset.kho = S.kho; });
    taoSan();
  }

  /** Boc: bat=false -> no-op; loi -> canh bao, khong bao gio nem vao app.js */
  function boc(ten, fn, macDinh) {
    return function () {
      if (!S.bat) return macDinh;
      try { return fn.apply(null, arguments); } catch (e) { canhBao(ten, e); return macDinh; }
    };
  }

  const API = {
    get bat() { return S.bat; },
    init: function (o) {
      if (!S.bat) return;
      try { init(o); } catch (e) { S.bat = false; canhBao('init', e); }
    },
    batDauNhip: boc('batDauNhip', batDauNhip),
    khiHetNhip: boc('khiHetNhip', khiHetNhip),
    tamDung: boc('tamDung', () => tatSan(false)),
    tiepTuc: boc('tiepTuc', () => { S.laBatDau = true; }),
    dung: boc('dung', () => tatSan(true)),
    dongBo: boc('dongBo', (state) => {
      if (state !== 'PLAYING' && (S.che !== 'tat' || document.body.classList.contains('dang-giang'))) tatSan(false);
    }),
    khiGuiLuot: boc('khiGuiLuot', khiGuiLuot),
    khiCoAmThanh: boc('khiCoAmThanh', khiCoAmThanh),
    khiMatAmThanh: boc('khiMatAmThanh', khiMatAmThanh),
    khiCoLoi: boc('khiCoLoi', khiCoLoi),
    khiTuNgat: boc('khiTuNgat', khiTuNgat),
    khiXaHang: boc('khiXaHang', khiXaHang),
    khiLuotXong: boc('khiLuotXong', khiLuotXong),
    khiCongCu: boc('khiCongCu', khiCongCu, null),
    khiDongThoai: boc('khiDongThoai', (line, i) => {
      // Nghe tron doan: day phim + thanh chia doan theo cau dang phat
      const w = S.canh;
      if (w && w.kind === 'kaiwa-run' && (S.che === 'giang' || S.che === 'chuyen') && S.phim.chuong === 'kaiwa' && Number.isInteger(i)) {
        const k = line && line.id ? S.phim.muc.findIndex((m) => m.id === line.id) : -1;
        S.phim.cur = k >= 0 ? k : clamp(i, 0, Math.max(0, S.phim.muc.length - 1));
        veDoan();
        datPhim(true);
      }
      goiCanh('khiDongThoai', [line, i]);
    }),
    khiClip: boc('khiClip', (id, info) => goiCanh('khiClip', [id, info || {}])),
    khiGiongMay: boc('khiGiongMay', (id, su, ci) => goiCanh('khiGiongMay', [id, su, ci])),
    khiXongDong: boc('khiXongDong', (id) => goiCanh('khiXongDong', [id])),
    vaoCho: boc('vaoCho', vaoCho),
    raCho: boc('raCho', raCho),
    khiTraLoi: boc('khiTraLoi', khiTraLoi),
    datDemTiep: boc('datDemTiep', datDemTiep),
    dangGiang: boc('dangGiang', () => S.che !== 'tat', false),
    dangCho: boc('dangCho', () => S.che === 'cho', false),
    trangThai: boc('trangThai', trangThai, { che: 'tat', epoch: 0, nhip: null, kind: null, cues: [], luot: 0 }),
    dangKyCanh(kind, def) {
      if (!kind || !def) return false;
      S.builders[kind] = def;
      return true;
    },
    hu,
    // them (ngoai spec): tien ich cho B / C / kiem thu
    tienIch: { chuanJP, chuanVN, donVi, vn3, DAN, dongHo },
  };

  window.SenseiMotion = API;
  window.__motion = {
    nhatKy: () => S.nhatKy.slice(),
    cues: () => {
      const w = S.canh;
      if (!w) return [];
      return w.cues.map((st) => ({
        id: st.id, loai: st.loai, tt: st.tt, batBuoc: st.batBuoc, thuTu: st.thuTu, via: st.via || st.viaO,
        To: st.To, Teff: isFinite(st.Teff) ? st.Teff : null, T: st.T, khopS: st.khopS, luot: st.luot, viTri: st.viTri,
        firedCtx: st.firedCtx, firedPerf: st.firedPerf,
      }));
    },
    trangThai: () => trangThai(),
    luotHienTai: () => S.luotId,
    datThamSo(o) {
      o = o || {};
      if (o.L != null && isFinite(o.L)) S.L = clamp(+o.L, -1.5, 1.5);
      if (o.r != null && isFinite(o.r)) S.r = clamp(+o.r, 0.08, 0.3);
      if (o.rV != null && isFinite(o.rV)) S.rV = clamp(+o.rV, 0.06, 0.3);
      if (o.rJ != null && isFinite(o.rJ)) S.rJ = clamp(+o.rJ, 0.06, 0.35);
      if (o.rL != null && isFinite(o.rL)) S.rL = clamp(+o.rL, 0.06, 0.35);
      if (o.LEAD != null && isFinite(o.LEAD)) S.LEAD = Math.max(0, +o.LEAD);
      return { L: S.L, r: S.r, rV: S.rV, rJ: S.rJ, rL: S.rL, LEAD: S.LEAD };
    },
    xoaNhatKy() { S.nhatKy.length = 0; S.karaokeLog.length = 0; S.canhLog.length = 0; },
    // them
    canhDaQua: () => S.canhLog.slice(),
    karaoke: () => S.karaokeLog.slice(),
    luot: () => (S.canh ? S.canh.turns.map((t) => ({ id: t.id, raw: t.raw, A: t.A, Tfirst: t.Tfirst, Tend: t.Tend, soManh: t.frags.length, soGoi: t.chunks.length, xong: t.xong })) : []),
    thamSo: () => ({ L: S.L, r: S.r, rV: S.rV, rJ: S.rJ, rL: S.rL, LEAD: S.LEAD }),
    doNhip: () => S.doNhip.slice(),
    // chan doan mo hinh thoi gian (kiem thu): chup luot + khoang lang + vi tri moc cua cue khop
    chupLuot: () => {
      const w = S.canh;
      if (!w) return null;
      return {
        nhip: w.beat.index, L: S.L, rV: S.rV, rJ: S.rJ, rL: S.rL,
        luot: w.turns.map((t) => { const Lc = langCua(t); return { id: t.id, raw: t.raw, bien: t.bien.slice(), bienLoai: t.bienLoai.slice(), cumJ: t.cumJ.map((x) => +x.toFixed(2)), khop: Array.from(canChinh(t).j), uP: t.uP.map((x) => +x.toFixed(2)), chunks: t.chunks.map((c) => [+c.t0.toFixed(4), +c.t1.toFixed(4), +c.a0.toFixed(4), +c.a1.toFixed(4)]), frags: t.frags.map((f) => [+f.u1.toFixed(2), +f.A.toFixed(3), f.off]),
          lang: Lc.runs.map((r) => [+r.s.toFixed(3), +r.e.toFixed(3), r.mo ? 1 : 0]), A: t.A, xong: t.xong, t0: t.chunks[0] ? t.chunks[0].t0 : null }; }),
        cues: w.cues.filter((st) => st.khopS != null).map((st) => { const x = viTriA(w, st.khopS, true, false); const t = x && x.t;
          const Lc = t ? langCua(t) : null; const off = w.rO[st.khopS]; const v0 = t ? vUoc(t, Lc, t.uP[off]) : null;
          return { id: st.id, viTri: st.viTri, luot: st.luot, loai: st.loai, tt: st.tt, via: st.via, a: x ? +x.a.toFixed(3) : null, nguon: x ? x.nguon : null, v0: v0 != null ? +v0.toFixed(3) : null, a0: v0 != null ? +aTuV(Lc, Math.max(0, v0)).toFixed(3) : null, bien: t ? laBien(t, off) : null }; }),
      };
    },
    truoc: () => (S.truoc ? { nhip: S.truoc.beat && S.truoc.beat.index, kind: S.truoc.w && S.truoc.w.kind } : null),
    dongHo: () => dongHo(),
    soHieuUng: () => { donHieuUng(); return soDangChay(); },
    // bo sung v2
    conTro: () => {
      const t = S.canh && S.canh.the;
      const el = t && t.__ctEl;
      return el ? { id: el.id || null, lop: el.className || '', chu: (el.textContent || '').trim().slice(0, 40), rect: t.__ct } : null;
    },
    phim: () => ({ chuong: S.phim.chuong, soMuc: S.phim.muc.length, cur: S.phim.cur, vd: S.phim.vd, tx: S.phim.tx }),
    cong: () => (S.cong ? { exId: S.cong.card.id, trongThe: !!(S.cong.card.closest && S.cong.card.closest('.sk-the')) } : null),
    hangHien: () => HQ.hang.length,
    // duyet r2: ket qua vua khung cua canh dang song (co chu, an phan phu, chieu cao noi dung / than the)
    vua: () => {
      const w = S.canh, el = w && w.canh && w.canh.el;
      if (!el || !w.than) return null;
      return { kind: w.kind, co: w.co != null ? w.co : 1, gon2: el.classList.contains('is-gon-2'), cao: Math.round(caoNoiDung(el)), H: w.than.clientHeight };
    },
  };
})();
