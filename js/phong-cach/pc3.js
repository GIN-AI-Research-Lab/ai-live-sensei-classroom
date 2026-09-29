/* ==========================================================================
   Phong cach giang 3 — "Tap chi toi gian": chuyen dong (di kem css/phong-cach/pc3.css)

   Dang ky: window.SenseiPhongCach.pc3 = { batDau(san), ketThuc(san) }.
   Khong boc ham nao cua SenseiMotion, khong doi hen gio: chi QUAN SAT san khau (MutationObserver)
   va DOI KHUNG HINH (KeyframeEffect.setKeyframes) cua cac hoat anh WAAPI vua duoc dao dien / canh
   tao ra — cung luc bat dau, cung do tre; chi doi CACH chuyen dong:

     1. Doi nhip (the vao / ra, the chuong, cung slide): truot NGANG -> lat trang DOC. Noi dung cu
        truot len va chui mat sau duong chi dau trang (dai .sk-dau mau giay, z-index tren noi dung =
        mat na); noi dung moi dang len tu duoi (mep duoi trang cat).
     2. Dong phu hien theo loi (opacity + nhich 6 px): hien kieu "clip reveal" — dong chu truot len tu
        sau mep duoi cua chinh no (clip-path inset co dinh tai cho, translate 100%).
     3. Doi duoi (bien hinh, the tu dien: truot doc 40%): them mat na cung kieu (khong tran ra ngoai o).
     4. Con tro doc: hop con tro truot bang translate + scale; phong cach ve vach 2 px o day hop ->
        giu scale doc = 1 va bu translate de DAY hop truot dung cho (vach khong day / mong khi truot).
     5. Giu cho (the khong bao gio trong): dong Kun / tu ghep cua chu Han va nghia cau vi du dung san o
        dang chu MO (CSS); luc canh "hien" chung (opacity 0 -> 1), doi thanh "ro dan tai cho" tu muc mo
        (dong doc: chi phan dd) — khong nhay ve 0 roi hien lai. Chay ca khi giam chuyen dong.
   Them (chi trang tri, khong dung hen gio):
     6. So trang lon o goc the: data-pc3-so ("02") tren khung the moi, lay tu dong dau ("… 2/6").
     7. So thu tu net trong o chu Han: dat lai ra ngoai dau net (khong de len net), huong trong nhat.

   Chi khi san khau mang data-phong-cach="pc3" va khong giam chuyen dong (giam: dao dien da tu dung
   opacity 120 ms — giu nguyen). ketThuc() ngat quan sat; khong con gi can hoan tac.
   ========================================================================== */
(function () {
  'use strict';

  const TEN = 'pc3';
  const DS = new Map();               // san -> { mo, raf, da }
  const DEM = { the: 0, lat: 0, cung: 0, doi: 0, hien: 0, tro: 0, cho: 0, so: 0, net: 0 };
  const CHO = 0.3;                    // = --pc3-cho (css): chu "chua noi toi"   // chan doan (kiem thu)
  let mqGiam = null;
  try { mqGiam = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null; } catch (e) { mqGiam = null; }
  const giam = () => !!(mqGiam && mqGiam.matches);
  const dangBat = (san) => !!(san && san.isConnected && san.getAttribute('data-phong-cach') === TEN);

  // ------------------------------------------------------------------ doc khung hinh
  const so = (v, mac) => { const n = parseFloat(v); return isFinite(n) ? n : mac; };
  /** "32px 0" | "32px" | "0px 6px" | "none" -> { x, y, xu, yu } (xu / yu: don vi goc) */
  function doiTranslate(v) {
    if (v == null || v === '' || v === 'none') return { x: 0, y: 0, xu: 'px', yu: 'px', co: false };
    const p = String(v).trim().split(/\s+/);
    const u = (s) => (/%$/.test(s || '') ? '%' : 'px');
    return { x: so(p[0], 0), y: so(p[1], 0), xu: u(p[0]), yu: u(p[1] || '0px'), co: true };
  }
  function doiScale(v) {
    if (v == null || v === '' || v === 'none') return null;
    const p = String(v).trim().split(/\s+/);
    const sx = so(p[0], 1);
    return { sx, sy: p.length > 1 ? so(p[1], sx) : sx };
  }
  const op = (f) => (f && f.opacity != null && f.opacity !== '' ? so(f.opacity, null) : null);
  const f6 = (n) => (Math.round(n * 10) / 10).toFixed(1);

  // ------------------------------------------------------------------ doi khung hinh
  /** Do dai lat trang (px): theo chieu cao trang, 40–72 px (dien thoai ngan hon) */
  function doLat(el) {
    const oThe = el.closest ? el.closest('.sk-o-the') : null;
    const h = oThe ? oThe.clientHeight : 600;
    return Math.round(Math.max(40, Math.min(88, h * 0.13)));
  }
  // clip reveal: dong truot tu duoi len, cua so cat dung yen tai cho cua dong (le .3em cho dau / furigana)
  const LE = '.3em';
  const CUA_XONG = `inset(-${LE} -.4em -${LE} -.4em)`;
  function khungHienCat() {
    return [
      { opacity: 0, translate: '0 calc(100% + .35em)', clipPath: 'inset(calc(-100% - .65em) -.4em calc(100% + .05em) -.4em)', offset: 0 },
      { opacity: 1, offset: 0.4 },
      { opacity: 1, translate: '0 0', clipPath: CUA_XONG, offset: 1 },
    ];
  }

  /** 5. Giu cho: hoat anh hien (opacity 0 ->) cua dong da dung san o dang mo -> ro dan tu CHO */
  function doiCho(a) {
    const ef = a.effect;
    if (!ef || ef.pseudoElement || typeof ef.getKeyframes !== 'function') return false;
    const el = ef.target;
    if (!el || el.nodeType !== 1 || !el.matches || !el.matches('.sk-chu .sk-kj-dong, .sk-chu .sk-kj-tu-dong, .sk-chu .sk-vd-nghia')) return false;
    if (el.classList.contains('sk-an')) return false;
    let kf;
    try { kf = ef.getKeyframes(); } catch (e) { return false; }
    if (!kf || !kf.length || op(kf[0]) !== 0) return false;
    if (el.classList.contains('sk-kj-dong')) {
      const dd = el.querySelector(':scope > dd');
      if (!dd) return false;
      try { ef.target = dd; } catch (e) { return false; }
    }
    ef.setKeyframes([{ opacity: CHO, offset: 0 }]);
    try {
      const t = ef.getTiming();
      if (!giam() && (t.duration || 0) < 360) ef.updateTiming({ duration: 360, easing: 'cubic-bezier(.3,0,.2,1)' });
    } catch (e) {}
    DEM.cho++;
    return true;
  }

  /** 6. So trang o goc the: so dau tien dang "n/m" cua dong dau. Chi the moi (<= 900 ms tu luc hien) */
  function soTrang(san, st) {
    const dau = san.querySelector('.sk-dau .sk-nhan-nhip');
    const m = dau ? /(\d+)\s*\/\s*\d+/.exec(dau.textContent || '') : null;
    // du phong (vd "Hội thoại · nghe trọn đoạn"): muc hien tai cua muc luc (cung so voi .sk-phim)
    const phim = m ? null : san.querySelector('.sk-phim-o.is-nay[data-k]');
    const n = m ? Number(m[1]) : phim ? Number(phim.getAttribute('data-k')) + 1 : NaN;
    const so = isFinite(n) && n > 0 ? String(Math.min(99, n)).padStart(2, '0') : '';
    const bay = performance.now();
    san.querySelectorAll('.sk-o-the > .sk-the').forEach((t) => {
      if (t.classList.contains('sk-the-truoc')) { st.moc.delete(t); return; }   // the dung san: chua tinh
      if (t.classList.contains('sk-ra')) return;
      let t0 = st.moc.get(t);
      if (t0 == null) { t0 = bay; st.moc.set(t, t0); }
      // so theo dong dau: khoa sau 900 ms (dong dau doi truoc khi the cu lui). Theo muc luc (nghe tron doan): di theo
      if (m && bay - t0 > 900 && t.hasAttribute('data-pc3-so')) return;
      if (so) { if (t.getAttribute('data-pc3-so') !== so) { t.setAttribute('data-pc3-so', so); DEM.so++; } }
      else if (t.hasAttribute('data-pc3-so')) t.removeAttribute('data-pc3-so');
    });
  }

  /** 7. So thu tu net: dat ra ngoai dau net, huong xa moi net nhat (uu tien phia truoc dau net) */
  function datSoNet(san) {
    const ds = san.querySelectorAll('.sk-kj-o .bang-kanji-so text:not([data-pc3])');
    if (!ds.length) return;
    const svg = ds[0].ownerSVGElement;
    const duong = svg ? [...svg.querySelectorAll('.bang-kanji-duong')] : [];
    if (!duong.length) return;
    const diem = [];
    duong.forEach((p) => {
      try {
        const L = p.getTotalLength();
        for (let d = 0; d <= L; d += 2) { const q = p.getPointAtLength(d); diem.push([q.x, q.y]); }
      } catch (e) {}
    });
    const R = 7.5;
    ds.forEach((tx, i) => {
      tx.setAttribute('data-pc3', '1');
      const p = duong[i];
      if (!p) return;
      let a, b;
      try { a = p.getPointAtLength(0); b = p.getPointAtLength(Math.min(6, p.getTotalLength())); } catch (e) { return; }
      let dx = b.x - a.x, dy = b.y - a.y;
      const n = Math.hypot(dx, dy) || 1;
      dx /= n; dy /= n;
      let tot = null, diemTot = -Infinity;
      for (let k = 0; k < 16; k++) {
        const g = (k / 16) * Math.PI * 2;
        const cx = a.x + Math.cos(g) * R, cy = a.y + Math.sin(g) * R;
        if (cx < 11 || cy < 11 || cx > 98 || cy > 98) continue;   // trong o (svg phong 1.08 quanh tam)
        let gan = Infinity;
        for (let j = 0; j < diem.length; j++) { const e = Math.hypot(diem[j][0] - cx, diem[j][1] - cy); if (e < gan) gan = e; }
        // xa net (toi 9 don vi la du), uu tien phia sau huong viet (dung truoc dau net)
        const dk = Math.min(gan, 9) - 1.2 * (Math.cos(g) * dx + Math.sin(g) * dy);
        if (dk > diemTot) { diemTot = dk; tot = [cx, cy]; }
      }
      if (!tot) return;
      tx.setAttribute('x', tot[0].toFixed(1));
      tx.setAttribute('y', tot[1].toFixed(1));
      tx.setAttribute('text-anchor', 'middle');
      tx.setAttribute('dominant-baseline', 'central');
      DEM.net++;
    });
  }

  /** Mot hoat anh vua tao trong san khau: nhan dang theo dich + hinh khung, doi khung hinh tai cho */
  function doiKhoa(a) {
    const ef = a.effect;
    if (!ef || typeof ef.getKeyframes !== 'function' || typeof ef.setKeyframes !== 'function') return;
    if (ef.pseudoElement) return;
    const el = ef.target;
    if (!el || el.nodeType !== 1 || !el.classList) return;
    let kf;
    try { kf = ef.getKeyframes(); } catch (e) { return; }
    if (!kf || !kf.length || kf.length > 3) return;
    const f0 = kf[0], f1 = kf[kf.length - 1];
    const t0 = doiTranslate(f0.translate), t1 = doiTranslate(f1.translate);
    const cl = el.classList;

    // 4. con tro doc: vach o day hop -> scale doc 1, bu translate doc de day hop truot dung
    const laTroDaoDien = cl.contains('sk-con-tro');
    const laTroChu = !laTroDaoDien && el.tagName === 'B' && el.parentElement && el.parentElement.classList.contains('sk-chu-tro')
      && el.parentElement.children[1] === el;
    if (laTroDaoDien || laTroChu) {
      if (kf.length !== 1 || !t0.co) return;
      const sc = doiScale(f0.scale) || { sx: 1, sy: 1 };
      const h = so(el.style.height, 0);
      if (!h) return;
      // vi tri DAY hop luc bat dau (= vach cu) so voi vi tri cuoi (translate cuoi: trong style, hoac 0)
      const y = t0.y + h * (sc.sy - 1);
      const tc = doiTranslate(el.style.translate);
      const lech = y - tc.y;
      if (Math.abs(lech) > 6) {
        // doi dong: vach KHONG truot cheo qua chu — thu ve dau trai tai cho cu, roi ke lai tu trai
        // duoi cho moi (nhu nguoi doc gach chan dong ke tiep). Cung luc bat dau, dai hon mot chut.
        const cuoi = `${f6(tc.x)}px ${f6(tc.y)}px`;
        ef.setKeyframes([
          { translate: `${f6(t0.x)}px ${f6(y)}px`, scale: `${sc.sx.toFixed(4)} 1`, offset: 0 },
          { translate: `${f6(t0.x)}px ${f6(y)}px`, scale: '0.001 1', offset: 0.42 },
          { translate: cuoi, scale: '0.001 1', offset: 0.5 },
          { translate: cuoi, scale: '1 1', offset: 1 },
        ]);
        try {
          const t = ef.getTiming();
          ef.updateTiming({ duration: Math.max(t.duration || 0, 420), easing: 'cubic-bezier(.45,0,.2,1)' });
        } catch (e) {}
        DEM.tro++;
        return;
      }
      if (Math.abs(sc.sy - 1) < 0.002) return;
      ef.setKeyframes([{ translate: `${f6(t0.x)}px ${f6(y)}px`, scale: `${sc.sx.toFixed(4)} 1`, offset: 0 }]);
      DEM.tro++;
      return;
    }
    if (el.closest('.sk-chu-tro, .sk-ht-con-tro, .sk-chip, .sk-phim, .sk-lop-bay, .sk-dau')) return;

    // 1a. the (khung dao dien) ra / vao: ngang +-32 px -> doc
    if (el.matches('.sk-o-the > .sk-the')) {
      if (kf.length === 2 && op(f1) === 0 && t1.co && t1.x < -1 && Math.abs(t1.y) < 0.5) {
        // noi dung cu giu nguyen do dam gan nua quang duong (chui duoi mep dai dau trang), roi mo han
        ef.setKeyframes([{ opacity: 1, translate: '0 0', offset: 0 }, { opacity: 0.9, offset: 0.5 },
          { opacity: 0, translate: `0 -${Math.round(doLat(el) * 1.25)}px`, offset: 1 }]);
        DEM.the++;
      } else if (kf.length === 1 && op(f0) === 0 && t0.co && t0.x > 1 && Math.abs(t0.y) < 0.5) {
        ef.setKeyframes([{ opacity: 0, translate: `0 ${Math.round(doLat(el) * 1.15)}px`, offset: 0 }, { opacity: 1, offset: 0.55 }]);
        DEM.the++;
      }
      return;
    }
    // 1b. lat the chuong / ket bai (cung khung): noi dung cu mo -> truot len + mo; lop moi hien -> dang len
    const cha = el.parentElement;
    if (cl.contains('sk-the-lat') && kf.length === 1 && op(f0) === 0 && !t0.co) {
      ef.setKeyframes([{ opacity: 0, translate: `0 ${doLat(el)}px`, offset: 0 }, { opacity: 1, offset: 0.6 }]);
      DEM.lat++;
      return;
    }
    if (cha && cha.classList.contains('sk-the-than') && cl.contains('sk-ra') && kf.length === 2 && !t0.co && !t1.co
      && op(f0) === 1 && op(f1) === 0) {
      ef.setKeyframes([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: `0 -${Math.round(doLat(el) * 0.8)}px` }]);
      DEM.lat++;
      return;
    }
    // 1c. cung slide: khoi cau / giai thich cu lui -24 px ngang -> len
    if (cl.contains('sk-ra') && kf.length === 2 && op(f1) === 0 && t1.co && t1.x < -1 && Math.abs(t1.y) < 0.5) {
      ef.setKeyframes([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: `0 ${f6(t1.x)}px` }]);
      DEM.cung++;
      return;
    }
    // 3. doi duoi (truot doc 40%): them mat na tai cho
    if (t0.yu === '%' || t1.yu === '%') {
      if (kf.length === 2 && op(f1) === 0 && t1.co && t1.yu === '%' && t1.y < 0 && t1.x === 0) {
        const d = Math.abs(t1.y);
        ef.setKeyframes([
          { opacity: 1, translate: '0 0', clipPath: CUA_XONG },
          { opacity: 0, translate: `0 -${d}%`, clipPath: `inset(calc(${d}% - ${LE}) -.4em calc(-${d}% - ${LE}) -.4em)` },
        ]);
        DEM.doi++;
      } else if (kf.length === 1 && op(f0) === 0 && t0.co && t0.yu === '%' && t0.y > 0 && t0.x === 0) {
        const d = t0.y;
        ef.setKeyframes([
          { opacity: 0, translate: `0 ${d}%`, clipPath: `inset(calc(-${d}% - ${LE}) -.4em calc(${d}% - ${LE}) -.4em)`, offset: 0 },
          { translate: '0 0', clipPath: CUA_XONG, offset: 1 },
        ]);
        DEM.doi++;
      }
      return;
    }
    // 2. dong phu hien (opacity 0 + nhich 3–8 px xuong) -> clip reveal
    const laHien = op(f0) === 0 && t0.co && t0.x === 0 && t0.y >= 3 && t0.y <= 8
      && (kf.length === 1 || (kf.length === 2 && (op(f1) == null || op(f1) === 1) && Math.abs(t1.y) < 0.5));
    if (laHien) {
      let d = 'block';
      try { d = getComputedStyle(el).display; } catch (e) {}
      if (d === 'inline' || d === 'contents' || d === 'none') return;
      ef.setKeyframes(khungHienCat());
      DEM.hien++;
      try {
        const t = ef.getTiming();
        if ((t.duration || 0) < 380) ef.updateTiming({ duration: 380 });
      } catch (e) {}
    }
  }

  // ------------------------------------------------------------------ quan sat
  function xet(san, st) {
    if (!dangBat(san)) return;
    try { soTrang(san, st); } catch (e) {}
    try { datSoNet(san); } catch (e) {}
    if (typeof san.getAnimations !== 'function') return;
    const g = giam();
    let ds;
    try { ds = san.getAnimations({ subtree: true }); } catch (e) { return; }
    for (let i = 0; i < ds.length; i++) {
      const a = ds[i];
      if (st.da.has(a)) continue;
      st.da.add(a);
      if (typeof CSSAnimation !== 'undefined' && a instanceof CSSAnimation) continue;
      if (typeof CSSTransition !== 'undefined' && a instanceof CSSTransition) continue;
      try {
        if (doiCho(a)) continue;
        if (!g) doiKhoa(a);
      } catch (e) { /* khong bao gio lam hong san khau */ }
    }
  }

  function batDau(san) {
    if (!san || san.nodeType !== 1 || DS.has(san) || typeof MutationObserver !== 'function') return false;
    const st = { mo: null, raf: 0, da: new WeakSet(), moc: new WeakMap() };
    const henKhung = () => { st.raf = 0; xet(san, st); };
    st.mo = new MutationObserver(() => {
      xet(san, st);
      // hoat anh tao muon hon mot vi-tac-vu sau thay doi DOM: bat kip truoc khi ve khung hinh
      if (!st.raf && typeof requestAnimationFrame === 'function') st.raf = requestAnimationFrame(henKhung);
    });
    st.mo.observe(san, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'data-phong-cach'] });
    DS.set(san, st);
    xet(san, st);
    return true;
  }
  function ketThuc(san) {
    const ds = san ? [[san, DS.get(san)]] : [...DS.entries()];
    ds.forEach(([s, st]) => {
      if (!st) return;
      try { st.mo.disconnect(); } catch (e) {}
      if (st.raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(st.raf);
      try { s.querySelectorAll('[data-pc3-so]').forEach((t) => t.removeAttribute('data-pc3-so')); } catch (e) {}
      DS.delete(s);
    });
    return true;
  }

  window.SenseiPhongCach = window.SenseiPhongCach || {};
  window.SenseiPhongCach[TEN] = {
    batDau, ketThuc, ten: 'Tạp chí tối giản',
    get dem() { return Object.assign({ dangQuanSat: DS.size }, DEM); },   // chan doan (kiem thu)
  };
})();
