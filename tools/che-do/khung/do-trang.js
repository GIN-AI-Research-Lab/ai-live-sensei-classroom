(() => {
  const lop = document.querySelector('.cd-lop'); if (!lop) return { loi: 'khong co lop', van: [{ loai: 'khong-lop' }] };
  const L = lop.getBoundingClientRect();
  const cd = __motion.cheDo(); const meo = cd && cd.meo ? { x: L.left + cd.meo.x, y: L.top + cd.meo.y + 36, w: cd.meo.w, h: Math.max(0, cd.meo.h - 36) } : null;
  const vai = (e) => { const c = [...e.classList].find((x) => /^h-r-/.test(x)) || (e.closest && e.closest('[class*="h-r-"]') && [...e.closest('[class*="h-r-"]').classList].find((x) => /^h-r-/.test(x))); return c ? c.slice(4) : ''; };
  const hien = (e) => { let op = 1, v = e; while (v && v !== lop) { const cs = getComputedStyle(v); op *= +cs.opacity; if (cs.visibility === 'hidden' || cs.display === 'none') return 0; v = v.parentElement; } return op; };
  const ds = []; const van = []; const co = {};
  const w = document.createTreeWalker(lop, NodeFilter.SHOW_TEXT);
  let n; while ((n = w.nextNode())) {
    const t = (n.nodeValue || '').trim(); if (!t) continue;
    const e = n.parentElement; if (!e || e.closest('.h-mesur, .h-am-nut, rt, .h-rt, .h-rem')) continue;
    if (hien(e) < 0.3) continue;
    const r = document.createRange(); r.selectNodeContents(n); const b = r.getBoundingClientRect(); if (b.width < 2 || b.height < 2) continue;
    const fs = parseFloat(getComputedStyle(e).fontSize); const vv = vai(e); if (vv) co[vv] = Math.max(co[vv] || 0, fs);
    const ink = { l: b.left, r: b.right, t: b.top + 0.2 * fs, b: b.bottom - 0.08 * fs };
    let bi = 0;
    if (ink.l < L.left - 2 || ink.r > L.right + 2 || ink.t < L.top - 2 || ink.b > L.bottom + 2) bi = 1;
    let a = e; while (a && a !== lop && !bi) { const cs = getComputedStyle(a); if (a !== e && /(hidden|clip|auto|scroll)/.test(cs.overflow + cs.overflowX + cs.overflowY)) { const ar = a.getBoundingClientRect(); if (ink.l < ar.left - 2 || ink.r > ar.right + 2 || ink.t < ar.top - 2 || ink.b > ar.bottom + 2) { bi = 1; break; } } a = a.parentElement; }
    if (bi) van.push({ vai: vv, loai: 'cat', t: t.slice(0, 24) });
    if (meo) { const ox = Math.min(ink.r, meo.x + meo.w) - Math.max(ink.l, meo.x), oy = Math.min(ink.b, meo.y + meo.h) - Math.max(ink.t, meo.y); if (ox > 4 && oy > 4) van.push({ vai: vv, loai: 'meo', t: t.slice(0, 24) }); }
    if (fs < (innerWidth < 640 ? 13 : 14) * 0.7 && !/^(h-nhan|h-dai)/.test(e.className)) van.push({ vai: vv, loai: 'nho', t: t.slice(0, 20), fs: +fs.toFixed(1) });
    ds.push({ ink, vv, t: t.slice(0, 24), cha: e.parentElement, ph: e.closest('.h-hang, .h-gn, .h-noi, .h-giay, .h-dan, .h-ruy, .h-khoi, .h-cau-bai') });
  }
  for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++) {
    const p = ds[i], q = ds[j]; if (p.ph && p.ph === q.ph) continue; if (p.cha && q.cha && (p.cha.contains(q.cha) || q.cha.contains(p.cha))) continue;
    const ox = Math.min(p.ink.r, q.ink.r) - Math.max(p.ink.l, q.ink.l), oy = Math.min(p.ink.b, q.ink.b) - Math.max(p.ink.t, q.ink.t);
    if (ox > 2 && oy > 2) { const s = Math.min((p.ink.r - p.ink.l) * (p.ink.b - p.ink.t), (q.ink.r - q.ink.l) * (q.ink.b - q.ink.t)); if (ox * oy > 0.2 * s) van.push({ vai: p.vv || q.vv, loai: 'de', t: p.t + ' / ' + q.t }); }
  }
  // ---- khoang trong: phan tu noi dung (tam giay, nhan, vom, hoa, ...) nhin thay; luoi 24x16
  const COLS = 24, ROWS = 16;
  const cell = new Uint8Array(COLS * ROWS);
  const mark = (b) => { const x0 = Math.max(0, Math.floor((b.left - L.left) / L.width * COLS)), x1 = Math.min(COLS - 1, Math.floor((b.right - L.left - 1) / L.width * COLS));
    const y0 = Math.max(0, Math.floor((b.top - L.top) / L.height * ROWS)), y1 = Math.min(ROWS - 1, Math.floor((b.bottom - L.top - 1) / L.height * ROWS));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) cell[y * COLS + x] = 1; };
  lop.querySelectorAll('.h-canh *').forEach((e) => {
    if (!e.matches('.h-giay, .h-treo, .h-gap, .h-dan, .h-bang, .h-vom, .h-hoa, .h-ruy-wrap, .h-khoi, .h-o, .h-lc, .h-slot, .h-tt, .h-matane, .h-mini, .h-khe, .h-tcard, .h-chipv, .h-cau-hoi')) return;
    if (e.closest('.h-hang') && !e.matches('.h-khe')) return;
    if (hien(e) < 0.3) return;
    const b = e.getBoundingClientRect(); if (b.width < 8 || b.height < 8) return;
    mark(b);
  });
  if (cd && cd.meo) mark({ left: L.left + cd.meo.x, right: L.right, top: L.top + cd.meo.y, bottom: L.bottom });
  const tab = lop.querySelector('.h-the-bai'); if (tab) mark(tab.getBoundingClientRect());
  let vazio = 0; for (let i = 0; i < cell.length; i++) if (!cell[i]) vazio++;
  // hinh chu nhat trong lien tuc lon nhat (histogram)
  let best = 0; const hgt = new Array(COLS).fill(0);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) hgt[x] = cell[y * COLS + x] ? 0 : hgt[x] + 1;
    for (let x = 0; x < COLS; x++) { let mn = 1e9; for (let z = x; z < COLS; z++) { mn = Math.min(mn, hgt[z]); if (!mn) break; best = Math.max(best, mn * (z - x + 1)); } }
  }
  return { van, co, trong: +(vazio * 100 / cell.length).toFixed(1), hinhTrong: +(best * 100 / cell.length).toFixed(1) };
})()
