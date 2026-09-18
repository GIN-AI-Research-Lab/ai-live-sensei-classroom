/**
 * Sensei Art — lo minh hoa bo sung N4 (lo 1/3): bai 26-32.
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

  // nhan chu tieng Viet duoi hinh
  function label(text, color, size, y, weight) {
    return `<text x="50" y="${y || 94}" font-size="${size || 10}" fill="${color}" ` +
           `font-weight="${weight || 600}" text-anchor="middle" stroke="none">${text}</text>`;
  }

  // cham tron dac
  function dot(cx, cy, r, color) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="none"/>`;
  }

  // dau check
  function check(x, y, color, scale) {
    const s = scale || 1;
    return `<path d="M${x - 10 * s} ${y} l${6 * s} ${7 * s} l${14 * s} -${16 * s}" stroke="${color}" stroke-width="${4 * s}"/>`;
  }

  // mat dong ho tron co kim
  function clockFace(cx, cy, r, color) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${color}" stroke-width="3" fill="${PAPER}"/>` +
           `<path d="M${cx} ${cy} v-${(r * 0.6).toFixed(1)} M${cx} ${cy} l${(r * 0.45).toFixed(1)} ${(r * 0.3).toFixed(1)}" stroke="${color}" stroke-width="2.5"/>`;
  }

  // bong thoai chu nhat, duoi o goc trai duoi
  function speech(x, y, w, h, color, fill) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" stroke="${color}" stroke-width="2.5" fill="${fill || PAPER}"/>` +
           `<path d="M${x + 14} ${y + h} l-2 9 10 -9 z" stroke="${color}" stroke-width="2.5" fill="${fill || PAPER}"/>`;
  }

  // chu Z the hien dang ngu
  function zzz(x, y, color) {
    return `<text x="${x}" y="${y}" font-size="13" fill="${color}" font-weight="700" stroke="none">Z</text>` +
           `<text x="${x + 8}" y="${y - 8}" font-size="9" fill="${color}" font-weight="700" stroke="none">z</text>`;
  }

  // mu tot nghiep
  function cap(cx, cy, color) {
    return `<path d="M${cx - 22} ${cy} L${cx} ${cy - 10} L${cx + 22} ${cy} L${cx} ${cy + 10} Z" stroke="${color}" stroke-width="3" fill="${PAPER}"/>` +
           `<path d="M${cx + 15} ${cy + 3} v11" stroke="${color}" stroke-width="2.2"/>` +
           dot(cx + 15, cy + 16, 2, color);
  }

  // trang giay/tai lieu co dong ke
  function doc(x, y, w, h, color, fill) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" stroke="${color}" stroke-width="2.5" fill="${fill || PAPER}"/>` +
           `<path d="M${x + 6} ${y + 9} h${w - 12} M${x + 6} ${y + 17} h${w - 16} M${x + 6} ${y + 25} h${w - 20}" stroke="${SAGE}" stroke-width="2"/>`;
  }

  // ngoi nha don gian
  function house(x, y, color) {
    return `<path d="M${x} ${y + 16} L${x + 17} ${y} L${x + 34} ${y + 16} V${y + 40} H${x} Z" stroke="${color}" stroke-width="3" fill="${PAPER}"/>` +
           `<rect x="${x + 12}" y="${y + 22}" width="10" height="18" stroke="${color}" stroke-width="2.2" fill="${PAPER}"/>`;
  }

  // ngoi sao no / va cham
  function burst(cx, cy, r, color, fill) {
    const pts = [];
    const n = 8;
    for (let i = 0; i < n * 2; i++) {
      const ang = -Math.PI / 2 + i * (Math.PI / n);
      const rad = i % 2 === 0 ? r : r * 0.45;
      pts.push(`${(cx + rad * Math.cos(ang)).toFixed(1)},${(cy + rad * Math.sin(ang)).toFixed(1)}`);
    }
    return `<path d="M${pts.join(' L')} Z" stroke="${color}" stroke-width="2.5" fill="${fill || PAPER}"/>`;
  }

  // lap lanh 4 canh
  function sparkle(cx, cy, r, color) {
    return `<path d="M${cx} ${cy - r} L${cx + r * 0.3} ${cy - r * 0.3} L${cx + r} ${cy} ` +
           `L${cx + r * 0.3} ${cy + r * 0.3} L${cx} ${cy + r} L${cx - r * 0.3} ${cy + r * 0.3} ` +
           `L${cx - r} ${cy} L${cx - r * 0.3} ${cy - r * 0.3} Z" fill="${color}" stroke="none"/>`;
  }

  // ngoi sao 5 canh
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

  const EXTRA = {
    // ---------- bai 26: benh tat, ly do, tinh trang ----------
    'ねぼうします': art(
      `<rect x="18" y="58" width="50" height="16" rx="2" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<rect x="14" y="52" width="10" height="14" rx="2" stroke="${INK}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<circle cx="34" cy="54" r="7" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M44 58 h20" stroke="${INK}" stroke-width="2.2"/>` +
      zzz(50, 40, ACCENT) +
      `<circle cx="80" cy="22" r="10" stroke="${GOLD}" stroke-width="3"/>` +
      `<path d="M80 8 v4 M94 22 h-4 M69 11 l3 3 M91 11 l-3 3" stroke="${GOLD}" stroke-width="2.2"/>` +
      `<circle cx="76" cy="70" r="7" stroke="${ACCENT}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<path d="M76 66 v4 l3 2" stroke="${ACCENT}" stroke-width="1.8"/>` +
      `<path d="M70 76 l-4 4 M82 76 l4 4" stroke="${ACCENT}" stroke-width="2"/>` +
      label('NGỦ QUÊN, DẬY MUỘN', ACCENT, 8.5, 92, 700)),

    'おくれます': art(
      person(34, 58, INK, .85) +
      `<path d="M28 46 l-10 -6 M44 50 l10 -4" stroke="${INK}" stroke-width="2.2"/>` +
      `<path d="M12 66 l10 -3 M12 74 l12 -2" stroke="${SAGE}" stroke-width="2"/>` +
      dot(40, 34, 2.6, SAGE) +
      clockFace(76, 32, 15, ACCENT) +
      label('ĐẾN MUỘN, TRỄ', ACCENT, 10, 92, 700)),

    'こわれます': art(
      `<rect x="24" y="24" width="52" height="36" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M30 30 l16 14 -8 8 18 12" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M76 60 v10 M24 60 v10" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M16 66 h68" stroke="${INK}" stroke-width="3"/>` +
      burst(80, 22, 9, ACCENT, ACCENT) +
      label('BỊ HỎNG, BỊ VỠ', ACCENT, 11, 92, 700)),

    'なおります': art(
      person(40, 60, SAGE, 1) +
      `<circle cx="76" cy="34" r="20" stroke="${SAGE}" stroke-width="2" opacity=".4"/>` +
      check(76, 34, SAGE, 1.3) +
      `<path d="M20 78 h56" stroke="${INK}" stroke-width="2.5"/>` +
      label('KHỎI BỆNH, LÀNH LẠI', SAGE, 8.5, 92, 700)),

    'じこ': art(
      `<rect x="10" y="46" width="30" height="16" rx="4" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<circle cx="18" cy="64" r="4" stroke="${INK}" stroke-width="2"/><circle cx="34" cy="64" r="4" stroke="${INK}" stroke-width="2"/>` +
      `<rect x="60" y="46" width="30" height="16" rx="4" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<circle cx="68" cy="64" r="4" stroke="${ACCENT}" stroke-width="2"/><circle cx="84" cy="64" r="4" stroke="${ACCENT}" stroke-width="2"/>` +
      burst(50, 42, 16, ACCENT, GOLD) +
      label('TAI NẠN', ACCENT, 13, 92, 800)),

    'りゆう': art(
      `<text x="26" y="56" font-size="30" fill="${INK}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      `<path d="M40 46 h16" stroke="${GOLD}" stroke-width="2.5"/><path d="M50 40 l6 6 -6 6" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<circle cx="74" cy="40" r="14" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M68 54 h12 M70 60 h8" stroke="${GOLD}" stroke-width="2.2"/>` +
      `<path d="M74 26 v-6 M62 34 l-5 -4 M86 34 l5 -4" stroke="${GOLD}" stroke-width="2"/>` +
      label('LÝ DO', GOLD, 15, 92, 800)),

    'ぐあい': art(
      `<path d="M20 66 a30 30 0 0 1 60 0" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M24 50 l4 3 M76 50 l-4 3 M50 34 v5" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M50 66 L64 40" stroke="${GOLD}" stroke-width="3.5"/>` +
      dot(50, 66, 4.5, GOLD) +
      label('TÌNH TRẠNG', GOLD, 11, 92, 700)),

    'ねつ': art(
      `<rect x="44" y="16" width="12" height="46" rx="6" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="50" cy="68" r="12" stroke="${ACCENT}" stroke-width="3" fill="${ACCENT}"/>` +
      `<rect x="47" y="34" width="6" height="32" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M64 26 q5 -6 0 -12 M72 30 q7 -8 0 -18" stroke="${ACCENT}" stroke-width="2.2" opacity=".7"/>` +
      label('SỐT, NHIỆT ĐỘ', ACCENT, 9.5, 92, 700)),

    'かぜ': art(
      `<circle cx="46" cy="42" r="20" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M28 46 q18 14 36 0 v10 q-18 12 -36 0 z" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/>` +
      dot(38, 34, 2.4, INK) + dot(54, 34, 2.4, INK) +
      `<path d="M70 30 q10 2 8 12 M76 44 q12 2 8 14" stroke="${SAGE}" stroke-width="2.2"/>` +
      label('CẢM LẠNH, CẢM CÚM', SAGE, 8.5, 94, 700)),

    'たいてい': art(
      dot(24, 50, 9, GOLD) + dot(42, 50, 9, GOLD) + dot(60, 50, 9, GOLD) +
      `<circle cx="78" cy="50" r="9" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      label('THƯỜNG THÌ', GOLD, 11, 84, 700) +
      label('(đa số)', INK, 8, 94, 500)),

    'やはり／やっぱり': art(
      `<path d="M20 30 a10 8 0 1 1 20 0 z" stroke="${INK}" stroke-width="2.2" fill="${PAPER}" stroke-dasharray="3 3"/>` +
      dot(14, 44, 2.5, INK) + dot(10, 50, 1.6, INK) +
      `<path d="M30 40 v14" stroke="${GOLD}" stroke-width="2.2" stroke-dasharray="3 3"/>` +
      `<path d="M56 56 a10 8 0 1 1 20 0 z" stroke="${SAGE}" stroke-width="2.8" fill="${PAPER}"/>` +
      check(66, 78, SAGE, 1) +
      label('QUẢ NHIÊN', SAGE, 12, 92, 700)),

    'とうとう': art(
      `<path d="M16 78 q20 -50 34 -58" stroke="${INK}" stroke-width="2.2" stroke-dasharray="4 4"/>` +
      `<path d="M50 18 v56" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M50 18 l20 7 -20 7 z" fill="${ACCENT}" stroke="none"/>` +
      dot(18, 76, 4, GOLD) +
      label('CUỐI CÙNG THÌ', ACCENT, 10, 92, 700)),

    'いけん': art(
      speech(20, 24, 46, 32, INK, PAPER) +
      `<circle cx="43" cy="40" r="9" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M39 52 h8 M40 56 h6" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M43 28 v-5" stroke="${GOLD}" stroke-width="2"/>` +
      person(76, 66, ACCENT, .6) +
      label('Ý KIẾN', GOLD, 14, 92, 800)),

    'しっかり': art(
      `<path d="M50 18 v30" stroke="${INK}" stroke-width="4"/>` +
      `<path d="M36 34 q14 -10 28 0 q-14 14 -28 0 z" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 48 v20 M38 68 h24" stroke="${INK}" stroke-width="4"/>` +
      `<path d="M30 78 q20 -8 40 0" stroke="${SAGE}" stroke-width="2.2" opacity=".6"/>` +
      label('CHẮC CHẮN, KỸ CÀNG', INK, 8.5, 92, 700)),
    // ---------- bai 27: the kha nang, truong lop, so sanh ----------
    'はなせます': art(
      speech(16, 30, 44, 28, ACCENT, PAPER) +
      `<path d="M26 42 h20 M26 48 h14" stroke="${ACCENT}" stroke-width="2.2"/>` +
      `<circle cx="76" cy="34" r="16" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      check(76, 34, SAGE, 1) +
      label('NÓI ĐƯỢC', SAGE, 12, 92, 700)),

    'およげます': art(
      `<path d="M14 56 q8 -8 16 0 q8 8 16 0 q8 -8 16 0 q8 8 16 0 q8 -8 16 0" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<circle cx="40" cy="42" r="8" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M48 46 q14 -6 20 2" stroke="${INK}" stroke-width="2.5"/>` +
      `<circle cx="78" cy="26" r="14" stroke="${SAGE}" stroke-width="2.8" fill="${PAPER}"/>` +
      check(78, 26, SAGE, .9) +
      label('BƠI ĐƯỢC', SAGE, 12, 92, 700)),

    'のめます': art(
      `<path d="M32 40 h24 l-3 30 a9 9 0 0 1 -18 0 z" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M56 44 q10 0 8 10 q-2 8 -10 6" stroke="${GOLD}" stroke-width="2.2"/>` +
      `<path d="M38 34 q6 -8 0 -16" stroke="${ACCENT}" stroke-width="2" opacity=".6"/>` +
      `<circle cx="78" cy="30" r="15" stroke="${SAGE}" stroke-width="2.8" fill="${PAPER}"/>` +
      check(78, 30, SAGE, .95) +
      label('UỐNG ĐƯỢC', SAGE, 11, 92, 700)),

    'たべられます': art(
      `<path d="M26 58 a24 13 0 0 0 44 0 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M24 58 h48" stroke="${ACCENT}" stroke-width="3"/>` +
      dot(38, 54, 3.5, GOLD) + dot(50, 52, 3.5, SAGE) +
      `<circle cx="78" cy="30" r="15" stroke="${SAGE}" stroke-width="2.8" fill="${PAPER}"/>` +
      check(78, 30, SAGE, .95) +
      label('ĂN ĐƯỢC', SAGE, 12, 92, 700)),

    'みられます': art(
      `<path d="M14 46 q26 -22 52 0 q-26 22 -52 0 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="40" cy="46" r="9" stroke="${ACCENT}" stroke-width="3"/>` + dot(40, 46, 3, ACCENT) +
      `<circle cx="78" cy="24" r="14" stroke="${SAGE}" stroke-width="2.8" fill="${PAPER}"/>` +
      check(78, 24, SAGE, .9) +
      label('XEM ĐƯỢC', SAGE, 11, 92, 700)),

    'こられます': art(
      `<ellipse cx="18" cy="70" rx="5" ry="8" stroke="${INK}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<ellipse cx="32" cy="56" rx="5" ry="8" stroke="${INK}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<ellipse cx="46" cy="44" rx="5" ry="8" stroke="${INK}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<circle cx="78" cy="30" r="16" stroke="${SAGE}" stroke-width="2.8" fill="${PAPER}"/>` +
      check(78, 30, SAGE, 1) +
      label('ĐẾN ĐƯỢC', SAGE, 11, 92, 700)),

    'できます': art(
      `<circle cx="42" cy="50" r="28" stroke="${SAGE}" stroke-width="3.5" fill="${PAPER}"/>` +
      check(42, 50, SAGE, 1.6) +
      `<path d="M74 62 q10 -4 8 -18 q10 4 4 18 q10 -2 2 12" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      label('LÀM ĐƯỢC', SAGE, 13, 92, 800)),

    'かいわ': art(
      person(20, 66, INK, .68) + person(80, 66, ACCENT, .68) +
      speech(30, 26, 20, 16, INK, PAPER) +
      speech(50, 40, 20, 16, ACCENT, PAPER) +
      label('HỘI THOẠI', INK, 11, 92, 700)),

    'すいえい': art(
      `<rect x="12" y="50" width="76" height="24" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M12 62 h76" stroke="${SAGE}" stroke-width="1.6" stroke-dasharray="4 3"/>` +
      `<circle cx="34" cy="46" r="8" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M42 48 q12 -6 18 2" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M16 74 q8 -6 16 0 q8 6 16 0 q8 -6 16 0 q8 6 16 0" stroke="${SAGE}" stroke-width="2"/>` +
      label('MÔN BƠI LỘI', SAGE, 10, 92, 700)),

    'うんどう': art(
      `<circle cx="50" cy="28" r="9" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M50 37 v20 M50 44 l-16 -6 M50 44 l18 -4 M50 57 l-14 18 M50 57 l16 16" stroke="${ACCENT}" stroke-width="3.5"/>` +
      `<path d="M14 50 h10 M76 40 h10" stroke="${GOLD}" stroke-width="2.2"/>` +
      label('VẬN ĐỘNG, THỂ DỤC', ACCENT, 9, 92, 700)),

    'うんてんしゅ': art(
      person(50, 62, INK, .8) +
      `<circle cx="50" cy="34" r="16" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M34 34 h32 M50 18 v10 M50 40 v10 M39 23 l7 7 M61 23 l-7 7 M39 45 l7 -7 M61 45 l-7 -7" stroke="${ACCENT}" stroke-width="1.8"/>` +
      label('TÀI XẾ', ACCENT, 13, 92, 700)),

    'だいがくせい': art(
      person(40, 62, INK, .85) +
      cap(40, 34, GOLD) +
      doc(58, 50, 26, 22, ACCENT) +
      label('SINH VIÊN ĐẠI HỌC', ACCENT, 8, 92, 700)),

    'にゅうがくします': art(
      `<path d="M20 78 V40 h14 v38 M62 78 V40 h14 v38" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M20 40 q14 -14 28 0" stroke="${INK}" stroke-width="3"/>` +
      person(48, 68, ACCENT, .78) +
      `<path d="M58 60 h10" stroke="${GOLD}" stroke-width="2.2"/><path d="M64 56 l6 4 -6 4" stroke="${GOLD}" stroke-width="2.2"/>` +
      label('NHẬP HỌC', ACCENT, 11, 92, 700)),

    'いじょう': art(
      `<path d="M20 56 h60" stroke="${INK}" stroke-width="3"/>` +
      `<rect x="20" y="26" width="60" height="30" fill="${ACCENT}" opacity=".18" stroke="none"/>` +
      `<path d="M50 54 v-26" stroke="${ACCENT}" stroke-width="3.5"/>` +
      `<path d="M42 36 l8 -8 8 8" stroke="${ACCENT}" stroke-width="3"/>` +
      label('~ TRỞ LÊN', ACCENT, 11, 88, 700) + label('(≥)', INK, 11, 96, 600)),

    'いか': art(
      `<path d="M20 44 h60" stroke="${INK}" stroke-width="3"/>` +
      `<rect x="20" y="44" width="60" height="30" fill="${SAGE}" opacity=".18" stroke="none"/>` +
      `<path d="M50 46 v26" stroke="${SAGE}" stroke-width="3.5"/>` +
      `<path d="M42 64 l8 8 8 -8" stroke="${SAGE}" stroke-width="3"/>` +
      label('~ TRỞ XUỐNG', SAGE, 11, 88, 700) + label('(≤)', INK, 11, 96, 600)),

    'ざんねん': art(
      `<circle cx="46" cy="44" r="22" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M36 38 q4 -4 8 0 M52 38 q4 -4 8 0" stroke="${INK}" stroke-width="2.2"/>` +
      `<path d="M36 56 q10 -8 20 0" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M70 20 q10 -4 16 4 q6 -2 4 8 h-24 q-4 -8 4 -12" stroke="${SAGE}" stroke-width="2" fill="${PAPER}" opacity=".7"/>` +
      dot(74, 40, 1.8, SAGE) + dot(80, 44, 1.6, SAGE) +
      label('TIẾC, ĐÁNG TIẾC', ACCENT, 9, 94, 700)),
    // ---------- bai 28: thoi quen, cuoc song hang ngay ----------
    'つづけます': art(
      person(30, 60, ACCENT, .85) +
      `<path d="M46 50 q10 -14 24 -6 q14 8 4 20" stroke="${GOLD}" stroke-width="3"/>` +
      `<path d="M70 60 l6 6 -8 2 z" fill="${GOLD}" stroke="none"/>` +
      dot(84, 42, 2.2, GOLD) + dot(90, 48, 1.6, GOLD) +
      label('TIẾP TỤC, DUY TRÌ', GOLD, 10, 92, 700)),

    'つづきます': art(
      `<path d="M6 60 h60" stroke="${SAGE}" stroke-width="4"/>` +
      `<path d="M70 60 h6" stroke="${SAGE}" stroke-width="4" stroke-dasharray="5 5"/>` +
      dot(84, 60, 1.8, SAGE) + dot(90, 60, 1.8, SAGE) + dot(95, 60, 1.8, SAGE) +
      `<path d="M6 60 v-14" stroke="${INK}" stroke-width="2" opacity=".4"/>` +
      label('KÉO DÀI, TIẾP DIỄN', SAGE, 9, 88, 700)),

    'かよいます': art(
      house(8, 44, INK) +
      `<rect x="64" y="50" width="26" height="24" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M77 74 v-14 h6 v14" stroke="${ACCENT}" stroke-width="2"/>` +
      `<path d="M44 60 h16" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M50 55 l-6 5 6 5" stroke="${GOLD}" stroke-width="2.2"/>` +
      `<path d="M54 65 l6 -5 -6 -5" stroke="${GOLD}" stroke-width="2.2"/>` +
      label('ĐI LẠI THƯỜNG XUYÊN', GOLD, 7.8, 92, 700)),

    'かたづけます': art(
      dot(16, 22, 3, ACCENT) + dot(26, 16, 3, SAGE) + dot(20, 32, 3, GOLD) +
      `<rect x="10" y="14" width="8" height="8" stroke="${INK}" stroke-width="2" opacity=".5"/>` +
      `<path d="M36 30 h16" stroke="${GOLD}" stroke-width="2.5"/><path d="M46 25 l6 5 -6 5" stroke="${GOLD}" stroke-width="2.2"/>` +
      `<rect x="56" y="46" width="34" height="26" rx="2" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M56 46 l6 -8 h22 l6 8" stroke="${SAGE}" stroke-width="2.5"/>` +
      check(73, 60, SAGE, .8) +
      label('DỌN DẸP, SẮP XẾP', SAGE, 8.5, 92, 700)),

    'きまります': art(
      doc(28, 30, 40, 40, INK) +
      `<circle cx="66" cy="34" r="14" stroke="${ACCENT}" stroke-width="3" fill="none" opacity=".85"/>` +
      `<text x="66" y="39" font-size="12" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">決</text>` +
      `<path d="M66 20 v-6 M60 60 l6 -6 6 6" stroke="${ACCENT}" stroke-width="2" opacity=".6"/>` +
      label('ĐƯỢC QUYẾT ĐỊNH', ACCENT, 8.5, 92, 700)),

    'せいかつします': art(
      house(14, 42, INK) +
      person(66, 62, ACCENT, .8) +
      `<path d="M78 26 a12 12 0 1 1 -0.1 0" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M78 14 a12 12 0 0 0 0 24 a9 9 0 0 1 0 -24" fill="${INK}" opacity=".5" stroke="none"/>` +
      `<path d="M60 20 l4 4 M96 20 l-4 4" stroke="${GOLD}" stroke-width="1.8"/>` +
      label('SINH SỐNG, SINH HOẠT', ACCENT, 7.5, 94, 700)),

    'しゅうかん': art(
      clockFace(50, 44, 18, INK) +
      `<path d="M50 14 a30 30 0 1 1 -21 9" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M23 17 l6 6 -8 2 z" fill="${GOLD}" stroke="none"/>` +
      label('THÓI QUEN, TẬP QUÁN', GOLD, 9, 92, 700)),

    'きそく': art(
      doc(26, 20, 40, 50, INK) +
      `<path d="M32 30 h28 M32 40 h28 M32 50 h18" stroke="${SAGE}" stroke-width="2.2"/>` +
      check(70, 30, ACCENT, .7) + check(70, 42, ACCENT, .7) +
      label('QUY TẮC, NỘI QUY', INK, 9.5, 92, 700)),

    'せいかつ': art(
      house(30, 40, INK) +
      `<path d="M78 30 a14 14 0 1 1 -0.1 0" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M78 16 a14 14 0 0 0 0 28 a10 10 0 0 1 0 -28" fill="${INK}" opacity=".45" stroke="none"/>` +
      `<path d="M20 80 h60" stroke="${SAGE}" stroke-width="2" opacity=".5"/>` +
      label('CUỘC SỐNG', ACCENT, 13, 92, 700)),

    'がっこう': art(
      `<rect x="20" y="42" width="60" height="34" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M20 42 l30 -22 30 22" stroke="${INK}" stroke-width="3"/>` +
      `<rect x="42" y="56" width="16" height="20" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<rect x="26" y="50" width="10" height="10" stroke="${SAGE}" stroke-width="2"/><rect x="64" y="50" width="10" height="10" stroke="${SAGE}" stroke-width="2"/>` +
      `<path d="M50 20 v-10" stroke="${INK}" stroke-width="2.2"/><path d="M50 10 h10 v6 h-10 z" fill="${ACCENT}" stroke="none"/>` +
      label('TRƯỜNG HỌC', INK, 11, 94, 700)),

    'ひとりで': art(
      `<circle cx="50" cy="50" r="34" stroke="${INK}" stroke-width="2" stroke-dasharray="5 5" opacity=".5"/>` +
      person(50, 54, ACCENT, 1.05) +
      label('MỘT MÌNH', ACCENT, 13, 92, 700)),
    // ---------- bai 29: tu dong tu / tha dong tu, tinh tu ----------
    'しまります': art(
      `<rect x="30" y="18" width="40" height="58" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M30 18 v58" stroke="${INK}" stroke-width="4"/>` +
      dot(62, 48, 2.2, GOLD) +
      `<path d="M18 30 q8 18 0 36" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M22 34 l-4 -4 M22 62 l-4 4" stroke="${ACCENT}" stroke-width="2"/>` +
      label('ĐÓNG LẠI', ACCENT, 13, 92, 700)),

    'きえます': art(
      `<circle cx="50" cy="38" r="18" stroke="${INK}" stroke-width="2.5" stroke-dasharray="4 4" opacity=".55" fill="${PAPER}"/>` +
      `<path d="M44 56 h12 M46 62 h8" stroke="${INK}" stroke-width="2" opacity=".5"/>` +
      `<path d="M50 16 v-6 M28 38 h-6 M72 38 h6" stroke="${INK}" stroke-width="1.8" stroke-dasharray="2 3" opacity=".4"/>` +
      `<path d="M30 70 l40 -40" stroke="${ACCENT}" stroke-width="2.5" opacity=".6"/>` +
      label('TẮT ĐI, BIẾN MẤT', ACCENT, 9, 92, 700)),

    'はじまります': art(
      `<path d="M14 60 h72" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M30 60 a20 20 0 0 1 40 0 z" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 34 v-8 M32 42 l-6 -5 M68 42 l6 -5" stroke="${GOLD}" stroke-width="2.2"/>` +
      label('BẮT ĐẦU', GOLD, 14, 92, 800)),

    'はじめます': art(
      person(28, 58, ACCENT, .85) +
      `<circle cx="66" cy="46" r="18" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M60 38 l14 8 -14 8 z" fill="${GOLD}" stroke="none"/>` +
      `<path d="M44 52 h10" stroke="${ACCENT}" stroke-width="2.2"/>` +
      label('BẮT ĐẦU', ACCENT, 14, 92, 800)),

    'つきます': art(
      `<circle cx="50" cy="40" r="18" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M44 58 h12 M46 64 h8" stroke="${GOLD}" stroke-width="2.2"/>` +
      `<path d="M50 16 v-8 M26 40 h-8 M74 40 h8 M33 23 l-6 -6 M67 23 l6 -6" stroke="${GOLD}" stroke-width="2.5"/>` +
      label('SÁNG LÊN, BẬT LÊN', GOLD, 9, 92, 700)),

    'こわします': art(
      person(28, 48, ACCENT, .8) +
      `<path d="M40 44 l18 -12" stroke="${INK}" stroke-width="3.5"/>` +
      `<rect x="56" y="26" width="16" height="10" rx="2" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<rect x="30" y="64" width="38" height="12" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M38 64 l5 12 M58 64 l-5 12" stroke="${GOLD}" stroke-width="2"/>` +
      burst(64, 58, 9, ACCENT, ACCENT) +
      label('LÀM HỎNG', ACCENT, 12, 92, 700)),

    'やめます': art(
      `<rect x="14" y="58" width="30" height="18" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<rect x="20" y="50" width="8" height="8" stroke="${GOLD}" stroke-width="2"/>` +
      person(70, 54, ACCENT, .8) +
      `<path d="M60 46 h-8" stroke="${ACCENT}" stroke-width="2.2"/><path d="M54 42 l-6 4 6 4" stroke="${ACCENT}" stroke-width="2.2"/>` +
      `<circle cx="50" cy="20" r="12" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M42 20 h16" stroke="${ACCENT}" stroke-width="3"/>` +
      label('DỪNG HẲN, TỪ BỎ', ACCENT, 9, 92, 700)),

    'ドア': art(
      `<rect x="30" y="14" width="40" height="66" rx="2" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="36" y="20" width="28" height="24" rx="1" stroke="${SAGE}" stroke-width="2" opacity=".6"/>` +
      `<rect x="36" y="50" width="28" height="24" rx="1" stroke="${SAGE}" stroke-width="2" opacity=".6"/>` +
      dot(62, 48, 3, GOLD) +
      label('CỬA (kiểu Tây)', GOLD, 11, 92, 700)),

    'うつくしい': art(
      `<path d="M50 74 q-20 0 -20 -22 q0 -20 20 -34 q20 14 20 34 q0 22 -20 22 z" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M50 74 q-12 0 -12 -22 q0 -16 12 -28 q12 12 12 28 q0 22 -12 22 z" stroke="${GOLD}" stroke-width="2" fill="${PAPER}"/>` +
      sparkle(18, 24, 8, GOLD) + sparkle(82, 30, 7, GOLD) + sparkle(78, 66, 6, ACCENT) +
      label('ĐẸP, TRÁNG LỆ', GOLD, 10, 92, 700)),

    'おもいだします': art(
      `<circle cx="34" cy="44" r="18" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M46 34 q14 -4 22 6" stroke="${GOLD}" stroke-width="2.2" stroke-dasharray="3 3"/>` +
      `<path d="M64 36 l6 2 -3 6 z" fill="${GOLD}" stroke="none"/>` +
      `<circle cx="76" cy="24" r="12" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M71 24 l4 4 7 -8" stroke="${GOLD}" stroke-width="2.2"/>` +
      dot(56, 20, 2.4, GOLD) + dot(62, 14, 1.8, GOLD) +
      label('NHỚ LẠI, HỒI TƯỞNG', ACCENT, 8, 92, 700)),

    'きゅうに': art(
      burst(50, 46, 30, ACCENT, PAPER) +
      `<text x="50" y="54" font-size="30" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">!</text>` +
      label('ĐỘT NGỘT, BỖNG NHIÊN', ACCENT, 8, 92, 800)),
    // ---------- bai 30: chuan bi tiec, do vat ----------
    'じゅんびします': art(
      person(26, 56, ACCENT, .82) +
      doc(44, 32, 26, 32, INK) +
      check(57, 42, SAGE, .8) + check(57, 54, SAGE, .8) +
      `<path d="M44 68 q-8 4 -14 0" stroke="${GOLD}" stroke-width="2" opacity=".6"/>` +
      label('CHUẨN BỊ', ACCENT, 13, 92, 700)),

    'ようい': art(
      `<path d="M28 46 h44 l-4 30 h-36 z" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 46 v-8 a10 8 0 0 1 20 0 v8" stroke="${GOLD}" stroke-width="2.5"/>` +
      check(50, 62, SAGE, 1.1) +
      label('SỰ CHUẨN BỊ', GOLD, 11, 92, 700)),

    'かざります': art(
      `<path d="M14 26 q18 14 36 0 q18 -14 36 0" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M24 26 l4 10 M40 30 l4 10 M56 28 l4 10 M72 26 l4 10" stroke="${GOLD}" stroke-width="2"/>` +
      dot(24, 38, 3, GOLD) + dot(44, 42, 3, ACCENT) + dot(60, 40, 3, SAGE) + dot(76, 38, 3, GOLD) +
      person(30, 70, INK, .7) +
      `<path d="M40 56 q6 -10 12 -14" stroke="${INK}" stroke-width="2" opacity=".6"/>` +
      label('TRANG TRÍ, BÀY BIỆN', ACCENT, 8.5, 92, 700)),

    'しらべます': art(
      doc(20, 34, 40, 40, INK) +
      `<circle cx="70" cy="46" r="14" stroke="${ACCENT}" stroke-width="3.5" fill="none"/>` +
      `<path d="M80 56 l12 12" stroke="${ACCENT}" stroke-width="4"/>` +
      label('TRA CỨU, KIỂM TRA', INK, 8.5, 92, 700)),

    'よやくします': art(
      `<rect x="20" y="24" width="56" height="48" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M20 38 h56" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M32 24 v-8 M64 24 v-8" stroke="${INK}" stroke-width="2.5"/>` +
      `<circle cx="60" cy="56" r="11" stroke="${ACCENT}" stroke-width="2.8" fill="${PAPER}"/>` +
      check(60, 56, ACCENT, .75) +
      label('ĐẶT TRƯỚC, ĐẶT CHỖ', GOLD, 7.5, 92, 700)),

    'パーティー': art(
      `<circle cx="30" cy="30" r="14" stroke="${ACCENT}" stroke-width="2.8" fill="${PAPER}"/><path d="M30 44 l0 10" stroke="${ACCENT}" stroke-width="2"/>` +
      `<circle cx="60" cy="24" r="12" stroke="${GOLD}" stroke-width="2.8" fill="${PAPER}"/><path d="M60 36 l0 12" stroke="${GOLD}" stroke-width="2"/>` +
      `<circle cx="78" cy="42" r="10" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/><path d="M78 52 l0 10" stroke="${SAGE}" stroke-width="2"/>` +
      dot(20, 70, 2.4, ACCENT) + dot(40, 76, 2, GOLD) + dot(56, 72, 2.2, SAGE) + dot(70, 78, 2, ACCENT) + dot(86, 68, 2.2, GOLD) +
      label('BỮA TIỆC', ACCENT, 14, 92, 800)),

    'のみもの': art(
      `<path d="M34 38 h32 l-4 34 a12 12 0 0 1 -24 0 z" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M60 30 l4 -14" stroke="${SAGE}" stroke-width="3"/>` +
      dot(44, 50, 2.4, GOLD) + dot(54, 58, 2.4, ACCENT) + dot(48, 64, 2, GOLD) +
      label('ĐỒ UỐNG', SAGE, 13, 92, 700)),

    'たべもの': art(
      `<circle cx="46" cy="58" r="24" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      dot(38, 52, 5, GOLD) + dot(50, 50, 5, ACCENT) + dot(58, 58, 4.5, SAGE) +
      `<path d="M80 30 v20 M76 30 v10 M84 30 v10" stroke="${INK}" stroke-width="2.2"/>` +
      label('ĐỒ ĂN', ACCENT, 14, 92, 700)),

    'かべ': art(
      `<rect x="16" y="20" width="68" height="56" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M16 36 h68 M16 52 h68 M16 68 h68" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M36 20 v16 M64 20 v16 M20 36 v16 M50 36 v16 M80 36 v16 M36 52 v16 M64 52 v16" stroke="${INK}" stroke-width="2"/>` +
      label('BỨC TƯỜNG', INK, 12, 92, 700)),
    // ---------- bai 31: the y chi, tuong lai, ke hoach ----------
    'いこう': art(
      `<ellipse cx="24" cy="66" rx="6" ry="9" stroke="${INK}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<ellipse cx="40" cy="54" rx="6" ry="9" stroke="${INK}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<path d="M54 50 h26" stroke="${ACCENT}" stroke-width="4"/><path d="M70 40 l10 10 -10 10" stroke="${ACCENT}" stroke-width="4"/>` +
      `<text x="50" y="26" font-size="20" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">!</text>` +
      label('THÔI, ĐI THÔI!', ACCENT, 11, 92, 700)),

    'たべよう': art(
      `<path d="M28 58 a22 12 0 0 0 44 0 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M26 58 h48" stroke="${ACCENT}" stroke-width="3"/>` +
      dot(40, 54, 4, GOLD) + dot(52, 52, 4, SAGE) +
      `<path d="M78 30 v18 M74 30 v9 M82 30 v9" stroke="${INK}" stroke-width="2.2"/>` +
      `<text x="50" y="24" font-size="18" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">!</text>` +
      label('THÔI, ĂN THÔI!', ACCENT, 10, 92, 700)),

    'しよう': art(
      `<circle cx="50" cy="40" r="14" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 54 v14 M50 60 l-14 14 M50 60 l14 14" stroke="${INK}" stroke-width="3.5"/>` +
      `<path d="M50 54 l-4 -18" stroke="${INK}" stroke-width="3.5"/>` +
      dot(45, 34, 7, ACCENT) +
      sparkle(76, 20, 8, GOLD) + sparkle(20, 26, 6, GOLD) +
      label('THÔI, LÀM THÔI!', GOLD, 10, 92, 700)),

    'こよう': art(
      person(70, 56, ACCENT, .85) +
      `<path d="M58 48 q-8 -4 -14 2" stroke="${ACCENT}" stroke-width="2.5"/><path d="M46 46 l-4 6 7 1" stroke="${ACCENT}" stroke-width="2.2"/>` +
      `<ellipse cx="26" cy="70" rx="6" ry="9" stroke="${INK}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<ellipse cx="14" cy="58" rx="5" ry="8" stroke="${INK}" stroke-width="2" fill="${PAPER}" opacity=".6"/>` +
      `<text x="50" y="22" font-size="16" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">!</text>` +
      label('THÔI, ĐẾN THÔI!', ACCENT, 10, 92, 700)),

    'きめます': art(
      `<rect x="14" y="50" width="26" height="20" rx="2" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<rect x="60" y="50" width="26" height="20" rx="2" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M60 34 l14 -14 6 6" stroke="${ACCENT}" stroke-width="3.5"/>` +
      check(73, 60, GOLD, .8) +
      label('QUYẾT ĐỊNH', GOLD, 13, 92, 700)),

    'けいかくします': art(
      person(24, 60, INK, .82) +
      doc(42, 30, 40, 40, ACCENT) +
      `<path d="M50 42 h20 M50 52 h14 M50 62 h20" stroke="${SAGE}" stroke-width="2"/>` +
      `<path d="M36 52 l8 -4" stroke="${GOLD}" stroke-width="2.5"/><path d="M44 48 l4 4 -8 3 z" fill="${GOLD}" stroke="none"/>` +
      label('LẬP KẾ HOẠCH', ACCENT, 11, 92, 700)),

    'しょうらい': art(
      `<path d="M40 80 L48 40 h4 L60 80 Z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M46 66 h8 M47 54 h6" stroke="${INK}" stroke-width="1.6" opacity=".5"/>` +
      `<path d="M50 40 a16 16 0 0 1 16 16" stroke="${GOLD}" stroke-width="3"/>` +
      `<path d="M50 24 v-8 M34 40 l-6 -4 M82 46 h8" stroke="${GOLD}" stroke-width="2.2"/>` +
      label('TƯƠNG LAI', GOLD, 14, 92, 800)),

    'ゆめ': art(
      `<ellipse cx="34" cy="72" rx="24" ry="8" stroke="${INK}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<circle cx="24" cy="66" r="10" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      zzz(42, 54, ACCENT) +
      `<path d="M58 34 a14 14 0 1 1 26 6 a10 10 0 0 1 -4 20 h-16 a10 10 0 0 1 -6 -26 z" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      star(72, 44, 7, GOLD, GOLD) +
      label('GIẤC MƠ, ƯỚC MƠ', GOLD, 8.5, 92, 700)),

    'けいかく': art(
      doc(24, 22, 52, 56, INK) +
      check(34, 36, SAGE, .65) + `<path d="M42 36 h26" stroke="${SAGE}" stroke-width="2"/>` +
      check(34, 50, GOLD, .65) + `<path d="M42 50 h26" stroke="${GOLD}" stroke-width="2"/>` +
      `<circle cx="34" cy="64" r="5" stroke="${ACCENT}" stroke-width="2.2"/>` + `<path d="M42 64 h26" stroke="${ACCENT}" stroke-width="2"/>` +
      label('KẾ HOẠCH', INK, 13, 92, 700)),

    'りゅうがく': art(
      `<path d="M14 54 L60 40 L86 46 L60 52 L48 66 L40 62 L46 50 L14 54 Z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M60 40 l6 -14 6 4 -4 12" stroke="${INK}" stroke-width="2"/>` +
      cap(30, 24, GOLD) +
      `<path d="M70 70 q10 4 16 -2" stroke="${SAGE}" stroke-width="2" opacity=".6"/>` +
      label('DU HỌC', GOLD, 13, 92, 700)),

    'そつぎょうします': art(
      cap(50, 28, GOLD) +
      `<path d="M50 46 v6" stroke="${GOLD}" stroke-width="2" opacity=".5"/>` +
      `<path d="M30 70 h26 v14 h-26 z" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M56 74 l14 -4 M56 80 l14 4" stroke="${ACCENT}" stroke-width="2"/>` +
      person(30, 72, INK, .55) +
      `<path d="M40 22 l-6 -8 M60 22 l6 -8" stroke="${GOLD}" stroke-width="2" opacity=".6"/>` +
      label('TỐT NGHIỆP', GOLD, 13, 92, 700)),
    // ---------- bai 32: suc khoe, co the ----------
    'ふとります': art(
      `<circle cx="34" cy="46" r="14" stroke="${INK}" stroke-width="2.2" opacity=".5"/>` +
      `<circle cx="62" cy="50" r="24" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="62" cy="26" r="10" stroke="${ACCENT}" stroke-width="2.8" fill="${PAPER}"/>` +
      `<path d="M84 40 v-10 M79 35 h10" stroke="${GOLD}" stroke-width="2.5"/>` +
      label('TĂNG CÂN, BÉO LÊN', ACCENT, 8.5, 92, 700)),

    'やせます': art(
      `<circle cx="30" cy="46" r="22" stroke="${INK}" stroke-width="2.2" opacity=".4"/>` +
      `<circle cx="30" cy="26" r="9" stroke="${INK}" stroke-width="2" opacity=".4"/>` +
      `<path d="M66 56 h16 v14 h-16 z" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="74" cy="36" r="8" stroke="${SAGE}" stroke-width="2.8" fill="${PAPER}"/>` +
      `<path d="M60 50 h-10" stroke="${GOLD}" stroke-width="2.5"/>` +
      label('GIẢM CÂN, GẦY ĐI', SAGE, 9, 92, 700)),

    'なおします': art(
      person(28, 60, SAGE, .8) +
      `<path d="M46 54 h10" stroke="${GOLD}" stroke-width="2.2"/>` +
      person(70, 56, ACCENT, .85) +
      `<circle cx="60" cy="45" r="11" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M60 40 v10 M55 45 h10" stroke="${ACCENT}" stroke-width="3"/>` +
      label('CHỮA TRỊ', ACCENT, 13, 92, 700)),

    'きをつけます': art(
      `<path d="M14 50 q26 -20 52 0 q-26 20 -52 0 z" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="40" cy="50" r="9" stroke="${INK}" stroke-width="3"/>` + dot(40, 50, 3, INK) +
      `<text x="78" y="34" font-size="26" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">!</text>` +
      person(70, 70, INK, .55) +
      label('CẨN THẬN, LƯU Ý', GOLD, 9.5, 92, 700)),

    'はいしゃ': art(
      `<path d="M50 20 q-16 0 -16 16 q0 10 4 22 q3 12 8 12 q4 0 4 -14 q0 -6 4 -6 q4 0 4 6 q0 14 4 14 q5 0 8 -12 q4 -12 4 -22 q0 -16 -16 -16 z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<circle cx="78" cy="28" r="12" stroke="${SAGE}" stroke-width="2.8" fill="${PAPER}"/>` +
      `<path d="M72 28 h12 M78 22 v12" stroke="${SAGE}" stroke-width="2.2"/>` +
      label('NHA SĨ', SAGE, 14, 92, 700)),

    'けんこう': art(
      `<path d="M50 66 C22 44 34 20 50 32 C66 20 78 44 50 66 Z" stroke="${SAGE}" stroke-width="3.5" fill="${PAPER}"/>` +
      `<path d="M24 46 h12 l4 -10 6 18 6 -12 4 4 h12" stroke="${ACCENT}" stroke-width="2.5"/>` +
      label('SỨC KHỎE, KHỎE MẠNH', SAGE, 8.5, 92, 700)),
  };

  window.SenseiArt.extend(EXTRA);

  // Alias sang dang kanji cho tung tu co kanji
  window.SenseiArt.extend({
    // bai 26
    '寝坊します': EXTRA['ねぼうします'],
    '遅れます': EXTRA['おくれます'],
    '壊れます': EXTRA['こわれます'],
    '治ります': EXTRA['なおります'],
    '事故': EXTRA['じこ'],
    '理由': EXTRA['りゆう'],
    '具合': EXTRA['ぐあい'],
    '熱': EXTRA['ねつ'],
    '風邪': EXTRA['かぜ'],
    '大抵': EXTRA['たいてい'],
    '意見': EXTRA['いけん'],
    // bai 27
    '話せます': EXTRA['はなせます'],
    '泳げます': EXTRA['およげます'],
    '飲めます': EXTRA['のめます'],
    '食べられます': EXTRA['たべられます'],
    '見られます': EXTRA['みられます'],
    '来られます': EXTRA['こられます'],
    '会話': EXTRA['かいわ'],
    '水泳': EXTRA['すいえい'],
    '運動': EXTRA['うんどう'],
    '運転手': EXTRA['うんてんしゅ'],
    '大学生': EXTRA['だいがくせい'],
    '入学します': EXTRA['にゅうがくします'],
    '以上': EXTRA['いじょう'],
    '以下': EXTRA['いか'],
    '残念': EXTRA['ざんねん'],
    // bai 28
    '続けます': EXTRA['つづけます'],
    '続きます': EXTRA['つづきます'],
    '通います': EXTRA['かよいます'],
    '片付けます': EXTRA['かたづけます'],
    '決まります': EXTRA['きまります'],
    '生活します': EXTRA['せいかつします'],
    '習慣': EXTRA['しゅうかん'],
    '規則': EXTRA['きそく'],
    '生活': EXTRA['せいかつ'],
    '学校': EXTRA['がっこう'],
    '一人で': EXTRA['ひとりで'],
    // bai 29
    '閉まります': EXTRA['しまります'],
    '消えます': EXTRA['きえます'],
    '始まります': EXTRA['はじまります'],
    '始めます': EXTRA['はじめます'],
    '点きます': EXTRA['つきます'],
    '壊します': EXTRA['こわします'],
    '止めます': EXTRA['やめます'],
    '辞めます': EXTRA['やめます'],
    '美しい': EXTRA['うつくしい'],
    '思い出します': EXTRA['おもいだします'],
    '急に': EXTRA['きゅうに'],
    // bai 30
    '準備します': EXTRA['じゅんびします'],
    '用意': EXTRA['ようい'],
    '飾ります': EXTRA['かざります'],
    '調べます': EXTRA['しらべます'],
    '予約します': EXTRA['よやくします'],
    '飲み物': EXTRA['のみもの'],
    '食べ物': EXTRA['たべもの'],
    '壁': EXTRA['かべ'],
    // bai 31
    '行こう': EXTRA['いこう'],
    '食べよう': EXTRA['たべよう'],
    '来よう': EXTRA['こよう'],
    '決めます': EXTRA['きめます'],
    '計画します': EXTRA['けいかくします'],
    '将来': EXTRA['しょうらい'],
    '夢': EXTRA['ゆめ'],
    '計画': EXTRA['けいかく'],
    '留学': EXTRA['りゅうがく'],
    '卒業します': EXTRA['そつぎょうします'],
    // bai 32
    '太ります': EXTRA['ふとります'],
    '痩せます': EXTRA['やせます'],
    '治します': EXTRA['なおします'],
    '気を付けます': EXTRA['きをつけます'],
    '歯医者': EXTRA['はいしゃ'],
    '健康': EXTRA['けんこう'],
  });
})();
