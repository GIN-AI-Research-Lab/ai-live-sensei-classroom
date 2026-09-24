/**
 * MEO SENSEI 3D THAT — mo hinh dung tu anh meo (Hunyuan3D), co long nhieu lop va 23 xuong.
 *
 * Khung ve chi to bang con meo va di theo no (khong phu kin man hinh) de nhe may.
 * Chi vao muc: truot toi canh muc, gio dung canh tay phia muc ve dung huong
 * (tinh tu vi tri vai tren man hinh), tia laser tu ban tay toi the.
 * Dang noi: dau gat nhe, tay khoa chan. Dong tac / cam xuc: vay, gat, chi, vui, lac dau.
 *
 * Dang ky qua SenseiAvatarHub, cung giao dien voi meo 2D / meo video.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { napMeoNangCap } from './meo3d-long.js';

const MO_HINH = 'assets/sensei-meo/3d/meo-xuong.glb';
const hub = window.SenseiAvatarHub;

// act_out cua Gemini -> dong tac co san cua meo 3D
const DONG_TAC = { vay: 'vay', cui: 'gat', gat_dau: 'gat', vui: 'vui', hat: 'vui', gian: 'lac', noi: 'gat',
                   ngac_nhien: 'vui', ban: 'chi', toi: 'gat', doc: 'gat', nghi: 'lac' };
const THOI_LUONG = { vay: 2.6, gat: 1.8, vui: 2.4, lac: 1.8, chi: 2.5 };
const CAM_XUC = { happy: 'vui', love: 'vui', angry: 'lac', speechless: 'lac', sad: 'gat', dizzy: 'lac', surprised: 'vui' };
const BONG = { vay: '👋', vui: '✨', lac: '💢', gat: '', chi: '' };

const S = {
  san: false, tat: false, x: null, dichX: null, chi: null, dongTac: null, nghiTu: 0,
  truoc: performance.now(), pha: 0, dangDi: 0, noiDen: 0, soLop: 14, tbKhung: 16,
};
let renderer, scene, cam, meo = null, khung, laser, ctx2d, bong;

function kichThuoc() {
  const W = innerWidth, H = innerHeight, hep = W < 700;
  const cao = hep ? Math.max(140, Math.min(H * .22, 180)) : Math.max(200, Math.min(H * .36, 320));
  const chan = H - (document.querySelector('.deck-bottom')?.offsetHeight || 64);
  return { W, H, hep, cao, rong: cao * 1.3, khungCao: cao * 1.18, chan };
}
const viTriNha = () => {
  const { W, rong } = kichThuoc();
  return W - (hub ? hub.rongTruoc(api) : 0) - rong * .5;
};

function dungSanKhau() {
  khung = document.createElement('canvas');
  Object.assign(khung.style, { position: 'fixed', left: '0', top: '0', pointerEvents: 'none', zIndex: '85',
    transformOrigin: '50% 100%', willChange: 'transform' });
  document.body.appendChild(khung);
  laser = document.createElement('canvas');
  Object.assign(laser.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '84' });
  document.body.appendChild(laser);
  ctx2d = laser.getContext('2d');
  bong = document.createElement('div');
  Object.assign(bong.style, { position: 'fixed', zIndex: '86', pointerEvents: 'none', fontSize: '28px',
    transition: 'opacity .25s', opacity: '0', transform: 'translate(-50%,-100%)' });
  document.body.appendChild(bong);

  renderer = new THREE.WebGLRenderer({ canvas: khung, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = .95;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
  const chinh = new THREE.DirectionalLight(0xfff1e0, 1.6); chinh.position.set(-2, 3, 3);
  const vien = new THREE.DirectionalLight(0xffe6c8, 1.4); vien.position.set(1.5, 2.5, -3);
  scene.add(chinh, vien, new THREE.HemisphereLight(0xffffff, 0xd8c8b0, .35));
  // Meo cao 1.8, khung ve cao 1.8 * 1.18 -> camera dat vua khit
  cam = new THREE.PerspectiveCamera(24, 1, .1, 50);
  const nuaCao = 1.8 * 1.18 / 2;
  cam.position.set(0, nuaCao - .02, nuaCao / Math.tan(THREE.MathUtils.degToRad(12)));
  cam.lookAt(0, nuaCao - .02, 0);

  const doiCo = () => {
    const { W, H, rong, khungCao } = kichThuoc();
    renderer.setSize(rong, khungCao);
    cam.aspect = rong / khungCao; cam.updateProjectionMatrix();
    laser.width = W * devicePixelRatio; laser.height = H * devicePixelRatio;
    if (S.x === null) S.x = S.dichX = viTriNha();
  };
  addEventListener('resize', doiCo);
  doiCo();
}

function datVao(o) {
  const box = new THREE.Box3().setFromObject(o), size = box.getSize(new THREE.Vector3());
  o.scale.setScalar(1.8 / size.y);
  box.setFromObject(o);
  const c = box.getCenter(new THREE.Vector3());
  o.position.sub(new THREE.Vector3(c.x, box.min.y, c.z));
}

// Vi tri tren trang cua mot xuong (qua camera cua khung ve)
const _v = new THREE.Vector3();
function viTriTrang(b) {
  b.getWorldPosition(_v).project(cam);
  const r = khung.getBoundingClientRect();
  return { x: r.left + (_v.x + 1) / 2 * r.width, y: r.top + (1 - _v.y) / 2 * r.height };
}

// ---------------------------------------------------------------------------
function khungHinh() { requestAnimationFrame(khungHinh); capNhat(); }

function capNhat() {
  const nowMs = performance.now();
  const dt = Math.min((nowMs - S.truoc) / 1000, .05);
  S.truoc = nowMs;
  if (!S.san || S.tat || !meo || dt <= 0) return;
  const now = nowMs / 1000;
  const { W, rong, khungCao, chan } = kichThuoc();

  if (S.chi && now > S.chi.den) { S.chi = null; meo.dieuKhien.hanhDong('nghi'); }
  if (S.dongTac && now > S.dongTac.den) { S.dongTac = null; anBong(); if (!S.chi) meo.dieuKhien.hanhDong('nghi'); }
  if (!S.chi && !S.dongTac && now - S.nghiTu > 9) S.dichX = viTriNha();

  // Truot ngang toi cho dung, buoc chan theo quang duong
  const conLai = S.dichX - S.x;
  const buoc = Math.sign(conLai) * Math.min(Math.abs(conLai), rong * 2.2 * dt);
  S.x += buoc;
  const dangDi = Math.abs(conLai) > 1;
  S.dangDi += ((dangDi ? 1 : 0) - S.dangDi) * Math.min(1, dt * 8);
  S.pha += Math.abs(buoc) / rong * 9;
  meo.dieuKhien.di(S.dangDi, S.pha);
  const nhun = -Math.abs(Math.sin(S.pha)) * khungCao * .012 * S.dangDi;
  khung.style.transform = `translate(${S.x - rong / 2}px, ${chan - khungCao + nhun}px)`;
  // Quay nguoi nhe ve huong di
  meo.doiTuong.rotation.y += ((dangDi ? Math.sign(conLai) * .5 : 0) - meo.doiTuong.rotation.y) * Math.min(1, dt * 6);

  // Dang noi (do tu giong Sensei dang phat)
  const muc = window.__audioEngine?.getOutputLevel?.() || 0;
  if (muc > .02) S.noiDen = now + .5;
  meo.dieuKhien.noi(now < S.noiDen ? 1 : 0);

  // Chi tay: huong tu vai toi muc tren man hinh -> he meo (x phai man hinh, y len)
  let banTay = null;
  if (S.chi && !dangDi) {
    const r = S.chi.el.getBoundingClientRect();
    const tx = r.left + r.width / 2, ty = r.top + r.height / 2;
    const ben = tx < S.x ? 'R' : 'L';                  // tay PHAI cua meo nam ben trai man hinh
    const vai = meo.xuong('baptay' + ben);
    if (vai) {
      const p = viTriTrang(vai);
      const d = new THREE.Vector3(tx - p.x, -(ty - p.y), 0);
      d.z = d.length() * .25;
      meo.dieuKhien.chi(ben, d);
      banTay = meo.xuong('bantay' + ben);
    }
    meo.dieuKhien.nhin(THREE.MathUtils.clamp((tx - S.x) / 400, -1, 1), THREE.MathUtils.clamp((ty - (chan - khungCao * .7)) / 400, -1, 1));
  } else if (!S.chi) meo.dieuKhien.nhin(Math.sin(now * .3) * .25, 0);

  meo.capNhat(now, dt);
  renderer.render(scene, cam);
  veLaser(banTay, now);
  if (bong.style.opacity !== '0') {
    const p = viTriTrang(meo.xuong('dau') || meo.doiTuong);
    bong.style.left = (p.x + rong * .22) + 'px'; bong.style.top = (p.y - khungCao * .3) + 'px';
  }

  // Tu ha so lop long khi may ve cham (chi khi cua so dang duoc dung)
  S.tbKhung += (dt * 1000 - S.tbKhung) * .05;
  if (document.hasFocus() && now > 3) {
    if (S.tbKhung > 26 && S.soLop > 6) { S.soLop -= 2; meo.datSoLop(S.soLop); S.tbKhung = 20; }
    else if (S.tbKhung < 13 && S.soLop < 18) { S.soLop += 2; meo.datSoLop(S.soLop); S.tbKhung = 20; }
  }
}

function veLaser(banTay, now) {
  const W = laser.width, H = laser.height, dp = devicePixelRatio;
  ctx2d.clearRect(0, 0, W, H);
  if (!banTay || !S.chi) return;
  const a = viTriTrang(banTay);
  const r = S.chi.el.getBoundingClientRect();
  const bx = Math.max(r.left, Math.min(r.right, a.x)), by = Math.max(r.top, Math.min(r.bottom, a.y));
  ctx2d.save(); ctx2d.scale(dp, dp);
  ctx2d.setLineDash([6, 6]); ctx2d.lineDashOffset = -now * 40;
  ctx2d.strokeStyle = 'rgba(231,76,60,.7)'; ctx2d.lineWidth = 2.5;
  ctx2d.beginPath(); ctx2d.moveTo(a.x, a.y); ctx2d.lineTo(bx, by); ctx2d.stroke();
  ctx2d.setLineDash([]); ctx2d.fillStyle = 'rgba(231,76,60,.9)';
  ctx2d.beginPath(); ctx2d.arc(bx, by, 5 + Math.sin(now * 8) * 1.5, 0, Math.PI * 2); ctx2d.fill();
  ctx2d.restore();
}
function hienBong(chu) { if (!chu) return; bong.textContent = chu; bong.style.opacity = '1'; }
function anBong() { bong.style.opacity = '0'; }

// ---------------------------------------------------------------------------
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
  let dung = benTrai ? r.left - rong * .45 : r.right + rong * .45;
  if (dung > W - rong * .5) dung = r.left - rong * .45;
  if (dung < rong * .5) dung = Math.min(W - rong * .5, tam + rong);
  const the = document.querySelector('.spotlight:not(.hidden) .spot-dock');
  const rt = the && the.getBoundingClientRect();
  if (rt && rt.width && rt.width < W * .6) dung = Math.max(dung, rt.right + rong * .45);
  S.dichX = hep ? viTriNha() : Math.min(dung, W - rong * .5);
  const now = performance.now() / 1000;
  S.chi = { el, den: now + giay };
  S.nghiTu = now + giay;
  S.dongTac = null; anBong();
  return true;
}

function bamVao(elHoacId) {
  const el = timPhanTu(elHoacId);
  if (!chiVao(el, 1.8)) return false;
  const cho = setInterval(() => {
    if (Math.abs(S.dichX - S.x) > 2) return;
    clearInterval(cho);
    const r = el.getBoundingClientRect();
    const g = document.createElement('div');
    g.className = 'sensei-gon';
    g.style.left = (r.left + r.width / 2) + 'px'; g.style.top = (r.top + r.height / 2) + 'px';
    document.body.appendChild(g);
    setTimeout(() => g.remove(), 700);
  }, 60);
  setTimeout(() => clearInterval(cho), 3000);
  return true;
}

function dienDongTac(ten, giay) {
  const dt = DONG_TAC[ten] || (ten === 'di' || ten === 'chay' ? 'di' : null);
  if (!S.san || !meo || !dt) return false;
  const now = performance.now() / 1000;
  S.chi = null;
  if (dt === 'di') {
    // Di bo minh hoa: truot qua lai mot doan
    const { rong } = kichThuoc();
    S.dichX = Math.max(rong * .6, S.x - rong * 1.2);
    setTimeout(() => { S.dichX = S.x + rong * 1.2; }, 1200);
    S.dongTac = { den: now + (giay || 3) }; S.nghiTu = S.dongTac.den;
    return true;
  }
  meo.dieuKhien.hanhDong(dt);
  S.dongTac = { den: now + (giay || THOI_LUONG[dt] || 2.5) };
  S.nghiTu = S.dongTac.den;
  hienBong(BONG[dt]);
  return true;
}

function camXuc(ten, giay = 2.5) {
  const map = { vui: 'happy', gian: 'angry', buon: 'sad', ngac_nhien: 'surprised' };
  const dt = CAM_XUC[map[ten] || ten];
  if (!S.san || !meo || !dt || S.chi) return false;
  meo.dieuKhien.hanhDong(dt);
  S.dongTac = { den: performance.now() / 1000 + giay };
  hienBong(BONG[dt]);
  return true;
}

function khiRoiMuc(targetId, found, styleType) {
  if (!S.san) return;
  clearTimeout(S._henChi);
  S._henChi = setTimeout(() => chiVao(targetId), 350);
  if (styleType === 'warning') setTimeout(() => camXuc('angry', 2), 400);
}

const api = {
  kieu: 'meo3d-that', uuTien: 0,
  chiVao, bamVao, dienDongTac, camXuc, khiRoiMuc,
  dongTacChoTu: () => null,
  DANH_SACH_DONG_TAC: Object.keys(DONG_TAC),
  get san() { return S.san; },
  get tat() { return S.tat; },
  rongHienTai: () => kichThuoc().rong,
  an(anDi = true) {
    S.tat = anDi;
    if (!khung) return;
    khung.style.display = laser.style.display = anDi ? 'none' : '';
    if (anDi) anBong(); else { S.x = S.dichX = viTriNha(); S.truoc = performance.now(); }
  },
  _S: S, _capNhat: capNhat, _meo: () => meo, _cam: () => cam,
};

dungSanKhau();
if (!document.getElementById('senseiGonCss')) {
  const st = document.createElement('style'); st.id = 'senseiGonCss';
  st.textContent = `.sensei-gon { position: fixed; z-index: 86; pointer-events: none; width: 16px; height: 16px;
    margin: -8px 0 0 -8px; border-radius: 50%; border: 3px solid #f43f5e; animation: senseiGon .6s ease-out forwards; }
    @keyframes senseiGon { from { transform: scale(.3); opacity: 1 } to { transform: scale(3.2); opacity: 0 } }`;
  document.head.appendChild(st);
}
napMeoNangCap(MO_HINH, scene).then((m) => {
  meo = m; datVao(m.doiTuong);
  // Dien thoai: bat dau voi it lop long hon cho nhe (van tu tang neu may du khoe)
  if (kichThuoc().hep) S.soLop = 8;
  m.datSoLop(S.soLop);
  S.san = true;
  if (hub) hub.dangKy(api); else window.SenseiAvatar = api;
  S.x = S.dichX = viTriNha();
  khungHinh();
  setTimeout(() => { if (!S.tat) dienDongTac('vay'); }, 900);
}, (e) => console.warn('[Meo3D] khong nap duoc mo hinh:', e));
