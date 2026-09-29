/* ==========================================================================
   Chon phong cach san khau giang (5 ban de chu du an so sanh) — bo nap nho
   N5 bai 1..7 -> pc1..pc7; moi bai khac: giao dien mac dinh (khong co data-phong-cach).
   Ghi de: ?phongCach=pc1..pc5 ep mot phong cach cho moi bai; ?phongCach=mac-dinh ep mac dinh.

   Chi nap tep khi can (css/phong-cach/pcN.css + js/phong-cach/pcN.js, moi tep mot lan) — trang
   mac dinh khong tai gi them. app.js goi:
     - openLesson: apDung(cap, bai) KHONG cho (nap truoc, doi phong cach khi san khau da tat)
     - startLecture: await apDung(cap, bai) truoc nhip dau (toi da CHO_TOI_DA ms, khong bao gio nem)
   Doi phong cach: ketThuc(san) cua phong cach cu, go thuoc tinh, roi dat thuoc tinh + batDau(san)
   cua phong cach moi. Cung phong cach: khong goi lai batDau.

   Dang ky: window.SenseiPhongCachChon = { khoa(cap, bai), apDung(cap, bai), hienTai() }.
   ========================================================================== */
(function () {
  'use strict';

  const DS = ['pc1', 'pc2', 'pc3', 'pc4', 'pc5', 'pc6', 'pc7'];
  const CHO_TOI_DA = 2500;          // startLecture khong doi lau hon muc nay (mang cham): phong cach bat khi nap xong
  const nap = Object.create(null);  // khoa -> Promise<boolean>
  const st = { muon: null, dang: null, san: null, choSan: null };

  // Tham so ghi de (doc mot lan)
  let ghiDe;   // undefined: khong ghi de; null: mac dinh; 'pcN'
  try {
    const v = (new URLSearchParams(location.search).get('phongCach') || '').trim().toLowerCase();
    if (DS.includes(v)) ghiDe = v;
    else if (v === 'mac-dinh' || v === 'macdinh' || v === 'default') ghiDe = null;
  } catch (e) {}

  /** Phong cach cho bai (cap, bai): 'pcN' | null (mac dinh) */
  function khoa(cap, bai) {
    if (ghiDe !== undefined) return ghiDe;
    const n = Number(bai);
    if (String(cap || '').toUpperCase() === 'N5' && Number.isInteger(n) && n >= 1 && n <= 7) return 'pc' + n;   // bai 6 -> pc6 (Video bai giang), bai 7 -> pc7 (Reel dong lenh)
    return null;
  }

  function napTep(k) {
    if (nap[k]) return nap[k];
    nap[k] = new Promise((xong) => {
      let con = 2;
      let ok = true;
      const mot = (tot) => { if (!tot) ok = false; if (--con === 0) xong(ok && !!(window.SenseiPhongCach && window.SenseiPhongCach[k])); };
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'css/phong-cach/' + k + '.css';
      l.dataset.phongCach = k;
      l.onload = () => mot(true);
      l.onerror = () => mot(false);
      document.head.appendChild(l);
      const s = document.createElement('script');
      s.src = 'js/phong-cach/' + k + '.js';
      s.async = false;
      s.onload = () => mot(true);
      s.onerror = () => mot(false);
      document.head.appendChild(s);
    }).then((ok) => {
      if (!ok) { console.warn('[phong-cach] không nạp được ' + k); delete nap[k]; }
      return ok;
    });
    return nap[k];
  }

  const timSan = () => document.getElementById('sanKhauGiang');

  function tatHienTai() {
    const k = st.dang;
    if (!k) return;
    st.dang = null;
    const san = st.san || timSan();
    try { const P = window.SenseiPhongCach && window.SenseiPhongCach[k]; if (P && P.ketThuc) P.ketThuc(san); } catch (e) { console.warn('[phong-cach] ketThuc ' + k, e); }
    if (san && san.getAttribute('data-phong-cach') === k) san.removeAttribute('data-phong-cach');
    if (document.body && document.body.getAttribute('data-phong-cach') === k) document.body.removeAttribute('data-phong-cach');
    st.san = null;
  }

  function batMuon() {
    const k = st.muon;
    if (!k || st.dang === k) return;
    const P = window.SenseiPhongCach && window.SenseiPhongCach[k];
    if (!P) return;
    const san = timSan();
    if (!san) { choSan(); return; }
    san.setAttribute('data-phong-cach', k);
    if (document.body) document.body.setAttribute('data-phong-cach', k);
    st.dang = k;
    st.san = san;
    try { P.batDau(san); } catch (e) { console.warn('[phong-cach] batDau ' + k, e); }
  }

  // San khau do dao dien tao (thuong ngay luc init; du phong: nhip dau) -> cho no xuat hien
  function choSan() {
    if (st.choSan || !window.MutationObserver || !document.body) return;
    st.choSan = new MutationObserver(() => {
      if (!timSan()) return;
      st.choSan.disconnect();
      st.choSan = null;
      batMuon();
    });
    st.choSan.observe(document.body, { childList: true, subtree: true });
  }

  /** Dat phong cach cho bai (cap, bai). Tra Promise<'pcN'|null> — khong bao gio reject. */
  function apDung(cap, bai) {
    try {
      const k = khoa(cap, bai);
      st.muon = k;
      if (st.dang && st.dang !== k) tatHienTai();
      if (!k) return Promise.resolve(null);
      if (st.dang === k) {
        const san = timSan();   // da bat: chi dam bao thuoc tinh con tren san khau
        if (san && san.getAttribute('data-phong-cach') !== k) san.setAttribute('data-phong-cach', k);
        return Promise.resolve(k);
      }
      const p = napTep(k).then((ok) => { if (ok && st.muon === k) batMuon(); return st.dang === k ? k : null; });
      const han = new Promise((r) => setTimeout(() => r(null), CHO_TOI_DA));
      return Promise.race([p, han]).catch(() => null);
    } catch (e) {
      console.warn('[phong-cach] apDung', e);
      return Promise.resolve(null);
    }
  }

  window.SenseiPhongCachChon = { khoa, apDung, hienTai: () => st.dang };
})();
