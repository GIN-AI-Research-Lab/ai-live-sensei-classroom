/**
 * Sensei Art — lo minh hoa bo sung N5 (lo 2/5): bai 3-6, ~85 tu.
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

  // ---- helper nho de khong lap lai code ve giong nhau 85 lan ----

  /** Chu chu thich tieng Viet, canh giua, o day khung */
  function cap(text, color, size) {
    return `<text x="50" y="93" font-size="${size || 11}" fill="${color || INK}" font-weight="600" ` +
           `text-anchor="middle" stroke="none">${text}</text>`;
  }

  /** Mat dong ho: vong tron + 4 cham gio + kim gio/kim phut theo goc do */
  function clockFace(cx, cy, r, hDeg, mDeg, color) {
    const rad = Math.PI / 180;
    const hx = (cx + r * 0.5 * Math.sin(hDeg * rad)).toFixed(1);
    const hy = (cy - r * 0.5 * Math.cos(hDeg * rad)).toFixed(1);
    const mx = (cx + r * 0.78 * Math.sin(mDeg * rad)).toFixed(1);
    const my = (cy - r * 0.78 * Math.cos(mDeg * rad)).toFixed(1);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${color}" stroke-width="3" fill="${PAPER}"/>` +
           `<circle cx="${cx}" cy="${cy - r}" r="1.6" fill="${color}" stroke="none"/>` +
           `<circle cx="${cx}" cy="${cy + r}" r="1.6" fill="${color}" stroke="none"/>` +
           `<circle cx="${cx - r}" cy="${cy}" r="1.6" fill="${color}" stroke="none"/>` +
           `<circle cx="${cx + r}" cy="${cy}" r="1.6" fill="${color}" stroke="none"/>` +
           `<path d="M${cx} ${cy} L${hx} ${hy}" stroke="${color}" stroke-width="3.2"/>` +
           `<path d="M${cx} ${cy} L${mx} ${my}" stroke="${color}" stroke-width="2.4"/>` +
           `<circle cx="${cx}" cy="${cy}" r="2" fill="${color}" stroke="none"/>`;
  }

  /** Mat troi toa tia */
  function sunIcon(cx, cy, r, color) {
    let rays = '';
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      const x1 = (cx + (r + 3) * Math.cos(a)).toFixed(1), y1 = (cy + (r + 3) * Math.sin(a)).toFixed(1);
      const x2 = (cx + (r + 9) * Math.cos(a)).toFixed(1), y2 = (cy + (r + 9) * Math.sin(a)).toFixed(1);
      rays += `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${color}" stroke-width="3"/>`;
    }
    return `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${color}" stroke-width="3" fill="${PAPER}"/>` + rays;
  }

  /** Trang luoi liem */
  function moonIcon(cx, cy, r, color) {
    return `<path d="M${(cx + r * 0.5).toFixed(1)} ${(cy - r).toFixed(1)} a${r} ${r} 0 1 0 0 ${(2 * r).toFixed(1)} ` +
           `a${(r * 0.7).toFixed(1)} ${(r * 0.7).toFixed(1)} 0 1 1 0 -${(2 * r).toFixed(1)}" fill="${color}" stroke="none"/>`;
  }

  /** Vong lap lai (mui ten cong) — dung cho "moi ngay/luon luon" */
  function cycleIcon(cx, cy, r, color) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${color}" stroke-width="3" ` +
           `stroke-dasharray="${(r * 1.7).toFixed(1)} ${(r * 1.05).toFixed(1)}"/>` +
           `<path d="M${cx + r} ${cy - 5} l6 5 l-6 5" stroke="${color}" stroke-width="3"/>`;
  }

  /** Dai 7 o vuong (7 ngay trong tuan), o thu hi (0-6) duoc to mau */
  function week(hi, hiColor) {
    let s = '';
    for (let i = 0; i < 7; i++) {
      const x = (10 + i * 11.5).toFixed(1);
      const on = i === hi;
      s += `<rect x="${x}" y="56" width="9" height="14" rx="1.5" stroke="${on ? hiColor : INK}" ` +
           `stroke-width="2.2" fill="${on ? hiColor : PAPER}"/>`;
    }
    return s;
  }

  /** Trang lich treo tuong: khung + 2 vong mac o tren */
  function page(x, y, w, h, color) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" stroke="${color}" stroke-width="3" fill="${PAPER}"/>` +
           `<path d="M${x} ${y + 9} h${w}" stroke="${color}" stroke-width="2.5"/>` +
           `<path d="M${x + w * 0.25} ${y - 4} v9 M${x + w * 0.75} ${y - 4} v9" stroke="${color}" stroke-width="3"/>`;
  }

  /** Mui ten thang, huong trai/phai tuy dx */
  function arrow(x, y, dx, color) {
    const x2 = x + dx;
    const ax = dx > 0 ? x2 - 6 : x2 + 6;
    return `<path d="M${x} ${y} h${dx}" stroke="${color}" stroke-width="3"/>` +
           `<path d="M${ax} ${y - 6} L${x2} ${y} L${ax} ${y + 6}" stroke="${color}" stroke-width="3"/>`;
  }

  const EXTRA = {
    // ---------- Bai 3: xin/moi/nha ve sinh/thuoc la ----------
    'まん': art(
      `<rect x="16" y="36" width="68" height="34" rx="4" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="32" cy="53" r="11" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<text x="32" y="58" font-size="13" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">¥</text>` +
      `<text x="60" y="59" font-size="15" fill="${INK}" font-weight="800" text-anchor="middle" stroke="none">10,000</text>` +
      cap('1 vạn (10.000)', GOLD, 10)),

    'すみません': art(
      person(40, 50, INK, .95) +
      `<path d="M58 26 q8 9 0 16 q-8 -7 0 -16 z" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M62 46 h20" stroke="${SAGE}" stroke-width="2.5" stroke-dasharray="1 4"/>` +
      cap('xin lỗi / cho hỏi', ACCENT, 9.5)),

    '[〜を]ください': art(
      `<path d="M18 62 q-5 -20 11 -22 q2 -6 8 -4 q3 -5 9 -2 q5 -4 10 1 q6 2 4 11 l-3 16 z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      arrow(46, 50, 18, GOLD) +
      `<rect x="70" y="38" width="20" height="18" rx="2" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M70 47 h20 M80 38 v18" stroke="${ACCENT}" stroke-width="2.2"/>` +
      cap('cho tôi ~', GOLD, 11)),

    'みせてください': art(
      `<rect x="20" y="30" width="30" height="36" rx="3" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M27 40 h16 M27 48 h16 M27 56 h10" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<circle cx="66" cy="48" r="14" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M76 58 l12 12" stroke="${INK}" stroke-width="4"/>` +
      cap('cho xem thử', ACCENT, 10)),

    'じゃ': art(
      `<circle cx="28" cy="46" r="15" stroke="${INK}" stroke-width="3" stroke-dasharray="4 4"/>` +
      arrow(48, 46, 18, GOLD) +
      `<circle cx="82" cy="46" r="15" stroke="${ACCENT}" stroke-width="3.5"/>` +
      cap('vậy thì, thế thì', GOLD, 9.5)),

    '〜でございます': art(
      `<circle cx="36" cy="28" r="9" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M28 66 l6 -30 a10 10 0 0 1 18 6 l4 24" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M58 26 l15 -5 M58 33 l17 1 M58 40 l15 7" stroke="${GOLD}" stroke-width="2.5"/>` +
      cap('là ~ (kính ngữ)', GOLD, 9)),

    'おてあらい': art(
      `<rect x="30" y="14" width="40" height="62" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      person(50, 56, SAGE, .5) +
      `<circle cx="64" cy="45" r="2.2" fill="${INK}" stroke="none"/>` +
      `<path d="M80 16 q9 11 0 20 q-9 -9 0 -20 z" fill="${ACCENT}" stroke="none"/>` +
      cap('nhà vệ sinh', SAGE, 11)),

    'たばこ': art(
      `<rect x="18" y="52" width="48" height="10" rx="2" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="60" y="52" width="10" height="10" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M70 52 q7 -9 1 -18 q6 6 1 14" stroke="${INK}" stroke-width="2.2" stroke-dasharray="1 3"/>` +
      cap('thuốc lá', INK, 11)),

    // ---------- Bai 4: gio giac & sinh hoat hang ngay ----------
    'いま': art(
      clockFace(50, 48, 22, 315, 45, ACCENT) +
      `<path d="M50 16 v8" stroke="${GOLD}" stroke-width="3"/><path d="M45 21 l5 5 l5 -5" stroke="${GOLD}" stroke-width="3"/>` +
      cap('bây giờ', ACCENT, 12)),

    '〜じ': art(
      clockFace(50, 46, 26, 270, 0, INK) +
      cap('~ giờ', INK, 13)),

    '〜ふん／〜ぷん': art(
      clockFace(50, 46, 26, 90, 300, SAGE) +
      cap('~ phút', SAGE, 12.5)),

    'はん': art(
      `<circle cx="50" cy="46" r="28" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M50 18 A28 28 0 0 1 50 74 Z" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M50 18 v56" stroke="${INK}" stroke-width="2.5"/>` +
      cap('rưỡi, một nửa', ACCENT, 10.5)),

    '〜じかん': art(
      clockFace(46, 46, 22, 0, 0, INK) +
      `<path d="M46 24 A22 22 0 0 1 64 56" stroke="${GOLD}" stroke-width="3" stroke-dasharray="3 3"/>` +
      `<path d="M60 54 l5 4 l-7 3" stroke="${GOLD}" stroke-width="2.5"/>` +
      cap('~ tiếng đồng hồ', GOLD, 9)),

    'なんじ': art(
      clockFace(50, 46, 26, 0, 0, INK) +
      `<circle cx="50" cy="46" r="14" fill="${PAPER}" stroke="none"/>` +
      `<text x="50" y="53" font-size="22" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      cap('mấy giờ?', ACCENT, 12)),

    'ごぜん': art(
      sunIcon(38, 42, 14, GOLD) +
      `<path d="M10 74 h80" stroke="${INK}" stroke-width="2.5"/>` +
      `<text x="72" y="50" font-size="15" fill="${INK}" font-weight="800" text-anchor="middle" stroke="none">AM</text>` +
      cap('buổi sáng (AM)', GOLD, 10)),

    'ごご': art(
      sunIcon(38, 46, 16, ACCENT) +
      `<path d="M10 74 h80" stroke="${INK}" stroke-width="2.5"/>` +
      `<text x="72" y="52" font-size="15" fill="${INK}" font-weight="800" text-anchor="middle" stroke="none">PM</text>` +
      cap('buổi chiều (PM)', ACCENT, 9.5)),

    'あさ': art(
      sunIcon(50, 54, 16, GOLD) +
      `<path d="M8 66 h84" stroke="${SAGE}" stroke-width="3"/>` +
      cap('buổi sáng', GOLD, 12)),

    'けさ': art(
      sunIcon(50, 50, 15, GOLD) +
      `<path d="M8 64 h84" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M80 16 q9 11 0 20 q-9 -9 0 -20 z" fill="${ACCENT}" stroke="none"/>` +
      cap('sáng nay', ACCENT, 12)),

    'きょう': art(
      page(30, 24, 40, 48, INK) +
      `<circle cx="50" cy="58" r="11" fill="${ACCENT}" stroke="none"/>` +
      cap('hôm nay', ACCENT, 12)),

    'あした': art(
      page(14, 30, 30, 38, INK) +
      page(54, 30, 30, 38, ACCENT) +
      arrow(46, 49, 8, GOLD) +
      cap('ngày mai', ACCENT, 12)),

    'きのう': art(
      page(54, 30, 30, 38, INK) +
      page(14, 30, 30, 38, ACCENT) +
      arrow(52, 49, -8, GOLD) +
      cap('hôm qua', ACCENT, 12)),

    'こんばん': art(
      moonIcon(46, 42, 15, INK) +
      `<path d="M70 26 l3 -3 M76 34 h4 M70 44 l3 3" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M8 66 h84" stroke="${SAGE}" stroke-width="3"/>` +
      cap('tối nay', GOLD, 12)),

    'げつようび': art(
      moonIcon(15, 28, 9, ACCENT) + week(0, ACCENT) +
      cap('thứ Hai', ACCENT, 12)),

    'かようび': art(
      `<path d="M26 14 q8 8 4 15 q5 -1 3 6 q-2 7 -10 7 q-8 0 -9 -7 q-1 -5 4 -8 q3 -2 2 -7 q0 -3 6 -6 z" fill="${ACCENT}" stroke="none"/>` +
      week(1, ACCENT) +
      cap('thứ Ba', ACCENT, 12)),

    'きんようび': art(
      `<circle cx="61" cy="28" r="10" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<text x="61" y="32" font-size="11" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">¥</text>` +
      week(4, GOLD) +
      cap('thứ Sáu', GOLD, 12)),

    'なんようび': art(
      `<text x="50" y="36" font-size="24" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      week(-1, ACCENT) +
      cap('thứ mấy?', ACCENT, 12)),

    'まいあさ': art(
      sunIcon(36, 40, 13, GOLD) + cycleIcon(68, 42, 15, GOLD) +
      cap('mỗi sáng', GOLD, 12)),

    'まいばん': art(
      moonIcon(34, 38, 12, INK) + cycleIcon(68, 42, 15, INK) +
      cap('mỗi tối', INK, 12)),

    'まいにち': art(
      sunIcon(34, 32, 10, GOLD) + moonIcon(64, 30, 8, INK) +
      `<path d="M34 32 h26" stroke="${SAGE}" stroke-width="2" stroke-dasharray="2 3"/>` +
      cycleIcon(50, 64, 15, ACCENT) +
      cap('mỗi ngày', ACCENT, 11)),

    'せんしゅう': art(
      `<rect x="10" y="42" width="22" height="18" rx="3" fill="${ACCENT}" stroke="${ACCENT}" stroke-width="3"/>` +
      `<rect x="39" y="42" width="22" height="18" rx="2.5" stroke="${INK}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<rect x="68" y="42" width="22" height="18" rx="2.5" stroke="${INK}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<path d="M21 30 v8" stroke="${ACCENT}" stroke-width="3"/><path d="M16 33 l5 -5 l5 5" stroke="${ACCENT}" stroke-width="3"/>` +
      cap('tuần trước', ACCENT, 11)),

    'らいしゅう': art(
      `<rect x="10" y="42" width="22" height="18" rx="2.5" stroke="${INK}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<rect x="39" y="42" width="22" height="18" rx="2.5" stroke="${INK}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<rect x="68" y="42" width="22" height="18" rx="3" fill="${ACCENT}" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M79 30 v8" stroke="${ACCENT}" stroke-width="3"/><path d="M74 33 l5 -5 l5 5" stroke="${ACCENT}" stroke-width="3"/>` +
      cap('tuần sau', ACCENT, 12)),

    'ぎんこう': art(
      `<path d="M12 40 L50 16 L88 40" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M20 40 v32 M38 40 v32 M62 40 v32 M80 40 v32" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M10 76 h80" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="50" cy="54" r="10" stroke="${GOLD}" stroke-width="3"/>` +
      `<text x="50" y="58" font-size="12" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">¥</text>` +
      cap('ngân hàng', GOLD, 12)),

    'としょかん': art(
      `<path d="M12 34 L50 14 L88 34" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M18 34 v42 h64 v-42" stroke="${INK}" stroke-width="3"/>` +
      `<rect x="30" y="46" width="10" height="26" fill="${ACCENT}" stroke="none"/>` +
      `<rect x="42" y="46" width="10" height="26" fill="${SAGE}" stroke="none"/>` +
      `<rect x="54" y="46" width="10" height="26" fill="${GOLD}" stroke="none"/>` +
      cap('thư viện', INK, 12)),

    'えいが': art(
      `<rect x="16" y="26" width="68" height="44" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M16 38 l14 -12 M34 38 l14 -12 M52 38 l14 -12 M70 38 l14 -12" stroke="${INK}" stroke-width="2.2"/>` +
      `<path d="M42 42 l18 12 -18 12 z" fill="${ACCENT}" stroke="none"/>` +
      cap('phim, điện ảnh', ACCENT, 10)),

    'やすみ': art(
      `<path d="M70 82 v-64" stroke="${INK}" stroke-width="4"/>` +
      `<path d="M70 20 q-16 4 -16 20 q16 -2 16 -20" fill="${SAGE}" stroke="none"/>` +
      `<path d="M70 34 q14 4 14 18 q-14 -2 -14 -18" fill="${SAGE}" stroke="none"/>` +
      person(38, 64, ACCENT, .8) +
      `<path d="M52 66 l14 -4" stroke="${ACCENT}" stroke-width="3"/>` +
      cap('ngày nghỉ', SAGE, 12)),

    'ばんごう': art(
      `<rect x="16" y="34" width="68" height="30" rx="4" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M16 34 l10 -10 h10 l-10 10 z" fill="${ACCENT}" stroke="none"/>` +
      `<text x="56" y="55" font-size="16" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">No.12</text>` +
      cap('số hiệu, số đt', GOLD, 10)),

    'おきます': art(
      `<path d="M14 74 h50 M14 74 v-10 h50 v10" stroke="${INK}" stroke-width="2.8"/>` +
      person(34, 52, ACCENT, .75) +
      sunIcon(78, 30, 11, GOLD) +
      cap('thức dậy', ACCENT, 12)),

    'ねます': art(
      `<path d="M12 76 h56 M12 76 v-8 h56 v8" stroke="${INK}" stroke-width="2.6"/>` +
      `<g transform="rotate(-90 34 60)">${person(34, 60, INK, .7)}</g>` +
      `<text x="72" y="34" font-size="16" fill="${SAGE}" font-weight="800" text-anchor="middle" stroke="none">Z</text>` +
      `<text x="83" y="22" font-size="11" fill="${SAGE}" font-weight="800" text-anchor="middle" stroke="none">z</text>` +
      cap('đi ngủ', SAGE, 13)),

    'はたらきます': art(
      person(36, 40, INK, .85) +
      `<rect x="52" y="54" width="26" height="20" rx="2" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M60 54 v-5 h10 v5" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M20 74 h60" stroke="${SAGE}" stroke-width="2.5"/>` +
      cap('làm việc', ACCENT, 12)),

    'やすみます': art(
      person(40, 38, INK, .85) +
      `<path d="M40 60 v18" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M62 40 q10 0 10 12 q0 10 -10 10" stroke="${GOLD}" stroke-width="3"/>` +
      `<path d="M60 40 h4 v6 h-4 z" fill="${GOLD}" stroke="none"/>` +
      cap('nghỉ ngơi', SAGE, 12)),

    'べんきょうします': art(
      `<rect x="24" y="56" width="52" height="20" rx="3" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 56 v20 M32 62 l16 4 16 -4" stroke="${ACCENT}" stroke-width="2.2"/>` +
      person(50, 36, INK, .85) +
      cap('học, học tập', ACCENT, 10.5)),

    'おわります': art(
      `<path d="M30 84 v-70" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M30 16 h30 v10 l-8 6 8 6 v10 h-30 z" fill="${INK}" stroke="none"/>` +
      `<rect x="34" y="20" width="6" height="6" fill="${PAPER}" stroke="none"/>` +
      `<rect x="46" y="20" width="6" height="6" fill="${PAPER}" stroke="none"/>` +
      `<rect x="40" y="32" width="6" height="6" fill="${PAPER}" stroke="none"/>` +
      `<rect x="52" y="32" width="6" height="6" fill="${PAPER}" stroke="none"/>` +
      cap('kết thúc, xong', ACCENT, 10.5)),

    // ---------- Bai 5: di lai, phuong tien, thoi gian dai han ----------
    'いきます': art(
      `<path d="M16 30 l3 -8 l3 8 z" fill="${SAGE}" stroke="none"/><circle cx="19" cy="18" r="3" stroke="${SAGE}" stroke-width="2"/>` +
      person(50, 52, INK, .9) +
      arrow(68, 52, 16, GOLD) +
      `<path d="M14 80 h72" stroke="${SAGE}" stroke-width="2.5"/>` +
      cap('đi (nơi khác)', INK, 9.5)),

    'きます': art(
      `<path d="M78 26 l3 -8 l3 8 z" fill="${ACCENT}" stroke="none"/><circle cx="81" cy="14" r="3" stroke="${ACCENT}" stroke-width="2"/>` +
      person(44, 52, INK, .9) +
      arrow(62, 52, 16, GOLD) +
      `<path d="M12 80 h72" stroke="${SAGE}" stroke-width="2.5"/>` +
      cap('đến, tới', ACCENT, 12)),

    'かえります': art(
      `<path d="M70 30 l14 -10 14 10 v20 h-28 z" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M80 50 v-10 h8 v10" stroke="${SAGE}" stroke-width="2.2"/>` +
      person(30, 54, INK, .9) +
      arrow(48, 54, 16, GOLD) +
      cap('về, trở về', SAGE, 11)),

    'のります': art(
      `<rect x="30" y="46" width="44" height="22" rx="4" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="40" cy="70" r="5" stroke="${INK}" stroke-width="2.5"/><circle cx="64" cy="70" r="5" stroke="${INK}" stroke-width="2.5"/>` +
      person(50, 30, ACCENT, .6) +
      `<path d="M50 39 v7" stroke="${GOLD}" stroke-width="3"/><path d="M45 43 l5 5 l5 -5" stroke="${GOLD}" stroke-width="3"/>` +
      cap('lên xe/tàu', ACCENT, 11)),

    'おります': art(
      `<rect x="30" y="28" width="44" height="22" rx="4" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="40" cy="52" r="5" stroke="${INK}" stroke-width="2.5"/><circle cx="64" cy="52" r="5" stroke="${INK}" stroke-width="2.5"/>` +
      person(50, 80, SAGE, .6) +
      `<path d="M50 56 v9" stroke="${GOLD}" stroke-width="3"/><path d="M45 61 l5 5 l5 -5" stroke="${GOLD}" stroke-width="3"/>` +
      cap('xuống xe/tàu', SAGE, 10.5)),

    'えき': art(
      `<path d="M12 74 h76" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M50 74 v-36" stroke="${INK}" stroke-width="2.5"/>` +
      `<rect x="30" y="18" width="40" height="18" rx="3" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M38 27 h24" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<rect x="12" y="52" width="36" height="18" rx="3" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="20" cy="70" r="3" stroke="${SAGE}" stroke-width="2"/><circle cx="40" cy="70" r="3" stroke="${SAGE}" stroke-width="2"/>` +
      cap('nhà ga', INK, 12)),

    'でんしゃ': art(
      `<rect x="10" y="34" width="72" height="26" rx="6" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M24 34 v26 M50 34 v26 M76 34 v26" stroke="${INK}" stroke-width="2"/>` +
      `<circle cx="24" cy="66" r="4" stroke="${INK}" stroke-width="2.5"/><circle cx="68" cy="66" r="4" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M40 34 v-10 h6 v10" stroke="${GOLD}" stroke-width="2.5"/>` +
      cap('tàu điện', ACCENT, 12)),

    'じてんしゃ': art(
      `<circle cx="28" cy="62" r="16" stroke="${INK}" stroke-width="3"/><circle cx="72" cy="62" r="16" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M28 62 l16 -26 h14 M28 62 l30 0 l14 26 M44 36 h10" stroke="${ACCENT}" stroke-width="2.8"/>` +
      `<path d="M58 62 l14 -12" stroke="${ACCENT}" stroke-width="2.8"/>` +
      cap('xe đạp', ACCENT, 12)),

    'じどうしゃ': art(
      `<path d="M12 62 h4 l8 -18 h44 l10 18 h10 v12 h-76 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M28 44 l6 -10 h20 l6 10" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<circle cx="28" cy="74" r="7" stroke="${INK}" stroke-width="3"/><circle cx="72" cy="74" r="7" stroke="${INK}" stroke-width="3"/>` +
      cap('ô tô', INK, 13)),

    'バス': art(
      `<rect x="10" y="30" width="76" height="34" rx="5" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M22 30 v34 M40 30 v34 M58 30 v34 M76 30 v34" stroke="${SAGE}" stroke-width="2"/>` +
      `<circle cx="26" cy="70" r="6" stroke="${INK}" stroke-width="3"/><circle cx="70" cy="70" r="6" stroke="${INK}" stroke-width="3"/>` +
      cap('xe buýt', INK, 12)),

    'タクシー': art(
      `<path d="M12 60 h6 l8 -16 h40 l8 16 h6 v10 h-68 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="40" y="26" width="20" height="8" rx="2" fill="${GOLD}" stroke="none"/>` +
      `<path d="M12 60 h68" stroke="${ACCENT}" stroke-width="3"/>` +
      `<circle cx="28" cy="72" r="7" stroke="${INK}" stroke-width="3"/><circle cx="72" cy="72" r="7" stroke="${INK}" stroke-width="3"/>` +
      cap('taxi', ACCENT, 13)),

    'ひこうき': art(
      `<path d="M10 52 h60 l14 -8 -6 8 6 8 -14 -8 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 52 l-14 18 h8 l10 -18 M52 52 l10 18 h-8 l-8 -18" stroke="${INK}" stroke-width="2.2" fill="${PAPER}"/>` +
      `<path d="M6 40 q10 -4 18 2" stroke="${SAGE}" stroke-width="2" stroke-dasharray="2 3"/>` +
      cap('máy bay', INK, 12)),

    'ともだち': art(
      person(34, 50, INK, .85) + person(66, 50, ACCENT, .85) +
      `<path d="M46 56 q4 6 8 0" stroke="${GOLD}" stroke-width="3"/>` +
      `<path d="M50 26 l2 5 5 1 -4 4 1 5 -4 -3 -4 3 1 -5 -4 -4 5 -1 z" fill="${GOLD}" stroke="none"/>` +
      cap('bạn bè', ACCENT, 12)),

    'いっしょに': art(
      person(34, 50, INK, .85) + person(62, 50, ACCENT, .85) +
      `<path d="M46 58 h6" stroke="${GOLD}" stroke-width="4"/>` +
      `<path d="M20 78 h64" stroke="${SAGE}" stroke-width="2.5"/>` +
      cap('cùng nhau', GOLD, 12)),

    'ひとり': art(
      person(50, 48, INK, 1) +
      `<circle cx="50" cy="48" r="34" stroke="${SAGE}" stroke-width="2" stroke-dasharray="3 4"/>` +
      `<text x="80" y="26" font-size="16" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">1</text>` +
      cap('một mình', ACCENT, 12)),

    'いつ': art(
      `<circle cx="50" cy="46" r="26" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<text x="50" y="56" font-size="26" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      cap('khi nào?', ACCENT, 13)),

    'いつも': art(
      clockFace(38, 46, 20, 45, 200, SAGE) + cycleIcon(74, 46, 16, GOLD) +
      cap('luôn luôn', SAGE, 12)),

    'たんじょうび': art(
      `<path d="M30 78 h40 v-22 h-40 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M30 66 h40 M30 74 h40" stroke="${ACCENT}" stroke-width="2"/>` +
      `<path d="M42 56 v-10 M58 56 v-10" stroke="${GOLD}" stroke-width="3"/>` +
      `<path d="M42 46 q-2 -6 0 -9 q2 3 0 9 M58 46 q-2 -6 0 -9 q2 3 0 9" fill="${GOLD}" stroke="none"/>` +
      cap('sinh nhật', ACCENT, 12)),

    'りょこう': art(
      `<rect x="24" y="42" width="40" height="32" rx="4" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M36 42 v-8 h16 v8" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M24 58 h40" stroke="${SAGE}" stroke-width="2"/>` +
      `<path d="M68 50 q10 -4 16 4" stroke="${ACCENT}" stroke-width="2.5" stroke-dasharray="2 3"/>` +
      `<path d="M78 46 l8 6 -9 3 z" fill="${ACCENT}" stroke="none"/>` +
      cap('du lịch', ACCENT, 12)),

    'らいげつ': art(
      page(16, 30, 26, 34, INK) + page(56, 30, 26, 34, ACCENT) +
      moonIcon(69, 46, 6, INK) +
      arrow(44, 47, 8, GOLD) +
      cap('tháng sau', ACCENT, 12)),

    'らいねん': art(
      page(14, 40, 22, 24, INK) + page(38, 34, 22, 30, INK) + page(62, 26, 24, 38, ACCENT) +
      arrow(50, 62, 8, GOLD) +
      cap('năm sau', ACCENT, 12)),

    '〜がつ': art(
      page(30, 22, 40, 50, INK) + moonIcon(50, 50, 12, GOLD) +
      cap('tháng ~', GOLD, 13)),

    '〜にち／〜か': art(
      page(30, 22, 40, 50, INK) + sunIcon(50, 50, 11, GOLD) +
      cap('ngày ~', GOLD, 13)),

    // ---------- Bai 6: an uong, hoat dong hang ngay ----------
    'たべます': art(
      person(36, 42, INK, .85) +
      `<ellipse cx="66" cy="66" rx="16" ry="8" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M52 62 l8 -14 M58 62 l4 -16" stroke="${INK}" stroke-width="2.2"/>` +
      cap('ăn', ACCENT, 14)),

    'のみます': art(
      person(36, 42, INK, .85) +
      `<path d="M58 54 h20 l-4 20 h-12 z" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M56 54 h24" stroke="${SAGE}" stroke-width="2.5"/>` +
      cap('uống', SAGE, 14)),

    'みます': art(
      `<path d="M14 46 q36 -26 72 0 q-36 26 -72 0 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="50" cy="46" r="11" stroke="${ACCENT}" stroke-width="3"/>` +
      `<circle cx="50" cy="46" r="4" fill="${ACCENT}" stroke="none"/>` +
      cap('xem, nhìn', ACCENT, 12)),

    'ききます': art(
      `<path d="M40 20 q-20 6 -18 30 q1 16 16 22" stroke="${INK}" stroke-width="4" fill="none"/>` +
      `<path d="M38 36 q-6 3 -5 10" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M64 30 q8 4 8 12 M70 24 q12 6 12 18" stroke="${GOLD}" stroke-width="2.2" stroke-dasharray="2 3"/>` +
      cap('nghe, hỏi', INK, 12)),

    'よみます': art(
      `<path d="M14 30 q18 -8 36 0 v40 q-18 -8 -36 0 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M86 30 q-18 -8 -36 0 v40 q18 -8 36 0 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M22 36 h20 M22 44 h20 M58 36 h20 M58 44 h20" stroke="${SAGE}" stroke-width="2"/>` +
      cap('đọc', SAGE, 14)),

    'かきます': art(
      `<path d="M20 78 l4 -14 44 -44 10 10 -44 44 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M68 30 l10 10" stroke="${ACCENT}" stroke-width="4"/>` +
      `<path d="M20 78 l14 -4" stroke="${GOLD}" stroke-width="3"/>` +
      cap('viết, vẽ', ACCENT, 13)),

    'かいます': art(
      `<path d="M26 42 h48 l-6 34 h-36 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 42 v-8 a10 10 0 0 1 20 0 v8" stroke="${INK}" stroke-width="2.5"/>` +
      `<circle cx="72" cy="26" r="10" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<text x="72" y="30" font-size="10" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">¥</text>` +
      cap('mua', GOLD, 14)),

    'とります': art(
      `<rect x="18" y="34" width="60" height="38" rx="4" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="38" y="24" width="20" height="12" rx="2" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="48" cy="54" r="13" stroke="${ACCENT}" stroke-width="3"/>` +
      `<circle cx="70" cy="42" r="2.5" fill="${GOLD}" stroke="none"/>` +
      cap('chụp ảnh', ACCENT, 12)),

    'つくります': art(
      `<path d="M30 46 a20 16 0 0 1 40 0 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M22 46 h56 l-4 10 h-48 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 30 q-3 -8 0 -12 q3 4 0 12 M40 32 q-2 -7 1 -10 q2 4 -1 10 M60 32 q2 -7 -1 -10 q-2 4 1 10" ` +
      `stroke="${ACCENT}" stroke-width="2.2"/>` +
      cap('làm, nấu', ACCENT, 12)),

    'あいます': art(
      person(28, 50, INK, .8) + person(72, 50, ACCENT, .8) +
      `<path d="M50 30 l2 6 6 1 -5 5 1 6 -4 -3 -4 3 1 -6 -5 -5 6 -1 z" fill="${GOLD}" stroke="none"/>` +
      cap('gặp', GOLD, 14)),

    'すいます': art(
      `<rect x="14" y="52" width="42" height="9" rx="2" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="52" y="52" width="9" height="9" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M61 56 q10 -8 2 -18" stroke="${INK}" stroke-width="2.2" stroke-dasharray="1 3"/>` +
      person(80, 42, SAGE, .55) +
      `<path d="M68 50 q6 -2 10 -4" stroke="${SAGE}" stroke-width="2" stroke-dasharray="1 3"/>` +
      cap('hút thuốc', INK, 12)),

    'します': art(
      `<circle cx="50" cy="50" r="16" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 44 v-8 M47 42 v-10 M54 42 v-10 M61 44 v-8" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M20 30 l8 4 M80 30 l-8 4 M20 66 l8 -4 M80 66 l-8 -4" stroke="${GOLD}" stroke-width="2.5"/>` +
      cap('làm (việc gì đó)', ACCENT, 8.5)),

    'パン': art(
      `<path d="M18 60 q-4 -26 32 -26 q36 0 32 26 q0 12 -32 12 q-32 0 -32 -12 z" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M34 34 q4 -8 0 -14 M50 30 q4 -10 0 -16 M66 34 q4 -8 0 -14" stroke="${GOLD}" stroke-width="2.2" stroke-dasharray="2 3"/>` +
      cap('bánh mì', GOLD, 14)),

    'にく': art(
      `<ellipse cx="46" cy="46" rx="24" ry="18" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M64 56 l14 14" stroke="${ACCENT}" stroke-width="6"/>` +
      `<circle cx="80" cy="72" r="5" stroke="${ACCENT}" stroke-width="3"/>` +
      cap('thịt', ACCENT, 14)),

    'さかな': art(
      `<path d="M14 48 q20 -20 50 0 q-30 20 -50 0 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M64 48 l16 -12 v24 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="26" cy="45" r="2" fill="${INK}" stroke="none"/>` +
      `<path d="M30 40 q6 4 0 8" stroke="${SAGE}" stroke-width="2"/>` +
      cap('cá', SAGE, 15)),

    'やさい': art(
      `<path d="M50 30 l10 42 h-20 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 30 q-4 -12 -14 -14 q2 10 14 14 M50 30 q4 -12 14 -14 q-2 10 -14 14 M50 30 q-2 -14 0 -18 q2 4 0 18" ` +
      `stroke="${SAGE}" stroke-width="2.5"/>` +
      cap('rau', SAGE, 15)),

    'くだもの': art(
      `<circle cx="50" cy="52" r="22" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 30 v-8" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M50 24 q10 -6 14 2 q-8 4 -14 -2" fill="${SAGE}" stroke="none"/>` +
      cap('trái cây', ACCENT, 13)),

    'てがみ': art(
      `<rect x="14" y="28" width="72" height="48" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M14 28 l36 28 36 -28" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M42 58 q4 -6 8 0 q4 -6 8 0" stroke="${ACCENT}" stroke-width="2.5"/>` +
      cap('lá thư', INK, 14)),

    'しゃしん': art(
      `<rect x="16" y="22" width="68" height="52" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="24" y="30" width="52" height="36" stroke="${SAGE}" stroke-width="2.5" fill="none"/>` +
      `<path d="M24 66 l16 -18 12 10 14 -16 10 24 z" fill="${GOLD}" stroke="none"/>` +
      `<circle cx="66" cy="40" r="5" stroke="${GOLD}" stroke-width="2.2"/>` +
      cap('bức ảnh', GOLD, 14)),

    'おんがく': art(
      `<circle cx="30" cy="70" r="8" fill="${ACCENT}" stroke="none"/><circle cx="62" cy="64" r="8" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M38 70 v-38 l32 -8 v38" stroke="${INK}" stroke-width="3"/>` +
      cap('âm nhạc', ACCENT, 14)),
  };

  window.SenseiArt.extend(EXTRA);

  // Alias sang the kanji cho tung tu co kanji (dung ca kana lan kanji deu tra ra hinh)
  window.SenseiArt.extend({
    '万': EXTRA['まん'],
    '見せて ください': EXTRA['みせてください'],
    'お手洗い': EXTRA['おてあらい'],
    '煙草': EXTRA['たばこ'],
    '今': EXTRA['いま'],
    '〜時': EXTRA['〜じ'],
    '〜分': EXTRA['〜ふん／〜ぷん'],
    '半': EXTRA['はん'],
    '〜時間': EXTRA['〜じかん'],
    '何時': EXTRA['なんじ'],
    '午前': EXTRA['ごぜん'],
    '午後': EXTRA['ごご'],
    '朝': EXTRA['あさ'],
    '今朝': EXTRA['けさ'],
    '今日': EXTRA['きょう'],
    '明日': EXTRA['あした'],
    '昨日': EXTRA['きのう'],
    '今晩': EXTRA['こんばん'],
    '月曜日': EXTRA['げつようび'],
    '火曜日': EXTRA['かようび'],
    '金曜日': EXTRA['きんようび'],
    '何曜日': EXTRA['なんようび'],
    '毎朝': EXTRA['まいあさ'],
    '毎晩': EXTRA['まいばん'],
    '毎日': EXTRA['まいにち'],
    '先週': EXTRA['せんしゅう'],
    '来週': EXTRA['らいしゅう'],
    '銀行': EXTRA['ぎんこう'],
    '図書館': EXTRA['としょかん'],
    '映画': EXTRA['えいが'],
    '休み': EXTRA['やすみ'],
    '番号': EXTRA['ばんごう'],
    '起きます': EXTRA['おきます'],
    '寝ます': EXTRA['ねます'],
    '働きます': EXTRA['はたらきます'],
    '休みます': EXTRA['やすみます'],
    '勉強します': EXTRA['べんきょうします'],
    '終わります': EXTRA['おわります'],
    '行きます': EXTRA['いきます'],
    '来ます': EXTRA['きます'],
    '帰ります': EXTRA['かえります'],
    '乗ります': EXTRA['のります'],
    '降ります': EXTRA['おります'],
    '駅': EXTRA['えき'],
    '電車': EXTRA['でんしゃ'],
    '自転車': EXTRA['じてんしゃ'],
    '自動車': EXTRA['じどうしゃ'],
    '飛行機': EXTRA['ひこうき'],
    '友達': EXTRA['ともだち'],
    '一緒に': EXTRA['いっしょに'],
    '一人': EXTRA['ひとり'],
    '誕生日': EXTRA['たんじょうび'],
    '旅行': EXTRA['りょこう'],
    '来月': EXTRA['らいげつ'],
    '来年': EXTRA['らいねん'],
    '〜月': EXTRA['〜がつ'],
    '〜日': EXTRA['〜にち／〜か'],
    '食べます': EXTRA['たべます'],
    '飲みます': EXTRA['のみます'],
    '見ます': EXTRA['みます'],
    '聞きます': EXTRA['ききます'],
    '読みます': EXTRA['よみます'],
    '書きます': EXTRA['かきます'],
    '買います': EXTRA['かいます'],
    '撮ります': EXTRA['とります'],
    '作ります': EXTRA['つくります'],
    '会います': EXTRA['あいます'],
    '吸います': EXTRA['すいます'],
    '肉': EXTRA['にく'],
    '魚': EXTRA['さかな'],
    '野菜': EXTRA['やさい'],
    '果物': EXTRA['くだもの'],
    '手紙': EXTRA['てがみ'],
    '写真': EXTRA['しゃしん'],
    '音楽': EXTRA['おんがく'],
  });
})();
