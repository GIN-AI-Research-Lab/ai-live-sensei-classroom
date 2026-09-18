/**
 * Sensei Art — lo minh hoa bo sung N3 (lo 5/6): bai 15-18.
 */
(function () {
  'use strict';
  if (!window.SenseiArt || !window.SenseiArt.extend) return;

  const INK = '#453e34';
  const ACCENT = '#c96442';
  const SAGE = '#6b8a5e';
  const GOLD = '#c0952f';
  const PAPER = '#f0ebe1';

  function art(body) {
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" ' +
           'fill="none" stroke-linecap="round" stroke-linejoin="round" ' +
           'role="img" aria-hidden="true">' + body + '</svg>';
  }

  function person(cx, cy, color, scale) {
    const s = scale || 1;
    const r = 9 * s;
    const headY = cy - 16 * s;
    return `<circle cx="${cx}" cy="${headY}" r="${r}" stroke="${color}" stroke-width="${3 * s}"/>` +
           `<path d="M ${cx - 15 * s} ${cy + 22 * s} v-${10 * s} a ${15 * s} ${15 * s} 0 0 1 ${30 * s} 0 v${10 * s}" ` +
           `stroke="${color}" stroke-width="${3 * s}"/>`;
  }

  function label(text, color, size, y, weight) {
    return `<text x="50" y="${y || 94}" font-size="${size || 10}" fill="${color}" ` +
           `font-weight="${weight || 600}" text-anchor="middle" stroke="none">${text}</text>`;
  }

  function dot(cx, cy, r, color) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="none"/>`;
  }

  function check(x, y, color, scale) {
    const s = scale || 1;
    return `<path d="M${x - 10 * s} ${y} l${6 * s} ${7 * s} l${14 * s} -${16 * s}" stroke="${color}" stroke-width="${4 * s}"/>`;
  }

  // huy hieu tron + ngoi sao: pham chat / nang luc / dai dien
  function badge(cx, cy, color) {
    return `<circle cx="${cx}" cy="${cy}" r="16" stroke="${color}" stroke-width="2.8" fill="${PAPER}"/>` +
           `<path d="M${cx} ${cy - 9} l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 z" stroke="${color}" stroke-width="1.4" fill="${color}"/>`;
  }

  // cuon sach dong: kien thuc / van hoa / lich su / ngoai ngu
  function book(cx, cy, color) {
    return `<path d="M${cx} ${cy - 14} v28 M${cx - 24} ${cy - 12} q24 -6 24 0 v26 q-24 -6 -24 0 z M${cx + 24} ${cy - 12} q-24 -6 -24 0 v26 q24 -6 24 0 z" stroke="${color}" stroke-width="2.5" fill="${PAPER}"/>`;
  }

  // to giay co dong chu: chu ky / khao sat / bao cao / chuan bi
  function doc(cx, cy, color) {
    return `<rect x="${cx - 18}" y="${cy - 22}" width="36" height="44" rx="3" stroke="${color}" stroke-width="2.6" fill="${PAPER}"/>` +
           `<path d="M${cx - 10} ${cy - 10} h20 M${cx - 10} ${cy - 1} h20 M${cx - 10} ${cy + 8} h12" stroke="${color}" stroke-width="2"/>`;
  }

  // dong tien co ky hieu yen: thanh toan / tien hang
  function coin(cx, cy, color) {
    return `<circle cx="${cx}" cy="${cy}" r="16" stroke="${color}" stroke-width="2.8" fill="${PAPER}"/>` +
           `<text x="${cx}" y="${cy + 6}" font-size="18" fill="${color}" font-weight="700" text-anchor="middle" stroke="none">¥</text>`;
  }

  // con dau tron (2 vong): quyet dinh / phe duyet / ra lenh / huy bo
  function stamp(cx, cy, color) {
    return `<circle cx="${cx}" cy="${cy}" r="20" stroke="${color}" stroke-width="3"/>` +
           `<circle cx="${cx}" cy="${cy}" r="14" stroke="${color}" stroke-width="1.6"/>`;
  }

  // bong bop thoai: tranh luan / phat bieu
  function bubble(cx, cy, color) {
    return `<path d="M${cx - 18} ${cy - 13} h36 v20 h-22 l-6 8 v-8 h-8 z" stroke="${color}" stroke-width="2.6" fill="${PAPER}"/>`;
  }

  const EXTRA = {
    // bai 15
    'せいかく': art(
      badge(50, 44, SAGE) +
      label('TÍNH CÁCH', SAGE, 11, 92, 700)),

    'れいぎ': art(
      `<circle cx="40" cy="30" r="9" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M40 39 q6 20 30 26" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M20 70 h56" stroke="${SAGE}" stroke-width="2.2"/>` +
      label('LỄ NGHI', SAGE, 12, 92, 700)),

    'ちしき': art(
      book(48, 50, GOLD) +
      `<path d="M74 24 v12 M68 30 h12" stroke="${GOLD}" stroke-width="2.2"/>` +
      label('KIẾN THỨC', GOLD, 10, 92, 700)),

    'のうりょく': art(
      badge(50, 44, GOLD) +
      `<path d="M42 66 l8 -8 8 8" stroke="${GOLD}" stroke-width="2.6"/>` +
      label('NĂNG LỰC', GOLD, 11, 92, 700)),

    'がいこくご': art(
      book(42, 52, SAGE) +
      `<text x="70" y="34" font-size="16" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">A</text>` +
      `<text x="82" y="54" font-size="16" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">あ</text>` +
      label('NGOẠI NGỮ', SAGE, 10, 92, 700)),

    'ぜんぜん': art(
      `<circle cx="50" cy="46" r="24" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M32 28 L68 64" stroke="${ACCENT}" stroke-width="3.5"/>` +
      label('HOÀN TOÀN KHÔNG', ACCENT, 8, 92, 700)),

    'かのじょ': art(
      person(50, 52, ACCENT, .9) +
      `<path d="M50 25 l-5 -8 5 3 5 -3 z" stroke="${ACCENT}" stroke-width="1.6" fill="${ACCENT}"/>` +
      label('CÔ ẤY', ACCENT, 14, 92, 700)),

    'いい': art(
      check(50, 48, SAGE, 1.6) +
      label('TỐT', SAGE, 16, 92, 700)),

    'まったく': art(
      `<circle cx="50" cy="46" r="24" stroke="${GOLD}" stroke-width="3" fill="${GOLD}"/>` +
      label('HOÀN TOÀN', GOLD, 12, 92, 700)),

    'ただしい': art(
      stamp(50, 46, SAGE) +
      check(50, 46, SAGE, 1.1) +
      label('ĐÚNG ĐẮN', SAGE, 11, 92, 700)),

    // bai 16
    'だいひょう': art(
      badge(50, 40, ACCENT) +
      person(50, 76, ACCENT, .55) +
      label('ĐẠI DIỆN', ACCENT, 11, 92, 700)),

    'だいり': art(
      person(30, 50, INK, .8) +
      `<path d="M50 42 h16 M60 36 l6 6 -6 6" stroke="${GOLD}" stroke-width="2.4"/>` +
      badge(80, 42, GOLD) +
      label('THAY MẶT', GOLD, 10, 92, 700)),

    'たんとう': art(
      person(40, 46, INK, .85) +
      `<rect x="58" y="52" width="20" height="14" rx="2" stroke="${GOLD}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<path d="M68 52 v-8" stroke="${GOLD}" stroke-width="2"/>` +
      label('PHỤ TRÁCH', GOLD, 10, 92, 700)),

    'しはらいます': art(
      coin(36, 46, GOLD) +
      `<path d="M58 46 h18 M70 40 l6 6 -6 6" stroke="${INK}" stroke-width="2.4"/>` +
      label('THANH TOÁN', GOLD, 10, 92, 700)),

    'しょめい': art(
      doc(46, 48, INK) +
      `<path d="M34 60 q6 -8 12 0 t12 0" stroke="${ACCENT}" stroke-width="2.4"/>` +
      label('CHỮ KÝ', ACCENT, 13, 92, 700)),

    'だいきん': art(
      coin(40, 54, GOLD) +
      coin(60, 38, GOLD) +
      label('TIỀN HÀNG', GOLD, 11, 92, 700)),

    'しゅっせきします': art(
      person(40, 50, SAGE, .85) +
      check(74, 46, SAGE, 1.1) +
      label('THAM DỰ', SAGE, 12, 92, 700)),

    // bai 17
    'ぎろんします': art(
      bubble(32, 40, ACCENT) +
      bubble(68, 58, SAGE) +
      label('TRANH LUẬN', ACCENT, 10, 92, 700)),

    'はっぴょうします': art(
      bubble(50, 42, GOLD) +
      person(50, 80, INK, .5) +
      label('PHÁT BIỂU', GOLD, 10, 92, 700)),

    'ほうこくします': art(
      doc(40, 54, INK) +
      `<path d="M70 62 v-24 M64 44 l6 -8 6 8" stroke="${GOLD}" stroke-width="2.6"/>` +
      label('BÁO CÁO', GOLD, 12, 92, 700)),

    'ぶんか': art(
      book(48, 52, SAGE) +
      `<path d="M40 22 q8 -8 16 0" stroke="${ACCENT}" stroke-width="2.4"/>` +
      label('VĂN HÓA', SAGE, 12, 92, 700)),

    'れきし': art(
      book(40, 54, INK) +
      `<circle cx="76" cy="30" r="12" stroke="${GOLD}" stroke-width="2.4" fill="${PAPER}"/>` +
      `<path d="M76 30 v-6 M76 30 l5 3" stroke="${GOLD}" stroke-width="2"/>` +
      label('LỊCH SỬ', GOLD, 12, 92, 700)),

    'ちょうさ': art(
      doc(36, 50, INK) +
      `<circle cx="72" cy="42" r="10" stroke="${ACCENT}" stroke-width="2.6"/>` +
      `<path d="M79 49 l10 10" stroke="${ACCENT}" stroke-width="3"/>` +
      label('KHẢO SÁT', ACCENT, 10, 92, 700)),

    'せいじ': art(
      `<path d="M30 46 L50 30 L70 46 Z" stroke="${INK}" stroke-width="2.6" fill="${PAPER}"/>` +
      `<path d="M28 46 h44 v24 h-44 z" stroke="${INK}" stroke-width="2.6" fill="${PAPER}"/>` +
      `<path d="M38 70 v-16 M50 70 v-16 M62 70 v-16" stroke="${INK}" stroke-width="2.2"/>` +
      label('CHÍNH TRỊ', GOLD, 11, 92, 700)),

    'けいざい': art(
      `<path d="M22 68 h56 M22 68 v-40" stroke="${INK}" stroke-width="2.4"/>` +
      `<path d="M28 58 l14 -10 12 8 20 -22" stroke="${ACCENT}" stroke-width="3"/>` +
      label('KINH TẾ', ACCENT, 12, 92, 700)),

    'かんきょう': art(
      `<circle cx="50" cy="38" r="20" stroke="${SAGE}" stroke-width="2.8" fill="${PAPER}"/>` +
      `<path d="M50 58 v18" stroke="${SAGE}" stroke-width="4"/>` +
      label('MÔI TRƯỜNG', SAGE, 10, 92, 700)),

    'にほん': art(
      `<circle cx="50" cy="36" r="14" stroke="${ACCENT}" stroke-width="2.6" fill="${ACCENT}"/>` +
      `<path d="M20 68 L45 40 L58 54 L70 40 L84 68 Z" stroke="${INK}" stroke-width="2.4" fill="${PAPER}"/>` +
      label('NHẬT BẢN', INK, 11, 92, 700)),

    'しゃかい': art(
      person(28, 62, INK, .55) + person(50, 66, INK, .55) + person(72, 62, INK, .55) +
      label('XÃ HỘI', GOLD, 13, 92, 700)),

    // bai 18
    'しらせ': art(
      `<rect x="22" y="36" width="56" height="36" rx="3" stroke="${INK}" stroke-width="2.6" fill="${PAPER}"/>` +
      `<path d="M22 38 l28 22 28 -22" stroke="${INK}" stroke-width="2.4"/>` +
      label('THÔNG BÁO', GOLD, 11, 92, 700)),

    'えんきします': art(
      `<rect x="24" y="30" width="40" height="38" rx="3" stroke="${INK}" stroke-width="2.6" fill="${PAPER}"/>` +
      `<path d="M24 42 h40 M34 30 v-6 M54 30 v-6" stroke="${INK}" stroke-width="2.2"/>` +
      `<path d="M68 54 h14 M76 48 l6 6 -6 6" stroke="${GOLD}" stroke-width="2.4"/>` +
      label('HOÃN LẠI', GOLD, 11, 92, 700)),

    'けっていします': art(
      stamp(50, 46, INK) +
      dot(50, 46, 4, ACCENT) +
      label('QUYẾT ĐỊNH', ACCENT, 10, 92, 700)),

    'へんこうします': art(
      `<path d="M28 40 h34 M54 34 l8 6 -8 6" stroke="${GOLD}" stroke-width="2.6"/>` +
      `<path d="M72 58 h-34 M46 52 l-8 6 8 6" stroke="${SAGE}" stroke-width="2.6"/>` +
      label('THAY ĐỔI', GOLD, 11, 92, 700)),

    'しょうにんします': art(
      stamp(50, 46, GOLD) +
      check(50, 46, GOLD, 1.2) +
      label('PHÊ DUYỆT', GOLD, 10, 92, 700)),

    'めいれいします': art(
      stamp(50, 44, ACCENT) +
      `<text x="50" y="52" font-size="26" fill="${ACCENT}" font-weight="900" text-anchor="middle" stroke="none">!</text>` +
      label('RA LỆNH', ACCENT, 12, 92, 700)),

    'ちゅうし': art(
      stamp(50, 46, INK) +
      `<path d="M40 36 l20 20 M60 36 l-20 20" stroke="${ACCENT}" stroke-width="3.2"/>` +
      label('HỦY BỎ', ACCENT, 12, 92, 700)),

    'じゅんび': art(
      doc(40, 50, INK) +
      check(72, 34, SAGE, .8) +
      check(72, 54, SAGE, .8) +
      label('CHUẨN BỊ', SAGE, 11, 92, 700)),

    'ひつよう': art(
      `<text x="50" y="62" font-size="46" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">*</text>` +
      label('CẦN THIẾT', ACCENT, 11, 92, 700)),

    'もんだい': art(
      `<circle cx="50" cy="46" r="26" stroke="${GOLD}" stroke-width="2.8"/>` +
      `<text x="50" y="56" font-size="30" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      label('VẤN ĐỀ', GOLD, 13, 92, 700)),
  };

  window.SenseiArt.extend(EXTRA);

  // Gan them dang kanji cho cac tu co kanji, tro ve cung mot hinh minh hoa.
  window.SenseiArt.extend({
    // bai 15
    '性格': EXTRA['せいかく'],
    '礼儀': EXTRA['れいぎ'],
    '知識': EXTRA['ちしき'],
    '能力': EXTRA['のうりょく'],
    '外国語': EXTRA['がいこくご'],
    '全然': EXTRA['ぜんぜん'],
    '彼女': EXTRA['かのじょ'],
    '全く': EXTRA['まったく'],
    '正しい': EXTRA['ただしい'],
    // bai 16
    '代表': EXTRA['だいひょう'],
    '代理': EXTRA['だいり'],
    '担当': EXTRA['たんとう'],
    '支払います': EXTRA['しはらいます'],
    '署名': EXTRA['しょめい'],
    '代金': EXTRA['だいきん'],
    '出席します': EXTRA['しゅっせきします'],
    // bai 17
    '議論します': EXTRA['ぎろんします'],
    '発表します': EXTRA['はっぴょうします'],
    '報告します': EXTRA['ほうこくします'],
    '文化': EXTRA['ぶんか'],
    '歴史': EXTRA['れきし'],
    '調査': EXTRA['ちょうさ'],
    '政治': EXTRA['せいじ'],
    '経済': EXTRA['けいざい'],
    '環境': EXTRA['かんきょう'],
    '日本': EXTRA['にほん'],
    '社会': EXTRA['しゃかい'],
    // bai 18
    '知らせ': EXTRA['しらせ'],
    '延期します': EXTRA['えんきします'],
    '決定します': EXTRA['けっていします'],
    '変更します': EXTRA['へんこうします'],
    '承認します': EXTRA['しょうにんします'],
    '命令します': EXTRA['めいれいします'],
    '中止': EXTRA['ちゅうし'],
    '準備': EXTRA['じゅんび'],
    '必要': EXTRA['ひつよう'],
    '問題': EXTRA['もんだい'],
  });
})();
