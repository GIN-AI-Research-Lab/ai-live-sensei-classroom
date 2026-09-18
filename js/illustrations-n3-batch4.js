/**
 * Sensei Art — lo minh hoa bo sung N3 (lo 4/6): bai 12-14.
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

  // ---- helper rieng cho lo nay, tai su dung nhieu lan ----
  function mag(cx, cy, color, scale) {
    const s = scale || 1;
    return `<circle cx="${cx}" cy="${cy}" r="${11 * s}" stroke="${color}" stroke-width="${3 * s}"/>` +
           `<path d="M${cx + 8 * s} ${cy + 8 * s} L${cx + 20 * s} ${cy + 20 * s}" stroke="${color}" stroke-width="${4 * s}"/>`;
  }

  function upArrow(x, yBase, h, color) {
    const yTop = yBase - h;
    return `<path d="M${x} ${yBase} V${yTop + 8} M${x - 8} ${yTop + 14} L${x} ${yTop} L${x + 8} ${yTop + 14}" ` +
           `stroke="${color}" stroke-width="4"/>`;
  }

  function downArrow(x, yTop, h, color) {
    const yBase = yTop + h;
    return `<path d="M${x} ${yTop} V${yBase - 8} M${x - 8} ${yBase - 14} L${x} ${yBase} L${x + 8} ${yBase - 14}" ` +
           `stroke="${color}" stroke-width="4"/>`;
  }

  function rightArrow(x, y, len, color) {
    return `<path d="M${x} ${y} H${x + len - 8} M${x + len - 14} ${y - 8} L${x + len} ${y} L${x + len - 14} ${y + 8}" ` +
           `stroke="${color}" stroke-width="4"/>`;
  }

  function bubble(cx, cy, color) {
    return `<ellipse cx="${cx}" cy="${cy}" rx="22" ry="16" stroke="${color}" stroke-width="3" fill="${PAPER}"/>` +
           `<circle cx="${cx - 18}" cy="${cy + 20}" r="4" stroke="${color}" stroke-width="2.5"/>` +
           `<circle cx="${cx - 24}" cy="${cy + 28}" r="2.5" stroke="${color}" stroke-width="2"/>`;
  }

  const EXTRA = {
    // ---------- bai 12: dieu tra, xac nhan ----------
    'しょうめいします': art(
      `<rect x="26" y="16" width="48" height="58" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M34 30 h32 M34 40 h32 M34 50 h20" stroke="${SAGE}" stroke-width="2.5"/>` +
      check(50, 66, ACCENT, 1) +
      label('CHỨNG MINH', ACCENT, 9)),

    'たしかめます': art(
      mag(40, 40, INK, 1) +
      check(42, 40, SAGE, .8) +
      label('XÁC NHẬN', ACCENT, 10)),

    'はんにん': art(
      person(50, 48, INK, 1.1) +
      `<rect x="35" y="36" width="30" height="7" fill="${ACCENT}" stroke="none"/>` +
      label('THỦ PHẠM', ACCENT, 10)),

    'まちがい': art(
      `<circle cx="50" cy="44" r="28" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M38 32 L62 56 M62 32 L38 56" stroke="${ACCENT}" stroke-width="5"/>` +
      label('SAI', ACCENT, 13)),

    'げんば': art(
      `<circle cx="50" cy="34" r="16" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M38 46 L50 78 L62 46" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="50" cy="34" r="6" stroke="${ACCENT}" stroke-width="2.5"/>` +
      label('HIỆN TRƯỜNG', INK, 9)),

    'そうさします': art(
      mag(44, 38, INK, 1) +
      dot(66, 60, 3, ACCENT) + dot(74, 66, 2.5, ACCENT) + dot(60, 68, 2, ACCENT) +
      label('ĐIỀU TRA', ACCENT, 10)),

    'わすれもの': art(
      `<rect x="30" y="34" width="40" height="30" rx="3" stroke="${INK}" stroke-width="3" stroke-dasharray="5 4"/>` +
      `<path d="M18 78 h64" stroke="${SAGE}" stroke-width="3"/>` +
      label('BỎ QUÊN', ACCENT, 10)),

    'けっか': art(
      `<circle cx="50" cy="44" r="26" stroke="${GOLD}" stroke-width="3"/>` +
      `<circle cx="50" cy="44" r="14" stroke="${GOLD}" stroke-width="2.5"/>` +
      dot(50, 44, 4, ACCENT) +
      label('KẾT QUẢ', INK, 10)),

    'かれ': art(
      person(50, 46, INK, 1.15) +
      label('ANH ẤY', ACCENT, 12)),

    'もの': art(
      `<path d="M28 40 L50 28 L72 40 V68 L50 80 L28 68 Z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M28 40 L50 52 L72 40 M50 52 V80" stroke="${INK}" stroke-width="2.5"/>` +
      label('VẬT', ACCENT, 12)),

    'わかります': art(
      `<circle cx="50" cy="42" r="16" stroke="${GOLD}" stroke-width="3"/>` +
      `<path d="M44 66 h12 M46 72 h8" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M50 26 v-8 M32 42 h-8 M68 42 h8 M38 30 l-6 -6 M62 30 l6 -6" stroke="${GOLD}" stroke-width="2.5"/>` +
      label('HIỂU', ACCENT, 12)),

    // ---------- bai 13: tinh huong, du doan ----------
    'じょうきょう': art(
      `<rect x="14" y="24" width="72" height="48" rx="4" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      person(50, 56, ACCENT, .6) +
      label('TÌNH HUỐNG', INK, 9)),

    'そうぞうします': art(
      bubble(52, 34, SAGE) +
      `<path d="M52 24 v16 M44 32 h16 M46 26 l12 12 M58 26 l-12 12" stroke="${GOLD}" stroke-width="2.5"/>` +
      label('TƯỞNG TƯỢNG', ACCENT, 8.5)),

    'よそうします': art(
      bubble(52, 36, GOLD) +
      `<path d="M40 40 l8 -8 8 4 10 -12" stroke="${ACCENT}" stroke-width="2.5"/>` +
      label('DỰ ĐOÁN', ACCENT, 10)),

    'みらい': art(
      `<circle cx="72" cy="28" r="12" stroke="${GOLD}" stroke-width="3"/>` +
      rightArrow(16, 60, 46, ACCENT) +
      label('TƯƠNG LAI', INK, 10)),

    'かのう': art(
      `<circle cx="50" cy="42" r="26" stroke="${SAGE}" stroke-width="3"/>` +
      check(50, 44, SAGE, 1.2) +
      label('KHẢ THI', ACCENT, 11)),

    'おこります': art(
      `<path d="M50 44 L38 20 M50 44 L62 18 M50 44 L26 44 M50 44 L74 40 M50 44 L34 66 M50 44 L66 68" ` +
      `stroke="${GOLD}" stroke-width="3.5"/>` +
      dot(50, 44, 6, ACCENT) +
      label('XẢY RA', INK, 11)),

    'へんか': art(
      `<circle cx="26" cy="46" r="14" stroke="${INK}" stroke-width="3"/>` +
      rightArrow(44, 46, 14, GOLD) +
      `<rect x="62" y="32" width="26" height="26" stroke="${ACCENT}" stroke-width="3"/>` +
      label('THAY ĐỔI', INK, 10)),

    'あんぜん': art(
      `<path d="M50 16 L80 28 V52 C80 70 66 82 50 86 C34 82 20 70 20 52 V28 Z" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      check(50, 52, SAGE, 1.1) +
      label('AN TOÀN', ACCENT, 10)),

    'きかい': art(
      `<circle cx="50" cy="46" r="18" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="50" cy="46" r="7" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M50 24 v-7 M50 75 v-7 M22 46 h7 M78 46 h-7 M32 28 l5 5 M68 28 l-5 5 M32 64 l5 -5 M68 64 l-5 -5" ` +
      `stroke="${GOLD}" stroke-width="2.5"/>` +
      label('MÁY MÓC', ACCENT, 10)),

    'もんだい': art(
      `<circle cx="50" cy="44" r="28" stroke="${ACCENT}" stroke-width="3"/>` +
      `<text x="50" y="54" font-size="26" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      label('VẤN ĐỀ', INK, 12)),

    'どんな': art(
      bubble(50, 38, ACCENT) +
      `<text x="50" y="44" font-size="15" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      label('LOẠI NÀO', INK, 10)),

    // ---------- bai 14: kinh te, tang giam ----------
    'ぞうかします': art(
      upArrow(50, 74, 40, SAGE) +
      `<path d="M28 74 h44" stroke="${INK}" stroke-width="2.5"/>` +
      label('TĂNG (GIA TĂNG)', ACCENT, 8)),

    'しつぎょう': art(
      `<rect x="26" y="42" width="48" height="32" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 42 v-8 h20 v8" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M38 54 L62 68 M62 54 L38 68" stroke="${ACCENT}" stroke-width="4"/>` +
      label('THẤT NGHIỆP', ACCENT, 8.5)),

    'しんぽします': art(
      `<path d="M18 74 h14 v-12 h14 v-12 h14 v-12 h14" stroke="${INK}" stroke-width="4"/>` +
      rightArrow(64, 38, 16, SAGE) +
      label('TIẾN BỘ', ACCENT, 11)),

    'かくだいします': art(
      `<rect x="40" y="40" width="20" height="20" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M34 34 L16 16 M66 34 L84 16 M34 66 L16 84 M66 66 L84 84" stroke="${GOLD}" stroke-width="3.5"/>` +
      label('MỞ RỘNG', ACCENT, 10)),

    'はってんします': art(
      `<path d="M50 78 v-30" stroke="${SAGE}" stroke-width="4"/>` +
      `<path d="M50 48 q-16 -4 -18 -22 q16 0 18 18 M50 48 q16 -4 18 -22 q-16 0 -18 18" stroke="${SAGE}" stroke-width="3"/>` +
      upArrow(78, 70, 26, GOLD) +
      label('PHÁT TRIỂN', ACCENT, 10)),

    'へります': art(
      downArrow(50, 26, 40, ACCENT) +
      `<path d="M28 74 h44" stroke="${INK}" stroke-width="2.5"/>` +
      label('GIẢM', ACCENT, 13)),

    'ふえます': art(
      upArrow(50, 74, 36, SAGE) +
      dot(30, 66, 3, SAGE) + dot(70, 66, 3, SAGE) +
      label('TĂNG LÊN', ACCENT, 11)),

    'げんしょう': art(
      downArrow(50, 24, 38, ACCENT) +
      dot(30, 68, 3, INK) +
      label('GIẢM SÚT', INK, 10)),

    'ぶっか': art(
      `<path d="M24 24 h30 l26 26 -30 30 -26 -26 z" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="36" cy="36" r="4" stroke="${GOLD}" stroke-width="2.5"/>` +
      upArrow(74, 68, 24, ACCENT) +
      label('VẬT GIÁ', INK, 11)),

    'かんきょう': art(
      `<circle cx="50" cy="50" r="26" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M50 24 q-10 14 0 26 q10 -12 0 -26 z" fill="${SAGE}" stroke="none"/>` +
      `<path d="M24 50 h52" stroke="${SAGE}" stroke-width="2" stroke-dasharray="3 3"/>` +
      label('MÔI TRƯỜNG', INK, 9)),

    'けいざい': art(
      `<circle cx="46" cy="48" r="22" stroke="${GOLD}" stroke-width="3"/>` +
      `<text x="46" y="56" font-size="20" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">¥</text>` +
      upArrow(82, 62, 22, SAGE) +
      label('KINH TẾ', ACCENT, 12)),

    'あがります': art(
      upArrow(50, 76, 44, ACCENT) +
      `<path d="M24 76 h52" stroke="${INK}" stroke-width="2.5"/>` +
      label('TĂNG / ĐI LÊN', INK, 8.5)),
  };

  // Alias theo kanji — dung chung hinh voi dang kana o tren
  EXTRA['証明します'] = EXTRA['しょうめいします'];
  EXTRA['確かめます'] = EXTRA['たしかめます'];
  EXTRA['犯人'] = EXTRA['はんにん'];
  EXTRA['間違い'] = EXTRA['まちがい'];
  EXTRA['現場'] = EXTRA['げんば'];
  EXTRA['捜査します'] = EXTRA['そうさします'];
  EXTRA['忘れ物'] = EXTRA['わすれもの'];
  EXTRA['結果'] = EXTRA['けっか'];
  EXTRA['彼'] = EXTRA['かれ'];
  EXTRA['物'] = EXTRA['もの'];
  EXTRA['分かります'] = EXTRA['わかります'];
  EXTRA['状況'] = EXTRA['じょうきょう'];
  EXTRA['想像します'] = EXTRA['そうぞうします'];
  EXTRA['予想します'] = EXTRA['よそうします'];
  EXTRA['未来'] = EXTRA['みらい'];
  EXTRA['可能'] = EXTRA['かのう'];
  EXTRA['起こります'] = EXTRA['おこります'];
  EXTRA['変化'] = EXTRA['へんか'];
  EXTRA['安全'] = EXTRA['あんぜん'];
  EXTRA['機械'] = EXTRA['きかい'];
  EXTRA['問題'] = EXTRA['もんだい'];
  EXTRA['増加します'] = EXTRA['ぞうかします'];
  EXTRA['失業'] = EXTRA['しつぎょう'];
  EXTRA['進歩します'] = EXTRA['しんぽします'];
  EXTRA['拡大します'] = EXTRA['かくだいします'];
  EXTRA['発展します'] = EXTRA['はってんします'];
  EXTRA['減ります'] = EXTRA['へります'];
  EXTRA['増えます'] = EXTRA['ふえます'];
  EXTRA['減少'] = EXTRA['げんしょう'];
  EXTRA['物価'] = EXTRA['ぶっか'];
  EXTRA['環境'] = EXTRA['かんきょう'];
  EXTRA['経済'] = EXTRA['けいざい'];
  EXTRA['上がります'] = EXTRA['あがります'];

  window.SenseiArt.extend(EXTRA);
})();
