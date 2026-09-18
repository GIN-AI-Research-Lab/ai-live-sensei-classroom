/**
 * Sensei Art — thư viện hình minh hoạ vẽ tay bằng SVG
 *
 * Vì sao không dùng ảnh chụp: ảnh stock cho từ trừu tượng gần như luôn lạc đề
 * (một câu hỏi về trợ từ mà minh hoạ bằng ảnh người mặc vest thì vô nghĩa).
 * Hình vẽ ở đây bám đúng NGHĨA của từ nên học viên nhìn là hình dung ra ngay.
 *
 * Tra cứu theo chính từ tiếng Nhật (kanji hoặc kana). Không có thì trả về null
 * và giao diện tự lùi về thẻ chữ lớn.
 */
(function () {
  'use strict';

  // Bảng màu giấy be — trùng với biến CSS của app
  const INK = '#453e34';
  const ACCENT = '#c96442';
  const SAGE = '#6b8a5e';
  const GOLD = '#c0952f';
  const PAPER = '#f0ebe1';

  /** Bọc thân hình vẽ vào khung SVG chuẩn */
  function art(body) {
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" ' +
           'fill="none" stroke-linecap="round" stroke-linejoin="round" ' +
           'role="img" aria-hidden="true">' + body + '</svg>';
  }

  /** Người: đầu + thân. cx = tâm ngang, s = tỉ lệ */
  function person(cx, cy, color, scale) {
    const s = scale || 1;
    const r = 9 * s;
    const headY = cy - 16 * s;
    return `<circle cx="${cx}" cy="${headY}" r="${r}" stroke="${color}" stroke-width="${3 * s}"/>` +
           `<path d="M ${cx - 15 * s} ${cy + 22 * s} v-${10 * s} a ${15 * s} ${15 * s} 0 0 1 ${30 * s} 0 v${10 * s}" ` +
           `stroke="${color}" stroke-width="${3 * s}"/>`;
  }

  const ART = {
    // ---------- đại từ nhân xưng ----------
    'わたし': art(
      person(42, 46, INK, 1) +
      `<path d="M62 44 L50 50" stroke="${ACCENT}" stroke-width="3"/>` +
      `<circle cx="65" cy="43" r="4" fill="${ACCENT}"/>` +
      `<text x="50" y="92" font-size="13" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">TÔI</text>`),

    'あなた': art(
      person(34, 46, INK, .9) +
      `<path d="M52 46 L72 46" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M66 40 L73 46 L66 52" stroke="${ACCENT}" stroke-width="3"/>` +
      person(88, 46, ACCENT, .55) +
      `<text x="50" y="92" font-size="12" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">BẠN</text>`),

    'あのひと': art(
      person(28, 44, INK, .7) +
      `<path d="M46 44 h26" stroke="${ACCENT}" stroke-width="2.5" stroke-dasharray="4 4"/>` +
      person(84, 44, ACCENT, .85) +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">người kia</text>`),

    'みなさん': art(
      person(24, 48, INK, .72) + person(50, 44, ACCENT, .82) + person(76, 48, SAGE, .72) +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">mọi người</text>`),

    // ---------- nghề nghiệp ----------
    'せんせい': art(
      `<rect x="10" y="14" width="52" height="38" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M18 26 h30 M18 34 h22 M18 42 h26" stroke="${SAGE}" stroke-width="2.5"/>` +
      person(80, 58, ACCENT, .78) +
      `<text x="50" y="92" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">thầy / cô</text>`),

    'きょうし': art(
      `<rect x="10" y="14" width="52" height="38" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M18 26 h30 M18 34 h22" stroke="${SAGE}" stroke-width="2.5"/>` +
      person(80, 58, ACCENT, .78) +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">giáo viên</text>`),

    'がくせい': art(
      person(50, 40, INK, 1) +
      `<rect x="30" y="58" width="40" height="22" rx="3" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 58 v22 M36 66 h10 M56 66 h8" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<text x="50" y="94" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">học sinh</text>`),

    'かいしゃいん': art(
      person(50, 36, INK, .95) +
      `<path d="M50 30 l-6 8 6 14 6-14 z" fill="${ACCENT}" stroke="none"/>` +
      `<rect x="26" y="60" width="48" height="24" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M42 60 v-5 h16 v5" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M26 70 h48" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<text x="50" y="96" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">nhân viên</text>`),

    'ぎんこういん': art(
      `<path d="M14 40 L50 18 L86 40" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M22 40 v32 M38 40 v32 M54 40 v32 M70 40 v32" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M12 76 h76" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="50" cy="56" r="9" stroke="${GOLD}" stroke-width="3"/>` +
      `<text x="50" y="60" font-size="11" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">¥</text>` +
      `<text x="50" y="94" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">ngân hàng</text>`),

    'いしゃ': art(
      person(50, 38, INK, .95) +
      `<path d="M38 52 v10 a12 12 0 0 0 24 0 v-6" stroke="${ACCENT}" stroke-width="3"/>` +
      `<circle cx="62" cy="68" r="6" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M44 74 h12 M50 68 v12" stroke="${SAGE}" stroke-width="3"/>` +
      `<text x="50" y="96" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">bác sĩ</text>`),

    'けんきゅうしゃ': art(
      `<path d="M40 78 h30" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M55 78 v-14" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M55 64 l-12 -18 a10 10 0 0 1 18 -8 l8 14" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="46" cy="30" r="12" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M22 78 h12" stroke="${SAGE}" stroke-width="3"/>` +
      `<text x="50" y="94" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">nghiên cứu</text>`),

    'エンジニア': art(
      `<circle cx="44" cy="44" r="17" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="44" cy="44" r="6" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M44 21 v-7 M44 74 v-7 M21 44 h-7 M74 44 h-7 M60 28 l5-5 M23 65 l5-5 M60 60 l5 5 M23 23 l5 5" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M66 70 l14 14" stroke="${ACCENT}" stroke-width="5"/>` +
      `<path d="M62 62 a7 7 0 1 0 8 8" stroke="${ACCENT}" stroke-width="4"/>` +
      `<text x="50" y="96" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">kỹ sư</text>`),

    // ---------- nơi chốn ----------
    'だいがく': art(
      `<path d="M10 38 L50 16 L90 38" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M20 38 v34 M36 38 v34 M64 38 v34 M80 38 v34" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M8 76 h84" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M44 76 v-20 h12 v20" stroke="${ACCENT}" stroke-width="3"/>` +
      `<text x="50" y="94" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">đại học</text>`),

    'びょういん': art(
      `<rect x="20" y="26" width="60" height="50" rx="4" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 34 v18 M41 43 h18" stroke="${ACCENT}" stroke-width="6"/>` +
      `<rect x="30" y="58" width="12" height="10" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<rect x="58" y="58" width="12" height="10" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<path d="M14 76 h72" stroke="${INK}" stroke-width="3"/>` +
      `<text x="50" y="94" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">bệnh viện</text>`),

    // ---------- đồ vật & khái niệm ----------
    'でんき': art(
      `<path d="M50 16 a20 20 0 0 1 12 36 v8 H38 v-8 a20 20 0 0 1 12 -36 z" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 68 h20 M42 76 h16" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M50 26 v18" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M22 30 l-8 -6 M78 30 l8 -6 M18 52 h-8 M82 52 h8" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<text x="50" y="94" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">điện</text>`),

    'なまえ': art(
      `<rect x="14" y="26" width="72" height="44" rx="5" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="34" cy="44" r="8" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M24 60 a10 10 0 0 1 20 0" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M54 40 h22 M54 50 h16 M54 60 h22" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<text x="50" y="88" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">tên</text>`),

    'だれ': art(
      person(50, 44, INK, 1) +
      `<text x="50" y="40" font-size="30" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      `<text x="50" y="92" font-size="12" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">AI?</text>`),

    'はい': art(
      `<circle cx="50" cy="46" r="30" stroke="${SAGE}" stroke-width="4"/>` +
      `<path d="M36 46 l10 11 19 -22" stroke="${SAGE}" stroke-width="6"/>` +
      `<text x="50" y="92" font-size="12" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">VÂNG</text>`),

    'いいえ': art(
      `<circle cx="50" cy="46" r="30" stroke="${ACCENT}" stroke-width="4"/>` +
      `<path d="M38 34 l24 24 M62 34 l-24 24" stroke="${ACCENT}" stroke-width="6"/>` +
      `<text x="50" y="92" font-size="12" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">KHÔNG</text>`),

    'さい': art(
      `<rect x="20" y="46" width="60" height="30" rx="4" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M20 58 h60" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M34 46 v-10 M50 46 v-12 M66 46 v-10" stroke="${GOLD}" stroke-width="3"/>` +
      `<path d="M34 34 a3 4 0 1 0 0 -1 M50 32 a3 4 0 1 0 0 -1 M66 34 a3 4 0 1 0 0 -1" fill="${GOLD}" stroke="none"/>` +
      `<text x="50" y="94" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">tuổi</text>`),

    'はじめまして': art(
      person(28, 48, INK, .8) + person(72, 48, ACCENT, .8) +
      `<path d="M40 62 a10 8 0 0 1 20 0" stroke="${SAGE}" stroke-width="3"/>` +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">chào lần đầu</text>`),
  };

  // Một số từ dùng chung hình
  ART['私'] = ART['わたし'];
  ART['貴方'] = ART['あなた'];
  ART['あの人'] = ART['あのひと'];
  ART['皆さん'] = ART['みなさん'];
  ART['先生'] = ART['せんせい'];
  ART['教師'] = ART['きょうし'];
  ART['学生'] = ART['がくせい'];
  ART['会社員'] = ART['かいしゃいん'];
  ART['社員'] = ART['かいしゃいん'];
  ART['銀行員'] = ART['ぎんこういん'];
  ART['医者'] = ART['いしゃ'];
  ART['研究者'] = ART['けんきゅうしゃ'];
  ART['大学'] = ART['だいがく'];
  ART['病院'] = ART['びょういん'];
  ART['電気'] = ART['でんき'];
  ART['名前'] = ART['なまえ'];
  ART['誰'] = ART['だれ'];
  ART['どなた'] = ART['だれ'];
  ART['〜歳'] = ART['さい'];
  ART['何歳'] = ART['さい'];
  ART['初めまして'] = ART['はじめまして'];
  ART['わたしたち'] = ART['みなさん'];
  ART['私たち'] = ART['みなさん'];


  // ---------- hậu tố xưng hô & cụm xã giao ----------
  ART['さん'] = art(
    `<rect x="16" y="30" width="68" height="40" rx="6" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
    `<path d="M28 44 h30 M28 54 h20" stroke="${SAGE}" stroke-width="2.5"/>` +
    `<circle cx="70" cy="46" r="7" stroke="${ACCENT}" stroke-width="3"/>` +
    `<path d="M62 60 a8 8 0 0 1 16 0" stroke="${ACCENT}" stroke-width="3"/>` +
    `<text x="50" y="88" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">tên + san</text>`);

  ART['ちゃん'] = art(
    `<circle cx="50" cy="40" r="15" stroke="${ACCENT}" stroke-width="3"/>` +
    `<circle cx="45" cy="38" r="2.2" fill="${INK}" stroke="none"/>` +
    `<circle cx="56" cy="38" r="2.2" fill="${INK}" stroke="none"/>` +
    `<path d="M45 46 a6 5 0 0 0 11 0" stroke="${INK}" stroke-width="2.5"/>` +
    `<path d="M36 28 l-7 -7 M64 28 l7 -7" stroke="${GOLD}" stroke-width="3"/>` +
    `<path d="M34 76 v-8 a16 16 0 0 1 32 0 v8" stroke="${ACCENT}" stroke-width="3"/>` +
    `<text x="50" y="94" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">bé / em nhỏ</text>`);

  ART['くん'] = art(
    `<circle cx="50" cy="42" r="14" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M33 34 a17 12 0 0 1 34 0 z" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
    `<path d="M33 34 h-8" stroke="${SAGE}" stroke-width="3"/>` +
    `<path d="M34 78 v-8 a16 16 0 0 1 32 0 v8" stroke="${INK}" stroke-width="3"/>` +
    `<text x="50" y="94" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">cậu / em trai</text>`);

  ART['じん'] = art(
    `<circle cx="36" cy="44" r="24" stroke="${SAGE}" stroke-width="3"/>` +
    `<path d="M12 44 h48 M36 20 a30 24 0 0 1 0 48 a30 24 0 0 1 0 -48" stroke="${SAGE}" stroke-width="2.5"/>` +
    person(76, 50, ACCENT, .62) +
    `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">người nước ~</text>`);

  ART['どうぞよろしく'] = art(
    `<path d="M22 34 a9 9 0 1 1 .1 0" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M10 70 l8 -20 a10 10 0 0 1 16 4 l6 16" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M78 34 a9 9 0 1 1 .1 0" stroke="${ACCENT}" stroke-width="3"/>` +
    `<path d="M90 70 l-8 -20 a10 10 0 0 0 -16 4 l-6 16" stroke="${ACCENT}" stroke-width="3"/>` +
    `<path d="M40 58 q10 8 20 0" stroke="${SAGE}" stroke-width="3"/>` +
    `<text x="50" y="90" font-size="10" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">cúi chào</text>`);

  ART['しつれいですが'] = art(
    person(36, 52, INK, .9) +
    `<path d="M52 44 v-18" stroke="${ACCENT}" stroke-width="4"/>` +
    `<path d="M52 26 a5 5 0 1 1 .1 0" stroke="${ACCENT}" stroke-width="3"/>` +
    `<path d="M64 16 h26 a4 4 0 0 1 4 4 v16 a4 4 0 0 1 -4 4 h-16 l-8 8 v-8 h-2 a4 4 0 0 1 -4 -4 v-16 a4 4 0 0 1 4 -4 z" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
    `<text x="78" y="34" font-size="16" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
    `<text x="50" y="94" font-size="9.5" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">xin lỗi cho hỏi</text>`);

  ART['〜さん'] = ART['さん'];
  ART['〜ちゃん'] = ART['ちゃん'];
  ART['〜くん'] = ART['くん'];
  ART['〜君'] = ART['くん'];
  ART['〜じん'] = ART['じん'];
  ART['〜人'] = ART['じん'];
  ART['どうぞよろしくお願いします'] = ART['どうぞよろしく'];
  ART['どうぞよろしくおねがいします'] = ART['どうぞよろしく'];
  ART['失礼ですが'] = ART['しつれいですが'];

  /* ======================================================================
     GỐC CHỮ HÁN — hình vẽ cho thấy chữ bắt nguồn từ đâu.
     Đây là cách nhớ Kanji hiệu quả nhất: nhớ CÂU CHUYỆN thay vì nhớ nét.
     ====================================================================== */
  const ART_KANJI = {
    '人': {
      svg: art(
        `<path d="M50 20 L30 78 M50 20 L70 78" stroke="${INK}" stroke-width="7"/>` +
        `<circle cx="50" cy="14" r="7" stroke="${ACCENT}" stroke-width="3" stroke-dasharray="3 3"/>` +
        `<path d="M50 21 v14" stroke="${ACCENT}" stroke-width="2.5" stroke-dasharray="3 3"/>`),
      note: 'Hình một người đang sải bước — hai nét chính là hai chân.'
    },
    '先': {
      svg: art(
        `<path d="M26 64 q8 -14 20 -12 q12 2 10 12 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
        `<circle cx="30" cy="48" r="2.5" fill="${ACCENT}" stroke="none"/>` +
        `<circle cx="38" cy="45" r="2.5" fill="${ACCENT}" stroke="none"/>` +
        `<path d="M70 34 L58 78 M70 34 L82 78" stroke="${INK}" stroke-width="5"/>` +
        `<path d="M50 72 h14" stroke="${SAGE}" stroke-width="3" stroke-dasharray="4 3"/>`),
      note: 'Bàn chân đặt PHÍA TRƯỚC một người → đi trước, trước tiên.'
    },
    '生': {
      svg: art(
        `<path d="M14 74 h72" stroke="${INK}" stroke-width="5"/>` +
        `<path d="M50 74 v-34" stroke="${SAGE}" stroke-width="5"/>` +
        `<path d="M50 44 q-18 -6 -20 -22 q18 2 20 22" stroke="${SAGE}" stroke-width="3" fill="none"/>` +
        `<path d="M50 50 q18 -6 20 -22 q-18 2 -20 22" stroke="${SAGE}" stroke-width="3" fill="none"/>`),
      note: 'Mầm cây nhú lên khỏi mặt đất → sinh ra, sống, tươi mới.'
    },
    '学': {
      svg: art(
        `<path d="M16 34 L50 14 L84 34" stroke="${INK}" stroke-width="4"/>` +
        `<path d="M22 34 h56" stroke="${INK}" stroke-width="3"/>` +
        `<circle cx="50" cy="50" r="9" stroke="${ACCENT}" stroke-width="3"/>` +
        `<path d="M38 76 v-8 a12 12 0 0 1 24 0 v8" stroke="${ACCENT}" stroke-width="3"/>` +
        `<path d="M30 46 l-6 6 M70 46 l6 6" stroke="${GOLD}" stroke-width="2.5"/>`),
      note: 'Đứa trẻ ngồi DƯỚI MÁI NHÀ (trường) → học hành.'
    },
    '会': {
      svg: art(
        `<path d="M14 40 L50 14 L86 40" stroke="${INK}" stroke-width="4"/>` +
        person(34, 62, ACCENT, .6) + person(66, 62, SAGE, .6) +
        `<path d="M42 74 q8 6 16 0" stroke="${GOLD}" stroke-width="2.5"/>`),
      note: 'Mọi người TỤ dưới một mái nhà → gặp gỡ, hội họp, công ty.'
    },
    '社': {
      svg: art(
        `<path d="M12 28 h30 M27 28 v46" stroke="${INK}" stroke-width="4"/>` +
        `<path d="M16 42 h22" stroke="${INK}" stroke-width="3"/>` +
        `<path d="M18 74 h18" stroke="${INK}" stroke-width="3"/>` +
        `<path d="M64 74 v-28 M52 74 h24" stroke="${SAGE}" stroke-width="5"/>` +
        `<path d="M56 56 h16" stroke="${SAGE}" stroke-width="4"/>`),
      note: 'Bàn thờ (示) cạnh gò ĐẤT (土) → đền thờ của làng, nơi dân tụ họp → xã hội, công ty.'
    },
    '名': {
      svg: art(
        `<path d="M46 16 a22 22 0 1 0 8 40 a17 17 0 1 1 -8 -40 z" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
        `<rect x="34" y="58" width="32" height="24" rx="3" stroke="${ACCENT}" stroke-width="4"/>` +
        `<path d="M42 70 h16" stroke="${ACCENT}" stroke-width="3"/>`),
      note: 'Trời TỐI (夕 = chiều tối) nên phải dùng MIỆNG (口) gọi tên nhau → tên gọi.'
    },
    '私': {
      svg: art(
        `<path d="M14 40 h26 M27 24 v50 M14 56 q14 2 26 -8" stroke="${INK}" stroke-width="4"/>` +
        `<path d="M58 34 q12 -4 22 4 q-10 10 -22 6 z" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
        `<path d="M68 44 v30 M56 74 h24" stroke="${ACCENT}" stroke-width="4"/>`),
      note: 'Bó LÚA (禾) khoanh về phía mình (厶) → phần thóc riêng của ta → tôi, riêng tư.'
    },
  };

  window.SenseiArt = {
    /** Hình gốc chữ Hán + câu chuyện để nhớ */
    kanji(char) {
      const k = ART_KANJI[String(char || '').trim()];
      return k || null;
    },
    /** Trả về chuỗi SVG cho từ, hoặc null nếu chưa vẽ */
    get(...words) {
      for (const w of words) {
        if (!w) continue;
        const key = String(w).trim();
        if (ART[key]) return ART[key];
      }
      return null;
    },
    has(...words) {
      return !!this.get(...words);
    },
    count() {
      return Object.keys(ART).length;
    },
    /**
     * Nạp thêm tu vung tu cac tep minh hoa khac (vd js/illustrations-n5-batch1.js).
     * Tach rieng tep de nhieu nguoi/agent cung ve song song ma khong dam vao
     * nhau — moi tep chi tu goi extend() voi phan cua minh, khong ai sua
     * truc tiep vao ART trong file nay.
     */
    extend(entries) {
      Object.assign(ART, entries);
    },
  };
})();
