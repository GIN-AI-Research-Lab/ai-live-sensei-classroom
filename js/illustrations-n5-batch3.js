/**
 * Sensei Art — lo minh hoa bo sung N5 (lo 3/5): bai 6-11, ~85 tu.
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

  /** Nhan chu tieng Viet o day duoi hinh */
  function label(text, color, size, y, weight) {
    return `<text x="50" y="${y || 94}" font-size="${size || 10}" fill="${color}" ` +
           `font-weight="${weight || 600}" text-anchor="middle" stroke="none">${text}</text>`;
  }

  /** Hai vach hoi nuoc bay len tu (x, y) */
  function steam(x, y, color) {
    return `<path d="M ${x - 6} ${y} q -5 -8 0 -15 q 5 -7 0 -15" stroke="${color}" stroke-width="2.2" opacity=".7"/>` +
           `<path d="M ${x + 6} ${y} q -5 -8 0 -15 q 5 -7 0 -15" stroke="${color}" stroke-width="2.2" opacity=".7"/>`;
  }

  function dot(cx, cy, r, color) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="none"/>`;
  }

  /** Hop tham chieu dung cho nhom tu chi vi tri (tren/duoi/trong/ngoai...) */
  function refBox(x, y, w, h, color, fill) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" stroke="${color}" stroke-width="3" fill="${fill || 'none'}"/>`;
  }

  /** Ngoi nha don gian (co cua) dung lam moc truoc/sau */
  function house(x, y, color) {
    return `<path d="M${x} ${y + 16} L${x + 17} ${y} L${x + 34} ${y + 16} V${y + 40} H${x} Z" stroke="${color}" stroke-width="3" fill="${PAPER}"/>` +
           `<rect x="${x + 12}" y="${y + 22}" width="10" height="18" stroke="${color}" stroke-width="2.2" fill="${PAPER}"/>`;
  }

  function heart(cx, cy, s, color, fill) {
    s = s || 1;
    const d = `M ${cx} ${cy + 18 * s} C ${cx - 30 * s} ${cy - 6 * s} ${cx - 14 * s} ${cy - 24 * s} ${cx} ${cy - 8 * s} ` +
               `C ${cx + 14 * s} ${cy - 24 * s} ${cx + 30 * s} ${cy - 6 * s} ${cx} ${cy + 18 * s} Z`;
    return `<path d="${d}" stroke="${color}" stroke-width="3.5" fill="${fill || 'none'}"/>`;
  }

  /** Ngoi sao 5 canh */
  function star(cx, cy, r, color, fill) {
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const outer = -Math.PI / 2 + i * (2 * Math.PI / 5);
      const inner = outer + Math.PI / 5;
      pts.push([cx + r * Math.cos(outer), cy + r * Math.sin(outer)]);
      pts.push([cx + r * 0.42 * Math.cos(inner), cy + r * 0.42 * Math.sin(inner)]);
    }
    const d = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L') + ' Z';
    return `<path d="${d}" stroke="${color}" stroke-width="2" fill="${fill || 'none'}"/>`;
  }

  /** Lap lanh 4 canh (sparkle) */
  function sparkle(cx, cy, r, color) {
    return `<path d="M${cx} ${cy - r} L${cx + r * 0.3} ${cy - r * 0.3} L${cx + r} ${cy} ` +
           `L${cx + r * 0.3} ${cy + r * 0.3} L${cx} ${cy + r} L${cx - r * 0.3} ${cy + r * 0.3} ` +
           `L${cx - r} ${cy} L${cx - r * 0.3} ${cy - r * 0.3} Z" fill="${color}" stroke="none"/>`;
  }

  const EXTRA = {
    // ---------- bài 6: nơi chốn quen thuộc ----------
    'はな': art(
      `<circle cx="50" cy="25" r="9" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<circle cx="36" cy="33" r="9" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<circle cx="42" cy="50" r="9" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<circle cx="58" cy="50" r="9" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<circle cx="64" cy="33" r="9" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<circle cx="50" cy="40" r="8" stroke="${GOLD}" stroke-width="3" fill="${GOLD}"/>` +
      `<path d="M50 48 v26" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M50 64 q12 -4 16 6" stroke="${SAGE}" stroke-width="2.5"/>` +
      label('HOA', ACCENT, 13, 92, 700)),

    'こうえん': art(
      `<circle cx="32" cy="34" r="16" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M32 48 v20" stroke="${INK}" stroke-width="3.5"/>` +
      `<path d="M14 80 h72" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M56 70 h20 M60 70 v10 M72 70 v10" stroke="${ACCENT}" stroke-width="3"/>` +
      `<circle cx="78" cy="24" r="7" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M78 13 v4 M89 24 h-4 M86 16 l-3 3" stroke="${GOLD}" stroke-width="2"/>` +
      label('CÔNG VIÊN', INK, 10, 94, 600)),

    'きっさてん': art(
      `<path d="M12 42 h76" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M12 42 l6 -14 h64 l6 14" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M20 42 v-10 M32 42 v-11 M44 42 v-12 M56 42 v-12 M68 42 v-11 M80 42 v-10" stroke="${ACCENT}" stroke-width="2" opacity=".6"/>` +
      `<rect x="18" y="42" width="64" height="34" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="42" y="54" width="16" height="22" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M26 64 h14 v-6 a7 7 0 0 0 -14 0 z" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      steam(33, 50, GOLD) +
      label('QUÁN CÀ PHÊ', ACCENT, 9, 94, 700)),

    'だいどころ': art(
      `<rect x="18" y="58" width="64" height="20" rx="2" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="36" cy="58" r="8" stroke="${INK}" stroke-width="2.5"/>` +
      `<circle cx="64" cy="58" r="8" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M28 44 h24 v14 a12 7 0 0 1 -24 0 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M26 46 h-6 M56 46 h6" stroke="${ACCENT}" stroke-width="2.5"/>` +
      steam(40, 38, INK) +
      `<path d="M64 66 q-3 -6 0 -10 q3 4 0 10" fill="${GOLD}" stroke="none"/>` +
      label('NHÀ BẾP', INK, 12, 94, 700)),

    // ---------- bài 7: cho–nhận, đồ dùng học tập, phó từ ----------
    'あげます': art(
      person(24, 54, ACCENT, .8) +
      person(78, 54, INK, .75) +
      `<rect x="42" y="44" width="16" height="14" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M50 44 v14 M42 51 h16" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M46 44 q4 -6 4 0 q0 -6 4 0" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M60 50 h9" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M66 46 l6 4 -6 4" stroke="${ACCENT}" stroke-width="2.5"/>` +
      label('TẶNG', ACCENT, 13, 92, 700)),

    'もらいます': art(
      person(24, 54, INK, .75) +
      person(78, 56, ACCENT, .85) +
      `<rect x="42" y="44" width="16" height="14" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M50 44 v14 M42 51 h16" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M60 50 h9" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M66 46 l6 4 -6 4" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M66 50 q6 -3 9 3" stroke="${ACCENT}" stroke-width="2.5"/>` +
      label('NHẬN', ACCENT, 13, 92, 700)),

    'かします': art(
      person(24, 54, ACCENT, .8) +
      person(78, 54, INK, .75) +
      `<rect x="41" y="47" width="18" height="13" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M50 47 v13" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M60 50 h9" stroke="${ACCENT}" stroke-width="2.5"/><path d="M66 46 l6 4 -6 4" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M46 28 a8 8 0 1 1 -6 6" stroke="${SAGE}" stroke-width="2.2"/><path d="M40 34 l-3 5 6 1 z" fill="${SAGE}" stroke="none"/>` +
      label('CHO MƯỢN', ACCENT, 10, 92, 700)),

    'かります': art(
      person(24, 54, INK, .75) +
      person(78, 54, ACCENT, .85) +
      `<rect x="41" y="47" width="18" height="13" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M50 47 v13" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M60 50 h9" stroke="${ACCENT}" stroke-width="2.5"/><path d="M66 46 l6 4 -6 4" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M54 28 a8 8 0 1 1 -6 6" stroke="${SAGE}" stroke-width="2.2"/><path d="M48 34 l-3 5 6 1 z" fill="${SAGE}" stroke="none"/>` +
      label('MƯỢN', ACCENT, 13, 92, 700)),

    'おしえます': art(
      `<rect x="8" y="10" width="46" height="32" rx="2" stroke="${INK}" stroke-width="3" fill="${SAGE}"/>` +
      `<path d="M16 22 h30 M16 30 h22 M16 38 h16" stroke="${PAPER}" stroke-width="2.2"/>` +
      person(64, 58, ACCENT, .75) +
      `<path d="M53 56 L57 40" stroke="${ACCENT}" stroke-width="2.5"/>` +
      person(86, 64, INK, .5) +
      label('DẠY', ACCENT, 14, 92, 700)),

    'ならいます': art(
      person(26, 62, INK, .55) +
      `<path d="M38 55 h12" stroke="${GOLD}" stroke-width="2.2" stroke-dasharray="3 3"/>` +
      person(64, 56, ACCENT, .8) +
      `<path d="M52 68 h22 v9 h-22 z M63 68 v9" stroke="${GOLD}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<circle cx="64" cy="26" r="8" stroke="${GOLD}" stroke-width="2.5"/><path d="M60 34 h8 M61 37 h6" stroke="${GOLD}" stroke-width="2"/>` +
      label('HỌC HỎI', SAGE, 11, 94, 700)),

    'はなします': art(
      person(26, 56, INK, .8) +
      person(74, 56, ACCENT, .8) +
      `<path d="M34 34 h30 a4 4 0 0 1 4 4 v10 a4 4 0 0 1 -4 4 h-8 l-6 6 v-6 h-16 a4 4 0 0 1 -4 -4 v-10 a4 4 0 0 1 4 -4 z" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M40 42 h18 M40 47 h12" stroke="${ACCENT}" stroke-width="2"/>` +
      label('NÓI CHUYỆN', INK, 9.5, 94, 600)),

    'みせます': art(
      person(28, 58, ACCENT, .8) +
      `<rect x="44" y="30" width="24" height="17" rx="2" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M48 43 l5 -7 4 5 4 -6 4 8" stroke="${GOLD}" stroke-width="1.8"/>` +
      `<path d="M72 30 l7 -4 M72 38 l9 0 M72 45 l7 4" stroke="${ACCENT}" stroke-width="2"/>` +
      `<path d="M80 46 q8 -8 16 0 q-8 8 -16 0 z" stroke="${SAGE}" stroke-width="2"/><circle cx="88" cy="46" r="2.4" fill="${SAGE}" stroke="none"/>` +
      label('CHO XEM', ACCENT, 12, 92, 700)),

    'ペン': art(
      `<path d="M30 78 L64 24 l10 6 -34 54 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M30 78 l-6 14 14 -8 z" fill="${INK}" stroke="none"/>` +
      `<path d="M56 40 l9 6" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M60 33 l9 6" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M18 86 q6 -4 12 -2" stroke="${SAGE}" stroke-width="2"/>` +
      label('CÂY BÚT', INK, 12, 94, 700)),

    'かんじ': art(
      `<rect x="24" y="18" width="52" height="52" rx="2" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M50 26 v36 M34 38 h32 M40 62 l-10 12 M60 62 l10 12" stroke="${ACCENT}" stroke-width="4"/>` +
      `<path d="M78 66 l14 14" stroke="${GOLD}" stroke-width="4"/>` +
      `<path d="M74 62 a6 6 0 1 0 8 8" stroke="${GOLD}" stroke-width="3"/>` +
      label('CHỮ HÁN', ACCENT, 12, 94, 700)),

    'もう': art(
      `<path d="M38 20 h24 v8 l-10 14 10 14 v8 h-24 v-8 l10 -14 -10 -14 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M42 58 h16 l-8 8 z" fill="${GOLD}" stroke="none"/>` +
      `<path d="M40 62 h20" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M70 44 l6 6 12 -14" stroke="${SAGE}" stroke-width="4"/>` +
      label('ĐÃ XONG', SAGE, 11, 94, 700)),

    'まだ': art(
      `<path d="M38 20 h24 v8 l-10 14 10 14 v8 h-24 v-8 l10 -14 -10 -14 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 22 h20 l-2 6 h-16 z" fill="${GOLD}" stroke="none"/>` +
      `<path d="M50 34 v10" stroke="${GOLD}" stroke-width="2" stroke-dasharray="2 2"/>` +
      `<circle cx="78" cy="46" r="10" stroke="${ACCENT}" stroke-width="2.5"/><path d="M78 40 v6 l4 4" stroke="${ACCENT}" stroke-width="2.2"/>` +
      label('VẪN CHƯA', ACCENT, 11, 94, 700)),

    'ちず': art(
      `<path d="M16 26 l22 -8 24 8 22 -8 v54 l-22 8 -24 -8 -22 8 z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M38 18 v54 M62 26 v54" stroke="${INK}" stroke-width="1.8" stroke-dasharray="3 3" opacity=".6"/>` +
      `<path d="M24 60 q16 -20 30 -6 q10 10 22 -8" stroke="${ACCENT}" stroke-width="2.5" stroke-dasharray="4 3"/>` +
      `<path d="M70 24 a9 9 0 0 1 9 9 c0 7 -9 16 -9 16 c0 0 -9 -9 -9 -16 a9 9 0 0 1 9 -9 z" fill="${ACCENT}" stroke="none"/>` +
      `<circle cx="70" cy="33" r="3.5" fill="${PAPER}" stroke="none"/>` +
      label('BẢN ĐỒ', INK, 12, 94, 700)),

    'しゅくだい': art(
      `<rect x="26" y="16" width="42" height="56" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M30 16 v-4 M38 16 v-4 M46 16 v-4 M54 16 v-4 M62 16 v-4" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M34 30 h26 M34 40 h26 M34 50 h18" stroke="${SAGE}" stroke-width="2.2"/>` +
      `<path d="M62 60 L84 38 l6 6 -22 22 z" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M62 60 l-4 10 10 -4 z" fill="${GOLD}" stroke="none"/>` +
      `<path d="M78 14 l8 -6 8 6 v10 h-16 z" stroke="${ACCENT}" stroke-width="2.2" fill="${PAPER}"/>` +
      label('BÀI TẬP', ACCENT, 12, 94, 700)),

    // ---------- bài 8: tính từ đối lập, mức độ ----------
    'おおきい': art(
      `<circle cx="60" cy="50" r="26" stroke="${ACCENT}" stroke-width="3.5"/>` +
      `<circle cx="18" cy="66" r="8" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M60 18 v-8 M36 30 l-6 -6 M84 30 l6 -6" stroke="${ACCENT}" stroke-width="2.2"/>` +
      label('TO, LỚN', ACCENT, 13, 92, 700)),

    'ちいさい': art(
      `<circle cx="55" cy="50" r="26" stroke="${INK}" stroke-width="2" opacity=".4"/>` +
      `<circle cx="55" cy="50" r="8" stroke="${ACCENT}" stroke-width="3.5"/>` +
      `<path d="M55 30 l0 6 M38 42 l6 4 M72 42 l-6 4" stroke="${ACCENT}" stroke-width="2.2"/>` +
      label('NHỎ, BÉ', ACCENT, 13, 92, 700)),

    'あたらしい': art(
      `<rect x="30" y="42" width="40" height="30" rx="3" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 42 v30 M30 55 h40" stroke="${GOLD}" stroke-width="2.2"/>` +
      sparkle(20, 26, 8, GOLD) + sparkle(80, 30, 7, GOLD) + sparkle(76, 62, 5, GOLD) +
      label('MỚI', GOLD, 14, 92, 800)),

    'ふるい': art(
      `<path d="M28 24 q22 -10 44 0 v46 q-22 10 -44 0 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 34 l6 8 -4 6 8 8" stroke="${ACCENT}" stroke-width="2" opacity=".7"/>` +
      `<path d="M30 28 l4 -4 M70 28 l-4 -4 M30 66 l4 4 M70 66 l-4 4" stroke="${INK}" stroke-width="2" opacity=".5"/>` +
      dot(20, 58, 1.6, INK) + dot(82, 48, 1.8, INK) +
      label('CŨ, CỔ', INK, 13, 94, 700)),

    'いい／よい': art(
      `<rect x="26" y="54" width="22" height="22" rx="4" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M48 60 L48 34 a5 5 0 0 1 10 0 L58 50 L70 50 a6 6 0 0 1 6 7 L72 70 a6 6 0 0 1 -6 6 L48 76 Z" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      label('TỐT', SAGE, 15, 92, 800)),

    'わるい': art(
      `<rect x="26" y="24" width="22" height="22" rx="4" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M48 40 L48 66 a5 5 0 0 0 10 0 L58 50 L70 50 a6 6 0 0 0 6 -7 L72 30 a6 6 0 0 0 -6 -6 L48 24 Z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      label('XẤU, TỆ', ACCENT, 13, 94, 700)),

    'あつい': art(
      `<circle cx="50" cy="38" r="16" stroke="${GOLD}" stroke-width="3.5" fill="${PAPER}"/>` +
      `<path d="M50 16 v-8 M50 60 v8 M28 38 h-8 M72 38 h8 M34 22 l-6 -6 M66 22 l6 -6 M34 54 l-6 6 M66 54 l6 6" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M20 74 q5 -6 10 0 q5 -6 10 0 q5 -6 10 0" stroke="${ACCENT}" stroke-width="2.2"/>` +
      `<path d="M76 58 c4 6 6 10 6 13 a6 6 0 0 1 -12 0 c0 -3 2 -7 6 -13 z" fill="${ACCENT}" stroke="none"/>` +
      label('NÓNG', ACCENT, 14, 94, 700)),

    'さむい': art(
      `<path d="M50 22 v40 M32 32 l36 20 M32 52 l36 -20" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M50 26 l-5 -4 M50 26 l5 -4 M50 58 l-5 4 M50 58 l5 4" stroke="${SAGE}" stroke-width="2"/>` +
      dot(22, 24, 2, SAGE) + dot(78, 30, 2, SAGE) + dot(70, 66, 2, SAGE) +
      label('LẠNH', SAGE, 14, 94, 700)),

    'むずかしい': art(
      `<path d="M26 50 q10 -20 24 -10 q14 10 -4 20 q-18 10 -4 -14 q10 -18 22 4" stroke="${ACCENT}" stroke-width="3.5"/>` +
      `<text x="50" y="26" font-size="26" fill="${INK}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      label('KHÓ', ACCENT, 14, 92, 700)),

    'やさしい': art(
      `<path d="M20 50 q15 -16 30 0 q15 16 30 0" stroke="${SAGE}" stroke-width="4"/>` +
      `<path d="M40 66 l8 8 16 -18" stroke="${SAGE}" stroke-width="4"/>` +
      label('DỄ', SAGE, 15, 92, 800)),

    'たかい': art(
      `<rect x="20" y="60" width="14" height="16" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<rect x="42" y="44" width="14" height="32" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<rect x="64" y="20" width="14" height="56" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M71 14 v-8 M66 10 l5 -6 5 6" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M14 76 h72" stroke="${INK}" stroke-width="2.5"/>` +
      label('CAO, ĐẮT', ACCENT, 11, 94, 700)),

    'やすい': art(
      `<path d="M24 30 h28 l24 24 -28 28 -24 -24 z" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="34" cy="40" r="4" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<text x="55" y="60" font-size="16" fill="${SAGE}" font-weight="800" text-anchor="middle" stroke="none">¥</text>` +
      `<path d="M78 20 v14 M73 28 l5 6 5 -6" stroke="${SAGE}" stroke-width="2.5"/>` +
      label('RẺ', SAGE, 15, 92, 800)),

    'おもしろい': art(
      `<circle cx="50" cy="46" r="22" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="42" cy="42" r="3" fill="${INK}" stroke="none"/><circle cx="58" cy="42" r="3" fill="${INK}" stroke="none"/>` +
      `<path d="M40 54 a10 8 0 0 0 20 0" stroke="${INK}" stroke-width="2.5"/>` +
      sparkle(16, 22, 7, GOLD) + sparkle(82, 28, 6, GOLD) +
      label('THÚ VỊ', GOLD, 13, 92, 700)),

    'たのしい': art(
      person(50, 54, ACCENT, 1) +
      `<path d="M38 44 l-10 -14 M62 44 l10 -14" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M45 40 q5 5 10 0" stroke="${INK}" stroke-width="1.8"/>` +
      `<circle cx="18" cy="28" r="2.4" fill="${GOLD}" stroke="none"/><path d="M18 28 v-14" stroke="${GOLD}" stroke-width="2"/>` +
      `<circle cx="82" cy="32" r="2.4" fill="${GOLD}" stroke="none"/><path d="M82 32 v-14" stroke="${GOLD}" stroke-width="2"/>` +
      label('VUI VẺ', ACCENT, 13, 94, 700)),

    'いそがしい': art(
      person(46, 58, INK, .85) +
      `<circle cx="76" cy="34" r="12" stroke="${ACCENT}" stroke-width="2.5"/><path d="M76 27 v7 l5 4" stroke="${ACCENT}" stroke-width="2.2"/>` +
      `<path d="M16 24 l14 -4 4 14 -14 4 z" stroke="${GOLD}" stroke-width="2" fill="${PAPER}"/>` +
      `<path d="M58 40 c3 4 4 7 4 9 a4 4 0 0 1 -8 0 c0 -2 1 -5 4 -9 z" fill="${ACCENT}" stroke="none"/>` +
      label('BẬN RỘN', ACCENT, 11, 94, 700)),

    'おいしい': art(
      `<path d="M26 58 a24 14 0 0 0 48 0 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M24 58 h52" stroke="${ACCENT}" stroke-width="3"/>` +
      `<circle cx="40" cy="54" r="4" fill="${GOLD}" stroke="none"/><circle cx="52" cy="52" r="4" fill="${SAGE}" stroke="none"/><circle cx="60" cy="55" r="3.5" fill="${ACCENT}" stroke="none"/>` +
      steam(50, 38, INK) +
      heart(50, 20, .45, ACCENT, ACCENT) +
      label('NGON', ACCENT, 15, 92, 800)),

    'きれい': art(
      `<circle cx="46" cy="38" r="20" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M60 54 l14 20" stroke="${GOLD}" stroke-width="4"/>` +
      `<path d="M38 30 l6 6 M54 30 l-6 6" stroke="${GOLD}" stroke-width="2"/>` +
      sparkle(16, 20, 6, GOLD) + sparkle(28, 66, 5, GOLD) +
      label('ĐẸP, SẠCH', GOLD, 11, 94, 700)),

    'げんき': art(
      person(46, 54, ACCENT, 1) +
      `<path d="M60 46 q10 -2 8 -12" stroke="${ACCENT}" stroke-width="4"/>` +
      `<circle cx="68" cy="38" r="5" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M20 30 l-6 -4 M20 50 l-8 0 M76 60 l6 4" stroke="${GOLD}" stroke-width="2.2"/>` +
      `<path d="M41 39 a5 4 0 0 0 10 0" stroke="${ACCENT}" stroke-width="2"/>` +
      label('KHỎE MẠNH', SAGE, 10, 94, 700)),

    'しずか': art(
      `<circle cx="42" cy="46" r="18" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M35 42 h4 M45 42 h4" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M42 54 v14" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M70 40 q6 6 0 12 M76 34 q10 12 0 24" stroke="${SAGE}" stroke-width="2.2"/>` +
      `<path d="M64 34 l24 24 M88 34 l-24 24" stroke="${ACCENT}" stroke-width="3"/>` +
      label('YÊN TĨNH', INK, 11, 94, 700)),

    'ゆうめい': art(
      person(50, 60, INK, .9) +
      star(50, 24, 13, GOLD, GOLD) +
      `<path d="M30 60 l-14 20 M70 60 l14 20 M50 66 v20" stroke="${GOLD}" stroke-width="2" opacity=".5"/>` +
      label('NỔI TIẾNG', GOLD, 10, 94, 700)),

    'べんり': art(
      `<circle cx="50" cy="46" r="18" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M50 26 v-6 M50 66 v6 M30 46 h-6 M70 46 h6 M36 32 l-4 -4 M64 32 l4 -4 M36 60 l-4 4 M64 60 l4 4" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M42 46 l6 7 12 -14" stroke="${ACCENT}" stroke-width="3.5"/>` +
      label('TIỆN LỢI', SAGE, 11, 94, 700)),

    'とても': art(
      `<path d="M20 66 a30 30 0 0 1 60 0" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M24 50 l4 3 M76 50 l-4 3 M50 34 v5" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M50 66 L76 44" stroke="${ACCENT}" stroke-width="3.5"/>` +
      `<circle cx="50" cy="66" r="4" fill="${ACCENT}" stroke="none"/>` +
      `<text x="50" y="26" font-size="18" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">!!</text>` +
      label('RẤT', ACCENT, 15, 92, 800)),

    'あまり': art(
      `<path d="M20 66 a30 30 0 0 1 60 0" stroke="${INK}" stroke-width="3" opacity=".5"/>` +
      `<path d="M24 50 l4 3 M76 50 l-4 3 M50 34 v5" stroke="${INK}" stroke-width="2" opacity=".5"/>` +
      `<path d="M50 66 L28 50" stroke="${SAGE}" stroke-width="3.5"/>` +
      `<circle cx="50" cy="66" r="4" fill="${SAGE}" stroke="none"/>` +
      `<path d="M68 24 l10 10 M78 24 l-10 10" stroke="${INK}" stroke-width="2.5" opacity=".6"/>` +
      label('KHÔNG MẤY', SAGE, 9.5, 94, 700)),

    // ---------- bài 9: sở thích, kỹ năng, lý do ----------
    'すき': art(
      heart(50, 46, 1, ACCENT, PAPER) +
      `<path d="M78 28 h9 M82.5 23.5 v9" stroke="${ACCENT}" stroke-width="2.2"/>` +
      label('THÍCH', ACCENT, 15, 88, 800)),

    'だいすき': art(
      heart(50, 48, 1.15, ACCENT, ACCENT) +
      heart(20, 68, .38, ACCENT, ACCENT) +
      heart(80, 68, .38, ACCENT, ACCENT) +
      label('RẤT THÍCH', ACCENT, 12, 92, 800)),

    'きらい': art(
      heart(50, 46, 1, INK, PAPER) +
      `<path d="M32 30 l36 32 M68 30 l-36 32" stroke="${ACCENT}" stroke-width="4"/>` +
      label('GHÉT', ACCENT, 14, 88, 800)),

    'じょうず': art(
      `<path d="M40 50 l-8 30 10 -6 6 8 4 -30 z" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M60 50 l8 30 -10 -6 -6 8 -4 -30 z" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<circle cx="50" cy="40" r="18" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      star(50, 40, 10, GOLD, GOLD) +
      label('GIỎI, KHÉO', GOLD, 10, 94, 700)),

    'へた': art(
      `<circle cx="50" cy="44" r="20" stroke="${ACCENT}" stroke-width="2.5"/><circle cx="50" cy="44" r="12" stroke="${ACCENT}" stroke-width="2.2"/><circle cx="50" cy="44" r="4" stroke="${ACCENT}" stroke-width="2"/>` +
      `<path d="M20 20 l10 10" stroke="${INK}" stroke-width="2.5"/><path d="M18 22 l6 -2 -2 6 z" fill="${INK}" stroke="none"/>` +
      `<path d="M82 68 l-10 -6" stroke="${INK}" stroke-width="2.5"/><path d="M84 70 l-6 0 2 -6 z" fill="${INK}" stroke="none"/>` +
      label('KÉM, VỤNG', INK, 10, 94, 700)),

    'スポーツ': art(
      `<circle cx="50" cy="46" r="24" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 30 l8 6 -3 10 -10 0 -3 -10 z" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M50 30 v-8 M58 36 l8 -4 M55 46 l10 4 M45 46 l-10 4 M42 36 l-8 -4" stroke="${INK}" stroke-width="1.8"/>` +
      `<path d="M18 30 h10 M14 46 h8 M18 62 h10" stroke="${SAGE}" stroke-width="2.2"/>` +
      label('THỂ THAO', SAGE, 11, 94, 700)),

    'うた': art(
      `<circle cx="32" cy="68" r="7" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M39 68 v-38" stroke="${ACCENT}" stroke-width="3"/>` +
      `<circle cx="66" cy="58" r="7" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M73 58 v-32" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M39 30 l34 -4" stroke="${ACCENT}" stroke-width="3"/>` +
      label('BÀI HÁT', ACCENT, 13, 92, 700)),

    'え': art(
      `<path d="M30 82 l14 -20 M70 82 l-14 -20 M36 70 l28 0" stroke="${INK}" stroke-width="2.5"/>` +
      `<rect x="26" y="18" width="48" height="38" rx="2" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M32 48 l10 -14 8 10 8 -16 10 20" stroke="${SAGE}" stroke-width="2.2"/><circle cx="60" cy="28" r="4" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M78 60 l10 10" stroke="${ACCENT}" stroke-width="3.5"/><path d="M74 56 l4 4 -4 4 -4 -4 z" fill="${ACCENT}" stroke="none"/>` +
      label('TRANH VẼ', ACCENT, 13, 92, 700)),

    'りょうり': art(
      `<circle cx="42" cy="54" r="18" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M60 54 h20" stroke="${INK}" stroke-width="4"/>` +
      `<circle cx="42" cy="54" r="10" stroke="${GOLD}" stroke-width="1.5" fill="${PAPER}"/><circle cx="42" cy="54" r="4" fill="${GOLD}" stroke="none"/>` +
      steam(42, 32, INK) +
      label('NẤU ĂN', GOLD, 12, 94, 700)),

    'ギター': art(
      `<circle cx="46" cy="56" r="12" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="46" cy="74" r="16" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M46 44 v-30" stroke="${INK}" stroke-width="4"/>` +
      `<path d="M40 14 h12" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="46" cy="70" r="5" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M46 44 v40" stroke="${INK}" stroke-width="1.2"/>` +
      label('ĐÀN GUITAR', ACCENT, 10, 94, 700)),

    'おさけ': art(
      `<path d="M42 30 q0 -8 8 -8 q8 0 8 8 v8 q10 4 10 18 v20 h-36 v-20 q0 -14 10 -18 z" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M70 66 l4 12 h-16 l4 -12 z" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M50 18 q-3 -4 0 -8" stroke="${ACCENT}" stroke-width="2" opacity=".6"/>` +
      label('RƯỢU SAKE', GOLD, 10, 94, 700)),

    'おちゃ': art(
      `<path d="M30 52 h34 v10 a17 12 0 0 1 -34 0 z" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="31" y="53" width="32" height="4" fill="${SAGE}" opacity=".5" stroke="none"/>` +
      steam(47, 40, SAGE) +
      `<path d="M22 66 h44" stroke="${SAGE}" stroke-width="2.5"/>` +
      label('TRÀ XANH', SAGE, 11, 94, 700)),

    'から': art(
      `<circle cx="26" cy="50" r="16" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M26 42 l4 8 -8 0 z" fill="${GOLD}" stroke="none"/>` +
      `<path d="M44 50 h18" stroke="${ACCENT}" stroke-width="3"/><path d="M60 44 l8 6 -8 6" stroke="${ACCENT}" stroke-width="3"/>` +
      `<circle cx="78" cy="50" r="16" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M71 50 l5 5 9 -10" stroke="${SAGE}" stroke-width="3"/>` +
      label('VÌ...NÊN', ACCENT, 11, 92, 700)),

    'どうして': art(
      `<circle cx="38" cy="50" r="18" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M30 44 l6 -3 M46 44 l-6 -3" stroke="${INK}" stroke-width="2.2"/>` +
      dot(32, 48, 2, INK) + dot(44, 48, 2, INK) +
      `<path d="M32 58 q6 4 12 0" stroke="${INK}" stroke-width="2"/>` +
      `<text x="76" y="58" font-size="34" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      label('TẠI SAO', ACCENT, 13, 92, 700)),

    'べんきょう': art(
      `<path d="M16 60 q17 -8 34 0 v6 q-17 -8 -34 0 z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M50 60 q17 -8 34 0 v6 q-17 -8 -34 0 z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M22 58 q10 -3 20 0 M56 58 q10 -3 20 0" stroke="${SAGE}" stroke-width="1.8"/>` +
      `<path d="M50 14 l-10 16 h20 z" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/><path d="M50 30 v6" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M38 20 l-4 -3 M62 20 l4 -3" stroke="${GOLD}" stroke-width="2"/>` +
      label('VIỆC HỌC', INK, 11, 94, 700)),

    'しごと': art(
      `<rect x="24" y="40" width="52" height="34" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 40 v-8 a10 8 0 0 1 20 0 v8" stroke="${INK}" stroke-width="3"/>` +
      `<rect x="44" y="52" width="12" height="8" stroke="${GOLD}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<path d="M24 56 h52" stroke="${INK}" stroke-width="2"/>` +
      label('CÔNG VIỆC', ACCENT, 10, 94, 700)),

    // ---------- bài 10: tồn tại, vị trí, con vật ----------
    'あります': art(
      `<path d="M50 14 a10 10 0 0 1 10 10 c0 8 -10 18 -10 18 c0 0 -10 -10 -10 -18 a10 10 0 0 1 10 -10 z" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<circle cx="50" cy="24" r="3.5" fill="${ACCENT}" stroke="none"/>` +
      `<rect x="28" y="56" width="20" height="18" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<rect x="54" y="58" width="18" height="16" stroke="${GOLD}" stroke-width="2.2" fill="${PAPER}"/><path d="M63 58 v16" stroke="${GOLD}" stroke-width="1.8"/>` +
      `<path d="M20 78 h60" stroke="${INK}" stroke-width="2"/>` +
      label('CÓ (đồ vật)', INK, 9.5, 94, 700)),

    'います': art(
      `<path d="M50 14 a10 10 0 0 1 10 10 c0 8 -10 18 -10 18 c0 0 -10 -10 -10 -18 a10 10 0 0 1 10 -10 z" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<circle cx="50" cy="24" r="3.5" fill="${SAGE}" stroke="none"/>` +
      person(34, 62, INK, .6) +
      `<circle cx="68" cy="62" r="8" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/><path d="M62 56 l-2 -6 5 3 M74 56 l2 -6 -5 3" stroke="${SAGE}" stroke-width="2"/>` +
      `<path d="M20 78 h60" stroke="${INK}" stroke-width="2"/>` +
      label('CÓ (sinh vật)', SAGE, 9, 94, 700)),

    'うえ': art(
      refBox(30, 50, 40, 24, INK, PAPER) +
      dot(50, 28, 9, ACCENT) +
      `<path d="M50 40 v6" stroke="${ACCENT}" stroke-width="2.5"/><path d="M46 35 l4 -6 4 6" stroke="${ACCENT}" stroke-width="2.2"/>` +
      label('TRÊN', ACCENT, 15, 92, 800)),

    'した': art(
      refBox(30, 26, 40, 24, INK, PAPER) +
      dot(50, 72, 9, ACCENT) +
      `<path d="M50 50 v10" stroke="${ACCENT}" stroke-width="2.5"/><path d="M46 57 l4 6 4 -6" stroke="${ACCENT}" stroke-width="2.2"/>` +
      label('DƯỚI', ACCENT, 15, 92, 800)),

    'まえ': art(
      house(30, 26, INK) +
      dot(47, 80, 8, ACCENT) +
      `<path d="M47 68 v6" stroke="${ACCENT}" stroke-width="2.2"/>` +
      label('TRƯỚC', ACCENT, 14, 94, 800)),

    'うしろ': art(
      `<circle cx="66" cy="40" r="10" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      house(24, 24, INK) +
      label('SAU', ACCENT, 15, 92, 800)),

    'なか': art(
      refBox(26, 40, 48, 30, INK, PAPER) +
      `<path d="M26 40 l6 -8 h36 l6 8" stroke="${INK}" stroke-width="2.5"/>` +
      dot(50, 58, 8, ACCENT) +
      label('TRONG', ACCENT, 14, 92, 800)),

    'そと': art(
      refBox(30, 40, 34, 26, INK, PAPER) +
      dot(82, 50, 9, ACCENT) +
      `<path d="M66 50 h8" stroke="${ACCENT}" stroke-width="2.5"/><path d="M72 46 l6 4 -6 4" stroke="${ACCENT}" stroke-width="2.2"/>` +
      label('NGOÀI', ACCENT, 14, 92, 800)),

    'となり': art(
      refBox(18, 40, 28, 28, INK, PAPER) +
      refBox(54, 40, 28, 28, ACCENT, PAPER) +
      `<path d="M46 54 h8" stroke="${GOLD}" stroke-width="2.2"/>` +
      label('BÊN CẠNH', ACCENT, 10, 94, 700)),

    'ちかく': art(
      `<circle cx="40" cy="55" r="28" stroke="${SAGE}" stroke-width="2" stroke-dasharray="4 4"/>` +
      refBox(24, 44, 28, 24, INK, PAPER) +
      dot(62, 66, 7, ACCENT) +
      label('GẦN ĐÂY', SAGE, 11, 94, 700)),

    'あいだ': art(
      refBox(10, 40, 20, 26, INK, PAPER) +
      refBox(70, 40, 20, 26, INK, PAPER) +
      dot(50, 53, 9, GOLD) +
      `<path d="M32 53 h9 M68 53 h-9" stroke="${GOLD}" stroke-width="2.2"/>` +
      `<path d="M38 49 l-6 4 6 4 M62 49 l6 4 -6 4" stroke="${GOLD}" stroke-width="2"/>` +
      label('GIỮA', GOLD, 15, 92, 800)),

    'はこ': art(
      `<rect x="26" y="44" width="48" height="30" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M26 44 l-8 -14 h20 l8 14 M74 44 l8 -14 h-20 l-8 14" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M50 44 v30 M26 58 h48" stroke="${ACCENT}" stroke-width="2.5"/>` +
      label('CÁI HỘP', GOLD, 13, 92, 700)),

    'かびん': art(
      `<path d="M42 50 q-6 10 0 20 h16 q6 -10 0 -20 z" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M42 50 q0 -6 8 -6 q8 0 8 6" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<path d="M50 44 v-16" stroke="${SAGE}" stroke-width="2"/><circle cx="50" cy="24" r="6" stroke="${ACCENT}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<path d="M44 44 v-10" stroke="${SAGE}" stroke-width="2"/><circle cx="42" cy="30" r="5" stroke="${GOLD}" stroke-width="2" fill="${PAPER}"/>` +
      `<path d="M56 44 v-10" stroke="${SAGE}" stroke-width="2"/><circle cx="60" cy="30" r="5" stroke="${ACCENT}" stroke-width="2" fill="${PAPER}"/>` +
      label('BÌNH HOA', SAGE, 11, 94, 700)),

    'き': art(
      `<circle cx="50" cy="34" r="20" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 52 v26" stroke="${INK}" stroke-width="4"/>` +
      `<path d="M30 78 h40" stroke="${INK}" stroke-width="2.5"/>` +
      label('CÂY', SAGE, 15, 92, 800)),

    'いぬ': art(
      `<circle cx="50" cy="48" r="20" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M32 38 q-10 8 -4 22" stroke="${GOLD}" stroke-width="3"/><path d="M68 38 q10 8 4 22" stroke="${GOLD}" stroke-width="3"/>` +
      dot(43, 45, 2.2, INK) + dot(57, 45, 2.2, INK) +
      `<circle cx="50" cy="56" r="6" stroke="${GOLD}" stroke-width="2.2" fill="${PAPER}"/><circle cx="50" cy="53" r="2" fill="${INK}" stroke="none"/>` +
      `<path d="M50 59 v3 M46 63 q4 3 8 0" stroke="${INK}" stroke-width="1.8"/>` +
      `<path d="M76 68 q8 -6 4 -14" stroke="${GOLD}" stroke-width="2.5"/>` +
      label('CON CHÓ', GOLD, 13, 92, 700)),

    'ねこ': art(
      `<circle cx="50" cy="50" r="19" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M34 38 l-2 -14 12 8 z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/><path d="M66 38 l2 -14 -12 8 z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M40 47 q3 -3 6 0" stroke="${INK}" stroke-width="2"/><path d="M54 47 q3 -3 6 0" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M47 54 l3 3 3 -3 z" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M30 54 h-10 M30 58 h-10 M70 54 h10 M70 58 h10" stroke="${INK}" stroke-width="1.6"/>` +
      `<path d="M50 57 v3 M45 62 q5 3 10 0" stroke="${INK}" stroke-width="1.6"/>` +
      label('CON MÈO', INK, 13, 92, 700)),

    'とり': art(
      `<circle cx="48" cy="52" r="14" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="66" cy="42" r="8" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M74 42 l8 -2 -8 6 z" fill="${GOLD}" stroke="none"/>` +
      dot(68, 40, 1.5, INK) +
      `<path d="M40 50 q8 -6 14 2" stroke="${SAGE}" stroke-width="2.2"/>` +
      `<path d="M34 56 l-10 -4 M34 60 l-10 2" stroke="${SAGE}" stroke-width="2.2"/>` +
      `<path d="M20 70 h50" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M44 66 v4 M54 66 v4" stroke="${SAGE}" stroke-width="2"/>` +
      label('CON CHIM', SAGE, 12, 94, 700)),

    'なんですか': art(
      `<rect x="30" y="46" width="40" height="30" rx="3" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<text x="50" y="70" font-size="26" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      `<path d="M50 46 v-10 M40 40 h20" stroke="${GOLD}" stroke-width="2.2"/>` +
      `<path d="M20 30 l4 4 M80 30 l-4 4" stroke="${ACCENT}" stroke-width="2"/>` +
      label('LÀ GÌ VẬY?', GOLD, 11, 92, 700)),

    'だれですか': art(
      `<circle cx="50" cy="34" r="14" fill="${INK}" stroke="none"/>` +
      `<path d="M30 78 v-14 a20 20 0 0 1 40 0 v14 z" fill="${INK}" stroke="none"/>` +
      `<text x="50" y="40" font-size="18" fill="${PAPER}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      label('LÀ AI VẬY?', ACCENT, 12, 92, 700)),

    // ---------- bài 11: số đếm thuần Nhật & lượng từ ----------
    'ひとつ': art(
      `<text x="50" y="62" font-size="50" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none" opacity=".25">1</text>` +
      dot(50, 50, 14, ACCENT) +
      label('MỘT CÁI', ACCENT, 13, 92, 700)),

    'ふたつ': art(
      `<text x="50" y="62" font-size="50" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none" opacity=".25">2</text>` +
      dot(38, 50, 11, ACCENT) + dot(62, 50, 11, ACCENT) +
      label('HAI CÁI', ACCENT, 13, 92, 700)),

    'いつつ': art(
      `<text x="50" y="62" font-size="50" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none" opacity=".2">5</text>` +
      dot(32, 32, 8, ACCENT) + dot(68, 32, 8, ACCENT) + dot(50, 50, 8, ACCENT) + dot(32, 68, 8, ACCENT) + dot(68, 68, 8, ACCENT) +
      label('NĂM CÁI', ACCENT, 13, 92, 700)),

    'ここのつ': art(
      `<text x="50" y="62" font-size="46" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none" opacity=".18">9</text>` +
      dot(30, 30, 6, ACCENT) + dot(50, 30, 6, ACCENT) + dot(70, 30, 6, ACCENT) +
      dot(30, 50, 6, ACCENT) + dot(50, 50, 6, ACCENT) + dot(70, 50, 6, ACCENT) +
      dot(30, 70, 6, ACCENT) + dot(50, 70, 6, ACCENT) + dot(70, 70, 6, ACCENT) +
      label('CHÍN CÁI', ACCENT, 12, 94, 700)),

    'とお': art(
      `<text x="50" y="66" font-size="40" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none" opacity=".18">10</text>` +
      dot(18, 38, 7, ACCENT) + dot(34, 38, 7, ACCENT) + dot(50, 38, 7, ACCENT) + dot(66, 38, 7, ACCENT) + dot(82, 38, 7, ACCENT) +
      dot(18, 62, 7, ACCENT) + dot(34, 62, 7, ACCENT) + dot(50, 62, 7, ACCENT) + dot(66, 62, 7, ACCENT) + dot(82, 62, 7, ACCENT) +
      label('MƯỜI CÁI', ACCENT, 11, 92, 700)),

    'いくつ': art(
      dot(20, 26, 6, ACCENT) + dot(80, 26, 6, ACCENT) + dot(20, 74, 6, ACCENT) + dot(80, 74, 6, ACCENT) +
      `<text x="50" y="60" font-size="40" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      label('MẤY CÁI?', GOLD, 13, 92, 700)),

    '〜こ': art(
      `<circle cx="34" cy="52" r="10" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<circle cx="54" cy="46" r="10" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<circle cx="72" cy="54" r="9" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M34 42 v-4 M54 36 v-4 M72 45 v-4" stroke="${SAGE}" stroke-width="2"/>` +
      label('~ CÁI (tròn)', INK, 9.5, 94, 700)),

    '〜まい': art(
      `<rect x="26" y="30" width="34" height="44" rx="2" stroke="${GOLD}" stroke-width="2" fill="${PAPER}"/>` +
      `<rect x="33" y="26" width="34" height="44" rx="2" stroke="${GOLD}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<rect x="40" y="22" width="34" height="44" rx="2" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M46 34 h20 M46 42 h20 M46 50 h14" stroke="${ACCENT}" stroke-width="1.8"/>` +
      label('~ TỜ, ~ TẤM', ACCENT, 10, 92, 700)),

    '〜だい': art(
      `<path d="M16 64 v-6 l8 -12 h44 l10 12 v6" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M16 64 h68" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M30 46 l4 -8 h20 l4 8" stroke="${SAGE}" stroke-width="2.2"/>` +
      `<circle cx="32" cy="66" r="7" stroke="${INK}" stroke-width="3" fill="${PAPER}"/><circle cx="68" cy="66" r="7" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      label('~ CHIẾC (xe, máy)', ACCENT, 8.5, 94, 700)),
  };

  window.SenseiArt.extend(EXTRA);

  // Bí danh: nối dạng chữ Hán về cùng hình với dạng kana, cho mọi từ có kanji.
  window.SenseiArt.extend({
    '花': EXTRA['はな'],
    '公園': EXTRA['こうえん'],
    '喫茶店': EXTRA['きっさてん'],
    '台所': EXTRA['だいどころ'],
    '上げます': EXTRA['あげます'],
    '貸します': EXTRA['かします'],
    '借ります': EXTRA['かります'],
    '教えます': EXTRA['おしえます'],
    '習います': EXTRA['ならいます'],
    '話します': EXTRA['はなします'],
    '見せます': EXTRA['みせます'],
    '漢字': EXTRA['かんじ'],
    '地図': EXTRA['ちず'],
    '宿題': EXTRA['しゅくだい'],
    '大きい': EXTRA['おおきい'],
    '小さい': EXTRA['ちいさい'],
    '新しい': EXTRA['あたらしい'],
    '古い': EXTRA['ふるい'],
    '悪い': EXTRA['わるい'],
    '暑い': EXTRA['あつい'],
    '寒い': EXTRA['さむい'],
    '難しい': EXTRA['むずかしい'],
    '易しい': EXTRA['やさしい'],
    '高い': EXTRA['たかい'],
    '安い': EXTRA['やすい'],
    '面白い': EXTRA['おもしろい'],
    '楽しい': EXTRA['たのしい'],
    '忙しい': EXTRA['いそがしい'],
    '美味しい': EXTRA['おいしい'],
    '綺麗': EXTRA['きれい'],
    '元気': EXTRA['げんき'],
    '静か': EXTRA['しずか'],
    '有名': EXTRA['ゆうめい'],
    '便利': EXTRA['べんり'],
    '好き': EXTRA['すき'],
    '大好き': EXTRA['だいすき'],
    '嫌い': EXTRA['きらい'],
    '上手': EXTRA['じょうず'],
    '下手': EXTRA['へた'],
    '歌': EXTRA['うた'],
    '絵': EXTRA['え'],
    '料理': EXTRA['りょうり'],
    'お酒': EXTRA['おさけ'],
    'お茶': EXTRA['おちゃ'],
    '勉強': EXTRA['べんきょう'],
    '仕事': EXTRA['しごと'],
    '有ります': EXTRA['あります'],
    '居ます': EXTRA['います'],
    '上': EXTRA['うえ'],
    '下': EXTRA['した'],
    '前': EXTRA['まえ'],
    '後ろ': EXTRA['うしろ'],
    '中': EXTRA['なか'],
    '外': EXTRA['そと'],
    '隣': EXTRA['となり'],
    '近く': EXTRA['ちかく'],
    '間': EXTRA['あいだ'],
    '箱': EXTRA['はこ'],
    '花瓶': EXTRA['かびん'],
    '木': EXTRA['き'],
    '犬': EXTRA['いぬ'],
    '猫': EXTRA['ねこ'],
    '鳥': EXTRA['とり'],
    '何ですか': EXTRA['なんですか'],
    '誰ですか': EXTRA['だれですか'],
    '一つ': EXTRA['ひとつ'],
    '二つ': EXTRA['ふたつ'],
    '五つ': EXTRA['いつつ'],
    '九つ': EXTRA['ここのつ'],
    '十': EXTRA['とお'],
    '〜個': EXTRA['〜こ'],
    '〜枚': EXTRA['〜まい'],
    '〜台': EXTRA['〜だい'],
  });
})();
