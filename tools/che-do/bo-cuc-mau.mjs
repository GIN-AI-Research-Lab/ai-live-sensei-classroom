// bo-cuc-mau.mjs — LAY MAU LIEN TUC (100 ms) trong luc nhip dang vao + phan tich cac mau (chuyen canh, chu mo dang cho, bong thoai, khung trong)
// Phan A (khoiSampler) chay TRONG TRANG (chuyen thanh chuoi, khong dung bien ngoai); phan B (phanTichNhip) chay o Node.
// Dung boi do-bo-cuc.mjs. Xem dau tep do-bo-cuc.mjs de biet y nghia cac phep do.

// =================================================================================================
//  A. TRONG TRANG
// =================================================================================================
/**
 * Cai bo lay mau vao trang: window.__samp. cfg = { opt (tuy chon cua doTrang, opaqueMin 0.25), balSel[], lech ms... }, doTrangFn = doTrang
 *   __samp.bat(nhan)        bat dau lay mau (xoa hang cu)
 *   __samp.dung()           dung, tra ve { rows, bal, t0, feeds }
 *   __samp.tuyen(text, o)   phat 'ban ghi' gia theo tung manh vao che do (canh.loi), khoa loi that cua mo phong
 */
export function khoiSampler(cfg, doTrangFn) {
  if (window.__samp) return true;
  const S = window.__samp = { rows: [], bal: [], dang: false, hen: null, henBal: null, t0: 0, nhan: '', rawGia: null, khoaLoi: false, feeds: [], prev: null, canhTruoc: null };
  const now = () => performance.timeOrigin + performance.now();
  const chuanS = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const lopChuoi = (el) => (el.getAttribute && el.getAttribute('class')) || '';
  const RE_TT = /decor|ghost|watermark|net-bong/i;
  const laTT = (el, lop) => {
    for (let x = el; x && x !== lop.parentElement; x = x.parentElement) {
      if (x.hasAttribute && x.hasAttribute('data-decor')) return true;
      if (lopChuoi(x).split(/\s+/).some((c) => RE_TT.test(c) || c === 'a-bong' || c === 'bong')) return true;
    }
    return false;
  };
  const duong = (el, lop) => { const a = []; for (let x = el; x && x !== lop; x = x.parentElement) { const p = x.parentElement; a.push(x.tagName.toLowerCase() + (p ? ':' + Array.prototype.indexOf.call(p.children, x) : '')); } return a.reverse().join('>'); };
  const lopTen = (el) => lopChuoi(el).split(/\s+/).filter(Boolean).slice(0, 2).join('.');
  const ngoaiLe = (el) => { const ds = (cfg.opt && cfg.opt.choPhepNho) || []; for (let x = el; x && x.nodeType === 1; x = x.parentElement) { if (x.classList && x.classList.contains('cd-lop')) break; const c = lopChuoi(x).split(/\s+/); if (ds.some((p) => c.some((k) => k.startsWith(p)))) return true; } return false; };
  const rawNow = () => {
    if (S.rawGia != null) return S.rawGia;
    try { const l = window.__motion && __motion.luot(); if (l && l.length) return l[l.length - 1].raw || ''; } catch (e) {}
    return '';
  };

  // tim dong loi Sensei: selector khai bao truoc; neu khong co (che do moi) thi tu doan: phan tu la o nua duoi khung co chu la mot doan cuoi cua ban ghi
  let balTD = null, balTDt = 0;
  function timBal(lop) {
    let khopSel = false;
    for (const sel of cfg.balSel || []) {
      let ds; try { ds = lop.querySelectorAll(sel); } catch (e) { continue; }
      if (!ds.length) continue;
      khopSel = true;
      // nhieu phan tu khop (dong cu / dong moi, dong ngoai man hinh): lay cai NHIN THAY (trong khung nhin, opacity > .05, co chu), thap nhat
      let best = null;
      for (const e of ds) {
        if (!chuanS(e.textContent)) continue;
        const r = e.getBoundingClientRect();
        if (r.width < 4 || r.height < 4 || r.right <= 0 || r.left >= innerWidth || r.bottom <= 0 || r.top >= innerHeight) continue;
        let op = 1; for (let x = e; x && x !== lop.parentElement; x = x.parentElement) { const c = getComputedStyle(x); op *= parseFloat(c.opacity) || 0; if (c.display === 'none' || c.visibility === 'hidden') op = 0; }
        if (op < 0.05) continue;
        if (!best || r.bottom > best.b) best = { e, b: r.bottom };
      }
      if (best) return best.e;
      continue;   // co phan tu khop nhung khong cai nao nhin thay (dong cu ngoai man hinh / dang an): coi nhu chua co dong loi
    }
    if (khopSel) return null;   // selector khai bao co phan tu nhung chua cai nao nhin thay: chua co dong loi (khong tu doan)
    try {
      if (balTD && balTD.isConnected && lop.contains(balTD)) return balTD;
      const g = now();
      if (g - balTDt < 500) return null;
      balTDt = g;
      const raw = chuanS(rawNow());
      if (raw.length < 12) return null;
      let best = null;
      lop.querySelectorAll('div,p,span,b,i,em').forEach((e) => {
        if (e.children.length > 4 || e.closest('rt,ruby')) return;
        const t = chuanS(e.textContent).replace(/^(…|\.\.\.)|(…|\.\.\.)$/g, '').trim();
        if (t.length < 8 || !raw.includes(t)) return;
        const r = e.getBoundingClientRect();
        if (r.width < 30 || r.height < 8 || r.top < innerHeight * 0.4 || r.bottom > innerHeight + 4 || r.right > innerWidth + 4 || r.left < -4) return;
        if (!best || t.length > best.n) best = { e, n: t.length };
      });
      if (best) { balTD = best.e; return balTD; }
    } catch (e) {}
    return null;
  }

  // ---------------------------------------------------------------- mot mau
  function mauMot() {
    const lop = document.querySelector('.cd-lop');
    const row = { t: now(), idx: window.__lecture ? __lecture.index() : -1, lop: false };
    if (!lop) return row;
    if (getComputedStyle(lop).visibility === 'hidden') { row.lopAn = true; return row; }
    row.lop = true;
    const c0 = performance.now();
    const lr = lop.getBoundingClientRect();
    // ---- a b c d (doTrang, chi giu cac phan tu co van de)
    let m = null;
    try { m = doTrangFn(cfg.opt); } catch (e) { row.loi = String(e).slice(0, 120); }
    if (m && m.ok) {
      row.clip = m.clip.filter((x) => !x.ok && x.boKind !== 'cuon').map((x) => ({ path: x.path, tag: x.tag, cls: x.cls, txt: x.txt, rect: x.rect, cut: x.cut, side: x.side, frac: x.frac, thay: x.thay, boKind: x.boKind, boTag: x.boTag, boCls: x.boCls, boRect: x.boRect, ell: x.ell }));
      row.meoChong = m.meoChong.filter((x) => !x.ok).map((x) => ({ path: x.path, tag: x.tag, cls: x.cls, txt: x.txt, rect: x.rect, ix: x.ix, iy: x.iy, f: x.f }));
      row.chong = m.chong.filter((x) => !x.ok).map((x) => ({ a: x.a, b: x.b, f: x.f, ix: x.ix, iy: x.iy, at: x.at }));
      row.nho = m.nho.filter((x) => !x.cong).map((x) => ({ path: x.path, tag: x.tag, cls: x.cls, txt: x.txt, fs: x.fs, fs0: x.fs0, sc: x.sc, nhanHoa: x.nhanHoa, rt: x.rt, rect: x.rect }));
      row.meo = m.meo; row.soChu = m.soChu;
    }
    // ---- duyet chu nhin thay: mo dang cho, ky hieu giu cho, trung chu, do phu
    const opC = new Map();
    const opOf = (el) => {
      if (el === lop) return { op: 1, disp: true };
      let r = opC.get(el);
      if (r) return r;
      const p = opOf(el.parentElement);
      const cs = getComputedStyle(el);
      r = { op: p.op * (parseFloat(cs.opacity) || 0), disp: p.disp && cs.display !== 'none', vis: cs.visibility === 'visible' };
      opC.set(el, r);
      return r;
    };
    const tw = document.createTreeWalker(lop, NodeFilter.SHOW_TEXT);
    const rg = document.createRange();
    const cols = cfg.cols || 24, rows = cfg.rows || 16, cw = lr.width / cols, ch = lr.height / rows;
    const cell = new Float32Array(cols * rows);
    const danh = (l, t, r, b) => {
      l = Math.max(l, lr.left); t = Math.max(t, lr.top); r = Math.min(r, lr.right); b = Math.min(b, lr.bottom);
      if (r <= l || b <= t) return;
      const c0i = Math.floor((l - lr.left) / cw), c1i = Math.min(cols - 1, Math.floor((r - lr.left - 0.01) / cw));
      const r0i = Math.floor((t - lr.top) / ch), r1i = Math.min(rows - 1, Math.floor((b - lr.top - 0.01) / ch));
      for (let y = r0i; y <= r1i; y++) for (let x = c0i; x <= c1i; x++) {
        const ix = Math.min(r, lr.left + (x + 1) * cw) - Math.max(l, lr.left + x * cw), iy = Math.min(b, lr.top + (y + 1) * ch) - Math.max(t, lr.top + y * ch);
        if (ix > 0 && iy > 0) cell[y * cols + x] += (ix * iy) / (cw * ch);
      }
    };
    const faded = [], glyph = [], ent = [], tatCa = [], sig = [];
    const h32 = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
    const balEl = timBal(lop);
    let nText = 0, nHien = 0;
    let n;
    while ((n = tw.nextNode())) {
      const s = n.nodeValue;
      if (!s || !s.trim()) continue;
      const el = n.parentElement;
      if (!el || el.closest('script,style,noscript,title')) continue;
      const st = opOf(el);
      if (!st.disp || !st.vis || st.op < 0.05) continue;
      rg.selectNodeContents(n);
      const rs = Array.prototype.filter.call(rg.getClientRects(), (r) => r.width >= 1 && r.height >= 1);
      if (!rs.length) continue;
      const inView = rs.some((r) => r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight);
      if (!inView) continue;
      nText++;
      const txt = chuanS(s);
      if (st.op >= 0.25) {
        nHien++;
        if (sig.length < 220 && txt.length >= 2) sig.push(h32(txt));
        if (!el.closest('rt')) tatCa.push({ el, inBal: !!(balEl && balEl.contains(el)), txt });
        rs.forEach((r) => danh(r.left, r.top - 4, r.right, r.bottom + 4));
        if (txt.length >= 12) ent.push({ el, txt });
      }
      if (st.op >= 0.15 && st.op <= 0.85 && !laTT(el, lop) && !ngoaiLe(el)) faded.push({ path: duong(el, lop), tag: el.tagName.toLowerCase(), cls: lopTen(el), txt: txt.slice(0, 40), op: +st.op.toFixed(2) });
      if (st.op >= 0.25 && /^[?？]{1,2}$/.test(txt) && !el.closest('rt') && !ngoaiLe(el)) {
        const r = el.getBoundingClientRect();
        glyph.push({ path: duong(el, lop), tag: el.tagName.toLowerCase(), cls: lopTen(el), txt, op: +st.op.toFixed(2), rect: { l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) } });
      }
    }
    row.faded = faded; row.glyph = glyph; row.nText = nText; row.nHien = nHien; row.sig = sig;
    // dong loi Sensei lap lai chu da hien o cho khac: chuoi >= 12 ky tu (bo khoang trang / dau cau) cua bong thoai nam trong phan chu con lai
    if (balEl) {
      const chuanG = (x) => x.replace(/[\s\u3000.,!?;:、。！？…\-–—"'“”‘’()（）「」『』·・…]+/g, '').toLowerCase();
      const bt = chuanG(tatCa.filter((x) => x.inBal).map((x) => x.txt).join(''));
      if (bt.length >= 12) {
        const kh = tatCa.filter((x) => !x.inBal);
        const dsC = kh.map((x) => chuanG(x.txt));
        const rest = dsC.join('');
        for (let k = 0; k + 12 <= bt.length; k++) {
          const g = bt.substr(k, 12);
          if (rest.includes(g)) {
            // chuoi trung co the nam tren nhieu nut lien nhau: tim nut chua ky tu dau tien cua cho khop
            const pos = rest.indexOf(g);
            let acc = 0, goc = null;
            for (let q = 0; q < dsC.length; q++) { if (pos < acc + dsC[q].length) { goc = kh[q]; break; } acc += dsC[q].length; }
            row.balDup = { g, tb: chuanS(balEl.textContent).slice(0, 60), ca: goc ? lopTen(goc.el) : '', ta: goc ? goc.txt.slice(0, 60) : '' };
            break;
          }
        }
      }
    }
    // phu song: hinh / video / canvas / anh nen url() nhin thay
    lop.querySelectorAll('img,video,canvas,picture').forEach((e) => {
      const st = opOf(e);
      if (!st.disp || !st.vis || st.op < 0.25) return;
      const r = e.getBoundingClientRect();
      if (r.width * r.height > 16) danh(r.left, r.top, r.right, r.bottom);
    });
    let phu = 0;
    for (let i = 0; i < cell.length; i++) if (cell[i] >= 0.18) phu++;
    row.cover = +(phu / cell.length).toFixed(3);
    // ---- trung chu: chuoi >= 12 ky tu xuat hien o hai nut chu khac nhau (khong long nhau)
    {
      const G = 12, map = new Map(), dup = new Map();
      ent.forEach((e, i) => {
        const t = e.txt;
        const seen = new Set();
        for (let k = 0; k + G <= t.length; k++) {
          const g = t.substr(k, G);
          if (seen.has(g)) continue;
          seen.add(g);
          if (!/[\p{L}\p{N}]{5}/u.test(g.replace(/\s/g, ''))) continue;
          const a = map.get(g);
          if (a) { if (!a.includes(i)) a.push(i); } else map.set(g, [i]);
        }
      });
      map.forEach((idx, g) => {
        if (idx.length < 2) return;
        for (let a = 0; a < idx.length; a++) for (let b = a + 1; b < idx.length; b++) {
          const ea = ent[idx[a]].el, eb = ent[idx[b]].el;
          if (ea === eb || ea.contains(eb) || eb.contains(ea)) continue;
          if (balEl && (balEl.contains(ea) || balEl.contains(eb))) continue;   // bong thoai da co phep do rieng (baldup)
          if (ngoaiLe(ea) || ngoaiLe(eb)) continue;
          const ra = ea.closest('ruby'), rb = eb.closest('ruby');
          if (ra && ra === rb) continue;
          const k = duong(ea, lop) + '|' + duong(eb, lop);
          const o = dup.get(k);
          if (o) o.n++; else dup.set(k, { a: duong(ea, lop), b: duong(eb, lop), ta: ent[idx[a]].txt.slice(0, 50), tb: ent[idx[b]].txt.slice(0, 50), g, n: 1, ca: lopTen(ea), cb: lopTen(eb) });
        }
      });
      row.dup = [...dup.values()].slice(0, 6);
    }
    // ---- so phan tu dang chuyen dong (goc, khong tinh con cua phan tu cung dang chuyen dong)
    {
      const cur = new WeakMap(), changed = new Set();
      let dem = 0;
      const all = lop.querySelectorAll('*');
      const lim = Math.min(all.length, 3000);
      for (let i = 0; i < lim; i++) {
        const e = all[i];
        if (e.namespaceURI !== 'http://www.w3.org/1999/xhtml' && e.tagName === 'style') continue;
        const cs = getComputedStyle(e);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const r = e.getBoundingClientRect();
        if (r.width * r.height < 4) continue;
        const o = { l: r.left, t: r.top, w: r.width, h: r.height, op: parseFloat(cs.opacity) || 0 };
        cur.set(e, o);
        const p = S.prev && S.prev.get(e);
        if (p && (Math.abs(o.l - p.l) > 1.5 || Math.abs(o.t - p.t) > 1.5 || Math.abs(o.w - p.w) > 1.5 || Math.abs(o.h - p.h) > 1.5 || Math.abs(o.op - p.op) > 0.03)) changed.add(e);
      }
      changed.forEach((e) => { if (!(e.parentElement && changed.has(e.parentElement))) dem++; });
      S.prev = cur;
      row.movers = dem;
    }
    row.ms = +(performance.now() - c0).toFixed(0);
    return row;
  }

  // ---------------------------------------------------------------- bong thoai (poll 40 ms)
  function cutPx(el, lop) {
    const rg = document.createRange();
    rg.selectNodeContents(el);
    const fs = parseFloat(getComputedStyle(el).fontSize) || 16;
    const rs = Array.prototype.filter.call(rg.getClientRects(), (r) => r.width >= 1 && r.height >= 1);
    if (!rs.length) return { cut: 0, side: '' };
    const bb = rs.reduce((a, r) => ({ l: Math.min(a.l, r.left), t: Math.min(a.t, r.top + 0.2 * fs), r: Math.max(a.r, r.right), b: Math.max(a.b, r.bottom - 0.08 * fs) }), { l: 1e9, t: 1e9, r: -1e9, b: -1e9 });
    let cut = 0, side = '';
    const up = (v, s) => { if (v > cut) { cut = v; side = s; } };
    for (let a = el; a && a !== lop.parentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      const ox = cs.overflowX !== 'visible', oy = cs.overflowY !== 'visible';
      if (!ox && !oy && (!cs.clipPath || cs.clipPath === 'none')) continue;
      const r = a.getBoundingClientRect();
      if (ox) { up(r.left - bb.l, 'l'); up(bb.r - r.right, 'r'); }
      if (oy) { up(r.top - bb.t, 't'); up(bb.b - r.bottom, 'b'); }
    }
    up(-bb.l, 'l'); up(bb.r - innerWidth, 'r'); up(-bb.t, 't'); up(bb.b - innerHeight, 'b');
    return { cut: +Math.max(0, cut).toFixed(1), side };
  }
  let balCuoi = null;
  function pollBal() {
    if (!S.dang) return;
    S.henBal = setTimeout(pollBal, 40);
    const lop = document.querySelector('.cd-lop');
    if (!lop) return;
    const el = timBal(lop);
    if (!el) { if (!S.balVang) S.balVang = now(); return; }
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const text = chuanS(el.textContent);
    let op = 1; for (let x = el; x && x !== lop.parentElement; x = x.parentElement) op *= parseFloat(getComputedStyle(x).opacity) || 0;
    const rec = { t: now(), text, fs: +(parseFloat(cs.fontSize) || 0).toFixed(1), h: Math.round(r.height), top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), op: +op.toFixed(2),
      sh: el.scrollHeight, chh: el.clientHeight, sw: el.scrollWidth, cww: el.clientWidth };
    const same = balCuoi && balCuoi.text === rec.text && balCuoi.fs === rec.fs && Math.abs(balCuoi.h - rec.h) < 2 && Math.abs(balCuoi.top - rec.top) < 2 && Math.abs(balCuoi.op - rec.op) < 0.08 && S.bal.length && (rec.t - balCuoi.t) < 400;
    if (same) return;
    if (rec.text) {
      const k = cutPx(el, lop); rec.cut = k.cut; rec.side = k.side;
    } else { rec.cut = 0; rec.side = ''; }
    // dut giua chu: co "…" o cuoi (ngan()) ma cau goc con tiep o ngay sau
    const raw = chuanS(rawNow());
    rec.rawLen = raw.length;
    const ell = /(…|\.\.\.)$/.test(rec.text);
    const ellDau = /^(…|\.\.\.)/.test(rec.text);
    rec.ell = ell; rec.ellDau = ellDau;
    const core = rec.text.replace(/(…|\.\.\.)$/, '').replace(/^(…|\.\.\.)/, '').trim();
    rec.lenCore = core.length;
    if (core) {
      const ix = raw.lastIndexOf(core);
      rec.khop = ix >= 0;
      if (ix >= 0) {
        const sau = raw.charAt(ix + core.length), truoc = raw.charAt(ix - 1);
        const L = /[\p{Script=Latin}\p{N}]/u;   // chi tinh chu Latin (Viet / romaji): tieng Nhat khong co ranh gioi tu ro rang
        rec.sauRaw = raw.length - (ix + core.length);
        rec.truocRaw = ix;
        // cat giua chu: co '…' cuoi va ky tu ke tiep trong ban ghi la chu; hoac co '…' dau va ky tu ngay truoc la chu
        rec.giua = (ell && L.test(sau) && L.test(core.slice(-1))) || (ellDau && L.test(truoc) && L.test(core.charAt(0)));
        rec.raw = raw.length;
      }
    }
    rec.cssEll = (cs.textOverflow || '').indexOf('ellipsis') >= 0 && el.scrollWidth > el.clientWidth + 1;
    rec.ovf = Math.max(0, el.scrollHeight - el.clientHeight, el.scrollWidth - el.clientWidth);
    // line-clamp (-webkit-line-clamp): dong cuoi bi cat co chu y — phan bi che la cac tu Sensei DANG noi
    let clamp = false;
    for (let a = el; a && a !== lop.parentElement && !clamp; a = a.parentElement) {
      const c = getComputedStyle(a);
      if (c.webkitLineClamp && c.webkitLineClamp !== 'none' && a.scrollHeight > a.clientHeight + 2) { clamp = true; rec.clampAn = Math.round((a.scrollHeight - a.clientHeight) / Math.max(10, parseFloat(cs.lineHeight) || (rec.fs * 1.25))); }
    }
    rec.clamp = clamp;
    rec.lh = Math.round((parseFloat(cs.lineHeight) || rec.fs * 1.25) * 10) / 10;
    rec.el = el.tagName.toLowerCase() + '.' + lopTen(el);
    S.bal.push(rec);
    balCuoi = rec;
  }

  // ---------------------------------------------------------------- vong lay mau
  function vong() {
    if (!S.dang) return;
    const t0 = performance.now();
    let row = null;
    try { row = mauMot(); } catch (e) { row = { t: now(), loi: String(e).slice(0, 120) }; }
    // nhanh (100 ms): 7 s dau, va 7 s sau moi lan doi nhip / moi lan mot cue chay xong; con lai cham (300 ms)
    try {
      const k = (window.__lecture ? __lecture.index() : -1) + '|' + (window.__motion ? __motion.cues().filter((c) => c.firedPerf).length : 0);
      if (k !== S.khoa) { S.khoa = k; S.tDoi = now(); }
    } catch (e) {}
    if (S.khoaLoi && S.feedIdx != null && row.idx !== S.feedIdx && row.idx !== -1) { S.khoaLoi = false; S.rawGia = null; S.feedIdx = null; }   // het nhip: tra lai loi() that cho nhip ke
    const gio = now();
    row.pha = (gio - S.t0) < (cfg.nhanhMs || 7000) || (S.tDoi && gio - S.tDoi < (cfg.nhanhMs || 7000)) ? 'nhanh' : 'cham';
    S.rows.push(row);
    const kc = row.pha === 'nhanh' ? (cfg.kcNhanh || 100) : (cfg.kcCham || 300);
    S.hen = setTimeout(vong, Math.max(0, kc - (performance.now() - t0)));
  }
  S.bat = (nhan) => {
    S.dung();
    S.rows = []; S.bal = []; S.feeds = []; S.prev = null; S.khoa = null; S.tDoi = 0; S.nhan = nhan || ''; S.t0 = now(); S.dang = true; S.balVang = 0; balCuoi = null; S.rawGia = null; S.khoaLoi = false; S.feedIdx = null;
    S.hen = setTimeout(vong, 0);
    S.henBal = setTimeout(pollBal, 0);
    return S.t0;
  };
  S.dung = () => {
    S.dang = false;
    clearTimeout(S.hen); clearTimeout(S.henBal); clearTimeout(S.henFeed);
    S.khoaLoi = false; S.rawGia = null;
    return { rows: S.rows, bal: S.bal, t0: S.t0, feeds: S.feeds, balVang: S.balVang };
  };

  // ---------------------------------------------------------------- phat 'ban ghi' gia (dinh dang outputTranscription)
  S.tuyen = (text, o) => {
    o = o || {};
    const sent = window.__probeCanh;
    clearTimeout(S.henFeed);
    S.khoaLoi = true;
    let seed = (o.seed || 7) >>> 0;
    const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
    const toks = String(text).match(/[぀-ヿ一-鿿々ー]{1,3}|\s*[^\s぀-ヿ一-鿿々ー]+|\s+/g) || [String(text)];
    let raw = '', i = 0;
    const f = { t0: now(), tre: o.tre == null ? 350 : o.tre, len: String(text).length, chunks: 0, tXong: null, cho: 0 };
    S.feeds.push(f);
    const buoc = () => {
      if (!S.dang) return;
      // doi den khi che do da dung nhip MOI (canh khac canh truoc luc goi)
      const cur = window.__probeCanh;
      if (o.doi && !f.tBatDau && (!cur || cur === sent)) { f.cho += 60; if (f.cho < 5000) { S.henFeed = setTimeout(buoc, 60); return; } }
      if (!f.tBatDau) { f.tBatDau = now(); try { S.feedIdx = window.__lecture ? __lecture.index() : null; } catch (e) {} S.henFeed = setTimeout(buoc, f.tre); f.tre = 0; return; }
      const k = 1 + Math.floor(rnd() * 3);
      const chunk = toks.slice(i, i + k).join('');
      i += k;
      if (!chunk) { f.tXong = now(); return; }
      raw += chunk;
      S.rawGia = raw;
      f.chunks++;
      try { const c = window.__probeCanh; if (c && (c.loiGoc || c.loi)) (c.loiGoc || c.loi).call(c, chunk, raw, { luot: 'probe' }); } catch (e) { f.loi = String(e).slice(0, 100); }
      if (i >= toks.length) { f.tXong = now(); return; }
      S.henFeed = setTimeout(buoc, 90 + Math.floor(rnd() * 170));
    };
    S.henFeed = setTimeout(buoc, 0);
    return f.len;
  };
  return true;
}

// =================================================================================================
//  B. NODE: phan tich mau
// =================================================================================================
const NG = {
  persistNhanh: 3, persistCham: 2, persistMs: 300,   // van de phai giu >= 3 mau lien tiep (nhanh) / 2 mau (cham) va >= 300 ms
  failMs: 700,                                        // giu >= 700 ms va vuot nguong FAIL cua tinh => FAIL (khong thi WARN)
  fadeLo: 0.15, fadeHi: 0.85, fadeMs: 600, fadeDelta: 0.03,
  glyphMs: 800,
  balLateMs: 1200, balMidMs: 400, balTruncMs: 400, balCutMs: 300, balCutPx: 2,
  balJitterWin: 1000, balRewriteWarn: 2, balRewriteFail: 4, balFsWarn: 3, balFsFail: 6, balShiftWarn: 4, balShiftFail: 8, balRateWarn: 8,
  blankRatio: 0.4, blankAbs: 0.4, blankFailMs: 250, blankWarnMs: 120,
  dauSlowMs: 2500,                                   // noi dung co nghia dau tien muon hon 2,5 s => WARN
  moversWarn: 30,
};
export { NG };

const nhomLienTiep = (rows, cach) => {
  // rows da sap theo t; tra ve [[i0..i1]] cac doan lien tiep (khoang cach giua hai mau <= cach ms)
  const out = []; let cur = null;
  rows.forEach((r, i) => { if (cur && r.t - rows[cur[cur.length - 1]].t <= cach) cur.push(i); else { cur = [i]; out.push(cur); } });
  return out;
};

/**
 * Chay mot khoa (key) qua cac mau: khoa[i] la Map<key, item> cua mau i. Tra ve cac lan xuat hien duy tri du dai:
 * [{ key, i0, i1, tGiaTri..., soMau, ms, item (tot nhat) }]
 */
function duyTri(rows, dsKhoa, danhGia, ms0 = NG.persistMs) {
  const out = [];
  const dang = new Map();   // key -> { i0, i1, items: [] }
  const dong = (k, r) => {
    const a = rows[r.i0], b = rows[r.i1];
    const kc = b.pha === 'nhanh' ? 100 : 150;
    const ms = b.t - a.t + kc;
    const n = r.i1 - r.i0 + 1;
    const need = (a.pha === 'nhanh' ? NG.persistNhanh : NG.persistCham);
    if (n >= need && ms >= ms0) out.push({ key: k, i0: r.i0, i1: r.i1, n, ms, t0: a.t, items: r.items });
  };
  for (let i = 0; i < rows.length; i++) {
    const cur = dsKhoa[i] || new Map();
    for (const [k, it] of cur) {
      const o = dang.get(k);
      if (o && o.i1 === i - 1) { o.i1 = i; o.items.push(it); } else { if (o) dong(k, o); dang.set(k, { i0: i, i1: i, items: [it] }); }
    }
    for (const [k, o] of [...dang]) if (o.i1 < i) { dong(k, o); dang.delete(k); }
  }
  for (const [k, o] of dang) dong(k, o);
  return out;
}

/** Ket qua cua mot nhip (rows + bal da lay tu trang) -> danh sach phat hien tho (chua gan muc do) */
export function phanTichNhip(seg, tinh) {
  // seg: { rows, bal, t0, feeds, nhan, man, ... }; tinh: { minFs, path tinh cua nhip } — tra ve { pv: [...] }
  const rows = seg.rows.filter((r) => r.lop).sort((a, b) => a.t - b.t);
  const pv = [];
  const off = (t) => Math.round(t - seg.t0);
  const khoa = (f) => rows.map((r) => f(r));
  const M = (arr, kf) => { const m = new Map(); (arr || []).forEach((x) => m.set(kf(x), x)); return m; };
  // a CLIP
  for (const d of duyTri(rows, khoa((r) => M(r.clip, (x) => x.path + '|' + x.side)), null)) {
    const it = d.items.reduce((a, b) => (b.cut > a.cut ? b : a));
    // phan tu dang truot / cuon (bang chay chu, hieu ung truot vao): vi tri doi >= 40 px trong luc bi cat => chu y thiet ke, khong bao
    const r0 = d.items[0].rect;
    if (d.items.some((x) => Math.abs(x.rect.l - r0.l) + Math.abs(x.rect.t - r0.t) >= 40)) continue;
    pv.push({ loai: 'clip', key: it.path, kf: d.key, d, it });
  }
  // b MEO
  for (const d of duyTri(rows, khoa((r) => M(r.meoChong, (x) => x.path)), null)) {
    const it = d.items.reduce((a, b) => (b.f > a.f ? b : a));
    pv.push({ loai: 'meo', key: it.path, kf: d.key, d, it });
  }
  // c CHONG
  for (const d of duyTri(rows, khoa((r) => M(r.chong, (x) => x.a.path + '|' + x.b.path)), null)) {
    const it = d.items.reduce((a, b) => (b.f > a.f ? b : a));
    pv.push({ loai: 'chong', key: it.a.path + '|' + it.b.path, kf: d.key, d, it });
  }
  // d NHO
  for (const d of duyTri(rows, khoa((r) => M(r.nho, (x) => x.path)), null)) {
    const it = d.items.reduce((a, b) => (b.fs < a.fs ? b : a));
    pv.push({ loai: 'nho', key: it.path, kf: d.key, d, it });
  }
  // trung chu
  for (const d of duyTri(rows, khoa((r) => M(r.dup, (x) => x.a + '|' + x.b)), null)) {
    const it = d.items[0];
    pv.push({ loai: 'dup', key: d.key, kf: d.key, d, it });
  }
  // dong loi Sensei lap lai chu da hien tren san khau
  for (const d of duyTri(rows, rows.map((r) => (r.balDup ? new Map([[r.balDup.g, r.balDup]]) : null)), null, 500)) {
    pv.push({ loai: 'baldup', key: d.key, kf: d.key, d, it: d.items[0] });
  }
  // chu mo dang cho: op giua fadeLo..fadeHi, gan nhu khong doi (|d op| < fadeDelta giua hai mau) >= fadeMs
  {
    const dsK = rows.map((r) => M(r.faded, (x) => x.path + '|' + x.txt));
    const raw = duyTri(rows, dsK, null, NG.fadeMs);
    for (const d of raw) {
      const ops = d.items.map((x) => x.op);
      const doi = Math.max(...ops) - Math.min(...ops);
      if (doi > NG.fadeDelta * 3) continue;   // dang mo dan / tat dan that: khong phai chu dung yen
      const it = d.items[Math.floor(d.items.length / 2)];
      pv.push({ loai: 'mo', key: it.path, kf: d.key, d, it });
    }
  }
  // ky hieu giu cho ("?"): song > glyphMs
  for (const d of duyTri(rows, rows.map((r) => M(r.glyph, (x) => x.path + '|' + x.txt)), null, NG.glyphMs)) {
    pv.push({ loai: 'glyph', key: d.items[0].path, kf: d.key, d, it: d.items[0] });
  }
  return { pv, off };
}

/** Bong thoai: chuoi su kien -> cac phat hien */
export function phanTichBong(seg) {
  const ev = (seg.bal || []).slice().sort((a, b) => a.t - b.t);
  const out = { n: ev.length, doi: 0, viet: 0, fsDoi: 0, dich: 0, doiMax: 0, vietMax: 0, fsMax: 0, dichMax: 0, pv: [] };
  if (!ev.length) return out;
  const cuoi = seg.tCuoi || (ev[ev.length - 1].t + 400);
  const thoi = (i) => (i + 1 < ev.length ? ev[i + 1].t : cuoi) - ev[i].t;   // ev[i] tinh tu ev[i].t den su kien ke tiep
  // chuoi thay doi
  const thayDoi = [], viet = [], fsd = [], dich = [];
  for (let i = 1; i < ev.length; i++) {
    const a = ev[i - 1], b = ev[i];
    if (a.text !== b.text) {
      thayDoi.push(b.t);
      const cA = a.text.replace(/(…|\.\.\.)$/, ''), cB = b.text.replace(/(…|\.\.\.)$/, '');
      if (a.text && !cB.startsWith(cA)) viet.push(b.t);
    }
    if (Math.abs(a.fs - b.fs) >= 0.5) fsd.push(b.t);
    if (a.text && b.text && (Math.abs(a.top - b.top) >= 3 || Math.abs(a.h - b.h) >= 3)) dich.push(b.t);
  }
  const cuaSo = (ds) => { let mx = 0; for (let i = 0; i < ds.length; i++) { let n = 0; for (let j = i; j < ds.length && ds[j] - ds[i] < NG.balJitterWin; j++) n++; if (n > mx) mx = n; } return mx; };
  out.doi = thayDoi.length; out.viet = viet.length; out.fsDoi = fsd.length; out.dich = dich.length;
  out.doiMax = cuaSo(thayDoi); out.vietMax = cuaSo(viet); out.fsMax = cuaSo(fsd); out.dichMax = cuaSo(dich);
  const t0 = seg.t0;
  const of = (t) => Math.round(t - t0);
  // moc: chuoi trang thai duy tri
  const giu = (pred, ms) => {
    const r = []; let i = 0;
    while (i < ev.length) {
      if (!pred(ev[i])) { i++; continue; }
      let j = i; let dur = thoi(i);
      while (j + 1 < ev.length && pred(ev[j + 1])) { j++; dur += thoi(j); }
      if (dur >= ms) r.push({ i0: i, i1: j, ms: Math.round(dur), t: ev[i].t, e: ev[i] });
      i = j + 1;
    }
    return r;
  };
  out.giua = giu((e) => (e.ell || e.ellDau) && e.giua, NG.balMidMs);
  out.cat = giu((e) => e.ell || e.cssEll || e.clamp, NG.balTruncMs);
  // sap dat: chu dang dai (>= 30 ky tu, khong ket thuc bang dau cau) tut ve <= 40 % ma khong phai la cau moi
  out.suy = [];
  for (let i = 1; i < ev.length; i++) {
    const a = ev[i - 1], b = ev[i];
    if (a.lenCore >= 30 && b.lenCore > 0 && b.lenCore <= 0.4 * a.lenCore && !/[.!?。！？]$/.test(a.text) && thoi(i) >= 400) out.suy.push({ off: b.t, ms: Math.round(thoi(i)), tu: a.text, den: b.text, e: b });
  }
  // tre: tu manh dau tien phat toi luc dong loi co chu dau tien
  const f0 = (seg.feeds && seg.feeds[0]) || null;
  out.tre = null;
  if (f0 && f0.tBatDau) { const e1 = ev.find((e) => e.text && e.t >= f0.tBatDau); out.tre = e1 ? Math.round(e1.t - f0.tBatDau) : Math.round(cuoi - f0.tBatDau); }
  // dong o dau bi cat tron ven (bo cuc kieu 'cuon len': dong cu troi khoi hop) la chu y; chi bao khi con lai nua dong bi cat (nhin thay noa dong)
  const noaDong = (e) => { if (e.side !== 't' || !e.lh) return true; const m = e.cut % e.lh; return m > 0.15 * e.lh && m < 0.85 * e.lh; };
  out.tran = giu((e) => e.text && !e.clamp && ((e.cut > NG.balCutPx && noaDong(e)) || e.ovf > Math.max(2, 0.12 * e.fs) && e.cut <= NG.balCutPx && e.side !== 't'), NG.balCutMs);   // ovf: scrollH/W - clientH/W; chu to tran vai px chi la net chu vuot line-box
  out.of = of;
  return out;
}

/** Mau -> chuyen canh: do tre den noi dung co nghia dau tien, so phan tu dong thoi, khung trong */
export function phanTichChuyen(seg) {
  const rows = seg.rows.slice().sort((a, b) => a.t - b.t);
  const co = rows.filter((r) => r.lop && r.cover != null);
  const out = { maxMovers: 0, maxMoversT: 0, dauMs: null, blank: [], settled: 0 };
  if (!co.length) return out;
  const cuoi = co.slice(-Math.min(5, co.length));
  const sc = cuoi.map((r) => r.cover).sort((a, b) => a - b)[Math.floor(cuoi.length / 2)];
  out.settled = sc;
  co.forEach((r) => { if ((r.movers || 0) > out.maxMovers) { out.maxMovers = r.movers; out.maxMoversT = Math.round(r.t - seg.t0); } });
  // do tre den noi dung dau tien: >= 3 nut chu nhin thay (op >= .25) va phu >= 50 % muc on dinh
  const cu = seg.oldSet || null;
  const moi = (r) => (cu ? (r.sig || []).filter((h) => !cu.has(h)).length : (r.nHien || 0));
  const dau = co.find((r) => moi(r) >= 3 && (seg.tChuyen == null || r.t >= seg.tChuyen));
  if (dau) out.dauMs = Math.round(dau.t - (seg.tChuyen != null ? seg.tChuyen : seg.t0));
  // khung trong: phu < 40 % (tuyet doi) VA < 40 % muc on dinh (neu on dinh cung thap thi khong phai chop trong)
  if (sc >= 0.1) {
    const nguong = Math.min(NG.blankAbs, NG.blankRatio * Math.max(sc, 0.0001) + 0) ;
    let run = null;
    let daCoLop = false;
    for (const r of rows) {
      if (r.lop) daCoLop = true;
      if (!daCoLop) continue;   // truoc khi lop che do xuat hien lan dau (dau bai giang) khong tinh
      const blank = r.lop ? (r.cover < NG.blankRatio * sc && r.cover < NG.blankAbs) : true;   // lop vang = trang chi co nen dao dien
      if (blank && (seg.tChuyen == null || r.t >= seg.tChuyen - 200)) { if (!run) run = { t0: r.t, t1: r.t, min: r.cover != null ? r.cover : 0, lopVang: !r.lop }; else { run.t1 = r.t; if (r.cover != null) run.min = Math.min(run.min, r.cover); if (!r.lop) run.lopVang = true; } }
      else if (run) { out.blank.push(run); run = null; }
    }
    if (run) out.blank.push(run);
    out.blank.forEach((b) => { b.ms = Math.round(b.t1 - b.t0 + 100); b.off = Math.round(b.t0 - seg.t0); });
    void nguong;
  }
  return out;
}
