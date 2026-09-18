/**
 * Sensei Art — lo minh hoa bo sung N5 (lo 4/5): bai 11-17, 85 tu.
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

  /** Trai tim don gian, dung lam bieu tuong tinh cam / suc khoe */
  function heart(cx, cy, r, color, fill) {
    fill = fill || 'none';
    const d = `M ${cx} ${cy + r * 0.75} ` +
              `C ${cx - r * 1.4} ${cy - r * 0.2}, ${cx - r * 0.6} ${cy - r * 1.3}, ${cx} ${cy - r * 0.5} ` +
              `C ${cx + r * 0.6} ${cy - r * 1.3}, ${cx + r * 1.4} ${cy - r * 0.2}, ${cx} ${cy + r * 0.75} Z`;
    return `<path d="${d}" stroke="${color}" stroke-width="2.5" fill="${fill}"/>`;
  }

  /** Vong tron + tia nang, dung cho mat troi / bieu tuong toa sang */
  function sunburst(cx, cy, r, color, count) {
    count = count || 8;
    let rays = '';
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 / count) * i;
      const x1 = (cx + Math.cos(a) * (r + 3)).toFixed(1);
      const y1 = (cy + Math.sin(a) * (r + 3)).toFixed(1);
      const x2 = (cx + Math.cos(a) * (r + 9)).toFixed(1);
      const y2 = (cy + Math.sin(a) * (r + 9)).toFixed(1);
      rays += `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${color}" stroke-width="2.5"/>`;
    }
    return `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${color}" stroke-width="3"/>` + rays;
  }

  /** Khung cua chu nhat ho (khong co canh day) de ghep voi mui ten vao/ra */
  function doorFrame(x, y, w, h, color) {
    return `<path d="M${x} ${y + h} V${y} H${x + w} V${y + h}" stroke="${color}" stroke-width="3.5"/>`;
  }

  // "かみ" xuat hien 2 lan trong danh sach nguon voi 2 nghia khac nhau:
  // 紙 (giay, bai 11) va 髪 (toc, bai 16) — dung la tu dong am khac nghia
  // trong tieng Nhat, kanji moi la thu phan biet nghia that su. Vi object
  // JS chi giu duoc 1 gia tri cho 1 khoa kana trung nhau, ta danh khoa kana
  // 'かみ' cho nghia GIAY, con TOC duoc ve rieng va gan qua khoa kanji '髪'.
  // App tra cuu bang SenseiArt.get(kanji, word, furigana) — kanji uu tien
  // truoc — nen ca 2 tu van ra dung hinh khi hien thi trong bai hoc.
  const KAMI_TOC = art(
    `<path d="M28 50 a22 22 0 0 1 44 0" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M28 50 q-4 20 2 34 M36 46 q-2 22 2 38 M50 44 q0 24 0 40 M64 46 q2 22 -2 38 M72 50 q4 20 -2 34" stroke="${ACCENT}" stroke-width="2.5"/>` +
    `<text x="50" y="92" font-size="12" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">tóc</text>`);

  const EXTRA = {
    // ---------- bài 11: đồ vật quanh ta, lượng từ ----------
    '〜さつ': art(
      `<rect x="26" y="34" width="34" height="44" rx="2" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="34" y="26" width="34" height="44" rx="2" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M42 36 h18 M42 44 h18 M42 52 h12" stroke="${ACCENT}" stroke-width="2"/>` +
      `<circle cx="78" cy="28" r="12" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<text x="78" y="33" font-size="13" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">3</text>` +
      `<text x="50" y="94" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">quyển (sách)</text>`),

    '〜かい': art(
      `<path d="M50 24 a26 26 0 1 1 -18.4 7.6" stroke="${ACCENT}" stroke-width="4"/>` +
      `<path d="M24 22 l8 10 l11 -5" stroke="${ACCENT}" stroke-width="4"/>` +
      `<circle cx="38" cy="60" r="3" fill="${GOLD}" stroke="none"/>` +
      `<circle cx="50" cy="66" r="3" fill="${GOLD}" stroke="none"/>` +
      `<circle cx="62" cy="60" r="3" fill="${GOLD}" stroke="none"/>` +
      `<text x="50" y="94" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">~ lần</text>`),

    'かみ': art(
      `<rect x="28" y="16" width="44" height="58" rx="2" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M58 16 v14 h14 z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M36 34 h26 M36 44 h26 M36 54 h18" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<text x="50" y="90" font-size="12" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">giấy</text>`),

    'きって': art(
      `<rect x="18" y="22" width="64" height="48" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M18 26 q4 -4 8 0 q4 4 8 0 q4 -4 8 0 q4 4 8 0 q4 -4 8 0 q4 4 8 0 q4 -4 8 0 q4 4 8 0" stroke="${INK}" stroke-width="2"/>` +
      `<circle cx="42" cy="46" r="12" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M42 38 v16 M34 46 h16" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M62 38 h10 M62 46 h10 M62 54 h6" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<text x="50" y="90" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">tem thư</text>`),

    'ふうとう': art(
      `<rect x="14" y="28" width="72" height="46" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M14 30 L50 58 L86 30" stroke="${ACCENT}" stroke-width="3"/>` +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">phong bì</text>`),

    'きっぷ': art(
      `<rect x="12" y="32" width="76" height="36" rx="4" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M62 32 v36" stroke="${INK}" stroke-width="2.5" stroke-dasharray="4 3"/>` +
      `<circle cx="62" cy="50" r="3" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M22 42 h30 M22 50 h24 M22 58 h18" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M72 40 l8 10 -8 10" stroke="${SAGE}" stroke-width="3"/>` +
      `<text x="50" y="90" font-size="12" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">vé</text>`),

    'おさら': art(
      `<ellipse cx="50" cy="50" rx="36" ry="20" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<ellipse cx="50" cy="50" rx="20" ry="11" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<text x="50" y="90" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">cái đĩa</text>`),

    'たまご': art(
      `<path d="M50 18 C66 18 72 44 72 56 a22 22 0 0 1 -44 0 C28 44 34 18 50 18 z" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<text x="50" y="90" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">quả trứng</text>`),

    'がいこくじん': art(
      person(34, 50, INK, .85) +
      `<circle cx="72" cy="42" r="18" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M54 42 h36 M72 24 a24 18 0 0 1 0 36 a24 18 0 0 1 0 -36" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="9.5" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">người nước ngoài</text>`),

    'おとな': art(
      person(66, 40, ACCENT, 1.05) +
      person(28, 58, INK, .55) +
      `<path d="M46 78 h6" stroke="${INK}" stroke-width="2" stroke-dasharray="2 3"/>` +
      `<text x="50" y="94" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">người lớn</text>`),

    'しつもん': art(
      `<path d="M20 20 h44 a8 8 0 0 1 8 8 v20 a8 8 0 0 1 -8 8 h-24 l-12 12 v-12 h-8 a8 8 0 0 1 -8 -8 v-20 a8 8 0 0 1 8 -8 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<text x="44" y="46" font-size="26" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">câu hỏi</text>`),

    'いっしゅうかん': art(
      `<rect x="14" y="22" width="72" height="54" rx="4" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M14 36 h72" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M28 16 v12 M72 16 v12" stroke="${INK}" stroke-width="3"/>` +
      `<rect x="20" y="44" width="8" height="8" fill="${ACCENT}" stroke="none"/>` +
      `<rect x="32" y="44" width="8" height="8" fill="${ACCENT}" stroke="none"/>` +
      `<rect x="44" y="44" width="8" height="8" fill="${ACCENT}" stroke="none"/>` +
      `<rect x="56" y="44" width="8" height="8" fill="${ACCENT}" stroke="none"/>` +
      `<rect x="68" y="44" width="8" height="8" fill="${ACCENT}" stroke="none"/>` +
      `<rect x="20" y="56" width="8" height="8" stroke="${SAGE}" stroke-width="2"/>` +
      `<rect x="32" y="56" width="8" height="8" stroke="${SAGE}" stroke-width="2"/>` +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">1 tuần</text>`),

    // ---------- bài 12: so sánh, bốn mùa, thế giới ----------
    'より': art(
      `<rect x="16" y="50" width="20" height="26" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="62" y="26" width="20" height="50" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 40 h16" stroke="${GOLD}" stroke-width="3"/>` +
      `<path d="M50 34 l6 6 -6 6" stroke="${GOLD}" stroke-width="3"/>` +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">hơn (so sánh)</text>`),

    'ほう': art(
      `<circle cx="30" cy="46" r="16" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="70" cy="46" r="16" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M30 66 v10" stroke="${INK}" stroke-width="2" stroke-dasharray="2 3"/>` +
      `<path d="M56 30 l14 -10 -2 16 z" fill="${GOLD}" stroke="none"/>` +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">phía / bên</text>`),

    'いちばん': art(
      `<rect x="12" y="58" width="20" height="18" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="40" y="40" width="20" height="36" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="68" y="64" width="20" height="12" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<text x="50" y="64" font-size="18" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">1</text>` +
      `<path d="M50 40 l0 -14 8 4 -8 4" fill="${ACCENT}" stroke="none"/>` +
      `<text x="50" y="92" font-size="10" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">số 1 / nhất</text>`),

    'きせつ': art(
      `<circle cx="50" cy="50" r="28" stroke="${INK}" stroke-width="2.5" stroke-dasharray="3 4"/>` +
      sunburst(50, 22, 6, GOLD, 6) +
      `<path d="M76 46 q7 4 2 12 q-8 0 -6 -10 z" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M46 72 q4 -10 8 0 q-4 6 -8 0" fill="${SAGE}" stroke="none"/>` +
      `<circle cx="24" cy="50" r="5" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M24 45 v10 M19 50 h10 M20.5 46.5 l7 7 M27.5 46.5 l-7 7" stroke="${INK}" stroke-width="1.5"/>` +
      `<text x="50" y="94" font-size="12" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">mùa</text>`),

    'はる': art(
      `<path d="M50 40 q0 -14 -12 -14 q2 12 12 14 z" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M50 40 q10 -10 20 -4 q-6 10 -20 4 z" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M50 40 q4 -14 16 -12 q-4 12 -16 12 z" fill="${GOLD}" stroke="none"/>` +
      `<path d="M50 40 q-10 -8 -20 0 q8 8 20 0 z" fill="${GOLD}" stroke="none"/>` +
      `<circle cx="50" cy="40" r="4" fill="${INK}" stroke="none"/>` +
      `<path d="M50 44 v30" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M50 58 q-10 -4 -14 4 M50 64 q10 -2 14 6" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">mùa xuân</text>`),

    'なつ': art(
      sunburst(50, 32, 14, GOLD, 8) +
      `<path d="M14 70 q9 -8 18 0 q9 8 18 0 q9 -8 18 0 q9 8 18 0" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M14 80 q9 -8 18 0 q9 8 18 0 q9 -8 18 0 q9 8 18 0" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<text x="50" y="94" font-size="11" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">mùa hè</text>`),

    'あき': art(
      `<path d="M50 24 C66 26 66 50 50 68 C34 50 34 26 50 24 Z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 24 v44 M50 38 l-9 -6 M50 46 l10 -6 M50 56 l-9 -4" stroke="${ACCENT}" stroke-width="2"/>` +
      `<path d="M50 68 v10" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M20 30 l6 4 M74 40 l6 -4 M26 60 l6 4" stroke="${GOLD}" stroke-width="2" stroke-dasharray="2 3"/>` +
      `<text x="50" y="92" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">mùa thu</text>`),

    'ふゆ': art(
      `<path d="M50 16 v68 M18 50 h64 M27 27 l46 46 M73 27 l-46 46" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M50 16 l-6 8 M50 16 l6 8 M50 84 l-6 -8 M50 84 l6 -8` +
      ` M18 50 l8 -6 M18 50 l8 6 M82 50 l-8 -6 M82 50 l-8 6` +
      ` M27 27 l2 10 M27 27 l10 2 M73 73 l-2 -10 M73 73 l-10 -2` +
      ` M73 27 l-10 2 M73 27 l-2 10 M27 73 l10 -2 M27 73 l2 -10" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<text x="50" y="94" font-size="11" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">mùa đông</text>`),

    'まち': art(
      `<rect x="14" y="46" width="20" height="30" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="40" y="30" width="22" height="46" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="68" y="52" width="18" height="24" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M46 40 h10 M46 50 h10 M46 60 h10" stroke="${ACCENT}" stroke-width="2"/>` +
      `<path d="M19 54 h10 M19 64 h10" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M10 76 h80" stroke="${INK}" stroke-width="3"/>` +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">thị trấn</text>`),

    'どうぶつ': art(
      `<circle cx="50" cy="52" r="22" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M30 36 L20 18 L38 30 Z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M70 36 L80 18 L62 30 Z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="42" cy="48" r="3" fill="${INK}" stroke="none"/>` +
      `<circle cx="58" cy="48" r="3" fill="${INK}" stroke="none"/>` +
      `<path d="M50 56 l-4 4 h8 z" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M50 60 q0 4 -6 4 M50 60 q0 4 6 4" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M30 54 h-10 M30 60 h-10 M70 54 h10 M70 60 h10" stroke="${SAGE}" stroke-width="1.8"/>` +
      `<text x="50" y="90" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">động vật</text>`),

    'がいこく': art(
      `<circle cx="42" cy="50" r="24" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M18 50 h48 M42 26 a30 24 0 0 1 0 48 a30 24 0 0 1 0 -48" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<path d="M74 30 v34" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M74 30 l16 6 -16 6 z" fill="${ACCENT}" stroke="none"/>` +
      `<text x="50" y="94" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">nước ngoài</text>`),

    'せかい': art(
      `<circle cx="50" cy="48" r="30" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M20 48 h60 M50 18 a36 30 0 0 1 0 60 a36 30 0 0 1 0 -60" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M32 36 q8 -6 14 0 q-2 8 -12 8 q-4 -4 -2 -8" fill="${SAGE}" stroke="none"/>` +
      `<path d="M56 30 q10 4 8 14 q-10 2 -12 -8 q0 -4 4 -6" fill="${SAGE}" stroke="none"/>` +
      `<path d="M40 58 q10 -4 18 4 q-4 8 -14 6 q-6 -4 -4 -10" fill="${SAGE}" stroke="none"/>` +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">thế giới</text>`),

    'なつやすみ': art(
      sunburst(74, 22, 9, GOLD, 8) +
      `<path d="M50 30 v34" stroke="${ACCENT}" stroke-width="3.5"/>` +
      `<path d="M28 30 a22 14 0 0 1 44 0 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M20 78 q30 -14 60 0" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M30 78 v-8 M70 78 v-8" stroke="${INK}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="9.5" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">nghỉ hè</text>`),

    // ---------- bài 13: mong muốn, giải trí, du lịch ----------
    'ほしい': art(
      person(30, 54, INK, .85) +
      `<path d="M46 48 L64 40" stroke="${ACCENT}" stroke-width="3"/>` +
      `<rect x="64" y="26" width="22" height="20" rx="2" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M64 34 h22 M75 26 v20" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M78 18 l2 6 6 1 -5 4 1 6 -5 -3 -5 3 1 -6 -5 -4 6 -1 z" fill="${ACCENT}" stroke="none"/>` +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">muốn (có)</text>`),

    '〜たい': art(
      person(38, 56, ACCENT, .9) +
      `<path d="M52 40 q10 -4 18 -14" stroke="${INK}" stroke-width="2.5" stroke-dasharray="1 5"/>` +
      `<path d="M64 30 l6 -8 M70 22 l4 2 -2 5" stroke="${INK}" stroke-width="2.5"/>` +
      `<circle cx="70" cy="20" r="10" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<text x="70" y="24" font-size="14" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">!</text>` +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">muốn làm ~</text>`),

    'かいもの': art(
      `<path d="M30 40 h40 l-4 34 a4 4 0 0 1 -4 4 h-24 a4 4 0 0 1 -4 -4 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M38 40 v-8 a12 10 0 0 1 24 0 v8" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="42" cy="52" r="2.5" fill="${SAGE}" stroke="none"/>` +
      `<path d="M52 48 l6 10 -12 2 z" fill="${GOLD}" stroke="none"/>` +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">mua sắm</text>`),

    'あそびます': art(
      person(42, 50, ACCENT, .9) +
      `<circle cx="72" cy="34" r="8" stroke="${GOLD}" stroke-width="3"/>` +
      `<path d="M20 30 l4 6 M76 60 l-4 6 M24 66 l6 -4" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">chơi</text>`),

    'およぎます': art(
      `<circle cx="34" cy="46" r="8" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M42 48 q14 6 26 0 q6 -2 10 2" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M14 66 q9 -8 18 0 q9 8 18 0 q9 -8 18 0 q9 8 18 0" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M14 76 q9 -8 18 0 q9 8 18 0 q9 -8 18 0 q9 8 18 0" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="12" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">bơi</text>`),

    'うみ': art(
      sunburst(50, 22, 10, GOLD, 8) +
      `<path d="M10 52 q10 -8 20 0 q10 8 20 0 q10 -8 20 0 q10 8 20 0" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M10 64 q10 -8 20 0 q10 8 20 0 q10 -8 20 0 q10 8 20 0" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M10 76 q10 -8 20 0 q10 8 20 0 q10 -8 20 0 q10 8 20 0" stroke="${SAGE}" stroke-width="3"/>` +
      `<text x="50" y="94" font-size="12" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">biển</text>`),

    'やま': art(
      `<path d="M8 76 L34 34 L50 58 L64 30 L92 76 Z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M58 40 l6 -10 6 10 -4 2 h-4 z" fill="${PAPER}" stroke="${SAGE}" stroke-width="2"/>` +
      `<text x="50" y="90" font-size="12" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">núi</text>`),

    'プール': art(
      `<rect x="12" y="28" width="76" height="42" rx="6" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M20 42 q9 -6 18 0 q9 6 18 0 q9 -6 18 0 q9 6 18 0" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<path d="M20 56 q9 -6 18 0 q9 6 18 0 q9 -6 18 0 q9 6 18 0" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<path d="M36 28 v42 M60 28 v42" stroke="${ACCENT}" stroke-width="2" stroke-dasharray="4 3"/>` +
      `<text x="50" y="86" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">hồ bơi</text>`),

    'えいがかん': art(
      `<rect x="14" y="30" width="72" height="40" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="24" y="38" width="52" height="26" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M30 38 l6 26 M42 38 l4 26 M58 38 l-4 26 M70 38 l-6 26" stroke="${ACCENT}" stroke-width="1.5"/>` +
      `<path d="M14 30 l10 -12 h52 l10 12" stroke="${INK}" stroke-width="3"/>` +
      `<text x="50" y="90" font-size="9.5" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">rạp phim</text>`),

    'さいふ': art(
      `<rect x="18" y="34" width="56" height="38" rx="6" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M18 46 h56" stroke="${INK}" stroke-width="2.5"/>` +
      `<circle cx="66" cy="40" r="3" fill="${GOLD}" stroke="none"/>` +
      `<circle cx="42" cy="60" r="8" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<text x="42" y="64" font-size="10" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">¥</text>` +
      `<path d="M62 58 l16 -6 v14 l-16 -4 z" stroke="${SAGE}" stroke-width="2" fill="${PAPER}"/>` +
      `<text x="50" y="90" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">ví tiền</text>`),

    'たくさん': art(
      `<path d="M22 60 h56 l-6 16 h-44 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="30" cy="46" r="7" fill="${ACCENT}" stroke="none"/>` +
      `<circle cx="46" cy="38" r="7" fill="${GOLD}" stroke="none"/>` +
      `<circle cx="62" cy="44" r="7" fill="${SAGE}" stroke="none"/>` +
      `<circle cx="54" cy="54" r="7" fill="${ACCENT}" stroke="none"/>` +
      `<circle cx="38" cy="56" r="7" fill="${GOLD}" stroke="none"/>` +
      `<circle cx="70" cy="56" r="7" fill="${SAGE}" stroke="none"/>` +
      `<text x="50" y="92" font-size="12" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">nhiều</text>`),

    'なにか': art(
      `<path d="M30 42 h40 l-4 34 h-32 z" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M30 42 l20 -14 20 14" stroke="${GOLD}" stroke-width="3"/>` +
      `<path d="M30 42 h40" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<text x="50" y="66" font-size="22" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">cái gì đó</text>`),

    'どこか': art(
      `<path d="M50 18 a20 20 0 0 1 20 20 q0 20 -20 40 q-20 -20 -20 -40 a20 20 0 0 1 20 -20 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<text x="50" y="46" font-size="20" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      `<path d="M20 82 q30 10 60 0" stroke="${INK}" stroke-width="2" stroke-dasharray="3 4"/>` +
      `<text x="50" y="94" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">ở đâu đó</text>`),

    'しんかんせん': art(
      `<path d="M10 62 q0 -22 24 -22 h34 q18 0 22 22 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M30 46 h40" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<circle cx="26" cy="70" r="6" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="70" cy="70" r="6" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M10 62 h80" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M84 42 l10 -4 M84 50 l12 -2" stroke="${GOLD}" stroke-width="2" stroke-dasharray="2 3"/>` +
      `<text x="50" y="90" font-size="9" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">shinkansen</text>`),

    'おんせん': art(
      `<ellipse cx="50" cy="66" rx="30" ry="14" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M34 46 q-4 8 0 12 q4 4 0 10" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M50 40 q-4 8 0 12 q4 4 0 10" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M66 46 q-4 8 0 12 q4 4 0 10" stroke="${SAGE}" stroke-width="3"/>` +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">onsen</text>`),

    // ---------- bài 14: động từ tự động từ / tha động từ ----------
    'まちます': art(
      person(38, 52, INK, .9) +
      `<circle cx="72" cy="34" r="16" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M72 24 v10 l8 6" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">chờ đợi</text>`),

    'しにます': art(
      `<path d="M50 30 q14 10 6 26" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M50 58 q4 -10 -4 -16 q-4 8 4 16" fill="${SAGE}" stroke="none"/>` +
      `<circle cx="58" cy="58" r="9" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M50 30 v-8" stroke="${INK}" stroke-width="2" stroke-dasharray="2 3"/>` +
      `<path d="M30 78 h40" stroke="${INK}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">chết / mất</text>`),

    'すみます': art(
      `<path d="M20 46 L50 20 L80 46" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M28 46 v30 h44 v-30" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="34" y="58" width="12" height="18" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<rect x="58" y="50" width="12" height="12" stroke="${ACCENT}" stroke-width="2.5"/>` +
      heart(64, 56, 4.5, ACCENT, 'none') +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">sống / ở</text>`),

    'いそぎます': art(
      person(46, 54, ACCENT, .95) +
      `<path d="M20 40 h14 M16 50 h16 M20 60 h12" stroke="${INK}" stroke-width="2.5"/>` +
      `<circle cx="76" cy="32" r="14" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M76 24 v8 l6 4" stroke="${GOLD}" stroke-width="2"/>` +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">vội gấp</text>`),

    'たちます': art(
      `<path d="M28 70 h20 v-24 M28 70 v-8" stroke="${INK}" stroke-width="3"/>` +
      person(50, 44, ACCENT, .85) +
      `<path d="M50 74 l0 -14" stroke="${GOLD}" stroke-width="3" stroke-dasharray="1 5"/>` +
      `<path d="M44 64 l6 -8 6 8" stroke="${GOLD}" stroke-width="3"/>` +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">đứng dậy</text>`),

    'すわります': art(
      `<path d="M30 76 h40 M30 76 v-10 M70 76 v-10 M30 66 h14 M56 66 h14" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="50" cy="46" r="9" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M38 66 v-6 a12 12 0 0 1 24 0 v6" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M50 30 l0 8" stroke="${GOLD}" stroke-width="3" stroke-dasharray="1 5"/>` +
      `<path d="M44 24 l6 8 6 -8" stroke="${GOLD}" stroke-width="3"/>` +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">ngồi xuống</text>`),

    'もちます': art(
      person(38, 48, INK, .85) +
      `<path d="M54 54 L66 58" stroke="${ACCENT}" stroke-width="3"/>` +
      `<rect x="66" y="46" width="20" height="20" rx="2" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M70 46 v-6 a6 6 0 0 1 12 0 v6" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">cầm / mang</text>`),

    'しります': art(
      person(42, 58, INK, .85) +
      `<path d="M66 30 a12 12 0 1 1 -14 0 q2 6 7 6 q5 0 7 -6" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M59 46 v6 M55 48 h8" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M59 16 v-6 M45 22 l-5 -5 M73 22 l5 -5 M42 32 h-6 M76 32 h6" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">biết (nhận ra)</text>`),

    'あけます': art(
      doorFrame(30, 20, 30, 54, INK) +
      `<rect x="60" y="20" width="26" height="54" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}" transform="rotate(-35 60 74)"/>` +
      `<path d="M40 46 q10 -4 16 -14" stroke="${GOLD}" stroke-width="2.5" stroke-dasharray="1 5"/>` +
      `<path d="M52 36 l4 -6 6 3" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="12" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">mở</text>`),

    'しめます': art(
      doorFrame(28, 20, 44, 54, INK) +
      `<rect x="28" y="20" width="44" height="54" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="64" cy="48" r="2.5" fill="${INK}" stroke="none"/>` +
      `<path d="M14 40 q8 4 8 8 q0 4 -8 8" stroke="${GOLD}" stroke-width="2.5" stroke-dasharray="1 5"/>` +
      `<text x="50" y="92" font-size="12" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">đóng</text>`),

    'けします': art(
      `<path d="M50 20 a16 16 0 0 1 9 29 v5 h-18 v-5 a16 16 0 0 1 9 -29 z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M41 60 h18 M44 66 h12" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M28 22 L74 68" stroke="${ACCENT}" stroke-width="4"/>` +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">tắt / xóa</text>`),

    'てつだいます': art(
      person(30, 56, INK, .85) +
      person(70, 56, ACCENT, .85) +
      `<path d="M44 50 L56 50" stroke="${GOLD}" stroke-width="3"/>` +
      `<rect x="40" y="60" width="20" height="14" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">giúp đỡ</text>`),

    'けっこんします': art(
      `<circle cx="40" cy="50" r="14" stroke="${GOLD}" stroke-width="3.5"/>` +
      `<circle cx="60" cy="50" r="14" stroke="${GOLD}" stroke-width="3.5"/>` +
      heart(50, 26, 8, ACCENT, 'none') +
      `<text x="50" y="88" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">kết hôn</text>`),

    // ---------- bài 15: ra vào, dừng đỗ, tính từ trạng thái ----------
    'つかいます': art(
      `<path d="M30 70 l14 -30 a5 5 0 0 1 9 4 l-8 26" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="52" y="24" width="10" height="26" rx="3" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}" transform="rotate(25 57 37)"/>` +
      `<path d="M18 76 h20" stroke="${INK}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">sử dụng</text>`),

    'はいります': art(
      doorFrame(30, 22, 40, 52, INK) +
      `<path d="M14 48 h28" stroke="${ACCENT}" stroke-width="4"/>` +
      `<path d="M34 40 l8 8 -8 8" stroke="${ACCENT}" stroke-width="4"/>` +
      `<text x="50" y="92" font-size="12" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">vào</text>`),

    'でます': art(
      doorFrame(30, 22, 40, 52, INK) +
      `<path d="M86 48 h-28" stroke="${SAGE}" stroke-width="4"/>` +
      `<path d="M66 40 l-8 8 8 8" stroke="${SAGE}" stroke-width="4"/>` +
      `<text x="50" y="92" font-size="11" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">ra / rời đi</text>`),

    'ぬぎます': art(
      `<path d="M20 66 q0 -10 10 -10 h18 q10 0 14 8 l4 6 q2 4 -2 6 h-38 q-6 0 -6 -4 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M30 56 v-8" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M60 40 l14 -10" stroke="${GOLD}" stroke-width="2.5" stroke-dasharray="1 5"/>` +
      `<path d="M70 26 l6 4 -4 6" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">cởi (giày/áo)</text>`),

    'とめます': art(
      `<rect x="16" y="50" width="48" height="18" rx="4" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M22 50 l6 -12 h24 l6 12" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="26" cy="68" r="5" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="54" cy="68" r="5" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="78" cy="42" r="14" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<text x="78" y="47" font-size="14" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">P</text>` +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">dừng / đỗ xe</text>`),

    'まど': art(
      `<rect x="22" y="18" width="56" height="56" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 18 v56 M22 46 h56" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M14 22 q6 6 0 14 q-6 8 0 14" stroke="${SAGE}" stroke-width="2"/>` +
      `<path d="M86 22 q-6 6 0 14 q6 8 0 14" stroke="${SAGE}" stroke-width="2"/>` +
      `<text x="50" y="90" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">cửa sổ</text>`),

    'テスト': art(
      `<rect x="20" y="16" width="52" height="64" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M28 30 h30 M28 40 h36" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<path d="M30 52 l6 6 12 -14" stroke="${SAGE}" stroke-width="3.5"/>` +
      `<path d="M28 66 l6 6 12 -14" stroke="${ACCENT}" stroke-width="3.5"/>` +
      `<path d="M64 24 l16 44" stroke="${GOLD}" stroke-width="3"/>` +
      `<text x="50" y="94" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">bài kiểm tra</text>`),

    'だいじょうぶ': art(
      `<path d="M50 16 L78 28 V50 Q78 72 50 84 Q22 72 22 50 V28 Z" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M36 50 l10 10 20 -22" stroke="${SAGE}" stroke-width="5"/>` +
      `<text x="50" y="94" font-size="10" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">ổn / không sao</text>`),

    'もちろん': art(
      `<circle cx="50" cy="46" r="28" stroke="${GOLD}" stroke-width="4"/>` +
      `<path d="M34 46 l10 11 22 -26" stroke="${GOLD}" stroke-width="6"/>` +
      `<path d="M50 12 v-6 M50 80 v6 M16 46 h-6 M84 46 h6 M27 23 l-4 -4 M73 23 l4 -4 M27 69 l-4 4 M73 69 l4 4" stroke="${GOLD}" stroke-width="3"/>` +
      `<text x="50" y="94" font-size="11" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">tất nhiên</text>`),

    'しって': art(
      person(42, 58, SAGE, .85) +
      `<path d="M66 30 a12 12 0 1 1 -14 0 q2 6 7 6 q5 0 7 -6" stroke="${GOLD}" stroke-width="3" fill="${GOLD}"/>` +
      `<path d="M59 46 v6 M55 48 h8" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="10" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">đang biết</text>`),

    // ---------- bài 16: bộ phận cơ thể, ngoại hình, tính cách ----------
    'はをみがきます': art(
      `<path d="M30 40 q20 -14 40 0 q4 20 -6 30 q-14 8 -28 0 q-10 -10 -6 -30 z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M36 40 v10 M44 38 v14 M52 38 v14 M60 40 v10" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M60 60 l16 -14" stroke="${ACCENT}" stroke-width="4"/>` +
      `<rect x="74" y="38" width="10" height="18" rx="2" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}" transform="rotate(-40 79 47)"/>` +
      `<path d="M64 52 l4 4 M68 46 l4 4" stroke="${GOLD}" stroke-width="2" stroke-dasharray="1 3"/>` +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">đánh răng</text>`),

    'シャワーをあびます': art(
      `<path d="M30 22 h30 a8 8 0 0 1 8 8" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="30" cy="22" r="4" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M26 36 h34" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M30 42 v6 M38 42 v6 M46 42 v6 M54 42 v6" stroke="${SAGE}" stroke-width="2.5" stroke-dasharray="2 4"/>` +
      person(45, 70, ACCENT, .8) +
      `<text x="50" y="94" font-size="9" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">tắm vòi sen</text>`),

    'でかけます': art(
      `<path d="M14 46 L34 26 L54 46" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M20 46 v30 h28 v-30" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="38" y="58" width="10" height="18" stroke="${INK}" stroke-width="2.5"/>` +
      person(70, 56, ACCENT, .8) +
      `<path d="M56 60 L64 58" stroke="${GOLD}" stroke-width="3" stroke-dasharray="1 4"/>` +
      `<path d="M86 46 l6 4 -6 4" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">ra ngoài</text>`),

    'かお': art(
      `<circle cx="50" cy="48" r="30" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="38" cy="42" r="3" fill="${INK}" stroke="none"/>` +
      `<circle cx="62" cy="42" r="3" fill="${INK}" stroke="none"/>` +
      `<path d="M46 54 q4 4 8 0" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M48 48 q2 3 0 5" stroke="${ACCENT}" stroke-width="2"/>` +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">khuôn mặt</text>`),

    'め': art(
      `<path d="M14 50 q36 -26 72 0 q-36 26 -72 0 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="50" cy="50" r="12" stroke="${ACCENT}" stroke-width="3"/>` +
      `<circle cx="50" cy="50" r="5" fill="${INK}" stroke="none"/>` +
      `<path d="M14 50 q36 -26 72 0" stroke="${INK}" stroke-width="3.5"/>` +
      `<text x="50" y="86" font-size="12" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">mắt</text>`),

    'みみ': art(
      `<path d="M42 20 q30 0 26 34 q-2 18 -20 22 q-10 2 -12 -8 q8 0 10 -8 q-14 2 -18 -12 q-4 -20 14 -28 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 38 q10 -4 14 8 q2 8 -6 12" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<text x="50" y="90" font-size="12" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">tai</text>`),

    'くち': art(
      `<path d="M18 48 q32 -18 64 0 q-8 22 -32 22 q-24 0 -32 -22 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M18 48 q32 16 64 0" stroke="${INK}" stroke-width="2.5"/>` +
      `<text x="50" y="88" font-size="12" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">miệng</text>`),

    'て': art(
      `<path d="M36 78 v-30 M36 48 v-16 a4 4 0 0 1 8 0 v16 M44 48 v-20 a4 4 0 0 1 8 0 v20 M52 48 v-18 a4 4 0 0 1 8 0 v18 M60 48 v-12 a4 4 0 0 1 8 0 v12 M36 78 h32 v-14 q0 -16 -8 -20" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">bàn tay</text>`),

    'あし': art(
      `<path d="M42 16 v40 q0 10 10 12 q10 2 10 10 v4 h-30 q0 -8 4 -10 q6 -2 6 -10 v-46 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M32 82 h30" stroke="${ACCENT}" stroke-width="3"/>` +
      `<text x="50" y="94" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">chân</text>`),

    'あたま': art(
      `<path d="M28 56 a22 22 0 1 1 44 0 q0 10 -6 14 h-32 q-6 -4 -6 -14 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M30 40 q10 -14 30 -6" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M50 16 v10" stroke="${GOLD}" stroke-width="3" stroke-dasharray="1 5"/>` +
      `<path d="M44 22 l6 -8 6 8" stroke="${GOLD}" stroke-width="3"/>` +
      `<text x="50" y="90" font-size="12" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">đầu</text>`),

    'からだ': art(
      person(50, 44, INK, 1.1) +
      heart(50, 46, 7, ACCENT, 'none') +
      `<text x="50" y="92" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">cơ thể</text>`),

    'せい': art(
      person(38, 46, ACCENT, .95) +
      `<path d="M74 18 v58" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M68 18 h12 M68 32 h8 M68 46 h12 M68 60 h8 M68 76 h12" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M56 30 h10" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M62 26 l4 4 -4 4" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<text x="50" y="92" font-size="10" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">chiều cao</text>`),

    // 'かみ' (髪 = tóc) — xem KAMI_TOC + alias '髪' ở dưới, không lặp khoá kana ở đây.

    'あかるい': art(
      sunburst(50, 44, 20, GOLD, 10) +
      `<circle cx="42" cy="40" r="2.5" fill="${INK}" stroke="none"/>` +
      `<circle cx="58" cy="40" r="2.5" fill="${INK}" stroke="none"/>` +
      `<path d="M38 50 q12 12 24 0" stroke="${INK}" stroke-width="3"/>` +
      `<text x="50" y="92" font-size="9.5" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">vui vẻ / sáng sủa</text>`),

    'しんせつ': art(
      `<path d="M30 34 a20 16 0 0 1 40 0 z" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 34 v14" stroke="${GOLD}" stroke-width="3"/>` +
      person(50, 62, INK, .8) +
      person(24, 70, ACCENT, .55) +
      heart(50, 16, 6, ACCENT, 'none') +
      `<text x="50" y="94" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">tốt bụng</text>`),

    'やさしい': art(
      person(50, 50, SAGE, 1) +
      `<path d="M38 40 q12 10 24 0" stroke="${SAGE}" stroke-width="2.5"/>` +
      heart(50, 74, 7, ACCENT, 'none') +
      `<path d="M40 70 q10 -6 20 0" stroke="${ACCENT}" stroke-width="2" stroke-dasharray="1 4"/>` +
      `<text x="50" y="92" font-size="10" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">dịu dàng</text>`),

    'せびろ': art(
      `<path d="M32 30 L44 22 L50 30 L56 22 L68 30 L64 78 H36 Z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M44 22 L50 42 L56 22" stroke="${PAPER}" stroke-width="8"/>` +
      `<path d="M44 22 L50 42 L56 22" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M50 42 L50 70" stroke="${ACCENT}" stroke-width="4"/>` +
      `<circle cx="44" cy="56" r="1.8" fill="${INK}" stroke="none"/>` +
      `<circle cx="44" cy="64" r="1.8" fill="${INK}" stroke="none"/>` +
      `<text x="50" y="92" font-size="11" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">bộ vest</text>`),

    'いりぐち': art(
      `<path d="M20 78 V30 a30 30 0 0 1 60 0 v48" stroke="${INK}" stroke-width="3.5" fill="${PAPER}"/>` +
      `<rect x="30" y="40" width="40" height="38" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M30 20 h40 v10 h-40 z" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M8 58 h18" stroke="${SAGE}" stroke-width="4"/>` +
      `<path d="M20 50 l8 8 -8 8" stroke="${SAGE}" stroke-width="4"/>` +
      `<text x="50" y="92" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">lối vào</text>`),

    // ---------- bài 17: sức khỏe, công việc ----------
    'わすれます': art(
      person(42, 56, INK, .9) +
      `<path d="M58 30 a14 14 0 1 1 12 20" stroke="${INK}" stroke-width="2.5" stroke-dasharray="4 4"/>` +
      `<text x="66" y="34" font-size="16" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      `<path d="M78 20 l4 4 M84 30 l5 2 M80 40 l4 4" stroke="${ACCENT}" stroke-width="2" stroke-dasharray="1 3"/>` +
      `<text x="50" y="92" font-size="12" fill="${INK}" font-weight="700" text-anchor="middle" stroke="none">quên</text>`),

    'くすり': art(
      `<rect x="36" y="16" width="20" height="54" rx="4" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M36 32 h20" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<path d="M46 22 v-8 M42 18 h8" stroke="${ACCENT}" stroke-width="3"/>` +
      `<ellipse cx="70" cy="60" rx="12" ry="7" stroke="${GOLD}" stroke-width="3" fill="${PAPER}" transform="rotate(-30 70 60)"/>` +
      `<path d="M64 56 l12 8" stroke="${GOLD}" stroke-width="2"/>` +
      `<text x="50" y="88" font-size="12" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">thuốc</text>`),

    'びょうき': art(
      person(46, 50, INK, .95) +
      `<path d="M58 54 l16 -10" stroke="${PAPER}" stroke-width="5"/>` +
      `<path d="M58 54 l16 -10" stroke="${INK}" stroke-width="2.5"/>` +
      `<circle cx="76" cy="42" r="4" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M30 32 q-2 6 2 8 M62 32 q2 6 -2 8" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<circle cx="28" cy="34" r="2.5" fill="${ACCENT}" stroke="none"/>` +
      `<circle cx="64" cy="34" r="2.5" fill="${ACCENT}" stroke="none"/>` +
      `<text x="50" y="92" font-size="11" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">bệnh / ốm</text>`),

    'かいぎ': art(
      `<ellipse cx="50" cy="58" rx="34" ry="14" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      person(30, 34, INK, .62) +
      person(50, 26, ACCENT, .62) +
      person(70, 34, SAGE, .62) +
      `<path d="M40 44 h20" stroke="${GOLD}" stroke-width="2" stroke-dasharray="2 3"/>` +
      `<text x="50" y="90" font-size="10" fill="${INK}" font-weight="600" text-anchor="middle" stroke="none">cuộc họp</text>`),
  };

  // Đồng âm 'かみ': gán riêng nghĩa TÓC (髪) qua khoá kanji, không ghi đè
  // khoá kana dùng chung ở trên (đang giữ nghĩa GIẤY).
  EXTRA['髪'] = KAMI_TOC;

  window.SenseiArt.extend(EXTRA);

  // Bí danh kanji — để tra cứu ra đúng hình dù giao diện dùng dạng chữ nào.
  window.SenseiArt.extend({
    '〜冊': EXTRA['〜さつ'],
    '〜回': EXTRA['〜かい'],
    '紙': EXTRA['かみ'],
    '切手': EXTRA['きって'],
    '封筒': EXTRA['ふうとう'],
    '切符': EXTRA['きっぷ'],
    'お皿': EXTRA['おさら'],
    '卵': EXTRA['たまご'],
    '外国人': EXTRA['がいこくじん'],
    '大人': EXTRA['おとな'],
    '質問': EXTRA['しつもん'],
    '一週間': EXTRA['いっしゅうかん'],
    '方': EXTRA['ほう'],
    '一番': EXTRA['いちばん'],
    '季節': EXTRA['きせつ'],
    '春': EXTRA['はる'],
    '夏': EXTRA['なつ'],
    '秋': EXTRA['あき'],
    '冬': EXTRA['ふゆ'],
    '町': EXTRA['まち'],
    '動物': EXTRA['どうぶつ'],
    '外国': EXTRA['がいこく'],
    '世界': EXTRA['せかい'],
    '夏休み': EXTRA['なつやすみ'],
    '欲しい': EXTRA['ほしい'],
    '買い物': EXTRA['かいもの'],
    '遊びます': EXTRA['あそびます'],
    '泳ぎます': EXTRA['およぎます'],
    '海': EXTRA['うみ'],
    '山': EXTRA['やま'],
    '映画館': EXTRA['えいがかん'],
    '財布': EXTRA['さいふ'],
    '沢山': EXTRA['たくさん'],
    '何か': EXTRA['なにか'],
    '何処か': EXTRA['どこか'],
    '新幹線': EXTRA['しんかんせん'],
    '温泉': EXTRA['おんせん'],
    '待ちます': EXTRA['まちます'],
    '死にます': EXTRA['しにます'],
    '住みます': EXTRA['すみます'],
    '急ぎます': EXTRA['いそぎます'],
    '立ちます': EXTRA['たちます'],
    '座ります': EXTRA['すわります'],
    '持ちます': EXTRA['もちます'],
    '知ります': EXTRA['しります'],
    '開けます': EXTRA['あけます'],
    '閉めます': EXTRA['しめます'],
    '消します': EXTRA['けします'],
    '手伝います': EXTRA['てつだいます'],
    '結婚します': EXTRA['けっこんします'],
    '使います': EXTRA['つかいます'],
    '入ります': EXTRA['はいります'],
    '出ます': EXTRA['でます'],
    '脱ぎます': EXTRA['ぬぎます'],
    '止めます': EXTRA['とめます'],
    '窓': EXTRA['まど'],
    '大丈夫': EXTRA['だいじょうぶ'],
    '知って': EXTRA['しって'],
    '歯を磨きます': EXTRA['はをみがきます'],
    'シャワーを浴びます': EXTRA['シャワーをあびます'],
    '出かけます': EXTRA['でかけます'],
    '顔': EXTRA['かお'],
    '目': EXTRA['め'],
    '耳': EXTRA['みみ'],
    '口': EXTRA['くち'],
    '手': EXTRA['て'],
    '足': EXTRA['あし'],
    '頭': EXTRA['あたま'],
    '体': EXTRA['からだ'],
    '背': EXTRA['せい'],
    '明るい': EXTRA['あかるい'],
    '親切': EXTRA['しんせつ'],
    '優しい': EXTRA['やさしい'],
    '背広': EXTRA['せびろ'],
    '入口': EXTRA['いりぐち'],
    '忘れます': EXTRA['わすれます'],
    '薬': EXTRA['くすり'],
    '病気': EXTRA['びょうき'],
    '会議': EXTRA['かいぎ'],
  });
})();
