/**
 * Sensei Art — lo minh hoa bo sung N3 (lo 2/6): bai 5-7.
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

  // mui ten ngang — dung cho huong toi / doi tuong / xuyen qua (nhieu tu dung lai)
  function arrowH(x1, x2, y, color, w) {
    const wd = w || 3;
    const dir = x2 > x1 ? 1 : -1;
    return `<path d="M${x1} ${y} H${x2}" stroke="${color}" stroke-width="${wd}"/>` +
           `<path d="M${x2 - 8 * dir} ${y - 6} L${x2} ${y} L${x2 - 8 * dir} ${y + 6}" stroke="${color}" stroke-width="${wd}"/>`;
  }

  // vong tron dong tam — doi tuong / muc tieu
  function bullseye(cx, cy, color) {
    return `<circle cx="${cx}" cy="${cy}" r="18" stroke="${color}" stroke-width="2.5"/>` +
           `<circle cx="${cx}" cy="${cy}" r="9" stroke="${color}" stroke-width="2.5"/>` +
           dot(cx, cy, 3, color);
  }

  // hop hang co bang dan — san pham / hang hoa
  function box(x, y, color) {
    return `<rect x="${x}" y="${y}" width="34" height="24" rx="2" stroke="${color}" stroke-width="2.8" fill="${PAPER}"/>` +
           `<path d="M${x} ${y + 8} h34 M${x + 17} ${y + 8} v16" stroke="${color}" stroke-width="2"/>`;
  }

  const EXTRA = {
    // bai 5
    'くらべます': art(
      `<path d="M28 74 V48" stroke="${INK}" stroke-width="7"/>` +
      `<path d="M72 74 V28" stroke="${ACCENT}" stroke-width="7"/>` +
      `<path d="M36 40 H64 M42 34 L36 40 L42 46 M58 34 L64 40 L58 46" stroke="${GOLD}" stroke-width="2.5"/>` +
      label('SO SÁNH', GOLD, 12, 92, 700)),

    'たいします': art(
      arrowH(18, 58, 50, GOLD) +
      `<circle cx="74" cy="50" r="10" stroke="${ACCENT}" stroke-width="3"/>` +
      dot(74, 50, 3, ACCENT) +
      label('ĐỐI VỚI', ACCENT, 12, 92, 700)),

    'へんかします': art(
      `<circle cx="26" cy="50" r="14" stroke="${SAGE}" stroke-width="3"/>` +
      arrowH(44, 58, 50, GOLD) +
      `<rect x="62" y="36" width="28" height="28" stroke="${ACCENT}" stroke-width="3"/>` +
      label('THAY ĐỔI', GOLD, 11, 92, 700)),

    'じょうしょうします': art(
      `<path d="M18 72 h20 v-16 h20 v-18 h18" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M76 38 V20 M68 28 L76 20 L84 28" stroke="${ACCENT}" stroke-width="3.2"/>` +
      label('TĂNG', ACCENT, 15, 92, 700)),

    'げんしょうします': art(
      `<path d="M18 30 h20 v16 h20 v18 h18" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M76 64 V82 M68 74 L76 82 L84 74" stroke="${SAGE}" stroke-width="3.2"/>` +
      label('GIẢM', SAGE, 14, 92, 700)),

    'いぜん': art(
      `<circle cx="46" cy="46" r="22" stroke="${INK}" stroke-width="2.8" fill="${PAPER}"/>` +
      `<path d="M46 46 v-12 M46 46 l9 5" stroke="${GOLD}" stroke-width="2.6"/>` +
      `<path d="M84 46 H70 M76 40 L70 46 L76 52" stroke="${ACCENT}" stroke-width="2.8"/>` +
      label('TRƯỚC ĐÂY', GOLD, 10, 92, 700)),

    'げんざい': art(
      `<circle cx="50" cy="46" r="24" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 46 v-14 M50 46 l10 4" stroke="${ACCENT}" stroke-width="3"/>` +
      dot(50, 22, 3, ACCENT) +
      label('HIỆN TẠI', ACCENT, 11, 92, 700)),

    'かんきょう': art(
      `<circle cx="50" cy="48" r="28" stroke="${SAGE}" stroke-width="2.6" stroke-dasharray="5 4"/>` +
      `<path d="M50 60 v-22 M50 46 q-14 -4 -14 -18 q14 2 14 18 M50 40 q14 -4 14 -16 q-14 2 -14 16" stroke="${SAGE}" stroke-width="2.5"/>` +
      label('MÔI TRƯỜNG', SAGE, 9.5, 92, 700)),

    'ぶっか': art(
      `<path d="M24 30 h28 l24 24 -28 28 -24 -24 z" stroke="${GOLD}" stroke-width="2.8" fill="${PAPER}"/>` +
      dot(34, 40, 3, GOLD) +
      `<text x="52" y="58" font-size="18" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">¥</text>` +
      label('VẬT GIÁ', GOLD, 13, 92, 700)),

    'かんしん': art(
      arrowH(16, 44, 50, GOLD) +
      bullseye(72, 50, ACCENT) +
      label('QUAN TÂM', ACCENT, 11, 92, 700)),

    'たいど': art(
      person(50, 50, INK, .9) +
      `<path d="M38 56 q-8 4 -6 14 M62 56 q8 4 6 14" stroke="${ACCENT}" stroke-width="3"/>` +
      label('THÁI ĐỘ', ACCENT, 12, 92, 700)),

    'むかし': art(
      `<path d="M32 24 h36 M32 76 h36 M32 24 l18 24 -18 28 M68 24 l-18 24 18 28" stroke="${INK}" stroke-width="2.8" fill="${PAPER}"/>` +
      `<path d="M40 66 h20 l-10 -10 z" fill="${GOLD}" stroke="none"/>` +
      label('NGÀY XƯA', GOLD, 11, 92, 700)),

    'しゃかい': art(
      `<circle cx="50" cy="48" r="28" stroke="${INK}" stroke-width="2.6"/>` +
      dot(38, 52, 5, ACCENT) + dot(50, 38, 5, GOLD) + dot(62, 52, 5, SAGE) +
      label('XÃ HỘI', INK, 13, 92, 700)),

    // bai 6
    'むけ': art(
      arrowH(14, 48, 54, GOLD) +
      person(72, 50, ACCENT, .7) +
      label('DÀNH CHO', GOLD, 11, 92, 700)),

    'むけます': art(
      `<path d="M20 30 v20 q0 8 8 8 h30" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M52 52 l8 -5 -1 9 z" fill="${SAGE}" stroke="none"/>` +
      dot(76, 58, 4, ACCENT) +
      label('HƯỚNG VỀ', SAGE, 11, 92, 700)),

    'たいしょう': art(
      bullseye(50, 48, INK) +
      label('ĐỐI TƯỢNG', GOLD, 10, 92, 700)),

    'しょうひん': art(
      box(28, 40, INK) +
      `<path d="M68 46 l14 14 -6 2 -2 6 z" stroke="${GOLD}" stroke-width="2.2" fill="${GOLD}"/>` +
      label('HÀNG HÓA', GOLD, 11, 92, 700)),

    'せいひん': art(
      box(24, 42, INK) +
      `<circle cx="76" cy="34" r="10" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<path d="M76 22 v4 M76 42 v4 M64 34 h4 M84 34 h4 M68 26 l3 3 M81 42 l3 3 M84 26 l-3 3 M71 42 l-3 3" stroke="${SAGE}" stroke-width="2"/>` +
      label('SẢN PHẨM', SAGE, 10, 92, 700)),

    'はんばいします': art(
      box(14, 42, INK) +
      arrowH(54, 76, 50, GOLD) +
      `<text x="86" y="55" font-size="16" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">¥</text>` +
      label('BÁN HÀNG', GOLD, 11, 92, 700)),

    'きぎょう': art(
      `<rect x="26" y="24" width="48" height="50" stroke="${INK}" stroke-width="2.8" fill="${PAPER}"/>` +
      `<path d="M34 34 h10 M34 46 h10 M34 58 h10 M56 34 h10 M56 46 h10 M56 58 h10" stroke="${GOLD}" stroke-width="2.2"/>` +
      `<path d="M42 74 v-14 h16 v14" stroke="${ACCENT}" stroke-width="2.5"/>` +
      label('DOANH NGHIỆP', GOLD, 9, 92, 700)),

    'もくてき': art(
      bullseye(58, 50, ACCENT) +
      `<path d="M12 80 L46 54" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M12 80 l10 -1 -4 -10 z" fill="${GOLD}" stroke="none"/>` +
      label('MỤC ĐÍCH', ACCENT, 11, 92, 700)),

    'サービス': art(
      `<path d="M22 66 H78" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M28 66 a22 20 0 0 1 44 0 z" stroke="${GOLD}" stroke-width="2.8" fill="${PAPER}"/>` +
      dot(50, 40, 3, ACCENT) +
      label('DỊCH VỤ', GOLD, 12, 92, 700)),

    'しゅふ': art(
      person(36, 48, INK, .85) +
      `<path d="M28 56 q8 -6 16 0 v16 h-16 z" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M64 70 v-20 l14 -10 14 10 v20 z" stroke="${GOLD}" stroke-width="2.2" fill="${PAPER}"/>` +
      label('NỘI TRỢ', ACCENT, 12, 92, 700)),

    'かいがい': art(
      `<path d="M10 62 q8 -6 16 0 q8 6 16 0 q8 -6 16 0" stroke="${SAGE}" stroke-width="2.8"/>` +
      arrowH(30, 60, 44, GOLD) +
      `<path d="M78 30 V70 M78 30 l16 6 -16 6" stroke="${ACCENT}" stroke-width="2.6" fill="${PAPER}"/>` +
      label('NƯỚC NGOÀI', GOLD, 9.5, 92, 700)),

    'わかい': art(
      person(44, 52, INK, .85) +
      `<path d="M72 60 v-16 M72 46 q-8 -2 -8 -12 q8 1 8 12 M72 42 q8 -2 8 -10 q-8 1 -8 10" stroke="${SAGE}" stroke-width="2.4"/>` +
      label('TRẺ', SAGE, 16, 92, 700)),

    // bai 7
    'とおして': art(
      `<rect x="18" y="38" width="64" height="20" rx="3" stroke="${INK}" stroke-width="2.6" fill="${PAPER}"/>` +
      arrowH(8, 92, 48, ACCENT, 3) +
      label('SUỐT', ACCENT, 15, 92, 700)),

    'とおします': art(
      `<path d="M30 26 V78 M70 26 V78" stroke="${INK}" stroke-width="4"/>` +
      arrowH(10, 90, 52, GOLD, 3) +
      label('CHO QUA', GOLD, 12, 92, 700)),

    'わたって': art(
      `<path d="M10 66 q10 -8 20 0 q10 8 20 0 q10 -8 20 0 q10 8 20 0" stroke="${SAGE}" stroke-width="2.6"/>` +
      `<path d="M14 44 H86 M14 44 v8 M86 44 v8" stroke="${ACCENT}" stroke-width="3"/>` +
      label('TRẢI DÀI', ACCENT, 11, 92, 700)),

    'かぎって': art(
      dot(22, 50, 5, INK) + dot(78, 50, 5, INK) +
      `<path d="M40 34 h-6 v32 h6 M60 34 h6 v32 h-6" stroke="${ACCENT}" stroke-width="3"/>` +
      dot(50, 50, 6, ACCENT) +
      label('CHỈ RIÊNG', ACCENT, 10.5, 92, 700)),

    'かぎります': art(
      `<path d="M16 50 H84" stroke="${INK}" stroke-width="2.6" stroke-dasharray="5 4"/>` +
      `<path d="M58 30 V70" stroke="${ACCENT}" stroke-width="4"/>` +
      `<path d="M50 34 H66 M50 66 H66" stroke="${ACCENT}" stroke-width="3"/>` +
      label('GIỚI HẠN', ACCENT, 11, 92, 700)),

    'きかん': art(
      `<rect x="16" y="28" width="68" height="16" stroke="${INK}" stroke-width="2.6" fill="${PAPER}"/>` +
      `<path d="M34 22 v12 M66 22 v12" stroke="${INK}" stroke-width="2.6"/>` +
      `<rect x="34" y="52" width="32" height="10" fill="${GOLD}" stroke="none"/>` +
      `<path d="M34 50 v14 M66 50 v14" stroke="${ACCENT}" stroke-width="2.5"/>` +
      label('THỜI HẠN', GOLD, 11, 92, 700)),

    'ぜんこく': art(
      `<path d="M20 40 q10 -18 30 -14 q24 -6 30 12 q14 6 6 24 q-4 16 -24 14 q-20 8 -34 -6 q-16 -4 -8 -30 z" stroke="${INK}" stroke-width="2.6" fill="${PAPER}"/>` +
      dot(34, 40, 3.5, ACCENT) + dot(56, 34, 3.5, ACCENT) + dot(48, 56, 3.5, ACCENT) + dot(64, 58, 3.5, ACCENT) +
      label('TOÀN QUỐC', GOLD, 10, 92, 700)),

    'ぜんたい': art(
      `<circle cx="50" cy="48" r="26" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M50 48 V22 M50 48 L72 62 M50 48 L28 62" stroke="${ACCENT}" stroke-width="2.2"/>` +
      label('TOÀN THỂ', ACCENT, 10, 92, 700)),

    'はんい': art(
      `<circle cx="50" cy="48" r="30" stroke="${SAGE}" stroke-width="2.6" stroke-dasharray="6 5"/>` +
      dot(40, 44, 4, INK) + dot(58, 54, 4, INK) +
      label('PHẠM VI', SAGE, 12, 92, 700)),

    'すべて': art(
      dot(30, 50, 7, GOLD) + dot(50, 50, 7, GOLD) + dot(70, 50, 7, GOLD) +
      check(50, 30, SAGE, 1) +
      label('TẤT CẢ', GOLD, 13, 92, 700)),

    'ちいき': art(
      `<circle cx="50" cy="50" r="28" stroke="${SAGE}" stroke-width="2.4" stroke-dasharray="5 4"/>` +
      `<path d="M50 32 q14 0 14 14 q0 12 -14 26 q-14 -14 -14 -26 q0 -14 14 -14 z" stroke="${ACCENT}" stroke-width="2.6" fill="${PAPER}"/>` +
      dot(50, 46, 4, ACCENT) +
      label('KHU VỰC', SAGE, 11, 92, 700)),

    'へいきん': art(
      `<path d="M26 74 V54 M50 74 V34 M74 74 V60" stroke="${INK}" stroke-width="7"/>` +
      `<path d="M16 50 H86" stroke="${ACCENT}" stroke-width="2.4" stroke-dasharray="5 4"/>` +
      label('TRUNG BÌNH', ACCENT, 9.5, 92, 700)),

    'たいかい': art(
      `<path d="M36 28 h28 v16 a14 14 0 0 1 -28 0 z" stroke="${GOLD}" stroke-width="2.8" fill="${PAPER}"/>` +
      `<path d="M36 32 h-10 q0 14 12 14 M64 32 h10 q0 14 -12 14" stroke="${GOLD}" stroke-width="2.4"/>` +
      `<path d="M50 44 v16 M38 66 H62" stroke="${GOLD}" stroke-width="3"/>` +
      label('ĐẠI HỘI', GOLD, 12, 92, 700)),

    'じょうほう': art(
      `<circle cx="50" cy="46" r="26" stroke="${SAGE}" stroke-width="3"/>` +
      dot(50, 32, 3, SAGE) +
      `<path d="M50 42 v18" stroke="${SAGE}" stroke-width="4"/>` +
      label('THÔNG TIN', SAGE, 10, 92, 700)),

    'おこなわれます': art(
      `<path d="M14 70 H86" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M50 70 V26" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M50 26 l22 8 -22 8 z" fill="${ACCENT}" stroke="none"/>` +
      dot(28, 78, 3.5, GOLD) + dot(44, 78, 3.5, GOLD) + dot(62, 78, 3.5, GOLD) + dot(78, 78, 3.5, GOLD) +
      label('TỔ CHỨC', ACCENT, 13, 92, 700)),
  };

  // Gan them dang kanji cho cac tu co kanji, tro ve cung mot hinh minh hoa.
  // bai 5
  EXTRA['比べます'] = EXTRA['くらべます'];
  EXTRA['対します'] = EXTRA['たいします'];
  EXTRA['変化します'] = EXTRA['へんかします'];
  EXTRA['上昇します'] = EXTRA['じょうしょうします'];
  EXTRA['減少します'] = EXTRA['げんしょうします'];
  EXTRA['以前'] = EXTRA['いぜん'];
  EXTRA['現在'] = EXTRA['げんざい'];
  EXTRA['環境'] = EXTRA['かんきょう'];
  EXTRA['物価'] = EXTRA['ぶっか'];
  EXTRA['関心'] = EXTRA['かんしん'];
  EXTRA['態度'] = EXTRA['たいど'];
  EXTRA['昔'] = EXTRA['むかし'];
  EXTRA['社会'] = EXTRA['しゃかい'];
  // bai 6
  EXTRA['向け'] = EXTRA['むけ'];
  EXTRA['向けます'] = EXTRA['むけます'];
  EXTRA['対象'] = EXTRA['たいしょう'];
  EXTRA['商品'] = EXTRA['しょうひん'];
  EXTRA['製品'] = EXTRA['せいひん'];
  EXTRA['販売します'] = EXTRA['はんばいします'];
  EXTRA['企業'] = EXTRA['きぎょう'];
  EXTRA['目的'] = EXTRA['もくてき'];
  EXTRA['主婦'] = EXTRA['しゅふ'];
  EXTRA['海外'] = EXTRA['かいがい'];
  EXTRA['若い'] = EXTRA['わかい'];
  // bai 7
  EXTRA['通して'] = EXTRA['とおして'];
  EXTRA['通します'] = EXTRA['とおします'];
  EXTRA['渡って'] = EXTRA['わたって'];
  EXTRA['限って'] = EXTRA['かぎって'];
  EXTRA['限ります'] = EXTRA['かぎります'];
  EXTRA['期間'] = EXTRA['きかん'];
  EXTRA['全国'] = EXTRA['ぜんこく'];
  EXTRA['全体'] = EXTRA['ぜんたい'];
  EXTRA['範囲'] = EXTRA['はんい'];
  EXTRA['全て'] = EXTRA['すべて'];
  EXTRA['地域'] = EXTRA['ちいき'];
  EXTRA['平均'] = EXTRA['へいきん'];
  EXTRA['大会'] = EXTRA['たいかい'];
  EXTRA['情報'] = EXTRA['じょうほう'];
  EXTRA['行われます'] = EXTRA['おこなわれます'];

  window.SenseiArt.extend(EXTRA);
})();
