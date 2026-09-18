/**
 * Sensei Art — lo minh hoa bo sung N4 (lo 2b/3): bai 36-40.
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

  // mui ten cong: the bi dong, tac dong tu ben ngoai vao
  function bidong(cx, cy, color) {
    return `<path d="M${cx + 14} ${cy - 10} a14 14 0 1 0 2 16" stroke="${color}" stroke-width="2.5"/>` +
           `<path d="M${cx + 16} ${cy + 6} l4 -2 l1 5 z" fill="${color}" stroke="none"/>`;
  }

  // vach song lan toa: giac quan tu nhien (nghe/thay)
  function song(cx, cy, color) {
    return `<path d="M${cx} ${cy - 8} q6 8 0 16" stroke="${color}" stroke-width="2"/>` +
           `<path d="M${cx + 6} ${cy - 12} q10 12 0 24" stroke="${color}" stroke-width="2"/>`;
  }

  // dau hoi nho: the ~temimasu (thu lam xem sao)
  function qmark(x, y, color) {
    return `<text x="${x}" y="${y}" font-size="16" fill="${color}" font-weight="700" stroke="none">?</text>`;
  }

  const EXTRA = {
    // ---------- bai 36: giac quan tu nhien, on tap dong tu suru ----------
    'きこえます': art(
      `<path d="M38 28 q22 -4 22 20 t-18 22" stroke="${INK}" stroke-width="3"/>` +
      song(66, 40, ACCENT) +
      label('nghe thấy', INK)),

    'みえます': art(
      `<path d="M20 50 q30 -22 60 0 q-30 22 -60 0 Z" stroke="${INK}" stroke-width="3"/>` +
      dot(50, 50, 6, ACCENT) +
      song(80, 36, SAGE) +
      label('nhìn thấy', INK)),

    'うんどうします': art(
      person(40, 55, INK, .9) +
      `<path d="M54 50 q10 -4 16 2" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<path d="M54 60 q12 -2 18 4" stroke="${SAGE}" stroke-width="2.5"/>` +
      label('vận động', INK)),

    'せつめいします': art(
      person(28, 58, INK, .85) +
      `<rect x="48" y="24" width="36" height="22" rx="5" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M56 32 h20 M56 39 h13" stroke="${INK}" stroke-width="2"/>` +
      label('giải thích', INK)),

    'れんしゅうします': art(
      person(36, 58, INK, .85) +
      `<path d="M62 30 a14 14 0 1 1 -4 -10" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M56 18 l4 3 -2 5 z" fill="${SAGE}" stroke="none"/>` +
      label('luyện tập', INK)),

    'こえ': art(
      `<path d="M30 55 q20 16 40 0" stroke="${ACCENT}" stroke-width="3.5"/>` +
      song(76, 44, INK) +
      label('giọng nói', INK)),

    'まじめ': art(
      person(36, 55, INK, .9) +
      `<rect x="54" y="44" width="28" height="22" rx="2" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      check(68, 56, SAGE, .7) +
      label('chăm chỉ', INK)),

    // ---------- bai 37: the bi dong ----------
    'しかられます': art(
      `<text x="34" y="58" font-size="30" fill="${ACCENT}" font-weight="700" stroke="none">!</text>` +
      bidong(56, 46, INK) +
      label('bị mắng', INK)),

    'ほめられます': art(
      `<path d="M36 32 L39 44 L51 46 L39 48 L36 60 L33 48 L21 46 L33 44 Z" stroke="${GOLD}" stroke-width="2" fill="${PAPER}"/>` +
      bidong(58, 46, INK) +
      label('được khen', INK)),

    'ぬすまれます': art(
      `<rect x="22" y="42" width="26" height="18" rx="3" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M22 48 h26" stroke="${GOLD}" stroke-width="2"/>` +
      bidong(60, 46, ACCENT) +
      label('bị trộm', INK)),

    'ふまれます': art(
      `<ellipse cx="36" cy="50" rx="9" ry="15" stroke="${INK}" stroke-width="2.5"/>` +
      bidong(60, 46, ACCENT) +
      label('bị giẫm', INK)),

    'なかれます': art(
      `<path d="M38 32 q12 16 0 26 a8 8 0 1 1 0 -26 Z" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/>` +
      bidong(62, 46, ACCENT) +
      label('bị làm phiền', INK, 8.5)),

    'おどろかれます': art(
      `<path d="M36 30 L40 44 L52 46 L40 48 L36 62 L32 48 L20 46 L32 44 Z" stroke="${ACCENT}" stroke-width="2" fill="${PAPER}"/>` +
      bidong(62, 46, INK) +
      label('làm ngạc nhiên', INK, 8)),

    'たてられます': art(
      `<path d="M24 62 V40 L38 30 L52 40 V62 Z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M32 62 V48 h12 v14" stroke="${INK}" stroke-width="2"/>` +
      bidong(64, 44, SAGE) +
      label('được xây', INK)),

    'しょうたいされます': art(
      `<rect x="20" y="40" width="30" height="20" rx="2" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M20 40 l15 12 15 -12" stroke="${ACCENT}" stroke-width="2.2"/>` +
      bidong(60, 46, INK) +
      label('được mời', INK)),

    'つくられます': art(
      `<rect x="22" y="42" width="24" height="20" rx="2" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M22 50 h24" stroke="${GOLD}" stroke-width="2"/>` +
      bidong(58, 46, INK) +
      label('được làm ra', INK, 9)),

    'よばれます': art(
      `<rect x="18" y="36" width="32" height="20" rx="6" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M26 56 l-2 8 9 -8 z" stroke="${INK}" stroke-width="2" fill="${PAPER}"/>` +
      bidong(60, 44, ACCENT) +
      label('được gọi là', INK, 9)),

    'どろぼう': art(
      person(50, 58, INK, 1) +
      `<rect x="41" y="36" width="18" height="6" rx="2" fill="${INK}" stroke="none"/>` +
      label('kẻ trộm', INK)),

    'せかいじゅう': art(
      `<circle cx="50" cy="46" r="20" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M30 46 h40 M50 26 q14 20 0 40 q-14 -20 0 -40" stroke="${SAGE}" stroke-width="2"/>` +
      label('khắp thế giới', INK, 8.5)),

    'こうじょう': art(
      `<path d="M18 62 V44 l12 8 V44 l12 8 V44 l10 6 V62 Z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<rect x="50" y="30" width="7" height="16" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M53 30 q4 -6 0 -10" stroke="${GOLD}" stroke-width="2"/>` +
      label('nhà máy', INK)),

    // ---------- bai 38: dong tu the tu dien ----------
    'およぐ': art(
      `<path d="M44 42 q10 -14 20 0" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M16 62 q8 -8 16 0 t16 0 t16 0 t16 0" stroke="${SAGE}" stroke-width="2.5"/>` +
      label('bơi', INK, 13)),

    'おどります': art(
      `<circle cx="50" cy="32" r="9" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M50 41 v18 M50 48 l-14 -12 M50 48 l14 -12 M50 59 l-10 12 M50 59 l10 12" stroke="${ACCENT}" stroke-width="3"/>` +
      label('nhảy múa', INK)),

    'もってきます': art(
      `<rect x="26" y="42" width="24" height="20" rx="2" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M54 52 h16 m-6 -6 l6 6 -6 6" stroke="${INK}" stroke-width="2.5"/>` +
      label('mang đến', INK)),

    'れんらくします': art(
      `<rect x="30" y="30" width="16" height="26" rx="4" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      song(56, 40, ACCENT) +
      label('liên lạc', INK)),

    'やくそく': art(
      `<path d="M26 50 q0 -14 14 -14" stroke="${INK}" stroke-width="4"/>` +
      `<path d="M74 50 q0 -14 -14 -14" stroke="${ACCENT}" stroke-width="4"/>` +
      label('lời hứa', INK)),

    'きく': art(
      `<path d="M38 28 q22 -4 22 20 t-18 22" stroke="${INK}" stroke-width="3"/>` +
      dot(44, 48, 3, ACCENT) +
      label('nghe', INK, 13)),

    'みる': art(
      `<path d="M20 50 q30 -20 60 0 q-30 20 -60 0 Z" stroke="${INK}" stroke-width="3"/>` +
      dot(50, 50, 6, ACCENT) +
      label('xem', INK, 13)),

    'はなす': art(
      `<rect x="22" y="34" width="34" height="22" rx="6" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M30 56 l-2 8 9 -8 z" stroke="${SAGE}" stroke-width="2" fill="${PAPER}"/>` +
      label('nói', INK, 13)),

    // ---------- bai 39: xin loi, ly do, giao thong ----------
    'こまります': art(
      `<circle cx="44" cy="44" r="14" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M38 42 q6 -6 12 0" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M62 34 q4 6 0 10 a4 4 0 1 0 0 -10" fill="${SAGE}" stroke="none"/>` +
      label('khó xử', INK)),

    'とまります': art(
      `<rect x="32" y="28" width="32" height="32" rx="4" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 44 h16" stroke="${ACCENT}" stroke-width="3.5"/>` +
      label('dừng lại', INK)),

    'よういします': art(
      `<rect x="26" y="42" width="30" height="22" rx="3" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M32 42 v-6 a9 9 0 0 1 18 0 v6" stroke="${GOLD}" stroke-width="2.5"/>` +
      check(64, 50, SAGE, .7) +
      label('chuẩn bị', INK)),

    'ようじ': art(
      `<rect x="24" y="32" width="34" height="28" rx="3" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M24 40 h34 M32 28 v8 M50 28 v8" stroke="${INK}" stroke-width="2"/>` +
      dot(46, 50, 4, ACCENT) +
      label('việc bận', INK)),

    'こうつう': art(
      `<path d="M18 56 h6 l6 -12 h24 l6 12 h6 v8 h-48 z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<circle cx="30" cy="64" r="4" fill="${INK}" stroke="none"/><circle cx="58" cy="64" r="4" fill="${INK}" stroke="none"/>` +
      label('giao thông', INK)),

    'もうしわけありません': art(
      `<circle cx="58" cy="36" r="8" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M58 44 q-24 8 -24 20" stroke="${INK}" stroke-width="3"/>` +
      label('thành thật xin lỗi', ACCENT, 7)),

    'しつれいします': art(
      person(32, 56, INK, .85) +
      `<path d="M54 28 v34" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M58 46 h14 m-6 -6 l6 6 -6 6" stroke="${SAGE}" stroke-width="2.5"/>` +
      label('xin phép', INK)),

    'しんぱいします': art(
      `<path d="M50 62 C30 46 34 30 50 38 C66 30 70 46 50 62 Z" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M38 26 q4 -4 0 -8 M50 24 q4 -4 0 -8 M62 26 q4 -4 0 -8" stroke="${INK}" stroke-width="2"/>` +
      label('lo lắng', INK)),

    // ---------- bai 40: the ~temimasu (thu lam xem sao) ----------
    'たべてみます': art(
      `<path d="M32 26 v18 M38 26 v18 M32 33 h6" stroke="${INK}" stroke-width="2.2"/>` +
      `<path d="M54 26 v30 q0 6 6 6" stroke="${INK}" stroke-width="2.2"/>` +
      qmark(76, 34, ACCENT) +
      label('thử ăn', INK)),

    'きてみます': art(
      `<path d="M34 32 l10 -6 8 0 10 6 -4 10 -4 -2 v26 h-16 v-26 l-4 2 Z" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/>` +
      qmark(72, 34, ACCENT) +
      label('thử mặc', INK)),

    'やってみます': art(
      `<circle cx="40" cy="48" r="12" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 36 v-8" stroke="${GOLD}" stroke-width="3"/>` +
      qmark(70, 40, ACCENT) +
      label('thử làm', INK)),

    'わかりません': art(
      qmark(38, 52, INK) +
      `<path d="M58 40 l14 14 M72 40 l-14 14" stroke="${ACCENT}" stroke-width="3"/>` +
      label('không hiểu', INK)),
  };

  window.SenseiArt.extend(EXTRA);

  // Alias sang dang kanji cho tung tu co kanji
  window.SenseiArt.extend({
    '聞こえます': EXTRA['きこえます'],
    '見えます': EXTRA['みえます'],
    '運動します': EXTRA['うんどうします'],
    '説明します': EXTRA['せつめいします'],
    '練習します': EXTRA['れんしゅうします'],
    '声': EXTRA['こえ'],
    '真面目': EXTRA['まじめ'],
    '叱られます': EXTRA['しかられます'],
    '褒められます': EXTRA['ほめられます'],
    '盗まれます': EXTRA['ぬすまれます'],
    '踏まれます': EXTRA['ふまれます'],
    '泣かれます': EXTRA['なかれます'],
    '驚かれます': EXTRA['おどろかれます'],
    '建てられます': EXTRA['たてられます'],
    '招待されます': EXTRA['しょうたいされます'],
    '作られます': EXTRA['つくられます'],
    '呼ばれます': EXTRA['よばれます'],
    '泥棒': EXTRA['どろぼう'],
    '世界中': EXTRA['せかいじゅう'],
    '工場': EXTRA['こうじょう'],
    '泳ぐ': EXTRA['およぐ'],
    '踊ります': EXTRA['おどります'],
    '持って来ます': EXTRA['もってきます'],
    '連絡します': EXTRA['れんらくします'],
    '約束': EXTRA['やくそく'],
    '聞く': EXTRA['きく'],
    '見る': EXTRA['みる'],
    '話す': EXTRA['はなす'],
    '困ります': EXTRA['こまります'],
    '止まります': EXTRA['とまります'],
    '用意します': EXTRA['よういします'],
    '用事': EXTRA['ようじ'],
    '交通': EXTRA['こうつう'],
    '申し訳ありません': EXTRA['もうしわけありません'],
    '失礼します': EXTRA['しつれいします'],
    '心配します': EXTRA['しんぱいします'],
    '食べてみます': EXTRA['たべてみます'],
    '着てみます': EXTRA['きてみます'],
    '分かりません': EXTRA['わかりません'],
  });
})();
