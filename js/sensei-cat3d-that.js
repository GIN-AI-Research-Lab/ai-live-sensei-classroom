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

// Ban dung tu Tripo (H2.5): muot, can doi hon ban Hunyuan (meo-xuong.glb, van giu de so sanh).
// Ban "nhe" cua meo-tripo.glb: anh mau 2048 thay 4096, bo anh metallicRoughness khong dung toi,
// nuong san bong khe / do dai long (_AO/_DAI) -> khong phai tinh lai luc nap. Anh phu dung chung ban goc.
const MO_HINH = 'assets/sensei-meo/3d/meo-tripo-nhe.glb';
const ANH_PHU = 'assets/sensei-meo/3d/meo-tripo';
const hub = window.SenseiAvatarHub;

// act_out cua Gemini -> dong tac co san cua meo 3D (du moi gia tri trong enum cua gemini-live.js)
const DONG_TAC = { vay: 'vay', cui: 'cui', gat_dau: 'gat', vui: 'vui', hat: 'vui', gian: 'lac', noi: 'gat',
                   ngac_nhien: 'vui', ban: 'chi', toi: 'gat', doc: 'nghi', nghi: 'nghi', viet: 'nghi',
                   an: 'an', uong: 'an', ngu: 'ngu', day: 'vui', cho: 'nghi', mua: 'chi', nhin: 'nghi', nghe: 'nghi',
                   boi: 'vui', rua: 'an' };
const THOI_LUONG = { vay: 2.6, gat: 1.8, vui: 2.4, lac: 1.8, chi: 2.5, an: 3.2, ngu: 3.6, cui: 2, nghi: 3 };
const CAM_XUC = { happy: 'vui', love: 'vui', angry: 'lac', speechless: 'lac', sad: 'gat', dizzy: 'lac', surprised: 'vui',
                  relaxed: 'gat' };
const BONG = { vay: '👋', vui: '✨', lac: '💢', gat: '', chi: '', an: '🐟', ngu: '💤', cui: '🙇', nghi: '❓' };
// So lop long toi da (11 = muc mac dinh cu: datSoLop cu cho 14 thi thuc ra ve 11 lop)
const LOP_TOI_DA = 11;

const S = {
  san: false, tat: false, x: null, dichX: null, chi: null, dongTac: null, nghiTu: 0,
  truoc: performance.now(), pha: 0, dangDi: 0, noiDen: 0, soLop: LOP_TOI_DA, tbKhung: 16, boQua: 0,
};
let renderer, scene, cam, meo = null, khung, laser, ctx2d, bong, laserBan = false;

// He dieu hanh bat "giam chuyen dong": meo khong di bo qua man hinh (dich thang toi cho), laser dung yen
const mqGiam = matchMedia('(prefers-reduced-motion: reduce)');
const giam = () => mqGiam.matches;
// Bang chon bai (phu kin, nen dac) dang mo thi khong ve meo
let pickerEl = null;
const pickerMo = () => {
  pickerEl = pickerEl || document.getElementById('lessonPicker');
  return !!pickerEl && !pickerEl.classList.contains('hidden');
};
// Bang phan dang mo o cot phai (man rong; man hep bang nam day, khong can tranh ngang)
const bangPhai = (W) => (W > 860 && document.body.classList.contains('co-bang') ? document.getElementById('bangPhan') : null);
const conHien = (el) => el.isConnected && el.getClientRects().length > 0;

function kichThuoc() {
  const W = innerWidth, H = innerHeight, hep = W < 700 || H < 500;
  // Theo ca ngang lan doc: dien thoai (ca nam ngang) nho han nhieu, man doc hep (iPad dung) khong to 320 px
  const cao = hep ? Math.min(130, Math.max(96, H * .15)) : Math.max(150, Math.min(H * .3, W * .22, 300));
  const chan = H - (document.querySelector('.deck-bottom')?.offsetHeight || 64);
  return { W, H, hep, cao, rong: cao * 1.3, khungCao: cao * 1.18, chan };
}
// Cho dung nghi: goc phai. Bang phan mo (cot phai) thi dung ben trai bang; the ron ben trai mo thi khong lan len the.
const viTriNha = () => {
  const { W, rong } = kichThuoc();
  let x = W - (hub ? hub.rongTruoc(api) : 0) - rong * .5;
  const bang = bangPhai(W);
  if (bang) x = Math.min(x, bang.offsetLeft - 8 - rong * .5);
  const the = W > 860 && document.body.classList.contains('co-the-trai') && document.querySelector('.spotlight:not(.hidden) .spot-dock');
  if (the && the.offsetWidth) x = Math.max(x, the.offsetLeft + the.offsetWidth + rong * .5);
  return Math.max(rong * .5, x);
};
// Chieu cao meo -> bien CSS --sensei-cao: .deck-scroll chua bay nhieu cho trong o cuoi, hang cuoi cuon len khoi meo
function datChoTrong() {
  const r = document.documentElement.style;
  if (S.san && !S.tat && khung && khung.isConnected) r.setProperty('--sensei-cao', Math.max(40, Math.round(kichThuoc().khungCao * .9)) + 'px');
  else r.removeProperty('--sensei-cao');
}

const dprLaser = () => Math.min(devicePixelRatio, 1.5);

function dungSanKhau() {
  // Thu tu lop: meo (3) tren noi dung bai (.deck-canvas 1) nhung DUOI moi lop phu — bang sua loi (5),
  // thanh tren / duoi (30), o chat (40), bang phan (44), anh phong to (50), thong bao (70), the ron (80),
  // chon bai (90). Laser + bong chu (31-32) chi can noi len tren thanh duoi (nut tab) va noi dung.
  khung = document.createElement('canvas');
  Object.assign(khung.style, { position: 'fixed', left: '0', top: '0', pointerEvents: 'none', zIndex: '3',
    transformOrigin: '50% 100%', willChange: 'transform' });
  document.body.appendChild(khung);
  laser = document.createElement('canvas');
  // Co CSS dat bang px trong doiCo (100vh tren dien thoai lon hon innerHeight -> anh bi keo gian, lech dich)
  Object.assign(laser.style, { position: 'fixed', left: '0', top: '0', pointerEvents: 'none', zIndex: '31' });
  document.body.appendChild(laser);
  ctx2d = laser.getContext('2d');
  bong = document.createElement('div');
  Object.assign(bong.style, { position: 'fixed', zIndex: '32', pointerEvents: 'none', fontSize: '28px',
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
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));     // phong to trang / doi man hinh
    renderer.setSize(rong, khungCao);
    cam.aspect = rong / khungCao; cam.updateProjectionMatrix();
    const d = dprLaser();
    laser.width = Math.round(W * d); laser.height = Math.round(H * d);
    laser.style.width = W + 'px'; laser.style.height = H + 'px';
    laserBan = false;                                              // doi width da xoa trang
    // Doi co cua so: ve lai goc (khong di bo cham rai qua ca man hinh)
    if (S.x === null || !S.chi) S.x = S.dichX = viTriNha();
    datChoTrong();
  };
  addEventListener('resize', doiCo);
  // Keo cua so sang man hinh khac ti le diem anh: co khi khong phat 'resize'
  const theoDpr = () => matchMedia(`(resolution: ${devicePixelRatio}dppx)`)
    .addEventListener?.('change', () => { doiCo(); theoDpr(); }, { once: true });
  theoDpr();
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
let dangChay = false;
function khungHinh() {
  // Tab bi an: dung han vong ve, hien lai thi visibilitychange goi tiep
  if (document.hidden) { dangChay = false; return; }
  dangChay = true;
  requestAnimationFrame(khungHinh); capNhat();
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !dangChay && S.san) { S.truoc = performance.now(); khungHinh(); }
});

function capNhat() {
  const nowMs = performance.now();
  const dtKhung = Math.min((nowMs - S.truoc) / 1000, .05);       // nhip rAF (de do may nhanh / cham)
  S.truoc = nowMs;
  // Bang chon bai che kin: khong ve (van giu nhip thoi gian o tren de luc dong bang khong bi giat)
  if (!S.san || S.tat || !meo || dtKhung <= 0 || pickerMo()) return;
  const now = nowMs / 1000;
  // Dung yen (khong di, khong chi tay, khong dong tac, khong noi): chi ve ~30 khung/giay cho nhe GPU.
  // Thoi gian cac khung bo qua cong vao dt cua khung ve tiep -> chuyen dong van dung toc do.
  const ranh = !S.chi && !S.dongTac && S.dangDi < .01 && Math.abs(S.dichX - S.x) <= 1 && now >= S.noiDen
    && (window.__audioEngine?.getOutputLevel?.() || 0) <= .02;
  S.boQua += dtKhung;
  if (ranh && S.boQua < .028) return;             // 60 Hz: ve cach 1 khung; 120 Hz: cach 3 (du lech nhip vai ms)
  const dt = Math.min(S.boQua, .05);
  S.boQua = 0;
  const { W, rong, khungCao, chan } = kichThuoc();

  // Muc dang chi bi go khoi trang (doi tab ve lai noi dung) hay bi an: tim lai theo id, khong thay thi thoi chi
  // (khong thi hop bao {0,0,0,0} -> tay va laser chi ve goc tren trai)
  if (S.chi && !conHien(S.chi.el)) {
    const moi = S.chi.id && timPhanTu(S.chi.id);
    if (moi && conHien(moi)) S.chi.el = moi; else S.chi.den = 0;
  }
  if (S.chi && now > S.chi.den) { S.chi = null; meo.dieuKhien.hanhDong('nghi'); }
  if (S.dongTac && now > S.dongTac.den) { S.dongTac = null; anBong(); if (!S.chi) meo.dieuKhien.hanhDong('nghi'); }
  if (!S.chi && !S.dongTac) {
    // Bang phan vua mo ma meo dang dung cho bang: tranh ngay, khong doi het 9 giay nghi
    const bang = bangPhai(W);
    if (now - S.nghiTu > 9 || (bang && S.dichX > bang.offsetLeft - rong * .5)) S.dichX = viTriNha();
  }

  // Truot ngang toi cho dung, buoc chan theo quang duong (giam chuyen dong: dich thang toi cho, khong buoc)
  const conLai = S.dichX - S.x;
  const buoc = giam() ? conLai : Math.sign(conLai) * Math.min(Math.abs(conLai), rong * 2.2 * dt);
  S.x += buoc;
  const dangDi = !giam() && Math.abs(conLai) > 1;
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
  meo.dieuKhien.mieng(muc);

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

  // Tu ha so lop long khi may ve cham (chi khi cua so dang duoc dung); moi buoc deu doi so lop that.
  // Dung yen (ve cach khung) thi nhip rAF khong con do duoc gi -> khong chinh, doi luc ve moi khung.
  if (!ranh) S.tbKhung += (dtKhung * 1000 - S.tbKhung) * .05;
  if (!ranh && document.hasFocus() && now > 3) {
    if (S.tbKhung > 26 && S.soLop > 6) { S.soLop = Math.max(6, S.soLop - 2); meo.datSoLop(S.soLop); S.tbKhung = 20; }
    else if (S.tbKhung < 13 && S.soLop < LOP_TOI_DA) { S.soLop = Math.min(LOP_TOI_DA, S.soLop + 2); meo.datSoLop(S.soLop); S.tbKhung = 20; }
  }
}

function veLaser(banTay, now) {
  const W = laser.width, H = laser.height, dp = dprLaser();
  // Khong chi gi: chi xoa MOT lan (xoa ca lop phu kin man hinh moi khung la bat trinh duyet ghep lai ca man)
  if (!banTay || !S.chi) { if (laserBan) { ctx2d.clearRect(0, 0, W, H); laserBan = false; } return; }
  ctx2d.clearRect(0, 0, W, H); laserBan = true;
  const tinh = giam();
  const a = viTriTrang(banTay);
  const r = S.chi.el.getBoundingClientRect();
  const bx = Math.max(r.left, Math.min(r.right, a.x)), by = Math.max(r.top, Math.min(r.bottom, a.y));
  ctx2d.save(); ctx2d.scale(dp, dp);
  ctx2d.setLineDash([6, 6]); ctx2d.lineDashOffset = tinh ? 0 : -now * 40;
  ctx2d.strokeStyle = 'rgba(231,76,60,.7)'; ctx2d.lineWidth = 2.5;
  ctx2d.beginPath(); ctx2d.moveTo(a.x, a.y); ctx2d.lineTo(bx, by); ctx2d.stroke();
  ctx2d.setLineDash([]); ctx2d.fillStyle = 'rgba(231,76,60,.9)';
  ctx2d.beginPath(); ctx2d.arc(bx, by, tinh ? 5 : 5 + Math.sin(now * 8) * 1.5, 0, Math.PI * 2); ctx2d.fill();
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
  // Bang phan mo ben phai: khong dung len bang (meo nam duoi bang, chi con thay laser)
  const bang = bangPhai(W);
  if (bang) dung = Math.min(dung, bang.offsetLeft - rong * .45);
  S.dichX = hep ? viTriNha() : Math.max(rong * .5, Math.min(dung, W - rong * .5));
  const now = performance.now() / 1000;
  // Giu id de tim lai muc khi trang ve lai cung noi dung
  S.chi = { el, id: typeof elHoacId === 'string' ? elHoacId : el.id, den: now + giay };
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
    g.style.zIndex = '32';            // tren thanh duoi (nut tab), duoi cac lop phu (css chung dat 86)
    document.body.appendChild(g);
    setTimeout(() => g.remove(), 700);
  }, 60);
  setTimeout(() => clearInterval(cho), 3000);
  return true;
}

function dienDongTac(ten, giay) {
  let dt = DONG_TAC[ten] || (ten === 'di' || ten === 'chay' ? 'di' : null);
  if (!S.san || !meo || !dt) return false;
  if (dt === 'di' && giam()) dt = 'gat';          // giam chuyen dong: khong di qua lai, gat dau tai cho
  const now = performance.now() / 1000;
  S.chi = null;
  if (dt === 'di') {
    // Di bo minh hoa: truot sang trai mot doan roi quay ve cho cu (cho cu von nam trong man hinh)
    const { rong } = kichThuoc();
    const goc = S.x;
    meo.dieuKhien.hanhDong('nghi'); anBong();     // thoi chi tay / vay truoc khi di
    S.dichX = Math.max(rong * .6, goc - rong * 1.2);
    const lan = S.dongTac = { den: now + (giay || 3) }; S.nghiTu = lan.den;
    // chiVao / dong tac / cam xuc khac chen vao (thay S.dongTac) thi bo buoc quay ve
    setTimeout(() => { if (S.dongTac === lan) S.dichX = goc; }, 1200);
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
  if (!S.san || !meo || !dt) return false;
  // Phan ung voi hoc vien quan trong hon chi tay: dang chi thi thoi chi (nhu dienDongTac), khong tra ve that bai
  S.chi = null;
  meo.dieuKhien.hanhDong(dt);
  S.dongTac = { den: performance.now() / 1000 + giay };
  hienBong(BONG[dt]);
  return true;
}

function khiRoiMuc(targetId, found, styleType) {
  if (!S.san) return;
  clearTimeout(S._henChi);
  // Muc 'warning' (bay / loi hay gap): lac dau nhac truoc roi moi chi vao
  let tre = 350;
  if (styleType === 'warning' && camXuc('angry', 1.2)) tre = 1300;
  S._henChi = setTimeout(() => chiVao(targetId), tre);
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
    datChoTrong();
  },
  _S: S, _capNhat: capNhat, _meo: () => meo, _ve: () => renderer,
};

// Khong co WebGL (tat / GPU bi chan / may ao), hong tep mo hinh: go cac lop ve, bao hub doi sang meo 2D.
// Chi ghi console, khong hien loi ra man hinh.
function boCuoc(e) {
  console.warn('[Meo3D] khong dung duoc meo 3D, doi sang meo 2D:', e);
  S.san = false;
  [khung, laser, bong].forEach((x) => x?.remove());
  datChoTrong();
  hub?.loi?.(api.kieu);
}

let loiDung = null;
try { dungSanKhau(); } catch (e) { loiDung = e; }
if (!document.getElementById('senseiGonCss')) {
  const st = document.createElement('style'); st.id = 'senseiGonCss';
  st.textContent = `.sensei-gon { position: fixed; z-index: 86; pointer-events: none; width: 16px; height: 16px;
    margin: -8px 0 0 -8px; border-radius: 50%; border: 3px solid #f43f5e; animation: senseiGon .6s ease-out forwards; }
    @keyframes senseiGon { from { transform: scale(.3); opacity: 1 } to { transform: scale(3.2); opacity: 0 } }`;
  document.head.appendChild(st);
}
if (loiDung) boCuoc(loiDung);
else napMeoNangCap(MO_HINH, scene, { anhPhu: ANH_PHU }).then(async (m) => {
  meo = m; datVao(m.doiTuong);
  // Dien thoai: bat dau voi it lop long hon cho nhe (van tu tang neu may du khoe)
  if (kichThuoc().hep) S.soLop = 8;
  m.datSoLop(S.soLop);
  // Dich shader truoc, song song (KHR_parallel_shader_compile) -> khung dau khong khoa trang
  try { await renderer.compileAsync(scene, cam); } catch (e) {}
  S.san = true;
  if (hub) hub.dangKy(api); else window.SenseiAvatar = api;
  S.x = S.dichX = viTriNha();
  datChoTrong();
  // Ve mot khung ngay (dua anh len GPU) luc con sau bang chon bai, de luc vao bai khong bi khung
  if (!S.tat && pickerMo()) renderer.render(scene, cam);
  khungHinh();
  // Vay chao khi hoc vien thay duoc (bang chon bai da dong)
  setTimeout(function chao() {
    if (pickerMo()) { setTimeout(chao, 400); return; }
    if (!S.tat) dienDongTac('vay');
  }, 900);
}).catch(boCuoc);
