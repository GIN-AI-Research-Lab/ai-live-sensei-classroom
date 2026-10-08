// quet-trang.mjs — HAM DO TRONG TRANG bo sung cho quet-bai.mjs (chuyen thanh chuoi, chay bang Runtime.evaluate; khong dung bien ngoai).
// Bo sung cho doTrang() cua do-bo-cuc.mjs (CLIP / ON-CAT / TEXT-OVERLAP / SMALL / UNDER-DECOR / HIDDEN), khong lap lai cac phep do do.
//
//   doThem(opt) -> { ok, mo: [...], tach: [...], mep: [...], tran: [...], che: [...], cat: [...], ms }
//     mo   ORPHAN     : khoi chu nhieu dong ma dong CUOI chi con <= 2 ky tu Nhat / mot tu Viet <= 4 chu cai (hoac chi dau cau), dong cuoi
//                       <= 30 % dong dai nhat, dong dai nhat >= 80 px; khong tinh khi xuong dong co chu y (<br>, \n voi white-space pre*).
//                       Hai dang: (1) chu chay trong MOT khoi (nut chu cung khoi gan nhat khong phai inline); (2) hang token (cac token
//                       gom theo to tien <= 3 bac chua >= 3 token): hang cuoi chi co 1 token <= 2 ky tu Nhat (vd "。", "か") va co hang truoc
//                       >= 2 token (cac the xep chong moi hang 1 token khong tinh).
//     tach WORD-SPLIT : mot don vi tu bi be qua 2+ dong: token (ruby, phan tu co lop *-tk / *-tok / *-tu / chu ... chua chu Nhat, 2..14 ky tu;
//                       token > 4 ky tu xuong dong DUNG ranh gioi tu ICU (Intl.Segmenter 'ja') thi chap nhan), cum chu Nhat trong nut chu
//                       bi cat GIUA tu ICU (dang 'jp' <= 8 ky tu, 'jp-dai' cau dai), tu Latin/Viet >= 2 chu cai bi cat (overflow-wrap:anywhere).
//     mep  EDGE       : chu (hop NET: doc = canvas measureText cung font, ngang = hop Range) cach mep trong cua "the" nhin thay gan nhat
//                       (to tien khong inline co nen alpha >= .15 / anh nen url() / gradient dac / vien >= 1 px o >= 3 canh, >= 24x16 px)
//                       < 4 px ngang hoac < 1 px doc (va >= -2 px). Bo qua khi co xoay (rotate/matrix) giua chu va the.
//     tran OVERFLOW-BOX : chu ra ngoai the nhin thay cua chinh no > 2 px (the khong overflow hidden — cat thi CLIP bao) trong khi >= 50 %
//                       dong chu nam trong the (chu "dan" ngoai the bang position absolute khong tinh).
//     che  OCCLUDED   : chu bi phan tu khac (khong phai chinh no / to tien / con chau) PHU LEN: elementFromPoint tai 3 diem moi dong
//                       (25/50/75 % chieu ngang, giua chieu doc; document.elementsFromPoint, tren -> duoi) gap phan tu mo duc (opacity tong >= .35 va nen alpha >= .5 /
//                       background-image / img / video / canvas / hinh svg); >= 2 diem va >= 50 % so diem. Diem nam trong hop meo bo qua
//                       (ON-CAT da do).
//     cat  CLIP-PATH  : >= 2 diem va >= 50 % so diem cua chu KHONG hit duoc chinh no (khong co vat mo duc o tren) = bi clip-path / mask /
//                       overflow cat (doTrang chi do overflow; clip-path cua o xien (j) khong do duoc o do).
//   Chi xet chu nhin thay: display/visibility, opacity tong >= opt.opMin (.25), mau chu alpha >= .05, khong thuoc lop trang tri
//   (data-decor, decor|ghost|watermark|net-bong, a-bong, bong) hay phan tu do (mesur|probe), >= 50 % dien tich nam trong cac to tien
//   overflow != visible va trong khung nhin. Furigana (rt / *-rt / furi / lop 'ruby' tu ve) khong tinh dong.
//   Chu nam HOAN TOAN ngoai .cd-lop -> out.ngoai; chu tren mat sau the lat 3D (backface-visibility hidden, m33 tich luy < 0) hoac trong
//   phan tu bi thu ~0 (scaleX / scaleY < .05, kieu lat the bang scaleX) -> out.matSau:
//   hai danh sach duong dan nay de quet-bai.mjs ha HIDDEN-TEXT ngoai san khau xuong INFO va bo van de cua doTrang tren mat sau.
export function doThem(opt) {
  const lop = document.querySelector('.cd-lop');
  if (!lop) return { ok: false, lyDo: 'khong co .cd-lop' };
  if (getComputedStyle(lop).visibility === 'hidden') return { ok: false, lyDo: '.cd-lop an' };
  const t0 = performance.now();
  const vw = innerWidth, vh = innerHeight;
  const pe = document.createElement('style');
  pe.textContent = '.cd-lop, .cd-lop * { pointer-events: auto !important; }';
  document.head.appendChild(pe);
  try {
    const lr = lop.getBoundingClientRect();
    let meo = null;
    try {
      const m = window.__motion && __motion.cheDo().meo;
      if (m) meo = { l: lr.left + m.x, t: lr.top + m.y + opt.meoPadTop, r: lr.left + m.x + m.w, b: lr.top + m.y + m.h };
    } catch (e) {}
    const csC = new Map();
    const cs = (el) => { let v = csC.get(el); if (!v) { v = getComputedStyle(el); csC.set(el, v); } return v; };
    const stC = new Map();
    const estado = (el) => {
      if (stC.has(el)) return stC.get(el);
      const c = cs(el);
      const p = el.parentElement ? estado(el.parentElement) : { op: 1, disp: true };
      const r = { op: p.op * (parseFloat(c.opacity) || 0), disp: p.disp && c.display !== 'none', vis: c.visibility === 'visible' };
      stC.set(el, r);
      return r;
    };
    const lopChuoi = (el) => (el && el.getAttribute && el.getAttribute('class')) || '';
    const lopDs = (el) => lopChuoi(el).split(/\s+/).filter(Boolean);
    const lopTen = (el) => lopDs(el).slice(0, 2).join('.');
    const duong = (el) => { const a = []; for (let x = el; x && x !== lop; x = x.parentElement) { const p = x.parentElement; a.push(x.tagName.toLowerCase() + (p ? ':' + Array.prototype.indexOf.call(p.children, x) : '')); } return a.reverse().join('>'); };
    const gon = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n || 50);
    const mota = (el, txt) => ({ tag: el.tagName.toLowerCase(), cls: lopTen(el), path: duong(el), txt: gon(txt, 50) });
    const alpha = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return /transparent/.test(c || '') ? 0 : 1; const p = m[1].split(/[,\s/]+/).filter(Boolean); return p.length >= 4 ? parseFloat(p[3]) : 1; };
    const RE_TT = /decor|ghost|watermark|net-bong/i;
    const ttC = new Map();
    const laTrangTri = (el) => {
      if (ttC.has(el)) return ttC.get(el);
      let v = false;
      for (let x = el; x && x !== lop.parentElement; x = x.parentElement) {
        if (x.hasAttribute && x.hasAttribute('data-decor')) { v = true; break; }
        const ds = lopDs(x);
        if (ds.some((c) => RE_TT.test(c) || c === 'a-bong' || c === 'bong' || /mesur|probe/i.test(c) || (opt.trangTri || []).some((p) => c.startsWith(p)))) { v = true; break; }
      }
      ttC.set(el, v);
      return v;
    };
    const RE_JP = /[぀-ヿ㐀-䶿一-鿿豈-﫿々〆〜～ｦ-ﾟ]/;
    const RE_CHU = /[A-Za-z0-9À-ɏḀ-ỿ]/;
    const RE_DAU = /[\s\p{P}\p{S}]/u;
    const laInline = (d) => d === 'inline' || d === 'contents' || d.startsWith('ruby');
    const laNguyen = (d) => /^inline-(block|flex|grid|table)$/.test(d);
    const laRt = (el) => { for (let x = el; x && x !== lop; x = x.parentElement) { if (x.tagName === 'RT' || x.tagName === 'RP') return true; if (lopDs(x).some((c) => /(^|-)(rt|furi|furigana)($|-)/i.test(c) || (x.tagName !== 'RUBY' && /(^|-)ruby$/i.test(c)))) return true; } return false; };   // lop 'ruby' / '*-ruby' tren phan tu khong phai <ruby> = furigana tu ve (che do h)
    const coXoay = (a, b) => {   // co rotate / skew tu a len toi b (bao gom b)
      for (let x = a; x && x !== lop.parentElement; x = x.parentElement) {
        const c = cs(x);
        if (c.rotate && c.rotate !== 'none' && !/^0(deg)?$/.test(c.rotate)) return true;
        const m = /matrix\(([^)]+)\)/.exec(c.transform || '');
        if (m) { const p = m[1].split(',').map(parseFloat); if (Math.abs(p[1]) > 0.004 || Math.abs(p[2]) > 0.004) return true; }
        if (/matrix3d/.test(c.transform || '')) return true;
        if (x === b) break;
      }
      return false;
    };
    // mat sau quay di (the lat 3D): tich transform tu lop xuong; phan tu backface-visibility hidden co m33 tich luy < 0 -> khong nhin thay
    const xoay3 = (M, c) => {
      const r = String(c.rotate || 'none').trim();
      if (r === 'none') return M;
      let m = /^(x|y|z)\s+(-?[\d.]+)deg$/.exec(r);
      if (m) return M.multiply(new DOMMatrix().rotateAxisAngle(m[1] === 'x' ? 1 : 0, m[1] === 'y' ? 1 : 0, m[1] === 'z' ? 1 : 0, +m[2]));
      m = /^(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)deg$/.exec(r);
      if (m) return M.multiply(new DOMMatrix().rotateAxisAngle(+m[1], +m[2], +m[3], +m[4]));
      return M;
    };
    const msC = new Map();
    const matSau = (el) => {
      if (msC.has(el)) return msC.get(el);
      const chain = [];
      for (let x = el; x && x !== lop; x = x.parentElement) chain.push(x);
      chain.reverse();
      let M = new DOMMatrix(), v = false;
      for (const x of chain) {
        const c = cs(x);
        try { if (c.transform && c.transform !== 'none') M = M.multiply(new DOMMatrix(c.transform)); M = xoay3(M, c); } catch (e) {}
        if (c.backfaceVisibility === 'hidden' && M.m33 < 0) { v = true; break; }
      }
      msC.set(el, v);
      return v;
    };
    // phan tu bi thu ~0 (scaleX/scaleY < .05: lat the bang scaleX, thu lai) -> khong nhin thay
    const xepC = new Map();
    const xep = (el) => {
      let x = el;
      while (x && x !== lop && laInline(cs(x).display)) x = x.parentElement;
      if (!x || x === lop || !(x instanceof HTMLElement) || !x.offsetWidth || !x.offsetHeight) return false;
      if (xepC.has(x)) return xepC.get(x);
      const r = x.getBoundingClientRect();
      const v = r.width / x.offsetWidth < 0.05 || r.height / x.offsetHeight < 0.05;
      xepC.set(x, v);
      return v;
    };
    const ngoai = new Set(), sau = new Set();
    // ---- nut chu nhin thay + hop tung ky tu
    const tw = document.createTreeWalker(lop, NodeFilter.SHOW_TEXT);
    const rg = document.createRange();
    const nodes = [];    // { n, el, s, chars: [{ c, o, l, t, r, b }], rt, p0, fs }
    let n;
    while ((n = tw.nextNode())) {
      const s = n.nodeValue;
      if (!s || !s.trim()) continue;
      const el = n.parentElement;
      if (!el || el.closest('script,style,noscript,title')) continue;
      const st = estado(el);
      if (!st.disp || !st.vis || st.op < 0.05) continue;
      const c = cs(el);
      if (alpha(c.color) < 0.05 && !/text/.test(c.webkitBackgroundClip || c.backgroundClip || '')) continue;
      rg.selectNodeContents(n);
      const bb = rg.getBoundingClientRect();
      if (bb.width < 1 || bb.height < 1) continue;
      // ngoai san khau hoan toan (canh dung san / canh cu chua go) va mat sau the lat: ghi lai de ha muc HIDDEN / loai khoi cac phep do
      if (bb.right <= lr.left || bb.left >= lr.right || bb.bottom <= lr.top || bb.top >= lr.bottom) { ngoai.add(duong(el)); continue; }
      if (matSau(el) || xep(el)) { sau.add(duong(el)); continue; }
      if (st.op < opt.opMin) continue;
      if (laTrangTri(el)) continue;
      // phan nhin thay (to tien overflow != visible + khung nhin), xap xi khong theo containing block
      let v = { l: bb.left, t: bb.top, r: bb.right, b: bb.bottom };
      for (let x = el; x && x !== document.body; x = x.parentElement) {
        const cx = cs(x);
        if (cx.overflowX === 'visible' && cx.overflowY === 'visible') continue;
        if (cx.display === 'inline' || cx.display === 'contents') continue;
        const r = x.getBoundingClientRect();
        if (cx.overflowX !== 'visible') { v.l = Math.max(v.l, r.left); v.r = Math.min(v.r, r.right); }
        if (cx.overflowY !== 'visible') { v.t = Math.max(v.t, r.top); v.b = Math.min(v.b, r.bottom); }
      }
      v = { l: Math.max(v.l, 0), t: Math.max(v.t, 0), r: Math.min(v.r, vw), b: Math.min(v.b, vh) };
      const thay = Math.max(0, v.r - v.l) * Math.max(0, v.b - v.t) / Math.max(1, bb.width * bb.height);
      if (thay < 0.5) continue;
      const fs = parseFloat(c.fontSize) || 16;
      const chars = [];
      const cps = Array.from(s);
      let o = 0;
      for (const ch of cps) {
        const len = ch.length;
        if (/\s/.test(ch)) { chars.push({ c: ch, o, sp: true }); o += len; continue; }
        rg.setStart(n, o); rg.setEnd(n, o + len);
        const rs = rg.getClientRects();
        let r0 = null;
        for (const r of rs) if (r.width > 0 && r.height > 0) { r0 = r; break; }
        if (r0) chars.push({ c: ch, o, l: r0.left, t: r0.top, r: r0.right, b: r0.bottom });
        o += len;
      }
      let p0 = el;
      while (p0 && p0 !== lop && laInline(cs(p0).display)) p0 = p0.parentElement;
      nodes.push({ n, el, s, chars, rt: laRt(el), p0: p0 || lop, fs, ws: c.whiteSpace });
    }
    const out = { ok: true, mo: [], tach: [], mep: [], tran: [], che: [], cat: [], canBang: [], thua: [], soNut: nodes.length, ngoai: [...ngoai].slice(0, 400), matSau: [...sau].slice(0, 200) };
    // ranh gioi tu tieng Nhat (ICU): xuong dong dung ranh gioi tu thi khong tinh la be doi tu
    const SEG = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('ja', { granularity: 'word' }) : null;
    const catGiuaTu = (lines) => {   // co cho xuong dong nao nam GIUA mot tu (theo ICU) khong
      const str = lines.map((L) => L.filter((k) => !k.sp).map((k) => k.c).join('')).join('');
      const ranh = new Set([0, str.length]);
      if (SEG) for (const x of SEG.segment(str)) ranh.add(x.index); else return true;
      let o = 0;
      for (let k = 0; k < lines.length - 1; k++) { o += lines[k].filter((q) => !q.sp).map((q) => q.c).join('').length; if (!ranh.has(o)) return true; }
      return false;
    };
    // ---- dong cua mot chuoi ky tu (thu tu DOM): cat khi ky tu sau xuong duoi VA lui ve trai (doc: sang trai VA len tren)
    const tachDong = (ds, doc) => {
      const lines = [];
      let cur = [];
      let prev = null;
      for (const k of ds) {
        if (k.sp) { if (cur.length) cur.push(k); continue; }
        if (prev) {
          const h = Math.min(prev.b - prev.t, k.b - k.t), w = Math.min(prev.r - prev.l, k.r - k.l);
          const moi = doc === 'rl' ? (k.t < prev.t - 0.3 * h && k.r <= prev.l + 0.3 * w)
            : doc === 'lr' ? (k.t < prev.t - 0.3 * h && k.l >= prev.r - 0.3 * w)
              : (k.t >= prev.b - 0.3 * h && k.l < prev.l - 0.5);
          if (moi) { lines.push(cur); cur = []; }
        }
        cur.push(k);
        prev = k;
      }
      if (cur.length) lines.push(cur);
      return lines.map((L) => { while (L.length && L[L.length - 1].sp) L.pop(); return L; }).filter((L) => L.length);
    };
    const hopDong = (L) => { const ks = L.filter((k) => !k.sp); return ks.reduce((a, k) => ({ l: Math.min(a.l, k.l), t: Math.min(a.t, k.t), r: Math.max(a.r, k.r), b: Math.max(a.b, k.b) }), { l: 1e9, t: 1e9, r: -1e9, b: -1e9 }); };
    const chuDong = (L) => L.map((k) => k.c).join('').replace(/\s+/g, ' ').trim();
    const docMode = (el) => { const wm = cs(el).writingMode || ''; return /vertical-lr|sideways-lr/.test(wm) ? 'lr' : /vertical|sideways/.test(wm) ? 'rl' : null; };
    const laMoCoi = (txt) => {
      const t = txt.replace(/\s+/g, ' ').trim();
      if (!t) return false;
      if (!t.replace(/[\s\p{P}\p{S}]/gu, '')) return true;                       // chi con dau cau / ky hieu
      if (RE_JP.test(t)) return t.replace(/\s/g, '').length <= 2;               // <= 2 ky tu (tinh ca dau cau)
      const tu = t.split(' ').filter(Boolean);
      return tu.length === 1 && t.replace(/[^A-Za-zÀ-ɏḀ-ỿ]/g, '').length <= 4;
    };
    // ---- (1) ORPHAN chu chay trong mot khoi
    const theoKhoi = new Map();
    for (const nd of nodes) { if (nd.rt) continue; if (!theoKhoi.has(nd.p0)) theoKhoi.set(nd.p0, []); theoKhoi.get(nd.p0).push(nd); }
    const daBaoMo = new Set();
    theoKhoi.forEach((ds, p0) => {
      const ks = [];
      let coBr = false;
      ds.forEach((nd, k) => {
        if (k > 0) ks.push({ c: ' ', sp: true, ranh: true });
        nd.chars.forEach((c) => ks.push(Object.assign({ nd }, c)));
      });
      const doc = docMode(p0);
      const lines = tachDong(ks, doc);
      if (lines.length < 2) return;
      const cuoi = lines[lines.length - 1], truoc = lines[lines.length - 2];
      // xuong dong co chu y: <br> giua hai dong cuoi, hoac \n trong che do pre*
      const kA = truoc.filter((k) => !k.sp).pop(), kB = cuoi.find((k) => !k.sp);
      if (!kA || !kB) return;
      if (kA.nd !== kB.nd) {
        const SAU = Node.DOCUMENT_POSITION_FOLLOWING;
        for (const br of p0.querySelectorAll('br')) if ((kA.nd.n.compareDocumentPosition(br) & SAU) && (br.compareDocumentPosition(kB.nd.n) & SAU)) { coBr = true; break; }
      } else if (/^pre/.test(kA.nd.ws) && /\n/.test(kA.nd.s.slice(kA.o, kB.o))) coBr = true;
      if (coBr) return;
      const txt = chuDong(cuoi);
      if (!laMoCoi(txt)) return;
      const hc = hopDong(cuoi);
      const wMax = Math.max(...lines.map((L) => { const h = hopDong(L); return doc ? h.b - h.t : h.r - h.l; }));
      const wCuoi = doc ? hc.b - hc.t : hc.r - hc.l;
      if (wMax < 80 || wCuoi > wMax * 0.3) return;
      const el = kB.nd.el;
      const k = duong(p0);
      if (daBaoMo.has(k)) return;
      daBaoMo.add(k);
      out.mo.push(Object.assign(mota(p0, ds.map((d) => d.s).join('')), { dang: 'chu', cuoi: txt, soDong: lines.length, wCuoi: Math.round(wCuoi), wMax: Math.round(wMax), elCuoi: el.tagName.toLowerCase() + (lopTen(el) ? '.' + lopTen(el) : ''),
        rect: { l: Math.round(hc.l), t: Math.round(hc.t), w: Math.round(hc.r - hc.l), h: Math.round(hc.b - hc.t) }, fs: Math.round(kB.nd.fs) }));
    });
    // ---- token: ruby + lop *-tk/*-tok/*-tu/chu co chu Nhat
    const RE_LOP_TK = /(^|-)(tk|tk1|tok|token|tu|chu)($|-)/i;
    const laToken = (el) => {
      if (el.tagName === 'RUBY') return true;
      if (!lopDs(el).some((c) => RE_LOP_TK.test(c))) return false;
      return true;
    };
    const jpCua = (el) => {   // chu Nhat (khong tinh rt) cua phan tu, theo thu tu DOM, kem hop ky tu
      const ks = [];
      for (const nd of nodes) if (!nd.rt && (nd.el === el || el.contains(nd.el))) for (const c of nd.chars) if (!c.sp && RE_JP.test(c.c)) ks.push(Object.assign({ nd }, c));
      return ks;
    };
    const tokEls = Array.from(lop.querySelectorAll('ruby, [class]')).filter((el) => laToken(el) && !laTrangTri(el) && !laRt(el));
    const daTach = new Set();
    for (const el of tokEls) {
      const ks = jpCua(el);
      if (ks.length < 2 || ks.length > 14) continue;
      // cung mot khoi chay (p0) moi la mot dong chay; cac khoi con xep chong (vd chu tren / nghia duoi) khong tinh
      const g = new Map();
      ks.forEach((k) => { if (!g.has(k.nd.p0)) g.set(k.nd.p0, []); g.get(k.nd.p0).push(k); });
      for (const [p0, ds] of g) {
        if (ds.length < 2) continue;
        const lines = tachDong(ds, docMode(p0));
        if (lines.length < 2) continue;
        // token dai (> 4 ky tu) xuong dong dung ranh gioi tu ICU (vd どうぞよろしく|お願いします) = cum tu, chap nhan
        if (ds.length > 4 && !catGiuaTu(lines)) continue;
        const k0 = duong(el);
        if (daTach.has(k0)) continue;
        daTach.add(k0);
        const h0 = hopDong(lines[0]), h1 = hopDong(lines[1]);
        out.tach.push(Object.assign(mota(el, ds.map((k) => k.c).join('')), { dang: 'token', phan: lines.map((L) => L.map((k) => k.c).join('')).join(' | '), soDong: lines.length,
          rect: { l: Math.round(h0.l), t: Math.round(h0.t), w: Math.round(Math.max(h0.r, h1.r) - Math.min(h0.l, h1.l)), h: Math.round(h1.b - h0.t) }, fs: Math.round(ds[0].nd.fs) }));
      }
    }
    // cum chu Nhat 2..8 ky tu / tu Latin trong mot nut chu
    for (const nd of nodes) {
      if (nd.rt) continue;
      const doc = docMode(nd.p0);
      const ks = nd.chars;
      const xet = (loai, laKy, min, max) => {
        let i = 0;
        while (i < ks.length) {
          if (ks[i].sp || !laKy(ks[i].c)) { i++; continue; }
          let j = i;
          while (j < ks.length && !ks[j].sp && laKy(ks[j].c)) j++;
          const run = ks.slice(i, j);
          if (run.length >= min && run.length <= max) {
            const lines = tachDong(run, doc);
            if (lines.length >= 2 && (loai === 'latin' || catGiuaTu(lines))) {
              let tk = null;
              for (let x = nd.el; x && x !== lop; x = x.parentElement) if (laToken(x)) { tk = x; break; }
              const k0 = (tk ? duong(tk) : duong(nd.el)) + '|' + run[0].o;
              if (!daTach.has(k0) && !(tk && daTach.has(duong(tk)))) {
                daTach.add(k0);
                const h0 = hopDong(lines[0]), h1 = hopDong(lines[lines.length - 1]);
                out.tach.push(Object.assign(mota(nd.el, nd.s), { dang: loai, tu: run.map((k) => k.c).join(''), phan: lines.map((L) => L.map((k) => k.c).join('')).join(' | '), soDong: lines.length,
                  rect: { l: Math.round(Math.min(h0.l, h1.l)), t: Math.round(h0.t), w: Math.round(Math.max(h0.r, h1.r) - Math.min(h0.l, h1.l)), h: Math.round(h1.b - h0.t) }, fs: Math.round(nd.fs) }));
              }
            }
          }
          i = j;
        }
      };
      // cum chu Nhat: xuong dong GIUA mot tu (ICU) moi tinh; 'jp' = cum <= 8 ky tu (mot tu / cum ngan), 'jp-dai' = cau dai trong mot nut
      xet('jp', (c) => RE_JP.test(c) && !/[　-〿！-／：-＠]/.test(c), 2, 8);
      xet('jp-dai', (c) => RE_JP.test(c) && !/[　-〿！-／：-＠]/.test(c), 9, 400);
      xet('latin', (c) => /[A-Za-zÀ-ɏḀ-ỿ]/.test(c), 2, 40);
    }
    // ---- (2) ORPHAN hang token: token cap cao nhat, gom theo to tien gan nhat chua >= 3 token (toi da 3 bac tren token: cau xep
    //          bang hang flex / inline-block / dat tuyet doi bang JS); hang = cum hop token theo chieu doc
    {
      const capCao = tokEls.filter((el) => { if (!gon(el.textContent)) return false; for (let x = el.parentElement; x && x !== lop; x = x.parentElement) if (laToken(x)) return false; return true; });
      const theoCha = new Map();
      for (const el of capCao) {
        let p = null;
        for (let x = el.parentElement, bac = 1; x && x !== lop && bac <= 3; x = x.parentElement, bac++) {
          let k = 0;
          for (const e2 of capCao) if (x.contains(e2) && ++k >= 3) break;
          if (k >= 3) { p = x; break; }
        }
        if (!p) continue;
        if (!theoCha.has(p)) theoCha.set(p, []);
        theoCha.get(p).push(el);
      }
      theoCha.forEach((ds, p) => {
        if (ds.length < 3) return;
        const hs = ds.map((el) => ({ el, r: el.getBoundingClientRect() })).filter((x) => x.r.width > 0 && x.r.height > 0 && estado(x.el).op >= opt.opMin && estado(x.el).vis);
        if (hs.length < 3) return;
        const rows = [];
        for (const x of hs) {
          const cy = (x.r.top + x.r.bottom) / 2;
          let row = rows.find((R) => Math.abs(R.cy - cy) < Math.max(6, 0.45 * Math.min(R.h, x.r.height)));
          if (!row) { row = { cy, h: x.r.height, ds: [] }; rows.push(row); }
          row.ds.push(x);
        }
        if (rows.length < 2) return;
        rows.sort((a, b) => a.cy - b.cy);
        const cuoi = rows[rows.length - 1];
        // cau xuong hang that: it nhat mot hang truoc co >= 2 token (cac the xep chong moi hang 1 token khong phai cau)
        if (!rows.slice(0, -1).some((R) => R.ds.length >= 2)) return;
        if (cuoi.ds.length !== 1) return;
        const txt = cuoi.ds.map((x) => jpCua(x.el).map((k) => k.c).join('') || gon(x.el.textContent, 20)).join('');
        const raw = cuoi.ds.map((x) => gon(x.el.textContent, 20)).join(' ');
        if (cuoi.ds.length > 1 && txt.replace(/\s/g, '').length > 2) return;
        if (!(txt.replace(/\s/g, '').length <= 2 || !raw.replace(/[\s\p{P}\p{S}]/gu, ''))) return;
        const wRow = (R) => Math.max(...R.ds.map((x) => x.r.right)) - Math.min(...R.ds.map((x) => x.r.left));
        const wMax = Math.max(...rows.map(wRow)), wCuoi = wRow(cuoi);
        if (wMax < 80 || wCuoi > wMax * 0.3) return;
        const k = duong(p);
        if (daBaoMo.has(k)) return;
        daBaoMo.add(k);
        const r0 = cuoi.ds[0].r;
        out.mo.push(Object.assign(mota(p, p.textContent), { dang: 'token', cuoi: raw, soDong: rows.length, wCuoi: Math.round(wCuoi), wMax: Math.round(wMax), elCuoi: cuoi.ds[0].el.tagName.toLowerCase() + (lopTen(cuoi.ds[0].el) ? '.' + lopTen(cuoi.ds[0].el) : ''),
          rect: { l: Math.round(r0.left), t: Math.round(r0.top), w: Math.round(r0.width), h: Math.round(r0.height) } }));
      });
    }
    // ---- EDGE / OVERFLOW-BOX
    const theC = new Map();
    const laThe = (x) => {
      if (theC.has(x)) return theC.get(x);
      let v = false;
      const c = cs(x);
      if (!laInline(c.display) && x !== lop) {
        const r = x.getBoundingClientRect();
        if (r.width >= 24 && r.height >= 16) {
          // be mat that: nen mau, anh nen url() (giay / vai), hoac gradient ma moi diem dung alpha >= .15 (gach chan / but da bang gradient
          // co diem trong suot -> khong phai the)
          const bi = c.backgroundImage || 'none';
          const gr = bi !== 'none' && !/url\(/.test(bi) ? (bi.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}\b|\btransparent\b/gi) || []) : null;
          const nen = alpha(c.backgroundColor) >= 0.15 || /url\(/.test(bi) || !!(gr && gr.length && gr.every((m) => alpha(m) >= 0.15));
          let vien = 0;
          for (const s of ['Top', 'Right', 'Bottom', 'Left']) if ((parseFloat(c['border' + s + 'Width']) || 0) >= 1 && c['border' + s + 'Style'] !== 'none' && alpha(c['border' + s + 'Color']) >= 0.3) vien++;
          v = (nen || vien >= 3) && estado(x).op >= 0.2 ? { r, bl: parseFloat(c.borderLeftWidth) || 0, bt: parseFloat(c.borderTopWidth) || 0, br: parseFloat(c.borderRightWidth) || 0, bb: parseFloat(c.borderBottomWidth) || 0, ovf: c.overflowX !== 'visible' || c.overflowY !== 'visible' } : false;
        }
      }
      theC.set(x, v);
      return v;
    };
    // hop NET chu that cua mot dong (doc): do canvas measureText cung font -> actualBoundingBox so voi fontBoundingBox (hop Range = vung
    // noi dung cua font); ngang giu hop Range (be rong tien). Khong do duoc thi lui ve hop thu bot 0,20 em / 0,08 em nhu doTrang.
    const cv = document.createElement('canvas').getContext('2d');
    const inkC = new Map();
    const inkDong = (nd, L) => {
      const h = hopDong(L);
      const txt = L.filter((k) => !k.sp).map((k) => k.c).join('');
      const c = cs(nd.el);
      const font = c.fontStyle + ' ' + c.fontWeight + ' ' + c.fontSize + ' ' + c.fontFamily;
      const key = font + '|' + txt;
      let m = inkC.get(key);
      if (m === undefined) {
        m = null;
        try { cv.font = font; const q = cv.measureText(txt); if (q.fontBoundingBoxAscent + q.fontBoundingBoxDescent > 0) m = { a: q.actualBoundingBoxAscent, d: q.actualBoundingBoxDescent, fa: q.fontBoundingBoxAscent, fd: q.fontBoundingBoxDescent }; } catch (e) {}
        inkC.set(key, m);
      }
      if (!m) return { l: h.l, r: h.r, t: h.t + opt.inkTop * nd.fs, b: Math.max(h.t + opt.inkTop * nd.fs + 1, h.b - opt.inkBottom * nd.fs), uoc: true };
      const sc = (h.b - h.t) / (m.fa + m.fd);
      return { l: h.l, r: h.r, t: h.t + (m.fa - m.a) * sc, b: Math.max(h.t + (m.fa - m.a) * sc + 1, h.t + (m.fa + m.d) * sc) };
    };
    const daMep = new Set(), daTran = new Set();
    const theGom = new Map();   // CAN-BANG / THUA: gom hop net chu theo the (chi the chi co chu)
    for (const nd of nodes) {
      if (nd.rt) continue;
      let B = null, Bel = null, absGiua = false;
      for (let x = nd.el; x && x !== lop; x = x.parentElement) {
        const v = laThe(x);
        if (v) { B = v; Bel = x; break; }
        const p = cs(x).position;
        if (p === 'absolute' || p === 'fixed') absGiua = true;
      }
      if (!B) continue;
      if (coXoay(nd.el, Bel)) continue;
      const fs = nd.fs;
      const ks = nd.chars.filter((k) => !k.sp);
      if (!ks.length) continue;
      const lines = tachDong(nd.chars, docMode(nd.p0));
      const bi = { l: B.r.left + B.bl, t: B.r.top + B.bt, r: B.r.right - B.br, b: B.r.bottom - B.bb };
      let gMin = 1e9, canh = '', trongTB = 0, ngoaiMax = 0, canhN = '', soL = 0;
      for (const L of lines) {
        const ink = inkDong(nd, L);
        const ix = Math.max(0, Math.min(ink.r, bi.r) - Math.max(ink.l, bi.l)), iy = Math.max(0, Math.min(ink.b, bi.b) - Math.max(ink.t, bi.t));
        const trong = (ix * iy) / Math.max(1, (ink.r - ink.l) * (ink.b - ink.t));
        trongTB += trong; soL++;
        if (trong > 0.9) { let G = theGom.get(Bel); if (!G) { G = { Bel, bi, u: { l: 1e9, t: 1e9, r: -1e9, b: -1e9 }, n: 0, mo: mota(nd.el, nd.s) }; theGom.set(Bel, G); }
          G.u.l = Math.min(G.u.l, ink.l); G.u.t = Math.min(G.u.t, ink.t); G.u.r = Math.max(G.u.r, ink.r); G.u.b = Math.max(G.u.b, ink.b); G.n++; }
        const g = { l: ink.l - bi.l, r: bi.r - ink.r, t: ink.t - bi.t, b: bi.b - ink.b };
        for (const k of ['l', 'r', 't', 'b']) {
          if (g[k] < gMin) { gMin = g[k]; canh = k; }
          if (-g[k] > ngoaiMax) { ngoaiMax = -g[k]; canhN = k; }
        }
        // mep (chi canh gan nhat moi dong): thieu = so px con thieu so voi muc toi thieu ngang / doc
        const mx = Math.min(g.l, g.r), my = Math.min(g.t, g.b);
        const thieuX = mx < opt.mepNgang && mx >= -2 ? opt.mepNgang - mx : 0, thieuY = my < opt.mepDoc && my >= -2 ? opt.mepDoc - my : 0;
        if ((thieuX > 0 || thieuY > 0) && trong > 0.9) {
          const k0 = duong(nd.el);
          if (!daMep.has(k0)) {
            daMep.add(k0);
            const kk = thieuX >= thieuY ? (g.l < g.r ? 'l' : 'r') : (g.t < g.b ? 't' : 'b');
            out.mep.push(Object.assign(mota(nd.el, nd.s), { gap: +Math.min(g[kk], 99).toFixed(1), canh: kk, the: Bel.tagName.toLowerCase() + (lopTen(Bel) ? '.' + lopTen(Bel) : ''),
              rect: { l: Math.round(ink.l), t: Math.round(ink.t), w: Math.round(ink.r - ink.l), h: Math.round(ink.b - ink.t) }, theRect: { l: Math.round(bi.l), t: Math.round(bi.t), r: Math.round(bi.r), b: Math.round(bi.b) }, fs: Math.round(fs) }));
          }
        }
      }
      trongTB /= Math.max(1, soL);
      if (ngoaiMax > 2 && !B.ovf && trongTB >= 0.5 && !(absGiua && trongTB < 0.8)) {
        const k0 = duong(nd.el);
        if (!daTran.has(k0)) {
          daTran.add(k0);
          const hh = ks.reduce((a, k) => ({ l: Math.min(a.l, k.l), t: Math.min(a.t, k.t), r: Math.max(a.r, k.r), b: Math.max(a.b, k.b) }), { l: 1e9, t: 1e9, r: -1e9, b: -1e9 });
          out.tran.push(Object.assign(mota(nd.el, nd.s), { ra: +ngoaiMax.toFixed(1), canh: canhN, trong: +trongTB.toFixed(2), the: Bel.tagName.toLowerCase() + (lopTen(Bel) ? '.' + lopTen(Bel) : ''),
            rect: { l: Math.round(hh.l), t: Math.round(hh.t), w: Math.round(hh.r - hh.l), h: Math.round(hh.b - hh.t) }, theRect: { l: Math.round(bi.l), t: Math.round(bi.t), r: Math.round(bi.r), b: Math.round(bi.b) }, fs: Math.round(fs) }));
        }
      }
    }
    // ---- CAN-BANG (BALANCE) / THUA (SPARSE): the CHI CO CHU (khong anh / canvas / svg lon), khong phai khung lon cua canh
    //   BALANCE: mot phia sat vien (< 10 px) ma phia doi dien rong (> 24 px va > 3x) -> lech, khong can doi
    //   SPARSE : khoi chu chi chiem < 30 % dien tich the (the >= 120x60) -> thua cho trong
    const lr0 = lop.getBoundingClientRect(), dtLop0 = Math.max(1, lr0.width * lr0.height);
    for (const G of theGom.values()) {
      const bi = G.bi, W = bi.r - bi.l, H = bi.b - bi.t;
      if (W < 60 || H < 30 || W * H > dtLop0 * 0.25 || G.n < 1) continue;
      const coHinh = [...G.Bel.querySelectorAll('img, canvas, svg, video')].some((x) => { const q = x.getBoundingClientRect(); return q.width * q.height > W * H * 0.08; });
      if (coHinh) continue;
      const g = { l: G.u.l - bi.l, r: bi.r - G.u.r, t: G.u.t - bi.t, b: bi.b - G.u.b };
      const lech = (a, b) => { const lo = Math.min(a, b), hi = Math.max(a, b); return lo >= -1 && lo < 10 && hi > 24 && hi > 3 * Math.max(1, lo); };
      const the = G.Bel.tagName.toLowerCase() + (lopTen(G.Bel) ? '.' + lopTen(G.Bel) : '');
      const theRect = { l: Math.round(bi.l), t: Math.round(bi.t), r: Math.round(bi.r), b: Math.round(bi.b) };
      if (lech(g.l, g.r) || lech(g.t, g.b)) out.canBang.push(Object.assign({}, G.mo, { the, theRect, g: { l: Math.round(g.l), r: Math.round(g.r), t: Math.round(g.t), b: Math.round(g.b) }, truc: lech(g.l, g.r) ? 'ngang' : 'doc' }));
      const fill = ((G.u.r - G.u.l) * (G.u.b - G.u.t)) / Math.max(1, W * H);
      if (W >= 120 && H >= 60 && fill < 0.3) out.thua.push(Object.assign({}, G.mo, { the, theRect, fill: +fill.toFixed(2) }));
    }
    // ---- OCCLUDED (+ CLIP-PATH: diem cua chu khong hit duoc chinh no = bi clip-path / mask / overflow cat)
    //   mo duc: nen mau alpha >= .5; gradient ma MOI diem dung alpha >= .5 (hoa van cham / vien mo co diem trong suot -> khong);
    //   img / canvas / video / anh nen url() chi khi nho (<= 35 % dien tich lop: lop canh vat lon co vung trong suot, khong biet duoc
    //   diem anh); hinh svg co fill alpha >= .5; mix-blend-mode khac normal -> khong.
    const dtLop = Math.max(1, lr.width * lr.height);
    const moDuc = (x) => {
      const st = estado(x);
      if (!st.disp || !st.vis || st.op < 0.35) return false;
      const c = cs(x);
      if (c.mixBlendMode && c.mixBlendMode !== 'normal') return false;
      const r = x.getBoundingClientRect();
      const lon = (r.width * r.height) / dtLop > 0.35;
      if (/^(IMG|VIDEO|CANVAS)$/.test(x.tagName)) return !lon;
      if (x instanceof SVGElement) {
        if (x.tagName.toLowerCase() === 'svg') return alpha(c.backgroundColor) >= 0.5;
        const fo = parseFloat(c.fillOpacity);
        return c.fill && c.fill !== 'none' && !/url\(/.test(c.fill) && alpha(c.fill) >= 0.5 && (isNaN(fo) || fo >= 0.5);
      }
      if (alpha(c.backgroundColor) >= 0.5) return true;
      const bi = c.backgroundImage || 'none';
      if (bi === 'none') return false;
      if (/url\(/.test(bi)) return !lon;
      const ms = bi.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}\b|\btransparent\b/gi) || [];
      return ms.length > 0 && ms.every((m) => alpha(m) >= 0.5);
    };
    const daCat = new Set();
    const daChe = new Set();
    for (const nd of nodes) {
      if (nd.rt) continue;
      if (nd.chars.filter((k) => !k.sp).length < 1) continue;
      const lines = tachDong(nd.chars, docMode(nd.p0));
      let tong = 0, bi = 0, vat = null, khongHit = 0;
      for (const L of lines) {
        const h = hopDong(L);
        const y = (h.t + h.b) / 2;
        for (const f of [0.25, 0.5, 0.75]) {
          const x = h.l + (h.r - h.l) * f;
          if (x < 0 || y < 0 || x >= vw || y >= vh) continue;
          if (meo && x > meo.l && x < meo.r && y > meo.t && y < meo.b) continue;
          tong++;
          // cac phan tu tai diem, tren xuong duoi: gap chinh chu -> khong bi che; gap phan tu mo duc (khong phai to tien) truoc -> bi che
          let che = null, gap = false;
          for (const e of document.elementsFromPoint(x, y)) {
            if (e === nd.el || nd.el.contains(e)) { gap = true; break; }
            if (e.contains(nd.el)) continue;
            if (!che && moDuc(e)) che = e;
          }
          if (!gap) { khongHit++; if (!che) continue; }
          if (!che) continue;
          bi++;
          if (!vat) vat = che;
        }
      }
      if (tong >= 2 && khongHit >= 2 && khongHit / tong >= 0.5 && bi < 2) {
        // khong bi vat mo duc che ma diem cua chu khong hit duoc chinh no: bi clip-path / mask / overflow (doTrang khong do clip-path)
        const k0 = duong(nd.el);
        if (!daCat.has(k0)) {
          daCat.add(k0);
          const hh = nd.chars.filter((k) => !k.sp).reduce((a, k) => ({ l: Math.min(a.l, k.l), t: Math.min(a.t, k.t), r: Math.max(a.r, k.r), b: Math.max(a.b, k.b) }), { l: 1e9, t: 1e9, r: -1e9, b: -1e9 });
          let cp = null;
          for (let x = nd.el; x && x !== lop.parentElement; x = x.parentElement) { const c = cs(x); if ((c.clipPath && c.clipPath !== 'none') || (c.maskImage && c.maskImage !== 'none') || (c.webkitMaskImage && c.webkitMaskImage !== 'none')) { cp = x; break; } }
          out.cat.push(Object.assign(mota(nd.el, nd.s), { f: +(khongHit / tong).toFixed(2), diem: tong, boi: cp ? cp.tagName.toLowerCase() + (lopTen(cp) ? '.' + lopTen(cp) : '') : null,
            rect: { l: Math.round(hh.l), t: Math.round(hh.t), w: Math.round(hh.r - hh.l), h: Math.round(hh.b - hh.t) } }));
        }
      }
      if (tong >= 2 && bi >= 2 && bi / tong >= 0.5 && vat) {
        const k0 = duong(nd.el);
        if (daChe.has(k0)) continue;
        daChe.add(k0);
        const trongLop = lop.contains(vat);
        const hh = nd.chars.filter((k) => !k.sp).reduce((a, k) => ({ l: Math.min(a.l, k.l), t: Math.min(a.t, k.t), r: Math.max(a.r, k.r), b: Math.max(a.b, k.b) }), { l: 1e9, t: 1e9, r: -1e9, b: -1e9 });
        const vr = vat.getBoundingClientRect();
        out.che.push(Object.assign(mota(nd.el, nd.s), { f: +(bi / tong).toFixed(2), diem: tong, vat: vat.tagName.toLowerCase() + (lopTen(vat) ? '.' + lopTen(vat) : '') + (vat.id ? '#' + vat.id : ''), vatTrongLop: trongLop, vatTrangTri: laTrangTri(vat), vatPath: trongLop ? duong(vat) : null,
          rect: { l: Math.round(hh.l), t: Math.round(hh.t), w: Math.round(hh.r - hh.l), h: Math.round(hh.b - hh.t) }, vatRect: { l: Math.round(vr.left), t: Math.round(vr.top), w: Math.round(vr.width), h: Math.round(vr.height) } }));
      }
    }
    out.ms = Math.round(performance.now() - t0);
    return out;
  } finally {
    pe.remove();
  }
}
