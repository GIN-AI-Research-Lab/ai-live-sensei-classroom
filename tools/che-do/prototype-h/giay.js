/*
 * giay.js - phong cach (h) "Giay cat lop".
 * Ca khung la 1 diorama giay nhieu lop (troi, mat troi, may, nui Phu Si, doi, co truoc).
 * Camera (proxy cam.x / cam.z) tren master timeline: moi beat la 1 "canh" dat canh nhau trong the gioi,
 * camera truot ngang giua cac canh -> cac lop truot voi toc do khac nhau (parallax), dolly nhe trong beat.
 * Noi dung: cua so vom (anh minh hoa) rem cuon truot xuong, nhan treo tha xuong + dung dua, ghi chu gap mo xuong,
 * o chu roi vao khe, dau X / vong dung. Moi tween nam tren ctx.master tai thoi diem cue -> xac dinh khi __seek(t).
 */
(function () {
  'use strict';

  var C, M;
  var W = 1920, H = 1080, PW = 1920;          // PW: be rong 1 canh trong the gioi
  var cam = { x: -16, y: 56 };
  var LOP = [];
  var X_MAX;

  // ---------------- tien ich ----------------
  function mk(tag, cls, cha, html) { return C.el(tag, cls, cha, html); }
  function dat(e, x, y, w, h) {
    e.style.left = x + 'px'; e.style.top = y + 'px';
    if (w != null) e.style.width = w + 'px';
    if (h != null) e.style.height = h + 'px';
    return e;
  }
  function T(b, k) { return C.cue(b, k); }
  function rb(base, doc, cls) {
    return '<span class="rb">' + base + '<span class="rt ' + (cls || '') + '">' + doc + '</span></span>';
  }

  // ---------------- van giay (seeded, tao 1 lan) ----------------
  function vanGiay() {
    var cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    var g = cv.getContext('2d');
    var id = g.createImageData(256, 256);
    var r = C.rand(77);
    for (var i = 0; i < 256 * 256; i++) {
      var v = 242 + Math.floor((r() - 0.5) * 22);
      id.data[i * 4] = v; id.data[i * 4 + 1] = v - 2; id.data[i * 4 + 2] = v - 6; id.data[i * 4 + 3] = 255;
    }
    g.putImageData(id, 0, 0);
    // soi giay
    g.lineCap = 'round';
    for (var k = 0; k < 90; k++) {
      var x = r() * 256, y = r() * 256, a = r() * Math.PI * 2, l = 6 + r() * 22;
      g.strokeStyle = r() < 0.5 ? 'rgba(120,90,60,.10)' : 'rgba(255,255,255,.35)';
      g.lineWidth = 0.6 + r() * 0.8;
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a + 0.5) * l * 0.5, y + Math.sin(a + 0.5) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
    document.documentElement.style.setProperty('--van', 'url(' + cv.toDataURL('image/png') + ')');
  }

  // ---------------- dung SVG diorama ----------------
  var sid = 0;
  function locBong(mau, sd, dy, op) {
    var id = 'b' + (++sid);
    return {
      id: id,
      def: '<filter id="' + id + '" x="-3%" y="-60%" width="106%" height="220%" color-interpolation-filters="sRGB">' +
        '<feGaussianBlur in="SourceAlpha" stdDeviation="' + sd + '" result="b1"/>' +
        '<feOffset in="b1" dy="' + dy + '" result="o1"/>' +
        '<feFlood flood-color="' + mau + '" flood-opacity="' + op + '"/><feComposite in2="o1" operator="in" result="s1"/>' +
        '<feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="b2"/>' +
        '<feFlood flood-color="#3a200c" flood-opacity=".26"/><feComposite in2="b2" operator="in" result="s2"/>' +
        '<feMerge><feMergeNode in="s1"/><feMergeNode in="s2"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    };
  }
  function hamSong(seed, base, song) {
    var r = C.rand(seed);
    var ph = song.map(function () { return r() * Math.PI * 2; });
    return function (x) {
      var y = base;
      for (var i = 0; i < song.length; i++) y += song[i][0] * Math.sin(x / song[i][1] * Math.PI * 2 + ph[i]);
      return y;
    };
  }
  function duongDoi(x0, x1, fn, buoc, co) {
    x0 = Math.floor(x0 / buoc) * buoc;
    var d = 'M' + x0 + ',1400 L' + x0 + ',' + fn(x0).toFixed(1);
    var r = co ? C.rand(co.seed) : null;
    for (var x = x0; x <= x1 + buoc; x += buoc) {
      if (co) {
        var xm = x + buoc / 2;
        d += ' L' + xm.toFixed(1) + ',' + (fn(xm) - co.min - r() * co.max).toFixed(1);
      }
      d += ' L' + (x + buoc).toFixed(1) + ',' + fn(x + buoc).toFixed(1);
    }
    return d + ' L' + (x1 + buoc) + ',1400 Z';
  }
  function duongVien(x0, x1, fn, buoc) {
    x0 = Math.floor(x0 / buoc) * buoc;
    var d = 'M' + x0 + ',' + fn(x0).toFixed(1);
    for (var x = x0 + buoc; x <= x1; x += buoc) d += ' L' + x.toFixed(1) + ',' + fn(x).toFixed(1);
    return d;
  }
  function taoLop(id, f, g, z) {
    var e = mk('div', 'lop', C.san);
    e.id = id; e.style.zIndex = z;
    LOP.push({ el: e, f: f, g: g });
    return e;
  }
  function khoang(f) { return [Math.floor(-40 * f - 200), Math.ceil(X_MAX * f + W + 200)]; }
  // lop SVG chia khuc ~1920px (bo loc SVG qua rong se bi Chrome giam do phan giai)
  // ve(a, b) -> noi dung SVG cho khoang [a, b] (hinh hoc tran ra 2 ben de bong khop o mep khuc)
  function svgLop(lop, f, ve, defs) {
    var k = khoang(f), html = '';
    for (var x0 = k[0]; x0 < k[1]; x0 += 1920) {
      var x1 = Math.min(k[1], x0 + 1920), w = x1 - x0;
      html += '<svg width="' + w + '" height="1400" viewBox="' + x0 + ' 0 ' + w + ' 1400" style="left:' + x0 + 'px">' +
        '<defs>' + (defs || '') + '</defs>' + ve(x0 - 160, x1 + 160) + '</svg>';
    }
    lop.innerHTML = html;
  }
  function chon(ds, a, b) {
    var o = '';
    for (var i = 0; i < ds.length; i++) if (ds[i].x > a - 300 && ds[i].x < b + 300) o += ds[i].s;
    return o;
  }

  function dungDiorama() {
    mk('div', null, C.san).id = 'troi';

    // mat troi (sau nui)
    var ltr = taoLop('l-mattroi', 0.015, 0.2, 2);
    var bS = locBong('#8a4a18', 10, 4, 0.25);
    ltr.innerHTML = '<svg width="1920" height="1080" style="left:0"><defs>' + bS.def + '</defs>' +
      '<g filter="url(#' + bS.id + ')">' +
      '<circle cx="1640" cy="330" r="205" fill="#f7dc9c"/>' +
      '<circle cx="1640" cy="330" r="160" fill="#f1c56e"/>' +
      '<circle cx="1640" cy="330" r="118" fill="#e8a94a"/>' +
      '<circle cx="1640" cy="330" r="118" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="3" stroke-dasharray="4 14"/></g></svg>';

    // may giay
    var lmay = taoLop('l-may', 0.07, 0.3, 3);
    var bM = locBong('#8a5a30', 8, 6, 0.22);
    var rM = C.rand(31), km = khoang(0.07), may = [];
    for (var x = km[0] + 120; x < km[1]; x += 520 + rM() * 360) {
      var y = 120 + rM() * 300, s = 0.7 + rM() * 0.6;
      may.push({ x: x, s: mayGiay(x, y, s, rM) });
    }
    svgLop(lmay, 0.07, function (a, b) { return '<g filter="url(#' + bM.id + ')">' + chon(may, a, b) + '</g>'; }, bM.def);

    // nui xa + Phu Si
    var ln1 = taoLop('l-nui1', 0.16, 0.35, 4);
    var f1 = hamSong(11, 560, [[34, 980], [20, 430], [8, 170]]);
    var b1 = locBong('#7a4a28', 12, -3, 0.30);
    var fuji = [{ x: 1540, s: phuSi(1540, 560, 1.0) }, { x: 4300, s: phuSi(4300, 575, 0.85) }];
    svgLop(ln1, 0.16, function (a, b) {
      return '<g filter="url(#' + b1.id + ')">' + chon(fuji, a - 400, b + 400) + '<path d="' + duongDoi(a, b, f1, 30) + '" fill="#e3c3a3"/></g>' +
        '<path d="' + duongVien(a, b, f1, 30) + '" fill="none" stroke="rgba(255,248,235,.55)" stroke-width="3"/>';
    }, b1.def);

    var ln2 = taoLop('l-nui2', 0.28, 0.45, 5);
    var f2 = hamSong(12, 640, [[30, 760], [16, 320], [6, 120]]);
    var k2 = khoang(0.28);
    var b2 = locBong('#6a3a1c', 12, -3, 0.32);
    var nha = [], rN = C.rand(55);
    for (var xn = k2[0] + 700; xn < k2[1]; xn += 1300 + rN() * 900) nha.push({ x: xn, s: thap(xn, f2(xn) + 14, 0.8 + rN() * 0.3) });
    svgLop(ln2, 0.28, function (a, b) {
      return '<g filter="url(#' + b2.id + ')">' + chon(nha, a, b) + '<path d="' + duongDoi(a, b, f2, 30) + '" fill="#d4a684"/></g>' +
        '<path d="' + duongVien(a, b, f2, 30) + '" fill="none" stroke="rgba(255,240,220,.45)" stroke-width="3"/>';
    }, b2.def);

    // doi 1: cay non
    var ld1 = taoLop('l-doi1', 0.5, 0.6, 6);
    var f3 = hamSong(13, 722, [[26, 640], [13, 270]]);
    var k3 = khoang(0.5);
    var b3 = locBong('#4a3a18', 11, -3, 0.33);
    var cay1 = [], r3 = C.rand(66);
    for (var xc = k3[0] + 60; xc < k3[1]; xc += 70 + r3() * 190) cay1.push({ x: xc, s: cayNon(xc, f3(xc) + 12, 0.7 + r3() * 0.6, r3) });
    svgLop(ld1, 0.5, function (a, b) {
      return '<g filter="url(#' + b3.id + ')">' + chon(cay1, a, b) + '<path d="' + duongDoi(a, b, f3, 26) + '" fill="#b9b98a"/></g>' +
        '<path d="' + duongVien(a, b, f3, 26) + '" fill="none" stroke="rgba(255,255,230,.4)" stroke-width="3"/>';
    }, b3.def);

    // doi 2: cay tron
    var ld2 = taoLop('l-doi2', 0.72, 0.75, 7);
    var f4 = hamSong(14, 800, [[28, 760], [14, 330]]);
    var k4 = khoang(0.72);
    var b4 = locBong('#33301a', 12, -4, 0.36);
    var cay2 = [], r4 = C.rand(88);
    for (var xt = k4[0] + 80; xt < k4[1]; xt += 110 + r4() * 260) cay2.push({ x: xt, s: cayTron(xt, f4(xt) + 14, 0.75 + r4() * 0.55, r4) });
    svgLop(ld2, 0.72, function (a, b) {
      return '<g filter="url(#' + b4.id + ')">' + chon(cay2, a, b) + '<path d="' + duongDoi(a, b, f4, 26) + '" fill="#90a677"/></g>' +
        '<path d="' + duongVien(a, b, f4, 26) + '" fill="none" stroke="rgba(240,255,220,.35)" stroke-width="3"/>';
    }, b4.def);

    // noi dung (the gioi)
    var lnd = taoLop('l-noidung', 1, 0.5, 10);

    // co truoc
    var lt = taoLop('l-truoc', 1.25, 1.0, 15);
    var f5 = hamSong(15, 900, [[16, 640], [8, 240]]);
    var k5 = khoang(1.25);
    var b5 = locBong('#1f2a12', 14, -5, 0.42);
    var hoaCo = [], r5 = C.rand(99);
    for (var xh = k5[0] + 30; xh < k5[1]; xh += 60 + r5() * 150) {
      var mau = ['#e8b24f', '#f3ead9', '#d9704d', '#f0c7a8'][Math.floor(r5() * 4)];
      var yh = f5(xh) + 26 + r5() * 70, rr = 5 + r5() * 5;
      hoaCo.push({ x: xh, s: '<circle cx="' + xh.toFixed(0) + '" cy="' + yh.toFixed(0) + '" r="' + rr.toFixed(1) + '" fill="' + mau + '"/>' +
        '<circle cx="' + xh.toFixed(0) + '" cy="' + yh.toFixed(0) + '" r="' + (rr * 0.38).toFixed(1) + '" fill="rgba(90,50,20,.45)"/>' });
    }
    // co: dinh nhon tinh theo toa do tuyet doi (khong phu thuoc khuc) -> khop o mep khuc
    function f5co(a, b) {
      var st = 16, xa = Math.floor(a / st) * st;
      var d = 'M' + xa + ',1400';
      for (var x = xa; x <= b + st; x += st) {
        var h = 6 + 16 * Math.abs(Math.sin(x * 12.9898) * Math.sin(x * 0.0713 + 1.7));
        d += ' L' + x + ',' + f5(x).toFixed(1) + ' L' + (x + st / 2) + ',' + (f5(x + st / 2) - h).toFixed(1);
      }
      return d + ' L' + (Math.floor(b / st) * st + 2 * st) + ',1400 Z';
    }
    svgLop(lt, 1.25, function (a, b) {
      return '<g filter="url(#' + b5.id + ')"><path d="' + f5co(a, b) + '" fill="#5d7a4e"/></g>' +
        '<path d="' + duongDoi(a, b, function (x) { return f5(x) + 60; }, 40) + '" fill="#557147" opacity=".6"/>' + chon(hoaCo, a, b);
    }, b5.def);

    mk('div', null, C.san).id = 'vien-toi';
    return lnd;
  }

  function mayGiay(x, y, s, r) {
    var n = 3 + Math.floor(r() * 2), out = '<g transform="translate(' + x.toFixed(0) + ',' + y.toFixed(0) + ') scale(' + s.toFixed(2) + ')">';
    var w = 260;
    out += '<rect x="0" y="-10" width="' + w + '" height="46" rx="23" fill="#fdf8ef"/>';
    for (var i = 0; i < n; i++) {
      var cx = 40 + i * (w - 80) / (n - 1), cr = 34 + r() * 30;
      out += '<circle cx="' + cx.toFixed(0) + '" cy="' + (8 - cr * 0.45).toFixed(0) + '" r="' + cr.toFixed(0) + '" fill="#fdf8ef"/>';
    }
    return out + '<rect x="18" y="26" width="' + (w - 36) + '" height="6" rx="3" fill="rgba(200,160,120,.25)"/></g>';
  }
  function phuSi(cx, base, s) {
    var w = 560 * s, h = 300 * s, top = base - h;
    var p = 'M' + (cx - w) + ',' + (base + 40) + ' C' + (cx - w * 0.55) + ',' + (base - h * 0.25) + ' ' + (cx - w * 0.22) + ',' + (top + 12) + ' ' + (cx - 60 * s) + ',' + top +
      ' L' + (cx + 60 * s) + ',' + top + ' C' + (cx + w * 0.22) + ',' + (top + 12) + ' ' + (cx + w * 0.55) + ',' + (base - h * 0.25) + ' ' + (cx + w) + ',' + (base + 40) + ' Z';
    var sy = top + 95 * s;
    var tuyet = 'M' + (cx - 60 * s) + ',' + top + ' L' + (cx + 60 * s) + ',' + top + ' C' + (cx + 110 * s) + ',' + (top + 30 * s) + ' ' + (cx + 150 * s) + ',' + (sy - 30 * s) + ' ' + (cx + 175 * s) + ',' + sy +
      ' L' + (cx + 120 * s) + ',' + (sy - 18 * s) + ' L' + (cx + 80 * s) + ',' + (sy + 8 * s) + ' L' + (cx + 30 * s) + ',' + (sy - 22 * s) + ' L' + (cx - 20 * s) + ',' + (sy + 10 * s) +
      ' L' + (cx - 70 * s) + ',' + (sy - 20 * s) + ' L' + (cx - 115 * s) + ',' + (sy + 4 * s) + ' L' + (cx - 175 * s) + ',' + sy + ' C' + (cx - 150 * s) + ',' + (sy - 30 * s) + ' ' + (cx - 110 * s) + ',' + (top + 30 * s) + ' ' + (cx - 60 * s) + ',' + top + ' Z';
    return '<path d="' + p + '" fill="#c9a2a0"/><path d="' + tuyet + '" fill="#fbf4ea"/>';
  }
  function thap(x, y, s) {
    // chua / thap giay nho tren nui xa
    var o = '<g transform="translate(' + x.toFixed(0) + ',' + y.toFixed(0) + ') scale(' + s.toFixed(2) + ')">';
    var tang = [[70, 0], [58, -46], [46, -88], [34, -124]];
    tang.forEach(function (tg, i) {
      var w = tg[0], yy = tg[1];
      o += '<rect x="' + (-w * 0.36) + '" y="' + (yy - 30) + '" width="' + (w * 0.72) + '" height="32" fill="#b37457"/>';
      o += '<path d="M' + (-w) + ',' + (yy - 26) + ' Q0,' + (yy - 52) + ' ' + w + ',' + (yy - 26) + ' L' + (w * 0.7) + ',' + (yy - 18) + ' L' + (-w * 0.7) + ',' + (yy - 18) + ' Z" fill="#8f5641"/>';
    });
    return o + '<rect x="-3" y="-190" width="6" height="40" fill="#8f5641"/></g>';
  }
  function cayNon(x, y, s, r) {
    var mau = ['#7f9564', '#94a36d', '#a8a86e'][Math.floor(r() * 3)];
    var h = 120 * s, w = 44 * s;
    return '<path d="M' + x.toFixed(0) + ',' + (y - h).toFixed(0) + ' L' + (x + w).toFixed(0) + ',' + y.toFixed(0) + ' L' + (x - w).toFixed(0) + ',' + y.toFixed(0) + ' Z" fill="' + mau + '"/>' +
      '<path d="M' + x.toFixed(0) + ',' + (y - h).toFixed(0) + ' L' + (x + w).toFixed(0) + ',' + y.toFixed(0) + ' L' + x.toFixed(0) + ',' + y.toFixed(0) + ' Z" fill="rgba(40,50,20,.14)"/>';
  }
  function cayTron(x, y, s, r) {
    var mau = ['#6b8a5e', '#7d9a66', '#d6a94a', '#c96442', '#5f7f52'][Math.floor(r() * 5)];
    var rr = 38 * s, th = 60 * s;
    return '<rect x="' + (x - 5 * s).toFixed(1) + '" y="' + (y - th).toFixed(0) + '" width="' + (10 * s).toFixed(1) + '" height="' + th.toFixed(0) + '" fill="#7b5236"/>' +
      '<circle cx="' + x.toFixed(0) + '" cy="' + (y - th - rr * 0.6).toFixed(0) + '" r="' + rr.toFixed(0) + '" fill="' + mau + '"/>' +
      '<path d="M' + (x - rr * 0.1).toFixed(0) + ',' + (y - th - rr * 1.6).toFixed(0) + ' A' + rr.toFixed(0) + ',' + rr.toFixed(0) + ' 0 0 1 ' + (x - rr * 0.1).toFixed(0) + ',' + (y - th + rr * 0.4).toFixed(0) + ' Z" fill="rgba(30,30,10,.13)"/>';
  }

  // ---------------- camera ----------------
  // chi tinh tien (khong scale): lop composited giu raster scale 1 -> tua xuoi/nguoc cho cung 1 khung
  function apDungCam() {
    for (var i = 0; i < LOP.length; i++) {
      var L = LOP[i];
      L.el.style.transform = 'translate(' + (-cam.x * L.f).toFixed(2) + 'px,' + (cam.y * L.f).toFixed(2) + 'px)';
    }
  }
  function dungCamera() {
    var bs = C.beats, TR = 16;
    // mo dau: camera ha xuong (crane) -> cac lop truot len voi toc do khac nhau
    M.fromTo(cam, { y: 56 }, { y: 0, duration: 2.6, ease: 'power2.out' }, 0);
    for (var i = 0; i < bs.length; i++) {
      var b = bs[i];
      var dau = i === 0 ? 0 : b.t + 0.55;
      var cuoi = i === bs.length - 1 ? C.kb.tongThoiGian : bs[i + 1].t - 0.45;
      M.fromTo(cam, { x: i * PW - TR }, { x: i * PW + TR, duration: cuoi - dau, ease: 'none' }, dau);
      var y0 = i === 0 ? 2.6 : dau;
      M.fromTo(cam, { y: 0 }, { y: -9, duration: cuoi - y0, ease: 'sine.inOut' }, y0);
      if (i < bs.length - 1) {
        M.fromTo(cam, { x: i * PW + TR }, { x: (i + 1) * PW - TR, duration: 1.0, ease: 'power2.inOut' }, cuoi);
        M.fromTo(cam, { y: -9 }, { y: 0, duration: 1.0, ease: 'power2.inOut' }, cuoi);
      }
    }
  }

  // ---------------- hieu ung dung chung ----------------
  function hien(e, t, d) { M.fromTo(e, { opacity: 0 }, { opacity: 1, duration: d || 0.14, ease: 'none' }, t); }
  // tha nhan treo tu tren xuong + dung dua quanh dinh day
  function tha(e, t, dy, goc) {
    hien(e, t, 0.05);
    M.fromTo(e, { y: -(dy || 760) }, { y: 0, duration: 0.95, ease: 'power3.out' }, t);
    M.fromTo(e, { rotation: goc == null ? -7 : goc, transformOrigin: '50% -170px' },
      { rotation: 0, transformOrigin: '50% -170px', duration: 2.1, ease: 'elastic.out(1, 0.32)' }, t);
  }
  // ghi chu gap: dai mau keo ngang, than lat xuong quanh ban le
  function moGap(g, t) {
    var dai = g.querySelector('.dai'), than = g.querySelector('.than'), toi = g.querySelector('.toi');
    hien(g, t, 0.05);
    M.fromTo(dai, { scaleX: 0.04 }, { scaleX: 1, duration: 0.42, ease: 'power3.out' }, t);
    M.fromTo(than, { opacity: 0 }, { opacity: 1, duration: 0.04, ease: 'none' }, t + 0.16);
    M.fromTo(than, { rotationX: -86, transformPerspective: 1300, transformOrigin: '50% 0%' },
      { rotationX: 0, transformPerspective: 1300, transformOrigin: '50% 0%', duration: 0.78, ease: 'back.out(1.25)' }, t + 0.16);
    if (toi) M.fromTo(toi, { opacity: 0.55 }, { opacity: 0, duration: 0.6, ease: 'power2.out' }, t + 0.16);
    phang(than, t + 0.16 + 0.78, 1300);
  }
  // sau khi lat xong: bo perspective -> ve 2D, khong con lop 3D
  function phang(e, t, p) {
    M.fromTo(e, { transformPerspective: p, rotationX: 0 }, { transformPerspective: 0, rotationX: 0, duration: 0.001, ease: 'none' }, t + 0.02);
  }
  // mo tam giay (the lon): lat tu tren xuong
  function lat(e, t, dur) {
    hien(e, t, 0.05);
    M.fromTo(e, { rotationX: -80, transformPerspective: 1500, transformOrigin: '50% 0%' },
      { rotationX: 0, transformPerspective: 1500, transformOrigin: '50% 0%', duration: dur || 0.85, ease: 'back.out(1.2)' }, t);
    phang(e, t + (dur || 0.85), 1500);
  }
  // o chu roi vao khe
  function roi(e, t) {
    hien(e, t, 0.1);
    M.fromTo(e, { y: -70, rotation: -6, scale: 1.06 }, { y: 0, rotation: 0, scale: 1, duration: 0.6, ease: 'back.out(1.7)' }, t);
  }
  // nhan dan: dap xuong
  function dan(e, t, goc) {
    hien(e, t, 0.08);
    M.fromTo(e, { scale: 1.35, rotation: (goc || 0) - 6 }, { scale: 1, rotation: goc || 0, duration: 0.5, ease: 'back.out(2.2)' }, t);
  }
  function lac(e, t) {
    M.fromTo(e, { x: 0 }, { x: 1, duration: 0.6, ease: 'none', modifiers: { x: function (v) {
      var p = Math.max(0, Math.min(1, parseFloat(v)));
      return (18 * Math.sin(p * Math.PI * 7) * (1 - p)).toFixed(2) + 'px';
    } } }, t);
  }
  function nay(e, t, s) {
    M.fromTo(e, { scale: 1 }, { scale: s || 1.08, duration: 0.14, ease: 'power2.out' }, t);
    M.fromTo(e, { scale: s || 1.08 }, { scale: 1, duration: 0.5, ease: 'back.out(2.4)' }, t + 0.14);
  }

  // ---------------- khoi dung ----------------
  function vom(cha, x, y, w, h, vai, opt) {
    opt = opt || {};
    var v = dat(mk('div', 'vom', cha), x, y, w, h);
    var R = w / 2;
    ['l1', 'l2', 'l3'].forEach(function (c, i) {
      var l = mk('div', 'l ' + c, v);
      var r = R - [0, 16, 32][i];
      l.style.borderRadius = r + 'px ' + r + 'px 0 0 / ' + r + 'px ' + r + 'px 0 0';
    });
    var l3 = v.querySelector('.l3');
    var iw = opt.iw || (w - 64) * 1.12;
    var im = C.img(vai, null, l3);
    im.style.width = iw + 'px'; im.style.height = iw + 'px';
    im.style.left = ((w - 64 - iw) / 2 + (opt.dx || 0)) + 'px';
    im.style.top = (opt.iy == null ? 20 : opt.iy) + 'px';
    mk('div', 'bong-trong', l3);
    if (opt.cua) {
      // rem cuon giay: truot xuong sau co truoc khi Sensei bat dau tu moi
      var rem = mk('div', 'rem', l3, '<div class="rem-huy">' + opt.cua + '</div><div class="rem-mep"></div>');
      l3.appendChild(l3.querySelector('.bong-trong'));
    }
    if (opt.khoa) mk('div', 'khoa', v, opt.khoa);
    return v;
  }
  function moCua(v, t) {
    var rem = v.querySelector('.rem');
    M.fromTo(rem, { y: 0 }, { y: 900, duration: 1.0, ease: 'power3.inOut' }, t);
    var im = v.querySelector('.l3 img');
    M.fromTo(im, { scale: 0.9, y: 30 }, { scale: 1, y: 0, duration: 1.3, ease: 'power3.out' }, t + 0.15);
  }
  function treo(cha, x, y, w, h, html) {
    var e = dat(mk('div', 'treo an', cha), x, y, w, h);
    mk('div', 'day', e);
    mk('div', 'sau', e);
    mk('div', 'than', e);
    mk('div', 'day-noi', e);
    mk('div', 'lo', e);
    mk('div', 'noi', e, html);
    return e;
  }
  function gap(cha, x, y, w, h, nhan, html, mau) {
    var g = dat(mk('div', 'gap an', cha), x, y, w, h);
    mk('div', 'dai ' + (mau || ''), g, nhan);
    var th = mk('div', 'than', g);
    mk('div', 'noi', th, html);
    mk('div', 'toi', th);
    return g;
  }
  function o(text, opt) {
    opt = opt || {};
    return '<div class="khe"><div class="o ' + (opt.tro ? 'tro' : '') + ' an"' + (opt.id ? ' data-o="' + opt.id + '"' : '') + '>' +
      '<div class="ruby">' + (opt.ruby || '') + '</div><div class="chu"' + (opt.fs ? ' style="font-size:' + opt.fs + 'px"' : '') + '>' + text + '</div>' +
      '<div class="ro">' + (opt.ro || '&nbsp;') + '</div></div></div>';
  }
  function hoa(cha, x, y, d, vai, opt) {
    opt = opt || {};
    var e = dat(mk('div', 'hoa', cha), x, y, d, d);
    var n = 28, R = d / 2, p = '';
    for (var i = 0; i <= n * 2; i++) {
      var a = i / (n * 2) * Math.PI * 2, rr = i % 2 ? R : R - 18;
      p += (i ? ' L' : 'M') + (R + Math.cos(a) * rr).toFixed(1) + ',' + (R + Math.sin(a) * rr).toFixed(1);
    }
    e.innerHTML = '<svg width="' + d + '" height="' + d + '"><path d="' + p + 'Z" fill="#c96442" stroke="#c96442" stroke-width="10" stroke-linejoin="round"/>' +
      '<circle cx="' + R + '" cy="' + R + '" r="' + (R - 34) + '" fill="#d6a94a"/></svg>';
    var tr = dat(mk('div', 'tron', e), 50, 50, d - 100, d - 100);
    var im = C.img(vai, null, tr);
    var iw = (d - 100) * (opt.k || 1.25);
    im.style.width = im.style.height = iw + 'px';
    im.style.left = ((d - 100 - iw) / 2) + 'px';
    im.style.top = (opt.iy == null ? -(iw - (d - 100)) * 0.3 : opt.iy) + 'px';
    return e;
  }

  // ---------------- cac canh ----------------
  function canh(lnd, i) {
    var c = mk('div', 'canh', lnd);
    c.style.left = (i * PW) + 'px';
    return c;
  }

  function canhMoDau(lnd) {
    var c = canh(lnd, 0), B = 'mo-dau';
    var v = vom(c, 100, 92, 690, 870, 'tieu-de.canh', { iw: 720, iy: -10, khoa: '<small>N5</small>1' });
    M.fromTo(v, { y: 360 }, { y: 0, duration: 1.2, ease: 'power3.out' }, 0);

    var chao = treo(c, 880, 70, 500, 230,
      '<div style="margin-top:74px" class="nhan-nho">Sensei Mèo <b>· chào bạn</b></div>' +
      '<div class="jp" style="font:900 76px/1.2 \'Zen Maru Gothic\';margin-top:6px;color:#2a2520">こんにちは！</div>');
    tha(chao, T(B, 'chao'));

    var bai = mk('div', 'giay an', c);
    dat(bai, 870, 330, 520, 270);
    bai.style.cssText += ';display:flex;flex-direction:column;align-items:center;justify-content:center;isolation:isolate';
    bai.innerHTML = '<div class="nhan-nho" style="letter-spacing:.3em">Tiếng Nhật · N5 sơ cấp</div>' +
      '<div style="font:900 150px/1 Nunito;color:#c96442;margin-top:10px;letter-spacing:-.01em">Bài 1</div>';
    var sau = mk('div', null, c);
    sau.className = 'giay an';
    dat(sau, 870, 330, 520, 270);
    sau.style.background = '#d6a94a';
    c.insertBefore(sau, bai);
    lat(bai, T(B, 'bai'));
    hien(sau, T(B, 'bai') + 0.35, 0.05);
    M.fromTo(sau, { rotation: 0, x: 0, y: 0 }, { rotation: 3, x: 12, y: 14, duration: 0.6, ease: 'back.out(2)' }, T(B, 'bai') + 0.35);

    var ruyW = mk('div', 'ruy-wrap an', c);
    dat(ruyW, 846, 624, 568, 104);
    var ruy = mk('div', 'ruy', ruyW, '<span style="font:900 50px/1 Nunito">Giới thiệu bản thân</span>');
    ruy.style.cssText += ';position:absolute;inset:0';
    hien(ruyW, T(B, 'tieu-de'), 0.05);
    M.fromTo(ruyW, { scaleX: 0.05, transformOrigin: '50% 50%' }, { scaleX: 1, transformOrigin: '50% 50%', duration: 0.7, ease: 'expo.out' }, T(B, 'tieu-de'));

    var chip = mk('div', 'giay an', c,
      '<span class="jp" style="font:700 27px/1 \'Zen Maru Gothic\';color:#2a2520;white-space:nowrap">です <i>·</i> じゃ ありません <i>·</i> ですか <i>·</i> も <i>·</i> の</span>');
    dat(chip, 870, 748, 520, 72);
    chip.style.cssText += ';display:flex;align-items:center;justify-content:center;background-color:#f6e7c8';
    chip.querySelectorAll('i').forEach(function (e) { e.style.cssText = 'font-style:normal;color:#c96442;margin:0 2px'; });
    hien(chip, T(B, 'tieu-de') + 0.4, 0.12);
    M.fromTo(chip, { y: 26 }, { y: 0, duration: 0.7, ease: 'back.out(1.6)' }, T(B, 'tieu-de') + 0.4);
  }

  var TU = {
    'tu-watashi': { so: 1, kj: '私', doc: 'わたし', ro: 'watashi', ng: 'Tôi', fs: 80, phu: 'Ngôi thứ nhất, trung tính', vai: 'tu.watashi',
      im: { iw: 700, iy: 0 }, dan: { key: 'ghichu', html: 'Dùng được mọi tình huống', la: true } },
    'tu-gakusei': { so: 2, kj: '学生', doc: 'がくせい', ro: 'gakusei', ng: 'Học sinh, sinh viên', vua: true, phu: 'Đọc bằng, trọng âm phẳng', vai: 'tu.gakusei',
      im: { iw: 800, iy: -40 } },
    'tu-sensei': { so: 3, kj: '先生', doc: 'せんせい', ro: 'sensei', ng: 'Thầy / cô giáo,<br>bác sĩ', vua: true, phu: 'Kéo dài âm せい', vai: 'tu.sensei',
      im: { iw: 740, iy: -30 }, dan: { key: 'luuy', html: 'Chỉ dùng để GỌI người khác<small>Không tự xưng mình là 先生</small>' } }
  };
  function canhTu(lnd, i, B) {
    var d = TU[B], c = canh(lnd, i);
    var v = vom(c, 110, 92, 690, 870, d.vai, { iw: d.im.iw, iy: d.im.iy, cua: '0' + d.so, khoa: '<small>TỪ</small>' + d.so });
    var bt = C.beat(B).t;
    moCua(v, Math.max(T(B, 'vao'), bt + 0.3));

    var ruby = '<span class="rt an" style="font-size:52px;bottom:calc(100% + 4px)">' + d.doc + '</span>';
    var tag = treo(c, 860, 96, 540, 496,
      '<div class="nhan-nho" style="margin-top:78px">Từ vựng <b>· 0' + d.so + ' / 03</b></div>' +
      '<div class="dau-chu" style="margin-top:78px"><span class="rb kanji-to">' + d.kj + ruby + '</span></div>' +
      '<div class="romaji an" style="margin-top:14px">' + d.ro + '</div>');
    tha(tag, T(B, 'kanji'));
    var rt = tag.querySelector('.rt'), romaji = tag.querySelector('.romaji');
    hien(rt, T(B, 'doc'), 0.2);
    M.fromTo(rt, { y: 16 }, { y: 0, duration: 0.6, ease: 'back.out(2)' }, T(B, 'doc'));
    hien(romaji, T(B, 'doc') + 0.12, 0.12);
    M.fromTo(romaji, { y: -14, scale: 0.8 }, { y: 0, scale: 1, duration: 0.55, ease: 'back.out(2)' }, T(B, 'doc') + 0.12);

    var g = gap(c, 860, 616, 540, 222, 'Nghĩa',
      '<div class="nghia-to' + (d.vua ? ' vua' : '') + '"' + (d.fs ? ' style="font-size:' + d.fs + 'px"' : '') + '>' + d.ng + '</div><div class="nghia-phu">' + C.jp(d.phu) + '</div>');
    moGap(g, T(B, 'nghia'));

    if (d.dan) {
      var s = mk('div', 'dan an' + (d.dan.la ? ' la' : ''), c, C.jp(d.dan.html).replace('&lt;small&gt;', '<small>').replace('&lt;/small&gt;', '</small>'));
      if (d.dan.la) { dat(s, 170, 742); s.style.fontSize = '32px'; }
      else { dat(s, 138, 716); s.style.width = '640px'; s.style.textAlign = 'center'; s.style.fontSize = '34px'; }
      dan(s, T(B, d.dan.key), d.dan.la ? -3 : -1.5);
    }
  }

  function canhMauCau(lnd) {
    var c = canh(lnd, 4), B = 'mau-cau';
    var h = mk('div', 'giay an', c,
      '<div class="nhan-nho" style="position:absolute;left:40px;top:30px">Ngữ pháp <b>· mẫu câu 1</b></div>' +
      '<div style="position:absolute;left:38px;top:62px;font:900 60px/1 Nunito">Câu khẳng định</div>' +
      '<div class="jp" style="position:absolute;right:40px;top:44px;font:900 64px/1 \'Zen Maru Gothic\';color:#2a2520">N1 <span style="color:#c96442">は</span> N2 <span style="color:#c96442">です</span></div>');
    dat(h, 110, 70, 1290, 150);
    lat(h, T(B, 'vao'));

    var ds = [['n1', 'N1', 'chủ đề', 'n1-vai', 'Chủ đề', 'la'], ['wa', 'は', 'đọc “wa”', 'wa-doc', 'Trợ từ', 'dat'],
      ['n2', 'N2', 'vị ngữ', 'n2-vai', 'Vị ngữ', 'la'], ['desu', 'です', 'lịch sự', 'desu-vai', 'Kết câu', 'nghe']];
    var bw = 292, gapx = 34, x0 = 112;
    var khoi = {};
    ds.forEach(function (p, i) {
      var x = x0 + i * (bw + gapx);
      var khe = dat(mk('div', 'khe', c), x, 256, bw, 236);
      khe.style.position = 'absolute';
      var k = dat(mk('div', 'khoi', c), x, 256, bw, 236);
      var tro = p[0] === 'wa' || p[0] === 'desu';
      k.innerHTML = '<div class="o ' + (tro ? 'tro' : '') + ' an"><div class="chu"' + (p[0] === 'desu' ? ' style="font-size:104px"' : '') + '>' + p[1] + '</div>' +
        '<div class="ro">' + ({ n1: 'danh từ 1', wa: 'wa', n2: 'danh từ 2', desu: 'desu' })[p[0]] + '</div></div>';
      var oo = k.querySelector('.o');
      roi(oo, T(B, p[0]));
      khoi[p[0]] = oo;
      var g = gap(c, x, 524, bw, 180, p[4], '<div class="nghia-to" style="font-size:' + (p[2].length > 8 ? 44 : 48) + 'px;text-align:center">' + p[2] + '</div>',
        p[5] === 'la' ? 'la' : p[5] === 'nghe' ? 'nghe' : '');
      moGap(g, T(B, p[3]));
    });
    // nhan manh は khi noi "doc la wa"
    M.fromTo(khoi.wa, { rotation: 0 }, { rotation: 1, duration: 0.8, ease: 'none', modifiers: { rotation: function (v) {
      var p = Math.max(0, Math.min(1, parseFloat(v))); return 7 * Math.sin(p * Math.PI * 5) * (1 - p);
    } } }, T(B, 'wa-doc'));
    var s = mk('div', 'dan an', c, 'は đọc là “wa” — không đọc “ha”');
    s.innerHTML = '<span class="jp" style="font-weight:900">は</span> đọc là “wa”, không phải <span class="gach-ha">“ha”</span>';
    dat(s, 330, 736); s.style.width = '740px'; s.style.textAlign = 'center'; s.style.fontSize = '36px';
    dan(s, T(B, 'khong-ha'), -1.5);
  }

  function canhViDu(lnd) {
    var c = canh(lnd, 5), B = 'vi-du-khang-dinh';
    var bang = dat(mk('div', 'bang', c), 110, 112, 1290, 262);
    var hang = dat(mk('div', 'hang', c), 110, 112, 1290, 250);
    hang.innerHTML = o('私', { ruby: 'わたし', ro: 'watashi', id: 'tok-0' }) + o('は', { tro: 1, ro: 'wa', id: 'tok-1' }) +
      o('マイク・ミラー', { ro: 'Maiku Miraa', id: 'tok-2' }) + o('です', { tro: 1, ro: 'desu', id: 'tok-3' });
    var nhan = mk('div', 'dan an', c, 'Ví dụ · khẳng định');
    dat(nhan, 140, 74); nhan.style.fontSize = '26px'; nhan.style.padding = '8px 22px';
    dan(nhan, T(B, 'vao'), -2);
    hang.querySelectorAll('.o').forEach(function (e) { roi(e, T(B, e.dataset.o)); });

    var coc = dat(mk('div', 'coc', c), 354, 800, 26, 180);
    var h = hoa(c, 130, 392, 474, 'nhanvat.miller', { k: 1.12, iy: -18 });
    var ten = mk('div', 'ruy-wrap an', c);
    dat(ten, 186, 776, 362, 70);
    mk('div', 'ruy', ten, '<span style="font:900 32px/1 Nunito">Mike Miller</span>').style.cssText += ';position:absolute;inset:0;background-color:#c96442';
    hien(ten, T(B, 'tok-2'), 0.05);
    M.fromTo(ten, { scaleX: 0.05 }, { scaleX: 1, duration: 0.6, ease: 'expo.out' }, T(B, 'tok-2'));

    var g = gap(c, 690, 400, 710, 214, 'Nghĩa', '<div class="nghia-to" style="font-size:58px">Tôi là Mike Miller.</div>' +
      '<div class="nghia-phu">わたし = tôi &nbsp;·&nbsp; は = là (chủ đề) &nbsp;·&nbsp; です = lịch sự</div>'.replace(/(わたし|は|です)/g, '<span class="jp" style="color:#a24c30;font-weight:700">$1</span>'));
    moGap(g, T(B, 'nghia'));
    var m1 = mk('div', 'giay an', c, '<b style="color:#6b8a5e">N1</b> = <span class="jp">私</span>');
    var m2 = mk('div', 'giay an', c, '<b style="color:#6b8a5e">N2</b> = <span class="jp">マイク・ミラー</span>');
    [m1, m2].forEach(function (m, i) {
      dat(m, i ? 948 : 690, 648, i ? 452 : 236, 96);
      m.style.cssText += ';display:flex;align-items:center;justify-content:center;font:900 40px/1 Nunito;gap:12px';
      hien(m, T(B, 'nghia') + 0.7 + i * 0.18, 0.1);
      M.fromTo(m, { y: 30 }, { y: 0, duration: 0.6, ease: 'back.out(1.8)' }, T(B, 'nghia') + 0.7 + i * 0.18);
    });
  }

  function canhPhuDinh(lnd) {
    var c = canh(lnd, 6), B = 'vi-du-phu-dinh';
    // the doi: です -> じゃ ありません
    var bd = dat(mk('div', 'bang', c), 110, 70, 830, 190);
    var cu = dat(mk('div', 'khe', c), 140, 96, 210, 138); cu.style.position = 'absolute';
    var oCu = mk('div', 'o tro an', cu, '<div class="chu" style="font-size:80px;line-height:138px">です</div>');
    oCu.style.cssText += ';position:absolute;inset:0;padding:0;justify-content:center';
    roi(oCu, T(B, 'desu-cu'));
    var gach = dat(mk('div', 'an', c), 124, 158, 244, 16);
    gach.style.cssText += ';position:absolute;background:#2a2520;border-radius:4px;transform-origin:0 50%;box-shadow:0 3px 6px rgba(0,0,0,.3)';
    hien(gach, T(B, 'jaarimasen'), 0.05);
    M.fromTo(gach, { scaleX: 0, rotation: -8 }, { scaleX: 1, rotation: -8, duration: 0.35, ease: 'power3.out' }, T(B, 'jaarimasen'));
    var mt = dat(mk('div', 'an', c, '<svg width="90" height="60" viewBox="0 0 90 60"><path d="M4 30 H66 M50 10 L74 30 L50 50" fill="none" stroke="#c96442" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>'), 372, 136);
    mt.style.position = 'absolute';
    hien(mt, T(B, 'jaarimasen'), 0.12);
    M.fromTo(mt, { x: -24 }, { x: 0, duration: 0.5, ease: 'back.out(2)' }, T(B, 'jaarimasen'));
    var moi = dat(mk('div', 'khe', c), 476, 96, 444, 138); moi.style.position = 'absolute';
    var oMoi = mk('div', 'o tro an', moi, '<div class="chu" style="font-size:56px;line-height:138px">じゃ ありません</div>');
    oMoi.style.cssText += ';position:absolute;inset:0;padding:0;justify-content:center';
    roi(oMoi, T(B, 'jaarimasen') + 0.1);

    var bang = dat(mk('div', 'bang an', c), 110, 290, 830, 356);
    lat(bang, T(B, 'tok-0') - 0.6, 0.6);
    var h1 = dat(mk('div', 'hang nho an', c), 110, 300, 830, 166);
    h1.innerHTML = o('サントスさん', { ro: 'Santosu-san', id: 'tok-0', fs: 66 }) + o('は', { tro: 1, ro: 'wa', id: 'tok-1', fs: 66 });
    var h2 = dat(mk('div', 'hang nho an', c), 110, 470, 830, 166);
    h2.innerHTML = o('学生', { ruby: 'がくせい', ro: 'gakusei', id: 'tok-2', fs: 66 }) + o('じゃ ありません', { tro: 1, ro: 'ja arimasen', id: 'tok-3', fs: 66 });
    hien(h1, T(B, 'tok-0') - 0.3, 0.25); hien(h2, T(B, 'tok-0') - 0.3, 0.25);
    c.querySelectorAll('.hang .o').forEach(function (e) { roi(e, T(B, e.dataset.o)); });

    var g = gap(c, 110, 670, 830, 168, 'Nghĩa', '<div class="nghia-to" style="font-size:44px">Anh Santos không phải là sinh viên.</div>');
    moGap(g, T(B, 'nghia'));

    var v = vom(c, 990, 80, 410, 880, 'nhanvat.santos', { iw: 880, iy: 4, khoa: '<small>VÍ DỤ</small>2' });
    var tenS = mk('div', 'ruy-wrap an', c);
    dat(tenS, 1010, 604, 370, 66);
    mk('div', 'ruy', tenS, '<span style="font:900 30px/1 Nunito">Santos</span>').style.cssText += ';position:absolute;inset:0;background-color:#c96442';
    hien(tenS, T(B, 'tok-0'), 0.05);
    M.fromTo(tenS, { scaleX: 0.05 }, { scaleX: 1, duration: 0.6, ease: 'expo.out' }, T(B, 'tok-0'));
    // anh nho "sinh vien" + dau X
    var tn = dat(mk('div', 'hoa an', c), 1100, 692, 190, 190);
    tn.innerHTML = '<div class="tron" style="left:0;top:0;width:190px;height:190px;box-shadow:0 0 0 8px #fbf6ec,0 0 0 10px rgba(70,40,15,.2),0 12px 20px rgba(70,40,15,.35)"></div>';
    var imT = C.img('tu.gakusei', null, tn.querySelector('.tron'));
    imT.style.cssText = 'position:absolute;width:250px;height:250px;left:-30px;top:-16px';
    hien(tn, T(B, 'tok-2'), 0.1);
    M.fromTo(tn, { scale: 0.6, y: 30 }, { scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.8)' }, T(B, 'tok-2'));
    var x = dat(mk('div', 'dau-x an', c), 1126, 718);
    x.style.width = x.style.height = '138px';
    dan(x, T(B, 'tok-3'), 0);
  }

  function canhCauHoi(lnd) {
    var c = canh(lnd, 7), B = 'cau-hoi';
    var q = mk('div', 'giay an', c);
    dat(q, 110, 70, 1290, 200);
    q.innerHTML = '<div class="nhan-nho" style="position:absolute;left:40px;top:26px">Thử nhé <b>· chọn trợ từ đánh dấu chủ đề</b></div>' +
      '<div style="position:absolute;left:0;right:0;top:64px;display:flex;justify-content:center;align-items:center;gap:22px" class="jp">' +
      '<span style="font:900 96px/1 \'Zen Maru Gothic\'">わたし</span>' +
      '<span class="khe" style="width:150px;height:118px;display:inline-block"></span>' +
      '<span style="font:900 96px/1 \'Zen Maru Gothic\'">ナムです。</span></div>';
    lat(q, T(B, 'cau-hoi'));
    var khe = q.querySelector('.khe');
    var dap = mk('div', 'o tro an', khe, '<div class="chu" style="font-size:88px;line-height:118px">は</div>');
    dap.style.cssText += ';position:absolute;inset:0;padding:0;justify-content:center';
    khe.style.position = 'relative';

    vom(c, 110, 300, 460, 660, 'tu.watashi', { iw: 470, iy: 30, khoa: '<small>BẠN</small>?' });

    var ds = [['A', 'は', 'wa'], ['B', 'が', 'ga'], ['C', 'を', 'o'], ['D', 'に', 'ni']];
    var LC = [];
    ds.forEach(function (d, i) {
      var x = 620 + (i % 2) * 400, y = 300 + Math.floor(i / 2) * 172;
      var l = dat(mk('div', 'lc', c), x, y, 380, 150);
      l.innerHTML = '<div class="o an"><div class="ky">' + d[0] + '</div><div class="chu">' + d[1] + '</div><div class="ro">(' + d[2] + ')</div></div><div class="chon"></div>';
      var oo = l.querySelector('.o');
      roi(oo, T(B, 'lua-chon') + i * 0.14);
      LC.push(l);
    });
    // chon sai: が
    var sai = LC[1];
    nay(sai.querySelector('.o'), T(B, 'chon-sai'), 0.94);
    hien(sai.querySelector('.chon'), T(B, 'chon-sai'), 0.12);
    var xs = dat(mk('div', 'dau-x an', sai), 300, -22);
    xs.style.width = xs.style.height = '96px';
    dan(xs, T(B, 'bao-sai'), 0);
    lac(sai, T(B, 'bao-sai'));
    M.fromTo(sai.querySelector('.chon'), { opacity: 1 }, { opacity: 0, duration: 0.3, ease: 'power1.in' }, T(B, 'chon-dung') - 0.2);
    // chon dung: は
    var dung = LC[0];
    dung.querySelector('.chon').style.borderColor = '#6b8a5e';
    nay(dung.querySelector('.o'), T(B, 'chon-dung'), 0.94);
    hien(dung.querySelector('.chon'), T(B, 'chon-dung'), 0.12);
    var vg = mk('div', 'vong', dung);
    dat(vg, -22, -24, 420, 196);
    vg.innerHTML = '<svg width="420" height="196" viewBox="0 0 440 202" style="overflow:visible"><path d="M40 108 C 30 30, 330 6, 410 70 C 460 120, 330 196, 190 190 C 70 186, 10 150, 44 96 C 70 58, 150 40, 230 36" fill="none" stroke="#c8412c" stroke-width="12" stroke-linecap="round"/></svg>';
    var pv = vg.querySelector('path');
    var L = 1500;
    pv.style.strokeDasharray = L; pv.style.strokeDashoffset = L;
    M.fromTo(pv, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }, T(B, 'bao-dung'));
    roi(dap, T(B, 'bao-dung'));
    // hoa giay tung ra tu khe
    var rr = C.rand(404), mau = ['#c96442', '#d6a94a', '#6b8a5e', '#fbf6ec', '#e8b59a'];
    for (var k = 0; k < 24; k++) {
      var vn = mk('div', 'vun an', c);
      dat(vn, 650, 186);
      vn.style.background = mau[k % mau.length];
      vn.style.boxShadow = '0 2px 3px rgba(70,40,15,.3)';
      var a = -Math.PI * (0.08 + rr() * 0.84), sp = 120 + rr() * 200, t0 = T(B, 'bao-dung') + 0.05 + rr() * 0.08;
      var len = Math.sin(a) * sp * 0.62;
      hien(vn, t0, 0.05);
      M.fromTo(vn, { x: 0, rotation: 0 }, { x: Math.cos(a) * sp * 1.7, rotation: (rr() - 0.5) * 720, duration: 1.4, ease: 'power2.out' }, t0);
      M.fromTo(vn, { y: 0 }, { y: len, duration: 0.5, ease: 'power2.out' }, t0);
      M.fromTo(vn, { y: len }, { y: len + 260, duration: 0.9, ease: 'power2.in' }, t0 + 0.5);
      M.fromTo(vn, { opacity: 1 }, { opacity: 0, duration: 0.3, ease: 'power1.in' }, t0 + 1.1);
    }
    var g = gap(c, 620, 650, 780, 190, 'Giải thích', '<div class="nghia-to" style="font-size:40px"><span class="jp" style="color:#c96442">は</span> đánh dấu CHỦ ĐỀ</div>' +
      '<div class="nghia-phu" style="font-size:29px">Viết là “ha” nhưng làm trợ từ thì đọc là “wa”.</div>', 'la');
    moGap(g, T(B, 'giai-thich'));
  }

  function canhKetBai(lnd) {
    var c = canh(lnd, 8), B = 'ket-bai';
    var h = mk('div', 'dan an', c, 'Hôm nay mình đã học');
    dat(h, 120, 70); h.style.fontSize = '40px'; h.style.padding = '16px 34px';
    dan(h, T(B, 'tom-tat'), -2);
    var ds = [['r-watashi', '私', 'わたし', 'tôi', 'tu.watashi'], ['r-gakusei', '学生', 'がくせい', 'sinh viên', 'tu.gakusei'],
      ['r-sensei', '先生', 'せんせい', 'thầy cô', 'tu.sensei'], ['r-mau']];
    ds.forEach(function (d, i) {
      var x = 110 + i * 328;
      var tt = dat(mk('div', 'tt' + (d.length === 1 ? ' mau' : ''), c), x, 170, 300, 440);
      tt.style.rotate = (i % 2 ? 1 : -1) + 'deg';
      var gy = mk('div', 'giay', tt);
      if (d.length > 1) {
        gy.innerHTML = '<div class="tron-nho"></div><div class="kj">' + rb(d[1], d[2]) + '</div><div class="ng">' + d[3] + '</div>';
        var im = C.img(d[4], null, gy.querySelector('.tron-nho'));
        im.style.cssText = 'position:absolute;width:250px;height:250px;left:-25px;top:-12px';
      } else {
        gy.innerHTML = '<div class="nhan-nho">Mẫu câu</div><div class="ct" style="margin-top:22px">N1 <span class="p">は</span><br>N2 <span class="p">です</span></div>' +
          '<div class="ng" style="margin-top:24px">N1 là N2</div>';
      }
      var t = T(B, d[0]);
      // mat sau (up san tu dau beat) -> lat 2D sang mat truoc dung luc Sensei noi
      var sau = mk('div', 'giay mat-sau', tt, '<div class="huy">' + (i + 1) + '</div><div class="nhan-nho" style="color:#fff">Ôn tập</div>');
      gy.style.transform = 'scaleX(0)';
      M.fromTo(sau, { scaleX: 1 }, { scaleX: 0, duration: 0.17, ease: 'power2.in' }, t);
      M.fromTo(gy, { scaleX: 0 }, { scaleX: 1, duration: 0.34, ease: 'back.out(1.8)' }, t + 0.17);
      M.fromTo(tt, { y: 0 }, { y: -18, duration: 0.2, ease: 'power2.out' }, t);
      M.fromTo(tt, { y: -18 }, { y: 0, duration: 0.5, ease: 'bounce.out' }, t + 0.2);
    });
    var rw = mk('div', 'ruy-wrap an', c);
    dat(rw, 210, 690, 880, 120);
    mk('div', 'ruy', rw, '<span style="font:900 46px/1 Nunito">Hẹn gặp lại ở bài sau nhé!</span>').style.cssText += ';position:absolute;inset:0;background-color:#c96442;padding-right:120px';
    hien(rw, T(B, 'tam-biet'), 0.05);
    M.fromTo(rw, { scaleX: 0.05 }, { scaleX: 1, duration: 0.75, ease: 'expo.out' }, T(B, 'tam-biet'));
    var bd = mk('div', 'an', c, '<div class="jp" style="font:900 56px/1 \'Zen Maru Gothic\';color:#2a2520;white-space:nowrap">またね！</div>');
    dat(bd, 1000, 626, 300, 250);
    bd.style.cssText += ';position:absolute;border-radius:50%;display:flex;align-items:center;justify-content:center;background-color:#d6a94a;' +
      'background-image:var(--van);background-blend-mode:multiply;background-size:256px;box-shadow:0 0 0 12px #fbf6ec,0 0 0 14px rgba(70,40,15,.2),0 22px 30px -8px rgba(70,40,15,.45);border-radius:50%';
    dat(bd, 1040, 632, 250, 250);
    dan(bd, T(B, 'matane'), 6);
  }

  // ---------------- Sensei + khung co dinh ----------------
  var TU_THE = ['Mở đầu', 'Từ vựng · 1/3', 'Từ vựng · 2/3', 'Từ vựng · 3/3', 'Mẫu câu', 'Ví dụ', 'Phủ định', 'Luyện tập', 'Tổng kết'];
  function dungKhung() {
    // the bai (goc tren phai)
    var tb = mk('div', null, C.san); tb.id = 'the-bai';
    tb.innerHTML = '<div class="nen"></div><div class="dong1">N5 · BÀI 1</div><div class="ten"></div><div class="cham"></div>';
    var ten = tb.querySelector('.ten'), cham = tb.querySelector('.cham');
    M.fromTo(tb, { y: -170 }, { y: 0, duration: 0.9, ease: 'back.out(1.4)' }, 0.15);
    tb.style.transform = 'translateY(-170px)';
    C.beats.forEach(function (b, i) {
      var s = mk('span', null, ten, TU_THE[i]);
      var d = mk('i', null, cham);
      var t = i === 0 ? 0.3 : b.t;
      M.fromTo(s, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, t);
      if (i < C.beats.length - 1) M.fromTo(s, { opacity: 1, y: 0 }, { opacity: 0, y: -12, duration: 0.3, ease: 'power2.in' }, C.beats[i + 1].t - 0.3);
      M.fromTo(d, { backgroundColor: 'rgba(255,240,225,0.35)', scale: 1 }, { backgroundColor: '#f6d98b', scale: 1.4, duration: 0.4, ease: 'back.out(2)' }, t);
      if (i < C.beats.length - 1) M.fromTo(d, { scale: 1.4, backgroundColor: '#f6d98b' }, { scale: 1, backgroundColor: '#fbf0dd', duration: 0.4 }, C.beats[i + 1].t);
    });

    // Sensei
    var meo = mk('div', null, C.san); meo.id = 'meo';
    var km = mk('div', 'khung-meo', meo);
    var TU_THE_MEO = ['sensei.chao', 'sensei.giang', 'sensei.vui', 'sensei.ngac-nhien', 'sensei.suy-nghi'];
    var img = {};
    TU_THE_MEO.forEach(function (v) { img[v] = C.img(v, null, km); });
    var lich = [[0, 'sensei.chao'], [5.6, 'sensei.giang'], [16.2, 'sensei.vui'], [20.4, 'sensei.giang'], [29.1, 'sensei.ngac-nhien'],
      [31.6, 'sensei.giang'], [45.0, 'sensei.suy-nghi'], [48.15, 'sensei.ngac-nhien'], [50.05, 'sensei.vui'], [53.6, 'sensei.giang'], [56.6, 'sensei.chao']];
    img['sensei.chao'].style.opacity = 1;
    for (var i = 1; i < lich.length; i++) {
      var t = lich[i][0], a = img[lich[i - 1][1]], b = img[lich[i][1]];
      // hoat hinh thay the (kieu cat giay): doi tu the tuc thi o dinh cu nay, khong cross-fade (tranh bong mo 2 con meo)
      M.fromTo(a, { opacity: 1 }, { opacity: 0, duration: 0.001, ease: 'none' }, t + 0.08);
      M.fromTo(b, { opacity: 0 }, { opacity: 1, duration: 0.001, ease: 'none' }, t + 0.08);
      M.fromTo(km, { y: 0, scaleY: 1 }, { y: -16, scaleY: 1.02, duration: 0.16, ease: 'power2.out', transformOrigin: '50% 100%' }, t);
      M.fromTo(km, { y: -16, scaleY: 1.02 }, { y: 0, scaleY: 1, duration: 0.42, ease: 'bounce.out', transformOrigin: '50% 100%' }, t + 0.16);
    }
    meo.style.transform = 'translateY(430px)';
    M.fromTo(meo, { y: 430 }, { y: 0, duration: 1.0, ease: 'back.out(1.3)' }, 0.05);
    // tho nhe
    M.fromTo(meo, { rotation: -0.8, transformOrigin: '60% 100%' }, { rotation: 0.8, transformOrigin: '60% 100%', duration: 1.7, ease: 'sine.inOut', repeat: 33, yoyo: true }, 1.05);

    // bui co truoc che chan meo
    var bui = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    bui.id = 'bui';
    bui.setAttribute('viewBox', '0 0 620 170');
    var rb2 = C.rand(123), la = '';
    var mauLa = ['#4a6741', '#587a4b', '#6b8a5e', '#7d9a66'];
    for (var hng = 0; hng < 3; hng++) {
      for (var xx = -20; xx < 660; xx += 46 + rb2() * 26) {
        var yy = 40 + hng * 36 + rb2() * 18, rr = 38 + rb2() * 22;
        la += '<circle cx="' + xx.toFixed(0) + '" cy="' + yy.toFixed(0) + '" r="' + rr.toFixed(0) + '" fill="' + mauLa[(hng + Math.floor(rb2() * 2)) % 4] + '"/>';
      }
      la += '<rect x="-40" y="' + (70 + hng * 36) + '" width="720" height="200" fill="' + mauLa[hng % 4] + '"/>';
    }
    var hoaBui = '';
    for (var q = 0; q < 9; q++) {
      var hx = 30 + q * 68 + rb2() * 20, hy = 44 + rb2() * 60;
      hoaBui += '<circle cx="' + hx.toFixed(0) + '" cy="' + hy.toFixed(0) + '" r="9" fill="' + ['#f3ead9', '#e8b24f', '#d9704d'][q % 3] + '"/><circle cx="' + hx.toFixed(0) + '" cy="' + hy.toFixed(0) + '" r="3.5" fill="rgba(90,50,20,.5)"/>';
    }
    bui.innerHTML = '<defs><filter id="bbui" x="-10%" y="-40%" width="120%" height="180%"><feDropShadow dx="0" dy="-4" stdDeviation="9" flood-color="#1f2a12" flood-opacity=".45"/></filter></defs>' +
      '<g filter="url(#bbui)">' + la + '</g>' + hoaBui;
    C.san.appendChild(bui);

    // dai phu de
    var bp = mk('div', null, C.san); bp.id = 'ban-phu-de';
    var nen = mk('div', 'nen', bp);
    var r = C.rand(7), pts = [];
    for (var px = 0; px <= 1300; px += 26) pts.push(px + 'px ' + (r() * 5).toFixed(1) + 'px');
    var pb = [];
    for (var qx = 1300; qx >= 0; qx -= 26) pb.push(qx + 'px ' + (107 + r() * 5).toFixed(1) + 'px');
    nen.style.clipPath = 'polygon(' + pts.concat(pb).join(',') + ')';
    var tab = mk('div', 'tab', bp, '<small>LỜI</small><b>Sensei</b>');
    tab.style.clipPath = nen.style.clipPath;
    tab.style.clipPath = 'polygon(0 ' + '2px, 196px 0, 196px 110px, 0 108px)';
  }

  // ---------------- chay ----------------
  LoiKhung.chay({
    kyTuThem: 'こんにちは！またね私学生先生わたしがくせいせんせいはがをにですじゃありませんマイク・ミラーサントスさんナム。＿→·“”—',
    dung: function (ctx) {
      C = ctx; M = ctx.master;
      X_MAX = (C.beats.length - 1) * PW + 40;
      vanGiay();
      var lnd = dungDiorama();
      canhMoDau(lnd);
      canhTu(lnd, 1, 'tu-watashi');
      canhTu(lnd, 2, 'tu-gakusei');
      canhTu(lnd, 3, 'tu-sensei');
      canhMauCau(lnd);
      canhViDu(lnd);
      canhPhuDinh(lnd);
      canhCauHoi(lnd);
      canhKetBai(lnd);
      dungKhung();
      dungCamera();
      apDungCam();
    },
    phuDeKhung: function (dong, l) {
      var dai = l.text.length > 52;
      if (dong.classList.contains('dai') !== dai) dong.classList.toggle('dai', dai);
    },
    moiKhung: function () { apDungCam(); }
  });
})();
