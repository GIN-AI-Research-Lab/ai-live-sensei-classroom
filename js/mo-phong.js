/**
 * CHE DO MO PHONG BAI GIANG (?moPhong) — kiem thu san khau giang (js/motion.js)
 * ma KHONG mo phien Gemini Live nao.
 *
 * Tro GeminiLiveClient sang mot lop con: socket gia, moi goi gui di (sendUserMessage,
 * safeSend...) di vao _nhan() thay vi mang. Phan con lai la client that — handleMessage
 * nhan dung cac goi server that (modelTurn audio, outputTranscription, toolCall,
 * turnComplete, interrupted) do mo phong tu phat theo kich ban cua tung dang nhip.
 *
 * Am thanh tong hop 24 kHz biet truoc thoi diem: moi don vi (kana, am tiet Viet...)
 * la mot chum tieng r*w giay, ghi lai vi tri audio cua tung ky tu ban ghi loi ->
 * __moPhong.thoiDiemThat(luot, viTri) tra ve luc ky tu do that su vang len
 * (dong ho AudioContext), de do sai so dong bo cua san khau.
 *
 * Khong co ?moPhong tren dia chi trang thi tep nay khong lam gi.
 * Luon dung kem ?noLive (khong key, khong long tieng / soan de / REST).
 *
 * Tham so URL: tre rung nhanh r som kana mat hat tu den (xem TS ben duoi) + cu (ms tieng
 * luot cu con bay toi sau khi gui luot moi, mac dinh 100 — them ngoai spec §4.2).
 *
 * LOI GIA LAP (xac suat moi luot giang, chi lan dau cua nhip — loiLai=1: ca lan nhac lai):
 *   rong=p   luot rong: turnComplete khong tieng / chu (co khi kem mot part "thought")
 *   chiCc=p  luot chi co tool (write_kanji / write_on_board) roi turnComplete; noi dung
 *            toi o luot TIEP SAU khi app tra toolResponse (gui luot moi truoc do -> mat)
 *   thieu=p  luot noi lan man ~6 s ma khong nhac toi muc
 *   ngan=p   luot dut som: chi ~25% dau kich ban roi turnComplete
 *   ngat=p   server dong phien giua luot (app tam dung; bam "Giảng tiếp" de hoc lai)
 *   im=p     khong tra loi gi ca (khong tieng, khong turnComplete)
 *   tcCu=p   luot giang bi luot moi ngat: gui turnComplete cua luot cu (thay interrupted)
 * Moi luot ghi loi da gap (__moPhong.luot()[k].loi) de harness doi chieu.
 */
(function () {
  'use strict';
  if (!/[?&]moPhong\b/i.test(location.search)) return;
  if (typeof GeminiLiveClient !== 'function') { console.warn('[mo-phong] thiếu GeminiLiveClient'); return; }

  // ------------------------------------------------------------------ tham so
  const q = new URLSearchParams(location.search);
  const so = (k, d) => { const v = parseFloat(q.get(k)); return Number.isFinite(v) ? v : d; };
  const TS = {
    tre: so('tre', 0.35),    // do tre that cua ban ghi so voi am thanh (s; am = chu toi truoc)
    rung: so('rung', 0.15),  // rung moi manh chu (s, deu +-)
    nhanh: so('nhanh', 2.5), // toc do stream so voi thoi gian that
    r: so('r', 0.15),        // giay moi don vi
    som: so('som', 1.5),     // tool toi som toi da (s audio)
    kana: so('kana', 0.3),   // xac suat tu chu Han bi ghi thanh kana
    mat: so('mat', 0.1),     // xac suat tu JP bi ghi sai (rot mot kana)
    hat: so('hat', 7),       // hat giong xorshift
    tu: q.has('tu') ? so('tu', null) : null,
    den: q.has('den') ? so('den', null) : null,
    cu: so('cu', 100),       // ms tieng luot cu con toi sau khi gui luot moi
    // loi gia lap (xem dau tep)
    rong: so('rong', 0), chiCc: so('chiCc', 0), thieu: so('thieu', 0), ngan: so('ngan', 0),
    ngat: so('ngat', 0), im: so('im', 0), tcCu: so('tcCu', 0), loiLai: so('loiLai', 0),
  };
  const LOI_LUOT = ['rong', 'chiCc', 'thieu', 'ngan', 'ngat', 'im'];
  const SR = 24000;

  // ------------------------------------------------------------------ ngau nhien co hat
  function bam(str) {   // FNV-1a 32 bit
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }
  function taoRng(hat) {   // xorshift32
    let s = (hat >>> 0) || 0x9e3779b9;
    const f = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
    f.u = (a, b) => a + (b - a) * f();
    f.co = (p) => f() < p;
    return f;
  }

  // ------------------------------------------------------------------ chu & don vi (§1.5.3)
  const KANA_NHO = 'ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ';
  const laJP = (c) => /[぀-ヿ一-鿿々〜～]/.test(c);
  const laKana = (c) => /[぀-ゟ゠-ヿ]/.test(c);
  const laHan = (c) => /[一-鿿々]/.test(c);
  const laChu = (c) => /\p{L}/u.test(c || '');
  const laDau = (c) => !laChu(c) && !/\p{Nd}/u.test(c);   // dau cau, khoang trang, ky hieu
  const hira = (c) => { const k = c.charCodeAt(0); return k >= 0x30a1 && k <= 0x30f6 ? String.fromCharCode(k - 0x60) : c; };
  function trongSo(c, truoc) {
    if (KANA_NHO.includes(c)) return 0;
    if (laKana(c)) return 1;              // gom ca ー, っ
    if (laHan(c)) return 1.7;
    if (laChu(c)) return laChu(truoc) ? 0 : 1.3;
    if (/\p{Nd}/u.test(c)) return 1;
    return 0;
  }
  const DAU_NGHI = /[.,!?;:…。、！？：]\s*$/;

  // ------------------------------------------------------------------ kich ban: doan (segment)
  // { loai:'vn'|'jp'|'lang'|'cong-cu', hien (chu ghi loi), doc (cach doc -> don vi), ms, name, args, cham }
  const V = (s) => ({ loai: 'vn', hien: String(s == null ? '' : s) });
  const J = (kanji, kana) => ({ loai: 'jp', kanji: String(kanji || kana || ''), kana: kana ? String(kana) : '' });
  const L = (ms) => ({ loai: 'lang', ms });
  const CC = (name, args) => ({ loai: 'cong-cu', name, args });
  const Jt = (t) => (laDau((t.text || '').trim().slice(0, 1) || '.') && !laJP((t.text || '').trim()))
    ? { loai: 'jp', kanji: t.text, kana: '', dau: true }
    : J(t.kanji || t.text, t.furigana || t.text);

  /** Tach chuoi tron Viet / Nhat thanh cac doan vn va jp (doan JP trong van ban: chu = cach doc) */
  function tachTron(s) {
    const out = [];
    const re = /[぀-ヿ一-鿿々〜～・「」『』（）。、！？]+/g;
    let i = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > i) out.push({ loai: 'vn', hien: s.slice(i, m.index) });
      out.push({ loai: 'jp', kanji: m[0], kana: '' });
      i = m.index + m[0].length;
    }
    if (i < s.length) out.push({ loai: 'vn', hien: s.slice(i) });
    return out;
  }

  /** Rot mot kana (ghi sai) — chi khi con >= 2 kana */
  function rotKana(s, rng) {
    const cp = Array.from(s);
    const vt = cp.map((c, i) => (laKana(c) ? i : -1)).filter(i => i >= 0);
    if (vt.length < 2) return s;
    cp.splice(vt[Math.floor(rng() * vt.length)], 1);
    return cp.join('');
  }

  /**
   * Chuan hoa kich ban: tach doan tron, chon chu hien cho tu JP (chu Han / kana / ghi sai),
   * chen lang 250 ms sau dau cau va 150 ms o cho doi Viet <-> Nhat.
   */
  function chuanHoa(dsTho, rng) {
    const phang = [];
    for (const d of dsTho.flat(Infinity)) {
      if (!d) continue;
      if (d.loai === 'vn') { for (const x of tachTron(d.hien)) phang.push({ ...x, cham: d.cham }); }
      else phang.push({ ...d });   // ban sao: mot tu JP dung lai nhieu lan, moi lan chon chu hien rieng
    }
    const out = [];
    let truocLoai = null;
    for (const d of phang) {
      if (d.loai === 'jp') {
        const kanji = d.kanji || d.kana;
        const kana = d.kana || '';
        // Doc: kana neu co, khong thi chinh chu do
        const doc = kana || kanji;
        let hien = kanji;
        if (!d.dau && kana && kana !== kanji && rng.co(TS.kana)) hien = kana;
        if (!d.dau && rng.co(TS.mat)) hien = rotKana(hien === kanji && kana && Array.from(kanji).some(laHan) ? kana : hien, rng);
        d.hien = hien; d.doc = doc;
      } else if (d.loai === 'vn') {
        d.doc = d.hien;
      }
      const la = d.loai === 'vn' || d.loai === 'jp' ? d.loai : null;
      if (la && truocLoai && la !== truocLoai && (d.hien || '').trim() && !d.dau) {
        const tr = out[out.length - 1];
        if (!(tr && tr.loai === 'lang')) out.push(L(150));
      }
      out.push(d);
      if (la && (d.hien || '').trim()) truocLoai = la;
      if (la && DAU_NGHI.test(d.hien || '')) out.push(L(250));
    }
    return out;
  }

  // ------------------------------------------------------------------ kich ban tung dang nhip (§4.3)
  const nhoHoa = (s) => String(s || '');
  const cauCua = (tokens) => (tokens || []).map(Jt);
  const cuoiCau = (tokens) => (tokens || []).filter(t => !laDau((t.text || '').slice(0, 1)) || laJP(t.text || ''));
  const docTen = (s) => String(s || '').replace(/[.\-－]/g, '');
  const bocNgoac = (s) => String(s || '').replace(/\s*[(（][^)）]*[)）]\s*/g, '').trim();
  const trongNgoac = (s) => { const m = String(s || '').match(/[(（]([^)）]*)[)）]/); return m ? m[1].trim() : ''; };
  const kataHira = (s) => Array.from(String(s || '')).map(hira).join('');

  const KB = {
    vocab(b, rng) {
      const v = b.data || {};
      const w = J(v.kanji || v.word, v.furigana || v.word);
      const meo = v.accentNote || 'nhìn mặt chữ rồi đọc to ba lần là nhớ';
      return [
        V('Từ tiếp theo là '), w, V('. '), w, V('. '),
        w, V(', nghĩa là ' + nhoHoa(v.meaningVi) + '. '),
        rng.co(0.4) ? CC('write_on_board', { text: 'Mẹo: ' + meo, style: 'thuong' }) : null,
        V('Mẹo nhớ: ' + meo + ' '),
        V('Ví dụ: '), J('これは'), w, J('です'), V('. '),
      ];
    },
    kanji(b, rng) {
      const k = b.data || {};
      const ch = k.character || '';
      if (k.loai === 'kana') {
        // Chu cai (bai Nhap mon): ten chu + romaji, cach doc, meo nho, chu de nham, 2 tu vi du — khong Han Viet / On / Kun
        const som = rng.co(0.6);
        const out = [
          som ? CC('write_kanji', { character: ch }) : null,
          V('Chữ '), J(ch, ch), V(', đọc là ' + (k.romaji || '') + '. '), J(ch, ch), V('. '),
          som ? null : CC('write_kanji', { character: ch }),
          k.meaningVi ? V('Phát âm: ' + nhoHoa(k.meaningVi) + ' ') : null,
          k.meoNho ? V('Mẹo nhớ: ' + k.meoNho + ' ') : null,
          k.sosanh ? V('Dễ nhầm: ' + k.sosanh + ' ') : null,
        ];
        (k.commonWords || []).slice(0, 3).forEach(cw => {   // loi dan (app.js) liet ke toi da 3 tu nhu tren the
          out.push(V('Ví dụ: '), J(cw.word, cw.furigana || cw.word), V(' nghĩa là ' + nhoHoa(cw.meaningVi) + '. '));
        });
        return out;
      }
      const kun = (k.kunyomi || []).map(docTen).filter(Boolean);
      const on = (k.onyomi || []).map(bocNgoac).filter(Boolean);
      const doc = kun[0] || kataHira(on[0] || '') || '';
      const som = rng.co(0.6);
      const art = window.SenseiArt && window.SenseiArt.kanji ? window.SenseiArt.kanji(ch) : null;
      const goc = (art && art.note) || 'nhìn kỹ từng bộ phận ghép lại là nhớ ngay';
      const out = [
        som ? CC('write_kanji', { character: ch }) : null,
        V('Chữ '), J(ch, doc), V(', Hán Việt là ' + (k.hanViet || '') + ', có ' + (k.strokeCount || 0) + ' nét. '),
        som ? null : CC('write_kanji', { character: ch }),
        V('Câu chuyện chiết tự: ' + goc + ' '),
      ];
      if ((k.onyomi || []).length) {
        out.push(V('Âm On là '));
        (k.onyomi || []).forEach((o, i) => {
          if (i) out.push(V(', '));
          const rm = trongNgoac(o);
          out.push(rm && rng.co(0.3) ? V(rm) : J(bocNgoac(o), ''));
        });
        out.push(V('. '));
      }
      if (kun.length) {
        out.push(V('Âm Kun là '));
        kun.forEach((x, i) => { if (i) out.push(V(', ')); out.push(J(x, '')); });
        out.push(V('. '));
      }
      (k.commonWords || []).slice(0, 3).forEach(cw => {
        out.push(V('Từ ghép: '), J(cw.word, cw.furigana), V(' nghĩa là ' + nhoHoa(cw.meaningVi) + '. '));
      });
      return out;
    },
    'grammar-intro'(b, rng) {
      const sl = b.data || {};
      const fm = String(sl.grammarFormula || '');
      const docCt = [];
      fm.split(/([぀-ヿ一-鿿々ー〜]+)/).forEach((p, i) => {
        if (!p) return;
        if (i % 2) docCt.push(p === 'は' && rng.co(0.5) ? V(' wa ') : J(p, ''));
        else {
          const t = p.replace(/[+\[\]()（）/→=;|]/g, ' ').replace(/\s+/g, ' ');
          if (t.trim()) docCt.push(V(t));
        }
      });
      const cauGiai = String(sl.explanation || '').split(/(?<=[.!?])\s+/).filter(s => s.trim());
      return [
        V('Mẫu câu: ' + (sl.title || '') + '. '),
        V('Công thức: '), docCt, V('. '),
        rng.co(0.3) ? CC('write_on_board', { text: sl.teacherTips ? '⚠ ' + sl.teacherTips : (sl.title || ''), style: 'nhat' }) : null,
        cauGiai.map(s => {
          if (rng.co(0.6)) return V(s + ' ');
          const tu = s.split(/\s+/);
          return V('Hiểu nôm na là ' + tu.slice(Math.min(3, Math.max(0, tu.length - 1))).join(' ') + ' ');
        }),
        sl.teacherTips ? V('Lưu ý: ' + sl.teacherTips + ' ') : null,
        sl.culturalNotes ? V('Về văn hoá, ' + sl.culturalNotes + ' ') : null,
      ];
    },
    example(b, rng) {
      const ex = b.data || {};
      const toks = ex.tokens || [];
      const cau = cauCua(toks);
      const chu = toks.filter(t => (t.text || '').trim() && !(laDau(t.text.slice(0, 1)) && !laJP(t.text)));
      const READ = { 'は': 'wa', 'へ': 'e', 'を': 'o' };
      const tach = [];
      // Loi dan (app.js) danh dau "←trọng tâm" cho token trong tam: Sensei tach 4 token dau + MOI token trong tam
      chu.filter((t, i) => i < 4 || t.isKeyGrammar).forEach(t => {
        if (READ[t.text] && t.isKeyGrammar) tach.push(V('trợ từ '), J(t.text, ''), V(' đọc là ' + READ[t.text] + '; '));
        else tach.push(J(t.kanji || t.text, t.furigana || t.text), V(' là ' + (t.isKeyGrammar ? 'phần trọng tâm' : 'một thành phần') + '; '));
      });
      const khoa = chu.filter(t => t.isKeyGrammar && t.id);
      const a = khoa[0], bTok = chu.find(t => t.id && t !== a);
      return [
        V('Câu ví dụ: '), cau, V(' '), cau, V('. '),
        a && bTok && rng.co(0.3) ? CC('draw_on_board', { target_id: bTok.id, kind: 'mui_ten', to_id: a.id }) : null,
        V('Tách ra: '), tach,
        V('Dịch: ' + nhoHoa(ex.meaningVi) + ' '),
      ];
    },
    'kaiwa-intro'(b) {
      const dia = Array.isArray(b.data) ? b.data : [];
      const vai = [];
      dia.forEach(d => { const s = (d.speaker || '').trim(); if (s && !vai.includes(s)) vai.push(s); });
      return [
        V('Đoạn hội thoại này có ' + vai.length + ' nhân vật: '),
        vai.map((s, i) => V((i ? ', ' : '') + s)), V('. '),
        dia.map(d => V((d.speaker || '') + ': ' + nhoHoa(d.meaningVi) + ' ')),
      ];
    },
    'kaiwa-run'(b) {
      const dia = Array.isArray(b.data) ? b.data : [];
      return dia.map(d => [cauCua(d.tokens), V(' ')]);
    },
    kaiwa(b, rng) {
      const d = b.data || {};
      const toks = d.tokens || [];
      const cham = cauCua(toks).map(x => ({ ...x, cham: 1.4 }));
      const chu = cuoiCau(toks);
      const khoa = chu.find(t => t.isKeyGrammar && t.id) || chu.find(t => t.id);
      const jp = toks.map(t => t.kanji || t.text).join('');
      const khac = /です。?$/.test(jp) ? jp.replace(/です(。?)$/, 'だ$1') : jp.replace(/。?$/, 'ね。');
      return [
        cham, V('. '),
        V('Ngữ cảnh: ' + nhoHoa(d.meaningVi) + ' '),
        khoa && rng.co(0.6) ? CC('draw_on_board', { target_id: khoa.id, kind: 'khoanh' }) : null,
        khoa ? [V('Chỗ quan trọng là '), J(khoa.kanji || khoa.text, khoa.furigana || khoa.text), V('. ')] : null,
        rng.co(0.7) ? CC('write_on_board', { text: khac, style: 'thuong' }) : null,
        V('Cũng có thể nói: '), J(khac, ''), V(' '),
      ];
    },
    quiz(b, rng) {
      const qz = b.data || {};
      const o = qz.options || [];
      const L4 = ['A', 'B', 'C', 'D'];
      return [
        V('Câu hỏi: ' + (qz.question || '') + ' '),
        rng.co(0.3) ? CC('write_on_board', { text: 'Chốt: ' + (qz.hint || qz.question || ''), style: 'nhat' }) : null,
        o.map((x, i) => V((i ? L4[i] : 'Đáp án A') + ': ' + x + '. ')),
        qz.hint ? V('Gợi ý: ' + qz.hint + ' ') : null,
        V('Em chọn đi nhé.'),
      ];
    },
  };
  const KB_NOI_TIEP = () => [V('Ừ, tao nói tiếp phần còn dở nhé. Chỗ này mày nhớ kỹ, lát nữa có bài tập đấy.')];
  const KB_CHAM = (text) => {
    const m = String(text || '').match(/Đáp án đúng:\s*([^\n]*)/);
    return [V('Sai rồi mày ơi, đọc kỹ lại đề đi. '), V('Đáp án đúng là ' + (m ? m[1].trim() : 'cái kia') + ' vì nó hợp với điểm ngữ pháp của bài này.')];
  };
  const KB_TRA_LOI = () => [V('Câu hỏi hay đấy. Để tao giải thích ngắn gọn cho mày nghe nhé.')];
  const KB_MIC = () => [V('Tao nghe rồi. Câu này dễ thôi, để tao giảng lại một lần cho mày.')];

  // ------------------------------------------------------------------ mo bai / cau noi MC / cau chem
  // app.js buildBeatPrompt chen cac muc nay vao loi dan; mo phong "nghe loi" thi noi them:
  // mo bai TRUOC noi dung muc, cau noi o dau luot, cau chem SAU noi dung muc. Noi dung muc
  // (doan, cue, tool, thu tu) giu nguyen. Chi tieng Viet, ngan, va tranh chu cac cue cua
  // san khau hay khop (meo/mèo, nghĩa là, ví dụ, sai, lưu ý, người Nhật, ai/áo/ở/à...) de
  // khong ban cue cua muc som hon kich ban cu.
  function docLenhThem(text) {
    const t = String(text || '');
    const o = {};
    if (/\nMỞ BÀI — /.test(t)) {
      o.moBai = {
        ten: (t.match(/^Bài hôm nay: (.*)$/m) || [])[1] || '',
        noiDung: (t.match(/^Nội dung bài: (.*)$/m) || [])[1] || '',
        kieu: (t.match(/^Kiểu mở bài lần này \(#([\w-]+)\)/m) || [])[1] || '',
      };
    }
    let m = t.match(/CẦU NỐI KIỂU MC: vừa xong phần (.+?), giờ sang phần (.+?)\.\n/);
    if (m) o.cauNoi = { truoc: m[1], sau: m[2] };
    else if ((m = t.match(/MỞ MÀN PHẦN MỚI: buổi này vào thẳng phần (.+?) \(/))) o.cauNoi = { sau: m[1] };
    if (/\nCHÊM MỘT CÂU/.test(t)) o.chem = true;
    return o.moBai || o.cauNoi || o.chem ? o : null;
  }
  const boJP = (s) => String(s || '').replace(/[぀-ヿ一-鿿々〜～・「」『』（）。、！？]+/g, ' ');
  const gon = (s) => String(s || '').replace(/[(（]\s*[)）]/g, ' ').replace(/\s+([,.;:])/g, '$1').replace(/\s+/g, ' ')
    .replace(/^[\s,.;:/&—–-]+|[\s,.;:/&—–(-]+$/g, '').trim();
  const motTrong = (ds, rng) => ds[Math.floor(rng() * ds.length) % ds.length];
  // Cu moc theo kieu mo bai app chon (#id trong loi dan)
  const MO_MOC = {
    'tinh-huong': 'Tưởng tượng ngày đầu đi làm thêm mà đứng hình, toang luôn.',
    'hoi-tu-tu': 'Mày đã bao giờ đứng hình giữa câu chưa?',
    'ban-tin': 'Tin nóng: lớp mình sắp lên trình thêm một nấc.',
    'su-that-nhat': 'Bên Nhật, thứ này ngày nào cũng nghe thấy.',
    'thu-thach': 'Thử thách: hết buổi này phải tự nói được luôn.',
    'noi-bai-truoc': 'Bài trước xong rồi, giờ sang tập tiếp theo.',
    'dong-vai': 'Giả sử mày đang đứng trong cảnh của bài này.',
    'viet-nhat': 'Bên mình nói một kiểu, bên kia nói kiểu khác hẳn.',
    'dem-nguoc': 'Đếm ngược nè, ba, hai, một, khởi động!',
    'gameshow': 'Xin chào khán giả của chương trình hôm nay!',
  };
  function kbMoBai(o, rng) {
    const ten = gon(boJP(String(o.ten || '').split(/\s[—–-]\s|\s?[(（]/)[0])).replace(/^Bài\s*\d+\s*:\s*/i, '');
    const y = gon(boJP(String(o.noiDung || '').split(/[.:;!?](?:\s|$)/)[0])).split(' ').filter(Boolean).slice(0, 8).join(' ')
      .replace(/\s*[(（][^)）]*$/, '').replace(/[,;]$/, '');   // cat giua ngoac -> bo ca ngoac do
    const moc = MO_MOC[o.kieu] || motTrong(Object.values(MO_MOC), rng);
    const chao = motTrong(['Chào cả lớp! ', 'Rồi, cả lớp vào chỗ! ', 'Alo alo, cả lớp! '], rng);
    const cauTen = 'Hôm nay học bài ' + (ten || 'mới') + (y ? ': ' + y.charAt(0).toLowerCase() + y.slice(1) : '') + '. ';
    return rng.co(0.5) ? [V(chao + moc + ' '), V(cauTen)] : [V(chao), V(cauTen), V(moc + ' ')];
  }
  function kbCauNoi(o, rng) {
    if (!o.truoc) return [V(motTrong(['Rồi, buổi này vào thẳng phần ' + o.sau + ' luôn. ', 'Mở màn phần ' + o.sau + ' nhé. '], rng))];
    return [V(motTrong([
      'Xong phần ' + o.truoc + ' rồi, giờ sang phần ' + o.sau + '. ',
      'Vậy là qua vòng ' + o.truoc + ', tiếp theo là ' + o.sau + '. ',
      o.truoc + ' xong rồi nhé, giờ tới tiết mục ' + o.sau + '. ',
      'Hết hiệp ' + o.truoc + ', vào hiệp ' + o.sau + '. ',
    ], rng))];
  }
  const kbChem = (rng) => [V(motTrong([
    'Lát vào hội thoại là gặp lại cái này đấy.',
    'Đi làm thêm bên đó là dùng cái này suốt.',
    'Nhớ cái này là đỡ đứng hình khi nói chuyện.',
    'Nhân vật trong bài cũng sắp dùng đúng cái này.',
  ], rng) + ' ')];

  // ------------------------------------------------------------------ tong hop am thanh + su that
  /**
   * doan -> { chum:[{s0,n,f0}], N, chu (ban ghi), kyS/kyE (giay audio moi ky tu UTF-16), cc:[{name,args,a}] }
   * kyS: luc ky tu bat dau vang; kyE: luc ky tu "da noi xong" (dau cau = het chum truoc).
   */
  function tongHop(doan, rng, r) {
    const chum = [];
    let cur = 0;
    let chu = '';
    const kyS = [], kyE = [];
    const sach = [], sS = [];
    const cc = [];
    let chumTruocVn = false, coCach = false;
    for (const d of doan) {
      if (d.loai === 'lang') { cur += Math.round(d.ms * SR / 1000); coCach = false; continue; }
      if (d.loai === 'cong-cu') { cc.push({ name: d.name, args: d.args, sauChum: chum.length, aTam: cur }); continue; }
      const hien = d.hien || '', docS = d.doc || '';
      const doc = Array.from(docS);
      const dS = new Array(doc.length), dE = new Array(doc.length);
      const choDau = [];
      let truoc = '', chumTu = -1;
      for (let i = 0; i < doc.length; i++) {
        const c = doc[i];
        const w = trongSo(c, truoc);
        if (w > 0) {
          const laLatin = d.loai === 'vn' && laChu(c);
          if (laLatin && chumTruocVn && coCach) cur += Math.round(0.025 * SR);   // khe 25 ms giua am tiet Viet
          const n = Math.max(1, Math.round(r * w * (d.cham || 1) * SR));
          chum.push({ s0: cur, n, f0: rng.u(110, 140) });
          dS[i] = cur; dE[i] = cur + n;
          choDau.forEach(j => { dS[j] = cur; });
          choDau.length = 0;
          chumTu = chum.length - 1;
          cur += n;
          chumTruocVn = laLatin; coCach = false;
        } else if (laChu(c) && chumTu >= 0) {
          dS[i] = chum[chumTu].s0; dE[i] = chum[chumTu].s0 + chum[chumTu].n;   // kana nho / chu giua am tiet
        } else {
          dE[i] = chumTu >= 0 ? chum[chumTu].s0 + chum[chumTu].n : cur;
          choDau.push(i);
          if (/\s/.test(c)) coCach = true;
          chumTu = laChu(c) ? chumTu : -1;
        }
        truoc = c;
      }
      choDau.forEach(j => { dS[j] = cur; });
      // Ghep chu hien -> chu doc
      const h = Array.from(hien);
      const map = canhChu(h, doc);
      h.forEach((c, i) => {
        const j = map[i];
        const s = j == null ? cur : dS[j], e = j == null ? cur : dE[j];
        for (let u = 0; u < c.length; u++) { kyS.push(s / SR); kyE.push(e / SR); }
      });
      chu += hien;
      // Ban SACH (chu dung nhu kich ban, chua ghi kana / ghi sai) + luc vang moi ky tu: su that de
      // harness do cue khong khop chu (du phong) ban som / muon bao nhieu so voi luc Sensei noi that
      const goc = d.loai === 'jp' && d.kanji ? Array.from(d.kanji) : h;
      const m2 = goc === h ? map : canhChu(goc, doc);
      goc.forEach((c, i) => { const j = m2[i]; sach.push(c); sS.push((j == null ? cur : dS[j]) / SR); });
    }
    cc.forEach(t => { t.a = (t.sauChum < chum.length ? chum[t.sauChum].s0 : cur) / SR; delete t.aTam; });
    const N = cur + Math.round(0.2 * SR);   // 200 ms im lang cuoi luot
    return { chum, N, chu, kyS, kyE, cc, sach: sach.join(''), sS };
  }

  /** Canh chu hien (h) voi chu doc (d): tien to / hau to chung khop dung, phan giua chia deu */
  function canhChu(h, d) {
    const map = new Array(h.length).fill(null);
    if (!d.length) return map;
    const hh = h.map(hira), dd = d.map(hira);
    let p = 0;
    while (p < hh.length && p < dd.length && hh[p] === dd[p]) { map[p] = p; p++; }
    let s = 0;
    while (s < hh.length - p && s < dd.length - p && hh[hh.length - 1 - s] === dd[dd.length - 1 - s]) {
      map[hh.length - 1 - s] = dd.length - 1 - s; s++;
    }
    const hm = hh.length - p - s, dm = dd.length - p - s;
    for (let i = 0; i < hm; i++) map[p + i] = dm > 0 ? p + Math.min(dm - 1, Math.floor(i * dm / hm)) : Math.min(d.length - 1, p);
    return map;
  }

  /** Mau PCM Int16 cua [a, b) tu danh sach chum (hoac tu WAV nap san) */
  function veMau(tt, a, b) {
    const out = new Int16Array(b - a);
    if (tt.wav) { out.set(tt.wav.subarray(a, b)); return out; }
    const tan = 2 * Math.PI / SR;
    const atk = 0.015 * SR, rel = 0.040 * SR;
    for (let k = tt._ctro || 0; k < tt.chum.length; k++) {
      const c = tt.chum[k];
      if (c.s0 + c.n <= a) { tt._ctro = k + 1; continue; }
      if (c.s0 >= b) break;
      const i0 = Math.max(a, c.s0), i1 = Math.min(b, c.s0 + c.n);
      for (let i = i0; i < i1; i++) {
        const j = i - c.s0;
        const env = Math.min(1, j / atk, (c.n - j) / rel);
        const t = j * tan * c.f0;
        const x = 0.25 * env * (Math.sin(t) + 0.5 * Math.sin(2 * t) + 0.25 * Math.sin(3 * t)) / 1.75;
        out[i - a] = Math.max(-32768, Math.min(32767, Math.round(x * 32767)));
      }
    }
    return out;
  }

  function sangBase64(i16) {
    const u8 = new Uint8Array(i16.length * 2);
    const dv = new DataView(u8.buffer);
    for (let i = 0; i < i16.length; i++) dv.setInt16(i * 2, i16[i], true);
    let s = '';
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  }

  // ------------------------------------------------------------------ dong ho (§1.5.1)
  function bayGio() {
    const ae = window.__audioEngine, ctx = ae && ae.outCtx;
    if (!ctx) return null;
    if (window.SenseiKhauHinh && typeof window.SenseiKhauHinh.bayGio === 'function') {
      try { const v = window.SenseiKhauHinh.bayGio(ctx); if (Number.isFinite(v)) return v; } catch (e) {}
    }
    try {
      if (ctx.getOutputTimestamp) {
        const ts = ctx.getOutputTimestamp();
        if (ts && ts.contextTime != null && ts.performanceTime) {
          const v = ts.contextTime + (performance.now() - ts.performanceTime) / 1000;
          if (v >= ctx.currentTime - 0.5 && v <= ctx.currentTime + 0.01) return v;
        }
      }
    } catch (e) {}
    return ctx.currentTime - (ctx.outputLatency || 0) - (ctx.baseLatency || 0);
  }

  // ------------------------------------------------------------------ tieng that (quay video bai giang day du)
  // Khong dung khi khong nap WAV: __moPhong.datTieng(khoa, base64Pcm) / datTiengThoai(idCau, base64Pcm).
  const tiengThat = { turns: {}, thoai: {}, them: {} };
  const noiLuot = [];       // moi luot giang tong hop: { khoa, kind, nhip, loai, lan, text (loi doc cho TTS) }
  const pcmTuB64 = (b64) => {
    const bin = atob(String(b64 || ''));
    const n = Math.floor(bin.length / 2);
    const pcm = new Int16Array(n);
    for (let i = 0; i < n; i++) { const v = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8); pcm[i] = v >= 0x8000 ? v - 0x10000 : v; }
    return pcm;
  };
  /** Chuoi doc cho TTS: tieng Viet nguyen van, tu Nhat theo cach doc (kana), dau cau Nhat -> dau cau Latin */
  function loiDoc(doan) {
    const DAU = { '。': '. ', '、': ', ', '！': '! ', '？': '? ', '・': ' ', '「': ' ', '」': ' ', '『': ' ', '』': ' ', '（': ' ', '）': ' ', '〜': ' ', '～': ' ' };
    return doan.filter(d => d.loai === 'vn' || d.loai === 'jp').map(d => String(d.doc || '').replace(/[。、！？・「」『』（）〜～]/g, c => DAU[c]))
      .join('').replace(/\s+/g, ' ').replace(/\s+([,.!?])/g, '$1').trim();
  }
  /** Co / gian moc thoi gian cua luot tong hop theo do dai WAV that (tuyen tinh theo trong so am tiet) */
  function apWavThat(tt, pcm, khoa) {
    const k = pcm.length / tt.N;
    const nhan = (a) => { for (let i = 0; i < a.length; i++) a[i] *= k; };
    nhan(tt.kyS); nhan(tt.kyE); nhan(tt.sS);
    tt.cc.forEach(c => { c.a *= k; });
    tt.chum = []; tt.wav = pcm; tt.N = pcm.length; tt.heSo = k; tt.khoaTT = khoa;
  }

  // ------------------------------------------------------------------ luot noi
  const dsLuot = [];        // moi luot mo phong da phat (ca luot bi ngat)
  let luotDangPhat = null;
  let demLuot = 0;
  const demKhoa = {};
  const nhatKyGui = [];     // goi app gui di (rut gon) — de soi khi can
  const lenhGiang = [];     // loi dan giang bai DAY DU ({ luc, nhip, kind, text }) — soi mo bai / cau noi / chem
  const hangWav = [];       // WAV nap san (napWav) cho luot giang ke tiep

  const theLuot = () => {
    try { if (window.__motion && typeof window.__motion.luotHienTai === 'function') return window.__motion.luotHienTai(); } catch (e) {}
    return 'mp-' + (demLuot + 1);
  };

  // Luot "thieu": Sensei noi lan man ~6 s ma khong nhac toi muc nao (khong chu Nhat, khong tu khoa cue)
  const KB_LAN_MAN = () => [V('Rồi, phần này tao nói nhanh thôi, mày chịu khó tập trung một chút. ' +
    'Học cái gì cũng vậy, cứ từ từ mà chắc, đừng có vội vàng rồi quên hết. ' +
    'Lúc nãy tao thấy mày hơi lơ đãng đấy, uống miếng nước rồi tỉnh táo lại đi.')];
  /** Loi gia lap cho luot giang (null = binh thuong). lan: lan thu may cua nhip nay (1 = lan dau) */
  function chonLoi(khoa, lan) {
    if (lan > 1 && !TS.loiLai) return null;
    const x = taoRng(bam(khoa + '|loi|' + lan))();
    let tong = 0;
    for (const k of LOI_LUOT) { tong += TS[k] || 0; if (x < tong) return k; }
    return null;
  }

  /** beatGan: nhip cua luot (luot noi tiep sau tool giu nhip cua luot goc) */
  function taoLuot(cl, loai, text, beatGan) {
    const st = window.__lecture && window.__lecture.state ? window.__lecture.state() : {};
    const beat = beatGan || (st && st.current);
    let kb = null, kind = null, them = null, rngThem = null;
    const laGiang = loai === 'giang' || loai === 'giang-tiep';
    if (laGiang) {
      kind = beat && beat.kind;
      const loi = KB[kind] ? (rng) => KB[kind](beat, rng) : KB_TRA_LOI;
      // Quay video: phan "them" (mo bai / cau noi / chem) do app chon NGAU NHIEN moi lan -> neu da nap theo khoa thi dung ban cua luot 1
      const khoaThem = (beat ? beat.index : -1) + '|' + loai + '|' + (((demKhoa[[TS.hat, beat ? beat.index : -1, loai, kind].join('|')]) || 0) + 1);
      them = loai === 'giang' ? (Object.prototype.hasOwnProperty.call(tiengThat.them, khoaThem) ? tiengThat.them[khoaThem] : docLenhThem(text)) : null;
      // Phan them dung rng rieng: rng cua noi dung muc rut dung nhu khi khong co phan them
      kb = !them ? loi : (rng) => [
        them.moBai ? kbMoBai(them.moBai, rngThem) : them.cauNoi ? kbCauNoi(them.cauNoi, rngThem) : null,
        loi(rng),
        them.chem ? kbChem(rngThem) : null,
      ];
    } else if (loai === 'noi-tiep') kb = KB_NOI_TIEP;
    else if (loai === 'cham') kb = () => KB_CHAM(text);
    else if (loai === 'mic') kb = KB_MIC;
    else kb = KB_TRA_LOI;

    const khoa = [TS.hat, beat ? beat.index : -1, loai, kind].join('|');
    demKhoa[khoa] = (demKhoa[khoa] || 0) + 1;
    const lan = demKhoa[khoa];
    const rng = taoRng(bam(khoa + '|' + lan));
    rngThem = taoRng(bam(khoa + '|them|' + lan));
    const loiGL = loai === 'giang' ? chonLoi(khoa, lan) : null;
    if (loiGL === 'thieu') {
      const goc = kb;
      kb = !them ? KB_LAN_MAN : (rng) => { const x = goc(rng); x[1] = KB_LAN_MAN(); return x; };   // giu mo bai / cau noi / chem
    }

    let tt;
    const wav = loai === 'giang' ? hangWav.shift() : null;
    if (wav) {
      const n = wav.pcm.length;
      const chu = String(wav.text || '');
      const kyS = [], kyE = [];
      for (let i = 0; i < chu.length; i++) { kyS.push(i / chu.length * n / SR); kyE.push((i + 1) / chu.length * n / SR); }
      tt = { wav: wav.pcm, chum: [], N: n, chu, kyS, kyE, cc: [], idWav: wav.id, sach: chu, sS: kyS.slice() };
    } else {
      let doan = chuanHoa(kb(rng), rng);
      // luot noi tiep sau tool: tool da goi o luot truoc -> bo
      if (loai === 'giang-tiep') doan = doan.filter(d => d.loai !== 'cong-cu');
      // dut som: ~25% dau kich ban (it nhat 2 doan)
      if (loiGL === 'ngan') doan = doan.slice(0, Math.max(2, Math.round(doan.length * 0.25)));
      tt = tongHop(doan, rng, TS.r);
      // Tieng that (quay video): ghi loi doc cua luot; neu da nap WAV theo khoa thi co gian moc thoi gian theo WAV
      const khoaTT = (beat ? beat.index : -1) + '|' + loai + '|' + lan;
      tt.noi = loiDoc(doan);
      noiLuot.push({ khoa: khoaTT, so: demLuot + 1, them: them || null, kind, nhip: beat ? beat.index : null, loai, lan, text: tt.noi });
      const w = tiengThat.turns[khoaTT];
      if (w && !loiGL) apWavThat(tt, w, khoaTT);
    }
    demLuot++;
    const L0 = {
      so: demLuot, tag: theLuot(), loai, kind, nhip: beat ? beat.index : null, lenh: String(text || '').slice(0, 80),
      them: them ? { moBai: !!them.moBai, cauNoi: !!them.cauNoi, chem: !!them.chem } : null, lan, loi: loiGL,
      chu: tt.chu, kyS: tt.kyS, kyE: tt.kyE, sach: tt.sach, sS: tt.sS, tong: tt.N / SR,
      cc: tt.cc.map(c => ({ name: c.name, args: c.args, a: c.a, wallGui: null })),
      manh: [], chunks: [], batDau: null, tFirst: null, tEnd: null, biNgat: false, xong: false, laWav: !!tt.wav,
      _tt: tt, _rng: rng, _hen: null, _cl: cl, _beat: beat,
    };
    dsLuot.push(L0);
    return L0;
  }

  /** Lap lich stream: chunk audio, manh chu, tool, turnComplete (§4.4) */
  function lapLich(L0) {
    const tt = L0._tt, rng = L0._rng;
    const tre = rng.u(350, 800);             // do tre truoc goi dau (ms)
    const start = performance.now() + tre;
    L0.batDau = start;
    const w = (aSec) => start + Math.max(0, aSec) / TS.nhanh * 1000;
    const ev = [];
    // Loi gia lap thay ca lich: rong / im / chi tool
    if (L0.loi === 'rong' || L0.loi === 'im' || L0.loi === 'chiCc') {
      L0.chunks = [];
      if (L0.loi === 'rong') {
        const nghi = start + rng.u(200, 1500);
        if (rng.co(0.5)) ev.push({ wall: nghi, loai: 'nghi', thu: 0 });
        ev.push({ wall: nghi + 120, loai: 'xong', thu: 3 });
      } else if (L0.loi === 'chiCc') {
        const b = L0._beat || {};
        const kj = b.kind === 'kanji' && b.data && b.data.character;
        const c = kj ? { name: 'write_kanji', args: { character: b.data.character }, a: 0, wallGui: null }
          : { name: 'write_on_board', args: { text: 'Mẹo: nhớ kỹ mục này', style: 'thuong' }, a: 0, wallGui: null };
        L0.cc = [c];
        L0.choTiep = true;   // noi dung toi o luot tiep sau toolResponse (xuLy)
        ev.push({ wall: start + rng.u(200, 900), loai: 'cong-cu', c, thu: 0 });
        ev.push({ wall: start + rng.u(1000, 1300), loai: 'xong', thu: 3 });
      }
      ev.sort((x, y) => x.wall - y.wall || x.thu - y.thu);
      L0._ev = ev; L0._vt = 0;
      luotDangPhat = L0;
      chay(L0);
      return;
    }
    // chunk 40-400 ms
    let s = 0;
    const chunks = [];
    while (s < tt.N) {
      const n = Math.min(tt.N - s, Math.round(rng.u(0.04, 0.4) * SR));
      chunks.push({ s0: s, s1: s + n, a0: s / SR, a1: (s + n) / SR, wall: w(s / SR), di: [], t0: null, t1: null, mat: false });
      s += n;
    }
    const cuoi = chunks.length ? chunks[chunks.length - 1].wall : start;
    // manh chu 2-12 ky tu (khong cat doi cap surrogate)
    const cp = Array.from(tt.chu);
    let off = 0, i = 0, wMin = start, wRieng = -Infinity;
    while (i < cp.length) {
      const k = Math.min(cp.length - i, 2 + Math.floor(rng() * 11));
      const text = cp.slice(i, i + k).join('');
      let aEnd = 0;
      for (let u = off; u < off + text.length; u++) aEnd = Math.max(aEnd, tt.kyE[u] || 0);
      const nguong = aEnd + TS.tre + rng.u(-TS.rung, TS.rung);
      const wall = Math.min(cuoi, Math.max(wMin, w(nguong)));
      const di = rng.co(0.5);
      const m = { text, off, aEnd, wall, di };
      if (di) {
        // Di kem goi audio ke tiep — nhung phai SAU manh rieng gan nhat, giu dung thu tu chu
        const ch = chunks.find(c => c.wall >= wall - 0.5 && c.wall > wRieng);
        if (ch) { m.wall = ch.wall; ch.di.push(m); } else m.di = false;
      }
      wMin = m.wall;
      if (!m.di) { wRieng = m.wall; ev.push({ wall: m.wall, loai: 'manh', m, thu: 2 }); }
      L0.manh.push(m);
      off += text.length; i += k;
    }
    chunks.forEach(c => ev.push({ wall: c.wall, loai: 'chunk', c, thu: 1 }));
    L0.cc.forEach(c => ev.push({ wall: Math.min(cuoi, w(c.a - rng.u(0.3, TS.som))), loai: 'cong-cu', c, thu: 0 }));
    // server dong phien giua luot (~30-60% luot)
    if (L0.loi === 'ngat' && chunks.length > 2) ev.push({ wall: chunks[Math.floor(chunks.length * rng.u(0.3, 0.6))].wall + 1, loai: 'dong', thu: 4 });
    ev.push({ wall: cuoi + 50, loai: 'xong', thu: 3 });
    ev.sort((x, y) => x.wall - y.wall || x.thu - y.thu);
    L0.chunks = chunks;
    L0._ev = ev;
    L0._vt = 0;
    luotDangPhat = L0;
    chay(L0);
  }

  function chay(L0) {
    if (L0.biNgat || L0.xong) return;
    const bay = performance.now();
    const ev = L0._ev;
    while (L0._vt < ev.length && ev[L0._vt].wall <= bay + 1) {
      phat(L0, ev[L0._vt++]);
      if (L0.biNgat || L0.xong) return;
    }
    if (L0._vt < ev.length) L0._hen = setTimeout(() => chay(L0), Math.max(0, ev[L0._vt].wall - performance.now()));
  }

  let demCc = 0;
  let choTiep = null;   // { id, L0, hen }: luot chi co tool, cho toolResponse de noi tiep
  function phat(L0, e) {
    const cl = L0._cl;
    if (e.loai === 'chunk') {
      const c = e.c;
      const data = sangBase64(veMau(L0._tt, c.s0, c.s1));
      const sc = { modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data } }] } };
      if (c.di.length) sc.outputTranscription = { text: c.di.map(m => m.text).join('') };
      const ae = window.__audioEngine;
      const truoc = ae ? ae.scheduledTime : 0;
      cl.handleMessage({ serverContent: sc });
      const sau = ae ? ae.scheduledTime : 0;
      if (ae && sau !== truoc) { c.t1 = sau; c.t0 = sau - (c.s1 - c.s0) / SR; if (L0.tFirst == null) L0.tFirst = c.t0; }
      else c.mat = true;
      c.guiLuc = performance.now();
      c.di.forEach(m => { m.guiLuc = c.guiLuc; });
    } else if (e.loai === 'manh') {
      e.m.guiLuc = performance.now();
      cl.handleMessage({ serverContent: { outputTranscription: { text: e.m.text } } });
    } else if (e.loai === 'cong-cu') {
      e.c.wallGui = performance.now();
      const id = 'mp-cc-' + (++demCc);
      if (L0.choTiep) choTiep = { id, L0, hen: null };   // luot chi co tool: noi dung toi sau toolResponse
      cl.handleMessage({ toolCall: { functionCalls: [{ id, name: e.c.name, args: e.c.args }] } });
    } else if (e.loai === 'nghi') {
      // part suy luan (thought) — modelTurn co mat nhung khong tieng, khong chu
      cl.handleMessage({ serverContent: { modelTurn: { parts: [{ thought: true, text: 'Để xem nên giảng mục này thế nào…' }] } } });
    } else if (e.loai === 'dong') {
      L0.biDong = true;
      dongPhienMP({ reason: 'mô phỏng: server đóng phiên giữa lượt' });
    } else if (e.loai === 'xong') {
      L0.xong = true;
      const ch = L0.chunks.filter(c => c.t1 != null);
      L0.tEnd = ch.length ? ch[ch.length - 1].t1 : null;
      if (luotDangPhat === L0) luotDangPhat = null;
      cl.handleMessage({ serverContent: { turnComplete: true } });
    }
  }

  /** Ngat luot dang phat: 'tu' = luot moi do client gui (con cu ms goi cu), 'chen' = barge-in */
  function ngat(cl, kieu, xong) {
    const L0 = luotDangPhat;
    if (!L0 || L0.xong || L0.biNgat) { if (xong) xong(); return; }
    // tcCu: luot giang cu "vua xong" dung luc luot moi toi -> turnComplete CUA LUOT CU toi sau lan gui moi
    const tcCu = kieu === 'tu' && TS.tcCu > 0 && (L0.loai === 'giang' || L0.loai === 'giang-tiep')
      && taoRng(bam(TS.hat + '|tcCu|' + L0.so))() < TS.tcCu;
    const ket = () => {
      if (L0.xong) { if (xong) xong(); return; }   // da tu xong trong luc cho (cu ms)
      clearTimeout(L0._hen);
      L0.biNgat = true;
      if (luotDangPhat === L0) luotDangPhat = null;
      if (kieu === 'chen') cl.lastClientSendTime = 0;   // > 2 s tu lan gui cuoi -> onBargeIn
      if (tcCu) {
        L0.tcCu = true;
        const ch = L0.chunks.filter(c => c.t1 != null);
        L0.tEnd = ch.length ? ch[ch.length - 1].t1 : null;
        try { cl.handleMessage({ serverContent: { turnComplete: true } }); } catch (e) { console.warn('[mo-phong]', e); }
      } else {
        try { cl.handleMessage({ serverContent: { interrupted: true } }); } catch (e) { console.warn('[mo-phong]', e); }
      }
      if (xong) xong();
    };
    if (kieu === 'tu' && TS.cu > 0) setTimeout(ket, TS.cu); else ket();
  }

  /** Luot moi do client gui: bo luot noi tiep sau tool dang cho (server chi tra loi luot moi nhat) */
  function huyChoTiep() {
    if (!choTiep) return;
    clearTimeout(choTiep.hen);
    choTiep.L0.matTiep = true;
    choTiep = null;
  }

  function batDauLuot(cl, loai, text) {
    huyChoTiep();
    ngat(cl, 'tu');
    const L0 = taoLuot(cl, loai, text);
    // Lap lich SAU goi interrupted cua luot cu (neu co) — tre >= 350 ms > cu
    lapLich(L0);
  }

  function phanLoai(text) {
    const t = String(text || '');
    if (/^\s*\[(LỚP|HỌC TIẾP)/.test(t)) return 'giang';
    if (/^\s*Sensei ơi, em chưa nghe rõ/.test(t)) return 'noi-tiep';
    if (/^\s*\[CHẤM BÀI/.test(t)) return 'cham';
    return 'tra-loi';
  }

  // Dung sau nhip "den": nhip ke tiep vua gui loi thi bam Tam dung (khong phat luot nao)
  let daDung = false;
  let den = TS.den;
  function quaDen() {
    if (den == null) return false;
    const i = window.__lecture && window.__lecture.index ? window.__lecture.index() : -1;
    return i > den;
  }

  function xuLy(cl, p) {
    if (p.clientContent) {
      const cc = p.clientContent;
      const text = (cc.turns && cc.turns[0] && cc.turns[0].parts && cc.turns[0].parts[0] && cc.turns[0].parts[0].text) || '';
      nhatKyGui.push({ luc: performance.now(), loai: cc.turnComplete === true ? 'luot' : 'ghi-chu', text: text.slice(0, 60) });
      if (cc.turnComplete !== true) return;   // ghi chu ngu canh (gio tay): khong tra loi
      const loai = phanLoai(text);
      if (loai === 'giang') {
        const st = window.__lecture && window.__lecture.state ? window.__lecture.state() : {};
        lenhGiang.push({ luc: performance.now(), nhip: st.beat, kind: st.current && st.current.kind, text });
        if (lenhGiang.length > 300) lenhGiang.shift();
      }
      if (loai === 'giang' && quaDen()) {
        huyChoTiep();
        ngat(cl, 'tu');
        daDung = true;
        setTimeout(() => {
          const st = window.__lecture && window.__lecture.state ? window.__lecture.state() : {};
          if (st.lectureState === 'PLAYING') { const n = document.getElementById('autoLectureBtn'); if (n) n.click(); }
        }, 0);
        return;
      }
      batDauLuot(cl, loai, text);
    } else if (p.realtimeInput) {
      const ri = p.realtimeInput;
      if (ri.activityStart) { nhatKyGui.push({ luc: performance.now(), loai: 'mic-mo' }); huyChoTiep(); ngat(cl, 'chen-mic'); }
      else if (ri.activityEnd) { nhatKyGui.push({ luc: performance.now(), loai: 'mic-dong' }); batDauLuot(cl, 'mic', ''); }
      // realtimeInput.audio: bo qua
    } else if (p.toolResponse) {
      // Luot chi co tool (chiCc): server noi tiep noi dung muc SAU toolResponse, nhu model that sau function call
      const ids = ((p.toolResponse.functionResponses) || []).map(r => r && r.id);
      if (choTiep && ids.includes(choTiep.id) && !choTiep.hen) {
        const ct = choTiep;
        const noiTiep = () => {
          if (choTiep !== ct) return;
          if (ct.L0.biNgat) { choTiep = null; return; }
          // luot chi-tool chua toi turnComplete cua no: noi tiep ngay sau do (khong chong hai luot)
          if (!ct.L0.xong) { ct.hen = setTimeout(noiTiep, 100); return; }
          choTiep = null;
          if (luotDangPhat && !luotDangPhat.xong && !luotDangPhat.biNgat) return;   // da co luot khac dang noi
          const L1 = taoLuot(cl, 'giang-tiep', ct.L0.lenh, ct.L0._beat);
          L1.tiepCua = ct.L0.so;
          lapLich(L1);
        };
        ct.hen = setTimeout(noiTiep, taoRng(bam(TS.hat + '|tiep|' + ct.L0.so)).u(300, 900));
      }
    }
  }

  // ------------------------------------------------------------------ lop client mo phong (§4.1)
  let client = null;
  class MoPhongClient extends GeminiLiveClient {
    constructor(o) { super(o); this._gan(); client = this; }
    _gan() {
      this.ws = { readyState: 1, send: (s) => this._nhan(s), close() {} };
      this.isConnected = true;
      this.isSetupComplete = true;
    }
    _nhan(s) {
      try { xuLy(this, typeof s === 'string' ? JSON.parse(s) : s); } catch (e) { console.warn('[mo-phong]', e); }
    }
    connect() { this._gan(); setTimeout(() => this.handleMessage({ setupComplete: {} }), 30); }
    // AN TOAN: client that mo WebSocket toi googleapis trong _moSocket (handover, thu lai setup...).
    // Mo phong KHONG BAO GIO mo socket that: thay bang socket gia + setupComplete gia.
    _moSocket() {
      this._gan();
      this.isSetupComplete = false;
      const ws = this.ws;
      setTimeout(() => { if (this.ws === ws) this.handleMessage({ setupComplete: {} }); }, 30);
    }
    disconnect(g) {
      huyChoTiep();
      const L0 = luotDangPhat;
      if (L0) { clearTimeout(L0._hen); L0.biNgat = true; luotDangPhat = null; }
      const cu = this.ws;
      super.disconnect(g);   // don dep that; socket that se bao onclose -> app onClose
      setTimeout(() => {
        if (this.ws) return;   // da connect() lai
        try { this.onClose({ code: 1000, reason: '', target: cu }); } catch (e) { console.warn('[mo-phong]', e); }
        // ?noLive khong co key nen app khong tu vao lai duoc: mo phong tu noi lai
        setTimeout(() => { if (!this.ws) this._gan(); }, 300);
      }, 20);
    }
  }
  /** Server dong phien (onClose that cua app). noiLai (mac dinh true): 300 ms sau tu co "ket noi" lai */
  function dongPhienMP(opts = {}) {
    const cl = client;
    if (!cl) return false;
    huyChoTiep();
    const L0 = luotDangPhat;
    if (L0) { clearTimeout(L0._hen); L0.biNgat = true; luotDangPhat = null; }
    const ws = cl.ws;
    cl.ws = null; cl.isConnected = false; cl.isSetupComplete = false; cl.isModelTurnActive = false;
    cl.pendingQueue = []; cl.goAwayPending = false;
    nhatKyGui.push({ luc: performance.now(), loai: 'dong-phien' });
    try { cl.onClose({ code: opts.code || 1006, reason: opts.reason || 'mô phỏng đóng phiên', target: ws }); } catch (e) { console.warn('[mo-phong]', e); }
    if (opts.noiLai !== false) setTimeout(() => { if (!cl.ws) cl._gan(); }, 300);
    return true;
  }
  window.GeminiLiveClient = MoPhongClient;
  // eslint-disable-next-line no-global-assign
  GeminiLiveClient = MoPhongClient;   // doi rang buoc lop toan cuc (script thuong, chay truoc DOMContentLoaded)

  // ------------------------------------------------------------------ giong thoai tong hop
  const thoai = {};          // lineId -> { pcm, tokens:[{id,t,dau}], dur, t0 }
  const clipCua = new WeakMap();
  let beatsDaNap = null;

  function tongHopThoai(line, rng) {
    const r = TS.r;
    const chum = [];
    let cur = Math.round(0.1 * SR);          // 100 ms im lang dau clip
    const toks = [];
    (line.tokens || []).forEach(t => {
      const text = String(t.text || '');
      const dau = !laJP(text) ? true : Array.from(text).every(c => !laKana(c) && !laHan(c));
      if (dau) { toks.push({ id: t.id, t: cur / SR, dau: true }); cur += Math.round(0.12 * SR); return; }
      const doc = Array.from(String(t.furigana || t.text || ''));
      toks.push({ id: t.id, t: cur / SR, dau: false });
      let truoc = '';
      doc.forEach(c => {
        const w = trongSo(c, truoc);
        truoc = c;
        if (w <= 0) return;
        const n = Math.round(r * w * SR);
        chum.push({ s0: cur, n, f0: rng.u(170, 230) });
        cur += n;
      });
    });
    const N = cur + Math.round(0.15 * SR);
    const i16 = veMau({ chum }, 0, N);
    const u8 = new Uint8Array(N * 2);
    const dv = new DataView(u8.buffer);
    for (let i = 0; i < N; i++) dv.setInt16(i * 2, i16[i], true);
    return { pcm: u8, tokens: toks, dur: N / SR, t0: null, lanPhat: [] };
  }

  function bocClip() {
    const ae = window.__audioEngine;
    if (!ae || ae.__moPhongBoc || typeof ae.playPcmClip !== 'function') return;
    const goc = ae.playPcmClip.bind(ae);
    ae.playPcmClip = (clip, meta) => {
      const p = goc(clip, meta);
      const id = clip && typeof clip === 'object' ? clipCua.get(clip) : null;
      if (id && thoai[id] && ae.clipPlaying && ae.outCtx) {
        const nhip = window.__lecture && window.__lecture.index ? window.__lecture.index() : null;
        const tBd = ae.clipT0 || ae.outCtx.currentTime;
        thoai[id].t0 = tBd;
        thoai[id].lanPhat.push({ t0: tBd, nhip });
      }
      return p;
    };
    ae.__moPhongBoc = true;
  }

  function napThoai() {
    bocClip();
    const L = window.__lecture;
    if (!L || !L.beats || !L.datGiongThoai) return 0;
    const beats = L.beats();
    if (!beats || beats === beatsDaNap) return 0;
    beatsDaNap = beats;
    const can = [];
    beats.filter(b => b.kind === 'kaiwa-run' || b.kind === 'kaiwa').forEach(b => {
      (Array.isArray(b.data) ? b.data : [b.data]).forEach(line => { if (line && line.id && !thoai[line.id] && !can.includes(line)) can.push(line); });
    });
    // Moi cau mot lan setTimeout: khong thanh mot tac vu dai
    const buoc = () => {
      const line = can.shift();
      if (!line) return;
      if (!thoai[line.id]) {
        const x = tongHopThoai(line, taoRng(bam(TS.hat + '|thoai|' + line.id)));
        const that = tiengThat.thoai[line.id];
        if (that) {   // WAV that: giu thu tu va ti le moc token cua ban tong hop, gian ra theo do dai that
          const k = that.length / (x.dur * SR);
          x.tokens.forEach(m => { m.t *= k; });
          const u8 = new Uint8Array(that.length * 2), dv = new DataView(u8.buffer);
          for (let i = 0; i < that.length; i++) dv.setInt16(i * 2, that[i], true);
          x.pcm = u8; x.dur = that.length / SR; x.that = true;
        }
        thoai[line.id] = x;
        clipCua.set(x.pcm, line.id);
        try { L.datGiongThoai(line.id, x.pcm); } catch (e) { console.warn('[mo-phong]', e); }
      }
      if (can.length) setTimeout(buoc, 0);
    };
    buoc();
    return can.length + 1;
  }
  setInterval(napThoai, 250);

  // ------------------------------------------------------------------ nhan "MÔ PHỎNG"
  function ganNhan() {
    if (document.getElementById('moPhongNhan') || !document.body) return;
    const n = document.createElement('div');
    n.id = 'moPhongNhan';
    n.textContent = 'MÔ PHỎNG';
    n.setAttribute('aria-hidden', 'true');
    n.style.cssText = 'position:fixed;top:4px;left:6px;z-index:9999;pointer-events:none;'
      + 'font:600 11px/1 system-ui,sans-serif;letter-spacing:.08em;color:var(--muted,#6b6355);opacity:.85;';
    document.body.appendChild(n);
  }
  if (document.body) ganNhan(); else document.addEventListener('DOMContentLoaded', ganNhan);

  // ------------------------------------------------------------------ su that + dieu khien (window.__moPhong)
  // Tim luot theo the (id luot cua motion.js luc gui). Nhieu luot cung the (luot cham bai
  // luc cho: motion khong mo luot moi) -> k chon luot thu k, mac dinh luot dau (luot motion theo doi)
  const tim = (luot, k) => {
    const ds = dsLuot.filter(x => x.tag === luot);
    return ds[k || 0] || null;
  };
  /** audio (giay trong luot) -> thoi diem AudioContext theo bang chunk that */
  function thoiDiemCuaA(L0, a) {
    if (!L0 || a == null) return null;
    const ch = L0.chunks;
    for (const c of ch) {
      if (a >= c.a0 && a < c.a1) return c.t0 == null ? null : c.t0 + (a - c.a0);
    }
    const cu = ch.filter(c => c.t1 != null);
    if (cu.length && a >= cu[cu.length - 1].a1) return cu[cu.length - 1].t1 + (a - cu[cu.length - 1].a1);
    return null;
  }
  const tomTat = (L0) => ({
    so: L0.so, tag: L0.tag, loai: L0.loai, kind: L0.kind, nhip: L0.nhip, lenh: L0.lenh, them: L0.them,
    lan: L0.lan, loi: L0.loi || null, tiepCua: L0.tiepCua || null, matTiep: !!L0.matTiep, tcCu: !!L0.tcCu, biDong: !!L0.biDong,
    // tieng / chu DA GUI cho app (luot bi ngat chi gui mot phan)
    amGui: +L0.chunks.filter(c => c.guiLuc != null).reduce((a, c) => a + (c.a1 - c.a0), 0).toFixed(3),
    chuGui: L0.manh.filter(m => m.guiLuc != null).map(m => m.text).join(''),
    chu: L0.chu, tong: L0.tong, soManh: L0.manh.length, soChunk: L0.chunks.length,
    chunkMat: L0.chunks.filter(c => c.mat).length,
    batDau: L0.batDau, tFirst: L0.tFirst, tEnd: L0.tEnd, biNgat: L0.biNgat, xong: L0.xong, laWav: L0.laWav,
    congCu: L0.cc.map(c => ({ name: c.name, args: c.args, a: c.a, T: thoiDiemCuaA(L0, c.a), wallGui: c.wallGui })),
  });

  window.__moPhong = {
    thamSo: { ...TS },
    /** Luc AudioContext ky tu thu viTri (UTF-16, trong ban ghi cua luot) bat dau vang. k: luot thu k cung the */
    thoiDiemThat(luot, viTri, k) {
      const L0 = tim(luot, k);
      if (!L0 || L0.laWav || viTri == null || viTri < 0 || viTri >= L0.kyS.length) return null;
      return thoiDiemCuaA(L0, L0.kyS[viTri]);
    },
    /** Luc AudioContext cua vi tri tool trong kich ban (tieng noi ngay sau tool) */
    thoiDiemCongCu(luot, name, k, thu) {
      const L0 = tim(luot, k);
      if (!L0) return null;
      const c = L0.cc.filter(x => x.name === name)[thu || 0];
      return c ? thoiDiemCuaA(L0, c.a) : null;
    },
    /** Danh sach luot (tom tat); chiTiet=true kem manh chu + bang chunk */
    luot(chiTiet) {
      return dsLuot.map(L0 => {
        const t = tomTat(L0);
        if (chiTiet) {
          t.manh = L0.manh.map(m => ({ text: m.text, off: m.off, aEnd: m.aEnd, di: m.di, guiLuc: m.guiLuc }));
          t.chunks = L0.chunks.map(c => ({ a0: c.a0, a1: c.a1, t0: c.t0, t1: c.t1, mat: c.mat, guiLuc: c.guiLuc }));
          // ban sach + luc vang that (AudioContext) cua tung ky tu (code point) — null: chua phat toi
          t.sach = L0.sach || '';
          t.sT = (L0.sS || []).map(a => { const v = thoiDiemCuaA(L0, a); return v == null ? null : +v.toFixed(4); });
        }
        return t;
      });
    },
    /**
     * Moc karaoke that cua cau thoai: t (giay tu dau clip), T = t0 + t. t0 = luc clip bat dau phat
     * o lan phat thu k (mac dinh lan cuoi); lanPhat: moi lan phat { t0, nhip } (kaiwa-run roi kaiwa)
     */
    karaokeThat(lineId, k) {
      const x = thoai[lineId];
      if (!x) return null;
      const lp = x.lanPhat;
      const t0 = lp.length ? lp[k == null ? lp.length - 1 : k].t0 : null;
      return { t0, dur: x.dur, lanPhat: lp.slice(), tokens: x.tokens.map(m => ({ id: m.id, t: m.t, dau: m.dau, T: t0 == null ? null : t0 + m.t })) };
    },
    dangPhat: () => !!(luotDangPhat && !luotDangPhat.xong && !luotDangPhat.biNgat),
    get daDung() { return daDung; },
    bayGio,
    nhatKyGui: () => nhatKyGui.slice(),
    /** Loi dan giang bai day du app da gui (moi nhip mot muc) */
    lenhGiang: () => lenhGiang.slice(),
    napThoai: () => { beatsDaNap = null; return napThoai(); },
    /** WAV 24 kHz mono Int16 (base64, khong header) cho luot giang ke tiep — chi de xem, khong co su that */
    napWav(id, base64Pcm, text) {
      const bin = atob(String(base64Pcm || ''));
      const n = Math.floor(bin.length / 2);
      const pcm = new Int16Array(n);
      for (let i = 0; i < n; i++) { const v = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8); pcm[i] = v >= 0x8000 ? v - 0x10000 : v; }
      hangWav.push({ id, pcm, text });
      return n / SR;
    },
    /** Quay video: loi doc cua cac luot giang da tong hop (de tao TTS) va nap WAV that theo khoa */
    noiLuot: () => noiLuot.map(x => ({ ...x })),
    /** Ep phan "them" cua luot (null = khong co) de lap lai dung kich ban luot 1 */
    datThem(khoa, them) { tiengThat.them[khoa] = them; },
    datTieng(khoa, base64Pcm) { const p = pcmTuB64(base64Pcm); tiengThat.turns[khoa] = p; return p.length / SR; },
    datTiengThoai(idCau, base64Pcm) { const p = pcmTuB64(base64Pcm); tiengThat.thoai[idCau] = p; delete thoai[idCau]; beatsDaNap = null; return p.length / SR; },
    /** Server dong phien (onClose that cua app). noiLai (mac dinh true): 300 ms sau tu co "ket noi" lai */
    dongPhien: (opts) => dongPhienMP(opts),
    /** Hoc vien noi chen (server bao interrupted > 2 s sau lan gui cuoi -> onBargeIn) */
    ngatLoi() { if (!client) return false; ngat(client, 'chen'); return true; },
    /** Sensei goi tool ngay luc nay (kiem thu T12); tra ve ket qua app / san khau tra lai */
    goiCongCu(name, args) {
      if (!client) return null;
      let kq = null;
      const goc = client.onToolCall;
      try {
        client.onToolCall = (call) => { kq = goc(call); return kq; };
        client.handleMessage({ toolCall: { functionCalls: [{ id: 'mp-cc-' + (++demCc), name, args: args || {} }] } });
      } finally { client.onToolCall = goc; }
      return kq;
    },
    /** Doi nhip dung ("den") luc dang chay; null = chay het bai */
    datDen(i) { den = i == null ? null : Number(i); daDung = false; return den; },
  };
})();
