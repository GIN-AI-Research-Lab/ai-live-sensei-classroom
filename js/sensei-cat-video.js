/**
 * MEO SENSEI CLIP — meo nua than (nguc tro len) dien bang cac clip ngan 60 fps lam san (Veo + noi khung).
 *
 * Moi clip BAT DAU va KET THUC o cung tu the nghi (tru chuoi ngu: ngu-vao -> ngu -> ngu-day), nen clip nao
 * noi tiep clip nao cung khong giat. Nen xanh deu (clip.json: mauNen) xoa tren GPU (WebGL); hai <video>
 * luan phien: mot cai dang chay, cai kia nap san clip sap toi, doi giua chung thi tron cheo.
 *
 *   Dang noi (do tu loa AudioEngine): noi -> noi-tay-trai -> noi -> noi-tay-phai -> ...
 *   Cam xuc (set_emotion / muc bai co "emotion"): thay clip noi ngay (tron <= 250 ms)
 *   Im lang: nghi; khong giang bai thi thinh thoang liem-tay, treo lau thi ngu-gat, lau nua ngu-vao -> ngu
 *   Chi vao muc: gio tay ve phia muc + tia laser tu ban tay (do tu clip that) toi muc luc tay dang gio
 *   Giam chuyen dong / khong co WebGL / hong clip nghi: anh tinh nghi.webp (nen trong suot)
 *
 * Dang ky qua SenseiAvatarHub (js/sensei-avatar-hub.js). Xem thu: window.__senseiClip, ?meoToc=<k> (hen gio nhanh k lan).
 */
(function () {
  'use strict';

  const THU_MUC = 'assets/sensei-meo/clip/';
  const TI_LE = 540 / 494;                       // rong / cao khung clip
  const NAP_TRUOC = ['nghi', 'noi', 'chao'];
  // Nap dan luc ranh, theo thu tu hay dung
  const NAP_SAU = ['noi-tay-phai', 'noi-tay-trai', 'vui', 'de-biu', 'that-vong', 'liem-tay', 'ngu-gat', 'ngac-nhien',
    'suy-nghi', 'cui-chao', 'buon', 'gian', 'xau-ho', 'ngu-vao', 'ngu', 'ngu-day'];
  // Loai clip -> ai duoc ngat ngang (coTheNgat). Khong co ten o day = cam xuc ('cx').
  const LOAI = { nghi: 'nen', noi: 'noi', 'noi-tay-trai': 'tay', 'noi-tay-phai': 'tay', 'liem-tay': 'ranh',
    'ngu-gat': 'ranh', 'ngu-vao': 'ngu', ngu: 'ngu', 'ngu-day': 'day', chao: 'chao', 'cui-chao': 'chao' };
  const LAP = new Set(['nghi', 'noi', 'ngu']);   // chay tiep chinh no thi de trinh duyet tu lap (khong hut khung)
  const XOAY = ['noi', 'noi-tay-trai', 'noi', 'noi-tay-phai'];
  // Cam xuc vua noi vua dien: im han thi duoc cat sau 2.5 s (suy-nghi thi de dien het)
  const CX_NOI = new Set(['vui', 'de-biu', 'that-vong', 'ngac-nhien', 'buon', 'gian', 'xau-ho']);

  // Dau ban tay dang gio, do tu clip that (diem xa vai nhat cua vung khong phai nen, khung 540x494 -> 0..1):
  // [giay, x, y]. ben = ben cua ANH (tay phai cua meo nam ben trai anh). noi-tay-trai gio ca hai tay lan luot.
  const TAY = {
    'noi-tay-trai': [
      { ben: 'phai', d: [[.67, .89, .54], [.83, .91, .53], [.92, .93, .54], [2, .93, .56], [2.72, .94, .56]] },
      { ben: 'trai', d: [[3.17, .14, .54], [3.33, .13, .52], [4.46, .13, .54]] },
    ],
    'noi-tay-phai': [
      { ben: 'trai', d: [[.58, .14, .54], [.75, .12, .55], [1.46, .12, .57], [1.58, .14, .62], [1.75, .16, .55],
        [2, .16, .52], [2.12, .1, .56], [2.25, .05, .63], [3.88, .05, .63]] },
    ],
  };
  const TAY_NGHI = { trai: [.2, .84], phai: [.82, .8] };      // anh tinh: tay dat nghi

  const NGUONG_NOI = .02, TRE_NOI = .4;           // muc loa coi la dang noi; giu them 0.4 s giua cac tu
  const LIEM = [25, 40], GAT = 45, NGU = 90;      // giay: liem tay (ngau nhien), ngu gat, ngu say
  const HAN_CHO = 6;                              // yeu cau cho qua 6 s thi bo (da troi qua cau do)

  // Ten cam xuc / dong tac (chuan: gach duoi). Ten cu cua tool / giao trinh cu van dung duoc.
  const MAT = new Set(['vui', 'de_biu', 'that_vong', 'ngac_nhien', 'buon', 'gian', 'suy_nghi', 'xau_ho']);
  const DT = new Set(['chao', 'cui_chao', 'liem_tay', 'ngu_gat', 'noi_tay_trai', 'noi_tay_phai', 'suy_nghi']);
  const CU_CX = { happy: 'vui', proud: 'vui', excited: 'vui', love: 'xau_ho', shy: 'xau_ho', sad: 'buon',
    angry: 'gian', surprised: 'ngac_nhien', dizzy: 'ngac_nhien', thinking: 'suy_nghi', speechless: 'that_vong',
    disappointed: 'that_vong', smug: 'de_biu', mocking: 'de_biu', vay: 'chao', cui: 'cui_chao', ngu: 'ngu_gat',
    nghi: 'suy_nghi' };
  const CU_DT = { vay: 'chao', toi: 'chao', cui: 'cui_chao', gat_dau: 'cui_chao', an: 'liem_tay', uong: 'liem_tay',
    rua: 'liem_tay', ngu: 'ngu_gat', noi: 'noi_tay_trai', mua: 'noi_tay_trai', ban: 'noi_tay_phai', doc: 'suy_nghi',
    nghi: 'suy_nghi', viet: 'suy_nghi', nhin: 'suy_nghi', nghe: 'suy_nghi', cho: 'suy_nghi', hat: 'vui', day: 'vui',
    boi: 'vui' };

  const hub = window.SenseiAvatarHub;
  const mqGiam = matchMedia('(prefers-reduced-motion: reduce)');
  const bayGio = () => performance.now() / 1000;
  const ngauNhien = (a, b) => a + Math.random() * (b - a);
  const S = {
    san: false, tat: false, tinh: false, dung: true, daKhoi: false, khongGL: false, nghiHong: false, anhHong: false,
    giang: !!(hub && hub.giang), noi: false, hetNoi: -1e9, hoatDong: bayGio(), mocKhac: bayGio(), henLiem: 0,
    gatMoc: -1, daChao: false, xoay: 0, i: -1, sau: null, muc: null, cho: null, chi: null, lanPhat: 0, daVe: false,
    x: 0, tx: null, ty: null, doRo: 1, xetLuc: 0, moDen: 0, nutDen: 0, dem: 0, cssCu: '', khungMH: 0, veLai: false,
    toc: Math.max(1, Number(new URLSearchParams(location.search).get('meoToc')) || 1),
  };
  const TG = (giay) => giay / S.toc;
  S.henLiem = bayGio() + TG(ngauNhien(...LIEM));

  const KHO = {};                 // ten clip -> { p, url, hong }: tai ca tep thanh blob (tua / lap khong can mang)
  let MF = null;                  // clip.json
  let hop, anh, khung, laser, ctx2d, laserBan = false, mauLaser = '#c96442';
  let gl = null, uA, uB, uT, uK;
  const O = [];                   // 2 o video: { i, v, ten, the, tex, tg, tgNap, co, lan, daXet }

  // -------------------------------------------------------------------------
  // BO CUC — giu dung hop dong cu (body.co-meo, --sensei-rong, --sensei-cao) de CSS chua lan cho meo
  // -------------------------------------------------------------------------
  let pickerEl = null;
  const pickerMo = () => {
    pickerEl = pickerEl || document.getElementById('lessonPicker');
    return !!pickerEl && !pickerEl.classList.contains('hidden');
  };
  const bangPhai = (W) => (W > 860 && document.body.classList.contains('co-bang') ? document.getElementById('bangPhan') : null);
  // Bang mo: chi man >= 1280 (khong mo the trai) moi du cho dung nghi canh bang (styles.css chua lan cung moc nay);
  // hep hon meo nup sau bang (biChe an han).
  const nghiCanhBang = (W) => W >= 1280 && !document.body.classList.contains('co-the-trai');
  const conHien = (el) => el.isConnected && el.getClientRects().length > 0;

  // cao = chieu cao khung clip; meo ve tu ~19% (dinh tai) toi day khung (cat ngang nguc), than ~18%..88% be ngang.
  // Dien thoai doc: luc nghi meo lun ~36% sau thanh duoi (chi lo cai dau, khong de len hang cuoi danh sach),
  // dang noi / chi / dien thi nho len noiLen (lo vai + tay).
  function kichThuoc() {
    const W = innerWidth, H = innerHeight;
    const cao = W < 700 ? Math.min(150, Math.max(120, H * .17))
      : H < 500 ? Math.min(130, Math.max(96, H * .26)) : Math.min(300, Math.max(150, Math.min(H * .32, W * .24)));
    const day = H - (document.querySelector('.deck-bottom')?.offsetHeight || 64);
    const lun = W < 700 && H >= 500 ? Math.round(cao * .36) : 0;
    return { W, H, cao, rong: cao * TI_LE, day, chan: day + lun, lun, noiLen: lun ? Math.round(cao * .2) : 0 };
  }
  // Nut an / hien Sensei o goc phai: meo dung sat goc thi nut de len vai meo -> lui meo sang trai nut
  // (mep phai khung con trong ~12%).
  function luiNut(W, rong) {
    const nut = document.querySelector('.sensei-nut');
    if (!nut || !nut.offsetWidth || nut.classList.contains('is-tren')) return 0;   // dien thoai: nut tren thanh tren
    const r = nut.getBoundingClientRect();
    if (r.right < W - 60) return 0;               // nut dang dung canh bang phan
    return Math.max(0, W - r.left + 4 - rong * .12);
  }
  // Cho dung (tam khung): goc phai, trai nut an / hien; bang phan mo (>= 1280) thi ben trai bang; the trai mo
  // thi khong lan len the.
  function viTriNha() {
    const { W, rong } = kichThuoc();
    let x = W - rong * .5 - luiNut(W, rong);
    const bang = bangPhai(W);
    if (bang && nghiCanhBang(W)) x = Math.min(x, bang.offsetLeft - 8 - rong * .5);
    const the = W > 860 && document.body.classList.contains('co-the-trai') && document.querySelector('.spotlight:not(.hidden) .spot-dock');
    if (the && the.offsetWidth) x = Math.max(x, the.offsetLeft + the.offsetWidth + rong * .5);
    return Math.max(rong * .5, x);
  }
  // --sensei-cao: phan meo lo tren thanh duoi (cuoi vung cuon chua bay nhieu); --sensei-rong: tu mep phai man
  // toi diem trai nhat cua meo dung nghi (than tu 18% khung). Chua ngay khi co khung (anh tinh hien truoc clip).
  function datChoTrong() {
    const r = document.documentElement.style;
    const coMeo = !!(hop && hop.isConnected && !S.tat && !(S.tinh && S.anhHong) && !(hub && hub.cheDo === 'an'));
    let css = '';
    if (coMeo) {
      const { W, cao, rong, lun } = kichThuoc();
      css = Math.max(40, Math.round(cao * .84 - lun)) + 'px|' + Math.round(rong * .84 + luiNut(W, rong)) + 'px';
    }
    if (css === S.cssCu) return;
    S.cssCu = css;
    document.body.classList.toggle('co-meo', coMeo);
    if (coMeo) {
      const [c, w] = css.split('|');
      r.setProperty('--sensei-cao', c);
      r.setProperty('--sensei-rong', w);
    } else {
      r.removeProperty('--sensei-cao');
      r.removeProperty('--sensei-rong');
    }
  }
  function datViTri() {
    const kt = kichThuoc();
    S.x = viTriNha();
    const tx = Math.round(S.x - kt.rong / 2), ty = Math.round(kt.chan - kt.cao - (kt.lun && !nghiNgoi() ? kt.noiLen : 0));
    if (tx === S.tx && ty === S.ty) return;
    S.tx = tx; S.ty = ty;
    hop.style.transform = `translate(${tx}px, ${ty}px)`;
  }

  // Bang phan / the trai / o chat che gan het meo -> an han (khong de dau lo qua khe giua tam va thanh duoi)
  function biChe() {
    const { rong, cao, chan, day } = kichThuoc();
    const b = document.body.classList;
    const ds = [b.contains('co-bang') && document.getElementById('bangPhan'),
      b.contains('co-the-trai') && document.querySelector('.spotlight:not(.hidden) .spot-dock'),
      b.contains('co-chat') && document.getElementById('chatDock')];
    return ds.some((el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.left <= S.x - rong * .3 && r.right >= S.x + rong * .3
        && r.top <= chan - cao * .6 && r.bottom >= Math.min(chan, day) - 24;
    });
  }
  // Noi dung bai nam duoi phan meo con THAY? Lay mau 3 cot x 6 hang (khung khong an chuot nen elementFromPoint
  // tra phan tu ben duoi). 0 = trong, 1 = de len the / chu, 2 = de len nut / o nhap.
  const NOI_DUNG = '.deck-card, button, a, input, select, textarea, img, .deck-head, .deck-note, .gp-formula, .gp-explain';
  const NUT_BAM = 'button, a[href], input, select, textarea, [role="button"]';
  function deLenNoiDung() {
    const nd = document.getElementById('slideContent');
    if (!nd) return 0;
    const { rong, cao, chan, day } = kichThuoc();
    const cuon = nd.querySelector('.deck-scroll');
    const tren = chan - cao * .8, duoi = Math.min(chan - cao * .15, day - 4, cuon ? cuon.getBoundingClientRect().bottom - 2 : day);
    if (duoi < tren) return 0;
    let kq = 0;
    for (const fx of [-.2, .03, .25]) {
      for (let i = 0; i < 6; i++) {
        const el = document.elementFromPoint(S.x + fx * rong, tren + (duoi - tren) * i / 5);
        if (!el || !nd.contains(el) || !el.closest(NOI_DUNG)) continue;
        if (el.closest(NUT_BAM)) return 2;
        kq = 1;
      }
    }
    return kq;
  }
  // Dang nghi (khong noi, khong chi, khong co yeu cau dang cho, clip nen / ranh / ngu)?
  function nghiNgoi() {
    const cur = hienTai();
    return !S.chi && !S.noi && !S.cho && (!cur || ['nen', 'ranh', 'ngu', 'day'].includes(LOAI[cur.ten]));
  }
  // Do ro: 0 = bi tam che / dien thoai dung nghi de len nut bam (nhip dung giai ma), .35 = dung nghi tren noi dung,
  // 1 = binh thuong.
  // Xet ~7 lan/giay, mo / an thi giu them .6 s cho khoi nhap nhay.
  function capNhatDoRo(now) {
    if (now < S.xetLuc) return;
    S.xetLuc = now + .15;
    const nghi = nghiNgoi();
    const de = nghi ? deLenNoiDung() : 0;
    if (de) S.moDen = now + .6;
    if (de === 2 && kichThuoc().lun) S.nutDen = now + .6;
    const ro = biChe() ? 0 : !nghi ? 1 : now < S.nutDen ? 0 : now < S.moDen ? .35 : 1;
    if (ro === S.doRo) return;
    S.doRo = ro;
    hop.style.opacity = ro === 1 ? '' : String(ro);
  }

  // -------------------------------------------------------------------------
  // NAP CLIP — ca tep thanh blob (nho, ~250-450 KB): doi clip / tua ve 0 tuc thi, khong dung mang lan hai
  // -------------------------------------------------------------------------
  const co = (ten) => !!ten && !(KHO[ten] && KHO[ten].hong) && (!MF || !MF.clip || ten in MF.clip);
  function napClip(ten) {
    let k = KHO[ten];
    if (!k) {
      k = KHO[ten] = { url: null, hong: !co(ten) };
      k.p = k.hong ? Promise.resolve(null) : fetch(THU_MUC + ten + '.mp4')
        .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob(); })
        .then((b) => (k.url = URL.createObjectURL(b)))
        .catch((e) => { k.hong = true; console.warn('[MeoClip] khong nap duoc clip', ten, e.message || e); return null; });
    }
    return k.p;
  }
  // Clip da tai xong (co blob) chua; chua thi bat dau tai va tra false — chon clip khong bao gio doi mang
  // (mang cham: clip dang chay cu chay, tai xong nhip sau moi doi)
  const sanSang = (ten) => {
    if (!co(ten)) return false;
    if (KHO[ten] && KHO[ten].url) return true;
    napClip(ten);
    return false;
  };
  function napDan() {
    if (navigator.connection && navigator.connection.saveData) return;   // tiet kiem du lieu: can moi nap
    const ke = NAP_SAU.find((t) => !KHO[t] && co(t));
    if (!ke) return;
    // Dang tai clip can ngay (cam xuc / chi tay xin luc chua co): nhuong mang, xong moi nap tiep
    if (Object.values(KHO).some((k) => !k.url && !k.hong)) { setTimeout(napDan, 500); return; }
    const ranh = window.requestIdleCallback || ((f) => setTimeout(f, 400));
    ranh(() => napClip(ke).then(() => setTimeout(napDan, 200)), { timeout: 5000 });
  }

  // -------------------------------------------------------------------------
  // WEBGL: xoa nen xanh deu + khu vien xanh, tron cheo hai clip (mau da nhan alpha)
  // -------------------------------------------------------------------------
  const VS = `attribute vec2 p; varying vec2 uv;
    void main(){ uv = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }`;
  // Nguong do tu chinh clip (alpha that cua khung dau): nen < .02, diem dac > .16 -> smoothstep(.03, .16).
  // Dai 2 diem anh sat nen: H.264 (mau 4:2:0) lem mau long ra nen -> them "do xanh" g - max(r, b) cho khoi quang
  // cham xam (quang giam ~9 lan); chi o dai nay vi mieng va tren ao ben trong cung hoi xanh xam.
  // Bo phan nen tron vao vien (c - (1-a)k), ep kenh xanh o vien khong vuot do / lam.
  // Mau nen lay tu chinh khung (2 goc tren: la nen o moi khung cua ca 19 clip): clip khong gan nhan mau, trinh giai ma
  // doan BT.709 thay 601 thi nen thanh ~rgb(0,152,62) (lech .05 > nguong .03) -> khoa theo mau chuan se de lai tam
  // mo ca khung. Goc lech xa mau chuan (> .12, vd bi che) thi dung mau chuan k (clip.json).
  const FS = `precision mediump float; varying vec2 uv;
    uniform sampler2D a, b; uniform float t; uniform vec3 k;
    const vec2 px = vec2(2. / 540., 2. / 494.);
    vec2 chroma(vec3 c){ return vec2(-.169*c.r - .331*c.g + .5*c.b, .5*c.r - .419*c.g - .081*c.b); }
    vec3 mauNen(sampler2D s){
      vec3 g1 = texture2D(s, vec2(.006, .006)).rgb, g2 = texture2D(s, vec2(.994, .006)).rgb;
      vec2 ck = chroma(k);
      float d1 = distance(chroma(g1), ck), d2 = distance(chroma(g2), ck);
      return min(d1, d2) < .12 ? (d1 <= d2 ? g1 : g2) : k;
    }
    float nen(sampler2D s, vec2 p, vec2 kc){ return step(distance(chroma(texture2D(s, p).rgb), kc), .05); }
    vec4 key(sampler2D s){
      vec3 kk = mauNen(s);
      vec2 kc = chroma(kk);
      vec3 c = texture2D(s, uv).rgb;
      float al = smoothstep(.03, .16, distance(chroma(c), kc));
      float gan = nen(s, uv + vec2(px.x, 0.), kc) + nen(s, uv - vec2(px.x, 0.), kc) + nen(s, uv + vec2(0., px.y), kc)
        + nen(s, uv - vec2(0., px.y), kc) + nen(s, uv + px, kc) + nen(s, uv - px, kc) + nen(s, uv + vec2(px.x, -px.y), kc)
        + nen(s, uv + vec2(-px.x, px.y), kc);
      if (gan > 0.) al = min(al, 1. - smoothstep(.10, .36, c.g - max(c.r, c.b)));
      vec3 p = max(c - (1. - al) * kk, 0.);
      float m = max(p.r, p.b);
      p.g = min(min(p.g, max(m, p.g * al)), m * (gan > 0. ? 1. : 1.08));
      return vec4(min(p, vec3(al)), al);
    }
    void main(){
      vec4 x = key(a);
      gl_FragColor = t > 0. ? mix(x, key(b), t) : x;
    }`;

  function dungGL() {
    gl = khung.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, depth: false,
      stencil: false, powerPreference: 'low-power' });
    if (!gl) return false;
    const sh = (loai, src) => {
      const s = gl.createShader(loai); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const lp = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(lp);
    gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    uA = gl.getUniformLocation(prog, 'a'); uB = gl.getUniformLocation(prog, 'b');
    uT = gl.getUniformLocation(prog, 't'); uK = gl.getUniformLocation(prog, 'k');
    const mau = (MF && MF.mauNen) || [0, 177, 64];
    gl.uniform3fv(uK, mau.map((x) => x / 255));
    gl.clearColor(0, 0, 0, 0);
    return true;
  }
  function taoTex(i) {
    gl.activeTexture(gl.TEXTURE0 + i);        // o i luon nam o don vi i
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    for (const [k, v] of [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE],
      [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    return t;
  }
  function napAnh(o) {
    if (o.v.readyState < 2) return;
    gl.activeTexture(gl.TEXTURE0 + o.i);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, o.v);
    o.co = true;
  }

  function ve() {
    const cur = hienTai();
    if (!gl || S.dung || S.tinh || !cur || !cur.co) return;
    let t = 0, b = cur;
    if (S.sau) { t = Math.min(1, (performance.now() - S.sau.bd) / S.sau.ms); b = S.sau.o; }
    gl.uniform1i(uA, cur.i); gl.uniform1i(uB, b.i); gl.uniform1f(uT, b.co ? t : 0);
    gl.viewport(0, 0, khung.width, khung.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!S.daVe) { S.daVe = true; hienKhung(); }
    veLaser();
    if (S.sau && t >= 1) xongTron();
  }
  // Anh tinh hien truoc (tai nhanh ~26 KB), khung dau cua clip ve xong thi doi sang canvas
  function hienKhung() {
    const dong = !S.tinh && S.daVe;
    khung.style.display = dong ? '' : 'none';
    anh.style.display = dong || S.anhHong ? 'none' : '';
  }

  // -------------------------------------------------------------------------
  // HAI O VIDEO
  // -------------------------------------------------------------------------
  function taoO(i) {
    const v = document.createElement('video');
    v.muted = true; v.defaultMuted = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.disablePictureInPicture = true; v.disableRemotePlayback = true;
    const o = { i, v, ten: null, the: 0, tex: taoTex(i), tg: 0, tgNap: -1, co: false, lan: 0, daXet: false,
      yeu: false, moi: false, rvLuc: 0, rvCho: false };
    v.addEventListener('ended', () => { if (o === hienTai() && !S.sau && !S.muc) cuoiClip(); });
    v.addEventListener('playing', () => { henRv(o); henVe(); });
    henRv(o);
    return o;
  }
  // rVFC chi dung de biet "co khung moi" (o.moi) khi man nhanh hon han clip (xem canNap)
  function henRv(o) {
    if (o.rvCho || !o.v.requestVideoFrameCallback) return;
    o.rvCho = true;
    o.v.requestVideoFrameCallback(() => { o.rvCho = false; o.moi = true; o.rvLuc = performance.now(); henRv(o); });
  }
  const hienTai = () => (S.i >= 0 ? O[S.i] : null);
  // Vong ve: moi khung man hinh doc khung hien tai cua video DANG CHAY roi ve; khong clip nao chay thi dung.
  // Khong lay khung qua requestVideoFrameCallback: do tren Chrome 153, clip 60 fps / man 60 Hz qua rVFC chi ra ~49-52
  // khung khac nhau/giay (rVFC gop khung), doc theo rAF ra 59-60 khung/giay, khong rot khung.
  let vongId = 0, rafTruoc = 0;
  function henVe() { if (!vongId) vongId = requestAnimationFrame(vong); }
  function vong(ts) {
    vongId = 0;
    if (S.dung || S.tinh || !gl) return;
    const dt = ts - rafTruoc;
    rafTruoc = ts;
    if (dt > 2 && dt < 50) S.khungMH = S.khungMH ? S.khungMH * .92 + dt * .08 : dt;   // ms / khung man (trung binh)
    let chay = false, nap = S.veLai;
    S.veLai = false;
    for (const o of O) {
      if (o.v.paused || o.v.readyState < 2) continue;
      chay = true;
      if (khiCoKhung(o, o.v.currentTime)) nap = true;
    }
    // Khong khung moi, khong tron: khoi ve lai (canvas giu hinh cu, trinh duyet khoi ghep lop)
    if (nap || S.sau) ve(); else if (S.chi || laserBan) veLaser();
    if (chay || S.sau) henVe();
  }
  // Co dua khung hien tai len GPU khong. Man 60-90 Hz: moi khung man (rVFC o day gop / sot khung). Man >= 1.8 lan
  // han clip (120 / 144 Hz) va rVFC dang chay: chi khi rVFC bao khung moi (do: ti le 2 / 2.4 khong sot khung nao),
  // lau qua 1.5 khung chua co thi nap luon.
  function canNap(o, t) {
    if (!o.co || t < o.tgNap) return true;               // khung dau / vua tua ve 0 / tu lap
    if (t === o.tgNap) return false;
    const kh = 1 / ((MF && MF.fps) || 60);
    if (!S.khungMH || S.khungMH / 1000 > kh / 1.8 || performance.now() - o.rvLuc > 150) return true;
    return o.moi || t - o.tgNap > kh * 1.5;
  }

  // Khung moi cua mot video: dua len GPU (chi o dang dung), xet cuoi clip. Tra true neu da dua khung len.
  function khiCoKhung(o, t) {
    o.tg = t;
    const cur = hienTai(), vao = S.muc && S.muc.o === o;
    if (o !== cur && !(S.sau && S.sau.o === o) && !vao) return false;    // o dang nap san: khoi dua len
    const nap = canNap(o, t);
    if (nap) { napAnh(o); o.tgNap = t; o.moi = false; }
    if (vao && !o.v.paused) batTron();
    else if (o === cur && !S.sau && !S.muc) {
      const con = o.v.duration - t;
      if (con > .5) o.daXet = false;
      else if (con < .16 && !o.daXet) { o.daXet = true; cuoiClip(); }
    }
    return nap;
  }

  // Dat clip vao o (dung o khung 0). Tra false neu hong / bi lenh moi de len.
  function datVao(o, ten) {
    const the = ++o.the;
    return napClip(ten).then((url) => new Promise((xong) => {
      if (the !== o.the || !url) return xong(false);
      const v = o.v;
      if (o.ten === ten && v.readyState >= 2) {
        if (v.currentTime < .02 && !v.ended) return xong(true);
        v.addEventListener('seeked', () => xong(the === o.the), { once: true });
        v.currentTime = 0;
        return;
      }
      const bo = () => { v.removeEventListener('loadeddata', duoc); v.removeEventListener('error', loi); };
      const duoc = () => { bo(); xong(the === o.the); };
      const loi = () => {
        bo();
        if (the === o.the) { o.ten = null; if (KHO[ten]) KHO[ten].hong = true; console.warn('[MeoClip] clip hong', ten); }
        xong(false);
      };
      o.ten = ten; o.co = false;
      v.addEventListener('loadeddata', duoc); v.addEventListener('error', loi);
      v.loop = false;
      v.src = url;
    }));
  }

  // Chuyen sang clip ten: nap vao o con lai, chay, khung dau hien thi bat dau tron ms (0 = cat thang).
  // yeu = clip do dienDongTac xin (luat tu dong trong xetTuDo khong cat ngang).
  function batDau(ten, ms, yeu) {
    if (S.dung || S.tinh || !gl || S.sau) return;
    if (!sanSang(ten)) {                           // chua tai xong: giu clip dang chay (keTiep chi chon clip da tai)
      if (ten === 'nghi' && !co('nghi')) { S.nghiHong = true; setTimeout(capNhatTinh); }
      return;
    }
    const cur = hienTai();
    const o = cur ? O[1 - cur.i] : O[0];
    const m = S.muc = { ten, o, ms, yeu: !!yeu };
    clearTimeout(S.henMuc);
    // Blob da o may ma giai ma van treo 3 s: bo lan nay, chon lai; treo lan 2 moi coi la hong (mang khong tinh vao)
    S.henMuc = setTimeout(() => {
      if (S.muc !== m) return;
      S.muc = null;
      const k = KHO[ten];
      if (k && ten !== 'nghi' && (k.treo = (k.treo || 0) + 1) >= 2) k.hong = true;
      if (!cur || cur.v.ended) cuoiClip();
    }, 3000);
    datVao(o, ten).then((ok) => {
      if (S.muc !== m) return;
      if (!ok || S.dung) {
        S.muc = null;
        if (!ok && ten === 'nghi' && !co('nghi')) { S.nghiHong = true; capNhatTinh(); return; }
        if (!ok && cur && cur.v.ended) cuoiClip();      // clip hong: giu clip cu, chon clip khac
        return;
      }
      o.v.play().catch(() => { if (S.muc === m) S.muc = null; });
    });
  }
  function batTron() {
    const m = S.muc, cur = hienTai();
    clearTimeout(S.henMuc);
    S.muc = null;
    m.o.yeu = m.yeu;
    if (!cur) { S.i = m.o.i; khiDoiClip(); return; }
    S.sau = { o: m.o, bd: performance.now(), ms: Math.max(1, m.ms) };
    if (!m.ms) xongTron();
  }
  function xongTron() {
    const cu = hienTai();
    S.i = S.sau.o.i; S.sau = null;
    cu.v.pause();
    khiDoiClip();
  }
  function khiDoiClip() {
    const cur = hienTai();
    cur.lan = ++S.lanPhat; cur.daXet = false;
    if (S.chi && S.chi.lan == null && S.chi.clip === cur.ten) S.chi.lan = cur.lan;
    else if (S.chi && S.chi.lan != null && S.chi.lan !== cur.lan && !S.tinh) S.chi = null;
    datLap();
    // Nap san clip co le chay tiep vao o con lai
    const ke = duDoan(), du = O[1 - cur.i];
    if (ke && co(ke)) datVao(du, ke);
    xetCho();
  }
  // Clip dang chay sap het: chon clip tiep. Trung chinh no (clip lap) thi de trinh duyet tu lap.
  function cuoiClip() {
    const cur = hienTai();
    if (!cur || S.dung || S.tinh) return;
    const c = S.cho, ke = keTiep(true);
    if (ke === cur.ten && LAP.has(ke)) { cur.v.loop = true; if (cur.v.ended) cur.v.play().catch(() => {}); return; }
    batDau(ke, 120, tuYeu(c, ke));
  }
  // keTiep vua dung yeu cau dong tac c (act_out) de chon ke?
  const tuYeu = (c, ke) => !!c && !S.cho && c.ten === ke && c.loai === 'dt';
  function datLap() {
    const cur = hienTai();
    if (cur) cur.v.loop = LAP.has(cur.ten) && keTiep(false) === cur.ten;
  }

  // -------------------------------------------------------------------------
  // CHON CLIP
  // -------------------------------------------------------------------------
  const mocRanh = () => Math.max(S.hoatDong, S.hetNoi, S.mocKhac);
  const canDay = (now) => S.noi || S.giang || !!S.cho || !!S.chi || now - Math.max(S.hoatDong, S.mocKhac) < 1.5;
  function xoayTiep(lay) {
    for (let k = 0; k < XOAY.length; k++) {
      const j = (S.xoay + k) % XOAY.length;
      if (sanSang(XOAY[j])) { if (lay) S.xoay = j + 1; return XOAY[j]; }     // chua tai xong: bo qua luot nay
    }
    return 'nghi';
  }
  // Clip nen chay tiep (lay = true: dung luon yeu cau / luot xoay / hen liem tay). Chi chon clip da tai xong
  // (sanSang); yeu cau chua tai xong van nam trong S.cho (het han HAN_CHO), tai xong thi xetCho chen vao.
  function keTiep(lay) {
    const cur = hienTai(), ten = cur && cur.ten, now = bayGio();
    if (ten === 'ngu-vao' || ten === 'ngu') {
      return !sanSang('ngu-day') ? 'nghi' : canDay(now) || !sanSang('ngu') ? 'ngu-day' : 'ngu';
    }
    const c = S.cho;
    if (c && now - c.luc < HAN_CHO && sanSang(c.ten)) { if (lay) S.cho = null; return c.ten; }
    if (S.noi) return xoayTiep(lay);
    if (!S.giang && !S.chi) {
      const ranh = now - mocRanh();
      if (ranh > TG(NGU) && ['ngu-vao', 'ngu', 'ngu-day'].map(sanSang).every(Boolean)) return 'ngu-vao';
      if (ranh > TG(GAT) && S.gatMoc !== mocRanh() && sanSang('ngu-gat')) { if (lay) S.gatMoc = mocRanh(); return 'ngu-gat'; }
      if (now > S.henLiem && sanSang('liem-tay')) { if (lay) S.henLiem = now + TG(ngauNhien(...LIEM)); return 'liem-tay'; }
    }
    return 'nghi';
  }
  function duDoan() {
    const cur = hienTai(), k = keTiep(false);
    if (k !== cur.ten) return k;
    return cur.ten === 'nghi' ? 'noi' : cur.ten === 'noi' ? 'noi-tay-trai' : cur.ten === 'ngu' ? 'ngu-day' : null;
  }
  // Clip dang chay co cho yeu cau loai nay chen ngang (tron cheo) khong?
  function coTheNgat(o, loai) {
    const k = LOAI[o.ten] || 'cx';
    if (k === 'ngu') return false;                         // phai qua ngu-day (xetTuDo / keTiep)
    if (o.v.ended || o.daXet || k === 'nen' || k === 'ranh' || k === 'noi') return true;
    if (k === 'day') return o.tg > 3;                      // da tinh han
    if (k === 'tay') return loai === 'cx' || loai === 'chi';
    if (k === 'cx') return loai === 'cx';
    return false;                                          // chao / cui chao: dien het
  }
  function xetCho() {
    const c = S.cho;
    if (!c || S.dung || S.tinh || S.sau) return;
    if (bayGio() - c.luc > HAN_CHO || !co(c.ten)) { S.cho = null; return; }
    const cur = hienTai();
    if (!cur) return;
    if ((S.muc && S.muc.ten === c.ten) || (!S.muc && cur.ten === c.ten && cur.tg < 1)) { S.cho = null; return; }
    if (!sanSang(c.ten) || !coTheNgat(cur, c.loai)) return;      // chua tai xong: de cho, clip dang chay cu chay
    S.cho = null;
    batDau(c.ten, 200, c.loai === 'dt');
  }
  // Doan gio tay cuoi cung cua clip tay ket thuc luc nao (giay)
  const hetTay = (ten) => { const g = TAY[ten]; return g ? g[g.length - 1].d[g[g.length - 1].d.length - 1][0] : 0; };
  // Doi clip giua chung theo trang thai (goi moi nhip)
  // Clip do act_out xin (cur.yeu) thi luat tu dong khong cat: ngu gat / liem tay dien het du dang noi, gio tay luc im
  // thi doi het doan gio tay.
  function xetTuDo(now) {
    const cur = hienTai();
    if (!cur || S.sau || S.muc) return;
    if (cur.v.ended) return cuoiClip();                    // clip het ma chua co clip tiep (vd clip tiep dang tai)
    const k = LOAI[cur.ten] || 'cx';
    if (cur.ten === 'ngu' && canDay(now)) return batDau(sanSang('ngu-day') ? 'ngu-day' : 'nghi', 250);
    if (S.cho) return xetCho();
    if (S.noi && !cur.yeu && (k === 'nen' || k === 'ranh' || (k === 'day' && cur.tg > 3))) return batDau(keTiep(true), 200);
    // Im han ~1.2 s: clip noi -> nghi; gio tay thi doi tay ha; cam xuc noi da hien du 2.5 s
    if (!S.noi && now - S.hetNoi > .8 && (k === 'noi'
      || (k === 'tay' && !S.chi && !doanTay(cur.ten, null, cur.tg, .25) && !(cur.yeu && cur.tg < hetTay(cur.ten)))
      || (k === 'cx' && CX_NOI.has(cur.ten) && cur.tg > 2.5))) batDau(keTiep(true), 200);
  }

  // -------------------------------------------------------------------------
  // CHI VAO MUC + TIA LASER
  // -------------------------------------------------------------------------
  // Doan gio tay ben 'ben' (null = ben nao cung duoc) dang dien ra quanh t (+/- le)
  function doanTay(ten, ben, t, le = 0) {
    return (TAY[ten] || []).find((g) => (!ben || g.ben === ben) && t >= g.d[0][0] - le && t <= g.d[g.d.length - 1][0] + le);
  }
  function viTriTay(ten, ben, t) {
    const g = doanTay(ten, ben, t);
    if (!g) return null;
    const d = g.d;
    let j = 1;
    while (j < d.length - 1 && d[j][0] < t) j++;
    const a = d[j - 1], b = d[j], f = Math.max(0, Math.min(1, (t - a[0]) / ((b[0] - a[0]) || 1)));
    return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }
  function timPhanTu(x) {
    if (!x) return null;
    if (x instanceof Element) return x;
    return window.__slideEngine?.resolveElement?.(x) || document.getElementById(x);
  }
  const dprLaser = () => Math.min(devicePixelRatio || 1, 1.5);
  function xoaLaser() {
    if (!laserBan) return;
    ctx2d.clearRect(0, 0, laser.width, laser.height);
    laserBan = false;
  }
  function veLaser() {
    const c = S.chi;
    if (c && !conHien(c.el)) {
      const moi = c.id && timPhanTu(c.id);
      if (moi && conHien(moi)) c.el = moi; else S.chi = null;
    }
    let f = null;
    if (S.chi && !S.tat && (S.tinh ? !document.hidden && !pickerMo() : !S.dung)) {
      if (S.tinh) f = TAY_NGHI[c.ben];
      else {
        const cur = hienTai();
        if (cur && !S.sau && cur.lan === c.lan) f = viTriTay(cur.ten, c.ben, cur.tg);
      }
    }
    if (!f) { xoaLaser(); return; }
    const h = hop.getBoundingClientRect(), r = c.el.getBoundingClientRect();
    const ax = h.left + f[0] * h.width, ay = h.top + f[1] * h.height;
    const bx = Math.max(r.left, Math.min(r.right, ax)), by = Math.max(r.top, Math.min(r.bottom, ay));
    const now = bayGio(), tinh = S.tinh, dp = dprLaser();
    ctx2d.clearRect(0, 0, laser.width, laser.height); laserBan = true;
    ctx2d.save(); ctx2d.scale(dp, dp);
    ctx2d.strokeStyle = ctx2d.fillStyle = mauLaser;
    ctx2d.globalAlpha = .75; ctx2d.lineWidth = 2.5;
    ctx2d.setLineDash([6, 6]); ctx2d.lineDashOffset = tinh ? 0 : -now * 40;
    ctx2d.beginPath(); ctx2d.moveTo(ax, ay); ctx2d.lineTo(bx, by); ctx2d.stroke();
    ctx2d.setLineDash([]); ctx2d.globalAlpha = .9;
    ctx2d.beginPath(); ctx2d.arc(bx, by, tinh ? 5 : 5 + Math.sin(now * 8) * 1.5, 0, Math.PI * 2); ctx2d.fill();
    ctx2d.restore();
    if (c.gon && !c.daGon) { c.daGon = true; gonBam(r); }
  }
  // Vong gon cho cu bam vao nut tab (khong co khi giam chuyen dong)
  function gonBam(r) {
    if (mqGiam.matches) return;
    const g = document.createElement('div');
    g.className = 'sensei-gon';
    g.style.left = (r.left + r.width / 2) + 'px'; g.style.top = (r.top + r.height / 2) + 'px';
    g.style.zIndex = '32';
    document.body.appendChild(g);
    setTimeout(() => g.remove(), 700);
  }
  // Het doan gio tay cua lan chi / qua han cho -> thoi chi
  function xetChi(now) {
    const c = S.chi;
    if (!c) return;
    if (S.tinh || c.lan == null) {
      if (now > c.het) { S.chi = null; if (S.cho && S.cho.loai === 'chi') S.cho = null; }
      return;
    }
    const cur = hienTai();
    if (S.sau) return;
    if (!cur || cur.lan !== c.lan) { S.chi = null; return; }
    const g = (TAY[cur.ten] || []).filter((x) => x.ben === c.ben).pop();
    if (!g || cur.tg > g.d[g.d.length - 1][0]) S.chi = null;
  }

  function chiVao(elHoacId) {
    const el = timPhanTu(elHoacId);
    if (!S.san || S.tat || !el || !hop) return false;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return false;
    const h = hop.getBoundingClientRect(), now = bayGio();
    // Muc ben trai meo -> gio tay ben trai anh (noi-tay-phai), ben phai -> noi-tay-trai
    const ben = r.left + r.width / 2 < h.left + h.width * .53 ? 'trai' : 'phai';
    const clip = ben === 'trai' ? 'noi-tay-phai' : 'noi-tay-trai';
    if (!S.tinh && !co(clip)) return false;
    try { mauLaser = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || mauLaser; } catch (e) {}
    S.chi = { el, id: typeof elHoacId === 'string' ? elHoacId : el.id, ben, clip, lan: null, het: now + (S.tinh ? 3 : 5) };
    S.mocKhac = now;
    if (S.tinh) return true;
    // Clip dang chay sap / dang gio dung tay ben do (con >= .8 s) -> dung luon, khoi doi clip
    const cur = hienTai();
    if (cur && cur.lan && !S.sau && !S.muc
      && (TAY[cur.ten] || []).some((g) => g.ben === ben && g.d[g.d.length - 1][0] > cur.tg + .8 && g.d[0][0] < cur.tg + 1.5)) {
      S.chi.clip = cur.ten; S.chi.lan = cur.lan;
      return true;
    }
    if (S.cho && S.cho.loai === 'cx') return true;          // cam xuc dang cho duoc uu tien; chi tay co the qua han
    S.cho = { ten: clip, loai: 'chi', luc: now };
    choTai(clip);
    return true;
  }
  function bamVao(elHoacId) {
    const ok = chiVao(elHoacId);
    if (ok && S.chi) S.chi.gon = true;
    return ok;
  }

  // -------------------------------------------------------------------------
  // LENH (giao dien chung qua hub)
  // -------------------------------------------------------------------------
  const chuanHoa = (k) => String(k || '').trim().toLowerCase().replace(/-/g, '_');
  const tenTep = (k) => k.replace(/_/g, '-');
  function yeuCau(ten, loai) {
    if (!S.san || !co(ten)) return false;
    const now = bayGio();
    S.mocKhac = now;
    if (S.tinh) return true;                                 // anh tinh: nhan lenh, khong co gi de dien
    const cur = hienTai();
    // Clip nay dang chay / sap chay roi: khoi xin lai (act_out thi danh dau de luat tu dong khong cat)
    const dang = cur && cur.ten === ten && !S.sau && !cur.v.ended && cur.tg < (cur.v.duration || 6) - 1.5 ? cur
      : S.muc && S.muc.ten === ten ? S.muc : S.sau && S.sau.o.ten === ten ? S.sau.o : null;
    if (dang) { if (loai === 'dt') dang.yeu = true; return true; }
    if (loai !== 'chi') S.chi = null;                        // cam xuc / dong tac quan trong hon chi tay
    S.cho = { ten, loai, luc: now };
    choTai(ten);
    return true;
  }
  // Xet chen yeu cau ngay; clip chua tai xong thi tai xong xet lai (clip dang chay cu chay trong luc cho)
  function choTai(ten) {
    xetCho();
    if (!sanSang(ten) && co(ten)) napClip(ten).then(() => xetCho());
  }
  function camXuc(ten) {
    let k = chuanHoa(ten);
    k = CU_CX[k] || k;
    if (k === 'chao' || k === 'cui_chao' || k === 'ngu_gat') return dienDongTac(k);
    return MAT.has(k) ? yeuCau(tenTep(k), 'cx') : false;
  }
  function dienDongTac(ten) {
    let k = chuanHoa(ten);
    k = CU_DT[k] || k;
    if (MAT.has(k) || (CU_CX[k] && !DT.has(CU_CX[k]))) return camXuc(k);   // vd mark_error goi 'gian'
    if (!DT.has(k)) return false;
    return yeuCau(tenTep(k), k === 'suy_nghi' ? 'cx' : 'dt');
  }
  // slide-engine goi (el, styleType, found); ban cu goi (targetId, found, styleType)
  function khiRoiMuc(muc, a, b) {
    if (!S.san || S.tat) return;
    clearTimeout(S.henChi);
    const el = timPhanTu(muc);
    const the = el && el.closest && el.closest('[data-emotion]');
    const d = [a, b].find((x) => x && typeof x === 'object') || null;
    const k = (the && the.dataset.emotion) || (d && ((d.data && d.data.emotion) || (d.sentence && d.sentence.emotion)));
    if (k && camXuc(k)) return;
    S.henChi = setTimeout(() => chiVao(muc), 350);
  }
  function trangThai(o) {
    if (o && 'giang' in o && !!o.giang !== S.giang) {
      S.giang = !!o.giang;
      S.mocKhac = bayGio();
      if (!S.giang) S.henLiem = S.mocKhac + TG(ngauNhien(...LIEM));
    }
    const cur = hienTai();
    return { clip: cur ? cur.ten : null, t: cur ? +cur.tg.toFixed(2) : 0, noi: S.noi, giang: S.giang, tinh: S.tinh,
      dung: S.dung, cho: S.cho ? S.cho.ten : null, chi: S.chi ? S.chi.ben : null, sau: S.sau ? S.sau.o.ten : null };
  }

  const api = {
    kieu: 'meo-video', uuTien: 0,
    chiVao, bamVao, dienDongTac, camXuc, khiRoiMuc, trangThai,
    dongTacChoTu: () => null,
    DANH_SACH_DONG_TAC: [...DT],
    get san() { return S.san; },
    get tat() { return S.tat; },
    rongHienTai: () => kichThuoc().rong,
    an(anDi = true) {
      S.tat = !!anDi;
      if (!hop) return;
      hop.style.display = laser.style.display = S.tat ? 'none' : '';
      if (S.tat) { S.chi = null; xoaLaser(); } else { S.tx = null; datViTri(); S.mocKhac = bayGio(); }
      datChoTrong();
      nhip(true);
    },
  };

  // -------------------------------------------------------------------------
  // NHIP (10 lan/giay; tam dung 2.5 lan/giay): giong noi, hen gio ranh / ngu, tam dung, vi tri
  // -------------------------------------------------------------------------
  function datDung(dung) {
    S.dung = dung;
    if (dung) {
      if (S.sau) xongTron();
      S.muc = null;
      O.forEach((o) => o.v.pause());
      xoaLaser();
    } else {
      S.mocKhac = bayGio();
      S.henLiem = Math.max(S.henLiem, S.mocKhac + TG(ngauNhien(8, 15)));   // vua hien lai (dong chon bai...): chua liem ngay
      const cur = hienTai();
      if (cur && !S.tinh) {
        if (cur.v.ended) cuoiClip(); else cur.v.play().catch(() => {});
      }
    }
  }
  let henNhip = 0;
  function nhip(ngay) {
    clearTimeout(henNhip);
    const now = bayGio();
    const cho = document.hidden || pickerMo() || S.tat || !S.san;
    // Giong noi: do ca luc meo vo hinh (do ro 0) de biet ma nho len / hien lai
    if (!cho && !S.tinh) {
      const muc = window.__audioEngine?.getOutputLevel?.() || 0;
      if (muc > NGUONG_NOI) S.hetNoi = now + TRE_NOI;
      S.noi = now < S.hetNoi;
      if (S.noi) S.henLiem = Math.max(S.henLiem, now + TG(8));   // vua noi xong khong liem tay ngay
    }
    // Bi tam che / dien thoai dung nghi de len nut (do ro 0): vo hinh -> dung giai ma + ve nhu luc an
    const dung = cho || S.tinh || S.doRo === 0;
    if (dung !== S.dung) datDung(dung);
    if (!S.tat && !S.tinh && !S.daKhoi) batDong();
    if (!dung) {
      if (!S.daChao && gl) { S.daChao = true; dienDongTac('chao'); }
      if (gl && !hienTai() && !S.muc) { const c = S.cho, ke = keTiep(true); batDau(ke, 0, tuYeu(c, ke)); }
      xetTuDo(now);
      datLap();
    }
    if (!S.tat && hop) {
      xetChi(now);
      if (++S.dem % 2 || ngay) { datViTri(); datChoTrong(); }
      if (!cho) capNhatDoRo(now);
      if (S.tinh) veLaser();               // anh tinh: ve lai tia (dung yen) theo cuon trang
    }
    henNhip = setTimeout(nhip, cho || S.tinh ? 400 : 100);
  }

  // Lan dau can chay clip (khong an, khong giam chuyen dong): dung WebGL + 2 o video, nap clip dau
  function batDong() {
    S.daKhoi = true;
    try {
      if (!dungGL()) throw new Error('khong co WebGL');
      O.push(taoO(0), taoO(1));
    } catch (e) {
      console.warn('[MeoClip] khong chay duoc clip, dung anh tinh:', e.message || e);
      gl = null; S.khongGL = true; capNhatTinh();
      return;
    }
    khung.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('[MeoClip] mat WebGL, dung anh tinh');
      S.khongGL = true; capNhatTinh();
    });
    doiCo();
    NAP_TRUOC.forEach(napClip);
    setTimeout(napDan, 2500);
  }
  function capNhatTinh() {
    const tinh = mqGiam.matches || S.khongGL || S.nghiHong;
    if (tinh !== S.tinh) {
      S.tinh = tinh;
      if (tinh) {
        if (S.sau) xongTron();
        S.muc = null; S.chi = null; xoaLaser();
        O.forEach((o) => o.v.pause());
      }
    }
    hop.style.transition = mqGiam.matches ? 'opacity .2s ease-out' : 'transform .35s ease-out, opacity .2s ease-out';
    hienKhung();
    datChoTrong();
    nhip(true);
  }

  function doiCo() {
    const { W, H, cao, rong } = kichThuoc();
    hop.style.width = rong + 'px'; hop.style.height = cao + 'px';
    if (gl) {
      // Khong ve net hon clip goc (540 px): may tu phong to phan con lai
      const cw = Math.min(540, Math.round(rong * Math.min(devicePixelRatio || 1, 2)));
      const ch = Math.round(cw / TI_LE);
      if (khung.width !== cw || khung.height !== ch) { khung.width = cw; khung.height = ch; S.veLai = true; henVe(); }
    }
    const d = dprLaser();
    laser.width = Math.round(W * d); laser.height = Math.round(H * d);
    laser.style.width = W + 'px'; laser.style.height = H + 'px';
    laserBan = false;
    S.tx = null; datViTri(); datChoTrong();
  }

  function dungSanKhau() {
    // Lop: meo (3) tren noi dung bai (1) nhung DUOI moi lop phu (bang sua loi 5, thanh tren / duoi 30, o chat 40,
    // bang phan 44, anh phong to 50, thong bao 70, the ron 80, chon bai 90). Laser + vong gon (31-32) tren thanh duoi.
    hop = document.createElement('div');
    hop.setAttribute('aria-hidden', 'true');
    Object.assign(hop.style, { position: 'fixed', left: '0', top: '0', pointerEvents: 'none', zIndex: '3' });
    anh = new Image();
    anh.alt = ''; anh.decoding = 'async'; anh.draggable = false;
    anh.src = THU_MUC + 'nghi.webp';
    anh.addEventListener('error', () => { S.anhHong = true; hienKhung(); datChoTrong(); });
    khung = document.createElement('canvas');
    for (const x of [anh, khung]) Object.assign(x.style, { display: 'block', width: '100%', height: '100%' });
    khung.style.display = 'none';
    hop.append(anh, khung);
    document.body.appendChild(hop);
    laser = document.createElement('canvas');
    Object.assign(laser.style, { position: 'fixed', left: '0', top: '0', pointerEvents: 'none', zIndex: '31' });
    document.body.appendChild(laser);
    ctx2d = laser.getContext('2d');
    if (!document.getElementById('senseiGonCss')) {
      const st = document.createElement('style'); st.id = 'senseiGonCss';
      st.textContent = `.sensei-gon { position: fixed; z-index: 86; pointer-events: none; width: 16px; height: 16px;
        margin: -8px 0 0 -8px; border-radius: 50%; border: 3px solid var(--accent, #c96442); animation: senseiGon .6s ease-out forwards; }
        @keyframes senseiGon { from { transform: scale(.3); opacity: 1 } to { transform: scale(3.2); opacity: 0 } }`;
      document.head.appendChild(st);
    }
    addEventListener('resize', doiCo);
    const theoDpr = () => matchMedia(`(resolution: ${devicePixelRatio}dppx)`)
      .addEventListener?.('change', () => { doiCo(); theoDpr(); }, { once: true });
    theoDpr();
    mqGiam.addEventListener?.('change', capNhatTinh);
    document.addEventListener('visibilitychange', () => nhip(true));
    // Hoat dong cua hoc vien: danh thuc / hoan ngu gat
    const dong = () => { S.hoatDong = bayGio(); };
    for (const ev of ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll']) {
      addEventListener(ev, dong, { passive: true, capture: true });
    }
  }

  function batDau0() {
    dungSanKhau();
    S.san = true;
    S.tinh = mqGiam.matches;
    if (hub) hub.dangKy(api); else window.SenseiAvatar = api;
    capNhatTinh();
    // clip.json: danh sach clip co that + mau nen. Chua co / loi thi coi nhu du clip, mau nen mac dinh.
    fetch(THU_MUC + 'clip.json').then((r) => (r.ok ? r.json() : null)).then((m) => {
      if (m && typeof m === 'object') {
        MF = m;
        if (gl && Array.isArray(m.mauNen)) gl.uniform3fv(uK, m.mauNen.map((x) => x / 255));
      }
    }).catch(() => {});
    doiCo();
    nhip(true);
  }

  // Xem thu / kiem tra: window.__senseiClip.tangToc(20) -> hen liem / ngu gat / ngu nhanh 20 lan
  window.__senseiClip = {
    S, O, KHO, api, trangThai,
    tangToc(k) { S.toc = Math.max(1, Number(k) || 1); S.henLiem = bayGio() + TG(ngauNhien(...LIEM)); return S.toc; },
  };

  if (document.body) batDau0(); else addEventListener('DOMContentLoaded', batDau0);
})();
