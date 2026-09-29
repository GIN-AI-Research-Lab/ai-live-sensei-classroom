/* ==========================================================================
   Phong cach san khau giang 7 — "Reel dong lenh" (chuyen the tu cau truc phim ra mat "Agent-Chorus
   Capability Reel" sang san khau giang SONG: khong video, khong cong cu ngoai, khong mo hinh sinh).

   Bon chuyen dong, dong bo voi loi Sensei:
   I   "Mot dong mot minh": moi nhip mo bang DONG CHINH (tu dau muc / cong thuc / cau vi du) mot minh
       tren the gan nhu trong, go tung ky tu voi CON TRO QUA KHO nhap nhay; ky tu hien DUNG luc tung
       mora vang len (furigana go tung kana) -> go xong khi Sensei doc xong. Phan con lai cua the
       dung sau do (mot lan truot easeOutExpo, hoac cat voi nhip "cat").
   II  "Dong ca": CUNG mot chuoi (khai bao mot lan: chuoiDiep) hien trong 4 "mat" khac hinh — dong
       lenh, bong chat, o nhap tren dong ke vo, the soan noi — noi tiep va NHANH DAN (mat 1 go du, mat 2
       go gap doi, mat 3-4 chop mot nhip). Ngu phap: tro tu / phan co dinh to cung mot kieu o moi mat;
       vi du: phan co dinh lap y het, danh tu thay doi (cac vi du anh em + cong thuc). Chi chiem thoi
       gian Sensei dang noi; cue noi dung ke tiep toi la dong ca ket thuc ngay (khong bao gio tre cue).
   III "Reel cat theo nhip": vi du / thoai / the chuong / the ket bai: noi dung CAT (khong mo, khong
       truot) va moi nhat cat roi DUNG vao mot moc cua LUOI NHIP rut tu chinh tieng noi:
         - nang luong: boc SenseiKhauHinh.nap (duong PCM that, truoc khi phat) -> RMS 5 ms -> diem
           bat dau am tiet / mora (vuc -> len >= 8 dB, noi suy diem cat nguong vuc + 6 dB);
         - du phong: moc tu cua bo cue (hu.karaoke / cue T + dur) va so mora.
       Lich cat chay tren rAF: moi viec ap vao khung hinh co thoi diem hien (uoc: khung + 1 khung)
       gan moc nhat (|lech| <= nua khung). Moi lan cat ghi nhat ky { luoi, cat, lech } -> __pc7.nhatKy().
       The chuong / ket bai = reel: moi muc cua chuong chop MOT nhip (180-300 ms, boi so khoang mora do
       duoc, khoa pha vao moc cuoi) roi dung o khung cuoi. Chi doi CHU trong mot o nho — khong doi
       sang toi ca the (an toan anh sang nhap nhay).
   IV  "Lenh": moi nhip / chuong dong lai bang MOT dong mono co dau nhac "›" + con tro dung yen
       (tu = nghia, cong thuc, cau = nghia); het nhip: phan con lai lui mo, the nghi tren dong do.
   Bai tap: sau khi hoc vien chon, con tro qua kho truot (easeOutExpo) toi dap an dung va "bam".

   Hop dong: window.SenseiPhongCach.pc7 = { ten, batDau(stageEl), ketThuc(stageEl) }. Chi khi bat:
   boc Element.prototype.animate (chuyen canh -> cat / truot expo; con tro doc trong nhip cat -> giu roi
   nhay dung moc), boc SenseiMotion.hu.karaoke (lay moc tung token), boc (chi doc) SenseiKhauHinh.nap /
   xoa (nang luong). ketThuc tra lai tat ca, go moi lop / kieu / phan tu pc7. KHONG doi luc cue ban,
   khong doi thu tu; moi thu gan vao phan tu trong #sanKhauGiang (the bai tap that cua luoi khong bi
   gan lop nao). Giam chuyen dong: khong go / dong ca / reel — the day du ngay, dong lenh hien mo dan.

   Dang ky: window.SenseiPhongCach.pc7.
   ========================================================================== */
(function () {
  'use strict';

  const TEN = 'pc7';
  const SEL = '.san-khau-giang[data-phong-cach="pc7"]';
  const E_EXPO = 'cubic-bezier(.16,1,.3,1)';
  const HOP = 0.005;               // buoc phan tich nang luong (s)
  const KHOANG_MIN = 0.06;         // hai moc cach nhau it nhat 60 ms
  const THE_CAT = 170;             // dao dien: noi dung moi bat dau o 170 ms (THE_CHONG) -> cat tai day
  const LAT_CAT = 160;             // lat the chuong / ket bai: cat o 160 ms (LAT_RA)
  const TRUOT_MS = 560;            // truot easeOutExpo
  // Nhip "cat": noi dung doi bang cat (khong mo / truot); con tro doc nhay dung moc
  const LOAI_CAT = { example: 1, kaiwa: 1, 'kaiwa-run': 1, 'kaiwa-intro': 1 };
  // Chuoi ky tu Nhat
  const RE_KANA = /[ぁ-ゖァ-ヺー]/;
  const RE_NHO = /[ぁぃぅぇぉゃゅょゎゕゖァィゥェォャュョヮヵヶッっ]/;
  const RE_HAN = /[一-鿿々]/;
  const RE_JP = /[぀-ヿ一-鿿々ー〜]/;

  const st = {
    bat: false, san: null,
    gocAnim: null, bocAnim: null,
    hu: null, gocKaraoke: null, bocKaraoke: null,
    kh: null, gocNap: null, bocNap: null, gocXoa: null, bocXoa: null,
    raf: 0, tsTruoc: 0, khung: [], F: 1 / 60, tHien: 0,
    mo: null, moCho: null, cho: null,
    theNay: null, nhatKy: [], tokT: new WeakMap(), nhomTro: null,
    anims: new Set(), phanTu: new Set(), lopGan: new Map(),
  };
  const CT = new WeakMap();        // .sk-the -> bo dieu khien

  // ------------------------------------------------------------------ tien ich
  const giam = () => { try { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } };
  let soCanh = 0;
  const canhBao = (noi, e) => { if (soCanh++ < 6) { try { console.warn('[pc7] ' + noi, e); } catch (x) {} } };
  const kep = (x, a, b) => Math.max(a, Math.min(b, x));
  const kyTu = (s) => Array.from(String(s == null ? '' : s));
  function dongHo() {
    try { if (window.__motion && typeof __motion.dongHo === 'function') { const t = __motion.dongHo(); if (isFinite(t)) return t; } } catch (e) {}
    return performance.now() / 1000;
  }
  function trangThai() {
    try { if (window.__motion && typeof __motion.trangThai === 'function') return __motion.trangThai(); } catch (e) {}
    return null;
  }
  /** Dong ho dao dien dang la dong ho tuong (AudioContext khong chay) -> nang luong khac mien, khong dung */
  let tuongCache = { luc: 0, v: true };
  function laTuong() {
    const n = performance.now();
    if (n - tuongCache.luc < 250) return tuongCache.v;
    let v = true;
    try { const t = window.SenseiMotion && SenseiMotion.trangThai ? SenseiMotion.trangThai() : null; v = !t || !!t.wall; } catch (e) {}
    tuongCache = { luc: n, v };
    return v;
  }
  function goi(el, kf, o) { try { return st.gocAnim.call(el, kf, o); } catch (e) { return null; } }
  function rong(el, o) { return goi(el, [], Object.assign({}, o, { duration: 0, delay: 0, iterations: 1 })); }
  function hoat(el, kf, o) {
    const a = goi(el, kf, Object.assign({ fill: 'backwards' }, o));
    if (a) { st.anims.add(a); const bo = () => st.anims.delete(a); a.addEventListener('finish', bo); a.addEventListener('cancel', bo); }
    return a;
  }
  function tao(tag, lop, cha) {
    const e = document.createElement(tag);
    e.className = lop;
    e.setAttribute('aria-hidden', 'true');
    e.setAttribute('data-sk-tro', '');
    if (cha) cha.appendChild(e);
    st.phanTu.add(e);
    return e;
  }
  function ganLop(el, lop) {
    if (!el || !el.classList) return;
    el.classList.add(lop);
    let s = st.lopGan.get(el);
    if (!s) { s = new Set(); st.lopGan.set(el, s); }
    s.add(lop);
  }
  function goLop(el, lop) { if (el && el.classList) el.classList.remove(lop); }
  const trungVi = (a) => { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; };

  // ================================================================== (A) nang luong tieng Sensei
  const NL = { T: [], L: [], moc: [], lang: [], den: null, acc: 0, dem: 0, tHop: 0, ref: -30, pha: 0, dinh: -120, day: 0,
    tLang: null, mocCuoi: -1e9, co: false };
  function datLaiNL() {
    NL.T = []; NL.L = []; NL.moc = []; NL.lang = []; NL.den = null; NL.acc = 0; NL.dem = 0; NL.tHop = 0;
    NL.ref = -30; NL.pha = 0; NL.dinh = -120; NL.day = -120; NL.tLang = null; NL.mocCuoi = -1e9;
  }
  function dongLang(t) {
    if (NL.tLang != null && t - NL.tLang >= 0.08) NL.lang.push({ s: NL.tLang, e: t });
    NL.tLang = null;
  }
  function dayHop(t, ms) {
    const L = ms > 1e-12 ? 10 * Math.log10(ms) : -120;
    const i = NL.T.length;
    NL.T.push(t); NL.L.push(L);
    NL.ref = Math.max(L, NL.ref - 0.01);          // dinh cham, ha 2 dB / s
    const san = Math.max(-62, NL.ref - 34);        // duoi san: im
    if (L < san) { if (NL.tLang == null) NL.tLang = t; } else dongLang(t);
    if (NL.pha === 1) {                            // dang len / dinh
      if (L > NL.dinh) NL.dinh = L;
      if (L < NL.dinh - 8 || L < san) { NL.pha = 0; NL.day = L; }
      return;
    }
    if (L < NL.day) NL.day = L;
    if (L >= NL.day + 8 && L >= san + 4) {
      // diem cat nguong (vuc + 6 dB): lui toi hop cuoi con duoi nguong, noi suy tam hai hop
      const g = NL.day + 6;
      let j = i;
      while (j > 0 && i - j < 8 && NL.L[j - 1] >= g) j--;
      let to = NL.T[j] + HOP / 2;
      if (j > 0 && NL.L[j] > NL.L[j - 1]) {
        const a = NL.L[j - 1], b = NL.L[j];
        to = NL.T[j - 1] + HOP / 2 + HOP * kep((g - a) / (b - a), 0, 1);
      }
      if (to - NL.mocCuoi >= KHOANG_MIN) { NL.moc.push(to); NL.mocCuoi = to; }
      NL.pha = 1; NL.dinh = L;
    }
  }
  function napNL(x, t0, sr) {
    if (!x || !x.length || !(t0 >= 0)) return;
    sr = sr || 24000;
    const n = Math.max(1, Math.round(HOP * sr));
    if (NL.den == null || Math.abs(t0 - NL.den) > 0.0015) {
      // goi khong noi tiep: khoang giua la im
      if (NL.den != null && t0 > NL.den) { if (NL.tLang == null) NL.tLang = NL.den; NL.pha = 0; NL.day = -120; }
      NL.acc = 0; NL.dem = 0; NL.tHop = t0;
    }
    let acc = NL.acc, dem = NL.dem;
    for (let i = 0; i < x.length; i++) {
      const v = x[i];
      acc += v * v;
      if (++dem === n) { dayHop(NL.tHop, acc / n); NL.tHop += n / sr; acc = 0; dem = 0; }
    }
    NL.acc = acc; NL.dem = dem;
    NL.den = t0 + x.length / sr;
    NL.co = true;
    if (NL.T.length > 12000) { NL.T.splice(0, 3000); NL.L.splice(0, 3000); }
    if (NL.moc.length > 4000) NL.moc.splice(0, 1000);
    if (NL.lang.length > 800) NL.lang.splice(0, 200);
  }
  /** Tieng bi cat (dung / noi chen): bo moi thu sau bay gio */
  function catNL() {
    const t = dongHo();
    NL.moc = NL.moc.filter((x) => x <= t);
    NL.lang = NL.lang.filter((x) => x.s <= t);
    let k = NL.T.length;
    while (k > 0 && NL.T[k - 1] > t) k--;
    NL.T.length = k; NL.L.length = k;
    NL.den = null; NL.tLang = null; NL.pha = 0; NL.day = -120;
  }

  // ================================================================== (B) luoi nhip
  const luoi = {
    ok: () => NL.co && !laTuong(),
    den: () => (NL.den == null ? -1e9 : NL.den),
    /** Moc dau tien > t (null: chua biet) */
    sau(t) {
      const m = NL.moc;
      let lo = 0, hi = m.length;
      while (lo < hi) { const k = (lo + hi) >> 1; if (m[k] <= t) lo = k + 1; else hi = k; }
      return lo < m.length ? m[lo] : null;
    },
    /** Moc gan t nhat trong [t - a, t + b] */
    gan(t, a, b) {
      const m = NL.moc;
      let tot = null, d = Infinity;
      let lo = 0, hi = m.length;
      while (lo < hi) { const k = (lo + hi) >> 1; if (m[k] < t - a) lo = k + 1; else hi = k; }
      for (let k = lo; k < m.length && m[k] <= t + b; k++) { const x = Math.abs(m[k] - t); if (x < d) { d = x; tot = m[k]; } }
      return tot;
    },
    /** Dau khoang lang >= dai giay dau tien bat dau sau t (null: chua thay) */
    langSau(t, dai) {
      for (const r of NL.lang) if (r.s >= t && r.e - r.s >= dai) return r.s;
      if (NL.tLang != null && NL.tLang >= t && luoi.den() - NL.tLang >= dai) return NL.tLang;
      return null;
    },
    /** Dau cum ke tiep sau t: moc dau tien sau mot khoang lang >= 80 ms bat dau sau t (null: chua biet) */
    dauCum(t) {
      for (const r of NL.lang) {
        if (r.s < t + 0.03 || r.e - r.s < 0.08) continue;
        const m = luoi.sau(r.e - 0.03);
        return m;
      }
      return null;
    },
    /** Khoang mora (trung vi khoang cach cac moc gan day) */
    ioi() {
      const m = NL.moc, d = [];
      for (let k = Math.max(1, m.length - 60); k < m.length; k++) { const x = m[k] - m[k - 1]; if (x >= 0.06 && x <= 0.45) d.push(x); }
      const v = trungVi(d);
      if (v) return v;
      try { const p = __motion.thamSo(); if (p && p.rJ > 0) return p.rJ; } catch (e) {}
      return 0.15;
    },
    /** Chu ky reel: boi so khoang mora gan 240 ms nhat trong [180, 300] ms */
    chuKy() {
      const v = luoi.ioi();
      let tot = null, d = Infinity;
      // nghieng ve chu ky dai (<= 4 lan doi / s tren mot o chu nho)
      for (let k = 1; k <= 5; k++) { const p = k * v; if (p >= 0.18 && p <= 0.3 && Math.abs(p - 0.26) <= d) { d = Math.abs(p - 0.26); tot = p; } }
      return tot || kep(v, 0.18, 0.3);
    },
  };

  // ================================================================== (C) lich cat (rAF)
  const LICH = [];
  function henCat(T, fn, nhan, nguon, the) {
    LICH.push({ T, fn, nhan, nguon: nguon || 'nl', the: the || null });
  }
  function ghiCat(x, tHien) {
    if (!x.nhan) return;
    const bu = tHien - x.T > st.F * 0.75;
    const g = { nhan: x.nhan, nguon: bu ? 'bu' : x.nguon, luoi: +x.T.toFixed(4), cat: +tHien.toFixed(4), lech: +((tHien - x.T) * 1000).toFixed(2),
      khung: +(st.F * 1000).toFixed(2), kind: x.the && x.the.dataset ? x.the.dataset.kind || '' : '' };
    st.nhatKy.push(g);
    if (st.nhatKy.length > 3000) st.nhatKy.splice(0, 500);
  }
  function chayLich(tHien, F) {
    for (let i = 0; i < LICH.length;) {
      const x = LICH[i];
      if (x.the && !x.the.isConnected) { LICH.splice(i, 1); continue; }
      if (x.T <= tHien + F / 2) {
        LICH.splice(i, 1);
        try { x.fn(tHien); } catch (e) { canhBao('lich', e); }
        ghiCat(x, tHien);
        continue;
      }
      i++;
    }
  }
  function xaLich(the) {
    for (let i = LICH.length - 1; i >= 0; i--) {
      if (!the || LICH[i].the === the) { const x = LICH.splice(i, 1)[0]; try { x.fn(st.tHien); } catch (e) {} }
    }
  }
  function vong(ts) {
    st.raf = 0;
    if (!st.bat) return;
    const san = st.san;
    if (!san || !san.isConnected || san.hidden) { xaLich(null); return; }
    st.raf = requestAnimationFrame(vong);
    if (st.tsTruoc) { const d = ts - st.tsTruoc; if (d > 4 && d < 100) { st.khung.push(d); if (st.khung.length > 40) st.khung.shift(); } }
    st.tsTruoc = ts;
    const F = (trungVi(st.khung) || 16.667) / 1000;
    st.F = F;
    const tKhung = dongHo() - Math.max(0, performance.now() - ts) / 1000;
    const tHien = tKhung + F;
    st.tHien = tHien;
    try { buocCanh(tHien, F); } catch (e) { canhBao('buoc', e); }
    chayLich(tHien, F);
  }
  function chayVong() { if (st.bat && !st.raf && st.san && !st.san.hidden) { st.tsTruoc = 0; st.raf = requestAnimationFrame(vong); } }

  // ================================================================== (D) chuoi su kien theo luoi
  /**
   * Chuoi: su kien i xay ra o moc thu `buoc` (0 = cung luc su kien truoc) sau moc cua su kien truoc.
   * Su kien 0: moc gan T0 nhat (cue T). Het cua so (tHet = dau khoang lang sau loi doc): phan con lai
   * don vao moc cuoi. Chua co du lieu (am thanh chua toi) -> cho; im qua lau -> ngoai suy theo nhip.
   */
  function taoChuoi(the, T0, ds, o) {
    o = o || {};
    return { the, T0, ds, i: 0, giai: 0, tHet: o.tHet != null ? o.tHet : null, uocHet: o.uocHet || null, nhan: o.nhan || 'go', xong: false, huy: false };
  }
  function giaiChuoi(ch, tHien) {
    const ok = luoi.ok();
    while (ch.giai < ch.ds.length) {
      const e = ch.ds[ch.giai];
      const truoc = ch.giai > 0 ? ch.ds[ch.giai - 1] : null;
      // cong (ngu phap): phan nay chi go khi cue cua no da ban (cho toi da 2.5 s)
      let san = null;
      if (e.cong) {
        const g = e.cong();
        if (g == null) {
          if (e.tCho == null) e.tCho = tHien;
          if (tHien - e.tCho < 2.5) break;
        } else san = g;
      }
      let T = null, nguon = 'nl';
      if (!truoc && e.ngat && ok) {
        // bat dau o dau cum ke tiep (vd Sensei doc lai cong thuc)
        const m = luoi.dauCum(ch.T0);
        if (m != null && m - ch.T0 <= 3) T = m;
        else if (luoi.den() < ch.T0 + 3 && tHien < ch.T0 + 3) break;
        else { T = ch.T0; nguon = 'cue'; }
      } else if (!truoc) {
        if (ok && luoi.den() >= ch.T0 + 0.25) { T = luoi.gan(ch.T0, 0.06, 0.2); if (T == null) { T = ch.T0; nguon = 'cue'; } }
        else if (ok && tHien < ch.T0 - 0.02) break;                  // cho am thanh cua loi doc toi
        else { T = ch.T0; nguon = 'cue'; }
      } else if (!e.buoc && san == null) { T = truoc.T; nguon = truoc.nguon; }
      else {
        let b = truoc.T, k = 0;
        const can = Math.max(1, e.buoc || 0);
        if (san != null && san - 0.03 > b) {
          // cue cong: moc gan cue nhat (cue T da khop vao diem cat tieng)
          const m = ok ? luoi.gan(san, 0.04, 0.2) : null;
          if (m != null && m > b) T = m;
          else { T = san; nguon = 'cue'; }
        } else if (e.ngat && ok && (() => { const m = luoi.dauCum(b); if (m != null && m - b <= 1.6) { T = m; return true; } return false; })()) {
          // dau cum ke tiep (lan doc / cum tu sau)
        } else if (e.ngat && ok && luoi.den() < b + 1.2 && tHien < b + 1.2) {
          break;
        } else {
          while (k < can) {
            const m = ok ? luoi.sau(b + KHOANG_MIN - 0.001) : null;
            if (m == null) break;
            b = m; k++;
          }
          if (k === can) T = b;
          else {
            const cho = ok ? luoi.den() < b + 0.6 && tHien < b + 0.6 : false;
            if (cho) break;
            T = b + (can - k) * (ok ? luoi.ioi() : 0.15);
            nguon = k ? 'nl+ngoai' : 'ngoai';
          }
        }
      }
      // het cua so doc: don vao moc cuoi con trong cua so
      if (ch.tHet == null && ch.uocHet) { const h = ch.uocHet(); if (h != null) ch.tHet = h; }
      if (ch.tHet != null && truoc && e.cuaSo && T > ch.tHet + 0.02 && san == null) { T = truoc.T; nguon = truoc.nguon; }
      e.T = T; e.nguon = nguon;
      ch.giai++;
    }
  }
  function buocChuoi(ch, tHien, F) {
    if (!ch || ch.xong || ch.huy) return;
    giaiChuoi(ch, tHien);
    while (ch.i < ch.giai) {
      const e = ch.ds[ch.i];
      if (e.T > tHien + F / 2) break;
      try { e.fn(tHien); } catch (x) { canhBao('chuoi', x); }
      if (e.nhan !== false) ghiCat({ T: e.T, nhan: (e.nhan || ch.nhan), nguon: e.nguon, the: ch.the }, tHien);
      ch.i++;
    }
    if (ch.i >= ch.ds.length) ch.xong = true;
  }
  /** Lam het ngay (cue noi dung / het nhip): moi su kien con lai chay luon */
  function xongChuoi(ch) {
    if (!ch || ch.xong) return;
    while (ch.i < ch.ds.length) { try { ch.ds[ch.i].fn(st.tHien); } catch (x) {} ch.i++; }
    ch.xong = true;
  }

  // ================================================================== (E) go chu (dong chinh)
  function trongSo(ch) {
    if (!ch || /\s/.test(ch)) return 0;
    if (RE_NHO.test(ch) && ch !== 'っ' && ch !== 'ッ') return 0;
    if (RE_KANA.test(ch)) return 1;
    if (RE_HAN.test(ch)) return 2;
    if (/[A-Za-z0-9]/.test(ch)) return 0.5;
    return 0;
  }
  const BO_QUA = '.sk-vd-chips, .sk-np-chu-thich, .sk-np-doc, .sk-chip, .sk-ht-vai-tro, [aria-hidden="true"]:not(.sk-np-dau)';
  /** Danh sach buoc go cua cac don vi (moi don vi mot dong, go bang clip-path) */
  function dungBuoc(units) {
    const ds = [];
    units.forEach((u, ui) => {
      const them = (node, loai, rt) => {
        const s = node.nodeValue || '';
        let i = 0;
        for (const c of s) { ds.push({ u, ui, loai, node, i, len: c.length, c, rt: rt || null, w: loai === 'rt' ? (RE_NHO.test(c) && c !== 'っ' ? 0 : 1) : (loai === 'goc' ? 0 : trongSo(c)) }); i += c.length; }
      };
      const di = (el) => {
        for (const n of el.childNodes) {
          if (n.nodeType === 3) { if (n.nodeValue && n.nodeValue.trim()) them(n, 'chu'); continue; }
          if (n.nodeType !== 1) continue;
          if (n.matches && n.matches(BO_QUA)) continue;
          if (n.tagName === 'RP') continue;
          if (n.tagName === 'RUBY') {
            const rts = [...n.children].filter((x) => x.tagName === 'RT');
            const goc = [];
            const diGoc = (x) => { for (const m of x.childNodes) { if (m.nodeType === 3 && m.nodeValue.trim()) goc.push(m); else if (m.nodeType === 1 && m.tagName !== 'RT' && m.tagName !== 'RP') diGoc(m); } };
            diGoc(n);
            const coRt = rts.some((r) => r.textContent.trim());
            goc.forEach((m) => them(m, coRt ? 'goc' : 'chu'));
            if (ds.length && coRt) ds[ds.length - 1].ruby = n;
            rts.forEach((r) => { for (const m of r.childNodes) if (m.nodeType === 3 && m.nodeValue.trim()) them(m, 'rt', r); });
            continue;
          }
          di(n);
        }
      };
      di(u);
    });
    // khong co buoc nao co trong so: moi ky tu mot buoc
    if (ds.length && !ds.some((b) => b.w > 0)) ds.forEach((b) => { if (b.loai !== 'rt') b.w = 1; });
    return ds;
  }
  const rg = document.createRange();
  function hopKyTu(b) {
    try { rg.setStart(b.node, b.i); rg.setEnd(b.node, b.i + b.len); const r = rg.getBoundingClientRect(); return r.width || r.height ? r : null; } catch (e) { return null; }
  }
  /** Do vi tri moi buoc (mep phai so voi don vi / rt; hop so voi the) — cache theo kich thuoc don vi */
  function doBuoc(go, the) {
    const khoa = go.units.map((u) => u.offsetWidth + 'x' + u.offsetHeight).join(',');
    if (go.khoa === khoa && go.hopU) return;
    go.khoa = khoa;
    const R = the ? the.getBoundingClientRect() : { left: 0, top: 0 };
    const hopU = go.units.map((u) => { const r = u.getBoundingClientRect(); return { x: r.left - R.left, y: r.top - R.top, width: r.width, height: r.height, left: r.left }; });
    go.hopU = hopU;
    go.buoc.forEach((b) => {
      const r = hopKyTu(b);
      b.r = r ? { y: r.top - R.top, h: r.height } : null;
      if (b.loai === 'rt') {
        const rr = b.rt.getBoundingClientRect();
        b.x = r ? r.right - rr.left : 0;
      } else {
        const U = hopU[b.ui];
        let x = r ? r.right - U.left : 0;
        if (b.ruby) { const rb = b.ruby.getBoundingClientRect(); x = Math.max(x, rb.right - U.left); }
        b.x = x;
      }
    });
  }
  /** Ap trang thai go: k = so buoc da hien */
  function apGo(go, k) {
    doBuoc(go, go.the);
    const xU = go.units.map(() => -1);
    const rtDem = new Map();
    for (let j = 0; j < k; j++) {
      const b = go.buoc[j];
      if (b.loai === 'rt') rtDem.set(b.rt, Math.max(rtDem.get(b.rt) || 0, b.x));
      else xU[b.ui] = Math.max(xU[b.ui], b.x);
    }
    const het = k >= go.buoc.length;
    go.units.forEach((u, ui) => {
      const v = het ? '' : xU[ui] < 0 ? 'inset(0 100% 0 0)' : `inset(-1.4em ${Math.max(0, go.hopU[ui].width - xU[ui] - 1).toFixed(1)}px -0.7em -0.5em)`;
      if (u.style.clipPath !== v) u.style.clipPath = v;
    });
    go.rts.forEach((r) => {
      const x = rtDem.get(r);
      const w = r.getBoundingClientRect().width;
      const v = het || (x != null && x >= w - 0.5) ? '' : x == null ? 'inset(0 100% 0 0)' : `inset(-0.4em ${Math.max(0, w - x).toFixed(1)}px -0.4em -0.2em)`;
      if (r.style.clipPath !== v) r.style.clipPath = v;
    });
    go.k = k;
  }
  function boGo(go) {
    if (!go) return;
    go.units.forEach((u) => { u.style.clipPath = ''; });
    go.rts.forEach((r) => { r.style.clipPath = ''; });
  }
  function taoGo(ctl, units) {
    units = units.filter((u) => u && u.isConnected);
    if (!units.length) return null;
    const buoc = dungBuoc(units);
    if (!buoc.length) return null;
    const rts = [...new Set(buoc.filter((b) => b.rt).map((b) => b.rt))];
    const go = { the: ctl.the, units, buoc, rts, k: 0, khoa: '', hopU: null, chuoi: null, xong: false };
    // chi ghi kieu (khong doc bo cuc: dang trong tac vu dung the cua dao dien)
    units.forEach((u) => { u.style.clipPath = 'inset(0 100% 0 0)'; st.phanTu.add({ boStyle: u }); });
    rts.forEach((r) => { r.style.clipPath = 'inset(0 100% 0 0)'; st.phanTu.add({ boStyle: r }); });
    return go;
  }
  /** Bat dau go o T0 (cue): moi mora mot moc cua luoi; kana furigana go tung chu, goc ruby hien cung kana dau */
  function chayGo(ctl, go, T0, o) {
    if (!go || go.chuoi) return;
    o = o || {};
    const B = go.buoc;
    const ds = B.map((b, j) => ({ buoc: 0, cuaSo: true, nhan: false, cong: null,
      fn: () => { apGo(go, Math.max(go.k, j + 1)); datCaret(ctl, go); } }));
    // ky tu co trong so: sang moc thu round(trong so ky tu co trong so truoc) (>= 1)
    let wTruoc = 0;
    for (let j = 0; j < B.length; j++) {
      if (B[j].w > 0) { ds[j].buoc = wTruoc > 0 ? Math.max(1, Math.round(wTruoc)) : 0; wTruoc = B[j].w; }
    }
    // mot day goc ruby (trong so 0) di cung kana dau cua no: lay buoc cua ky tu co trong so ke tiep
    for (let j = 0; j < B.length; j++) {
      if (B[j].loai !== 'goc') continue;
      let k = j;
      while (k < B.length && B[k].w === 0) k++;
      if (k >= B.length) break;
      ds[j].buoc = ds[k].buoc;
      for (let z = j + 1; z <= k; z++) ds[z].buoc = 0;
      j = k;
    }
    // cong theo don vi (ngu phap): buoc dau cua moi don vi cho cue cua don vi do
    if (o.cong) {
      let truoc = -1;
      B.forEach((b, j) => { if (b.ui !== truoc) { truoc = b.ui; const g = o.cong(b.ui); if (g) ds[j].cong = g; } });
    }
    ds.forEach((e, j) => { e.nhan = j === 0 || e.buoc || e.cong ? (o.nhan || 'go') : false; });
    ds.push({ buoc: 0, fn: () => { go.xong = true; if (o.xong) o.xong(); }, nhan: false });
    go.chuoi = taoChuoi(ctl.the, T0, ds, { nhan: o.nhan || 'go', uocHet: o.uocHet });
  }

  // ------------------------------------------------------------------ con tro qua kho
  function taoCaret(ctl) {
    if (ctl.caret) return ctl.caret;
    const c = tao('i', 'pc7-caret', ctl.the);
    ctl.caret = c;
    return c;
  }
  function datCaret(ctl, go) {
    const c = ctl.caret;
    if (!c || !go || !ctl.the.isConnected) return;
    doBuoc(go, ctl.the);
    let b = null;
    for (let j = Math.min(go.k, go.buoc.length) - 1; j >= 0; j--) { if (go.buoc[j].loai !== 'rt') { b = go.buoc[j]; break; } }
    let x, top, h;
    if (b && b.r) {
      const U = go.hopU[b.ui];
      x = U.x + b.x; top = b.r.y; h = b.r.h;
    } else {
      const b0 = go.buoc.find((q) => q.loai !== 'rt' && q.r) || go.buoc[0];
      const U = go.hopU[b0 ? b0.ui : 0];
      x = U ? U.x : 0;
      top = b0 && b0.r ? b0.r.y : (U ? U.y : 0); h = b0 && b0.r ? b0.r.h : (U ? U.height : 40);
    }
    if (!(h > 0)) return;
    const w = kep(h * 0.085, 4, 14);
    const hh = h * 1.02;
    c.style.width = w.toFixed(1) + 'px';
    c.style.height = hh.toFixed(1) + 'px';
    c.style.translate = `${(x + Math.max(2, h * 0.04)).toFixed(1)}px ${(top + (h - hh) / 2).toFixed(1)}px`;
    c.classList.add('is-hien');
  }
  function anCaret(ctl) { if (ctl.caret) { ctl.caret.classList.remove('is-hien', 'is-go'); } }

  // ================================================================== (F) dong ca (4 mat)
  const KIEU_MAT = ['lenh', 'bong', 'dong', 'soan'];
  /** Chuoi dong ca: [{t, hl?, o?}] — MOT khai bao, moi mat dung lai y nguyen */
  function veMat(kieu, doan) {
    const m = document.createElement('div');
    m.className = 'pc7-mat is-' + kieu + ' is-cho';
    const dau = kieu === 'lenh' ? '<span class="pc7-mat-dau">$</span>' : kieu === 'dong' ? '<span class="pc7-mat-le" aria-hidden="true"></span>' : '';
    const duoi = kieu === 'soan' ? '<span class="pc7-mat-gui">↵</span>' : '';
    let h = '';
    doan.forEach((d) => {
      const lop = 'pc7-k' + (d.hl ? ' is-hl' : '') + (d.o ? ' is-o' : '');
      for (const c of kyTu(d.t)) h += c === ' ' ? '<span class="pc7-k is-cach"> </span>' : `<span class="${lop} is-cho">${c.replace(/[&<>]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[x]))}</span>`;
    });
    m.innerHTML = `${dau}<span class="pc7-mat-chu" lang="ja">${h}</span><i class="pc7-mat-tro"></i>${duoi}`;
    return m;
  }
  function taoDiep(ctl, cacDoan, neo) {
    if (!cacDoan || !cacDoan.length || !neo || !neo.isConnected) return null;
    const the = ctl.the;
    const R = the.getBoundingClientRect(), N = neo.getBoundingClientRect();
    const than = the.querySelector(':scope > .sk-the-than');
    const T = than ? than.getBoundingClientRect() : R;
    const canh = the.querySelector('.sk-canh');
    const khoi = canh && (canh.querySelector('.sk-chu-than > *') || canh.firstElementChild);
    const ghi = canh && canh.querySelector('.sk-chu-ghi');
    const nho = (window.innerWidth || 1024) <= 640;
    const fs = nho ? 21 : 26;
    const le = Math.max(16, Math.min(48, T.width * 0.05));
    const rongMax = T.width - 2 * le;
    const dai = Math.max(...cacDoan.map((d) => d.reduce((a, x) => a + kyTu(x.t).length * (x.o ? 0.62 : 1), 0)));
    const wMot = dai * fs + (nho ? 72 : 96);
    // dai trong DUOI noi dung (noi dung can giua doc: phan du chia tren / duoi) — dong ca o day khong che gi
    let D = null;
    if (khoi) {
      const K = khoi.getBoundingClientRect();
      const tren = K.bottom - R.top + 14;
      const gR = ghi ? ghi.getBoundingClientRect() : null;
      const duoi = (gR ? Math.min(ghi.dataset.co === '1' ? gR.top : gR.bottom, T.bottom) : T.bottom) - R.top - 6;
      const band = duoi - tren;
      const cao = nho ? 52 : 62;
      if (band >= cao + 4) {
        const hang = 4 * Math.max(wMot, 150) + 3 * 14 <= rongMax;
        const w = hang ? Math.min(rongMax, 4 * Math.max(wMot, 190) + 42) : Math.min(rongMax, Math.max(wMot, nho ? 300 : 440));
        D = { rieng: true, kieu: hang ? 'is-hang' : 'is-mot', x: T.left - R.left + (T.width - w) / 2, y: tren + Math.min(18, (band - cao) / 2), w, h: cao };
      }
    }
    if (!D) {
      // khong du cho: phu ngay duoi dong chinh (phan con lai chua hien) — cue noi dung toi thi dung ngay
      const w = Math.min(rongMax, Math.max(wMot, nho ? 300 : 440));
      let x = N.left - R.left;
      if (x + w > R.width - le) x = Math.max(le, R.width - le - w);
      D = { rieng: false, kieu: 'is-mot', x, y: N.bottom - R.top + Math.max(12, N.height * 0.16), w, h: nho ? 52 : 62 };
    }
    const lan = tao('div', 'pc7-diep ' + D.kieu, the);
    const mats = cacDoan.slice(0, 4).map((d, i) => { const m = veMat(KIEU_MAT[i % 4], d); lan.appendChild(m); return m; });
    lan.style.left = D.x.toFixed(1) + 'px';
    lan.style.top = D.y.toFixed(1) + 'px';
    lan.style.width = D.w.toFixed(1) + 'px';
    if (D.kieu === 'is-mot') lan.style.height = D.h.toFixed(1) + 'px';
    // co chu: vua o (hang 4 o / mot o), 20-34 px
    const oW = D.kieu === 'is-hang' ? (D.w - 42) / 4 : D.w;
    lan.style.setProperty('--pc7-fs', kep((oW - (nho ? 64 : 84)) / Math.max(1, dai), nho ? 17 : 20, nho ? 26 : 34).toFixed(1) + 'px');
    return { lan, mats, hai: D.kieu === 'is-hang', rieng: D.rieng, xong: false, catKhi: () => false };
  }
  function hienKyTu(m, n) {
    const ks = m.querySelectorAll('.pc7-mat-chu > .pc7-k:not(.is-cach)');
    ks.forEach((k, j) => { if (j < n) k.classList.remove('is-cho'); });
    const tro = m.querySelector('.pc7-mat-tro');
    if (tro) tro.classList.toggle('is-het', n >= ks.length);
  }
  function hienMat(D, i) {
    D.mats.forEach((m, j) => {
      if (j === i) { m.classList.remove('is-cho'); m.classList.add('is-nay'); }
      else { m.classList.remove('is-nay'); if (!D.hai) m.classList.add('is-cho'); else if (j < i) m.classList.add('is-qua'); }
    });
  }
  /** Dong ca bat dau o T (cue doc lan 2): mat 1 go mot mora / moc trong cua so doc, mat 2 go hai ky tu / moc,
   *  mat 3-4 chop mot moc, giu hai moc roi cat di -> ket() */
  function chayDiep(ctl, D, T, o) {
    o = o || {};
    const ds = [];
    D.mats.forEach((m, i) => {
      const n = m.querySelectorAll('.pc7-mat-chu > .pc7-k:not(.is-cach)').length;
      if (i === 0) {
        const ks = [...m.querySelectorAll('.pc7-mat-chu > .pc7-k:not(.is-cach)')];
        let wT = 0;
        ks.forEach((k, j) => {
          const w = trongSo(k.textContent);
          const buoc = j === 0 ? 0 : (w > 0 ? Math.max(1, Math.round(wT || 1)) : 0);
          if (w > 0) wT = w;
          ds.push({ buoc, ngat: j === 0 && !!o.cum, cuaSo: true, nhan: j === 0 || buoc ? 'diep-1' : false,
            fn: () => { if (j === 0) hienMat(D, 0); hienKyTu(m, j + 1); } });
        });
      } else if (i === 1) {
        const buocK = n > 8 ? 3 : 2;
        for (let j = 0; j < n; j += buocK) {
          const jj = j;
          ds.push({ buoc: 1, ngat: jj === 0, nhan: 'diep-2', fn: () => { if (jj === 0) hienMat(D, 1); hienKyTu(m, jj + buocK); } });
        }
      } else {
        ds.push({ buoc: 1, nhan: 'diep-' + (i + 1), fn: () => { hienMat(D, i); hienKyTu(m, n); } });
      }
    });
    ds.push({ buoc: 2, nhan: 'diep-ket', fn: () => { if (o.ket) o.ket(); } });
    const ch = taoChuoi(ctl.the, T, ds, { nhan: 'diep', uocHet: o.uocHet });
    D.chuoi = ch;
  }
  function goDiep(ctl) {
    const D = ctl.diep;
    if (!D) return;
    ctl.diep = null;
    if (D.chuoi) D.chuoi.huy = true;
    if (D.lan && D.lan.isConnected) D.lan.remove();
  }

  // ================================================================== (G) dong lenh (IV)
  function hienLenh(ctl, text, o) {
    o = o || {};
    if (!text || !ctl.the.isConnected) return;
    let L = ctl.lenh;
    if (!L || !L.isConnected) {
      L = tao('div', 'pc7-lenh', ctl.the);
      L.innerHTML = '<span class="pc7-lenh-dau">›</span><span class="pc7-lenh-chu"></span><i class="pc7-lenh-tro"></i>';
      ctl.lenh = L;
    }
    const chu = L.querySelector('.pc7-lenh-chu');
    if (chu.textContent !== text) {
      chu.textContent = text;
      if (RE_JP.test(text)) chu.lang = 'ja'; else chu.removeAttribute('lang');
    }
    L.title = text;
    datViTriLenh(ctl);
    if (L.classList.contains('is-hien')) return;
    L.classList.add('is-hien');
    if (giam()) hoat(L, [{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'linear' });
  }
  /** Dong lenh nam trong cho de san ngay duoi than the (margin-bottom cua than, css) */
  function datViTriLenh(ctl) {
    const L = ctl.lenh, than = ctl.the.querySelector(':scope > .sk-the-than');
    if (!L || !than) return;
    let du = 56;
    try { du = parseFloat(getComputedStyle(than).marginBottom) || 56; } catch (e) {}
    const y = than.offsetTop + than.offsetHeight + Math.max(2, (du - L.offsetHeight) / 2);
    const v = y.toFixed(1) + 'px';
    if (L.style.top !== v) L.style.top = v;
  }
  function textLenh(ctl) {
    const b = ctl.beat || {};
    const d = b.data || {};
    switch (ctl.kind) {
      case 'vocab': return `${d.kanji || d.word || ''}${d.kanji && d.furigana && d.furigana !== d.kanji ? ' (' + d.furigana + ')' : ''} = ${d.meaningVi || ''}`;
      case 'kanji': {
        if (d.loai === 'kana' || (window.SenseiCapDo && SenseiCapDo.laChuKana && SenseiCapDo.laChuKana(d))) return `${d.character || ''} = ${d.romaji || ''}${d.meaningVi ? ' · ' + d.meaningVi : ''}`;
        return `${d.character || ''} = ${d.hanViet || ''}${d.meaningVi ? ' · ' + d.meaningVi : ''}`;
      }
      case 'grammar-intro': return congThuc(d.grammarFormula, d.title);
      case 'example': return `${cauJp(d.tokens)} = ${d.meaningVi || ''}`;
      case 'kaiwa': return `${cauJp(d.tokens)} = ${d.meaningVi || ''}`;
      case 'kaiwa-run':
      case 'kaiwa-intro': {
        const ds = Array.isArray(b.data) ? b.data : [];
        const vai = [...new Set(ds.map((x) => x && String(x.speaker || '').replace(/\s*[(（].*$/, '').trim()).filter(Boolean))];
        return `${vai.join(' · ')} — ${ds.length} lượt thoại`;
      }
      default: return '';
    }
  }
  const cauJp = (toks) => (toks || []).map((t) => (t && (t.kanji || t.text)) || '').join('');
  /** "N1 [chủ đề] + は + N2 [...] + です" -> "N1 は N2 です" (cung cach dao dien rut ten mau) */
  function congThuc(fm, title) {
    const s = String(fm || '').split(/\s{2,}|　|\(|（| \/ |—|→| vs |=|;/)[0]
      .replace(/\[[^\]]*\]/g, ' ').replace(/\s*\+\s*/g, ' ').replace(/\s+/g, ' ').trim();
    return s || String(title || '').replace(/^\d+\.\s*/, '').trim();
  }
  /** Chuoi dong ca cua cong thuc: phan chu Nhat (co dinh) to; N1 / V / A... la o */
  function doanCongThuc(fm) {
    const out = [];
    String(fm || '').split(/(\s+)/).forEach((p) => {
      if (!p) return;
      if (/^\s+$/.test(p)) { out.push({ t: ' ' }); return; }
      p.split(/([぀-ヿ一-鿿々ー〜]+)/).forEach((q) => {
        if (!q) return;
        if (RE_JP.test(q)) out.push({ t: q, hl: true });
        else out.push({ t: q, o: true });
      });
    });
    return out;
  }
  function doanCau(toks) {
    const out = [];
    (toks || []).forEach((t) => { const s = (t && (t.kanji || t.text)) || ''; if (s) out.push({ t: s, hl: !!(t && t.isKeyGrammar) }); });
    return out;
  }

  // ================================================================== (H) the: vao / an dong phu / hien phan con
  function laySan() { return st.san && st.san.isConnected ? st.san : document.getElementById('sanKhauGiang'); }
  function theSong() {
    const s = laySan();
    const o = s && s.querySelector('.sk-o-the');
    if (!o) return null;
    for (const t of o.children) {
      if (t.classList.contains('sk-the') && !t.classList.contains('sk-ra') && !t.classList.contains('sk-the-truoc') && t.style.opacity !== '0') return t;
    }
    return null;
  }
  const PHU = {
    vocab: ['.sk-tv-trai', '.sk-tv-meta', '.sk-tv-nghia', '.sk-tv-phu', '.sk-chu-ghi'],
    'grammar-intro': ['.sk-np-ten', '.sk-np-duoi-the', '.sk-chu-ghi'],
    example: ['.sk-vd-nghia', '.sk-chu-ghi'],
  };
  /** Chuan bi the moi (ke ca the dung san trong khoang nghi): trang thai "mot dong mot minh" */
  function chuanBi(the) {
    if (CT.has(the)) return CT.get(the);
    const kind = the.dataset.kind || '';
    const ctl = { the, kind, nhip: null, beat: null, da: new Set(), cueT: Object.create(null), cueBo: new Set(), coCue: new Set(), pha: 'cho', go: null, diep: null, lenh: null, caret: null,
      an: [], tV0: null, tSong: null, chuyen: false, daHien: false, lat: null, quiz: null };
    CT.set(the, ctl);
    if (giam()) { ctl.pha = 'du'; ctl.lyDo = 'giam'; return ctl; }
    const phu = PHU[kind];
    if (!phu) { ctl.pha = 'du'; ctl.lyDo = 'loai'; return ctl; }
    const canh = the.querySelector('.sk-canh');
    if (!canh) { ctl.pha = 'du'; ctl.lyDo = 'canh'; return ctl; }
    let units = [];
    if (kind === 'vocab') units = [canh.querySelector('.sk-tv-tu')];
    else if (kind === 'grammar-intro') {
      const hang = canh.querySelector('.sk-np-cong .sk-np-hang');
      units = hang ? [...hang.querySelectorAll(':scope > .sk-np-muc')] : [canh.querySelector('.sk-np-cong .sk-np-vien, .sk-np-cong .sk-np-bien-demo')];
    } else if (kind === 'example') {
      units = [...canh.querySelectorAll('.sk-vd-cau > .sk-vd-tok')];
    }
    units = units.filter(Boolean);
    if (!units.length) { ctl.pha = 'du'; ctl.lyDo = 'don-vi'; return ctl; }
    ctl.go = taoGo(ctl, units);
    if (!ctl.go) { ctl.pha = 'du'; ctl.lyDo = 'go'; return ctl; }
    phu.forEach((s) => canh.querySelectorAll(s).forEach((e) => { ganLop(e, 'pc7-an'); ctl.an.push(e); }));
    ganLop(the, 'pc7-mot');
    taoCaret(ctl);
    ctl.pha = 'mot';
    return ctl;
  }
  /** Phan con lai cua the dung len: nhip cat -> cat; khac -> MOT lan truot easeOutExpo */
  function hienCon(ctl, lyDo, o) {
    if (ctl.daHien) { if (!(o && o.giuDiep) && ctl.diep && !ctl.diep.rieng && ctl.diep.catKhi(lyDo)) goDiep(ctl); return; }
    ctl.daHien = true;
    ctl.lyDo = lyDo || 'hien';
    if (ctl.go && !ctl.go.xong) { apGo(ctl.go, ctl.go.buoc.length); ctl.go.xong = true; if (ctl.go.chuoi) ctl.go.chuoi.huy = true; }
    if (ctl.diep && !ctl.diep.rieng && !(o && o.giuDiep)) goDiep(ctl);
    anCaret(ctl);
    goLop(ctl.the, 'pc7-mot');
    const ds = ctl.an.filter((e) => e.isConnected && e.classList.contains('pc7-an'));
    ds.forEach((e) => goLop(e, 'pc7-an'));
    ctl.pha = 'du';
    if (giam() || LOAI_CAT[ctl.kind] || !ds.length) return;
    ds.forEach((e) => {
      if (e.classList.contains('sk-an') && !e.classList.contains('sk-cho-doc')) return;   // chua toi luot: canh tu hien
      hoat(e, [{ translate: '0 22px', offset: 0 }, { translate: '0 0' }], { duration: TRUOT_MS, easing: E_EXPO });
    });
  }
  function khiChuyen(ctl) {
    if (ctl.lat) return;
    if (ctl.go && ctl.go.chuoi) xongChuoi(ctl.go.chuoi);
    if (ctl.diep && ctl.diep.chuoi) xongChuoi(ctl.diep.chuoi);
    goDiep(ctl);
    hienCon(ctl, 'chuyen');
    const t = textLenh(ctl);
    if (t) hienLenh(ctl, t);
    if (ctl.lenh) ganLop(ctl.the, 'pc7-khep');
  }

  // ------------------------------------------------------------------ cue -> hanh vi
  function durCue(id) {
    try {
      const nk = __motion.nhatKy();
      for (let i = nk.length - 1; i >= 0 && i > nk.length - 80; i--) if (nk[i].id === id && nk[i].dur) return nk[i].dur / 1000;
    } catch (e) {}
    return null;
  }
  /** Uoc het loi doc: dau khoang lang >= 90 ms sau T + 0.1 s */
  const uocHet = (T) => () => luoi.langSau(T + 0.1, 0.09);
  function batGo(ctl, T, id) {
    if (!ctl.go || ctl.go.chuoi || ctl.pha !== 'mot') return;
    ctl.pha = 'go';
    if (ctl.caret) ctl.caret.classList.add('is-go');
    let cong = null;
    if (ctl.kind === 'grammar-intro') {
      // don vi thu ui cua hang cong thuc <-> cue G3.j (o thu j) / G2.j (chu thu j)
      const ma = [];
      let jo = 0, jc = 0;
      ctl.go.units.forEach((u) => {
        if (u.querySelector('.sk-np-o')) ma.push('G3.' + jo++);
        else if (u.querySelector('.sk-np-lit')) ma.push('G2.' + jc++);
        else ma.push(null);
      });
      cong = (ui) => {
        const k = ma[ui];
        if (!k || !ctl.coCue.has(k)) return null;
        return () => (ctl.cueT[k] != null ? ctl.cueT[k] : ctl.cueBo.has(k) ? st.tHien : null);
      };
    }
    chayGo(ctl, ctl.go, T, {
      nhan: 'go-' + ctl.kind,
      cong,
      uocHet: ctl.kind === 'grammar-intro' ? null : uocHet(T),
      xong: () => {
        if (ctl.caret) ctl.caret.classList.remove('is-go');
        ctl.pha = 'da-go';
        ctl.tGoXong = st.tHien;
        if (ctl.muonDiep) batDiep(ctl, ctl.muonDiep, ctl.muonDiepO);
        else if (ctl.kind === 'grammar-intro') batDiep(ctl, st.tHien, { cum: true });   // Sensei doc lai cong thuc
      },
    });
  }
  function cacDoanDiep(ctl) {
    const b = ctl.beat || {};
    const d = b.data || {};
    if (ctl.kind === 'vocab') {
      const s = [{ t: d.kanji || d.word || '' }];
      return [s, s, s, s];
    }
    if (ctl.kind === 'grammar-intro') {
      const s = doanCongThuc(congThuc(d.grammarFormula, d.title));
      return [s, s, s, s];
    }
    if (ctl.kind === 'example') {
      let anh = [];
      try {
        anh = (__lecture.beats() || []).filter((x) => x && x.kind === 'example' && x.subIndex === b.subIndex && x.data && x.data.id !== d.id).map((x) => x.data);
      } catch (e) { anh = []; }
      const ds = [doanCau(d.tokens), ...anh.slice(0, 2).map((x) => doanCau(x.tokens))];
      const sl = b.slide || {};
      if (sl.grammarFormula) ds.push(doanCongThuc(congThuc(sl.grammarFormula, sl.title)));
      while (ds.length < 4 && ds.length) ds.push(ds[0]);
      return ds;
    }
    return null;
  }
  function batDiep(ctl, T, o) {
    if (giam() || ctl.daHien || ctl.diep || ctl.daDiep) return;
    if (ctl.pha === 'go' || ctl.pha === 'mot') { ctl.muonDiep = T; ctl.muonDiepO = o; return; }
    const neo = ctl.kind === 'vocab' ? ctl.the.querySelector('.sk-tv-tu')
      : ctl.kind === 'grammar-intro' ? ctl.the.querySelector('.sk-np-cong')
        : ctl.the.querySelector('.sk-vd-cau');
    const doan = cacDoanDiep(ctl);
    const D = taoDiep(ctl, doan, neo);
    if (!D) return;
    ctl.daDiep = true;
    ctl.diep = D;
    const Tb = Math.max(T, (ctl.tGoXong || 0) + 0.05);
    chayDiep(ctl, D, Tb, { cum: !!(o && o.cum), uocHet: o && o.cum ? null : uocHet(Tb), ket: () => { goDiep(ctl); hienCon(ctl, 'diep-ket'); } });
  }
  function khiCue(ctl, q, tHien) {
    const id = q.id || '';
    const T = isFinite(q.T) ? q.T : tHien;
    ctl.cueT[id] = T;
    if (/^(V0|G0|E0|K0)$/.test(id)) { if (ctl.tV0 == null) ctl.tV0 = T; return; }
    switch (ctl.kind) {
      case 'vocab':
        if (id === 'V1') batGo(ctl, T, 'V1');
        else if (id === 'V2' || id === 'V2b') batDiep(ctl, T);
        else if (/^V[345]/.test(id)) { henNoiDung(ctl, T, id); if (id === 'V3') hienLenh(ctl, textLenh(ctl)); }
        break;
      case 'grammar-intro':
        if (/^G(2|3|2p|M)\./.test(id)) { if (ctl.pha === 'mot') batGo(ctl, T, null); }
        else if (/^G[456]/.test(id)) { henNoiDung(ctl, T, id); hienLenh(ctl, textLenh(ctl)); }
        break;
      case 'example':
        if (id === 'E1') batGo(ctl, T, 'E1');
        else if (id === 'E2') batDiep(ctl, T);
        else if (/^E[345]/.test(id)) { henNoiDung(ctl, T, id); if (id === 'E5') hienLenh(ctl, textLenh(ctl)); }
        break;
      case 'kanji':
        if (/^K3/.test(id)) hienLenh(ctl, textLenh(ctl));
        break;
      case 'kaiwa':
        if (id === 'F4') hienLenh(ctl, textLenh(ctl));
        break;
      default: break;
    }
  }
  /** Cue noi dung toi: dong phu cua canh sap hien -> the phai day du NGAY (khong bao gio tre cue) */
  function henNoiDung(ctl, T, id) {
    // vi du: ghep (E3) / doc tro tu (E4) o hang cong thuc phia tren — dong ca duoi cau chay tiep; nghia (E5) thi dung
    const giuDiep = ctl.kind === 'example' && !/^E5/.test(id || '');
    if (ctl.daHien) { if (!giuDiep && ctl.diep && !ctl.diep.rieng) goDiep(ctl); return; }
    if (ctl.go && ctl.go.chuoi) xongChuoi(ctl.go.chuoi);
    hienCon(ctl, 'cue ' + (id || ''), { giuDiep });
  }

  // ------------------------------------------------------------------ moi khung hinh
  function lenSong(the, TT) {
    const ctl = chuanBi(the);
    ctl.nhip = TT ? TT.nhip : null;
    ctl.tSong = st.tHien;
    try { const B = window.__lecture && __lecture.beats ? __lecture.beats() : null; ctl.beat = B && ctl.nhip != null ? B[ctl.nhip] : null; } catch (e) { ctl.beat = null; }
    if (TT && TT.cues) TT.cues.forEach((q) => { ctl.coCue.add(q.id); if (q.tt === 'da') ctl.da.add(q.id); });
    // cue da ban truoc luc the hien (vd V0): xu ly lai
    if (TT && TT.cues) TT.cues.forEach((q) => { if (q.tt === 'da') khiCue(ctl, q, st.tHien); });
    return ctl;
  }
  function buocCanh(tHien, F) {
    const TT = trangThai();
    const the = theSong();
    if (the !== st.theNay) {
      st.theNay = the;
      if (the && !CT.get(the) || (the && CT.get(the).nhip == null)) lenSong(the, TT);
    }
    const ctl = the ? CT.get(the) : null;
    if (!ctl) return;
    const cung = TT && TT.nhip === ctl.nhip;
    if (cung && !ctl.lat) {
      for (const q of TT.cues || []) {
        if (q.tt === 'da' && !ctl.da.has(q.id)) { ctl.da.add(q.id); try { khiCue(ctl, q, tHien); } catch (e) { canhBao('cue', e); } }
        else if (q.tt === 'bo' && !ctl.cueBo.has(q.id)) ctl.cueBo.add(q.id);
      }
      if (TT.che === 'chuyen' && !ctl.chuyen) { ctl.chuyen = true; khiChuyen(ctl); }
    }
    // luoi an toan: loi doc dong chinh khong nghe ra
    if (ctl.pha === 'mot' && !ctl.chuyen) {
      const moc = ctl.tV0 != null ? ctl.tV0 + (ctl.kind === 'grammar-intro' ? 4.5 : 3.5) : (ctl.tSong != null ? ctl.tSong + 8 : null);
      if (moc != null && tHien > moc) batGo(ctl, tHien, null);
    }
    if (ctl.pha === 'mot' || ctl.pha === 'go') datCaret(ctl, ctl.go);
    // go xong ma khong co dong ca / cue noi dung trong 2.5 s: phan con lai dung len
    if (ctl.pha === 'da-go' && !ctl.diep && !ctl.muonDiep && ctl.tGoXong != null && tHien > ctl.tGoXong + 2.5) hienCon(ctl, 'cho-lau');
    if (ctl.go && ctl.go.chuoi) buocChuoi(ctl.go.chuoi, tHien, F);
    if (ctl.diep && ctl.diep.chuoi) buocChuoi(ctl.diep.chuoi, tHien, F);
    if (ctl.lat && ctl.lat.chuoi) buocChuoi(ctl.lat.chuoi, tHien, F);
    if (ctl.quiz) buocQuiz(ctl);
    if (ctl.lenh) datViTriLenh(ctl);
  }

  // ================================================================== (I) the chuong / ket bai = reel
  function mucReel(lat) {
    let ds = [];
    if (lat.classList.contains('sk-the-chuong')) {
      ds = [...lat.querySelectorAll('.sk-tc-muc > li:not(.is-them)')].map((li) => {
        const sp = [...li.children].filter((x) => !x.matches('.sk-tc-so, .sk-tc-vai-chu'));
        return (sp.length ? sp[sp.length - 1].textContent : li.textContent).trim();
      });
    } else {
      lat.querySelectorAll('.sk-tx-mau').forEach((m) => {
        const s = m.textContent.replace(/…/g, '').trim();
        if (!s) return;
        (s.includes(' · ') ? s.split(' · ') : s.split(/\s+/)).forEach((x) => { if (x.trim()) ds.push(x.trim()); });
      });
    }
    return ds.filter(Boolean);
  }
  function lenhLat(lat) {
    if (lat.classList.contains('sk-the-chuong')) {
      const ten = (lat.querySelector('.sk-tc-ten') || {}).textContent || '';
      const meta = (lat.querySelector('.sk-tc-meta') || {}).textContent || '';
      return `${ten.trim()}${meta.trim() ? ' · ' + meta.trim() : ''}`;
    }
    const ten = (lat.querySelector('.sk-tx-ten') || {}).textContent || '';
    const so = [...lat.querySelectorAll('.sk-tx-so')].map((x) => x.textContent.trim()).filter(Boolean).slice(0, 3);
    return `${ten.trim()}${so.length ? ' · ' + so.join(' · ') : ''}`;
  }
  function khiLat(the, lat) {
    const ctl = CT.get(the) || chuanBi(the);
    // do cua nhip cu (con tro qua kho, dong ca, dong lenh) cat di CUNG luc noi dung cu (LAT_CAT)
    const cu = [ctl.caret, ctl.lenh, ctl.diep && ctl.diep.lan, ctl.quiz && ctl.quiz.tro, ctl.quiz && ctl.quiz.vong].filter((x) => x && x.isConnected);
    if (ctl.go && ctl.go.chuoi) ctl.go.chuoi.huy = true;
    if (ctl.diep && ctl.diep.chuoi) ctl.diep.chuoi.huy = true;
    cu.forEach((x) => {
      let op = 1;
      try { op = parseFloat(getComputedStyle(x).opacity); } catch (e) {}
      x.style.opacity = '0';
      if (!giam() && op > 0.01) hoat(x, [{ opacity: op }, { opacity: op }], { duration: LAT_CAT, easing: 'linear' });
      setTimeout(() => { try { x.remove(); } catch (e) {} }, LAT_CAT + 60);
    });
    Object.assign(ctl, { caret: null, lenh: null, diep: null, go: null, quiz: null, pha: 'lat', daHien: true });
    goLop(the, 'pc7-mot');
    // lui mo cua nhip cu giu toi luc noi dung cu cat di
    if (giam()) goLop(the, 'pc7-khep'); else setTimeout(() => goLop(the, 'pc7-khep'), LAT_CAT);
    const L = { lat, chuoi: null, reel: null };
    ctl.lat = L;
    const lenh = lenhLat(lat);
    if (giam()) { hienLenh(ctl, lenh); return; }
    const ds = mucReel(lat);
    const laXong = lat.classList.contains('sk-the-xong');
    const P = luoi.chuKy();
    const n = laXong ? Math.min(ds.length, 14) : Math.min(ds.length, Math.max(3, Math.min(6, Math.floor((1.5 - 0.45) / P))));
    if (n < 2) { hienLenh(ctl, lenh); return; }
    // chon muc trai deu ca chuong (the hien be rong cua chuong)
    const chon = [];
    for (let i = 0; i < n; i++) chon.push(ds[Math.round(i * (ds.length - 1) / Math.max(1, n - 1))]);
    ganLop(lat, 'pc7-reel-dang');
    const r = tao('div', 'pc7-reel', lat);
    r.innerHTML = '<span class="pc7-reel-dem"></span><span class="pc7-reel-chu"></span><i class="pc7-reel-tro"></i><span class="pc7-reel-vach"><i></i></span>';
    L.reel = r;
    const chu = r.querySelector('.pc7-reel-chu'), dem = r.querySelector('.pc7-reel-dem'), vach = r.querySelector('.pc7-reel-vach > i');
    // luoi reel: chu ky P (boi so khoang mora), khoa pha vao moc cuoi cua tieng Sensei
    const Tv = dongHo() + LAT_CAT / 1000;
    const moc = NL.moc.length ? NL.moc[NL.moc.length - 1] : null;
    let T0 = Tv;
    if (moc != null && luoi.ok() && Tv - moc < 6) T0 = moc + Math.ceil((Tv - moc) / P) * P;
    const tong = ds.length;
    const ev = chon.map((s, i) => ({ T: T0 + i * P, s, i }));
    const nguon = moc != null && luoi.ok() ? 'nhip' : 'nhip-uoc';
    ev.forEach((e) => henCat(e.T, () => {
      chu.textContent = e.s;
      if (RE_JP.test(e.s)) chu.lang = 'ja'; else chu.removeAttribute('lang');
      const k = Math.round(e.i * (tong - 1) / Math.max(1, n - 1)) + 1;
      dem.textContent = String(k).padStart(2, '0') + ' / ' + String(tong).padStart(2, '0');
      vach.style.scale = (k / tong).toFixed(3) + ' 1';
      r.classList.add('is-hien');
    }, 'reel', nguon, the));
    // khung cuoi: noi dung the chuong / ket bai + dong lenh (cung mot moc)
    henCat(T0 + n * P, () => {
      r.remove();
      goLop(lat, 'pc7-reel-dang');
      hienLenh(ctl, lenh);
    }, 'reel-ket', nguon, the);
  }

  // ================================================================== (J) bai tap: con tro "bam" dap an dung
  function khiDapAn(the) {
    const ctl = CT.get(the) || chuanBi(the);
    if (ctl.quiz || !the.isConnected) return;
    const card = [...the.querySelectorAll('.qz-card')].find((c) => c.getAttribute('aria-hidden') !== 'true' && c.querySelector('.qz-opt.is-correct, .qz-opt.is-answer'));
    if (!card) return;
    const dung = card.querySelector('.qz-opt.is-correct, .qz-opt.is-answer');
    const chon = card.querySelector('.qz-opt.is-wrong') || dung;
    const tro = tao('i', 'pc7-tro-bam', the);
    const vong = tao('i', 'pc7-vong', the);
    const Q = { card, dung, chon, tro, vong, luc: performance.now(), bam: false };
    ctl.quiz = Q;
    datTroQuiz(Q, the, chon);
    tro.classList.add('is-hien');
    if (giam()) {
      datTroQuiz(Q, the, dung);
      hoat(tro, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'linear' });
      bamQuiz(Q, the, true);
      return;
    }
    const tu = tro.style.translate;
    datTroQuiz(Q, the, dung);
    const di = chon !== dung;
    if (di) hoat(tro, [{ translate: tu }, { translate: tro.style.translate }], { duration: TRUOT_MS, easing: E_EXPO });
    setTimeout(() => bamQuiz(Q, the, false), di ? TRUOT_MS - 60 : 260);
  }
  function datTroQuiz(Q, the, opt) {
    const R = the.getBoundingClientRect(), o = opt.getBoundingClientRect();
    const h = kep(o.height * 0.62, 22, 64);
    const w = kep(h * 0.16, 5, 11);
    Q.tro.style.width = w.toFixed(1) + 'px';
    Q.tro.style.height = h.toFixed(1) + 'px';
    Q.tro.style.translate = `${(o.right - R.left - w - Math.min(26, o.width * 0.05)).toFixed(1)}px ${(o.top - R.top + (o.height - h) / 2).toFixed(1)}px`;
    Q.vong.style.width = (o.width + 8).toFixed(1) + 'px';
    Q.vong.style.height = (o.height + 8).toFixed(1) + 'px';
    Q.vong.style.translate = `${(o.left - R.left - 4).toFixed(1)}px ${(o.top - R.top - 4).toFixed(1)}px`;
  }
  function bamQuiz(Q, the, ngay) {
    if (Q.bam || !the.isConnected) return;
    Q.bam = true;
    Q.vong.classList.add('is-hien');
    Q.tro.classList.add('is-bam');
    if (!ngay) hoat(Q.tro, [{ scale: '1 1' }, { scale: '.7 .86', offset: 0.35 }, { scale: '1 1' }], { duration: 240, easing: E_EXPO });
  }
  function buocQuiz(ctl) {
    const Q = ctl.quiz;
    if (!Q || !Q.dung.isConnected || !ctl.the.isConnected) return;
    if (performance.now() - Q.luc > 4000) return;
    const dangDi = Q.tro.getAnimations().some((a) => a.playState === 'running');
    if (!dangDi) datTroQuiz(Q, ctl.the, Q.bam || Q.chon === Q.dung ? Q.dung : Q.chon);
  }

  // ================================================================== (K) boc animate
  const co = (f, k) => f && Object.prototype.hasOwnProperty.call(f, k);
  function laCat(el) {
    const t = el.closest && el.closest('.sk-o-the > .sk-the');
    return !!(t && LOAI_CAT[t.dataset.kind]);
  }
  /** Giu trang thai dau (keyframe tu) roi nhay dung moc T (lich rAF huy hoat anh giu -> ve trang thai cuoi) */
  function giuToi(el, kfTu, T, nhan, nguon) {
    const the = el.closest ? el.closest('.sk-o-the > .sk-the') : null;
    if (T <= st.tHien + st.F / 2) return null;
    const a = goi(el, [kfTu, kfTu], { duration: 2000, fill: 'backwards', easing: 'linear' });
    if (!a) return null;
    st.anims.add(a);
    const bo = () => st.anims.delete(a);
    a.addEventListener('finish', bo); a.addEventListener('cancel', bo);
    henCat(T, () => { try { a.cancel(); } catch (e) {} }, nhan, nguon, the);
    return a;
  }
  /** Moc cat cho mot doi trong nhip cat: moc ke tiep trong 160 ms (hoac ngay) */
  function mocCat(tMuon) {
    if (!luoi.ok()) return { T: tMuon, nguon: 'cue' };
    const m = luoi.gan(tMuon, 0.06, 0.09);
    if (m != null) return { T: m, nguon: 'nl' };
    const s = luoi.sau(tMuon);
    if (s != null && s - tMuon <= 0.16) return { T: s, nguon: 'nl' };
    return { T: tMuon, nguon: 'cue' };
  }
  function tuKhung(f0) {
    const k = {};
    ['translate', 'scale', 'opacity'].forEach((p) => { if (co(f0, p)) k[p] = f0[p]; });
    return k;
  }
  function doi(el, kf, o) {
    const f0 = kf[0], n = kf.length, cl = el.classList;
    if (!cl) return undefined;
    // 1. Khung the cua dao dien: vao / ra / cung slide -> CAT (nhip cat) hoac cat + truot expo
    if (el.matches('.sk-o-the > .sk-the')) {
      const cat = !!LOAI_CAT[el.dataset.kind];
      if (n === 1 && f0.opacity === 0 && o.easing !== 'linear') {
        const tre = Math.min(o.delay || 0, THE_CAT);
        if (cat || !co(f0, 'translate')) {
          el.__den = performance.now() + tre + 60;
          return goi(el, [{ opacity: 0 }, { opacity: 0 }], { delay: tre, duration: 1, fill: 'backwards', easing: 'linear' });
        }
        el.__den = performance.now() + tre + TRUOT_MS;
        return goi(el, [{ opacity: 0, translate: '40px 0', offset: 0 }, { opacity: 1, translate: '40px 0', offset: 0.001, easing: E_EXPO }, { opacity: 1, translate: '0 0' }],
          { delay: tre, duration: TRUOT_MS, fill: 'backwards', easing: 'linear' });
      }
      if (n === 2 && kf[1].opacity === 0) return goi(el, [{ opacity: 1 }, { opacity: 1 }], { duration: Math.min(o.duration || THE_CAT, THE_CAT), fill: 'backwards', easing: 'linear' });
      return undefined;
    }
    // 2. Cung slide: khoi cu lui -24px -> giu roi cat cung luc the moi
    if (n === 2 && kf[1].opacity === 0 && kf[1].translate === '-24px 0') {
      return goi(el, [{ opacity: 1 }, { opacity: 1 }], { duration: THE_CAT, fill: 'backwards', easing: 'linear' });
    }
    // 3. Lat the chuong / ket bai: noi dung cu giu roi cat; noi dung moi cat vao dung LAT_CAT
    if (el.parentElement && el.parentElement.classList.contains('sk-the-than') && n === 2 && kf[1].opacity === 0 && !co(kf[1], 'translate') && o.duration === LAT_CAT) {
      return goi(el, [{ opacity: 1 }, { opacity: 1 }], { duration: Math.min(o.duration || LAT_CAT, LAT_CAT), fill: 'backwards', easing: 'linear' });
    }
    if (cl.contains('sk-the-lat') && n === 1 && f0.opacity === 0) {
      return goi(el, [{ opacity: 0 }, { opacity: 0 }], { delay: o.delay || 0, duration: 1, fill: 'backwards', easing: 'linear' });
    }
    // 4. Day phim: truot easeOutExpo (chinh xac, mot lan)
    if (cl.contains('sk-phim-ray') && n === 1 && co(f0, 'translate')) {
      return goi(el, kf, Object.assign({}, o, { duration: TRUOT_MS, easing: E_EXPO }));
    }
    const cat = laCat(el);
    // 5. Con tro doc cua dao dien (.sk-con-tro): karaoke / nhan manh
    if (cl.contains('sk-con-tro') && cat && !co(f0, 'translate') && (f0.opacity === 0 || (n === 2 && kf[1].opacity === 0))) return rong(el, o);
    if (cl.contains('sk-con-tro') && n === 1 && co(f0, 'translate')) {
      if (!cat) return goi(el, kf, Object.assign({}, o, { easing: E_EXPO, duration: Math.max(o.duration || 260, 300) }));
      const the = el.parentElement;
      const tok = the && the.__ctEl;
      let T = tok ? st.tokT.get(tok) : null;
      let nguon = 'karaoke';
      if (T != null && luoi.ok()) { const m = luoi.gan(T, 0.05, 0.05); if (m != null) { T = m; nguon = 'nl'; } }
      if (T == null) { const x = mocCat(dongHo() + 0.04); T = x.T; nguon = x.nguon; }
      return giuToi(el, tuKhung(f0), T, 'tro-doc', nguon) || rong(el, o);
    }
    // 6. Con tro canh chu (.sk-chu-tro > b, 6 manh): nhip cat -> cung nhay dung moc; khac -> truot expo
    if (el.tagName === 'B' && el.parentElement && el.parentElement.classList.contains('sk-chu-tro') && n === 1 && co(f0, 'translate')) {
      if (!cat) return goi(el, kf, Object.assign({}, o, { easing: E_EXPO, duration: Math.max(o.duration || 260, 300) }));
      const now = performance.now();
      if (!st.nhomTro || now - st.nhomTro.luc > 2) st.nhomTro = Object.assign({ luc: now }, mocCat(dongHo() + 0.04), { dau: true });
      const g = st.nhomTro;
      const nh = g.dau ? 'tro-doc' : null;
      g.dau = false;
      return giuToi(el, tuKhung(f0), g.T, nh, g.nguon) || rong(el, o);
    }
    if (cl.contains('sk-chu-tro') && cat) return rong(el, o);
    // 7. Dong phu hien (canh / dao dien: opacity 0 + 6px): nhip cat -> cat dung moc; khac -> truot expo
    if (n === 1 && f0.opacity === 0 && (f0.translate === '0 6px' || f0.translate === '0 4px')) {
      if (cat) { const x = mocCat(dongHo() + 0.03); return giuToi(el, { opacity: 0 }, x.T, 'hien', x.nguon) || rong(el, o); }
      return goi(el, [{ opacity: 0, translate: '0 16px', offset: 0 }, { opacity: 1, translate: '0 16px', offset: 0.001, easing: E_EXPO }, { opacity: 1, translate: '0 0' }],
        Object.assign({}, o, { duration: TRUOT_MS - 80, easing: 'linear' }));
    }
    // 8. Hoi thoai: cau moi vao / o "cau truoc" -> cat
    if (cat && (cl.contains('sk-ht-dong') || cl.contains('sk-ht-truoc')) && n === 1) return rong(el, o);
    if (cat && cl.contains('sk-cho-chu') && n === 1) return rong(el, o);
    return undefined;
  }
  function taoBocAnim(goc) {
    return function animate(kf, o) {
      if (st.bat && Array.isArray(kf) && kf.length && o && typeof o === 'object' && !o.pseudoElement) {
        try {
          if (this.closest && this.closest(SEL) && !giam()) {
            const r = doi(this, kf, o);
            if (r) return r;
          }
        } catch (e) { /* loi phong cach: hoat anh goc */ }
      }
      return goc.call(this, kf, o);
    };
  }

  // ================================================================== (L) quan sat san khau
  function khiDoi(ds) {
    if (!st.bat) return;
    for (const m of ds) {
      const t = m.target;
      if (m.type === 'attributes' && t === st.san && m.attributeName === 'hidden') { if (!t.hidden) chayVong(); continue; }
      if (m.type === 'childList') {
        for (const n of m.addedNodes) {
          if (n.nodeType !== 1) continue;
          if (n.classList.contains('sk-the') && n.parentElement && n.parentElement.classList.contains('sk-o-the')) { try { chuanBi(n); } catch (e) { canhBao('chuan bi', e); } }
          else if (n.classList.contains('sk-the-lat')) { const the = n.closest('.sk-o-the > .sk-the'); if (the) { try { khiLat(the, n); } catch (e) { canhBao('lat', e); } } }
        }
        continue;
      }
      if (m.type === 'attributes' && m.attributeName === 'class' && t.classList && t.classList.contains('qz-opt') && (t.classList.contains('is-correct') || t.classList.contains('is-answer'))) {
        const the = t.closest('.sk-o-the > .sk-the');
        if (the && !(CT.get(the) || {}).quiz) { try { khiDapAn(the); } catch (e) { canhBao('dap an', e); } }
      }
    }
    chayVong();
  }
  function ganSan(s) {
    st.san = s;
    if (s.dataset.phongCach !== TEN) s.dataset.phongCach = TEN;
    st.mo = new MutationObserver(khiDoi);
    st.mo.observe(s, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    s.querySelectorAll('.sk-o-the > .sk-the').forEach((t) => { try { chuanBi(t); } catch (e) {} });
    chayVong();
  }

  // ================================================================== (M) bat / tat
  function batDau(stageEl) {
    if (st.bat) ketThuc(st.san);
    st.bat = true;
    datLaiNL();
    if (!st.bocAnim) {
      st.gocAnim = Element.prototype.animate;
      st.bocAnim = taoBocAnim(st.gocAnim);
      Element.prototype.animate = st.bocAnim;
    }
    // hu.karaoke: moc tung token (dong ho dao dien) cho con tro nhay dung moc
    const SM = window.SenseiMotion;
    if (SM && SM.hu && typeof SM.hu.karaoke === 'function' && !st.bocKaraoke) {
      st.hu = SM.hu;
      st.gocKaraoke = SM.hu.karaoke;
      const goc = st.gocKaraoke;
      st.bocKaraoke = function (toks, times, o) {
        if (st.bat) {
          try {
            const ds = (Array.isArray(toks) ? toks : [...(toks || [])]).filter(Boolean);
            const now = dongHo();
            ds.forEach((t, k) => {
              const v = Number(times && times[Math.min(k, times.length - 1)]);
              if (isFinite(v)) st.tokT.set(t, o && o.tuongDoi ? now + v / 1000 : v);
            });
          } catch (e) {}
        }
        return goc.apply(this, arguments);
      };
      SM.hu.karaoke = st.bocKaraoke;
    }
    // Nang luong: chi doc, chuyen tiep nguyen ven toi bo khau hinh
    const KH = window.SenseiKhauHinh;
    if (KH && typeof KH.nap === 'function' && !st.bocNap) {
      st.kh = KH;
      st.gocNap = KH.nap;
      st.gocXoa = KH.xoa;
      const gn = st.gocNap, gx = st.gocXoa;
      st.bocNap = function (x, t0, sr) {
        let r;
        try { r = gn.apply(this, arguments); }
        finally { if (st.bat) { try { napNL(x, t0, sr); } catch (e) { canhBao('nang luong', e); } } }
        return r;
      };
      st.bocXoa = function () {
        try { if (st.bat) catNL(); } catch (e) {}
        return typeof gx === 'function' ? gx.apply(this, arguments) : undefined;
      };
      KH.nap = st.bocNap;
      if (typeof gx === 'function') KH.xoa = st.bocXoa;
    }
    const s = stageEl && stageEl.isConnected ? stageEl : document.getElementById('sanKhauGiang');
    if (s) { ganSan(s); return; }
    // san khau do dao dien tao muon: cho no xuat hien
    if (window.MutationObserver && document.body) {
      st.moCho = new MutationObserver(() => {
        const x = document.getElementById('sanKhauGiang');
        if (!x || !st.bat) return;
        st.moCho.disconnect(); st.moCho = null;
        ganSan(x);
      });
      st.moCho.observe(document.body, { childList: true, subtree: true });
    }
  }

  function ketThuc(stageEl) {
    st.bat = false;
    if (st.raf) { cancelAnimationFrame(st.raf); st.raf = 0; }
    if (st.mo) { try { st.mo.disconnect(); } catch (e) {} st.mo = null; }
    if (st.moCho) { try { st.moCho.disconnect(); } catch (e) {} st.moCho = null; }
    LICH.length = 0;
    // tra lai cac ham da boc (lop khac boc chong len tren: de lai boc cua minh o trang thai tat -> chuyen tiep)
    if (st.bocAnim && Element.prototype.animate === st.bocAnim) { Element.prototype.animate = st.gocAnim; st.bocAnim = null; }
    if (st.hu && st.bocKaraoke && st.hu.karaoke === st.bocKaraoke) { st.hu.karaoke = st.gocKaraoke; st.bocKaraoke = null; }
    if (st.kh) {
      if (st.bocNap && st.kh.nap === st.bocNap) { st.kh.nap = st.gocNap; st.bocNap = null; }
      if (st.bocXoa && st.kh.xoa === st.bocXoa) { st.kh.xoa = st.gocXoa; st.bocXoa = null; }
    }
    // hoat anh cua pc7 (giu / truot): ve trang thai cuoi
    st.anims.forEach((a) => { try { a.finish(); } catch (e) { try { a.cancel(); } catch (x) {} } });
    st.anims.clear();
    const s = stageEl && stageEl.isConnected ? stageEl : laySan();
    // go phan tu / lop / kieu pc7
    st.phanTu.forEach((x) => {
      if (x && x.boStyle) { try { x.boStyle.style.clipPath = ''; } catch (e) {} return; }
      try { x.remove(); } catch (e) {}
    });
    st.phanTu.clear();
    st.lopGan.forEach((lops, el) => lops.forEach((l) => { try { el.classList.remove(l); } catch (e) {} }));
    st.lopGan.clear();
    if (s) {
      s.querySelectorAll('.pc7-caret, .pc7-diep, .pc7-lenh, .pc7-reel, .pc7-tro-bam, .pc7-vong').forEach((x) => x.remove());
      s.querySelectorAll('[class*="pc7-"]').forEach((x) => [...x.classList].filter((c) => c.startsWith('pc7-')).forEach((c) => x.classList.remove(c)));
      s.querySelectorAll('rt, .sk-tv-tu, .sk-np-muc, .sk-np-vien, .sk-np-bien-demo, .sk-vd-tok').forEach((x) => { if (x.style.clipPath) x.style.clipPath = ''; });
      if (s.dataset && s.dataset.phongCach === TEN) delete s.dataset.phongCach;
    }
    st.theNay = null; st.nhomTro = null; st.san = null;
    datLaiNL();
  }

  // Kiem thu / chan doan
  window.__pc7 = {
    nhatKy: () => st.nhatKy.slice(),
    xoaNhatKy: () => { st.nhatKy.length = 0; },
    luoi: (n) => ({ moc: NL.moc.slice(-(n || 400)), lang: NL.lang.slice(-80), den: NL.den, ioi: luoi.ioi(), chuKy: luoi.chuKy(), ok: luoi.ok() }),
    trangThai: () => {
      const t = theSong();
      const c = t ? CT.get(t) : null;
      return { bat: st.bat, kind: c ? c.kind : null, pha: c ? c.pha : null, lyDo: c ? c.lyDo || null : null, nhip: c ? c.nhip : null, lich: LICH.length, F: +(st.F * 1000).toFixed(2),
        boc: { anim: Element.prototype.animate === st.bocAnim && !!st.bocAnim, karaoke: !!(st.hu && st.hu.karaoke === st.bocKaraoke && st.bocKaraoke),
          nap: !!(st.kh && st.kh.nap === st.bocNap && st.bocNap) } };
    },
  };

  window.SenseiPhongCach = window.SenseiPhongCach || {};
  window.SenseiPhongCach[TEN] = { ten: 'Reel dòng lệnh', batDau, ketThuc };
})();
