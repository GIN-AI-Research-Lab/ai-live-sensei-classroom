/* ==========================================================================
   Che do san khau H — "Giấy cắt lớp" (port tu ban mau E:/sensei-tam/demo2/h/giay.js sang san khau SONG).
   Ca vung san khau la mot DIORAMA giay nhieu lop (troi, mat troi, may, nui Phu Si, doi, co truoc) — moi lop truot
   voi toc do khac nhau (parallax) khi "may quay" truot tu canh nay sang canh ke tiep (moi nhip = mot canh).
   Noi dung la cac tam giay: cua so vom (anh minh hoa) co rem cuon, nhan treo tha xuong + dung dua, ghi chu gap
   mo xuong, o chu roi vao khe, nhan dan dap xuong, dau X / vong khoanh dung, hoa giay.
   Moc lay tu tieng Sensei (tt.T), tieu diem toi truoc tieng 80 ms (api.tre). KHONG co phu de / bong thoai chu Sensei:
   chi noi dung bai (tu, cach doc, nghia, mau cau, vi du, hoi thoai, bai tap).
   Co chu: bang co so (BASE) + tuy chon ghi de theo bai (curriculum/che-do/h/<cap>-<bai>.json, hash noi dung bai khop)
   + tu vua khung (fit) khi khong co ghi de.
   Am thanh: nen nhac nho (assets/che-do/h/nhac-h.mp3, lap lai, ha khi Sensei noi) + SFX chuyen canh / hien noi dung (WebAudio).
   Hoi thoai: chan dung nhep mieng qua SenseiAvatarNoi.gan (nhu mode A). Hop dong: scratchpad che-do/HUONG-DAN.md.
   ========================================================================== */
(function () {
  'use strict';
  const SC = window.SenseiCheDo;
  if (!SC) return;

  const ID = 'h';
  const TM = [], PH = [];
  const DOC_TRO = { 'は': 'wa', 'へ': 'e', 'を': 'o' };
  const ROMAJI_TRO = { 'は': 'wa', 'が': 'ga', 'を': 'o', 'に': 'ni', 'で': 'de', 'と': 'to', 'も': 'mo', 'の': 'no', 'へ': 'e', 'か': 'ka', 'や': 'ya', 'から': 'kara', 'まで': 'made', 'です': 'desu', 'ます': 'masu', 'ね': 'ne', 'よ': 'yo', 'じゃありません': 'ja arimasen', 'じゃ ありません': 'ja arimasen', 'ではありません': 'dewa arimasen', 'でした': 'deshita', 'ました': 'mashita', 'ません': 'masen' };
  const RE_DAU = /^[、。，．,.！？!?・…‥」』）)】〉》「『（(【〈《\s]+$/;
  const RE_JP = /[぀-ヿ一-鿿々〆〜ー]/;
  const KEY_AM = 'sensei_che_do_h_am';
  // line-height cua chu Viet co chen chu Nhat (nhan dan, dong phu, giai thich): Zen Maru cao 1,45 em (Nunito 1,36 em) -> duoi 1,4 thi chu Nhat
  // dong duoi de len dau dong tren (TEXT-OVERLAP); 1,42 = cach dong rong vua cho dau tieng Viet
  const LH_VJ = 1.42;

  // ------------------------------------------------------------------ BANG CO SO (px thiet ke 1920x1080) [lon nhat, nho nhat]
  // dt: dien thoai (px that). Mot bang ghi de theo bai co the thay `max` (xem ovFs). Tham chieu: giay.css / giay.js cua ban mau.
  const FS = {
    kanji:   { d: [220, 84], p: [96, 40] },     // tu chinh tren nhan treo (ban mau 220)
    ruby:    { d: [52, 22], p: [24, 13] },      // cach doc tren dau chu (ban mau 52)
    romaji:  { d: [34, 20], p: [18, 14] },      // vien xanh la (ban mau 34)
    nghia:   { d: [60, 32], p: [34, 20] },      // nghia chinh trong ghi chu gap (ban mau 60 / 50)
    phu:     { d: [27, 19], p: [16, 14] },      // dong phu (ban mau 27)
    dan:     { d: [34, 20], p: [18, 14] },      // nhan dan (ban mau 30-36)
    nhan:    { d: [21, 14], p: [12, 11] },      // nhan nho HOA co letter-spacing (ban mau 21)
    dai:     { d: [21, 14], p: [12, 11] },      // dai mau cua ghi chu gap
    tile:    { d: [92, 34], p: [40, 22] },      // chu trong o (ban mau 92)
    form:    { d: [132, 54], p: [60, 30] },     // chu khoi cong thuc (ban mau 132)
    cau:     { d: [96, 40], p: [40, 24] },      // cau hoi / cau thoai (ban mau 96)
    tieude:  { d: [60, 30], p: [26, 18] },      // tieu de tam giay (ban mau 60)
    bai:     { d: [150, 70], p: [76, 44] },     // "Bài N" tren giay
    tt:      { d: [84, 36], p: [36, 24] },      // the on tap
  };
  // delay co so (giay, tinh tu luc vao nhip) — dung chung; ghi de theo bai cong them (ovTre)
  const TRE = {
    rem: 0.2, tag: 0.05, ruby: 0.6, nghia: 1.6, dan: 3.0, vom: 0.0,
    tieuTag: 0.35, tieuBai: 1.25, tieuRuy: 2.0, tieuChip: 2.4,
    header: 0.03, khoi: 0.15, giaiThich: 2.6, luuY: 4.0,
    tok: 0.0, tokBuoc: 0.02, nghiaVD: 2.2, hoa: 0.03,
    cauHoi: 0.03, luaChon: 0.2, luaBuoc: 0.1,
  };
  const CAM = { dur: 1.0, ease: 'power2.inOut', troi: 16, crane: 56, craneDur: 2.6 };
  const F_LOP = [['mattroi', 0.015], ['may', 0.07], ['nui1', 0.16], ['nui2', 0.28], ['doi1', 0.5], ['doi2', 0.72]];
  const F_TRUOC = 1.25;
  const TILE_D = 3840;           // be rong 1 vien lap cua lop nen (px thiet ke), chu ky song chia het
  const troiPx = () => (st.dt ? 5 : CAM.troi);          // do troi nhe cua may quay (dien thoai: nho de le 8 px khong bi cat)
  const GAM = { nhacYen: 0.46, nhacNoi: 0.19, sfx: 0.55 };   // gain nhac khi Sensei im / dang noi; SFX

  // ------------------------------------------------------------------ trang thai
  let L = null;          // lop .cd-lop
  let C = null;          // ctx / tien ich dao dien (CDH)
  let G = null;          // gsap
  const st = {
    W: 0, H: 0, dt: false, xo: 0, cw1: 0, pf: 1, hu: 0.75, sx: 1, sy: 1, meo: null,
    k: 0,                // chi so canh trong the gioi
    canhs: [],           // cac canh dang co mat
    canh: null,          // canh hien tai
    nhip: null, m: null, mesur: null,
    cam: { x: 0, y: 0 }, lop: [], mundo: null, tab: null,
    avt: [], gen: 0, daVao: false,
  };

  // ------------------------------------------------------------------ tien ich
  const esc = (s) => (C ? C.esc(s) : String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]));
  // cum chu Nhat ngan (<= 10 ky tu) chen trong cau Viet: khong be giua tu (帰 / る) -> nowrap (lop h-jw); cau Nhat dai van xuong dong
  const jp = (s) => {
    const h = C ? C.jp(s) : esc(s);
    // ca noi dung chi la chu Nhat (vd. o cong thuc わけではない): de trinh duyet tu xuong dong, khong nowrap
    if (!/[A-Za-zÀ-ỹ0-9]/.test(String(s || '').replace(/[぀-ヿ一-鿿々〆〜ー]/g, ''))) return daku(h);
    // cum Nhat ngan (<= 10): nowrap; cum dai: chi xuong dong o ranh gioi tu ICU (keep-all + <wbr>) — trinh duyet (auto-phrase) co the be giua 'という' ma ICU coi la mot tu
    const huyEsc = (t) => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
    return daku(h.replace(/<span lang="ja">([^<]{1,10})<\/span>/g, '<span lang="ja" class="h-jw">$1</span>')
      .replace(/<span lang="ja">([^<]{11,})<\/span>/g, (mm, t) => '<span lang="ja" style="word-break:keep-all">' + wbrJa(huyEsc(t)) + '</span>'));
  };
  /** dau ゛ (tenten) / ゜ (maru): glyph goc nho + nam goc tren phai o em-box -> khi dung rieng (bai KANA 4: 'dau ゛', o cong thuc chi co dau) chi con cham ~14 px;
   *  thay bang SVG ve dam 0,85 em, can giua (kieu chu: stroke = currentColor). Chi dung cho chuoi HTML (khong dung trong thuoc tinh). */
  const SVG_DAKU = '<svg class="h-daku" viewBox="0 0 100 100" aria-hidden="true"><path d="M36 4 L22 58 M76 4 L62 58" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round"/></svg>';
  const SVG_MARU = '<svg class="h-daku" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="32" r="26" fill="none" stroke="currentColor" stroke-width="12"/></svg>';
  const daku = (h) => String(h == null ? '' : h).replace(/[゛゙]/g, SVG_DAKU).replace(/[゜゚]/g, SVG_MARU);
  const kep = (x, a, b) => Math.max(a, Math.min(b, x));
  let INST = false;      // dung lai canh khi doi co man hinh: moi hieu ung chay NGAY o trang thai cuoi (khong bay vao lai, khong am thanh)
  const giam = () => INST || !!(C && C.giam);
  const kyTu = (s) => Array.from(String(s == null ? '' : s));
  const chuTok = (t) => String((t && (t.kanji || t.text)) || '').trim();
  const laDau = (t) => RE_DAU.test(chuTok(t) || ' ');
  const nowG = () => (G && G.ticker ? G.ticker.time : 0);
  const viet1 = (s) => { s = String(s || '').trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; };
  const so2 = (n) => String(n == null ? '' : n).padStart(2, '0');
  const tuNhanVat = (url) => { const m = /nv\/([^/]+)\//.exec(url || '') || /nv-([^./]+)\.\w+$/.exec(url || ''); return m ? m[1] : ''; };
  function tachNgoac(s) {
    const m = /^(.*?)\s*[(（]([^)）]*)[)）]\s*$/.exec(String(s || ''));
    return m ? [m[1].trim(), m[2].trim()] : [String(s || '').trim(), ''];
  }
  /** Cat theo TU (khong cat giua tu): toi da n ky tu, them … */
  function nganTu(s, n) {
    s = String(s || '').trim();
    if (kyTu(s).length <= n) return s;
    const cut = kyTu(s).slice(0, n).join('');
    const k = cut.lastIndexOf(' ');
    return (k > n * 0.5 ? cut.slice(0, k) : cut).replace(/[\s,;:、]+$/, '') + '…';
  }
  /** Nghia: { chinh, phu } — chinh = phan ngoai ngoac, phu = noi dung trong ngoac (viet hoa chu dau). Khong mat chu nao. */
  function tachNghia(s) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    const trong = [];
    let chinh = s.replace(/\s*[(（]([^)）]*)[)）]\s*/g, (m, a) => { if (a.trim()) trong.push(a.trim()); return ' '; }).replace(/\s+/g, ' ').trim();
    chinh = chinh.replace(/\s+([.,;:!?。、，])/g, '$1').replace(/[\s,;:、]+$/, '');     // khong con 'mua .' (khoang trang truoc dau cau sau khi tach ngoac)
    if (!chinh && trong.length) chinh = trong.shift();
    return { chinh: viet1(chinh), phu: viet1(trong.join('; ')) };
  }
  const bo = (arr, i) => (arr && arr.length ? arr[Math.min(i, arr.length - 1)] : null);

  // ------------------------------------------------------------------ ghi de theo bai (curriculum/che-do/h/<cap>-<bai>.json)
  // Cau truc: { mode:'h', cap, bai, hash, profiles: { '1440x900': { beats: { '<i>:<kind>': { fs:{ten:px}, tre:{ten:s}, pos:{ten:{x,y,w,h}} } } }, '390x844': {...} } }
  // fs = co chu LON NHAT (px thiet ke 1920 [may tinh] / px that [dien thoai]); van tu vua khung (khong bao gio tran). Thieu tep / hash khac -> tu vua.
  const OV = { cache: Object.create(null), key: '', beat: null, hash: '', index: null, chiMuc: null, tam: null };
  function fnv(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('0000000' + (h >>> 0).toString(16)).slice(-8);
  }
  function hashBai(bai) {
    if (!bai) return '';
    try { return fnv(JSON.stringify([bai.title, bai.vocabList, bai.kanjiList, bai.slides, bai.dialogue, bai.exercises])); } catch (e) { return ''; }
  }
  const keyBai = (nh) => String((nh && nh.capDo) || '').toUpperCase() + '-' + String(nh && nh.bai && nh.bai.lessonNumber != null ? nh.bai.lessonNumber : '');
  const proKey = () => (st.dt ? '390x844' : '1440x900');
  /** Nap chi muc (index.json: { bai: { "N5-1": "<hash>" } }) roi chi nap tep ghi de khi co trong chi muc va hash khop (khong 404 vo ich) */
  function napGhiDe(nh) {
    const key = keyBai(nh);
    if (!nh || !nh.bai || /-$/.test(key)) return;
    if (OV.cache[key] !== undefined) return;
    OV.cache[key] = null;
    OV.dang = OV.dang || {}; OV.cho = OV.cho || {};
    OV.dang[key] = true;
    const hash = hashBai(nh.bai);
    const xong = () => { OV.dang[key] = false; (OV.cho[key] || []).splice(0).forEach((f) => { try { f(); } catch (e) {} }); };
    const lay = () => {
      if (!OV.index || OV.index.bai[key] !== hash) { xong(); return; }
      fetch('curriculum/che-do/h/' + key + '.json', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => { if (j && j.mode === ID && j.hash === hash && j.profiles) OV.cache[key] = j; })
        .catch(() => {})
        .then(xong);
    };
    try {
      if (!OV.chiMuc) {
        OV.chiMuc = fetch('curriculum/che-do/h/index.json', { cache: 'no-store' })
          .then((r) => (r.ok ? r.json() : null))
          .then((j) => { OV.index = j && j.bai ? j : { bai: {} }; })
          .catch(() => { OV.index = { bai: {} }; });
      }
      OV.chiMuc.then(lay);
    } catch (e) { OV.dang[key] = false; }
  }
  /** Chay fn khi ghi de cua bai cua nhip nh da nap xong (ngay lap tuc neu da xong / khong co; toi da 350 ms doi — khong de canh trong lau).
   *  KHONG doi phong chu o day (doi lam khung trong > 250 ms luc chuyen nhip = BLANK-FLASH FAIL cua do-bo-cuc): phong chu tai xong thi khiFontXong() -> soat() sua lai */
  function khiGhiDeXong(nh, fn) {
    const key = keyBai(nh);
    if (OV.dang && OV.dang[key]) {
      let da = false;
      const mot = () => { if (da) return; da = true; fn(); };
      (OV.cho[key] = OV.cho[key] || []).push(mot);
      setTimeout(mot, 350);
      return false;
    }
    fn(); return true;
  }
  /** Nap truoc ghi de cua bai dang mo (luc che do bat) de nhip dau da co ghi de */
  function napTruocBai() {
    try {
      const se = window.__slideEngine;
      if (!se || !se.loader || !se.currentLevel) return;
      const bai = se.loader.getLesson(se.currentLevel, se.currentLesson);
      if (bai) { napGhiDe({ capDo: String(se.currentLevel).toUpperCase(), bai }); napFont({ capDo: String(se.currentLevel).toUpperCase(), bai }); }
    } catch (e) {}
  }
  // ---- PHONG CHU: Zen Maru Gothic (Google Fonts) chia thanh ~120 manh unicode-range, chi tai manh khi co chu dung toi.
  // Do chu (canvas measureText / st.mesur) truoc khi manh tai xong = do bang phong du phong (rong / cao khac) -> chu tran o,
  // cau hoi bi cat. Cach chua: (1) tai TRUOC moi manh can cho ca bai (moi chu cua bai) ngay khi gap bai;
  // (2) khi co manh moi tai xong: xoa cache be ngang, bo canh dung san (do bang phong cu), soat lai canh dang hien (soat()).
  const FONT = { bai: new Set(), doi: 0 };
  function napFont(nh) {
    const fs_ = document.fonts;
    if (!nh || !nh.bai || !fs_ || !fs_.load) return;
    const key = keyBai(nh);
    if (FONT.bai.has(key)) return;
    FONT.bai.add(key);
    let s = '';
    try { s = JSON.stringify([nh.bai.title, nh.bai.vocabList, nh.bai.kanjiList, nh.bai.slides, nh.bai.dialogue, nh.bai.exercises]); } catch (e) { return; }
    const jpTxt = Array.from(new Set(s.match(/[　-ヿ㐀-鿿豈-﫿＀-￯]/g) || [])).join('');
    const viTxt = Array.from(new Set(s.match(/[^\u0000-\u007f　-ヿ㐀-鿿豈-﫿＀-￯]/g) || [])).join('') + 'AaZz09';
    const lay = (f, t) => { try { fs_.load(f, t).catch(() => {}); } catch (e) {} };
    ['900', '700'].forEach((w) => lay(w + ' 40px "Zen Maru Gothic"', jpTxt + 'Aa'));   // khong co chu nao dung weight 500 (QA: chi 700 / 900)
    ['900', '800', '700'].forEach((w) => lay(w + ' 40px "Nunito"', viTxt));
  }
  function khiFontXong() {
    FONT.doi++;
    W100.clear();
    if (st.pre && st.pre.m && st.pre.m.cc && st.pre.m.cc.font !== FONT.doi) huyPre();
    if (st.canh) soat(st.canh);
  }
  function datGhiDe(nh) {
    const j = OV.cache[keyBai(nh)];
    const pr = j && j.profiles && j.profiles[proKey()];
    OV.beat = (pr && pr.beats && pr.beats[nh.i + ':' + nh.kind]) || null;
    // ghi de tam (tools/tinh-chinh-che-do.mjs thu co chu): { key: 'i:kind', fs: {...} }
    if (OV.tam && OV.tam.key === nh.i + ':' + nh.kind) OV.beat = { fs: Object.assign({}, OV.beat && OV.beat.fs, OV.tam.fs), tre: OV.beat && OV.beat.tre, pos: OV.beat && OV.beat.pos };
    OV.key = keyBai(nh);
  }
  const ovFs = (ten, v) => { const o = OV.beat && OV.beat.fs && OV.beat.fs[ten]; return o != null ? +o : v; };
  const ovTre = (ten, v) => { const o = OV.beat && OV.beat.tre && OV.beat.tre[ten]; return o != null ? v + +o : v; };
  const ovPos = (ten, r) => { const o = OV.beat && OV.beat.pos && OV.beat.pos[ten]; return o ? Object.assign({}, r, o) : r; };
  /** Co chu (px that) cua vai: { max, min }. Co ghi de: max = ghi de (tinh theo px thiet ke tren may tinh) */
  // ?hCo=1.25: nhan co chu TOI DA (chi de THU bo cuc khi chu to hon; co toi thieu giu nguyen de ham fit van co duoc; 0,7..1,6)
  const HE_CO = (() => { try { const v = parseFloat(new URLSearchParams(location.search).get('hCo')); return v > 0 ? Math.max(0.7, Math.min(1.6, v)) : 1; } catch (e) { return 1; } })();
  function T(vai) {
    const f = FS[vai];
    // ghi de theo bai (curriculum/che-do/h/*.json, cong cu tinh chinh cu) tung ha co xuong 8 px -> khong bao gio duoi muc toi thieu cua vai
    // san tuyet doi (nguong doc duoc cua probe): 14 px may tinh / 13 px dien thoai; nhan HOA trang tri (nhan, dai) 11 px
    const sanTD = vai === 'nhan' || vai === 'dai' ? 11 : (st.dt ? 13 : 14);
    if (st.dt) { const mx = Math.max(ovFs(vai, f.p[0]), f.p[1], sanTD) * st.pf * HE_CO; return { max: mx, min: Math.max(sanTD, Math.min(mx, f.p[1] * st.pf)) }; }
    const mx = Math.max(Math.max(ovFs(vai, f.d[0]), f.d[1]) * HE_CO * st.hu, sanTD);
    return { max: mx, min: Math.max(sanTD, Math.min(mx, f.d[1] * st.hu)) };
  }
  const tre = (ten) => ovTre(ten, TRE[ten] == null ? 0 : TRE[ten]);

  // ================================================================== AM THANH (nhac nen + SFX), WebAudio
  // Nhac duoc ha khi Sensei noi (doc muc phat tu __audioEngine.getOutputLevel / isPlaying), dung khi tam dung / doi che do / dung.
  // Nhac KHONG di qua outBus (analyser cua meo) nen meo khong nhep mieng theo nhac.
  const ASSET = 'assets/che-do/h/';
  const SFX_DS = ['whoosh', 'trans', 'tick', 'stamp', 'ding', 'step0', 'step1', 'step2', 'step3', 'correct', 'wrong', 'sparkle', 'finale'];
  const PRIO = { stamp: 5, wrong: 5, correct: 5, ding: 4, whoosh: 4, trans: 4, sparkle: 4, finale: 5, step: 3, tick: 1 };
  const AM = {
    own: null, ctx: null, nhacG: null, sfxG: null, buf: Object.create(null), nhac: null, nap: null, src: null,
    mute: false, bat: false, off: 0, t0: 0, duck: false, tNoi: 0, tDo: 0, gHienTai: -1, log: [], dsSfx: [], loi: 0, mo: false,
  };
  try { AM.mute = localStorage.getItem(KEY_AM) === '1'; } catch (e) {}
  const engine = () => window.__audioEngine || null;
  function amCtx() {
    const e = engine();
    if (e && e.outCtx && e.outCtx.state !== 'closed') return e.outCtx;
    if (!AM.own || AM.own.state === 'closed') {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { AM.own = new AC(); } catch (er) { return null; }
    }
    return AM.own;
  }
  /** Dung do thi gain tren ctx hien tai (doi ctx giua chung -> dung lai) */
  function amDo() {
    const c = amCtx();
    if (!c) return null;
    if (AM.ctx !== c) {
      try { if (AM.src) { AM.src.onended = null; AM.src.stop(); } } catch (e) {}
      AM.src = null; AM.ctx = c;
      AM.nhacG = c.createGain(); AM.nhacG.gain.value = 0; AM.nhacG.connect(c.destination);
      AM.sfxG = c.createGain(); AM.sfxG.gain.value = GAM.sfx; AM.sfxG.connect(c.destination);
      AM.gHienTai = -1;
    }
    return c;
  }
  function amTai() {
    const c = amDo();
    if (!c || AM.nap) return AM.nap;
    const lay = (ten, cham) => fetch(ASSET + ten, cham ? { priority: 'low' } : undefined).then((r) => (r.ok ? r.arrayBuffer() : null)).then((ab) => (ab ? dec(c, ab) : null)).catch(() => null);
    const dec = (cc, ab) => new Promise((ok) => { try { const p = cc.decodeAudioData(ab, ok, () => ok(null)); if (p && p.catch) p.catch(() => ok(null)); } catch (e) { ok(null); } });
    // SFX truoc (nho, can ngay); nhac nen (~580 KB) tai SAU ~2,5 s o uu tien thap: khong tranh bang thong voi nhip dau (hinh + phong chu)
    AM.napNhac = new Promise((ok) => setTimeout(ok, 2500)).then(() => lay('nhac-h.mp3', true)).then((b) => { AM.nhac = b; });
    AM.nap = Promise.all(SFX_DS.map((n) => lay('s-' + n + '.mp3').then((b) => { if (b) AM.buf[n] = b; }))).then(() => true);
    return AM.nap;
  }
  function amMo() {
    if (AM.mo) return;
    AM.mo = true;
    const mo = () => {
      AM.mo = false;
      const c = amCtx();
      if (c && c.state === 'suspended') { try { c.resume(); } catch (e) {} }
      if (AM.bat) setTimeout(amBat, 60);
    };
    ['pointerdown', 'keydown', 'touchend'].forEach((n) => document.addEventListener(n, mo, { once: true, capture: true }));
  }
  function amBat() {
    if (!L || AM.mute) return;
    const c = amDo();
    if (!c) return;
    AM.bat = true;
    if (c.state === 'suspended') { try { c.resume(); } catch (e) {} amMo(); }
    amTai().then(() => AM.napNhac).then(() => {
      if (!AM.bat || !AM.nhac || AM.src || AM.mute || !AM.ctx) return;
      const cc = AM.ctx;
      if (cc.state !== 'running') { amMo(); return; }
      const s = cc.createBufferSource();
      s.buffer = AM.nhac; s.loop = true;
      s.connect(AM.nhacG);
      const off = AM.off % AM.nhac.duration;
      s.start(0, off);
      AM.t0 = cc.currentTime - off; AM.src = s;
      const g = AM.nhacG.gain;
      g.cancelScheduledValues(cc.currentTime); g.setValueAtTime(0, cc.currentTime);
      g.linearRampToValueAtTime(AM.duck ? GAM.nhacNoi : GAM.nhacYen, cc.currentTime + 0.9);
      AM.gHienTai = AM.duck ? GAM.nhacNoi : GAM.nhacYen;
    });
  }
  function amTat(fade) {
    AM.bat = false;
    const c = AM.ctx, s = AM.src;
    if (!c || !s) { AM.src = null; return; }
    AM.src = null;
    const f = fade == null ? 0.25 : fade;
    try {
      AM.off = (c.currentTime - AM.t0) % (AM.nhac ? AM.nhac.duration : 58);
      const g = AM.nhacG.gain, t = c.currentTime;
      g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0, t + f);
      s.stop(t + f + 0.02);
    } catch (e) {}
    AM.gHienTai = -1;
  }
  /** Moi khung hinh (ticker GSAP): do muc tieng Sensei (RMS) moi ~50 ms, ha nhac khi noi, tha khi im 280 ms */
  function amTick() {
    const c = AM.ctx, e = engine();
    if (!c || !AM.src || !e) return;
    const now = performance.now();
    if (now - AM.tDo < 48) return;
    AM.tDo = now;
    let mu = 0;
    try { mu = e.getOutputLevel ? e.getOutputLevel() : 0; } catch (er) { mu = 0; }
    const noi = mu > 0.009 || (e.isPlaying && mu > 0.003);
    if (noi) AM.tNoi = now;
    const duck = now - AM.tNoi < 280;
    const dich = duck ? GAM.nhacNoi : GAM.nhacYen;
    if (duck !== AM.duck || AM.gHienTai !== dich) {
      AM.duck = duck; AM.gHienTai = dich;
      try { AM.nhacG.gain.setTargetAtTime(dich, c.currentTime, duck ? 0.06 : 0.35); } catch (er) {}
      AM.log.push({ k: 'duck', duck, mu: +mu.toFixed(4), t: +c.currentTime.toFixed(3), g: dich });
      if (AM.log.length > 400) AM.log.splice(0, 100);
    }
  }
  /** Phat SFX `ten` sau tre giay (cung luc tween chuyen dong bat dau). Khong bao gio doi: chua nap xong -> bo qua. */
  function snd(ten, treS, gain) {
    if (INST || AM.mute || !AM.bat) return;
    const c = AM.ctx, b = AM.buf[ten];
    if (!c || c.state !== 'running' || !b) return;
    const pr = PRIO[ten.replace(/\d+$/, '')] || 1;
    const t = nowG(), dsx = AM.dsSfx;
    for (let i = dsx.length - 1; i >= 0; i--) if (t - dsx[i].t > 1.0) dsx.splice(i, 1);
    const trong = dsx.filter((x) => x.t > t + (treS || 0) - 1.0);
    if (trong.length >= 3 && pr <= Math.min.apply(null, trong.map((x) => x.p))) return;
    dsx.push({ t: t + (treS || 0), p: pr });
    const chay = (e) => {
      try {
        const cc = AM.ctx;
        if (!cc || cc.state !== 'running' || AM.mute || !AM.bat) return;
        const s = cc.createBufferSource();
        s.buffer = b;
        if (gain && gain !== 1) { const g = cc.createGain(); g.gain.value = gain; s.connect(g); g.connect(AM.sfxG); } else s.connect(AM.sfxG);
        s.start(0);
        if (e) { e.bat = +cc.currentTime.toFixed(4); e.lech = +(1000 * (cc.currentTime - e.hinh)).toFixed(1); }
      } catch (er) { AM.loi++; }
    };
    // am thanh bat dau TRONG callback GSAP cua chinh khung bat dau tween -> khong lech so voi hinh (lech = do tre khung -> am)
    const e = AM.log.length < 400 ? { k: 'sfx', ten, tao: +c.currentTime.toFixed(4), hinh: 0 } : null;
    if (e) AM.log.push(e);
    if ((treS || 0) <= 0.001) { if (e) e.hinh = c.currentTime; chay(e); }
    else G.delayedCall(treS, () => { if (e) e.hinh = AM.ctx ? AM.ctx.currentTime : 0; chay(e); });
  }
  function amNut(lop) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'h-am-nut';
    b.setAttribute('aria-label', 'Nhạc nền');
    const cap = () => { b.setAttribute('aria-pressed', AM.mute ? 'false' : 'true'); /* pressed = nhac DANG phat */ b.title = 'Nhạc nền'; b.classList.toggle('is-tat', AM.mute); };
    b.innerHTML = '<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="18" r="2.6" fill="currentColor"/><circle cx="17" cy="16" r="2.6" fill="currentColor"/><path class="h-am-gach" d="M3 3l18 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
    cap();
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      AM.mute = !AM.mute;
      try { localStorage.setItem(KEY_AM, AM.mute ? '1' : '0'); } catch (er) {}
      cap();
      if (AM.mute) amTat(0.15); else amBat();
    });
    lop.insertBefore(b, lop.firstChild);     // thu tu Tab = thu tu doc (nut nhac nam goc tren trai)
    return b;
  }

  // ================================================================== KHUNG, DO CHU, TOA DO
  /** Do khung + goc meo. Doc kich thuoc ep layout (tốn) -> luu cache, chi do lai khi ResizeObserver bao doi co hoac meo hien / an */
  function doKhung(ep) {
    const meoCo = document.body.classList.contains('co-meo');
    if (!ep && st.W && !st.suc && st.meoCo === meoCo) return;
    st.suc = false; st.meoCo = meoCo;
    const k = C.khung();
    st.W = k.w || L.clientWidth || 1;
    st.H = k.h || L.clientHeight || 1;
    st.dt = st.W < 640 || st.W / st.H < 1.2;
    st.ngan = st.W > st.H * 1.2 && st.H < 430;      // dien thoai nam ngang: khong du cao cho ban thiet ke -> nhuong the mac dinh
    st.meo = C.meo();
    if (st.dt) {
      // doc / hep / cua so cao: ban thiet ke 390x679 phong deu theo ti le nho nhat, can giua theo chieu ngang (khong keo meo)
      const su = Math.min(st.W / 390, st.H / 679);
      st.sy = su; st.sx = Math.min(st.W / 390, su * 1.55); st.xo = Math.round((st.W - 390 * st.sx) / 2); st.pf = Math.max(0.8, su);
      // the bai (goc tren phai) co kich thuoc px that (190 x 64): man thap / hep (su < 1) thi noi dung thiet ke (bat dau y = 70) tut len duoi the -> doi xuong theo phan hut
      st.yo = Math.max(0, Math.round(62 * (1 - su)));
      st.hu = 0.62 * st.pf;
    } else {
      // ngang: 1920x1080; man hinh sieu rong (> ~2.4:1) thi khong keo ngang qua 1.38 lan, can giua
      st.sy = st.H / 1080; st.sx = Math.min(st.W / 1920, st.sy * 1.38); st.xo = Math.round((st.W - 1920 * st.sx) / 2); st.pf = 1; st.yo = 0;
      st.hu = Math.min(st.sx, st.sy);
    }
    st.cw1 = st.xo + Math.round((st.dt ? 390 : 1920) * st.sx);
    const hv = st.hu.toFixed(4) + 'px';
    if (st.huS !== hv) { st.huS = hv; L.style.setProperty('--hu', hv); }       // chi ghi khi doi: ghi lai cung gia tri van lam mat hieu luc kieu ca cay
    if (st.dt && L.dataset.hep !== '1') L.dataset.hep = '1'; else if (!st.dt && L.dataset.hep) delete L.dataset.hep;
  }
  /** rect thiet ke (1920x1080 hoac 390x679 tren dien thoai) -> px that */
  function px(r) {
    if (!r) return null;
    const x = Math.round(r.x * st.sx + st.xo), y = Math.round(r.y * st.sy + (st.yo || 0));
    return { x, y, w: Math.round((r.x + r.w) * st.sx + st.xo) - x, h: Math.round((r.y + r.h) * st.sy + (st.yo || 0)) - y };
  }
  const R = (x, y, w, h) => ({ x, y, w, h });
  /** chon rect theo man hinh: {d, p}; ghi de theo bai (pos) neu co */
  function RC(ten, tab) {
    let r = st.dt ? tab.p : tab.d;
    if (r && r.x == null) r = r[ten];
    return px(ovPos(ten, r));
  }
  function dat(e, r) {
    e.style.left = r.x + 'px'; e.style.top = r.y + 'px';
    if (r.w != null) e.style.width = r.w + 'px';
    if (r.h != null) e.style.height = r.h + 'px';
    return e;
  }
  const mk = (tag, cls, cha, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (cha) cha.appendChild(e); return e; };

  /**
   * Co chu lon nhat (px nguyen) trong [min, max] de `html` vua khung w x h. cls: lop vai chu (css .h-r-<vai>) — do bang DOM that.
   * o: lh (line-height), nowrap, lines (toi da dong), strict (khong vua o min -> tra 0)
   */
  const FIT = { n: 0, ms: 0, cv: 0 };
  // ---- do chu bang canvas measureText (nhanh, khong dung layout): rong o 100 px nho theo (vai, chu), ti le tuyen tinh theo co chu
  const FONT_VAI = {
    'h-r-kanji': '900 {s}px "Zen Maru Gothic","Yu Gothic",sans-serif', 'h-r-tile': '900 {s}px "Zen Maru Gothic","Yu Gothic",sans-serif', 'h-r-tt': '900 {s}px "Zen Maru Gothic","Yu Gothic",sans-serif',
    'h-r-ruby': '700 {s}px "Zen Maru Gothic","Yu Gothic",sans-serif', 'h-r-cau': '900 {s}px Nunito,"Zen Maru Gothic","Yu Gothic",sans-serif',
    'h-r-nghia': '900 {s}px Nunito,"Zen Maru Gothic",sans-serif', 'h-r-phu': '700 {s}px Nunito,"Zen Maru Gothic",sans-serif', 'h-r-dan': '800 {s}px Nunito,"Zen Maru Gothic",sans-serif',
    'h-r-ro': '800 {s}px Nunito,sans-serif', 'h-r-form': '900 {s}px Nunito,"Zen Maru Gothic",sans-serif', 'h-r-tieude': '900 {s}px Nunito,"Zen Maru Gothic",sans-serif',
    'h-r-bai': '900 {s}px Nunito,sans-serif', 'h-r-chip': '700 {s}px Nunito,"Zen Maru Gothic",sans-serif', 'h-r-chipv': '700 {s}px Nunito,"Zen Maru Gothic",sans-serif',
    'h-r-ruyc': '900 {s}px Nunito,"Zen Maru Gothic",sans-serif',
  };
  let CVX = null;
  const W100 = new Map();
  function vaiCls(cls) { const m = /h-r-[a-z]+/.exec(cls || ''); return m && FONT_VAI[m[0]] ? m[0] : 'h-r-phu'; }
  /** rong (px) cua chu `txt` o co chu fs theo vai (khong xuong dong) */
  function rongChu(txt, cls, fs) {
    const v = vaiCls(cls), k = v + '|' + txt;
    let w = W100.get(k);
    if (w == null) {
      if (!CVX) CVX = document.createElement('canvas').getContext('2d');
      CVX.font = FONT_VAI[v].replace('{s}', '100');
      w = CVX.measureText(txt).width;
      // manh phong chua tai (canvas do bang phong du phong, hep hon Zen Maru): uoc TREN (chu Nhat 1 em, chu khac 0,62 em), khong luu cache
      let sanSang = true;
      try { sanSang = !document.fonts || document.fonts.check(CVX.font, txt); } catch (e) { sanSang = true; }
      if (!sanSang) { FIT.cv++; return Math.max(w, kyTu(txt).reduce((a, ch) => a + (RE_JP.test(ch) || /[　-ヿ＀-￯]/.test(ch) ? 100 : 62), 0)) * fs / 100; }
      if (W100.size > 4000) W100.clear();
      W100.set(k, w); FIT.cv++;
    }
    return w * fs / 100;
  }
  /** Net chu that cua `txt` (font o chu, do o 100 px), em: { asc, desc: net len / xuong so voi duong co so; bo: duong co so thap hon tam dong chu (line-height 1,12) }.
   *  Dung cho o chu om net (xepO): chu det (っ, つ, ー) khong nam trong o 1,5 x 1,62 em (probe SPARSE). Phong chua tai: uoc, khong luu cache. */
  const INK100 = new Map();
  const KANA_NHO = /^[ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮー・]+$/;
  function inkTile(txt) {
    let r = INK100.get(txt);
    if (r) return r;
    if (!CVX) CVX = document.createElement('canvas').getContext('2d');
    CVX.font = FONT_VAI['h-r-tile'].replace('{s}', '100');
    let san = true;
    try { san = !document.fonts || document.fonts.check(CVX.font, txt); } catch (e) { san = true; }
    let m = null;
    try { m = CVX.measureText(txt); } catch (e) { m = null; }
    const asc = m ? m.actualBoundingBoxAscent : 0, desc = m ? m.actualBoundingBoxDescent : 0, fa = m ? m.fontBoundingBoxAscent : 0, fd = m ? m.fontBoundingBoxDescent : 0;
    if (!san || !(asc + desc > 0) || !(fa + fd > 0)) return KANA_NHO.test(txt) ? { asc: 0.5, desc: 0.04, bo: 0.435 } : { asc: 0.82, desc: 0.06, bo: 0.435 };
    r = { asc: asc / 100, desc: desc / 100, bo: ((112 - (fa + fd)) / 2 + fa - 56) / 100 };
    if (INK100.size > 2000) INK100.clear();
    INK100.set(txt, r);
    return r;
  }
  /** So dong khi xuong dong theo tu trong hop rong w (CJK ngat o bat ky ky tu nao) */
  function soDong(txt, cls, fs, w) {
    const parts = String(txt).split(/(\s+)/);
    const sp = rongChu(' ', cls, fs);
    let lines = 1, cur = 0;
    for (const p of parts) {
      if (!p) continue;
      if (/^\s+$/.test(p)) { cur += sp; continue; }
      const pw = rongChu(p, cls, fs);
      if (pw > w) {                           // tu dai hon hop: ngat theo ky tu
        const cw = pw / Math.max(1, kyTu(p).length);
        const per = Math.max(1, Math.floor(w / cw));
        if (cur > 0) { lines++; cur = 0; }
        const n = Math.ceil(kyTu(p).length / per);
        lines += n - 1; cur = pw - (n - 1) * per * cw;
        continue;
      }
      if (cur + pw > w + 0.5 && cur > 0) { lines++; cur = pw; } else cur += pw;
    }
    return lines;
  }
  function fit(html, o) {
    const t0_ = performance.now();
    try { return o.txt != null ? fitCv(o) : fit_(html, o); } finally { FIT.n++; FIT.ms += performance.now() - t0_; }
  }
  function fitCv(o) {
    const W = Math.max(20, o.w * 0.97 - 3);
    const lh = o.lh || 1.15;
    const ok = (fs) => {
      if (o.nowrap) return rongChu(o.txt, o.cls, fs) <= W && fs * lh <= o.h * 0.99;
      const n = soDong(o.txt, o.cls, fs, W);
      return n * fs * lh <= o.h * 0.99 && (!o.lines || n <= o.lines);
    };
    let lo = Math.max(1, Math.ceil(o.min)), hi = Math.max(lo, Math.floor(o.max));
    if (!ok(lo)) return o.strict ? 0 : lo;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (ok(mid)) lo = mid; else hi = mid - 1; }
    return lo;
  }
  function fit_(html, o) {
    const m = st.mesur;
    if (!m) return Math.floor(o.min);
    m.className = 'h-mesur ' + (o.cls || '');
    const W = Math.max(20, Math.round(o.w * 0.985 - 2));
    const lh = o.lh || 1.15;
    m.style.width = W + 'px';
    m.style.lineHeight = String(lh);
    m.style.whiteSpace = o.nowrap ? 'nowrap' : 'normal';
    m.innerHTML = html;
    const ok = (fs) => {
      m.style.fontSize = fs + 'px';
      return m.scrollHeight <= o.h * 0.99 && m.scrollWidth <= W + 1 && (!o.lines || Math.round(m.scrollHeight / (fs * lh)) <= o.lines);
    };
    let lo = Math.max(1, Math.ceil(o.min)), hi = Math.max(lo, Math.floor(o.max));
    if (!ok(lo)) return o.strict ? 0 : lo;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (ok(mid)) lo = mid; else hi = mid - 1; }
    return lo;
  }
  /** Be ngang tu nhien (px) cua html o co chu fs (1 dong) */
  function rongTuNhien(html, cls, fs, txt) {
    if (txt != null) return rongChu(txt, cls, fs);
    const m = st.mesur;
    m.className = 'h-mesur ' + (cls || '');
    m.style.width = 'auto'; m.style.whiteSpace = 'nowrap'; m.style.fontSize = fs + 'px'; m.style.lineHeight = '1.2';
    m.innerHTML = html;
    return m.scrollWidth;
  }
  /** Co chu cho `text` (khong html) theo vai: tra { fs, text } — rut gon theo tu neu can (cat) */
  function coVua(vai, text, w, h, o) {
    o = o || {};
    const tk = T(vai);
    const lh = o.lh || 1.15;
    const cls = 'h-r-' + (o.cls || vai);
    // o.max: tran co chu cua noi dung nay — CHO PHEP cao hon max cua vai (nghia ngan x1,4, am doc x1,6...: truoc day Math.min(..., tk.max) lam cac he so > 1 vo tac dung,
    // chu ngan nam tron trong o to, thua cho). Van tu vua khung (fit) nen khong bao gio tran.
    const max = Math.max(o.max || tk.max, tk.min), min = Math.min(o.min || tk.min, max);
    let txt = String(text == null ? '' : text), fs = 0;
    // san tuyet doi (14 px may tinh / 13 px dien thoai): noi dung bai KHONG bi cat (…) khi ha co chu xuong san van vua — chi cat khi sat san van tran
    // (truoc day: khong vua o co toi thieu cua vai -> cat 15 % moi vong du khung con cho: 'To lớn. Hình người…', 'Kết quả trái…')
    const san = st.dt ? 13 : 14, min2 = Math.min(min, san);
    for (let i = 0; i < 9; i++) {
      const html = o.html != null ? o.html : (o.jpx ? jp(txt) : esc(txt));
      const cat = !!(o.cat && o.html == null);
      fs = fit(html, { w, h, max, min, lh, cls, nowrap: o.nowrap, lines: o.lines, strict: cat, txt: o.html == null ? txt : null });
      if (!fs && cat) fs = fit(html, { w, h, max: Math.max(min, min2), min: min2, lh, cls, nowrap: o.nowrap, lines: o.lines ? o.lines + 3 : o.lines, strict: true, txt });
      if (fs || !o.cat || o.html != null) break;
      txt = nganTu(txt, Math.max(10, Math.floor(kyTu(txt).length * 0.85)));
    }
    if (!fs) fs = Math.ceil(min);
    return { fs, text: txt };
  }
  /** Chu bi cat boi coVua (uoc bang canvas lech DOM) nhung do bang DOM that o co chu san van vua w x h -> tra { fs, text } day du; khong thi null */
  function cuuChu(text, w, h, lh) {
    const san = st.dt ? 13 : 14;
    return caoNoiDung('<div class="h-r-phu" style="font-size:' + san + 'px;line-height:' + (lh || LH_VJ) + '">' + jp(String(text)) + '</div>', w) <= h + 2 ? { fs: san, text: String(text) } : null;
  }
  /** Bao ve goc meo that: be ngang can tru (px that) cua hop rect r khi cham goc meo */
  function meoChong(r) {
    if (!st.meo || !r) return 0;
    return r.y + r.h > st.meo.y && r.x + r.w > st.meo.x ? Math.round(r.x + r.w - st.meo.x + 8) : 0;
  }

  const QS = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(''); } })();
  const DRIFT = QS.get('hDrift') !== '0';
  // ================================================================== DIORAMA (lop nen parallax, ve 1 lan bang canvas -> anh lap)
  function rng(seed) {
    let a = seed | 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  let VAN = null, VAN_XONG = false;
  /**
   * Van giay: chen MOT style rieng, chep cac quy tac cua h.css co var(--h-van) voi url(data:...) viet thang.
   * (var() chua data URL ~100 KB bi phan giai lai o MOI phan tu: ~45 ms moi canh; viet thang chi phan giai 1 lan/quy tac — do bang perf)
   */
  function vanCss() {
    if (VAN_XONG) return;
    const link = document.querySelector('link[data-che-do-css="h"]');
    const sh = link && link.sheet;
    if (!sh) return;
    const url = vanGiay();
    if (!url) return;
    let rules;
    try { rules = Array.from(sh.cssRules); } catch (e) { return; }
    const out = [];
    rules.forEach((r) => { if (r.type === 1 && r.cssText.indexOf('var(--h-van)') >= 0) out.push(r.cssText.replace(/var\(--h-van\)/g, 'url("' + url + '")')); });
    const el = document.createElement('style');
    el.dataset.cheDoH = 'van';
    el.textContent = out.join(String.fromCharCode(10));
    document.head.appendChild(el);
    VAN_XONG = true;
  }
  function vanGiay() {
    if (VAN) return VAN;
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const g = cv.getContext('2d');
    const id = g.createImageData(256, 256);
    const r = rng(77);
    // lop van giay = den trong suot (alpha = 1 - v/255, tuong duong nhan voi xam v nhung KHONG dung background-blend-mode: re hon khi ve)
    for (let i = 0; i < 256 * 256; i++) {
      const v = 242 + Math.floor((r() - 0.5) * 22);
      id.data[i * 4] = 70; id.data[i * 4 + 1] = 52; id.data[i * 4 + 2] = 36; id.data[i * 4 + 3] = Math.round((1 - v / 255) * 255);
    }
    g.putImageData(id, 0, 0);
    g.lineCap = 'round';
    for (let k = 0; k < 90; k++) {
      const x = r() * 256, y = r() * 256, a = r() * Math.PI * 2, l = 6 + r() * 22;
      g.strokeStyle = r() < 0.5 ? 'rgba(120,90,60,.10)' : 'rgba(255,255,255,.16)';
      g.lineWidth = 0.6 + r() * 0.8;
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a + 0.5) * l * 0.5, y + Math.sin(a + 0.5) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
    try { VAN = cv.toDataURL('image/png'); } catch (e) { VAN = ''; }
    return VAN;
  }
  function hamSong(seed, base, song, Wd) {
    const r = rng(seed);
    const ph = song.map(() => r() * Math.PI * 2);
    const per = song.map((s) => Wd / Math.max(1, Math.round(Wd / s[1])));
    return (x) => { let y = base; for (let i = 0; i < song.length; i++) y += song[i][0] * Math.sin(x / per[i] * Math.PI * 2 + ph[i]); return y; };
  }
  function duongDoi(x0, x1, fn, buoc) {
    x0 = Math.floor(x0 / buoc) * buoc;
    let d = 'M' + x0 + ',1400 L' + x0 + ',' + fn(x0).toFixed(1);
    for (let x = x0; x <= x1 + buoc; x += buoc) d += ' L' + (x + buoc).toFixed(1) + ',' + fn(x + buoc).toFixed(1);
    return d + ' L' + (x1 + buoc) + ',1400 Z';
  }
  function duongVien(x0, x1, fn, buoc) {
    x0 = Math.floor(x0 / buoc) * buoc;
    let d = 'M' + x0 + ',' + fn(x0).toFixed(1);
    for (let x = x0 + buoc; x <= x1; x += buoc) d += ' L' + x.toFixed(1) + ',' + fn(x).toFixed(1);
    return d;
  }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function tron(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  const P2 = (d) => new Path2D(d);
  // ---- cac hinh (ve tren ctx da co bien doi thiet ke)
  function veMay(g, x, y, s, r) {
    g.save(); g.translate(x, y); g.scale(s, s);
    const n = 3 + Math.floor(r() * 2), w = 260;
    g.fillStyle = '#fdf8ef'; rr(g, 0, -10, w, 46, 23); g.fill();
    for (let i = 0; i < n; i++) { const cx = 40 + i * (w - 80) / (n - 1), cr = 34 + r() * 30; tron(g, cx, 8 - cr * 0.45, cr); }
    g.fillStyle = 'rgba(200,160,120,.25)'; rr(g, 18, 26, w - 36, 6, 3); g.fill();
    g.restore();
  }
  function vePhuSi(g, cx, base, s) {
    const w = 560 * s, h = 300 * s, top = base - h, sy = top + 95 * s;
    g.fillStyle = '#c9a2a0';
    g.fill(P2('M' + (cx - w) + ',' + (base + 40) + ' C' + (cx - w * 0.55) + ',' + (base - h * 0.25) + ' ' + (cx - w * 0.22) + ',' + (top + 12) + ' ' + (cx - 60 * s) + ',' + top +
      ' L' + (cx + 60 * s) + ',' + top + ' C' + (cx + w * 0.22) + ',' + (top + 12) + ' ' + (cx + w * 0.55) + ',' + (base - h * 0.25) + ' ' + (cx + w) + ',' + (base + 40) + ' Z'));
    g.fillStyle = '#fbf4ea';
    g.fill(P2('M' + (cx - 60 * s) + ',' + top + ' L' + (cx + 60 * s) + ',' + top + ' C' + (cx + 110 * s) + ',' + (top + 30 * s) + ' ' + (cx + 150 * s) + ',' + (sy - 30 * s) + ' ' + (cx + 175 * s) + ',' + sy +
      ' L' + (cx + 120 * s) + ',' + (sy - 18 * s) + ' L' + (cx + 80 * s) + ',' + (sy + 8 * s) + ' L' + (cx + 30 * s) + ',' + (sy - 22 * s) + ' L' + (cx - 20 * s) + ',' + (sy + 10 * s) +
      ' L' + (cx - 70 * s) + ',' + (sy - 20 * s) + ' L' + (cx - 115 * s) + ',' + (sy + 4 * s) + ' L' + (cx - 175 * s) + ',' + sy + ' C' + (cx - 150 * s) + ',' + (sy - 30 * s) + ' ' + (cx - 110 * s) + ',' + (top + 30 * s) + ' ' + (cx - 60 * s) + ',' + top + ' Z'));
  }
  function veThap(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    [[70, 0], [58, -46], [46, -88], [34, -124]].forEach((tg) => {
      const w = tg[0], yy = tg[1];
      g.fillStyle = '#b37457'; g.fillRect(-w * 0.36, yy - 30, w * 0.72, 32);
      g.fillStyle = '#8f5641';
      g.fill(P2('M' + (-w) + ',' + (yy - 26) + ' Q0,' + (yy - 52) + ' ' + w + ',' + (yy - 26) + ' L' + (w * 0.7) + ',' + (yy - 18) + ' L' + (-w * 0.7) + ',' + (yy - 18) + ' Z'));
    });
    g.fillStyle = '#8f5641'; g.fillRect(-3, -190, 6, 40);
    g.restore();
  }
  function veCayNon(g, x, y, s, r) {
    const mau = ['#7f9564', '#94a36d', '#a8a86e'][Math.floor(r() * 3)];
    const h = 120 * s, w = 44 * s;
    g.fillStyle = mau; g.fill(P2('M' + x + ',' + (y - h) + ' L' + (x + w) + ',' + y + ' L' + (x - w) + ',' + y + ' Z'));
    g.fillStyle = 'rgba(40,50,20,.14)'; g.fill(P2('M' + x + ',' + (y - h) + ' L' + (x + w) + ',' + y + ' L' + x + ',' + y + ' Z'));
  }
  function veCayTron(g, x, y, s, r) {
    const mau = ['#6b8a5e', '#7d9a66', '#d6a94a', '#c96442', '#5f7f52'][Math.floor(r() * 5)];
    const rad = 38 * s, th = 60 * s;
    g.fillStyle = '#7b5236'; g.fillRect(x - 5 * s, y - th, 10 * s, th);
    g.fillStyle = mau; tron(g, x, y - th - rad * 0.6, rad);
    g.fillStyle = 'rgba(30,30,10,.13)';
    g.fill(P2('M' + (x - rad * 0.1) + ',' + (y - th - rad * 1.6) + ' A' + rad + ',' + rad + ' 0 0 1 ' + (x - rad * 0.1) + ',' + (y - th + rad * 0.4) + ' Z'));
  }
  /** Lop ve bang 2 canvas: tmp (nhom) -> chinh voi 2 bong (mem + sat), giong bo loc SVG cua ban mau */
  function veNhom(main, tmp, k, mau, sd, dy, op, ve) {
    const g = tmp.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, tmp.width, tmp.height);
    g.setTransform(k, 0, 0, k, 0, 0);
    ve(g);
    main.save();
    main.setTransform(1, 0, 0, 1, 0, 0);
    main.shadowColor = mau; main.shadowBlur = sd * 2 * k; main.shadowOffsetY = dy * k;
    main.globalAlpha = 1;
    main.drawImage(tmp, 0, 0);
    main.shadowColor = 'rgba(58,32,12,.26)'; main.shadowBlur = 1.6 * 2 * k; main.shadowOffsetY = 0;
    main.drawImage(tmp, 0, 0);
    main.shadowColor = 'transparent'; main.shadowBlur = 0;
    main.drawImage(tmp, 0, 0);
    main.restore();
  }
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
  /** Dinh nghia tung lop: ve(main, tmp, k) len canvas (k = px/diem thiet ke) */
  function dinhNghiaLop(Wd) {
    const ve3 = (g, fn) => { fn(g, 0); fn(g, Wd); fn(g, -Wd); };       // ve them ban sao +-Wd cho cac hinh giao mep vien (lap lien tuc)
    return {
      mattroi(main, tmp, k) {
        veNhom(main, tmp, k, rgba('#8a4a18', 0.25), 10, 4, 1, (g) => {
          g.fillStyle = '#f7dc9c'; tron(g, 1640, 330, 205);
          g.fillStyle = '#f1c56e'; tron(g, 1640, 330, 160);
          g.fillStyle = '#e8a94a'; tron(g, 1640, 330, 118);
        });
        main.save(); main.setTransform(k, 0, 0, k, 0, 0);
        main.strokeStyle = 'rgba(255,255,255,.35)'; main.lineWidth = 3; main.setLineDash([4, 14]);
        main.beginPath(); main.arc(1640, 330, 118, 0, Math.PI * 2); main.stroke();
        main.restore();
      },
      may(main, tmp, k) {
        const r = rng(31), may = [];
        for (let x = 120; x < Wd; x += 520 + r() * 360) { const y = 120 + r() * 300, s = 0.7 + r() * 0.6; may.push([x, y, s, r() ]); }
        veNhom(main, tmp, k, rgba('#8a5a30', 0.22), 8, 6, 1, (g) => {
          may.forEach((m, i) => ve3(g, (gg, off) => { const rr2 = rng(900 + i); veMay(gg, m[0] + off, m[1], m[2], rr2); }));
        });
      },
      nui1(main, tmp, k) {
        const f = hamSong(11, 560, [[34, 980], [20, 430], [8, 170]], Wd);
        veNhom(main, tmp, k, rgba('#7a4a28', 0.30), 12, -3, 1, (g) => {
          vePhuSi(g, 1540, 560, 1.0); vePhuSi(g, 100, 575, 0.85); vePhuSi(g, 100 + Wd, 575, 0.85); vePhuSi(g, 1540 - Wd, 560, 1.0);
          g.fillStyle = '#e3c3a3'; g.fill(P2(duongDoi(-200, Wd + 200, f, 30)));
        });
        main.save(); main.setTransform(k, 0, 0, k, 0, 0);
        main.strokeStyle = 'rgba(255,248,235,.55)'; main.lineWidth = 3; main.stroke(P2(duongVien(-200, Wd + 200, f, 30)));
        main.restore();
      },
      nui2(main, tmp, k) {
        const f = hamSong(12, 640, [[30, 760], [16, 320], [6, 120]], Wd);
        const r = rng(55), nha = [];
        for (let x = 700; x < Wd; x += 1300 + r() * 900) nha.push([x, 0.8 + r() * 0.3]);
        veNhom(main, tmp, k, rgba('#6a3a1c', 0.32), 12, -3, 1, (g) => {
          nha.forEach((n) => ve3(g, (gg, off) => veThap(gg, n[0] + off, f(n[0] + off) + 14, n[1])));
          g.fillStyle = '#d4a684'; g.fill(P2(duongDoi(-200, Wd + 200, f, 30)));
        });
        main.save(); main.setTransform(k, 0, 0, k, 0, 0);
        main.strokeStyle = 'rgba(255,240,220,.45)'; main.lineWidth = 3; main.stroke(P2(duongVien(-200, Wd + 200, f, 30)));
        main.restore();
      },
      doi1(main, tmp, k) {
        const f = hamSong(13, 722, [[26, 640], [13, 270]], Wd);
        const r = rng(66), cay = [];
        for (let x = 60; x < Wd; x += 70 + r() * 190) cay.push([x, 0.7 + r() * 0.6, rng(Math.floor(r() * 1e6))]);
        veNhom(main, tmp, k, rgba('#4a3a18', 0.33), 11, -3, 1, (g) => {
          cay.forEach((c) => ve3(g, (gg, off) => veCayNon(gg, c[0] + off, f(c[0] + off) + 12, c[1], rng(Math.floor(c[0] * 7)))));
          g.fillStyle = '#b9b98a'; g.fill(P2(duongDoi(-200, Wd + 200, f, 26)));
        });
        main.save(); main.setTransform(k, 0, 0, k, 0, 0);
        main.strokeStyle = 'rgba(255,255,230,.4)'; main.lineWidth = 3; main.stroke(P2(duongVien(-200, Wd + 200, f, 26)));
        main.restore();
      },
      doi2(main, tmp, k) {
        const f = hamSong(14, 800, [[28, 760], [14, 330]], Wd);
        const r = rng(88), cay = [];
        for (let x = 80; x < Wd; x += 110 + r() * 260) cay.push([x, 0.75 + r() * 0.55]);
        veNhom(main, tmp, k, rgba('#33301a', 0.36), 12, -4, 1, (g) => {
          cay.forEach((c) => ve3(g, (gg, off) => veCayTron(gg, c[0] + off, f(c[0] + off) + 14, c[1], rng(Math.floor(c[0] * 13)))));
          g.fillStyle = '#90a677'; g.fill(P2(duongDoi(-200, Wd + 200, f, 26)));
        });
        main.save(); main.setTransform(k, 0, 0, k, 0, 0);
        main.strokeStyle = 'rgba(240,255,220,.35)'; main.lineWidth = 3; main.stroke(P2(duongVien(-200, Wd + 200, f, 26)));
        main.restore();
      },
      truoc(main, tmp, k) {
        const f5 = hamSong(15, 900, [[16, 640], [8, 240]], Wd);
        const r = rng(99), hoa = [];
        for (let x = 30; x < Wd; x += 60 + r() * 150) {
          const mau = ['#e8b24f', '#f3ead9', '#d9704d', '#f0c7a8'][Math.floor(r() * 4)];
          hoa.push([x, f5(x) + 26 + r() * 70, 5 + r() * 5, mau]);
        }
        const co = (a, b) => {
          const st2 = 16, xa = Math.floor(a / st2) * st2;
          let d = 'M' + xa + ',1400';
          for (let x = xa; x <= b + st2; x += st2) {
            const h = 6 + 16 * Math.abs(Math.sin(x * 12.9898) * Math.sin(x * 0.0713 + 1.7));
            d += ' L' + x + ',' + f5(x).toFixed(1) + ' L' + (x + st2 / 2) + ',' + (f5(x + st2 / 2) - h).toFixed(1);
          }
          return d + ' L' + (Math.floor(b / st2) * st2 + 2 * st2) + ',1400 Z';
        };
        veNhom(main, tmp, k, rgba('#1f2a12', 0.42), 14, -5, 1, (g) => { g.fillStyle = '#5d7a4e'; g.fill(P2(co(-200, Wd + 200))); });
        main.save(); main.setTransform(k, 0, 0, k, 0, 0);
        main.globalAlpha = 0.6; main.fillStyle = '#557147'; main.fill(P2(duongDoi(-200, Wd + 200, (x) => f5(x) + 60, 40)));
        main.globalAlpha = 1;
        hoa.forEach((h) => [0, Wd, -Wd].forEach((off) => {
          main.fillStyle = h[3]; tron(main, h[0] + off, h[1], h[2]);
          main.fillStyle = 'rgba(90,50,20,.45)'; tron(main, h[0] + off, h[1], h[2] * 0.38);
        }));
        main.restore();
      },
    };
  }
  // cache anh lop (module): key theo kich thuoc -> { ten: blobUrl }
  const LOP_ANH = { key: '', url: Object.create(null), cho: Object.create(null) };
  // do phan giai lop nen (lop xa mem nen ve it diem hon: nhanh + nhe bo nho; lop gan sac net)
  const QUAL = { mattroi: 0.4, may: 0.5, nui1: 0.55, nui2: 0.65, doi1: 0.8, doi2: 0.9, truoc: 1 };
  function taoLopAnh(ten, k, dpr) {
    const Wd = TILE_D;
    dpr = dpr * (QUAL[ten] || 1);
    const w = Math.max(64, Math.round(Wd * k * dpr)), h = Math.max(64, Math.round(1080 * k * dpr));
    const main = document.createElement('canvas'); main.width = w; main.height = h;
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
    const g = main.getContext('2d');
    g.setTransform(k * dpr, 0, 0, k * dpr, 0, 0);
    const def = dinhNghiaLop(Wd)[ten];
    def(g, tmp, k * dpr);
    return new Promise((ok) => main.toBlob((b) => ok(b ? URL.createObjectURL(b) : null), 'image/png'));
  }
  function dungNen() {
    const k = st.H / 1080;                       // thang thong nhat theo chieu cao (khong meo hinh)
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const key = Math.round(k * 1000) + ':' + dpr;
    if (LOP_ANH.key !== key) {
      // doi co: thu hoi cac blob PNG cua co cu (truoc day moi co moi giu them ~7 blob / 0,9 MB cho toi khi tai lai trang)
      Object.keys(LOP_ANH.url).forEach((t) => { const u = LOP_ANH.url[t]; if (u) { try { URL.revokeObjectURL(u); } catch (e) { /* bo qua */ } } });
      LOP_ANH.key = key; LOP_ANH.url = Object.create(null); LOP_ANH.cho = Object.create(null);
    }
    const tilePx = Math.round(TILE_D * k);
    const out = [];
    const them = (ten, f, z) => {
      const el = mk('div', 'h-lop h-l-' + ten, L);
      el.style.zIndex = z;
      if (ten === 'truoc' && st.dt) el.style.top = Math.round(st.H * 0.09) + 'px';     // dien thoai: ha co truoc xuong de de cho cho noi dung
      el.style.width = (tilePx + st.W + 4) + 'px';
      el.style.backgroundSize = tilePx + 'px ' + st.H + 'px';
      const info = { el, f, tile: tilePx, ten };
      const gan = (u) => { if (u && info.el.isConnected) { info.el.style.backgroundImage = 'url(' + u + ')'; G.to(info.el, { opacity: 1, duration: giam() ? 0.01 : 0.35, ease: 'none', overwrite: 'auto' }); } };
      if (LOP_ANH.url[ten]) gan(LOP_ANH.url[ten]);
      else if (LOP_ANH.cho[ten]) LOP_ANH.cho[ten].then(gan);      // dang ve san luc ranh (veSanNen): gan ngay khi xong, khong doi them
      else {
        // moi lop ve o mot khung rieng (cach nhau 0.25 s): khong don mot cu giat o nhip dau
        const idx = out.length;
        G.delayedCall(0.1 + 0.18 * idx, () => {
          if (!L) return;     // che do da tat (dung giang som): khong ve / ma hoa PNG nua
          if (!LOP_ANH.cho[ten]) LOP_ANH.cho[ten] = taoLopAnh(ten, k, dpr).then((u) => { if (LOP_ANH.key === key) LOP_ANH.url[ten] = u; else if (u) { try { URL.revokeObjectURL(u); } catch (e) { /* bo qua */ } return null; } return u; });
          LOP_ANH.cho[ten].then(gan);
        });
      }
      out.push(info);
      return info;
    };
    if (QS.get('hLop') !== '0') F_LOP.forEach(([ten, f], i) => them(ten, f, 2 + i));
    st.lop = out;
    return them;
  }
  /** Ve SAN cac lop nen (PNG) luc ranh, khi trang bai dang mo nhung chua giang: san khau luc giang co DUNG kich thuoc .deck-canvas (1440x776 / 390x679),
   *  nen khung dau tien cua buoi giang da co canh nui doi — truoc day phai doi 0,2-2 s ve + ma hoa tung lop (san khau chi la nen gradient + canh tieu de) */
  const PRE = { n: 0 };
  function veSanNen() {
    if (QS.get('hLop') === '0' || document.hidden || L) return;     // L: san khau dang chay (dungNen lo)
    const dc = document.querySelector('.deck-canvas'), H = dc ? dc.clientHeight : 0;
    if (!(H > 200)) { if (PRE.n++ < 6) setTimeout(veSanNen, 3000); return; }
    const k = H / 1080, dpr = Math.min(window.devicePixelRatio || 1, 1.5), key = Math.round(k * 1000) + ':' + dpr;
    if (LOP_ANH.key !== key) {
      Object.keys(LOP_ANH.url).forEach((t) => { const u = LOP_ANH.url[t]; if (u) { try { URL.revokeObjectURL(u); } catch (e) { /* bo qua */ } } });
      LOP_ANH.key = key; LOP_ANH.url = Object.create(null); LOP_ANH.cho = Object.create(null);
    }
    const ds = F_LOP.map((x) => x[0]).concat(['truoc']).filter((t) => !LOP_ANH.cho[t] && !LOP_ANH.url[t]);
    const ranh = (f) => { try { if (window.requestIdleCallback) window.requestIdleCallback(f, { timeout: 2000 }); else setTimeout(f, 150); } catch (e) { setTimeout(f, 150); } };
    let i = 0;
    const buoc = () => {
      if (L || i >= ds.length || LOP_ANH.key !== key) return;
      const t = ds[i++];
      if (!LOP_ANH.cho[t] && !LOP_ANH.url[t]) LOP_ANH.cho[t] = taoLopAnh(t, k, dpr).then((u) => { if (LOP_ANH.key === key) LOP_ANH.url[t] = u; else if (u) { try { URL.revokeObjectURL(u); } catch (e) { /* bo qua */ } return null; } return u; });
      ranh(buoc);
    };
    ranh(buoc);
  }
  /** Dung (lai) lop nen khi kich thuoc san khau doi — batDau chua biet kich thuoc cuoi, nen dung o nhip dau */
  function nenLai(ep) {
    doKhung(ep);
    if (st.nenW === st.W && st.nenH === st.H && st.lop && st.lop.length) return;
    Array.from(L.querySelectorAll(':scope > .h-lop')).forEach((e) => e.remove());
    const them = dungNen();
    if (QS.get('hLop') !== '0') them('truoc', F_TRUOC, 15);
    st.nenW = st.W; st.nenH = st.H;
    apCam();
  }
  let camBan = false;
  const camSujo = () => { camBan = true; };
  const camTick = () => { if (camBan && L) { camBan = false; apCam(); } };
  function apCam() {
    const cx = st.cam.x, cy = st.cam.y;
    for (let i = 0; i < st.lop.length; i++) {
      const l = st.lop[i];
      let ox = cx * l.f;
      ox = ((ox % l.tile) + l.tile) % l.tile;
      l.el.style.transform = 'translate3d(' + (-ox).toFixed(2) + 'px,' + (cy * l.f).toFixed(2) + 'px,0)';
    }
    if (st.mundo) st.mundo.style.transform = 'translate3d(' + (-cx).toFixed(2) + 'px,' + cy.toFixed(2) + 'px,0)';
  }
  /** Truot may quay toi canh k (giay): power2.inOut 1.0 s; sau do troi nhe sang phai (dolly), len xuong nhe */
  function camToi(k, nhanh, dau) {
    if (!L || !G) return;     // che do da tat (dung giang trong 0,7 s dau): khong dat tween may quay mo coi
    const x1 = k * st.W;
    G.killTweensOf(st.cam);
    if (nhanh || giam()) {
      st.cam.x = x1 - troiPx(); st.cam.y = 0;
      apCam();
      if (!giam() && DRIFT) {
        G.to(st.cam, { x: x1 + troiPx(), duration: 14, ease: 'none', onUpdate: camSujo });
        G.fromTo(st.cam, { y: 0 }, { y: -9, duration: 12, ease: 'sine.inOut', onUpdate: camSujo });
      }
      return;
    }
    if (dau) {
      // mo dau: may quay ha xuong (crane) — cac lop truot len voi toc do khac nhau
      st.cam.x = x1 - troiPx(); st.cam.y = CAM.crane;
      apCam();
      G.to(st.cam, { y: 0, duration: CAM.craneDur, ease: 'power2.out', onUpdate: camSujo });
      if (DRIFT) G.to(st.cam, { x: x1 + troiPx(), duration: 14, ease: 'none', onUpdate: camSujo });
      if (DRIFT) G.to(st.cam, { y: -9, duration: 12, ease: 'sine.inOut', delay: CAM.craneDur, onUpdate: camSujo });
      return;
    }
    G.to(st.cam, { x: x1 - troiPx(), duration: CAM.dur, ease: CAM.ease, onUpdate: camSujo });
    G.to(st.cam, { y: 0, duration: CAM.dur, ease: CAM.ease, onUpdate: camSujo });
    if (DRIFT) G.to(st.cam, { x: x1 + troiPx(), duration: 14, ease: 'none', delay: CAM.dur, onUpdate: camSujo });
    if (DRIFT) G.to(st.cam, { y: -9, duration: 12, ease: 'sine.inOut', delay: CAM.dur, onUpdate: camSujo });
  }
  /** Canh moi o toa do the gioi k*W; canh cu go sau khi may quay da roi di */
  function canhMoi(nh, opt) {
    opt = opt || {};
    const cu = st.canh;
    const k = st.k++;
    const el = mk('div', 'h-canh', st.mundo);
    el.style.left = (k * st.W) + 'px';
    el.style.width = st.W + 'px'; el.style.height = st.H + 'px';
    const c = { el, k, W: st.W, H: st.H, hen: [] };
    st.canhs.push(c);
    st.canh = c;
    const dau = !cu && !(nh && nh.isResume) && !!(nh && nh.laBatDau) && !(opt.nhanh);
    camToi(k, !cu && !dau, dau);
    st.canhs.slice().forEach((o) => {
      if (o === c) return;
      const go = () => { o.el.remove(); st.canhs = st.canhs.filter((x) => x !== o); };
      if (giam() || !cu) go(); else G.delayedCall(CAM.dur + 0.25, go);
    });
    if (cu && !giam() && !opt.khongWhoosh) snd('whoosh', 0.02);
    return c;
  }

  // ================================================================== HIEU UNG (hang so tween = ban mau giay.js)
  const ft = (e, a, b, imm) => G.fromTo(e, a, Object.assign({ immediateRender: imm !== false }, b));
  const ftl = (e, a, b) => G.fromTo(e, a, Object.assign({ immediateRender: false }, b));   // khong dat trang thai dau ngay (noi tiep tween truoc)
  const D = (s) => (giam() ? 0 : s);
  const A = {
    hien(e, t, d) { ft(e, { autoAlpha: 0 }, { autoAlpha: 1, duration: D(d || 0.14), ease: 'none', delay: t }); },
    /** tha nhan treo tu tren xuong + dung dua quanh dinh day */
    tha(e, t, dy, goc) {
      if (giam()) { G.set(e, { autoAlpha: 1, y: 0, rotation: 0, delay: 0 }); return; }
      const oy = '50% ' + (-170 * st.hu) + 'px';
      A.hien(e, t, 0.05);
      ft(e, { y: -dy }, { y: 0, duration: 0.95, ease: 'power3.out', delay: t });
      ft(e, { rotation: goc == null ? -7 : goc, transformOrigin: oy }, { rotation: 0, transformOrigin: oy, duration: 2.1, ease: 'elastic.out(1, 0.32)', delay: t });
    },
    /** ghi chu gap: dai mau keo ngang, than lat xuong quanh ban le */
    moGap(g, t) {
      const dai = g.querySelector('.h-dai'), than = g.querySelector('.h-gt'), toi = g.querySelector('.h-toi');
      if (giam()) { G.set(g, { autoAlpha: 1 }); return; }
      const P = 1300 * st.hu;
      A.hien(g, t, 0.05);
      ft(dai, { scaleX: 0.04 }, { scaleX: 1, duration: 0.42, ease: 'power3.out', delay: t, transformOrigin: '0 50%' });
      ft(than, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04, ease: 'none', delay: t + 0.16 });
      ft(than, { rotationX: -86, transformPerspective: P, transformOrigin: '50% 0%' },
        { rotationX: 0, transformPerspective: P, transformOrigin: '50% 0%', duration: 0.78, ease: 'back.out(1.25)', delay: t + 0.16 });
      if (toi) ft(toi, { opacity: 0.55 }, { opacity: 0, duration: 0.6, ease: 'power2.out', delay: t + 0.16 });
      A.phang(than, t + 0.16 + 0.78, P);
    },
    /** sau khi lat xong: bo perspective -> ve 2D (khong con lop 3D) */
    phang(e, t, p) { ftl(e, { transformPerspective: p, rotationX: 0 }, { transformPerspective: 0, rotationX: 0, duration: 0.001, ease: 'none', delay: t + 0.02 }); },
    /** mo tam giay lon: lat tu tren xuong */
    lat(e, t, dur) {
      if (giam()) { G.set(e, { autoAlpha: 1 }); return; }
      const P = 1500 * st.hu;
      A.hien(e, t, 0.05);
      ft(e, { rotationX: -80, transformPerspective: P, transformOrigin: '50% 0%' },
        { rotationX: 0, transformPerspective: P, transformOrigin: '50% 0%', duration: dur || 0.85, ease: 'back.out(1.2)', delay: t });
      A.phang(e, t + (dur || 0.85), P);
    },
    /** o chu roi vao khe */
    roi(e, t) {
      if (giam()) { G.set(e, { autoAlpha: 1 }); return; }
      A.hien(e, t, 0.1);
      ft(e, { y: -70 * st.hu / 0.75, rotation: -6 }, { y: 0, rotation: 0, duration: 0.6, ease: 'back.out(1.7)', delay: t });
      ft(e, { scale: 1.06 }, { scale: 1, duration: 0.3, ease: 'power2.out', delay: t });      // scale tach rieng: back.out lam scale tut xuong ~0,95 (chu ro < 14 px trong khung hinh)
    },
    /** nhan dan dap xuong */
    dan(e, t, goc) {
      goc = goc || 0;
      if (giam()) { G.set(e, { autoAlpha: 1, rotation: goc }); return; }
      A.hien(e, t, 0.08);
      ft(e, { scale: 1.35, rotation: goc - 6 }, { scale: 1, rotation: goc, duration: 0.5, ease: 'back.out(2.2)', delay: t });
    },
    lac(e, t) {
      if (giam()) return;
      ftl(e, { x: 0 }, { x: 1, duration: 0.6, ease: 'none', delay: t, modifiers: { x: (v) => { const p = Math.max(0, Math.min(1, parseFloat(v))); return (18 * st.hu / 0.75 * Math.sin(p * Math.PI * 7) * (1 - p)).toFixed(2) + 'px'; } } });
    },
    /** tieu diem: phong 140 ms ease-out roi dan hoi (tre = api.tre(tt) -> toi CUNG luc nghe) */
    nay(e, t, s) {
      if (!e || giam()) return;
      s = s || 1.08;
      ftl(e, { scale: 1 }, { scale: s, duration: 0.14, ease: 'power2.out', delay: t, overwrite: false });
      ftl(e, { scale: s }, { scale: 1, duration: 0.4, ease: 'power2.out', delay: t + 0.14, overwrite: false });      // lang xuong 1 khong lo xuong duoi (back.out tung cho scale 0,95 -> chu ro < 14 px)
    },
    /** vien sang (ring) vao 140 ms, giu roi mo */
    vien(e, t, giu) {
      const v = e && e.querySelector && e.querySelector('.h-vien');
      if (!v) return;
      G.killTweensOf(v);
      ft(v, { opacity: 0 }, { opacity: 1, duration: D(0.12), ease: 'none', delay: t });
      if (giu !== true) ftl(v, { opacity: 1 }, { opacity: 0, duration: D(0.4), ease: 'power1.in', delay: t + (giu || 0.5) });
    },
    /** tieu diem day du = nay + vien (ca hai <= 200 ms) */
    tieuDiem(e, t, s) { A.nay(e, t, s); A.vien(e, t); },
    /** ruy bang keo ngang tu giua */
    ruy(e, t, dur) {
      if (giam()) { G.set(e, { autoAlpha: 1 }); return; }
      A.hien(e, t, 0.05);
      ft(e, { scaleX: 0.05, transformOrigin: '50% 50%' }, { scaleX: 1, transformOrigin: '50% 50%', duration: dur || 0.7, ease: 'expo.out', delay: t });
    },
    /** len: truot len tu duoi (noi dung phu) */
    len(e, t, dy) {
      if (giam()) { G.set(e, { autoAlpha: 1 }); return; }
      A.hien(e, t, 0.1);
      ft(e, { y: (dy == null ? 30 : dy) * st.hu / 0.75 }, { y: 0, duration: 0.6, ease: 'back.out(1.6)', delay: t });
    },
    no(e, t) {
      if (giam()) { G.set(e, { autoAlpha: 1 }); return; }
      A.hien(e, t, 0.1);
      ft(e, { scale: 0.6, y: 30 * st.hu / 0.75 }, { scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.8)', delay: t });
    },
  };
  /** Doi moc hien cua `khoa` sang t0 (som HOAC muon hon) neu chua hien: dung cho moc du phong tinh tu cue cuoi cung; som = true: chi neu som hon moc hien tai */
  function mocDoi(c, khoa, t0, som) {
    const o = c && c.mo && c.mo[khoa];
    if (o && !o.xong && o.tw != null && (!som || t0 < o.tw)) { if (o.h) o.h.kill(); o.tw = null; o.h = null; }
    return mocVao(c, khoa, t0);
  }
  /** Len lich hien phan tu `khoa` (c.rev[khoa]) sau t0 giay; cue toi som hon -> doi sang moc som hon; hien dung 1 lan */
  function mocVao(c, khoa, t0) {
    const fn = c && c.rev && c.rev[khoa];
    if (!fn) return false;
    const o = c.mo[khoa] || (c.mo[khoa] = { xong: false, tw: null, h: null });
    if (o.xong) return false;
    const t = Math.max(0, t0 || 0);
    if (INST) { o.xong = true; try { fn(); } catch (e) { /* canh da go */ } return true; }
    if (o.tw != null && o.tw <= t + 0.001) return false;
    if (o.h) o.h.kill();
    o.tw = t;
    o.h = G.delayedCall(t, () => {
      if (o.xong) return;
      const chay = () => { if (o.xong) return; o.xong = true; try { fn(); } catch (e) { /* canh da go */ } };
      if (c.pronto || !c.el.isConnected) chay(); else (c.cho = c.cho || []).push(chay);
    });
    return true;
  }

  // ================================================================== KHOI DUNG (giay.css -> .h-*)
  const rb = (base, doc, cls) => '<span class="h-rb">' + base + (doc ? '<span class="h-rt ' + (cls || '') + '">' + doc + '</span>' : '') + '</span>';
  const nhanNho = (t, b, st_) => '<div class="h-nhan"' + (st_ ? ' style="' + st_ + '"' : '') + '>' + esc(t) + (b ? ' <b>· ' + esc(b) + '</b>' : '') + '</div>';
  /** Cua so vom (anh minh hoa) + rem cuon + huy chuong */
  function vom(cha, r, o) {
    o = o || {};
    const v = dat(mk('div', 'h-vom', cha), r);
    const R = r.w / 2, hu = st.hu;
    ['h-vl1', 'h-vl2', 'h-vl3'].forEach((c, i) => {
      const l = mk('div', 'h-vl ' + c, v);
      const rad = Math.max(2, R - [0, 16, 32][i] * hu);
      l.style.borderRadius = rad + 'px ' + rad + 'px 0 0 / ' + rad + 'px ' + rad + 'px 0 0';
    });
    const l3 = v.querySelector('.h-vl3');
    if (o.noiDung) l3.insertAdjacentHTML('beforeend', o.noiDung);
    let im = null;
    if (o.anh) {
      im = mk('img', 'h-vanh', l3);
      im.alt = ''; im.decoding = 'async'; im.draggable = false;
      // anh vao cung cua so khi da tai xong (khong de lo cua so TRANG TRON truoc khi anh toi): opacity 0 -> 1 (<= 180 ms)
      if (!giam()) { im.style.opacity = '0'; im.style.transition = 'opacity .18s ease-out'; const hien_ = () => { im.style.opacity = '1'; }; im.addEventListener('load', hien_); im.addEventListener('error', hien_); setTimeout(hien_, 1500); }
      im.src = o.anh;
      if (im.complete && im.naturalWidth) im.style.opacity = '1';
      let iw = o.iw || (r.w - 64 * hu) * 1.12;
      // cua so CAO hon rong va nhin thay het (the chuong dien thoai, tranh canh hoi thoai): anh vuong phai phu ca chieu cao (cat hai ben), khong de dai kem trong o duoi
      if (o.phu) iw = Math.max(iw, r.h - 64 * hu - (o.iy == null ? 20 * hu : o.iy));
      im.style.width = iw + 'px'; im.style.height = iw + 'px';
      im.style.left = ((r.w - 64 * hu - iw) / 2) + 'px';
      im.style.top = (o.iy == null ? 20 * hu : o.iy) + 'px';
    }
    mk('div', 'h-bong-trong', l3);
    let rem = null;
    if (o.cua) {
      rem = mk('div', 'h-rem', l3, '<div class="h-rem-huy">' + esc(o.cua) + '</div><div class="h-rem-mep"></div>');
      l3.appendChild(l3.querySelector('.h-bong-trong'));
    }
    let khoa = null;
    if (o.khoa) khoa = mk('div', 'h-khoa', v, o.khoa);
    return { el: v, l3, im, rem, khoa, rect: r };
  }
  /** Mo rem + anh phong ra (moCua cua ban mau) */
  function moCua(v, t) {
    if (!v.rem) return;
    if (giam()) { G.set(v.rem, { autoAlpha: 0 }); return; }
    // rem cuon het xuong duoi khung (overflow hidden): an han (visibility) — khong de so rem nam "an" ngoai khung
    ft(v.rem, { yPercent: 0 }, { yPercent: 112, duration: 1.0, ease: 'power3.inOut', delay: t, onComplete: () => G.set(v.rem, { autoAlpha: 0 }) });
    if (v.im) ft(v.im, { scale: 0.9, y: 30 * st.hu / 0.75 }, { scale: 1, y: 0, duration: 1.3, ease: 'power3.out', delay: t + 0.15 });
  }
  /** Nhan treo: day + than giay + lo + noi dung. r = rect px that. */
  function treo(cha, r, html) {
    const e = dat(mk('div', 'h-treo h-an', cha), r);
    e.innerHTML = '<div class="h-day"></div><div class="h-sau"></div><div class="h-than"></div><div class="h-day-noi"></div><div class="h-lo"></div><div class="h-noi">' + html + '</div>';
    return e;
  }
  /** Ghi chu gap: dai mau (nhan) + than giay (noi dung). mau: '' | 'la' | 'nghe' */
  /** Chieu cao that (px) cua html o be ngang w (do bang st.mesur, co chu ghi trong html) */
  function caoNoiDung(html, w) {
    const m = st.mesur;
    if (!m) return 0;
    m.className = 'h-mesur';
    m.style.width = Math.round(w) + 'px'; m.style.whiteSpace = 'normal'; m.style.lineHeight = ''; m.style.fontSize = '';
    m.innerHTML = '<div style="display:flex;flex-direction:column">' + html + '</div>';
    return m.scrollHeight;
  }
  /** Kich thuoc tu nhien {w, h} (px) cua html o co chu fs, xuong dong trong be ngang toi da maxW (do bang st.mesur, lop cls) */
  function doHop(html, cls, fs, lh, maxW, lang) {
    const m = st.mesur;
    if (!m) return { w: maxW, h: fs * lh };
    m.className = 'h-mesur';
    m.style.width = Math.ceil(maxW) + 'px'; m.style.whiteSpace = 'normal'; m.style.lineHeight = ''; m.style.fontSize = '';
    m.innerHTML = '<div class="' + cls + '"' + (lang ? ' lang="' + lang + '"' : '') + ' style="position:static;inset:auto;display:inline-block;vertical-align:top;padding:0;width:auto;height:auto;text-wrap:balance;max-width:' + Math.ceil(maxW) + 'px;font-size:' + fs + 'px;line-height:' + lh + '">' + html + '</div>';
    const e = m.firstChild;
    // be ngang = dong chu rong nhat THAT: khoi chu xuong dong co text-wrap: balance (cac dong ngan hon hop co gian toi max-width) -> hop om theo dong rong nhat, khong theo max-width
    let w = Math.ceil(e.offsetWidth);
    try {
      const rg = document.createRange();
      rg.selectNodeContents(e);
      let l = 1e9, r = -1e9;
      for (const q of rg.getClientRects()) { if (q.width < 0.5 || q.height < 0.5) continue; l = Math.min(l, q.left); r = Math.max(r, q.right); }
      if (r > l) w = Math.min(w, Math.ceil(r - l) + 1);
    } catch (er) { /* giu be ngang hop */ }
    return { w, h: Math.ceil(e.offsetHeight) };
  }
  /** Kich thuoc tu nhien {w, h} cua noi dung o ghi chu (html co co chu inline), xuong dong trong be ngang maxW */
  function doNoiDung(html, maxW) {
    const m = st.mesur;
    if (!m) return { w: maxW, h: 0 };
    m.className = 'h-mesur';
    m.style.width = Math.ceil(maxW) + 'px'; m.style.whiteSpace = 'normal'; m.style.lineHeight = ''; m.style.fontSize = '';
    m.innerHTML = '<div style="display:inline-flex;flex-direction:column;vertical-align:top;max-width:' + Math.ceil(maxW) + 'px">' + html + '</div>';
    const e = m.firstChild;
    return { w: Math.ceil(e.offsetWidth), h: Math.ceil(e.offsetHeight) };
  }
  /** O ghi chu OM noi dung: rect r (x, y, w, h toi da) -> rect vua chu + dem (.h-gt: dai 52 + dem 18 / 26), khong nho hon nhan dai.
   *  o.giua: can giua theo be ngang cu; o.cao === false: giu chieu cao; o.minW / o.minH */
  function omGap(r, html, nhan, o) {
    o = o || {};
    const hu = st.hu;
    const inW = r.w - 52 * hu;
    const k = doNoiDung(html, inW);
    const wDai = rongChu(String(nhan || '').toUpperCase(), 'h-r-nghia', Math.max(st.dt ? 12 : 14, 21 * hu)) * 1.25 + 44 * hu + 8;
    const w = Math.round(Math.min(r.w, Math.max(k.w + 52 * hu + 8, wDai, o.minW || 0)));
    const h = o.cao === false ? r.h : Math.round(Math.min(r.h, Math.max(k.h + 52 * hu + 36 * hu + 6, o.minH || 0)));
    return { x: o.giua ? Math.round(r.x + (r.w - w) / 2) : r.x, y: r.y, w, h };
  }
  const dt_ = () => !!st.dt;
  const coHtml = (html, k, san) => html.replace(/font-size:\s*([\d.]+)px/g, (x, v) => { const f = parseFloat(v); return 'font-size:' + Math.min(f, Math.max(san || 8, Math.round(f * k * 10) / 10)) + 'px'; });
  function gap(cha, r, nhan, html, mau) {
    // uoc so dong (fitLines / coVua tung phan) co the lech voi trinh duyet -> do noi dung that; cao hon o thi thu nho deu co chu
    // (o .h-gt: dai 52 + dem .h-gn 18 / 26), khong de chu bi cat tren / duoi
    if (r && r.h && st.mesur) {
      const hu = st.hu, w = r.w - 52 * hu, hMax = r.h - 52 * hu - 36 * hu - 2;
      // san co chu khi thu nho: nho nhat trong html khong duoi 12 px (dien thoai) / 14 px (may tinh)
      // moi co chu co san rieng: chu to (nghia 40 px) van thu tiep khi chu nho (dong phu) da cham san
      const san = dt_() ? 13 : 14;
      let k = 1, ra = html, tran = false;
      for (let i = 0; i < 14; i++) {
        const hh = caoNoiDung(ra, w);
        if (!hh || hh <= hMax) { tran = false; break; }
        tran = true;
        if (k <= 0.3) break;
        k = Math.max(0.3, k * Math.max(0.8, Math.min(0.97, Math.sqrt(hMax / hh))));
        ra = coHtml(html, k, san);
      }
      html = ra;
      if (tran) html = '<div class="h-gn-tran">' + html + '</div>';   // da toi san ma van dai: giu dau doan, mo dan cuoi (khong ep chu nho khong doc duoc)
    }
    const g = dat(mk('div', 'h-gap h-an', cha), r);
    mk('div', 'h-dai ' + (mau || ''), g, esc(nhan));
    const th = mk('div', 'h-gt', g);
    mk('div', 'h-gn', th, html);
    mk('div', 'h-toi', th);
    return g;
  }
  /**
   * Thu nho DEU moi co chu inline (px) trong hop `box` cho toi khi tran() = false; khong ha co nao duoi `san` (co da nho hon san giu nguyen).
   * Tra true neu van tran (da cham san).
   */
  function thuNho(box, tran, san, sau) {
    if (!box) return false;
    const ds = [box].concat(Array.from(box.querySelectorAll('[style*="font-size"]'))).filter((e) => e.style && /px$/.test(e.style.fontSize || ''));
    // soat chay lai (phong chu tai xong, ham khoi tao cua canh khac...): tra co chu ve gia tri GOC truoc khi do — lan do truoc co the
    // da ha co luc phong chua tai (do sai), thu nho mot chieu se giu mai co nho
    let khoiPhuc = false;
    ds.forEach((e) => { if (e.dataset.fs0 && Math.abs(parseFloat(e.style.fontSize) - +e.dataset.fs0) > 0.05) { e.style.fontSize = e.dataset.fs0 + 'px'; khoiPhuc = true; } });
    if (khoiPhuc && sau) sau(1);
    if (!tran()) return false;
    if (!ds.length) return true;
    ds.forEach((e) => { if (!e.dataset.fs0) e.dataset.fs0 = String(parseFloat(e.style.fontSize)); });
    let k = 1;
    for (let i = 0; i < 14 && tran(); i++) {
      k *= 0.94;
      let doi = false;
      ds.forEach((e) => {
        const f0 = +e.dataset.fs0, f = Math.max(Math.min(f0, san), Math.round(f0 * k * 10) / 10);
        if (Math.abs(f - parseFloat(e.style.fontSize)) > 0.05) { e.style.fontSize = f + 'px'; doi = true; }
      });
      if (sau) sau(k);
      if (!doi) break;
    }
    return tran();
  }
  /**
   * SOAT canh da dung: do bo cuc THAT (sau khi phong chu tai xong) cua cac hop co kich thuoc co dinh; chu tran hop (uoc be ngang / so dong
   * lech, phong chua tai luc dung) -> thu nho deu toi san co chu (14 px may tinh / 13 px dien thoai). Chi doc offset/scroll (khong anh huong
   * boi transform cua hieu ung).
   */
  /** Chu (cac nut chu, khong tinh vien / khung trang tri) cua e co ra ngoai hop trong cua e (tru dem * k) qua tol px khong — toa do layout
   *  (chia ti le transform cua e: hieu ung phong / lat dang chay khong lam sai) */
  function tranChu(e, k, tol, tolY) {
    if (tolY == null) tolY = tol;
    const er = e.getBoundingClientRect();
    if (!e.offsetWidth || !e.offsetHeight || !er.width || !er.height) return false;
    const sx = e.offsetWidth / er.width, sy = e.offsetHeight / er.height;
    const cs = getComputedStyle(e);
    const pl = (parseFloat(cs.paddingLeft) || 0) * k, pr = (parseFloat(cs.paddingRight) || 0) * k, pt = (parseFloat(cs.paddingTop) || 0) * k, pb = (parseFloat(cs.paddingBottom) || 0) * k;
    const bl = parseFloat(cs.borderLeftWidth) || 0, bt = parseFloat(cs.borderTopWidth) || 0;
    const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    const rg = document.createRange();
    let n, l = 1e9, t = 1e9, r = -1e9, b = -1e9;
    while ((n = tw.nextNode())) {
      if (!n.nodeValue || !n.nodeValue.trim()) continue;
      const p = n.parentElement;
      if (p && (p.closest('.h-rt, rt, .ky, .qz-key, .h-blank') || getComputedStyle(p).display === 'none')) continue;   // .ky = huy hieu A-D de len goc o (o gon): khong tinh
      rg.selectNodeContents(n);
      for (const q of rg.getClientRects()) { if (q.width < 0.5 || q.height < 0.5) continue; l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom); }
    }
    if (r < l) return false;
    const x0 = (l - er.left) * sx - bl, x1 = (r - er.left) * sx - bl, y0 = (t - er.top) * sy - bt, y1 = (b - er.top) * sy - bt;
    return x0 < pl - tol || y0 < pt - tolY || x1 > e.clientWidth - pr + tol || y1 > e.clientHeight - pb + tolY;
  }
  /** Phong to deu co chu inline trong box (toi 1,35 x, buoc 5 %) khi chu con chiem it cho; dung truoc khi tran() */
  function phongTo(box, tran) {
    if (!box || tran()) return;
    const ds = [box].concat(Array.from(box.querySelectorAll('[style*="font-size"]'))).filter((e) => e.style && /px$/.test(e.style.fontSize || ''));
    if (!ds.length) return;
    const f0 = ds.map((e) => parseFloat(e.style.fontSize));
    const tren = Math.round(T('nghia').max * 1.5);
    let k = 1, tot = 1;
    while (k < 1.35) {
      k = +(k + 0.05).toFixed(2);
      ds.forEach((e, i) => { e.style.fontSize = Math.min(tren, Math.round(f0[i] * k * 10) / 10) + 'px'; });
      if (tran()) break;
      tot = k;
    }
    ds.forEach((e, i) => { e.style.fontSize = Math.min(tren, Math.round(f0[i] * tot * 10) / 10) + 'px'; });
  }
  /** O ghi chu (.h-gap) rong hon chu nhieu: thu hep be ngang vua chu (+ dem 26 moi ben), khong hep hon nhan dai; giu tam neu o can giua */
  function omRong(gp) {
    if (!gp || gp.dataset.om === '0') return;
    const gn = gp.querySelector('.h-gn'), dai = gp.querySelector('.h-dai');
    if (!gn) return;
    const tw = document.createTreeWalker(gn, NodeFilter.SHOW_TEXT), rg = document.createRange();
    const gr = gn.getBoundingClientRect();
    if (!gr.width || !gn.offsetWidth) return;
    const sx = gn.offsetWidth / gr.width;
    let n, l = 1e9, r = -1e9;
    while ((n = tw.nextNode())) { if (!n.nodeValue.trim()) continue; rg.selectNodeContents(n); for (const q of rg.getClientRects()) { if (q.width < 0.5) continue; l = Math.min(l, q.left); r = Math.max(r, q.right); } }
    if (r < l) return;
    const wChu = (r - l) * sx, w0 = gp.offsetWidth;
    const wDai = dai ? dai.scrollWidth + 6 : 0;
    const cs0 = getComputedStyle(gn), padX = (parseFloat(cs0.paddingLeft) || 0) + (parseFloat(cs0.paddingRight) || 0);
    const w = Math.ceil(Math.max(wChu + padX + 8, wDai, 90));
    // chu ngan trong o rong hon chu (dai nhan "Nghia" / am doc hep chu hon): can giua chu trong o, khong de lech trai (le trai nho, le phai rong)
    const roi = (Math.min(w, w0) - wChu - padX) > 22 && (gn.textContent || '').trim().length <= 48;   // chi chu ngan (nhan / mot dong); doan van giai thich nhieu dong giu can trai
    gn.classList.toggle('h-gn-ctr', roi);
    // chieu cao: khoi noi dung that (dau khoi dau -> cuoi khoi cuoi, tinh theo hop dong .h-nghia / .h-phu) + dem tren / duoi cua .h-gn; om khi o cao hon > 8 px
    let hOm = 0;
    if (gn.firstElementChild && gn.lastElementChild && !gn.classList.contains('is-tran')) {
      const sy = gn.offsetHeight / gr.height, a0 = gn.firstElementChild.getBoundingClientRect(), a1 = gn.lastElementChild.getBoundingClientRect();
      const cs = getComputedStyle(gn), pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      hOm = Math.ceil((a1.bottom - a0.top) * sy + pad + 52 * st.hu + 2);
    }
    const h0 = gp.offsetHeight, omCao = hOm > 0 && hOm < h0 - 8;
    if (w >= w0 - 12 && !omCao) return;
    omLuu(gp);
    if (w < w0 - 12) {
      const giua = gp.dataset.giua === '1';
      if (giua) gp.style.left = Math.round(parseFloat(gp.style.left) + (w0 - w) / 2) + 'px';
      gp.style.width = w + 'px';
    }
    if (omCao) gp.style.height = hOm + 'px';
    gp.dataset.wA = gp.style.width; gp.dataset.lA = gp.style.left; gp.dataset.hA = gp.style.height;
  }
  /** Luu hinh hoc goc cua o ghi chu truoc khi om (chi mot lan) */
  function omLuu(gp) { if (gp.dataset.w0 == null) { gp.dataset.w0 = gp.style.width; gp.dataset.l0 = gp.style.left; gp.dataset.h0 = gp.style.height; } }
  /** Soat lai (phong chu vua tai xong): tra o ghi chu ve hinh hoc goc truoc khi om lai — chi khi khong ai khac da doi hinh hoc (kaiwa dat lai o nghia moi luot) */
  function omReset(gp) {
    if (!gp || gp.dataset.w0 == null) return;
    if (gp.style.width === gp.dataset.wA && gp.style.left === gp.dataset.lA && gp.style.height === gp.dataset.hA) { gp.style.width = gp.dataset.w0; gp.style.left = gp.dataset.l0; gp.style.height = gp.dataset.h0; }
    delete gp.dataset.w0; delete gp.dataset.l0; delete gp.dataset.h0; delete gp.dataset.wA; delete gp.dataset.lA; delete gp.dataset.hA;
  }
  function soat(c) {
    if (!c || !c.el || !c.el.isConnected) return;
    const san = st.dt ? 13 : 14;
    c.el.querySelectorAll('.h-cau-hoi').forEach((q) => {
      thuNho(q, () => tranChu(q, 0, 2), san, () => { const f = parseFloat(q.style.fontSize) || 20; q.style.setProperty('--h-bw', Math.round(f * 1.55) + 'px'); q.style.setProperty('--h-bh', Math.round(f * 0.95) + 'px'); });
    });
    c.el.querySelectorAll('.h-gn').forEach((g) => {
      if (g.querySelector(':scope > .h-gn-tran')) return;
      omReset(g.closest('.h-gap'));
      if (thuNho(g, () => tranChu(g, 0.75, 0, 7), san)) { g.classList.add('is-tran'); return; }
      // o ghi chu con rong (nghia ngan "Núi", am doc カイ): phong to chu cho toi khi vua o, roi thu hep o vua chu (giu tam / mep trai)
      if (!g.closest('.h-hc')) phongTo(g, () => tranChu(g, 0.75, 0));      // (2 cot khong anh: chu da duoc chon to nhat co the o dungTuVung; phongTo gioi han 1,5 x se HA chu to xuong)   // phong to: dung dung sai chat (khong lan vao dem), khac thuNho (dem doc cho phep hop chu cao hon dong)
      omRong(g.closest('.h-gap'));
    });
    c.el.querySelectorAll('.h-lc:not(.is-ink) > .h-o, .h-cau-bai, .h-tt > .h-giay, .h-tcard, .h-chip, .h-chipv').forEach((o) => thuNho(o, () => tranChu(o, 0.5, 1), san));
    // o chu / khoi (khong dem trong): chu cach mep >= 6 px (do be ngang luc phong chua tai co the hut ca chuc px)
    c.el.querySelectorAll('.h-hang .h-o, .h-khoi > .h-o').forEach((o) => thuNho(o, () => tranChu(o, 0, -6, o.classList.contains('h-ink') ? 1e4 : 2), san));   // o om net (h-ink): hop dong chu (1,45 em) cao hon o — do doc theo net chu da dung o xepO, khong kiem lai bang hop dong
    // ruy bang (clip-path xien 2 dau): chu ten bai / loi chao giu cach mep tren / duoi >= 2 px
    c.el.querySelectorAll('.h-ruy').forEach((o) => thuNho(o, () => tranChu(o, 0, -2), san));
  }
  /** Nhan dan (sticker) co bang keo. mau: '' | 'la' */
  function dan(cha, r, html, mau, goc) {
    const s = dat(mk('div', 'h-dan h-an' + (mau ? ' ' + mau : ''), cha, html), r);
    s.style.setProperty('--goc', (goc || 0) + 'deg');
    return s;
  }
  /** O chu (tile) trong khe: HTML. opt: tro, ruby, ro, id, fs */
  function oHtml(text, opt) {
    opt = opt || {};
    return '<div class="h-khe"><div class="h-o' + (opt.tro ? ' tro' : '') + ' h-an"' + (opt.id != null ? ' data-tid="' + esc(opt.id) + '"' : '') + '>' +
      '<div class="ruby">' + (opt.ruby || '') + '</div><div class="chu"' + (opt.fs ? ' style="font-size:' + opt.fs + 'px"' : '') + '>' + text + '</div>' +
      '<div class="ro">' + (opt.ro || '&nbsp;') + '</div><i class="h-vien"></i></div></div>';
  }
  /** Hoa chan dung (rosette): vong rang cua + vong tron chua anh. d = duong kinh px that */
  function hoa(cha, r, anh, o) {
    o = o || {};
    const d = Math.min(r.w, r.h), hu = st.hu;
    const e = dat(mk('div', 'h-hoa h-an', cha), { x: r.x, y: r.y, w: d, h: d });
    const n = 28, Rr = d / 2, bien = Math.max(10, 18 * hu * (d / (474 * hu)));
    let p = '';
    for (let i = 0; i <= n * 2; i++) {
      const a = i / (n * 2) * Math.PI * 2, rrr = i % 2 ? Rr : Rr - bien;
      p += (i ? ' L' : 'M') + (Rr + Math.cos(a) * rrr).toFixed(1) + ',' + (Rr + Math.sin(a) * rrr).toFixed(1);
    }
    const vong = d * (50 / 474);
    e.innerHTML = '<svg width="' + d + '" height="' + d + '"><path d="' + p + 'Z" fill="#c96442" stroke="#c96442" stroke-width="' + (10 * d / 474 / hu * hu).toFixed(1) + '" stroke-linejoin="round"/>' +
      '<circle cx="' + Rr + '" cy="' + Rr + '" r="' + (Rr - 34 * d / 474) + '" fill="#d6a94a"/></svg>';
    const tr = dat(mk('div', 'h-tron', e), { x: vong, y: vong, w: d - 2 * vong, h: d - 2 * vong });
    let im = null;
    if (anh) {
      im = mk('img', 'h-hanh', tr);
      im.alt = ''; im.decoding = 'async'; im.draggable = false; im.src = anh;
      const iw = (d - 2 * vong) * (o.k || 1.12);
      im.style.width = im.style.height = iw + 'px';
      im.style.left = ((d - 2 * vong - iw) / 2) + 'px';
      im.style.top = (o.iy == null ? -(iw - (d - 2 * vong)) * 0.3 : o.iy) + 'px';
    } else if (o.chu) {
      tr.innerHTML = '<span class="h-hchu" lang="ja" style="font-size:' + Math.round((d - 2 * vong) * 0.5) + 'px">' + esc(o.chu) + '</span>';
    }
    return { el: e, tron: tr, im };
  }
  /** Ruy bang (ribbon xanh la, co duoi nhon). Tra { w: wrap, ruy } */
  function ruy(cha, r, html, mau) {
    const w = dat(mk('div', 'h-ruy-wrap h-an', cha), r);
    const e = mk('div', 'h-ruy', w, html);
    if (mau) e.style.backgroundColor = mau;
    return { w, ruy: e };
  }
  /** Giay (tam giay kem) co the them lop nen */
  function giay(cha, r, html, cls) { return dat(mk('div', 'h-giay h-an' + (cls ? ' ' + cls : ''), cha, html), r); }

  // ================================================================== THE BAI (goc tren phai) + CHUONG
  const TEN_KIND = { 'grammar-intro': 'Mẫu câu', example: 'Ví dụ', 'kaiwa-intro': 'Hội thoại', 'kaiwa-run': 'Hội thoại', kaiwa: 'Hội thoại', quiz: 'Luyện tập' };
  function nhanTab(nh) {
    if (!nh) return '';
    if (nh.tieuDe) return 'Mở đầu';
    const c = nh.chuong || {};
    let ten = '';
    if (nh.kind === 'vocab') ten = 'Từ vựng';
    else if (nh.kind === 'kanji') ten = C.tenChuong('kanji', nh.capDo);
    else ten = TEN_KIND[nh.kind] || c.ten || '';
    const iN = (nh.kind === 'vocab' || nh.kind === 'kanji' || nh.kind === 'quiz') && c.i && c.n ? ' · ' + c.i + '/' + c.n : '';
    return ten + iN;
  }
  function dungTab() {
    const tb = mk('div', 'h-the-bai', L);
    tb.innerHTML = '<div class="nen"></div><div class="dong1"></div><div class="ten"></div><div class="cham"></div>';
    st.tab = { el: tb, d1: tb.querySelector('.dong1'), ten: tb.querySelector('.ten'), cham: tb.querySelector('.cham'), cur: null, n: -1, dots: [], tx: '' };
    if (!giam()) ft(tb, { y: -170 * st.hu / 0.75 }, { y: 0, duration: 0.9, ease: 'back.out(1.4)', delay: 0.15 });
  }
  function capTab(nh, ten, chuongIdx, tong) {
    const t = st.tab;
    if (!t) return;
    const bai = (nh && nh.bai) || {};
    const so = bai.lessonNumber != null ? bai.lessonNumber : '';
    const cd = String((nh && nh.capDo) || '').toUpperCase();
    t.d1.textContent = (cd === 'KANA' ? 'NHẬP MÔN' : cd) + ' · BÀI ' + so;
    if (t.tx !== ten) {
      const cu = t.cur;
      const s = mk('span', null, t.ten, esc(ten));
      t.cur = s; t.tx = ten;
      if (cu) { if (giam()) cu.remove(); else ftl(cu, { opacity: 1, y: 0 }, { opacity: 0, y: -12 * st.hu / 0.75, duration: 0.14, ease: 'power2.out', onComplete: () => cu.remove() }); }
      if (giam()) G.set(s, { opacity: 1 }); else ft(s, { opacity: 0, y: 12 * st.hu / 0.75 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out', delay: cu ? 0.14 : 0.3 });
    }
    if (t.n !== tong) {
      t.cham.innerHTML = '';
      t.dots = [];
      for (let i = 0; i < tong; i++) t.dots.push(mk('i', null, t.cham));
      t.n = tong; t.idx = -1; t.col = tong ? new Array(tong).fill('rgba(255,240,225,0.35)') : []; t.sc = tong ? new Array(tong).fill(1) : [];
    }
    if (t.idx !== chuongIdx) {
      t.dots.forEach((d, i) => {
        const bat = i === chuongIdx;
        const mau = bat ? '#f6d98b' : (i < chuongIdx ? '#fbf0dd' : 'rgba(255,240,225,0.35)'), sc = bat ? 1.4 : 1;
        ftl(d, { backgroundColor: t.col[i], scale: t.sc[i] }, { backgroundColor: mau, scale: sc, duration: D(0.4), ease: bat ? 'back.out(2)' : 'power1.out', overwrite: 'auto' });
        t.col[i] = mau; t.sc[i] = sc;
      });
      t.idx = chuongIdx;
    }
  }
  /** Danh sach chuong cua bai (thu tu xuat hien) + chi so chuong cua nhip */
  function dsChuong(nh) {
    const ds = [];
    const bs = (nh.ctx && nh.ctx.cacNhip) || [];
    bs.forEach((b) => { const c = b && b.chapter ? b.chapter : (b && b.beat && b.beat.chapter); if (c && !ds.includes(c)) ds.push(c); });
    if (!ds.length) ds.push((nh.beat && nh.beat.chapter) || 'vocab');
    return ds;
  }
  function chuongCua(nh) { return (nh.beat && nh.beat.chapter) || ({ vocab: 'vocab', kanji: 'kanji', 'grammar-intro': 'grammar', example: 'grammar', 'kaiwa-intro': 'kaiwa', 'kaiwa-run': 'kaiwa', kaiwa: 'kaiwa', quiz: 'quiz' })[nh.kind] || 'vocab'; }

  // ================================================================== CANH (mot canh / nhip) — tao, vao, don
  function canhTao(nh) {
    const el = mk('div', 'h-canh', null);        // dung roi gan vao the gioi (gan(c)) — do chu khong bi dung layout canh dang dung
    const k = st.k++;
    el.style.left = (k * st.W) + 'px';
    el.style.width = st.W + 'px'; el.style.height = st.H + 'px';
    const c = { el, k, W: st.W, H: st.H, hen: [], mo: {}, vao: false, font: FONT.doi };
    st.canhs.push(c);
    return c;
  }
  /** Gan canh vao the gioi THEO LO (~10 phan tu / khung): kieu dang & bo cuc cua canh moi khong don vao mot khung (>33 ms).
   *  Canh chua gan het thi chua chay hieu ung (c.chay) — cac hieu ung deu >= 0.15 s sau, nen khong thay tre. */
  const CHUNK = +(QS.get('hChunk') || 40);
  const gan = (c, cb) => {
    if (!c) return;
    if (cb) c.cb = cb;
    const xong = () => { if (!c.pronto) { try { soat(c); } catch (e) {} } c.pronto = true; const q = c.cho || []; c.cho = null; q.forEach((f) => f()); const f = c.cb; c.cb = null; if (f) f(); };
    if (!c.el || c.el.parentNode || !st.mundo) { if (c.pronto) xong(); return; }       // da gan (dung truoc): chi goi cb khi gan xong
    const kids = Array.from(c.el.children);
    c.el.textContent = '';
    // canh dung san (ngoai khung, chua toi luot): an han cho toi khi may quay toi (canhVao) — khong de chu "nam an" ngoai khung
    if (!c.vao) c.el.style.visibility = 'hidden';
    st.mundo.appendChild(c.el);
    let i = 0;
    const buoc = () => {
      if (!rangBuoc(c)) return;
      let n = 0;
      while (i < kids.length && n < CHUNK) { const k = kids[i++]; c.el.appendChild(k); n += 1 + k.getElementsByTagName('*').length; }
      if (i < kids.length) G.delayedCall(0.001, buoc); else xong();
    };
    // canh dau tien cua buoi (san khau vua mo, chua co canh nao): gan het mot lan — khung hinh dau khong con phai doi ~3 lo x 1 khung truoc khi canh hien
    if (giam() || c.dau1) { kids.forEach((k) => c.el.appendChild(k)); xong(); return; }
    buoc();
  };
  /** May quay truot toi canh c; canh cu go sau khi roi di (1.25 s) */
  // ---- CO MEO THEO KHOANG TRONG (may tinh): canh da dung xong -> neu goc phai duoi con trong, xin meo to hon (api.coMeo).
  // Bo cuc luon tinh theo hop meo chuan (st.meo); meo chi phong vao phan trong. Khoi moi them vao canh (goi y, the that,
  // giai thich...) -> tinh lai, can thi thu meo ve.
  const MEO_TO = 1.35;
  function coMeoCanh(c) {
    const api = st.api;
    if (!api || !api.coMeo || !c || !c.el || st.canh !== c) return;
    const m0 = st.meo;
    // hoi thoai: tam giay cau + o nghia doi kich thuoc / vi tri moi luot thoai (veLuot) ma khong sinh khoi moi -> khong biet cho trong sau nay: giu meo chuan
    if (st.dt || c.lu || !m0 || !m0.W || !m0.H || QS.get('hMeoTo') === '0') { api.coMeo(1); return; }
    const rs = [];
    for (const e of c.el.children) {
      if (!e.style || !e.style.left || /(^| )(h-vong|h-dau-x|h-mesur|h-gach)( |$)/.test(e.className)) continue;
      const w = e.offsetWidth || parseFloat(e.style.width) || 0, h = e.offsetHeight || parseFloat(e.style.height) || 0;
      if (w > 0 && h > 0) rs.push({ x: parseFloat(e.style.left) || 0, y: parseFloat(e.style.top) || 0, w, h });
    }
    let k = 1;
    for (let q = MEO_TO; q > 1.04; q -= 0.05) {
      const x = m0.W - (m0.W - m0.x) * q, y = m0.H - (m0.H - m0.y) * q;
      if (y < m0.H * 0.3) continue;
      if (!rs.some((r) => r.x + r.w > x + 8 && r.y + r.h > y + 8 && r.x < m0.W && r.y < m0.H)) { k = +q.toFixed(2); break; }
    }
    api.coMeo(k);
  }
  function theoDoiMeo(c) {
    try { if (st.moMeo) st.moMeo.disconnect(); } catch (e) {}
    st.moMeo = null;
    if (!c || !c.el || typeof MutationObserver !== 'function') return;
    let hen = 0;
    st.moMeo = new MutationObserver(() => { if (hen) return; hen = requestAnimationFrame(() => { hen = 0; coMeoCanh(c); }); });
    st.moMeo.observe(c.el, { childList: true });
    requestAnimationFrame(() => coMeoCanh(c));
  }
  function canhVao(c, nh, opt) {
    opt = opt || {};
    const cb = () => { if (c.chay) c.chay(); };
    const cu = st.canh && st.canh !== c ? st.canh : null;
    st.canh = c;
    c.vao = true;
    c.dau1 = !cu && !!(nh && nh.laBatDau) && !opt.nhanh;
    c.tVao = nowG();
    c.el.style.visibility = '';
    const dau = !cu && !!(nh && nh.laBatDau) && !(nh && nh.isResume) && !opt.nhanh;
    gan(c, cb);
    theoDoiMeo(c);
    camToi(c.k, !cu && !dau, dau);
    st.canhs.slice().forEach((o) => {
      if (o === c) return;
      const go = () => { try { o.el.remove(); } catch (e) {} st.canhs = st.canhs.filter((x) => x !== o); };
      if (giam() || !cu) go(); else { G.delayedCall(CAM.dur, () => { o.el.style.visibility = 'hidden'; }); G.delayedCall(CAM.dur + 0.3, go); }
    });
    if (cu && !giam()) snd('whoosh', 0.02);
  }
  const rangBuoc = (c) => c && c.el && c.el.isConnected;

  // ================================================================== DOI CO MAN HINH GIUA NHIP (cua so keo, xoay may, ban phim ao, thu phong)
  /** Co gian canh theo MOT ty le chung (khong meo chu / hinh tron), can giua, roi dat lai may quay theo be rong moi — du phong khi khong the dung lai canh */
  function coGianCanh(c) {
    if (!c || !c.el) return;
    const s = Math.min(st.W / c.W, st.H / c.H);
    c.el.style.transformOrigin = '0 0';
    c.el.style.transform = s === 1 ? '' : 'scale(' + s + ')';
    c.el.style.left = Math.round(c.k * st.W + (st.W - c.W * s) / 2) + 'px';
    c.el.style.top = Math.round((st.H - c.H * s) / 2) + 'px';
  }
  /** Go het canh cua che do va tra nhip cho the mac dinh (nhu khi dungNhip tra null): dien thoai nam ngang qua thap cho ban thiet ke doc */
  function traChoTheMacDinh(m) {
    huyPre();
    if (m) goAvatar(m);
    st.canhs.forEach((o) => { try { o.el.remove(); } catch (e) {} });
    st.canhs = []; st.canh = null; st.k = 0;
    try { if (st.moMeo) st.moMeo.disconnect(); } catch (e) {}
    st.moMeo = null;
    if (st.api && st.api.coMeo) { try { st.api.coMeo(1); } catch (e) {} }
    const san = L && L.parentNode;
    if (san && san.dataset) san.dataset.cdPhu = '';
    st.hand = true;
  }
  /** Dung lai canh cua nhip HIEN TAI o co moi (trang thai cuoi: moi thu da hien, khong hieu ung vao) — doi dang dien thoai / may tinh, xoay, doi co */
  function dungLaiCanh(nh, m, api) {
    huyPre();
    goAvatar(m);
    st.canhs.forEach((o) => { try { o.el.remove(); } catch (e) {} });
    st.canhs = []; st.canh = null; st.k = 0;
    m.daVe = false; m.gach = null; m.tokEl = {}; m.slot = null; m.goiY = null;
    datGhiDe(nh);
    INST = true;
    try {
      nenLai(true);
      const c = bauCanh(nh, api, m);
      canhVao(c, nh, { nhanh: true });
      hetCanh(c);
      if (nh.kind === 'kanji' && m.netO) veNet(m, c, 0);
      if (st.canh === c) soat(c);
    } finally { INST = false; }
  }
  function dungLaiCoMoi() {
    if (!L || !st.nhip) return;
    const cuDt = st.dt, cuNgan = st.ngan, W0 = st.W, H0 = st.H;
    doKhung(true);
    if (cuDt === st.dt && cuNgan === st.ngan && W0 === st.W && H0 === st.H) return;
    const nh = st.nhip, m = st.m, api = st.api, c = st.canh;
    const trongLuot = !!(m && m.slot && m.slot.isConnected);            // bai tap: the that dang nam trong o cua canh -> khong dung lai (se mat the)
    const tieuDe = !!(m && m.chuyen && !m.daVao);                       // canh tieu de dang chieu
    const dung = !!(m && api && DUNG[nh.kind] && !trongLuot && !tieuDe);
    // bai tap luot hoc vien (chua tra loi): dung lai canh o co moi, roi chuyen CHINH the that + chan the sang o dap an moi (khong con co gian mot ty le len ban cu: chu 11 px / cot giua man)
    if (trongLuot && nh.kind === 'quiz' && !st.ngan && api && m && !m.gGiai && !m.xs && m.slot) {
      const slot0 = m.slot;
      const nodes = Array.from(slot0.children).filter((n) => /(^| )(sk-cong|sk-the-chan)( |$)/.test(n.className));
      if (st.hand) { st.hand = false; const san = L.parentNode; if (san && san.dataset) san.dataset.cdPhu = '1'; }
      try {
        nodes.forEach((n) => n.remove());
        dungLaiCanh(nh, m, api);
        const slot = oBaiTapQuiz(m, st.canh);
        if (slot) { nodes.forEach((n) => slot.appendChild(n)); try { window.dispatchEvent(new Event('resize')); } catch (e) {} }
        else { nodes.forEach((n) => { try { n.remove(); } catch (e) {} }); }
        return;
      } catch (e) { try { console.warn('[h] dung lai o dap an', e); } catch (er) {} }
    }
    if (st.ngan) { if (!trongLuot) { traChoTheMacDinh(m); return; } }
    else if (st.hand) { st.hand = false; const san = L.parentNode; if (san && san.dataset) san.dataset.cdPhu = '1'; }
    if (dung) { dungLaiCanh(nh, m, api); return; }
    // the chuong / ket bai / canh tieu de / luot hoc vien: giu canh, co gian deu theo man moi, dat lai may quay + nen
    nenLai(true);
    st.canhs.forEach((o) => { o.el.style.left = (o.k * st.W) + 'px'; });
    coGianCanh(c);
    camToi(c ? c.k : 0, true);
  }

  // ================================================================== TIEU DE BAI (nhip dau buoi giang)
  const CAP_VN = { N5: 'N5 sơ cấp', N4: 'N4 sơ cấp', N3: 'N3 trung cấp', N2: 'N2 thượng trung cấp', N1: 'N1 thượng cấp', KANA: 'Nhập môn' };
  function tenBai(bai) {
    const t = String((bai && bai.title) || '');
    const m = /^Bài\s*\d+\s*[:.\-–]\s*(.*)$/i.exec(t);
    const rest = m ? m[1] : t;
    const parts = rest.split(/\s+[—–]\s+/);
    return { ten: parts[0].trim(), phu: (parts[1] || '').trim() };
  }
  /**
   * Chu to trong o cua so vom (khong co anh): chi dung phan NHIN THAY — duoi huy hieu (treo ~82 ben trong) va tren mep co truoc
   * (cua so cam xuong co). Cac chu (vd あ・か・さ / 単語) xep thanh LUOI cot x hang cho chu to nhat (truoc: xep doc -> cot chu hep
   * giua o rong, thua cho). gl: mang chuoi (moi phan tu mot o luoi).
   */
  function oChuVom(rv, gl) {
    const hu = st.hu, dt = st.dt;
    const yDay = Math.min(rv.y + rv.h, Math.round(st.H * (dt ? 0.86 : 0.78)));
    const tren = Math.round(58 * hu), duoi = Math.max(Math.round(tren * 0.8), Math.round(rv.y + rv.h - yDay + 20 * hu - 32 * hu));   // dem duoi ~ dem tren (can doi)
    const visH = rv.h - 64 * hu - tren - duoi, visW = rv.w - 64 * hu;
    const n = Math.max(1, gl.length), maxC = Math.max(1, ...gl.map((g) => kyTu(g).length));
    let best = { fg: 0, cols: 1 };
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols);
      // be ngang hang = n x 1,15 em (letter-spacing .15 em sau moi chu) + 0,15 em dem trai (can doi chu, khong de hop vuot cua so: truoc day margin am day hop sang phai, mep chu bi cat); 0,76 / 0,84: chua le + vom tron phia tren cua so cat goc hang dau
      const fg = Math.floor(Math.min(visW * (dt ? 0.78 : 0.9) / (cols * maxC * 1.15 + 0.15), visH * (dt ? 0.9 : 0.96) / (rows * 1.04), rv.w * 0.58));   // dien thoai: cua so hep -> chua le ngang rong hon
      if (fg > best.fg) best = { fg, cols };
    }
    const fg = Math.max(20, best.fg), rows = [];
    for (let i = 0; i < n; i += best.cols) rows.push(gl.slice(i, i + best.cols));
    return '<div class="h-vglyph" lang="ja" style="top:' + tren + 'px;bottom:' + duoi + 'px">' + rows.map((r) => '<span style="font-size:' + fg + 'px;letter-spacing:.15em;padding-left:.15em">' + r.map(esc).join('') + '</span>').join('') + '</div>';
  }
  function dungTieuDe(nh, api, m, c) {
    const bai = nh.bai || {};
    const hu = st.hu, dt = st.dt;
    const t = tenBai(bai);
    const cd = String(nh.capDo || '').toUpperCase();
    // cap do: nhan chinh (N5 / かな) tren nhan treo + ten cap (Sơ cấp...) tren giay "Bai N" — chi noi dung bai, khong loi chao cua Sensei
    const capTen = viet1(String(CAP_VN[cd] || cd).replace(/^N\d\s*/i, ''));
    const capLon = cd === 'KANA' ? 'かな' : cd;
    const nhanCap = 'Tiếng Nhật · ' + capTen;
    const so = bai.lessonNumber != null ? bai.lessonNumber : '';
    const L1 = { d: { vom: R(100, 92, 690, 870), chao: R(880, 70, 500, 230), bai: R(870, 330, 520, 270), ruy: R(846, 624, 568, 104), chip: R(870, 748, 520, 72) },
      p: { vom: R(12, 78, 156, 360), chao: R(176, 76, 204, 96), bai: R(178, 184, 200, 120), ruy: R(172, 318, 214, 58), chip: R(178, 388, 200, 50) } };
    const rv = RC('vom', { d: L1.d.vom, p: L1.p.vom });
    // anh: tranh canh bai, khong co thi anh tu dau tien, khong co nua thi chu to
    let anh = bai.sceneImageUrl || null;
    let noiDung = '';
    if (!anh) {
      const v1 = (bai.vocabList || []).find((x) => x && x.imageUrl);
      if (cd !== 'KANA' && v1) anh = v1.imageUrl;
      else {
        let gl = (bai.kanjiList || []).slice(0, 3).map((k) => k && k.character).filter(Boolean);
        // bai khong co chu Han / chu cai (nhap mon: chao hoi, so dem): chu dau cua cac tu vung (khong de o cua so trong tron)
        if (!gl.length) gl = Array.from(new Set((bai.vocabList || []).map((v) => kyTu(String((v && (v.word || v.kanji)) || '').trim())[0]).filter((x) => x && RE_JP.test(x)))).slice(0, 3);
        // chu to trong o cua so (vl3 = vom thu vao 32 moi phia): chi dung phan NHIN THAY — duoi huy hieu so bai (treo ~82 ben trong)
        // va tren mep co truoc (cua so cam xuong co); am ghep 2 chu (きゃ) chia theo so chu dai nhat
        noiDung = oChuVom(rv, gl);
      }
    }
    const V = vom(c.el, rv, { anh, iw: anh ? Math.max(rv.w * 1.04, (rv.w - 64 * hu) * 1.05, Math.min(rv.h, st.H * (dt ? 0.86 : 0.78) - rv.y) - 40 * hu) : 0,   /* anh vuong phu kin phan cua so nhin thay (dien thoai: cua so cao hep) */ iy: -10 * hu, khoa: '<small>' + esc(cd === 'KANA' ? 'NHẬP' : cd) + '</small>' + esc(so), noiDung });
    if (!giam()) ft(V.el, { y: 360 * st.sy }, { y: 0, duration: 1.2, ease: 'power3.out', delay: 0 });
    c.vom = V;
    // chao
    const rch = RC('chao', { d: L1.d.chao, p: L1.p.chao });
    // chu cap do vua be ngang nhan treo (360 px: khong tran mep / de len giay "Bai N" ben duoi)
    const fChao = Math.max(20, fit(esc(capLon), { w: rch.w - (dt ? 60 : 90) * hu, h: rch.h * 0.5, max: dt ? 40 : Math.round(110 * hu), min: 20, lh: 1.1, cls: 'h-r-bai', nowrap: true, txt: capLon }));
    // dien thoai: nhan treo thap (96) -> bo dong nhan nho (tung chui duoi lo treo / tran mep), chi chu cap do duoi lo
    const chao = treo(c.el, rch, (dt ? '' : '<div class="h-nhan" style="margin-top:' + Math.round(74 * hu) + 'px">Cấp độ</div>') +
      '<div class="h-jpf h-chao" lang="ja" style="font-size:' + fChao + 'px;margin-top:' + Math.round(dt ? 72 * hu : 6 * hu) + 'px">' + esc(capLon) + '</div>');
    // Bai N
    const rb_ = RC('bai', { d: L1.d.bai, p: L1.p.bai });
    const baiEl = giay(c.el, rb_, '<div class="h-nhan" style="letter-spacing:' + (dt ? '.08em' : '.3em') + ';white-space:normal;text-align:center;line-height:1.35">' + (dt ? esc('Tiếng Nhật') + '<br>' + esc(capTen) : esc(nhanCap)) + '</div><div class="h-bai-so h-r-bai" style="font-size:' + fit(esc('Bài ' + so), { w: rb_.w - 50 * hu, h: rb_.h, max: T('bai').max, min: T('bai').min, lh: 1, cls: 'h-r-bai', nowrap: true, txt: 'Bài ' + so }) + 'px">Bài ' + esc(so) + '</div>', 'h-bai');   // so bai 2 chu so: vua be ngang giay
    const sau = giay(c.el, rb_, '', 'h-bai-sau');
    c.el.insertBefore(sau, baiEl);
    // ruy ten bai
    const rr_ = RC('ruy', { d: L1.d.ruy, p: L1.p.ruy });
    let rt = coVua('tieude', t.ten, rr_.w - 100 * hu, rr_.h - 30 * hu, { lines: 2, lh: 1.08, max: T('tieude').max * 1.05, cls: 'ruyc' });
    // ten bai dai (chu bi ep nho trong ruy hep): ruy rong them toi mep goc meo / mep man (may tinh), chu to hon — khong de dai ruy rong, chu nho giua
    if (!dt && rt.fs < T('tieude').max * 0.8) {
      const gioiHan = st.meo && rr_.y + rr_.h > st.meo.y - 8 ? st.meo.x - 14 - rr_.x : st.cw1 - 30 - rr_.x;
      const wMoi = Math.min(gioiHan, Math.round(rr_.w * 1.32));
      if (wMoi > rr_.w + 20) { rr_.w = wMoi; rt = coVua('tieude', t.ten, rr_.w - 100 * hu, rr_.h - 30 * hu, { lines: 2, lh: 1.08, max: T('tieude').max * 1.05, cls: 'ruyc' }); }
    }
    // ten bai ngan (mot dong): ruy bang om chu (can giua theo cot giay "Bai N"), khong de chu nho giua ruy dai
    { const w1 = rongChu(t.ten, 'h-r-ruyc', rt.fs) * 1.04;
      if (w1 <= rr_.w - 100 * hu) { const wM = Math.round(Math.max(w1 + 110 * hu, rr_.w * 0.55)); if (wM < rr_.w) { rr_.x = Math.round(rr_.x + (rr_.w - wM) / 2); rr_.w = wM; } } }
    // ten bai dai (o co nho nhat van hon 2 dong): ruy cao them cho du so dong that, khong de chu sat mep tren / duoi
    { const hT = doHop(esc(t.ten), 'h-ruyc h-r-ruyc', rt.fs, 1.08, rr_.w - 88 * hu).h;
      if (hT + 18 * hu > rr_.h) { const them = Math.ceil(hT + 18 * hu - rr_.h); rr_.y -= Math.round(them / 2); rr_.h += them; }
      // ten ngan / mot dong: ruy om chu theo chieu cao (giu tam doc) — chu khong lot giua dai cao, tran (thua) dem deu tren / duoi
      else { const hMoi = Math.max(Math.round(hT + 28 * hu), Math.round(rr_.h * 0.62)); if (hMoi < rr_.h) { rr_.y += Math.round((rr_.h - hMoi) / 2); rr_.h = hMoi; } } }
    { const yTren = rb_.y + rb_.h + Math.round(6 * st.sy); if (rr_.y < yTren) rr_.y = yTren; }
    const RB = ruy(c.el, rr_, '<span class="h-ruyc" style="font-size:' + rt.fs + 'px">' + esc(t.ten) + '</span>');
    // chip: mau cau / ngu phap chinh cua bai
    const rc_ = RC('chip', { d: L1.d.chip, p: L1.p.chip });
    { const yDuoi = rr_.y + rr_.h + Math.round((dt ? 8 : 14) * st.sy); if (rc_.y < yDuoi) rc_.y = yDuoi; }
    // moi muc chip giu tron mot dong (h-jw nowrap): xuong dong chi o dau ·, khong be "4 mẫu | câu"
    const jwChip = (x) => '\u0002' + x + '\u0003';
    let chipItems = t.phu ? t.phu.split(/\s*\/\s*/).filter(Boolean).slice(0, 7) : [];
    if (!chipItems.length) chipItems = [(bai.vocabList || []).length && ((bai.vocabList || []).length + ' từ mới'), (bai.slides || []).length && ((bai.slides || []).length + ' mẫu câu'), (bai.kanjiList || []).length && ((bai.kanjiList || []).length + (cd === 'KANA' ? ' chữ cái' : ' chữ Hán'))].filter(Boolean);
    const chipTxt = chipItems.map(jwChip).join(' <i>·</i> ');
    let chipHtml2 = null;
    const boMoc = (x) => x.replace(/[\u0002\u0003]/g, '');
    let fchip = fit(boMoc(chipTxt).replace(/<i>·<\/i>/g, '·'), { w: rc_.w - 36 * hu, h: rc_.h - 10 * hu, max: 27 * hu / (dt ? 1 : 1), min: dt ? 13 : 16, lh: 1.15, cls: 'h-r-chip', nowrap: true, txt: boMoc(chipTxt).replace(/<i>·<\/i>/g, '·') });
    let chipWrap = false;
    {
      const plain_ = boMoc(chipTxt).replace(/<i>·<\/i>/g, '·');
      if (rongTuNhien(esc(plain_), 'h-r-chip', fchip, plain_) > rc_.w - 36 * hu) {
        chipWrap = true;
        let f2 = fit(esc(plain_), { w: rc_.w - 36 * hu, h: rc_.h * 2 - 10 * hu, max: 27 * hu, min: dt ? 13 : 16, lh: 1.2, cls: 'h-r-chip', lines: 2, txt: plain_ });
        // xuong dong THEO MUC (khong be o dau '·': '20 từ mới · 4 mẫu câu / · 5 chữ Hán'): chia cac muc thanh 2 dong can bang, dau · chi nam GIUA hai muc cung dong
        if (chipItems.length >= 2) {
          let best = null;
          for (let q = 1; q < chipItems.length; q++) {
            const a = chipItems.slice(0, q).join(' · '), b = chipItems.slice(q).join(' · ');
            const wq = Math.max(rongChu(a, 'h-r-chip', f2), rongChu(b, 'h-r-chip', f2));
            if (!best || wq < best.w) best = { w: wq, a, b };
          }
          const fL = fit(esc(best.a.length > best.b.length ? best.a : best.b), { w: rc_.w - 36 * hu, h: rc_.h, max: 27 * hu, min: dt ? 13 : 16, lh: 1.2, cls: 'h-r-chip', nowrap: true, txt: best.a.length > best.b.length ? best.a : best.b });
          f2 = fL;
          chipHtml2 = '<span class="h-jw">' + esc(best.a) + '</span><br><span class="h-jw">' + esc(best.b) + '</span>';
        }
        fchip = f2;
        rc_.h = Math.round(2 * f2 * 1.2 + 22 * hu);
      }
    }
    const chip = giay(c.el, rc_, '<span class="h-jpf h-chiptxt" style="font-size:' + fchip + 'px' + (chipWrap ? ';white-space:normal;text-align:center;line-height:1.2' : '') + '">' + (chipHtml2 || jp(chipTxt).replace(/&lt;i&gt;·&lt;\/i&gt;/g, '<i>·</i>').replace(/\u0002/g, '<span class="h-jw">').replace(/\u0003/g, '</span>')) + '</span>', 'h-chip');
    // ---- thoi gian
    c.chay = () => {
      A.tha(chao, tre('tieuTag'), Math.max(760 * hu, rch.y + rch.h + 40));
      snd('ding', tre('tieuTag') + 0.02);
      A.lat(baiEl, tre('tieuBai'));
      A.hien(sau, tre('tieuBai') + 0.35, 0.05);
      ft(sau, { rotation: 0, x: 0, y: 0 }, { rotation: 3, x: 12 * hu, y: 14 * hu, duration: D(0.6), ease: 'back.out(2)', delay: tre('tieuBai') + 0.35 });
      snd('tick', tre('tieuBai') + 0.02);
      A.ruy(RB.w, tre('tieuRuy'), 0.7);
      snd('ding', tre('tieuRuy') + 0.02);
      A.hien(chip, tre('tieuChip'), 0.12);
      ft(chip, { y: 26 * hu / 0.75 }, { y: 0, duration: D(0.7), ease: 'back.out(1.6)', delay: tre('tieuChip') });
    };
    c.het = () => { [chao, baiEl, sau, RB.w, chip].forEach((e) => { G.killTweensOf(e); G.set(e, { autoAlpha: 1, y: 0, rotation: e === sau ? 3 : 0, x: e === sau ? 12 * hu : 0, rotationX: 0, scale: 1, scaleX: 1 }); }); };
  }

  // ================================================================== TU VUNG
  /** Chon (rong nhan, so dong, co chu) cho tu chinh tren nhan treo — lon nhat vua; tra { w, lines, fs } (w: px that) */
  function chonNhanTu(tu, rongNen, rongMax, hMax, heSo) {
    const hu = st.hu, dt = st.dt;
    // 2 cot (heSo): be ngang the tang dan tu rongNen toi rongMax (dung khi chu dat >= 80 % co toi da)
    const ws = heSo ? Array.from(new Set([1, 1.13, 1.27, 1.4].map((k) => Math.min(Math.round(rongMax), Math.round(rongNen * k))))) : (dt ? (rongMax > rongNen + 30 ? [rongNen, Math.round(Math.min(rongMax, rongNen * 1.55))] : [rongNen]) : [540, 640, 760, 860].map((x) => Math.min(x * st.sx, rongMax)));
    const tk = T('kanji');
    if (heSo) tk.max *= heSo;     // bo cuc 2 cot (khong anh): tu chinh to hon 1,5 - 1,8 lan
    const html = (s) => esc(s);
    const khoang = 70 * hu;
    let best = null;
    const thu = (w, lines) => {
      // nhieu dong: do DOM (lang ja -> xuong dong theo cum tu auto-phrase nhu khi hien: よろしく|お願いします), mot dong: canvas
      const fs = lines > 1 ? fit('<span lang="ja" style="word-break:keep-all">' + wbrJa(tu) + '</span>', { w: w - khoang, h: hMax * 0.9, max: tk.max, min: tk.min, lh: 1.02, cls: 'h-r-kanji', lines })
        : fit(html(tu), { w: w - khoang, h: hMax * 0.9, max: tk.max, min: tk.min, lh: 1, cls: 'h-r-kanji', nowrap: true, lines, txt: tu });
      const fsH = Math.floor((hMax - 276 * hu) / (lines * (lines > 1 ? 1.02 : 1)));
      let fe = Math.min(fs, Math.max(tk.min, fsH));
      // mot dong ma o co nho nhat van tran be ngang (cum dai o man hep): co chu THAT sau khi thu cho vua — de so sanh cac be rong thu (rong hon = chu to hon)
      // (+ 7 %: letter-spacing .02 em cua nhan treo + sai so canvas — khong de chu tran mep nhan / man hinh)
      if (lines === 1) { const rc = rongChu(tu, 'h-r-kanji', fe) * 1.07; if (rc > w - khoang) fe = Math.max(dt ? 13 : 14, Math.floor(fe * (w - khoang) / rc)); }
      return { w, lines, fs: fe };
    };
    for (const w of ws) { const c1 = thu(w, 1); if (!best) best = c1; if (c1.fs >= tk.max * (heSo ? 0.8 : 0.68) || (!heSo && c1.fs >= 150 * hu / 0.75)) { best = c1; break; } if (c1.fs > best.fs) best = c1; }
    if (best.fs < tk.max * 0.55 && kyTu(tu).length > 4 && soTu(tu) >= 2 && !/[／/・]/.test(tu) && wbrJa(tu).indexOf('<wbr>') >= 0) {   // 2 dong chi khi co ranh gioi tu HOP LE (<wbr>: hau to kana da dinh vao tu truoc thi khong con diem ngat -> khong xuong dong duoc)
      for (const w of ws) { const c2 = thu(w, 2); if (c2.fs > best.fs * 1.18) { best = c2; if (c2.fs >= tk.max * 0.55) break; } }
    }
    // da toi co nho nhat ma mot dong van tran khung (vd. 止めます／辞めます tren dien thoai): xuong 2 dong, van tran thi thu chu cho vua
    const Wn = best.w - khoang;
    if (best.lines === 1 && rongChu(tu, 'h-r-kanji', best.fs) > Wn) {
      const c2 = thu(best.w, 2);
      // chi xuong 2 dong khi tu CO ranh gioi tu hop le (<wbr>; hau to kana ngan da dinh vao tu truoc — 心掛け|ます khong con diem ngat): khong co thi thu nho chu cho vua 1 dong
      if (wbrJa(tu).indexOf('<wbr>') >= 0 && soDong(tu, 'h-r-kanji', c2.fs, Wn) <= 2) best = c2;
      else best = Object.assign({}, best, { fs: Math.max(st.dt ? 13 : 14, Math.floor(best.fs * Wn / rongChu(tu, 'h-r-kanji', best.fs))) });
    }
    if (best.lines > 1 && soDong(tu, 'h-r-kanji', best.fs, Wn) > best.lines) best = Object.assign({}, best, { fs: Math.max(st.dt ? 13 : 14, Math.floor(best.fs * 0.85)) });
    // dien thoai het cho (ngan sach cao khong du chu toi thieu cho 2 dong): 1 dong, be ngang toi da — nghia + dai ghi chu duoi nhan khong bi cat
    if (dt && best.lines > 1 && Math.floor((hMax - 276 * hu) / (best.lines * 1.02)) < tk.min) {
      const c1 = thu(Math.max(best.w, Math.round(rongMax)), 1);
      if (c1.fs >= 26) best = c1;
    }
    // DOAN KHONG NGAT DUOC dai nhat (keep-all + <wbr>: ありがとうございます la mot cum) phai vua be ngang trong cua nhan: truoc het mo rong nhan toi rongMax,
    // roi ha co chu (duoi ca san cua vai) — khong de chu tran ra ngoai nhan / man hinh (T('kanji').min = 34 px lam fit tra 34 du cum khong vua)
    {
      const dsDoan = best.lines > 1 ? wbrJa(tu).split('<wbr>').map((x) => x.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')) : [tu];
      const rongDoan = (f) => Math.max(...dsDoan.map((x) => rongChu(x, 'h-r-kanji', f))) * 1.07;
      const can = rongDoan(best.fs) + khoang;
      if (can > best.w + 1 && best.w < rongMax - 1) best = Object.assign({}, best, { w: Math.min(Math.round(rongMax), Math.ceil(can)) });
      const Wn1 = best.w - khoang, r1 = rongDoan(best.fs);
      if (r1 > Wn1) best = Object.assign({}, best, { fs: Math.max(dt ? 13 : 14, Math.floor(best.fs * Wn1 / r1)) });
    }
    // co san (13 / 14 px) ma van tran 2 dong: cho them dong (nhan treo cao theo so dong), khong ha chu duoi san
    { const hh = doHop('<span lang="ja" style="word-break:keep-all">' + wbrJa(tu) + '</span>', 'h-r-kanji', best.fs, 1.02, Wn, 'ja').h, n = Math.max(1, Math.round(hh / (best.fs * 1.02)));
      if (best.lines > 1 && n > best.lines) {
        // so dong that (cum tu) nhieu hon uoc: ha co cho vua chieu cao da tinh; da cham san thi them dong
        const f2 = Math.floor(best.fs * best.lines / n);
        best = f2 >= tk.min ? Object.assign({}, best, { fs: f2 }) : Object.assign({}, best, { fs: Math.max(st.dt ? 13 : 14, f2), lines: Math.min(4, n) });
      } }
    return best;
  }
  function dungTuVung(nh, api, m, c) {
    const v = nh.data || {};
    const hu = st.hu, dt = st.dt;
    const tu = String(v.kanji || v.word || '');
    const coRuby = !!(v.kanji && v.furigana && v.furigana !== v.kanji);
    const doc = coRuby ? v.furigana : (v.word && v.word !== tu ? v.word : '');
    const romaji = String(v.romaji || '');
    const ng = tachNghia(v.meaningVi);
    const loai0 = C.loaiTu(v.wordType), loai = kyTu(loai0).length <= 10 ? loai0 : '';
    const luu = String(v.accentNote || '').trim();
    const co = nh.chuong || {};
    const anh = v.imageUrl || null;
    const L2 = {
      d: { vom: R(110, 92, 690, 870), tagX: 860, tagY: 96, gapW: 540, dan: R(138, 716, 640, 110) },
      p: { vom: R(10, 76, 160, 250), tagX: 176, tagY: 78, gapW: 206, dan: R(12, 464, 366, 90) },
    };
    const Lx = dt ? L2.p : L2.d;
    const coAnh = !!anh;
    // may tinh KHONG anh: bo cuc 2 cot dac (the tu to ben trai; nghia + dan xep doc ben phai, dan hep de chua goc meo) thay cho cot giua thua (khung chi 13 % noi dung)
    const haiCot = !dt && !anh;
    const xL = Math.round(st.xo + 110 * st.sx), xR = st.cw1 - Math.round(110 * st.sx), yBot = Math.round(st.H * 0.80);
    // ---- nhan treo
    const tagX = haiCot ? xL : px(R(Lx.tagX, 0, 1, 1)).x;
    // dien thoai khong anh: nhan treo can giua man, duoc rong toi gan het be ngang (cum dai: どうぞよろしくお願いします khong con 13 px)
    const rongMax = haiCot ? Math.round(0.56 * (xR - xL)) : (!coAnh && dt ? Math.round(390 * st.sx - 24 * st.sx) : st.cw1 - tagX - (dt ? 6 * st.sx : 60 * st.sx));
    // chua cho phia duoi nhan treo: o nghia (+ dai ghi chu am khi khong co anh: dai nam ngay duoi o nghia) — nhan treo cao qua
    // thi o nghia bi ep con vai px (chu bi cat / mo)
    const coDanDuoi = !!String(v.accentNote || '').trim() && !anh;
    const hMax = st.H - px(R(0, Lx.tagY, 1, 1)).y - (dt ? (coDanDuoi ? (kyTu(tu).length > 7 ? 300 : 340) : 250) * st.sy : (coDanDuoi ? (kyTu(tu).length > 7 && !ng.phu ? 500 : 560) : 330) * st.sy);   // cum dai (> 7 chu): chua it cho hon de chu chinh khong con 13 px; tu ngan giu nguyen
    // tu dai (止めます／辞めます 2 dong chu 130 px) an het cho: o nghia con vai chuc px, chu 14 px, dong phu bi cat het. Chua truoc cho vua du de nghia doc duoc
    // (nghia ~26 px may tinh / 19 px dien thoai, dong phu co toi thieu) duoi nhan treo, roi moi chon co chu cho tu
    let hMaxTag = hMax;
    {
      const wG0 = dt ? px(R(0, 0, 206, 1)).w : Math.round(540 * st.sx);
      const fnN = Math.round(dt ? 19 : 35 * hu), fpN = Math.round(Math.max(dt ? 13 : 14, 18 * hu));
      const htmlT = '<div class="h-nghia h-r-nghia" style="font-size:' + fnN + 'px">' + jp(ng.chinh || v.meaningVi || '') + '</div>' + (ng.phu ? '<div class="h-phu h-r-phu" style="line-height:' + LH_VJ + ';font-size:' + fpN + 'px">' + jp(ng.phu) + '</div>' : '');
      const need = 52 * hu + 36 * hu + caoNoiDung(htmlT, wG0 - 52 * hu) + 8;
      // dai ghi chu am (khong anh) nam NGAY DUOI o nghia: chua luon cho no (uoc theo be ngang toi da cua nhan) — truoc day nhan treo an het cho, dai de len o nghia
      let hDanUoc = 0;
      if (coDanDuoi) {
        const wDu = Math.max(120, Math.min(rongMax + Math.round(240 * st.sx), st.cw1 - Math.round(16 * st.sx)) - Math.round(40 * hu));
        const fDu = coVua('dan', luu, wDu, (dt ? Math.round(200 * st.sy) : 110 * st.sy), { lh: LH_VJ, lines: dt ? 7 : 3, cat: true, jpx: 1 });
        hDanUoc = Math.round((Math.max(1, fitLines(fDu.text, fDu.fs, wDu, 'h-r-dan', LH_VJ, true)) + 0.25) * fDu.fs * LH_VJ + 30 * hu + 32 * st.sy);
      }
      const hTrongTag = Math.round(st.H * (dt ? 0.80 : 0.78)) - px(R(0, Lx.tagY, 1, 1)).y - (!dt && coAnh ? Math.round(56 * st.sy) : 0) - Math.round(24 * hu) - need - hDanUoc;
      if (hTrongTag > 276 * hu + T('kanji').min) hMaxTag = Math.min(hMax, hTrongTag);
      else if (dt && coDanDuoi && !coAnh) hMaxTag = Math.max(1, Math.min(hMax, hTrongTag));   // het cho: nhan treo nho nhat (1 dong), nghia + dai ghi chu doc du
      if (haiCot) hMaxTag = yBot - px(R(0, Lx.tagY, 1, 1)).y;    // 2 cot: the tu cao het be san khau (nghia + dan nam ben phai, khong duoi the)
    }
    const ch = haiCot ? chonNhanTu(tu, Math.round(0.4 * (xR - xL)), rongMax, hMaxTag, kyTu(tu).length <= 2 ? 1.8 : 1.5)
      : chonNhanTu(tu, dt ? px(R(0, 0, 206, 1)).w : 540 * st.sx, coAnh ? rongMax : Math.min(rongMax, 860 * st.sx), hMaxTag);
    const tagW = ch.w;
    // vien romaji: co chu vua be ngang nhan (tu dai: douzo yoroshiku onegaishimasu); van dai thi xuong dong -> nhan cao them
    const kR = haiCot ? 1.45 : 1;     // 2 cot: furigana / romaji to hon theo tu chinh to
    const fRom0 = Math.round(Math.max(T('romaji').min, Math.min(T('romaji').max * kR, ch.fs * 0.155)));
    const fRomV = Math.max(dt ? 13 : 14, Math.min(fRom0, Math.floor((tagW - 70 * hu) / Math.max(1, kyTu(romaji).length * 0.62))));
    const dongRom = romaji ? Math.max(1, Math.ceil(rongChu(romaji, 'h-r-ro', fRomV) * 1.1 / Math.max(40, tagW - 40 * hu - 1.56 * fRomV))) : 1;
    let tagH = Math.round(276 * hu + ch.lines * ch.fs * (ch.lines > 1 ? 1.02 : 1) - (dt ? 40 * hu : 0) + (dongRom - 1) * fRomV * 1.15 + (haiCot ? Math.round(0.07 * ch.fs) : 0));    // 2 cot: +0,07 em: hop chu cao cua chu to khong de len chip romaji
    // 2 cot: the tu cao ~ 92 % be san khau (tu ngan khong de the thap cut) — phan du chia vao khoang tren / duoi tu chinh
    let dTag = 0;
    if (haiCot) { const hT = yBot - px(R(0, Lx.tagY, 1, 1)).y, hMoi = Math.min(hT, Math.max(tagH, Math.round(0.92 * hT))); dTag = hMoi - tagH; tagH = hMoi; }
    let tagXx = coAnh || haiCot ? tagX : Math.round((st.xo + st.cw1 - tagW) / 2);
    const tagY0 = px(R(0, Lx.tagY, 1, 1)).y + ((!dt && coAnh && tagX + tagW > st.cw1 - 440 * st.sx) ? Math.round(56 * st.sy) : 0);
    const rTag = ovPos('tag', { x: tagXx, y: tagY0, w: tagW, h: tagH });
    const fRuby = doc ? Math.max(T('ruby').min, Math.min(T('ruby').max * kR, ch.fs * (haiCot ? 0.27 : 0.236), (tagW - 60 * hu) / (kyTu(doc).length * 1.06))) : 0;
    const rubyH = Math.round(doc ? fRuby + 26 * hu : 20 * hu);
    const fRom = Math.round(Math.max(T('romaji').min, Math.min(T('romaji').max, ch.fs * 0.155)));
    const tagHtml = '<div class="h-nhan" style="margin-top:' + Math.round(78 * hu) + 'px">' + esc(loai || 'Từ vựng') + ' <b>· ' + so2(co.i || nh.i + 1) + ' / ' + so2(co.n || nh.n) + '</b></div>' +
      '<div class="h-dau-chu" style="margin-top:' + Math.round(dt ? (doc ? fRuby + 22 * hu : 22 * hu) : 78 * hu + dTag * 0.5) + 'px"><span class="h-rb h-kanji-to h-r-kanji" lang="ja" style="font-size:' + ch.fs + 'px;' + (ch.lines > 1 ? 'white-space:normal;word-break:keep-all;text-align:center;line-height:1.02;max-width:' + (tagW - 60 * hu) + 'px' : '') + '">' + (ch.lines > 1 ? wbrJa(tu) : esc(tu)) +
      (doc ? '<span class="h-rt h-an" style="font-size:' + Math.round(fRuby) + 'px;bottom:calc(100% + ' + Math.round(4 * hu) + 'px)">' + esc(doc) + '</span>' : '') + '</span></div>' +
      (romaji ? '<div class="h-romaji h-an" style="margin-top:' + Math.round(14 * hu + dTag * 0.3 + (haiCot ? 0.07 * ch.fs : 0)) + 'px;' + (haiCot ? 'padding:.16em .55em .22em;' : '') + 'font-size:' + fRomV + 'px;white-space:normal;text-align:center;max-width:' + Math.round(tagW - 40 * hu) + 'px;line-height:1.15">' + esc(romaji) + '</div>' : '');
    const tag = treo(c.el, rTag, tagHtml);
    const rt = tag.querySelector('.h-rt'), rom = tag.querySelector('.h-romaji');
    c.tag = tag;
    // ---- cua so vom (anh)
    let V = null;
    if (coAnh) {
      const rv = RC('vom', { d: L2.d.vom, p: L2.p.vom });
      V = vom(c.el, rv, { anh, iw: (rv.w - 64 * hu) * (dt ? 2.3 : 1.12), iy: dt ? -rv.w * 0.18 : 4 * hu, cua: so2(co.i || nh.i + 1), khoa: '<small>TỪ</small>' + esc(co.i || nh.i + 1) });
    }
    // ---- ghi chu nghia
    // 2 cot: cot phai (x tu mep the tu + 56 den le phai, y tu duoi the chuong den day the tu): o nghia (rong het cot) tren, dan duoi (hep: chua goc meo)
    let hc = null;
    if (haiCot) {
      const xC = rTag.x + rTag.w + Math.round(56 * st.sx), yC0 = Math.round(160 * st.sy), yC1 = rTag.y + rTag.h;
      const mx = st.meo ? st.meo.x : st.cw1, yCat = st.meo ? st.meo.y + 28 : yC1;     // goc meo that: meo.y + 36 (tru them 8 px le)
      const wC = xR - xC, gapY = Math.round(34 * hu);
      hc = { xC, yC0, yC1, wC, gapY, yCat, wS: wC, hS: 0, fd: null, hGav: 0, danHep: true };
      if (luu) {
        // dan nam duoi o nghia: hep den sat meo khi con du cho (>= 300 px), neu khong thi rong het cot nhung phai nam TREN dau meo
        const hepW = mx - 22 - xC;     // 8 px le + 14 px nghieng cua dan (xoay -1,5 do)
        hc.danHep = hepW >= 300 * st.sx;
        hc.wS = hc.danHep ? Math.min(wC, hepW) : wC;
        hc.fd = coVua('dan', luu, hc.wS - 56 * hu, Math.round(0.4 * (yC1 - yC0)), { lh: LH_VJ, lines: 7, cat: true, jpx: 1, max: T('dan').max * 1.15, min: 20 });
        hc.hS = Math.round((Math.max(1, fitLines(hc.fd.text, hc.fd.fs, hc.wS - 56 * hu, 'h-r-dan', LH_VJ, true)) + 0.25) * hc.fd.fs * LH_VJ + 30 * hu);
      }
      // cao toi da cua o nghia: phai ket thuc TREN dau meo (o rong het cot); co dan: con du cho cho dan
      hc.hGav = Math.max(150 * hu, (luu ? (hc.danHep ? Math.min(yCat - yC0, yC1 - yC0 - hc.hS - gapY) : yCat - yC0 - hc.hS - gapY) : yCat - yC0));
    }
    const gy = haiCot ? hc.yC0 : rTag.y + rTag.h + Math.round(24 * hu);
    let gW = haiCot ? hc.wC : (coAnh ? (dt ? px(R(0, 0, 206, 1)).w : rTag.w) : rTag.w);
    const gX = haiCot ? hc.xC : (coAnh ? rTag.x : rTag.x);
    let gHmax = haiCot ? Math.round(hc.hGav) : (dt ? Math.round(st.H * 0.80) : Math.round(st.H * 0.78)) - gy;   // may tinh: dung tren mep co truoc (~0,79 H)
    // o nghia theo be ngang the tu: tu dai (助かります) -> o lan sang cot cua meo -> dung tren dau meo (meo that = st.meo.y + 36),
    // khong du cao thi thu hep o cho het cot meo
    if (!dt && !haiCot && st.meo && gX + gW > st.meo.x + 4) {
      const tranMeo = st.meo.y + 36 - 8 - gy;
      if (tranMeo >= 170 * hu) gHmax = Math.min(gHmax, tranMeo);
      else gW = Math.max(Math.round(gW * 0.6), st.meo.x - 8 - gX);
    }
    if (luu && !coAnh && !haiCot) {
      // khong anh: dai ghi chu nam NGAY DUOI o nghia -> chua cho cho no (truoc day o nghia cao het co thi dai bi day len de len dong nghia phu)
      // cung cach tinh voi doan dai phia duoi (x, be ngang kep trong man, tru goc meo o vi tri thap nhat) -> giu du cho, khong uoc thieu
      let xD = Math.round(gX - 120 * st.sx), wD = gW + Math.round(240 * st.sx);
      { const x0 = Math.round(8 * st.sx), x1 = st.cw1 - Math.round(8 * st.sx); if (xD < x0) { wD -= x0 - xD; xD = x0; } if (xD + wD > x1) wD = x1 - xD; }
      const mwD = dt ? 0 : meoChong({ x: xD, y: Math.round(st.H * 0.8) - 100, w: wD, h: 100 });
      const w2D = Math.max(wD * 0.5, wD - mwD) - 40 * hu;
      const fD = coVua('dan', luu, w2D, (dt ? Math.round(200 * st.sy) : 110 * st.sy), { lh: LH_VJ, lines: dt ? 7 : 3, cat: true, jpx: 1 });
      const lD = Math.max(1, fitLines(fD.text, fD.fs, w2D, 'h-r-dan', LH_VJ, true));
      gHmax = Math.max(Math.round(160 * hu), gHmax - Math.round((lD + 0.25) * fD.fs * LH_VJ + 30 * hu + 32 * st.sy));
    }
    const inW = gW - 52 * hu, bar = 52 * hu;
    // nghia ngan (Núi, Số 3): chu to hon (toi 1,4 x) — o om chu nen khong thanh o nho chu nho
    const ngNgan = kyTu(ng.chinh || v.meaningVi || '').length <= 10;
    const hNg_ = Math.max(60 * hu, (gHmax - bar - 36 * hu) * (ng.phu ? 0.62 : 0.95)), txtNg_ = ng.chinh || v.meaningVi || '';
    let fn = coVua('nghia', txtNg_, inW, hNg_, { lh: 1.05, lines: haiCot ? 4 : 3, cat: true, max: T('nghia').max * (haiCot ? (ngNgan ? 3.2 : 1.75) : (ngNgan ? 1.8 : 1)) });
    // nghia ngan hai tu ('Công ty'): mot dong neu chu khong nho hon ~ 0,55 lan (khong be 'Công | ty' chi de co chu to hon)
    if (ngNgan && /\s/.test(txtNg_.trim()) && fitLines(fn.text, fn.fs, inW, 'h-r-nghia', 1.05) >= 2) {
      const f1 = fit(esc(txtNg_), { w: inW, h: hNg_, max: fn.fs, min: Math.min(fn.fs, T('nghia').min), lh: 1.05, cls: 'h-r-nghia', nowrap: true, strict: true, txt: txtNg_ });
      if (f1 >= fn.fs * 0.55 && f1 >= T('nghia').min * 1.3) fn = { fs: f1, text: txtNg_ };
    }
    // dong phu: phan cao CON LAI sau dong nghia chinh (khong con co dinh 36 %: 'Xanh duong, cung dung cho den xanh giao thong' bi cat o KANA-1)
    const hConLaiPhu = Math.max((gHmax - bar - 36 * hu) * 0.36, (gHmax - bar - 36 * hu) - Math.ceil(fn.fs * 1.05 * Math.max(1, fitLines(fn.text, fn.fs, inW, 'h-r-nghia', 1.05))) - 10 * hu);
    let fp = ng.phu ? coVua('phu', ng.phu, inW, Math.max(30 * hu, hConLaiPhu), { lh: LH_VJ, lines: 3, cat: true }) : null;
    // 2 cot: dong phu to hon (>= 20 px) neu van vua nguyen van; khong vua thi giu co cu
    if (haiCot && ng.phu) { const f2 = coVua('phu', ng.phu, inW, Math.max(30 * hu, hConLaiPhu), { lh: LH_VJ, lines: 3, cat: true, max: T('phu').max * 1.35, min: 20 }); if (f2.text === ng.phu) fp = f2; }
    if (fp && fp.text !== ng.phu) { const cu = cuuChu(ng.phu, inW, Math.max(30 * hu, hConLaiPhu), LH_VJ); if (cu) fp = cu; }
    const nh1 = Math.ceil(Math.round(fn.fs * 1.05) * Math.max(1, Math.round(fitLines(fn.text, fn.fs, inW, 'h-r-nghia', 1.05))));
    const nh2 = fp ? Math.ceil(fp.fs * LH_VJ * Math.max(1, fitLines(fp.text, fp.fs, inW, 'h-r-phu', LH_VJ)) + 10 * hu) : 0;
    const gH = Math.round(Math.min(gHmax, Math.max(222 * hu, bar + 36 * hu + nh1 + nh2, haiCot ? bar + 36 * hu + nh1 + nh2 + 40 * hu : 0)));    // 2 cot: chu nghia ngan duoc phong rat to (xem max o tren) nen o om chu + dem, khong keo cao (SPARSE)
    const dai = 'Nghĩa';   // loai tu (Danh từ...) nam o nhan nho tren nhan treo: dai ngan -> o nghia om sat nghia ngan (Núi)
    const htmlNg = '<div class="h-nghia h-r-nghia" style="font-size:' + fn.fs + 'px">' + jp(khongMoCoi(fn.text)) + '</div>' + (fp ? '<div class="h-phu h-r-phu" style="line-height:' + LH_VJ + ';font-size:' + fp.fs + 'px">' + jp(khongMoCoi(fp.text)) + '</div>' : '');
    // o nghia OM chu (can giua duoi nhan treo): nghia ngan ("Buổi sáng") khong nam giua o rong trong
    let rGap0 = omGap({ x: gX, y: gy, w: gW, h: gH }, htmlNg, dai, haiCot ? { giua: false, minW: (ngNgan && !fp ? Math.round(0.72 * gW) : gW), cao: false } : { giua: true, minW: Math.round(Math.min(gW, 120 * hu)) });
    if (haiCot) {
      // nhom (o nghia + dan) can giua doc trong cot, o nghia luon ket thuc tren dau meo
      const tong = rGap0.h + (luu ? hc.gapY + hc.hS : 0), hReg = luu && !hc.danHep ? Math.min(hc.yC1, hc.yCat) - hc.yC0 : hc.yC1 - hc.yC0;
      let y0 = hc.yC0 + Math.max(0, Math.round((hReg - tong) / 2));
      y0 = Math.max(hc.yC0, Math.min(y0, Math.round(hc.yCat - rGap0.h)));
      rGap0 = Object.assign({}, rGap0, { y: y0 });
      hc.yS = y0 + rGap0.h + hc.gapY;
    }
    const rGap = ovPos('nghia', rGap0);
    let G1 = gap(c.el, rGap, dai, htmlNg);
    G1.dataset.giua = '1';
    if (haiCot) { G1.dataset.om = '0'; G1.classList.add('h-hc'); }
    c.gap = G1;
    // ---- nhan dan (mach nhac / trong am)
    let S = null;
    if (luu && haiCot) {
      S = dan(c.el, { x: hc.xC, y: hc.yS, w: hc.wS, h: hc.hS }, '<span class="h-r-dan" style="line-height:' + LH_VJ + ';font-size:' + hc.fd.fs + 'px">' + jp(khongMoCoi(hc.fd.text)) + '</span>', '', -1.5);
      S.style.textAlign = 'center';
    } else if (luu) {
      // may tinh: dan de len chan cua so anh (nhu ban mau). dien thoai: cot trai duoi cua so anh (khong de len co / meo)
      const rd = coAnh ? (dt ? { x: px(R(10, 0, 1, 1)).x, y: V.rect.y + V.rect.h + Math.round(14 * st.sy), w: px(R(0, 0, 160, 1)).w, h: Math.round(200 * st.sy) } : RC('dan', { d: L2.d.dan, p: L2.p.dan })) : { x: Math.round(rGap.x - 120 * st.sx), y: rGap.y + rGap.h + Math.round(26 * st.sy), w: rGap.w + Math.round(240 * st.sx), h: 100 };
      // khong anh: dai rong hon o nghia 120 moi ben -> tren dien thoai lo ra ngoai man: giu trong [8, cw1 - 8]
      { const x0 = Math.round(8 * st.sx), x1 = st.cw1 - Math.round(8 * st.sx); if (rd.x < x0) { rd.w -= x0 - rd.x; rd.x = x0; } if (rd.x + rd.w > x1) rd.w = x1 - rd.x; }
      const mw = dt ? 0 : meoChong({ x: rd.x, y: rd.y, w: rd.w, h: rd.h });
      const w2 = Math.max(rd.w * 0.5, rd.w - mw);
      const fd = coVua('dan', luu, w2 - 56 * hu, (dt ? rd.h : 110 * st.sy), { lh: LH_VJ, lines: dt ? 7 : 3, cat: true, jpx: 1 });
      const lines = Math.max(1, fitLines(fd.text, fd.fs, w2 - 56 * hu, 'h-r-dan', LH_VJ, true));
      const hh = Math.round((lines + 0.25) * fd.fs * LH_VJ + 30 * hu);
      let yy;
      if (dt && coAnh) yy = Math.min(rd.y, Math.round(st.H * 0.8) - hh);
      else yy = coAnh ? Math.round(Math.min(rd.y + rd.h, st.H * 0.78) - hh) : rd.y;
      yy = Math.min(yy, Math.round(st.H * 0.8) - hh);
      S = dan(c.el, { x: rd.x, y: yy, w: w2, h: hh }, '<span class="h-r-dan" style="line-height:' + LH_VJ + ';font-size:' + fd.fs + 'px">' + jp(khongMoCoi(fd.text)) + '</span>', '', -1.5);
      S.style.textAlign = 'center';
      // dan bi day len (giu tren mep co truoc) chong len o nghia: rut o nghia lai cho tren dan (gap() tu thu nho chu vua o moi)
      if (!coAnh && !haiCot && yy < rGap.y + rGap.h + Math.round(10 * st.sy)) {
        const hMoi = yy - Math.round(10 * st.sy) - rGap.y;
        if (hMoi >= 150 * hu) { const cu = G1; rGap.h = hMoi; G1 = gap(c.el, rGap, dai, htmlNg); G1.dataset.giua = '1'; c.el.insertBefore(G1, cu); cu.remove(); c.gap = G1; }
      }
    }
    // ---- cac moc hien (mocVao): cue toi som hon thi hien som hon
    c.rev = {
      ruby: () => {
        if (rt) { A.hien(rt, 0, 0.2); ft(rt, { y: 16 * hu / 0.75 }, { y: 0, duration: D(0.6), ease: 'back.out(2)' }); }
        if (rom) { A.hien(rom, 0.12, 0.12); ft(rom, { y: -14 * hu / 0.75 }, { y: 0, duration: D(0.55), ease: 'back.out(2)', delay: 0.12 }); ft(rom, { scale: 0.92 }, { scale: 1, duration: D(0.25), ease: 'power2.out', delay: 0.12 }); }
        snd('tick', 0.02);
      },
      nghia: () => { A.moGap(G1, 0); snd('ding', 0.02); },
    };
    if (S) c.rev.dan = () => { A.dan(S, 0, -1.5); snd('tick', 0.02); };
    c.vocab = { tag, G1, S, rt, rom, V };
    c.chay = () => {
      if (V) { moCua(V, tre('rem')); ft(V.el, { autoAlpha: 0, y: 40 * hu / 0.75 }, { autoAlpha: 1, y: 0, duration: D(0.5), ease: 'power3.out', delay: tre('vom') }); }
      A.tha(tag, tre('tag'), Math.max(760 * hu, rTag.y + rTag.h + 40));
      snd('tick', tre('tag') + 0.02);
      mocVao(c, 'ruby', tre('ruby'));
      mocVao(c, 'nghia', tre('nghia') + 2.4);      // du phong dai (cue V1 / V3 keo som hon): nghia hien dung luc Sensei noi, khong som 1,7 s
      mocVao(c, 'dan', tre('dan') + 3.0);
    };
  }
  /** So dong thuc te cua text trong hop rong w voi co chu fs (do bang DOM) */
  function fitLines(text, fs, w, cls, lh, jpx) {
    return soDong(text, cls, fs, Math.max(20, w * 0.97 - 3));
  }
  function cueTuVung(m, id, tt, api, nh, c) {
    const t = api.tre(tt);
    const V = c.vocab;
    if (!V) return;
    switch (id) {
      case 'V0': A.nay(V.tag, t, 1.03); break;
      case 'V1': case 'V2': case 'V2b':
        mocVao(c, 'ruby', t);
        A.tieuDiem(V.tag, t, 1.04);
        if (id === 'V1') mocVao(c, 'nghia', Math.min(tre('nghia') + 2.4, t + 3.2));   // du phong: Sensei noi 'nghia la' ~ 3 s sau khi doc tu (V3 la moc chinh)
        break;
      case 'V3': mocVao(c, 'nghia', t); A.nay(V.G1, t, 1.04); if (V.S) mocVao(c, 'dan', t + 3.4); break;   // tieu diem dung moc (t = tieng - 80 ms), khong +0,1
      case 'V4': case 'V5': if (V.S) { mocVao(c, 'dan', t); A.nay(V.S, t, 1.05); } break;
      default: break;
    }
  }

  // ================================================================== CHU HAN / CHU CAI (kana)
  function dungChuHan(nh, api, m, c) {
    const d = nh.data || {};
    const hu = st.hu, dt = st.dt;
    const ch = String(d.character || '');
    const kana = !!nh.laKana;
    const co = nh.chuong || {};
    const on = (Array.isArray(d.onyomi) ? d.onyomi : d.onyomi ? [d.onyomi] : []).filter(Boolean);
    const kun = (Array.isArray(d.kunyomi) ? d.kunyomi : d.kunyomi ? [d.kunyomi] : []).filter(Boolean);
    let tu = (Array.isArray(d.commonWords) ? d.commonWords : []).slice(0, dt ? 2 : 3);
    const ten = kana ? String(d.romaji || '') : String(d.hanViet || '');
    // kana: cach doc co ngoac nam trong cau ("... (con gà không dấu)", "(= z)"): giu nguyen mot cau, khong tach thanh dong phu mo coi
    const nghia = kana ? { chinh: String(d.meaningVi || '').replace(/\s+/g, ' ').trim(), phu: '' } : tachNghia(d.meaningVi);
    const L3 = {
      d: { vom: R(110, 92, 690, 870), tagX: 860, tagY: 96, w: 540, cardX: 1430, cardY: 170, cardW: 440, cardH: 160 },
      p: { vom: R(10, kana ? 68 : 76, 120, kana ? 150 : 170), tagX: 142, tagY: kana ? 70 : 78, w: 240, cardX: 12, cardY: 470, cardW: 178, cardH: 92 },   // kana (dien thoai): cua so + nhan thap hon -> them cho cho meo nho / cac the
    };
    const Lx = dt ? L3.p : L3.d;
    // ---- cua so viet net
    const rv = RC('vom', { d: L3.d.vom, p: L3.p.vom });
    const V = vom(c.el, rv, { khoa: '<small>' + (kana ? 'KÝ TỰ' : 'CHỮ') + '</small>' + esc(co.i || nh.i + 1), noiDung: '<div class="h-net-o"><div class="h-net"></div><span class="h-net-bong" lang="ja"></span></div>' });
    const netO = V.l3.querySelector('.h-net-o'), net = V.l3.querySelector('.h-net'), bong = V.l3.querySelector('.h-net-bong');
    const lenh = Math.min(rv.w - 64 * hu, (rv.h - 64 * hu) * 0.78);
    netO.style.cssText = 'left:' + Math.round((rv.w - 64 * hu - lenh) / 2) + 'px;top:' + Math.round(26 * hu + ((rv.h - 64 * hu) * 0.78 - lenh) / 2) + 'px;width:' + Math.round(lenh) + 'px;height:' + Math.round(lenh) + 'px';
    const fb = Math.round(Math.min(lenh * 0.62, lenh * 0.9 / Math.max(1, kyTu(ch).length)));
    bong.textContent = ch; bong.style.fontSize = fb + 'px';
    // ---- nhan treo: Han Viet / romaji lon + nut + but
    const tagX = px(R(Lx.tagX, 0, 1, 1)).x;
    const tagW = dt ? px(R(0, 0, Lx.w, 1)).w : Math.round(Lx.w * st.sx);
    const rTag0 = px(R(0, Lx.tagY, 1, 1));
    const tk = T('kanji');
    const fT = fit(esc(ten.toUpperCase()), { w: tagW - 60 * hu, h: 200 * st.sy, max: tk.max * (dt ? 0.55 : 0.5), min: tk.min * 0.5, lh: 1, cls: 'h-r-kanji', nowrap: true, txt: ten.toUpperCase() });
    // chu hoa Viet co dau (À Ấ Ế...): dau ra ngoai dong chu va cham chu Han nho (furigana) tren dau; dau nang (Ạ Ệ ...) cham vien '3 nét' phia duoi -> chua them cho
    const tenHoa = ten.toUpperCase();
    const dauTren = !kana && /[ÀÁẢÃÂẦẤẨẪĂẰẮẲẴÈÉẺẼÊỀẾỂỄÌÍỈĨÒÓỎÕÔỒỐỔỖƠỜỚỞỠÙÚỦŨƯỪỨỬỮỲÝỶỸ]/.test(tenHoa), dauDuoi = !kana && /[ẠẬẶẸỆỊỌỘỢỤỰỴ]/.test(tenHoa);
    const exT = dauTren ? Math.round(fT * 0.3) : 0, exD = dauDuoi ? Math.round(fT * 0.16) : 0;
    const tagH = Math.round((dt ? (kana ? 176 : 206) : 262) * hu + fT + exT + exD);
    const pillTxt = kana ? String(d.bangChu || '') : (d.strokeCount ? d.strokeCount + ' nét' : '');
    const fRom = Math.round(Math.max(T('romaji').min, Math.min(T('romaji').max, fT * 0.2)));
    const fRuby = Math.round(Math.max(T('ruby').min, Math.min(T('ruby').max, fT * 0.34)));
    const rTag = ovPos('tag', { x: tagX, y: rTag0.y, w: tagW, h: tagH });
    const tag = treo(c.el, rTag, '<div class="h-nhan" style="margin-top:' + Math.round((dt ? 62 : 78) * hu) + 'px">' + esc(kana ? 'Chữ cái' : 'Chữ Hán') + ' <b>· ' + so2(co.i || nh.i + 1) + ' / ' + so2(co.n || nh.n) + '</b></div>' +
      '<div class="h-dau-chu" style="margin-top:' + (Math.round((dt ? 36 : 78) * hu) + exT) + 'px"><span class="h-rb h-kanji-to h-r-kanji" style="font-size:' + fT + 'px;letter-spacing:.04em">' + esc(ten.toUpperCase()) +
      (kana ? '' : '<span class="h-rt h-an" lang="ja" style="font-size:' + fRuby + 'px;bottom:calc(100% + ' + (Math.round(4 * hu) + exT) + 'px)">' + esc(ch) + '</span>') + '</span></div>' +
      (pillTxt ? '<div class="h-romaji h-an" style="margin-top:' + (Math.round(14 * hu) + exD) + 'px;font-size:' + fRom + 'px">' + esc(pillTxt) + '</div>' : ''));
    const rt = tag.querySelector('.h-rt'), rom = tag.querySelector('.h-romaji');
    // ---- cac ghi chu
    const gap1Y = dt ? Math.max(rTag.y + rTag.h, rv.y + rv.h) + Math.round(9 * st.sy) : rTag.y + rTag.h + Math.round(20 * hu);
    const colW = dt ? px(R(0, 0, 366, 1)).w : tagW;
    const gapX = dt ? px(R(12, 0, 1, 1)).x : rTag.x;
    const gaps = {};
    const ssPre = kana ? String(d.sosanh || '').trim().replace(/^D[eễ]\s*nh[aầ]m\s*[:：\-–—]?\s*/i, '') : '';
    // dien thoai: the tu ghep + dai 'De nham' cao THEO NOI DUNG (nghia toi 3 dong o co chu san 13 px), khong con 86 / 70 co dinh cat '— viet…'; phan con lai danh cho o nghia / meo nho
    // may tinh + kana: nghia cua tu vi du dai (> 2 dong trong the 330 px) -> chi 2 the (cao hon, nghia toi 3 dong) thay vi 3 the cat '…'
    if (!dt && kana && tu.length > 2 && tu.some((w) => caoNoiDung('<div class="h-r-phu" style="font-size:14px;line-height:1.15">' + esc(w.meaningVi || '') + '</div>', Math.round(Lx.cardW * st.sx) - 40 * hu) > 2 * 14 * 1.15 + 3)) tu = tu.slice(0, 2);
    let hCardDt = Math.round(86 * st.sy), hsDt = Math.round(70 * st.sy);
    const tinhCardDt = () => {
      const nC = Math.max(1, tu.length), wc0 = Math.floor((st.cw1 - 12 * st.sx - px(R(12, 0, 1, 1)).x - 10 * st.sx * (nC - 1)) / nC), inWc = wc0 - 40 * hu;
      let mxC = 0;
      tu.forEach((w) => { const rubyC = !!(w.furigana && w.furigana !== w.word); mxC = Math.max(mxC, 25 * (rubyC ? 1.5 : 1.2) + caoNoiDung('<div class="h-r-phu" style="font-size:13px;line-height:1.15">' + esc(w.meaningVi || '') + '</div>', inWc) + 16 * hu); });
      hCardDt = tu.length ? Math.round(Math.min(116 * st.sy, Math.max(72 * st.sy, mxC))) : 0;
    };
    if (dt) {
      tinhCardDt();
      if (ssPre) hsDt = Math.round(Math.min(120 * st.sy, Math.max(56 * st.sy, caoNoiDung('<div class="h-r-dan" style="font-size:13px;line-height:' + LH_VJ + '"><b>Dễ nhầm: </b>' + jp(ssPre) + '</div>', px(R(0, 0, 366, 1)).w - 40 * hu) + 36 * hu)));
    }
    let cardH_ = dt ? (tu.length ? hCardDt + Math.round(6 * st.sy) : 0) + (kana && ssPre ? hsDt : 0) + Math.round(8 * st.sy) : 0;
    // may tinh + kana: dai 'De nham' om chu (cao theo noi dung, toi da 170 thiet ke) — phan thua tra cho cac the tu vi du (nghia 2 dong, khong cat '— viet…')
    let hsDes = 170;
    if (!dt && ssPre) {
      const wS = Math.round(Lx.cardW * st.sx) - 40 * hu, fS0 = coVua('phu', ssPre, wS, 170 * st.sy - 30 * hu, { lh: LH_VJ, lines: 6, cat: true, jpx: 1, max: T('phu').max * 1.05 });
      const nS = Math.max(1, fitLines(fS0.text, fS0.fs, wS, 'h-r-dan', LH_VJ, true));
      hsDes = Math.max(90, Math.min(170, Math.ceil((nS * fS0.fs * LH_VJ + 40 * hu + fS0.fs * 0.3) / st.sy)));
    }
    let conLai = (dt ? Math.round(st.H * 0.875) : Math.round(st.H * 0.78)) - gap1Y - cardH_;     // dien thoai: cac the tu ghep nam duoi cung, ben canh meo neu cham goc meo (the tu thu hep theo goc meo)   // may tinh: khong xuong duoi mep co truoc
    const dsGap = [];
    // dien thoai + kana co meo nho: man doc khong du cao cho 2 o + the tu + dai de nham (chu tung xuong 8 px) -> gop cach doc vao o meo nho
    const gopKana = dt && kana && !!d.meoNho;
    if (!gopKana) dsGap.push({ k: 'K3', nhan: 'Nghĩa', html: nghia.chinh + (nghia.phu ? '\u0001' + nghia.phu : ''), role: 'nghia', cap: 0.30 });
    if (kana) {
      if (d.meoNho) dsGap.push({ k: 'K4', nhan: gopKana ? 'Cách đọc · Mẹo nhớ' : 'Mẹo nhớ', html: (gopKana ? [nghia.chinh, nghia.phu].filter(Boolean).join(' ') + ' · ' : '') + String(d.meoNho), role: 'phu', cap: 0.46, mau: 'la' });
    } else if (on.length || kun.length) dsGap.push({ k: 'K5', nhan: 'Âm đọc', am: true, role: 'phu', cap: 0.34, mau: 'nghe' });
    const tongCap = dsGap.reduce((a, g) => a + g.cap, 0);
    let yy = gap1Y;
    let dayGap = gap1Y + conLai;
    // nhu cau toi thieu cua tung o (o sau khong bi o truoc an het cho): am doc = 52 + 36 + moi hang (chu nho nhat hoac nhan ON / KUN); con lai 92 hu
    // dien thoai: ON va KUN du rong de xep CUNG MOT HANG (カイ (kai) + か(ける)) -> o am doc chi cao 1 hang, tra cho cho o nghia
    const amUna = dt && on.length > 0 && kun.length > 0 && (rongChu(on.slice(0, 2).join('、'), 'h-r-nghia', Math.round(T('nghia').min)) * 0.85 + rongChu(kun.slice(0, 2).join('、'), 'h-r-nghia', Math.round(T('nghia').min)) * 0.85 + 2 * Math.max(52 * hu, 40) + 24 * hu) < colW - 52 * hu;
    const nhuCauMin = (g) => (g.am ? Math.ceil(52 * hu + 36 * hu + (amUna ? 1 : (on.length ? 1 : 0) + (kun.length ? 1 : 0)) * (Math.max(T('nghia').min * 1.1, Math.max(12, 22 * hu) * 1.2 + 10 * hu) + 4 * hu) + 2) : Math.round(92 * hu));
    // chieu cao toi thieu de HIEN DU chu (co chu san 13 / 14 px) cua tung o: o truoc (Nghia) khong an het cho cua o sau (Meo nho / Am doc bi cat con 1 dong)
    const sanF = dt ? 13 : 14;
    const canDu = (g) => {
      if (g.am) return nhuCauMin(g);
      const txt = String(g.html).replace('', ' ');
      return Math.ceil(52 * hu + 36 * hu + caoNoiDung('<div class="h-r-phu" style="font-size:' + sanF + 'px;line-height:' + LH_VJ + '">' + jp(txt) + '</div>', colW - 52 * hu) + 6);
    };
    const canAll = dsGap.map((g) => Math.max(nhuCauMin(g), canDu(g)));
    // dien thoai: noi dung (o nghia + meo nho + the tu ghep + 'De nham') vuot cho -> bo bot the tu ghep (tu cuoi truoc) cho cac o con lai hien DU chu — khong cat '…'
    if (dt && tu.length) {
      const nGap = canAll.reduce((a, b) => a + b, 0) + 20 * hu * (dsGap.length - 1);
      const dung = () => nGap + (tu.length ? hCardDt + Math.round(6 * st.sy) : 0) + (kana && ssPre ? hsDt : 0) + Math.round(8 * st.sy) + 24 * hu;
      const bud = Math.round(st.H * 0.865) - gap1Y;
      while (tu.length && dung() > bud) { tu = tu.slice(0, -1); tinhCardDt(); }
      cardH_ = (tu.length ? hCardDt + Math.round(6 * st.sy) : 0) + (kana && ssPre ? hsDt : 0) + Math.round(8 * st.sy);
      conLai = Math.round(st.H * 0.875) - gap1Y - cardH_; dayGap = gap1Y + conLai;
    }
    const kThu = Math.min(1, Math.max(0.3, (dayGap - gap1Y - 20 * hu * (dsGap.length - 1)) / Math.max(1, canAll.reduce((a, b) => a + b, 0))));
    dsGap.forEach((g, gi) => {
      // o dung truoc nhan TOAN BO phan con lai tru nhu cau toi thieu cua cac o sau (truoc: chia co dinh theo he so cap 0,30 / 0,34 -> nghia dai bi cat '…' du con cho);
      // o OM chu (omGap) nen phan thua tra lai cho o sau
      const conSau = dsGap.slice(gi + 1).reduce((a, g2, q) => a + Math.round(canAll[gi + 1 + q] * kThu) + 20 * hu, 0);
      const hTham = Math.round(Math.max(92 * hu, dayGap - yy - conSau));      // toi da duoc cap (tham lam)
      // truoc het: phan chia theo he so cap (nghia ngan khong an het cho cua meo nho / am doc); chi khi noi dung BI CAT moi cap them toi hTham
      let h = Math.min(hTham, Math.round(Math.max(92 * hu, (conLai - 20 * hu * (dsGap.length - 1)) * g.cap / tongCap)));
      // o cuoi: dung het phan con lai (o truoc da om chu -> du cho cho meo nho dai, khong phai cat "…")
      if (gi === dsGap.length - 1) h = Math.max(h, Math.round(dayGap - yy));
      const inW = colW - 52 * hu;
      let html = '';
      if (g.am) {
        const filas = [];
        if (on.length) filas.push(['ON', on.slice(0, 2).join('、')]);
        if (kun.length) filas.push(['KUN', kun.slice(0, 2).join('、')]);
        // o .h-gt: dai 52 + dem .h-gn 18 tren / 18 duoi; moi hang: chu (lh 1.1) hoac nhan ON/KUN + margin 2+2
        const tagH = Math.max(12, 22 * hu) * 1.2 + 10 * hu, inH2 = h - 52 * hu - 36 * hu;
        const nFil = amUna ? 1 : filas.length;
        const f = coVua('nghia', filas.map((r) => r[1]).reduce((a, b) => (kyTu(b).length > kyTu(a).length ? b : a), ''), amUna ? (inW - 2 * Math.max(60 * hu, 44) - 36 * hu) / 2 : inW - 110 * hu, inH2 / nFil - 4 * hu - 2, { lh: 1.1, nowrap: true, max: T('nghia').max * 1.6, min: Math.round(T('nghia').min * 1.25), jpx: 1, cls: 'nghia' });
        html = filas.map((r) => '<div class="h-am-hang"><b class="h-am-tag">' + r[0] + '</b><span class="h-r-nghia" lang="ja" style="font-size:' + f.fs + 'px;line-height:1.1">' + r[1].split('、').map((x, q, a) => '<span style="white-space:nowrap">' + jp(x) + (q < a.length - 1 ? '、' : '') + '</span>').join('') + '</span></div>').join('');
        // uoc luong amUna co the lac quan: do be ngang THAT mot dong; khong vua thi xep chong (hang xuong dong trong khung flex-wrap lam o nghia rong het be ngang)
        if (amUna && doNoiDung('<div style="display:flex;white-space:nowrap;column-gap:' + Math.round(18 * hu) + 'px">' + html + '</div>', 5000).w <= inW) html = '<div style="display:flex;flex-wrap:wrap;align-items:center;column-gap:' + Math.round(18 * hu) + 'px">' + html + '</div>'
        else html = '<div class="h-am-khoi">' + html + '</div>';   // hang xep chong: cac hang can trai cung mot khoi (khoi can giua o neu o rong hon chu)
        // chu da toi co nho nhat ma van khong vua: noi o ra (cac o / the phia duoi tu dich theo yy)
        // phan chu da toi co NHO NHAT cua vai (khong tinh phan nang min 1,25 x) ma van khong vua: noi o ra bat buoc; phan nang them chi toi day vung
        { const fSan = Math.min(f.fs, T('nghia').min), canSan = Math.ceil(52 * hu + 36 * hu + nFil * (Math.max(fSan * 1.1, tagH) + 4 * hu) + 2), can = Math.ceil(52 * hu + 36 * hu + nFil * (Math.max(f.fs * 1.1, tagH) + 4 * hu) + 2);
          h = Math.max(h, canSan);
          h = Math.min(Math.max(h, can), Math.max(h, Math.round(dayGap - yy - (dsGap.length - 1 - gi) * (92 * hu + 20 * hu)))); }
      } else if (g.role === 'nghia') {
        const [a, b] = g.html.split('');
        const mkN = (hh) => {
          const iH = hh - 52 * hu - 36 * hu, inH2 = b ? iH - 10 * hu : iH;   // .h-phu margin-top 10
          const f1 = coVua('nghia', a, inW, inH2 * (b ? 0.64 : 0.95), { lh: 1.05, lines: 3, cat: true, max: T('nghia').max * (kyTu(a).length <= 10 ? 1.15 : 0.85) });
          let f2 = null;
          if (b) { const h1 = Math.ceil(Math.max(1, fitLines(f1.text, f1.fs, inW, 'h-r-nghia', 1.05)) * f1.fs * 1.05); f2 = coVua('phu', b, inW, Math.max(inH2 * 0.36, inH2 - h1), { lh: LH_VJ, lines: 3, cat: true }); }
          return { f1, f2, cut: f1.text !== a || (!!b && f2.text !== b) };
        };
        let r_ = mkN(h);
        if (r_.cut && hTham > h) { h = hTham; r_ = mkN(h); }
        const { f1, f2 } = r_;
        html = '<div class="h-nghia h-r-nghia" style="font-size:' + f1.fs + 'px">' + jp(khongMoCoi(f1.text)) + '</div>' + (f2 ? '<div class="h-phu h-r-phu" style="font-size:' + f2.fs + 'px">' + esc(f2.text) + '</div>' : '');
      } else {
        const mkP = (hh) => coVua('phu', g.html, inW, hh - 52 * hu - 36 * hu, { lh: LH_VJ, lines: 7, cat: true, max: T('nghia').max * 0.62, min: T('phu').min, jpx: 1 });
        let f = mkP(h);
        if (f.text !== g.html && hTham > h) { h = hTham; f = mkP(h); }
        if (f.text !== g.html) { const cu = cuuChu(g.html, inW, h - 52 * hu - 36 * hu - 2); if (cu) f = cu; }
        html = '<div class="h-phu h-r-phu dam" style="font-size:' + f.fs + 'px;margin:0">' + jp(f.text) + '</div>';
      }
      // o OM noi dung (be ngang toi thieu nua cot, trai thang hang): am doc ngan (カイ) khong nam giua o rong
      const rg_ = ovPos('g' + g.k, omGap({ x: gapX, y: yy, w: colW, h }, html, g.nhan, { minW: Math.round(colW * 0.2) }));
      gaps[g.k] = gap(c.el, rg_, g.nhan, html, g.mau);
      yy += rg_.h + Math.round(20 * hu);
    });
    // ---- the tu ghep (cot phai tren may tinh, hang duoi tren dien thoai)
    const cards = [];
    const nCard = tu.length;
    tu.forEach((w, i) => {
      let r;
      if (dt) {
        // the tu ghep chay het be ngang khi day the nam tren dau meo (meo that = st.meo.y + 36); chi hep lai theo goc meo khi de len meo
        const yC = Math.round(yy + 8 * st.sy), lim = st.meo && yC + hCardDt > st.meo.y + 30 ? st.meo.x - 8 : st.cw1 - 12 * st.sx;
        const w0 = px(R(12, 0, 1, 1)).x, wc = Math.floor((lim - w0 - 10 * st.sx * (nCard - 1)) / Math.max(1, nCard));
        r = { x: w0 + i * (wc + Math.round(10 * st.sx)), y: yC, w: wc, h: hCardDt };
      }
      else {
        const cy0 = Lx.cardY + (kana && ssPre ? hsDes + 14 : 0);
        const gapY = kana ? 12 : 22, hh = Math.min(Lx.cardH + 40, (686 - cy0 - gapY * (nCard - 1)) / Math.max(1, nCard));
        r = px(R(Lx.cardX, cy0 + i * (hh + gapY), Lx.cardW, hh));
      }
      const inW = r.w - 40 * hu, inH = r.h - 20 * hu;
      const html1 = C.ruby(w.word || '', w.furigana || '');
      const rubyC = !!(w.furigana && w.furigana !== w.word), lhW = rubyC ? 1.5 : 1.2;     // tu khong furigana (katakana): dong chu thap, phan con lai cho nghia 2 dong
      // dong chu (tu) nhuong cho dong nghia: chua truoc 2 dong nghia (3 dong dien thoai) o co chu san, phan con lai moi la chu to
      const nGl = Math.min(dt || nCard < 3 ? 3 : 2, Math.max(1, soDong(w.meaningVi || '', 'h-r-phu', dt ? 13 : 14, inW)));
      const hW = Math.min(inH * 0.6, Math.max(T('tt').min * 0.7 * lhW, inH - nGl * (dt ? 13 : 14) * 1.15 - 11 * hu));
      const f1 = fit(html1, { w: inW, h: hW, max: T('tt').max * (dt ? 0.7 : 0.8), min: T('tt').min * 0.7, lh: lhW, cls: 'h-r-tt', nowrap: true });
      let f2 = coVua('phu', w.meaningVi || '', inW, Math.max(inH * 0.34, inH - f1 * lhW - 6 * hu), { lh: 1.15, lines: dt || nCard < 3 ? 3 : 2, cat: true, max: T('phu').max * 0.95 });
      if (f2.text !== (w.meaningVi || '')) { const cu = cuuChu(w.meaningVi, inW, Math.max(inH * 0.34, inH - f1 * lhW - 6 * hu), 1.15); if (cu) f2 = cu; }
      const e = giay(c.el, r, '<div class="h-tt-w h-r-tt" lang="ja" style="font-size:' + f1 + 'px">' + html1 + '</div><div class="h-tt-n h-r-phu" style="font-size:' + f2.fs + 'px">' + esc(f2.text) + '</div>', 'h-tcard');
      e.style.rotate = (i % 2 ? 1 : -1) + 'deg';
      cards.push(e);
    });
    // kana: "de nham"
    let sosanh = null;
    const ss = kana ? String(d.sosanh || '').trim().replace(/^D[eễ]\s*nh[aầ]m\s*[:：\-–—]?\s*/i, '') : '';   // du lieu thuong da mo dau bang 'Dễ nhầm': khong in nhan 2 lan
    if (ss) {
      const r0 = dt ? { x: px(R(12, 0, 1, 1)).x, y: Math.round(yy + 10 * st.sy + (tu.length ? hCardDt + 6 * st.sy : 0)), w: px(R(0, 0, 366, 1)).w } : px(R(Lx.cardX, 170, Lx.cardW, 0));
      const hs = dt ? hsDt / st.sy : hsDes;
      let f = coVua('phu', ss, (dt ? r0.w : Lx.cardW * st.sx) - 40 * hu, hs * st.sy - 30 * hu, { lh: LH_VJ, lines: 6, cat: true, jpx: 1, max: T('phu').max * 1.05 });
      if (f.text !== ss) { const cu = cuuChu(ss, (dt ? r0.w : Lx.cardW * st.sx) - 40 * hu, hs * st.sy - 30 * hu, LH_VJ); if (cu) f = cu; }
      sosanh = dan(c.el, dt ? { x: r0.x, y: r0.y, w: r0.w, h: Math.round(hs * st.sy) } : { x: r0.x, y: r0.y, w: r0.w, h: Math.round(hs * st.sy) }, '<span class="h-r-dan" style="font-size:' + f.fs + 'px"><b>Dễ nhầm: </b>' + jp(khongMoCoi(f.text)) + '</span>', 'la', 1.5);
    }
    c.rev = {
      net: () => veNet(m, c, 0),
      ruby: () => { if (rt) { A.hien(rt, 0, 0.2); ft(rt, { y: 16 * hu / 0.75 }, { y: 0, duration: D(0.6), ease: 'back.out(2)' }); } if (rom) { A.hien(rom, 0.12, 0.12); ft(rom, { y: -14 * hu / 0.75 }, { y: 0, duration: D(0.55), ease: 'back.out(2)', delay: 0.12 }); ft(rom, { scale: 0.92 }, { scale: 1, duration: D(0.25), ease: 'power2.out', delay: 0.12 }); } snd('tick', 0.02); },
    };
    Object.keys(gaps).forEach((k) => { c.rev[k] = () => { A.moGap(gaps[k], 0); snd('ding', 0.02); }; });
    cards.forEach((e, i) => { c.rev['K7.' + i] = () => { A.lat(e, 0, 0.6); snd('tick', 0.02); }; });
    if (sosanh) c.rev.K5s = () => { A.dan(sosanh, 0, 1.5); snd('tick', 0.02); };
    m.netO = net; m.ch = ch; m.bong = bong;
    c.kj = { tag, gaps, cards, sosanh, V };
    c.chay = () => {
      ft(V.el, { autoAlpha: 0, y: 40 * hu / 0.75 }, { autoAlpha: 1, y: 0, duration: D(0.5), ease: 'power3.out', delay: tre('vom') });
      A.tha(tag, tre('tag'), Math.max(760 * hu, rTag.y + rTag.h + 40));
      snd('tick', tre('tag') + 0.02);
      mocVao(c, 'ruby', 0.3);
      mocVao(c, 'net', 0.1);
      if (gaps.K3) mocVao(c, 'K3', 0.08);
      Object.keys(gaps).forEach((k) => { if (k !== 'K3') mocVao(c, k, 0.2); });
      cards.forEach((e, i) => mocVao(c, 'K7.' + i, 0.5 + i * 0.15));
      if (sosanh) mocVao(c, 'K5s', 1.6);
    };
  }
  function veNet(m, c, t) {
    if (m.daVe || !m.netO) return;
    m.daVe = true;
    const n = (window.SenseiStrokes && SenseiStrokes.get && (SenseiStrokes.get(m.ch) || []).length) || 6;
    const r = C.vietNet(m.netO, m.ch, { tocDo: INST ? 0.12 : kep(3.2 / Math.max(1, n), 0.28, 0.6), tre: t || 0 });
    if (r && m.bong) G.to(m.bong, { autoAlpha: 0, duration: D(0.2), delay: t || 0 });
  }
  function cueChuHan(m, id, tt, api, nh, c) {
    const t = api.tre(tt);
    const K = c.kj;
    if (!K) return;
    if (id === 'K0') A.nay(K.tag, t, 1.03);
    else if (id === 'K1' || id === 'K1b') { mocVao(c, 'net', t); A.vien(K.V.el, 0, 0); }
    else if (id === 'K2') { mocVao(c, 'ruby', t); A.tieuDiem(K.tag, t, 1.04); }
    else if (id === 'K3') { mocVao(c, 'K3', t); if (K.gaps.K3) A.nay(K.gaps.K3, t + 0.1, 1.04); }
    else if (id === 'K4' && K.gaps.K4) { mocVao(c, 'K4', t); A.nay(K.gaps.K4, t + 0.1, 1.03); }
    else if (id === 'K5') { if (K.gaps.K5) { mocVao(c, 'K5', t); A.nay(K.gaps.K5, t + 0.1, 1.03); } if (K.sosanh) { mocVao(c, 'K5s', t); A.nay(K.sosanh, t + 0.1, 1.05); } }
    else if (id === 'K6' && K.gaps.K5) { mocVao(c, 'K5', t); A.nay(K.gaps.K5, t + 0.1, 1.03); }
    else if (/^K7\.\d+$/.test(id)) { const i = +id.split('.')[1]; mocVao(c, id, t); if (K.cards[i]) A.nay(K.cards[i], t + 0.1, 1.06); }
  }

  // ================================================================== MAU CAU
  const DS_TRO = ['は', 'が', 'を', 'に', 'で', 'と', 'も', 'の', 'へ', 'か', 'や', 'から', 'まで', 'ね', 'よ'];
  /** bai nhap mon (KANA): cong thuc la hang chu cai (か さ た は + ゛), KHONG phai tro tu — khong gan nhan 'Trợ từ' / cach doc wa / ka cua tro tu */
  const laKanaNh = (nh) => !!(nh && (nh.laKana || String(nh.capDo || '').toUpperCase() === 'KANA'));
  function phanCongThuc(nh) {
    const ch = nh.congThuc, d = nh.data || {};
    const kana = laKanaNh(nh);
    if (ch && ch.phan && ch.phan.length) {
      let jc = 0, jo = 0;
      return ch.phan.map((e) => {
        if (e.loai === 'chu') {
          const j = jc++;
          const chu = String(e.chu || '');
          if (kana) return { loai: 'chu', j, chu, ro: '', dai: '', body: '' };
          const doc = DOC_TRO[chu] || ROMAJI_TRO[chu] || '';
          const role = DOC_TRO[chu] ? 'đọc “' + DOC_TRO[chu] + '”' : (C.vaiTro(chu) || '');
          return { loai: 'chu', j, chu, ro: doc, dai: DS_TRO.includes(chu) ? 'Trợ từ' : 'Cuối câu', body: role };
        }
        const j = jo++;
        let nhan = String(e.nhan || '').replace(/[\-(（]+$/, '').trim();
        if (!/[A-Za-z0-9぀-ヿ一-鿿]/.test(nhan)) nhan = 'N';
        const lo = /^N(\d*)$/.exec(nhan) ? 'Danh từ' + (RegExp.$1 ? ' ' + RegExp.$1 : '') : /^V/.test(nhan) ? 'Động từ' : /^A/.test(nhan) ? 'Tính từ' : 'Thành phần';
        return { loai: 'o', j, chu: nhan, ro: '', dai: lo, body: e.chu ? viet1(e.chu) : '' };
      });
    }
    const cum = String(d.grammarFormula || d.title || '').match(/[぀-ヿ一-鿿々〜ー]+/g) || [];
    return cum.slice(0, 5).map((x, j) => (kana ? { loai: 'chu', j, chu: x, ro: '', dai: '', body: '' } : { loai: 'chu', j, chu: x, ro: ROMAJI_TRO[x] || '', dai: DS_TRO.includes(x) ? 'Trợ từ' : 'Mẫu', body: C.vaiTro(x) || '' }));
  }
  /** Cong thuc van xuoi dang 'V(the tu dien) + 一方だ' (C.congThuc khong tach duoc): moi phan cach boi ' + ' thanh mot khoi —
   *  cum Nhat gon = khoi chinh (to, cam), phan con lai (chu Viet / ky hieu N V A) = khoi phu — thay vi mot dai chu nho */
  function chiaCongThucChu(gf) {
    const ds = String(gf || '').split(/\s+\+\s+/).map((x) => x.trim()).filter(Boolean);
    if (ds.length < 2 || ds.length > 4 || !ds.some((x) => RE_JP.test(x))) return null;
    if (ds.some((x) => kyTu(x).length > 46 || /\s→\s|\s\/\s/.test(x))) return null;
    // nhieu bien the cach nhau bang dau cach rong (　) hoac cum Nhat kem chu thich cach >= 2 dau cach ('やすい   (chia như ...)'): la van xuoi, khong phai cac khoi 'chu' / 'o'
    if (ds.some((x) => /　|\S\s{2,}[(（]/.test(x))) return null;
    let jc = 0, jo = 0;
    return ds.map((x) => (RE_JP.test(x) && !/[À-ỹ]/.test(x) && kyTu(x).length <= 14
      ? { loai: 'chu', j: jc++, chu: x, ro: '', dai: '', body: '' }
      : { loai: 'o', j: jo++, chu: x, ro: '', dai: '', body: '' }));
  }
  function gopPhan(ds, n) {
    const out = ds.map((x) => Object.assign({ idx: [x.i0] }, x));
    while (out.length > n) {
      let bi = 0, bl = 1e9;
      for (let i = 0; i + 1 < out.length; i++) { const l = kyTu(out[i].chu).length + kyTu(out[i + 1].chu).length; if (l < bl) { bl = l; bi = i; } }
      const a = out[bi], b = out[bi + 1];
      a.chu += b.chu; a.idx = a.idx.concat(b.idx); a.ro = ''; a.body = ''; a.dai = 'Cụm';
      out.splice(bi + 1, 1);
    }
    return out;
  }
  function cauThanh(s) { return String(s || '').split(/(?<=[.!?。！？…])\s+/).map((x) => x.trim()).filter(Boolean); }
  function dungMauCau(nh, api, m, c) {
    const d = nh.data || {};
    const hu = st.hu, dt = st.dt;
    const co = nh.chuong || {};
    // cong thuc la VAN XUOI (khong tach duoc: 'Nhóm 1: đuôi う→え (走る→走れ) / Nhóm 2: ...'): moi dong la mot the rong xep doc — truoc day bi chat thanh
    // 5 manh chu Nhat roi nhau (う / え / 走る / 走れ / る) khong con mui ten, mat noi dung that
    const gf = String(d.grammarFormula || '').trim();
    let proseRows = null;
    const phanTho = !nh.congThuc && gf && !/Nhóm/.test(gf) ? chiaCongThucChu(gf) : null;
    if (!phanTho && !nh.congThuc && gf && (/Nhóm/.test(gf) || /[À-ỹ]/.test(gf))) {      // chi cong thuc co chu Viet / 'Nhóm' (cong thuc kana 'a i u e o → あ い う え お' van la khoi roi)
      proseRows = gf.split(/\s+\/\s+|[　]+|\s*｜\s*|(?=Nhóm\s*\d)/).map((x) => x.trim().replace(/^[\/／]\s*/, '')).filter(Boolean);
      // dong qua ngan (vs, たら...) khong thanh the rieng: ghep vao dong truoc
      proseRows = proseRows.reduce((a, x) => { if (a.length && kyTu(x).length <= 4) a[a.length - 1] += ' / ' + x; else a.push(x); return a; }, []);
      // toi da 4 dong (dien thoai: 4 dong chi khi moi dong ngan <= 36 ky tu, mot dong the; con lai 3 dong, dong cuoi gop)
      const mx_ = !dt || proseRows.every((x) => kyTu(x).length <= 36) ? 4 : 3;
      // dong dai 'A (..) + B (..) + C (..)' (moi ve la mot cum Nhat + chu thich): moi ve thanh mot the rieng (mot dong qua dai se tran / bi cat tren dien thoai)
      proseRows = proseRows.reduce((a, x) => {
        const ve = x.split(/\s+\+\s+/).map((y) => y.trim()).filter(Boolean);
        if (ve.length >= 2 && kyTu(x).length > 36 && ve.every((y) => RE_JP.test(y) && /[(（][^()（）]*[)）]\s*$/.test(y)) && a.length + ve.length - 1 + proseRows.length - 1 <= mx_ + 1) return a.concat(ve);
        a.push(x); return a;
      }, []);
      if (proseRows.length > mx_) proseRows = proseRows.slice(0, mx_ - 1).concat([proseRows.slice(mx_ - 1).join(' / ')]);
      if (proseRows.every((x) => kyTu(x).length < 8)) proseRows = null;      // cong thuc ngan (V / A + N): van la khoi roi, khong phai van xuoi
      // cap 'く→か' dinh lien (WORD JOINER hai ben mui ten): xuong dong chi o giua cac cap, khong be 'く→ | か'
      if (proseRows) proseRows = proseRows.map((x) => x.split(/\s*→\s*/).join(String.fromCharCode(0x2060) + '→' + String.fromCharCode(0x2060)));
    }
    let phan = (proseRows ? proseRows.map((x, j) => ({ loai: 'chu', j, chu: x, ro: '', dai: '', body: '' })) : (phanTho || phanCongThuc(nh))).map((p, i) => Object.assign({ i0: i }, p));
    const map = phan.map((_, i) => i);
    const gioiHan = proseRows ? 9 : (dt ? 4 : 6);
    // phan chi la dau cham (・、) -> khong thanh khoi rieng (khoi trong chi co mot cham); kana nho le (ゃ ゅ ょ っ) -> ghep vao khoi truoc (しゃ)
    {
      const RE_CHAM = /^[・、。，．,.·\s]+$/, RE_NHO = /^[ゃゅょャュョっッぁぃぅぇぉ]+$/;
      const moi = [];
      phan.forEach((p) => {
        const truoc = moi[moi.length - 1];
        if (RE_CHAM.test(p.chu) && phan.length > 1) { if (truoc) truoc.idx.push(p.i0); else (phan.daCho = phan.daCho || []).push(p.i0); return; }
        if (RE_NHO.test(p.chu) && truoc && truoc.loai === 'chu') { truoc.chu += p.chu; truoc.idx.push(p.i0); truoc.ro = ''; return; }
        moi.push(Object.assign({}, p, { idx: (phan.daCho || []).splice(0).concat([p.i0]) }));
      });
      if (moi.length && moi.length < phan.length) { moi.forEach((g, k) => g.idx.forEach((i) => { map[i] = k; })); phan = moi; }
    }
    if (phan.length > gioiHan) { const gop = gopPhan(phan, gioiHan); gop.forEach((g, k) => (g.idx || []).forEach((i) => { map[i] = k; })); phan = gop; }
    const dsMau = (nh.ctx.cacNhip || []).filter((b) => b && b.kind === 'grammar-intro');
    const soMau = dsMau.length, iMau = dsMau.indexOf(nh.beat) + 1;
    const tieu = String(d.title || '').replace(/^\d+\.\s*/, '');
    const ten = tieu.split(/:\s*/)[0] || tieu;
    const expl = String(d.explanation || '').trim(), tips = String(d.teacherTips || '').trim(), vh = String(d.culturalNotes || '').trim();
    const L4 = { d: { hd: R(110, 70, 1290, 150) }, p: { hd: R(8, 70, 374, 112) } };
    // ---- tieu de tam giay
    const rh = RC('hd', L4);
    // tieu de KHONG lap lai cong thuc (da co khoi cong thuc to ngay duoi): header chi nhan + ten mau cau — chu to hon, the om chu
    const hdSan = true;
    const congThucHtml = hdSan ? '' : phan.map((p) => (p.loai === 'chu' ? '<span class="p h-jpf" lang="ja">' + daku(esc(p.chu)) + '</span>' : esc(p.chu))).join(' ');
    const tong = rh.w - 80 * hu;
    const txtF = hdSan ? '' : phan.map((p) => p.chu).join(' ');
    // dien thoai: cong thuc dai (なりました…) tung tran mep phai o co 18 -> cho xuong 13, van tran thi 2 dong
    const fF = fit(congThucHtml, { w: tong * (dt ? 0.98 : 0.5), h: dt ? 44 * hu * 1.3 : 90 * st.sy, max: dt ? 30 : 64 * hu, min: dt ? 13 : 30 * hu, lh: 1.1, cls: 'h-r-form', nowrap: true, txt: txtF });
    let fF2Dong = dt && rongChu(txtF, 'h-r-form', fF) > tong * 0.98;
    let fF_ = fF;
    // may tinh: cong thuc dai (若手は研究者ともあろう者が…) o co nho nhat van rong hon nua tam -> 2 dong trong nua phai (khong lan sang nhan ben trai)
    if (!dt && rongChu(txtF, 'h-r-form', fF) > tong * 0.5) { fF2Dong = true; fF_ = fit(congThucHtml, { w: tong * 0.5, h: 92 * st.sy, max: 64 * hu, min: Math.max(14, 24 * hu), lh: 1.1, cls: 'h-r-form', lines: 2 }); }
    const wF = hdSan ? 0 : (fF2Dong && !dt ? Math.round(tong * 0.5) : rongTuNhien(congThucHtml, 'h-r-form', fF, phan.map((p) => p.chu).join(' ')));
    // dien thoai: tieu de nam tren dong cong thuc (day khung) -> chieu cao tieu de = phan con lai sau cong thuc (1 hoac 2 dong), khong cham
    const hTD = dt ? Math.max(18, rh.h - 56 * hu - 10 * hu - (hdSan ? 0 : fF * 1.1 * (fF2Dong ? 2 : 1)) - 6) : 80 * st.sy;
    const fT = fit(jp(nganTu(ten, 80)), { w: dt ? tong : Math.max(200, tong - wF - 40 * hu), h: hTD, max: dt ? Math.max(T('tieude').max, 30) : T('tieude').max, min: dt ? 13 : T('tieude').min, lh: 1.08, lines: dt ? 2 : 2, cls: 'h-r-tieude', txt: nganTu(ten, 80) });
    // dien thoai hep (320 / 360): tieu de 2 dong + cong thuc co the cao hon tam giay -> chu de len nhau; do chieu cao that, tam giay cao them, cac khoi duoi dich xuong (dyH)
    let dyH = 0;
    if (dt) {
      const hTr = doHop(jp(nganTu(ten, 80)), 'h-r-tieude', fT, 1.08, tong).h;
      // cong thuc co the xuong 3-4 dong o man hep: do cao that (khong tin so dong uoc)
      const hFm = hdSan ? 0 : (fF2Dong ? doHop(congThucHtml, 'h-r-form h-formula', fF_, 1.1, tong, 'ja').h : fF * 1.1);
      const can = Math.ceil(56 * hu + hTr + 8 + (hdSan ? 0 : hFm + 10 * hu) + 12 * hu);
      if (can > rh.h || hdSan || can < rh.h * 0.85) { dyH = can - rh.h; rh.h = can; }     // van xuoi (khong co dong cong thuc): tam giay om tieu de, cac khoi duoi len theo
    }
    // may tinh: tam giay tieu de om noi dung (tieu de + cong thuc) khi ca hai ngan — truoc: luon rong 965 px, chu chiem 17 % (thua)
    if (!fF2Dong) {
      const wTit = rongChu(nganTu(ten, 80), 'h-r-tieude', fT);
      // may tinh: tieu de | cong thuc cung hang; dien thoai: cong thuc nam DUOI tieu de -> be ngang = dong rong hon trong hai
      const can_ = dt ? Math.round(Math.max(wTit, hdSan ? 0 : wF, 150) * 1.06 + 110 * hu) : Math.round(Math.max(wTit, 160) * 1.05 + 110 * hu + (hdSan ? 0 : 50 * hu + wF));     // = 80 (dem) + 30 (dem tieu de) + tieu de + [khoang + cong thuc]
      // nhan 'NGU PHAP · MAU CAU n' (chu HOA, gian chu .2 em, mot dong) cung phai vua tam giay
      const wLab = Math.round(kyTu('Ngữ pháp' + (soMau ? ' · mẫu câu ' + iMau : '')).length * Math.max(11, 21 * hu) * 1.05 + 90 * hu);
      if (Math.max(can_, wLab) < rh.w * 0.9) rh.w = Math.max(can_, wLab, Math.round((dt ? 230 : 520) * st.sx));
    }
    const tongH = rh.w - 80 * hu;
    const hd = giay(c.el, rh, '<div class="h-nhan" style="position:absolute;left:' + Math.round(40 * hu) + 'px;top:' + Math.round(30 * hu) + 'px">Ngữ pháp' + (soMau ? ' <b>· mẫu câu ' + iMau + '</b>' : '') + '</div>' +
      '<div class="h-r-tieude" style="position:absolute;left:' + Math.round(38 * hu) + 'px;top:' + Math.round((dt ? 56 : 60) * hu) + 'px;font-size:' + fT + 'px;width:' + Math.round(dt ? tongH : tongH - wF - 30 * hu) + 'px;line-height:1.08">' + jp(nganTu(ten, 80)) + '</div>' +
      '<div class="h-r-form h-formula" lang="ja" style="position:absolute;' + (dt ? 'left:' + Math.round(38 * hu) + 'px;bottom:' + Math.round(10 * hu) + 'px' : 'right:' + Math.round(40 * hu) + 'px;top:' + Math.round(44 * hu) + 'px') + ';font-size:' + fF_ + 'px' + (fF2Dong ? ';white-space:normal;width:' + Math.round(dt ? tongH : tong * 0.5) + 'px;line-height:1.1' + (dt ? '' : ';text-align:right') : '') + '">' + congThucHtml + '</div>');
    // ---- bo cuc: khoi / ghi chu / giai thich
    const coGt = !!expl, coTips = !!tips, coVh = !!vh;
    const tr = {
      d: { y: coGt ? 250 : 256, h: coGt ? 210 : 236, ny: coGt ? 478 : 524, nh: coGt ? 130 : 180, ex: R(110, 628, 1290, 250) },
      p: { y: 192, h: 128, ny: 332, nh: 92, ex: R(8, 436, 374, 134) },
    };
    const Y = dt ? tr.p : tr.d;
    const box = px(R(dt ? 8 : 112, Y.y, dt ? 374 : 1288, Y.h));
    box.y += dyH;
    const nB = phan.length;
    const hang2 = dt && nB > 2;
    const gX = Math.round((dt ? 8 : 34) * st.sx);
    const cols = hang2 ? Math.ceil(nB / 2) : nB;
    const bw = Math.floor((box.w - gX * (cols - 1)) / cols);
    const bh = hang2 ? Math.floor((box.h - gX) / 2) : box.h;
    const khoi = [], notes = [], xepK = [];
    // kich thuoc khoi OM chu: be ngang = chu + dem (khong qua bwK), cao = chu (+ dong cach doc / vai tro)
    const kichThuoc = (p, f, bwK, bhK) => {
      const tro = p.loai === 'chu';
      const capTxt = (dt ? [p.ro, p.body].filter(Boolean).join(' · ') : p.ro) || '';
      const motDong = kyTu(p.chu).length < (dt ? 6 : 8);
      const fro = Math.max(dt ? 13 : Math.max(15, 16 * hu), Math.min(24 * hu * 1.2, f * 0.22));       // may tinh >= 15 px: probe do chu 14 px x he so 0,95 (dich chu ro) = 13,3 px
      const roF = Math.round(dt ? Math.max(13, fro) : fro);
      // nhieu dong: kich thuoc that cua khoi chu (keep-all + <wbr>, padding 10 hu moi ben) o co f
      const hopK = motDong ? null : doHop('<span style="word-break:keep-all">' + daku(wbrJa(p.chu)) + '</span>', 'h-r-form' + (tro ? ' jpf' : ''), f, 1.08, bwK - 24 * hu - 20 * hu, tro ? 'ja' : '');
      const wChu = motDong ? rongTuNhien(tro ? jp(p.chu) : daku(esc(p.chu)), 'h-r-form' + (tro ? ' jpf' : ''), f, p.chu) * 1.06 : hopK.w + 20 * hu;
      const wRo = capTxt ? rongChu(capTxt, 'h-r-ro', roF) * 1.12 + 20 * hu : 0;
      const tw = Math.round(Math.min(bwK, Math.max(wChu + 2 * Math.max(0.07 * f, 10 * hu), wRo, f * 1.02)));
      const hNd = (motDong ? f * (tro ? 1.32 : 1.12) : hopK.h) + (capTxt ? (dt ? f * 0.2 + roF * 1.35 + 2 : fro * 1.7 + fro * 1.15) : 0);
      const th = Math.round(Math.min(bhK, Math.max(hNd + 2 * Math.max(0.06 * f, 8 * hu) + (motDong ? 0 : Math.max(4, 0.1 * f)), f * 1.12)));
      return { tw, th, fro, roF, motDong, capTxt, tro };
    };
    const veK = (it, f, z) => {
      const p = it.p, tro = z.tro;
      it.k.innerHTML = '<div class="h-o' + (tro ? ' tro' : '') + ' h-an" data-pj="' + it.i + '"><div class="chu h-r-form' + (tro ? ' jpf' : '') + '" style="font-size:' + f + 'px' + (!z.motDong ? ';text-align:center;white-space:normal;word-break:keep-all;overflow-wrap:normal;line-height:1.08;padding:0 ' + Math.round(10 * hu) + 'px' : '') + (z.capTxt && !dt ? ';margin-bottom:' + Math.round(z.fro * 1.7) + 'px' : '') + '" ' + (tro ? 'lang="ja"' : '') + '>' + (z.motDong ? (tro ? jp(p.chu) : daku(esc(p.chu))) : daku(wbrJa(p.chu))) + '</div>' +
        (z.capTxt ? '<div class="ro" style="font-size:' + z.roF + 'px">' + esc(z.capTxt) + '</div>' : '') + '<i class="h-vien"></i></div>';
    };
    let noteExtra = 0;       // chieu cao them cho hang ghi chu (day o giai thich xuong)
    if (proseRows) {
      // ---- van xuoi: cac dong xep doc, moi dong mot the rong (chu Nhat + mui ten + chu Viet trong ngoac), chu vua the
      const nR = phan.length, gV = Math.round(14 * st.sy);
      const yEnd = px(R(0, Y.ny + Y.nh, 1, 1)).y + dyH;
      // may tinh, >= 3 dong: 2 cot (moi the rong ~ nua be ngang, chu to hon han) — mot cot 4 hang chi con ~ 56 px cao moi hang = chu 15 px giua mot khoang trong ngang
      const nCot = !dt && nR >= 3 ? 2 : 1, nHang = Math.ceil(nR / nCot), gH = Math.round(24 * st.sx);
      const wO = nCot === 2 ? Math.floor((box.w - gH) / 2) : box.w;
      const hRmax = Math.max(30, Math.min(Math.round((dt ? (nR === 1 ? 118 : 84) : 128) * st.sy), Math.floor((yEnd - box.y - gV * (nHang - 1)) / nHang)));     // moi the cao toi da 128 thiet ke
      // moi dong: uu tien MOT dong (chu Nhat + chu Viet trong ngoac khong bi be giua cum: きや | きゃ); chi xuong dong khi mot dong nho hon 15 / 24 px
      const kq0 = phan.map((p) => {
        // 'N が 始まります (自: tự đến giờ)': cong thuc chinh (chu to, mot dong) + chu thich trong ngoac (chu nho hon, ngay duoi) — hai tang chu, khong mot dong chu nho dai
        const mg = !/≠/.test(p.chu) ? /^(.*[^\s(（])\s+([(（][^]*[)）])\s*$/.exec(String(p.chu)) : null;
        if (mg && RE_JP.test(mg[1])) {
          const wIn = wO - 52 * hu, fmx = T('form').max * 0.62, fmn = dt ? 14 : 22, gMin = dt ? 13 : 16;
          let fM = fit(jp(mg[1]), { w: wIn, h: hRmax * 0.5, max: fmx, min: fmn, lh: 1.2, cls: 'h-r-form', nowrap: true, txt: mg[1] });
          // cum chinh khong vua MOT dong ngay ca o co nho nhat (cau van xuoi dai 'Dùng cho HÀNH ĐỘNG ... 尊敬語'): cho xuong dong (toi da 3 / 2 dong), khong nowrap tran the
          const bao = rongChu(mg[1], 'h-r-form', fM) > wIn * 0.97 - 3;
          const wMain = wIn * 0.97 - 3, nM = (ff) => (bao ? Math.max(1, soDong(mg[1], 'h-r-form', ff, wMain)) : 1);
          if (bao) {
            fM = fit(jp(mg[1]), { w: wIn, h: hRmax * 0.62, max: fmx, min: fmn, lh: 1.2, cls: 'h-r-form', lines: dt ? 3 : 2, txt: mg[1] });
          }
          const gF = (ff) => Math.max(gMin, Math.round(ff * 0.6));
          const hG = (ff) => doHop(jp(mg[2]), 'h-r-phu', gF(ff), 1.2, wIn, 'ja').h;
          while (fM > fmn && nM(fM) * fM * 1.2 + hG(fM) + 4 * hu > hRmax * 0.9) fM--;
          return { gl: mg[2], main: mg[1], mot1: false, bao, f: fM, gF, html: '' };
        }
        const html = jp(p.chu);
        const f1d = fit(html, { w: wO - 52 * hu, h: hRmax * 0.84, max: T('form').max * 0.62, min: dt ? 13 : 20, lh: 1.2, cls: 'h-r-form', nowrap: true, strict: true, txt: p.chu });
        // mot dong qua nho (< 17 px dien thoai / 28 px may tinh): xuong dong, chu to hon han (cong thuc la noi dung chinh cua nhip, khong de 13 px)
        // so sanh 'A (..) ≠ B (..)': khi phai xuong dong, moi ve la mot dong KHOI rieng (khong be giua chuoi chu Nhat cua hai ve)
        const lados = String(p.chu).split(/\s+(?=≠)/);
        const htmlB = lados.length > 1 ? lados.map((x) => '<div>' + jp(x) + '</div>').join('') : html;
        const fW = fit(htmlB, { w: wO - 52 * hu, h: hRmax * 0.84, max: T('form').max * 0.62, min: dt ? 14 : 20, lh: 1.2, cls: 'h-r-form', lines: Math.max(lados.length, dt ? 3 : 2) });
        const mot1 = f1d > 0 && f1d >= (dt ? 13 : 24) && !(f1d < (dt ? 17 : 28) && fW >= f1d * 1.25);
        const f = mot1 ? f1d : fW;
        return { html: mot1 ? html : htmlB, mot1, f };
      });
      // cung mot co chu cho moi dong (khong dong to dong nho), the cao / rong theo noi dung that (do DOM)
      const fU = Math.min(...kq0.map((q) => q.f));
      const kq = kq0.map((q) => {
        if (q.gl) {
          const g = q.gF(fU), htmlM = '<div style="' + (q.bao ? 'text-wrap:balance' : 'white-space:nowrap') + '">' + jp(q.main) + '</div>';
          const glH = '<div class="h-pf-g" style="font-size:' + g + 'px;line-height:1.2;margin-top:' + Math.round(fU * 0.12) + 'px;padding:0 ' + Math.round(22 * hu) + 'px;font-weight:700;opacity:.82;text-align:center;text-wrap:balance;word-break:keep-all;overflow-wrap:anywhere">' + jp(q.gl) + '</div>';
          const hp = doHop(htmlM + glH, 'h-r-form', fU, 1.2, wO - 52 * hu, 'ja');
          // chu thich nam NGOAI khoi chu (.chu): khoi chu chi la cong thuc, chu thich la dong phu (xuong dong tu do, khong tinh la mot 'tu' cua cong thuc)
          return { html: htmlM, gloss: glH, mot1: false, f: fU, w: Math.min(wO, hp.w + 16), h: hp.h };
        }
        const hp = doHop(q.html, 'h-r-form', fU, 1.2, wO - 52 * hu, 'ja'); return { html: q.html, mot1: q.mot1, f: fU, w: Math.min(wO, hp.w + 16), h: hp.h };
      });
      // MOI the om chu cua no (cao + rong theo noi dung that), can giua trong o cua no; xep doc can giua trong khoang trong — khong the rong 330-370 px chua mot chu 'と' (SPARSE)
      const hRi = kq.map((q) => Math.max(30, Math.min(hRmax, Math.round(q.h + (q.gloss ? 32 : 24) * hu))));
      const wRi = kq.map((q) => Math.round(Math.min(wO, q.w + 2 * 30 * hu + 8)));
      // 2 cot: the cung cot bang be ngang nhau (cot thang hang), tru the le o hang cuoi
      // (chi khi the cung cot van dac chu: net chu chiem >= 36 % the; the ngan canh the dai thi moi the om chu rieng, can giua o cua no — khong the rong chua it chu)
      if (nCot === 2) {
        const wc = [0, 0]; wRi.forEach((w_, i) => { const solo_ = Math.floor(i / 2) === nHang - 1 && nR % 2 === 1; if (!solo_) wc[i % 2] = Math.max(wc[i % 2], w_); });
        const wEq = wRi.map((w_, i) => { const solo_ = Math.floor(i / 2) === nHang - 1 && nR % 2 === 1; return solo_ ? w_ : wc[i % 2]; });
        const fillEq = Math.min(...kq.map((q, i) => ((q.w - 16) / wEq[i]) * ((0.75 * q.h) / Math.max(1, hRi[i]))));
        if (fillEq >= 0.36) wEq.forEach((w_, i) => { wRi[i] = w_; });
      }
      const hHang = [];
      hRi.forEach((h_, i) => { const rw_ = Math.floor(i / nCot); hHang[rw_] = Math.max(hHang[rw_] || 0, h_); });
      const tongH = hHang.reduce((a2, b2) => a2 + b2, 0) + gV * (nHang - 1);
      const y0R = box.y + Math.max(0, Math.round((yEnd - box.y - tongH) / 2) - (dt ? 0 : Math.round(20 * st.sy)));
      const yHang = []; { let ya = y0R; hHang.forEach((h_, q) => { yHang[q] = ya; ya += h_ + gV; }); }
      phan.forEach((p, i) => {
        const rw_ = Math.floor(i / nCot), cl_ = i % nCot, solo = nCot === 2 && rw_ === nHang - 1 && nR % 2 === 1;     // hang cuoi le: mot the can giua ca be ngang
        const x0c = solo ? box.x + Math.round((box.w - wRi[i]) / 2) : box.x + (nCot === 2 ? cl_ * (wO + gH) : 0) + Math.round((wO - wRi[i]) / 2);
        const r = { x: x0c, y: yHang[rw_] + Math.round((hHang[rw_] - hRi[i]) / 2), w: wRi[i], h: hRi[i] };
        const khe = dat(mk('div', 'h-khe h-khe-b', c.el), r), k = dat(mk('div', 'h-khoi', c.el), r);
        const { html, mot1, f, gloss } = kq[i];
        k.innerHTML = '<div class="h-o h-an" data-pj="' + i + '"><div class="chu h-r-form" style="font-size:' + f + 'px;text-align:center;white-space:' + (mot1 ? 'nowrap' : 'normal') + ';word-break:keep-all;overflow-wrap:anywhere;line-height:1.2;padding:0 ' + Math.round(22 * hu) + 'px">' + html + '</div>' + (gloss || '') + '<i class="h-vien"></i></div>';
        khoi.push(k.firstChild);
      });
    } else {
      phan.forEach((p, i) => {
        const rw = hang2 ? Math.floor(i / cols) : 0, cl = hang2 ? i % cols : i;
        const x = box.x + cl * (bw + gX), y = box.y + rw * (bh + gX);
        const khe = dat(mk('div', 'h-khe h-khe-b', c.el), { x, y, w: bw, h: bh });
        const k = dat(mk('div', 'h-khoi', c.el), { x, y, w: bw, h: bh });
        const tro = p.loai === 'chu';
        const capTxt = (dt ? [p.ro, p.body].filter(Boolean).join(' · ') : p.ro) || '';
        const motDong = kyTu(p.chu).length < (dt ? 6 : 8);
        // nhieu dong: chi xuong dong o ranh gioi tu ICU (<wbr> + keep-all) — khong be 来ます帰|ります; tu dai hon o thi chu nho lai
        const htmlK = motDong ? (tro ? jp(p.chu) : daku(esc(p.chu))) : '<span style="word-break:keep-all">' + daku(wbrJa(p.chu)) + '</span>';
        const f = fit(htmlK, { w: bw - 24 * hu - (motDong ? 0 : 20 * hu), h: bh * (capTxt ? (dt ? 0.5 : 0.62) : 0.8), max: T('form').max * (tro && kyTu(p.chu).length > 3 ? 0.8 : 1), min: dt ? 18 : T('form').min, lh: 1, cls: 'h-r-form' + (tro ? ' jpf' : ''), nowrap: motDong, txt: motDong ? p.chu : null });   // nhieu dong: do DOM (xuong dong theo cum tu auto-phrase, khong be 感|慨)
        const it = { i, p, khe, k, f, bw, bh, x, y };
        const z = kichThuoc(p, f, bw, bh);
        const rr = { x: Math.round(x + (bw - z.tw) / 2), y: Math.round(y + (bh - z.th) / 2), w: z.tw, h: z.th };
        dat(khe, rr); dat(k, rr);
        veK(it, f, z);
        it.z = z; it.w = z.tw; it.h = z.th;
        xepK.push(it);
      });
      // ---- cac khoi cong thuc TRONG MOT HANG (may tinh / dien thoai <= 2 khoi): nhom can giua, khoang cach DEU (truoc: luoi cot cung buoc, khoi om chu nen khoang cach 138 / 89 / 41 px),
      // phong to ca nhom neu con rong (khoi co dinh nhu 'にもかゝわらず' khong con nho nhat), placeholder N / V / A khong to hon cum co dinh
      if (!hang2 && xepK.length) {
        const nK = xepK.length;
        const gC = Math.max(14, Math.round((dt ? 12 : 28) * hu));
        const tinh = () => { xepK.forEach((it) => { it.z = kichThuoc(it.p, it.f, it.bw, box.h); }); return xepK.reduce((a, it) => a + it.z.tw, 0) + gC * (nK - 1); };
        const f0 = xepK.map((it) => it.f), bw0 = xepK.map((it) => it.bw);
        // co chu CHUNG: cum co dinh (loai 'chu': です / にもかかわらず) co lon nhat vua ca hang (<= 97 % be ngang, <= 92 % chieu cao), placeholder N / V / A = 0,78 lan
        // (truoc: moi khoi tu vua cot cung buoc -> cum dai 7 chu chi 30 px, con 'N' to 70 px: dao nguoc thu bac)
        const coChu = xepK.some((it) => it.p.loai === 'chu'), kPh = coChu ? 0.78 : 1;
        let tot = 0, tim = false;
        for (let F = Math.round(T('form').max * 1.15); F >= (dt ? 18 : Math.round(T('form').min)); F -= 2) {
          xepK.forEach((it) => { it.f = it.p.loai === 'chu' ? F : Math.max(dt ? 16 : 14, Math.round(F * kPh)); it.bw = box.w; });
          tot = tinh();
          if (tot <= box.w * 0.97 && Math.max(...xepK.map((it) => it.z.th)) <= box.h * 0.92) { tim = true; break; }
        }
        if (!tim) { xepK.forEach((it, q) => { it.f = f0[q]; it.bw = bw0[q]; }); tot = tinh(); }
        let xC = box.x + Math.max(0, Math.round((box.w - tot) / 2));
        xepK.forEach((it) => {
          const z = it.z, r = { x: Math.round(xC), y: Math.round(box.y + (box.h - z.th) / 2), w: z.tw, h: z.th };
          dat(it.khe, r); dat(it.k, r);
          veK(it, it.f, z);
          it.cx = xC + z.tw / 2; xC += z.tw + gC;
        });
      } else xepK.forEach((it) => { it.cx = it.x + it.bw / 2; });
      xepK.forEach((it) => khoi.push(it.k.firstChild));
      // ---- ghi chu duoi moi khoi (vai tro: Danh từ / Trợ từ ...): can giua duoi khoi, rong toi thieu 210, khong chong nhau; cao theo noi dung (khong cat chu)
      if (!hang2) {
        const dsN = xepK.filter((it) => it.p.body);
        if (dsN.length) {
          const nTop = px(R(0, Y.ny, 1, 1)).y + dyH, nh0 = Math.round(Y.nh * st.sy), gN = Math.round(16 * st.sx);
          // rong ghi chu: vua chu (toi da 460), khong chong nhau — ghi chu ke ben khong co (chi 1 / 2 khoi co vai tro) thi duoc rong hon, khong bi ep thanh khung hep 3 dong
          const gioiHan = dsN.map((it, q) => {
            const l = q === 0 ? box.x : Math.round((dsN[q - 1].cx + it.cx) / 2 + gN / 2), r = q === dsN.length - 1 ? box.x + box.w : Math.round((it.cx + dsN[q + 1].cx) / 2 - gN / 2);
            void l; void r;
            return box.w;
          });
          let ws = dsN.map((it, q) => Math.min(gioiHan[q], Math.max(Math.round(150 * st.sx), Math.min(Math.round(460 * st.sx), Math.round(rongChu(it.p.body, 'h-r-nghia', T('nghia').max * 0.62) + 52 * hu + 12)))));
          const sumW = ws.reduce((a, b) => a + b, 0) + gN * (dsN.length - 1);
          if (sumW > box.w) ws = ws.map((w) => Math.max(Math.round(140 * st.sx), Math.floor(w * (box.w - gN * (dsN.length - 1)) / (sumW - gN * (dsN.length - 1)))));
          const xs = dsN.map((it, q) => Math.round(it.cx - ws[q] / 2));
          for (let q = 1; q < xs.length; q++) if (xs[q] < xs[q - 1] + ws[q - 1] + gN) xs[q] = xs[q - 1] + ws[q - 1] + gN;
          for (let q = xs.length - 1; q >= 0; q--) { const lim = q === xs.length - 1 ? box.x + box.w : xs[q + 1] - gN; if (xs[q] + ws[q] > lim) xs[q] = lim - ws[q]; }
          if (xs[0] < box.x) { const dd = box.x - xs[0]; for (let q = 0; q < xs.length; q++) xs[q] += dd; }
          const hCho = nh0 + Math.round(coGt ? 56 * st.sy : 90 * st.sy);     // cho them toi da (o giai thich lui xuong / khong co giai thich: con rong duoi)
          // truoc het theo chieu cao co dinh nh0 (cac ghi chu ngan khong phong to chu thanh o cao thua); chi khi co ghi chu BI CAT moi cap them toi hCho
          const mkNote = (hh) => dsN.map((it, q) => coVua('nghia', it.p.body, ws[q] - 52 * hu, hh - 52 * hu - 24 * hu, { lh: 1.1, lines: 2, cat: true, max: T('nghia').max * (kyTu(it.p.body).length <= 8 ? 1.05 : 0.8) }));
          let fns = mkNote(nh0);
          if (fns.some((f1, q) => f1.text !== dsN[q].p.body)) fns = mkNote(hCho);
          const need = Math.max(...fns.map((f1, q) => Math.ceil(Math.max(1, fitLines(f1.text, f1.fs, ws[q] - 52 * hu, 'h-r-nghia', 1.1)) * f1.fs * 1.1 + 52 * hu + 24 * hu + 6)));
          const nHt = Math.min(hCho, Math.max(nh0, need));
          noteExtra = nHt - nh0;
          dsN.forEach((it, q) => {
            const nr = { x: xs[q], y: nTop, w: ws[q], h: nHt };
            notes[it.i] = gap(c.el, ovPos('n' + it.i, nr), it.p.dai, '<div class="h-nghia h-r-nghia" style="font-size:' + fns[q].fs + 'px;text-align:center">' + esc(fns[q].text) + '</div>', it.p.loai === 'chu' ? (it.p.dai === 'Trợ từ' ? '' : 'nghe') : 'la');
            notes[it.i].dataset.giua = '1';
          });
        }
      }
    }
    // dien thoai 2 hang: cac khoi da om chu -> xep NOI TIEP trai sang phai nhu mot cau (N1 は N2 / じゃありません), khoang cach deu,
    // moi hang can giua (truoc: luoi 2 cot -> khoi nho lech giua o, doc nham thu tu)
    if (hang2 && xepK.length) {
      let hangs = [[]]; let wHang = 0;
      xepK.forEach((it) => { const cur = hangs[hangs.length - 1]; if (cur.length && wHang + gX + it.w > box.w) { hangs.push([it]); wHang = it.w; } else { cur.push(it); wHang += (cur.length > 1 ? gX : 0) + it.w; } });
      // 2 hang: chia lai cho hai hang can nhau (khong de hang cuoi mot khoi です le loi)
      if (hangs.length === 2) {
        const wDs = (ds) => ds.reduce((a, it) => a + it.w, 0) + gX * (ds.length - 1);
        let tot = null;
        for (let k = 1; k < xepK.length; k++) { const a = xepK.slice(0, k), b = xepK.slice(k); const m_ = Math.max(wDs(a), wDs(b)) + (b.length === 1 && a.length >= 2 ? 1e4 : 0); if (wDs(a) <= box.w && wDs(b) <= box.w && (!tot || m_ < tot.m)) tot = { m: m_, a, b }; }
        if (tot) hangs = [tot.a, tot.b];
      }
      const hH = hangs.map((h) => Math.max(...h.map((it) => it.h)));
      const tong = hH.reduce((a, b) => a + b, 0) + gX * (hangs.length - 1);
      let yH = box.y + Math.max(0, Math.round((box.h - tong) / 2));
      hangs.forEach((h, ri) => {
        const w = h.reduce((a, it) => a + it.w, 0) + gX * (h.length - 1);
        let xH = box.x + Math.round((box.w - w) / 2);
        h.forEach((it) => { const r = { x: xH, y: Math.round(yH + (hH[ri] - it.h) / 2), w: it.w, h: it.h }; dat(it.khe, r); dat(it.k, r); xH += it.w + gX; });
        yH += hH[ri] + gX;
      });
    }
    // ---- giai thich
    let EX = null, spans = [], reDt = null;
    if (coGt) {
      const re = RC('ex', { d: { x: 110, y: coGt ? 628 : 0, w: 1290, h: 250 }, p: tr.p.ex });
      if (!dt && noteExtra > 0) { re.y += noteExtra; re.h -= noteExtra; }     // ghi chu duoi khoi cao them -> o giai thich lui xuong
      if (!dt) re.h = Math.max(120 * st.sy, Math.min(re.h, Math.round(st.H * 0.78) - re.y));   // may tinh: day o tren mep co truoc
      // DIEN THOAI — dong chay doc: tieu de -> khoi cong thuc -> ghi chu -> giai thich dinh sat nhau (khe 12), giai thich chiem het cho toi day (co truoc / goc meo ~0,84 H),
      // noi dung ngan thi ca khoi (cong thuc + ghi chu + giai thich) can giua trong khoang con lai — khong con dai trong 100-190 px giua cong thuc va giai thich
      let dichKhoi = null;
      if (dt) {
        const day = Math.round(st.H * 0.84);
        const dsT = Array.from(c.el.querySelectorAll(':scope > .h-khe, :scope > .h-khoi')), dsN = notes.filter(Boolean);
        const topOf = (e) => parseFloat(e.style.top), botOf = (e) => parseFloat(e.style.top) + parseFloat(e.style.height);
        const dich = (e, dy) => { e.style.top = Math.round(parseFloat(e.style.top) + dy) + 'px'; };
        const khe12 = Math.round(12 * st.sy);
        if (dsT.length) {
          const up = Math.min(...dsT.map(topOf)) - (rh.y + rh.h + khe12);
          if (up > 0) dsT.concat(dsN).forEach((e) => dich(e, -up));
          if (dsN.length) { const dn = Math.round(Math.max(...dsT.map(botOf)) + khe12) - Math.min(...dsN.map(topOf)); dsN.forEach((e) => dich(e, dn)); }
        }
        const yKhoi = dsT.length ? Math.max(...dsT.concat(dsN).map(botOf)) : rh.y + rh.h;
        re.y = Math.round(yKhoi + khe12); re.h = Math.max(70 * st.sy, day - re.y);
        dichKhoi = { day, dsT, dsN, dich, tren: dsT.length ? Math.min(...dsT.map(topOf)) : re.y };
      }
      const inW = re.w - 52 * hu, inH = re.h - 52 * hu - 20 * hu;
      const f = coVua('phu', expl, inW, inH, { lh: LH_VJ, cat: dt, max: dt ? T('phu').max * 1.12 : 36 * hu, min: dt ? 13 : Math.max(14, 17 * hu), jpx: 1 });
      const ds = cauThanh(dt ? f.text : expl);
      const html = ds.map((s, i) => '<span class="h-cau-gt" data-s="' + i + '">' + jp(i === ds.length - 1 ? khongMoCoi(s) : s) + '</span>').join(' ');
      const htmlG = '<div class="h-gt-text h-r-phu" style="font-size:' + f.fs + 'px">' + html + '</div>';
      reDt = { x: re.x, y: re.y, w: re.w, h: re.h };
      let rEx = re;
      if (dt && !(coTips || coVh)) {
        // chi co giai thich: o om chu (khong de the cao rong) roi can giua ca khoi trong khoang con lai
        rEx = omGap(re, htmlG, 'Giải thích', { giua: true, minW: re.w });
        const du = dichKhoi.day - (rEx.y + rEx.h), dy = Math.max(0, Math.min(Math.round(du / 2), Math.round(60 * st.sy)));
        if (dy > 0) { dichKhoi.dsT.concat(dichKhoi.dsN).forEach((e) => dichKhoi.dich(e, dy)); rEx = Object.assign({}, rEx, { y: rEx.y + dy }); }
      }
      EX = gap(c.el, rEx, 'Giải thích', htmlG, 'la');
      spans = Array.from(EX.querySelectorAll('.h-cau-gt'));
    }
    // ---- luu y / van hoa (cot phai tren may tinh, duoi cung tren dien thoai)
    const lay = [];
    let LU = null, VHc = null;
    const nCard = (coTips ? 1 : 0) + (coVh ? 1 : 0);
    if (nCard) {
      const rx = dt ? { x: 8, w: 374 } : { x: 1430, w: 430 };
      const yTop = dt ? 580 : 170, yBot = dt ? 664 : 770;
      // may tinh: cot phai tu y = 170 xuong toi dau meo (~770 thiet ke), moi the cao theo NOI DUNG (khong cat chu), xep chong cach 30 — truoc: 2 the chia doi 170..690 va cat '…'
      // day cot sticker khong xuong qua dau meo that (meo.y + 36 la dinh dau meo): sticker + meo dang phong len khong de chong nhau
      const yBotPx = Math.min(px(R(0, yBot, 1, 1)).y, !dt && st.meo ? st.meo.y + 28 : 1e9), gapS = Math.round(30 * st.sy);
      let yCur = px(R(0, yTop, 1, 1)).y;
      const mk1 = (txt, nhan, mau, i, goc) => {
        const r0 = px(R(rx.x, yTop, rx.w, 100));
        const inW = r0.w - 44 * hu, chuaDu = yBotPx - yCur - (nCard - 1 - i) * (gapS + Math.round(110 * st.sy));
        const mkF = (hh) => coVua('dan', txt, inW, hh - 74 * hu, { lh: LH_VJ, cat: true, jpx: 1, max: T('phu').max * 1.15, min: dt ? 13 : Math.max(14, 17 * hu) });
        let f = dt ? mkF(100 * hu) : mkF(Math.max(110 * st.sy, (yBotPx - yCur - gapS * (nCard - 1 - i)) / (nCard - i)));
        if (!dt && f.text !== txt) f = mkF(Math.max(110 * st.sy, chuaDu));
        const lines = Math.max(1, fitLines(f.text, f.fs, inW, 'h-r-dan', LH_VJ, true));
        const hh = dt ? 0 : Math.round(Math.min(Math.max(110 * st.sy, chuaDu), Math.max(110 * st.sy, lines * f.fs * LH_VJ + 74 * hu)));
        const r = dt ? px(R(rx.x, 0, rx.w, 10)) : { x: r0.x, y: yCur, w: r0.w, h: hh };
        if (!dt) yCur += hh + gapS;
        const e = dan(c.el, dt ? { x: 0, y: 0, w: 0, h: 0 } : r, '<div class="h-dan-nhan">' + nhan + '</div><span class="h-r-dan" style="line-height:' + LH_VJ + ';font-size:' + f.fs + 'px">' + jp(khongMoCoi(f.text)) + '</span>', mau, goc);
        return e;
      };
      if (!dt) {
        if (coTips) LU = mk1(tips, 'Lưu ý', 'la', 0, -1.5);
        if (coVh) VHc = mk1(vh, 'Văn hóa', '', coTips ? 1 : 0, 1.5);
      } else {
        // dien thoai: khong du cho cho 3 khung cung luc -> luu y / van hoa chiem cung o voi "Giai thich" (doi khi Sensei noi toi)
        const re2 = reDt || RC('ex', tr);
        const rows = [];
        if (coTips) rows.push(['Lưu ý', tips, 'la', -1.5]);
        if (coVh) rows.push(['Văn hóa', vh, '', 1.5]);
        rows.forEach((rw, i) => {
          const r = { x: re2.x, y: re2.y, w: re2.w, h: re2.h - 6 };
          const f = coVua('dan', rw[1], r.w - 36 * hu, r.h - 44 * hu, { lh: LH_VJ, cat: true, jpx: 1, max: 16 * st.pf, min: 13 });
          const e = dan(c.el, r, '<div class="h-dan-nhan">' + rw[0] + '</div><span class="h-r-dan" style="line-height:' + LH_VJ + ';font-size:' + f.fs + 'px">' + jp(khongMoCoi(f.text)) + '</span>', rw[2], rw[3]);
          if (rw[0] === 'Lưu ý') LU = e; else VHc = e;
        });
      }
    }
    // ---- hien / tieu diem
    const tro_ = (i) => khoi[i];
    const roi_ = (i) => { const e = khoi[i]; if (!e || !rangBuoc(c)) return; const p = phan[i]; A.roi(e, 0); snd(p.loai === 'chu' ? 'step' + (1 + (i % 2) * 2) : 'step' + (i % 4), 0.02); if (p.loai === 'chu') snd('stamp', 0.02); if (notes[i]) mocVao(c, 'n' + i, 0.38); };
    c.rev = { hd: () => { A.lat(hd, 0); snd('tick', 0.02); } };
    khoi.forEach((e, i) => { c.rev['b' + i] = () => roi_(i); });
    notes.forEach((g, i) => { if (g) c.rev['n' + i] = () => { A.moGap(g, 0); snd('ding', 0.02); }; });
    if (EX) c.rev.gt = () => { A.moGap(EX, 0); snd('ding', 0.02); };
    const mo_ = (e) => { [EX, LU, VHc].forEach((x) => { if (x && x !== e && dt) G.to(x, { autoAlpha: 0, duration: D(0.15), overwrite: 'auto' }); }); };
    // dung lai canh o trang thai cuoi (doi co): dien thoai chi hien GIAI THICH (luu y / van hoa chiem cung o va se de len) — khong de sticker cuoi che giai thich
    if (LU) c.rev.lu = () => { if (INST && dt) return; mo_(LU); A.dan(LU, 0, -1.5); snd('tick', 0.02); };
    if (VHc) c.rev.vh = () => { if (INST && dt) return; mo_(VHc); A.dan(VHc, 0, 1.5); snd('tick', 0.02); };
    c.phan = phan; c.map = map; c.khoi = khoi; c.notes = notes; c.EX = EX; c.spans = spans; c.hdEl = hd; c.LU = LU; c.VH = VHc;
    c.chay = () => {
      mocVao(c, 'hd', tre('header'));
      khoi.forEach((e, i) => mocVao(c, 'b' + i, tre('khoi') + 0.3 * i));
      const tgt = tre('khoi') + 0.3 * khoi.length;
      if (EX) mocVao(c, 'gt', Math.max(tre('giaiThich'), tgt + 0.4));
      // luu y / van hoa hien theo CUE G5 / G6 (Sensei noi toi) — dien thoai: moi o THAY o truoc nen khong co moc co dinh som (o hien khong khop loi noi);
      // may tinh: moc du phong muon, va moi cue G4 day moc nay ra sau (xem cueMauCau): luu y / van hoa khong nhay ra truoc khi Sensei noi 14-19 s
      const luDP = EX ? tgt + 14 : Math.max(tre('luuY'), tgt + 1.4);
      if (LU) mocVao(c, 'lu', dt ? 90 : luDP);
      if (VHc) mocVao(c, 'vh', dt ? 90 : luDP + 3);
    };
  }
  function cueMauCau(m, id, tt, api, nh, c) {
    const t = api.tre(tt);
    if (!c.phan) return;
    const tim = (loai, j) => c.phan.findIndex((p) => p.loai === loai && p.j === j);
    const dich = (loai, j) => {
      // chi so khoi chua phan goc: neu da gop thi tim theo map
      const cp = nh.congThuc && nh.congThuc.phan;
      if (cp) { let dem = 0; for (let q = 0; q < cp.length; q++) { const l = cp[q].loai === 'chu' ? 'chu' : 'o'; if (l === loai) { if (dem === j) return c.map[q]; dem++; } } return -1; }
      return tim(loai, j);
    };
    let x, i = -1;
    if ((x = /^G2\.(\d+)$/.exec(id))) i = dich('chu', +x[1]);
    else if ((x = /^G3\.(\d+)$/.exec(id))) i = dich('o', +x[1]);
    else if ((x = /^G2p\.(\d+)$/.exec(id))) { const dsJ = c.phan.reduce((a, p, q) => (RE_JP.test(p.chu) ? a.concat(q) : a), []); i = dsJ.length && c.phan.some((p) => !RE_JP.test(p.chu)) ? (dsJ[Math.min(+x[1], dsJ.length - 1)]) : Math.min(+x[1], c.khoi.length - 1); }
    if (id === 'G0') { mocVao(c, 'hd', t); A.nay(c.hdEl, t + 0.4, 1.015); return; }
    // chua toi G5 / G6: du phong tinh tu cue G* CUOI CUNG vua toi (moi cue G* day moc ra sau) — khong chen ra truoc khi Sensei noi toi luu y / van hoa
    if (/^G(?!5$|6$)/.test(id) && !st.dt) { mocDoi(c, 'lu', t + 9); mocDoi(c, 'vh', t + 12); }
    if (i >= 0 && c.khoi[i]) {
      // khoi truoc chua vao (Sensei noi nhay coc) -> vao truoc theo thu tu
      for (let q = 0; q < i; q++) mocVao(c, 'b' + q, t);
      const vao = mocVao(c, 'b' + i, t);
      if (!vao) A.tieuDiem(c.khoi[i], t, 1.07);
      else A.vien(c.khoi[i], t + 0.5);
      return;
    }
    if ((x = /^G2c\.(\d+)$/.exec(id))) { const k = dich('chu', +x[1]); if (k >= 0 && c.khoi[k]) { mocVao(c, 'b' + k, t); A.tieuDiem(c.khoi[k], t, 1.08); } return; }
    if ((x = /^G4\.(\d+)$/.exec(id))) {
      if (c.EX) {
        mocVao(c, 'gt', t);
        const s = c.spans[Math.min(+x[1], c.spans.length - 1)];
        if (s && !giam()) {
          c.spans.forEach((o, q) => { if (o !== s) G.to(o, { backgroundColor: 'rgba(214,169,74,0)', duration: 0.25, delay: t, overwrite: 'auto' }); });
          G.to(s, { backgroundColor: 'rgba(214,169,74,.38)', duration: 0.16, delay: t + 0.1, overwrite: 'auto' });
        }
      }
      return;
    }
    if (id === 'G5' && c.LU) { mocDoi(c, 'lu', t, true); A.nay(c.LU, t + 0.1, 1.05); }
    if (id === 'G6' && c.VH) { mocDoi(c, 'vh', t, true); A.nay(c.VH, t + 0.1, 1.05); }
  }

  // ================================================================== VI DU (cau gom cac o chu)
  /** Xep cac o chu thanh 1..3 hang, chu to nhat vua khung. items: [{html, doc, ro}], tra { r, rows, fs, rects } (rect trong khung W x H) */
  function xepO(items, W, hCap, tk, boardH, maxR) {
    // kich thuoc THAT theo co chu fs: ruby / ro co san 13 px (css .h-hang .h-o .ruby / .ro) -> o chu nho (dien thoai, cau dai)
    // cao / rong hon ti le em co dinh (truoc: hang tren de len ruby hang duoi, chu tran o)
    const do0 = items.map((it) => ({
      a: rongTuNhien(it.html, 'h-r-tile', 100, it.txt || it.base) / 100 * 1.06,   // chu + dau cau gop vao (いい、)   // do bang font h-r-tile, o hien Zen Maru 900: chu tran mep o vai px -> +6 %
      b: it.doc ? rongTuNhien(esc(it.doc), 'h-r-ruby', 100, it.doc) / 100 : 0,
      c: it.ro ? rongTuNhien(esc(it.ro), 'h-r-ro', 100, it.ro) / 100 : 0,
    }));
    const SR = st.dt ? 13 : 14;   // san co ruby / ro (css .h-hang .h-o .ruby / .ro)
    const rongO0 = (i, fs) => { const d = do0[i]; return Math.max(d.a * fs + Math.max(0.44 * fs, 14), d.b * Math.max(0.39 * fs, SR) + Math.max(0.34 * fs, 12), d.c * Math.max(0.26 * fs, SR) * 1.06 + Math.max(0.34 * fs, 18), 1.5 * fs); };   // dem ngang >= 7 px moi ben
    // o CHI CO chu (khong ruby / nghia ro) ma net chu chiem < 40 % o 1,5 x 1,62 em (っ, つ, ン, 私 mot minh): o OM net — rong vua chu + dem .15 em (>= 6 px), cao vua net + dem .14 em (>= 9 px), toi da dang 1,7 : 1
    const inkO = items.map((it) => inkTile(it.txt || it.base || ''));
    // ck: o chu chiem < 40 % o (tinh theo chieu cao tieu chuan cua o: 1,62 em, them hang ruby / nghia ro neu co) -> be ngang om hon (dem .15 em, ruby / ro dem .1 em)
    const ck = items.map((it, i) => (do0[i].a / 1.06) * (inkO[i].asc + inkO[i].desc) / (rongO0(i, 100) / 100 * Math.max(1.62, (it.doc ? 0.5 : 0) + 1.26 + (it.ro ? 0.3 : 0) + 0.16)) < 0.4);
    const gon = items.map((it, i) => ck[i] && !it.doc && !it.ro);       // o chi co chu: cao cung om net (hFila)
    const rongO = (i, fs) => { if (!ck[i]) return rongO0(i, fs); const d = do0[i]; return Math.max(d.a * fs + Math.max(0.3 * fs, 12), d.b * Math.max(0.39 * fs, SR) + Math.max(0.2 * fs, 13), d.c * Math.max(0.26 * fs, SR) * 1.06 + Math.max(0.2 * fs, 18), 1.12 * fs); };   // dem >= 6 px moi ben (soat() doi chu cach mep o >= 6 px)
    const padV = (fs) => Math.max(0.14 * fs, 9);
    const tatGon = (rw) => rw.every((i) => gon[i]);
    // hang chi co o om net: cac chu chung MOT duong co so (chu Nhat dung tren cung "mat dat"), cao = net cao nhat + dem; day o thang hang
    // dang toi da 1,7 : 1 chi cho o MOT chu det (っ, つ): o nhieu chu (いい、) rong vi chu dai, khong keo cao them (net chu se lech len tren)
    const det = (i) => kyTu(items[i].txt || items[i].base || '').length <= 1;
    const hFila = (rw, fs) => Math.max((Math.max(...rw.map((i) => inkO[i].asc)) + Math.max(...rw.map((i) => inkO[i].desc))) * fs + 2 * padV(fs), ...rw.map((i) => (det(i) ? rongO(i, fs) / 1.7 : 0)));
    // hang ruby / hang nghia ro chi tinh khi CO o nao trong cau dung toi (cau khong furigana / khong gloss: o thap hon, chu khong lot giua o cao)
    const coRb = items.some((it) => it.doc), coRo = items.some((it) => it.ro);
    const rbH = (fs) => Math.max(16, 1.28 * Math.max(0.39 * fs, SR)), roH = (fs) => 1.15 * Math.max(0.26 * fs, SR);
    // chieu cao MOT HANG o: hang ruby chi khi co o trong hang co furigana, hang nghia ro chi khi co o trong hang co gloss (o tung o OM theo noi dung cua no:
    // chu van thang hang trong hang); chu: dong 1.12 + le duoi .14 em (vung chu Zen Maru khong de len dong nghia ro); dem duoi = css .h-hang .h-khe > .h-o
    const hangH = (rw, fs) => {
      const rb = coRb && rw.some((i) => items[i].doc) ? rbH(fs) : 0, ro = coRo && rw.some((i) => items[i].ro) ? roH(fs) : 0;
      if (!rb && !ro && tatGon(rw)) return { rb, ro, h: hFila(rw, fs) };
      return { rb, ro, h: Math.max(1.62 * fs, rb + 1.26 * fs + ro + Math.max(0.16 * fs, 11)) };
    };
    const em = items.map((it, i) => rongO(i, 100) / 100);
    const gX = 0.24, gY = 0.2;
    const chia = (r) => {
      const tot = em.reduce((a, x) => a + x, 0) + gX * (items.length - r);
      const rows = [[]];
      let acc = 0;
      items.forEach((it, i) => {
        if (rows[rows.length - 1].length && rows.length < r && acc + em[i] / 2 > tot * rows.length / r) rows.push([]);
        rows[rows.length - 1].push(i);
        acc += em[i] + gX;
      });
      // hang cuoi chi con MOT o ngan (です / か): keo o cuoi cua hang tren xuong cho du doi — khong de 'です' mot minh duoi cac hang dai
      for (let q = rows.length - 1; q > 0; q--) if (rows[q].length === 1 && rows[q - 1].length >= 2 && em[rows[q][0]] < 2.6) rows[q].unshift(rows[q - 1].pop());
      return rows;
    };
    const vua = (rows, H, fs) => rows.every((rw) => rw.reduce((a, i) => a + rongO(i, fs), 0) + gX * fs * (rw.length - 1) <= W)
      && rows.reduce((a, rw) => a + hangH(rw, fs).h, 0) + (rows.length - 1) * gY * fs <= H;
    let best = null;
    for (let r = 1; r <= Math.min(maxR || 3, items.length); r++) {
      const rows = chia(r);
      const H = boardH(r);
      if (H > hCap) continue;
      let fs = Math.floor(tk.max);
      while (fs > 10 && !vua(rows, H, fs)) fs--;
      // hang cuoi chi con MOT o ngan (です / か) tinh la xau: phat 18 % de uu tien cach chia khac neu chu khong nho hon nhieu
      const pt = rows.length > 1 && rows[rows.length - 1].length === 1 && em[rows[rows.length - 1][0]] < 2.6 ? 0.82 : 1;
      if (!best || fs * pt > best.fs * best.pt * 1.12) best = { r, rows, fs, H, pt };
    }
    if (!best) { const rows = chia(Math.min(maxR || 3, items.length)); const H = boardH(rows.length); let fs = Math.floor(tk.min); while (fs > 10 && !vua(rows, H, fs)) fs--; best = { r: rows.length, rows, fs, H }; }
    best.fs = Math.max(10, Math.min(best.fs, Math.floor(tk.max)));
    const fs = best.fs;
    const gy = gY * fs;
    const hh = best.rows.map((rw) => hangH(rw, fs));
    const tH = hh.reduce((a, x) => a + x.h, 0) + (best.rows.length - 1) * gy;
    const rects = [];
    let yR = 0;
    best.rows.forEach((rw, ri) => {
      const wRow = rw.reduce((a, i) => a + rongO(i, fs), 0) + gX * fs * (rw.length - 1);
      let x = (W - wRow) / 2;
      rw.forEach((i) => {
        const w = rongO(i, fs), it = items[i];
        // o khong co ruby / gloss trong hang co hang do: cat bot o phia tren / duoi (o thap hon, chu van thang hang)
        rects[i] = { x, y: yR + (hh[ri].rb && !it.doc ? hh[ri].rb : 0), w, h: hh[ri].h - (hh[ri].rb && !it.doc ? hh[ri].rb : 0) - (hh[ri].ro && !it.ro ? hh[ri].ro : 0), giua: !hh[ri].rb && !hh[ri].ro };
        // o om net trong hang chi co o om net: day o thang hang; chu ngan hon (っ) thap hon va chi nhin tu day len; noi dung (can giua o) dich de chu dung tren chung mot duong co so (css .h-ink .chu top = --h-dy)
        if (gon[i] && !hh[ri].rb && !hh[ri].ro && tatGon(rw)) {
          const hRow = hh[ri].h, D = Math.max(...rw.map((q) => inkO[q].desc)), pad = padV(fs);
          const hOwn = Math.max((inkO[i].asc + D) * fs + 2 * pad, det(i) ? w / 1.7 : 0), hg = hOwn < 0.7 * hRow ? hOwn : hRow, top = hRow - hg;
          rects[i].h = hg; rects[i].y = yR + top; rects[i].ink = true;
          rects[i].dy = (hRow - pad - D * fs) - (top + hg / 2 + inkO[i].bo * fs);
        }
        x += w + gX * fs;
      });
      yR += hh[ri].h + gy;
    });
    best.rects = rects; best.tH = tH; best.coRb = coRb; best.coRo = coRo;
    return best;
  }
  function tokGloss(t, bai, kana) {
    const base = chuTok(t);
    if (t && t.isKeyGrammar && !kana) {
      const rol = DOC_TRO[base] ? 'đọc “' + DOC_TRO[base] + '”' : (C.vaiTro(base) || '');
      return rol;
    }
    return C.nghiaTu(t, bai) || '';
  }
  function dungViDu(nh, api, m, c) {
    const d = nh.data || {};
    const hu = st.hu, dt = st.dt, toks = d.tokens || [];
    const kana = laKanaNh(nh);       // bai nhap mon: chu cai trong cau vi du khong phai tro tu (khong nhan 'wa' / 'ka' / vai tro)
    const slide = (nh.beat && nh.beat.slide) || {};
    // ---- cac o chu: dau cau gop vao o truoc
    const items = [];
    toks.forEach((t, i) => {
      if (!t) return;
      // dau cham cau va dau keo dai 'ー' dung rieng mot token (フォ | ー): gop vao o truoc — 'ー' khong phai mot am tiet, o rieng chi chua mot gach ngang (the cao rong, net chu 6 %)
      if (laDau(t) || (items.length && /^ー+$/.test(chuTok(t)))) { if (items.length) { const q = items[items.length - 1]; q.html += esc(chuTok(t)); q.txt += chuTok(t); q.toks.push(i); } return; }
      const base = chuTok(t);
      const key = !!t.isKeyGrammar;
      // o troi (tro): ruby trong suot (css) -> khong chua hang ruby (o om chu)
      const doc = !key && t.kanji && t.furigana && t.furigana !== t.kanji ? t.furigana : '';
      const ro = key && !kana ? (ROMAJI_TRO[base] || (C.vaiTro(base) ? '' : '')) : '';
      items.push({ html: daku(esc(base)), doc, ro: ro || (key ? '' : ''), tro: key && !kana, toks: [i], id: t.id, base, txt: base, gl: tokGloss(t, nh.bai, kana) });
    });
    // ro (phu duoi o): tro tu -> romaji; con lai -> nghia ngan neu co (khong qua dai)
    items.forEach((it) => { if (!it.ro && !it.tro && it.gl) it.ro = nganTu(it.gl, 12); });
    const tk0 = T('tile');
    // cau rat ngan (1-3 o: 'かぎ', '走れ！'): o chu to toi 1,7 lan (truoc: bang 965 px chi chua 2 o ~100 px, nua duoi san khau trong)
    const tk = items.length <= 3 ? { max: tk0.max * (!dt && items.length <= 2 ? 2.3 : 1.7), min: tk0.min } : tk0;
    const L5 = {
      d: { bang: R(110, 112, 1290, 262), nhan: R(140, 74, 200, 50) },
      p: { bang: R(8, 86, 374, 150), nhan: R(16, 56, 180, 30) },
    };
    const Lx = dt ? L5.p : L5.d;
    const rb0 = RC('bang', L5);
    // nhan 'Vi du · ...' (ten mau cau): dai theo CHIEU RONG that con lai (toi mep trai the bai / mep man); dien thoai: ten dai -> 2 dong (khong cat '…'), bang dich xuong mot dong
    const tenSlide = String(slide.title || '').replace(/^\d+\.\s*/, '').split(/:\s*/)[0].trim();
    const xNhan = rb0.x + (dt ? 8 : 30 * st.sx);
    const mepPhai = dt ? st.W - 8 : Math.min(rb0.x + rb0.w, st.W - 424 * hu - 16);
    const wNhan = Math.max(120, mepPhai - xNhan - (dt ? 36 : 52) * hu);
    const nhanFull = 'Ví dụ' + (tenSlide ? ' · ' + tenSlide.toLowerCase() : '');
    let fN = coVua('dan', nhanFull, wNhan, 50 * st.sy, { nowrap: true, cat: true, max: (dt ? 14 : 26 * hu), min: dt ? 13 : 16, lh: 1.1 });
    let nhanDong = 1;
    if (dt && fN.text !== nhanFull) {
      const f2n = coVua('dan', nhanFull, wNhan, 2 * 14 * 1.2 + 4, { lines: 2, cat: true, max: 14, min: 13, lh: 1.15 });
      if (kyTu(f2n.text).length > kyTu(fN.text).length) { fN = f2n; nhanDong = 2; rb0.y += Math.round(f2n.fs * 1.2); }
    }
    const pad = dt ? Math.max(12, 20 * hu) : 32 * hu;     // dien thoai: dem >= 12 px (truoc 5 px: o chu + bong sat mep bang)
    // may tinh: day vung duoi bang = mep co truoc (0,78 H; truoc 886/1080 nam duoi co); bang 3 hang khong duoc cao toi muc
    // o nghia chi con ~86 px (N2/N1 cau dai) -> tran: luon chua >= 170 cho o nghia
    const yMax = Math.round(dt ? st.H * 0.85 : st.H * 0.78);   // dien thoai: co truoc tu ~0,88 H
    const bangMax = dt ? Infinity : Math.max(rb0.h, yMax - rb0.y - Math.round(26 * st.sy) - Math.round(170 * st.sy));
    const bH = (r) => Math.round(Math.min(rb0.h * (dt ? [items.length <= 3 ? 1.3 : 1, 1.4, 1.8, 2.2, 2.6] : [items.length <= 2 ? 2.0 : items.length <= 3 ? 1.5 : 1, 1.5, 2.15])[r - 1], bangMax));
    const xp = xepO(items, rb0.w - 2 * pad, Math.round(st.H * (dt ? 0.52 : 0.62)), tk, (r) => bH(r) - 2 * pad, dt ? 5 : 3);   // dien thoai toi 5 hang (cau 15+ tu o man 320-360 px: moi hang van dung be ngang that, chu khong con 10 px / tran mep man)
    // bang OM cac hang o (dem deu tren / duoi = pad): phan thua cho nghia / chan dung ben duoi (truoc: bang cao co dinh theo so hang, o chu giua bang rong)
    const boardH = Math.round(Math.min(bH(xp.r), xp.tH + 2 * pad));
    // cau ngan (<= 3 o, may tinh): bang om hang o (can trai thang hang voi o nghia), o chu can giua trong bang — khong de 2 o nho giua bang rong 965 px
    let wB = rb0.w, dxT = 0;
    if (!dt && items.length <= 3) {
      const xs_ = xp.rects.filter(Boolean), wUsed = Math.max(...xs_.map((q) => q.x + q.w)) - Math.min(...xs_.map((q) => q.x));
      wB = Math.round(Math.min(rb0.w, Math.max(wUsed + 2 * pad + 90 * hu, 520 * hu)));
      dxT = Math.round(((rb0.w - 2 * pad) - (wB - 2 * pad)) / 2);
    }
    const bang = dat(mk('div', 'h-bang h-an', c.el), { x: rb0.x, y: rb0.y, w: wB, h: boardH });
    const tilesBox = dat(mk('div', 'h-hang', c.el), { x: rb0.x + pad, y: rb0.y + pad, w: wB - 2 * pad, h: boardH - 2 * pad });
    const tiles = [];
    items.forEach((it, i) => {
      const r = Object.assign({}, xp.rects[i]);
      r.x -= dxT;
      r.y += Math.max(0, (boardH - 2 * pad - xp.tH) / 2);
      const khe = dat(mk('div', 'h-khe', tilesBox), { x: r.x, y: r.y, w: r.w, h: r.h });
      khe.style.position = 'absolute';
      khe.innerHTML = '<div class="h-o' + (it.tro ? ' tro' : '') + (it.doc ? '' : ' h-no-rb') + (it.ro ? '' : ' h-no-ro') + (r.giua ? ' h-c' : '') + (r.ink ? ' h-ink' : '') + ' h-an" data-tid="' + esc(it.id || '') + '" style="font-size:' + xp.fs + 'px' + (r.ink ? ';--h-dy:' + Math.round(r.dy * 10) / 10 + 'px' : '') + '"><div class="ruby">' + (it.doc ? esc(it.doc) : '') + '</div><div class="chu" lang="ja">' + it.html + '</div><div class="ro">' + (it.ro ? esc(it.ro) : '&nbsp;') + '</div><i class="h-vien"></i></div>';
      tiles.push(khe.firstChild);
    });
    const tokTile = {};
    items.forEach((it, k) => it.toks.forEach((i) => { tokTile[i] = k; }));
    // ---- nhan "Vi du · ..." tren goc bang
    const nhanTxt = fN.text;
    const nhan = nhanDong === 2
      ? dan(c.el, { x: xNhan, y: rb0.y - Math.round(24 * st.sy) - Math.round(fN.fs * 1.2), w: Math.round(wNhan + 36 * hu), h: Math.round(2 * fN.fs * 1.2 + 16 * hu) }, '<span class="h-r-dan" style="font-size:' + fN.fs + 'px;line-height:1.2;white-space:normal;display:block">' + jp(nhanTxt) + '</span>', '', -2)
      : dan(c.el, { x: xNhan, y: rb0.y - Math.round((dt ? 24 : 38) * st.sy), w: Math.round(rongTuNhien(esc(nhanTxt), 'h-r-dan', fN.fs, nhanTxt) + 52 * hu), h: Math.round(fN.fs * 1.2 + 16 * hu) }, '<span class="h-r-dan" style="font-size:' + fN.fs + 'px;white-space:nowrap">' + esc(nhanTxt) + '</span>', '', -2);
    nhan.classList.add('h-nho');
    // ---- phan duoi bang: chan dung | nghia | the N = ...
    const ty = rb0.y + boardH + Math.round((dt ? 12 : 26) * st.sy);
    const availH = yMax - ty;
    const anhUrl = C.anhCau(toks, nh.bai) || (nh.bai && nh.bai.sceneImageUrl) || null;
    const ros0 = anhUrl && availH >= (dt ? 190 : 230 * st.sy);   // dien thoai cho thap (cau dai 3 hang): bo chan dung, o nghia full be ngang
    // nghia cau + dong gloss (tu = nghia): thu voi chan dung; neu nghia BI CAT ('...anh thích cái nào hơn?' -> 'anh…') thi tren dien thoai bo chan dung (o nghia full be ngang)
    // va o cao them toi het khoang trong duoi bang (truoc: ep 3 dong trong o 232 px rong, con 150-250 px phong nen trong phia duoi)
    const ng = tachNghia(d.meaningVi);
    const txtM = (ng.chinh || d.meaningVi || '') + (ng.phu ? ' (' + ng.phu + ')' : '');
    const glossTxt = items.filter((it) => it.gl).slice(0, 5).map((it) => it.base + ' = ' + it.gl).join('  ·  ');
    const dauMeo = dt && st.meo ? st.meo.y + 36 - 6 : Infinity;
    const gAp = nh.ghep, cpAp = nh.congThuc;
    const nChipsUoc = (gAp && gAp.kieu === 'ASSEMBLE' && cpAp && !dt) ? Math.min(3, (gAp.gan || []).filter((x) => x.loai !== 'chu').length) : 0;
    const tinhNg = (rosF) => {
      const dR = rosF ? Math.min(dt ? 128 : 474 * st.sx, availH, dt ? 200 : 474 * st.sy * 1.0) : 0;
      const gx_ = rosF ? Math.round(px(R(dt ? 12 : 130, 0, 1, 1)).x + dR + (dt ? 10 : 60) * st.sx) : px(R(dt ? 8 : 110, 0, 1, 1)).x;
      const gw_ = Math.round(px(R(dt ? 382 : 1400, 0, 1, 1)).x - gx_);
      // dien thoai: o nghia giu full be ngang, day dung tren dau meo (meo that = st.meo.y + 36); may tinh: tru be ngang goc meo nhu cu
      const meo_ = dt ? 0 : (() => { const r0 = { x: gx_, y: ty, w: gw_, h: availH }; const mw = meoChong(r0); return mw > 0 && mw < gw_ * 0.4 ? mw : 0; })();
      const mk = (gh_) => {
        const inW_ = gw_ - meo_ - 52 * hu, inH_ = gh_ - 52 * hu - 22 * hu;
        const f1_ = coVua('nghia', txtM, inW_, inH_ * (glossTxt ? 0.68 : 0.95), { lh: 1.08, lines: 3, cat: true, max: T('nghia').max * 0.97 });
        return { gh: gh_, inW: inW_, f1: f1_, cut: f1_.text !== txtM };
      };
      const gh1 = Math.round(Math.max(Math.min(90 * st.sy, availH), Math.min(availH * (rosF ? 0.62 : dt ? 0.92 : 0.72), (dt ? 240 : 260) * st.sy, dauMeo - ty - 8 * st.sy)));
      let r = mk(gh1);
      if (r.cut) {
        // het cho voi o gon: cao toi het khoang trong (chua cho the N = ... neu co), toi da 5 dong
        const gh2 = Math.round(Math.max(gh1, Math.min(availH - (nChipsUoc ? 112 * st.sy : 0) - 8 * st.sy, dauMeo - ty - 8 * st.sy)));
        if (gh2 > gh1) r = mk(gh2);
      }
      return Object.assign(r, { dR, gx: gx_, gw: gw_, meo: meo_ });
    };
    let ros = !!ros0, TN = tinhNg(ros);
    // chu nghia nho (< 17 px) trong o hep canh chan dung ma bo chan dung duoc chu to hon han (>= 1,3 lan): bo chan dung (o nghia full be ngang) — 14 px trong khi 150 px duoi con trong
    if (dt && ros) { const T2 = tinhNg(false); if ((TN.cut && (!T2.cut || T2.f1.fs > TN.f1.fs)) || (!T2.cut && TN.f1.fs < 17 && T2.f1.fs >= TN.f1.fs * 1.3)) { ros = false; TN = T2; } }
    const { dRos, gx, gw, meo, gh, inW, f1 } = { dRos: TN.dR, gx: TN.gx, gw: TN.gw, meo: TN.meo, gh: TN.gh, inW: TN.inW, f1: TN.f1 };
    const inH = gh - 52 * hu - 22 * hu;
    let H1 = null, coc = null;
    if (ros) {
      const rx = dt ? px(R(12, 0, 1, 1)).x : px(R(130, 0, 1, 1)).x;
      H1 = hoa(c.el, { x: rx, y: ty + Math.round(Math.max(0, (availH - dRos) * 0.3)), w: dRos, h: dRos }, anhUrl, { k: 1.12 });
      coc = dat(mk('div', 'h-coc', c.el), { x: Math.round(rx + dRos / 2 - 13 * hu), y: ty + Math.round(Math.max(0, (availH - dRos) * 0.3)) + dRos - 20 * hu, w: Math.round(26 * hu), h: Math.max(10, Math.round(yMax - (ty + (availH - dRos) * 0.3 + dRos) + 30 * hu)) });
      c.el.insertBefore(coc, H1.el);
    }
    const f2 = glossTxt ? coVua('phu', glossTxt, inW, inH * 0.36, { lh: LH_VJ, lines: 3, jpx: 1 }) : null;   // khong cat chu (truoc: 'は = đọc…' mat nghia); dai qua thi gap() thu nho
    const htmlNg = '<div class="h-nghia h-r-nghia" style="font-size:' + f1.fs + 'px">' + jp(khongMoCoi(f1.text)) + '</div>' + (f2 ? '<div class="h-phu h-r-phu" style="font-size:' + f2.fs + 'px">' + jp(khongMoCoi(f2.text)) + '</div>' : '');
    // o nghia OM chu (trai thang hang voi bang / chan dung): nghia ngan khong nam giua o rong trong
    const rNg = ovPos('nghia', omGap({ x: gx, y: ty + 8 * st.sy, w: gw - meo, h: gh }, htmlNg, 'Nghĩa', { minW: Math.round(Math.min(gw - meo, 300 * hu)) }));
    const G1 = gap(c.el, rNg, 'Nghĩa', htmlNg);
    // the "N1 = ..." (tu mau cau ghep)
    const chips = [];
    const g = nh.ghep, cp = nh.congThuc;
    if (g && g.kieu === 'ASSEMBLE' && cp && !dt) {
      (g.gan || []).filter((x) => x.loai !== 'chu').slice(0, 3).forEach((x) => {
        const lab = (cp.phan && cp.phan[x.ei] && cp.phan[x.ei].nhan) || ('N' + (chips.length + 1));
        const txt = (x.tok || []).map((i) => chuTok(toks[i])).join('');
        if (txt) chips.push({ lab: String(lab).replace(/[\-(（]+$/, '').trim(), txt });
      });
    }
    const chipEls = [];
    if (chips.length) {
      const cy = rNg.y + rNg.h + 26 * st.sy;
      const ch = Math.min(96 * st.sy, yMax - cy);
      if (ch > 40 * hu) {
        const tot = gw - meo, ww = Math.floor((tot - 18 * hu * (chips.length - 1)) / chips.length);
        // the "N1 = ..." om chu (noi tiep trai sang phai), khong nam giua the rong
        let xC = gx;
        chips.forEach((cc) => {
          const hC = '<b>' + esc(cc.lab) + '</b> = ' + esc(cc.txt);
          const f = fit(hC, { w: ww - 30 * hu, h: ch - 16 * hu, max: 40 * hu, min: Math.max(14, 16 * hu), lh: 1.1, cls: 'h-r-chipv', nowrap: true });
          const wC = Math.round(Math.min(ww, rongTuNhien(hC, 'h-r-chipv', f) + 44 * hu + 8));
          chipEls.push(giay(c.el, { x: Math.round(xC), y: cy, w: wC, h: Math.min(ch, Math.round(f * 1.1 + 28 * hu)) }, '<span class="h-r-chipv" lang="ja" style="font-size:' + f + 'px"><b>' + esc(cc.lab) + '</b> = ' + jp(cc.txt) + '</span>', 'h-chipv'));
          xC += wC + 18 * hu;
        });
      }
    }
    // may tinh: cau ngan (it o) — ca nhom (nhan + bang + medallion + nghia) can giua ngang trong vung noi dung va can doi tren / duoi (khong dinh goc tren trai, nua duoi trong)
    if (!dt) {
      const els = [nhan, bang, tilesBox, G1, H1 && H1.el, coc].concat(chipEls).filter(Boolean);
      const geo = els.map((e) => ({ e, l: parseFloat(e.style.left), t: parseFloat(e.style.top), w: parseFloat(e.style.width) || 0, h: parseFloat(e.style.height) || 0 }));
      const gx0 = Math.min(...geo.map((g) => g.l)), gx1 = Math.max(...geo.map((g) => g.l + g.w)), gy0 = Math.min(...geo.map((g) => g.t)), gy1 = Math.max(...geo.map((g) => g.t + g.h));
      const dxC = items.length <= 3 ? Math.round((rb0.x + rb0.w / 2) - (gx0 + gx1) / 2) : 0;
      const dyC = Math.round(((Math.round(st.H * 0.78) - gy1) - (gy0 - Math.round(64 * st.sy))) / 2);
      const dx_ = dxC > 8 ? dxC : 0, dy_ = Math.max(0, Math.min(dyC, Math.round(90 * st.sy)));
      if (dx_ || dy_ > 8) geo.forEach((g) => { if (dx_) g.e.style.left = Math.round(g.l + dx_) + 'px'; if (dy_ > 8) g.e.style.top = Math.round(g.t + dy_) + 'px'; });
    }
    c.rev = { bang: () => { A.hien(bang, 0, 0.12); } };
    tiles.forEach((e, i) => { c.rev['t' + i] = () => { A.roi(e, 0); snd('step' + (i % 4), 0.02); if (items[i].tro) snd('stamp', 0.02); }; });
    c.rev.nghia = () => { A.moGap(G1, 0); snd('ding', 0.02); };
    c.rev.nhan = () => { A.dan(nhan, 0, -2); snd('tick', 0.02); };
    c.rev.ros = () => { if (H1) { A.no(H1.el, 0); if (coc) A.hien(coc, 0.05, 0.1); } };
    chipEls.forEach((e, i) => { c.rev['c' + i] = () => { A.len(e, 0, 30); snd('tick', 0.02); }; });
    c.vd = { tiles, tokTile, G1, items, bang, chipEls };
    c.chay = () => {
      A.hien(bang, tre('hoa') * 0, 0.1);
      mocVao(c, 'nhan', tre('header') * 0.5);
      tiles.forEach((e, i) => mocVao(c, 't' + i, tre('tok') + tre('tokBuoc') * i));
      mocVao(c, 'ros', tre('hoa') + 0.02);
      mocVao(c, 'nghia', tre('nghiaVD'));
      chipEls.forEach((e, i) => mocVao(c, 'c' + i, tre('nghiaVD') + 0.7 + 0.18 * i));
    };
  }
  function karaokeVD(m, ds, api, c) {
    const V = c.vd;
    if (!V) return;
    V.coKaraoke = true;     // da co karaoke that: cue E1 / E2 khong chay karaoke gia nua
    const now = api.bayGio();
    const da = new Set();
    ds.forEach((x) => {
      const k = V.tokTile[x.i];
      if (k == null || da.has(k)) return;
      da.add(k);
      const e = V.tiles[k];
      if (!e) return;
      const t = Math.max(0, x.T - api.LEAD - now);
      mocVao(c, 't' + k, Math.max(0, t - 0.05));
      A.tieuDiem(e, t, 1.08);
    });
  }
  function cueViDu(m, id, tt, api, nh, c) {
    const t = api.tre(tt);
    const V = c.vd;
    if (!V) return;
    if (id === 'E0') { mocVao(c, 'nhan', t); }
    else if (id === 'E1' || id === 'E2' || id === 'E2b') {
      // canh mac dinh khong phai luc nao cung chay karaoke cho cau vi du (troKaraoke chi di chuyen con tro an) -> tu dung nhip doc: tung o chu sang
      // theo thoi luong cue (tt.dur), chia ty le theo do dai cach doc (furigana neu co); moi o: phong 140 ms + vien (A.tieuDiem), toi cung luc nghe
      const lan = id === 'E1' ? 1 : 2;
      if ((V.lanGia || 0) >= lan || V.coKaraoke || !tt || tt.T == null) return;
      // E2b = cue DU PHONG uoc luong (sauCue, dur 350 ms) toi som ~1 s truoc lan doc lai THAT (E2, khop chu): khong chay ngay (tat ca o nhay trong 0,3 s roi lan doc that khong con gi) —
      // cho E2; neu E2 khong toi sau 1,3 s thi moi quet theo uoc luong tu luc do
      if (id === 'E2b') {
        if (!V.hen2b && api.hen) V.hen2b = api.hen(() => { V.hen2b = null; if ((V.lanGia || 0) >= 2 || V.coKaraoke) return; cueViDu(m, 'E2', { T: api.bayGio() + 0.15, dur: Math.max(tt.dur || 0, V.items.length * 320) }, api, nh, c); }, 1300);
        return;
      }
      if (id === 'E2' && V.hen2b) { try { api.huyHen(V.hen2b); } catch (e) { /* bo qua */ } V.hen2b = null; }
      V.lanGia = lan;
      const n = V.items.length;
      const tong = tt.dur ? tt.dur / 1000 : kep(n * 0.32, 0.8, 4);
      const w = V.items.map((it) => Math.max(1, kyTu(it.doc || it.base || '').length));
      const sum = w.reduce((a, b) => a + b, 0);
      let acc = 0;
      V.items.forEach((it, k) => {
        const Tk = tt.T + tong * acc / sum;
        acc += w[k];
        mocVao(c, 't' + k, Math.max(0, api.treT(Tk) - 0.05));
        if (V.tiles[k]) A.tieuDiem(V.tiles[k], api.treT(Tk), 1.08);
      });
    }
    else if (id === 'E5') { mocVao(c, 'nghia', t); A.nay(V.G1, t, 1.03); V.chipEls.forEach((e, i) => mocVao(c, 'c' + i, t + 0.7 + 0.18 * i)); }
    else if (/^E3|^E4/.test(id)) { V.tiles.forEach((e, i) => { if (V.items[i].tro) A.nay(e, t + 0.05 * i, 1.05); }); }
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
  function ganAvatar(m, img, tuy) {
    const AV = window.SenseiAvatarNoi;
    if (!AV || !AV.gan || !img) return null;
    try {
      const ct = AV.gan(img, tuy);
      if (ct) { st.avt.push(ct); return ct; }
    } catch (e) { /* khong co avatar-noi: giu anh tinh */ }
    return null;
  }
  function goAvatar(m) {
    (m.avt || []).forEach((ct) => { try { ct.go(); } catch (e) {} });
    m.avt = [];
    st.avt = st.avt.filter((x) => !(m.avtMoi || []).includes(x));
  }
  function dungKaiwaIntro(nh, api, m, c) {
    const hu = st.hu, dt = st.dt;
    const ds = Array.isArray(nh.data) ? nh.data : [];
    const vai = vaiCua(ds).slice(0, 4);
    m.vai = vai; m.ds = ds; m.avt = [];
    const L6 = { d: { hd: R(110, 70, 1290, 130) }, p: { hd: R(8, 70, 374, 84) } };
    const rh = RC('hd', L6);
    const sub = vai.length + ' nhân vật · ' + ds.length + ' lượt thoại';
    const fT = coVua('tieude', 'Hội thoại', rh.w * 0.5, rh.h - 78 * hu, { nowrap: true, lh: 1.05, max: T('tieude').max * 1.1 });   // chu bat dau o top 52 hu: con >= 14 hu duoi chu (khong de net chu cham mep duoi giay)
    const fS = coVua('phu', sub, rh.w * 0.5, rh.h - (dt ? 44 : 56) * hu - 14 * hu, { nowrap: true, lh: 1.1, max: T('phu').max * 1.1 });
    const hd = giay(c.el, rh, '<div class="h-nhan" style="position:absolute;left:' + Math.round(40 * hu) + 'px;top:' + Math.round(24 * hu) + 'px">Bối cảnh</div>' +
      '<div class="h-r-tieude" style="position:absolute;left:' + Math.round(38 * hu) + 'px;top:' + Math.round(52 * hu) + 'px;font-size:' + fT.fs + 'px">Hội thoại</div>' +
      '<div class="h-r-phu" style="position:absolute;right:' + Math.round(40 * hu) + 'px;top:' + Math.round(((dt ? 44 : 56)) * hu) + 'px;font-size:' + fS.fs + 'px;color:var(--h-muc-nhat)">' + esc(sub) + '</div>');
    // chan dung nhan vat
    const n = Math.max(1, vai.length);
    const top = rh.y + rh.h + Math.round((dt ? 20 : 34) * st.sy);
    const avail = st.H - top - Math.round((dt ? 130 : 150) * st.sy);
    const wRow = Math.round((dt ? 374 : (vai.length <= 2 ? 1290 : 1290)) * st.sx);
    const gX = Math.round((dt ? 12 : 40) * st.sx);
    const dMax = Math.floor((wRow - gX * (n - 1)) / n);
    const dd = Math.max(80, Math.min(dMax, Math.round((dt ? avail * 0.8 : avail * 0.86)), Math.round(340 * st.sx)));
    const coTranh = !!(nh.bai && nh.bai.sceneImageUrl) && !dt && (px(R(110, 0, 1, 1)).x + (wRow + dd * n + gX * (n - 1)) / 2) < px(R(1380, 0, 1, 1)).x;
    // khong co tranh canh (hoac dien thoai): hang chan dung can giua CA san khau (truoc: giua cot noi dung 82..1047 -> le trai 155 / le phai 455)
    const x0 = coTranh || dt ? Math.round(px(R(dt ? 8 : 110, 0, 1, 1)).x + (wRow - (dd * n + gX * (n - 1))) / 2) : Math.round((st.W - (dd * n + gX * (n - 1))) / 2);
    const ros = [], tens = [];
    vai.forEach((v, p) => {
      const r = { x: x0 + p * (dd + gX), y: top + Math.round(Math.max(0, (avail - dd) * 0.25)), w: dd, h: dd };
      const H = hoa(c.el, r, v.anh || null, { k: 1.1, iy: 0, chu: kyTu(v.jp)[0] || '?' });
      ros.push(H.el);
      if (H.im) { H.im.dataset.nv = v.nv || ''; H.im.style.objectPosition = '50% 22%'; }
      const rt_ = ruy(c.el, { x: Math.round(r.x + dd * 0.05), y: r.y + dd - Math.round(10 * hu), w: Math.round(dd * 0.9), h: Math.round(Math.max(34 * hu, dd * 0.15)) }, '<span class="h-ruyc" lang="ja" style="font-size:' + Math.round(Math.max(T('romaji').min, Math.min(T('tieude').max * 0.7, dd * 0.095))) + 'px">' + esc(v.jp) + (v.la && !dt ? ' <em>' + esc(v.la) + '</em>' : '') + '</span>');
      tens.push(rt_.w);
      m.avtMoi = m.avtMoi || [];
      if (H.im) { const ct = ganAvatar(m, H.im, { nhanVat: v.nv }); if (ct) { m.avt.push(ct); m.avtMoi.push(ct); } }
    });
    // tranh canh o cot phai (may tinh, du cho)
    let arch = null;
    const sc = nh.bai && nh.bai.sceneImageUrl;
    if (sc && coTranh) {
      const ra = px(R(1450, 226, 400, 470));      // bat dau thap hon (170 -> 226): huy hieu CANH 1 nho len tren cua so khong cham ruy bang the bai (cao toi y ~158 px)
      arch = vom(c.el, ra, { anh: sc, iw: ra.w * 1.2, iy: 0, phu: true, khoa: '<small>CẢNH</small>?' });
      arch.khoa.innerHTML = '<small>CẢNH</small>1';
    }
    c.rev = { hd: () => { A.lat(hd, 0); snd('tick', 0.02); } };
    ros.forEach((e, p) => { c.rev['r' + p] = () => { A.no(e, 0); A.hien(tens[p], 0.15, 0.1); ft(tens[p], { scaleX: 0.05 }, { scaleX: 1, duration: D(0.6), ease: 'expo.out', delay: 0.15 }); snd('step' + (p % 4), 0.02); }; });
    c.rev.arch = () => { if (arch) { ft(arch.el, { autoAlpha: 0, y: 40 * hu / 0.75 }, { autoAlpha: 1, y: 0, duration: D(0.5), ease: 'power3.out' }); } };
    c.ki = { ros, tens, vai, ds };
    c.chay = () => {
      mocVao(c, 'hd', tre('header') * 0.7);
      ros.forEach((e, p) => mocVao(c, 'r' + p, tre('hoa') + 0.05 + 0.2 * p));
      if (arch) { ft(arch.el, { autoAlpha: 0 }, { autoAlpha: 0, duration: 0 }); mocVao(c, 'arch', tre('hoa') + 0.9); }
    };
  }
  function cueKaiwaIntro(m, id, tt, api, nh, c) {
    const t = api.tre(tt);
    const K = c.ki;
    if (!K) return;
    let x;
    if ((x = /^C1\.(\d+)$/.exec(id))) { const p = +x[1]; mocVao(c, 'r' + p, t); if (K.ros[p]) A.tieuDiem(K.ros[p], t + 0.15, 1.06); }
    else if ((x = /^C2\.(\d+)$/.exec(id))) {
      const l = K.ds[+x[1]];
      if (l) { const tn = tachTen(l.speaker); const p = K.vai.findIndex((v) => v.jp === tn.jp); if (p >= 0 && K.ros[p]) { mocVao(c, 'r' + p, t); A.nay(K.ros[p], t + 0.1, 1.04); } }
    }
  }
  /** Mot luot thoai: chan dung nguoi noi (lon) | tam giay cau (ruby) | nghia. run = nghe tron doan (doi luot); khong = mot cau (kaiwa) */
  function dungLuot(nh, api, m, c, run) {
    const hu = st.hu, dt = st.dt;
    const ds = run ? (Array.isArray(nh.data) ? nh.data : []) : [nh.data || {}];
    const vai = vaiCua(ds).slice(0, 4);
    m.vai = vai; m.ds = ds; m.avt = []; m.avtMoi = [];
    m.luot = -1;
    const L7 = {
      d: { ros: R(110, 170, 470, 470), board: R(620, 170, 1260, 360), nghia: R(620, 560, 1260, 150), dem: R(630, 118, 240, 50) },
      p: { ros: R(10, 70, 112, 112), board: R(8, 236, 374, 186), nghia: R(8, 432, 374, 122), dem: R(140, 76, 150, 34) },
    };
    const lx = dt ? L7.p : L7.d;
    c.l7 = { L: lx };
    const rRos = RC('ros', L7);
    const rBoard = RC('board', L7);
    const rNghia = RC('nghia', L7);
    const rDem = RC('dem', L7);
    // chan dung lon (nguoi dang noi) — mot rosette, thay anh khi doi nguoi
    const H = hoa(c.el, rRos, vai[0] && vai[0].anh || null, { k: 1.1, iy: 0, chu: kyTu((vai[0] || {}).jp || '?')[0] });
    const ten = ruy(c.el, { x: Math.round(rRos.x + rRos.w * 0.04), y: rRos.y + rRos.h - Math.round(12 * hu), w: Math.round(rRos.w * 0.92), h: Math.round(Math.max(38 * hu, rRos.w * 0.14)) }, '<span class="h-ruyc" lang="ja"></span>');
    const board = giay(c.el, rBoard, '', 'h-luot');
    const gNghia = gap(c.el, rNghia, 'Nghĩa', '');
    const dem = dan(c.el, rDem, '<span class="h-r-dan"></span>', '', -2);
    dem.classList.add('h-nho');
    // hang dau nho cac nhan vat (neu >1), o duoi chan dung
    const mini = [];
    if (vai.length > 1) {
      const dm = dt ? 48 : Math.round(120 * st.sx * 0.95);
      const y0 = dt ? rRos.y + 54 : rRos.y + rRos.h + Math.round(54 * st.sy);
      vai.forEach((v, p) => {
        const r = dt ? { x: 140 + p * (dm + 8), y: y0, w: dm, h: dm } : { x: rRos.x + p * (dm + 18 * hu), y: y0, w: dm, h: dm };
        const e = dat(mk('div', 'h-mini h-an', c.el), r);
        e.innerHTML = v.anh ? '<img alt="" decoding="async" draggable="false" src="' + esc(v.anh) + '">' : '<span lang="ja">' + esc(kyTu(v.jp)[0] || '?') + '</span>';
        mini.push(e);
      });
    }
    c.rev = { ros: () => { A.no(H.el, 0); A.ruy(ten.w, 0.25, 0.32); snd('step0', 0.02); }, board: () => { A.lat(board, 0, 0.7); snd('tick', 0.02); }, nghia: () => { A.moGap(gNghia, 0); snd('ding', 0.02); }, dem: () => { A.dan(dem, 0, -2); } };
    mini.forEach((e, p) => { c.rev['m' + p] = () => { A.no(e, 0); }; });
    c.lu = { H, ten, board, gNghia, dem, mini, vai, rBoard, rNghia };
    c.chay = () => {
      mocVao(c, 'ros', tre('hoa'));
      mocVao(c, 'board', tre('hoa') + 0.05);
      mocVao(c, 'dem', tre('hoa') + 0.3);
      mini.forEach((e, p) => mocVao(c, 'm' + p, tre('hoa') + 0.45 + 0.1 * p));
      c.lu.san = true;
      if (!run) {
        // kaiwa 1 cau: vi tri that trong hoi thoai cua bai (Luot k / n), khong phai 1 / 1
        const dl = (nh.bai && nh.bai.dialogue) || [], j = dl.findIndex((x) => x && ds[0] && x.id === ds[0].id);
        veLuot(m, c, ds[0], j >= 0 ? j : 0, j >= 0 ? dl.length : 1, true);
        canGiuaDoc(c);
      }
      else if (m.lineDang) veLuot(m, c, m.lineDang.l, m.lineDang.i, ds.length, true);
      else veLuot(m, c, ds[0], 0, ds.length, true);
      mocVao(c, 'nghia', tre('nghiaVD') + 0.4);
    };
    if (!run) { m.run = false; } else m.run = true;
  }
  /** Ve noi dung mot luot len tam giay: tu (ruby) + nghia + ten + chan dung; gan avatar nhep mieng */
  function veLuot(m, c, line, i, n, dau) {
    const K = c.lu;
    if (!K || !line) return;
    const hu = st.hu, dt = st.dt;
    if (m.luot === i && !dau) return;
    m.luot = i;
    const toks = line.tokens || [];
    // token cuoi ngan (です / か / 。) dinh vao token truoc bang WORD JOINER: khong rot mot minh xuong dong cuoi
    const nTk = toks.length, ngan_ = (tk) => kyTu(chuTok(tk)).length <= 2;
    // token kana <= 2 chu (tro tu に / も / か, duoi です / ます) va dau cau dinh vao token TRUOC bang WORD JOINER: chi ngat dong o ranh gioi cum
    // (雨にも | かかわらず、| 大会に | 参加しました か) — word-break: auto-phrase cua trinh duyet tung ngat 'cau 1 chi con 雨にも' (dong 1 : dong 2 = 1 : 5)
    const dinh_ = (tk) => laDau(tk) || (/^[ぁ-ゖァ-ヺー]+$/.test(chuTok(tk)) && ngan_(tk));
    const glue = (tk, k) => k > 0 && (dinh_(tk) || (k >= nTk - 2 && ngan_(toks[nTk - 1]) && (k === nTk - 1 || ngan_(tk))));
    // brs: tap chi so token dat <br> truoc (ngat dong CHU DONG — text-wrap: balance cua Chrome khong tac dung khi dong co <ruby>: 'cau 1 chi con 雨にも')
    const htmlDe = (brs) => toks.map((tk, k, a) => (brs && brs.has(k) ? '<br>' : '') + (glue(tk, k) ? '⁠' : '') + '<span class="h-tk" data-ti="' + k + '">' + C.tok(tk, k, a) + '</span>').join('');
    const html = htmlDe(null);
    // ban de DO co chu: them diem ngat <wbr> giua cac nhom token (keep-all khong cho ngat giua chu CJK -> fit() tuong cau khong the xuong dong va chon co 16 px mot dong)
    const htmlW = toks.map((tk, k, a) => (k > 0 && !glue(tk, k) ? '<wbr>' : '') + (glue(tk, k) ? '⁠' : '') + '<span class="h-tk" data-ti="' + k + '">' + C.tok(tk, k, a) + '</span>').join('');
    const r = K.rBoard;
    const pad = (dt ? 30 : 40) * hu;
    const kPad = dt ? 0.34 : 0.45;     // dem tren / duoi tam giay cau (dien thoai: nho hon -> chu chiem du dien tich the)
    // cau ngan (はい) duoc chu to hon (toi 1,2 x co co so); tam giay + o nghia OM theo noi dung (khong de tam giay lon trong tron)
    // dong cao 1,75 chi khi co furigana (cho ruby); cau khong ruby (はい / ええと) dong 1,3 — tam giay khong cao trong
    let lhC = /<ruby/i.test(html) ? 1.6 : 1.3;
    // cau rat ngan (はい / ええ): chu to hon (thanh ngan khong thanh the rong chu be)
    const nChu = kyTu(toks.map((tk) => chuTok(tk)).join('')).length, kMax = nChu <= 3 ? (dt ? 1.75 : 1.45) : nChu <= 6 ? (dt ? 1.45 : 1.3) : 1.2;
    const ruyBu = lhC > 1.5;   // co furigana: chua cho cho ruby dong dau o dem tren
    let f = fit(htmlW, { w: r.w - 2 * pad, h: r.h - 2 * pad - 30 * hu, max: T('cau').max * kMax, min: T('cau').min * 0.55, lh: lhC, cls: 'h-r-cau', lines: dt ? 8 : 5 });
    // fit() do khong co luat CSS cua tam giay (ruby co le .14 em moi ben...) nen uoc rong qua: do lai bang hop that (doHop) va ha co cho toi khi vua tam giay
    const cauMin = Math.max(1, Math.floor(T('cau').min * 0.55)), hopCao = (ff, hh) => hh.h + 2 * pad * kPad + (ruyBu ? ff * 0.2 : 0) + 6 * hu;
    const doCau = (ff) => doHop('<div class="h-cau-in">' + htmlW + '</div>', 'h-cau-bai h-r-cau', ff, lhC, r.w - 2 * pad, 'ja');
    let hopCau = doCau(f);
    const giamCo = () => { for (let q = 0; q < 70 && f > cauMin && (hopCau.h > r.h || hopCao(f, hopCau) > r.h); q++) { f -= 1; hopCau = doCau(f); } };
    giamCo();
    // nhieu dong co furigana: thanh gach chan (cao ~0,1 em) nam giua dong tren va furigana dong duoi -> dong cach rong hon (1,6 -> 1,86), gach khong cham ruby dong sau
    if (ruyBu && Math.round(hopCau.h / (f * lhC)) >= 2) { lhC = 1.86; hopCau = doCau(f); giamCo(); }
    // ngat dong CAN BANG (min-max be ngang dong) theo be ngang tung nhom token do that (o co 100 px, ti le tuyen tinh theo co chu)
    let htmlF = html;
    if (toks.length > 1 && st.mesur) {
      const mz = st.mesur;
      mz.className = 'h-mesur'; mz.style.width = 'auto'; mz.style.whiteSpace = 'nowrap'; mz.style.lineHeight = ''; mz.style.fontSize = '';
      mz.innerHTML = '<div class="h-cau-bai h-r-cau" lang="ja" style="position:static;inset:auto;display:inline-block;white-space:nowrap;padding:0;width:auto;height:auto;font-size:100px;line-height:' + lhC + '"><div class="h-cau-in" style="max-width:none;white-space:nowrap">' + html + '</div></div>';
      const wTok = Array.from(mz.querySelectorAll('.h-tk')).map((e) => e.getBoundingClientRect().width);
      const W = r.w - 2 * pad, gs = [];
      toks.forEach((tk, k) => { const w = (wTok[k] || 0) * f / 100; if (k && glue(tk, k) && gs.length) gs[gs.length - 1].w += w; else gs.push({ k0: k, w }); });
      const dem = (Tw) => { let nn = 1, cur = 0; gs.forEach((g) => { if (cur && cur + g.w > Tw) { nn++; cur = g.w; } else cur += g.w; }); return nn; };
      const n0 = gs.length > 1 ? dem(W) : 1;
      if (n0 >= 2) {
        let lo = Math.max.apply(null, gs.map((g) => g.w)), hi = W;
        for (let q = 0; q < 24; q++) { const mid = (lo + hi) / 2; if (dem(mid) <= n0) hi = mid; else lo = mid; }
        // chia dong: be ngang dong lon nhat <= hi (toi thieu), roi trong cac cach chia do chon cach DEU nhat (tong binh phuong phan thua nho nhat, nhu TeX) —
        // truoc day xep tham lam: dong dau day nhat, dong giua con 3 chu ('はい。でも会社の | 事業は | 拡大する一方です')
        const brs = new Set();
        {
          const nG = gs.length, pre = [0]; gs.forEach((g, q) => pre.push(pre[q] + g.w));
          const INF = 1e18, cost = (a2, b2) => { const w = pre[b2] - pre[a2]; return w > hi + 0.01 ? INF : (hi - w) * (hi - w); };
          const best = [], from = [];
          for (let k = 0; k <= n0; k++) { best.push(new Array(nG + 1).fill(INF)); from.push(new Array(nG + 1).fill(0)); }
          best[0][0] = 0;
          for (let k = 1; k <= n0; k++) for (let j = k; j <= nG; j++) for (let i2 = k - 1; i2 < j; i2++) {
            if (best[k - 1][i2] >= INF) continue;
            const cst = cost(i2, j); if (cst >= INF) continue;
            const v = best[k - 1][i2] + cst;
            if (v < best[k][j]) { best[k][j] = v; from[k][j] = i2; }
          }
          if (best[n0][nG] < INF) { let j = nG; for (let k = n0; k >= 2; k--) { j = from[k][j]; brs.add(gs[j].k0); } }
          else { let cur = 0; gs.forEach((g) => { if (cur && cur + g.w > hi + 0.01) { brs.add(g.k0); cur = g.w; } else cur += g.w; }); }
        }
        htmlF = htmlDe(brs);
        hopCau = doHop('<div class="h-cau-in">' + htmlF + '</div>', 'h-cau-bai h-r-cau', f, lhC, W, 'ja');
      }
    }
    const bw = Math.round(Math.min(r.w, Math.max(dt ? r.w * 0.42 : 360 * hu, hopCau.w + 2 * pad + 8)));
    const bh = Math.round(Math.min(r.h, Math.max(dt ? 64 : 110 * hu, hopCau.h + 2 * pad * kPad + (ruyBu ? f * 0.2 : 0) + 6 * hu)));   // furigana dong dau khong bi cat tren; dem tren / duoi deu (sat noi dung, khong rong)
    dat(K.board, { x: r.x, y: r.y, w: bw, h: bh });
    // o nghia ngay duoi tam giay cau; be ngang toi da tranh cot meo (o nghia ha thap theo tam giay -> tung de len meo)
    const ngY = r.y + bh + Math.round((dt ? 10 : 30) * st.sy);
    const ngHmax = K.rNghia.h + (r.h - bh);
    const mwN = dt ? 0 : meoChong({ x: K.rNghia.x, y: ngY, w: K.rNghia.w, h: K.rNghia.h });
    const wNmax = mwN > 0 && mwN < K.rNghia.w * 0.5 ? K.rNghia.w - mwN : K.rNghia.w;
    const ng = tachNghia(line.meaningVi);
    const txtNg = (ng.chinh || line.meaningVi || '') + (ng.phu ? ' (' + ng.phu + ')' : '');
    const inW = wNmax - 52 * hu, inH = K.rNghia.h - 52 * hu - 20 * hu;
    const f1 = coVua('nghia', txtNg, inW, inH, { lh: 1.1, lines: 3, cat: true, max: T('nghia').max * (kyTu(txtNg).length <= 12 ? 1.2 : 0.8) });     // nghia rat ngan (Vang!): chu to hon, o khong con la mot dai chu nho
    const hopNg = doHop(esc(f1.text), 'h-nghia h-r-nghia', f1.fs, 1.1, inW);
    const nw = Math.round(Math.min(wNmax, Math.max(dt ? r.w * 0.6 : 300 * hu, hopNg.w + 52 * hu + 10)));
    const ngH = Math.round(Math.min(ngHmax, Math.max(52 * hu + 36 * hu + hopNg.h + 4, dt ? 70 : 110 * hu)));
    let nw2 = nw;
    if (!dt) { const mw2 = meoChong({ x: K.rNghia.x, y: ngY, w: nw, h: ngH }); if (mw2 > 0) nw2 = Math.max(Math.round(300 * hu), nw - mw2); }
    dat(K.gNghia, { x: K.rNghia.x, y: ngY, w: nw2, h: ngH });
    // dien thoai: hai the om chu (cau + nghia) can giua theo the rong hon (le trai = le phai), khong dinh le trai 8 px con le phai 80-90 px
    if (dt) {
      const wMax2 = Math.max(bw, nw2), dxC = Math.max(0, Math.round((r.w - wMax2) / 2));
      if (dxC > 3) { dat(K.board, { x: r.x + dxC, y: r.y, w: bw, h: bh }); dat(K.gNghia, { x: K.rNghia.x + dxC, y: ngY, w: nw2, h: ngH }); }
    }
    // tam giay cau: lat (doi luot) — noi dung cu bo ngay, khong cho
    K.board.innerHTML = '<div class="h-cau-bai h-r-cau" lang="ja" style="font-size:' + f + 'px;line-height:' + lhC + ';padding:' + Math.round(pad * kPad + (ruyBu ? f * 0.2 : 0)) + 'px ' + Math.round(pad) + 'px ' + Math.round(pad * kPad) + 'px"><div class="h-cau-in">' + htmlF + '</div></div>';
    m.tokEl = {};
    K.board.querySelectorAll('.h-tk').forEach((e) => { m.tokEl[e.dataset.ti] = e; });
    if (!dau) { G.killTweensOf(K.board); A.lat(K.board, 0, 0.5); snd('tick', 0.02); }
    K.gNghia.querySelector('.h-gn').innerHTML = '<div class="h-nghia h-r-nghia" style="font-size:' + f1.fs + 'px">' + jp(khongMoCoi(f1.text)) + '</div>';
    if (c.pronto) soat(c);
    const t = tachTen(line.speaker);
    K.ten.ruy.querySelector('.h-ruyc').innerHTML = esc(t.jp) + (t.la && !dt ? ' <em>' + esc(t.la) + '</em>' : '');
    const fr = Math.round(Math.max(dt ? 16 : T('romaji').min, Math.min(T('tieude').max * 0.7, K.ten.w.offsetWidth * 0.095)));     // ten nguoi noi: ruy keo ngang (scaleX) luc vao — chu >= 16 de luc dang co khong duoi 13 px
    K.ten.ruy.querySelector('.h-ruyc').style.fontSize = fr + 'px';
    const d_ = K.dem.querySelector('.h-r-dan');
    d_.textContent = 'Lượt ' + (i + 1) + ' / ' + n;
    d_.style.fontSize = Math.round(Math.max(st.dt ? 14 : 15, T('nhan').min * 1.2, T('dan').max * 0.7)) + 'px';
    // chan dung: doi nguoi noi -> doi anh, gan lai avatar nhep mieng theo id cau thoai
    const p = K.vai.findIndex((v) => v.jp === t.jp);
    const v = K.vai[p] || {};
    const img = K.H.im;
    (m.avt || []).forEach((ct) => { try { ct.go(); } catch (e) {} });
    m.avt = [];
    if (img) {
      if (line.avatarUrl && img.getAttribute('src') !== line.avatarUrl) { img.src = line.avatarUrl; }
      const ct = ganAvatar(m, img, { lineId: line.id, nhanVat: tuNhanVat(line.avatarUrl) });
      if (ct) { m.avt.push(ct); m.avtMoi.push(ct); }
    } else if (K.H.tron) {
      const sp = K.H.tron.querySelector('.h-hchu');
      if (sp) sp.textContent = kyTu(t.jp)[0] || '?';
    }
    if (!dau && p >= 0 && K.mini[p]) K.mini.forEach((e, q) => G.to(e, { scale: q === p ? 1.14 : 1, duration: D(0.2), ease: 'power2.out' }));
    else if (K.mini.length) K.mini.forEach((e, q) => G.set(e, { scale: q === p ? 1.14 : 1 }));
    if (!dau && !giam()) { A.no(K.H.el, 0); snd('step' + (i % 4), 0.02); }
    c.mo.nghia = c.mo.nghia && c.mo.nghia.xong ? c.mo.nghia : c.mo.nghia;
    K.line = line;
  }
  /** Gach chan LIEN cua cau dang doc: moi dong chu mot thanh tu dau dong, dai dan toi mep phai chu dang doc (theo moc giong).
   *  Chi dai ra (khop nham thu tu khong lam thanh co lai); sang dong moi thi cac dong truoc keo het dong.
   *  Hinh hoc dong do lai MOI lan goi (phong chu tai xong / soat() doi co chu sau lan do dau) — thanh da co giu nguyen, chi dat lai vi tri. */
  function dongGach(m, box) {
    const cu = m.gach && m.gach.box === box ? m.gach : null;
    const fs = parseFloat(getComputedStyle(box).fontSize) || 40;
    const lines = [], cua = new Map();
    box.querySelectorAll('.h-tk').forEach((e) => {
      const day = e.offsetTop + e.offsetHeight;
      let L = lines.find((x) => Math.abs(x.day - day) < fs * 0.6);
      if (!L) { L = { day, x0: e.offsetLeft, x1: e.offsetLeft + e.offsetWidth, el: null, w: 0 }; lines.push(L); }
      L.x0 = Math.min(L.x0, e.offsetLeft); L.x1 = Math.max(L.x1, e.offsetLeft + e.offsetWidth);
      cua.set(e, L);
    });
    // thanh gach nam o khoang giua mep duoi chu va furigana dong sau: sat chu (0,1 em duoi day hop chu), khong tran vao ruby dong ke
    const yGach = (L) => Math.round(L.day - fs * 0.1), hGach = Math.max(3, Math.round(fs * 0.09));
    lines.forEach((L, i) => {
      const o = cu && cu.lines[i];
      if (o && o.el) { L.el = o.el; L.w = Math.min(o.w, L.x1 - L.x0); L.el.style.left = L.x0 + 'px'; L.el.style.top = yGach(L) + 'px'; L.el.style.height = hGach + 'px'; }
    });
    m.gach = { box, fs, lines, cua, lanT: cu ? cu.lanT : null, yGach, hGach };
    return m.gach;
  }
  function gachLuot(m, e, t, dur) {
    const box = e.parentNode;
    if (!box) return;
    const g = dongGach(m, box);
    const L = g.cua.get(e);
    if (!L) return;
    const keo = (D, w, d, tt) => {
      w = Math.min(w, Math.max(1, D.x1 - D.x0));
      if (!D.el) {
        D.el = mk('div', 'h-gach', box);
        D.el.style.cssText = 'left:' + D.x0 + 'px;top:' + g.yGach(D) + 'px;width:0px;height:' + g.hGach + 'px';
      }
      if (w <= D.w + 0.5) return;
      const w0 = D.w;
      D.w = w;
      // fromTo voi gia tri dau RO RANG (dich cu cua dong): nhieu doan chay chong len nhau khong doc nham gia tri dang do -> thanh khong bao gio vuot dong hay co lai
      if (giam()) G.set(D.el, { width: w, delay: tt });
      else G.fromTo(D.el, { width: w0 }, { width: w, duration: d, delay: tt, ease: 'none', overwrite: false, immediateRender: false });
    };
    // dong truoc chua gach het (chu cuoi dong bi nghe nham / bo qua): keo het dong ngay khi sang dong nay
    g.lines.forEach((D) => { if (D !== L && D.day < L.day) keo(D, D.x1 - D.x0, 0.15, t); });
    keo(L, Math.max(0, e.offsetLeft + e.offsetWidth - L.x0), dur, t);
  }
  function karaokeLuot(m, ds, api, c) {
    const now = api.bayGio();
    // lan doc moi cua cung cau (vd. Sensei doc lai lan 2): xoa gach cu, chay lai tu dau cau
    if (ds.length && m.gach && m.gach.lanT != null && ds[0].T > m.gach.lanT + 0.3) {
      m.gach.lines.forEach((D) => { if (D.el) { G.killTweensOf(D.el); D.el.remove(); } D.el = null; D.w = 0; });
      Object.values(m.tokEl || {}).forEach((e) => G.set(e, { clearProps: 'color' }));
    }
    ds.forEach((x, j) => {
      const e = m.tokEl && m.tokEl[x.i];
      if (!e) return;
      const t = Math.max(0, x.T - api.LEAD - now);
      // thoi gian doc chu nay: toi moc chu ke tiep trong cung dot, khong thi uoc theo be ngang chu
      const sau = ds[j + 1];
      const fs = parseFloat(getComputedStyle(e).fontSize) || 40;
      const dur = sau && sau.T > x.T ? Math.min(0.8, Math.max(0.1, sau.T - x.T)) : Math.min(0.7, Math.max(0.12, (e.offsetWidth / fs) * 0.14));
      gachLuot(m, e, t, dur);
      if (m.gach) m.gach.lanT = Math.max(m.gach.lanT == null ? -1e9 : m.gach.lanT, x.T);
      if (giam()) { G.set(e, { color: 'var(--h-dat-dam)' }); return; }
      G.to(e, { color: '#a24c30', duration: 0.14, delay: t, ease: 'power2.out', overwrite: false });
    });
  }
  function cueKaiwa(m, id, tt, api, nh, c) {
    const t = api.tre(tt);
    const K = c.lu;
    if (!K) return;
    let x;
    if (id === 'F4') { mocVao(c, 'nghia', t); A.nay(K.gNghia, t + 0.1, 1.03); return; }
    if ((x = /^F3\.(\d+)$/.exec(id))) {
      const toks = (nh.data && nh.data.tokens) || [];
      const keys = toks.map((tk, i) => (tk && tk.isKeyGrammar ? i : -1)).filter((i) => i >= 0);
      const e = m.tokEl && m.tokEl[keys[+x[1]]];
      if (e && !giam()) { ftl(e, { scale: 1 }, { scale: 1.12, duration: 0.14, delay: t, ease: 'power2.out', transformOrigin: '50% 80%' }); ftl(e, { scale: 1.12 }, { scale: 1, duration: 0.5, delay: t + 0.14, ease: 'back.out(2.4)' }); G.to(e, { color: '#a24c30', duration: 0.14, delay: t, overwrite: false }); }   // gach chan da co thanh lien (gachLuot)
    }
  }

  // ================================================================== BAI TAP (the that vao o cua che do)
  function dungQuiz(nh, api, m, c) {
    const q = nh.data || {};
    const hu = st.hu, dt = st.dt;
    const opts = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
    const cauHoi = String(q.question || '').replace(/^\[(Dễ|Vừa|Khó)\]\s*/, '');
    const [goc, yc] = tachNgoac(cauHoi);
    const co = nh.chuong || {};
    const coJp = RE_JP.test(goc);
    // the that hien NGUYEN chuoi dap an (ke ca phan giai thich trong ngoac) -> uoc be ngang ca chuoi (chu Nhat 1, chu Latin 0,55 o)
    const rongUoc = (s) => kyTu(String(s || '')).reduce((a, ch) => a + (RE_JP.test(ch) ? 1 : 0.55), 0);
    const dai = opts.some((o) => rongUoc(o) > (dt ? 6.5 : 15));
    const nganQ = opts.every((o) => rongUoc(o) <= (dt ? 6 : 7));     // dap an rat ngan (kana / romaji): o to chu to, om chu (khong keo thanh the rong chua mot chu: thua)
    const L8 = {
      d: { q: R(110, 70, 1290, 200), vom: R(110, 300, 460, 660), ox: 620, oy: 296, ow: 780, oh: dai ? 124 : nganQ ? 196 : 150, og: 22 },
      p: { q: R(8, 68, 374, 138), vom: R(8, 0, 0, 0), ox: 16, oy: 218, ow: 358, oh: dai ? 100 : nganQ ? 128 : 84, og: 8 },   // le trai >= 16: huy hieu A-D (nhô ra ~9 px) khong bi cat mep man
    };
    const Lx = dt ? L8.p : L8.d;
    // ---- tam giay cau hoi
    const rq = RC('q', L8);
    const nhanTxt = 'Thử nhé' + (yc ? ' · ' + yc : '');
    const blank = /_{2,}|＿{2,}/;
    const f0 = Math.round(Math.max(T('nhan').min, T('nhan').max));
    const hq = rq.h - (dt ? 34 : 64) * hu;
    // dau dong ngoac / cham cuoi cau dinh vao chu truoc (WORD JOINER): khong rot mot minh xuong dong cuoi
    // cum chu Nhat chi xuong dong o ranh gioi tu ICU (keep-all + <wbr>, hau to kana dinh vao tu truoc): khong be 'に | わたって'
    // '—' (gach ngang giua cau) dinh voi chu dung sau no (NBSP hai ben): khong de '—' mo coi cuoi dong 1 / dau dong 2
    const cauHtml = (coJp ? jpWbr(goc) : esc(goc)).replace(/\s+—\s+/g, '\u00a0—\u00a0').replace(/([^\s])([」』）)。？！?!]+)$/, '$1⁠$2').replace(blank, '<span class="h-khe h-blank" aria-hidden="true"><i class="h-vien"></i></span>');
    const jpNhieu = coJp && (goc.match(/[぀-ヿ一-鿿々ー]/g) || []).length > goc.length * 0.4;
    const fq = fit(cauHtml.replace(/<span class="h-khe[^]*?<\/span>/, '＿＿'), { w: rq.w - 70 * hu, h: hq, max: jpNhieu ? T('cau').max : T('cau').max * 0.55, min: (!jpNhieu && dt) ? 14 : T('cau').min, lh: 1.25, cls: 'h-r-cau', lines: jpNhieu ? 2 : (dt ? 6 : 3) });
    // cau hoi dai (N3-N1, tron Nhat-Viet) tung tran o o co nho nhat cua fit -> do chieu cao THAT (o trong = 1,55 em) va thu tiep
    // o trong rong theo dap an dai nhat (vd から: 2 chu) — truoc co dinh 1,55 em: dap an 2 chu tran khoi o
    const lenB = Math.min(7, Math.max(1, ...opts.map((o) => kyTu(tachNgoac(o)[0]).length)));
    const emB = Math.max(1.55, lenB * 0.95 + 0.4);
    let fq2 = fq, dq = 0;
    const sanQ = dt ? 13 : 14;
    { const wq = rq.w - 60 * hu, hq2 = rq.h - (dt ? 34 : 64) * hu - 8 * hu, ht = cauHtml.replace(/<span class="h-khe h-blank"[^]*?<\/span>/, '<span style="display:inline-block;width:' + emB + 'em;height:.95em"></span>');
      const cao = (f) => caoNoiDung('<div class="h-cau-hoi h-r-cau" lang="' + (coJp ? 'ja' : 'vi') + '" style="font-size:' + f + 'px;width:' + Math.round(wq) + 'px;height:auto;overflow:visible"><span class="h-cau-w">' + ht + '</span></div>', wq);
      while (fq2 > sanQ && cao(fq2) > hq2) fq2--;
      // da toi san ma van cao hon o: noi o cau hoi xuong (cac o dap an dich theo), khong cat chu
      const hh = cao(fq2);
      // tam cau hoi OM chu: dem duoi = dem tren cua nhan "Thu nhe" (khong sat tren / rong duoi); cao hon o thi noi xuong — cac o dap an
      // (va cua so anh) dich theo dq
      const hMoi = Math.round((dt ? 34 : 64) * hu + hh + (dt ? 12 : 26) * hu + 2);
      dq = hMoi - rq.h; rq.h = hMoi; }
    const bh = Math.round(fq2 * 0.95), bw = Math.round(fq2 * emB);
    const Q = giay(c.el, rq, '<div class="h-nhan" style="position:absolute;left:' + Math.round(40 * hu) + 'px;top:' + Math.round((dt ? 12 : 26) * hu) + 'px;max-width:' + Math.round(rq.w - 80 * hu) + 'px' + (dt ? ';letter-spacing:.1em' : '') + '">' + esc(nhanVua(nhanTxt, yc, rq.w - 90 * hu, dt ? '.1em' : '')) + '</div>' +
      '<div class="h-cau-hoi h-r-cau" lang="' + (coJp ? 'ja' : 'vi') + '" style="position:absolute;left:' + Math.round(30 * hu) + 'px;right:' + Math.round(30 * hu) + 'px;top:' + Math.round((dt ? 34 : 64) * hu) + 'px;bottom:' + Math.round(8 * hu) + 'px;font-size:' + fq2 + 'px;--h-bw:' + bw + 'px;--h-bh:' + bh + 'px"><span class="h-cau-w">' + cauHtml + '</span></div>');
    const blankEl = Q.querySelector('.h-blank');
    // ---- cua so anh (neu co anh)
    const url = q.imageUrl || C.anhCau((goc.match(/[぀-ヿ一-鿿々ー]+/g) || []).map((x) => ({ text: x, kanji: x })), nh.bai) || null;
    let V = null;
    if (url && !dt) {
      const rv = RC('vom', L8);
      rv.y += dq;
      V = vom(c.el, rv, { anh: url, iw: (rv.w - 64 * hu) * 1.15, iy: 20 * hu, khoa: '<small>CÂU</small>' + esc(co.i || nh.i + 1) });
    }
    // ---- o dap an (ban tinh: chi de Sensei doc; the that thay vao khi toi luot hoc vien)
    const ro0 = px(R(Lx.ox, Lx.oy, Lx.ow, Lx.oh * 4 + Lx.og * 3));
    ro0.y += dq;
    // khong co cua so anh (may tinh): khoi dap an chiem CA be ngang tam cau hoi (cung le trai / phai), khong chi cot 780 thiet ke
    if (!V && !dt) { ro0.x = rq.x; ro0.w = rq.w; }
    const chuTk = T('cau').max * 0.92;
    // the that hien nguyen chuoi dap an (vd "は (wa)") trong 1 phan tu: o tinh cung hien nguyen chuoi de chuyen sang the that khong nhay
    const dsOp = opts.map((o) => { const [p0, r] = tachNgoac(o); return { p: p0, r, full: String(o) }; });
    // do bang cung phong voi the that: Zen Maru 900, KHONG palt (h-r-cau co palt -> do hep hon -> the that xuong dong, o cao gap doi)
    // dau dong ngoac / cham cau dinh vao chu truoc (WORD JOINER): the that khong co dau noi nay nhung chi ngat truoc ")" khi cum chu khong vua dong -> ")" rot mot minh;
    // do co cum + dau dong vua be ngang thi the that khong rot dong
    const dinhDau = (t) => String(t).replace(/([^\s\u2060])([)）」』。、，！？!?]+)/g, '$1\u2060$2');
    const htOp = (o) => '<span style="font-feature-settings:normal;word-break:keep-all">' + (RE_JP.test(o.full) ? jp(dinhDau(o.full)).replace(/<span lang="ja"/g, '<span lang="ja" style="word-break:keep-all"') : esc(dinhDau(o.full))) + '</span>';
    const sanO = dt ? 13 : 14;
    // bo cuc dap an: 2 cot (dap an ngan) hoac 1 cot; dap an ngan ma 2 cot lam chu nho (be ngang nua hang) -> 1 cot neu chu to hon han
    // do bang DOM that (st.mesur: cung phong, auto-phrase, xuong dong theo tu) — uoc canvas tung lech lam chu tran khoi o
    const thuBo = (colN) => {
      const soHang = Math.ceil(Math.max(1, opts.length) / colN);
      // may tinh: hang dap an + dong chan the that (76) phai nam tren mep co truoc (~0,79 H); dien thoai: tren co truoc (~0,87 H)
      const chhMax = ((dt ? st.H * 0.86 - 70 : st.H * 0.78 - 92 * st.sy) - ro0.y - (soHang - 1) * Lx.og * st.sy) / soHang;
      const cw = Math.floor((ro0.w - (colN - 1) * Lx.og * st.sx) / colN);
      const chh = Math.round(Math.min(Lx.oh * st.sy, Math.max(dt ? 44 : 64 * st.sy, chhMax)));
      const wChu = (cw - 2 * Math.max(16, 26 * hu) - 12) * 0.94;   // o gon: dem 26 moi ben (nut A-D la huy hieu goc)
      const dongO = dai ? (dt ? 4 : 3) : (colN === 1 ? 2 : 1);
      let fo = 0;
      dsOp.forEach((o) => {
        let f = fit(htOp(o), { w: wChu, h: chh * 0.84, max: chuTk * (nganQ ? 2.6 : 1), min: sanO, lh: 1.1, cls: 'h-r-cau', lines: dongO });
        // cum chu Nhat trong the that KHONG co WORD JOINER (DOM the giu nguyen): cum dai hon dong thi bi be o ky tu cuoi -> ')' mo coi. Ha co cho moi cum chu Nhat vua mot dong
        (String(o.full).match(/[(（]?[぀-ヿ一-鿿々ー・]+[)）]?/g) || []).forEach((run) => { const w1 = rongChu(run, 'h-r-cau', 100) / 100; if (w1 * f * 1.03 > wChu * 0.97) f = Math.max(sanO, Math.floor(wChu * 0.97 / w1 / 1.03)); });
        fo = fo ? Math.min(fo, f) : f;
      });
      return { colN, soHang, chhMax, cw, chh, wChu, fo };
    };
    let bo = thuBo(dai ? 1 : 2);
    if (!dai) { const b1 = thuBo(1); if (b1.fo > bo.fo * 1.25) bo = b1; }
    const colN = bo.colN, cw = bo.cw, chhMax = bo.chhMax, wChu = bo.wChu;
    let chh = bo.chh, fo = bo.fo;
    const tiles = [];
    // dap an dai nhat van cao hon o o co nho nhat: noi cao o (trong gioi han tren mep co truoc)
    { let hMax = 0; dsOp.forEach((o) => { hMax = Math.max(hMax, caoNoiDung('<div class="h-r-cau" style="font-size:' + fo + 'px;line-height:1.1;width:' + Math.round(wChu) + 'px">' + htOp(o) + '</div>', wChu)); });
      const can = Math.ceil(hMax / 0.84);
      if (can > chh) chh = Math.round(Math.max(chh, Math.min(can, chhMax))); }
    // O OM THEO CHU: be ngang = nut A-D + chu + dem (dap an ngan khong nam giua o rong trong); cao moi hang = chu cao nhat hang + dem
    // (toi thieu du cho nut tron). The that (CSS: cot max-content, --h-w1..4, --h-py, --h-oh) xep dung y nhu cac o tinh nay.
    // dem doc >= 11 px + phan vung chu (1,36-1,45 em) lo ra ngoai dong 1.1: chu Latin thap (ko, ja) khong sat day o
    // o GON: nut A-D thanh huy hieu nho de len goc tren trai o, chu can giua o vua chu + dem deu hai ben
    // (truoc: nut tron + dem chiem 1/3 o -> dap an ngan "ke" / "Tính từ" lot giua o rong)
    const gon = true;
    // dem trai phai TRANH huy hieu A-D (nho vao o 26 hu): chu khong bao gio cham huy hieu
    const keyW = Math.max(18, Math.round(26 * hu + 5)), padR = keyW, minH = 0;
    const gyO = Math.round(Lx.og * st.sy), gxO = gyO;   // the that: gap var(--h-og) ca hai truc
    // ---- dap an RAT NGAN (kana / romaji / tro tu): moi o OM NET CHU THAT cua no (rong = chu + dem, cao = net chu cao + le deu), net chu can giua o theo net (khong theo hop dong:
    // chu thuong x-height 0,48 em nam lech xuong, 'ya' cham day o) — truoc: o cung cao 1,1 em + cung rong cot, net chu chi chiem 14 - 29 % dien tich o (thua cho)
    const xepInk = (fo_) => {
      const pXi = Math.max(8, Math.round(fo_ * 0.12)), pLi = Math.max(pXi, keyW);
      const ink = dsOp.map((o) => inkChu(o.full, fo_));
      if (ink.some((q) => !q)) return null;
      const lePhu = Math.max(6, Math.round(fo_ * 0.13));
      const wO_ = ink.map((q) => Math.round(Math.min(cw, Math.max(q.w * 1.04 + pLi + pXi + 4, fo_ * 0.9))));
      const hI_ = ink.map((q) => Math.ceil(q.b - q.t + 2 * lePhu));
      const dy_ = ink.map((q, i) => Math.round(((q.hC / 2) - (q.t + q.b) / 2) * 10) / 10);
      const nC = colN === 2 ? 2 : 1;
      const rowH_ = [], colW_ = [0, 0];
      dsOp.forEach((o, i) => { const rw = colN === 1 ? i : Math.floor(i / 2); rowH_[rw] = Math.max(rowH_[rw] || 0, hI_[i]); colW_[i % nC] = Math.max(colW_[i % nC], wO_[i]); });
      return { pX: pXi, pL: pLi, padY: 0, kt: [], wO: wO_, hO: hI_, rowH: rowH_, hU: 0, dy: dy_, hI: hI_, ink: true, cao: rowH_.reduce((x, y) => x + y, 0) + gyO * (rowH_.length - 1) };
    };
    const reJp = /[(（]?[぀-ヿ一-鿿々ー・]+[)）]?/g;
    const runNeed = (o, f_) => Math.max(0, ...(String(o.full).match(reJp) || []).filter((run) => kyTu(run).length >= 8).map((run) => rongChu(run, 'h-r-cau', 100) / 100 * f_ * 1.03));
    // cac o CUNG BE NGANG nhung co o chi chua it chu (4 dap an 'Bi dong (される)' / 'Nghi vấn': o ngan chiem < 36 % dien tich o): moi o om net chu rieng (be ngang), giu chieu cao hang, can giua trong o luoi
    const xepHug = (res, fo_) => {
      const inks = dsOp.map((o) => inkChu(o.full, fo_));
      if (inks.some((q) => !q)) return null;
      let fMin = 1;
      const wH = dsOp.map((o, i) => {
        const q = inks[i], rw = colN === 1 ? i : Math.floor(i / 2), lim = res.wO[i] - res.pL - res.pX - 6;
        if (q.w * 1.04 > lim) return res.wO[i];                  // chu xuong dong: o giu nguyen
        fMin = Math.min(fMin, q.w * (q.b - q.t) / (res.wO[i] * res.rowH[rw]));
        return Math.round(Math.min(res.wO[i], Math.max(q.w * 1.04 + res.pL + res.pX + 6, fo_ * 1.15)));
      });
      if (fMin >= 0.36) return null;
      return Object.assign({}, res, { wO: wH, hI: dsOp.map((o, i) => res.rowH[colN === 1 ? i : Math.floor(i / 2)]), dy: dsOp.map(() => 0), hug: true });
    };
    let capPX = null;      // dem phai toi da (px) khi cum chu Nhat dai khong vua mot dong o co san: bot dem phai (dem trai giu cho huy hieu A-D)
    const xepO2 = (fo_) => {
      if (nganQ) { const xi = xepInk(fo_); if (xi) return xi; }
      // dem doc >= 12 px + phan vung chu (1,36-1,45 em) lo ra ngoai dong 1.1: chu Latin thap (ko, ja) khong sat day o
      const padY_ = nganQ ? Math.max(3, Math.round(0.02 * fo_ + 1)) : Math.max(10, Math.round((dt ? 6 : 10) * hu), Math.round(0.11 * fo_ + 7));
      const kt_ = dsOp.map((o) => doHop(htOp(o), 'h-r-cau', fo_, 1.1, cw - keyW - padR - 6, RE_JP.test(o.full) ? 'ja' : ''));
      // moi dap an rat ngan (ma / wa): dem ngang nho hon — o vua chu
      const pX_ = kt_.every((k) => k.w < fo_ * 1.6) ? Math.max(10, 14 * hu) : keyW;
      // CAC O BANG NHAU (cung be ngang cot, cung chieu cao): truoc o om theo chu -> be ngang le te (516 / 399 / 247 / 228 px), cum nho giua mot tam cau hoi rong
      // be ngang MOT DONG tu nhien (khong xuong dong): chi om chu khi mot dong da nho hon 60 % cot — o hep hon cung chu thi khong xuong dong khac di (')' mo coi)
      const natI = dsOp.map((o) => rongTuNhien(htOp(o), 'h-r-cau', fo_, o.full) * 1.04);
      const nat1 = Math.max(...natI);
      const natMax = Math.min(nat1, Math.max(...kt_.map((k) => k.w)));
      // dap an DAI NGAN CHENH LECH (cau 840 px canh 'また あした。' 245 px): ep cung be ngang thi o ngan chi chua ~ 25 % chu (thua) -> moi o om chu rieng (cung le trai)
      const igual = Math.min(...natI) >= nat1 * 0.62;     // (0,45 truoc day: o ngan 340 px trong o rong 898 px = SPARSE; duoi 0,62 moi o om chu rieng)
      const rieng = (!igual || nganQ) && nat1 < cw * 1.5;      // kana ngan: moi o om chu cua no ('ki' hep hon 'ke' vai chuc px), khong keo theo o rong nhat
      const huO = igual && nat1 < cw * 0.8;      // chu chiem it hon 80 % be ngang cot: o om chu (cung rong cho ca 4 dap an), khong keo thanh the rong chua it chu
      const pXh0 = huO || rieng ? Math.max(Math.round(fo_ * (nganQ ? 0.16 : 0.45)), 10) : pX_, pXh = capPX != null ? Math.min(pXh0, capPX) : pXh0, padYh = huO ? (nganQ ? Math.max(3, Math.round(fo_ * 0.03)) : Math.max(Math.round(fo_ * 0.1), 8)) : padY_;
      const pLh = Math.max(Math.round(pXh), keyW);   // dem TRAI >= vung huy hieu A-D nho vao o
      const wO_ = kt_.map((k, i) => rieng ? Math.round(Math.min(cw, Math.max(Math.min(natI[i], Math.max(k.w, 1)) + pLh + pXh + 6, fo_ * 1.15))) : huO ? Math.round(Math.min(cw, Math.max(natMax + pLh + pXh + 6, fo_ * 1.15))) : Math.round(cw));
      // cac o hug chu van CUNG BE NGANG theo cot (khong con 516 / 399 / 247 / 228 px le te: khoang cach cot deu, le trai thang hang)
      // (chi khi cac o gan bang nhau: >= 55 % o rong nhat — chenh lech lon thi giu om chu rieng, khong keo o ngan thanh the rong chua it chu = SPARSE)
      if (rieng && Math.min(...wO_) >= 0.55 * Math.max(...wO_)) { const cm = colN === 1 ? [Math.max(...wO_)] : [Math.max(wO_[0] || 0, wO_[2] || 0), Math.max(wO_[1] || 0, wO_[3] || 0)]; for (let i = 0; i < wO_.length; i++) wO_[i] = Math.min(Math.round(cw), colN === 1 ? cm[0] : cm[i % 2]); }
      // 2 cot, o chua om chu (o day du be ngang cot nhung chu chi chiem ~ 60 %): moi COT om chu dai nhat cua cot do (cot thang hang, khong the rong chua chu ngan: SPARSE)
      if (!rieng && !huO && dsOp.length > 1) {
        const hc = [0, 0], nC = colN === 2 ? 2 : 1;
        dsOp.forEach((o, i) => { hc[i % nC] = Math.max(hc[i % nC], Math.min(natI[i], Math.max(kt_[i].w, 1)) + pLh + pXh + 6); });
        for (let i = 0; i < wO_.length; i++) wO_[i] = Math.round(Math.min(cw, Math.max(hc[i % nC], fo_ * 1.15)));
      }
      // cum chu Nhat dai (>= 8 chu) phai vua MOT dong (the that khong co <wbr>: trinh duyet be o ky tu cuoi 'で | す)'): o rong du cho cum + dem
      dsOp.forEach((o, i) => { const nd = runNeed(o, fo_); if (nd > 0) wO_[i] = Math.min(Math.round(cw), Math.max(wO_[i], Math.ceil(nd + pLh + pXh + 14))); });
      const hO_ = kt_.map((k) => Math.max(minH, Math.ceil(k.h + 2 * padYh)));
      const rowH_ = [];
      dsOp.forEach((o, i) => { const rw = colN === 1 ? i : Math.floor(i / 2); rowH_[rw] = Math.max(rowH_[rw] || 0, hO_[i]); });
      // chieu cao deu: tat ca hang bang hang cao nhat, va nang them de dung ~80 % khoang trong duoi tam cau hoi (toi da 128 thiet ke / 84 px dien thoai)
      // o om chu (dap an ngan): moi hang cung chieu cao; dap an dai: moi hang cao theo chu cua no (chieu cao deu lam 4 hang x hang cao nhat tran xuong duoi co truoc)
      let hU = Math.max(...rowH_);
      if (huO) for (let r_ = 0; r_ < rowH_.length; r_++) rowH_[r_] = hU; else hU = 0;
      const res = { pX: pXh, pL: pLh, padY: padYh, kt: kt_, wO: wO_, hO: hO_, rowH: rowH_, hU, cao: rowH_.reduce((x, y) => x + y, 0) + gyO * (rowH_.length - 1) };
      return dsOp.length > 1 ? (xepHug(res, fo_) || res) : res;
    };
    // ca khoi dap an (+ chan the that) phai nam tren mep co truoc: cao hon -> ha co chu dap an cho vua
    const limO = (dt ? st.H * 0.86 - 70 : st.H * 0.78 - 92 * st.sy) - ro0.y;
    let xo2 = xepO2(fo);
    for (let lan = 0; lan < 6 && xo2.cao > limO && fo > sanO; lan++) { fo = Math.max(sanO, Math.floor(fo * Math.max(0.8, Math.min(0.97, limO / xo2.cao)))); xo2 = xepO2(fo); }
    // cum chu Nhat dai trong dap an (the that khong co WORD JOINER / <wbr>, trinh duyet be o ky tu cuoi: '疑惑で | す)') phai vua MOT dong trong be ngang chu THAT cua o
    // (be ngang o - dem trai - dem phai); uoc luc dau (wChu) lech vai chuc px vi dem that lon hon -> ha co chu den khi vua
    if (!xo2.ink) {
      const tranRun = () => dsOp.some((o, i) => (String(o.full).match(reJp) || []).some((run) => kyTu(run).length >= 8 && rongChu(run, 'h-r-cau', 100) / 100 * fo * 1.03 > (xo2.wO[i] - xo2.pL - xo2.pX - 14) * 0.97));
      for (let lan = 0; lan < 6 && tranRun(); lan++) {
        let can = fo;
        dsOp.forEach((o, i) => (String(o.full).match(reJp) || []).forEach((run) => {
          const w1 = rongChu(run, 'h-r-cau', 100) / 100, av = xo2.wO[i] - xo2.pL - xo2.pX - 14;
          if (kyTu(run).length >= 8 && w1 * fo * 1.03 > av * 0.97) can = Math.min(can, Math.max(sanO, Math.floor(av * 0.97 / w1 / 1.03)));
        }));
        if (can < fo) { fo = can; xo2 = xepO2(fo); }
        // da toi san co chu ma van tran: bot dem phai (dem trai giu cho huy hieu A-D), chu Nhat dai duoc them ~ 10 - 19 px
        else if (capPX == null) { capPX = Math.max(10, Math.round(12 * hu)); xo2 = xepO2(fo); }
        else break;
      }
    }
    const { padY, kt, wO, hO, rowH, pX, pL } = xo2;
    void kt; void hO;
    const colW = colN === 1 ? [Math.max(...wO)] : [Math.max(wO[0] || 0, wO[2] || 0), Math.max(wO[1] || 0, wO[3] || 0)];
    const khoiW = colW.reduce((a, x) => a + x, 0) + gxO * (colW.length - 1);
    // khong co anh (may tinh): khoi dap an can giua duoi tam cau hoi; co anh / dien thoai: o cot dap an
    const vungO = !V && !dt ? { x: rq.x, w: rq.w } : { x: ro0.x, w: ro0.w };   // vung cua khoi dap an (= o the that), khoi can giua trong vung
    const ox0 = Math.round(vungO.x + Math.max(0, (vungO.w - khoiW) / 2));
    const oy0 = ro0.y;
    m.oLay = { wO, padY, minH: xo2.hU, colN, gon, padX: Math.round(pX), padL: Math.round(pL), vung: vungO, ink: !!(xo2.ink || xo2.hug), hI: xo2.hI, dy: xo2.dy };
    dsOp.forEach((o, i) => {
      const cl = colN === 1 ? 0 : i % 2, rw = colN === 1 ? i : Math.floor(i / 2);
      let y = oy0; for (let q2 = 0; q2 < rw; q2++) y += rowH[q2] + gyO;
      let r = { x: ox0 + (cl ? colW[0] + gxO : 0), y, w: wO[i], h: rowH[rw] };
      // o om net chu: moi o co kich thuoc rieng, can giua trong o luoi (cot / hang) cua no
      if (xo2.ink || xo2.hug) r = { x: r.x + Math.round((colW[cl] - wO[i]) / 2), y: y + Math.round((rowH[rw] - xo2.hI[i]) / 2), w: wO[i], h: xo2.hI[i] };
      const l = dat(mk('div', 'h-lc' + (gon ? ' is-gon' : '') + (xo2.ink ? ' is-ink' : ''), c.el), r);
      if (gon) { l.style.setProperty('--h-px', Math.round(pX) + 'px'); l.style.setProperty('--h-pl', Math.round(pL) + 'px'); }
      l.innerHTML = '<div class="h-o h-an"><div class="ky">' + 'ABCD'[i] + '</div><div class="chu" lang="' + (RE_JP.test(o.full) ? 'ja' : 'vi') + '" style="font-size:' + fo + 'px;line-height:1.1' + (xo2.ink ? ';position:relative;top:' + xo2.dy[i] + 'px' : '') + '">' + (RE_JP.test(o.full) ? jp(o.full) : esc(o.full)) + '</div><i class="h-vien"></i></div><div class="chon"></div>';
      tiles.push(l);
    });
    m.q = q; m.tiles = tiles; m.Q = Q; m.blank = blankEl; m.fo = fo; m.dsOp = dsOp;
    c.rev = { cau: () => { A.lat(Q, 0); snd('tick', 0.02); }, vom: () => { if (V) ft(V.el, { autoAlpha: 0, y: 40 * hu / 0.75 }, { autoAlpha: 1, y: 0, duration: D(0.5), ease: 'power3.out' }); } };
    tiles.forEach((l, i) => { c.rev['o' + i] = () => { A.roi(l.querySelector('.h-o'), 0); snd('tick', 0.02); }; });
    c.qz = { tiles, Q, V, q, blank: blankEl };
    c.chay = () => {
      mocVao(c, 'cau', tre('cauHoi'));
      mocVao(c, 'vom', tre('cauHoi') + 0.1);
      tiles.forEach((l, i) => mocVao(c, 'o' + i, tre('luaChon') + tre('luaBuoc') * i));
    };
  }
  /** Hop NET chu that cua chuoi ngan o co chu fs (cung cach do voi probe quet-trang: hop Range cua dong + canvas actualBoundingBox so voi fontBoundingBox):
   *  tra { w, hC, t, b } — t / b = mep tren / duoi cua net chu, tinh tu dau vung noi dung dong (hC = cao vung noi dung). null khi chua do duoc */
  function inkChu(txt, fs) {
    const m = st.mesur;
    if (!m) return null;
    const fam = '"Nunito","Zen Maru Gothic",sans-serif';
    m.className = 'h-mesur'; m.style.width = 'auto'; m.style.whiteSpace = 'nowrap'; m.style.fontSize = ''; m.style.lineHeight = ''; m.style.letterSpacing = '';
    m.innerHTML = '<span style="font:900 ' + fs + 'px/1.1 ' + fam.replace(/"/g, "'") + ';font-feature-settings:normal">' + esc(txt) + '</span>';
    const rg = document.createRange();
    rg.selectNodeContents(m.firstChild);
    let l = 1e9, r = -1e9, t = 1e9, b = -1e9;
    for (const q of rg.getClientRects()) { if (q.width < 0.5 || q.height < 0.5) continue; l = Math.min(l, q.left); r = Math.max(r, q.right); t = Math.min(t, q.top); b = Math.max(b, q.bottom); }
    if (r <= l || b <= t) return null;
    // san khau co the bi co gian bang transform: doi ve toa do layout
    const mr = m.getBoundingClientRect(), kx = mr.width > 0 && m.offsetWidth ? m.offsetWidth / mr.width : 1, ky = mr.height > 0 && m.offsetHeight ? m.offsetHeight / mr.height : 1;
    l *= kx; r *= kx; t *= ky; b *= ky;
    if (!CVX) CVX = document.createElement('canvas').getContext('2d');
    CVX.font = '900 ' + fs + 'px ' + fam;
    const q = CVX.measureText(txt);
    const fa = q.fontBoundingBoxAscent, fd = q.fontBoundingBoxDescent;
    if (!(fa + fd > 0)) return { w: r - l, hC: b - t, t: (b - t) * 0.2, b: (b - t) * 0.92 };
    const sc = (b - t) / (fa + fd);
    const it = (fa - q.actualBoundingBoxAscent) * sc, ib = Math.max(it + 1, (fa + q.actualBoundingBoxDescent) * sc);
    return { w: r - l, hC: b - t, t: it, b: ib };
  }
  function nanTu0(s, n) { return nganTu(s, n); }
  /** Nhan 'THU NHE · <yeu cau>' (chu HOA gian chu): do be ngang THAT; khong vua mot dong -> bo tien to 'Thu nhe · ' (chi con yeu cau), van khong vua thi moi cat theo ky tu */
  function nhanVua(full, yc, wMax, ls) {
    const rong = (t) => { const m = st.mesur; m.className = 'h-mesur h-nhan'; m.style.width = 'auto'; m.style.whiteSpace = 'nowrap'; m.style.fontSize = ''; m.style.letterSpacing = ls || ''; m.innerHTML = esc(t); const w = m.scrollWidth; m.style.letterSpacing = ''; return w; };
    if (rong(full) <= wMax) return full;
    const rieng = yc ? yc.charAt(0).toUpperCase() + yc.slice(1) : '';
    if (rieng && rong(rieng) <= wMax) return rieng;
    const goc = rieng || full;
    let n = kyTu(goc).length;
    while (n > 8 && rong(nganTu(goc, n)) > wMax) n--;
    return nganTu(goc, n);
  }
  function cueQuiz(m, id, tt, api, nh, c) {
    const t = api.tre(tt);
    const K = c.qz;
    if (!K) return;
    let x;
    if (id === 'Q1') { mocVao(c, 'cau', t); A.nay(K.Q, t + 0.1, 1.012); }
    else if ((x = /^Q2\.(\d+)$/.exec(id))) {
      const i = +x[1];
      for (let q = 0; q <= i; q++) mocVao(c, 'o' + q, t);
      const e = K.tiles[i] && K.tiles[i].querySelector('.h-o');
      if (e && !m.slot) A.tieuDiem(e, t + 0.05, 1.07);
    }
    else if (id === 'Q3') { hienGoiY(m, c, t); }
  }
  /** Goi y (hint) — nhan dan tren cua so anh (hoac cuoi ban) */
  function hienGoiY(m, c, t) {
    const q = m.q || {};
    if (!q.hint || m.goiY) return;
    const hu = st.hu, dt = st.dt;
    const r = dt ? px(R(8, 480, 250, 84)) : px(R(130, 716, 420, 120));   // may tinh: day 836 < mep co truoc
    const f = coVua('dan', 'Gợi ý: ' + q.hint, r.w - 40 * hu, r.h - 22 * hu, { lh: LH_VJ, lines: 3, cat: true, jpx: 1, max: T('dan').max * 0.85 });
    const lines = Math.max(1, fitLines(f.text, f.fs, r.w - 40 * hu, 'h-r-dan', LH_VJ, true));
    const hh = Math.round(lines * f.fs * LH_VJ + 26 * hu);
    const e = dan(c.el, { x: r.x, y: r.y + r.h - hh, w: r.w, h: hh }, '<span class="h-r-dan" style="line-height:' + LH_VJ + ';font-size:' + f.fs + 'px">' + jp(khongMoCoi(f.text)) + '</span>', 'la', -1.5);
    m.goiY = e;
    A.dan(e, t, -1.5);
    snd('tick', t + 0.02);
  }
  /** Den luot hoc vien: the that vao o dap an (cung vi tri voi cac o tinh) */
  function oBaiTapQuiz(m, c) {
    if (m.slot && m.slot.isConnected) return m.slot;
    const K = c.qz;
    if (!K) return null;
    const hu = st.hu, dt = st.dt;
    const t0 = K.tiles[0], tl = K.tiles[K.tiles.length - 1];
    if (!t0) return null;
    const rs_ = K.tiles.map((l) => ({ x: parseFloat(l.style.left), y: parseFloat(l.style.top), r: parseFloat(l.style.left) + parseFloat(l.style.width), b: parseFloat(l.style.top) + parseFloat(l.style.height) }));
    // o the that = ca VUNG dap an (khoi o can giua ben trong, CSS justify-content center) -> chan the + giai thich rong theo vung
    const vg_ = (m.oLay && m.oLay.vung) || { x: Math.min(...rs_.map((q) => q.x)), w: Math.max(...rs_.map((q) => q.r)) - Math.min(...rs_.map((q) => q.x)) };
    const a = { x: vg_.x, y: Math.min(...rs_.map((q) => q.y)) };
    const last = { x: vg_.x + vg_.w, y: Math.max(...rs_.map((q) => q.b)) };
    void tl;
    const slot = dat(mk('div', 'h-slot h-an', c.el), { x: a.x, y: a.y, w: last.x - a.x, h: Math.round(last.y - a.y + (dt ? 70 : 92 * st.sy)) });
    slot.dataset.hk = 'slot';
    slot.style.minHeight = slot.style.height; slot.style.height = 'auto';
    const lay = m.oLay || {};
    const dai = lay.colN ? lay.colN === 1 : (K.tiles.length ? (parseFloat(t0.style.width) > (last.x - a.x) * 0.7) : false);
    slot.style.setProperty('--h-fo', m.fo + 'px');
    slot.style.setProperty('--h-oh', Math.round(lay.minH != null ? lay.minH : parseFloat(t0.style.height)) + 'px');   // o gon: minH 0 (moi hang cao theo chu)
    slot.style.setProperty('--h-py', Math.round(lay.padY || 0) + 'px');
    (lay.wO || []).forEach((w, i) => slot.style.setProperty('--h-w' + (i + 1), Math.round(w) + 'px'));
    if (lay.ink) { slot.classList.add('is-ink'); (lay.hI || []).forEach((h_, i) => { slot.style.setProperty('--h-h' + (i + 1), Math.round(h_) + 'px'); slot.style.setProperty('--h-dy' + (i + 1), lay.dy[i] + 'px'); }); }
    slot.style.setProperty('--h-og', Math.round((dt ? 8 : 22) * st.sy) + 'px');
    slot.style.setProperty('--h-cm', Math.max(0, meoChong({ x: a.x, y: a.y + 100, w: last.x - a.x, h: last.y - a.y + 100 })) + 'px');
    slot.classList.toggle('is-mot', !!dai);
    slot.classList.toggle('is-gon', !!lay.gon);
    if (lay.gon) { slot.style.setProperty('--h-px', lay.padX + 'px'); slot.style.setProperty('--h-pl', (lay.padL != null ? lay.padL : lay.padX) + 'px'); }
    // an cac o tinh (the that tu minh hien thay)
    // (o tinh o lai toi khi the that da hien ro — 120 ms hien + du phong: the that + chan the dung xong qua vai task dai, khong co khung nao mat het dap an)
    K.tiles.forEach((l) => { G.killTweensOf(l.querySelectorAll('*')); G.killTweensOf(l); if (giam()) G.set(l, { autoAlpha: 0 }); else G.to(l, { autoAlpha: 0, duration: 0.001, delay: 0.36, overwrite: false }); });
    if (m.goiY) G.to(m.goiY, { autoAlpha: 0, duration: D(0.12) });
    A.hien(slot, 0, 0.12);
    m.slot = slot;
    snd('tick', 0);
    return slot;
  }
  function viTriTrongCanh(c, el) {
    const a = c.el.getBoundingClientRect(), b = el.getBoundingClientRect();
    return { x: b.left - a.left, y: b.top - a.top, w: b.width, h: b.height };
  }
  // vong khoanh but do quanh o dap an dung: net ve (duong cong 440x202) di NGOAI o (trai giua, tren, duoi) — khong cat qua chu / nut A-D
  // (vong bo goc ve tay: chay sat ngoai vien o, cach o m px — nam trong khe giua cac o, khong de len chu / nut A-D / o ben canh)
  const mVong = () => Math.max(5, Math.round((st.dt ? 6 : 10) * st.hu / 0.75));     // vong nam ngoai o ~3 px (khong dinh vien o: truoc day chi lo mot vanh do mong sat vien xanh)
  function rVong(r) { const m = mVong(); return { x: Math.round(r.x - m), y: Math.round(r.y - m), w: Math.round(r.w + 2 * m), h: Math.round(r.h + 2 * m) }; }
  function svgVong(w, h) {
    const sw = Math.max(3, Math.round((st.dt ? 3.5 : 6) * st.hu / 0.75)), e = sw / 2 + 0.5, W = w - e, H = h - e, rr = Math.min((h - 2 * e) / 2, 34 * st.hu);
    const d = 'M' + (e + rr + 10) + ',' + (e + 1.5) + ' L' + (W - rr) + ',' + e + ' Q' + W + ',' + e + ' ' + W + ',' + (e + rr) + ' L' + (W - 1) + ',' + (H - rr) + ' Q' + W + ',' + H + ' ' + (W - rr) + ',' + H +
      ' L' + (e + rr) + ',' + (H - 1) + ' Q' + e + ',' + H + ' ' + e + ',' + (H - rr) + ' L' + (e + 1) + ',' + (e + rr) + ' Q' + e + ',' + e + ' ' + (e + rr + 2) + ',' + (e + 0.5) + ' L' + Math.min(W - rr, e + rr + 70) + ',' + (e + 2.5);
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" style="overflow:visible;width:100%;height:100%"><path d="' + d + '" fill="none" stroke="#c8412c" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  // dau X tren goc phai o sai: lech ra ngoai goc (chi de len goc o, khong de len dong chu), giu trong man
  // (nho: nam gan nhu tron trong o — lo ra tren <= 18 % de khong cat qua tam cau hoi / huy hieu A-D o hang tren)
  function rDauX(r) { const s = Math.round(Math.min(96 * st.hu, r.h * 0.42, r.w * 0.3)); return { x: Math.round(Math.min(r.x + r.w - s * 0.78, st.cw1 - s - 8)), y: Math.round(Math.max(2, r.y - s * 0.18)), w: s, h: s }; }
  function traLoiQuiz(m, c, exId, dung) {
    const K = c.qz;
    if (!K) return;
    const hu = st.hu, dt = st.dt, q = m.q || {};
    const card = document.getElementById('card-' + exId);
    const dapDung = typeof q.correctIndex === 'number' ? q.correctIndex : 0;
    const dapChon = card ? Array.from(card.querySelectorAll('.qz-opt')).findIndex((b) => b.classList.contains('is-correct') && dung || b.classList.contains('is-wrong')) : -1;
    const nutDung = card && card.querySelectorAll('.qz-opt')[dapDung];
    const nutSai = card && !dung ? card.querySelector('.qz-opt.is-wrong') : null;
    void dapChon;
    // dau hieu tren the that: vong khoanh (dung) / dau X (sai)
    if (nutDung) {
      const r = viTriTrongCanh(c, nutDung);
      const vg = dat(mk('div', 'h-vong', c.el), rVong(r));
      vg.innerHTML = svgVong(parseFloat(vg.style.width), parseFloat(vg.style.height));
      const pv = vg.querySelector('path');
      if (giam()) G.set(vg, { autoAlpha: 1 });
      else {
        const Lg = pv.getTotalLength ? pv.getTotalLength() : 1500;
        pv.style.strokeDasharray = Lg; pv.style.strokeDashoffset = Lg;
        G.set(vg, { autoAlpha: 1 });
        G.to(pv, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut', delay: dung ? 0 : 0.7 });
      }
      m.vg = vg;
    }
    if (nutSai) {
      const r = viTriTrongCanh(c, nutSai);
      const xs = dat(mk('div', 'h-dau-x h-an', c.el), rDauX(r));
      m.xs = xs;
      A.dan(xs, 0, 0);
      A.lac(nutSai.closest('.qz-card') || nutSai, 0.1);
      snd('wrong', 0.02);
    }
    // dien dap an dung vao cho trong
    const txt = (m.dsOp && m.dsOp[dapDung] && m.dsOp[dapDung].p) || '';
    if (K.blank && txt) {
      const b = K.blank;
      const e = mk('span', 'h-o tro h-an', b, '<span class="chu" lang="ja">' + jp(txt) + '</span>');
      e.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:0';
      { const fq_ = parseFloat(getComputedStyle(b.parentNode).fontSize) || 20, n_ = Math.max(1, kyTu(txt).length);
        e.firstChild.style.fontSize = Math.max(10, Math.round(Math.min(fq_ * 0.8, (b.offsetWidth - fq_ * 0.3) / (n_ * 1.02)))) + 'px'; }
      A.roi(e, dung ? 0.15 : 0.9);
      if (dung) { snd('correct', 0.02); snd('ding', 0.5); } else { snd('ding', 1.1); }
    }
    if (dung) confeti(c, b2c(K.blank, c), 0.1);
    // giai thich + goi y (chi hien noi dung bai: khong co loi nhan xet cua Sensei)
    const phan = [];
    if (q.explanation) phan.push('<div class="h-gt-giai h-r-phu">' + jp(khongMoCoi(String(q.explanation))) + '</div>');
    if (q.hint) phan.push('<div class="h-gt-goiy h-r-phu"><b>Gợi ý:</b> ' + jp(khongMoCoi(String(q.hint))) + '</div>');
    if (phan.length && !m.gGiai) {
      const slot = m.slot;
      const rs = slot ? { x: parseFloat(slot.style.left), y: parseFloat(slot.style.top), w: parseFloat(slot.style.width), h: Math.max(parseFloat(slot.style.minHeight) || 0, slot.offsetHeight) } : { x: 0, y: 0, w: 300, h: 100 };
      let gy = rs.y + rs.h + Math.round((dt ? 6 : 14) * st.sy);
      const lim = Math.round(st.H * (dt ? 0.87 : 0.79));
      // het cho (dien thoai, hoac may tinh khi dap an dai lam khung cao): chi giu o da chon + o dung, gon cac o con lai de nhuong
      // cho giai thich — may tinh: do chieu cao that cua giai thich o co toi thieu
      const doCan = () => {
        const fMin = dt ? 13 : Math.max(14, Math.round(16 * hu));   // cung san co chu voi gap() (13 / 14 px)
        const mw0 = dt ? meoChong({ x: rs.x, y: gy, w: rs.w, h: lim - gy }) : 0, w0 = rs.w - 52 * hu - (mw0 > 0 && mw0 < rs.w * 0.45 ? mw0 : 0);
        return caoNoiDung(phan.join('').replace(/class="h-gt-/g, 'style="font-size:' + fMin + 'px" class="h-gt-'), w0) + 88 * hu + 4;
      };
      let canGiai = doCan();
      if (slot && lim - gy < canGiai) {
        slot.querySelectorAll('.qz-opt').forEach((b) => { if (!b.classList.contains('is-correct') && !b.classList.contains('is-wrong') && !b.classList.contains('is-answer')) b.style.display = 'none'; });
        slot.style.minHeight = '0px'; rs.h = slot.offsetHeight;
        gy = rs.y + rs.h + Math.round(6 * st.sy);
        // nut dung / sai da dich len: dat lai vong khoanh + dau X theo vi tri moi (truoc day khoanh nham nhan "Giai thich" / nut Tiep tuc)
        if (m.vg && nutDung) { const rv_ = rVong(viTriTrongCanh(c, nutDung)); dat(m.vg, rv_); const p_ = m.vg.querySelector('path'); m.vg.innerHTML = svgVong(rv_.w, rv_.h); if (p_) { const p2 = m.vg.querySelector('path'); p2.style.strokeDasharray = p_.style.strokeDasharray; p2.style.strokeDashoffset = '0'; } }
        if (m.xs && nutSai) dat(m.xs, rDauX(viTriTrongCanh(c, nutSai)));
        // van khong du cho cho giai thich + goi y o co toi thieu: bo dong goi y (da hien o nhan dan "Goi y" luc hoi) — khong cat chu
        if (lim - gy < canGiai && phan.length > 1) { phan.pop(); canGiai = doCan(); }
        // van thieu (giai thich dai, man doc): an ca o da chon sai (dau X di theo) — chi giu dap an dung co vong khoanh
        if (lim - gy < canGiai && nutSai) {
          nutSai.style.display = 'none';
          if (m.xs) { G.killTweensOf(m.xs); G.set(m.xs, { autoAlpha: 0 }); }
          rs.h = slot.offsetHeight; gy = rs.y + rs.h + Math.round(6 * st.sy);
          if (m.vg && nutDung) { const rv_ = rVong(viTriTrongCanh(c, nutDung)); dat(m.vg, rv_); m.vg.innerHTML = svgVong(rv_.w, rv_.h); }
          canGiai = doCan();
        }
      }
      const gh = Math.max(Math.round(84 * (dt ? st.sy : hu)), Math.min(lim - gy, Math.max(Math.round((dt ? 170 : 230) * st.sy), Math.ceil(canGiai))));
      const mw_ = dt ? meoChong({ x: rs.x, y: gy, w: rs.w, h: gh }) : 0;
      const rg = { x: rs.x, y: Math.min(gy, lim - gh), w: mw_ > 0 && mw_ < rs.w * 0.45 ? rs.w - mw_ : rs.w, h: gh };
      const inW = rg.w - 52 * hu, inH = rg.h - 52 * hu - 20 * hu - 22 * hu;
      const plain = (q.explanation ? String(q.explanation) : '') + (q.hint && phan.length > 1 ? ' Gợi ý: ' + q.hint : '');
      const f = coVua('phu', plain, inW, inH, { lh: LH_VJ, lines: 6, cat: false, max: dt ? T('phu').max * 1.05 : 34 * hu, min: dt ? 13 : Math.max(14, 16 * hu) });
      const htmlG = phan.join('').replace(/class="h-gt-/g, 'style="font-size:' + f.fs + 'px" class="h-gt-');
      // o giai thich OM chu (can giua duoi khoi dap an): giai thich ngan khong nam trong o rong het be ngang vung
      const g = gap(c.el, dt ? rg : omGap(rg, htmlG, 'Giải thích', { giua: true, cao: false, minW: Math.round(Math.min(rg.w, 620 * hu)) }), 'Giải thích', htmlG, 'la');
      m.gGiai = g;
      g.dataset.giua = '1';
      soat(c);
      A.moGap(g, dung ? 0.9 : 1.5);
      snd('ding', dung ? 0.92 : 1.52);
    }
    if (m.goiY) { G.to(m.goiY, { autoAlpha: 0, duration: D(0.2) }); }
  }
  /** Tam o trong (phan tu) theo toa do canh */
  function b2c(el, c) { if (!el) return { x: c.W / 2, y: c.H / 2 }; const r = viTriTrongCanh(c, el); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }
  /** Hoa giay (confetti) tung ra tu cho trong: 24 manh, GSAP (transform + opacity) */
  function confeti(c, o, t0) {
    if (giam()) return;
    const r = rng(404), mau = ['#c96442', '#d6a94a', '#6b8a5e', '#fbf6ec', '#e8b59a'];
    const hu = st.hu / 0.75;
    for (let k = 0; k < 24; k++) {
      const vn = mk('div', 'h-vun h-an', c.el);
      vn.style.left = o.x + 'px'; vn.style.top = o.y + 'px';
      vn.style.background = mau[k % mau.length];
      const a = -Math.PI * (0.08 + r() * 0.84), sp = (120 + r() * 200) * hu, t = (t0 || 0) + 0.05 + r() * 0.08;
      const len = Math.sin(a) * sp * 0.62;
      A.hien(vn, t, 0.05);
      ft(vn, { x: 0, rotation: 0 }, { x: Math.cos(a) * sp * 1.7, rotation: (r() - 0.5) * 720, duration: 1.4, ease: 'power2.out', delay: t });
      ft(vn, { y: 0 }, { y: len, duration: 0.5, ease: 'power2.out', delay: t });
      ftl(vn, { y: len }, { y: len + 260 * hu, duration: 0.9, ease: 'power2.in', delay: t + 0.5 });
      ftl(vn, { opacity: 1 }, { opacity: 0, duration: 0.3, ease: 'power1.in', delay: t + 1.1, onComplete: () => vn.remove() });
    }
  }

  // ================================================================== THE CHUONG / THE KET BAI
  function veTheChuong(info, api) {
    nenLai();
    const hu = st.hu, dt = st.dt;
    const c = canhTao(null);
    const ds = info.ds || [];
    const ch = info.chuong;
    let muc = [], anh = null;
    if (ch === 'vocab') { muc = ds.filter((b) => b.kind === 'vocab').map((b) => b.data && (b.data.kanji || b.data.word)); const ba = ds.find((b) => b.data && b.data.imageUrl); anh = ba && ba.data.imageUrl; }
    else if (ch === 'kanji') muc = ds.filter((b) => b.kind === 'kanji').map((b) => b.data && b.data.character);
    else if (ch === 'grammar') muc = ds.filter((b) => b.kind === 'grammar-intro').map((b) => { const t = String((b.data && b.data.title) || '').replace(/^\d+\.\s*/, ''); return t.split(/:\s*/).slice(1).join(': ') || t; });
    else if (ch === 'kaiwa') muc = vaiCua(ds.filter((b) => b.kind === 'kaiwa').map((b) => b.data)).map((v) => v.jp);
    else if (ch === 'quiz') muc = ds.filter((b) => b.kind === 'quiz').map((b, i) => 'Câu ' + (i + 1));
    muc = muc.filter(Boolean);
    const bai = (st.nhip && st.nhip.bai) || null;
    // bai KANA: chuong 'Chu cai' khong dung 漢字 (chu Han) lam hinh — dung かな / カナ theo bang chu cua chuong
    const laKanaCh = ch === 'kanji' && String((st.nhip && st.nhip.capDo) || '').toUpperCase() === 'KANA';
    const bangKana = laKanaCh ? String(((ds.find((b) => b.kind === 'kanji') || {}).data || {}).bangChu || '') : '';
    const glyph = laKanaCh ? (/kata/i.test(bangKana) ? 'カナ' : 'かな') : ({ vocab: '単語', kanji: '漢字', grammar: '文法', kaiwa: '会話', quiz: '練習' })[ch] || '学';
    const L9 = { d: { vom: R(110, 92, 690, 870), tag: R(860, 96, 540, 330), gap: R(860, 452, 1000, 400) }, p: { vom: R(12, 76, 150, 250), tag: R(174, 78, 206, 250), gap: R(12, 342, 366, 214) } };
    const rv = RC('vom', { d: L9.d.vom, p: L9.p.vom });
    const url = anh || (bai && bai.sceneImageUrl) || null;
    const V = vom(c.el, rv, { anh: url, iw: (rv.w - 64 * hu) * 1.12, iy: 4 * hu, phu: dt, khoa: '<small>PHẦN</small>' + esc((st.chuongIdx || 0) + 1), noiDung: url ? '' : oChuVom(rv, kyTu(glyph)) });
    const rt = RC('tag', { d: L9.d.tag, p: L9.p.tag });
    const tk = T('kanji');
    const ten = String(info.tenMoi || '');
    // ten phan: uu tien MOT dong ("Hội thoại" tung be 2 dong, dong 2 tran khoi nhan treo de len o "Trong phần này"); 2 dong chi khi 1 dong qua nho
    const hTen = rt.h - 230 * hu;
    const fT1 = fit(esc(ten), { w: rt.w - 70 * hu, h: hTen, max: tk.max * 0.62, min: tk.min * 0.4, lh: 1.04, cls: 'h-r-kanji', nowrap: true, txt: ten });
    const fT2 = fit(esc(ten), { w: rt.w - 70 * hu, h: hTen, max: tk.max * 0.62, min: tk.min * 0.4, lh: 1.04, cls: 'h-r-kanji', lines: 2, txt: ten });
    const motDongT = fT1 >= fT2 * 0.78;
    const fT = motDongT ? fT1 : fT2;
    const tag = treo(c.el, rt, '<div class="h-nhan" style="margin-top:' + Math.round(78 * hu) + 'px">' + esc(info.tenCu ? 'Xong ' + info.tenCu + ' ✓' : 'Phần tiếp theo') + '</div>' +
      '<div class="h-dau-chu" style="margin-top:' + Math.round((dt ? 24 : 40) * hu) + 'px"><span class="h-kanji-to h-r-kanji" style="font-size:' + fT + 'px;line-height:1.04;text-align:center;white-space:' + (motDongT ? 'nowrap' : 'normal') + ';max-width:' + Math.round(rt.w - 60 * hu) + 'px">' + esc(ten) + '</span></div>' +
      (info.meta ? '<div class="h-romaji" style="margin-top:' + Math.round(14 * hu) + 'px;font-size:' + Math.round(Math.max(T('romaji').min, Math.min(T('romaji').max, fT * 0.3))) + 'px">' + esc(info.meta) + '</div>' : ''));
    const rg = RC('gap', { d: L9.d.gap, p: L9.p.gap });
    { const mw0 = meoChong(rg); if (mw0 > 0 && mw0 < rg.w * 0.6) rg.w -= mw0; }
    const toi = dt ? 8 : 14;
    const list = muc.slice(0, toi);
    const chipsW = rg.w - 52 * hu, chipsH = rg.h - 52 * hu - 20 * hu;
    // chip: co chu chung vua khung (nhieu chip -> nho dan)
    let fc = Math.round(T('tt').max * (dt ? 0.7 : 1.05)), ok_ = false;
    for (; fc >= Math.round(T('nghia').min * 0.7); fc -= 2) {
      const html = list.map((x) => '<span class="h-chip2' + (kyTu(x).length <= 1 ? ' h-chip1' : '') + '" style="font-size:' + fc + 'px">' + (RE_JP.test(x) ? jp(x) : esc(x)) + '</span>').join('') + (muc.length > toi ? '<span class="h-chip2 them" style="font-size:' + fc + 'px">+' + (muc.length - toi) + '</span>' : '');
      const m_ = st.mesur; m_.className = 'h-mesur h-chips'; m_.style.width = chipsW + 'px'; m_.style.fontSize = fc + 'px'; m_.style.lineHeight = '1.2'; m_.style.whiteSpace = 'normal'; m_.innerHTML = html;
      if (m_.scrollHeight <= chipsH) { ok_ = true; break; }
    }
    const G1 = gap(c.el, rg, 'Trong phần này', '<div class="h-chips" style="font-size:' + fc + 'px">' + list.map((x) => '<span class="h-chip2 h-an' + (kyTu(x).length <= 1 ? ' h-chip1' : '') + '">' + (RE_JP.test(x) ? jp(x) : esc(x)) + '</span>').join('') + (muc.length > toi ? '<span class="h-chip2 them">+' + (muc.length - toi) + '</span>' : '') + '</div>', 'nghe');
    void ok_;
    c.chay = () => {
    ft(V.el, { autoAlpha: 0, y: 40 * hu / 0.75 }, { autoAlpha: 1, y: 0, duration: D(0.5), ease: 'power3.out', delay: 0.0 });
      A.tha(tag, 0.1, Math.max(760 * hu, rt.y + rt.h + 40));
      snd('trans', 0.02);
      snd('tick', 0.12);
      A.moGap(G1, 0.3);
      snd('ding', 0.32);
      G1.querySelectorAll('.h-chip2.h-an').forEach((e, i) => A.no(e, 0.6 + i * 0.04));
    };
    canhVao(c, null);
    return true;
  }
  let capTabCache = null;
  function veTheXong(info, api) {
    nenLai();
    const hu = st.hu, dt = st.dt;
    const c = canhTao(null);
    const bai = (st.nhip && st.nhip.bai) || (info && info.bai) || {};
    const vl = (bai.vocabList || []).filter((v) => v && v.imageUrl).slice(0, 3);
    const cd = String((st.nhip && st.nhip.capDo) || '').toUpperCase();
    const rh = px(dt ? R(8, 70, 250, 44) : R(120, 70, 560, 70));
    const TXT_XONG = 'Tóm tắt bài học';   // nhan trung tinh (noi dung bai), khong phai loi Sensei
    const fh = coVua('dan', TXT_XONG, rh.w - 60 * hu, rh.h - 22 * hu, { nowrap: true, lh: 1.1, max: dt ? 20 : 40 * hu, min: 14 });
    const head = dan(c.el, { x: rh.x, y: rh.y, w: Math.round(rongTuNhien(esc(TXT_XONG), 'h-r-dan', fh.fs, TXT_XONG) + 70 * hu), h: Math.round(fh.fs * 1.2 + 32 * hu) }, '<span class="h-r-dan" style="font-size:' + fh.fs + 'px;white-space:nowrap">' + esc(TXT_XONG) + '</span>', '', -2);
    const cards = [];
    const nCard = 4;
    const gx = Math.round((dt ? 8 : 28) * st.sx);
    const x0 = px(R(dt ? 8 : 110, 0, 1, 1)).x, wTot = Math.round((dt ? 374 : 1290) * st.sx);
    const cols = dt ? 2 : 4;
    const cw = Math.floor((wTot - gx * (cols - 1)) / cols);
    const y0 = rh.y + rh.h + Math.round((dt ? 18 : 30) * st.sy);
    // dien thoai: 2 hang the + ruy tam biet (30 + 70) phai nam tren mep co truoc (~0,88 H)
    // khong the nao co anh (bai chao hoi / so dem): the thap hon (chu khong lot giua the cao trong) — ruy + huy hieu dich len theo
    const coAnhThe = vl.length > 0;
    const ch = dt ? Math.round(Math.min(coAnhThe ? 214 * st.sy : 124 * st.sy, (st.H * 0.86 - y0 - 112 * st.sy) / 2)) : Math.round((coAnhThe ? 440 : 200) * st.sy);
    const dsK = [];
    vl.forEach((v) => dsK.push({ tipo: 'tu', v }));
    if (!dsK.length) (bai.vocabList || []).slice(0, 3).forEach((v) => dsK.push({ tipo: 'tu', v }));
    (bai.kanjiList || []).slice(0, Math.max(0, 3 - dsK.length)).forEach((k) => dsK.push({ tipo: 'kj', k }));
    const slides = (bai.slides || []).filter((s) => s && s.grammarFormula);
    while (dsK.length < 3) dsK.push({ tipo: 'trong' });
    const mau = slides[0];
    dsK.slice(0, 3).forEach((d, i) => {
      const cl = i % cols, rw = Math.floor(i / cols);
      const r = { x: x0 + cl * (cw + gx), y: y0 + rw * (ch + Math.round(12 * st.sy)), w: cw, h: ch };
      const tt = dat(mk('div', 'h-tt', c.el), r);
      tt.style.rotate = (i % 2 ? 1 : -1) + 'deg';
      const gy = mk('div', 'h-giay', tt);
      const d0 = d.v ? { w: String(d.v.kanji || d.v.word || ''), r: d.v.kanji && d.v.furigana && d.v.furigana !== d.v.kanji ? d.v.furigana : '', n: boDau(tachNghia(d.v.meaningVi).chinh), img: d.v.imageUrl } : d.k ? { w: d.k.character, r: '', n: String(d.k.hanViet || d.k.romaji || ''), img: null } : { w: '', r: '', n: '', img: null };
      // the khong anh: chu to hon, cho xuong 2 dong (cum tu), can giua doc — khong de chu nho lot tren dau the trong
      const chiChu = !d0.img;
      // 2 dong chi khi tu co ranh gioi tu (ICU: おはよう|ございます); mot tu (こんにちは) giu mot dong — khong be giua tu
      const haiDong = chiChu && soTu(d0.w) >= 2;
      const fkj = haiDong ? fit('<span lang="ja">' + esc(d0.w) + '</span>', { w: r.w - 40 * hu, h: r.h * (d0.r ? 0.36 : 0.44), max: T('tt').max * 1.3, min: T('tt').min, lh: 1.05, cls: 'h-r-tt', lines: 2 })
        : chiChu ? fit(esc(d0.w), { w: r.w - 40 * hu, h: r.h * 0.3, max: T('tt').max * 1.3, min: T('tt').min, lh: 1.05, cls: 'h-r-tt', nowrap: true, txt: d0.w })
        : fit(esc(d0.w), { w: r.w - 30 * hu, h: r.h * 0.2, max: T('tt').max, min: T('tt').min, lh: 1.05, cls: 'h-r-tt', nowrap: true, txt: d0.w });
      const fn = chiChu ? coVua('phu', d0.n, r.w - 40 * hu, r.h * 0.26, { lines: 2, lh: 1.15, max: T('nghia').max * 1.1, min: dt ? 13 : 16 })
        : coVua('phu', d0.n, r.w - 30 * hu, r.h * 0.12, { nowrap: true, lh: 1.1, max: Math.min(T('nghia').max * 0.55, T('phu').max), min: dt ? 13 : 16 });
      // vong tron anh: phan cao con lai cua the sau chu Han (+ furigana) + nghia + dem — truoc day cao co dinh 0,46 the: tu co furigana (家 いえ) day nghia tran xuong duoi the, bi hang sau che
      const dem = 22 * hu + (d0.img ? 24 * hu : 0) + (d0.r ? Math.max(fkj * 0.5, Math.max(fkj * 0.33, dt ? 13 : 14) * 1.45 + 6 * hu) : 0) + fkj * 1.05 + 14 * hu + fn.fs * 1.25 + 12 * hu;
      const circ = Math.round(Math.max(36, Math.min(r.w * 0.74, r.h * 0.46, r.h - dem)));
      gy.innerHTML = (d0.img ? '<div class="h-tron-nho" style="width:' + circ + 'px;height:' + circ + 'px"><img alt="" decoding="async" draggable="false" src="' + esc(d0.img) + '" style="width:' + Math.round(circ * 1.25) + 'px;height:' + Math.round(circ * 1.25) + 'px;left:' + Math.round(-circ * 0.125) + 'px;top:' + Math.round(-circ * 0.06) + 'px"></div>' : '') +
        '<div class="h-tt-kj h-r-tt" lang="ja" style="font-size:' + fkj + 'px;margin-top:' + Math.round((d0.img ? 24 : 0) * hu + (d0.r ? Math.max(fkj * 0.5, Math.max(fkj * 0.33, dt ? 13 : 14) * 1.45 + 6 * hu) : 0)) + 'px' + (haiDong ? ';white-space:normal;text-align:center;line-height:1.05;max-width:' + Math.round(r.w - 40 * hu) + 'px' : '') + '">' + (d0.r ? rb(esc(d0.w), esc(d0.r)) : esc(d0.w)) + '</div><div class="h-tt-ng h-r-phu" style="font-size:' + fn.fs + 'px' + (chiChu ? ';white-space:normal;text-align:center;line-height:1.15' : '') + '">' + esc(fn.text) + '</div>';
      if (chiChu) { gy.style.justifyContent = 'center'; gy.style.paddingTop = '0px'; }
      const sau = mk('div', 'h-giay h-mat-sau', tt, '<div class="huy">' + (i + 1) + '</div><div class="h-nhan" style="color:#fff">Ôn tập</div>');
      cards.push({ tt, gy, sau });
    });
    // the mau cau
    {
      const i = 3, cl = i % cols, rw = Math.floor(i / cols);
      const r = { x: x0 + cl * (cw + gx), y: y0 + rw * (ch + Math.round(12 * st.sy)), w: cw, h: ch };
      const tt = dat(mk('div', 'h-tt mau', c.el), r);
      tt.style.rotate = '1deg';
      const gy = mk('div', 'h-giay', tt);
      let ct = '';
      if (slides[0]) {
        const cth = C.congThuc ? C.congThuc(slides[0].grammarFormula) : null;
        const phanH = cth && cth.phan ? cth.phan.map((p) => (p.loai === 'chu' ? '<span class="p">' + wbrJa(p.chu) + '</span>' : esc((() => { const t_ = String(p.nhan || '').replace(/[\-(（]+$/, '').trim(); return /[A-Za-z0-9぀-ヿ一-鿿]/.test(t_) ? t_ : 'N'; })()))) : null;
        // o cuoi ngan (N / V) dinh vao phan truoc bang khoang trang khong ngat: khong de 'N' mot minh o dong cuoi the mau cau
        const html = phanH ? phanH.map((h_, q) => (q === 0 ? '' : (q === phanH.length - 1 && (cth.phan[q].loai !== 'chu' || kyTu(cth.phan[q].chu).length <= 3) ? String.fromCharCode(160) : ' ')) + h_).join('') : jpWbr(String(slides[0].title || '').replace(/^\d+\.\s*/, ''));
        // the mau cau: du so dong cho MOI phan cong thuc (moi phan mot cum khong ngat) va cao toi 80 % the — khong cat phan cuoi (N である にもかかわらず N -> thieu N cuoi)
        // cong thuc rat ngan (N へ): chu to gap doi (the 185 x 174 chi chua 'N へ' o 40 px = SPARSE); cong thuc dai giu tran cu
        const lenCT = cth && cth.phan ? cth.phan.map((p) => (p.loai === 'chu' ? p.chu : p.nhan) || '').join('').length : 99;
        const f = fit(html, { w: r.w - 36 * hu, h: r.h * 0.78, max: T('tt').max * (lenCT <= 4 ? 2.0 : 1.4), min: Math.max(14, T('tt').min * 0.5), lh: 1.2, cls: 'h-r-tt', lines: cth && cth.phan ? Math.max(4, cth.phan.length <= 8 ? cth.phan.length + 1 : 6) : 7 });   // chu mau cau to, chiem than the; it phan: 2 dong (N1 は / N2 です)
        ct = '<div class="h-nhan">Mẫu câu</div><div class="ct h-r-tt" lang="ja" style="font-size:' + f + 'px;margin-top:' + Math.round(22 * hu) + 'px">' + html + '</div>';
        // may tinh, the cao (3 the kanji co anh cao ~ 315 px): the cong thuc chi co mot dong chu nho -> the thap theo noi dung (khong de chu 24 px troi giua the 231 x 319 = SPARSE)
        if (!dt) { const hT = doHop(html, 'h-r-tt', f, 1.2, r.w - 36 * hu, 'ja').h, can = Math.round(21 * hu * 1.2 + 22 * hu + hT + 110 * hu); if (can < r.h * 0.8) tt.style.height = can + 'px'; }
      } else ct = '<div class="h-nhan">Bài học</div><div class="ct h-r-tt" style="font-size:' + Math.round(T('tt').max * 0.5) + 'px;margin-top:' + Math.round(22 * hu) + 'px">' + esc((bai.title || '').replace(/^Bài\s*\d+\s*[:.]\s*/i, '').split(/\s+[—–]\s+/)[0]) + '</div>';
      gy.innerHTML = ct;
      gy.style.justifyContent = 'center';
      const sau = mk('div', 'h-giay h-mat-sau', tt, '<div class="huy">4</div><div class="h-nhan" style="color:#fff">Ôn tập</div>');
      cards.push({ tt, gy, sau });
    }
    // ruy tam biet + huy hieu + ket qua
    // dien thoai: huy hieu またね o goc tren phai (khong de len ruy) -> ruy full be ngang, khong chua cho huy hieu
    const rr = px(dt ? R(8, 380 + 0, 374, 58) : R(210, 690, 880, 120));
    const yRuy = Math.max(rr.y, y0 + (dt ? 2 : 1) * ch + Math.round((dt ? 30 : 60) * st.sy));
    // huy hieu 完了 de len mep phai ruy (may tinh) ~ 0,32 be ngang huy hieu: chua dem phai bang phan de len — chu ten bai khong bao gio nam duoi huy hieu
    const rbd = px(dt ? R(306, 62, 72, 70) : R(1040, 632, 250, 250));
    const padRuy = dt ? 0 : Math.round(rbd.w * 0.32 + 14 * hu);
    // ruy cuoi: ten bai (noi dung bai) thay cho loi chao tam biet cua Sensei
    const tenB = tenBai(bai).ten, soB = bai.lessonNumber != null ? 'Bài ' + bai.lessonNumber : 'Bài học';
    const txtRuy = tenB ? soB + ' · ' + tenB : soB;
    let fr = coVua('tieude', txtRuy, rr.w - 100 * hu - padRuy, rr.h - 30 * hu, dt ? { lines: 2, lh: 1.08, max: 30, min: 13 } : { nowrap: true, lh: 1.1, max: 62 * hu, min: 24 });
    let ruy2D = false;
    // may tinh: ten bai dai bi ep thanh chu nho tren mot dong (ruy rong, chu chiem it): xuong 2 dong chu to hon, ruy cao them
    if (!dt && fr.fs < 62 * hu * 0.78) {
      const f2d = coVua('tieude', txtRuy, rr.w - 100 * hu - padRuy, Math.round(rr.h * 1.5) - 30 * hu, { lines: 2, lh: 1.08, max: 62 * hu, min: 24 });
      if (f2d.fs > fr.fs * 1.2) { const hN = Math.min(Math.round(rr.h * 1.5), Math.round(f2d.fs * 2.16 + 44 * hu)); rr.y -= Math.round((hN - rr.h) / 2); rr.h = hN; fr = f2d; ruy2D = true; }
    }
    const yRuyD = coAnhThe ? rr.y : Math.min(rr.y, y0 + ch + Math.round(70 * st.sy));
    // ruy om chu (ten bai ngan): khong de ruy 640 px chua mot dong chu nho (thua); huy hieu 完了 ben phai theo mep ruy
    if (!dt && !ruy2D) { const wT = Math.round(rongChu(txtRuy, 'h-r-ruyc', fr.fs) * 1.06 + 100 * hu + padRuy); if (wT < rr.w * 0.95) rr.w = Math.max(wT, Math.round(380 * st.sx)); }
    // 2 dong: ngat TRUOC '(' (phan Viet / phan Nhat) — khong be giua cum 'am ban | duc'; chi khi dong 1 vua be ngang ruy
    const iPRuy = txtRuy.search(/\s\(/), brRuy = (ruy2D || dt) && iPRuy > 0 && rongChu(txtRuy.slice(0, iPRuy), 'h-r-ruyc', fr.fs) * 1.06 <= rr.w - 100 * hu - padRuy;
    // 2 dong (ngat truoc '('): do rong THAT ca hai dong (dong 2 la phan Nhat / ngoac, dai hon dong 1) va ha co cho vua ruy — khong tran sat mep phai
    if (brRuy) {
      const l1 = txtRuy.slice(0, iPRuy), l2 = txtRuy.slice(iPRuy).trim(), wMaxL = rr.w - 100 * hu - padRuy;
      let ff = fr.fs;
      while (ff > (dt ? 13 : 20) && Math.max(rongChu(l1, 'h-r-ruyc', ff), rongChu(l2, 'h-r-ruyc', ff)) * 1.06 > wMaxL) ff--;
      if (ff < fr.fs) fr = Object.assign({}, fr, { fs: ff });
    }
    const RB = ruy(c.el, { x: rr.x, y: dt ? yRuy : yRuyD, w: rr.w, h: rr.h }, '<span class="h-ruyc" style="font-size:' + fr.fs + 'px;padding-right:' + Math.max(padRuy, Math.round(44 * hu)) + 'px">' + (brRuy ? esc(txtRuy.slice(0, iPRuy)) + '<br>' + esc(txtRuy.slice(iPRuy).trim()) : esc(txtRuy)) + '</span>');
    if (!dt) rbd.x = Math.round(rr.x + rr.w - rbd.w * 0.32);
    const bd = dat(mk('div', 'h-matane h-an', c.el), { x: dt ? Math.min(rbd.x, st.cw1 - rbd.w - 8) : rbd.x, y: dt ? rbd.y : rbd.y - (rr.y - yRuyD), w: rbd.w, h: rbd.h });
    bd.innerHTML = '<span class="h-jpf" lang="ja" style="font-size:' + Math.round(rbd.w * (dt ? 0.2 : 0.22)) + 'px">完了</span>';
    // ket qua (cot phai)
    let KQ = null;
    const hang = (info.hang || []).slice(0, 6);
    if (hang.length && !dt) {
      const rk = px(R(1430, 200, 440, 330));
      const lines = hang.map((h) => '<div class="h-kq-hang"><span class="h-kq-n">' + esc(h.nhan) + '</span><b class="h-kq-v">' + esc(h.so) + '</b></div>').join('');
      const fk = Math.round(Math.max(T('phu').min, Math.min(T('nghia').max * 0.55, (rk.h - 80 * hu) / hang.length / 1.55)));
      KQ = gap(c.el, rk, 'Kết quả hôm nay', '<div class="h-kq" style="font-size:' + fk + 'px">' + lines + '</div>', 'la');
    }
    c.chay = () => {
      A.dan(head, 0.5, -2);
      snd('trans', 0.02);
      cards.forEach((k, i) => {
        const t = 0.9 + 0.35 * i;
        if (giam()) { G.set(k.sau, { autoAlpha: 0 }); return; }
        G.set(k.gy, { scaleX: 0, autoAlpha: 0 });   // mat truoc an han toi luc lat (khong con vach chu 1 px de len so mat sau)
        ftl(k.sau, { scaleX: 1 }, { scaleX: 0, duration: 0.17, ease: 'power2.in', delay: t, onComplete: () => G.set(k.sau, { autoAlpha: 0 }) });   // mat sau da lat: an han (khong con vach 1 px de len chu mat truoc)
        ftl(k.gy, { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, autoAlpha: 1, duration: 0.34, ease: 'back.out(1.8)', delay: t + 0.17 });
        ftl(k.tt, { y: 0 }, { y: -18 * hu / 0.75, duration: 0.2, ease: 'power2.out', delay: t });
        ftl(k.tt, { y: -18 * hu / 0.75 }, { y: 0, duration: 0.5, ease: 'bounce.out', delay: t + 0.2 });
      });
      snd('sparkle', 0.9);
      // ket qua mo cung luc cac the lat (cot phai khong trong lau), ruy + huy hieu ngay sau the cuoi
      if (KQ) A.moGap(KQ, 1.2);
      A.ruy(RB.w, 2.3, 0.75);
      snd('ding', 2.32);
      A.dan(bd, 2.9, 6);
      snd('finale', 2.9);
    };
    canhVao(c, null);
    return true;
  }
  const boDau = (s) => String(s || '').split(/[,;/]/)[0].trim();
  /** So tu (ICU, tieng Nhat) cua chuoi — de biet co cho xuong dong hop le giua tu khong */
  const SEG_JA = (() => { try { return new Intl.Segmenter('ja', { granularity: 'word' }); } catch (e) { return null; } })();
  /** html: cac tu (ICU) noi bang <wbr> — dung voi word-break: keep-all de chi xuong dong giua tu */
  function wbrJa(s) { return wbrJa0(s).replace(/([〜～])/g, '$1' + String.fromCharCode(0x2060)); }     // dau song '〜' / '～' dinh vao chu ngay sau (WORD JOINER): khong be '〜 | ない'
  function wbrJa0(s) {
    s = String(s || '');
    if (!SEG_JA) return esc(s);
    // tu <= 4 ky tu (帰ります): khong co diem ngat nao — phai vua mot dong (be giua tu = loi WORD-SPLIT)
    if (kyTu(s).length <= 4) return esc(s);
    const ds = Array.from(SEG_JA.segment(s), (x) => x.segment);
    // dinh vao tu truoc: dau cau; kana le 1 chu (し / が / て: ICU tach rieng); doan cuoi <= 2 kana (ます / ん...): khong ngat 'お願いし | ます' (dong cuoi chi con ます)
    // — cac ranh gioi tu ICU con lai giu nguyen de xuong dong can doi (研究者とも | あろう者が)
    const out = [];
    ds.forEach((x, i) => {
      const dau = /^[、。，．・」』）)s]/.test(x), kana = /^[ぁ-ゖー]+$/.test(x);
      // okurigana: kana <= 3 chu ngay sau chu Han (行|われ, 感|じ) dinh vao chu Han — khong be 'chu Han | duoi' o dau dong
      const okuri = kana && x.length <= 3 && out.length && /[一-鿿々]$/.test(out[out.length - 1]);
      if (out.length && (dau || okuri || (kana && x.length <= 1) || (kana && x.length <= 2 && i === ds.length - 1))) out[out.length - 1] += x; else out.push(x);
    });
    // tien to 1 chu (ご / お + 案内): khong de mot minh o cuoi dong 1 — dinh vao tu ke sau
    if (out.length > 1 && kyTu(out[0]).length <= 1 && /^[ぁ-ゖ]$/.test(out[0])) { out[1] = out[0] + out[1]; out.shift(); }
    return out.map((x, i) => (i ? '<wbr>' : '') + esc(x)).join('');
  }
  /** chuoi tron Viet-Nhat: cum chu Nhat chi xuong dong giua tu (keep-all + <wbr>), phan con lai esc */
  function jpWbr(s) {
    return String(s || '').split(/([぀-ヿ㐀-鿿豈-﫿々〆〜ー]+)/).map((x, i) => (i % 2 ? '<span lang="ja" style="word-break:keep-all">' + wbrJa(x) + '</span>' : esc(x))).join('');
  }
  /** chong dong mo coi: noi tu cuoi voi tu ke truoc bang khoang trang khong ngat (chu Viet) */
  function khongMoCoi(s) {
    s = String(s || '');
    // chu Viet / Latin dinh lien bang "/" (nghiep/tuong lai): them diem ngat sau "/" (U+200B) — khong thi "nghiep/tuong" la mot cum dai khong ngat duoc, dong cuoi chi con mot chu
    s = s.replace(/([A-Za-zÀ-ỹ])\/([A-Za-zÀ-ỹ])/g, '$1/\u200b$2');
    const m = /^([^]*\S)\s+(\S{1,14})\s*$/.exec(s);
    // tu cuoi la cum Nhat (nowrap) thi khong dinh: cum + tu truoc thanh mot dong khong ngat, vuot be ngang khung
    return m && m[1].length > 20 && !RE_JP.test(m[2]) ? m[1] + ' ' + m[2] : s;
  }
  function soTu(s) { if (!SEG_JA) return 1; let n = 0; for (const x of SEG_JA.segment(String(s || ''))) if (x.isWordLike) n++; return n; }

  // ================================================================== HOP DONG CHE DO
  const DUNG = { vocab: dungTuVung, kanji: dungChuHan, 'grammar-intro': dungMauCau, example: dungViDu, 'kaiwa-intro': dungKaiwaIntro, 'kaiwa-run': (nh, api, m, c) => dungLuot(nh, api, m, c, true), kaiwa: (nh, api, m, c) => dungLuot(nh, api, m, c, false), quiz: dungQuiz };
  const CUE = { vocab: cueTuVung, kanji: cueChuHan, 'grammar-intro': cueMauCau, example: cueViDu, 'kaiwa-intro': cueKaiwaIntro, kaiwa: cueKaiwa, quiz: cueQuiz };

  /** m.het(): mot canh hien du ngay (moi thu cho cue thi hien) */
  function hetCanh(c) {
    if (!c || !c.rev) return;
    Object.keys(c.rev).forEach((k) => mocVao(c, k, 0));
  }
  function veTab(nh, tieuDe) {
    if (!st.tab) return;
    const ds = dsChuong(nh);
    const ten = tieuDe ? 'Mở đầu' : nhanTab(nh);
    const idx = Math.max(0, ds.indexOf(chuongCua(nh)));
    st.chuongIdx = idx;
    capTab(nh, ten, tieuDe ? 0 : idx, ds.length);
  }

  function taoM(nh, api) {
    const m = {
      nh, api, cc: null, avt: [], avtMoi: [],
      cue(id, tt) {
        if (m.chuyen && !m.daVao && /^V[1-9]/.test(id)) m.chuyen();
        // V0 = Sensei bat dau noi = dang MO BAI (app.js): giu canh tieu de toi khi doc tu dau tien (V1); du phong 25 s
        if (m.chuyen && !m.daVao && id === 'V0' && !m.daNoi) { m.daNoi = true; if (m.henVao && api.huyHen) api.huyHen(m.henVao); m.henVao = api.hen(() => m.chuyen(true), 25000); }
        const g = CUE[nh.kind];
        if (g && m.cc && (m.daVao || !m.chuyen)) g(m, id, tt, api, nh, m.cc);
        else if (g && m.cc && m.chuyen) m.cuePhu = (m.cuePhu || []).concat([[id, tt]]);
        else if (g && !m.cc) (m.hoan = m.hoan || []).push(() => { if (m.cc) g(m, id, tt, api, nh, m.cc); });     // canh chua dung xong (giang tiep giua bai: cho phong chu / ghi de) — phat lai ngay sau khi dung
      },
      karaoke(ds, o) {
        if (!m.cc) { (m.hoan = m.hoan || []).push(() => { if (m.cc) m.karaoke(ds, o); }); return; }     // lan doc dau bi roi khi giang tiep o nhip hoi thoai: phat lai sau khi canh dung xong (thanh gach chay tu giua cau)
        if (nh.kind === 'example') karaokeVD(m, ds, api, m.cc);
        else if (nh.kind === 'kaiwa-run' || nh.kind === 'kaiwa') karaokeLuot(m, ds, api, m.cc);
      },
      loi() { /* khong co phu de / bong thoai: chi noi dung bai */ },
      ghi() {},
      tro(idMuc, o) {
        const c = m.cc;
        if (!c || !L || idMuc == null) return;
        const e = c.el.querySelector('[data-tid="' + String(idMuc).replace(/"/g, '') + '"]');
        if (e) A.tieuDiem(e, o && o.T != null ? api.treT(o.T) : 0, 1.07);
      },
      dongThoai(line, i) {
        if (nh.kind !== 'kaiwa-run' || !m.cc) return;
        m.lineDang = { l: line, i };
        if (m.cc.lu && m.cc.lu.san) veLuot(m, m.cc, line, i, (m.cc.lu.n || (Array.isArray(nh.data) ? nh.data.length : 1)));
      },
      het() {
        if (m.chuyen && !m.daVao) m.chuyen(true);
        if (m.cc) { hetCanh(m.cc); if (nh.kind === 'kanji') veNet(m, m.cc, 0); }
      },
      oBaiTap() { return nh.kind === 'quiz' && m.cc ? oBaiTapQuiz(m, m.cc) : null; },
      traLoi(exId, dung) {
        if (nh.kind === 'quiz' && m.cc) traLoiQuiz(m, m.cc, exId, dung);
        // phim tat (A-D) lam nut dap an bi vo hieu -> tieu diem roi ve <body>: chuyen sang 'Tiep tuc' de Tab / Enter tiep tuc
        if (nh.kind === 'quiz' && api.hen) api.hen(() => { try { const bt = L && L.querySelector('.sk-the-chan.cd-chan button:not(.sk-btn-ma), .sk-the-chan.cd-chan button'); if (bt && (!document.activeElement || document.activeElement === document.body || document.activeElement.disabled)) bt.focus({ preventScroll: true }); } catch (e) { /* bo qua */ } }, 500);
      },
      vaoCho() {}, raCho() {},
      roi() { goAvatar(m); if (st.m === m) st.m = null; },
    };
    return m;
  }
  /** Dien thoai (man doc cao): noi dung ngan nam dinh tren, nua duoi san khau (toi co truoc ~0,84 H) bo trong -> doi ca khoi xuong de le tren / le duoi can nhau
   *  (khong qua 110 px: khoi khong troi giua man). Chi dich canh (top), moi toa do ben trong giu nguyen. */
  function canGiuaDoc(c) {
    if (!st.dt || !c || !c.el) return;
    let top = 1e9, bot = -1e9;
    Array.from(c.el.children).forEach((e) => {
      if (!e.style || /(^| )(h-vong|h-dau-x|h-mesur|h-gach|h-vun|h-coc|h-slot)( |$)/.test(e.className)) return;
      const t = parseFloat(e.style.top), h = parseFloat(e.style.height) || (e.offsetHeight || 0);
      if (!isFinite(t) || !(h > 0)) return;
      top = Math.min(top, t); bot = Math.max(bot, t + h);
    });
    if (top > bot) return;
    const yMin = Math.round(70 * st.sy + (st.yo || 0)), yMax = Math.round(Math.min(st.H * 0.84, st.meo ? st.meo.y + 30 : st.H));
    const dy = Math.min(110, Math.round(((yMax - bot) - (top - yMin)) / 2));
    if (dy > 14) { c.dy = dy; c.el.style.top = dy + 'px'; }
  }
  function bauCanh(nh, api, m) {
    const c = canhTao(nh);
    m.cc = c;
    DUNG[nh.kind](nh, api, m, c);
    if (nh.kind === 'example' || nh.kind === 'kaiwa-intro' || nh.kind === 'vocab') canGiuaDoc(c);     // (khong cho quiz: khung giai thich / goi y sau khi tra loi can chinh khoang trong phia duoi)
    return c;
  }
  // bo canh dung san khong dung: tra lai chi so the gioi (neu la canh moi nhat) — neu khong, may quay phai truot qua mot o TRONG (canh bi bo) truoc khi toi canh ke tiep: khung trong ~0,4 s luc chuyen nhip
  function boCanh(c) { if (!c) return; try { c.el.remove(); } catch (e) {} st.canhs = st.canhs.filter((x) => x !== c); if (c.k === st.k - 1) st.k = c.k; }
  function huyPre() { if (st.pre) { boCanh(st.pre.m.cc); st.pre = null; } }

  SC.dangKy({
    id: ID,
    ten: 'Giấy cắt lớp',
    can: ['gsap'],
    batDau(lop0, ctx) {
      L = lop0; C = ctx; G = ctx.gsap;
      Object.assign(st, { primed: false, huS: '', k: 0, canhs: [], canh: null, nhip: null, m: null, avt: [], cam: { x: -troiPx(), y: 0 }, tab: null, hand: false, henDoi: 0 });
      vanCss();
      try { if (document.fonts && !FONT.nghe) { FONT.nghe = () => { if (L) khiFontXong(); }; document.fonts.addEventListener('loadingdone', FONT.nghe); } } catch (e) {}
      napTruocBai();
      mk('div', 'h-troi', L);
      st.mesur = mk('div', 'h-mesur', L);
      st.mesur.setAttribute('aria-hidden', 'true');
      st.W = 0;
      try {
        // lop doi co (bang Sensei mo / dong, ban phim ao...) ma cua so khong doi: dung lai canh theo be rong moi (dungLaiCoMoi so sanh co cu — khong lam gi neu khong doi)
        st.ro = new ResizeObserver(() => { st.suc = true; if (L && st.nhip) { clearTimeout(st.henDoi); st.henDoi = setTimeout(() => { st.henDoi = 0; try { dungLaiCoMoi(); } catch (e) { /* bo qua */ } }, 220); } });
        st.ro.observe(L);
      } catch (e) { st.ro = null; }
      doKhung(true);
      st.nenW = 0; st.nenH = 0; st.lop = [];
      st.mundo = mk('div', 'h-mundo', L);
      mk('div', 'h-vien-toi', L);
      dungTab();
      amNut(L);
      // dau mo ta: che do H KHONG co bong thoai / phu de chu Sensei (yeu cau chu du an) — probe do-bo-cuc dung selector nay de biet khong co bong thoai
      mk('span', 'h-khong-bong', L).hidden = true;
      // lop nen: dung o nhip dau (luc do kich thuoc san khau da chot), dung lai khi doi co
      nenLai();
      // am thanh: nhac nen + do muc tieng Sensei (ha nhac)
      amBat();
      if (G.ticker && !AM.tk) { AM.tk = amTick; G.ticker.add(amTick); }
      if (G.ticker) G.ticker.add(camTick);
      window.__cdH = { datTam: (key, fs) => { OV.tam = key ? { key, fs } : null; }, tm: TM, FIT, PH, st, AM, OV, hashBai, keyBai, nh: () => st.nhip, m: () => st.m, canh: () => st.canh, het: () => { if (st.m && st.m.het) st.m.het(); }, fit, T };
    },
    ketThuc() {
      clearTimeout(st.henDoi); st.henDoi = 0;
      amTat(0.25);
      try { if (FONT.nghe) document.fonts.removeEventListener('loadingdone', FONT.nghe); } catch (e) {}
      FONT.nghe = null;
      try { if (st.moMeo) st.moMeo.disconnect(); } catch (e) {}
      st.moMeo = null; st.api = null;
      try { if (G && G.ticker) G.ticker.remove(camTick); } catch (e) {}
      try { if (st.ro) st.ro.disconnect(); } catch (e) {}
      st.ro = null; st.W = 0;
      if (G && G.ticker && AM.tk) { try { G.ticker.remove(AM.tk); } catch (e) {} AM.tk = null; }
      try { if (G && st.cam) G.killTweensOf(st.cam); } catch (e) {}
      if (G) { try { G.killTweensOf(L ? L.querySelectorAll('*') : []); } catch (e) {} }
      try { if (G && st.cam) G.killTweensOf(st.cam); } catch (e) {}     // camToi / canhVao dang cho co the dat lai tween may quay sau lan kill dau
      (st.avt || []).forEach((ct) => { try { ct.go(); } catch (e) {} });
      st.avt = [];
      st.pre = null;
      L = null; C = null; st.m = null; st.nhip = null; st.mundo = null; st.mesur = null; st.canh = null; st.canhs = []; st.lop = []; st.tab = null;
    },
    doiCo() {
      // cua so doi co lien tuc khi keo: doi yen 220 ms roi moi dung lai canh (nen + canh deu ve bang canvas / do chu — nang)
      if (!L || !st.nhip) return;
      clearTimeout(st.henDoi);
      st.henDoi = setTimeout(() => { st.henDoi = 0; try { dungLaiCoMoi(); } catch (e) { try { console.warn('[h] doiCo', e); } catch (er) {} } }, 220);
    },
    /** Che do dung truoc canh nhip ke tiep trong khoang nghi (motion.js dungTruoc): chi dung + gan DOM, chua chay hieu ung */
    dungTruoc(nh, api) {
      if (!L || !DUNG[nh.kind]) return;
      doKhung();
      if (st.ngan) return;
      huyPre();
      const xay = () => {
        // nhip da bat dau (dungNhip) hoac da co canh dung san khac: bo
        if (!L || st.nhip === nh || st.pre) return;
        try {
          nenLai();
          napGhiDe(nh); napFont(nh);
          datGhiDe(nh);
          const m = taoM(nh, api);
          bauCanh(nh, api, m);
          gan(m.cc, null);
          st.pre = { beat: nh.beat, m };
        } catch (e) { huyPre(); }
      };
      xay();   // dung ngay trong khoang nghi (khong doi phong chu: canh dung san tre -> khung trong > 250 ms luc chuyen nhip); phong chu tai xong thi soat() sua lai (khiFontXong)
    },
    dungNhip(nh, api) {
      const f = DUNG[nh.kind];
      if (!f || !L) return null;
      doKhung();
      if (st.ngan) return null;
      nenLai(!st.primed);
      st.primed = true;
      napGhiDe(nh); napFont(nh);
      datGhiDe(nh);
      st.nhip = nh;
      st.api = api;
      amBat();
      const batDauBai = !!(nh.laBatDau && !nh.isResume && nh.i === 0 && nh.kind === 'vocab' && nh.bai);
      const pre = st.pre; st.pre = null;
      if (pre && !batDauBai && pre.beat === nh.beat && pre.m.nh.kind === nh.kind && !nh.laBatDau && !nh.isResume) {
        // canh da dung + gan san trong khoang nghi: chi con truot may quay + hieu ung
        const m = pre.m;
        st.m = m;
        canhVao(m.cc, nh);
        G.delayedCall(0.001, () => { if (st.nhip === nh) veTab(nh, false); });
        return m;
      }
      if (pre) boCanh(pre.m.cc);
      const m = taoM(nh, api);
      st.m = m;
      if (batDauBai) {
        // canh tieu de (Sensei chao, gioi thieu bai) -> may quay truot sang canh tu dau tien khi Sensei doc tu / sau 3.4 s
        const cT = canhTao(nh);
        dungTieuDe(nh, api, m, cT);
        canhVao(cT, nh);
        veTab(nh, true);
        khiGhiDeXong(nh, () => { if (st.m !== m) return; datGhiDe(nh); const c0 = canhTao(nh); m.cc = c0; f(nh, api, m, c0); gan(c0, null); });
        m.tT = nowG();
        m.chuyen = (khong) => {
          if (m.daVao) return;
          const c = m.cc;
          if (!c) { api.hen(() => m.chuyen(khong), 60); return; }
          const con = m.tT + 3.4 - nowG();
          if (con > 0.05 && !khong && !giam()) { if (!m.henChuyen) m.henChuyen = api.hen(() => { m.henChuyen = null; m.chuyen(true); }, con * 1000); return; }
          if (m.henChuyen && api.huyHen) api.huyHen(m.henChuyen);
          m.daVao = true;
          canhVao(c, nh);
          veTab(nh, false);
          (m.cuePhu || []).forEach((x) => { const g = CUE[nh.kind]; if (g) g(m, x[0], x[1], api, nh, c); });
          m.cuePhu = null;
        };
        // du phong: Sensei chua noi gi (khong co cue V0) sau 7 s -> vao canh tu
        m.henVao = api.hen(() => m.chuyen(true), 7000);
        return m;
      }
      khiGhiDeXong(nh, () => {
        if (st.m !== m) return;
        datGhiDe(nh);
        const c = bauCanh(nh, api, m);
        canhVao(c, nh);
        G.delayedCall(0.001, () => { if (st.nhip === nh) veTab(nh, false); });
        if (m.hoan) { const ds = m.hoan; m.hoan = null; ds.forEach((f) => { try { f(); } catch (e) { /* bo qua */ } }); }
      });
      return m;
    },
    theChuong(info, api) { st.api = api; return L && (doKhung(), !st.ngan) ? veTheChuong(info, api) : false; },
    theXong(info, api) { st.api = api; return L && (doKhung(), !st.ngan) ? veTheXong(info, api) : false; },
  });
  setTimeout(veSanNen, 1800);     // ve san lop nen luc ranh (khong chan trang luc tai)
  // do thoi gian dungNhip (ms) de chan doan hieu nang: __cdH.tm
  const D_ = SC.def(ID);
  if (D_) {
    const goc_ = D_.dungNhip;
    D_.dungNhip = function (nh, api) {
      const t0 = performance.now();
      try { return goc_.call(this, nh, api); } finally { TM.push([nh.kind, Math.round(t0), +(performance.now() - t0).toFixed(1), FIT.n, +FIT.ms.toFixed(1)]); FIT.n = 0; FIT.ms = 0; if (TM.length > 300) TM.splice(0, 100); }
    };
  }
})();
