/**
 * MEO SENSEI VIDEO — nhan vat la bo video lam san bang AI (Veo) tu chinh anh meo.
 *
 * Moi doan video BAT DAU va KET THUC o dung tu the cua anh goc, nen noi cac doan
 * voi nhau khong bi giat. Nen xanh duoc xoa ngay tren trinh duyet (WebGL chroma key).
 *
 *   dung-tho   : lap lai khi im lang
 *   dang-giang : lap lai khi giong Sensei dang phat (do tu analyser cua AudioEngine)
 *   vay-tay    : dong tac 'vay' (chao hoi)
 * Dong tac / cam xuc chua co video thi tra false de nhan vat khac (neu co) lo.
 *
 * Them doan moi: dat file vao assets/sensei-meo/video/<ten>.mp4 roi khai bao trong DOAN.
 */
(function () {
  'use strict';

  const THU_MUC = 'assets/sensei-meo/video/';
  const DOAN = {
    'dung-tho':   { lap: true },
    'dang-giang': { lap: true },
    'vay-tay':    { lap: false },
  };
  const DONG_TAC_VIDEO = { vay: 'vay-tay', cui: null, vui: null };
  const TI_LE = 540 / 670;                 // rong / cao cua khung video da cat
  const MAU_NEN = [113 / 255, 194 / 255, 52 / 255];
  // Vi tri tuong doi cua hai ban chan truoc trong khung (de ban tia laser)
  const CHAN_TRAI = [0.2, 0.66], CHAN_PHAI = [0.8, 0.66];

  const hub = window.SenseiAvatarHub;
  const S = {
    san: false, tat: false, x: null, dichX: null, chi: null, nghiTu: 0,
    dang: null, sau: null, tron: 1, truoc: performance.now(), noi: 0, hetNoi: 0,
  };
  const video = {};
  let khung, gl, prog, tex = [], laser, ctx2d;

  // -------------------------------------------------------------------------
  function kichThuoc() {
    const W = innerWidth, H = innerHeight;
    const hep = W < 700;
    const cao = hep ? Math.max(130, Math.min(H * 0.2, 180)) : Math.max(180, Math.min(H * 0.34, 300));
    const chan = H - (document.querySelector('.deck-bottom')?.offsetHeight || 64);
    return { W, H, cao, rong: cao * TI_LE, chan, hep };
  }
  const viTriNha = () => {
    const { W, rong } = kichThuoc();
    return W - (hub ? hub.rongTruoc(api) : 0) - rong * 0.55;
  };

  // -------------------------------------------------------------------------
  // WEBGL: tron 2 doan video (de chuyen mem) + xoa nen xanh + khu vien xanh
  // -------------------------------------------------------------------------
  const VS = `attribute vec2 p; varying vec2 uv;
    void main(){ uv = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }`;
  const FS = `precision mediump float; varying vec2 uv;
    uniform sampler2D a, b; uniform float t; uniform vec3 k;
    vec2 chroma(vec3 c){ return vec2(-.169*c.r - .331*c.g + .5*c.b, .5*c.r - .419*c.g - .081*c.b); }
    vec4 key(vec3 c){
      float d = distance(chroma(c), chroma(k));
      float al = smoothstep(.07, .16, d);
      // Khu anh xanh loang len vien long
      float g = max(c.r, c.b);
      if (c.g > g) c.g = mix(g, c.g, al * al);
      return vec4(c, al);
    }
    void main(){
      vec4 x = key(texture2D(a, uv).rgb), y = key(texture2D(b, uv).rgb);
      vec4 o = mix(x, y, t);
      gl_FragColor = vec4(o.rgb * o.a, o.a);
    }`;

  function dungWebGL() {
    gl = khung.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return false;
    const sh = (loai, src) => { const s = gl.createShader(loai); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const lp = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(lp);
    gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    for (let i = 0; i < 2; i++) {
      tex[i] = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex[i]);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    }
    gl.uniform1i(gl.getUniformLocation(prog, 'a'), 0);
    gl.uniform1i(gl.getUniformLocation(prog, 'b'), 1);
    gl.uniform3fv(gl.getUniformLocation(prog, 'k'), MAU_NEN);
    gl.clearColor(0, 0, 0, 0);
    return true;
  }

  function napKhung(i, v) {
    if (!v || v.readyState < 2) return;
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, tex[i]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v);
  }

  // -------------------------------------------------------------------------
  // CHON DOAN VIDEO
  // -------------------------------------------------------------------------
  function phat(ten, tronGiay = 0.3) {
    const v = video[ten];
    if (!v || (S.dang && S.dang.ten === ten && !S.sau)) return;
    v.currentTime = 0;
    v.play().catch(() => {});
    if (!S.dang) { S.dang = { ten, v }; return; }
    S.sau = { ten, v };
    S.tron = 0;
    S.tocTron = 1 / Math.max(0.01, tronGiay);
  }

  /** Doan nen can chay luc nay: dang noi thi 'dang-giang', im thi 'dung-tho' */
  const doanNen = () => (S.noi > 0.5 ? 'dang-giang' : 'dung-tho');

  function khiHetDoan(ten) {
    // Doan khong lap ket thuc dung tu the goc -> noi sang doan nen, khong can tron
    if (S.dang && S.dang.ten === ten && !S.sau) phat(doanNen(), 0.12);
  }

  // -------------------------------------------------------------------------
  function khungHinh() { requestAnimationFrame(khungHinh); capNhat(); }

  function capNhat() {
    const nowMs = performance.now();
    const dt = Math.min((nowMs - S.truoc) / 1000, 0.05);
    S.truoc = nowMs;
    if (!S.san || S.tat || dt <= 0 || !S.dang) return;
    const now = nowMs / 1000;
    const { W, cao, rong, chan } = kichThuoc();

    // Dang noi? (co tre nha ra de khong nhap nhay giua cac tu)
    const muc = window.__audioEngine?.getOutputLevel?.() || 0;
    if (muc > 0.02) S.hetNoi = now + 0.6;
    const noi = now < S.hetNoi ? 1 : 0;
    if (noi !== S.noi) {
      S.noi = noi;
      const dangLaNen = S.dang.ten === 'dung-tho' || S.dang.ten === 'dang-giang';
      if (dangLaNen && !S.sau) phat(doanNen(), 0.35);
    }
    // Doan lap: het vong thi tu lap (video.loop), nhung neu doan nen doi thi chuyen
    if (S.chi && now > S.chi.den) S.chi = null;
    if (!S.chi && now - S.nghiTu > 9) S.dichX = viTriNha();

    // Truot ngang toi cho can dung, nhun nhe cho khoi trong nhu troi
    const conLai = S.dichX - S.x;
    S.x += Math.sign(conLai) * Math.min(Math.abs(conLai), rong * 3 * dt);
    const dangTruot = Math.abs(conLai) > 1;
    const nhun = dangTruot ? -Math.abs(Math.sin(now * 12)) * cao * 0.02 : 0;
    const nghieng = dangTruot ? Math.sign(conLai) * 2.5 : 0;
    khung.style.width = rong + 'px';
    khung.style.height = cao + 'px';
    khung.style.transform = `translate(${S.x - rong / 2}px, ${chan - cao + nhun}px) rotate(${nghieng}deg)`;

    // Ve
    const dp = Math.min(devicePixelRatio, 2);
    const cw = Math.round(rong * dp), ch = Math.round(cao * dp);
    if (khung.width !== cw || khung.height !== ch) { khung.width = cw; khung.height = ch; }
    gl.viewport(0, 0, cw, ch);
    napKhung(0, S.dang.v);
    let t = 0;
    if (S.sau) {
      napKhung(1, S.sau.v);
      S.tron = Math.min(1, S.tron + dt * S.tocTron);
      t = S.tron;
      if (S.tron >= 1) {
        S.dang.v.pause();
        S.dang = S.sau; S.sau = null;
        napKhung(0, S.dang.v); t = 0;
      }
    }
    gl.uniform1f(gl.getUniformLocation(prog, 't'), t);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    veLaser(now, rong, cao, chan);
  }

  function veLaser(now, rong, cao, chan) {
    const W = laser.width, H = laser.height, d = devicePixelRatio;
    ctx2d.clearRect(0, 0, W, H);
    if (!S.chi || Math.abs(S.dichX - S.x) > 2) return;
    const r = S.chi.el.getBoundingClientRect();
    const tx = r.left + r.width / 2;
    const [cx, cy] = tx < S.x ? CHAN_TRAI : CHAN_PHAI;
    const ax = S.x - rong / 2 + cx * rong, ay = chan - cao + cy * cao;
    const bx = Math.max(r.left, Math.min(r.right, ax)), by = Math.max(r.top, Math.min(r.bottom, ay));
    ctx2d.save(); ctx2d.scale(d, d);
    ctx2d.setLineDash([6, 6]); ctx2d.lineDashOffset = -now * 40;
    ctx2d.strokeStyle = 'rgba(231,76,60,.7)'; ctx2d.lineWidth = 2.5;
    ctx2d.beginPath(); ctx2d.moveTo(ax, ay); ctx2d.lineTo(bx, by); ctx2d.stroke();
    ctx2d.setLineDash([]); ctx2d.fillStyle = 'rgba(231,76,60,.9)';
    ctx2d.beginPath(); ctx2d.arc(bx, by, 5 + Math.sin(now * 8) * 1.5, 0, Math.PI * 2); ctx2d.fill();
    ctx2d.beginPath(); ctx2d.arc(ax, ay, 4, 0, Math.PI * 2); ctx2d.fill();
    ctx2d.restore();
  }

  // -------------------------------------------------------------------------
  // LENH (cung giao dien voi cac nhan vat khac)
  // -------------------------------------------------------------------------
  function timPhanTu(x) {
    if (!x) return null;
    if (x instanceof Element) return x;
    return window.__slideEngine?.resolveElement?.(x) || document.getElementById(x);
  }

  function chiVao(elHoacId, giay = 4) {
    const el = timPhanTu(elHoacId);
    if (!S.san || !el) return false;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return false;
    const { W, rong, hep } = kichThuoc();
    const tam = r.left + r.width / 2;
    const benTrai = hub && hub.thuTu(api) === 1;
    let dung = benTrai ? r.left - rong * 0.5 : r.right + rong * 0.5;
    if (dung > W - rong * 0.5) dung = r.left - rong * 0.5;
    if (dung < rong * 0.5) dung = Math.min(W - rong * 0.5, tam + rong);
    const the = document.querySelector('.spotlight:not(.hidden) .spot-dock');
    const rt = the && the.getBoundingClientRect();
    if (rt && rt.width && rt.width < W * 0.6) dung = Math.max(dung, rt.right + rong * 0.5);
    S.dichX = hep ? viTriNha() : Math.min(dung, W - rong * 0.5);
    const now = performance.now() / 1000;
    S.chi = { el, den: now + giay };
    S.nghiTu = now + giay;
    return true;
  }

  function bamVao(elHoacId) { return chiVao(elHoacId, 1.8); }

  function dienDongTac(ten) {
    const doan = DONG_TAC_VIDEO[ten];
    if (!S.san || !doan || !video[doan]) return false;
    S.chi = null;
    S.nghiTu = performance.now() / 1000 + 4;
    phat(doan, 0.25);
    return true;
  }

  const camXuc = () => false;      // chua co video bieu cam

  function khiRoiMuc(targetId) {
    if (!S.san) return;
    clearTimeout(S._henChi);
    S._henChi = setTimeout(() => chiVao(targetId), 350);
  }

  const api = {
    kieu: 'meo-video', uuTien: 0,
    chiVao, bamVao, dienDongTac, camXuc, khiRoiMuc,
    dongTacChoTu: () => null,
    DANH_SACH_DONG_TAC: Object.keys(DONG_TAC_VIDEO).filter((k) => DONG_TAC_VIDEO[k]),
    get san() { return S.san; },
    get tat() { return S.tat; },
    rongHienTai: () => kichThuoc().rong,
    an(anDi = true) {
      S.tat = anDi;
      if (!khung) return;
      khung.style.display = laser.style.display = anDi ? 'none' : '';
      for (const v of Object.values(video)) if (anDi) v.pause();
      if (!anDi) {
        S.x = S.dichX = viTriNha(); S.truoc = performance.now();
        S.dang?.v.play().catch(() => {});
      }
    },
    _S: S, _capNhat: capNhat, _video: video,
  };

  function batDau() {
    khung = document.createElement('canvas');
    Object.assign(khung.style, { position: 'fixed', left: '0', top: '0', pointerEvents: 'none', zIndex: '85',
      transformOrigin: '50% 100%', willChange: 'transform' });
    document.body.appendChild(khung);
    laser = document.createElement('canvas');
    Object.assign(laser.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh',
      pointerEvents: 'none', zIndex: '84' });
    document.body.appendChild(laser);
    ctx2d = laser.getContext('2d');
    const doiCo = () => { laser.width = innerWidth * devicePixelRatio; laser.height = innerHeight * devicePixelRatio; };
    addEventListener('resize', doiCo);
    doiCo();
    if (!dungWebGL()) { console.warn('[MeoVideo] khong co WebGL'); return; }

    for (const [ten, cfg] of Object.entries(DOAN)) {
      const v = document.createElement('video');
      v.src = THU_MUC + ten + '.mp4';
      v.muted = true; v.playsInline = true; v.preload = 'auto'; v.loop = cfg.lap;
      v.crossOrigin = 'anonymous';
      v.addEventListener('ended', () => khiHetDoan(ten));
      video[ten] = v;
    }

    S.x = S.dichX = viTriNha();
    const sanSang = () => {
      if (S.san) return;
      S.san = true;
      if (hub) hub.dangKy(api); else window.SenseiAvatar = api;
      phat('dung-tho');
      khungHinh();
      setTimeout(() => { if (!S.tat) dienDongTac('vay'); }, 800);
    };
    video['dung-tho'].addEventListener('canplay', sanSang, { once: true });
    video['dung-tho'].load();
  }

  if (document.body) batDau(); else addEventListener('DOMContentLoaded', batDau);
})();
