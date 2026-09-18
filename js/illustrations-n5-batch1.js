/**
 * Sensei Art — lo minh hoa bo sung N5 (lo 1/5): bai 2-3, ~85 tu.
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

  /** Nhan tieng Viet can duoi hinh, luon can giua truc x=50 */
  function tag(text, y, color, size, weight) {
    return `<text x="50" y="${y || 92}" font-size="${size || 11}" fill="${color || INK}" ` +
           `font-weight="${weight || 600}" text-anchor="middle" stroke="none">${text}</text>`;
  }

  /** Ghim dia diem tren ban do (giot nuoc + lo tron) */
  function pin(cx, cy, color, scale) {
    const s = scale || 1;
    return `<path d="M${cx} ${cy + 18 * s} C ${cx - 14 * s} ${cy + 2 * s} ${cx - 14 * s} ${cy - 14 * s} ${cx} ${cy - 14 * s} ` +
           `C ${cx + 14 * s} ${cy - 14 * s} ${cx + 14 * s} ${cy + 2 * s} ${cx} ${cy + 18 * s} Z" ` +
           `stroke="${color}" stroke-width="${3 * s}" fill="${PAPER}"/>` +
           `<circle cx="${cx}" cy="${cy - 3 * s}" r="${5 * s}" stroke="${color}" stroke-width="${2.5 * s}"/>`;
  }

  /** Dong xu tron co chu Yen */
  function coin(cx, cy, r, color) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${color}" stroke-width="3" fill="${PAPER}"/>` +
           `<text x="${cx}" y="${cy + r * 0.35}" font-size="${r}" fill="${color}" font-weight="800" text-anchor="middle" stroke="none">¥</text>`;
  }

  /** Khung net dut — dai dien cho mot danh tu chua dien ten */
  function dashedBox(x, y, w, h, color) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" stroke="${color}" stroke-width="2.5" stroke-dasharray="4 3" fill="none"/>`;
  }

  /** Bong bong loi thoai */
  function bubble(color) {
    return `<path d="M20 20 h50 a8 8 0 0 1 8 8 v20 a8 8 0 0 1 -8 8 h-30 l-12 12 v-12 h-8 a8 8 0 0 1 -8 -8 v-20 a8 8 0 0 1 8 -8 z" ` +
           `stroke="${color}" stroke-width="3" fill="${PAPER}"/>`;
  }

  const EXTRA = {
    // ---------- chi thi tu: vat (nay/do/kia/nao) ----------
    'これ': art(
      person(30, 50, INK, .85) +
      `<rect x="50" y="42" width="20" height="20" rx="3" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M46 52 h4" stroke="${ACCENT}" stroke-width="2.5"/>` +
      tag('CÁI NÀY', 92, ACCENT, 12, 700)),

    'それ': art(
      person(18, 52, INK, .68) + person(76, 50, ACCENT, .78) +
      `<rect x="52" y="40" width="18" height="18" rx="3" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M36 56 h14" stroke="${INK}" stroke-width="2" stroke-dasharray="3 3"/>` +
      tag('CÁI ĐÓ', 92, SAGE, 12, 700)),

    'あれ': art(
      person(16, 50, INK, .6) + person(30, 50, ACCENT, .6) +
      `<path d="M46 60 L82 60" stroke="${GOLD}" stroke-width="2" stroke-dasharray="3 3"/>` +
      `<rect x="78" y="48" width="14" height="14" rx="2" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      tag('CÁI KIA', 92, GOLD, 12, 700)),

    'どれ': art(
      `<rect x="12" y="52" width="16" height="16" rx="2" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<circle cx="50" cy="60" r="9" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M80 52 l9 16 h-18 z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<text x="50" y="32" font-size="26" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      tag('CÁI NÀO?', 92, ACCENT, 12, 700)),

    // ---------- chi thi tu: dung truoc danh tu (~nay/~do/~kia/~nao) ----------
    'この': art(
      `<circle cx="18" cy="56" r="5" fill="${INK}" stroke="none"/>` +
      `<path d="M26 56 h12" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M36 50 l6 6 -6 6" stroke="${INK}" stroke-width="3"/>` +
      dashedBox(48, 42, 32, 26, ACCENT) +
      `<text x="64" y="58" font-size="13" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">N</text>` +
      tag('~ NÀY', 92, ACCENT, 12, 700)),

    'その': art(
      `<circle cx="14" cy="56" r="5" fill="${INK}" stroke="none"/>` +
      `<path d="M22 56 h20" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M42 50 l6 6 -6 6" stroke="${INK}" stroke-width="3"/>` +
      dashedBox(56, 42, 30, 26, SAGE) +
      `<text x="71" y="58" font-size="13" fill="${SAGE}" font-weight="700" text-anchor="middle" stroke="none">N</text>` +
      tag('~ ĐÓ', 92, SAGE, 12, 700)),

    'あの': art(
      `<circle cx="10" cy="60" r="5" fill="${INK}" stroke="none"/>` +
      `<path d="M18 60 h50" stroke="${INK}" stroke-width="2.2" stroke-dasharray="3 3"/>` +
      `<path d="M68 60 l6 -5 v10 z" fill="${GOLD}" stroke="none"/>` +
      dashedBox(72, 44, 22, 26, GOLD) +
      `<text x="83" y="60" font-size="12" fill="${GOLD}" font-weight="700" text-anchor="middle" stroke="none">N</text>` +
      tag('~ KIA', 92, GOLD, 12, 700)),

    'どの': art(
      `<circle cx="14" cy="60" r="5" fill="${INK}" stroke="none"/>` +
      `<path d="M22 60 h16" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M38 54 l6 6 -6 6" stroke="${INK}" stroke-width="3"/>` +
      dashedBox(48, 46, 16, 20, ACCENT) +
      dashedBox(68, 46, 16, 20, ACCENT) +
      `<text x="58" y="34" font-size="18" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      tag('~ NÀO?', 92, ACCENT, 12, 700)),

    // ---------- sach vo & van phong pham ----------
    'ほん': art(
      `<path d="M50 26 q-16 -10 -34 -4 v46 q18 -6 34 4 q16 -10 34 -4 v-46 q-18 -6 -34 4 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 26 v46" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M24 34 h16 M24 42 h16 M60 34 h16 M60 42 h16" stroke="${SAGE}" stroke-width="2"/>` +
      tag('quyển sách', 94, INK, 11, 600)),

    'じしょ': art(
      `<rect x="26" y="16" width="14" height="60" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="40" y="16" width="34" height="60" rx="2" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M48 28 h18 M48 38 h18 M48 48 h18 M48 58 h18" stroke="${SAGE}" stroke-width="2"/>` +
      `<text x="33" y="38" font-size="9" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">A</text>` +
      `<text x="33" y="58" font-size="9" fill="${ACCENT}" font-weight="700" text-anchor="middle" stroke="none">Z</text>` +
      tag('từ điển', 94, INK, 11, 600)),

    'ざっし': art(
      `<rect x="22" y="14" width="56" height="70" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="30" y="22" width="40" height="26" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<circle cx="42" cy="33" r="5" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M30 44 l10 -8 8 6 12 -10" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M30 56 h40 M30 64 h30 M30 72 h34" stroke="${SAGE}" stroke-width="2"/>` +
      tag('tạp chí', 94, INK, 11, 600)),

    'しんぶん': art(
      `<path d="M14 24 h72 v6 q-4 4 0 8 q-4 4 0 8 q-4 4 0 8 q-4 4 0 8 q-4 4 0 8 h-72 z" stroke="${INK}" stroke-width="2.8" fill="${PAPER}"/>` +
      `<path d="M22 34 h20 M22 42 h20 M22 50 h20 M50 34 h24 M50 42 h24 M50 50 h24" stroke="${SAGE}" stroke-width="2"/>` +
      `<rect x="22" y="58" width="18" height="12" stroke="${ACCENT}" stroke-width="2"/>` +
      tag('báo, tờ báo', 94, INK, 10.5, 600)),

    'ノート': art(
      `<rect x="24" y="16" width="52" height="66" rx="2" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M24 24 h-4 M24 34 h-4 M24 44 h-4 M24 54 h-4 M24 64 h-4 M24 74 h-4" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M32 30 h36 M32 40 h36 M32 50 h36 M32 60 h36" stroke="${SAGE}" stroke-width="2"/>` +
      tag('quyển vở', 94, INK, 11, 600)),

    'てちょう': art(
      `<rect x="30" y="18" width="40" height="58" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M58 18 v20 l-6 -6 -6 6 v-20" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M38 34 h24 M38 44 h24 M38 54 h24" stroke="${SAGE}" stroke-width="2"/>` +
      tag('sổ tay', 94, INK, 11, 600)),

    'めいし': art(
      `<rect x="14" y="30" width="72" height="42" rx="4" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="32" cy="48" r="8" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M22 64 a10 10 0 0 1 20 0" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M52 42 h24 M52 52 h18" stroke="${SAGE}" stroke-width="2.2"/>` +
      tag('danh thiếp', 94, INK, 11, 600)),

    'カード': art(
      `<rect x="14" y="32" width="72" height="40" rx="5" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="14" y="42" width="72" height="8" fill="${INK}" stroke="none"/>` +
      `<rect x="22" y="58" width="24" height="8" stroke="${GOLD}" stroke-width="2.2"/>` +
      tag('thẻ, card', 94, INK, 11, 600)),

    'えんぴつ': art(
      `<path d="M20 76 L64 32 l8 8 -44 44 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M64 32 l10 -10 8 8 -10 10 z" stroke="${GOLD}" stroke-width="3" fill="${GOLD}"/>` +
      `<path d="M20 76 l-6 8 8 -6 z" fill="${INK}" stroke="none"/>` +
      tag('bút chì', 94, INK, 12, 700)),

    'ボールペン': art(
      `<rect x="44" y="18" width="10" height="46" rx="3" stroke="${INK}" stroke-width="2.8" fill="${PAPER}"/>` +
      `<path d="M44 64 l5 14 5 -14 z" stroke="${INK}" stroke-width="2.5" fill="${INK}"/>` +
      `<path d="M54 26 h8 v10 h-8" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M49 14 v6" stroke="${INK}" stroke-width="2.5"/>` +
      tag('bút bi', 94, INK, 12, 700)),

    'シャープペンシル': art(
      `<rect x="46" y="22" width="8" height="42" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M46 64 l4 10 4 -10 z" stroke="${INK}" stroke-width="2.2" fill="${GOLD}"/>` +
      `<rect x="47" y="12" width="6" height="10" rx="2" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M46 22 h8" stroke="${SAGE}" stroke-width="2"/>` +
      tag('bút chì kim', 94, INK, 10.5, 600)),

    // ---------- do vat ca nhan ----------
    'かぎ': art(
      `<circle cx="30" cy="34" r="12" stroke="${GOLD}" stroke-width="3.5"/>` +
      `<path d="M40 42 L74 76" stroke="${GOLD}" stroke-width="3.5"/>` +
      `<path d="M62 64 l8 -8 M70 72 l8 -8" stroke="${GOLD}" stroke-width="3"/>` +
      tag('chìa khóa', 94, INK, 12, 700)),

    'とけい': art(
      `<circle cx="50" cy="46" r="30" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 46 v-16 M50 46 l12 8" stroke="${ACCENT}" stroke-width="3.5"/>` +
      `<circle cx="50" cy="46" r="2.5" fill="${INK}" stroke="none"/>` +
      tag('đồng hồ', 94, INK, 12, 700)),

    'かさ': art(
      `<path d="M14 48 a36 30 0 0 1 72 0 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 18 v52 q0 8 -8 8" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M14 48 q6 6 12 0 q6 6 12 0 q6 6 12 0 q6 6 12 0 q6 6 12 0" stroke="${ACCENT}" stroke-width="2"/>` +
      tag('cái ô, cái dù', 94, INK, 10.5, 600)),

    'かばん': art(
      `<rect x="20" y="38" width="60" height="40" rx="6" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M36 38 v-10 a14 14 0 0 1 28 0 v10" stroke="${INK}" stroke-width="3"/>` +
      `<rect x="46" y="50" width="8" height="8" stroke="${GOLD}" stroke-width="2.2"/>` +
      tag('cặp, túi xách', 94, INK, 10.5, 600)),

    // ---------- do dien tu ----------
    'シーディー': art(
      `<circle cx="50" cy="46" r="28" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="50" cy="46" r="6" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M30 30 a26 26 0 0 1 30 -8" stroke="${ACCENT}" stroke-width="2.5"/>` +
      tag('đĩa CD', 94, INK, 12, 700)),

    'テレビ': art(
      `<rect x="16" y="20" width="68" height="42" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 62 l-8 14 M60 62 l8 14" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M26 30 h30 M26 38 h20" stroke="${SAGE}" stroke-width="2.2"/>` +
      tag('ti vi', 94, INK, 12, 700)),

    'ラジオ': art(
      `<rect x="18" y="34" width="64" height="34" rx="4" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M30 34 v-14 l14 14" stroke="${INK}" stroke-width="2.5"/>` +
      `<circle cx="34" cy="51" r="8" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M52 44 h20 M52 52 h20 M52 60 h12" stroke="${SAGE}" stroke-width="2.2"/>` +
      tag('radio', 94, INK, 12, 700)),

    'カメラ': art(
      `<rect x="18" y="32" width="64" height="40" rx="4" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="38" y="22" width="16" height="10" rx="2" stroke="${INK}" stroke-width="2.5"/>` +
      `<circle cx="50" cy="52" r="14" stroke="${ACCENT}" stroke-width="3"/>` +
      `<circle cx="50" cy="52" r="6" stroke="${ACCENT}" stroke-width="2"/>` +
      `<circle cx="70" cy="40" r="2.5" fill="${GOLD}" stroke="none"/>` +
      tag('máy ảnh', 94, INK, 12, 700)),

    'コンピューター': art(
      `<rect x="20" y="18" width="60" height="38" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 56 v10 M60 56 v10" stroke="${INK}" stroke-width="2.5"/>` +
      `<rect x="26" y="70" width="48" height="8" rx="2" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<path d="M28 28 h34 M28 36 h24 M28 44 h30" stroke="${SAGE}" stroke-width="2"/>` +
      tag('máy vi tính', 94, INK, 10.5, 600)),

    // ---------- do vat & do an khac ----------
    'くるま': art(
      `<path d="M14 62 q0 -18 14 -18 h10 l8 -12 h20 l8 12 h6 q10 0 10 18 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="30" cy="66" r="8" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="70" cy="66" r="8" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M38 44 h24 l6 8 h-36 z" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      tag('xe hơi', 94, INK, 12, 700)),

    'つくえ': art(
      `<path d="M14 40 h72 v8 h-72 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M20 48 v28 M80 48 v28" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M30 30 h22 v10 h-22 z" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      tag('cái bàn', 94, INK, 12, 700)),

    'いす': art(
      `<path d="M30 20 v28" stroke="${INK}" stroke-width="3.5"/>` +
      `<path d="M30 48 h34" stroke="${INK}" stroke-width="3.5"/>` +
      `<path d="M30 48 v22 M64 48 v22" stroke="${INK}" stroke-width="3.5"/>` +
      tag('cái ghế', 94, INK, 12, 700)),

    'チョコレート': art(
      `<rect x="22" y="30" width="56" height="36" rx="3" stroke="${INK}" stroke-width="3" fill="${GOLD}" opacity=".85"/>` +
      `<path d="M36 30 v36 M50 30 v36 M64 30 v36 M22 48 h56" stroke="${INK}" stroke-width="2"/>` +
      tag('sô-cô-la', 94, INK, 12, 700)),

    'コーヒー': art(
      `<path d="M28 38 h34 v22 a17 14 0 0 1 -34 0 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M62 42 q14 0 14 12 q0 12 -14 12" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M38 30 q2 -6 -2 -10 M48 30 q2 -6 -2 -10" stroke="${ACCENT}" stroke-width="2.2"/>` +
      `<path d="M22 72 h44" stroke="${INK}" stroke-width="2.5"/>` +
      tag('cà phê', 94, INK, 12, 700)),

    '[お]みやげ': art(
      `<rect x="28" y="42" width="44" height="34" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M28 42 h44 M50 42 v34" stroke="${GOLD}" stroke-width="3"/>` +
      `<path d="M40 42 q-6 -10 4 -14 q6 -2 6 6 q0 -8 6 -6 q10 4 4 14" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M14 28 l8 -8 6 6 M18 20 q6 0 4 8" stroke="${SAGE}" stroke-width="2.2"/>` +
      tag('quà lưu niệm', 94, INK, 10, 600)),

    // ---------- ngon ngu & tu hoi ----------
    'えいご': art(
      bubble(ACCENT) +
      `<text x="45" y="46" font-size="22" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">A</text>` +
      tag('tiếng Anh', 94, INK, 12, 700)),

    'にほんご': art(
      bubble(SAGE) +
      `<text x="45" y="48" font-size="24" fill="${SAGE}" font-weight="800" text-anchor="middle" stroke="none">あ</text>` +
      tag('tiếng Nhật', 94, INK, 12, 700)),

    '〜ご': art(
      bubble(GOLD) +
      `<rect x="28" y="32" width="14" height="14" stroke-dasharray="3 2" stroke="${GOLD}" stroke-width="2.2" fill="none"/>` +
      `<text x="56" y="45" font-size="16" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">語</text>` +
      tag('tiếng ~', 94, INK, 12, 600)),

    'なん': art(
      `<path d="M30 60 q-6 -20 20 -22 q22 -2 20 18 q-2 16 -20 16 q-14 0 -20 -12 z" stroke="${GOLD}" stroke-width="3" stroke-dasharray="5 4" fill="${PAPER}"/>` +
      `<text x="50" y="48" font-size="30" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      tag('CÁI GÌ?', 92, ACCENT, 13, 700)),

    // ---------- tra loi, khang dinh / phu dinh ----------
    'そう': art(
      person(34, 50, INK, .85) +
      `<path d="M58 42 l10 10 18 -20" stroke="${SAGE}" stroke-width="5"/>` +
      tag('đúng vậy!', 92, SAGE, 12, 700)),

    'ちがいます': art(
      `<rect x="16" y="34" width="24" height="24" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<circle cx="70" cy="46" r="14" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M12 66 L88 26 M12 26 L88 66" stroke="${ACCENT}" stroke-width="4"/>` +
      tag('không phải', 92, ACCENT, 12, 700)),

    'そうですか': art(
      person(42, 52, INK, .95) +
      `<text x="72" y="36" font-size="22" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">!?</text>` +
      tag('thế à, ra vậy', 92, GOLD, 11, 600)),

    'あのう': art(
      person(38, 54, INK, .9) +
      `<path d="M52 46 q6 -3 5 -9" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<circle cx="66" cy="30" r="3" fill="${ACCENT}" stroke="none"/>` +
      `<circle cx="76" cy="25" r="3" fill="${ACCENT}" stroke="none"/>` +
      `<circle cx="86" cy="22" r="3" fill="${ACCENT}" stroke="none"/>` +
      tag('à, ừm...', 92, INK, 12, 600)),

    // ---------- cum tu xa giao: tang qua, cam on, chao hoi ----------
    'ほんのきもちです': art(
      person(26, 54, INK, .8) + person(74, 54, ACCENT, .8) +
      `<rect x="44" y="54" width="12" height="10" rx="2" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M50 54 q-3 -5 0 -7 q3 2 0 7" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M46 40 q4 -5 8 0 q-4 6 -8 0" fill="${ACCENT}" stroke="none"/>` +
      tag('món quà nhỏ', 92, INK, 10.5, 600)),

    'どうぞ': art(
      person(24, 54, INK, .85) + person(76, 54, ACCENT, .85) +
      `<rect x="42" y="48" width="16" height="12" rx="2" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M40 54 h-6 M60 54 h6" stroke="${GOLD}" stroke-width="2.2"/>` +
      tag('xin mời', 92, GOLD, 13, 700)),

    'どうも': art(
      `<path d="M40 30 a9 9 0 1 1 .1 0" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M26 62 l10 -22 a10 10 0 0 1 18 6 l4 16" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M20 20 l4 6 -6 2 M76 24 l-4 6 6 2" stroke="${GOLD}" stroke-width="2.2"/>` +
      tag('cảm ơn', 92, ACCENT, 13, 700)),

    'どうもありがとうございます': art(
      `<path d="M36 26 a9 9 0 1 1 .1 0" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M14 66 q14 -34 30 -30 q14 4 8 20 l6 14" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M18 18 l4 6 -6 2 M60 14 l-4 6 6 2 M82 30 l-6 4 2 6" stroke="${GOLD}" stroke-width="2.2"/>` +
      tag('cảm ơn nhiều', 92, ACCENT, 11, 700)),

    'これからおせわになります': art(
      `<path d="M30 26 a9 9 0 1 1 .1 0" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M14 60 q10 -28 26 -22 q10 4 6 18 l4 12" stroke="${ACCENT}" stroke-width="3"/>` +
      person(74, 52, SAGE, .8) +
      `<path d="M46 80 h30" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M70 74 l6 6 -6 6" stroke="${GOLD}" stroke-width="2.5"/>` +
      tag('mong được giúp đỡ', 92, INK, 9, 600)),

    'こちらこそよろしく': art(
      `<path d="M26 26 a8 8 0 1 1 .1 0" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M12 58 q8 -24 22 -20 q9 3 6 16 l3 10" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M74 26 a8 8 0 1 1 .1 0" stroke="${SAGE}" stroke-width="3"/>` +
      `<path d="M88 58 q-8 -24 -22 -20 q-9 3 -6 16 l-3 10" stroke="${SAGE}" stroke-width="3"/>` +
      tag('tôi mới đúng', 92, INK, 11, 600)),

    // ---------- chi thi noi chon: day / do / kia / dau ----------
    'ここ': art(
      person(50, 38, INK, .8) +
      pin(50, 62, ACCENT, 1) +
      tag('Ở ĐÂY', 94, ACCENT, 12, 700)),

    'そこ': art(
      person(20, 46, INK, .7) +
      `<path d="M34 62 L64 62" stroke="${SAGE}" stroke-width="2" stroke-dasharray="3 3"/>` +
      pin(78, 58, SAGE, .8) +
      tag('Ở ĐÓ', 94, SAGE, 12, 700)),

    'あそこ': art(
      person(14, 44, INK, .6) +
      `<path d="M26 58 L84 58" stroke="${GOLD}" stroke-width="2" stroke-dasharray="3 3"/>` +
      pin(88, 56, GOLD, .55) +
      tag('Ở KIA', 94, GOLD, 12, 700)),

    'どこ': art(
      person(30, 46, INK, .78) +
      pin(70, 54, ACCENT, .85) +
      `<text x="70" y="30" font-size="20" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      tag('Ở ĐÂU?', 94, ACCENT, 12, 700)),

    // ---------- chi phuong huong (lich su) ----------
    'こちら': art(
      `<path d="M30 78 v-40" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M30 40 h26 l10 8 -10 8 h-26 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M14 78 h32" stroke="${INK}" stroke-width="3"/>` +
      tag('phía này', 92, ACCENT, 11, 700)),

    'そちら': art(
      `<path d="M26 78 v-30" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M26 52 h20 l8 6 -8 6 h-20 z" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M54 58 h24" stroke="${SAGE}" stroke-width="2" stroke-dasharray="3 3"/>` +
      `<path d="M12 78 h28" stroke="${INK}" stroke-width="3"/>` +
      tag('phía đó', 92, SAGE, 11, 700)),

    'あちら': art(
      `<path d="M20 78 v-24" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M20 58 h14 l6 5 -6 5 h-14 z" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 63 h40" stroke="${GOLD}" stroke-width="2" stroke-dasharray="3 3"/>` +
      `<path d="M8 78 h24" stroke="${INK}" stroke-width="3"/>` +
      tag('phía kia', 92, GOLD, 11, 700)),

    'どちら': art(
      `<path d="M50 78 v-40" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M50 40 h-18 l-8 8 8 8 h18 z" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M50 56 h18 l8 8 -8 8 h-18 z" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<text x="50" y="32" font-size="18" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      tag('phía nào?', 94, ACCENT, 11, 700)),

    // ---------- phong oc & dia diem trong toa nha ----------
    'きょうしつ': art(
      `<rect x="14" y="16" width="50" height="30" rx="2" stroke="${INK}" stroke-width="3" fill="${SAGE}"/>` +
      `<path d="M20 26 h20 M20 34 h30" stroke="${PAPER}" stroke-width="2.5"/>` +
      person(78, 62, ACCENT, .68) +
      `<rect x="30" y="66" width="26" height="18" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M14 84 h72" stroke="${INK}" stroke-width="3"/>` +
      tag('lớp học', 94, INK, 11, 600)),

    'しょくどう': art(
      `<rect x="12" y="14" width="76" height="66" rx="4" stroke="${INK}" stroke-width="3" fill="none"/>` +
      `<path d="M30 62 h40" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M36 62 v18 M64 62 v18" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M42 54 a8 6 0 0 0 16 0 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M42 54 h16" stroke="${ACCENT}" stroke-width="3"/>` +
      `<path d="M58 46 l6 -10 M62 46 l4 -11" stroke="${GOLD}" stroke-width="2.5"/>` +
      tag('nhà ăn, căng tin', 94, INK, 9.5, 600)),

    'じむしょ': art(
      `<rect x="12" y="16" width="76" height="62" rx="3" stroke="${INK}" stroke-width="3" fill="none"/>` +
      `<rect x="30" y="52" width="40" height="6" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M34 58 v14 M66 58 v14" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<rect x="44" y="38" width="12" height="10" rx="2" stroke="${SAGE}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M50 38 v-6" stroke="${SAGE}" stroke-width="2.5"/>` +
      tag('văn phòng', 94, INK, 11, 600)),

    'かいぎしつ': art(
      `<ellipse cx="50" cy="50" rx="30" ry="16" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      person(50, 26, ACCENT, .5) + person(24, 58, SAGE, .5) + person(76, 58, SAGE, .5) +
      tag('phòng họp', 94, INK, 11, 600)),

    'うけつけ': art(
      `<rect x="16" y="52" width="68" height="18" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M16 52 v-4 h68 v4" stroke="${INK}" stroke-width="2.5"/>` +
      person(66, 44, ACCENT, .6) +
      `<circle cx="30" cy="46" r="6" stroke="${GOLD}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M30 40 v-4" stroke="${GOLD}" stroke-width="2.5"/>` +
      tag('quầy lễ tân', 92, INK, 10.5, 600)),

    'へや': art(
      `<rect x="14" y="16" width="72" height="62" stroke="${INK}" stroke-width="3" fill="none"/>` +
      `<rect x="24" y="46" width="16" height="32" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<circle cx="36" cy="62" r="1.6" fill="${ACCENT}" stroke="none"/>` +
      `<rect x="56" y="30" width="20" height="16" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<path d="M66 30 v16 M56 38 h20" stroke="${SAGE}" stroke-width="2"/>` +
      tag('căn phòng', 94, INK, 11, 600)),

    'トイレ': art(
      `<path d="M36 34 h28 a6 6 0 0 1 6 6 v4 h-40 v-4 a6 6 0 0 1 6 -6 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M30 44 h40 v8 a20 16 0 0 1 -40 0 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="42" y="74" width="16" height="8" stroke="${INK}" stroke-width="2.5"/>` +
      tag('nhà vệ sinh', 94, INK, 10.5, 600)),

    // ---------- di chuyen trong toa nha ----------
    'かいだん': art(
      `<path d="M14 78 h14 v-12 h14 v-12 h14 v-12 h14 v-12 h14" stroke="${INK}" stroke-width="3.5"/>` +
      person(74, 34, ACCENT, .6) +
      tag('cầu thang', 94, INK, 11, 600)),

    'エレベーター': art(
      `<rect x="32" y="14" width="36" height="66" rx="3" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 14 v66" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M44 34 l6 -8 6 8 M44 60 l6 8 6 -8" stroke="${ACCENT}" stroke-width="3"/>` +
      tag('thang máy', 94, INK, 11, 600)),

    'エスカレーター': art(
      `<path d="M14 78 L74 24" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M20 78 v-10 h10 M34 68 v-10 h10 M48 58 v-10 h10 M62 48 v-10 h10" stroke="${INK}" stroke-width="2.5"/>` +
      person(66, 36, ACCENT, .6) +
      `<path d="M78 30 l8 -8 M86 22 l-4 0 M86 22 l0 4" stroke="${GOLD}" stroke-width="2.5"/>` +
      tag('thang cuốn', 94, INK, 11, 600)),

    // ---------- dat nuoc, nha cua, do dung khac ----------
    'くに': art(
      `<path d="M20 60 q-6 -20 14 -28 q20 -6 30 6 q14 10 6 26 q-8 16 -26 16 q-18 0 -24 -20 z" stroke="${SAGE}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 32 v-16" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M50 16 h16 v10 h-16 z" fill="${ACCENT}" stroke="none"/>` +
      tag('đất nước', 94, INK, 11, 600)),

    'かいしゃ': art(
      `<rect x="24" y="20" width="52" height="58" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M24 36 h52 M24 52 h52 M24 68 h52" stroke="${INK}" stroke-width="2"/>` +
      `<rect x="30" y="24" width="10" height="8" stroke="${SAGE}" stroke-width="2"/>` +
      `<rect x="60" y="24" width="10" height="8" stroke="${SAGE}" stroke-width="2"/>` +
      `<rect x="30" y="40" width="10" height="8" stroke="${SAGE}" stroke-width="2"/>` +
      `<rect x="60" y="40" width="10" height="8" stroke="${SAGE}" stroke-width="2"/>` +
      `<rect x="42" y="60" width="16" height="18" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      tag('công ty', 94, INK, 11, 600)),

    'うち': art(
      `<path d="M16 46 L50 18 L84 46" stroke="${INK}" stroke-width="3.5"/>` +
      `<rect x="24" y="46" width="52" height="32" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="44" y="58" width="14" height="20" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<rect x="28" y="54" width="10" height="10" stroke="${SAGE}" stroke-width="2"/>` +
      `<rect x="62" y="54" width="10" height="10" stroke="${SAGE}" stroke-width="2"/>` +
      tag('nhà', 94, INK, 12, 700)),

    'でんわ': art(
      `<rect x="38" y="14" width="24" height="56" rx="6" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M44 62 h12" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M28 34 q-6 -4 -4 -10 M22 40 q-10 -6 -6 -18" stroke="${GOLD}" stroke-width="2.2"/>` +
      `<path d="M72 34 q6 -4 4 -10 M78 40 q10 -6 6 -18" stroke="${GOLD}" stroke-width="2.2"/>` +
      tag('điện thoại', 94, INK, 11, 600)),

    'くつ': art(
      `<path d="M12 72 h58 q8 0 8 -8 q0 -6 -8 -8 l-10 -2 -8 -14 q-3 -6 -10 -4 l-22 8 q-8 3 -8 12 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 46 l6 4 M46 42 l6 4" stroke="${ACCENT}" stroke-width="2.5"/>` +
      tag('giày', 94, INK, 12, 700)),

    'ネクタイ': art(
      `<path d="M40 14 h20 l-4 12 h-12 z" stroke="${INK}" stroke-width="2.5" fill="${ACCENT}"/>` +
      `<path d="M44 26 l-10 42 16 10 16 -10 -10 -42 z" stroke="${INK}" stroke-width="2.5" fill="${ACCENT}"/>` +
      `<path d="M40 40 h20 M38 52 h24" stroke="${PAPER}" stroke-width="2"/>` +
      tag('cà vạt', 94, INK, 12, 700)),

    'ワイン': art(
      `<path d="M38 20 h24 q0 20 -12 26 q-12 -6 -12 -26 z" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M40 22 h20 q0 14 -10 18 q-10 -4 -10 -18 z" fill="${ACCENT}" stroke="none" opacity="0.5"/>` +
      `<path d="M50 46 v20 M38 70 h24" stroke="${INK}" stroke-width="3"/>` +
      tag('rượu vang', 94, INK, 11, 600)),

    'うりば': art(
      `<rect x="14" y="50" width="72" height="20" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<rect x="22" y="30" width="14" height="14" stroke="${ACCENT}" stroke-width="2.5"/>` +
      `<rect x="42" y="26" width="14" height="18" stroke="${SAGE}" stroke-width="2.5"/>` +
      `<rect x="62" y="32" width="14" height="12" stroke="${GOLD}" stroke-width="2.5"/>` +
      `<path d="M14 70 v6 h72 v-6" stroke="${INK}" stroke-width="2.5"/>` +
      tag('quầy bán hàng', 94, INK, 10, 600)),

    'ちか': art(
      `<path d="M8 44 h84" stroke="${INK}" stroke-width="3.5"/>` +
      `<path d="M12 44 l6 6 M24 44 l6 6 M36 44 l6 6 M48 44 l6 6 M60 44 l6 6 M72 44 l6 6" stroke="${SAGE}" stroke-width="2"/>` +
      `<rect x="32" y="50" width="36" height="26" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M50 26 v14 M44 34 l6 6 6 -6" stroke="${ACCENT}" stroke-width="3"/>` +
      tag('tầng hầm', 94, INK, 11, 600)),

    // ---------- tang lau ----------
    '〜かい': art(
      `<rect x="30" y="14" width="40" height="64" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M30 30 h40 M30 46 h40 M30 62 h40" stroke="${INK}" stroke-width="2"/>` +
      `<rect x="30" y="46" width="40" height="16" fill="${ACCENT}" opacity="0.35" stroke="none"/>` +
      `<text x="50" y="58" font-size="12" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">N</text>` +
      tag('tầng ~', 94, INK, 11, 600)),

    'なんがい': art(
      `<rect x="30" y="14" width="40" height="64" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M30 30 h40 M30 46 h40 M30 62 h40" stroke="${INK}" stroke-width="2"/>` +
      `<rect x="30" y="30" width="40" height="16" fill="${GOLD}" opacity="0.35" stroke="none"/>` +
      `<text x="50" y="43" font-size="16" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      tag('tầng mấy?', 94, GOLD, 11, 700)),

    'ロビー': art(
      `<rect x="10" y="20" width="80" height="56" rx="2" stroke="${INK}" stroke-width="3" fill="none"/>` +
      `<rect x="20" y="50" width="30" height="14" rx="4" stroke="${ACCENT}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<path d="M20 50 v-8 a4 4 0 0 1 8 0 M42 50 v-8 a4 4 0 0 1 8 0" stroke="${ACCENT}" stroke-width="2.2"/>` +
      `<circle cx="70" cy="46" r="3" fill="${SAGE}" stroke="none"/>` +
      `<path d="M70 49 v18 M64 58 q6 -4 12 0" stroke="${SAGE}" stroke-width="2.2"/>` +
      tag('sảnh lớn', 94, INK, 11, 600)),

    // ---------- nuoc ngoai & ga tau ----------
    'イタリア': art(
      `<path d="M44 12 h8 v18 q10 2 8 12 v6 q8 4 6 12 l-4 16 h-8 l-2 -8 -6 8 h-8 l2 -12 q-8 -2 -6 -10 v-8 q0 -8 8 -10 z" stroke="${SAGE}" stroke-width="2.8" fill="${PAPER}"/>` +
      `<circle cx="48" cy="8" r="3" fill="${ACCENT}" stroke="none"/>` +
      tag('nước Ý', 94, INK, 12, 700)),

    'スイス': art(
      `<path d="M10 66 L28 34 L40 54 L54 24 L70 56 L82 40 L92 66 Z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M24 40 l4 -6 4 6 M50 30 l4 -6 4 6" stroke="${INK}" stroke-width="2"/>` +
      `<rect x="40" y="70" width="20" height="14" fill="${ACCENT}" stroke="none"/>` +
      `<path d="M48 73 v8 M45 77 h6" stroke="${PAPER}" stroke-width="2.5"/>` +
      tag('Thụy Sĩ', 94, INK, 12, 700)),

    'しんおおさか': art(
      `<path d="M14 54 q0 -16 18 -16 h44 q18 0 18 16 v8 h-80 z" stroke="${INK}" stroke-width="3" fill="${PAPER}"/>` +
      `<path d="M14 58 q-8 0 -8 8 l8 -2 z" stroke="${INK}" stroke-width="2.5" fill="${PAPER}"/>` +
      `<rect x="24" y="42" width="14" height="10" rx="2" stroke="${ACCENT}" stroke-width="2"/>` +
      `<rect x="44" y="42" width="14" height="10" rx="2" stroke="${ACCENT}" stroke-width="2"/>` +
      `<rect x="64" y="42" width="14" height="10" rx="2" stroke="${ACCENT}" stroke-width="2"/>` +
      `<circle cx="30" cy="66" r="5" stroke="${INK}" stroke-width="2.5"/>` +
      `<circle cx="74" cy="66" r="5" stroke="${INK}" stroke-width="2.5"/>` +
      `<path d="M6 78 h88" stroke="${SAGE}" stroke-width="2.5"/>` +
      tag('ga Shin-Osaka', 92, INK, 10, 600)),

    // ---------- tien te ----------
    '〜えん': art(
      coin(50, 46, 26, GOLD) +
      tag('~ yên', 92, GOLD, 13, 700)),

    'いくら': art(
      coin(36, 50, 20, GOLD) +
      `<text x="72" y="46" font-size="26" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">?</text>` +
      tag('bao nhiêu tiền?', 92, ACCENT, 10, 700)),

    'ひゃく': art(
      `<circle cx="50" cy="46" r="30" stroke="${GOLD}" stroke-width="3" fill="${PAPER}"/>` +
      `<text x="50" y="54" font-size="24" fill="${GOLD}" font-weight="800" text-anchor="middle" stroke="none">100</text>` +
      tag('một trăm', 92, INK, 12, 600)),

    'せん': art(
      `<rect x="14" y="54" width="72" height="28" rx="3" stroke="${ACCENT}" stroke-width="3" fill="${PAPER}"/>` +
      `<text x="50" y="74" font-size="22" fill="${ACCENT}" font-weight="800" text-anchor="middle" stroke="none">1000</text>` +
      `<circle cx="24" cy="68" r="5" stroke="${GOLD}" stroke-width="2"/>` +
      `<circle cx="76" cy="68" r="5" stroke="${GOLD}" stroke-width="2"/>` +
      tag('một nghìn', 94, INK, 11, 600)),
  };

  window.SenseiArt.extend(EXTRA);

  // Bi danh theo dang kanji/chu viet — cho tu nao co truong "kanji" khac rong
  window.SenseiArt.extend({
    '本': EXTRA['ほん'],
    '辞書': EXTRA['じしょ'],
    '雑誌': EXTRA['ざっし'],
    '新聞': EXTRA['しんぶん'],
    '手帳': EXTRA['てちょう'],
    '名刺': EXTRA['めいし'],
    '鉛筆': EXTRA['えんぴつ'],
    '鍵': EXTRA['かぎ'],
    '時計': EXTRA['とけい'],
    '傘': EXTRA['かさ'],
    '鞄': EXTRA['かばん'],
    'CD': EXTRA['シーディー'],
    '車': EXTRA['くるま'],
    '机': EXTRA['つくえ'],
    '椅子': EXTRA['いす'],
    '[お]土産': EXTRA['[お]みやげ'],
    '英語': EXTRA['えいご'],
    '日本語': EXTRA['にほんご'],
    '〜語': EXTRA['〜ご'],
    '何': EXTRA['なん'],
    '違います': EXTRA['ちがいます'],
    'ほんの気持ちです': EXTRA['ほんのきもちです'],
    'これからお世話になります': EXTRA['これからおせわになります'],
    '教室': EXTRA['きょうしつ'],
    '食堂': EXTRA['しょくどう'],
    '事務所': EXTRA['じむしょ'],
    '会議室': EXTRA['かいぎしつ'],
    '受付': EXTRA['うけつけ'],
    '部屋': EXTRA['へや'],
    '階段': EXTRA['かいだん'],
    '国': EXTRA['くに'],
    '会社': EXTRA['かいしゃ'],
    '家': EXTRA['うち'],
    '電話': EXTRA['でんわ'],
    '靴': EXTRA['くつ'],
    '売り場': EXTRA['うりば'],
    '地下': EXTRA['ちか'],
    '〜階': EXTRA['〜かい'],
    '何階': EXTRA['なんがい'],
    '新大阪': EXTRA['しんおおさか'],
    '〜円': EXTRA['〜えん'],
    '百': EXTRA['ひゃく'],
    '千': EXTRA['せん'],
  });
})();
