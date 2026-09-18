/**
 * Sensei Art — lo minh hoa bo sung N3 (lo 6/6): bai 19-20.
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

  /** Khien: tuan theo / bao ve / quy tac */
  function shield(cx, cy, color, scale) {
    const s = scale || 1;
    return `<path d="M${cx} ${cy - 18 * s} L${cx + 14 * s} ${cy - 12 * s} V${cy + 4 * s} ` +
           `Q${cx + 14 * s} ${cy + 18 * s} ${cx} ${cy + 24 * s} Q${cx - 14 * s} ${cy + 18 * s} ${cx - 14 * s} ${cy + 4 * s} ` +
           `V${cy - 12 * s} Z" stroke="${color}" stroke-width="3" fill="${PAPER}"/>`;
  }

  /** Can thang bang: quyen loi / nghia vu / trach nhiem */
  function scaleIcon(cx, cy, color, scale) {
    const s = scale || 1;
    const armY = cy - 12 * s;
    return `<path d="M${cx} ${armY} V${cy + 16 * s} M${cx - 12 * s} ${cy + 16 * s} H${cx + 12 * s}" stroke="${color}" stroke-width="3"/>` +
           `<path d="M${cx - 18 * s} ${armY} H${cx + 18 * s}" stroke="${color}" stroke-width="3"/>` +
           `<circle cx="${cx - 18 * s}" cy="${armY + 8 * s}" r="${6 * s}" stroke="${color}" stroke-width="2.5"/>` +
           `<circle cx="${cx + 18 * s}" cy="${armY + 8 * s}" r="${6 * s}" stroke="${color}" stroke-width="2.5"/>`;
  }

  const EXTRA = {
    // ---------- bai 19: quy tac & xa hoi ----------
    'したがいます': art(
      shield(50, 46, INK, 1) +
      check(50, 48, ACCENT, 1) +
      label('TUÂN THEO', INK, 11, 92, 700)),

    'せきにん': art(
      scaleIcon(50, 34, INK, .85) +
      person(50, 74, ACCENT, .6) +
      label('TRÁCH NHIỆM', ACCENT, 9, 96, 700)),

    'ぎむ': art(
      scaleIcon(50, 42, ACCENT, 1) +
      label('NGHĨA VỤ', ACCENT, 10, 94, 700)),

    'けんり': art(
      scaleIcon(50, 40, SAGE, 1) +
      label('QUYỀN LỢI', SAGE, 10, 94, 700)),

    'まもります': art(
      shield(38, 48, SAGE, 1.05) +
      person(68, 50, INK, .7) +
      label('BẢO VỆ', SAGE, 12, 94, 700)),

    'そんちょうします': art(
      person(26, 50, INK, .78) +
      person(74, 50, ACCENT, .78) +
      `<path d="M42 40 Q50 26 58 40" stroke="${GOLD}" stroke-width="2.5"/>` +
      label('TÔN TRỌNG', ACCENT, 10, 94, 700)),

    'めいわく': art(
      person(50, 62, INK, .85) +
      `<path d="M30 28 a12 12 0 0 1 12 -10 a14 14 0 0 1 27 3 a10 10 0 0 1 -3 20 H34 a10 10 0 0 1 -4 -13 z" ` +
      `stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M38 46 l-3 8 M50 46 l-3 8 M62 44 l-3 8" stroke="${SAGE}" stroke-width="2.5"/>` +
      label('PHIỀN HÀ', SAGE, 11, 94, 700)),

    'ルール': art(
      shield(50, 46, GOLD, 1) +
      `<path d="M42 40 h16 M42 48 h16 M42 56 h10" stroke="${GOLD}" stroke-width="2.5"/>` +
      label('QUY TẮC', GOLD, 11, 94, 700)),

    'はやく': art(
      `<circle cx="46" cy="48" r="26" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M46 48 V30 M46 48 L60 54" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M78 30 h10 M82 42 h10 M78 54 h10" stroke="${SAGE}" stroke-width="2.5"/>` +
      label('SỚM', ACCENT, 13, 92, 700)),

    'けっていします': art(
      `<path d="M14 30 Q40 50 50 50" stroke="${INK}" stroke-width="2.5" stroke-dasharray="4 3"/>` +
      `<path d="M14 70 Q40 50 50 50" stroke="${INK}" stroke-width="2.5" stroke-dasharray="4 3"/>` +
      `<path d="M50 50 H78" stroke="${ACCENT}" stroke-width="3.5"/>` +
      check(80, 50, ACCENT, 1.1) +
      label('QUYẾT ĐỊNH', ACCENT, 10, 92, 700)),

    'みんな': art(
      person(24, 50, INK, .7) + person(50, 44, ACCENT, .82) + person(76, 50, SAGE, .7) +
      label('MỌI NGƯỜI', INK, 11, 92, 700)),

    'しゃかい': art(
      person(50, 26, INK, .6) + person(24, 62, ACCENT, .6) + person(76, 62, SAGE, .6) +
      `<path d="M46 34 L30 54 M54 34 L70 54 M32 66 H68" stroke="${GOLD}" stroke-width="2" stroke-dasharray="3 3"/>` +
      label('XÃ HỘI', INK, 12, 94, 700)),

    'もんだい': art(
      `<path d="M50 14 L84 76 H16 Z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 36 v18" stroke="${ACCENT}" stroke-width="4"/>` +
      dot(50, 62, 3, ACCENT) +
      label('VẤN ĐỀ', ACCENT, 12, 92, 700)),

    // ---------- bai 20: no luc & ket qua ----------
    'かいぜんします': art(
      `<path d="M16 78 H84" stroke="${INK}" stroke-width="3"/>` +
      `<rect x="24" y="58" width="12" height="20" fill="${SAGE}" stroke="none"/>` +
      `<rect x="44" y="44" width="12" height="34" fill="${SAGE}" stroke="none"/>` +
      `<rect x="64" y="26" width="12" height="52" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M20 50 L48 34 L80 16" stroke="${GOLD}" stroke-width="3"/>` +
      `<path d="M70 16 H80 V26" stroke="${GOLD}" stroke-width="3"/>` +
      label('CẢI THIỆN', ACCENT, 11, 92, 700)),

    'はんせいします': art(
      person(50, 58, INK, .8) +
      `<path d="M30 30 a20 20 0 1 1 -4 18" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M20 42 l6 8 8 -4" stroke="${ACCENT}" stroke-width="3"/>` +
      label('RÚT KINH NGHIỆM', ACCENT, 9, 94, 700)),

    'ひょうかします': art(
      `<rect x="16" y="20" width="68" height="50" rx="5" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      dot(34, 45, 6, GOLD) + dot(50, 45, 6, GOLD) + dot(66, 45, 6, ACCENT) +
      `<path d="M26 60 h48" stroke="${SAGE}" stroke-width="2.5"/>` +
      label('ĐÁNH GIÁ', INK, 11, 92, 700)),

    'もくひょう': art(
      `<circle cx="50" cy="46" r="26" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="50" cy="46" r="16" stroke="${SAGE}" stroke-width="3"/>` +
      `<circle cx="50" cy="46" r="6" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M10 86 L40 56" stroke="${GOLD}" stroke-width="3"/>` +
      label('MỤC TIÊU', GOLD, 11, 96, 700)),

    'チーム': art(
      person(32, 40, ACCENT, .68) + person(68, 40, SAGE, .68) + person(50, 62, INK, .68) +
      `<circle cx="50" cy="48" r="30" stroke="${GOLD}" stroke-width="2" stroke-dasharray="4 3"/>` +
      label('ĐỘI NHÓM', GOLD, 11, 94, 700)),

    'どりょく': art(
      person(30, 54, INK, .8) +
      `<circle cx="66" cy="52" r="16" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M44 60 L52 56" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M20 30 l4 8 M26 26 l2 9" stroke="${SAGE}" stroke-width="2.5"/>` +
      label('NỖ LỰC', ACCENT, 12, 92, 700)),

    'じゅんび': art(
      `<rect x="26" y="18" width="48" height="60" rx="4" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="40" y="12" width="20" height="10" rx="2" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      check(46, 36, SAGE, .8) +
      `<path d="M56 36 h10" stroke="${SAGE}" stroke-width="2.5"/>` +
      check(46, 52, SAGE, .8) +
      `<path d="M56 52 h10" stroke="${SAGE}" stroke-width="2.5"/>` +
      label('CHUẨN BỊ', INK, 11, 92, 700)),

    'けっか': art(
      `<path d="M12 50 H46" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M40 44 L46 50 L40 56" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="68" cy="50" r="20" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      check(68, 52, GOLD, 1) +
      label('KẾT QUẢ', ACCENT, 11, 92, 700)),

    'じょうきょう': art(
      `<path d="M18 66 A32 32 0 0 1 82 66" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M50 66 L66 40" stroke="${ACCENT}" stroke-width="3"/>` +
      dot(50, 66, 5, INK) +
      `<path d="M18 66 H82" stroke="${SAGE}" stroke-width="2.5"/>` +
      label('TÌNH HUỐNG', INK, 10, 92, 700)),

    'せいこうします': art(
      `<path d="M36 30 H64 V44 A14 14 0 0 1 36 44 Z" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M36 34 H26 A8 8 0 0 0 34 46 M64 34 H74 A8 8 0 0 1 66 46" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M50 58 V68 M40 74 H60 M42 68 H58 V74 H42 Z" stroke="${GOLD}" stroke-width="3"/>` +
      label('THÀNH CÔNG', ACCENT, 10, 94, 700)),
  };

  // Alias: tra theo dang kanji/katakana khi khac voi tu chinh
  EXTRA['従います'] = EXTRA['したがいます'];
  EXTRA['責任'] = EXTRA['せきにん'];
  EXTRA['義務'] = EXTRA['ぎむ'];
  EXTRA['権利'] = EXTRA['けんり'];
  EXTRA['守ります'] = EXTRA['まもります'];
  EXTRA['尊重します'] = EXTRA['そんちょうします'];
  EXTRA['迷惑'] = EXTRA['めいわく'];
  EXTRA['早く'] = EXTRA['はやく'];
  EXTRA['決定します'] = EXTRA['けっていします'];
  EXTRA['社会'] = EXTRA['しゃかい'];
  EXTRA['問題'] = EXTRA['もんだい'];
  EXTRA['改善します'] = EXTRA['かいぜんします'];
  EXTRA['反省します'] = EXTRA['はんせいします'];
  EXTRA['評価します'] = EXTRA['ひょうかします'];
  EXTRA['目標'] = EXTRA['もくひょう'];
  EXTRA['努力'] = EXTRA['どりょく'];
  EXTRA['準備'] = EXTRA['じゅんび'];
  EXTRA['結果'] = EXTRA['けっか'];
  EXTRA['状況'] = EXTRA['じょうきょう'];
  EXTRA['成功します'] = EXTRA['せいこうします'];

  window.SenseiArt.extend(EXTRA);
})();
