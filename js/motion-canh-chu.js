/* ==========================================================================
   San khau giang — canh CHU (builder B, motion-spec §3.1–3.4 + bo sung v2)
   4 canh: vocab, kanji, grammar-intro, example. Dang ky qua
   SenseiMotion.dangKyCanh; chi dung c.* / c.hu.* va helper doc cua slideEngine.

   Bo sung v2 (chu nha: "nhin trong, khong thuan mat, khong tap trung"):
   - Moi nhip = MOT the trinh chieu: goc canh (.sk-canh) chinh la the .sk-the
     (nen --card, bo goc 20px, bong mem). Moi thu cua nhip nam trong the: hero,
     cach doc, nghia, meo, vi du, ghi chu cua Sensei (dong "Sensei ghi" o chan the).
   - Vao the = mot chuyen dong (cua dao dien): noi dung nhan dien (chu, cach doc,
     nghia, hinh, cong thuc) co san khi the dap xuong; chi dong phu hien theo loi
     (opacity + nhich 6px, 240 ms, dan san cho, cach nhau >= 1.2 s).
   - Mot con tro doc duy nhat (.sk-chu-tro): vet to mau nhe TRUOT tu cho dang noi sang
     cho ke tiep (translate/scale, 260 ms) thay cho nhip dap / vach quet rai rac.
     Karaoke cau vi du = con tro truot tung token.
   - Khong lap chu: ghi bang trung noi dung dang co tren the -> chi dua con tro toi.
   - The mau cau khong trong nhung chua lo chu: cau giai thich / luu y / van hoa dan san, luc
     the vao chi hien VACH XUONG (skeleton: moi dong chu = mot vach --paper-deep, chu trong suot,
     nhan "Lưu ý" / "Văn hoá" giu nguyen) — nghe truoc, doc sau (§0.1.5). Sensei noi toi: vach
     bien mat, chu hien dan tai cho (chi opacity cua .sk-cho-chu, khong nhich, khong day bo cuc).
   - Vi du: dong phu (ghep / doc tro tu / nghia) cho hai lan doc cau xong moi hien (cong chan).

   Quy tac chung (§0.1): trang thai cuoi dat truoc, hoat anh chi trang tri
   (fill backwards); khong cho animationend; moi thu duoc dan trang san luc dung
   canh (.sk-an = opacity 0, giu cho) nen hien ra khong bao gio day bo cuc.

   Ham thuan (khong DOM) xuat ra window.__motionChu de kiem thu; chay trong Node
   thi require() tra ve cung doi tuong (khong dung toi window / document).
   ========================================================================== */
(function () {
  'use strict';

  const W = typeof window !== 'undefined' ? window : null;

  /* ======================================================================
     1. HAM THUAN
     ====================================================================== */

  const RE_DAU_TOK = /^[、。，．,.！？!?・…‥」』）)】〉》「『（(【〈《]+$/;

  const kyTu = (s) => Array.from(String(s == null ? '' : s));
  const doDai = (s) => kyTu(s).length;
  const uniq = (xs) => [...new Set((xs || []).filter((x) => x !== undefined && x !== null && String(x).trim() !== '').map(String))];
  const kep = (x, a, b) => Math.max(a, Math.min(b, x));

  /** Tien to chung dai nhat (tinh theo code point) */
  function lcp(ds) {
    const a = (ds || []).map(kyTu);
    if (!a.length) return '';
    let n = Math.min(...a.map((x) => x.length));
    let i = 0;
    for (; i < n; i++) if (!a.every((x) => x[i] === a[0][i])) break;
    return a[0].slice(0, i).join('');
  }
  /** Phan con lai cua w sau goc (code point) */
  const catGoc = (w, goc) => kyTu(w).slice(doDai(goc)).join('');

  /** So sanh token: NFKC, bo khoang trang */
  const nm = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, '');

  /** Goc nhin VN/Latin (§1.6.1): khong dau, chu thuong, chuoi khac [a-z0-9] -> 1 dau cach */
  function vnNorm(s) {
    return String(s || '').normalize('NFKC').toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }
  /** vn3: 3 am tiet dau, chi nhan khi >= 8 ky tu chuan hoa va >= 2 tu (§1.6.1) */
  function vn3(text) {
    const tu = vnNorm(text).split(' ').filter(Boolean).slice(0, 3);
    const k = tu.join(' ');
    return tu.length >= 2 && k.length >= 8 ? [k] : [];
  }

  // Cum dan (§1.6.1) — luon duoc phep lam khoa VN
  const NGHIA = ['nghia la', 'co nghia', 'dich la', 'y la', 'tuc la'];
  const MEO = ['meo', 'de nho', 'cach nho'];
  const LUU_Y = ['luu y', 'chu y', 'can than'];
  const VAN_HOA = ['van hoa', 'nguoi nhat'];

  /** Tach doan giai thich thanh <= max cau (. ! ? + dau cach); du thi gop vao cau cuoi */
  function tachCau(text, max = 3) {
    const ds = String(text || '').split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
    if (ds.length <= max) return ds;
    return [...ds.slice(0, max - 1), ds.slice(max - 1).join(' ')];
  }

  /** Furigana chi tren chu Han (slideEngine.rubyTu); khong co helper thi ruby ca tu nhu cu */
  function rubyTu(se, chu, doc) {
    try { if (se && typeof se.rubyTu === 'function') return se.rubyTu(chu, doc); } catch (e) { /* roi ve ruby ca tu */ }
    return `<ruby>${escTho(chu)}<rt>${escTho(doc)}</rt></ruby>`;
  }

  /** So mora uoc luong cho karaoke (kana nho = 0, kanji khong furigana = 2) */
  const RE_KANA_NHO = /[ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ]/;
  function soMora(s) {
    let n = 0;
    for (const ch of kyTu(s)) {
      if (RE_KANA_NHO.test(ch) || ch === '・') continue;
      if (/[\u3040-\u30ff]/.test(ch)) n += 1;
      else if (/[\u4e00-\u9fff々]/.test(ch)) n += 2;
      else if (/[A-Za-z0-9]/.test(ch)) n += 0.5;
    }
    return Math.max(1, n);
  }

  /**
   * Nhan o bien suy tu vai tro trong ngoac (cong thuc chi ghi "[Tha động từ thể て]"): chi khi vai tro
   * goi ro tu loai — động từ -> V (+ thể て/ない/た/từ điển/ý chí/ば -> Vて/Vない/Vた/Vる/Vよう/Vば),
   * danh từ -> N, tính từ -> A (い/な). Ten dang dung mot minh ("Thể て") la dang dong tu. Co "bỏ" (vd
   * "Thể ない bỏ い") hoac khong chac -> '…' (khong doan).
   */
  function nhanTuVaiTro(cap) {
    const s = String(cap || '').normalize('NFC').toLowerCase();
    if (!s) return '…';
    const coV = /động từ/.test(s), coN = /danh từ/.test(s), coA = /tính từ/.test(s);
    const dang = /bỏ/.test(s) ? null
      : /thể\s*て/.test(s) ? 'て' : /thể\s*ない/.test(s) ? 'ない' : /thể\s*た(?![ぁ-ヿ])/.test(s) ? 'た'
        : /thể\s*(từ điển|辞書)/.test(s) ? 'る' : /thể\s*ý chí/.test(s) ? 'よう' : /thể\s*ば/.test(s) ? 'ば' : '';
    if (coV && coA && !coN) return 'V/A';
    if (coV && !coN && !coA) return dang == null ? 'V' : 'V' + dang;
    if (coN && !coV && !coA) return 'N';
    if (coA && !coV && !coN) return /tính từ\s*-?\s*い/.test(s) ? 'Aい' : /tính từ\s*-?\s*な/.test(s) ? 'Aな' : 'A';
    if (!coV && !coN && !coA && dang) return 'V' + dang;
    return '…';
  }

  /**
   * §3.3 Tach cong thuc thanh chuoi o bien (slot) + chip chu (literal).
   * -> null (khong co chuoi) | { phan: [{loai:'o', nhan, chu, pi} | {loai:'chu', chu, pi}], len, goc }
   */
  function tachCongThuc(fm) {
    const s = String(fm || '');
    const main = s.split(/\s{2,}|\u3000|\(|（| \/ |—|→| vs |=|;/)[0] || '';
    if (main.indexOf('+') < 0) return null;
    const RE = /(\[[^\]]*\])|(N\d?|V[\-る(（]?[^\s+\u3040-\u30ff\u4e00-\u9fff\[\]]{0,6}|A[いな]?|S\d?)(?![a-zà-ỹ])|([\u3040-\u30ff\u4e00-\u9fff々ー]+)/g;
    const phan = [];
    main.split('+').forEach((p, pi) => {
      RE.lastIndex = 0;
      let m;
      while ((m = RE.exec(p))) {
        const cuoi = phan[phan.length - 1];
        if (m[1]) {
          const cap = m[1].slice(1, -1).trim();
          if (cuoi && cuoi.loai === 'o' && !cuoi.chu) cuoi.chu = cap;
          else phan.push({ loai: 'o', nhan: nhanTuVaiTro(cap), chu: cap, pi });
        } else if (m[2]) {
          phan.push({ loai: 'o', nhan: m[2], chu: '', pi });
        } else if (m[3]) {
          if (cuoi && cuoi.loai === 'chu' && cuoi.pi === pi) cuoi.chu += m[3];
          else phan.push({ loai: 'chu', chu: m[3], pi });
        }
      }
    });
    if (!phan.some((e) => e.loai === 'o') || !phan.some((e) => e.loai === 'chu')) return null;
    const len = /↗\s*$/.test(main.trim()) || /↗\s*$/.test(s.trim());
    return { phan, len, goc: main.trim() };
  }

  /** Nhan hien thi cua o bien: bo ngoac / gach thua o cuoi ("V(" -> "V") */
  const nhanO = (x) => String(x || '').replace(/[\-(（]+$/, '') || String(x || '');

  /**
   * §3.4 Ghep cau vao cong thuc.
   * -> { kieu:'ASSEMBLE', gan:[{loai:'o', ei, tok:[i..]} | {loai:'chu', ei:[..], tok:[i..]}], duoi:[i..] }
   *  | { kieu:'DIAGRAM', lyDo }
   * tok = chi so trong mang tokens goc (bo dau cau).
   */
  function canhCau(ch, tokens) {
    const hong = (lyDo) => ({ kieu: 'DIAGRAM', lyDo });
    const phan = ch && (Array.isArray(ch) ? ch : ch.phan);
    if (!Array.isArray(phan) || !phan.length) return hong('khong-chuoi');
    const toks = [];
    (tokens || []).forEach((t, i) => {
      const s = String((t && (t.text || t.kanji)) || '').trim();
      if (!s || RE_DAU_TOK.test(s)) return;
      toks.push({ i, a: nm(t.text || t.kanji), b: nm(t.kanji || t.text) });
    });
    if (!toks.length) return hong('khong-token');

    // Gom: chip chu lien nhau (khong co o giua) khop nhu mot chuoi noi
    const nhom = [];
    phan.forEach((e, ei) => {
      const cuoi = nhom[nhom.length - 1];
      if (e.loai === 'chu' && cuoi && cuoi.loai === 'chu') { cuoi.chu += nm(e.chu); cuoi.ei.push(ei); }
      else if (e.loai === 'o' && cuoi && cuoi.loai === 'o') cuoi.ei.push(ei);
      else nhom.push({ loai: e.loai, chu: e.loai === 'chu' ? nm(e.chu) : '', ei: [ei] });
    });

    let cur = 0;
    let oCho = null;
    const gan = [];
    for (const g of nhom) {
      if (g.loai === 'o') {
        if (g.ei.length > 1) return hong('hai-o-lien');
        oCho = g;
        continue;
      }
      let tim = null;
      const j0 = oCho ? cur + 1 : cur;
      const j1 = oCho ? toks.length - 1 : cur;
      for (let j = j0; j <= j1 && !tim; j++) {
        let sa = '', sb = '';
        for (let m = 1; m <= 4 && j + m <= toks.length; m++) {
          sa += toks[j + m - 1].a; sb += toks[j + m - 1].b;
          if (sa === g.chu || sb === g.chu) { tim = { j, m }; break; }
          if (!g.chu.startsWith(sa) && !g.chu.startsWith(sb)) break;
        }
      }
      if (!tim) return hong('khong-thay-chu:' + g.chu);
      if (oCho) {
        gan.push({ loai: 'o', ei: oCho.ei[0], tok: toks.slice(cur, tim.j).map((t) => t.i) });
        oCho = null;
      }
      gan.push({ loai: 'chu', ei: g.ei, tok: toks.slice(tim.j, tim.j + tim.m).map((t) => t.i) });
      cur = tim.j + tim.m;
    }
    const con = toks.slice(cur).map((t) => t.i);
    let duoi = [];
    if (oCho) {
      if (!con.length) return hong('o-cuoi-rong');
      gan.push({ loai: 'o', ei: oCho.ei[0], tok: con });
    } else duoi = con;
    return { kieu: 'ASSEMBLE', gan, duoi };
  }

  /**
   * §3.1 Hang the tu dien cua dong tu: masu -> D, chung goc >= 1 ky tu.
   * -> null | { masu, D, goc, duoiMasu, duoiD }
   */
  function timTuDien(v) {
    if (!v || v.wordType !== 'verb') return null;
    const m = /Thể từ điển:\s*([\u3040-\u30ff\u4e00-\u9fff々ー]+)/.exec(v.accentNote || '');
    if (!m) return null;
    const masu = String(v.kanji || v.word || '');
    const D = m[1];
    const goc = lcp([masu, D]);
    if (!goc) return null;
    const duoiMasu = catGoc(masu, goc), duoiD = catGoc(D, goc);
    if (!duoiMasu || !duoiD) return null;
    return { masu, D, goc, duoiMasu, duoiD };
  }

  /**
   * Nhan dang (hien duoi moi dang cua hang bien hinh). Chi goi ten khi DUOI chu
   * noi ro dang do (hoac D lay tu accentNote "Thể từ điển"); khong chac -> ''.
   * Khong bao gio doan dang bi dong / kha nang (れる / られる nhap nhang).
   */
  function nhanDang(w, D, tuDien) {
    const s = String(w || '');
    if (!s) return '';
    if (D && s === D) return 'thể từ điển';
    // Slide day the tu dien (tieu de / cong thuc noi ro): dang tan bang kana hang -u, khong phai ます
    if (tuDien && /[うくぐすつぬぶむる]$/.test(s) && !/ます$/.test(s)) return 'thể từ điển';
    if (/ましょう$/.test(s)) return 'rủ rê lịch sự';
    if (/ました$/.test(s)) return 'quá khứ lịch sự';
    if (/ません$/.test(s)) return 'phủ định lịch sự';
    if (/ます$/.test(s)) return 'thể ます';
    if (/て(いる|います|いた)$/.test(s)) return 'thể ている';
    if (/[てで]$/.test(s)) return 'thể て';
    if (/なかった$/.test(s)) return 'quá khứ phủ định';
    if (/ない$/.test(s)) return 'thể ない';
    if (/たら$/.test(s)) return 'thể たら';
    if (/(た|んだ)$/.test(s)) return 'thể た';
    if (/ば$/.test(s)) return 'thể ば';
    return '';
  }

  // §3.3 bien hinh (a): chuoi "X → Y" trong cong thuc
  const J_BH = '[\\u3040-\\u30ff\\u4e00-\\u9fff々ー〜]+';
  // Nhom duoi thay the "う/つ/る" (khong dau cach quanh "/") = MOT dang (chi nhan o hang quy tac)
  const J_NHOM = J_BH + '(?:/' + J_BH + ')*';
  const NGOAC_BH = '(?:\\s*[(（][^)）]*[)）])?';
  const RE_CHUOI_BH = new RegExp(J_NHOM + NGOAC_BH + '(?:\\s*(?:→|->|⇒)\\s*' + J_NHOM + NGOAC_BH + ')+', 'g');
  const RE_TU_BH = new RegExp('(' + J_NHOM + ')' + NGOAC_BH, 'g');
  const RE_CHI_KANA = /^[぀-ヿー〜/]+$/;
  // (b) slide day thi / dang nhung khong co chuoi
  // "Vて", "V(từ điển)", "V（た形）"... — cho phep ngoac mo ngay sau V (do tren du lieu: 25 slide co hang)
  const RE_DANG_CT = /V[(（]?(て|ない|た|る|辞書形|từ điển|可能|れる|られる|よう|ば|ろ|たら|ている|せる|させる)/;
  const RE_DANG_TEN = /thể (て|ない|た|từ điển|khả năng|ý chí|mệnh lệnh|bị động|sai khiến|điều kiện|masu|ます)/i;
  const DUOI_OK = new Set('る て で た だ ない なかった ました ません ましょう られる れる よう ろ ば れば たら ている ています ていた'.split(' '));

  /** goc uu tien (goc ます cua dong tu) khi moi dang deu bat dau bang no; khong thi tien to chung */
  function hangBien(dang, nguon, gocUuTien, D, tuDien) {
    const goc = gocUuTien && dang.every((w) => w.startsWith(gocUuTien)) ? gocUuTien : lcp(dang);
    return { goc, quyTac: !goc, dang, duoi: dang.map((w) => catGoc(w, goc)), nguon, nhan: dang.map((w) => nhanDang(w, D, tuDien)) };
  }

  /**
   * §3.3 Hang bien hinh cho slide (toi da 3, hang dau = hang trinh dien).
   * Chi dung dang CO trong du lieu: chuoi → trong cong thuc, hoac dang tim thay
   * trong token vi du doi voi dong tu tu vung cua bai. -> [] khi khong co.
   */
  function timBienHinh(slide, lesson) {
    const sl = slide || {};
    const fm = String(sl.grammarFormula || '');
    const rows = [];
    const tuDien = /từ điển|辞書形/i.test(String(sl.title || '') + ' ' + fm);
    // (a)
    RE_CHUOI_BH.lastIndex = 0;
    let m;
    while ((m = RE_CHUOI_BH.exec(fm)) && rows.length < 3) {
      const ws = [];
      RE_TU_BH.lastIndex = 0;
      let t;
      while ((t = RE_TU_BH.exec(m[0]))) ws.push(t[1]);
      if (ws.length < 2) continue;
      const coNhom = ws.some((w) => w.indexOf('/') >= 0);
      const goc = coNhom ? '' : lcp(ws);
      if (goc && ws.every((w) => doDai(w) <= 10)) rows.push(hangBien(ws, 'chuoi', null, null, tuDien));
      // Hang quy tac (khong goc chung): moi duoi <= 4 ky tu va chi kana ("う/つ/る → って"); duoi co kanji
      // (vd "得ない → あり得る") khong phai quy tac chia duoi -> bo
      else if (!goc && ws.every((w) => RE_CHI_KANA.test(w) && w.split('/').every((x) => x && doDai(x) <= 4))) {
        rows.push(hangBien(ws, 'quy-tac', null, null, tuDien));
      }
    }
    if (rows.length) return rows;

    // (b)
    if (!RE_DANG_CT.test(fm) && !RE_DANG_TEN.test(String(sl.title || ''))) return rows;
    const dongTu = ((lesson && lesson.vocabList) || []).filter((v) =>
      v && v.wordType === 'verb' && /ます$/.test(String(v.kanji || v.word || '')));
    if (!dongTu.length) return rows;
    const daDung = new Set();
    for (const ex of sl.examples || []) {
      const tks = ex.tokens || [];
      const thuTu = [...tks.keys()].sort((a, b) => (tks[b].isKeyGrammar ? 1 : 0) - (tks[a].isKeyGrammar ? 1 : 0) || a - b);
      for (const ti of thuTu) {
        if (rows.length >= 3) break;
        const s = String(tks[ti].kanji || tks[ti].text || '');
        for (const v of dongTu) {
          if (daDung.has(v)) continue;
          const masu = String(v.kanji || v.word);
          const goc = masu.slice(0, -2);
          if (!doDai(goc) || !s.startsWith(goc)) continue;
          let noi = s;
          if (s === goc && tks[ti + 1]) noi = s + String(tks[ti + 1].kanji || tks[ti + 1].text || '');
          const con = noi.slice(goc.length);
          if (!DUOI_OK.has(con)) continue;
          const td = timTuDien(v);
          let dang = uniq([td ? td.D : null, masu, noi]);
          if (!lcp(dang)) dang = uniq([masu, noi]);
          if (dang.length < 2 || !lcp(dang)) continue;
          rows.push(hangBien(dang, 'vi-du', goc, td ? td.D : null));
          daDung.add(v);
          break;
        }
      }
      if (rows.length >= 3) break;
    }
    return rows;
  }

  /**
   * Meo tu vung khi da co hang the tu dien: bo cau "Thể từ điển: X." (hang bien hinh ngay duoi da noi
   * dieu do — noi mot lan), giu phan con lai ("Đã gặp bài 6.").
   */
  function boCauTuDien(note) {
    return String(note || '').replace(/Thể từ điển:\s*[\u3040-\u30ff\u4e00-\u9fff々ー]+\s*[.。]?\s*/, '').trim();
  }

  /** Chuan hoa de so trung noi dung (ghi bang <-> chu tren the): bo dau cau, ky hieu, khoang trang */
  function chuanTrung(s) {
    return String(s || '').normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
  }
  /** a, b trung nhau: chuoi ngan nam trong chuoi dai va dai >= 60% chuoi dai */
  function laTrung(a, b) {
    const x = chuanTrung(a), y = chuanTrung(b);
    if (!x || !y) return 0;
    const [ngan, dai] = x.length <= y.length ? [x, y] : [y, x];
    if (!dai.includes(ngan)) return 0;
    const r = ngan.length / dai.length;
    return r >= 0.6 ? r : 0;
  }

  const api = {
    tachCongThuc, canhCau, timBienHinh, timTuDien,
    // phu tro cho kiem thu
    vn3, vnNorm, tachCau, lcp, soMora, nhanO, nhanDang, laTrung, nhanTuVaiTro, boCauTuDien,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (!W) return;
  W.__motionChu = api;

  /* ======================================================================
     2. DOM + CHUYEN DONG DUNG CHUNG
     ====================================================================== */

  const E_OUT = 'cubic-bezier(.22,1,.36,1)';
  const E_IN = 'cubic-bezier(.4,0,1,1)';
  const LEAD = 0.12;           // cue ban truoc T mot khoang LEAD (§1.6.3)
  const GIU_TRO = 600;         // con tro dung o mot cho >= 600 ms
  const CACH_HIEN = 1200;      // hai dong phu hien cach nhau >= 1.2 s (bo sung B.2)
  const CACH_HIEN_BU = 600;    // dong hien bu (tiLe / thuTu / sau xong): >= 600 ms
  const GIU_NGUON = 1200;      // bien hinh: dang goc hien >= 1.2 s truoc khi doi
  const CHUA_NOI = 0.32;       // dong chua noi toi (mo, doc duoc) — = .sk-ht-o.is-cho cua canh hoi thoai (C)

  const warn = (...a) => { try { console.warn('[motion]', 'chu:', ...a); } catch (e) {} };

  const escTho = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  const RE_CO_JP = /[\u3040-\u30ff\u4e00-\u9fff々]/;

  // Hoat anh tu chay: ket thuc het khi bai giang dung (body mat .dang-giang)
  // de sau tam dung khong con gi chuyen dong.
  const dangChay = new Set();
  let daTheoDoi = false;
  function ketThuc(ds) {
    for (const a of [...ds]) { try { a.finish(); } catch (e) {} ds.delete(a); dangChay.delete(a); }
  }
  function theoDoiGiang() {
    if (daTheoDoi || !W.MutationObserver || !document.body) return;
    daTheoDoi = true;
    let truoc = document.body.classList.contains('dang-giang');
    try {
      new MutationObserver(() => {
        const nay = document.body.classList.contains('dang-giang');
        if (truoc && !nay && dangChay.size) ketThuc(dangChay);
        truoc = nay;
      }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    } catch (e) {}
  }

  // Canh chu dang song + theo doi che do san khau: het nhip (data-che = chuyen / tat)
  // -> xa het hang dong phu dang cho (khung cuoi luon du truoc khi the roi di).
  let boSong = null;
  let sanTheoDoi = null;
  function theoDoiSan() {
    if (!W.MutationObserver) return;
    const san = document.getElementById('sanKhauGiang');
    if (!san || san === sanTheoDoi) return;
    sanTheoDoi = san;
    try {
      new MutationObserver(() => {
        const che = san.getAttribute('data-che');
        if (boSong && che && che !== 'giang') boSong.xaHang(true);
      }).observe(san, { attributes: true, attributeFilter: ['data-che'] });
    } catch (e) {}
  }

  /** Vi tri bo cuc (khong tinh transform) cua el trong ref: cong offsetLeft/Top doc chuoi offsetParent */
  function viTriTrong(el, ref) {
    if (!el || !ref || !el.isConnected) return null;
    let x = 0, y = 0, n = el;
    for (let i = 0; n && n !== ref && i < 48; i++) {
      x += n.offsetLeft || 0; y += n.offsetTop || 0;
      const p = n.offsetParent;
      if (!p) return null;
      if (p !== ref) { x += p.clientLeft || 0; y += p.clientTop || 0; }
      n = p;
    }
    if (n !== ref) return null;
    const w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return null;
    return { x, y, w, h };
  }

  /** Ghi vao lich su bang ma KHONG mo bang (board.js vietBang(..., {im:true})) */
  function vietBangAn(text, kieu) {
    const B = W.SenseiBoard;
    if (!B || !text || typeof B.vietBang !== 'function' || typeof B._bangAn !== 'function') return;
    try { B.vietBang(text, kieu || 'thuong', { im: true }); } catch (e) { warn('vietBang', e); }
  }

  /**
   * Bo dung cu cua mot canh:
   *  chay     — hoat anh WAAPI (giam chuyen dong -> 120 ms opacity), dang ky de tam dung ket thuc
   *  hien     — dong phu hien ra (opacity + nhich 6px, 240 ms)
   *  xep      — hang doi dong phu: cach nhau >= 1.2 s (bu: 600 ms; nen / het nhip: ngay)
   *  tro*     — con tro doc duy nhat trong the
   *  ghi*     — dong "Sensei ghi" o chan the
   *  mot      — boc hieu ung chay dung 1 lan theo khoa; batBuoc -> xong() bu neu sot
   */
  function taoBo(c) {
    theoDoiGiang();
    theoDoiSan();
    const hu = (c && c.hu) || {};
    const giam = !!(c && c.giam);
    const cuaCanh = new Set();
    const daLam = new Set();
    const batBuoc = [];
    const hen = (fn, ms) => {
      const boc = () => { try { fn(); } catch (e) { warn('hen', e); } };
      try { if (c && typeof c.hen === 'function') return c.hen(boc, ms); } catch (e) {}
      return setTimeout(boc, ms);
    };
    const bayGio = () => { try { return c && typeof c.dongHo === 'function' ? c.dongHo() : null; } catch (e) { return null; } };
    const co = (n) => typeof hu[n] === 'function';
    const goi = (n, args) => {
      if (!co(n)) return 0;
      try { const r = hu[n](...args); return typeof r === 'number' ? r : 0; } catch (e) { warn(n, e); return 0; }
    };

    function chay(el, kf, o = {}) {
      if (!el || typeof el.animate !== 'function') return null;
      let dur = o.dur || 240;
      let k = kf;
      if (giam) {
        if (!kf.some((f) => 'opacity' in f)) return null;
        k = kf.map((f) => Object.assign({ opacity: f.opacity === undefined ? 1 : f.opacity }, 'offset' in f ? { offset: f.offset } : {}));
        dur = 120;
      }
      let a;
      try {
        a = el.animate(k, { duration: dur, delay: giam ? 0 : (o.tre || 0), easing: o.easing || E_OUT, fill: 'backwards' });
      } catch (e) { return null; }
      dangChay.add(a); cuaCanh.add(a);
      const bo = () => { dangChay.delete(a); cuaCanh.delete(a); };
      a.onfinish = bo; a.oncancel = bo;
      return a;
    }

    // The (khung dao dien v2) dang vao / ra: noi dung xuat hien CUNG the, khong hieu ung rieng (B.1)
    let gocEl = null;
    const theDong = () => {
      const t = gocEl && gocEl.closest ? gocEl.closest('.sk-o-the > .sk-the') : null;
      if (!t) return false;
      return t.classList.contains('sk-ra') || (typeof t.__den === 'number' && performance.now() < t.__den);
    };
    /**
     * Dong phu hien: bo .sk-an (trang thai cuoi) roi nhich 6px + hien dan.
     * Dong "cho doc" (.sk-cho-doc, vd giai thich ngu phap): chu da hien MO (.32 — cung quy uoc "chua noi"
     * voi o truyen cua canh hoi thoai, .sk-ht-o.is-cho) tu dau; Sensei noi toi: chu ro dan tai cho
     * (chi opacity .32 -> 1 cua .sk-cho-chu) — nhan + vien trai dung yen, khong nhich.
     */
    function hien(el, o = {}) {
      if (!el) return;
      const mo = el.classList.contains('sk-cho-doc') && el.classList.contains('sk-an');
      el.classList.remove('sk-an'); el.classList.add('is-hien');
      if (theDong()) return;
      if (mo) chay(el.querySelector('.sk-cho-chu') || el, [{ opacity: CHUA_NOI, offset: 0 }], { dur: o.dur || 240, tre: o.tre || 0 });
      else chay(el, [{ opacity: 0, translate: '0 6px', offset: 0 }], { dur: o.dur || 240, tre: o.tre || 0 });
    }
    /**
     * Doi duoi (cuon): cu truot len -40% + mo, moi tu 40% vao; goc dung yen. Lop an rieng .sk-chu-tat.
     * o.tinh: doi tuc thi (nhan dang di kem duoi — giu toi da hai hoat anh cung luc)
     */
    function doi(cu, moi, o = {}) {
      if (!cu || !moi || cu === moi) return;
      cu.classList.add('sk-chu-tat'); cu.classList.remove('is-dang');
      moi.classList.remove('sk-chu-tat'); moi.classList.add('is-dang');
      if (giam) { moi.classList.add('is-moi'); return; }
      if (o.tinh || theDong()) return;
      chay(cu, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 -40%' }], { dur: 160, easing: E_IN });
      chay(moi, [{ opacity: 0, translate: '0 40%', offset: 0 }], { dur: 220, tre: 160 });
    }

    // ---- hang doi dong phu (bo sung B.2)
    const hang = [];
    let hangLuc = -1e9, henHang = null, buMode = false, daXa = false;
    const lamMuc = (m, ngay) => { try { m.fn(!!ngay); } catch (e) { warn('hien', e); } };
    const khiXaDs = [];
    /** Viec dang do (vd token dang bay) phai xong ngay khi xa hang (het nhip / roi canh) */
    const khiXa = (fn) => { khiXaDs.push(fn); };
    const buocCua = (m) => (buMode || m.via === 'tiLe' || m.via === 'thuTu' ? CACH_HIEN_BU : CACH_HIEN);
    // Cong chan: dong phu xep hang nhung chua hien (vd cau vi du dang duoc doc hai lan)
    let hangChan = false, henMo = null;
    // Som nhat muc ke tiep duoc hien (vd token ghep dang bay, trinh dien bien hinh vua doi)
    let hangSom = -1e9;
    function chayHang() {
      if (henHang != null || !hang.length || hangChan) return;
      const con = Math.max(hangLuc + buocCua(hang[0]), hangSom) - performance.now();
      if (con <= 16) {
        const m = hang.shift();
        hangLuc = performance.now();
        lamMuc(m);
        chayHang();
        return;
      }
      henHang = hen(() => { henHang = null; chayHang(); }, con);
    }
    function xep(fn, tt) {
      const via = tt && tt.via;
      if (daXa || via === 'nen' || via === 'xong') {
        xaHang(true);
        hangLuc = performance.now();
        lamMuc({ fn }, true);
        return;
      }
      hang.push({ fn, via });
      chayHang();
    }
    /** Muc phu ke tiep doi it nhat ms nua (hoat anh dang do phai xong truoc — A3: <= 2 cung luc) */
    function giuHang(ms) {
      hangSom = Math.max(hangSom, performance.now() + Math.max(0, ms || 0));
      if (henHang != null) { try { clearTimeout(henHang); } catch (e) {} henHang = null; }
      chayHang();
    }
    /**
     * Trinh dien (doi duoi bien hinh): chay NGAY, khong xep sau dong phu (khong tre 1.2 s so voi loi);
     * dong phu ke tiep van cach no >= 600 ms.
     */
    function ngay(fn) {
      try { fn(); } catch (e) { warn('ngay', e); }
      giuHang(CACH_HIEN_BU);
    }
    /**
     * Chan hang doi toi luc mo (ms tu bay gio; goi lai = doi moc, moc moi thay moc cu). Muc da xep
     * chi hien sau khi mo, van cach nhau theo nhip. Het nhip / roi canh (xaHang) luon xa het.
     */
    function chan(ms) {
      if (daXa) return;
      if (henMo != null) { try { clearTimeout(henMo); } catch (e) {} henMo = null; }
      hangChan = true;
      henMo = hen(() => { henMo = null; moChan(); }, kep(ms, 0, 12000));
    }
    function moChan() {
      if (henMo != null) { try { clearTimeout(henMo); } catch (e) {} henMo = null; }
      if (!hangChan) return;
      hangChan = false;
      chayHang();
    }
    /** ngay: lam het ngay (het nhip / roi canh); khong: chuyen sang nhip bu 600 ms */
    function xaHang(ngay) {
      if (ngay) {
        daXa = true;
        hangChan = false;
        if (henMo != null) { try { clearTimeout(henMo); } catch (e) {} henMo = null; }
        if (henHang != null) { try { clearTimeout(henHang); } catch (e) {} henHang = null; }
        while (hang.length) lamMuc(hang.shift(), true);
        while (khiXaDs.length) { try { khiXaDs.shift()(); } catch (e) { warn('xa', e); } }
        return;
      }
      buMode = true;
      chayHang();
    }

    // ---- con tro doc (bo sung B.3; duyet r4: khong meo goc, khong quet cheo)
    // Hai goc con tro .sk-chu-tro (luan phien). Moi goc = 6 manh dac mau --accent: dai ngang, dai doc
    // (hinh chu nhat khong bo goc) + 4 hinh tron o 4 goc -> ghep dung MOT hinh chu nhat bo goc R.
    // Goc to nhom opacity .14 + multiply (= --sk-to cua dao dien: mot mau voi .sk-con-tro).
    // Truot: tron goc chi translate, hai dai translate + scale (dai khong bo goc -> gian khong meo):
    // o moi thoi diem hop cac manh la dung hinh bo goc noi suy -> goc luon tron.
    // Khac cot / xa > 240 px / to nho lech > 3 lan / karaoke xuong dong: khong truot cheo qua chu khac —
    // goc cu mo ra (100 ms) tai cho, goc kia hien o cho moi (140 ms).
    const TRO_MO = 0.14;
    const tro = { goc: [], i: 0, cur: null, tu: null, luc: -1e9, cho: null, henCho: null, anims: [], the: 0 };
    const manhCua = (g) => (g ? (g.__manh || (g.__manh = [...g.querySelectorAll(':scope > b')])) : []);
    const cotCua = (el) => (el && el.closest ? el.closest('[data-sk-cot]') : null);
    /** 6 manh (toa do trong cot noi dung) cua hinh k, ban kinh goc R: [ngang, doc, tl, tr, bl, br] */
    function hinhManh(k, R) {
      const { x, y, w, h } = k, d = 2 * R;
      return [
        { x, y: y + R, w, h: h - d }, { x: x + R, y, w: w - d, h },
        { x, y, w: d, h: d }, { x: x + w - d, y, w: d, h: d },
        { x, y: y + h - d, w: d, h: d }, { x: x + w - d, y: y + h - d, w: d, h: d },
      ];
    }
    const banKinh = (a, b) => Math.max(2, Math.min(12, Math.min(a.w, b.w) / 2 - 0.5, Math.min(a.h, b.h) / 2 - 0.5));
    const px1 = (n) => Math.max(0.5, n).toFixed(1) + 'px';
    function datManh(g, k, R) {
      const hs = hinhManh(k, R);
      manhCua(g).forEach((m, j) => {
        const p = hs[j];
        if (!p) return;
        m.style.width = px1(p.w);
        m.style.height = px1(p.h);
        m.style.translate = `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`;
      });
    }
    function huyTro(g) {
      if (!g) return;
      [g, ...manhCua(g)].forEach((e) => { try { e.getAnimations().forEach((a) => a.cancel()); } catch (x) {} });
    }
    function dungTruot() { tro.anims.forEach((a) => { try { a.cancel(); } catch (e) {} }); tro.anims = []; tro.tu = null; }
    /** Hinh dang THAY (co the dang truot do): noi suy tu tien do (da qua easing) cua hoat anh truot */
    function hopHienTai() {
      const c = tro.cur;
      if (!c) return null;
      const a = tro.anims.find((x) => x && x.playState === 'running');
      const f = tro.tu;
      if (!a || !f) return { x: c.x, y: c.y, w: c.w, h: c.h };
      let p = null;
      try { p = a.effect.getComputedTiming().progress; } catch (e) {}
      if (p == null) return { x: c.x, y: c.y, w: c.w, h: c.h };
      p = kep(p, 0, 1);
      const l = (u, v) => u + (v - u) * p;
      return { x: l(f.x, c.x), y: l(f.y, c.y), w: l(f.w, c.w), h: l(f.h, c.h) };
    }
    /**
     * Khung vet to quanh target (toa do trong offsetParent cua con tro = cot noi dung .sk-chu-trong).
     * Le tran px/py bi kep theo mep cot: ra ngoai cot toi da 1/3 le the (dien thoai le 18px -> 6px,
     * 1440px le 46px -> 15px: khong doi) -> vet khong dinh vao vien the. Kep doi xung (hai ben cung le).
     */
    function hopTro(t, target, px, py) {
      const ref = t.offsetParent;
      const r = viTriTrong(target, ref);
      if (!r) return null;
      let lx = px, ly = py;
      try {
        const the = (gocEl && gocEl.closest && gocEl.closest('.sk-the.co-mat')) || gocEl || ref;
        const a = ref.getBoundingClientRect(), m = the.getBoundingClientRect();
        const tran = (le) => Math.max(0, le) / 3;
        const trai = r.x + tran(a.left - m.left), phai = ref.clientWidth - r.x - r.w + tran(m.right - a.right);
        const tren = r.y + tran(a.top - m.top), duoi = ref.clientHeight - r.y - r.h + tran(m.bottom - a.bottom);
        lx = Math.max(0, Math.min(px, trai, phai));
        ly = Math.max(0, Math.min(py, tren, duoi));
      } catch (e) {}
      return { x: r.x - lx, y: r.y - ly, w: r.w + 2 * lx, h: r.h + 2 * ly };
    }
    /** Truot goc g tu hinh tu sang hinh k (ms) */
    function truot(g, tu, k, ms) {
      dungTruot();
      const R = banKinh(tu, k);
      const h0 = hinhManh(tu, R), h1 = hinhManh(k, R);
      datManh(g, k, R);
      const ds = [];
      manhCua(g).forEach((m, j) => {
        const a = h0[j], z = h1[j];
        if (!a || !z) return;
        const f = { translate: `${a.x.toFixed(1)}px ${a.y.toFixed(1)}px`, offset: 0 };
        if (j < 2) f.scale = `${(Math.max(0.5, a.w) / Math.max(0.5, z.w)).toFixed(4)} ${(Math.max(0.5, a.h) / Math.max(0.5, z.h)).toFixed(4)}`;
        const an = chay(m, [f], { dur: ms });
        if (an) ds.push(an);
      });
      tro.anims = ds;
      tro.tu = ds.length ? tu : null;
    }
    /** Mo-ra / hien: goc dang hien mo tai cho (dung truot), goc kia dat o k va hien */
    function doiCho(k, o) {
      const cu = tro.goc[tro.i], moi = tro.goc[1 - tro.i];
      const R = banKinh(k, k);
      const ra = o.karaoke ? kep((o.ms || 200) * 0.35, 50, 100) : 100;
      const vao = o.karaoke ? kep((o.ms || 200) * 0.5, 70, 140) : 140;
      if (!moi) { dungTruot(); datManh(cu, k, R); return; }
      const dangHien = cu.classList.contains('is-hien');
      let opCu = 0;
      try { opCu = dangHien ? parseFloat(getComputedStyle(cu).opacity) : 0; } catch (e) { opCu = TRO_MO; }
      const treo = tro.anims;
      tro.anims = []; tro.tu = null;
      treo.forEach((a) => { try { a.pause(); } catch (e) {} });
      cu.classList.remove('is-hien');
      if (dangHien && opCu > 0.01) chay(cu, [{ opacity: opCu }, { opacity: 0 }], { dur: ra, easing: E_IN });
      hen(() => { treo.forEach((a) => { try { a.cancel(); } catch (e) {} }); }, ra + 40);
      huyTro(moi);
      datManh(moi, k, R);
      moi.classList.add('is-hien');
      chay(moi, [{ opacity: 0, offset: 0 }], { dur: vao, tre: dangHien ? (o.karaoke ? ra * 0.5 : ra) : 0 });
      tro.i = 1 - tro.i;
    }
    function troDi(target, o = {}) {
      const g = tro.goc[tro.i];
      if (!g || !g.isConnected || !target || !target.isConnected) return;
      const px = o.px != null ? o.px : 10, py = o.py != null ? o.py : 5;
      const k = hopTro(g, target, px, py);
      if (!k) return;
      const tu = tro.cur && g.classList.contains('is-hien') ? hopHienTai() : null;
      const cotCu = tro.cur ? cotCua(tro.cur.el) : null;
      tro.cur = { x: k.x, y: k.y, w: k.w, h: k.h, el: target, px, py };
      tro.luc = performance.now();
      if (!tu) {
        dungTruot();
        huyTro(g);
        datManh(g, k, banKinh(k, k));
        g.classList.add('is-hien');
        if (!giam && !theDong()) chay(g, [{ opacity: 0, offset: 0 }], { dur: 200 });
        return;
      }
      if (Math.abs(tu.x - k.x) < 0.5 && Math.abs(tu.y - k.y) < 0.5 && Math.abs(tu.w - k.w) < 0.5 && Math.abs(tu.h - k.h) < 0.5) return;
      if (giam || theDong()) { dungTruot(); datManh(g, k, banKinh(k, k)); return; }
      const ms = kep(o.ms || 260, 80, 420);
      const dx = (k.x + k.w / 2) - (tu.x + tu.w / 2), dy = (k.y + k.h / 2) - (tu.y + tu.h / 2);
      const lech = Math.max(k.w / Math.max(1, tu.w), tu.w / Math.max(1, k.w), k.h / Math.max(1, tu.h), tu.h / Math.max(1, k.h));
      const xuongDong = !!o.karaoke && Math.abs(dy) > Math.min(k.h, tu.h) * 0.5;
      if (Math.hypot(dx, dy) > 240 || lech > 3 || cotCua(target) !== cotCu || xuongDong) { doiCho(k, { ...o, ms }); return; }
      truot(g, tu, k, ms);
    }
    /** Doi co the (fit pass, mo bang, xoay may): dat lai con tro dung cho dang chi, khong hieu ung */
    function troDatLai() {
      const g = tro.goc[tro.i], cur = tro.cur;
      if (!g || !cur || !cur.el || !cur.el.isConnected || !g.isConnected) return;
      const k = hopTro(g, cur.el, cur.px != null ? cur.px : 10, cur.py != null ? cur.py : 5);
      if (!k) return;
      dungTruot();
      datManh(g, k, banKinh(k, k));
      Object.assign(cur, k);
    }
    /** Dua con tro toi target; giu cho cu >= 600 ms (cai moi nhat thang). o.ngay: di ngay (dong phu vua hien) */
    function troToi(target, o = {}) {
      if (!target) return;
      tro.the++;
      const con = o.ngay ? 0 : tro.luc + GIU_TRO - performance.now();
      if (con > 20) {
        tro.cho = { target, o };
        if (tro.henCho == null) {
          tro.henCho = hen(() => { tro.henCho = null; const x = tro.cho; tro.cho = null; if (x) troDi(x.target, x.o); }, con);
        }
        return;
      }
      tro.cho = null;
      troDi(target, o);
    }
    /** Karaoke: con tro truot tung token dung luc (times: giay, dong ho dao dien) */
    function troKaraoke(els, times, tt) {
      if (!els || !els.length) return;
      const gen = ++tro.the;
      tro.cho = null;
      const nay = bayGio();
      const goc = nay != null ? nay : ((tt && tt.T) || 0) - LEAD;
      let tre0 = -1;
      els.forEach((el, k) => { if ((times[k] - goc) * 1000 - 40 <= 16) tre0 = k; });
      els.forEach((el, k) => {
        if (k < tre0) return;          // da qua: chi can token muon nhat
        const tre = (times[k] - goc) * 1000 - 40;
        const khoang = k + 1 < times.length ? (times[k + 1] - times[k]) * 1000 : 260;
        const buoc = () => { if (tro.the === gen) troDi(el, { ms: kep(khoang * 0.85, 90, 260), px: 5, py: 3, karaoke: true }); };
        if (tre <= 16) buoc(); else hen(buoc, tre);
      });
    }

    // ---- dong "Sensei ghi" o chan the
    let ghiEl = null;
    function ghi(text, kieu) {
      if (!ghiEl) return;
      const chu = ghiEl.querySelector('.sk-chu-ghi-chu');
      const kj = ghiEl.querySelector('.sk-chu-ghi-kj');
      if (kj) kj.remove();
      if (chu) {
        chu.textContent = String(text);
        if (RE_CO_JP.test(text)) chu.lang = 'ja'; else chu.removeAttribute('lang');
        chu.title = String(text);
        chu.className = 'sk-chu-ghi-chu' + (kieu ? ' is-' + String(kieu).replace(/[^a-z_-]/gi, '') : '');
      }
      ghiEl.dataset.co = '1';
      ghiEl.removeAttribute('aria-hidden');
      chay(ghiEl, [{ opacity: 0, translate: '0 4px', offset: 0 }], { dur: 220 });
    }
    function ghiKanji(ch) {
      const B = W.SenseiBoard;
      if (!ghiEl || !B || typeof B.vietChuHan !== 'function') return false;
      const cu = ghiEl.querySelector('.sk-chu-ghi-kj');
      if (cu) cu.remove();
      const o = document.createElement('span');
      o.className = 'sk-chu-ghi-kj';
      o.setAttribute('role', 'img');
      o.setAttribute('aria-label', 'Chữ ' + ch);
      ghiEl.insertBefore(o, ghiEl.querySelector('.sk-chu-ghi-chu'));
      let ok = false;
      try { ok = !!B.vietChuHan(ch, { noi: o, tocDo: 0.3 }); } catch (e) { warn('vietChuHan', e); }
      if (!ok) { o.remove(); return false; }
      const chu = ghiEl.querySelector('.sk-chu-ghi-chu');
      if (chu) { chu.textContent = ''; chu.removeAttribute('lang'); }
      ghiEl.dataset.co = '1';
      ghiEl.removeAttribute('aria-hidden');
      chay(ghiEl, [{ opacity: 0, offset: 0 }], { dur: 200 });
      return true;
    }
    function ghiXoa() {
      if (!ghiEl || ghiEl.dataset.co !== '1') return;
      const kj = ghiEl.querySelector('.sk-chu-ghi-kj');
      if (kj) kj.remove();
      ghiEl.dataset.co = '0';
      ghiEl.setAttribute('aria-hidden', 'true');
      chay(ghiEl, [{ opacity: 1 }, { opacity: 0 }], { dur: 160, easing: E_IN });
    }

    /** Boc hieu ung: chi chay 1 lan theo khoa (cac cue sinh doi dung chung khoa) */
    function mot(khoa, fn, laBatBuoc) {
      const g = (tt) => {
        if (daLam.has(khoa)) return;
        daLam.add(khoa);
        try { fn(tt || { T: 0, via: 'xong' }); } catch (e) { warn(khoa, e); }
      };
      if (laBatBuoc) batBuoc.push({ id: khoa, fn: g });
      return g;
    }
    const daXong = (khoa) => daLam.has(khoa);
    /** Khung cuoi: bu moi hieu ung bat buoc chua chay (phong khi) */
    function buDu() { for (const x of batBuoc) if (!daLam.has(x.id)) x.fn({ T: 0, via: 'xong' }); }
    let quanSat = null;
    function huy() {
      xaHang(true);
      ketThuc(cuaCanh);
      if (quanSat) { try { quanSat.disconnect(); } catch (e) {} quanSat = null; }
      if (boSong === bo) boSong = null;
    }
    /** Gan the (goc canh) vao bo: con tro + dong ghi */
    function ganThe(root) {
      gocEl = root;
      tro.goc = [...root.querySelectorAll('.sk-chu-tro')];
      ghiEl = root.querySelector('.sk-chu-ghi');
      if (W.ResizeObserver && !quanSat) {
        let h = null;
        try {
          quanSat = new ResizeObserver(() => { clearTimeout(h); h = setTimeout(() => { try { troDatLai(); } catch (e) {} }, 150); });
          quanSat.observe(root);
        } catch (e) { quanSat = null; }
      }
    }

    const bo = {
      chay, hien, doi, xep, xaHang, chan, moChan, giuHang, ngay, troToi, troKaraoke, ghi, ghiKanji, ghiXoa,
      mot, daXong, buDu, huy, ganThe, hen, bayGio, goi, co, giam, cuaCanh, khiXa, theDong,
      troHienTai: () => (tro.cur ? tro.cur.el : null),
    };
    boSong = bo;
    return bo;
  }

  function taoEsc(se) {
    return (s) => (se && typeof se.escapeHtml === 'function' ? se.escapeHtml(s) : escTho(s));
  }
  /** Boc cac doan chu Nhat trong chuoi Viet bang <span lang="ja"> (giong gp-formula) */
  function taoJpBoc(esc) {
    return (s) => esc(s).replace(/[\u3000-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff01-\uff60々]+/g, '<span lang="ja">$&</span>');
  }
  const idSt = (c, id) => (c && typeof c.idSt === 'function' ? c.idSt(id) : 'st-' + id);
  const camXuc = (se, muc) => {
    try { return se && typeof se.camXucAttr === 'function' ? se.camXucAttr(muc) : ''; } catch (e) { return ''; }
  };
  const donVi = (c, s) => {
    try { if (c && typeof c.donVi === 'function') return c.donVi(s) || 0; } catch (e) {}
    return kyTu(s).length;
  };
  const r0 = (c) => {
    try { if (c && typeof c.r === 'function') return c.r() || 0.15; } catch (e) {}
    return 0.15;
  };
  /** Thoi luong doc (ms) cho cue doc: tt.dur neu co, khong thi uoc tu so don vi */
  const thoiLuong = (c, tt, text) => kep(tt && tt.dur > 0 ? tt.dur : donVi(c, text) * r0(c) * 1200, 350, 3500);

  /**
   * The trinh chieu cua nhip. Goc canh = the (.sk-the): vo > trong > [than, ghi, con tro].
   * Hai lop boc (vo, trong) de dao dien chi thay MOT khoi khi cho the vao (mot chuyen dong).
   */
  // Con tro doc: 6 manh (dai ngang, dai doc, 4 tron goc) — hai goc luan phien (truot / mo-ra-hien)
  const TRO_HTML = '<i class="sk-chu-tro" aria-hidden="true" data-sk-tro=""><b class="sk-tro-dai"></b><b class="sk-tro-dai"></b>' +
    '<b class="sk-tro-tron"></b><b class="sk-tro-tron"></b><b class="sk-tro-tron"></b><b class="sk-tro-tron"></b></i>';
  function taoThe(kind, lop, than, thuocTinh) {
    const el = document.createElement('div');
    el.className = `sk-canh sk-canh-${kind} sk-chu sk-the${lop ? ' ' + lop : ''}`;
    el.setAttribute('data-sk-the', 'chu');
    el.innerHTML = `<div class="sk-chu-vo"${thuocTinh || ''}><div class="sk-chu-trong">` +
      `<div class="sk-chu-than">${than}</div>` +
      `<p class="sk-chu-ghi" data-co="0" aria-hidden="true"><span class="sk-chu-ghi-nhan">Sensei ghi</span><span class="sk-chu-ghi-chu"></span></p>` +
      TRO_HTML + TRO_HTML +
      `</div></div>`;
    return el;
  }

  /**
   * Cong cu goi trong luc canh song (§2.5, canh.congCu duoc thu truoc):
   *  write_on_board: ghi ngam vao lich su bang; trung noi dung tren the -> chi dua con tro
   *    toi dong do (khong lap chu); moi -> dong "Sensei ghi" o chan the (thay dong cu).
   *  highlight_element: dich nam trong the -> con tro toi do.
   *  write_kanji: chu khac chu cua canh chu Han -> o nho trong dong "Sensei ghi".
   *  clear_board: xoa bang + dong ghi.
   *  Con lai: null (dao dien xu ly).
   */
  function taoCongCu(c, b, root, o = {}) {
    // Luc cong cu (§1.5.5): T = max(bay gio, cuoi hang am thanh); hieu ung o T - LEAD
    const sauCongCu = (fn) => {
      let ms = 0;
      try {
        const nay = b.bayGio();
        const SM = W.SenseiMotion, ae = W.__audioEngine;
        const tuong = SM && typeof SM.trangThai === 'function' ? !!(SM.trangThai() || {}).wall : false;
        if (nay != null && !tuong && ae && ae.scheduledTime > nay) ms = (ae.scheduledTime - nay - LEAD) * 1000;
      } catch (e) {}
      if (ms > 16) b.hen(fn, Math.min(ms, 8000)); else fn();
    };
    const timTrung = (text) => {
      let tot = null, diem = 0;
      root.querySelectorAll('.sk-chu-noi').forEach((e) => {
        // data-noi: dang chuan de so (vd cau khong furigana), nhieu dang ngan bang "|"
        const ds = e.dataset.noi ? e.dataset.noi.split('|') : [e.textContent];
        for (const s of ds) {
          const d = laTrung(text, s);
          if (d > diem) { diem = d; tot = e; }
        }
      });
      return tot;
    };
    return function (name, args) {
      args = args || {};
      if (name === 'write_on_board') {
        const text = String(args.text == null ? '' : args.text).trim();
        const kieu = args.style || 'thuong';
        vietBangAn(text, kieu);
        if (!text) return { success: true };
        const trung = timTrung(text);
        sauCongCu(() => {
          if (!root.isConnected) return;
          if (trung) { if (!trung.closest('.sk-an')) b.troToi(trung); }
          else b.ghi(text, kieu);
        });
        return { success: true };
      }
      if (name === 'highlight_element') {
        const id = args.target_id;
        const el = id ? document.getElementById('st-' + id) : null;
        if (!el || !root.contains(el)) return null;
        sauCongCu(() => { if (el.isConnected && !el.closest('.sk-an')) b.troToi(el); });
        return { success: true, highlighted: id };
      }
      if (name === 'write_kanji') {
        const ch = String(args.character || '').trim();
        if (!ch || (o.chuHan && ch === o.chuHan)) return null;   // chu cua canh: cue K1 cua dao dien
        let coNet = false;
        try { coNet = !!(W.SenseiStrokes && W.SenseiStrokes.get(ch)); } catch (e) {}
        if (!coNet) return { success: false, error: 'chua co du lieu net cua chu ' + ch };
        sauCongCu(() => { if (root.isConnected) b.ghiKanji(ch); });
        return { success: true, wrote: ch };
      }
      if (name === 'clear_board') {
        try { const B = W.SenseiBoard; if (B && typeof B.xoaBang === 'function') B.xoaBang(); } catch (e) {}
        b.ghiXoa();
        return { success: true };
      }
      return null;
    };
  }

  /** Cue khop co khoa don 1 ky tu can rieng:true -> tach thanh cap (thuong + rieng) dung chung hieu ung */
  function capKhop(id, co, khoaJp, them) {
    const thuong = uniq(khoaJp.filter((k) => doDai(k) > 1));
    const rieng = uniq(khoaJp.filter((k) => doDai(k) === 1));
    const out = [];
    const vn = (them && them.vn) || [];
    out.push(Object.assign({}, co, { id, khi: Object.assign({ khop: { jp: thuong, vn } }, them && them.lan ? { lan: them.lan } : {}) }));
    if (rieng.length) {
      out.push(Object.assign({}, co, { id: id + 'r', khi: Object.assign({ khop: { jp: rieng, vn: [] }, rieng: true }, them && them.lan ? { lan: them.lan } : {}) }));
    }
    return out;
  }

  const DOC_TRO = { 'は': 'đọc: wa', 'へ': 'đọc: e', 'を': 'đọc: o' };
  // Khoa VN cho cach doc tro tu. Chu cai don "e"/"o" gan nhu khop moi cau tieng Viet
  // (em, ở, ông...) nen di kem cum dan "doc (la)".
  const READ = { 'は': ['wa', 'chu ha'], 'へ': ['doc la e', 'doc e'], 'を': ['wo', 'doc la o', 'doc o'], 'です': ['desu'] };
  const READ_VD = { 'は': ['wa'], 'へ': ['doc la e', 'doc thanh e'], 'を': ['wo', 'doc la o', 'doc thanh o'] };

  /* ======================================================================
     3. TU VUNG (§3.1)
     ====================================================================== */

  const LOAI_TU = {
    noun: 'Danh từ', verb: 'Động từ', 'adj-i': 'Tính từ -i', 'adj-na': 'Tính từ -na',
    particle: 'Trợ từ', adnominal: 'Đại từ chỉ định', counter: 'Lượng từ đếm',
    phrase: 'Thành ngữ / Câu', adjective: 'Tính từ', adverb: 'Phó từ', pronoun: 'Đại từ',
    expression: 'Cụm từ / Mẫu câu', determiner: 'Từ chỉ định',
  };

  function dungTuVung(beat, c) {
    const v = (beat && beat.data) || {};
    const se = c.se || {};
    const esc = taoEsc(se), jpBoc = taoJpBoc(esc);
    const b = taoBo(c);
    const tu = String(v.kanji || v.word || '');
    const coRuby = v.kanji && v.furigana && v.furigana !== v.kanji;
    // So "o chu" de chu lon tu co vua cot: furigana dai hon chu thi tinh theo furigana (.32em moi kana)
    const nChu = Math.max(2, doDai(v.kanji || v.word || ''), coRuby ? Math.ceil(doDai(v.furigana) * 0.34) : 0);
    const loai = LOAI_TU[v.wordType] || (v.wordType ? esc(v.wordType) : '');
    const meta = [v.romaji ? esc(v.romaji) : '', loai].filter(Boolean).join(' · ');

    let hinh = '';
    if (v.imageUrl) {
      hinh = `<div class="sk-tv-hinh" aria-hidden="true"><img src="${esc(v.imageUrl)}" alt="" onerror="this.style.visibility='hidden'" /></div>`;
    } else {
      let svg = null;
      try { svg = typeof se.artFor === 'function' ? se.artFor(v) : null; } catch (e) {}
      if (svg) hinh = `<div class="sk-tv-hinh" aria-hidden="true">${svg}</div>`;
    }

    const noiTu = uniq([v.kanji, v.word, coRuby ? v.kanji + v.furigana : '']).join('|');
    const dau = `
      <div class="sk-tv-dau" style="--sk-n:${nChu}">
        <span class="sk-tv-tu jp-serif sk-chu-noi" id="${esc(idSt(c, v.id))}" lang="ja" data-noi="${esc(noiTu)}">${coRuby ? rubyTu(se, v.kanji, v.furigana) : esc(v.word || v.kanji || '')}</span>
        ${meta ? `<div class="sk-tv-meta">${meta}</div>` : ''}
      </div>`;

    // Hang the tu dien (dong tu co "Thể từ điển: X"): hien CUNG meo (dang ます), duoi doi khi Sensei noi X
    const td = timTuDien(v);
    // Da co hang the tu dien -> meo bo cau "Thể từ điển: X." (noi mot lan)
    const meoChu = td ? boCauTuDien(v.accentNote) : String(v.accentNote || '').trim();
    const bien = td ? `
      <div class="sk-tv-bien sk-chu-noi" data-noi="${esc(uniq([td.D, td.masu]).join('|'))}">
        <span class="sk-tv-bien-tu" lang="ja"><span class="sk-tv-goc">${esc(td.goc)}</span><span class="sk-chu-cuon"><span class="sk-tv-duoi is-dang">${esc(td.duoiMasu)}</span><span class="sk-tv-duoi sk-chu-tat">${esc(td.duoiD)}</span></span></span>
        <span class="sk-chu-cuon sk-tv-bien-nhan"><span class="is-dang">thể <span lang="ja">ます</span></span><span class="sk-chu-tat">thể từ điển</span></span>
      </div>` : '';
    const meo = meoChu ? `<p class="sk-tv-meo sk-chu-noi" data-noi="${esc(uniq([meoChu, v.accentNote]).join('|'))}">${jpBoc(meoChu)}</p>` : '';
    // Meo + hang the tu dien = MOT khoi dong phu (mot lan hien, mot hoat anh)
    const phu = meo || bien ? `<div class="sk-tv-phu sk-an">${meo}${bien}</div>` : '';
    const phai = `
        <div class="sk-tv-nghia sk-chu-noi">${esc(v.meaningVi || '')}</div>
        ${phu}`;
    // Khong hinh: MOT cot (chu lon, cach doc, nghia, meo) — khong de nua the trong, mat khong nhay trai / phai
    const than = hinh
      ? `<div class="sk-tv-luoi co-hinh"><div class="sk-tv-trai" data-sk-cot="trai">${hinh}</div><div class="sk-tv-phai" data-sk-cot="phai">${dau}${phai}</div></div>`
      : `<div class="sk-tv-luoi khong-hinh"><div class="sk-tv-phai" data-sk-cot="phai">${dau}${phai}</div></div>`;

    const el = taoThe('vocab', hinh ? 'co-hinh' : 'khong-hinh', than, camXuc(se, v));
    b.ganThe(el);
    const q = (s) => el.querySelector(s);
    const dauEl = q('.sk-tv-dau');
    const tuEl = q('.sk-tv-tu');
    const nghiaEl = q('.sk-tv-nghia');
    const phuEl = q('.sk-tv-phu');
    const meoEl = q('.sk-tv-meo');
    const bienEl = q('.sk-tv-bien');
    const duoi = [...el.querySelectorAll('.sk-tv-bien-tu .sk-tv-duoi')];
    const nhanBien = [...el.querySelectorAll('.sk-tv-bien-nhan > span')];

    const khoaDoc = { jp: uniq([v.kanji, v.word, v.furigana]), vn: uniq([v.romaji]) };
    const veChu = () => b.troToi(tuEl || dauEl, { px: 14, py: 6 });
    const docLai = b.mot('V2', veChu);

    const cues = [
      // V0: Sensei bat dau noi -> con tro dat len chu (chu de cua ca nhip)
      { id: 'V0', loai: 'nhan', khi: { dauTien: true }, lam: b.mot('V0', veChu) },
      { id: 'V1', loai: 'doc', khi: { khop: khoaDoc, lan: 1 }, lam: b.mot('V1', veChu) },
      // lan dem tu con tro cua `sau` (cuoi khop V1) -> lan 1 = lan doc thu hai (lan 2 se nhay sang lan thu ba)
      { id: 'V2', loai: 'doc', khi: { khop: khoaDoc, lan: 1 }, sau: 'V1', lam: docLai },
      // du phong V2: 1.8 s sau V1 (chi khi V1 da khop) neu lan doc 2 khong nghe ra
      { id: 'V2b', loai: 'doc', khi: { sauCue: 'V1', ms: 1800, neuVia: 'khop' }, lam: docLai },
      // Nghia la noi dung nhan dien (co san khi the vao) -> chi con tro toi khi Sensei noi nghia
      { id: 'V3', loai: 'nhan', khi: { khop: { vn: uniq([...NGHIA, ...vn3(v.meaningVi)]) } }, sau: 'V1',
        lam: b.mot('V3', () => b.troToi(nghiaEl)) },
    ];

    // Khoi dong phu (meo + hang the tu dien): hien mot lan; doi duoi (trinh dien) KHONG xep hang,
    // dang ます hien >= 1.2 s truoc khi doi; het nhip -> khung cuoi du (hien + doi ngay)
    const st = { phuLuc: null, muonDoi: false, daDoi: false, henD: null };
    const coBien = !!(td && bienEl && duoi.length === 2);
    const doiDuoi = () => {
      if (st.daDoi || !coBien) return;
      st.daDoi = true;
      b.ngay(() => {
        b.doi(duoi[0], duoi[1]);
        if (nhanBien.length === 2) b.doi(nhanBien[0], nhanBien[1], { tinh: true });
        b.troToi(bienEl, { ngay: true });
      });
    };
    const henDoi = () => {
      if (st.daDoi || st.henD != null || st.phuLuc == null) return;
      const con = st.phuLuc + GIU_NGUON - performance.now();
      if (con <= 16) doiDuoi();
      else st.henD = b.hen(() => { st.henD = null; doiDuoi(); }, con);
    };
    const hienPhu = () => {
      if (!phuEl || st.phuLuc != null) return;
      b.hien(phuEl);
      st.phuLuc = performance.now();
      b.troToi(meoEl || bienEl || phuEl, { ngay: true });
      if (st.muonDoi) henDoi();
    };
    b.khiXa(() => { if (phuEl && st.phuLuc == null) { phuEl.classList.remove('sk-an'); phuEl.classList.add('is-hien'); st.phuLuc = 0; } if (st.muonDoi || coBien) doiDuoi(); });

    if (meoEl) {
      cues.push({ id: 'V4', loai: 'hien',
        khi: { khop: { vn: uniq([...MEO, 'trong am', 'doc bang', 'luu y', ...vn3(meoChu)]) } },
        sau: 'V3', tiLe: 0.6,
        lam: b.mot('V4', (tt) => b.xep(hienPhu, tt), true) });
    }
    if (coBien) {
      cues.push({ id: 'V5', loai: 'hien', khi: { khop: { jp: [td.D], vn: ['the tu dien'] } }, sau: 'V1', tiLe: 0.7,
        lam: b.mot('V5', (tt) => {
          st.muonDoi = true;
          if (tt && (tt.via === 'nen' || tt.via === 'xong')) { b.xep(hienPhu, tt); doiDuoi(); return; }
          if (st.phuLuc != null) { henDoi(); return; }
          // Khong co meo (V4): khoi phu hien o day; co meo: V4 (dung truoc theo thu tu noi dung) se hien no
          if (!meoEl) b.xep(hienPhu, tt);
        }, true) });
    }

    const canh = {
      el, cues, heroEl: tuEl || dauEl,
      sr: `${beat.label || 'Từ vựng'}: ${tu}`,
      xong() { b.buDu(); b.xaHang(false); },
      giu() { b.xaHang(true); return null; },
      huy() { b.huy(); },
      _chu: { kind: 'vocab' },
    };
    canh.congCu = taoCongCu(c, b, el);
    return canh;
  }

  /* ======================================================================
     4. CHU HAN (§3.2)
     ====================================================================== */

  function dungChuHan(beat, c) {
    const k = (beat && beat.data) || {};
    const se = c.se || {};
    const esc = taoEsc(se);
    const b = taoBo(c);
    const ch = String(k.character || '').trim();
    let net = null, goc = null;
    try { net = W.SenseiStrokes && W.SenseiStrokes.get(ch); } catch (e) {}
    try { goc = W.SenseiArt && typeof W.SenseiArt.kanji === 'function' ? W.SenseiArt.kanji(ch) : null; } catch (e) {}
    const hv = String(k.hanViet || '').split(/[\/,;]/)[0].trim();
    const hvN = vnNorm(hv);
    const on = (k.onyomi || []).filter(Boolean);
    const kun = (k.kunyomi || []).filter(Boolean);
    const cw = (k.commonWords || []).slice(0, 3);
    const thanhPhan = goc ? uniq([...String(goc.note || '').matchAll(/[(（]\s*([\u4e00-\u9fff々]+)/g)].map((m) => m[1])) : [];

    const ke = '<svg class="sk-kj-ke" viewBox="0 0 100 100" aria-hidden="true" preserveAspectRatio="none">' +
      '<line x1="50" y1="0" x2="50" y2="100"/><line x1="0" y1="50" x2="100" y2="50"/>' +
      '<line x1="0" y1="0" x2="100" y2="100"/><line x1="100" y1="0" x2="0" y2="100"/></svg>';
    const docDong = (ds) => ds.map((x) => `<span class="sk-kj-gt">${esc(x)}</span>`).join('<span class="sk-kj-phay">、</span>');
    const toChu = (w) => esc(w).split(esc(ch)).join(`<span class="sk-kj-cho">${esc(ch)}</span>`);

    const coGoc = !!(goc && (goc.svg || thanhPhan.length));
    const gocHtml = coGoc ? `
          <div class="sk-kj-goc sk-an sk-phu-bo sk-chu-noi">
            ${goc.svg ? `<div class="sk-kj-hinh" aria-hidden="true">${goc.svg}</div>` : ''}
            ${thanhPhan.length ? `<div class="sk-kj-ghep" lang="ja">${thanhPhan.map((p, i) =>
              `${i ? '<span class="sk-kj-cong">+</span>' : ''}<span class="sk-kj-tp">${esc(p)}</span>`).join('')}<span class="sk-kj-mui">→</span><span class="sk-kj-kq">${esc(ch)}</span></div>` : ''}
          </div>` : '';

    const than = `
      <div class="sk-kj-luoi">
        <div class="sk-kj-trai" data-sk-cot="trai">
          <div class="sk-kj-o" id="${esc(idSt(c, k.id))}">
            ${ke}
            <span class="sk-kj-chu jp-serif${net ? ' is-bong' : ''}" lang="ja" aria-hidden="true">${esc(ch)}</span>
          </div>${gocHtml}
        </div>
        <div class="sk-kj-phai" data-sk-cot="phai">
          <div class="sk-kj-dinh">
            <div class="sk-kj-dau sk-chu-noi"><span class="sk-kj-hv">${esc(hv)}</span><span class="sk-kj-sonet"> · ${esc(String(k.strokeCount == null ? '?' : k.strokeCount))} nét</span></div>
            <div class="sk-kj-nghia sk-chu-noi">${esc(k.meaningVi || '')}</div>
          </div>
          <dl class="sk-kj-doc">
            <div class="sk-kj-dong${on.length ? ' sk-an' : ''}"><dt>Âm On</dt><dd lang="ja" class="sk-chu-noi">${on.length ? docDong(on) : '—'}</dd></div>
            <div class="sk-kj-dong${kun.length ? ' sk-an' : ''}"><dt>Âm Kun</dt><dd lang="ja" class="sk-chu-noi">${kun.length ? docDong(kun) : '—'}</dd></div>
          </dl>
          ${cw.length ? `<ul class="sk-kj-tu">${cw.map((w, i) => `
            <li class="sk-kj-tu-dong sk-an sk-chu-noi${i === 2 ? ' sk-kj-tu-3' : ''}">
              <span class="sk-kj-tu-w" lang="ja">${toChu(w.word || '')}</span>
              ${w.furigana ? `<span class="sk-kj-tu-r" lang="ja">${esc(w.furigana)}</span>` : '<span></span>'}
              <span class="sk-kj-tu-m${i === 2 ? ' sk-phu-bo' : ''}">${esc(w.meaningVi || '')}</span>
            </li>`).join('')}
          </ul>` : ''}
        </div>
      </div>`;

    const el = taoThe('kanji', net ? 'co-net' : 'khong-net', than, camXuc(se, k));
    b.ganThe(el);
    const q = (s) => el.querySelector(s);
    const oEl = q('.sk-kj-o');
    const heroEl = oEl;
    const chuEl = q('.sk-kj-chu');
    const hvEl = q('.sk-kj-dau');
    const nghiaEl = q('.sk-kj-nghia');
    const dongs = [...el.querySelectorAll('.sk-kj-dong')];
    const tuDongs = [...el.querySelectorAll('.sk-kj-tu-dong')];
    const gocEl = q('.sk-kj-goc');

    let daChi = false;
    const chi = (x) => { if (daChi || !x) return; daChi = true; try { c.chiVao(x); } catch (e) {} };

    let daVe = false;
    function veNet() {
      if (daVe) return;
      daVe = true;
      const B = W.SenseiBoard;
      if (!oEl || !B || typeof B.vietChuHan !== 'function') return;
      oEl.querySelectorAll('.bang-kanji').forEach((x) => x.remove());
      const n = (net && net.length) || 1;
      const tocDo = b.giam ? 0.01 : kep(4.5 / n, 0.25, 0.55);
      let ok = false;
      try { ok = B.vietChuHan(ch, { noi: oEl, tocDo }); } catch (e) { warn('vietChuHan', e); }
      if (!ok) return;
      oEl.classList.add('is-ve');
      // bong chu tat ngay khi net dau bat dau (khong them hoat anh chay cung luc voi net viet — A3)
      if (chuEl) chuEl.classList.add('is-tat');
      chi(oEl);
    }

    // K0: Sensei bat dau noi -> con tro dat len dong Han Viet (ten chu)
    const cues = [{ id: 'K0', loai: 'nhan', khi: { dauTien: true }, lam: b.mot('K0', () => b.troToi(hvEl)) }];
    // Ten chu duoc goi ("Chữ 私, Hán Việt là TƯ"): cac bien the hay noi
    const khoaHv = hvN ? uniq(['han viet ' + hvN, 'han viet la ' + hvN, 'am han viet ' + hvN, 'am han viet la ' + hvN, 'chu ' + hvN]) : [];
    // MOC (duyet r4): lan goi ten chu dau nhip. Cac dong doc / tu ghep chi tim khop SAU moc -> khong khop nham
    // vao cau mo dau (tu ghep = dung chu 私 khop "Chữ 私, …"; romaji ビ "bi" khop "Hán Việt là BỊ").
    // Luon ban (lam, du phong tiLe): co net -> chinh la cue ve net K1b; khong net -> cue moc khong hieu ung.
    const MOC = net ? 'K1b' : 'K1m';
    if (net) {
      // K1: net viet luc Sensei goi write_kanji; du phong: nghe thay chu (+400 ms), roi toi tiLe
      cues.push({ id: 'K1', loai: 'lam', docLap: true, khi: { congCu: 'write_kanji' }, tiLe: 0.12,
        lam: b.mot('K1c', () => veNet(), true) });
      cues.push({ id: 'K1b', loai: 'lam', docLap: true,
        khi: { khop: { jp: [ch], vn: khoaHv } }, tiLe: 0.12,
        lam: (tt) => { if (tt && tt.via === 'khop') b.hen(veNet, 400); else veNet(); } });
    } else {
      cues.push({ id: 'K1m', loai: 'lam', docLap: true, khi: { khop: { jp: [ch], vn: khoaHv } }, tiLe: 0.1, lam: () => {} });
    }
    if (hvN) {
      cues.push({ id: 'K2', loai: 'nhan',
        khi: { khop: { vn: uniq([...khoaHv, 'am ' + hvN, 'nghia la ' + hvN]) } },
        lam: b.mot('K2', () => b.troToi(hvEl)) });
    }
    // Nghia cua chu: khoa rieng cua nghia (vn3); "nghĩa là" tran thi lan sang nghia tu ghep -> chi khi nghia qua ngan
    const tu1 = vnNorm(k.meaningVi).split(' ').filter(Boolean)[0];
    const khoaNghia = vn3(k.meaningVi).length ? vn3(k.meaningVi) : (tu1 ? NGHIA.map((x) => x + ' ' + tu1) : []);
    cues.push({ id: 'K3', loai: 'nhan', khi: { khop: { vn: khoaNghia } }, sau: MOC,
      lam: b.mot('K3', () => b.troToi(nghiaEl)) });
    if (gocEl) {
      cues.push({ id: 'K4', loai: 'hien',
        khi: { khop: { jp: thanhPhan, vn: ['chiet tu', 'cau tao', 'gom co', 'ghep tu'] } }, sau: MOC, tiLe: 0.4,
        // Mot chuyen dong cho ca khoi chiet tu (hinh + chip): khong ve net hinh (hu.ve = moi duong mot
        // hoat anh, chong len luc net chu dang viet -> qua 2 hoat anh trong the, A3)
        lam: b.mot('K4', (tt) => b.xep(() => {
          b.hien(gocEl);
          b.troToi(gocEl, { ngay: true });
        }, tt), true) });
    }
    // Chuoi (duyet r4): MOC -> On -> Kun -> tu ghep 1 -> 2 -> 3: moi dong chi tim sau dong truoc
    // (tham chieu chua khop thi cho; da ban du phong thi tim tu cho dang noi luc do).
    // Khoa VN chi la cum dan ("âm On", "onyomi"): romaji tran (vd "bi") trung ten Han Viet / chu Viet.
    const hira = (x) => Array.from(String(x || '').normalize('NFKC'))
      .map((c0) => { const n = c0.codePointAt(0); return n >= 0x30a1 && n <= 0x30f6 ? String.fromCodePoint(n - 0x60) : c0; }).join('');
    const boNgoac = (x) => String(x).replace(/[(（][^)）]*[)）]/g, '').replace(/[.\-‐–．]/g, '').trim();
    const docKun = (x) => String(x).replace(/[()（）.\-‐–．]/g, '').trim();
    let truoc = MOC;
    if (on.length) {
      const jp = uniq(on.map(boNgoac));
      cues.push({ id: 'K5', loai: 'hien', khi: { khop: { jp, vn: ['am on', 'onyomi', 'on yomi'] }, rieng: jp.some((x) => doDai(x) <= 2) },
        sau: truoc, tiLe: 0.5,
        lam: b.mot('K5', (tt) => b.xep(() => { b.hien(dongs[0]); b.troToi(dongs[0].querySelector('dd'), { ngay: true }); }, tt), true) });
      truoc = 'K5';
    }
    if (kun.length) {
      // Kun: "し(る)" / "た.べる" -> bo dau cham, giu okurigana: しる / たべる
      const jp = uniq(kun.map(docKun));
      cues.push({ id: 'K6', loai: 'hien', khi: { khop: { jp, vn: ['am kun', 'kunyomi', 'kun yomi'] }, rieng: jp.some((x) => doDai(x) <= 2) },
        sau: truoc, tiLe: 0.6,
        lam: b.mot('K6', (tt) => b.xep(() => { b.hien(dongs[1]); b.troToi(dongs[1].querySelector('dd'), { ngay: true }); }, tt), true) });
      truoc = 'K6';
    }
    // Tu ghep: bo khoa = dung chu (私) va khoa trung mot cach doc On / Kun (わたし = Kun cua 私: noi luc doc Kun);
    // tu ghep dau them cum dan "từ ghép"
    const cachDoc = new Set([...on.map(boNgoac), ...kun.map(docKun)].map(hira));
    tuDongs.forEach((li, i) => {
      const w = cw[i] || {};
      const jp = uniq([w.word, w.furigana]).filter((x) => x !== ch && doDai(x) >= 2 && !cachDoc.has(hira(x)));
      cues.push({ id: 'K7.' + i, loai: 'hien', khi: { khop: { jp, vn: i === 0 ? ['tu ghep'] : [] } }, sau: truoc, tiLe: 0.68 + 0.08 * i,
        lam: b.mot('K7.' + i, (tt) => b.xep(() => { b.hien(li); b.troToi(li, { ngay: true, px: 10, py: 2 }); }, tt), true) });
      truoc = 'K7.' + i;
    });

    const canh = {
      el, cues, heroEl,
      sr: `${beat.label || 'Chữ Hán'}: ${ch} — ${hv}`,
      xong() { b.buDu(); b.xaHang(false); },
      giu() { b.xaHang(true); return null; },
      huy() { b.huy(); },
      _chu: { kind: 'kanji' },
    };
    canh.congCu = taoCongCu(c, b, el, { chuHan: ch });
    return canh;
  }

  /* ======================================================================
     5. MAU NGU PHAP (§3.3) + hang cong thuc dung chung voi vi du
     ====================================================================== */

  /**
   * Hang cong thuc: o bien (khung net dut + chu thich duoi) va chip chu (+ chu thich cach doc
   * tro tu duoi chip), ngan bang "+". Moi phan tu la mot cot [hop][chu thich] canh dinh.
   * "+" dinh vao CUOI phan tu dung truoc (khoi khong ngat): hang xuong dong thi "+" o cuoi dong tren,
   * dong duoi khong bao gio mo dau bang "+".
   * o: { mau: hang mau cua vi du, dien: {ei: [html token]}, duoi: [html], docEi: Set ei co chu thich doc }
   */
  const DAU_CONG = '<span class="sk-np-dau" aria-hidden="true">+</span>';
  /** Chu thich o: toi da 32 ky tu (<= 2 dong o 16ch), dai hon thi cat + day du trong title */
  const chuThich = (esc, s) => {
    const x = String(s || '');
    if (doDai(x) <= 32) return { chu: esc(x), title: '' };
    return { chu: esc(kyTu(x).slice(0, 30).join('').trim()) + '…', title: ` title="${esc(x)}"` };
  };
  function veHang(ch, esc, o = {}) {
    const muc = [];
    let piTruoc = null;
    ch.phan.forEach((e, ei) => {
      let h = '';
      if (piTruoc !== null && e.pi !== piTruoc && muc.length) muc[muc.length - 1] += DAU_CONG;
      piTruoc = e.pi;
      if (e.loai === 'o') {
        const d = o.dien && o.dien[ei];
        const ct = chuThich(esc, e.chu);
        h += `<span class="sk-np-o${d ? ' co-dien' : ''}" data-ei="${ei}">` +
          `<span class="sk-np-o-khung"><span class="sk-np-o-nhan">${esc(nhanO(e.nhan))}</span>` +
          (d ? `<span class="sk-np-o-dien" lang="ja" aria-hidden="true">${d.map((x) => `<span class="sk-vd-dien sk-an">${x}</span>`).join('')}</span>` : '') +
          `</span><span class="sk-np-chu-thich"${ct.title}>${ct.chu}</span></span>`;
      } else {
        const tro = /^(は|へ|を|です)$/.test(e.chu);
        const doc = DOC_TRO[e.chu] && (!o.docEi || o.docEi.has(ei)) ? DOC_TRO[e.chu] : '';
        h += `<span class="sk-np-lit" data-ei="${ei}"><span class="sk-np-chip${tro ? ' is-tro' : ''}" lang="ja">${esc(e.chu)}</span>` +
          `<span class="sk-np-chu-thich sk-np-doc${doc ? ' sk-an' : ''}">${esc(doc)}</span></span>`;
      }
      muc.push(h);
    });
    if (ch.len && muc.length) muc[muc.length - 1] += '<span class="sk-np-len" aria-hidden="true">↗</span>';
    if (o.duoi && o.duoi.length) {
      muc.push(`<span class="sk-vd-duoi" lang="ja" aria-hidden="true">${o.duoi.map((x) => `<span class="sk-vd-dien sk-an">${x}</span>`).join('')}</span>`);
    }
    // data-noi: cong thuc goc (ghi bang trung cong thuc -> con tro toi hang, khong lap chu o chan the)
    return `<div class="sk-np-hang${o.mau ? ' is-mau' : ''} sk-chu-noi" data-noi="${esc(uniq([o.noi, ch.goc]).join('|'))}">${muc.map((h) => `<span class="sk-np-muc">${h}</span>`).join('')}</div>`;
  }

  /**
   * Cong thuc dang VIEN tinh (khong o trong): cong thuc khong tach duoc, hoac hang mau cua vi du SO DO
   * (cau khong ghep vua mau -> khong hua "o se duoc dien"). Moi doan chu Nhat boc .sk-np-jp.
   */
  function veVien(text, esc, noi) {
    return `<div class="sk-np-vien sk-chu-noi" data-noi="${esc(uniq([noi, text]).join('|'))}">${esc(text).replace(/[぀-ヿ一-鿿々ー〜]+/g, '<span class="sk-np-jp" lang="ja">$&</span>')}</div>`;
  }

  /**
   * Bien hinh: hang trinh dien = chuoi dang lon dan sang phai. Dang 0 co san khi the vao; buoc k: dang
   * k-1 mo lai thanh VET (van doc duoc, "Vる →"), "→ dang k" truot vao ben phai — khung cuoi doc
   * "Vう/つ/る → Vって" giong cac hang phu. Moi dang co nhan dang ngay duoi no. Da dan san (khong day).
   * Hang phu (<= 2) = chuoi day du, tinh.
   */
  function veBien(rows, esc) {
    const gocHtml = (r) => (r.goc ? `<span class="sk-np-goc">${esc(r.goc)}</span>` : '<span class="sk-np-goc is-v">V</span>');
    const demo = rows[0];
    const coNhan = demo.nhan && demo.nhan.some(Boolean);
    const cot = (k) => `<span class="sk-np-bh-cot" data-k="${k}"><span class="sk-np-bh-dang" lang="ja">${gocHtml(demo)}` +
      `<span class="sk-np-duoi">${esc(demo.duoi[k] || '∅')}</span></span>` +
      (coNhan ? `<span class="sk-np-bh-nhan">${esc(demo.nhan[k] || '')}</span>` : '') + '</span>';
    const demoHtml = `<div class="sk-np-bien-demo sk-chu-noi" data-noi="${esc(demo.dang.join('|'))}">` +
      demo.dang.map((w, k) => (k === 0 ? cot(0)
        : `<span class="sk-np-bh-buoc sk-an" data-k="${k}"><span class="sk-np-bh-mui" aria-hidden="true">→</span>${cot(k)}</span>`)).join('') +
      '</div>';
    // Hang phu la vi du doi chieu tinh (thuoc khung cong thuc, co san khi the vao)
    const phu = rows.slice(1).map((r) => `<div class="sk-np-bien-hang is-phu" lang="ja">${r.dang.map((w, k) =>
      `${k ? `<span class="sk-np-mui" data-k="${k}">→</span>` : ''}<span class="sk-np-dang" data-k="${k}">` +
      `${gocHtml(r)}${esc(r.duoi[k])}</span>`).join('')}</div>`).join('');
    return `<div class="sk-np-bien">${demoHtml}${phu ? `<div class="sk-np-bien-phu">${phu}</div>` : ''}</div>`;
  }

  function dungMauCau(beat, c) {
    const sl = (beat && beat.data) || {};
    const se = c.se || {};
    const esc = taoEsc(se), jpBoc = taoJpBoc(esc);
    const b = taoBo(c);
    const lesson = (c.ctx && c.ctx.bai) || null;
    const ch = tachCongThuc(sl.grammarFormula);
    const rows = timBienHinh(sl, lesson);
    const cau = tachCau(sl.explanation, 3);

    let cong = '';
    let kieuCong = 'khong';
    if (rows.length) { cong = veBien(rows, esc); kieuCong = 'bien'; }
    else if (ch) { cong = veHang(ch, esc, { noi: sl.grammarFormula }); kieuCong = 'hang'; }
    else if (sl.grammarFormula) { cong = veVien(sl.grammarFormula, esc); kieuCong = 'vien'; }
    const coGhi = !!(sl.teacherTips || sl.culturalNotes);

    const than = `
      <div class="sk-np-luoi${coGhi ? ' co-ghi' : ''}">
        <h3 class="sk-np-ten sk-chu-noi">${jpBoc(sl.title || 'Mẫu câu')}</h3>
        <div class="sk-np-cong">${cong}</div>
        <div class="sk-np-duoi-the">
          ${cau.length ? `<div class="sk-np-giai" data-sk-cot="giai">${cau.map((s, i) => `<p class="sk-np-cau sk-an sk-cho-doc sk-chu-noi" data-s="${i}"><span class="sk-cho-chu">${jpBoc(s)}</span></p>`).join('')}</div>` : ''}
          ${coGhi ? `<div class="sk-np-ghi" data-sk-cot="ghi">
            ${sl.teacherTips ? `<p class="sk-np-meo sk-an sk-cho-doc sk-chu-noi${c.kho === 'thap' ? ' sk-phu-bo' : ''}"><span class="sk-np-nhan-ghi">Lưu ý</span><span class="sk-cho-chu">${jpBoc(sl.teacherTips)}</span></p>` : ''}
            ${sl.culturalNotes ? `<p class="sk-np-vh sk-an sk-cho-doc sk-chu-noi sk-phu-bo"><span class="sk-np-nhan-ghi">Văn hoá</span><span class="sk-cho-chu">${jpBoc(sl.culturalNotes)}</span></p>` : ''}
          </div>` : ''}
        </div>
      </div>`;

    const el = taoThe('grammar-intro', 'is-' + kieuCong, than);
    b.ganThe(el);
    const q = (s) => el.querySelector(s);
    const congEl = q('.sk-np-cong');
    const hangEl = q('.sk-np-hang');
    const cauEls = [...el.querySelectorAll('.sk-np-cau')];
    const meoEl = q('.sk-np-meo'), vhEl = q('.sk-np-vh');

    // G0: Sensei bat dau noi ("Mẫu câu: ...") -> con tro dat len tieu de
    const tenEl = q('.sk-np-ten');
    const cues = [{ id: 'G0', loai: 'nhan', khi: { dauTien: true }, lam: b.mot('G0', () => b.troToi(tenEl, { px: 10, py: 4 })) }];
    if (kieuCong === 'hang') {
      let jLit = 0;
      ch.phan.forEach((e, ei) => {
        if (e.loai !== 'chu') return;
        const lit = el.querySelector(`.sk-np-lit[data-ei="${ei}"]`);
        const chip = lit && lit.querySelector('.sk-np-chip');
        const docEl = lit && lit.querySelector('.sk-np-doc.sk-an');
        const j = jLit++;
        const khoa = { khop: { jp: [e.chu], vn: READ[e.chu] || [] }, rieng: doDai(e.chu) === 1 };
        cues.push({ id: 'G2.' + j, loai: 'nhan', khi: khoa,
          lam: b.mot('G2.' + j, () => { b.troToi(chip, { px: 6, py: 6 }); if (j === 0) { try { c.chiVao(chip); } catch (x) {} } }) });
        if (docEl) {
          cues.push({ id: 'G2c.' + j, loai: 'hien', khi: khoa, tiLe: 0.25,
            lam: b.mot('G2c.' + j, (tt) => b.xep(() => { b.hien(docEl); b.troToi(chip, { ngay: true, px: 6, py: 6 }); }, tt), true) });
        }
      });
      let jO = 0;
      ch.phan.forEach((e, ei) => {
        if (e.loai !== 'o') return;
        const oEl = el.querySelector(`.sk-np-o[data-ei="${ei}"] .sk-np-o-khung`);
        const j = jO++;
        const nh = vnNorm(nhanO(e.nhan));
        const vn = uniq([
          ...(nh.replace(/ /g, '').length >= 2 ? [nh, nh.replace(/([a-z])(\d)/, '$1 $2')] : []),
          ...({ N: ['danh tu'], V: ['dong tu'], A: ['tinh tu'] }[String(e.nhan)[0]] || []),
          ...vn3(e.chu),
        ]);
        if (!vn.length || !oEl) return;
        cues.push({ id: 'G3.' + j, loai: 'nhan', khi: { khop: { vn } },
          lam: b.mot('G3.' + j, () => b.troToi(oEl, { px: 6, py: 6 })) });
      });
    } else if (kieuCong === 'vien') {
      // Cong thuc khong tach duoc: tung doan chu Nhat trong vien van duoc con tro chi toi khi doc
      [...el.querySelectorAll('.sk-np-jp')].slice(0, 4).forEach((x, j) => {
        const t = x.textContent.replace(/〜/g, '');
        if (!t) return;
        cues.push({ id: 'G2p.' + j, loai: 'nhan', khi: { khop: { jp: [t] }, rieng: doDai(t) === 1 },
          lam: b.mot('G2p.' + j, () => b.troToi(x, { px: 4, py: 2 })) });
      });
    } else if (kieuCong === 'bien') {
      const demo = rows[0];
      const n = demo.dang.length - 1;
      const demoEl = q('.sk-np-bien-demo');
      const cotDs = [...el.querySelectorAll('.sk-np-bien-demo .sk-np-bh-cot')];     // dang 0..n
      const buocDs = [...el.querySelectorAll('.sk-np-bien-demo .sk-np-bh-buoc')];   // "→ dang k", k = 1..n
      // Trinh dien (khong xep sau dong phu): buoc sau cach buoc truoc >= 700 ms (moi buoc doc duoc);
      // het nhip / roi canh -> moi buoc con cho lam ngay (khung cuoi du)
      const gm = { luc: -1e9, cho: [] };
      const lamBuoc = (k) => {
        const cu = cotDs[k - 1], moi = buocDs[k - 1];
        // dang truoc mo thanh vet (160 ms) roi "→ dang k" truot vao (260 ms): moi luc mot hoat anh
        if (cu && !cu.classList.contains('is-qua')) {
          cu.classList.add('is-qua');
          if (!b.theDong()) b.chay(cu, [{ opacity: 1, offset: 0 }], { dur: 160, easing: E_IN });
        }
        if (moi && moi.classList.contains('sk-an')) {
          moi.classList.remove('sk-an'); moi.classList.add('is-hien');
          if (!b.theDong()) b.chay(moi, [{ opacity: 0, translate: '0 .35em', offset: 0 }], { dur: 260, tre: 160 });
        }
        b.troToi(demoEl, { ngay: true, px: 12, py: 6 });
      };
      b.khiXa(() => { while (gm.cho.length) lamBuoc(gm.cho.shift()); });
      for (let kk = 1; kk <= n; kk++) {
        const k2 = kk;
        // Buoc k: dang k-1 thanh vet, "→ dang k" vao; con tro dung tren hang trinh dien
        const lam = b.mot('GM.' + k2, (tt) => {
          if (tt && (tt.via === 'nen' || tt.via === 'xong')) { gm.cho = gm.cho.filter((x) => x !== k2); lamBuoc(k2); return; }
          const luc = Math.max(performance.now(), gm.luc + 700);
          gm.luc = luc;
          const con = luc - performance.now();
          if (con <= 16) { b.ngay(() => lamBuoc(k2)); return; }
          gm.cho.push(k2);
          b.hen(() => {
            if (!gm.cho.includes(k2)) return;
            gm.cho = gm.cho.filter((x) => x !== k2);
            b.ngay(() => lamBuoc(k2));
          }, con);
        }, true);
        const khoaJp = uniq([demo.dang[k2], demo.duoi[k2]]);
        capKhop('GM.' + k2, { loai: 'hien', tiLe: 0.2 + 0.5 * k2 / n, lam }, khoaJp).forEach((cu) => {
          if (k2 > 1) cu.sau = 'GM.' + (k2 - 1);
          cues.push(cu);
        });
      }
    }
    cauEls.forEach((p, s) => {
      cues.push({ id: 'G4.' + s, loai: 'hien', khi: { khop: { vn: vn3(cau[s]) } }, tiLe: 0.15 + 0.45 * s / cau.length,
        lam: b.mot('G4.' + s, (tt) => b.xep(() => { b.hien(p); b.troToi(p, { ngay: true, px: 12, py: 4 }); }, tt), true) });
    });
    if (meoEl) {
      cues.push({ id: 'G5', loai: 'hien', khi: { khop: { vn: uniq([...LUU_Y, ...MEO, 'sai', ...vn3(sl.teacherTips)]) } }, tiLe: 0.7,
        lam: b.mot('G5', (tt) => b.xep(() => { b.hien(meoEl); b.troToi(meoEl, { ngay: true, px: 12, py: 6 }); }, tt), true) });
    }
    if (vhEl) {
      cues.push({ id: 'G6', loai: 'hien', khi: { khop: { vn: uniq([...VAN_HOA, ...vn3(sl.culturalNotes)]) } }, tiLe: 0.85,
        lam: b.mot('G6', (tt) => b.xep(() => { b.hien(vhEl); b.troToi(vhEl, { ngay: true, px: 12, py: 6 }); }, tt), true) });
    }

    const canh = {
      el, cues, heroEl: congEl,
      sr: beat.label || 'Ngữ pháp',
      giu(beatTiep) {
        b.xaHang(true);
        if (hangEl && ch && beatTiep && beatTiep.kind === 'example' && beatTiep.subIndex === beat.subIndex) return [hangEl];
        return null;
      },
      xong() { b.buDu(); b.xaHang(false); },
      huy() { b.huy(); },
      _chu: { kind: 'grammar-intro', subIndex: beat.subIndex, hangEl },
    };
    canh.congCu = taoCongCu(c, b, el);
    return canh;
  }

  /* ======================================================================
     6. CAU VI DU (§3.4)
     ====================================================================== */

  function dungViDu(beat, c) {
    const ex = (beat && beat.data) || {};
    const sl = (beat && beat.slide) || {};
    const se = c.se || {};
    const esc = taoEsc(se);
    const b = taoBo(c);
    const goc = ex.tokens || [];
    const ch = tachCongThuc(sl.grammarFormula);
    const ghep = ch ? canhCau(ch, goc) : { kieu: 'DIAGRAM', lyDo: 'khong-chuoi' };
    const laGhep = ghep.kieu === 'ASSEMBLE';

    const rtCua = (t) => { try { return typeof se.rtCua === 'function' ? se.rtCua(t) : ''; } catch (e) { return ''; } };
    const noiDung = (t) => { const rt = rtCua(t); return rt ? rubyTu(se, t.kanji, rt) : esc(t.text || t.kanji || ''); };
    const chuTok = (t) => String((t && t.text) || '').trim();
    const laTroTok = (t) => !!(t && t.isKeyGrammar && DOC_TRO[chuTok(t)]);

    // Token -> chip chu Nhat trong mau (ASSEMBLE): tro tu trong tam doc duoi CHIP cua hang mau
    const tokLit = {};
    const docEi = new Set();
    if (laGhep) {
      ghep.gan.forEach((g) => {
        if (g.loai !== 'chu') return;
        g.tok.forEach((ti) => {
          const t = goc[ti];
          const ei = g.ei.find((x) => ch.phan[x] && ch.phan[x].chu === chuTok(t));
          if (laTroTok(t) && ei != null) { tokLit[ti] = ei; docEi.add(ei); }
        });
      });
    }
    // Chip duoi token trong cau (dan san cho, an): vai tro (so do) + cach doc tro tu (khi khong o mau)
    const vaiTro = (t) => { try { return typeof se.tokenRole === 'function' ? se.tokenRole(chuTok(t)) : ''; } catch (e) { return ''; } };
    const chipCua = {};
    goc.forEach((t, i) => {
      if (!t || !t.isKeyGrammar) return;
      const ds = [];
      if (!laGhep) { const vt = vaiTro(t); if (vt) ds.push({ loai: 'vt', chu: vt }); }
      if (laTroTok(t) && tokLit[i] == null) ds.push({ loai: 'doc', chu: DOC_TRO[chuTok(t)] });
      if (ds.length) chipCua[i] = ds;
    });

    // So do (cau khong ghep vua mau): mau la VIEN tinh (khong o trong hua se dien); token trung chip chu
    // cua mau (1-4 token noi lai) to nen nhe .is-mau -> mat noi duoc vien voi cau
    const tokMau = new Set();
    if (ch && !laGhep) {
      const lits = uniq(ch.phan.filter((e) => e.loai === 'chu').map((e) => nm(e.chu)));
      const ds = [];
      goc.forEach((t, i) => {
        const s = String((t && (t.text || t.kanji)) || '').trim();
        if (s && !RE_DAU_TOK.test(s)) ds.push({ i, a: nm(t.text || t.kanji), b: nm(t.kanji || t.text) });
      });
      for (const L of lits) {
        for (let j = 0; j < ds.length; j++) {
          let sa = '', sb = '';
          for (let m = 1; m <= 4 && j + m <= ds.length; m++) {
            sa += ds[j + m - 1].a; sb += ds[j + m - 1].b;
            if (sa === L || sb === L) { for (let z = j; z < j + m; z++) tokMau.add(ds[z].i); break; }
            if (!L.startsWith(sa) && !L.startsWith(sb)) break;
          }
        }
      }
    }

    // Cau: token mang id st-, dau cau dinh vao chu truoc (ghepTokenCau)
    const toks = goc.map((t) => Object.assign({}, t, { id: t && t.id ? idSt(c, t.id) : '' }));
    const veTu = (tok, i, ds) => {
      const rt = rtCua(tok);
      let inner = esc(tok.text || '');
      if (rt) { try { inner = se.rubyCau(tok, rt, i, ds); } catch (e) { inner = `<ruby>${esc(tok.kanji)}<rt>${esc(rt)}</rt></ruby>`; } }
      const chips = chipCua[i] ? `<span class="sk-vd-chips" aria-hidden="true">${chipCua[i].map((x) =>
        `<span class="sk-vd-chip sk-an is-${x.loai}">${esc(x.chu)}</span>`).join('')}</span>` : '';
      return `<span${tok.id ? ` id="${esc(tok.id)}"` : ''} class="sk-vd-tok${tok.isKeyGrammar ? ' is-key' : ''}${tokMau.has(i) ? ' is-mau' : ''}" data-i="${i}">${inner}${chips}</span>`;
    };
    let cauHtml = '';
    try { cauHtml = typeof se.ghepTokenCau === 'function' ? se.ghepTokenCau(toks, veTu) : toks.map((t, i) => veTu(t, i, toks)).join(''); }
    catch (e) { cauHtml = toks.map((t, i) => veTu(t, i, toks)).join(''); }

    let mauHtml = '';
    if (ch && laGhep) {
      const dien = {};
      ghep.gan.forEach((g) => { if (g.loai === 'o') dien[g.ei] = g.tok.map((i) => noiDung(goc[i])); });
      const duoi = ghep.duoi.map((i) => noiDung(goc[i]));
      mauHtml = veHang(ch, esc, { mau: true, dien, duoi, docEi, noi: sl.grammarFormula });
    } else if (ch) {
      mauHtml = veVien(ch.goc, esc, sl.grammarFormula);
    }
    const coChip = Object.keys(chipCua).length > 0;
    const coChip2 = Object.values(chipCua).some((ds) => ds.length > 1);

    const than = `
      <div class="sk-vd-luoi">
        ${mauHtml ? `<div class="sk-vd-mau">${mauHtml}</div>` : ''}
        <div class="sk-vd-than">
          <div id="${esc(idSt(c, ex.id))}" class="sk-vd-cau jp-sentence${coChip ? ' co-chip' : ''}${coChip2 ? ' co-chip-2' : ''} sk-chu-noi" lang="ja" data-noi="${esc(uniq([
            goc.map((t) => (t && (t.kanji || t.text)) || '').join(''), goc.map((t) => (t && (t.text || t.kanji)) || '').join('')]).join('|'))}">${cauHtml}</div>
          <div class="sk-vd-nghia sk-an sk-chu-noi">${esc(ex.meaningVi || '')}</div>
        </div>
      </div>`;

    const el = taoThe('example', (laGhep ? 'is-ghep' : 'is-so-do') + (mauHtml ? ' co-mau' : ''), than, camXuc(se, ex));
    b.ganThe(el);
    const q = (s) => el.querySelector(s);
    const mauEl = q('.sk-vd-mau .sk-np-hang') || q('.sk-vd-mau .sk-np-vien');
    const thanEl = q('.sk-vd-than');
    const cauEl = q('.sk-vd-cau');
    const nghiaEl = q('.sk-vd-nghia');
    const tokEl = {};
    el.querySelectorAll('.sk-vd-tok[data-i]').forEach((x) => { tokEl[x.dataset.i] = x; });
    // Token chu (bo dau cau), theo thu tu doc
    const tk = [];
    goc.forEach((t, i) => {
      const s = String((t && (t.text || t.kanji)) || '').trim();
      if (!s || RE_DAU_TOK.test(s) || !tokEl[i]) return;
      tk.push({ i, t, el: tokEl[i] });
    });
    const cauText = goc.map((t) => (t && (t.kanji || t.text)) || '').join('');
    const hai = (ds) => uniq([ds.map((x) => x.t.text || x.t.kanji || '').join(''), ds.map((x) => x.t.kanji || x.t.text || '').join('')]);
    const dau2 = hai(tk.slice(0, 2)), cuoi2 = hai(tk.slice(-2));
    const mora = tk.map((x) => soMora(x.t.furigana || x.t.text || x.t.kanji));
    const tongMora = mora.reduce((a, x) => a + x, 0) || 1;

    // Karaoke = con tro doc truot tung token, moc ti le so mora trong thoi luong doc
    function karaoke(tt) {
      const dur = thoiLuong(c, tt, cauText);
      const T = (tt && tt.T) || 0;
      let acc = 0;
      const times = tk.map((x, k) => { const t = T + (dur / 1000) * acc / tongMora; acc += mora[k]; return t; });
      b.troKaraoke(tk.map((x) => x.el), times, tt);
      return dur;
    }

    const st = { e1dur: 0, e1Het: null, e2: false, dangMo: false, daChi: false };
    // Thoi luong doc khi khopCuoi chua ve kip luc cue ban: uoc theo CA CAU (dao dien: donVi x r x 1.2),
    // khong theo 2 token dau cua khoa khop (truoc day: 486 ms cho mot cau doc 1.8 s)
    const dvCau = donVi(c, cauText);
    /**
     * Cong: trong luc cau dang duoc doc (lan 1 + lan 2) dong phu (ghep E3, doc tro tu E4, nghia E5)
     * chi xep hang — khoa cua chung (token trong tam) khop ngay trong lan doc dau vi con tro `sau: 'E2'`
     * con o dau nhip khi E2 chua khop (va thu tu noi dung keo E3 len truoc ca E1).
     * Dong tu E0 (Sensei bat dau noi) theo uoc luong; E1 / E2 chinh lai moc; mo luc lan doc 2 xong (+200 ms).
     */
    const chanDen = (Tket) => {
      const nay = b.bayGio();
      const ms = nay != null && Tket != null ? (Tket - nay) * 1000 + 200 : 0;
      if (ms > 16) b.chan(ms); else b.moChan();
    };
    const DAN_VAO = 1.5;   // "Câu ví dụ:" truoc lan doc dau (giay)
    const cues = [
      // E0: Sensei bat dau noi ("Câu ví dụ:") -> con tro om ca cau; karaoke roi thu lai tung token
      { id: 'E0', loai: 'nhan', khi: { dauTien: true }, lam: b.mot('E0', (tt) => {
        b.troToi(cauEl, { px: 12, py: 2 });
        const d = kep(dvCau * r0(c) * 1.2, 0.35, 3.5);
        chanDen(((tt && tt.T) || 0) + DAN_VAO + 2 * d + 0.6);
      }) },
      { id: 'E1', loai: 'doc', khi: { khop: { jp: dau2 }, lan: 1 }, khopCuoi: { jp: cuoi2 }, donVi: dvCau,
        lam: b.mot('E1', (tt) => {
          st.e1dur = karaoke(tt);
          // lan 2 chua nghe ra: uoc het lan 2 = het lan 1 + 600 ms + mot lan doc nua (giong E2b)
          st.e1Het = ((tt && tt.T) || 0) + (2 * st.e1dur + 600) / 1000;
          chanDen(st.e1Het);
        }) },
      // lan dem tu con tro cua `sau` (cuoi khop E1) -> lan 1 = lan doc thu hai
      { id: 'E2', loai: 'doc', khi: { khop: { jp: dau2 }, lan: 1 }, sau: 'E1', khopCuoi: { jp: cuoi2 }, donVi: dvCau,
        lam: b.mot('E2', (tt) => {
          st.e2 = true;
          const d = karaoke(tt);   // da chay du phong E2b: chay lai theo giong that
          // khop nham xa (vd khoa JP noi qua chu Viet trong loi tach cau): khong giu cong qua uoc luong + 1.5 s
          const het = ((tt && tt.T) || 0) + d / 1000;
          chanDen(st.e1Het != null ? Math.min(het, st.e1Het + 1.5) : het);
        }) },
      // du phong E2: doc lan 2 bat dau khoang E1.dur + 600 ms sau E1 neu khong nghe ra
      { id: 'E2b', loai: 'doc', khi: { sauCue: 'E1', ms: 600 },
        lam: (tt) => {
          const T = ((tt && tt.T) || 0) + st.e1dur / 1000;
          b.hen(() => { if (!st.e2) karaoke({ T, dur: st.e1dur, via: 'sauCue' }); }, st.e1dur);
        } },
    ];

    const chiMotLan = (x) => { if (st.daChi || !x) return; st.daChi = true; try { c.chiVao(x); } catch (e) {} };
    const khoaE4 = (x, k) => {
      const truoc = tk[k - 1];
      const s = chuTok(x.t);
      return truoc ? uniq([(truoc.t.text || '') + s, (truoc.t.kanji || truoc.t.text || '') + s]) : [];
    };
    const dsKey = tk.map((x, k) => ({ x, k })).filter((o) => o.x.t.isKeyGrammar);
    const chipTok = (x, loai) => x.el.querySelector('.sk-vd-chip.is-' + loai);
    /** E4: cach doc tro tu — duoi chip cua hang mau (ghep) hoac duoi token (so do); mot lan nay chip nay len */
    const docTro = (x) => {
      let chip = null, dich = x.el;
      if (tokLit[x.i] != null && mauEl) {
        const lit = mauEl.querySelector(`.sk-np-lit[data-ei="${tokLit[x.i]}"]`);
        chip = lit && lit.querySelector('.sk-np-doc');
        dich = (lit && lit.querySelector('.sk-np-chip')) || dich;
      } else chip = chipTok(x, 'doc');
      if (chip) {
        chip.classList.remove('sk-an'); chip.classList.add('is-hien');
        // chi opacity + nhich 4px (khong scale: A3 chi mien cho .sk-chip cua dao dien)
        b.chay(chip, [{ opacity: 0, translate: '0 4px', offset: 0 }], { dur: 260 });
      }
      b.troToi(dich, { ngay: true, px: 6, py: 6 });
      chiMotLan(dich);
    };

    /**
     * Ghep (duyet r4 — hanh trinh nhin thay duoc): ban sao token (khong id) BAT DAU dung tren token trong
     * cau, cung co (scale = co chu token / co chu o), ro nguyen (opacity 1); cau mo di ngay luc ban sao
     * dau nhac len -> thay chu roi khoi cau. Ban sao bay theo cung nhe (giua duong nhich len 12 px), thu
     * dan ve co cua o. Nhan o ("N1") giu toi luc ban sao sap cham roi mo di trong 120 ms cuoi cua chuyen
     * bay (cham o = nhan vua het, chu thay cho nhan); cham: o day (nen). Tung tu mot (bay 380 ms, cach
     * 420 ms): mat theo mot tu, moi luc <= 2 hoat anh trong the (A3). Het nhip giua chung: moi dich hien
     * + o day ngay (khiXa). -> tong thoi gian (ms) de dong phu ke tiep doi.
     */
    const BAY_CACH = 420, BAY_MS = 380, NHAN_MS = 120;
    function moNhan(o) {
      if (!o || o.classList.contains('is-mo-nhan') || o.classList.contains('is-day')) return;
      o.classList.add('is-mo-nhan');
      const nh = o.querySelector('.sk-np-o-nhan');
      if (nh && !b.giam && !b.theDong()) b.chay(nh, [{ opacity: 1, offset: 0 }], { dur: NHAN_MS, easing: E_IN });
    }
    function dayO(o) {
      if (!o || o.classList.contains('is-day')) return;
      o.classList.add('is-mo-nhan', 'is-day');
    }
    const hienDich = (x) => { x.d.classList.remove('sk-an'); x.d.classList.add('is-hien'); dayO(x.o); };
    function bayGhep(doi0) {
      const lop = el.querySelector('.sk-chu-trong');
      if (!lop) { doi0.forEach(hienDich); return 0; }
      const rl = lop.getBoundingClientRect();
      const sx = lop.offsetWidth ? rl.width / lop.offsetWidth : 1;
      const sy = lop.offsetHeight ? rl.height / lop.offsetHeight : 1;
      // Do het truoc, ghi sau
      const doi = doi0.map((x) => ({ ...x, rs: x.s.getBoundingClientRect(), rd: x.d.getBoundingClientRect(),
        cs: getComputedStyle(x.d), fsS: parseFloat(getComputedStyle(x.s).fontSize) || 0 }));
      const conLai = new Set();
      const cham = (x) => {
        if (!conLai.has(x)) return;
        conLai.delete(x);
        hienDich(x);
        if (x.cl) x.cl.remove();
      };
      b.khiXa(() => [...conLai].forEach(cham));
      doi.forEach((x, i) => {
        conLai.add(x);
        const bay = () => {
          if (!conLai.has(x)) return;
          if (!x.rs.width || !x.rs.height || !x.rd.width || !x.rd.height || !el.isConnected) { cham(x); return; }
          // ban sao cua o dich (cung noi dung token, co chu cua o), khong id
          const cl = x.d.cloneNode(true);
          cl.removeAttribute('id');
          cl.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
          cl.className = 'sk-bay sk-vd-bay';
          cl.setAttribute('aria-hidden', 'true');
          Object.assign(cl.style, {
            left: ((x.rd.left - rl.left) / sx).toFixed(1) + 'px', top: ((x.rd.top - rl.top) / sy).toFixed(1) + 'px',
            width: (x.rd.width / sx).toFixed(1) + 'px', height: (x.rd.height / sy).toFixed(1) + 'px',
            fontSize: x.cs.fontSize, fontFamily: x.cs.fontFamily, fontWeight: x.cs.fontWeight, lineHeight: x.cs.lineHeight, color: x.cs.color,
            transformOrigin: '50% 50%',
          });
          // trang thai cuoi: ban sao nam dung o dich; hieu ung: tu tam token trong cau (cung co) theo cung ve o
          const dx = ((x.rs.left + x.rs.width / 2) - (x.rd.left + x.rd.width / 2)) / sx;
          const dy = ((x.rs.top + x.rs.height / 2) - (x.rd.top + x.rd.height / 2)) / sy;
          const fsD = parseFloat(x.cs.fontSize) || 0;
          const k = fsD > 0 && x.fsS > 0 ? kep(x.fsS / fsD, 0.5, 3) : 1;
          lop.appendChild(cl);
          x.cl = cl;
          b.chay(cl, [
            { translate: `${dx.toFixed(1)}px ${dy.toFixed(1)}px`, scale: k.toFixed(3), offset: 0 },
            { translate: `${(dx / 2).toFixed(1)}px ${(dy / 2 - 12).toFixed(1)}px`, scale: ((1 + k) / 2).toFixed(3), offset: 0.5 },
          ], { dur: BAY_MS });
          b.hen(() => { if (conLai.has(x)) moNhan(x.o); }, BAY_MS - NHAN_MS);
          b.hen(() => cham(x), BAY_MS);
        };
        if (i === 0) bay(); else b.hen(bay, i * BAY_CACH);
      });
      return doi.length ? (doi.length - 1) * BAY_CACH + BAY_MS : 0;
    }

    if (laGhep) {
      // E3: ghep — token bay vao o; cau mo di mot lan (mot hoat anh, cung luc ban sao dau nhac len)
      const slotEls = mauEl ? [...mauEl.querySelectorAll('.sk-np-o')] : [];
      const doi = [];
      ghep.gan.forEach((g) => {
        if (g.loai !== 'o') return;
        const o = slotEls.find((x) => x.dataset.ei === String(g.ei));
        const ds = o ? [...o.querySelectorAll('.sk-vd-dien')] : [];
        g.tok.forEach((ti, n) => { if (tokEl[ti] && ds[n]) doi.push({ s: tokEl[ti], d: ds[n], o }); });
      });
      const duoiDs = mauEl ? [...mauEl.querySelectorAll('.sk-vd-duoi .sk-vd-dien')] : [];
      ghep.duoi.forEach((ti, n) => { if (tokEl[ti] && duoiDs[n]) doi.push({ s: tokEl[ti], d: duoiDs[n], o: null }); });
      b.khiXa(() => slotEls.forEach((o) => dayO(o, false)));
      const lap = b.mot('E3', (tt) => b.xep((ngay) => {
        const nen = ngay || !!(tt && (tt.via === 'nen' || tt.via === 'xong'));
        if (mauEl) mauEl.querySelectorAll('.sk-np-chip').forEach((x) => x.classList.add('is-khop'));
        if (!doi.length || nen || b.giam || b.theDong()) {
          doi.forEach(hienDich);
          slotEls.forEach((o) => dayO(o, false));
        } else {
          if (cauEl) {
            cauEl.classList.add('is-mo');
            b.chay(cauEl, [{ opacity: 1, offset: 0 }], { dur: 150 });
            st.dangMo = true;
          }
          const ms = bayGhep(doi);
          b.giuHang(ms);
          b.hen(() => slotEls.forEach((o) => dayO(o, false)), ms);
        }
        if (mauEl) b.troToi(mauEl, { ngay: true, px: 12, py: 8 });
      }, tt), true);
      // Khoa: moi token trong tam (text, kanji); tro tu 1 chu -> kem chu truoc, hoac dung rieng
      const khoa = [];
      dsKey.forEach(({ x, k }) => {
        const s = chuTok(x.t);
        if (doDai(s) === 1) khoa.push(...khoaE4(x, k));
        khoa.push(s, x.t.kanji);
      });
      capKhop('E3', { loai: 'hien', sau: 'E2', tiLe: 0.4, lam: lap }, uniq(khoa)).forEach((cu) => cues.push(cu));
      tk.forEach((x, k) => {
        if (!laTroTok(x.t)) return;
        const s = chuTok(x.t);
        cues.push({ id: 'E4.' + k, loai: 'hien', khi: { khop: { jp: khoaE4(x, k), vn: READ_VD[s] || [] } }, sau: 'E2', tiLe: 0.45,
          lam: b.mot('E4.' + k, (tt) => b.xep(() => docTro(x), tt), true) });
      });
    } else {
      // E3.k: so do — token trong tam: chip vai tro duoi token + con tro toi token
      dsKey.forEach(({ x, k }, j) => {
        const tiLe = Math.min(0.72, 0.35 + 0.1 * j);
        const vt = chipTok(x, 'vt');
        const lam = b.mot('E3.' + j, (tt) => b.xep(() => {
          if (vt) b.hien(vt, { dur: 220 });
          b.troToi(x.el, { ngay: true, px: 5, py: 4 });
        }, tt), true);
        const khoa = uniq([...khoaE4(x, k), x.t.kanji, chuTok(x.t)]);
        capKhop('E3.' + j, { loai: 'hien', sau: 'E2', tiLe, lam }, khoa).forEach((cu) => cues.push(cu));
        if (laTroTok(x.t)) {
          const s = chuTok(x.t);
          cues.push({ id: 'E4.' + k, loai: 'hien', khi: { khop: { jp: khoaE4(x, k), vn: READ_VD[s] || [] } }, sau: 'E2', tiLe: Math.min(0.74, tiLe + 0.02),
            lam: b.mot('E4.' + k, (tt) => b.xep(() => docTro(x), tt), true) });
        }
      });
    }
    const boMo = () => {
      if (!st.dangMo || !cauEl) return;
      st.dangMo = false;
      cauEl.classList.remove('is-mo');
      b.chay(cauEl, [{ opacity: 0.45, offset: 0 }], { dur: 200 });
    };
    cues.push({ id: 'E5', loai: 'hien', khi: { khop: { vn: uniq([...NGHIA, ...vn3(ex.meaningVi)]) } }, sau: 'E2', tiLe: 0.75,
      lam: b.mot('E5', (tt) => b.xep(() => {
        b.hien(nghiaEl);
        boMo();
        b.troToi(nghiaEl, { ngay: true, px: 12, py: 4 });
      }, tt), true) });

    const canh = {
      el, cues, heroEl: cauEl || thanEl,
      sr: beat.label || 'Ví dụ',
      giu(beatTiep) {
        b.xaHang(true);
        if (mauEl && beatTiep && beatTiep.kind === 'example' && beatTiep.subIndex === beat.subIndex) return [mauEl];
        return null;
      },
      xong() { b.buDu(); b.xaHang(false); },
      huy() { b.huy(); },
      _chu: { kind: 'example', subIndex: beat.subIndex, mauEl, thanEl },
    };
    canh.congCu = taoCongCu(c, b, el);

    // Bo sung B.1: moi nhip vao bang MOT chuyen dong cua ca the (dao dien) — khong mang phan tu
    // giua hai the. "Mang cong thuc" (§1.9) thanh lien mach bo cuc: the mau cau va the vi du cung
    // slide dat hang cong thuc o cung do cao tren the (motion-chu.css) nen the moi truot vao, cong
    // thuc van o dung cho mat dang nhin.
    return canh;
  }

  /* ======================================================================
     7. DANG KY
     ====================================================================== */

  const BO_DUNG = {
    vocab: dungTuVung,
    kanji: dungChuHan,
    'grammar-intro': dungMauCau,
    example: dungViDu,
  };

  let daDangKy = false;
  function dangKy() {
    const SM = W.SenseiMotion;
    if (daDangKy || !SM || typeof SM.dangKyCanh !== 'function') return false;
    daDangKy = true;
    Object.keys(BO_DUNG).forEach((kind) => {
      const fn = BO_DUNG[kind];
      try {
        SM.dangKyCanh(kind, {
          dung(beat, c) {
            try { return fn(beat, c || {}); } catch (e) { warn('dung ' + kind, e); return null; }
          },
        });
      } catch (e) { warn('dangKyCanh ' + kind, e); }
    });
    return true;
  }
  api.dangKy = dangKy;
  api._dung = BO_DUNG;   // cho kiem thu dung canh ngoai director
  if (!dangKy() && typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', dangKy, { once: true });
  }
})();
