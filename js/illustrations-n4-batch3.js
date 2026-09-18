/**
 * Sensei Art — lo minh hoa bo sung N4 (lo 3/3): bai 40-50.
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

  /** Ngoi sao lap lanh (hung thu, quan trong, kinh trong...) */
  function sparkle(cx, cy, color, scale) {
    const s = scale || 1;
    const x = cx, y = cy - 11 * s;
    return `<path d="M${x} ${y} l${3.5 * s} ${7.5 * s} ${8 * s} ${1 * s} ${-6 * s} ${6 * s} ${1.5 * s} ${8 * s} ` +
           `${-7 * s} ${-4 * s} ${-7 * s} ${4 * s} ${1.5 * s} ${-8 * s} ${-6 * s} ${-6 * s} ${8 * s} ${-1 * s} z" ` +
           `fill="${color}" stroke="${color}" stroke-width="1"/>`;
  }

  /** Buc/gia de nguoi dung len tren — the hien su ton kinh (kinh ngu). */
  function pedestal(cx, cyBase, halfW, color) {
    return `<path d="M${cx - halfW - 6} ${cyBase} L${cx + halfW + 6} ${cyBase} L${cx + halfW - 4} ${cyBase - 10} ` +
           `L${cx - halfW + 4} ${cyBase - 10} Z" stroke="${color}" stroke-width="2.5" fill="${PAPER}"/>`;
  }

  /** Nguoi cui chao — the hien khiem nhuong (khiem nhuong ngu). */
  function bow(cx, cy, color, scale) {
    const s = scale || 1;
    return `<g transform="rotate(-26 ${cx} ${cy + 22 * s})">` + person(cx, cy, color, s) + `</g>`;
  }

  /** Mui ten ngang, len > 0 huong phai, len < 0 huong trai. */
  function arrowH(x, y, len, color) {
    const x2 = x + len, dir = len >= 0 ? 1 : -1;
    return `<path d="M${x} ${y} L${x2} ${y}" stroke="${color}" stroke-width="2.5"/>` +
           `<path d="M${x2 - 7 * dir} ${y - 6} L${x2} ${y} L${x2 - 7 * dir} ${y + 6}" stroke="${color}" stroke-width="2.5"/>`;
  }

  /** Hop qua co no. */
  function giftBox(cx, cy, w, color) {
    const h = w * 0.75, x = cx - w / 2, y = cy - h / 2;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" stroke="${color}" stroke-width="3" fill="${PAPER}"/>` +
           `<path d="M${x} ${cy} h${w} M${cx} ${y} v${h}" stroke="${color}" stroke-width="2.5"/>` +
           `<path d="M${cx - 6} ${y} q-5 -10 3 -12 q5 3 3 12 M${cx + 6} ${y} q5 -10 -3 -12 q-5 3 -3 12" ` +
           `stroke="${color}" stroke-width="2" fill="${PAPER}"/>`;
  }

  /** May: 3 vong tron chong len + day duoi phang. */
  function cloud(cx, cy, color, scale) {
    const s = scale || 1;
    return `<circle cx="${cx - 14 * s}" cy="${cy}" r="${9 * s}" fill="${PAPER}" stroke="${color}" stroke-width="${3 * s}"/>` +
           `<circle cx="${cx}" cy="${cy - 6 * s}" r="${12 * s}" fill="${PAPER}" stroke="${color}" stroke-width="${3 * s}"/>` +
           `<circle cx="${cx + 14 * s}" cy="${cy}" r="${9 * s}" fill="${PAPER}" stroke="${color}" stroke-width="${3 * s}"/>` +
           `<rect x="${cx - 22 * s}" y="${cy}" width="${44 * s}" height="${10 * s}" rx="${5 * s}" fill="${PAPER}" stroke="${color}" stroke-width="${3 * s}"/>`;
  }

  /** Nguoi lon chi tay + nguoi nho — khung cho cac dong tu the sai khien (bai 48). */
  function directive(colorSmall) {
    return person(26, 50, INK, .9) +
           `<path d="M44 44 h18" stroke="${GOLD}" stroke-width="2.5"/>` +
           `<path d="M58 39 L62 44 L58 49" stroke="${GOLD}" stroke-width="2.5"/>` +
           person(76, 64, colorSmall, .6);
  }

  /** Nguoi dung tren buc + ngoi sao — khung cho ton kinh ngu (bai 49). */
  function honoredBase() {
    return pedestal(50, 80, 16, GOLD) + person(50, 51, GOLD, .85) + sparkle(76, 30, GOLD, .5);
  }

  /** Nhan 2 dong: nghia ngan + nhan sac thai (kinh ngu / khiem nhuong / the sai khien...). */
  function label2(text1, color1, text2, color2, size1) {
    return `<text x="50" y="86" font-size="${size1 || 11}" fill="${color1}" font-weight="700" text-anchor="middle" stroke="none">${text1}</text>` +
           `<text x="50" y="97" font-size="8" fill="${color2}" font-weight="600" text-anchor="middle" stroke="none">${text2}</text>`;
  }

  const EXTRA = {
    // ---------- bai 40: vi, thi cu, dien thoai ----------
    'あじ': art(
      `<circle cx="46" cy="46" r="22" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="38" cy="42" r="2.3" fill="${INK}" stroke="none"/><circle cx="54" cy="42" r="2.3" fill="${INK}" stroke="none"/>` +
      `<path d="M36 52 q10 6 20 0" stroke="${INK}" stroke-width="2"/>` +
      `<ellipse cx="46" cy="61" rx="6" ry="10" fill="${ACCENT}" stroke="${INK}" stroke-width="2"/>` +
      sparkle(76, 30, GOLD, .55) +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">vị, hương vị</text>`),

    'きょうみ': art(
      person(32, 56, INK, .85) +
      `<circle cx="30" cy="42" r="1.8" fill="${GOLD}" stroke="none"/><circle cx="38" cy="42" r="1.8" fill="${GOLD}" stroke="none"/>` +
      sparkle(72, 38, GOLD, 1) +
      `<path d="M46 48 L60 42" stroke="${GOLD}" stroke-width="2" stroke-dasharray="2 3"/>` +
      `<text x="50" y="92" font-size="11" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">hứng thú</text>`),

    'しけん': art(
      `<rect x="24" y="16" width="52" height="64" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M34 30 h32 M34 40 h32 M34 50 h20" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<circle cx="66" cy="64" r="10" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<text x="66" y="69" font-size="13" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      `<path d="M30 66 l4 6 8 -10" stroke="${SAGE}" stroke-width="3"/>` +
      `<text x="50" y="92" font-size="12" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">kỳ thi</text>`),

    'ごうかくします': art(
      `<rect x="20" y="18" width="60" height="54" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M30 30 h20 M30 40 h30" stroke="${SAGE}" stroke-width="2.5" opacity=".6"/>` +
      `<circle cx="58" cy="46" r="20" stroke="${ACCENT}" stroke-width="5"/>` +
      sparkle(82, 20, GOLD, .6) +
      `<text x="50" y="88" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">đậu, đỗ</text>`),

    'サイズ': art(
      `<path d="M38 26 l-14 8 5 10 9 -5 v34 h24 v-34 l9 5 5 -10 -14 -8 q-4 5 -10 5 q-6 0 -10 -5 z" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M18 52 h64" stroke="${GOLD}" stroke-width="2" stroke-dasharray="3 3"/>` +
      `<path d="M18 47 v10 M82 47 v10" stroke="${GOLD}" stroke-width="2"/>` +
      `<text x="26" y="46" font-size="9" fill="${GOLD}" font-weight="700" stroke="none">S</text>` +
      `<text x="70" y="46" font-size="9" fill="${GOLD}" font-weight="700" stroke="none">L</text>` +
      `<text x="50" y="92" font-size="12" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">kích cỡ</text>`),

    'でんわします': art(
      person(38, 56, INK, .9) +
      `<rect x="52" y="32" width="13" height="22" rx="3" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M69 36 q7 5 0 12" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M75 30 q12 9 0 24" stroke="${GOLD}" stroke-width="2"/>` +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">gọi điện thoại</text>`),

    'ほんとう': art(
      `<circle cx="50" cy="46" r="26" stroke="${GOLD}" stroke-width="4" stroke-dasharray="3 3"/>` +
      `<path d="M36 46 l10 11 19 -22" stroke="${GOLD}" stroke-width="5"/>` +
      `<text x="50" y="90" font-size="11" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">sự thật</text>`),

    // ---------- bai 41: kinh ngu voi qua tang, khach, hoa anh dao ----------
    'さしあげます': art(
      person(22, 62, INK, .7) +
      giftBox(48, 56, 16, ACCENT) +
      `<path d="M60 46 L74 32" stroke="${GOLD}" stroke-width="2.5"/><path d="M68 32 h6 v6" stroke="${GOLD}" stroke-width="2.5"/>` +
      pedestal(84, 76, 10, GOLD) +
      person(84, 58, GOLD, .8) +
      label2('kính biếu', ACCENT, 'lên bề trên', GOLD, 11)),

    'いただきます': art(
      person(26, 16, GOLD, .5) +
      giftBox(52, 42, 15, ACCENT) +
      `<path d="M52 51 v10" stroke="${GOLD}" stroke-width="2.5"/><path d="M47 60 l5 6 5 -6" stroke="${GOLD}" stroke-width="2.5"/>` +
      bow(74, 66, INK, .65) +
      label2('được nhận', ACCENT, 'khiêm nhường', GOLD, 10)),

    'くださいます': art(
      pedestal(50, 32, 12, GOLD) +
      person(50, 18, GOLD, .55) +
      giftBox(50, 52, 15, ACCENT) +
      `<path d="M50 61 v10" stroke="${GOLD}" stroke-width="2.5"/><path d="M45 70 l5 6 5 -6" stroke="${GOLD}" stroke-width="2.5"/>` +
      person(78, 74, INK, .65) +
      label2('được ban cho', ACCENT, 'từ người trên', GOLD, 9)),

    'プレゼント': art(
      giftBox(50, 54, 46, ACCENT) +
      sparkle(80, 22, GOLD, .6) +
      `<text x="50" y="92" font-size="12" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">món quà</text>`),

    'はなみ': art(
      `<path d="M28 82 v-30" stroke="${INK}" stroke-width="4"/>` +
      `<circle cx="28" cy="34" r="22" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="20" cy="28" r="2" fill="${ACCENT}" stroke="none"/><circle cx="32" cy="24" r="2" fill="${ACCENT}" stroke="none"/>` +
      `<circle cx="38" cy="36" r="2" fill="${ACCENT}" stroke="none"/><circle cx="18" cy="40" r="2" fill="${ACCENT}" stroke="none"/>` +
      `<ellipse cx="60" cy="30" rx="2.5" ry="1.6" fill="${ACCENT}" stroke="none" transform="rotate(30 60 30)"/>` +
      `<ellipse cx="72" cy="52" rx="2.5" ry="1.6" fill="${ACCENT}" stroke="none" transform="rotate(-20 72 52)"/>` +
      person(66, 74, INK, .55) +
      `<text x="50" y="92" font-size="9.5" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">ngắm hoa anh đào</text>`),

    'しゃちょう': art(
      person(46, 52, INK, 1) +
      `<path d="M46 44 l-4 7 4 14 4 -14 z" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M38 24 l3 -9 5 6 4 -9 4 9 5 -6 3 9 z" fill="${GOLD}" stroke="${GOLD}" stroke-width="1"/>` +
      `<text x="50" y="92" font-size="10" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">giám đốc</text>`),

    'みず': art(
      `<path d="M50 18 q-16 24 -16 38 a16 16 0 0 0 32 0 q0 -14 -16 -38 z" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M38 62 q6 4 12 0 q6 -4 12 0" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<path d="M20 84 q10 -6 20 0 q10 6 20 0 q10 -6 20 0" stroke="${SAGE}" stroke-width="2" opacity=".6"/>` +
      `<text x="50" y="95" font-size="12" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">nước</text>`),

    'おきゃくさん': art(
      `<rect x="18" y="18" width="24" height="62" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="36" cy="50" r="2" fill="${INK}" stroke="none"/>` +
      person(64, 54, ACCENT, .8) +
      `<rect x="74" y="66" width="12" height="10" rx="2" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M50 40 q8 -6 16 0" stroke="${SAGE}" stroke-width="2" stroke-dasharray="2 3"/>` +
      `<text x="50" y="92" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">vị khách</text>`),

    'ありがたい': art(
      person(50, 58, INK, .9) +
      `<ellipse cx="50" cy="58" rx="6" ry="4" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M50 32 q-6 -8 -12 -2 q-4 4 12 16 q16 -12 12 -16 q-6 -6 -12 2 z" fill="${ACCENT}" stroke="none"/>` +
      sparkle(72, 30, GOLD, .5) +
      `<text x="50" y="92" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">biết ơn</text>`),

    // ---------- bai 42: tich luy, dung cu, cat ----------
    'ためます': art(
      `<ellipse cx="46" cy="56" rx="26" ry="18" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M30 72 v6 M62 72 v6" stroke="${GOLD}" stroke-width="3"/>` +
      `<path d="M40 42 q6 -4 12 0" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<circle cx="46" cy="22" r="8" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<text x="46" y="26" font-size="9" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">¥</text>` +
      `<path d="M46 30 v10" stroke="${ACCENT}" stroke-width="2" stroke-dasharray="2 2"/>` +
      `<text x="50" y="92" font-size="9.5" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">để dành tiền</text>`),

    'やくにたちます': art(
      `<circle cx="50" cy="42" r="18" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M43 58 h14 v6 a7 7 0 0 1 -14 0 z" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M50 22 v6 M32 42 h-6 M68 42 h6 M38 29 l-4 -4 M62 29 l4 -4" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M42 42 l6 7 12 -14" stroke="${SAGE}" stroke-width="3"/>` +
      `<text x="50" y="92" font-size="11" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">có ích</text>`),

    'りゅうがくします': art(
      `<path d="M14 70 L82 30 L54 46 L60 68 L46 54 Z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M70 22 l14 -6 14 6 -14 6 z" fill="${GOLD}" stroke="none"/>` +
      `<path d="M84 22 v6" stroke="${GOLD}" stroke-width="2"/>` +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">đi du học</text>`),

    'どうぐ': art(
      `<path d="M30 76 L62 44" stroke="${INK}" stroke-width="4"/>` +
      `<rect x="54" y="30" width="20" height="12" rx="2" stroke="${INK}" stroke-width="3" fill="${PAPER}" transform="rotate(45 64 36)"/>` +
      `<path d="M70 76 L38 44" stroke="${SAGE}" stroke-width="4"/>` +
      `<rect x="34" y="34" width="10" height="14" rx="2" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}" transform="rotate(45 39 41)"/>` +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">dụng cụ</text>`),

    'おかねもち': art(
      person(36, 54, INK, .9) +
      `<ellipse cx="64" cy="66" rx="12" ry="14" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M60 54 q4 -4 8 0" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<text x="64" y="70" font-size="11" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">¥</text>` +
      `<circle cx="80" cy="44" r="7" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<text x="80" y="48" font-size="8" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">¥</text>` +
      `<text x="50" y="92" font-size="10" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">người giàu</text>`),

    'はさみ': art(
      `<circle cx="30" cy="70" r="8" stroke="${INK}" stroke-width="3"/><circle cx="50" cy="76" r="8" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M34 64 L82 20" stroke="${INK}" stroke-width="3"/><path d="M46 70 L82 26" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="40" cy="60" r="3" fill="${ACCENT}" stroke="none"/>` +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">cái kéo</text>`),

    'きります': art(
      `<path d="M14 50 h28" stroke="${INK}" stroke-width="2" stroke-dasharray="4 3"/><path d="M58 50 h28" stroke="${INK}" stroke-width="2" stroke-dasharray="4 3"/>` +
      `<circle cx="40" cy="66" r="6" stroke="${ACCENT}" stroke-width="2.5"/><circle cx="54" cy="70" r="6" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M44 62 L74 28" stroke="${ACCENT}" stroke-width="3"/><path d="M52 66 L74 34" stroke="${ACCENT}" stroke-width="3"/>` +
      `<text x="50" y="92" font-size="13" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">cắt</text>`),

    // ---------- bai 43: nga, khoc, thoi tiet ----------
    'たおれます': art(
      `<g transform="rotate(65 50 64.7)">` + person(50, 46, ACCENT, .85) + `</g>` +
      `<path d="M18 40 l8 4 M16 55 l8 2" stroke="${INK}" stroke-width="2" opacity=".5"/>` +
      `<path d="M14 82 h72" stroke="${INK}" stroke-width="3"/>` +
      `<text x="50" y="94" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">ngã, sụp đổ</text>`),

    'なきます': art(
      person(50, 54, INK, 1) +
      `<path d="M42 46 q-2 6 0 10 q2 2 3 0 q1 -4 -3 -10 z" fill="${SAGE}" stroke="none"/>` +
      `<path d="M58 46 q2 6 0 10 q-2 2 -3 0 q-1 -4 3 -10 z" fill="${SAGE}" stroke="none"/>` +
      `<text x="50" y="92" font-size="13" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">khóc</text>`),

    'おちます': art(
      `<circle cx="34" cy="20" r="8" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M34 12 q3 -4 6 -2" stroke="${SAGE}" stroke-width="2"/>` +
      `<path d="M34 32 v20" stroke="${GOLD}" stroke-width="2" stroke-dasharray="3 3"/><path d="M29 48 l5 6 5 -6" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M14 82 h72" stroke="${INK}" stroke-width="3"/>` +
      `<text x="50" y="94" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">rơi xuống</text>`),

    'ねむい': art(
      person(42, 58, INK, 1) +
      `<path d="M35 46 q3 -3 6 0 M49 46 q3 -3 6 0" stroke="${INK}" stroke-width="2"/>` +
      `<text x="66" y="36" font-size="10" fill="${SAGE}" font-weight="700" stroke="none">Z</text>` +
      `<text x="74" y="26" font-size="13" fill="${SAGE}" font-weight="700" stroke="none">Z</text>` +
      `<text x="84" y="14" font-size="16" fill="${SAGE}" font-weight="700" stroke="none">Z</text>` +
      `<text x="50" y="92" font-size="11" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">buồn ngủ</text>`),

    'にがい': art(
      person(36, 58, INK, 1) +
      `<path d="M29 46 q3 3 6 0 M43 46 q3 3 6 0" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M34 56 q2 6 0 8" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M66 50 h16 v14 a8 8 0 0 1 -16 0 z" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M70 46 l2 -6 2 6 2 -6" stroke="${SAGE}" stroke-width="2"/>` +
      `<text x="50" y="92" font-size="13" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">đắng</text>`),

    'くも': art(
      cloud(50, 46, INK, 1.1) +
      `<text x="50" y="90" font-size="13" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">mây</text>`),

    // ---------- bai 44: di bo, chu viet ----------
    'あるきます': art(
      person(44, 42, INK, .8) +
      `<path d="M44 60 L34 78 M44 60 L55 74" stroke="${INK}" stroke-width="3"/>` +
      `<ellipse cx="33" cy="80" rx="5" ry="2.5" fill="${INK}" stroke="none"/><ellipse cx="57" cy="76" rx="5" ry="2.5" fill="${INK}" stroke="none"/>` +
      `<path d="M14 50 h10 M12 60 h10" stroke="${SAGE}" stroke-width="2" opacity=".5"/>` +
      `<text x="50" y="94" font-size="12" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">đi bộ</text>`),

    'じ': art(
      `<rect x="20" y="24" width="56" height="52" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M36 38 v28 M36 38 h20 M48 50 h-6 M40 66 q6 4 14 0" stroke="${ACCENT}" stroke-width="5"/>` +
      `<path d="M70 20 l14 -10" stroke="${GOLD}" stroke-width="3"/><path d="M70 20 l6 8 -10 4 z" fill="${GOLD}" stroke="none"/>` +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">chữ viết</text>`),

    // ---------- bai 45: that bai, truong hop, thien tai ----------
    'しっぱいします': art(
      `<rect x="24" y="20" width="52" height="60" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M34 32 h32 M34 42 h32 M34 52 h20" stroke="${SAGE}" stroke-width="2.5" opacity=".5"/>` +
      `<path d="M34 34 L66 66 M66 34 L34 66" stroke="${ACCENT}" stroke-width="6"/>` +
      `<text x="50" y="92" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">thất bại</text>`),

    'ばあい': art(
      `<path d="M50 84 v-24 M50 60 L26 24 M50 60 L74 24" stroke="${INK}" stroke-width="4"/>` +
      `<rect x="12" y="14" width="22" height="11" rx="2" stroke="${GOLD}" stroke-width="2" fill="${PAPER}"/>` +
      `<rect x="66" y="14" width="22" height="11" rx="2" stroke="${SAGE}" stroke-width="2" fill="${PAPER}"/>` +
      `<text x="50" y="94" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">trường hợp</text>`),

    'じしん': art(
      `<path d="M8 72 l16 -8 12 10 16 -10 12 10 16 -8" stroke="${INK}" stroke-width="4"/>` +
      `<path d="M40 50 l12 -12 12 12 v18 h-24 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M28 46 q4 4 0 8 M76 46 q-4 4 0 8" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">động đất</text>`),

    'かじ': art(
      `<path d="M26 78 v-26 l24 -18 24 18 v26 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 24 q-8 10 -2 18 q2 3 2 -2 q0 5 4 2 q6 -6 -4 -18 z" fill="${ACCENT}" stroke="${ACCENT}" stroke-width="1"/>` +
      `<rect x="34" y="56" width="10" height="10" fill="${ACCENT}" stroke="none"/><rect x="56" y="56" width="10" height="10" fill="${ACCENT}" stroke="none"/>` +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">hỏa hoạn</text>`),

    'いっしょうけんめい': art(
      person(30, 58, INK, .95) +
      `<circle cx="64" cy="58" r="16" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M42 54 h16" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M22 38 q3 5 0 8" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M10 60 h8 M10 68 h6" stroke="${ACCENT}" stroke-width="2"/>` +
      `<text x="50" y="92" font-size="12" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">hết mình</text>`),

    // ---------- bai 46: den noi, vua dung ----------
    'つきます': art(
      `<path d="M70 16 v64" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M70 18 h20 v14 h-20 z" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M70 18 h5 v7 h5 v7 h5 v-7 h5 v-7" fill="${INK}" stroke="none"/>` +
      person(38, 64, ACCENT, .8) +
      `<path d="M50 78 q10 -2 18 -6" stroke="${GOLD}" stroke-width="2" stroke-dasharray="2 3"/>` +
      `<text x="50" y="94" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">đến nơi</text>`),

    'ちょうど': art(
      `<path d="M50 20 v50" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M20 34 h60" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M20 34 v14 a10 6 0 0 0 20 0 v-14" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<path d="M60 34 v14 a10 6 0 0 0 20 0 v-14" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<path d="M40 78 h20" stroke="${INK}" stroke-width="4"/>` +
      sparkle(50, 24, GOLD, .4) +
      `<text x="50" y="92" font-size="11" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">vừa đúng</text>`),

    // ---------- bai 47: chuyen nha, suc khoe, tin don ----------
    'ひっこします': art(
      person(38, 56, INK, .85) +
      `<rect x="44" y="52" width="16" height="14" rx="2" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M68 78 v-22 l14 -12 14 12 v22 z" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M14 50 h10 M12 60 h10" stroke="${SAGE}" stroke-width="2" opacity=".5"/>` +
      `<text x="50" y="94" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">chuyển nhà</text>`),

    'びょうきです': art(
      person(50, 54, INK, 1) +
      `<rect x="46" y="34" width="4" height="16" rx="2" stroke="${ACCENT}" stroke-width="2" fill="${PAPER}"/>` +
      `<rect x="40" y="23" width="8" height="6" fill="${ACCENT}" stroke="none" transform="rotate(20 44 26)"/>` +
      `<path d="M64 30 q6 5 1 13 q-5 -2 -3 -8 z" fill="${SAGE}" stroke="none"/>` +
      `<text x="50" y="92" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">bị bệnh</text>`),

    'げんきです': art(
      person(50, 54, INK, 1) +
      `<path d="M62 50 q10 -2 10 -14" stroke="${ACCENT}" stroke-width="5"/>` +
      `<path d="M68 34 a6 6 0 1 1 4 6" stroke="${ACCENT}" stroke-width="4"/>` +
      sparkle(30, 32, GOLD, .6) +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">khỏe mạnh</text>`),

    'てんきよほう': art(
      `<rect x="14" y="24" width="72" height="46" rx="4" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="38" cy="46" r="10" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M38 32 v-4 M38 60 v4 M24 46 h-4 M52 46 h4" stroke="${GOLD}" stroke-width="2"/>` +
      cloud(64, 52, INK, .5) +
      `<path d="M14 78 v6 M86 78 v6 M30 78 h40" stroke="${INK}" stroke-width="3"/>` +
      `<text x="50" y="94" font-size="8.5" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">dự báo thời tiết</text>`),

    'うわさ': art(
      person(20, 66, INK, .5) + person(50, 58, ACCENT, .55) + person(80, 66, SAGE, .5) +
      `<path d="M30 50 q6 -4 12 0" stroke="${GOLD}" stroke-width="2" stroke-dasharray="2 3"/>` +
      `<path d="M60 46 q6 -4 12 0" stroke="${GOLD}" stroke-width="2" stroke-dasharray="2 3"/>` +
      `<ellipse cx="50" cy="28" rx="14" ry="9" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<text x="50" y="32" font-size="10" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">…</text>` +
      `<text x="50" y="92" font-size="11" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">tin đồn</text>`),

    'しあわせ': art(
      person(50, 58, INK, 1) +
      `<path d="M38 50 L26 34 M62 50 L74 34" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M43 46 q7 6 14 0" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M50 24 q-5 -7 -10 -2 q-3 4 10 13 q13 -9 10 -13 q-5 -5 -10 2 z" fill="${ACCENT}" stroke="none"/>` +
      sparkle(76, 50, GOLD, .5) + sparkle(24, 50, GOLD, .5) +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">hạnh phúc</text>`),

    // ---------- bai 48: the sai khien, cha me, tam trang ----------
    'いかせます': art(
      directive(SAGE) +
      `<path d="M88 60 h8" stroke="${SAGE}" stroke-width="2" opacity=".6"/><path d="M90 68 h8" stroke="${SAGE}" stroke-width="2" opacity=".6"/>` +
      label2('bắt / cho đi', ACCENT, 'thể sai khiến', GOLD, 10)),

    'たべさせます': art(
      directive(ACCENT) +
      `<path d="M70 80 a8 5 0 0 0 16 0 z" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      label2('bắt / cho ăn', ACCENT, 'thể sai khiến', GOLD, 10)),

    'させます': art(
      directive(SAGE) +
      `<rect x="86" y="50" width="12" height="16" rx="2" stroke="${GOLD}" stroke-width="2" fill="${PAPER}"/><path d="M89 55 h6 M89 60 h6" stroke="${GOLD}" stroke-width="1.6"/>` +
      label2('bắt / cho làm', ACCENT, 'thể sai khiến', GOLD, 10)),

    'こさせます': art(
      directive(SAGE) +
      `<path d="M64 60 h-8" stroke="${SAGE}" stroke-width="2" opacity=".6"/><path d="M64 70 h-8" stroke="${SAGE}" stroke-width="2" opacity=".6"/>` +
      label2('bắt / cho đến', ACCENT, 'thể sai khiến', GOLD, 9.5)),

    'てつだわせます': art(
      directive(ACCENT) +
      `<rect x="46" y="50" width="14" height="12" rx="2" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      label2('bắt / cho giúp', ACCENT, 'thể sai khiến', GOLD, 9.5)),

    'かたづけさせます': art(
      directive(SAGE) +
      `<rect x="82" y="76" width="14" height="10" rx="2" stroke="${SAGE}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<circle cx="70" cy="70" r="2" fill="${SAGE}" stroke="none"/><circle cx="76" cy="66" r="2" fill="${SAGE}" stroke="none"/>` +
      label2('bắt / cho dọn', ACCENT, 'thể sai khiến', GOLD, 9.5)),

    'やすませます': art(
      directive(GOLD) +
      `<rect x="80" y="72" width="18" height="10" rx="3" stroke="${GOLD}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<text x="90" y="66" font-size="9" fill="${GOLD}" font-weight="700" stroke="none">z</text>` +
      label2('cho nghỉ', ACCENT, 'thể sai khiến', GOLD, 11)),

    'べんきょうさせます': art(
      directive(ACCENT) +
      `<path d="M68 72 h16 v8 h-16 z" stroke="${ACCENT}" stroke-width="2.2" fill="${PAPER}"/><path d="M76 72 v8" stroke="${ACCENT}" stroke-width="1.6"/>` +
      label2('bắt / cho học', ACCENT, 'thể sai khiến', GOLD, 9.5)),

    'うんどうさせます': art(
      directive(SAGE) +
      `<path d="M68 58 L60 48 M84 58 L92 48" stroke="${SAGE}" stroke-width="2.2"/>` +
      label2('bắt / cho tập', ACCENT, 'thể sai khiến', GOLD, 10)),

    'おや': art(
      person(26, 56, INK, .8) + person(74, 56, ACCENT, .8) + person(50, 68, SAGE, .55) +
      `<path d="M36 62 L44 68 M64 62 L56 68" stroke="${SAGE}" stroke-width="2"/>` +
      `<text x="50" y="92" font-size="12" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">cha mẹ</text>`),

    'きもち': art(
      person(50, 56, INK, 1) +
      `<path d="M50 58 q-4 -6 -8 -2 q-2 3 8 10 q10 -7 8 -10 q-4 -4 -8 2 z" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M38 54 q-4 2 -2 6 M62 54 q4 2 2 6" stroke="${GOLD}" stroke-width="2"/>` +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">tâm trạng</text>`),

    // ---------- bai 49: kinh ngu (ton kinh) va chuc vu ----------
    'いらっしゃいます': art(
      honoredBase() +
      `<path d="M30 70 h40" stroke="${GOLD}" stroke-width="2.2"/><path d="M34 66 l-4 4 4 4 M66 66 l4 4 -4 4" stroke="${GOLD}" stroke-width="2.2"/>` +
      label2('là, có, đến, đi', GOLD, 'kính ngữ', GOLD, 8.5)),

    'おっしゃいます': art(
      honoredBase() +
      `<path d="M62 30 h20 a4 4 0 0 1 4 4 v10 a4 4 0 0 1 -4 4 h-10 l-6 6 v-6 h-4 a4 4 0 0 1 -4 -4 v-10 a4 4 0 0 1 4 -4 z" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M68 38 h10" stroke="${GOLD}" stroke-width="2"/>` +
      label2('nói', GOLD, 'kính ngữ', GOLD, 12)),

    'なさいます': art(
      honoredBase() +
      `<path d="M60 58 q6 2 10 -2" stroke="${GOLD}" stroke-width="2"/>` +
      sparkle(68, 54, GOLD, .5) +
      label2('làm', GOLD, 'kính ngữ', GOLD, 12)),

    'めしあがります': art(
      honoredBase() +
      `<path d="M62 68 h20 v4 a10 4 0 0 1 -20 0 z" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M66 62 l14 -8 M70 64 l14 -8" stroke="${GOLD}" stroke-width="1.6"/>` +
      label2('ăn / uống', GOLD, 'kính ngữ', GOLD, 10)),

    'ごらんになります': art(
      honoredBase() +
      `<rect x="66" y="46" width="18" height="14" rx="2" stroke="${GOLD}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<path d="M58 54 L66 52" stroke="${GOLD}" stroke-width="1.8" stroke-dasharray="2 2"/>` +
      label2('xem', GOLD, 'kính ngữ', GOLD, 12)),

    'およみになります': art(
      honoredBase() +
      `<path d="M62 60 h22" stroke="${GOLD}" stroke-width="3"/><circle cx="62" cy="60" r="3" stroke="${GOLD}" stroke-width="2"/><circle cx="84" cy="60" r="3" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M66 56 h14 M66 64 h10" stroke="${GOLD}" stroke-width="1.6"/>` +
      label2('đọc', GOLD, 'kính ngữ', GOLD, 12)),

    'おかきになります': art(
      honoredBase() +
      `<rect x="64" y="58" width="20" height="14" rx="2" stroke="${GOLD}" stroke-width="2" fill="${PAPER}"/><path d="M68 62 h10 M68 68 h6" stroke="${GOLD}" stroke-width="1.6"/>` +
      `<path d="M70 50 l10 -8" stroke="${GOLD}" stroke-width="2.5"/>` +
      label2('viết', GOLD, 'kính ngữ', GOLD, 12)),

    'ぶちょう': art(
      `<rect x="42" y="14" width="16" height="10" rx="2" stroke="${INK}" stroke-width="2" fill="${PAPER}"/>` +
      `<path d="M50 24 v8" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M20 32 h60" stroke="${INK}" stroke-width="2"/><path d="M20 32 v6 M50 32 v6 M80 32 v6" stroke="${INK}" stroke-width="2"/>` +
      `<rect x="10" y="38" width="20" height="12" rx="2" stroke="${INK}" stroke-width="2" fill="${PAPER}"/>` +
      `<rect x="40" y="38" width="20" height="12" rx="3" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="70" y="38" width="20" height="12" rx="2" stroke="${INK}" stroke-width="2" fill="${PAPER}"/>` +
      person(50, 66, ACCENT, .6) +
      `<text x="50" y="92" font-size="9.5" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">trưởng phòng</text>`),

    'かちょう': art(
      `<rect x="42" y="12" width="16" height="9" rx="2" stroke="${INK}" stroke-width="1.8" fill="${PAPER}"/>` +
      `<path d="M50 21 v6" stroke="${INK}" stroke-width="1.8"/>` +
      `<path d="M30 27 h40" stroke="${INK}" stroke-width="1.8"/><path d="M30 27 v6 M70 27 v6" stroke="${INK}" stroke-width="1.8"/>` +
      `<rect x="20" y="33" width="20" height="10" rx="2" stroke="${INK}" stroke-width="1.8" fill="${PAPER}"/><rect x="60" y="33" width="20" height="10" rx="2" stroke="${INK}" stroke-width="1.8" fill="${PAPER}"/>` +
      `<path d="M30 43 v12" stroke="${INK}" stroke-width="1.8"/>` +
      `<rect x="14" y="55" width="18" height="10" rx="2" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="38" y="55" width="18" height="10" rx="2" stroke="${INK}" stroke-width="1.8" fill="${PAPER}"/>` +
      person(23, 74, GOLD, .55) +
      `<text x="50" y="94" font-size="10" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">trưởng ban</text>`),

    'こうちょう': art(
      `<rect x="20" y="60" width="48" height="20" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M14 60 L44 34 L74 60 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="38" y="70" width="12" height="10" stroke="${SAGE}" stroke-width="2" fill="${PAPER}"/>` +
      person(70, 72, ACCENT, .55) +
      sparkle(70, 50, GOLD, .4) +
      `<text x="50" y="92" font-size="9.5" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">hiệu trưởng</text>`),

    'おたく': art(
      `<path d="M24 78 v-26 l26 -20 26 20 v26 z" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="42" y="60" width="16" height="18" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      sparkle(74, 30, GOLD, .5) +
      label2('nhà', GOLD, 'kính ngữ', GOLD, 13)),

    // ---------- bai 50: khiem nhuong ngu ----------
    'まいります': art(
      bow(38, 54, INK, .8) +
      arrowH(58, 60, 22, SAGE) +
      label2('đi, đến', INK, 'khiêm nhường', SAGE, 11)),

    'もうします': art(
      bow(36, 54, INK, .8) +
      `<path d="M58 30 h20 a3 3 0 0 1 3 3 v8 a3 3 0 0 1 -3 3 h-8 l-5 5 v-5 h-7 a3 3 0 0 1 -3 -3 v-8 a3 3 0 0 1 3 -3 z" stroke="${INK}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<path d="M63 38 h10" stroke="${INK}" stroke-width="1.8"/>` +
      label2('tên là', INK, 'khiêm nhường', SAGE, 11)),

    'もうしあげます': art(
      bow(36, 54, INK, .8) +
      `<path d="M58 28 h20 a3 3 0 0 1 3 3 v8 a3 3 0 0 1 -3 3 h-8 l-5 5 v-5 h-7 a3 3 0 0 1 -3 -3 v-8 a3 3 0 0 1 3 -3 z" stroke="${GOLD}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<path d="M74 24 v-8" stroke="${GOLD}" stroke-width="2"/><path d="M70 20 l4 -4 4 4" stroke="${GOLD}" stroke-width="2"/>` +
      label2('xin thưa', INK, 'khiêm nhường hơn', SAGE, 11)),

    'いたします': art(
      bow(46, 54, INK, .8) +
      `<path d="M64 58 q6 2 10 -2" stroke="${SAGE}" stroke-width="2"/>` +
      label2('làm', INK, 'khiêm nhường', SAGE, 12)),

    'はいけんします': art(
      bow(38, 52, INK, .8) +
      `<rect x="58" y="56" width="18" height="14" rx="2" stroke="${SAGE}" stroke-width="2.2" fill="${PAPER}"/><path d="M62 60 h10 M62 65 h6" stroke="${SAGE}" stroke-width="1.6"/>` +
      label2('xem', INK, 'khiêm nhường', SAGE, 12)),

    'ぞんじます': art(
      bow(38, 52, INK, .8) +
      cloud(72, 30, INK, .5) +
      `<circle cx="58" cy="46" r="2" fill="${INK}" stroke="none"/><circle cx="63" cy="40" r="2.6" fill="${INK}" stroke="none"/>` +
      label2('biết, nghĩ', INK, 'khiêm nhường', SAGE, 10)),

    'ごあんないいたします': art(
      bow(32, 54, INK, .8) +
      `<path d="M66 40 v34" stroke="${GOLD}" stroke-width="2.5"/><path d="M66 44 l16 -4 v8 z" fill="${GOLD}" stroke="none"/>` +
      label2('để tôi hướng dẫn', INK, 'khiêm nhường', SAGE, 8.5)),

    'あんない': art(
      `<path d="M50 20 v54" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M50 30 l22 -4 v10 z" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M50 44 l-22 -4 v10 z" fill="${SAGE}" stroke="none"/>` +
      `<path d="M36 82 h28" stroke="${INK}" stroke-width="3"/>` +
      `<text x="50" y="94" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">hướng dẫn</text>`),

    'おきゃくさま': art(
      pedestal(50, 80, 14, GOLD) +
      person(50, 56, GOLD, .8) +
      sparkle(76, 32, GOLD, .5) +
      `<rect x="24" y="66" width="12" height="10" rx="2" stroke="${GOLD}" stroke-width="2.2" fill="${PAPER}"/>` +
      label2('quý khách', GOLD, 'trang trọng', GOLD, 11)),

    'おれい': art(
      bow(34, 52, INK, .8) +
      giftBox(66, 58, 20, ACCENT) +
      `<path d="M66 38 q-4 -6 -8 -1 q-2 3 8 10 q10 -7 8 -10 q-4 -5 -8 1 z" fill="${ACCENT}" stroke="none"/>` +
      `<text x="50" y="92" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">lời cảm ơn</text>`),

    'しりょう': art(
      `<rect x="26" y="30" width="44" height="54" rx="2" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<rect x="32" y="24" width="44" height="54" rx="2" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M40 36 h28 M40 44 h28 M40 52 h20" stroke="${INK}" stroke-width="2"/>` +
      `<rect x="64" y="18" width="10" height="14" rx="2" stroke="${GOLD}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">tài liệu</text>`),
  };

  window.SenseiArt.extend(EXTRA);

  // Gan them dang kanji cho cac tu co kanji, tro ve cung mot hinh minh hoa.
  window.SenseiArt.extend({
    '味': EXTRA['あじ'],
    '興味': EXTRA['きょうみ'],
    '試験': EXTRA['しけん'],
    '合格します': EXTRA['ごうかくします'],
    '電話します': EXTRA['でんわします'],
    '本当': EXTRA['ほんとう'],
    '差し上げます': EXTRA['さしあげます'],
    '頂きます': EXTRA['いただきます'],
    '下さいます': EXTRA['くださいます'],
    '花見': EXTRA['はなみ'],
    '社長': EXTRA['しゃちょう'],
    '水': EXTRA['みず'],
    'お客さん': EXTRA['おきゃくさん'],
    '有難い': EXTRA['ありがたい'],
    '貯めます': EXTRA['ためます'],
    '役に立ちます': EXTRA['やくにたちます'],
    '留学します': EXTRA['りゅうがくします'],
    '道具': EXTRA['どうぐ'],
    'お金持ち': EXTRA['おかねもち'],
    '鋏': EXTRA['はさみ'],
    '切ります': EXTRA['きります'],
    '倒れます': EXTRA['たおれます'],
    '泣きます': EXTRA['なきます'],
    '落ちます': EXTRA['おちます'],
    '眠い': EXTRA['ねむい'],
    '苦い': EXTRA['にがい'],
    '雲': EXTRA['くも'],
    '歩きます': EXTRA['あるきます'],
    '字': EXTRA['じ'],
    '失敗します': EXTRA['しっぱいします'],
    '場合': EXTRA['ばあい'],
    '地震': EXTRA['じしん'],
    '火事': EXTRA['かじ'],
    '一生懸命': EXTRA['いっしょうけんめい'],
    '着きます': EXTRA['つきます'],
    '丁度': EXTRA['ちょうど'],
    '引っ越します': EXTRA['ひっこします'],
    '病気です': EXTRA['びょうきです'],
    '元気です': EXTRA['げんきです'],
    '天気予報': EXTRA['てんきよほう'],
    '噂': EXTRA['うわさ'],
    '幸せ': EXTRA['しあわせ'],
    '行かせます': EXTRA['いかせます'],
    '食べさせます': EXTRA['たべさせます'],
    '来させます': EXTRA['こさせます'],
    '手伝わせます': EXTRA['てつだわせます'],
    '片付けさせます': EXTRA['かたづけさせます'],
    '休ませます': EXTRA['やすませます'],
    '勉強させます': EXTRA['べんきょうさせます'],
    '運動させます': EXTRA['うんどうさせます'],
    '親': EXTRA['おや'],
    '気持ち': EXTRA['きもち'],
    '召し上がります': EXTRA['めしあがります'],
    'ご覧になります': EXTRA['ごらんになります'],
    'お読みになります': EXTRA['およみになります'],
    'お書きになります': EXTRA['おかきになります'],
    '部長': EXTRA['ぶちょう'],
    '課長': EXTRA['かちょう'],
    '校長': EXTRA['こうちょう'],
    'お宅': EXTRA['おたく'],
    '参ります': EXTRA['まいります'],
    '申します': EXTRA['もうします'],
    '申し上げます': EXTRA['もうしあげます'],
    '致します': EXTRA['いたします'],
    '拝見します': EXTRA['はいけんします'],
    '存じます': EXTRA['ぞんじます'],
    'ご案内いたします': EXTRA['ごあんないいたします'],
    '案内': EXTRA['あんない'],
    'お客様': EXTRA['おきゃくさま'],
    'お礼': EXTRA['おれい'],
    '資料': EXTRA['しりょう'],
  });
})();
