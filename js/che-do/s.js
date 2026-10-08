/* ==========================================================================
   Che do san khau S — "Bảng đen lớp học" (port tu ban mau E:/sensei-tam/demo2/s/index.html sang san khau SONG).
   Bang xanh khung go chiem gan het khung hinh; lop hoc (tuong, cua so nang + hoa anh dao, khay phan, ban hoc) chi o mep.
   Moi noi dung duoc VIET BANG PHAN dung luc Sensei noi toi (cue cua dao dien, tt.T - 80 ms = api.tre):
     - chu Han: viet tung net theo thu tu (SenseiStrokes = KanjiVG, CC BY-SA 3.0, js/kanji-strokes.js), que phan chay theo net + bui phan
     - kana / tieng Viet: hien tung don vi (chu Nhat / tu Viet) trai -> phai (clip-path), que phan chay theo
     - anh minh hoa / chan dung = anh in dan len bang bang nam cham; dap an bai tap = the giay + nam cham (the that cung kieu)
     - khung / mui ten / vong tron / dau X ve bang phan mau (stroke-dashoffset)
     - doi nhip = cuc tay lau ngang bang (canh cu bi xoa theo cuc tay, canh moi viet ngay sau cuc tay)
   KHONG phu de / loi nhan xet cua Sensei: chi noi dung bai. Meo that o goc phai duoi NGOAI bang (bang chua goc meo).
   Moc thoi gian: moi o / dong cho cue co du phong (khong o nao trong qua ~3 s), m.het() viet het ngay.
   Hop dong: docs/che-do/HUONG-DAN-API.md. Mau tham khao bo cuc do chu: js/che-do/h.js.
   ========================================================================== */
(function () {
  'use strict';
  const SC = window.SenseiCheDo;
  if (!SC) return;

  const ID = 's';
  const NS = 'http://www.w3.org/2000/svg';
  const HIDE = 'inset(-30% 101% -30% -8%)', SHOW = 'inset(-30% -8% -30% -8%)';
  const DOC_TRO = { 'は': 'wa', 'へ': 'e', 'を': 'o' };
  const ROMAJI_TRO = { 'は': 'wa', 'が': 'ga', 'を': 'o', 'に': 'ni', 'で': 'de', 'と': 'to', 'も': 'mo', 'の': 'no', 'へ': 'e', 'か': 'ka', 'や': 'ya', 'から': 'kara', 'まで': 'made', 'です': 'desu', 'ます': 'masu', 'ね': 'ne', 'よ': 'yo' };
  const DS_TRO = ['は', 'が', 'を', 'に', 'で', 'と', 'も', 'の', 'へ', 'か', 'や', 'から', 'まで', 'ね', 'よ'];
  const RE_JP = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff々〆〜ー]/;
  const RE_KANJI = /[\u3400-\u9fff\uf900-\ufaff々]/;
  const CJK = '\\u3000-\\u30ff\\u3400-\\u9fff\\uf900-\\ufaff\\uff00-\\uffef々〆〜ー';
  const RE_CUM = new RegExp('(\\s+)|([' + CJK + ']+)|([^\\s' + CJK + ']+)', 'g');
  const RE_JPRUN = /[\u3000-\u30ff\u3400-\u9fff\uf900-\ufaff\uff00-\uffef々〆〜ー]+/g;
  const RE_DAU = /^[、。，．,.！？!?・…‥」』）)】〉》「『（(【〈《\s]+$/;
  const RE_MO = /^[([{“‘「『（【〈《]+$/;
  // duoi cau / tro tu dai hon 2 ky tu: khong dung ngat dong truoc chung
  const RE_DUOI = /^(から|まで|より|ので|のに|けど|けれど|でも|だけ|しか|ばかり|など|です|ます|でした|ました|ません|ませんか|ですか|ますか|だった|でしょう|ましょう|ください|じゃ|なかった|たい|ている|ていた|ています|ていません|ほど|くらい|ぐらい|ずつ|こそ|さえ|って|という|といった)$/;
  const RE_CHI_NHAT = new RegExp('^[\\u3040-\\u30ff\\u3400-\\u9fff々〆〜ー\\s・/／]+$');
  const RE_DONG = /^[)\]}”’」』）】〉》.,;:!?、。，．！？…%]+$/;
  const MAU_O = ['xanh', 'la', 'cam', 'hong', 'vang'];
  const SEG = (() => { try { return new Intl.Segmenter('ja', { granularity: 'word' }); } catch (e) { return null; } })();

  // co chu theo vai (px tai he so 1: may tinh = lop 1440x776, dien thoai = 390x679) [lon nhat, nho nhat]
  const VAI = {
    nhan:  { d: [26, 18], p: [16, 13] },
    tu:    { d: [190, 44], p: [92, 26] },
    doc:   { d: [46, 18], p: [24, 14] },
    ro:    { d: [40, 17], p: [22, 14] },
    nghia: { d: [56, 24], p: [30, 17] },
    phu:   { d: [30, 16], p: [18, 13] },
    cau:   { d: [86, 28], p: [42, 19] },
    form:  { d: [92, 30], p: [44, 18] },
    tag:   { d: [22, 15], p: [14, 13] },
    hv:    { d: [100, 40], p: [46, 24] },
    de:    { d: [62, 24], p: [30, 17] },
    bai:   { d: [132, 60], p: [64, 32] },
    the:   { d: [64, 18], p: [34, 14] },
  };

  // ------------------------------------------------------------------ trang thai
  let L = null, C = null, G = null;
  const st = {
    W: 0, H: 0, dt: false, ngan: false, u: 1, meo: null,
    B: null, mg: 20, dc: 0, kich: '',
    bang: null, que: null, tay: null, vet: null, bui: null, dau: null, do: null, doSlot: [],
    canh: null, canhs: [], nhip: null, m: null, api: null, queBan: 0, avt: [], ngay: false,
  };

  // ------------------------------------------------------------------ tien ich
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const kyTu = (s) => Array.from(String(s == null ? '' : s));
  const kep = (x, a, b) => Math.max(a, Math.min(b, x));
  const giam = () => !!(C && C.giam) || st.ngay;
  const nowG = () => (G && G.ticker ? G.ticker.time : 0);
  const viet1 = (s) => { s = String(s || '').trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; };
  const R = (x, y, w, h) => ({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
  const chuTok = (t) => String((t && (t.kanji || t.text)) || '').trim();
  const laDau = (t) => RE_DAU.test(chuTok(t) || ' ');
  const tuNhanVat = (url) => { const m = /nv\/([^/]+)\//.exec(url || '') || /nv-([^./]+)\.\w+$/.exec(url || ''); return m ? m[1] : ''; };
  const mk = (tag, cls, cha, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (cha) cha.appendChild(e); return e; };
  function dat(e, r) {
    if (r.x != null) e.style.left = Math.round(r.x) + 'px';
    if (r.y != null) e.style.top = Math.round(r.y) + 'px';
    if (r.w != null) e.style.width = Math.round(r.w) + 'px';
    if (r.h != null) e.style.height = Math.round(r.h) + 'px';
    return e;
  }
  function tachNgoac(s) {
    const m = /^(.*?)\s*[(（]([^)）]*)[)）]\s*$/.exec(String(s || ''));
    return m ? [m[1].trim(), m[2].trim()] : [String(s || '').trim(), ''];
  }
  function tachNghia(s) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    const trong = [];
    let chinh = s.replace(/\s*[(（]([^)）]*)[)）]\s*/g, (m, a) => { if (a.trim()) trong.push(a.trim()); return ' '; }).replace(/\s+/g, ' ').trim();
    chinh = chinh.replace(/[\s,;:、]+$/, '');
    if (!chinh && trong.length) chinh = trong.shift();
    return { chinh: viet1(chinh), phu: viet1(trong.join('; ')) };
  }
  /** Cat theo TU (khong cat giua tu): toi da n ky tu, them ... */
  function nganTu(s, n) {
    s = String(s || '').trim();
    if (kyTu(s).length <= n) return s;
    const cut = kyTu(s).slice(0, n).join('');
    const k = cut.lastIndexOf(' ');
    return (k > n * 0.5 ? cut.slice(0, k) : cut).replace(/[\s,;:、·(（]+$/, '') + '…';
  }
  function cauThanh(s) { return String(s || '').split(/(?<=[.!?。！？…])\s+/).map((x) => x.trim()).filter(Boolean); }
  function rand(seed) { let a = (seed * 2654435761) >>> 0 || 1; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const jit = (r, s) => (r() - 0.5) * 2 * s;
  /** bo cac cum chu Nhat trong <span lang="ja"> (da escape) */
  const jpBoc = (s) => esc(s).replace(RE_JPRUN, (m) => '<span lang="ja">' + m + '</span>');
  function coNet(ch) { try { const n = window.SenseiStrokes && SenseiStrokes.get ? SenseiStrokes.get(ch) : null; return !!(n && n.length); } catch (e) { return false; } }
  function tachJp(s) {
    if (kyTu(s).length <= 8 || !SEG) return [s];
    const g = [];
    for (const x of SEG.segment(s)) {
      const t = x.segment;
      const tr = g.length ? g[g.length - 1] : '';
      // hiragana tro tu / duoi (<= 3 ky tu, hoac sau tu co chu Han / katakana) dinh vao tu truoc
      const hira = /^[ぁ-ゟ]+$/.test(t) && g.length && (kyTu(t).length <= 3 || /[\u30a0-\u30ff\u3400-\u9fff々]/.test(tr));
      if (g.length && (RE_DAU.test(t) || /^[ぁぃぅぇぉっゃゅょゎァィゥェォッャュョー]/.test(t) || (kyTu(tr).length === 1 && RE_MO.test(tr)) || hira)) g[g.length - 1] += t;
      else g.push(t);
    }
    return g;
  }
  /** Chuoi -> html cac DON VI viet (.k): chu Nhat (cum <= 8 ky tu, dai hon thi tach theo tu ICU), tu Viet; dau mo / dau dong dinh vao don vi canh */
  function donVi(s) {
    s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    const ds = [];
    let m;
    RE_CUM.lastIndex = 0;
    while ((m = RE_CUM.exec(s))) {
      if (m[1]) ds.push({ sp: true });
      else if (m[2]) tachJp(m[2]).forEach((x) => ds.push({ s: x }));
      else ds.push({ s: m[3] });
    }
    const g = [];
    ds.forEach((d) => {
      const tr = g[g.length - 1];
      if (d.sp) { if (tr && !tr.sp) g.push(d); return; }
      if (tr && !tr.sp && (tr.mo || RE_DONG.test(d.s) || RE_DAU.test(d.s))) { tr.s += d.s; tr.mo = RE_MO.test(d.s); return; }
      // dau gach dai (—, –) dung mot minh dinh voi tu ke sau; so thu tu ("1.") dinh voi tu truoc ("Nhom 1.") -> khong rot mot minh o dau / cuoi dong
      const n_ = g.length;
      if (n_ >= 2 && g[n_ - 1].sp && !g[n_ - 2].sp && (/^[—–]$/.test(g[n_ - 2].s) || (/^\d+[.,:)]?$/.test(d.s) && /^[\p{L}]+$/u.test(g[n_ - 2].s)))) { g.pop(); g[g.length - 1].s += ' ' + d.s; return; }
      g.push({ s: d.s, mo: RE_MO.test(d.s) });
    });
    while (g.length && g[g.length - 1].sp) g.pop();
    return g.map((d) => (d.sp ? ' ' : '<span class="k">' + jpBoc(d.s) + '</span>')).join('');
  }
  /** Tieu de dai: tach o ' & ', ' + ', truoc dau ngoac, sau dau gach cheo -> moi doan khong ngat dong (chi xuong dong giua cac doan) */
  function tieuDeHtml(t, moMot) {
    t = String(t == null ? '' : t).replace(/\s+/g, ' ').trim();
    // doan ngat: truoc " & " / " + " / " va " / " hoac " / " vs " / " — ", truoc dau ngoac, sau gach cheo -> moi doan khong ngat dong (cum danh tu khong bi cat doi)
    const ds = t.split(/\s+(?=(?:[&+]|và|hoặc|vs|—)\s)|\s+(?=[(（])|(?<=[/／])\s+/).map((x) => x.trim()).filter(Boolean);
    if (ds.length < 2) return donVi(t);
    // moMot: doan dau duoc xuong dong theo tu (tieu de dai tren man hinh hep: khong ep ca tieu de ve co chu nho)
    return ds.map((x, i) => (moMot && i === 0 ? donVi(x) : '<span class="s-nw">' + donVi(x) + '</span>')).join(' ');
  }
  /** Phan [[chu, lop]] -> html (moi phan mot span co lop) */
  const phanHtml = (ds) => ds.filter((p) => p && p[0] != null && String(p[0]) !== '').map((p) => '<span class="' + (p[1] || '') + '">' + donVi(p[0]) + '</span>').join(' ');

  // ------------------------------------------------------------------ khung + co chu
  /** Co chu toi thieu (px): may tinh 14, dien thoai 13, man hinh rat nho (u < 0,75) 12 */
  const fsSan = () => (st.dt ? (st.u < 0.75 ? 12 : 13) : 14);
  function T(vai, k) {
    const r = VAI[vai][st.dt ? 'p' : 'd'];
    const san = fsSan(), u = st.u * (k || 1);
    return { max: Math.max(san, Math.round(r[0] * u)), min: Math.max(san, Math.round(r[1] * st.u)) };
  }
  function doKhung() {
    const k = C.khung();
    st.W = k.w || L.clientWidth || 1;
    st.H = k.h || L.clientHeight || 1;
    st.dt = st.W < 640 || st.W / st.H < 1.05;
    st.ngan = st.W > st.H * 1.2 && st.H < 430;
    st.meo = C.meo();
    const W = st.W, H = st.H, meo = st.meo;
    if (st.dt) {
      const u = Math.min(W / 390, H / 679);
      st.u = Math.max(0.58, u);
      const f = Math.round(6 * st.u), o = Math.round(4 * st.u);
      const meoTop = meo && meo.w ? meo.y + 36 : H - Math.round(64 * st.u);
      const bx = o + f, by = o + f;
      const bb = Math.min(H - Math.round(30 * st.u), meoTop - Math.round(16 * st.u));
      st.B = R(bx, by, W - 2 * bx, bb - by);
      st.f = f;
      st.mg = Math.round(14 * st.u); st.dc = 0;
    } else {
      const u = Math.min(H / 776, W / 1440);
      st.u = Math.max(0.6, u);
      const f = Math.round(15 * st.u), ox = Math.round(20 * st.u), oy = Math.round(14 * st.u);
      const cot = meo && meo.w ? Math.max(meo.w + Math.round(24 * st.u), Math.round(250 * st.u)) : Math.round(250 * st.u);
      const bx = ox + f, by = oy + f;
      const br = W - cot - f;
      const bb = H - Math.round(92 * st.u);
      st.B = R(bx, by, br - bx, bb - by);
      st.f = f;
      st.mg = Math.round(22 * st.u); st.dc = Math.round(48 * st.u);
    }
    L.style.setProperty('--s-u', st.u.toFixed(4) + 'px');
    if (st.dt) L.dataset.hep = '1'; else delete L.dataset.hep;
    datHop();
    return [W, H, st.dt ? 1 : 0, meo ? Math.round(meo.x) + ',' + Math.round(meo.y) : '-'].join('x');
  }

  // ------------------------------------------------------------------ do chu (DOM an, contain strict)
  /**
   * Hop do chu: lop gia .s-hop[data-che-do=s] > .s-do dat NGOAI <body> (con cua <html>), khong nam trong lop that. Moi lan doi co chu roi doc offsetWidth,
   * trinh duyet tinh lai style CA TRANG neu hop nam trong <body> (cac quy tac :has(...) cua motion-hoi.css, nhat la body.dang-giang:has(...): ~8 ms / lan do, nhan voi ~8 lan tim co
   * moi khoi chu) -> o ngoai <body> chi con ~0,7 ms. Cung quy tac CSS cua s.css, cung bien --s-u / data-hep (datHop), cung text-rendering cua body.
   */
  function hopDo() {
    if (st.hop && st.hop.isConnected) return st.hop.firstChild;
    const h = mk('div', 's-hop');
    h.dataset.cheDo = ID;
    h.setAttribute('aria-hidden', 'true');
    h.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;contain:layout style';
    try { const cs = getComputedStyle(document.body); h.style.textRendering = cs.textRendering; h.style.fontKerning = cs.fontKerning; } catch (e) {}
    mk('div', 's-do', h);
    document.documentElement.appendChild(h);
    st.hop = h;
    datHop();
    return h.firstChild;
  }
  /** Bien --s-u / data-hep cua lop that -> hop do chu */
  function datHop() {
    const h = st.hop;
    if (!h || !L) return;
    h.style.setProperty('--s-u', L.style.getPropertyValue('--s-u'));
    if (L.dataset.hep) h.dataset.hep = L.dataset.hep; else delete h.dataset.hep;
  }
  function doBat(i, html, cls, w, css) {
    let m = st.doSlot[i];
    if (!m || !m.isConnected) { m = mk('div', '', st.do); st.doSlot[i] = m; }
    m.className = 's-do-in ' + (cls || '');
    m.style.cssText = 'max-width:' + Math.max(4, Math.floor(w)) + 'px;' + (css || '');
    if (m._h !== html) { m.innerHTML = html; m._h = html; }
    return m;
  }
  /** Co chu nho: duoi nguong nay chu Viet doi sang font ro net (class s-nho): do va chu that dung CHUNG mot font */
  const nguongNho = () => (st.dt ? 24 : 22);
  function datCo(e, fs) { e.style.fontSize = fs + 'px'; e.classList.toggle('s-nho', fs < nguongNho()); }
  function doCo(m, fs) { datCo(m, fs); return { w: m.offsetWidth, h: m.offsetHeight, sw: m.scrollWidth }; }
  /** Co chu lon nhat trong [mn, mx] de html (lop cls) vua w x h */
  function fit(html, cls, w, h, mx, mn, css) {
    const m = doBat(0, html, cls, w, css);
    const vua = (r) => r.sw <= w + 1 && r.h <= h + 0.5;
    const ok = (f) => vua(doCo(m, f));
    let lo = Math.max(1, Math.floor(mn)), hi = Math.max(lo, Math.floor(mx));
    const r0 = doCo(m, lo);
    if (!vua(r0)) return { fs: lo, w: r0.w, h: r0.h, tran: true };
    if (lo < hi) {
      // uoc luong tu lan do gan nhat (moi co moi = mot lan xep chu lai ~5 ms): mot dong (.mot) rong / cao ti le thuan voi co (tru can duoi: nhan min 14 px); nhieu dong cao ti le ~ co^2.
      // Toi da 3 buoc uoc luong (moi buoc do lai o co vua uoc), roi kiem co ke tiep khong vua, roi chia doi nhu cu trong khoang con lai -> ket qua van la co lon nhat vua, ~4 lan do thay vi ~7
      const mot = /\bmot\b/.test(cls);
      // mot dong: rong / cao la ham gan tuyen tinh cua co (khong qua goc: nhan min 14 px) -> noi suy day cung tu hai lan do gan nhat; nhieu dong: cao ~ co^2
      const ngoai = (a, b, k, T) => (b && b[k] > a[k] ? a.f + (T - a[k]) * (b.f - a.f) / (b[k] - a[k]) : a.f * T / Math.max(1, a[k]));
      let pa = { f: lo, sw: r0.sw, h: r0.h }, pb = null, het = false;
      for (let it = 0; it < 3 && lo < hi; it++) {
        const cur = pb || pa;
        const est = mot ? Math.min(ngoai(pa, pb, 'sw', w + 1), ngoai(pa, pb, 'h', h + 0.5)) : cur.f * Math.sqrt(h / Math.max(1, cur.h));
        const g = Math.min(hi, Math.floor(est));
        if (g <= cur.f) { het = true; break; }
        const rg = doCo(m, g);
        if (vua(rg)) { lo = g; if (pb) pa = pb; pb = { f: g, sw: rg.sw, h: rg.h }; } else { hi = g - 1; break; }
      }
      if (het && lo < hi) { if (ok(lo + 1)) lo += 1; else hi = lo; }
    }
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (ok(mid)) lo = mid; else hi = mid - 1; }
    const r = doCo(m, lo);
    return { fs: lo, w: r.w, h: r.h, tran: false };
  }
  /** Kich thuoc o co chu fs: { w (be ngang hop), h, wt (be ngang chu that - dong dai nhat) } */
  function kt(html, cls, fs, w, css) {
    const m = doBat(0, html, cls, w, css);
    const r = doCo(m, fs);
    return { w: r.w, h: r.h, sw: r.sw, wt: rongThat(m) || r.w };
  }
  function rongThat(m) {
    let l = 1e9, r = -1e9;
    m.querySelectorAll('.k, .s-tok, .s-the-t').forEach((k) => { if (!k.offsetWidth) return; l = Math.min(l, k.offsetLeft); r = Math.max(r, k.offsetLeft + k.offsetWidth); });
    if (r < l) return 0;
    const cs = getComputedStyle(m);
    const wt = Math.ceil(r - l + (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0) + 2);
    // chu xuong dong (text-wrap balance): o hep lai vua chu co the xuong dong khac -> kiem lai, khong vua thi giu be ngang cu
    const h0 = m.offsetHeight, w0 = m.offsetWidth, mw = m.style.maxWidth;
    if (wt >= w0 - 1) return wt;
    m.style.maxWidth = (wt + 2) + 'px';
    const ok = m.offsetHeight <= h0 + 0.5 && m.scrollWidth <= wt + 3;
    m.style.maxWidth = mw;
    return ok ? wt : w0;
  }
  /**
   * Xep DOC cac khoi trong chieu cao H: he so chung s (co = max(mn, mx*s)), lon nhat de vua; phan thua chia deu khoang cach (toi da gMax), con lai can giua.
   * ds: [{ html, cls, w, mx, mn, css }] hoac { ham(fs) -> {w,h}, mx, mn, w }. Tra { ds: [{fs,w,h,y}], tran }
   */
  /** Co chu lon nhat de html nam trong <= n dong o be ngang w */
  function fitDong(html, cls, w, n, mx, mn, css) {
    const a = doBat(30, html, cls, w, css), b = doBat(31, html, cls + ' mot', 20000, css);
    const mb = new Map();
    const ok = (f) => { const ra = doCo(a, f); let hb = mb.get(f); if (hb == null) { hb = doCo(b, f).h; mb.set(f, hb); } return ra.sw <= w + 1 && ra.h <= hb * n + 2; };
    let lo = Math.max(1, Math.floor(mn)), hi = Math.max(lo, Math.floor(mx));
    if (!ok(lo)) return lo;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (ok(mid)) lo = mid; else hi = mid - 1; }
    return lo;
  }
  function xepDoc(ds, H, gMin, gMax) {
    // khoi uu tien it dong (d.dong = so dong, d.san = ti le co toi thieu de giu so dong do): ha co lon nhat cho vua so dong
    ds.forEach((d) => { if (!d.ham && d.dong) { const f = fitDong(d.html, d.cls, d.w, d.dong, d.mx, d.mn, d.css); if (f >= d.mx * (d.san || 0.62)) d.mx = f; } });
    const ms = ds.map((d, i) => (d.ham ? null : doBat(i + 1, d.html, d.cls, d.w, d.css)));
    // nho ket qua theo (khoi, co): cac lan thu gan nhau hay trung co; ghi het co chu roi moi doc (mot lan layout / lan thu)
    const nho = new Map();
    const tai = (s) => {
      const fs_ = ds.map((d) => Math.max(d.mn, Math.floor(d.mx * s)));
      const can = [];
      ds.forEach((d, i) => { if (!nho.has(i + '|' + fs_[i])) can.push(i); });
      can.forEach((i) => { if (ms[i]) datCo(ms[i], fs_[i]); });
      can.forEach((i) => {
        const f = fs_[i];
        if (ds[i].ham) { const r = ds[i].ham(f); nho.set(i + '|' + f, { fs: f, w: r.w, h: r.h, sw: r.w }); }
        else nho.set(i + '|' + f, { fs: f, w: ms[i].offsetWidth, h: ms[i].offsetHeight, sw: ms[i].scrollWidth, wt: 0 });
      });
      return ds.map((d, i) => Object.assign({}, nho.get(i + '|' + fs_[i])));
    };
    // d.them = khoang cach them truoc khoi (khoi co khung ve tay: net khung nhoai ra ngoai khoi vai px)
    const them = ds.map((d, i) => (i > 0 && d.them) || 0), tThem = them.reduce((a, b) => a + b, 0);
    const tong = (rs) => rs.reduce((a, r) => a + r.h, 0) + gMin * Math.max(0, rs.length - 1) + tThem;
    const vua = (rs) => tong(rs) <= H + 0.5 && rs.every((r, i) => r.sw <= ds[i].w + 1);
    let rs = tai(1), tran = false;
    if (!vua(rs)) {
      let lo = 0.02, hi = 1, tot = null;
      for (let k = 0; k < 9; k++) { const mid = (lo + hi) / 2; const r = tai(mid); if (vua(r)) { lo = mid; tot = r; } else hi = mid; }
      if (tot) rs = tot; else { rs = tai(0.02); tran = true; }
    }
    rs.forEach((r, i) => { if (ms[i]) { doCo(ms[i], r.fs); r.wt = rongThat(ms[i]) || r.w; } else r.wt = r.w; });
    const n = rs.length, du = Math.max(0, H - tong(rs));
    const g = n > 1 ? Math.min(gMax, gMin + du / n) : 0;
    const cao = rs.reduce((a, r) => a + r.h, 0) + g * (n - 1) + tThem;
    let y = Math.max(0, (H - cao) / 2);
    rs.forEach((r, i) => { y += them[i]; r.y = Math.round(y); y += r.h + g; });
    return { ds: rs, tran, g };
  }

  // ------------------------------------------------------------------ net phan (SVG)
  function svgEl(tag, at, cha) { const e = document.createElementNS(NS, tag); Object.keys(at || {}).forEach((k) => e.setAttribute(k, at[k])); if (cha) cha.appendChild(e); return e; }
  function chuanBi(p) {
    let Ld = 300;
    try { Ld = Math.ceil(p.getTotalLength()) + 2; } catch (e) { Ld = 300; }
    p.style.strokeDasharray = Ld + ' ' + (Ld + 8);
    p.style.strokeDashoffset = Ld;
    p._L = Ld;
    return Ld;
  }
  /** Do dai gan dung cua duong M / L / Q / C do chinh ta ve (tinh bang so hoc, KHONG goi getTotalLength: moi lan goi ep layout lai ca trang) */
  function doDai(d) {
    const nu = String(d).match(/[MLQC]|-?\d+(?:\.\d+)?/g) || [];
    let i = 0, cmd = '', px = 0, py = 0, tong = 0;
    const lay = () => +nu[i++];
    while (i < nu.length) {
      if (/[MLQC]/.test(nu[i])) cmd = nu[i++];
      if (cmd === 'M') { px = lay(); py = lay(); cmd = 'L'; }
      else if (cmd === 'L') { const x = lay(), y = lay(); tong += Math.hypot(x - px, y - py); px = x; py = y; }
      else if (cmd === 'Q') {
        const cx = lay(), cy = lay(), x = lay(), y = lay();
        tong += (2 * Math.hypot(x - px, y - py) + Math.hypot(cx - px, cy - py) + Math.hypot(x - cx, y - cy)) / 3; px = x; py = y;
      } else if (cmd === 'C') {
        const c1x = lay(), c1y = lay(), c2x = lay(), c2y = lay(), x = lay(), y = lay();
        tong += (Math.hypot(x - px, y - py) + Math.hypot(c1x - px, c1y - py) + Math.hypot(c2x - c1x, c2y - c1y) + Math.hypot(x - c2x, y - c2y)) / 2; px = x; py = y;
      } else break;
    }
    return tong;
  }
  function duong(c, d, cls) {
    // toa do hong (NaN / Infinity do bo cuc rong) khong duoc lam hong ca canh: net suy bien + canh bao mot lan
    if (/NaN|Infinity/.test(d)) { if (!st.canhNaN) { st.canhNaN = 1; console.warn('[s] net ve co toa do khong hop le', String(d).slice(0, 80)); } d = 'M0,0 L0,0'; }
    const p = svgEl('path', { d, class: 'ln ' + (cls || '') }, c.svg);
    // net dut (chu thap trong o luoi): hien bang opacity (dasharray cua CSS giu nguyen)
    if (/\bgach\b/.test(cls || '')) { p.style.opacity = '0'; p._dut = true; p._L = 60; }
    else {
      // do dai tinh bang so hoc (getTotalLength ep layout lai ca trang moi lan goi)
      const Ld = Math.ceil(doDai(d) * 1.04) + 3;
      p.style.strokeDasharray = Ld + ' ' + (Ld + 8);
      p.style.strokeDashoffset = Ld;
      p._L = Ld;
    }
    return p;
  }
  /** Ve lan luot cac net (tong thoi gian dur, chia theo do dai), tre t (giay). Tra thoi diem xong */
  function ve(c, paths, t, dur) {
    paths = (paths || []).filter(Boolean);
    if (!paths.length) return t;
    if (giam()) { paths.forEach((p) => { if (p._dut) p.style.opacity = '1'; else p.style.strokeDashoffset = 0; }); return t; }
    const Ls = paths.map((p) => p._L || chuanBi(p)), sum = Ls.reduce((a, b) => a + b, 0) || 1;
    let tt = t;
    paths.forEach((p, i) => {
      const d = Math.max(0.03, dur * Ls[i] / sum);
      if (p._dut) G.fromTo(p, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: 'none', delay: tt, immediateRender: false });
      else G.fromTo(p, { strokeDashoffset: Ls[i] }, { strokeDashoffset: 0, duration: d, ease: 'none', delay: tt, immediateRender: false });
      tt += d;
    });
    return tt;
  }
  function hop(c, x, y, w, h, cls, seed) {
    const r = rand(seed || 7), o = Math.round((st.dt ? 3 : 6) * st.u), j = st.u;
    return [
      'M' + (x - o) + ',' + (y + jit(r, 2.5 * j)) + ' Q' + (x + w / 2) + ',' + (y + jit(r, 4 * j)) + ' ' + (x + w + o) + ',' + (y + jit(r, 2.5 * j)),
      'M' + (x + w + jit(r, 2.5 * j)) + ',' + (y - o) + ' Q' + (x + w + jit(r, 4 * j)) + ',' + (y + h / 2) + ' ' + (x + w + jit(r, 2.5 * j)) + ',' + (y + h + o),
      'M' + (x + w + o) + ',' + (y + h + jit(r, 2.5 * j)) + ' Q' + (x + w / 2) + ',' + (y + h + jit(r, 4 * j)) + ' ' + (x - o) + ',' + (y + h + jit(r, 2.5 * j)),
      'M' + (x + jit(r, 2.5 * j)) + ',' + (y + h + o) + ' Q' + (x + jit(r, 4 * j)) + ',' + (y + h / 2) + ' ' + (x + jit(r, 2.5 * j)) + ',' + (y - o),
    ].map((d) => duong(c, d, cls));
  }
  function vong(c, cx, cy, rx, ry, cls, seed, a0) {
    const r = rand(seed || 3), n = 30, start = a0 == null ? -2.2 : a0;
    let d = '';
    for (let i = 0; i <= n; i++) {
      const a = start + (i / n) * Math.PI * 2.16;
      const k = 1 + 0.03 * Math.sin(i * 0.9) + jit(r, 0.012) + (i / n) * 0.05;
      d += (i ? ' L' : 'M') + (cx + Math.cos(a) * rx * k).toFixed(1) + ',' + (cy + Math.sin(a) * ry * k).toFixed(1);
    }
    return [duong(c, d, cls)];
  }
  function cheo(c, cx, cy, s, cls) {
    return [duong(c, 'M' + (cx - s) + ',' + (cy - s * 0.92) + ' Q' + (cx + 2) + ',' + (cy - 3) + ' ' + (cx + s) + ',' + (cy + s * 0.95), cls),
      duong(c, 'M' + (cx + s * 0.95) + ',' + (cy - s) + ' Q' + (cx - 3) + ',' + (cy + 2) + ' ' + (cx - s * 0.9) + ',' + (cy + s), cls)];
  }
  function muiTen(c, x1, y1, x2, y2, cls, cong) {
    const mx = (x1 + x2) / 2 + (cong || 0), my = (y1 + y2) / 2 - Math.abs(cong || 0) * 0.3;
    const a = Math.atan2(y2 - my, x2 - mx), h = Math.max(6, 12 * st.u);
    return [duong(c, 'M' + x1 + ',' + y1 + ' Q' + mx + ',' + my + ' ' + x2 + ',' + y2, cls),
      duong(c, 'M' + (x2 - h * Math.cos(a - 0.5)).toFixed(1) + ',' + (y2 - h * Math.sin(a - 0.5)).toFixed(1) + ' L' + x2 + ',' + y2 + ' L' + (x2 - h * Math.cos(a + 0.5)).toFixed(1) + ',' + (y2 - h * Math.sin(a + 0.5)).toFixed(1), cls)];
  }
  function gachSong(c, x, y, w, cls) {
    let d = 'M' + x + ',' + y;
    const n = Math.max(3, Math.round(w / (34 * st.u))), a = 4 * st.u;
    for (let i = 1; i <= n; i++) d += ' Q' + (x + (i - 0.5) * w / n) + ',' + (y + (i % 2 ? -a : a)) + ' ' + (x + i * w / n) + ',' + y;
    return [duong(c, d, cls)];
  }
  /** O luoi tap viet (o luoi tap viet): khung ve tay + chu thap net dut */
  function luoi(c, x, y, s, seed) {
    const ds = hop(c, x, y, s, s, 'mong', seed);
    const p = Math.round(s * 0.06);
    ds.push(duong(c, 'M' + (x + s / 2) + ',' + (y + p) + ' L' + (x + s / 2) + ',' + (y + s - p), 'gach'));
    ds.push(duong(c, 'M' + (x + p) + ',' + (y + s / 2) + ' L' + (x + s - p) + ',' + (y + s / 2), 'gach'));
    return ds;
  }

  // ------------------------------------------------------------------ que phan, bui, cuc tay
  /** Que phan chay qua cac diem [{x,y,t}] (toa do bang, t giay tinh tu bay gio) */
  function queChay(pts, uuTien) {
    if (giam() || !st.que || pts.length < 2) return;
    const now = nowG();
    if (st.queBan > now && !uuTien) return;
    const q = st.que, u = st.u;
    const het = pts[pts.length - 1].t;
    st.queBan = now + het + 0.18;
    G.killTweensOf(q);
    const tl = G.timeline();
    tl.set(q, { x: pts[0].x + 26 * u, y: pts[0].y + 22 * u, opacity: 0 }, 0);
    tl.to(q, { x: pts[0].x, y: pts[0].y, opacity: 1, duration: Math.max(0.03, Math.min(0.08, pts[0].t)), ease: 'power2.out' }, Math.max(0, pts[0].t - 0.08));
    for (let i = 1; i < pts.length; i++) tl.to(q, { x: pts[i].x, y: pts[i].y, duration: Math.max(0.004, pts[i].t - pts[i - 1].t), ease: 'none' }, pts[i - 1].t);
    tl.to(q, { x: '+=' + Math.round(34 * u), y: '+=' + Math.round(26 * u), opacity: 0, duration: 0.16, ease: 'power1.in' }, het);
  }
  function bui(x, y, t, n) {
    if (giam() || !st.bui) return;
    const r = rand(Math.round(x * 7 + y * 13 + t * 100));
    for (let i = 0; i < n; i++) {
      const h = mk('div', 's-hat', st.bui);
      const s = 0.5 + r() * 0.9, D = 0.5 + r() * 0.3;
      G.set(h, { x: x + jit(r, 4 * st.u), y: y + jit(r, 3 * st.u), scale: s, opacity: 0 });
      G.to(h, { x: x + jit(r, 16 * st.u), y: y + (18 + r() * 30) * st.u, scale: s * 0.6, duration: D, ease: 'power1.out', delay: t });
      G.to(h, { opacity: 0.95, duration: 0.05, ease: 'none', delay: t });
      G.to(h, { opacity: 0, duration: D - 0.08, ease: 'power1.in', delay: t + 0.07, onComplete: () => h.remove() });
    }
  }
  function khoi(x0, y0, x1, y1, t, a) {
    if (!st.bui) return;
    const kh = mk('div', 's-khoi', st.bui);
    G.set(kh, { x: x0, y: y0, scale: 0.6, opacity: 0 });
    G.to(kh, { x: x1, y: y1, scale: 1.6, duration: 0.75, ease: 'power1.out', delay: t });
    G.to(kh, { opacity: a, duration: 0.12, ease: 'none', delay: t });
    G.to(kh, { opacity: 0, duration: 0.55, ease: 'power1.in', delay: t + 0.16, onComplete: () => kh.remove() });
  }
  /** Ke hoach lau bang: { dur, x0, x1, tQua(x) } (toa do bang) */
  function keLau(nhanh) {
    const B = st.B, dur = (st.dt ? 0.27 : 0.25) * (nhanh || 1);   // cuc tay nhanh: canh cu / moi chi chong len nhau < 0,2 s
    const x0 = -0.08 * B.w, x1 = B.w * 1.04;
    return { dur, x0, x1, tQua: (x) => dur * kep(((x || 0) - x0) / (x1 - x0), 0, 1) + 0.03 };
  }
  /** Cuc tay lau ngang bang (zic zac), canh cu bi xoa theo mep cuc tay roi go */
  function chayLau(cu, kh, nw) {
    const B = st.B, u = st.u, dur = kh.dur, n = 14;
    // khoi chu cua canh cu: an han khi cuc tay (mep xoa) di qua mep phai; khoi chu cua canh moi: hien khi cuc tay toi mep trai
    // -> canh cu va canh moi khong cung hien chu o mot cho (cung la chuyen canh bang cuc tay xoa that: chu cu da bi xoa thi moi co chu moi)
    const toaX = (e) => { const l = parseFloat(e.style.left); return { e, l: isNaN(l) ? 0 : l, r: (isNaN(l) ? 0 : l) + e.offsetWidth }; };
    const dsCu = Array.from(cu.el.querySelectorAll('.s-c, .s-the, .s-slot')).map(toaX);
    const dsMoi = nw ? Array.from(nw.el.querySelectorAll('.s-c')).map(toaX) : [];
    if (nw) { nw.el.classList.add('s-lau'); nw.el.style.clipPath = 'inset(0px 100% 0px 0px)'; }
    const yL = (s) => B.h * 0.5 + B.h * 0.34 * Math.sin(2 * Math.PI * 1.7 * s + 0.4);
    const tay = st.tay;
    G.killTweensOf(tay);
    G.set(tay, { opacity: 1, x: kh.x0, y: yL(0), rotation: 0, scale: st.dt ? 0.62 : 1 });
    for (let j = 1; j <= n; j++) {
      const s = j / n;
      G.to(tay, { x: kh.x0 + (kh.x1 - kh.x0) * s, y: yL(s), rotation: 6 * Math.cos(2 * Math.PI * 1.7 * s + 0.4), duration: dur / n, ease: 'none', delay: dur * (j - 1) / n });
    }
    G.to(tay, { x: kh.x1 + 120 * u, y: -200 * u, rotation: 14, duration: 0.2, ease: 'power2.in', delay: dur });
    G.set(tay, { opacity: 0, delay: dur + 0.21 });
    const ew = 40 * u, pr = { p: 0 };
    cu.hen.push(G.to(pr, { p: 1, duration: dur, ease: 'none',
      onUpdate: () => {
        const X = kh.x0 + (kh.x1 - kh.x0) * pr.p, canh = X + ew;
        cu.el.style.clipPath = 'inset(0px 0px 0px ' + Math.max(0, Math.round(canh)) + 'px)';
        // canh moi chi hien PHIA SAU cuc tay (ben trai mep xoa): canh cu va canh moi khong bao gio cung hien o mot cho
        if (nw) nw.el.style.clipPath = 'inset(0px ' + Math.max(0, Math.round(B.w - X)) + 'px 0px 0px)';
        dsCu.forEach((o) => { if (!o.h && o.l + 0.8 * (o.r - o.l) <= canh) { o.h = 1; o.e.style.visibility = 'hidden'; } });   // khoi cu: an khi mep xoa qua 80 % be ngang (phan con lai da bi clip)
        dsMoi.forEach((o) => { if (!o.s && o.l + 0.2 * (o.r - o.l) <= X) { o.s = 1; o.e.style.visibility = 'visible'; } });   // khoi moi: hien khi cuc tay qua 20 % be ngang (canh moi chi hien phia sau cuc tay)
      } }));
    G.delayedCall(dur + 0.02, () => { if (nw) { dsMoi.forEach((o) => { if (!o.s) o.e.style.visibility = 'visible'; }); nw.el.classList.remove('s-lau'); nw.el.style.clipPath = ''; } boCanh(cu); });
    const v = st.vet;
    if (v) {
      G.killTweensOf(v);
      G.fromTo(v, { opacity: 0.75, clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: dur, ease: 'none' });
      G.to(v, { opacity: 0, duration: 0.8, ease: 'power1.in', delay: dur + 0.05 });
    }
    const r = rand(Math.round(nowG() * 100) + 7);
    for (let k = 1; k < 7; k++) { const s = k / 7, kx = kh.x0 + (kh.x1 - kh.x0) * s - 30 * u, ky = yL(s); khoi(kx, ky, kx - 24 * u + jit(r, 14 * u), ky + (30 + r() * 24) * u, dur * s, 0.3); }
  }
  /** Lau mot vung nho (doi luot thoai): cuc tay quet ngang vung r (toa do bang), cac phan tu cu bi xoa theo roi go */
  function lauVung(els, r, xong) {
    els = (els || []).filter((e) => e && e.isConnected);
    if (giam() || !els.length) { els.forEach((e) => e.remove()); if (xong) xong(); return 0; }
    const u = st.u, dur = 0.32, n = 6, tay = st.tay;
    G.killTweensOf(tay);
    G.set(tay, { opacity: 1, x: r.x - 20 * u, y: r.y + r.h / 2, rotation: 90, scale: st.dt ? 0.5 : 0.8 });
    for (let j = 1; j <= n; j++) {
      const a = r.x + r.w * j / n;
      G.to(tay, { x: a, y: r.y + r.h / 2 + (j % 2 ? -1 : 1) * Math.min(r.h * 0.3, 40 * u), duration: dur / n, ease: 'none', delay: dur * (j - 1) / n });
    }
    G.to(tay, { x: r.x + r.w + 100 * u, y: -200 * u, rotation: 70, duration: 0.18, ease: 'power2.in', delay: dur });
    G.set(tay, { opacity: 0, delay: dur + 0.19 });
    els.forEach((e) => {
      const ox = parseFloat(e.style.left) || 0, pr = { p: 0 };
      G.killTweensOf(e);
      // don vi chu cu: an han khi cuc tay di qua (phan con lai da bi clip) -> chu cu va chu moi khong bao gio cung "hien" o mot cho
      let ks = [];
      try { ks = Array.from(e.querySelectorAll('.k')).map((k) => { const q = toaDo(k); return { k, x: q.x + q.w * 0.7 }; }); } catch (er) { ks = []; }
      G.to(pr, { p: 1, duration: dur, ease: 'none',
        onUpdate: () => {
          const X = r.x + r.w * pr.p;
          e.style.clipPath = 'inset(0px 0px 0px ' + Math.max(0, Math.round(X - ox)) + 'px)';
          ks.forEach((o) => { if (!o.h && o.x <= X) { o.h = 1; o.k.style.visibility = 'hidden'; } });
        }, onComplete: () => e.remove() });
    });
    for (let k = 1; k < 4; k++) khoi(r.x + r.w * k / 4, r.y + r.h / 2, r.x + r.w * k / 4 - 16 * u, r.y + r.h / 2 + 30 * u, dur * k / 4, 0.26);
    if (xong) G.delayedCall(dur * 0.55, xong);
    return dur;
  }

  // ------------------------------------------------------------------ viet chu bang phan
  function toaDo(e) {
    const b = st.bang.getBoundingClientRect(), r = e.getBoundingClientRect();
    return { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height };
  }
  /**
   * Viet phan tu el (hoac cac con .k cua no) trai -> phai: moi don vi .k clip tu trai sang phai, que phan chay theo. t: tre (giay).
   * dur: tong thoi gian (mac dinh theo so chu). Chi viet mot lan.
   */
  function viet(c, el, t, dur, o) {
    if (!el || el.dataset.viet) return 0;
    o = o || {};
    el.dataset.viet = '1';
    const ks = Array.from(el.querySelectorAll('.k'));
    if (el.classList.contains('k')) ks.unshift(el);
    if (giam() || !ks.length) { el.classList.add('da'); return 0; }
    const ws = ks.map((k) => { const s = k.textContent || ''; return Math.max(1, kyTu(s).reduce((a, ch) => a + (RE_JP.test(ch) ? 1.7 : 1), 0)); });
    const tong = ws.reduce((a, b) => a + b, 0);
    if (dur == null) dur = kep(0.06 + tong * 0.026, 0.12, o.max || 1.1);
    // het nhip: khung cuoi phai du som -> viet nhanh (khong cho tung dong chu cham)
    if (st.gap) { dur = Math.min(dur, 0.3); t = Math.min(t || 0, 0.1); }
    const ds = ws.map((w) => Math.max(0.02, dur * w / tong));
    G.set(ks, { clipPath: HIDE });
    el.classList.add('da');
    const tl = G.timeline({
      delay: Math.max(0, t || 0),
      onStart: () => {
        if (o.cam === false || !el.isConnected) return;
        let tt = 0; const pts = [];
        ks.forEach((k, i) => { const r = toaDo(k); if (r.w > 0) { pts.push({ x: r.x + r.w * 0.06, y: r.y + r.h * 0.64, t: tt }); pts.push({ x: r.x + r.w * 0.94, y: r.y + r.h * 0.58, t: tt + ds[i] }); } tt += ds[i]; });
        queChay(pts);
      },
      onComplete: () => { G.set(ks, { clearProps: 'clipPath' }); },
    });
    let tt = 0;
    ks.forEach((k, i) => { tl.fromTo(k, { clipPath: HIDE }, { clipPath: SHOW, duration: ds[i], ease: 'none', immediateRender: false }, tt); tt += ds[i]; });
    if (c) c.tls.push(tl);
    return dur;
  }
  /** Chu Han viet tung net trong o (x, y, s): tra info */
  function oNet(c, x, y, s, ch) {
    const sv = svgEl('svg', { class: 's-net', viewBox: '0 0 109 109', width: Math.round(s), height: Math.round(s) }, c.phan);
    sv.style.left = Math.round(x) + 'px'; sv.style.top = Math.round(y) + 'px';
    let net = [];
    try { net = (window.SenseiStrokes && SenseiStrokes.get && SenseiStrokes.get(ch)) || []; } catch (e) { net = []; }
    // tao het cac net truoc, DO het do dai (mot lan layout), roi moi GHI dasharray: xen doc / ghi tung net ep layout lai ca trang moi net (~230 ms cho 2 chu Han)
    const paths = net.map((d) => svgEl('path', { d }, sv));
    const Ls = paths.map((p) => { try { return Math.ceil(p.getTotalLength()) + 2; } catch (e) { return 300; } });
    paths.forEach((p, i) => { p.style.strokeDasharray = Ls[i] + ' ' + (Ls[i] + 8); p.style.strokeDashoffset = Ls[i]; p._L = Ls[i]; });
    return { sv, paths, x, y, s, k: s / 109, ve: false };
  }
  function vietNet(c, info, t, tong) {
    if (!info || info.ve) return 0;
    info.ve = true;
    if (giam() || !info.paths.length) { info.paths.forEach((p) => { p.style.strokeDashoffset = 0; }); return 0; }
    const Ls = info.paths.map((p) => p._L), sum = Ls.reduce((a, b) => a + b, 0) || 1, nho = 0.03;
    tong = tong || kep(0.3 + info.paths.length * 0.11, 0.5, 1.7);
    const con = Math.max(0.2, tong - nho * (info.paths.length - 1));
    let tt = 0;
    const pts = [], dsB = [];
    info.paths.forEach((p, i) => {
      const d = Math.max(0.05, con * Ls[i] / sum);
      G.fromTo(p, { strokeDashoffset: Ls[i] }, { strokeDashoffset: 0, duration: d, ease: 'none', delay: t + tt, immediateRender: false });
      for (let j = 0; j <= 4; j++) {
        let q = { x: 0, y: 0 };
        try { q = p.getPointAtLength((Ls[i] - 2) * j / 4); } catch (e) {}
        pts.push({ x: info.x + q.x * info.k, y: info.y + q.y * info.k, t: tt + d * j / 4 });
      }
      let e = { x: 0, y: 0 };
      try { e = p.getPointAtLength(Ls[i] - 2); } catch (er) {}
      dsB.push([info.x + e.x * info.k, info.y + e.y * info.k, tt + d]);
      tt += d + nho;
    });
    c.hen.push(G.delayedCall(Math.max(0, t), () => { queChay(pts, true); dsB.forEach((b) => bui(b[0], b[1], b[2], info.paths.length > 6 ? 1 : 2)); }));
    return tt;
  }

  // ------------------------------------------------------------------ anh dan nam cham
  const NC = ['do', 'xanh', 'vang', 'la'];
  function anh(c, url, r0, rot, ncs) {
    // anh xoay: hop bao ngoai lon hon hop goc -> thu hep hop theo goc xoay de mep ngoai van nam trong vung r0 (le trai / phai can doi)
    const dd = Math.ceil(Math.max(r0.w, r0.h) * Math.sin(Math.abs(rot || 0) * Math.PI / 180) / 2);
    const r = Object.assign({}, r0, { x: r0.x + dd, y: r0.y + dd, w: Math.max(8, r0.w - 2 * dd), h: Math.max(8, r0.h - 2 * dd) });
    const a = dat(mk('div', 's-anh s-an', c.giay), r);
    const o = mk('div', 's-anh-o', a);
    let im = null;
    if (url) { im = mk('img', '', o); im.alt = ''; im.decoding = 'async'; im.draggable = false; im.src = url; }
    G.set(a, { rotation: rot || 0, transformOrigin: '50% 30%' });
    const mags = (ncs || [['do', 0.16], ['xanh', 0.84]]).map((m) => {
      const n = mk('div', 's-nc s-an ' + m[0], c.giay);
      const px_ = r.x + r.w * m[1], py = r.y + 6 * st.u, cx = r.x + r.w / 2, cy = r.y + r.h * 0.3, ar = (rot || 0) * Math.PI / 180;
      dat(n, { x: cx + (px_ - cx) * Math.cos(ar) - (py - cy) * Math.sin(ar), y: cy + (px_ - cx) * Math.sin(ar) + (py - cy) * Math.cos(ar) });
      return n;
    });
    return { e: a, im, mags, r: r0 };
  }
  function dan(p, t) {
    if (!p) return;
    if (giam()) { G.set([p.e].concat(p.mags), { autoAlpha: 1 }); return; }
    // anh chua tai xong: cho (toi da 0,9 s) roi moi dan len, khong de khung giay trang trong hien truoc anh
    const chay = (d) => {
      if (!p.e.isConnected) return;
      G.fromTo(p.e, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.07, ease: 'none', delay: d });
      G.fromTo(p.e, { scale: 1.07, y: -10 * st.u }, { scale: 1, y: 0, duration: 0.2, ease: 'power2.out', delay: d });
      p.mags.forEach((n, i) => {
        G.fromTo(n, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04, ease: 'none', delay: d + 0.1 + i * 0.05 });
        G.fromTo(n, { scale: 1.7 }, { scale: 1, duration: 0.16, ease: 'back.out(2)', delay: d + 0.1 + i * 0.05 });
      });
    };
    const im = p.im;
    if (im && !p.daCho) {
      p.daCho = true;
      const t0 = Date.now();
      let xong = false;
      const tiep = () => { if (xong) return; xong = true; chay(Math.max(0, t - (Date.now() - t0) / 1000)); };
      // anh da nap xong thi cho GIAI MA (decode) roi moi dan: khong hien khung giay + dinh ghim trong luc anh chua len
      if (im.complete && im.naturalWidth) { try { (im.decode ? im.decode() : Promise.resolve()).then(tiep, tiep); } catch (e) { tiep(); } }
      else { im.addEventListener('load', tiep, { once: true }); im.addEventListener('error', tiep, { once: true }); }
      if (st.api && st.api.hen) st.api.hen(tiep, 900); else setTimeout(tiep, 900);
      return;
    }
    chay(t);
  }
  function hien(e, t, d) { if (!e) return; if (giam()) { G.set(e, { autoAlpha: 1 }); return; } G.fromTo(e, { autoAlpha: 0 }, { autoAlpha: 1, duration: d || 0.12, ease: 'none', delay: t || 0 }); }
  /** tieu diem: phong 140 ms ease-out roi tra lai (<= 200 ms vao) */
  function nay(e, t, s) {
    if (!e || giam()) return;
    s = s || 1.06;
    // khoi sat mep bang (chu dai, sat day): phong khong duoc lam chu tran ra ngoai bang -> gioi han he so theo khoang con lai moi phia
    try {
      const b = st.bang.getBoundingClientRect(), q = e.getBoundingClientRect();
      if (q.width > 0 && q.height > 0 && b.width > 0) {
        const mx = Math.max(0, Math.min(q.left - b.left, b.right - q.right) - 3), my = Math.max(0, Math.min(q.top - b.top, b.bottom - q.bottom) - 3);
        s = Math.max(1, Math.min(s, 1 + 2 * mx / q.width, 1 + 2 * my / q.height));
      }
    } catch (er) {}
    G.fromTo(e, { scale: 1 }, { scale: s, duration: 0.14, ease: 'power2.out', delay: t, overwrite: false, immediateRender: false });
    G.fromTo(e, { scale: s }, { scale: 1, duration: 0.4, ease: 'back.out(2)', delay: t + 0.14, overwrite: false, immediateRender: false });
  }

  // ------------------------------------------------------------------ canh (moi nhip mot lop)
  function canhMoi(nhanh) {
    const el = mk('div', 's-canh', null);
    el.style.width = st.B.w + 'px'; el.style.height = st.B.h + 'px';
    st.bang.insertBefore(el, st.bui);
    const giay = mk('div', 's-giay', el), phan = mk('div', 's-phan', el);
    const svg = svgEl('svg', { class: 's-net-lop', width: st.B.w, height: st.B.h, viewBox: '0 0 ' + st.B.w + ' ' + st.B.h }, phan);
    const kh = st.canh && !giam() ? keLau(nhanh) : null;
    const c = { el, giay, phan, svg, rev: {}, mo: {}, xmin: {}, t0: nowG(), tXay: performance.now(), hen: [], tls: [], avt: [], lau: kh, tQua: kh ? kh.tQua : () => 0 };
    st.canhs.push(c);
    return c;
  }
  function canhVao(c) {
    const cu = st.canh && st.canh !== c ? st.canh : null;
    st.canh = c;
    if (cu) { if (c.lau && cu.el.isConnected) chayLau(cu, c.lau, c); else boCanh(cu); }
    st.canhs.slice().forEach((o) => { if (o !== c && o !== cu && !o.pre) boCanh(o); });
  }
  function boCanh(c) {
    if (!c) return;
    try { G.killTweensOf(c.el.querySelectorAll('*')); G.killTweensOf(c.el); } catch (e) {}
    c.hen.forEach((h) => { try { h.kill(); } catch (e) {} });
    c.tls.forEach((t) => { try { t.kill(); } catch (e) {} });
    Object.values(c.mo).forEach((o) => { if (o && o.h) { try { o.h.kill(); } catch (e) {} } });
    (c.avt || []).forEach((ct) => { try { ct.go(); } catch (e) {} });
    c.avt = [];
    try { c.el.remove(); } catch (e) {}
    st.canhs = st.canhs.filter((x) => x !== c);
    if (st.canh === c) st.canh = null;
  }
  /** Len lich hien c.rev[khoa] sau t giay; goi lai voi moc som hon -> doi sang som hon; chay dung 1 lan */
  function moc(c, khoa, t) {
    const fn = c && c.rev && c.rev[khoa];
    if (!fn) return false;
    // canh dung truoc trong khoang nghi (chua vao san khau): chi ghi nho moc som nhat, len lich khi canh vao (nhanVaoCanh)
    if (c.pre) { const tt0 = Math.max(0, t || 0); c.dang = c.dang || {}; if (c.dang[khoa] == null || tt0 < c.dang[khoa]) c.dang[khoa] = tt0; return false; }
    const o = c.mo[khoa] || (c.mo[khoa] = { xong: false, at: null, h: null });
    if (o.xong) return false;
    t = Math.max(0, t || 0);
    // cuc tay lau chua toi cho phan tu nay -> doi no (canh cu van con o do): khong viet len tren chu cu
    const lo = !st.ngay && c.xmin && c.xmin[khoa] != null ? c.t0 + c.xmin[khoa] - nowG() : 0;   // dung lai canh (st.ngay): hien ngay, khong cho cuc tay
    if (lo > t) t = lo;
    const at = nowG() + t;
    if (o.at != null && o.at <= at + 0.001) return false;
    if (o.h) o.h.kill();
    o.at = at;
    const chay = () => { if (o.xong) return; o.xong = true; if (!c.el.isConnected) return; try { fn(); } catch (e) { console.warn('[s] rev ' + khoa, e); } };
    if (t <= 0.001) { o.h = null; chay(); } else o.h = G.delayedCall(t, chay);
    return true;
  }
  function hetCanh(c) { if (c && c.rev) Object.keys(c.rev).forEach((k) => moc(c, k, 0)); }
  /** Dat moc hien khoa sau t giay (+ thoi gian cuc tay toi toa do x): moc som nhat cua khoa cung bi chan boi cuc tay */
  function mocX(c, khoa, t, x) { c.xmin[khoa] = c.tQua(x) + 0.02; return moc(c, khoa, (t || 0) + c.tQua(x)); }
  /** Huy moc dang cho (phan tu da duoc viet bang duong khac, vd karaoke) */
  function huyMoc(c, khoa) { const o = c.mo[khoa] || (c.mo[khoa] = { xong: false, at: null, h: null }); if (o.h) { o.h.kill(); o.h = null; } o.xong = true; }
  const daXong = (c, k) => !!(c && c.mo[k] && c.mo[k].xong);

  // ------------------------------------------------------------------ khoi chu dung chung
  /** Tao khoi chu .s-c (an) o vi tri r (toa do bang) voi co fs */
  function chu(c, html, cls, r, fs, css) {
    const e = mk('div', 's-c ' + (cls || ''), c.phan, html);
    datCo(e, fs);
    if (css) e.style.cssText += css;
    dat(e, { x: r.x, y: r.y, w: r.w != null ? Math.ceil(r.w) + 1 : null });
    if (r.h) e.dataset.fh = Math.round(r.h);
    return e;
  }
  /** Vung noi dung cua bang (toa do bang) tu y0 */
  function vung(y0) {
    const m = st.mg, B = st.B;
    const y = y0 == null ? m : y0;
    return { x: m, y, w: B.w - 2 * m - st.dc, h: B.h - m - y };
  }
  /** Nhan muc goc trai tren (viet phan + gach song vang). Tra y duoi nhan (toa do bang) */
  function nhanMuc(c, ds, phai) {
    const m = st.mg;
    let html = phanHtml(ds);
    const A = vung(0);
    let wPhai = phai ? Math.round(A.w * (st.dt ? 0.32 : 0.26)) : 0;
    let f0 = fit(html, 's-c mot', A.w - wPhai - 12, 200, T('nhan').max, T('nhan').min);
    // nhan dai (ten mau cau dai): bo the bai ben phai; van dai thi rut gon phan cuoi theo tu (nhan chi la tieu muc)
    if (f0.tran && phai) { phai = null; wPhai = 0; f0 = fit(html, 's-c mot', A.w - 12, 200, T('nhan').max, T('nhan').min); }
    for (let lan = 0; (f0.tran || f0.fs < T('nhan').max * 0.85) && lan < 8 && ds.length; lan++) {
      const cuoi = ds[ds.length - 1], n = kyTu(cuoi[0]).length;
      if (n <= 6) break;
      ds = ds.slice(0, -1).concat([[nganTu(cuoi[0], Math.floor(n * 0.8)), cuoi[1]]]);
      html = phanHtml(ds);
      f0 = fit(html, 's-c mot', A.w - 12, 200, T('nhan').max, T('nhan').min);
    }
    const fs = f0.fs;
    const k = kt(html, 's-c mot', fs, A.w - wPhai - 10);
    const y = Math.round(m * (st.dt ? 0.7 : 0.55));
    const e = chu(c, html, 's-c mot s-nhan', { x: m, y, w: Math.min(A.w - wPhai, k.wt + 4) }, fs);
    const g = gachSong(c, m + 4 * st.u, y + k.h + 2 * st.u, Math.max(30, Math.min(k.wt, A.w - wPhai) - 10 * st.u), 'vang mong');
    let eP = null;
    if (phai) {
      const fp = fit(donVi(phai), 's-c mot c-vang', wPhai, 200, Math.round(fs * 0.82), fsSan()).fs;
      const kp = kt(donVi(phai), 's-c mot c-vang', fp, wPhai);
      eP = chu(c, donVi(phai), 's-c mot c-vang', { x: m + A.w - kp.wt, y: y + Math.round((k.h - kp.h) / 2), w: kp.wt + 2 }, fp);
    }
    c.rev.nhan = () => { const d = viet(c, e, 0, 0.3); ve(c, g, d, 0.14); if (eP) viet(c, eP, 0.1, 0.25, { cam: false }); };
    moc(c, 'nhan', c.tQua(m));
    c.nhanEl = e;
    return y + k.h + Math.round((st.dt ? 10 : 16) * st.u);
  }
  const tagBai = (nh) => { const bai = nh.bai || {}; const cd = String(nh.capDo || '').toUpperCase(); return (cd === 'KANA' ? 'Nhập môn' : cd) + ' · Bài ' + (bai.lessonNumber != null ? bai.lessonNumber : ''); };
  /** Khung phan om phan tu e (toa do bang, theo vi tri da dat) */
  function khungQuanh(c, e, w, h, cls, seed, dem) {
    const x = parseFloat(e.style.left) || 0, y = parseFloat(e.style.top) || 0;
    const p = dem == null ? 0 : dem;
    return hop(c, x - p, y - p, w + 2 * p, h + 2 * p, cls, seed);
  }

  // ================================================================== TIEU DE BAI
  function tenBai(bai) {
    const t = String((bai && bai.title) || '');
    const m = /^Bài\s*\d+\s*[:.\-–]\s*(.*)$/i.exec(t);
    const rest = m ? m[1] : t;
    const parts = rest.split(/\s+[—–]\s+/);
    return { ten: parts[0].trim(), phu: (parts[1] || '').trim() };
  }
  function dungTieuDe(nh, c) {
    const bai = nh.bai || {}, dt = st.dt, u = st.u;
    const cd = String(nh.capDo || '').toUpperCase();
    const tb = tenBai(bai);
    const so = bai.lessonNumber != null ? bai.lessonNumber : '';
    let url = bai.sceneImageUrl || null;
    if (!url && cd !== 'KANA') { const v1 = (bai.vocabList || []).find((x) => x && x.imageUrl); if (v1) url = v1.imageUrl; }
    let glyph = [];
    if (!url) {
      glyph = (bai.kanjiList || []).slice(0, 4).map((k) => k && k.character).filter(Boolean);
      if (!glyph.length) glyph = Array.from(new Set((bai.vocabList || []).map((v) => kyTu(String((v && (v.word || v.kanji)) || '').trim())[0]).filter((x) => x && RE_JP.test(x)))).slice(0, 4);
    }
    const A = vung(st.mg);
    const gap = Math.round((dt ? 12 : 34) * u);
    // dai "Hom nay" (viet san tu truoc gio hoc)
    const chips = tb.phu ? tb.phu.split(/\s*\/\s*/).filter(Boolean).slice(0, 7) : [];
    let bandHtml;
    const sepC = '<span class="k sep">・</span>';
    if (chips.length) bandHtml = '<span class="s-nl">Hôm nay:</span> ' + chips.map((x, i) => '<span class="s-chip"><span class="k" lang="ja">' + esc(x) + '</span>' + (i < chips.length - 1 ? sepC : '') + '</span>').join(' ');
    else {
      const sv = [(bai.vocabList || []).length && ((bai.vocabList || []).length + ' từ mới'), (bai.slides || []).length && ((bai.slides || []).length + ' mẫu câu'), (bai.kanjiList || []).length && ((bai.kanjiList || []).length + (cd === 'KANA' ? ' chữ cái' : ' chữ Hán'))].filter(Boolean);
      bandHtml = '<span class="s-nl">Hôm nay:</span> ' + sv.map((x, i) => '<span class="s-chip">' + donVi(x) + (i < sv.length - 1 ? sepC : '') + '</span>').join(' ');
    }
    const padB = Math.round((dt ? 10 : 22) * u);
    // may tinh: dai "Hom nay" dung MOT dong (co chu thu cho vua), khong ngat thanh hai dong ngan lech nhau; khong vua thi hai dong can bang
    let clsB = 's-c mot giua', fB = dt ? { tran: true } : fit(bandHtml, clsB, A.w - 2 * padB, 110 * u, T('phu', 1.6).max, T('phu').min);
    if (fB.tran) { clsB = 's-c can giua'; fB = fit(bandHtml, clsB, A.w - 2 * padB, (dt ? 70 : 110) * u, T('phu', 1.6).max, T('phu').min); }
    const bandH = fB.h + 2 * padB;
    const yBand = A.y + A.h - bandH;
    const eB = chu(c, bandHtml, clsB, { x: A.x + padB, y: yBand + padB, w: A.w - 2 * padB }, fB.fs);
    const kB = hop(c, A.x, yBand, A.w, bandH, '', 21);
    const H1 = yBand - A.y - gap;
    // anh / o chu (bai khong anh)
    let pr, p = null, gl = null, Rr;
    if (!dt) {
      const s = Math.round(Math.min(H1, A.w * 0.42));
      pr = R(A.x, A.y + (H1 - s) / 2, s, s);
      Rr = R(A.x + s + gap, A.y, A.w - s - gap, H1);
    } else {
      const s = Math.round(Math.min(A.w * 0.5, H1 * 0.45));
      pr = R(A.x, A.y, s, s);
      Rr = R(A.x + s + gap, A.y, A.w - s - gap, s);
    }
    if (url) p = anh(c, url, pr, -2.2, [['do', 0.15], ['xanh', 0.85]]);
    else if (glyph.length) {
      const n = glyph.length, cols = n > 2 ? 2 : n, rows = Math.ceil(n / cols), g = Math.floor(Math.min(pr.w / cols, pr.h / rows) * 0.92);
      gl = glyph.map((ch, i) => {
        const x = pr.x + (pr.w - cols * g) / 2 + (i % cols) * g, y = pr.y + (pr.h - rows * g) / 2 + Math.floor(i / cols) * g;
        const lw = luoi(c, x + g * 0.04, y + g * 0.04, g * 0.92, 30 + i);
        const e = chu(c, '<span class="k">' + esc(ch) + '</span>', 's-c jp mot', { x: x + g * 0.04, y: y + g * 0.04 + g * 0.92 * 0.06, w: g * 0.92 }, Math.round(g * 0.66 / Math.max(1, kyTu(ch).length * 0.82)), 'text-align:center;line-height:' + (kyTu(ch).length > 1 ? 1.8 : 1.2));
        const info = RE_KANJI.test(ch) && coNet(ch) ? oNet(c, x + g * 0.12, y + g * 0.12, g * 0.76, ch) : null;
        if (info) e.style.visibility = 'hidden';
        return { lw, e, info };
      });
    }
    // cot phai: [N5 + Bai N] [ten bai]
    const capTxt = cd === 'KANA' ? 'Nhập môn' : cd;
    const hBai = '<span class="k">Bài</span> <span class="k">' + esc(so) + '</span>';
    const fBai = T('bai'), fDe = T('de', dt ? 1.5 : 1);
    const r1 = dt ? Rr : R(Rr.x, Rr.y, Rr.w, Rr.h * 0.42);
    // vong cap do (N5 / Nhap mon) do truoc, "Bai N" vua phan con lai cua hang
    const fc = Math.max(st.dt ? 14 : 18, Math.round(fBai.max * (kyTu(capTxt).length > 3 ? 0.3 : 0.42)));
    const kc = kt(donVi(capTxt), 's-c mot c-xanh', fc, r1.w);
    const rx = Math.round(Math.max(kc.wt * 0.6 + 6 * u, kc.h * 0.62)), ry = Math.round(Math.max(kc.h * 0.7, Math.min(rx, kc.h)));
    const fb = fit(hBai, 's-c mot', dt ? r1.w : r1.w - 2 * rx - 30 * u, r1.h * (dt ? 0.5 : 0.9), fBai.max, fBai.min);
    let yb, xb, xc, yc;
    if (!dt) {
      const wHang = rx * 2 + Math.round(24 * u) + fb.w;
      xc = Rr.x + Math.max(0, (Rr.w - wHang) / 2) + rx; yc = r1.y + r1.h / 2;
      xb = xc + rx + Math.round(24 * u); yb = yc - fb.h / 2;
    } else {
      xc = Rr.x + Rr.w / 2; yc = Rr.y + ry + 6 * u;
      xb = Rr.x + (Rr.w - fb.w) / 2; yb = Math.min(Rr.y + Rr.h - fb.h, yc + ry + 8 * u);
    }
    const eC = chu(c, donVi(capTxt), 's-c mot c-xanh', { x: xc - kc.wt / 2, y: yc - kc.h / 2, w: kc.wt }, fc);
    const vC = vong(c, xc, yc, rx, ry, 'xanh', 11);
    const eBai = chu(c, hBai, 's-c mot', { x: xb, y: yb, w: fb.w }, fb.fs);
    // ten bai
    let r2;
    if (!dt) r2 = R(Rr.x, Rr.y + r1.h, Rr.w, Rr.h - r1.h);
    else { const y2 = Math.max(pr.y + pr.h, Rr.y + Rr.h) + gap; r2 = R(A.x, y2, A.w, yBand - gap - y2); }
    let hDe = tieuDeHtml(tb.ten || bai.title || '');
    let fd = fit(hDe, 's-c can giua', r2.w, r2.h, fDe.max, fDe.min);
    // doan dau qua dai (khong ngat) ep ca tieu de ve co nho: cho doan dau xuong dong theo tu neu duoc co lon hon han
    if (fd.fs < fDe.max * 0.72) {
      const h2 = tieuDeHtml(tb.ten || bai.title || '', true), f2 = fit(h2, 's-c can giua', r2.w, r2.h, fDe.max, fDe.min);
      if (!f2.tran && f2.fs >= fd.fs * 1.25) { hDe = h2; fd = f2; }
    }
    if (fd.tran) { hDe = donVi(tb.ten || bai.title || ''); fd = fit(hDe, 's-c can giua', r2.w, r2.h, fDe.max, fDe.min); }
    const eDe = chu(c, hDe, 's-c can giua', { x: r2.x + (r2.w - fd.w) / 2, y: r2.y + (r2.h - fd.h) / 2, w: fd.w }, fd.fs);
    // moc (mo dau buoi giang: khong co cuc tay)
    c.rev.band = () => { eB.classList.add('da'); eB.dataset.viet = '1'; ve(c, kB, 0, 0.25); };
    c.rev.anh = () => { if (p) dan(p, 0); if (gl) gl.forEach((g, i) => { ve(c, g.lw, 0.04 * i, 0.22); if (g.info) vietNet(c, g.info, 0.2 + 0.1 * i, 0.4); else viet(c, g.e, 0.2 + 0.1 * i, 0.25); }); };
    c.rev.cap = () => { const d = ve(c, vC, 0, 0.22); viet(c, eC, d, 0.14); };
    c.rev.bai = () => viet(c, eBai, 0, 0.3);
    c.rev.de = () => viet(c, eDe, 0, 0.6);
    // mo dau buoi giang: moi phan viet xong trong ~1,2 s (title dai: khong de chu con dang viet do dac luc Sensei bat dau noi)
    moc(c, 'band', 0);
    moc(c, 'anh', 0.05);
    moc(c, 'cap', 0.15);
    moc(c, 'bai', 0.35);
    moc(c, 'de', 0.6);
  }

  // ================================================================== TU VUNG
  function dungTuVung(nh, c) {
    const v = nh.data || {}, co = nh.chuong || {}, dt = st.dt, u = st.u;
    const tu = String(v.kanji || v.word || '').trim();
    const coRuby = !!(v.kanji && v.furigana && v.furigana !== v.kanji);
    const doc = coRuby ? String(v.furigana) : (v.word && v.word !== tu ? String(v.word) : '');
    const romaji = String(v.romaji || '').trim();
    const ng = tachNghia(v.meaningVi);
    const loai0 = C.loaiTu(v.wordType) || '';
    const loai = kyTu(loai0).length <= 14 ? loai0 : '';
    const luu = String(v.accentNote || '').trim();
    const url = v.imageUrl || null;
    const ds0 = [['Từ vựng', ''], [(co.i || nh.i + 1) + ' / ' + (co.n || nh.n), 'c-vang']];
    if (loai) ds0.push(['· ' + loai, 'c-xanh']);
    const yTop = nhanMuc(c, ds0, tagBai(nh));
    const A = vung(yTop);
    const gap = Math.round((dt ? 10 : 36) * u);
    const net = kyTu(tu).length <= 4 && kyTu(tu).every((ch) => RE_KANJI.test(ch) && coNet(ch));
    const nN = kyTu(tu).length;
    const fT = T('tu'), fD = T('doc'), fR = T('ro'), fNg = T('nghia'), fP = T('phu');
    // cac khoi
    const bDoc = doc ? { k: 'doc', html: donVi(doc), cls: 's-c jp c-vang giua can', mx: fD.max, mn: fD.min, dong: 1, san: 0.5 } : null;
    const bTu = net ? { k: 'tu', net: true, mx: Math.round(fT.max * 1.15), mn: Math.max(fT.min, Math.round(64 * u)) } : { k: 'tu', html: donVi(tu), cls: 's-c jp giua can', mx: fT.max, mn: fT.min, dong: 1, san: nN > 6 ? 0.5 : 0.01 };
    const bRo = romaji ? { k: 'ro', html: donVi(romaji), cls: 's-c giua can', mx: fR.max, mn: fR.min, css: 'font-weight:600' } : null;
    const hNg = '<span class="s-nl">' + donVi('nghĩa') + '</span><span class="s-ng">' + donVi(ng.chinh || v.meaningVi || '') + '</span>';
    // dien thoai: cac khoi duoi (nghia, phu, luu y) duoc phep to hon neu con cho (xepDoc chi dung co lon nhat vua) -> bot khoang trong
    const kP = dt ? 1.3 : 1;
    const bNg = { k: 'ng', html: hNg, cls: 's-c giua can', mx: Math.round(fNg.max * (dt ? 1.6 : 1)), mn: fNg.min, dong: 1 };
    const bPhu = ng.phu ? { k: 'phu', html: donVi(ng.phu), cls: 's-c giua can c-trang', mx: Math.round(fP.max * 1.05 * kP), mn: fP.min } : null;
    const bLuu = luu ? { k: 'luu', html: '<span class="s-nl s-luu-n">' + donVi('♪') + '</span><span class="s-luu-t">' + donVi(luu) + '</span>', cls: 's-c dep', mx: Math.round(fP.max * kP), mn: fP.min, css: 'padding:.45em .8em', them: Math.round(10 * u) } : null;
    const lamNet = (b, w) => { b.w = w; b.ham = (f) => { const g = Math.min(f, (w - (nN - 1) * f * 0.08) / nN); return { w: nN * g + (nN - 1) * g * 0.08, h: g }; }; return b; };
    const els = {};
    const dungKhoi = (ds, Rg, gMin, gMax) => {
      ds.forEach((b) => { b.w = b.w || Rg.w; if (b.net) lamNet(b, Rg.w); });
      const x = xepDoc(ds, Rg.h - (ds.some((b) => b.k === 'luu') ? Math.round(8 * u) : 0), gMin, gMax);
      ds.forEach((b, i) => {
        const r = x.ds[i];
        if (b.net) {
          const g = Math.min(r.fs, (Rg.w - (nN - 1) * r.fs * 0.08) / nN), w = nN * g + (nN - 1) * g * 0.08;
          const x0 = Rg.x + (Rg.w - w) / 2;
          els.net = kyTu(tu).map((ch, i2) => { const gx = x0 + i2 * g * 1.08; return { lw: luoi(c, gx, Rg.y + r.y, g, 30 + i2), info: oNet(c, gx + g * 0.07, Rg.y + r.y + g * 0.07, g * 0.86, ch) }; });
          els.tuR = { x: x0, y: Rg.y + r.y, w, h: g };
          return;
        }
        const w = b.k === 'luu' ? Math.min(Rg.w, r.wt + 2) : r.w;
        els[b.k] = chu(c, b.html, b.cls, { x: Rg.x + (Rg.w - w) / 2, y: Rg.y + r.y, w, h: r.h }, r.fs, b.css);
        if (b.k === 'luu') els.luuK = khungQuanh(c, els.luu, w, r.h, 'hong mong', 61);
      });
      return x;
    };
    let p = null;
    if (!dt) {
      let Rg = A;
      if (url) {
        const s = Math.round(Math.min(A.h * 0.94, A.w * 0.40));
        p = anh(c, url, R(A.x, A.y + (A.h - s) / 2, s, s), (nh.i % 2 ? 1.8 : -2.2), [[NC[nh.i % 4], 0.16], [NC[(nh.i + 2) % 4], 0.84]]);
        Rg = R(A.x + s + gap, A.y, A.w - s - gap, A.h);
      }
      dungKhoi([bDoc, bTu, bRo, bNg, bPhu, bLuu].filter(Boolean), Rg, Math.round(8 * u), Math.round(40 * u));
    } else {
      // dien thoai: hang tren = anh + (cach doc, tu, romaji) khi tu ngan; tu dai -> anh + nghia, tu xuong duoi full ngang
      let yRest = A.y;
      if (url) {
        const ngan = (net || nN <= 5) && kyTu(doc).length <= 6;
        // anh to theo phan con lai sau nhom duoi (do o co lon nhat) -> khong de khoang trong lon
        const duoiDs = (ngan ? [bNg, bPhu, bLuu] : [bDoc, bTu, bRo, bLuu]).filter(Boolean);
        duoiDs.forEach((b_) => { b_.w = A.w; if (b_.net) lamNet(b_, A.w); });
        const xd = xepDoc(duoiDs, 1e5, Math.round(8 * u), Math.round(8 * u));
        const hD = xd.ds.reduce((a_, r_) => a_ + r_.h, 0) + Math.round(8 * u) * Math.max(0, xd.ds.length - 1);
        const s = Math.round(kep(A.h - hD - gap * 3, A.w * 0.42, Math.min(A.w * 0.58, A.h * 0.5)));
        p = anh(c, url, R(A.x, A.y, s, s), -2, [[NC[nh.i % 4], 0.5]]);
        const Rr = R(A.x + s + gap, A.y, A.w - s - gap, s);
        if (ngan) {
          dungKhoi([bDoc, bTu, bRo].filter(Boolean), Rr, 4, Math.round(14 * u));
          const Rb = R(A.x, A.y + s + gap, A.w, A.h - s - gap);
          dungKhoi([bNg, bPhu, bLuu].filter(Boolean), Rb, Math.round(8 * u), Math.round(56 * u));
        } else {
          // cot hep ben canh anh: nghia khong phong to (xuong dong nhieu)
          dungKhoi([Object.assign({}, bNg, { mx: fNg.max }), bPhu && Object.assign({}, bPhu, { mx: Math.round(fP.max * 1.05) })].filter(Boolean), Rr, 4, Math.round(14 * u));
          const Rb = R(A.x, A.y + s + gap, A.w, A.h - s - gap);
          dungKhoi([bDoc, bTu, bRo, bLuu].filter(Boolean), Rb, Math.round(8 * u), Math.round(56 * u));
        }
        yRest = null;
      }
      if (yRest != null) dungKhoi([bDoc, bTu, bRo, bNg, bPhu, bLuu].filter(Boolean), A, Math.round(8 * u), Math.round(30 * u));
    }
    // moc: nhan / anh / luoi / nhan "nghia" / khung luu y ngay khi vao; tu, cach doc, nghia theo cue (co du phong)
    const tq = (e) => c.tQua(e ? parseFloat(e.style.left) || 0 : 0);
    c.rev.anh = () => dan(p, 0);
    c.rev.khung = () => { if (els.net) els.net.forEach((n, i) => ve(c, n.lw, 0.06 * i, 0.3)); };
    c.rev.tu = () => {
      if (els.net) { let t = 0; els.net.forEach((n) => { t += vietNet(c, n.info, t, Math.min(0.7, kep(0.3 + n.info.paths.length * 0.11, 0.5, 1.7))) + 0.08; }); }
      else viet(c, els.tu, 0, null, { max: 0.8 });
    };
    c.rev.doc = () => { viet(c, els.doc, 0, null, { cam: false, max: 0.4 }); viet(c, els.ro, 0.08, null, { max: 0.4 }); };
    c.rev.ng = () => { if (els.ng) { viet(c, els.ng.querySelector('.s-nl'), 0, 0.14, { cam: false }); viet(c, els.ng.querySelector('.s-ng'), 0.08, null, { max: 0.5 }); } if (els.phu) viet(c, els.phu, 0.4, null, { cam: false, max: 0.6 }); };
    // khung + dau nhac + chu luu y ve CUNG LUC (khong de khung trong cho cue V4)
    c.rev.luu = () => { if (els.luu) { ve(c, els.luuK, 0, 0.3); viet(c, els.luu.querySelector('.s-luu-n'), 0.12, 0.1, { cam: false }); viet(c, els.luu.querySelector('.s-luu-t'), 0.24, null, { max: 1.0 }); } };
    mocX(c, 'anh', 0.05, p ? p.r.x + p.r.w : 0);
    mocX(c, 'khung', 0.12, A.x + A.w * 0.4);
    mocX(c, 'tu', 0.9, els.tuR ? els.tuR.x : tq(els.tu));
    mocX(c, 'doc', 1.4, A.x + A.w * 0.6);
    mocX(c, 'ng', 3.2, A.x + A.w * 0.5);
    mocX(c, 'luu', 4.4, A.x + A.w * 0.4);
    c.vocab = { els, p };
  }
  function cueTuVung(m, id, tt, api, nh, c) {
    const t = api.tre(tt), V = c.vocab;
    if (!V) return;
    const e = V.els;
    if (id === 'V1' || id === 'V2' || id === 'V2b') {
      moc(c, 'tu', t);
      moc(c, 'doc', t + 0.3);
      if (id === 'V1') moc(c, 'ng', t + 1.8);
      if (daXong(c, 'tu') && id !== 'V1') nay(e.tu || (V.p && V.p.e), t, 1.05);
    } else if (id === 'V3') { moc(c, 'ng', t); nay(e.ng, t + 0.02, 1.04); }
    else if (id === 'V4' || id === 'V5') { if (e.luu) { moc(c, 'luu', t); } }
  }

  // ================================================================== CHU HAN / CHU CAI
  function dungChuHan(nh, c) {
    const d = nh.data || {}, co = nh.chuong || {}, dt = st.dt, u = st.u;
    const kana = !!nh.laKana;
    const ch = String(d.character || '');
    const on = (Array.isArray(d.onyomi) ? d.onyomi : d.onyomi ? [d.onyomi] : []).filter(Boolean).slice(0, 3);
    const kun = (Array.isArray(d.kunyomi) ? d.kunyomi : d.kunyomi ? [d.kunyomi] : []).filter(Boolean).slice(0, 3);
    const tus = (Array.isArray(d.commonWords) ? d.commonWords : []).slice(0, 3);
    const ten = kana ? String(d.romaji || '') : String(d.hanViet || '');
    const ng = tachNghia(d.meaningVi);
    const yTop = nhanMuc(c, [[kana ? 'Chữ cái' : 'Chữ Hán', ''], [(co.i || nh.i + 1) + ' / ' + (co.n || nh.n), 'c-vang']].concat(!kana && d.strokeCount ? [['· ' + d.strokeCount + ' nét', 'c-xanh']] : (kana && d.bangChu ? [['· ' + d.bangChu, 'c-xanh']] : [])), tagBai(nh));
    const A = vung(yTop);
    const gap = Math.round((dt ? 10 : 36) * u);
    const fH = T('hv'), fNg = T('nghia'), fP = T('phu');
    // khoi ben phai
    const bHv = { k: 'hv', html: '<span class="s-nl">' + donVi(kana ? 'đọc là' : 'Hán Việt') + '</span><span class="s-hv">' + donVi(kana ? ten : ten.toUpperCase()) + '</span>', cls: 's-c c-vang can', mx: fH.max, mn: fH.min };
    const ds = [bHv];
    if (!kana) {
      ds.push({ k: 'ng', html: '<span class="s-nl">' + donVi('nghĩa') + '</span><span class="s-ng">' + donVi(ng.chinh + (ng.phu ? ' (' + ng.phu + ')' : '')) + '</span>', cls: 's-c can', mx: fNg.max, mn: fNg.min, dong: 1 });
      const am = [];
      if (on.length) am.push('<div class="s-am"><span class="s-nl c-xanh">' + donVi('ON') + '</span><span class="s-am-t" data-am="on">' + donVi(on.join('、')) + '</span></div>');
      if (kun.length) am.push('<div class="s-am"><span class="s-nl c-la">' + donVi('KUN') + '</span><span class="s-am-t" data-am="kun">' + donVi(kun.join('、')) + '</span></div>');
      if (am.length) ds.push({ k: 'am', html: am.join(''), cls: 's-c', mx: Math.round(fNg.max * (dt ? 1 : 0.82)), mn: fP.min, css: 'line-height:1.3' });
    } else {
      if (d.meaningVi) ds.push({ k: 'ng', html: '<span class="s-nl">' + donVi('Cách đọc') + '</span><span class="s-ng">' + donVi(String(d.meaningVi)) + '</span>', cls: 's-c dep', mx: Math.round(fP.max * 1.05), mn: fP.min });
      if (d.meoNho) ds.push({ k: 'meo', html: '<span class="s-nl c-la">' + donVi('Mẹo nhớ') + '</span><span class="s-ng">' + donVi(String(d.meoNho)) + '</span>', cls: 's-c dep', mx: fP.max, mn: fP.min, css: 'padding:.4em .7em', khung: 'la', them: Math.round(12 * u) });
      if (d.sosanh) ds.push({ k: 'ss', html: '<span class="s-nl c-hong">' + donVi('Dễ nhầm') + '</span><span class="s-ng">' + donVi(String(d.sosanh)) + '</span>', cls: 's-c dep', mx: fP.max, mn: fP.min, css: 'padding:.4em .7em', khung: 'hong', them: Math.round(12 * u) });
    }
    if (tus.length) {
      const dong = tus.map((w, i) => '<div class="s-tu-d" data-i="' + i + '"><span class="k s-tu-w" lang="ja">' + C.ruby(w.word || '', w.furigana || '') + '</span><span class="s-tu-m"><span class="k s-eq">=</span>' + donVi(w.meaningVi || '') + '</span></div>').join('');
      ds.push({ k: 'tus', html: '<div class="s-nl s-tus-n">' + donVi(kana ? 'Từ ví dụ' : 'Từ thường gặp') + '</div>' + dong, cls: 's-c s-cau', mx: Math.round(fNg.max * (dt ? 1 : 0.8)), mn: fP.min, css: 'line-height:1.5' });
    }
    // o luoi + chu
    let Rg, box;
    if (!dt) {
      const nGhi = kyTu(String(d.meoNho || '') + String(d.sosanh || '') + String(d.meaningVi || '')).length;
      const s = Math.round(Math.min(A.h, A.w * (kana ? (nGhi > 220 ? 0.25 : 0.32) : 0.40)));
      box = R(A.x, A.y + (A.h - s) / 2, s, s);
      Rg = R(A.x + s + gap, A.y, A.w - s - gap, A.h);
    } else {
      const s = Math.round(Math.min(A.w * 0.44, A.h * 0.3));
      box = R(A.x, A.y, s, s);
      Rg = null;
    }
    const lw = luoi(c, box.x, box.y, box.w, 40);
    let info = null, eKana = null;
    if (!kana && RE_KANJI.test(ch) && coNet(ch)) info = oNet(c, box.x + box.w * 0.07, box.y + box.w * 0.07, box.w * 0.86, ch);
    else eKana = chu(c, '<span class="k">' + esc(ch) + '</span>', 's-c jp mot', { x: box.x, y: box.y + box.w * 0.08, w: box.w }, Math.round(box.w * 0.72 / Math.max(1, kyTu(ch).length * 0.86)), 'text-align:center;line-height:' + (kyTu(ch).length > 1 ? 1.75 : 1.2));
    const els = {};
    // be ngang cot (chung mot mep trai) + be ngang CHUNG cua cac o co khung (khung xep chong cung rong, cung thang hang hai mep)
    const canCot = (Rx, bs, xs) => {
      Rx.wCot = Math.max(0, ...xs.ds.map((r) => Math.min(Rx.w, r.wt + 2)));
      Rx.wKhung = Math.max(0, ...bs.map((b, i) => (b.khung ? Math.min(Rx.w, xs.ds[i].wt + 2) : 0)));
    };
    const dat1 = (b, r, Rx) => {
      // cot phai can TRAI chung mot mep (cac dong thang hang nhu chu viet tren bang)
      const w = Math.min(Rx.w, b.khung ? Math.max(Rx.wKhung || 0, r.wt + 2) : r.wt + 2);
      const x = Rx.trai ? Rx.x : Rx.x + (Rx.w - Rx.wCot) / 2;
      // o co khung: chu can GIUA theo chieu doc trong khung (be ngang rong hon co the bot mot dong)
      els[b.k] = b.khung ? chu(c, '<div>' + b.html + '</div>', b.cls + ' s-o', { x, y: Rx.y + r.y, w, h: r.h }, r.fs, (b.css || '') + ';height:' + Math.round(r.h) + 'px')
        : chu(c, b.html, b.cls, { x, y: Rx.y + r.y, w, h: r.h }, r.fs, b.css);
      if (b.khung) els[b.k + 'K'] = khungQuanh(c, els[b.k], w, r.h, b.khung + ' mong', 70 + ds.indexOf(b));
    };
    if (!dt) {
      ds.forEach((b) => { b.w = Rg.w; });
      const x = xepDoc(ds, Rg.h, Math.round(8 * u), Math.round(34 * u));
      canCot(Rg, ds, x);
      ds.forEach((b, i) => dat1(b, x.ds[i], Rg));
    } else {
      const Rr = R(box.x + box.w + gap, box.y, A.w - box.w - gap, box.h);
      const tren = ds.filter((b) => b.k === 'hv' || (!kana && b.k === 'ng'));
      const duoi = ds.filter((b) => tren.indexOf(b) < 0);
      tren.forEach((b) => { b.w = Rr.w; });
      const x1 = xepDoc(tren, Rr.h, 4, Math.round(12 * u));
      canCot(Rr, tren, x1);
      tren.forEach((b, i) => dat1(b, x1.ds[i], Rr));
      const Rb = R(A.x, box.y + box.h + gap, A.w, A.h - box.h - gap);
      Rb.trai = true;
      duoi.forEach((b) => { b.w = Rb.w; });
      const x2 = xepDoc(duoi, Rb.h, Math.round(8 * u), Math.round(26 * u));
      canCot(Rb, duoi, x2);
      duoi.forEach((b, i) => dat1(b, x2.ds[i], Rb));
    }
    // o luoi ve ngay; nhan (Han Viet / nghia / ON / KUN / tu thuong gap) viet CUNG luc voi gia tri cua no -> khong co nhan mo coi cho cue
    c.rev.khung = () => { ve(c, lw, 0, 0.32); };
    const vietNhan = (box_, t) => { const nl = box_ && box_.querySelector('.s-nl'); if (nl) viet(c, nl, t, 0.14, { cam: false }); };
    // o meo nho / de nham (kana): khung + nhan + chu ve cung luc voi noi dung
    const khungKana = (k) => { if (!els[k]) return 0; ve(c, els[k + 'K'], 0, 0.3); viet(c, els[k].querySelector('.s-nl'), 0.12, 0.15, { cam: false }); return 0.26; };
    c.rev.net = () => { if (info) vietNet(c, info, 0, Math.max(1.8, 0.3 * info.paths.length)); else if (eKana) viet(c, eKana, 0, 0.6); };
    c.rev.hv = () => { vietNhan(els.hv, 0); viet(c, els.hv && els.hv.querySelector('.s-hv'), 0.12, 0.4); };
    c.rev.ng = () => { vietNhan(els.ng, 0); viet(c, els.ng && els.ng.querySelector('.s-ng'), 0.12, null, { max: 1.1 }); };
    const vietAm = (k) => { const t_ = els.am && els.am.querySelector('[data-am="' + k + '"]'); if (!t_) return; vietNhan(t_.parentNode, 0); viet(c, t_, 0.1, 0.4); };
    c.rev.on = () => vietAm('on');
    c.rev.kun = () => vietAm('kun');
    c.rev.meo = () => { const t = khungKana('meo'); viet(c, els.meo && els.meo.querySelector('.s-ng'), t, null, { max: 1.1 }); };
    c.rev.ss = () => { const t = khungKana('ss'); viet(c, els.ss && els.ss.querySelector('.s-ng'), t, null, { max: 1.1 }); };
    tus.forEach((w, i) => { c.rev['w' + i] = () => { if (i === 0 && els.tus) viet(c, els.tus.querySelector('.s-tus-n'), 0, 0.2, { cam: false }); vietDong(c, els.tus && els.tus.querySelector('.s-tu-d[data-i="' + i + '"]')); }; });
    mocX(c, 'khung', 0.05, box.x);
    // net chu Han / kana: ve cham theo thu tu net (>= 1,8 s), den theo cue K1 / K1b; du phong 1,6 s de o luoi khong trong
    mocX(c, 'net', 1.6, box.x + box.w);
    mocX(c, 'hv', 1.2, Rg ? Rg.x : A.x);
    mocX(c, 'ng', 3.2, Rg ? Rg.x : A.x);
    mocX(c, 'on', 5.4, Rg ? Rg.x : A.x); mocX(c, 'kun', 6.8, Rg ? Rg.x : A.x);
    mocX(c, 'meo', 4.6, Rg ? Rg.x : A.x); mocX(c, 'ss', 7.2, Rg ? Rg.x : A.x);
    tus.forEach((w, i) => mocX(c, 'w' + i, 8.2 + 1.2 * i, Rg ? Rg.x : A.x));
    c.kj = { els, info, box };
  }
  /** Viet mot dong trong khoi (cac .k ngoai nhan .s-nl da viet) */
  function vietDong(c, dg) {
    if (!dg || dg.dataset.viet) return;
    const ks = Array.from(dg.querySelectorAll('.k')).filter((k) => !k.closest('.s-nl'));
    dg.dataset.viet = '1';
    if (giam()) { ks.forEach((k) => k.classList.add('da')); return; }
    const tong = ks.reduce((a, k) => a + kyTu(k.textContent).length, 0) || 1;
    const dur = st.gap ? 0.25 : kep(0.1 + tong * 0.03, 0.2, 0.8);
    let tt = 0;
    const pts = [];
    ks.forEach((k) => {
      const d = Math.max(0.03, dur * kyTu(k.textContent).length / tong);
      G.set(k, { clipPath: HIDE }); k.classList.add('da');
      G.fromTo(k, { clipPath: HIDE }, { clipPath: SHOW, duration: d, ease: 'none', delay: tt, immediateRender: false, onComplete: () => G.set(k, { clearProps: 'clipPath' }) });
      const r = toaDo(k); pts.push({ x: r.x + r.w * 0.06, y: r.y + r.h * 0.64, t: tt }); pts.push({ x: r.x + r.w * 0.94, y: r.y + r.h * 0.6, t: tt + d });
      tt += d;
    });
    queChay(pts);
  }
  function cueChuHan(m, id, tt, api, nh, c) {
    const t = api.tre(tt), K = c.kj;
    if (!K) return;
    const e = K.els;
    // khoi da ve xong (viet theo dong ho du phong, som hon tieng) thi cue chi dua tieu diem: phong nhe 140 ms + nhay mau -> lien ket giong noi voi chu tren bang
    const chiDiem = (khoa, el, k) => { if (daXong(c, khoa)) { if (el) nay(el, t, k || 1.05); } else moc(c, khoa, t); };
    if (id === 'K1' || id === 'K1b' || id === 'K1m') moc(c, 'net', t);
    else if (id === 'K2') chiDiem('hv', e.hv);
    else if (id === 'K3') chiDiem('ng', e.ng, 1.04);
    else if (id === 'K4') { if (nh.laKana) chiDiem('meo', e.meo, 1.04); }
    else if (id === 'K5') { if (nh.laKana) chiDiem('ss', e.ss, 1.04); else chiDiem('on', e.am && e.am.querySelector('[data-am="on"]') && e.am.querySelector('[data-am="on"]').parentNode, 1.05); }
    else if (id === 'K6') chiDiem('kun', e.am && e.am.querySelector('[data-am="kun"]') && e.am.querySelector('[data-am="kun"]').parentNode, 1.05);
    else if (/^K7\.\d+$/.test(id)) {
      const i = +id.split('.')[1];
      for (let q = 0; q < i; q++) moc(c, 'w' + q, t);
      chiDiem('w' + i, e.tus && e.tus.querySelector('.s-tu-d[data-i="' + i + '"]'), 1.04);
    }
  }

  // ================================================================== MAU CAU
  /** Bai nhap mon (KANA): chu trong cong thuc chi la hang chu cai, KHONG phai tro tu -> khong gan cach doc (ka / wa) va vai tro (nghi van / chu de) */
  const laKanaNh = (nh) => !!(nh && (nh.laKana || String(nh.capDo || '').toUpperCase() === 'KANA'));
  /** Cong thuc khi dao dien khong tach duoc (nh.congThuc null): chon cach viet khop tieu de mau, bo chu thich trong ngoac, o = ky hieu Latin viet hoa (N1, V, A), chu = cum Nhat */
  function phanDuPhong(d) {
    let f = String(d.grammarFormula || '').trim();
    const tieu = String(d.title || '').replace(/^\d+\.\s*/, '');
    if (f.indexOf('=') >= 0) {
      const vs = f.split(/\s*=\s*/).filter(Boolean), tt = tieu.replace(/\s+/g, '');
      f = vs.find((v) => tt.indexOf(v.replace(/\s+/g, '')) >= 0 && v.replace(/\s+/g, '').length > 2) || vs[0] || f;
    }
    f = f.replace(/[（(][^）)]*[）)]/g, ' ');
    // ky hieu Latin viet hoa ngan (N1, V, A, Adj) la o; tu Viet ('Nhom') khong phai ky hieu -> bo. Phuong an "A/B" (khong cach) la MOT manh
    // ky hieu Latin kem duoi ngan (Vる, Aい, Vて, Vます) la MOT o (nhu nhan o cua dao dien); "N/Vる/Aい" cung la mot manh
    const jc = '[぀-ヿ一-鿿々〜ー]', lat = '(?<![A-Za-zÀ-ỹ])[A-Z][A-Za-z0-9]{0,3}(?![A-Za-zÀ-ỹ])(?:' + jc + '{1,3}(?!' + jc + '))?', jp = jc + '+';
    const unit = '(?:' + lat + '|' + jp + ')';
    const tk = f.match(new RegExp(unit + '(?:[/／]' + unit + ')*', 'g')) || [];
    return tk.slice(0, 8);
  }
  /**
   * Cong thuc khong tach ra duoc ky hieu Latin / cum Nhat nao (hoac chi 1 manh): tach theo CUM. Dau noi ngoai ngoac chia cum (→ ⇒ + / ｜ | ・ ; vs 、), [..] la mot cum rieng,
   * chu thich trong ngoac tron di kem cum truoc do (thanh nhan nho duoi khung). Moi cum { loai ('o' co chu Viet / Latin, 'chu' toan Nhat), chu, body, sep ('→' | '+' | 'vs' | '') }
   */
  function phanCum(f0) {
    // 'vs' giua hai ve; khoang trang ngang (>= 2 dau cach / dau cach toan hinh) ngan hai ve; con lai chuan hoa
    const s = String(f0 || '').replace(/[\s\u3000]*\bvs\b[\s\u3000]*/gi, ' vs ').replace(/\u3000+|[ \t]{2,}/g, ' ｜ ').replace(/\s+/g, ' ').trim();
    const segs = [];
    let cur = { txt: '', note: [] }, sep = '', depth = 0, loaiNgoac = '', buf = '', daNote = false;
    const dongCum = () => {
      let txt = cur.txt.replace(/\s+/g, ' ').replace(/\s+([:：])/g, '$1').replace(/^[\s:：;；,，、=＝/／]+|[\s:：;；,，、=＝/／]+$/g, '');
      const note = cur.note.filter(Boolean);
      cur = { txt: '', note: [] }; daNote = false;
      if (/^(đến|tới)\s/i.test(txt) && segs.length) { txt = txt.replace(/^(đến|tới)\s+/i, ''); if (!sep) sep = '→'; }
      if (!txt) { if (note.length && segs.length) segs[segs.length - 1].note.push(...note); else if (note.length) segs.push({ txt: note.join(' '), note: [], sep: '' }); return; }
      segs.push({ txt, note, sep: segs.length ? sep : '' });
      sep = '';
    };
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (depth > 0) {
        if (/[(（［[]/.test(ch)) depth++;
        else if (/[)）］\]]/.test(ch)) depth--;
        if (depth > 0) { buf += ch; continue; }
        // dong ngoac
        if (loaiNgoac === '[') { if (cur.txt.trim()) dongCum(); cur.txt = buf; dongCum(); }
        else { cur.note.push(buf.trim()); daNote = true; }
        buf = '';
        continue;
      }
      if (/[(（［[]/.test(ch)) {
        depth = 1; loaiNgoac = /[［[]/.test(ch) ? '[' : '('; buf = '';
        if (loaiNgoac === '[' && cur.txt.trim()) dongCum();
        continue;
      }
      // '/' chi la dau noi khi co khoang trang hai ben ('bắt/cho' la mot cum)
      const gach = /[／/]/.test(ch) && (ch === '／' || (s[i - 1] === ' ' && s[i + 1] === ' '));
      // phuong an chi toan chu Nhat ("好き／嫌い", "行きます / 来ます / 帰ります") la MOT cum, giu dau gach cheo (khong tach thanh hai khung roi dinh vao nhau)
      if (gach && RE_CHI_NHAT.test(cur.txt.trim()) && RE_CHI_NHAT.test(s.slice(i + 1).split(/[／/→⇒＋+｜|;；、，(（［[]/)[0].trim())) { cur.txt = cur.txt.replace(/\s+$/, '') + ' / '; continue; }
      if (gach || /[→⇒＋+｜|;；、，]/.test(ch) || (ch === '・' && cur.txt.trim()) || /^ vs /i.test(s.slice(i, i + 4))) {
        dongCum();
        if (/[→⇒]/.test(ch)) sep = '→'; else if (/[＋+]/.test(ch)) sep = '+'; else if (/^ vs /i.test(s.slice(i, i + 4))) { sep = 'vs'; i += 3; } else if (gach) sep = '/';
        continue;
      }
      // "Ten (ghi chu): mo ta" -> mo ta thuoc CUNG cum voi ten (dau hai cham sau ngoac khong ngat cum)
      if (daNote && /[:：]/.test(ch)) daNote = false;
      else if (daNote && ch.trim()) dongCum();
      cur.txt += ch;
    }
    if (depth > 0 && buf.trim()) { if (loaiNgoac === '[') { cur.txt = buf; } else cur.note.push(buf.trim()); }
    dongCum();
    return segs.filter((x) => /[A-Za-z0-9À-ỹ぀-ヿ㐀-鿿]/.test(x.txt)).slice(0, 12).map((x) => ({
      loai: !/[A-Za-zÀ-ỹ0-9]/.test(x.txt) && RE_JP.test(x.txt) ? 'chu' : 'o',
      chu: x.txt, ro: '', body: x.note.join(' · '), sep: x.sep, cum: true,
    }));
  }
  // ------------------------------------------------------------------ cong thuc: phan loai + bang chia (ham thuan, khong DOM)
  const RE_MT = /[→⇒]/;
  const RE_JPC = '\\u3040-\\u30ff\\u3400-\\u9fff々〆〜ー';
  const RE_CO_NHAT = new RegExp('[' + RE_JPC + ']');
  const RE_LAT = /(?<![A-Za-zÀ-ỹ])[A-Z][A-Za-z0-9]{0,3}(?![A-Za-zÀ-ỹ])/;
  const boNote = (s_) => String(s_ || '').replace(/[（(][^）)]*[）)]/g, ' ');
  const gonKt = (s_) => String(s_ || '').replace(/\s+/g, ' ').trim();
  /**
   * Tach cong thuc thanh cac MENH (moi menh mot hang bang): >= 2 dau cach / dau cach toan hinh / | ; ngat menh; " / " ngat menh khi ve phai co cau truc rieng (+ → ngoac, ky hieu Latin, 'Nhóm');
   * "Nhóm N" mo menh moi; "A→B C→D" (nhieu cap cach nhau mot dau cach) tach tung cap; "X + Y → Z + W" tach o mui ten (mui ten dan dau hang sau)
   */
  const phucCt = (x) => /[+＋→⇒([（［]|^Nhóm|^[^\s:：]+[:：]/.test(x) || RE_LAT.test(x);
  /** Menh da tron ven (khong phai nua chung): ket thuc bang chu thich, ky hieu Latin hoac cum Nhat >= 2 ky tu */
  const tronVen = (x) => /[）)]$/.test(x) || RE_LAT.test(x.slice(-4)) || new RegExp('[' + RE_JPC + ']{2,}$').test(x.replace(/[、。,.\s]+$/, ''));
  function tachMenh(f0) {
    const s_ = String(f0 || '').replace(/　/g, '  ').replace(/\t/g, '  ').trim();
    // buoc 1: cat o cac dau ngat ngoai ngoac: >= 2 dau cach ('rong'), " / " ('cheo'), " vs " ('vs'), | ; ('cung')
    const ds = [];
    let cur = '', depth = 0, sepTruoc = '';
    const dong = (sep) => { ds.push({ t: gonKt(cur), sep: sepTruoc }); cur = ''; sepTruoc = sep; };
    for (let i = 0; i < s_.length; i++) {
      const ch = s_[i];
      if ('([（［'.indexOf(ch) >= 0) depth++;
      else if (')]）］'.indexOf(ch) >= 0) depth = Math.max(0, depth - 1);
      if (!depth) {
        if (ch === ' ') {
          const m = /^(\s+)(vs(?=\s)|[／/])?(\s*)/i.exec(s_.slice(i));
          if (m[2] && m[3]) { dong(/^vs$/i.test(m[2]) ? 'vs' : 'cheo'); i += m[0].length - 1; continue; }
          if (m[1].length >= 2 && !m[2]) { dong('rong'); i += m[1].length - 1; continue; }
          if (m[1].length >= 2 && m[2] && !m[3]) { dong('rong'); i += m[1].length - 1; continue; }
        }
        if ('｜|;；'.indexOf(ch) >= 0) { dong('cung'); continue; }
      }
      cur += ch;
    }
    dong('');
    // buoc 2: ghep lai cac manh khong du cau truc de la hai menh rieng (a  i  u  e  o ; これ / それ / あれ + ...)
    const ra = [];
    let tien0 = '';
    ds.forEach((d) => {
      if (!d.t) return;
      if (/^[=＝→⇒+＋]+$/.test(d.t)) { tien0 = d.t + ' '; return; }           // dau noi dung mot minh: dan dau menh ke tiep
      let t = tien0 + d.t; tien0 = '';
      const tr = ra[ra.length - 1];
      if (!tr) { ra.push({ t, vs: false }); return; }
      if (/^[（(][^）)]*[）)]$/.test(t)) { tr.t += ' ' + t; return; }
      // "... hoac" / "... va" o cuoi menh: tu noi dan dau menh ke tiep
      const mn = /\s+(hoặc|và)$/i.exec(tr.t);
      if (mn) { tr.t = tr.t.slice(0, mn.index); t = mn[1] + ' ' + t; }
      let bien = d.sep === 'cung' || d.sep === 'vs' || (phucCt(tr.t) && phucCt(t) && tronVen(tr.t));
      if (d.sep === 'cheo' && tr.alt) bien = false;                              // dang trong chuoi phuong an "ここ / そこ / あそこ + です"
      if (bien) ra.push({ t, vs: d.sep === 'vs' });
      else { tr.t += (d.sep === 'cheo' ? ' / ' : ' ') + t; if (d.sep === 'cheo') tr.alt = true; }
    });
    const out = [];
    ra.forEach((q) => {
      q.t.split(/\s+(?=Nhóm\s*\d)/).forEach((x, k) => {
        x = x.trim();
        if (!x) return;
        const vs = q.vs && k === 0 ? 'vs ' : '';
        const hold = [];
        const g = x.replace(/[（(][^）)]*[）)]/g, (m) => { hold.push(m); return '' + (hold.length - 1) + ''; });
        const hoiCt = (z) => z.replace(/(\d+)/g, (m, k2) => hold[+k2]);
        const ws = g.split(' ');
        const laCap = (w) => /\S[→⇒]\S/.test(w);
        const nCap = ws.filter(laCap).length;
        if (nCap >= 2 && !/\s[+＋]\s/.test(g)) {
          const nhom = [];
          let gr = null;
          ws.forEach((w) => {
            const mo = !!(laCap(w) && gr && gr.mt && !/[:：,，、+＋]$/.test(gr.ws[gr.ws.length - 1]) && !/^\d+$/.test(w));
            if (!gr || mo) { gr = { ws: [], mt: false }; nhom.push(gr); }
            gr.ws.push(w); if (laCap(w)) gr.mt = true;
          });
          nhom.forEach((z, k3) => out.push((k3 ? '' : vs) + hoiCt(z.ws.join(' '))));
          return;
        }
        // "X + Y → Z + W": tach o mui ten khi hai ve deu co cau truc '+'
        const m2 = /^(.*\s[+＋]\s.*?)\s*([→⇒])\s*(.*\s[+＋]\s.*)$/.exec(g);
        if (m2 && !RE_MT.test(m2[1]) && !RE_MT.test(m2[3])) {
          out.push(vs + hoiCt(m2[1]));
          out.push(m2[2] + ' ' + hoiCt(m2[3]));
          return;
        }
        // "Tieu de: A→B、C→D、E→F": tung cap mot hang (tieu de mot hang rieng)
        if ((g.match(/[→⇒]/g) || []).length >= 3 && g.indexOf('、') >= 0) {
          const ps = g.split('、').map((z) => z.trim()).filter(Boolean);
          if (ps.length >= 3 && ps.slice(1).every((z) => RE_MT.test(z))) {
            const mc = /^(.*?[:：])\s*(.+)$/.exec(ps[0]);
            if (mc && RE_MT.test(mc[2])) { out.push(vs + hoiCt(mc[1])); ps[0] = mc[2]; }
            ps.forEach((z, k4) => out.push((k4 || mc ? '' : vs) + hoiCt(z)));
            return;
          }
        }
        out.push(vs + x);
      });
    });
    // menh chi co dau noi (=, →, +) dinh vao dau menh ke tiep
    const kq = [];
    let tien = '';
    out.forEach((c) => { if (/^[=＝→⇒+＋]+$/.test(c.trim())) { tien = c.trim() + ' '; return; } kq.push(tien + c); tien = ''; });
    return kq.filter((c) => c.trim());
  }
  /** Mot menh -> html cac atom (.k): Nhat (cam truoc mui ten, hong sau), ky hieu Latin (xanh), dau noi (vang), chu thich (nho, trang), tu Viet (nho, trang) */
  function hangHtml(c0) {
    const hold = [];
    const t = String(c0 || '')
      .replace(/[（(][^）)]*[）)]/g, (m) => { hold.push(['n', m.slice(1, -1)]); return ' ' + (hold.length - 1) + ' '; })
      .replace(/[\[［][^\]］]*[\]］]/g, (m) => { hold.push(['b', m.slice(1, -1)]); return ' ' + (hold.length - 1) + ' '; });
    const coViet = /[à-ỹÀ-Ỹ]/.test(boNote(c0)) || /(thêm|bỏ|đuôi|cột|nghe|ghép)/.test(c0);
    let sau = false, ctC = 0;
    const ds = [];   // { h: html mot atom, ct: la dau noi }
    const tu = (txt, cls, lang, ct) => ds.push({ h: '<span class="k ' + cls + '"' + (lang ? ' lang="ja"' : '') + '>' + esc(txt) + '</span>', ct: !!ct });
    const tuNhieu = (txt, cls) => txt.split(/\s+/).filter(Boolean).forEach((w) => ds.push({ h: '<span class="k ' + cls + '">' + jpBoc(w) + '</span>', ct: false }));
    t.split(/\s+/).filter(Boolean).forEach((w) => {
      const mp = /^(\d+)$/.exec(w);
      if (mp) {
        const [loai, nd] = hold[+mp[1]];
        if (loai === 'b') tuNhieu(nd, 's-ho c-xanh'); else tuNhieu('(' + nd + ')', 's-gc c-trang');
        return;
      }
      w.split(/([→⇒+＋=＝])/).filter((x) => x !== '').forEach((fr) => {
        if (RE_MT.test(fr)) { sau = true; ctC++; tu('→', 's-ct c-vang', false, true); return; }
        if (/^[+＋=＝]$/.test(fr)) { tu(fr === '＋' ? '+' : fr === '＝' ? '=' : fr, 's-ct c-vang', false, true); return; }
        if (fr === 'vs') { tu('vs', 's-ct c-vang', false, true); return; }
        if (RE_CO_NHAT.test(fr)) { fr.split(/(?<=[／/])/).forEach((z) => { if (z) tu(z, 'jp ' + (/^[A-Z]/.test(z) ? 'c-xanh' : sau ? 'c-hong' : 'c-cam'), true); }); return; }
        if (/^[A-Z][A-Za-z0-9]{0,3}[:,]?$/.test(fr) || (!coViet && /^[a-z]{1,3}$/.test(fr)) || (sau && /^'?[a-z]{1,4}'?$/.test(fr))) { tu(fr, 'c-xanh'); return; }
        tu(fr, 's-cap c-trang');
      });
    });
    // dau noi dinh voi manh truoc va manh sau (khong ngat dong giua mui ten va hai dau cua no)
    const gop = [];
    let lienSau = false;
    ds.forEach((d) => {
      if (d.ct && gop.length) { gop[gop.length - 1].push(d.h); lienSau = true; return; }
      if (lienSau && gop.length) { gop[gop.length - 1].push(d.h); lienSau = false; return; }
      gop.push([d.h]);
    });
    return { html: gop.map((g_) => (g_.length > 1 ? '<span class="s-nw">' + g_.join(' ') + '</span>' : g_[0])).join(' '), jc: (boNote(c0).match(new RegExp('[' + RE_JPC + ']+', 'g')) || []).length, mt: ctC };
  }
  /**
   * Phan loai cong thuc: 'bang' (nhieu menh / co mui ten giua cac manh: bang chia, doi ung -> moi menh mot hang chu), 'tro' (cau van xuoi, khong co cong thuc: bo qua hang cong thuc),
   * 'o' (mot chuoi + : o ky hieu va cum chu)
   */
  function phanLoaiCt(f0) {
    const f = String(f0 || '').trim();
    if (!f) return { kieu: 'tro', rows: [] };
    const menh = tachMenh(f);
    const s0 = boNote(f);
    const coJp = RE_CO_NHAT.test(s0), coLat = RE_LAT.test(s0), coMT = RE_MT.test(s0);
    const coCauTruc = (c) => RE_CO_NHAT.test(boNote(c)) || RE_LAT.test(boNote(c));
    const nCT = menh.filter(coCauTruc).length;
    if ((coJp || coLat) && (nCT >= 2 || coMT || /(^|\s)Nhóm\s*\d/.test(s0))) {
      const rows = menh.slice(0, 8).map((c, i) => { const h = hangHtml(c); return { loai: 'chu', bang: true, j: i, chu: gonKt(boNote(c)), html: h.html, jc: Math.max(1, h.jc), ro: '', body: '' }; });
      return { kieu: 'bang', rows };
    }
    // cau van xuoi: mot cum Nhat (hoac khong), khong dau noi / ngoac vuong, nhieu tu Viet
    const nTu = gonKt(s0.replace(new RegExp('[' + RE_JPC + ']+', 'g'), ' ')).split(' ').filter((w) => w.length > 1).length;
    const nJp = (s0.match(new RegExp('[' + RE_JPC + ']+', 'g')) || []).length;
    if (menh.length === 1 && !/[+＋\[［]/.test(s0) && nJp <= 1 && nTu >= 5) return { kieu: 'tro', rows: [] };
    return { kieu: 'o', rows: [] };
  }
  /** Ket qua tach cua dao dien co DUNG voi ca cong thuc khong? (chuoi chinh == ca cong thuc bo chu thich, khong gach cheo giua cac phuong an, khong bi cat o ngoac / mui ten / khoang trang) */
  function ctTin(ct, f) {
    if (!ct || !ct.phan || !ct.phan.length) return false;
    const day = gonKt(boNote(String(f || '')).replace(/　/g, ' ')), chinh = gonKt(boNote(String(ct.goc || '')).replace(/　/g, ' '));
    if (day !== chinh) return false;
    if (/[／/]/.test(chinh.replace(/[\[［][^\]］]*[\]］]/g, ''))) return false;
    // dau + nam trong [..] bi dao dien cat doi ngoac -> manh sai
    if (/[\[［][^\]］]*[+＋][^\]］]*[\]］]/.test(chinh)) return false;
    return true;
  }
  /** Cac manh cong thuc de ve (o / chu / bang). ct = ket qua tach cua dao dien (nhan duoc khi dung), d = du lieu mau cau */
  function phanCongThucTu(ct, d, kana) {
    const f = String(d.grammarFormula || '').trim();
    if (!f) return [];
    const lc = phanLoaiCt(f);
    if (lc.kieu === 'tro') return [];
    if (lc.kieu === 'bang') return lc.rows;
    if (ctTin(ct, f)) {
      let jc = 0, jo = 0;
      return ct.phan.map((e) => {
        if (e.loai === 'chu') {
          const j = jc++, chu_ = String(e.chu || '');
          return { loai: 'chu', j, chu: chu_, ro: kana ? '' : (DOC_TRO[chu_] || ROMAJI_TRO[chu_] || ''), body: kana ? '' : (C.vaiTro(chu_) || ''), tin: true };
        }
        const j = jo++;
        let nhan = String(e.nhan || '').replace(/[\-(（]+$/, '').trim();
        if (!/[A-Za-z0-9぀-ヿ一-鿿]/.test(nhan)) nhan = '…';
        return { loai: 'o', j, chu: nhan, ro: '', body: e.chu ? viet1(e.chu) : '', tin: true };
      });
    }
    let jc = 0, jo = 0;
    const dp = phanDuPhong(d);
    // nhieu manh hon: tach theo CUM (giu o [..] va chu Viet, phuong an A / B); it manh Latin / Nhat (hoac khong co): cung theo cum
    const cum = phanCum(f);
    if (cum.length >= 2 && (cum.length > dp.length || dp.length < 2 || /[\[［]/.test(f))) {
      let jc2 = 0, jo2 = 0;
      return cum.map((x) => Object.assign(x, { j: x.loai === 'chu' ? jc2++ : jo2++, p: true, body: x.body ? nganTu(x.body, 30) : '' }));
    }
    if (!dp.length && cum.length) return cum.map((x, k) => Object.assign(x, { j: x.loai === 'chu' ? 0 : k, p: true }));
    return dp.map((x) => {
      if (/^[A-Z]/.test(x)) return { loai: 'o', j: jo++, chu: x, ro: '', body: '', p: true };
      return { loai: 'chu', j: jc++, chu: x, ro: kana ? '' : (ROMAJI_TRO[x] || ''), body: kana ? '' : (C.vaiTro(x) || ''), p: true };
    });
  }
  function phanCongThuc(nh) {
    const d = nh.data || {};
    return phanCongThucTu(nh.congThuc, { grammarFormula: d.grammarFormula || (nh.beat && nh.beat.slide && nh.beat.slide.grammarFormula) || '', title: d.title || (nh.beat && nh.beat.slide && nh.beat.slide.title) || '' }, laKanaNh(nh));
  }
  function gopPhan(ds, n) {
    const out = ds.map((x) => Object.assign({}, x, { idx: x.idx || [x.i0] }));
    while (out.length > n) {
      let bi = 0, bl = 1e9;
      for (let i = 0; i + 1 < out.length; i++) { const l = kyTu(out[i].chu).length + kyTu(out[i + 1].chu).length; if (l < bl) { bl = l; bi = i; } }
      const a = out[bi], b = out[bi + 1];
      if (a.cum) { a.chu += ' ' + (b.sep ? b.sep + ' ' : '') + b.chu; a.body = [a.body, b.body].filter(Boolean).join(' · '); }
      else { a.chu += b.chu; a.body = ''; }
      a.idx = a.idx.concat(b.idx); a.ro = ''; a.loai = a.cum ? (a.loai === 'chu' && b.loai === 'chu' ? 'chu' : 'o') : (a.loai === 'o' && b.loai === 'o' ? 'o' : 'chu');
      out.splice(bi + 1, 1);
    }
    return out;
  }
  function phanGon(nh, gioiHan) {
    let phan = phanCongThuc(nh).map((p, i) => Object.assign({ i0: i, idx: [i] }, p));
    // bang chia (moi menh mot hang chu): khong gop / khong cat
    if (phan.length && phan[0].bang) { phan.forEach((p) => { p.mau = 'cam'; }); return { phan, map: phan.map((_, i) => i), bang: true, tin: false }; }
    const tin = phan.length > 0 && phan.every((p) => p.tin);
    const map = phan.map((_, i) => i);
    const RE_CHAM = /^[・、。，．,.·\s]+$/, RE_NHO = /^[ゃゅょャュョっッぁぃぅぇぉ]+$/;
    const moi = [];
    let cho = [];
    phan.forEach((p) => {
      const tr = moi[moi.length - 1];
      if (RE_CHAM.test(p.chu) && phan.length > 1) { if (tr) tr.idx.push(p.i0); else cho.push(p.i0); return; }
      if (RE_NHO.test(p.chu) && tr && tr.loai === 'chu') { tr.chu += p.chu; tr.idx.push(p.i0); tr.ro = ''; return; }
      moi.push(Object.assign({}, p, { idx: cho.splice(0).concat([p.i0]) }));
    });
    if (moi.length) phan = moi;
    if (phan.length > gioiHan) phan = gopPhan(phan, gioiHan);
    phan.forEach((p, k) => p.idx.forEach((i) => { map[i] = k; }));
    let jo = 0;
    phan.forEach((p) => { p.mau = p.loai === 'o' ? MAU_O[jo++ % 3] : (DS_TRO.includes(p.chu) ? 'hong' : 'cam'); });
    return { phan, map, bang: false, tin };
  }
  /** Do mot hang cong thuc o co f: moi phan { w (o), wBox, hBox, ro, body } */
  /** wMax: be ngang toi da cua mot khung; cum Viet dai hon thi xuong 2+ dong trong khung (chu to hon, khong thu nho tren mot dong) */
  function doPhan(phan, f, wMax) {
    // do mot lan o co 100 px, ti le tuyen tinh theo co chu (+2 %)
    if (!phan._do) {
      phan._do = phan.map((p) => ({
        k: kt(donVi(p.chu), 's-c mot' + (p.loai === 'chu' ? ' jp' : ''), 100, 20000),
        r: p.ro ? kt(donVi(p.ro), 's-c mot', 100, 20000) : null,
        b: p.body ? kt(donVi(p.body), 's-c mot', 100, 20000) : null,
      }));
    }
    const cum = phan.some((p) => p.cum);
    const fr = Math.max(fsSan(), Math.round(f * 0.3)), ft = Math.max(fsSan(), Math.round(f * (cum ? 0.62 : 0.24)));
    return phan.map((p, i) => {
      const d0 = phan._do[i];
      // cum chu Viet trong khung (nhan o: "ket qua trai voi ky vong"): nho hon chu Nhat de khung khong qua to / lech
      const fk = p.cum && p.loai === 'o' && !RE_CO_NHAT.test(p.chu) ? Math.max(fsSan(), Math.round(f * 0.66)) : f;
      let k = { wt: Math.ceil(d0.k.wt * fk / 100 * 1.02) + 2, h: Math.ceil(d0.k.h * fk / 100) };
      if (fk !== f && fk < nguongNho()) { const k1 = kt(donVi(p.chu), 's-c mot', fk, 20000); k = { wt: k1.wt + 2, h: k1.h }; }
      const tron = p.loai === 'chu' && kyTu(p.chu).length <= 2;
      let nl = 1;
      const wGoc = wMax ? wMax - (p.sep ? Math.round(f * 0.95) : 0) : 0;
      if (p.cum && wGoc && /\s/.test(p.chu.trim()) && k.wt + fk * 0.62 > wGoc) {
        const wIn = Math.floor(wGoc - fk * 0.62), kk = kt(donVi(p.chu), 's-c can giua' + (p.loai === 'chu' ? ' jp' : ''), fk, wIn);
        k = { wt: Math.min(wIn, kk.wt + 2), h: kk.h };
        nl = Math.max(2, Math.round(kk.h / (fk * 1.22)));
      }
      const wBox = tron ? Math.max(k.wt + f * 0.45, f * 1.35) : k.wt + fk * 0.62;
      const hBox = tron ? Math.max(f * 1.3, wBox * 0.8) : (nl > 1 ? k.h + fk * 0.5 : fk * 1.32);
      const wRo = d0.r ? Math.ceil(d0.r.wt * fr / 100 * 1.02) + 2 : 0;
      const wBody = d0.b ? Math.ceil(d0.b.wt * ft / 100 * 1.02) + 2 : 0, hBody = d0.b ? Math.ceil(d0.b.h * ft / 100) : 0;
      return { p, k, tron, nl, wBox, hBox, wRo, wBody, hBody, fr, ft, fk, w: Math.max(wBox, wRo, wBody + f * 0.12) };
    });
  }
  function dungMauCau(nh, c) {
    const d = nh.data || {}, dt = st.dt, u = st.u;
    const { phan, map, bang: bangF, tin: tinF } = phanGon(nh, 6);
    const dsMau = (nh.ctx && nh.ctx.cacNhip || []).filter((b) => b && b.kind === 'grammar-intro');
    const soMau = dsMau.length, iMau = dsMau.indexOf(nh.beat) + 1;
    const tieu = String(d.title || '').replace(/^\d+\.\s*/, '');
    const yTop = nhanMuc(c, [['Mẫu câu', ''], [soMau ? iMau + ' / ' + soMau : '', 'c-vang']], tagBai(nh));
    const A = vung(yTop);
    const gap = Math.round((dt ? 10 : 22) * u);
    // tieu de mau
    const fDe = T('de', 0.8);
    let hT = tieuDeHtml(tieu);
    let ftt = fit(hT, 's-c c-vang can giua', A.w, (dt ? 52 : 80) * u, fDe.max, Math.max(st.dt ? 14 : 16, fDe.min));
    if (ftt.tran) { hT = donVi(tieu); ftt = fit(hT, 's-c c-vang can giua', A.w, (dt ? 52 : 80) * u, fDe.max, Math.max(st.dt ? 14 : 16, fDe.min)); }
    const eT = chu(c, hT, 's-c c-vang can giua', { x: A.x + (A.w - ftt.w) / 2, y: A.y, w: ftt.w, h: ftt.h }, ftt.fs);
    let y = A.y + ftt.h + gap;
    // cong thuc: co f lon nhat vua be ngang (1 hang, khong thi 2 hang)
    // cong thuc theo cum (chu Viet): co chu vua phai (khung chua ca cum), khong phong 92 px nhu o ky hieu
    const fF = phan.some((p) => p.cum) ? T('nghia') : T('form');
    const gx = (f) => Math.max(f * 0.28, 2 * Math.round((dt ? 3 : 6) * u) + Math.round(12 * u));
    // khoang truoc moi khung: cum co dau noi (→ + vs) rong hon de chua dau (ke ca khung dau hang); khung dau hang khong dau noi thi 0
    const gP = (f, q, i) => (q.p.sep ? Math.round(f * (q.p.sep === '→' ? 0.95 : q.p.sep === 'vs' ? 1.25 : 0.8)) : (i ? gx(f) : 0));
    const hangW = (ms, f) => ms.reduce((a, q, i) => a + q.w + gP(f, q, i), 0);
    const hangH = (ms, f) => {
      const coRo = ms.some((q) => q.wRo), coBody = ms.some((q) => q.wBody);
      return (coRo ? ms[0].fr * 1.3 + 0.1 * Math.max(...ms.map((q) => q.hBox)) : 0) + Math.max(...ms.map((q) => q.hBox)) + (coBody ? f * 0.36 + ms[0].ft * 1.35 : 0);
    };
    // chia cong thuc thanh it hang nhat co the (2, 3, toi da maxHang): moi so hang chon cach chia sao cho hang rong nhat hep nhat
    const maxHang = dt ? 4 : 3;
    const tachHang = (ms, f) => {
      if (hangW(ms, f) <= A.w) return [ms];
      const n = ms.length;
      let tot = null;
      for (let R = 2; R <= Math.min(n, maxHang); R++) {
        let best = null;
        const cuts = [];
        const duyet = (tu, con) => {
          if (con === 0) {
            const idx = [0].concat(cuts, [n]), rs = [];
            let m = 0;
            for (let q = 0; q + 1 < idx.length; q++) { const r = ms.slice(idx[q], idx[q + 1]); rs.push(r); m = Math.max(m, hangW(r, f)); }
            if (!best || m < best.m) best = { m, rs };
            return;
          }
          for (let c = tu; c <= n - con; c++) { cuts.push(c); duyet(c + 1, con - 1); cuts.pop(); }
        };
        duyet(1, R - 1);
        if (best) { tot = best; if (best.m <= A.w) break; }
      }
      return tot ? tot.rs : [ms];
    };
    // chu giai thich / luu y nhieu -> cong thuc nho lai nhuong cho
    const nChu = kyTu(String(d.explanation || '') + String(d.teacherTips || '') + String(d.culturalNotes || '')).length;
    const capF = (dt ? 0.40 : 0.36) * (nChu > 520 ? 0.62 : nChu > 300 ? 0.78 : 1) * A.h;
    let fBest = null;
    // khong co phan nao (cong thuc trong): bo hang cong thuc, nhuong cho cho giai thich (khong bao gio Math.max cua mang rong -> -Infinity)
    let bangInfo = null;
    if (bangF) {
      // bang chia: moi menh mot hang chu (cac hang xep chong / canh nhau tuy be ngang), co chu lon nhat vua o cao cho phep
      const hB = '<div class="s-bg">' + phan.map((q) => '<div class="s-rw">' + q.html + '</div>').join('') + '</div>';
      const capB = Math.min(capF * 1.3, A.h * 0.5);
      const fr = fit(hB, 's-c giua s-bcb', A.w, capB, dt ? T('nghia').max : Math.round(T('form').max * 0.6), dt ? 15 : 20);
      fBest = { f: fr.fs, ms: [], hs: [], H: fr.h, bang: true };
      bangInfo = { html: hB, fr };
    }
    if (!phan.length) fBest = { f: fF.min, ms: [], hs: [], H: 0 };
    for (let f = fF.max; !fBest && f >= fF.min; f -= Math.max(1, Math.round(f * 0.06))) {
      const ms = doPhan(phan, f, A.w);
      const hs = tachHang(ms, f);
      if (hs.length > maxHang || hs.some((h) => hangW(h, f) > A.w)) continue;
      const H = hs.reduce((a, h) => a + hangH(h, f), 0) + (hs.length - 1) * f * 0.3;
      if (H > capF) continue;
      fBest = { f, ms, hs, H };
      break;
    }
    if (!fBest) { const f = fF.min, ms = doPhan(phan, f, A.w), hs = tachHang(ms, f); fBest = { f, ms, hs, H: hs.reduce((a, h) => a + hangH(h, f), 0) + (hs.length - 1) * f * 0.3 }; }
    // phan duoi: giai thich + luu y / van hoa
    const expl = String(d.explanation || '').trim(), tips = String(d.teacherTips || '').trim(), vh = String(d.culturalNotes || '').trim();
    const cauGT = cauThanh(expl);
    const htGT = (n) => '<div class="s-hd c-vang">' + donVi('Giải thích') + '</div><div class="s-bd">' + cauGT.slice(0, n).map((s, i) => '<span class="s-cau-gt" data-s="' + i + '">' + donVi(s) + '</span>').join(' ') + '</div>';
    const htLu = (t_) => (t_ ? '<div class="s-hd c-hong">' + donVi('Lưu ý') + '</div><div class="s-bd">' + donVi(t_) + '</div>' : '');
    const htVh = (t_) => (t_ ? '<div class="s-hd c-la">' + donVi('Văn hóa') + '</div><div class="s-bd">' + donVi(t_) + '</div>' : '');
    let hGT = htGT(cauGT.length), hLu = htLu(tips), hVh = htVh(vh);
    let ghi = [hLu, hVh].filter(Boolean);
    const fP = T('phu');
    const padE = 'padding:.5em .8em;line-height:1.42';
    const hDuoi0 = A.y + A.h - y - fBest.H - gap * 1.4;
    // bo tri o duoi: 'canh' (giai thich trai | ghi chu phai), 'tren' (giai thich tren | ghi chu mot hang), 'doc' (xep doc) -> chon co chu lon nhat
    const hO_ = (html, f, w) => kt(html, 's-c dep', f, w, padE).h;
    const doMode = (mode, f) => {
      const n = ghi.length;
      if (mode === 'canh') {
        const wL = Math.round(A.w * 0.58), wR = A.w - wL - gap;
        const hE = expl ? hO_(hGT, f, wL) : 0, hs = ghi.map((h) => hO_(h, f, wR));
        return { mode, f, wL, wR, hE, hs, H: Math.max(hE, hs.reduce((x, y_) => x + y_, 0) + gap * (n - 1)) };
      }
      if (mode === 'tren') {
        const wN = (A.w - gap * (n - 1)) / n;
        const hE = expl ? hO_(hGT, f, A.w) : 0, hs = ghi.map((h) => hO_(h, f, wN));
        const hR = Math.max(...hs);
        return { mode, f, wN, hE, hs: hs.map(() => hR), H: hE + (expl ? gap : 0) + hR };
      }
      const hE = expl ? hO_(hGT, f, A.w) : 0, hs = ghi.map((h) => hO_(h, f, A.w));
      return { mode: 'doc', f, hE, hs, H: hE + hs.reduce((x, y_) => x + y_, 0) + gap * Math.max(0, n + (expl ? 1 : 0) - 1) };
    };
    // thu mot bo tri: lon nhat co chu vua o cao Hd. moi: co cua bo tri tot nhat truoc do -> chi can thu moi + 1 (khong vua thi bo qua ca bo tri, do 1 lan)
    const thuMode = (mode, Hd, hon) => {
      let lo = hon != null ? hon + 1 : fP.min, hi = Math.round(fP.max * 1.15);
      if (lo > hi) return null;
      let tot = doMode(mode, lo);
      if (tot.H > Hd) return null;
      while (lo < hi) { const mid = (lo + hi + 1) >> 1; const r = doMode(mode, mid); if (r.H <= Hd) { lo = mid; tot = r; } else hi = mid - 1; }
      return tot;
    };
    let bo = null;
    if (!expl && !ghi.length) bo = { mode: 'doc', f: fP.max, hE: 0, hs: [], H: 0 };
    else {
      const modes = !ghi.length ? ['doc'] : (dt ? ['doc'] : (expl ? ['canh', 'tren', 'doc'] : ['tren', 'doc']));
      modes.forEach((md) => { const r = thuMode(md, hDuoi0, bo ? bo.f : null); if (r && (!bo || r.f > bo.f + 0.5)) bo = r; });
    }
    let doi = false;
    if (!bo) {
      // khong du cho cho moi o cung luc: mot o, luu y / van hoa thay vao khi Sensei noi toi (lau + viet lai)
      const okD = (f) => Math.max(expl ? hO_(hGT, f, A.w) : 0, ...ghi.map((h) => hO_(h, f, A.w))) <= hDuoi0;
      // man hinh rat nho (320 px): chu o muc san van tran -> rut gon luu y / van hoa theo tu, roi bot cau giai thich cuoi; khong de chu tran khoi bang
      if (st.u < 0.9 && !okD(fP.min)) {
        let lim = Math.max(kyTu(tips).length, kyTu(vh).length);
        for (let k = 0; k < 24 && !okD(fP.min) && lim > 50; k++) { lim = Math.floor(lim * 0.9); hLu = htLu(nganTu(tips, lim)); hVh = htVh(nganTu(vh, lim)); ghi = [hLu, hVh].filter(Boolean); }
        for (let n = cauGT.length - 1; n >= 1 && !okD(fP.min); n--) hGT = htGT(n);
      }
      let lo = fP.min, hi = Math.round(fP.max * 1.15);
      while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (okD(mid)) lo = mid; else hi = mid - 1; }
      bo = { mode: 'doi', f: lo, hs: [] };
      bo.hE = Math.max(expl ? hO_(hGT, lo, A.w) : 0, ...ghi.map((h) => hO_(h, lo, A.w)));
      bo.H = bo.hE;
      doi = true;
    }
    bo.fs = bo.f;
    // can doc: phan thua chia vao khoang cach
    const hDuoi = bo.H;
    const du = Math.max(0, A.y + A.h - y - fBest.H - hDuoi);
    const g2 = Math.min(Math.round(56 * u), du / 3);
    y += g2;
    // ve cong thuc
    const f = fBest.f;
    const khoi = [];
    if (bangInfo) {
      const fr = bangInfo.fr;
      const xB = A.x + (A.w - fr.w) / 2;
      const eB_ = chu(c, bangInfo.html, 's-c giua s-bcb', { x: xB, y, w: fr.w, h: fr.h }, fr.fs);
      const pad = 0;
      Array.from(eB_.querySelectorAll('.s-rw')).forEach((rw, i) => {
        const rx = xB + rw.offsetLeft, ry = y + rw.offsetTop, rwid = rw.offsetWidth, rh = rw.offsetHeight;
        khoi[i] = { e: rw, vien: hop(c, rx - pad, ry - pad, rwid + 2 * pad, rh + 2 * pad, 'xanh mong', 41 + i), cx: rx + rwid / 2, cy: ry + rh / 2, q: { w: rwid }, bang: true };
      });
    }
    fBest.hs.forEach((hang, hi_) => {
      const w = hangW(hang, f);
      // can giua theo MEP KHUNG (nhan lech phai / trai khong keo ca hang lech): phan nhan thua ra moi dau gan bang nhau
      const sl = (q) => (q.w - q.wBox) / 2;
      let x = A.x + (A.w - w) / 2 - (sl(hang[0]) - sl(hang[hang.length - 1])) / 2;
      x = Math.max(A.x, Math.min(x, A.x + A.w - w));
      const coRo = hang.some((q) => q.wRo);
      const hB = Math.max(...hang.map((q) => q.hBox));
      const yB = y + (coRo ? hang[0].fr * 1.3 + 0.1 * hB : 0);
      hang.forEach((q, qi) => {
        const p = q.p, i = phan.indexOf(p);
        const gp = gP(f, q, qi);
        x += gp;
        const cx = x + q.w / 2, cy = yB + hB / 2;
        const cls = 's-c ' + (q.nl > 1 ? 'can giua' : 'mot') + ' c-' + p.mau + (p.loai === 'chu' ? ' jp' : '');
        const e = chu(c, donVi(p.chu), cls, { x: cx - q.k.wt / 2, y: cy - q.k.h / 2, w: q.k.wt }, q.fk || f);
        const vien = q.tron ? vong(c, cx, cy, q.wBox / 2, q.hBox / 2, p.mau, 42 + i) : hop(c, cx - q.wBox / 2, cy - q.hBox / 2, q.wBox, q.hBox, p.mau, 41 + i);
        let eRo = null, eB = null, mt = null;
        if (p.ro) eRo = chu(c, donVi(p.ro), 's-c mot c-' + p.mau, { x: cx - q.wRo / 2, y: yB - q.fr * 1.3 - 0.1 * hB, w: q.wRo }, q.fr);
        if (p.body) {
          const y1 = yB + hB + 2 * u, y2 = y1 + f * 0.3;
          mt = muiTen(c, cx, y1, cx, y2, p.mau + ' mong', 4);
          eB = chu(c, donVi(p.body), 's-c mot c-' + p.mau, { x: cx - q.wBody / 2, y: y2 + 2 * u, w: q.wBody }, q.ft);
        }
        // dau noi truoc cum (→ ve bang net phan giua khoang cach, + / vs viet bang chu)
        let mtS = null, eS = null;
        if (p.sep && gp > 0) {
          const xa = x - gp, ob = Math.round((dt ? 3 : 6) * u) + 2;
          if (p.sep === '→') { if (gp - 2 * ob >= 8) mtS = muiTen(c, xa + ob, cy, xa + gp - ob, cy, 'vang mong', 0); }
          else { const fs_ = Math.max(fsSan(), Math.round(f * 0.66)), ks = kt(donVi(p.sep), 's-c mot', fs_, 400); eS = chu(c, donVi(p.sep), 's-c mot c-vang', { x: xa + (gp - ks.wt) / 2, y: cy - ks.h / 2, w: ks.wt }, fs_); }
        }
        khoi[i] = { e, vien, eRo, eB, mt, mtS, eS, cx, cy, q };
        x += q.w;
      });
      y += hangH(hang, f) + f * 0.3;
    });
    y = fBest.hs.length ? y - f * 0.3 + g2 + gap * 0.4 : (bangInfo ? y + bangInfo.fr.h + g2 + gap * 0.4 : y + gap * 0.4);
    // o giai thich + ghi chu
    const els = { ghi: [] };
    // cac o dung SAU khi biet het (de chon co chu chung): o ghi chu (luu y / van hoa) cung mot co, giai thich khong nho hon ghi chu
    const dsO = [];
    const datO = (html, x, yy, w, h, mau, seed, ghiChu) => { const o = { sp: [html, x, yy, w, h, mau, seed, !!ghiChu] }; dsO.push(o); return o; };
    const taoCacO = () => {
      // o cao hon chu (dong cot / dong hang): phong chu vua o (toi 1,3 lan co chung)
      const fF = dsO.map((o) => fit(o.sp[0], 's-c dep', o.sp[3], o.sp[4], Math.round(bo.fs * 1.3), bo.fs, padE).fs);
      const fNote = Math.min(1e9, ...dsO.map((o, i) => (o.sp[7] ? fF[i] : 1e9)));
      const fEx = Math.max(0, ...dsO.map((o, i) => (o.sp[7] ? 0 : fF[i])));
      dsO.forEach((o, i) => {
        const [html, x, yy, w, h, mau, seed, ghiChu] = o.sp;
        const fo_ = ghiChu ? (fEx > 0 ? Math.min(fNote, fEx) : fNote) : fF[i];
        o.e = chu(c, html, 's-c dep s-o', { x, y: yy, w, h }, fo_, padE + ';height:' + Math.round(h) + 'px');
        o.k = hop(c, x, yy, w, h, mau, seed);
        delete o.sp;
      });
    };
    const mauG = (h) => (h === hLu ? 'hong mong' : 'la mong');
    if (doi) {
      els.o = datO(expl ? hGT : ghi[0], A.x, y, A.w, bo.hE, '', 81);
      els.o.dang = expl ? 'ex' : (hLu ? 'lu' : 'vh');
    } else if (bo.mode === 'canh') {
      if (expl) els.ex = datO(hGT, A.x, y, bo.wL, bo.H, '', 81);
      const sum = bo.hs.reduce((x, y_) => x + y_, 0) + gap * (bo.hs.length - 1), them = (bo.H - sum) / Math.max(1, bo.hs.length);
      let yy = y;
      ghi.forEach((h, i) => { const hh = bo.hs[i] + them; els.ghi.push(datO(h, A.x + bo.wL + gap, yy, bo.wR, hh, mauG(h), 82 + i, true)); yy += hh + gap; });
    } else if (bo.mode === 'tren') {
      let yy = y;
      if (expl) { els.ex = datO(hGT, A.x, yy, A.w, bo.hE, '', 81); yy += bo.hE + gap; }
      ghi.forEach((h, i) => { els.ghi.push(datO(h, A.x + i * (bo.wN + gap), yy, bo.wN, bo.hs[i], mauG(h), 82 + i, true)); });
    } else {
      let yy = y;
      if (expl) { els.ex = datO(hGT, A.x, yy, A.w, bo.hE, '', 81); yy += bo.hE + gap; }
      ghi.forEach((h, i) => { els.ghi.push(datO(h, A.x, yy, A.w, bo.hs[i], mauG(h), 82 + i, true)); yy += bo.hs[i] + gap; });
    }
    taoCacO();
    const exO = els.ex || (doi && expl ? els.o : null);
    const luO = doi ? null : (hLu ? els.ghi[0] : null);
    const vhO = doi ? null : (hVh ? els.ghi[hLu ? 1 : 0] : null);
    // moc
    // chi khung cong thuc ve som; khung + nhan cua o giai thich / luu y / van hoa ve CUNG LUC voi noi dung cua no (khong de o trong cho cue)
    // vong / hop cua moi o ve CUNG LUC voi chu trong no (khong de khung rong cho cue)
    khoi.forEach((k, i) => {
      if (!k) return;
      if (k.bang) { c.rev['b' + i] = () => { ve(c, k.vien, 0, 0.22); viet(c, k.e, 0.1, null, { max: 0.55 }); }; return; }
      c.rev['b' + i] = () => { if (k.mtS) ve(c, k.mtS, 0, 0.16); if (k.eS) viet(c, k.eS, 0, 0.12, { cam: false }); ve(c, k.vien, 0, 0.2); viet(c, k.e, 0.1, null, { max: 0.45 }); if (k.eRo) viet(c, k.eRo, 0.12, 0.12, { cam: false }); if (k.mt) ve(c, k.mt, 0.2, 0.12); if (k.eB) viet(c, k.eB, 0.28, null, { cam: false, max: 0.35 }); };
    });
    const sp = exO ? Array.from(exO.e.querySelectorAll('.s-cau-gt')) : [];
    sp.forEach((s, i) => { c.rev['s' + i] = () => vietCau(c, s); });
    if (luO) c.rev.lu = () => { khungO(c, luO, 0); viet(c, luO.e.querySelector('.s-bd'), 0.22, null, { max: 1.2 }); };
    if (vhO) c.rev.vh = () => { khungO(c, vhO, 0); viet(c, vhO.e.querySelector('.s-bd'), 0.22, null, { max: 1.2 }); };
    if (doi && !expl && els.o) c.rev.o0 = () => { khungO(c, els.o, 0); viet(c, els.o.e.querySelector('.s-bd'), 0.22, null, { max: 1.2 }); };
    c.rev.de = () => viet(c, eT, 0, null, { cam: false, max: 0.5 });
    mocX(c, 'de', 0.05, A.x + A.w * 0.3);
    khoi.forEach((k, i) => mocX(c, 'b' + i, 1.5 + 0.3 * i, k.cx - k.q.w / 2));
    sp.forEach((s, i) => moc(c, 's' + i, 3.6 + 0.8 * i));
    if (luO) moc(c, 'lu', 8 + sp.length * 0.9);
    if (vhO) moc(c, 'vh', 10 + sp.length * 0.9);
    if (c.rev.o0) moc(c, 'o0', 3.8);
    c.np = { phan, map, khoi, sp, exO, luO, vhO, doi, els, hLu, hVh, hGT, fs: bo.fs, padE, A, bang: !!bangF, tin: !!tinF };
  }
  /** Viet mot cau giai thich (span trong khoi da .da? -> danh dau rieng) */
  /** Ve khung + nhan (.s-hd) cua mot o (giai thich / luu y / van hoa) mot lan; tra ve thoi gian cho (giay) truoc khi viet noi dung */
  function khungO(c, o, t) {
    if (!o || o.xongKhung) return 0;
    o.xongKhung = true;
    ve(c, o.k, t || 0, 0.3);
    viet(c, o.e.querySelector('.s-hd'), (t || 0) + 0.13, 0.2, { cam: false });
    return 0.22;
  }
  function vietCau(c, s) {
    if (!s || s.dataset.viet) return;
    const N = c.np, ex = N && N.exO && N.exO.e.contains(s) ? N.exO : null;
    const cho = ex ? khungO(c, ex, 0) : 0;
    const box = s.closest('.s-c');
    if (box && !box.classList.contains('da')) {
      // khoi chua viet: danh dau cac nhan / cau khac van an (k chua .da rieng) roi bat khoi
      box.querySelectorAll('.s-cau-gt').forEach((x) => { if (!x.dataset.viet) x.querySelectorAll('.k').forEach((k) => { k.style.clipPath = 'inset(0 100% 0 0)'; }); });
      box.classList.add('da'); box.dataset.viet = '1';
    }
    s.querySelectorAll('.k').forEach((k) => { k.style.clipPath = ''; });
    viet(c, s, cho, null, { max: 1.0 });
  }
  function cueMauCau(m, id, tt, api, nh, c) {
    const t = api.tre(tt), N = c.np;
    if (!N) return;
    const cp = N.tin && nh.congThuc ? nh.congThuc.phan : null;
    const dichBang = (j, tot) => Math.max(0, Math.min(N.phan.length - 1, Math.floor(j * N.phan.length / Math.max(1, tot))));
    const dich = (loai, j) => {
      if (N.bang) return dichBang(j, Math.max(j + 1, nh.congThuc && nh.congThuc.phan ? nh.congThuc.phan.filter((e) => (e.loai === 'chu' ? 'chu' : 'o') === loai).length : j + 1));
      if (cp) { let dem = 0; for (let q = 0; q < cp.length; q++) { const l = cp[q].loai === 'chu' ? 'chu' : 'o'; if (l === loai) { if (dem === j) return N.map[q]; dem++; } } return -1; }
      const k = N.phan.findIndex((p) => p.loai === loai && p.j === j);
      if (k >= 0) return k;
      // so cue nhieu hon so manh cua ta (cong thuc tach khac dao dien): cue du dung vao manh cuoi cung cung loai
      const ls = N.phan.map((p, q) => (p.loai === loai ? q : -1)).filter((q) => q >= 0);
      return ls.length ? ls[ls.length - 1] : -1;
    };
    let x, i = -1;
    if (id === 'G0') { N.khoi.forEach((k, q) => moc(c, 'b' + q, 1.2 + 0.25 * q + t)); return; }
    if ((x = /^G2\.(\d+)$/.exec(id))) i = dich('chu', +x[1]);
    else if ((x = /^G3\.(\d+)$/.exec(id))) i = dich('o', +x[1]);
    else if ((x = /^G2p\.(\d+)$/.exec(id))) {
      if (N.bang) { let cum_ = 0; const j = +x[1]; i = N.phan.length - 1; for (let q = 0; q < N.phan.length; q++) { cum_ += N.phan[q].jc || 1; if (j < cum_) { i = q; break; } } }
      else { const jp = N.phan.map((p, k) => (p.loai === 'chu' ? k : -1)).filter((k) => k >= 0); i = jp.length ? jp[Math.min(+x[1], jp.length - 1)] : Math.min(+x[1], N.khoi.length - 1); }
    }
    else if ((x = /^G2c\.(\d+)$/.exec(id))) { const k = dich('chu', +x[1]); if (k >= 0) { moc(c, 'b' + k, t); if (N.khoi[k] && N.khoi[k].eRo) nay(N.khoi[k].eRo, t, 1.15); } return; }
    if (i >= 0 && N.khoi[i]) {
      for (let q = 0; q < i; q++) moc(c, 'b' + q, t);
      if (!moc(c, 'b' + i, t)) nay(N.khoi[i].e, t, 1.08);
      return;
    }
    if ((x = /^G4\.(\d+)$/.exec(id))) {
      const s = Math.min(+x[1], N.sp.length - 1);
      for (let q = 0; q <= s; q++) moc(c, 's' + q, t);
      // cau giai thich cuoi: luu y / van hoa dung ngay sau (du phong bam theo giong noi, khong theo dong ho tu luc vao nhip)
      if (s >= N.sp.length - 1) { if (N.luO) moc(c, 'lu', t + 2.4); if (N.vhO) moc(c, 'vh', t + 5); }
      const sp = N.sp[s];
      if (sp && !giam()) {
        N.sp.forEach((o) => { if (o !== sp) G.to(o, { color: '#f8f6ef', duration: 0.2, delay: t, overwrite: 'auto' }); });
        G.to(sp, { color: '#f7d76a', duration: 0.16, delay: t, ease: 'power2.out', overwrite: 'auto' });
      }
      if (N.doi && N.els.o && N.els.o.dang) doiO(c, N, 'ex', t);
      return;
    }
    // o luu y / van hoa da hien (dong ho du phong som hon tieng): cue chi dua tieu diem (phong nhe)
    if (id === 'G5') { if (N.doi) { doiO(c, N, 'lu', t); moc(c, 'o0', t); } else if (daXong(c, 'lu')) nay(N.luO && N.luO.e, t, 1.03); else moc(c, 'lu', t); }
    if (id === 'G6') { if (N.doi) { doiO(c, N, 'vh', t); moc(c, 'o0', t); } else if (daXong(c, 'vh')) nay(N.vhO && N.vhO.e, t, 1.03); else moc(c, 'vh', t); }
  }
  /** Dien thoai, khong du cho: o duy nhat doi noi dung (giai thich, luu y, van hoa): lau roi viet lai */
  function doiO(c, N, loai, t) {
    const o = N.els.o;
    if (!o) return;
    const html = loai === 'ex' ? N.hGT : (loai === 'lu' ? N.hLu : N.hVh);
    if (!html || (o.muon || o.dang) === loai) return;
    o.muon = loai;
    c.hen.push(G.delayedCall(Math.max(0, t), () => doiChay(c, N, o)));
  }
  /**
   * Chay mot lan doi noi dung tai mot thoi diem: cac cue G4 / G5 / G6 gan nhau khong duoc lau CHONG LEN NHAU (hai lan lau cung lay o.e cu
   * -> hai o moi cung hien, chu xep chong len nhau). Dang lau thi cue sau chi ghi "muon" va duoc chay ngay khi lan lau truoc xong.
   */
  function doiChay(c, N, o) {
    if (o.ban || !o.e || !o.e.isConnected || !o.muon || o.muon === o.dang) return;
    const loai = o.muon;
    const html = loai === 'ex' ? N.hGT : (loai === 'lu' ? N.hLu : N.hVh);
    if (!html) { o.muon = o.dang; return; }
    o.ban = true; o.dang = loai;
    const r = { x: parseFloat(o.e.style.left), y: parseFloat(o.e.style.top), w: parseFloat(o.e.style.width), h: parseFloat(o.e.dataset.fh || o.e.offsetHeight) };
    const cu = o.e;
    lauVung([cu], r, () => {
      o.ban = false;
      if (!c.el.isConnected) return;
      const fo_ = fit(html, 's-c dep s-o', r.w, r.h, Math.round(N.fs * 1.35), N.fs, N.padE).fs;
      const e = chu(c, html, 's-c dep s-o', { x: r.x, y: r.y, w: r.w, h: r.h }, fo_, N.padE + ';height:' + Math.round(r.h) + 'px');
      o.e = e;
      const ck = khungO(c, o, 0);
      if (!ck) viet(c, e.querySelector('.s-hd'), 0, 0.15, { cam: false });
      viet(c, e.querySelector('.s-bd'), ck || 0.12, null, { max: 1.2 });
      // chu dai hon o (cung co): thu nho cho vua
      thuNho(e, r.h);
      // con cue moi hon trong luc lau: chuyen tiep ngay (khong de hai noi dung cung hien)
      if (o.muon && o.muon !== o.dang) doiChay(c, N, o);
    });
  }
  /** Thu nho deu co chu khoi e cho toi khi cao <= h (khong duoi san) */
  function thuNho(e, h) {
    const san = fsSan();
    let f = parseFloat(e.style.fontSize) || 16;
    for (let i = 0; i < 12 && Math.max(e.offsetHeight, e.scrollHeight) > h + 1 && f > san; i++) { f = Math.max(san, Math.round(f * 0.94 * 10) / 10); datCo(e, f); }
  }

  // ================================================================== VI DU
  function nhanToken(nh, toks) {
    // tra mang tag theo chi so token: { t, mau }
    const out = toks.map(() => null);
    const g = nh.ghep, cp = nh.congThuc && nh.congThuc.phan;
    if (g && g.kieu === 'ASSEMBLE' && cp) {
      let jo = 0;
      const mauO = {};
      cp.forEach((p, i) => { if (p.loai !== 'chu') mauO[i] = MAU_O[jo++ % 3]; });
      (g.gan || []).forEach((x) => {
        const tk = (x.tok || []).filter((i) => toks[i]);
        if (!tk.length) return;
        if (x.loai === 'chu') {
          const base = chuTok(toks[tk[0]]), mau = DS_TRO.includes(base) ? 'hong' : 'cam';
          tk.forEach((q) => { out[q] = { t: '', mau, tokMau: mau }; });
          out[tk[0]] = { t: laKanaNh(nh) ? '' : (C.vaiTro(base) || (ROMAJI_TRO[base] || '')), mau, tokMau: mau };
        }
        else {
          // o bien (N, Aい...): nhan dat duoi token CUOI cua cum (danh tu chinh), ca cum duoc to cung mau voi o trong cong thuc
          let lab = String((cp[x.ei] && cp[x.ei].nhan) || '').replace(/[\-(（]+$/, '').trim();
          if (!lab || !/[A-Za-z0-9぀-ヿ一-鿿]/.test(lab)) lab = '…';
          const mau = mauO[x.ei] || 'xanh';
          tk.forEach((q) => { out[q] = { t: '', mau, tokMau: mau }; });
          out[tk[tk.length - 1]] = { t: lab, mau, tokMau: mau };
        }
      });
    }
    toks.forEach((t, i) => {
      if (out[i] || !t) return;
      const base = chuTok(t);
      if (t.isKeyGrammar) { const v = laKanaNh(nh) ? '' : (C.vaiTro(base) || ROMAJI_TRO[base] || ''); if (v) out[i] = { t: v, mau: DS_TRO.includes(base) ? 'hong' : 'cam' }; }
      else { const v = C.nghiaTu(t, nh.bai) || ''; if (v && kyTu(v).length <= 16) out[i] = { t: v, mau: 'trang' }; }
    });
    return out;
  }
  /** Html cau: cac token (gop dau cau vao token truoc), moi token .k.s-tok co nhan duoi */
  function cauHtml(toks, tags, o) {
    o = o || {};
    const items = [];
    toks.forEach((t, i) => {
      if (!t) return;
      if (laDau(t) && items.length) { items[items.length - 1].toks.push(i); items[items.length - 1].html += C.tok(t, i, toks); return; }
      items.push({ toks: [i], html: C.tok(t, i, toks), tag: tags ? tags[i] : null, key: !!t.isKeyGrammar, id: t.id });
    });
    const tokHtml = (it, k) => {
      const b0 = chuTok(toks[it.toks[0]]);
      const mau = it.tag && it.tag.tokMau ? ' c-' + it.tag.tokMau : (it.key && kyTu(b0).length <= 4 ? (DS_TRO.includes(b0) ? ' c-hong' : ' c-cam') : '');
      const tg = o.tag === false ? '' : '<span class="s-tag c-' + (it.tag && it.tag.t ? it.tag.mau : 'trang') + '"' + (it.tag && RE_JP.test(it.tag.t) && !/[a-zà-ỹ]/i.test(it.tag.t) ? ' lang="ja"' : '') + '>' + (it.tag ? esc(it.tag.t) : '') + '</span>';
      return '<span class="k s-tok' + mau + '" data-k="' + k + '" data-tid="' + esc(it.id || '') + '"' + (it.bl ? ' data-bl="' + it.bl.toFixed(3) + '" style="margin-right:calc(.09em - ' + it.bl.toFixed(3) + 'em)"' : '') + '><span class="s-tok-c" lang="ja">' + it.html + '</span>' + tg + '</span>';
    };
    // chi cho phep xuong dong o RANH GIOI CUM (bunsetsu): tro tu / duoi cau (hiragana <= 2 ky tu, hoac thuoc danh sach duoi cau), token ngan o cuoi cau, va cac token cua cung mot mau cau trong diem
    // dinh vao token truoc -> khong con "雨にも | かかわらず" hay dong bat dau bang "に" / "は" / "を"
    const chuIt = (it) => it.toks.map((i) => chuTok(toks[i])).join('');
    const laDuoi = (it, k) => {
      const t = chuIt(it);
      if (/^[ぁ-ゟ]{1,2}$/.test(t) || RE_DUOI.test(t)) return true;
      if (it.key && items[k - 1] && items[k - 1].key) return true;
      // dong tu: than tu Han + doi thanh hiragana (参加 | しました, 勉強 | します): mot cum
      if (/^[ぁ-ゟ]{3,6}$/.test(t) && items[k - 1] && /[㐀-鿿々]$/.test(chuIt(items[k - 1]))) return true;
      return k === items.length - 1 && k >= 2 && kyTu(t).length <= 2;
    };
    // dau cau toan hinh cuoi token: phan trong ben phai cua chu (！、。) -> do bang canvas, don vi em; gach chan / can giua tinh theo muc muc
    // chi token cuoi cau (khong co token nao sau no -> khong co hop chong len nhau): bo phan trong de can giua / gach chan theo muc chu
    const itC = items[items.length - 1], cuoiC = itC && kyTu(chuIt(itC)).pop();
    if (cuoiC && /[！？。、，．」』）]/.test(cuoiC)) itC.bl = blankEm(cuoiC);
    const nhom = [];
    // nhom dinh nhau (nowrap) khong dai qua ~14 ky tu: hai menh dai ("はい、わかります。" + "ありがとうございます。") dinh thanh mot khoi khong xuong dong duoc -> tran ben phai khung o co chu nho nhat
    const dNhom = (g) => g.reduce((a, q) => a + kyTu(chuIt(items[q])).length, 0);
    items.forEach((it, k) => { if (k > 0 && laDuoi(it, k) && dNhom(nhom[nhom.length - 1]) + kyTu(chuIt(it)).length <= 14) nhom[nhom.length - 1].push(k); else nhom.push([k]); });
    const html = nhom.map((g) => { const hs = g.map((k) => tokHtml(items[k], k)); return g.length > 1 ? '<span class="s-nw">' + hs.join('') + '</span>' : hs[0]; });
    return { html: html.join(''), items };
  }
  /**
   * Cau xuong dong de lai mot dong ngan le (mot cum duy nhat < 28 % dong dai nhat: "早く / 寝る / ようにする ..."): thu nho nhe co chu (toi da 5 lan x 0,95, khong duoi mn) cho toi khi
   * cac cum don lai doan sau xep lai thanh dong day hon. Khong co dong le thi giu nguyen.
   */
  function tranhDongLe(e, mn) {
    try {
      let f = parseFloat(e.style.fontSize) || 0;
      for (let k = 0; k < 5 && f > mn; k++) {
        const ts = Array.from(e.querySelectorAll('.s-tok'));
        if (ts.length < 3) return;
        const dong = [];
        ts.forEach((t) => {
          const cy = t.offsetTop + t.offsetHeight / 2, d = dong.find((x) => Math.abs(x.cy - cy) < f * 0.45);
          const l = t.offsetLeft, r = t.offsetLeft + t.offsetWidth;
          if (d) { d.l = Math.min(d.l, l); d.r = Math.max(d.r, r); } else dong.push({ cy, l, r });
        });
        if (dong.length < 2) return;
        const wmax = Math.max(...dong.map((d) => d.r - d.l));
        if (!dong.some((d) => d.r - d.l < 0.28 * wmax)) return;
        const nf = Math.max(mn, Math.round(f * 0.95 * 10) / 10);
        if (nf >= f) return;
        datCo(e, nf); f = nf;
      }
    } catch (er) {}
  }
  /** Cau day het be ngang: phan trong cua dau cau cuoi (margin am) se nhoai ra ngoai khoi -> bo margin am (gach chan van dung o dau muc chu) */
  function kiemMuc(blk) {
    try {
      const t = blk && blk.querySelector('.s-tok[data-bl]');
      if (!t || !t.style.marginRight) return;
      const pr = parseFloat(getComputedStyle(blk).paddingRight) || 0;
      if (t.getBoundingClientRect().right > blk.getBoundingClientRect().right - pr - 0.5) t.style.marginRight = '';
    } catch (e) {}
  }
  /**
   * kiemMuc bo margin am cua dau cau cuoi -> dong cuoi co the khong con vua be ngang do san va xuong dong them (cau cao hon o / khung do san,
   * dong cuoi tran khoi khung, de len dong nghia). Mo rong ngang tung buoc toi wMax, khong du thi thu nho chu cho vua hMax. Tra be ngang cuoi.
   */
  function giuCao(e, hMax, wMax) {
    try {
      let w = e.offsetWidth;
      for (let k = 0; k < 80 && e.offsetHeight > hMax + 1 && w < wMax; k++) { w = Math.min(wMax, w + 6); e.style.width = Math.round(w) + 'px'; }
      if (e.offsetHeight > hMax + 1) thuNho(e, hMax);
    } catch (er) {}
    return e.offsetWidth;
  }
  /** Phan trong (em) ben phai muc cua mot ky tu toan hinh (！、。): do bang canvas (actualBoundingBoxRight); khong do duoc -> uoc luong */
  const BL_CACHE = {};
  function blankEm(ch) {
    if (BL_CACHE[ch] != null) return BL_CACHE[ch];
    let v = /[、，。．]/.test(ch) ? 0.55 : /[！？]/.test(ch) ? 0.42 : 0.3;
    try {
      if (!blankEm.cv) blankEm.cv = document.createElement('canvas').getContext('2d');
      const cx = blankEm.cv;
      cx.font = '100px "Yusei Magic", "Zen Maru Gothic", "Yu Gothic", sans-serif';
      const m = cx.measureText(ch);
      if (m && m.width > 0 && m.actualBoundingBoxRight != null && document.fonts && document.fonts.status === 'loaded') v = Math.max(0, Math.min(0.9, (m.width - m.actualBoundingBoxRight) / 100));
      else if (m && m.width > 0 && m.actualBoundingBoxRight != null) return Math.max(0, Math.min(0.9, (m.width - m.actualBoundingBoxRight) / 100));   // font chua tai xong: khong luu vao cache
    } catch (e) {}
    BL_CACHE[ch] = v;
    return v;
  }
  function dungViDu(nh, c) {
    const d = nh.data || {}, dt = st.dt, u = st.u, toks = d.tokens || [];
    const slide = (nh.beat && nh.beat.slide) || {};
    const tenSlide = nganTu(String(slide.title || '').replace(/^\d+\.\s*/, '').split(/:\s*/)[0].replace(/\s*[(（][^)）]*[)）]?\s*/g, ' ').trim(), 34);
    const yTop0 = nhanMuc(c, [['Ví dụ', ''], [tenSlide ? '· ' + tenSlide : '', 'c-vang']], tagBai(nh));
    const tags = nhanToken(nh, toks);
    const url0 = C.anhCau(toks, nh.bai) || null;
    // hang tren (anh / khung mau cau) can cach dai nhan: net khung ve tay khong sat net gach song
    const A = vung(yTop0 + ((url0 || (nh.congThuc && nh.congThuc.phan && nh.congThuc.phan.length) || /:/.test(String(slide.title || ''))) ? Math.round(9 * u) : 0));
    const gap = Math.round((dt ? 10 : 24) * u);
    const pg_ = nh.congThuc ? phanGon(nh, 7) : { phan: [], bang: false };
    const phan = pg_.bang ? [] : pg_.phan;
    const hF0 = phan.length ? phan.map((p) => '<span class="k c-' + p.mau + '"' + (p.loai === 'chu' ? ' lang="ja"' : '') + '>' + esc(p.chu) + '</span>').join(' ') : (String(slide.title || '').split(/:\s*/).slice(1).join(': ').trim() ? donVi(String(slide.title).split(/:\s*/).slice(1).join(': ').trim()) : '');
    const hTop = Math.round(Math.min(A.h * (dt ? 0.2 : 0.26), (dt ? 100 : 170) * u));
    const nKy = kyTu(toks.map(chuTok).join('')).length;
    const fC = T('cau', nKy <= 4 ? 2.0 : nKy <= 8 ? 1.6 : nKy <= 14 ? 1.2 : 1), fNg = T('nghia', nKy <= 8 ? 1.15 : 0.9);
    const ng = tachNghia(d.meaningVi);
    const hNg = '<span class="s-nl">' + donVi('nghĩa:') + '</span><span class="s-ng">' + donVi((ng.chinh || d.meaningVi || '') + (ng.phu ? ' (' + ng.phu + ')' : '')) + '</span>';
    // cau dai (stress): bo hang tren, roi bo nhan vai tro duoi token -> khong de chu tran khoi bang
    let coTop = !!(url0 || hF0), coTag = tags.some(Boolean), ch, Rc, x;
    for (let lan = 0; lan < 3; lan++) {
      ch = cauHtml(toks, coTag ? tags : null, { tag: coTag });
      const yC = A.y + (coTop ? hTop + gap : 0);
      Rc = R(A.x, yC, A.w, A.y + A.h - yC);
      const bs = [
        { k: 'cau', html: ch.html, cls: 's-c jp s-cau can giua', w: Rc.w, mx: fC.max, mn: fC.min, dong: dt ? 2 : 1, san: 0.72 },
        { k: 'ng', html: hNg, cls: 's-c can giua', w: Rc.w, mx: fNg.max, mn: fNg.min, dong: 1 },
      ];
      x = xepDoc(bs, Rc.h, gap, Math.round((dt ? 90 : 60) * u));
      if (!x.tran) break;
      if (coTop) coTop = false; else if (coTag) coTag = false; else break;
    }
    const url = coTop ? url0 : null, hF = coTop ? hF0 : '';
    let p = null, eF = null, kF = null;
    if (coTop) {
      let x0 = A.x;
      if (url) { p = anh(c, url, R(A.x, A.y, hTop, hTop), (nh.i % 2 ? 2 : -2), [[NC[nh.i % 4], 0.5]]); x0 += hTop + gap * 1.5; }
      if (hF) {
        const wF = A.x + A.w - x0;
        const hHtml = '<div class="s-hd">' + donVi('Mẫu câu') + '</div><div class="s-bd">' + hF + '</div>';
        const ff = fit(hHtml, 's-c', wF - 4 * u, hTop, T('form', 0.62).max, T('phu').min, 'padding:.3em .7em;line-height:1.2');
        const wb = Math.min(wF, kt(hHtml, 's-c', ff.fs, wF - 4 * u, 'padding:.3em .7em;line-height:1.2').wt);
        const xb = url ? x0 + (wF - wb) / 2 : A.x + (A.w - wb) / 2;
        eF = chu(c, hHtml, 's-c', { x: xb, y: A.y + (hTop - ff.h) / 2, w: wb, h: ff.h }, ff.fs, 'padding:.3em .7em;line-height:1.2');
        eF.querySelector('.s-hd').classList.add('c-vang');
        kF = khungQuanh(c, eF, wb, ff.h, 'mong', 51);
      }
    }
    const eC = chu(c, ch.html, 's-c jp s-cau can giua', { x: Rc.x + (Rc.w - x.ds[0].w) / 2, y: Rc.y + x.ds[0].y, w: x.ds[0].w, h: x.ds[0].h }, x.ds[0].fs);
    kiemMuc(eC);
    { const wF = giuCao(eC, x.ds[0].h, Rc.w); if (Math.abs(wF - (x.ds[0].w + 1)) > 1) eC.style.left = Math.round(Rc.x + (Rc.w - wF) / 2) + 'px'; }
    tranhDongLe(eC, Math.max(fsSan(), Math.round(x.ds[0].fs * 0.8)));
    const eN = chu(c, hNg, 's-c can giua', { x: Rc.x + (Rc.w - x.ds[1].w) / 2, y: Rc.y + x.ds[1].y, w: x.ds[1].w, h: x.ds[1].h }, x.ds[1].fs);
    const tokEls = Array.from(eC.querySelectorAll('.s-tok'));
    const tokTile = {};
    ch.items.forEach((it, k) => it.toks.forEach((i) => { tokTile[i] = k; }));
    // cac token chua viet: nhan duoi + gach cho (cau truc) hien ngay; chu token viet khi Sensei doc (karaoke)
    const tagEls = tokEls.map((e) => e.querySelector('.s-tag'));
    eC.classList.add('da'); eC.dataset.viet = '1';
    tokEls.forEach((e) => { e.style.clipPath = 'none'; e.querySelector('.s-tok-c').style.clipPath = 'inset(0 100% 0 0)'; if (e.querySelector('.s-tag')) e.querySelector('.s-tag').style.clipPath = 'inset(0 100% 0 0)'; });
    c.rev.anh = () => dan(p, 0);
    c.rev.khung = () => {
      if (kF) ve(c, kF, 0, 0.26);
      if (eF) viet(c, eF, 0.12, 0.4, { cam: false });
      choTrong(c, eC, tokEls, tagEls);
    };
    tokEls.forEach((e, k) => { c.rev['t' + k] = () => vietTok(c, e, 0); });
    c.rev.ng = () => { viet(c, eN.querySelector('.s-nl'), 0, 0.14, { cam: false }); viet(c, eN.querySelector('.s-ng'), 0.1, null, { max: 0.8 }); };
    c.rev.tatCa = () => { let t = 0; tokEls.forEach((e, k) => { moc(c, 't' + k, t); t += 0.1; }); };
    mocX(c, 'anh', 0.05, p ? p.r.x + p.r.w : 0);
    mocX(c, 'khung', 0.12, A.x + A.w * 0.5);
    mocX(c, 'tatCa', 2.6, Rc.x + (Rc.w - x.ds[0].w) / 2);
    mocX(c, 'ng', 4.6, Rc.x + (Rc.w - x.ds[1].w) / 2);
    c.vd = { eC, eN, tokEls, tokTile, items: ch.items, gach: null };
  }
  /** Gach cho (net dut) duoi moi token + viet nhan vai tro */
  function choTrong(c, eC, tokEls, tagEls) {
    if (!eC.isConnected) return;
    const ox = parseFloat(eC.style.left) || 0, oy = parseFloat(eC.style.top) || 0;
    tokEls.forEach((e, k) => {
      const tc = e.querySelector('.s-tok-c');
      const x = ox + e.offsetLeft + tc.offsetLeft, y = oy + e.offsetTop + tc.offsetTop + tc.offsetHeight;
      const g = dat(mk('div', 's-cho', c.phan), { x: x + 3 * st.u, y: y + 1, w: Math.max(6, tc.offsetWidth - 6 * st.u) });
      e._cho = g;
      if (giam()) return;
      G.fromTo(g, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.14, ease: 'none', delay: 0.04 * k });
      const tg = tagEls[k];
      if (tg) { G.fromTo(tg, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.14, ease: 'none', delay: 0.06 + 0.04 * k, onComplete: () => G.set(tg, { clearProps: 'clipPath' }) }); }
    });
    if (giam()) tagEls.forEach((tg) => { if (tg) tg.style.clipPath = ''; });
  }
  function vietTok(c, e, t, dur) {
    if (!e || e.dataset.viet) return;
    e.dataset.viet = '1';
    const tc = e.querySelector('.s-tok-c');
    if (giam()) { tc.style.clipPath = ''; if (e._cho) e._cho.style.opacity = '0'; const tg = e.querySelector('.s-tag'); if (tg) tg.style.clipPath = ''; return; }
    const n = kyTu(tc.textContent).length;
    const d = dur || kep(0.06 + n * 0.05, 0.1, 0.42);
    G.fromTo(tc, { clipPath: HIDE }, { clipPath: SHOW, duration: d, ease: 'none', delay: t, onStart: () => {
      if (!tc.isConnected) return;
      const r = toaDo(tc);
      queChay([{ x: r.x + r.w * 0.06, y: r.y + r.h * 0.66, t: 0 }, { x: r.x + r.w * 0.94, y: r.y + r.h * 0.6, t: d }]);
    }, onComplete: () => G.set(tc, { clearProps: 'clipPath' }) });
    if (e._cho) G.to(e._cho, { opacity: 0, duration: 0.12, delay: t + d * 0.6 });
  }
  /** Gach chan LIEN chay theo giong: moi dong mot thanh, chi dai ra (doc lai -> chay lai tu dau) */
  function dongGach(m, box, tokEls) {
    if (m.gach && m.gach.box === box) return m.gach;
    const fs = parseFloat(box.style.fontSize) || 40;
    const lines = [], cua = new Map();
    tokEls.forEach((e) => {
      const tc = e.querySelector('.s-tok-c') || e;
      const day = e.offsetTop + tc.offsetTop + tc.offsetHeight;
      // token ket thuc bang dau cau toan hinh (！、。): phan trong ben phai muc khong tinh vao gach chan (gach dung dau muc chu that)
      const bl = parseFloat(e.dataset.bl) || 0, xr = e.offsetLeft + e.offsetWidth - (tc.offsetWidth >= e.offsetWidth - 2 ? bl * fs : 0);
      let Ln = lines.find((x) => Math.abs(x.day - day) < fs * 0.5);
      if (!Ln) { Ln = { day, x0: e.offsetLeft, x1: xr, el: null, w: 0 }; lines.push(Ln); }
      Ln.x0 = Math.min(Ln.x0, e.offsetLeft); Ln.x1 = Math.max(Ln.x1, xr);
      cua.set(e, Ln);
    });
    m.gach = { box, fs, lines, cua, lanT: null };
    return m.gach;
  }
  /** Keo thanh gach chan cua dong chua token e toi het token e (het = true: toi het dong, che cac tro tu bi bo qua o cuoi dong) */
  function gachLuot(m, box, tokEls, e, t, dur, het) {
    const g = dongGach(m, box, tokEls);
    const Ln = g.cua.get(e);
    if (!Ln) return;
    const keo = (D, w, d, tt) => {
      const W = Math.max(1, D.x1 - D.x0);
      if (!D.el) {
        D.el = mk('div', 's-gach' + (g.lan2 ? ' s-gach-2' : ''), box);
        D.el.style.cssText = 'left:' + D.x0 + 'px;top:' + Math.round(D.day + g.fs * 0.03) + 'px;width:' + Math.round(W) + 'px;height:' + Math.max(3, Math.round(g.fs * 0.075)) + 'px';
      }
      if (w <= D.w + 0.5) return;
      D.w = w;
      const s = Math.min(1, w / W);
      if (giam()) G.set(D.el, { scaleX: s, delay: tt });
      else G.to(D.el, { scaleX: s, duration: d, delay: tt, ease: 'none', overwrite: false });
    };
    g.lines.forEach((D) => { if (D !== Ln && D.day < Ln.day) keo(D, D.x1 - D.x0, 0.15, t); });
    keo(Ln, het ? Ln.x1 - Ln.x0 : Math.max(0, e.offsetLeft + e.offsetWidth - Ln.x0), dur, t);
  }
  /** Het nhip: moi thanh gach chan da bat dau chay thi ve het dong (khung cuoi du, khong con dong gach do dang) */
  function gachXong(m) {
    const g = m && m.gach;
    if (!g) return;
    g.lines.forEach((D) => {
      if (!D.el) return;
      const W = Math.max(1, D.x1 - D.x0);
      if (D.w >= W - 0.5 && !G.isTweening(D.el)) return;
      D.w = W;
      G.killTweensOf(D.el);
      if (giam()) G.set(D.el, { scaleX: 1 }); else G.to(D.el, { scaleX: 1, duration: 0.15, ease: 'none' });
    });
  }
  function karaokeCau(m, c, ds, box, tokEls, tokTile, viet_) {
    if (!box || !box.isConnected) return;
    const api = m.api, now = api.bayGio();
    if (ds.length && m.gach && m.gach.box === box && m.gach.lanT != null && ds[0].T > m.gach.lanT + 0.3 && ds[0].i <= (m.gach.iCuoi || 0)) {
      m.gach.lines.forEach((D) => { if (D.el) G.killTweensOf(D.el); D.el = null; D.w = 0; });
      m.gach.lan2 = true;
    }
    const g0 = dongGach(m, box, tokEls);
    // token cuoi cung (theo karaoke) cua moi dong: keo gach toi het dong -> tro tu / duoi cau khong co moc rieng van duoc gach
    const cuoiDong = new Map();
    ds.forEach((x, j) => { const e0 = tokEls[tokTile[x.i]], Ln = e0 && g0.cua.get(e0); if (Ln) cuoiDong.set(Ln, j); });
    const xBox = parseFloat(box.style.left) || 0;
    ds.forEach((x, j) => {
      const k = tokTile[x.i];
      const e = tokEls[k];
      if (!e) return;
      const T0 = x.T - api.LEAD;
      const tre = Math.max(0, now - T0);                      // da tre bao nhieu giay so voi tieng
      const lo = c.t0 + c.tQua(xBox + e.offsetLeft) - nowG();  // canh co cuc tay lau: cho cuc tay toi cho nay (canh cu van con); dong ho GSAP, khong phai dong ho am thanh
      const t = Math.max(0, T0 - now, lo);
      const sau = ds[j + 1];
      let dur = sau && sau.T > x.T ? Math.min(0.8, Math.max(0.1, sau.T - x.T)) : Math.min(0.6, Math.max(0.12, (e.offsetWidth / (parseFloat(box.style.fontSize) || 40)) * 0.16));
      dur = Math.max(0.08, dur - tre);                        // tre -> chi chay phan con lai (khong chay lai tu dau theo thoi luong goc)
      if (viet_) viet_(k, t, Math.min(dur, 0.42));
      gachLuot(m, box, tokEls, e, t, dur, cuoiDong.get(g0.cua.get(e)) === j);
      if (m.gach) { m.gach.lanT = Math.max(m.gach.lanT == null ? -1e9 : m.gach.lanT, x.T); m.gach.iCuoi = Math.max(m.gach.iCuoi || 0, x.i); }
    });
  }
  function cueViDu(m, id, tt, api, nh, c) {
    const t = api.tre(tt), V = c.vd;
    if (!V) return;
    if (id === 'E1' || id === 'E2' || id === 'E2b') {
      // canh mac dinh khong phai luc nao cung chay karaoke: tu dung nhip doc gia (tung token theo thoi luong cue), gach chan + viet theo
      if (id === 'E2b') return;
      const lan = id === 'E1' ? 1 : 2;
      if (V.lanGia >= lan) return;
      V.lanGia = lan;
      const n = V.items.length;
      const tong = tt && tt.dur ? tt.dur / 1000 : kep(n * 0.32, 0.8, 4);
      const buoc = tong / Math.max(1, n);
      c.hen.push(G.delayedCall(t + 0.25, () => {
        if (V.coKaraoke || !c.el.isConnected) return;
        const T0 = api.bayGio() + api.LEAD - 0.25 + 0.25;
        const ds = V.items.map((it, k) => ({ i: it.toks[0], k, T: T0 + k * buoc }));
        karaokeCau(m, c, ds, V.eC, V.tokEls, V.tokTile, (k, tq, d) => { const e = V.tokEls[k]; if (e && !e.dataset.viet) { huyMoc(c, 't' + k); vietTok(c, e, tq, d); } });
        if (!daXong(c, 'tatCa')) huyMoc(c, 'tatCa');
        moc(c, 'ng', tong + 1.6);
      }));
    }
    else if (id === 'E5') { moc(c, 'ng', t); nay(V.eN, t + 0.02, 1.03); }
    else if (/^E4\.(\d+)$/.test(id)) { const k = V.tokTile[+id.split('.')[1]]; if (V.tokEls[k]) { moc(c, 't' + k, t); nay(V.tokEls[k], t, 1.1); } }
    else if (/^E3/.test(id)) { V.tokEls.forEach((e, k) => { if (V.items[k] && V.items[k].key) nay(e, t + 0.05 * k, 1.07); }); }
  }

  // ================================================================== HOI THOAI
  function tachTen(sp) {
    const s = String(sp || '').trim();
    const mm = /^(.*?)\s*[(（]([^)）]+)[)）]\s*$/.exec(s);
    return mm ? { jp: mm[1].trim(), la: mm[2].trim() } : { jp: s, la: '' };
  }
  function vaiCua(ds) {
    const out = [];
    (ds || []).forEach((l) => { if (!l) return; const t = tachTen(l.speaker); if (!out.find((x) => x.jp === t.jp)) out.push(Object.assign({ anh: l.avatarUrl || '', nv: tuNhanVat(l.avatarUrl) }, t)); });
    return out;
  }
  function ganAvatar(c, img, tuy) {
    const AV = window.SenseiAvatarNoi;
    if (!AV || !AV.gan || !img) return null;
    try { const ct = AV.gan(img, tuy); if (ct) { c.avt.push(ct); return ct; } } catch (e) {}
    return null;
  }
  const tenHtml = (v) => '<div class="s-ten-jp c-vang" lang="ja">' + donVi(v.jp) + '</div>' + (v.la ? '<div class="s-ten-la">' + donVi(v.la) + '</div>' : '');
  function dungKaiwaIntro(nh, c) {
    const dt = st.dt, u = st.u;
    const ds = Array.isArray(nh.data) ? nh.data : [];
    const vai = vaiCua(ds).slice(0, 4);
    const yTop = nhanMuc(c, [['Hội thoại', ''], ['· ' + vai.length + ' nhân vật · ' + ds.length + ' lượt', 'c-vang']], tagBai(nh));
    const A = vung(yTop);
    const gap = Math.round((dt ? 12 : 40) * u);
    const sc = nh.bai && nh.bai.sceneImageUrl;
    let Rp = A, pSc = null;
    if (sc && !dt && vai.length <= 2) {
      const s = Math.round(Math.min(A.h * 0.9, A.w * 0.36));
      pSc = anh(c, sc, R(A.x + A.w - s, A.y + (A.h - s) / 2, s, s), 1.6, [['vang', 0.2], ['la', 0.8]]);
      Rp = R(A.x, A.y, A.w - s - gap, A.h);
    }
    const n = Math.max(1, vai.length);
    const fTen = T('nghia', 0.7);
    const hTen = Math.round(fTen.max * 1.25 + T('phu').max * 1.3);
    // so cot cho chan dung to nhat
    let cols = 1, rows = n, sP = 0;
    for (let k = 1; k <= n; k++) {
      const rw = Math.ceil(n / k);
      const s_ = Math.floor(Math.min((Rp.w - gap * 1.4 * (k - 1)) / k * 0.92, (Rp.h - rw * (hTen + 10 * u) - gap * (rw - 1)) / rw, (dt ? 170 : 320) * u));
      if (s_ > sP) { sP = s_; cols = k; rows = rw; }
    }
    const tongH = rows * (sP + hTen + 10 * u) + (rows - 1) * gap;
    const y0 = Rp.y + (Rp.h - tongH) / 2;
    const items = vai.map((v, i) => {
      const cl = i % cols, rw = Math.floor(i / cols);
      const nIn = Math.min(cols, n - rw * cols);
      const wHang = nIn * sP + (nIn - 1) * gap * 1.4;
      const x = Rp.x + (Rp.w - wHang) / 2 + cl * (sP + gap * 1.4), y = y0 + rw * (sP + hTen + 10 * u + gap);
      const pp = anh(c, v.anh || null, R(x, y, sP, sP), (i % 2 ? 1.5 : -1.5), [[NC[i % 4], 0.5]]);
      if (pp.im) pp.im.style.objectPosition = '50% 22%';
      const ht = tenHtml(v);
      const f = fit(ht, 's-c giua can', sP + gap, hTen, fTen.max, T('phu').min);
      const e = chu(c, ht, 's-c giua can', { x: x + sP / 2 - (sP + gap) / 2, y: y + sP + 10 * u, w: sP + gap, h: hTen }, f.fs);
      const la = e.querySelector('.s-ten-la'); if (la) la.style.fontSize = '0.62em';
      return { pp, e };
    });
    items.forEach((it, i) => { c.rev['p' + i] = () => dan(it.pp, 0); c.rev['n' + i] = () => viet(c, it.e, 0, null, { max: 0.5 }); });
    c.rev.sc = () => dan(pSc, 0);
    items.forEach((it, i) => { mocX(c, 'p' + i, 0.08 + 0.12 * i, it.pp.r.x + it.pp.r.w); mocX(c, 'n' + i, 0.7 + 0.35 * i, it.pp.r.x); });
    if (pSc) mocX(c, 'sc', 0.1, pSc.r.x + pSc.r.w);
    c.ki = { items, vai, ds };
  }
  function cueKaiwaIntro(m, id, tt, api, nh, c) {
    const t = api.tre(tt), K = c.ki;
    if (!K) return;
    let x;
    if ((x = /^C1\.(\d+)$/.exec(id))) { const p = +x[1]; moc(c, 'n' + p, t); if (K.items[p]) nay(K.items[p].pp.e, t, 1.05); }
    else if ((x = /^C2\.(\d+)$/.exec(id))) {
      const l = K.ds[+x[1]];
      if (l) { const tn = tachTen(l.speaker); const p = K.vai.findIndex((v) => v.jp === tn.jp); if (p >= 0 && K.items[p]) { moc(c, 'n' + p, t); nay(K.items[p].pp.e, t, 1.07); nay(K.items[p].e, t, 1.1); } }
    }
  }
  /** Mot luot thoai: chan dung nguoi noi | cau (bong thoai phan) | nghia. run = ca doan (doi luot theo dongThoai) */
  function dungLuot(nh, c, m, run) {
    const dt = st.dt, u = st.u;
    const ds = run ? (Array.isArray(nh.data) ? nh.data : []) : [nh.data || {}];
    const vai = vaiCua(ds).slice(0, 4);
    const tong = run ? ds.length : ((nh.ctx && nh.ctx.cacNhip || []).filter((b) => b && b.kind === 'kaiwa').length || 1);
    const yTop = nhanMuc(c, [['Hội thoại', ''], [(run ? 'Lượt ' : 'Câu ') + tong + ' / ' + tong, 'c-vang s-dem']], tagBai(nh));
    c.demEl = c.nhanEl && c.nhanEl.querySelector('.s-dem');
    c.demTien = run ? 'Lượt ' : 'Câu ';
    const A = vung(yTop);
    const gap = Math.round((dt ? 10 : 36) * u);
    let rP, rTen, Rb, rMini;
    if (!dt) {
      const lw = Math.round(Math.min(A.w * 0.3, A.h * 0.62));
      const hTen = Math.round(T('nghia', 0.8).max * 1.3 + T('phu').max * 1.3);
      const hMini = vai.length > 1 ? Math.round(lw * 0.24) : 0;
      const tot = lw + 10 * u + hTen + (hMini ? 14 * u + hMini : 0);
      const y0 = A.y + Math.max(0, (A.h - tot) / 2);
      rP = R(A.x, y0, lw, lw);
      rTen = R(A.x - 10 * u, y0 + lw + 10 * u, lw + 20 * u, hTen);
      rMini = hMini ? R(A.x, rTen.y + hTen + 14 * u, lw, hMini) : null;
      Rb = R(A.x + lw + gap * 1.3, A.y, A.w - lw - gap * 1.3, A.h);
    } else {
      const s = Math.round(Math.min(A.w * 0.3, 112 * u));
      rP = R(A.x, A.y, s, s);
      const hMini = vai.length > 1 ? Math.round(s * 0.36) : 0;
      rTen = R(A.x + s + gap, A.y + (hMini ? 0 : s * 0.15), A.w - s - gap, s - (hMini ? hMini + 8 * u : s * 0.3));
      rMini = hMini ? R(A.x + s + gap, A.y + s - hMini, A.w - s - gap, hMini) : null;
      Rb = R(A.x, A.y + s + gap * 1.4, A.w, A.h - s - gap * 1.4);
    }
    const mini = [];
    if (rMini) {
      const dm = rMini.h, g2 = Math.round(10 * u);
      vai.forEach((v, i) => { const x = rMini.x + i * (dm + g2); if (x + dm > rMini.x + rMini.w) return; const pp = anh(c, v.anh || null, R(x, rMini.y, dm, dm), 0, [[NC[i % 4], 0.5]]); if (pp.im) pp.im.style.objectPosition = '50% 22%'; mini.push({ v, pp }); });
    }
    const L_ = { ds, vai, tong, run, rP, rTen, Rb, mini, cur: null, i: -1, A };
    c.lu = L_;
    c.rev.mini = () => mini.forEach((x, i) => dan(x.pp, 0.05 * i));
    moc(c, 'mini', 0.3 + c.tQua(A.x));
    // dong dau (kaiwa: dong duy nhat; run: dong dang phat hoac dong 0)
    const l0 = run ? (m.lineDang ? m.lineDang.l : ds[0]) : ds[0];
    const i0 = run ? (m.lineDang ? m.lineDang.i : 0) : (Math.max(0, (nh.ctx && nh.ctx.cacNhip || []).filter((b) => b && b.kind === 'kaiwa').indexOf(nh.beat)));
    veLuot(m, c, l0, i0, true);
  }
  /** Viet dong nghia cua mot luot thoai: nhan 'nghia:' roi gia tri (cung luc) */
  function vietNg(c, ng) {
    if (!ng || !ng.isConnected) return;
    viet(c, ng.querySelector('.s-nl'), 0, 0.12, { cam: false });
    viet(c, ng.querySelector('.s-ng'), 0.08, null, { max: 0.45 });
  }
  /** Bo cuc (chu cau + nghia) cua mot luot thoai: do mot lan, dung lai (luot ke tiep duoc do san luc ranh) */
  function layLuotNd(K, line) {
    const dt = st.dt, u = st.u, Rb = K.Rb;
    const ch = cauHtml(line.tokens || [], null, { tag: false });
    const ng = tachNghia(line.meaningVi);
    const hNg = '<span class="s-nl">' + donVi('nghĩa:') + '</span><span class="s-ng">' + donVi((ng.chinh || line.meaningVi || '') + (ng.phu ? ' (' + ng.phu + ')' : '')) + '</span>';
    const padC = 'padding:.32em .6em';
    const bs = [
      { k: 'cau', html: ch.html, cls: 's-c jp s-cau can giua', w: Rb.w - 6 * u, mx: T('cau').max, mn: T('cau').min, css: padC, dong: 2, san: 0.72 },
      { k: 'ng', html: hNg, cls: 's-c can giua', w: Rb.w, mx: T('nghia', 0.85).max, mn: T('nghia').min, dong: 1 },
    ];
    return { ch, hNg, x: xepDoc(bs, Rb.h, Math.round((dt ? 12 : 26) * u), Math.round(56 * u)), padC };
  }
  const nhan_ = (fn) => { try { if (window.requestIdleCallback) { window.requestIdleCallback(fn, { timeout: 1800 }); return; } } catch (e) {} setTimeout(fn, 900); };
  function veLuot(m, c, line, i, dau) {
    const K = c.lu;
    if (!K || !line) return;
    if (K.i === i && !dau) return;
    const dt = st.dt, u = st.u;
    K.i = i;
    const cu = K.cur;
    if (c.demEl) c.demEl.innerHTML = donVi(c.demTien + (i + 1) + ' / ' + K.tong);
    const tn = tachTen(line.speaker);
    const p = K.vai.findIndex((v) => v.jp === tn.jp);
    const v = K.vai[p] || { jp: tn.jp, la: tn.la, anh: line.avatarUrl || '' };
    const doiNguoi = !cu || cu.jp !== tn.jp;
    const g = { jp: tn.jp, els: [], line, toks: line.tokens || [] };
    // chan dung (doi nguoi -> anh moi dan len)
    if (doiNguoi) {
      g.pp = anh(c, line.avatarUrl || v.anh || null, K.rP, (i % 2 ? 1.6 : -1.6), [['do', 0.2], ['xanh', 0.8]]);
      if (g.pp.im) g.pp.im.style.objectPosition = '50% 22%';
      const ht = tenHtml(v);
      const f = fit(ht, 's-c giua can', K.rTen.w, K.rTen.h, dt ? T('de', 1.4).max : T('nghia', 0.8).max, T('phu').min);
      g.ten = chu(c, ht, 's-c giua can', { x: K.rTen.x + (K.rTen.w - f.w) / 2, y: K.rTen.y + (K.rTen.h - f.h) / 2, w: f.w, h: f.h }, f.fs);
      const la = g.ten.querySelector('.s-ten-la'); if (la) la.style.fontSize = '0.66em';
    } else { g.pp = cu.pp; g.ten = cu.ten; }
    // bong thoai + nghia
    const Rb = K.Rb;
    if (!K.cacheL) K.cacheL = {};
    const Ld = K.cacheL[i] || (K.cacheL[i] = layLuotNd(K, line));
    delete K.cacheL[i - 1];
    const { ch, hNg, x, padC } = Ld;
    let wC = Math.min(Rb.w - 6 * u, x.ds[0].wt + 4), xC = Rb.x + (Rb.w - wC) / 2;
    const hC = x.ds[0].h;
    g.cau = chu(c, ch.html, 's-c jp s-cau can giua', { x: xC, y: Rb.y + x.ds[0].y, w: wC, h: hC }, x.ds[0].fs, padC);
    kiemMuc(g.cau);
    // bo margin am co the doi so dong: giu cau trong khung da do (khung = chieu cao do san), can lai giua
    const wF = giuCao(g.cau, hC, Rb.w - 6 * u);
    if (Math.abs(wF - (wC + 1)) > 1) { wC = wF - 1; xC = Rb.x + (Rb.w - wF) / 2; g.cau.style.left = Math.round(xC) + 'px'; }
    tranhDongLe(g.cau, Math.max(fsSan(), Math.round(x.ds[0].fs * 0.8)));
    { const hR = g.cau.offsetHeight; if (hR < hC - 2) g.cau.style.top = Math.round(Rb.y + x.ds[0].y + (hC - hR) / 2) + 'px'; }
    g.ng = chu(c, hNg, 's-c can giua', { x: Rb.x + (Rb.w - x.ds[1].w) / 2, y: Rb.y + x.ds[1].y, w: x.ds[1].w, h: x.ds[1].h }, x.ds[1].fs);
    // khung bong thoai + duoi chi ve phia nguoi noi
    const by = Rb.y + x.ds[0].y;
    g.k = hop(c, xC, by, wC, hC, 'mong', 90 + (i % 7));
    if (!dt) {
      const ty = by + Math.min(hC * 0.5, 50 * u);
      g.k = g.k.concat([duong(c, 'M' + (xC + 1) + ',' + (ty - 12 * u) + ' L' + (xC - 30 * u) + ',' + (ty + 3 * u) + ' L' + (xC + 1) + ',' + (ty + 14 * u), 'mong')]);
    } else {
      const tx = Math.min(xC + wC * 0.25, K.rP.x + K.rP.w * 0.6);
      g.k = g.k.concat([duong(c, 'M' + (tx - 12 * u) + ',' + (by + 1) + ' L' + (tx - 2 * u) + ',' + (by - 20 * u) + ' L' + (tx + 12 * u) + ',' + (by + 1), 'mong')]);
    }
    g.tokEls = Array.from(g.cau.querySelectorAll('.s-tok'));
    g.tokTile = {};
    ch.items.forEach((it, k) => it.toks.forEach((q) => { g.tokTile[q] = k; }));
    g.cau.classList.add('da'); g.cau.dataset.viet = '1';
    g.tokEls.forEach((e) => { e.style.clipPath = 'none'; e.querySelector('.s-tok-c').style.clipPath = 'inset(0 100% 0 0)'; });
    m.gach = null;
    K.cur = g;
    // luot ke tiep: do bo cuc san luc ranh (doi luot khong con dung main thread 100 - 400 ms giua luc cuc tay xoa)
    if (K.run && K.ds[i + 1] && !K.cacheL[i + 1]) nhan_(() => { if (c.el.isConnected && c.lu === K && !K.cacheL[i + 1]) { try { K.cacheL[i + 1] = layLuotNd(K, K.ds[i + 1]); } catch (e) {} } });
    // avatar nhep mieng
    (m.avtL || []).forEach((ct) => { try { ct.go(); } catch (e) {} });
    m.avtL = [];
    if (g.pp && g.pp.im) { const ct = ganAvatar(c, g.pp.im, { lineId: line.id, nhanVat: tuNhanVat(line.avatarUrl) || v.nv }); if (ct) m.avtL.push(ct); }
    K.mini.forEach((x2) => { if (!giam()) G.to(x2.pp.e, { scale: x2.v.jp === tn.jp ? 1.12 : 1, duration: 0.18, ease: 'power2.out' }); });
    // xoa luot cu (cuc tay nho), roi viet luot moi
    const chay = () => {
      if (!g.cau.isConnected) return;
      if (doiNguoi) dan(g.pp, 0);
      if (doiNguoi) viet(c, g.ten, 0.1, null, { cam: false, max: 0.4 });
      ve(c, g.k, 0, 0.3);
      const vietTatCa = (t0) => { let q = t0; g.tokEls.forEach((e) => { vietTok(c, e, q); q += kep(0.6 / Math.max(1, g.tokEls.length), 0.06, 0.14); }); return q; };
      if (!K.run) {
        const tE = vietTatCa(0.2);
        g.henNg = G.delayedCall(Math.max(3.4, tE + 2.2), () => vietNg(c, g.ng));
      } else {
        // ca doan: chu viet theo karaoke (giong nhan vat); du phong neu khong co karaoke
        g.henChu = G.delayedCall(0.7, () => { if (!g.coKaraoke) { const tE = vietTatCa(0); g.henNg = G.delayedCall(tE + 0.9, () => vietNg(c, g.ng)); } });
        g.henNg = G.delayedCall(4.2, () => vietNg(c, g.ng));
      }
      [g.henNg, g.henChu].forEach((h) => { if (h) c.hen.push(h); });
    };
    if (cu && !dau) {
      if (cu.henNg) cu.henNg.kill(); if (cu.henChu) cu.henChu.kill();
      const xoa = [cu.cau, cu.ng].concat(doiNguoi ? [cu.ten] : []);
      cu.k.forEach((pth) => { G.killTweensOf(pth); G.to(pth, { opacity: 0, duration: 0.2, onComplete: () => pth.remove() }); });
      if (doiNguoi && cu.pp) { const pe = [cu.pp.e].concat(cu.pp.mags); G.to(pe, { autoAlpha: 0, x: '-=' + Math.round(20 * u), duration: 0.18, ease: 'power2.in', onComplete: () => pe.forEach((e) => e.remove()) }); }
      lauVung(xoa, R(Math.min(K.Rb.x, K.rTen.x) - 10 * u, Math.min(K.Rb.y, K.rTen.y), K.Rb.x + K.Rb.w - Math.min(K.Rb.x, K.rTen.x) + 20 * u, Math.max(K.Rb.h, K.rTen.h)), chay);
    } else {
      const t0 = 0.08 + c.tQua(K.rP.x);
      c.rev.l0 = chay;
      moc(c, 'l0', t0);
    }
  }
  function karaokeLuot(m, c, ds) {
    const K = c.lu;
    if (!K || !K.cur) return;
    const g = K.cur;
    if (K.run) {
      g.coKaraoke = true;
      if (g.henChu) { g.henChu.kill(); g.henChu = null; }
      karaokeCau(m, c, ds, g.cau, g.tokEls, g.tokTile, (k, t, d) => vietTok(c, g.tokEls[k], t, d));
      const cuoi = ds[ds.length - 1];
      if (cuoi && cuoi.i >= (g.toks.length - 2)) {
        if (g.henNg) g.henNg.kill();
        const t = Math.max(0, cuoi.T - m.api.bayGio()) + 0.2;
        g.henNg = G.delayedCall(t, () => vietNg(c, g.ng));
        c.hen.push(g.henNg);
      }
    } else karaokeCau(m, c, ds, g.cau, g.tokEls, g.tokTile, null);
  }
  function cueKaiwa(m, id, tt, api, nh, c) {
    const t = api.tre(tt), K = c.lu;
    if (!K || !K.cur) return;
    const g = K.cur;
    let x;
    if (id === 'F4') { if (g.henNg) g.henNg.kill(); g.henNg = G.delayedCall(t, () => vietNg(c, g.ng)); c.hen.push(g.henNg); nay(g.ng, t + 0.3, 1.03); return; }
    if ((x = /^F3\.(\d+)$/.exec(id))) {
      const keys = g.toks.map((tk, q) => (tk && tk.isKeyGrammar ? q : -1)).filter((q) => q >= 0);
      const k = g.tokTile[keys[+x[1]]];
      const e = g.tokEls[k];
      if (!e) return;
      c.hen.push(G.delayedCall(t, () => {
        if (!e.isConnected) return;
        const tc = e.querySelector('.s-tok-c'), r = toaDo(tc);
        ve(c, vong(c, r.x + r.w / 2, r.y + r.h / 2, r.w / 2 + 10 * st.u, r.h / 2 + 4 * st.u, 'hong', 120 + k), 0, 0.2);
      }));
      nay(e, t, 1.1);
    }
  }

  // ================================================================== BAI TAP
  function dungQuiz(nh, c, m) {
    const q = nh.data || {}, dt = st.dt, u = st.u, co = nh.chuong || {};
    const opts = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
    const cauHoi = String(q.question || '').replace(/^\[(Dễ|Vừa|Khó)\]\s*/, '');
    const [goc, yc] = tachNgoac(cauHoi);
    const yTop = nhanMuc(c, [['Luyện tập', ''], [co.i && co.n ? 'Câu ' + co.i + ' / ' + co.n : '', 'c-vang']], tagBai(nh));
    const A = vung(yTop);
    let gap = Math.round((dt ? 10 : 22) * u);
    const coJp = RE_JP.test(goc);
    const jpNhieu = coJp && (goc.match(/[぀-ヿ一-鿿々ー]/g) || []).length > kyTu(goc).length * 0.4;
    // o trong: rong theo dap an dai nhat
    const lenB = Math.min(6, Math.max(1, ...opts.map((o) => kyTu(tachNgoac(o)[0]).length)));
    const blank = /_{2,}|＿{2,}/;
    const coBlank = blank.test(goc);
    const hQ0 = coBlank ? goc.split(blank).map((s, i) => (i ? '<span class="k s-blank" style="width:' + (lenB * 1.02 + 0.6).toFixed(2) + 'em"></span>' : '') + donVi(s)).join(' ') : donVi(goc);
    // cau hoi nhan dien mot chu (Chu 「ぎ」 doc la gi?): chu duoc hoi to hon chu thuong (nhan vat chinh cua cau), khong nho nhu dap an
    const mg = !coBlank && coJp ? /^(.*?)[「『]([^」』\s]{1,2})[」』](.*)$/.exec(goc) : null;
    const hQ1 = mg && RE_JP.test(mg[2]) && /[A-Za-zÀ-ỹ]/.test(mg[1] + mg[3]) ? donVi(mg[1]) + ' <span class="k s-hero jp" lang="ja">「' + esc(mg[2]) + '」</span> ' + donVi(mg[3]) : hQ0;
    const hQ = hQ1 + (yc ? '<div class="s-yc c-vang">' + donVi(yc) + '</div>' : '');
    // dap an (the giay)
    // dap an ngan (kana, so, tu don): chu to hon cho khung day, doBo se tu ha xuong neu khong du cho
    const dMax = Math.max(1, ...opts.map((o) => kyTu(tachNgoac(o)[0]).length));
    const fT = T('the', dMax <= 3 ? 1.5 : dMax <= 6 ? 1.25 : 1);
    // so thu tu A..D (thoi ra goc trai tren) + nam cham: phan lan vao the + 5u la dem tren toi thieu -> khong de len chu; le hai ben = phan thoi ra cua so
    // man hinh rat nho (u < 0,75, vd 320 px): so thu tu / dinh ghim nho lai -> be dem tren duoi the nho hon (the khong bi day xuong qua mep bang)
    const tiny = dt && st.u < 0.75;
    const kw = tiny ? 19 : dt ? Math.max(22, Math.round(24 * u)) : Math.max(22, Math.round(29 * u)), kf = dt ? 13 : Math.max(13, Math.round(15 * u));
    const bo_ = Math.round(kw * 0.4), ps = tiny ? 12 : dt ? Math.max(14, Math.round(15 * u)) : Math.max(18, Math.round(26 * u)), po = Math.round(ps * (tiny ? 0.42 : 0.55));
    const pyMin = Math.round(Math.max(kw - bo_, ps - po) + 5 * u);
    const ins = bo_, Wq = A.w - 2 * ins;
    // lang="ja": word-break auto-phrase (css) chi ngat dong o ranh gioi cum tu, khong ngat giua tu; token co dau gach (romaji fu-a) khong ngat o dau gach
    const htHy = (o) => esc(o).replace(/[^\s]*[-‐][^\s]*/g, (x) => '<span class="s-nw">' + x + '</span>');
    const langO = (o) => (RE_JP.test(o) ? 'ja' : 'vi');
    const htO = opts.map((o) => '<span class="s-the-t" lang="' + langO(o) + '">' + htHy(o) + '</span>');
    const ogap = Math.round((dt ? 12 : 22) * u) + Math.round(po * 0.5);
    // giai thich / goi y (dai duoi)
    let hGi = q.hint ? '<div class="s-hd c-la">' + donVi('Gợi ý') + '</div><div class="s-bd">' + donVi(q.hint) + '</div>' : '';
    const padE = 'padding:.42em .8em;line-height:1.4';
    const fP = T('phu');
    const fBand = Math.max(fP.min, Math.round(fP.max * 0.9));
    // dai goi y (chi khi co goi y): khung + nhan ve ngay, chu goi y viet o Q3; khong co goi y -> khong chua dai (giai thich vao sau khi tra loi)
    const hBand = hGi ? Math.round(Math.min(kt(hGi, 's-c dep', fBand, A.w, padE).h, A.h * (dt ? 0.24 : 0.22))) : 0;
    const chH = Math.round((dt ? 40 : 46) * u), chG = Math.round((dt ? 8 : 12) * u);
    const url = !dt ? (q.imageUrl || C.anhCau((goc.match(/[぀-ヿ一-鿿々ー]+/g) || []).map((x) => ({ text: x, kanji: x })), nh.bai) || null) : null;
    const sAnh = url ? Math.round(Math.min(A.h * 0.24, A.w * 0.18)) : 0;
    const wQ = A.w - (sAnh ? sAnh + gap : 0);
    const fQ = jpNhieu ? T('cau', 0.8) : T('nghia');
    // ---- do the dap an. Nho ket qua theo (co, cot): be ngang mot dong / be ngang toi thieu chi phu thuoc co chu -> do mot lan, dung lai o moi lan thu
    const mem = new Map();
    const nho = (k, f) => { let v = mem.get(k); if (v === undefined) { v = f(); mem.set(k, v); } return v; };
    // tu don khong cach (chu Nhat, romaji co dau gach): bat buoc vua MOT dong, khong de trinh duyet ngat giua tu (vd kyu|u, fu-|a)
    const motTu = opts.map((o) => { const ot = o.trim(); return !/\s/.test(ot) && kyTu(ot).length <= 10 && (RE_JP.test(ot) || /[-‐]/.test(ot)); });
    const htOne = (i, css) => '<span class="s-the-t" lang="' + langO(opts[i]) + '" style="font-size:inherit;display:inline-block;' + css + '">' + htHy(opts[i]) + '</span>';
    const dongM = (i, fo, css, w) => { const m = doBat(0, htOne(i, css), '', w, ''); m.style.fontSize = fo + 'px'; return m; };
    // be ngang mot dong / toi thieu ti le tuyen tinh theo co chu: do mot lan o 100 px (cache theo dap an), suy ra moi co (du +1,5 % + 2 px)
    const o1 = (i, fo) => {
      const b = nho('n' + i, () => { const sp = dongM(i, 100, 'white-space:nowrap', 20000).firstChild; return { w: sp.offsetWidth, h: sp.offsetHeight }; });
      return { nat: Math.ceil(b.w * fo / 100 * 1.015) + 2, h1: Math.round(b.h * fo / 100) };
    };
    const mc = (i, fo) => {
      const w = nho('m' + i, () => dongM(i, 100, 'width:min-content', 20000).firstChild.offsetWidth);
      return Math.ceil(w * fo / 100 * 1.015) + 2;
    };
    const natMax = (fo) => Math.max(...opts.map((o, i) => o1(i, fo).nat));
    const doBoO = (fo, cols) => nho('b' + fo + '|' + cols, () => {
      // kich thuoc tung the o co fo; cols: so cot (1 | 2 | 4)
      const pyO = Math.round(Math.max(fo * 0.36, pyMin)), pxO = Math.round(Math.max(12, fo * 0.6));
      const wMax = Math.floor((Wq - ogap * (cols - 1)) / cols);
      const inner = wMax - 2 * pxO;
      let tran = false, maxLn = 1;
      const kts = opts.map((o, i) => {
        const a_ = o1(i, fo);
        let wt = a_.nat, h = a_.h1, sw = a_.nat;
        if (a_.nat > inner + 1) {
          const m = dongM(i, fo, 'max-width:100%', inner), sp = m.firstChild;
          wt = Math.ceil(sp.offsetWidth) + 2; h = sp.offsetHeight; sw = Math.max(m.scrollWidth, sp.scrollWidth);
          // be ngang toi thieu (cum tu dai nhat khong ngat duoc, theo auto-phrase) phai vua o: khong thi trinh duyet ngat GIUA cum tu
          const mn = mc(i, fo);
          if (mn > inner + 1) sw = Math.max(sw, mn);
          if (motTu[i]) sw = Math.max(sw, a_.nat);
        }
        if (sw > inner + 1) tran = true;
        maxLn = Math.max(maxLn, Math.round(h / (fo * 1.16)));
        return { wt, h };
      });
      const ws = kts.map((k) => Math.min(wMax, Math.max(k.wt, fo * 0.9) + 2 * pxO));
      // nhieu hang (2 x 2): cac the cung cot cung be ngang -> hang thang cot; mot cot: moi the cung mot be ngang -> mep trai / so thu tu thang hang
      if (cols > 1 && opts.length > cols) { const cm = []; ws.forEach((w_, i) => { cm[i % cols] = Math.max(cm[i % cols] || 0, w_); }); ws.forEach((w_, i) => { ws[i] = cm[i % cols]; }); }
      if (cols === 1 || (cols > 1 && opts.length <= cols)) { const wm = Math.max(...ws); ws.forEach((w_, i) => { ws[i] = wm; }); }   // mot cot / mot hang: cac the cung be ngang
      const hs = kts.map((k) => k.h + 2 * pyO);
      const rows = [];
      for (let i = 0; i < opts.length; i += cols) rows.push([i, Math.min(opts.length, i + cols)]);
      const rowH = rows.map(([a_, b_]) => Math.max(...hs.slice(a_, b_)));
      const rowW = rows.map(([a_, b_]) => ws.slice(a_, b_).reduce((x, y_) => x + y_, 0) + ogap * (b_ - a_ - 1));
      return { fo, cols, pyO, pxO, ws, hs, rowH, rowW, H: rowH.reduce((x, y_) => x + y_, 0) + ogap * (rows.length - 1), W: Math.max(...rowW), tran, maxLn };
    });
    // he so chung cho co cau hoi + co dap an (lon nhat vua bang); moi he so chon so cot cho khoi dap an thap nhat
    const clsQ = 's-c can dep';
    let hBandU = hBand, nKhe = hBandU ? 3 : 2;
    const doBo = (s_) => {
      const fq = Math.max(fQ.min, Math.floor(fQ.max * s_));
      let fo = Math.max(fT.min, Math.floor(fT.max * s_));
      // dap an dai khong to hon cau hoi qua nhieu (dap an ngan: kana, so: van to de de nhin)
      if (dMax > 3) fo = Math.max(fT.min, Math.min(fo, Math.round(fq * (dMax <= 6 ? 1.5 : 1.2))));
      const kq = nho('q' + fq, () => kt(hQ, clsQ, fq, wQ));
      let bo = null;
      [4, 2, 1].forEach((cols) => {
        if (cols > opts.length && cols !== 1) return;
        // cat tia: 4 cot chi khi moi dap an co ve vua ~2 dong, 2 cot khi ~4 dong (theo be ngang mot dong)
        if (cols > 1) { const inn = Math.floor((Wq - ogap * (cols - 1)) / cols) - 2 * Math.round(Math.max(12, fo * 0.6)); if (natMax(fo) > inn * (cols === 4 ? 2.3 : 4.2)) return; }
        const b_ = doBoO(fo, cols);
        if (b_.tran || (cols > 1 && b_.maxLn > 4)) return;
        if (!bo || b_.H < bo.H - 1) bo = b_;
      });
      if (!bo) bo = doBoO(fo, 1);
      const qh = Math.max(kq.h, sAnh);
      return { fq, kq, bo, qh, H: qh + bo.H + chG + chH + hBandU + gap * nKhe + po, ok: kq.sw <= wQ + 1 && !bo.tran };
    };
    const tim = () => {
      let r = doBo(1);
      if (r.H > A.h || !r.ok) {
        let lo = 0.02, hi = 1, tot = null;
        for (let k = 0; k < 7; k++) { const mid = (lo + hi) / 2; const x_ = doBo(mid); if (x_.H <= A.h && x_.ok) { lo = mid; tot = x_; } else hi = mid; }
        r = tot || doBo(0.02);
      }
      return r;
    };
    let r_ = tim();
    // man hinh qua nho: bo dai goi y (goi y van hien trong khung giai thich sau khi tra loi) de cac the khong bi de len
    if (hBandU && (r_.H > A.h + 1 || !r_.ok)) { hBandU = 0; nKhe = 2; hGi = ''; r_ = tim(); }
    // van tran (320 px): khe giua cac khoi nho lai (>= 3 px) truoc khi chap nhan tran
    if (r_.H > A.h + 1 && gap > 3) { gap = Math.max(3, Math.round(gap * 0.5)); r_ = tim(); }
    const hBandF = hBandU;
    const best = r_.bo, kQ = { fs: r_.fq, w: r_.kq.w, h: r_.kq.h }, hQq = r_.qh;
    // phan thua chia deu: tren 12 %, cac khe giua, duoi 13 %
    const du = Math.max(0, A.h - r_.H);
    const gT = gap + du * 0.75 / nKhe;
    let y = A.y + du * 0.12;
    let pA = null;
    if (url) pA = anh(c, url, R(A.x, y + (hQq - sAnh) / 2, sAnh, sAnh), -2.4, [['la', 0.5]]);
    const xQ = A.x + (sAnh ? sAnh + gap : 0);
    const eQ = chu(c, hQ, clsQ + (sAnh ? '' : ' giua'), { x: sAnh ? xQ : A.x + (A.w - kQ.w) / 2, y: y + (hQq - kQ.h) / 2, w: sAnh ? wQ : kQ.w, h: kQ.h }, kQ.fs);
    y += hQq + gT + po;
    // dap an: vung flex can giua (cung CSS voi the that)
    const wO = best.cols === 1 ? Wq : Math.min(Wq, best.W + 2);
    const xO = A.x + ins + (Wq - wO) / 2;
    const oBox = dat(mk('div', 's-opts', c.giay), { x: xO, y, w: wO });
    const bien = (e) => {
      e.style.setProperty('--s-og', ogap + 'px'); e.style.setProperty('--s-fo', best.fo + 'px'); e.style.setProperty('--s-py', best.pyO + 'px'); e.style.setProperty('--s-px', best.pxO + 'px');
      e.style.setProperty('--s-kw', kw + 'px'); e.style.setProperty('--s-kf', kf + 'px'); e.style.setProperty('--s-bo', bo_ + 'px');
      e.style.setProperty('--s-ps', ps + 'px'); e.style.setProperty('--s-po', po + 'px');
      if (best.cols === 1) e.dataset.c = '1'; else delete e.dataset.c;
      best.ws.forEach((w, i) => e.style.setProperty('--s-w' + (i + 1), Math.round(w) + 'px'));
    };
    bien(oBox);
    const the = opts.map((o, i) => mk('div', 's-the s-an', oBox, '<span class="s-so">' + 'ABCD'[i] + '</span>' + htO[i]));
    y += best.H + chG;
    const yChan = y;
    y += chH + gT;
    // dai duoi
    const yBand = Math.min(y, A.y + A.h - hBandF);
    const hB = Math.max(hBandF, Math.min(A.y + A.h - yBand, hBandF + du * 0.13));
    let eGi = null, kGi = null;
    if (hGi) {
      const fg = fit(hGi, 's-c dep', A.w, hB, Math.round(fP.max * 1.05), fP.min, padE);
      const wg = Math.min(A.w, kt(hGi, 's-c dep', fg.fs, A.w, padE).wt);
      eGi = chu(c, hGi, 's-c dep', { x: A.x + (A.w - wg) / 2, y: yBand + Math.max(0, (hB - fg.h) / 2), w: wg, h: fg.h }, fg.fs, padE);
      kGi = khungQuanh(c, eGi, wg, fg.h, 'la mong', 130);
    }
    const band = R(A.x, yBand, A.w, hB);
    c.rev.anh = () => dan(pA, 0);
    c.rev.cau = () => viet(c, eQ, 0, null, { max: 1.0 });
    the.forEach((e, i) => { c.rev['o' + i] = () => { if (giam()) { G.set(e, { autoAlpha: 1 }); return; } G.fromTo(e, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06, ease: 'none' }); G.fromTo(e, { y: -22 * u, rotation: (i % 2 ? 3 : -3) }, { y: 0, rotation: 0, duration: 0.2, ease: 'power2.out' }); }; });
    if (eGi) {
      c.rev.giK = () => { ve(c, kGi, 0, 0.28); viet(c, eGi.querySelector('.s-hd'), 0.15, 0.15, { cam: false }); };
      c.rev.gi = () => { moc(c, 'giK', 0); viet(c, eGi.querySelector('.s-bd'), 0.22, null, { max: 1.0 }); };
    }
    mocX(c, 'anh', 0.05, pA ? pA.r.x + pA.r.w : 0);
    mocX(c, 'cau', 0.15, A.x + A.w * 0.1);
    the.forEach((e, i) => mocX(c, 'o' + i, 0.6 + 0.12 * i, xO + wO * ((i % best.cols) + 0.5) / best.cols));
    if (eGi) moc(c, 'gi', 2.4);
    c.qz = { q, opts, eQ, oBox, the, best, yChan, chH, chG, band, eGi, kGi, bien, wO, xO, padE, ogap };
    m.q = q;
  }
  function cueQuiz(m, id, tt, api, nh, c) {
    const t = api.tre(tt), K = c.qz;
    if (!K) return;
    let x;
    if (id === 'Q1') { moc(c, 'cau', t); if (daXong(c, 'cau')) nay(K.eQ, t, 1.02); }
    else if ((x = /^Q2\.(\d+)$/.exec(id))) {
      const i = +x[1];
      for (let q = 0; q <= i; q++) moc(c, 'o' + q, t);
      if (!K.slot && K.the[i]) nay(K.the[i], t + 0.05, 1.06);
      if (i === K.the.length - 1 && K.eGi) moc(c, 'gi', t + 1.6);
    } else if (id === 'Q3') moc(c, 'gi', t);
  }
  function oBaiTapQuiz(m, c) {
    const K = c.qz;
    if (!K) return null;
    if (K.slot && K.slot.isConnected) return K.slot;
    const slot = dat(mk('div', 's-slot', c.giay), { x: K.xO, y: parseFloat(K.oBox.style.top), w: K.wO });
    slot.setAttribute('role', 'group'); slot.setAttribute('aria-label', 'Đáp án — ' + nganTu(String((K.q && K.q.question) || '').replace(/\s+/g, ' '), 160));
    K.bien(slot);
    slot.style.setProperty('--s-ch', K.chH + 'px'); slot.style.setProperty('--s-cg', K.chG + 'px');
    hetCanh(c);
    K.the.forEach((e) => { G.killTweensOf(e); G.set(e, { autoAlpha: 0 }); });
    K.slot = slot;
    return slot;
  }
  function traLoiQuiz(m, c, exId, dung) {
    const K = c.qz;
    if (!K || K.daTra) return;
    K.daTra = true;
    const q = K.q, u = st.u;
    const card = document.getElementById('card-' + exId);
    const dapDung = typeof q.correctIndex === 'number' ? q.correctIndex : 0;
    const btns = card ? Array.from(card.querySelectorAll('.qz-opt')) : [];
    const nutDung = btns[dapDung];
    const nutSai = !dung && card ? card.querySelector('.qz-opt.is-wrong') : null;
    // giai thich (+ goi y neu con cho): do TRUOC; khong du cho -> an cac the khong chon de nhuong (truoc khi ve dau phan)
    const exTxt = String(q.explanation || '').trim();
    const fP = T('phu'), band = K.band;
    const dsH = [exTxt ? '<div class="s-hd c-vang">' + donVi('Giải thích') + '</div><div class="s-bd">' + donVi(exTxt) + '</div>' : ''];
    if (q.hint) dsH.push('<div class="s-gy"><span class="s-nl c-la">' + donVi('Gợi ý:') + '</span>' + donVi(q.hint) + '</div>');
    const dayB = st.B.h - st.mg;
    const vung_ = () => {
      const slotB = K.slot ? parseFloat(K.slot.style.top) + K.slot.offsetHeight : band.y;
      const y0 = slotB + Math.round((st.dt ? 10 : 18) * u);
      return { y0, h: dayB - y0 };
    };
    let lam = null, tAn = 0;
    if (exTxt || q.hint) {
      let v = vung_(), html = dsH.join('');
      let fg = fit(html, 's-c dep', band.w, v.h, Math.round(fP.max * 1.05), fP.min, K.padE);
      if (fg.tran && q.hint && exTxt) { html = dsH[0]; fg = fit(html, 's-c dep', band.w, v.h, Math.round(fP.max * 1.05), fP.min, K.padE); }
      if (fg.tran && K.slot) {
        K.anNut = btns.filter((bt, i) => i !== dapDung && bt !== nutSai);
        K.anNut.forEach((bt) => { bt.style.display = 'none'; });
        v = vung_();
        html = dsH.join('');
        fg = fit(html, 's-c dep', band.w, v.h, Math.round(fP.max * 1.05), fP.min, K.padE);
        if (fg.tran && q.hint && exTxt) { html = dsH[0]; fg = fit(html, 's-c dep', band.w, v.h, Math.round(fP.max * 1.05), fP.min, K.padE); }
        // chi do thu: tra lai roi mo dan 120 ms (ease-out) truoc khi that su an -> the khong chon khong bien mat dot ngot
        K.anNut.forEach((bt) => { bt.style.display = ''; });
        K.anNut.forEach((bt) => { if (giam()) { bt.style.display = 'none'; return; } G.to(bt, { opacity: 0, duration: 0.12, ease: 'power1.out', onComplete: () => { bt.style.display = 'none'; } }); });
        tAn = giam() ? 0 : 0.14;
      }
      const wg = Math.min(band.w, kt(html, 's-c dep', fg.fs, band.w, K.padE).wt);
      const yE = v.y0 + Math.max(0, (v.h - fg.h) / 2);
      lam = () => {
        if (!c.el.isConnected) return;
        const e = chu(c, html, 's-c dep', { x: band.x + (band.w - wg) / 2, y: yE, w: wg, h: fg.h }, fg.fs, K.padE);
        const kk = khungQuanh(c, e, wg, fg.h, 'mong', 140);
        ve(c, kk, 0, 0.28);
        viet(c, e.querySelector('.s-hd'), 0.1, 0.15, { cam: false });
        viet(c, e.querySelector('.s-bd'), 0.2, null, { max: 0.8 });
        const gy = e.querySelector('.s-gy');
        if (gy) viet(c, gy, 0.8, null, { max: 0.6 });
      };
    }
    // vong phan vang quanh dap an dung, dau X phan hong de len dap an sai
    const xongVe = (e, f) => { if (!e) return; c.hen.push(G.delayedCall(0.05 + tAn, () => { if (e.isConnected && c.el.isConnected) f(toaDo(e)); })); };
    // dau X nho o GOC tren phai the sai (trong be dem cua the: khong de len chu dap an, khong cham so thu tu A-D o goc trai / dinh ghim o giua)
    const pxO = (K.best && K.best.pxO) || 12, pyO = (K.best && K.best.pyO) || 10;
    xongVe(nutSai, (r) => { const rd = kep(Math.min(pxO, pyO) * 0.95, 6, 15 * u); ve(c, cheo(c, r.x + r.w - rd * 1.15, r.y + rd * 1.1, rd, 'hong mong'), 0, 0.22); });
    // the dung: net song vang duoi chu, trong the (cach mep duoi >= 3 u, khong cham chu / dinh ghim / so thu tu o mep tren; khong nhoai ra ngoai de len the ben canh)
    xongVe(nutDung, (r) => { const yy = r.y + r.h - Math.max(7 * u, Math.min(pyO * 0.5, 12 * u)); ve(c, gachSong(c, r.x + r.w * 0.14, yy, r.w * 0.72, 'vang'), dung ? 0.02 : 0.45, 0.4); });
    // viet dap an vao cho trong
    const blank = K.eQ.querySelector('.s-blank');
    const txt = tachNgoac(String(K.opts[dapDung] || ''))[0];
    if (blank && txt) {
      c.hen.push(G.delayedCall(dung ? 0.3 : 0.55, () => {
        if (!blank.isConnected) return;
        const r = toaDo(blank), fq = parseFloat(K.eQ.style.fontSize) || 30;
        const fa = Math.max(fsSan(), Math.min(fq, Math.round((r.w - fq * 0.2) / Math.max(1, kyTu(txt).length * 1.02))));
        const e = chu(c, donVi(txt), 's-c jp mot c-hong', { x: r.x + (r.w - kt(donVi(txt), 's-c jp mot', fa, 4000).wt) / 2, y: r.y + r.h - fa * 1.18 }, fa);
        viet(c, e, 0, 0.25);
      }));
    }
    if (!lam) return;
    c.hen.push(G.delayedCall(dung ? 0.45 : 0.7, () => {
      const cu = [K.eGi].filter((e) => e && e.isConnected);
      (K.kGi || []).forEach((p) => { G.to(p, { opacity: 0, duration: 0.2, onComplete: () => p.remove() }); });
      if (cu.length) lauVung(cu, R(band.x, parseFloat(K.eGi.style.top) - 6, band.w, K.eGi.offsetHeight + 12), lam); else lam();
    }));
  }

  // ================================================================== THE CHUONG / KET BAI
  function dungTheChuong(info, c) {
    const dt = st.dt, u = st.u;
    const ds = info.ds || [], ch = info.chuong;
    let muc = [];
    if (ch === 'vocab') muc = ds.filter((b) => b.kind === 'vocab').map((b) => b.data && (b.data.kanji || b.data.word));
    else if (ch === 'kanji') muc = ds.filter((b) => b.kind === 'kanji').map((b) => b.data && b.data.character);
    else if (ch === 'grammar') muc = ds.filter((b) => b.kind === 'grammar-intro').map((b) => {
      // ten mau cau: phan sau dau hai cham neu no la mau (co chu Nhat / dau + / [..]); khong thi la mo ta -> lay ten truoc dau hai cham
      const t = String((b.data && b.data.title) || '').replace(/^\d+\.\s*/, ''), i = t.indexOf(':');
      if (i < 0) return t;
      const a = t.slice(0, i).trim(), z = t.slice(i + 1).trim();
      return z && (RE_CO_NHAT.test(z) || /[+\[]/.test(z)) ? z : (a || z);
    });
    else if (ch === 'kaiwa') muc = vaiCua(ds.filter((b) => b.kind === 'kaiwa' || b.kind === 'kaiwa-intro').map((b) => (Array.isArray(b.data) ? b.data[0] : b.data))).map((v) => v.jp);
    else if (ch === 'quiz') muc = ds.filter((b) => b.kind === 'quiz').map((b, i) => 'Câu ' + (i + 1));
    muc = Array.from(new Set(muc.filter(Boolean)));
    // danh sach bi cat: them muc "…" (khong de danh sach nhin nhu day du trong khi con nhieu hon); bai tap: gop thanh mot muc "Cau 1 - Cau N"
    const gioiHan = dt ? 8 : 12;
    if (muc.length > gioiHan) muc = ch === 'quiz' ? ['Câu 1 – Câu ' + muc.length] : muc.slice(0, gioiHan - 1).concat(['…']);
    const glyph = ({ vocab: '単語', kanji: (String(info.capDo || '').toUpperCase() === 'KANA' ? 'かな' : '漢字'), grammar: '文法', kaiwa: '会話', quiz: '練習' })[ch] || '学習';
    const A = vung(st.mg);
    const gap = Math.round((dt ? 12 : 40) * u);
    // may tinh: hai o chu xep DOC (nhu chu viet doc) o cot trai, to het co; dien thoai: hai o nam ngang o tren cung
    let box, Rg;
    if (!dt) {
      const wL = A.w * 0.4, s = Math.round(Math.min(A.h * 0.47, wL * 0.94));
      box = R(A.x + (wL - s) / 2, A.y + (A.h - 2 * s) / 2, s, s);
      Rg = R(A.x + wL + gap * 0.5, A.y, A.w - wL - gap * 0.5, A.h);
    } else { const s = Math.round(Math.min(A.w * 0.4, A.h * 0.22)); box = R(A.x + (A.w - 2 * s) / 2, A.y, s, s); Rg = R(A.x, A.y + s + gap, A.w, A.h - s - gap); }
    const gl = kyTu(glyph).slice(0, 2).map((g, i) => {
      const x = box.x + (dt ? i * box.w : 0), y0 = box.y + (dt ? 0 : i * box.w);
      const lw = luoi(c, x, y0, box.w, 150 + i);
      const info2 = RE_KANJI.test(g) && coNet(g) ? oNet(c, x + box.w * 0.08, y0 + box.w * 0.08, box.w * 0.84, g) : null;
      const e = info2 ? null : chu(c, '<span class="k">' + esc(g) + '</span>', 's-c jp mot', { x, y: y0 + box.w * 0.08, w: box.w }, Math.round(box.w * 0.68), 'text-align:center;line-height:1.2');
      return { lw, info: info2, e };
    });
    const fDe = T('de', 1.1), fP = T('phu');
    const bs = [];
    // tieu de the (Xong ..., ten chuong, so muc): co chu gan nhu co dinh giua cac chuong (chi danh sach 'Trong phan nay' co gian), nhat quan tu the nay sang the khac
    const mxTr = Math.round(fP.max * (dt ? 1.5 : 1.9)), mxTen = Math.round(fDe.max * (dt ? 1.8 : 2.2));
    bs.push({ k: 'tr', html: donVi(info.tenCu ? 'Xong ' + info.tenCu + ' ✓' : 'Phần tiếp theo'), cls: 's-c c-hong giua can', mx: mxTr, mn: Math.max(fP.min, Math.round(mxTr * 0.85)) });
    bs.push({ k: 'ten', html: donVi(String(info.tenMoi || '')), cls: 's-c giua can mot', mx: mxTen, mn: Math.max(fDe.min, Math.round(mxTen * 0.8)), dong: 1 });
    if (info.meta) bs.push({ k: 'meta', html: donVi(String(info.meta)), cls: 's-c c-vang giua can', mx: mxTr, mn: Math.max(fP.min, Math.round(mxTr * 0.85)) });
    if (muc.length) {
      // muc dai (ten mau cau dai): moi muc la khoi nguyen (nowrap) rong hon bang o co chu nho nhat -> xuong dong TRONG muc, moi muc mot hang (thut dong treo), khong de chu chay ra ngoai bang
      const mucHtml = (x, dai) => '<span class="s-muc' + (dai ? ' s-muc-dai' : '') + '"><span class="k sep">·</span>' + donVi(x) + '</span>';
      // uoc luong re truoc (chu Nhat ~ 1 em, chu Viet ~ 0,62 em): chi do DOM khi muc dai nhat co the vuot be ngang (danh sach tu / chu ngan khong ton lan do nao)
      const uoc = Math.max(...muc.map((x) => kyTu(String(x)).reduce((a, ch) => a + (RE_JP.test(ch) ? 1.05 : 0.62), 1.3))) * fP.min;
      const dai = uoc > Rg.w * 0.42 && Math.max(...muc.map((x) => kt(mucHtml(x, false), 's-c mot', 100, 20000).wt)) * fP.min / 100 > Rg.w * 0.42;
      if (dai && dt) muc = muc.slice(0, 6);
      bs.push({ k: 'ds', html: '<div class="s-hd c-xanh">' + donVi('Trong phần này') + '</div><div class="s-bd">' + muc.map((x) => mucHtml(x, dai)).join(dai ? '' : ' ') + '</div>', cls: 's-c dep can giua', mx: Math.round(fP.max * (dt ? 2 : 2.4)), mn: fP.min, css: 'padding:.4em .8em;line-height:' + (dai ? '1.35' : '1.5') });
    }
    bs.forEach((b) => { b.w = Rg.w; });
    const x = xepDoc(bs, Rg.h, Math.round(10 * u), Math.round(70 * u));
    const els = {};
    bs.forEach((b, i) => {
      const r = x.ds[i], w = b.k === 'ds' ? Math.min(Rg.w, r.wt + 2) : r.w;
      els[b.k] = chu(c, b.html, b.cls, { x: Rg.x + (Rg.w - w) / 2, y: Rg.y + r.y, w, h: r.h }, r.fs, b.css);
      if (b.k === 'ds') els.dsK = khungQuanh(c, els.ds, w, r.h, 'xanh mong', 160);
    });
    // the chuong chi hien ~1,6 s: moi phan viet song song, xong trong ~1 s
    c.rev.a = () => { gl.forEach((g, i) => { ve(c, g.lw, 0.02 * i, 0.2); if (g.info) vietNet(c, g.info, 0.1 + 0.12 * i, 0.38); else if (g.e) viet(c, g.e, 0.1 + 0.08 * i, 0.22); }); };
    c.rev.b = () => { viet(c, els.tr, 0, 0.14, { cam: false }); viet(c, els.ten, 0.02, 0.22); if (els.meta) viet(c, els.meta, 0.1, 0.14, { cam: false }); };
    c.rev.c = () => { if (els.ds) { ve(c, els.dsK, 0, 0.12); viet(c, els.ds, 0, null, { max: 0.14 }); } };
    mocX(c, 'a', 0.02, box.x + box.w);
    mocX(c, 'b', 0.02, Rg.x);
    mocX(c, 'c', 0, Rg.x);
  }
  function dungTheXong(info, c) {
    const dt = st.dt, u = st.u;
    const bai = (st.nhip && st.nhip.bai) || (info && info.bai) || {};
    const yTop = nhanMuc(c, [['Tổng kết', ''], ['· Nội dung bài học', 'c-vang']], st.nhip ? tagBai(st.nhip) : '');
    const A = vung(yTop);
    const gap = Math.round((dt ? 10 : 34) * u);
    const vl = (bai.vocabList || []).filter((v) => v && v.imageUrl).slice(0, 3);
    const dsT = vl.length ? vl : (bai.vocabList || []).slice(0, 3);
    const kjs = (bai.kanjiList || []).slice(0, Math.max(0, 3 - dsT.length));
    const hang = dsT.map((v) => ({ w: String(v.kanji || v.word || ''), r: v.kanji && v.furigana && v.furigana !== v.kanji ? v.furigana : '', n: String(tachNghia(v.meaningVi).chinh || '').split(/[,;/]/)[0].trim(), img: v.imageUrl || null }))
      .concat(kjs.map((k) => ({ w: k.character, r: '', n: String(k.hanViet || k.romaji || ''), img: null })));
    const slides = (bai.slides || []).filter((s) => s && s.grammarFormula);
    const wL = dt ? A.w : Math.round(A.w * 0.56);
    const Rl = dt ? R(A.x, A.y, A.w, A.h * 0.58) : R(A.x, A.y, wL, A.h);
    const Rr = dt ? R(A.x, A.y + A.h * 0.58 + gap, A.w, A.h * 0.42 - gap) : R(A.x + wL + gap, A.y, A.w - wL - gap, A.h);
    const n = Math.max(1, hang.length);
    const hH = (Rl.h - (n - 1) * gap * 0.6) / n;
    const els = [];
    // co chu chung: do tung hang (be ngang con lai sau so thu tu + anh), lay co nho nhat -> cac hang cung mot co, khong lon nho lech nhau
    const htHang = (h) => '<span class="k s-tw" lang="ja">' + (h.r ? C.ruby(h.w, h.r) : esc(h.w)) + '</span> <span class="s-nl">' + donVi('=') + '</span>' + donVi(h.n);
    let fChung = 1e9;
    hang.forEach((h) => {
      const s0 = Math.round(hH * 0.86);
      const x0 = s0 * 0.42 + gap * 0.3 + (h.img ? s0 + gap * 0.6 : 0);
      fChung = Math.min(fChung, fit(htHang(h), 's-c s-cau mot', Rl.w - x0, hH * 0.9, T('nghia', 1.2).max, T('phu').min, 'line-height:1.6').fs);
    });
    hang.forEach((h, i) => {
      const y = Rl.y + i * (hH + gap * 0.6);
      const s = Math.round(hH * 0.86);
      let x = Rl.x;
      const so = chu(c, donVi(String.fromCharCode(0x2460 + i)), 's-c jp mot c-vang', { x, y: y + (hH - s * 0.5) / 2, w: s * 0.5 }, Math.round(Math.max(st.dt ? 14 : 18, s * 0.34)));
      x += s * 0.42 + gap * 0.3;
      let p = null;
      if (h.img) { p = anh(c, h.img, R(x, y + (hH - s) / 2, s, s), i % 2 ? 2 : -2, [[NC[i % 4], 0.5]]); x += s + gap * 0.6; }
      const ht = htHang(h);
      const wT = Rl.x + Rl.w - x;
      const f = fit(ht, 's-c s-cau mot', wT, hH * 0.9, fChung, Math.min(fChung, T('phu').min), 'line-height:1.6');
      const e = chu(c, ht, 's-c s-cau mot', { x, y: y + (hH - f.h) / 2, w: f.w, h: f.h }, f.fs, 'line-height:1.6');
      const ke = i ? duong(c, 'M' + Rl.x + ',' + (y - gap * 0.3) + ' L' + (Rl.x + Rl.w) + ',' + (y - gap * 0.3 + 2), 'mo') : null;
      els.push({ so, p, e, ke });
    });
    // cot phai: mau cau + loi chao cuoi
    const fP = T('phu');
    const bs = [];
    if (slides[0]) {
      // mau cau dai dien: slide dau co cong thuc dang chuoi (o / cum, khong phai bang chia / cau van xuoi); khong co -> tieu de slide dau. Moi manh la mot khoi khong ngat dong (Aい khong bi tach)
      const kanaX = laKanaNh(st.nhip);
      let hf = '';
      for (const sl of slides) {
        const ps = phanCongThucTu(C.congThuc ? C.congThuc(sl.grammarFormula) : null, { grammarFormula: sl.grammarFormula, title: sl.title }, kanaX);
        if (!ps.length || ps[0].bang) continue;
        let jo = 0;
        hf = ps.map((q) => {
          const col = q.loai === 'chu' ? (DS_TRO.includes(q.chu) ? 'c-hong' : 'c-cam') : 'c-' + MAU_O[jo++ % 3];
          const nd = q.loai === 'o' && q.p && !q.cum ? q.chu : q.chu;
          return (q.sep && q.sep !== '/' ? '<span class="s-nw c-vang">' + donVi(q.sep) + '</span> ' : '') + '<span class="s-nw ' + col + '">' + donVi(nd) + '</span>';
        }).join(' ');
        break;
      }
      if (!hf) hf = tieuDeHtml(String(slides[0].title || '').replace(/^\d+\.\s*/, '').split(/[:：]\s*/).pop());
      bs.push({ k: 'mau', html: '<div class="s-hd c-vang">' + donVi('Mẫu câu') + '</div><div class="s-bd">' + hf + '</div>', cls: 's-c giua can', mx: T('form', 0.6).max, mn: fP.min, css: 'padding:.35em .7em;line-height:1.25' });
    }
    const hang_ = (info.hang || []).slice(0, 4);
    if (hang_.length) bs.push({ k: 'kq', html: '<div class="s-hd c-xanh">' + donVi('Kết quả hôm nay') + '</div>' + hang_.map((h) => '<div>' + donVi(h.nhan + ':') + ' <span class="c-vang">' + donVi(String(h.so)) + '</span></div>').join(''), cls: 's-c giua can', mx: Math.round(fP.max * 1.05), mn: fP.min, css: 'line-height:1.35' });
    bs.forEach((b) => { b.w = Rr.w; });
    const x = xepDoc(bs, Rr.h, Math.round(10 * u), Math.round(40 * u));
    const er = {};
    bs.forEach((b, i) => {
      const r = x.ds[i], w = b.k === 'mau' ? Math.min(Rr.w, r.wt + 2) : r.w;
      er[b.k] = chu(c, b.html, b.cls, { x: Rr.x + (Rr.w - w) / 2, y: Rr.y + r.y, w, h: r.h }, r.fs, b.css);
      if (b.k === 'mau') er.mauK = khungQuanh(c, er.mau, w, r.h, 'xanh mong', 91);
    });
    c.rev.a = () => { els.forEach((h, i) => { viet(c, h.so, 0.1 * i, 0.1, { cam: false }); if (h.p) dan(h.p, 0.12 * i); if (h.ke) ve(c, [h.ke], 0.1, 0.25); }); };
    els.forEach((h, i) => { c.rev['h' + i] = () => viet(c, h.e, 0, 0.45); });
    c.rev.m = () => { if (er.mau) { ve(c, er.mauK, 0, 0.3); viet(c, er.mau, 0.15, 0.5); } if (er.kq) viet(c, er.kq, 0.3, 0.6, { cam: false }); };
    mocX(c, 'a', 0.05, A.x);
    els.forEach((h, i) => mocX(c, 'h' + i, 0.25 + 0.3 * i, A.x + wL * 0.5));
    mocX(c, 'm', 0.5, Rr.x);
  }

  // ================================================================== LOP HOC (tinh, dung lai khi doi co)
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
  function dungLopHoc() {
    st.chuaDung = false;
    // go canh + lop cu
    st.canhs.slice().forEach(boCanh);
    st.canh = null;
    try { G.killTweensOf(L.querySelectorAll('*')); } catch (e) {}
    L.textContent = '';
    st.doSlot = [];
    const W = st.W, H = st.H, u = st.u, B = st.B, f = st.f, meo = st.meo;
    mk('div', 's-tuong', L);
    st.do = hopDo();
    st.do.textContent = '';
    const kx = B.x - f, ky = B.y - f, kw = B.w + 2 * f, kh = B.h + 2 * f;
    // cua so (may tinh: cot phai tren meo)
    if (!st.dt) {
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
        // canh hoa bay (6 canh, chi transform): CSS animation (khong qua gsap: tween dau tien doc computedStyle -> ep layout ~40 ms luc vao). Keyframes CU THE tung canh (khong var() trong keyframes)
        if (!giam()) {
          const wk = wc - 2 * pad, hk = yBot - yTop - 2 * pad;
          let kf = '';
          for (let i = 0; i < 6; i++) {
            const p = mk('div', 's-canh-hoa', hoa), r = rand(i * 31 + 5);
            const x0 = r() * wk, dur = 7 + r() * 5;
            const y0 = -20 * u, r0 = r() * 360;
            const x1 = x0 - 30 * u - r() * 40 * u, y1 = hk + 20 * u, r1 = r0 + 200 + r() * 200;
            const dl = -r() * dur;
            kf += '@keyframes s-roi' + i + '{from{transform:translate(' + x0.toFixed(1) + 'px,' + y0.toFixed(1) + 'px) rotate(' + r0.toFixed(1) + 'deg)}to{transform:translate(' + x1.toFixed(1) + 'px,' + y1.toFixed(1) + 'px) rotate(' + r1.toFixed(1) + 'deg)}}';
            p.style.cssText = 'animation-name:s-roi' + i + ';animation-duration:' + dur.toFixed(2) + 's;animation-delay:' + dl.toFixed(2) + 's';
          }
          mk('style', '', L, kf);
        }
      }
    }
    // khung + bang + khay
    dat(mk('div', 's-khung', L), { x: kx, y: ky, w: kw, h: kh });
    st.bang = dat(mk('div', 's-bang', L), B);
    mk('div', 's-nang', st.bang);
    st.vet = mk('div', 's-vet', st.bang);
    st.dau = null;
    if (st.dc) {
      const dau = dat(mk('div', 's-dau', st.bang), { x: B.w - st.dc, y: 0, w: st.dc, h: B.h });
      const fd = Math.max(14, Math.round(24 * u));
      const a = mk('div', 's-doc', dau, ngayDoc()); a.style.fontSize = fd + 'px'; dat(a, { x: (st.dc - fd) / 2 - 2, y: st.mg });
      const b = mk('div', 's-doc', dau, '日直'); b.style.fontSize = fd + 'px'; dat(b, { x: (st.dc - fd) / 2 - 2, y: B.h - st.mg - fd * 4.4 });
      const c2 = mk('div', 's-doc c-vang', dau, 'ねこ'); c2.style.fontSize = fd + 'px'; dat(c2, { x: (st.dc - fd) / 2 - 2, y: B.h - st.mg - fd * 2.1 });
      dau.setAttribute('aria-hidden', 'true');
      st.dau = dau;
    }
    st.bui = mk('div', 's-bui', st.bang);
    st.que = mk('div', 's-que', st.bang); mk('i', '', st.que);
    st.tay = mk('div', 's-tay', st.bang); mk('i', '', st.tay);
    const ty = B.y + B.h + f - Math.round(5 * u), th = Math.round((st.dt ? 12 : 20) * u);
    const khay = dat(mk('div', 's-khay', L), { x: kx - 6 * u, y: ty, w: kw + 12 * u, h: th });
    mk('div', 's-bui-khay', khay);
    [['#fbfaf4', 0.1, 0.045], ['#f7d76a', 0.15, 0.036], ['#f79cb8', 0.2, 0.04], ['#95d0f4', 0.72, 0.032], ['#fbfaf4', 0.77, 0.022]].forEach((p) => {
      const v = dat(mk('div', 's-vien-phan', khay), { x: (kw + 12 * u) * p[1], y: -th * 0.35, w: Math.max(14, (kw + 12 * u) * p[2]), h: th * 0.62 });
      v.style.background = 'linear-gradient(180deg,#fff,' + p[0] + ' 45%,' + p[0] + ')';
    });
    dat(mk('div', 's-tay-khay', khay), { x: (kw + 12 * u) * 0.86, y: -th * 0.9, w: Math.max(40, (kw + 12 * u) * 0.08), h: th * 1.2 });
    // ban hoc phia truoc
    const yb = ty + th + Math.round((st.dt ? 6 : 14) * u);
    if (H - yb > 12) {
      dat(mk('div', 's-ban', L), { x: -20 * u, y: yb, w: W * 0.52, h: H - yb + 20 });
      dat(mk('div', 's-ban', L), { x: W * 0.55, y: yb + 4 * u, w: W * 0.5, h: H - yb + 20 });
      const bc = dat(mk('div', 's-but-chi', L), { x: W * 0.16, y: yb + Math.min(20 * u, (H - yb) * 0.4), w: Math.round(150 * u), h: Math.max(6, Math.round(9 * u)) });
      bc.style.transform = 'rotate(-6deg)';
      if (!st.dt) { const vo = dat(mk('div', 's-vo', L), { x: W * 0.36, y: yb + 10 * u, w: Math.round(150 * u), h: Math.round(56 * u) }); vo.style.transform = 'rotate(4deg)'; }
      else { const vo = dat(mk('div', 's-vo', L), { x: W * 0.4, y: yb + 6 * u, w: Math.round(90 * u), h: Math.round(40 * u) }); vo.style.transform = 'rotate(4deg)'; }
    }
    mk('span', 's-khong-bong', L).hidden = true;
  }
  /**
   * Meo ve co chuan (1) — chi khi lan xin gan nhat cua che do khac 1: api.coMeo tra ve hop meo (cdMeo: getComputedStyle + getBoundingClientRect) nen moi lan goi ep
   * tinh lai style / layout ca trang (20-40 ms khi DOM vua doi), ke ca khi co meo khong doi. Co meo that luon thuoc {st.kMeo, 1} (director chi dat ve 1 moi nhip).
   */
  function meoVe1(api) {
    if (!api || !api.coMeo || st.kMeo === 1) return;
    try { api.coMeo(1); } catch (e) {}
    st.kMeo = 1;
  }
  function coMeo(api) {
    if (!api || !api.coMeo) return;
    const m0 = st.meo;
    let k = 1;
    if (!st.dt && m0 && m0.w) {
      const phai = st.B.x + st.B.w + st.f;
      const k0 = kep((st.W - phai - 8 * st.u) / m0.w, 1, 1.25);
      if (k0 > 1.02) k = +k0.toFixed(2);
    }
    if (k === 1) { meoVe1(api); return; }
    try { api.coMeo(k); } catch (e) {}
    st.kMeo = k;
  }

  // ------------------------------------------------------------------ phong chu: nap truoc moi chu cua bai; tai xong -> soat
  const FONT = { bai: new Set(), nghe: null, bd: null };
  const FONT_URL = 'https://fonts.googleapis.com/css2?family=Yusei+Magic&family=Mali:wght@600;700&family=Zen+Maru+Gothic:wght@700;900&family=Be+Vietnam+Pro:wght@600;700;800&display=swap';
  /** Chen <link> phong chu mot lan (khong chan viec nap che do); tra Promise<true | false> khi nap xong / loi / qua 2,5 s */
  function napCssFont() {
    if (st.fontCss) return st.fontCss;
    st.fontCss = new Promise((ok) => {
      try {
        let l = document.querySelector('link[data-cd-font="s"]');
        if (!l) { l = document.createElement('link'); l.rel = 'stylesheet'; l.href = FONT_URL; l.dataset.cdFont = 's'; document.head.appendChild(l); }
        else if (l.sheet) { ok(true); return; }
        l.addEventListener('load', () => ok(true), { once: true });
        l.addEventListener('error', () => ok(false), { once: true });
        setTimeout(() => ok(!!l.sheet), 2500);
      } catch (e) { ok(false); }
    });
    st.fontCss.then(() => { st.fontCssXong = true; });
    return st.fontCss;
  }
  function napFont(nh) {
    const fs_ = document.fonts;
    if (!nh || !nh.bai || !fs_ || !fs_.load) return;
    const key = String(nh.capDo || '') + '-' + String(nh.bai.lessonNumber);
    if (FONT.bai.has(key)) return;
    FONT.bai.add(key);
    let s = '';
    try { s = JSON.stringify([nh.bai.title, nh.bai.vocabList, nh.bai.kanjiList, nh.bai.slides, nh.bai.dialogue, nh.bai.exercises]); } catch (e) { return; }
    const jpTxt = Array.from(new Set(s.match(/[　-ヿ㐀-鿿豈-﫿＀-￯]/g) || [])).join('');
    const viTxt = Array.from(new Set(s.match(/[^\u0000-\u007f　-ヿ㐀-鿿豈-﫿＀-￯]/g) || [])).join('') + 'AaZz09';
    const lay = (f, t) => { try { fs_.load(f, t).catch(() => {}); } catch (e) {} };
    lay('400 40px "Yusei Magic"', jpTxt + 'Aa');
    lay('900 40px "Zen Maru Gothic"', jpTxt);
    ['700', '600'].forEach((w) => lay(w + ' 40px "Mali"', viTxt));
    ['800', '900', '700'].forEach((w) => lay(w + ' 40px "Be Vietnam Pro"', viTxt));
  }
  /** Sau khi phong tai: khoi chu cao / rong hon o da chia -> thu nho (khong duoi san) */
  function soat(c) {
    if (!c || !c.el || !c.el.isConnected) return;
    const san = fsSan();
    c.el.querySelectorAll('.s-c[data-fh]').forEach((e) => {
      const h = +e.dataset.fh;
      let f = parseFloat(e.style.fontSize) || 16;
      for (let i = 0; i < 12 && (Math.max(e.offsetHeight, e.scrollHeight) > h + 2 || e.scrollWidth > e.clientWidth + 2) && f > san; i++) { f = Math.max(san, Math.round(f * 0.95 * 10) / 10); datCo(e, f); }
    });
  }

  // ================================================================== HOP DONG
  const DUNG = {
    vocab: (nh, c) => dungTuVung(nh, c),
    kanji: (nh, c) => dungChuHan(nh, c),
    'grammar-intro': (nh, c) => dungMauCau(nh, c),
    example: (nh, c) => dungViDu(nh, c),
    'kaiwa-intro': (nh, c) => dungKaiwaIntro(nh, c),
    'kaiwa-run': (nh, c, m) => dungLuot(nh, c, m, true),
    kaiwa: (nh, c, m) => dungLuot(nh, c, m, false),
    quiz: (nh, c, m) => dungQuiz(nh, c, m),
  };
  const CUE = { vocab: cueTuVung, kanji: cueChuHan, 'grammar-intro': cueMauCau, example: cueViDu, 'kaiwa-intro': cueKaiwaIntro, kaiwa: cueKaiwa, quiz: cueQuiz };

  function taoM(nh, api) {
    const m = {
      nh, nhip_: nh, api, cc: null, avtL: [],
      cue(id, tt) {
        // mo dau buoi giang: giu canh tieu de toi khi Sensei noi noi dung dau tien (V1 / K1 / ...); cue *0 = bat dau noi -> du phong 25 s
        if (m.chuyen && !m.daVao && /^(V[1-9]|K[1-9]|G[2-6]|E[1-5]|Q[1-3]|C[12]\.|F[2-4]|R\.)/.test(id)) m.chuyen(true);
        if (m.chuyen && !m.daVao && /^[VKGEQ]0$/.test(id) && !m.daNoi) { m.daNoi = true; if (m.henVao) api.huyHen(m.henVao); m.henVao = api.hen(() => m.chuyen(true), 25000); }
        const g = CUE[nh.kind];
        if (!g) return;
        if (m.cc && (m.daVao || !m.chuyen)) g(m, id, tt, api, nh, m.cc);
        else if (m.chuyen) (m.cuePhu = m.cuePhu || []).push([id, tt]);
      },
      karaoke(ds) {
        const c = m.cc;
        if (!c || !ds || !ds.length || (m.chuyen && !m.daVao)) return;
        if (nh.kind === 'example' && c.vd) {
          c.vd.coKaraoke = true;
          if (!daXong(c, 'tatCa')) huyMoc(c, 'tatCa');
          karaokeCau(m, c, ds, c.vd.eC, c.vd.tokEls, c.vd.tokTile, (k, t, d) => { const e = c.vd.tokEls[k]; if (e && !e.dataset.viet) { huyMoc(c, 't' + k); vietTok(c, e, t, d); } });
          const cuoi = ds[ds.length - 1];
          if (cuoi && !daXong(c, 'ng')) moc(c, 'ng', Math.max(0, cuoi.T - api.bayGio()) + 2.2);
        } else if ((nh.kind === 'kaiwa-run' || nh.kind === 'kaiwa') && c.lu) karaokeLuot(m, c, ds);
      },
      loi() { /* khong phu de loi Sensei */ },
      ghi() {}, congCu() {},
      tro(idMuc, o) {
        const c = m.cc;
        if (!c || idMuc == null) return;
        const e = c.el.querySelector('[data-tid="' + String(idMuc).replace(/["\\]/g, '') + '"]');
        if (e) nay(e, o && o.T != null ? api.treT(o.T) : 0, 1.08);
      },
      dongThoai(line, i) {
        m.lineDang = { l: line, i };
        if (nh.kind === 'kaiwa-run' && m.cc && m.cc.lu) veLuot(m, m.cc, line, i, false);
      },
      clip() {},
      het() {
        if (m.chuyen && !m.daVao) m.chuyen(true);
        const c = m.cc;
        if (!c) return;
        st.gap = true;
        try {
          hetCanh(c);
          if (c.vd) c.vd.tokEls.forEach((e) => vietTok(c, e, 0, 0.12));
          gachXong(m);
          if (c.lu && c.lu.cur) { const g = c.lu.cur; g.tokEls.forEach((e) => vietTok(c, e, 0, 0.12)); vietNg(c, g.ng); }
          if (c.np) c.np.sp.forEach((s) => vietCau(c, s));
          if (c.kj && c.kj.els.tus) c.kj.els.tus.querySelectorAll('.s-tu-d').forEach((dg) => vietDong(c, dg));
        } finally { st.gap = false; }
      },
      oBaiTap() { return nh.kind === 'quiz' && m.cc ? oBaiTapQuiz(m, m.cc) : null; },
      traLoi(exId, dung) { if (nh.kind === 'quiz' && m.cc) { m.traArg = [exId, dung]; traLoiQuiz(m, m.cc, exId, dung); } },
      // the that: chu dap an dat lang theo noi dung (Nhat -> auto-phrase, con lai de chu Viet khong bi doc nhu tieng Nhat)
      vaoCho(card) {
        try {
          if (!card || !card.querySelectorAll) return;
          const ts = Array.from(card.querySelectorAll('.qz-opt-text'));
          ts.forEach((e) => { e.lang = RE_JP.test(e.textContent || '') ? 'ja' : 'vi'; });
          // cum Nhat dai trong dap an: ngat dong chi o ranh gioi cum (khong cat giua tu)
          ts.forEach(ngatCumNhat);
        } catch (e) {}
      },
      raCho() { traNut(m.cc); },
      roi() { traNut(m.cc); (m.avtL || []).forEach((ct) => { try { ct.go(); } catch (e) {} }); m.avtL = []; if (st.m === m) st.m = null; },
    };
    return m;
  }
  /**
   * Dap an cua THE THAT (mot nut chu, khong boc tung don vi duoc): cum Nhat >= 5 ky tu duoc chen <wbr> o ranh gioi cum (tachJp: tro tu / duoi cau dinh vao tu truoc),
   * word-break keep-all (.s-giu) -> trinh duyet chi ngat dong o khoang trang, dau cau va <wbr>, khong con cat giua tu ('いたと|いう'). textContent giu nguyen;
   * cum dai hon ca dong van ngat duoc (overflow-wrap: anywhere) nhung la truong hop bat buoc
   */
  function ngatCumNhat(e) {
    if (!e || e.dataset.sNgat) return;
    const tn = [];
    const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) tn.push(w.currentNode);
    let co = false;
    tn.forEach((n) => {
      const t = n.nodeValue, re = new RegExp(RE_JPRUN.source, 'g');
      const fr = document.createDocumentFragment();
      let last = 0, mm, doi = false;
      while ((mm = re.exec(t))) {
        if (kyTu(mm[0]).length < 5) continue;
        co = true;
        const ds = tachJp(mm[0]);
        if (mm.index > last) fr.appendChild(document.createTextNode(t.slice(last, mm.index)));
        ds.forEach((u, k) => { if (k) fr.appendChild(document.createElement('wbr')); fr.appendChild(document.createTextNode(u)); });
        last = mm.index + mm[0].length;
        doi = true;
      }
      if (!doi) return;
      if (last < t.length) fr.appendChild(document.createTextNode(t.slice(last)));
      n.parentNode.replaceChild(fr, n);
    });
    e.dataset.sNgat = '1';
    if (co) e.classList.add('s-giu');
  }
  /** Lay cac con cua o dang giu THE THAT (the + chan the) ra khoi o de dung lai lop / canh ma khong mat the; null neu khong co o */
  function giuThe() {
    if (st.slotNgan) {
      const sl = st.slotNgan; st.slotNgan = null;
      if (sl.isConnected && sl.firstChild) { const fr0 = document.createDocumentFragment(); while (sl.firstChild) fr0.appendChild(sl.firstChild); return fr0; }
    }
    const m = st.m, K = m && m.cc && m.cc.qz;
    if (!K || !K.slot || !K.slot.isConnected || !K.slot.firstChild) return null;
    const fr = document.createDocumentFragment();
    while (K.slot.firstChild) fr.appendChild(K.slot.firstChild);
    return fr;
  }
  /** Dat the that (fr) vao o cua canh moi c, ve lai ket qua neu hoc vien da tra loi */
  function traThe(m, c, fr) {
    if (!fr || !m || !c || !c.qz) return false;
    const slot = oBaiTapQuiz(m, c);
    if (!slot) return false;
    slot.appendChild(fr);
    if (m.traArg) traLoiQuiz(m, c, m.traArg[0], m.traArg[1]);
    return true;
  }
  /** Tra lai cac nut dap an da an (the that ve luoi tinh nguyen ven) */
  function traNut(c) { const K = c && c.qz; if (K && K.anNut) { K.anNut.forEach((bt) => { try { G.killTweensOf(bt); G.set(bt, { clearProps: 'opacity' }); } catch (e) {} bt.style.display = ''; }); K.anNut = null; } }
  function dungCanh(nh, m, nhanh) {
    const c = canhMoi(nhanh);
    m.cc = c;
    try { DUNG[nh.kind](nh, c, m); } catch (e) { boCanh(c); m.cc = null; throw e; }
    canhVao(c);
    henLamLai(c, () => (st.m === m ? dungCanh(nh, m) : null));
    return c;
  }
  /**
   * Dung truoc canh cua nhip ke tiep ngay trong khoang nghi (motion.js dungTruoc): dung + do chu + gan DOM an, CHUA len lich gi (moc chi ghi nho) ->
   * luc nhip bat dau chi con cuc tay lau + viet (khong con 0,3 - 1 s do bo cuc giua cuc tay xoa, khong tre cue). Khong ap dung: nhip dau buoi, giang tiep (avatar nhep mieng chi gan, chua phat gi truoc khi co tieng)
   */
  function huyPre() { if (st.pre) { try { boCanh(st.pre.c); } catch (e) {} st.pre = null; } }
  function dungTruocS(nh, api) {
    if (!L || !DUNG[nh.kind] || nh.laBatDau || nh.isResume) return;
    huyPre();
    try {
      meoVe1(api);
      const k = doKhung();
      if (st.ngan || k !== st.kich || !st.bang || !st.bang.isConnected) return;
      napFont(nh);
      const m = taoM(nh, api);
      const c = canhMoi();
      c.pre = true; c.el.style.visibility = 'hidden';
      m.cc = c;
      try { DUNG[nh.kind](nh, c, m); } catch (e) { boCanh(c); m.cc = null; throw e; }
      st.pre = { beat: nh.beat, kind: nh.kind, m, c, kich: k };
    } catch (e) { huyPre(); try { console.warn('[s] dung truoc', e); } catch (er) {} }
  }
  /** Canh dung truoc duoc dung lai neu cung nhip, lop hoc chua doi, cuc tay con co (hoac khong can), phong chu khong doi sau khi dung */
  function layPre(nh) {
    const p = st.pre;
    if (!p) return null;
    st.pre = null;
    const F = document.fonts;
    const ok = p.beat === nh.beat && p.kind === nh.kind && !nh.laBatDau && !nh.isResume && p.c.el.isConnected && p.kich === st.kich
      && !!p.c.lau === !!(st.canh && !giam()) && !(F && F.status !== 'loading' && (st.tFontBd || 0) > p.c.tXay) && !canhTran(p.c);   // canhTran: phong tai xong SAU khi canh dung (dot tai da chay truoc canh nen tFontBd khong bat duoc) -> do bang phong du phong -> chu tran o da chia -> dung lai
    if (!ok) { try { boCanh(p.c); } catch (e) {} return null; }
    return p;
  }
  /** Canh dung truoc vao san khau: len lich cac moc da ghi nho tu BAY GIO, cuc tay lau canh cu */
  function nhanVaoCanh(p, nh, api) {
    const m = p.m, c = p.c;
    st.nhip = nh; st.api = api; st.m = m;
    c.pre = false; c.t0 = nowG();
    c.el.style.visibility = '';
    const dang = c.dang || {}; c.dang = null;
    Object.keys(dang).forEach((k) => moc(c, k, dang[k]));
    canhVao(c);
    henLamLai(c, () => (st.m === m ? dungCanh(nh, m) : null));
    coMeo(api);
    return m;
  }
  /**
   * Canh dung khi phong chu (Yusei Magic / Mali, tai theo manh unicode) con dang tai: do chu sai -> khi tai xong dung lai canh
   * o cung cho, phan da viet hien ngay (khong viet lai), phan chua viet giu moc cu.
   */
  function henLamLai(c, fn) {
    c.lamLai = fn;
    const F = document.fonts;
    if (!F || F.status !== 'loading' || !F.ready) return;
    F.ready.then(() => { if (L && st.canh === c) lamLaiCanh(c); });
  }
  /** Chup trang thai moc cua canh c: da viet xong / dang cho (thoi diem tuyet doi) */
  function chupMoc(c) {
    if (!c) return { xong: [], cho: [] };
    return {
      xong: Object.keys(c.mo).filter((k) => c.mo[k].xong),
      cho: Object.keys(c.mo).filter((k) => !c.mo[k].xong && c.mo[k].at != null).map((k) => [k, c.mo[k].at]),
    };
  }
  /** Ap trang thai da chup vao canh moi c2: phan da viet hien ngay (khong viet lai), phan dang cho giu nguyen thoi diem tuyet doi */
  function phucMoc(c2, sm) {
    st.ngay = true;
    try { sm.xong.forEach((k) => moc(c2, k, 0)); } catch (e) {} finally { st.ngay = false; }
    sm.cho.forEach(([k, at]) => moc(c2, k, Math.max(0, at - nowG())));
  }
  /** Dung lai canh c tai cho (phan da viet hien ngay, khong cuc tay); the that cua bai tap duoc giu lai */
  function lamLaiCanh(c) {
    if (!L || st.canh !== c || !c.el.isConnected || !c.lamLai || c.daLamLai > 2) return;
    const sm = chupMoc(c), m = st.m, fr = giuThe();
    st.canh = null;
    let c2 = null;
    try { c2 = c.lamLai(); } catch (e) { c2 = null; }
    if (!c2) { if (fr && c.qz && c.qz.slot) c.qz.slot.appendChild(fr); if (!st.canh) st.canh = c; return; }
    c2.daLamLai = (c.daLamLai || 0) + 1;
    phucMoc(c2, sm);
    if (fr) traThe(m, c2, fr);
    if (c.el.isConnected) boCanh(c);
  }
  /** Chu cua canh tran o da chia (do bang phong du phong truoc khi phong that tai xong)? */
  function canhTran(c) {
    if (!c || !c.el || !c.el.isConnected) return false;
    for (const e of c.el.querySelectorAll('.s-c[data-fh]')) {
      const h = +e.dataset.fh;
      if (Math.max(e.offsetHeight, e.scrollHeight) > h + 3 || e.scrollWidth > e.clientWidth + 3) return true;
    }
    return false;
  }


  /**
   * Doi co (cua so doi co / xoay man hinh / ResizeObserver): dung lai lop hoc theo kich thuoc moi va ve lai canh dang hien tai cho
   * (phan da viet hien ngay, phan dang cho giu moc cu, the that cua bai tap duoc giu). Meo ve co chuan truoc khi do (nhu luc vao nhip) -> bo cuc khong phu thuoc lich su.
   */
  /** Khung cua nhip / the: meo ve co chuan, do khung, dung lai lop hoc neu kich thuoc doi. false = man hinh qua thap (de the mac dinh ve) */
  function chuanKhung(api) {
    meoVe1(api);
    const k = doKhung();
    if (st.ngan) return false;
    if (k !== st.kich || !st.bang || !st.bang.isConnected) { st.kich = k; dungLopHoc(); }
    return true;
  }
  /**
   * Man hinh qua thap (dien thoai nam ngang / cua so < 430 px cao): bang khong ve duoc. Go lop + canh, tra san khau cho the mac dinh (data-cd-phu = '') de khong con khung trong;
   * dang den luot hoc vien thi the that + chan the duoc giu lai trong mot bang toi gian (cau hoi + 4 dap an + Bo qua / Tiep tuc) -> van tra loi duoc
   */
  function vaoNgan() {
    const fr = giuThe();
    const m = st.m, qz = m && m.nhip_ && m.nhip_.kind === 'quiz';
    st.canhs.slice().forEach(boCanh); st.canh = null;
    L.textContent = ''; st.bang = null; st.do = null; st.doSlot = []; st.kich = '';
    if (m) m.cc = null;
    if (fr && qz) {
      const pn = mk('div', 's-ngan', L), cau = (m.q && m.q.question) || '';
      if (cau) mk('div', 's-ngan-q', pn, donVi(String(cau).replace(/^\[(Dễ|Vừa|Khó)\]\s*/, '')));
      const sl = mk('div', 's-slot s-slot-ngan', pn);
      sl.setAttribute('role', 'group'); sl.setAttribute('aria-label', 'Đáp án');
      sl.appendChild(fr);
      st.slotNgan = sl;
      if (C && C.san) C.san.dataset.cdPhu = '1';
    } else if (C && C.san) C.san.dataset.cdPhu = '';
    st.nhNgan = true;
  }
  function doiCoS() {
    if (!L || st.chuaDung) return;   // chua dung lop hoc lan nao (batDau xong, nhip dau chua vao): chuanKhung lo
    const api = st.api;
    meoVe1(api);
    const k = doKhung();
    if (k === st.kich && st.bang && st.bang.isConnected) { coMeo(api); return; }
    // man hinh qua thap (dien thoai nam ngang): khong ve bang, xoa lop (khong de bang cu bi cat duoi thanh duoi); nhip sau dung nhip mac dinh
    if (st.ngan) { vaoNgan(); return; }
    st.kich = k;
    const c0 = st.canh, m = st.m, nh = st.nhip;
    const sm = chupMoc(c0), fn = c0 && c0.lamLai, fr = giuThe();
    dungLopHoc();
    // quay lai man hinh du cao: san khau thuoc ve che do tro lai (man hinh ngang da nhuong cho the mac dinh)
    if (st.nhNgan && C && C.san) { st.nhNgan = false; if (st.m) C.san.dataset.cdPhu = '1'; }
    let c2 = null;
    try { if (fn) c2 = fn(); } catch (e) { console.warn('[s] doiCo lamLai', e); c2 = null; }
    if (!c2 && nh && m && DUNG[nh.kind]) { try { c2 = dungCanh(nh, m); m.daVao = true; sm.xong = []; sm.cho = []; if (c2) hetCanh(c2); } catch (e) { console.warn('[s] doiCo', e); c2 = null; } }
    if (c2) { phucMoc(c2, sm); if (fr) traThe(m, c2, fr); }
    coMeo(api);
  }

  // phong chu nap ngay khi tep che do duoc nap (lop tinh s-tinh cung dung chung phong): <link> khong chan, loi mang chi lam chu roi ve phong du phong
  try { napCssFont(); } catch (e) {}

  SC.dangKy({
    id: ID,
    ten: 'Bảng đen lớp học',
    can: ['gsap'],
    // ham thuan de kiem thu trong Node (khong dung trong buoi hoc)
    _thuan: { tachMenh, hangHtml, phanLoaiCt, ctTin, phanCongThucTu, phanCum, phanDuPhong, datC: (c) => { C = c; } },
    batDau(lop0, ctx) {
      L = lop0; C = ctx; G = ctx.gsap;
      Object.assign(st, { canh: null, canhs: [], nhip: null, m: null, api: null, queBan: 0, kich: '', pre: null, chuaDung: true });
      // meo dang o co chuan (director dat ve 1 luc tat che do cu / moi nhip): khong goi C.coMeo(1) o day (ep layout ~20 ms luc vao)
      st.kMeo = 1;
      // KHONG dung lop hoc o day: luc batDau san khau con o be ngang cu (vd 1180 thay vi 1440, cot ben giang chua dong) -> lop dung o day bi vut roi dung lai o
      // chuanKhung dau tien (khi nhip dau vao), ton ~75 ms trong cung mot tac vu. Lop hoc dung o chuanKhung (dungNhip / theChuong / theXong) hoac doiCoS.
      try {
        const se = window.__slideEngine;
        if (se && se.loader && se.currentLevel) { const bai = se.loader.getLesson(se.currentLevel, se.currentLesson); if (bai) { st.bai0 = { capDo: String(se.currentLevel).toUpperCase(), bai }; napFont(st.bai0); } }
      } catch (e) {}
      // phong chu nap bang <link> (khong @import trong s.css); CSS ve toi thi nap chu cua bai ngay
      try { napCssFont().then((ok) => { if (ok && L && st.bai0) { FONT.bai.clear(); napFont(st.bai0); } }); } catch (e) {}
      try {
        if (document.fonts && !FONT.nghe) {
          // canh dung truoc khi mot dot tai phong bat dau (do bang phong du phong) -> tai xong thi dung lai tai cho (phan da viet hien ngay); canh dung sau thi chi soat tran
          FONT.bd = () => { st.tFontBd = performance.now(); };
          FONT.nghe = () => {
            if (!L || !st.canh) return;
            const c = st.canh;
            if (c.lamLai && (canhTran(c) || (c.tXay || 0) < (st.tFontBd || 0))) { clearTimeout(st.hFont); st.hFont = setTimeout(() => { st.hFont = 0; if (L && st.canh === c) lamLaiCanh(c); }, 140); } else soat(c);
          };
          document.fonts.addEventListener('loadingstart', FONT.bd);
          document.fonts.addEventListener('loadingdone', FONT.nghe);
        }
      } catch (e) {}
      // do lai khi vung lop doi kich thuoc SAU khi bo cuc da on dinh (cua so doi co / xoay man hinh: thanh duoi cap nhat sau su kien resize)
      try {
        if (window.ResizeObserver && !st.ro) {
          // khung khong doi so voi lan do gan nhat (RO bao ca luc moi observe va khi cot ben giang doi nhung lop van co cu): khong do lai (coMeo(1) + doKhung ep layout ~70 ms luc vao)
          st.ro = new ResizeObserver((es) => { const r = es && es[0] && es[0].contentRect; if (r && st.bang && st.bang.isConnected && Math.abs(r.width - st.W) < 1 && Math.abs(r.height - st.H) < 1) return; clearTimeout(st.hRo); st.hRo = setTimeout(() => { st.hRo = 0; if (L) doiCoS(); }, 140); });
          st.ro.observe(L);
        }
      } catch (e) {}
      // tay cam thu nghiem (chi trang mo phong / debug): khong lo ra trong buoi hoc that
      try { if (/[?&](moPhong|debug)\b/.test(location.search)) window.__cdS = { st, fit, xepDoc, canh: () => st.canh, m: () => st.m, het: () => { if (st.m) st.m.het(); } }; } catch (e) {}
    },
    ketThuc() {
      try { if (st.ro) st.ro.disconnect(); } catch (e) {}
      st.ro = null; clearTimeout(st.hRo); st.hRo = 0;
      try { delete window.__cdS; } catch (e) {}
      try { if (FONT.nghe) document.fonts.removeEventListener('loadingdone', FONT.nghe); if (FONT.bd) document.fonts.removeEventListener('loadingstart', FONT.bd); } catch (e) {}
      FONT.nghe = null; FONT.bd = null; clearTimeout(st.hFont); st.hFont = 0;
      st.pre = null;
      st.canhs.slice().forEach(boCanh);
      if (G && L) { try { G.killTweensOf(L.querySelectorAll('*')); } catch (e) {} }
      L = null; C = null; st.m = null; st.nhip = null; st.api = null; st.canh = null; st.canhs = []; st.bang = null; st.do = null; st.doSlot = [];
      try { if (st.hop) st.hop.remove(); } catch (e) {}
      st.hop = null;
    },
    doiCo() { doiCoS(); },
    dungTruoc(nh, api) { dungTruocS(nh, api); },
    dungNhip(nh, api) {
      if (!L || !DUNG[nh.kind]) return null;
      if (!chuanKhung(api)) { huyPre(); return null; }
      const pre = layPre(nh);
      if (pre) return nhanVaoCanh(pre, nh, api);
      st.nhip = nh; st.api = api;
      napFont(nh);
      coMeo(api);
      const m = taoM(nh, api);
      st.m = m;
      const moDau = !!(nh.laBatDau && !nh.isResume && nh.i === 0 && nh.bai);
      if (moDau) {
        // phong chu con dang tai (phien dau): cho toi da 0,7 s roi moi dung tieu de -> khong hien tieu de bang phong du phong roi nhay bo cuc
        const dungTD = () => {
          if (!L || st.m !== m || m.daVao || m.tdXong) return;
          m.tdXong = true;
          const c0 = canhMoi();
          dungTieuDe(nh, c0);
          canhVao(c0);
          henLamLai(c0, () => { if (st.m !== m || m.daVao) return null; const c1 = canhMoi(); dungTieuDe(nh, c1); canhVao(c1); return c1; });
        };
        // phong chu cua bai con dang tai (CSS phong hoac tep phong): cho toi da 1,5 s roi moi dung tieu de -> khong hien tieu de bang phong du phong roi nhay bo cuc
        const F = document.fonts, choFont = !!(F && F.ready) && !giam() && (F.status === 'loading' || (st.fontCss && !st.fontCssXong));
        m.tT = nowG() + (choFont ? 1.5 : 0);
        if (choFont) { Promise.resolve(st.fontCss).then(() => new Promise((ok) => setTimeout(ok, 30))).then(() => F.ready).then(dungTD, dungTD); api.hen(dungTD, 1500); }
        else {
          // phong chu san sang: van dung tieu de SAU khung hinh dau (tac vu rieng) — khong don chung vao tac vu batDauNhip (dung lop hoc + cat + am thanh: ~100-150 ms) thanh mot tac vu 250 ms
          try { requestAnimationFrame(() => setTimeout(dungTD, 0)); } catch (e) { setTimeout(dungTD, 16); }
          api.hen(dungTD, 1500);   // tab nen (rAF dung): van dung
        }
        m.chuyen = (khong) => {
          if (m.daVao) return;
          const con = m.tT + 3.2 - nowG();
          if (con > 0.05 && !khong && !giam()) { if (!m.henChuyen) m.henChuyen = api.hen(() => { m.henChuyen = null; m.chuyen(true); }, con * 1000); return; }
          if (m.henChuyen) api.huyHen(m.henChuyen);
          if (m.henVao) api.huyHen(m.henVao);
          m.daVao = true;
          if (!L || st.m !== m) return;
          // canh dau da dung san (an) luc tieu de con hien: chi con cuc tay nhanh + viet; khong thi dung ngay, cuc tay nhanh (tu tieu de sang tu dau khong cho lau)
          const p0 = m.pre0; m.pre0 = null;
          const F = document.fonts;
          if (p0 && p0.el.isConnected && !(F && F.status !== 'loading' && (st.tFontBd || 0) > p0.tXay) && !canhTran(p0)) nhanVaoCanh({ m, c: p0 }, nh, api);
          else {
            if (p0) boCanh(p0);
            try { dungCanh(nh, m, 0.5); } catch (e) { console.warn('[s] dung canh', e); return; }
          }
          coMeo(api);
          const q = m.cuePhu || []; m.cuePhu = null;
          q.forEach((x) => { const g = CUE[nh.kind]; if (g && m.cc) g(m, x[0], x[1], api, nh, m.cc); });
        };
        m.henVao = api.hen(() => m.chuyen(true), 7000);
        // tieu de ve xong (~1,8 s): dung san canh dau hoc (an) luc ranh -> luc Sensei doc tu dau chi con cuc tay
        api.hen(() => {
          if (!L || st.m !== m || m.daVao || !m.tdXong || m.pre0 || !DUNG[nh.kind]) return;
          nhan_(() => {
            if (!L || st.m !== m || m.daVao || m.pre0) return;
            const c = canhMoi(0.5);
            c.pre = true; c.el.style.visibility = 'hidden';
            m.cc = c;
            try { DUNG[nh.kind](nh, c, m); m.pre0 = c; } catch (e) { boCanh(c); m.cc = null; }
          });
        }, 1900);
        return m;
      }
      dungCanh(nh, m);
      return m;
    },
    theChuong(info, api) {
      if (!L) return false;
      if (!chuanKhung(api)) return false;
      st.api = api;
      const c = canhMoi(0.7);   // the chuong chi hien ~1,6 s: cuc tay lau nhanh hon de chu viet xong som
      try { dungTheChuong(info, c); } catch (e) { boCanh(c); console.warn('[s] the chuong', e); return false; }
      canhVao(c);
      henLamLai(c, () => { const c1 = canhMoi(); dungTheChuong(info, c1); canhVao(c1); return c1; });
      coMeo(api);
      return true;
    },
    theXong(info, api) {
      if (!L) return false;
      if (!chuanKhung(api)) return false;
      st.api = api;
      const c = canhMoi();
      try { dungTheXong(info, c); } catch (e) { boCanh(c); console.warn('[s] the xong', e); return false; }
      canhVao(c);
      henLamLai(c, () => { const c1 = canhMoi(); dungTheXong(info, c1); canhVao(c1); return c1; });
      coMeo(api);
      return true;
    },
  });
})();
