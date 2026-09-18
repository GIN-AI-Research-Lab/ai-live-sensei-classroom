/**
 * Sensei Art — lo minh hoa bo sung N3 (lo 3/6): bai 8-11.
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

  // dau hoi: gia dinh / dieu kien / thac mac
  function qmark(x, y, color, size) {
    return `<text x="${x}" y="${y}" font-size="${size || 20}" fill="${color}" ` +
           `font-weight="700" stroke="none">?</text>`;
  }

  // mui ten thang, dau mui tinh theo goc thuc: dan chung, xu huong
  function arrow(x1, y1, x2, y2, color) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const ax = (x2 - 9 * Math.cos(a - 0.5)).toFixed(1);
    const ay = (y2 - 9 * Math.sin(a - 0.5)).toFixed(1);
    const bx = (x2 - 9 * Math.cos(a + 0.5)).toFixed(1);
    const by = (y2 - 9 * Math.sin(a + 0.5)).toFixed(1);
    return `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${color}" stroke-width="3"/>` +
           `<path d="M${ax} ${ay} L${x2} ${y2} L${bx} ${by}" stroke="${color}" stroke-width="3"/>`;
  }

  // mat buon: cam xuc tieu cuc (ghen ti, tiec nuoi, bat an, dau kho, bat man)
  function frown(cx, cy, color, scale) {
    const s = scale || 1;
    return `<circle cx="${cx}" cy="${cy}" r="${14 * s}" stroke="${color}" stroke-width="2.5"/>` +
           `<circle cx="${cx - 5 * s}" cy="${cy - 3 * s}" r="1.6" fill="${color}" stroke="none"/>` +
           `<circle cx="${cx + 5 * s}" cy="${cy - 3 * s}" r="1.6" fill="${color}" stroke="none"/>` +
           `<path d="M${cx - 6 * s} ${cy + 8 * s} q${6 * s} -${6 * s} ${12 * s} 0" stroke="${color}" stroke-width="2.2"/>`;
  }

  // giot nuoc: nuoc mat hoac mo hoi
  function tear(cx, cy, color, scale) {
    const s = scale || 1;
    return `<path d="M${cx} ${cy - 10 * s} q${8 * s} ${10 * s} 0 ${16 * s} q-${8 * s} -${6 * s} 0 -${16 * s} Z" ` +
           `stroke="${color}" stroke-width="2.2" fill="${PAPER}"/>`;
  }

  // lap lanh 4 canh: tai nang, xuat sac, vo dich, may man
  function star(cx, cy, color, scale) {
    const s = scale || 1;
    return `<path d="M${cx} ${cy - 14 * s} L${cx + 3 * s} ${cy - 2 * s} L${cx + 15 * s} ${cy} ` +
           `L${cx + 3 * s} ${cy + 2 * s} L${cx} ${cy + 14 * s} L${cx - 3 * s} ${cy + 2 * s} ` +
           `L${cx - 15 * s} ${cy} L${cx - 3 * s} ${cy - 2 * s} Z" stroke="${color}" stroke-width="2" fill="${PAPER}"/>`;
  }

  // trai tim: cam dong, mong muon
  function heart(cx, cy, color, scale) {
    const s = scale || 1;
    return `<path d="M${cx} ${cy + 10 * s} C${cx - 18 * s} ${cy - 6 * s} ${cx - 6 * s} ${cy - 16 * s} ${cx} ${cy - 6 * s} ` +
           `C${cx + 6 * s} ${cy - 16 * s} ${cx + 18 * s} ${cy - 6 * s} ${cx} ${cy + 10 * s} Z" ` +
           `stroke="${color}" stroke-width="2.5" fill="${PAPER}"/>`;
  }

  const EXTRA = {
    // ---------- bai 8: dieu kien, gia dinh, co hoi ----------
    'じょうけん': art(
      qmark(26, 50, ACCENT, 20) +
      arrow(40, 50, 66, 50, INK) +
      check(80, 46, SAGE, .7) +
      label('điều kiện')),

    'せいこうします': art(
      arrow(24, 66, 62, 28, INK) +
      star(72, 20, GOLD, .8) +
      label('thành công')),

    'あたります': art(
      `<circle cx="50" cy="46" r="18" stroke="${INK}" stroke-width="2.5"/>` +
      `<circle cx="50" cy="46" r="9" stroke="${ACCENT}" stroke-width="2.5"/>` +
      dot(50, 46, 3.5, GOLD) +
      label('trúng, đúng', INK, 9)),

    'かてい': art(
      `<circle cx="38" cy="42" r="12" stroke="${INK}" stroke-width="2.5"/>` +
      `<circle cx="54" cy="37" r="15" stroke="${INK}" stroke-width="2.5"/>` +
      `<circle cx="67" cy="45" r="10" stroke="${INK}" stroke-width="2.5"/>` +
      qmark(52, 50, ACCENT, 16) +
      label('giả định')),

    'どりょくします': art(
      person(38, 56, INK, .9) +
      tear(60, 32, SAGE, .55) +
      `<path d="M50 50 q8 -4 12 -10" stroke="${ACCENT}" stroke-width="2.5"/>` +
      label('nỗ lực, cố gắng', INK, 8.5)),

    'まんいち': art(
      `<path d="M24 46 a26 22 0 0 1 52 0 Z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M50 46 v22 q0 6 -6 6" stroke="${INK}" stroke-width="2.5"/>` +
      qmark(72, 34, ACCENT, 14) +
      label('vạn nhất, lỡ như', INK, 8.5)),

    'ゆうしょうします': art(
      `<path d="M38 28 h24 v10 a12 12 0 0 1 -24 0 Z" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M50 50 v10 M40 60 h20" stroke="${GOLD}" stroke-width="2.5"/>` +
      star(50, 18, ACCENT, .5) +
      label('vô địch')),

    'チャンス': art(
      `<path d="M28 20 v56 h28 v-56 Z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M56 20 l16 6 v44 l-16 6" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M78 30 l10 -4 M80 40 h12 M78 50 l10 4" stroke="${GOLD}" stroke-width="2"/>` +
      label('cơ hội')),

    'しかく': art(
      `<rect x="22" y="30" width="42" height="30" rx="2" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M29 40 h20 M29 47 h14" stroke="${INK}" stroke-width="2"/>` +
      `<circle cx="68" cy="58" r="10" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      check(68, 58, GOLD, .5) +
      label('tư cách, chứng chỉ', INK, 8)),

    'たからくじ': art(
      `<rect x="16" y="38" width="54" height="24" rx="4" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M43 38 v24" stroke="${INK}" stroke-width="2" stroke-dasharray="3 3"/>` +
      star(57, 50, GOLD, .55) +
      label('xổ số', INK, 13)),

    'もし': art(
      qmark(38, 58, ACCENT, 36) +
      arrow(64, 40, 82, 40, INK) +
      label('nếu (như)')),

    // ---------- bai 9: met moi, xu huong, dinh duong ----------
    'がち': art(
      `<path d="M50 24 a20 20 0 1 1 -14 6" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M32 24 l6 -8 l6 8 Z" fill="${INK}" stroke="none"/>` +
      dot(50, 44, 3, ACCENT) +
      label('hay có xu hướng...', INK, 8)),

    'ぎみ': art(
      `<path d="M26 58 a24 24 0 0 1 48 0" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M50 58 L37 45" stroke="${ACCENT}" stroke-width="3"/>` +
      label('có vẻ hơi...', INK, 9)),

    'けっせきします': art(
      `<path d="M32 62 V40 h24 V62 M32 50 h24 M32 62 v8 M56 62 v8" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M64 30 l12 12 M76 30 l-12 12" stroke="${ACCENT}" stroke-width="3"/>` +
      label('vắng mặt, nghỉ', INK, 9)),

    'ちこくします': art(
      `<circle cx="42" cy="46" r="18" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M42 46 V32 M42 46 l10 6" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M66 56 l10 6 M76 56 l-10 6" stroke="${ACCENT}" stroke-width="3"/>` +
      label('đi trễ, đến muộn', INK, 8.5)),

    'つかれ': art(
      person(40, 58, INK, .85) +
      `<text x="60" y="30" font-size="14" fill="${SAGE}" font-weight="700" stroke="none">z</text>` +
      `<text x="70" y="20" font-size="10" fill="${SAGE}" font-weight="700" stroke="none">z</text>` +
      label('mệt mỏi')),

    'けいこう': art(
      `<path d="M22 66 H78 M22 66 V18" stroke="${INK}" stroke-width="2.5"/>` +
      arrow(28, 58, 68, 26, ACCENT) +
      label('xu hướng')),

    'ふそく': art(
      `<rect x="36" y="24" width="28" height="44" rx="4" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<rect x="38" y="56" width="24" height="10" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M44 40 h12" stroke="${ACCENT}" stroke-width="3.5"/>` +
      label('thiếu hụt')),

    'すいみん': art(
      `<path d="M16 64 V46 h60 v18 M16 54 h60" stroke="${INK}" stroke-width="2.5"/>` +
      dot(30, 40, 4, INK) +
      `<text x="64" y="28" font-size="16" fill="${SAGE}" font-weight="700" stroke="none">Z</text>` +
      label('giấc ngủ')),

    'えいよう': art(
      `<circle cx="50" cy="44" r="16" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M50 28 q2 -8 8 -10" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<path d="M72 28 h10 M77 23 v10" stroke="${SAGE}" stroke-width="2.5"/>` +
      label('dinh dưỡng')),

    'さいきん': art(
      `<rect x="24" y="26" width="44" height="38" rx="3" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M24 38 h44" stroke="${INK}" stroke-width="2"/>` +
      dot(54, 52, 5, ACCENT) +
      label('gần đây')),

    // ---------- bai 10: tai nang, thai do, ngheo ----------
    'さいのう': art(
      star(48, 42, GOLD, 1.1) +
      star(70, 24, ACCENT, .5) +
      label('tài năng, năng khiếu', INK, 8)),

    'もんく': art(
      `<path d="M20 26 h48 v26 h-30 l-8 10 v-10 h-10 Z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M28 34 l8 8 l8 -8 l8 8 l8 -8" stroke="${ACCENT}" stroke-width="2.2"/>` +
      label('lời phàn nàn', INK, 9)),

    'ふまん': art(
      frown(46, 46, INK, 1.3) +
      `<path d="M68 26 q4 -6 0 -10 M75 30 q5 -8 0 -14" stroke="${ACCENT}" stroke-width="2"/>` +
      label('bất mãn, không hài lòng', INK, 7.5)),

    'まずしい': art(
      `<path d="M18 40 h44 v26 h-44 Z M18 40 l6 -10 h32 l6 10" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<circle cx="72" cy="56" r="6" stroke="${GOLD}" stroke-width="2"/>` +
      arrow(72, 64, 72, 78, GOLD) +
      label('nghèo', INK, 13)),

    'さんかします': art(
      `<circle cx="60" cy="46" r="16" stroke="${SAGE}" stroke-width="2" stroke-dasharray="4 3"/>` +
      person(60, 50, SAGE, .55) +
      person(26, 54, INK, .8) +
      arrow(40, 50, 50, 48, ACCENT) +
      label('tham gia', INK, 9)),

    'ゆうしゅう': art(
      `<circle cx="50" cy="46" r="15" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      star(50, 46, GOLD, .55) +
      `<path d="M41 59 l-8 17 M59 59 l8 17" stroke="${GOLD}" stroke-width="2.5"/>` +
      label('xuất sắc, ưu tú', INK, 8.5)),

    'ちゅうしします': art(
      `<circle cx="50" cy="44" r="20" stroke="${ACCENT}" stroke-width="3.5" fill="${PAPER}"/>` +
      `<path d="M36 30 L64 58" stroke="${ACCENT}" stroke-width="3.5"/>` +
      label('hủy bỏ, dừng lại', INK, 9)),

    'たいど': art(
      person(34, 56, INK, .9) +
      `<circle cx="68" cy="34" r="12" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M62 36 q6 -5 12 0" stroke="${SAGE}" stroke-width="2"/>` +
      label('thái độ')),

    // どりょくします (努力します): đã vẽ ở bài 8 phía trên, bài 10 dùng lại

    'たいかい': art(
      `<rect x="20" y="50" width="18" height="16" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<rect x="40" y="34" width="20" height="32" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<rect x="62" y="44" width="18" height="22" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      star(50, 22, GOLD, .5) +
      label('đại hội')),

    'わかい': art(
      `<path d="M20 68 H80" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M50 68 V42" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M50 46 q-14 -4 -14 -18 q14 0 14 12 M50 42 q14 -6 14 -20 q-14 0 -14 14" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/>` +
      label('trẻ, còn trẻ tuổi', INK, 8.5)),

    // ---------- bai 11: cam xuc ----------
    'うらやましい': art(
      frown(32, 50, INK, 1) +
      star(72, 32, GOLD, .7) +
      `<path d="M44 42 L58 34" stroke="${ACCENT}" stroke-width="1.5" stroke-dasharray="2 3"/>` +
      label('ghen tị')),

    'くやしい': art(
      frown(40, 44, INK, 1) +
      tear(58, 54, ACCENT, .8) +
      `<circle cx="76" cy="58" r="7" stroke="${INK}" stroke-width="2.5"/>` +
      label('tiếc nuối, cay cú', INK, 8.5)),

    'ふあん': art(
      frown(40, 50, INK, 1) +
      qmark(66, 32, ACCENT, 18) +
      `<path d="M60 60 q4 4 0 8 q-4 4 0 8" stroke="${SAGE}" stroke-width="1.8"/>` +
      label('bất an, lo lắng', INK, 9)),

    'つらい': art(
      frown(46, 54, INK, 1) +
      `<rect x="34" y="20" width="24" height="14" rx="2" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M40 34 v8 M52 34 v8" stroke="${ACCENT}" stroke-width="2.2"/>` +
      label('đau khổ, vất vả', INK, 9)),

    'おそろしい': art(
      `<circle cx="50" cy="46" r="15" stroke="${INK}" stroke-width="2.5"/>` +
      `<circle cx="44" cy="42" r="2" fill="${INK}" stroke="none"/><circle cx="56" cy="42" r="2" fill="${INK}" stroke="none"/>` +
      `<circle cx="50" cy="54" r="4" stroke="${ACCENT}" stroke-width="2"/>` +
      `<path d="M30 30 l-7 -7 M70 30 l7 -7 M50 25 v-9 M33 62 l-9 5 M67 62 l9 5" stroke="${ACCENT}" stroke-width="2"/>` +
      label('đáng sợ, khủng khiếp', INK, 7.5)),

    'かんどうします': art(
      heart(40, 46, ACCENT, 1) +
      `<path d="M64 24 l-11 19 h8 l-11 19 l18 -21 h-8 Z" fill="${GOLD}" stroke="${GOLD}" stroke-width="1"/>` +
      label('cảm động, xúc động', INK, 8.5)),

    'なみだ': art(
      tear(50, 44, ACCENT, 1.8) +
      label('nước mắt', INK, 13)),

    'きになります': art(
      `<circle cx="44" cy="46" r="16" stroke="${INK}" stroke-width="2.5"/>` +
      qmark(38, 53, ACCENT, 20) +
      `<path d="M64 28 a10 10 0 1 1 -3 10" stroke="${SAGE}" stroke-width="2"/>` +
      label('bận tâm, để ý', INK, 9)),

    'あいたい': art(
      person(24, 56, INK, .72) +
      person(76, 56, ACCENT, .72) +
      heart(50, 44, ACCENT, .7) +
      label('muốn gặp')),

    'たべたい': art(
      `<path d="M24 50 a26 15 0 0 0 52 0 Z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M62 50 l14 -22 M66 50 l14 -20" stroke="${GOLD}" stroke-width="2.2"/>` +
      heart(48, 24, ACCENT, .6) +
      label('muốn ăn')),
  };

  window.SenseiArt.extend(EXTRA);

  // Alias sang dang kanji cho tung tu co kanji khac voi word
  window.SenseiArt.extend({
    '条件': EXTRA['じょうけん'],
    '成功します': EXTRA['せいこうします'],
    '当たります': EXTRA['あたります'],
    '仮定': EXTRA['かてい'],
    '努力します': EXTRA['どりょくします'],
    '万一': EXTRA['まんいち'],
    '優勝します': EXTRA['ゆうしょうします'],
    '資格': EXTRA['しかく'],
    '宝くじ': EXTRA['たからくじ'],
    '〜がち': EXTRA['がち'],
    '気味': EXTRA['ぎみ'],
    '欠席します': EXTRA['けっせきします'],
    '遅刻します': EXTRA['ちこくします'],
    '疲れ': EXTRA['つかれ'],
    '傾向': EXTRA['けいこう'],
    '不足': EXTRA['ふそく'],
    '睡眠': EXTRA['すいみん'],
    '栄養': EXTRA['えいよう'],
    '最近': EXTRA['さいきん'],
    '才能': EXTRA['さいのう'],
    '文句': EXTRA['もんく'],
    '不満': EXTRA['ふまん'],
    '貧しい': EXTRA['まずしい'],
    '参加します': EXTRA['さんかします'],
    '優秀': EXTRA['ゆうしゅう'],
    '中止します': EXTRA['ちゅうしします'],
    '態度': EXTRA['たいど'],
    '大会': EXTRA['たいかい'],
    '若い': EXTRA['わかい'],
    '羨ましい': EXTRA['うらやましい'],
    '悔しい': EXTRA['くやしい'],
    '不安': EXTRA['ふあん'],
    '辛い': EXTRA['つらい'],
    '恐ろしい': EXTRA['おそろしい'],
    '感動します': EXTRA['かんどうします'],
    '涙': EXTRA['なみだ'],
    '気になります': EXTRA['きになります'],
    '会いたい': EXTRA['あいたい'],
    '食べたい': EXTRA['たべたい'],
  });
})();
