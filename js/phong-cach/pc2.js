/* ==========================================================================
   Phong cach giang 2 — "Bang phan" (N5 bai 2) — phan chuyen dong
   Dang ky: window.SenseiPhongCach.pc2 = { batDau(stageEl), ketThuc(stageEl), dangBat() }

   Chi doi CACH chuyen dong, khong doi NHIP: moi hieu ung van do dao dien (js/motion.js) va canh
   (motion-canh-chu.js / motion-canh-hoi.js) goi dung luc cu; o day chi dich keyframes cua chung
   sang ngon ngu bang phan, va chi khi #sanKhauGiang dang mang data-phong-cach="pc2":
     - doi nhip: noi dung cu MO TAI CHO (200 ms, khong truot, khong dai lau); noi dung moi duoc "viet"
       bang mat na quet trai -> phai, bat dau khi noi dung cu con ~50% -> hai lop chong nhau mot chut,
       mat bang khong bao gio trong (tieu diem duy nhat: mep viet di tu trai sang phai)
     - dong phu hien theo loi (nhich 6px + hien): viet bang mat na; dong "cho doc" (mo .32): tu mo -> ro
     - hoi thoai: token chuyen tu mo sang ro dung luc duoc doc (is-doc) = viet tung token theo tieng
     - token chinh duoc doc / nhan manh: gach phan vang (mau dau duy nhat) hoac vong tron hong co dinh
       cho tro tu; ve bang stroke-dashoffset tren mot lop SVG trong the, om sat MAT CHU (do bang
       canvas.measureText: khong om dong furigana, gach cach dong romaji ben duoi)
   Cach moc (deu go sach o ketThuc):
     1. Element.prototype.animate duoc boc: chi phan tu nam trong .sk-o-the cua san khau pc2 moi bi
        dich; moi loi goi khac chuyen thang cho ham goc.
     2. SenseiMotion.hu.nhan duoc boc (goi ham goc truoc, roi ve dau phan).
     3. MutationObserver tren san khau: phan loai tro tu (lop .pc2-tro), bat is-doc cua token, theo
        con tro doc cua canh chu (.sk-chu-tro) de biet dang doc token chinh nao.
   Phong chu Klee One: tep nay tu nap stylesheet NGAY KHI TAI (khong doi batDau) neu index.html chua co;
     tich hop chinh thuc = them vao index.html canh link phong chu hien co:
       <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&display=swap" />
     Chu chi doi sang Klee One (data-pc2-chu="klee" tren san khau) khi phong da nap xong VA dang o ranh
     gioi the (san khau an / the moi bat dau viet) -> khong nhay phong chu giua mot nhip.
   Giam chuyen dong: khong dich gi (dao dien da chi con hien / mo 120 ms), dau phan hien ngay.
   ========================================================================== */
(function () {
  'use strict';
  const W = typeof window !== 'undefined' ? window : null;
  if (!W || !W.document || typeof Element === 'undefined') return;

  const TEN = 'pc2';
  const NS = 'http://www.w3.org/2000/svg';
  const E_VIET = 'cubic-bezier(.33, .08, .3, 1)';   // viet dong phu: vao nhanh, cham dan o cuoi dong
  const E_VIET_THE = 'cubic-bezier(.22, .5, .3, 1)'; // viet ca the: mep viet vao som (noi tiep noi dung cu)
  const E_MO = 'cubic-bezier(.4, 0, .6, 1)';         // mo noi dung cu tai cho
  const VIET_THE = 480;    // viet noi dung the moi
  const MO_THE = 200;      // noi dung cu mo tai cho (dao dien go the cu sau 180 + 40 ms -> xong truoc do)
  const CHONG = 100;       // the moi bat dau viet sau 100 ms (= 50% luc mo cu; dao dien mac dinh 170)
  const MO_LAT = 160;      // lat the chuong / ket bai: lop cu mo (dung luc cua dao dien)
  const VIET_CUNG = 250;   // cung slide: the moi phai viet xong truoc khi the cu bi go (170 + 220 + 40)
  const VIET_DONG = 460;   // dong phu
  const VIET_TOK = 240;    // mot token hoi thoai
  const TOI_DA_DAU = 3;    // toi da so dau phan tren mot the (cai moi nhat sang, cu mo)
  const FONT_URL = 'https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&display=swap';
  const TRO_TU = new Set(['は', 'が', 'を', 'に', 'へ', 'で', 'と', 'も', 'の', 'や', 'か', 'ね', 'よ', 'から', 'まで', 'より', 'だけ', 'しか', 'など', 'わ']);

  const mq = W.matchMedia ? W.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const giam = () => !!(mq && mq.matches);
  const goc = Element.prototype.animate;
  // Chrome >= 120: mask-* khong tien to; cu hon: -webkit-mask-*
  const P = (() => {
    let ok = false;
    try { ok = !!(W.CSS && CSS.supports && CSS.supports('mask-image', 'linear-gradient(#000, #000)')); } catch (e) {}
    const p = ok ? 'mask' : 'webkitMask';
    return { img: p + 'Image', size: p + 'Size', pos: p + 'Position', rep: p + 'Repeat' };
  })();

  let ST = null;   // trang thai khi dang bat

  const canhBao = (noi, e) => { try { console.warn('[pc2] ' + noi, e); } catch (x) {} };
  const laPc2 = (san) => !!(san && san.getAttribute && san.getAttribute('data-phong-cach') === TEN);
  const dangBat = (san) => !!ST && laPc2(san);
  function hen(fn, ms) {
    if (!ST) return null;
    const id = setTimeout(() => { if (ST) ST.hen.delete(id); try { if (ST) fn(); } catch (e) { canhBao('hen', e); } }, Math.max(0, ms || 0));
    ST.hen.add(id);
    return id;
  }

  // ------------------------------------------------------------------ phong chu Klee One
  // Nap stylesheet ngay khi tep nay tai (som nhat co the, khong doi bai giang); bo qua neu index.html da co.
  let FONT = { link: null, san: false, cho: null };
  function napPhongChu() {
    const co = document.querySelector('link[href*="family=Klee+One"]');
    if (co) { FONT.link = co; return co; }
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = FONT_URL;
    l.setAttribute('data-pc2-font', '');
    (document.head || document.documentElement).appendChild(l);
    FONT.link = l;
    return l;
  }
  function choPhongChu() {
    if (FONT.cho) return FONT.cho;
    const fs = document.fonts;
    if (!fs || !fs.load) return (FONT.cho = Promise.resolve(false));
    const l = FONT.link;
    const coSheet = () => { try { return !!(l && l.sheet && l.sheet.cssRules); } catch (e) { return !!(l && l.sheet); } };
    const tai = new Promise((r) => {
      if (!l || coSheet()) return r();
      l.addEventListener('load', () => r(), { once: true });
      l.addEventListener('error', () => r(), { once: true });
      setTimeout(r, 6000);
    });
    FONT.cho = tai
      .then(() => Promise.all([fs.load('600 40px "Klee One"', 'これあの私'), fs.load('400 40px "Klee One"', 'これあの私')]))
      .then((ds) => { FONT.san = ds.some((d) => d && d.length); return FONT.san; })
      .catch(() => false);
    return FONT.cho;
  }
  /** Bat Klee One tren san khau neu da nap; chi goi o ranh gioi the (hoac khi san khau an / trong) */
  function datPhongChu(san, ep) {
    if (!FONT.san || !san || san.getAttribute('data-pc2-chu') === 'klee') return;
    const trong = san.hidden || !san.querySelector('.sk-o-the > .sk-the:not(.sk-ra)');
    if (ep || trong) san.setAttribute('data-pc2-chu', 'klee');
  }
  try { if (document.head) { napPhongChu(); choPhongChu(); } else document.addEventListener('DOMContentLoaded', () => { napPhongChu(); choPhongChu(); }, { once: true }); } catch (e) {}

  // ------------------------------------------------------------------ keyframes mat na
  // Mat na rong 220% cua phan tu, mep mem 8% (~18% be rong phan tu); mask-position 100% -> 0%
  // dua mep tu -10% sang 110% be rong.
  function kfMat(anh, them) {
    const f = (pos) => Object.assign({ [P.img]: anh, [P.size]: '220% 100%', [P.rep]: 'no-repeat', [P.pos]: pos + ' 0' }, them || {});
    return [f('100%'), f('0%')];
  }
  const kfViet = (mo) => kfMat(`linear-gradient(90deg, #000 46%, rgba(0, 0, 0, ${Math.max(0, Math.min(1, mo || 0))}) 54%)`, { opacity: 1 });
  const kfMo = () => [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 0' }];

  // ------------------------------------------------------------------ dich hieu ung
  const laDichY = (t) => t != null && /^0(px)? -?\d+(\.\d+)?px$/.test(String(t).trim());
  const BO_QUA = '.sk-chu-tro, .sk-con-tro, .sk-ht-con-tro, .sk-lop-bay, .sk-bay, .sk-vd-bay, .sk-chip, .pc2-phan, .sk-mat, .sk-ban-sao';
  function dich(el, kf, o) {
    if (!ST || !Array.isArray(kf) || !kf.length || !el || el.nodeType !== 1 || !el.closest) return null;
    const oThe = el.closest('.sk-o-the');
    if (!oThe) return null;
    const san = oThe.closest('.san-khau-giang');
    if (!dangBat(san)) return null;
    if (el.closest(BO_QUA)) return null;
    const op = typeof o === 'number' ? { duration: o } : Object.assign({}, o || {});
    const n = kf.length;
    const f0 = kf[0] || {}, f1 = kf[n - 1] || {};
    const tre = op.delay || 0;
    const cha = el.parentElement;
    // lat the chuong / ket bai: noi dung cu (moi con cua than the) mo 160 ms -> dau phan cua no cung mo
    const laLat = !!(cha && cha.classList.contains('sk-the-than') && n === 2 && f0.opacity === 1 && f1.opacity === 0 && f1.translate == null && op.duration === MO_LAT);
    if (laLat) xoaDau(theCua(el), giam() ? 0 : tre, giam() ? 0 : MO_LAT);
    if (giam()) {
      if (el.parentElement === oThe && el.classList.contains('sk-the') && n === 1 && f0.opacity === 0) datPhongChu(san, true);
      return null;
    }
    // --- ca the (khung .sk-the con truc tiep cua o the)
    if (el.parentElement === oThe && el.classList.contains('sk-the')) {
      if (n === 1 && f0.opacity === 0 && f0.translate === '32px 0') {
        datPhongChu(san, true);   // ranh gioi the: doi phong chu (neu vua nap xong) truoc khi viet
        op.delay = Math.min(tre, CHONG);
        op.duration = VIET_THE; op.easing = E_VIET_THE;
        el.__den = performance.now() + op.delay + VIET_THE;   // canh: trong luc the dang viet, dong phu hien cung the
        return { kf: kfViet(0), o: op };
      }
      if (n === 2 && f1.opacity === 0 && f1.translate === '-32px 0') {
        op.duration = MO_THE; op.easing = E_MO;
        xoaDau(el, tre, MO_THE);
        return { kf: kfMo(), o: op };
      }
      if (el.classList.contains('is-phu') && n === 1 && f0.opacity === 0 && f0.translate == null) {
        op.duration = VIET_CUNG; op.easing = E_VIET;
        el.__den = performance.now() + tre + VIET_CUNG;
        return { kf: kfViet(0), o: op };
      }
      if (n === 2 && f0.opacity === 1 && f1.opacity === 0 && f1.translate == null && el.classList.contains('sk-ra')) {
        op.easing = E_MO;   // cung slide, bo cuc la: ca the cu mo tai cho
        return { kf: kfMo(), o: op };
      }
      return null;
    }
    // --- cung slide: khoi cau / giai thich cu lui -24px -> mo tai cho (hang cong thuc dung yen)
    if (n === 2 && f1.opacity === 0 && f1.translate === '-24px 0') {
      op.easing = E_MO;
      xoaDau(theCua(el), tre, op.duration || 180);
      return { kf: kfMo(), o: op };
    }
    // --- lat the chuong / ket bai trong cung khung the: lop cu mo (mac dinh cua dao dien), lop moi viet
    //     tu 60% luc mo cu (chong nhe, khong khung hinh trong)
    if (cha && cha.classList.contains('sk-the-than')) {
      if (laLat) return null;
      if (el.classList.contains('sk-the-lat') && n === 1 && f0.opacity === 0) {
        op.delay = Math.round(tre * 0.6);
        op.duration = VIET_THE; op.easing = E_VIET_THE;
        return { kf: kfViet(0), o: op };
      }
    }
    // --- dong phu hien theo loi: (mo) + nhich y -> viet; .sk-cho-chu (mo .32 -> 1) -> viet tu mo
    const hienDon = n === 1 ? f0.offset === 0 : (f1.opacity == null || f1.opacity === 1);
    if (hienDon && typeof f0.opacity === 'number' && f0.opacity < 1) {
      const choChu = el.classList.contains('sk-cho-chu') && f0.translate == null && n === 1;
      if (choChu || laDichY(f0.translate)) {
        op.duration = Math.max(op.duration || 0, VIET_DONG); op.easing = E_VIET;
        return { kf: kfViet(f0.opacity), o: op };
      }
    }
    return null;
  }
  function animatePc2(kf, o) {
    if (ST) {
      try {
        const x = dich(this, kf, o);
        if (x) return goc.call(this, x.kf, x.o);
      } catch (e) { canhBao('dich', e); }
    }
    return goc.apply(this, arguments);
  }

  // ------------------------------------------------------------------ dau phan (vong / gach, SVG)
  function chuTok(el) {
    let s = '';
    const di = (n) => n.childNodes.forEach((c) => {
      if (c.nodeType === 3) s += c.nodeValue;
      else if (c.nodeType === 1 && !c.matches('rt, rp, .sk-vd-chips, .sk-ht-vai-tro')) di(c);
    });
    di(el);
    return s.replace(/[\s、。，．,.！？!?「」]/g, '');
  }
  const laTro = (el) => el.classList.contains('pc2-tro') || (el.classList.contains('sk-np-chip') && el.classList.contains('is-tro'));
  const CO_TRO = '.sk-vd-tok.is-key, .sk-ht-tok.is-nang, .sk-np-chip';
  function phanLoaiTro(root) {
    if (!root || root.nodeType !== 1) return;
    const ds = root.matches(CO_TRO) ? [root] : [];
    if (root.querySelectorAll) ds.push(...root.querySelectorAll(CO_TRO));
    ds.forEach((t) => { if (TRO_TU.has(chuTok(t))) t.classList.add('pc2-tro'); });
  }
  /** Loai dau cho phan tu: [kieu, mau, day] hoac null. Gach = vang (mac dinh); vong tron = hong, chi tro tu */
  function loaiDau(el, nguon) {
    if (!el || !el.matches) return null;
    if (el.matches('.sk-np-chip')) return ['gach', '', false];
    if (el.matches('.sk-vd-tok.is-key, .sk-ht-tok.is-nang')) return laTro(el) ? ['vong', 'is-hong', false] : ['gach', '', false];
    if (el.matches('.sk-tv-tu')) return ['gach', '', true];
    if (el.matches('.sk-kj-hv')) return ['gach', '', false];
    if (nguon === 'nhan' && !el.closest('.sk-cong, .qz-card, .sk-bt, .sk-canh-quiz')) {
      // hu.nhan cua dao dien: chi gach duoi phan tu co mot tu / cum ngan (khong gach ca khoi)
      const r = el.getBoundingClientRect();
      if (r.width > 8 && r.height > 8 && r.height < 110 && r.width < 520) return ['gach', '', false];
    }
    return null;
  }
  function lopPhan(the) {
    let s = the.querySelector(':scope > svg.pc2-phan');
    if (!s) {
      s = document.createElementNS(NS, 'svg');
      s.setAttribute('class', 'pc2-phan');
      s.setAttribute('aria-hidden', 'true');
      the.appendChild(s);
    }
    return s;
  }
  // do mat chu bang canvas: baseline = dinh hop dong chu + fontBoundingBoxAscent; muc = baseline -/+ actual*
  let CV = null;
  function doMuc(node) {
    const pe = node.parentElement;
    if (!pe) return null;
    const cs = getComputedStyle(pe);
    if (!CV) CV = document.createElement('canvas').getContext('2d');
    if (!CV) return null;
    CV.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = CV.measureText(node.nodeValue.trim());
    if (!(m.fontBoundingBoxAscent > 0)) return null;
    return { len: m.fontBoundingBoxAscent, xuong: m.fontBoundingBoxDescent, mLen: m.actualBoundingBoxAscent, mXuong: m.actualBoundingBoxDescent, co: parseFloat(cs.fontSize) || 16 };
  }
  /** Hop MAT CHU (bo furigana / chip / nhan vai tro): ngang = be rong tien cua chu, doc = muc thuc cua net */
  function hopChu(el) {
    const rg = document.createRange();
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity, co = 0;
    const di = (n) => n.childNodes.forEach((c) => {
      if (c.nodeType === 3 && c.nodeValue.trim()) {
        rg.selectNodeContents(c);
        const m = doMuc(c);
        for (const q of rg.getClientRects()) {
          if (!q.width || !q.height) continue;
          let tr = q.top, du = q.bottom;
          if (m) {
            // hop dong chu co the cao hon / thap hon ascent+descent (line-height): canh theo tam
            const bu = (q.height - (m.len + m.xuong)) / 2;
            const goc0 = q.top + bu + m.len;
            tr = goc0 - m.mLen; du = goc0 + m.mXuong;
          }
          l = Math.min(l, q.left); r = Math.max(r, q.right); t = Math.min(t, tr); b = Math.max(b, du);
        }
        if (m) co = Math.max(co, m.co);
      } else if (c.nodeType === 1 && !c.matches('rt, rp, .sk-vd-chips, .sk-ht-vai-tro')) di(c);
    });
    try { di(el); } catch (e) { return null; }
    return r > l && b > t ? { left: l, top: t, width: r - l, height: b - t, co: co || parseFloat(getComputedStyle(el).fontSize) || 16 } : null;
  }
  const OM_CHU = '.sk-vd-tok, .sk-ht-tok, .sk-tv-tu, .sk-kj-hv';
  function hopTrong(el, the) {
    const rt = the.getBoundingClientRect();
    const chu = el.matches(OM_CHU) ? hopChu(el) : null;
    const r = chu || el.getBoundingClientRect();
    const b = { x: r.left - rt.left, y: r.top - rt.top, w: r.width, h: r.height, co: chu ? chu.co : 0, chu: !!chu, tran: -Infinity };
    // vong tron: khong duoc cat vao dong furigana phia tren (rt cua cac token ben canh trong cung cau)
    if (chu) {
      const cau = el.closest('.sk-vd-cau, .sk-ht-cau, .sk-chu') || el.parentElement;
      if (cau) {
        const l = r.left - chu.co * .4, p = r.right + chu.co * .4, giua = r.top + r.height / 2;
        cau.querySelectorAll('rt').forEach((x) => {
          const q = x.getBoundingClientRect();
          if (!q.width || q.right < l || q.left > p || q.bottom > giua) return;
          b.tran = Math.max(b.tran, q.bottom - rt.top);
        });
      }
    }
    return b;
  }
  const f1 = (x) => x.toFixed(1);
  function duong(kieu, b) {
    if (kieu === 'vong') {
      // vong tron vua hop mat chu (chu tro tu ~ vuong 1em): ban kinh ngang = nua be rong + .06em,
      // doc = nua muc net (toi thieu .42em) + .1em, cat bot neu cham dong furigana
      const em = b.co || b.h;
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      const rx = b.w / 2 + em * .08;
      let ry = Math.max(b.h / 2, em * .42) + em * .12;
      if (b.tran > -Infinity) ry = Math.max(b.h / 2 + 2, Math.min(ry, cy - b.tran - 3));
      const pt = (a, k) => [cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)];
      const a0 = -2.3;
      const [x0, y0] = pt(a0, 1.02), [x1, y1] = pt(a0 + Math.PI, 0.99), [x2, y2] = pt(a0 + 2 * Math.PI - 0.05, 1.0), [x3, y3] = pt(a0 + 2 * Math.PI + 0.3, 1.04);
      return `M${f1(x0)} ${f1(y0)} A${f1(rx)} ${f1(ry)} 0 0 1 ${f1(x1)} ${f1(y1)} A${f1(rx)} ${f1(ry)} 0 0 1 ${f1(x2)} ${f1(y2)} A${f1(rx * 1.03)} ${f1(ry * 1.03)} 0 0 1 ${f1(x3)} ${f1(y3)}`;
    }
    // gach duoi: hoi luon song nhu net tay; mat chu -> ngay duoi day net (.07em); hop phan tu -> duoi hop
    const em = b.co || 16;
    const y = b.chu ? b.y + b.h + Math.max(3, em * .07) : b.y + b.h + Math.max(2, Math.min(6, b.h * .04));
    const x0 = b.x + Math.min(6, b.w * .04), x1 = b.x + b.w - Math.min(4, b.w * .03);
    const d = x1 - x0, a = Math.min(1.8, 0.5 + d * 0.01);
    return `M${f1(x0)} ${f1(y + a * 0.4)} C${f1(x0 + d * 0.3)} ${f1(y - a * 0.5)} ${f1(x0 + d * 0.66)} ${f1(y + a * 0.6)} ${f1(x1)} ${f1(y - a * 0.5)}`;
  }
  function theCua(el) { return el && el.closest ? el.closest('.sk-o-the > .sk-the') : null; }
  function danhDau(el, nguon) {
    if (!ST || !el || !el.isConnected) return;
    const the = theCua(el);
    if (!the || !dangBat(the.closest('.san-khau-giang'))) return;
    if (the.classList.contains('sk-ra') || the.classList.contains('sk-the-truoc') || el.closest('.sk-an, .sk-ra, .sk-chu-tat')) return;
    const loai = loaiDau(el, nguon);
    if (!loai) return;
    let ds = ST.dau.get(the);
    if (!ds) { ds = []; ST.dau.set(the, ds); }
    if (ds.some((d) => d.el === el)) return;
    // the dang duoc viet: cho viet xong roi moi ve (mot tieu diem mot luc)
    const con = (typeof the.__den === 'number' ? the.__den : 0) - performance.now();
    if (con > 30) { hen(() => danhDau(el, nguon), con); return; }
    const [kieu, mau, day] = loai;
    const b = hopTrong(el, the);
    if (!b.w || !b.h) return;
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('class', 'pc2-dau ' + (kieu === 'vong' ? 'is-vong ' : 'is-gach ') + mau + (day ? ' is-day' : ''));
    p.setAttribute('d', duong(kieu, b));
    p.setAttribute('pathLength', '1');
    p.style.strokeDasharray = '1 1';
    lopPhan(the).appendChild(p);
    ds.forEach((d) => d.p.classList.add('is-cu'));
    ds.push({ el, kieu, p });
    while (ds.length > TOI_DA_DAU) { const x = ds.shift(); try { x.p.remove(); } catch (e) {} }
    try { if (ST.ro) { ST.ro.observe(the); ST.ro.observe(el); } } catch (e) {}
    if (!giam()) {
      try {
        goc.call(p, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
          { duration: kieu === 'vong' ? 460 : Math.min(500, 300 + b.w * 0.5), easing: 'cubic-bezier(.45, .05, .3, 1)', fill: 'backwards' });
      } catch (e) {}
    }
  }
  /** Mo moi dau phan cua the (doi nhip / lat the): cung nhip voi noi dung cu roi go */
  function xoaDau(the, tre, ms) {
    if (!ST || !the) return;
    const ds = ST.dau.get(the);
    if (!ds || !ds.length) return;
    ST.dau.delete(the);
    const ps = ds.map((d) => d.p);
    const svg = the.querySelector(':scope > svg.pc2-phan');
    if (!ms || !svg) { ps.forEach((p) => p.remove()); return; }
    try { goc.call(svg, [{ opacity: 1 }, { opacity: 0 }], { duration: ms, delay: tre || 0, easing: E_MO, fill: 'backwards' }); } catch (e) {}
    hen(() => ps.forEach((p) => p.remove()), (tre || 0) + ms + 20);
  }
  function henDatLai() {
    if (!ST || ST.henDat) return;
    ST.henDat = setTimeout(() => { if (!ST) return; ST.henDat = null; try { datLaiDau(); } catch (e) {} }, 140);
  }
  /** Bo cuc the doi (vua khung, xoay may, phong chu vua doi): dat lai duong cua moi dau, khong hieu ung */
  function datLaiDau() {
    if (!ST) return;
    ST.dau.forEach((ds, the) => {
      if (!the.isConnected) { ST.dau.delete(the); return; }
      ds.forEach((d) => {
        if (!d.el.isConnected) return;
        const b = hopTrong(d.el, the);
        if (b.w && b.h) d.p.setAttribute('d', duong(d.kieu, b));
      });
    });
  }

  // ------------------------------------------------------------------ theo con tro doc cua canh chu
  const UNG_VIEN = '.sk-vd-tok.is-key, .sk-np-chip, .sk-tv-tu, .sk-kj-hv';
  // Kiem ngay khi con tro doi dich (gop cac thay doi trong 30 ms); doc DICH cuoi cua con tro tu style
  // inline cua cac manh (khong doc hop dang truot) -> token ngan (tro tu) khong bi lo khi doc nhanh
  function henTro() {
    if (!ST || ST.henTroId) return;
    ST.henTroId = hen(() => { if (ST) ST.henTroId = null; kiemTro(); }, 30);
  }
  function hopGoc(g) {
    const o = g.getBoundingClientRect();
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    [...g.children].forEach((m) => {
      const w = parseFloat(m.style.width), h = parseFloat(m.style.height);
      const tr = String(m.style.translate || '').trim().split(/\s+/).map(parseFloat);
      let x, y, ww, hh;
      if (w > 0 && h > 0 && tr.length && !isNaN(tr[0])) { x = o.left + tr[0]; y = o.top + (tr[1] || 0); ww = w; hh = h; } else {
        const q = m.getBoundingClientRect();
        if (!q.width || !q.height) return;
        x = q.left; y = q.top; ww = q.width; hh = q.height;
      }
      l = Math.min(l, x); t = Math.min(t, y); r = Math.max(r, x + ww); b = Math.max(b, y + hh);
    });
    return { l, t, r, b };
  }
  function kiemTro() {
    const san = ST && ST.san;
    if (!san || !dangBat(san)) return;
    san.querySelectorAll('.sk-o-the > .sk-the:not(.sk-ra):not(.sk-the-truoc) .sk-chu-tro.is-hien').forEach((g) => {
      const { l, t, r, b } = hopGoc(g);
      if (!(r > l && b > t)) return;
      const dt = (r - l) * (b - t);
      const the = theCua(g);
      if (!the) return;
      let tot = null, diem = 0;
      the.querySelectorAll(UNG_VIEN).forEach((e) => {
        const q = e.getBoundingClientRect();
        if (!q.width || !q.height) return;
        const cx = q.left + q.width / 2, cy = q.top + q.height / 2;
        if (cx < l - 4 || cx > r + 4 || cy < t - 4 || cy > b + 4) return;
        const k = (q.width * q.height) / dt;
        if (k >= 0.3 && k > diem) { diem = k; tot = e; }
      });
      if (tot) danhDau(tot, 'tro');
    });
  }

  // ------------------------------------------------------------------ quan sat san khau
  function khiDoi(ds) {
    if (!ST) return;
    const bat = dangBat(ST.san);
    for (const m of ds) {
      if (m.type === 'childList') {
        if (bat) m.addedNodes.forEach((n) => { if (n.nodeType === 1) phanLoaiTro(n); });
        // noi dung trong the doi (phan hoi bai tap mo ra, dong moi...) -> dau phan theo cho moi
        if (bat && ST.dau.size && m.target.closest && m.target.closest('.sk-the') && !m.target.closest('.pc2-phan')) henDatLai();
        continue;
      }
      if (!bat) continue;
      const t = m.target;
      if (m.attributeName === 'hidden' && t === ST.san) { if (t.hidden) datPhongChu(t, true); continue; }
      if (m.attributeName === 'class') {
        const cl = t.classList;
        if (cl.contains('sk-chu-tro')) { henTro(); continue; }
        // the dung san vua len san khau: con tro da dat san tu luc dung -> kiem lai
        if (cl.contains('sk-the') && /(^|\s)sk-the-truoc(\s|$)/.test(m.oldValue || '') && !cl.contains('sk-the-truoc')) { henTro(); continue; }
        if (cl.contains('is-doc') && !/(^|\s)is-doc(\s|$)/.test(m.oldValue || '')) {
          // hoi thoai: token dang mo (.42) duoc viet ro dung luc doc
          if (cl.contains('sk-ht-tok') && !giam() && t.closest('.sk-ht-cau.is-cho-doc')) {
            try { goc.call(t, kfViet(0.42), { duration: VIET_TOK, easing: E_VIET, fill: 'backwards' }); } catch (e) {}
          }
          if (t.matches('.sk-ht-tok.is-nang, .sk-vd-tok.is-key')) danhDau(t, 'doc');
        }
      } else if (m.attributeName === 'style') {
        const p = t.parentElement;
        if (p && p.classList && p.classList.contains('sk-chu-tro')) henTro();
      }
    }
  }

  // ------------------------------------------------------------------ bo loc phan (mep net hoi nham)
  function taoBoLoc(san) {
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('class', 'pc2-defs');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('width', '0');
    s.setAttribute('height', '0');
    s.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    const loc = (id, x, y, w, h) => `<filter id="${id}" x="${x}" y="${y}" width="${w}" height="${h}" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="2" seed="5" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="1.1" xChannelSelector="R" yChannelSelector="G" result="d"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 .1" result="h"/>
        <feComposite in="d" in2="h" operator="in"/>
      </filter>`;
    s.innerHTML = `<defs>${loc('pc2-nham', '-15%', '-25%', '130%', '150%')}${loc('pc2-nham-g', '-4%', '-500%', '108%', '1100%')}</defs>`;
    san.appendChild(s);
    return s;
  }

  // ------------------------------------------------------------------ bat / tat
  function batDau(stageEl) {
    const san = stageEl || document.getElementById('sanKhauGiang');
    if (!san) return false;
    if (ST) { if (ST.san === san) return true; ketThuc(ST.san); }
    ST = { san, hen: new Set(), dau: new Map(), henTroId: null, ro: null, mo: null, defs: null, nhanGoc: null, hu: null, henDat: null };
    try { if (!FONT.link) napPhongChu(); choPhongChu().then(() => { if (ST && ST.san === san) datPhongChu(san, false); }); } catch (e) {}
    try { ST.defs = taoBoLoc(san); } catch (e) {}
    // 1. hieu ung (chi phan tu trong san khau pc2 bi dich)
    if (Element.prototype.animate === goc) Element.prototype.animate = animatePc2;
    // 2. hu.nhan: ve gach phan duoi cho duoc nhan manh
    const SM = W.SenseiMotion;
    if (SM && SM.hu && typeof SM.hu.nhan === 'function' && !SM.hu.nhan.__pc2) {
      const hu = SM.hu, g = hu.nhan;
      const boc = function (el) {
        const r = g.apply(this, arguments);
        try { if (ST && el && el.closest && dangBat(el.closest('.san-khau-giang'))) danhDau(el, 'nhan'); } catch (e) {}
        return r;
      };
      boc.__pc2 = true;
      hu.nhan = boc;
      ST.hu = hu; ST.nhanGoc = g; ST.nhanBoc = boc;
    }
    // 3. quan sat
    if (W.MutationObserver) {
      ST.mo = new MutationObserver(khiDoi);
      ST.mo.observe(san, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'], attributeOldValue: true });
    }
    if (W.ResizeObserver) {
      let h = null;
      ST.ro = new ResizeObserver(() => { clearTimeout(h); h = setTimeout(() => { try { datLaiDau(); } catch (e) {} }, 120); });
    }
    phanLoaiTro(san);
    return true;
  }
  function ketThuc() {
    const s = ST;
    if (!s) return;
    ST = null;
    if (Element.prototype.animate === animatePc2) Element.prototype.animate = goc;
    if (s.hu && s.hu.nhan === s.nhanBoc) s.hu.nhan = s.nhanGoc;
    try { if (s.mo) s.mo.disconnect(); } catch (e) {}
    try { if (s.ro) s.ro.disconnect(); } catch (e) {}
    clearTimeout(s.henDat);
    s.hen.forEach((id) => clearTimeout(id));
    s.hen.clear();
    const san = s.san;
    if (san && san.querySelectorAll) {
      san.querySelectorAll('.pc2-phan, .pc2-defs').forEach((x) => x.remove());
      san.querySelectorAll('.pc2-tro').forEach((x) => x.classList.remove('pc2-tro'));
      san.removeAttribute('data-pc2-chu');
    }
    // link phong chu giu lai (da nap, re; bat lai khong phai tai lai)
    s.dau.clear();
  }

  W.SenseiPhongCach = W.SenseiPhongCach || {};
  W.SenseiPhongCach[TEN] = { batDau, ketThuc, dangBat: () => !!ST };
})();
