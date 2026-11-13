/* ==========================================================================
   Che do san khau giang (window.SenseiCheDo) — so dang ky + bo nap + nut chon "Chế độ" tren thanh tren.
   Khong con phong cach theo bai (N5 bai 1-7) va khong con phong cach cu nao: lua chon cua nguoi hoc ap cho
   MOI bai, luu localStorage 'sensei_che_do'.
   ?phongCach=<id> (hoac ?cheDo=<id>) ghi de khi kiem thu (khong luu); chi nhan 'mac-dinh' va cac id trong DS (a..j, s).
   Gia tri da luu khong nam trong danh muc (id cu tu ban truoc, hong) = "Mặc định". Huong dan viet che do moi: HUONG-DAN.md.

   Hai loai muc:
     - 'mac-dinh'  : san khau mac dinh cua dao dien (js/motion.js), khong nap gi them.
     - 'b'..'s'    : CHE DO MOI — js/che-do/<id>.js + css/che-do/<id>.css, dang ky SenseiCheDo.dangKy(def).
                     Che do chiem ca san khau (lop .cd-lop), dao dien chuyen tiep su kien nhip (motion.js).
   Doi lua chon luc DANG GIANG: chi ap o ranh gioi nhip ke tiep (dao dien goi nhipMoi); san khau tat: ap ngay.

   API:
     SenseiCheDo.DS                 danh muc [{ id, ten, nhom: 'goc'|'moi', mau: [nen, nhan] }]
     SenseiCheDo.dangKy(def)        che do tu dang ky (xem HUONG-DAN.md)
     SenseiCheDo.chon(id)           nguoi hoc chon (luu, nap tep) -> Promise<boolean>
     SenseiCheDo.muon() / hienTai() id dang chon / id dang ap tren san khau
     SenseiCheDo.napThuVien(ten)    'gsap' | 'CustomEase' | 'SplitText' | 'Flip' | 'DrawSVGPlugin' -> Promise<boolean>
     SenseiCheDo.nap(id)            nap truoc tep cua mot muc -> Promise<boolean>
     SenseiCheDo.nhipMoi(san)       (dao dien) ranh gioi nhip: ap lua chon dang cho; tra def che do moi | null
     SenseiCheDo.apDung()           (app.js) nap tep cua lua chon hien tai truoc nhip dau -> Promise<id | null>
   ========================================================================== */
(function () {
  'use strict';

  // ---- Tailwind (vendor/tailwind.js, ban Play CDN): sau MOI dot doi DOM / lop no quet lai moi phan tu [class] cua trang, va gap ten lop moi
  // thi chay lai ca duong ong sinh CSS roi ghi lai <style> -> trinh duyet tinh lai style CA TRANG (do: perf.mjs + trace, ~12 lan / 45 s giang,
  // moi lan 50-250 ms tren may yeu; ngat quan sat cua no luc giang: tac vu dai giam 30-45 %). San khau giang (#sanKhauGiang, gom lop che do)
  // chi dung lop tu viet (giao cua ten lop san khau voi CSS Tailwind da sinh = rong, do tren N5-1 o ca hai che do), nen loai no khoi lan quet
  // [class] cua Tailwind; phan con lai cua trang (thanh, luoi bai, thong bao) van duoc quet nhu cu. Chi tac dong len querySelectorAll('[class]') cua document.
  try {
    const qsGoc = Document.prototype.querySelectorAll;
    Document.prototype.querySelectorAll = function (s) {
      const r = qsGoc.apply(this, arguments);
      if (s !== '[class]' || this !== document) return r;
      const san = document.getElementById('sanKhauGiang');
      return san ? Array.prototype.filter.call(r, (e) => !san.contains(e)) : r;
    };
  } catch (e) { /* khong chan viec nap che do */ }

  // ---- CHE DO NHE (window.SenseiLite, <html class="lite">): may yeu / man dpi cao cpu nho tu bo cac hieu ung ton kem (bong do, DPR cao cua meo va lop nen,
  // hat bui, do chu chinh xac toi tung px...) — KHONG doi bo cuc / noi dung. Tren may khoe khong doi gi.
  //   ?lite=1 / ?lite=0 ep bat / tat (khong do tu dong). Mac dinh: (1) goi y thiet bi luc tai trang (deviceMemory <= 2, hardwareConcurrency <= 2,
  //   hoac dpr >= 2.5 ma cpu <= 4 nhan) bat ngay; (2) khong thi do CHI PHI MOI KHUNG cua luong chinh trong luc giang: tu rAF den tac vu ke tiep
  //   (MessageChannel) = thoi gian render + cac tac vu chen vao khung (khong phu thuoc tan so quet man hinh: man 30 Hz khong bi coi la cham).
  //   Do tren harness: cpu x1 p75 0,8-2,4 ms; cpu x4 mac dinh 5,9 / bang den 12,4 / giay cat 17,2 ms. p75 cua 4 s gan nhat > 7 ms, 3 lan lien tiep
  //   (moi giay mot lan, bo 3 s dau cua buoi giang) -> bat; hoac khung hinh tre (p95 khoang cach rAF > 28 ms) kem p75 chi phi > 4 ms.
  //   Da bat thi giu den khi tai lai trang (khong nhap nhay). Chan doan: window.SenseiLite.stats(), window.__motion.lite.
  const LITE = (() => {
    const L = { on: false, lyDo: '', ep: null, batLuc: 0, p95: 0, p75: 0, mau: 0, lienTiep: 0, vong: false };
    try { const v = new URLSearchParams(location.search).get('lite'); if (v === '1' || v === 'true') L.ep = true; else if (v === '0' || v === 'false') L.ep = false; } catch (e) { /* bo qua */ }
    const bat = (lyDo) => {
      if (L.on) return;
      L.on = true; L.lyDo = lyDo; L.batLuc = Math.round(performance.now());
      try { document.documentElement.classList.add('lite'); } catch (e) { /* bo qua */ }
      try { window.dispatchEvent(new CustomEvent('sensei-lite', { detail: { lyDo } })); } catch (e) { /* bo qua */ }
    };
    const NGUONG_CHI_PHI_MS = 7, NGUONG_TRE_MS = 28, NGUONG_CHI_PHI_PHU_MS = 4, CUA_SO_MS = 4000, BO_QUA_DAU_MS = 3000, LAN_LIEN_TIEP = 3;
    const dangGiangNay = () => !!(document.body && document.body.classList.contains('dang-giang')) && !document.hidden;
    // vong rAF chi chay luc dang giang (ngoai ra khong ton gi); tu dung khi het giang / da bat nhe
    function vongDo() {
      if (L.vong || L.on) return;
      L.vong = true;
      const ring = [];   // [thoi diem rAF, khoang cach tu rAF truoc, chi phi khung]
      let truoc = 0, danh = 0, bd = 0, t0 = 0, cuoi = null;
      const mc = new MessageChannel();
      mc.port1.onmessage = () => { if (cuoi) cuoi[2] = performance.now() - t0; };
      const q = (a, p) => { const b = a.slice().sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(b.length * p))]; };
      const tick = (t) => {
        if (L.on || !dangGiangNay()) { L.vong = false; L.lienTiep = 0; try { mc.port1.close(); } catch (e) { /* bo qua */ } return; }
        requestAnimationFrame(tick);
        if (!bd) bd = t;
        const dt = truoc ? t - truoc : 0;
        truoc = t;
        cuoi = [t, dt, 0];
        if (dt < 2000) ring.push(cuoi); else cuoi = null;
        t0 = performance.now(); mc.port2.postMessage(0);
        while (ring.length && t - ring[0][0] > CUA_SO_MS) ring.shift();
        if (t - danh < 1000) return;
        danh = t;
        if (t - bd < BO_QUA_DAU_MS || ring.length < 50) return;
        const cp = ring.map((x) => x[2]), kc = ring.map((x) => x[1]);
        L.p75 = q(cp, 0.75); L.p95 = q(kc, 0.95); L.mau = ring.length;
        if (L.p75 > NGUONG_CHI_PHI_MS || (L.p95 > NGUONG_TRE_MS && L.p75 > NGUONG_CHI_PHI_PHU_MS)) L.lienTiep++; else L.lienTiep = 0;
        if (L.lienTiep >= LAN_LIEN_TIEP) bat('chi phi khung cao: p75 ' + L.p75.toFixed(1) + ' ms, khoang cach p95 ' + Math.round(L.p95) + ' ms / ' + ring.length + ' khung');
      };
      requestAnimationFrame(tick);
    }
    if (L.ep === true) bat('url ?lite=1');
    else if (L.ep === null) {
      const hc = navigator.hardwareConcurrency || 0, mem = navigator.deviceMemory || 0, dpr = window.devicePixelRatio || 1;
      if (mem && mem <= 2) bat('deviceMemory ' + mem + ' GB');
      else if (hc && hc <= 2) bat('hardwareConcurrency ' + hc);
      else if (dpr >= 2.5 && hc && hc <= 4) bat('dpr ' + dpr + ' + ' + hc + ' nhan cpu');
      else setInterval(() => { if (!L.on && !L.vong && dangGiangNay()) vongDo(); }, 1000);
    }
    const api = {
      get on() { return L.on; },
      get lyDo() { return L.lyDo; },
      bat,
      stats: () => ({ on: L.on, lyDo: L.lyDo, ep: L.ep, batLuc: L.batLuc, chiPhiP75: Math.round(L.p75 * 10) / 10, treP95: Math.round(L.p95 * 10) / 10, mau: L.mau, lienTiep: L.lienTiep,
        cpu: navigator.hardwareConcurrency || 0, ram: navigator.deviceMemory || 0, dpr: window.devicePixelRatio || 1 }),
    };
    window.SenseiLite = api;
    try { if (window.__motion && !('lite' in window.__motion)) Object.defineProperty(window.__motion, 'lite', { get: () => api.stats(), enumerable: true, configurable: true }); } catch (e) { /* bo qua */ }
    return L;
  })();

  const KHOA_LUU = 'sensei_che_do';
  const CHO_TOI_DA = 2500;   // startLecture khong doi lau hon (mang cham): che do bat tu nhip sau khi nap xong
  const DS = [
    { id: 'mac-dinh', ten: 'Mặc định', nhom: 'goc', mau: ['#fffdf9', '#c96442'] },
    { id: 'b', ten: 'Điện ảnh', nhom: 'moi', mau: ['#0b0907', '#dcb65e'] },
    { id: 'c', ten: 'Bản đồ tư duy', nhom: 'moi', mau: ['#fffcf6', '#1f1d19'] },
    { id: 'd', ten: 'Vui nhộn game', nhom: 'moi', mau: ['#fff3da', '#6c4dff'] },
    { id: 'e', ten: 'Kính cực quang', nhom: 'moi', mau: ['#0b1036', '#5ef2d0'] },
    { id: 'f', ten: 'Sổ tay phác thảo', nhom: 'moi', mau: ['#fbf8f1', '#2f5d9e'] },
    { id: 'g', ten: 'Poster Nhật Bản', nhom: 'moi', mau: ['#f2ebdc', '#c8322b'] },
    { id: 'h', ten: 'Giấy cắt lớp', nhom: 'moi', mau: ['#f5dcc0', '#a24c30'] },
    { id: 'i', ten: 'Chương trình TV', nhom: 'moi', mau: ['#0b2461', '#ffc21a'] },
    { id: 's', ten: 'Bảng đen lớp học', nhom: 'moi', mau: ['#2f4a3c', '#f4efe0'] },
  ];
  const CO_TINH = new Set(['h', 's']);   // che do co giao dien tinh (css/che-do/<k>-tinh.css) cho luc chua giang
  const THEO_ID = Object.create(null);
  DS.forEach((m) => { THEO_ID[m.id] = m; });
  const THU_VIEN = { gsap: 'gsap.min.js', CustomEase: 'CustomEase.min.js', SplitText: 'SplitText.min.js', Flip: 'Flip.min.js', DrawSVGPlugin: 'DrawSVGPlugin.min.js' };

  const DEF = Object.create(null);       // id che do moi -> def da dang ky
  const napTep = Object.create(null);    // id -> Promise<boolean>
  const napTV = Object.create(null);     // ten thu vien -> Promise<boolean>
  const st = { muon: 'mac-dinh', dang: 'mac-dinh', nghe: new Set() };

  const canhBao = (() => { let n = 0; return (noi, e) => { if (n++ < 8) { try { console.warn('[che-do] ' + noi, e); } catch (x) {} } }; })();
  const chuan = (v) => {
    const k = String(v == null ? '' : v).trim().toLowerCase();
    if (k === 'macdinh' || k === 'default' || k === '') return k === '' ? null : 'mac-dinh';
    return THEO_ID[k] ? k : null;
  };
  const laMoi = (k) => !!(THEO_ID[k] && THEO_ID[k].nhom === 'moi');

  // ------------------------------------------------------------------ lua chon ban dau
  let ghiDe = null;
  try {
    const q = new URLSearchParams(location.search);
    ghiDe = chuan(q.get('phongCach')) || chuan(q.get('cheDo'));
  } catch (e) {}
  let luu = null;
  try {
    const raw = localStorage.getItem(KHOA_LUU);
    luu = chuan(raw);
    if (raw != null && !luu) localStorage.setItem(KHOA_LUU, 'mac-dinh');   // id khong con trong danh muc / hong -> Mac dinh
  } catch (e) {}
  st.muon = ghiDe || luu || 'mac-dinh';

  // ------------------------------------------------------------------ nap tep
  function napScript(src) {
    return new Promise((ok) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = () => ok(true);
      s.onerror = () => ok(false);
      document.head.appendChild(s);
    });
  }
  function napCss(href, dau) {
    return new Promise((ok) => {
      if (document.querySelector(`link[data-che-do-css="${dau}"]`)) { ok(true); return; }
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = href;
      l.dataset.cheDoCss = dau;
      l.onload = () => ok(true);
      l.onerror = () => ok(false);
      document.head.appendChild(l);
    });
  }
  /** Thu vien dung chung (vendor/gsap): nap lan dau khi co che do can; plugin tu dang ky voi gsap */
  function napThuVien(ten) {
    if (!THU_VIEN[ten]) return Promise.resolve(false);
    if (napTV[ten]) return napTV[ten];
    const truoc = ten === 'gsap' ? Promise.resolve(true) : napThuVien('gsap');
    napTV[ten] = truoc.then((ok) => {
      if (!ok) return false;
      if (ten === 'gsap' && window.gsap) return true;
      if (ten !== 'gsap' && window[ten]) return true;
      return napScript('vendor/gsap/' + THU_VIEN[ten]);
    }).then((ok) => {
      if (!ok) return false;
      try {
        if (ten === 'gsap') { if (window.gsap && gsap.ticker) gsap.ticker.lagSmoothing(500, 33); }
        else if (window.gsap && window[ten]) gsap.registerPlugin(window[ten]);
      } catch (e) { canhBao('dang ky ' + ten, e); }
      return ten === 'gsap' ? !!window.gsap : !!window[ten];
    }).then((ok) => { if (!ok) { delete napTV[ten]; canhBao('không nạp được thư viện ' + ten); } return ok; });
    return napTV[ten];
  }
  /** Nap tep cua mot muc; Promise<boolean> san sang */
  function nap(k) {
    k = chuan(k);
    if (!k) return Promise.resolve(false);
    if (k === 'mac-dinh') return Promise.resolve(true);
    if (napTep[k]) return napTep[k];
    // <k>-tinh.css: giao dien TINH (luc chua giang) theo phong cach che do; tuy chon, thieu/loi khong lam hong che do
    const tinh = CO_TINH.has(k)
      ? Promise.all([napCss('css/che-do/' + k + '-tinh.css', k + '-tinh'), napScript('js/che-do/' + k + '-tinh.js')]).then(() => true, () => true)
      : Promise.resolve(true);
    const p = Promise.all([napCss('css/che-do/' + k + '.css', k), napScript('js/che-do/' + k + '.js'), tinh])
      .then(([a, b]) => {
        const def = DEF[k];
        if (!(a && b && def)) return false;
        const can = Array.isArray(def.can) ? def.can : [];
        return Promise.all(can.map(napThuVien)).then((ds) => ds.every(Boolean));
      });
    napTep[k] = p.then((ok) => { if (!ok) { delete napTep[k]; canhBao('không nạp được chế độ ' + k); } return ok; }, () => { delete napTep[k]; return false; });
    return napTep[k];
  }
  const sanSang = (k) => k === 'mac-dinh' || (!!DEF[k] && (DEF[k].can || []).every((t) => (t === 'gsap' ? !!window.gsap : !!window[t])));

  // ------------------------------------------------------------------ ap len san khau
  /** Ap lua chon (neu da nap): che do moi do dao dien tu doi lop o nhip nay */
  function apLuaChon() {
    const k = st.muon;
    if (k !== st.dang && sanSang(k)) { st.dang = k; baoDoi(); }
    return st.dang;
  }
  /** Dao dien: dau moi nhip. Tra def che do moi (dang ap) hoac null */
  function nhipMoi(san) {
    const k = apLuaChon();
    return laMoi(k) ? DEF[k] || null : null;
  }
  const dangGiang = () => !!(window.SenseiMotion && typeof SenseiMotion.dangGiang === 'function' && SenseiMotion.dangGiang());

  // ------------------------------------------------------------------ chon (nguoi hoc)
  function chon(id) {
    const k = chuan(id);
    if (!k) return Promise.resolve(false);
    st.muon = k;
    try { localStorage.setItem(KHOA_LUU, k); } catch (e) {}
    capNhatMenu();
    return nap(k).then((ok) => {
      if (st.muon !== k) return ok;
      if (!ok) {
        // tep chua co / nap loi: giu che do dang chay, bao ngan trong menu
        st.muon = st.dang;
        try { localStorage.setItem(KHOA_LUU, st.dang); } catch (e) {}
        capNhatMenu();
        if (ui.tb) ui.tb.textContent = 'Chưa mở được chế độ “' + ((THEO_ID[k] && THEO_ID[k].ten) || k) + '”';
        return false;
      }
      // San khau tat: ap ngay (khong ai thay) — dang giang: cho ranh gioi nhip (dao dien goi nhipMoi)
      if (ok && !dangGiang()) apLuaChon();
      capNhatMenu();
      return ok;
    });
  }
  function baoDoi() { st.nghe.forEach((f) => { try { f(st.dang); } catch (e) {} }); capNhatMenu(); }

  // ------------------------------------------------------------------ nut + menu tren thanh tren
  const ui = { nut: null, menu: null, tb: null, mo: false };
  function veMau(m) {
    const [a, b] = m.mau || ['#fff', '#c96442'];
    return `<span class="cd-mau" aria-hidden="true" style="--cd-a:${a};--cd-b:${b}"></span>`;
  }
  function veMenu() {
    const muc = (m) => `<button type="button" class="cd-muc" role="menuitemradio" data-id="${m.id}" aria-checked="false">${veMau(m)}<span class="cd-ten">${m.ten}</span>${m.nhom === 'moi' ? `<span class="cd-ma">${m.id.toUpperCase()}</span>` : ''}<i class="cd-dau fa-solid fa-check" aria-hidden="true"></i></button>`;
    const nhom = (ten, loai) => `<div class="cd-nhom" role="group" aria-label="${ten}"><p class="cd-nhom-ten">${ten}</p>${DS.filter((m) => m.nhom === loai).map(muc).join('')}</div>`;
    return `<div class="cd-dau-menu"><span>Chế độ sân khấu</span><span class="cd-phu">áp dụng cho mọi bài</span></div>
      <div class="cd-cuon">${DS.filter((m) => m.nhom === 'goc').map(muc).join('')}${nhom('Chế độ mới', 'moi')}</div>
      <p class="cd-tb" aria-live="polite"></p>`;
  }
  /** <html data-che-do="<id>">: id dang CHON (ap ngay ca luc chua giang) — CSS tinh <k>-tinh.css bam vao day */
  function datDauTinh() {
    try {
      const k = CO_TINH.has(st.muon) ? st.muon : '';
      if (k) document.documentElement.setAttribute('data-che-do', k);
      else document.documentElement.removeAttribute('data-che-do');
    } catch (e) {}
  }
  function capNhatMenu() {
    datDauTinh();
    if (!ui.menu) return;
    ui.menu.querySelectorAll('.cd-muc').forEach((b) => {
      const k = b.dataset.id;
      b.setAttribute('aria-checked', k === st.muon ? 'true' : 'false');
      b.classList.toggle('is-dang', k === st.dang && k !== st.muon);
    });
    const m = THEO_ID[st.muon];
    if (ui.nut) {
      ui.nut.title = 'Chế độ sân khấu: ' + (m ? m.ten : '');
      ui.nut.setAttribute('aria-label', 'Chế độ sân khấu: ' + (m ? m.ten : ''));
      ui.nut.classList.toggle('is-co', st.muon !== 'mac-dinh');
      if (m) ui.nut.style.setProperty('--cd-b', m.mau[1]);
    }
    if (ui.tb) {
      ui.tb.textContent = st.muon !== st.dang && dangGiang() ? 'Sẽ đổi từ phần giảng tiếp theo' : '';
    }
  }
  function datViTri() {
    if (!ui.nut || !ui.menu) return;
    const r = ui.nut.getBoundingClientRect();
    const W = innerWidth;
    const rong = Math.min(300, W - 16);
    ui.menu.style.width = rong + 'px';
    ui.menu.style.top = Math.round(r.bottom + 8) + 'px';
    ui.menu.style.left = Math.round(Math.max(8, Math.min(W - rong - 8, r.right - rong))) + 'px';
    ui.menu.style.maxHeight = Math.max(200, innerHeight - r.bottom - 24) + 'px';
  }
  function moMenu() {
    if (!ui.menu) return;
    ui.mo = true;
    ui.menu.hidden = false;
    ui.nut.setAttribute('aria-expanded', 'true');
    capNhatMenu();
    datViTri();
    const dang = ui.menu.querySelector('.cd-muc[aria-checked="true"]') || ui.menu.querySelector('.cd-muc');
    if (dang) { try { dang.focus({ preventScroll: true }); dang.scrollIntoView({ block: 'nearest' }); } catch (e) {} }
  }
  function dongMenu(traFocus) {
    if (!ui.menu || !ui.mo) return;
    ui.mo = false;
    ui.menu.hidden = true;
    ui.nut.setAttribute('aria-expanded', 'false');
    if (traFocus) { try { ui.nut.focus({ preventScroll: true }); } catch (e) {} }
  }
  function taoNut() {
    if (ui.nut || !document.body) return;
    const cho = document.querySelector('.deck-top-tools');
    if (!cho) return;
    const nut = document.createElement('button');
    nut.type = 'button';
    nut.id = 'cheDoBtn';
    nut.className = 'ctl-icon cd-nut';
    nut.setAttribute('aria-haspopup', 'menu');
    nut.setAttribute('aria-expanded', 'false');
    nut.setAttribute('aria-controls', 'cheDoMenu');
    nut.innerHTML = '<i class="fa-solid fa-palette" aria-hidden="true"></i><span class="cd-nut-cham" aria-hidden="true"></span>';
    const picker = document.getElementById('pickerBtn');
    cho.insertBefore(nut, picker && picker.parentNode === cho ? picker : null);
    const menu = document.createElement('div');
    menu.id = 'cheDoMenu';
    menu.className = 'cd-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Chế độ sân khấu');
    menu.hidden = true;
    menu.innerHTML = veMenu();
    document.body.appendChild(menu);
    ui.nut = nut; ui.menu = menu; ui.tb = menu.querySelector('.cd-tb');
    nut.addEventListener('click', (e) => { e.stopPropagation(); if (ui.mo) dongMenu(false); else moMenu(); });
    nut.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); moMenu(); } });
    menu.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('.cd-muc');
      if (!b) return;
      e.stopPropagation();
      chon(b.dataset.id);
      if (!dangGiang() || st.muon === st.dang) dongMenu(true);
      else capNhatMenu();
    });
    menu.addEventListener('keydown', (e) => {
      const ds = [...menu.querySelectorAll('.cd-muc')];
      const i = ds.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); dongMenu(true); return; }
      if (e.key === 'Tab') { dongMenu(false); return; }
      let j = -1;
      if (e.key === 'ArrowDown') j = i < 0 ? 0 : (i + 1) % ds.length;
      else if (e.key === 'ArrowUp') j = i <= 0 ? ds.length - 1 : i - 1;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = ds.length - 1;
      if (j >= 0) { e.preventDefault(); ds[j].focus(); }
    });
    document.addEventListener('pointerdown', (e) => { if (ui.mo && !menu.contains(e.target) && !nut.contains(e.target)) dongMenu(false); }, true);
    addEventListener('resize', () => { if (ui.mo) datViTri(); });
    capNhatMenu();
  }

  // ------------------------------------------------------------------ dang ky che do
  function dangKy(def) {
    if (!def || !def.id || !laMoi(def.id)) { canhBao('dangKy: id không hợp lệ', def && def.id); return false; }
    if (typeof def.dungNhip !== 'function') { canhBao('dangKy: thiếu dungNhip', def.id); return false; }
    def.ten = def.ten || THEO_ID[def.id].ten;
    DEF[def.id] = def;
    return true;
  }

  const API = {
    DS: DS.map((m) => Object.assign({}, m)),
    dangKy,
    chon,
    nap,
    napThuVien,
    nhipMoi,
    muon: () => st.muon,
    hienTai: () => st.dang,
    def: (k) => DEF[k] || null,
    khiDoi: (f) => { if (typeof f === 'function') st.nghe.add(f); return () => st.nghe.delete(f); },
  };
  window.SenseiCheDo = API;

  // ---- Phong chu CHUNG (Noto Serif / Sans JP, Inter: luoi bai + san khau mac dinh, van dung duoi moi che do): nap truoc moi manh unicode-range
  // cua bai ngay khi mo bai. Khong nap thi tung manh tai GIUA buoi giang, moi manh tai xong = trinh duyet tinh lai style + bo cuc ca trang
  // (do: tools/che-do/khung/perf.mjs, khung tre 0,3-1,3 s tren may yeu, trung khit thoi diem su kien fonts loading / loadingdone).
  const FONT_CHUNG = new Set();
  const FONT_KY_HIEU = '✓✗⚠∧';   // dau tich / sai / canh bao trong giao dien (khong nam trong json bai): chung mot manh Noto Sans JP voi chu Han hiem
  function napFontChung() {
    try {
      const se = window.__slideEngine, F = document.fonts;
      if (!se || !se.loader || !F || !F.load || !se.currentLevel || typeof se.loader.ensureLessonLoaded !== 'function') return;
      const lvl = se.currentLevel, no = se.currentLesson, key = lvl + '-' + no;
      if (FONT_CHUNG.has(key)) return;
      FONT_CHUNG.add(key);
      se.loader.ensureLessonLoaded(lvl, no).then(() => {
        const bai = se.loader.getLesson(lvl, no);
        if (!bai) return;
        let s = '';
        try { s = JSON.stringify([bai.title, bai.vocabList, bai.kanjiList, bai.slides, bai.dialogue, bai.exercises]); } catch (e) { return; }
        const jp = Array.from(new Set(s.match(/[　-ヿ㐀-鿿豈-﫿＀-￯]/g) || [])).join('') + 'Aa' + FONT_KY_HIEU;
        const la = Array.from(new Set(s.match(/[^\u0000-\u007f　-ヿ㐀-鿿豈-﫿＀-￯]/g) || [])).join('') + 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const lay = (f, t) => { try { F.load(f, t).catch(() => {}); } catch (e) {} };
        lay('700 32px "Noto Serif JP"', jp);
        ['400', '500', '700'].forEach((w) => lay(w + ' 32px "Noto Sans JP"', jp));
        ['400', '500', '600', '700'].forEach((w) => lay(w + ' 32px "Inter"', la));
      }).catch(() => { FONT_CHUNG.delete(key); });
    } catch (e) { canhBao('napFontChung', e); }
  }

  /** app.js (openLesson / startLecture): nap tep cua lua chon hien tai (toi da 2,5 s, khong bao gio reject) —
   *  nhip dau tien cua bai giang dung che do do. Tra Promise<id | null> (null = mac dinh). */
  API.apDung = function () {
    napFontChung();
    try {
      const p = nap(st.muon).then((ok) => { if (ok && !dangGiang()) apLuaChon(); return st.dang === 'mac-dinh' ? null : st.dang; });
      const han = new Promise((r) => setTimeout(() => r(null), CHO_TOI_DA));
      return Promise.race([p, han]).catch(() => null);
    } catch (e) { canhBao('apDung', e); return Promise.resolve(null); }
  };

  // Nap truoc lua chon da luu (khong chan trang); tao nut khi DOM san
  const khoi = () => {
    taoNut(); datDauTinh();
    if (st.muon === 'mac-dinh') return;
    // nap loi (thieu tep): giu che do dang chay cho phien nay (khong ghi lai localStorage), dau tinh theo che do that su nap duoc
    nap(st.muon).then((ok) => { if (!ok && st.muon !== 'mac-dinh') { st.muon = st.dang; datDauTinh(); capNhatMenu(); } });
  };
  datDauTinh();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', khoi, { once: true });
  else khoi();
})();
