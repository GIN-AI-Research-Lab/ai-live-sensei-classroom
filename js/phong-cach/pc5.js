/* ==========================================================================
   Phong cach san khau giang 5 — "Nhip chu" (N5 bai 5), ban tinh chinh
   Mot tieu diem, mot mau nen, mot diem nhan. JS nay chi lam ba viec, khong doi LUC nao thu gi hien ra
   (moc cue, hen gio, thu tu cua dao dien giu nguyen) va khong boc ham nao cua SenseiMotion:

   (1) TAM NEN tren mat the tinh (.sk-mat::before, css/phong-cach/pc5.css): moi khi the song doi (hoac bo cuc cua
       no doi), do bo cuc (offsetLeft/Top — bo qua transform dang chay) cua phan tu neo theo dang nhip roi dat
       --pc5-t/r/b/l len .sk-mat. Hai nhip cung hinh -> tam nen dung yen qua luc doi nhip; khac hinh -> CSS truot
       clip-path. Tam nen khong nam trong noi dung the nen KHONG BAO GIO tat theo the cu (khong khung trang).
   (2) VACH DOC: doc con tro cua dao dien (.sk-con-tro + the.__ctEl; .sk-chu-tro doc toa do 6 manh) -> phan tu
       dang noi; ve MOT vach 3px o lop phu cua san khau, neo vao day chu + 4px (do duong co so bang mot o do
       rong 0 chen tam roi go ngay) — khoi nhieu dong: vach doc ben trai. Chu karaoke (cau vi du / thoai) chi
       doi mau (lop pc5-noi), chu chua doc mo .35 (pc5-sau). Doi the: vach mo di, hien lai o the moi.
   (3) THANH CHI BAO day phim: mot thanh 3px trong .sk-phim-ray, truot toi o hien tai CUNG dong ho voi hieu ung
       truot day cua dao dien (chep delay / duration / easing + startTime) -> tren man hinh gan nhu dung yen o
       moc 30%, cac o truot qua ben duoi.
   Them: hieu ung vao / ra cap the cua dao dien bi bo truot +-32px (chi con cheo mo, giu duration + easing)
   -> noi dung cheo mo tren tam nen dung yen. The moi hien som 40 ms, the cu mo linear -> khong khung rong
   (luc chu moi bat dau hien, chu cu con ~.28). The "cung slide" (mau cau -> vi du): the cu mo ca the cung
   nhip (the moi o pc5 trong suot -> khong de hai hang cong thuc in chong nhau).
   Chi hoat dong khi #sanKhauGiang co data-phong-cach="pc5". Duoi prefers-reduced-motion: tam nen / vach doi
   ngay (CSS), khong dong bo truot thanh chi bao.

   Dang ky: window.SenseiPhongCach.pc5 = { batDau(stageEl), ketThuc(stageEl) }.
   ========================================================================== */
(function () {
  'use strict';

  const TEN = 'pc5';
  const E_OUT = 'cubic-bezier(.22,1,.36,1)';
  const LOP_DANH = ['pc5-noi', 'pc5-sau', 'pc5-doc'];

  // Ung vien dich cua con tro canh chu (doc toa do con tro -> phan tu trung khop nhat)
  const UNG_VIEN = '.sk-chu-noi, .sk-vd-tok, .sk-np-chip, .sk-np-o, .sk-np-lit, .sk-kj-gt, .sk-kj-o, .sk-kj-tu-w, '
    + '.sk-np-bh-cot, .sk-vd-chip, .sk-tv-bien-tu, .sk-np-o-khung, .sk-np-cau, .sk-kj-tu-dong';
  const TOK = '.sk-vd-tok, .sk-c-tok';
  const CAU = '.sk-vd-cau, .sk-c-cau';
  const TOK_MAU = '.sk-vd-tok, .sk-ht-tok, .sk-c-tok';   // chi cac chu nay doi mau khi dang noi
  // Khoi nhieu dong (doan giai thich) -> vach doc ben trai thay vi gach chan
  const KHOI = '.sk-np-cau, .sk-np-meo, .sk-np-vh, .sk-tv-meo, .sk-tv-nghia, .sk-kj-nghia, .sk-vd-nghia, .sk-ht-nghia, .qz-text, .sk-bt-goi, .sk-np-ten, .sk-ht-khac';

  const st = {
    san: null, cho: null, moCho: null, mo: null, raf: 0, bat: false,
    noiEl: null, cau: null, danh: new Set(), lop: null, gach: null, gachThe: null, gachKieu: '', gachTf: '',
    gachs: null, mat: null, nenKhoa: '', chiKhoa: '', coDo: new WeakMap(), anims: new Set(),
  };

  const giam = () => { try { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } };
  const dangBat = () => !!(st.san && st.san.isConnected && st.san.getAttribute('data-phong-cach') === TEN);
  const canhBao = (noi, e) => { try { console.warn('[pc5] ' + noi, e); } catch (x) {} };
  const px = (v) => (Math.round(v * 10) / 10) + 'px';

  // ------------------------------------------------------------------ tien ich
  function tachXY(s) {
    const a = String(s || '').trim().split(/\s+/).map((x) => parseFloat(x));
    return [isFinite(a[0]) ? a[0] : 0, isFinite(a[1]) ? a[1] : 0];
  }
  function iou(a, b) {
    const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const i = x * y;
    const u = a.width * a.height + b.width * b.height - i;
    return u > 0 ? i / u : 0;
  }
  const hop = (l, t, w, h) => ({ left: l, top: t, width: w, height: h, right: l + w, bottom: t + h });
  function danh(el, lop, on) {
    if (!el || !el.classList) return;
    if (on) { if (!el.classList.contains(lop)) el.classList.add(lop); st.danh.add(el); } else el.classList.remove(lop);
  }
  const oThe = () => st.san && st.san.querySelector('.sk-o-the');
  /** The dang giang: con trong o the, khong dang ra, khong dung san, da duoc mo (opacity khac '0') */
  function theSong() {
    const o = oThe();
    if (!o) return null;
    for (const t of o.children) {
      if (t.classList.contains('sk-the') && !t.classList.contains('sk-ra') && !t.classList.contains('sk-the-truoc')
        && t.style.opacity !== '0') return t;
    }
    return null;
  }
  /**
   * Hop BO CUC cua el so voi goc (cong offsetLeft/Top theo chuoi offsetParent): bo qua moi transform / translate
   * dang chay (the dang vao, chu dang truot) -> vi tri CUOI. Chuoi khong toi goc: doc rect (co transform).
   */
  function boCuc(el, goc) {
    if (!el || !goc) return null;
    if (!(el instanceof HTMLElement)) {
      const r = el.getBoundingClientRect(), g = goc.getBoundingClientRect();
      return hop(r.left - g.left, r.top - g.top, r.width, r.height);
    }
    let x = 0, y = 0, e = el;
    while (e && e !== goc) {
      x += e.offsetLeft; y += e.offsetTop;
      const p = e.offsetParent;
      if (!p) break;
      if (p !== goc && !goc.contains(p)) { e = null; break; }
      if (p !== goc) { x += p.clientLeft; y += p.clientTop; }
      e = p;
    }
    if (e !== goc) {
      const r = el.getBoundingClientRect(), g = goc.getBoundingClientRect();
      return hop(r.left - g.left, r.top - g.top, r.width, r.height);
    }
    return hop(x, y, el.offsetWidth, el.offsetHeight);
  }
  function hienThay(el) {
    if (!el || !el.isConnected) return false;
    if (el instanceof HTMLElement && !el.offsetWidth && !el.offsetHeight) return false;
    for (let x = el; x && !x.classList.contains('sk-the'); x = x.parentElement) {
      if (x.hidden || (x.classList && (x.classList.contains('sk-ra')))) return false;
    }
    return true;
  }
  function timNeo(the, ds) {
    for (const sel of ds) {
      for (const el of the.querySelectorAll(sel)) if (hienThay(el)) return el;
    }
    return null;
  }

  // ------------------------------------------------------------------ (1) tam nen
  /** Hinh tam nen cho the song: {t, r, b, l} (px, lui vao tu mep mat the) hoac null (an) */
  function hinhNen(the, o) {
    const W = o.clientWidth, H = o.clientHeight;
    if (!W || !H) return null;
    if (the.dataset.lat) return { t: 0, r: 0, b: 0, l: 0 };          // the chuong / ket bai: ca the
    const rong = the.clientWidth >= 620;
    const k = the.dataset.kind;
    const cot = (a, b) => {                                          // cot trai: tu mep trai toi giua khe hai cot
      const A = boCuc(a, o), B = b ? boCuc(b, o) : null;
      const mep = B && B.left > A.right ? (A.right + B.left) / 2 : A.right + 24;
      return { t: 0, b: 0, l: 0, r: Math.max(0, W - mep) };
    };
    const dai = (el, dem, sau) => {                                  // dai ngang tran mep quanh el
      const A = boCuc(el, o);
      const d = dem != null ? dem : Math.max(14, Math.min(26, A.height * 0.3));
      let day = A.bottom + d;
      // phan tu ngay duoi (vd cac lua chon): mep duoi dai dung giua khe, khong cham vao no
      const S = sau && hienThay(sau) ? boCuc(sau, o) : null;
      if (S && S.top > A.bottom) day = Math.min(day, (A.bottom + S.top) / 2);
      return { l: 0, r: 0, t: Math.max(0, A.top - d), b: Math.max(0, H - day) };
    };
    const tren = (el, giua, dem) => {                                // tu dinh the toi giua / day el
      const A = boCuc(el, o);
      const y = giua ? A.top + A.height / 2 : A.bottom + (dem || 18);
      return { l: 0, r: 0, t: 0, b: Math.max(0, H - y) };
    };
    let el;
    switch (k) {
      case 'vocab': {
        const luoi = the.querySelector('.sk-tv-luoi');
        if (luoi && luoi.classList.contains('co-hinh')) {
          const hinh = timNeo(the, ['.sk-tv-hinh']);
          if (rong) { const a = timNeo(the, ['.sk-tv-trai']); if (a) return cot(a, the.querySelector('.sk-tv-phai')); }
          else if (hinh) return tren(hinh, true);
        }
        el = timNeo(the, ['.sk-tv-dau', '.sk-tv-tu']);
        return el ? (rong ? dai(el, 26) : tren(el, false, 16)) : null;
      }
      case 'kanji': {
        if (rong) { const a = timNeo(the, ['.sk-kj-trai']); if (a) return cot(a, the.querySelector('.sk-kj-phai')); }
        // the hep: o chu + ten + nghia cung nam tren tam nen (mep tam nen khong cat ngang dong nghia)
        el = timNeo(the, ['.sk-kj-o']);
        return el ? tren(el, false, 18) : null;
      }
      case 'grammar-intro':
        el = timNeo(the, ['.sk-np-cong .sk-np-hang', '.sk-np-hang', '.sk-np-bien', '.sk-np-cong']);
        return el ? dai(el, 18) : null;
      case 'example':
        el = timNeo(the, ['.sk-vd-mau .sk-np-hang', '.sk-vd-mau', '.sk-vd-cau']);
        return el ? dai(el, 18) : null;
      case 'kaiwa-intro': {
        const a = timNeo(the, ['.sk-ht-cot-vai']);
        if (a && rong) return cot(a, the.querySelector('.sk-ht-cot-truyen'));
        return a ? dai(a, 12) : null;
      }
      case 'kaiwa':
      case 'kaiwa-run':
        el = timNeo(the, ['.sk-ht-dong.is-nay .sk-ht-bong', '.sk-ht-bong']);
        return el ? dai(el, 16) : null;
      case 'quiz':
        el = timNeo(the, ['.qz-q', '.sk-bt-q']);
        return el ? dai(el, 22, el.parentElement && el.parentElement.querySelector(':scope > .qz-opts')) : null;
      default:
        return null;
    }
  }
  function datNen(the) {
    const o = oThe();
    const mat = o && o.querySelector(':scope > .sk-mat');
    if (!mat) return;
    if (st.mat && st.mat !== mat) boNen(st.mat);
    st.mat = mat;
    let h = null;
    try { h = the ? hinhNen(the, o) : null; } catch (e) { canhBao('tam nen', e); h = null; }
    if (!h) {
      if (mat.getAttribute('data-pc5-nen') !== 'an') { mat.setAttribute('data-pc5-nen', 'an'); st.nenKhoa = ''; }
      return;
    }
    const khoa = [h.t, h.r, h.b, h.l].map((v) => Math.round(v)).join(',');
    if (khoa === st.nenKhoa && mat.getAttribute('data-pc5-nen') === 'hien') return;
    const tuc = mat.getAttribute('data-pc5-nen') !== 'hien';        // dang an -> dat hinh ngay roi mo len
    if (tuc) mat.setAttribute('data-pc5-tuc', '');
    mat.style.setProperty('--pc5-t', px(h.t));
    mat.style.setProperty('--pc5-r', px(h.r));
    mat.style.setProperty('--pc5-b', px(h.b));
    mat.style.setProperty('--pc5-l', px(h.l));
    if (tuc) {
      try { void getComputedStyle(mat, '::before').clipPath; } catch (e) {}
      mat.removeAttribute('data-pc5-tuc');
    }
    mat.setAttribute('data-pc5-nen', 'hien');
    st.nenKhoa = khoa;
  }
  function boNen(mat) {
    if (!mat) return;
    ['--pc5-t', '--pc5-r', '--pc5-b', '--pc5-l'].forEach((k) => mat.style.removeProperty(k));
    mat.removeAttribute('data-pc5-nen');
    mat.removeAttribute('data-pc5-tuc');
  }

  // ------------------------------------------------------------------ (2) chu dang noi + vach doc
  /** Hop con tro canh chu tu style cua 6 manh (trang thai CUOI, khong phai giua luc truot) */
  function hopTroChu(g) {
    const b = g.children;
    if (!b || b.length < 2) return null;
    const p0 = b[0].style, p1 = b[1].style;
    const w = parseFloat(p0.width), h = parseFloat(p1.height);
    if (!(w > 1) || !(h > 1)) return null;
    const x = tachXY(p0.translate)[0], y = tachXY(p1.translate)[1];
    const ref = g.offsetParent || g.parentElement;
    if (!ref) return null;
    const r = ref.getBoundingClientRect();
    return hop(r.left + ref.clientLeft + x, r.top + ref.clientTop + y, w, h);
  }
  function timTheoHop(root, k) {
    let tot = null, diem = 0.3;
    root.querySelectorAll(UNG_VIEN).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const d = iou(r, k);
      if (d > diem) { diem = d; tot = el; }
    });
    return tot;
  }
  function laKhoi(el) {
    if (!el.matches || !el.matches(KHOI)) return false;
    try {
      const cs = getComputedStyle(el);
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
      return el.offsetHeight > lh * 1.9;
    } catch (e) { return false; }
  }
  const CJK = /[぀-ヿ㐀-鿿＀-￯]/;
  /**
   * Duong co so dong cuoi cua el (px tu dinh bo cuc cua el). Chi voi phan tu chua chu noi dong (khong flex /
   * grid, khong con khoi): chen tam mot o rong 0 cao 0 dat tren duong co so, doc vi tri, go ngay (cung tac vu,
   * khong khung hinh nao thay). Cache theo co chu + cao cua el.
   */
  function coSo(el, o) {
    let cs;
    try { cs = getComputedStyle(el); } catch (e) { return null; }
    const fs = parseFloat(cs.fontSize) || 16;
    const khoa = el.offsetWidth + 'x' + el.offsetHeight + '@' + fs;
    const c = st.coDo.get(el);
    if (c && c.khoa === khoa) return c;
    let dy = null;
    const d = cs.display;
    const noiDong = /^(inline|inline-block|block|list-item|flow-root)$/.test(d)
      && [...el.children].every((x) => { try { const dx = getComputedStyle(x).display; return /^(inline|ruby|none|contents)/.test(dx); } catch (e) { return false; } });
    if (noiDong && el.textContent.trim()) {
      const p = document.createElement('i');
      p.className = 'pc5-do';
      p.setAttribute('aria-hidden', 'true');
      p.style.cssText = 'display:inline-block;width:0;height:0;margin:0;padding:0;border:0;vertical-align:baseline';
      el.appendChild(p);
      const a = boCuc(p, o), b = boCuc(el, o);
      p.remove();
      if (a && b) dy = a.top - b.top;
    }
    const v = { khoa, dy, fs, cjk: CJK.test(el.textContent || '') };
    st.coDo.set(el, v);
    return v;
  }
  function lopPhu() {
    if (st.lop && st.lop.isConnected) return st.lop;
    const l = document.createElement('div');
    l.className = 'pc5-lop';
    l.setAttribute('aria-hidden', 'true');
    // hai vach luan phien: doi the / doi kieu -> vach cu mo tai cho, vach kia hien o cho moi (khong bay ngang the)
    st.gachs = [0, 1].map(() => { const g = document.createElement('i'); g.className = 'pc5-gach'; l.appendChild(g); return g; });
    st.san.appendChild(l);
    st.lop = l; st.gach = st.gachs[0]; st.gachTf = ''; st.gachThe = null;
    return l;
  }
  function anGach() {
    (st.gachs || []).forEach((g) => g.classList.remove('is-hien'));
    st.gachThe = null;
  }
  /** Ve vach duoi (hoac ben trai) el. the: the chua el — doi the thi vach mo roi hien lai tai cho moi */
  function datGach(el, the) {
    if (!el || !the || the.dataset.lat) { anGach(); return; }
    const o = oThe();
    if (!o) return;
    lopPhu();
    const r = boCuc(el, o);
    if (!r || !r.width || !r.height) { anGach(); return; }
    const so = st.san.getBoundingClientRect(), ro = o.getBoundingClientRect();
    const ox = ro.left - so.left, oy = ro.top - so.top;
    const nho = window.innerWidth <= 640;
    const day = nho ? 2.5 : 3;
    let kieu, tf;
    if (laKhoi(el)) {
      // khoi nhieu dong: vach doc sat mep trai (meo co vach tinh -> trung vach tinh; khong thi lui 12 px)
      let cs = null; try { cs = getComputedStyle(el); } catch (e) {}
      const coVach = cs && parseFloat(cs.borderLeftWidth) > 0;
      const x = r.left + (coVach ? 0 : -12);
      const inset = Math.min(6, r.height * 0.08);
      kieu = 'doc';
      tf = `translate(${px(ox + x)}, ${px(oy + r.top + inset)}) scale(${day}, ${(r.height - 2 * inset).toFixed(1)})`;
    } else {
      const c = coSo(el, o);
      let y;
      if (c && c.dy != null && c.dy > 0 && c.dy <= r.height + 2) {
        // day chu: CJK ~ .12em duoi duong co so; Latin: chua cho net ha (~.2em)
        y = r.top + c.dy + c.fs * (c.cjk ? 0.12 : 0.2) + 4;
      } else y = r.bottom + 6;
      const le = Math.min(4, r.width * 0.04);
      kieu = 'ngang';
      tf = `translate(${px(ox + r.left + le)}, ${px(oy + y)}) scale(${(r.width - 2 * le).toFixed(1)}, ${day})`;
    }
    let g = st.gach;
    const moi = the !== st.gachThe || kieu !== st.gachKieu || !g.classList.contains('is-hien');
    if (!moi && tf === st.gachTf) return;
    if (moi) {
      // vi tri moi khong truot tu cho cu: vach dang hien mo tai cho, vach kia dat ngay (an) roi mo len
      if (g.classList.contains('is-hien')) { g.classList.remove('is-hien'); g = st.gach = st.gachs[st.gachs[0] === g ? 1 : 0]; }
      g.classList.add('is-tuc');
      g.classList.remove('is-hien');
      g.style.transform = tf;
      void g.offsetWidth;
      g.classList.remove('is-tuc');
      g.classList.add('is-hien');
    } else g.style.transform = tf;
    st.gachThe = the; st.gachKieu = kieu; st.gachTf = tf;
  }
  function capNhat() {
    st.raf = 0;
    if (!dangBat()) return;
    const the = theSong();
    let el = null;
    if (the) {
      const ct = the.querySelector(':scope > .sk-con-tro.is-hien');
      if (ct && the.__ctEl && the.__ctEl.isConnected) el = the.__ctEl;
      else {
        const g = the.querySelector('.sk-chu-tro.is-hien');
        const k = g && hopTroChu(g);
        if (k) el = timTheoHop(g.closest('.sk-canh') || the, k);
      }
    }
    try { datNen(the); } catch (e) { canhBao('nen', e); }
    try { datGach(el, the); } catch (e) { canhBao('vach', e); }
    const mau = el && el.matches && el.matches(TOK_MAU) ? el : null;
    if (mau !== st.noiEl) {
      if (st.noiEl) danh(st.noiEl, 'pc5-noi', false);
      st.noiEl = mau;
      if (mau) danh(mau, 'pc5-noi', true);
    }
    // karaoke cau vi du: chu chua noi mo (cau thoai dung .is-doc cua dao dien)
    const tok = el && el.closest ? el.closest(TOK) : null;
    const cau = tok ? tok.closest(CAU) : null;
    if (st.cau && st.cau !== cau) xoaCau(st.cau);
    if (cau) {
      const ds = [...cau.querySelectorAll(TOK)];
      const k = ds.indexOf(tok);
      ds.forEach((t, j) => danh(t, 'pc5-sau', j > k));
      danh(cau, 'pc5-doc', true);
      st.cau = cau;
    }
    try { datChi(); } catch (e) { canhBao('chi bao', e); }
    // phan tu da roi san khau: go lop
    st.danh.forEach((x) => { if (!st.san.contains(x)) { LOP_DANH.forEach((l) => x.classList.remove(l)); st.danh.delete(x); } });
  }
  function xoaCau(cau) {
    if (!cau) return;
    cau.classList.remove('pc5-doc');
    cau.querySelectorAll('.pc5-sau').forEach((t) => t.classList.remove('pc5-sau'));
    if (st.cau === cau) st.cau = null;
  }
  function hen() { if (!st.raf) st.raf = requestAnimationFrame(capNhat); }

  // ------------------------------------------------------------------ (3) thanh chi bao day phim
  function datChi() {
    const ray = st.san.querySelector('.sk-phim-ray');
    if (!ray) return;
    let chi = ray.querySelector(':scope > .pc5-chi');
    let moi = false;
    if (!chi) {
      chi = document.createElement('i');
      chi.className = 'pc5-chi';
      chi.setAttribute('aria-hidden', 'true');
      ray.appendChild(chi);
      moi = true;
      st.chiKhoa = '';
    }
    const o = ray.querySelector(':scope > .sk-phim-o.is-nay');
    if (!o || (ray.closest('.sk-phim') || {}).hidden) { chi.classList.remove('is-hien'); st.chiKhoa = ''; return; }
    let le = 12;
    try { le = parseFloat(getComputedStyle(o).paddingLeft) || 12; } catch (e) {}
    const x = o.offsetLeft + le, w = Math.max(8, o.offsetWidth - 2 * le);
    const khoa = Math.round(x) + ':' + Math.round(w);
    if (khoa === st.chiKhoa && chi.classList.contains('is-hien')) return;
    const tf = `translate(${px(x)}, 0) scaleX(${w.toFixed(1)})`;
    const truoc = chi.style.transform;
    chi.style.transform = tf;
    st.chiKhoa = khoa;
    if (moi || !truoc || !chi.classList.contains('is-hien') || giam()) { chi.classList.add('is-hien'); return; }
    // dong bo voi hieu ung truot day cua dao dien (cung delay / duration / easing, cung startTime)
    let a = null;
    try {
      a = ray.getAnimations().find((z) => {
        const ef = z.effect;
        return ef && ef.target === ray && z.playState !== 'finished' && ef.getKeyframes().some((kf) => kf.translate != null);
      }) || null;
    } catch (e) { a = null; }
    let tg = { duration: 360, delay: 0, easing: E_OUT };
    if (a) { try { const t = a.effect.getTiming(); tg = { duration: Number(t.duration) || 360, delay: Number(t.delay) || 0, easing: t.easing || E_OUT }; } catch (e) {} }
    const an = chi.animate([{ transform: truoc }, { transform: tf }], { ...tg, fill: 'backwards' });
    st.anims.add(an);
    const xong = () => st.anims.delete(an);
    an.finished.then(xong, xong);
    if (a) {
      const dong = () => { try { if (a.startTime != null) an.startTime = a.startTime; } catch (e) {} };
      if (a.startTime != null) dong(); else a.ready.then(dong, () => {});
    }
  }

  // ------------------------------------------------------------------ doi the: chi cheo mo
  /** Bo truot +-32px trong keyframe cap the cua dao dien; giu opacity + delay + duration + easing */
  function chiMo(el) {
    el.getAnimations().forEach((a) => {
      const ef = a.effect;
      if (!ef || typeof ef.getKeyframes !== 'function' || ef.target !== el) return;
      const kf = ef.getKeyframes();
      if (!kf.some((k) => k.translate && k.translate !== 'none' && k.translate !== '0px' && k.translate !== '0px 0px')) return;
      try { ef.setKeyframes(kf.map((k) => { const n = { offset: k.offset, opacity: k.opacity }; if (k.easing) n.easing = k.easing; return n; })); } catch (e) {}
    });
  }
  /** Hieu ung opacity cap the cua dao dien tren el (khong phai cua pc5) */
  function animThe(el) {
    return el.getAnimations().filter((a) => {
      const ef = a.effect;
      return ef && ef.target === el && !st.anims.has(a) && typeof ef.getKeyframes === 'function'
        && ef.getKeyframes().some((k) => k.opacity != null);
    });
  }
  /**
   * Cheo mo that (khong co khung hinh trong): the moi bat dau hien som 40 ms, the cu mo deu (linear) —
   * luc the moi bat dau, noi dung cu chi con ~.28 va tat han sau 50 ms -> khong in de ro, khong khung rong.
   */
  function cheoNoi(the, cu) {
    animThe(the).forEach((a) => {
      try {
        const t = a.effect.getTiming(), d = Number(t.delay) || 0;
        if (d >= 150 && (a.currentTime == null || a.currentTime < d - 40)) a.effect.updateTiming({ delay: d - 40 });
      } catch (e) {}
    });
    if (cu) animThe(cu).forEach((a) => { try { a.effect.updateTiming({ easing: 'linear' }); } catch (e) {} });
  }
  /**
   * The "cung slide" (mau cau -> vi du, vi du -> vi du): dao dien giu the cu (chi mo phan ngoai hang cong thuc)
   * va phu the moi len tren; o pc5 the moi trong suot (de tam nen thay) nen hai hang cong thuc — KHONG trung
   * khit (o dien cua vi du rong hon) — se in de nhau ~450 ms. O day: ca the cu mo deu cung nhip the moi hien
   * (cheo mo that, tam nen dung yen), bo moi truot ngang cua cac khoi ben trong.
   */
  function cheoCungSlide(the) {
    const tc = [...the.parentElement.children].find((x) => x !== the && x.classList.contains('sk-the')
      && !x.classList.contains('sk-the-truoc') && !x.__pc5Cung);
    if (!tc) return;
    tc.__pc5Cung = true;
    try { new Set(tc.getAnimations({ subtree: true }).map((z) => z.effect && z.effect.target).filter(Boolean)).forEach(chiMo); } catch (e) {}
    const an = tc.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'linear', fill: 'forwards' });
    st.anims.add(an);
    const xong = () => st.anims.delete(an);
    an.finished.then(xong, xong);
  }
  function khiTheVao(the) {
    if (the.__pc5Vao) return;
    the.__pc5Vao = true;
    if (giam()) return;
    try { chiMo(the); } catch (e) { canhBao('vao', e); }
    const cu = [...the.parentElement.children].find((x) => x !== the && x.classList.contains('sk-the') && x.classList.contains('sk-ra') && !x.__pc5Ra);
    if (cu) { cu.__pc5Ra = true; try { chiMo(cu); } catch (e) {} }
    if (the.classList.contains('is-phu')) { try { cheoCungSlide(the); } catch (e) { canhBao('cung slide', e); } }
    try { cheoNoi(the, cu); } catch (e) { canhBao('cheo', e); }
    // vach cua the cu mo di ngay (khong cho the cu mo het)
    anGach();
  }

  // ------------------------------------------------------------------ quan sat
  function datThuocTinhSan() {
    const ray = st.san.querySelector('.sk-phim-ray');
    const ch = (ray && ray.dataset.chuong) || '';
    if (st.san.getAttribute('data-pc5-chuong') !== ch) st.san.setAttribute('data-pc5-chuong', ch);
  }
  const laDo = (n) => n && n.nodeType === 1 && n.classList.contains('pc5-do');
  function khiDoi(ds) {
    let doiPc = false, coViec = false;
    for (const m of ds) {
      if (m.target === st.san && m.attributeName === 'data-phong-cach') doiPc = true;
      if (m.type === 'childList' && [...m.addedNodes, ...m.removedNodes].every(laDo)) continue;   // o do cua ta
      if (m.target && m.target.classList && (m.target.classList.contains('pc5-gach') || m.target.classList.contains('pc5-lop'))) continue;
      if (m.target === st.mat && m.type === 'attributes') continue;
      coViec = true;
    }
    if (doiPc && !dangBat()) { goDanh(); return; }
    if (!dangBat() || !coViec) return;
    for (const m of ds) {
      const t = m.target;
      // the cu bat dau ra: vach mo NGAY cung luc chu cu mo (khong o lai mot minh tren the trong)
      if (m.type === 'attributes' && m.attributeName === 'class' && t.classList && t.classList.contains('sk-the')
        && t.classList.contains('sk-ra') && !/\bsk-ra\b/.test(m.oldValue || '') && st.gachThe === t) { anGach(); continue; }
      if (m.type !== 'attributes' || m.attributeName !== 'style' || !t.classList || !t.classList.contains('sk-the')) continue;
      if (!t.parentElement || !t.parentElement.classList.contains('sk-o-the')) continue;
      if (t.style.opacity === '0' || t.classList.contains('sk-ra') || t.classList.contains('sk-the-truoc')) continue;
      if (!/opacity:\s*0/.test(m.oldValue || '')) continue;
      try { khiTheVao(t); } catch (e) { canhBao('the vao', e); }
    }
    try { datThuocTinhSan(); } catch (e) {}
    hen();
  }
  const khiDoiCo = () => { if (dangBat()) { st.nenKhoa = ''; st.chiKhoa = ''; hen(); } };
  function ganSan(san) {
    st.san = san;
    st.mo = new MutationObserver(khiDoi);
    st.mo.observe(san, { subtree: true, childList: true, attributes: true, attributeOldValue: true, attributeFilter: ['style', 'class', 'data-phong-cach', 'data-chuong', 'data-lat', 'hidden'] });
    window.addEventListener('resize', khiDoiCo);
    if (dangBat()) { datThuocTinhSan(); hen(); }
  }
  function goDanh() {
    if (st.raf) { cancelAnimationFrame(st.raf); st.raf = 0; }
    st.danh.forEach((x) => LOP_DANH.forEach((l) => x.classList.remove(l)));
    st.danh.clear();
    st.noiEl = null; st.cau = null;
    st.anims.forEach((a) => { try { a.cancel(); } catch (e) {} });
    st.anims.clear();
    if (st.san) {
      st.san.removeAttribute('data-pc5-chuong');
      st.san.querySelectorAll('.pc5-chi, .pc5-do').forEach((x) => x.remove());
      st.san.querySelectorAll('.sk-mat').forEach(boNen);
    }
    if (st.lop) { st.lop.remove(); }
    st.lop = null; st.gach = null; st.gachs = null; st.gachThe = null; st.gachTf = ''; st.mat = null; st.nenKhoa = ''; st.chiKhoa = '';
  }

  function batDau(stageEl) {
    if (st.bat) ketThuc(st.san);
    st.bat = true;
    const tim = () => stageEl && stageEl.isConnected ? stageEl : document.getElementById('sanKhauGiang');
    const s = tim();
    if (s) { ganSan(s); return; }
    // san khau dung luoi (dao dien tao no o nhip dau tien, ngay sau .deck-canvas): cho no xuat hien
    const thu = () => {
      const x = tim();
      if (!x || !st.bat) return false;
      if (st.cho) { clearInterval(st.cho); st.cho = null; }
      if (st.moCho) { st.moCho.disconnect(); st.moCho = null; }
      ganSan(x);
      return true;
    };
    const cha = (document.querySelector('.deck-canvas') || {}).parentElement;
    if (cha && window.MutationObserver) { st.moCho = new MutationObserver(thu); st.moCho.observe(cha, { childList: true }); }
    st.cho = setInterval(thu, 500);
  }
  function ketThuc() {
    st.bat = false;
    if (st.cho) { clearInterval(st.cho); st.cho = null; }
    if (st.moCho) { st.moCho.disconnect(); st.moCho = null; }
    if (st.mo) { st.mo.disconnect(); st.mo = null; }
    window.removeEventListener('resize', khiDoiCo);
    goDanh();
    st.san = null;
  }

  window.SenseiPhongCach = window.SenseiPhongCach || {};
  window.SenseiPhongCach[TEN] = { batDau, ketThuc };
})();
