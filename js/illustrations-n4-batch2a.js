/**
 * Sensei Art — lo minh hoa bo sung N4 (lo 2a/3): bai 32-35.
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

  // tam giac canh bao co dau !
  function warn(cx, cy, r, color) {
    return `<path d="M${cx} ${cy - r} L${cx + r} ${cy + r * 0.8} L${cx - r} ${cy + r * 0.8} Z" stroke="${color}" stroke-width="3" fill="${PAPER}"/>` +
           `<path d="M${cx} ${cy + r * 0.1} v-${r * 0.55}" stroke="${color}" stroke-width="3"/>` +
           dot(cx, cy + r * 0.72, 1.8, color);
  }

  // vong cam (gach cheo) dat chong len ky hieu hanh dong
  function cam(cx, cy, r, color) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${color}" stroke-width="3.5"/>` +
           `<path d="M${cx - r * 0.7} ${cy + r * 0.7} L${cx + r * 0.7} ${cy - r * 0.7}" stroke="${color}" stroke-width="3.5"/>`;
  }

  // mui ten re nhanh, danh cho the dieu kien ba/nara
  function nhanh(x, y, color) {
    return `<path d="M${x} ${y} v-9 M${x} ${y - 9} l-9 -8 M${x} ${y - 9} l9 -8" stroke="${color}" stroke-width="2.8"/>`;
  }

  function bowl(cx, cy, color) {
    return `<path d="M${cx - 16} ${cy} q0 14 16 14 q16 0 16 -14 Z" stroke="${color}" stroke-width="3" fill="${PAPER}"/>` +
           `<path d="M${cx - 16} ${cy} h32" stroke="${color}" stroke-width="2.5"/>` +
           `<path d="M${cx + 20} ${cy - 18} v20 M${cx + 26} ${cy - 20} v20" stroke="${color}" stroke-width="2.2"/>`;
  }

  function fist(cx, cy, color) {
    return `<circle cx="${cx}" cy="${cy}" r="11" stroke="${color}" stroke-width="3" fill="${PAPER}"/>` +
           `<path d="M${cx - 6} ${cy - 4} v8 M${cx} ${cy - 6} v10 M${cx + 6} ${cy - 4} v8" stroke="${color}" stroke-width="2.2"/>`;
  }

  // dau cham than to, danh cho the menh lenh
  function bang(x, y, color, size) {
    return `<text x="${x}" y="${y}" font-size="${size || 30}" fill="${color}" font-weight="900" stroke="none">!</text>`;
  }

  const EXTRA = {
    // bai 32
    'たいじゅう': art(
      `<rect x="26" y="60" width="48" height="14" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="50" cy="42" r="16" stroke="${INK}" stroke-width="2.8" fill="${PAPER}"/>` +
      `<path d="M50 42 l7 -8" stroke="${ACCENT}" stroke-width="2.5"/>` +
      dot(50, 42, 2, INK) +
      label('CÂN NẶNG', GOLD, 11, 92, 700)),

    'だいたい': art(
      `<text x="50" y="58" font-size="34" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">≈</text>` +
      label('ĐẠI KHÁI', GOLD, 12, 92, 700)),

    'もしかしたら': art(
      `<text x="40" y="60" font-size="38" fill="${INK}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      `<rect x="64" y="46" width="18" height="18" rx="4" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      dot(70, 52, 1.8, GOLD) + dot(76, 58, 1.8, GOLD) +
      label('BIẾT ĐÂU', GOLD, 11, 92, 700)),

    'ぜったい': art(
      `<circle cx="50" cy="46" r="26" stroke="${ACCENT}" stroke-width="3"/>` +
      `<circle cx="50" cy="46" r="20" stroke="${ACCENT}" stroke-width="2"/>` +
      check(50, 46, ACCENT, 1.4) +
      label('TUYỆT ĐỐI', ACCENT, 10, 92, 700)),

    // bai 33
    'はしれ': art(
      person(34, 56, INK, .8) +
      `<path d="M22 74 l10 -8 M46 74 l-4 -10" stroke="${INK}" stroke-width="2.8"/>` +
      `<path d="M10 40 h10 M8 48 h10" stroke="${SAGE}" stroke-width="2.2"/>` +
      bang(74, 50, ACCENT, 34) +
      label('CHẠY ĐI!', ACCENT, 11, 92, 800)),

    'まて': art(
      person(34, 60, INK, .8) +
      `<rect x="30" y="30" width="16" height="18" rx="6" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M33 30 v-8 M38 30 v-9 M43 30 v-8" stroke="${INK}" stroke-width="2.2"/>` +
      bang(74, 44, ACCENT, 34) +
      label('ĐỢI ĐÃ!', ACCENT, 12, 92, 800)),

    'いそげ': art(
      person(34, 56, INK, .8) +
      `<path d="M22 74 l10 -8 M46 74 l-4 -10" stroke="${INK}" stroke-width="2.8"/>` +
      `<path d="M6 36 h14 M4 46 h14 M8 56 h12" stroke="${SAGE}" stroke-width="2.2"/>` +
      bang(78, 48, ACCENT, 34) +
      label('NHANH LÊN!', ACCENT, 10, 92, 800)),

    'たべろ': art(
      bowl(38, 58, INK) +
      `<path d="M20 72 h40" stroke="${INK}" stroke-width="2.2"/>` +
      bang(76, 42, ACCENT, 34) +
      label('ĂN ĐI!', ACCENT, 13, 92, 800)),

    'こい': art(
      person(66, 58, INK, .8) +
      `<path d="M40 46 h-24 M16 46 l8 -7 M16 46 l8 7" stroke="${ACCENT}" stroke-width="3"/>` +
      bang(20, 30, ACCENT, 34) +
      label('ĐẾN ĐÂY!', ACCENT, 11, 92, 800)),

    'しろ': art(
      fist(36, 54, INK) +
      `<path d="M36 66 v14" stroke="${INK}" stroke-width="3"/>` +
      bang(74, 42, ACCENT, 34) +
      label('LÀM ĐI!', ACCENT, 12, 92, 800)),

    'はいるな': art(
      `<path d="M30 30 v44 h30 v-44 z" stroke="${INK}" stroke-width="2.8" fill="${PAPER}"/>` +
      `<path d="M30 30 h30" stroke="${INK}" stroke-width="2.8"/>` +
      `<path d="M14 52 h20 M28 46 l6 6 -6 6" stroke="${SAGE}" stroke-width="2.5"/>` +
      cam(45, 52, 30, ACCENT) +
      label('CẤM VÀO!', ACCENT, 11, 92, 800)),

    'とまるな': art(
      `<rect x="38" y="34" width="8" height="30" rx="2" stroke="${INK}" stroke-width="2.8" fill="${INK}"/>` +
      `<rect x="54" y="34" width="8" height="30" rx="2" stroke="${INK}" stroke-width="2.8" fill="${INK}"/>` +
      cam(50, 49, 32, ACCENT) +
      label('CẤM DỪNG!', ACCENT, 10, 92, 800)),

    'きけん': art(
      warn(50, 50, 30, ACCENT) +
      label('NGUY HIỂM', ACCENT, 11, 92, 800)),

    'ちゅうい': art(
      warn(38, 46, 24, GOLD) +
      person(72, 62, INK, .6) +
      label('CHÚ Ý!', GOLD, 14, 92, 800)),

    'しあい': art(
      `<path d="M22 74 v-34 h14 M64 74 v-34 h14" stroke="${INK}" stroke-width="2.8"/>` +
      `<circle cx="50" cy="56" r="9" stroke="${ACCENT}" stroke-width="2.8" fill="${PAPER}"/>` +
      `<path d="M50 47 l5 4 -2 6 h-6 l-2 -6 z" stroke="${ACCENT}" stroke-width="1.6"/>` +
      label('TRẬN ĐẤU', GOLD, 11, 92, 700)),

    'はしります': art(
      person(40, 56, INK, .8) +
      `<path d="M28 74 l10 -8 M52 74 l-4 -10" stroke="${INK}" stroke-width="2.8"/>` +
      `<path d="M14 42 h12 M12 50 h12" stroke="${SAGE}" stroke-width="2.2"/>` +
      label('CHẠY', GOLD, 15, 92, 700)),

    'まんが': art(
      `<path d="M50 32 v40 M20 34 q30 -8 30 0 v38 q-30 -8 -30 0 z M80 34 q-30 -8 -30 0 v38 q30 -8 30 0 z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M70 24 l3 6 6 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 6 -1 z" stroke="${GOLD}" stroke-width="1.6" fill="${GOLD}"/>` +
      label('TRUYỆN TRANH', GOLD, 9, 92, 700)),

    'しんぱいします': art(
      `<circle cx="50" cy="46" r="22" stroke="${INK}" stroke-width="2.8" fill="${PAPER}"/>` +
      `<path d="M40 40 q4 -6 8 0 M52 40 q4 -6 8 0" stroke="${INK}" stroke-width="2.2"/>` +
      `<path d="M40 58 q10 -8 20 0" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M66 30 q4 6 0 10 q-4 -2 0 -10 z" fill="${SAGE}" stroke="none"/>` +
      label('LO LẮNG', SAGE, 12, 92, 700)),

    'がんばれ': art(
      fist(42, 50, ACCENT) +
      `<path d="M42 61 v16" stroke="${ACCENT}" stroke-width="3.2"/>` +
      bang(74, 36, GOLD, 36) +
      label('CỐ LÊN!', ACCENT, 13, 92, 800)),

    'あぶない': art(
      warn(40, 50, 28, ACCENT) +
      bang(76, 40, ACCENT, 30) +
      label('COI CHỪNG!', ACCENT, 10, 92, 800)),

    // bai 34
    'せつめいします': art(
      person(28, 62, INK, .75) +
      `<rect x="46" y="24" width="38" height="26" rx="6" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M52 32 h26 M52 40 h18" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M52 50 l-6 8 10 -4 z" stroke="${GOLD}" stroke-width="2" fill="${PAPER}"/>` +
      label('GIẢI THÍCH', GOLD, 10, 92, 700)),

    'やります': art(
      fist(42, 50, SAGE) +
      `<path d="M42 61 v14" stroke="${SAGE}" stroke-width="3"/>` +
      check(72, 60, SAGE, 1.1) +
      label('LÀM', GOLD, 16, 92, 700)),

    'せつめい': art(
      `<rect x="26" y="30" width="48" height="30" rx="7" stroke="${GOLD}" stroke-width="2.8" fill="${PAPER}"/>` +
      `<path d="M34 40 h32 M34 49 h22" stroke="${GOLD}" stroke-width="2.2"/>` +
      `<path d="M40 60 l-6 9 11 -5 z" stroke="${GOLD}" stroke-width="2" fill="${PAPER}"/>` +
      label('LỜI GIẢI THÍCH', GOLD, 9, 92, 700)),

    'せつめいしょ': art(
      `<rect x="30" y="20" width="40" height="54" rx="3" stroke="${INK}" stroke-width="2.8" fill="${PAPER}"/>` +
      `<path d="M38 32 h24 M38 40 h24 M38 48 h16" stroke="${SAGE}" stroke-width="2.2"/>` +
      `<rect x="58" y="14" width="8" height="14" stroke="${ACCENT}" stroke-width="2.2" fill="${ACCENT}"/>` +
      label('SÁCH HƯỚNG DẪN', GOLD, 8, 92, 700)),

    'やりかた': art(
      dot(24, 56, 6, SAGE) + dot(50, 56, 6, GOLD) + dot(76, 56, 6, ACCENT) +
      `<path d="M32 56 h10 M58 56 h10" stroke="${INK}" stroke-width="2.2"/>` +
      `<path d="M40 52 l2 4 -2 4 M66 52 l2 4 -2 4" stroke="${INK}" stroke-width="2.2"/>` +
      label('CÁCH LÀM', GOLD, 12, 92, 700)),

    'つくりかた': art(
      `<path d="M28 54 h44 v10 a22 10 0 0 1 -44 0 z" stroke="${INK}" stroke-width="2.8" fill="${PAPER}"/>` +
      `<path d="M22 54 h56" stroke="${INK}" stroke-width="2.8"/>` +
      `<path d="M40 46 q3 -6 0 -12 M50 46 q3 -6 0 -12 M60 46 q3 -6 0 -12" stroke="${SAGE}" stroke-width="2" opacity=".7"/>` +
      label('CÁCH NẤU', GOLD, 12, 92, 700)),

    'じゅぎょう': art(
      `<rect x="20" y="26" width="60" height="36" rx="2" stroke="${INK}" stroke-width="2.8" fill="#3a4a3f"/>` +
      `<path d="M30 38 h26 M30 48 h18" stroke="${PAPER}" stroke-width="2.2"/>` +
      `<path d="M30 62 l-4 10 M70 62 l4 10" stroke="${INK}" stroke-width="2.5"/>` +
      label('TIẾT HỌC', GOLD, 12, 92, 700)),

    'しょくじ': art(
      bowl(42, 56, INK) +
      `<path d="M24 70 h44" stroke="${INK}" stroke-width="2.2"/>` +
      `<circle cx="70" cy="36" r="3" stroke="${GOLD}" stroke-width="2"/>` +
      label('BỮA ĂN', GOLD, 13, 92, 700)),

    'とおり': art(
      check(30, 50, SAGE, 1.1) +
      `<text x="50" y="56" font-size="26" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">=</text>` +
      check(72, 50, SAGE, 1.1) +
      label('ĐÚNG NHƯ', GOLD, 11, 92, 700)),

    // bai 35
    'いけば': art(
      person(36, 58, INK, .8) +
      `<path d="M24 74 l10 -8 M48 74 l-4 -10" stroke="${INK}" stroke-width="2.8"/>` +
      nhanh(76, 40, GOLD) +
      label('NẾU ĐI', GOLD, 14, 92, 700)),

    'たべれば': art(
      bowl(36, 56, INK) +
      `<path d="M18 70 h36" stroke="${INK}" stroke-width="2.2"/>` +
      nhanh(76, 38, GOLD) +
      label('NẾU ĂN', GOLD, 14, 92, 700)),

    'すれば': art(
      fist(36, 52, SAGE) +
      `<path d="M36 63 v14" stroke="${SAGE}" stroke-width="3"/>` +
      nhanh(76, 38, GOLD) +
      label('NẾU LÀM', GOLD, 13, 92, 700)),

    'くれば': art(
      person(66, 58, INK, .8) +
      `<path d="M38 46 h-22 M16 46 l8 -7 M16 46 l8 7" stroke="${SAGE}" stroke-width="2.8"/>` +
      nhanh(20, 26, GOLD) +
      label('NẾU ĐẾN', GOLD, 13, 92, 700)),

    'やすければ': art(
      `<path d="M24 40 h26 l20 20 -26 26 -20 -20 z" stroke="${ACCENT}" stroke-width="2.8" fill="${PAPER}"/>` +
      dot(32, 48, 3, ACCENT) +
      `<text x="46" y="66" font-size="16" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">¥</text>` +
      nhanh(78, 34, GOLD) +
      label('NẾU RẺ', GOLD, 14, 92, 700)),

    'げんきなら': art(
      `<circle cx="38" cy="38" r="9" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M28 70 v-18 a10 10 0 0 1 20 0 v18 M22 54 l6 -8 M54 54 l-6 -8" stroke="${SAGE}" stroke-width="3"/>` +
      nhanh(78, 36, GOLD) +
      label('NẾU KHỎE', GOLD, 12, 92, 700)),

    'いなか': art(
      `<path d="M14 70 L34 36 L50 58 L60 44 L86 70 Z" stroke="${SAGE}" stroke-width="2.8" fill="${PAPER}"/>` +
      `<path d="M66 70 v-14 l8 -8 8 8 v14 z" stroke="${INK}" stroke-width="2.2" fill="${PAPER}"/>` +
      label('VÙNG QUÊ', SAGE, 12, 92, 700)),

    'とかい': art(
      `<rect x="18" y="40" width="16" height="34" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<rect x="42" y="26" width="18" height="48" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<rect x="68" y="48" width="14" height="26" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M46 34 h4 M46 42 h4 M46 50 h4" stroke="${GOLD}" stroke-width="1.8"/>` +
      label('THÀNH THỊ', GOLD, 11, 92, 700)),

    'じんこう': art(
      person(28, 62, INK, .55) + person(50, 66, INK, .55) + person(72, 62, INK, .55) +
      label('DÂN SỐ', GOLD, 14, 92, 700)),

    'ふべん': art(
      `<circle cx="46" cy="48" r="16" stroke="${INK}" stroke-width="2.8" fill="${PAPER}"/>` +
      `<path d="M46 28 v6 M46 62 v6 M26 48 h6 M60 48 h6 M32 34 l4 4 M60 34 l-4 4 M32 62 l4 -4 M60 62 l-4 -4" stroke="${INK}" stroke-width="2.2"/>` +
      cam(46, 48, 26, ACCENT) +
      label('BẤT TIỆN', ACCENT, 12, 92, 700)),

    'じかん': art(
      `<circle cx="50" cy="48" r="26" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 48 v-16 M50 48 l12 8" stroke="${ACCENT}" stroke-width="3"/>` +
      dot(50, 48, 2.5, INK) +
      label('THỜI GIAN', GOLD, 11, 92, 700)),

    'わかりません': art(
      `<text x="42" y="60" font-size="36" fill="${INK}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      `<path d="M66 40 l14 14 M80 40 l-14 14" stroke="${ACCENT}" stroke-width="3.5"/>` +
      label('KHÔNG HIỂU', ACCENT, 10, 92, 700)),
  };

  window.SenseiArt.extend(EXTRA);

  // Gan them dang kanji cho cac tu co kanji, tro ve cung mot hinh minh hoa.
  window.SenseiArt.extend({
    // bai 32
    '体重': EXTRA['たいじゅう'],
    '大体': EXTRA['だいたい'],
    '絶対': EXTRA['ぜったい'],
    // bai 33
    '走れ': EXTRA['はしれ'],
    '待て': EXTRA['まて'],
    '急げ': EXTRA['いそげ'],
    '食べろ': EXTRA['たべろ'],
    '来い': EXTRA['こい'],
    '入るな': EXTRA['はいるな'],
    '止まるな': EXTRA['とまるな'],
    '危険': EXTRA['きけん'],
    '注意': EXTRA['ちゅうい'],
    '試合': EXTRA['しあい'],
    '走ります': EXTRA['はしります'],
    '漫画': EXTRA['まんが'],
    '心配します': EXTRA['しんぱいします'],
    '頑張れ': EXTRA['がんばれ'],
    '危ない': EXTRA['あぶない'],
    // bai 34
    '説明します': EXTRA['せつめいします'],
    '説明': EXTRA['せつめい'],
    '説明書': EXTRA['せつめいしょ'],
    'やり方': EXTRA['やりかた'],
    '作り方': EXTRA['つくりかた'],
    '授業': EXTRA['じゅぎょう'],
    '食事': EXTRA['しょくじ'],
    '通り': EXTRA['とおり'],
    // bai 35
    '行けば': EXTRA['いけば'],
    '食べれば': EXTRA['たべれば'],
    '来れば': EXTRA['くれば'],
    '安ければ': EXTRA['やすければ'],
    '元気なら': EXTRA['げんきなら'],
    '田舎': EXTRA['いなか'],
    '都会': EXTRA['とかい'],
    '人口': EXTRA['じんこう'],
    '不便': EXTRA['ふべん'],
    '時間': EXTRA['じかん'],
    '分かりません': EXTRA['わかりません'],
  });
})();
