/**
 * SENSEI HOAT HINH — nhan vat anime 3D (chuan VRM) dung tren man hinh.
 *
 * Gemini KHONG ve nhan vat. No chi quyet dinh "noi gi, chi vao dau" qua cac
 * tool call san co (highlight_element, change_section, mark_error...) va hai
 * tool moi (act_out, set_emotion). Tep nay nhan cac lenh do roi cho nhan vat:
 *   - di bo toi canh muc dang giang, gio tay chi dung vi tri + tia laser
 *   - di toi nut tab, bam vao
 *   - dien dong tac minh hoa dong tu (食べます -> an, 寝ます -> ngu...)
 *   - doi bieu cam; mieng map may theo do to cua giong Sensei dang phat
 *
 * Moi dong tac deu la TU THE TINH BANG HUONG XUONG (khong can tep hoat hinh
 * ngoai): moi canh tay khai bao "bap tay chi huong nao, cang tay chi huong
 * nao" trong he toa do cua nhan vat (mat nhin +Z, tay PHAI nam phia -X).
 *
 * Doi nhan vat: dat window.SENSEI_AVATAR_URL = 'duong/dan/sensei.vrm' truoc
 * khi tep nay chay (vi du tep xuat tu VRoid Studio dat trong assets/).
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

// Nhan vat mau cua thu vien three-vrm — CHI DE THU. Thay bang nhan vat rieng.
const MAU_MAC_DINH = 'https://cdn.jsdelivr.net/gh/pixiv/three-vrm@dev/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm';

const V = (x, y, z) => new THREE.Vector3(x, y, z).normalize();
// Huong nghi cua xuong tay trong tu the chuan chu T (normalized humanoid)
const NGHI_PHAI = new THREE.Vector3(-1, 0, 0);
const NGHI_TRAI = new THREE.Vector3(1, 0, 0);

// ---------------------------------------------------------------------------
// TU THE. Moi ham nhan t (giay tu luc bat dau) va tra ve:
//   rU/rL/lU/lL : huong bap tay / cang tay phai-trai
//   dau, lung  : [x, y, z] radian;  bt: bieu cam phu {ten: 0..1}
// Truong nao bo trong thi dung tu the dung yen.
// ---------------------------------------------------------------------------
const song = (t, tocDo = 1) => Math.sin(t * Math.PI * 2 * tocDo);

const TU_THE = {
  dung: () => ({}),

  an: (t) => {
    const len = (song(t, 0.9) + 1) / 2;           // 0 = bat, 1 = mieng
    return {
      rU: V(-0.3, -0.6, 0.75),
      rL: V(0.7 * len + 0.2, 0.75 * len - 0.1, 0.9 - 0.8 * len),
      lU: V(0.2, -0.8, 0.55), lL: V(-0.3, -0.05, 1),      // tay trai cam bat
      dau: [0.12 - 0.1 * len, 0, 0],
      bt: { aa: len > 0.8 ? 0.7 : 0.1, happy: 0.4 },
    };
  },

  uong: (t) => {
    const nghieng = Math.min(1, t / 0.6);
    return {
      rU: V(-0.3, -0.55, 0.78), rL: V(0.6, 0.8, 0.1),
      dau: [-0.35 * nghieng, 0, 0],
      bt: { relaxed: 0.5 },
    };
  },

  ngu: (t) => ({
    rU: V(-0.15, -0.55, 0.8), rL: V(0.65, 0.75, 0.1),
    lU: V(0.05, -0.65, 0.75), lL: V(-0.45, 0.85, 0.2),
    dau: [0.1, 0, 0.35 + 0.04 * song(t, 0.3)],
    lung: [0.05, 0, 0.08],
    bt: { blink: 1, relaxed: 0.6 },
  }),

  day: (t) => {                                   // 起きます: vuon vai
    const k = Math.min(1, t / 0.8);
    return {
      rU: V(-0.35, 0.2 + 0.8 * k, 0.1), rL: V(-0.1, 1, 0),
      lU: V(0.35, 0.2 + 0.8 * k, 0.1), lL: V(0.1, 1, 0),
      dau: [-0.2 * k, 0, 0],
      bt: { surprised: 0.3 * k, aa: 0.5 * k },
    };
  },

  vay: (t) => ({                                  // chao hoi / tam biet
    rU: V(-0.75, 0.45, 0.3), rL: V(-0.35 * song(t, 1.6), 1, 0.15),
    dau: [0, 0, 0.08],
    bt: { happy: 0.8 },
  }),

  cui: (t) => {                                   // cui chao: ありがとう, すみません
    const k = t < 0.5 ? t / 0.5 : t < 1.6 ? 1 : Math.max(0, 1 - (t - 1.6) / 0.5);
    return {
      rU: V(-0.1, -1, 0.15), rL: V(0.25, -0.9, 0.35),
      lU: V(0.1, -1, 0.15), lL: V(-0.25, -0.9, 0.35),
      lung: [0.55 * k, 0, 0], dau: [0.25 * k, 0, 0],
      bt: { relaxed: 0.4 },
    };
  },

  toi: () => ({                                   // わたし: tay dat len nguc
    rU: V(-0.35, -0.8, 0.45), rL: V(0.85, 0.35, 0.35),
    bt: { happy: 0.3 },
  }),

  ban: () => ({                                   // あなた: chi ra phia hoc vien
    rU: V(-0.25, -0.15, 1), rL: V(-0.1, -0.05, 1),
    dau: [0.05, 0, 0],
  }),

  nghi: (t) => ({                                 // suy nghi / わかりません
    rU: V(-0.3, -0.7, 0.6), rL: V(0.55, 0.8, 0.2),
    lU: V(0.2, -0.85, 0.45), lL: V(-0.9, 0.1, 0.4),
    dau: [0.05, 0.15 * song(t, 0.25), 0.18],
    bt: { sad: 0.2 },
  }),

  viet: (t) => ({
    rU: V(-0.25, -0.75, 0.6), rL: V(0.35 + 0.15 * song(t, 2.2), -0.2, 0.9),
    lU: V(0.25, -0.75, 0.6), lL: V(-0.4, -0.25, 0.9),
    dau: [0.35, 0, 0],
  }),

  doc: (t) => ({
    rU: V(-0.25, -0.8, 0.55), rL: V(0.25, 0.25, 0.95),
    lU: V(0.25, -0.8, 0.55), lL: V(-0.25, 0.25, 0.95),
    dau: [0.3, 0.05 * song(t, 0.3), 0],
    bt: { relaxed: 0.3 },
  }),

  nhin: (t) => ({                                 // 見ます: tay che mat nhin xa
    rU: V(-0.55, 0.1, 0.8), rL: V(0.55, 0.8, 0.1),
    dau: [-0.05, 0.35 * song(t, 0.35), 0],
    bt: { surprised: 0.3 },
  }),

  nghe: (t) => ({                                 // 聞きます / 電話
    rU: V(-0.75, -0.45, 0.3), rL: V(0.25, 1, 0.1),
    dau: [0, 0, -0.22 + 0.03 * song(t, 0.5)],
    bt: { relaxed: 0.3 },
  }),

  noi: (t) => ({                                  // 話します: hai tay mo ra luan phien
    rU: V(-0.35, -0.8, 0.5), rL: V(-0.3 + 0.35 * song(t, 0.8), 0.1, 1),
    lU: V(0.35, -0.8, 0.5), lL: V(0.3 + 0.35 * song(t + 0.5, 0.8), 0.1, 1),
    bt: { aa: (song(t, 3) + 1) * 0.3, happy: 0.3 },
  }),

  mua: (t) => ({                                  // 買います: chia tay ra dua tien
    rU: V(-0.2, -0.45, 0.9 + 0.1 * song(t, 0.7)), rL: V(-0.05, -0.1, 1),
    bt: { happy: 0.5 },
  }),

  boi: (t) => {
    const a = song(t, 0.8), b = song(t + 0.5, 0.8);
    return {
      rU: V(-0.4, a, 0.6), rL: V(-0.2, a, 1),
      lU: V(0.4, b, 0.6), lL: V(0.2, b, 1),
      lung: [0.3, 0, 0],
      bt: { happy: 0.4 },
    };
  },

  cho: (t) => ({                                  // 待ちます: xem dong ho
    lU: V(0.35, -0.8, 0.45), lL: V(-0.8, 0.25, 0.55),
    dau: [0.35, 0.1, 0],
    bt: { angry: 0.2 * (song(t, 0.5) + 1) },
  }),

  hat: (t) => ({                                  // 歌います
    rU: V(-0.3, -0.8, 0.5), rL: V(0.85, 0.3, 0.35),
    lU: V(0.8, -0.2, 0.4), lL: V(0.6, 0.6, 0.4),
    dau: [0, 0, 0.15 * song(t, 0.6)],
    bt: { happy: 0.9, oh: (song(t, 2) + 1) * 0.3 },
  }),

  rua: (t) => ({                                  // 洗います: xoa hai tay
    rU: V(-0.2, -0.85, 0.5), rL: V(0.8 + 0.2 * song(t, 2.5), 0.1, 0.55),
    lU: V(0.2, -0.85, 0.5), lL: V(-0.8 + 0.2 * song(t, 2.5), 0.1, 0.55),
    dau: [0.3, 0, 0],
  }),

  vui: (t) => ({                                  // giang dung / khen
    rU: V(-0.6, 0.6 + 0.15 * song(t, 1.5), 0.2), rL: V(-0.1, 1, 0),
    lU: V(0.6, 0.6 + 0.15 * song(t, 1.5), 0.2), lL: V(0.1, 1, 0),
    bt: { happy: 1 },
  }),

  gian: (t) => ({                                 // chong nanh + lac dau
    rU: V(-0.75, -0.6, -0.15), rL: V(0.75, -0.5, 0.2),
    lU: V(0.75, -0.6, -0.15), lL: V(-0.75, -0.5, 0.2),
    dau: [0.05, 0.3 * song(t, 1.4), 0],
    bt: { angry: 1 },
  }),

  ngac_nhien: () => ({
    rU: V(-0.4, -0.35, 0.85), rL: V(0.35, 0.9, 0.2),
    lU: V(0.4, -0.35, 0.85), lL: V(-0.35, 0.9, 0.2),
    dau: [-0.12, 0, 0],
    bt: { surprised: 1 },
  }),

  gat_dau: (t) => ({
    dau: [0.22 * Math.max(0, song(t, 1.3)), 0, 0],
    bt: { happy: 0.5 },
  }),
};

// Dong tac nao "di bo" chu khong dung yen tai cho
const DI_BO = { di: 0.9, chay: 2.2 };

// Thoi gian mac dinh (giay) truoc khi ve lai tu the dung
const THOI_LUONG = { cui: 2.2, day: 2.2, gat_dau: 1.6, ngac_nhien: 1.8 };

// Bieu tuong noi tren dau khi dien dong tac
const BONG = { an: '🍚', uong: '🥤', ngu: '💤', day: '☀️', vay: '👋', cui: '🙇', viet: '✏️',
  doc: '📖', nhin: '👀', nghe: '👂', noi: '💬', mua: '💴', boi: '🏊', cho: '⌚', hat: '🎵',
  rua: '🫧', vui: '✨', gian: '💢', ngac_nhien: '❗', nghi: '❓', di: '🚶', chay: '🏃' };

/**
 * Tu vung -> dong tac. Doc tu romaji trong giao trinh (co ca the ます lan the
 * tu dien) nen khong vuong chu Han kieu 行 nam trong 銀行.
 */
const TU_DIEN_DONG_TAC = [
  [/^tabe/, 'an'], [/^nom(i|u)/, 'uong'], [/^ne(masu|ru)$/, 'ngu'], [/^oki(masu|ru)$/, 'day'],
  [/^(iki|iku$|dekake|kaeri|kaeru$|aruk)/, 'di'], [/^(kimasu|kuru)$/, 'di'], [/^hashir/, 'chay'],
  [/^(mi(masu|ru)$|mise)/, 'nhin'], [/^(kik(i|u)|denwa)/, 'nghe'], [/^(kak(i|u)|tegami)/, 'viet'],
  [/^(yom(i|u)|hon$|benkyou)/, 'doc'], [/^hanas/, 'noi'], [/^(kaimasu|kau)$/, 'mua'],
  [/^oyog/, 'boi'], [/^(machi|matsu)/, 'cho'], [/^(aimasu|au)$/, 'vay'], [/^uta/, 'hat'],
  [/^ara(i|u)/, 'rua'], [/^asob/, 'vui'], [/^yasum/, 'ngu'], [/^wakar/, 'nghi'],
  [/^watashi/, 'toi'], [/^anata/, 'ban'],
  [/^(ohayou|konnichiwa|konbanwa|sayounara|jaa|mata|oyasumi)/, 'vay'],
  [/^(arigatou|sumimasen|hajimemashite|douzo|yoroshiku|gomen|shitsurei|onegai)/, 'cui'],
];

function dongTacChoTu(romaji) {
  const r = String(romaji || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!r) return null;
  for (const [mau, ten] of TU_DIEN_DONG_TAC) if (mau.test(r)) return ten;
  return null;
}

// ---------------------------------------------------------------------------

const S = {
  san: false, vrm: null, renderer: null, scene: null, camera: null, clock: new THREE.Clock(),
  x: null, dichX: null, huong: 0,
  chi: null,            // { el, den } dang chi vao phan tu nao, toi luc nao
  bam: 0,               // thoi diem bam (dong tac an tay toi)
  dongTac: null,        // { ten, batDau, den }
  camXuc: null,         // { ten, den }
  chop: 0, mieng: 0, dangDi: 0, nhip: 0,
  nghiTu: 0,            // luc bat dau ranh roi -> sau mot luc thi ve cho cu
  tat: false,
};

const kichThuoc = () => {
  const W = innerWidth, H = innerHeight;
  // Man hinh hep (dien thoai): nho lai, dung yen o goc, chi bang tia laser
  const hep = W < 700;
  const cao = hep ? Math.max(130, Math.min(H * 0.22, 190)) : Math.max(170, Math.min(H * 0.36, 340));
  const chan = H - (document.querySelector('.deck-bottom')?.offsetHeight || 64) - 6;
  return { W, H, cao, chan, hep };
};

// Toa do man hinh (px) -> diem tren mat phang z trong khong gian 3D
const FOV = 20, CAM_Z = 12;
function manHinhSang3D(px, py, z = 0) {
  const { W, H } = kichThuoc();
  const caoNhin = 2 * (CAM_Z - z) * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  return new THREE.Vector3((px / W - 0.5) * caoNhin * (W / H), (0.5 - py / H) * caoNhin, z);
}
function _3DSangManHinh(v) {
  const { W, H } = kichThuoc();
  const p = v.clone().project(S.camera);
  return { x: (p.x + 1) / 2 * W, y: (1 - p.y) / 2 * H };
}

let khung, laser, ctx2d, bong;

function dungSanKhau() {
  khung = document.createElement('canvas');
  khung.id = 'senseiAvatarCanvas';
  laser = document.createElement('canvas');
  laser.id = 'senseiAvatarLaser';
  bong = document.createElement('div');
  bong.id = 'senseiAvatarBong';
  for (const c of [khung, laser]) {
    Object.assign(c.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh',
      pointerEvents: 'none', zIndex: '85' });   // tren the spotlight (80), duoi bang chon bai (90)
    document.body.appendChild(c);
  }
  Object.assign(bong.style, { position: 'fixed', zIndex: '86', pointerEvents: 'none', fontSize: '30px',
    transition: 'opacity .25s, transform .25s', opacity: '0', transform: 'translate(-50%,-100%) scale(.6)' });
  document.body.appendChild(bong);
  ctx2d = laser.getContext('2d');

  // Nut an / hien nhan vat (khi no dung che mat thu hoc vien dang can doc)
  const nut = document.createElement('button');
  nut.id = 'senseiAvatarNut';
  nut.type = 'button';
  nut.title = 'Ẩn / hiện Sensei hoạt hình';
  nut.textContent = '🧑‍🏫';
  Object.assign(nut.style, { position: 'fixed', right: '10px', zIndex: '87', width: '34px', height: '34px',
    borderRadius: '50%', border: '1px solid rgba(0,0,0,.12)', background: 'rgba(255,255,255,.85)',
    fontSize: '17px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,.12)' });
  const datNut = () => { nut.style.bottom = (innerHeight - kichThuoc().chan + 8) + 'px'; nut.style.opacity = S.tat ? '0.55' : '1'; };
  nut.addEventListener('click', () => { window.SenseiAvatar.an(!S.tat); datNut(); });
  addEventListener('resize', datNut);
  document.body.appendChild(nut);
  S._datNut = datNut;
  setTimeout(datNut, 500);

  const st = document.createElement('style');
  st.textContent = `
    .sensei-gon { position: fixed; z-index: 86; pointer-events: none; width: 16px; height: 16px;
      margin: -8px 0 0 -8px; border-radius: 50%; border: 3px solid #f43f5e;
      animation: senseiGon .6s ease-out forwards; }
    @keyframes senseiGon { from { transform: scale(.3); opacity: 1 } to { transform: scale(3.2); opacity: 0 } }`;
  document.head.appendChild(st);

  S.renderer = new THREE.WebGLRenderer({ canvas: khung, alpha: true, antialias: true });
  S.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  S.renderer.outputColorSpace = THREE.SRGBColorSpace;
  S.scene = new THREE.Scene();
  S.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
  S.camera.position.set(0, 0, CAM_Z);
  const den = new THREE.DirectionalLight(0xffffff, Math.PI);
  den.position.set(1, 1.5, 2);
  S.scene.add(den, new THREE.AmbientLight(0xffffff, 0.6));

  const doiCo = () => {
    const { W, H } = kichThuoc();
    S.renderer.setSize(W, H, false);
    laser.width = W * devicePixelRatio; laser.height = H * devicePixelRatio;
    S.camera.aspect = W / H;
    S.camera.updateProjectionMatrix();
    if (S.vrm) datCoNhanVat();
  };
  addEventListener('resize', doiCo);
  doiCo();
}

let caoMoHinh = 1.5;
function datCoNhanVat() {
  const { W, cao, chan } = kichThuoc();
  const dinh = manHinhSang3D(0, 0), day = manHinhSang3D(0, cao);
  const tile = (dinh.y - day.y) / caoMoHinh;
  S.vrm.scene.scale.setScalar(tile);
  S.vrm.scene.position.y = manHinhSang3D(0, chan).y;
  if (S.x === null) S.x = S.dichX = viTriNha();
  else S.x = Math.min(S.x, manHinhSang3D(W, 0).x);
}

const viTriNha = () => { const { W, cao } = kichThuoc(); return manHinhSang3D(W - cao * 0.3, 0).x; };

async function napNhanVat() {
  const loader = new GLTFLoader();
  loader.register((p) => new VRMLoaderPlugin(p));
  const gltf = await loader.loadAsync(window.SENSEI_AVATAR_URL || MAU_MAC_DINH);
  const vrm = gltf.userData.vrm;
  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  VRMUtils.combineSkeletons?.(gltf.scene);
  VRMUtils.rotateVRM0(vrm);                       // VRM0 quay lung -> xoay lai nhin ra truoc
  vrm.scene.traverse((o) => { o.frustumCulled = false; });
  S.vrm = vrm;
  S.scene.add(vrm.scene);

  vrm.scene.updateMatrixWorld(true);
  const dau = vrm.humanoid.getNormalizedBoneNode('head');
  const p = new THREE.Vector3(); dau.getWorldPosition(p);
  caoMoHinh = p.y + 0.12;                         // dinh dau cao hon xuong dau mot chut
  datCoNhanVat();
}

// ---------------------------------------------------------------------------
// XUONG
// ---------------------------------------------------------------------------
const xuong = (ten) => S.vrm.humanoid.getNormalizedBoneNode(ten);
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _qr = new THREE.Quaternion();
const _a = new THREE.Vector3(), _b = new THREE.Vector3();

// Moi tu the viet cho nhan vat nhin +Z (chuan VRM1). VRM0 (nhieu tep VRoid cu)
// lai nhin -Z trong he toa do goc -> lat 180 do quanh truc Y cho khop.
const laVRM0 = () => S.vrm?.meta?.metaVersion === '0';
const doiHuong = (v, dich) => laVRM0() ? dich.set(-v.x, v.y, -v.z) : dich.copy(v);

/** Dat xuong `ten` sao cho no chi theo `huong` (he toa do goc cua nhan vat) */
function chiXuong(ten, nghi, huong, muot) {
  const b = xuong(ten);
  if (!b || !huong) return;
  S.vrm.scene.getWorldQuaternion(_qr).invert();
  b.parent.getWorldQuaternion(_q2);
  _q2.premultiply(_qr);                           // huong cua xuong cha trong he goc
  _q.setFromUnitVectors(doiHuong(nghi, _a), doiHuong(huong, _b));
  _q.premultiply(_q2.invert());
  b.quaternion.slerp(_q, muot);
  b.updateMatrixWorld(true);
}

function xoayXuong(ten, [x, y, z], muot) {
  const b = xuong(ten);
  if (!b) return;
  _q.setFromEuler(laVRM0() ? new THREE.Euler(-x, y, -z) : new THREE.Euler(x, y, z));
  b.quaternion.slerp(_q, muot);
}

const TAY_THA = { rU: V(-0.28, -1, 0.05), rL: V(-0.12, -1, 0.2), lU: V(0.28, -1, 0.05), lL: V(0.12, -1, 0.2) };

// ---------------------------------------------------------------------------
// VONG VE
// ---------------------------------------------------------------------------
function khungHinh() {
  requestAnimationFrame(khungHinh);
  capNhat();
}

function capNhat() {
  const dt = Math.min(S.clock.getDelta(), 0.1);
  if (!S.vrm || S.tat) return;
  const now = performance.now() / 1000;
  const muot = 1 - Math.pow(0.001, dt);           // ~ doi het trong 1/3 giay

  // --- dong tac dang dien / het han
  if (S.dongTac && now > S.dongTac.den) { S.dongTac = null; anBong(); }
  if (S.chi && now > S.chi.den) S.chi = null;
  if (S.camXuc && now > S.camXuc.den) S.camXuc = null;

  // --- di chuyen
  const dt_ = S.dongTac && DI_BO[S.dongTac.ten];
  if (dt_) {
    // Di bo minh hoa: qua lai quanh cho dung
    const g = S.dongTac.goc ?? (S.dongTac.goc = S.x);
    S.dichX = g + Math.sin((now - S.dongTac.batDau) * 0.8 * dt_) * 0.9;
  } else if (!S.chi && !S.dongTac && now - S.nghiTu > 9) {
    S.dichX = viTriNha();
  }
  const conLai = S.dichX - S.x;
  const tocDo = (dt_ ? 1.3 * dt_ : 3.2) * S.vrm.scene.scale.x;
  const buoc = Math.sign(conLai) * Math.min(Math.abs(conLai), tocDo * dt);
  S.x += buoc;
  const dangDi = Math.abs(conLai) > 0.02;
  S.dangDi += ((dangDi ? 1 : 0) - S.dangDi) * muot;
  S.vrm.scene.position.x = S.x;
  if (dangDi) S.nhip += dt * (dt_ ? 3.2 * dt_ : 7);

  // Quay nguoi: dang di thi nghieng ve huong di, dung thi nhin ra hoc vien
  const huongMuon = dangDi ? Math.sign(conLai) * 0.9 : 0;
  S.huong += (huongMuon - S.huong) * muot;
  S.vrm.scene.rotation.y = S.huong + (S.vrm.meta?.metaVersion === '0' ? Math.PI : 0);

  // --- tu the than
  const tt = S.dongTac ? (TU_THE[S.dongTac.ten] || TU_THE.dung)(now - S.dongTac.batDau) : {};
  const tho = Math.sin(now * 1.6) * 0.02;
  xoayXuong('spine', tt.lung || [tho, 0, 0], muot);
  xoayXuong('chest', [0, 0, 0], muot);
  xoayXuong('neck', [0, 0, 0], muot);

  // Dau: nhin theo cho dang chi, hoac theo tu the
  let dauMuon = tt.dau || [0.04, 0, 0];
  if (S.chi && !tt.dau) {
    const r = S.chi.el.getBoundingClientRect();
    const d = manHinhSang3D(r.left + r.width / 2, r.top + r.height / 2, 1.5).sub(S.vrm.scene.position);
    dauMuon = [THREE.MathUtils.clamp(-d.y * 0.15, -0.5, 0.4), THREE.MathUtils.clamp(d.x * 0.3, -0.6, 0.6), 0];
  }
  xoayXuong('head', dauMuon, muot);

  // Chan: vung khi di
  const vung = Math.sin(S.nhip) * 0.55 * S.dangDi;
  xoayXuong('leftUpperLeg', [vung, 0, 0], 0.5);
  xoayXuong('rightUpperLeg', [-vung, 0, 0], 0.5);
  xoayXuong('leftLowerLeg', [Math.max(0, -vung) * 0.9, 0, 0], 0.5);
  xoayXuong('rightLowerLeg', [Math.max(0, vung) * 0.9, 0, 0], 0.5);
  const hong = xuong('hips');
  hong.userData.goc ??= hong.position.y;
  hong.position.y = hong.userData.goc + Math.abs(Math.sin(S.nhip)) * 0.03 * S.dangDi;

  S.vrm.scene.updateMatrixWorld(true);

  // --- canh tay
  let tay = { ...TAY_THA };
  // Vung tay khi di
  if (S.dangDi > 0.1 && !S.dongTac) {
    tay.rU = V(-0.28, -1, 0.05 + vung * 0.9); tay.lU = V(0.28, -1, 0.05 - vung * 0.9);
  }
  for (const k of ['rU', 'rL', 'lU', 'lL']) if (tt[k]) tay[k] = tt[k];

  let tayChi = null;
  if (S.chi) {
    const r = S.chi.el.getBoundingClientRect();
    const dich = manHinhSang3D(r.left + r.width / 2, r.top + r.height / 2, 1.2);
    const tren = xuong(S.chi.phai ? 'rightUpperArm' : 'leftUpperArm');
    const vai = new THREE.Vector3(); tren.getWorldPosition(vai);
    const huong = dich.sub(vai);
    // Doi ve he toa do chuan (bo phan nguoi dang xoay)
    huong.applyAxisAngle(new THREE.Vector3(0, 1, 0), -S.huong).normalize();
    // Luc bam: tay dam toi mot cai
    const dam = Math.max(0, 1 - (now - S.bam) / 0.35);
    const k = S.chi.phai ? 'r' : 'l';
    tay[k + 'U'] = huong.clone().lerp(V(0, -1, 0.3), 0.08 - dam * 0.08).normalize();
    tay[k + 'L'] = huong;
    tayChi = S.chi.phai ? 'rightHand' : 'leftHand';
  }
  chiXuong('rightUpperArm', NGHI_PHAI, tay.rU, muot);
  chiXuong('rightLowerArm', NGHI_PHAI, tay.rL, muot);
  chiXuong('leftUpperArm', NGHI_TRAI, tay.lU, muot);
  chiXuong('leftLowerArm', NGHI_TRAI, tay.lL, muot);

  // --- bieu cam + khau hinh + chop mat
  const em = S.vrm.expressionManager;
  if (em) {
    const bt = { happy: 0, angry: 0, sad: 0, surprised: 0, relaxed: 0, ...(tt.bt || {}) };
    if (S.camXuc) bt[S.camXuc.ten] = Math.max(bt[S.camXuc.ten] || 0, S.camXuc.muc ?? 0.9);
    for (const [ten, v] of Object.entries(bt)) {
      if (['aa', 'oh', 'blink'].includes(ten)) continue;
      em.setValue(ten, THREE.MathUtils.lerp(em.getValue(ten) ?? 0, v, muot));
    }
    // Mieng theo do to giong dang phat
    const muc = window.__audioEngine?.getOutputLevel?.() || 0;
    S.mieng += (Math.min(1, muc * 9) - S.mieng) * (1 - Math.pow(0.0001, dt));
    const nguyenAm = Math.floor(now * 7) % 3;      // doi a/o/i cho do cung
    em.setValue('aa', Math.max(tt.bt?.aa || 0, S.mieng * (nguyenAm === 0 ? 1 : 0.5)));
    em.setValue('oh', Math.max(tt.bt?.oh || 0, S.mieng * (nguyenAm === 1 ? 0.8 : 0)));
    em.setValue('ih', S.mieng * (nguyenAm === 2 ? 0.6 : 0));
    // Chop mat ngau nhien
    if (now > S.chop) S.chop = now + 2 + Math.random() * 3;
    const conChop = S.chop - now;
    em.setValue('blink', tt.bt?.blink ?? (conChop < 0.12 ? 1 : 0));
  }

  S.vrm.update(dt);
  S.renderer.render(S.scene, S.camera);
  veLaser(tayChi, now);
  veBong();
}

function veLaser(tayChi, now) {
  const W = laser.width, H = laser.height, d = devicePixelRatio;
  ctx2d.clearRect(0, 0, W, H);
  if (!tayChi || !S.chi) return;
  const ngon = S.vrm.humanoid.getRawBoneNode(tayChi.replace('Hand', 'IndexDistal'))
            || S.vrm.humanoid.getRawBoneNode(tayChi);
  const p = new THREE.Vector3(); ngon.getWorldPosition(p);
  const a = _3DSangManHinh(p);
  const r = S.chi.el.getBoundingClientRect();
  // Dung o mep phan tu gan tay nhat chu khong xuyen vao giua chu
  const bx = THREE.MathUtils.clamp(a.x, r.left, r.right), by = THREE.MathUtils.clamp(a.y, r.top, r.bottom);
  ctx2d.save();
  ctx2d.scale(d, d);
  ctx2d.setLineDash([6, 6]);
  ctx2d.lineDashOffset = -now * 40;
  ctx2d.strokeStyle = 'rgba(244,63,94,.75)';
  ctx2d.lineWidth = 2.5;
  ctx2d.beginPath(); ctx2d.moveTo(a.x, a.y); ctx2d.lineTo(bx, by); ctx2d.stroke();
  ctx2d.setLineDash([]);
  ctx2d.fillStyle = 'rgba(244,63,94,.9)';
  ctx2d.beginPath(); ctx2d.arc(bx, by, 5 + Math.sin(now * 8) * 1.5, 0, Math.PI * 2); ctx2d.fill();
  ctx2d.restore();
}

function veBong() {
  if (bong.style.opacity === '0') return;
  const p = new THREE.Vector3(); xuong('head').getWorldPosition(p);
  const s = _3DSangManHinh(p);
  bong.style.left = s.x + 'px';
  bong.style.top = (s.y - kichThuoc().cao * 0.3) + 'px';
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

// ---------------------------------------------------------------------------
// LENH TU BEN NGOAI
// ---------------------------------------------------------------------------
function timPhanTu(elHoacId) {
  if (!elHoacId) return null;
  if (elHoacId instanceof Element) return elHoacId;
  return window.__slideEngine?.resolveElement?.(elHoacId) || document.getElementById(elHoacId);
}

/** Di toi canh phan tu roi gio tay chi. Tra ve false neu khong thay phan tu. */
function chiVao(elHoacId, giay = 4) {
  const el = timPhanTu(elHoacId);
  if (!S.vrm || !el) return false;
  const r = el.getBoundingClientRect();
  if (!r.width && !r.height) return false;
  const { W, cao, hep } = kichThuoc();
  const tam = r.left + r.width / 2;
  // Dung lech sang mot ben phan tu de khong che mat no; uu tien phia ben phai
  const lech = cao * 0.42;
  let dungPx = r.right + lech * 0.55;
  if (dungPx > W - cao * 0.22) dungPx = r.left - lech * 0.55;
  if (dungPx < cao * 0.22) dungPx = Math.min(W - cao * 0.22, tam + lech);
  // The spotlight neo ben trai dang mo -> khong dung lot vao sau / de len no
  const the = document.querySelector('.spotlight:not(.hidden) .spot-dock');
  const rt = the && the.getBoundingClientRect();
  if (rt && rt.width && rt.width < W * 0.6) dungPx = Math.max(dungPx, rt.right + cao * 0.2);
  S.dichX = hep ? viTriNha() : manHinhSang3D(Math.min(dungPx, W - cao * 0.22), 0).x;
  if (hep) dungPx = W - cao * 0.3;
  const now = performance.now() / 1000;
  // Phan tu nam ben trai nhan vat (tren man hinh) -> dung tay PHAI cua nhan vat
  S.chi = { el, den: now + giay, phai: tam < dungPx };
  S.nghiTu = now + giay;
  if (S.dongTac && !DI_BO[S.dongTac.ten]) { S.dongTac = null; anBong(); }
  return true;
}

/** Di toi, chi, roi "bam" vao phan tu (vi du nut tab) */
function bamVao(elHoacId) {
  const el = timPhanTu(elHoacId);
  if (!chiVao(el, 1.8)) return false;
  // Doi den gan roi moi bam
  const cho = setInterval(() => {
    if (Math.abs(S.dichX - S.x) > 0.05) return;
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
  if (!S.vrm || !(ten in TU_THE || ten in DI_BO)) return false;
  const now = performance.now() / 1000;
  S.chi = null;
  S.dongTac = { ten, batDau: now, den: now + (giay || THOI_LUONG[ten] || (DI_BO[ten] ? 3.2 : 3)) };
  S.nghiTu = S.dongTac.den;
  if (BONG[ten]) hienBong(BONG[ten]);
  return true;
}

function camXuc(ten, giay = 3, muc = 0.9) {
  if (!S.vrm) return false;
  const map = { vui: 'happy', gian: 'angry', buon: 'sad', ngac_nhien: 'surprised', thu_gian: 'relaxed' };
  const t = map[ten] || ten;
  if (!['happy', 'angry', 'sad', 'surprised', 'relaxed'].includes(t)) return false;
  S.camXuc = { ten: t, den: performance.now() / 1000 + giay, muc };
  return true;
}

/**
 * Goi moi khi mot muc giao trinh duoc roi sang (tu tool hay tu bo bam
 * transcript): chi vao no, va neu la tu co dong tac thi dien luon.
 */
function khiRoiMuc(targetId, found, styleType) {
  if (!S.vrm) return;
  const data = found?.data || {};
  const ten = found?.type === 'vocab' ? dongTacChoTu(data.romaji) : null;
  // Doi trang cuon / doi tab xong roi moi do vi tri de dung cho dung cho
  clearTimeout(S._henChi);
  S._henChi = setTimeout(() => chiVao(targetId), 350);
  if (styleType === 'warning') camXuc('angry', 3);
  clearInterval(S._henDien);
  if (ten) {
    // Di toi noi, chi vao tu them mot nhip cho hoc vien kip nhin, roi moi dien
    const batDau = Date.now();
    let toiLuc = 0;
    const hen = S._henDien = setInterval(() => {
      const el = timPhanTu(targetId);
      if (!S.chi || S.chi.el !== el) {
        if (Date.now() - batDau > 1000) clearInterval(hen);   // da chuyen sang muc khac
        return;
      }
      if (!toiLuc && Math.abs(S.dichX - S.x) < 0.05) toiLuc = Date.now();
      if (toiLuc && Date.now() - toiLuc > 1100) { clearInterval(hen); dienDongTac(ten); }
    }, 100);
    setTimeout(() => clearInterval(hen), 8000);
  }
}

window.SenseiAvatar = {
  chiVao, bamVao, dienDongTac, camXuc, khiRoiMuc, dongTacChoTu,
  DANH_SACH_DONG_TAC: [...Object.keys(TU_THE).filter((k) => k !== 'dung'), ...Object.keys(DI_BO)],
  get san() { return S.san; },
  an(anDi = true) {
    S.tat = anDi;
    khung.style.display = laser.style.display = anDi ? 'none' : '';
    if (anDi) anBong();
    try { localStorage.setItem('senseiAvatarAn', anDi ? '1' : '0'); } catch (e) {}
    S._datNut?.();
  },
  _S: S, _capNhat: capNhat,
};

(async () => {
  try {
    dungSanKhau();
    khungHinh();
    await napNhanVat();
    S.san = true;
    let an = false;
    try { an = localStorage.getItem('senseiAvatarAn') === '1'; } catch (e) {}
    if (an) window.SenseiAvatar.an(true);
    console.log('[SenseiAvatar] da nap nhan vat');
    dienDongTac('vay', 2.5);
  } catch (e) {
    console.warn('[SenseiAvatar] khong nap duoc nhan vat:', e);
  }
})();
