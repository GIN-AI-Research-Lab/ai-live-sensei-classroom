/**
 * Sensei Art — lo minh hoa bo sung N3 (lo 1/6): bai 1-4.
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

  /** Ngoi sao 4 canh don gian — gioi, xuat sac, thanh cong. */
  function star(cx, cy, color, scale) {
    const s = scale || 1;
    return `<path d="M${cx} ${cy - 9 * s} l${3 * s} ${6 * s} ${7 * s} ${1 * s} -${5 * s} ${5 * s} ${1 * s} ${7 * s} ` +
           `-${6 * s} -${4 * s} -${6 * s} ${4 * s} ${1 * s} -${7 * s} -${5 * s} -${5 * s} ${7 * s} -${1 * s} z" ` +
           `fill="${color}" stroke="none"/>`;
  }

  /** Mui ten thang tu diem 1 den diem 2, co dau nhon. */
  function arrow(x1, y1, x2, y2, color) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const hx1 = (x2 - 7 * Math.cos(a - 0.5)).toFixed(1), hy1 = (y2 - 7 * Math.sin(a - 0.5)).toFixed(1);
    const hx2 = (x2 - 7 * Math.cos(a + 0.5)).toFixed(1), hy2 = (y2 - 7 * Math.sin(a + 0.5)).toFixed(1);
    return `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${color}" stroke-width="3"/>` +
           `<path d="M${hx1} ${hy1} L${x2} ${y2} L${hx2} ${hy2}" stroke="${color}" stroke-width="3"/>`;
  }

  /** Vong tron rong — bien hieu, con dau, khung. */
  function ring(cx, cy, r, color, width) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${color}" stroke-width="${width || 3}" fill="${PAPER}"/>`;
  }

  /** Ky tu don le dat tu do (!, ?, …). */
  function glyph(x, y, ch, color, size) {
    return `<text x="${x}" y="${y}" font-size="${size || 16}" fill="${color}" font-weight="800" text-anchor="middle" stroke="none">${ch}</text>`;
  }

  /** To giay/van ban voi vai dong chu. */
  function doc(x, y, w, h, color) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" stroke="${color}" stroke-width="2.5" fill="${PAPER}"/>` +
           `<path d="M${x + 8} ${y + 12} h${w - 16} M${x + 8} ${y + 20} h${w - 16} M${x + 8} ${y + 28} h${w - 28}" stroke="${color}" stroke-width="2"/>`;
  }

  const EXTRA = {};

  // ---------- bai 1: tin tuong, hieu lam, chuyen mon, ket qua ----------
  EXTRA['しんじます'] = art(
    `<path d="M50 32 C44 22 26 25 26 40 C26 56 50 72 50 72 C50 72 74 56 74 40 C74 25 56 22 50 32 Z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
    check(50, 46, SAGE, .7) +
    label('tin tưởng', ACCENT, 11));
  EXTRA['信じます'] = EXTRA['しんじます'];

  EXTRA['ごかいします'] = art(
    `<path d="M22 26 h56 a4 4 0 0 1 4 4 v28 a4 4 0 0 1 -4 4 h-30 l-10 10 v-10 h-16 a4 4 0 0 1 -4 -4 v-28 a4 4 0 0 1 4 -4 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
    `<path d="M38 36 L62 58 M62 36 L38 58" stroke="${ACCENT}" stroke-width="4"/>` +
    label('hiểu lầm', ACCENT, 12));
  EXTRA['誤解します'] = EXTRA['ごかいします'];

  EXTRA['かんちがいします'] = art(
    `<path d="M28 30 L46 30 L37 46 Z" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
    `<circle cx="66" cy="38" r="10" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
    glyph(50, 70, '?', GOLD, 22) +
    label('nhầm lẫn', GOLD, 11));
  EXTRA['勘違いします'] = EXTRA['かんちがいします'];

  EXTRA['じょうたつします'] = art(
    arrow(50, 78, 50, 30, SAGE) +
    star(50, 22, GOLD, 1) +
    label('tiến bộ', SAGE, 12));
  EXTRA['上達します'] = EXTRA['じょうたつします'];

  EXTRA['せんもん'] = art(
    `<rect x="36" y="20" width="28" height="50" rx="2" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
    `<path d="M36 34 h28" stroke="${INK}" stroke-width="2"/>` +
    star(74, 24, GOLD, .8) +
    label('chuyên môn', INK, 10));
  EXTRA['専門'] = EXTRA['せんもん'];
  EXTRA['せんもんです'] = EXTRA['せんもん'];
  EXTRA['専門です'] = EXTRA['せんもん'];

  EXTRA['くわしい'] = art(
    doc(22, 20, 40, 50, INK) +
    `<circle cx="72" cy="60" r="12" stroke="${ACCENT}" stroke-width="3"/>` +
    `<path d="M81 69 L92 80" stroke="${ACCENT}" stroke-width="4"/>` +
    label('rành, tường tận', ACCENT, 9));
  EXTRA['詳しい'] = EXTRA['くわしい'];

  EXTRA['にがて'] = art(
    star(50, 42, SAGE, 1.3) +
    `<path d="M28 60 L72 24" stroke="${ACCENT}" stroke-width="4"/>` +
    label('không giỏi', ACCENT, 11));
  EXTRA['苦手'] = EXTRA['にがて'];

  EXTRA['せいかく'] = art(
    `<circle cx="50" cy="46" r="26" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
    `<path d="M50 46 m-12 0 a12 12 0 1 1 24 0 a8 8 0 1 1 -16 0 a4 4 0 1 1 8 0" stroke="${ACCENT}" stroke-width="2.5"/>` +
    label('tính cách', INK, 11));
  EXTRA['性格'] = EXTRA['せいかく'];

  EXTRA['けっか'] = art(
    arrow(50, 20, 50, 56, SAGE) +
    `<path d="M24 60 h52 v16 h-52 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
    label('kết quả', INK, 12));
  EXTRA['結果'] = EXTRA['けっか'];

  EXTRA['ぐうぜん'] = art(
    `<rect x="30" y="28" width="40" height="40" rx="6" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
    dot(42, 40, 3, GOLD) + dot(58, 40, 3, GOLD) + dot(42, 56, 3, GOLD) + dot(58, 56, 3, GOLD) + dot(50, 48, 3, GOLD) +
    label('ngẫu nhiên', GOLD, 10));
  EXTRA['偶然'] = EXTRA['ぐうぜん'];

  EXTRA['とくい'] = art(
    person(40, 54, INK, .9) +
    star(70, 32, GOLD, 1) +
    label('giỏi, sở trường', GOLD, 9));
  EXTRA['得意'] = EXTRA['とくい'];

  EXTRA['さんか'] = art(
    ring(58, 50, 22, SAGE) +
    arrow(12, 50, 34, 50, ACCENT) +
    label('tham gia', SAGE, 12));
  EXTRA['参加'] = EXTRA['さんか'];

  EXTRA['さんせい'] = art(
    person(24, 56, INK, .8) + person(76, 56, SAGE, .8) +
    check(50, 42, GOLD, 1) +
    label('tán thành', GOLD, 11));
  EXTRA['賛成'] = EXTRA['さんせい'];

  EXTRA['きろく'] = art(
    `<path d="M36 26 h28 v16 a14 14 0 0 1 -28 0 z" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
    `<path d="M36 30 q-10 0 -10 10 q0 8 10 8 M64 30 q10 0 10 10 q0 8 -10 8" stroke="${GOLD}" stroke-width="2.5"/>` +
    `<path d="M50 56 v10 M42 66 h16 v8 h-16 z" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
    star(50, 16, ACCENT, .7) +
    label('kỷ lục', GOLD, 12));
  EXTRA['記録'] = EXTRA['きろく'];

  // ---------- bai 2: no luc, y thuc ----------
  EXTRA['どりょくします'] = art(
    `<circle cx="26" cy="50" r="10" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
    `<circle cx="74" cy="50" r="10" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
    `<path d="M36 50 h28" stroke="${ACCENT}" stroke-width="5"/>` +
    label('nỗ lực', ACCENT, 12));
  EXTRA['努力します'] = EXTRA['どりょくします'];
  EXTRA['どりょく'] = EXTRA['どりょくします'];
  EXTRA['努力'] = EXTRA['どりょくします'];

  EXTRA['いしきします'] = art(
    `<circle cx="50" cy="42" r="16" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
    `<path d="M44 58 h12 v8 a6 6 0 0 1 -12 0 z" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
    `<path d="M50 20 v6 M28 42 h6 M72 42 h-6 M35 27 l4 4 M65 27 l-4 4" stroke="${GOLD}" stroke-width="2.5"/>` +
    label('ý thức', GOLD, 12));
  EXTRA['意識します'] = EXTRA['いしきします'];
  EXTRA['いしき'] = EXTRA['いしきします'];
  EXTRA['意識'] = EXTRA['いしきします'];

  EXTRA['こころがけます'] = art(
    `<path d="M50 34 C44 24 26 27 26 42 C26 58 50 74 50 74 C50 74 74 58 74 42 C74 27 56 24 50 34 Z" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
    check(50, 48, GOLD, .7) +
    label('luôn để tâm', SAGE, 10));
  EXTRA['心掛けます'] = EXTRA['こころがけます'];

  // ---------- bai 3: quy dinh, quyet tam, dong phuc ----------
  EXTRA['まもります'] = art(
    `<path d="M50 18 L78 28 V52 C78 68 66 78 50 84 C34 78 22 68 22 52 V28 Z" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
    check(50, 52, SAGE, .9) +
    label('tuân thủ', SAGE, 11));
  EXTRA['守ります'] = EXTRA['まもります'];

  EXTRA['きんしします'] = art(
    ring(50, 46, 28, ACCENT, 5) +
    `<path d="M30 26 L70 66" stroke="${ACCENT}" stroke-width="5"/>` +
    label('cấm chỉ', ACCENT, 12));
  EXTRA['禁止します'] = EXTRA['きんしします'];

  EXTRA['けっしんします'] = art(
    ring(50, 44, 24, ACCENT, 4) +
    glyph(50, 54, '!', ACCENT, 30) +
    label('quyết tâm', ACCENT, 11));
  EXTRA['決心します'] = EXTRA['けっしんします'];
  EXTRA['けっしん'] = EXTRA['けっしんします'];
  EXTRA['決心'] = EXTRA['けっしんします'];

  EXTRA['きまり'] = art(
    doc(24, 18, 48, 56, INK) +
    check(66, 66, SAGE, .8) +
    label('quy định', INK, 11));
  EXTRA['決まり'] = EXTRA['きまり'];

  EXTRA['ぎむ'] = art(
    doc(22, 18, 46, 56, INK) +
    ring(72, 64, 14, GOLD, 3) +
    star(72, 64, GOLD, .5) +
    label('nghĩa vụ', GOLD, 11));
  EXTRA['義務'] = EXTRA['ぎむ'];

  EXTRA['きてい'] = art(
    doc(22, 18, 48, 56, INK) +
    ring(70, 62, 12, ACCENT, 3) +
    `<path d="M64 62 h12 M70 56 v12" stroke="${ACCENT}" stroke-width="2"/>` +
    label('quy định', ACCENT, 11));
  EXTRA['規定'] = EXTRA['きてい'];

  EXTRA['せいふく'] = art(
    `<path d="M38 24 L26 32 L32 44 L38 40 V78 H62 V40 L68 44 L74 32 L62 24 Q56 32 50 32 Q44 32 38 24 Z" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
    dot(50, 50, 2.5, SAGE) + dot(50, 60, 2.5, SAGE) +
    label('đồng phục', SAGE, 11));
  EXTRA['制服'] = EXTRA['せいふく'];

  EXTRA['まいしゅう'] = art(
    `<rect x="22" y="24" width="56" height="48" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
    `<path d="M22 38 h56" stroke="${INK}" stroke-width="2.5"/>` +
    `<rect x="30" y="46" width="10" height="10" fill="${ACCENT}" stroke="none"/>` +
    `<rect x="45" y="46" width="10" height="10" stroke="${INK}" stroke-width="1.8"/>` +
    `<rect x="60" y="46" width="10" height="10" stroke="${INK}" stroke-width="1.8"/>` +
    `<path d="M32 18 v10 M68 18 v10" stroke="${INK}" stroke-width="3"/>` +
    label('mỗi tuần', ACCENT, 12));
  EXTRA['毎週'] = EXTRA['まいしゅう'];

  EXTRA['たいしょく'] = art(
    `<rect x="18" y="42" width="34" height="26" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
    `<path d="M28 42 v-8 a6 6 0 0 1 12 0 v8" stroke="${INK}" stroke-width="2.5"/>` +
    arrow(58, 55, 84, 55, ACCENT) +
    label('nghỉ hưu', ACCENT, 12));
  EXTRA['退職'] = EXTRA['たいしょく'];

  // ---------- bai 4: thanh cong, tre gio, nho co ----------
  EXTRA['せいこうします'] = art(
    arrow(28, 78, 62, 30, SAGE) +
    star(70, 22, GOLD, 1.1) +
    label('thành công', SAGE, 11));
  EXTRA['成功します'] = EXTRA['せいこうします'];
  EXTRA['せいこう'] = EXTRA['せいこうします'];
  EXTRA['成功'] = EXTRA['せいこうします'];

  EXTRA['ちこくします'] = art(
    ring(44, 46, 26, ACCENT, 3) +
    `<path d="M44 46 L44 28 M44 46 L62 54" stroke="${ACCENT}" stroke-width="3"/>` +
    dot(44, 46, 3, ACCENT) +
    glyph(80, 26, '!', ACCENT, 20) +
    label('đến muộn', ACCENT, 11));
  EXTRA['遅刻します'] = EXTRA['ちこくします'];
  EXTRA['ちこく'] = EXTRA['ちこくします'];
  EXTRA['遅刻'] = EXTRA['ちこくします'];

  EXTRA['たすけます'] = art(
    person(26, 46, SAGE, .9) +
    arrow(38, 52, 60, 60, GOLD) +
    person(78, 68, INK, .6) +
    label('giúp đỡ', SAGE, 12));
  EXTRA['助けます'] = EXTRA['たすけます'];

  EXTRA['おかげ'] = art(
    `<circle cx="50" cy="26" r="12" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
    `<path d="M50 8 v6 M28 26 h6 M72 26 h-6 M35 11 l4 4 M65 11 l-4 4" stroke="${GOLD}" stroke-width="2.5"/>` +
    person(50, 68, INK, 1) +
    label('nhờ có', GOLD, 13));
  EXTRA['お陰'] = EXTRA['おかげ'];

  EXTRA['しっぱい'] = art(
    ring(50, 46, 26, ACCENT, 3) +
    `<path d="M38 34 L62 58 M62 34 L38 58" stroke="${ACCENT}" stroke-width="5"/>` +
    label('thất bại', ACCENT, 12));
  EXTRA['失敗'] = EXTRA['しっぱい'];

  EXTRA['じゅうたい'] = art(
    `<rect x="14" y="46" width="30" height="18" rx="4" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
    `<rect x="46" y="46" width="30" height="18" rx="4" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
    glyph(86, 46, '!', ACCENT, 20) +
    label('kẹt xe', INK, 13));
  EXTRA['渋滞'] = EXTRA['じゅうたい'];

  EXTRA['うっかり'] = art(
    person(42, 54, INK, 1) +
    `<path d="M62 30 q6 8 0 14 q-6 -2 -4 -8 z" fill="${SAGE}" stroke="none"/>` +
    label('lỡ, vô ý', GOLD, 11));

  window.SenseiArt.extend(EXTRA);
})();
