/**
 * Sensei Art — lo minh hoa bo sung N5 (lo 5/5): bai 17-25.
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

  /** May: 3 vong tron chong len + day duoi phang, mo phong may bong. */
  function cloud(cx, cy, color, scale) {
    const s = scale || 1;
    return `<circle cx="${cx - 14 * s}" cy="${cy}" r="${9 * s}" fill="${PAPER}" stroke="${color}" stroke-width="${3 * s}"/>` +
           `<circle cx="${cx}" cy="${cy - 6 * s}" r="${12 * s}" fill="${PAPER}" stroke="${color}" stroke-width="${3 * s}"/>` +
           `<circle cx="${cx + 14 * s}" cy="${cy}" r="${9 * s}" fill="${PAPER}" stroke="${color}" stroke-width="${3 * s}"/>` +
           `<rect x="${cx - 22 * s}" y="${cy}" width="${44 * s}" height="${10 * s}" rx="${5 * s}" fill="${PAPER}" stroke="${color}" stroke-width="${3 * s}"/>`;
  }

  /** Bong noi thoai hinh chu nhat bo goc, co duoi tro xuong ben trai. */
  function bubble(x, y, w, h, color) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" stroke="${color}" stroke-width="3" fill="${PAPER}"/>` +
           `<path d="M${x + 14} ${y + h} l-8 9 v-9 z" fill="${PAPER}" stroke="${color}" stroke-width="3"/>`;
  }

  /** Bat com: vanh + long bat, co com (empty=true thi bat rong). */
  function bowl(cx, cy, color, empty) {
    const rice = empty ? '' :
      `<path d="M${cx - 11} ${cy - 1} a11 7 0 0 0 22 0 z" fill="${GOLD}" stroke="${color}" stroke-width="2"/>`;
    return `<path d="M${cx - 17} ${cy} a17 11 0 0 1 34 0 z" stroke="${color}" stroke-width="3" fill="${PAPER}"/>` +
           `<path d="M${cx - 17} ${cy} h34" stroke="${color}" stroke-width="3"/>` + rice;
  }

  const EXTRA = {
    // ---------- bai 17: giay to, lai xe, lo lang ----------
    'パスポート': art(
      `<rect x="25" y="16" width="50" height="66" rx="4" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="50" cy="38" r="11" stroke="${GOLD}" stroke-width="3"/>` +
      `<path d="M50 30 l3 8 h-6 z" fill="${GOLD}" stroke="none"/>` +
      `<path d="M34 58 h32 M34 66 h32 M34 74 h20" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<text x="50" y="94" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">hộ chiếu</text>`),

    'うんてん': art(
      `<circle cx="50" cy="44" r="26" stroke="${INK}" stroke-width="4"/>` +
      `<circle cx="50" cy="44" r="6" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M50 38 v-18 M35 55 L26 66 M65 55 L74 66" stroke="${INK}" stroke-width="4"/>` +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">lái xe</text>`),

    'めんきょ': art(
      `<rect x="12" y="30" width="76" height="46" rx="5" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="30" cy="53" r="11" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M24 60 a7 6 0 0 1 12 0" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M48 42 h30 M48 50 h30 M48 58 h20" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<path d="M70 68 l4 5 8 -9" stroke="${GOLD}" stroke-width="3"/>` +
      `<text x="50" y="90" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">bằng lái</text>`),

    'しんぱい': art(
      person(50, 52, INK, 1) +
      `<path d="M43 31 q3 -4 6 -1 M51 30 q3 -4 6 -1" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M62 26 q6 5 1 13 q-5 -2 -3 -8 z" fill="${ACCENT}" stroke="${ACCENT}" stroke-width="1"/>` +
      `<text x="50" y="92" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">lo lắng</text>`),

    // ---------- bai 18: so thich, giai tri ----------
    'うたいます': art(
      person(38, 54, INK, 1) +
      `<ellipse cx="38" cy="40" rx="3" ry="4" fill="${ACCENT}" stroke="none"/>` +
      `<circle cx="66" cy="30" r="4" fill="${SAGE}" stroke="none"/>` +
      `<path d="M70 30 v-16 l8 -3" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<circle cx="78" cy="42" r="3.4" fill="${GOLD}" stroke="none"/>` +
      `<path d="M81 42 v-14" stroke="${GOLD}" stroke-width="2.2"/>` +
      `<text x="50" y="92" font-size="12" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">hát</text>`),

    'ひきます': art(
      `<rect x="14" y="50" width="72" height="26" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M26 50 v26 M38 50 v26 M50 50 v26 M62 50 v26 M74 50 v26" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M32 50 v14 M44 50 v14 M68 50 v14" stroke="${INK}" stroke-width="6"/>` +
      `<path d="M30 42 q6 -10 14 -2 M56 42 q6 -10 14 -2" stroke="${ACCENT}" stroke-width="3"/>` +
      `<text x="50" y="92" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">chơi đàn</text>`),

    'うんてんします': art(
      `<path d="M14 64 h72 v-10 a4 4 0 0 0 -4 -4 h-8 l-6 -12 a5 5 0 0 0 -4 -2 h-28 a5 5 0 0 0 -4 2 l-6 12 h-8 a4 4 0 0 0 -4 4 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M34 48 h32 l4 8 h-40 z" stroke="${INK}" stroke-width="2" fill="${PAPER}"/>` +
      `<circle cx="30" cy="66" r="7" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="70" cy="66" r="7" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="50" cy="56" r="5" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M50 51 v-3" stroke="${ACCENT}" stroke-width="2"/>` +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">lái xe</text>`),

    'さんぽします': art(
      person(34, 52, INK, .9) +
      `<path d="M14 60 l8 -4 M14 68 l10 -4" stroke="${INK}" stroke-width="2" opacity="0.5"/>` +
      `<path d="M52 78 q8 -8 18 -2 q10 6 20 -4" stroke="${SAGE}" stroke-width="2.5" stroke-dasharray="1 6"/>` +
      `<text x="50" y="92" font-size="11" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">đi dạo</text>`),

    'しゅみ': art(
      `<path d="M50 34 q-14 -18 -28 -4 q-10 12 28 40 q38 -28 28 -40 q-14 -14 -28 4 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 44 l3.5 7.5 8 1 -6 6 1.5 8 -7 -4 -7 4 1.5 -8 -6 -6 8 -1 z" fill="${GOLD}" stroke="${GOLD}" stroke-width="1"/>` +
      `<text x="50" y="88" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">sở thích</text>`),

    'ピアノ': art(
      `<rect x="16" y="20" width="68" height="18" rx="2" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="16" y="38" width="68" height="30" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M22 44 v18 M30 44 v18 M38 44 v18 M46 44 v18 M54 44 v18 M62 44 v18 M70 44 v18 M78 44 v18" stroke="${INK}" stroke-width="1.6"/>` +
      `<path d="M26 44 v11 M34 44 v11 M50 44 v11 M58 44 v11 M74 44 v11" stroke="${INK}" stroke-width="4"/>` +
      `<path d="M16 68 h68 v10 h-68 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">đàn piano</text>`),

    'おふろ': art(
      `<path d="M16 54 h68 v10 a14 14 0 0 1 -14 14 h-40 a14 14 0 0 1 -14 -14 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M12 54 a4 4 0 0 1 4 -4 h68 a4 4 0 0 1 4 4" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M24 46 q4 -8 0 -14 M40 46 q4 -8 0 -14 M56 46 q4 -8 0 -14" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<path d="M22 60 q4 4 8 0 q4 -4 8 0 q4 4 8 0 q4 -4 8 0 q4 4 8 0" stroke="${GOLD}" stroke-width="2"/>` +
      `<text x="50" y="90" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">bồn tắm</text>`),

    'さんぽ': art(
      `<circle cx="76" cy="30" r="12" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M76 42 v14" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M18 82 q14 -10 28 -4 q14 6 28 -4 q10 -6 18 0" stroke="${GOLD}" stroke-width="2.5" stroke-dasharray="1 6"/>` +
      `<ellipse cx="24" cy="70" rx="3" ry="5" fill="${INK}" stroke="none" transform="rotate(-15 24 70)"/>` +
      `<ellipse cx="34" cy="76" rx="3" ry="5" fill="${INK}" stroke="none" transform="rotate(15 34 76)"/>` +
      `<text x="50" y="94" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">việc đi dạo</text>`),

    'すこし': art(
      `<path d="M34 34 h32 l-4 40 a4 4 0 0 1 -4 4 h-16 a4 4 0 0 1 -4 -4 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M38 66 h24 l-1.5 10 a3 3 0 0 1 -3 3 h-15 a3 3 0 0 1 -3 -3 z" fill="${GOLD}" stroke="none"/>` +
      `<path d="M30 34 h40" stroke="${INK}" stroke-width="3"/>` +
      `<text x="50" y="92" font-size="10" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">một chút</text>`),

    // ---------- bai 19: du lich, trai nghiem ----------
    'のぼります': art(
      `<path d="M10 78 L38 30 L52 52 L64 20 L90 78 Z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M58 32 l6 -12 6 12 z" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>` +
      person(38, 62, ACCENT, .55) +
      `<path d="M64 22 l10 -4 v6 z" fill="${ACCENT}" stroke="none"/>` +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">leo núi</text>`),

    'なります': art(
      `<circle cx="26" cy="50" r="14" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M46 50 h20" stroke="${GOLD}" stroke-width="3"/>` +
      `<path d="M62 44 l8 6 -8 6" stroke="${GOLD}" stroke-width="3"/>` +
      `<path d="M90 50 l-8 -13 -8 13 8 13 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<text x="50" y="90" font-size="11" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">trở thành</text>`),

    'かいものします': art(
      person(42, 46, INK, .95) +
      `<path d="M56 52 h20 l-3 22 h-14 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M60 52 v-6 a6 6 0 0 1 12 0 v6" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M62 60 h12" stroke="${GOLD}" stroke-width="2"/>` +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">mua sắm</text>`),

    'りゅうがくせい': art(
      person(38, 52, INK, .9) +
      `<path d="M26 34 l12 -6 12 6 -12 6 z" fill="${INK}" stroke="none"/>` +
      `<path d="M38 40 v6" stroke="${INK}" stroke-width="2"/>` +
      `<circle cx="72" cy="34" r="14" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M58 34 h28 M72 20 a18 14 0 0 1 0 28 a18 14 0 0 1 0 -28" stroke="${SAGE}" stroke-width="2"/>` +
      `<text x="50" y="92" font-size="9.5" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">du học sinh</text>`),

    'ふじさん': art(
      `<path d="M8 78 L40 24 L50 38 L60 24 L92 78 Z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 24 L46 40 L36 40 Z M60 24 L54 40 L64 40 Z" fill="${PAPER}" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M20 78 q30 -10 60 0" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="9.5" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">núi Phú Sĩ</text>`),

    'きょうと': art(
      `<path d="M16 34 h68 M16 24 h68" stroke="${ACCENT}" stroke-width="5"/>` +
      `<path d="M28 24 v54 M72 24 v54" stroke="${ACCENT}" stroke-width="5"/>` +
      `<path d="M50 34 v20" stroke="${ACCENT}" stroke-width="4"/>` +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">Kyoto</text>`),

    'おてら': art(
      `<path d="M20 44 h60 M14 54 h72 M26 64 h48" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M50 20 l16 20 h-32 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 34 l20 16 h-40 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 8 v10" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<rect x="42" y="64" width="16" height="16" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<text x="50" y="94" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">ngôi chùa</text>`),

    'いちど': art(
      `<circle cx="50" cy="42" r="26" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<text x="50" y="54" font-size="30" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">1</text>` +
      `<text x="50" y="90" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">một lần</text>`),

    'けいけん': art(
      `<path d="M12 78 q20 -6 30 -22 q10 -16 30 -22 q10 -3 16 -10" stroke="${SAGE}" stroke-width="2.5" stroke-dasharray="1 6"/>` +
      `<ellipse cx="18" cy="72" rx="3" ry="5" fill="${INK}" stroke="none" transform="rotate(-30 18 72)"/>` +
      `<ellipse cx="28" cy="60" rx="3" ry="5" fill="${INK}" stroke="none" transform="rotate(-40 28 60)"/>` +
      `<ellipse cx="42" cy="46" rx="3" ry="5" fill="${INK}" stroke="none" transform="rotate(-50 42 46)"/>` +
      `<path d="M80 16 l3.5 7.5 8 1 -6 6 1.5 8 -7 -4 -7 4 1.5 -8 -6 -6 8 -1 z" fill="${GOLD}" stroke="${GOLD}" stroke-width="1"/>` +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">kinh nghiệm</text>`),

    // ---------- bai 20: an (the thong thuong) va gia dinh ----------
    'たべる': art(
      person(34, 56, INK, .85) +
      bowl(64, 66, ACCENT) +
      `<path d="M68 54 l10 -14 M74 54 l10 -14" stroke="${INK}" stroke-width="2"/>` +
      `<text x="50" y="92" font-size="12" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">ăn</text>`),

    'たべない': art(
      bowl(50, 58, INK) +
      `<path d="M32 40 L68 76 M68 40 L32 76" stroke="${ACCENT}" stroke-width="5"/>` +
      `<text x="50" y="92" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">không ăn</text>`),

    'たべた': art(
      bowl(50, 60, INK, true) +
      `<path d="M36 50 l26 -2" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M66 28 l6 8 12 -14" stroke="${SAGE}" stroke-width="4"/>` +
      `<text x="50" y="92" font-size="11" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">đã ăn</text>`),

    'たべなかった': art(
      bowl(42, 62, INK) +
      `<path d="M26 46 L58 78 M58 46 L26 78" stroke="${ACCENT}" stroke-width="4"/>` +
      `<circle cx="76" cy="34" r="13" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M76 26 v9 l7 5" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="9.5" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">đã không ăn</text>`),

    'かぞく': art(
      `<path d="M14 26 q36 -20 72 0" stroke="${GOLD}" stroke-width="2.5" stroke-dasharray="2 5"/>` +
      person(28, 58, INK, .68) + person(50, 52, ACCENT, .8) + person(72, 60, SAGE, .55) +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">gia đình</text>`),

    'りょうしん': art(
      person(36, 50, INK, .9) + person(64, 50, ACCENT, .9) +
      `<path d="M46 66 h8" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">cha mẹ</text>`),

    'ちち': art(
      person(50, 52, INK, 1) +
      `<path d="M50 44 l-5 8 5 20 5 -20 z" fill="${ACCENT}" stroke="none"/>` +
      `<text x="50" y="92" font-size="12" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">cha</text>`),

    'はは': art(
      person(50, 52, INK, 1) +
      `<path d="M38 24 l-8 -6 3 9 z M62 24 l8 -6 -3 9 z" fill="${ACCENT}" stroke="none"/>` +
      `<circle cx="50" cy="24" r="2.5" fill="${ACCENT}" stroke="none"/>` +
      `<text x="50" y="92" font-size="12" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">mẹ</text>`),

    'おとうさん': art(
      person(46, 52, INK, 1) +
      `<path d="M46 44 l-5 8 5 20 5 -20 z" fill="${ACCENT}" stroke="none"/>` +
      `<circle cx="41" cy="35" r="4.5" stroke="${GOLD}" stroke-width="2"/>` +
      `<circle cx="51" cy="35" r="4.5" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M45.5 35 h1" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M76 26 a10 10 0 1 1 -6 18 l-6 5 1 -7 a10 10 0 0 1 11 -16 z" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<text x="78" y="38" font-size="12" fill="${SAGE}" font-weight="800" text-anchor="middle" stroke="none">!</text>` +
      `<text x="50" y="92" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">bố ơi!</text>`),

    'おかあさん': art(
      person(46, 52, INK, 1) +
      `<path d="M34 24 l-8 -6 3 9 z M58 24 l8 -6 -3 9 z" fill="${ACCENT}" stroke="none"/>` +
      `<circle cx="46" cy="24" r="2.5" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M76 26 a10 10 0 1 1 -6 18 l-6 5 1 -7 a10 10 0 0 1 11 -16 z" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<text x="78" y="38" font-size="12" fill="${SAGE}" font-weight="800" text-anchor="middle" stroke="none">!</text>` +
      `<text x="50" y="92" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">mẹ ơi!</text>`),

    'きょうだい': art(
      person(38, 60, ACCENT, .62) + person(62, 54, SAGE, .8) +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">anh chị em</text>`),

    'あに': art(
      person(50, 50, INK, .95) +
      `<path d="M39 26 l3 -8 M46 24 l1 -9 M54 24 l-1 -9 M61 26 l-3 -8" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">anh trai</text>`),

    'あね': art(
      person(50, 50, INK, .95) +
      `<path d="M60 28 q14 2 10 20 q-2 8 -8 6" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">chị gái</text>`),

    'おとうと': art(
      person(50, 58, SAGE, .62) +
      `<path d="M43 44 a7 7 0 0 1 14 0 z" fill="${SAGE}" stroke="none"/>` +
      `<path d="M42 44.5 h16" stroke="${SAGE}" stroke-width="2"/>` +
      `<text x="50" y="92" font-size="11" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">em trai</text>`),

    'いもうと': art(
      person(50, 58, ACCENT, .62) +
      `<circle cx="40" cy="46" r="3" fill="${ACCENT}" stroke="none"/>` +
      `<circle cx="60" cy="46" r="3" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M40 46 q-6 4 -2 10 M60 46 q6 4 2 10" stroke="${ACCENT}" stroke-width="2"/>` +
      `<text x="50" y="92" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">em gái</text>`),

    'おにいさん': art(
      person(46, 50, INK, 1) +
      `<path d="M35 26 l3 -8 M42 24 l1 -9 M50 24 l-1 -9 M57 26 l-3 -8" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<path d="M76 26 a10 10 0 1 1 -6 18 l-6 5 1 -7 a10 10 0 0 1 11 -16 z" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<text x="78" y="38" font-size="12" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">!</text>` +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">anh ơi!</text>`),

    'おねえさん': art(
      person(46, 50, INK, 1) +
      `<path d="M56 28 q14 2 10 20 q-2 8 -8 6" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M76 26 a10 10 0 1 1 -6 18 l-6 5 1 -7 a10 10 0 0 1 11 -16 z" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<text x="78" y="38" font-size="12" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">!</text>` +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">chị ơi!</text>`),

    // ---------- bai 21: nghi / noi, thoi tiet, trang thai phan doan ----------
    'おもいます': art(
      person(32, 58, INK, .85) +
      cloud(70, 32, SAGE, .6) +
      `<path d="M62 46 l5 -5 M60 52 l4 -3" stroke="${SAGE}" stroke-width="2"/>` +
      `<path d="M62 30 q4 -3 8 0 q4 3 8 0" stroke="${INK}" stroke-width="2"/>` +
      `<text x="50" y="92" font-size="10" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">nghĩ rằng</text>`),

    'いいます': art(
      person(32, 58, INK, .85) +
      bubble(52, 18, 34, 22, ACCENT) +
      `<path d="M60 26 h18 M60 33 h12" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="12" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">nói</text>`),

    'かんがえます': art(
      person(32, 58, INK, .85) +
      `<path d="M42 56 q6 4 4 10" stroke="${INK}" stroke-width="2.5"/>` +
      cloud(70, 32, GOLD, .6) +
      `<circle cx="70" cy="32" r="6" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M70 24 v3 M70 37 v3 M62 32 h3 M75 32 h3 M64.5 26.5 l2 2 M75.5 26.5 l-2 2 M64.5 37.5 l2 -2 M75.5 37.5 l-2 -2" stroke="${GOLD}" stroke-width="1.6"/>` +
      `<text x="50" y="92" font-size="9.5" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">suy nghĩ</text>`),

    'てんき': art(
      `<circle cx="34" cy="34" r="14" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M34 12 v6 M34 50 v6 M12 34 h6 M56 34 h6 M18 18 l4 4 M46 46 l4 4 M46 18 l-4 4 M18 46 l4 -4" stroke="${GOLD}" stroke-width="2.5"/>` +
      cloud(62, 58, INK, .8) +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">thời tiết</text>`),

    'あめ': art(
      cloud(50, 38, INK, 1) +
      `<path d="M32 60 l-3 8 M46 60 l-3 8 M60 60 l-3 8 M74 60 l-3 8" stroke="${SAGE}" stroke-width="3"/>` +
      `<text x="50" y="92" font-size="12" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">mưa</text>`),

    'ゆき': art(
      cloud(50, 36, INK, 1) +
      `<path d="M32 62 v10 M27 67 h10 M24 64 l6 6 M34 64 l-6 6" stroke="${SAGE}" stroke-width="1.8"/>` +
      `<path d="M68 62 v10 M63 67 h10 M60 64 l6 6 M70 64 l-6 6" stroke="${SAGE}" stroke-width="1.8"/>` +
      `<text x="50" y="92" font-size="12" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">tuyết</text>`),

    'たいふう': art(
      `<path d="M50 50 m-24 0 a24 24 0 1 1 24 24" stroke="${SAGE}" stroke-width="4"/>` +
      `<path d="M50 50 m-14 0 a14 14 0 1 1 14 14" stroke="${SAGE}" stroke-width="3.5"/>` +
      `<path d="M50 50 m-6 0 a6 6 0 1 1 6 6" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M14 30 q4 -6 10 -4 M82 68 q-4 6 -10 4" stroke="${INK}" stroke-width="2" opacity=".6"/>` +
      `<text x="50" y="92" font-size="11" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">bão</text>`),

    'ニュース': art(
      `<rect x="20" y="34" width="60" height="40" rx="4" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M38 34 l6 -14 M62 34 l-6 -14" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M30 46 h24 M30 54 h32 M30 62 h20" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<circle cx="68" cy="54" r="6" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">tin tức</text>`),

    'たいせつ': art(
      `<path d="M50 46 q-8 -12 -18 -4 q-7 8 18 26 q25 -18 18 -26 q-10 -8 -18 4 z" fill="${PAPER}" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M14 66 q6 10 20 8 M86 66 q-6 10 -20 8" stroke="${GOLD}" stroke-width="3"/>` +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">quan trọng</text>`),

    'たいへん': art(
      person(50, 56, INK, 1) +
      `<path d="M62 26 q6 5 1 13 q-5 -2 -3 -8 z" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M38 26 q-6 5 -1 13 q5 -2 3 -8 z" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M50 20 q6 4 1 11 q-5 -1 -3 -6 z" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M30 70 q-6 4 -12 2 M70 70 q6 4 12 2" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">vất vả</text>`),

    'たぶん': art(
      `<path d="M20 66 a30 30 0 0 1 60 0" stroke="${INK}" stroke-width="3" fill="none"/>` +
      `<path d="M20 66 h60" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M50 66 l-4 -26" stroke="${GOLD}" stroke-width="3"/>` +
      `<circle cx="50" cy="66" r="3.5" fill="${GOLD}" stroke="none"/>` +
      `<text x="50" y="90" font-size="10" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">có lẽ</text>`),

    'きっと': art(
      `<path d="M20 66 a30 30 0 0 1 60 0" stroke="${INK}" stroke-width="3" fill="none"/>` +
      `<path d="M20 66 h60" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M50 66 l20 -20" stroke="${ACCENT}" stroke-width="3.5"/>` +
      `<circle cx="50" cy="66" r="3.5" fill="${ACCENT}" stroke="none"/>` +
      `<text x="76" y="40" font-size="16" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">!</text>` +
      `<text x="50" y="90" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">chắc chắn</text>`),

    'でしょう': art(
      person(38, 58, INK, .85) +
      bubble(52, 18, 34, 22, GOLD) +
      `<text x="69" y="35" font-size="15" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      `<path d="M40 46 q4 -3 8 0" stroke="${INK}" stroke-width="2"/>` +
      `<text x="50" y="92" font-size="9.5" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">chắc là, nhỉ?</text>`),

    // ---------- bai 22: trang phuc, nha cua ----------
    'きます': art(
      person(50, 54, INK, 1) +
      `<path d="M38 46 v20 M62 46 v20 M38 46 q12 8 24 0" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M46 46 l4 6 4 -6" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">mặc áo</text>`),

    'かけます': art(
      person(50, 52, INK, 1) +
      `<circle cx="44" cy="36" r="6" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<circle cx="58" cy="36" r="6" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M50 36 h2 M38 36 h-5 M64 36 h5" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="10" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">đeo kính</text>`),

    'かぶります': art(
      person(50, 54, INK, 1) +
      `<path d="M36 34 a14 10 0 0 1 28 0 z" fill="${ACCENT}" stroke="${ACCENT}" stroke-width="1"/>` +
      `<path d="M32 34 h36" stroke="${ACCENT}" stroke-width="3"/>` +
      `<text x="50" y="92" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">đội mũ</text>`),

    'たてます': art(
      `<rect x="34" y="46" width="32" height="32" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M34 58 h32 M34 68 h32 M44 46 v32 M56 46 v32" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M50 46 v-24 M50 22 h24 M74 22 v10" stroke="${GOLD}" stroke-width="3"/>` +
      `<path d="M68 32 l6 -6 6 6" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="10" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">xây dựng</text>`),

    'めがね': art(
      `<circle cx="34" cy="50" r="15" stroke="${INK}" stroke-width="3.5"/>` +
      `<circle cx="66" cy="50" r="15" stroke="${INK}" stroke-width="3.5"/>` +
      `<path d="M49 48 q1 -4 2 0" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M19 48 l-8 -4 M81 48 l8 -4" stroke="${INK}" stroke-width="3"/>` +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">kính mắt</text>`),

    'ぼうし': art(
      `<path d="M22 60 a28 16 0 0 1 56 0 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M36 42 a14 12 0 0 1 28 0" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<text x="50" y="92" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">mũ, nón</text>`),

    'ふく': art(
      `<path d="M38 24 l-16 10 6 12 10 -6 v38 h24 v-38 l10 6 6 -12 -16 -10 q-4 6 -12 6 q-8 0 -12 -6 z" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<text x="50" y="92" font-size="11" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">quần áo</text>`),

    'ようふく': art(
      `<path d="M50 16 v6 l-16 8" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M34 30 h32" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M40 30 l-14 10 8 34 h32 l8 -34 -14 -10 q-6 8 -20 0 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<text x="50" y="92" font-size="9.5" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">trang phục Tây</text>`),

    'たてもの': art(
      `<rect x="24" y="18" width="52" height="60" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M32 30 h10 v10 h-10 z M46 30 h10 v10 h-10 z M60 30 h10 v10 h-10 z M32 48 h10 v10 h-10 z M46 48 h10 v10 h-10 z M60 48 h10 v10 h-10 z" stroke="${SAGE}" stroke-width="2"/>` +
      `<path d="M42 78 v-14 h16 v14" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">tòa nhà</text>`),

    'みせ': art(
      `<rect x="20" y="42" width="60" height="36" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M16 42 l6 -14 h56 l6 14 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M22 42 l4 -10 M32 42 l4 -10 M42 42 l2 -10 M58 42 l-2 -10 M68 42 l-4 -10 M78 42 l-4 -10" stroke="${ACCENT}" stroke-width="1.6"/>` +
      `<rect x="42" y="58" width="16" height="20" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">cửa hàng</text>`),

    'レストラン': art(
      `<circle cx="50" cy="52" r="28" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M34 26 v16 M38 26 v16 M42 26 v16 M38 42 v34" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M62 26 l6 10 v10 l-4 4 v22" stroke="${INK}" stroke-width="2.5"/>` +
      `<text x="50" y="94" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">nhà hàng</text>`),

    // ---------- bai 23: giao thong, duong pho ----------
    'おします': art(
      `<circle cx="50" cy="54" r="22" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="50" cy="54" r="12" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 14 v18" stroke="${INK}" stroke-width="5"/>` +
      `<path d="M42 20 l8 -8 8 8" stroke="${INK}" stroke-width="3"/>` +
      `<text x="50" y="92" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">ấn, nhấn</text>`),

    'わたります': art(
      `<path d="M18 66 v18 M32 66 v18 M46 66 v18 M60 66 v18 M74 66 v18" stroke="${INK}" stroke-width="6"/>` +
      person(50, 46, ACCENT, .85) +
      `<path d="M30 44 l14 4 M74 44 l-14 4" stroke="${SAGE}" stroke-width="2" opacity=".7"/>` +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">băng qua</text>`),

    'まがります': art(
      `<path d="M20 26 v34 a20 20 0 0 0 20 20 h34" stroke="${SAGE}" stroke-width="5"/>` +
      `<path d="M64 70 l12 10 -14 8 z" fill="${SAGE}" stroke="none"/>` +
      `<text x="50" y="92" font-size="10" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">rẽ, quẹo</text>`),

    'あきます': art(
      `<rect x="16" y="20" width="68" height="54" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M20 24 v46 h20 v-46 z" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M60 24 v46 h20 v-46 z" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M14 47 h-6 M92 47 h6" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M32 47 h-8 M60 47 h8" stroke="${GOLD}" stroke-width="2" opacity=".7"/>` +
      `<text x="50" y="90" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">tự mở ra</text>`),

    'ボタン': art(
      `<circle cx="50" cy="52" r="24" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="50" cy="52" r="14" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="50" cy="52" r="4" fill="${ACCENT}" stroke="none"/>` +
      `<text x="50" y="90" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">cái nút</text>`),

    'みぎ': art(
      `<path d="M16 50 h52" stroke="${SAGE}" stroke-width="6"/>` +
      `<path d="M56 32 l22 18 -22 18 z" fill="${SAGE}" stroke="none"/>` +
      `<text x="50" y="88" font-size="12" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">bên phải</text>`),

    'ひだり': art(
      `<path d="M32 50 h52" stroke="${ACCENT}" stroke-width="6"/>` +
      `<path d="M44 32 l-22 18 22 18 z" fill="${ACCENT}" stroke="none"/>` +
      `<text x="50" y="88" font-size="12" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">bên trái</text>`),

    'しんごう': art(
      `<rect x="38" y="12" width="24" height="56" rx="8" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="50" cy="26" r="6" fill="${ACCENT}" stroke="none"/>` +
      `<circle cx="50" cy="40" r="6" fill="${GOLD}" stroke="none"/>` +
      `<circle cx="50" cy="54" r="6" fill="${SAGE}" stroke="none"/>` +
      `<path d="M50 68 v14" stroke="${INK}" stroke-width="3"/>` +
      `<text x="50" y="92" font-size="9" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">đèn tín hiệu</text>`),

    'こども': art(
      person(42, 58, ACCENT, .65) +
      `<circle cx="70" cy="34" r="10" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M70 44 q-2 6 2 8" stroke="${GOLD}" stroke-width="2"/>` +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">trẻ con</text>`),

    'ひま': art(
      person(38, 56, SAGE, .9) +
      `<path d="M28 60 q-8 4 -4 12" stroke="${SAGE}" stroke-width="2"/>` +
      `<circle cx="72" cy="36" r="13" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M72 29 v8 l6 4" stroke="${GOLD}" stroke-width="2.2"/>` +
      `<text x="86" y="30" font-size="10" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">~</text>` +
      `<text x="50" y="92" font-size="11" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">rảnh rỗi</text>`),

    // ---------- bai 24: nho giup, hanh ly, con duong ----------
    'くれます': art(
      person(26, 54, SAGE, .8) + person(70, 54, INK, .85) +
      `<rect x="42" y="46" width="16" height="12" rx="2" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M50 46 v-4 M46 42 h8" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M40 52 h-8 M60 52 h8" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M64 52 l8 -4 -2 6 z" fill="${ACCENT}" stroke="none"/>` +
      `<text x="50" y="92" font-size="9.5" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">cho (mình)</text>`),

    'あらいます': art(
      `<path d="M26 50 a24 20 0 0 0 48 0" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M22 50 h56" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="36" cy="60" r="3" stroke="${SAGE}" stroke-width="2"/>` +
      `<circle cx="48" cy="64" r="4" stroke="${SAGE}" stroke-width="2"/>` +
      `<circle cx="62" cy="59" r="2.5" stroke="${SAGE}" stroke-width="2"/>` +
      `<path d="M34 34 l-3 8 M50 30 l-3 8 M66 34 l-3 8" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<text x="50" y="90" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">rửa, giặt</text>`),

    'にもつ': art(
      `<rect x="24" y="34" width="52" height="40" rx="5" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 34 v-8 a4 4 0 0 1 4 -4 h12 a4 4 0 0 1 4 4 v8" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M24 50 h52" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M46 34 v40" stroke="${ACCENT}" stroke-width="2"/>` +
      `<text x="50" y="90" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">hành lý</text>`),

    'おもい': art(
      `<path d="M22 50 h56" stroke="${INK}" stroke-width="5"/>` +
      `<rect x="12" y="38" width="14" height="24" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="74" y="38" width="14" height="24" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 74 q10 6 20 0" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<text x="50" y="90" font-size="12" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">nặng</text>`),

    'みち': art(
      `<path d="M38 12 L14 82 M62 12 L86 82" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M50 20 v10 M50 38 v10 M50 56 v10 M50 74 v6" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">con đường</text>`),

    'たすかります': art(
      person(60, 58, INK, .9) +
      `<path d="M30 30 q-10 10 -6 24" stroke="${SAGE}" stroke-width="4"/>` +
      `<path d="M24 54 v-8 M30 50 v-10 M36 50 v-8" stroke="${SAGE}" stroke-width="3.5"/>` +
      `<path d="M74 34 q6 4 2 12" stroke="${GOLD}" stroke-width="2.2"/>` +
      `<text x="50" y="92" font-size="9.5" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">được giúp đỡ</text>`),

    'ほんとうに': art(
      `<path d="M50 32 q-10 -14 -22 -4 q-8 8 22 32 q30 -24 22 -32 q-12 -10 -22 4 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 30 l7 8 13 -14" stroke="${SAGE}" stroke-width="4"/>` +
      `<text x="50" y="88" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">thật sự</text>`),

    // ---------- bai 25: suc khoe, du lich, no luc ----------
    'つかれます': art(
      person(50, 58, INK, .95) +
      `<path d="M44 41 q3 3 0 5 M56 41 q-3 3 0 5" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M64 30 q6 5 1 13 q-5 -2 -3 -8 z" fill="${SAGE}" stroke="none"/>` +
      `<path d="M36 72 q14 8 28 0" stroke="${GOLD}" stroke-width="2" opacity=".7"/>` +
      `<text x="50" y="92" font-size="11" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">mệt mỏi</text>`),

    'りょこうします': art(
      person(34, 56, INK, .85) +
      `<rect x="46" y="62" width="18" height="14" rx="2" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M52 62 v-5 a3 3 0 0 1 6 0 v5" stroke="${ACCENT}" stroke-width="2"/>` +
      `<path d="M76 24 a10 10 0 0 1 10 10 q0 8 -10 20 q-10 -12 -10 -20 a10 10 0 0 1 10 -10 z" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<circle cx="76" cy="34" r="3.5" stroke="${GOLD}" stroke-width="2"/>` +
      `<text x="50" y="92" font-size="10" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">đi du lịch</text>`),

    'がんばります': art(
      person(50, 60, INK, 1) +
      `<path d="M62 50 q14 -4 12 -18" stroke="${ACCENT}" stroke-width="6"/>` +
      `<path d="M68 34 a8 8 0 1 1 6 8" stroke="${ACCENT}" stroke-width="5"/>` +
      `<path d="M84 20 l4 -6 M90 26 l6 -2 M86 32 l4 6" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">cố gắng</text>`),

    'おかね': art(
      `<circle cx="38" cy="58" r="18" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="62" cy="46" r="18" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<text x="62" y="52" font-size="16" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">¥</text>` +
      `<text x="50" y="92" font-size="12" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">tiền</text>`),

    'ぜんぶ': art(
      `<path d="M34 30 h32 l-3 44 a4 4 0 0 1 -4 4 h-18 a4 4 0 0 1 -4 -4 z" fill="${SAGE}" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M30 30 h40" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M40 50 l6 6 12 -14" stroke="${PAPER}" stroke-width="4"/>` +
      `<text x="50" y="92" font-size="11" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">tất cả</text>`),
  };

  window.SenseiArt.extend(EXTRA);

  // Gan them dang kanji cho cac tu co kanji, tro ve cung mot hinh minh hoa.
  window.SenseiArt.extend({
    '運転': EXTRA['うんてん'],
    '免許': EXTRA['めんきょ'],
    '心配': EXTRA['しんぱい'],
    '歌います': EXTRA['うたいます'],
    '弾きます': EXTRA['ひきます'],
    '運転します': EXTRA['うんてんします'],
    '散歩します': EXTRA['さんぽします'],
    '趣味': EXTRA['しゅみ'],
    'お風呂': EXTRA['おふろ'],
    '散歩': EXTRA['さんぽ'],
    '少し': EXTRA['すこし'],
    '登ります': EXTRA['のぼります'],
    '成ります': EXTRA['なります'],
    '買い物します': EXTRA['かいものします'],
    '留学生': EXTRA['りゅうがくせい'],
    '富士山': EXTRA['ふじさん'],
    '京都': EXTRA['きょうと'],
    'お寺': EXTRA['おてら'],
    '一度': EXTRA['いちど'],
    '経験': EXTRA['けいけん'],
    '食べる': EXTRA['たべる'],
    '食べない': EXTRA['たべない'],
    '食べた': EXTRA['たべた'],
    '食べなかった': EXTRA['たべなかった'],
    '家族': EXTRA['かぞく'],
    '両親': EXTRA['りょうしん'],
    '父': EXTRA['ちち'],
    '母': EXTRA['はは'],
    'お父さん': EXTRA['おとうさん'],
    'お母さん': EXTRA['おかあさん'],
    '兄弟': EXTRA['きょうだい'],
    '兄': EXTRA['あに'],
    '姉': EXTRA['あね'],
    '弟': EXTRA['おとうと'],
    '妹': EXTRA['いもうと'],
    'お兄さん': EXTRA['おにいさん'],
    'お姉さん': EXTRA['おねえさん'],
    '思います': EXTRA['おもいます'],
    '言います': EXTRA['いいます'],
    '考えます': EXTRA['かんがえます'],
    '天気': EXTRA['てんき'],
    '雨': EXTRA['あめ'],
    '雪': EXTRA['ゆき'],
    '台風': EXTRA['たいふう'],
    '大切': EXTRA['たいせつ'],
    '大変': EXTRA['たいへん'],
    '多分': EXTRA['たぶん'],
    '着ます': EXTRA['きます'],
    '掛けます': EXTRA['かけます'],
    '被ります': EXTRA['かぶります'],
    '建てます': EXTRA['たてます'],
    '眼鏡': EXTRA['めがね'],
    '帽子': EXTRA['ぼうし'],
    '服': EXTRA['ふく'],
    '洋服': EXTRA['ようふく'],
    '建物': EXTRA['たてもの'],
    '店': EXTRA['みせ'],
    '押します': EXTRA['おします'],
    '渡ります': EXTRA['わたります'],
    '曲がります': EXTRA['まがります'],
    '開きます': EXTRA['あきます'],
    '右': EXTRA['みぎ'],
    '左': EXTRA['ひだり'],
    '信号': EXTRA['しんごう'],
    '子供': EXTRA['こども'],
    '暇': EXTRA['ひま'],
    '呉れます': EXTRA['くれます'],
    '洗います': EXTRA['あらいます'],
    '荷物': EXTRA['にもつ'],
    '重い': EXTRA['おもい'],
    '道': EXTRA['みち'],
    '助かります': EXTRA['たすかります'],
    '本当に': EXTRA['ほんとうに'],
    '疲れます': EXTRA['つかれます'],
    '旅行します': EXTRA['りょこうします'],
    '頑張ります': EXTRA['がんばります'],
    'お金': EXTRA['おかね'],
    '全部': EXTRA['ぜんぶ'],
  });
})();
