/**
 * MEO SENSEI — nhan vat meo cam deo kinh, ve bang SVG, dung tren man hinh.
 *
 * Cung mot giao dien window.SenseiAvatar voi ban nguoi 3D (sensei-avatar.js),
 * nen app.js / slide-engine.js / tool cua Gemini khong can biet dang dung ban nao.
 *
 * Vi sao nhin tu nhien duoc du khong co tep hoat hinh: MOI thong so (goc tay,
 * nghieng dau, do mo mat...) deu chay qua mot LO XO chu khong nhay thang toi
 * dich. Lo xo hoi vuot qua roi nay lai — dung cai "nhun nhay" cua phim hoat
 * hinh. Cong them nhip song nen: tho, vay duoi, giat tai, chop mat, liec mat.
 */
(function () {
  'use strict';

  const MAU = { cam: '#F4A259', camDam: '#D9822B', kem: '#FFF3E0', hong: '#F6A5B6',
                vien: '#6B3F1D', mat: '#2A211C', kinh: '#5A3A1C' };

  // Toa do ve (viewBox 200 x 220). Chan cham dat o y = 210.
  const VAI_TRAI = [70, 146], VAI_PHAI = [130, 146];
  const DAI_TAY = 40;

  const HINH = `
  <ellipse cx="100" cy="212" rx="46" ry="7" fill="rgba(0,0,0,.13)" data-p="bong"/>
  <g data-p="goc">
    <g data-p="duoi">
      <path d="M128,184 C168,182 178,146 160,118" fill="none" stroke="${MAU.cam}" stroke-width="13" stroke-linecap="round" data-p="duoiNet"/>
      <path d="M163,128 C166,122 165,118 160,118" fill="none" stroke="${MAU.camDam}" stroke-width="13" stroke-linecap="round"/>
    </g>
    <g data-p="chanTrai"><ellipse cx="82" cy="203" rx="15" ry="9" fill="${MAU.cam}" stroke="${MAU.vien}" stroke-width="2.5"/></g>
    <g data-p="chanPhai"><ellipse cx="118" cy="203" rx="15" ry="9" fill="${MAU.cam}" stroke="${MAU.vien}" stroke-width="2.5"/></g>
    <g data-p="than">
      <ellipse cx="100" cy="166" rx="42" ry="40" fill="${MAU.cam}" stroke="${MAU.vien}" stroke-width="2.5"/>
      <ellipse cx="100" cy="174" rx="25" ry="27" fill="${MAU.kem}"/>
      <path d="M86,140 Q100,150 114,140" fill="none" stroke="#C0392B" stroke-width="5" stroke-linecap="round"/>
      <circle cx="100" cy="149" r="4.5" fill="#F1C40F" stroke="${MAU.vien}" stroke-width="1.5"/>
    </g>
    <g data-p="dau">
      <g data-p="taiTrai">
        <path d="M60,76 L60,30 L92,56 Z" fill="${MAU.cam}" stroke="${MAU.vien}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M65,66 L65,42 L83,57 Z" fill="${MAU.hong}"/>
      </g>
      <g data-p="taiPhai">
        <path d="M140,76 L140,30 L108,56 Z" fill="${MAU.cam}" stroke="${MAU.vien}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M135,66 L135,42 L117,57 Z" fill="${MAU.hong}"/>
      </g>
      <ellipse cx="100" cy="94" rx="52" ry="45" fill="${MAU.cam}" stroke="${MAU.vien}" stroke-width="2.5"/>
      <path d="M92,52 L94,64 M100,50 L100,64 M108,52 L106,64" stroke="${MAU.camDam}" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="100" cy="112" rx="26" ry="19" fill="${MAU.kem}"/>
      <ellipse cx="70" cy="108" rx="9" ry="5.5" fill="${MAU.hong}" data-p="maTrai"/>
      <ellipse cx="130" cy="108" rx="9" ry="5.5" fill="${MAU.hong}" data-p="maPhai"/>
      ${mat('Trai', 80)}
      ${mat('Phai', 120)}
      <g data-p="kinh" fill="rgba(255,255,255,.18)" stroke="${MAU.kinh}" stroke-width="3">
        <circle cx="80" cy="93" r="14"/><circle cx="120" cy="93" r="14"/>
        <path d="M94,92 Q100,88 106,92" fill="none"/>
      </g>
      <path d="M68,75 L90,77" stroke="${MAU.mat}" stroke-width="4" stroke-linecap="round" data-p="mayTrai"/>
      <path d="M132,75 L110,77" stroke="${MAU.mat}" stroke-width="4" stroke-linecap="round" data-p="mayPhai"/>
      <path d="M96,105 L104,105 L100,110 Z" fill="${MAU.hong}" stroke="${MAU.vien}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M89,113 Q94.5,119 100,113 Q105.5,119 111,113" fill="none" stroke="${MAU.mat}" stroke-width="2.5" stroke-linecap="round" data-p="miengW"/>
      <g data-p="miengMo">
        <ellipse cx="100" cy="116" rx="8" ry="7" fill="#8E2C2C" stroke="${MAU.mat}" stroke-width="2"/>
        <ellipse cx="100" cy="120" rx="5" ry="2.8" fill="${MAU.hong}"/>
      </g>
      <g stroke="${MAU.vien}" stroke-width="1.6" stroke-linecap="round" opacity=".7">
        <path d="M58,110 L40,106 M58,115 L39,117"/><path d="M142,110 L160,106 M142,115 L161,117"/>
      </g>
    </g>
    <!-- Tay ve SAU dau: gio len mieng thi phai nam de len mat -->
    ${tay('Trai', VAI_TRAI)}
    ${tay('Phai', VAI_PHAI)}
  </g>`;

  function tay(ben, [x, y]) {
    return `
    <g data-p="tay${ben}" transform="translate(${x},${y})">
      <g data-p="thuoc${ben}" opacity="0">
        <line x1="0" y1="${DAI_TAY}" x2="0" y2="${DAI_TAY + 46}" stroke="#8B5A2B" stroke-width="4" stroke-linecap="round"/>
        <circle cx="0" cy="${DAI_TAY + 47}" r="3.5" fill="#E74C3C" data-p="dauThuoc${ben}"/>
      </g>
      <rect x="-8.5" y="-4" width="17" height="${DAI_TAY + 2}" rx="8.5" fill="${MAU.cam}" stroke="${MAU.vien}" stroke-width="2.5"/>
      <circle cx="0" cy="${DAI_TAY}" r="10" fill="${MAU.kem}" stroke="${MAU.vien}" stroke-width="2.5" data-p="ban${ben}"/>
      <text x="0" y="${DAI_TAY + 8}" font-size="24" text-anchor="middle" data-p="doVat${ben}"></text>
    </g>`;
  }

  function mat(ben, x) {
    return `
    <g data-p="mat${ben}">
      <ellipse cx="${x}" cy="93" rx="7" ry="9" fill="${MAU.mat}"/>
      <circle cx="${x + 2.5}" cy="89.5" r="2.6" fill="#fff" data-p="dom${ben}"/>
    </g>
    <path d="M${x - 8},96 Q${x},86 ${x + 8},96" fill="none" stroke="${MAU.mat}" stroke-width="3.2" stroke-linecap="round" data-p="matCuoi${ben}" opacity="0"/>
    <path d="M${x - 8},93 Q${x},99 ${x + 8},93" fill="none" stroke="${MAU.mat}" stroke-width="3.2" stroke-linecap="round" data-p="matNham${ben}" opacity="0"/>`;
  }

  // -------------------------------------------------------------------------
  // LO XO: moi thong so co vi tri + van toc, bi keo ve dich
  // -------------------------------------------------------------------------
  const MAC_DINH = {
    nhun: 0, bep: 1, nghieng: 0, nhay: 0,
    dauXoay: 0, dauHa: 0,
    tayTrai: 10, tayPhai: -10, daiTrai: 1, daiPhai: 1,
    duoi: 0, taiTrai: 0, taiPhai: 0,
    moMat: 1, cuoi: 0, nham: 0, liecX: 0, liecY: 0,
    may: 0, hienMay: 0, mieng: 0, ma: 0.35, xu: 0,
    chanTrai: 0, chanPhai: 0,
  };
  // [do cung, giam chan] — nho thi mem va nay nhieu
  const LO_XO = {
    tayTrai: [110, 11], tayPhai: [110, 11], daiTrai: [260, 16], daiPhai: [260, 16],
    dauXoay: [80, 10], dauHa: [120, 12], nghieng: [90, 10], nhay: [160, 9], nhun: [260, 18],
    duoi: [60, 6], taiTrai: [240, 11], taiPhai: [240, 11],
    moMat: [700, 40], cuoi: [220, 22], nham: [220, 22], liecX: [180, 18], liecY: [180, 18],
    mieng: [600, 30],
  };
  const P = {}, VT = {};
  for (const k in MAC_DINH) { P[k] = MAC_DINH[k]; VT[k] = 0; }

  function buocLoXo(dich, dt) {
    for (const k in MAC_DINH) {
      const d = dich[k] ?? MAC_DINH[k];
      const [cung, giam] = LO_XO[k] || [200, 20];
      VT[k] += ((d - P[k]) * cung - VT[k] * giam) * dt;
      P[k] += VT[k] * dt;
    }
  }

  // -------------------------------------------------------------------------
  // DONG TAC. Moi ham nhan t (giay) tra ve dich cho mot so thong so.
  // Goc tay: 0 = buong thong, duong = xoay theo chieu kim dong ho.
  // Tay TRAI (ben trai man hinh) gio ngang ra ngoai = +90, tay PHAI = -90.
  // -------------------------------------------------------------------------
  const s = (t, f = 1) => Math.sin(t * Math.PI * 2 * f);

  const DONG_TAC = {
    an: (t) => ({ tayTrai: -130 + 8 * s(t, 1.5), tayPhai: 130 - 8 * s(t, 1.5), daiTrai: 0.9, daiPhai: 0.9,
                  mieng: (s(t, 3) + 1) * 0.45, cuoi: 0.6, ma: 0.8, dauHa: 2,
                  doVat: ['Phai', '🐟'] }),
    uong: (t) => ({ tayPhai: 128, daiPhai: 0.9, dauXoay: -8, dauHa: -4, nham: Math.min(1, t * 2),
                    doVat: ['Phai', '🥛'] }),
    ngu: (t) => ({ nham: 1, dauXoay: 14 + 2 * s(t, 0.3), dauHa: 6, tayTrai: -60, tayPhai: 60, daiTrai: 0.8,
                   daiPhai: 0.8, bep: 1 + 0.03 * s(t, 0.35), taiTrai: 10, taiPhai: -10, ma: 0.6, bong: '💤' }),
    day: (t) => ({ tayTrai: 160, tayPhai: -160, daiTrai: 1.1, daiPhai: 1.1, nhay: t < 0.6 ? 8 : 0,
                   mieng: t < 1.4 ? 0.9 : 0, nham: t < 1.4 ? 1 : 0, bep: t < 1.4 ? 1.06 : 1, bong: '☀️' }),
    vay: (t) => ({ tayPhai: -150 + 22 * s(t, 1.6), cuoi: 1, ma: 0.8, dauXoay: 6, bong: '👋' }),
    cui: (t) => {
      const k = t < 0.4 ? t / 0.4 : t < 1.5 ? 1 : Math.max(0, 1 - (t - 1.5) / 0.4);
      return { dauHa: 16 * k, bep: 1 - 0.1 * k, nham: k, tayTrai: -30 * k, tayPhai: 30 * k, bong: '🙇' };
    },
    toi: () => ({ tayPhai: 70, daiPhai: 0.85, cuoi: 0.5, dauXoay: -4 }),
    ban: (t) => ({ tayPhai: -40, daiPhai: 0.6, liecY: 0.3, may: 0.3, hienMay: 0.4, dauXoay: 4 * s(t, 0.5) }),
    nghi: (t) => ({ tayPhai: 124, daiPhai: 0.75, liecX: 0.6, liecY: -0.9, dauXoay: 10, may: -0.6, hienMay: 0.8,
                    duoiNhanh: 0.5, bong: '❓' }),
    viet: (t) => ({ tayTrai: -55, daiTrai: 0.8, tayPhai: 58 + 8 * s(t, 3), daiPhai: 0.85, liecY: 1, dauHa: 4,
                    doVat: ['Phai', '✏️'] }),
    doc: (t) => ({ tayTrai: -52, tayPhai: 52, daiTrai: 0.8, daiPhai: 0.8, liecY: 1, liecX: 0.4 * s(t, 0.4),
                   dauHa: 5, doVat: ['Trai', '📖'] }),
    nhin: (t) => ({ tayPhai: 165, daiPhai: 1.3, liecX: s(t, 0.35), dauXoay: 8 * s(t, 0.35), bong: '👀' }),
    nghe: (t) => ({ tayTrai: 175, daiTrai: 1.4, taiTrai: -14, dauXoay: -12, liecX: -0.6, bong: '👂' }),
    noi: (t) => ({ tayTrai: 55 + 25 * s(t, 0.8), tayPhai: -55 + 25 * s(t + 0.4, 0.8), mieng: (s(t, 3.5) + 1) * 0.35,
                   dauXoay: 5 * s(t, 0.6), bong: '💬' }),
    mua: (t) => ({ tayPhai: -40 + 6 * s(t, 1), daiPhai: 0.8, cuoi: 0.6, doVat: ['Phai', '💴'] }),
    boi: (t) => ({ tayTrai: 90 + 80 * s(t, 0.9), tayPhai: -90 + 80 * s(t + 0.5, 0.9), nghieng: 6 * s(t, 0.9),
                   cuoi: 0.5, bong: '🏊' }),
    cho: (t) => ({ tayTrai: -60, daiTrai: 0.8, liecX: -0.6, liecY: 0.8, dauXoay: -6, may: 0.6, hienMay: 0.7,
                   chanPhai: Math.max(0, s(t, 2)) * 5, bong: '⌚' }),
    hat: (t) => ({ tayPhai: 70, daiPhai: 0.85, tayTrai: 120, daiTrai: 1, dauXoay: 10 * s(t, 0.6),
                   nghieng: 5 * s(t, 0.6), mieng: 0.3 + 0.25 * (s(t, 2) + 1), nham: 1, ma: 0.9, bong: '🎵' }),
    rua: (t) => ({ tayTrai: -50 + 12 * s(t, 2.5), tayPhai: 50 + 12 * s(t, 2.5), daiTrai: 0.8, daiPhai: 0.8,
                   liecY: 1, bong: '🫧' }),
    vui: (t) => ({ tayTrai: 155, tayPhai: -155, nhay: Math.max(0, s(t, 1.2)) * 16, cuoi: 1, ma: 1,
                   duoiNhanh: 1, bong: '✨' }),
    gian: (t) => ({ tayTrai: 38, tayPhai: -38, daiTrai: 0.75, daiPhai: 0.75, may: 1, hienMay: 1, xu: 1,
                    taiTrai: -32, taiPhai: 32, dauXoay: 9 * s(t, 1.3), moMat: 0.75, ma: 0, bong: '💢' }),
    ngac_nhien: (t) => ({ tayTrai: 140, tayPhai: -140, daiTrai: 0.8, daiPhai: 0.8, nhay: t < 0.3 ? 14 : 0,
                          moMat: 1.3, mieng: 0.7, taiTrai: 8, taiPhai: -8, xu: 0.5, bong: '❗' }),
    gat_dau: (t) => ({ dauHa: 9 * Math.max(0, s(t, 1.4)), cuoi: 0.7 }),
  };
  const DI_BO = { di: 1, chay: 2.2 };
  const THOI_LUONG = { cui: 2.1, day: 2.4, gat_dau: 1.6, ngac_nhien: 1.8, vui: 2.4 };

  const CAM_XUC = {
    happy:     { cuoi: 1, ma: 0.9, duoiNhanh: 1 },
    angry:     { may: 1, hienMay: 1, xu: 1, taiTrai: -30, taiPhai: 30, moMat: 0.75, ma: 0 },
    sad:       { may: -1, hienMay: 1, taiTrai: 22, taiPhai: -22, moMat: 0.7, dauXoay: 8, dauHa: 4, ma: 0.1 },
    surprised: { moMat: 1.3, mieng: 0.5, taiTrai: 8, taiPhai: -8 },
    relaxed:   { moMat: 0.55, ma: 0.7, dauXoay: 6 },
  };

  // Tu vung -> dong tac (doc romaji trong giao trinh, ca the ます lan the tu dien)
  const TU_DIEN_DONG_TAC = [
    [/^tabe/, 'an'], [/^nom(i|u)/, 'uong'], [/^ne(masu|ru)$/, 'ngu'], [/^oki(masu|ru)$/, 'day'],
    [/^(iki|iku$|dekake|kaeri|kaeru$|aruk)/, 'di'], [/^(kimasu|kuru)$/, 'di'], [/^hashir/, 'chay'],
    [/^(mi(masu|ru)$|mise)/, 'nhin'], [/^(kik(i|u)|denwa)/, 'nghe'], [/^(kak(i|u)|tegami)/, 'viet'],
    [/^(yom(i|u)|hon$|benkyou)/, 'doc'], [/^hanas/, 'noi'], [/^(kaimasu|kau)$/, 'mua'],
    [/^oyog/, 'boi'], [/^(machi|matsu)/, 'cho'], [/^(aimasu|au)$/, 'vay'], [/^uta/, 'hat'],
    [/^ara(i|u)/, 'rua'], [/^asob/, 'vui'], [/^yasum/, 'ngu'], [/^wakar/, 'nghi'],
    [/^watashi/, 'toi'], [/^anata/, 'ban'], [/^neko/, 'vui'],
    [/^(ohayou|konnichiwa|konbanwa|sayounara|jaa|mata|oyasumi)/, 'vay'],
    [/^(arigatou|sumimasen|hajimemashite|douzo|yoroshiku|gomen|shitsurei|onegai)/, 'cui'],
  ];
  function dongTacChoTu(romaji) {
    const r = String(romaji || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!r) return null;
    for (const [mau, ten] of TU_DIEN_DONG_TAC) if (mau.test(r)) return ten;
    return null;
  }

  // -------------------------------------------------------------------------
  // SAN KHAU
  // -------------------------------------------------------------------------
  const S = {
    san: false, tat: false,
    x: null, dichX: null, nhip: 0, dangDi: 0,
    chi: null, bam: 0, dongTac: null, camXuc: null, nghiTu: 0,
    chop: 0, giatTai: 0, liec: { x: 0, y: 0, den: 0 },
    mieng: 0, truoc: performance.now(),
  };
  let hop, svg, laser, ctx2d, bong, nut;
  const q = {};

  const kichThuoc = () => {
    const W = innerWidth, H = innerHeight;
    const hep = W < 700;
    const cao = hep ? Math.max(110, Math.min(H * 0.17, 150)) : Math.max(150, Math.min(H * 0.27, 230));
    const chan = H - (document.querySelector('.deck-bottom')?.offsetHeight || 64) - 4;
    return { W, H, cao, rong: cao * 200 / 220, chan, hep };
  };
  const tiLe = () => kichThuoc().cao / 220;
  const viTriNha = () => { const { W, rong } = kichThuoc(); return W - rong * 0.62; };

  function dungSanKhau() {
    hop = document.createElement('div');
    hop.id = 'senseiMeo';
    Object.assign(hop.style, { position: 'fixed', left: '0', top: '0', pointerEvents: 'none', zIndex: '85',
      willChange: 'transform' });
    hop.innerHTML = `<svg viewBox="0 0 200 220" width="100%" height="100%" overflow="visible">${HINH}</svg>`;
    svg = hop.firstChild;
    svg.querySelectorAll('[data-p]').forEach((el) => { q[el.dataset.p] = el; });
    document.body.appendChild(hop);

    laser = document.createElement('canvas');
    Object.assign(laser.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh',
      pointerEvents: 'none', zIndex: '84' });
    document.body.appendChild(laser);
    ctx2d = laser.getContext('2d');

    bong = document.createElement('div');
    Object.assign(bong.style, { position: 'fixed', zIndex: '86', pointerEvents: 'none', fontSize: '28px',
      transition: 'opacity .25s, transform .25s', opacity: '0', transform: 'translate(-50%,-100%) scale(.6)' });
    document.body.appendChild(bong);

    const st = document.createElement('style');
    st.textContent = `
      .sensei-gon { position: fixed; z-index: 86; pointer-events: none; width: 16px; height: 16px;
        margin: -8px 0 0 -8px; border-radius: 50%; border: 3px solid #f43f5e;
        animation: senseiGon .6s ease-out forwards; }
      @keyframes senseiGon { from { transform: scale(.3); opacity: 1 } to { transform: scale(3.2); opacity: 0 } }`;
    document.head.appendChild(st);

    nut = document.createElement('button');
    nut.type = 'button';
    nut.title = 'Ẩn / hiện Mèo Sensei';
    nut.textContent = '🐱';
    Object.assign(nut.style, { position: 'fixed', right: '10px', zIndex: '87', width: '34px', height: '34px',
      borderRadius: '50%', border: '1px solid rgba(0,0,0,.12)', background: 'rgba(255,255,255,.85)',
      fontSize: '17px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,.12)' });
    nut.addEventListener('click', () => window.SenseiAvatar.an(!S.tat));
    document.body.appendChild(nut);

    const doiCo = () => {
      const { W, H, cao, rong, chan } = kichThuoc();
      hop.style.width = rong + 'px';
      hop.style.height = cao + 'px';
      laser.width = W * devicePixelRatio; laser.height = H * devicePixelRatio;
      nut.style.bottom = (H - chan + 6) + 'px';
      if (S.x === null) S.x = S.dichX = viTriNha();
      S.x = Math.min(S.x, W - rong * 0.4);
    };
    addEventListener('resize', doiCo);
    doiCo();
  }

  // -------------------------------------------------------------------------
  // MOI KHUNG HINH
  // -------------------------------------------------------------------------
  function khungHinh() {
    requestAnimationFrame(khungHinh);
    capNhat();
  }

  function capNhat() {
    const nowMs = performance.now();
    const dt = Math.min((nowMs - S.truoc) / 1000, 0.05);
    S.truoc = nowMs;
    if (!S.san || S.tat || dt <= 0) return;
    const now = nowMs / 1000;
    const { cao, rong, chan, W } = kichThuoc();
    const k = cao / 220;

    if (S.dongTac && now > S.dongTac.den) { S.dongTac = null; anBong(); }
    if (S.chi && now > S.chi.den) S.chi = null;
    if (S.camXuc && now > S.camXuc.den) S.camXuc = null;

    // --- di chuyen
    const buocDi = S.dongTac && DI_BO[S.dongTac.ten];
    if (buocDi) {
      const g = S.dongTac.goc ?? (S.dongTac.goc = S.x);
      S.dichX = Math.max(rong * 0.5, Math.min(W - rong * 0.5,
        g + Math.sin((now - S.dongTac.batDau) * 1.1 * buocDi) * rong * 1.1));
    } else if (!S.chi && !S.dongTac && now - S.nghiTu > 9) {
      S.dichX = viTriNha();
    }
    const conLai = S.dichX - S.x;
    const tocDo = (buocDi ? 1.6 * buocDi : 3.2) * rong;
    S.x += Math.sign(conLai) * Math.min(Math.abs(conLai), tocDo * dt);
    const dangDi = Math.abs(conLai) > 1;
    S.dangDi += ((dangDi ? 1 : 0) - S.dangDi) * Math.min(1, dt * 10);
    if (dangDi) S.nhip += dt * (buocDi ? 9 * Math.sqrt(buocDi) : 12);
    const huongDi = Math.sign(conLai);

    // --- dich cua lo xo: nen -> di bo -> dong tac -> cam xuc -> chi tay
    const d = { ...MAC_DINH };
    d.tayTrai = 10 + 3 * s(now, 0.3);
    d.tayPhai = -10 - 3 * s(now + 0.2, 0.3);
    d.dauXoay = 3 * s(now, 0.13) + 2 * s(now, 0.31);

    // Liec mat quanh lop, chop mat, giat tai — ngau nhien cho giong that
    if (now > S.liec.den) {
      S.liec = { x: (Math.random() - 0.5) * 1.2, y: (Math.random() - 0.5) * 0.6, den: now + 1.5 + Math.random() * 3 };
    }
    d.liecX = S.liec.x; d.liecY = S.liec.y;
    if (now > S.chop) S.chop = now + 2 + Math.random() * 3.5;
    const dangChop = S.chop - now < 0.13;
    if (now > S.giatTai) S.giatTai = now + 3 + Math.random() * 5;
    const giat = S.giatTai - now < 0.12;
    const benGiat = Math.floor(S.giatTai) % 2 ? 'taiTrai' : 'taiPhai';

    if (S.dangDi > 0.05) {
      const p = S.nhip;
      d.nhun = -Math.abs(Math.sin(p)) * 7 * S.dangDi;
      d.nghieng = (5 * Math.sin(p) + huongDi * 5) * S.dangDi;
      d.chanTrai = Math.max(0, Math.sin(p)) * 7 * S.dangDi;
      d.chanPhai = Math.max(0, -Math.sin(p)) * 7 * S.dangDi;
      d.tayTrai = 12 + 22 * Math.sin(p) * S.dangDi;
      d.tayPhai = -12 + 22 * Math.sin(p) * S.dangDi;
    }

    let doVat = null, duoiNhanh = 0.35;
    const ap = (o) => {
      if (!o) return;
      for (const key in o) {
        if (key === 'doVat') doVat = o.doVat;
        else if (key === 'duoiNhanh') duoiNhanh = o.duoiNhanh;
        else if (key !== 'bong') d[key] = o[key];
      }
    };
    if (S.dongTac && DONG_TAC[S.dongTac.ten]) ap(DONG_TAC[S.dongTac.ten](now - S.dongTac.batDau));
    if (S.camXuc) ap(CAM_XUC[S.camXuc.ten]);
    if (giat) d[benGiat] += benGiat === 'taiTrai' ? -18 : 18;
    if (dangChop && d.nham < 0.5) d.moMat = 0.05;

    // Chi tay: tay phia gan phan tu gio thang toi no, mat va dau nhin theo
    let benChi = null;
    if (S.chi) {
      const r = S.chi.el.getBoundingClientRect();
      const tx = r.left + r.width / 2, ty = r.top + r.height / 2;
      benChi = tx < S.x ? 'Trai' : 'Phai';
      const vai = benChi === 'Trai' ? VAI_TRAI : VAI_PHAI;
      const vx = S.x - rong / 2 + vai[0] * k, vy = chan - cao + vai[1] * k;
      let goc = Math.atan2(-(tx - vx), ty - vy) * 180 / Math.PI;
      goc -= P.nghieng;
      d['tay' + benChi] = goc;
      const dam = Math.max(0, 1 - (now - S.bam) / 0.3);
      d['dai' + benChi] = 1.05 + dam * 0.3;
      const dx = tx - S.x, dy = ty - (chan - cao * 0.6);
      const dai = Math.hypot(dx, dy) || 1;
      d.liecX = dx / dai; d.liecY = dy / dai;
      d.dauXoay = THREE_clamp(dx / dai * 8, -10, 10);
      if (!S.dongTac && !S.camXuc) { d.may = 0.25; d.hienMay = 0.5; }
    }

    // Mieng theo giong dang phat
    const muc = window.__audioEngine?.getOutputLevel?.() || 0;
    S.mieng += (Math.min(1, muc * 9) - S.mieng) * Math.min(1, dt * 25);
    d.mieng = Math.max(d.mieng, S.mieng);

    buocLoXo(d, dt);

    // --- dua thong so len hinh
    const duoi = 14 * s(now, duoiNhanh * (1 + d.xu)) + (d.xu ? -10 : 0);
    ve(k, rong, cao, chan, duoi, doVat, benChi);
    veLaser(benChi, now);
    veBong(k, cao, chan, rong);
  }

  const THREE_clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function ve(k, rong, cao, chan, duoi, doVat, benChi) {
    hop.style.transform = `translate(${S.x - rong / 2}px, ${chan - cao}px)`;
    const tho = 1 + 0.018 * s(performance.now() / 1000, 0.4);
    const bep = P.bep * tho, gian = 1 / Math.sqrt(bep);
    const xu = 1 + 0.05 * P.xu;
    q.goc.setAttribute('transform',
      `translate(0 ${P.nhun - P.nhay}) rotate(${P.nghieng} 100 210) translate(100 210) scale(${gian * xu} ${bep * xu}) translate(-100 -210)`);
    q.bong.setAttribute('rx', 46 - P.nhay * 0.8);
    q.dau.setAttribute('transform', `rotate(${P.dauXoay} 100 132) translate(0 ${P.dauHa})`);
    q.duoi.setAttribute('transform', `rotate(${duoi} 128 184)`);
    q.duoiNet.setAttribute('stroke-width', 13 + 7 * P.xu);
    q.taiTrai.setAttribute('transform', `rotate(${P.taiTrai} 72 66)`);
    q.taiPhai.setAttribute('transform', `rotate(${P.taiPhai} 128 66)`);
    q.chanTrai.setAttribute('transform', `translate(0 ${-P.chanTrai})`);
    q.chanPhai.setAttribute('transform', `translate(0 ${-P.chanPhai})`);

    for (const [ben, vai] of [['Trai', VAI_TRAI], ['Phai', VAI_PHAI]]) {
      const goc = P['tay' + ben], dai = P['dai' + ben];
      q['tay' + ben].setAttribute('transform', `translate(${vai[0]} ${vai[1]}) rotate(${goc}) scale(1 ${dai})`);
      q['thuoc' + ben].setAttribute('opacity', benChi === ben ? 1 : 0);
      const dv = q['doVat' + ben];
      const chu = doVat && doVat[0] === ben ? doVat[1] : '';
      if (dv.textContent !== chu) dv.textContent = chu;
      // Giu do vat dung thang du tay dang gio len
      if (chu) dv.setAttribute('transform', `rotate(${-goc} 0 ${DAI_TAY}) scale(1 ${1 / dai})`);
    }

    // Mat: thuong / cuoi ^^ / nham
    const cuoi = THREE_clamp(P.cuoi, 0, 1), nham = THREE_clamp(P.nham, 0, 1);
    const moMat = THREE_clamp(P.moMat, 0.02, 1.4);
    for (const [ben, x] of [['Trai', 80], ['Phai', 120]]) {
      q['mat' + ben].setAttribute('opacity', (1 - cuoi) * (1 - nham));
      q['mat' + ben].setAttribute('transform',
        `translate(${P.liecX * 3} ${P.liecY * 2.5}) translate(${x} 93) scale(${0.9 + 0.1 * moMat} ${moMat}) translate(${-x} -93)`);
      q['matCuoi' + ben].setAttribute('opacity', cuoi * (1 - nham));
      q['matNham' + ben].setAttribute('opacity', nham);
    }
    // May: duong = cau co (dau trong cup xuong), am = buon (dau trong nhuong len)
    q.mayTrai.setAttribute('opacity', THREE_clamp(P.hienMay, 0, 1));
    q.mayPhai.setAttribute('opacity', THREE_clamp(P.hienMay, 0, 1));
    q.mayTrai.setAttribute('transform', `rotate(${P.may * 16} 79 76) translate(0 ${-Math.abs(P.may) * 1.5})`);
    q.mayPhai.setAttribute('transform', `rotate(${-P.may * 16} 121 76) translate(0 ${-Math.abs(P.may) * 1.5})`);

    const mieng = THREE_clamp(P.mieng, 0, 1);
    q.miengW.setAttribute('opacity', Math.max(0, 1 - mieng * 5));
    q.miengMo.setAttribute('opacity', mieng > 0.06 ? 1 : 0);
    q.miengMo.setAttribute('transform', `translate(100 113) scale(${0.7 + 0.3 * mieng} ${0.25 + 0.9 * mieng}) translate(-100 -113)`);
    const ma = THREE_clamp(P.ma, 0, 1);
    q.maTrai.setAttribute('opacity', ma);
    q.maPhai.setAttribute('opacity', ma);
  }

  function veLaser(benChi, now) {
    const W = laser.width, H = laser.height, d = devicePixelRatio;
    ctx2d.clearRect(0, 0, W, H);
    if (!benChi || !S.chi) return;
    const a = q['dauThuoc' + benChi].getBoundingClientRect();
    const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    const r = S.chi.el.getBoundingClientRect();
    const bx = THREE_clamp(ax, r.left, r.right), by = THREE_clamp(ay, r.top, r.bottom);
    ctx2d.save();
    ctx2d.scale(d, d);
    ctx2d.setLineDash([6, 6]);
    ctx2d.lineDashOffset = -now * 40;
    ctx2d.strokeStyle = 'rgba(231,76,60,.7)';
    ctx2d.lineWidth = 2.5;
    ctx2d.beginPath(); ctx2d.moveTo(ax, ay); ctx2d.lineTo(bx, by); ctx2d.stroke();
    ctx2d.setLineDash([]);
    ctx2d.fillStyle = 'rgba(231,76,60,.9)';
    ctx2d.beginPath(); ctx2d.arc(bx, by, 5 + Math.sin(now * 8) * 1.5, 0, Math.PI * 2); ctx2d.fill();
    ctx2d.restore();
  }

  function veBong(k, cao, chan, rong) {
    if (bong.style.opacity === '0') return;
    bong.style.left = (S.x + rong * 0.28) + 'px';
    bong.style.top = (chan - cao + 22 * k + P.nhun - P.nhay) + 'px';
  }
  function hienBong(chu) {
    bong.textContent = chu;
    bong.style.opacity = '1';
    bong.style.transform = 'translate(-50%,-100%) scale(1)';
  }
  function anBong() {
    bong.style.opacity = '0';
    bong.style.transform = 'translate(-50%,-100%) scale(.6)';
  }

  // -------------------------------------------------------------------------
  // LENH TU BEN NGOAI (giong het ban nguoi 3D)
  // -------------------------------------------------------------------------
  function timPhanTu(elHoacId) {
    if (!elHoacId) return null;
    if (elHoacId instanceof Element) return elHoacId;
    return window.__slideEngine?.resolveElement?.(elHoacId) || document.getElementById(elHoacId);
  }

  function chiVao(elHoacId, giay = 4) {
    const el = timPhanTu(elHoacId);
    if (!S.san || !el) return false;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return false;
    const { W, rong, hep } = kichThuoc();
    const tam = r.left + r.width / 2;
    // Dung canh phan tu (uu tien ben phai), khong de len no
    let dung = r.right + rong * 0.55;
    if (dung > W - rong * 0.5) dung = r.left - rong * 0.55;
    if (dung < rong * 0.5) dung = Math.min(W - rong * 0.5, tam + rong);
    const the = document.querySelector('.spotlight:not(.hidden) .spot-dock');
    const rt = the && the.getBoundingClientRect();
    if (rt && rt.width && rt.width < W * 0.6) dung = Math.max(dung, rt.right + rong * 0.55);
    S.dichX = hep ? viTriNha() : Math.min(dung, W - rong * 0.5);
    const now = performance.now() / 1000;
    S.chi = { el, den: now + giay };
    S.nghiTu = now + giay;
    if (S.dongTac && !DI_BO[S.dongTac.ten]) { S.dongTac = null; anBong(); }
    return true;
  }

  function bamVao(elHoacId) {
    const el = timPhanTu(elHoacId);
    if (!chiVao(el, 1.8)) return false;
    const cho = setInterval(() => {
      if (Math.abs(S.dichX - S.x) > 2) return;
      clearInterval(cho);
      S.bam = performance.now() / 1000 + 0.1;
      const r = el.getBoundingClientRect();
      const g = document.createElement('div');
      g.className = 'sensei-gon';
      g.style.left = (r.left + r.width / 2) + 'px';
      g.style.top = (r.top + r.height / 2) + 'px';
      document.body.appendChild(g);
      setTimeout(() => g.remove(), 700);
    }, 60);
    setTimeout(() => clearInterval(cho), 2500);
    return true;
  }

  function dienDongTac(ten, giay) {
    if (!S.san || !(ten in DONG_TAC || ten in DI_BO)) return false;
    const now = performance.now() / 1000;
    S.chi = null;
    S.dongTac = { ten, batDau: now, den: now + (giay || THOI_LUONG[ten] || (DI_BO[ten] ? 3.2 : 3)) };
    S.nghiTu = S.dongTac.den;
    const b = DONG_TAC[ten]?.(0)?.bong || { di: '🐾', chay: '💨' }[ten];
    if (b) hienBong(b); else anBong();
    return true;
  }

  function camXuc(ten, giay = 3) {
    const map = { vui: 'happy', gian: 'angry', buon: 'sad', ngac_nhien: 'surprised', thu_gian: 'relaxed' };
    const t = map[ten] || ten;
    if (!S.san || !CAM_XUC[t]) return false;
    S.camXuc = { ten: t, den: performance.now() / 1000 + giay };
    return true;
  }

  function khiRoiMuc(targetId, found, styleType) {
    if (!S.san) return;
    const ten = found?.type === 'vocab' ? dongTacChoTu(found.data?.romaji) : null;
    clearTimeout(S._henChi);
    S._henChi = setTimeout(() => chiVao(targetId), 350);
    if (styleType === 'warning') camXuc('angry', 3);
    clearInterval(S._henDien);
    if (!ten) return;
    const batDau = Date.now();
    let toiLuc = 0;
    const hen = S._henDien = setInterval(() => {
      const el = timPhanTu(targetId);
      if (!S.chi || S.chi.el !== el) {
        if (Date.now() - batDau > 1000) clearInterval(hen);
        return;
      }
      if (!toiLuc && Math.abs(S.dichX - S.x) < 2) toiLuc = Date.now();
      if (toiLuc && Date.now() - toiLuc > 1100) { clearInterval(hen); dienDongTac(ten); }
    }, 100);
    setTimeout(() => clearInterval(hen), 8000);
  }

  window.SenseiAvatar = {
    kieu: 'meo',
    chiVao, bamVao, dienDongTac, camXuc, khiRoiMuc, dongTacChoTu,
    DANH_SACH_DONG_TAC: [...Object.keys(DONG_TAC), ...Object.keys(DI_BO)],
    get san() { return S.san; },
    an(anDi = true) {
      S.tat = anDi;
      hop.style.display = laser.style.display = anDi ? 'none' : '';
      if (anDi) anBong();
      nut.style.opacity = anDi ? '0.55' : '1';
      try { localStorage.setItem('senseiAvatarAn', anDi ? '1' : '0'); } catch (e) {}
    },
    _S: S, _P: P, _capNhat: capNhat,
  };

  function batDau() {
    dungSanKhau();
    S.san = true;
    let an = false;
    try { an = localStorage.getItem('senseiAvatarAn') === '1'; } catch (e) {}
    if (an) window.SenseiAvatar.an(true);
    khungHinh();
    setTimeout(() => dienDongTac('vay', 2.5), 600);
  }
  if (document.body) batDau(); else addEventListener('DOMContentLoaded', batDau);
})();
