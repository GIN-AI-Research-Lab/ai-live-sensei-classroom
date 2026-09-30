/* ==========================================================================
   Che do san khau A — "Bento động" (chuyen tu ban mau scratchpad demo-bai1/a sang san khau SONG).
   Ca vung san khau la MOT luoi o bo tron; moi nhip (va mot so cue) khai bao vi tri dich cua tung o,
   GSAP truot (FLIP left/top/width/height, expo / power4) giua hai bo cuc: o moi bay vao, o bo di thu
   nho bien mat. Noi dung trong o la cac LOP (mat na chu troi len, bat no, ve vach) doi theo cue cua
   dao dien — moc lay tu tieng Sensei (tt.T), tieu diem toi truoc tieng 80 ms, vao <= 200 ms.
   O "S" (Sensei) o goc phai duoi: loi Sensei song (ban ghi), ten phan, tien do chuong; meo THAT dung
   trong goc do (api.meo()) — chu trong o S chua cho meo.
   Du lieu that cua MOI bai (vocab / kanji / kana / mau cau / vi du / hoi thoai / bai tap / the chuong /
   the ket bai); bai tap: the that #card-<id> vao o F (oBaiTap), cham bai y nguyen.
   Dang ky: SenseiCheDo.dangKy({ id: 'a', ... }) — hop dong: scratchpad che-do/HUONG-DAN.md.
   ========================================================================== */
(function () {
  'use strict';
  const SC = window.SenseiCheDo;
  if (!SC) return;

  const ID = 'a';
  const DOC_TRO = { 'は': 'wa', 'へ': 'e', 'を': 'o' };
  const RE_DAU = /^[、。，．,.！？!?・…‥」』）)】〉》「『（(【〈《\s]+$/;
  const RE_JP = /[぀-ヿ一-鿿々〆〜ー]/;

  // ------------------------------------------------------------------ trang thai che do
  let L = null;          // lop .cd-lop
  let C = null;          // ctx / tien ich dao dien (CDH)
  let G = null;          // gsap
  let O = {};            // id o -> { id, o, than, tones, tone, rect, lops }
  const st = {
    W: 0, H: 0, dt: false, meo: null,
    bo: '',              // ten bo cuc dang dung
    nhip: null,          // nhip dang giang (thong tin cua dao dien)
    m: null,             // doi tuong nhip dang song
    dem: 0,              // so nhip da dung (luan phien bien the bo cuc)
    loiLuc: 0, loiCau: '', loiHen: 0,
    tien: [], chip: null, sDong: null, sChu: null, sTen: null, sTien: null, sMatane: null,
    tuChuong: [],        // tu vung da hoc trong chuong (dai "Từ mới")
    khoi: null,          // khoi cong thuc dang tren ray: { ids, phan, cua: 'grammar'|'example'|'kaiwa', sub }
  };

  // ------------------------------------------------------------------ tien ich
  const esc = (s) => (C ? C.esc(s) : String(s == null ? '' : s));
  const jp = (s) => (C ? C.jp(s) : esc(s));
  const kep = (x, a, b) => Math.max(a, Math.min(b, x));
  const giam = () => !!(C && C.giam);
  const D = (s) => (giam() ? 0 : s);
  const kyTu = (s) => Array.from(String(s == null ? '' : s));
  /** Be ngang uoc cua chuoi (don vi em): chu Nhat 1, chu Latin ~.58 */
  const em = (s) => kyTu(s).reduce((a, c) => a + (RE_JP.test(c) ? 1 : /[\s]/.test(c) ? 0.3 : /[A-ZĐ]/.test(c) ? 0.7 : 0.58), 0);
  const chuTok = (t) => String((t && (t.kanji || t.text)) || '').trim();
  const laDau = (t) => RE_DAU.test(chuTok(t) || ' ');
  function tachNgoac(s) {
    const m = /^(.*?)\s*[(（]([^)）]*)[)）]\s*$/.exec(String(s || ''));
    return m ? [m[1].trim(), m[2].trim()] : [String(s || '').trim(), ''];
  }
  const ngan = (s, n) => { const a = kyTu(String(s || '').trim()); return a.length <= n ? a.join('') : a.slice(0, n - 1).join('') + '…'; };
  const cauDau = (s) => String(s || '').split(/(?<=[.!?。！？])\s+/)[0] || '';
  const boNgoacCuoi = (s) => String(s || '').replace(/\s*[(（][^)）]*[)）]\s*$/, '').trim();

  // ------------------------------------------------------------------ toa do (ban thiet ke -> px that)
  // May tinh: ban thiet ke 1920x1080 (le 40, khe 20) giong video. Dien thoai: 390x679 (le 10, khe 8).
  function doKhung() {
    const k = C.khung();
    st.W = k.w || L.clientWidth || 1;
    st.H = k.h || L.clientHeight || 1;
    st.dt = st.W < 640 || (st.W < 820 && st.H > st.W * 1.2);
    st.meo = C.meo();
    const u = st.dt ? Math.min(st.W / 780, 0.6) : Math.min(st.W / 1920, st.H / 1080);
    L.style.setProperty('--a-u', u.toFixed(4) + 'px');
    if (st.dt) L.dataset.hep = '1'; else delete L.dataset.hep;
  }
  const DW = () => (st.dt ? 390 : 1920);
  const DH = () => (st.dt ? 679 : 1080);
  function px(r) {
    if (!r) return null;
    const sx = st.W / DW(), sy = st.H / DH();
    const x = Math.round(r.x * sx), y = Math.round(r.y * sy);
    const w = Math.round((r.x + r.w) * sx) - x, h = Math.round((r.y + r.h) * sy) - y;
    return Object.assign({}, r, { x, y, w, h });
  }
  const R = (x, y, w, h, o) => Object.assign({ x, y, w, h }, o || {});

  // ------------------------------------------------------------------ o (tile)
  function taoO(id, z) {
    const o = document.createElement('div');
    o.className = 'a-o';
    o.dataset.o = id;
    o.style.zIndex = z || 10;
    o.innerHTML = '<div class="a-bong"></div><div class="a-than"></div>';
    L.appendChild(o);
    const h = { id, o, than: o.lastChild, tones: {}, tone: null, rect: null, lops: [] };
    O[id] = h;
    if (G) G.set(o, { autoAlpha: 0 });
    return h;
  }
  const o_ = (id) => O[id] || taoO(id);
  function toneEl(h, k) {
    if (!k) return null;
    if (!h.tones[k]) {
      const t = document.createElement('div');
      t.className = 'a-tone a-tone-' + k;
      h.than.insertBefore(t, h.than.firstChild);
      h.tones[k] = t;
      G.set(t, { opacity: 0 });
    }
    return h.tones[k];
  }
  function doiTone(h, moi, tre, dur) {
    if (h.tone === moi) return;
    const cu = h.tone;
    dur = dur == null ? 0.5 : dur;
    if (cu && h.tones[cu]) G.to(h.tones[cu], { opacity: 0, duration: D(dur), ease: 'power1.inOut', delay: tre || 0, overwrite: 'auto' });
    const t = toneEl(h, moi);
    if (t) G.to(t, { opacity: 1, duration: D(dur), ease: 'power1.inOut', delay: tre || 0, overwrite: 'auto' });
    h.tone = moi;
    h.o.dataset.tone = moi || '';
  }
  /**
   * Bo cuc: dat { id: rect | null } (rect ban thiet ke). O moi vao (fx: 'len' | 'phu' | 'slot' | 'bay'),
   * o cu doi cho (FLIP), null = thu nho bien mat. opt.tre (giay), opt.stag (giay / o).
   */
  function canh(dat, opt) {
    opt = opt || {};
    let i = 0;
    Object.keys(dat).forEach((id) => {
      const r0 = dat[id];
      const r = r0 ? px(r0) : null;
      const h = r ? o_(id) : O[id];
      if (!h) return;
      const tre = (opt.tre || 0) + (opt.stag || 0) * (i++) + ((r0 && r0.tre) || 0);
      if (r && r.z != null) h.o.style.zIndex = r.z;
      if (r && !h.rect) vaoO(h, r, tre);
      else if (r && h.rect) doiO(h, h.rect, r, tre);
      else if (!r && h.rect) raO(h, tre);
      const tone = r0 && r0.tone !== undefined ? r0.tone : opt.tone;
      if (r && tone !== undefined) doiTone(h, tone, tre, h.rect ? 0.5 : 0.001);
      h.rect = r || null;
    });
  }
  function vaoO(h, r, tre) {
    const o = h.o;
    const dich = { left: r.x, top: r.y, width: r.w, height: r.h };
    G.killTweensOf(o);
    if (giam()) { G.set(o, Object.assign({ autoAlpha: 1, x: 0, y: 0, scale: 1, rotation: 0 }, dich)); return; }
    if (r.fx === 'bay' && r.tu) {
      const f = px(r.tu);
      G.fromTo(o, { left: f.x, top: f.y, width: f.w, height: f.h, autoAlpha: 1, scale: 1, y: 0 },
        Object.assign({ duration: 0.78, ease: 'expo.inOut', delay: tre }, dich));
      return;
    }
    G.set(o, Object.assign({}, dich));
    if (r.fx === 'slot') {
      G.fromTo(o, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.14, ease: 'none', delay: tre });
      G.fromTo(o, { y: 70, scale: 0.84, rotation: -4 }, { y: 0, scale: 1, rotation: 0, duration: 0.62, ease: 'back.out(1.5)', delay: tre });
    } else if (r.fx === 'phu') {
      G.fromTo(o, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: 'none', delay: tre });
      G.fromTo(o, { y: 26, scale: 0.94 }, { y: 0, scale: 1, duration: 0.7, ease: 'expo.out', delay: tre });
    } else {
      G.fromTo(o, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.26, ease: 'power1.out', delay: tre });
      G.fromTo(o, { y: 32, scale: 0.92 }, { y: 0, scale: 1, duration: 0.85, ease: 'expo.out', delay: tre });
    }
  }
  function raO(h, tre) {
    const o = h.o;
    if (giam()) { G.set(o, { autoAlpha: 0 }); boLop(h); return; }
    G.to(o, { autoAlpha: 0, scale: 0.9, duration: 0.28, ease: 'power2.in', delay: tre, overwrite: 'auto', onComplete: () => boLop(h) });
  }
  function doiO(h, a, r, tre) {
    const giong = a.x === r.x && a.y === r.y && a.w === r.w && a.h === r.h;
    G.set(h.o, { autoAlpha: 1, scale: 1, y: 0, rotation: 0 });
    if (giong) return;
    if (giam()) { G.set(h.o, { left: r.x, top: r.y, width: r.w, height: r.h }); return; }
    G.to(h.o, { left: r.x, top: r.y, width: r.w, height: r.h, duration: r.dur || 0.9, ease: r.ease || 'power4.inOut', delay: tre, overwrite: 'auto' });
  }
  function boLop(h) { h.lops.forEach((x) => x.remove()); h.lops = []; }
  function goHetO() { Object.keys(O).forEach((k) => { try { O[k].o.remove(); } catch (e) {} }); O = {}; }

  // ------------------------------------------------------------------ lop noi dung
  /**
   * Dat noi dung moi cho o id: lop moi hien (mat na / iris), lop cu lui len mo di. Phan tu con co
   * data-fx ('mat' | 'no' | 've' | 'mo' | 'len') + data-tre (giay) hien theo nhip. o.cho: phan tu
   * [data-cho] giu an toi luc hienCho(khoa).
   */
  function lop(id, html, o) {
    o = o || {};
    const h = o_(id);
    const cu = h.lops.slice();
    const el = document.createElement('div');
    el.className = 'a-lop' + (o.cls ? ' ' + o.cls : '');
    el.innerHTML = html;
    if (o.z) el.style.zIndex = o.z;
    h.than.appendChild(el);
    const tre = o.tre || 0;
    const coCu = cu.length > 0 && !o.iris;
    if (o.iris && !giam()) {
      G.set(el, { autoAlpha: 1 });
      G.fromTo(el, { clipPath: 'circle(0% at 50% 58%)' }, { clipPath: 'circle(76% at 50% 58%)', duration: 1.0, ease: 'expo.inOut', delay: tre, onComplete: () => { el.style.clipPath = ''; } });
    } else {
      G.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: D(o.moVao || 0.12), ease: 'none', delay: tre + (coCu ? D(0.12) : 0) });
    }
    el.querySelectorAll('[data-fx]').forEach((x) => hieu(x, tre + (coCu ? 0.12 : 0) + (+x.dataset.tre || 0), x.dataset.fx));
    if (o.kb && !giam()) {
      const img = el.querySelector('img');
      if (img) G.fromTo(img, { scale: o.kb[0] }, { scale: o.kb[1], duration: o.kbDur || 9, ease: 'none', delay: tre });
    }
    cu.forEach((x) => {
      if (o.iris) { G.to(x, { autoAlpha: 0, duration: 0.01, delay: tre + D(1.05), onComplete: () => x.remove() }); return; }
      G.to(x, { autoAlpha: 0, y: D(o.raY == null ? -16 : o.raY), duration: D(0.18), ease: 'power2.in', delay: tre, overwrite: 'auto', onComplete: () => x.remove() });
    });
    h.lops = [el];
    return el;
  }
  function hieu(it, tre, fx) {
    if (giam()) { G.set(it, { autoAlpha: 1, clearProps: 'transform' }); G.fromTo(it, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, delay: tre }); return; }
    switch (fx) {
      case 'mat':
        G.set(it, { autoAlpha: 1 });
        if (it.firstElementChild) G.fromTo(it.firstElementChild, { yPercent: 112 }, { yPercent: 0, duration: 0.7, ease: 'expo.out', delay: tre });
        break;
      case 'no':
        G.fromTo(it, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: 'none', delay: tre });
        G.fromTo(it, { scale: 0.55 }, { scale: 1, duration: 0.6, ease: 'back.out(1.9)', delay: tre });
        break;
      case 've':
        G.fromTo(it, { autoAlpha: 1, scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: 'power3.inOut', delay: tre });
        break;
      case 'mo':
        G.fromTo(it, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: 'power1.out', delay: tre });
        break;
      default:
        G.fromTo(it, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: 'none', delay: tre });
        G.fromTo(it, { y: 30 }, { y: 0, duration: 0.7, ease: 'expo.out', delay: tre });
    }
  }
  /** Hien cac phan tu [data-cho=khoa] trong o (luc cue): an san bang CSS (.a-cho), hien bang fx cua no */
  function hienCho(id, khoa, tre) {
    const h = O[id];
    if (!h) return false;
    let co = false;
    h.lops.forEach((l) => l.querySelectorAll(`[data-cho="${khoa}"]`).forEach((x) => {
      if (x.dataset.da) return;
      x.dataset.da = '1';
      co = true;
      hieu(x, tre || 0, x.dataset.fxCho || 'mat');
    }));
    return co;
  }
  /** Mat na chu (troi len tu duoi vach) */
  const mk = (html, cls, tre) => `<span class="a-mk ${cls || ''}" data-fx="mat"${tre ? ` data-tre="${tre}"` : ''}><span class="a-mk-i">${html}</span></span>`;
  const mkCho = (html, cls, khoa) => `<span class="a-mk a-cho ${cls || ''}" data-cho="${khoa}"><span class="a-mk-i">${html}</span></span>`;
  const nhan = (text, tre) => `<div class="a-nhan" data-fx="mo"${tre ? ` data-tre="${tre}"` : ''}>${esc(text)}</div>`;

  // ------------------------------------------------------------------ nhan manh (tieu diem theo tieng)
  /** Nhip o: phong nhe 160 ms roi dan hoi (tieu diem toi CUNG luc tieng: tre = api.tre(tt)) */
  function nhip(id, tre, s) {
    const h = O[id];
    if (!h || !h.rect || giam()) return;
    s = s || 1.045;
    G.timeline({ delay: tre || 0 })
      .to(h.o, { scale: s, duration: 0.14, ease: 'power2.out', overwrite: false })
      .to(h.o, { scale: 1, duration: 0.55, ease: 'elastic.out(1, 0.55)' });
  }
  /** Vien sang (ring) cua o: vao 160 ms, giu giu giay roi mo */
  function vien(id, tre, mau, giu) {
    const h = O[id];
    if (!h) return;
    let v = h.than.querySelector(':scope > .a-vien');
    if (!v) { v = document.createElement('div'); v.className = 'a-vien'; h.than.appendChild(v); }
    v.style.setProperty('--a-vien', mau || 'var(--a-cam)');
    G.killTweensOf(v);
    G.fromTo(v, { opacity: 0 }, { opacity: 1, duration: giam() ? 0.01 : 0.16, ease: 'none', delay: tre || 0 });
    if (giu !== true) G.to(v, { opacity: 0, duration: 0.6, ease: 'power1.in', delay: (tre || 0) + (giu || 0.55) });
  }
  function boVien(id) { const h = O[id]; const v = h && h.than.querySelector(':scope > .a-vien'); if (v) { G.killTweensOf(v); G.to(v, { opacity: 0, duration: 0.2 }); } }
  /** Tieu diem = nhip + vien, ca hai vao <= 200 ms */
  function tieuDiem(id, tre, s) { nhip(id, tre, s); vien(id, tre); }
  function lac(el, tre, amp) {
    if (!el || giam()) return;
    const tl = G.timeline({ delay: tre || 0 });
    [1, -1, 0.7, -0.5, 0.25, 0].forEach((k, i) => tl.to(el, { x: (amp || 12) * k, duration: i === 5 ? 0.12 : 0.07, ease: 'sine.inOut' }));
  }

  // ------------------------------------------------------------------ o Sensei (loi song + tien do)
  function taoS() {
    const h = o_('S');
    h.o.style.zIndex = 20;
    h.o.classList.add('a-o-s');
    h.than.insertAdjacentHTML('beforeend', `
      <div class="a-s-ten">Sensei Mèo</div>
      <div class="a-s-chip"></div>
      <div class="a-s-chu"><div class="a-s-dong"></div></div>
      <div class="a-s-tien"></div>
      <div class="a-s-matane" lang="ja">またね！</div>`);
    st.sTen = h.than.querySelector('.a-s-ten');
    st.chip = h.than.querySelector('.a-s-chip');
    st.sChu = h.than.querySelector('.a-s-chu');
    st.sDong = h.than.querySelector('.a-s-dong');
    st.sTien = h.than.querySelector('.a-s-tien');
    st.sMatane = h.than.querySelector('.a-s-matane');
    G.set(st.sMatane, { autoAlpha: 0 });
    return h;
  }
  /** Cho cua meo trong o S: le phai cua chu = phan o S nam trong goc meo (+ 12 px) */
  function choMeo() {
    const h = O.S;
    if (!h || !h.rect || !st.sChu) return;
    const m = st.meo;
    let phai = 18;
    if (m) {
      const r = h.rect;
      const chong = r.x + r.w - m.x;
      if (chong > 0 && r.y + r.h > m.y) phai = Math.min(r.w * 0.62, chong + 12);
    }
    h.than.style.setProperty('--a-meo', Math.round(phai) + 'px');
  }
  function datChip(text) {
    if (!st.chip || st.chip.textContent === text) return;
    st.chip.textContent = text;
    if (!giam()) G.fromTo(st.chip, { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' });
  }
  function datTien(nh) {
    if (!st.sTien) return;
    const c = nh && nh.chuong;
    const n = c && c.n ? Math.min(c.n, 14) : 0;
    const i = c && c.i ? c.i : 0;
    if (st.sTien.childElementCount !== n) st.sTien.innerHTML = Array.from({ length: n }, () => '<i><b></b></i>').join('');
    const bs = st.sTien.querySelectorAll('b');
    const k = n && c.n > 14 ? Math.round(i / c.n * n) : i;
    bs.forEach((b, j) => {
      const moi = j < k - 1 ? 1 : 0;
      if (j === k - 1) G.fromTo(b, { scaleX: 0 }, { scaleX: 1, duration: D(0.6), ease: 'power2.inOut', delay: 0.2 });
      else G.set(b, { scaleX: moi });
    });
  }
  /** Loi Sensei song (ban ghi luot hien tai): cau cuoi, cau moi truot len 14 px */
  function datLoi(raw) {
    if (!st.sDong) return;
    const ds = String(raw || '').replace(/\s+/g, ' ').trim().split(/(?<=[.!?。！？…])\s+/).filter(Boolean);
    if (!ds.length) return;
    let cau = ds[ds.length - 1];
    if (ds.length > 1 && kyTu(cau).length < 14) cau = ds[ds.length - 2] + ' ' + cau;
    cau = ngan(cau, st.dt ? 70 : 110);
    const moi = !st.loiCau || !cau.startsWith(st.loiCau.slice(0, Math.min(12, st.loiCau.length)));
    st.loiCau = cau;
    st.sDong.innerHTML = jp(cau);
    if (moi && !giam()) G.fromTo(st.sDong, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
    else G.set(st.sDong, { autoAlpha: 1, y: 0 });
  }
  /** O Sensei o the ket bai: dong loi len tren, またね！ o duoi */
  function datS(xong) { const h = O.S; if (h) h.than.classList.toggle('a-s-xong', !!xong); if (!xong && st.sMatane) G.set(st.sMatane, { autoAlpha: 0 }); }
  function xoaLoi() { st.loiCau = ''; if (st.sDong) { G.to(st.sDong, { autoAlpha: 0, duration: D(0.15), overwrite: 'auto' }); } }

  // ------------------------------------------------------------------ bo cuc tung dang nhip
  // Dai day (hang o S) — may tinh y 800..1040; dien thoai y 573..669
  const BO = {
    tieuDe: () => (st.dt ? {
      A: R(10, 10, 370, 300, { tone: 'kem' }), D: R(10, 318, 370, 150, { tone: 'cam' }), B: R(10, 476, 181, 89), C: R(199, 476, 181, 89), S: R(10, 573, 370, 96, { tone: 'dao' }),
    } : {
      A: R(40, 40, 1060, 1000, { tone: 'kem' }), D: R(1120, 40, 760, 460, { tone: 'cam' }), B: R(1120, 520, 370, 260), C: R(1510, 520, 370, 260), S: R(1120, 800, 760, 240, { tone: 'dao' }),
    }),
    vocab: (k) => {
      if (st.dt) {
        return k % 2 === 0 ? {
          D: R(10, 10, 370, 196), A: R(10, 214, 181, 214), B: R(199, 214, 181, 103), C: R(199, 325, 181, 103), E: R(10, 436, 370, 129), S: R(10, 573, 370, 96, { tone: 'dao' }),
        } : {
          D: R(10, 10, 370, 196), A: R(199, 214, 181, 214), B: R(10, 214, 181, 103), C: R(10, 325, 181, 103), E: R(10, 436, 370, 129), S: R(10, 573, 370, 96, { tone: 'dao' }),
        };
      }
      const v = [
        { A: R(40, 40, 900, 1000), D: R(960, 40, 920, 460), B: R(960, 520, 450, 260), C: R(1430, 520, 450, 260), S: R(960, 800, 920, 240, { tone: 'dao' }), E: null },
        { A: R(40, 40, 1060, 1000), D: R(1120, 40, 760, 420), B: R(1120, 480, 370, 300), C: R(1510, 480, 370, 300), S: R(1120, 800, 760, 240, { tone: 'dao' }), E: null },
        { A: R(40, 40, 1100, 740), E: R(40, 800, 1100, 240, { tre: 0.4 }), D: R(1160, 40, 720, 460), B: R(1160, 520, 350, 260), C: R(1530, 520, 350, 260), S: R(1160, 800, 720, 240, { tone: 'dao' }) },
      ];
      return v[k % 3];
    },
    kanji: () => (st.dt ? {
      A: R(10, 10, 214, 214, { tone: 'kem' }), D: R(232, 10, 148, 214), B: R(10, 232, 370, 100), C: R(10, 340, 370, 225), E: null, S: R(10, 573, 370, 96, { tone: 'dao' }),
    } : {
      A: R(40, 40, 740, 740, { tone: 'kem' }), D: R(800, 40, 1080, 460), B: R(800, 520, 530, 260), C: R(1350, 520, 530, 260), E: R(40, 800, 740, 240), S: R(800, 800, 1080, 240, { tone: 'dao' }),
    }),
    nguPhap: (coB) => (st.dt ? {
      D: R(10, 10, 370, 74), RAY: R(10, 92, 370, 236, { tone: 'ray', z: 12 }), B: R(10, 336, 370, 229), A: null, S: R(10, 573, 370, 96, { tone: 'dao' }),
    } : Object.assign({
      D: R(40, 40, 1840, 140, { z: 24 }), RAY: R(40, 200, 1840, 400, { tone: 'ray', z: 12 }), A: R(40, 620, 560, 420, { z: 9 }),
    }, coB ? { B: R(620, 620, 1260, 160, { tre: 0.08 }), S: R(620, 800, 1260, 240, { tone: 'dao' }) } : { S: R(620, 620, 1260, 420, { tone: 'dao' }), B: null })),
    viDu: () => (st.dt ? {
      RAY: R(10, 10, 370, 250, { tone: 'ray', z: 12 }), A: R(10, 268, 146, 297), B: R(164, 268, 216, 297), D: null, S: R(10, 573, 370, 96, { tone: 'dao' }),
    } : {
      RAY: R(40, 40, 1840, 420, { tone: 'ray', z: 12 }), A: R(40, 480, 560, 560), B: R(620, 480, 1260, 300), D: null, S: R(620, 800, 1260, 240, { tone: 'dao' }),
    }),
    kaiwaIntro: (n) => {
      const vai = {};
      if (st.dt) {
        const w = n > 2 ? 118 : 181;
        for (let p = 0; p < 4; p++) vai['P' + p] = p < n ? R(10 + p * (w + 8), 318, w, 110, { fx: 'phu', tre: 0.12 + p * 0.07 }) : null;
        return Object.assign({ A: R(10, 10, 370, 300), D: R(10, 436, 370, 129, { tone: 'cam' }), S: R(10, 573, 370, 96, { tone: 'dao' }) }, vai);
      }
      const cot = n > 2 ? 2 : 1;
      const w = cot === 2 ? 350 : 720, h = n > 2 ? 190 : 190;
      for (let p = 0; p < 4; p++) vai['P' + p] = p < n ? R(1160 + (p % cot) * (w + 20), 360 + Math.floor(p / cot) * (h + 20), w, h, { fx: 'phu', tre: 0.15 + p * 0.08 }) : null;
      return Object.assign({ A: R(40, 40, 1100, 1000), D: R(1160, 40, 720, 300, { tone: 'cam' }), S: R(1160, 800, 720, 240, { tone: 'dao' }) }, vai);
    },
    kaiwa: () => (st.dt ? {
      A: R(10, 10, 140, 250), RAY: R(158, 10, 222, 250, { tone: 'ray', z: 12 }), B: R(10, 268, 370, 160), E: R(10, 436, 370, 129), S: R(10, 573, 370, 96, { tone: 'dao' }),
    } : {
      A: R(40, 40, 560, 1000), RAY: R(620, 40, 1260, 420, { tone: 'ray', z: 12 }), B: R(620, 480, 1260, 300), E: null, S: R(620, 800, 1260, 240, { tone: 'dao' }),
    }),
    quiz: (cho) => {
      if (st.dt) {
        return cho ? { F: R(10, 10, 370, 555, { z: 45 }), A: null, O1: null, O2: null, O3: null, O4: null, S: R(10, 573, 370, 96, { tone: 'dao' }) } : {
          F: R(10, 10, 370, 190, { z: 45 }), A: R(10, 404, 370, 161), S: R(10, 573, 370, 96, { tone: 'dao' }),
        };
      }
      return cho ? { F: R(760, 40, 1120, 740, { z: 45 }), A: R(40, 40, 700, 1000, { z: 45 }), O1: null, O2: null, O3: null, O4: null, S: R(760, 800, 1120, 240, { tone: 'dao' }) } : {
        A: R(40, 40, 700, 1000, { z: 45, ease: 'expo.out', dur: 0.9 }), F: R(760, 40, 1120, 340, { z: 45, tre: 0.03, ease: 'expo.out', dur: 0.9 }), S: R(760, 800, 1120, 240, { tone: 'dao', tre: 0.05 }),
      };
    },
    oQuiz: (i) => (st.dt ? R(10 + (i % 2) * 189, 208 + Math.floor(i / 2) * 98, 181, 90, { z: 46, fx: 'phu' })
      : R(760 + (i % 2) * 570, 400 + Math.floor(i / 2) * 200, 550, 180, { z: 46, fx: 'phu' })),
    chuong: () => (st.dt ? {
      D: R(10, 10, 370, 250, { tone: 'cam' }), A: R(10, 268, 370, 160), B: R(10, 436, 370, 129), S: R(10, 573, 370, 96, { tone: 'dao' }),
    } : {
      A: R(40, 40, 700, 1000, { z: 30 }), D: R(760, 40, 1120, 460, { tone: 'cam', z: 30 }), B: R(760, 520, 1120, 260, { z: 30 }), S: R(760, 800, 1120, 240, { tone: 'dao' }),
    }),
    xong: () => (st.dt ? {
      R1: R(10, 10, 118, 200, { fx: 'phu' }), R2: R(136, 10, 118, 200, { fx: 'phu', tre: 0.08 }), R3: R(262, 10, 118, 200, { fx: 'phu', tre: 0.16 }),
      R4: R(10, 218, 370, 347, { fx: 'phu', tre: 0.24 }), S: R(10, 573, 370, 96, { tone: 'dao' }),
    } : {
      R1: R(40, 40, 600, 600, { fx: 'phu', z: 50 }), R2: R(660, 40, 600, 600, { fx: 'phu', tre: 0.08, z: 50 }), R3: R(1280, 40, 600, 600, { fx: 'phu', tre: 0.16, z: 50 }),
      R4: R(40, 660, 1000, 380, { fx: 'phu', tre: 0.24, z: 50 }), S: R(1060, 660, 820, 380, { tone: 'dao' }),
    }),
  };
  /** Mot bo cuc moi: moi o khong co trong dat (tru S) bi thu lai */
  function boCuc(ten, dat, opt) {
    const moi = Object.assign({}, dat);
    Object.keys(O).forEach((id) => { if (!(id in moi) && id !== 'S' && !/^K\d+_\d+$/.test(id) && O[id].rect) moi[id] = null; });
    st.bo = ten;
    st.boCuoi = moi;
    canh(moi, Object.assign({ stag: 0.03, tone: null }, opt || {}));
    choMeo();
  }

  // ------------------------------------------------------------------ anh
  function anhHtml(url, o) {
    o = o || {};
    // Khong co anh (vd bai Nhap mon): o anh thanh the chu lon tren nen dao (khong de o trong)
    if (!url) return `<div class="a-anh-lop is-trong"><div class="a-vong v1"></div><div class="a-vong v2"></div><div class="a-anh-chu"${RE_JP.test(o.thay || '') ? ' lang="ja"' : ''} style="${coDong(o.thay || '', 46, 80)}">${esc(o.thay || '')}</div>${o.thayPhu ? `<div class="a-anh-phu">${esc(o.thayPhu)}</div>` : ''}</div>`;
    return `<div class="a-anh-lop"><img src="${esc(url)}" alt="" decoding="async" draggable="false"${o.pos ? ` style="object-position:${esc(o.pos)}"` : ''} onerror="this.parentNode.classList.add('is-hong')"/>${o.them || ''}</div>`;
  }
  /** Doi anh o id (iris): khong doi neu cung anh */
  function datAnh(id, url, o) {
    o = o || {};
    const h = o_(id);
    const khoa = url || ('chu:' + (o.thay || ''));
    if (h.anh === khoa && h.lops.length && !o.them) return h.lops[0];
    h.anh = khoa;
    return lop(id, anhHtml(url, o), { iris: !o.ngay, kb: o.kb || [1.0, 1.06], kbDur: 10, tre: o.tre || 0 });
  }
  const anhBai = (nh) => (nh && nh.bai && nh.bai.sceneImageUrl) || null;

  // ------------------------------------------------------------------ co chu theo do dai (khong tran o)
  /** Co chu (cqh) cho mot dong n em trong o: lon nhat ma van vua be ngang (cqw) */
  const coDong = (s, cqh, cqw) => `font-size:min(${cqh}cqh, ${(cqw / Math.max(1, em(s))).toFixed(2)}cqw)`;
  /** Co chu cho doan co the xuong dong (toi da `dong` dong, be ngang `cqw`): ngan thi to nhu mot dong */
  const coDoan = (s, cqh, cqw, dong) => {
    // L dong: co <= be ngang (L * cqw / em) va <= chieu cao (cqh / L, khoang cach dong 1.15) — lay L tot nhat
    const e = Math.max(1, em(s));
    const ds = [];
    for (let L = 1; L <= (dong || 2); L++) ds.push(`min(${(cqw * L * (L > 1 ? 0.86 : 1) / e).toFixed(2)}cqw, ${(cqh / (L > 1 ? L * 1.15 : 1)).toFixed(2)}cqh)`);
    return `font-size:max(${ds.join(', ')})`;
  };

  // ================================================================== DUNG TUNG DANG NHIP
  // ---- mo dau bai (nhip dau tien cua buoi giang)
  function dungTieuDe(nh, api, m) {
    const bai = nh.bai || {};
    const title = String(bai.title || '');
    const so = bai.lessonNumber || '';
    const ten = title.replace(/^Bài\s*\d+\s*:\s*/, '').split(/\s+—\s+/)[0] || title;
    const phu = title.split(/\s+—\s+/)[1] || '';
    const soTu = (bai.vocabList || []).length, soMau = (bai.slides || []).length;
    boCuc('tieuDe', BO.tieuDe(), { stag: 0.09 });
    datAnh('A', anhBai(nh), { ngay: true, kb: [1.12, 1.0], them: `<div class="a-chip-anh" data-fx="len" data-tre="1.2">${esc(ngan(bai.sceneImageAlt ? cauDau(String(bai.sceneImageAlt).split('—').pop()) : ten, 34))}</div>` });
    lop('D', `<div class="a-vong v1"></div><div class="a-vong v2"></div><div class="a-vong v3"></div>
      <div class="a-pad a-tren-cam">${nhan((nh.capDo === 'KANA' ? 'Nhập môn' : 'Sơ cấp · ' + (nh.capDo || '')), 0.45)}
      <div class="a-giua a-trai"><div><div>${mk('Bài ' + esc(so), 'a-bai-so', 0.2)}</div><div>${mk(esc(ten), 'a-bai-ten', 0.5)}</div></div></div></div>`);
    if (soMau) {
      lop('B', `<div class="a-pad">${nhan('Ngữ pháp', 0.5)}<div class="a-so-hang" data-fx="len" data-tre="0.6"><span class="a-so">${soMau}</span><span class="a-so-phu">mẫu câu</span></div>
        <div class="a-chips">${phu.split('/').map((x) => x.trim()).filter(Boolean).slice(0, 5).map((x, i) => `<span class="a-chip" lang="ja" data-fx="no" data-tre="${(0.9 + i * 0.07).toFixed(2)}">${esc(x)}</span>`).join('')}</div></div>`);
    } else {
      const k = (bai.kanjiList || []).length;
      lop('B', `<div class="a-pad">${nhan(C.tenChuong('kanji', nh.capDo), 0.5)}<div class="a-so-hang" data-fx="len" data-tre="0.6"><span class="a-so">${k}</span><span class="a-so-phu">chữ</span></div>
        <div class="a-chips">${(bai.kanjiList || []).slice(0, 8).map((x, i) => `<span class="a-chip" lang="ja" data-fx="no" data-tre="${(0.9 + i * 0.06).toFixed(2)}">${esc(x.character || '')}</span>`).join('')}</div></div>`);
    }
    const tu = (bai.vocabList || []).filter((v) => v && v.imageUrl).slice(0, 3);
    lop('C', `<div class="a-pad">${nhan('Từ vựng', 0.6)}<div class="a-so-hang" data-fx="len" data-tre="0.75"><span class="a-so">${soTu}</span><span class="a-so-phu">từ mới</span></div>
      <div class="a-thumbs">${tu.map((v, i) => `<img src="${esc(v.imageUrl)}" alt="" data-fx="no" data-tre="${(1.0 + i * 0.1).toFixed(2)}">`).join('')}</div></div>`);
    datChip('Mở đầu');
    m.tieuDe = true;
  }

  // ---- tu vung
  function dungTuVung(nh, api, m) {
    const v = nh.data || {};
    const k = st.dem;
    const tu = String(v.kanji || v.word || '');
    const coRuby = v.kanji && v.furigana && v.furigana !== v.kanji;
    const doc = coRuby ? v.furigana : (v.word && v.word !== tu ? v.word : '');
    const nghia = String(v.meaningVi || '');
    let nghiaNgan = boNgoacCuoi(nghia.split(/[;；]/)[0]);
    if (kyTu(nghiaNgan).length > 44) nghiaNgan = nghiaNgan.split(/,\s*/).slice(0, 2).join(', ');
    const phuNghia = (/[(（]([^)）]+)[)）]/.exec(nghia) || [])[1] || '';
    const c = nh.chuong || {};
    const dai = String(v.accentNote || '').length > 30;
    const dat = BO.vocab(st.dt ? k : (dai ? 2 : ((c.i || k + 1) - 1) % 2));
    const tieuDe = m.tieuDe;
    const vao = () => {
      boCuc('vocab', dat);
      datAnh('A', v.imageUrl || anhBai(nh), { tre: 0.05, pos: '50% 40%', thay: v.furigana || v.word || tu, thayPhu: v.romaji || '' });
      // D: chu lon (co theo so chu)
      lop('D', `<div class="a-pad">${nhan('Từ vựng · ' + String(c.i || nh.i + 1).padStart(2, '0') + ' / ' + String(c.n || nh.n).padStart(2, '0'), 0.2)}</div>
        <div class="a-giua a-tuyet" style="padding-top:5cqh"><span class="a-kanji" lang="ja" data-fx="no" data-tre="0.15" style="${coDong(tu, st.dt ? 62 : 70, 84)}">${esc(tu)}</span></div>`, { raY: -40 });
      lop('B', `<div class="a-pad">${nhan('Cách đọc', 0.3)}<div class="a-giua a-cot a-trai-tren">
        <div>${mk(esc(doc || tu), 'a-doc', 0.35)}</div><div class="a-mt">${mk(esc(v.romaji || ''), 'a-romaji', 0.55)}</div></div></div>`, { raY: -30 });
      const loai = C.loaiTu(v.wordType);
      lop('C', `<div class="a-pad">${nhan('Nghĩa', 0.4)}<div class="a-giua a-cot a-trai-tren">
        <div class="a-truoc-nghia" data-an="V3">${loai ? `<span class="a-loai" data-fx="len" data-tre="0.55">${esc(loai)}</span>` : ''}</div>
        <div class="a-nghia-o" style="${coDoan(nghiaNgan || nghia, st.dt ? 30 : 34, 88, 3)}">${mkCho(esc(nghiaNgan || nghia), 'a-nghia', 'V3')}</div>
        ${phuNghia ? `<div class="a-nghia-nho a-cho" data-cho="V3" data-fx-cho="len">${esc(ngan(phuNghia, 60))}</div>` : ''}</div></div>`, { raY: -30 });
      // E: dai tu moi (bo cuc 3) / meo (dien thoai)
      if (dat.E) {
        const tuC = (nh.ctx.cacNhip || []).filter((b) => b && b.kind === 'vocab' && b.chapter === nh.beat.chapter);
        const vt = Math.max(0, tuC.findIndex((b) => b === nh.beat || b.index === nh.beat.index));
        const ds = tuC.slice(Math.max(0, Math.min(vt - 2, tuC.length - 3)), Math.max(0, Math.min(vt - 2, tuC.length - 3)) + 3).map((b) => b.data || {});
        if (st.dt) {
          lop('E', `<div class="a-pad a-hang">${nhan('Mẹo')}<div class="a-meo-chu">${v.accentNote ? mk(jp(v.accentNote), 'a-meo', 0.6) : `<span class="a-meo-trong">${esc(loai || 'Từ vựng')}</span>`}</div></div>`);
        } else if (ds.length) {
          lop('E', `<div class="a-pad a-hang">${nhan('Từ mới')}<div class="a-dai">${ds.map((x, i) => `<div class="a-dai-o" data-fx="len" data-tre="${(0.5 + i * 0.08).toFixed(2)}">${x.imageUrl ? `<img src="${esc(x.imageUrl)}" alt="">` : ''}<span lang="ja">${esc(x.kanji || x.word)}</span><em>${esc(ngan(boNgoacCuoi(x.meaningVi), 14))}</em></div>`).join('')}</div></div>`);
        } else {
          lop('E', `<div class="a-pad a-hang">${nhan('Mẹo')}<div class="a-meo-chu">${mkCho(jp(v.accentNote || loai), 'a-meo', 'V4')}</div></div>`);
        }
      }
      datChip('Từ vựng · ' + (c.i || '') + '/' + (c.n || ''));
    };
    if (tieuDe) {
      // mo dau: bo cuc tieu de giu toi luc Sensei doc tu (V1) / noi nghia, du phong 3.2 s sau tieng dau
      m.chuyen = () => { if (m.daVao) return; m.daVao = true; vao(); };
      m.henVao = null;
    } else { m.daVao = true; vao(); }
    m.vocab = { tu, v };
    m.hienNghia = () => {
      if (m.daNghia || !m.daVao) return;
      m.daNghia = true;
      const h = O.C;
      if (h) h.lops.forEach((l) => l.querySelectorAll('[data-an="V3"]').forEach((x) => G.to(x, { autoAlpha: 0, height: 0, marginBottom: 0, duration: D(0.2) })));
      hienCho('C', 'V3', 0);
    };
    if (!tieuDe) m.henNghia = api.hen(m.hienNghia, 3200);
    st.tuChuong.push(v);
    if (st.tuChuong.length > 20) st.tuChuong.shift();
  }
  function cueTuVung(m, id, tt, api) {
    const tre = api.tre(tt);
    if (!m.daVao) {
      if (id === 'V0') { m.henVao = api.hen(() => m.chuyen(), 3200); return; }
      m.chuyen();
    }
    switch (id) {
      case 'V0': tieuDiem('D', tre, 1.03); break;
      case 'V1': case 'V2': case 'V2b':
        tieuDiem('D', tre, 1.035); nhip('B', tre + 0.12, 1.03);
        if (id === 'V1' && !m.daNghia) { api.huyHen && api.huyHen(m.henNghia); m.henNghia = api.hen(m.hienNghia, 1800 + tre * 1000); }
        break;
      case 'V3': {
        m.daNghia = true;
        const h = O.C;
        if (h) h.lops.forEach((l) => l.querySelectorAll('[data-an="V3"]').forEach((x) => G.to(x, { autoAlpha: 0, height: 0, marginBottom: 0, duration: D(0.2), delay: tre })));
        hienCho('C', 'V3', tre);
        tieuDiem('C', tre);
        break;
      }
      case 'V4': case 'V5':
        if (O.E && O.E.rect && !st.dt && m.vocab && m.vocab.v.accentNote && !m.daLuuY) {
          m.daLuuY = true;
          doiTone(O.E, 'cam', tre, 0.45);
          lop('E', `<div class="a-pad a-hang a-tren-cam">${nhan('Lưu ý')}<div class="a-meo-chu">${mk(jp(ngan(m.vocab.v.accentNote, 70)), 'a-luu-y')}</div></div>`, { tre });
          nhip('E', tre, 1.03);
        } else if (st.dt && O.E && O.E.rect) {
          tieuDiem('E', tre, 1.03);
        } else if (!hienCho('E', 'V4', tre)) {
          const v = (m.vocab && m.vocab.v) || {};
          if (v.accentNote && O.C && O.C.rect) {
            const l = O.C.lops[0];
            if (l && !l.querySelector('.a-chip-cam')) {
              l.querySelector('.a-giua').insertAdjacentHTML('beforeend', `<div class="a-chip-cam">${jp(ngan(v.accentNote, st.dt ? 26 : 34))}</div>`);
              hieu(l.querySelector('.a-chip-cam'), tre, 'no');
            }
          }
        } else nhip('E', tre, 1.03);
        break;
      default: break;
    }
  }

  // ---- chu Han / chu cai (kana)
  function dungChuHan(nh, api, m) {
    const d = nh.data || {};
    const ch = String(d.character || '');
    const c = nh.chuong || {};
    const kana = nh.laKana;
    boCuc('kanji', BO.kanji());
    // A: o viet net (luoi + net mo, net ve dan luc K1 / K1b)
    const oA = lop('A', `<div class="a-pad">${nhan((kana ? 'Chữ cái' : 'Chữ Hán') + ' · ' + String(c.i || '').padStart(2, '0') + ' / ' + String(c.n || '').padStart(2, '0'), 0.2)}</div>
      <div class="a-net-o"><div class="a-net-khung"></div><span class="a-net-bong" lang="ja">${esc(ch)}</span></div>`);
    m.netO = oA.querySelector('.a-net-khung');
    m.netBong = oA.querySelector('.a-net-bong');
    m.ch = ch;
    const on = (Array.isArray(d.onyomi) ? d.onyomi : d.onyomi ? [d.onyomi] : []).filter(Boolean);
    const kun = (Array.isArray(d.kunyomi) ? d.kunyomi : d.kunyomi ? [d.kunyomi] : []).filter(Boolean);
    const tenLon = kana ? String(d.romaji || '') : String(d.hanViet || '');
    lop('D', `<div class="a-pad">${nhan(kana ? 'Cách đọc' : 'Hán Việt', 0.25)}<div class="a-giua a-cot a-trai-tren">
      <div>${mk(esc(tenLon), 'a-hv', 0.3)}</div>
      <div class="a-hv-nghia">${mkCho(jp(ngan(d.meaningVi || '', st.dt ? 40 : 60)), 'a-nghia-hv', 'K3')}</div>
      ${d.strokeCount ? `<div class="a-so-net" data-fx="len" data-tre="0.6">${esc(d.strokeCount)} nét</div>` : ''}</div></div>`);
    if (kana) {
      lop('B', `<div class="a-pad a-hang">${nhan('Mẹo nhớ')}<div class="a-meo-chu">${mkCho(jp(ngan(d.meoNho || d.meaningVi || '', st.dt ? 70 : 90)), 'a-meo', 'K4')}</div></div>`);
      if (O.E || !st.dt) lop('E', `<div class="a-pad a-hang">${nhan(d.sosanh ? 'Dễ nhầm' : 'Nét')}<div class="a-meo-chu">${d.sosanh ? mkCho(jp(ngan(d.sosanh, 70)), 'a-meo', 'K5') : `<span class="a-meo-trong">${esc(d.strokeCount || '')} nét · viết theo thứ tự</span>`}</div></div>`);
    } else {
      lop('B', `<div class="a-pad">${nhan('Âm đọc', 0.35)}<dl class="a-am">
        ${on.length ? `<div class="a-cho" data-cho="K5" data-fx-cho="len"><dt>On</dt><dd lang="ja">${esc(on.slice(0, 3).join('、'))}</dd></div>` : ''}
        ${kun.length ? `<div class="a-cho" data-cho="K6" data-fx-cho="len"><dt>Kun</dt><dd lang="ja">${esc(kun.slice(0, 3).join('、'))}</dd></div>` : ''}</dl></div>`);
      if (!st.dt) lop('E', `<div class="a-pad a-hang">${nhan(d.radicals || d.boThu ? 'Chiết tự' : 'Số nét')}<div class="a-meo-chu">${mkCho(jp(ngan(d.radicals || d.boThu || ((d.strokeCount || '') + ' nét — viết theo thứ tự chuẩn'), 60)), 'a-meo', 'K4')}</div></div>`);
    }
    const tu = (Array.isArray(d.commonWords) ? d.commonWords : []).slice(0, st.dt ? 3 : 3);
    const vl = (nh.bai && nh.bai.vocabList) || [];
    lop('C', `<div class="a-pad">${nhan(kana ? 'Từ ví dụ' : 'Từ ghép', 0.4)}<ul class="a-ghep">${tu.map((w, i) => {
      const v = vl.find((x) => x && x.imageUrl && (x.kanji === w.word || x.word === w.word));
      return `<li class="a-cho" data-cho="K7.${i}" data-fx-cho="len">${v ? `<img src="${esc(v.imageUrl)}" alt="">` : '<i class="a-ghep-cham"></i>'}<span class="a-ghep-tu" lang="ja">${C.ruby(w.word || '', w.furigana || '')}</span><em>${esc(ngan(w.meaningVi || '', 22))}</em></li>`;
    }).join('')}</ul></div>`);
    datChip((kana ? 'Chữ cái · ' : 'Chữ Hán · ') + (c.i || '') + '/' + (c.n || ''));
    hienHet(['B', 'C', 'E'], 0.55, 0.14);
    m.henNghia = api.hen(() => { hienCho('D', 'K3', 0); }, 3000);
  }
  /** Hien ngay (so le) moi dong [data-cho] cua cac o: noi dung nhan dien co san, cue chi dua tieu diem */
  function hienHet(ids, tre, buoc) {
    let k = 0;
    ids.forEach((id) => { const h = O[id]; if (h) h.lops.forEach((l) => l.querySelectorAll('[data-cho]:not([data-da])').forEach((x) => { x.dataset.da = '1'; hieu(x, (tre || 0) + (buoc || 0.12) * k++, x.dataset.fxCho || 'mat'); })); });
  }
  function veNet(m, tre) {
    if (m.daVe || !m.netO) return;
    m.daVe = true;
    const r = C.vietNet(m.netO, m.ch, { tocDo: kep(3.2 / Math.max(1, (window.SenseiStrokes && SenseiStrokes.get && (SenseiStrokes.get(m.ch) || []).length) || 6), 0.28, 0.6), tre: tre || 0 });
    if (r && m.netBong) G.to(m.netBong, { autoAlpha: 0, duration: D(0.2), delay: tre || 0 });
  }
  function cueChuHan(m, id, tt, api, nh) {
    const tre = api.tre(tt);
    const kana = nh.laKana;
    if (id === 'K0') tieuDiem('D', tre, 1.03);
    else if (id === 'K1' || id === 'K1b') { veNet(m, tre); vien('A', tre, 'var(--a-cam)', 1.2); }
    else if (id === 'K2') tieuDiem('D', tre, 1.035);
    else if (id === 'K3') { hienCho('D', 'K3', tre); nhip('D', tre, 1.03); }
    else if (id === 'K4') tieuDiem(kana ? 'B' : 'E', tre);
    else if (id === 'K5') tieuDiem(kana ? 'E' : 'B', tre);
    else if (id === 'K6') nhip('B', tre, 1.03);
    else if (/^K7\.\d+$/.test(id)) { nhip('C', tre, 1.025); nhanDong('C', +id.split('.')[1], tre); }
  }
  /** Dong thu k trong o (li / dong co data-cho): to nen nhe dung luc noi */
  function nhanDong(id, k, tre) {
    const h = O[id];
    const x = h && h.lops[0] && h.lops[0].querySelectorAll('[data-cho]')[k];
    if (!x || giam()) return;
    G.fromTo(x, { backgroundColor: 'rgba(201,100,66,0)' }, { backgroundColor: 'rgba(201,100,66,.14)', duration: 0.16, delay: tre, yoyo: true, repeat: 1, repeatDelay: 0.9 });
  }
  function hetChuHan(m) {
    // khung cuoi du: moi dong cho hien, net ve het
    ['B', 'C', 'D', 'E'].forEach((k) => { const h = O[k]; if (h) h.lops.forEach((l) => l.querySelectorAll('[data-cho]:not([data-da])').forEach((x) => { x.dataset.da = '1'; hieu(x, 0, x.dataset.fxCho || 'mat'); })); });
    veNet(m, 0);
  }

  // ---- khoi cong thuc tren ray (mau cau / vi du / hoi thoai)
  /**
   * Dat cac khoi (o K0..Kn) len ray. ds: [{ html, chu (de uoc be ngang), tone ('cam'|null), pill }]
   * ray: rect ban thiet ke cua ray. Tra ve mang id. giu: id khoi cu tai dung (morph).
   */
  function datKhoi(ds, ray, o) {
    o = o || {};
    const n = ds.length;
    const rr = px(ray);
    const pad = st.dt ? 10 : Math.max(10, rr.h * 0.07);
    const khe = st.dt ? 8 : 20 * st.W / 1920;
    const ems = ds.map((d) => Math.max(1, em(d.chu)));
    // mot hang neu vua; dien thoai / nhieu khoi: 2 hang
    const coRong = (hang) => {
      const hRow = (rr.h - pad * 2 - khe * (hang - 1)) / hang;
      const fs0 = hRow * (o.fs || 0.42);
      return { hRow, fs0 };
    };
    let hang = 1;
    let { hRow, fs0 } = coRong(1);
    const tong = (fs) => ems.reduce((a, e) => a + e * fs + fs * 0.9, 0) + khe * (n - 1);
    let fs = fs0;
    if (tong(fs) > rr.w - pad * 2) fs = fs0 * (rr.w - pad * 2) / tong(fs0);
    if ((st.dt && n > 2 && fs < hRow * 0.3) || fs < fs0 * (n >= 5 ? 0.62 : 0.45)) {
      hang = 2;
      ({ hRow, fs0 } = coRong(2));
      fs = fs0;
    }
    // chia hang (can bang be ngang)
    const hangDs = [[]];
    if (hang === 2) {
      const toan = ems.reduce((a, e) => a + e, 0);
      let acc = 0;
      ds.forEach((d, i) => { if (acc >= toan / 2 && hangDs.length < 2) hangDs.push([]); hangDs[hangDs.length - 1].push(i); acc += ems[i]; });
      hangDs.forEach((ids) => {
        const t = ids.reduce((a, i) => a + ems[i] * fs0 + fs0 * 0.9, 0) + khe * (ids.length - 1);
        if (t > rr.w - pad * 2) fs = Math.min(fs, fs0 * (rr.w - pad * 2) / t);
      });
    } else ds.forEach((d, i) => hangDs[0].push(i));
    const rects = [];
    hangDs.forEach((ids, hi) => {
      let ws = ids.map((i) => ems[i] * fs + fs * 0.9);
      // khoi gian ra phu kin ray (nhu video): toi da 1.9 lan be ngang tu nhien
      const du = (rr.w - pad * 2 - khe * (ids.length - 1)) / ws.reduce((a, x) => a + x, 0);
      if (du > 1) ws = ws.map((x) => x * Math.min(du, 1.9));
      const t = ws.reduce((a, x) => a + x, 0) + khe * (ids.length - 1);
      let x = rr.x + (rr.w - t) / 2;
      const y = rr.y + pad + hi * (hRow + khe) + (o.lechY || 0);
      ids.forEach((i, k) => { rects[i] = { x, y, w: ws[k], h: hRow }; x += ws[k] + khe; });
    });
    const ids = [];
    const giu = !!(o.giu && st.khoi);
    const cuIds = giu ? st.khoi.ids : [];
    const gen = giu ? st.khoi.gen : (st.genKhoi = (st.genKhoi || 0) + 1);
    ds.forEach((d, i) => {
      const id = cuIds[i] || ('K' + gen + '_' + i);
      ids.push(id);
      const r = rects[i];
      const h = o_(id);
      h.o.style.zIndex = 30;
      h.o.classList.add('a-o-k');
      h.o.style.setProperty('--a-fs', fs.toFixed(1) + 'px');
      const dich = { x: r.x, y: r.y, w: r.w, h: r.h };
      const tre = (o.tre || 0) + (o.stag || 0) * i;
      if (h.rect && cuIds.includes(id)) {
        if (!giam()) G.to(h.o, { left: dich.x, top: dich.y, width: dich.w, height: dich.h, autoAlpha: 1, scale: 1, duration: 0.9, ease: 'power4.inOut', delay: tre, overwrite: 'auto' });
        else G.set(h.o, { left: dich.x, top: dich.y, width: dich.w, height: dich.h, autoAlpha: 1 });
      } else if (!o.cho) {
        G.killTweensOf(h.o);
        G.set(h.o, { left: dich.x, top: dich.y, width: dich.w, height: dich.h });
        vaoO(h, Object.assign({ fx: 'slot' }, dich), tre);
      } else {
        G.killTweensOf(h.o);
        G.set(h.o, { left: dich.x, top: dich.y, width: dich.w, height: dich.h, autoAlpha: 0 });
        h.cho = true;
      }
      h.rect = dich;
      doiTone(h, d.tone || null, tre, h.lops.length ? 0.45 : 0.001);
      h.pill = d.pill || '';
      if (d.html != null && d.html !== h.htmlKhoi) {
        h.htmlKhoi = d.html;
        lop(id, `<div class="a-giua-k"><div class="a-noi">${d.html}</div></div>${d.pill ? `<div class="a-day-k"><span class="a-pill-k a-cho${d.tone ? ' is-trang' : ''}" data-cho="pill" data-fx-cho="no">${esc(d.pill)}</span></div>` : ''}`,
          { tre: h.lops.length ? tre + (o.treNoi || 0) : 0, raY: -30 });
      }
    });
    // khoi thua cua bo truoc: thu lai roi go
    Object.keys(O).forEach((id) => { if (/^K\d+_\d+$/.test(id) && !ids.includes(id)) raKhoi(id); });
    st.khoi = { ids, gen, cua: o.cua || '', sub: o.sub };
    return ids;
  }
  /** Khoi dang cho (o.cho) vao ray luc cue (bay slot) */
  function khoiVao(id, tre) {
    const h = O[id];
    if (!h || !h.cho) return false;
    h.cho = false;
    vaoO(h, Object.assign({ fx: 'slot' }, h.rect), tre);
    return true;
  }
  /** Khoi roi ray: thu nho mo di, xong thi go han (moi the he khoi mot bo id rieng) */
  function raKhoi(id) {
    const h = O[id];
    if (!h) return;
    delete O[id];
    G.killTweensOf(h.o);
    if (giam() || !h.rect) { h.o.remove(); return; }
    G.to(h.o, { autoAlpha: 0, scale: 0.9, duration: 0.28, ease: 'power2.in', onComplete: () => h.o.remove() });
  }
  function boKhoi() {
    Object.keys(O).forEach((id) => { if (/^K\d+_\d+$/.test(id)) raKhoi(id); });
    st.khoi = null;
  }
  function pillKhoi(id, tre) {
    const h = O[id];
    if (h) hienCho(id, 'pill', tre);
  }

  // ---- mau cau
  function phanCongThuc(nh) {
    const ch = nh.congThuc;
    const d = nh.data || {};
    if (ch && ch.phan && ch.phan.length) {
      let jc = 0, jo = 0;
      return ch.phan.map((e) => {
        if (e.loai === 'chu') {
          const j = jc++;
          const doc = DOC_TRO[e.chu];
          return { loai: 'chu', j, chu: e.chu, html: `<span class="a-k-jp" lang="ja">${esc(e.chu)}</span>`, tone: 'cam', pill: doc ? 'đọc: ' + doc : ngan(C.vaiTro(e.chu), 18) };
        }
        const j = jo++;
        let nhanO = String(e.nhan || '').replace(/[\-(（]+$/, '').trim();
        if (!/[A-Za-z0-9぀-ヿ一-鿿]/.test(nhanO)) nhanO = 'N';
        return { loai: 'o', j, chu: nhanO, html: `<span class="a-k-chu">${esc(nhanO)}</span>`, tone: null, pill: e.chu ? ngan(e.chu, 16) : '' };
      });
    }
    // Khong tach duoc: cac cum Nhat trong cong thuc / tieu de thanh khoi
    const cum = String(d.grammarFormula || d.title || '').match(/[぀-ヿ一-鿿々〜ー]+/g) || [];
    return cum.slice(0, 5).map((x, j) => ({ loai: 'chu', j, chu: x, html: `<span class="a-k-jp" lang="ja">${esc(x)}</span>`, tone: j % 2 ? null : 'cam', pill: '' }));
  }
  function dungMauCau(nh, api, m) {
    const d = nh.data || {};
    const c = nh.chuong || {};
    const phan = phanCongThuc(nh);
    const soMau = c.n ? (nh.ctx.cacNhip || []).filter((b) => b && b.kind === 'grammar-intro').length : 0;
    const iMau = (nh.ctx.cacNhip || []).filter((b) => b && b.kind === 'grammar-intro').indexOf(nh.beat) + 1;
    boCuc('nguPhap', BO.nguPhap(false));
    const tieu = String(d.title || '').replace(/^\d+\.\s*/, '');
    const [ten, cong] = tieu.split(/:\s*/).length > 1 ? [tieu.split(/:\s*/)[0], tieu.split(/:\s*/).slice(1).join(': ')] : [tieu, ''];
    lop('D', `<div class="a-pad a-hang"><div class="a-tieu-ngang">${nhan('Ngữ pháp · Mẫu câu ' + (iMau || ''), 0.15)}<div>${mk(jp(ngan(ten, st.dt ? 26 : 60)), 'a-ten', 0.2)}</div></div>
      ${soMau && !st.dt ? `<div class="a-tag" data-fx="no" data-tre="0.5">Mẫu ${iMau} / ${soMau}</div>` : ''}</div>`);
    if (O.A || !st.dt) datAnh('A', anhBai(nh), { tre: 0.25, kb: [1.05, 1.12], thay: (String(d.grammarFormula || d.title || '').match(/[぀-ヿ一-鿿々ー]+/) || [ngan(ten, 10)])[0] });
    const ray = BO.nguPhap(false).RAY;
    const khoi = Object.assign({}, ray);
    boKhoi();
    m.khoi = datKhoi(phan, khoi, { cho: true, cua: 'grammar', sub: nh.beat.subIndex, fs: st.dt ? 0.4 : 0.42 });
    m.phan = phan;
    m.cau = String(d.explanation || '').split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 3);
    m.daVao = 0;
    // S: cau cong thuc day du khi chua co o B (thay cho o trong)
    lop('RAY', '<div class="a-pad a-tren-ray"></div>');
    // du phong: cac khoi chua vao ray luc 1.4 s sau tieng dau (hoac 2.8 s sau khi vao nhip)
    m.duPhong = api.hen(() => khoiDuPhong(m, api), 2300);
    void cong;
  }
  function khoiDuPhong(m) {
    let k = 0;
    (m.khoi || []).forEach((id) => { if (khoiVao(id, k * 0.28)) k++; });
    xongKhoi(m, k * 0.28 + 0.5);
  }
  /** Du khoi: o S thu lai, o B (nghia / giai thich) truot vao */
  function xongKhoi(m, tre) {
    if (m.daB) return;
    if ((m.khoi || []).some((id) => O[id] && O[id].cho)) return;
    m.daB = true;
    const r = BO.nguPhap(true);
    canh({ S: r.S, B: r.B }, { tre: tre || 0 });
    choMeo();
    const cau0 = m.cau[0] || '';
    lop('B', `<div class="a-pad a-hang">${nhan(st.dt ? 'Giải thích' : 'Nghĩa', (tre || 0) + 0.1)}<div class="a-giai">${mk(jp(ngan(cau0, st.dt ? 110 : 120)), 'a-giai-chu', (tre || 0) + 0.15)}</div></div>`, { tre: tre || 0 });
  }
  function cueMauCau(m, id, tt, api) {
    const tre = api.tre(tt);
    const phan = m.phan || [];
    const tim = (loai, j) => phan.findIndex((p) => p.loai === loai && p.j === j);
    let i = -1;
    let x;
    if ((x = /^G2\.(\d+)$/.exec(id))) i = tim('chu', +x[1]);
    else if ((x = /^G3\.(\d+)$/.exec(id))) i = tim('o', +x[1]);
    else if ((x = /^G2p\.(\d+)$/.exec(id))) i = +x[1];
    if (id === 'G0') { tieuDiem('D', tre, 1.02); api.hen(() => khoiDuPhong(m, api), 1200); return; }
    if (i >= 0 && m.khoi && m.khoi[i]) {
      const kid = m.khoi[i];
      // vao ray dung luc noi toi; khoi dung truoc chua vao (Sensei noi nhay coc) -> vao theo thu tu
      m.khoi.slice(0, i).forEach((k2, z) => { if (khoiVao(k2, tre)) void z; });
      if (!khoiVao(kid, tre)) tieuDiem(kid, tre, 1.06);
      else vien(kid, tre + 0.05);
      api.hen(() => xongKhoi(m, 0.15), Math.round(tre * 1000) + 500);
      return;
    }
    if (/^G2c\.\d+$/.test(id)) { const j = +id.split('.')[1]; const k = tim('chu', j); if (k >= 0) { pillKhoi(m.khoi[k], tre); nhip(m.khoi[k], tre, 1.08); } return; }
    if (/^G4\.\d+$/.test(id)) {
      const s = +id.split('.')[1];
      xongKhoi(m, 0);
      (m.khoi || []).forEach((k2, z) => api.hen(() => pillKhoi(k2, 0), 120 * z));
      if (s > 0 && m.cau[s] && O.B) {
        lop('B', `<div class="a-pad a-hang">${nhan('Giải thích')}<div class="a-giai">${mk(jp(ngan(m.cau[s], 120)), 'a-giai-chu')}</div></div>`, { tre });
      }
      nhip('B', tre, 1.02);
      return;
    }
    if (id === 'G5' || id === 'G6') {
      xongKhoi(m, 0);
      const d = (st.nhip && st.nhip.data) || {};
      const text = id === 'G5' ? d.teacherTips : d.culturalNotes;
      if (text && O.B) {
        doiTone(O.B, 'cam', tre, 0.4);
        lop('B', `<div class="a-pad a-hang a-tren-cam">${nhan(id === 'G5' ? 'Lưu ý' : 'Văn hoá')}<div class="a-giai">${mk(jp(ngan(text, st.dt ? 100 : 130)), 'a-giai-chu is-trang')}</div></div>`, { tre });
        nhip('B', tre, 1.03);
      }
    }
  }

  // ---- vi du (ghep cau vao cong thuc)
  function khoiViDu(nh) {
    const d = nh.data || {};
    const toks = d.tokens || [];
    const g = nh.ghep;
    const ch = nh.congThuc;
    const tokHtml = (is) => is.map((i) => C.tok(toks[i], i, toks)).join('');
    const tokChu = (is) => is.map((i) => chuTok(toks[i])).join('');
    const out = [];   // { html, chu, tone, pill, toks: [i] }
    if (g && g.kieu === 'ASSEMBLE' && ch) {
      g.gan.forEach((x) => {
        const is = x.tok || [];
        if (!is.length) return;
        const laChu = x.loai === 'chu';
        const t0 = toks[is[0]];
        const doc = laChu ? DOC_TRO[chuTok(t0)] : '';
        const pill = doc ? 'đọc: ' + doc : laChu ? C.vaiTro(tokChu(is)) : (is.length === 1 ? C.nghiaTu(t0, nh.bai) : '');
        out.push({ html: `<span class="${laChu ? 'a-k-jp' : 'a-k-jp a-k-muc'}" lang="ja">${tokHtml(is)}</span>`, chu: tokChu(is), tone: laChu ? 'cam' : null, pill: ngan(pill, 16), toks: is });
      });
      (g.duoi || []).forEach((i) => { if (!laDau(toks[i])) out.push({ html: `<span class="a-k-jp a-k-muc" lang="ja">${C.tok(toks[i], i, toks)}</span>`, chu: chuTok(toks[i]), tone: null, pill: '', toks: [i] }); });
    } else {
      toks.forEach((t, i) => {
        if (laDau(t)) return;
        const key = !!t.isKeyGrammar;
        const cuoi = out[out.length - 1];
        // gop token thuong lien nhau (toi da 6 khoi) de khoi du lon
        if (cuoi && !key && !cuoi.key && (toks.filter((x) => !laDau(x)).length > 6)) { cuoi.html = cuoi.html.replace(/<\/span>$/, C.tok(t, i, toks) + '</span>'); cuoi.chu += chuTok(t); cuoi.toks.push(i); return; }
        const pill = key ? (DOC_TRO[chuTok(t)] ? 'đọc: ' + DOC_TRO[chuTok(t)] : C.vaiTro(String(t.text || '').trim())) : C.nghiaTu(t, nh.bai);
        out.push({ key, html: `<span class="a-k-jp${key ? '' : ' a-k-muc'}" lang="ja">${C.tok(t, i, toks)}</span>`, chu: chuTok(t), tone: key ? 'cam' : null, pill: ngan(pill, 16), toks: [i] });
      });
    }
    return out.slice(0, 8);
  }
  function dungViDu(nh, api, m) {
    const d = nh.data || {};
    const toks = d.tokens || [];
    boCuc('vidu', BO.viDu());
    const ds = khoiViDu(nh);
    m.ds = ds;
    const ray = BO.viDu().RAY;
    const khoi = st.dt ? Object.assign({}, ray, { y: ray.y + 22, h: ray.h - 22 }) : Object.assign({}, ray, { y: ray.y + 60, h: ray.h - 80 });
    const cung = st.khoi && st.khoi.cua && st.khoi.sub === nh.beat.subIndex;
    lop('RAY', `<div class="a-pad a-tren-ray">${nhan('Ví dụ' + (nh.ghep && nh.ghep.kieu === 'ASSEMBLE' ? ' · ghép vào mẫu' : ''), 0.3)}</div>`);
    if (!cung) boKhoi();
    m.khoi = datKhoi(ds.map((x) => Object.assign({}, x)), khoi, { giu: cung, cua: 'example', sub: nh.beat.subIndex, treNoi: cung ? 0.25 : 0, stag: cung ? 0.02 : 0.06, fs: st.dt ? 0.36 : 0.36 });
    // anh: tu vung trung token, khong co thi tranh canh bai
    const url = C.anhCau(toks, nh.bai) || anhBai(nh);
    const tokChinh = toks.find((t) => !t.isKeyGrammar && !laDau(t)) || toks[0] || {};
    datAnh('A', url, { tre: 0.2, pos: '50% 35%', thay: chuTok(tokChinh), thayPhu: C.nghiaTu(tokChinh, nh.bai) });
    // B: cach doc (kana) + nghia (hien luc E5)
    const docKana = toks.filter((t) => !laDau(t)).map((t) => `<span class="${t.isKeyGrammar ? 'k' : ''}">${esc(t.furigana || t.text || '')}</span>`).join('');
    lop('B', `<div class="a-pad">${nhan('Cách đọc · Nghĩa', 0.3)}<div class="a-giua a-cot a-trai-giua">
      <div class="a-rom" lang="ja" data-fx="len" data-tre="0.4">${docKana}</div>
      <div class="a-nghia-cau-o">${mkCho(jp(ngan(d.meaningVi || '', st.dt ? 70 : 90)), 'a-nghia-cau', 'E5')}</div></div></div>`);
    datChip('Ví dụ · ' + ((nh.chuong && nh.chuong.ten) || 'Ngữ pháp'));
    // token -> khoi
    m.tokKhoi = {};
    ds.forEach((x, k) => (x.toks || []).forEach((i) => { m.tokKhoi[i] = k; }));
  }
  function karaokeKhoi(m, dsTok, api) {
    const now = api.bayGio();
    const daLam = new Set();
    dsTok.forEach((x) => {
      const k = m.tokKhoi ? m.tokKhoi[x.i] : null;
      if (k == null || daLam.has(k)) return;
      daLam.add(k);
      const id = m.khoi && m.khoi[k];
      if (!id) return;
      const tre = Math.max(0, x.T - api.LEAD - now);
      nhip(id, tre, 1.06);
      vien(id, tre, 'var(--a-cam)', 0.45);
    });
  }
  function cueViDu(m, id, tt, api) {
    const tre = api.tre(tt);
    if (id === 'E0') { vien('RAY', tre, 'rgba(201,100,66,.45)', 0.6); return; }
    if (id === 'E5') { hienCho('B', 'E5', tre); tieuDiem('B', tre, 1.02); (m.khoi || []).forEach((k, z) => pillKhoi(k, tre + 0.08 * z)); return; }
    if (/^E3/.test(id) || /^E4/.test(id)) { (m.khoi || []).forEach((k, z) => pillKhoi(k, tre + 0.06 * z)); }
  }

  // ---- hoi thoai
  function tachTen(sp) {
    const s = String(sp || '').trim();
    const m = /^(.*?)\s*[(（]([^)）]+)[)）]\s*$/.exec(s);
    return m ? { jp: m[1].trim(), la: m[2].trim() } : { jp: s, la: '' };
  }
  function vaiCua(ds) {
    const out = [];
    (ds || []).forEach((l) => { if (!l) return; const t = tachTen(l.speaker); if (!out.find((x) => x.jp === t.jp)) out.push(Object.assign({ anh: l.avatarUrl || '' }, t)); });
    return out;
  }
  function dungKaiwaIntro(nh, api, m) {
    const ds = Array.isArray(nh.data) ? nh.data : [];
    const vai = vaiCua(ds).slice(0, 4);
    boCuc('kaiwaIntro', BO.kaiwaIntro(vai.length));
    datAnh('A', anhBai(nh), { tre: 0.05, kb: [1.08, 1.0], thay: vai.map((v) => v.jp).join('・'), thayPhu: 'Hội thoại' });
    lop('D', `<div class="a-pad a-tren-cam">${nhan('Hội thoại', 0.2)}<div class="a-giua a-trai a-cot-cuoi"><div>${mk(nh.kind === 'kaiwa-run' ? 'Nghe trọn đoạn' : 'Bối cảnh', 'a-bai-ten', 0.25)}</div>
      <div class="a-phu-cam" data-fx="len" data-tre="0.45">${vai.length} nhân vật · ${ds.length} lượt thoại</div></div></div>`);
    vai.forEach((v, p) => {
      lop('P' + p, `<div class="a-pad a-hang a-vai">${v.anh ? `<img class="a-vai-anh" src="${esc(v.anh)}" alt="">` : `<span class="a-vai-chu" lang="ja">${esc(kyTu(v.jp)[0] || '?')}</span>`}
        <div class="a-vai-ten"><span lang="ja">${esc(v.jp)}</span>${v.la ? `<em>${esc(v.la)}</em>` : ''}</div></div>`, { tre: 0.2 + p * 0.08 });
    });
    m.vai = vai;
    m.ds = ds;
    datChip(nh.kind === 'kaiwa-run' ? 'Hội thoại · nghe' : 'Hội thoại');
  }
  function cueKaiwaIntro(m, id, tt, api) {
    const tre = api.tre(tt);
    let x;
    if ((x = /^C1\.(\d+)$/.exec(id))) tieuDiem('P' + x[1], tre, 1.05);
    else if ((x = /^C2\.(\d+)$/.exec(id))) {
      const l = m.ds[+x[1]];
      if (l) {
        const t = tachTen(l.speaker);
        const p = (m.vai || []).findIndex((v) => v.jp === t.jp);
        if (p >= 0) nhip('P' + p, tre, 1.03);
        if (O.D) lop('D', `<div class="a-pad a-tren-cam">${nhan('Lượt ' + (+x[1] + 1) + ' / ' + m.ds.length)}<div class="a-giua a-trai a-cot-cuoi"><div class="a-dong-thoai" lang="ja">${(l.tokens || []).map((tk, i, a) => C.tok(tk, i, a)).join('')}</div>
          <div class="a-phu-cam">${esc(ngan(l.meaningVi || '', 60))}</div></div></div>`, { tre });
      }
    }
  }
  function dongThoaiRun(m, line, i, api) {
    if (!line) return;
    const t = tachTen(line.speaker);
    const p = (m.vai || []).findIndex((v) => v.jp === t.jp);
    (m.vai || []).forEach((v, q) => { if (q === p) { vien('P' + q, 0, 'var(--a-cam)', true); nhip('P' + q, 0, 1.04); } else boVien('P' + q); });
    if (O.D) lop('D', `<div class="a-pad a-tren-cam">${nhan('Lượt ' + (i + 1) + ' / ' + (m.ds || []).length)}<div class="a-giua a-trai a-cot-cuoi"><div class="a-dong-thoai" lang="ja">${(line.tokens || []).map((tk, k, a) => `<span class="a-tok" data-i="${k}">${C.tok(tk, k, a)}</span>`).join('')}</div>
      <div class="a-phu-cam">${esc(ngan(line.meaningVi || '', 70))}</div></div></div>`);
    void api;
  }
  function dungKaiwa(nh, api, m) {
    const l = nh.data || {};
    const toks = l.tokens || [];
    const t = tachTen(l.speaker);
    boCuc('kaiwa', BO.kaiwa());
    datAnh('A', l.avatarUrl || anhBai(nh), { tre: 0.05, pos: '50% 30%', them: `<div class="a-chip-anh" data-fx="len" data-tre="0.5"><span lang="ja">${esc(t.jp)}</span>${t.la ? ' · ' + esc(t.la) : ''}</div>` });
    const nhipGiong = { ghep: null, kieu: 'DIAGRAM' };
    const ds = khoiViDu({ data: { tokens: toks }, ghep: nhipGiong, congThuc: null, bai: nh.bai });
    m.ds = ds;
    m.tokKhoi = {};
    ds.forEach((x, k) => (x.toks || []).forEach((i) => { m.tokKhoi[i] = k; }));
    lop('RAY', `<div class="a-pad a-tren-ray">${nhan('Câu ' + ((nh.chuong && nh.chuong.i) || '') + ' · ' + t.jp, 0.2)}</div>`);
    const ray = BO.kaiwa().RAY;
    const khoi = st.dt ? ray : Object.assign({}, ray, { y: ray.y + 60, h: ray.h - 80 });
    boKhoi();
    m.khoi = datKhoi(ds, khoi, { cua: 'kaiwa', stag: 0.05, fs: 0.34 });
    const docKana = toks.filter((x) => !laDau(x)).map((x) => `<span class="${x.isKeyGrammar ? 'k' : ''}">${esc(x.furigana || x.text || '')}</span>`).join('');
    lop('B', `<div class="a-pad">${nhan('Cách đọc · Nghĩa', 0.3)}<div class="a-giua a-cot a-trai-giua">
      <div class="a-rom" lang="ja" data-fx="len" data-tre="0.4">${docKana}</div>
      <div class="a-nghia-cau-o">${mkCho(jp(ngan(l.meaningVi || '', st.dt ? 70 : 90)), 'a-nghia-cau', 'F4')}</div></div></div>`);
    if (O.E || st.dt) lop('E', `<div class="a-pad a-hang">${nhan('Nhân vật')}<div class="a-meo-chu"><span class="a-meo-trong" lang="ja">${esc(t.jp)}${t.la ? ' — ' + esc(t.la) : ''}</span></div></div>`);
    datChip('Hội thoại · ' + ((nh.chuong && nh.chuong.i) || '') + '/' + ((nh.chuong && nh.chuong.n) || ''));
  }
  function cueKaiwa(m, id, tt, api) {
    const tre = api.tre(tt);
    let x;
    if (id === 'F4') { hienCho('B', 'F4', tre); tieuDiem('B', tre, 1.02); return; }
    if ((x = /^F3\.(\d+)$/.exec(id))) {
      const key = (m.ds || []).map((d, k) => (d.tone === 'cam' ? k : -1)).filter((k) => k >= 0)[+x[1]];
      if (key != null && m.khoi[key]) { tieuDiem(m.khoi[key], tre, 1.07); pillKhoi(m.khoi[key], tre); }
    }
  }

  // ---- bai tap
  function dungQuiz(nh, api, m) {
    const q = nh.data || {};
    const opts = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
    const cauHoi = String(q.question || '').replace(/^\[(Dễ|Vừa|Khó)\]\s*/, '');
    const [goc, yc] = tachNgoac(cauHoi);
    boCuc('quiz', BO.quiz(false));
    const c = nh.chuong || {};
    const url = C.anhCau(String(goc).match(/[぀-ヿ一-鿿々ー]+/g) ? (String(goc).match(/[぀-ヿ一-鿿々ー]+/g) || []).map((x) => ({ text: x, kanji: x })) : [], nh.bai) || anhBai(nh);
    datAnh('A', url, { tre: 0.2, kb: [1.0, 1.05], thay: '?', thayPhu: 'Luyện tập' });
    const coJp = RE_JP.test(goc);
    const cauHtml = esc(goc).replace(/_{2,}|＿{2,}/, '<span class="a-o-trong"><span class="a-o-dap"></span></span>');
    lop('F', `<div class="a-pad">${nhan('Luyện tập · Câu ' + (c.i || ''), 0.3)}<div class="a-giua a-cot">
      <div class="a-cau${coJp ? '' : ' is-vn'}"${coJp ? ' lang="ja"' : ''} data-fx="len" data-tre="0.35" style="${coDong(goc, st.dt ? 16 : 22, 90)}">${cauHtml}</div>
      ${yc ? `<div class="a-yc" data-fx="len" data-tre="0.6">${esc(yc)}</div>` : ''}</div></div>`);
    m.opts = opts;
    m.oIds = [];
    opts.forEach((o, i) => {
      const id = 'O' + (i + 1);
      m.oIds.push(id);
      const [p, r] = tachNgoac(o);
      const r0 = BO.oQuiz(i);
      canh({ [id]: Object.assign({}, r0, { tre: 0.5 + i * 0.08 }) }, { tone: null });
      lop(id, `<div class="a-pad a-hang-o"><span class="a-o-chu">${'ABCD'[i]}</span><span class="a-o-p"${RE_JP.test(p) ? ' lang="ja"' : ''} style="${coDong(p, st.dt ? 30 : 42, 62)}">${esc(p)}</span>${r ? `<span class="a-o-r">${esc(r)}</span>` : ''}</div>`, { tre: 0.5 + i * 0.08 });
    });
    datChip('Bài tập · ' + (c.i || '') + '/' + (c.n || ''));
  }
  function cueQuiz(m, id, tt, api) {
    const tre = api.tre(tt);
    let x;
    if (id === 'Q1') tieuDiem('F', tre, 1.02);
    else if ((x = /^Q2\.(\d+)$/.exec(id))) tieuDiem('O' + (+x[1] + 1), tre, 1.05);
  }
  /** Den luot hoc vien: o F lon ra lam O BAI TAP (the that vao day), cac o dap an mau thu lai */
  function oBaiTapQuiz(m) {
    if (m.slot && m.slot.isConnected) return m.slot;
    canh(BO.quiz(true), { stag: 0.02 });
    choMeo();
    const el = lop('F', `<div class="a-pad a-bt">${nhan('Đến lượt bạn')}<div class="a-bt-o"></div></div>`, { cls: 'a-lop-bt' });
    m.slot = el.querySelector('.a-bt-o');
    return m.slot;
  }
  function traLoiQuiz(m, exId, dung) {
    doiTone(O.F, dung ? 'la' : 'do', 0, 0.3);
    vien('F', 0, dung ? 'var(--a-la)' : 'var(--a-do)', dung ? true : 1.2);
    nhip('F', 0.05, 1.02);
    if (O.A && O.A.rect) {
      const h = O.A;
      const l = h.lops[h.lops.length - 1];
      if (l) {
        l.querySelectorAll('.a-dau-kq').forEach((z) => z.remove());
        l.insertAdjacentHTML('beforeend', `<div class="a-dau-kq ${dung ? 'is-dung' : 'is-sai'}"><b>${dung ? '✓' : '✕'}</b><span>${dung ? 'Chính xác!' : 'Chưa đúng'}</span></div>`);
        hieu(l.querySelector('.a-dau-kq'), 0.05, 'no');
      }
    }
    if (dung) song();
    else lac(O.F && O.F.o, 0.05, 10);
  }
  /** Song tron lan ra (dung) */
  function song() {
    if (giam() || !O.F || !O.F.rect) return;
    const r = O.F.rect;
    for (let i = 0; i < 3; i++) {
      const e = document.createElement('div');
      e.className = 'a-song';
      e.style.left = (r.x + r.w / 2 - 60) + 'px';
      e.style.top = (r.y + r.h / 2 - 60) + 'px';
      L.appendChild(e);
      G.fromTo(e, { opacity: 0.9, scale: 0.3 }, { opacity: 0, scale: 2.6 + i * 0.5, duration: 1.0, ease: 'expo.out', delay: i * 0.14, onComplete: () => e.remove() });
    }
  }

  // ---- the chuong
  function veTheChuong(info, api) {
    boKhoi();
    boCuc('chuong', BO.chuong(), { stag: 0.03 });
    const ds = info.ds || [];
    const ch = info.chuong;
    let muc = [];
    let anh = null;
    if (ch === 'vocab') { muc = ds.filter((b) => b.kind === 'vocab').map((b) => b.data && (b.data.kanji || b.data.word)); anh = (ds.find((b) => b.data && b.data.imageUrl) || {}).data; anh = anh && anh.imageUrl; }
    else if (ch === 'kanji') muc = ds.filter((b) => b.kind === 'kanji').map((b) => b.data && b.data.character);
    else if (ch === 'grammar') muc = ds.filter((b) => b.kind === 'grammar-intro').map((b) => { const t = String((b.data && b.data.title) || ''); return t.split(/:\s*/).slice(1).join(': ') || t; });
    else if (ch === 'kaiwa') { const l = ds.find((b) => b.kind === 'kaiwa'); muc = vaiCua(ds.filter((b) => b.kind === 'kaiwa').map((b) => b.data)).map((v) => v.jp); anh = null; void l; }
    else if (ch === 'quiz') muc = ds.filter((b) => b.kind === 'quiz').map((b, i) => 'Câu ' + (i + 1));
    const bai = (st.nhip && st.nhip.bai) || null;
    datAnh('A', anh || (bai && bai.sceneImageUrl) || null, { tre: 0.1, kb: [1.08, 1.0], thay: info.tenMoi });
    lop('D', `<div class="a-vong v1"></div><div class="a-vong v2"></div><div class="a-pad a-tren-cam">${info.tenCu ? nhan('Xong ' + info.tenCu + ' ✓', 0.1) : nhan('Phần tiếp theo', 0.1)}
      <div class="a-giua a-trai"><div><div>${mk(esc(info.tenMoi || ''), 'a-bai-so a-chuong-ten', 0.15)}</div>${info.meta ? `<div class="a-phu-cam" data-fx="len" data-tre="0.45">${esc(info.meta)}</div>` : ''}</div></div></div>`);
    const toi = st.dt ? 8 : 14;
    lop('B', `<div class="a-pad">${nhan('Trong phần này', 0.3)}<div class="a-chips a-chips-to">${muc.filter(Boolean).slice(0, toi).map((x, i) => `<span class="a-chip"${RE_JP.test(x) ? ' lang="ja"' : ''} data-fx="no" data-tre="${(0.45 + i * 0.05).toFixed(2)}">${esc(ngan(x, 18))}</span>`).join('')}${muc.length > toi ? `<span class="a-chip is-them">+${muc.length - toi}</span>` : ''}</div></div>`);
    datChip(info.tenMoi || '');
    st.tuChuong = [];
    datS(false);
    datLoi('Tiếp theo: ' + (info.tenMoi || '') + (info.meta ? ' · ' + info.meta : ''));
    void api;
    return true;
  }
  // ---- the ket bai
  function veTheXong(info, api) {
    boKhoi();
    const bai = (st.nhip && st.nhip.bai) || {};
    const tu = (bai.vocabList || []).filter((v) => v && v.imageUrl).slice(0, 3);
    boCuc('xong', BO.xong(), { stag: 0.02 });
    ['R1', 'R2', 'R3'].forEach((id, i) => {
      const v = tu[i];
      if (!v) { lop(id, `<div class="a-pad">${nhan('Tổng kết')}</div>`); return; }
      lop(id, `<div class="a-the"><div class="a-the-anh"><img src="${esc(v.imageUrl)}" alt=""></div><div class="a-the-chu"><span class="a-the-so">0${i + 1}</span><span class="a-the-kj" lang="ja" data-fx="len" data-tre="${(0.4 + i * 0.12).toFixed(2)}">${esc(v.kanji || v.word)}</span><span class="a-the-ng" data-fx="len" data-tre="${(0.5 + i * 0.12).toFixed(2)}">${esc(ngan(boNgoacCuoi(v.meaningVi), 16))}</span></div></div>`, { tre: 0.05 * i });
    });
    const hang = (info.hang || []).slice(0, st.dt ? 5 : 5);
    lop('R4', `<div class="a-pad">${nhan('Hôm nay mình đã học', 0.2)}<ul class="a-tk">${hang.map((h, i) => `<li data-fx="len" data-tre="${(0.35 + i * 0.1).toFixed(2)}"><span class="a-tk-nhan">${esc(h.nhan)}</span><b>${esc(h.so)}</b>${h.cham ? `<span class="a-tk-cham">${h.cham.map((k) => `<i class="${k || ''}"></i>`).join('')}</span>` : `<span class="a-tk-mau"${h.jp ? ' lang="ja"' : ''}>${esc(ngan(h.mau, st.dt ? 22 : 40))}</span>`}</li>`).join('')}</ul></div>`);
    datChip('Tổng kết · Bài ' + (info.bai || ''));
    datS(true);
    datLoi('Hẹn gặp lại ở bài sau nhé!');
    if (st.sMatane) G.fromTo(st.sMatane, { autoAlpha: 0, scale: 0.55 }, { autoAlpha: 1, scale: 1, duration: D(0.7), ease: 'back.out(1.9)', delay: 1.1 });
    void api;
    return true;
  }

  // ================================================================== HOP DONG CHE DO
  const DUNG = { vocab: dungTuVung, kanji: dungChuHan, 'grammar-intro': dungMauCau, example: dungViDu, 'kaiwa-intro': dungKaiwaIntro, 'kaiwa-run': dungKaiwaIntro, kaiwa: dungKaiwa, quiz: dungQuiz };
  const CUE = { vocab: cueTuVung, kanji: cueChuHan, 'grammar-intro': cueMauCau, example: cueViDu, 'kaiwa-intro': cueKaiwaIntro, kaiwa: cueKaiwa, quiz: cueQuiz };

  SC.dangKy({
    id: ID,
    ten: 'Bento động',
    can: ['gsap'],
    batDau(lop0, ctx) {
      L = lop0; C = ctx; G = ctx.gsap;
      O = {};
      st.bo = ''; st.dem = 0; st.khoi = null; st.tuChuong = []; st.loiCau = '';
      L.classList.add('a-nen');
      L.insertAdjacentHTML('afterbegin', '<div class="a-cham" aria-hidden="true"></div>');
      doKhung();
      taoS();
    },
    ketThuc() {
      if (G) { try { G.killTweensOf(L ? L.querySelectorAll('*') : []); } catch (e) {} }
      goHetO();
      L = null; C = null; st.m = null; st.nhip = null; st.khoi = null;
    },
    doiCo() {
      if (!L || !st.nhip) return;
      const cuDt = st.dt;
      doKhung();
      // doi co man hinh: dat lai bo cuc hien tai ngay (khong hieu ung); doi dang (may tinh <-> dien thoai): nhip sau ve lai
      if (cuDt !== st.dt || !st.boCuoi) return;
      Object.keys(st.boCuoi).forEach((id) => {
        const r0 = st.boCuoi[id], h = O[id];
        if (!h || !r0 || !h.rect) return;
        const r = px(r0);
        G.set(h.o, { left: r.x, top: r.y, width: r.w, height: r.h });
        h.rect = r;
      });
      choMeo();
    },
    trangThai(text, kieu) {
      if (!st.sDong) return;
      if (kieu === 'chuan-bi' && !st.loiCau) { st.sDong.innerHTML = `<span class="a-ba-cham"><i></i><i></i><i></i></span>`; G.set(st.sDong, { autoAlpha: 1 }); }
    },
    dungNhip(nh, api) {
      const f = DUNG[nh.kind];
      if (!f || !L) return null;
      doKhung();
      if (st.m && st.m.slot) st.m.slot = null;
      st.nhip = nh;
      const m = {
        nh,
        cue(id, tt) { const g = CUE[nh.kind]; if (g) g(m, id, tt, api, nh); },
        karaoke(ds, o) {
          if (nh.kind === 'example' || nh.kind === 'kaiwa') karaokeKhoi(m, ds, api);
          else if (nh.kind === 'kaiwa-run' && O.D) {
            const l = O.D.lops[0];
            const now = api.bayGio();
            ds.forEach((x) => { const e = l && l.querySelector(`.a-tok[data-i="${x.i}"]`); if (e) G.fromTo(e, { color: 'rgba(255,255,255,.55)' }, { color: '#fff', duration: 0.12, delay: Math.max(0, x.T - api.LEAD - now) }); });
          }
          void o;
        },
        loi(doan, raw) { datLoi(raw); },
        // ghi(text): Sensei ghi bang — mode A khong ve them (noi dung da co tren cac o, tranh lap chu)
        dongThoai(line, i) { if (nh.kind === 'kaiwa-run') dongThoaiRun(m, line, i, api); },
        het() {
          if (nh.kind === 'kanji') hetChuHan(m);
          if (nh.kind === 'grammar-intro') { khoiDuPhong(m); (m.khoi || []).forEach((k) => pillKhoi(k, 0)); }
          ['B', 'C', 'E', 'F'].forEach((k) => { const h = O[k]; if (h) h.lops.forEach((l) => l.querySelectorAll('[data-cho]:not([data-da])').forEach((x) => { x.dataset.da = '1'; hieu(x, 0, x.dataset.fxCho || 'mat'); })); });
          if (m.chuyen && !m.daVao) m.chuyen();
        },
        oBaiTap() { return nh.kind === 'quiz' ? oBaiTapQuiz(m) : null; },
        traLoi(exId, dung) { if (nh.kind === 'quiz') traLoiQuiz(m, exId, dung); },
        raCho() {},
        roi() { if (st.m === m) st.m = null; },
      };
      st.m = m;
      datS(false);
      // Nhip dau buoi giang (bai moi): bo cuc tieu de truoc (Sensei chao, gioi thieu bai)
      if (nh.laBatDau && !nh.isResume && nh.i === 0 && nh.kind === 'vocab' && nh.bai) dungTieuDe(nh, api, m);
      if (nh.kind !== 'example' && nh.kind !== 'grammar-intro' && nh.kind !== 'kaiwa') boKhoi();
      f(nh, api, m);
      st.dem++;
      datTien(nh);
      return m;
    },
    theChuong(info, api) { return L ? veTheChuong(info, api) : false; },
    theXong(info, api) { return L ? veTheXong(info, api) : false; },
  });
})();
