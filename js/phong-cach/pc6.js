/* ==========================================================================
   Phong cach san khau giang 6 — "Video bai giang" (N5 bai 6)
   Nhu mot video khoa hoc chuyen nghiep (explainer / e-learning): mot LOP CHU THICH chay dung nhip loi
   Sensei — tieu diem (spotlight), camera day nhe vao, net but ve tay (khoanh tron, gach chan, mui ten
   cong, ngoac nhom, sao, dau dung / sai), nhan chu thich (pill + duong dan), but da quang quet theo
   karaoke, lower-third cho the chuong, cat canh nhanh (wipe + vet mo) giua cac nhip.

   KHONG doi LUC nao thu gi hien ra: moi chu thich MOC vao dieu dao dien / canh vua lam:
     - con tro doc (dao dien .sk-con-tro + the.__ctEl; canh chu .sk-chu-tro doc toa do 6 manh) -> phan tu
       Sensei DANG NOI -> tieu diem + chu thich theo ngu canh (quy tac o khiTieuDiem)
     - SenseiMotion.hu.nhan / quet / karaoke / hien / chip duoc boc (goi ham goc truoc, roi bao su kien)
     - lop cua dao dien / app tren san khau: .is-noi (nguoi dang noi), .is-ve (net chu Han bat dau),
       .is-day (o cong thuc vi du duoc dien), bo .sk-an (dong phu hien theo loi), .qz-opt.is-correct /
       .is-wrong / .is-answer (phan hoi cham bai trong the that dua qua cong)
   Toi da 2 chu thich cung luc; cai cu mo di khi tieu diem doi; doi nhip / tam dung: xoa sach.
   Chi transform / opacity / stroke-dashoffset. SVG cua moi the tao MOT lan, dung lai suot nhip.

   Cach bat: Element.prototype.animate duoc boc (chi doi hieu ung vao / ra cap the -> cat canh video) va
   cac ham hu.* duoc boc — CHI khi dang bat; ketThuc tra lai nguyen ven (neu da bi phong cach khac boc
   chong len thi lop cua minh chi chuyen tiep, khong con tac dung).
   Giam chuyen dong: chu thich hien ngay (khong ve), khong camera, khong wipe.

   Dang ky: window.SenseiPhongCach.pc6 = { ten, batDau(stageEl), ketThuc(stageEl) }.
   Kiem thu: window.__pc6 = { nhatKy(), trangThai() }.
   ========================================================================== */
(function () {
  'use strict';

  const TEN = 'pc6';
  const SEL = '.san-khau-giang[data-phong-cach="pc6"]';
  const NS = 'http://www.w3.org/2000/svg';
  const E_OUT = 'cubic-bezier(.33,1,.68,1)';       // easeOutCubic
  const E_POP = 'cubic-bezier(.34,1.56,.64,1)';    // vuot nhe (sao, huy hieu)
  const E_IN = 'cubic-bezier(.55,0,.85,.35)';
  const E_CAT = 'cubic-bezier(.16,1,.3,1)';        // cat canh: vao nhanh, dung em
  const TOI_DA = 2;                                 // chu thich cung luc
  const GIU_CAP = 2800;                             // chu thich truoc con song neu moi ve < 2.8 s (cap: to + sao)
  const TU_MO = 7000;                               // chu thich tu mo sau 7 s
  const CAM_GIU = 1700, CAM_CACH = 2600;

  // Ung vien dich cua con tro canh chu (so khop toa do)
  const UNG_VIEN = '.sk-chu-noi, .sk-chu-noi span, .sk-chu-noi div, .sk-chu-noi li, .sk-chu-noi dd, .sk-kj-o, .sk-vd-tok, '
    + '.sk-np-chip, .sk-np-o, .sk-np-muc, .sk-np-lit, .sk-kj-gt, .sk-kj-tu-w, .sk-tv-bien-tu, .sk-np-cau, .sk-kj-tu-dong';
  const TOK = '.sk-vd-tok, .sk-ht-tok, .sk-c-tok';
  const CAU = '.sk-vd-cau, .sk-ht-cau, .sk-c-cau';
  const DOC_TRO = { 'は': 'wa', 'へ': 'e', 'を': 'o' };
  const TRO_TU = /^(は|が|を|に|で|へ|と|も|の|か|や|から|まで|より|ね|よ)$/;

  const st = {
    bat: false, san: null, mo: null, moBody: null, cho: null, raf: 0,
    goc: null, boc: null, huGoc: null, huBoc: null,
    the: null, gen: 0, lop: null, svg: null, nen: null, den: null, denKhung: null, denHien: false, denHop: null,
    an: [], daLam: new Set(), F: null, hang: [], hen: new Set(), camLuc: -1e9, camHen: null,
    cau: null, bang: null, cat: null, karaokeLuc: -1e9, che: '', qzDa: [], henCuon: null, tuc: false, ro: null, roKhoa: '', log: [], seed: 1, latThe: null,
  };

  // ------------------------------------------------------------------ tien ich
  const giam = () => { if (st.tuc) return true; try { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } };
  const hep = () => (window.innerWidth || 1024) <= 640;
  const dangBat = () => !!(st.bat && st.san && st.san.isConnected && st.san.getAttribute('data-phong-cach') === TEN);
  const canhBao = (noi, e) => { try { console.warn('[pc6] ' + noi, e); } catch (x) {} };
  const ghi = (loai, x) => { st.log.push({ t: Math.round(performance.now()), loai, x: x || '' }); if (st.log.length > 400) st.log.splice(0, 100); };
  const chu = (el) => String((el && el.textContent) || '').replace(/\s+/g, ' ').trim();
  const kep = (x, a, b) => Math.max(a, Math.min(b, x));
  const rnd = () => { st.seed = (st.seed * 16807) % 2147483647; return (st.seed - 1) / 2147483646; };
  const f1 = (n) => (Math.round(n * 10) / 10).toString();

  /** Goi animate goc (khong qua boc cua minh) */
  function hoat(el, kf, o) {
    if (!el) return null;
    try { return (st.goc || Element.prototype.animate).call(el, kf, o); } catch (e) { return null; }
  }
  /** Hen gio gan voi the he nhip (doi nhip / tam dung la chet) */
  function sau(ms, fn) {
    const g = st.gen;
    const id = setTimeout(() => { st.hen.delete(id); if (g !== st.gen || !dangBat()) return; try { fn(); } catch (e) { canhBao('hen', e); } }, Math.max(0, ms));
    st.hen.add(id);
    return id;
  }
  function huyHen() { st.hen.forEach((id) => clearTimeout(id)); st.hen.clear(); }

  /** Hop BO CUC (offsetLeft/Top theo chuoi offsetParent — bo qua transform dang chay) cua el trong goc */
  function boCuc(el, goc) {
    if (!el || !goc || !el.isConnected) return null;
    if (el instanceof HTMLElement) {
      let x = 0, y = 0, e = el;
      while (e && e !== goc) {
        x += e.offsetLeft; y += e.offsetTop;
        const p = e.offsetParent;
        if (!p || (p !== goc && !goc.contains(p))) { e = null; break; }
        if (p !== goc) { x += p.clientLeft; y += p.clientTop; }
        e = p;
      }
      if (e === goc && (el.offsetWidth || el.offsetHeight)) {
        // khung cuon o giua (the bai tap qua cong cuon muot): tru phan da cuon
        for (let p = el.parentElement; p && p !== goc; p = p.parentElement) { x -= p.scrollLeft || 0; y -= p.scrollTop || 0; }
        return { x, y, w: el.offsetWidth, h: el.offsetHeight };
      }
    }
    return thay(el, goc);
  }
  /** Ti le camera hien tai cua the (transform dang chay cung tinh) */
  function tiLe(goc) {
    try { const m = new DOMMatrixReadOnly(getComputedStyle(goc).transform); return m.a || 1; } catch (e) { return 1; }
  }
  /** Hop NHIN THAY (co transform) doi ve toa do trong goc */
  function thay(el, goc) {
    if (!el || !goc) return null;
    const r = el.getBoundingClientRect(), g = goc.getBoundingClientRect();
    if (!r.width && !r.height) return null;
    const s = tiLe(goc);
    return { x: (r.left - g.left) / s, y: (r.top - g.top) / s, w: r.width / s, h: r.height / s };
  }
  /** Cac dong chu cua el (toa do trong goc; bo furigana <rt>), da bu lech transform cua chinh el */
  function dongChu(el, goc) {
    if (!el || !goc) return [];
    const g = goc.getBoundingClientRect(), s = tiLe(goc);
    const b = boCuc(el, goc), v = thay(el, goc);
    const dx = b && v ? b.x - v.x : 0, dy = b && v ? b.y - v.y : 0;
    const rg = document.createRange();
    const ds = [];
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) {
      if (!n.textContent.trim()) continue;
      const p = n.parentElement;
      if (p && p.closest('rt, .pc6-lop')) continue;
      rg.selectNodeContents(n);
      for (const r of rg.getClientRects()) {
        if (r.width < 1 || r.height < 1) continue;
        ds.push({ x: (r.left - g.left) / s + dx, y: (r.top - g.top) / s + dy, w: r.width / s, h: r.height / s });
      }
    }
    // gop theo dong (giao nhau theo chieu doc > 50%)
    ds.sort((a, c) => a.y - c.y || a.x - c.x);
    const dong = [];
    for (const r of ds) {
      const d = dong.find((q) => Math.min(q.y + q.h, r.y + r.h) - Math.max(q.y, r.y) > Math.min(q.h, r.h) * 0.5);
      if (d) { const x0 = Math.min(d.x, r.x), x1 = Math.max(d.x + d.w, r.x + r.w), y0 = Math.min(d.y, r.y), y1 = Math.max(d.y + d.h, r.y + r.h); Object.assign(d, { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }); }
      else dong.push(Object.assign({}, r));
    }
    return dong.sort((a, c) => a.y - c.y);
  }
  const iou = (a, b) => {
    const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
    const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    const i = x * y, u = a.w * a.h + b.w * b.h - i;
    return u > 0 ? i / u : 0;
  };
  const tach = (s) => { const a = String(s || '').trim().split(/\s+/).map(parseFloat); return [isFinite(a[0]) ? a[0] : 0, isFinite(a[1]) ? a[1] : 0]; };

  // ------------------------------------------------------------------ the song + lop phu
  const oThe = () => st.san && st.san.querySelector('.sk-o-the');
  function theSong() {
    const o = oThe();
    if (!o) return null;
    for (const t of o.children) {
      if (t.classList.contains('sk-the') && !t.classList.contains('sk-ra') && !t.classList.contains('sk-the-truoc') && t.style.opacity !== '0') return t;
    }
    return null;
  }
  /** Tao lop phu cho the (mot lan / nhip): nen (but da quang, sau chu), man (spotlight), lop (net + nhan) */
  function taoLop(the) {
    const nen = document.createElement('div');
    nen.className = 'pc6-nen';
    const denKhung = document.createElement('div');
    denKhung.className = 'pc6-den-khung';
    const den = document.createElement('i');
    den.className = 'pc6-den';
    denKhung.appendChild(den);
    const lop = document.createElement('div');
    lop.className = 'pc6-lop';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'pc6-svg');
    lop.appendChild(svg);
    [nen, denKhung, lop].forEach((x) => { x.setAttribute('aria-hidden', 'true'); x.setAttribute('data-sk-tro', ''); });
    the.prepend(nen);
    the.append(denKhung, lop);
    Object.assign(st, { nen, den, denKhung, lop, svg, denHien: false, denHop: null });
  }
  function goLop(the, mo) {
    if (!the) return;
    const ds = [...the.querySelectorAll(':scope > .pc6-nen, :scope > .pc6-den-khung, :scope > .pc6-lop')];
    if (mo && !giam()) {
      ds.forEach((x) => { const a = hoat(x, [{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: E_IN, fill: 'forwards' }); if (a) a.onfinish = () => x.remove(); });
      setTimeout(() => ds.forEach((x) => x.remove()), 400);
    } else ds.forEach((x) => x.remove());
    the.style.transform = '';
    the.classList.remove('pc6-cam');
  }

  // ------------------------------------------------------------------ chu thich (quan ly)
  function themAn(a) {
    const now = performance.now();
    a.luc = now;
    a.gen = st.gen;
    // chi giu cai moi nhat neu no vua ve (< 2.8 s) hoac dang dinh (bang karaoke dang doc) — toi da 2
    const con = [];
    for (let i = st.an.length - 1; i >= 0; i--) {
      const x = st.an[i];
      const giu = con.length < TOI_DA - 1 && (x.dinh || now - x.luc < GIU_CAP || (a.nhom && x.nhom === a.nhom));
      if (giu) con.unshift(x); else boAn(x);
    }
    st.an = con.concat(a);
    if (!a.dinh) a.hetHan = sau(TU_MO, () => boAn(a));
    ghi('an', a.ten);
    return a;
  }
  function boAn(a, ngay) {
    if (!a || a.bo) return;
    a.bo = true;
    st.an = st.an.filter((x) => x !== a);
    (a.nut || []).forEach((n) => {
      if (!n || !n.isConnected) return;
      if (ngay || giam()) { n.remove(); return; }
      const h = hoat(n, [{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: E_IN, fill: 'forwards' });
      if (h) h.onfinish = () => n.remove(); else n.remove();
      setTimeout(() => { if (n.isConnected) n.remove(); }, 500);
    });
    if (a.khiBo) try { a.khiBo(); } catch (e) {}
  }
  function xoaAn(ngay) { st.an.slice().forEach((a) => boAn(a, ngay)); st.an = []; }

  // ------------------------------------------------------------------ nguyen to ve (SVG, toa do trong the)
  function nhom(lop) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'pc6-g' + (lop ? ' ' + lop : ''));
    st.svg.appendChild(g);
    return g;
  }
  function duong(g, d, lop) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('pathLength', '1');
    p.setAttribute('class', 'pc6-net' + (lop ? ' ' + lop : ''));
    g.appendChild(p);
    return p;
  }
  /** Net ve: dashoffset 1 -> 0 (trang thai cuoi dat truoc) */
  function veNet(p, ms, tre, easing) {
    p.style.strokeDasharray = '1 1';
    p.style.strokeDashoffset = '0';
    if (giam()) return;
    hoat(p, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: ms, delay: tre || 0, easing: easing || E_OUT, fill: 'backwards' });
  }
  function pop(el, ms, tre, tu) {
    if (giam() || !el) return;
    hoat(el, [{ opacity: 0, transform: `scale(${tu || 0.4})` }, { opacity: 1, transform: 'scale(1.1)', offset: 0.62 }, { opacity: 1, transform: 'scale(1)' }],
      { duration: ms || 420, delay: tre || 0, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'backwards' });
  }
  function hienDan(el, ms, tre, dx, dy) {
    if (giam() || !el) return;
    hoat(el, [{ opacity: 0, transform: `translate(${dx || 0}px, ${dy || 0}px)` }, { opacity: 1, transform: 'translate(0,0)' }],
      { duration: ms || 320, delay: tre || 0, easing: E_OUT, fill: 'backwards' });
  }
  /** Duong cong tron qua cac diem (Catmull-Rom -> Bezier) */
  function cong(pts, dong) {
    if (pts.length < 2) return '';
    let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
    }
    return d + (dong ? ' Z' : '');
  }
  /** Vong khoanh ve tay: elip hoi lech, net cuoi vuot qua diem dau (xoan nhe) */
  function duongVong(r, le) {
    const lx = le != null ? le : Math.max(7, Math.min(16, r.h * 0.28)), ly = Math.max(5, Math.min(12, r.h * 0.22));
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const rx = r.w / 2 + lx, ry = r.h / 2 + ly;
    const a0 = -2.1 + rnd() * 0.3, quet = Math.PI * 2 + 0.42;
    const f1a = rnd() * 6, f2a = rnd() * 6, nghieng = (rnd() - 0.5) * 0.06;
    const N = 30, pts = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, a = a0 + quet * u;
      const k = 1 + 0.03 * Math.sin(2 * a + f1a) + 0.018 * Math.sin(3 * a + f2a) + 0.06 * u;
      const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
      pts.push([cx + x * Math.cos(nghieng) - y * Math.sin(nghieng), cy + x * Math.sin(nghieng) + y * Math.cos(nghieng)]);
    }
    return cong(pts);
  }
  function duongGach(x0, x1, y) {
    const w = x1 - x0, n = Math.max(3, Math.round(w / 60));
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      pts.push([x0 + w * u, y + Math.sin(u * Math.PI) * -1.6 + (rnd() - 0.5) * 1.4 + u * 1.2]);
    }
    return cong(pts);
  }
  /** Ngoac nhom nam ngang duoi (hoac tren) mot hang: ⏟ */
  function duongNgoac(x0, x1, y, h) {
    const xm = (x0 + x1) / 2, q = Math.min(10, (x1 - x0) / 6);
    const y1 = y + h / 2, y2 = y + h;
    return `M${f1(x0)} ${f1(y)} Q${f1(x0)} ${f1(y1)} ${f1(x0 + q)} ${f1(y1)} L${f1(xm - q)} ${f1(y1)} Q${f1(xm)} ${f1(y1)} ${f1(xm)} ${f1(y2)}`
      + ` M${f1(xm)} ${f1(y2)} Q${f1(xm)} ${f1(y1)} ${f1(xm + q)} ${f1(y1)} L${f1(x1 - q)} ${f1(y1)} Q${f1(x1)} ${f1(y1)} ${f1(x1)} ${f1(y)}`;
  }
  function duongSao(cx, cy, R) {
    const r = R * 0.45, pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r : R;
      pts.push(`${f1(cx + Math.cos(a) * k)} ${f1(cy + Math.sin(a) * k)}`);
    }
    return 'M' + pts.join(' L') + ' Z';
  }

  // ------------------------------------------------------------------ chu thich (loai)
  /** Khoanh tron quanh el (+ nhan chu thich tuy chon) */
  function khoanh(el, o) {
    o = o || {};
    const r = o.hop || boCuc(el, st.the);
    if (!r) return null;
    const g = nhom('pc6-vong');
    const p = duong(g, duongVong(r, o.le));
    veNet(p, o.ms || 560, o.tre || 0);
    const a = { ten: 'khoanh:' + chu(el).slice(0, 12), nut: [g], nhom: o.nhom };
    if (o.nhan) {
      const n = nhan(o.nhan, r, { tre: (o.tre || 0) + 380, le: o.le });
      if (n) a.nut.push(...n);
    }
    return themAn(a);
  }
  /** Gach chan ve tay duoi (cac dong cua) el */
  function gachChan(el, o) {
    o = o || {};
    let ds = dongChu(el, st.the);
    if (!ds.length) { const r = boCuc(el, st.the); if (r) ds = [r]; }
    if (!ds.length) return null;
    ds = ds.slice(0, 2);
    const g = nhom('pc6-gach');
    ds.forEach((r, i) => {
      const p = duong(g, duongGach(r.x - 3, r.x + r.w + 4, r.y + r.h + 3));
      veNet(p, Math.min(640, 300 + r.w * 0.8), (o.tre || 0) + i * 260);
    });
    return themAn({ ten: 'gach:' + chu(el).slice(0, 12), nut: [g], nhom: o.nhom });
  }
  /** Mui ten cong tu nguon toi dich */
  function muiTen(tu, den, o) {
    o = o || {};
    const a = tu && (tu.x != null ? tu : boCuc(tu, st.the)), b = den && (den.x != null ? den : boCuc(den, st.the));
    if (!a || !b) return null;
    const ca = [a.x + a.w / 2, a.y + a.h / 2], cb = [b.x + b.w / 2, b.y + b.h / 2];
    // diem dau / cuoi tren mep hop (theo huong noi hai tam) + lui ra 6px
    const mep = (r, c, huong) => {
      const [dx, dy] = huong;
      const tx = dx ? (r.w / 2 + 6) / Math.abs(dx) : Infinity, ty = dy ? (r.h / 2 + 6) / Math.abs(dy) : Infinity;
      const t = Math.min(tx, ty);
      return [c[0] + dx * t, c[1] + dy * t];
    };
    const L = Math.hypot(cb[0] - ca[0], cb[1] - ca[1]) || 1;
    const u = [(cb[0] - ca[0]) / L, (cb[1] - ca[1]) / L];
    const p0 = mep(a, ca, u), p1 = mep(b, cb, [-u[0], -u[1]]);
    const d = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    if (d < 16) return null;
    const bung = (o.bung != null ? o.bung : 0.22) * d * (o.chieu || 1);
    const m = [(p0[0] + p1[0]) / 2 - u[1] * bung, (p0[1] + p1[1]) / 2 + u[0] * bung];
    const g = nhom('pc6-mui');
    const than = duong(g, `M${f1(p0[0])} ${f1(p0[1])} Q${f1(m[0])} ${f1(m[1])} ${f1(p1[0])} ${f1(p1[1])}`);
    // dau mui ten theo tiep tuyen cuoi
    const tx = p1[0] - m[0], ty = p1[1] - m[1], tl = Math.hypot(tx, ty) || 1;
    const k = hep() ? 8 : 10, goc = 0.5;
    const hx = tx / tl, hy = ty / tl;
    const c1 = [p1[0] - k * (hx * Math.cos(goc) - hy * Math.sin(goc)), p1[1] - k * (hy * Math.cos(goc) + hx * Math.sin(goc))];
    const c2 = [p1[0] - k * (hx * Math.cos(-goc) - hy * Math.sin(-goc)), p1[1] - k * (hy * Math.cos(-goc) + hx * Math.sin(-goc))];
    const dau = duong(g, `M${f1(c1[0])} ${f1(c1[1])} L${f1(p1[0])} ${f1(p1[1])} L${f1(c2[0])} ${f1(c2[1])}`);
    const ms = o.ms || kep(360 + d * 0.6, 420, 700);
    veNet(than, ms, o.tre || 0);
    veNet(dau, 180, (o.tre || 0) + ms - 40);
    return themAn({ ten: 'muiTen', nut: [g], nhom: o.nhom });
  }
  /** Sao (dau sao) + tia bung ra, vuot nhe */
  function sao(cx, cy, o) {
    o = o || {};
    const R = o.R || (hep() ? 9 : 11);
    const g = nhom('pc6-sao');
    g.style.transformOrigin = `${f1(cx)}px ${f1(cy)}px`;
    const s = duong(g, duongSao(cx, cy, R), 'is-dac');
    veNet(s, 380, o.tre || 0);
    const tia = [];
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + Math.PI / 6 + i * Math.PI / 3;
      const r0 = R * 1.45, r1 = R * 2.05;
      const t = duong(g, `M${f1(cx + Math.cos(a) * r0)} ${f1(cy + Math.sin(a) * r0)} L${f1(cx + Math.cos(a) * r1)} ${f1(cy + Math.sin(a) * r1)}`, 'is-tia');
      tia.push(t);
    }
    if (!giam()) {
      hoat(g, [{ transform: 'scale(.3) rotate(-24deg)', opacity: 0 }, { transform: 'scale(1.16) rotate(4deg)', opacity: 1, offset: 0.6 }, { transform: 'scale(1) rotate(0deg)', opacity: 1 }],
        { duration: 520, delay: o.tre || 0, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'backwards' });
      tia.forEach((t, i) => veNet(t, 260, (o.tre || 0) + 240 + i * 25));
      // tia bung roi mo (chi opacity) — sao o lai
      tia.forEach((t) => hoat(t, [{ opacity: 1 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 900, delay: (o.tre || 0) + 300, easing: 'linear', fill: 'forwards' }));
    } else tia.forEach((t) => { t.style.opacity = '0'; });
    return themAn({ ten: 'sao', nut: [g], nhom: o.nhom, dinh: o.dinh });
  }
  function dauDung(r, o) {
    o = o || {};
    const g = nhom('pc6-dung');
    const h = kep(r.h * 0.62, 14, 26), x = r.x, y = r.y + r.h / 2;
    const p = duong(g, `M${f1(x - h * 0.42)} ${f1(y)} Q${f1(x - h * 0.2)} ${f1(y + h * 0.18)} ${f1(x - h * 0.08)} ${f1(y + h * 0.42)} Q${f1(x + h * 0.25)} ${f1(y - h * 0.3)} ${f1(x + h * 0.62)} ${f1(y - h * 0.6)}`);
    veNet(p, 380, o.tre || 0);
    return themAn({ ten: 'dung', nut: [g], nhom: o.nhom, dinh: true });
  }
  function dauSai(r, o) {
    o = o || {};
    const g = nhom('pc6-sai');
    const k = kep(r.h * 0.3, 7, 11), x = r.x, y = r.y + r.h / 2;
    const a = duong(g, `M${f1(x - k)} ${f1(y - k)} L${f1(x + k)} ${f1(y + k)}`);
    const b = duong(g, `M${f1(x + k)} ${f1(y - k)} L${f1(x - k)} ${f1(y + k)}`);
    veNet(a, 200, o.tre || 0); veNet(b, 200, (o.tre || 0) + 170);
    return { nut: [g] };
  }
  /** Nhan chu thich (pill) + duong dan mong toi hop r. Tra ve cac nut (khong tu them vao danh sach) */
  function nhan(text, r, o) {
    o = o || {};
    if (!st.lop || !r) return null;
    const W = st.the.clientWidth, H = st.the.clientHeight;
    const n = document.createElement('span');
    n.className = 'pc6-nhan' + (o.lop ? ' ' + o.lop : '');
    n.textContent = text;
    st.lop.appendChild(n);
    const nw = n.offsetWidth, nh = n.offsetHeight;
    const ly = Math.max(5, Math.min(12, r.h * 0.22)) + 4;
    let duoi = r.y + r.h + ly + 12 + nh < H - 8;
    if (o.tren) duoi = !(r.y - ly - 12 - nh > 8);
    const cx = r.x + r.w / 2 + (o.lech || 0);
    const x = kep(cx - nw / 2, 8, W - nw - 8);
    const y = duoi ? r.y + r.h + ly + 12 : r.y - ly - 12 - nh;
    n.style.left = f1(x) + 'px';
    n.style.top = f1(y) + 'px';
    const g = nhom('pc6-dan');
    const y0 = duoi ? r.y + r.h + ly - 2 : r.y - ly + 2, y1 = duoi ? y : y + nh;
    const x1 = kep(cx, x + 10, x + nw - 10);
    const p = duong(g, `M${f1(cx)} ${f1(y0)} L${f1(x1)} ${f1(y1)}`);
    veNet(p, 200, o.tre || 0);
    hienDan(n, 300, (o.tre || 0) + 120, 0, duoi ? -6 : 6);
    return [g, n];
  }
  /** Huy hieu so (①②③) tai diem (x, y) = tam */
  function huyHieu(so, x, y, o) {
    o = o || {};
    const n = document.createElement('span');
    n.className = 'pc6-so' + (o.lop ? ' ' + o.lop : '');
    n.textContent = String(so);
    st.lop.appendChild(n);
    n.style.left = f1(x) + 'px';
    n.style.top = f1(y) + 'px';
    pop(n, 420, o.tre || 0, 0.3);
    return n;
  }
  /** But da quang quet ngang sau chu (lop nen): hop r, ms */
  function vetTo(r, o) {
    o = o || {};
    const b = document.createElement('i');
    b.className = 'pc6-to' + (o.lop ? ' ' + o.lop : '');
    b.style.left = f1(r.x) + 'px';
    b.style.top = f1(r.y) + 'px';
    b.style.width = f1(r.w) + 'px';
    b.style.height = f1(r.h) + 'px';
    st.nen.appendChild(b);
    if (!giam()) hoat(b, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: o.ms || 460, delay: o.tre || 0, easing: E_OUT, fill: 'backwards' });
    return b;
  }
  /** Bong thoai ve tay quanh nhan nguoi noi (duoi co duoi nho chi xuong cau) */
  function bongThoai(el, o) {
    o = o || {};
    // chi om avatar + ten (khoi .sk-ht-ai co the keo het be rong)
    const hs = [...el.children].map((c) => (c.matches('.sk-ht-ten') ? (dongChu(c, st.the)[0] || boCuc(c, st.the)) : boCuc(c, st.the))).filter((x) => x && x.w && x.h);
    let r = null;
    if (hs.length) {
      const x0 = Math.min(...hs.map((x) => x.x)), y0 = Math.min(...hs.map((x) => x.y));
      const x1 = Math.max(...hs.map((x) => x.x + x.w)), y1 = Math.max(...hs.map((x) => x.y + x.h));
      r = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    } else r = boCuc(el, st.the);
    if (!r) return null;
    const px = 9, py = 6, R = Math.min(14, (r.h + 2 * py) / 2);
    const x0 = r.x - px, y0 = r.y - py, x1 = r.x + r.w + px, y1 = r.y + r.h + py;
    const tx = x0 + Math.min(28, (x1 - x0) * 0.3);
    const d = `M${f1(x0 + R)} ${f1(y0)} L${f1(x1 - R)} ${f1(y0)} Q${f1(x1)} ${f1(y0)} ${f1(x1)} ${f1(y0 + R)} L${f1(x1)} ${f1(y1 - R)} Q${f1(x1)} ${f1(y1)} ${f1(x1 - R)} ${f1(y1)}`
      + ` L${f1(tx + 12)} ${f1(y1)} L${f1(tx + 2)} ${f1(y1 + 9)} L${f1(tx)} ${f1(y1)} L${f1(x0 + R)} ${f1(y1)} Q${f1(x0)} ${f1(y1)} ${f1(x0)} ${f1(y1 - R)} L${f1(x0)} ${f1(y0 + R)} Q${f1(x0)} ${f1(y0)} ${f1(x0 + R)} ${f1(y0)}`;
    const g = nhom('pc6-bong');
    g.style.transformOrigin = `${f1(tx)}px ${f1(y1)}px`;
    const p = duong(g, d);
    veNet(p, 520, o.tre || 0);
    if (!giam()) hoat(g, [{ transform: 'scale(.9)', opacity: 0 }, { transform: 'scale(1.03)', opacity: 1, offset: 0.55 }, { transform: 'scale(1)', opacity: 1 }], { duration: 420, delay: o.tre || 0, easing: E_OUT, fill: 'backwards' });
    return themAn({ ten: 'bong:' + chu(el).slice(0, 8), nut: [g], nhom: o.nhom });
  }

  // ------------------------------------------------------------------ tieu diem (spotlight) + camera
  function donVi(F) {
    if (!F || !F.closest) return F;
    const x = F.closest('.sk-ht-bong') || (F.matches(TOK) && F.closest(CAU)) || F.closest('.sk-np-hang') || F.closest('.sk-kj-dong')
      || F.closest('.sk-kj-tu-dong') || F.closest('.sk-tv-dau') || F.closest('.qz-opt') || F.closest('.sk-ht-khac') || F.closest('.sk-ht-vai')
      || F.closest('.sk-ht-o');
    return x || F;
  }
  function datDen(el) {
    if (!st.den || !st.the) return;
    const r = el ? boCuc(el, st.the) : null;
    const W = st.the.clientWidth, H = st.the.clientHeight;
    if (!r || !W || !H || r.w * r.h > W * H * 0.55) { tatDen(); return; }
    const px = hep() ? 8 : 12, py = hep() ? 6 : 8;
    const b = { x: r.x - px, y: r.y - py, w: r.w + 2 * px, h: r.h + 2 * py };
    const a = st.denHop;
    const s = st.den.style;
    s.left = f1(b.x) + 'px'; s.top = f1(b.y) + 'px'; s.width = f1(b.w) + 'px'; s.height = f1(b.h) + 'px';
    st.denHop = b;
    if (!st.denHien) {
      st.denHien = true;
      st.denKhung.classList.add('is-hien');
      return;
    }
    if (a && !giam()) {
      const dx = a.x - b.x, dy = a.y - b.y, sx = a.w / b.w, sy = a.h / b.h;
      if (Math.abs(dx) + Math.abs(dy) > 1 || Math.abs(sx - 1) > 0.01 || Math.abs(sy - 1) > 0.01) {
        hoat(st.den, [{ transform: `translate(${f1(dx)}px, ${f1(dy)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})` }, { transform: 'none' }], { duration: 420, easing: E_OUT });
      }
    }
  }
  function tatDen() {
    if (!st.denKhung) return;
    st.denHien = false;
    st.denHop = null;
    st.denKhung.classList.remove('is-hien');
  }
  /** Camera day vao nhe toi el roi lui ra (transform tren khung .sk-the, CSS transition) */
  function camera(el, ep) {
    if (giam() || !st.the || !el) return;
    const now = performance.now();
    if (now - st.camLuc < CAM_CACH) return;
    // mot lan day vao moi nhip (khoanh khac chinh), tru phan hoi dung cua bai tap
    if (st.camDa && !ep) return;
    st.camDa = true;
    const r = boCuc(el, st.the);
    if (!r) return;
    st.camLuc = now;
    const s = hep() ? 1.018 : 1.032;
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const the = st.the;
    the.classList.add('pc6-cam');
    the.style.transform = `translate(${f1((1 - s) * cx)}px, ${f1((1 - s) * cy)}px) scale(${s})`;
    if (st.camHen) clearTimeout(st.camHen);
    st.camHen = sau(CAM_GIU, () => { if (the.isConnected) the.style.transform = ''; st.camHen = null; });
    ghi('camera', chu(el).slice(0, 12));
  }

  // ------------------------------------------------------------------ but da quang karaoke (cau vi du / thoai)
  function toCau(cau, tok) {
    const ds = [...cau.querySelectorAll(TOK)].filter((t) => t.offsetWidth);
    const k = ds.indexOf(tok);
    if (k < 0) return;
    let b = st.bang;
    // doc lai tu dau (karaoke moi / lan doc thu hai cua canh chu) -> bang moi; nhan manh mot token da doc -> khoanh
    const docLai = b && b.cau === cau && b.the === st.the && k < b.k
      && (performance.now() - st.karaokeLuc < 1500 || (k === 0 && !cau.matches('.sk-ht-cau')));
    if (b && b.cau === cau && b.the === st.the && k < b.k && !docLai) {
      if (mot('nhan-tok:' + k)) khoanh(tok, { le: 7, nhom: 'cau' });
      return;
    }
    if (!b || b.cau !== cau || b.the !== st.the || docLai) {
      // cau moi / doc lai tu dau: bang moi (bang cu mo di)
      if (b && b.an) boAn(b.an);
      const hop = ds.map((t) => boCuc(t, st.the));
      const dong = [];
      hop.forEach((r, i) => {
        if (!r) return;
        const d = dong.find((q) => Math.min(q.y + q.h, r.y + r.h) - Math.max(q.y, r.y) > Math.min(q.h, r.h) * 0.5);
        if (d) { d.x1 = Math.max(d.x1, r.x + r.w); d.x0 = Math.min(d.x0, r.x); d.y = Math.min(d.y, r.y); d.h = Math.max(d.h, r.y + r.h - d.y); d.cuoi = i; }
        else dong.push({ x0: r.x, x1: r.x + r.w, y: r.y, h: r.h, dau: i, cuoi: i });
      });
      const nut = dong.slice(0, 4).map((d) => {
        // vet but: nua duoi cua dong chu (duoi furigana), hoi tran hai dau
        const cao = d.h * 0.5;
        const e = document.createElement('i');
        e.className = 'pc6-to is-bang';
        e.style.left = f1(d.x0 - 3) + 'px';
        e.style.top = f1(d.y + d.h - cao - d.h * 0.06) + 'px';
        e.style.width = f1(d.x1 - d.x0 + 6) + 'px';
        e.style.height = f1(cao) + 'px';
        e.style.transform = 'scaleX(0)';
        st.nen.appendChild(e);
        d.el = e;
        d.p = 0;
        return e;
      });
      b = st.bang = { cau, the: st.the, ds, hop, dong: dong.slice(0, 4), k: -1, nut };
      b.an = themAn({ ten: 'bang', nut, dinh: true, nhom: 'cau', khiBo: () => { if (st.bang === b) st.bang = null; } });
    }
    b.k = k;
    const r = b.hop[k];
    if (!r) return;
    b.dong.forEach((d) => {
      let p;
      if (k > d.cuoi) p = 1;
      else if (k < d.dau) p = 0;
      else p = kep((r.x + r.w - d.x0 + 3) / (d.x1 - d.x0 + 6), 0, 1);
      if (Math.abs(p - d.p) < 0.002) return;
      const tu = d.p;
      d.p = p;
      d.el.style.transform = `scaleX(${p.toFixed(4)})`;
      if (!giam()) hoat(d.el, [{ transform: `scaleX(${tu.toFixed(4)})` }, { transform: `scaleX(${p.toFixed(4)})` }], { duration: 220, easing: 'cubic-bezier(.25,.6,.4,1)' });
    });
    // tro tu chinh (is-key) cua cau: khoanh khi but toi (mot lan / nhip)
    const t = tok.matches('.is-key') || (tok.matches('.sk-vd-tok') && TRO_TU.test(chu(tok))) ? tok : null;
    if (t && TRO_TU.test(chu(t)) && !st.daLam.has('tro-cau')) {
      st.daLam.add('tro-cau');
      const doc = DOC_TRO[chu(t)];
      sau(160, () => khoanh(t, { nhan: doc ? 'đọc: ' + doc : null, le: 9, nhom: 'cau' }));
    }
  }

  // ------------------------------------------------------------------ quy tac: tieu diem -> chu thich
  const mot = (khoa) => { if (st.daLam.has(khoa)) return false; st.daLam.add(khoa); return true; };
  function kindThe() {
    const c = st.the && st.the.querySelector('.sk-the-than > .sk-canh:not(.sk-ra)');
    if (!c) return '';
    const m = /\bsk-canh-([a-z-]+)/.exec(c.className);
    return m ? m[1] : '';
  }
  function khiTieuDiem(F) {
    const the = st.the;
    if (!the || !F || !F.closest) { tatDen(); return; }
    const che = st.san.getAttribute('data-che');
    if (che === 'giang') datDen(donVi(F)); else tatDen();
    ghi('tieuDiem', (F.className && String(F.className).split(' ')[0]) + ' ' + chu(F).slice(0, 14));
    const kind = kindThe();

    // 1. token cau (karaoke) -> but da quang
    if (F.matches(TOK)) {
      const cau = F.closest(CAU);
      if (cau) {
        if (mot('cam-cau:' + (cau.id || chu(cau).slice(0, 10)))) camera(cau);
        toCau(cau, F);
        return;
      }
    }
    // 2. tu vung
    if (F.matches('.sk-tv-tu, .sk-tv-dau')) {
      const tu = F.matches('.sk-tv-tu') ? F : F.querySelector('.sk-tv-tu');
      if (tu && mot('tv-tu')) {
        const ds = dongChu(tu, the);
        const r = ds.length ? ds[ds.length - 1] : boCuc(tu, the);
        if (r) {
          const cao = r.h * 0.46;
          const b = vetTo({ x: r.x - 6, y: r.y + r.h - cao - r.h * 0.04, w: r.w + 12, h: cao }, { lop: 'is-dam', ms: 520 });
          themAn({ ten: 'to:tu', nut: [b], nhom: 'tu' });
        }
        camera(tu);
      }
      return;
    }
    if (F.matches('.sk-tv-nghia')) {
      const tu = the.querySelector('.sk-tv-tu');
      if (tu && mot('tv-nghia')) {
        const r = boCuc(tu, the);
        if (r) sao(r.x + r.w + (hep() ? 14 : 20), r.y + r.h * 0.28, { nhom: 'tu' });
      }
      return;
    }
    if (F.matches('.sk-tv-meo, .sk-tv-phu, .sk-tv-bien')) { if (mot('tv-meo:' + chu(F).slice(0, 8))) gachChan(F); return; }

    // 3. chu Han / kana
    if (F.matches('.sk-kj-o')) { soNet(); camera(F); return; }
    if (F.matches('.sk-kj-dau')) {
      const hv = F.querySelector('.sk-kj-hv') || F;
      if (mot('kj-hv')) {
        const r = dongChu(hv, the)[0] || boCuc(hv, the);
        if (r) themAn({ ten: 'to:hv', nut: [vetTo({ x: r.x - 5, y: r.y + r.h * 0.5, w: r.w + 10, h: r.h * 0.46 }, { lop: 'is-dam' })], nhom: 'kj' });
      }
      return;
    }
    if (F.matches('.sk-kj-nghia')) { if (mot('kj-nghia')) gachChan(F, { nhom: 'kj' }); return; }
    if (F.closest('.sk-kj-nham')) { nham(); return; }
    if (F.matches('.sk-kj-meo dd, .sk-kj-meo')) { if (mot('kj-meo')) gachChan(F.matches('dd') ? F : (F.querySelector('dd') || F)); return; }
    if (F.closest('.sk-kj-dong') && F.closest('.sk-kj-doc')) {
      const dd = F.closest('dd') || F.closest('.sk-kj-dong').querySelector('dd');
      const gt = dd && (dd.querySelector('.sk-kj-gt') || dd);
      if (gt && mot('kj-doc:' + chu(dd).slice(0, 8))) khoanh(gt, { le: 8 });
      return;
    }
    if (F.closest('.sk-kj-goc')) { const o = the.querySelector('.sk-kj-o'); if (o && mot('kj-goc')) muiTen(o, F.closest('.sk-kj-goc'), { chieu: -1 }); return; }
    if (F.closest('.sk-kj-tu-dong')) {
      const li = F.closest('.sk-kj-tu-dong');
      const c = li.querySelector('.sk-kj-cho') || li.querySelector('.sk-kj-tu-w');
      if (c && mot('kj-tu:' + chu(li).slice(0, 8))) khoanh(c, { le: 6 });
      return;
    }

    // 4. ngu phap
    if (F.matches('.sk-np-ten')) { if (mot('np-ten')) gachChan(F); return; }
    if (F.closest('.sk-np-hang') && kind === 'grammar-intro') {
      const chip = F.closest('.sk-np-chip, .sk-np-lit');
      if (chip) { troChip(chip.closest('.sk-np-lit') || chip); return; }
      congThuc(F.closest('.sk-np-hang'));
      return;
    }
    if (F.matches('.sk-np-cau') || F.closest('.sk-np-cau')) { cauGiai(F.closest('.sk-np-cau')); return; }
    if (F.closest('.sk-np-meo, .sk-np-vh')) {
      const k = F.closest('.sk-np-meo, .sk-np-vh');
      const nh = k.querySelector('.sk-np-nhan-ghi');
      if (nh && mot('np-ghi:' + chu(nh))) {
        const r = boCuc(nh, the);
        if (r) themAn({ ten: 'to:ghi', nut: [vetTo({ x: r.x - 4, y: r.y + r.h * 0.45, w: r.w + 8, h: r.h * 0.55 }, { lop: 'is-dam' })] });
      }
      return;
    }
    // 5. vi du
    if (F.matches('.sk-vd-nghia')) { if (mot('vd-nghia')) gachChan(F, { nhom: 'cau' }); return; }
    if (F.closest('.sk-vd-mau')) return;
    // 6. hoi thoai
    if (F.matches('.sk-ht-nghia')) { if (mot('ht-nghia:' + chu(F).slice(0, 8))) gachChan(F); return; }
    if (F.closest('.sk-ht-khac')) { khac(); return; }
    if (F.closest('.sk-ht-vai')) {
      const v = F.closest('.sk-ht-vai');
      const c = v.querySelector('.sk-ht-chan') || v;
      if (mot('vai:' + chu(v).slice(0, 6))) khoanh(c, { le: 7 });
      return;
    }
    if (F.closest('.sk-ht-o')) {
      const o = F.closest('.sk-ht-o');
      const ds = [...o.parentElement.children];
      const i = ds.indexOf(o);
      if (mot('ht-o:' + i)) {
        const r = boCuc(o, the);
        if (r) { const n = huyHieu(i + 1, r.x - (hep() ? 10 : 14), r.y + r.h / 2); themAn({ ten: 'so:o', nut: [n] }); }
      }
      return;
    }
    // 7. bai tap
    if (F.matches('.qz-text')) { if (mot('qz-hoi')) choTrong(F); return; }
    if (F.closest('.qz-opt') && st.san.getAttribute('data-che') === 'giang') {
      const o = F.closest('.qz-opt');
      const key = o.querySelector('.qz-key');
      if (key && mot('qz-o:' + chu(key))) khoanh(key, { le: 5, nhom: 'qz-doc' });
      return;
    }
    if (F.matches('.sk-bt-goi')) { goiY(F); return; }
  }

  function soNet() {
    const the = st.the;
    const o = the && the.querySelector('.sk-kj-o');
    if (!o || !mot('kj-sonet')) return;
    const t = chu(the.querySelector('.sk-kj-sonet')) || chu(the.querySelector('.bang-kanji-ten'));
    const m = /(\d+)\s*nét/.exec(t);
    if (!m) return;
    const r = boCuc(o, the);
    if (!r) return;
    const cx = r.x + r.w - 4, cy = r.y + 6;
    const n = huyHieu(m[1], cx, cy, { lop: 'is-net' });
    const s = document.createElement('small');
    s.textContent = 'nét';
    n.appendChild(s);
    const R = hep() ? 21 : 25;
    const g = nhom('pc6-vong');
    const p = duong(g, duongVong({ x: cx - R, y: cy - R, w: 2 * R, h: 2 * R }, 2));
    veNet(p, 520, 200);
    themAn({ ten: 'sonet', nut: [n, g], nhom: 'kj' });
  }
  function nham() {
    const the = st.the;
    const dd = the.querySelector('.sk-kj-nham dd') || the.querySelector('.sk-kj-nham');
    const o = the.querySelector('.sk-kj-o');
    if (!dd || !o || !mot('kj-nham')) return;
    const ds = dongChu(dd, the);
    const dich = ds[0] || boCuc(dd, the);
    muiTen(o, { x: dich.x, y: dich.y, w: Math.min(dich.w, 80), h: dich.h }, { chieu: 1, bung: 0.18 });
  }
  function troChip(lit) {
    const chip = lit.querySelector('.sk-np-chip') || lit;
    if (!mot('np-chip:' + chu(chip))) return;
    const ct = st.an.find((a) => a.ten === 'congThuc' && !a.bo);
    if (!ct) { khoanh(chip, { le: 8, nhom: 'np' }); return; }
    // dang co ngoac + so cua cong thuc: vong khoanh la mot phan cua no (vong cu mo di) -> van toi da 2
    const r = boCuc(chip, st.the);
    if (!r) return;
    if (ct.vong && ct.vong.isConnected) { const v = ct.vong; if (giam()) v.remove(); else { const h = hoat(v, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: E_IN, fill: 'forwards' }); if (h) h.onfinish = () => v.remove(); } }
    const g = nhom('pc6-vong');
    veNet(duong(g, duongVong(r, 8)), 540, 0);
    ct.vong = g;
    ct.nut.push(g);
    ct.luc = performance.now();
    if (ct.hetHan) clearTimeout(ct.hetHan);
    ct.hetHan = sau(TU_MO, () => boAn(ct));
    ghi('an', 'khoanh:chip ' + chu(chip));
  }
  function congThuc(hang) {
    if (!hang || !mot('np-hang')) return;
    const the = st.the;
    const r = boCuc(hang, the);
    if (!r) return;
    camera(hang);
    const muc = [...hang.querySelectorAll(':scope > .sk-np-muc')].filter((m) => m.offsetWidth);
    const g = nhom('pc6-ngoac');
    const y = r.y + r.h + (hep() ? 6 : 9);
    const p = duong(g, duongNgoac(r.x + 4, r.x + r.w - 4, y, hep() ? 9 : 12));
    veNet(p, 600, 0);
    const nut = [g];
    muc.forEach((m, i) => {
      // o / chip dau tien cua muc (khong tinh dau +)
      const o = m.querySelector('.sk-np-o, .sk-np-lit') || m;
      const q = boCuc(o, the);
      if (!q) return;
      nut.push(huyHieu(i + 1, q.x + q.w / 2, q.y - 3, { tre: 380 + i * 420 }));
    });
    themAn({ ten: 'congThuc', nut, nhom: 'np', dinh: false });
  }
  function cauGiai(p) {
    if (!p || !mot('np-cau:' + chu(p).slice(0, 12))) return;
    const the = st.the;
    const jp = [...p.querySelectorAll('[lang="ja"], span')].find((x) => /[぀-ヿ一-鿿]/.test(chu(x)) && chu(x).length <= 6 && !x.closest('.sk-np-nhan-ghi'));
    const hang = the.querySelector('.sk-np-cong .sk-np-hang, .sk-np-hang');
    const chip = jp && hang ? [...hang.querySelectorAll('.sk-np-chip')].find((c) => chu(c) === chu(jp)) : null;
    if (jp && chip) {
      const a = khoanh(jp, { le: 5, nhom: 'np-cau' });
      if (a) muiTen(jp, chip, { tre: 360, nhom: 'np-cau', bung: 0.28 });
      return;
    }
    gachChan(p);
  }
  function khac() {
    const the = st.the;
    const cau = the.querySelector('.sk-ht-dong.is-nay .sk-ht-cau') || the.querySelector('.sk-ht-cau');
    const k = the.querySelector('.sk-ht-khac-chu') || the.querySelector('.sk-ht-khac');
    if (!cau || !k || !mot('ht-khac')) return;
    const ds = dongChu(cau, the);
    const a = ds[ds.length - 1] || boCuc(cau, the);
    muiTen({ x: a.x, y: a.y, w: Math.min(a.w, 120), h: a.h }, k, { chieu: -1, bung: 0.3 });
  }
  function goiY(el) {
    if (!mot('qz-goi')) return;
    const b = el.querySelector('b') || el;
    const r = boCuc(b, st.the);
    if (r) sao(r.x - (hep() ? 12 : 16), r.y + r.h / 2, { R: hep() ? 7 : 8 });
  }
  /** Khoanh cho trong (___) cua cau hoi */
  function choTrong(q) {
    const the = st.the;
    const tw = document.createTreeWalker(q, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) {
      const m = /_{2,}|＿+|（\s*）|\(\s*\)/.exec(n.textContent);
      if (!m) continue;
      const rg = document.createRange();
      rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
      const r = rg.getBoundingClientRect(), g = the.getBoundingClientRect(), s = tiLe(the);
      if (!r.width) break;
      khoanh(null, { hop: { x: (r.left - g.left) / s, y: (r.top - g.top) / s, w: r.width / s, h: r.height / s }, le: 8 });
      return;
    }
    gachChan(q);
  }

  // ------------------------------------------------------------------ su kien lop (dao dien / canh / app)
  function suKien(e) {
    const { loai, el } = e;
    const the = st.the;
    if (!the || !el || !el.isConnected || !the.contains(el)) return;
    ghi('suKien', loai + ' ' + (el.className && String(el.className).split(' ')[0]));
    if (loai === 'noi') {                     // nguoi dang noi
      const ai = el.closest('.sk-ht-dong') ? el.closest('.sk-ht-dong').querySelector('.sk-ht-ai') : null;
      const dong = el.closest('.sk-ht-dong');
      const k = 'noi:' + ((dong && (dong.dataset.dong || dong.dataset.i)) || chu(ai).slice(0, 6));
      if (ai && mot(k)) bongThoai(ai.querySelector('.sk-ht-ten') ? ai : ai, { nhom: 'noi' });
    } else if (loai === 've') {               // net chu Han bat dau
      soNet();
    } else if (loai === 'day') {              // o cong thuc vi du duoc dien
      const hang = el.closest('.sk-np-hang');
      if (!hang) return;
      const muc = [...hang.querySelectorAll(':scope > .sk-np-muc')];
      const m = el.closest('.sk-np-muc');
      const i = muc.indexOf(m);
      if (i < 0 || !mot('vd-day:' + i)) return;
      const r = boCuc(el, the);
      if (r) {
        const n = huyHieu(i + 1, r.x + r.w / 2, r.y - 3);
        const a = st.an.find((x) => x.ten === 'so:vd' && !x.bo);
        if (a) { a.nut.push(n); a.luc = performance.now(); } else themAn({ ten: 'so:vd', nut: [n], nhom: 'vd-so' });
      }
    } else if (loai === 'hien') {             // dong phu vua hien theo loi
      if (el.matches('.sk-kj-nham')) nham();
      else if (el.matches('.sk-np-doc') && el.closest('.sk-np-lit') && kindThe() === 'grammar-intro') troChip(el.closest('.sk-np-lit'));
      else if (el.matches('.sk-ht-khac')) khac();
      else if (el.matches('.sk-bt-goi')) goiY(el);
    } else if (loai === 'dung' || loai === 'sai' || loai === 'dapan') {
      quiz(loai, el);
    } else if (loai === 'karaoke') {
      const cau = el.closest && el.closest(CAU);
      if (cau && mot('cam-cau:' + (cau.id || chu(cau).slice(0, 10)))) camera(cau);
    } else if (loai === 'chip') {
      const a = e.anchor;
      if (a && /^đọc\b/i.test(String(e.text || '')) && mot('chip:' + chu(a))) khoanh(a, { le: 7 });
    }
  }
  function quiz(loai, o) {
    const the = st.the;
    const khoa = 'qz:' + loai + ':' + o.id;
    if (!mot(khoa)) return;
    st.qzDa.push({ loai, el: o });
    // an het vong doc lua chon con lai
    st.an.filter((x) => x.nhom === 'qz-doc').forEach((x) => boAn(x));
    const key = o.querySelector('.qz-key');
    const txt = o.querySelector('.qz-opt-text') || o;
    const rk = key ? boCuc(key, the) : null;
    const rt = boCuc(txt, the);
    const ro = boCuc(o, the);
    if (!ro) return;
    if (loai === 'dung' || loai === 'dapan') {
      const nut = [];
      const x = ro.x + ro.w - (hep() ? 26 : 34), y = ro.y + ro.h / 2;
      const a = dauDung({ x: x - 6, y: ro.y, w: 0, h: ro.h }, { nhom: 'qz' });
      if (a) nut.push(...a.nut);
      if (loai === 'dung') {
        // sao bung o goc tren phai lua chon dung
        const s = sao(ro.x + ro.w - 6, ro.y + 2, { tre: 260, nhom: 'qz', dinh: true });
        if (s) nut.push(...s.nut);
        camera(o, true);
      }
      void y;
    } else {
      const r = rt || ro;
      const a = khoanh(null, { hop: rt || ro, le: 6, nhom: 'qz' });
      if (a) { a.dinh = true; if (a.hetHan) clearTimeout(a.hetHan); }
      const x = dauSai({ x: ro.x + ro.w - (hep() ? 22 : 30), y: ro.y, w: 0, h: ro.h }, { tre: 380 });
      if (a && x) a.nut.push(...x.nut);
    }
  }

  // ------------------------------------------------------------------ the chuong: lower-third (bumper) / ket bai
  function bumper(the) {
    const khoi = the.querySelector('.sk-the-chuong .sk-tc-khoi');
    if (!khoi || !st.lop) return;
    const ten = chu(khoi.querySelector('.sk-tc-ten'));
    const meta = chu(khoi.querySelector('.sk-tc-meta'));
    // thu tu chuong trong bai
    let chuong = [];
    try { chuong = [...new Set(((window.__lecture && window.__lecture.beats && window.__lecture.beats()) || []).map((b) => b && b.chapter).filter(Boolean))]; } catch (e) { chuong = []; }
    let cur = null;
    try {
      const B = window.__lecture.beats(), n = window.__motion.trangThai().nhip;
      cur = B[n + 1] && B[n + 1].chapter;
    } catch (e) { cur = null; }
    let i = cur ? chuong.indexOf(cur) : -1;
    if (i < 0) i = Math.max(0, chuong.length - 1);
    const l3 = document.createElement('div');
    l3.className = 'pc6-l3';
    l3.innerHTML = '<span class="pc6-l3-so"></span><span class="pc6-l3-chu"><b></b><small></small></span>';
    l3.querySelector('.pc6-l3-so').textContent = String(i + 1).padStart(2, '0');
    l3.querySelector('b').textContent = ten;
    l3.querySelector('small').textContent = meta ? 'Chương ' + (i + 1) + (chuong.length ? '/' + chuong.length : '') + ' · ' + meta : 'Chương ' + (i + 1);
    const tien = document.createElement('div');
    tien.className = 'pc6-l3-tien';
    const n = Math.max(1, chuong.length);
    for (let k = 0; k < n; k++) { const t = document.createElement('i'); if (k < i) t.className = 'is-xong'; else if (k === i) t.className = 'is-nay'; tien.appendChild(t); }
    l3.appendChild(tien);
    st.lop.appendChild(l3);
    const nut = [l3];
    if (!giam()) {
      const so = l3.querySelector('.pc6-l3-so'), c = l3.querySelector('.pc6-l3-chu');
      hoat(l3, [{ transform: 'translateX(-56px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 380, delay: 140, easing: E_CAT, fill: 'backwards' });
      hoat(so, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 300, delay: 140, easing: E_OUT, fill: 'backwards' });
      hoat(c, [{ transform: 'translateX(-14px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 320, delay: 300, easing: E_OUT, fill: 'backwards' });
      const ti = [...tien.children];
      ti.forEach((t, k) => hoat(t, [{ transform: 'scaleY(0)', opacity: 0 }, { transform: 'scaleY(1)', opacity: 1 }], { duration: 220, delay: 420 + k * 45, easing: E_OUT, fill: 'backwards' }));
      const nay = tien.querySelector('.is-nay');
      if (nay) hoat(nay, [{ transform: 'scaleX(.15)' }, { transform: 'scaleX(1)' }], { duration: 520, delay: 520 + i * 45, easing: E_OUT, fill: 'backwards' });
    }
    themAn({ ten: 'bumper', nut, dinh: true });
    ghi('bumper', ten);
  }
  function theXong(the) {
    const t = the.querySelector('.sk-the-xong .sk-tx-ten');
    if (!t) return;
    const ds = dongChu(t, the);
    const r = ds[0] || boCuc(t, the);
    if (r) sao(r.x + r.w + (hep() ? 16 : 22), r.y + r.h * 0.3, { tre: 360, dinh: true });
  }

  // ------------------------------------------------------------------ vong cap nhat
  /** Hop con tro canh chu tu style cua 6 manh (trang thai CUOI) — toa do trong the */
  function hopTroChu(g) {
    const b = g.children;
    if (!b || b.length < 2) return null;
    const p0 = b[0].style, p1 = b[1].style;
    const w = parseFloat(p0.width), h = parseFloat(p1.height);
    if (!(w > 1) || !(h > 1)) return null;
    const x = tach(p0.translate)[0], y = tach(p1.translate)[1];
    const ref = g.offsetParent || g.parentElement;
    const rr = boCuc(ref, st.the);
    if (!rr) return null;
    return { x: rr.x + ref.clientLeft + x, y: rr.y + ref.clientTop + y, w, h };
  }
  function timTheoHop(root, k) {
    let tot = null, diem = 0.3;
    root.querySelectorAll(UNG_VIEN).forEach((el) => {
      if (!el.offsetWidth && !el.offsetHeight) return;
      const r = boCuc(el, st.the);
      if (!r) return;
      const d = iou(r, k);
      if (d > diem + 0.001) { diem = d; tot = el; }
    });
    return tot;
  }
  function timTieuDiem(the) {
    const ct = the.querySelector(':scope > .sk-con-tro.is-hien');
    if (ct && the.__ctEl && the.__ctEl.isConnected) return the.__ctEl;
    const g = the.querySelector('.sk-chu-tro.is-hien');
    const k = g && hopTroChu(g);
    if (k) {
      const khoa = [k.x, k.y, k.w, k.h].map(Math.round).join(',');
      if (khoa === st.roKhoa && st.F && st.F.isConnected) return st.F;
      st.roKhoa = khoa;
      return timTheoHop(g.closest('.sk-canh') || the, k);
    }
    return null;
  }
  function doiThe(the) {
    const cu = st.the;
    st.gen++;
    huyHen();
    st.camHen = null;
    st.an.forEach((a) => { a.bo = true; });
    st.an = [];
    st.bang = null;
    st.F = null; st.roKhoa = '';
    st.daLam = new Set();
    st.latThe = null;
    st.qzDa = [];
    st.camDa = false;
    if (cu && cu !== the) goLop(cu, true);
    st.the = the;
    st.seed = 7 + (st.gen % 97) * 31;
    if (the) { taoLop(the); ghi('the', kindThe()); }
  }
  function donHet() {
    if (!st.the && !st.an.length) return;
    st.gen++;
    huyHen();
    xoaAn(true);
    st.bang = null; st.F = null; st.roKhoa = ''; st.hang = [];
    if (st.san) st.san.querySelectorAll('.sk-o-the > .sk-the').forEach((t) => goLop(t, false));
    st.the = null;
    st.denHien = false; st.denHop = null; st.che = '';
    ghi('don', '');
  }
  function capNhat() {
    st.raf = 0;
    if (!dangBat()) return;
    const che = st.san.getAttribute('data-che');
    if (che === 'tat' || !che || st.san.hidden || !document.body.classList.contains('dang-giang')) { st.hang = []; donHet(); return; }
    const the = theSong();
    if (the !== st.the) doiThe(the);
    if (!the) return;
    try {
      const lat = the.dataset.lat;
      if (lat) {
        if (st.latThe !== lat) {
          st.latThe = lat;
          xoaAn(false); tatDen(); st.F = null;
          const lop = the.querySelector('.sk-the-lat:not(.sk-ra)');
          if (lop) { if (lat === 'sk-the-chuong') bumper(the); else if (lat === 'sk-the-xong') theXong(the); }
        }
        st.hang = [];
        return;
      }
      if (che !== st.che) {
        const tu = st.che;
        st.che = che;
        // vao cho hoc vien (cong the that): chu thich luc giang thuoc khoi cau hoi gia -> xoa
        if (che === 'cho' && tu === 'giang') xoaAn(false);
      }
      const q = st.hang.splice(0);
      q.forEach((e) => { try { suKien(e); } catch (x) { canhBao('suKien', x); } });
      const F = che === 'giang' ? timTieuDiem(the) : null;
      if (F !== st.F) { st.F = F; khiTieuDiem(F); }
      if (che !== 'giang' && st.denHien) tatDen();
    } catch (e) { canhBao('capNhat', e); }
  }
  function henCapNhat() { if (!st.raf) st.raf = requestAnimationFrame(capNhat); }

  const cuaMinh = (n) => n && n.nodeType === 1 && (n.classList.contains('pc6-nen') || n.classList.contains('pc6-lop') || n.classList.contains('pc6-den-khung') || n.classList.contains('pc6-cat') || (n.closest && n.closest('.pc6-lop, .pc6-nen, .pc6-den-khung')));
  function khiDoi(ds) {
    if (!dangBat()) return;
    let viec = false;
    for (const m of ds) {
      const t = m.target;
      if (cuaMinh(t)) continue;
      if (m.type === 'childList') { if ([...m.addedNodes, ...m.removedNodes].every((n) => n.nodeType !== 1 || cuaMinh(n))) continue; viec = true; continue; }
      if (m.attributeName === 'style' && t === st.the) continue;   // camera cua minh
      viec = true;
      if (m.attributeName !== 'class' || !t.classList) continue;
      const cu = ' ' + (m.oldValue || '') + ' ';
      const co = (c) => t.classList.contains(c) && cu.indexOf(' ' + c + ' ') < 0;
      const bo = (c) => !t.classList.contains(c) && cu.indexOf(' ' + c + ' ') >= 0;
      if (co('is-noi') && t.classList.contains('sk-ht-ava')) st.hang.push({ loai: 'noi', el: t });
      if (co('is-ve') && t.classList.contains('sk-kj-o')) st.hang.push({ loai: 've', el: t });
      if (co('is-day') && t.classList.contains('sk-np-o') && t.closest('.sk-vd-mau')) st.hang.push({ loai: 'day', el: t });
      if (bo('sk-an')) st.hang.push({ loai: 'hien', el: t });
      if (t.classList.contains('qz-opt')) {
        if (co('is-correct')) st.hang.push({ loai: 'dung', el: t });
        if (co('is-wrong')) st.hang.push({ loai: 'sai', el: t });
        if (co('is-answer')) st.hang.push({ loai: 'dapan', el: t });
      }
    }
    if (viec) henCapNhat();
  }

  // ------------------------------------------------------------------ boc hu.* (bao su kien, khong doi gi)
  function bocHu() {
    const SM = window.SenseiMotion;
    const hu = SM && SM.hu;
    if (!hu || st.huGoc) return;
    st.huGoc = {}; st.huBoc = {};
    const thuoc = (el) => { const x = Array.isArray(el) || (el && el.length && !el.nodeType) ? el[0] : el; return x && x.closest && x.closest(SEL) ? x : null; };
    const ds = {
      nhan: (a) => { const x = thuoc(a[0]); if (x) henCapNhat(); },
      quet: (a) => { const x = thuoc(a[0]); if (x) henCapNhat(); },
      hien: (a) => { const x = thuoc(a[0]); if (x) henCapNhat(); },
      karaoke: (a) => { const x = thuoc(a[0]); if (x) { st.karaokeLuc = performance.now(); st.hang.push({ loai: 'karaoke', el: x }); henCapNhat(); } },
      chip: (a) => { const x = thuoc(a[0]); if (x) { st.hang.push({ loai: 'chip', el: x, anchor: x, text: a[1] }); henCapNhat(); } },
    };
    Object.keys(ds).forEach((k) => {
      const g = hu[k];
      if (typeof g !== 'function') return;
      st.huGoc[k] = g;
      const b = function () {
        const r = g.apply(this, arguments);
        if (st.bat) { try { ds[k](arguments); } catch (e) {} }
        return r;
      };
      st.huBoc[k] = b;
      hu[k] = b;
    });
  }
  function traHu() {
    const SM = window.SenseiMotion;
    const hu = SM && SM.hu;
    if (hu && st.huGoc) Object.keys(st.huGoc).forEach((k) => { if (hu[k] === st.huBoc[k]) hu[k] = st.huGoc[k]; });
    st.huGoc = null; st.huBoc = null;
  }

  // ------------------------------------------------------------------ cat canh (boc animate: vao / ra cap the)
  function lopCat() {
    const o = oThe();
    if (!o) return null;
    if (st.cat && st.cat.parentNode === o) return st.cat;
    const c = document.createElement('div');
    c.className = 'pc6-cat';
    c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<i class="pc6-cat-vet is-3"></i><i class="pc6-cat-vet is-2"></i><i class="pc6-cat-vet is-1"></i><i class="pc6-cat-mep"></i>';
    o.appendChild(c);
    st.cat = c;
    return c;
  }
  /** Wipe nhanh qua mat the (mep but + hai vet mo phia sau) — chi transform / opacity */
  function wipe(tre) {
    const c = lopCat();
    if (!c) return;
    const ds = [...c.children];
    hoat(c, [{ opacity: 1 }, { opacity: 1 }], { duration: 360 + tre, easing: 'linear' });
    ds.forEach((x, i) => {
      const lui = (ds.length - 1 - i) * 34;   // vet phia sau di tre hon
      hoat(x, [{ transform: 'translateX(-30%)', opacity: 0 }, { transform: 'translateX(10%)', opacity: 1, offset: 0.18 }, { transform: 'translateX(330%)', opacity: 1, offset: 0.82 }, { transform: 'translateX(420%)', opacity: 0 }],
        { duration: 380, delay: tre + lui, easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'backwards' });
    });
  }
  function doiHieuUng(el, kf, o) {
    const f0 = kf[0], n = kf.length;
    if (!el.matches || !el.matches('.sk-o-the > .sk-the')) return undefined;
    // ra: -32px + mo 180 ms -> cat nhanh 150 ms
    if (n === 2 && kf[1].opacity === 0 && kf[1].translate) {
      return hoat(el, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '-44px 0' }], Object.assign({}, o, { duration: 150, easing: E_IN }));
    }
    // vao: +32px + hien 320 ms -> truot nhanh 300 ms, dung em, voi wipe
    if (n === 1 && f0.opacity === 0 && f0.translate) {
      const tre = Math.min(o.delay || 0, 110);
      el.__den = performance.now() + tre + 300;
      wipe(Math.max(0, tre - 90));
      return hoat(el, [{ opacity: 0, translate: '48px 0', offset: 0 }, { opacity: 0.85, translate: '6px 0', offset: 0.45 }], Object.assign({}, o, { delay: tre, duration: 300, easing: E_CAT }));
    }
    return undefined;
  }
  function taoBoc(goc) {
    return function animate(kf, o) {
      if (st.bat && Array.isArray(kf) && kf.length && o && typeof o === 'object' && !o.pseudoElement) {
        try {
          if (this.closest && this.closest(SEL) && !giam()) {
            const r = doiHieuUng(this, kf, o);
            if (r) return r;
          }
        } catch (e) { /* loi phong cach: roi ve hoat anh goc */ }
      }
      return goc.call(this, kf, o);
    };
  }

  // ------------------------------------------------------------------ vong doi
  function ganSan(san) {
    st.san = san;
    if (san.getAttribute('data-phong-cach') !== TEN) san.setAttribute('data-phong-cach', TEN);
    st.mo = new MutationObserver(khiDoi);
    st.mo.observe(san, { subtree: true, childList: true, attributes: true, attributeOldValue: true, attributeFilter: ['class', 'style', 'data-che', 'data-lat', 'hidden'] });
    st.moBody = new MutationObserver(() => henCapNhat());
    if (document.body) st.moBody.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', khiCo);
    san.addEventListener('scroll', khiCuon, true);
    henCapNhat();
  }
  /** Cuon trong the (the bai tap qua cong): dau cham bai ve lai dung cho, khong hieu ung */
  function khiCuon(e) {
    if (!dangBat() || !st.the || !st.qzDa.length) return;
    const t = e.target;
    if (!t || !t.nodeType || !st.the.contains(t)) return;
    st.an.filter((a) => a.nhom === 'qz').forEach((a) => boAn(a, true));
    clearTimeout(st.henCuon);
    st.henCuon = setTimeout(() => {
      if (!dangBat() || !st.the) return;
      const ds = st.qzDa.splice(0);
      st.tuc = true;
      try { ds.forEach((x) => { st.daLam.delete('qz:' + x.loai + ':' + x.el.id); if (x.el.isConnected) quiz(x.loai, x.el); }); } finally { st.tuc = false; }
    }, 140);
  }
  function khiCo() { if (!dangBat() || !st.the) return; xoaAn(true); st.bang = null; tatDen(); st.F = null; st.roKhoa = ''; henCapNhat(); }

  function batDau(stageEl) {
    if (st.bat) ketThuc(st.san);
    st.bat = true;
    if (!st.boc) {
      st.goc = Element.prototype.animate;
      st.boc = taoBoc(st.goc);
      Element.prototype.animate = st.boc;
    }
    bocHu();
    const tim = () => (stageEl && stageEl.isConnected ? stageEl : document.getElementById('sanKhauGiang'));
    const s = tim();
    if (s) { ganSan(s); return; }
    if (window.MutationObserver && document.body) {
      st.cho = new MutationObserver(() => {
        const x = tim();
        if (!x || !st.bat) return;
        st.cho.disconnect(); st.cho = null;
        ganSan(x);
      });
      st.cho.observe(document.body, { childList: true, subtree: true });
    }
  }
  function ketThuc(stageEl) {
    st.bat = false;
    if (st.cho) { try { st.cho.disconnect(); } catch (e) {} st.cho = null; }
    if (st.mo) { try { st.mo.disconnect(); } catch (e) {} st.mo = null; }
    if (st.moBody) { try { st.moBody.disconnect(); } catch (e) {} st.moBody = null; }
    if (st.raf) { cancelAnimationFrame(st.raf); st.raf = 0; }
    window.removeEventListener('resize', khiCo);
    if (st.san) st.san.removeEventListener('scroll', khiCuon, true);
    clearTimeout(st.henCuon);
    st.gen++;
    huyHen();
    xoaAn(true);
    if (st.boc && Element.prototype.animate === st.boc) { Element.prototype.animate = st.goc; st.boc = null; }
    traHu();
    const s = stageEl || st.san || document.getElementById('sanKhauGiang');
    if (s) {
      s.querySelectorAll('.pc6-nen, .pc6-lop, .pc6-den-khung, .pc6-cat').forEach((x) => x.remove());
      s.querySelectorAll('.sk-o-the > .sk-the').forEach((t) => { t.style.transform = ''; t.classList.remove('pc6-cam'); });
      if (s.getAttribute('data-phong-cach') === TEN) s.removeAttribute('data-phong-cach');
    }
    Object.assign(st, { san: null, the: null, lop: null, svg: null, nen: null, den: null, denKhung: null, denHien: false, denHop: null, an: [], bang: null, F: null, cat: null, hang: [], latThe: null });
  }

  window.SenseiPhongCach = window.SenseiPhongCach || {};
  window.SenseiPhongCach[TEN] = { ten: 'Video bài giảng', batDau, ketThuc };
  window.__pc6 = {
    nhatKy: () => st.log.slice(),
    xoaNhatKy: () => { st.log.length = 0; },
    trangThai: () => ({ bat: st.bat, the: !!st.the, soAn: st.an.length, an: st.an.map((a) => a.ten), den: st.denHien, boc: Element.prototype.animate === st.boc, huBoc: !!st.huGoc }),
  };
})();
