/* s-tinh.js - giao dien TINH (chua giang) che do S "Bang den lop hoc".
   1) Lop NEN: dung lai y het nen cua san khau (js/che-do/s.js dungLopHoc: tuong, cua so + hoa anh dao, bang go + mat bang, khay phan, ban hoc)
      cung tinh toan khung (doKhung: --s-u, B, f, mg, dc) va cung DOM / lop CSS. Lop nam trong shadow root (host .s-tinh-host) nap CHINH
      css/che-do/s.css -> hinh giong het san khau, doi s.css la nen doi theo; ngoai shadow khong co .cd-lop nao (cong cu do san khau
      document.querySelector('.cd-lop') khong thay lop nay).
   2) Dat #slideContent len mat bang: tinh vung noi dung (toa do trong .deck-stage) -> bien --st-x/y/w/h tren .deck-stage + [data-s-tinh];
      css/che-do/s-tinh.css doc cac bien do.
   3) Co gian: thu cot x co chu (--st-k) cho tung chuong de vua mat bang, khong cuon khi du cho; khong du thi cuon TRONG bang.
   Chi hoat dong khi <html data-che-do="s">; doi che do / mat thuoc tinh -> go sach (DOM, observer, listener, timer, rAF). Khong bao gio nem loi.
   v3: chay lai an toan (idempotent, che-do.js nap lai tep khi S loi); co gian dong bo truoc khung hinh dau (het giang / doi lop phu),
   mat do 0-3 + vung noi rong them, bo nho dem cau hinh, mep mo chi khi that su con noi dung.
   v4: lop nen GIU NGUYEN luc giang (nam duoi san khau dac, chi dung canh hoa) -> bam "Bat dau giang" khong con khung hinh trang;
   man thap nam ngang (san khau that khong ve bang) -> khong ve bang, luoi mac dinh y nhu luc giang; giu vi tri cuon (mo neo) khi the roi / bang phan
   doi vung noi dung; chon cau hinh cuon it man hinh nhat tren may tinh; o khuyet sat meo (luoi tu vung / chu Han tran vung khi bang phan mo);
   hang cuoi le can giua; canh hoa dung keyframes cu the; luoi an toi khi lop nen san sang (an toan 1,5 s trong CSS). */
(function () {
  'use strict';
  // idempotent: che-do.js nap lai tep nay moi lan thu lai che do S (tep S loi roi nap lai) -> chi chay ban dau tien
  const NSC = (window.SenseiCheDoTinh = window.SenseiCheDoTinh || {});
  if (NSC.s) return;
  NSC.s = { dangGan: () => false };   // danh dau som: ban nap sau khong chay du khi ban dau gap loi
  const KHOA = 's';
  const NS = 'http://www.w3.org/2000/svg';
  const de = document.documentElement;
  let M = null;           // phien dang gan (null = khong gan)
  let cho = null;         // timer cho DOM / s.css chua san sang
  let thu = 0;            // so lan da thu gan (gioi han de khong hoi vo han khi s.js loi)
  let obsAttr = null;     // quan sat <html data-che-do>

  // ------------------------------------------------------------------ tien ich (giong s.js)
  const R = (x, y, w, h) => ({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
  const mk = (tag, cls, cha, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (cha) cha.appendChild(e); return e; };
  function dat(e, r) {
    if (r.x != null) e.style.left = Math.round(r.x) + 'px';
    if (r.y != null) e.style.top = Math.round(r.y) + 'px';
    if (r.w != null) e.style.width = Math.round(r.w) + 'px';
    if (r.h != null) e.style.height = Math.round(r.h) + 'px';
    return e;
  }
  function rand(seed) { let a = (seed * 2654435761) >>> 0 || 1; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const giamChuyenDong = () => { try { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } };

  // ------------------------------------------------------------------ meo (giong cdMeo cua motion.js, do tren lop nay)
  function doMeo(host) {
    try {
      if (!document.body.classList.contains('co-meo')) return null;
      const cs = getComputedStyle(de);
      const sr = parseFloat(cs.getPropertyValue('--sensei-rong')) || 0, sc = parseFloat(cs.getPropertyValue('--sensei-cao')) || 0;
      if (!sr || !sc) return null;
      const r = host.getBoundingClientRect();
      const bot = document.querySelector('.deck-bottom');
      const bt = bot ? bot.getBoundingClientRect().top : innerHeight;
      const x = Math.max(0, innerWidth - sr - r.left), y = Math.max(0, bt - sc - 36 - r.top);
      return { x, y, w: Math.max(0, r.width - x), h: Math.max(0, r.height - y) };
    } catch (e) { return null; }
  }

  // ------------------------------------------------------------------ hinh hoc (giong doKhung cua s.js)
  function hinhHoc(W, H, meo) {
    const dt = W < 640 || W / H < 1.05;
    const ngan = W > H * 1.2 && H < 430;
    let u, f, B, mg, dc;
    if (dt) {
      u = Math.max(0.58, Math.min(W / 390, H / 679));
      f = Math.round(6 * u);
      const o = Math.round(4 * u);
      const meoTop = meo && meo.w ? meo.y + 36 : H - Math.round(64 * u);
      const bx = o + f, by = o + f;
      const bb = Math.min(H - Math.round(30 * u), meoTop - Math.round(16 * u));
      B = R(bx, by, W - 2 * bx, bb - by);
      mg = Math.round(14 * u); dc = 0;
    } else {
      u = Math.max(0.6, Math.min(H / 776, W / 1440));
      f = Math.round(15 * u);
      const ox = Math.round(20 * u), oy = Math.round(14 * u);
      const cot = meo && meo.w ? Math.max(meo.w + Math.round(24 * u), Math.round(250 * u)) : Math.round(250 * u);
      const bx = ox + f, by = (ngan ? Math.round(6 * u) : oy) + f;
      const br = W - cot - f;
      // man thap nam ngang: san khau that khong ve bang (de the mac dinh); o day giu bang, bot le tren / duoi de noi dung con cho
      const bb = H - Math.round((ngan ? 50 : 92) * u);
      B = R(bx, by, br - bx, bb - by);
      mg = Math.round((ngan ? 16 : 22) * u); dc = Math.round(48 * u);
    }
    return { W, H, dt, ngan, u: dt ? u : u, B, f, mg, dc, meo };
  }
  const khoaHinh = (g) => [g.W, g.H, g.dt ? 1 : 0, g.meo ? Math.round(g.meo.x) + ',' + Math.round(g.meo.y) : '-', giamChuyenDong() ? 1 : 0].join('x');

  // ------------------------------------------------------------------ canh ngoai cua so (giong canhNgoai cua s.js)
  function canhNgoai() {
    const r = rand(4242);
    let s = '<svg xmlns="' + NS + '" viewBox="0 0 244 636" preserveAspectRatio="xMidYMid slice">';
    s += '<g fill="#ffffff" opacity=".85"><ellipse cx="60" cy="90" rx="48" ry="16"/><ellipse cx="90" cy="80" rx="34" ry="18"/><ellipse cx="190" cy="300" rx="44" ry="13"/><ellipse cx="214" cy="292" rx="26" ry="14"/></g>';
    s += '<rect x="0" y="470" width="244" height="166" fill="#cfe0c2"/><rect x="20" y="420" width="120" height="70" fill="#e9e1d2"/><rect x="20" y="414" width="120" height="8" fill="#c9bba4"/>';
    for (let i = 0; i < 5; i++) s += '<rect x="' + (28 + i * 22) + '" y="436" width="14" height="14" fill="#a8c4d6"/><rect x="' + (28 + i * 22) + '" y="462" width="14" height="14" fill="#a8c4d6"/>';
    s += '<rect x="0" y="560" width="244" height="76" fill="#b7d0a4"/>';
    s += '<g stroke="#6e4a37" stroke-linecap="round" fill="none"><path d="M232,636 C220,520 236,430 214,330" stroke-width="22"/><path d="M218,360 C170,320 110,300 40,250" stroke-width="10"/><path d="M222,300 C190,230 150,180 70,140" stroke-width="8"/><path d="M150,190 C120,170 100,120 110,60" stroke-width="5"/><path d="M120,296 C90,320 60,330 10,330" stroke-width="5"/><path d="M214,330 C230,250 244,200 244,120" stroke-width="9"/></g>';
    const cum = [[40, 250, 46], [90, 280, 40], [140, 300, 36], [70, 140, 44], [120, 165, 40], [175, 205, 36], [110, 62, 34], [20, 330, 34], [70, 322, 30], [236, 130, 40], [228, 200, 34], [180, 330, 34], [150, 110, 28], [30, 196, 30]];
    const mau = ['#f9c9d6', '#f5b3c6', '#fbdbe3', '#f2a3ba', '#fde9ee'];
    cum.forEach((c0) => { for (let k = 0; k < 14; k++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * c0[2]; s += '<circle cx="' + (c0[0] + Math.cos(a) * d).toFixed(1) + '" cy="' + (c0[1] + Math.sin(a) * d * 0.8).toFixed(1) + '" r="' + (5 + r() * 9).toFixed(1) + '" fill="' + mau[Math.floor(r() * mau.length)] + '"/>'; } });
    return s + '</svg>';
  }
  function ngayDoc() {
    const d = new Date(), th = '日月火水木金土'[d.getDay()];
    return '<span class="tcy">' + (d.getMonth() + 1) + '</span>月<span class="tcy">' + d.getDate() + '</span>日(' + th + ')';
  }

  // ------------------------------------------------------------------ dung lop hoc (giong dungLopHoc cua s.js, bo phan chi dung luc viet: s-do, s-vet, s-bui, s-que, s-tay)
  let kfTam = '';   // keyframes canh hoa cua lan dung lop gan nhat (gan() / capNhat() ghi vao <style> trong shadow)
  function dungLop(L, g) {
    L.textContent = '';
    kfTam = '';
    const { W, H, u, B, f, meo, dt, dc, mg } = g;
    mk('div', 's-tuong', L);
    const kx = B.x - f, ky = B.y - f, kw = B.w + 2 * f, kh = B.h + 2 * f;
    if (!dt) {
      const xc = kx + kw + Math.round(26 * u), wc = W - xc - Math.round(20 * u);
      const yTop = Math.round(22 * u), yBot = Math.round((meo && meo.w ? meo.y + 36 : H * 0.7) - 14 * u);
      if (wc > 60 * u && yBot - yTop > 140 * u) {
        dat(mk('div', 's-thanh-rem', L), { x: xc - 10 * u, y: yTop - 10 * u, w: wc + 20 * u, h: 8 * u });
        const cua = dat(mk('div', 's-cua', L), { x: xc, y: yTop, w: wc, h: yBot - yTop });
        const pad = Math.round(10 * u);
        const kinh = dat(mk('div', 's-kinh', cua), { x: pad, y: pad, w: wc - 2 * pad, h: yBot - yTop - 2 * pad });
        kinh.innerHTML = canhNgoai();
        const hoa = mk('div', '', kinh);
        hoa.style.cssText = 'position:absolute;inset:0';
        mk('div', 's-chieu', kinh);
        dat(mk('div', 's-song-doc', cua), { x: wc / 2 - 4 * u, y: 6 * u, w: 8 * u, h: yBot - yTop - 12 * u });
        dat(mk('div', 's-song-ngang', cua), { x: 6 * u, y: (yBot - yTop) * 0.33, w: wc - 12 * u, h: 8 * u });
        dat(mk('div', 's-bau', L), { x: xc - 10 * u, y: yBot - 4 * u, w: wc + 20 * u, h: 14 * u });
        const rem = dat(mk('div', 's-rem', L), { x: W - Math.round(52 * u), y: yTop - 4 * u, w: Math.round(46 * u), h: yBot - yTop + 8 * u });
        dat(mk('i', '', rem), { y: (yBot - yTop) * 0.56 });
        // canh hoa bay: giong san khau (6 canh, cung hat giong, cung quy dao), chi transform. Keyframes CU THE tung canh (khong var() trong
        // keyframes: var() lam trinh duyet tinh lai style moi khung hinh ~55 lan / giay)
        if (!giamChuyenDong()) {
          const wk = wc - 2 * pad, hk = yBot - yTop - 2 * pad;
          for (let i = 0; i < 6; i++) {
            const p = mk('div', 's-canh-hoa', hoa), r = rand(i * 31 + 5);
            const x0 = r() * wk, dur = 7 + r() * 5;
            const y0 = -20 * u, r0 = r() * 360;
            const x1 = x0 - 30 * u - r() * 40 * u, y1 = hk + 20 * u, r1 = r0 + 200 + r() * 200;
            const dl = -r() * dur;
            kfTam += '@keyframes st-roi' + i + '{from{transform:translate(' + x0.toFixed(1) + 'px,' + y0.toFixed(1) + 'px) rotate(' + r0.toFixed(1) + 'deg)}to{transform:translate(' + x1.toFixed(1) + 'px,' + y1.toFixed(1) + 'px) rotate(' + r1.toFixed(1) + 'deg)}}';
            p.style.cssText = 'animation-name:st-roi' + i + ';animation-duration:' + dur.toFixed(2) + 's;animation-delay:' + dl.toFixed(2) + 's';
          }
        }
      }
    }
    dat(mk('div', 's-khung', L), { x: kx, y: ky, w: kw, h: kh });
    const bang = dat(mk('div', 's-bang', L), B);
    mk('div', 's-nang', bang);
    if (dc) {
      const dau = dat(mk('div', 's-dau', bang), { x: B.w - dc, y: 0, w: dc, h: B.h });
      const fd = Math.max(14, Math.round(24 * u));
      const a = mk('div', 's-doc', dau, ngayDoc()); a.style.fontSize = fd + 'px'; dat(a, { x: (dc - fd) / 2 - 2, y: mg });
      const b = mk('div', 's-doc', dau, '日直'); b.style.fontSize = fd + 'px'; dat(b, { x: (dc - fd) / 2 - 2, y: B.h - mg - fd * 4.4 });
      const c2 = mk('div', 's-doc c-vang', dau, 'ねこ'); c2.style.fontSize = fd + 'px'; dat(c2, { x: (dc - fd) / 2 - 2, y: B.h - mg - fd * 2.1 });
      dau.setAttribute('aria-hidden', 'true');
    }
    const ty = B.y + B.h + f - Math.round(5 * u), th = Math.round((dt ? 12 : 20) * u);
    const khay = dat(mk('div', 's-khay', L), { x: kx - 6 * u, y: ty, w: kw + 12 * u, h: th });
    mk('div', 's-bui-khay', khay);
    [['#fbfaf4', 0.1, 0.045], ['#f7d76a', 0.15, 0.036], ['#f79cb8', 0.2, 0.04], ['#95d0f4', 0.72, 0.032], ['#fbfaf4', 0.77, 0.022]].forEach((p) => {
      const v = dat(mk('div', 's-vien-phan', khay), { x: (kw + 12 * u) * p[1], y: -th * 0.35, w: Math.max(14, (kw + 12 * u) * p[2]), h: th * 0.62 });
      v.style.background = 'linear-gradient(180deg,#fff,' + p[0] + ' 45%,' + p[0] + ')';
    });
    dat(mk('div', 's-tay-khay', khay), { x: (kw + 12 * u) * 0.86, y: -th * 0.9, w: Math.max(40, (kw + 12 * u) * 0.08), h: th * 1.2 });
    const yb = ty + th + Math.round((dt ? 6 : 14) * u);
    if (H - yb > 12) {
      dat(mk('div', 's-ban', L), { x: -20 * u, y: yb, w: W * 0.52, h: H - yb + 20 });
      dat(mk('div', 's-ban', L), { x: W * 0.55, y: yb + 4 * u, w: W * 0.5, h: H - yb + 20 });
      const bc = dat(mk('div', 's-but-chi', L), { x: W * 0.16, y: yb + Math.min(20 * u, (H - yb) * 0.4), w: Math.round(150 * u), h: Math.max(6, Math.round(9 * u)) });
      bc.style.transform = 'rotate(-6deg)';
      if (!dt) { const vo = dat(mk('div', 's-vo', L), { x: W * 0.36, y: yb + 10 * u, w: Math.round(150 * u), h: Math.round(56 * u) }); vo.style.transform = 'rotate(4deg)'; }
      else { const vo = dat(mk('div', 's-vo', L), { x: W * 0.4, y: yb + 6 * u, w: Math.round(90 * u), h: Math.round(40 * u) }); vo.style.transform = 'rotate(4deg)'; }
    }
  }

  // CSS trong shadow: chi khung chua lop + canh hoa bay (moi quy tac cua nen nam trong s.css)
  const CSS_SHADOW = [
    ':host{display:block}',
    '.lop{position:absolute;inset:0;overflow:hidden;overflow:clip;contain:layout paint;pointer-events:none;isolation:isolate;visibility:hidden}',
    '.lop.san{visibility:inherit}',
    '.s-canh-hoa{display:var(--st-pd,block);transform-origin:50% 50%;will-change:transform;animation-timing-function:linear;animation-iteration-count:infinite;animation-play-state:var(--st-play,running)}',
    '@media (prefers-reduced-motion:reduce){.s-canh-hoa{display:none}}',
  ].join('');

  // ------------------------------------------------------------------ gan / go
  function link_s_css() {
    const l = document.querySelector('link[data-che-do-css="s"]');
    return l && l.href ? l.href : null;
  }
  /** che do S da dang ky that (s.js nap xong)? Khong thi khong ve nen: luoi mac dinh, y nhu san khau se roi ve mac dinh */
  function sDaDangKy() {
    try { return !!(window.SenseiCheDo && typeof window.SenseiCheDo.def === 'function' && window.SenseiCheDo.def(KHOA)); } catch (e) { return false; }
  }
  function gan() {
    if (M) return true;
    const stage = document.querySelector('main.deck-stage');
    if (!stage || !document.body) return false;
    const href = link_s_css();
    if (!href || !sDaDangKy()) return false;
    const host = document.createElement('div');
    host.className = 's-tinh-host';
    host.setAttribute('aria-hidden', 'true');
    const sr = host.attachShadow({ mode: 'open' });
    const st = document.createElement('style');
    st.textContent = CSS_SHADOW;
    const lk = document.createElement('link');
    lk.rel = 'stylesheet';
    lk.href = href;
    const L = document.createElement('div');
    L.className = 'cd-lop lop';
    L.dataset.cheDo = KHOA;
    const kf = document.createElement('style');
    sr.appendChild(st); sr.appendChild(kf); sr.appendChild(lk); sr.appendChild(L);
    stage.insertBefore(host, stage.firstChild);
    thu = 0;
    M = { host, sr, L, lk, kf, stage, g: null, khoa: '', kv: '', rAF: 0, ro: null, mo1: null, mo2: null, onVis: null, sanSang: false, dung: false, thoi: [] };
    const onLoad = () => { if (M && M.lk === lk) { M.sanSang = true; capNhat(true); } };
    lk.addEventListener('load', onLoad);
    M.thoi.push(() => lk.removeEventListener('load', onLoad));
    // quan sat doi kich thuoc / meo / the roi + bang phan
    try { if (window.ResizeObserver) { M.ro = new ResizeObserver(lich); M.ro.observe(host); } } catch (e) {}
    try { M.mo1 = new MutationObserver(onBody); M.mo1.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] }); } catch (e) {}
    try { M.mo2 = new MutationObserver(lich); M.mo2.observe(de, { attributes: true, attributeFilter: ['style'] }); } catch (e) {}
    addEventListener('resize', lich);
    M.thoi.push(() => removeEventListener('resize', lich));
    // tab an: dung canh hoa; dang giang: CSS dat --st-play: paused (va an lop)
    M.onVis = () => { try { if (document.hidden) host.setAttribute('data-tam', '1'); else host.removeAttribute('data-tam'); } catch (e) {} };
    document.addEventListener('visibilitychange', M.onVis);
    M.onVis();
    batCoGian();
    return true;
  }
  /** class / style cua body doi: het giang -> dung lai nen + co gian NGAY (microtask, truoc khung hinh dau cua deck), khong thi gop theo rAF */
  function onBody() {
    if (!M) return;
    if (M.bo && !document.body.classList.contains('dang-giang')) { if (M.rAF) { try { cancelAnimationFrame(M.rAF); } catch (e) {} M.rAF = 0; } capNhat(false); return; }
    lich();
  }
  function lich() {
    if (!M || M.rAF) return;
    M.rAF = requestAnimationFrame(() => { if (!M) return; M.rAF = 0; capNhat(false); });
  }
  function capNhat(ep) {
    if (!M) return;
    try {
      if (document.body.classList.contains('dang-giang')) { M.bo = true; return; }   // luc giang: lop an, khong dung lai (meo doi co lien tuc); het giang -> do lai + co gian lai
      const host = M.host;
      const W = host.clientWidth, H = host.clientHeight;
      if (!W || !H || !M.sanSang) return;
      const meo = doMeo(host);
      const g = hinhHoc(W, H, meo);
      // man thap nam ngang: san khau that khong ve bang -> luoi mac dinh y nhu luc giang (khong lop nen, khong --st-*)
      if (g.ngan) { M.bo = false; if (!M.ngan) datNgan(g); return; }
      if (M.ngan) { M.ngan = false; M.host.removeAttribute('data-ngan'); M.dung = false; M.khoa = ''; M.kv = ''; }
      const k = khoaHinh(g);
      let doi = !!M.bo;
      M.bo = false;
      if (ep || k !== M.khoa || !M.dung) {
        M.khoa = k; M.g = g;
        M.L.style.setProperty('--s-u', g.u.toFixed(4) + 'px');
        if (g.dt) M.L.dataset.hep = '1'; else delete M.L.dataset.hep;
        dungLop(M.L, g);
        M.kf.textContent = kfTam;
        M.L.classList.add('san');
        M.dung = true;
        doi = true;
      }
      if (datVung(M.g) || doi) {
        // dong bo (chay trong rAF / microtask, truoc khi ve -> khong co khung hinh bo cuc cu); keo cua so lien tuc (>= 3 lan / 300 ms) thi gop 70 ms
        const bay = performance.now();
        M.lt = bay - (M.tl || 0) < 300 ? (M.lt || 0) + 1 : 0; M.tl = bay;
        lichFit(M.lt < 2);
      }
    } catch (e) { try { console.warn('[s-tinh]', e); } catch (x) {} }
  }

  /** Man thap nam ngang: bo lop nen + moi bien --st-* / thuoc tinh co gian -> luoi mac dinh. data-s-nhan = "da quyet dinh" (CSS khong an luoi cho lop nen) */
  function datNgan(g) {
    const s = M.stage;
    M.ngan = true; M.g = g; M.khoa = ''; M.kv = ''; M.dung = false;
    try { M.L.classList.remove('san'); M.L.textContent = ''; M.kf.textContent = ''; } catch (e) {}
    M.host.setAttribute('data-ngan', '1');
    giaiCoGian();
    ['--st-x', '--st-y', '--st-w', '--st-h', '--st-u', '--st-e'].forEach((p) => s.style.removeProperty(p));
    delete s.dataset.sTinh; delete s.dataset.sNgan; delete s.dataset.sNho; s.removeAttribute('data-s-tight');
    if (!s.getAttribute('style')) s.removeAttribute('style');
    s.dataset.sNhan = '1';
  }

  /** Cac lop phu dang chiem mep (the roi trai, bang phan phai): toa do trong .deck-stage */
  function lopPhu(stageR, g) {
    const ds = [];
    try {
      const b = document.body.classList;
      const them = (e) => { if (!e) return; const r = e.getBoundingClientRect(); if (r.width > 8 && r.height > 8) ds.push({ x: r.left - stageR.left, y: r.top - stageR.top, w: r.width, h: r.height }); };
      if (b.contains('co-the-trai')) them(document.querySelector('.spotlight:not(.hidden) .spot-dock'));
      if (b.contains('co-bang')) them(document.getElementById('bangPhan'));
      // bang phan mo (>= 1280, khong co the roi): meo dung nghi ngay TRAI bang (css/styles.css muc 19: lan meo = 350px + --sensei-rong tu mep phai)
      if (b.contains('co-meo') && b.contains('co-bang') && !b.contains('co-the-trai') && innerWidth >= 1280) {
        const cs = getComputedStyle(de);
        const sr = parseFloat(cs.getPropertyValue('--sensei-rong')) || 0, sc = parseFloat(cs.getPropertyValue('--sensei-cao')) || 0;
        const bot = document.querySelector('.deck-bottom');
        const bt = bot ? bot.getBoundingClientRect().top : innerHeight;
        // chi chua phan meo that su ve (hop meo thua ~8 px tren dinh dau)
        if (sr && sc) ds.push({ x: innerWidth - 350 - sr - stageR.left, y: bt - sc + 8 - stageR.top, w: sr, h: sc - 8, meo: true });
      }
      // meo o goc duoi (dien thoai nho): neu hop meo (phan that su ve, tu +36 px) chen vao vung noi dung thi cat bo; man thuong khong chen -> khong doi gi
      if (g && g.meo && g.meo.w && !ds.some((q) => q.meo)) ds.push({ x: g.meo.x, y: g.meo.y + 36, w: g.meo.w, h: Math.max(0, g.meo.h - 36) });
    } catch (e) {}
    return ds;
  }
  /** Vung noi dung tren mat bang (toa do trong .deck-stage): cung le voi san khau (vung(): le mg, tru cot ngay truc nhat dc), tru lop phu.
   *  M.vung = { full: vung day du, cut: vung da cat bo lop phu (dang ap), cat: hop meo dung nghi canh bang phan neu no chen vao vung | null }.
   *  Tra true neu vung doi so voi lan truoc */
  function datVung(g) {
    const s = M.stage, B = g.B;
    let x = B.x + g.mg, y = B.y + g.mg, w = Math.max(0, B.w - 2 * g.mg - g.dc), h = Math.max(0, B.h - 2 * g.mg);
    const full = R(x, y, w, h);
    const sr = s.getBoundingClientRect();
    const gap = 12;
    let cat = null;
    lopPhu(sr, g).forEach((r) => {
      if (r.x >= x + w || r.x + r.w <= x || r.y >= y + h || r.y + r.h <= y) return;
      const c = [
        { x: Math.max(x, r.x + r.w + gap), y, w: x + w - Math.max(x, r.x + r.w + gap), h },            // bo ben trai
        { x, y, w: Math.min(x + w, r.x - gap) - x, h },                                              // bo ben phai
        { x, y: Math.max(y, r.y + r.h + gap), w, h: y + h - Math.max(y, r.y + r.h + gap) },            // bo tren
        { x, y, w, h: Math.min(y + h, r.y - gap) - y },                                              // bo duoi
      ].filter((q) => q.w > 120 && q.h > 80).sort((a, b) => b.w * b.h - a.w * a.h)[0];
      if (c) { x = c.x; y = c.y; w = c.w; h = c.h; }
      if (r.meo) cat = { x: r.x, y: r.y, w: r.w, h: r.h };
    });
    const cut = R(x, y, w, h);
    const kv = [cut.x, cut.y, cut.w, cut.h, g.dt ? 1 : 0, g.u.toFixed(3), cat ? Math.round(cat.x) + ':' + Math.round(cat.y) : 0].join(',');
    if (kv === M.kv && s.dataset.sTinh) return false;
    M.kv = kv;
    if (!E.neo) E.neo = chupNeo();    // mo neo cuon TRUOC khi vung doi (bo cuc cu con nguyen) -> fit() giu dung cho dang xem
    M.vung = { full, cut, cat };
    apVung(cut);
    // vung noi dung qua thap (dien thoai nho + the roi o day): bo dong tieu de de vung cuon du cho hien the dang mo
    if (g.dt && cut.h < 230) s.dataset.sNho = '1'; else delete s.dataset.sNho;
    s.style.setProperty('--st-u', g.u.toFixed(4));
    s.dataset.sTinh = g.dt ? 'dt' : 'may';
    delete s.dataset.sNhan;
    return true;
  }
  /** Ghi vung noi dung (--st-x/y/w/h) tren .deck-stage; M.rd = vung dang ap ('cut' | 'full') */
  function apVung(r) {
    const s = M.stage;
    s.style.setProperty('--st-x', r.x + 'px'); s.style.setProperty('--st-y', r.y + 'px');
    s.style.setProperty('--st-w', r.w + 'px'); s.style.setProperty('--st-h', r.h + 'px');
    M.rd = M.vung && r === M.vung.full ? 'full' : 'cut';
  }
  function go() {
    if (!M) return;
    const m = M; M = null;
    try { if (m.rAF) cancelAnimationFrame(m.rAF); } catch (e) {}
    try { if (m.ro) m.ro.disconnect(); } catch (e) {}
    try { if (m.mo1) m.mo1.disconnect(); } catch (e) {}
    try { if (m.mo2) m.mo2.disconnect(); } catch (e) {}
    try { document.removeEventListener('visibilitychange', m.onVis); } catch (e) {}
    try { giaiCoGian(); } catch (e) {}
    m.thoi.forEach((f) => { try { f(); } catch (e) {} });
    try { m.host.remove(); } catch (e) {}
    try {
      const s = m.stage;
      ['--st-x', '--st-y', '--st-w', '--st-h', '--st-u'].forEach((p) => s.style.removeProperty(p));
      delete s.dataset.sTinh; delete s.dataset.sNgan; delete s.dataset.sNhan; delete s.dataset.sNho; s.removeAttribute('data-s-tight'); s.style.removeProperty('--st-e');
      if (!s.getAttribute('style')) s.removeAttribute('style');
    } catch (e) {}
  }

  // ------------------------------------------------------------------ CO GIAN: vua mat bang (khong cuon khi du cho), khong du thi cuon TRONG bang
  const KMIN = 0.6;
  const KMAX = { vc: 1.3, kj: 1.3, gp: 1.45, kw: 1.25, rx: 1.6 };
  const E = { sc: null, mo: null, ro: null, hen: 0, hen2: 0, neo: null, cuon: null, onCuon: null, onFont: null, cfg: null, n: 0, ms: 0, kich: '', ev: 0, gay: 0, tg: 0, nho: new Map() };
  const loaiCuon = (l) => {
    const c = l.classList;
    return c.contains('vc-list') ? 'vc' : c.contains('kj-list') ? 'kj' : c.contains('gp-list') ? 'gp' : c.contains('kw-list') ? 'kw' : c.contains('qz-list') ? 'qz' : c.contains('rx-scroll') ? 'rx' : '';
  };
  const vua = (l) => { E.ev++; return l.scrollHeight <= l.clientHeight + 1 && l.scrollWidth <= l.clientWidth + 1; };
  /** Hieu ung vao the (cardIn: translate 6 px) lam scrollHeight phong len: dua cac animation dang chay ve cuoi luc do, xong tra lai */
  function dungHieuUng(sc) {
    let an = [];
    try { an = sc.getAnimations({ subtree: true }).filter((x) => x.playState === 'running' && x.effect && x.effect.getComputedTiming); } catch (e) { an = []; }
    const luu = an.map((x) => x.currentTime);
    an.forEach((x) => { try { x.pause(); x.currentTime = x.effect.getComputedTiming().endTime; } catch (e) {} });
    return () => an.forEach((x, i) => { try { x.currentTime = luu[i]; x.play(); } catch (e) {} });
  }
  /** Vi du ngu phap le (so vi du le, hai cot): vi du cuoi tran ca hang, khong de o trong ben canh */
  function danhDauLe(l, cols) {
    const ds = l.querySelectorAll(':scope > .gp-ex');
    ds.forEach((e) => e.removeAttribute('data-s-le'));
    if (cols === 2 && ds.length % 2 === 1) ds[ds.length - 1].setAttribute('data-s-le', '1');
  }
  function datCfg(sc, l, c) {
    sc.style.setProperty('--st-k', String(+c.k.toFixed(3)));
    l.dataset.d = String(c.d || 0);
    sc.dataset.sD = String(c.d || 0);
    l.dataset.sFit = c.vua === false ? '0' : '1';
    if (c.cols) {
      l.style.setProperty('--st-cols', String(c.cols));
      l.style.setProperty('--st-rows', String(c.rows || Math.max(1, Math.ceil(l.children.length / c.cols))));
    }
    // o khuyet (hop meo o goc duoi phai): the gia ::after chiem nc cot x nr hang cuoi, the that xep vong quanh
    if (c.nc) { l.dataset.sHk = '1'; l.style.setProperty('--st-n0c', String(c.cols - c.nc + 1)); l.style.setProperty('--st-n0r', String(c.rows - c.nr + 1)); }
    else if (l.dataset.sHk) { delete l.dataset.sHk; l.style.removeProperty('--st-n0c'); l.style.removeProperty('--st-n0r'); }
    l.dataset.cols = String(c.cols || 1);
    if (l.classList.contains('gp-list')) danhDauLe(l, c.cols || 1);
    canGiuaHangCuoi(l, c);
  }
  /** Luoi vua mat bang (tu vung / chu Han) co hang cuoi le: 2 x so cot, moi the chiem 2 vach, the dau hang cuoi lui vao -> hang cuoi CAN GIUA (khong o trong lech mot ben) */
  function canGiuaHangCuoi(l, c) {
    const lh = l.classList.contains('vc-list') || l.classList.contains('kj-list');
    if (!lh) return;
    const n = l.children.length, m = c.cols ? n % c.cols : 0;
    const cu = l.querySelector(':scope > [data-s-u1]');
    if (cu) cu.removeAttribute('data-s-u1');
    if (c.vua !== false && c.cols > 1 && m && !c.nc) {
      l.dataset.sU = '1';
      l.style.setProperty('--st-cols2', String(c.cols * 2));
      l.style.setProperty('--st-off', String(c.cols - m + 1));
      l.children[n - m].setAttribute('data-s-u1', '1');
    } else { delete l.dataset.sU; l.style.removeProperty('--st-cols2'); l.style.removeProperty('--st-off'); }
  }
  /** tu dai (> 8 ky tu) o mat do 3: chu nho hon de khong chiem 2-3 dong */
  function danhDauDai(l) {
    l.querySelectorAll('.vc-word').forEach((w) => {
      let n = 0;
      const tw = document.createTreeWalker(w, NodeFilter.SHOW_TEXT);
      let t;
      while ((t = tw.nextNode())) { if (!(t.parentElement && t.parentElement.closest('rt'))) n += t.nodeValue.trim().length; }
      if (n > 8) w.setAttribute('data-s-dai', '1'); else w.removeAttribute('data-s-dai');
    });
  }
  function timK(f, lo, hi) {
    if (!f(lo)) return 0;
    if (f(hi)) return hi;
    for (let i = 0; i < 4; i++) { const mid = (lo + hi) / 2; if (f(mid)) lo = mid; else hi = mid; }
    return lo;
  }
  // tu ngan bi ngat dong giua tu (vd tu 6 ky tu roi 1 ky tu rot xuong dong sau): cau hinh nhu vay xau -> loai (tu qua dai thi duoc xuong dong)
  function tuBiGay(l) {
    const t0 = performance.now(); E.gay++;
    try { return tuBiGay0(l); } finally { E.tg += performance.now() - t0; }
  }
  function tuBiGay0(l) {
    const ds = l.querySelectorAll('.vc-word');
    for (let i = 0; i < ds.length; i++) {
      const w = ds[i];
      let n = 0; const tops = [];
      const tw = document.createTreeWalker(w, NodeFilter.SHOW_TEXT);
      let t;
      while ((t = tw.nextNode())) {
        if (t.parentElement && t.parentElement.closest('rt')) continue;
        n += t.nodeValue.trim().length;
        const rg = document.createRange(); rg.selectNodeContents(t);
        const rs = rg.getClientRects();
        for (let j = 0; j < rs.length; j++) if (rs[j].width > 0.5) tops.push(rs[j].top);
      }
      if (n > 10 || tops.length < 2) continue;
      const fs = parseFloat(getComputedStyle(w).fontSize) || 16;
      if (Math.max.apply(null, tops) - Math.min.apply(null, tops) > 0.6 * fs) return true;
    }
    return false;
  }
  const MIN_W = { vc: [250, 200, 160, 140], kj: [290, 245, 225, 200] };
  const MIN_H = { vc: [92, 74, 58, 54], kj: [150, 112, 84, 70] };
  /** Hop meo cham the nao do trong luoi? z = goc tren-trai vung meo (toa do trong vung cuon); vung meo keo toi mep phai / duoi */
  function chamMeo(l, z) {
    const lr = l.getBoundingClientRect(), zl = lr.left + z.x, zt = lr.top + z.y;
    for (const c of l.children) { const r = c.getBoundingClientRect(); if (r.right > zl + 1 && r.bottom > zt + 1) return true; }
    return false;
  }
  function chonLuoi(sc, l, loai, z) {
    const n = l.children.length;
    if (!n) return null;
    const Wl = l.clientWidth, Hl = l.clientHeight + 20, gap = 12;   // +20: tieu de gon lai khi k nho -> vung cuon cao them
    const ds = [];
    for (let d = 0; d < 4; d++) {
      const cmax = Math.max(1, Math.min(n, Math.floor((Wl + gap) / (MIN_W[loai][d] + gap))));
      let bd = null;
      for (let c = Math.max(1, cmax - 3); c <= cmax; c++) {
        let rows = Math.ceil(n / c), nc = 0, nr = 0;
        if (z) {
          // o khuyet: tim so hang sao cho (hang x cot - nc x nr) >= n; nc / nr = so cot / hang bi hop meo phu (theo be ngang cot / chieu cao hang xap xi)
          const colW = (Wl - (c - 1) * gap) / c;
          nc = Math.min(c, Math.max(1, Math.ceil((Wl - z.x + gap) / (colW + gap))));
          if (nc >= c) continue;
          let ok = false;
          for (let r = rows; r <= rows + 4 && !ok; r++) {
            const rowH = (l.clientHeight - (r - 1) * gap) / r;
            nr = Math.min(r - 1, Math.max(1, Math.ceil((l.clientHeight - z.y + gap) / (rowH + gap))));
            if (r * c - nc * nr >= n) { rows = r; ok = true; }
          }
          if (!ok) continue;
        }
        if (rows * MIN_H[loai][d] * KMIN + (rows - 1) * gap > Hl + 4) continue;   // chac chan khong du chieu cao
        const f = (k) => { datCfg(sc, l, { k, d, cols: c, rows: z ? rows : 0, nc, nr }); return vua(l) && !(z && chamMeo(l, z)); };
        const k = timK(f, KMIN, KMAX[loai]);
        if (!k) continue;
        const trong = rows * c - nc * nr - n;             // o trong o hang cuoi: phat de luoi can bang (hang cuoi le duoc can giua, nhung chia het van dep hon)
        const diem = Math.min(k, 1.1) - 0.15 * d - 0.4 * (trong / c) - (trong ? 0.03 : 0);
        ds.push({ k, d, cols: c, rows: z ? rows : 0, nc, nr, diem });
        if (!bd || diem > bd.diem) bd = ds[ds.length - 1];
      }
      if (bd && bd.k >= 0.95) break;
    }
    ds.sort((x, y) => y.diem - x.diem);
    for (let i = 0; i < ds.length && i < 4; i++) {
      datCfg(sc, l, ds[i]);
      if (loai === 'vc' && tuBiGay(l)) continue;      // tu ngan bi ngat dong giua tu: loai (chi do tren ung vien tot nhat)
      return ds[i];
    }
    return null;
  }
  /** Bang phan mo, meo dung nghi o goc duoi phai vung noi dung: thu luoi voi o khuyet tren vung DAY DU (khong cat ca dai duoi). Khong vua -> tra lai vung da cat, tra null */
  function thuOKhuyet(sc, l, loai) {
    const vg = M.vung, st = M.stage;
    apVung(vg.full);
    st.removeAttribute('data-s-tight'); st.style.removeProperty('--st-e');
    const sr = st.getBoundingClientRect(), lr = l.getBoundingClientRect();
    const ml = sr.left + vg.cat.x, mt = sr.top + vg.cat.y;
    // meo phai nam o GOC DUOI PHAI cua vung cuon (keo toi mep phai + mep duoi), va chiem mot phan nho
    if (ml + vg.cat.w >= lr.right - 6 && mt + vg.cat.h >= lr.bottom - 6) {
      const z = { x: Math.max(0, ml - 12 - lr.left), y: Math.max(0, mt - 12 - lr.top) };
      if (z.x > lr.width * 0.4 && z.y > lr.height * 0.4) {
        const cfg = chonLuoi(sc, l, loai, z);
        if (cfg) { cfg.rect = 'full'; return cfg; }
      }
    }
    apVung(vg.cut);
    return null;
  }
  /** Khong vua o co chu san, man may tinh / may bang: chon mat do + so cot de cuon IT man hinh nhat (diem = so man + 0,35 x mat do; the dau phai hien tron) */
  function cuonItNhat(sc, l, loai) {
    const W = l.clientWidth, Hl = l.clientHeight, n = l.children.length;
    const ds = [];
    for (let d = 0; d < 4; d++) {
      const cmax = Math.max(1, Math.min(loai === 'vc' ? 6 : 4, n, Math.floor((W + 12) / (MIN_W[loai][d] + 12))));
      for (let c = cmax; c >= Math.max(1, cmax - 2); c--) {
        const cfg = { k: 1, d, cols: c, vua: false };
        datCfg(sc, l, cfg); E.ev++;
        let h1 = 0;
        for (let i = 0; i < c && i < n; i++) h1 = Math.max(h1, l.children[i].getBoundingClientRect().height);
        if (h1 > Hl - 8) continue;
        cfg.diem = l.scrollHeight / Math.max(1, Hl) + 0.35 * d + (c < cmax ? 0.04 : 0);
        ds.push(cfg);
      }
    }
    ds.sort((x, y) => x.diem - y.diem);
    for (let i = 0; i < ds.length && i < 4; i++) {
      datCfg(sc, l, ds[i]);
      if (loai === 'vc' && tuBiGay(l)) continue;      // tu ngan bi ngat dong giua tu: bo cau hinh nay
      return ds[i];
    }
    return null;
  }
  function cuonCfg(sc, l, loai, ngan) {
    const W = l.clientWidth, Hl = l.clientHeight;
    if (loai !== 'vc' && loai !== 'kj') return { k: ngan ? 0.85 : 1, d: 0, cols: 1, vua: false };
    if (!ngan && W >= 520) { const it = cuonItNhat(sc, l, loai); if (it) return it; }
    const cot = (d) => Math.max(1, Math.min(loai === 'vc' ? 6 : 4, Math.floor((W + 12) / (MIN_W[loai][d] + 12))));
    const k = ngan ? 0.85 : 1;
    // hang dau (cac the dau tien) co hien tron trong vung nhin khong
    const hangDau = (c) => { let h = 0; for (let i = 0; i < c && i < l.children.length; i++) h = Math.max(h, l.children[i].getBoundingClientRect().height); return h; };
    let cuoi = null;
    for (let d = ngan ? 3 : 0; d < 4; d++) {
      const c0 = loai === 'vc' && d === 0 && !ngan ? Math.max(1, Math.min(4, Math.floor((W + 12) / 297))) : loai === 'kj' && d === 0 && !ngan ? Math.max(1, Math.min(3, Math.floor((W + 12) / 352))) : cot(d);
      for (let c = c0; c >= Math.max(1, c0 - 2); c--) {
        const cfg = { k, d, cols: c, vua: false };
        datCfg(sc, l, cfg);
        cuoi = cfg;
        if (hangDau(c) <= Hl - 8) return cfg;
      }
    }
    return cuoi;
  }
  function chonDong(sc, l, cotDs, loai) {
    let best = null;
    cotDs.forEach((c) => {
      const f = (k) => { datCfg(sc, l, { k, d: 0, cols: c }); return vua(l); };
      // be ngang cot khong con phu thuoc k (<= 1) nen gan don dieu; van thu them k = KMIN + .12 phong truong hop khong don dieu
      const k = timK(f, KMIN, KMAX[loai] || 1.2) || (f(KMIN + 0.12) ? timK(f, KMIN + 0.12, KMAX[loai] || 1.2) : 0);
      if (k) { const diem = k - 0.1 * (c - 1); if (!best || diem > best.diem) best = { k, d: 0, cols: c, diem }; }
    });
    return best;
  }
  function fit() {
    try { fitTrong(); } catch (e) { try { console.warn('[s-tinh] fit', e); } catch (x) {} }
  }
  function fitTrong() {
    if (!M || !M.dung) return;
    if (document.body.classList.contains('dang-giang')) { M.bo = true; return; }
    const sc = document.getElementById('slideContent');
    if (!sc) return;
    if (E.sc !== sc) { giaiLuoiCuon(); E.sc = sc; batCoGian(); }
    const l = sc.querySelector(':scope > .deck-scroll');
    if (!l) { sc.style.removeProperty('--st-k'); delete sc.dataset.sD; M.stage.removeAttribute('data-s-tight'); huyCuon(); return; }
    const loai = loaiCuon(l);
    const cuonTruoc = l.scrollTop;
    const ngan = !!(M.g && M.g.ngan);   // man thap ngang (dien thoai xoay ngang): tieu de gon co dinh, noi dung cuon trong bang
    const t0 = performance.now(); E.ev = 0; E.gay = 0; E.tg = 0;
    const traHU = dungHieuUng(sc);
    try {
      let cfg = null;
      const st = M.stage, vg = M.vung;
      st.removeAttribute('data-s-tight');
      if (vg && M.rd !== 'cut') apVung(vg.cut);     // moi lan do bat dau tu vung da cat (o khuyet chi ap khi tim duoc luoi vua)
      const coMeo = !!(vg && vg.cat && (loai === 'vc' || loai === 'kj'));
      // bo nho dem: cung chuong + cung kich thuoc vung noi dung -> dung lai cau hinh (kiem lai 1 lan do), khong tim lai
      const fc = l.firstElementChild;
      const h2 = sc.querySelector('.deck-h2');
      const khoa = loai + '|' + (ngan ? 1 : 0) + '|' + l.children.length + '|' + (fc && fc.id ? fc.id : '') + '|' + (h2 ? h2.textContent.slice(0, 40) : '') + '|' + l.textContent.length + '|' + sc.clientWidth + 'x' + sc.clientHeight + (coMeo ? '|M' + Math.round(vg.cat.x) + ':' + Math.round(vg.cat.y) : '');
      const hit = E.nho.get(khoa);
      if (hit) {
        if (hit.cfg.rect === 'full' && vg) apVung(vg.full);
        if (hit.tight) { st.style.setProperty('--st-e', hit.tight + 'px'); st.setAttribute('data-s-tight', '1'); }
        datCfg(sc, l, hit.cfg);
        if (hit.cfg.vua === false || vua(l)) cfg = hit.cfg;
        else { st.removeAttribute('data-s-tight'); st.style.removeProperty('--st-e'); if (vg) apVung(vg.cut); E.nho.delete(khoa); }
      }
      if (!cfg) {
        if (loai === 'vc' || loai === 'kj') {
          if (loai === 'vc') danhDauDai(l);
          if (coMeo) cfg = thuOKhuyet(sc, l, loai);
          if (!cfg) cfg = chonLuoi(sc, l, loai);
          // khong vua voi le mat bang chuan -> noi vung noi dung ra them vai px moi ben (le van can bang), thu lai
          if (!cfg) {
            const e = Math.max(4, Math.min(10, Math.round(M.g.mg * 0.45)));
            st.style.setProperty('--st-e', e + 'px'); st.setAttribute('data-s-tight', '1');
            cfg = chonLuoi(sc, l, loai);
            if (!cfg) { st.removeAttribute('data-s-tight'); st.style.removeProperty('--st-e'); }
          }
        }
        else if (loai === 'gp') cfg = chonDong(sc, l, l.clientWidth >= 700 ? [1, 2] : [1], 'gp');
        else if (loai === 'kw') cfg = chonDong(sc, l, l.clientWidth >= 820 ? [1, 2] : [1], 'kw');
        else if (loai === 'rx') cfg = chonDong(sc, l, [1], 'rx');
        if (!cfg) cfg = cuonCfg(sc, l, loai, ngan);   // khong vua o co chu san: cuon trong bang
        if (E.nho.size > 60) E.nho.clear();
        E.nho.set(khoa, { cfg: Object.assign({}, cfg), tight: st.hasAttribute('data-s-tight') ? parseInt(st.style.getPropertyValue('--st-e'), 10) || 0 : 0 });
      }
      datCfg(sc, l, cfg);
      E.cfg = Object.assign({ loai, n: l.children.length, sh: l.scrollHeight, ch: l.clientHeight }, cfg);
      E.n++;
      dungNeo(l, cuonTruoc);
      batCuon(l);   // do luc hieu ung vao the dang o cuoi (khong bi translate 6 px lam phong -> mep mo sai)
    } finally { traHU(); }
    E.kich = sc.clientWidth + 'x' + sc.clientHeight;
    E.ms = Math.round((performance.now() - t0) * 10) / 10;
  }
  // ---- mo neo cuon: vung noi dung doi (the roi / bang phan mo-dong, xoay man hinh) -> bo cuc luoi doi theo -> cho dang xem khong duoc troi mat
  /** Phan tu dau tien con thay trong vung cuon + khoang cach toi dinh vung cuon (chi khi dang cuon duoc) */
  function chupNeo() {
    try {
      const sc = document.getElementById('slideContent');
      const l = sc && sc.querySelector(':scope > .deck-scroll');
      if (!l || l.scrollHeight <= l.clientHeight + 1) return null;
      const lt = l.getBoundingClientRect().top;
      for (const c of l.children) {
        const r = c.getBoundingClientRect();
        if (r.height && r.bottom > lt + 4) return { l, el: c, off: r.top - lt };
      }
    } catch (e) {}
    return null;
  }
  function dungNeo(l, cuonTruoc) {
    const n = E.neo; E.neo = null;
    try {
      if (n && n.l === l && n.el.isConnected && l.contains(n.el) && l.scrollHeight > l.clientHeight + 1) {
        l.scrollTop += (n.el.getBoundingClientRect().top - l.getBoundingClientRect().top) - n.off;
      } else l.scrollTop = cuonTruoc;
    } catch (e) { try { l.scrollTop = cuonTruoc; } catch (x) {} }
    giuTheMo(l);
  }
  /** The dang mo trong spotlight phai nam trong tam nhin (app goi scrollIntoView mem theo bo cuc cu; bo cuc doi giua chung -> huy / lech) */
  function giuTheMo(l) {
    try {
      const se = window.__slideEngine, id = se && se.spotOpenId;
      if (!id || l.scrollHeight <= l.clientHeight + 1) return;
      const el = document.getElementById(id);
      if (!el || !l.contains(el)) return;
      const lr = l.getBoundingClientRect(), r = el.getBoundingClientRect();
      if (r.top >= lr.top + 2 && r.bottom <= lr.bottom - 2) return;
      const dau = r.height >= lr.height - 8 || innerWidth <= 860;   // cung quy tac voi app: man hep 'start', rong 'center'
      l.scrollTop += dau ? r.top - lr.top - 6 : (r.top - lr.top) - (lr.height - r.height) / 2;
    } catch (e) {}
  }
  function lichFit(ngay) {
    if (!M) return;
    if (ngay) { fit(); return; }
    clearTimeout(E.hen);
    E.hen = setTimeout(() => { E.hen = 0; fit(); }, 70);
  }
  // mep mo + goi y cuon trong bang
  function capNhatCuon(l) {
    if (!l || !l.isConnected) return;
    const vuaDu = l.dataset.sFit === '1';
    const tren = !vuaDu && l.scrollTop > 2, duoi = !vuaDu && l.scrollTop + l.clientHeight < l.scrollHeight - 8;
    l.dataset.sTren = tren ? '1' : '0';
    l.dataset.sDuoi = duoi ? '1' : '0';
  }
  function batCuon(l) {
    if (E.cuon !== l) {
      huyCuon();
      E.cuon = l;
      E.onCuon = () => capNhatCuon(l);
      l.addEventListener('scroll', E.onCuon, { passive: true });
    }
    capNhatCuon(l);
    // hieu ung vao the xong / anh nap xong co the doi chieu cao: do lai sau 450 ms
    clearTimeout(E.hen2);
    E.hen2 = setTimeout(() => { E.hen2 = 0; capNhatCuon(E.cuon); }, 450);
  }
  function huyCuon() {
    if (E.cuon && E.onCuon) { try { E.cuon.removeEventListener('scroll', E.onCuon); } catch (e) {} }
    E.cuon = null; E.onCuon = null;
    clearTimeout(E.hen2); E.hen2 = 0;
  }
  function giaiLuoiCuon() {
    huyCuon();
    try { if (E.mo) E.mo.disconnect(); } catch (e) {}
    try { if (E.ro) E.ro.disconnect(); } catch (e) {}
    E.mo = E.ro = null;
  }
  function batCoGian() {
    const sc = document.getElementById('slideContent');
    if (!sc) return;
    E.sc = sc;
    try { E.mo = new MutationObserver(() => lichFit(true)); E.mo.observe(sc, { childList: true }); } catch (e) {}
    try { if (window.ResizeObserver) { E.ro = new ResizeObserver(() => { if (E.sc && E.sc.clientWidth + 'x' + E.sc.clientHeight === E.kich) return; lichFit(!M || (M.lt || 0) < 2); }); E.ro.observe(sc); } } catch (e) {}
    try {
      if (document.fonts && document.fonts.addEventListener && !E.onFont) { E.onFont = () => { E.nho.clear(); lichFit(false); }; document.fonts.addEventListener('loadingdone', E.onFont); }
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (M) lichFit(false); }, () => {});
    } catch (e) {}
  }
  function giaiCoGian() {
    clearTimeout(E.hen); E.hen = 0;
    giaiLuoiCuon();
    try { if (E.onFont && document.fonts) document.fonts.removeEventListener('loadingdone', E.onFont); } catch (e) {}
    E.onFont = null; E.kich = ''; E.nho.clear();
    const sc = E.sc || document.getElementById('slideContent');
    E.sc = null;
    try {
      if (sc) {
        sc.style.removeProperty('--st-k');
        delete sc.dataset.sTren; delete sc.dataset.sDuoi; delete sc.dataset.sD;
        if (!sc.getAttribute('style')) sc.removeAttribute('style');
        sc.querySelectorAll('.deck-scroll').forEach((l) => {
          ['--st-cols', '--st-rows'].forEach((p) => l.style.removeProperty(p));
          ['d', 'sFit', 'cols', 'sTren', 'sDuoi', 'sU', 'sHk'].forEach((a) => { delete l.dataset[a]; });
          ['--st-cols2', '--st-off', '--st-n0c', '--st-n0r'].forEach((p) => l.style.removeProperty(p));
          l.querySelectorAll('[data-s-u1]').forEach((e) => e.removeAttribute('data-s-u1'));
          l.querySelectorAll('[data-s-le]').forEach((e) => e.removeAttribute('data-s-le'));
          l.querySelectorAll('[data-s-dai]').forEach((e) => e.removeAttribute('data-s-dai'));
          if (!l.getAttribute('style')) l.removeAttribute('style');
        });
      }
    } catch (e) {}
  }

  // ------------------------------------------------------------------ vong doi theo <html data-che-do>
  function dong() {
    let k = null;
    try { k = de.getAttribute('data-che-do'); } catch (e) {}
    if (k === KHOA) {
      // s.js / s.css / DOM chua san sang: thu lai moi 120 ms trong ~4 s dau, sau do moi 1 s toi ~64 s (mang cham); loi nap han thi dung (luoi mac dinh; chon lai S se thu lai)
      if (!M && !gan() && !cho) {
        if (++thu === 22) { try { const st = document.querySelector('main.deck-stage'); if (st && !st.dataset.sTinh) st.dataset.sNhan = '1'; } catch (e) {} }   // ~2,6 s chua san sang: hien luoi mac dinh (gan duoc sau thi doi sang bang)
        if (thu <= 94) cho = setTimeout(() => { cho = null; dong(); }, thu <= 34 ? 120 : 1000);
      }
    } else {
      thu = 0;
      if (cho) { clearTimeout(cho); cho = null; }
      go();
    }
  }
  function khoi() {
    try {
      obsAttr = new MutationObserver(() => { thu = 0; dong(); });
      obsAttr.observe(de, { attributes: true, attributeFilter: ['data-che-do'] });
    } catch (e) {}
    dong();
  }
  try {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', khoi, { once: true });
    else khoi();
  } catch (e) {}
  // chi doc (kiem thu / go loi): trang thai lop nen va cau hinh co gian gan nhat
  Object.assign(NSC.s, { dangGan: () => !!M, hinh: () => (M && M.g) || null, host: () => (M && M.host) || null, cfg: () => E.cfg || null, dem: () => E.n, ms: () => E.ms, dd: () => ({ ev: E.ev, gay: E.gay, tg: Math.round(E.tg) }) });
})();
