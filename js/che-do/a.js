/* ==========================================================================
   Che do san khau A — "Bento động" (chuyen tu ban mau scratchpad demo-bai1/a sang san khau SONG).
   Ca vung san khau la MOT luoi o bo tron; moi nhip khai bao vi tri dich cua tung o, GSAP truot (FLIP
   left/top/width/height, power4.inOut .95 s) giua hai bo cuc: o moi bay vao, o bo di thu nho bien mat.
   Noi dung trong o la cac LOP (mat na chu troi len, bat no, ve vach) doi theo cue cua dao dien — moc lay
   tu tieng Sensei (tt.T), tieu diem toi truoc tieng 80 ms.
   Bo cuc chuyen canh GIONG video mau: noi dung cu thoat (.26 s) -> cac o doi cho dong bo (.95 s) -> noi dung
   moi vao lan luot (mat na .8 s expo.out, bat no .7 s back.out, nhan .4 s), moi o mot nhom.
   Co chu: 6 vai (head / form / sent / mean / body / label) — xem css/che-do/a.css; JS `T(vai)` cho khoang co.
   O "S" (Sensei) o goc phai duoi: phu de song (2 dong co dinh, doi theo cau), tien do chuong; meo THAT dung
   trong goc do (api.meo()) — chu trong o S chua cho meo.
   Du lieu that cua MOI bai (vocab / kanji / kana / mau cau / vi du / hoi thoai / bai tap / the chuong /
   the ket bai); bai tap: the that #card-<id> vao o F (oBaiTap), cham bai y nguyen.
   Hoi thoai: chan dung nhan vat qua SenseiAvatarNoi.gan (nhep mieng, bieu cam) — chi nguoi dang noi dong.
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

  // ------------------------------------------------------------------ bang co chu (px thiet ke 1920 [lon nhat, nho nhat])
  // Khoang nho nhat chi dung khi noi dung rat dai; noi dung thuong nam o dau tren. may tinh: nhan voi u = min(W/1920, H/1080).
  const TOK = { head: [350, 140], form: [160, 80], sent: [124, 40], mean: [88, 28], body: [40, 28], label: [28, 28] };
  const TOK_DT = { head: [150, 40], form: [72, 40], sent: [44, 22], mean: [34, 22], body: [17, 15], label: [15, 15] };   // dien thoai: px that

  // ------------------------------------------------------------------ trang thai che do
  let L = null;          // lop .cd-lop
  let C = null;          // ctx / tien ich dao dien (CDH)
  let G = null;          // gsap
  let O = {};            // id o -> { id, o, than, tones, tone, rect, lops }
  const st = {
    W: 0, H: 0, dt: false, meo: null, u: 0.75, fl: 20, px: 24, py: 20,
    bo: '',              // ten bo cuc dang dung
    nhip: null,          // nhip dang giang
    m: null,             // doi tuong nhip dang song
    loiCau: '',          // trang phu de dang hien
    cap: null,
    sDong: null, sCau: null, sTen: null, sTien: null, sMatane: null, mesur: null,
    khoi: null,          // khoi cong thuc dang tren ray: { ids, gen, cua, sub }
    ent: 0,              // bo dem thu tu noi dung vao o trong mot nhip (so le)
    avt: [],             // chan dung da gan SenseiAvatarNoi
  };
  const capMoi = () => ({ sIdx: -1, from: 0, shown: '', full: '', tHien: 0, hen: null, tai: false, rawLen: 0, doi: false, fs: 0 });

  // ------------------------------------------------------------------ tien ich
  const esc = (s) => (C ? C.esc(s) : String(s == null ? '' : s));
  const jp = (s) => (C ? C.jp(s) : esc(s));
  const kep = (x, a, b) => Math.max(a, Math.min(b, x));
  const giam = () => !!(C && C.giam);
  const D = (s) => (giam() ? 0 : s);
  const kyTu = (s) => Array.from(String(s == null ? '' : s));
  const chuTok = (t) => String((t && (t.kanji || t.text)) || '').trim();
  const laDau = (t) => RE_DAU.test(chuTok(t) || ' ');
  function tachNgoac(s) {
    const m = /^(.*?)\s*[(（]([^)）]*)[)）]\s*$/.exec(String(s || ''));
    return m ? [m[1].trim(), m[2].trim()] : [String(s || '').trim(), ''];
  }
  const ngan = (s, n) => { const a = kyTu(String(s || '').trim()); return a.length <= n ? a.join('') : a.slice(0, n - 1).join('') + '…'; };
  /** Cat theo TU (khong cat giua tu): toi da n ky tu, them … */
  const nganTu = (s, n) => {
    s = String(s || '').trim();
    if (kyTu(s).length <= n) return s;
    const cut = kyTu(s).slice(0, n).join('');
    const k = cut.lastIndexOf(' ');
    return (k > n * 0.5 ? cut.slice(0, k) : cut).replace(/[\s,;:、]+$/, '') + '…';
  };
  const boNgoacCuoi = (s) => String(s || '').replace(/\s*[(（][^)）]*[)）]\s*$/, '').trim();
  const tuNhanVat = (url) => { const m = /nv\/([^/]+)\//.exec(url || '') || /nv-([^./]+)\.\w+$/.exec(url || ''); return m ? m[1] : ''; };

  // ------------------------------------------------------------------ khung, co chu, toa do
  /** Khoang co (px that) cua mot vai: { max, min } */
  function T(vai) {
    const t = st.dt ? TOK_DT[vai] : TOK[vai];
    const u = st.dt ? 1 : st.u;
    return { max: t[0] * u, min: t[1] * u };
  }
  function doKhung() {
    const k = C.khung();
    st.W = k.w || L.clientWidth || 1;
    st.H = k.h || L.clientHeight || 1;
    st.dt = st.W < 640 || (st.W < 820 && st.H > st.W * 1.2);
    st.meo = C.meo();
    st.u = st.dt ? 1 : Math.min(st.W / 1920, st.H / 1080);
    st.fl = T('label').max;
    st.px = st.dt ? 12 : Math.round(34 * st.u);
    st.py = st.dt ? 10 : Math.round(28 * st.u);
    L.style.setProperty('--a-u', (st.dt ? 0.6 : st.u).toFixed(4) + 'px');
    L.style.setProperty('--a-fl', st.fl.toFixed(2) + 'px');
    L.style.setProperty('--a-fb', T('body').max.toFixed(2) + 'px');
    L.style.setProperty('--a-px', st.px + 'px');
    L.style.setProperty('--a-py', st.py + 'px');
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
  const khe = () => (st.dt ? 8 : Math.round(20 * st.u));

  // ------------------------------------------------------------------ o (tile)
  function taoO(id, z) {
    const o = document.createElement('div');
    o.className = 'a-o';
    o.dataset.o = id;
    o.style.zIndex = z || 10;
    o.innerHTML = '<div class="a-bong"></div><div class="a-than"></div>';
    L.appendChild(o);
    const h = { id, o, than: o.lastChild, tones: {}, tone: null, rect: null, lops: [], san: 0 };
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
    dur = dur == null ? 0.55 : dur;
    if (cu && h.tones[cu]) G.to(h.tones[cu], { opacity: 0, duration: D(dur), ease: 'power1.inOut', delay: tre || 0, overwrite: 'auto' });
    const t = toneEl(h, moi);
    if (t) G.to(t, { opacity: 1, duration: D(dur), ease: 'power1.inOut', delay: tre || 0, overwrite: 'auto' });
    h.tone = moi;
    // chu doi mau theo tone SAU khi noi dung cu da thoat (khong chop trang/den tren nen dang doi)
    const dat = () => { if (h.o.isConnected) h.o.dataset.tone = moi || ''; };
    if (giam() || !h.lops.length) dat(); else G.delayedCall((tre || 0) + 0.2, dat);
  }
  // ---- nhip chuyen canh (giay) — theo video mau
  const T_RA = 0.26;     // noi dung cu thoat (power2.in, -16 px)
  const T_DOI = 0.95;    // o doi cho (power4.inOut), dong bo
  const T_TRE = 0.12;     // o bat dau doi cho sau khi noi dung cu da mo gan het
  const nowG = () => (G && G.ticker ? G.ticker.time : 0);
  /**
   * Bo cuc: dat { id: rect | null } (rect ban thiet ke). O moi vao (fx: 'len' | 'phu' | 'slot' | 'bay'),
   * o cu doi cho (FLIP), null = thu nho bien mat. opt.tre (giay), opt.stag (giay / o).
   */
  function canh(dat, opt) {
    opt = opt || {};
    let i = 0;
    // co o thu lai (thoat .3 s) -> o MOI vao cham 0.3 s de hai noi dung khong chong len nhau (chu moi doi cho chu cu dang mo)
    const coRa = Object.keys(dat).some((id) => !dat[id] && O[id] && O[id].rect);
    const treVao = coRa && !giam() && !opt.nhanh ? 0.3 : 0;
    Object.keys(dat).forEach((id) => {
      const r0 = dat[id];
      const r = r0 ? px(r0) : null;
      const h = r ? o_(id) : O[id];
      if (!h) return;
      const tre = (opt.tre || 0) + (opt.stag || 0) * (i++) + ((r0 && r0.tre) || 0);
      if (r && r.z != null) h.o.style.zIndex = r.z;
      if (r && !h.rect) vaoO(h, r, tre + treVao);
      else if (r && h.rect) doiO(h, h.rect, r, tre);
      else if (!r && h.rect) raO(h, tre);
      const tone = r0 && r0.tone !== undefined ? r0.tone : opt.tone;
      if (r && tone !== undefined) { if (h.rect && (h.tone || null) !== (tone || null)) thoatNoiDung(h, tre); doiTone(h, tone, tre + (h.rect ? T_TRE : 0), h.rect ? 0.55 : 0.001); }
      h.rect = r || null;
    });
  }
  function vaoO(h, r, tre) {
    const o = h.o;
    const dich = { left: r.x, top: r.y, width: r.w, height: r.h };
    G.killTweensOf(o);
    if (giam()) { h.san = 0; G.set(o, Object.assign({ autoAlpha: 1, x: 0, y: 0, scale: 1, rotation: 0 }, dich)); return; }
    if (r.fx === 'bay' && r.tu) {
      const f = px(r.tu);
      h.san = nowG() + tre + 0.78 * 0.85;
      G.fromTo(o, { left: f.x, top: f.y, width: f.w, height: f.h, autoAlpha: 1, scale: 1, y: 0 },
        Object.assign({ duration: 0.78, ease: 'expo.inOut', delay: tre }, dich));
      return;
    }
    G.set(o, Object.assign({}, dich));
    const slot = r.fx === 'slot', phu = r.fx === 'phu';
    // vao: hien day du do dam ngay luc bat dau (khong mo nua chung) + truot / phong nhe (easing, khong bat dot ngot)
    G.set(o, { autoAlpha: 1, delay: tre });
    h.san = nowG() + tre + (slot ? 0.5 : 0.4);
    G.fromTo(o, slot ? { y: 90, scale: 0.84, rotation: -4 } : phu ? { y: 30, scale: 0.94 } : { y: 36, scale: 0.9 },
      { y: 0, scale: 1, rotation: 0, duration: slot ? 0.75 : phu ? 0.8 : 0.9, ease: slot ? 'back.out(1.4)' : 'expo.out', delay: tre });
  }
  function raO(h, tre) {
    const o = h.o;
    if (giam()) { G.set(o, { autoAlpha: 0 }); boLop(h); return; }
    h.san = 0;
    h.lops.forEach((l) => G.to(l, { autoAlpha: 0, duration: 0.2, ease: 'power2.in', delay: tre, overwrite: 'auto' }));
    G.to(o, { autoAlpha: 0, scale: 0.9, duration: 0.3, ease: 'power2.in', delay: tre + 0.06, overwrite: 'auto', onComplete: () => boLop(h) });
  }
  /** Noi dung chu cua o thoat truoc khi o doi cho / doi mau nen: khong de chu cu tren nen dang doi */
  function thoatNoiDung(h, tre) {
    if (h.id === 'A' || h.id === 'S' || !h.lops.length) return;
    h.lops.forEach((l) => G.to(l, { autoAlpha: 0, y: D(-16), duration: D(T_RA), ease: 'power2.in', delay: tre, overwrite: 'auto', onComplete: () => l.remove() }));
    h.lops = [];
  }
  function doiO(h, a, r, tre) {
    const giong = a.x === r.x && a.y === r.y && a.w === r.w && a.h === r.h;
    G.set(h.o, { autoAlpha: 1, scale: 1, y: 0, rotation: 0 });
    if (giong) return;
    thoatNoiDung(h, tre);
    if (giam()) { h.san = 0; G.set(h.o, { left: r.x, top: r.y, width: r.w, height: r.h }); return; }
    const dur = r.dur || T_DOI;
    const d0 = tre + (h.lops.length || h.cu ? T_TRE : 0.02);
    h.san = nowG() + d0 + dur * 0.65;
    G.to(h.o, { left: r.x, top: r.y, width: r.w, height: r.h, duration: dur, ease: r.ease || 'power4.inOut', delay: d0, overwrite: 'auto' });
  }
  function boLop(h) { h.lops.forEach((x) => x.remove()); h.lops = []; }
  function goHetO() { Object.keys(O).forEach((k) => { try { O[k].o.remove(); } catch (e) {} }); O = {}; }

  // ------------------------------------------------------------------ lop noi dung
  /**
   * Dat noi dung moi cho o id: lop moi hien (mat na / iris), lop cu lui len mo di. Phan tu con co
   * data-fx ('mat' | 'no' | 've' | 'mo' | 'len') + data-tre (giay) hien theo nhip. o.so: so le (giay) giua cac o.
   */
  function lop(id, html, o) {
    o = o || {};
    const h = o_(id);
    const cu = h.lops.slice();
    const el = document.createElement('div');
    el.className = 'a-lop' + (o.cls ? ' ' + o.cls : '');
    el.innerHTML = html;
    if (o.z) el.style.zIndex = o.z;
    const mw = o.cls === 'a-lop-bt' ? 0 : meoChong(h.rect, id);      // the bai tap that tu lo bo cuc cua no
    if (mw) el.style.setProperty('--a-cm', mw + 'px');
    const mbd = o.cls === 'a-lop-bt' ? 0 : meoDay(h.rect, id);
    if (mbd) el.style.setProperty('--a-cb', mbd + 'px');
    h.than.appendChild(el);
    // noi dung moi cho o dung yen (FLIP xong) roi moi vao; noi dung cu thoat truoc (khong bao gio chong chu)
    const cho = (giam() || o.nhanh || (st.nhanhVao && !cu.length)) ? 0 : Math.max(0, (h.san || 0) - nowG());
    const tre = Math.max(o.tre || 0, cho);
    const coCu = cu.length > 0 && !o.iris;
    const vao = tre + (coCu && !giam() ? 0.22 : 0);
    if (o.iris && !giam()) {
      G.set(el, { autoAlpha: 1 });
      G.fromTo(el, { clipPath: 'circle(0% at 50% 58%)' }, { clipPath: 'circle(76% at 50% 58%)', duration: 1.05, ease: 'expo.inOut', delay: tre, onComplete: () => { el.style.clipPath = ''; } });
    } else if (giam()) {
      G.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1, ease: 'none', delay: vao });
    } else {
      // ca lop hien dan .3 s (nhan o la phan cua lop: khong chuyen dong rieng) — chi phan tu noi dung truot / no theo thu tu
      G.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'power1.out', delay: vao });
    }
    el.querySelectorAll('[data-fx]').forEach((x) => hieu(x, vao + (+x.dataset.tre || 0), x.dataset.fx));
    if (o.kb && !giam()) {
      const img = el.querySelector('img');
      if (img) G.fromTo(img, { scale: o.kb[0] }, { scale: o.kb[1], duration: o.kbDur || 9, ease: 'none', delay: tre });
    }
    cu.forEach((x) => {
      if (o.iris) {
        x.querySelectorAll('.a-chip-anh, .a-anh-chu, .a-anh-phu, .a-vai-ten').forEach((t) => G.to(t, { autoAlpha: 0, duration: D(0.2), delay: tre, overwrite: 'auto' }));
        G.to(x, { autoAlpha: 0, duration: 0.01, delay: tre + D(1.1), onComplete: () => x.remove() });
        return;
      }
      G.to(x, { autoAlpha: 0, y: D(o.raY == null ? -16 : o.raY), duration: D(T_RA), ease: 'power2.in', delay: tre, overwrite: 'auto', onComplete: () => x.remove() });
    });
    h.lops = [el];
    if (id !== 'S') G.delayedCall(vao + 0.9, capLai);      // trang doi -> loc lai phu de (khong lap chu vua hien)
    return el;
  }
  /**
   * Hien mot phan tu: LUON o do dam day du (khong mo nua chung). Theo video mau:
   * 'mat' troi len tu vach (.8 expo.out) | 'no' phong (.7 back.out(1.9)) | 've' ke vach (.5) | 'mo' hien dan (.4) | 'len' cat tu duoi (.8 expo.out)
   */
  function hieu(it, tre, fx) {
    if (giam()) { G.set(it, { autoAlpha: 1, clearProps: 'transform,clipPath' }); G.fromTo(it, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1, delay: tre }); return; }
    const bat = () => G.set(it, { autoAlpha: 1, delay: tre });
    switch (fx) {
      case 'mat':
        bat();
        if (it.firstElementChild) G.fromTo(it.firstElementChild, { yPercent: 112 }, { yPercent: 0, duration: 0.8, ease: 'expo.out', delay: tre });
        break;
      case 'no':
        G.fromTo(it, { autoAlpha: 0, scale: st.dt ? 0.86 : 0.55 }, { autoAlpha: 1, duration: 0.14, ease: 'none', delay: tre });
        G.to(it, { scale: 1, duration: 0.7, ease: 'back.out(1.9)', delay: tre });
        break;
      case 've':
        G.fromTo(it, { autoAlpha: 1, scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'power3.inOut', delay: tre });
        break;
      case 'mo':
        G.fromTo(it, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'power1.out', delay: tre });
        break;
      default:
        G.fromTo(it, { autoAlpha: 0, y: 34 }, { autoAlpha: 1, duration: 0.22, ease: 'none', delay: tre });
        G.to(it, { y: 0, duration: 0.8, ease: 'expo.out', delay: tre });
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
    if (co) G.delayedCall((tre || 0) + 0.9, capLai);      // vua hien them chu tren trang -> loc lai phu de
    return co;
  }
  /** Mat na chu (troi len tu duoi vach). vai: dat data-r; te = 1: phan tu noi dung (dem mat do) */
  const dai = (html) => String(html).replace(/<[^>]*>/g, '').length > 26;     // doan dai nhieu dong: khong dung mat na (mat na cat chu khi troi len)
  const mk = (html, vai, tre, st_, cls) => (dai(html)
    ? `<span class="a-mk-p ${cls || ''}" data-te="1" data-r="${vai || ''}" data-fx="len"${tre ? ` data-tre="${tre}"` : ''}${st_ ? ` style="${st_}"` : ''}>${html}</span>`
    : `<span class="a-mk ${cls || ''}" data-te="1" data-r="${vai || ''}" data-fx="mat"${tre ? ` data-tre="${tre}"` : ''}${st_ ? ` style="${st_}"` : ''}><span class="a-mk-i">${html}</span></span>`);
  const mkCho = (html, vai, khoa, st_, cls) => (dai(html)
    ? `<span class="a-mk-p a-cho ${cls || ''}" data-te="1" data-r="${vai || ''}" data-cho="${khoa}" data-fx-cho="len"${st_ ? ` style="${st_}"` : ''}>${html}</span>`
    : `<span class="a-mk a-cho ${cls || ''}" data-te="1" data-r="${vai || ''}" data-cho="${khoa}"${st_ ? ` style="${st_}"` : ''}><span class="a-mk-i">${html}</span></span>`);
  const nhan = (text) => `<div class="a-nhan" data-r="label">${esc(text)}</div>`;
  // thu tu vao co dinh trong mot o (giay sau khi o san sang): nhan -> chinh -> phu -> them
  const E0 = 0.04, E1 = 0.12, E2 = 0.24, E3 = 0.36;
  /** So le giua cac o cua mot nhip: o thu k vao sau k * 0.16 s (moi luc chi vai phan tu dang chuyen dong) */
  const soLe = (k) => (giam() ? 0 : k * (st.nhanhVao ? 0.05 : 0.16));

  // ------------------------------------------------------------------ nhan manh (tieu diem theo tieng)
  /** Nhip o: phong nhe 160 ms roi dan hoi (tieu diem toi CUNG luc tieng: tre = api.tre(tt)) */
  function nhip(id, tre, s) {
    const h = O[id];
    if (!h || !h.rect || giam()) return;
    s = s || 1.045;
    G.timeline({ delay: tre || 0 })
      .to(h.o, { scale: s, duration: 0.16, ease: 'power2.out', overwrite: false })
      .to(h.o, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.55)' });
  }
  /** Vien sang (ring) cua o: vao 180 ms, giu roi mo */
  function vien(id, tre, mau, giu) {
    const h = O[id];
    if (!h) return;
    let v = h.than.querySelector(':scope > .a-vien');
    if (!v) { v = document.createElement('div'); v.className = 'a-vien'; h.than.appendChild(v); }
    v.style.setProperty('--a-vien', mau || 'var(--a-cam)');
    G.killTweensOf(v);
    G.fromTo(v, { opacity: 0 }, { opacity: 1, duration: giam() ? 0.01 : 0.18, ease: 'none', delay: tre || 0 });
    if (giu !== true) G.to(v, { opacity: 0, duration: 0.7, ease: 'power1.in', delay: (tre || 0) + (giu || 0.5) });
  }
  function boVien(id) { const h = O[id]; const v = h && h.than.querySelector(':scope > .a-vien'); if (v) { G.killTweensOf(v); G.to(v, { opacity: 0, duration: 0.2 }); } }
  /** Tieu diem = nhip + vien, ca hai vao <= 200 ms */
  function tieuDiem(id, tre, s) { nhip(id, tre, s); vien(id, tre); }
  function lac(el, tre, amp) {
    if (!el || giam()) return;
    const tl = G.timeline({ delay: tre || 0 });
    [1, -1, 0.7, -0.5, 0.25, 0].forEach((k, i) => tl.to(el, { x: (amp || 12) * k, duration: i === 5 ? 0.12 : 0.07, ease: 'sine.inOut' }));
  }

  // ------------------------------------------------------------------ do co chu (fit) — DOM do that, tim nhi phan
  /**
   * Co chu lon nhat (px, nguyen) trong [min, max] de `html` vua khung w x h (xuong dong neu !nowrap).
   * cls: lop CSS cua phan tu that; lh: line-height; lines: toi da so dong. strict: khong vua o min -> tra 0.
   */
  function fit(html, o) {
    const m = st.mesur;
    if (!m) return Math.floor(o.min);
    m.className = 'a-mesur ' + (o.cls || '');
    const W = Math.max(20, Math.round(o.w * 0.97 - 3));
    const lh = o.lh || 1.15;
    m.style.width = W + 'px';
    m.style.lineHeight = String(lh);
    m.style.whiteSpace = o.nowrap ? 'nowrap' : 'normal';
    m.style.fontWeight = o.fw || '';
    m.innerHTML = html;
    const ok = (fs) => {
      m.style.fontSize = fs + 'px';
      return m.scrollHeight <= o.h * 0.985 && m.scrollWidth <= W + 1 && (!o.lines || Math.round(m.scrollHeight / (fs * lh)) <= o.lines);
    };
    let lo = Math.max(1, Math.ceil(o.min)), hi = Math.max(lo, Math.floor(o.max));
    if (!ok(lo)) return o.strict ? 0 : lo;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (ok(mid)) lo = mid; else hi = mid - 1; }
    return lo;
  }
  /** Be ngang (px) cua o r bi goc meo that che (chi o co chu; o S tu lo chuyen rieng) */
  function meoChong(r, id) {
    if (!st.meo || !r || id === 'S' || id === 'A' || r.x == null) return 0;
    const mw = r.y + r.h > st.meo.y && r.x + r.w > st.meo.x ? Math.round(r.x + r.w - st.meo.x + 10) : 0;
    return r.w - mw >= r.w * 0.55 ? mw : 0;      // o hep: khong the nhuong, noi dung nam tren nen khong cham meo
  }
  /** Phan day (px) cua o r bi goc meo che khi KHONG nhuong be ngang duoc (o hep o sat goc): noi dung dung cao hon dinh meo */
  function meoDay(r, id) {
    if (!st.meo || !r || id === 'S' || id === 'A' || r.x == null) return 0;
    if (meoChong(r, id) > 0) return 0;
    if (!(r.y + r.h > st.meo.y && r.x + r.w > st.meo.x + 6)) return 0;
    const mb = Math.round(r.y + r.h - st.meo.y + 6);
    return r.h - mb >= r.h * 0.5 ? mb : 0;
  }
  /** Hop noi dung (px) cua o id theo rect DICH: tru le va dong nhan. Khop voi .a-pad trong CSS. */
  function hop(id, o) {
    o = o || {};
    const h = O[id];
    const r = (h && h.rect) || { w: 300, h: 200 };
    const nh = o.nhan === false ? 0 : st.fl * 1.75;
    const mw = meoChong(r, id), mb = meoDay(r, id);
    return { W: r.w, H: r.h, w: r.w - 2 * st.px - mw, h: r.h - 2 * st.py - nh - mb, px: st.px, py: st.py, mw, mb };
  }
  /** px -> cqw theo be ngang o dich (co gian muot khi o doi kich thuoc) */
  const cqw = (fs, W) => (fs / Math.max(1, W) * 100).toFixed(3) + 'cqw';
  /**
   * style font-size cho van ban `text` trong o id theo vai: lon nhat vua hop (<= token cua vai), khong cat,
   * xuong dong khi can. o: html (da dung san), wf / hf (ti le hop), lh, mot (uu tien 1 dong), cat (rut ngan theo tu), max/min.
   */
  function coVua(id, text, vai, o) {
    o = o || {};
    const b = hop(id, o);
    const tk = T(vai);
    const w = b.w * (o.wf || 1), hh = b.h * (o.hf || 1);
    const max = Math.min(o.max || tk.max, tk.max), min = o.min || tk.min;
    const lh = o.lh || 1.15;
    const cls = 'a-r-' + vai + (o.cls ? ' ' + o.cls : '');
    const fw = ({ head: '700', form: '800', sent: '700', mean: '800', body: '600', label: '700' })[vai];
    let txt = String(text == null ? '' : text), fs = 0;
    for (let k = 0; k < 9; k++) {
      const html = o.html != null ? o.html : (o.jpx ? jp(txt) : esc(txt));
      if (o.mot) fs = fit(html, { w, h: hh, max, min: Math.max(min, max * 0.55), lh, cls, fw, nowrap: true, strict: true });
      if (!fs) fs = fit(html, { w, h: hh, max, min, lh, cls, fw, nowrap: o.nowrap, lines: o.lines, strict: !!(o.cat && o.html == null) });
      if (fs || !o.cat || o.html != null) break;
      txt = nganTu(txt, Math.max(10, Math.floor(kyTu(txt).length * 0.85)));
    }
    if (!fs) fs = Math.floor(min);
    return { fs, css: `font-size:${cqw(fs, b.W)}`, text: txt };
  }

  // ------------------------------------------------------------------ o Sensei (phu de 2 dong co dinh + tien do)
  function taoS() {
    const h = o_('S');
    h.o.style.zIndex = 20;
    h.o.classList.add('a-o-s');
    h.than.insertAdjacentHTML('beforeend', `
      <div class="a-s-ten" data-r="label">Sensei Mèo</div>
      <div class="a-s-cau"><div class="a-s-dong" data-r="body"></div></div>
      <div class="a-s-tien"></div>
      <div class="a-s-matane" data-r="mean" lang="ja">またね！</div>`);
    st.sTen = h.than.querySelector('.a-s-ten');
    st.sCau = h.than.querySelector('.a-s-cau');
    st.sDong = h.than.querySelector('.a-s-dong');
    st.sTien = h.than.querySelector('.a-s-tien');
    st.sMatane = h.than.querySelector('.a-s-matane');
    G.set(st.sMatane, { autoAlpha: 0 });
    G.set(st.sDong, { autoAlpha: 0 });
    return h;
  }
  /** Le phai cua phu de = phan o S nam trong goc meo (+ 12 px) */
  function phaiMeo(r) {
    const m = st.meo;
    let phai = st.px;
    if (m) {
      const chong = r.x + r.w - m.x;
      if (chong > 0 && r.y + r.h > m.y) phai = Math.min(r.w * 0.62, chong + 12);
    }
    return Math.round(phai);
  }
  function choMeo() { capXep(); }
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

  // ---- phu de (loi Sensei song). HOP CO DINH 2 DONG; chu co dinh theo hop, KHONG doi co khi cau dai ra.
  // Cau moi -> doi cheo (cu thoat 110 ms, moi vao 180 ms). Cung mot cau dai ra -> them tu vao cho cu (khong hieu ung, toi da 3 lan / giay).
  // Cau qua dai cho 2 dong -> "trang" tiep theo bat dau o tu dau tien tran (doi cheo), khong cat giua tu.
  const RE_HET = /[.!?。！？…]["'”’)）」』]*$/;
  const RE_CUOI = /[\s.,;:!?…、。！？)）」』"'”’]$/;
  const chuan = (s) => String(s == null ? '' : s).toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, '');
  const demChu = (x) => kyTu(x).filter((k) => /[\p{L}\p{N}]/u.test(k)).length;
  const tachCau = (raw) => String(raw || '').replace(/\s+/g, ' ').trim().split(/(?<=[。！？])|(?<=(?<!\d)[.!?…])\s+/).map((x) => x.trim()).filter(Boolean);
  const donVi = (s) => (String(s).match(/[぀-ヿ一-鿿々]+|[^\s぀-ヿ一-鿿々]+|\s+/g) || []).flatMap((u) => (RE_JP.test(u) && kyTu(u).length > 10 ? kyTu(u) : [u]));
  /** Chu dang HIEN tren trang (khong tinh o Sensei, khong tinh phan tu con an) — de khong lap lai trong phu de */
  function chuTrang() {
    let t = '';
    Object.keys(O).forEach((id) => {
      const h = O[id];
      if (id === 'S' || !h || !h.rect) return;
      h.lops.forEach((l) => {
        const w = document.createTreeWalker(l, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = w.nextNode())) {
          const p = n.parentElement;
          if (!p || p.closest('rt')) continue;
          if (p.checkVisibility && !p.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && !p.closest('.a-cho:not([data-da])')) continue;      // chu dang cho cue cung tinh la 'da co tren trang'
          t += ' ' + n.nodeValue;
        }
      });
    });
    return chuan(t);
  }
  /** Bo nhung doan lien tiep da nam nguyen van tren trang (>= 12 ky tu Latin / >= 5 ky tu Nhat); con < 20 chu -> '' */
  function capLoc(text) {
    const pg = chuTrang();
    const toks = String(text || '').match(/\S+/g) || [];
    if (!pg || !toks.length) return text;
    const out = [];
    let bo = 0;
    for (let i = 0; i < toks.length;) {
      let best = 0, len = 0, acc = '';
      for (let j = i; j < toks.length; j++) {
        acc += chuan(toks[j]);
        if (!acc) continue;
        if (!pg.includes(acc)) break;
        best = j - i + 1; len = acc.length;
      }
      if (best && len >= (RE_JP.test(toks[i]) ? 5 : 12)) { i += best; bo += len; continue; }
      if (RE_JP.test(toks[i]) && toks[i].length > 6) {
        // cum Nhat dai khong tach tu: bo cac doan >= 6 ky tu da co nguyen van tren trang
        const cs = kyTu(toks[i]);
        let r = '', j = 0, cat = false;
        while (j < cs.length) {
          let e = j, tot = '';
          while (e < cs.length && pg.includes(tot + chuan(cs[e]))) { tot += chuan(cs[e]); e++; }
          if (e - j >= 6) { j = e; cat = true; bo += tot.length; } else { r += cs[j]; j++; }
        }
        out.push(cat ? r : toks[i]); i++; continue;
      }
      out.push(toks[i]); i++;
    }
    if (!bo) return text;
    const con = out.join(' ');
    return demChu(con) >= 20 ? con : '';
  }
  /** Hinh hoc hop phu de theo o S hien tai: tra { rong, cao, fs, top } hoac null */
  function capHinh() {
    const h = O.S;
    if (!h || !h.rect || !st.sDong) return null;
    const r = h.rect;
    const phai = phaiMeo(r);
    const rong = Math.max(60, r.w - st.px - phai);
    const tk = T('body');
    // co chu theo be ngang (hep -> nho dan toi co nho nhat); dien thoai co dinh
    let fs = st.dt ? tk.max : kep(tk.min + (tk.max - tk.min) * ((rong - 240 * st.u / 0.72) / (170 * st.u / 0.72)), tk.min, tk.max);
    const hasTen = !st.dt && getComputedStyle(st.sTen).display !== 'none';
    const dau = st.py + (hasTen ? st.fl * 1.25 + st.fl * 0.5 : 0);
    const cuoi = st.py + 5 + (st.dt ? 6 : 10);
    const xong = h.than.classList.contains('a-s-xong');
    while (fs > tk.min && (2 * fs * 1.3 + fs * 0.6 + dau + cuoi > r.h)) fs -= 1;
    const cao = 2 * fs * 1.3 + fs * 0.6;
    const vung = r.h - dau - cuoi - (xong ? r.h * 0.34 : 0);
    const top = Math.round(dau + Math.max(0, (vung - cao) / 2));
    return { rong, cao, fs: Math.round(fs), top };
  }
  function capXep() {
    const g = capHinh();
    if (!g) return;
    st.sCau.style.width = g.rong + 'px';
    st.sCau.style.height = g.cao.toFixed(1) + 'px';
    st.sCau.style.top = g.top + 'px';
    st.sDong.style.fontSize = g.fs + 'px';
    st.cap.fs = g.fs; st.cap.rong = g.rong; st.cap.cao = g.cao;
  }
  /** Van ban vua 2 dong cua hop phu de? */
  function capVua(text) {
    const m = st.mesur, c = st.cap;
    if (!c.fs) capXep();
    if (!c.fs) return true;
    m.className = 'a-mesur a-mo-cau';
    m.style.width = Math.max(20, Math.round(c.rong - 2)) + 'px';
    m.style.lineHeight = '1.3';
    m.style.whiteSpace = 'normal';
    m.style.fontWeight = '600';
    m.style.fontSize = c.fs + 'px';
    m.innerHTML = jp(text);
    return m.scrollHeight <= c.cao * 1.01;
  }
  /** Doi phu de. tai = cung mot cau dai ra (them tai cho, khong hieu ung) */
  function capDat(text, o) {
    o = o || {};
    text = String(text || '').replace(/\s+/g, ' ').trim();
    const dong = st.sDong, c = st.cap;
    if (!dong) return;
    if (text === st.loiCau) return;
    const cuoiCu = st.loiCau;
    st.loiCau = text;
    c.tHien = Date.now();
    if (c.doi) return;                                   // dang thoat cau cu: khi xong se vao cau moi nhat (st.loiCau)
    const ap = () => { dong.dataset.cau = st.loiCau; capXep(); dong.innerHTML = jp(st.loiCau); };
    const hien = () => {
      c.doi = false;
      if (!st.loiCau) { G.set(dong, { autoAlpha: 0 }); dong.dataset.cau = ''; dong.innerHTML = ''; return; }
      ap();
      if (giam()) G.set(dong, { autoAlpha: 1, y: 0 });
      else G.fromTo(dong, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.18, ease: 'power2.out' });
    };
    const an = G.getProperty(dong, 'autoAlpha') > 0.05 && dong.dataset.cau;
    if (o.tai && an && text && cuoiCu) { G.killTweensOf(dong); G.set(dong, { autoAlpha: 1, y: 0 }); ap(); return; }
    G.killTweensOf(dong);
    if (!an || giam()) { hien(); return; }
    c.doi = true;
    G.to(dong, { autoAlpha: 0, y: -6, duration: 0.11, ease: 'power1.in', onComplete: hien });
  }
  /** Tinh trang hien tai tu ban ghi: { text, tai } hoac null */
  function capTinh(raw) {
    const c = st.cap;
    const rs = String(raw || '');
    const ds = tachCau(rs);
    if (!ds.length) return null;
    if (rs.length < (c.rawLen || 0)) { c.sIdx = -1; c.from = 0; }          // luot noi moi
    c.rawLen = rs.length;
    const idx = ds.length - 1;
    let cur = ds[idx];
    const xong = RE_HET.test(cur);
    if (!xong && !RE_CUOI.test(rs)) cur = cur.replace(/\s*\S+$/, '');       // tu cuoi con dang do
    if (demChu(cur) < (xong ? 3 : (st.loiCau ? 16 : 10))) return null;
    const moiCau = idx !== c.sIdx;
    if (moiCau) { c.sIdx = idx; c.from = 0; }
    const dv = donVi(cur);
    let tuK = Math.min(c.from, Math.max(0, dv.length - 1));
    let trang = dv.slice(tuK).join('').trim();
    let sang = false, guard = 0;
    // qua 2 dong: bo it tu nhat o DAU (cua so truot, con lai >= ~2 dong day), bat dau o dau tu, toi da 1 lan / 1.1 s (throttle o capLen)
    if (!capVua(trang)) {
      let lo = tuK + 1, hi = dv.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (capVua(dv.slice(mid).join('').trim())) hi = mid; else lo = mid + 1; }
      let k = lo;
      while (k < dv.length - 1 && dv[k - 1] && !/^\s+$/.test(dv[k - 1]) && !RE_JP.test(dv[k]) && !/^\s+$/.test(dv[k])) k++;
      tuK = Math.min(k, dv.length - 1); c.from = tuK;
      trang = dv.slice(tuK).join('').trim();
      sang = true;
    }
    trang = trang.replace(/^[\s:;,.、。！？!?)）」』]+/, '');      // trang moi khong bat dau bang dau cau le
    return { text: trang, tai: !moiCau && !sang && !!st.loiCau, xong };
  }
  /** Chi so don vi dau tien cua dong thu hai cua doan dv[tu..] (lui toi dau tu, khong cat giua tu Latin) */
  function capDongDau(dv, tu) {
    const m = st.mesur, c = st.cap;
    m.className = 'a-mesur a-mo-cau';
    m.style.width = Math.max(20, Math.round(c.rong - 2)) + 'px';
    m.style.lineHeight = '1.3';
    m.style.whiteSpace = 'normal';
    m.style.fontWeight = '600';
    m.style.fontSize = c.fs + 'px';
    const mot = (e) => { m.innerHTML = jp(dv.slice(tu, e + 1).join('').trim()); return m.scrollHeight <= c.fs * 1.3 * 1.05; };
    let lo = tu, hi = dv.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (mot(mid)) lo = mid; else hi = mid - 1; }
    let k = lo + 1;
    while (k > tu + 1 && dv[k] && !/^\s+$/.test(dv[k - 1]) && !RE_JP.test(dv[k]) && !/^\s+$/.test(dv[k])) k--;
    return Math.max(k, tu + 1);
  }
  const CAP_GROW = 450, CAP_SWAP = 1500;
  function capLen(api, tg) {
    const c = st.cap;
    c.target = tg || c.target;
    const t = c.target;
    if (!t) return;
    const gap = t.tai ? CAP_GROW : CAP_SWAP;
    const cho = c.tDat + gap - Date.now();
    if (cho > 0) {
      if (!c.hen && api && api.hen) c.hen = api.hen(() => { c.hen = null; capLen(api); }, cho + 5);
      return;
    }
    c.tDat = Date.now();
    c.target = null;
    if (window.__aDebug) (window.__capLog = window.__capLog || []).push(['len', Date.now(), t.tai, t.text.slice(-24)]);      // DEBUG
    const text = capLoc(t.text);
    if (!text) { if (st.loiCau) capDat('', {}); return; }      // ca cau da co tren trang: khong lap lai chu
    capDat(text, { tai: t.tai });
  }
  /** Loc lai phu de theo trang hien tai (goi sau khi mot o doi noi dung) */
  function capLai() {
    const c = st.cap;
    if (!L || !c || !c.raw || !st.sDong) return;
    capNhan(c.raw, c.api);
  }
  /** Loi Sensei song (ban ghi luot hien tai): hien CAU DANG NOI */
  function capNhan(raw, api) {
    const c = st.cap;
    if (!c.tDat) c.tDat = 0;
    c.raw = raw; c.api = api;
    const tg = capTinh(raw);
    if (!tg) return;
    if (!tg.tai && tg.text === st.loiCau) return;
    capLen(api, tg);
  }
  /** Het nhip: hien trang cuoi day du */
  function capXa(raw, api) {
    const tg = capTinh(raw);
    if (!tg || demChu(tg.text) < 3) return;
    capLen(api, tg);
  }
  /** Phu de cho the chuong / ket bai (khong kiem lap, vua 2 dong) */
  function datLoi(text) {
    capXep();
    let t = text;
    if (!capVua(t)) t = nganTu(t, 70);
    capDat(t, { tai: false });
  }
  /** O Sensei o the ket bai: dong loi len tren, またね！ o duoi */
  function datS(xong) {
    const h = O.S;
    if (h) h.than.classList.toggle('a-s-xong', !!xong);
    if (!xong && st.sMatane) G.set(st.sMatane, { autoAlpha: 0 });
    if (h && h.rect) capXep();
  }
  function xoaLoi() { capDat(''); }

  // ------------------------------------------------------------------ bo cuc tung dang nhip (rect thiet ke 1920x1080 / 390x679)
  const SM = (n) => (n);
  const BO = {
    tieuDe: () => (st.dt ? {
      A: R(10, 10, 370, 300, { tone: 'kem' }), D: R(10, 318, 370, 150, { tone: 'cam' }), B: R(10, 476, 181, 89), C: R(199, 476, 181, 89), S: R(10, 573, 370, 96, { tone: 'dao' }),
    } : {
      A: R(40, 40, 1060, 1000, { tone: 'kem' }), D: R(1120, 40, 760, 420, { tone: 'cam' }), B: R(1120, 480, 370, 260), C: R(1510, 480, 370, 260), S: R(1120, 760, 760, 280, { tone: 'dao' }),
    }),
    vocab: (coE) => {
      if (st.dt) {
        return coE ? {
          D: R(10, 10, 370, 190), A: R(10, 208, 181, 214), B: R(199, 208, 181, 103), C: R(199, 319, 181, 103), E: R(10, 430, 370, 135, { tone: 'cam' }), S: R(10, 573, 370, 96, { tone: 'dao' }),
        } : {
          D: R(10, 10, 370, 200), A: R(10, 218, 181, 347), B: R(199, 218, 181, 165), C: R(199, 391, 181, 174), E: null, S: R(10, 573, 370, 96, { tone: 'dao' }),
        };
      }
      return coE ? {
        A: R(40, 40, 940, 760), E: R(40, 820, 940, 220, { tone: 'cam', tre: 0.12 }), D: R(1000, 40, 880, 440), B: R(1000, 500, 430, 240), C: R(1450, 500, 430, 240), S: R(1000, 760, 880, 280, { tone: 'dao' }),
      } : {
        A: R(40, 40, 940, 1000), E: null, D: R(1000, 40, 880, 440), B: R(1000, 500, 430, 240), C: R(1450, 500, 430, 240), S: R(1000, 760, 880, 280, { tone: 'dao' }),
      };
    },
    kanji: (coE) => (st.dt ? {
      A: R(10, 10, 190, 190, { tone: 'kem' }), D: R(208, 10, 172, 190), B: R(10, 208, 370, 140), C: R(10, 356, 370, 209), E: null, S: R(10, 573, 370, 96, { tone: 'dao' }),
    } : (coE ? {
      A: R(40, 40, 740, 740, { tone: 'kem' }), D: R(800, 40, 1080, 380), B: R(800, 440, 470, 300), C: R(1290, 440, 590, 300), E: R(40, 820, 740, 220), S: R(800, 760, 1080, 280, { tone: 'dao' }),
    } : {
      A: R(40, 40, 740, 1000, { tone: 'kem' }), D: R(800, 40, 1080, 380), B: R(800, 440, 470, 300), C: R(1290, 440, 590, 300), E: null, S: R(800, 760, 1080, 280, { tone: 'dao' }),
    })),
    nguPhap: () => (st.dt ? {
      D: R(10, 10, 370, 74), RAY: R(10, 92, 370, 330, { tone: 'ray', z: 12 }), A: R(10, 430, 370, 135), S: R(10, 573, 370, 96, { tone: 'dao' }),
    } : {
      D: R(40, 40, 1840, 140, { z: 24 }), RAY: R(40, 200, 1840, 500, { tone: 'ray', z: 12 }), A: R(40, 720, 560, 320, { z: 9 }), S: R(620, 720, 1260, 320, { tone: 'dao' }),
    }),
    viDu: () => (st.dt ? {
      RAY: R(10, 10, 370, 250, { tone: 'ray', z: 12 }), A: R(10, 268, 146, 297), B: R(164, 268, 216, 297), D: null, S: R(10, 573, 370, 96, { tone: 'dao' }),
    } : {
      RAY: R(40, 40, 1840, 420, { tone: 'ray', z: 12 }), A: R(40, 480, 560, 560), B: R(620, 480, 1260, 320), D: null, S: R(620, 820, 1260, 220, { tone: 'dao' }),
    }),
    kaiwaIntro: (n, lan) => {
      const chia = (x0, y0, w, h, p) => {
        // n chan dung xep trong khung (x0,y0,w,h): 1..2 -> hang doc, 3 -> 3 hang, 4 -> 2x2 (desktop); dien thoai: mot hang ngang
        const g = st.dt ? 8 : 20;
        if (st.dt || n <= 1) { const ww = (w - g * (n - 1)) / Math.max(1, n); return R(x0 + p * (ww + g), y0, ww, h); }
        if (n === 2) { const hh = (h - g) / 2; return R(x0, y0 + p * (hh + g), w, hh); }
        if (n === 3) { const hh = (h - 2 * g) / 3; return R(x0, y0 + p * (hh + g), w, hh); }
        const ww = (w - g) / 2, hh = (h - g) / 2; return R(x0 + (p % 2) * (ww + g), y0 + Math.floor(p / 2) * (hh + g), ww, hh);
      };
      const vai = {};
      const khung = st.dt ? [10, 10, 370, lan ? 150 : 170] : [40, 40, 700, 1000];
      for (let p = 0; p < 4; p++) vai['P' + p] = p < n ? Object.assign(chia(khung[0], khung[1], khung[2], khung[3], p), { fx: 'phu', tre: 0.1 + p * 0.1 }) : null;
      if (lan) {   // nghe tron doan: dong thoai lon o ben phai
        return Object.assign(st.dt ? {
          A: null, D: R(10, 168, 370, 397, { tone: 'cam' }), S: R(10, 573, 370, 96, { tone: 'dao' }),
        } : {
          A: null, D: R(760, 40, 1120, 760, { tone: 'cam' }), S: R(760, 820, 1120, 220, { tone: 'dao' }),
        }, vai);
      }
      return Object.assign(st.dt ? {
        A: R(10, 188, 370, 210), D: R(10, 406, 370, 159, { tone: 'cam' }), S: R(10, 573, 370, 96, { tone: 'dao' }),
      } : {
        D: R(760, 40, 1120, 300, { tone: 'cam' }), A: R(760, 360, 1120, 440), S: R(760, 820, 1120, 220, { tone: 'dao' }),
      }, vai);
    },
    kaiwa: () => (st.dt ? {
      A: R(10, 308, 150, 257), RAY: R(10, 10, 370, 290, { tone: 'ray', z: 12 }), B: R(168, 308, 212, 257), E: null, S: R(10, 573, 370, 96, { tone: 'dao' }),
    } : {
      A: R(40, 540, 480, 500), RAY: R(40, 40, 1840, 480, { tone: 'ray', z: 12 }), B: R(540, 540, 1340, 260), E: null, S: R(540, 820, 1340, 220, { tone: 'dao' }),
    }),
    quiz: (cho, mot) => {
      if (st.dt) {
        return cho ? { F: R(10, 10, 370, 555, { z: 45 }), A: null, O1: null, O2: null, O3: null, O4: null, S: R(10, 573, 370, 96, { tone: 'dao' }) } : {
          F: R(10, 10, 370, mot ? 170 : 190, { z: 45 }), A: mot ? null : R(10, 404, 370, 161), S: R(10, 573, 370, 96, { tone: 'dao' }),
        };
      }
      return cho ? { F: R(760, 40, 1120, 760, { z: 45 }), A: R(40, 40, 700, 1000, { z: 45 }), O1: null, O2: null, O3: null, O4: null, S: R(760, 820, 1120, 220, { tone: 'dao' }) } : {
        A: R(40, 40, 700, 1000, { z: 45, ease: 'expo.out', dur: 0.9 }), F: R(760, 40, 1120, 340, { z: 45, tre: 0.03, ease: 'expo.out', dur: 0.9 }), S: R(760, 820, 1120, 220, { tone: 'dao', tre: 0.05 }),
      };
    },
    oQuiz: (i, mot) => (st.dt ? (mot ? R(10, 188 + i * 96, 370, 88, { z: 46, fx: 'phu' }) : R(10 + (i % 2) * 189, 208 + Math.floor(i / 2) * 98, 181, 90, { z: 46, fx: 'phu' }))
      : (mot ? R(760, 400 + i * 100, 1120, 88, { z: 46, fx: 'phu' }) : R(760 + (i % 2) * 570, 400 + Math.floor(i / 2) * 210, 550, 190, { z: 46, fx: 'phu' }))),
    chuong: () => (st.dt ? {
      D: R(10, 10, 370, 250, { tone: 'cam' }), A: R(10, 268, 370, 160), B: R(10, 436, 370, 129), S: R(10, 573, 370, 96, { tone: 'dao' }),
    } : {
      A: R(40, 40, 700, 1000, { z: 30 }), D: R(760, 40, 1120, 460, { tone: 'cam', z: 30 }), B: R(760, 520, 1120, 280, { z: 30 }), S: R(760, 820, 1120, 220, { tone: 'dao' }),
    }),
    xong: () => (st.dt ? {
      R1: R(10, 10, 118, 290, { fx: 'phu' }), R2: R(136, 10, 118, 290, { fx: 'phu', tre: 0.08 }), R3: R(262, 10, 118, 290, { fx: 'phu', tre: 0.16 }),
      R4: R(10, 308, 370, 257, { fx: 'phu', tre: 0.24 }), S: R(10, 573, 370, 96, { tone: 'dao' }),
    } : {
      R1: R(40, 40, 600, 600, { fx: 'phu', z: 50 }), R2: R(660, 40, 600, 600, { fx: 'phu', tre: 0.08, z: 50 }), R3: R(1280, 40, 600, 600, { fx: 'phu', tre: 0.16, z: 50 }),
      R4: R(40, 660, 1000, 380, { fx: 'phu', tre: 0.24, z: 50 }), S: R(1060, 660, 820, 380, { tone: 'dao' }),
    }),
  };
  void SM;
  /** Mot bo cuc moi: moi o khong co trong dat (tru S) bi thu lai */
  function boCuc(ten, dat, opt) {
    const moi = Object.assign({}, dat);
    Object.keys(O).forEach((id) => { if (!(id in moi) && id !== 'S' && !/^K\d+_\d+$/.test(id) && O[id].rect) moi[id] = null; });
    st.bo = ten;
    st.boCuoi = moi;
    st.ent = 0;
    canh(moi, Object.assign({ tone: null }, opt || {}));
    choMeo();
  }

  // ------------------------------------------------------------------ anh
  function anhHtml(url, o) {
    o = o || {};
    // Khong co anh (vd bai Nhap mon): o anh thanh the chu lon tren nen cam (khong de o trong)
    if (!url) {
      const t = o.thay || '';
      return `<div class="a-anh-lop is-trong"><div class="a-vong v1"></div><div class="a-vong v2"></div><div class="a-anh-chu"${RE_JP.test(t) ? ' lang="ja"' : ''} data-r="mean" style="__CHU__">${esc(t)}</div>${o.thayPhu ? `<div class="a-anh-phu" data-r="label">${esc(o.thayPhu)}</div>` : ''}</div>`;
    }
    return `<div class="a-anh-lop"><img src="${esc(url)}" alt="" decoding="async" draggable="false"${o.pos ? ` style="object-position:${esc(o.pos)}"` : ''} onerror="this.parentNode.classList.add('is-hong')"/>${o.them || ''}</div>`;
  }
  /** Doi anh o id (iris): khong doi neu cung anh */
  function datAnh(id, url, o) {
    o = o || {};
    const h = o_(id);
    const khoa = (url || ('chu:' + (o.thay || ''))) + (o.them || '');
    if (h.anh === khoa && h.lops.length) return h.lops[0];
    h.anh = khoa;
    let html = anhHtml(url, o);
    if (!url) {
      const hp = hop(id, { nhan: false });
      const f = fit(esc(o.thay || ''), { w: hp.w * 0.9, h: hp.h * 0.4, max: T('mean').max, min: T('mean').min, lh: 1.2, cls: 'a-r-mean', nowrap: true });
      html = html.replace('__CHU__', `font-size:${f}px`);
    }
    return lop(id, html, { iris: !o.ngay, kb: o.kb || [1.0, 1.06], kbDur: 10, tre: (o.tre || 0) });
  }
  const anhBai = (nh) => (nh && nh.bai && nh.bai.sceneImageUrl) || null;

  // ------------------------------------------------------------------ chan dung hoi thoai (SenseiAvatarNoi)
  function ganAvatar(m, root, tuyChon) {
    const AV = window.SenseiAvatarNoi;
    if (!AV || !AV.gan || !root) return;
    root.querySelectorAll('img.a-vai-anh').forEach((img) => {
      try {
        const ct = AV.gan(img, { nhanVat: img.dataset.nv || tuyChon.nhanVat, lineId: img.dataset.line || tuyChon.lineId });
        if (ct) { m.avt = m.avt || []; m.avt.push(ct); st.avt.push(ct); }
      } catch (e) { /* khong co avatar-noi: giu anh tinh */ }
    });
  }
  function goAvatar(m) {
    (m.avt || []).forEach((ct) => { try { ct.go(); } catch (e) {} });
    Object.keys(m.avtP || {}).forEach((k) => { try { if (m.avtP[k]) m.avtP[k].go(); } catch (e) {} });
    m.avt = []; m.avtP = {};
  }

  // ================================================================== DUNG TUNG DANG NHIP
  // ---- mo dau bai (nhip dau tien cua buoi giang): chao -> "Bài N" + ten bai, 2 o dem
  function dungTieuDe(nh, api, m) {
    const bai = nh.bai || {};
    const title = String(bai.title || '');
    const so = bai.lessonNumber || '';
    const ten = title.replace(/^Bài\s*\d+\s*:\s*/, '').split(/\s+—\s+/)[0] || title;
    const soTu = (bai.vocabList || []).length, soMau = (bai.slides || []).length;
    boCuc('tieuDe', BO.tieuDe(), { stag: 0.15 });
    const canhTen = String(bai.sceneImageAlt || bai.description || '').split(/[.,;—]/)[0].trim();
    datAnh('A', anhBai(nh), { ngay: true, kb: [1.12, 1.0], them: `<div class="a-chip-anh" data-r="label" data-fx="len" data-tre="1.3">${esc(st.dt ? 'Tình huống' : ngan(canhTen || ('Bài ' + so), 28))}</div>` });
    const nhanCap = nh.capDo === 'KANA' ? 'Nhập môn' : 'Sơ cấp · ' + (nh.capDo || '');
    const bD = hop('D');
    // 1) chao
    const fc = coVua('D', 'こんにちは！', 'mean', { max: bD.h * 0.3, mot: true, hf: 0.5, lh: 1.15 });
    const fx = coVua('D', 'Xin chào các bạn!', 'body', { hf: 0.2, lh: 1.25, mot: true });
    m.chao = lop('D', `<div class="a-vong v1"></div><div class="a-vong v2"></div><div class="a-vong v3"></div>
      <div class="a-pad">${nhan(nhanCap, 0.55)}<div class="a-giua a-trai"><div><div>${mk('こんにちは！', 'mean', 0.6, fc.css, 'a-jp')}</div><div class="a-mt">${mk('Xin chào các bạn!', 'body', 0.95, fx.css)}</div></div></div></div>`);
    m.chao.dataset.chao = '1';
    // 2) "Bài N" + ten bai (doi cheo sau chao)
    const f1 = coVua('D', 'Bài ' + so, 'head', { max: bD.h * 0.48, mot: true, hf: 0.55, lh: 1 });
    const f2 = coVua('D', ten, 'mean', { max: Math.min(bD.h * 0.2, 60 * st.u), hf: 0.3, lh: 1.1, mot: true });
    m.hen2 = api.hen(() => {
      if (!O.D || O.D.lops[0] !== m.chao) return;
      lop('D', `<div class="a-vong v1"></div><div class="a-vong v2"></div><div class="a-vong v3"></div>
        <div class="a-pad">${nhan(nhanCap, 0.2)}<div class="a-giua a-trai"><div><div>${mk('Bài ' + esc(so), 'head', 0.1, f1.css)}</div><div class="a-mt">${mk(esc(f2.text), 'mean', 0.5, f2.css)}</div></div></div></div>`, { nhanh: true });
    }, 1600);
    // 2 o dem
    const k = (bai.kanjiList || []).length;
    const bB = hop('B');
    const fn = (n) => fit(`<span>${n}</span>`, { w: bB.w * 0.55, h: bB.h * 0.75, max: T('mean').max, min: T('mean').min, lh: 1, cls: 'a-r-mean', nowrap: true });
    const fB = fn(soMau || k), fC = fn(soTu);
    lop('B', `<div class="a-pad">${nhan(soMau ? 'Ngữ pháp' : C.tenChuong('kanji', nh.capDo), E0)}<div class="a-giua a-trai"><div class="a-so-hang" data-te="1" data-fx="len" data-tre="${E1}"><span class="a-so" data-r="mean" style="font-size:${fB}px">${soMau || k}</span><span class="a-so-phu" data-r="label">${soMau ? 'mẫu câu' : 'chữ'}</span></div></div></div>`, { tre: giam() ? 0 : 0.35 });
    const tu = (bai.vocabList || []).filter((v) => v && v.imageUrl).slice(0, 3);
    const bC = hop('C');
    const thumb = Math.round(Math.min(bC.w / 3.4, bC.h * 0.34));
    lop('C', `<div class="a-pad">${nhan('Từ vựng', E0)}<div class="a-so-hang" data-te="1" data-fx="len" data-tre="${E1}"><span class="a-so" data-r="mean" style="font-size:${fC}px">${soTu}</span><span class="a-so-phu" data-r="label">từ mới</span></div>
      <div class="a-thumbs">${tu.map((v, i) => `<img src="${esc(v.imageUrl)}" alt="" style="width:${thumb}px;height:${thumb}px" data-fx="no" data-tre="${(E2 + i * 0.22).toFixed(2)}">`).join('')}</div></div>`, { tre: giam() ? 0 : 0.8 });
    m.tieuDe = true;
    m.tTieuDe = nowG();
  }

  // ---- tu vung
  // Bo cuc CO DINH cho moi nhip tu vung (khong nhay bo cuc theo tu): anh | chu lon + cach doc + nghia; co them dai "Lưu ý" neu tu co accentNote.
  function dungTuVung(nh, api, m) {
    const v = nh.data || {};
    const tu = String(v.kanji || v.word || '');
    const coRuby = v.kanji && v.furigana && v.furigana !== v.kanji;
    const doc = coRuby ? v.furigana : (v.word && v.word !== tu ? v.word : '');
    const nghia = String(v.meaningVi || '');
    let nghiaNgan = boNgoacCuoi(nghia.split(/[;；]/)[0]);
    if (kyTu(nghiaNgan).length > 60) nghiaNgan = nghiaNgan.split(/,\s*/).slice(0, 2).join(', ');
    const c = nh.chuong || {};
    const luuY = nganTu(String(v.accentNote || '').trim(), 110);
    const dat = BO.vocab(!!luuY && !st.dt);
    const loai0 = C.loaiTu(v.wordType);
    const loai = kyTu(loai0).length <= 10 ? loai0 : '';
    const tieuDe = m.tieuDe;
    const vao = () => {
      boCuc('vocab', dat);
      datAnh('A', v.imageUrl || anhBai(nh), { tre: 0.05, pos: '50% 40%', thay: '単語', thayPhu: 'Từ vựng' });
      // D: chu lon nhat vua o (xuong 2 dong khi tu dai), khong bao gio tran / cat
      const fk = coVua('D', tu, 'head', { lh: 1.05, mot: true, hf: 1.0, wf: 1.05 });
      lop('D', `<div class="a-pad">${nhan('Từ vựng · ' + String(c.i || nh.i + 1).padStart(2, '0') + ' / ' + String(c.n || nh.n).padStart(2, '0'), E0)}
        <div class="a-giua">${mk(esc(tu), 'head', E1, fk.css + ';text-align:center;white-space:normal', 'a-hd')}</div></div>`, { tre: soLe(0) });
      // B: cach doc (kana) + romaji
      const fd = coVua('B', doc || tu, 'mean', { lh: 1.1, mot: true, hf: 0.62, lines: 2 });
      lop('B', `<div class="a-pad">${nhan('Cách đọc', E0)}<div class="a-giua a-cot a-trai-giua">
        <div>${mk(esc(doc || tu), 'mean', E1, fd.css + ';font-weight:700', 'a-jp')}</div>${v.romaji ? `<div class="a-mt"><span class="a-mk" data-te="1" data-fx="mat" data-tre="${E2}"><span class="a-mk-i a-romaji" data-r="label">${esc(v.romaji)}</span></span></div>` : ''}</div></div>`, { tre: soLe(1) });
      // C: nghia (hien luc Sensei noi nghia — V3 — hoac du phong), loai tu nam o nhan
      const fn = coVua('C', nghiaNgan || nghia, 'mean', { lh: 1.12, cat: true, min: T('body').min });
      lop('C', `<div class="a-pad">${nhan('Nghĩa' + (loai ? ' · ' + loai : ''), E0)}<div class="a-giua a-trai-giua">
        <div>${mkCho(esc(fn.text), 'mean', 'V3', fn.css)}</div></div></div>`, { tre: soLe(2) });
      // E: dai luu y (chi khi tu co accentNote), hien ngay, cue V4 chi dua tieu diem
      if (dat.E) {
        const fe = coVua('E', luuY, 'body', { lh: 1.25, cat: true, hf: 0.9, jpx: 1 });
        lop('E', `<div class="a-pad">${nhan('Lưu ý', E0)}<div class="a-giua a-trai-giua">${mk(jp(fe.text), 'body', E1, fe.css + ';font-weight:700', 'a-luu-y')}</div></div>`, { tre: soLe(3) });
      }
    };
    if (tieuDe) {
      // mo dau: bo cuc tieu de giu toi luc Sensei doc tu (V1) / noi nghia, du phong 3.2 s sau tieng dau; tieu de hien >= 1.6 s
      m.chuyen = () => {
        if (m.daVao) return;
        const con = m.tTieuDe + 3.4 - nowG();
        if (con > 0 && !giam()) { if (!m.henChuyen) m.henChuyen = api.hen(() => { m.henChuyen = null; m.chuyen(); }, con * 1000); return; }
        m.daVao = true; vao();
      };
    } else { m.daVao = true; vao(); }
    m.vocab = { tu, v };
    m.hienNghia = () => {
      if (m.daNghia || !m.daVao) return;
      m.daNghia = true;
      hienCho('C', 'V3', 0);
    };
    if (!tieuDe) m.henNghia = api.hen(m.hienNghia, 2400);
  }
  function cueTuVung(m, id, tt, api) {
    const tre = api.tre(tt);
    if (!m.daVao) {
      if (id === 'V0') { m.henVao = api.hen(() => m.chuyen(), 3200); return; }
      m.chuyen();
      if (!m.daVao) return;
    }
    switch (id) {
      case 'V0': tieuDiem('D', tre, 1.03); break;
      case 'V1': case 'V2': case 'V2b':
        tieuDiem('D', tre, 1.03); nhip('B', tre + 0.12, 1.025);
        if (id === 'V1' && !m.daNghia) { api.huyHen && api.huyHen(m.henNghia); m.henNghia = api.hen(m.hienNghia, 1300 + tre * 1000); }
        break;
      case 'V3':
        m.daNghia = true;
        hienCho('C', 'V3', tre);
        tieuDiem('C', tre);
        break;
      case 'V4': case 'V5':
        if (O.E && O.E.rect) tieuDiem('E', tre, 1.025);
        break;
      default: break;
    }
  }

  // ---- chu Han / chu cai (kana)
  // Chu Han: A (o viet net) | D Han Viet lon + nghia | B On / Kun | C tu ghep (toi da 2) | S. Chu cai (kana): them B "Meo nho", E "De nham" (neu co).
  function dungChuHan(nh, api, m) {
    const d = nh.data || {};
    const ch = String(d.character || '');
    const c = nh.chuong || {};
    const kana = nh.laKana;
    const sosanh = kana ? nganTu(String(d.sosanh || '').trim(), st.dt ? 60 : 80) : '';
    boCuc('kanji', BO.kanji(!!sosanh));
    const dat = st.boCuoi;
    // A: o viet net (luoi + net mo, net ve dan luc K1 / K1b)
    const hpA = hop('A', { nhan: true });
    const lenh = Math.min(hpA.w, hpA.h * 0.92);
    const oA = lop('A', `<div class="a-pad">${nhan((kana ? 'Chữ cái' : 'Chữ Hán') + ' · ' + String(c.i || '').padStart(2, '0') + ' / ' + String(c.n || '').padStart(2, '0'), E0)}</div>
      <div class="a-net-o" style="left:${Math.round((O.A.rect.w - lenh) / 2)}px;top:${Math.round(st.py + st.fl * 1.75 + (hpA.h - lenh) / 2)}px;width:${Math.round(lenh)}px;height:${Math.round(lenh)}px"><div class="a-net-khung"></div><span class="a-net-bong" data-r="head" lang="ja" style="font-size:${Math.round(Math.min(lenh * 0.62, T('head').max, lenh * 0.9 / Math.max(1, kyTu(ch).length)))}px;white-space:nowrap">${esc(ch)}</span></div>`);
    m.netO = oA.querySelector('.a-net-khung');
    m.netBong = oA.querySelector('.a-net-bong');
    m.ch = ch;
    const on = (Array.isArray(d.onyomi) ? d.onyomi : d.onyomi ? [d.onyomi] : []).filter(Boolean);
    const kun = (Array.isArray(d.kunyomi) ? d.kunyomi : d.kunyomi ? [d.kunyomi] : []).filter(Boolean);
    const tenLon = kana ? String(d.romaji || '') : String(d.hanViet || '');
    const nghiaHv = nganTu(st.dt ? String(d.meaningVi || '').split(/[;,]/)[0] : (d.meaningVi || ''), st.dt ? 30 : 64);
    // D: Han Viet / romaji lon + nghia (hien luc K3 hoac du phong)
    const fh = coVua('D', tenLon, 'head', { lh: 1, mot: true, hf: 0.55, max: T('head').max * 0.8 });
    const fn = coVua('D', nghiaHv, 'mean', { lh: 1.15, hf: 0.36, max: T('mean').max * 0.7, cat: true, jpx: 1 });
    lop('D', `<div class="a-pad">${nhan(kana ? 'Cách đọc' : 'Hán Việt', E0)}<div class="a-giua a-cot a-trai-giua">
      <div>${mk(esc(tenLon), 'head', E1, fh.css, 'a-hv')}</div>
      <div class="a-hv-nghia">${mkCho(jp(fn.text), 'mean', 'K3', fn.css)}</div></div></div>`, { tre: soLe(0) });
    if (kana) {
      const meo = nganTu(d.meoNho || '', st.dt ? 70 : 90);
      const fm = coVua('B', meo, 'body', { lh: 1.3, cat: true, jpx: 1 });
      lop('B', `<div class="a-pad">${nhan('Mẹo nhớ', E0)}<div class="a-giua a-trai-giua"><div>${mkCho(jp(fm.text), 'body', 'K4', fm.css)}</div></div></div>`, { tre: soLe(1) });
      if (dat.E) {
        const fe = coVua('E', sosanh, 'body', { lh: 1.3, cat: true, jpx: 1 });
        lop('E', `<div class="a-pad">${nhan('Dễ nhầm', E0)}<div class="a-giua a-trai-giua"><div>${mkCho(jp(fe.text), 'body', 'K5', fe.css)}</div></div></div>`, { tre: soLe(3) });
      }
    } else {
      // On / Kun: toi da 2 am moi dong, chu vua o (khong bao gio ellipsis)
      const bB = hop('B');
      const onS = on.slice(0, 2).join('、'), kunS = kun.slice(0, 2).join('、');
      const dtW = st.fl * 3.2;
      const rong = bB.w - dtW - 12;
      const cao = bB.h / (on.length && kun.length ? 2 : 1) - 6;
      const tkm = T('mean');
      const ff = (s) => (s ? fit(jp(s), { w: rong, h: cao, max: tkm.max * 0.6, min: tkm.min, lh: 1.15, cls: 'a-am-dd', fw: '700', nowrap: true }) : 999);
      const f1 = Math.min(ff(onS), ff(kunS));
      lop('B', `<div class="a-pad">${nhan('Âm đọc', E0)}<div class="a-giua a-trai-giua"><dl class="a-am" data-te="1" style="font-size:${cqw(f1, bB.W)}">
        ${on.length ? `<div class="a-cho" data-cho="K5" data-fx-cho="len"><dt data-r="label">On</dt><dd lang="ja" data-r="mean">${esc(onS)}</dd></div>` : ''}
        ${kun.length ? `<div class="a-cho" data-cho="K6" data-fx-cho="len"><dt data-r="label">Kun</dt><dd lang="ja" data-r="mean">${esc(kunS)}</dd></div>` : ''}</dl></div></div>`, { tre: soLe(1) });
    }
    // C: tu ghep / tu vi du (toi da 2, mot dong moi tu)
    const tu = (Array.isArray(d.commonWords) ? d.commonWords : []).slice(0, 2);
    const vl = (nh.bai && nh.bai.vocabList) || [];
    const bC = hop('C');
    const hLi = bC.h / Math.max(1, tu.length) - st.fl * 0.8;
    const tkb = T('body'), tkm2 = T('mean');
    const imgW = (vv) => (vv ? hLi * 0.55 + st.fl * 0.6 : 0);
    // chu ghep: co lon nhat vua be ngang (ke ca anh) va nua chieu cao hang; nghia xep duoi
    let fTu = tkm2.max * 0.62;
    tu.forEach((w) => {
      const vv = vl.find((x) => x && x.imageUrl && (x.kanji === w.word || x.word === w.word));
      fTu = Math.min(fTu, fit(C.ruby(w.word || '', w.furigana || ''), { w: (bC.w - imgW(vv)) * (st.dt ? 1 : 0.5), h: hLi * (st.dt ? 0.62 : 0.9), max: fTu, min: tkm2.min, lh: 1.3, cls: 'a-r-mean a-ghep-tu', fw: '700', nowrap: true }));
    });
    const fNg = Math.max(tkb.min, Math.min(tkb.max, fTu * 0.62));
    lop('C', `<div class="a-pad">${nhan(kana ? 'Từ ví dụ' : 'Từ ghép', E0)}<div class="a-giua a-trai-giua"><ul class="a-ghep" data-te="1">${tu.map((w, i) => {
      const vv = vl.find((x) => x && x.imageUrl && (x.kanji === w.word || x.word === w.word));
      return `<li class="a-cho" data-cho="K7.${i}" data-fx-cho="len">${vv ? `<img src="${esc(vv.imageUrl)}" alt="" style="width:${Math.round(hLi * 0.55)}px;height:${Math.round(hLi * 0.55)}px">` : ''}<div class="a-ghep-o"><span class="a-ghep-tu" lang="ja" data-r="mean" style="font-size:${cqw(fTu, bC.W)}">${C.ruby(w.word || '', w.furigana || '')}</span><em data-r="body" style="font-size:${cqw(fNg, bC.W)}">${esc(nganTu(w.meaningVi || '', st.dt ? 24 : 30))}</em></div></li>`;
    }).join('')}</ul></div></div>`, { tre: soLe(2) });
    hienHet(['B', 'C', 'E'], 0.35, 0.12);
    m.henNghia = api.hen(() => { hienCho('D', 'K3', 0); }, 2200);
  }
  /** Nhan phu (pill) vua be ngang w (px): thu day du -> bo ngoac -> tu dau; do bang DOM, khong cat ky tu */
  function pillVua(text, w) {
    text = String(text || '').trim();
    if (!text) return '';
    const m = st.mesur;
    const cands = [text, text.replace(/\s*[(（].*$/, '').trim(), (text.replace(/\s*[(（].*$/, '').trim().split(/\s+/)[0] || '')];
    for (const c of cands) {
      if (!c) continue;
      m.className = 'a-mesur a-pill-k';
      m.style.width = 'auto'; m.style.whiteSpace = 'nowrap'; m.style.fontSize = st.fl + 'px'; m.style.lineHeight = '1'; m.style.fontWeight = '700';
      m.innerHTML = esc(c);
      if (m.scrollWidth <= w - 4) return c;
    }
    return '';
  }
  /** Hien ngay (so le) moi dong [data-cho] cua cac o: noi dung nhan dien co san, cue chi dua tieu diem */
  function hienHet(ids, tre, buoc) {
    let k = 0;
    ids.forEach((id) => { const h = O[id]; if (h) h.lops.forEach((l) => l.querySelectorAll('[data-cho]:not([data-da])').forEach((x) => { x.dataset.da = '1'; hieu(x, (tre || 0) + (buoc || 0.12) * k++ + Math.max(0, (h.san || 0) - nowG()), x.dataset.fxCho || 'mat'); })); });
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
    G.fromTo(x, { backgroundColor: 'rgba(201,100,66,0)' }, { backgroundColor: 'rgba(201,100,66,.16)', duration: 0.16, delay: tre, yoyo: true, repeat: 1, repeatDelay: 0.9 });
  }
  function hetChuHan(m) {
    ['B', 'C', 'D', 'E'].forEach((k) => { const h = O[k]; if (h) h.lops.forEach((l) => l.querySelectorAll('[data-cho]:not([data-da])').forEach((x) => { x.dataset.da = '1'; hieu(x, 0, x.dataset.fxCho || 'mat'); })); });
    veNet(m, 0);
  }

  // ---- khoi cong thuc tren ray (mau cau / vi du / hoi thoai)
  /** Be ngang (em) cua html o dang 1 dong: do that bang DOM */
  function emRong(html, cls) {
    const m = st.mesur;
    m.className = 'a-mesur ' + (cls || '');
    m.style.width = 'auto'; m.style.whiteSpace = 'nowrap'; m.style.lineHeight = '1.5'; m.style.fontSize = '100px'; m.style.fontWeight = '700';
    m.innerHTML = html;
    const tk = Array.from(m.querySelectorAll('.a-tk1')).map((e) => e.getBoundingClientRect().width / 100);
    return { em: Math.max(0.5, m.scrollWidth / 100), tok: tk.length ? Math.max(...tk) : 0 };
  }
  /** Gop cac khoi lien ke cho den khi con <= n (gop cap ngan nhat); khoi gop khong con nhan phu */
  function gopKhoi(ds, n) {
    const out = ds.map((x) => Object.assign({}, x));
    while (out.length > n) {
      let bi = 0, bl = 1e9;
      for (let i = 0; i + 1 < out.length; i++) { const l = kyTu(out[i].chu).length + kyTu(out[i + 1].chu).length; if (l < bl) { bl = l; bi = i; } }
      const a = out[bi], b = out[bi + 1];
      const trong = (h) => h.replace(/^<span[^>]*>/, '').replace(/<\/span>$/, '');
      a.html = a.html.replace(/<\/span>$/, trong(b.html) + '</span>');
      a.chu += b.chu; a.toks = (a.toks || []).concat(b.toks || []); a.pill = ''; a.tone = a.tone === 'cam' && b.tone === 'cam' ? 'cam' : null;
      a.gop = (a.gop || 1) + (b.gop || 1);
      out.splice(bi + 1, 1);
    }
    return out;
  }
  /**
   * Dat cac khoi (o K<gen>_<i>) len ray. ds: [{ html, chu, tone ('cam'|null), pill, toks }]. ray: rect thiet ke.
   * Co chu <= token vai (form: cong thuc; sent: cau), chia 1..3 hang can bang, khoi gian ra phu kin ray (toi da 1.9 lan).
   */
  function datKhoi(ds, ray, o) {
    o = o || {};
    const vai = o.vai || 'sent';
    const n = ds.length;
    const rr = px(ray);
    const pad = Math.round(st.px * 0.7);
    const top = rr.y + st.py + st.fl * 1.75;
    const aw = rr.w - 2 * pad;
    const ah = rr.y + rr.h - st.py * 0.8 - top;
    const g = khe();
    const tk = T(vai);
    const coPill = ds.some((d) => d.pill);
    const hPill = coPill ? st.fl * 2.5 : st.fl * 0.4;
    const emR = ds.map((d) => emRong(d.html, 'a-r-' + vai + ' a-k-jp'));
    const emW = emR.map((x) => x.em);
    const cost = (i) => emW[i] + 0.9;
    const chia = (r) => {
      const tot = ds.reduce((a, d, i) => a + cost(i), 0);
      const rows = [[]];
      let acc = 0;
      ds.forEach((d, i) => {
        if (rows[rows.length - 1].length && rows.length < r && acc + cost(i) / 2 > tot * rows.length / r) rows.push([]);
        rows[rows.length - 1].push(i);
        acc += cost(i);
      });
      return rows;
    };
    const hoRuby = ds.some((d) => /<ruby/.test(d.html));
    const lhk = hoRuby ? 1.75 : 1.18;
    const danhGia = (r) => {
      const rows = chia(r);
      const hRow = (ah - g * (rows.length - 1)) / rows.length;
      let f = Math.min(tk.max, Math.max(8, (hRow - hPill) / lhk));
      rows.forEach((ids) => { const w = ids.reduce((a, i) => a + cost(i), 0); const av = aw - g * (ids.length - 1); if (w * f > av) f = av / w; });
      return { rows, hRow, fs: f };
    };
    let best = danhGia(1);
    for (let r = 2; r <= Math.min(3, n); r++) { const c = danhGia(r); if (c.fs > best.fs * 1.12) best = c; }
    const boc = best.fs < tk.min;                          // qua dai: giu co nho nhat; chu trong khoi xuong dong
    let fs = boc ? tk.min : best.fs;
    const hRow = best.hRow;
    if (boc) {
      // khoi xuong dong: ha co chu toi khi moi khoi vua chieu cao hang (ke ca furigana + pill), khong duoi co cung 60 design px
      const san = (st.dt ? TOK_DT[vai][1] : TOK[vai][1] * st.u) * 0.9;
      for (; fs > san; fs -= 1) {
        const ok = best.rows.every((ids) => {
          const av = aw - g * (ids.length - 1);
          const tong = ids.reduce((a, i) => a + cost(i) * fs, 0);
          const k = Math.min(1, av / tong);
          return ids.every((i) => {
            const cw = Math.max(fs, cost(i) * fs * k - 0.9 * fs);
            const dong = Math.ceil(emW[i] * fs / cw);
            return emR[i].tok * fs <= cw + 1 && dong * fs * lhk + 0.2 * fs + hPill <= hRow;
          });
        });
        if (ok) break;
      }
    }
    fs = Math.floor(fs);
    const rects = [];
    best.rows.forEach((ids, hi) => {
      let ws = ids.map((i) => cost(i) * fs);
      const av = aw - g * (ids.length - 1);
      const tong = ws.reduce((a, x) => a + x, 0);
      if (tong > av) ws = ws.map((x) => x * av / tong);
      else ws = ws.map((x) => x * Math.min(av / tong, 1.9));
      const t = ws.reduce((a, x) => a + x, 0) + g * (ids.length - 1);
      let x = rr.x + (rr.w - t) / 2;
      const y = top + hi * (hRow + g);
      ids.forEach((i, k) => { rects[i] = { x, y, w: ws[k], h: hRow }; x += ws[k] + g; });
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
      h.o.classList.toggle('is-wrap', boc);
      h.o.classList.toggle('is-sent', vai === 'sent');
      h.o.style.setProperty('--a-fs', fs + 'px');
      const dich = { x: r.x, y: r.y, w: r.w, h: r.h };
      const tre = (o.tre || 0) + (o.stag || 0) * i;
      if (h.rect && cuIds.includes(id)) {
        thoatNoiDung(h, 0);
        h.htmlKhoi = null;
        if (!giam()) { h.san = nowG() + tre + T_DOI * 0.65; G.to(h.o, { left: dich.x, top: dich.y, width: dich.w, height: dich.h, autoAlpha: 1, scale: 1, duration: T_DOI, ease: 'power4.inOut', delay: tre, overwrite: 'auto' }); }
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
      doiTone(h, d.tone || null, tre, h.lops.length ? 0.55 : 0.001);
      h.pill = d.pill || '';
      if (d.html != null && d.html !== h.htmlKhoi) {
        h.htmlKhoi = d.html;
        const pillH = d.pill ? pillVua(d.pill, r.w - st.fl * 1.6) : '';
        lop(id, `<div class="a-giua-k${pillH ? '' : ' khong-pill'}"><div class="a-noi" data-te="1" data-r="${vai}">${d.html}</div></div>${pillH ? `<div class="a-day-k"><span class="a-pill-k a-cho${d.tone ? ' is-trang' : ''}" data-r="label" data-cho="pill" data-fx-cho="no">${esc(pillH)}</span></div>` : ''}`,
          { tre: h.lops.length ? tre + (o.treNoi || 0) : 0, raY: -16, nhanh: !h.lops.length });
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
    G.to(h.o, { autoAlpha: 0, scale: 0.9, duration: 0.3, ease: 'power2.in', onComplete: () => h.o.remove() });
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
      const ds = ch.phan.map((e) => {
        if (e.loai === 'chu') {
          const j = jc++;
          const doc = DOC_TRO[e.chu];
          return { loai: 'chu', j, chu: e.chu, html: `<span class="a-k-jp" lang="ja">${esc(e.chu)}</span>`, tone: 'cam', pill: doc ? 'đọc: ' + doc : ngan(C.vaiTro(e.chu), 16) };
        }
        const j = jo++;
        let nhanO = String(e.nhan || '').replace(/[\-(（]+$/, '').trim();
        if (!/[A-Za-z0-9぀-ヿ一-鿿]/.test(nhanO)) nhanO = 'N';
        return { loai: 'o', j, chu: nhanO, html: `<span class="a-k-chu">${esc(nhanO)}</span>`, tone: null, pill: e.chu ? ngan(e.chu, 14) : '' };
      });
      return ds;
    }
    // Khong tach duoc: cac cum Nhat trong cong thuc / tieu de thanh khoi
    const cum = String(d.grammarFormula || d.title || '').match(/[぀-ヿ一-鿿々〜ー]+/g) || [];
    return cum.slice(0, 5).map((x, j) => ({ loai: 'chu', j, chu: x, html: `<span class="a-k-jp${j % 2 ? '' : ''}" lang="ja">${esc(x)}</span>`, tone: j % 2 ? null : 'cam', pill: '' }));
  }
  // Trang ngu phap (theo video mau): thanh tieu de | RAY khoi cong thuc LON | anh nho + o loi Sensei (phu de 2 dong).
  // KHONG dat giai thich / luu y / van hoa len trang: Sensei noi, phu de chay theo cau; chi co bo dem "Mau i / n" nho.
  function dungMauCau(nh, api, m) {
    const d = nh.data || {};
    const c = nh.chuong || {};
    let phan = phanCongThuc(nh);
    // chi mot cap 3-4 khoi: gop phan nho de khoi gan nhau; chi so j (cue G2.j / G3.j) tro ve khoi chua phan do
    const map = phan.map((_, i) => i);
    if (phan.length > 4) {
      const gop = gopKhoi(phan.map((p, i) => Object.assign({ i0: i, toks: [i] }, p)), 4);
      gop.forEach((g, k) => (g.toks || []).forEach((i) => { map[i] = k; }));
      phan = gop;
    }
    const dsMau = (nh.ctx.cacNhip || []).filter((b) => b && b.kind === 'grammar-intro');
    const soMau = c.n ? dsMau.length : 0;
    const iMau = dsMau.indexOf(nh.beat) + 1;
    const dat = BO.nguPhap();
    boCuc('nguPhap', dat);
    const tieu = String(d.title || '').replace(/^\d+\.\s*/, '');
    const ten = tieu.split(/:\s*/)[0];
    const bD = hop('D');
    const fte = coVua('D', nganTu(ten, 80), 'mean', { hf: 0.6, wf: st.dt ? 1 : Math.max(0.5, (bD.w - 190) / bD.w), lh: 1.08, max: st.dt ? 22 : 56 * st.u, jpx: 1 });
    lop('D', `<div class="a-pad a-hang"><div class="a-tieu-ngang">${nhan('Ngữ pháp', E0)}<div>${mk(jp(nganTu(ten, 80)), 'mean', E1, fte.css)}</div></div>
      ${soMau && !st.dt ? `<div class="a-tag" data-r="label" data-fx="no" data-tre="${E2}">Mẫu ${iMau} / ${soMau}</div>` : ''}</div>`);
    datAnh('A', anhBai(nh), { tre: 0.1, kb: [1.05, 1.12], thay: '文法', thayPhu: 'Ngữ pháp' });
    boKhoi();
    m.khoi = datKhoi(phan, dat.RAY, { cho: true, cua: 'grammar', sub: nh.beat.subIndex, vai: 'form' });
    m.phan = phan;
    m.mapPhan = map;
    m.daVao = 0;
    lop('RAY', `<div class="a-pad">${nhan('Công thức', E0)}</div>`, { tre: soLe(1) });
    // du phong: cac khoi chua vao ray sau 1.5 s (Sensei noi nhay coc / cue tre) -> vao lan luot, khong de ray trong lau
    m.duPhong = api.hen(() => khoiDuPhong(m, api), st.dt ? 450 : 600);
  }
  function khoiDuPhong(m) {
    let k = 0;
    (m.khoi || []).forEach((id) => { if (khoiVao(id, k * 0.3)) k++; });
  }
  function cueMauCau(m, id, tt, api) {
    const tre = api.tre(tt);
    const phan = m.phan || [];
    const tim = (loai, j) => {
      // chi so phan goc co loai/j -> khoi chua no
      let dem = 0;
      const nh = m.nh && m.nh.congThuc && m.nh.congThuc.phan;
      if (nh) { for (let q = 0; q < nh.length; q++) { const l = nh[q].loai === 'chu' ? 'chu' : 'o'; if (l === loai) { if (dem === j) return m.mapPhan[q]; dem++; } } return -1; }
      return phan.findIndex((p) => p.loai === loai && p.j === j);
    };
    let i = -1;
    let x;
    if ((x = /^G2\.(\d+)$/.exec(id))) i = tim('chu', +x[1]);
    else if ((x = /^G3\.(\d+)$/.exec(id))) i = tim('o', +x[1]);
    else if ((x = /^G2p\.(\d+)$/.exec(id))) i = Math.min(+x[1], (m.khoi || []).length - 1);
    if (id === 'G0') { tieuDiem('D', tre, 1.015); api.hen(() => khoiDuPhong(m, api), 700); return; }
    if (i >= 0 && m.khoi && m.khoi[i]) {
      const kid = m.khoi[i];
      // vao ray dung luc noi toi; khoi dung truoc chua vao (Sensei noi nhay coc) -> vao theo thu tu
      m.khoi.slice(0, i).forEach((k2) => khoiVao(k2, tre));
      if (!khoiVao(kid, tre)) tieuDiem(kid, tre, 1.05);
      else vien(kid, tre + 0.05);
      return;
    }
    if (/^G2c\.\d+$/.test(id)) { const k = tim('chu', +id.split('.')[1]); if (k >= 0 && m.khoi[k]) { pillKhoi(m.khoi[k], tre); nhip(m.khoi[k], tre, 1.06); } return; }
    if (/^G4\.\d+$/.test(id) || id === 'G5' || id === 'G6') {
      khoiDuPhong(m);
      (m.khoi || []).forEach((k2, z) => pillKhoi(k2, 0.08 * z));
    }
  }

  // ---- vi du (ghep cau vao cong thuc)
  function khoiViDu(nh) {
    const d = nh.data || {};
    const toks = d.tokens || [];
    const g = nh.ghep;
    const ch = nh.congThuc;
    const tokHtml = (is) => is.map((i) => `<span class="a-tk1">${C.tok(toks[i], i, toks)}</span>`).join('');
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
        out.push({ html: `<span class="a-k-jp" lang="ja">${tokHtml(is)}</span>`, chu: tokChu(is), tone: laChu ? 'cam' : null, pill: ngan(pill, 16), toks: is });
      });
      (g.duoi || []).forEach((i) => { if (!laDau(toks[i])) out.push({ html: `<span class="a-k-jp" lang="ja"><span class="a-tk1">${C.tok(toks[i], i, toks)}</span></span>`, chu: chuTok(toks[i]), tone: null, pill: '', toks: [i] }); });
    } else {
      toks.forEach((t, i) => {
        if (laDau(t)) return;
        const key = !!t.isKeyGrammar;
        const pill = key ? (DOC_TRO[chuTok(t)] ? 'đọc: ' + DOC_TRO[chuTok(t)] : C.vaiTro(String(t.text || '').trim())) : C.nghiaTu(t, nh.bai);
        out.push({ key, html: `<span class="a-k-jp" lang="ja"><span class="a-tk1">${C.tok(t, i, toks)}</span></span>`, chu: chuTok(t), tone: key ? 'cam' : null, pill: ngan(pill, 16), toks: [i] });
      });
    }
    // dau cau gan vao khoi truoc (khong bo token nao); toi da 4 khoi: gop cap ngan nhat (khong bo token nao)
    return out.length > 4 ? gopKhoi(out, 4) : out;
  }
  /** O B cua vi du / hoi thoai: cau nghia (hien theo cue khoa), co chu theo hop that — chi MOT phan tu chu */
  function bNghia(nghia, khoa) {
    const fn = coVua('B', String(nghia || ''), 'mean', { lh: 1.15, cat: true, min: T('body').min, jpx: 1 });
    return `<div class="a-pad">${nhan('Nghĩa', E0)}<div class="a-giua a-trai-giua"><div class="a-nghia-cau-o">${mkCho(jp(fn.text), 'mean', khoa, fn.css)}</div></div></div>`;
  }
  function dungViDu(nh, api, m) {
    const d = nh.data || {};
    const toks = d.tokens || [];
    boCuc('vidu', BO.viDu());
    const ds = khoiViDu(nh);
    m.ds = ds;
    const ray = BO.viDu().RAY;
    const cung = st.khoi && st.khoi.cua && st.khoi.sub === nh.beat.subIndex;
    lop('RAY', `<div class="a-pad">${nhan('Ví dụ', E0)}</div>`);
    if (!cung) boKhoi();
    m.khoi = datKhoi(ds.map((x) => Object.assign({}, x)), ray, { giu: cung, cua: 'example', sub: nh.beat.subIndex, treNoi: 0, stag: cung ? 0.02 : 0.12, vai: 'sent' });
    // anh: tu vung trung token, khong co thi tranh canh bai
    const url = C.anhCau(toks, nh.bai) || anhBai(nh);
    datAnh('A', url, { tre: 0.2, pos: '50% 35%', thay: '例文', thayPhu: 'Ví dụ' });
    // B: nghia cau (hien luc E5), co chu vua o
    lop('B', bNghia(d.meaningVi, 'E5'), { tre: soLe(2) });
    m.tokKhoi = {};
    ds.forEach((x, k) => (x.toks || []).forEach((i) => { m.tokKhoi[i] = k; }));
    m.henNghia = api.hen(() => hienCho('B', 'E5', 0), 2200);     // du phong: khong de o nghia trong qua ~3 s
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
    (ds || []).forEach((l) => { if (!l) return; const t = tachTen(l.speaker); if (!out.find((x) => x.jp === t.jp)) out.push(Object.assign({ anh: l.avatarUrl || '', nv: tuNhanVat(l.avatarUrl) }, t)); });
    return out;
  }
  /** Mot o chan dung: anh phu kin o + nhan ten; avatar-noi gan len <img> (chi nguoi noi dong) */
  function pHtml(v) {
    const ten = `<div class="a-vai-ten" data-r="label" data-fx="len" data-tre="${E2}"><span lang="ja">${esc(v.jp)}</span>${v.la && !st.dt ? `<em>${esc(v.la)}</em>` : ''}</div>`;
    if (!v.anh) return `<div class="a-anh-lop"><span class="a-vai-chu" lang="ja" style="font-size:${Math.round(st.fl * 4)}px">${esc(kyTu(v.jp)[0] || '?')}</span>${ten}</div>`;
    return `<div class="a-anh-lop"><img class="a-vai-anh" src="${esc(v.anh)}" alt="" data-nv="${esc(v.nv)}" style="object-position:50% 22%" decoding="async" draggable="false">${ten}</div>`;
  }
  function dungKaiwaIntro(nh, api, m) {
    const lan = nh.kind === 'kaiwa-run';
    const ds = Array.isArray(nh.data) ? nh.data : [];
    const vai = vaiCua(ds).slice(0, 4);
    boCuc(lan ? 'kaiwaRun' : 'kaiwaIntro', BO.kaiwaIntro(vai.length, lan), { stag: 0.04 });
    if (!lan) datAnh('A', anhBai(nh), { tre: 0.05, kb: [1.08, 1.0], thay: '会話', thayPhu: 'Hội thoại' });
    m.vai = vai;
    m.ds = ds;
    m.luot = -1;
    if (lan) dLuotThoai(0, ds.length, ds[0], true, 0, m);
    else dKaiwaTieuDe(nh, vai, ds, 0);
    vai.forEach((v, p) => {
      const h = o_('P' + p);
      let el = h.lops[0];
      if (h.pk === v.anh && el && el.isConnected && !lan === !h.pLan) { /* cung nhan vat, cung khung: giu nguyen (khong ve lai) */ }
      else { el = lop('P' + p, pHtml(v), { tre: 0.1 + p * 0.1, iris: !giam() }); h.pk = v.anh; }
      h.pLan = lan;
      if (!lan) ganAvatar(m, el, { nhanVat: v.nv });          // nghe tron doan: gan theo TUNG CAU (dongThoaiRun), chi nguoi dang noi dong
    });
  }
  /** O D cua hoi thoai: tieu de (Boi canh) + so nhan vat, luc dau */
  function dKaiwaTieuDe(nh, vai, ds, tre) {
    const bD = hop('D');
    const ten = 'Bối cảnh';
    const f = coVua('D', ten, 'mean', { mot: true, hf: 0.4, lh: 1.1 });
    const f2 = coVua('D', `${vai.length} nhân vật · ${ds.length} lượt thoại`, 'body', { mot: true, hf: 0.2 });
    lop('D', `<div class="a-pad">${nhan('Hội thoại', E0)}<div class="a-giua a-cuoi"><div>${mk(ten, 'mean', E1, f.css)}</div>
      <div class="a-mt" data-r="body" data-te="1" data-fx="len" data-tre="${E2}" style="${f2.css}">${vai.length} nhân vật · ${ds.length} lượt thoại</div></div></div>`, { tre });
    void bD;
  }
  /** O D cua hoi thoai: mot luot thoai (chu Nhat co ruby + nghia), chu vua o. chay: boc token de to mau karaoke */
  function dLuotThoai(i, n, line, chay, tre, m) {
    if (m) { if (m.luot === i) return; m.luot = i; }   // cung luot thoai thi khong ve lai (khong nhap nhay)
    if (!line) return;
    const toks = line.tokens || [];
    const html = toks.map((tk, k, a) => `<span class="a-tok" data-i="${k}">${C.tok(tk, k, a)}</span>`).join('');
    const nghia = nganTu(line.meaningVi || '', 140);
    const f1 = coVua('D', '', 'sent', { html, hf: 0.6, lh: 1.6, cls: 'a-dong-thoai' });
    const f2 = coVua('D', nghia, 'body', { hf: 0.3, lh: 1.25, cat: true });
    lop('D', `<div class="a-pad">${nhan('Lượt ' + (i + 1) + ' / ' + n, E0)}<div class="a-giua a-cuoi"><div class="a-dong-thoai" data-te="1" data-r="sent" lang="ja" style="${f1.css}" data-fx="mat" data-tre="${E1}">${html}</div>
      <div class="a-mt" data-r="body" data-te="1" style="${f2.css}" data-fx="len" data-tre="${E3}">${esc(f2.text)}</div></div></div>`, { tre: tre || 0 });
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
      }
    }
  }
  function dongThoaiRun(m, line, i, api) {
    if (!line) return;
    const t = tachTen(line.speaker);
    const p = (m.vai || []).findIndex((v) => v.jp === t.jp);
    (m.vai || []).forEach((v, q) => { if (q === p) { vien('P' + q, 0, 'var(--a-cam)', true); nhip('P' + q, 0, 1.04); } else boVien('P' + q); });
    // chan dung nguoi noi: gan lai theo id cau thoai (avatar-noi chon theo lineId truoc, nhanVat sau); cau truoc go ra
    const imgP = p >= 0 && O['P' + p] && O['P' + p].lops[0] && O['P' + p].lops[0].querySelector('img.a-vai-anh');
    const AV = window.SenseiAvatarNoi;
    if (imgP && AV && AV.gan) {
      m.avtP = m.avtP || {};
      if (m.avtP[p]) { try { m.avtP[p].go(); } catch (e) {} }
      try { m.avtP[p] = AV.gan(imgP, { lineId: line.id, nhanVat: tuNhanVat(line.avatarUrl) }); st.avt.push(m.avtP[p]); } catch (e) { m.avtP[p] = null; }
    }
    if (O.D) dLuotThoai(i, (m.ds || []).length, line, true, 0, m);
    void api;
  }
  function dungKaiwa(nh, api, m) {
    const l = nh.data || {};
    const toks = l.tokens || [];
    const t = tachTen(l.speaker);
    boCuc('kaiwa', BO.kaiwa());
    const ten = `<div class="a-vai-ten" data-r="label" data-fx="len" data-tre="${E2}"><span lang="ja">${esc(t.jp)}</span>${t.la && !st.dt ? `<em>${esc(t.la)}</em>` : ''}</div>`;
    const html = l.avatarUrl
      ? `<div class="a-anh-lop"><img class="a-vai-anh" src="${esc(l.avatarUrl)}" alt="" data-nv="${esc(tuNhanVat(l.avatarUrl))}" data-line="${esc(l.id || '')}" style="object-position:50% 22%" decoding="async" draggable="false">${ten}</div>`
      : anhHtml(anhBai(nh), { pos: '50% 30%', them: ten });
    const elA = datAnh('A', l.avatarUrl || anhBai(nh), { tre: 0.05, pos: '50% 22%', them: ten });
    // thay <img> bang <img.a-vai-anh> co thuoc tinh cho avatar-noi (datAnh dung anh thuong)
    const img = elA && elA.querySelector('img');
    if (img && l.avatarUrl) { img.classList.add('a-vai-anh'); img.dataset.nv = tuNhanVat(l.avatarUrl); img.dataset.line = l.id || ''; ganAvatar(m, elA, { nhanVat: tuNhanVat(l.avatarUrl), lineId: l.id }); }
    void html;
    const ds = khoiViDu({ data: { tokens: toks }, ghep: { ghep: null, kieu: 'DIAGRAM' }, congThuc: null, bai: nh.bai });
    m.ds = ds;
    m.tokKhoi = {};
    ds.forEach((x, k) => (x.toks || []).forEach((i) => { m.tokKhoi[i] = k; }));
    lop('RAY', `<div class="a-pad">${nhan('Câu ' + ((nh.chuong && nh.chuong.i) || ''), E0)}</div>`);
    boKhoi();
    m.khoi = datKhoi(ds, BO.kaiwa().RAY, { cua: 'kaiwa', stag: 0.12, vai: 'sent' });
    lop('B', bNghia(l.meaningVi, 'F4'), { tre: soLe(2) });
    m.henNghia = api.hen(() => hienCho('B', 'F4', 0), 2200);
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
    // dap an dai -> mot cot (moi dap an mot hang rong)
    const mot = opts.some((o) => kyTu(tachNgoac(o)[0]).length > (st.dt ? 12 : 20));
    boCuc('quiz', BO.quiz(false, mot));
    const c = nh.chuong || {};
    const url = C.anhCau(String(goc).match(/[぀-ヿ一-鿿々ー]+/g) ? (String(goc).match(/[぀-ヿ一-鿿々ー]+/g) || []).map((x) => ({ text: x, kanji: x })) : [], nh.bai) || anhBai(nh);
    datAnh('A', url, { tre: 0.2, kb: [1.0, 1.05], thay: '練習', thayPhu: 'Luyện tập' });
    const coJp = RE_JP.test(goc);
    const cauHtml = esc(goc).replace(/_{2,}|＿{2,}/, '<span class="a-o-trong"><span class="a-o-dap"></span></span>');
    const fq = coVua('F', '', coJp ? 'sent' : 'mean', { html: cauHtml, hf: yc ? 0.66 : 0.9, lh: 1.25, cls: 'a-cau' + (coJp ? '' : ' is-vn') });
    lop('F', `<div class="a-pad">${nhan('Luyện tập · Câu ' + (c.i || ''), E0)}<div class="a-giua a-cot">
      <div class="a-cau${coJp ? '' : ' is-vn'}" data-te="1" data-r="${coJp ? 'sent' : 'mean'}"${coJp ? ' lang="ja"' : ''} data-fx="len" data-tre="${E1}" style="${fq.css}">${cauHtml}</div>
      ${yc ? `<div class="a-yc" data-te="1" data-r="body" data-fx="len" data-tre="${E2}">${esc(nganTu(yc, 60))}</div>` : ''}</div></div>`);
    m.opts = opts;
    m.oIds = [];
    opts.forEach((o, i) => {
      const id = 'O' + (i + 1);
      m.oIds.push(id);
      const [p0, r] = tachNgoac(o);
      const p = nganTu(p0, mot ? 90 : 60);
      const r0 = BO.oQuiz(i, mot);
      canh({ [id]: Object.assign({}, r0, { tre: 0.3 + i * 0.08 }) }, { tone: null });
      const rr = O[id].rect;
      const chuW = st.fl * 2.2 + 12;
      const rW = r && kyTu(p).length <= 4 ? st.fl * 3.2 : 0;
      const meoW = st.meo && rr.y + rr.h > st.meo.y ? Math.max(0, rr.x + rr.w - st.meo.x + 12) : 0;   // chua goc meo that
      const tk = T('mean');
      const boxO = { w: rr.w - 2 * st.px - chuW - rW - meoW, h: rr.h - 2 * st.py, max: tk.max, min: tk.min, lh: 1.15, cls: 'a-r-mean a-o-p', lines: mot ? 2 : 3 };
      let pT = p, fo = 0;
      for (let kk = 0; kk < 10; kk++) { fo = fit(RE_JP.test(pT) ? jp(pT) : esc(pT), Object.assign({ strict: true }, boxO)); if (fo || kyTu(pT).length < 8) break; pT = nganTu(pT, Math.floor(kyTu(pT).length * 0.8)); }
      if (!fo) fo = Math.floor(tk.min);
      lop(id, `<div class="a-pad a-hang-o"${meoW ? ` style="padding-right:${Math.round(meoW + 12)}px"` : ''}><span class="a-o-chu" data-r="label">${'ABCD'[i]}</span><span class="a-o-p" data-te="1" data-r="mean"${RE_JP.test(p) ? ' lang="ja"' : ''} style="font-size:${cqw(fo, rr.w)}">${esc(pT)}</span>${rW ? `<span class="a-o-r" data-r="label">${esc(r)}</span>` : ''}</div>`, { tre: 0.3 + i * 0.08 });
    });
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
    const el = lop('F', `<div class="a-pad a-bt">${nhan('Đến lượt bạn', E0)}<div class="a-bt-o"></div></div>`, { cls: 'a-lop-bt', nhanh: true });
    m.slot = el.querySelector('.a-bt-o');
    // co chu cua the that: cau hoi (sent) / dap an (mean) theo hop o
    const q = (m.nh && m.nh.data) || {};
    const hp = hop('F');
    const tkS = T('sent'), tkM = T('mean');
    const qh = String(q.question || '');
    const fq = fit(esc(qh), { w: hp.w, h: hp.h * 0.27, max: tkS.max * 0.5, min: Math.max(st.dt ? 15 : 24, tkM.min * 0.8), lh: 1.25, cls: 'a-jp-f', fw: '700', lines: 2 });
    const ol = (q.options || []).reduce((a, b) => (kyTu(b).length > kyTu(a).length ? b : a), '');
    const mot = (q.options || []).some((o) => kyTu(tachNgoac(o)[0]).length > (st.dt ? 12 : 20));
    const fo = fit(esc(ol), { w: (hp.w - (mot ? 0 : khe())) / (mot ? 1 : 2) - st.fl * 4, h: hp.h * 0.16, max: tkM.max * 0.45, min: Math.max(st.dt ? 14 : 20, tkM.min * 0.7), lh: 1.15, cls: 'a-jp-f', fw: '800', lines: 2 });
    m.slot.classList.toggle('is-mot', mot);
    m.slot.style.setProperty('--a-cmc', meoChong(O.F.rect, 'F') + 'px');
    m.slot.style.setProperty('--a-fq', fq + 'px');
    m.slot.style.setProperty('--a-fo', fo + 'px');
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
        l.insertAdjacentHTML('beforeend', `<div class="a-dau-kq ${dung ? 'is-dung' : 'is-sai'}"><b>${dung ? '✓' : '✕'}</b><span data-te="1" data-r="label">${dung ? 'Chính xác!' : 'Chưa đúng'}</span></div>`);
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
    capDat('');
    boKhoi();
    boCuc('chuong', BO.chuong(), { stag: 0.03 });
    const ds = info.ds || [];
    const ch = info.chuong;
    let muc = [];
    let anh = null;
    if (ch === 'vocab') { muc = ds.filter((b) => b.kind === 'vocab').map((b) => b.data && (b.data.kanji || b.data.word)); anh = (ds.find((b) => b.data && b.data.imageUrl) || {}).data; anh = anh && anh.imageUrl; }
    else if (ch === 'kanji') muc = ds.filter((b) => b.kind === 'kanji').map((b) => b.data && b.data.character);
    else if (ch === 'grammar') muc = ds.filter((b) => b.kind === 'grammar-intro').map((b) => { const t = String((b.data && b.data.title) || ''); return t.split(/:\s*/).slice(1).join(': ') || t; });
    else if (ch === 'kaiwa') muc = vaiCua(ds.filter((b) => b.kind === 'kaiwa').map((b) => b.data)).map((v) => v.jp);
    else if (ch === 'quiz') muc = ds.filter((b) => b.kind === 'quiz').map((b, i) => 'Câu ' + (i + 1));
    const bai = (st.nhip && st.nhip.bai) || null;
    datAnh('A', anh || (bai && bai.sceneImageUrl) || null, { tre: 0.1, kb: [1.08, 1.0], thay: ({ vocab: '単語', kanji: '漢字', grammar: '文法', kaiwa: '会話', quiz: '練習' })[ch] || '学', thayPhu: info.tenMoi });
    const ft = coVua('D', info.tenMoi || '', 'head', { max: T('head').max * 0.5, mot: true, hf: 0.5, lh: 1 });
    lop('D', `<div class="a-vong v1"></div><div class="a-vong v2"></div><div class="a-pad">${info.tenCu ? nhan('Xong ' + info.tenCu + ' ✓', E0) : nhan('Phần tiếp theo', E0)}
      <div class="a-giua a-trai"><div>${mk(esc(info.tenMoi || ''), 'head', E1, ft.css + ';font-weight:800')}</div>${info.meta ? `<div class="a-mt" data-r="body" data-te="1" data-fx="len" data-tre="${E2}" style="font-size:${T('body').max}px">${esc(info.meta)}</div>` : ''}</div></div></div>`, { tre: soLe(1) });
    const toi = st.dt ? 8 : 14;
    const bB = hop('B');
    lop('B', `<div class="a-pad">${nhan('Trong phần này', E0)}<div class="a-chips" data-te="1">${muc.filter(Boolean).slice(0, toi).map((x, i) => `<span class="a-chip" data-r="label"${RE_JP.test(x) ? ' lang="ja"' : ''} data-fx="no" data-tre="${(E1 + i * 0.05).toFixed(2)}">${esc(ngan(x, 18))}</span>`).join('')}${muc.length > toi ? `<span class="a-chip is-them" data-r="label">+${muc.length - toi}</span>` : ''}</div></div>`, { tre: soLe(2) });
    void bB;
    st.tuChuong = [];
    datS(false);
    const loiC = 'Tiếp theo: ' + (info.tenMoi || '') + (info.meta ? ' · ' + info.meta : '');
    if (giam()) datLoi(loiC); else api.hen(() => datLoi(loiC), 1100);
    void api;
    return true;
  }
  // ---- the ket bai
  function veTheXong(info, api) {
    capDat('');
    boKhoi();
    const bai = (st.nhip && st.nhip.bai) || {};
    const tu = (bai.vocabList || []).filter((v) => v && v.imageUrl).slice(0, 3);
    boCuc('xong', BO.xong(), { stag: 0.04 });
    ['R1', 'R2', 'R3'].forEach((id, i) => {
      const v = tu[i];
      if (!v) { lop(id, `<div class="a-pad">${nhan('Tổng kết')}</div>`); return; }
      const rc = O[id].rect;
      const tuH = String(v.kanji || v.word || '');
      const nghiaH = boNgoacCuoi(v.meaningVi).split(/[,;/]/)[0].trim();
      const tkS = T('mean');
      const fkj = fit(esc(tuH), { w: rc.w - st.px * 2 - st.fl * 3, h: rc.h * 0.2, max: tkS.max * 0.9, min: tkS.min, lh: 1.1, cls: 'a-r-head a-the-kj', nowrap: true });
      const fng = fit(esc(nghiaH), { w: rc.w - st.px * 2, h: rc.h * 0.12, max: T('body').max, min: T('body').min, lh: 1.15, cls: 'a-r-body a-the-ng' });
      lop(id, `<div class="a-the"><div class="a-the-anh"><img src="${esc(v.imageUrl)}" alt=""></div><div class="a-the-chu"><span class="a-the-so" data-r="label">0${i + 1}</span><span class="a-the-kj" data-te="1" data-r="mean" lang="ja" data-fx="len" data-tre="${(E1 + i * 0.08).toFixed(2)}" style="font-size:${cqw(fkj, rc.w)}">${esc(tuH)}</span><span class="a-the-ng" data-r="body" data-fx="len" data-tre="${(E2 + i * 0.08).toFixed(2)}" style="font-size:${cqw(fng, rc.w)}">${esc(nghiaH)}</span></div></div>`, { tre: 0.05 * i });
    });
    const hang = (info.hang || []).slice(0, 6);
    const rc4 = O.R4.rect;
    const hp4 = hop('R4');
    const cot = st.dt ? 2 : 3, hangSo = Math.ceil(hang.length / cot);
    const hCell = hp4.h / Math.max(1, hangSo);
    const tkm = T('mean'), tkb = T('body');
    const colW = (hp4.w - khe() * (cot - 1)) / cot;
    const dai = Math.max(4, ...hang.map((h) => kyTu(h.so).length + (h.cham ? 3 : 0)));
    const fGia = Math.max(tkm.min * 0.8, Math.min(tkm.max * 0.85, hCell * 0.5, colW / (dai * 0.62)));
    const fNhan = Math.max(tkb.min, Math.min(tkb.max, hCell * 0.3));
    lop('R4', `<div class="a-pad">${nhan('Hôm nay mình đã học', E0)}<div class="a-tk" data-te="1" style="grid-template-columns:repeat(${cot}, 1fr)">${hang.map((h, i) => `<div class="a-tk-o" data-fx="len" data-tre="${(E1 + i * 0.07).toFixed(2)}"><span class="a-tk-nhan" data-r="body" style="font-size:${cqw(fNhan, rc4.w)}">${esc(h.nhan)}</span><b data-r="mean" style="font-size:${cqw(fGia, rc4.w)}">${esc(h.so)}</b>${h.cham ? `<span class="a-tk-cham">${h.cham.map((k) => `<i class="${k || ''}"></i>`).join('')}</span>` : ''}</div>`).join('')}</div></div>`);
    datS(true);
    if (giam()) datLoi('Hẹn gặp lại ở bài sau nhé!'); else api.hen(() => datLoi('Hẹn gặp lại ở bài sau nhé!'), 1100);
    if (st.sMatane) {
      const rs = O.S.rect;
      st.sMatane.style.fontSize = Math.round(Math.max(T('mean').min, Math.min(T('mean').max, rs.h * 0.2))) + 'px';
      G.fromTo(st.sMatane, { autoAlpha: 0, scale: 0.55 }, { autoAlpha: 1, scale: 1, duration: D(0.7), ease: 'back.out(1.9)', delay: 1.1 });
    }
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
      st.bo = ''; st.khoi = null; st.tuChuong = []; st.loiCau = ''; st.cap = capMoi(); st.avt = [];
      L.classList.add('a-nen');
      L.insertAdjacentHTML('afterbegin', '<div class="a-cham" aria-hidden="true"></div><div class="a-mesur" aria-hidden="true"></div>');
      st.mesur = L.querySelector('.a-mesur');
      doKhung();
      taoS();
    },
    ketThuc() {
      if (G) { try { G.killTweensOf(L ? L.querySelectorAll('*') : []); } catch (e) {} }
      (st.avt || []).forEach((ct) => { try { ct.go(); } catch (e) {} });
      st.avt = [];
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
      if (kieu !== 'chuan-bi' && !st.loiCau && st.sDong.querySelector('.a-ba-cham')) { G.to(st.sDong, { autoAlpha: 0, duration: D(0.12), onComplete: () => { if (!st.loiCau) st.sDong.innerHTML = ''; } }); return; }
      if (kieu === 'chuan-bi' && !st.loiCau) { st.sDong.dataset.cau = ''; capXep(); st.sDong.innerHTML = `<span class="a-ba-cham"><i></i><i></i><i></i></span>`; G.set(st.sDong, { autoAlpha: 1, y: 0 }); }
    },
    dungNhip(nh, api) {
      const f = DUNG[nh.kind];
      if (!f || !L) return null;
      doKhung();
      if (st.m && st.m.slot) st.m.slot = null;
      st.nhip = nh;
      st.nhanhVao = !!(nh.laBatDau && !(nh.i === 0 && !nh.isResume && nh.kind === 'vocab'));   // san khau vua mo giua bai: noi dung vao ngay, it so le
      const m = {
        nh,
        cue(id, tt) { const g = CUE[nh.kind]; if (g) g(m, id, tt, api, nh); },
        karaoke(ds, o) {
          if (nh.kind === 'example' || nh.kind === 'kaiwa') karaokeKhoi(m, ds, api);
          else if (nh.kind === 'kaiwa-run' && O.D) {
            const l = O.D.lops[0];
            const now = api.bayGio();
            ds.forEach((x) => { const e = l && l.querySelector(`.a-tok[data-i="${x.i}"]`); if (e) G.fromTo(e, { boxShadow: 'inset 0 -0.14em 0 rgba(255,255,255,0)' }, { boxShadow: 'inset 0 -0.14em 0 rgba(255,255,255,1)', duration: 0.14, delay: Math.max(0, x.T - api.LEAD - now), yoyo: true, repeat: 1, repeatDelay: 0.3 }); });
          }
          void o;
        },
        loi(doan, raw) { m.raw = raw; capNhan(raw, api); },
        // ghi(text): Sensei ghi bang — mode A khong ve them (noi dung da co tren cac o, tranh lap chu)
        dongThoai(line, i) { if (nh.kind === 'kaiwa-run') dongThoaiRun(m, line, i, api); },
        het() {
          if (m.raw) capXa(m.raw, api);
          if (nh.kind === 'kanji') hetChuHan(m);
          if (nh.kind === 'grammar-intro') { khoiDuPhong(m); (m.khoi || []).forEach((k) => pillKhoi(k, 0)); }
          ['B', 'C', 'E', 'F'].forEach((k) => { const h = O[k]; if (h) h.lops.forEach((l) => l.querySelectorAll('[data-cho]:not([data-da])').forEach((x) => { x.dataset.da = '1'; hieu(x, 0, x.dataset.fxCho || 'mat'); })); });
          if (m.chuyen && !m.daVao) { m.tTieuDe = -9; m.chuyen(); }
        },
        oBaiTap() { return nh.kind === 'quiz' ? oBaiTapQuiz(m) : null; },
        traLoi(exId, dung) { if (nh.kind === 'quiz') traLoiQuiz(m, exId, dung); },
        raCho() {},
        roi() { goAvatar(m); if (st.m === m) st.m = null; },
      };
      st.m = m;
      if (window.__aDebug) window.__aM = m;      // DEBUG tam thoi
      datS(false);
      capDat('');
      st.cap = capMoi();
      // Nhip dau buoi giang (bai moi): bo cuc tieu de truoc (Sensei chao, gioi thieu bai)
      if (nh.laBatDau && !nh.isResume && nh.i === 0 && nh.kind === 'vocab' && nh.bai) dungTieuDe(nh, api, m);
      if (nh.kind !== 'example' && nh.kind !== 'grammar-intro' && nh.kind !== 'kaiwa') boKhoi();
      f(nh, api, m);
      datTien(nh);
      return m;
    },
    theChuong(info, api) { return L ? veTheChuong(info, api) : false; },
    theXong(info, api) { return L ? veTheXong(info, api) : false; },
  });
})();
