/**
 * MEO SENSEI 3D — nua nguoi, dung tu mep duoi man hinh troi len.
 *
 * Than hinh la khoi 3D to mau kieu hoat hinh (toon) co vien. KHUON MAT la mot
 * tam tranh ve tay dan len mat cau cua dau (giong cach Animal Crossing lam mat):
 * nho vay ma co du bieu cam manga — mat lap lanh, mat tim, mat xoay oc, > <,
 * T_T, trang da, gan xanh 💢, mo hoi, soc den tren tran...
 *
 * Di chuyen: gan thi truot ngang, xa thi THUP xuong mep duoi roi TROI len ngay
 * canh muc can chi (nhu tro dap chuot). Moi thong so chay qua lo xo nen nay mem.
 *
 * Cung giao dien voi meo 2D, dang ky qua SenseiAvatarHub.
 */
import * as THREE from 'three';

const hub = window.SenseiAvatarHub;
const MAU = { cam: 0xF4A259, camDam: 0xD9822B, kem: 0xFFF3E0, hong: 0xF6A5B6, vien: 0x4A2A12,
              do: 0xC0392B, vang: 0xF1C40F, kinh: 0x5A3A1C, go: 0x8B5A2B };

const s = (t, f = 1) => Math.sin(t * Math.PI * 2 * f);
const kep = (v, a, b) => Math.max(a, Math.min(b, v));
const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------
// VAT LIEU
// ---------------------------------------------------------------------------
const bacMau = (() => {
  const t = new THREE.DataTexture(new Uint8Array([90, 175, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();
const toon = (mau) => new THREE.MeshToonMaterial({ color: mau, gradientMap: bacMau });
const matVien = new THREE.MeshBasicMaterial({ color: MAU.vien, side: THREE.BackSide });

/** Them vien den quanh khoi (ky thuat vo nguoc) */
function coVien(mesh, day = 0.045) {
  const v = new THREE.Mesh(mesh.geometry, matVien);
  v.scale.setScalar(1 + day);
  mesh.add(v);
  return mesh;
}
function khoi(geo, mau, vien = 0.045) {
  const m = new THREE.Mesh(geo, toon(mau));
  return vien ? coVien(m, vien) : m;
}

// ---------------------------------------------------------------------------
// KHUON MAT (ve tren canvas, dan len mieng cau phia truoc cua dau)
// ---------------------------------------------------------------------------
const PHI0 = Math.PI / 2 - 0.95, PHI_DAI = 1.9, TH0 = 0.5, TH_DAI = 1.6;
const FW = 640, FH = Math.round(FW * TH_DAI / PHI_DAI);
const matCanvas = document.createElement('canvas');
matCanvas.width = FW; matCanvas.height = FH;
const g = matCanvas.getContext('2d');
const texMat = new THREE.CanvasTexture(matCanvas);
texMat.colorSpace = THREE.SRGBColorSpace;
texMat.anisotropy = 4;

/** Diem (x, y) tren mat cau don vi (nhin tu truoc) -> toa do tren canvas */
function uv(x, y) {
  const z = Math.sqrt(Math.max(0.001, 1 - x * x - y * y));
  const theta = Math.acos(y), phi = Math.atan2(z, -x);
  return [(phi - PHI0) / PHI_DAI * FW, (theta - TH0) / TH_DAI * FH];
}
const PX = FW / PHI_DAI;   // so px ung voi 1 don vi ban kinh o giua mat

const MAT_TRAI = [-0.36, 0.06], MAT_PHAI = [0.36, 0.06];

function net(w, mau = '#2A211C') { g.lineWidth = w; g.strokeStyle = mau; g.lineCap = 'round'; g.lineJoin = 'round'; }

function veMat(f) {
  g.clearRect(0, 0, FW, FH);

  // Soc van tren tran
  net(10, '#D9822B');
  for (const x of [-0.12, 0, 0.12]) {
    const [a, b] = uv(x, 0.88), [c, d] = uv(x * 0.8, 0.7);
    g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke();
  }
  // Mom trang
  {
    const [cx, cy] = uv(0, -0.34);
    g.fillStyle = '#FFF3E0';
    g.beginPath(); g.ellipse(cx, cy, 0.4 * PX, 0.26 * PX, 0, 0, Math.PI * 2); g.fill();
  }
  // Ma hong
  if (f.ma > 0.02) {
    g.fillStyle = `rgba(246,165,182,${f.ma})`;
    for (const x of [-0.58, 0.58]) {
      const [cx, cy] = uv(x, -0.2);
      g.beginPath(); g.ellipse(cx, cy, 0.14 * PX, 0.075 * PX, 0, 0, Math.PI * 2); g.fill();
      if (f.ma > 0.7) {             // gach do mat kieu manga
        net(3, 'rgba(231,76,60,.55)');
        for (const k of [-1, 0, 1]) {
          g.beginPath(); g.moveTo(cx + k * 14 - 5, cy + 8); g.lineTo(cx + k * 14 + 5, cy - 8); g.stroke();
        }
      }
    }
  }
  // Mui
  {
    const [cx, cy] = uv(0, -0.2);
    g.fillStyle = '#F6A5B6'; net(3, '#6B3F1D');
    g.beginPath(); g.moveTo(cx - 13, cy - 7); g.lineTo(cx + 13, cy - 7); g.lineTo(cx, cy + 8); g.closePath();
    g.fill(); g.stroke();
  }
  // Rau
  net(4, 'rgba(107,63,29,.65)');
  for (const ben of [-1, 1]) for (const dy of [-0.02, -0.12]) {
    const [a, b] = uv(ben * 0.4, -0.3 + dy), [c, d] = uv(ben * 0.8, -0.26 + dy * 1.8);
    g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke();
  }

  veMatHai(f);
  veMay(f);
  veMieng(f);

  // Dau hieu manga
  if (f.gan) {                      // gan xanh 💢 goc tran
    const [cx, cy] = uv(0.55, 0.58);
    net(7, '#E53935');
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      g.beginPath();
      g.arc(cx + sx * 16, cy + sy * 16, 11, sy > 0 ? (sx > 0 ? Math.PI : -Math.PI / 2) : (sx > 0 ? Math.PI / 2 : 0),
            sy > 0 ? (sx > 0 ? Math.PI * 1.5 : 0) : (sx > 0 ? Math.PI : Math.PI / 2));
      g.stroke();
    }
  }
  if (f.moHoi) {                    // giot mo hoi
    const [cx, cy] = uv(0.68, 0.36);
    g.fillStyle = 'rgba(100,181,246,.95)'; net(3, '#1E88E5');
    g.beginPath(); g.moveTo(cx, cy - 26);
    g.quadraticCurveTo(cx + 18, cy + 4, cx, cy + 14); g.quadraticCurveTo(cx - 18, cy + 4, cx, cy - 26);
    g.fill(); g.stroke();
  }
  if (f.uAm) {                      // soc den tren tran (can loi)
    net(6, 'rgba(94,53,177,.6)');
    for (let i = -3; i <= 3; i++) {
      const [a, b] = uv(i * 0.09, 0.78), [c, d] = uv(i * 0.09, 0.42);
      g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke();
    }
  }
  texMat.needsUpdate = true;
}

function sao(cx, cy, r, mau) {
  g.fillStyle = mau;
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const rr = i % 2 ? r * 0.28 : r, a = i * Math.PI / 4 - Math.PI / 2;
    g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  g.closePath(); g.fill();
}

function veMatHai(f) {
  for (const [x, y] of [MAT_TRAI, MAT_PHAI]) {
    const trai = x < 0;
    const [cx0, cy0] = uv(x, y);
    const cx = cx0 + f.lx * 12, cy = cy0 + f.ly * 9;
    const rx = 0.115 * PX, ry = 0.15 * PX;
    switch (f.mat) {
      case 'cuoi':                   // ^ ^
        net(11); g.beginPath(); g.moveTo(cx0 - rx, cy0 + 8); g.quadraticCurveTo(cx0, cy0 - ry * 1.2, cx0 + rx, cy0 + 8); g.stroke();
        break;
      case 'nham':                   // ‿ ‿
        net(10); g.beginPath(); g.moveTo(cx0 - rx, cy0); g.quadraticCurveTo(cx0, cy0 + ry * 0.9, cx0 + rx, cy0); g.stroke();
        break;
      case 'gian':                   // > <
        net(11); g.beginPath();
        const h = trai ? 1 : -1;
        g.moveTo(cx0 - rx * h, cy0 - ry * 0.7); g.lineTo(cx0 + rx * h, cy0); g.lineTo(cx0 - rx * h, cy0 + ry * 0.7);
        g.stroke();
        break;
      case 'tim': {
        g.fillStyle = '#E53935';
        const k = 1.25 * rx;
        g.beginPath(); g.moveTo(cx0, cy0 + k * 0.9);
        g.bezierCurveTo(cx0 - k * 1.6, cy0 - k * 0.2, cx0 - k * 0.6, cy0 - k * 1.3, cx0, cy0 - k * 0.45);
        g.bezierCurveTo(cx0 + k * 0.6, cy0 - k * 1.3, cx0 + k * 1.6, cy0 - k * 0.2, cx0, cy0 + k * 0.9);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(cx0 - k * 0.45, cy0 - k * 0.45, k * 0.18, 0, 7); g.fill();
        break;
      }
      case 'xoay':                   // mat xoay oc (choang)
        net(6); g.beginPath();
        for (let a = 0; a < Math.PI * 6; a += 0.2) {
          const r = a / (Math.PI * 6) * rx * 1.1;
          g.lineTo(cx0 + Math.cos(a + f.t * 6 * (trai ? 1 : -1)) * r, cy0 + Math.sin(a + f.t * 6 * (trai ? 1 : -1)) * r);
        }
        g.stroke();
        break;
      case 'khoc':                   // T_T
        net(10); g.beginPath(); g.moveTo(cx0 - rx, cy0 - ry * 0.5); g.lineTo(cx0 + rx, cy0 - ry * 0.5); g.stroke();
        g.fillStyle = 'rgba(100,181,246,.85)';
        g.fillRect(cx0 - rx * 0.4, cy0 - ry * 0.45, rx * 0.8, ry * 1.6 + (f.t * 40 % 20));
        break;
      case 'trang':                  // trang da, khong con nguoi
        g.fillStyle = '#fff'; net(7);
        g.beginPath(); g.ellipse(cx0, cy0, rx * 1.05, ry * 0.95, 0, 0, 7); g.fill(); g.stroke();
        break;
      case 'tron':                   // tron xoe, dong tu nho
        g.fillStyle = '#fff'; net(6);
        g.beginPath(); g.ellipse(cx0, cy0, rx * 1.2, ry * 1.15, 0, 0, 7); g.fill(); g.stroke();
        g.fillStyle = '#2A211C'; g.beginPath(); g.arc(cx, cy, rx * 0.38, 0, 7); g.fill();
        break;
      case 'lap_lanh': {             // mat to long lanh
        g.fillStyle = '#2A211C';
        g.beginPath(); g.ellipse(cx, cy, rx * 1.2, ry * 1.2 * kep(f.mo, 0.05, 1), 0, 0, 7); g.fill();
        if (f.mo > 0.4) {
          sao(cx - rx * 0.35, cy - ry * 0.4, rx * 0.55, '#fff');
          g.fillStyle = '#fff'; g.beginPath(); g.arc(cx + rx * 0.45, cy + ry * 0.45, rx * 0.2, 0, 7); g.fill();
          sao(cx0 + (trai ? -1 : 1) * rx * 1.9, cy0 - ry * 1.3, rx * 0.35, '#FFD54F');
        }
        break;
      }
      default: {                     // thuong
        g.fillStyle = '#2A211C';
        const mo = kep(f.mo, 0.04, 1.3);
        g.beginPath(); g.ellipse(cx, cy, rx, ry * mo, 0, 0, 7); g.fill();
        if (mo > 0.35) {
          g.fillStyle = '#fff';
          g.beginPath(); g.arc(cx + rx * 0.3, cy - ry * 0.4 * mo, rx * 0.36, 0, 7); g.fill();
          g.beginPath(); g.arc(cx - rx * 0.3, cy + ry * 0.35 * mo, rx * 0.16, 0, 7); g.fill();
        }
      }
    }
  }
}

function veMay(f) {
  if (f.hienMay < 0.05) return;
  g.globalAlpha = kep(f.hienMay, 0, 1);
  net(10);
  for (const [x] of [MAT_TRAI, MAT_PHAI]) {
    const trai = x < 0;
    const [cx, cy] = uv(x, 0.36);
    const goc = f.may * 0.45 * (trai ? 1 : -1);
    const dx = Math.cos(goc) * 0.14 * PX, dy = Math.sin(goc) * 0.14 * PX;
    g.beginPath(); g.moveTo(cx - dx, cy - dy); g.lineTo(cx + dx, cy + dy); g.stroke();
  }
  g.globalAlpha = 1;
}

function veMieng(f) {
  const [cx, cy] = uv(0, -0.36);
  const w = 0.13 * PX;
  const mo = kep(f.moMieng, 0, 1);
  net(6);
  const moMieng = (rx, ry) => {
    g.fillStyle = '#8E2C2C';
    g.beginPath(); g.ellipse(cx, cy + ry * 0.4, rx, ry, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#F6A5B6';
    g.beginPath(); g.ellipse(cx, cy + ry * 0.95, rx * 0.6, ry * 0.4, 0, 0, 7); g.fill();
  };
  switch (f.mieng) {
    case 'cuoi_to':                  // D cuoi toe
      g.fillStyle = '#8E2C2C';
      g.beginPath(); g.moveTo(cx - w * 1.2, cy - 4); g.quadraticCurveTo(cx, cy + w * (1.6 + mo), cx + w * 1.2, cy - 4);
      g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#F6A5B6'; g.beginPath(); g.ellipse(cx, cy + w * 0.75, w * 0.55, w * 0.3, 0, 0, 7); g.fill();
      break;
    case 'meu':                      // ∩ meu
      g.beginPath(); g.moveTo(cx - w, cy + 10); g.quadraticCurveTo(cx, cy - 12, cx + w, cy + 10); g.stroke();
      if (mo > 0.1) moMieng(w * 0.5, w * 0.5 * mo);
      break;
    case 'o':
      moMieng(w * 0.45, w * (0.5 + 0.4 * mo));
      break;
    case 'meo': {                    // mieng luon song (hoang)
      g.beginPath();
      for (let i = 0; i <= 12; i++) g.lineTo(cx - w * 1.1 + i * w * 2.2 / 12, cy + (i % 2 ? -6 : 6));
      g.stroke();
      break;
    }
    case 'ngang':
      g.beginPath(); g.moveTo(cx - w * 0.8, cy); g.lineTo(cx + w * 0.8, cy); g.stroke();
      break;
    default:                         // ω — mo ra khi dang noi
      if (mo > 0.08) moMieng(w * (0.55 + 0.25 * mo), w * (0.2 + 0.7 * mo));
      else {
        g.beginPath(); g.moveTo(cx - w, cy - 4);
        g.quadraticCurveTo(cx - w / 2, cy + 14, cx, cy - 4); g.quadraticCurveTo(cx + w / 2, cy + 14, cx + w, cy - 4);
        g.stroke();
      }
  }
}

// ---------------------------------------------------------------------------
// DUNG HINH (don vi: 1 = ban kinh dau)
// ---------------------------------------------------------------------------
const H = {};
function dungMeo() {
  const goc = new THREE.Group();

  const than = khoi(new THREE.SphereGeometry(1, 32, 24), MAU.cam);
  than.scale.set(1.05, 1.0, 0.85);
  than.position.y = 0.15;
  goc.add(than);
  H.than = than;
  const bung = khoi(new THREE.SphereGeometry(0.62, 24, 16), MAU.kem, 0);
  bung.scale.set(1, 1.05, 0.5);
  bung.position.set(0, 0.22, 0.6);
  goc.add(bung);

  const co = khoi(new THREE.TorusGeometry(0.6, 0.075, 12, 40), MAU.do, 0.04);
  co.rotation.x = Math.PI / 2 - 0.15;
  co.position.set(0, 1.0, 0.05);
  goc.add(co);
  const chuong = khoi(new THREE.SphereGeometry(0.14, 16, 12), MAU.vang, 0.06);
  chuong.position.set(0, 0.86, 0.62);
  goc.add(chuong);

  // Duoi: chuoi hat, uon theo song moi khung hinh
  H.duoi = [];
  for (let i = 0; i < 7; i++) {
    const hat = khoi(new THREE.SphereGeometry(0.19 - i * 0.012, 16, 12), i > 4 ? MAU.camDam : MAU.cam, 0.05);
    goc.add(hat);
    H.duoi.push(hat);
  }

  // Dau
  const dau = new THREE.Group();
  dau.position.set(0, 1.72, 0);
  goc.add(dau);
  H.dau = dau;
  const hinhDau = new THREE.Group();
  hinhDau.scale.set(1.1, 0.95, 0.95);
  dau.add(hinhDau);
  hinhDau.add(khoi(new THREE.SphereGeometry(1, 40, 30), MAU.cam, 0.035));
  const mat = new THREE.Mesh(
    new THREE.SphereGeometry(1.012, 48, 36, PHI0, PHI_DAI, TH0, TH_DAI),
    new THREE.MeshBasicMaterial({ map: texMat, transparent: true, depthWrite: false }));
  hinhDau.add(mat);

  // Tai
  H.tai = [];
  for (const ben of [-1, 1]) {
    const tru = new THREE.Group();
    tru.position.set(ben * 0.58, 0.7, -0.05);
    tru.rotation.z = -ben * 0.38;
    const ngoai = khoi(new THREE.ConeGeometry(0.36, 0.72, 20), MAU.cam, 0.06);
    ngoai.position.y = 0.3;
    const trong = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.46, 20), toon(MAU.hong));
    trong.position.set(0, 0.26, 0.13);
    tru.add(ngoai, trong);
    hinhDau.add(tru);
    H.tai.push(tru);
  }

  // Kinh tron
  const vl = toon(MAU.kinh);
  const diemMat = [];
  for (const [x, y] of [MAT_TRAI, MAT_PHAI]) {
    const p = new THREE.Vector3(x, y, Math.sqrt(1 - x * x - y * y)).multiplyScalar(1.05);
    const vong = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.032, 10, 32), vl);
    vong.position.copy(p);
    vong.lookAt(p.clone().multiplyScalar(2));
    hinhDau.add(vong);
    diemMat.push(p);
  }
  const cau = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, diemMat[1].x - diemMat[0].x - 0.38, 8), vl);
  cau.rotation.z = Math.PI / 2;
  cau.position.set(0, diemMat[0].y + 0.04, diemMat[0].z + 0.02);
  hinhDau.add(cau);

  // Tay: vai -> bap tay -> khuyu -> cang tay -> ban chan tron
  H.tay = {};
  for (const [ten, ben] of [['Trai', -1], ['Phai', 1]]) {
    const vai = new THREE.Group();
    vai.position.set(ben * 0.92, 0.72, 0.18);
    vai.rotation.order = 'XYZ';
    const bap = khoi(new THREE.CapsuleGeometry(0.2, 0.42, 6, 14), MAU.cam, 0.06);
    bap.position.y = -0.36;
    const khuyu = new THREE.Group();
    khuyu.position.y = -0.74;
    const cang = khoi(new THREE.CapsuleGeometry(0.19, 0.34, 6, 14), MAU.cam, 0.06);
    cang.position.y = -0.3;
    const ban = new THREE.Group();
    ban.position.y = -0.66;
    const nem = khoi(new THREE.SphereGeometry(0.26, 18, 14), MAU.kem, 0.06);
    ban.add(nem);
    // Thuoc chi bang, chi hien khi dang chi
    const thuoc = new THREE.Group();
    const que = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.5, 8), toon(MAU.go));
    que.position.y = -0.8;
    const dauThuoc = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), toon(0xE74C3C));
    dauThuoc.position.y = -1.56;
    thuoc.add(que, dauThuoc);
    thuoc.visible = false;
    ban.add(thuoc);
    // Do vat cam tay (emoji)
    const doVat = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false }));
    doVat.scale.setScalar(0.85);
    doVat.position.set(0, -0.15, 0.3);
    doVat.visible = false;
    doVat.renderOrder = 5;
    ban.add(doVat);
    khuyu.add(cang, ban);
    vai.add(bap, khuyu);
    goc.add(vai);
    H.tay[ten] = { vai, khuyu, ban, thuoc, dauThuoc, doVat, chu: '' };
  }
  return goc;
}

const anhEmoji = {};
function texEmoji(chu) {
  if (anhEmoji[chu]) return anhEmoji[chu];
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.font = '100px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(chu, 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return (anhEmoji[chu] = t);
}

// ---------------------------------------------------------------------------
// LO XO
// ---------------------------------------------------------------------------
// Tay dieu khien bang DIEM DAT BAN CHAN (don vi = ban kinh dau, goc toa do o day
// than; x sang phai man hinh, y len, z huong ve hoc vien). Vai + khuyu do IK tu tinh.
// Moc tham chieu: mieng (0, 1.38, 1.15)  cam (0.1, 1.1, 1.1)  ma (±0.72, 1.5, 0.95)
//                 tran (±0.4, 2.05, 1.0)  tai (±0.95, 2.2, 0.4)  nguc (0.3, 0.75, 1.05)
//                 hong (±1.1, 0.15, 0.1)  tren dau (±0.8, 2.8, 0.3)
const MAC_DINH = {
  troi: 0, x: 0, nhun: 0, nghieng: 0, bep: 1, xu: 0,
  dauX: 0, dauY: 0, dauZ: 0,
  Trai_x: -0.72, Trai_y: 0.08, Trai_z: 0.8, Phai_x: 0.72, Phai_y: 0.08, Phai_z: 0.8,
  taiTrai: 0, taiPhai: 0,
  mo: 1, lx: 0, ly: 0, moMieng: 0, ma: 0.35, may: 0, hienMay: 0,
};
const LO_XO = {
  troi: [140, 13], nhun: [300, 20], nghieng: [90, 10], bep: [260, 14], xu: [200, 14],
  dauX: [90, 11], dauY: [90, 11], dauZ: [90, 11],
  Trai_x: [110, 12], Trai_y: [110, 12], Trai_z: [110, 12], Phai_x: [110, 12], Phai_y: [110, 12], Phai_z: [110, 12],
  taiTrai: [260, 12], taiPhai: [260, 12],
  mo: [800, 45], lx: [200, 20], ly: [200, 20], moMieng: [600, 32], ma: [120, 16],
  may: [200, 20], hienMay: [200, 20],
};
const P = {}, VT = {};
for (const k in MAC_DINH) { P[k] = MAC_DINH[k]; VT[k] = 0; }
function buocLoXo(d, dt) {
  for (const k in MAC_DINH) {
    const dich = d[k] ?? MAC_DINH[k];
    const [c, gg] = LO_XO[k] || [200, 20];
    VT[k] += ((dich - P[k]) * c - VT[k] * gg) * dt;
    P[k] += VT[k] * dt;
  }
}

// ---------------------------------------------------------------------------
// DONG TAC
// ---------------------------------------------------------------------------
const phai = (x, y, z) => ({ Phai_x: x, Phai_y: y, Phai_z: z });
const trai = (x, y, z) => ({ Trai_x: x, Trai_y: y, Trai_z: z });
const hai = (x, y, z) => ({ ...trai(-x, y, z), ...phai(x, y, z) });   // doi xung

const DONG_TAC = {
  an: (t) => {
    const k = (s(t, 1.4) + 1) / 2;                 // 1 = dua ca len mieng
    return { ...phai(0.25 + 0.3 * (1 - k), 0.75 + 0.6 * k, 1.2), ...trai(-0.2 - 0.3 * (1 - k), 0.7 + 0.6 * k, 1.2),
             mat: 'cuoi', mieng: 'o', moMieng: k * 0.9, ma: 0.9, dauX: 0.08 * k, doVat: ['Phai', '🐟'] };
  },
  uong: (t) => ({ ...phai(0.12, 1.35, 1.2), dauX: -0.3 * Math.min(1, t * 2), mat: 'nham', doVat: ['Phai', '🥛'] }),
  ngu: (t) => ({ ...phai(0.8, 1.45, 0.85), ...trai(0.3, 1.3, 1.05), dauZ: -0.32 - 0.03 * s(t, 0.3),
                 dauX: 0.1, bep: 1 + 0.03 * s(t, 0.3), mat: 'nham', mieng: 'w', ma: 0.6, bong: '💤' }),
  day: (t) => ({ ...hai(0.8, 2.8, 0.3), troi: t < 0.6 ? 0.35 : 0,
                 mat: t < 1.4 ? 'nham' : 'lap_lanh', mieng: t < 1.4 ? 'o' : 'cuoi_to', moMieng: 1, bong: '☀️' }),
  vay: (t) => ({ ...phai(1.55 + 0.3 * s(t, 1.7), 2.15, 0.45), mat: 'cuoi', mieng: 'cuoi_to', ma: 0.9,
                 dauZ: -0.1, bong: '👋' }),
  cui: (t) => {
    const k = t < 0.4 ? t / 0.4 : t < 1.5 ? 1 : Math.max(0, 1 - (t - 1.5) / 0.4);
    return { dauX: 0.55 * k, bep: 1 - 0.06 * k, mat: 'nham', ...hai(0.3, 0.35, 1.0), bong: '🙇' };
  },
  toi: () => ({ ...phai(0.2, 0.8, 1.1), mat: 'cuoi', mieng: 'cuoi_to', dauZ: 0.08 }),
  ban: (t) => ({ ...phai(0.5, 1.2, 2.2), hienMay: 0.7, may: 0.4, dauY: 0.05 * s(t, 0.5) }),
  nghi: (t) => ({ ...phai(0.12, 1.08, 1.12), ...trai(-0.25, 0.55, 1.05), dauZ: 0.2, lx: 0.7, ly: -1,
                  hienMay: 1, may: -0.6, mieng: 'ngang', bong: '❓' }),
  viet: (t) => ({ ...trai(-0.35, 0.3, 1.2), ...phai(0.25 + 0.12 * s(t, 2.5), 0.38 + 0.05 * s(t, 5), 1.25),
                  dauX: 0.25, ly: 1, doVat: ['Phai', '✏️'] }),
  doc: (t) => ({ ...hai(0.35, 0.7, 1.25), dauX: 0.28, ly: 1, lx: 0.4 * s(t, 0.4), doVat: ['Trai', '📖'] }),
  nhin: (t) => ({ ...phai(0.45, 2.05, 1.05), dauY: 0.35 * s(t, 0.35), lx: s(t, 0.35), mat: 'tron', bong: '👀' }),
  nghe: (t) => ({ ...trai(-1.0, 2.15, 0.45), taiTrai: 0.3, dauZ: 0.22, mat: 'nham', bong: '👂' }),
  noi: (t) => ({ ...trai(-0.95 - 0.2 * s(t, 0.8), 0.55 + 0.25 * s(t, 0.8), 1.1),
                 ...phai(0.95 + 0.2 * s(t + 0.4, 0.8), 0.55 + 0.25 * s(t + 0.4, 0.8), 1.1),
                 moMieng: (s(t, 3.5) + 1) * 0.4, dauY: 0.1 * s(t, 0.6), bong: '💬' }),
  mua: (t) => ({ ...phai(0.45, 0.75, 1.9 + 0.1 * s(t, 0.7)), mat: 'cuoi', doVat: ['Phai', '💴'] }),
  boi: (t) => ({ ...trai(-1.0, 0.9 + 0.6 * s(t, 0.9), 0.8 + 0.6 * Math.cos(t * 5.65)),
                 ...phai(1.0, 0.9 + 0.6 * s(t + 0.5, 0.9), 0.8 - 0.6 * Math.cos(t * 5.65)),
                 nghieng: 0.1 * s(t, 0.9), mat: 'cuoi', bong: '🏊' }),
  cho: (t) => ({ ...trai(-0.15, 0.75, 1.2), ...phai(0.35, 0.72 + 0.06 * Math.max(0, s(t, 2)), 1.25),
                 dauX: 0.25, lx: -0.6, ly: 1, hienMay: 1, may: 0.6, mieng: 'ngang', bong: '⌚' }),
  hat: (t) => ({ ...phai(0.25, 0.8, 1.1), ...trai(-1.6, 1.9, 0.35), dauZ: 0.15 * s(t, 0.6),
                 nghieng: 0.06 * s(t, 0.6), mat: 'nham', mieng: 'o', moMieng: 0.4 + 0.3 * s(t, 2), ma: 0.9, bong: '🎵' }),
  rua: (t) => ({ ...trai(-0.15 - 0.1 * s(t, 2.5), 0.55, 1.2), ...phai(0.15 - 0.1 * s(t, 2.5), 0.6, 1.2),
                 dauX: 0.25, ly: 1, bong: '🫧' }),
  vui: (t) => ({ ...hai(1.1, 2.7, 0.4), troi: Math.max(0, s(t, 1.2)) * 0.5,
                 mat: 'lap_lanh', mieng: 'cuoi_to', ma: 1, bong: '✨' }),
  gian: (t) => ({ ...hai(1.1, 0.12, 0.15), mat: 'gian', mieng: 'meu', gan: 1,
                  hienMay: 1, may: 1, xu: 1, taiTrai: 0.5, taiPhai: -0.5, dauY: 0.18 * s(t, 1.4), ma: 0 }),
  ngac_nhien: (t) => ({ ...hai(0.72, 1.5, 1.0), troi: t < 0.3 ? 0.4 : 0,
                        mat: 'tron', mieng: 'o', moMieng: 0.8, xu: 0.6, taiTrai: -0.15, taiPhai: 0.15, bong: '❗' }),
  gat_dau: (t) => ({ dauX: 0.22 * Math.max(0, s(t, 1.4)), mat: 'cuoi' }),
};

// IK hai doan: dat ban chan toi dich, khuyu tay chiu ra ngoai-xuong-sau cho tu nhien
const DAI_BAP = 0.74, DAI_CANG = 0.66;
const _S0 = new THREE.Vector3(), _T = new THREE.Vector3(), _u = new THREE.Vector3(), _f = new THREE.Vector3(),
      _cuc = new THREE.Vector3(), _E = new THREE.Vector3(), _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
const XUONG = new THREE.Vector3(0, -1, 0);
function datTay(tay, ben, x, y, z) {
  _S0.copy(tay.vai.position);
  _T.set(x, y, z).sub(_S0);
  let dai = _T.length();
  const toiDa = DAI_BAP + DAI_CANG - 0.001;
  dai = kep(dai, 0.15, toiDa);
  _T.normalize();
  const a1 = Math.acos(kep((DAI_BAP * DAI_BAP + dai * dai - DAI_CANG * DAI_CANG) / (2 * DAI_BAP * dai), -1, 1));
  _cuc.set(ben, -1, -0.5).normalize();
  _cuc.addScaledVector(_T, -_cuc.dot(_T));
  if (_cuc.lengthSq() < 1e-4) _cuc.set(ben, 0, 0);
  _cuc.normalize();
  _u.copy(_T).multiplyScalar(Math.cos(a1)).addScaledVector(_cuc, Math.sin(a1)).normalize();
  _E.copy(_u).multiplyScalar(DAI_BAP);
  _f.copy(_T).multiplyScalar(dai).sub(_E).normalize();
  _q1.setFromUnitVectors(XUONG, _u);
  tay.vai.quaternion.copy(_q1);
  _q2.setFromUnitVectors(XUONG, _f);
  tay.khuyu.quaternion.copy(_q1.invert().multiply(_q2));
}
const DI_BO = { di: 1, chay: 2.2 };
const THOI_LUONG = { cui: 2.1, day: 2.4, gat_dau: 1.6, ngac_nhien: 1.8, vui: 2.4 };

const CAM_XUC = {
  happy:      { mat: 'lap_lanh', mieng: 'cuoi_to', ma: 1 },
  angry:      { mat: 'gian', mieng: 'meu', gan: 1, hienMay: 1, may: 1, xu: 1, taiTrai: 0.5, taiPhai: -0.5, ma: 0 },
  sad:        { mat: 'khoc', mieng: 'meu', taiTrai: 0.6, taiPhai: -0.6, dauZ: 0.15, ma: 0.1 },
  surprised:  { mat: 'tron', mieng: 'o', moMieng: 0.7, taiTrai: -0.15, taiPhai: 0.15 },
  relaxed:    { mat: 'nham', ma: 0.8, dauZ: 0.1 },
  love:       { mat: 'tim', mieng: 'cuoi_to', ma: 1 },
  dizzy:      { mat: 'xoay', mieng: 'meo', moHoi: 1, dauZ: 0.2 },
  speechless: { mat: 'trang', mieng: 'ngang', uAm: 1, moHoi: 1 },
};

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

// ---------------------------------------------------------------------------
// SAN KHAU
// ---------------------------------------------------------------------------
const S = {
  san: false, tat: false, x: null, dichX: null, nhip: 0, dangDi: 0,
  lan: null,            // 'xuong' | 'len' khi dang thup xuong / troi len
  chi: null, bam: 0, dongTac: null, camXuc: null, nghiTu: 0,
  chop: 0, giatTai: 0, liec: { x: 0, y: 0, den: 0 }, mieng: 0, truoc: performance.now(), khoaMat: '',
};
let renderer, scene, camera, meo, khung, laser, ctx2d, bong;

function kichThuoc() {
  const W = innerWidth, Hh = innerHeight;
  const hep = W < 700;
  // window.SENSEI_3D_CO: phong to / thu nho meo (mac dinh 1)
  const R = (hep ? 26 : kep(Hh * 0.068, 32, 54)) * (window.SENSEI_3D_CO || 1);
  const chan = Hh - (document.querySelector('.deck-bottom')?.offsetHeight || 64);
  return { W, H: Hh, R, chan, hep, rong: R * 3.2 };
}
const thuTu = () => (hub ? hub.thuTu(api) : 0);
const viTriNha = () => {
  const { W, rong } = kichThuoc();
  return W - (hub ? hub.rongTruoc(api) : 0) - rong * 0.6;
};

function dungSanKhau() {
  khung = document.createElement('canvas');
  Object.assign(khung.style, { position: 'fixed', left: '0', top: '0', pointerEvents: 'none', zIndex: '85' });
  document.body.appendChild(khung);
  laser = document.createElement('canvas');
  Object.assign(laser.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh',
    pointerEvents: 'none', zIndex: '84' });
  document.body.appendChild(laser);
  ctx2d = laser.getContext('2d');
  bong = document.createElement('div');
  Object.assign(bong.style, { position: 'fixed', zIndex: '86', pointerEvents: 'none', fontSize: '28px',
    transition: 'opacity .25s, transform .25s', opacity: '0', transform: 'translate(-50%,-100%) scale(.6)' });
  document.body.appendChild(bong);

  renderer = new THREE.WebGLRenderer({ canvas: khung, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(0, 100, 0, -100, -2000, 2000);
  camera.position.z = 1000;
  const den = new THREE.DirectionalLight(0xffffff, 2.4);
  den.position.set(-0.6, 1, 1.2);
  scene.add(den, new THREE.AmbientLight(0xffffff, 1.1));
  meo = dungMeo();
  scene.add(meo);

  const doiCo = () => {
    const { W, H: Hh, chan } = kichThuoc();
    // Khung ve chi cao toi mep thanh tab: phan than duoi tu nhien bi cat mat -> "nua nguoi"
    renderer.setSize(W, chan);
    camera.left = 0; camera.right = W; camera.top = 0; camera.bottom = -chan;
    camera.updateProjectionMatrix();
    laser.width = W * devicePixelRatio; laser.height = Hh * devicePixelRatio;
    if (S.x === null) S.x = S.dichX = viTriNha();
    S.x = Math.min(S.x, W - 20);
  };
  addEventListener('resize', doiCo);
  doiCo();
}

// Toa do the gioi <-> man hinh (camera truc giao: x = px, y = -px)
const _v = new THREE.Vector3();
function manHinhCua(obj) {
  obj.getWorldPosition(_v);
  return { x: _v.x, y: -_v.y };
}

// ---------------------------------------------------------------------------
// MOI KHUNG HINH
// ---------------------------------------------------------------------------
function khungHinh() { requestAnimationFrame(khungHinh); capNhat(); }

function capNhat() {
  const nowMs = performance.now();
  const dt = Math.min((nowMs - S.truoc) / 1000, 0.05);
  S.truoc = nowMs;
  if (!S.san || S.tat || dt <= 0) return;
  const now = nowMs / 1000;
  const { W, R, chan, rong } = kichThuoc();

  if (S.dongTac && now > S.dongTac.den) { S.dongTac = null; anBong(); }
  if (S.chi && now > S.chi.den) S.chi = null;
  if (S.camXuc && now > S.camXuc.den) S.camXuc = null;

  // --- di chuyen: gan thi truot, xa thi thup xuong roi troi len cho moi
  const buocDi = S.dongTac && DI_BO[S.dongTac.ten];
  if (buocDi) {
    const g0 = S.dongTac.goc ?? (S.dongTac.goc = S.x);
    S.dichX = kep(g0 + Math.sin((now - S.dongTac.batDau) * 1.1 * buocDi) * rong * 0.9, rong * 0.5, W - rong * 0.5);
  } else if (!S.chi && !S.dongTac && now - S.nghiTu > 9) {
    S.dichX = viTriNha();
  }
  const conLai = S.dichX - S.x;
  if (!buocDi && !S.lan && Math.abs(conLai) > rong * 1.3) S.lan = 'xuong';
  if (S.lan === 'xuong' && P.troi < -3.6) { S.x = S.dichX; S.lan = 'len'; }
  if (S.lan === 'len' && P.troi > -0.3) S.lan = null;
  if (!S.lan) {
    const tocDo = (buocDi ? 1.5 * buocDi : 3) * rong;
    S.x += Math.sign(conLai) * Math.min(Math.abs(conLai), tocDo * dt);
  }
  const dangDi = !S.lan && Math.abs(conLai) > 1;
  S.dangDi += ((dangDi ? 1 : 0) - S.dangDi) * Math.min(1, dt * 10);
  if (dangDi) S.nhip += dt * (buocDi ? 9 * Math.sqrt(buocDi) : 11);

  // --- dich cho lo xo
  const d = { ...MAC_DINH };
  d.Trai_y = 0.08 + 0.04 * s(now, 0.3); d.Phai_y = 0.08 + 0.04 * s(now + 0.2, 0.3);
  d.dauZ = 0.05 * s(now, 0.13) + 0.03 * s(now, 0.31);
  d.dauY = 0.08 * s(now, 0.09);
  if (now > S.liec.den) S.liec = { x: (Math.random() - 0.5) * 1.4, y: (Math.random() - 0.5) * 0.7, den: now + 1.5 + Math.random() * 3 };
  d.lx = S.liec.x; d.ly = S.liec.y;
  if (now > S.chop) S.chop = now + 2 + Math.random() * 3.5;
  const dangChop = S.chop - now < 0.12;
  if (now > S.giatTai) S.giatTai = now + 3 + Math.random() * 5;
  const giat = S.giatTai - now < 0.12;

  if (S.lan === 'xuong') d.troi = -4.2;
  if (S.dangDi > 0.05) {
    d.nhun = -Math.abs(Math.sin(S.nhip)) * 0.12 * S.dangDi;
    d.nghieng = -(0.08 * Math.sin(S.nhip) + Math.sign(conLai) * 0.08) * S.dangDi;
    d.Trai_z = 0.8 + 0.35 * Math.sin(S.nhip) * S.dangDi;
    d.Phai_z = 0.8 - 0.35 * Math.sin(S.nhip) * S.dangDi;
    d.Trai_y = 0.1 + 0.15 * Math.sin(S.nhip) * S.dangDi;
    d.Phai_y = 0.1 - 0.15 * Math.sin(S.nhip) * S.dangDi;
  }

  let doVat = null, bieu = { mat: 'thuong', mieng: 'w', gan: 0, moHoi: 0, uAm: 0 };
  const ap = (o) => {
    if (!o) return;
    for (const k in o) {
      if (k === 'doVat') doVat = o.doVat;
      else if (k in bieu) bieu[k] = o[k];
      else if (k !== 'bong') d[k] = o[k];
    }
  };
  if (S.dongTac && DONG_TAC[S.dongTac.ten]) ap(DONG_TAC[S.dongTac.ten](now - S.dongTac.batDau));
  if (S.camXuc) ap(CAM_XUC[S.camXuc.ten]);
  if (giat) d[S.giatTai % 2 > 1 ? 'taiTrai' : 'taiPhai'] += 0.35;
  if (dangChop && bieu.mat === 'thuong') d.mo = 0.05;

  // --- chi tay
  let benChi = null;
  if (S.chi && !S.lan) {
    const r = S.chi.el.getBoundingClientRect();
    const tx = r.left + r.width / 2, ty = r.top + r.height / 2;
    benChi = tx < S.x ? 'Trai' : 'Phai';
    // Duoi tay thang ve phia muc (dich dat ngoai tam voi -> IK tu duoi thang)
    const vai = manHinhCua(H.tay[benChi].vai);
    const huong = new THREE.Vector3(tx - vai.x, -(ty - vai.y), 0).normalize();
    huong.applyAxisAngle(new THREE.Vector3(0, 0, 1), -P.nghieng);
    const dam = Math.max(0, 1 - (now - S.bam) / 0.3);
    const vp = H.tay[benChi].vai.position;
    d[benChi + '_x'] = vp.x + huong.x * 1.7;
    d[benChi + '_y'] = vp.y + huong.y * 1.7;
    d[benChi + '_z'] = vp.z + 0.35 + dam * 0.8;
    const dx = tx - S.x, dy = ty - (chan - R * 3.2);
    const dai = Math.hypot(dx, dy) || 1;
    d.lx = dx / dai; d.ly = dy / dai;
    d.dauY = kep(dx / dai * 0.35, -0.4, 0.4);
    d.dauX = kep(dy / dai * 0.25, -0.3, 0.3);
    if (!S.dongTac && !S.camXuc) { d.hienMay = 0.5; d.may = 0.25; }
  }

  // --- mieng theo giong
  const muc = window.__audioEngine?.getOutputLevel?.() || 0;
  S.mieng += (Math.min(1, muc * 9) - S.mieng) * Math.min(1, dt * 25);
  d.moMieng = Math.max(d.moMieng, S.mieng);

  buocLoXo(d, dt);

  // --- dua len hinh
  meo.scale.setScalar(R * (1 + 0.04 * P.xu));
  meo.position.set(S.x, -chan + R * (0.75 + P.troi + P.nhun), 0);
  meo.rotation.z = P.nghieng;
  const tho = 1 + 0.02 * s(now, 0.4);
  H.than.scale.set(1.05 / Math.sqrt(P.bep * tho), P.bep * tho, 0.85);
  H.dau.rotation.set(P.dauX, P.dauY, P.dauZ);
  H.tai[0].rotation.z = 0.38 + P.taiTrai;
  H.tai[1].rotation.z = -0.38 + P.taiPhai;
  for (const ten of ['Trai', 'Phai']) {
    const t = H.tay[ten];
    datTay(t, ten === 'Trai' ? -1 : 1, P[ten + '_x'], P[ten + '_y'], P[ten + '_z']);
    t.thuoc.visible = benChi === ten;
    const chu = doVat && doVat[0] === ten ? doVat[1] : '';
    if (chu !== t.chu) {
      t.chu = chu;
      t.doVat.visible = !!chu;
      if (chu) { t.doVat.material.map = texEmoji(chu); t.doVat.material.needsUpdate = true; }
    }
  }
  // Duoi thò lên sau lung ben phai, uon luon
  const lac = 0.35 * s(now, bieu.mat === 'lap_lanh' || bieu.mieng === 'cuoi_to' ? 1.4 : 0.45);
  H.duoi.forEach((hat, i) => {
    const k = i / (H.duoi.length - 1);
    const a = 0.2 + k * 1.3 + lac * k;
    hat.position.set(1.0 + 0.55 * k + lac * k * k * 0.9 + Math.sin(a) * 0.12, 0.1 + 1.55 * k, -0.6);
    hat.scale.setScalar(1 + 0.6 * P.xu);
  });

  // Mat: chi ve lai khi co gi doi (lam tron de do ve thua)
  const f = { ...bieu, mo: Math.round(kep(P.mo, 0, 1.3) * 12) / 12, lx: Math.round(P.lx * 6) / 6,
              ly: Math.round(P.ly * 6) / 6, moMieng: Math.round(kep(P.moMieng, 0, 1) * 10) / 10,
              ma: Math.round(kep(P.ma, 0, 1) * 10) / 10, may: Math.round(P.may * 8) / 8,
              hienMay: Math.round(kep(P.hienMay, 0, 1) * 5) / 5,
              t: ['xoay', 'khoc'].includes(bieu.mat) ? Math.round(now * 20) / 20 : 0 };
  const khoa = JSON.stringify(f);
  if (khoa !== S.khoaMat) { S.khoaMat = khoa; veMat(f); }

  renderer.render(scene, camera);
  veLaser(benChi, now);
  veBong(R, chan);
}

function veLaser(benChi, now) {
  const W = laser.width, Hh = laser.height, dp = devicePixelRatio;
  ctx2d.clearRect(0, 0, W, Hh);
  if (!benChi || !S.chi) return;
  const a = manHinhCua(H.tay[benChi].dauThuoc);
  const r = S.chi.el.getBoundingClientRect();
  const bx = kep(a.x, r.left, r.right), by = kep(a.y, r.top, r.bottom);
  ctx2d.save(); ctx2d.scale(dp, dp);
  ctx2d.setLineDash([6, 6]); ctx2d.lineDashOffset = -now * 40;
  ctx2d.strokeStyle = 'rgba(231,76,60,.7)'; ctx2d.lineWidth = 2.5;
  ctx2d.beginPath(); ctx2d.moveTo(a.x, a.y); ctx2d.lineTo(bx, by); ctx2d.stroke();
  ctx2d.setLineDash([]); ctx2d.fillStyle = 'rgba(231,76,60,.9)';
  ctx2d.beginPath(); ctx2d.arc(bx, by, 5 + Math.sin(now * 8) * 1.5, 0, Math.PI * 2); ctx2d.fill();
  ctx2d.restore();
}

function veBong(R, chan) {
  if (bong.style.opacity === '0') return;
  const p = manHinhCua(H.dau);
  bong.style.left = (p.x + R * 1.1) + 'px';
  bong.style.top = (p.y - R * 1.1) + 'px';
}
function hienBong(chu) { bong.textContent = chu; bong.style.opacity = '1'; bong.style.transform = 'translate(-50%,-100%) scale(1)'; }
function anBong() { bong.style.opacity = '0'; bong.style.transform = 'translate(-50%,-100%) scale(.6)'; }

// ---------------------------------------------------------------------------
// LENH
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
  // Nhan vat thu 2 trong hang uu tien dung BEN TRAI muc, de hai con khong de len nhau
  const benTrai = thuTu() === 1;
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
  if (S.dongTac && !DI_BO[S.dongTac.ten]) { S.dongTac = null; anBong(); }
  return true;
}

function bamVao(elHoacId) {
  const el = timPhanTu(elHoacId);
  if (!chiVao(el, 1.8)) return false;
  const cho = setInterval(() => {
    if (S.lan || Math.abs(S.dichX - S.x) > 2) return;
    clearInterval(cho);
    S.bam = performance.now() / 1000 + 0.1;
    const r = el.getBoundingClientRect();
    const gg = document.createElement('div');
    gg.className = 'sensei-gon';
    gg.style.left = (r.left + r.width / 2) + 'px';
    gg.style.top = (r.top + r.height / 2) + 'px';
    document.body.appendChild(gg);
    setTimeout(() => gg.remove(), 700);
  }, 60);
  setTimeout(() => clearInterval(cho), 3000);
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
    if (!S.chi || S.chi.el !== el) { if (Date.now() - batDau > 1000) clearInterval(hen); return; }
    if (!toiLuc && !S.lan && Math.abs(S.dichX - S.x) < 2) toiLuc = Date.now();
    if (toiLuc && Date.now() - toiLuc > 1100) { clearInterval(hen); dienDongTac(ten); }
  }, 100);
  setTimeout(() => clearInterval(hen), 8000);
}

const api = {
  kieu: 'meo3d', uuTien: 1,
  chiVao, bamVao, dienDongTac, camXuc, khiRoiMuc, dongTacChoTu,
  DANH_SACH_DONG_TAC: [...Object.keys(DONG_TAC), ...Object.keys(DI_BO)],
  CAM_XUC: Object.keys(CAM_XUC),
  get san() { return S.san; },
  get tat() { return S.tat; },
  rongHienTai: () => kichThuoc().rong,
  an(anDi = true) {
    S.tat = anDi;
    if (khung) khung.style.display = laser.style.display = anDi ? 'none' : '';
    if (anDi && bong) anBong();
    if (!anDi && khung) { S.x = S.dichX = viTriNha(); S.truoc = performance.now(); }
  },
  _S: S, _P: P, _capNhat: capNhat,
};

dungSanKhau();
if (!document.getElementById('senseiGonCss')) {
  const st = document.createElement('style');
  st.id = 'senseiGonCss';
  st.textContent = `.sensei-gon { position: fixed; z-index: 86; pointer-events: none; width: 16px; height: 16px;
    margin: -8px 0 0 -8px; border-radius: 50%; border: 3px solid #f43f5e; animation: senseiGon .6s ease-out forwards; }
    @keyframes senseiGon { from { transform: scale(.3); opacity: 1 } to { transform: scale(3.2); opacity: 0 } }`;
  document.head.appendChild(st);
}
S.san = true;
if (hub) hub.dangKy(api); else window.SenseiAvatar = api;
S.x = S.dichX = viTriNha();
khungHinh();
if (!S.tat) setTimeout(() => dienDongTac('vay', 2.5), 700);
