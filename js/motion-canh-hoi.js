/* ==========================================================================
   San khau giang — canh HOI THOAI + BAI TAP (motion spec §3.5–3.8 + bo sung v2, Builder C)

   Bo sung v2 thang spec goc o moi cho vuong: moi nhip la MOT the trinh chieu (.sk-the cua
   dao dien); module nay chi dung RUOT the (.sk-hoi-noi). Dao dien chua boc the thi ruot tu
   ve mat the (css/motion-hoi.css, muc "the du phong").

   kaiwa-intro : trai = dan nhan vat, phai = mach 10 luot (mo nhat, sang dan theo loi Sensei)
   kaiwa-run   : ca doan bang giong nhan vat — MOT cau lon, cau truoc mo nhat phia tren;
                 karaoke = con tro doc truot tung token theo PCM that cua clip
   kaiwa       : mo xe mot cau — nghe lai (karaoke), Sensei doc cham, nhan vai tro token trong tam
   quiz        : cau hoi + 4 dap an lon; den luot hoc vien thi THE THAT #card-<id> duoc dua sang
                 (portal) dung cho do tren san khau, tra ve luoi khi raCho / tam dung / dung.

   Mot diem nhin: moi nhan manh / karaoke la MOT con tro doc truot 260 ms — con tro cua the do dao
   dien v2 lo (c.theV2: hu.nhan / hu.karaoke); dao dien cu thi canh tu co mot con tro (.sk-ht-con-tro).
   Trao tay bai tap: dao dien v2 tu mo cong .sk-cong (vaoCho(xong, giua, {card}) — canh khong co o
   .sk-bt-vo nen nhuong: ban mau cung khung .sk-cong mo di, the that hien dung cho); ban co {cong} thi
   canh nhuong qua nhuongCong; dao dien cu thi canh tu dua the that sang (.sk-bt-that).
   Vua khung (v2): lop dat tren goc canh, :has() cua than the ap cho ca ban mau lan the that —
   .sk-bt-nho (khung ngan, do tren ban mau truoc khi ve); sau khi cham datKetQua nang bac (khong an dap an).
   Con tro doc: to nen tren dong chu; tren DAP AN bai tap thi thanh gach chan duoi chu (.sk-tro-vach).
   Chi dung hop dong cua js/motion.js: SenseiMotion.dangKyCanh, c.* va c.hu.* (+ c.theV2, c.dongHo neu co).
   Moi hieu ung: trang thai cuoi TRUOC, animation chi trang tri (fill 'backwards').
   Moi moc thoi gian: setTimeout (c.hen gan epoch) — khong rAF, khong doi animationend.
   Chi animate translate / scale / opacity (+ stroke-dashoffset cua dau tick .sk-ve).
   ========================================================================== */
(function () {
  'use strict';

  // ---------------------------------------------------------------- hang so
  const E_OUT = 'cubic-bezier(.22,1,.36,1)';
  const E_IN = 'cubic-bezier(.4,0,1,1)';
  const LEAD_DOC = 0.06;           // karaoke: con tro bat dau truot 60 ms truoc luc nghe
  const LEAD_CU = 0.12;            // cong cu: nhu LEAD cua dao dien
  const GIAY_MOI_CHU = 0.13;       // giong trinh duyet khong co onboundary: 0.13 s / ky tu
  const KHOANG_HIEN = 600;         // v2 B2: toi da mot lan hien / 600 ms
  const TRUOT = 260;               // v2 B3: con tro doc truot 260 ms
  const DAU = /^[、。，．,.！？!?・…‥」』）)】〉》「『（(【〈《\s]+$/;
  const JP_KY = /[\u3040-\u30ff\u4e00-\u9fff\u3005]/;
  const JP_CUM = /[\u3040-\u30ff\u4e00-\u9fff\u3005\u30fc〜]+/g;
  const NGHIA = ['nghia la', 'co nghia', 'dich la', 'y la', 'tuc la'];
  const GOI_Y = ['goi y'];
  const VAI_CHUNG = { personA: 1, personB: 1, sensei: 1 };

  const mqGiam = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;

  // ---------------------------------------------------------------- canh bao (it thoi)
  let soCanhBao = 0;
  function canhBao(noi, e) {
    if (soCanhBao++ >= 4) return;
    try { console.warn('[motion]', 'canh-hoi', noi, e && e.message ? e.message : e); } catch (x) {}
  }

  // ---------------------------------------------------------------- dong ho (spec 1.5.1)
  function bayGioRieng(ctx) {
    try {
      if (ctx.getOutputTimestamp) {
        const ts = ctx.getOutputTimestamp();
        if (ts && ts.contextTime > 0 && ts.performanceTime > 0) {
          const t = ts.contextTime + (performance.now() - ts.performanceTime) / 1000;
          if (t <= ctx.currentTime + 0.01 && t >= ctx.currentTime - 0.5) return t;
        }
      }
    } catch (e) {}
    return ctx.currentTime - (ctx.outputLatency || 0) - (ctx.baseLatency || 0);
  }
  function ctxAm() {
    const ae = window.__audioEngine;
    const ctx = ae && ae.outCtx;
    return ctx && ctx.state === 'running' ? ctx : null;
  }
  /** Thoi diem dang nghe thay (giay). Khong co AudioContext chay -> dong ho tuong. */
  function dongHo() {
    const ctx = ctxAm();
    if (ctx) {
      try {
        if (window.SenseiKhauHinh && typeof SenseiKhauHinh.bayGio === 'function') return SenseiKhauHinh.bayGio(ctx);
      } catch (e) {}
      return bayGioRieng(ctx);
    }
    return performance.now() / 1000;
  }
  /** Luc cong cu (§1.5.5): cuoi hang doi tieng */
  function lucCongCu() {
    const ae = window.__audioEngine;
    return Math.max(dongHo(), ctxAm() && ae ? (ae.scheduledTime || 0) : 0);
  }

  // ---------------------------------------------------------------- chuan hoa khoa (spec 1.6.1)
  function chuanVn(s) {
    return String(s || '').normalize('NFKC').toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }
  /** 3 am tiet dau — chi nhan khi >= 8 ky tu va >= 2 tu (khoa noi dung tieng Viet) */
  function vn3(text) {
    const tu = chuanVn(text).split(' ').filter(Boolean).slice(0, 3);
    return (tu.length >= 2 && tu.join('').length >= 8) ? [tu.join(' ')] : [];
  }
  const chiJp = (s) => (String(s || '').match(JP_CUM) || []).join('');
  const boTrung = (a) => [...new Set(a.filter(Boolean))];

  // ---------------------------------------------------------------- don vi doc (spec 1.5.3)
  const KANA_NHO = /[ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ]/;
  const LATIN = /[a-zA-Z\u00c0-\u024f\u1e00-\u1eff]/;
  function donVi(s) {
    let u = 0, truocLatin = false;
    for (const ch of String(s || '').normalize('NFKC')) {
      const cp = ch.codePointAt(0);
      let latin = false;
      if (KANA_NHO.test(ch)) { /* 0 */ }
      else if (ch === 'ー' || ch === 'っ' || ch === 'ッ') u += 1;
      else if (cp >= 0x3041 && cp <= 0x3096) u += 1;
      else if (cp >= 0x30a1 && cp <= 0x30fa) u += 1;
      else if ((cp >= 0x4e00 && cp <= 0x9fff) || ch === '々') u += 1.7;
      else if (LATIN.test(ch)) { latin = true; if (!truocLatin) u += 1.3; }
      else if (ch >= '0' && ch <= '9') u += 1;
      truocLatin = latin;
    }
    return u;
  }
  const laDau = (t) => DAU.test(String((t && (t.text || t.kanji)) || ''));
  const doDoc = (t) => Math.max(0.5, donVi((t && (t.furigana || t.text || t.kanji)) || ''));

  // ---------------------------------------------------------------- karaoke tu PCM (spec 3.6)
  function layBytes(pcm) {
    if (pcm instanceof Uint8Array) return pcm;
    if (pcm instanceof ArrayBuffer) return new Uint8Array(pcm);
    if (pcm && pcm.buffer instanceof ArrayBuffer) return new Uint8Array(pcm.buffer, pcm.byteOffset || 0, pcm.byteLength || 0);
    if (typeof pcm === 'string' && pcm) {
      const bin = atob(pcm);
      const b = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
      return b;
    }
    return new Uint8Array(0);
  }
  /** Bao am 10 ms (dBFS) cua PCM 24 kHz Int16 LE */
  function phongBao(pcm) {
    const b = layBytes(pcm);
    const n = b.length >> 1;
    const dv = new DataView(b.buffer, b.byteOffset, n * 2);
    const L = 240;
    const m = Math.ceil(n / L);
    const db = new Float32Array(m);
    for (let f = 0; f < m; f++) {
      const a = f * L, e = Math.min(n, a + L);
      let s = 0;
      for (let i = a; i < e; i++) { const v = dv.getInt16(i * 2, true) / 32768; s += v * v; }
      db[f] = 10 * Math.log10(s / Math.max(1, e - a) + 1e-12);
    }
    return { db, buoc: 0.01, dur: n / 24000 };
  }

  /**
   * Thoi diem bat dau cua tung token trong clip (giay, tinh tu dau clip).
   * Cum am (khoang lang >= 120 ms) <-> cum chu (tach tai dau cau); trong cum chia theo so mora.
   */
  function karaokeChiTiet(pcm, tokens) {
    tokens = tokens || [];
    const { db, buoc, dur } = phongBao(pcm);
    const m = db.length;
    let p95 = -120;
    if (m) { const s = Float32Array.from(db).sort(); p95 = s[Math.min(m - 1, Math.floor(0.95 * (m - 1)))]; }
    const nguong = Math.max(-50, p95 - 30);

    // 1. cac doan co tieng
    const runs = [];
    let a = -1;
    for (let f = 0; f < m; f++) {
      const v = db[f] > nguong;
      if (v && a < 0) a = f;
      if (!v && a >= 0) { runs.push([a, f]); a = -1; }
    }
    if (a >= 0) runs.push([a, m]);
    // 2. noi khoang lang ngan; 3. cum < 60 ms nhap vao cum gan nhat
    //    Lang 120 ms that do theo khung 10 ms ra 110–130 ms -> nguong cat 100 ms.
    const NGAN = Math.round(0.06 / buoc);
    const gom = (gap) => {
      const cum = [];
      runs.forEach(r => {
        const l = cum[cum.length - 1];
        if (l && r[0] - l[1] < gap) l[1] = r[1]; else cum.push([r[0], r[1]]);
      });
      for (let i = 0; i < cum.length && cum.length > 1;) {
        const r = cum[i];
        if (r[1] - r[0] >= NGAN) { i++; continue; }
        const tr = cum[i - 1], sa = cum[i + 1];
        const gTr = tr ? r[0] - tr[1] : Infinity, gSa = sa ? sa[0] - r[1] : Infinity;
        if (gTr <= gSa) tr[1] = r[1]; else sa[0] = r[0];
        cum.splice(i, 1);
      }
      return cum.map(r => ({ s: r[0] * buoc, e: Math.min(dur, r[1] * buoc) }));
    };
    const am = gom(Math.round(0.10 / buoc));
    const amNho = gom(Math.round(0.05 / buoc));      // ngat ngan (>= 50 ms): chi dung de bat bien

    // 4. cum chu: tach tai token dau cau
    const chu = [];
    let cur = null;
    tokens.forEach((t, k) => {
      if (laDau(t)) { if (cur) { chu.push(cur); cur = null; } return; }
      const u = doDoc(t);
      if (!cur) cur = { toks: [], u: 0 };
      cur.toks.push({ k, u });
      cur.u += u;
    });
    if (cur) chu.push(cur);

    const times = new Array(tokens.length).fill(null);
    const ket = new Array(tokens.length).fill(null);
    const S0 = am.length ? am[0].s : 0, S1 = am.length ? am[am.length - 1].e : dur;
    let khung = [];
    if (chu.length) {
      if (am.length === chu.length) {
        khung = am.map(p => [p.s, p.e]);
      } else {
        // 5. bien cum chu theo ti le mora, bat vao dau cum am gan nhat trong +-200 ms
        //    (uu tien khoang lang dai; khong co thi xet ca ngat ngan >= 50 ms)
        const tong = chu.reduce((x, p) => x + p.u, 0) || 1;
        const bien = [];
        let luy = 0;
        const gan = (ds, b) => {
          let tot = null;
          for (let p = 1; p < ds.length; p++) {
            const d = Math.abs(ds[p].s - b);
            if (d <= 0.2 && (!tot || d < tot.d)) tot = { d, s: ds[p].s, e: ds[p - 1].e };
          }
          return tot;
        };
        for (let j = 0; j < chu.length - 1; j++) {
          luy += chu[j].u;
          let b = S0 + (luy / tong) * (S1 - S0), ketTruoc = b;
          const tot = gan(am, b) || gan(amNho, b);
          if (tot) { b = tot.s; ketTruoc = tot.e; }
          bien.push({ b, ketTruoc });
        }
        khung = chu.map((_, j) => [j === 0 ? S0 : bien[j - 1].b, j === chu.length - 1 ? S1 : bien[j].ketTruoc]);
      }
      // 6. trong cum: ti le mora
      let moc = 0;
      chu.forEach((p, j) => {
        let s = Math.max(moc, khung[j][0]), e = Math.max(s, khung[j][1]);
        let l = 0;
        p.toks.forEach(tk => {
          times[tk.k] = s + (l / p.u) * (e - s);
          l += tk.u;
          ket[tk.k] = s + (l / p.u) * (e - s);
        });
        moc = e;
      });
    }
    return { times, ket, am, khung, nguong, p95, dur, S0, S1 };
  }
  function karaokeTuPcm(pcm, tokens) {
    try { return karaokeChiTiet(pcm, tokens).times; } catch (e) { canhBao('karaoke', e); return (tokens || []).map(() => null); }
  }

  // ---------------------------------------------------------------- nhat ky karaoke (kiem thu)
  const nhatKy = [];
  function ghi(o) { nhatKy.push(o); if (nhatKy.length > 3000) nhatKy.splice(0, nhatKy.length - 3000); }
  // vua khung bai tap sau khi cham (kiem thu: __motionHoi.nhatKyVua())
  const nhatKyVua = [];
  function ghiVua(o) { nhatKyVua.push(Object.assign({ luc: Math.round(performance.now()) }, o)); if (nhatKyVua.length > 60) nhatKyVua.shift(); }

  // ---------------------------------------------------------------- animation rieng (co theo doi)
  const song = new Set();
  const giamNgay = () => !!(mqGiam && mqGiam.matches);
  function hoat(canh, el, kf, o) {
    if (!el || typeof el.animate !== 'function') return null;
    try {
      const a = el.animate(kf, Object.assign({ fill: 'backwards' }, o));
      song.add(a);
      if (canh) canh._song.add(a);
      const bo = () => { song.delete(a); if (canh) canh._song.delete(a); };
      a.addEventListener('finish', bo);
      a.addEventListener('cancel', bo);
      return a;
    } catch (e) { return null; }
  }
  function ketThucHet(tap) {
    [...tap].forEach(a => {
      try { a.finish(); } catch (e) { try { a.cancel(); } catch (x) {} }
    });
  }

  // ---------------------------------------------------------------- the that dang o san khau (portal)
  let congDang = null;     // { card, traVe(giuBanSao) } — toi da mot the
  // The that da dat --sk-co rieng luc vua khung sau cham (inline): go khi the ve luoi / tam dung
  const theCoRieng = new Set();
  function goCoRieng() {
    theCoRieng.forEach(t => { try { if (!t.closest('.san-khau-giang')) t.style.removeProperty('--sk-co'); } catch (e) {} });
    theCoRieng.forEach(t => { if (!t.style.getPropertyValue('--sk-co')) theCoRieng.delete(t); });
  }
  function traThe(giuBanSao) {
    const c = congDang;
    if (!c) return false;
    try { c.traVe(!!giuBanSao); } catch (e) { canhBao('traThe', e); congDang = null; }
    return true;
  }

  // Tam dung / dung (body.dang-giang bi go): trong cung khung hinh — dung han chuyen dong,
  // tra the that ve luoi (vi tri cu), tat vong dang noi
  function theoDoiTamDung() {
    if (!window.MutationObserver || !document.body) return;
    let dang = document.body.classList.contains('dang-giang');
    new MutationObserver(() => {
      const co = document.body.classList.contains('dang-giang');
      if (dang && !co) {
        traThe(false);
        ketThucHet(song);
        setTimeout(goCoRieng, 0);        // dao dien tra the ve luoi trong cung luot
        document.querySelectorAll('.sk-ht-ava.is-noi').forEach(e => e.classList.remove('is-noi'));
      }
      dang = co;
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  // ---------------------------------------------------------------- hen gio
  function hamHen(c, canh) {
    const bao = (fn) => () => { if (canh.daHuy) return; try { fn(); } catch (e) { canhBao('hen', e); } };
    if (c && typeof c.hen === 'function') return (fn, ms) => c.hen(bao(fn), Math.max(0, ms));
    return (fn, ms) => setTimeout(bao(fn), Math.max(0, ms));
  }
  /** Goi fn luc dong ho = T - lead (thuc hien ngay neu da qua). Thuc day som thi hen lai ngan. */
  function henLuc(canh, T, fn, lead) {
    const buoc = () => {
      if (canh.daHuy) return;
      const con = T - lead - dongHo();
      if (con > 0.02 && con < 60) { canh._hen(buoc, con > 0.08 ? con * 1000 - 30 : con * 1000); return; }
      try { fn(); } catch (e) { canhBao('henLuc', e); }
    };
    buoc();
  }

  // ---------------------------------------------------------------- hien (v2 B2) — uu tien hu.hien
  function taoHu(c, canh) {
    const hu = (c && c.hu) || (window.SenseiMotion && window.SenseiMotion.hu) || {};
    const giam = () => !!(c && c.giam) || giamNgay();
    return {
      giam,
      /** Bo .sk-an: mo 0 -> 1 + nhich 6px, 240 ms (da xep cho truoc, khong day bo cuc) */
      hien(el, o) {
        if (!el || !el.classList.contains('sk-an')) return 0;
        if (typeof hu.hien === 'function') {
          try { const r = hu.hien(el, Object.assign({ ms: 240 }, o || {})); el.classList.remove('sk-an'); return r || 0; }
          catch (e) { canhBao('hu.hien', e); }
        }
        el.classList.remove('sk-an');
        el.classList.add('is-hien');
        const tre = (o && o.tre) || 0;
        hoat(canh, el, giam() ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, translate: '0 6px' }, { opacity: 1, translate: '0 0' }],
          { duration: giam() ? 120 : 240, delay: tre, easing: E_OUT });
        return 240 + tre;
      },
    };
  }

  // ---------------------------------------------------------------- con tro doc (v2 B3)
  /**
   * Dao dien v2: uy thac cho con tro cua the (hu.nhan / hu.karaoke). Khong thi: MOT phan tu to nhan
   * (.sk-ht-con-tro) tuyet doi trong goc; truot (translate + scale, 260 ms) tu cho dang doc sang cho
   * tiep theo. Giam chuyen dong: nhay thang. Trang thai cuoi dat truoc (style), WAAPI chi trang tri.
   */
  function taoConTro(canh, goc, c) {
    // Dao dien v2 co con tro rieng cua the (.sk-the > .sk-con-tro): hu.nhan / hu.karaoke luot no.
    // Dung chung con tro do — tren the chi co MOT con tro doc.
    // o.kieu 'vach': con tro thanh gach chan 3 px duoi chu (dap an bai tap — to nen trong vien o
    // giong "da chon"); CSS doi dang qua lop .sk-tro-vach tren goc canh (khong thi: to nen).
    const hu = c && c.hu;
    const gocCanh = () => canh.el || (goc && goc.closest && goc.closest('.sk-canh')) || goc;
    const datKieu = (o) => { const g = gocCanh(); if (g && g.classList) g.classList.toggle('sk-tro-vach', !!(o && o.kieu === 'vach')); };
    if (c && c.theV2 && hu && typeof hu.nhan === 'function') {
      return {
        v2: true, el: null,
        den(t, o) {
          if (!t || canh.daHuy || !t.isConnected) return false;
          datKieu(o);
          try { hu.nhan(t, {}); } catch (e) { canhBao('hu.nhan', e); }
          return true;
        },
        an() {},
        /** undefined = dao dien khong co hu.karaoke (ben goi tu chay) */
        karaoke(els, times, o) {
          if (typeof hu.karaoke !== 'function') return undefined;
          datKieu(null);
          try { return hu.karaoke(els, times, o || {}) || 0; } catch (e) { canhBao('hu.karaoke', e); return undefined; }
        },
        datLai() {}, huy() {},
        get dich() { return null; },
      };
    }
    const el = document.createElement('i');
    el.className = 'sk-ht-con-tro';
    el.setAttribute('aria-hidden', 'true');
    el.dataset.skConTro = '1';
    goc.appendChild(el);
    const S = { dich: null, o: null, vt: null, a: null };
    const giam = () => !!(canh.H && canh.H.giam());
    function doViTri(t, pad) {
      if (!t || !t.isConnected || !goc.isConnected || !goc.offsetWidth) return null;
      const rg = goc.getBoundingClientRect(), rt = t.getBoundingClientRect();
      if (!rt.width || !rt.height) return null;
      const s = rg.width / goc.offsetWidth || 1;
      return {
        x: (rt.left - rg.left) / s - goc.clientLeft + goc.scrollLeft - pad[0],
        y: (rt.top - rg.top) / s - goc.clientTop + goc.scrollTop - pad[1],
        w: rt.width / s + 2 * pad[0], h: rt.height / s + 2 * pad[1],
      };
    }
    function datCuoi(v) {
      el.style.translate = `${v.x.toFixed(1)}px ${v.y.toFixed(1)}px`;
      el.style.width = v.w.toFixed(1) + 'px';
      el.style.height = v.h.toFixed(1) + 'px';
    }
    /** Dang nam o dau (ke ca giua luc truot) */
    function dangO() {
      if (!S.vt) return null;
      if (!S.a || S.a.playState !== 'running') return S.vt;
      try {
        const cs = getComputedStyle(el);
        const t = String(cs.translate || '').split(/\s+/).map(parseFloat);
        const sc = String(cs.scale || '1').split(/\s+/).map(parseFloat);
        const sx = isFinite(sc[0]) ? sc[0] : 1, sy = isFinite(sc[1]) ? sc[1] : sx;
        return { x: isFinite(t[0]) ? t[0] : S.vt.x, y: isFinite(t[1]) ? t[1] : S.vt.y, w: S.vt.w * sx, h: S.vt.h * sy };
      } catch (e) { return S.vt; }
    }
    function huyA() { if (S.a) { try { S.a.cancel(); } catch (e) {} S.a = null; } }
    function den(t, o) {
      o = o || {};
      if (canh.daHuy) return false;
      const v = doViTri(t, o.pad || [8, 4]);
      if (!v) return false;
      const cu = el.classList.contains('is-hien') ? dangO() : null;
      huyA();
      datCuoi(v);
      el.classList.toggle('is-mo', !!o.mo);
      el.classList.toggle('is-vach', o.kieu === 'vach');
      el.classList.add('is-hien');
      S.dich = t; S.o = o; S.vt = v;
      if (giam()) return true;
      if (!cu) {
        S.a = hoat(canh, el, [{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: E_OUT });
        return true;
      }
      const sx = cu.w / v.w, sy = cu.h / v.h;
      if (Math.abs(cu.x - v.x) < 0.5 && Math.abs(cu.y - v.y) < 0.5 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) return true;
      S.a = hoat(canh, el, [
        { translate: `${cu.x.toFixed(1)}px ${cu.y.toFixed(1)}px`, scale: `${sx.toFixed(3)} ${sy.toFixed(3)}` },
        { translate: `${v.x.toFixed(1)}px ${v.y.toFixed(1)}px`, scale: '1 1' },
      ], { duration: o.ms || TRUOT, easing: E_OUT });
      return true;
    }
    function an() {
      if (!el.classList.contains('is-hien')) return;
      huyA();
      el.classList.remove('is-hien');
      S.dich = null; S.vt = null;
      if (!giam()) S.a = hoat(canh, el, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: E_IN });
    }
    /** Co khung doi: dat lai cho dang doc, khong truot */
    function datLai() {
      if (!S.dich || !el.classList.contains('is-hien')) return;
      const v = doViTri(S.dich, (S.o && S.o.pad) || [8, 4]);
      if (!v) return;
      huyA();
      datCuoi(v);
      S.vt = v;
    }
    let ro = null, henRo = 0;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(() => { clearTimeout(henRo); henRo = setTimeout(() => { if (!canh.daHuy) datLai(); }, 120); });
      ro.observe(goc);
    }
    return { v2: false, el, den, an, datLai, karaoke: () => undefined, huy() { if (ro) ro.disconnect(); clearTimeout(henRo); }, get dich() { return S.dich; } };
  }

  // ---------------------------------------------------------------- hang doi hien (v2 B2)
  /**
   * Toi da mot lan hien / 600 ms. Den luot ma dang cho nhieu viec (dao dien keo cue cham theo
   * thu tu noi dung): cac viec truoc hien ngay khong hieu ung, chi viec cuoi co hieu ung + con tro.
   */
  function taoHangHien(canh) {
    const cho = [];
    let cuoi = -1e9, henDang = false;
    function luot() {
      henDang = false;
      if (canh.daHuy || !cho.length) return;
      const con = cuoi + KHOANG_HIEN - performance.now();
      if (con > 8) { henDang = true; canh._hen(luot, con); return; }
      cuoi = performance.now();
      const ds = cho.splice(0, cho.length);
      ds.forEach((f, k) => { try { f(k < ds.length - 1); } catch (e) { canhBao('hien', e); } });
    }
    return {
      them(f) { cho.push(f); if (!henDang) luot(); },
      /** Het nhip / canh lui: hien not ngay, khong hieu ung */
      xa() { const ds = cho.splice(0, cho.length); ds.forEach(f => { try { f(true); } catch (e) {} }); },
      get con() { return cho.length; },
    };
  }

  // ---------------------------------------------------------------- tien ich chung
  function seCua(c) {
    return (c && c.se) || window.__slideEngine || (window.SlideEngine && window.SlideEngine.prototype) || null;
  }
  const cssId = (s) => (window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/["\\#.:[\]]/g, '\\$&'));
  /** Toa do bo cuc cua e trong noi dung cuon cua goc (tu mep dem tren; khong tinh transform, khong doi theo
   *  scrollTop). goc phai la mot offsetParent tren chuoi cua e (vd .sk-cong position:absolute) — khong thi null */
  function viTriTrong(e, goc) {
    let y = 0, n = e;
    while (n && n !== goc) { y += n.offsetTop; n = n.offsetParent; }
    return n === goc ? y : null;
  }
  function tachTen(sp) {
    const s = String(sp || '').trim();
    const m = /^(.*?)\s*[(（]([^)）]*)[)）]\s*$/.exec(s);
    return m ? { jp: m[1].trim(), la: m[2].trim() } : { jp: s, la: '' };
  }
  const chuDau = (sp) => Array.from(tachTen(sp).jp || String(sp || '').trim())[0] || '?';
  // Chan dung nguoi noi trong vong tron avatar (js/avatar-noi.js nhep mieng khi cau duoc doc). Khong co anh / anh loi -> chu cai dau nhu cu.
  const avaAnh = (se, l) => (l && l.avatarUrl
    ? `<img class="sk-ht-anh" src="${se.escapeHtml(l.avatarUrl)}" alt="" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.5);transform-origin:50% 36%" onerror="const o=this.parentElement; if(o){o.style.overflow=''; o.textContent='${chuDau(l.speaker).replace(/['\<>&"]/g, '')}';}">`
    : null);
  const avaNoiDung = (se, l) => avaAnh(se, l) || se.escapeHtml(chuDau(l.speaker));
  const avaStyle = (l) => (l && l.avatarUrl ? ' style="overflow:hidden;background:var(--anh-kem,#f0ebe1)"' : '');
  function ganNguoiNoi(goc) {
    if (!window.SenseiAvatarNoi || !window.SenseiAvatarNoi.gan) return;
    goc.querySelectorAll('.sk-ht-dong[data-dong]').forEach((h) => {
      const img = h.querySelector('.sk-ht-ava img.sk-ht-anh');
      if (img && !img.dataset.avn) { img.dataset.avn = '1'; try { window.SenseiAvatarNoi.gan(img, { lineId: h.dataset.dong }); } catch (e) {} }
    });
  }

  /** Ben trai / phai theo NGUOI NOI — cung luat voi renderKaiwa (slide-engine 800–819) */
  function phanBen(doan) {
    const thuTu = new Map(), diem = new Map();
    (doan || []).forEach(l => {
      const n = String(l.speaker || '').trim();
      if (!thuTu.has(n)) thuTu.set(n, thuTu.size);
      const d = (l.speakerRole === 'personA' || l.speakerRole === 'sensei') ? 1 : (l.speakerRole === 'personB' ? -1 : 0);
      diem.set(n, (diem.get(n) || 0) + d);
    });
    const benPhai = (sp) => {
      const n = String(sp || '').trim();
      const d = diem.get(n) || 0;
      return d !== 0 ? d < 0 : (thuTu.get(n) || 0) % 2 === 1;
    };
    const thu2 = new Set();
    const so = [0, 0];
    thuTu.forEach((_, n) => { if (so[+benPhai(n)]++ > 0) thu2.add(n); });
    return { benPhai, laThu2: (sp) => thu2.has(String(sp || '').trim()), thuTu };
  }
  function castCua(doan) {
    let ds = [];
    try { if (window.SenseiVoices && SenseiVoices.castOf) ds = SenseiVoices.castOf(doan) || []; } catch (e) {}
    if (!ds.length) {
      const seen = new Map();
      (doan || []).forEach(l => { const n = String(l.speaker || '').trim(); if (n && !seen.has(n)) seen.set(n, { speaker: n, genderVi: '' }); });
      ds = [...seen.values()];
    }
    return ds.slice(0, 4);
  }
  /** Mau vong chu cai dau: A = to nhan, B = giay dam, nguoi thu hai cung ben = vong vien */
  const lopBen = (ben, sp) => (ben.benPhai(sp) ? ' is-b' : '') + (ben.laThu2(sp) ? ' is-vien' : '');

  /** Cau tieng Nhat: token id 'st-', ruby cua slide-engine; coId=false -> ban sao (khong id).
   *  vaiTro: Map(k -> nhan vai tro) — nhan dat san (an) duoi token trong tam */
  function htmlCau(se, tokens, coId, vaiTro) {
    const ds = (tokens || []).map(t => ({ ...t, id: coId && t.id ? 'st-' + t.id : '' }));
    return se.ghepTokenCau(ds, (tok, i, arr) => {
      const rt = se.rtCua(tok);
      const inner = rt ? se.rubyCau(tok, rt, i, arr) : se.escapeHtml(tok.text || tok.kanji || '');
      const vai = vaiTro && vaiTro.get(i);
      return `<span${tok.id ? ` id="${se.escapeHtml(tok.id)}"` : ''} class="sk-ht-tok" data-k="${i}"${tok.isKeyGrammar ? ' data-key="1"' : ''}>`
        + `${inner}${vai ? `<span class="sk-ht-vai-tro sk-an" aria-hidden="true">${se.escapeHtml(vai)}</span>` : ''}</span>`;
    });
  }
  function htmlTen(se, sp) {
    const t = tachTen(sp);
    return `<span lang="ja">${se.escapeHtml(t.jp)}</span>${t.la ? ` <span class="sk-ht-la">${se.escapeHtml(t.la)}</span>` : ''}`;
  }
  function htmlJpTron(se, s) {
    return se.escapeHtml(s).replace(/[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff01-\uff60]+/g, '<span lang="ja">$&</span>');
  }
  const cauJp = (tokens) => (tokens || []).map(t => t.kanji || t.text || '').join('');
  /** Hai token chu dau / cuoi — ca dang kanji lan kana (transcript co the ra kana) */
  function khoaHai(tokens, cuoi) {
    const ds = (tokens || []).filter(t => !laDau(t));
    const hai = cuoi ? ds.slice(-2) : ds.slice(0, 2);
    let to = [''];
    hai.forEach(t => {
      const bien = boTrung([t.kanji || t.text || '', t.text || t.kanji || '', t.furigana || '']);
      to = to.flatMap(x => bien.map(v => x + v));
    });
    return boTrung(to.map(chiJp));
  }
  /** Id cua canh moi trung id canh cu dang lui ra: bo id o canh cu (T11 khong trung id) */
  function khuTrungId(root, canhTruoc) {
    const cu = canhTruoc && canhTruoc.el;
    if (!cu || !root) return;
    root.querySelectorAll('[id]').forEach(e => {
      const x = cu.querySelector('#' + cssId(e.id));
      if (x) x.removeAttribute('id');
    });
  }
  function boHetId(root) {
    if (root) root.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
  }
  function taoGoc(kind, c, them) {
    const el = document.createElement('div');
    el.className = `sk-canh sk-canh-${kind} sk-hoi ${them} sk-kho-${(c && c.kho) || 'rong'}`;
    return el;
  }
  function taoCanh(kind, c) {
    const canh = { loai: kind, __hoi: true, daHuy: false, _song: new Set() };
    canh._hen = hamHen(c, canh);
    return canh;
  }
  function huyChung(canh, them) {
    if (canh.daHuy) return;
    try { them && them(); } catch (e) {}
    canh.daHuy = true;
    ketThucHet(canh._song);
    if (canh.conTro) canh.conTro.huy();
    if (canh.el) canh.el.querySelectorAll('.is-noi').forEach(e => e.classList.remove('is-noi'));
  }
  /** highlight_element len phan tu st- cua canh -> con tro doc toi do (khong nhay, khong phong to) */
  function congCuConTro(canh, name, args) {
    if (name !== 'highlight_element' || !canh.conTro) return null;
    const id = args && (args.target_id || args.targetId);
    if (!id) return null;
    const t = canh.el.querySelector('#' + cssId('st-' + id));
    if (!t || !t.getClientRects().length) return null;
    henLuc(canh, lucCongCu(), () => canh.conTro.den(t), LEAD_CU);
    return { success: true, highlighted: id };
  }

  // ---------------------------------------------------------------- phat mot dong thoai (karaoke)
  /**
   * Karaoke cua mot cau thoai bang con tro doc: clip (PCM that), giong trinh duyet (onboundary /
   * uoc 0.13 s moi chu) va lan doc cham cua Sensei (cue doc F2, con tro nhat 60%).
   * Token toi luot: them .is-doc (bo kiem thu do luc nay) + con tro truot toi.
   */
  function taoDong(canh, hang, line, conTro) {
    const cau = hang.querySelector('.sk-ht-cau');
    const ava = hang.querySelector('.sk-ht-ava');
    const toks = line.tokens || [];
    const els = new Map();
    if (cau) cau.querySelectorAll('.sk-ht-tok[data-k]').forEach(e => els.set(+e.dataset.k, e));
    // vi tri ky tu cua tung token trong cau giong may doc (kanji || text, noi lien)
    const batDauChu = [];
    let luyChu = 0;
    toks.forEach((t, k) => { batDauChu[k] = luyChu; luyChu += String(t.kanji || t.text || '').length; });

    const D = { gen: 0, dangPhat: false, nguon: null, giongT0: 0, bienCuoi: -1 };
    const conSong = (g) => g === D.gen && !canh.daHuy;

    function toTok(it, mo, nguon, ms) {
      it.el.classList.remove('sk-doc-cho');
      it.el.classList.add('is-doc');
      conTro.den(it.el, { mo, ms, pad: [3, 1] });
      ghi({ dong: line.id, k: it.k, T: it.T, firedCtx: dongHo(), firedPerf: performance.now(), nguon });
    }
    /** list: [{el, k, T, E}] tren dong ho cua module (dongHo) */
    function chay(list, mo, nguon) {
      const g = ++D.gen;
      D.nguon = nguon;
      if (!list.length) return 0;
      if (conTro.v2) {
        // con tro cua the (dao dien): hu.karaoke nhan moc tuong doi (ms tu bay gio), tu them .is-doc
        const bayGio = dongHo();
        const times = list.map(it => (it.T - bayGio) * 1000);
        const cuoi = list[list.length - 1];
        times.ket = ((cuoi.E || cuoi.T + 0.3) - bayGio) * 1000;
        const ms = conTro.karaoke(list.map(it => it.el), times, { tuongDoi: true, mo: !!mo, nhan: (nguon === 'sensei' ? 'doc:' : '') + line.id });
        if (ms !== undefined) {
          list.forEach(it => ghi({ dong: line.id, k: it.k, T: it.T, lenLich: bayGio, nguon }));
          return ms;
        }
      }
      const buoc = (j) => {
        if (!conSong(g) || j >= list.length) return;
        const it = list[j], nx = list[j + 1];
        henLuc(canh, it.T, () => {
          if (!conSong(g)) return;
          const khoang = nx ? (nx.T - it.T) * 1000 : TRUOT;
          toTok(it, mo, nguon, Math.max(90, Math.min(TRUOT, khoang * 0.7)));
          buoc(j + 1);
        }, LEAD_DOC);
      };
      buoc(0);
      const cuoi = list[list.length - 1];
      return Math.max(0, ((cuoi.E || cuoi.T + 0.3) - dongHo()) * 1000);
    }
    function dsTu(tRel, eRel, goc) {
      const list = [];
      toks.forEach((t, k) => {
        const el = els.get(k);
        if (!el || tRel[k] == null) return;
        list.push({ el, k, T: goc + tRel[k], E: goc + (eRel[k] != null ? eRel[k] : tRel[k] + 0.3) });
      });
      return list;
    }
    function theoDonVi(tongGiay) {
      const tRel = [], eRel = [];
      const tong = toks.reduce((x, t) => x + (laDau(t) ? 0 : doDoc(t)), 0) || 1;
      let l = 0;
      toks.forEach((t, k) => {
        if (laDau(t)) return;
        tRel[k] = (l / tong) * tongGiay;
        l += doDoc(t);
        eRel[k] = (l / tong) * tongGiay;
      });
      return { tRel, eRel };
    }
    function uocGiongMay() {
      const tRel = [], eRel = [];
      toks.forEach((t, k) => {
        if (laDau(t)) return;
        tRel[k] = batDauChu[k] * GIAY_MOI_CHU;
        eRel[k] = (batDauChu[k] + String(t.kanji || t.text || '').length) * GIAY_MOI_CHU;
      });
      return { tRel, eRel };
    }
    function hoanTat() {
      D.gen++;
      D.dangPhat = false;
      els.forEach(e => { e.classList.remove('sk-doc-cho'); e.classList.add('is-doc'); });
      if (cau) cau.classList.remove('is-cho-doc');
      if (ava) ava.classList.remove('is-noi');
    }
    const tokDau = () => { for (let k = 0; k < toks.length; k++) if (!laDau(toks[k]) && els.get(k)) return els.get(k); return null; };

    return {
      D, tokDau,
      /** khiDongThoai: cho nghe — chu chua doc mo .55, vong tinh quanh avatar nguoi noi */
      batDau() {
        D.gen++;
        D.dangPhat = true; D.nguon = null; D.bienCuoi = -1;
        els.forEach(e => e.classList.remove('is-doc'));
        if (cau) cau.classList.add('is-cho-doc');
        if (ava) ava.classList.add('is-noi');
        // luoi an toan: khong co clip / giong may (Sensei doc thay) thi thoi lam mo chu
        const g = D.gen;
        canh._hen(() => { if (g === D.gen && D.dangPhat && !D.nguon && cau) cau.classList.remove('is-cho-doc'); }, 2500);
      },
      clip(info) {
        const t0 = info && isFinite(info.t0) ? +info.t0 : 0;
        const bayGio = dongHo();
        // t0 = gio AudioContext luc src.start() (nghe thay khi dongHo() = t0); lech mien -> goc = bay gio
        const goc = (t0 > 0 && ctxAm() && Math.abs(t0 - bayGio) < 5) ? t0 : bayGio;
        let kq = null;
        try { kq = info && info.pcm ? karaokeChiTiet(info.pcm, toks) : null; } catch (e) { canhBao('clip', e); }
        let tRel, eRel;
        if (kq && kq.times.some(x => x != null)) { tRel = kq.times; eRel = kq.ket; }
        else ({ tRel, eRel } = theoDonVi(Math.max(0.5, (info && info.dur) || donVi(cauJp(toks)) * 0.15)));
        chay(dsTu(tRel, eRel, goc), false, 'clip');
      },
      giongMay(su, charIndex) {
        if (su === 'bat-dau') {
          D.giongT0 = dongHo();
          D.nguon = 'giong-cho';
          // cho 250 ms xem co onboundary khong; khong co thi uoc 0.13 s / chu tinh tu luc bat dau
          const g = D.gen;
          canh._hen(() => {
            if (g !== D.gen || D.nguon !== 'giong-cho') return;
            const { tRel, eRel } = uocGiongMay();
            chay(dsTu(tRel, eRel, D.giongT0), false, 'giong-uoc');
          }, 250);
        } else if (su === 'ranh-gioi') {
          const ci = +charIndex;
          if (!isFinite(ci) || D.nguon === 'giong-uoc') return;
          D.nguon = 'giong-bien';
          let k = -1;
          toks.forEach((t, j) => { if (!laDau(t) && els.get(j) && batDauChu[j] <= ci) k = j; });
          if (k < 0 || k <= D.bienCuoi) return;
          for (let j = 0; j < k; j++) { const e = els.get(j); if (e) { e.classList.remove('sk-doc-cho'); e.classList.add('is-doc'); } }
          const T = dongHo();
          const dai = Math.max(0.15, String(toks[k].kanji || toks[k].text || '').length * GIAY_MOI_CHU);
          const times = [0];
          times.ket = dai * 1000;
          const ms = conTro.v2 ? conTro.karaoke([els.get(k)], times, { tuongDoi: true, nhan: line.id }) : undefined;
          if (ms === undefined) toTok({ el: els.get(k), k, T }, false, 'giong-bien', 160);
          else ghi({ dong: line.id, k, T, firedCtx: T, firedPerf: performance.now(), nguon: 'giong-bien' });
          D.bienCuoi = k;
        } else if (su === 'xong') {
          hoanTat();
        }
      },
      /** khiXongDong / ket canh */
      xong: hoanTat,
      /** Sensei doc cham lai (cue doc F2): con tro nhat, chia theo don vi tren tt.dur (tt.T: dong ho dao dien) */
      docLai(tt, rGiay, dongHoA) {
        const bayA = dongHoA ? dongHoA() : dongHo();
        let lech = tt && isFinite(tt.T) ? +tt.T - bayA : LEAD_CU;
        if (Math.abs(lech) > 5) lech = LEAD_CU;
        let dur = tt && tt.dur > 0 ? tt.dur / 1000 : 0;
        // khopCuoi khong khop: dur chi uoc -> neu ngan hon ca cau thi uoc lai (doc cham 1.2x)
        const uoc = donVi(cauJp(toks)) * (rGiay || 0.15) * 1.2;
        if (!(dur > 0) || dur < uoc * 0.6) dur = Math.min(9, Math.max(0.35, uoc));
        els.forEach(e => { e.classList.remove('sk-doc-cho'); e.classList.add('is-doc'); });
        if (cau) cau.classList.remove('is-cho-doc');
        const { tRel, eRel } = theoDonVi(dur);
        chay(dsTu(tRel, eRel, dongHo() + lech), true, 'sensei');
      },
      dangChay: () => D.dangPhat,
    };
  }

  // ---------------------------------------------------------------- canh du phong (loi dung canh)
  function canhDuPhong(kind, beat, c) {
    const canh = taoCanh(kind, c);
    const el = taoGoc(kind, c, 'sk-ht-du-goc');
    const noi = document.createElement('div');
    noi.className = 'sk-hoi-noi';
    const p = document.createElement('p');
    p.className = 'sk-ht-du';
    p.textContent = (beat && beat.label) || '';
    noi.appendChild(p);
    el.appendChild(noi);
    Object.assign(canh, { el, cues: [], sr: (beat && beat.label) || '', heroEl: p, huy() { huyChung(canh); } });
    return canh;
  }

  // ================================================================ 3.5 kaiwa-intro
  function dungGioiThieu(beat, c) {
    const se = seCua(c);
    const canh = taoCanh('kaiwa-intro', c);
    const H = taoHu(c, canh);
    canh.H = H;
    const esc = (s) => se.escapeHtml(s);
    const doan = Array.isArray(beat.data) ? beat.data : [];
    const ben = phanBen(doan);
    const vaiGoc = castCua(doan);
    // the ben trai truoc, ben phai sau (cung mau voi avatar o luot nghe tron)
    const vai = vaiGoc.slice().sort((a, b) => (+ben.benPhai(a.speaker) - +ben.benPhai(b.speaker))
      || ((ben.thuTu.get(a.speaker) || 0) - (ben.thuTu.get(b.speaker) || 0)));
    const vaiTro = (sp) => {
      const l = doan.find(x => String(x.speaker || '').trim() === sp && x.speakerRole && !VAI_CHUNG[x.speakerRole]);
      return l ? l.speakerRole : '';
    };
    const soLuot = (sp) => doan.filter(x => String(x.speaker || '').trim() === String(sp || '').trim()).length;
    const el = taoGoc('kaiwa-intro', c, 'sk-ht-gt');
    el.innerHTML = `<div class="sk-hoi-noi">
        <section class="sk-ht-cot-vai" aria-label="Nhân vật">
          <p class="sk-ht-nhan">Nhân vật</p>
          <ul class="sk-ht-dan-vai">
            ${vai.map((v, p) => {
              const phu = [v.genderVi, vaiTro(v.speaker), soLuot(v.speaker) ? soLuot(v.speaker) + ' lượt' : ''].filter(Boolean).join(' · ');
              return `<li class="sk-ht-vai" data-nguoi="${esc(v.speaker)}" data-p="${p}">
                <span class="sk-ht-chan${lopBen(ben, v.speaker)}" aria-hidden="true" lang="ja">${esc(chuDau(v.speaker))}</span>
                <span class="sk-ht-vai-chu">
                  <span class="sk-ht-vai-ten">${htmlTen(se, v.speaker)}</span>
                  ${phu ? `<span class="sk-ht-vai-phu">${esc(phu)}</span>` : ''}
                </span>
              </li>`;
            }).join('')}
          </ul>
        </section>
        <section class="sk-ht-cot-truyen" aria-label="Mạch câu chuyện">
          <p class="sk-ht-nhan">Mạch câu chuyện · ${doan.length} lượt thoại</p>
          <ol class="sk-ht-truyen">
            ${doan.map((l, i) => `<li class="sk-ht-o is-cho" data-i="${i}">
                <span class="sk-ht-o-chu${lopBen(ben, l.speaker)}" aria-hidden="true" lang="ja">${esc(chuDau(l.speaker))}</span>
                <span class="sk-ht-o-y">${esc(l.meaningVi || '')}</span>
              </li>`).join('')}
          </ol>
        </section>
      </div>`;
    khuTrungId(el, c.canhTruoc);

    const noi = el.querySelector('.sk-hoi-noi');
    const conTro = taoConTro(canh, noi, c);
    canh.conTro = conTro;
    const hang = taoHangHien(canh);
    const the = [...el.querySelectorAll('.sk-ht-vai')];
    const o = [...el.querySelectorAll('.sk-ht-o')];

    /** O truyen i sang len (mo .32 -> 1, 240 ms); ngay = khong hieu ung */
    function sang(i, ngay) {
      const tile = o[i];
      if (!tile || !tile.classList.contains('is-cho')) return;
      tile.classList.remove('is-cho');
      tile.classList.add('is-hien');
      if (ngay) return;
      hoat(canh, tile, H.giam() ? [{ opacity: 0.32 }, { opacity: 1 }] : [{ opacity: 0.32, translate: '0 4px' }, { opacity: 1, translate: '0 0' }],
        { duration: H.giam() ? 120 : 240, easing: E_OUT });
      conTro.den(tile, { pad: [6, 2] });
    }

    const cues = [];
    // C1: goi ten nhan vat -> con tro toi the nhan vat (ten Nhat + cach doc trong token + romaji)
    vai.forEach((v, p) => {
      const t = tachTen(v.speaker);
      const docTen = [];
      doan.forEach(l => (l.tokens || []).forEach(tk => { if (tk.kanji === t.jp && tk.furigana) docTen.push(tk.furigana); }));
      const jp = boTrung([chiJp(t.jp), ...docTen.map(chiJp)]);
      const vn = t.la ? boTrung([chuanVn(t.la)]) : [];
      if (!jp.length && !vn.length) return;
      cues.push({ id: 'C1.' + p, loai: 'nhan', khi: { khop: { jp, vn }, lan: 1, rieng: jp.length > 0 && Array.from(jp[0]).length === 1 },
        lam: () => conTro.den(the[p], { pad: [4, 2] }) });
    });
    // C2: tung o truyen sang khi Sensei ke toi cau do
    o.forEach((tile, i) => cues.push({ id: 'C2.' + i, loai: 'hien', khi: { khop: { vn: vn3(doan[i].meaningVi) }, lan: 1 },
      sau: i ? 'C2.' + (i - 1) : undefined, tiLe: +(0.2 + 0.7 * i / Math.max(1, doan.length)).toFixed(3),
      lam: () => hang.them((ngay) => sang(i, ngay)) }));

    Object.assign(canh, {
      el, cues,
      sr: `Hội thoại — ${vai.length} nhân vật: ${vai.map(v => tachTen(v.speaker).jp).join(', ')}`,
      heroEl: el.querySelector('.sk-ht-dan-vai'),
      congCu: (name, args) => congCuConTro(canh, name, args),
      giu() { hang.xa(); return null; },
      xong() {},
      huy() { huyChung(canh, () => hang.xa()); },
    });
    return canh;
  }

  // ================================================================ 3.6 kaiwa-run
  function htmlDong(se, ben, l, i, nay) {
    const esc = (s) => se.escapeHtml(s);
    return `<article class="sk-ht-dong ${nay ? 'is-nay' : 'is-cho'}" data-i="${i}" data-dong="${esc(l.id)}">
        <div class="sk-ht-ai">
          <span class="sk-ht-ava${lopBen(ben, l.speaker)}"${avaStyle(l)} aria-hidden="true" lang="ja">${avaNoiDung(se, l)}</span>
          <span class="sk-ht-ten">${htmlTen(se, l.speaker)}</span>
        </div>
        <div id="st-${esc(l.id)}" class="sk-ht-bong"${se.camXucAttr(l)}>
          <div class="sk-ht-cau" lang="ja">${htmlCau(se, l.tokens, true)}</div>
          <p class="sk-ht-nghia sk-an">${esc(l.meaningVi || '')}</p>
        </div>
      </article>`;
  }

  function dungNgheTron(beat, c) {
    const se = seCua(c);
    const canh = taoCanh('kaiwa-run', c);
    const H = taoHu(c, canh);
    canh.H = H;
    const doan = Array.isArray(beat.data) ? beat.data : [];
    const ben = phanBen(doan);

    const el = taoGoc('kaiwa-run', c, 'sk-ht-chay');
    // Moi cau deu dat san (chong mot o luoi, chi cau dang phat hien): cao co dinh = cau dai nhat,
    // doi cau khong xo bo cuc; focusItem(line.id) truoc khiDongThoai van tim thay st-<id>
    // O "cau truoc" (cao co dinh): cau vua nghe xong thu len day CUNG nghia cua no (13 px) — doc tiep
    // duoc trong luc cau sau dang phat, khong chop 300 ms trong khoang nghi
    el.innerHTML = `<div class="sk-hoi-noi">
        <div class="sk-ht-truoc is-trong sk-phu-bo" aria-hidden="true">
          <span class="sk-ht-truoc-o"><span class="sk-ht-ava is-nho" lang="ja"></span></span>
          <span class="sk-ht-truoc-chu"><span class="sk-ht-truoc-cau" lang="ja"></span><span class="sk-ht-truoc-nghia"></span></span>
        </div>
        <div class="sk-ht-chong">${doan.map((l, i) => htmlDong(se, ben, l, i, i === 0)).join('')}</div>
      </div>`;
    khuTrungId(el, c.canhTruoc);
    ganNguoiNoi(el);

    const noi = el.querySelector('.sk-hoi-noi');
    const conTro = taoConTro(canh, noi, c);
    canh.conTro = conTro;
    const truoc = el.querySelector('.sk-ht-truoc');
    const truocAva = truoc.querySelector('.sk-ht-ava');
    const truocCau = truoc.querySelector('.sk-ht-truoc-cau');
    const truocNghia = truoc.querySelector('.sk-ht-truoc-nghia');
    const dongEl = [...el.querySelectorAll('.sk-ht-dong')];
    const dong = dongEl.map((h, i) => taoDong(canh, h, doan[i], conTro));
    const nghiaCua = (i) => (dongEl[i] ? dongEl[i].querySelector('.sk-ht-nghia') : null);
    const S = { nay: doan.length ? 0 : -1, daNghe: new Set(), senseiDoc: false, henNghia: 0 };

    const timDong = (x, i) => {
      const id = x && typeof x === 'object' ? x.id : x;
      if (Number.isInteger(i) && doan[i] && doan[i].id === id) return i;
      return doan.findIndex(l => l.id === id);
    };

    /**
     * Cau idx len giua the; cau truoc no (kem nghia) nam o dong mo phia tren (chi mot dong).
     * Noi tiep (cau vua nghe xong -> cau ke): MOT chuyen dong lien mach — o "cau truoc" di len tu CHO cau cu
     * vua dung (FLIP: translate tu vi tri cau cu, mo 0 -> 1, 320 ms), cau moi vao tai cho (mo .5 -> 1 +
     * nhich 10 px, KHONG tre): khung nao cung co chu, con tro doc chi dat len cau da hien >= 50%.
     * Toi da 2 hieu ung (+ con tro). Khong scale (v2 A3).
     */
    function datDong(idx, hieu) {
      if (idx < 0 || !dongEl[idx]) return;
      const doi = idx !== S.nay;
      const cu = S.nay;
      const tr = doan[idx - 1];
      const coTruocMoi = !!tr && truoc.dataset.i !== String(idx - 1);
      const noiTiep = !!(hieu && doi && coTruocMoi && cu === idx - 1 && !H.giam());
      // do truoc khi ghi (mot lan, chua ve): dong cau cu dang o dau so voi o "cau truoc"
      let dy = 0;
      if (noiTiep) {
        try {
          const cauCu = dongEl[cu].querySelector('.sk-ht-cau');
          const rc = cauCu ? cauCu.getBoundingClientRect() : null, rt = truoc.getBoundingClientRect();
          if (rc && rc.height && rt.height) dy = rc.top - rt.top;
        } catch (e) {}
      }
      S.nay = idx;
      S.henNghia++;
      dongEl.forEach((d, j) => { d.classList.toggle('is-nay', j === idx); d.classList.toggle('is-cho', j !== idx); });
      if (tr) {
        truocAva.className = 'sk-ht-ava is-nho' + lopBen(ben, tr.speaker);
        truocAva.textContent = chuDau(tr.speaker);
        truocCau.textContent = cauJp(tr.tokens);
        truocNghia.textContent = tr.meaningVi || '';
        truoc.dataset.i = String(idx - 1);
      }
      truoc.classList.toggle('is-trong', !tr);
      // con tro san cho o token dau cau moi — karaoke keo no di tiep (cau moi hien >= 50% tu khung dau)
      const dau = dong[idx].tokDau();
      if (dau) conTro.den(dau, { mo: true, pad: [3, 1] }); else conTro.an();
      if (!hieu || !doi) return;
      if (H.giam()) {
        hoat(canh, dongEl[idx], [{ opacity: 0.5, offset: 0 }], { duration: 120 });
        return;
      }
      const coTruocHien = truoc.getClientRects().length > 0;     // .is-gon-2 / man thap: o "cau truoc" an
      if (coTruocHien && noiTiep && dy > 1) {
        hoat(canh, truoc, [{ opacity: 0, translate: `0 ${dy.toFixed(1)}px`, offset: 0 }], { duration: 320, easing: E_OUT });
      } else if (coTruocHien && coTruocMoi) {
        hoat(canh, truoc, [{ opacity: 0, offset: 0 }], { duration: 240, easing: E_OUT });
      }
      hoat(canh, dongEl[idx], [{ opacity: 0.5, translate: '0 10px', offset: 0 }], { duration: 320, easing: E_OUT });
    }

    function batDauDong(idx) {
      if (idx < 0) return;
      // cau truoc chua bao xong (bo qua khiXongDong) -> chot lai cho sach
      if (S.nay >= 0 && S.nay !== idx && dong[S.nay].dangChay()) ketDong(S.nay);
      datDong(idx, true);
      dong[idx].batDau();
    }
    /**
     * Nghe xong mot cau. Nghia: cau CUOI (hoac ngay = true: Sensei doc thay / khung cuoi) hien ngay duoi
     * cau; cau giua doan thi nghia di len o "cau truoc" cung luc cau ke vao (320 ms sau) — khong chop
     * nghia 300 ms roi mat. Cau ke khong toi (loi phat) -> 900 ms sau van hien nghia duoi cau.
     */
    function ketDong(idx, ngay) {
      if (idx < 0 || !dong[idx]) return;
      dong[idx].xong();
      S.daNghe.add(idx);
      const g = ++S.henNghia;
      if (ngay || idx >= doan.length - 1) { H.hien(nghiaCua(idx), {}); return; }
      canh._hen(() => { if (g === S.henNghia && S.nay === idx) H.hien(nghiaCua(idx), {}); }, 900);   // gan epoch
    }

    const cues = [];
    // Chi khi long tieng hong va Sensei doc thay ca doan: theo loi Sensei ma dua tung cau len
    doan.forEach((l, i) => {
      const jp = khoaHai(l.tokens, false);
      if (!jp.length) return;
      cues.push({ id: 'R.' + i, loai: 'hien', tuyChon: true, khi: { khop: { jp }, lan: 1 }, sau: i ? 'R.' + (i - 1) : undefined,
        lam: () => {
          S.senseiDoc = true;
          for (let j = Math.max(0, S.nay); j < i; j++) ketDong(j);
          datDong(i, true);
          ketDong(i, true);
        } });
    });

    Object.assign(canh, {
      el, cues,
      sr: `Nghe trọn đoạn hội thoại — ${doan.length} lượt`,
      heroEl: el.querySelector('.sk-ht-chong'),
      khiDongThoai(line, i) { batDauDong(timDong(line, i)); },
      khiClip(lineId, info) {
        const idx = timDong(lineId);
        if (idx < 0) return;
        if (S.nay !== idx || !dong[idx].dangChay()) batDauDong(idx);
        dong[idx].clip(info || {});
      },
      khiGiongMay(lineId, su, ci) {
        const idx = timDong(lineId);
        if (idx < 0) return;
        if (su === 'bat-dau' && (S.nay !== idx || !dong[idx].dangChay())) batDauDong(idx);
        dong[idx].giongMay(su, ci);
      },
      khiXongDong(lineId) { ketDong(timDong(lineId)); },
      congCu: (name, args) => congCuConTro(canh, name, args),
      xong() {
        // khung cuoi: cau dang len da co nghia
        if (S.nay < 0 || dong[S.nay].dangChay()) return;
        if (!S.daNghe.has(S.nay)) ketDong(S.nay, true);
        else { S.henNghia++; H.hien(nghiaCua(S.nay), {}); }
      },
      giu() {
        dong.forEach((d, j) => { if (d.dangChay()) ketDong(j, true); });
        if (S.nay >= 0 && S.daNghe.has(S.nay)) { S.henNghia++; H.hien(nghiaCua(S.nay), {}); }
        return null;
      },
      huy() { huyChung(canh); },
    });
    return canh;
  }

  // ================================================================ 3.7 kaiwa (mot cau)
  function dungMotCau(beat, c) {
    const se = seCua(c);
    const canh = taoCanh('kaiwa', c);
    const H = taoHu(c, canh);
    canh.H = H;
    const esc = (s) => se.escapeHtml(s);
    const ctx = c.ctx || {};
    const l = beat.data || {};
    let doan = (ctx.bai && Array.isArray(ctx.bai.dialogue)) ? ctx.bai.dialogue : [];
    if (!doan.length && Array.isArray(ctx.cacNhip)) doan = ctx.cacNhip.filter(b => b && b.kind === 'kaiwa').map(b => b.data);
    if (!doan.some(x => x && x.id === l.id)) doan = [l];
    const i = doan.findIndex(x => x.id === l.id);
    const ben = phanBen(doan);
    const tr = i > 0 ? doan[i - 1] : null;
    const toks = l.tokens || [];
    // nhan vai tro dat san duoi token trong tam (moi nhan mot lan — khong lap chu)
    const vaiTro = new Map(), daCo = new Set();
    toks.forEach((t, j) => {
      if (!t.isKeyGrammar || laDau(t)) return;
      const v = se.tokenRole ? se.tokenRole(t.text) : '';
      if (v && !daCo.has(v)) { daCo.add(v); vaiTro.set(j, v); }
    });

    const el = taoGoc('kaiwa', c, 'sk-ht-mot');
    el.innerHTML = `<div class="sk-hoi-noi">
        ${tr ? `<div class="sk-ht-truoc sk-phu-bo" aria-hidden="true">
            <span class="sk-ht-ava is-nho${lopBen(ben, tr.speaker)}" lang="ja">${esc(chuDau(tr.speaker))}</span>
            <span class="sk-ht-truoc-cau" lang="ja">${esc(cauJp(tr.tokens))}</span>
          </div>` : ''}
        <article class="sk-ht-dong is-nay" data-dong="${esc(l.id)}">
          <div class="sk-ht-ai">
            <span class="sk-ht-ava${lopBen(ben, l.speaker)}"${avaStyle(l)} aria-hidden="true" lang="ja">${avaNoiDung(se, l)}</span>
            <span class="sk-ht-ten">${htmlTen(se, l.speaker)}</span>
          </div>
          <div id="st-${esc(l.id)}" class="sk-ht-bong"${se.camXucAttr(l)}>
            <div class="sk-ht-cau is-lon${vaiTro.size ? ' co-vai' : ''}" lang="ja">${htmlCau(se, toks, true, vaiTro)}</div>
            <p class="sk-ht-nghia">${esc(l.meaningVi || '')}</p>
          </div>
        </article>
        <div class="sk-ht-khac sk-an sk-phu-bo">
          <span class="sk-ht-khac-nhan"><span aria-hidden="true">⇄</span> Cách nói khác</span>
          <div class="sk-ht-khac-cau" lang="ja"><span class="sk-ht-khac-chu"></span></div>
        </div>
      </div>`;
    khuTrungId(el, c.canhTruoc);
    ganNguoiNoi(el);

    const noi = el.querySelector('.sk-hoi-noi');
    const conTro = taoConTro(canh, noi, c);
    canh.conTro = conTro;
    const hang = el.querySelector('.sk-ht-dong');
    const bong = hang.querySelector('.sk-ht-bong');
    const nghia = hang.querySelector('.sk-ht-nghia');
    const khac = el.querySelector('.sk-ht-khac');
    const dongCtl = taoDong(canh, hang, l, conTro);
    const tokEl = (k) => hang.querySelector(`.sk-ht-tok[data-k="${k}"]`);
    const rNay = () => { try { const r = c.r && c.r(); return r > 0 ? r : 0.15; } catch (e) { return 0.15; } };
    const S = { khacLuc: -1e9, henKhac: 0 };

    const cues = [];
    // F2: Sensei doc cham lai -> con tro nhat truot tung token
    const dau2 = khoaHai(toks, false), cuoi2 = khoaHai(toks, true);
    if (dau2.length) {
      cues.push({ id: 'F2', loai: 'doc', khi: { khop: { jp: dau2 }, lan: 1 }, khopCuoi: { jp: cuoi2 },
        donVi: donVi(cauJp(toks)),                // khopCuoi khong khop: dao dien uoc dur theo ca cau
        lam: (tt) => dongCtl.docLai(tt, rNay(), typeof c.dongHo === 'function' ? c.dongHo : null) });
    }
    // F3.k: token trong tam — to nhan tinh + nhan vai tro dat san hien ra; con tro toi do
    let k = 0;
    toks.forEach((t, j) => {
      if (!t.isKeyGrammar || laDau(t)) return;
      const txt = String(t.text || '');
      const truocTok = toks.slice(0, j).reverse().find(x => !laDau(x));
      const jp = [];
      if (truocTok) jp.push(chiJp((truocTok.kanji || truocTok.text || '') + (t.kanji || txt)), chiJp((truocTok.text || '') + txt));
      if (Array.from(chiJp(txt)).length >= 2 || !truocTok) jp.push(chiJp(txt));
      if (t.kanji && t.kanji !== txt) jp.push(chiJp(t.kanji));
      const khoa = boTrung(jp);
      if (!khoa.length) return;
      const kk = k++;
      cues.push({ id: 'F3.' + kk, loai: 'hien', khi: { khop: { jp: khoa }, lan: 1, rieng: khoa.every(x => Array.from(x).length === 1) },
        sau: dau2.length ? 'F2' : undefined, tiLe: Math.min(0.9, +(0.3 + 0.1 * kk).toFixed(2)),
        lam: () => {
          const e = tokEl(j);
          if (!e || e.classList.contains('is-nang')) return;
          e.classList.add('is-nang');
          const nhan = e.querySelector('.sk-ht-vai-tro');
          if (nhan) H.hien(nhan, {});
          conTro.den(e, { pad: [4, 2] });
        } });
    });
    // F4: nghia duoc noi -> con tro toi dong nghia
    cues.push({ id: 'F4', loai: 'nhan', khi: { khop: { vn: boTrung([...NGHIA, ...vn3(l.meaningVi)]) }, lan: 1 },
      lam: () => conTro.den(nghia, { pad: [8, 3] }) });

    /** Dong "Cach noi khac" (dat san, cao co dinh = nhan + 2 dong: dien chu khong xo bo cuc) hien duoi
     *  cau chinh — write_on_board co chu Nhat. Con tro toi CHU (span noi dong), khong phai ca khoi 2 dong */
    function hienCachKhac(text) {
      const cauEl = khac.querySelector('.sk-ht-khac-chu') || khac.querySelector('.sk-ht-khac-cau');
      const moi = khac.classList.contains('sk-an');
      // cach noi truoc da hien < 1.2 s: giu them cho du doc (v2 B2)
      const con = S.khacLuc + 1200 - performance.now();
      if (!moi && con > 0) { clearTimeout(S.henKhac); S.henKhac = setTimeout(() => { if (!canh.daHuy) hienCachKhac(text); }, con); return; }
      cauEl.textContent = text;
      S.khacLuc = performance.now();
      if (moi) H.hien(khac, {});
      else if (!H.giam()) hoat(canh, cauEl, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: E_OUT });
      conTro.den(cauEl, { pad: [6, 2], mo: true });
    }

    Object.assign(canh, {
      el, cues,
      sr: `Câu thoại ${i + 1}/${doan.length}: ${tachTen(l.speaker).jp} — ${cauJp(toks)} — ${l.meaningVi || ''}`,
      heroEl: bong,
      khiDongThoai(line) { if (line && line.id === l.id) dongCtl.batDau(); },
      khiClip(lineId, info) {
        if (lineId !== l.id) return;
        if (!dongCtl.dangChay()) dongCtl.batDau();
        dongCtl.clip(info || {});
      },
      khiGiongMay(lineId, su, ci) {
        if (lineId !== l.id) return;
        if (su === 'bat-dau' && !dongCtl.dangChay()) dongCtl.batDau();
        dongCtl.giongMay(su, ci);
      },
      khiXongDong(lineId) { if (lineId === l.id) dongCtl.xong(); },
      congCu(name, args) {
        if (name === 'highlight_element') return congCuConTro(canh, name, args);
        if (name !== 'write_on_board') return null;
        const text = String((args && args.text) || '').trim();
        if (!text || !JP_KY.test(text)) return null;           // khong co chu Nhat -> dong "Sensei ghi" (dao dien)
        if (!khac.getClientRects().length) return null;        // man qua thap (sk-phu-bo an) -> dao dien ghi
        try {
          const B = window.SenseiBoard;
          if (B && typeof B.vietBang === 'function' && typeof B._bangAn === 'function') B.vietBang(text, (args && args.style) || 'thuong', { im: true });
        } catch (e) {}
        henLuc(canh, lucCongCu(), () => hienCachKhac(text), LEAD_CU);
        return { success: true };
      },
      xong() {},
      giu() { if (dongCtl.dangChay()) dongCtl.xong(); return null; },
      huy() { huyChung(canh, () => clearTimeout(S.henKhac)); },
    });
    return canh;
  }

  // ================================================================ 3.8 quiz
  function dungBaiTap(beat, c) {
    const se = seCua(c);
    const canh = taoCanh('quiz', c);
    const H = taoHu(c, canh);
    canh.H = H;
    const esc = (s) => se.escapeHtml(s);
    const ctx = c.ctx || {};
    const q = beat.data || {};
    const mMuc = /^\[(Dễ|Vừa|Khó)\]\s*/.exec(q.question || '');
    const cauHoi = mMuc ? q.question.slice(mMuc[0].length) : String(q.question || '');
    const so = (ctx.chuong && ctx.chuong.i) || ((beat.subIndex || 0) + 1);
    const tong = (ctx.chuong && ctx.chuong.n) || (Array.isArray(ctx.cacNhip) ? ctx.cacNhip.filter(b => b && b.kind === 'quiz').length : 0) || so;
    const opts = Array.isArray(q.options) ? q.options : [];
    const dai = opts.reduce((m, x) => Math.max(m, Array.from(String(x || '')).length), 0);
    // v2: dao dien tu mo cong (.sk-cong, 2 cot tru khi dap an > 28 ky tu hoac man hep)
    const v2 = !!c.theV2;
    const haiCot = v2 ? (c.kho !== 'hep' && dai <= 28) : (c.kho === 'rong' && dai <= 28);
    const L = (k) => String.fromCharCode(65 + k);
    const htmlGoi = q.hint ? `<p class="sk-bt-goi sk-an"><b>Gợi ý:</b> ${htmlJpTron(se, q.hint)}</p>` : '';

    const el = taoGoc('quiz', c, 'sk-bt' + (v2 ? ' sk-bt-v2' : ''));
    if (v2) {
      // Khoi cau hoi = BAN MAU cua cong dao dien: cung khung .sk-cong + lop cua the that (.qz-*),
      // nen luc trao tay the that dung dung cho, cung co chu — chi cheo mo tai cho.
      // Chu thuong nhu the that (khong boc lang): cung hop dong -> cung chieu cao, khong nhay khi trao.
      // Goi y nam NGOAI dong chay cua the (ngay duoi) de the that cao bang ban mau.
      el.innerHTML = `<div class="sk-cong sk-bt-gia${haiCot ? '' : ' is-mot-cot'}">
          <div id="st-card-${esc(q.id)}" class="qz-card sk-bt-khoi-gia">
            <div class="qz-q"><p class="qz-text">${esc(cauHoi)}</p></div>
            <div class="qz-opts">
              ${opts.map((o, k) => `<div class="qz-opt" data-k="${k}">
                  <span class="qz-key" aria-hidden="true">${L(k)}</span>
                  <span class="qz-opt-text"><span class="sk-bt-doc">${esc(o)}</span></span>
                </div>`).join('')}
            </div>
            ${htmlGoi}
          </div>
        </div>`;
    } else {
      // Dao dien cu (khong cong): khoi rieng cung khuon voi the that khi CANH tu dua the sang (.sk-bt-that)
      el.innerHTML = `<div class="sk-hoi-noi">
          <div class="sk-bt-vo">
            <div id="st-card-${esc(q.id)}" class="sk-bt-khoi">
              <div class="sk-bt-q">
                <div class="sk-bt-dau"><span class="sk-bt-so">Câu ${so}/${tong}${mMuc ? ' · ' + esc(mMuc[1]) : ''}</span></div>
                <p class="sk-bt-hoi">${htmlJpTron(se, cauHoi)}</p>
              </div>
              <div class="sk-bt-ds${haiCot ? ' is-hai' : ''}">
                ${opts.map((o, k) => `<div class="sk-bt-dap" data-k="${k}">
                    <span class="sk-bt-phim" aria-hidden="true">${L(k)}</span>
                    <span class="sk-bt-chu"><span class="sk-bt-doc">${htmlJpTron(se, o)}</span></span>
                  </div>`).join('')}
              </div>
            </div>
          </div>
          ${htmlGoi}
        </div>`;
    }
    khuTrungId(el, c.canhTruoc);

    const noi = el.querySelector('.sk-hoi-noi');
    const conTro = taoConTro(canh, noi || el, c);
    canh.conTro = conTro;
    const vo = el.querySelector('.sk-bt-vo');
    const gia = el.querySelector('.sk-bt-gia');
    const khoi = el.querySelector(v2 ? '.sk-bt-khoi-gia' : '.sk-bt-khoi');
    const hoi = el.querySelector(v2 ? '.qz-text' : '.sk-bt-hoi');
    const goi = el.querySelector('.sk-bt-goi');
    const dap = [...el.querySelectorAll(v2 ? '.qz-opt' : '.sk-bt-dap')];
    // con tro luc doc dap an: gach chan duoi CHU (span noi dong — chi rong bang chu), khong phai ca o
    const chuDap = dap.map(d => d.querySelector('.sk-bt-doc') || d);
    const cues = [];
    // Q0 (v2 B1): cau hoi + 4 dap an da hien san khi the vao — khong so le tung khoi
    // Q1: doc cau hoi -> con tro toi cau hoi
    const jpHoi = (cauHoi.match(/[\u3040-\u30ff\u4e00-\u9fff\u3005\u30fc]{2,}/) || [])[0];
    const vnHoi = vn3(cauHoi.replace(JP_CUM, ' '));
    if (jpHoi || vnHoi.length) {
      cues.push({ id: 'Q1', loai: 'nhan', khi: { khop: { vn: vnHoi, jp: jpHoi ? [jpHoi] : [] }, lan: 1 },
        lam: () => conTro.den(hoi, { pad: [10, 4] }) });
    }
    // Q2.o: doc dap an o -> con tro toi dap an: gach chan 3 px duoi chu (khong to nen — to nen trong vien o
    //       la dang "da chon" / "goi y")
    let truocQ2 = (jpHoi || vnHoi.length) ? 'Q1' : undefined;
    opts.forEach((o, k) => {
      const s = String(o || '');
      const jp = chiJp(s);
      const vn = [`dap an ${L(k).toLowerCase()}`, `cau ${L(k).toLowerCase()}`];
      const ngoac = /[(（]([^)）]+)[)）]/.exec(s);
      if (ngoac) {
        const la = chuanVn(ngoac[1]);
        if (la && la === ngoac[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()) vn.push(la);   // romaji thuan
        else vn.push(...vn3(ngoac[1]));
      }
      if (!jp) vn.push(...vn3(s));                                                                  // dap an thuan Viet
      const id = 'Q2.' + k;
      cues.push({ id, loai: 'nhan', khi: { khop: { vn: boTrung(vn), jp: jp ? [jp] : [] }, lan: 1, rieng: Array.from(jp).length === 1 },
        sau: truocQ2,
        lam: () => conTro.den(chuDap[k], { pad: [4, 3], kieu: 'vach' }) });
      truocQ2 = id;
    });
    // Q3: goi y — chi hien khi Sensei noi "gợi ý" (khong bat buoc)
    if (goi) cues.push({ id: 'Q3', loai: 'hien', tuyChon: true, khi: { khop: { vn: GOI_Y }, lan: 1 },
      lam: () => { H.hien(goi, {}); conTro.den(goi, { pad: [8, 3], mo: true }); } });

    // ------------------------------------------------ trao tay: dua the that len san khau
    const P = { cong: null, aCong: null, qsA: null, henXong: [], dd: null, ro: null, daCham: false };
    const theThat = () => (P.cong && P.cong.card) || (P.aCong && P.aCong.card) || null;
    /** The that do dao dien v2 tu dua vao .sk-cong cua than the (canh khong giu no) — null neu khong */
    const theDaoDien = () => {
      if (P.cong || P.aCong) return null;
      const t = document.getElementById('card-' + q.id);
      return t && t.closest('.san-khau-giang') ? t : null;
    };

    // ---- v2: vua khung. Lop tren goc canh; css/motion-hoi.css 3d ap qua .sk-the-than:has(> .sk-canh-quiz.X)
    // cho MOI .sk-cong > .qz-card trong than (ban mau + the that + ban sao cua dao dien) -> trao tay khong nhay.
    /**
     * Truoc khi cham: khung ngan hon ban mau (cau hoi + 4 dap an) thi gon mot bac (.sk-bt-nho). Goi tu
     * ResizeObserver (sau bo cuc, truoc khi ve — khong doc bo cuc luc dung canh) va luc trao tay.
     * Da cham thi thoi (bo cuc sau cham do datKetQua lo).
     */
    function vuaBanMau() {
      if (canh.daHuy || P.daCham || !gia || !khoi || !gia.isConnected || !gia.clientHeight) return;
      el.classList.remove('sk-bt-nho');
      if (khoi.offsetHeight > gia.clientHeight + 1) el.classList.add('sk-bt-nho');
    }
    if (v2 && gia && khoi && window.ResizeObserver) {
      try { P.ro = new ResizeObserver(() => vuaBanMau()); P.ro.observe(gia); P.ro.observe(khoi); } catch (e) { P.ro = null; }
    }
    /** Luc trao tay (v2, dao dien tu mo cong): nhan the that de vua khung sau khi cham */
    function nhanTheDaoDien() {
      if (canh.daHuy) return;
      const card = theDaoDien();
      if (!card) return;
      P.dd = card;
      if (P.qsA) { try { P.qsA.disconnect(); } catch (e) {} }
      P.qsA = theoDoiNhanXet(card, () => { if (card.classList.contains('sk-bt-fb-hien')) datKetQua(card, true); });
    }
    /**
     * Sau khi cham (v2): nhan xet hien, KHONG dap an nao bien mat (hoc vien van so sanh duoc 4 dap an).
     * Nang tung bac, khong lui, do/doi dong bo trong mot lan (chua ve) cho toi khi the lot khung:
     *   1) dap an khong chon da mo .5 (CSS, luc nhan xet hien);
     *   2) khung rong (cong >= 700 px) + dap an xep doc: nhan xet sang COT PHAI canh dap an (.sk-bt-2cot);
     *   3) nhan xet gon (.sk-bt-fb-gon); 4) dap an khong chon gon lai (.sk-bt-dap-gon, van doc duoc);
     *   5) thu ca the bang --sk-co (x .9, x .82 cua cong); 6) nhan xet chat them (.sk-bt-fb-gon-2);
     *   7) cau hoi mot dong (.sk-bt-kq-hoi, chi giu khi nho vay the lot).
     * Dat cho: lot ma giu duoc dinh cu -> neo (cau hoi dung yen, nhan xet hien dan); khong thi can giua;
     * van tran -> sat tren + cuon vua du toi nhan xet (khong bao gio qua dap an dung).
     * The doi cho -> MOT lan truot FLIP ca the 320 ms (nhan xet di theo, khong hien dan rieng): toi da 2
     * hieu ung trong the cung dem nguoc "Tiếp tục".
     */
    function datKetQua(card, truot) {
      if (canh.daHuy || !card || !card.isConnected) return;
      const cuon = card.closest('.sk-cong');
      if (!cuon || !cuon.clientHeight) return;
      // 0) do truoc khi ghi: vi tri tren man hinh (FLIP) + dinh bo cuc trong noi dung cuon
      const r0 = card.getBoundingClientRect();
      const y0 = viTriTrong(card, cuon);
      const dinh = Math.max(0, Math.round(y0 != null ? y0 : r0.top - cuon.getBoundingClientRect().top + cuon.scrollTop));
      const H0 = cuon.clientHeight, W0 = cuon.clientWidth;
      if (!card.classList.contains('sk-bt-fb-hien')) card.classList.add('sk-bt-fb-hien');
      // cao cua the khong phu thuoc phan neo (the flex: none) -> do truc tiep
      const lot = () => card.offsetHeight <= H0 - 2;
      const buoc = [];
      const them = (lop) => { if (!el.classList.contains(lop)) { el.classList.add(lop); buoc.push(lop); } };
      if (!lot() && W0 >= 700 && cuon.classList.contains('is-mot-cot')) them('sk-bt-2cot');
      if (!lot()) them('sk-bt-fb-gon');
      if (!lot()) them('sk-bt-dap-gon');
      if (!lot()) {
        const goc = parseFloat(getComputedStyle(cuon).getPropertyValue('--sk-co')) || 1;
        const coNay = parseFloat(card.style.getPropertyValue('--sk-co')) || goc;
        for (const f of [0.9, 0.82]) {
          if (lot()) break;
          const co = +(goc * f).toFixed(3);
          if (co >= coNay - 0.001) continue;          // khong lui
          card.style.setProperty('--sk-co', String(co));
          theCoRieng.add(card);
          buoc.push('co' + co);
        }
      }
      if (!lot()) them('sk-bt-fb-gon-2');
      if (!lot() && !el.classList.contains('sk-bt-kq-hoi')) {
        el.classList.add('sk-bt-kq-hoi');
        if (!lot()) el.classList.remove('sk-bt-kq-hoi'); else buoc.push('sk-bt-kq-hoi');
      }
      // bac sau da du -> bo bac truoc khong can nua (nhe nhang nhat co the; giu .sk-bt-2cot va co chu)
      if (lot() && buoc.length > 1) {
        const cuoi = buoc[buoc.length - 1];
        for (const lop of ['sk-bt-fb-gon-2', 'sk-bt-fb-gon', 'sk-bt-dap-gon']) {
          if (lop === cuoi || !buoc.includes(lop)) continue;
          el.classList.remove(lop);
          if (lot()) buoc.splice(buoc.indexOf(lop), 1); else el.classList.add(lop);
        }
      }
      // dat cho (cuon NGAY, khong muot: mot lan FLIP ca the ben duoi gom ca doi neo lan cuon)
      const h = card.offsetHeight, vua = h <= H0 - 2;
      if (vua && dinh + h <= H0) { cuon.style.justifyContent = 'flex-start'; cuon.style.paddingTop = dinh + 'px'; }
      else if (vua) { cuon.style.justifyContent = ''; cuon.style.paddingTop = ''; }
      else { cuon.style.justifyContent = 'flex-start'; cuon.style.paddingTop = '0px'; }
      if (vua) { cuon.style.paddingBottom = ''; if (cuon.scrollTop > 0) cuonNgay(cuon, 0); }
      else cuonToiNhanXet(card, cuon, true);
      // FLIP ca the (mot chuyen dong)
      const r1 = card.getBoundingClientRect();
      const dy = r0.top - r1.top;
      let daTruot = false;
      if (truot && !H.giam() && Math.abs(dy) > 1) {
        card.classList.add('sk-bt-fb-truot');
        hoat(canh, card, [{ translate: `0 ${dy.toFixed(1)}px`, offset: 0 }], { duration: 320, easing: E_OUT });
        daTruot = true;
      }
      ghiVua({ vao: truot ? 'hien' : 'doi', dinh, cao: h, H0, W0, vua, buoc, daTruot, dy: Math.round(dy), cuon: Math.round(cuon.scrollTop),
        an: [...card.querySelectorAll('.qz-opt')].filter(o => o.offsetParent === null).length });
    }
    /** Cuon ngay (khong muot, khong qua scrollTo da boc cua dao dien) */
    function cuonNgay(cuon, top) {
      try { Element.prototype.scrollTo.call(cuon, { top: Math.max(0, top), left: cuon.scrollLeft, behavior: 'instant' }); }
      catch (e) { cuon.scrollTop = Math.max(0, top); }
    }
    /** Dap an dung (dung / lo ra khi chon sai) dang hien trong the — null neu khong co */
    function dapDung(card) {
      const d = card.querySelector('.qz-opt.is-correct, .qz-opt.is-answer');
      return d && d.offsetParent !== null ? d : null;
    }
    /**
     * Cuon cong vua du de thay het nhan xet: hien PHAN DUOI dai nhat cua the — tu mep tren mot hang (cau
     * hoi / hang dap an) toi het nhan xet — ma lot khung; khoang tho chia deu tren / duoi nhung khong de lo
     * mot mau hang phia tren (khong cat ngang dong chu). Nhan xet cao hon khung: dung o dau nhan xet.
     */
    function cuonToiNhanXet(card, cuon, ngay) {
      try {
        const ex = card.querySelector('.qz-fb');
        if (!ex || !ex.offsetHeight) return;
        const H0 = cuon.clientHeight, s0 = cuon.scrollTop;
        // toa do BO CUC trong noi dung cuon (offsetTop: khong tinh transform — nhan xet dang hien dan tu
        // +6 px, dap an dang truot FLIP — va khong doi theo scrollTop)
        const rc = cuon.getBoundingClientRect();
        const toaDo = (e) => {
          const t = viTriTrong(e, cuon);
          if (t != null) return [t, t + e.offsetHeight];
          const r = e.getBoundingClientRect();
          return [r.top - rc.top + s0, r.bottom - rc.top + s0];
        };
        const [exTren, exDay] = toaDo(ex);
        const dung = dapDung(card);
        const [dTren, dDay] = dung ? toaDo(dung) : [s0, s0];
        if (exDay + 4 <= s0 + H0 && exTren >= s0 && dTren >= s0 && dDay <= s0 + H0) return;   // da thay tron nhan xet + dap an dung
        // hang = cac khoang doc gop lai khi chong nhau (2x2: hai dap an cung hang; .sk-bt-2cot: nhan xet
        // nam canh dap an -> cung mot khoi)
        const hang = [];
        [card.querySelector('.qz-q'), ...card.querySelectorAll('.qz-opt'), ex]
          .filter(e => e && e.offsetParent !== null).map(toaDo).sort((a, b) => a[0] - b[0])
          .forEach(([t, b]) => { const l = hang[hang.length - 1]; if (l && t < l[1] - 1) l[1] = Math.max(l[1], b); else hang.push([t, b]); });
        if (!hang.length) return;
        const day = Math.max(exDay, hang[hang.length - 1][1]);
        // khong bao gio cuon qua hang cua dap an dung: khoi van tran thi dung o do (nhan xet cat duoi, cuon xem tiep)
        const iDung = dung ? hang.findIndex(x => Math.abs(x[0] - dTren) < 2 || (dTren >= x[0] && dTren < x[1])) : -1;
        let s = null, iHang = -1;
        for (let i = 0; i < hang.length && s == null; i++) {
          const hB = day - hang[i][0];
          if (hB > H0 && i < hang.length - 1 && (iDung < 0 || i < iDung)) continue;
          // ca the lot khung: dat giua (phia tren chi la phan neo); tu hang sau: khoang tho <= 8 px va nho
          // hon khe voi hang tren (khong lo mau hang tren)
          const ho = i ? hang[i][0] - hang[i - 1][1] : 0;
          const tho = i === 0 ? Math.max(0, Math.floor((H0 - hB) / 2))
            : Math.max(0, Math.min(8, Math.floor((H0 - hB) / 2), Math.floor(ho) - 1));
          s = hang[i][0] - tho;
          iHang = i;
        }
        s = Math.max(0, s);
        ghiVua({ H0, s0, s, iHang, hang: hang.map(x => x.map(Math.round)), lop: el.className.replace(/.*sk-bt-v2 ?/, '') });
        // diem dung sach nam qua cuoi noi dung: dem duoi cho toi duoc (an han phan tu phia tren, khong cat
        // ngang dong chu). Cuoi noi dung tinh theo BO CUC (scrollHeight con tinh ca phan tran do transform
        // dang chay -> het hieu ung trinh duyet kep scrollTop lai). Chi tang dem (giam -> kep -> nhay)
        const pb = parseFloat(cuon.style.paddingBottom) || 0;
        const cuoi = toaDo(card)[1] + (parseFloat(getComputedStyle(card).marginBottom) || 0) + pb;
        const thieu = s - (cuoi - H0);
        if (thieu > 0.5) cuon.style.paddingBottom = (pb + Math.ceil(thieu)) + 'px';
        s = Math.min(s, Math.max(cuoi - H0, 0) + Math.max(0, Math.ceil(thieu)));
        if (Math.abs(s - s0) > 1) {
          if (ngay) cuonNgay(cuon, s);
          else cuon.scrollTo({ top: s, behavior: H.giam() ? 'auto' : 'smooth' });
        }
      } catch (e) {}
    }
    /** Vua the sau khi cham (khung nhan xet mo rong the): tran khoi the thi thu chu lai mot bac */
    function vuaCong() {
      const card = theThat();
      if (!card || canh.daHuy || !card.isConnected) return;
      card.classList.remove('sk-bt-gon');
      el.classList.remove('sk-bt-gon');
      const hop = card.closest('.sk-the') || el;
      const tran = () => {
        const rH = hop.getBoundingClientRect(), rC = card.getBoundingClientRect();
        return rC.bottom > rH.bottom + 1 || (P.cong && noi.scrollHeight > noi.clientHeight + 1) || hop.scrollHeight > hop.clientHeight + 1;
      };
      if (tran()) { card.classList.add('sk-bt-gon'); if (P.cong) el.classList.add('sk-bt-gon'); }
    }
    /** Nhan xet tran vung cuon cua the: cuon nhe de thay nhan xet ma dap an dung van trong khung */
    function lamRoNhanXet(card) {
      try {
        const cuon = card.closest('.sk-cong, .sk-hoi-noi');
        if (!cuon || cuon.scrollHeight <= cuon.clientHeight + 1) return;
        const ex = card.querySelector('.qz-fb');
        const dung = card.querySelector('.qz-opt.is-correct, .qz-opt.is-answer');
        if (!ex) return;
        const rc = cuon.getBoundingClientRect(), re = ex.getBoundingClientRect();
        let d = re.bottom - rc.bottom + 8;
        if (dung) d = Math.min(d, dung.getBoundingClientRect().top - rc.top - 8);
        if (d > 1) cuon.scrollBy({ top: d, behavior: H.giam() ? 'auto' : 'smooth' });
      } catch (e) {}
    }
    function theoDoiNhanXet(card, khiDoi) {
      try {
        const ex = card.querySelector('#' + cssId('explain-' + q.id));
        if (!ex) return null;
        const qs = new MutationObserver(khiDoi || (() => vuaCong()));
        qs.observe(ex, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        return qs;
      } catch (e) { return null; }
    }
    /**
     * Dao dien v2 tu dua the that vao than the (o .sk-cong, anh em cua canh nay). Khoi san khau nhuong
     * cho: mo di 200 ms roi an han (khong trung chu tren the); the that dung khuon .sk-trong-cong.
     * O cong nam noi tiep DUOI khoi (khong chong len nhau) thi khoi thu gon ngay de the that len dung cho.
     */
    function nhuongCong(o, xong) {
      P.aCong = o;
      const card = o.card, cong = o.cong;
      khoi.removeAttribute('id');
      boHetId(khoi);
      el.classList.add('sk-bt-nhuong');
      if (goi) goi.classList.add('is-giau');
      conTro.an();
      if (P.qsA) { try { P.qsA.disconnect(); } catch (e) {} }
      P.qsA = theoDoiNhanXet(card);
      let noiTiep = false;
      try {
        const rR = khoi.getBoundingClientRect(), rC = cong.getBoundingClientRect();
        noiTiep = !!(rC.height && rR.height && rC.top >= rR.bottom - 2);
      } catch (e) {}
      khoi.classList.add('is-trao');
      if (noiTiep) {
        el.classList.add('sk-bt-thu');
        khoi.classList.add('is-da-trao');
        vuaCong();
        xong();
        return 0;
      }
      const ms = H.giam() ? 0 : 200;
      if (ms) hoat(canh, khoi, [{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: E_IN });
      P.henXong.push(setTimeout(() => { if (!canh.daHuy) { khoi.classList.add('is-da-trao'); vuaCong(); } }, ms + 20));
      if (!ms) { xong(); return 0; }
      P.henXong.push(setTimeout(xong, ms));
      return ms;
    }
    /** Cac anh em cua duong tu cho cu toi #slideContent: inert trong luc the o san khau */
    function khoaQuanh(dau) {
      const sc = document.getElementById('slideContent');
      const ds = [];
      let n = dau;
      while (n && n !== sc && n.parentElement) {
        for (const s of n.parentElement.children) if (s !== n && !s.inert) { s.inert = true; ds.push(s); }
        n = n.parentElement;
      }
      return ds;
    }
    function dua() {
      const sc = document.getElementById('slideContent');
      const card = document.getElementById('card-' + q.id);
      if (!vo || !card || !sc || !sc.contains(card) || card.closest('.san-khau-giang')) return false;
      traThe(false);
      const ids = [card, ...card.querySelectorAll('[id]')].map(e => [e, e.id]);
      const dau = document.createComment(' sk-bt-cong ' + q.id + ' ');
      card.before(dau);
      khoi.removeAttribute('id');
      boHetId(khoi);
      vo.appendChild(card);
      card.classList.remove('sk-bt-da-ve');
      card.classList.add('sk-bt-that');
      card.classList.toggle('sk-bt-hai', haiCot);
      card.inert = false;
      card.querySelectorAll('.reading-badge-indicator').forEach(b => b.remove());
      el.classList.add('sk-bt-dang-cong');
      if (goi) goi.classList.add('is-giau');
      conTro.an();
      const trongLuoi = [];
      const cong = {
        card, dau, ids, khoa: trongLuoi,
        traVe(giuBanSao) {
          if (congDang === cong) congDang = null;
          if (P.cong !== cong) return;
          P.cong = null;
          try { if (cong.qs) cong.qs.disconnect(); } catch (e) {}
          try { if (cong.qsLuoi) cong.qsLuoi.disconnect(); } catch (e) {}
          cong.khoa.forEach(s => { s.inert = false; });
          cong.khoa.length = 0;
          if (giuBanSao && card.parentNode === vo && el.isConnected) {
            // khung dung yen trong khoang nghi: ban sao tinh (khong id, khong bam duoc) dung cho the that
            const bs = card.cloneNode(true);
            bs.removeAttribute('id');
            boHetId(bs);
            bs.setAttribute('aria-hidden', 'true');
            bs.inert = true;
            bs.classList.add('sk-bt-ban-sao');
            card.before(bs);
          }
          card.classList.remove('sk-bt-that', 'sk-bt-hai', 'sk-bt-gon');
          card.classList.add('sk-bt-da-ve');
          card.querySelectorAll('.sk-bt-tick').forEach(x => x.remove());
          if (dau.isConnected) dau.replaceWith(card);
          else card.remove();                                  // luoi da ve lai trong luc cho: the cu het gia tri
          ids.forEach(([e, id]) => { if (id && !e.id) e.id = id; });
          el.classList.remove('sk-bt-dang-cong');
        },
      };
      P.cong = cong;
      congDang = cong;
      // Luoi ve lai trong luc cho (doi de, doi tab...): cho cu mat -> tra the ngay, khong de trung id
      try {
        cong.qsLuoi = new MutationObserver(() => { if (!dau.isConnected) traThe(false); });
        cong.qsLuoi.observe(sc, { childList: true, subtree: true });
      } catch (e) {}
      // Khung nhan xet do app.js ve vao the -> vua lai co chu
      cong.qs = theoDoiNhanXet(card);
      // cheo mo: khoi san khau lui, the that hien dung cho (2 hieu ung, 200 ms)
      khoi.classList.add('is-trao');
      if (!H.giam()) {
        hoat(canh, khoi, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: E_IN });
        hoat(canh, card, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: E_OUT });
      }
      vuaCong();
      return true;
    }
    /** Sau khi dao dien chot "cho": tra lai id (dao dien v1 bo id toan san khau), focus dap an A */
    function sauXong() {
      const cong = P.cong;
      if (!cong || canh.daHuy) return;
      cong.ids.forEach(([e, id]) => { if (id && !e.id) e.id = id; });
      el.classList.remove('sk-ra');
      khoi.classList.add('is-da-trao');
      if (!cong.khoa.length && cong.dau.isConnected) cong.khoa.push(...khoaQuanh(cong.dau));
      const b0 = document.getElementById(`btn-opt-${q.id}-0`);
      const ae = document.activeElement;
      try { if (b0 && !b0.disabled && !(ae && cong.card.contains(ae))) b0.focus({ preventScroll: true }); } catch (e) {}
    }

    /** Ve dau tick (net ve dan, .sk-ve) len dap an dung — goi dung luc (khong delay CSS / WAAPI) */
    function veTick(card, dung) {
      const nut = card.querySelector(dung ? '.qz-opt.is-correct' : '.qz-opt.is-answer');
      if (!nut || nut.querySelector('.sk-bt-tick')) return;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'sk-ve sk-bt-tick');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('aria-hidden', 'true');
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', 'M5.5 12.8l4.1 4.1L18.6 7.6');
      p.setAttribute('pathLength', '1');
      svg.appendChild(p);
      nut.appendChild(svg);
      if (H.giam()) return;
      hoat(canh, p, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 320, easing: E_OUT });
    }

    const S = { ketQua: null };
    Object.assign(canh, {
      el, cues,
      sr: `Bài tập ${so}/${tong}: ${cauHoi}`,
      heroEl: khoi,
      cho: { loai: 'quiz', exId: q.id, cardId: 'card-' + q.id },
      congCu: (name, args) => congCuConTro(canh, name, args),
      /**
       * Trao tay (v2): dua THE THAT #card-<id> vao dung o cua khoi cau hoi tren san khau (de lai
       * mot comment giu cho o luoi), cheo mo 200 ms. onGiua luc 100 ms, onXong luc xong. Tra ve ms.
       */
      vaoCho(onXong, onGiua, oCong) {
        let daGiua = false, daXong = false;
        const giua = () => { if (daGiua) return; daGiua = true; try { onGiua && onGiua(); } catch (e) { canhBao('vaoCho', e); } };
        const xong = () => {
          if (daXong) return;
          daXong = true;
          giua();
          if (canh.daHuy || !document.body.classList.contains('dang-giang')) return;
          try { onXong && onXong(); } catch (e) { canhBao('vaoCho', e); }
          sauXong();
        };
        if (oCong && oCong.card && oCong.cong) return nhuongCong(oCong, xong);
        const ok = dua();
        if (!ok) {
          // khong co o de dua (v2) / the da o san khau: dao dien tu mo cong ngay sau loi goi nay.
          // Do ban mau lan cuoi (ResizeObserver co the chua chay) — the that nhan cung bac gon qua :has
          khoi.removeAttribute('id');
          vuaBanMau();
          setTimeout(() => { xong(); nhanTheDaoDien(); }, 0);
          return 0;
        }
        const ms = H.giam() ? 0 : 200;
        // dao dien co the chot "cho" bang hen gio rieng (bo id): van tra id lai sau do
        P.henXong.push(setTimeout(sauXong, ms + 140), setTimeout(sauXong, ms + 400));
        if (!ms) { xong(); return 0; }
        P.henXong.push(setTimeout(giua, ms / 2), setTimeout(xong, ms));
        return ms;
      },
      /** Het cho: the that ve lai luoi (dung cho cu); san khau giu ban sao tinh qua khoang nghi.
       *  --sk-co rieng cua the go SAU khi dao dien chep ban sao (ban sao giu dung co chu) */
      raCho() { traTheCua(true); boNhuong(); setTimeout(goCoRieng, 0); },
      khiTraLoi(exId, dung) {
        if (exId !== q.id) return;
        S.ketQua = !!dung;
        P.daCham = true;
        el.dataset.ketQua = dung ? 'dung' : 'sai';
        const card = document.getElementById('card-' + q.id);
        if (!card) return;
        // Danh dau the that da cham trong luc giang: roast-shake (transform) khong chay lai
        // khi tam dung go body.dang-giang (motion-hoi.css .sk-da-cham)
        card.classList.add('sk-da-cham');
        card.classList.remove('sk-bt-dung-hien', 'sk-bt-fb-hien', 'sk-bt-fb-truot');
        if (!document.body.classList.contains('dang-giang')) return;
        // Moi buoc mot luc, toi da 2 hieu ung cung chay (hen gio, khong dung delay — delay van tinh la dang chay):
        //  dung: lop reu (tinh) + tick ve dan 320 ms; +360 ms nhan xet hien
        //  sai : lac + gach 300 ms; +380 ms dap an dung (vien reu + tick); +740 ms nhan xet hien
        const hienDung = () => { if (canh.daHuy || !card.isConnected) return; card.classList.add('sk-bt-dung-hien'); if (!dung) veTick(card, false); };
        // Nhan xet (display:none toi luc nay — khong day the luc bam): hien ra thi the nhuong cho bang MOT
        // lan truot (FLIP translate 320 ms) + nhan xet hien dan; tran the thi thu chu + cuon nhe trong the
        const hienNhanXet = () => {
          if (canh.daHuy || !card.isConnected) return;
          // v2 (the o cong cua dao dien): neo dinh the, nang bac gon, truot dap an con lai, cuon vua du
          if (theDaoDien() === card) { datKetQua(card, true); return; }
          const r0 = card.getBoundingClientRect();
          card.classList.add('sk-bt-fb-hien');
          vuaCong();
          const r1 = card.getBoundingClientRect();
          const dy = r0.top - r1.top;
          // the co dich cho: MOT hieu ung (ca the truot, nhan xet di theo) thay cho hien dan rieng —
          // dem nguoc "Tiếp tục" cua dao dien co the dang chay: tong van <= 2
          if (!H.giam() && Math.abs(dy) > 1) {
            card.classList.add('sk-bt-fb-truot');
            hoat(canh, card, [{ translate: `0 ${dy.toFixed(1)}px` }, { translate: '0 0' }], { duration: 320, easing: E_OUT });
          }
          lamRoNhanXet(card);
        };
        if (dung) veTick(card, true);
        if (H.giam()) { hienDung(); hienNhanXet(); }
        else {
          if (dung) hienDung(); else P.henXong.push(setTimeout(hienDung, 380));
          P.henXong.push(setTimeout(hienNhanXet, dung ? 360 : 740));
        }
      },
      xong() {},
      giu() { traTheCua(true); boNhuong(); boHetId(el); return null; },
      huy() {
        huyChung(canh, () => {
          traTheCua(false); boNhuong(); P.henXong.forEach(clearTimeout);
          setTimeout(goCoRieng, 0);
          if (P.ro) { try { P.ro.disconnect(); } catch (e) {} P.ro = null; }
        });
      },
    });
    function traTheCua(giuBanSao) { if (P.cong) P.cong.traVe(giuBanSao); }
    /** Het cho voi cong cua dao dien: thoi theo doi the that (dao dien tu tra no ve luoi) */
    function boNhuong() {
      if (P.qsA) { try { P.qsA.disconnect(); } catch (e) {} P.qsA = null; }
      P.aCong = null;
      P.dd = null;
    }
    return canh;
  }

  // ---------------------------------------------------------------- dang ky voi dao dien
  const CANH = { 'kaiwa-intro': dungGioiThieu, 'kaiwa-run': dungNgheTron, 'kaiwa': dungMotCau, 'quiz': dungBaiTap };
  let daDangKyVoi = null;
  function dangKy() {
    const SM = window.SenseiMotion;
    if (!SM || typeof SM.dangKyCanh !== 'function') return false;
    if (daDangKyVoi === SM) return true;
    Object.keys(CANH).forEach(kind => {
      try {
        SM.dangKyCanh(kind, {
          dung(beat, c) {
            try { return CANH[kind](beat || {}, c || {}); }
            catch (e) { canhBao('dung ' + kind, e); return canhDuPhong(kind, beat, c || {}); }
          },
        });
      } catch (e) { canhBao('dangKyCanh ' + kind, e); }
    });
    daDangKyVoi = SM;
    return true;
  }
  if (!dangKy()) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', dangKy, { once: true });
    else setTimeout(dangKy, 0);
  }
  if (document.body) theoDoiTamDung();
  else document.addEventListener('DOMContentLoaded', theoDoiTamDung, { once: true });

  window.__motionHoi = {
    karaokeTuPcm,                  // (pcm, tokens) -> [giay tu dau clip | null (dau cau)]
    karaokeChiTiet,                // cum am, cum chu, nguong — de do dac
    nhatKy: () => nhatKy.slice(),  // moi token karaoke da toi: {dong, k, T, firedCtx, firedPerf, nguon}
    xoaNhatKy: () => { nhatKy.length = 0; nhatKyVua.length = 0; },
    nhatKyVua: () => nhatKyVua.slice(),   // bai tap sau khi cham: {luc, H0, s0, s, iHang, hang, lop}
    /** The that dang dua len san khau (portal) — null neu khong co */
    theDangDua: () => (congDang ? congDang.card : null),
    /** Tra the that ve luoi ngay (dao dien / kiem thu goi khi can) */
    traThe: () => traThe(false),
    dangKy,
    _canh: CANH,
    _tienIch: { chuanVn, vn3, donVi, phanBen, dongHo, taoConTro },
  };
})();
