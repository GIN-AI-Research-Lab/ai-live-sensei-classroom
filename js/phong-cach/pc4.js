/* ==========================================================================
   Phong cach san khau giang pc4 — "The hoc noi" (N5 bai 4)

   Mot bo the hoc tren giay: the chinh bo goc 24px, bong mem, MOT mau the cho moi chuong; phia sau
   chi lo MOT mep the 6px (muc KE TIEP, mau chuong cua no). Mot diem nhin, chuyen dong it va em.

   Chuyen dong (chi transform / opacity; khong doi thu gi hien — chi doi CACH hien):
   - Doi nhip = rut bai: the truoc mo + troi nhe 14px sang trai (khong nghieng); mat the tinh (.sk-mat)
     tu vi tri the sau (ha 6px, 97%) tien len cho the chinh, noi dung nhip moi hien tren no.
     Thay chuyen dong -32px / +32px cua dao dien.
   - Tu vung: the vao o MAT CHU (chu lon + cach doc giua the; hinh + nghia an nhung GIU CHO, bo cuc
     khong doi). Luc Sensei noi nghia (cue V3: con tro doc toi dong nghia) the MO tai cho: chu lon luot
     (FLIP) tu giua ve dung cho cua no, dong thoi hinh + nghia hien dan va nhich len 4px. Du phong:
     dong meo hien, het nhip, hoac 10 s sau khi the vao. Do lai mat chu (font nap, vua khung) giu nguyen
     kich thuoc nhin thay; lech con lai thi luot 320 ms — khong bao gio nhay.
   - O trong: noi dung chua noi toi (.sk-an, van giu cho) hien vach nhat dung vi tri tung dong chu ->
     the chu Han / vi du khong trong; khi Sensei noi toi, vach mo di dung luc chu hien tai cho.
   - The chuong / ket bai: dung nhip mo-roi-hien cua dao dien (khong lat); doi mau luc noi dung mo.
   - Giam chuyen dong: khong thay chuyen dong nao cua dao dien; mo the tu vung = hien dan (opacity).

   Cach bat: SenseiPhongCach.pc4.batDau(#sanKhauGiang) khi san khau co data-phong-cach="pc4";
   ketThuc(san) go het (quan sat, hieu ung, thuoc tinh, lop, o trong). Moi xu ly tu kiem data-phong-cach.
   Khong boc ham nao cua SenseiMotion: chi quan sat DOM cua san khau.
   ========================================================================== */
(function () {
  'use strict';

  const TEN = 'pc4';
  const E_RA = 'cubic-bezier(.4, 0, .7, .2)';
  const E_VAO = 'cubic-bezier(.2, .8, .2, 1)';
  const E_MO = 'cubic-bezier(.45, .05, .25, 1)';   // luot em hai dau (khoi lon di xa)
  const RA_MS = 200;            // the truoc ra (dao dien go the cu sau 220 ms)
  const VAO_MS = 420;           // the sau tien len
  const MO_MS = 620;            // chu lon luot ve cho khi mo the tu vung
  const HIEN_MS = 420;          // hinh + nghia hien dan khi mo
  const HIEN_TRE = 190;           // hinh; nghia + meo tre them (cho cach doc luot qua cho truoc)
  const AN_TOAN_MS = 10000;     // du phong: the tu vung chua mo sau 10 s thi mo

  const st = { san: null, khung: null, oThe: null, mat: null, mo: null, moSan: null, anims: new Set(), hen: new Set(), vocab: new Set(), giam: false, trong: null };

  const laBat = () => !!(st.san && st.san.getAttribute('data-phong-cach') === TEN);
  const giam = () => { try { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } };
  const warn = (noi, e) => { try { console.warn('[pc4]', noi, e); } catch (x) {} };

  function hen(fn, ms) {
    const id = setTimeout(() => { st.hen.delete(id); if (!laBat()) return; try { fn(); } catch (e) { warn('hen', e); } }, Math.max(0, ms || 0));
    st.hen.add(id);
    return id;
  }
  function chay(el, kf, o) {
    if (!el || typeof el.animate !== 'function') return null;
    let a = null;
    try { a = el.animate(kf, o); } catch (e) { warn('animate', e); return null; }
    a.__pc4 = true;
    st.anims.add(a);
    const bo = () => st.anims.delete(a);
    a.addEventListener('finish', bo);
    a.addEventListener('cancel', bo);
    return a;
  }

  // ------------------------------------------------------------------ mau theo CHUONG (khong theo tung tu)
  function mauKind(kind) {
    if (kind === 'vocab') return 'tv';
    if (kind === 'kanji') return 'kj';
    if (kind === 'grammar-intro' || kind === 'example' || (kind && kind.indexOf('grammar') === 0)) return 'np';
    if (kind && kind.indexOf('kaiwa') === 0) return 'ht';
    if (kind === 'quiz') return 'bt';
    return '';
  }
  const mauBeat = (b) => (b ? mauKind(b.kind) : '');
  function nhipSau() {
    try {
      const L = window.__lecture;
      if (!L || typeof L.beats !== 'function' || typeof L.index !== 'function') return null;
      const ds = L.beats() || [];
      const i = L.index();
      return Number.isInteger(i) ? ds[i + 1] || null : null;
    } catch (e) { return null; }
  }
  const mauTiep = () => mauBeat(nhipSau());
  function datMau(the) {
    const m = mauKind(the.dataset.kind || '') || (st.khung && st.khung.dataset.pc4Mau) || 'tv';
    if (the.dataset.pc4Mau !== m) the.dataset.pc4Mau = m;
    if (st.khung && st.khung.dataset.pc4Mau !== m) st.khung.dataset.pc4Mau = m;
    const s = mauTiep() || 'trong';
    if (st.khung && st.khung.dataset.pc4Sau !== s) st.khung.dataset.pc4Sau = s;
  }

  // ------------------------------------------------------------------ tu the (pose) cua the sau
  function buoc() {
    const w = window.innerWidth || 1024, h = window.innerHeight || 800;
    if (w <= 640) return { y: 5, s: 0.965 };
    if (h <= 500) return { y: 4, s: 0.98 };
    return { y: 6, s: 0.97 };
  }
  const pose = (y, s) => `translateY(${y}px) scale(${s})`;

  /** Dao dien vua cho the vao / ra: tim hieu ung cua no (translate +-32px) tren chinh phan tu */
  function hieuUngDaoDien(el, dau) {
    let tim = null;
    try {
      el.getAnimations().forEach((a) => {
        if (!a.effect || typeof a.effect.getKeyframes !== 'function' || a.__pc4) return;
        const kf = a.effect.getKeyframes();
        if (kf.some((k) => String(k.translate || '').replace(/\s+/g, ' ').indexOf(dau) === 0)) tim = a;
      });
    } catch (e) {}
    return tim;
  }

  /** The cu ra: mang mat the rieng (lop pc4-ra), mo + troi nhe sang trai — xong truoc khi dao dien go */
  function rutRa(the) {
    if (the.__pc4Ra) return;
    the.__pc4Ra = true;
    const a0 = hieuUngDaoDien(the, '0');
    if (!a0 && !hieuUngDaoDien(the, '-32px')) return;       // mo tai cho (cung slide): giu nguyen
    try { a0 && a0.cancel(); } catch (e) {}
    try { const a1 = hieuUngDaoDien(the, '-32px'); a1 && a1.cancel(); } catch (e) {}
    the.classList.add('pc4-ra');
    chay(the, [
      { transform: 'translateX(0px)', opacity: 1, offset: 0 },
      { opacity: 0.9, offset: 0.25 },
      { transform: 'translateX(-14px)', opacity: 0, offset: 1 },
    ], { duration: RA_MS, easing: E_RA, fill: 'forwards' });
  }

  /** The moi len: mat the tinh tu vi tri the sau tien len; mep the sau hien lai tu duoi */
  function tienLen(the) {
    if (the.__pc4Vao) return;
    const a = hieuUngDaoDien(the, '32px');
    if (!a) return;
    the.__pc4Vao = true;
    let tre = 0;
    try { tre = Number(a.effect.getTiming().delay) || 0; } catch (e) {}
    try { a.cancel(); } catch (e) {}
    datMau(the);
    const b = buoc();
    const treMoi = Math.max(0, tre - 110);
    const o = { duration: VAO_MS, delay: treMoi, easing: E_VAO, fill: 'backwards' };
    const goc = '50% 100%';
    const kf = [
      { transform: pose(b.y, b.s), transformOrigin: goc, offset: 0 },
      { transform: 'translateY(0px) scale(1)', transformOrigin: goc, offset: 1 },
    ];
    chay(the, kf, o);
    // noi dung moi chi hien khi the cu da ra gan het (khong in de hai lop chu)
    const treChu = tre > 0 ? treMoi + RA_MS - 70 : treMoi + 40;
    chay(the, [{ opacity: 0, offset: 0 }, { opacity: 1, offset: 1 }], { duration: 240, delay: treChu, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'backwards' });
    the.__den = Math.max(Number(the.__den) || 0, performance.now() + Math.max(treMoi + VAO_MS * 0.8, treChu + 240));
    if (st.mat) chay(st.mat, kf, o);
    // mep the sau: hien lai tu sau the chinh (khong truot — chi mo -> ro)
    if (st.oThe) chay(st.oThe, [{ opacity: 0, offset: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 1, offset: 1 }], Object.assign({ pseudoElement: '::before' }, o));
  }

  // ------------------------------------------------------------------ the chuong / ket bai: chi doi mau
  function khiTheLat(the, lop) {
    // dao dien: noi dung cu mo 160 ms roi lop moi hien 200 ms -> doi mau luc noi dung dang mo nhat
    const dat = () => {
      const tiep = lop === 'sk-the-xong' ? 'xong' : (mauTiep() || the.dataset.pc4Mau || 'tv');
      the.dataset.pc4Mau = tiep;
      if (st.khung) { st.khung.dataset.pc4Mau = tiep; st.khung.dataset.pc4Sau = lop === 'sk-the-xong' ? 'trong' : tiep; }
    };
    if (st.giam || giam()) dat(); else hen(dat, 150);
  }

  // ------------------------------------------------------------------ o trong: vach nhat cho noi dung sap noi
  function ranh(el) { return el.getBoundingClientRect(); }
  /** Cac dong chu (toa do bo cuc trong goc) cua mot phan tu: gop rect cung dong, tach khi cach xa */
  function dongChu(el, goc, k) {
    // chi rect cua NUT CHU (Range tren ca phan tu tra ca hop cua phan tu con — o luoi rong ca cot)
    let rs = [];
    try {
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const rg = document.createRange();
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        if (!n.nodeValue || !n.nodeValue.trim()) continue;
        rg.selectNodeContents(n);
        rs.push(...rg.getClientRects());
      }
    } catch (e) { return []; }
    rs = rs.filter((q) => q.width > 1 && q.height > 1);
    if (!rs.length) return [];
    const hMax = Math.max(...rs.map((q) => q.height));
    rs = rs.filter((q) => q.height >= hMax * 0.45)                         // bo furigana (rt)
      .map((q) => ({ x: (q.left - goc.left) * k, y: (q.top - goc.top) * k, w: q.width * k, h: q.height * k }))
      .sort((a, b) => (a.y + a.h / 2) - (b.y + b.h / 2) || a.x - b.x);
    const dong = [];
    rs.forEach((q) => {
      const cy = q.y + q.h / 2;
      let d = dong.find((x) => Math.abs(x.cy - cy) < Math.max(x.h, q.h) * 0.5);
      if (!d) { d = { cy, h: q.h, doan: [] }; dong.push(d); }
      d.h = Math.max(d.h, q.h);
      d.doan.push({ x: q.x, r: q.x + q.w });
    });
    const bar = [];
    dong.forEach((d) => {
      d.doan.sort((a, b) => a.x - b.x);
      let cur = null;
      d.doan.forEach((s) => {
        if (cur && s.x - cur.r < d.h * 0.4) cur.r = Math.max(cur.r, s.r);   // gop cach chu, tach cot
        else { cur = { x: s.x, r: s.r, cy: d.cy, h: d.h }; bar.push(cur); }
      });
    });
    return bar.map((b) => ({ x: b.x, w: b.r - b.x, cy: b.cy, h: b.h }));
  }
  /** Ve lai o trong cho canh chu (the song): moi .sk-an ngoai cung (tru dong "cho doc" da hien mo) */
  function veTrong(canh) {
    if (!canh || !canh.isConnected || !canh.classList.contains('sk-chu')) return;
    const trong = canh.querySelector('.sk-chu-trong');
    if (!trong) return;
    const an = [...trong.querySelectorAll('.sk-an')].filter((e) => !e.classList.contains('sk-cho-doc') && !e.closest('.sk-cho-doc')
      && !(e.parentElement && e.parentElement.closest('.sk-an')) && !e.closest('.sk-chu-ghi'));
    let lop = trong.querySelector(':scope > .pc4-trong');
    if (!an.length) { if (lop) lop.replaceChildren(); return; }
    if (!lop) { lop = document.createElement('div'); lop.className = 'pc4-trong'; lop.setAttribute('aria-hidden', 'true'); trong.appendChild(lop); }
    const g = ranh(trong);
    if (!g.width || !trong.offsetWidth) return;
    const k = trong.offsetWidth / g.width;
    const moi = document.createDocumentFragment();
    an.forEach((e) => {
      if (!e.offsetWidth && !e.offsetHeight) return;
      dongChu(e, g, k).forEach((b) => {
        const h = Math.max(6, Math.min(14, b.h * 0.4));
        const i = document.createElement('i');
        i.style.width = Math.max(8, b.w).toFixed(1) + 'px';
        i.style.height = h.toFixed(1) + 'px';
        i.style.translate = `${b.x.toFixed(1)}px ${(b.cy - h / 2).toFixed(1)}px`;
        i.__pc4Nguon = e;
        moi.appendChild(i);
      });
    });
    lop.replaceChildren(moi);
  }
  /** Phan tu vua bo .sk-an: vach cua no mo di cung luc chu hien */
  function hetTrong(el) {
    const lop = el.closest('.sk-chu-trong') && el.closest('.sk-chu-trong').querySelector(':scope > .pc4-trong');
    if (!lop) return;
    [...lop.children].forEach((i) => { if (i.__pc4Nguon && (i.__pc4Nguon === el || el.contains(i.__pc4Nguon))) i.classList.add('is-het'); });
  }
  let henTrong = 0;
  function veTrongSong() {
    if (henTrong) return;
    henTrong = requestAnimationFrame(() => {
      henTrong = 0;
      if (!laBat() || !st.oThe) return;
      const song = theSong();
      const canh = song && song.querySelector(':scope > .sk-the-than > .sk-canh.sk-chu');
      try { veTrong(canh); } catch (e) { warn('o trong', e); }
      theoDoiTrong(canh);
    });
  }
  function theoDoiTrong(canh) {
    const than = canh && canh.querySelector('.sk-chu-than');
    if (st.trong && st.trong.than === than) return;
    if (st.trong) { try { st.trong.ro.disconnect(); } catch (e) {} st.trong = null; }
    if (!than || !window.ResizeObserver) return;
    try {
      const ro = new ResizeObserver(() => veTrongSong());
      ro.observe(than);
      st.trong = { than, ro };
    } catch (e) {}
  }
  const theSong = () => st.oThe && st.oThe.querySelector(':scope > .sk-the:not(.sk-the-truoc):not(.sk-ra):not(.pc4-ra)');

  // ------------------------------------------------------------------ tu vung: mat chu -> mo tai cho
  const bienDoi = (q) => `translate(${q.tx.toFixed(1)}px, ${q.ty.toFixed(1)}px) scale(${q.s.toFixed(3)})`;
  /**
   * Tinh bien doi dua chu lon + cach doc vao giua the (mat chu); do o toa do bo cuc (khong tinh bien doi).
   * Ti le theo kich thuoc KHUNG (khong theo co chu cua bo cuc) -> vua khung / font nap doi co chu thi chu
   * nhin thay van giu nguyen kich thuoc + vi tri.
   */
  function tinhMatChu(v) {
    const root = v.el;
    if (!root.isConnected || !root.classList.contains('pc4-mat-truoc')) return;
    const than = root.querySelector('.sk-chu-than');
    const tu = root.querySelector('.sk-tv-tu');
    const meta = root.querySelector('.sk-tv-meta');
    if (!than || !tu) return;
    // luot do lai truoc (WAAPI) de len bien doi -> phai go truoc khi do, neu khong do ra vi tri da bien doi
    [tu, meta].forEach((e) => { if (e) e.getAnimations().forEach((x) => { if (x.__pc4) { try { x.cancel(); } catch (er) {} } }); });
    const cu = root.classList.contains('pc4-do');
    root.classList.add('pc4-do');          // tat bien doi mat chu trong luc do (cung tac vu, khong ve)
    const rt = ranh(than);
    if (!rt.width || !than.offsetWidth) { if (!cu) root.classList.remove('pc4-do'); return; }
    const k = than.offsetWidth / rt.width;
    const loc = (q) => ({ x: (q.left - rt.left) * k, y: (q.top - rt.top) * k, w: q.width * k, h: q.height * k });
    const a = loc(ranh(tu));
    let m = null;
    if (meta) {
      m = loc(ranh(meta));
      // khoi chu that cua dong cach doc (khoi block rong ca cot)
      try { const rg = document.createRange(); rg.selectNodeContents(meta); const q = loc(rg.getBoundingClientRect()); m.tx0 = q.x; m.tw = q.w; } catch (e) { m.tx0 = m.x; m.tw = m.w; }
      if (!m.tw) { m.tx0 = m.x; m.tw = m.w; }
    }
    root.classList.remove('pc4-do');
    const W = than.offsetWidth, H = than.offsetHeight;
    const top = a.y, bot = m ? m.y + m.h : a.y + a.h;
    const gw = Math.max(a.w, m ? m.tw : 0), gh = bot - top;
    if (!gw || !gh || !W || !H) return;
    const s = Math.max(0.6, Math.min(2.2, (W * 0.78) / gw, (H * 0.5) / gh));
    const Gy = (top + bot) / 2, Cx = W / 2, Cy = H / 2;
    const tinh = (cx, cy) => ({ tx: Cx - cx, ty: Cy + s * (cy - Gy) - cy, s });
    const moi = { tu: tinh(a.x + a.w / 2, a.y + a.h / 2), o: '50% 50%' };
    if (m) {
      // mat chu: khoi cach doc thu gon dung bang dong chu, dat dung cho dong chu (--pc4-w / --pc4-ml) ->
      // phong to khong tran khung (khoi rong ca cot phong len se tran -> vua khung thu nho chu)
      moi.meta = tinh(m.tx0 + m.tw / 2, m.y + m.h / 2);
      moi.metaO = '50% 50%';
      moi.metaW = Math.ceil(m.tw + 1);
      moi.metaML = m.tx0 - m.x;
    }
    const cuQ = v.q;
    v.q = moi;
    const ghi = (el, q, o) => {
      el.style.setProperty('--pc4-tx', q.tx.toFixed(1) + 'px');
      el.style.setProperty('--pc4-ty', q.ty.toFixed(1) + 'px');
      el.style.setProperty('--pc4-s', q.s.toFixed(3));
      el.style.setProperty('--pc4-o', o);
    };
    ghi(tu, moi.tu, moi.o);
    if (meta && moi.meta) {
      ghi(meta, moi.meta, moi.metaO);
      meta.style.setProperty('--pc4-w', moi.metaW + 'px');
      meta.style.setProperty('--pc4-ml', moi.metaML.toFixed(1) + 'px');
    }
    // da hien tren man: lech (neu con) thi luot, khong nhay
    if (cuQ && performance.now() - v.luc > 90 && !(st.giam || giam())) {
      const lech = (p, q) => p && q && (Math.abs(p.tx - q.tx) > 0.75 || Math.abs(p.ty - q.ty) > 0.75 || Math.abs(p.s - q.s) > 0.004);
      if (lech(cuQ.tu, moi.tu)) chay(tu, [{ transform: bienDoi(cuQ.tu), transformOrigin: moi.o }, { transform: bienDoi(moi.tu), transformOrigin: moi.o }], { duration: 320, easing: E_VAO });
      if (meta && lech(cuQ.meta, moi.meta)) chay(meta, [{ transform: bienDoi(cuQ.meta), transformOrigin: moi.metaO }, { transform: bienDoi(moi.meta), transformOrigin: moi.metaO }], { duration: 320, easing: E_VAO });
    }
  }
  function thuVocab(root) {
    if (!root || root.__pc4v || !root.classList.contains('sk-canh-vocab')) return;
    const nghia = root.querySelector('.sk-tv-nghia');
    const tu = root.querySelector('.sk-tv-tu');
    if (!nghia || !tu) return;
    const v = { el: root, nghia, daMo: false, henAT: null, ro: null, q: null, luc: performance.now() };
    root.__pc4v = v;
    st.vocab.add(v);
    root.classList.add('pc4-mat-truoc');
    tinhMatChu(v);
    if (window.ResizeObserver) {
      try {
        let h = 0;
        v.ro = new ResizeObserver(() => {
          if (h || v.daMo) return;
          h = requestAnimationFrame(() => { h = 0; if (!v.daMo && laBat()) { try { tinhMatChu(v); } catch (e) {} } });
        });
        v.ro.observe(root.querySelector('.sk-chu-than') || root);
        v.ro.observe(tu);
      } catch (e) { v.ro = null; }
    }
    try { document.fonts && document.fonts.ready.then(() => { if (!v.daMo && laBat()) { try { tinhMatChu(v); } catch (e) {} } }); } catch (e) {}
  }
  function goBien(root) {
    root.querySelectorAll('.sk-tv-tu, .sk-tv-meta').forEach((e) => ['--pc4-tx', '--pc4-ty', '--pc4-s', '--pc4-o', '--pc4-w', '--pc4-ml'].forEach((p) => e.style.removeProperty(p)));
  }
  function boVocab(v, tra) {
    st.vocab.delete(v);
    if (v.ro) { try { v.ro.disconnect(); } catch (e) {} v.ro = null; }
    if (v.henAT != null) { clearTimeout(v.henAT); st.hen.delete(v.henAT); v.henAT = null; }
    if (tra) {
      v.el.classList.remove('pc4-mat-truoc', 'pc4-mo', 'pc4-do', 'pc4-doc');
      goBien(v.el);
      try { delete v.el.__pc4v; } catch (e) { v.el.__pc4v = null; }
    }
  }
  const laSong = (v) => { const t = v.el.closest('.sk-o-the > .sk-the'); return !!(t && !t.classList.contains('sk-the-truoc') && !t.classList.contains('sk-ra') && t.isConnected); };
  function vocabLen(v) {
    if (v.henAT != null || v.daMo) return;
    v.henAT = hen(() => { v.henAT = null; moVocab(v, 'an-toan'); }, AN_TOAN_MS);
  }
  function hienLaiTro(root) {
    root.querySelectorAll('.sk-chu-tro.is-hien').forEach((g) => chay(g, [{ opacity: 0, offset: 0 }], { duration: 240, easing: E_VAO }));
  }
  /**
   * Mo mat chu -> mat day du, tai cho: chu lon + cach doc luot (FLIP) tu giua ve dung cho cua chung;
   * hinh + nghia (+ meo neu da hien) mo -> ro va nhich len 4px, cung mot cue. ngay: khong hieu ung.
   */
  function moVocab(v, lyDo, ngay) {
    if (v.daMo) return;
    v.daMo = true;
    if (v.henAT != null) { clearTimeout(v.henAT); st.hen.delete(v.henAT); v.henAT = null; }
    if (v.ro) { try { v.ro.disconnect(); } catch (e) {} v.ro = null; }
    const root = v.el;
    root.dataset.pc4Mo = lyDo || '';
    const tu = root.querySelector('.sk-tv-tu');
    const meta = root.querySelector('.sk-tv-meta');
    const q = v.q;
    // huy luot do lai dang chay (neu co) truoc khi FLIP
    [tu, meta].forEach((e) => { if (e) e.getAnimations().forEach((a) => { if (a.__pc4) { try { a.cancel(); } catch (x) {} } }); });
    const nhe = st.giam || giam();
    if (ngay || !laSong(v) || !q) {
      root.classList.remove('pc4-mat-truoc', 'pc4-doc');
      return;
    }
    const hien = [root.querySelector('.sk-tv-trai'), v.nghia, root.querySelector('.sk-tv-phu:not(.sk-an)')].filter(Boolean);
    // FLIP theo vi tri NHIN THAY (do truoc khi doi lop): dong cach doc doi hop (bo --pc4-w/--pc4-ml) nen
    // khong dung lai bien doi da tinh — do khoi chu that truoc/sau roi dao nguoc -> khung dau khop 100%
    const dau = nhe ? null : { tu: tu && tu.getBoundingClientRect(), meta: meta && rectChu(meta) };
    root.classList.add('pc4-mo');
    root.classList.remove('pc4-mat-truoc', 'pc4-doc');
    if (nhe) {
      hien.forEach((e) => chay(e, [{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: 'linear' }));
      hen(() => { root.classList.remove('pc4-mo'); hienLaiTro(root); }, 130);
      return;
    }
    const than = root.querySelector('.sk-chu-than');
    const rt = than && than.getBoundingClientRect();
    const k = rt && rt.width && than.offsetWidth ? than.offsetWidth / rt.width : 1;
    const flip = (el, a, lay) => {
      if (!el || !a || !a.width || !a.height) return;
      const b = lay(el), hop = el.getBoundingClientRect();
      if (!b.width || !b.height) return;
      const s = a.height / b.height;
      const dx = (a.left - b.left) * k, dy = (a.top - b.top) * k;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(s - 1) < 0.003) return;
      // goc bien doi = goc tren-trai cua khoi chu (toa do trong phan tu) -> diem do dung yen khi phong
      const o = `${((b.left - hop.left) * k).toFixed(1)}px ${((b.top - hop.top) * k).toFixed(1)}px`;
      chay(el, [
        { transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${s.toFixed(4)})`, transformOrigin: o },
        { transform: 'translate(0px, 0px) scale(1)', transformOrigin: o },
      ], { duration: MO_MS, easing: E_MO });
    };
    flip(tu, dau.tu, (e) => e.getBoundingClientRect());
    flip(meta, dau.meta, rectChu);
    hien.forEach((e, j) => chay(e, [{ opacity: 0, translate: '0 4px' }, { opacity: 1, translate: '0 0' }], { duration: HIEN_MS, delay: j ? HIEN_TRE + 120 : HIEN_TRE, easing: E_VAO, fill: 'backwards' }));
    hen(() => { root.classList.remove('pc4-mo'); hienLaiTro(root); veTrongSong(); }, MO_MS - 80);
  }
  /** Khung cua khoi chu that (Range) — hop block co the rong ca cot, chu thi khong */
  function rectChu(el) {
    try { const rg = document.createRange(); rg.selectNodeContents(el); const q = rg.getBoundingClientRect(); if (q.width && q.height) return q; } catch (e) {}
    return el.getBoundingClientRect();
  }
  /** Vi tri bo cuc (offset, khong tinh bien doi) cua el trong ref — cung cach canh chu dat con tro */
  function viTri(el, ref) {
    if (!el || !ref || !el.isConnected) return null;
    let x = 0, y = 0, n = el;
    for (let i = 0; n && n !== ref && i < 48; i++) {
      x += n.offsetLeft || 0; y += n.offsetTop || 0;
      const p = n.offsetParent;
      if (!p) return null;
      if (p !== ref) { x += p.clientLeft || 0; y += p.clientTop || 0; }
      n = p;
    }
    return n === ref ? { x, y, w: el.offsetWidth, h: el.offsetHeight } : null;
  }
  const iou = (c, n) => {
    if (!c || !n) return 0;
    const ox = Math.min(c.x + c.w, n.x + n.w) - Math.max(c.x, n.x);
    const oy = Math.min(c.y + c.h, n.y + n.h) - Math.max(c.y, n.y);
    if (ox <= 0 || oy <= 0) return 0;
    const giao = ox * oy, hop = c.w * c.h + n.w * n.h - giao;
    return hop > 0 ? giao / hop : 0;
  };
  /**
   * Con tro doc cua canh vua doi (6 manh, toa do bo cuc trong .sk-chu-trong):
   *  - om dong nghia (cue V3) -> mo the;
   *  - om chu lon luc con mat chu -> to rieng sau chu lon (.pc4-doc).
   */
  function kiemTro(v, g) {
    if (v.daMo || !g) return;
    const hien = g.classList.contains('is-hien');
    const p = g.children;
    if (p.length < 2) return;
    const tach = (b) => { const m = String(b.style.translate || '').match(/(-?[\d.]+)px\s+(-?[\d.]+)px/); return m ? { x: +m[1], y: +m[2], w: parseFloat(b.style.width) || 0, h: parseFloat(b.style.height) || 0 } : null; };
    const p0 = tach(p[0]), p1 = tach(p[1]);
    if (!p0 || !p1) return;
    const c = { x: p0.x, y: p1.y, w: p0.w, h: p1.h };
    const trong = g.offsetParent || v.el.querySelector('.sk-chu-trong');
    if (!trong) return;
    if (hien && iou(c, viTri(v.nghia, trong)) > 0.4) { moVocab(v, 'nghia'); return; }
    const tu = v.el.querySelector('.sk-tv-tu');
    const doc = iou(c, viTri(tu, trong)) > 0.4;
    if (hien && doc) v.el.classList.add('pc4-doc');
    else if (hien || !v.el.querySelector('.sk-chu-tro.is-hien')) v.el.classList.remove('pc4-doc');
  }

  // ------------------------------------------------------------------ quan sat
  function quet() {
    if (!st.oThe) return;
    st.oThe.querySelectorAll('.sk-canh-vocab').forEach(thuVocab);
    const song = theSong();
    if (song) {
      datMau(song);
      st.vocab.forEach((v) => { if (laSong(v)) vocabLen(v); });
    }
    veTrongSong();
  }
  function donVocab() {
    st.vocab.forEach((v) => { if (!v.el.isConnected) boVocab(v, false); });
  }
  function khiDoi(ds) {
    if (!laBat()) return;
    st.giam = giam();
    const troDoi = new Map();
    let canQuet = false;
    for (const m of ds) {
      const t = m.target;
      if (m.type === 'childList') {
        if (t.classList && t.classList.contains('pc4-trong')) continue;
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          if (n.matches('.sk-canh-vocab')) thuVocab(n);
          else if (n.querySelector) n.querySelectorAll('.sk-canh-vocab').forEach(thuVocab);
          // the chuong / ket bai: lop lat moi trong than the song
          if (n.matches('.sk-canh.sk-the-lat') && n.parentElement && n.parentElement.classList.contains('sk-the-than')) {
            const the = n.closest('.sk-o-the > .sk-the');
            if (the) khiTheLat(the, n.classList.contains('sk-the-xong') ? 'sk-the-xong' : 'sk-the-chuong');
          }
          if (n.matches('.sk-canh.sk-chu') || (n.querySelector && n.querySelector('.sk-canh.sk-chu'))) canQuet = true;
        });
        if (m.removedNodes.length) donVocab();
        continue;
      }
      if (m.type !== 'attributes' || t.nodeType !== 1) continue;
      if (t.parentElement === st.oThe && t.classList.contains('sk-the') && !t.classList.contains('sk-the-truoc')) {
        if (st.giam) { if (m.attributeName === 'style' && !t.classList.contains('sk-ra')) { datMau(t); canQuet = true; } continue; }
        if (t.classList.contains('sk-ra')) { if (!t.classList.contains('pc4-ra')) rutRa(t); }
        else if (m.attributeName === 'style' && t.style.opacity === '') { tienLen(t); canQuet = true; }
        else if (m.attributeName === 'class') canQuet = true;
        continue;
      }
      if (m.attributeName === 'style' && t.parentElement && t.parentElement.classList.contains('sk-chu-tro')) {
        troDoi.set(t.parentElement, true);
        continue;
      }
      if (m.attributeName !== 'class') continue;
      if (t.classList.contains('sk-chu-tro')) { troDoi.set(t, true); continue; }
      // phan tu vua bo .sk-an (Sensei noi toi): vach o trong cua no mo di
      if (m.oldValue != null && /(^|\s)sk-an(\s|$)/.test(m.oldValue) && !t.classList.contains('sk-an')) hetTrong(t);
      if (t.classList.contains('sk-tv-phu') && !t.classList.contains('sk-an')) {
        const r = t.closest('.sk-canh-vocab');
        const v = r && r.__pc4v;
        if (v && laSong(v)) moVocab(v, 'meo');
      }
    }
    if (canQuet) quet();
    troDoi.forEach((_, g) => {
      const root = g.closest('.sk-canh-vocab');
      const v = root && root.__pc4v;
      if (v && laSong(v)) { vocabLen(v); kiemTro(v, g); }
    });
  }
  function khiSanDoi() {
    if (!laBat()) return;
    const che = st.san.dataset.che;
    if (che === 'tat') {
      // tam dung / dung: luoi tinh tro lai — go het hieu ung cua pc4, the tu vung ve mat day du
      st.anims.forEach((a) => { try { a.cancel(); } catch (e) {} });
      st.vocab.forEach((v) => moVocab(v, 'tat', true));
    } else if (che === 'chuyen' || che === 'cho') {
      // het nhip: khung cuoi du (mat day du)
      st.vocab.forEach((v) => { if (laSong(v)) moVocab(v, 'het'); });
    }
  }

  function batDau(san) {
    san = san || document.getElementById('sanKhauGiang');
    if (!san) return false;
    if (st.san) ketThuc(st.san);
    st.san = san;
    st.khung = san.querySelector('.sk-khung');
    st.oThe = san.querySelector('.sk-o-the');
    st.mat = st.oThe ? st.oThe.querySelector(':scope > .sk-mat') : null;
    st.giam = giam();
    if (!st.oThe) return false;
    st.mo = new MutationObserver((ds) => { try { khiDoi(ds); } catch (e) { warn('quan sat', e); } });
    st.mo.observe(st.oThe, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'], attributeOldValue: true });
    st.moSan = new MutationObserver(() => { try { khiSanDoi(); } catch (e) { warn('san', e); } });
    st.moSan.observe(san, { attributes: true, attributeFilter: ['data-che'] });
    try { quet(); } catch (e) { warn('quet', e); }
    return true;
  }
  function ketThuc(san) {
    if (!st.san || (san && san !== st.san)) return;
    if (st.mo) { try { st.mo.disconnect(); } catch (e) {} st.mo = null; }
    if (st.moSan) { try { st.moSan.disconnect(); } catch (e) {} st.moSan = null; }
    if (st.trong) { try { st.trong.ro.disconnect(); } catch (e) {} st.trong = null; }
    if (henTrong) { cancelAnimationFrame(henTrong); henTrong = 0; }
    st.hen.forEach((id) => clearTimeout(id)); st.hen.clear();
    st.anims.forEach((a) => { try { a.cancel(); } catch (e) {} }); st.anims.clear();
    [...st.vocab].forEach((v) => boVocab(v, true));
    const s = st.san;
    s.querySelectorAll('[data-pc4-mau], [data-pc4-sau], [data-pc4-mo]').forEach((e) => { delete e.dataset.pc4Mau; delete e.dataset.pc4Sau; delete e.dataset.pc4Mo; });
    s.querySelectorAll('.pc4-ra').forEach((e) => e.classList.remove('pc4-ra'));
    s.querySelectorAll('.pc4-trong').forEach((e) => e.remove());
    s.querySelectorAll('.sk-canh-vocab').forEach((e) => { e.classList.remove('pc4-mat-truoc', 'pc4-mo', 'pc4-do', 'pc4-doc'); goBien(e); e.__pc4v = null; });
    s.querySelectorAll('.sk-o-the > .sk-the').forEach((t) => { t.__pc4Ra = false; t.__pc4Vao = false; });
    st.san = st.khung = st.oThe = st.mat = null;
  }

  window.SenseiPhongCach = window.SenseiPhongCach || {};
  window.SenseiPhongCach[TEN] = { batDau, ketThuc };
})();
