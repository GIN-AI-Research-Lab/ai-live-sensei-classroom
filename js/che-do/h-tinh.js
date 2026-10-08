/* h-tinh.js - phan JS cua giao dien TINH (luc chua giang) che do H "Giay cat lop".
   1) NEN: dung lai DUNG diorama cua san khau (troi dao co van giay, mat troi, may, nui Phu Si, doi, co truoc, vien toi) bang
      cac ham ve chep NGUYEN VAN tu js/che-do/h.js (h.js md5 luc chep: f4f1601d85b350cd5a0ee4d87b240ae0), cung cong thuc kich thuoc (k = H / 1080,
      be rong vien lap 3840, he so parallax, dpr toi da 1,5) -> hai lop: nen (sau noi dung) + co truoc / vien toi (truoc noi dung,
      nhu san khau: co z 15 > noi dung z 10 > nen). Chi la "may quay troi nhe" (parallax) rat cham, tam dung khi dang giang / an tab / giam chuyen dong.
   2) BO CUC: vua man hinh (do khoang trong that, chon so cot / ti le chu, vien mo cuon trong).
   Gan khi <html data-che-do="h"> (che do dang CHON), go sach khi doi che do. Khong bao gio nem loi: hong thi de nguyen deck thuong.
   Lop nen KHONG mang class "cd-lop" (cong cu do san khau tim `.cd-lop` dau tien tren trang). */
(function () {
  'use strict';
  const NS = (window.SenseiCheDoTinh = window.SenseiCheDoTinh || {});
  if (NS.h) return;
  const ID = 'h';
  const root = document.documentElement;
  const TILE_D = 3840;           // be rong 1 vien lap cua lop nen (px thiet ke) - nhu h.js
  const F_LOP = [['mattroi', 0.015], ['may', 0.07], ['nui1', 0.16], ['nui2', 0.28], ['doi1', 0.5], ['doi2', 0.72]];
  const F_TRUOC = 1.25;
  const TROI = { pc: 16, dt: 9 };   // bien do troi may quay (px): may tinh 16 (nhu CAM.troi), dien thoai 5
  const QS = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(''); } })();
  const DRIFT = QS.get('hDrift') !== '0';
  const giamMq = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)'); } catch (e) { return { matches: false, addEventListener() {}, removeEventListener() {} }; } })();
  const canhBao = (() => { let n = 0; return (noi, e) => { if (n++ < 4) { try { console.warn('[h-tinh] ' + noi, e); } catch (x) {} } }; })();

  let VAN = null;
  function rng(seed) {
    let a = seed | 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function vanGiay() {
    if (VAN) return VAN;
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const g = cv.getContext('2d');
    const id = g.createImageData(256, 256);
    const r = rng(77);
    // lop van giay = den trong suot (alpha = 1 - v/255, tuong duong nhan voi xam v nhung KHONG dung background-blend-mode: re hon khi ve)
    for (let i = 0; i < 256 * 256; i++) {
      const v = 242 + Math.floor((r() - 0.5) * 22);
      id.data[i * 4] = 70; id.data[i * 4 + 1] = 52; id.data[i * 4 + 2] = 36; id.data[i * 4 + 3] = Math.round((1 - v / 255) * 255);
    }
    g.putImageData(id, 0, 0);
    g.lineCap = 'round';
    for (let k = 0; k < 90; k++) {
      const x = r() * 256, y = r() * 256, a = r() * Math.PI * 2, l = 6 + r() * 22;
      g.strokeStyle = r() < 0.5 ? 'rgba(120,90,60,.10)' : 'rgba(255,255,255,.16)';
      g.lineWidth = 0.6 + r() * 0.8;
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a + 0.5) * l * 0.5, y + Math.sin(a + 0.5) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
    try { VAN = cv.toDataURL('image/png'); } catch (e) { VAN = ''; }
    return VAN;
  }
  function hamSong(seed, base, song, Wd) {
    const r = rng(seed);
    const ph = song.map(() => r() * Math.PI * 2);
    const per = song.map((s) => Wd / Math.max(1, Math.round(Wd / s[1])));
    return (x) => { let y = base; for (let i = 0; i < song.length; i++) y += song[i][0] * Math.sin(x / per[i] * Math.PI * 2 + ph[i]); return y; };
  }
  function duongDoi(x0, x1, fn, buoc) {
    x0 = Math.floor(x0 / buoc) * buoc;
    let d = 'M' + x0 + ',1400 L' + x0 + ',' + fn(x0).toFixed(1);
    for (let x = x0; x <= x1 + buoc; x += buoc) d += ' L' + (x + buoc).toFixed(1) + ',' + fn(x + buoc).toFixed(1);
    return d + ' L' + (x1 + buoc) + ',1400 Z';
  }
  function duongVien(x0, x1, fn, buoc) {
    x0 = Math.floor(x0 / buoc) * buoc;
    let d = 'M' + x0 + ',' + fn(x0).toFixed(1);
    for (let x = x0 + buoc; x <= x1; x += buoc) d += ' L' + x.toFixed(1) + ',' + fn(x).toFixed(1);
    return d;
  }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function tron(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  const P2 = (d) => new Path2D(d);
  // ---- cac hinh (ve tren ctx da co bien doi thiet ke)
  function veMay(g, x, y, s, r) {
    g.save(); g.translate(x, y); g.scale(s, s);
    const n = 3 + Math.floor(r() * 2), w = 260;
    g.fillStyle = '#fdf8ef'; rr(g, 0, -10, w, 46, 23); g.fill();
    for (let i = 0; i < n; i++) { const cx = 40 + i * (w - 80) / (n - 1), cr = 34 + r() * 30; tron(g, cx, 8 - cr * 0.45, cr); }
    g.fillStyle = 'rgba(200,160,120,.25)'; rr(g, 18, 26, w - 36, 6, 3); g.fill();
    g.restore();
  }
  function vePhuSi(g, cx, base, s) {
    const w = 560 * s, h = 300 * s, top = base - h, sy = top + 95 * s;
    g.fillStyle = '#c9a2a0';
    g.fill(P2('M' + (cx - w) + ',' + (base + 40) + ' C' + (cx - w * 0.55) + ',' + (base - h * 0.25) + ' ' + (cx - w * 0.22) + ',' + (top + 12) + ' ' + (cx - 60 * s) + ',' + top +
      ' L' + (cx + 60 * s) + ',' + top + ' C' + (cx + w * 0.22) + ',' + (top + 12) + ' ' + (cx + w * 0.55) + ',' + (base - h * 0.25) + ' ' + (cx + w) + ',' + (base + 40) + ' Z'));
    g.fillStyle = '#fbf4ea';
    g.fill(P2('M' + (cx - 60 * s) + ',' + top + ' L' + (cx + 60 * s) + ',' + top + ' C' + (cx + 110 * s) + ',' + (top + 30 * s) + ' ' + (cx + 150 * s) + ',' + (sy - 30 * s) + ' ' + (cx + 175 * s) + ',' + sy +
      ' L' + (cx + 120 * s) + ',' + (sy - 18 * s) + ' L' + (cx + 80 * s) + ',' + (sy + 8 * s) + ' L' + (cx + 30 * s) + ',' + (sy - 22 * s) + ' L' + (cx - 20 * s) + ',' + (sy + 10 * s) +
      ' L' + (cx - 70 * s) + ',' + (sy - 20 * s) + ' L' + (cx - 115 * s) + ',' + (sy + 4 * s) + ' L' + (cx - 175 * s) + ',' + sy + ' C' + (cx - 150 * s) + ',' + (sy - 30 * s) + ' ' + (cx - 110 * s) + ',' + (top + 30 * s) + ' ' + (cx - 60 * s) + ',' + top + ' Z'));
  }
  function veThap(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    [[70, 0], [58, -46], [46, -88], [34, -124]].forEach((tg) => {
      const w = tg[0], yy = tg[1];
      g.fillStyle = '#b37457'; g.fillRect(-w * 0.36, yy - 30, w * 0.72, 32);
      g.fillStyle = '#8f5641';
      g.fill(P2('M' + (-w) + ',' + (yy - 26) + ' Q0,' + (yy - 52) + ' ' + w + ',' + (yy - 26) + ' L' + (w * 0.7) + ',' + (yy - 18) + ' L' + (-w * 0.7) + ',' + (yy - 18) + ' Z'));
    });
    g.fillStyle = '#8f5641'; g.fillRect(-3, -190, 6, 40);
    g.restore();
  }
  function veCayNon(g, x, y, s, r) {
    const mau = ['#7f9564', '#94a36d', '#a8a86e'][Math.floor(r() * 3)];
    const h = 120 * s, w = 44 * s;
    g.fillStyle = mau; g.fill(P2('M' + x + ',' + (y - h) + ' L' + (x + w) + ',' + y + ' L' + (x - w) + ',' + y + ' Z'));
    g.fillStyle = 'rgba(40,50,20,.14)'; g.fill(P2('M' + x + ',' + (y - h) + ' L' + (x + w) + ',' + y + ' L' + x + ',' + y + ' Z'));
  }
  function veCayTron(g, x, y, s, r) {
    const mau = ['#6b8a5e', '#7d9a66', '#d6a94a', '#c96442', '#5f7f52'][Math.floor(r() * 5)];
    const rad = 38 * s, th = 60 * s;
    g.fillStyle = '#7b5236'; g.fillRect(x - 5 * s, y - th, 10 * s, th);
    g.fillStyle = mau; tron(g, x, y - th - rad * 0.6, rad);
    g.fillStyle = 'rgba(30,30,10,.13)';
    g.fill(P2('M' + (x - rad * 0.1) + ',' + (y - th - rad * 1.6) + ' A' + rad + ',' + rad + ' 0 0 1 ' + (x - rad * 0.1) + ',' + (y - th + rad * 0.4) + ' Z'));
  }
  /** Lop ve bang 2 canvas: tmp (nhom) -> chinh voi 2 bong (mem + sat), giong bo loc SVG cua ban mau */
  function veNhom(main, tmp, k, mau, sd, dy, op, ve) {
    const g = tmp.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, tmp.width, tmp.height);
    g.setTransform(k, 0, 0, k, 0, 0);
    ve(g);
    main.save();
    main.setTransform(1, 0, 0, 1, 0, 0);
    main.shadowColor = mau; main.shadowBlur = sd * 2 * k; main.shadowOffsetY = dy * k;
    main.globalAlpha = 1;
    main.drawImage(tmp, 0, 0);
    main.shadowColor = 'rgba(58,32,12,.26)'; main.shadowBlur = 1.6 * 2 * k; main.shadowOffsetY = 0;
    main.drawImage(tmp, 0, 0);
    main.shadowColor = 'transparent'; main.shadowBlur = 0;
    main.drawImage(tmp, 0, 0);
    main.restore();
  }
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
  /** Dinh nghia tung lop: ve(main, tmp, k) len canvas (k = px/diem thiet ke) */
  function dinhNghiaLop(Wd) {
    const ve3 = (g, fn) => { fn(g, 0); fn(g, Wd); fn(g, -Wd); };       // ve them ban sao +-Wd cho cac hinh giao mep vien (lap lien tuc)
    return {
      mattroi(main, tmp, k) {
        veNhom(main, tmp, k, rgba('#8a4a18', 0.25), 10, 4, 1, (g) => {
          g.fillStyle = '#f7dc9c'; tron(g, 1640, 330, 205);
          g.fillStyle = '#f1c56e'; tron(g, 1640, 330, 160);
          g.fillStyle = '#e8a94a'; tron(g, 1640, 330, 118);
        });
        main.save(); main.setTransform(k, 0, 0, k, 0, 0);
        main.strokeStyle = 'rgba(255,255,255,.35)'; main.lineWidth = 3; main.setLineDash([4, 14]);
        main.beginPath(); main.arc(1640, 330, 118, 0, Math.PI * 2); main.stroke();
        main.restore();
      },
      may(main, tmp, k) {
        const r = rng(31), may = [];
        for (let x = 120; x < Wd; x += 520 + r() * 360) { const y = 120 + r() * 300, s = 0.7 + r() * 0.6; may.push([x, y, s, r() ]); }
        veNhom(main, tmp, k, rgba('#8a5a30', 0.22), 8, 6, 1, (g) => {
          may.forEach((m, i) => ve3(g, (gg, off) => { const rr2 = rng(900 + i); veMay(gg, m[0] + off, m[1], m[2], rr2); }));
        });
      },
      nui1(main, tmp, k) {
        const f = hamSong(11, 560, [[34, 980], [20, 430], [8, 170]], Wd);
        veNhom(main, tmp, k, rgba('#7a4a28', 0.30), 12, -3, 1, (g) => {
          vePhuSi(g, 1540, 560, 1.0); vePhuSi(g, 100, 575, 0.85); vePhuSi(g, 100 + Wd, 575, 0.85); vePhuSi(g, 1540 - Wd, 560, 1.0);
          g.fillStyle = '#e3c3a3'; g.fill(P2(duongDoi(-200, Wd + 200, f, 30)));
        });
        main.save(); main.setTransform(k, 0, 0, k, 0, 0);
        main.strokeStyle = 'rgba(255,248,235,.55)'; main.lineWidth = 3; main.stroke(P2(duongVien(-200, Wd + 200, f, 30)));
        main.restore();
      },
      nui2(main, tmp, k) {
        const f = hamSong(12, 640, [[30, 760], [16, 320], [6, 120]], Wd);
        const r = rng(55), nha = [];
        for (let x = 700; x < Wd; x += 1300 + r() * 900) nha.push([x, 0.8 + r() * 0.3]);
        veNhom(main, tmp, k, rgba('#6a3a1c', 0.32), 12, -3, 1, (g) => {
          nha.forEach((n) => ve3(g, (gg, off) => veThap(gg, n[0] + off, f(n[0] + off) + 14, n[1])));
          g.fillStyle = '#d4a684'; g.fill(P2(duongDoi(-200, Wd + 200, f, 30)));
        });
        main.save(); main.setTransform(k, 0, 0, k, 0, 0);
        main.strokeStyle = 'rgba(255,240,220,.45)'; main.lineWidth = 3; main.stroke(P2(duongVien(-200, Wd + 200, f, 30)));
        main.restore();
      },
      doi1(main, tmp, k) {
        const f = hamSong(13, 722, [[26, 640], [13, 270]], Wd);
        const r = rng(66), cay = [];
        for (let x = 60; x < Wd; x += 70 + r() * 190) cay.push([x, 0.7 + r() * 0.6, rng(Math.floor(r() * 1e6))]);
        veNhom(main, tmp, k, rgba('#4a3a18', 0.33), 11, -3, 1, (g) => {
          cay.forEach((c) => ve3(g, (gg, off) => veCayNon(gg, c[0] + off, f(c[0] + off) + 12, c[1], rng(Math.floor(c[0] * 7)))));
          g.fillStyle = '#b9b98a'; g.fill(P2(duongDoi(-200, Wd + 200, f, 26)));
        });
        main.save(); main.setTransform(k, 0, 0, k, 0, 0);
        main.strokeStyle = 'rgba(255,255,230,.4)'; main.lineWidth = 3; main.stroke(P2(duongVien(-200, Wd + 200, f, 26)));
        main.restore();
      },
      doi2(main, tmp, k) {
        const f = hamSong(14, 800, [[28, 760], [14, 330]], Wd);
        const r = rng(88), cay = [];
        for (let x = 80; x < Wd; x += 110 + r() * 260) cay.push([x, 0.75 + r() * 0.55]);
        veNhom(main, tmp, k, rgba('#33301a', 0.36), 12, -4, 1, (g) => {
          cay.forEach((c) => ve3(g, (gg, off) => veCayTron(gg, c[0] + off, f(c[0] + off) + 14, c[1], rng(Math.floor(c[0] * 13)))));
          g.fillStyle = '#90a677'; g.fill(P2(duongDoi(-200, Wd + 200, f, 26)));
        });
        main.save(); main.setTransform(k, 0, 0, k, 0, 0);
        main.strokeStyle = 'rgba(240,255,220,.35)'; main.lineWidth = 3; main.stroke(P2(duongVien(-200, Wd + 200, f, 26)));
        main.restore();
      },
      truoc(main, tmp, k) {
        const f5 = hamSong(15, 900, [[16, 640], [8, 240]], Wd);
        const r = rng(99), hoa = [];
        for (let x = 30; x < Wd; x += 60 + r() * 150) {
          const mau = ['#e8b24f', '#f3ead9', '#d9704d', '#f0c7a8'][Math.floor(r() * 4)];
          hoa.push([x, f5(x) + 26 + r() * 70, 5 + r() * 5, mau]);
        }
        const co = (a, b) => {
          const st2 = 16, xa = Math.floor(a / st2) * st2;
          let d = 'M' + xa + ',1400';
          for (let x = xa; x <= b + st2; x += st2) {
            const h = 6 + 16 * Math.abs(Math.sin(x * 12.9898) * Math.sin(x * 0.0713 + 1.7));
            d += ' L' + x + ',' + f5(x).toFixed(1) + ' L' + (x + st2 / 2) + ',' + (f5(x + st2 / 2) - h).toFixed(1);
          }
          return d + ' L' + (Math.floor(b / st2) * st2 + 2 * st2) + ',1400 Z';
        };
        veNhom(main, tmp, k, rgba('#1f2a12', 0.42), 14, -5, 1, (g) => { g.fillStyle = '#5d7a4e'; g.fill(P2(co(-200, Wd + 200))); });
        main.save(); main.setTransform(k, 0, 0, k, 0, 0);
        main.globalAlpha = 0.6; main.fillStyle = '#557147'; main.fill(P2(duongDoi(-200, Wd + 200, (x) => f5(x) + 60, 40)));
        main.globalAlpha = 1;
        hoa.forEach((h) => [0, Wd, -Wd].forEach((off) => {
          main.fillStyle = h[3]; tron(main, h[0] + off, h[1], h[2]);
          main.fillStyle = 'rgba(90,50,20,.45)'; tron(main, h[0] + off, h[1], h[2] * 0.38);
        }));
        main.restore();
      },
    };
  }
  // do phan giai lop nen (chep tu h.js)
  const QUAL = { mattroi: 0.4, may: 0.5, nui1: 0.55, nui2: 0.65, doi1: 0.8, doi2: 0.9, truoc: 1 };
  function taoLopAnh(ten, k, dpr) {
    const Wd = TILE_D;
    dpr = dpr * (QUAL[ten] || 1);
    const w = Math.max(64, Math.round(Wd * k * dpr)), h = Math.max(64, Math.round(1080 * k * dpr));
    const main = document.createElement('canvas'); main.width = w; main.height = h;
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
    const g = main.getContext('2d');
    g.setTransform(k * dpr, 0, 0, k * dpr, 0, 0);
    const def = dinhNghiaLop(Wd)[ten];
    def(g, tmp, k * dpr);
    return new Promise((ok) => main.toBlob((b) => ok(b ? URL.createObjectURL(b) : null), 'image/png'));
  }

  // ================================================================== NEN
  const dangGiang = () => !!(document.body && document.body.classList.contains('dang-giang'));
  let M = null;                  // trang thai dang gan (null = chua gan)
  // bitmap 7 lop: giu qua cac lan chon che do khac roi chon lai (cung kich thuoc = hien ngay, khong ve lai); thu hoi khi doi kich thuoc.
  // g = the he: moi xoaCache() tang 1; ket qua ve cua the he cu bi thu hoi (khong ro ri blob khi go / gan nhanh)
  const CACHE = { key: '', g: 0, url: Object.create(null), cho: Object.create(null) };
  const thuHoi = (u) => { try { if (u) URL.revokeObjectURL(u); } catch (e) {} };
  function xoaCache() {
    CACHE.g++;
    // anh() da cho san khau that muon url (no giu trong cache cua no): khong thu hoi, tranh lam hong lop cua giang lan sau (toi da 7 blob moi co)
    if (!CACHE.lent) Object.keys(CACHE.url).forEach((k) => thuHoi(CACHE.url[k]));
    CACHE.lent = false;
    CACHE.key = ''; CACHE.url = Object.create(null); CACHE.cho = Object.create(null);
  }
  /** Khung giong h.js doKhung: dt = dien thoai / man doc; ngan = dien thoai nam ngang (san khau that nhuong the mac dinh); hu = don vi thiet ke */
  function tinhKhung(W, H) {
    const dt = W < 640 || W / H < 1.2;
    let hu;
    if (dt) { const su = Math.min(W / 390, H / 679); hu = 0.62 * Math.max(0.8, su); }
    else { const sy = H / 1080; hu = Math.min(Math.min(W / 1920, sy * 1.38), sy); }
    return { W, H, dt, hu, ngan: W > H * 1.2 && H < 430 };
  }
  const mk = (tag, cls, cha) => { const e = document.createElement(tag); if (cls) e.className = cls; if (cha) cha.appendChild(e); return e; };
  const hen = (fn, ms) => { const t = setTimeout(() => { if (M) M.timers.delete(t); try { fn(); } catch (e) { canhBao('hen', e); } }, ms); if (M) M.timers.add(t); return t; };
  const tf = (l, cx, cy) => 'translate3d(' + (-l.tile - cx * l.f).toFixed(2) + 'px,' + (cy * l.f).toFixed(2) + 'px,0)';

  /** Keo moi lop dang co ve kich thuoc san khau moi (hinh tam: cung ti le 3840 : 1080 nen khong meo), tu the nghi, dung animation. Goi ngay khi doi co. */
  function geoLop(m, W, H) {
    const kh = tinhKhung(W, H);
    const tilePx = Math.round(TILE_D * (H / 1080));
    m.anims.forEach((a) => { try { a.cancel(); } catch (e) {} });
    m.anims = [];
    m.stale.concat(m.layers).forEach((l) => {
      l.tile = tilePx;
      const st = l.el.style;
      st.width = (tilePx + W + 4 + 24) + 'px';
      st.backgroundSize = tilePx + 'px ' + H + 'px';
      st.top = l.ten === 'truoc' && kh.dt ? Math.round(H * 0.09) + 'px' : '';
      st.transform = tf(l, -(kh.dt ? 5 : TROI.pc), 0);
    });
  }
  /** (Dung lai) 7 lop. Lop dang co (kich thuoc cu) duoc keo ve co moi lam "hinh tam" va o lai cho den khi lop moi ve xong: doi co / xoay man
      khong lo nen trong, thu tu chong khong doi (lop moi chen ngay sau lop cung ten). Lan dau (chua co gi): hien 7 lop CUNG LUC khi du. */
  function dungLop() {
    const m = M;
    if (!m) return;
    const W = m.back.clientWidth, H = m.back.clientHeight;
    if (!(W > 1 && H > 1)) return;                  // dang an / chua co kich thuoc: ResizeObserver goi lai
    const gen = ++m.gen;
    m.anims.forEach((a) => { try { a.cancel(); } catch (e) {} });
    m.anims = [];
    m.timers.forEach((t) => clearTimeout(t)); m.timers.clear();
    const kh = tinhKhung(W, H);
    m.kh = kh; m.W = W; m.H = H;
    const k = H / 1080;                            // thang thong nhat theo chieu cao (khong meo hinh) - nhu h.js dungNen
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const key = Math.round(k * 1000) + ':' + dpr;
    if (CACHE.key !== key) { xoaCache(); CACHE.key = key; }
    const tilePx = Math.round(TILE_D * k);
    m.troiPx = kh.dt ? 5 : TROI.pc;
    m.back.dataset.htDt = kh.dt ? '1' : '0';
    m.back.dataset.htNgan = kh.ngan ? '1' : '0';
    // hinh tam: moi lop con tren trang (ke ca lop cu chua go) -> co moi, tu the nghi
    const cu = m.stale.concat(m.layers);
    m.stale = cu; m.layers = [];
    geoLop(m, W, H);
    [m.back, m.front].forEach((h) => Array.from(h.querySelectorAll(':scope > .ht-vien, :scope > .ht-gam')).forEach((e) => e.remove()));
    const stand = cu.some((l) => l.el.style.backgroundImage);        // co hinh tam that (lop da ve xong) -> lop moi hien rieng tung lop; khong thi hien 7 lop cung luc
    const moi = [];
    const hien = (l) => { l.el.style.opacity = '1'; if (l.gam) l.gam.style.opacity = '1'; };
    const hostCua = (ten) => (ten === 'truoc' && !kh.ngan ? m.front : m.back);   // man ngan: co truoc nam SAU noi dung (nhu cac lop khac)
    const nhieu = F_LOP.length + 1;
    let con = nhieu;
    const xong = () => {
      if (M !== m || m.gen !== gen || --con > 0) return;
      if (!stand) moi.forEach(hien);                                  // lan dau: du 7 lop moi hien (mot lan, 0,35 s)
      hen(() => { if (m.gen !== gen) return; m.stale.forEach((l) => { try { l.el.remove(); } catch (e) {} }); m.stale = []; }, 520);
    };
    const them = (ten, f, idx) => {
      const host = hostCua(ten);
      const el = mk('div', 'ht-lop ht-l-' + ten);
      el.style.width = (tilePx + W + 4 + 24) + 'px';             // +24: du cho cho bien do troi (khong ho mep phai)
      el.style.backgroundSize = tilePx + 'px ' + H + 'px';
      if (ten === 'truoc' && kh.dt) el.style.top = Math.round(H * 0.09) + 'px';     // dien thoai: ha co truoc xuong (nhu h.js)
      const ref = cu.filter((l) => l.ten === ten && l.el.parentNode === host).pop();
      let gam = null;
      if (ten === 'truoc') {
        gam = mk('div', 'ht-gam');
        if (ref) ref.el.after(gam); else host.appendChild(gam);
        gam.after(el);
      } else if (ref) ref.el.after(el); else host.appendChild(el);
      const info = { el, f, tile: tilePx, ten, gam };
      moi.push(info); m.layers.push(info);
      const gan = (u) => {
        if (M !== m || m.gen !== gen) return;
        if (u && el.isConnected) { el.style.backgroundImage = 'url(' + u + ')'; if (stand) hien(info); }
        xong();
      };
      if (CACHE.url[ten]) gan(CACHE.url[ten]);
      else {
        const lay = () => {
          if (CACHE.key !== key) { xong(); return; }   // da doi co giua chung
          if (dangGiang() && !CACHE.cho[ten]) { m.cho = true; return; }   // dang giang: nhuong CPU cho san khau that, ve tiep khi giang xong (dung() chay lai)
          if (!CACHE.cho[ten]) {
            const g0 = CACHE.g;
            CACHE.cho[ten] = taoLopAnh(ten, k, dpr).then((u) => {
              if (!u) return null;
              if (CACHE.g !== g0 || CACHE.key !== key) { thuHoi(u); return null; }       // the he cu: thu hoi, khong ro ri
              if (CACHE.url[ten]) { if (CACHE.url[ten] !== u) thuHoi(u); return CACHE.url[ten]; }
              CACHE.url[ten] = u; return u;
            }).catch((e) => { canhBao('ve lop ' + ten, e); return null; });
          }
          CACHE.cho[ten].then(gan);
        };
        // moi lop ve o mot khung rieng, cach nhau ~0,22 s (khong don mot cu giat); lop dang ve do dang (chon lai che do) dung lai ngay
        if (CACHE.cho[ten]) lay(); else hen(lay, 60 + 220 * idx);
      }
      return info;
    };
    // thu tu DOM = thu tu chong: troi, mat troi, may, nui1, nui2, doi1, doi2 (sau noi dung); gam + co truoc + vien toi (truoc noi dung; man ngan: sau)
    F_LOP.forEach(([ten, f], i) => them(ten, f, i));
    them('truoc', F_TRUOC, F_LOP.length);
    const vien = mk('div', 'ht-vien', hostCua('truoc'));
    vien.style.setProperty('--ht-hu', kh.hu.toFixed(4) + 'px');
    animar();
  }
  /** Tu the nghi = tu the dau cua may quay san khau (x = -troi, y = 0); troi nhe qua lai rat cham (WAAPI: chay tren compositor) */
  function animar() {
    const m = M;
    if (!m) return;
    m.anims.forEach((a) => { try { a.cancel(); } catch (e) {} });
    m.anims = [];
    const t = m.troiPx;
    m.layers.forEach((l) => {
      l.el.style.transform = tf(l, -t, 0);
      if (!DRIFT || giamMq.matches || !l.el.animate) return;
      try {
        const a = l.el.animate([{ transform: tf(l, -t, 0) }, { transform: tf(l, t, -9) }], { duration: 36000, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out', fill: 'both' });
        m.anims.push(a);
      } catch (e) { canhBao('animate', e); }
    });
    capNhatAnim();
  }
  /** Doc tu the may quay cua san khau that (cac lop .h-lop dang gan, transform inline): ten lop -> [x, y] (px). Chi doc, khong sua gi. */
  function docPoseLive() {
    const o = {};
    document.querySelectorAll('.cd-lop .h-lop').forEach((e) => {
      const c = Array.prototype.find.call(e.classList, (x) => x.indexOf('h-l-') === 0);
      const mt = /translate3d\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px/.exec(e.style.transform || '');
      if (c && mt) o[c.slice(4)] = [parseFloat(mt[1]), parseFloat(mt[2])];
    });
    return o;
  }
  /** Dung giang: nen idle bat dau tu CHINH tu the may quay cua san khau that roi truot ve tu the nghi (1 s, power2.inOut nhu may quay that) — khong nhay mot cu.
      Tra true neu da dung animation (khi do animar() se chay lai troi nhe sau khi ve xong). */
  function veNghi(pose) {
    const m = M;
    if (!m || !pose || giamMq.matches || !DRIFT || document.hidden) return false;
    const t = m.troiPx;
    const ds = [];
    m.layers.forEach((l) => {
      const p = pose[l.ten];
      if (!p || !l.el.animate || !l.el.style.backgroundImage) return;
      const xr = -l.tile + t * l.f;                                   // x tu the nghi
      const xl = Math.abs(p[0] - xr) <= Math.abs(p[0] - l.tile - xr) ? p[0] : p[0] - l.tile;   // ban tuong duong (chu ky = 1 vien lap) gan the nghi nhat: khong truot ca vien
      const tu = 'translate3d(' + xl.toFixed(2) + 'px,' + p[1].toFixed(2) + 'px,0)';
      const den = tf(l, -t, 0);
      if (tu !== den) ds.push([l, tu, den]);
    });
    if (!ds.length) return false;
    m.anims.forEach((a) => { try { a.cancel(); } catch (e) {} });
    m.anims = [];
    ds.forEach(([l, tu, den]) => {
      try {
        l.el.style.width = (2 * l.tile + m.W + 4 + 24) + 'px';          // rong them 1 vien (repeat-x) de ban tuong duong ben trai van phu kin trong luc truot
        l.el.style.transform = den;
        m.anims.push(l.el.animate([{ transform: tu }, { transform: den }], { duration: 1000, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'both' }));
      } catch (e) { canhBao('veNghi', e); }
    });
    if (!m.anims.length) return false;
    m.anims[0].onfinish = () => { if (M !== m) return; m.layers.forEach((l) => { l.el.style.width = (l.tile + m.W + 4 + 24) + 'px'; }); animar(); };
    return true;
  }
  /** Chay khi: tab hien + khong dang giang + khong giam chuyen dong. Con lai: dung hinh (khong ton gi) */
  function capNhatAnim() {
    const m = M;
    if (!m) return;
    const chay = !document.hidden && !dangGiang() && !giamMq.matches;
    m.anims.forEach((a) => { try { if (chay) { if (a.playState !== 'running') a.play(); } else if (a.playState === 'running') a.pause(); } catch (e) {} });
  }

  // ================================================================== BO CUC (vua man hinh)
  // Nguyen tac: khung (deck-canvas) chiem vung giua hai thanh, noi dung dung TREN mep co truoc (chua cho cho co), le can doi.
  // JS do: (1) chieu cao that cua san khau -> --ht-pb (cho co) tren main.deck-stage; (2) cho dung THAT cua meo (goc phai duoi): the / cot nao
  // cham vao thi tranh bang 1 trong ba cach - "cells" (o trong luoi nhuong cho meo), lan phai (--ht-lane), san (--ht-floor); (3) voi tung chuong chon
  // so cot / ti le chu (zoom >= 1, khong bao gio nho hon co chu goc) / cap nen-gon de HIEN HET khong cuon neu du cho; khong du thi cuon TRONG
  // vung (vien mo cue). Moi gia tri do deu duoc kiem lai bang so do that (scrollHeight, hop cua tung the so voi hop cua meo).
  const ZMAX = 1.4;
  const MINW = { vocab: [292, 292, 250, 250, 250, 176], kanji: [330, 330, 330, 330] };   // be rong the toi thieu theo cap
  const TIERS = { vocab: [0, 1, 2, 3, 4, 5], kanji: [0, 1, 2, 3] };
  const khung = (fn) => requestAnimationFrame(() => { try { fn(); } catch (e) { canhBao('khung', e); } });
  const pf = (v) => parseFloat(v) || 0;
  function datStage(m) {
    const H = m.back.clientHeight, W = m.back.clientWidth;
    if (!(H > 1)) return;
    const kh = tinhKhung(W, H);
    const pb = kh.ngan ? 6 : Math.round(H * (kh.dt ? 0.12 : 0.2));
    m.stage.style.setProperty('--ht-pb', pb + 'px');
    m.stage.style.setProperty('--ht-sh', H + 'px');
  }
  function capCue(sc) {
    const d = sc.scrollHeight - sc.clientHeight;
    let v = 'khong';
    if (d > 3) { const y = sc.scrollTop; v = y < 3 ? 'duoi' : (y > d - 3 ? 'tren' : 'giua'); }
    if (sc.dataset.htCuon !== v) sc.dataset.htCuon = v;
  }
  const VUA = (sc) => sc.scrollHeight <= sc.clientHeight + 1 && sc.scrollWidth <= sc.clientWidth + 1;
  const RESET_STYLE = ['grid-template-columns', 'grid-template-rows', 'grid-auto-rows', 'height', 'flex', '--ht-z', '--ht-n', '--ht-lane', '--ht-floor', '--ht-ck', '--ht-cr', '--ht-cv', '--ht-nr'];
  const RESET_DATA = ['htHai', 'htDac', 'htMeo', 'htRong', 'htKw', 'htVua', 'htCuon', 'htKieu', 'htCv'];
  function resetSc(sc) {
    RESET_STYLE.forEach((k) => sc.style.removeProperty(k));
    RESET_DATA.forEach((k) => { delete sc.dataset[k]; });
    sc.querySelectorAll(':scope > [data-ht-tt]').forEach((e) => { e.removeAttribute('title'); delete e.dataset.htTt; });
    sc.querySelectorAll(':scope > .vc-card').forEach((e) => { e.style.removeProperty('--ht-ch'); if (!e.getAttribute('style')) e.removeAttribute('style'); });
  }
  /** Hop cua meo (goc phai duoi, tren thanh duoi) so voi vung cuon: tra null neu meo khong de len vung (hoac khong co meo / bang / the trai mo).
      nw / nh = phan meo lan vao vung (be ngang tu mep phai / chieu cao tu day vung), da cong khoang tho 8 px. Do khi lan / san da ve 0. */
  function hinhMeo(sc) {
    const b = document.body.classList;
    if (!b.contains('co-meo') || b.contains('co-bang') || b.contains('co-the-trai')) return null;
    const cs = getComputedStyle(root);
    const rong = pf(cs.getPropertyValue('--sensei-rong')), cao = pf(cs.getPropertyValue('--sensei-cao'));
    if (!(rong > 0 && cao > 0)) return null;
    const bot = document.querySelector('.deck-bottom');
    const bt = bot ? bot.getBoundingClientRect().top : innerHeight;
    const catL = innerWidth - rong, catT = bt - cao;
    const r = sc.getBoundingClientRect();
    const nw = r.right - catL + 8, nh = r.bottom - catT + 8;
    if (nw <= 0 || nh <= 0) return null;
    return { catL, catT, nw, nh, w: r.width, h: r.height, chat: b.contains('co-chat') };
  }
  /** Co phan tu con nao cua vung (hop tren man hinh) nam trong hop meo khong */
  function chamMeo(sc, G) {
    if (!G) return false;
    const L = G.catL - 3, T = G.catT - 3;
    const kids = sc.children;
    for (let i = 0; i < kids.length; i++) {
      const r = kids[i].getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.right > L && r.bottom > T) return true;
    }
    return false;
  }
  /** Ap cach tranh meo len vung: none (de nguyen) | lane | floor | cells (luoi: the cuoi nhuong cho, ham datLuoi lo them) */
  function datMeo(sc, mode, G) {
    sc.style.setProperty('--ht-lane', mode === 'lane' && G ? Math.ceil(G.nw) + 'px' : '0px');
    sc.style.setProperty('--ht-floor', mode === 'floor' && G ? Math.ceil(G.nh) + 'px' : '0px');
    if (mode === 'cells') sc.dataset.htMeo = 'cells'; else delete sc.dataset.htMeo;
  }
  const modeRe = (G) => (G ? (G.nw * G.h <= G.nh * G.w * 1.6 ? 'lane' : 'floor') : 'none');   // cuon trong vung: lan phai (giu chieu cao khung) tru khi san mat it hon nhieu
  const metrics = (sc) => {
    const cs = getComputedStyle(sc);
    return { pl: pf(cs.paddingLeft), pr: pf(cs.paddingRight), pt: pf(cs.paddingTop), pb: pf(cs.paddingBottom), gx: pf(cs.columnGap), gy: pf(cs.rowGap) };
  };
  // ---- luoi the (tu vung / chu Han)
  function datLuoi(sc, cfg) {
    sc.style.gridTemplateColumns = 'repeat(' + cfg.c + ', minmax(0, 1fr))';
    if (cfg.tier) sc.dataset.htDac = String(cfg.tier); else delete sc.dataset.htDac;
    if (cfg.rong) sc.dataset.htRong = '1'; else delete sc.dataset.htRong;
    sc.style.setProperty('--ht-z', String(cfg.z));
    if (cfg.R) { sc.style.gridTemplateRows = 'repeat(' + cfg.R + ', minmax(min-content, 1fr))'; sc.style.removeProperty('grid-auto-rows'); }
    else { sc.style.removeProperty('grid-template-rows'); sc.style.gridAutoRows = 'minmax(min-content, 1fr)'; }
    sc.style.setProperty('--ht-ck', String(cfg.ck || 1)); sc.style.setProperty('--ht-cr', String(cfg.cr || 1));
  }
  /** Thu mot (che do tranh meo, cap) cho luoi the: moi so cot c; tra the tot nhat vua khong cuon, hoac null */
  function thuLuoi(sc, kind, G, mode, tier, so) {
    datMeo(sc, mode, G);
    datLuoi(sc, { c: 1, tier, z: 1 });
    const mt = metrics(sc);
    const n = sc.children.length;
    const innerW = sc.clientWidth - mt.pl - mt.pr, innerH = sc.clientHeight - mt.pt - mt.pb;
    const minw = MINW[kind][tier];
    const cmax = Math.max(1, Math.min(10, Math.floor((innerW + mt.gx) / (minw + mt.gx))));
    let best = null;
    for (let c = 1; c <= cmax; c++) {
      const colW = (innerW - (c - 1) * mt.gx) / c;
      const rong = kind === 'kanji' && colW >= 760;
      let cfg = null;
      const G2 = mode === 'none' || mode === 'cells' ? G : null;          // lan / san da tranh meo san: khong can do cham
      // loc nhanh: hang tu dong (khong the cuoi) ma da tran thi them hang cho meo cung khong vua -> bo c nay (dieu kien can)
      if (mode === 'cells') delete sc.dataset.htMeo;       // (o trong cho meo chi them o buoc duoi, khi da co so hang ro rang)
      datLuoi(sc, { mode, c, tier, z: 1, R: 0, rong });
      if (!VUA(sc)) continue;
      if (so) so.qua = true;
      if (mode === 'cells') {
        sc.dataset.htMeo = 'cells';
        const nwc = G.nw - mt.pr, nhc = G.nh - mt.pb;
        const k = Math.max(1, Math.ceil(nwc / (colW + mt.gx)));
        if (k >= c) continue;
        const R0 = Math.ceil(n / c);
        for (let R = R0; R <= R0 + 2 && !cfg; R++) {
          const rowH = (innerH - (R - 1) * mt.gy) / R;
          if (rowH < 60) break;
          const r0 = Math.max(1, Math.ceil(nhc / (rowH + mt.gy)));
          for (let r = r0; r <= r0 + 1 && r < R && !cfg; r++) {
            if (n + k * r > R * c) continue;
            const c2 = { mode, c, tier, z: 1, R, ck: k, cr: r, rong };
            datLuoi(sc, c2);
            if (VUA(sc) && !chamMeo(sc, G2)) cfg = c2;
          }
        }
        if (!cfg) continue;
      } else {
        cfg = { mode, c, tier, z: 1, R: 0, rong };
        if (G2 && chamMeo(sc, G2)) continue;
      }
      {                                                // ti le chu lon nhat con vua (chia doi, do chinh xac 0,05); cap gon thi toi da 1,2
        let lo = 1, hi = tier >= 2 ? 1.2 : ZMAX;
        const ok = (z) => { datLuoi(sc, Object.assign({}, cfg, { z })); return VUA(sc) && !chamMeo(sc, G2); };
        if (ok(hi)) lo = hi;
        else for (let i = 0; i < 3 && hi - lo > 0.04; i++) { const mid = (lo + hi) / 2; if (ok(mid)) lo = mid; else hi = mid; }
        cfg.z = Math.round(lo * 100) / 100;
      }
      cfg.diem = 10000 - tier * 1500 + cfg.z * 100 + (n % c === 0 ? 3 : 0) - c * 0.1 + (mode === 'cells' ? 8 : mode === 'none' ? 12 : mode === 'lane' ? 4 : 0);
      if (!best || cfg.diem > best.diem) best = cfg;
    }
    return best;
  }
  /** Khong the hien het: chon so cot it tran nhat o cap thuong (cuon trong vung); phat the cao hon vung (khong de mot the dai hon man hinh) */
  function cuonLuoi(sc, kind, G) {
    const mode = modeRe(G);
    datMeo(sc, mode, G);
    const tier = kind === 'vocab' && sc.clientWidth >= 900 ? 2 : 0;       // man rong: the gon (cap 2) de moi man hinh thay nhieu the, ghi chu van con (1 dong)
    datLuoi(sc, { c: 1, tier, z: 1 });
    const mt = metrics(sc);
    const n = sc.children.length;
    const innerW = sc.clientWidth - mt.pl - mt.pr, innerH = sc.clientHeight - mt.pt - mt.pb;
    const cmax = Math.max(1, Math.min(10, Math.floor((innerW + mt.gx) / (MINW[kind][tier] + mt.gx))));
    let best = null;
    for (let c = 1; c <= cmax; c++) {
      const colW = (innerW - (c - 1) * mt.gx) / c;
      const cfg = { mode, c, tier, z: 1, R: 0, rong: kind === 'kanji' && colW >= 760 };
      datLuoi(sc, cfg);
      let maxH = 0;
      for (let i = 0; i < sc.children.length; i++) maxH = Math.max(maxH, sc.children[i].getBoundingClientRect().height);
      const du = sc.scrollHeight - sc.clientHeight;
      cfg.diem = -du - (maxH > innerH ? 0.6 * du + 100 + (maxH - innerH) * 3 : 0) + (n % c === 0 ? 0.5 : 0);
      if (!best || cfg.diem > best.diem) best = cfg;
    }
    return best;
  }
  // ---- ngu phap: 1 cot (can giua) hoac 2 cot dong chay doc, thung cao dung bang cot cao hon
  function thuNguPhap(sc, G, mode, dac, padY) {
    ['grid-template-columns', 'grid-template-rows', 'grid-auto-rows', 'height', 'flex'].forEach((k) => sc.style.removeProperty(k));
    datMeo(sc, mode, G);
    const avail = sc.clientHeight;                 // do SAU khi ap lan / san (san lam vung thap hon)
    const mt = metrics(sc);
    const W = sc.clientWidth - mt.pl - mt.pr;
    const N = mode === 'none' ? G : null;
    delete sc.dataset.htHai;
    if (dac) sc.dataset.htDac = String(dac); else delete sc.dataset.htDac;
    const datZ = (z) => sc.style.setProperty('--ht-z', String(z));
    const zNow = () => parseFloat(sc.style.getPropertyValue('--ht-z')) || 1;
    // cau vi du khong duoc gay dong khi phong chu (dong chu Nhat + o tro tu: gay dong tao khoi do dat nung lon)
    const dong = Array.from(sc.querySelectorAll('.gp-ex-line'));
    datZ(1);
    const h1 = dong.map((e) => e.getBoundingClientRect().height);
    const khongGay = (z) => dong.every((e, i) => e.getBoundingClientRect().height / z <= h1[i] * 1.3 + 1);
    const ok1 = () => VUA(sc) && !chamMeo(sc, N) && khongGay(zNow());
    const timZ = (ok) => {
      datZ(1);
      if (!ok()) return 0;
      datZ(ZMAX);
      if (ok()) return ZMAX;
      let lo = 1, hi = ZMAX;
      for (let i = 0; i < 5; i++) { const mid = (lo + hi) / 2; datZ(mid); if (ok()) lo = mid; else hi = mid; }
      return lo;                                   // dung gia tri vua duoc thu (khong lam tron xuong: bien dang chay co the khong don dieu)
    };
    let z1 = timZ(ok1), z2 = 0;
    if (W >= 640) {                                // 2 cot (dong chay doc: cot trai het moi sang cot phai), thung cao dung bang cot cao hon
      sc.dataset.htHai = '1';
      sc.style.flex = 'none';
      const hai = () => {
        let hi = avail;
        sc.style.height = hi + 'px';
        if (!(VUA(sc) && !chamMeo(sc, N))) return false;
        let maxH = 0; Array.from(sc.children).forEach((e) => { maxH = Math.max(maxH, e.getBoundingClientRect().height); });
        let lo = Math.min(hi, Math.ceil(maxH + padY));
        for (let i = 0; i < 8 && hi - lo > 3; i++) { const mid = Math.floor((lo + hi) / 2); sc.style.height = mid + 'px'; if (VUA(sc) && !chamMeo(sc, N)) hi = mid; else lo = mid; }
        sc.style.height = hi + 'px';
        return VUA(sc) && !chamMeo(sc, N) && khongGay(zNow());
      };
      z2 = timZ(hai);
      if (z2 && z2 > z1 + 0.04) { datZ(z2); if (!hai()) z2 = 0; }
      else z2 = 0;
      if (!z2) { delete sc.dataset.htHai; ['flex', 'height'].forEach((k) => sc.style.removeProperty(k)); }
    }
    if (z2) return { c: 2, z: z2, vua: true, hai: true, mode, dac };
    datZ(Math.max(1, z1));
    return { c: 1, z: Math.max(1, z1), vua: !!z1, hai: false, mode, dac };
  }
  /** Hoi thoai: bo cuc theo be ngang that: tranh tinh huong + 2 cot luot thoai / tranh + 1 cot / 1 cot */
  function datHoiThoai(sc) {
    const mt = metrics(sc);
    const W = sc.clientWidth - mt.pl - mt.pr;
    const hasCanh = !!sc.querySelector(':scope > .kw-canh');
    const n = sc.querySelectorAll(':scope > .kw-row').length;
    let kw = '';
    if (hasCanh) kw = W >= 980 ? '3' : W >= 600 ? '2' : '';
    else kw = W >= 880 ? '2c' : '';
    if (kw) sc.dataset.htKw = kw; else delete sc.dataset.htKw;
    sc.style.setProperty('--ht-nr', String(Math.max(1, kw === '3' ? Math.ceil(n / 2) : n)));
  }
  /** Phan xa dang luyen (co khung ve): canh khung vuong lon nhat de ca khung + nut "Nop som" vua vung (khong zoom: toa do con tro) */
  function datKhungVe(sc) {
    const cv = sc.querySelector('canvas');
    if (!cv) return;
    sc.style.removeProperty('--ht-cv'); delete sc.dataset.htCv;
    const r0 = cv.getBoundingClientRect().height;
    const du = sc.scrollHeight - sc.clientHeight;
    if (du <= 1 || !(r0 > 0)) return;
    sc.style.setProperty('--ht-cv', Math.max(110, Math.floor(r0 - du - 2)) + 'px');
    sc.dataset.htCv = '1';
  }
  /** Chon bo cuc cho noi dung hien tai cua chuong. Ghi vao style / data-ht-* cua vung cuon. */
  function fitNoiDung() {
    const m = M;
    if (!m || dangGiang()) { if (m) m.fitCho = true; return; }
    m.fitCho = false;
    const nd = document.getElementById('slideContent');
    const sc = nd && nd.querySelector(':scope > .deck-scroll');
    if (!sc) return;
    resetSc(sc);
    sc.style.setProperty('--ht-lane', '0px'); sc.style.setProperty('--ht-floor', '0px');
    const G = hinhMeo(sc);
    const kind = sc.classList.contains('vc-list') ? 'vocab' : sc.classList.contains('kj-list') ? 'kanji' : sc.classList.contains('gp-list') ? 'gram' : sc.classList.contains('kw-list') ? 'kaiwa' : 'khac';
    sc.dataset.htKieu = kind;
    sc.style.setProperty('--ht-z', '1');
    let kq = { c: 0, z: 1, vua: false, hai: false };
    // cach tranh meo: mat it dien tich nhat truoc (lan phai mat be ngang x cao vung, san mat chieu cao x be ngang)
    const res = G ? ['lane', 'floor'].sort((x, y) => (x === 'lane' ? G.nw * G.h : G.nh * G.w) - (y === 'lane' ? G.nw * G.h : G.nh * G.w)) : [];
    const modes = G ? (G.chat ? res : ['cells'].concat(res)) : ['none'];
    if (kind === 'vocab' || kind === 'kanji') {
      if (kind === 'vocab') {            // so ky tu cua chu (khong tinh furigana): cap gon dung de tu thu nho chu cho vua be ngang the
        Array.from(sc.children).forEach((card) => {
          const w = card.querySelector('.vc-word');
          if (!w) return;
          const cl = w.cloneNode(true); cl.querySelectorAll('rt').forEach((r) => r.remove());
          card.style.setProperty('--ht-ch', String(Math.max(2, (cl.textContent || '').trim().length)));
        });
      }
      const phone = sc.clientWidth < 560;
      const tiers = TIERS[kind].filter((t) => !(phone && t >= 2));
      let tot = null;
      outer:
      for (const tier of tiers) {
        for (const mode of modes) {                 // theo thu tu mat it dien tich nhat: che do dau tien co cach xep vua thi dung
          const so = { qua: false };
          const cand = thuLuoi(sc, kind, G, mode, tier, so);
          if (cand) { tot = cand; break; }
          if (!so.qua && mode !== 'cells') break;    // 'cells' / 'none' co nhieu dien tich nhat: khong c nao qua loc nhanh thi lan / san (nho hon) cung khong
          if (!so.qua && mode === 'cells') break;
        }
        if (tot) break outer;                       // cap thuong hon vua roi: khong thu cap gon hon
      }
      if (tot) { datMeo(sc, tot.mode, G); datLuoi(sc, tot); kq = { c: tot.c, z: tot.z, vua: true, dac: tot.tier, mode: tot.mode }; }
      else {
        const cc = cuonLuoi(sc, kind, G);
        datMeo(sc, cc.mode, G); datLuoi(sc, cc);
        kq = { c: cc.c, z: 1, vua: false, dac: cc.tier, mode: cc.mode };
      }
      // cap gon: the khong con nhin thay nhan romaji / ghi chu day du -> chep len title cua the (noi dung van doc duoc khi re chuot / doc man hinh)
      if (kind === 'vocab' && (kq.dac || 0) >= 3) {
        Array.from(sc.children).forEach((card) => {
          const nt = card.querySelector('.vc-note'), mt = card.querySelector('.vc-meta');
          const tt = [kq.dac >= 5 && mt ? mt.textContent.trim() : '', nt ? (nt.title || nt.textContent).trim() : ''].filter(Boolean).join(' - ');
          if (tt) { card.title = tt; card.dataset.htTt = '1'; }
        });
      }
    } else if (kind === 'gram') {
      sc.dataset.htVua = '1';                        // trong luc thu: bo cuc giong ban cuoi (can giua doc) de do cham meo dung
      const padY = (() => { const mt = metrics(sc); return mt.pt + mt.pb; })();
      let fin = null;
      for (const dac of [0, 1, 2]) {
        for (const mode of G ? ['none'].concat(res) : ['none']) {
          const kk = thuNguPhap(sc, G, mode, dac, padY);
          if (kk.vua) { fin = kk; break; }
        }
        if (fin) break;
      }
      if (!fin) {                                    // khong the hien het: cap thuong, 1 cot, cuon trong vung
        const mode = modeRe(G);
        datMeo(sc, mode, G);
        delete sc.dataset.htHai; delete sc.dataset.htDac;
        ['flex', 'height'].forEach((k) => sc.style.removeProperty(k));
        sc.style.setProperty('--ht-z', '1');
        fin = { c: 1, z: 1, vua: false, hai: false, mode, dac: 0 };
      } else {
        datMeo(sc, fin.mode, G);
      }
      kq = fin;
    } else {
      // hoi thoai / bai tap / phan xa: z toi da vua; khong vua thi cuon trong vung (lan / san, mat it dien tich hon)
      if (kind === 'kaiwa') datHoiThoai(sc);
      const khongZoom = !!sc.querySelector('canvas, textarea, input, [contenteditable]');   // ve tay / nhap lieu: giu ti le 1 (toa do con tro)
      const timZ = (ok) => {
        sc.style.setProperty('--ht-z', '1');
        if (!ok()) return 0;
        if (khongZoom) return 1;
        sc.style.setProperty('--ht-z', String(ZMAX));
        if (ok()) return ZMAX;
        let lo = 1, hi = ZMAX;
        for (let i = 0; i < 5; i++) { const mid = (lo + hi) / 2; sc.style.setProperty('--ht-z', String(mid)); if (ok()) lo = mid; else hi = mid; }
        return lo;
      };
      let fin = null;
      for (const mode of G ? ['none'].concat(res) : ['none']) {
        datMeo(sc, mode, G);
        if (kind === 'kaiwa') datHoiThoai(sc);
        const z = timZ(() => VUA(sc) && !chamMeo(sc, mode === 'none' ? G : null));
        if (z) { fin = { c: 1, z, vua: true, hai: false, mode }; break; }
      }
      if (!fin) {
        const mode = modeRe(G);
        datMeo(sc, mode, G);
        if (kind === 'kaiwa') datHoiThoai(sc);
        sc.style.setProperty('--ht-z', '1');
        fin = { c: 1, z: 1, vua: false, hai: false, mode };
      }
      if (khongZoom && sc.classList.contains('rx-scroll')) datKhungVe(sc);
      kq = fin;
    }
    sc.dataset.htVua = kq.vua ? '1' : '0';
    capCue(sc);
    m.kq = kq;
    // phan xa: the luyen doi noi dung ben trong #pxThan (khong doi con truc tiep cua #slideContent) -> theo doi rieng de chon lai khung ve
    const th = sc.querySelector('#pxThan');
    if (m.moRx && m.moRxEl !== th) { try { m.moRx.disconnect(); } catch (e) {} m.moRx = null; m.moRxEl = null; }
    if (th && !m.moRx) { m.moRx = new MutationObserver(() => chayFit()); m.moRx.observe(th, { childList: true }); m.moRxEl = th; }
  }
  function chayFit() {
    const m = M;
    if (!m) return;
    clearTimeout(m.tFit);
    m.tFit = setTimeout(() => { m.timers.delete(m.tFit); khung(() => { if (M === m) { try { fitNoiDung(); } catch (e) { canhBao('fit', e); } } }); }, 40);
    m.timers.add(m.tFit);
  }
  function datLayout(m) {
    datStage(m);
    const nd = document.getElementById('slideContent');
    if (!nd) return;
    m.nd = nd;
    m.roNd = new ResizeObserver(() => chayFit());
    m.roNd.observe(nd);
    m.moNd = new MutationObserver(() => chayFit());
    m.moNd.observe(nd, { childList: true });
    m.onCuon = (e) => { const t = e.target; if (t && t.classList && t.classList.contains('deck-scroll')) { if (!m.cuonBan) { m.cuonBan = true; khung(() => { m.cuonBan = false; capCue(t); }); } } };
    nd.addEventListener('scroll', m.onCuon, true);
    m.onFont = () => chayFit();
    try { if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', m.onFont); } catch (e) {}
    chayFit();
  }
  function goLayout(m) {
    try { if (m.roNd) m.roNd.disconnect(); } catch (e) {}
    try { if (m.moNd) m.moNd.disconnect(); } catch (e) {}
    try { if (m.moRx) m.moRx.disconnect(); m.moRx = null; m.moRxEl = null; } catch (e) {}
    try { if (m.nd && m.onCuon) m.nd.removeEventListener('scroll', m.onCuon, true); } catch (e) {}
    try { if (document.fonts && m.onFont) document.fonts.removeEventListener('loadingdone', m.onFont); } catch (e) {}
    try { ['--ht-pb', '--ht-sh'].forEach((k) => m.stage.style.removeProperty(k)); if (!m.stage.getAttribute('style')) m.stage.removeAttribute('style'); } catch (e) {}
    try {
      document.querySelectorAll('#slideContent .deck-scroll').forEach((sc) => {
        resetSc(sc);
        if (!sc.getAttribute('style')) sc.removeAttribute('style');
      });
    } catch (e) {}
  }

  // ================================================================== GAN / GO
  function mount() {
    if (M) return;
    const stage = document.querySelector('main.deck-stage');
    if (!stage || !document.body) return;
    const canvas = stage.querySelector(':scope > .deck-canvas:not(.san-khau-giang)') || stage.querySelector(':scope > .deck-canvas');
    const m = { stage, canvas, back: null, front: null, layers: [], stale: [], anims: [], timers: new Set(), gen: 0, ro: null, mb: null, ls: [], kh: null, W: 0, H: 0, troiPx: TROI.pc, cho: false, troiCss: '' };
    M = m;
    try {
      const url = vanGiay();
      m.troiCss = url ? '--ht-van:url("' + url + '")' : '--ht-van:none';
      m.back = mk('div', 'ht-nen');
      m.back.setAttribute('aria-hidden', 'true');
      m.front = mk('div', 'ht-truoc');
      m.front.setAttribute('aria-hidden', 'true');
      mk('div', 'ht-troi', m.back).style.cssText = m.troiCss;
      // chon che do GIUA luc dang giang o san khau khac (mac dinh / a ...): khong ve gi, an lop (CSS [data-ht-an]) cho den khi giang xong
      const sanH = () => { const s = document.getElementById('sanKhauGiang'); return !!(s && s.dataset.cheDo === ID); };
      if (dangGiang() && !sanH()) m.back.dataset.htAn = '1';
      stage.insertBefore(m.back, stage.firstChild);
      if (canvas && canvas.parentNode === stage) canvas.after(m.front); else stage.appendChild(m.front);
      const dung = () => { if (dangGiang()) { m.cho = true; return; } m.cho = false; dungLop(); };
      // doi co (keo cua so, xoay): doi yen 220 ms roi moi ve lai (nang); hinh tam co moi che trong luc do; dang giang thi hoan toi khi giang xong
      let tre = 0;
      m.ro = new ResizeObserver(() => {
        datStage(m);
        const W = m.back.clientWidth, H = m.back.clientHeight;
        if (m.layers.length && W === m.W && H === m.H) return;
        if (W > 1 && H > 1 && (m.layers.length || m.stale.length)) geoLop(m, W, H);      // hinh tam theo co moi NGAY (khong cho 220 ms)
        clearTimeout(tre); m.timers.delete(tre);
        tre = hen(dung, m.layers.length ? 220 : 0);
      });
      m.ro.observe(m.back);
      m.mb = new MutationObserver(() => {
        const gg = dangGiang();
        if (!gg && m.back.dataset.htAn) delete m.back.dataset.htAn;      // giang xong: lop idle hien lai (neu da chon H trong luc giang)
        let pose = null;
        if (m.giangTruoc && !gg && !m.cho) { try { pose = docPoseLive(); } catch (e) {} }     // vua dung giang: lay tu the may quay that truoc khi san khau that go
        m.giangTruoc = gg;
        if (!(pose && veNghi(pose))) capNhatAnim();
        if (m.cho && !gg) hen(dung, 0);
        if (m.fitCho && !gg) chayFit();
      });
      m.giangTruoc = dangGiang();
      m.mb.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      const ls = [[document, 'visibilitychange', capNhatAnim], [giamMq, 'change', () => { animar(); }]];
      ls.forEach(([o, ev, f]) => { try { o.addEventListener(ev, f); } catch (e) {} });
      m.ls = ls;
      if (!dangGiang()) hen(dung, 0); else m.cho = true;
      datLayout(m);
    } catch (e) {
      canhBao('mount', e);
      unmount();
    }
  }
  function unmount() {
    const m = M;
    M = null;
    if (!m) return;
    try { m.timers.forEach((t) => clearTimeout(t)); m.timers.clear(); } catch (e) {}
    try { if (m.ro) m.ro.disconnect(); } catch (e) {}
    try { if (m.mb) m.mb.disconnect(); } catch (e) {}
    try { goLayout(m); } catch (e) {}
    (m.ls || []).forEach(([o, ev, f]) => { try { o.removeEventListener(ev, f); } catch (e) {} });
    m.anims.forEach((a) => { try { a.cancel(); } catch (e) {} });
    [m.back, m.front].forEach((e) => { try { if (e) e.remove(); } catch (x) {} });
    m.stale.forEach((l) => { try { l.el.remove(); } catch (e) {} });
    // bitmap (CACHE) o lai: chon lai H cung kich thuoc = hien ngay; trinh duyet tu thu hoi blob khi dong trang
  }
  function dongBo() {
    try { if (root.dataset.cheDo === ID) mount(); else unmount(); } catch (e) { canhBao('dongBo', e); }
  }
  try {
    new MutationObserver(dongBo).observe(root, { attributes: true, attributeFilter: ['data-che-do'] });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', dongBo, { once: true });
    else dongBo();
  } catch (e) { canhBao('khoi dong', e); }
  // anh: bitmap 7 lop dang giu (cung khoa / dinh dang voi h.js dungNen) — h.js co the dung lai thay vi ve lai khi bat dau giang
  NS.h = { gan: mount, go: unmount, fit: () => { if (M) fitNoiDung(); }, dang: () => !!M, layers: () => (M ? M.layers.length : 0), anh: () => { CACHE.lent = true; return { key: CACHE.key, url: Object.assign({}, CACHE.url) }; } };
})();
