/* ==========================================================================
   Phong cach san khau giang 1 — "Giay washi" (N5 bai 1)
   Giay washi yen tinh: the mau ngà co soi giay rat nhat (CSS), chu muc den diu, MOT mau nhan son (朱).
   Chuyen dong: hien dong phu = muc loang (opacity + nhich 4px + mat na quet mem, khong blur);
   con tro doc = net co son moc duoi token dang noi; doi nhip = cheo mo cham + troi 12px;
   day phim = nhung con dau nho.

   KHONG doi LUC nao thu gi hien ra (moc cue cua dao dien giu nguyen) — chi doi CACH no chuyen dong.
   Cach lam: trong luc bat, boc Element.prototype.animate. Moi loi goi animate() tren phan tu nam trong
   .san-khau-giang[data-phong-cach="pc1"] duoc nhan dang theo mau keyframe cua dao dien (js/motion.js)
   va canh (js/motion-canh-chu.js, motion-canh-hoi.js) roi doi keyframe / thoi luong. Ngoai san khau pc1,
   duoi giam chuyen dong, hoac mau khong nhan ra: goi animate goc, khong doi gi.

   Hoi thoai (duyet r2 — the khong trong): duoi cau dang noi dat MOT dong cho "luot ke tiep" rat nhat
   (vong ten + ten nguoi noi + hai vach giay thay cho chu — khong lap chu, khong tranh diem nhin). Nam ngoai
   dong chay (absolute trong .sk-hoi-noi, data-sk-tro: caoNoiDung cua dao dien bo qua), chi hien khi vua trong
   than the (khong gay tran -> vuaKhung khong thu nho chu); canh mot cau: nhuong cho o "Cach noi khac" khi o
   do hien. Cau cuoi: dong nay thanh dau "het doan" (vach ngan + 終 + so cau). Khong chuyen dong rieng.

   Dang ky: window.SenseiPhongCach.pc1 = { batDau(stageEl), ketThuc(stageEl) }.
   ========================================================================== */
(function () {
  'use strict';

  const TEN = 'pc1';
  const SEL = '.san-khau-giang[data-phong-cach="pc1"]';
  const E_TRAO = 'cubic-bezier(.25,.1,.25,1)';     // cheo mo doi nhip: mem, deu
  const E_RA = 'cubic-bezier(.4,0,.7,1)';
  const E_VAO = 'cubic-bezier(.22,.55,.3,1)';      // the moi: len nhanh vua du de cheo voi the cu, dung rat mem
  const E_MUC = 'cubic-bezier(.3,.05,.2,1)';        // muc loang: bat dau cham, dung mem
  const E_BUT = 'cubic-bezier(.35,.1,.25,1)';       // net co keo
  const THE_VAO = 560;       // noi dung the moi (dao dien: 320 ms)
  const THE_RA = 200;
  const CHEO_TRE = 110;      // noi dung moi bat dau hien sau 110 ms (dao dien: 170 ms)        // noi dung the cu (dao dien go the cu sau 220 ms: khong duoc dai hon)
  const CUNG_VAO = 440;      // cung slide: the moi hoa tan (dao dien: 220 ms)
  const HIEN_MS = 520;       // muc loang (dao dien: 240 ms)
  const PHIM_MS = 560;       // day con dau truot (dao dien: 360 ms)

  const st = { bat: false, goc: null, boc: null, san: null, quanSat: null, mask: null, qsKe: null, roKe: null, henKe: false };

  function dinhMask() {
    try {
      if (window.CSS && CSS.supports('mask-image', 'linear-gradient(#000,#000)')) return { img: 'maskImage', size: 'maskSize', pos: 'maskPosition' };
      if (window.CSS && CSS.supports('-webkit-mask-image', 'linear-gradient(#000,#000)')) return { img: 'webkitMaskImage', size: 'webkitMaskSize', pos: 'webkitMaskPosition' };
    } catch (e) {}
    return null;
  }
  const giam = () => { try { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } };
  const hai = (s) => { const a = String(s == null ? '' : s).trim().split(/\s+/).map(parseFloat); return [a[0] || 0, a.length > 1 && isFinite(a[1]) ? a[1] : (a[0] || 0)]; };
  const px = (el, k) => parseFloat(el.style[k]) || 0;
  const co = (f, k) => f && Object.prototype.hasOwnProperty.call(f, k);
  const laCon = (el, sel) => !!(el && el.matches && el.matches(sel));

  /** Goi animate goc (khong qua boc) */
  function goi(el, kf, o) {
    try { return st.goc.call(el, kf, o); } catch (e) { return null; }
  }
  /** Mot hoat anh rong da xong ngay: giu hop dong gia tri tra ve (Animation) ma khong ve gi */
  function rong(el, o) {
    return goi(el, [], Object.assign({}, o, { duration: 0, delay: 0, iterations: 1 }));
  }
  /** Net co moc tu trai sang phai (clip-path) — tren phan tu hoac gia phan tu cua no */
  function moc(el, ms, tre, gia) {
    const o = { duration: ms, delay: tre || 0, easing: E_BUT, fill: 'backwards' };
    if (gia) o.pseudoElement = gia;
    return goi(el, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], o);
  }
  /** Bong muc: net cu mo dan tai cho trong khi net moi moc (khong truot cheo qua chu) */
  function bong(g) {
    g.classList.add('pc1-bong');
    g.setAttribute('aria-hidden', 'true');
    // duyet r3: net cu MONG DAN xuong day (scaleY) roi tat, nhanh (240 ms) — khong con vet son mo (hong)
    // nam lai sau chu trong luc net moi moc
    g.style.transformOrigin = '50% 100%';
    const a = goi(g, [{ opacity: 1, scale: '1 1' }, { opacity: 0.85, scale: '1 .4', offset: 0.6 }, { opacity: 0, scale: '1 .2' }], { duration: 240, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    const go = () => { try { g.remove(); } catch (e) {} };
    if (a) a.onfinish = go;
    setTimeout(go, 500);
  }

  /** Con tro cua the (dao dien): luot (translate + scale) -> net cu mo tai cho + net moi moc duoi token */
  function conTroLuot(ct, f0, o) {
    const [dx, dy] = hai(f0.translate);
    const [sx, sy] = co(f0, 'scale') ? hai(f0.scale) : [1, 1];
    const L = px(ct, 'left'), T = px(ct, 'top'), Wd = px(ct, 'width'), H = px(ct, 'height');
    const vach = ct.firstElementChild;
    if (Wd > 0 && H > 0 && ct.parentNode) {
      const g = document.createElement('i');
      g.className = 'sk-con-tro-bong' + (vach && vach.classList.contains('is-mo') ? ' is-mo' : '');
      g.style.left = (L + dx).toFixed(1) + 'px';
      g.style.top = (T + dy).toFixed(1) + 'px';
      g.style.width = (Wd * sx).toFixed(1) + 'px';
      g.style.height = (H * sy).toFixed(1) + 'px';
      ct.parentNode.insertBefore(g, ct);
      bong(g);
    }
    const dang = vach && vach.getAnimations && vach.getAnimations().some((a) => a.playState === 'running');
    if (vach && !dang) moc(vach, Math.max(180, Math.min(360, (o.duration || 260) * 1.15)), 0);
    return rong(ct, o);
  }

  /** Manh con tro cua canh chu (.sk-chu-tro > b): luot -> manh doc (thu 2) de bong + moc; cac manh khac dung yen */
  function manhLuot(b, f0, o) {
    const g0 = b.parentElement;
    if (g0 && b === g0.children[1]) {
      const [ax, ay] = hai(f0.translate);
      const [sx, sy] = co(f0, 'scale') ? hai(f0.scale) : [1, 1];
      const w = px(b, 'width') * sx, h = px(b, 'height') * sy;
      if (w > 0 && h > 0) {
        const g = document.createElement('b');
        g.className = 'sk-tro-bong';
        g.style.width = w.toFixed(1) + 'px';
        g.style.height = h.toFixed(1) + 'px';
        g.style.translate = `${ax.toFixed(1)}px ${ay.toFixed(1)}px`;
        g0.appendChild(g);
        bong(g);
      }
      moc(b, Math.max(180, Math.min(360, (o.duration || 260) * 1.15)), 0, '::after');
    }
    return rong(b, o);
  }

  /** Mat na quet mem: vung thay chay tu trai sang phai (canh mem = mot be rong phan tu) */
  function muc(f0, o, san) {
    const m = st.mask;
    const G = san == null ? 'linear-gradient(90deg, #000 0%, #000 33.3%, transparent 66.7%, transparent 100%)'
      : `linear-gradient(90deg, #000 0%, #000 33.3%, rgba(0,0,0,${san}) 66.7%, rgba(0,0,0,${san}) 100%)`;
    const a = { offset: 0 }, z = { offset: 1 };
    if (san == null) { a.opacity = 0; a.translate = '0 4px'; }
    if (m) { a[m.img] = G; a[m.size] = '300% 100%'; a[m.pos] = '100% 0'; z[m.img] = G; z[m.size] = '300% 100%'; z[m.pos] = '0% 0'; }
    else if (san != null) a.opacity = san;
    return [a, z];
  }

  /** Nhan dang + doi. Tra ve Animation, hoac undefined = de animate goc chay nguyen */
  function doi(el, kf, o) {
    const f0 = kf[0], n = kf.length;
    const cl = el.classList;
    if (!cl) return undefined;

    // 1. The (khung .sk-the cua dao dien): vao / ra / hoa tan cung slide
    if (laCon(el, '.sk-o-the > .sk-the')) {
      if (n === 1 && f0.opacity === 0 && co(f0, 'translate')) {
        // cheo mo that: noi dung moi bat dau hien khi noi dung cu con ~45% (dao dien doi toi < 10%) —
        // hai lop troi nguoc chieu 12px, cham, khong co khung hinh trong
        const tre = Math.min(o.delay || 0, CHEO_TRE);
        el.__den = performance.now() + tre + THE_VAO;
        return goi(el, [{ opacity: 0, translate: '12px 0', offset: 0 }], Object.assign({}, o, { delay: tre, duration: THE_VAO, easing: E_VAO }));
      }
      if (n === 1 && f0.opacity === 0 && !co(f0, 'translate') && o.easing !== 'linear') {
        el.__den = performance.now() + (o.delay || 0) + CUNG_VAO;
        return goi(el, [{ opacity: 0, offset: 0 }], Object.assign({}, o, { duration: CUNG_VAO, easing: E_TRAO }));
      }
      if (n === 2 && kf[1].opacity === 0 && co(kf[1], 'translate')) {
        return goi(el, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '-12px 0' }], Object.assign({}, o, { duration: Math.min(THE_RA, o.duration || THE_RA), easing: E_RA }));
      }
      return undefined;
    }
    // Cung slide: khoi cau / giai thich cu lui -24px -> troi 12px
    if (n === 2 && kf[1].opacity === 0 && kf[1].translate === '-24px 0') {
      return goi(el, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '-12px 0' }], Object.assign({}, o, { easing: E_RA }));
    }

    // 2. Con tro doc
    if (cl.contains('sk-con-tro')) {
      if (n === 1 && co(f0, 'translate')) return conTroLuot(el, f0, o);
      if (n === 1 && f0.opacity === 0) {           // hien lan dau: net moc thay cho mo dan
        const v = el.firstElementChild;
        const dang = v && v.getAnimations && v.getAnimations().some((a) => a.playState === 'running');
        if (v && !dang) moc(v, 300, 0);
        return goi(el, [{ opacity: 0, offset: 0 }], Object.assign({}, o, { duration: 90 }));
      }
      return undefined;
    }
    if (cl.contains('sk-con-tro-vach') && n === 1 && f0.translate === '-100% 0') {
      // doc luot (quet): net co keo dai dung thoi luong doc
      return goi(el, [{ clipPath: 'inset(0 100% 0 0)', offset: 0 }], Object.assign({}, o));
    }
    if (el.tagName === 'B' && el.parentElement && el.parentElement.classList.contains('sk-chu-tro') && n === 1 && co(f0, 'translate')) {
      return manhLuot(el, f0, o);
    }
    if (cl.contains('sk-chu-tro') && n === 1 && f0.opacity === 0) {
      const b = el.children[1];
      if (b) moc(b, 300, o.delay || 0, '::after');
      return goi(el, [{ opacity: 0, offset: 0 }], Object.assign({}, o, { duration: Math.min(120, o.duration || 120) }));
    }

    // 3. Hien dong phu = muc loang (dao dien hu.hien / canh chu hien: opacity 0 + 6px, 240 ms)
    if (n === 1 && f0.opacity === 0 && f0.translate === '0 6px') {
      return goi(el, muc(f0, o, null), Object.assign({}, o, { duration: Math.max(HIEN_MS, (o.duration || 240) * 2), easing: E_MUC }));
    }
    // Dong "cho doc" (.32 -> ro): muc tham dan tu trai sang phai
    if (cl.contains('sk-cho-chu') && n === 1 && typeof f0.opacity === 'number' && f0.opacity > 0.1 && f0.opacity < 0.6 && !co(f0, 'translate')) {
      return goi(el, muc(f0, o, f0.opacity), Object.assign({}, o, { duration: HIEN_MS + 80, easing: E_MUC }));
    }

    // 4. Day con dau: truot cham hon
    if (cl.contains('sk-phim-ray') && n === 1 && co(f0, 'translate')) {
      return goi(el, kf, Object.assign({}, o, { duration: PHIM_MS, easing: E_TRAO }));
    }

    // 5. Lat the chuong / ket bai: noi dung moi hien cham + net co son duoi ten chuong moc
    if (cl.contains('sk-the-lat') && n === 1 && f0.opacity === 0 && o.easing !== 'linear') {
      const v = el.querySelector('.sk-tc-vach');
      if (v) moc(v, 900, (o.delay || 0) + 240);
      return goi(el, kf, Object.assign({}, o, { duration: 420, easing: E_TRAO }));
    }
    return undefined;
  }

  // ---------------------------------------------------------------- hoi thoai: dong "luot ke tiep"
  const SEL_KE = '.sk-canh:is(.sk-ht-mot, .sk-ht-chay)';
  function tachTen(sp) {
    const s = String(sp || '').trim();
    const m = /^(.*?)\s*[(（]([^)）]*)[)）]\s*$/.exec(s);
    return m ? { jp: m[1].trim(), la: m[2].trim() } : { jp: s, la: '' };
  }
  /** So ky tu doc duoc cua mot cau (bo furigana <rt>) */
  function demChu(el) {
    if (!el) return 0;
    let n = 0;
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let t;
    while ((t = tw.nextNode())) { if (!t.parentElement || !t.parentElement.closest('rt')) n += Array.from(t.textContent.trim()).length; }
    return n;
  }
  /** Cau thoai ke tiep cua cau dang noi: { khoa, chu, ten, soChu, soNghia } | null */
  function cauKe(canh, nay) {
    if (canh.classList.contains('sk-ht-chay')) {
      const i = parseInt(nay.dataset.i, 10);
      const nx = isFinite(i) ? canh.querySelector(`.sk-ht-dong[data-i="${i + 1}"]`) : null;
      if (!nx) return isFinite(i) ? { khoa: 'ket', ket: true, tong: canh.querySelectorAll('.sk-ht-dong').length } : null;
      const ava = nx.querySelector('.sk-ht-ava'), ten = nx.querySelector('.sk-ht-ten'), ng = nx.querySelector('.sk-ht-nghia');
      return { khoa: nx.dataset.dong || String(i + 1), chu: ava ? ava.textContent.trim() : '', ten: ten ? ten.textContent.trim() : '',
        soChu: demChu(nx.querySelector('.sk-ht-cau')), soNghia: Array.from(ng ? ng.textContent : '').length };
    }
    // mot cau: cau ke tiep lay tu ke hoach bai giang (cac nhip kaiwa theo thu tu)
    let ds = [];
    try { ds = ((window.__lecture && window.__lecture.beats && window.__lecture.beats()) || []).filter((b) => b && b.kind === 'kaiwa' && b.data).map((b) => b.data); } catch (e) { ds = []; }
    const k = ds.findIndex((l) => l.id === nay.dataset.dong);
    const l = k >= 0 ? ds[k + 1] : null;
    if (!l) return k >= 0 && k === ds.length - 1 ? { khoa: 'ket', ket: true, tong: ds.length } : null;
    const t = tachTen(l.speaker);
    const cau = (l.tokens || []).map((x) => x.kanji || x.text || '').join('') || String(l.japanese || l.text || '');
    return { khoa: String(l.id), chu: Array.from(t.jp || '')[0] || '', ten: (t.jp + (t.la ? ' ' + t.la : '')).trim(),
      soChu: Array.from(cau).length, soNghia: Array.from(String(l.meaningVi || '')).length };
  }
  /** Ve dong cho: vong ten nho + ten + hai vach giay (cau Nhat ~ so chu, nghia ~ do dai nghia) */
  function veKe(ke, d) {
    // cau cuoi: dau "het doan" rat nhat (mot vach ngan + 終 + so cau) — the khong bo trong, bao doan da tron
    if (d.ket) {
      ke.innerHTML = '<span class="pc1-ke-het"><i></i><span lang="ja">終</span><span class="pc1-ke-het-chu"></span></span>';
      ke.querySelector('.pc1-ke-het-chu').textContent = 'Hết đoạn hội thoại' + (d.tong ? ' · ' + d.tong + ' câu' : '');
      ke.dataset.khoa = d.khoa;
      return;
    }
    const w1 = Math.max(4, Math.min(d.soChu || 8, 30)), w2 = Math.max(8, Math.min(d.soNghia || 24, 64));
    ke.innerHTML = '<span class="pc1-ke-ai"><span class="pc1-ke-ava" lang="ja"></span><span class="pc1-ke-ten"></span></span>'
      + `<span class="pc1-ke-vach"><i style="width:min(100%, ${(w1 * 1.02).toFixed(2)}em)"></i><i style="width:min(100%, ${(w2 * 0.3).toFixed(2)}em)"></i></span>`;
    ke.querySelector('.pc1-ke-ava').textContent = d.chu || '·';
    const ten = ke.querySelector('.pc1-ke-ten');
    const t = tachTen(d.ten);
    const jp = /^\S+/.exec(d.ten);
    // "山田 Yamada": phan chu Nhat dam hon mot bac nhu dong ten that
    if (jp && d.ten.length > jp[0].length) {
      const b = document.createElement('span'); b.lang = 'ja'; b.textContent = jp[0];
      ten.append(b, document.createTextNode(d.ten.slice(jp[0].length)));
    } else ten.textContent = t.jp || d.ten || '';
    ke.dataset.khoa = d.khoa;
  }
  function capNhatKe1(canh) {
    const noi = canh.querySelector(':scope > .sk-hoi-noi');
    if (!noi) return;
    let ke = noi.querySelector(':scope > .pc1-ke');
    const nay = noi.querySelector('.sk-ht-dong.is-nay');
    const d = nay ? cauKe(canh, nay) : null;
    if (!d) { if (ke) ke.remove(); return; }
    if (!ke) {
      ke = document.createElement('div');
      ke.className = 'pc1-ke sk-phu-bo';
      ke.setAttribute('aria-hidden', 'true');
      ke.setAttribute('data-sk-tro', '');
      noi.appendChild(ke);
      if (st.roKe) try { st.roKe.observe(noi); } catch (e) {}
    }
    if (ke.dataset.khoa !== d.khoa) veKe(ke, d);
    // vi tri: ngay duoi cau dang noi (ca dong nghia dat san), cach bang khoang cach cot cua khoi
    let gap = 20;
    try { gap = parseFloat(getComputedStyle(noi).rowGap) || 20; } catch (e) {}
    // day that cua cau dang noi (o nghe tron doan, cac cau chong mot o luoi: o cau cao bang cau dai nhat ->
    // do theo khoi chu cuoi cung cua no, qua chuoi offsetParent — khong bi nhich translate luc cau vao)
    const cuoi = nay.lastElementChild || nay;
    let y = cuoi.offsetHeight, e = cuoi;
    while (e && e !== noi) { y += e.offsetTop; e = e.offsetParent; }
    if (e !== noi) y = nay.offsetTop + nay.offsetHeight;
    const top = y + gap;
    ke.style.top = top.toFixed(1) + 'px';
    // chi hien khi vua trong than the
    ke.hidden = false;
    const h = ke.offsetHeight;
    const rn = noi.getBoundingClientRect();
    const than = canh.closest('.sk-the-than') || canh;
    const rt = than.getBoundingClientRect(), rc = canh.getBoundingClientRect();
    const day = Math.min(rt.bottom, rc.bottom) - 2;
    ke.hidden = !h || rn.top + top + h > day;
  }
  function capNhatKe() {
    st.henKe = false;
    const s = timSan();
    if (!st.bat || !s) return;
    s.querySelectorAll(SEL_KE).forEach((c) => { try { capNhatKe1(c); } catch (e) {} });
  }
  function henKe() {
    if (st.henKe) return;
    st.henKe = true;
    Promise.resolve().then(capNhatKe);
  }
  function batKe(s) {
    if (!s || st.qsKe || !window.MutationObserver) return;
    st.qsKe = new MutationObserver((ds) => {
      for (const m of ds) {
        const t = m.target;
        if (!t || !t.closest || t.closest('.pc1-ke')) continue;
        if (m.type === 'childList') {
          if ([...m.addedNodes].some((n) => n.nodeType === 1 && (n.matches(SEL_KE) || n.querySelector(SEL_KE)))) { henKe(); return; }
        } else if (t.classList && (t.classList.contains('sk-ht-dong') || t.classList.contains('sk-canh'))) { henKe(); return; }
      }
    });
    st.qsKe.observe(s, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    if (window.ResizeObserver) st.roKe = new ResizeObserver(() => henKe());
    henKe();
  }
  function tatKe(s) {
    if (st.qsKe) { try { st.qsKe.disconnect(); } catch (e) {} st.qsKe = null; }
    if (st.roKe) { try { st.roKe.disconnect(); } catch (e) {} st.roKe = null; }
    if (s) s.querySelectorAll('.pc1-ke').forEach((x) => x.remove());
  }

  function taoBoc(goc) {
    return function animate(kf, o) {
      if (st.bat && Array.isArray(kf) && kf.length && o && typeof o === 'object' && !o.pseudoElement) {
        try {
          if (this.closest && this.closest(SEL) && !giam()) {
            const r = doi(this, kf, o);
            if (r) return r;
          }
        } catch (e) { /* loi phong cach: roi ve hoat anh goc */ }
      }
      return goc.call(this, kf, o);
    };
  }

  function danNhan(s) {
    if (s && s.dataset && s.dataset.phongCach !== TEN) s.dataset.phongCach = TEN;
  }
  function timSan() { return st.san && st.san.isConnected ? st.san : document.getElementById('sanKhauGiang'); }

  function batDau(stageEl) {
    if (!st.mask) st.mask = dinhMask();
    if (!st.boc) {
      // boc tren cung (co the chong len boc cua phong cach khac — ketThuc go dung lop cua minh)
      st.goc = Element.prototype.animate;
      st.boc = taoBoc(st.goc);
      Element.prototype.animate = st.boc;
    }
    st.bat = true;
    st.san = stageEl || document.getElementById('sanKhauGiang') || null;
    if (st.san) { danNhan(st.san); batKe(st.san); }
    // San khau do dao dien tao muon (nhip dau): cho no xuat hien roi gan nhan
    if (!st.san && !st.quanSat && window.MutationObserver && document.body) {
      st.quanSat = new MutationObserver(() => {
        const s = document.getElementById('sanKhauGiang');
        if (!s) return;
        st.san = s;
        if (st.bat) { danNhan(s); batKe(s); }
        try { st.quanSat.disconnect(); } catch (e) {}
        st.quanSat = null;
      });
      st.quanSat.observe(document.body, { childList: true, subtree: true });
    }
  }

  function ketThuc(stageEl) {
    st.bat = false;
    if (st.quanSat) { try { st.quanSat.disconnect(); } catch (e) {} st.quanSat = null; }
    if (st.boc && Element.prototype.animate === st.boc) { Element.prototype.animate = st.goc; st.boc = null; }
    // (phong cach khac da boc chong len tren: boc cua minh o lai ben duoi nhung da tat (st.bat = false) —
    //  chi chuyen tiep nguyen ven; batDau lan sau dung lai no, khong boc them lop)
    const s = stageEl || timSan();
    tatKe(s);
    if (s) {
      s.querySelectorAll('.pc1-bong').forEach((x) => x.remove());
      if (s.dataset && s.dataset.phongCach === TEN) delete s.dataset.phongCach;
    }
    st.san = null;
  }

  window.SenseiPhongCach = window.SenseiPhongCach || {};
  window.SenseiPhongCach[TEN] = { ten: 'Giấy washi', batDau, ketThuc };
})();
