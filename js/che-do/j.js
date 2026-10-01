/* ==========================================================================
   Che do san khau J — "Truyện tranh manga" (port TRUNG THANH tu ban mau E:/sensei-tam/demo2/j: index.html + manga.js + manga.css).
   Moi nhip la MOT TRANG MANGA: cac o (panel) da giac xeo, vien muc, anh minh hoa GIU MAU + luoi cham (halftone),
   may quay day nhe (<= 350 ms), net toc do / vu no cho nhan manh. Bang mau: muc den, giay trang, MOT mau nhan do (ngu phap chinh).
   Bang co chu: 6 bac theo be ngang khung (t1 headword, t2 cong thuc, t3 cau, t4 nghia, t5 phu de, t6 nhan) — cung bac o moi dang nhip;
   noi dung dai tu ha trong khoang tu-bac-gan-nhat toi san (khong bao gio duoi san).
   Chuyen canh theo ban mau: vet muc quet phai -> trai 0.75 s (cubic in-out), trang moi truot 120 px 1.0 s expo.out; trong trang:
   dap (scale 1.5-1.9 -> 1, expo.out .45), truot (.6 expo.out), nay (back.out 2.2, .55), quet clip-path (.5 power3.inOut), ve net, nhan lon -> goc (.65 power3.inOut).
   Hang Sensei (co dinh o duoi, 2 dong): loi Sensei song gom thanh CAU tron ven, moi cau hien mot lan (capNhan), khong lap chu da co tren trang.
   O goc phai duoi danh cho meo THAT. Du lieu that cua MOI bai; bai tap: the that #card-<id> vao o cua che do (oBaiTap).
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
  const MUC = '#141414', DO = '#e3261b';   // phai trung --j-muc / --j-do trong css (chi dung cho SVG sinh bang JS)
  // ban mau: bang 1920 x 756 (trang) — toa do thiet ke, nhan voi st.sx / st.sy khi dung
  const DW = 1920, DH = 756;
  // chuyen canh (ban mau): quet 0.75 s, trang moi truot 120 px / 1.0 s
  const WIPE = 0.75, SLIDE = 1.0, SLIDE_PX = 120;
  // bac co chu (px khi U = 1): [t1 headword, t2 cong thuc, t3 cau, t4 nghia, t5 phu de, t6 nhan]
  const BAC_MAY = [204, 128, 90, 56, 38, 21];
  const BAC_DT = [104, 56, 40, 30, 19, 15];
  const SAN_MAY = { hw: 120, ct: 110, cau: 84, nghia: 44, phu: 24, nhan: 20, bong: 60 };
  const SAN_DT = { hw: 52, ct: 28, cau: 28, nghia: 28, phu: 15, nhan: 15, bong: 28 };

  // ------------------------------------------------------------------ trang thai che do
  let L = null;                  // lop .cd-lop
  let C = null;                  // ctx / tien ich dao dien
  let G = null;                  // gsap
  const st = {
    W: 0, H: 0, dt: false, U: 1, meo: null, sx: 1, sy: 1,
    g: 12, bw: 6, mx: 0, my: 0, camS: 1.035,
    Yb: 0, Yc: 0, Xc: 0, catL: 0, catT: 0, bTop: 0, t: BAC_MAY, san: SAN_MAY,
    vung: null, tang: null, pages: [], T: null, probe: null, vet: null,
    nh: null, api: null, m: null, dem: 0, cap: null,
  };
  const px = (x) => x * st.sx;               // toa do thiet ke -> px (ngang)
  const py = (y) => y * st.sy;               // toa do thiet ke -> px (doc)
  const tk = (n) => st.t[n - 1];             // bac co chu t1..t6

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
    st.t = (dt ? BAC_DT : BAC_MAY).map((v) => Math.round(v * U * 10) / 10);
    const sn = dt ? SAN_DT : SAN_MAY;
    st.san = {};
    Object.keys(sn).forEach((q) => { st.san[q] = Math.round(sn[q] * (dt ? 1 : Math.min(1, U)) * 10) / 10; });   // man nho hon 1440: san ti le theo U (khong lon hon muc toi thieu da dat o 1440)
    st.g = Math.round((dt ? 8 : 22 * W / DW * 1.1) * (dt ? U : 1));
    st.bw = Math.max(3, Math.round(dt ? 3.6 * U : 7.4 * W / DW));
    st.camS = dt ? 1.03 : 1.035;
    st.mx = Math.round(W * (1 - 1 / st.camS)) + Math.round((dt ? 8 : 12) * U);
    // hinh chu nhat cua meo that (toa do lop); khong co meo -> gia dinh goc phai duoi
    const m = st.meo || (dt ? { x: W - 132, y: H - 105 } : { x: W - Math.round(275 * U), y: H - Math.round(278 * U) });
    if (dt) {
      st.catT = Math.round(m.y - 8);
      st.bTop = st.catT;
      st.catL = Math.round(m.x - 6);
    } else {
      st.catT = Math.round(m.y + 8);
      st.bTop = H - clamp(Math.round(H * 0.215), 116, 200);   // hang Sensei co dinh (loi 2 dong) ~ 21% (ban mau 19% + le)
      st.catL = Math.round(m.x - 26 * U);
    }
    st.Yb = st.bTop - Math.round(st.g / 2);
    st.Yc = dt ? st.Yb : Math.min(st.Yb, st.catT - Math.round(st.g / 2));
    st.Xc = st.catL - Math.round(st.g / 2);
    st.sx = W / DW;
    st.sy = st.Yb / DH;
    st.my = Math.round(st.Yb * (1 - 1 / st.camS)) + Math.round(10 * U);
    L.style.setProperty('--j-u', U.toFixed(4) + 'px');
    L.style.setProperty('--j-bw', st.bw + 'px');
    st.t.forEach((v, i) => L.style.setProperty('--t' + (i + 1), v + 'px'));
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
  /** Cat hop r de khong de len o goc meo (x >= Xc, y >= Yc): uu tien giu chieu rong, ha day; khong duoc thi thu hep phai */
  function traoGocMeo(r) {
    if (st.dt || st.Yc >= st.Yb) return r;
    const mg = Math.round(6 * st.U);
    if (r.x + r.w <= st.Xc - mg || r.y + r.h <= st.Yc - mg) return r;
    const h2 = st.Yc - mg - r.y, w2 = st.Xc - mg - r.x;
    if (h2 >= r.h * 0.62) return { x: r.x, y: r.y, w: r.w, h: h2 };
    if (w2 >= r.w * 0.55) return { x: r.x, y: r.y, w: w2, h: r.h };
    return h2 * r.w >= w2 * r.h ? { x: r.x, y: r.y, w: r.w, h: Math.max(20, h2) } : { x: r.x, y: r.y, w: Math.max(20, w2), h: r.h };
  }
  /**
   * Hop noi dung lon nhat trong o (toa do trang): pad = le (t,b,l,r) hoac so. Da giac loi -> hop chu nhat noi tiep
   * duoc tinh tai hai duong ngang y0, y1; thu nhieu cap (y0, y1) (co canh xeo ngang) va lay dien tich lon nhat.
   */
  function crOf(poly, pad, sinMeo) {
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
        const rb = Math.min(e0[1], e1[1]);
        const x1 = Math.min(rb - p.r, st.W - st.mx);
        const w = x1 - x0, h2 = y1 - y0;
        if (w < 20) continue;
        const sc = w * Math.pow(h2, 1.2);
        if (!best || sc > best.sc) best = { sc, x: x0, y: y0, w, h: h2 };
      }
    }
    const r = best ? { x: best.x, y: best.y, w: best.w, h: best.h } : { x: st.mx, y: top0, w: Math.max(20, st.W - 2 * st.mx), h: hh };
    return sinMeo ? r : traoGocMeo(r);
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
    return `<svg class="j-bst" width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}" aria-hidden="true" focusable="false"><polygon points="${pts}" fill="${o.nen || '#fff'}" stroke="${o.mau || MUC}" stroke-width="${o.vien || Math.max(3, st.bw)}" stroke-linejoin="miter"/></svg>`;
  }

  // ------------------------------------------------------------------ do co chu (do that trong DOM) — bac co chu t1..t6
  function probeEl() {
    if (!st.probe || !st.probe.isConnected) { st.probe = h('div', 'j-probe', L); st.probe.setAttribute('aria-hidden', 'true'); }
    return st.probe;
  }
  const vuaHop = (box, w, hh) => box.scrollWidth <= w + 0.6 && box.scrollHeight <= hh + 0.6;
  /**
   * Co chu cho `box` (da trong DOM, co chieu rong w): thu lan luot cac BAC (giam dan) roi ha lien tuc toi fmin.
   * Chu bao boc chi ngat giua cac token (token la inline-block nowrap). Tra co chu da dat.
   */
  function fitBac(box, w, hh, bac, fmin) {
    box.style.width = Math.floor(w) + 'px';
    for (let i = 0; i < bac.length; i++) {
      box.style.fontSize = bac[i] + 'px';
      if (vuaHop(box, w, hh)) return bac[i];
    }
    const hi = bac[bac.length - 1];
    box.style.fontSize = fmin + 'px';
    if (!vuaHop(box, w, hh)) return fmin;
    let lo = fmin, up = hi;
    for (let i = 0; i < 9 && up - lo > 0.6; i++) {
      const mid = (lo + up) / 2;
      box.style.fontSize = mid + 'px';
      if (vuaHop(box, w, hh)) lo = mid; else up = mid;
    }
    box.style.fontSize = f1(lo) + 'px';
    return lo;
  }
  /** Cac bac t[a]..t[b] (so 1..6, a nho = to hon) */
  const bacTu = (a, b) => st.t.slice(a - 1, b);
  /** Mot dong khong xuong hang vua be ngang w: bac to nhat <= fmax vua, roi ha lien tuc toi fmin */
  function fitDong(el, w, bac, fmin) {
    el.style.whiteSpace = 'nowrap';
    const ds = [].concat(bac);
    for (let i = 0; i < ds.length; i++) {
      el.style.fontSize = ds[i] + 'px';
      if (Math.max(el.scrollWidth, el.offsetWidth) <= w + 0.6) return ds[i];
    }
    const f0 = ds[ds.length - 1];
    el.style.fontSize = f0 + 'px';
    const sw = Math.max(el.scrollWidth, el.offsetWidth);
    let f = clamp(f0 * w / sw * 0.995, fmin, f0);
    el.style.fontSize = f1(f) + 'px';
    if (Math.max(el.scrollWidth, el.offsetWidth) > w + 0.6 && f > fmin) { f = Math.max(fmin, f * w / Math.max(el.scrollWidth, el.offsetWidth) * 0.99); el.style.fontSize = f1(f) + 'px'; }
    return f;
  }
  /**
   * Kiem tra THAT bang hop hien thi (gom ca furigana tran ra ngoai dong): neu chu nhu token / rt nho ra ngoai `khung`
   * thi ha co chu 6% moi vong toi fmin. Dung cho khoi chu rat dai — khong bao gio de chu bi cat.
   */
  function vuaKhung(box, khung, fmin) {
    for (let i = 0; i < 30; i++) {
      const cr = khung.getBoundingClientRect();
      let top = 1e9, bot = -1e9, l = 1e9, r = -1e9;
      box.querySelectorAll('rt, .j-tok, .j-tile, span').forEach((e) => { const q = e.getBoundingClientRect(); if (q.height > 0 && q.width > 0) { top = Math.min(top, q.top); bot = Math.max(bot, q.bottom); l = Math.min(l, q.left); r = Math.max(r, q.right); } });
      if (top >= cr.top - 1 && bot <= cr.bottom + 1 && l >= cr.left - 1 && r <= cr.right + 1) return true;
      const f = parseFloat(box.style.fontSize) || 40;
      if (f * 0.94 < fmin) return false;
      box.style.fontSize = f1(f * 0.94) + 'px';
    }
    return false;
  }


  // ------------------------------------------------------------------ trang (page) + o
  function taoTrang() {
    const el = h('div', 'j-trang', st.vung);
    const truot = h('div', 'j-truot', el);
    const cam = h('div', 'j-cam', truot);
    const capO = h('div', 'j-cells', cam);
    const vsvg = sv('svg', { class: 'j-vien', width: st.W, height: st.Yb, viewBox: `0 0 ${st.W} ${st.Yb}` }, cam);
    vsvg.style.overflow = 'visible';
    const fx = h('div', 'j-fx', cam);
    const T = { el, truot, cam, capO, vsvg, fx, cells: {}, z: ++st.dem, s: 1, cx: st.W / 2, cy: st.Yb / 2 };
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
    return h('div', 'j-slwrap', c.noi, speedLines(w, hh, cxp - c.bx, cyp - c.by, rx, ry, seed, n || (st.dt ? 70 : 120), wid));
  }

  // ------------------------------------------------------------------ may quay (camera) + tieu diem — day <= 350 ms
  function camTuc(T, cx, cy, s) {
    const W = st.W, Hv = st.Yb;
    const sc = giam() ? 1 : (s || st.camS);
    const x = clamp(W / 2 - sc * cx, W * (1 - sc), 0), y = Hv * (1 - sc);
    G.set(T.cam, { x, y, scale: sc, transformOrigin: '0 0' });
    T.s = sc; T.cx = cx; T.cy = cy;
  }
  function camDen(T, id, tre, s, dur) {
    const c = T && T.cells[id];
    if (!c || giam()) return;
    const W = st.W, Hv = st.Yb;
    const sc = s || st.camS;
    const x = clamp(W / 2 - sc * c.cx, W * (1 - sc), 0), y = Hv * (1 - sc);
    T.s = sc; T.cx = c.cx; T.cy = c.cy;
    G.to(T.cam, {
      x, y, scale: sc, duration: Math.min(0.34, dur || 0.32), ease: 'power2.inOut', delay: tre || 0, overwrite: 'auto',
      onStart: () => { T.cam.style.willChange = 'transform'; },
      onComplete: () => { T.cam.style.willChange = ''; },
    });
  }
  /** Nhan manh cua o: vien day len roi tro lai (khong phong noi dung: chu giu nguyen co) */
  function nhan(T, id, tre) {
    const c = T && T.cells[id];
    if (!c || !c.pg) return;
    G.fromTo(c.pg, { strokeWidth: st.bw }, { strokeWidth: st.bw * 1.9, duration: giam() ? 0.001 : 0.16, ease: 'none', delay: tre || 0, overwrite: 'auto' });
    G.to(c.pg, { strokeWidth: st.bw, duration: giam() ? 0.001 : 0.5, ease: 'power2.out', delay: (tre || 0) + 0.7 });
  }
  /** Tieu diem = may quay + nhan manh */
  function tieuDiem(T, id, tre) { camDen(T, id, tre); nhan(T, id, tre); }
  function rung(el, tre, bien) {
    if (!el || giam()) return;
    const b = bien || 10;
    G.fromTo(el, { x: 0 }, { keyframes: { x: [0, -b, b, -b * 0.7, b * 0.6, -b * 0.3, 0] }, duration: 0.42, ease: 'none', delay: tre || 0 });
  }

  // ------------------------------------------------------------------ hieu ung vao theo ban mau (dap / truot / nay / quet) + khoa cho cue
  /** Thuoc tinh danh dau phan tu cho cue `khoa`: an san bang CSS, hien khi cue toi (hoac da hien roi -> khong an) */
  function ck(m, khoa, fx, o) {
    const d = o ? Object.keys(o).map((k) => ` data-${k}="${o[k]}"`).join('') : '';
    return ` data-cho="${khoa}" data-fx="${fx || 'truot'}"${d}${m && m.rev.has(khoa) ? '' : ' class="j-cho"'}`;
  }
  const dd = (e, k, v0) => (e.dataset[k] != null ? +e.dataset[k] : v0);
  /** Hieu ung vao (ban mau): moi cai hien DAY DU do dam sau <= 0.12 s, chuyen dong co easing */
  function hieu(e, tre, fx) {
    e.classList.remove('j-cho');
    const t0 = tre || 0;
    if (giam()) { G.fromTo(e, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, delay: t0, onStart: capKiemLai }); return; }
    fx = fx || e.dataset.fx || 'truot';
    if (fx === 'dap') {
      G.fromTo(e, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05, ease: 'none', delay: t0, onStart: capKiemLai });
      G.fromTo(e, { scale: dd(e, 's', 1.5) }, { scale: 1, duration: dd(e, 'd', 0.45), ease: 'expo.out', delay: t0, clearProps: 'transform' });
    } else if (fx === 'nay') {
      G.fromTo(e, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, ease: 'none', delay: t0, onStart: capKiemLai });
      G.fromTo(e, { scale: dd(e, 's', 0.7) }, { scale: 1, duration: dd(e, 'd', 0.55), ease: 'back.out(2.2)', delay: t0, clearProps: 'transform' });
    } else if (fx === 'quet' || fx === 'len') {
      const dau = fx === 'len' ? 'inset(100% -2% -2% -2%)' : 'inset(-2% 100% -2% -2%)';
      G.set(e, { autoAlpha: 1 });
      G.fromTo(e, { clipPath: dau }, { clipPath: 'inset(-2% -2% -2% -2%)', duration: dd(e, 'd', 0.5), ease: 'power3.inOut', delay: t0, clearProps: 'clipPath', onStart: capKiemLai });
    } else {   // truot
      G.fromTo(e, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: 'none', delay: t0, onStart: capKiemLai });
      G.fromTo(e, { x: dd(e, 'dx', 0) * st.sx, y: dd(e, 'dy', 0) * st.sx }, { x: 0, y: 0, duration: dd(e, 'd', 0.6), ease: 'expo.out', delay: t0, clearProps: 'transform' });
    }
  }
  function hienKhoa(m, khoa, tre) {
    if (!m || !m.T) return false;
    if (/^(HW|RD|B\d)$/.test(khoa)) tre = sauChuoi(m, tre);
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
  /** Dat phan tu da hien ngay (dung lai trang khi doi co: khong hieu ung) */
  function hienNgay(e) { e.classList.remove('j-cho'); e.dataset.da = '1'; }

  // ------------------------------------------------------------------ anh (giu mau) + luoi cham
  function anhHtml(url, o) {
    o = o || {};
    if (!url) return `<div class="j-anh is-trong"><span class="j-anh-chu"${RE_JP.test(o.thay || '') ? ' lang="ja"' : ''}>${esc(o.thay || '')}</span><i class="j-ht ${o.ht || 'ht-duoi'}"></i></div>`;
    return `<div class="j-anh"><img src="${esc(url)}" alt="" decoding="async" draggable="false" style="object-position:${esc(o.pos || '50% 45%')}" onerror="this.parentNode.classList.add('is-hong')"/><i class="j-ht ${o.ht || 'ht-duoi'}"></i></div>`;
  }
  /** Cell chua anh: cover neu vung nhin thay gan vuong (khong cat mat / toc), nguoc lai contain tren nen trang. o.zoom: can canh (phong to quanh diem) */
  function datAnh(c, url, o) {
    o = o || {};
    const e = nhet(c, { x: c.bb.x0, y: c.bb.y0, w: c.bw, h: c.bh }, 'j-anh-cr', anhHtml(url, o));
    e.style.left = '0px'; e.style.top = '0px'; e.style.width = c.bw + 'px'; e.style.height = c.bh + 'px';
    const bb = c.bb;
    const rc = o.rect;
    const x0 = rc ? rc.x : Math.max(0, bb.x0), y0 = rc ? rc.y : Math.max(0, bb.y0);
    const vw = rc ? rc.w : Math.min(st.W, bb.x1) - Math.max(0, bb.x0), vh = rc ? rc.h : Math.min(st.Yb, bb.y1) - Math.max(0, bb.y0);
    const asp = vw / Math.max(1, vh);
    const a = e.firstElementChild;
    a.classList.toggle('la-cover', (asp > 0.66 && asp < 1.7 && !o.chua) || !!o.zoom || !!o.cover);
    a.style.setProperty('--vx', f1(x0 - c.bx) + 'px'); a.style.setProperty('--vy', f1(y0 - c.by) + 'px');
    const gl = a.querySelector('.j-anh-chu');
    if (gl) {
      const gx = Math.max(x0, st.mx + 4), gy = Math.max(y0, st.my + 4), gw = Math.max(40, x0 + vw - gx - 4), gh = Math.max(40, y0 + vh - gy - 4);
      gl.style.inset = 'auto'; gl.style.left = f1(gx - c.bx) + 'px'; gl.style.top = f1(gy - c.by) + 'px'; gl.style.width = f1(gw) + 'px'; gl.style.height = f1(gh) + 'px';
      const nch = Math.max(1, kyTu(gl.textContent).length);
      gl.style.fontSize = f1(Math.min(tk(1), gh * 0.62, gw / (nch * 1.15))) + 'px';
    }
    a.style.setProperty('--vw', f1(vw) + 'px'); a.style.setProperty('--vh', f1(vh) + 'px');
    const im = a.querySelector('img');
    if (im && o.zoom) { im.style.transformOrigin = o.zoom.o || '50% 30%'; im.style.transform = `scale(${o.zoom.s || 2.2})`; }
    // Ken Burns rat nhe de trang khong dung im (chi scale, nhe)
    else if (o.kb && im && !giam()) G.fromTo(im, { scale: 1 }, { scale: 1.06, duration: 16, ease: 'none' });
    return e;
  }

  /** Chay het moi tween da dat tren trang T (dung lai trang khi doi co / phong chu: khong hieu ung, dung khung cuoi) */
  function xongAnim(T) {
    try {
      const ts = G.getTweensOf(Array.from(T.el.querySelectorAll('*')).concat([T.el, T.cam, T.truot]));
      ts.forEach((t) => { try { t.progress(1); } catch (e) {} });
    } catch (e) {}
  }

  // ------------------------------------------------------------------ chuyen trang (ban mau): vet muc quet phai -> trai
  function xoaTrang(T) {
    if (!T) return;
    const i = st.pages.indexOf(T);
    if (i >= 0) st.pages.splice(i, 1);
    try { G.killTweensOf(T.el.querySelectorAll('*')); G.killTweensOf(T.el); G.killTweensOf(T.cam); G.killTweensOf(T.truot); } catch (e) {}
    T.el.remove();
    if (st.T === T) st.T = null;
  }
  function vetMuc() {
    if (st.vet && st.vet.isConnected) return st.vet;
    st.vet = sv('svg', { class: 'j-vet', width: st.W, height: st.Yb, viewBox: `0 0 ${st.W} ${st.Yb}` }, st.vung);
    sv('polygon', { fill: MUC }, st.vet);
    sv('polygon', { fill: MUC }, st.vet);
    st.vet.style.display = 'none';
    return st.vet;
  }
  function datVet(X) {
    const v = vetMuc();
    const s = st.sx, Hh = st.Yb, k = 180 * s;
    if (X == null) { v.style.display = 'none'; return; }
    v.style.display = 'block';
    v.setAttribute('width', st.W); v.setAttribute('height', Hh);
    v.children[0].setAttribute('points', `${f1(X)},0 ${f1(X + 34 * s)},0 ${f1(X + 34 * s - k)},${Hh} ${f1(X - k)},${Hh}`);
    v.children[1].setAttribute('points', `${f1(X + 52 * s)},0 ${f1(X + 61 * s)},0 ${f1(X + 61 * s - k)},${Hh} ${f1(X + 52 * s - k)},${Hh}`);
  }
  /** Trang moi quet vao tu mep phai (X: 2320 -> -240 thiet ke, cubic in-out, 0.75 s); trang cu nam duoi cho toi khi xong */
  function trangVao(T, ngay) {
    const cu = st.pages.filter((p) => p !== T);
    st.T = T;
    capKiemLai();
    G.delayedCall(0.5, capKiemLai);
    if (ngay || giam() || !cu.length) {
      cu.forEach(xoaTrang);
      datVet(null);
      return;
    }
    const s = st.sx, Hh = st.Yb, Wr = st.W + 180 * s + 60;
    const proxy = { p: 0 };
    T.el.style.zIndex = String(60 + T.z);
    cu.forEach((p) => { p.el.style.zIndex = String(10 + p.z); });
    const dat = () => {
      const X = (2320 - proxy.p * 2560) * s;
      T.el.style.clipPath = `polygon(${f1(X)}px 0px,${f1(Wr)}px 0px,${f1(Wr)}px ${Hh}px,${f1(X - 180 * s)}px ${Hh}px)`;
      datVet(X);
    };
    dat();
    G.to(proxy, {
      p: 1, duration: WIPE, ease: 'power2.inOut', onUpdate: dat,
      onComplete: () => { T.el.style.clipPath = 'none'; datVet(null); cu.forEach(xoaTrang); },
    });
    G.fromTo(T.truot, { x: SLIDE_PX * s }, { x: 0, duration: SLIDE, ease: 'expo.out', clearProps: 'transform' });
    // an toan: trang cu di het du hieu ung bi kill
    G.delayedCall(WIPE + 0.35, () => { cu.forEach(xoaTrang); if (T.el.isConnected) T.el.style.clipPath = 'none'; datVet(null); });
  }
  // ------------------------------------------------------------------ loi Sensei -> hang chu thich (cap)
  // Luong: m.loi(doan, raw) nhan CA luot dang noi (tang dan tung manh). Cat thanh CAU tron ven (dau . ! ? 。 hoac xuong dong),
  // dua vao hang doi; moi cau hien dung mot lan, dung lai toi thieu theo do dai, doi cau bang quet chu (khong chong chu).
  // Cau da co nguyen van tren trang (cau hoi, cong thuc...) thi khong lap lai o day.
  const chuanHoa = (s) => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  /** Cat chuoi thanh cac cau da ket thuc; consumed = do dai phan da cat xong */
  function capTach(rest) {
    const seg = [];
    let last = 0, consumed = 0, mm;
    const re = /([.!?。！？…]+["'”’)」』]*)(\s+|$)|\s*\n+\s*/g;
    while ((mm = re.exec(rest))) {
      if (mm[0] === '') { re.lastIndex++; continue; }
      const fin = mm.index + mm[0].length;
      const cuoiChuoi = mm[1] && fin >= rest.length && !/\s$/.test(mm[0]);   // dau cau sat cuoi: co the con manh sau
      const s = rest.slice(last, mm.index + (mm[1] ? mm[1].length : 0)).trim();
      if (!cuoiChuoi) { if (s) seg.push(s); consumed = fin; }
      last = fin;
    }
    return { seg, consumed };
  }
  /** Van ban cua phan tu, bo furigana (rt) */
  function chuKhongRt(e) {
    const c = e.cloneNode(true);
    c.querySelectorAll('rt, rp').forEach((x) => x.remove());
    return c.textContent || '';
  }
  /** Cac khoi chu dang HIEN tren trang (bo furigana, bo khoi chua hien) */
  function capKhoiTrang() {
    const T = st.T;
    const out = [];
    if (!T) return out;
    const them = (e) => { if (e.closest('.j-tang')) return;   // ke ca khoi CHUA hien (j-cho): sap hien thi cung khong lap lai o hang chu thich
      const tx = chuKhongRt(e).replace(/\s+/g, ' ').trim(); const n = chuanHoa(tx); if (n.length >= 8) out.push(n); };
    T.el.querySelectorAll('.j-tx').forEach(them);
    // bien the cach doc: furigana thay chu goc (Sensei hay doc cau bang kana, trang ghi bang kanji)
    T.el.querySelectorAll('.j-tx').forEach((e) => {
      if (e.closest('.j-tang') || !e.querySelector('ruby')) return;
      const c = e.cloneNode(true);
      c.querySelectorAll('ruby').forEach((r) => { const rt = r.querySelector('rt'); r.replaceWith(document.createTextNode(rt ? rt.textContent : '')); });
      c.querySelectorAll('rp').forEach((x) => x.remove());
      const n = chuanHoa(c.textContent); if (n.length >= 8) out.push(n);
    });
    // ghep moi khoi chu thanh mot mach (cau vi du tach thanh 2 bong thoai van la MOT cau Sensei doc)
    {
      const dsx = [...T.el.querySelectorAll('.j-tx')].filter((e) => !e.closest('.j-tang') && !(e.parentElement && e.parentElement.closest('.j-tx')));
      const nghia = (e) => chuanHoa(chuKhongRt(e));
      const doc = (e) => { const c = e.cloneNode(true); c.querySelectorAll('ruby').forEach((r) => { const rt = r.querySelector('rt'); r.replaceWith(document.createTextNode(rt ? rt.textContent : '')); }); c.querySelectorAll('rp').forEach((x) => x.remove()); return chuanHoa(c.textContent); };
      const j1 = dsx.map(nghia).join(''), j2 = dsx.map(doc).join('');
      if (j1.length >= 8) out.push(j1);
      if (j2.length >= 8 && j2 !== j1) out.push(j2);
    }
    // ten nhan vat: ghep ca hang (Sensei doc mot mach "A (a), B (b), C (c)")
    { const nm = [...T.el.querySelectorAll('.j-p-ten')].map((e) => chuKhongRt(e)).join(''); const n = chuanHoa(nm); if (n.length >= 8) out.push(n); }
    const tw = document.createTreeWalker(T.el, NodeFilter.SHOW_TEXT);
    let nd;
    while ((nd = tw.nextNode())) { const e = nd.parentElement; if (!e || e.closest('rt') || e.closest('.j-probe')) continue; const n = chuanHoa(nd.textContent); if (n.length >= 8) out.push(n); }
    return out;
  }
  /** Khu lap trong mot cau: cum tu (>= 6 ky tu chuan hoa) lap lien tiep chi giu lan sau ("X. X." -> "X.") */
  function capKhuLap(s) {
    let w = String(s || '').trim().split(/\s+/);
    if (w.length < 2) return String(s || '');
    let doi = true;
    while (doi) {
      doi = false;
      for (let n = 1; n <= Math.floor(w.length / 2) && !doi; n++) {
        for (let i = 0; i + 2 * n <= w.length && !doi; i++) {
          const a = chuanHoa(w.slice(i, i + n).join(' ')), b = chuanHoa(w.slice(i + n, i + 2 * n).join(' '));
          if (a.length >= 6 && a === b) { w = w.slice(0, i).concat(w.slice(i + n)); doi = true; }
        }
      }
    }
    return w.join(' ');
  }
  /** Cau cua Sensei co doan >= 10 ky tu trung chu dang hien tren trang khong? Tra null (khong), '' (bo het) hoac phan con lai */
  function capTrung(s) {
    const kh = capKhoiTrang();
    if (!kh.length) return null;
    const tu = String(s).trim().split(/\s+/);
    const bo = new Array(tu.length).fill(false);
    let co = false;
    // tu dai lien (vd cau Nhat khong dau cach): cat doan DAU / CUOI da co tren trang (>= 8 ky tu chuan hoa)
    for (let i = 0; i < tu.length; i++) {
      const cs = kyTu(tu[i]), nw = chuanHoa(tu[i]);
      if (nw.length < 12) continue;
      let kieu = '', L = 0;
      for (let l = nw.length - 1; l >= 8 && !kieu; l--) {
        if (kh.some((b) => b.includes(nw.slice(-l)))) { kieu = 's'; L = l; } else if (kh.some((b) => b.includes(nw.slice(0, l)))) { kieu = 'p'; L = l; }
      }
      if (!kieu) continue;
      const giu = nw.length - L;
      let dem = 0, k;
      if (kieu === 's') { for (k = 0; k < cs.length && dem < giu; k++) if (chuanHoa(cs[k])) dem++; tu[i] = cs.slice(0, k).join(''); } else { for (k = cs.length; k > 0 && dem < giu; k--) if (chuanHoa(cs[k - 1])) dem++; tu[i] = cs.slice(k).join(''); }
      co = true;
    }
    for (let i = 0; i < tu.length; i++) {
      let j = i, tot = 0;
      while (j < tu.length) {
        const n = chuanHoa(tu.slice(i, j + 1).join(' '));
        if (!n || !kh.some((b) => b.includes(n))) break;
        tot = n.length; j++;
      }
      // doan trung o DAU / CUOI cau: >= 7 ky tu; o GIUA cau chi khi rat dai (>= 12 ky tu, tranh cat nham cum tu thuong)
      if (j > i && ((tot >= 7 && (i === 0 || j === tu.length)) || tot >= 12)) { for (let k = i; k < j; k++) bo[k] = true; co = true; i = j - 1; }
    }
    if (!co) return null;
    let con = tu.filter((_, k) => !bo[k]);
    const NOI = /^(dịch|nghĩa|là|tức|có nghĩa|:|;|,|-|—|–|→|⇒|=|＝|và|thì|nhé|nha)[:;,.!?]*$/i;
    while (con.length && NOI.test(con[con.length - 1])) con.pop();
    while (con.length && NOI.test(con[0])) con.shift();
    let r = con.join(' ').replace(/[\s:;,\-–—→⇒=＝·•|\/]+$/, '');
    if (r && !/[.!?。！？…]$/.test(r)) r += '.';   // phan con lai la mot cau tron: ket bang dau cham
    return chuanHoa(r).length >= 8 && con.length >= 2 ? r : '';
  }
  /** Trang vua hien them chu: cau dang o hang chu thich co bi lap khong? */
  /** Font tai xong / bo cuc doi sau khi xep: neu cau dang hien tran 2 dong thi xep lai (xep tu cau day du) */
  function capRefit() {
    const t = st.tang, c = st.cap;
    if (!t || !c || t.txt == null || !t.dong.isConnected) return;
    const d = t.dong, f = parseFloat(d.style.fontSize) || tk(5);
    if (d.scrollHeight > Math.min(t.h, 2 * f * 1.45) + 2 || d.scrollWidth > t.w + 1) capXep(t.txt);
  }
  function capKiemLai() {
    capRefit();
    const c = st.cap;
    if (!c || !c.cur || !st.tang) return;
    const tr = capTrung(c.cur);
    if (tr === null || tr === c.cur) return;
    c.cur = tr;
    capVe(tr, true);
  }
  function capVe(txt, ngay) {
    const t = st.tang;
    if (!t) return;
    if (txt == null || txt === '') txt = capMacDinh();   // khong bao gio de ba cham: hien cau ngan cua chinh trang cho toi khi co cau dau cua Sensei
    capXep(txt);
    if (!ngay && !giam()) G.fromTo(t.dong, { clipPath: 'inset(-20% 100% -20% -2%)' }, { clipPath: 'inset(-20% -2% -20% -2%)', duration: 0.16, ease: 'power2.out', clearProps: 'clipPath', overwrite: 'auto' });
  }
  /** Xep chu vua hang 2 dong: 1 dong 34->20 px, roi 2 dong 30->20 px, roi giu HAI DONG CUOI (bo nguyen tu tu dau) */
  function capXep(txt) {
    const t = st.tang;
    t.txt = txt;   // nguon day du (de xep lai khi font tai xong)
    const d = t.dong, w = Math.floor(t.w), LH = 1.2;
    const fmin = st.san.phu, f5 = tk(5);
    const dat = (s) => { d.innerHTML = jp(s); };
    d.style.width = w + 'px';
    d.style.lineHeight = String(LH);
    dat(txt);
    d.style.whiteSpace = 'nowrap';
    d.style.fontSize = f5 + 'px';
    if (d.scrollWidth <= w + 0.5) return;
    d.style.whiteSpace = 'normal';
    const vua = (f) => { d.style.fontSize = f + 'px'; return d.scrollWidth <= w + 0.5 && d.scrollHeight <= Math.min(t.h, 2 * f * 1.45) + 1.5; };   // dong co chu Nhat cao hon 1.2 em: dung nguong 1.45 (3 dong >= 3.4 em)
    if (vua(f5)) return;
    if (vua(fmin)) {   // tim nhi phan co chu lon nhat vua hai dong (don gian hon thu tung px)
      let lo = fmin, hi = f5;
      for (let i = 0; i < 6 && hi - lo > 0.8; i++) { const mid = (lo + hi) / 2; if (vua(mid)) lo = mid; else hi = mid; }
      vua(lo);
      return;
    }
    const tu = String(txt).trim().split(/\s+/);
    // khong vua o co san: bo dan TU o dau (giu cac tu cuoi), roi bo dan KY TU o dau cua tu cuoi cung
    for (let k = 1; k < tu.length; k++) { dat('… ' + tu.slice(k).join(' ')); if (vua(fmin)) return; }
    const cs = kyTu(tu[tu.length - 1]);
    for (let k = 2; k < cs.length - 1; k += 2) { dat('…' + cs.slice(k).join('')); if (vua(fmin)) return; }
  }
  function capHien(s, ngan0) {
    const c = st.cap;
    if (!c) return;
    if (s === c.cur) return;
    c.luotHien = c.luot;
    c.cur = s;
    c.tShow = performance.now();
    c.dwell = ngan0 ? 1250 : Math.max(1250, clamp(kyTu(s).length * 52, 1300, 4500) * (c.q.length >= 2 ? 0.55 : 1));
    capVe(s, false);
  }
  /** Lay cau ke tiep trong hang doi (doi du thoi gian dung cua cau truoc) */
  function capChay() {
    const c = st.cap;
    if (!c || !G) return;
    if (c.tm) { c.tm.kill(); c.tm = null; }
    if (!c.q.length) return;
    const cho = c.tShow ? c.dwell - (performance.now() - c.tShow) : 0;
    if (cho > 40) { c.tm = G.delayedCall(cho / 1000, capChay); return; }
    if (c.q.length > 3) c.q.splice(0, c.q.length - 3);
    const s = capKhuLap(c.q.shift());
    const tr = capTrung(s);
    if (tr === '') { c.cur = ''; c.tShow = performance.now(); c.dwell = 1200; capVe('', false); }
    else if ((tr || s) === c.cur) { /* giong het cau dang hien: bo */ }
    else capHien(tr || s);
    if (c.q.length) c.tm = G.delayedCall(Math.max(0.12, c.dwell / 1000), capChay);
  }
  /** Ra phan chu da im lang (giai doan gd 0..2): chi ra cac tu tron ven; gd 2 (im ~5 s) ra not phan con lai */
  function capXa(gd) {
    const c = st.cap;
    if (!c || !G) return;
    const rest = c.raw.slice(c.off);
    const kt = /[.!?。！？…]["'”’)」』]*\s*$/.test(rest.trim());
    let cut = rest.length;
    if (gd < 2 && !kt && !/\s$/.test(rest)) {
      const k = rest.search(/\s\S*$/);
      const dau = k > 0 ? rest.slice(0, k).trim() : '';
      cut = dau.split(/\s+/).filter(Boolean).length >= (gd === 0 ? 2 : 3) && dau.length >= 8 ? k : 0;
    }
    const s = rest.slice(0, cut).trim();
    if (cut) c.off += cut;
    if (s && !(gd === 2 && c.cur && s.split(/\s+/).length < 2)) { c.q.push(s); capChay(); }
    if (c.off < c.raw.length && gd < 2) c.tt = G.delayedCall(gd === 0 ? 1.6 : 2.4, () => { c.tt = null; capXa(gd + 1); });
  }
  /** Loi Sensei song: raw = toan bo luot hien tai */
  function capNhan(raw, luot) {
    const c = st.cap;
    if (!c || !G || !st.tang) return;
    raw = String(raw || '');
    if (luot !== c.luot || !raw.startsWith(c.raw.slice(0, 16))) { c.luot = luot; c.off = 0; c.q = []; c.luotHien = null; }
    c.raw = raw;
    const r = capTach(raw.slice(c.off));
    r.seg.forEach((s) => c.q.push(s));
    c.off += r.consumed;
    if (c.tt) { c.tt.kill(); c.tt = null; }
    const conLai = raw.slice(c.off);
    const tail = conLai.trim();
    if (tail) {
      if (tail.length > 260) {   // mot cau cuc dai chua co dau cau: cat o cho cach gan cuoi (bthg cho het cau roi moi doi)
        const k = tail.lastIndexOf(' ', 250);
        if (k > 50) { c.q.push(tail.slice(0, k).trim()); c.off += (conLai.length - conLai.trimStart().length) + k; }
      } else {
        const kt = /[.!?。！？…]["'”’)」』]*$/.test(tail);
        // cau da co dau cham cuoi: ra sau 0.4 s. Chua co dau cau: cho 1.2 s roi CHI ra phan gom tu tron (giu lai tu dang do);
        // im lang lau hon thi ra them, va sau ~5 s moi ra not phan con lai (khong bao gio ra manh cut giua tu som hon)
        c.tt = G.delayedCall(kt ? 0.4 : 1.2, () => { c.tt = null; capXa(0); });
      }
    }
    // luot moi chua co gi tren hang chu thich: cho xem truoc som (cac tu tron ven dau tien), cau day du thay vao sau
    if (c.luotHien !== c.luot && !c.q.length && tail) {
      const tuT = tail.split(/\s+/);
      if (!/[.!?。！？…]["'”’)」』]*$/.test(tail) && !/\s$/.test(conLai)) tuT.pop();
      if (tuT.length >= 4) { const pv = capKhuLap(tuT.join(' ')).slice(0, 110); const tr = capTrung(pv); capHien(tr === null ? pv : tr, true); }
    }
    capChay();
  }
  /** Dat cau thu cong (the chuong / the ket bai): thay ngay */
  function capDat(txt) {
    const c = st.cap;
    if (!c || !st.tang) return;
    c.q = [String(txt || '')];
    c.luot = null; c.raw = ''; c.off = 0;
    if (c.tt) { c.tt.kill(); c.tt = null; }
    capChay();   // ton trong thoi gian dung toi thieu cua cau dang hien
  }

  // ------------------------------------------------------------------ tang Sensei (co dinh): hang loi 2 dong + o goc meo (ban mau: bong thoai + o meo)
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
    sv('polygon', { points: bp.map((p) => p.join(',')).join(' '), fill: '#fff', stroke: MUC, 'stroke-width': st.bw, 'stroke-linejoin': 'miter' }, svg);
    sv('polygon', { points: cp.map((p) => p.join(',')).join(' '), fill: '#fff', stroke: MUC, 'stroke-width': st.bw, 'stroke-linejoin': 'miter' }, svg);
    // luoi cham + net toc do quanh dau meo
    const bb0 = bbox(cp);
    const cpan = h('div', 'j-tang-meo', el);
    const bbx = Math.floor(bb0.x0), bby = Math.floor(bb0.y0);
    cpan.style.left = bbx + 'px'; cpan.style.top = bby + 'px'; cpan.style.width = (W - bbx) + 'px'; cpan.style.height = (H - bby) + 'px';
    cpan.style.clipPath = 'polygon(' + cp.map((p) => f1(p[0] - bbx) + 'px ' + f1(p[1] - bby) + 'px').join(',') + ')';
    cpan.innerHTML = speedLines(W - bbx, H - bby, (W - bbx) * 0.5, (H - bby) * 0.62, 36 * U, 30 * U, 77, dt ? 50 : 90, 0.014) + '<i class="j-ht ht-goc"></i>';
    const bpan = h('div', 'j-tang-bp', el);
    const by = Math.floor(bT);
    bpan.style.left = '0px'; bpan.style.top = by + 'px'; bpan.style.width = Math.ceil(cLx) + 'px'; bpan.style.height = (H - by) + 'px';
    bpan.style.clipPath = 'polygon(' + bp.map((p) => f1(p[0]) + 'px ' + f1(p[1] - by) + 'px').join(',') + ')';
    bpan.innerHTML = '<i class="j-ht ht-nen"></i>';
    // ten Sensei (the den) nam TREN bong thoai, khong de len chu
    const ten = h('div', 'j-tang-ten', el, 'SENSEI MÈO');
    ten.style.left = Math.round(14 * U) + 'px'; ten.style.top = (by + Math.round(g / 2 + 2 * U)) + 'px';
    // bong thoai co dinh (chu nhat bo tron + duoi chi ve phia meo): KHONG doi kich thuoc theo chu
    const pad = Math.round((dt ? 10 : 22) * U);
    const bxl = Math.round((dt ? 8 : 26) * U), bxr = Math.round(cLx - sl - g - (dt ? 14 : 34) * U);
    const byt = by + Math.round((dt ? 24 : 36) * U), byb = H - Math.round((dt ? 7 : 12) * U);
    const bwid = bxr - bxl, bhei = byb - byt;
    const r = Math.min(bhei / 2, (dt ? 22 : 40) * U);
    const bong = h('div', 'j-bong', el);
    bong.style.left = bxl + 'px'; bong.style.top = byt + 'px'; bong.style.width = (bwid + Math.round(46 * U)) + 'px'; bong.style.height = bhei + 'px';
    const ty = bhei * 0.62, tw2 = Math.min(bhei * 0.32, 22 * U);
    const dNoi = `M${r},0H${bwid - r}A${r},${r} 0 0 1 ${bwid},${r}V${ty - tw2}L${bwid + 40 * U},${ty + 4 * U}L${bwid},${ty + tw2}V${bhei - r}A${r},${r} 0 0 1 ${bwid - r},${bhei}H${r}A${r},${r} 0 0 1 0,${bhei - r}V${r}A${r},${r} 0 0 1 ${r},0Z`;
    bong.innerHTML = `<svg width="${bwid + Math.round(46 * U)}" height="${bhei}" viewBox="0 0 ${bwid + Math.round(46 * U)} ${bhei}" style="overflow:visible"><path d="${dNoi}" fill="#fff" stroke="${MUC}" stroke-width="${Math.max(3, Math.round((dt ? 3 : 5) * U))}" stroke-linejoin="round"/></svg>`;
    const chu = h('div', 'j-bong-chu', bong);
    const cw = Math.max(60, bwid - pad * 2 - Math.round(6 * U)), ch = Math.round(bhei * 0.9);
    chu.style.left = pad + 'px'; chu.style.top = Math.round(bhei * 0.05) + 'px'; chu.style.width = (bwid - pad * 2) + 'px'; chu.style.height = ch + 'px';
    const dong = h('div', 'j-bong-dong', chu);
    st.tang = { el, ten, bong, chu, dong, w: cw, h: ch };
    try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (st.tang && st.tang.dong === dong) capRefit(); }); } catch (e) {}
    if (st.cap) capVe(st.cap.cur == null ? '' : st.cap.cur, true);
  }
  /** Dung lai tang Sensei khi khung / vi tri meo doi (batDau chay truoc khi san khau tran be ngang) */
  function khoiTang() {
    const m = st.meo;
    const k = [st.W, st.H, m ? m.x : -1, m ? m.y : -1].join(',');
    if (st.tangKhoa !== k || !st.tang || !st.tang.el.isConnected) { st.tangKhoa = k; tangHtmlBuild(); }
  }
  /** Cau ngan cua chinh trang, hien o hang chu thich cho toi khi Sensei noi cau dau (thay ba cham) */
  function capMacDinh() {
    const nh = st.nh;
    if (!nh) return 'Sensei Mèo đang chuẩn bị bài giảng…';
    const d = nh.data || {};
    const bai = nh.bai || {};
    if (nh.kind === 'vocab' && nh.laBatDau && !nh.isResume && nh.i === 0 && bai.title && performance.now() - (st.nhT || 0) < 4500) return 'Chào bạn! Sensei Mèo bắt đầu bài học nhé.';   // khong lap tieu de bai dang hien tren trang bia
    if (nh.kind === 'vocab') return 'Từ mới ' + (((nh.chuong && nh.chuong.i) || (nh.i + 1)) + '/' + ((nh.chuong && nh.chuong.n) || nh.n || ''));
    if (nh.kind === 'kanji') return (nh.laKana ? 'Chữ cái ' : 'Chữ Hán ') + (((nh.chuong && nh.chuong.i) || 1) + '/' + ((nh.chuong && nh.chuong.n) || nh.n || ''));
    if (nh.kind === 'grammar-intro') return 'Mẫu câu mới';   // khong lap tieu de da hien tren trang
    if (nh.kind === 'example') return 'Ví dụ ' + (/(\d+\s*\/\s*\d+)\s*$/.exec(String((nh.beat && nh.beat.label) || '')) || ['', ''])[1].replace(/\s+/g, '');
    if (nh.kind === 'kaiwa') return 'Giảng kỹ câu ' + ((nh.chuong && nh.chuong.i) || '') + '/' + ((nh.chuong && nh.chuong.n) || '');
    if (nh.kind === 'kaiwa-intro' || nh.kind === 'kaiwa-run') return 'Hội thoại: ' + (bai.title ? tachTieuDe(bai).ten : '');
    if (nh.kind === 'quiz') return 'Bài tập: đến lượt bạn';
    return 'Sensei Mèo đang chuẩn bị…';
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
  // tro tu doc khac (は へ を): cach doc nam tren dong furigana (rt an san, giu cho) — khong con bong "wa!" de len chu ben canh
  const tokSpan = (g, k) => {
    const doc = g.key && DOC_TRO[g.chu] && !/<ruby/.test(g.html) ? DOC_TRO[g.chu] : '';
    return `<span class="j-tok${g.key ? ' k' : ''}" data-g="${k}" data-i="${g.idx[0]}" data-id="${esc(g.id || '')}" lang="ja">${doc ? `<ruby>${g.html}<rt class="j-rt-doc">${doc}</rt></ruby>` : g.html}</span>`;
  };
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
        G.to(n.bong, { autoAlpha: 0, duration: 0.001, delay: t0, overwrite: 'auto' });
        t0 = r.dur + 0.06;
      }
    });
  }

  // ------------------------------------------------------------------ thanh phan chu dung chung
  /** The den (nhan nho) */
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
  function tachTieuDe(bai) {
    const title = String((bai && bai.title) || '');
    const so = (bai && bai.lessonNumber) || '';
    const ten = title.replace(/^Bài\s*\d+\s*:\s*/, '').split(/\s+—\s+/)[0] || title;
    const phu = title.split(/\s+—\s+/)[1] || '';
    return { so, ten, phu };
  }
  const tachTen = (sp) => {
    const s = String(sp || '').trim();
    const mm = /^(.*?)\s*[(（]([^)）]+)[)）]\s*$/.exec(s);
    return mm ? { jp: mm[1].trim(), la: mm[2].trim() } : { jp: s, la: '' };
  };
  /** Nhan ngan: giu nguyen tu, toi da n ky tu, them … neu bi cat */
  function capTu(t, n) {
    const tu = String(t || '').trim().split(/\s+/);
    let r = '';
    for (const w of tu) { if (kyTu((r + ' ' + w).trim()).length > n) return (r || ngan(w, n)) + (r ? '…' : ''); r = (r + ' ' + w).trim(); }
    return r;
  }

  /**
   * NHAN LON (ban mau: nhan-lon): chu to giua o -> thu ve goc tren-trai (veGoc .65 s power3.inOut, scale .42).
   * cr = hop goc (toa do trang), ctr = tam luc to (toa do trang). chinh -> <b> (bac t3, thu con ~ t5), phu -> <i> den (bac t4).
   */
  function nhanLonTao(c, cr, ctr, chinh, phu) {
    const e = h('div', 'j-nhanlon j-tx', c.noi, `<b>${esc(chinh)}</b>${phu ? `<i>${esc(phu)}</i>` : ''}`);
    e.style.left = f1(cr.x - c.bx) + 'px'; e.style.top = f1(cr.y - c.by) + 'px';
    return { el: e, ctr: ctr || [cr.x + cr.w / 2, cr.y + cr.h / 2], x: cr.x, y: cr.y, cw: cr.w, xong: false };
  }
  /** Dat nhan lon o vi tri to (giua o): transform dich tu goc ve tam */
  function nhanLonTo(nl) {
    const e = nl.el;
    const w0 = e.offsetWidth, h0 = e.offsetHeight;
    const s0 = Math.min(1, (nl.cw || 1e9) * 0.94 / Math.max(1, w0));   // nhan to qua be ngang o -> bat dau nho hon
    G.set(e, { transformOrigin: '0 0', x: nl.ctr[0] - w0 * s0 / 2 - nl.x, y: nl.ctr[1] - h0 * s0 / 2 - nl.y, scale: s0 });
  }
  /** Thu nhan lon ve goc (tre giay) */
  function nhanLonThu(nl, tre) {
    if (!nl || nl.xong) return;
    nl.xong = true;
    if (giam()) { G.set(nl.el, { x: 0, y: 0, scale: 0.42 }); return; }
    G.to(nl.el, { x: 0, y: 0, scale: 0.42, duration: 0.65, ease: 'power3.inOut', delay: tre || 0 });
  }
  /**
   * CHUOI vao cua nhip (ban mau: veGoc cue-.35 roi dap cue): nhan lon thu ve goc (S), noi dung nhan dien hien sau do (fn).
   * Chay MOT lan: cue dau tien cua nhip (S = tre cue - .35) hoac du phong 0.5 s sau khi vao nhip — khong bao gio de trong.
   */
  function nhanLonLich(m, nl, fn) {
    if (!nl) return;
    (m.nhanLons = m.nhanLons || []).push(nl);
    nhanLonTo(nl);
    if (m.ngay) { m.chuoiXong = true; nl.xong = true; G.set(nl.el, { x: 0, y: 0, scale: 0.42 }); return; }
    if (giam()) { m.chuoiXong = true; nhanLonThu(nl, 0); if (fn) fn(0); return; }
    m.chuoiFn = (S) => { nhanLonThu(nl, S); if (fn) fn(S); };
    m.chuoiXong = false;
    m.hChuoi = m.hen(() => chuoi(m, 0), st.pages.length > 1 ? 500 : 150);   // trang dau (khong co vet muc quet) khong can cho
  }
  function chuoi(m, S) {
    if (!m || m.chuoiXong || !m.chuoiFn) return;
    m.chuoiXong = true;
    if (m.hChuoi) { m.huy(m.hChuoi); m.hChuoi = null; }
    m.chuoiMo = G.globalTimeline.time() + (S || 0) + 0.4;   // truoc moc nay nhan lon chua roi di: noi dung nhan dien khong duoc hien
    m.chuoiFn(S || 0);
  }
  /** Tre (giay) cua mot noi dung hien theo cue: khong som hon luc nhan lon da roi di */
  function sauChuoi(m, tre) {
    const k = m && m.chuoiMo ? m.chuoiMo - G.globalTimeline.time() : 0;
    return Math.max(tre || 0, k);
  }

  // ---- headword: 1 dong (co ruby) hoac 2 dong cho tu dai; bac t1..t2 roi ha lien tuc toi san
  function tachKanjiYomi(v) {
    const tu = String(v.kanji || v.word || '');
    const coRuby = !!(v.kanji && v.furigana && v.furigana !== v.kanji);
    return { tu, coRuby, yomi: String(v.furigana || v.word || '') };
  }
  function fitHeadword(hw, tu, coRuby, yomi, w, hh) {
    const cs = kyTu(tu), n = cs.length;
    const html1 = `<span class="j-hw-i">${coRuby ? C.ruby(tu, yomi) : esc(tu)}</span>`;
    const dat = (html, dong) => {
      hw.innerHTML = html;
      hw.firstElementChild.style.whiteSpace = 'nowrap';
      hw.style.width = Math.floor(w) + 'px';
      hw.style.lineHeight = dong > 1 ? '1.02' : '';
      const fm = st.san.hw * (coRuby ? 0.8 : 0.6);
      let f = tk(1);
      hw.style.fontSize = f + 'px';
      const ok = () => hw.scrollWidth <= w + 0.6 && hw.offsetHeight <= hh + 0.6;
      if (ok()) return f;
      const k = Math.min(w / Math.max(1, hw.scrollWidth), hh / Math.max(1, hw.offsetHeight));
      f = Math.max(fm * 0.4, f * k * 0.99);
      hw.style.fontSize = f1(f) + 'px';
      if (!ok()) { f *= Math.min(w / hw.scrollWidth, hh / hw.offsetHeight) * 0.98; hw.style.fontSize = f1(f) + 'px'; }
      return f;
    };
    let f = dat(html1, 1), dong2 = false;
    if (n >= 5) {
      const half = Math.ceil(n / 2);
      const f2 = dat(`<span class="j-hw-i">${esc(cs.slice(0, half).join(''))}<br>${esc(cs.slice(half).join(''))}</span>`, 2);
      if (f2 > f * 1.15) { f = f2; dong2 = true; } else f = dat(html1, 1);
    }
    return { f, dong2 };
  }


  // ------------------------------------------------------------------ duong cat (dung cho moi bo cuc; toa do that)
  const dV = (xt, xb) => [xt, 0, xb, st.Yb];                 // gan doc: xt tai y = 0, xb tai y = Yb
  const dN = (yl, yr) => [0, yl, st.W, yr];                   // gan ngang: yl o mep trai, yr o mep phai
  const pad0 = () => Math.round((st.dt ? 12 : 22) * st.U);
  /** Co chu cho khoi shrink-wrap (max-width): bac giam dan roi ha lien tuc toi san; kiem ca chieu cao */
  function fitBacMax(box, maxW, maxH, bac, fmin) {
    box.style.maxWidth = Math.floor(maxW) + 'px';
    const ok = () => box.scrollWidth <= maxW + 0.6 && box.offsetHeight <= maxH + 0.6;
    for (let i = 0; i < bac.length; i++) { box.style.fontSize = bac[i] + 'px'; if (ok()) return bac[i]; }
    let lo = fmin, up = bac[bac.length - 1];
    box.style.fontSize = lo + 'px';
    if (!ok()) { box.style.overflowWrap = 'anywhere'; return lo; }   // cuc chot: tu qua dai so voi san -> cho phep ngat tu
    for (let i = 0; i < 9 && up - lo > 0.6; i++) { const mid = (lo + up) / 2; box.style.fontSize = mid + 'px'; if (ok()) lo = mid; else up = mid; }
    box.style.fontSize = f1(lo) + 'px';
    return lo;
  }

  // ================================================================== DUNG TUNG DANG NHIP
  // ---- bia (mo dau buoi giang): ban mau trang 0
  function layBia() {
    const { W, Yb } = st;
    if (st.dt) {
      const yA = Math.round(Yb * 0.44), yB = Math.round(Yb * 0.86), s = Math.round(W * 0.03);
      const l1 = dN(yA + s, yA - s), l2 = dN(yB - s * 0.6, yB + s * 0.6);
      return { A: cell([l1], [W / 2, 10], Yb), B: cell([l1, l2], [W / 2, (yA + yB) / 2], Yb), E: cell([l2], [W / 2, Yb - 10], Yb) };
    }
    const ln = [px(1150), -80, px(1040), Yb];
    return { A: cell([ln], [px(400), py(300)]), B: cell([ln], [px(1600), py(300)]), E: null };
  }
  function dungBia(nh, api, m, T) {
    const bai = nh.bai || {};
    const tt = tachTieuDe(bai);
    const lay = layBia();
    const pd = pad0();
    const A = addCell(T, 'A', lay.A);
    const B = addCell(T, 'B', lay.B);
    const E = lay.E ? addCell(T, 'E', lay.E) : null;
    // A: tranh canh bai (giu mau), SFX "第N話" o canh phai (ban mau: ペコリ)
    datAnh(A, bai.sceneImageUrl || null, { pos: '50% 40%', thay: bai.lessonNumber ? '第' + bai.lessonNumber + '話' : 'マンガ', ht: 'ht-duoi' });
    const coCanh = !!bai.sceneImageUrl;
    const sfx = h('div', 'j-sfx j-sfx-a j-cho', A.noi, `<span data-t="第${esc(tt.so)}話">第${esc(tt.so)}話</span>`);
    sfx.lang = 'ja';
    sfx.dataset.cho = 'SFX'; sfx.dataset.fx = 'nay'; sfx.dataset.s = '0.5';
    if (!coCanh) sfx.style.display = 'none';
    sfx.style.fontSize = tk(3) + 'px';
    {
      const cr = crOf(A.poly, pd);
      sfx.style.right = f1(A.bx + A.bw - (cr.x + cr.w)) + 'px'; sfx.style.top = f1(cr.y - A.by + cr.h * 0.18) + 'px';
    }
    // B: logo (pha 1) -> BAI N + tieu de + chips (pha 2) — ban mau: logo thu 0.5 len tren, no BAI N, quet tieu de, chips truot len
    const crB = crOf(B.poly, pd);
    veLopNet(B, crB, 11, st.dt ? 60 : 130);
    const wrap = nhet(B, crB, 'j-bia-b');
    const logo = h('div', 'j-logo j-tx', wrap, `<b>SENSEI MÈO</b><span lang="ja">マンガで学ぶ日本語</span><i>第${esc(tt.so)}話 · TIẾNG NHẬT ${esc(nh.capDo === 'KANA' ? 'NHẬP MÔN' : nh.capDo || '')}</i>`);
    logo.querySelector('b').style.fontSize = f1(Math.min(tk(3), crB.w / 6.6)) + 'px';
    logo.querySelector('span').style.fontSize = tk(5) + 'px';
    logo.querySelector('i').style.fontSize = tk(6) + 'px';
    const p2 = h('div', 'j-bia-2', wrap);
    const wmH = Math.round(tk(3) * 0.5);
    p2.style.paddingTop = wmH + 'px';
    const cum = (tt.phu || '').split(/[\/／]/).map((x) => x.trim()).filter(Boolean).slice(0, 5);
    const chipsH = cum.length ? Math.round(tk(6) * 2.1) : 0;
    const bW = Math.min(crB.w, Math.round(tk(1) * 3.1)), bH = Math.round(Math.min(bW * 0.32, crB.h * 0.3));
    const bst = h('div', 'j-bia-bai j-tx', p2, burstSvg(bW, bH, 5, { n: 24, jit: 0.3 }) + `<b class="j-bia-bai-t">BÀI ${esc(tt.so)}</b>`);
    bst.style.width = bW + 'px'; bst.style.height = bH + 'px';
    fitDong(bst.lastChild, bW * 0.72, bacTu(1, 2), tk(3));
    const td = h('div', 'j-bia-td j-tx', p2, jp(tt.ten));
    p2.style.gap = Math.round(pd * 0.5) + 'px';
    const hAvail = crB.h - wmH - bH - chipsH - pd * 1.1;
    fitBac(td, crB.w, Math.max(40, hAvail), bacTu(3, 4), st.san.nghia);
    let chips = null;
    if (cum.length) {
      chips = h('div', 'j-chips j-tx', p2, cum.map((x) => `<span class="j-chip" lang="ja">${esc(x)}</span>`).join(''));
      chips.style.fontSize = tk(6) + 'px';
      chips.style.maxWidth = Math.floor(crB.w) + 'px';
      while (chips.children.length > 2 && chips.scrollHeight > chipsH * 1.35) chips.lastElementChild.remove();
    }
    G.set(p2, { autoAlpha: 0 });
    // E (dien thoai): hang chip phu
    if (E) { const crE = crOf(E.poly, Math.round(pd * 0.6)); const ec = nhet(E, crE, 'j-bia-e'); if (cum.length) { ec.innerHTML = '<div class="j-chips j-tx">' + cum.map((x) => `<span class="j-chip" lang="ja">${esc(x)}</span>`).join('') + '</div>'; ec.firstChild.style.fontSize = tk(6) + 'px'; if (chips) chips.style.display = 'none'; } }
    m.bia = { logo, p2, bst, td, chips, B, sfx };
    camTuc(T, B.cx, B.cy);
    m.fase = 'bia';
    if (!m.ngay) m.hen(() => { if (m.vivo && m.bia) hieu(sfx, 0, 'nay'); }, 700);
    else hienNgay(sfx);
  }
  function biaSangBai(m, tre) {
    const b = m.bia;
    if (!b || m.baiDaHien) return;
    m.baiDaHien = true;
    if (giam()) { G.set(b.logo.querySelectorAll('span, i'), { autoAlpha: 0 }); G.set(b.logo, { scale: 0.6, y: -b.logo.offsetHeight * 0.4 }); G.set(b.p2, { autoAlpha: 1 }); return; }
    const t0 = tre || 0;
    // logo thu nho len dau o (ban mau: veGoc .65 s) chi con chu thuong hieu, BAI N no ra (back.out), tieu de quet, chips truot len
    {
      const wm = b.logo.querySelector('b'), rb = wm.getBoundingClientRect(), rw = b.logo.parentNode.getBoundingClientRect();
      const dy = (rw.top + Math.round(tk(3) * 0.31)) - (rb.top + rb.height / 2);
      G.to(b.logo.querySelectorAll('span, i'), { autoAlpha: 0, duration: 0.2, delay: t0 });
      G.to(b.logo, { scale: 0.6, y: dy, transformOrigin: '50% ' + Math.round(rb.height / 2 + (rb.top - b.logo.getBoundingClientRect().top)) + 'px', duration: 0.65, ease: 'power3.inOut', delay: t0 });
    }
    G.set(b.p2, { autoAlpha: 1 });
    G.fromTo(b.bst, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.55, ease: 'back.out(2.2)', delay: t0 + 0.2 });
    G.fromTo(b.td, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(-4% -4% -4% -4%)', duration: 0.5, ease: 'power3.inOut', delay: t0 + 0.55, clearProps: 'clipPath', onStart: capKiemLai });
    G.set(b.td, { autoAlpha: 1 });
    if (b.chips) G.fromTo(b.chips, { y: 20 * st.sx, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', delay: t0 + 1.0 });
    camDen(m.T, 'B', t0 + 0.2, st.camS + 0.005);
  }

  // ---- tu vung: ban mau trang tu vung (watashi / gakusei): A anh + hop nghia, B tu vung lon, C can canh
  function layTuVung(bien, n) {
    const { W, Yb } = st;
    const pd = pad0();
    if (st.dt) {
      const yA = Math.round(Yb * 0.26), yB = Math.round(Yb * 0.66), s = Math.round(W * 0.028);
      const l1 = dN(yA - s, yA + s), l2 = dN(yB + s * 0.6, yB - s * 0.6);
      return { A: cell([l1], [W / 2, 10], Yb), B: cell([l1, l2], [W / 2, (yA + yB) / 2], Yb), C: cell([l2], [W / 2, Yb - 10], Yb), bien: 0 };
    }
    const s = W * 0.019;
    const need = Math.max(1, n) * tk(1) * 0.9 + 2 * (st.mx + pd) + 24 * st.U;
    const yBc = Math.round(Yb * 0.72), wob = W * 0.008;
    if (bien === 0) {
      const xa = clamp(W - need, W * 0.3, W * 0.6);
      const l1 = dV(xa - s, xa + s), l2 = [xa - s, yBc + wob, W, yBc - wob];
      return { A: cell([l1], [10, 10]), B: cell([l1, l2], [W - 10, 10]), C: cell([l1, l2], [W - 10, Yb - 10]), bien };
    }
    const xb = clamp(need, W * 0.4, W * 0.7);
    const l1 = dV(xb + s, xb - s), l2 = [0, yBc - wob, xb + s, yBc + wob];
    return { A: cell([l1], [W - 10, 10]), B: cell([l1, l2], [10, 10]), C: cell([l1, l2], [10, Yb - 10]), bien };
  }
  function dungTuVung(nh, api, m, T, opt) {
    opt = opt || {};
    const v = nh.data || {};
    const c = nh.chuong || {};
    const { tu, coRuby, yomi } = tachKanjiYomi(v);
    const n = kyTu(tu).length;
    const bien0 = st.dt ? 0 : ((((c.i ? c.i - 1 : nh.i || 0)) + (m.lech || 0)) % 2);
    const lay = layTuVung(bien0, n);
    const bien = lay.bien;
    const pd = pad0();
    const A = addCell(T, 'A', lay.A);
    const B = addCell(T, 'B', lay.B);
    const Cc = addCell(T, 'C', lay.C);
    const urlAnh = v.imageUrl || (nh.bai && nh.bai.sceneImageUrl) || null;
    const nghiaChinh = tachNghia(v.meaningVi)[0] || String(v.meaningVi || '');
    const ghi = v.accentNote ? ngan(boNgoacCuoi(v.accentNote), 64) : '';
    const loaiC = C.loaiTu(v.wordType);
    // ---- A: minh hoa (giu mau); hop nghia + ghi chu nam tren anh (ban mau)
    datAnh(A, urlAnh, { pos: '50% 38%', thay: '', ht: bien ? 'ht-trai' : 'ht-duoi', kb: true });
    const crA = crOf(A.poly, Math.round(pd * 0.9));
    if (!urlAnh) {
      const cs0 = kyTu(tu);
      const dau = cs0.find((x) => /[一-鿿぀-ヿ]/.test(x)) || cs0[0] || '?';
      taoHopNet(A, crOf(A.poly, Math.round(pd * 0.8)), [dau], m, 0);
      m.hVe = m.hen(() => veNetM(m, 0), 1600);
    }
    // nghia: hop chu nhat trang vien muc; nhan "NGHĨA" + chu to (bac t2 -> t4, san 44)
    const ng = nhet(A, crA, 'j-stack');
    ng.style.alignItems = bien ? 'flex-end' : 'flex-start'; ng.style.justifyContent = 'flex-start';
    const hop = h('div', 'j-hop', ng);
    h('span', 'j-the', hop, 'NGHĨA' + (loaiC && loaiC.length <= 8 ? ' · ' + chuHoa(loaiC) : ''));
    const nghiaEl = h('div', 'j-nghia j-tx', hop, jp(nghiaChinh));
    const chuaHien = !m.rev.has('V3') && !opt.ngay;
    hop.setAttribute('data-cho', 'V3'); hop.dataset.fx = 'truot'; hop.dataset.dx = String(bien ? 50 : -50);
    if (chuaHien) hop.classList.add('j-cho');
    const padHop = Math.round(18 * st.U) * 2;
    const maxW = Math.min(crA.w * (st.dt ? 0.9 : 0.9), st.W * (st.dt ? 0.9 : 0.30));
    const tagHop = Math.round(tk(6) * 2.5);
    fitBacMax(nghiaEl, maxW - padHop, Math.max(tk(4) * 1.2, crA.h * (st.dt ? 0.62 : 0.5) - tagHop - Math.round(24 * st.U)), bacTu(2, 4), st.san.nghia);
    if (ghi) {
      const gh = h('div', 'j-hop-den j-tx', ng, jp(ghi));
      gh.setAttribute('data-cho', 'V4'); gh.dataset.fx = 'quet';
      if (!m.rev.has('V4') && !opt.ngay) gh.classList.add('j-cho');
      gh.style.fontSize = tk(6) + 'px';
      gh.style.maxWidth = Math.floor(maxW) + 'px';
      if (hop.offsetHeight + gh.offsetHeight + Math.round(14 * st.U) > crA.h) gh.style.display = 'none';   // khong con cho (cot anh thap): bo ghi chu, giu nghia
    }
    // ---- B: nhan lon -> goc + tu vung (RAT to) + cach doc
    const crB = crOf(B.poly, pd);
    veLopNet(B, crB, 21 + (bien ? 3 : 0), st.dt ? 56 : 120);
    const soTu = `${String(c.i || nh.i + 1).padStart(2, '0')}/${String(c.n || nh.n).padStart(2, '0')}`;
    const nl = nhanLonTao(B, { x: crB.x, y: crB.y, w: crB.w, h: crB.h }, null, 'TỪ MỚI', soTu);
    const tagH = Math.round(tk(5) * 1.45);
    const romH = v.romaji ? Math.round(tk(5) * 1.3) : 0;
    const wB = nhet(B, { x: crB.x, y: crB.y + tagH, w: crB.w, h: crB.h - tagH }, 'j-vb');
    const hwBox = h('div', 'j-hw j-tx', wB);
    hwBox.lang = 'ja';
    const romaji = h('div', 'j-romaji j-tx', wB, esc(v.romaji || ''));
    if (!v.romaji) romaji.style.display = 'none';
    else fitDong(romaji, crB.w * 0.96, [tk(5)], st.san.phu);
    const hw = fitHeadword(hwBox, tu, coRuby, yomi, crB.w, crB.h - tagH - romH - pd * 0.3);
    if (hw.dong2 && coRuby) {
      romaji.textContent = v.romaji || yomi;
      romaji.style.display = '';
      romaji.lang = v.romaji ? 'en' : 'ja';
      fitDong(romaji, crB.w * 0.96, [tk(5)], st.san.phu);
      if (romaji.scrollWidth > crB.w * 0.96 + 0.6) { romaji.style.whiteSpace = 'normal'; romaji.style.textAlign = 'center'; romaji.style.fontSize = f1(Math.max(st.san.phu, tk(5) * 0.7)) + 'px'; }
    }
    vuaKhung(hwBox, wB, st.san.hw * 0.3);
    hwBox.setAttribute('data-cho', 'HW'); hwBox.dataset.fx = 'dap'; hwBox.dataset.s = '1.7'; hwBox.dataset.d = '0.55';
    romaji.setAttribute('data-cho', 'RD'); romaji.dataset.fx = 'truot'; romaji.dataset.dy = '-12';
    if (!m.rev.has('HW') && !opt.ngay) hwBox.classList.add('j-cho');
    if (!m.rev.has('RD') && !opt.ngay) romaji.classList.add('j-cho');
    // loai tu: nhan nho canh nhan lon (the den phu)
    // ---- C: can canh cung minh hoa (ban mau: anh phong to) — khong chu
    datAnh(Cc, urlAnh, { pos: '50% 30%', thay: urlAnh ? '' : (kyTu(tu)[1] || kyTu(tu)[0] || ''), ht: bien ? 'ht-trai' : 'ht-duoi', zoom: urlAnh ? { s: 2.3, o: '50% 24%' } : null });
    m.vc = { hw: hwBox, ng: hop };
    m.fase = 'tu';
    camTuc(T, B.cx, B.cy);
    // nhan lon -> goc, roi tu vung no ra (ban mau: veGoc cue - .35, dap cue)
    nhanLonLich(m, nl, (S) => { hienKhoa(m, 'HW', S + 0.4); hienKhoa(m, 'RD', S + 0.65); });
    if (opt.ngay) { hienNgay(hwBox); hienNgay(romaji); }
    if (m.net && (opt.ngay || m.daVe)) { const dv = m.daVe; m.daVe = false; veNetM(m, 0, true); m.daVe = dv || true; }
    if (!opt.ngay && chuaHien) m.hNghia = m.hen(() => cueVocab(m, 'V3', null), 3200);
  }
  function cueVocab(m, id, tt) {
    const T = m.T;
    if (!T || !m.vc || m.fase !== 'tu') return;
    const tre = tt ? m.api.tre(tt) : 0;
    chuoi(m, id === 'V0' ? tre : Math.max(0, tre - 0.35));
    if (id === 'V1' || id === 'V2' || id === 'V2b') {
      if (m.net && id === 'V1') { if (m.hVe != null) m.huy(m.hVe); veNetM(m, tre + 0.1); }
      hienKhoa(m, 'HW', tre); hienKhoa(m, 'RD', tre);
      camDen(T, 'B', tre);
      nhan(T, 'B', tre);
      if (id === 'V1' && !m.rev.has('V3')) { if (m.hNghia != null) m.huy(m.hNghia); m.hNghia = m.hen(() => cueVocab(m, 'V3', null), 1800 + Math.round(tre * 1000)); }
    } else if (id === 'V3') {
      if (m.hNghia != null) { m.huy(m.hNghia); m.hNghia = null; }
      const co = hienKhoa(m, 'V3', tre);
      if (co || tt) tieuDiem(T, 'A', tre);
    } else if (id === 'V4' || id === 'V5') {
      hienKhoa(m, 'V4', tre);
      tieuDiem(T, 'A', tre);
    } else if (id === 'V0') {
      nhan(T, 'B', tre);
    }
  }


  // ---- chu Han / chu cai (kana): A khung viet net, B Han Viet + nghia, C am doc / meo nho, D tu ghep (mot tu mot lan)
  /** Cat bot tu o cuoi (them …) cho toi khi khoi chu vua hop o co chu `f` (khong bao gio ha duoi san) */
  function catDeVua(el, txt, maxW, maxH, f, htmlFn) {
    const html = htmlFn || ((s) => jp(s));
    el.style.fontSize = f + 'px';
    const ok = () => el.scrollWidth <= maxW + 0.6 && el.offsetHeight <= maxH + 0.6;
    el.innerHTML = html(txt);
    if (ok()) return txt;
    const tu = String(txt).trim().split(/\s+/);
    if (tu.length > 1) {
      for (let k = tu.length - 1; k >= 1; k--) { const s0 = tu.slice(0, k).join(' '); const s = /[.!?。！？]$/.test(s0) ? s0 : s0.replace(/[,;:、]+$/, '') + '…'; el.innerHTML = html(s); if (ok()) return s; }
    }
    const cs = kyTu(txt);
    for (let k = cs.length - 1; k >= 2; k--) { const s = cs.slice(0, k).join('') + '…'; el.innerHTML = html(s); if (ok()) return s; }
    return txt;
  }
  function layChuHan(kana) {
    const { W, Yb } = st;
    const s = W * 0.02, wob = W * 0.008;
    if (st.dt) {
      const yA = Math.round(Yb * (kana ? 0.39 : 0.43)), yB = Math.round(Yb * (kana ? 0.62 : 0.61)), yC = Math.round(Yb * (kana ? 0.78 : 0.76)), t = Math.round(W * 0.026);
      const l1 = dN(yA + t, yA - t), l2 = dN(yB - t * 0.7, yB + t * 0.7), l3 = dN(yC + t * 0.6, yC - t * 0.6);
      return { A: cell([l1], [W / 2, 10], Yb), B: cell([l1, l2], [W / 2, (yA + yB) / 2], Yb), C: cell([l2, l3], [W / 2, (yB + yC) / 2], Yb), D: cell([l3], [W / 2, Yb - 10], Yb) };
    }
    const xa = W * 0.34;
    const y1 = Math.round(Yb * (kana ? 0.42 : 0.4)), y2 = Math.round(Yb * (kana ? 0.7 : 0.68));
    const l1 = dV(xa + s, xa - s), l2 = [xa - s, y1 + wob, W, y1 - wob], l3 = [xa - s, y2 - wob, W, y2 + wob];
    return {
      A: cell([l1], [10, 10]),
      B: cell([l1, l2], [W - 10, 10]),
      C: cell([l1, l2, l3], [W - 10, (y1 + y2) / 2]),
      D: cell([l1, l3], [W - 10, Yb - 10]),
    };
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
    // ---- A: khung viet net (luoi + net mo + net ve dan) — chi khung, khong chu
    const crA = crOf(A.poly, pd);
    taoHopNet(A, crA, kyTu(ch), m, 0);
    // ---- B: nhan lon -> goc; Han Viet / cach doc (RAT to, in nghieng) + nghia
    const crB = crOf(B.poly, pd);
    veLopNet(B, crB, 31, st.dt ? 50 : 100);
    const soTu = `${String(c.i || 1).padStart(2, '0')}/${String(c.n || nh.n).padStart(2, '0')}`;
    const nl = nhanLonTao(B, { x: crB.x, y: crB.y, w: crB.w, h: crB.h }, null, kana ? 'CHỮ CÁI' : 'CHỮ HÁN', soTu + (!kana && d.strokeCount ? ' · ' + d.strokeCount + ' NÉT' : ''));
    const tagH = Math.round(tk(5) * 1.45);
    const wB = nhet(B, { x: crB.x, y: crB.y + tagH, w: crB.w, h: crB.h - tagH }, 'j-kb');
    const ten = String((kana ? d.romaji : d.hanViet) || '');
    const hang2 = h('div', 'j-kb-hang', wB);
    const hv = h('div', 'j-hv j-tx', hang2, esc(ten));
    hv.dataset.cho = 'HW'; hv.dataset.fx = 'dap'; hv.dataset.s = '1.7'; hv.dataset.d = '0.55';
    if (!m.rev.has('HW') && !opt.ngay) hv.classList.add('j-cho');
    const nghia = h('div', 'j-kb-nghia j-tx', hang2);
    nghia.innerHTML = `<span${ck(m, 'K3', 'quet')}>${jp(ngan(d.meaningVi || '', kana ? 80 : 70))}</span>`;
    {
      const wRow = crB.w, hRow = crB.h - tagH;
      hv.style.fontStyle = 'italic';
      fitDong(hv, wRow * (kana ? 0.5 : 0.44), kana ? bacTu(1, 2) : bacTu(2, 2), st.san.hw * 0.6);
      const gap = pd * 0.9;
      const wNg = Math.max(40, wRow - hv.offsetWidth - gap);
      const sp = nghia.firstElementChild;
      sp.style.display = 'block';
      const txt0 = ngan(d.meaningVi || '', kana ? 80 : 70);
      const f0 = fitBac(nghia, wNg, hRow, bacTu(4, 4), st.san.nghia);
      if (nghia.scrollHeight > hRow + 0.6 || nghia.scrollWidth > wNg + 0.6) catDeVua(sp, txt0, wNg, hRow, f0);
    }
    // ---- C: doc On / Kun (kanji) hoac meo nho (kana)
    const crC = crOf(Cc.poly, Math.round(pd * 0.8));
    const wC = nhet(Cc, crC, 'j-kc');
    if (kana) {
      const meo = h('div', 'j-kc-meo j-tx', wC);
      const txt0 = String(d.meoNho || d.meaningVi || '');
      meo.innerHTML = '<b class="j-mo">MẸO NHỚ</b> ' + jp(txt0);
      const f0 = fitBac(meo, crC.w, crC.h, bacTu(4, 5), Math.max(st.san.phu, st.dt ? 15 : 28));
      if (meo.scrollHeight > crC.h + 0.6) catDeVua(meo, txt0, crC.w, crC.h, f0, (s) => '<b class="j-mo">MẸO NHỚ</b> ' + jp(s));
    } else {
      const on = dsMang(d.onyomi).slice(0, 2).join('、'), kun = dsMang(d.kunyomi).slice(0, 2).join('、');
      const cols = h('div', 'j-am j-tx', wC);
      const mk1 = (nhanT, txt) => `<div class="j-am-c"><b class="j-am-n">${nhanT}</b><span lang="ja" class="j-am-t">${esc(txt)}</span></div>`;
      cols.innerHTML = (on ? mk1('ON', on) : '') + (kun ? mk1('KUN', kun) : '') + (!on && !kun ? mk1('ÂM', '—') : '');
      const fitCols = () => fitBac(cols, crC.w * 0.94, crC.h, bacTu(3, 4), st.san.nghia);
      fitCols();
      if (cols.scrollHeight > crC.h + 0.6 || cols.scrollWidth > crC.w * 0.94 + 0.6) {   // van tran o san: bo cach doc romaji trong ngoac, roi chi giu am dau cua moi loai
        const gon = (x) => String(x).split('、').map((z) => z.replace(/\s*[(（][^)）]*[)）]/g, '').trim()).filter(Boolean);
        const on2 = gon(on), kun2 = gon(kun);
        cols.innerHTML = (on2.length ? mk1('ON', on2.join('、')) : '') + (kun2.length ? mk1('KUN', kun2.join('、')) : '') + (!on2.length && !kun2.length ? mk1('ÂM', '—') : '');
        fitCols();
        if (cols.scrollHeight > crC.h + 0.6 || cols.scrollWidth > crC.w * 0.94 + 0.6) { cols.innerHTML = (on2.length ? mk1('ON', on2[0]) : '') + (kun2.length ? mk1('KUN', kun2[0]) : '') + (!on2.length && !kun2.length ? mk1('ÂM', '—') : ''); fitCols(); }
      }
    }
    // ---- D: tu ghep / tu vi du — MOT tu tai mot thoi diem (doi theo cue K7.i); co chu chung de doi tu khong nhay co
    const crD = crOf(Dd.poly, Math.round(pd * 0.8));
    const wD = nhet(Dd, crD, 'j-kd');
    const tu = dsMang(d.commonWords).slice(0, 3);
    m.tuL = tu;
    const ds = h('div', 'j-tu-ds j-tx', wD);
    const mkTu = (w) => `<div class="j-tu"><span class="j-tu-w" lang="ja">${C.ruby(w.word || '', w.furigana || '')}</span><span class="j-tu-n">${esc(ngan(boNgoacCuoi(w.meaningVi || ''), 40))}</span></div>`;
    m.tuMk = (k) => (tu[k] ? mkTu(tu[k]) : '');
    let fTu = tk(3);
    if (tu.length) {
      fTu = 1e9;
      tu.forEach((w, k) => { ds.innerHTML = mkTu(tu[k]); fTu = Math.min(fTu, fitBac(ds, crD.w, crD.h, bacTu(3, 4), st.san.nghia)); });
      ds.innerHTML = mkTu(tu[0]);
      ds.style.fontSize = f1(fTu) + 'px';
      m.tuFit = (k) => { ds.innerHTML = mkTu(tu[k]); ds.style.fontSize = f1(fTu) + 'px'; };
    } else ds.style.display = 'none';
    m.tuDs = ds;
    m.tuK = 0;
    m.fase = 'kj';
    camTuc(T, A.cx, A.cy);
    nhanLonLich(m, nl, (S) => hienKhoa(m, 'HW', S + 0.4));
    if (opt.ngay) hienNgay(hv);
    if (opt.ngay || m.daVe) { m.daVe = false; veNetM(m, 0, true); m.daVe = true; }
    else {
      m.hVe = m.hen(() => veNetM(m, 0), 1400);
      if (!m.rev.has('K3')) m.hNghia = m.hen(() => cueChuHan(m, 'K3', null), 3000);
    }
  }
  function cueChuHan(m, id, tt) {
    const T = m.T;
    if (!T || m.fase !== 'kj') return;
    const tre = tt ? m.api.tre(tt) : 0;
    const kana = !!m.nh.laKana;
    chuoi(m, id === 'K0' ? tre : Math.max(0, tre - 0.35));
    if (id === 'K0') nhan(T, 'A', tre);
    else if (id === 'K1' || id === 'K1b') { camDen(T, 'A', tre); if (m.hVe != null) m.huy(m.hVe); veNetM(m, tre); nhan(T, 'A', tre); }
    else if (id === 'K2') { hienKhoa(m, 'HW', tre); camDen(T, 'B', tre); nhan(T, 'B', tre); }
    else if (id === 'K3') { if (m.hNghia != null) m.huy(m.hNghia); hienKhoa(m, 'K3', tre); tieuDiem(T, 'B', tre); }
    else if (id === 'K4') tieuDiem(T, kana ? 'C' : 'A', tre);
    else if (id === 'K5') { tieuDiem(T, 'C', tre); if (!kana) danhDau(T.cells.C.noi.querySelector('.j-am-c:first-child .j-am-t'), tre); }
    else if (id === 'K6') { tieuDiem(T, 'C', tre); danhDau(T.cells.C.noi.querySelector('.j-am-c:last-child .j-am-t'), tre); }
    else if (/^K7\.\d+$/.test(id)) {
      const k = +id.split('.')[1];
      camDen(T, 'D', tre);
      nhan(T, 'D', tre);
      if (m.tuDs && m.tuFit && m.tuL && m.tuL[k] && m.tuK !== k) {
        m.tuK = k;
        const ds = m.tuDs;
        const dat = () => { m.tuFit(k); capKiemLai(); const e = ds.firstChild; if (e && !giam()) G.fromTo(e, { clipPath: 'inset(-4% 100% -4% -4%)' }, { clipPath: 'inset(-40% -40% -40% -40%)', duration: 0.3, ease: 'power3.inOut', clearProps: 'clipPath' }); };
        if (tre > 0.02) m.hen(dat, Math.round(tre * 1000)); else dat();
      }
    }
  }
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
          out.push({ loai: 'chu', j: jc++, t: ngan(e.chu, 8), cap: ngan(C.vaiTro(e.chu) || '', 20), key: true, doc: DOC_TRO[e.chu] || '', jp: true });
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
      const vs = fm2.split(/\s*[\s　]vs[\s　]\s*/i).map((x) => x.trim()).filter(Boolean);
      if (vs.length >= 2 && vs.length <= 4) parts = vs;
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
      const mk = /^(.{1,18}?)\s*[:：]\s*(.+)$/.exec(main);
      if (mk && RE_JP.test(mk[1]) && kyTu(mk[2]).length >= 4) { capX = mk[2].trim() + (note ? ' · ' + note : ''); main = mk[1].trim(); }
      if (!laJp && kyTu(main).length > 12) {
        const ws = main.split(/[\s/]+/);
        let t2 = '';
        for (const w of ws) { if (kyTu((t2 + ' ' + w).trim()).length > 12) break; t2 = (t2 + ' ' + w).trim(); }
        if (!t2) t2 = ngan(ws[0], 12);
        capX = ngan(main.slice(t2.length).replace(/^[\s/]+/, '') + (note ? ' · ' + note : ''), 40);
        main = t2;
      } else if (kyTu(main).length > 8 && laJp) main = ngan(main, 8);
      else if (kyTu(main).length > 12) main = ngan(main, 12);
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

  /**
   * Bo cuc mau cau (ban mau trang 4): F (cong thuc, rong het) tren; hang o vai tro P0..P(np-1) duoi (minh hoa + nhan ngan).
   * Dien thoai: hang o vai tro chiem het chieu ngang duoi F.
   */
  function layNguPhap(hF, np) {
    const { W, Yb } = st;
    const t = Math.round(W * (st.dt ? 0.022 : 0.008));
    const lF = dN(hF + t, hF - t);
    const sl = W * (st.dt ? 0.03 : 0.0135);
    const out = { F: cell([lF], [W / 2, 10], Yb) };
    const seps = [];
    for (let k = 1; k < np; k++) { const x = W * k / np; seps.push([x + sl, 0, x - sl, Yb]); }
    for (let k = 0; k < np; k++) {
      const cuts = [lF];
      if (k > 0) cuts.push(seps[k - 1]);
      if (k < np - 1) cuts.push(seps[k]);
      out['P' + k] = cell(cuts, [W * (k + 0.5) / np, Yb - 20], Yb);
    }
    return out;
  }
  /** Xoa trang (de dung lai khi do lai bo cuc) */
  function xoaNoiTrang(T) { T.capO.textContent = ''; T.vsvg.textContent = ''; T.cells = {}; }
  function dungNguPhap(nh, api, m, T, opt) {
    opt = opt || {};
    const d = nh.data || {};
    const tiles = oCongThuc(nh);
    const so = soMauCau(nh);
    const pd = pad0();
    // vai tro -> o minh hoa (moi vai tro MOT o, toi da 3); tro tu doc khac (は へ を) co dau "wa!" rieng nen khong them o
    const vt = [];
    tiles.forEach((t, i) => { if (t.loai !== 'mui' && t.cap && !t.doc && vt.length < 3) vt.push({ ti: i, cap: t.cap }); });
    const np = vt.length >= 3 ? 3 : Math.max(vt.length, st.dt ? 2 : 3);
    m.vt = vt;
    const wF = st.W - 2 * st.mx;
    const nTile = tiles.filter((t) => t.loai !== 'mui').length;
    const tagH = Math.round(tk(5) * 1.55);
    const dinh = tagH + st.my + Math.round(pd * 0.6);
    const hMax = st.Yb * (st.dt ? 0.5 : 0.7);
    // co chu cong thuc: bac t2 (hoac t3 khi dien thoai nhieu o) -> ha lien tuc toi san; cao F theo so hang uoc luong
    let fs0 = st.dt ? (nTile <= 2 ? tk(2) : nTile <= 3 ? tk(3) : tk(3) * 0.85) : tk(2);
    const fmin = st.san.ct;
    let rows = uocRong(tiles, fs0, wF, st.U);
    while ((rows * 1.34 * fs0 + dinh > hMax) && fs0 > fmin) { fs0 = Math.max(fmin, fs0 - Math.max(2, st.U * 4)); rows = uocRong(tiles, fs0, wF, st.U); }
    let hF = Math.round(clamp(rows * 1.34 * fs0 + dinh, st.Yb * (st.dt ? 0.3 : 0.58), st.Yb * (st.dt ? 0.54 : 0.72)));
    if (opt.hF) hF = opt.hF;
    let fsFinal = fs0;
    const xay = (hFx, fsx, lan) => {
      xoaNoiTrang(T);
      const lay = layNguPhap(hFx, np);
      const F = addCell(T, 'F', lay.F);
      const crF = crOf(F.poly, pd);
      veLopNet(F, crF, 41, st.dt ? 56 : 130, null, 0.008);
      const [ten] = tenMau(d);
      const nl = nhanLonTao(F, { x: crF.x, y: crF.y, w: crF.w, h: crF.h }, null, 'MẪU CÂU ' + so.i, ten ? chuHoa(ngan(ten, st.dt ? 14 : 26)) : so.i + '/' + so.n);
      const box = h('div', 'j-tiles j-tx', nhet(F, crF, 'j-nf'));
      box.parentNode.style.paddingTop = tagH + 'px';
      m.tiles = tiles;
      m.tChu = []; m.tO = []; m.tJp = []; m.tAll = [];
      box.innerHTML = tiles.map((t, i) => {
        if (t.loai === 'mui') return `<div class="j-mui" lang="ja">${esc(t.t)}</div>`;
        if (t.loai === 'chu') m.tChu[t.j] = i; else m.tO[t.j] = i;
        if (t.jp) m.tJp.push(i);
        m.tAll.push(i);
        const lb = t.loai === 'o' && !t.jp && kyTu(t.t).length > 3;
        return `<div class="j-tw" data-t="${i}"><div class="j-tile${t.key ? ' k' : ''}${lb ? ' lb' : ''}${opt.ngay || m.rev.has('t' + i) ? '' : ' pend'}"${t.jp ? ' lang="ja"' : ''}><span class="j-tile-t">${esc(t.t)}</span></div>${t.doc ? `<div class="j-sfx wa${m.rev.has('c' + i) ? '' : ' j-cho'}" data-doc="${i}"><span data-t="${esc(t.doc)}!">${esc(t.doc)}!</span></div>` : ''}</div>`;
      }).join('');
      const hBox = crF.h - tagH;
      box.style.width = Math.floor(crF.w) + 'px';
      let f = fsx, xong = false;
      for (let i = 0; i < 30 && !xong; i++) {
        box.style.fontSize = f + 'px';
        if (box.scrollWidth <= crF.w + 0.6 && box.scrollHeight <= hBox + 0.6) xong = true; else if (f <= fmin) break; else f = Math.max(fmin, f - Math.max(2, st.U * 3));
      }
      return { lay, F, crF, box, nl, xong, f, need: Math.round(box.scrollHeight + dinh) };
    };
    let r = xay(hF, fs0, 0);
    for (let it = 0; it < 3 && !r.xong && hF < st.Yb * (st.dt ? 0.54 : 0.74); it++) {
      hF = Math.min(Math.round(st.Yb * (st.dt ? 0.54 : 0.74)), Math.max(r.need, hF + Math.round(st.Yb * 0.05)));
      r = xay(hF, fs0, it + 1);
    }
    if (!r.xong) {   // van tran o san: ha tiep tung buoc (cong thuc cuc dai) — khong bao gio cat chu
      let f = r.f;
      while ((r.box.scrollWidth > r.crF.w + 0.6 || r.box.scrollHeight > r.crF.h - tagH + 0.6) && f > st.san.ct * 0.45) { f -= Math.max(2, st.U * 2); r.box.style.fontSize = f + 'px'; }
    }
    fsFinal = parseFloat(r.box.style.fontSize);
    // ---- P: o vai tro (minh hoa giu mau + nhan ngan)
    const lay = r.lay, F = r.F;
    const imgs = ((nh.bai && nh.bai.vocabList) || []).filter((x) => x && x.imageUrl);
    const off = imgs.length ? ((so.i - 1) * 3) % imgs.length : 0;
    for (let p = 0; p < np; p++) {
      const c = addCell(T, 'P' + p, lay['P' + p]);
      const v = imgs.length ? imgs[(off + p) % imgs.length] : null;
      const urlP = (v && v.imageUrl) || (nh.bai && nh.bai.sceneImageUrl) || null;
      const tl0 = tiles.filter((t0) => t0.loai !== 'mui')[p] || tiles[0] || {};
      const goc = vt[p] ? kyTu(tiles[vt[p].ti].t).slice(0, 2).join('') : kyTu(tl0.t || '').slice(0, 2).join('');
      datAnh(c, urlP, { pos: '50% 26%', thay: goc || '', ht: 'ht-duoi', cover: true, zoom: !(v && v.imageUrl) && urlP ? { s: 1.6 + 0.3 * p, o: (30 + 25 * p) + '% 40%' } : null });
      if (vt[p]) {
        const cr = crOf(c.poly, Math.round(pd * 0.5));
        const bx = nhet(c, cr, 'j-ghi-anh');
        bx.style.justifyContent = 'flex-start'; bx.style.alignItems = 'flex-start';
        const lab = h('div', 'j-lab j-tx', bx, jp(capTu(vt[p].cap, 22)));
        lab.dataset.cho = 'p' + vt[p].ti; lab.dataset.fx = 'truot'; lab.dataset.dx = '-50';
        if (!m.rev.has('p' + vt[p].ti) && !opt.ngay) lab.classList.add('j-cho');
        const maxW = Math.min(cr.w, st.W * (st.dt ? 0.9 : 0.31));
        fitBacMax(lab, maxW - Math.round(24 * st.U), Math.round(cr.h * 0.9) - Math.round(18 * st.U), st.dt ? [tk(5), tk(6)] : bacTu(4, 4), st.dt ? st.san.nhan : st.san.nghia);
      }
    }
    m.fase = 'np';
    m.kk = m.kk || 0;
    camTuc(T, F.cx, F.cy);
    nhanLonLich(m, r.nl, (S) => tilesDuPhong(m, S + 0.4));
    if (opt.ngay) { m.tAll.forEach((i) => tileVao(m, i, 0, true)); }
    m.hFs = fsFinal;
  }
  /** Hien o cong thuc thu i (dap) va nhan vai tro cua no tren o minh hoa */
  function tileVao(m, i, tre, ngay) {
    const T = m.T;
    if (!ngay) tre = sauChuoi(m, tre);
    if (!T || (m.rev.has('t' + i) && !ngay)) return false;
    m.rev.add('t' + i);
    const tw = T.el.querySelector(`.j-tw[data-t="${i}"]`);
    if (!tw) return false;
    const tile = tw.querySelector('.j-tile');
    tile.classList.remove('pend');
    hienKhoa(m, 'p' + i, ngay ? 0 : tre);
    if (ngay) return true;
    if (giam()) { G.fromTo(tile, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, delay: tre || 0 }); return true; }
    const key = tile.classList.contains('k');
    G.fromTo(tile, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05, ease: 'none', delay: tre || 0 });
    G.fromTo(tile, { scale: key ? 1.9 : 1.5 }, { scale: 1, duration: 0.5, ease: 'expo.out', delay: tre || 0, clearProps: 'transform' });
    return true;
  }
  /** Cac o con lai hien lan luot (so le 0.14 s) — noi dung nhan dien khong cho cue */
  function tilesDuPhong(m, base) {
    let k = 0;
    (m.tAll || []).forEach((i) => { if (tileVao(m, i, (base || 0) + k * 0.14)) k++; });
  }
  /** Chon vai tro thu k: to den o cong thuc + day may quay toi o minh hoa cua no */
  function chonVaiTro(m, k, tre) {
    const T = m.T;
    if (!T || !m.vt || !m.vt.length) return;
    const p = k % m.vt.length;
    T.el.querySelectorAll('.j-tile.on').forEach((z) => z.classList.remove('on'));
    const tl = T.el.querySelector(`.j-tw[data-t="${m.vt[p].ti}"] .j-tile`);
    if (tl) tl.classList.add('on');
    camDen(T, 'P' + p, tre);
    nhan(T, 'P' + p, tre);
  }
  function cueNguPhap(m, id, tt) {
    const T = m.T;
    if (!T || m.fase !== 'np') return;
    const tre = tt ? m.api.tre(tt) : 0;
    let x;
    const tim = (arr, j) => (arr ? arr[j] : undefined);
    chuoi(m, id === 'G0' ? tre : Math.max(0, tre - 0.35));
    if (id === 'G0') { nhan(T, 'F', tre); return; }
    let i;
    if ((x = /^G2\.(\d+)$/.exec(id))) i = tim(m.tChu, +x[1]);
    else if ((x = /^G3\.(\d+)$/.exec(id))) i = tim(m.tO, +x[1]);
    else if ((x = /^G2p\.(\d+)$/.exec(id))) i = tim(m.tJp, +x[1]);
    if (i != null) {
      // cac o dung truoc chua hien (Sensei noi nhay coc) -> hien theo thu tu
      (m.tAll || []).filter((k) => k < i).forEach((k) => tileVao(m, k, tre));
      tileVao(m, i, tre);
      T.el.querySelectorAll('.j-tile.on').forEach((z) => z.classList.remove('on'));
      const tl = T.el.querySelector(`.j-tw[data-t="${i}"] .j-tile`);
      if (tl) tl.classList.add('on');
      const p = (m.vt || []).findIndex((v) => v.ti === i);
      if (p >= 0) { camDen(T, 'P' + p, tre); nhan(T, 'P' + p, tre); } else camDen(T, 'F', tre);
      nhan(T, 'F', tre);
      return;
    }
    if ((x = /^G2c\.(\d+)$/.exec(id))) {
      const k = tim(m.tChu, +x[1]);
      if (k != null) {
        m.rev.add('c' + k);
        const e = T.el.querySelector(`.j-sfx.wa[data-doc="${k}"]`);
        if (e) { e.dataset.s = '0.5'; hieu(e, tre, 'nay'); }
        tileVao(m, k, tre);
        camDen(T, 'F', tre);
      }
      return;
    }
    if (/^GM\.\d+$/.test(id)) { tieuDiem(T, 'F', tre); return; }
    if ((x = /^G4\.(\d+)$/.exec(id))) { tilesDuPhong(m); chonVaiTro(m, +x[1], tre); return; }
    if (id === 'G5' || id === 'G6') { tilesDuPhong(m); chonVaiTro(m, (m.kk = (m.kk || 0) + 1) + (id === 'G6' ? 1 : 0), tre); }
  }


  // ---- cau (vi du / giang ky mot cau hoi thoai): ban mau trang 6 — A hinh nhan vat + the ten, B bong thoai lon + nghia
  function layCau(xaF, yAF) {
    const { W, Yb } = st;
    const s = W * 0.02;
    if (st.dt) {
      const yA = Math.round(Yb * yAF), t = Math.round(W * 0.026);
      const l1 = dN(yA - t, yA + t);
      return { A: cell([l1], [W / 2, 10], Yb), B: cell([l1], [W / 2, Yb - 10], Yb) };
    }
    if (xaF <= 0) return { A: null, B: cell([], [W / 2, 10]) };
    const xa = W * xaF;
    const l1 = [xa + s, 0, xa - s, Yb];
    return { A: cell([l1], [10, 10]), B: cell([l1], [W - 10, 10]) };
  }
  /** Do be ngang tung nhom token o co 100 px (MOT lan do DOM); sau do chia hang bang tinh toan (khong dung lai DOM) */
  function doTok(gs) {
    const pr = probeEl();
    pr.innerHTML = '';
    const box = h('div', 'j-toks j-toks-do', pr, gs.map((g, k) => tokSpan(g, k)).join(''));
    box.style.fontSize = '100px';
    box.style.flexWrap = 'nowrap';
    box.style.width = 'max-content';
    const ws = [...box.children].map((e) => e.getBoundingClientRect().width);
    const cs = getComputedStyle(box);
    const padT = (parseFloat(cs.paddingTop) || 0) / 100;
    const M = { ws, gap: (parseFloat(cs.columnGap) || 0) / 100, padT, rh: box.offsetHeight / 100 - padT };
    pr.innerHTML = '';
    return M;
  }
  /** Chia hang o co f, be ngang w: hang can bang (thu hep toi khi so hang sap tang). Tra { rows, hLines, wMax, ok } */
  function chiaHang(M, f, w) {
    const ws = M.ws.map((x) => x * f / 100), g = M.gap * f;
    const wMax = ws.length ? Math.max(...ws) : 0;
    const chia = (W) => {
      const rows = [[]];
      let x = 0;
      ws.forEach((wi, k) => {
        if (x > 0 && x + wi > W + 0.01) { rows.push([]); x = 0; }
        rows[rows.length - 1].push(k);
        x += wi + g;
      });
      return rows;
    };
    let rows = chia(w);
    if (rows.length > 1) {
      let lo = wMax, hi = w;
      for (let i = 0; i < 8; i++) { const mid = (lo + hi) / 2; if (chia(mid).length <= rows.length) hi = mid; else lo = mid; }
      rows = chia(hi);
      const r2 = chia(Math.min(w, hi * 1.04 + 2));   // bien an toan: do that co the rong hon do tuyen tinh vai px
      if (r2.length === rows.length) rows = r2;
    }
    const n = rows.length;
    return { rows, hLines: (M.padT + n * M.rh + (n - 1) * 0.44) * f, hRow: (M.padT + M.rh) * f, wMax, ok: wMax <= w + 0.6 };
  }
  /** Chieu cao that cua khoi chu (do trong probe an) o co f, be ngang w */
  function doChu(html, f, w, cls) {
    const pr = probeEl();
    const e = h('div', cls || 'j-nghia', pr, html);
    e.style.fontSize = f + 'px';
    e.style.maxWidth = Math.floor(w) + 'px';
    const r = { h: e.offsetHeight, w: e.scrollWidth };
    e.remove();
    return r;
  }
  /** Hop noi dung o B cua trang cau: goc meo cat chieu cao (h, nhu crOf) hoac chieu rong (w) */
  function crCau(poly, pd, cut) {
    const r = crOf(poly, pd, true);
    if (st.dt || st.Yc >= st.Yb || cut === 'm') return r;   // 'm': giu nguyen chieu cao, chi nghia (o duoi cung) lui khoi goc meo
    const mg = Math.round(6 * st.U);
    if (r.x + r.w <= st.Xc - mg || r.y + r.h <= st.Yc - mg) return r;
    if (cut === 'w') return { x: r.x, y: r.y, w: Math.max(20, st.Xc - mg - r.x), h: r.h };
    return traoGocMeo(r);
  }
  /** Be ngang con dung duoc o phan duoi o B (duoi dinh goc meo) cho che do 'm' */
  function rongDuoiMeo(r) {
    if (st.dt || st.Yc >= st.Yb) return r.w;
    const mg = Math.round(6 * st.U);
    return r.x + r.w > st.Xc - mg && r.y + r.h > st.Yc - mg ? Math.max(20, st.Xc - mg - r.x) : r.w;
  }
  function dungCau(nh, api, m, T, opt, kw) {
    opt = opt || {};
    const d = nh.data || {};
    const toks = d.tokens || [];
    const gs = nhomTok(toks);
    m.gs = gs;
    m.gOf = {};
    gs.forEach((g, k) => g.idx.forEach((i) => { m.gOf[i] = k; }));
    const M = doTok(gs);
    const pd = pad0();
    const tt = kw ? tachTen(d.speaker) : null;
    let url = null;
    if (kw) url = d.avatarUrl || (nh.bai && nh.bai.sceneImageUrl) || null;
    else url = C.anhCau(toks, nh.bai) || (nh.bai && nh.bai.sceneImageUrl) || null;
    // ---- chon be rong cot anh + co chu + kieu bong: bac lon nhat (t2 .. san) vua o B; cau dai -> cot anh hep roi bo han cot anh
    const cands = st.dt ? [0.24, 0.2, 0.16] : (kw ? [0.34, 0.28, 0.22, 0.17, 0.13, 0] : [0.36, 0.3, 0.24, 0.19, 0.15, 0]);
    const ladder = [tk(2), tk(3), st.san.cau, Math.round(st.san.bong * 1.25 * 10) / 10, st.san.bong, Math.round(st.san.bong * 0.8 * 10) / 10, Math.round(st.san.bong * 0.62 * 10) / 10].filter((v, i, a) => i === 0 || v < a[i - 1] - 0.4);   // 2 bac cuoi chi cho cau cuc dai (khong bao gio chong chu)
    const tagH = Math.round(tk(5) * 1.55);
    const meaning = String(d.meaningVi || '');
    const fN = tk(4);
    const tail = Math.round(tk(5) * 1.1), gap = Math.round(pd * 0.5);
    let pick = null;
    const cuts = st.dt || st.Yc >= st.Yb ? ['h'] : ['m', 'w', 'h'];   // goc meo: cat bot chieu cao (h) hoac chieu rong (w) cua o B
    const fNs = [fN, st.san.nghia].filter((v, i, a) => i === 0 || v < a[i - 1] - 0.4);
    const cacheM = {};
    const kTach = gs.findIndex((g, i) => g.key && i >= 1 && i < gs.length - 1);
    const coTach = gs.length >= 3 && kTach >= 0 && kTach < gs.length - 1;
    // pha 1: giu cot anh/chan dung (ban mau co anh) chung nao co chu van >= san cau; cot anh rong nhat vua truoc.
    // pha 2: co chu cau lon nhat truoc (khong anh), roi ha dan (ca duoi san) toi khi vua
    const thu = (fs, xs) => {
      for (const f of fs) {
        for (const xaF of xs) {
          const lay0 = layCau(xaF, 0.22);
          for (const cut of cuts) {
            const crB0 = crCau(lay0.B, pd, cut);
            const bpx0 = Math.round(0.42 * f);
            const wB = crB0.w - 2 * bpx0 - (st.dt ? 0 : Math.round(pd * 1.2));
            const r = chiaHang(M, f, wB);
            if (!r.ok || r.wMax > wB + 0.6) continue;
            const n = r.rows.length, padY = Math.round(0.24 * f);
            const nEf = n === 1 && coTach ? 2 : n;   // mot hang nhung se tach 2 bong (sau tro tu chu de): tinh chieu cao 2 bong
            const hSep = nEf * (r.hRow + 2 * padY) + (nEf - 1) * gap + tail;
            const hOne = r.hLines + 2 * padY + tail;
            for (const fq of fNs) {
              const key = xaF + '|' + cut + '|' + fq;
              const wLim = cut === 'm' ? rongDuoiMeo(crB0) : crB0.w;
              const hMt = cacheM[key] != null ? cacheM[key] : (cacheM[key] = doChu(jp(meaning), fq, wLim * 0.92 - Math.round(36 * st.U), 'j-nghia j-nghia-cau').h);
              if (hMt > (crB0.h - tagH) * 0.4 - Math.round(34 * st.U) + 0.6 && fq !== fNs[fNs.length - 1]) continue;
              const free = crB0.h - tagH - (hMt + Math.round(36 * st.U)) - Math.round(pd * 0.8);
              const okSep = nEf <= 2 && hSep <= free + 0.5, okOne = hOne <= free + 0.5;
              if (!okSep && !okOne) continue;
              // che do 'm': bong thoai (khong tinh duoi) phai nam tren dinh goc meo khi o B cham goc meo
              if (cut === 'm' && wLim < crB0.w && (okSep ? hSep : hOne) - tail > st.Yc - Math.round(6 * st.U) - crB0.y - tagH + 0.5) continue;
              if (okSep) return { xaF, f, rows: r.rows, modo: 'sep', cut, fN: fq };
              return { xaF, f, rows: r.rows, modo: n === 1 && !coTach ? 'sep' : 'mot', cut, fN: fq };
            }
          }
        }
      }
      return null;
    };
    const fSan = ladder.filter((v) => v >= st.san.cau * (kw ? 0.5 : 1) - 0.5);   // giang ky hoi thoai: chan dung la bat buoc -> chu co the ha toi ~0.5 san cau (chi cau rat dai)
    for (const xaF of cands) {   // moi be rong cot anh: co lon nhat vua; chon theo diem co chu x (1 + 1.2 x be rong cot anh)
      if (xaF <= 0) continue;
      const pk = thu(fSan, [xaF]);
      if (pk && (!pick || pk.f * (1 + 1.2 * pk.xaF) > pick.f * (1 + 1.2 * pick.xaF) + 0.01)) pick = pk;
    }
    if (!pick) pick = thu(ladder, cands);
    if (!pick) pick = { xaF: cands[cands.length - 1], f: ladder[ladder.length - 1], rows: null, modo: 'mot', cut: 'h', fN: fNs[fNs.length - 1] };
    const lay = layCau(pick.xaF, 0.22);
    const A = lay.A ? addCell(T, 'A', lay.A) : null;
    const B = addCell(T, 'B', lay.B);
    // ---- A: anh (avatar) + the ten nhan vat
    if (A) {
      datAnh(A, url, { pos: kw ? '50% 28%' : '50% 38%', thay: kw ? '' : chuTok(toks.find((t) => t.isKeyGrammar) || toks[0] || {}).slice(0, 2), ht: 'ht-duoi', kb: !kw });
      if (kw && url) { const im = A.noi.querySelector('.j-anh img'); if (im) ganAvatar(m, im, { lineId: d.id, nhanVat: nhanVatId(url) }); }
      m.anhImg = A.noi.querySelector('.j-anh img');
    }
    // ---- B: nhan lon -> goc; bong thoai (hang token); nghia
    const crB = crCau(B.poly, pd, pick.cut);
    veLopNet(B, crB, 51, st.dt ? 50 : 130, null, 0.008);
    let so1 = '1', so2 = '1';
    if (kw) { const c = nh.chuong || {}; so1 = String(c.i || 1); so2 = String(c.n || 1); } else { const mm = /(\d+)\s*\/\s*(\d+)\s*$/.exec(String((nh.beat && nh.beat.label) || '')); if (mm) { so1 = mm[1]; so2 = mm[2]; } }
    const nl = nhanLonTao(B, { x: crB.x, y: crB.y, w: crB.w, h: crB.h }, null, kw ? 'GIẢNG KỸ' : 'VÍ DỤ', so1 + '/' + so2);
    const f = pick.f;
    const bpx = Math.round(0.42 * f);
    const wB = crB.w - 2 * bpx - (st.dt ? 0 : Math.round(pd * 1.2));
    const rr = pick.rows ? { rows: pick.rows } : chiaHang(M, f, wB);
    let rows = rr.rows;
    if (rows.length === 1 && pick.modo === 'sep' && gs.length >= 3) {   // mot hang: tach hai bong sau tro tu chu de (ban mau: 私は / マイク・ミラーです)
      const k = gs.findIndex((g, i) => g.key && i >= 1 && i < gs.length - 1);
      if (k >= 0 && k < gs.length - 1) rows = [rows[0].filter((x) => x <= k), rows[0].filter((x) => x > k)];
    }
    const nR = rows.length;
    const padY = Math.round(0.24 * f);
    const wrap = nhet(B, { x: crB.x, y: crB.y + tagH, w: crB.w, h: crB.h - tagH }, 'j-cs');
    // nghia: dat truoc de biet con bao nhieu cho cho bong
    const wLimM = pick.cut === 'm' ? rongDuoiMeo(crB) : crB.w;
    const maxMW = Math.floor(Math.min(crB.w, wLimM) * 0.92), padHop = Math.round(18 * st.U) * 2;
    const mhop = h('div', 'j-hop j-hop-dich', wrap);
    const khoaN = kw ? 'F4' : 'E5';
    const ng = h('div', 'j-nghia j-nghia-cau j-tx', mhop, jp(meaning));
    mhop.dataset.cho = khoaN; mhop.dataset.fx = 'truot'; mhop.dataset.dy = '30';
    const chua = !m.rev.has(khoaN) && !opt.ngay;
    if (chua) mhop.classList.add('j-cho');
    const grupHang = pick.modo === 'sep' && nR <= 2 ? rows.map((r) => [r]) : [rows];
    const hNghiaMax = Math.round((crB.h - tagH) * 0.4) - Math.round(34 * st.U);
    fitBacMax(ng, maxMW - padHop, hNghiaMax, [pick.fN], Math.min(pick.fN, st.san.nghia));
    if (ng.offsetHeight > hNghiaMax + 0.6) catDeVua(ng, meaning, maxMW - padHop, hNghiaMax, parseFloat(ng.style.fontSize) || st.san.nghia);
    mhop.style.position = 'absolute';
    if (wLimM < crB.w) mhop.style.left = f1(Math.max(0, wLimM - mhop.offsetWidth)) + 'px'; else mhop.style.right = '0px';
    const hMean = mhop.offsetHeight;
    const hAvail = crB.h - tagH - hMean - Math.round(pd * 0.5);
    const bubs = [];
    const area = h('div', 'j-bubs', wrap);
    area.style.height = Math.max(40, crB.h - tagH) + 'px';
    grupHang.forEach((hs, bi) => {
      const bub = h('div', 'j-bub', area);
      const inn = h('div', 'j-bub-in', bub);
      const toksBox = h('div', 'j-toks j-tx', inn);
      toksBox.style.fontSize = f + 'px';
      toksBox.innerHTML = hs.map((r) => `<div class="j-hang">${r.map((k) => tokSpan(gs[k], k)).join('')}</div>`).join('');
      bub.style.padding = `${Math.round(padY * 0.6)}px ${bpx}px ${padY}px`;
      const last = bi === grupHang.length - 1;
      bub.classList.add('j-cho');
      bub.dataset.cho = 'B' + bi; bub.dataset.fx = 'nay'; bub.dataset.s = '0.8';
      if (last) bub.classList.add('co-duoi');
      bubs.push({ bub, inn, toksBox, last });
    });
    // vi tri: bong i lech trai / phai so le (nhin nhu ban mau); duoi bong chi ve phia nhan vat (A) hoac meo
    const hBub = bubs.map((b) => b.bub.offsetHeight);
    const tot = hBub.reduce((a, b) => a + b, 0) + (bubs.length - 1) * gap + tail;
    const gapM = Math.round(pd * 0.7);
    let y = Math.max(0, (crB.h - tagH - (tot + gapM + hMean)) / 2);
    if (wLimM < crB.w) y = Math.max(0, Math.min(y, st.Yc - Math.round(6 * st.U) - crB.y - tagH - (tot - tail)));   // bong thoai nam tren dinh goc meo
    mhop.style.top = f1(y + tot + gapM) + 'px';
    {   // nghia khong duoc tran xuong duoi o B (cau cuc dai): cat bot cho vua phan con lai
      const con = crB.h - tagH - (y + tot + gapM) - 2;
      if (mhop.offsetHeight > con) {
        const hTxt = Math.max(parseFloat(ng.style.fontSize) * 1.2, con - Math.round(34 * st.U));
        catDeVua(ng, meaning, maxMW - padHop, hTxt, parseFloat(ng.style.fontSize) || st.san.nghia);
      }
      if (mhop.offsetHeight > con) mhop.style.top = f1(Math.max(0, crB.h - tagH - mhop.offsetHeight - 2)) + 'px';
    }
    bubs.forEach((b, i) => {
      const bw = b.bub.offsetWidth, bh = b.bub.offsetHeight;
      const free = Math.max(0, crB.w - bw);
      const x = bubs.length === 1 ? free * 0.5 : (i % 2 ? free * 0.92 : free * 0.08);
      b.bub.style.left = f1(x) + 'px'; b.bub.style.top = f1(y) + 'px';
      const rr2 = Math.min(Math.round(0.4 * f), bh / 2);
      const bx = Math.min(bw * 0.2, Math.round(110 * st.U));
      b.bub.insertAdjacentHTML('afterbegin', bongSvg(bw, bh, rr2, b.last ? { bx, bw: Math.round(56 * st.U), tx: bx - Math.round(46 * st.U), ty: bh + tail } : null, Math.max(3, Math.round(st.bw * 0.85))));
      y += bh + gap;
    });
    m.bubs = bubs;
    // the ten (kaiwa) — chi khi <= 2 hang (khong vuot ngan sach mat do)
    if (kw && A && tt && (tt.jp || tt.la) && nR <= 2) {
      const crA = crOf(A.poly, Math.round(pd * 0.7));
      const bx = nhet(A, { x: crA.x, y: crA.y, w: crA.w, h: crA.h }, 'j-ghi-anh');
      bx.style.justifyContent = 'flex-end'; bx.style.alignItems = 'flex-start';
      const roleOk = d.speakerRole && !/^person/i.test(d.speakerRole);
      h('div', 'j-plate j-tx', bx, `<b lang="ja">${esc(tt.jp)}</b>${tt.la ? `<i>${esc(tt.la)}</i>` : ''}${roleOk ? `<u>${esc(ngan(d.speakerRole, 20))}</u>` : ''}`).style.maxWidth = Math.floor(crA.w) + 'px';
    }
    m.fase = 'cau';
    camTuc(T, B.cx, B.cy);
    // bong + token hien theo thu tu (nay -> dap) sau nhan lon, khong cho cue (noi dung nhan dien)
    nhanLonLich(m, nl, (S) => bubs.forEach((b, i) => {
      const t0 = S + 0.4 + i * 0.35;
      hienKhoa(m, 'B' + i, t0);
      if (giam()) return;
      const tks = [...b.toksBox.querySelectorAll('.j-tok')];
      const buoc = Math.min(0.1, 0.9 / Math.max(1, tks.length));
      tks.forEach((e, k) => {
        const d0 = t0 + 0.15 + k * buoc;
        G.fromTo(e, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05, ease: 'none', delay: d0 });
        G.fromTo(e, { scale: e.classList.contains('k') ? 1.7 : 1.35 }, { scale: 1, duration: 0.4, ease: 'expo.out', delay: d0, clearProps: 'transform' });
      });
    }));
    if (opt.ngay) bubs.forEach((b, i) => { hienNgay(b.bub); m.rev.add('B' + i); });
    if (!opt.ngay && chua) m.hNghia = m.hen(() => cueCau(m, khoaN, null), 3600);
    if (m.tokOn != null) batTok(m, m.tokOn, true);
  }
  /** Ten file nhan vat tu avatarUrl (assets/minh-hoa/nv/<id>/<cam xuc>.webp hoac nv-<id>.webp) */
  function nhanVatId(url) {
    const s = String(url || '');
    let mm = /\/nv\/([^/]+)\//.exec(s);
    if (mm) return mm[1];
    mm = /nv-([^./]+)\.\w+$/.exec(s);
    return mm ? mm[1] : '';
  }
  /** Gan avatar noi (nhep mieng / bieu cam / ky hieu) cho anh chan dung: chi nhan vat dang noi chuyen dong */
  function ganAvatar(m, img, o) {
    try {
      const AV = window.SenseiAvatarNoi;
      if (!AV || !AV.gan || !img || img.dataset.avn) return null;
      img.dataset.avn = '1';
      const ct = AV.gan(img, o);
      (m.avs = m.avs || []).push(ct);
      return ct;
    } catch (e) { return null; }
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
      else m.hen(() => { if (m.vivo && m.T) batTok(m, k); }, Math.round(t * 1000));
    });
  }
  function cueCau(m, id, tt) {
    const T = m.T;
    if (!T || m.fase !== 'cau') return;
    const tre = tt ? m.api.tre(tt) : 0;
    const kw = m.nh.kind === 'kaiwa';
    let x;
    chuoi(m, id === 'E0' || id === 'F1' ? tre : Math.max(0, tre - 0.35));
    if (id === 'E0' || id === 'F1') { nhan(T, 'B', tre); return; }
    if (id === 'E1' || id === 'E2' || id === 'E2b' || id === 'F2') { camDen(T, 'B', tre); nhan(T, 'B', tre); return; }
    if (id === 'E5' || id === 'F4') {
      if (m.hNghia != null) m.huy(m.hNghia);
      hienKhoa(m, id, tre);
      tieuDiem(T, 'B', tre);
      return;
    }
    if ((x = /^E4\.(\d+)$/.exec(id))) {
      const k = m.gOf ? m.gOf[+x[1]] : null;
      const e = k != null ? T.el.querySelector(`.j-tok[data-g="${k}"]`) : null;
      if (e) { batTok(m, k); tokDoc(m, e, m.gs[k], tre); }
      camDen(T, 'B', tre);
      return;
    }
    if ((x = /^F3\.(\d+)$/.exec(id))) {
      const ks = m.gs.map((g, k) => (g.key ? k : -1)).filter((k) => k >= 0);
      const k = ks[+x[1]];
      const e = k != null ? T.el.querySelector(`.j-tok[data-g="${k}"]`) : null;
      if (e) { batTok(m, k); tokDoc(m, e, m.gs[k], tre); }
      camDen(T, 'B', tre); nhan(T, 'B', tre);
      return;
    }
    if (/^E3/.test(id)) { nhan(T, 'B', tre); }
  }
  /** Cach doc ("wa") hien tren dong furigana cua token tro tu: quet chu, khong de len chu khac */
  function tokDoc(m, e, g, tre) {
    const rt = e.querySelector('.j-rt-doc');
    if (!rt || rt.dataset.da) return;
    rt.dataset.da = '1';
    const hien = () => { rt.style.visibility = 'visible'; if (!giam()) G.fromTo(rt, { clipPath: 'inset(-10% 100% -10% 0)' }, { clipPath: 'inset(-10% -10% -10% -10%)', duration: 0.3, ease: 'power3.inOut', clearProps: 'clipPath' }); };
    if (tre > 0.02) m.hen(hien, Math.round(tre * 1000)); else hien();
  }


  // ---- hoi thoai: gioi thieu (kaiwa-intro) + nghe tron doan (kaiwa-run): A canh bai, B bong thoai luot dang noi + nghia, hang chan dung
  function vaiCua(ds) {
    const out = [];
    (ds || []).forEach((l) => {
      if (!l) return;
      const t = tachTen(l.speaker);
      if (!out.find((x) => x.jp === t.jp)) out.push({ jp: t.jp, la: t.la, anh: l.avatarUrl || '', role: l.speakerRole || '', id: nhanVatId(l.avatarUrl) });
    });
    return out;
  }
  function layHoiThoai(n) {
    const { W, Yb } = st;
    const s = W * 0.02, wob = W * 0.008;
    if (st.dt) {
      const yA = Math.round(Yb * 0.2), yB = Math.round(Yb * 0.7), t = Math.round(W * 0.026);
      const l1 = dN(yA - t, yA + t), l2 = dN(yB + t * 0.6, yB - t * 0.6);
      const o = { A: cell([l1], [W / 2, 10], Yb), B: cell([l1, l2], [W / 2, (yA + yB) / 2], Yb) };
      const cols = Math.min(4, n);
      for (let p = 0; p < cols; p++) {
        const xl = W * p / cols, xr = W * (p + 1) / cols, sl = W * 0.02;
        const cuts = [l2];
        if (p > 0) cuts.push([xl + sl, 0, xl - sl, Yb]);
        if (p < cols - 1) cuts.push([xr + sl, 0, xr - sl, Yb]);
        o['P' + p] = cell(cuts, [(xl + xr) / 2, yB + (Yb - yB) / 2], Yb);
      }
      return o;
    }
    const xa = W * 0.3, hB = Math.round(Yb * 0.66);
    const l1 = dV(xa + s, xa - s), l2 = [xa - s, hB + wob, W, hB - wob];
    const o = { A: cell([l1], [10, 10]), B: cell([l1, l2], [W - 10, 10]) };
    const wRow = W - xa;
    const nTrong = Math.min(n, 4);
    for (let p = 0; p < nTrong; p++) {
      const xl = xa + wRow * p / nTrong, xr = xa + wRow * (p + 1) / nTrong, sl = W * 0.012;
      const cuts = [l1, l2];
      if (p > 0) cuts.push([xl + sl, 0, xl - sl, Yb]);
      if (p < nTrong - 1) cuts.push([xr + sl, 0, xr - sl, Yb]);
      o['P' + p] = cell(cuts, [(xl + xr) / 2, Yb - 20], Yb);
    }
    return o;
  }
  /** O chan dung nhan vat: anh (nhep mieng qua SenseiAvatarNoi) + the ten (hien khi dang noi / duoc goi ten) */
  function veNhanVat(m, c, v, gan) {
    const cr = crOf(c.poly, Math.round(pad0() * 0.5));
    veLopNet(c, cr, 60 + gan, 40);
    const w = nhet(c, { x: c.bb.x0, y: c.bb.y0, w: c.bw, h: c.bh }, 'j-p');
    w.style.left = '0px'; w.style.top = '0px'; w.style.width = c.bw + 'px'; w.style.height = c.bh + 'px';
    const va = Math.max(0, c.bb.x0), vy = Math.max(0, c.bb.y0);
    const vw = Math.min(st.W, c.bb.x1) - va, vh = Math.min(st.Yb, c.bb.y1) - vy;
    const av = h('div', 'j-p-av', w);
    av.style.left = f1(va - c.bx) + 'px'; av.style.top = f1(vy - c.by) + 'px'; av.style.width = f1(vw) + 'px'; av.style.height = f1(vh) + 'px';
    if (v.anh) {
      av.innerHTML = `<img src="${esc(v.anh)}" alt="" decoding="async" draggable="false" onerror="this.remove()"/>`;
      const im = av.firstChild;
      if (im && im.tagName === 'IMG') {
        ganAvatar(m, im, { nhanVat: v.id || nhanVatId(v.anh) });
        // moi cau thoai cua nhan vat nay: mot bo dieu khien theo lineId (engine chi dung avatar khop lineId khi co) — chi nhan vat dang noi chuyen dong
        (m.ds || []).forEach((l) => { if (l && l.id && tachTen(l.speaker).jp === v.jp) { try { const AV = window.SenseiAvatarNoi; if (AV && AV.gan) (m.avs = m.avs || []).push(AV.gan(im, { lineId: l.id, nhanVat: v.id || nhanVatId(v.anh) })); } catch (e) {} } });
      }
    } else av.innerHTML = `<span lang="ja">${esc(kyTu(v.jp)[0] || '?')}</span>`;
    h('i', 'j-ht ht-duoi', av);
    const tn = h('div', 'j-p-ten j-tx', w, `<b lang="ja">${esc(v.jp)}</b>${v.la ? `<i>${esc(v.la)}</i>` : ''}`);
    tn.style.left = f1(Math.max(cr.x, va + 6 * st.U) - c.bx) + 'px';
    tn.style.bottom = f1(c.by + c.bh - Math.min(Math.min(st.Yb, c.bb.y1) - 6 * st.U, cr.y + cr.h)) + 'px';
    tn.style.maxWidth = Math.max(40, Math.floor(Math.min(cr.w, vw) - 8)) + 'px';
    tn.style.fontSize = tk(6) + 'px';
    return { w, tn };
  }
  /** Bong thoai don (nhieu dong) trong hop cr cua o c: tra { wrap, toks, f } */
  function bongDon(c, cr, gs, hTrong, opts) {
    opts = opts || {};
    const wrap = nhet(c, cr, 'j-luot');
    const bub = h('div', 'j-bub j-bub-don', wrap);
    const bpx = Math.round((st.dt ? 12 : 20) * st.U);
    const inn = h('div', 'j-bub-in', bub);
    const duoi = Math.round(tk(5) * 0.7);
    bub.style.padding = `${Math.round(8 * st.U)}px ${bpx}px ${Math.round(6 * st.U)}px`;
    const wIn = cr.w - 2 * bpx - Math.round(8 * st.U);
    const hIn = hTrong - duoi - Math.round(14 * st.U);
    const bac = [tk(3), st.san.cau, st.san.bong * 1.25, st.san.bong, st.san.bong * 0.85, st.san.nghia].filter((v, i, a) => i === 0 || v < a[i - 1] - 0.4);
    const M = doTok(gs);
    let f = bac[bac.length - 1], rr = chiaHang(M, f, wIn);
    for (const b of bac) { const r = chiaHang(M, b, wIn); if (r.ok && r.hLines <= hIn + 0.6) { f = b; rr = r; break; } }
    if (!(rr.ok && rr.hLines <= hIn + 0.6)) {   // cau cuc dai: khong bac nao vua chieu cao -> ha lien tuc (toi 15 px dt / 28 px may) de con cho cho nghia
      const sanThap = st.dt ? 15 : st.san.nghia;
      let lo = Math.min(sanThap, f), hi = f;
      const vua = (x) => { const r = chiaHang(M, x, wIn); return r.ok && r.hLines <= hIn + 0.6; };
      if (vua(lo)) { for (let i = 0; i < 8 && hi - lo > 0.5; i++) { const mid = (lo + hi) / 2; if (vua(mid)) lo = mid; else hi = mid; } }
      f = Math.round(lo * 10) / 10; rr = chiaHang(M, f, wIn);
    }
    const toksBox = h('div', 'j-toks j-tx', inn);
    toksBox.style.fontSize = f + 'px';
    toksBox.innerHTML = rr.rows.map((r) => `<div class="j-hang">${r.map((k) => tokSpan(gs[k], k)).join('')}</div>`).join('');
    vuaKhung(toksBox, bub, st.san.nghia * 0.5);
    const hh = Math.min(hTrong - duoi, toksBox.offsetHeight + Math.round(14 * st.U));
    bub.style.width = (Math.min(cr.w, toksBox.offsetWidth + 2 * bpx + Math.round(8 * st.U))) + 'px';
    bub.style.minHeight = hh + 'px';
    bub.style.left = '0px'; bub.style.top = '0px';
    const bw = bub.offsetWidth, bh = bub.offsetHeight;
    bub.style.left = f1((cr.w - bw) * 0.5) + 'px';
    bub.insertAdjacentHTML('afterbegin', bongSvg(bw, bh, Math.min(Math.round(0.4 * f), bh / 2), { bx: Math.min(bw * 0.16, 110 * st.U), bw: Math.round(54 * st.U), tx: -Math.round(60 * st.U), ty: bh + duoi }, Math.max(3, Math.round(st.bw * 0.85))));
    return { wrap, bub, toksBox, f, h: bh + duoi };
  }
  /** Hien mot luot thoai trong o B (bong thoai + nghia); thay luot truoc */
  function hienLuot(m, line, i, tre, ngay) {
    const T = m.T;
    if (!T || !T.cells.B || !line) return;
    const B = T.cells.B;
    const cr = m.crB;
    if (m.luot) { const cu = m.luot; if (!ngay && !giam() && tre > 0.02) G.delayedCall(tre, () => cu.remove()); else cu.remove(); }
    const tt = tachTen(line.speaker);
    const gs = nhomTok(line.tokens || []);
    m.gs = gs; m.gOf = {};
    gs.forEach((g, k) => g.idx.forEach((ii) => { m.gOf[ii] = k; }));
    m.tokOn = null;
    const fN = tk(4);
    const nMean = Math.max(1, Math.ceil(em(line.meaningVi || '') * fN / Math.max(60, cr.w * 0.9)));
    const hMean = Math.min(Math.round(cr.h * 0.36), Math.round(Math.min(2, nMean) * fN * 1.22 + 26 * st.U));
    const bd = bongDon(B, { x: cr.x, y: cr.y, w: cr.w, h: cr.h - hMean - Math.round(8 * st.U) }, gs, cr.h - hMean - Math.round(8 * st.U));
    const wrap = bd.wrap;
    wrap.style.height = Math.floor(cr.h) + 'px';
    const mhop = h('div', 'j-hop j-hop-dich', wrap);
    const ng = h('div', 'j-nghia j-tx', mhop, jp(String(line.meaningVi || '')));
    mhop.style.position = 'absolute'; mhop.style.right = '0px';
    const padHop = Math.round(18 * st.U) * 2;
    {   // nghia: vua phan con lai cua o sau bong thoai (that), gom ca the + le; khong vua thi cat bot chu (khong de tran xuong o duoi)
      const gapM0 = Math.round(10 * st.U);
      const wN = Math.floor(cr.w * 0.94) - padHop;
      ng.style.fontSize = fN + 'px';
      const them = Math.max(0, mhop.offsetHeight - ng.offsetHeight);
      const maxH = Math.max(st.san.nghia * 1.1, cr.h - bd.h - gapM0 - 2 - them);
      fitBacMax(ng, wN, maxH, bacTu(4, 4), st.san.nghia);
      if (ng.offsetHeight > maxH + 0.6) catDeVua(ng, String(line.meaningVi || ''), wN, maxH, parseFloat(ng.style.fontSize) || st.san.nghia);
    }
    {
      const gapM = Math.round(10 * st.U), hM2 = mhop.offsetHeight;
      const off = Math.max(0, (cr.h - (bd.h + gapM + hM2)) / 2);
      bd.bub.style.top = f1(off) + 'px';
      mhop.style.top = f1(off + bd.h + gapM) + 'px';
    }
    if (m.tagEl) m.tagEl.querySelector('i').textContent = (i != null ? (i + 1) : '') + '/' + (m.tong || '');
    m.luot = wrap;
    G.delayedCall((tre || 0) + 0.3, capKiemLai);
    if (!ngay && !giam()) {
      if (tre > 0.02) { wrap.style.visibility = 'hidden'; G.delayedCall(tre, () => { wrap.style.visibility = ''; }); }
      G.fromTo(wrap, { clipPath: 'inset(-2% 100% -2% -2%)' }, { clipPath: 'inset(-6% -6% -6% -6%)', duration: 0.4, ease: 'power3.inOut', delay: tre || 0, clearProps: 'clipPath' });
    }
    // nhan vat dang noi: the ten + vien; cac nhan vat khac giu nguyen
    const p = (m.vai || []).findIndex((v) => v.jp === tt.jp);
    T.el.querySelectorAll('.j-p.on').forEach((e) => e.classList.remove('on'));
    if (p >= 0) {
      const cp = T.cells['P' + p];
      if (cp) { cp.noi.querySelector('.j-p').classList.add('on'); if (!ngay) tieuDiem(T, 'B', tre); }
    }
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
    const A = addCell(T, 'A', lay.A);
    const B = addCell(T, 'B', lay.B);
    datAnh(A, (nh.bai && nh.bai.sceneImageUrl) || (vai[0] && vai[0].anh) || null, { pos: '50% 40%', thay: vai.map((v) => v.jp).join('・'), ht: 'ht-duoi', kb: true });
    const crB = crOf(B.poly, pd);
    veLopNet(B, crB, 61, st.dt ? 50 : 100);
    const nl = nhanLonTao(B, { x: crB.x, y: crB.y, w: crB.w, h: crB.h }, null, 'HỘI THOẠI', run ? '0/' + ds.length : vai.length + ' NHÂN VẬT');
    m.tagEl = nl.el;
    const tagH = Math.round(tk(5) * 1.55);
    m.crB = { x: crB.x, y: crB.y + tagH, w: crB.w, h: crB.h - tagH };
    for (let p = 0; p < 4; p++) {
      const c = lay['P' + p] ? addCell(T, 'P' + p, lay['P' + p]) : null;
      if (c && vai[p]) { const r = veNhanVat(m, c, vai[p], p); if (run) r.tn.classList.add('chi-khi-noi'); }
    }
    if (m.luotI != null && ds[m.luotI]) hienLuot(m, ds[m.luotI], m.luotI, 0, true);
    else {
      // ban dau: tom tat — "n luot thoai"
      const tomTat = h('div', 'j-tomtat j-tx', nhet(B, m.crB, 'j-hb'));
      tomTat.innerHTML = `<b>${ds.length}</b><span> lượt thoại</span>`;
      fitDong(tomTat, m.crB.w * 0.9, bacTu(2, 3), st.san.nghia);
      m.tomTat = tomTat;
    }
    m.fase = 'ht';
    camTuc(T, B.cx, B.cy);
    nhanLonLich(m, nl);
  }
  function cueHoiThoai(m, id, tt) {
    const T = m.T;
    if (!T || m.fase !== 'ht') return;
    const tre = tt ? m.api.tre(tt) : 0;
    chuoi(m, Math.max(0, tre - 0.35));
    let x;
    if ((x = /^C1\.(\d+)$/.exec(id))) {
      const p = +x[1];
      const c = T.cells['P' + p];
      if (c) { T.el.querySelectorAll('.j-p.on').forEach((e) => e.classList.remove('on')); c.noi.querySelector('.j-p').classList.add('on'); camDen(T, c.id, tre); nhan(T, c.id, tre); }
    } else if ((x = /^C2\.(\d+)$/.exec(id))) {
      const i = +x[1];
      const line = m.ds[i];
      if (line) {
        if (m.tomTat) { m.tomTat.style.display = 'none'; m.tomTat = null; }
        hienLuot(m, line, i, tre, false);
      }
    }
  }


  // ---- bai tap (quiz): ban mau trang 8 — Q bong cau hoi + hinh, R cot phai (dau ?, roi 4 o lua chon A-D, roi THE THAT)
  const RE_TRONG = /_{2,}|＿{2,}|＿|＿＿/;
  function layQuiz() {
    const { W, Yb } = st;
    const wob = W * 0.008;
    if (st.dt) {
      const yQ = Math.round(Yb * 0.4), t = Math.round(W * 0.026);
      const l1 = dN(yQ - t, yQ + t);
      const o = { Q: cell([l1], [W / 2, 10]), R: cell([l1], [W / 2, Yb - 10]), O: [] };
      const ys = [0, 1, 2, 3, 4].map((k) => yQ + (Yb - yQ) * k / 4);
      for (let k = 0; k < 4; k++) {
        const cuts = [l1];
        const lk = (kk) => { const sg = kk % 2 ? 1 : -1; return [0, ys[kk] + sg * t * 0.5, W, ys[kk] - sg * t * 0.5]; };
        if (k > 0) cuts.push(lk(k));
        if (k < 3) cuts.push(lk(k + 1));
        o.O.push(cell(cuts, [W / 2, (ys[k] + ys[k + 1]) / 2]));
      }
      return o;
    }
    const lv1 = [px(920), 0, px(860), Yb], lv2 = [px(1440), 0, px(1420), Yb], lh = [px(880), py(380), W, py(400)];
    const O = [
      cell([lv1, lv2, lh], [px(1150), py(200)]),
      cell([lv2, lh], [px(1700), py(200)]),
      cell([lv1, lv2, lh], [px(1150), py(600)]),
      cell([lv2, lh], [px(1700), py(600)]),
    ];
    return { Q: cell([lv1], [px(400), py(300)]), R: cell([lv1], [px(1400), py(300)]), O };
  }
  function dungQuiz(nh, api, m, T, opt) {
    opt = opt || {};
    const q = nh.data || {};
    const opts = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
    const cauHoi = String(q.question || '').replace(/^\[(Dễ|Vừa|Khó)\]\s*/, '');
    const [goc, yc] = tachNgoac(cauHoi);
    const pd = pad0();
    const lay = layQuiz();
    const Q = addCell(T, 'Q', lay.Q);
    const R = addCell(T, 'R', lay.R);
    const Os = lay.O.map((p, i) => addCell(T, 'O' + i, p, { z: 3 }));
    // ---- Q: hinh + bong thoai cau hoi (ban mau: bong tren, nguoi ben duoi)
    const jpc = String(goc).match(/[぀-ヿ一-鿿々ー]+/g);
    const url = C.anhCau(jpc ? jpc.map((x) => ({ text: x, kanji: x })) : [], nh.bai) || (nh.bai && nh.bai.sceneImageUrl) || null;
    const crQ = crOf(Q.poly, Math.round(pd * 0.8));
    const hBong = Math.floor(crQ.h * (st.dt ? 0.9 : 0.6));
    const wQ = nhet(Q, crQ, 'j-qq');
    const duoi = Math.round(tk(5) * 0.8);
    const bong = h('div', 'j-bong-x', wQ);
    bong.style.width = Math.floor(crQ.w) + 'px'; bong.style.height = (hBong - duoi) + 'px';
    bong.innerHTML = bongSvg(crQ.w, hBong - duoi, Math.round(56 * st.U), { bx: crQ.w * 0.5, bw: Math.round(70 * st.U), tx: crQ.w * 0.5 + Math.round(30 * st.U), ty: hBong - Math.round(4 * st.U) }, Math.max(3, Math.round(st.bw * 0.85)));
    const bpad = Math.round(24 * st.U);
    const inn = h('div', 'j-bong-in', bong);
    inn.style.left = bpad + 'px'; inn.style.top = bpad * 0.4 + 'px'; inn.style.width = f1(crQ.w - bpad * 2) + 'px'; inn.style.height = f1(hBong - duoi - bpad * 0.8) + 'px';
    const cauJp = RE_JP.test(goc);
    const cauEl = h('div', 'j-qcau j-tx' + (cauJp ? '' : ' is-vn'), inn);
    cauEl.innerHTML = esc(goc).replace(RE_TRONG, '<span class="j-trong"><span class="j-trong-d"></span></span>');
    if (cauJp) cauEl.lang = 'ja';
    const ycEl = yc ? h('div', 'j-qyc', inn, jp(yc)) : null;
    {
      const wIn = inn.clientWidth || (crQ.w - bpad * 2), hIn = inn.clientHeight || (hBong - duoi - bpad);
      if (ycEl) ycEl.style.fontSize = tk(6) + 'px';
      const hYc = ycEl ? ycEl.offsetHeight + Math.round(6 * st.U) : 0;
      const bacQ = [tk(4), st.san.nghia, st.san.nghia * 0.8, st.san.phu].filter((v, i, a) => i === 0 || v < a[i - 1] - 0.4);
      cauEl.style.whiteSpace = 'nowrap';   // thu mot dong truoc (khong ngat giua cum tu); khong vua o co >= san thi cho xuong dong
      fitBac(cauEl, wIn, hIn - hYc, bacQ.filter((v) => v >= (st.dt ? 20 : st.san.nghia)), st.dt ? 20 : st.san.nghia);
      if (cauEl.scrollWidth > wIn + 0.6) { cauEl.style.whiteSpace = ''; fitBac(cauEl, wIn, hIn - hYc, bacQ, st.dt ? 20 : st.san.phu); }
      vuaKhung(cauEl, inn, st.dt ? 20 : st.san.phu * 0.8);
    }
    {   // bong om sat noi dung (ban mau: bong ~ 18% khung) — hinh nhan vat nam duoi bong
      const hCont = cauEl.offsetHeight + (ycEl ? ycEl.offsetHeight + Math.round(6 * st.U) : 0);
      const hReal = Math.min(hBong, Math.max(Math.round(crQ.h * 0.26), Math.round(hCont + bpad * 1.5 + duoi)));
      bong.style.height = (hReal - duoi) + 'px';
      bong.innerHTML = bongSvg(crQ.w, hReal - duoi, Math.round(56 * st.U), { bx: crQ.w * 0.5, bw: Math.round(70 * st.U), tx: crQ.w * 0.5 + Math.round(30 * st.U), ty: hReal - Math.round(4 * st.U) }, Math.max(3, Math.round(st.bw * 0.85)));
      bong.appendChild(inn);
      inn.style.height = f1(hReal - duoi - bpad * 0.8) + 'px';
      const vx0 = Math.max(0, Q.bb.x0), vx1 = Math.min(st.W, Q.bb.x1);
      const y0 = crQ.y + hReal - Math.round(20 * st.U);
      const eImg = datAnh(Q, url, { pos: '50% 40%', thay: '', ht: 'ht-duoi', chua: true, rect: { x: vx0, y: y0, w: vx1 - vx0, h: Math.min(st.Yb, Q.bb.y1) - y0 } });
      Q.noi.insertBefore(eImg, Q.noi.firstChild);   // anh nam duoi bong (nen trang cua anh khong che bong)
    }
    m.trong = cauEl.querySelector('.j-trong-d');
    m.qDapAn = opts[q.correctIndex] ? tachNgoac(opts[q.correctIndex])[0] : '';
    // ---- R: dau ? lon (ban mau) -> 4 o lua chon; the that vao R khi den luot hoc vien
    const crR = crOf(R.poly, pd);
    m.crR = crR;
    veLopNet(R, crR, 71, st.dt ? 40 : 90, [crR.x + crR.w / 2, crR.y + crR.h / 2]);
    const dauHoi = h('div', 'j-hoi', R.noi, `<span>?</span>`);
    dauHoi.style.left = f1(crR.x - R.bx + crR.w / 2) + 'px'; dauHoi.style.top = f1(crR.y - R.by + crR.h / 2) + 'px';
    dauHoi.style.fontSize = f1(Math.min(tk(1) * 1.5, crR.h * 0.9, crR.w * 0.5)) + 'px';
    m.dauHoi = dauHoi;
    // 4 o lua chon (xem): chu to chung mot co (min cua bon o)
    m.opts = opts;
    const bacO = [tk(1), tk(2), tk(3), tk(4)];
    let fO = 1e9;
    const oEls = Os.map((O, i) => {
      O.el.classList.add('j-an');
      O.pg.style.opacity = '0';
      const crO = crOf(O.poly, Math.round(pd * 0.6));
      const o = opts[i] != null ? opts[i] : '';
      let [p, r] = tachNgoac(o);
      if (kyTu(o).length > 60) { p = o; r = ''; }
      const box = nhet(O, crO, 'j-qo');
      box.innerHTML = `<b class="j-qk">${'ABCD'[i]}</b><span class="j-qo-t j-tx"${RE_JP.test(p) ? ' lang="ja"' : ''}>${esc(p)}${r ? ` <i class="j-qo-r">${esc(r)}</i>` : ''}</span>`;
      const t = box.querySelector('.j-qo-t');
      const wT = crO.w - Math.round(50 * st.U), hT = crO.h - Math.round(8 * st.U);
      const f = fitBac(t, wT, hT, bacO, st.dt ? 15 : st.san.nhan);
      fO = Math.min(fO, f);
      return { box, t, wT, hT };
    });
    oEls.forEach((e) => { e.t.style.fontSize = f1(fO) + 'px'; });
    m.qf = fO;
    m.Os = Os;
    // cac o luon trong DOM nhung an toi luc Sensei doc dap an (hoac den luot hoc vien)
    m.fase = 'qz';
    camTuc(T, Q.cx, Q.cy);
    if (m.choOn) { Os.forEach((O) => { O.el.style.display = 'none'; O.pg.style.display = 'none'; }); dauHoi.style.display = 'none'; taoKhungCho(m); camReset(T, true); }
    else if (opt.ngay) lenOpts(m, true);
    else {
      // dau ? vao (nay), roi 4 o lua chon (hien vien + quet noi dung, so le .06 s) khi Sensei doc dap an / du phong
      G.fromTo(dauHoi, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.55, ease: 'back.out(2.2)', delay: 0.15 });
      m.hOpts = m.hen(() => lenOpts(m, false), 1800);
    }
    if (m.ketQua) apKetQua(m, m.ketQua.dung, true);
  }
  /** 4 o lua chon hien (ban mau oHien): vien ve .3 s, noi dung truot .4 s expo.out; dau ? bien mat */
  function lenOpts(m, ngay) {
    if (m.optsHien || !m.Os) return;
    m.optsHien = true;
    if (m.hOpts != null) { m.huy(m.hOpts); m.hOpts = null; }
    if (m.choOn) return;
    if (m.dauHoi) {
      if (ngay || giam()) m.dauHoi.style.display = 'none';
      else G.to(m.dauHoi, { scale: 0, autoAlpha: 0, duration: 0.2, ease: 'back.in(2)' });
    }
    m.Os.forEach((O, i) => {
      const t = i * 0.06;
      O.el.classList.remove('j-an');
      O.pg.style.opacity = '';
      if (ngay || giam()) { O.pg.style.strokeDasharray = 'none'; return; }
      G.fromTo(O.el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001, delay: t });
      G.fromTo(O.noi, { xPercent: -6 }, { xPercent: 0, duration: 0.4, ease: 'expo.out', delay: t, clearProps: 'transform' });
      G.fromTo(O.pg, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.3, ease: 'power2.inOut', delay: t, onComplete: () => { O.pg.style.strokeDasharray = 'none'; } });
    });
  }
  function camReset(T, ngay) {
    T.s = 1;
    if (ngay || giam()) G.set(T.cam, { x: 0, y: 0, scale: 1 });
    else G.to(T.cam, { x: 0, y: 0, scale: 1, duration: 0.3, ease: 'power2.inOut', overwrite: 'auto' });
  }
  function taoKhungCho(m) {
    const R = m.T && m.T.cells.R;
    if (!R) return null;
    if (m.slot && m.slot.isConnected) return m.slot;
    const cr = m.crR;
    const slot = nhet(R, cr, 'j-slot');
    slot.style.display = 'flex'; slot.style.flexDirection = 'column'; slot.style.alignItems = 'stretch'; slot.style.justifyContent = 'flex-start';
    // co chu dap an the that: 1 co chung (theo bac) — dap an dai -> 1 cot
    const dai = Math.max(1, ...(m.opts || []).map((o0) => em(tachNgoac(o0)[0])));
    const motCot = dai > 24 || st.dt;
    const wO = (cr.w - Math.round(16 * st.U) * (motCot ? 0 : 1)) / (motCot ? 1 : 2) - Math.round(110 * st.U);
    const fRong = wO / Math.max(1, dai / 2);
    const fCao = st.dt ? tk(4) * 0.8 : tk(3) * 0.7;
    slot.style.setProperty('--j-qf', f1(clamp(Math.min(fRong, fCao, m.qf || fCao), st.dt ? 15 : st.san.nhan, fCao)) + 'px');
    slot.classList.toggle('mot-cot', motCot);
    m.slot = slot;
    return slot;
  }
  function cueQuiz(m, id, tt) {
    const T = m.T;
    if (!T || m.fase !== 'qz') return;
    const tre = tt ? m.api.tre(tt) : 0;
    let x;
    if (id === 'Q1') { camDen(T, 'Q', tre); nhan(T, 'Q', tre); if (!giam()) { const b = T.cells.Q.noi.querySelector('.j-bong-x'); if (b) G.fromTo(b, { scale: 0.92 }, { scale: 1, duration: 0.3, ease: 'expo.out', delay: tre, clearProps: 'transform' }); } }
    else if ((x = /^Q2\.(\d+)$/.exec(id))) {
      lenOpts(m, false);
      const k = +x[1];
      const o = m.Os && m.Os[k];
      if (!m.choOn && o) {
        camDen(T, 'O' + k, tre);
        T.el.querySelectorAll('.j-qo.on').forEach((e) => e.classList.remove('on'));
        const bx = o.noi.querySelector('.j-qo');
        if (bx) { bx.classList.add('on'); if (!giam()) G.fromTo(bx, { scale: 1.06 }, { scale: 1, duration: 0.3, ease: 'back.out(2.2)', delay: tre, clearProps: 'transform' }); }
        nhan(T, 'O' + k, tre);
      }
    } else if (id === 'Q3') { /* goi y: the that hien o chan the */ }
  }
  /** Den luot hoc vien: the that vao o R. Tra phan tu chua */
  function oBaiTapQuiz(m) {
    if (m.slot && m.slot.isConnected) return m.slot;
    const T = m.T;
    if (!T || !T.cells.R) return null;
    m.choOn = true;
    if (m.hOpts != null) { m.huy(m.hOpts); m.hOpts = null; }
    (m.Os || []).forEach((O) => { O.el.style.display = 'none'; O.pg.style.display = 'none'; });
    if (m.dauHoi) m.dauHoi.style.display = 'none';
    const slot = taoKhungCho(m);
    camReset(T, false);
    nhan(T, 'R', 0);
    if (!giam()) G.fromTo(slot, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(-4% -4% -4% -4%)', duration: 0.4, ease: 'power3.inOut', clearProps: 'clipPath' });
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
    const bang = h('div', 'j-dau-kq j-tx ' + (dung ? 'dung' : 'sai'), Q.noi, dung ? '<span lang="ja">正解！</span> Chính xác!' : 'Chưa đúng!');
    bang.style.left = f1(crQ.x - Q.bx) + 'px';
    bang.style.bottom = f1(Q.by + Q.bh - (crQ.y + crQ.h)) + 'px';
    bang.style.maxWidth = f1(crQ.w) + 'px';
    if (!ngay) {
      if (giam()) G.fromTo(bang, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 });
      else {
        G.fromTo(bang, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: 'power3.inOut', clearProps: 'clipPath' });
        if (dung) { camDen(T, 'Q', 0); nhan(T, 'Q', 0.05); } else rung(T.cam, 0.02, 8 * st.U);
      }
    }
  }
  function traLoiQuiz(m, exId, dung) {
    m.ketQua = { exId, dung };
    apKetQua(m, dung, false);
  }


  // ---- the chuong / the ket bai (thay the the mac dinh) — ban mau trang 0 (bia) va trang 9 (tom tat)
  function layTheXong() {
    const { W, Yb } = st;
    if (st.dt) {
      const yA = Math.round(Yb * 0.44), t = Math.round(W * 0.026);
      const l1 = dN(yA + t, yA - t);
      const x1 = W / 3, x2 = W * 2 / 3, sl = W * 0.03;
      const v1 = [x1 + sl, 0, x1 - sl, yA], v2 = [x2 + sl, 0, x2 - sl, yA];
      return { R1: cell([l1, v1], [10, 10]), R2: cell([l1, v1, v2], [W / 2, 10]), R3: cell([l1, v2], [W - 10, 10]), G: cell([l1], [W / 2, Yb - 10]) };
    }
    const hT = Math.round(Yb * 0.56), t = W * 0.008;
    const l1 = dN(hT + t, hT - t);
    const x1 = W / 3, x2 = W * 2 / 3, sl = W * 0.03;
    const v1 = [x1 + sl, 0, x1 - sl, hT], v2 = [x2 + sl, 0, x2 - sl, hT];
    return { R1: cell([l1, v1], [10, 10]), R2: cell([l1, v1, v2], [W / 2, 10]), R3: cell([l1, v2], [W - 10, 10]), G: cell([l1], [W / 2, Yb - 10]) };
  }
  function veTheChuong(info, api) {
    const T = taoTrang();
    const m = st.mThe = ganHen({ T, rev: new Set(), api, vivo: true });
    st.rebuild = () => { doKhung(); const T2 = taoTrang(); m.T = T2; dungThe1(info, api, m, T2, true); xongAnim(T2); trangVao(T2, true); };
    dungThe1(info, api, m, T, false);
    trangVao(T, false);
    return true;
  }
  function dungThe1(info, api, m, T, ngay) {
    m.ngay = ngay;
    const pd = pad0();
    const lay = layBia();
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
    const A = addCell(T, 'A', lay.A);
    const B = addCell(T, 'B', lay.B);
    const E = lay.E ? addCell(T, 'E', lay.E) : null;
    datAnh(A, anh || (bai && bai.sceneImageUrl) || null, { pos: '50% 40%', thay: glyph || String(info.tenMoi || '').slice(0, 2), ht: 'ht-duoi' });
    const crB = crOf(B.poly, pd);
    veLopNet(B, crB, 81, st.dt ? 60 : 130);
    const nl = nhanLonTao(B, { x: crB.x, y: crB.y, w: crB.w, h: crB.h }, null, info.tenCu ? 'XONG ' + chuHoa(info.tenCu) : 'PHẦN TIẾP THEO', info.tenCu ? '✓' : '');
    const tagH = Math.round(tk(5) * 1.55);
    const p2 = nhet(B, { x: crB.x, y: crB.y + tagH, w: crB.w, h: crB.h - tagH }, 'j-bia-2');
    const toi = st.dt ? 6 : 10;
    const items = muc.filter(Boolean).slice(0, toi);
    const chipsH = items.length ? Math.round(tk(6) * 2.2) : 0;
    const bW = Math.min(crB.w, Math.round(tk(1) * 3.1)), bH = Math.round(Math.min(bW * 0.34, (crB.h - tagH) * 0.34));
    const bst = h('div', 'j-bia-bai j-tx', p2, burstSvg(bW, bH, 7, { n: 24, jit: 0.3 }) + `<b>${esc(chuHoa(info.tenMoi || ''))}</b>`);
    bst.style.width = bW + 'px'; bst.style.height = bH + 'px';
    fitDong(bst.lastChild, bW * 0.62, bacTu(2, 3), tk(4));
    const meta = h('div', 'j-bia-td j-tx', p2, jp(info.meta || ''));
    p2.style.gap = Math.round(pd * 0.5) + 'px';
    fitBac(meta, crB.w, Math.max(30, crB.h - tagH - bH - chipsH - pd * 1.2), bacTu(3, 4), st.san.nghia);
    let chips = null;
    if (items.length) {
      chips = h('div', 'j-chips j-tx', p2, items.map((x) => `<span class="j-chip"${RE_JP.test(x) ? ' lang="ja"' : ''}>${esc(ngan(x, 14))}</span>`).join('') + (muc.length > toi ? `<span class="j-chip">+${muc.length - toi}</span>` : ''));
      chips.style.fontSize = tk(6) + 'px';
      chips.style.maxWidth = Math.floor(crB.w) + 'px';
      while (chips.children.length > 2 && chips.scrollHeight > chipsH * 1.4) chips.lastElementChild.remove();
    }
    if (E) E.noi.innerHTML = '';
    camTuc(T, B.cx, B.cy);
    G.set([bst, meta], { autoAlpha: 0 });
    if (chips) G.set(chips, { autoAlpha: 0 });
    nhanLonLich(m, nl);
    if (!ngay) {
      capDat('Tiếp theo: ' + (info.tenMoi || '') + (info.meta ? ' · ' + info.meta : ''));
      if (giam()) G.set([bst, meta].concat(chips ? [chips] : []), { autoAlpha: 1 });
      else {
        G.fromTo(bst, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.55, ease: 'back.out(2.2)', delay: 0.75 });
        G.fromTo(meta, { clipPath: 'inset(0% 100% 0% 0%)' }, { autoAlpha: 1, clipPath: 'inset(-4% -4% -4% -4%)', duration: 0.5, ease: 'power3.inOut', delay: 1.15, clearProps: 'clipPath' });
        if (chips) G.fromTo(chips, { y: 20 * st.sx, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out', delay: 1.5 });
      }
    } else G.set([bst, meta].concat(chips ? [chips] : []), { autoAlpha: 1 });
    st.the = { A, B, E };
  }
  function veTheXong(info, api) {
    const T = taoTrang();
    const m = st.mThe = ganHen({ T, rev: new Set(), api, vivo: true });
    st.rebuild = () => { doKhung(); const T2 = taoTrang(); m.T = T2; dungThe2(info, api, m, T2, true); xongAnim(T2); trangVao(T2, true); };
    dungThe2(info, api, m, T, false);
    trangVao(T, false);
    return true;
  }
  function dungThe2(info, api, m, T, ngay) {
    m.ngay = ngay;
    const pd = pad0();
    const lay = layTheXong();
    const bai = (st.nh && st.nh.bai) || {};
    const tu = (bai.vocabList || []).filter((v) => v && v.imageUrl).slice(0, 3);
    ['R1', 'R2', 'R3'].forEach((id, i) => {
      const c = addCell(T, id, lay[id]);
      const v = tu[i];
      if (!v) { datAnh(c, null, { thay: ['私', '学', '先'][i], ht: 'ht-duoi' }); return; }
      datAnh(c, v.imageUrl, { pos: '50% 35%', thay: v.kanji || v.word, ht: 'ht-duoi', kb: true });
      const cr = crOf(c.poly, Math.round(pd * 0.6));
      const bx = nhet(c, cr, 'j-ghi-anh');
      bx.style.justifyContent = 'flex-end'; bx.style.alignItems = 'flex-start';
      const hop = h('div', 'j-tt-hop j-tx', bx, `<b lang="ja">${C.ruby(v.kanji || v.word, v.furigana || '')}</b><span>${esc(ngan(boNgoacCuoi(v.meaningVi), 22))}</span>`);
      const wHop = Math.floor(Math.min(cr.w, st.W * (st.dt ? 0.45 : 0.3)));
      hop.style.maxWidth = wHop + 'px';
      hop.firstChild.style.whiteSpace = 'nowrap';
      hop.querySelector('span').style.fontSize = (st.dt ? tk(6) : tk(5)) + 'px';
      fitBacMax(hop.firstChild, wHop - Math.round(20 * st.U), cr.h * 0.5, st.dt ? [tk(4), tk(5), tk(6)] : bacTu(3, 4), st.dt ? st.san.nhan : st.san.nghia);
      if (!ngay && !giam()) { hop.classList.add('j-cho'); hop.dataset.cho = 'R' + i; hop.dataset.fx = 'dap'; hop.dataset.s = '1.35'; m.hen(() => { if (m.vivo) hienKhoa(m, 'R' + i, 0); }, 650 + i * 300); }
    });
    const G_ = addCell(T, 'G', lay.G);
    const crG = crOf(G_.poly, pd);
    veLopNet(G_, crG, 91, st.dt ? 30 : 60);
    const wG = nhet(G_, crG, 'j-tk');
    const hang = (info.hang || []).slice(0, 6);
    const bW = st.dt ? 0 : Math.round(Math.min(crG.w * 0.3, tk(1) * 2.1));
    const ul = h('div', 'j-tk-ds j-tx', wG, `<div class="j-tk-t">HÔM NAY MÌNH ĐÃ HỌC</div>` + hang.map((r) => `<span class="j-tk-h"><span class="j-tk-n">${esc(r.nhan)}</span><b>${esc(r.so)}</b></span>`).join(''));
    ul.style.width = Math.floor(crG.w - (bW ? bW + pd : 0)) + 'px';
    ul.style.fontSize = tk(5) + 'px';
    while (ul.scrollHeight > crG.h + 0.6 && ul.querySelectorAll('.j-tk-h').length > 2) ul.querySelector('.j-tk-h:last-child').remove();
    if (bW) {
      const bh = Math.round(Math.min(crG.h, bW * 0.62));
      const bs = h('div', 'j-loai-bst j-tx', wG, burstSvg(bW, bh, 12, { n: 18, jit: 0.3, trong: 0.8 }) + '<b lang="ja">またね！</b>');
      bs.style.width = bW + 'px'; bs.style.height = bh + 'px';
      fitDong(bs.lastChild, bW * 0.62, bacTu(3, 3), tk(4));
      bs.style.position = 'absolute'; bs.style.right = '0px'; bs.style.top = '50%'; bs.style.marginTop = (-bh / 2) + 'px';
      if (!ngay && !giam()) G.fromTo(bs, { scale: 0.3, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.55, ease: 'back.out(2.2)', delay: 1.0 });
    }
    camTuc(T, G_.cx, G_.cy);
    if (!ngay) capDat('Hẹn gặp lại ở bài sau nhé! またね！');
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
        if (id === 'V0') { biaSangBai(m, tre); if (m.hChuyen != null) m.huy(m.hChuyen); m.hChuyen = m.hen(() => m.chuyen && m.chuyen(), 3300); return; }
        if (m.hChuyen != null) m.huy(m.hChuyen);
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
    if (nh.kind === 'quiz') lenOpts(m, false);
    chuoi(m, 0);
    (m.nhanLons || []).forEach((nl) => nhanLonThu(nl, 0));
    hienHet(m);
    if (m.tlK) { try { m.tlK.kill(); } catch (e) {} m.tlK = null; }
    if (m.T) { m.T.el.querySelectorAll('.j-tok.on').forEach((e) => e.classList.remove('on')); m.T.el.querySelectorAll('.j-rt-doc').forEach((e) => { e.style.visibility = 'visible'; }); }
  }

  /** Them hen / huy (dong ho GSAP: xac dinh, buoc duoc khi kiem thu; chet khi doi nhip / tam dung) vao doi tuong nhip m */
  function ganHen(m) {
    m.dcs = m.dcs || [];
    m.hen = (fn, ms) => { const d = G.delayedCall(ms / 1000, () => { if (m.vivo && L) { try { fn(); } catch (e) {} } }); m.dcs.push(d); return d; };
    m.huy = (d) => { try { if (d) d.kill(); } catch (e) {} };
    return m;
  }
  function taoM(nh, api) {
    const m = {
      nh, api, T: null, rev: new Set(), fase: '', vivo: true, tlK: null, ngay: false, dcs: [],
      cue(id, tt) { const f = CUE[nh.kind]; if (f && m.vivo) f(m, id, tt); },
      karaoke(ds) { if (m.vivo && (nh.kind === 'example' || nh.kind === 'kaiwa' || nh.kind === 'kaiwa-run')) karaokeCau(m, ds); },
      tro(idMuc, o) {
        if (!m.vivo || !m.T) return;
        const e = m.T.el.querySelector(`.j-tok[data-id="${String(idMuc).replace(/"/g, '')}"]`);
        if (e) { const k = +e.dataset.g; batTok(m, k); if (o && o.T != null) void o; }
      },
      loi(doan, raw, o) { capNhan(raw, o && o.luot); },
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
      roi() {
        m.vivo = false;
        (m.dcs || []).forEach((d) => { try { d.kill(); } catch (e) {} });
        m.dcs = [];
        if (m.tlK) { try { m.tlK.kill(); } catch (e) {} }
        (m.avs || []).forEach((a) => { try { a.go(); } catch (e) {} });
        m.avs = [];
        if (st.m === m) st.m = null;
      },
    };
    return ganHen(m);
  }

  // ---- phong chu: nap truoc bo chu hay dung; khi phong ve (do rong doi) thi dung lai trang hien tai khong hieu ung
  const MAU_JP = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだでどばびぶべぼぱぴぷぺぽゃゅょっーアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダデドバビブベボパピプペポャュョッー、。！？・「」（）〜私学生先';
  const MAU_VI = 'Tiếng Việt: ăâêôơưđ ẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴỶỸ ạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ 0123456789';
  function napPhong() {
    const F = document.fonts;
    if (!F || !F.load) return;
    try {
      F.load('900 40px "Noto Sans JP"', MAU_JP); F.load('700 40px "Noto Sans JP"', MAU_JP); F.load('900 40px "Noto Serif JP"', MAU_JP);
      F.load('800 40px "Be Vietnam Pro"', MAU_VI); F.load('900 40px "Be Vietnam Pro"', MAU_VI); F.load('italic 900 40px "Be Vietnam Pro"', MAU_VI); F.load('italic 700 40px "Be Vietnam Pro"', MAU_VI);
      F.load('400 40px "Dela Gothic One"', 'wa!ペコリ第話またね正解0123456789?');
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
      st.pages = []; st.T = null; st.dem = 0; st.cap = { luot: null, raw: '', off: 0, q: [], cur: null, tShow: 0, dwell: 1500, tm: null, tt: null }; st.probe = null; st.m = null; st.rebuild = null; st.tangKhoa = ''; st.vet = null;
      L.classList.add('j-nen');
      try {   // ky hieu truyen tranh cua avatar (? ! gan...) mot mau nhan do + vien trang: #avn-tang nam ngoai .cd-lop nen can quy tac rieng, go khi tat che do
        if (!document.getElementById('cd-j-avn')) { const sy = document.createElement('style'); sy.id = 'cd-j-avn'; sy.textContent = 'html body #avn-tang { --avn-mau: ' + DO + '; --avn-vien: #ffffff; }'; document.head.appendChild(sy); }
      } catch (e) {}
      st.vung = h('div', 'j-vung', L);
      napPhong();
      doKhung();
      khoiTang();
    },
    ketThuc() {
      if (G && L) { try { G.killTweensOf(L.querySelectorAll('*')); } catch (e) {} }
      if (st.cap) { try { if (st.cap.tm) st.cap.tm.kill(); if (st.cap.tt) st.cap.tt.kill(); } catch (e) {} st.cap = null; }
      if (st.onFont && document.fonts) { try { document.fonts.removeEventListener('loadingdone', st.onFont); } catch (e) {} }
      try { const sy = document.getElementById('cd-j-avn'); if (sy) sy.remove(); } catch (e) {}
      st.onFont = null; st.hFont = null;
      L = null; C = null; st.m = null; st.nh = null; st.T = null; st.pages = []; st.vung = null; st.tang = null; st.probe = null; st.rebuild = null; st.tangKhoa = ''; st.vet = null;
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
      if (kieu === 'chuan-bi' && st.cap && !st.cap.cur) capVe('', true);
    },
    dungNhip(nh, api) {
      const f = DUNG[nh.kind];
      if (!f || !L) return null;
      doKhung();
      khoiTang();
      st.nh = nh; st.api = api; st.nhT = performance.now();
      const m = taoM(nh, api);
      st.m = m;
      const T = taoTrang();
      m.T = T;
      st.rebuild = () => {
        doKhung();
        const T2 = taoTrang();
        m.T = T2;
        m.ngay = true;
        // cong the that (quiz): giu the + chan the khi dung lai trang
        const cu = m.slot && m.slot.isConnected ? { cong: m.slot.querySelector('.sk-cong'), chan: m.slot.querySelector('.cd-chan') } : null;
        m.slot = null;
        f(nh, api, m, T2, { ngay: true });
        if (cu && m.slot) { if (cu.cong) m.slot.appendChild(cu.cong); if (cu.chan) m.slot.appendChild(cu.chan); }
        xongAnim(T2);
        trangVao(T2, true);
      };
      const tb0 = performance.now();
      f(nh, api, m, T, {});
      if (st.cap && !st.cap.cur) capVe('', true);
      trangVao(T, false);
      (st.tb = st.tb || []).push({ kind: nh.kind, i: nh.i, ms: Math.round(performance.now() - tb0) });   // do thoi gian dung nhip (chan doan)
      try { if (window.__cdJVao) window.__cdJVao(T, nh); } catch (e) {}   // moc kiem thu: harness dung dong ho GSAP de buoc tung khung chuyen canh
      if (st.khungLoi) m.hLai = m.hen(() => { if (m.vivo && L && st.rebuild) { try { doKhung(); st.tangKhoa = ''; khoiTang(); st.rebuild(); } catch (e) {} } }, 160);
      return m;
    },
    theChuong(info, api) { return L ? veTheChuong(info, api) : false; },
    theXong(info, api) { return L ? veTheXong(info, api) : false; },
  });
})();
