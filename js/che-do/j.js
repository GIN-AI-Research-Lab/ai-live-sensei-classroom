/* ==========================================================================
   Che do san khau J — "Truyện tranh manga" (port tu ban mau E:/sensei-tam/demo2/j sang san khau SONG).
   Moi nhip la MOT TRANG MANGA: cac o (panel) da giac voi ranh gioi xeo, vien muc, anh minh hoa GIU MAU + luoi cham
   (halftone bang CSS radial-gradient), net toc do / vu no o cho nhan manh, bong thoai cho loi Sensei, chu SFX ve tay
   cho tro tu. May quay (camera) day / phong trang ve o dang noi (<= 350 ms). Mot mau nhan (chu son) cho ngu phap chinh.
   Tang Sensei (co dinh): bong thoai bang loi Sensei song + o goc phai duoi danh cho meo THAT (api.meo()).
   Du lieu that cua MOI bai; bai tap: the that #card-<id> vao o cua che do (oBaiTap), cham bai y nguyen.
   Hop dong: scratchpad che-do/HUONG-DAN.md. Mau tham khao: js/che-do/a.js.
   ========================================================================== */
(function () {
  'use strict';
  const SC = window.SenseiCheDo;
  if (!SC) return;

  const ID = 'j';
  const NS = 'http://www.w3.org/2000/svg';
  const DOC_TRO = { 'は': 'wa', 'へ': 'e', 'を': 'o' };
  const RE_DAU = /^[、。，．,.！？!?・…‥」』）)】〉》「『（(【〈《\s]+$/;
  const RE_JP = /[぀-ヿ一-鿿々〆〜ー]/;
  const BL = 90;                 // bleed: o tran ra ngoai mep khung hinh

  // ------------------------------------------------------------------ trang thai che do
  let L = null;                  // lop .cd-lop
  let C = null;                  // ctx / tien ich dao dien
  let G = null;                  // gsap
  const st = {
    W: 0, H: 0, dt: false, U: 1, meo: null,
    g: 12, bw: 6, mx: 0, my: 0, camS: 1.05,
    Yb: 0, Yc: 0, Xc: 0, catL: 0, catT: 0, bTop: 0,
    vung: null, tang: null, pages: [], T: null, probe: null,
    nh: null, api: null, m: null, dem: 0, loiCau: '', loiRaw: '',
  };

  // ------------------------------------------------------------------ tien ich
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const f1 = (v) => (Math.round(v * 10) / 10).toString();
  const esc = (s) => (C ? C.esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const jp = (s) => (C ? C.jp(s) : esc(s));
  const giam = () => !!(C && C.giam);
  const D = (s) => (giam() ? 0 : s);
  const kyTu = (s) => Array.from(String(s == null ? '' : s));
  /** Be ngang uoc cua chuoi (don vi em): chu Nhat 1, chu Latin ~.58 */
  const em = (s) => kyTu(s).reduce((a, c) => a + (RE_JP.test(c) ? 1 : /\s/.test(c) ? 0.3 : /[A-ZĐ]/.test(c) ? 0.7 : 0.56), 0);
  const chuTok = (t) => String((t && (t.kanji || t.text)) || '').trim();
  const laDau = (t) => RE_DAU.test(chuTok(t) || ' ');
  const ngan = (s, n) => { const a = kyTu(String(s || '').trim()); return a.length <= n ? a.join('') : a.slice(0, n - 1).join('') + '…'; };
  const boNgoacCuoi = (s) => String(s || '').replace(/\s*[(（][^)）]*[)）]\s*$/, '').trim();
  function tachNgoac(s) {
    const m = /^(.*?)\s*[(（]([^)）]*)[)）]\s*$/.exec(String(s || ''));
    return m ? [m[1].trim(), m[2].trim()] : [String(s || '').trim(), ''];
  }
  /** Nghia chinh (truoc dau ngoac / ;) + phan phu */
  function tachNghia(s) {
    s = String(s || '').trim();
    const m = /^([^(（;；]+?)\s*(?:[(（]([^)）]*)[)）])?\s*(?:[;；]\s*(.*))?$/.exec(s);
    if (!m) return [s, ''];
    return [m[1].trim(), [m[2], m[3]].filter(Boolean).join(' · ').trim()];
  }
  const sz = (may, dt) => Math.round((st.dt ? dt : may) * st.U * 10) / 10;   // co chu: may tinh / dien thoai, nhan he so man hinh
  function h(tag, cls, cha, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (cha) cha.appendChild(e);
    return e;
  }
  function sv(tag, at, cha) {
    const e = document.createElementNS(NS, tag);
    for (const k in at) e.setAttribute(k, at[k]);
    if (cha) cha.appendChild(e);
    return e;
  }
  function rng(seed) { let s = (seed >>> 0) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
  const chuHoa = (s) => String(s || '').toLocaleUpperCase('vi-VN');

  // ------------------------------------------------------------------ kana -> romaji (Hepburn gian luoc) cho dong "cach doc" cua vi du
  const KANA = (() => {
    const m = {};
    const add = (k, r) => { k.split(' ').forEach((c, i) => { m[c] = r.split(' ')[i]; }); };
    add('あ い う え お', 'a i u e o'); add('か き く け こ', 'ka ki ku ke ko'); add('さ し す せ そ', 'sa shi su se so');
    add('た ち つ て と', 'ta chi tsu te to'); add('な に ぬ ね の', 'na ni nu ne no'); add('は ひ ふ へ ほ', 'ha hi fu he ho');
    add('ま み む め も', 'ma mi mu me mo'); add('や ゆ よ', 'ya yu yo'); add('ら り る れ ろ', 'ra ri ru re ro');
    add('わ ゐ ゑ を ん', 'wa i e o n'); add('が ぎ ぐ げ ご', 'ga gi gu ge go'); add('ざ じ ず ぜ ぞ', 'za ji zu ze zo');
    add('だ ぢ づ で ど', 'da ji zu de do'); add('ば び ぶ べ ぼ', 'ba bi bu be bo'); add('ぱ ぴ ぷ ぺ ぽ', 'pa pi pu pe po');
    add('ぁ ぃ ぅ ぇ ぉ', 'a i u e o'); add('ゔ', 'vu');
    return m;
  })();
  const YOON = { 'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo' };
  function kanaRoma(s) {
    // katakana -> hiragana
    const h0 = kyTu(s).map((c) => { const n = c.charCodeAt(0); return n >= 0x30A1 && n <= 0x30F6 ? String.fromCharCode(n - 0x60) : c; });
    let out = '';
    for (let i = 0; i < h0.length; i++) {
      const c = h0[i];
      if (c === 'っ') { const nx = KANA[h0[i + 1]] || ''; out += /^[a-z]/.test(nx) ? nx[0] === 'c' ? 't' : nx[0] : ''; continue; }
      if (c === 'ー') { const l = out.slice(-1); if (/[aiueo]/.test(l)) out += l; continue; }
      let r = KANA[c];
      if (r == null) { out += c === '・' ? ' ' : c; continue; }
      const nx = h0[i + 1];
      if (nx && YOON[nx] && /i$/.test(r) && r.length > 1) {
        const y = YOON[nx];
        r = /^(shi|chi|ji)$/.test(r) ? r.slice(0, -1) + y.slice(1) : r.slice(0, -1) + y;
        if (/^(shya|shyu|shyo)$/.test(r)) r = 'sh' + r.slice(3);
        i++;
      }
      out += r;
    }
    return out.replace(/nn(?=[aiueo])/g, "n'");
  }
  const romaTok = (t) => {
    const kt = String(t.text || '').trim();
    if (t.isKeyGrammar && DOC_TRO[kt]) return DOC_TRO[kt];
    return kanaRoma(t.furigana || t.text || '');
  };

  // ------------------------------------------------------------------ do khung + toa do
  function doKhung() {
    let k = C.khung();
    st.khungLoi = false;
    if (!(k.w >= 120 && k.h >= 120)) {
      // san khau chua bo cuc xong (vua hien / dang doi co): thu lai tu khung cha, cuoi cung moi dung cua so
      const r = L.parentNode && L.parentNode.getBoundingClientRect ? L.parentNode.getBoundingClientRect() : null;
      k = r && r.width >= 120 && r.height >= 120 ? { w: Math.round(r.width), h: Math.round(r.height) } : { w: innerWidth, h: Math.max(200, innerHeight - (innerWidth < 640 ? 165 : 124)) };
      st.khungLoi = true;
    }
    st.W = k.w;
    st.H = k.h;
    st.dt = st.W < 640 || (st.W < 820 && st.H > st.W * 1.2);
    st.meo = C.meo();
    const { W, H, dt } = st;
    st.U = dt ? W / 390 : clamp(Math.min(W / 1440, H / 776), 0.55, 1.75);
    const U = st.U;
    st.g = Math.round((dt ? 8 : 12) * U);
    st.bw = Math.max(3, Math.round((dt ? 3.6 : 6) * U));
    st.camS = dt ? 1.045 : 1.06;
    st.mx = Math.round(W * (st.camS - 1) / st.camS) + Math.round((dt ? 8 : 14) * U);
    // hinh chu nhat cua meo that (toa do lop); khong co meo -> gia dinh goc phai duoi
    const m = st.meo || (dt ? { x: W - 132, y: H - 105 } : { x: W - Math.round(275 * U), y: H - Math.round(278 * U) });
    if (dt) {
      st.catT = Math.round(m.y - 8);
      st.bTop = st.catT;
      st.catL = Math.round(m.x - 6);
    } else {
      st.catT = Math.round(m.y + 8);
      st.bTop = H - clamp(Math.round(H * 0.172), 96, 170);
      st.catL = Math.round(m.x - 26 * U);
    }
    st.Yc = st.catT - Math.round(st.g / 2);
    st.Yb = st.bTop - Math.round(st.g / 2);
    if (dt) st.Yc = st.Yb;
    st.Xc = st.catL - Math.round(st.g / 2);
    st.my = Math.round(st.Yb * (st.camS - 1) / st.camS) + 12;
    L.style.setProperty('--j-u', U.toFixed(4) + 'px');
    L.style.setProperty('--j-bw', st.bw + 'px');
    L.style.setProperty('--j-tag', sz(40, 26) + 'px');
    if (dt) L.dataset.hep = '1'; else delete L.dataset.hep;
  }

  // ------------------------------------------------------------------ hinh hoc: o da giac
  const pRect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  function catNua(poly, a, b, c) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      const fp = a * p[0] + b * p[1] + c, fq = a * q[0] + b * q[1] + c;
      if (fp >= 0) out.push(p);
      if ((fp >= 0) !== (fq >= 0)) { const k = fp / (fp - fq); out.push([p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]); }
    }
    return out;
  }
  /** O = khung [-BL..W+BL] x [-BL..yb] cat boi cac duong (xeo) ve phia diem pt, lui g/2 moi phia */
  function cell(cuts, pt, yb) {
    let poly = pRect(-BL, -BL, st.W + BL, yb == null ? st.Yb : yb);
    cuts.forEach((Ln) => {
      const dx = Ln[2] - Ln[0], dy = Ln[3] - Ln[1], len = Math.hypot(dx, dy) || 1;
      const a = -dy / len, b = dx / len, c = -(a * Ln[0] + b * Ln[1]);
      const s = (a * pt[0] + b * pt[1] + c) >= 0 ? 1 : -1;
      poly = catNua(poly, a * s, b * s, c * s - st.g / 2);
    });
    return poly;
  }
  function bbox(p) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    p.forEach((q) => { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); });
    return { x0, y0, x1, y1 };
  }
  /** [xmin, xmax] cua da giac loi tai y ngang */
  function xExt(p, y) {
    let a = 1e9, b = -1e9;
    for (let i = 0; i < p.length; i++) {
      const q = p[i], r = p[(i + 1) % p.length];
      if ((q[1] <= y && r[1] >= y) || (q[1] >= y && r[1] <= y)) {
        const x = q[1] === r[1] ? null : q[0] + (r[0] - q[0]) * (y - q[1]) / (r[1] - q[1]);
        if (x == null) { a = Math.min(a, q[0], r[0]); b = Math.max(b, q[0], r[0]); } else { a = Math.min(a, x); b = Math.max(b, x); }
      }
    }
    return [a, b];
  }
  /**
   * Hop noi dung lon nhat trong o (toa do trang): pad = le (t,b,l,r) hoac so. Da giac loi -> hop chu nhat noi tiep
   * duoc tinh tai hai duong ngang y0, y1; thu nhieu cap (y0, y1) (co canh xeo ngang) va lay dien tich lon nhat.
   */
  function crOf(poly, pad) {
    const p = typeof pad === 'number' ? { t: pad, b: pad, l: pad, r: pad } : Object.assign({ t: 0, b: 0, l: 0, r: 0 }, pad);
    const bb = bbox(poly);
    const bot = Math.min(bb.y1, st.Yb);
    const top0 = Math.max(bb.y0 + p.t, st.my);
    const bot0 = bot - Math.max(p.b, 4);
    const hh = Math.max(20, bot0 - top0);
    let best = null;
    const buoc = [0, 0.04, 0.08, 0.13, 0.19, 0.26, 0.34];
    for (let i = 0; i < buoc.length; i++) {
      for (let j = 0; j < buoc.length; j++) {
        const y0 = top0 + hh * buoc[i], y1 = bot0 - hh * buoc[j];
        if (y1 - y0 < hh * 0.45) continue;
        const e0 = xExt(poly, clamp(y0, bb.y0, bb.y1)), e1 = xExt(poly, clamp(y1, bb.y0, bb.y1));
        const x0 = Math.max(Math.max(e0[0], e1[0]) + p.l, st.mx);
        const x1 = Math.min(Math.min(e0[1], e1[1]) - p.r, st.W - st.mx);
        const w = x1 - x0, h2 = y1 - y0;
        if (w < 20) continue;
        const sc = w * Math.pow(h2, 1.2);
        if (!best || sc > best.sc) best = { sc, x: x0, y: y0, w, h: h2 };
      }
    }
    if (!best) return { x: st.mx, y: top0, w: Math.max(20, st.W - 2 * st.mx), h: hh };
    return { x: best.x, y: best.y, w: best.w, h: best.h };
  }

  // ------------------------------------------------------------------ net toc do / vu no (SVG tinh)
  function speedLines(w, hh, cx, cy, rx, ry, seed, n, wid) {
    const r = rng(seed);
    const R = Math.hypot(w, hh) * 1.15;
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = (i + r() * 0.8) / n * Math.PI * 2, wd = (wid || 0.011) * (0.35 + r());
      const k = 1 + r() * 0.42;
      const tx = cx + Math.cos(a) * rx * k, ty = cy + Math.sin(a) * ry * k;
      d += `M${f1(tx)},${f1(ty)}L${f1(cx + Math.cos(a - wd) * R)},${f1(cy + Math.sin(a - wd) * R)}L${f1(cx + Math.cos(a + wd) * R)},${f1(cy + Math.sin(a + wd) * R)}Z`;
    }
    return `<svg class="j-sl" width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
  }
  /** Net ngang song song (toc do chay) */
  function speedH(w, hh, seed, n) {
    const r = rng(seed);
    let d = '';
    for (let i = 0; i < n; i++) {
      const y = r() * hh, l = w * (0.25 + r() * 0.6), x = r() * (w - l), t = 1 + r() * 3.2 * st.U;
      d += `M${f1(x)},${f1(y)}L${f1(x + l)},${f1(y - t / 2)}L${f1(x + l)},${f1(y + t / 2)}Z`;
    }
    return `<svg class="j-sl" width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
  }
  /** Vu no (sao rang cua): tra ve chuoi points */
  function burstPts(cx, cy, rx, ry, n, seed, jit, trong) {
    const r = rng(seed);
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = i / (n * 2) * Math.PI * 2 + (r() - 0.5) * 0.07;
      const k = i % 2 === 0 ? 1 + (r() - 0.5) * (jit || 0.28) : (trong || 0.78) + (r() - 0.5) * 0.05;
      pts.push(f1(cx + Math.cos(a) * rx * k) + ',' + f1(cy + Math.sin(a) * ry * k));
    }
    return pts.join(' ');
  }
  /** SVG vu no rong w x hh, nen / vien tuy chon */
  function burstSvg(w, hh, seed, o) {
    o = o || {};
    const pad = (o.vien || 6 * st.U) * 1.2;
    const pts = burstPts(w / 2, hh / 2, w / 2 - pad, hh / 2 - pad, o.n || 22, seed, o.jit, o.trong);
    return `<svg class="j-bst" width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}" aria-hidden="true" focusable="false"><polygon points="${pts}" fill="${o.nen || '#fff'}" stroke="${o.mau || '#141414'}" stroke-width="${o.vien || Math.max(3, 6 * st.U)}" stroke-linejoin="miter"/></svg>`;
  }

  // ------------------------------------------------------------------ do co chu (do that trong DOM)
  function probeEl() {
    if (!st.probe || !st.probe.isConnected) { st.probe = h('div', 'j-probe', L); st.probe.setAttribute('aria-hidden', 'true'); }
    return st.probe;
  }
  /** Nhu fitBox nhung neu o co toi thieu fmin van tran thi ha tiep xuong fmin2 (noi dung cuc dai) - khong bao gio cat chu */
  function fitMin(box, w, hh, fmax, fmin, fmin2) {
    const f = fitBox(box, w, hh, fmax, fmin);
    if (box.scrollWidth <= w + 0.6 && box.scrollHeight <= hh + 0.6) return f;
    return fitBox(box, w, hh, fmin, Math.min(fmin, fmin2));
  }
  /**
   * Co chu lon nhat trong [fmin, fmax] de `box` (da o trong DOM, co chieu rong w) khong tran w x hh.
   * Tim nhi phan (chu bao boc chi ngat giua cac token vi token la inline-block nowrap).
   */
  function fitBox(box, w, hh, fmax, fmin) {
    box.style.width = Math.floor(w) + 'px';
    const ok = (f) => {
      box.style.fontSize = f + 'px';
      return box.scrollWidth <= w + 0.6 && box.scrollHeight <= hh + 0.6;
    };
    if (ok(fmax)) return fmax;
    if (!ok(fmin)) { box.style.fontSize = fmin + 'px'; return fmin; }
    let lo = fmin, hi = fmax;
    for (let i = 0; i < 9 && hi - lo > 0.6; i++) {
      const mid = (lo + hi) / 2;
      if (ok(mid)) lo = mid; else hi = mid;
    }
    box.style.fontSize = f1(lo) + 'px';
    return lo;
  }
  /** Co chu lon nhat de mot dong khong xuong hang vua be ngang w (dung scrollWidth) */
  function fitDong(el, w, fmax, fmin) {
    el.style.whiteSpace = 'nowrap';
    el.style.fontSize = fmax + 'px';
    const sw = Math.max(el.scrollWidth, el.offsetWidth);
    let f = sw > w ? fmax * w / sw * 0.995 : fmax;
    f = clamp(f, fmin, fmax);
    el.style.fontSize = f1(f) + 'px';
    if (Math.max(el.scrollWidth, el.offsetWidth) > w + 0.6 && f > fmin) { f = Math.max(fmin, f * w / Math.max(el.scrollWidth, el.offsetWidth) * 0.99); el.style.fontSize = f1(f) + 'px'; }
    return f;
  }

  // ------------------------------------------------------------------ trang (page) + o
  function taoTrang() {
    const el = h('div', 'j-trang', st.vung);
    const cam = h('div', 'j-cam', el);
    const capO = h('div', 'j-cells', cam);
    const vsvg = sv('svg', { class: 'j-vien', width: st.W, height: st.Yb, viewBox: `0 0 ${st.W} ${st.Yb}` }, cam);
    vsvg.style.overflow = 'visible';
    const fx = h('div', 'j-fx', cam);
    const T = { el, cam, capO, vsvg, fx, cells: {}, z: ++st.dem, s: 1, cx: st.W / 2, cy: st.Yb / 2 };
    el.style.zIndex = String(T.z);
    st.pages.push(T);
    return T;
  }
  function addCell(T, id, poly, o) {
    o = o || {};
    const bb = bbox(poly);
    const bx = Math.floor(bb.x0), by = Math.floor(bb.y0), bw = Math.ceil(bb.x1) - bx, bh = Math.ceil(bb.y1) - by;
    const el = h('div', 'j-o' + (o.cls ? ' ' + o.cls : ''), T.capO);
    el.dataset.o = id;
    el.style.left = bx + 'px'; el.style.top = by + 'px'; el.style.width = bw + 'px'; el.style.height = bh + 'px';
    el.style.clipPath = 'polygon(' + poly.map((p) => f1(p[0] - bx) + 'px ' + f1(p[1] - by) + 'px').join(',') + ')';
    if (o.z) el.style.zIndex = String(o.z);
    const noi = h('div', 'j-noi', el);
    if (o.bg) noi.style.background = o.bg;
    const pg = sv('polygon', { points: poly.map((p) => f1(p[0]) + ',' + f1(p[1])).join(' '), pathLength: '1' }, T.vsvg);
    // tam nhin thay (giao voi khung trang) de may quay nham vao
    const vx0 = Math.max(0, bb.x0), vx1 = Math.min(st.W, bb.x1), vy0 = Math.max(0, bb.y0), vy1 = Math.min(st.Yb, bb.y1);
    const c = { id, el, noi, poly, pg, bx, by, bw, bh, bb, cx: (vx0 + vx1) / 2, cy: (vy0 + vy1) / 2, T };
    T.cells[id] = c;
    return c;
  }
  /** Phan tu tuyet doi trong o theo hop (toa do trang) */
  function nhet(c, r, cls, html) {
    const e = h('div', 'j-cr' + (cls ? ' ' + cls : ''), c.noi, html);
    e.style.left = f1(r.x - c.bx) + 'px'; e.style.top = f1(r.y - c.by) + 'px'; e.style.width = f1(r.w) + 'px'; e.style.height = f1(r.h) + 'px';
    return e;
  }
  function veLopNet(c, cr, seed, n, tam, wid) {
    // net tap trung tran ca o: tam (cx, cy) theo toa do trang, vung trong = hop noi dung
    const cxp = tam ? tam[0] : cr.x + cr.w / 2, cyp = tam ? tam[1] : cr.y + cr.h / 2;
    const rx = cr.w / 2 * 0.9 + 8 * st.U, ry = cr.h / 2 * 0.98 + 6 * st.U;
    const w = c.bw, hh = c.bh;
    const e = h('div', 'j-slwrap', c.noi, speedLines(w, hh, cxp - c.bx, cyp - c.by, rx, ry, seed, n || (st.dt ? 70 : 120), wid));
    return e;
  }

  // ------------------------------------------------------------------ may quay (camera) + tieu diem
  function camTuc(T, cx, cy, s) {
    const W = st.W, Hv = st.Yb;
    const sc = giam() ? 1 : (s || st.camS);
    const x = clamp(W / 2 - sc * cx, W * (1 - sc), 0), y = Hv * (1 - sc);
    G.set(T.cam, { x, y, scale: sc, transformOrigin: '0 0' });
    T.s = sc; T.cx = cx; T.cy = cy;
  }
  /** May quay day toi o (<= 350 ms). tre: giay; dur mac dinh .32 */
  function camDen(T, id, tre, s, dur) {
    const c = T && T.cells[id];
    if (!c || giam()) return;
    const W = st.W, Hv = st.Yb;
    const sc = s || st.camS;
    const cx = c.cx, cy = c.cy;
    const x = clamp(W / 2 - sc * cx, W * (1 - sc), 0), y = Hv * (1 - sc);
    T.s = sc; T.cx = cx; T.cy = cy;
    G.to(T.cam, {
      x, y, scale: sc, duration: dur || 0.32, ease: 'power2.inOut', delay: tre || 0, overwrite: 'auto',
      onStart: () => { T.cam.style.willChange = 'transform'; },
      onComplete: () => { T.cam.style.willChange = ''; },
    });
  }
  /** Nhan manh cua o: noi dung phong nhe roi dan hoi (vao <= 200 ms) + vien day len */
  function nhan(T, id, tre, s) {
    const c = T && T.cells[id];
    if (!c) return;
    if (!giam()) {
      const k = s || 1.03;
      G.timeline({ delay: tre || 0 })
        .to(c.noi, { scale: k, duration: 0.14, ease: 'power2.out', overwrite: 'auto' })
        .to(c.noi, { scale: 1, duration: 0.5, ease: 'elastic.out(1, .6)' });
    }
    if (c.pg) {
      G.fromTo(c.pg, { strokeWidth: st.bw }, { strokeWidth: st.bw * 1.9, duration: giam() ? 0.001 : 0.16, ease: 'none', delay: tre || 0, overwrite: 'auto' });
      G.to(c.pg, { strokeWidth: st.bw, duration: giam() ? 0.001 : 0.5, ease: 'power2.out', delay: (tre || 0) + 0.7 });
    }
  }
  /** Tieu diem = may quay + nhan manh */
  function tieuDiem(T, id, tre, s) { camDen(T, id, tre); nhan(T, id, tre, s); }
  function rung(el, tre, bien) {
    if (!el || giam()) return;
    const b = bien || 10;
    G.fromTo(el, { x: 0 }, { keyframes: { x: [0, -b, b, -b * 0.7, b * 0.6, -b * 0.3, 0] }, duration: 0.36, ease: 'none', delay: tre || 0 });
  }

  // ------------------------------------------------------------------ lop noi dung "cho" (hien theo cue) + hieu ung vao
  /** Thuoc tinh danh dau phan tu cho cue `khoa`: an san bang CSS, hien khi cue toi (hoac da hien roi -> khong an) */
  function ck(m, khoa, fx) {
    return ` data-cho="${khoa}" data-fx="${fx || 'no'}"${m && m.rev.has(khoa) ? '' : ' class="j-cho"'}`;
  }
  function hieu(e, tre, fx) {
    e.classList.remove('j-cho');
    if (giam()) { G.fromTo(e, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, delay: tre || 0 }); return; }
    switch (fx) {
      case 'quet':
        G.fromTo(e, { autoAlpha: 1, clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.3, ease: 'power3.inOut', delay: tre || 0, clearProps: 'clipPath' });
        break;
      case 'len':
        G.fromTo(e, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: 'none', delay: tre || 0 });
        G.fromTo(e, { y: 26 * st.U }, { y: 0, duration: 0.42, ease: 'expo.out', delay: tre || 0 });
        break;
      case 'truot':
        G.fromTo(e, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: 'none', delay: tre || 0 });
        G.fromTo(e, { x: -50 * st.U }, { x: 0, duration: 0.42, ease: 'expo.out', delay: tre || 0 });
        break;
      case 'nay':
        G.fromTo(e, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, ease: 'none', delay: tre || 0 });
        G.fromTo(e, { scale: 0.6 }, { scale: 1, duration: 0.42, ease: 'back.out(2.2)', delay: tre || 0 });
        break;
      default:   // 'no': dap xuong (phong to roi ve dung co) — vao <= 200 ms
        G.fromTo(e, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05, ease: 'none', delay: tre || 0 });
        G.fromTo(e, { scale: 1.55 }, { scale: 1, duration: 0.2, ease: 'expo.out', delay: tre || 0 });
    }
  }
  function hienKhoa(m, khoa, tre) {
    if (!m || !m.T) return false;
    let co = false;
    m.rev.add(khoa);
    m.T.el.querySelectorAll(`[data-cho="${khoa}"]`).forEach((e) => {
      if (e.dataset.da) return;
      e.dataset.da = '1';
      co = true;
      hieu(e, tre || 0, e.dataset.fx);
    });
    return co;
  }
  function hienHet(m) {
    if (!m || !m.T) return;
    m.T.el.querySelectorAll('[data-cho]:not([data-da])').forEach((e) => { e.dataset.da = '1'; m.rev.add(e.dataset.cho); hieu(e, 0, e.dataset.fx); });
  }

  // ------------------------------------------------------------------ anh (giu mau) + luoi cham
  function anhHtml(url, o) {
    o = o || {};
    if (!url) return `<div class="j-anh is-trong"><span class="j-anh-chu"${RE_JP.test(o.thay || '') ? ' lang="ja"' : ''}>${esc(o.thay || '')}</span></div>`;
    return `<div class="j-anh"><img src="${esc(url)}" alt="" decoding="async" draggable="false" style="object-position:${esc(o.pos || '50% 45%')}" onerror="this.parentNode.classList.add('is-hong')"/><i class="j-ht ${o.ht || 'ht-duoi'}"></i></div>`;
  }
  /** Cell chua anh: cover neu vung nhin thay gan vuong (khong cat mat / toc), nguoc lai contain tren nen be */
  function datAnh(c, cr, url, o) {
    const e = nhet(c, { x: c.bb.x0, y: c.bb.y0, w: c.bw, h: c.bh }, 'j-anh-cr', anhHtml(url, o));
    e.style.left = '0px'; e.style.top = '0px'; e.style.width = c.bw + 'px'; e.style.height = c.bh + 'px';
    const bb = c.bb;
    const rc = o && o.rect;
    const x0 = rc ? rc.x : Math.max(0, bb.x0), y0 = rc ? rc.y : Math.max(0, bb.y0);
    const vw = rc ? rc.w : Math.min(st.W, bb.x1) - Math.max(0, bb.x0), vh = rc ? rc.h : Math.min(st.Yb, bb.y1) - Math.max(0, bb.y0);
    const asp = vw / Math.max(1, vh);
    const a = e.firstElementChild;
    a.classList.toggle('la-cover', asp > 0.72 && asp < 1.42 && !(o && o.chua));
    a.style.setProperty('--vx', f1(x0 - c.bx) + 'px'); a.style.setProperty('--vy', f1(y0 - c.by) + 'px');
    const gl = a.querySelector('.j-anh-chu');
    if (gl) {
      const gx = Math.max(x0, st.mx + 4), gy = Math.max(y0, st.my + 4), gw = Math.max(40, x0 + vw - gx - 4), gh = Math.max(40, y0 + vh - gy - 4);
      gl.style.inset = 'auto'; gl.style.left = f1(gx - c.bx) + 'px'; gl.style.top = f1(gy - c.by) + 'px'; gl.style.width = f1(gw) + 'px'; gl.style.height = f1(gh) + 'px';
      const nch = Math.max(1, kyTu(gl.textContent).length);
      gl.style.fontSize = f1(Math.min(sz(180, 90), gh * 0.62, gw / (nch * 1.15))) + 'px';
    }
    a.style.setProperty('--vw', f1(vw) + 'px'); a.style.setProperty('--vh', f1(vh) + 'px');
    return e;
  }

  /** Chay het moi tween da dat tren trang T (dung lai trang khi doi co / phong chu: khong hieu ung, dung khung cuoi) */
  function xongAnim(T) {
    try {
      const ts = G.getTweensOf(Array.from(T.el.querySelectorAll('*')).concat([T.el, T.cam]));
      ts.forEach((t) => { try { t.progress(1); } catch (e) {} });
    } catch (e) {}
  }

  // ------------------------------------------------------------------ vao / ra trang
  function xoaTrang(T) {
    if (!T) return;
    const i = st.pages.indexOf(T);
    if (i >= 0) st.pages.splice(i, 1);
    try { G.killTweensOf(T.el.querySelectorAll('*')); G.killTweensOf(T.el); G.killTweensOf(T.cam); } catch (e) {}
    T.el.remove();
    if (st.T === T) st.T = null;
  }
  /** Trang moi len: truot vao tu phai, vet muc xeo o mep trai; trang cu lui nhe roi go */
  function trangVao(T, ngay) {
    const cu = st.pages.filter((p) => p !== T);
    st.T = T;
    if (ngay || giam() || !cu.length) {
      cu.forEach(xoaTrang);
      return;
    }
    const W = st.W;
    const ink = h('div', 'j-ink', T.el);
    G.fromTo(T.el, { x: W * 0.42 }, { x: 0, duration: 0.42, ease: 'expo.out', onComplete: () => { cu.forEach(xoaTrang); ink.remove(); } });
    G.fromTo(ink, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2, delay: 0.32, ease: 'none' });
    cu.forEach((p) => G.to(p.el, { x: -W * 0.05, duration: 0.42, ease: 'power2.out' }));
    // an toan: trang cu di het du hieu ung bi kill
    if (st.api) st.api.hen(() => cu.forEach(xoaTrang), 900);
  }
  /** Cac o vao lan luot: vien ve dan, noi dung truot tu trai (tong <= ~0.4 s) */
  function oVao(T, ids, tre0, buoc) {
    ids.forEach((id, i) => {
      const c = T.cells[id];
      if (!c) return;
      if (giam()) return;
      const t = (tre0 || 0) + i * (buoc == null ? 0.06 : buoc);
      G.fromTo(c.pg, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.3, ease: 'power2.out', delay: t, onComplete: () => { c.pg.style.strokeDasharray = 'none'; } });
      G.fromTo(c.noi, { xPercent: -5, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.34, ease: 'power3.out', delay: t });
    });
  }

  // ------------------------------------------------------------------ tang Sensei (co dinh): bong thoai + o goc meo
  function tangHtmlBuild() {
    if (st.tang) { try { st.tang.el.remove(); } catch (e) {} st.tang = null; }
    const { W, H, g, U, dt } = st;
    const el = h('div', 'j-tang', L);
    const sl = Math.round((dt ? 8 : 16) * U);
    const bT = st.bTop + Math.round(g / 2);           // mep tren o bong thoai
    const cT = st.catT + Math.round(g / 2);           // mep tren o meo
    const cLx = st.catL + Math.round(g / 2);
    const svg = sv('svg', { class: 'j-tang-svg', width: W, height: H, viewBox: `0 0 ${W} ${H}` }, el);
    // o bong thoai: canh phai xeo song song voi canh trai o meo
    const bp = [[-BL, bT], [cLx + sl - g, bT], [cLx - sl - g, H + BL], [-BL, H + BL]];
    const cp = [[cLx + sl, cT], [W + BL, cT], [W + BL, H + BL], [cLx - sl, H + BL]];
    if (dt) { bp[0][1] = bT; bp[1][1] = cT; cp[0][1] = cT; }
    const pb = sv('polygon', { points: bp.map((p) => p.join(',')).join(' '), fill: '#fff', stroke: '#141414', 'stroke-width': st.bw, 'stroke-linejoin': 'miter' }, svg);
    const pc = sv('polygon', { points: cp.map((p) => p.join(',')).join(' '), fill: '#fff', stroke: '#141414', 'stroke-width': st.bw, 'stroke-linejoin': 'miter' }, svg);
    void pb; void pc;
    // luoi cham + net toc do quanh dau meo
    const bb0 = bbox(cp);
    const cw = Math.round(bb0.x1 - bb0.x0), chh = Math.round(H - bb0.y0);
    const cpan = h('div', 'j-tang-meo', el);
    const bbx = Math.floor(bb0.x0), bby = Math.floor(bb0.y0);
    cpan.style.left = bbx + 'px'; cpan.style.top = bby + 'px'; cpan.style.width = (W - bbx) + 'px'; cpan.style.height = (H - bby) + 'px';
    cpan.style.clipPath = 'polygon(' + cp.map((p) => f1(p[0] - bbx) + 'px ' + f1(p[1] - bby) + 'px').join(',') + ')';
    cpan.innerHTML = speedLines(W - bbx, H - bby, (W - bbx) * 0.5, (H - bby) * 0.62, 36 * U, 30 * U, 77, dt ? 50 : 90, 0.014) + '<i class="j-ht ht-goc"></i>';
    void cw; void chh;
    const bpan = h('div', 'j-tang-bp', el);
    const bx = 0, by = Math.floor(bT);
    bpan.style.left = bx + 'px'; bpan.style.top = by + 'px'; bpan.style.width = Math.ceil(cLx) + 'px'; bpan.style.height = (H - by) + 'px';
    bpan.style.clipPath = 'polygon(' + bp.map((p) => f1(p[0] - bx) + 'px ' + f1(p[1] - by) + 'px').join(',') + ')';
    bpan.innerHTML = '<i class="j-ht ht-nen"></i>';
    // ten Sensei (the den)
    const ten = h('div', 'j-tang-ten', el, 'SENSEI MÈO');
    ten.style.left = Math.round(10 * U) + 'px'; ten.style.top = (by + Math.round(g / 2 + 5 * U)) + 'px';
    // bong thoai (chu nhat bo tron + duoi chi ve phia meo)
    const pad = Math.round((dt ? 8 : 20) * U);
    const bxl = Math.round((dt ? 8 : 24) * U), bxr = Math.round(cLx - sl - g - (dt ? 14 : 34) * U);
    const byt = by + Math.round((dt ? 26 : 40) * U), byb = H - Math.round((dt ? 8 : 12) * U);
    const bwid = bxr - bxl, bhei = byb - byt;
    const r = Math.min(bhei / 2, (dt ? 22 : 46) * U);
    const bong = h('div', 'j-bong', el);
    bong.style.left = bxl + 'px'; bong.style.top = byt + 'px'; bong.style.width = (bwid + Math.round(46 * U)) + 'px'; bong.style.height = bhei + 'px';
    const ty = bhei * 0.62, tw2 = Math.min(bhei * 0.32, 22 * U);
    const dNoi = `M${r},0H${bwid - r}A${r},${r} 0 0 1 ${bwid},${r}V${ty - tw2}L${bwid + 40 * U},${ty + 4 * U}L${bwid},${ty + tw2}V${bhei - r}A${r},${r} 0 0 1 ${bwid - r},${bhei}H${r}A${r},${r} 0 0 1 0,${bhei - r}V${r}A${r},${r} 0 0 1 ${r},0Z`;
    bong.innerHTML = `<svg width="${bwid + Math.round(46 * U)}" height="${bhei}" viewBox="0 0 ${bwid + Math.round(46 * U)} ${bhei}" style="overflow:visible"><path d="${dNoi}" fill="#fff" stroke="#141414" stroke-width="${Math.max(3, Math.round((dt ? 3 : 5) * U))}" stroke-linejoin="round"/></svg>`;
    const chu = h('div', 'j-bong-chu', bong);
    chu.style.left = pad + 'px'; chu.style.top = Math.round(bhei * 0.06) + 'px'; chu.style.width = (bwid - pad * 2) + 'px'; chu.style.height = Math.round(bhei * 0.88) + 'px';
    const dong = h('div', 'j-bong-dong', chu);
    st.tang = { el, ten, bong, chu, dong, w: bwid - pad * 2, h: Math.round(bhei * 0.88) };
    if (st.loiRaw) datLoi(st.loiRaw, true);
  }
  /** Dung lai tang Sensei khi khung / vi tri meo doi (batDau chay truoc khi san khau tran be ngang) */
  function khoiTang() {
    const m = st.meo;
    const k = [st.W, st.H, m ? m.x : -1, m ? m.y : -1].join(',');
    if (st.tangKhoa !== k || !st.tang || !st.tang.el.isConnected) { st.tangKhoa = k; tangHtmlBuild(); }
  }
  /** Loi Sensei song: cau cuoi (hoac 2 cau ngan) vao bong thoai, co chu vua bong */
  function datLoi(raw, ngayLoi) {
    const t = st.tang;
    if (!t) return;
    st.loiRaw = String(raw || '');
    const ds = st.loiRaw.replace(/\s+/g, ' ').trim().split(/(?<=[.!?。！？…])\s+/).filter(Boolean);
    if (!ds.length) return;
    let cau = ds[ds.length - 1];
    if (ds.length > 1 && kyTu(cau).length < 16) cau = ds[ds.length - 2] + ' ' + cau;
    cau = ngan(cau, st.dt ? 100 : 150);
    const moi = !st.loiCau || !cau.startsWith(st.loiCau.slice(0, Math.min(14, st.loiCau.length)));
    st.loiCau = cau;
    t.dong.innerHTML = jp(cau);
    const fmax = sz(34, 17), fmin = sz(21, 13);
    fitBox(t.dong, t.w, t.h, fmax, fmin);
    if (moi && !ngayLoi && !giam()) G.fromTo(t.dong, { autoAlpha: 0, y: 12 * st.U }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power3.out', overwrite: 'auto' });
    else G.set(t.dong, { autoAlpha: 1, y: 0 });
  }

  // ------------------------------------------------------------------ thanh phan chu
  /** The den (nhan o goc o) */
  const the = (text, cls) => `<span class="j-the${cls ? ' ' + cls : ''}">${esc(text)}</span>`;

  /** So hang (theo offsetTop) cua cac con cua el */
  function soHang(el) {
    const ks = [...el.children];
    if (!ks.length) return 0;
    const ys = new Set(ks.map((k) => Math.round(k.offsetTop / Math.max(6, k.offsetHeight * 0.5))));
    return ys.size;
  }
  /** Thu hep be ngang cho toi khi so hang sap tang: cac hang cau can bang (khong con token mo coi) */
  function canBang(el, w) {
    const r0 = soHang(el);
    if (r0 < 2) return;
    let lo = w * 0.4, hi = w;
    for (let i = 0; i < 7; i++) {
      const mid = (lo + hi) / 2;
      el.style.width = mid + 'px';
      if (soHang(el) <= r0 && el.scrollWidth <= mid + 0.5) hi = mid; else lo = mid;
    }
    el.style.width = Math.ceil(hi) + 'px';
  }

  // ------------------------------------------------------------------ xep chong: co chu de cac khoi cung vua mot hop
  /** items: [{el, fmax, fmin}] (el la khoi, se dat chieu rong w); gap px giua khoi. Ha dan cho vua hh, roi doi len neu du cho. */
  function fitStack(items, w, hh, gap) {
    const its = items.filter((x) => x && x.el);
    if (!its.length) return;
    const tong = () => its.reduce((a, x) => a + x.el.offsetHeight, 0) + gap * Math.max(0, its.length - 1);
    const tran = () => its.some((x) => x.el.scrollWidth > w + 0.6);
    its.forEach((x) => { x.el.style.width = Math.floor(w) + 'px'; x.f = x.fmax; x.el.style.fontSize = x.f + 'px'; });
    for (let it = 0; it < 12; it++) {
      const t = tong();
      const tr = tran();
      if (t <= hh + 0.5 && !tr) break;
      const gia = Math.max(1, t - gap * (its.length - 1));
      let r = Math.min(1, (hh - gap * (its.length - 1)) / gia);
      if (tr) r = Math.min(r, Math.min(...its.map((x) => (x.el.scrollWidth > w ? w / x.el.scrollWidth : 1))));
      let doi = false;
      its.forEach((x) => { const nf = Math.max(x.fmin, x.f * r * 0.985); if (Math.abs(nf - x.f) > 0.2) doi = true; x.f = nf; x.el.style.fontSize = f1(x.f) + 'px'; });
      if (!doi) break;
    }
    // doi len: cho con du thi phong dan (uu tien khoi con nho hon fmax)
    for (let it = 0; it < 6; it++) {
      const con = its.filter((x) => x.f < x.fmax - 0.5);
      if (!con.length) break;
      const luu = con.map((x) => x.f);
      con.forEach((x) => { x.f = Math.min(x.fmax, x.f * 1.05); x.el.style.fontSize = f1(x.f) + 'px'; });
      if (tong() > hh + 0.5 || tran()) { con.forEach((x, i) => { x.f = luu[i]; x.el.style.fontSize = f1(x.f) + 'px'; }); break; }
    }
  }

  // ------------------------------------------------------------------ duong cat (dung cho moi bo cuc)
  const dV = (xt, xb) => [xt, 0, xb, st.Yb];                 // gan doc: xt tai y = 0, xb tai y = Yb
  const dN = (yl, yr) => [0, yl, st.W, yr];                   // gan ngang: yl o mep trai, yr o mep phai
  const gapY = () => Math.round(st.g / 2);
  const pad0 = () => Math.round((st.dt ? 12 : 26) * st.U);
  /** duong xeo ngan cach cot meo (x > Xc) voi phan con lai */
  const dCot = () => [st.Xc + st.W * 0.012, 0, st.Xc - st.W * 0.012, st.Yb];

  // ================================================================== DUNG TUNG DANG NHIP
  // ---- bia (mo dau buoi giang)
  function tachTieuDe(bai) {
    const title = String((bai && bai.title) || '');
    const so = (bai && bai.lessonNumber) || '';
    const ten = title.replace(/^Bài\s*\d+\s*:\s*/, '').split(/\s+—\s+/)[0] || title;
    const phu = title.split(/\s+—\s+/)[1] || '';
    return { so, ten, phu };
  }
  function layBia() {
    const { W, Yb, Yc } = st;
    if (st.dt) {
      const yA = Math.round(Yb * 0.44), yB = Math.round(Yb * 0.86), s = Math.round(W * 0.03);
      const l1 = dN(yA + s, yA - s), l2 = dN(yB - s * 0.6, yB + s * 0.6);
      return {
        A: cell([l1], [W / 2, 10], Yb), B: cell([l1, l2], [W / 2, (yA + yB) / 2], Yb), E: cell([l2], [W / 2, Yb - 10], Yb),
      };
    }
    const xa = W * 0.53, s = W * 0.03;
    const l1 = dV(xa + s, xa - s), l4 = dN(Yc, Yc);
    const yb = Yc - gapY();
    return {
      A: cell([l1], [10, 10], Yb),
      B: cell([l1], [W - 10, 10], yb),
      E: cell([l1, l4, dCot()], [xa + 60, Yb - 10], Yb),
    };
  }
  function dungBia(nh, api, m, T) {
    const bai = nh.bai || {};
    const tt = tachTieuDe(bai);
    const lay = layBia();
    const pd = pad0();
    const A = addCell(T, 'A', lay.A, { bg: '#eee9e0' });
    const B = addCell(T, 'B', lay.B);
    const E = addCell(T, 'E', lay.E);
    // A: tranh canh bai (giu mau), chu SFX "第N話" o goc
    datAnh(A, null, bai.sceneImageUrl || null, { pos: '50% 40%', thay: bai.lessonNumber ? '第' + bai.lessonNumber + '話' : 'マンガ', ht: 'ht-duoi' });
    const coCanh = !!bai.sceneImageUrl;
    const sfx = h('div', 'j-sfx j-sfx-a', A.noi, `<span data-t="第${esc(tt.so)}話">第${esc(tt.so)}話</span>`);
    sfx.lang = 'ja';
    if (!coCanh) sfx.style.display = 'none';
    sfx.style.fontSize = sz(74, 46) + 'px';
    {
      const cr = crOf(A.poly, pd);
      sfx.style.right = f1(A.bx + A.bw - (cr.x + cr.w)) + 'px'; sfx.style.bottom = f1(A.by + A.bh - (cr.y + cr.h)) + 'px';
    }
    // B: logo (pha 1) -> BAI N + tieu de (pha 2)
    const crB = crOf(B.poly, pd);
    veLopNet(B, crB, 11, st.dt ? 60 : 130);
    const wrap = nhet(B, crB, 'j-bia-b');
    const logo = h('div', 'j-logo', wrap, `<b>SENSEI MÈO</b><span lang="ja">マンガで学ぶ日本語</span><i>第${esc(tt.so)}話 · TIẾNG NHẬT ${esc(nh.capDo === 'KANA' ? 'NHẬP MÔN' : nh.capDo || '')}</i>`);
    const bW = Math.min(crB.w, sz(500, 250)), bH = Math.round(bW * 0.36);
    logo.querySelector('b').style.fontSize = f1(Math.min(sz(104, 46), crB.w / 6.4)) + 'px';
    logo.querySelector('span').style.fontSize = f1(Math.min(sz(38, 18), crB.w / 11)) + 'px';
    logo.querySelector('i').style.fontSize = f1(Math.min(sz(28, 13), crB.w / 17)) + 'px';
    const p2 = h('div', 'j-bia-2', wrap);
    const bst = h('div', 'j-bia-bai', p2, burstSvg(bW, bH, 5, { n: 24, jit: 0.3 }) + `<b>BÀI ${esc(tt.so)}</b>`);
    bst.style.width = bW + 'px'; bst.style.height = bH + 'px';
    bst.lastChild.style.fontSize = f1(bH * 0.5) + 'px';
    const td = h('div', 'j-bia-td', p2, jp(tt.ten));
    p2.style.gap = Math.round(pd * 0.5) + 'px';
    const hAvail = crB.h - bH - pd * 0.5;
    fitBox(td, crB.w, Math.max(40, hAvail), sz(96, 52), sz(44, 28));
    G.set(p2, { autoAlpha: 0 });
    // E: mau cau chinh dang chip
    const cum = (tt.phu || '').split(/[\/／]/).map((x) => x.trim()).filter(Boolean).slice(0, 6);
    const crE = crOf(E.poly, Math.round(pd * 0.7));
    const ew = nhet(E, crE, 'j-chips');
    const chips = cum.length ? cum : ['マンガ'];
    ew.innerHTML = chips.map((x) => `<span class="j-chip" lang="ja">${esc(x)}</span>`).join('');
    fitBox(ew, crE.w, crE.h, sz(38, 20), sz(18, 13));
    oVao(T, ['A', 'B', 'E'], 0, 0.07);
    m.bia = { logo, p2, bst, td, B };
    camTuc(T, B.cx, B.cy);
    m.fase = 'bia';
  }
  function biaSangBai(m, tre) {
    const b = m.bia;
    if (!b || m.baiDaHien) return;
    m.baiDaHien = true;
    if (giam()) { G.set(b.logo, { autoAlpha: 0 }); G.set(b.p2, { autoAlpha: 1 }); return; }
    G.to(b.logo, { autoAlpha: 0, scale: 0.9, duration: 0.14, delay: tre || 0, ease: 'power2.in' });
    G.fromTo(b.p2, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06, delay: (tre || 0) + 0.1 });
    G.fromTo(b.bst, { scale: 0.3, rotation: -6 }, { scale: 1, rotation: 0, duration: 0.42, ease: 'back.out(2.2)', delay: (tre || 0) + 0.1 });
    G.fromTo(b.td, { scale: 1.4 }, { scale: 1, duration: 0.24, ease: 'expo.out', delay: (tre || 0) + 0.18 });
    camDen(m.T, 'B', tre || 0, st.camS + 0.005);
  }

  // ---- tu vung
  function tachKanjiYomi(v) {
    const tu = String(v.kanji || v.word || '');
    const coRuby = !!(v.kanji && v.furigana && v.furigana !== v.kanji);
    return { tu, coRuby, yomi: String(v.furigana || v.word || '') };
  }
  function layTuVung(bien, n2, coGhi) {
    const { W, Yb, Yc } = st;
    const pd = pad0();
    if (st.dt) {
      const yA = Math.round(Yb * 0.25), yB = Math.round(Yb * (coGhi ? 0.63 : 0.7)), s = Math.round(W * 0.028);
      const l1 = dN(yA - s, yA + s), l2 = dN(yB + s * 0.6, yB - s * 0.6);
      return {
        A: cell([l1], [W / 2, 10], Yb), B: cell([l1, l2], [W / 2, (yA + yB) / 2], Yb), C: cell([l2], [W / 2, Yb - 10], Yb), D: null,
      };
    }
    const s = W * 0.02;
    const need = n2 * 208 * st.U + 2 * pd + s + st.mx + 40 * st.U;
    if (bien === 0) {
      // anh trai; phai: headword cao (tren), nghia (duoi-trai), dem (cot meo)
      const xa = clamp(W - need, W * 0.09, n2 <= 2 ? W * 0.56 : W * 0.46);
      const yBc = Math.round(Yc * (n2 >= 5 ? 0.83 : 0.88));
      const l1 = dV(xa + s, xa - s), l2 = [xa - s, yBc + W * 0.008, W, yBc - W * 0.008];
      return {
        A: cell([l1], [10, 10], Yb),
        B: cell([l1, l2], [W - 10, 10], Yb),
        C: cell([l1, l2, dCot()], [xa + 40, Yb - 10], Yb),
        D: cell([l1, l2, dCot()], [W - 10, Yc - 10], Yc),
      };
    }
    // bien 1: anh phai (den mep tren o meo); trai: headword cao tren, nghia duoi; dai nho duoi anh
    const xb = clamp(need, W * 0.54, W * 0.9);
    const yBc = Math.round(Yb * (n2 > 5 ? 0.74 : 0.69));
    const l1 = dV(xb - s, xb + s), l2 = [0, yBc + W * 0.008, xb + s, yBc - W * 0.008], l5 = [0, Yc, W, Yc];
    return {
      A: cell([l1], [W - 10, 10], Yc - gapY()),
      B: cell([l1, l2], [10, 10], Yb),
      C: cell([l1, l2], [10, Yb - 10], Yb),
      D: cell([l1, l5, dCot()], [xb + 60, Yb - 10], Yb),
    };
  }
  /** Co chu headword (do that): 1 dong (co ruby) hoac 2 dong cho tu dai; tra { f, dong2 } */
  function fitHeadword(hw, tu, coRuby, yomi, w, hh, fmax) {
    const cs = kyTu(tu), n = cs.length;
    const html1 = `<span class="j-hw-i">${coRuby ? C.ruby(tu, yomi) : esc(tu)}</span>`;
    const dat = (html, dong) => {
      hw.innerHTML = html;
      hw.firstElementChild.style.whiteSpace = 'nowrap';
      hw.style.width = Math.floor(w) + 'px';
      hw.style.fontSize = fmax + 'px';
      hw.style.lineHeight = dong > 1 ? '1.02' : '';
      const k = Math.min(1, w / Math.max(1, hw.scrollWidth), hh / Math.max(1, hw.offsetHeight));
      let f = fmax * k * 0.995;
      hw.style.fontSize = f1(f) + 'px';
      if (hw.scrollWidth > w + 0.6 || hw.offsetHeight > hh + 0.6) { f *= Math.min(w / hw.scrollWidth, hh / hw.offsetHeight) * 0.99; hw.style.fontSize = f1(f) + 'px'; }
      return f;
    };
    let f = dat(html1, 1), dong2 = false;
    if (n >= 6) {
      const half = Math.ceil(n / 2);
      const f2 = dat(`<span class="j-hw-i">${esc(cs.slice(0, half).join(''))}<br>${esc(cs.slice(half).join(''))}</span>`, 2);
      if (f2 > f * 1.2) { f = f2; dong2 = true; } else f = dat(html1, 1);
    }
    return { f, dong2 };
  }
  function dungTuVung(nh, api, m, T, opt) {
    opt = opt || {};
    const v = nh.data || {};
    const c = nh.chuong || {};
    const { tu, coRuby, yomi } = tachKanjiYomi(v);
    const n = kyTu(tu).length;
    const bien = st.dt ? 0 : (((c.i || nh.i || 0) + (m.lech || 0)) % 2);
    const lay = layTuVung(bien, n, !!(v.accentNote || tachNghia(v.meaningVi)[1]));
    const pd = pad0();
    const A = addCell(T, 'A', lay.A, { bg: '#eee9e0' });
    const B = addCell(T, 'B', lay.B);
    const Cc = addCell(T, 'C', lay.C);
    const Dd = lay.D ? addCell(T, 'D', lay.D) : null;
    // ---- A: minh hoa (giu mau) + luoi cham goc + ghi chu / meo de len anh
    const urlAnh = v.imageUrl || (nh.bai && nh.bai.sceneImageUrl) || null;
    datAnh(A, null, urlAnh, { pos: '50% 38%', thay: '', ht: bien ? 'ht-trai' : 'ht-duoi' });
    const [nghiaChinh, nghiaPhu] = tachNghia(v.meaningVi);
    let hopNetH = 0;
    {
      const ghi = [];
      if (nghiaPhu) ghi.push(`<p>${jp(nghiaPhu)}</p>`);
      if (v.accentNote) ghi.push(`<p><b class="j-mo">MẸO</b> ${jp(v.accentNote)}</p>`);
      const aHep = st.dt || (Math.min(st.W, A.bb.x1) - Math.max(0, A.bb.x0)) < st.W * 0.3;
      if (aHep) ghi.length = 0;
      if (ghi.length) {
        const crA = crOf(A.poly, Math.round(pd * 0.8));
        const wA = Math.min(crA.w, sz(560, 300));
        const bx = nhet(A, { x: crA.x, y: crA.y, w: wA, h: crA.h }, 'j-ghi-anh');
        bx.style.justifyContent = 'flex-end'; bx.style.alignItems = 'flex-start';
        const hop = h('div', 'j-meo', bx, ghi.join(''));
        fitBox(hop, wA, Math.round(crA.h * (st.dt ? 0.5 : 0.42)), sz(30, 16), sz(20, 13));
        hopNetH = hop.offsetHeight + Math.round(pd * 0.3);
      }
    }
    if (!urlAnh) {
      const cs0 = kyTu(tu);
      const dau = cs0.find((x) => /[一-鿿぀-ヿ]/.test(x)) || cs0[0] || '?';
      const crN = crOf(A.poly, Math.round(pd * 0.8));
      crN.h = Math.max(60, crN.h - hopNetH);
      taoHopNet(A, crN, [dau], m, 0);
      m.hVe = api.hen(() => veNetM(m, 0), 1600);
    }
    // ---- B: headword
    const crB = crOf(B.poly, pd);
    veLopNet(B, crB, 21 + (bien ? 3 : 0), st.dt ? 56 : 120);
    const tagH = sz(40, 26);
    const wB = nhet(B, crB, 'j-vb');
    const soTu = `${String(c.i || nh.i + 1).padStart(2, '0')}<i>/${String(c.n || nh.n).padStart(2, '0')}</i>`;
    h('div', 'j-tagrow', wB, `${the('TỪ MỚI')}<b class="j-dem-nho">${soTu}</b>`);
    const hwBox = h('div', 'j-hw', wB);
    hwBox.lang = 'ja';
    const romaji = h('div', 'j-romaji', wB, esc(v.romaji || ''));
    const romH = v.romaji ? sz(50, 26) : 0;
    if (!v.romaji) romaji.style.display = 'none';
    else romaji.style.fontSize = sz(50, 25) + 'px';
    const hw = fitHeadword(hwBox, tu, coRuby, yomi, crB.w, crB.h - tagH - romH - pd * 0.2, n <= 2 ? sz(520, 210) : sz(340, 150));
    if (hw.dong2 && coRuby) {
      romaji.textContent = yomi + (v.romaji ? '  ·  ' + v.romaji : '');
      romaji.style.display = '';
      romaji.style.fontSize = sz(46, 22) + 'px';
      romaji.lang = 'ja';
    }
    // ---- C: nghia
    const crC = crOf(Cc.poly, Math.round(pd * 0.8));
    const loai = C.loaiTu(v.wordType);
    const wC = nhet(Cc, crC, 'j-vc');
    h('div', 'j-tagrow', wC, the('NGHĨA'));
    const dau = h('div', 'j-c-nghia', wC);
    const ng = h('div', 'j-nghia', dau, jp(nghiaChinh || v.meaningVi || ''));
    const chuaHien = !m.rev.has('V3');
    ng.setAttribute('data-cho', 'V3'); ng.dataset.fx = 'len';
    if (chuaHien) ng.classList.add('j-cho');
    const qm = h('div', 'j-qm', wC, '？');
    qm.lang = 'ja';
    if (!chuaHien) qm.style.display = 'none';
    let meoC = null;
    if ((st.dt || (Math.min(st.W, A.bb.x1) - Math.max(0, A.bb.x0)) < st.W * 0.3) && (nghiaPhu || v.accentNote)) {
      meoC = h('div', 'j-meo', dau, `${nghiaPhu ? `<p>${jp(nghiaPhu)}</p>` : ''}${v.accentNote ? `<p><b class="j-mo">MẸO</b> ${jp(v.accentNote)}</p>` : ''}`);
      meoC.setAttribute('data-decor-x', '');
    }
    const hC = crC.h - sz(44, 30);
    if (meoC) {
      fitStack([{ el: ng, fmax: sz(150, 84), fmin: sz(44, 28) }, { el: meoC, fmax: sz(30, 19), fmin: sz(20, 13) }], crC.w, hC, sz(8, 10));
      // van tran: cat bot chu cua ghi chu (meo) — giu nghia chinh to (>= 44 may / 28 dien thoai)
      const tongC = () => ng.offsetHeight + meoC.offsetHeight + sz(8, 10);
      for (let g = 0; g < 30 && tongC() > hC + 1; g++) {
        const p = [...meoC.querySelectorAll('p')].sort((a, b2) => b2.textContent.length - a.textContent.length)[0];
        if (!p || kyTu(p.textContent).length < 14) break;
        const tag = p.querySelector('b'), tagT = tag ? tag.textContent : '';
        const body = kyTu(p.textContent.slice(tagT.length).trim());
        p.innerHTML = (tag ? tag.outerHTML + ' ' : '') + jp(body.slice(0, Math.max(6, Math.floor(body.length * 0.85))).join('').replace(/[\s,;、—-]+$/, '') + '…');
      }
      // van khong vua: bo bot doan ghi chu (tu cuoi ve dau), khong ha nghia chinh duoi 44 / 28
      for (let g = 0; g < 4 && tongC() > hC + 1; g++) {
        const ps = meoC.querySelectorAll('p');
        if (ps.length > 1) ps[ps.length - 1].remove(); else meoC.style.display = 'none';
        if (meoC.style.display === 'none') { fitMin(ng, crC.w, hC, sz(150, 84), sz(44, 28), sz(24, 16)); break; }
      }
      if (tongC() > hC + 1 && meoC.style.display !== 'none') fitStack([{ el: ng, fmax: sz(44, 28), fmin: sz(24, 18) }, { el: meoC, fmax: sz(20, 13), fmin: sz(20, 13) }], crC.w, hC, sz(8, 6));
    } else fitMin(ng, crC.w, hC, sz(150, 60), sz(44, 28), sz(24, 16));
    // ---- D: dem
    if (Dd) {
      const crD = crOf(Dd.poly, Math.round(pd * 0.6));
      veLopNet(Dd, crD, 5, st.dt ? 40 : 60);
      const wD = nhet(Dd, crD, 'j-vd');
      if (loai) {
        const bs = h('div', 'j-loai-lon', wD, `<b>${esc(loai)}</b>`);
        bs.style.maxWidth = Math.floor(crD.w) + 'px';
        fitDong(bs.firstChild, crD.w - sz(30, 16), Math.min(sz(58, 26), crD.h * 0.62), sz(20, 14));
      } else {
        h('div', 'j-dem-lon', wD, `<b>${String(c.i || nh.i + 1).padStart(2, '0')}</b><i>/ ${String(c.n || nh.n).padStart(2, '0')}</i>`);
        wD.firstElementChild.style.fontSize = f1(Math.min(crD.h * 0.9, sz(110, 40))) + 'px';
      }
    }
    oVao(T, ['A', 'B', 'C'].concat(Dd ? ['D'] : []), opt.tre || 0, 0.06);
    if (m.net && (opt.ngay || m.daVe)) { const dv = m.daVe; m.daVe = false; veNetM(m, 0, true); m.daVe = dv || true; }
    m.vc = { hw: hwBox, ng, qm };
    m.fase = 'tu';
    camTuc(T, B.cx, B.cy);
    if (!opt.ngay && chuaHien) m.hNghia = api.hen(() => cueVocab(m, 'V3', null), 3200);
  }
  function cueVocab(m, id, tt) {
    const T = m.T;
    if (!T || !m.vc || m.fase !== 'tu') return;
    const tre = tt ? m.api.tre(tt) : 0;
    const vc = m.vc;
    if (id === 'V1' || id === 'V2' || id === 'V2b') {
      if (m.net && id === 'V1') { if (m.hVe != null) m.api.huyHen(m.hVe); veNetM(m, tre + 0.1); }
      camDen(T, 'B', tre);
      nhan(T, 'B', tre, id === 'V1' ? 1.03 : 1.015);
      if (!giam()) {
        G.fromTo(vc.hw, { scale: id === 'V1' ? 1.25 : 1.1 }, { scale: 1, duration: 0.2, ease: 'expo.out', delay: tre, overwrite: 'auto' });
        const sl = T.cells.B.noi.querySelector('.j-slwrap');
        if (sl) G.fromTo(sl, { scale: 1.16, autoAlpha: 0.5 }, { scale: 1, autoAlpha: 1, duration: 0.3, ease: 'expo.out', delay: tre, overwrite: 'auto' });
      }
      if (id === 'V1' && !m.rev.has('V3')) { if (m.hNghia != null) m.api.huyHen(m.hNghia); m.hNghia = m.api.hen(() => cueVocab(m, 'V3', null), 1800 + Math.round(tre * 1000)); }
    } else if (id === 'V3') {
      if (m.hNghia != null) { m.api.huyHen(m.hNghia); m.hNghia = null; }
      const co = hienKhoa(m, 'V3', tre);
      if (vc.qm) { if (giam()) vc.qm.style.display = 'none'; else G.to(vc.qm, { autoAlpha: 0, scale: 0.4, duration: 0.14, delay: tre, onComplete: () => { vc.qm.style.display = 'none'; } }); }
      if (co || tt) tieuDiem(T, 'C', tre);
    } else if (id === 'V4' || id === 'V5') {
      tieuDiem(T, T.cells.D ? 'D' : 'C', tre, 1.03);
    } else if (id === 'V0') {
      nhan(T, 'B', tre, 1.015);
    }
  }

  // ------------------------------------------------------------------ bong thoai + nhom token cau
  /** Bong thoai chu nhat bo tron (w x hh), duoi (tail) tuy chon o day: { bx, bw, tx, ty } toa do trong hop */
  function bongSvg(w, hh, r, tail, sw) {
    r = Math.min(r, w / 2, hh / 2);
    let p = `M${f1(r)},0H${f1(w - r)}A${f1(r)},${f1(r)} 0 0 1 ${f1(w)},${f1(r)}V${f1(hh - r)}A${f1(r)},${f1(r)} 0 0 1 ${f1(w - r)},${f1(hh)}`;
    if (tail) {
      const b1 = tail.bx + tail.bw / 2, b0 = tail.bx - tail.bw / 2;
      p += `H${f1(b1)}Q${f1((b1 + tail.tx) / 2 + 8)},${f1((hh + tail.ty) / 2 - 6)} ${f1(tail.tx)},${f1(tail.ty)}Q${f1((b0 + tail.tx) / 2 - 4)},${f1((hh + tail.ty) / 2 - 18)} ${f1(b0)},${f1(hh)}`;
    }
    p += `H${f1(r)}A${f1(r)},${f1(r)} 0 0 1 0,${f1(hh - r)}V${f1(r)}A${f1(r)},${f1(r)} 0 0 1 ${f1(r)},0Z`;
    return `<svg class="j-bg-svg" width="${f1(w)}" height="${f1(hh)}" viewBox="0 0 ${f1(w)} ${f1(hh)}" aria-hidden="true" focusable="false" style="overflow:visible"><path d="${p}" fill="#fff" stroke="#141414" stroke-width="${sw || Math.max(3, Math.round(5 * st.U))}" stroke-linejoin="round"/></svg>`;
  }
  /** Nhom token: dau cau gop vao token truoc. Tra [{ idx:[i..], html, key, chu }] */
  function nhomTok(toks) {
    const out = [];
    (toks || []).forEach((t, i) => {
      const html = C.tok(t, i, toks);
      const dau = laDau(t);
      if (dau && out.length) { const g = out[out.length - 1]; g.idx.push(i); g.html += html; g.chu += chuTok(t); return; }
      out.push({ idx: [i], html, key: !!t.isKeyGrammar, chu: chuTok(t), dau });
    });
    return out;
  }
  const tokSpan = (g, k) => `<span class="j-tok${g.key ? ' k' : ''}" data-g="${k}" data-i="${g.idx[0]}" data-id="${esc(g.id || '')}" lang="ja">${g.html}</span>`;
  /** Dong "cach doc" (romaji) cua cau */
  const romajiCau = (toks) => (toks || []).filter((t) => !laDau(t)).map(romaTok).join(' ').replace(/\s+/g, ' ').trim();

  /** Nhan manh ky tu: gach muc chay ra duoi phan tu (bien --hl 0 -> 1) */
  function danhDau(el, tre) {
    if (!el) return;
    el.classList.add('j-mk');
    if (giam()) { el.style.setProperty('--hl', 1); return; }
    G.fromTo(el, { '--hl': 0 }, { '--hl': 1, duration: 0.18, ease: 'power2.out', delay: tre || 0 });
  }

  /** Hop viet net trong o c (hop cr): chars = cac ky tu; tra { hang, ds } va gan m.net. Ve net: veNetM(m, tre) */
  function taoHopNet(c, cr, chars, m, tagH) {
    const sBox = Math.floor(Math.min(cr.w, cr.h - tagH));
    const hang = h('div', 'j-net-hang', c.noi);
    hang.style.position = 'absolute';
    hang.style.left = f1(cr.x - c.bx) + 'px'; hang.style.top = f1(cr.y - c.by + tagH) + 'px';
    hang.style.width = (chars.length > 1 ? Math.floor(cr.w) : sBox) + 'px'; hang.style.height = sBox + 'px';
    if (chars.length === 1) hang.style.left = f1(cr.x - c.bx + (cr.w - sBox) / 2) + 'px';
    const oS = chars.length > 1 ? Math.floor(Math.min(sBox, cr.w / (chars.length * 0.78))) : sBox;
    m.net = [];
    chars.forEach((cc) => {
      const o = h('div', 'j-net-o', hang);
      const nho = chars.length > 1 && /[ゃゅょャュョぁぃぅぇぉっ]/.test(cc);
      const box = nho ? Math.round(oS * 0.62) : oS;
      o.style.width = box + 'px'; o.style.height = box + 'px';
      if (nho) o.style.alignSelf = 'flex-end';
      const bong = h('span', 'j-net-bong', o, esc(cc));
      bong.lang = 'ja';
      bong.style.fontSize = f1(box * 0.8) + 'px';
      const kung = h('div', 'j-net-khung', o);
      m.net.push({ o, bong, kung, cc });
    });
    return hang;
  }

  // ---- chu Han / chu cai (kana)
  function layChuHan(kana) {
    const { W, Yb, Yc } = st;
    const s = W * 0.02;
    if (st.dt) {
      const yA = Math.round(Yb * (kana ? 0.39 : 0.43)), yB = Math.round(Yb * (kana ? 0.62 : 0.61)), yC = Math.round(Yb * (kana ? 0.78 : 0.74)), t = Math.round(W * 0.026);
      const l1 = dN(yA + t, yA - t), l2 = dN(yB - t * 0.7, yB + t * 0.7), l3 = dN(yC + t * 0.6, yC - t * 0.6);
      return {
        A: cell([l1], [W / 2, 10], Yb), B: cell([l1, l2], [W / 2, (yA + yB) / 2], Yb), C: cell([l2, l3], [W / 2, (yB + yC) / 2], Yb), D: cell([l3], [W / 2, Yb - 10], Yb), E: null,
      };
    }
    const xa = W * 0.36;
    const y1 = Math.round(Yb * (kana ? 0.27 : 0.30)), y2 = Math.round(Yb * (kana ? 0.55 : 0.47));
    const l1 = dV(xa + s, xa - s), l2 = [xa - s, y1 + W * 0.008, W, y1 - W * 0.008], l3 = [xa - s, y2 - W * 0.006, W, y2 + W * 0.006];
    return {
      A: cell([l1], [10, 10], Yb),
      B: cell([l1, l2], [W - 10, 10], Yb),
      C: cell([l1, l2, l3], [W - 10, (y1 + y2) / 2], Yb),
      D: cell([l1, l3, dCot()], [xa + 40, Yb - 10], Yb),
      E: cell([l1, l3, dCot()], [W - 10, Yc - 10], Yc),
    };
  }
  const dsMang = (x) => (Array.isArray(x) ? x : x ? [x] : []).filter(Boolean);
  /** Ve net cac chu (kana ghep: ve lan luot). ngay: ve xong ngay khong hieu ung */
  function veNetM(m, tre, ngay) {
    if (!m.net || !m.net.length) return;
    if (m.daVe && !ngay) return;
    m.daVe = true;
    let t0 = tre || 0;
    m.net.forEach((n) => {
      if (n.xong && !ngay) return;
      if (n.kung.querySelector('svg')) n.kung.textContent = '';
      n.xong = true;
      const so = window.SenseiStrokes && SenseiStrokes.get ? (SenseiStrokes.get(n.cc) || []).length : 0;
      const toc = clamp(3.0 / Math.max(1, m.net.length * (so || 6)), 0.2, 0.55);
      const r = C.vietNet(n.kung, n.cc, { tocDo: ngay ? 0.12 : toc, tre: ngay ? 0 : t0 });
      if (!r) { n.bong.classList.add('la-chinh'); return; }
      if (ngay || giam()) {
        if (ngay) { try { G.killTweensOf(r.svg.querySelectorAll('.cd-net-ve path')); } catch (e) {} r.svg.querySelectorAll('.cd-net-ve path').forEach((p) => { p.style.strokeDashoffset = '0'; }); }
        n.bong.style.display = 'none';
      } else {
        G.to(n.bong, { autoAlpha: 0, duration: 0.12, delay: t0, overwrite: 'auto' });
        t0 = r.dur + 0.06;
      }
    });
  }
  function dungChuHan(nh, api, m, T, opt) {
    opt = opt || {};
    const d = nh.data || {};
    const kana = !!nh.laKana;
    const ch = String(d.character || '');
    const c = nh.chuong || {};
    const pd = pad0();
    const lay = layChuHan(kana);
    const A = addCell(T, 'A', lay.A);
    const B = addCell(T, 'B', lay.B);
    const Cc = addCell(T, 'C', lay.C);
    const Dd = addCell(T, 'D', lay.D);
    const Ee = lay.E ? addCell(T, 'E', lay.E) : null;
    // ---- A: khung viet net (luoi + net mo + net ve dan)
    const crA = crOf(A.poly, pd);
    const tagH = sz(40, 26);
    const wA = nhet(A, crA, 'j-ka');
    h('div', 'j-tagrow', wA, `${the(kana ? 'CHỮ CÁI' : 'CHỮ HÁN')}<b class="j-dem-nho">${String(c.i || 1).padStart(2, '0')}<i>/${String(c.n || nh.n).padStart(2, '0')}</i></b>`);
    taoHopNet(A, crA, kyTu(ch), m, tagH);
    // ---- B: Han Viet / romaji + nghia
    const crB = crOf(B.poly, pd);
    veLopNet(B, crB, 31, st.dt ? 50 : 100);
    const wB = nhet(B, crB, 'j-kb');
    h('div', 'j-tagrow', wB, the(kana ? 'CÁCH ĐỌC' : 'HÁN VIỆT'));
    const ten = String((kana ? d.romaji : d.hanViet) || '');
    const hang2 = h('div', 'j-kb-hang', wB);
    const hv = h('div', 'j-hv', hang2, esc(ten));
    const nghia = h('div', 'j-kb-nghia', hang2);
    nghia.innerHTML = `<span${ck(m, 'K3', 'len')}>${jp(ngan(d.meaningVi || '', kana ? 90 : 70))}</span>`;
    {
      const wRow = crB.w, hRow = crB.h - tagH;
      fitDong(hv, wRow * (st.dt ? 0.36 : 0.42), Math.min(sz(160, 70), hRow / 1.05), sz(60, 30));
      const wNg = wRow - hv.offsetWidth - pd * 0.8;
      fitMin(nghia, wNg, hRow, sz(46, 22), sz(22, 16), sz(18, 13));
    }
    // ---- C: doc On / Kun (kanji) hoac meo nho (kana)
    const crC = crOf(Cc.poly, Math.round(pd * 0.8));
    const wC = nhet(Cc, crC, 'j-kc');
    if (kana) {
      h('div', 'j-tagrow', wC, the('MẸO NHỚ'));
      const meo = h('div', 'j-kc-meo', wC, jp(d.meoNho || d.meaningVi || ''));
      fitBox(meo, crC.w, crC.h - sz(48, 34), sz(38, 18), sz(20, 14));
      wC.style.paddingTop = sz(44, 30) + 'px';
    } else {
      const on = dsMang(d.onyomi).slice(0, 3).join('、'), kun = dsMang(d.kunyomi).slice(0, 3).join('、');
      const cols = h('div', 'j-am', wC);
      const mk1 = (nhanT, txt) => `<div class="j-am-c"><b class="j-am-n">${nhanT}</b><span lang="ja" class="j-am-t">${esc(txt)}</span></div>`;
      cols.innerHTML = (on ? mk1('ON', on) : '') + (kun ? mk1('KUN', kun) : '') + (!on && !kun ? mk1('ÂM', '—') : '');
      fitBox(cols, crC.w, crC.h, sz(54, 26), sz(26, 15));
    }
    // ---- D: tu ghep / tu vi du
    const crD = crOf(Dd.poly, Math.round(pd * 0.8));
    const wD = nhet(Dd, crD, 'j-kd');
    h('div', 'j-tagrow', wD, the(kana ? 'TỪ VÍ DỤ' : 'TỪ GHÉP'));
    const tu = dsMang(d.commonWords).slice(0, 3);
    const ds = h('div', 'j-tu-ds', wD);
    ds.innerHTML = tu.map((w, i) => `<div class="j-tu" data-k="${i}"><span class="j-tu-w" lang="ja">${C.ruby(w.word || '', w.furigana || '')}</span><span class="j-tu-n">${esc(ngan(boNgoacCuoi(w.meaningVi || ''), 40))}</span></div>`).join('');
    wD.style.paddingTop = sz(48, 34) + 'px';
    const its = [{ el: ds, fmax: sz(60, 28), fmin: sz(30, 15) }];
    if (kana && d.sosanh) {
      const ss = h('div', 'j-meo j-sosanh', wD, `<p><b class="j-mo">DỄ NHẦM</b> ${jp(d.sosanh)}</p>`);
      its.push({ el: ss, fmax: sz(28, 15), fmin: sz(20, 13) });
    }
    fitStack(its, crD.w, crD.h - sz(48, 34), sz(10, 6));
    m.tuDs = ds;
    // ---- E: so net / bang chu (cot meo)
    if (Ee) {
      const crE = crOf(Ee.poly, Math.round(pd * 0.7));
      veLopNet(Ee, crE, 8, 60);
      const wE = nhet(Ee, crE, 'j-ke');
      if (kana) h('div', 'j-ke-c', wE, `<b lang="ja">${esc(d.bangChu === 'katakana' ? 'カタカナ' : 'ひらがな')}</b>`);
      else h('div', 'j-ke-c', wE, `<b>${esc(d.strokeCount || '?')}</b><i>NÉT</i>`);
      wE.firstElementChild.style.fontSize = f1(Math.min(crE.h * 0.62, crE.w * (kana ? 0.2 : 0.5), sz(110, 40))) + 'px';
    }
    oVao(T, ['A', 'B', 'C', 'D'].concat(Ee ? ['E'] : []), opt.tre || 0, 0.06);
    m.fase = 'kj';
    camTuc(T, A.cx, A.cy);
    if (opt.ngay || m.daVe) { m.daVe = false; veNetM(m, 0, true); m.daVe = true; }
    else {
      m.hVe = api.hen(() => veNetM(m, 0), 2600);
      if (!m.rev.has('K3')) m.hNghia = api.hen(() => cueChuHan(m, 'K3', null), 3000);
    }
  }
  function cueChuHan(m, id, tt) {
    const T = m.T;
    if (!T || m.fase !== 'kj') return;
    const tre = tt ? m.api.tre(tt) : 0;
    const kana = !!m.nh.laKana;
    if (id === 'K0') nhan(T, 'A', tre, 1.015);
    else if (id === 'K1' || id === 'K1b') { camDen(T, 'A', tre); if (m.hVe != null) m.api.huyHen(m.hVe); veNetM(m, tre); nhan(T, 'A', tre, 1.02); }
    else if (id === 'K2') {
      camDen(T, 'B', tre); nhan(T, 'B', tre, 1.03);
      const hv = T.cells.B.noi.querySelector('.j-hv');
      if (hv && !giam()) G.fromTo(hv, { scale: 1.4 }, { scale: 1, duration: 0.2, ease: 'expo.out', delay: tre, overwrite: 'auto' });
    } else if (id === 'K3') {
      if (m.hNghia != null) m.api.huyHen(m.hNghia);
      hienKhoa(m, 'K3', tre); tieuDiem(T, 'B', tre, 1.02);
    } else if (id === 'K4') tieuDiem(T, kana ? 'C' : 'A', tre, 1.02);
    else if (id === 'K5') { tieuDiem(T, kana ? 'D' : 'C', tre, 1.025); if (!kana) danhDau(T.cells.C.noi.querySelector('.j-am-c:first-child .j-am-t'), tre); }
    else if (id === 'K6') { tieuDiem(T, 'C', tre, 1.02); danhDau(T.cells.C.noi.querySelector('.j-am-c:last-child .j-am-t'), tre); }
    else if (/^K7\.\d+$/.test(id)) {
      const k = +id.split('.')[1];
      const e = m.tuDs && m.tuDs.children[k];
      camDen(T, 'D', tre);
      nhan(T, 'D', tre, 1.015);
      if (e) {
        m.tuDs.querySelectorAll('.j-tu').forEach((x) => x.classList.remove('on'));
        e.classList.add('on');
        if (!giam()) G.fromTo(e, { x: 0 }, { keyframes: { x: [0, 10 * st.U, 0] }, duration: 0.26, delay: tre });
      }
    }
  }
  // ---- mau cau (cong thuc + giai thich)
  /** Cong thuc -> danh sach o: { loai:'chu'|'o'|'mui', t, cap, key, j, doc } */
  function oCongThuc(nh) {
    const d = nh.data || {};
    const fm = String(d.grammarFormula || (nh.beat && nh.beat.slide && nh.beat.slide.grammarFormula) || d.title || '');
    const ct = nh.congThuc;
    const out = [];
    if (ct && ct.phan && ct.phan.length) {
      let jc = 0, jo = 0;
      ct.phan.forEach((e) => {
        if (e.loai === 'chu') {
          out.push({ loai: 'chu', j: jc++, t: e.chu, cap: ngan(C.vaiTro(e.chu) || '', 20), key: true, doc: DOC_TRO[e.chu] || '', jp: true });
        } else {
          let t = String(e.nhan || '').replace(/[\-(（]+$/, '').trim();
          let cap = String(e.chu || '');
          if (!/[A-Za-z0-9぀-ヿ一-鿿]/.test(t)) { t = ngan(cap || 'N', 9); cap = ''; }
          if (kyTu(t).length > 9 && !RE_JP.test(t)) {
            // nhan tieng Viet dai: mot vai chu dau lam nhan o, phan con lai xuong chu thich
            let t2 = '';
            for (const w of t.split(/[\s/]+/)) { if (kyTu((t2 + ' ' + w).trim()).length > 9) break; t2 = (t2 + ' ' + w).trim(); }
            if (!t2) t2 = ngan(t.split(/[\s/]+/)[0], 9);
            cap = ngan((t.slice(t2.length).replace(/^[\s/]+/, '') + (cap ? ' · ' + cap : '')).trim(), 40);
            t = t2;
          }
          out.push({ loai: 'o', j: jo++, t: ngan(t, 9), cap: ngan(cap, 40), key: false, jp: RE_JP.test(t) });
        }
      });
      return out;
    }
    const fm2 = fm.replace(/[「」『』]/g, '');
    let parts = fm2.split(/\s*[+＋]\s*/).map((s) => s.trim()).filter(Boolean);
    let mui = false;
    if (parts.length < 2) {
      const ar = fm2.split(/\s*[→⇒]\s*/).map((s) => s.trim()).filter(Boolean);
      if (ar.length >= 2) { parts = ar; mui = true; }
    }
    if (parts.length < 2) {
      const cm = fm2.replace(/\[[^\]]*\]/g, (b0) => b0.replace(/[、,]/g, '\u0001')).split(/\s*[、,]\s*/).map((x) => x.replace(/\u0001/g, ',').trim()).filter(Boolean);
      if (cm.length >= 2 && cm.length <= 6) parts = cm;
    }
    if (parts.length < 2) {
      const sp = fm2.split(/\s*[・｜|／/]\s*/).map((s) => s.trim()).filter(Boolean);
      if (sp.length >= 2 && sp.every((s) => kyTu(s).length <= 16)) parts = sp;
    }
    if (!parts.length) parts = [fm2 || d.title || ''];
    let jj = 0;
    parts.forEach((p, i) => {
      const [main0, note] = tachNgoac(p);
      let main = (main0 || p).replace(/^\[|\]$/g, '').replace(/\s{2,}/g, ' ').trim();
      const laJp = RE_JP.test(main) && !/^[A-Za-z]/.test(main);
      let capX = note || '';
      if (!laJp && kyTu(main).length > 12) {
        const ws = main.split(/[\s/]+/);
        let t2 = '';
        for (const w of ws) { if (kyTu((t2 + ' ' + w).trim()).length > 12) break; t2 = (t2 + ' ' + w).trim(); }
        if (!t2) t2 = ngan(ws[0], 12);
        capX = ngan(main.slice(t2.length).replace(/^[\s/]+/, '') + (note ? ' · ' + note : ''), 40);
        main = t2;
      } else if (kyTu(main).length > 24) main = ngan(main, 24);
      if (i > 0 && mui) out.push({ loai: 'mui', t: '→' });
      out.push({ loai: laJp ? 'chu' : 'o', j: laJp ? jj++ : i, t: main, cap: ngan(capX, 40), key: laJp, doc: DOC_TRO[main] || '', jp: laJp, p: true });
    });
    return out;
  }
  function uocRong(tiles, fs, w, U) {
    const gap = 0.16 * fs, pad = 0.5 * fs;
    let rows = 1, x = 0;
    tiles.forEach((t) => {
      const lb = t.loai === 'o' && !t.jp && kyTu(t.t).length > 3;
      const wi = t.loai === 'mui' ? fs * 0.7 : lb ? (em(t.t) * 0.96 * fs + pad) * 0.6 : em(t.t) * fs * (t.loai === 'chu' ? 1.02 : 0.96) + pad;
      if (x > 0 && x + wi > w) { rows++; x = 0; }
      x += wi + gap;
    });
    return rows;
  }
  function layNguPhap(hF, coHai, frG2) {
    const { W, Yb, Yc } = st;
    const t = Math.round(W * (st.dt ? 0.022 : 0.008));
    if (st.dt) {
      const yG = Math.round(Yb * (1 - (frG2 || 0.27)));
      const lF = dN(hF + t, hF - t), l2 = dN(yG - t * 0.5, yG + t * 0.5);
      return { F: cell([lF], [W / 2, 10], Yb), G1: cell([lF, l2], [W / 2, (hF + yG) / 2], Yb), G2: cell([l2], [W / 2, Yb - 10], Yb), G3: null };
    }
    const lF = dN(hF + t, hF - t);
    const xm = W * (coHai ? 0.5 : 0.62), s = W * 0.018;
    const lV = dV(xm + s, xm - s);
    return {
      F: cell([lF], [W / 2, 10], Yb),
      G1: cell([lF, lV], [10, Yb - 10], Yb),
      G2: cell([lF, lV, dCot()], [xm + 40, Yb - 10], Yb),
      G3: hF < Yc - 80 ? cell([lF, dCot()], [W - 10, Yc - 10], Yc) : null,
    };
  }
  const soMauCau = (nh) => {
    const ds = ((nh.ctx && nh.ctx.cacNhip) || []).filter((b) => b && b.kind === 'grammar-intro');
    const k = ds.indexOf(nh.beat);
    return { i: k >= 0 ? k + 1 : (nh.beat && nh.beat.subIndex) || 1, n: ds.length || 1 };
  };
  const tenMau = (d) => {
    const tieu = String(d.title || '').replace(/^\d+\.\s*/, '');
    const k = tieu.indexOf(':');
    return k > 0 ? [tieu.slice(0, k).trim(), tieu.slice(k + 1).trim()] : [tieu, ''];
  };
  function dungNguPhap(nh, api, m, T, opt) {
    opt = opt || {};
    const d = nh.data || {};
    const tiles = oCongThuc(nh);
    const so = soMauCau(nh);
    const pd = pad0();
    const U = st.U;
    // chon co chu o + so hang -> chieu cao o cong thuc
    const wF = st.W - 2 * st.mx;
    const nTile = tiles.filter((t) => t.loai !== 'mui').length;
    let fs0 = st.dt ? (nTile <= 2 ? 84 : nTile <= 3 ? 56 : nTile <= 5 ? 46 : 40) : (nTile <= 3 ? 190 : nTile <= 4 ? 160 : nTile <= 6 ? 128 : 110);
    fs0 *= st.dt ? 1 : U;
    const capH = sz(36, 20);
    const hMax = st.Yb * (st.dt ? 0.4 : 0.5);
    const tagH = sz(46, 30);
    let rows = uocRong(tiles, fs0, wF, U);
    while ((rows * (1.34 * fs0 + capH) + tagH + st.my + Math.round(pd * 0.5) > hMax) && fs0 > sz(110, 28)) { fs0 -= sz(8, 3); rows = uocRong(tiles, fs0, wF, U); }
    let hF = Math.round(clamp(rows * (1.34 * fs0 + capH) + tagH + st.my + Math.round(pd * 0.5), st.Yb * (st.dt ? 0.3 : 0.36), st.dt ? st.Yb * 0.58 : st.Yb * 0.8));
    if (!opt.hF) hF = Math.round(st.Yb * (st.dt ? 0.58 : 0.8));   // luot 1: F hao phong de do co chu that
    if (opt.hF) hF = opt.hF;
    const coHai = !!(d.teacherTips || d.culturalNotes);
    const lenE = String(d.explanation || '').length, lenT = String(d.teacherTips || '').length + String(d.culturalNotes || '').length;
    let frG2 = lenT ? clamp(0.14 + 0.62 * lenT / (lenE + lenT + 1), 0.22, 0.5) : 0.22;
    if (st.dt) frG2 = clamp(Math.min(frG2, (st.Yb - hF - 118) / st.Yb), 0.16, 0.5);
    const lay = layNguPhap(hF, coHai, frG2);
    if (rows >= 2 && !st.dt) T.el.style.setProperty('--j-cf', 'calc(var(--j-u) * 22)');
    const F = addCell(T, 'F', lay.F);
    const G1 = addCell(T, 'G1', lay.G1);
    const G2 = addCell(T, 'G2', lay.G2);
    const G3 = lay.G3 ? addCell(T, 'G3', lay.G3) : null;
    // ---- F: tieu de + cac o cong thuc
    const crF = crOf(F.poly, pd);
    veLopNet(F, crF, 41, st.dt ? 56 : 130, null, 0.008);
    const wFc = nhet(F, crF, 'j-nf');
    const [ten, cong] = tenMau(d);
    void cong;
    const tag = h('div', 'j-tagrow', wFc, `${the('MẪU CÂU ' + so.i)}<b class="j-tenmau">${jp(ngan(ten, st.dt ? 20 : 34))}</b>`);
    const box = h('div', 'j-tiles', wFc);
    m.tiles = tiles;
    m.tChu = []; m.tO = []; m.tJp = []; m.tAll = [];
    box.innerHTML = tiles.map((t, i) => {
      if (t.loai === 'mui') return `<div class="j-mui" lang="ja">${esc(t.t)}</div>`;
      if (t.loai === 'chu') m.tChu[t.j] = i; else m.tO[t.j] = i;
      if (t.jp) m.tJp.push(i);
      m.tAll.push(i);
      const dax = m.rev.has('t' + i);
      return `<div class="j-tw" data-t="${i}"><div class="j-tile${t.key ? ' k' : ''}${t.loai === 'o' && !t.jp && kyTu(t.t).length > 3 ? ' lb' : ''}${dax ? '' : ' pend'}"${t.jp ? ' lang="ja"' : ''}>${t.key && !st.dt && kyTu(t.t).length <= 3 ? `<span class="j-tile-bst"></span>` : ''}<span class="j-tile-t">${esc(t.t)}</span></div>${t.cap ? `<div class="j-cap">${esc(t.cap)}</div>` : ''}${t.doc ? `<div class="j-sfx wa${m.rev.has('c' + i) ? '' : ' j-cho'}" data-doc="${i}"><span data-t="${esc(t.doc)}!">${esc(t.doc)}!</span></div>` : ''}</div>`;
    }).join('');
    // khung o cong thuc: rong = crF.w, cao = crF.h - tagH
    box.style.marginTop = tagH + 'px';
    if (opt.fs) box.style.fontSize = opt.fs + 'px';
    else {
      // luot 1: co chu lon nhat (<= fs0, >= 110) sao cho hang cong thuc <= nua trang; khong duoc thi giu 110
      const hBox = hMax - (tagH + st.my + Math.round(pd * 0.5));
      const fmin = sz(110, 28);
      box.style.width = Math.floor(crF.w) + 'px';
      let f = fs0, xong = false;
      for (let i = 0; i < 30 && !xong; i++) {
        box.style.fontSize = f + 'px';
        if (box.scrollWidth <= crF.w + 0.6 && box.scrollHeight <= hBox + 0.6) xong = true; else if (f <= fmin) break; else f = Math.max(fmin, f * 0.93);
      }
      if (!xong) { box.style.fontSize = fmin + 'px'; if (box.scrollWidth > crF.w + 0.6) fitBox(box, crF.w, 9999, fmin, sz(36, 20)); }
      const can = Math.round(box.scrollHeight + tagH + st.my + Math.round(pd * 0.5));
      T.capO.textContent = ''; T.vsvg.textContent = ''; T.cells = {};
      return dungNguPhap(nh, api, m, T, Object.assign({}, opt, { hF: Math.min(Math.round(st.Yb * 0.84), Math.max(can, Math.round(st.Yb * 0.26))), fs: parseFloat(box.style.fontSize) }));
    }
    // ---- G1: giai thich
    const crG1 = crOf(G1.poly, { t: Math.round(pd * 0.3), b: Math.round(pd * 0.3), l: Math.round(pd * 0.8), r: Math.round(pd * 0.8) });
    const wG1 = nhet(G1, crG1, 'j-g1');
    h('div', 'j-tagrow', wG1, the('Ý NGHĨA'));
    const cau = String(d.explanation || '').split(/(?<=[.!?。])\s+/).filter(Boolean);
    m.cau = cau;
    const gt = h('div', 'j-giai', wG1, cau.map((s, k) => `<span class="j-cau" data-s="${k}">${jp(s)} </span>`).join(''));
    wG1.style.paddingTop = sz(42, 32) + 'px';
    const hG1 = crG1.h - sz(42, 32);
    fitBox(gt, crG1.w, hG1, sz(34, 18), sz(20, 15));
    if (gt.scrollHeight > hG1 + 1 || gt.scrollWidth > crG1.w + 1) {
      // qua dai: giu chu >= 20 (may) bang cach bo bot cau cuoi (Sensei van noi day du), khong thu nho duoi 20
      const sp = [...gt.querySelectorAll('.j-cau')];
      gt.style.fontSize = sz(20, 15) + 'px';
      for (let k = sp.length - 1; k > 0 && gt.scrollHeight > hG1 + 1; k--) sp[k].style.display = 'none';
      if (gt.scrollHeight > hG1 + 1 && sp[0]) {
        let txt = kyTu(cau[0] || '');
        while (txt.length > 12 && gt.scrollHeight > hG1 + 1) { txt = txt.slice(0, Math.floor(txt.length * 0.9)); sp[0].innerHTML = jp(txt.join('').replace(/[\s,;、]+$/, '') + '…') + ' '; }
      }
    }
    // ---- G2: luu y + van hoa (hoac vi du nhanh)
    const crG2 = crOf(G2.poly, Math.round(pd * 0.8));
    const wG2 = nhet(G2, crG2, 'j-g2');
    const blocks = [];
    if (d.teacherTips) blocks.push(`<div class="j-luuy" data-b="G5"><p><b class="j-mo">LƯU Ý</b> ${jp(d.teacherTips)}</p></div>`);
    if (d.culturalNotes) blocks.push(`<div class="j-vanhoa" data-b="G6"><p><b class="j-mo j-mo-den">VĂN HOÁ</b> ${jp(d.culturalNotes)}</p></div>`);
    let vd = null;
    if (!blocks.length) {
      const ex = nh.beat && nh.beat.slide && nh.beat.slide.examples && nh.beat.slide.examples[0];
      if (ex) {
        const ns = nhomTok(ex.tokens || []);
        vd = `<div class="j-vdnhanh"><b class="j-mo j-mo-den">VÍ DỤ</b><div class="j-vdn-c">${ns.map((g, k) => tokSpan(g, k)).join('')}</div><div class="j-vdn-n">${esc(ex.meaningVi || '')}</div></div>`;
        blocks.push(vd);
      }
    }
    const stack = h('div', 'j-g2-st', wG2, blocks.join(''));
    const its = [...stack.children].map((el) => ({ el, fmax: sz(30, 17), fmin: sz(14, 13) }));
    if (its.length) fitStack(its, crG2.w, crG2.h, sz(14, 8));
    // van tran o co toi thieu: cat bot chu cua khoi dai nhat (them ...) — khong ha duoi 14 / 13 px
    for (let g = 0; g < 40 && stack.scrollHeight > crG2.h + 1; g++) {
      const ps = [...stack.querySelectorAll('p')].filter((p) => p.dataset.goc == null || kyTu(p.dataset.txt || '').length > 14);
      if (!ps.length) break;
      ps.forEach((p) => { if (p.dataset.txt == null) { p.dataset.txt = p.textContent; } });
      const p = ps.sort((a, b2) => b2.textContent.length - a.textContent.length)[0];
      const tag = p.querySelector('b'), tagT = tag ? tag.textContent : '';
      const body = kyTu(p.textContent.slice(tagT.length).trim());
      const nb = body.slice(0, Math.max(8, Math.floor(body.length * 0.88))).join('').replace(/[\s,;、—-]+$/, '') + '…';
      p.innerHTML = (tag ? tag.outerHTML + ' ' : '') + jp(nb);
      p.dataset.goc = '1';
    }
    // ---- G3: dem mau cau (cot meo)
    if (G3) {
      const crG3 = crOf(G3.poly, Math.round(pd * 0.7));
      veLopNet(G3, crG3, 12, 60);
      const w3 = nhet(G3, crG3, 'j-vd');
      h('div', 'j-dem-lon', w3, `<b>${so.i}</b><i>/ ${so.n}</i>`);
      w3.firstElementChild.style.fontSize = f1(Math.min(crG3.h * 0.85, sz(120, 40))) + 'px';
    }
    oVao(T, ['F', 'G1', 'G2'].concat(G3 ? ['G3'] : []), opt.tre || 0, 0.06);
    m.fase = 'np';
    camTuc(T, F.cx, F.cy);
    if (!opt.ngay) {
      m.hDuPhong = api.hen(() => tilesDuPhong(m), 2300);
    }
  }
  /** Hien o cong thuc thu i (dap xuong <= 200 ms); key: nen vu no den phia sau */
  function tileVao(m, i, tre) {
    const T = m.T;
    if (!T || m.rev.has('t' + i)) return false;
    m.rev.add('t' + i);
    const tw = T.el.querySelector(`.j-tw[data-t="${i}"]`);
    if (!tw) return false;
    const tile = tw.querySelector('.j-tile');
    tile.classList.remove('pend');
    const tx = tile.querySelector('.j-tile-t');
    if (giam()) { G.fromTo(tile, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, delay: tre || 0 }); return true; }
    G.fromTo(tile, { scale: 1.5 }, { scale: 1, duration: 0.2, ease: 'expo.out', delay: tre || 0 });
    G.fromTo(tx, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05, ease: 'none', delay: tre || 0 });
    const b = tile.querySelector('.j-tile-bst');
    if (b) {
      if (!b.firstChild) {
        const r = tile.getBoundingClientRect();
        const w = Math.round(tile.offsetWidth * 1.2), hh = Math.round(tile.offsetHeight * 1.1);
        b.innerHTML = burstSvg(w, hh, 100 + i, { n: 14, jit: 0.34, trong: 0.66, nen: '#141414', vien: 1 });
        b.style.width = w + 'px'; b.style.height = hh + 'px';
        b.style.left = f1((tile.offsetWidth - w) / 2) + 'px'; b.style.top = f1((tile.offsetHeight - hh) / 2) + 'px';
        void r;
      }
      G.fromTo(b, { scale: 0.3, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.24, ease: 'back.out(2)', delay: tre || 0 });
    }
    return true;
  }
  function tilesDuPhong(m) {
    let k = 0;
    (m.tAll || []).forEach((i) => { if (tileVao(m, i, k * 0.22)) k++; });
  }
  function cueNguPhap(m, id, tt) {
    const T = m.T;
    if (!T || m.fase !== 'np') return;
    const tre = tt ? m.api.tre(tt) : 0;
    let x;
    const tim = (arr, j) => (arr ? arr[j] : undefined);
    if (id === 'G0') {
      nhan(T, 'F', tre, 1.015);
      m.api.hen(() => tilesDuPhong(m), 1200);   // khong huy hen 2.3 s cua luc vao nhip: cai nao toi truoc thi hien
      return;
    }
    let i;
    if ((x = /^G2\.(\d+)$/.exec(id))) i = tim(m.tChu, +x[1]);
    else if ((x = /^G3\.(\d+)$/.exec(id))) i = tim(m.tO, +x[1]);
    else if ((x = /^G2p\.(\d+)$/.exec(id))) i = tim(m.tJp, +x[1]);
    if (i != null) {
      // cac o dung truoc chua hien (Sensei noi nhay coc) -> hien theo thu tu
      (m.tAll || []).filter((k) => k < i).forEach((k) => tileVao(m, k, tre));
      tileVao(m, i, tre);
      camDen(T, 'F', tre);
      nhan(T, 'F', tre, 1.012);
      if (!giam()) rung(T.cells.F.noi, tre + 0.08, 4 * st.U);
      return;
    }
    if ((x = /^G2c\.(\d+)$/.exec(id))) {
      const k = tim(m.tChu, +x[1]);
      if (k != null) {
        m.rev.add('c' + k);
        const e = T.el.querySelector(`.j-sfx.wa[data-doc="${k}"]`);
        if (e) { e.classList.remove('j-cho'); hieu(e, tre, 'nay'); }
        tileVao(m, k, tre);
        camDen(T, 'F', tre);
      }
      return;
    }
    if (/^GM\.\d+$/.test(id)) { tieuDiem(T, 'F', tre, 1.015); return; }
    if ((x = /^G4\.(\d+)$/.exec(id))) {
      tilesDuPhong(m);
      const e = T.el.querySelector(`.j-cau[data-s="${x[1]}"]`);
      T.el.querySelectorAll('.j-cau.on').forEach((z) => z.classList.remove('on'));
      if (e) { e.classList.add('on'); danhDau(e, tre); }
      tieuDiem(T, 'G1', tre, 1.012);
      return;
    }
    if (id === 'G5') { tilesDuPhong(m); tieuDiem(T, 'G2', tre, 1.02); const e = T.el.querySelector('.j-luuy'); if (e) danhDau(e.querySelector('p'), tre); return; }
    if (id === 'G6') { tilesDuPhong(m); tieuDiem(T, 'G2', tre, 1.02); const e = T.el.querySelector('.j-vanhoa'); if (e) danhDau(e.querySelector('p'), tre); }
  }
  // ---- cau (vi du / giang ky mot cau hoi thoai): bong thoai lon + nghia + anh
  const tachTen = (sp) => {
    const s = String(sp || '').trim();
    const mm = /^(.*?)\s*[(（]([^)）]+)[)）]\s*$/.exec(s);
    return mm ? { jp: mm[1].trim(), la: mm[2].trim() } : { jp: s, la: '' };
  };
  function uocDongTok(gs, fs, w) {
    const gap = 0.16 * fs;
    let rows = 1, x = 0;
    gs.forEach((g) => {
      const wi = em(g.chu) * fs * 1.02 + 0.08 * fs;
      if (x > 0 && x + wi > w) { rows++; x = 0; }
      x += wi + gap;
    });
    return rows;
  }
  function layCau(xaF, hSF, coAnh) {
    const { W, Yb, Yc } = st;
    const s = W * 0.02;
    if (st.dt) {
      const yA = Math.round(Yb * (coAnh ? 0.24 : 0.02)), yS = Math.round(Yb * (hSF || 0.71)), t = Math.round(W * 0.026);
      const o = {};
      const l2 = dN(yS + t * 0.6, yS - t * 0.6);
      if (coAnh) {
        const l1 = dN(yA - t, yA + t);
        o.A = cell([l1], [W / 2, 10], Yb);
        o.S = cell([l1, l2], [W / 2, (yA + yS) / 2], Yb);
      } else o.S = cell([l2], [W / 2, 10], Yb);
      o.M = cell([l2], [W / 2, Yb - 10], Yb);
      o.K = null;
      return o;
    }
    const xa = W * xaF, hS = Math.round(Yb * hSF);
    const l1 = dV(xa + s, xa - s), lM = [xa - s, hS + W * 0.008, W, hS - W * 0.008];
    const cuts1 = xaF > 0 ? [l1] : [];
    return {
      A: xaF > 0 ? cell([l1], [10, 10], Yb) : null,
      S: cell(cuts1.concat([lM]), [W - 10, 10], Yb),
      M: cell(cuts1.concat([lM, dCot()]), [xa + 40, Yb - 10], Yb),
      K: cell(cuts1.concat([lM, dCot()]), [W - 10, Yc - 10], Yc),
    };
  }
  /** Chon ti le anh / chieu cao o cau de cau dai van vua >= 84 px */
  function chonLayCau(gs, coAnhMuon, kw) {
    const { W, Yb } = st;
    if (st.dt) return { xaF: coAnhMuon ? 1 : 0, hSF: clamp(0.71 - (String((st.nh && st.nh.data && st.nh.data.meaningVi) || '').length - 40) * 0.0022, 0.64, 0.71) };
    const U = st.U, fs = 84 * U, pd = pad0();
    const cands = kw ? [[0.28, 0.66], [0.24, 0.68], [0.22, 0.7]] : (coAnhMuon ? [[0.28, 0.64], [0.2, 0.66], [0.12, 0.69], [0, 0.71]] : [[0.12, 0.66], [0, 0.7]]);
    let pick = cands[cands.length - 1];
    for (const cd of cands) {
      const wTok = (W - st.mx) - (W * cd[0] + W * 0.02 + pd) - 2 * 30 * U;
      const rows = uocDongTok(gs, fs, wTok);
      const hNeed = rows * 1.3 * fs + 30 * U + 20 * U + 22 * U;
      if (hNeed <= Yb * cd[1] - st.my - pd) { pick = cd; break; }
    }
    return { xaF: pick[0], hSF: pick[1] };
  }
  function dungCau(nh, api, m, T, opt, kw) {
    opt = opt || {};
    const d = nh.data || {};
    const toks = d.tokens || [];
    const gs = nhomTok(toks);
    m.gs = gs;
    m.gOf = {};
    gs.forEach((g, k) => g.idx.forEach((i) => { m.gOf[i] = k; }));
    const pd = pad0();
    const tt = kw ? tachTen(d.speaker) : null;
    // anh
    let url = null;
    if (kw) url = d.avatarUrl || (nh.bai && nh.bai.sceneImageUrl) || null;
    else url = C.anhCau(toks, nh.bai) || (nh.bai && nh.bai.sceneImageUrl) || null;
    const cl = chonLayCau(gs, true, kw);
    const lay = layCau(cl.xaF, cl.hSF, true);
    const A = lay.A ? addCell(T, 'A', lay.A, { bg: '#eee9e0' }) : null;
    const S = addCell(T, 'S', lay.S);
    const M = addCell(T, 'M', lay.M);
    const kCao = lay.K ? (bbox(lay.K).y1 - Math.max(0, bbox(lay.K).y0)) : 0;
    const K = lay.K && kCao >= sz(64, 40) ? addCell(T, 'K', lay.K) : null;
    // ---- A: anh (avatar) + ten nhan vat
    if (A) {
      const key = toks.find((t) => t.isKeyGrammar) || toks[0] || {};
      const vxA = Math.max(0, A.bb.x0), vyA = Math.max(0, A.bb.y0) + (st.dt ? st.my - 12 : 0), tSl = Math.round(st.W * 0.026);
      const vhA = Math.min(st.Yb, A.bb.y1) - vyA - (st.dt ? tSl + 4 : 0);
      const sqA = Math.round(Math.min(vhA, st.dt ? 118 * st.U : 9999));
      datAnh(A, null, url, kw && st.dt ? { pos: '50% 30%', thay: '', ht: 'ht-duoi', chua: true, rect: { x: vxA + st.mx * 0.5, y: vyA + (vhA - sqA) / 2, w: sqA, h: sqA } } : { pos: kw ? '50% 30%' : '50% 38%', thay: chuTok(key).slice(0, 2), ht: 'ht-duoi' });
      if (kw && st.dt) {
        const crA = crOf(A.poly, Math.round(pd * 0.6));
        const x0 = Math.max(crA.x, vxA + st.mx * 0.5 + sqA + sz(10, 10));
        const bx = nhet(A, { x: x0, y: crA.y, w: Math.max(80, crA.x + crA.w - x0), h: crA.h }, 'j-ghi-anh');
        bx.style.justifyContent = 'center'; bx.style.alignItems = 'flex-start';
        const ten = h('div', 'j-plate', bx, `<b lang="ja">${esc(tt.jp)}</b>${tt.la ? `<i>${esc(tt.la)}</i>` : ''}${d.speakerRole && !/^person/i.test(d.speakerRole) ? `<u>${esc(ngan(d.speakerRole, 20))}</u>` : ''}`);
        fitBox(ten, bx.offsetWidth, crA.h, sz(44, 24), sz(20, 14));
      } else if (kw) {
        const crA = crOf(A.poly, Math.round(pd * 0.7));
        const wPl = Math.max(crA.w, Math.min(sz(420, 240), (A.bb.x1 - crA.x) - sz(60, 30)));
        const bx = nhet(A, { x: crA.x, y: crA.y, w: wPl, h: crA.h }, 'j-ghi-anh');
        bx.style.justifyContent = 'flex-end'; bx.style.alignItems = 'flex-start';
        const ten = h('div', 'j-plate', bx, `<b lang="ja">${esc(tt.jp)}</b>${tt.la ? `<i>${esc(tt.la)}</i>` : ''}${d.speakerRole && !/^person/i.test(d.speakerRole) ? `<u>${esc(ngan(d.speakerRole, 20))}</u>` : ''}`);
        fitBox(ten, wPl, Math.round(crA.h * 0.34), sz(44, 22), sz(20, 13));
      }
    }
    // ---- S: bong thoai chua token (+ romaji)
    const crS = crOf(S.poly, pd);
    veLopNet(S, crS, 51, st.dt ? 50 : 130, null, 0.008);
    const wS = nhet(S, crS, 'j-cs');
    const duoi = sz(22, 14);
    const bh = Math.floor(crS.h - duoi);
    const bong = h('div', 'j-bong-x', wS);
    bong.style.width = Math.floor(crS.w) + 'px'; bong.style.height = bh + 'px';
    bong.innerHTML = bongSvg(crS.w, bh, sz(60, 26), { bx: Math.min(crS.w * 0.16, sz(140, 60)), bw: sz(70, 32), tx: Math.max(0, Math.min(crS.w * 0.16, sz(140, 60)) - sz(90, 34)), ty: bh + duoi }, Math.max(3, Math.round(st.bw * 0.85)));
    const bpad = sz(22, 12);
    const inn = h('div', 'j-bong-in', bong);
    inn.style.left = bpad + 'px'; inn.style.top = bpad * 0.4 + 'px'; inn.style.width = f1(crS.w - bpad * 2) + 'px'; inn.style.height = f1(bh - bpad * 0.8) + 'px';
    const toksBox = h('div', 'j-toks', inn, gs.map((g, k) => tokSpan(g, k)).join(''));
    const rom = h('div', 'j-roma', inn, esc(romajiCau(toks)));
    rom.lang = 'en';
    const fminC = kw ? sz(84, 28) : sz(84, 28);
    const wIn = inn.clientWidth || (crS.w - bpad * 2);
    const hIn = inn.clientHeight || (bh - bpad * 0.8);
    fitStack([{ el: toksBox, fmax: sz(160, 60), fmin: fminC }, { el: rom, fmax: sz(30, 15), fmin: sz(20, 14) }], wIn, hIn, sz(10, 5));
    if (toksBox.scrollHeight + rom.offsetHeight + sz(10, 5) > hIn + 1 || toksBox.scrollWidth > wIn + 1) {
      // cau qua dai: bo dong romaji de giu chu cau >= 84 px (neu van tran thi ha xuong)
      rom.style.display = 'none';
      fitMin(toksBox, wIn, hIn, sz(160, 60), fminC, sz(60, 24));
    }
    canBang(toksBox, wIn);
    // ---- M: nghia
    const crM = crOf(M.poly, Math.round(pd * 0.8));
    const wM = nhet(M, crM, 'j-cm');
    h('div', 'j-tagrow', wM, the('NGHĨA'));
    const chua = !m.rev.has(kw ? 'F4' : 'E5');
    const khoaN = kw ? 'F4' : 'E5';
    const ng = h('div', 'j-nghia j-nghia-cau', wM, jp(d.meaningVi || ''));
    ng.setAttribute('data-cho', khoaN); ng.dataset.fx = 'len';
    if (chua) ng.classList.add('j-cho');
    wM.style.paddingTop = sz(40, 28) + 'px';
    const qm = h('div', 'j-qm j-qm-nho', wM, '？');
    qm.lang = 'ja';
    if (!chua) qm.style.display = 'none';
    fitMin(ng, crM.w, crM.h - sz(40, 28), sz(64, 34), sz(44, 28), sz(24, 16));
    m.qm = qm;
    // ---- K: dem vi du / nhan vat
    if (K) {
      const crK = crOf(K.poly, Math.round(pd * 0.3));
      veLopNet(K, crK, 13, 60);
      const wK = nhet(K, crK, 'j-vd');
      let so1 = '1', so2 = '1';
      if (kw) { const c = nh.chuong || {}; so1 = String(c.i || 1); so2 = String(c.n || 1); } else { const mm = /(\d+)\s*\/\s*(\d+)\s*$/.exec(String((nh.beat && nh.beat.label) || '')); if (mm) { so1 = mm[1]; so2 = mm[2]; } }
      const hang = h('div', 'j-k-hang', wK, `${the(kw ? 'GIẢNG KỸ' : 'VÍ DỤ')}<b class="j-dem-nho">${so1}<i>/${so2}</i></b>`);
      hang.style.fontSize = sz(22, 13) + 'px';
    }
    oVao(T, ['A', 'S', 'M', 'K'].filter((k) => T.cells[k]), opt.tre || 0, 0.06);
    m.fase = 'cau';
    camTuc(T, S.cx, S.cy);
    if (!opt.ngay && chua) m.hNghia = api.hen(() => cueCau(m, kw ? 'F4' : 'E5', null), 4600);
    // dat lai to sang neu dang giua karaoke
    if (m.tokOn != null) batTok(m, m.tokOn, true);
  }
  function batTok(m, k, ngay) {
    if (!m.T) return;
    const bs = m.T.el.querySelectorAll('.j-tok.on');
    bs.forEach((e) => e.classList.remove('on'));
    const e = m.T.el.querySelector(`.j-tok[data-g="${k}"]`);
    m.tokOn = k;
    if (!e) return;
    e.classList.add('on');
    if (!ngay && !giam()) G.fromTo(e, { y: 0 }, { keyframes: { y: [0, -8 * st.U, 0] }, duration: 0.22, ease: 'power2.out', overwrite: false });
  }
  function karaokeCau(m, ds) {
    const api = m.api;
    if (!m.T || !ds) return;
    if (m.tlK) { try { m.tlK.kill(); } catch (e) {} }
    const tl = api.tl();
    m.tlK = tl;
    ds.forEach((x) => {
      const k = m.gOf ? m.gOf[x.i] : null;
      if (k == null) return;
      const t = api.treT(x.T);
      if (tl) tl.call(() => { if (m.vivo && m.T) batTok(m, k); }, null, t);
      else api.hen(() => { if (m.vivo && m.T) batTok(m, k); }, Math.round(t * 1000));
    });
  }
  function cueCau(m, id, tt) {
    const T = m.T;
    if (!T || m.fase !== 'cau') return;
    const tre = tt ? m.api.tre(tt) : 0;
    const kw = m.nh.kind === 'kaiwa';
    let x;
    if (id === 'E0' || id === 'F1') { nhan(T, 'S', tre, 1.012); return; }
    if (id === 'E1' || id === 'E2' || id === 'E2b' || id === 'F2') { camDen(T, 'S', tre); nhan(T, 'S', tre, 1.012); return; }
    if (id === 'E5' || id === 'F4') {
      if (m.hNghia != null) m.api.huyHen(m.hNghia);
      hienKhoa(m, id, tre);
      if (m.qm) { if (giam()) m.qm.style.display = 'none'; else G.to(m.qm, { autoAlpha: 0, scale: 0.4, duration: 0.14, delay: tre, onComplete: () => { m.qm.style.display = 'none'; } }); }
      tieuDiem(T, 'M', tre, 1.02);
      return;
    }
    if ((x = /^E4\.(\d+)$/.exec(id))) {
      const k = m.gOf ? m.gOf[+x[1]] : null;
      const e = k != null ? T.el.querySelector(`.j-tok[data-g="${k}"]`) : null;
      if (e) { batTok(m, k); tokDoc(m, e, m.gs[k], tre); }
      camDen(T, 'S', tre);
      return;
    }
    if ((x = /^F3\.(\d+)$/.exec(id))) {
      const ks = m.gs.map((g, k) => (g.key ? k : -1)).filter((k) => k >= 0);
      const k = ks[+x[1]];
      const e = k != null ? T.el.querySelector(`.j-tok[data-g="${k}"]`) : null;
      if (e) { batTok(m, k); tokDoc(m, e, m.gs[k], tre); }
      camDen(T, 'S', tre); nhan(T, 'S', tre, 1.01);
      return;
    }
    if (/^E3/.test(id)) { nhan(T, 'S', tre, 1.01); }
  }
  /** Bong nho "wa!" canh token tro tu (cach doc) */
  function tokDoc(m, e, g, tre) {
    const doc = DOC_TRO[g.chu];
    if (!doc || e.querySelector('.j-tok-doc')) return;
    const p = h('i', 'j-tok-doc', e, esc(doc) + '!');
    if (giam()) return;
    G.fromTo(p, { scale: 0.3, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3, ease: 'back.out(2.4)', delay: tre || 0 });
  }
  // ---- hoi thoai: gioi thieu (kaiwa-intro) + nghe tron doan (kaiwa-run)
  function vaiCua(ds) {
    const out = [];
    (ds || []).forEach((l) => {
      if (!l) return;
      const t = tachTen(l.speaker);
      if (!out.find((x) => x.jp === t.jp)) out.push({ jp: t.jp, la: t.la, anh: l.avatarUrl || '', role: l.speakerRole || '' });
    });
    return out;
  }
  function layHoiThoai(n) {
    const { W, Yb, Yc } = st;
    const s = W * 0.02;
    if (st.dt) {
      const yA = Math.round(Yb * 0.2), yB = Math.round(Yb * 0.74), t = Math.round(W * 0.026);
      const l1 = dN(yA - t, yA + t), l2 = dN(yB + t * 0.6, yB - t * 0.6);
      const o = { A: cell([l1], [W / 2, 10], Yb), B: cell([l1, l2], [W / 2, (yA + yB) / 2], Yb) };
      const cols = Math.min(4, n);
      const y0 = yB;
      for (let p = 0; p < cols; p++) {
        const xl = W * p / cols, xr = W * (p + 1) / cols, sl = W * 0.02;
        const cuts = [l2];
        if (p > 0) cuts.push([xl + sl, 0, xl - sl, Yb]);
        if (p < cols - 1) cuts.push([xr + sl, 0, xr - sl, Yb]);
        o['P' + p] = cell(cuts, [(xl + xr) / 2, y0 + (Yb - y0) / 2], Yb);
      }
      return o;
    }
    const xa = W * 0.32, hB = Math.round(Yb * 0.64);
    const l1 = dV(xa + s, xa - s), l2 = [xa - s, hB + W * 0.008, W, hB - W * 0.008];
    const o = { A: cell([l1], [10, 10], Yb), B: cell([l1, l2], [W - 10, 10], Yb) };
    // hang nhan vat duoi: toi da 4; o thu 4 (neu co) o cot meo
    const wRow = Xc0() - xa;
    const nTrong = Math.min(n, 3);
    for (let p = 0; p < nTrong; p++) {
      const xl = xa + wRow * p / nTrong, xr = xa + wRow * (p + 1) / nTrong, sl = W * 0.012;
      const cuts = [l1, l2];
      if (p > 0) cuts.push([xl + sl, 0, xl - sl, Yb]);
      if (p < nTrong - 1) cuts.push([xr + sl, 0, xr - sl, Yb]); else cuts.push(dCot());
      o['P' + p] = cell(cuts, [(xl + xr) / 2, Yb - 20], Yb);
    }
    // cot meo: nhan vat thu 4 hoac tieu de
    o.K = cell([l1, l2, dCot()], [W - 10, Yc - 10], Yc);
    return o;
  }
  const Xc0 = () => st.Xc;
  function veNhanVat(m, c, v, gan) {
    const cr = crOf(c.poly, Math.round(pad0() * 0.7));
    veLopNet(c, cr, 60 + gan, 40);
    const w = nhet(c, cr, 'j-p');
    const hAv = Math.floor(Math.min(cr.h, cr.w * 0.62));
    const av = h('div', 'j-p-av', w);
    av.style.width = hAv + 'px'; av.style.height = hAv + 'px';
    if (v.anh) av.innerHTML = `<img src="${esc(v.anh)}" alt="" decoding="async" draggable="false" onerror="this.remove()">`;
    else av.innerHTML = `<span lang="ja">${esc(kyTu(v.jp)[0] || '?')}</span>`;
    const tn = h('div', 'j-p-ten', w, `<b lang="ja">${esc(v.jp)}</b>${v.la ? `<i>${esc(v.la)}</i>` : ''}`);
    const wTen = Math.max(40, cr.w - hAv - sz(14, 8));
    if (!st.dt && cr.w - hAv > Math.max(150, cr.w * 0.42)) { w.style.flexDirection = 'row'; w.style.gap = sz(14, 8) + 'px'; fitBox(tn, wTen, cr.h, sz(44, 20), sz(20, 13)); }
    else { w.style.flexDirection = 'column'; w.style.gap = '4px'; const hAv2 = Math.floor(Math.min(cr.h * 0.62, cr.w)); av.style.width = hAv2 + 'px'; av.style.height = hAv2 + 'px'; tn.style.textAlign = 'center'; tn.style.alignItems = 'center'; tn.style.whiteSpace = 'nowrap'; fitBox(tn, cr.w, cr.h - hAv2 - 6, sz(40, 20), sz(18, 14)); }
    return w;
  }
  /** Hien mot luot thoai trong bong thoai o B (tokens + nghia); bien doi khi doi luot */
  function hienLuot(m, line, i, tre, ngay) {
    const T = m.T;
    if (!T || !T.cells.B || !line) return;
    const B = T.cells.B;
    const cr = m.crB;
    if (m.luot) { const cu = m.luot; if (!ngay && !giam()) G.to(cu, { autoAlpha: 0, duration: 0.12, delay: tre || 0, onComplete: () => cu.remove() }); else cu.remove(); }
    const tt = tachTen(line.speaker);
    const gs = nhomTok(line.tokens || []);
    m.gs = gs; m.gOf = {};
    gs.forEach((g, k) => g.idx.forEach((ii) => { m.gOf[ii] = k; }));
    m.tokOn = null;
    const wrap = nhet(B, { x: cr.x, y: cr.y, w: cr.w, h: cr.h }, 'j-luot');
    const duoi = sz(30, 14);
    const bh = Math.floor(cr.h - duoi);
    const bong = h('div', 'j-bong-x', wrap);
    bong.style.width = Math.floor(cr.w) + 'px'; bong.style.height = bh + 'px';
    bong.innerHTML = bongSvg(cr.w, bh, sz(56, 24), { bx: Math.min(cr.w * 0.2, sz(150, 60)), bw: sz(64, 30), tx: Math.max(0, Math.min(cr.w * 0.2, sz(150, 60)) - sz(60, 20)), ty: bh + duoi }, Math.max(3, Math.round(st.bw * 0.85)));
    const bpad = sz(22, 10);
    const inn = h('div', 'j-bong-in', bong);
    inn.style.left = bpad + 'px'; inn.style.top = bpad * 0.5 + 'px'; inn.style.width = f1(cr.w - bpad * 2) + 'px'; inn.style.height = f1(bh - bpad) + 'px';
    const ten = h('div', 'j-luot-ten', inn, `<span class="j-the">${esc(tt.jp)}${tt.la ? ' · ' + esc(tt.la) : ''}</span><b>${(i != null ? (i + 1) : '')}${m.tong ? '/' + m.tong : ''}</b>`);
    const tb = h('div', 'j-toks', inn, gs.map((g, k) => tokSpan(g, k)).join(''));
    const ng = h('div', 'j-luot-nghia', inn, jp(ngan(line.meaningVi || '', 120)));
    const wIn2 = inn.clientWidth || (cr.w - bpad * 2);
    fitStack([{ el: tb, fmax: sz(110, 44), fmin: sz(60, 26) }, { el: ng, fmax: sz(38, 18), fmin: sz(20, 13) }], wIn2, (inn.clientHeight || (bh - bpad)) - ten.offsetHeight - sz(6, 3), sz(8, 4));
    canBang(tb, wIn2);
    m.luot = wrap;
    if (!ngay && !giam()) G.fromTo(wrap, { autoAlpha: 0, y: 14 * st.U }, { autoAlpha: 1, y: 0, duration: 0.24, ease: 'power3.out', delay: tre || 0 });
    // nhan vat dang noi
    const p = (m.vai || []).findIndex((v) => v.jp === tt.jp);
    T.el.querySelectorAll('.j-p.on').forEach((e) => e.classList.remove('on'));
    if (p >= 0) {
      const cp = T.cells['P' + p];
      if (cp) { cp.noi.querySelector('.j-p').classList.add('on'); if (!ngay) nhan(T, 'P' + p, tre, 1.04); }
      else if (T.cells.K && m.vai && m.vai[3] && p === 3) { T.cells.K.noi.querySelector('.j-p').classList.add('on'); }
    }
    if (!ngay) camDen(T, 'B', tre);
    m.luotI = i;
  }
  function dungHoiThoai(nh, api, m, T, opt) {
    opt = opt || {};
    const ds = Array.isArray(nh.data) ? nh.data : [];
    const run = nh.kind === 'kaiwa-run';
    const vai = vaiCua(ds).slice(0, 4);
    m.vai = vai; m.ds = ds; m.tong = ds.length;
    const pd = pad0();
    const lay = layHoiThoai(vai.length);
    const A = addCell(T, 'A', lay.A, { bg: '#eee9e0' });
    const B = addCell(T, 'B', lay.B);
    datAnh(A, null, (nh.bai && nh.bai.sceneImageUrl) || (vai[0] && vai[0].anh) || null, { pos: '50% 40%', thay: vai.map((v) => v.jp).join('・'), ht: 'ht-duoi' });
    const crB = crOf(B.poly, pd);
    veLopNet(B, crB, 61, st.dt ? 50 : 100);
    m.crB = { x: crB.x, y: crB.y + sz(50, 34), w: crB.w, h: crB.h - sz(50, 34) };
    const wB = nhet(B, crB, 'j-hb');
    h('div', 'j-tagrow', wB, `${the('HỘI THOẠI')}<b class="j-dem-nho">${run ? 'NGHE TRỌN ĐOẠN' : 'BỐI CẢNH'}</b>`);
    const ids = ['A', 'B'];
    for (let p = 0; p < 4; p++) {
      const c = lay['P' + p] ? addCell(T, 'P' + p, lay['P' + p]) : null;
      if (c && vai[p]) { veNhanVat(m, c, vai[p], p); ids.push('P' + p); }
    }
    if (lay.K) {
      const K = addCell(T, 'K', lay.K);
      if (vai[3] && !lay.P3) { veNhanVat(m, K, vai[3], 3); }
      else {
        const crK = crOf(K.poly, Math.round(pd * 0.7));
        veLopNet(K, crK, 14, 60);
        const wK = nhet(K, crK, 'j-vd');
        h('div', 'j-dem-lon', wK, `<b>${ds.length}</b><i>lượt</i>`);
        wK.firstElementChild.style.fontSize = f1(Math.min(crK.h * 0.8, sz(100, 40))) + 'px';
      }
      ids.push('K');
    }
    if (m.luotI != null && ds[m.luotI]) hienLuot(m, ds[m.luotI], m.luotI, 0, true);
    else {
      // ban dau: tom tat bong thoai — "n nhan vat, n luot"
      const tomTat = h('div', 'j-tomtat', wB);
      tomTat.style.paddingTop = sz(54, 36) + 'px';
      tomTat.style.height = Math.floor(crB.h) + 'px';
      tomTat.style.width = Math.floor(crB.w) + 'px';
      tomTat.style.boxSizing = 'border-box';
      tomTat.innerHTML = `<div class="j-tt-so"><b>${vai.length}</b><span>nhân vật</span></div><div class="j-tt-so"><b>${ds.length}</b><span>lượt thoại</span></div>`;
      { const f = Math.min(sz(200, 90), (crB.h - sz(54, 36)) * 0.55); tomTat.style.fontSize = f1(f) + 'px'; }
      m.tomTat = tomTat;
    }
    oVao(T, ids, opt.tre || 0, 0.06);
    m.fase = 'ht';
    camTuc(T, B.cx, B.cy);
  }
  function cueHoiThoai(m, id, tt) {
    const T = m.T;
    if (!T || m.fase !== 'ht') return;
    const tre = tt ? m.api.tre(tt) : 0;
    let x;
    if ((x = /^C1\.(\d+)$/.exec(id))) {
      const p = +x[1];
      const c = T.cells['P' + p] || (p === 3 ? T.cells.K : null);
      if (c) { camDen(T, c.id, tre); nhan(T, c.id, tre, 1.05); }
    } else if ((x = /^C2\.(\d+)$/.exec(id))) {
      const i = +x[1];
      const line = m.ds[i];
      if (line) {
        if (m.tomTat) { m.tomTat.style.display = 'none'; m.tomTat = null; }
        hienLuot(m, line, i, tre, false);
      }
    }
  }

  // ---- bai tap (quiz)
  const RE_TRONG = /_{2,}|＿{2,}|＿|＿＿/;
  function layQuiz() {
    const { W, Yb, Yc } = st;
    const s = W * 0.02;
    if (st.dt) {
      const yQ = Math.round(Yb * 0.36), t = Math.round(W * 0.026);
      const l1 = dN(yQ - t, yQ + t);
      return { Q: cell([l1], [W / 2, 10], Yb), S: cell([l1], [W / 2, Yb - 10], Yb), Z: null };
    }
    const xq = W * 0.42;
    const l1 = dV(xq + s, xq - s), l5 = [0, Yc, W, Yc];
    return {
      Q: cell([l1], [10, 10], Yb),
      S: cell([l1, l5], [W - 10, 10], Yc - gapY()),
      Z: cell([l1, l5, dCot()], [xq + 60, Yb - 10], Yb),
    };
  }
  function dungQuiz(nh, api, m, T, opt) {
    opt = opt || {};
    const q = nh.data || {};
    const opts = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
    const cauHoi = String(q.question || '').replace(/^\[(Dễ|Vừa|Khó)\]\s*/, '');
    const [goc, yc] = tachNgoac(cauHoi);
    const c = nh.chuong || {};
    const pd = pad0();
    const lay = layQuiz();
    const Q = addCell(T, 'Q', lay.Q, { bg: '#eee9e0' });
    const S = addCell(T, 'S', lay.S);
    const Z = lay.Z ? addCell(T, 'Z', lay.Z) : null;
    // ---- Q: anh + bong thoai cau hoi
    const jpc = String(goc).match(/[぀-ヿ一-鿿々ー]+/g);
    const url = C.anhCau(jpc ? jpc.map((x) => ({ text: x, kanji: x })) : [], nh.bai) || (nh.bai && nh.bai.sceneImageUrl) || null;
    const crQ = crOf(Q.poly, Math.round(pd * 0.8));
    const hBong = Math.floor(crQ.h * (st.dt ? 0.9 : 0.62));
    {
      const vx0 = Math.max(0, Q.bb.x0), vx1 = Math.min(st.W, Q.bb.x1);
      const y0 = crQ.y + hBong - sz(20, 8);
      datAnh(Q, null, url, { pos: '50% 40%', thay: '？', ht: 'ht-duoi', chua: true, rect: { x: vx0, y: y0, w: vx1 - vx0, h: Math.min(st.Yb, Q.bb.y1) - y0 } });
    }
    const wQ = nhet(Q, crQ, 'j-qq');
    const duoi = sz(30, 14);
    const bong = h('div', 'j-bong-x', wQ);
    bong.style.width = Math.floor(crQ.w) + 'px'; bong.style.height = (hBong - duoi) + 'px';
    bong.innerHTML = bongSvg(crQ.w, hBong - duoi, sz(56, 22), { bx: crQ.w * 0.5, bw: sz(70, 30), tx: crQ.w * 0.5 + sz(30, 12), ty: hBong - sz(4, 2) }, Math.max(3, Math.round(st.bw * 0.85)));
    const bpad = sz(24, 10);
    const inn = h('div', 'j-bong-in', bong);
    inn.style.left = bpad + 'px'; inn.style.top = bpad * 0.5 + 'px'; inn.style.width = f1(crQ.w - bpad * 2) + 'px'; inn.style.height = f1(hBong - duoi - bpad) + 'px';
    const cauJp = RE_JP.test(goc);
    const cauEl = h('div', 'j-qcau' + (cauJp ? '' : ' is-vn'), inn);
    cauEl.innerHTML = esc(goc).replace(RE_TRONG, '<span class="j-trong"><span class="j-trong-d"></span></span>');
    if (cauJp) cauEl.lang = 'ja';
    const ycEl = yc ? h('div', 'j-meo j-qyc', inn, jp(yc)) : null;
    fitStack([{ el: cauEl, fmax: sz(84, 34), fmin: sz(22, 14) }, ycEl && { el: ycEl, fmax: sz(30, 15), fmin: sz(19, 13) }], inn.clientWidth || (crQ.w - bpad * 2), inn.clientHeight || (hBong - duoi - bpad), sz(10, 5));
    m.trong = cauEl.querySelector('.j-trong-d');
    m.qDapAn = opts[q.correctIndex] ? tachNgoac(opts[q.correctIndex])[0] : '';
    // ---- S: 4 dap an dang xem (Sensei doc) / cong the that (den luot hoc vien)
    const crS = crOf(S.poly, pd);
    veLopNet(S, crS, 71, st.dt ? 40 : 90);
    m.crS = crS;
    const wS = nhet(S, crS, 'j-qs');
    m.wS = wS;
    m.opts = opts;
    if (m.choOn) taoKhungCho(m, wS);
    else {
      const gr = h('div', 'j-qopts', wS);
      gr.innerHTML = opts.map((o, i) => { const [p, r] = tachNgoac(o); return `<div class="j-qo" data-o="${i}"><b class="j-qk">${'ABCD'[i]}</b><span class="j-qo-t"${RE_JP.test(p) ? ' lang="ja"' : ''}>${esc(p)}</span>${r ? `<i class="j-qo-r">${esc(r)}</i>` : ''}</div>`; }).join('');
      m.qopts = gr;
      const dai = Math.max(...opts.map((o) => kyTu(tachNgoac(o)[0]).length), 1);
      gr.classList.toggle('mot-cot', dai > 26 || st.dt);
      const cols = gr.classList.contains('mot-cot') ? 1 : 2;
      gr.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      const rowsN = Math.ceil(opts.length / cols);
      const gap = sz(16, 8);
      const hCell = (crS.h - gap * (rowsN - 1)) / rowsN, wCell = (crS.w - gap * (cols - 1)) / cols;
      gr.style.gap = gap + 'px';
      gr.style.height = crS.h + 'px';
      gr.style.gridTemplateRows = `repeat(${rowsN}, 1fr)`;
      // co chu chung cho 4 o: vua o dai nhat
      let f = sz(84, 30);
      const fminO = sz(20, 14);
      const cs = [...gr.querySelectorAll('.j-qo-t')];
      const inner = (el) => { el.style.fontSize = f + 'px'; };
      const okAll = () => cs.every((el) => { const o = el.parentNode; return el.scrollWidth <= o.clientWidth - sz(50, 30) && o.scrollHeight <= hCell + 1; });
      let it = 0;
      gr.style.setProperty('--j-qf', f + 'px');
      while (it++ < 14 && f > fminO) { cs.forEach(inner); gr.style.setProperty('--j-qf', f + 'px'); if (okAll()) break; f = Math.max(fminO, f * 0.88); }
      cs.forEach(inner); gr.style.setProperty('--j-qf', f + 'px');
      m.qf = f;
      void wCell;
    }
    // ---- Z: dem cau + goi y
    if (Z) {
      const crZ = crOf(Z.poly, Math.round(pd * 0.7));
      veLopNet(Z, crZ, 15, 50);
      const wZ = nhet(Z, crZ, 'j-qz');
      h('div', 'j-tagrow', wZ, `${the('LUYỆN TẬP')}<b class="j-dem-nho">${String(c.i || 1).padStart(2, '0')}<i>/${String(c.n || nh.n).padStart(2, '0')}</i></b>`);
      if (q.hint) {
        const gy = h('div', 'j-qgy', wZ, `<span${ck(m, 'Q3', 'len')}>${jp(q.hint)}</span>`);
        wZ.style.paddingTop = sz(48, 34) + 'px';
        fitBox(gy, crZ.w, crZ.h - sz(48, 34), sz(32, 16), sz(19, 13));
      }
    }
    oVao(T, ['Q', 'S'].concat(Z ? ['Z'] : []), opt.tre || 0, 0.06);
    m.fase = 'qz';
    camTuc(T, Q.cx, Q.cy);
    if (m.choOn) camReset(T, true);
    if (m.ketQua) apKetQua(m, m.ketQua.dung, true);
  }
  function camReset(T, ngay) {
    T.s = 1;
    if (ngay || giam()) G.set(T.cam, { x: 0, y: 0, scale: 1 });
    else G.to(T.cam, { x: 0, y: 0, scale: 1, duration: 0.3, ease: 'power2.inOut', overwrite: 'auto' });
  }
  function taoKhungCho(m, wS) {
    wS.textContent = '';
    const slot = h('div', 'j-slot', wS);
    // co chu dap an cua the that: dap an dai nhat vao <= 2 dong (mot cot neu dai / hep) — dap an ngan giu chu to
    const cr = m.crS || { w: 400, h: 300 };
    const dai = Math.max(1, ...(m.opts || []).map((o0) => em(tachNgoac(o0)[0])));
    const motCot = dai > 28 || st.dt;
    const wO = (cr.w - sz(16, 8) * (motCot ? 0 : 1)) / (motCot ? 1 : 2) - sz(120, 70);
    const fRong = wO / Math.max(1, dai / 2);
    const fCao = st.dt ? 22 : sz(46, 22);
    slot.style.setProperty('--j-qf', f1(clamp(Math.min(fRong, fCao, m.qf || fCao), sz(16, 14), fCao)) + 'px');
    m.slot = slot;
    return slot;
  }
  function cueQuiz(m, id, tt) {
    const T = m.T;
    if (!T || m.fase !== 'qz') return;
    const tre = tt ? m.api.tre(tt) : 0;
    let x;
    if (id === 'Q1') { camDen(T, 'Q', tre); nhan(T, 'Q', tre, 1.015); if (!giam()) { const b = T.cells.Q.noi.querySelector('.j-bong-x'); if (b) G.fromTo(b, { scale: 0.92 }, { scale: 1, duration: 0.2, ease: 'expo.out', delay: tre }); } }
    else if ((x = /^Q2\.(\d+)$/.exec(id))) {
      const o = T.el.querySelector(`.j-qo[data-o="${x[1]}"]`);
      if (!m.choOn) camDen(T, 'S', tre);
      if (o) {
        T.el.querySelectorAll('.j-qo.on').forEach((e) => e.classList.remove('on'));
        o.classList.add('on');
        if (!giam()) G.fromTo(o, { scale: 1.06 }, { scale: 1, duration: 0.3, ease: 'elastic.out(1,.6)', delay: tre });
      }
    } else if (id === 'Q3') { hienKhoa(m, 'Q3', tre); if (T.cells.Z) tieuDiem(T, 'Z', tre, 1.02); }
  }
  /** Den luot hoc vien: the that vao o S. Tra phan tu chua */
  function oBaiTapQuiz(m) {
    if (m.slot && m.slot.isConnected) return m.slot;
    const T = m.T;
    if (!T || !m.wS) return null;
    m.choOn = true;
    const wS = m.wS;
    const slot = taoKhungCho(m, wS);
    camReset(T, false);
    nhan(T, 'S', 0, 1.01);
    if (!giam()) G.fromTo(slot, { autoAlpha: 0, y: 12 * st.U }, { autoAlpha: 1, y: 0, duration: 0.22, ease: 'power2.out' });
    return slot;
  }
  function apKetQua(m, dung, ngay) {
    const T = m.T;
    if (!T) return;
    const Q = T.cells.Q;
    if (!Q) return;
    // dien dap an vao cho trong; dong dau: chinh xac / chua dung
    if (m.trong) {
      m.trong.textContent = m.qDapAn || '';
      m.trong.parentNode.classList.add(dung ? 'dung' : 'sai');
    }
    Q.noi.querySelectorAll('.j-dau-kq').forEach((e) => e.remove());
    const crQ = crOf(Q.poly, Math.round(pad0() * 0.8));
    const bang = h('div', 'j-dau-kq ' + (dung ? 'dung' : 'sai'), Q.noi, dung ? '<span lang="ja">正解！</span> Chính xác!' : 'Chưa đúng!');
    bang.style.left = f1(crQ.x - Q.bx) + 'px';
    bang.style.bottom = f1(Q.by + Q.bh - (crQ.y + crQ.h)) + 'px';
    bang.style.maxWidth = f1(crQ.w) + 'px';
    bang.style.fontSize = sz(44, 20) + 'px';
    if (!ngay) {
      if (giam()) G.fromTo(bang, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 });
      else {
        G.fromTo(bang, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.3, ease: 'power3.inOut', clearProps: 'clipPath' });
        if (dung) { camDen(T, 'Q', 0); nhan(T, 'Q', 0.05, 1.03); } else rung(T.cam, 0.02, 8 * st.U);
      }
    }
  }
  function traLoiQuiz(m, exId, dung) {
    m.ketQua = { exId, dung };
    apKetQua(m, dung, false);
  }

  // ---- the chuong / the ket bai (thay the the mac dinh)
  function layThe(kieu) {
    const { W, Yb, Yc } = st;
    const s = W * 0.02;
    if (kieu === 'chuong') {
      if (st.dt) return layBia();
      const xa = W * 0.45;
      const l1 = dV(xa + s, xa - s), l4 = dN(Yc, Yc);
      return { A: cell([l1], [10, 10], Yb), B: cell([l1], [W - 10, 10], Yc - gapY()), E: cell([l1, l4, dCot()], [xa + 60, Yb - 10], Yb) };
    }
    // xong
    if (st.dt) {
      const yA = Math.round(Yb * 0.44), t = Math.round(W * 0.026);
      const l1 = dN(yA + t, yA - t);
      const x1 = W / 3, x2 = W * 2 / 3, sl = W * 0.03;
      const v1 = [x1 + sl, 0, x1 - sl, yA], v2 = [x2 + sl, 0, x2 - sl, yA];
      return { R1: cell([l1, v1], [10, 10], Yb), R2: cell([l1, v1, v2], [W / 2, 10], Yb), R3: cell([l1, v2], [W - 10, 10], Yb), G: cell([l1], [W / 2, Yb - 10], Yb), K: null };
    }
    const hT = Math.round(Yb * 0.47), t = W * 0.008;
    const l1 = dN(hT + t, hT - t);
    const x1 = W / 3, x2 = W * 2 / 3, sl = W * 0.03;
    const v1 = [x1 + sl, 0, x1 - sl, hT], v2 = [x2 + sl, 0, x2 - sl, hT];
    return {
      R1: cell([l1, v1], [10, 10], Yb), R2: cell([l1, v1, v2], [W / 2, 10], Yb), R3: cell([l1, v2], [W - 10, 10], Yb),
      G: cell([l1, dCot()], [10, Yb - 10], Yb), K: cell([l1, dCot()], [W - 10, Yc - 10], Yc),
    };
  }
  function veTheChuong(info, api) {
    const T = taoTrang();
    const m = st.mThe = { T, rev: new Set(), api, vivo: true };
    st.rebuild = () => { doKhung(); const T2 = taoTrang(); m.T = T2; dungThe1(info, api, m, T2, true); xongAnim(T2); trangVao(T2, true); };
    dungThe1(info, api, m, T, false);
    trangVao(T, false);
    return true;
  }
  function dungThe1(info, api, m, T, ngay) {
    const pd = pad0();
    const lay = layThe('chuong');
    const ds = info.ds || [];
    const ch = info.chuong;
    let muc = [];
    let anh = null;
    let glyph = '';
    if (ch === 'vocab') { muc = ds.filter((b) => b.kind === 'vocab').map((b) => b.data && (b.data.kanji || b.data.word)); const b0 = ds.find((b) => b.data && b.data.imageUrl); anh = b0 && b0.data.imageUrl; }
    else if (ch === 'kanji') { muc = ds.filter((b) => b.kind === 'kanji').map((b) => b.data && b.data.character); glyph = muc[0] || ''; }
    else if (ch === 'grammar') muc = ds.filter((b) => b.kind === 'grammar-intro').map((b) => { const t = String((b.data && b.data.title) || ''); return t.split(/:\s*/).slice(1).join(': ') || t; });
    else if (ch === 'kaiwa') muc = vaiCua(ds.filter((b) => b.kind === 'kaiwa').map((b) => b.data)).map((v) => v.jp);
    else if (ch === 'quiz') muc = ds.filter((b) => b.kind === 'quiz').map((b, i) => 'Câu ' + (i + 1));
    const bai = (st.nh && st.nh.bai) || null;
    const A = addCell(T, 'A', lay.A, { bg: '#eee9e0' });
    const B = addCell(T, 'B', lay.B);
    const E = addCell(T, 'E', lay.E);
    datAnh(A, null, anh || (bai && bai.sceneImageUrl) || null, { pos: '50% 40%', thay: glyph || String(info.tenMoi || '').slice(0, 2), ht: 'ht-duoi' });
    const crB = crOf(B.poly, pd);
    veLopNet(B, crB, 81, st.dt ? 60 : 130);
    const wB = nhet(B, crB, 'j-bia-b');
    const p2 = h('div', 'j-bia-2', wB);
    h('div', 'j-tagrow', wB, the(info.tenCu ? 'XONG ' + chuHoa(info.tenCu) + ' ✓' : 'PHẦN TIẾP THEO'));
    p2.style.paddingTop = sz(46, 30) + 'px';
    const bW = Math.min(crB.w, sz(640, 330)), bH = Math.round(Math.min(bW * 0.34, crB.h * 0.4));
    const bst = h('div', 'j-bia-bai', p2, burstSvg(bW, bH, 7, { n: 24, jit: 0.3 }) + `<b>${esc(chuHoa(info.tenMoi || ''))}</b>`);
    bst.style.width = bW + 'px'; bst.style.height = bH + 'px';
    fitDong(bst.lastChild, bW * 0.62, bH * 0.5, sz(24, 16));
    const meta = h('div', 'j-bia-td', p2, jp(info.meta || ''));
    meta.style.fontWeight = '800';
    p2.style.gap = Math.round(pd * 0.5) + 'px';
    fitBox(meta, crB.w, Math.max(30, crB.h - bH - pd - sz(46, 30)), sz(56, 26), sz(24, 15));
    const crE = crOf(E.poly, Math.round(pd * 0.7));
    const ew = nhet(E, crE, 'j-chips');
    const toi = st.dt ? 8 : 14;
    ew.innerHTML = muc.filter(Boolean).slice(0, toi).map((x) => `<span class="j-chip"${RE_JP.test(x) ? ' lang="ja"' : ''}>${esc(ngan(x, 14))}</span>`).join('') + (muc.length > toi ? `<span class="j-chip">+${muc.length - toi}</span>` : '');
    fitBox(ew, crE.w, crE.h, sz(38, 20), sz(16, 12));
    oVao(T, ['A', 'B', 'E'], 0, 0.07);
    camTuc(T, B.cx, B.cy);
    if (!ngay) {
      datLoi('Tiếp theo: ' + (info.tenMoi || '') + (info.meta ? ' · ' + info.meta : ''));
      G.fromTo(bst, { scale: 0.4, rotation: -5 }, { scale: 1, rotation: 0, duration: giam() ? 0.01 : 0.42, ease: 'back.out(2)', delay: 0.05 });
    }
    st.the = { A, B, E };
  }
  function veTheXong(info, api) {
    const T = taoTrang();
    const m = st.mThe = { T, rev: new Set(), api, vivo: true };
    st.rebuild = () => { doKhung(); const T2 = taoTrang(); m.T = T2; dungThe2(info, api, m, T2, true); xongAnim(T2); trangVao(T2, true); };
    dungThe2(info, api, m, T, false);
    trangVao(T, false);
    return true;
  }
  function dungThe2(info, api, m, T, ngay) {
    const pd = pad0();
    const lay = layThe('xong');
    const bai = (st.nh && st.nh.bai) || {};
    const tu = (bai.vocabList || []).filter((v) => v && v.imageUrl).slice(0, 3);
    const ids = ['R1', 'R2', 'R3'];
    ids.forEach((id, i) => {
      const c = addCell(T, id, lay[id], { bg: '#eee9e0' });
      const v = tu[i];
      if (!v) { datAnh(c, null, null, { thay: ['私', '学', '先'][i], ht: 'ht-duoi' }); return; }
      datAnh(c, null, v.imageUrl, { pos: '50% 40%', thay: v.kanji || v.word, ht: 'ht-duoi' });
      const cr = crOf(c.poly, Math.round(pd * 0.7));
      const bx = nhet(c, cr, 'j-ghi-anh');
      bx.style.justifyContent = 'flex-end'; bx.style.alignItems = 'flex-start';
      const hop = h('div', 'j-tt-hop', bx, `<b lang="ja">${C.ruby(v.kanji || v.word, v.furigana || '')}</b><span>${esc(ngan(boNgoacCuoi(v.meaningVi), 22))}</span>`);
      fitBox(hop, Math.min(cr.w, sz(300, 170)), Math.round(cr.h * 0.5), sz(90, 44), sz(26, 15));
    });
    const G_ = addCell(T, 'G', lay.G);
    const crG = crOf(G_.poly, pd);
    veLopNet(G_, crG, 91, st.dt ? 30 : 60);
    const wG = nhet(G_, crG, 'j-tk');
    h('div', 'j-tagrow', wG, the('HÔM NAY MÌNH ĐÃ HỌC'));
    const hang = (info.hang || []).slice(0, 6);
    const ul = h('div', 'j-tk-ds', wG, hang.map((r) => `<div class="j-tk-h"><span class="j-tk-n">${esc(r.nhan)}</span><b>${esc(r.so)}</b>${r.cham ? `<span class="j-tk-c">${r.cham.map((k) => `<i class="${esc(k || '')}"></i>`).join('')}</span>` : `${st.dt ? '' : `<span class="j-tk-m"${r.jp ? ' lang="ja"' : ''}>${esc(ngan(r.mau, 30))}</span>`}`}</div>`).join(''));
    wG.style.paddingTop = sz(50, 34) + 'px';
    fitBox(ul, crG.w, crG.h - sz(50, 34), sz(44, 20), sz(20, 14));
    if (lay.K) {
      const K = addCell(T, 'K', lay.K);
      const crK = crOf(K.poly, Math.round(pd * 0.5));
      const wK = nhet(K, crK, 'j-vd');
      const bw = Math.floor(crK.w), bh = Math.floor(Math.min(crK.h, bw * 0.62));
      const bs = h('div', 'j-loai-bst', wK, burstSvg(bw, bh, 12, { n: 18, jit: 0.3, trong: 0.8 }) + '<b lang="ja">またね！</b>');
      bs.style.width = bw + 'px'; bs.style.height = bh + 'px';
      bs.lastChild.style.fontFamily = '"Dela Gothic One", "Noto Sans JP", sans-serif';
      bs.lastChild.style.fontStyle = 'normal';
      fitDong(bs.lastChild, bw * 0.62, Math.min(sz(74, 30), bh * 0.5), sz(20, 14));
      if (!ngay && !giam()) G.fromTo(bs, { scale: 0.3, rotation: -8 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)', delay: 0.8 });
    }
    oVao(T, ['R1', 'R2', 'R3', 'G'].concat(lay.K ? ['K'] : []), 0, 0.07);
    camTuc(T, G_.cx, G_.cy);
    if (!ngay) datLoi('Hẹn gặp lại ở bài sau nhé! またね！');
  }
  // ================================================================== HOP DONG CHE DO
  const DUNG = {
    vocab(nh, api, m, T, opt) {
      const coBia = !!(nh.laBatDau && !nh.isResume && nh.i === 0 && nh.bai);
      if (coBia && m.fase !== 'tu') {
        dungBia(nh, api, m, T);
        if (m.baiDaHien && m.bia) { m.baiDaHien = false; biaSangBai(m, 0); }
        m.chuyen = () => {
          if (m.fase !== 'bia' || m.dangChuyen) return;
          m.dangChuyen = true;
          m.lech = 0;
          const T2 = taoTrang();
          m.T = T2;
          dungTuVung(nh, api, m, T2, { vaoLuc: true });
          trangVao(T2, false);
          m.dangChuyen = false;
        };
      } else dungTuVung(nh, api, m, T, opt);
    },
    kanji: dungChuHan,
    'grammar-intro': dungNguPhap,
    example: (nh, api, m, T, opt) => dungCau(nh, api, m, T, opt, false),
    kaiwa: (nh, api, m, T, opt) => dungCau(nh, api, m, T, opt, true),
    'kaiwa-intro': dungHoiThoai,
    'kaiwa-run': dungHoiThoai,
    quiz: dungQuiz,
  };
  const CUE = {
    vocab(m, id, tt) {
      if (m.fase === 'bia') {
        const tre = m.api.tre(tt);
        if (id === 'V0') { biaSangBai(m, tre); if (m.hChuyen != null) m.api.huyHen(m.hChuyen); m.hChuyen = m.api.hen(() => m.chuyen && m.chuyen(), 3300); return; }
        if (m.hChuyen != null) m.api.huyHen(m.hChuyen);
        if (m.chuyen) m.chuyen();
      }
      cueVocab(m, id, tt);
    },
    kanji: cueChuHan,
    'grammar-intro': cueNguPhap,
    example: cueCau,
    kaiwa: cueCau,
    'kaiwa-intro': cueHoiThoai,
    'kaiwa-run': cueHoiThoai,
    quiz: cueQuiz,
  };

  function hetNhip(m) {
    const nh = m.nh;
    if (m.fase === 'bia' && m.chuyen) { m.chuyen(); return; }
    if (nh.kind === 'kanji') veNetM(m, 0);
    if (nh.kind === 'grammar-intro') tilesDuPhong(m);
    hienHet(m);
    [m.vc && m.vc.qm, m.qm].forEach((q) => { if (q) q.style.display = 'none'; });
    if (m.tlK) { try { m.tlK.kill(); } catch (e) {} m.tlK = null; }
    if (m.T) m.T.el.querySelectorAll('.j-tok.on').forEach((e) => e.classList.remove('on'));
  }

  function taoM(nh, api) {
    const m = {
      nh, api, T: null, rev: new Set(), fase: '', vivo: true, tlK: null,
      cue(id, tt) { const f = CUE[nh.kind]; if (f && m.vivo) f(m, id, tt); },
      karaoke(ds) { if (m.vivo && (nh.kind === 'example' || nh.kind === 'kaiwa' || nh.kind === 'kaiwa-run')) karaokeCau(m, ds); },
      tro(idMuc, o) {
        if (!m.vivo || !m.T) return;
        const e = m.T.el.querySelector(`.j-tok[data-id="${String(idMuc).replace(/"/g, '')}"]`);
        if (e) { const k = +e.dataset.g; batTok(m, k); if (o && o.T != null) void o; }
      },
      loi(doan, raw) { datLoi(raw); },
      ghi() {},
      dongThoai(line, i) {
        if (!m.vivo || nh.kind !== 'kaiwa-run' || m.fase !== 'ht') return;
        if (m.tomTat) { m.tomTat.style.display = 'none'; m.tomTat = null; }
        hienLuot(m, line, i, 0, false);
      },
      het() { hetNhip(m); },
      oBaiTap() { return nh.kind === 'quiz' ? oBaiTapQuiz(m) : null; },
      traLoi(exId, dung) { if (nh.kind === 'quiz') traLoiQuiz(m, exId, dung); },
      vaoCho() {},
      raCho() {},
      roi() { m.vivo = false; if (m.tlK) { try { m.tlK.kill(); } catch (e) {} } if (st.m === m) st.m = null; },
    };
    return m;
  }

  // ---- phong chu: nap truoc bo chu hay dung; khi phong ve (do rong doi) thi dung lai trang hien tai khong hieu ung
  const MAU_JP = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだでどばびぶべぼぱぴぷぺぽゃゅょっーアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダデドバビブベボパピプペポャュョッー、。！？・「」（）〜私学生先';
  const MAU_VI = 'Tiếng Việt: ăâêôơưđ ẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴỶỸ ạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ 0123456789';
  function napPhong() {
    const F = document.fonts;
    if (!F || !F.load) return;
    try {
      F.load('900 40px "Noto Sans JP"', MAU_JP); F.load('700 40px "Noto Sans JP"', MAU_JP); F.load('900 40px "Noto Serif JP"', MAU_JP);
      F.load('800 40px "Be Vietnam Pro"', MAU_VI); F.load('900 40px "Be Vietnam Pro"', MAU_VI); F.load('italic 900 40px "Be Vietnam Pro"', MAU_VI);
      F.load('400 40px "Dela Gothic One"', 'wa!ペコリ第話またね正解0123456789');
    } catch (e) {}
    if (!st.onFont) {
      st.onFont = () => {
        if (!L || !st.api || !st.rebuild || !st.m || (st.m.nFont = (st.m.nFont || 0) + 1) > 3) return;
        if (st.hFont != null) { try { st.api.huyHen(st.hFont); } catch (e) {} }
        st.hFont = st.api.hen(() => { st.hFont = null; if (L && st.rebuild) { try { st.rebuild(); } catch (e) {} } }, 90);
      };
      F.addEventListener('loadingdone', st.onFont);
    }
  }

  SC.dangKy({
    id: ID,
    ten: 'Truyện tranh manga',
    can: ['gsap'],
    batDau(lop0, ctx) {
      L = lop0; C = ctx; G = ctx.gsap;
      window.__cdJ = st;   // chan doan kiem thu (chi doc trang thai bo cuc, giong __motion.cheDo)
      st.pages = []; st.T = null; st.dem = 0; st.loiCau = ''; st.loiRaw = ''; st.probe = null; st.m = null; st.rebuild = null; st.tangKhoa = '';
      L.classList.add('j-nen');
      st.vung = h('div', 'j-vung', L);
      napPhong();
      doKhung();
      khoiTang();
    },
    ketThuc() {
      if (G && L) { try { G.killTweensOf(L.querySelectorAll('*')); } catch (e) {} }
      if (st.onFont && document.fonts) { try { document.fonts.removeEventListener('loadingdone', st.onFont); } catch (e) {} }
      st.onFont = null; st.hFont = null;
      L = null; C = null; st.m = null; st.nh = null; st.T = null; st.pages = []; st.vung = null; st.tang = null; st.probe = null; st.rebuild = null; st.tangKhoa = '';
    },
    doiCo() {
      if (!L || !C) return;
      doKhung();
      st.tangKhoa = '';
      khoiTang();
      if (st.rebuild) { try { st.rebuild(); } catch (e) { try { console.warn('[che-do j] doiCo', e); } catch (x) {} } }
    },
    trangThai(text, kieu) {
      const t = st.tang;
      if (!t) return;
      if (kieu === 'chuan-bi' && !st.loiCau) { t.dong.innerHTML = '<span class="j-cham"><i></i><i></i><i></i></span>'; G.set(t.dong, { autoAlpha: 1 }); }
    },
    dungNhip(nh, api) {
      const f = DUNG[nh.kind];
      if (!f || !L) return null;
      doKhung();
      khoiTang();
      st.nh = nh; st.api = api;
      const m = taoM(nh, api);
      st.m = m;
      const T = taoTrang();
      m.T = T;
      st.rebuild = () => {
        doKhung();
        const T2 = taoTrang();
        m.T = T2;
        // cong the that (quiz): giu the + chan the khi dung lai trang
        const cu = m.slot && m.slot.isConnected ? { cong: m.slot.querySelector('.sk-cong'), chan: m.slot.querySelector('.cd-chan') } : null;
        f(nh, api, m, T2, { ngay: true });
        if (cu && m.slot) { if (cu.cong) m.slot.appendChild(cu.cong); if (cu.chan) m.slot.appendChild(cu.chan); }
        xongAnim(T2);
        trangVao(T2, true);
      };
      f(nh, api, m, T, {});
      trangVao(T, false);
      if (st.khungLoi) m.hLai = api.hen(() => { if (m.vivo && L && st.rebuild) { try { doKhung(); st.tangKhoa = ''; khoiTang(); st.rebuild(); } catch (e) {} } }, 160);
      return m;
    },
    theChuong(info, api) { return L ? veTheChuong(info, api) : false; },
    theXong(info, api) { return L ? veTheXong(info, api) : false; },
  });
})();
