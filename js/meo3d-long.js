/**
 * Meo 3D ban nang cap (chay thoi gian thuc):
 *   - LONG NHIEU LOP (shell fur): 24 lop vo mong day ra theo phap tuyen, moi lop
 *     chi giu lai nhung "soi" long (nhieu te bao 3D) -> long xu mem nhu thu bong.
 *     Chi moc tren vung LONG (nhan biet tu mau: cam / trang), khong moc tren ao,
 *     khan, bang dan, mat, mui.
 *   - Long co QUAN TINH: khi meo lac lu, ngon long lech theo roi dan hoi ve.
 *   - Anh long mem (sheen) + normal map chep tu ban 1,7 trieu mat (duong khau, soi vai).
 *   - MAT BONG: vung mat ve san (xanh ngoc / den) duoc lam bong nhu giac mac.
 *   - DUOI VAY bang bien dang dinh trong shader (chua can gan xuong).
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const SO_LOP = 20;

const GLSL_CHUNG = /* glsl */`
  uniform float uH, uDai, uThoiGian;
  uniform vec3 uLuc;
  uniform vec4 uDuoi;        // xyz = goc duoi (toa do vat), w = bien do
  uniform sampler2D uKhongLong;   // ban do cam moc long (UV): mom, mieng, bang dan
  varying vec3 vViTriGoc;
`;

// Te bao ngau nhien 3D -> moi o la mot soi long, ban kinh nho dan ve ngon
const GLSL_LONG = /* glsl */`
  vec3 bam3(vec3 p) {
    p = fract(p * vec3(.1031, .1030, .0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.xxy + p.yxx) * p.zyx);
  }
  // Moi o nho la mot soi: chi xet chinh o do (1 lan bam) thay vi 27 o lang gieng —
  // re hon ~27 lan ma o kich co soi long nay mat thuong khong phan biet duoc
  float soiLong(vec3 p) {
    vec3 o = floor(p), f = fract(p);
    vec3 tam = .25 + .5 * bam3(o);
    return length(f - tam) * 1.6;
  }
  // Vung long: cam (vang cam) hoac trang sang. Mau khan do, ao nau toi, mieng va bi loai.
  float laLong(vec3 c) {
    vec3 s = pow(max(c, 0.), vec3(1. / 2.2));
    float mx = max(s.r, max(s.g, s.b)), mn = min(s.r, min(s.g, s.b));
    float bh = (mx - mn) / (mx + 1e-4);
    float cam = step(s.b, s.g) * step(s.g, s.r) * smoothstep(.30, .45, bh) * smoothstep(.55, .70, mx)
              * smoothstep(.30, .42, (s.g - s.b) / (s.r - s.b + 1e-4));
    float trang = (1. - smoothstep(.16, .26, bh)) * smoothstep(.70, .80, mx);
    return max(cam, trang);
  }
  // Vung mat: trong xanh ngoc hoac con nguoi den bong
  float laMat(vec3 c) {
    vec3 s = pow(max(c, 0.), vec3(1. / 2.2));
    float mx = max(s.r, max(s.g, s.b));
    float ngoc = step(s.r * 1.25, s.g) * step(s.r * 1.2, s.b) * smoothstep(.2, .3, mx);
    float den = 1. - smoothstep(.08, .16, mx);
    return max(ngoc, den);
  }
`;

function vatLieuLop(goc, h) {
  const m = goc.clone();
  // Chi lop nen can lop bong mat; bat cho ca 24 lop long thi nang gap doi ma khong de lam gi
  if (h > 0) m.clearcoat = 0;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, m.userData.u);
    sh.uniforms.uH = { value: h };
    sh.vertexShader = GLSL_CHUNG + sh.vertexShader.replace('#include <begin_vertex>', /* glsl */`
      #include <begin_vertex>
      vViTriGoc = position;
      // Duoi vay: chi cac dinh o phia SAU, ben phai va thap (khong dung vao tay/chan),
      // cang xa goc duoi cang lac manh, song lan dan ra ngon.
      float kx = position.x - uDuoi.x;
      float wDuoi = smoothstep(.0, .3, kx) * smoothstep(uDuoi.y + .3, uDuoi.y - .1, position.y)
                  * smoothstep(uDuoi.z - .05, uDuoi.z - .3, position.z);
      float lac = sin(uThoiGian * 2.4 - kx * 5.) * uDuoi.w * wDuoi;
      transformed.z += lac * kx;
      // Day lop long ra ngoai + ngon long lech theo quan tinh (h^2: goc cung, ngon mem)
      transformed += normalize(objectNormal) * uDai * uH + uLuc * uDai * uH * uH;
    `);
    sh.fragmentShader = GLSL_CHUNG + GLSL_LONG + sh.fragmentShader
      .replace('#include <roughnessmap_fragment>', /* glsl */`
        #include <roughnessmap_fragment>
        // Mat ve san -> bong nhu giac mac: phan chieu anh sang moi truong thanh dom sang
        float matBong = uH > 0. ? 0. : laMat(diffuseColor.rgb);
        roughnessFactor = mix(roughnessFactor, .04, matBong);
      `)
      .replace('#include <lights_physical_fragment>', /* glsl */`
        #include <lights_physical_fragment>
        #ifdef USE_CLEARCOAT
          material.clearcoat = matBong;
          material.clearcoatRoughness = .03;
        #endif
        material.sheenColor *= 1. - matBong;
      `)
      .replace('#include <map_fragment>', /* glsl */`
      #include <map_fragment>
      float vung = laLong(diffuseColor.rgb);
      #ifdef USE_MAP
        vung *= 1. - step(.5, texture2D(uKhongLong, vMapUv).r);
      #endif
      if (uH > 0.) {
        float d = soiLong(vViTriGoc * 420.);
        if (vung < .5 || d > .55 * (1. - uH)) discard;
        // Goc long toi hon ngon (cac soi che bong nhau) -> co chieu sau
        diffuseColor.rgb *= mix(.72, 1.0, uH);
      } else {
        diffuseColor.rgb *= mix(1., .72, vung);
      }
    `);
  };
  m.customProgramCacheKey = () => 'long' + h.toFixed(3);
  return m;
}

// ---------------------------------------------------------------------------
// DIEU KHIEN XUONG: moi phep xoay khai bao trong he toa do CUA MEO (x: trai meo -> phai man hinh,
// y: len, z: huong ve nguoi xem), khong phu thuoc truc rieng (roll) cua tung xuong.
// ---------------------------------------------------------------------------
function taoDieuKhien(goc, skeleton) {
  const X = {};
  for (const b of skeleton.bones) X[b.name.replace(/[.]/g, '')] = b;
  const nghi = new Map(skeleton.bones.map((b) => [b, b.quaternion.clone()]));
  const _qg = new THREE.Quaternion(), _qp = new THREE.Quaternion(), _q = new THREE.Quaternion();
  const LEN = new THREE.Vector3(0, 1, 0);
  // Xoay xuong b them mot goc quanh truc (he meo), tinh tu tu the nghi
  function xoay(b, q) {
    if (!b) return;
    goc.getWorldQuaternion(_qg);
    b.parent.getWorldQuaternion(_qp);
    const nghiThe = _qp.clone().multiply(nghi.get(b));            // huong nghi trong the gioi
    const qThe = _qg.clone().multiply(q).multiply(_qg.clone().invert());
    b.quaternion.copy(_qp.invert().multiply(qThe.multiply(nghiThe)));
  }
  const truc = (x, y, z, a) => _q.clone().setFromAxisAngle(new THREE.Vector3(x, y, z).normalize(), a);
  // Chi xuong b theo huong d (he meo)
  function nham(b, d, tron = 1) {
    if (!b) return;
    goc.getWorldQuaternion(_qg);
    b.parent.getWorldQuaternion(_qp);
    const nghiThe = _qp.clone().multiply(nghi.get(b));
    const r = LEN.clone().applyQuaternion(nghiThe).applyQuaternion(_qg.clone().invert());   // huong nghi, he meo
    const q = new THREE.Quaternion().setFromUnitVectors(r.normalize(), d.clone().normalize());
    xoay(b, new THREE.Quaternion().slerp(q, tron));
  }
  let dang = 'nghi', batDau = 0, nhinX = 0, nhinY = 0, giatTai = 0;
  let chiBen = 'R', chiHuong = new THREE.Vector3(-1, 0, .3), dangNoi = 0, diMuc = 0, diPha = 0;
  const tron = { v: 0 };      // muc do dong tac (0 -> 1, len xuong mem)
  return {
    hanhDong(ten) { if (ten !== dang) batDau = performance.now() / 1000; dang = ten; },
    nhin(x, y) { nhinX = x; nhinY = y; },
    /** Chi tay ben 'L' (trai meo, phia +x) hoac 'R' theo huong d (he meo) */
    chi(ben, d) { chiBen = ben; chiHuong.copy(d).normalize(); if (dang !== 'chi-huong') this.hanhDong('chi-huong'); },
    /** Dang noi (0..1): dau gat nhe, tay khoa chan nho */
    noi(m) { dangNoi += (m - dangNoi) * .2; },
    /** Buoc chan khi di: muc 0..1, pha tang theo quang duong */
    di(muc, pha) { diMuc = muc; diPha = pha; },
    capNhat(t) {
      for (const [b, q] of nghi) b.quaternion.copy(q);             // ve tu the nghi roi cong dong tac
      const tt = performance.now() / 1000 - batDau;          // thoi gian tu luc bat dau dong tac
      const k = dang === 'nghi' ? 0 : Math.min(1, (performance.now() / 1000 - batDau) / .35);
      tron.v += (k - tron.v) * .15;
      const vui = dang === 'vui';
      // Than: tho
      // Hong: nhun + nghieng khi di
      xoay(X.hong, truc(0, 0, 1, Math.sin(diPha) * .06 * diMuc));
      xoay(X.nguc, truc(1, 0, 0, Math.sin(t * 1.7) * .025));
      // Chan buoc luan phien khi di
      xoay(X.duiL, truc(1, 0, 0, Math.sin(diPha) * .45 * diMuc));
      xoay(X.duiR, truc(1, 0, 0, -Math.sin(diPha) * .45 * diMuc));
      // Dau: lac nhe + nhin theo con tro + gat dau
      const gat = (dang === 'gat' ? Math.max(0, Math.sin(tt * 7)) * .28 * tron.v : 0)
                + dangNoi * Math.max(0, Math.sin(t * 6.5)) * .07;
      const lacDau = dang === 'lac' ? Math.sin(tt * 9) * .3 * tron.v : 0;
      xoay(X.dau, truc(0, 1, 0, Math.sin(t * .45) * .08 + nhinX * .35 + lacDau)
        .multiply(truc(1, 0, 0, Math.sin(t * .7) * .04 - nhinY * .2 + gat))
        .multiply(truc(0, 0, 1, Math.sin(t * .33) * .05)));
      // Tai: thinh thoang giat mot cai
      if (t > giatTai) giatTai = t + 2.5 + Math.random() * 4;
      const giat = Math.max(0, 1 - Math.abs(giatTai - t - .1) * 12);
      xoay(X.taiL, truc(0, 0, 1, -giat * .35 * (Math.floor(giatTai) % 2)));
      xoay(X.taiR, truc(0, 0, 1, giat * .35 * (1 - Math.floor(giatTai) % 2)));
      // Duoi: song lan tu goc ra ngon, vui thi nhanh va manh
      for (let i = 0; i < 4; i++) {
        const a = (vui ? .5 : .28) * Math.sin(t * (vui ? 7 : 2.2) - i * .8);
        xoay(X['duoi' + i], truc(0, 1, 0, a).multiply(truc(1, 0, 0, Math.sin(t * 1.3 - i * .6) * .08)));
      }
      // Tay (ben PHAI cua meo = phia -x, ben trai man hinh)
      const lac = Math.sin(t * 1.2) * .04;
      xoay(X.baptayL, truc(0, 0, 1, lac)); xoay(X.baptayR, truc(0, 0, 1, -lac));
      if (dang === 'vay') {
        nham(X.baptayR, new THREE.Vector3(-.55, .85, .25), tron.v);
        nham(X.cangtayR, new THREE.Vector3(-.15 + Math.sin(tt * 9) * .45, 1, .25), tron.v);
      } else if (dang === 'chi-huong') {
        nham(X['baptay' + chiBen], chiHuong, tron.v); nham(X['cangtay' + chiBen], chiHuong, tron.v);
        nham(X['bantay' + chiBen], chiHuong, tron.v);
      } else if (dangNoi > .05 && dang === 'nghi') {
        // Vua noi vua khoa tay nhe nhu dang giang
        const g = Math.sin(t * 2.3) * .5 + .5;
        nham(X.cangtayL, new THREE.Vector3(.35, -.3 + g * .5, .8), dangNoi * .7);
        nham(X.cangtayR, new THREE.Vector3(-.35, .2 - g * .5, .8), dangNoi * .7);
      } else if (dang === 'chi') {
        const d = new THREE.Vector3(-.85, .35, .55);
        nham(X.baptayR, d, tron.v); nham(X.cangtayR, d, tron.v); nham(X.bantayR, d, tron.v);
      } else if (vui) {
        const nhun = Math.sin(tt * 8) * .15;
        nham(X.baptayL, new THREE.Vector3(.6, .8 + nhun, .2), tron.v); nham(X.cangtayL, new THREE.Vector3(.2, 1, .2), tron.v);
        nham(X.baptayR, new THREE.Vector3(-.6, .8 + nhun, .2), tron.v); nham(X.cangtayR, new THREE.Vector3(-.2, 1, .2), tron.v);
      }
    },
  };
}

// Anh 1x1 den: dung khi mo hinh khong co ban do cam moc long
const KHONG_CAM = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
KHONG_CAM.needsUpdate = true;

export function napMeoNangCap(url, scene) {
  // Ban do cam moc long di kem (neu co): <ten>-khong-long.png
  const matNa = { value: KHONG_CAM };
  new THREE.TextureLoader().load(url.replace(/.glb$/, '-khong-long.png'), (t) => {
    t.flipY = false; t.colorSpace = THREE.NoColorSpace; matNa.value = t;
  }, undefined, () => {});
  return new Promise((ok, loi) => new GLTFLoader().load(url, (gltf) => {
    const goc = gltf.scene;
    let luoi = null;
    goc.traverse((o) => { if (o.isMesh && !luoi) luoi = o; });
    const m0 = luoi.material;
    const vl = new THREE.MeshPhysicalMaterial({
      map: m0.map, normalMap: m0.normalMap, normalScale: new THREE.Vector2(.7, .7),
      roughness: .82, metalness: 0, specularIntensity: .3,
      sheen: .45, sheenRoughness: .6, sheenColor: new THREE.Color(0xffc88a),
      clearcoat: .001,      // bat nhanh clearcoat trong shader; do bong thuc dat theo vung mat
    });
    if (vl.map) { vl.map.colorSpace = THREE.SRGBColorSpace; vl.map.anisotropy = 8; }
    luoi.geometry.computeBoundingBox();
    const bb = luoi.geometry.boundingBox, cao = bb.max.y - bb.min.y;
    const u = {
      uKhongLong: matNa,
      uDai: { value: cao * .016 }, uThoiGian: { value: 0 }, uLuc: { value: new THREE.Vector3() },
      // Goc duoi: phia sau-ben phai, thap (uoc luong tu khung bao)
      uDuoi: { value: new THREE.Vector4(bb.min.x + (bb.max.x - bb.min.x) * .62, bb.min.y + cao * .3,
                                        (bb.min.z + bb.max.z) / 2, .18) },
    };
    const coXuong = !!luoi.isSkinnedMesh;
    if (coXuong) u.uDuoi.value.w = 0;          // co xuong duoi that thi khong can bien dang gia trong shader
    vl.userData.u = u;
    luoi.material = vatLieuLop(vl, 0);
    luoi.frustumCulled = false;
    const cacLop = [];
    for (let i = 1; i <= SO_LOP; i++) {
      const mat = vatLieuLop(vl, i / SO_LOP);
      const lop = coXuong ? new THREE.SkinnedMesh(luoi.geometry, mat) : new THREE.Mesh(luoi.geometry, mat);
      if (coXuong) { lop.bind(luoi.skeleton, luoi.bindMatrix); lop.bindMode = luoi.bindMode; }
      lop.renderOrder = i;
      lop.frustumCulled = false;
      luoi.add(lop);
      cacLop.push(lop);
    }
    const dc = coXuong ? taoDieuKhien(goc, luoi.skeleton) : null;

    scene.add(goc);
    let truocY = 0, vanToc = new THREE.Vector3(), lech = new THREE.Vector3();
    ok({
      doiTuong: goc,
      dieuKhien: dc,
      /** Xuong theo ten (bo dau cham), vi du 'bantayR' */
      xuong: (ten) => (coXuong ? luoi.skeleton.bones.find((b) => b.name.replace(/[.]/g, '') === ten) : null),
      /** Giu lai n lop (rai deu tu goc den ngon) — dung de ha chat luong khi may cham */
      datSoLop(n) {
        n = Math.max(4, Math.min(SO_LOP, Math.round(n)));
        cacLop.forEach((l, i) => { l.visible = (i % Math.ceil(SO_LOP / n)) === 0 || i === SO_LOP - 1; });
      },
      huy() {
        goc.traverse((o) => { if (o.isMesh) { o.material.dispose?.(); } });
        luoi.geometry.dispose();
      },
      coXuong,
      /** Dong tac minh hoa: 'nghi' | 'vay' | 'gat' | 'chi' | 'vui' */
      hanhDong(ten) { if (dc) dc.hanhDong(ten); },
      /** Huong dau nhin (-1..1), vi du theo con tro chuot */
      nhin(x, y) { if (dc) dc.nhin(x, y); },
      capNhat(t, dt) {
        u.uThoiGian.value = t;
        if (dc) dc.capNhat(t, dt);
        // Lac lu nhe de thay long + duoi co quan tinh
        const lacY = Math.sin(t * 1.3) * .22;
        goc.userData.lac = lacY;
        const v = (lacY - truocY) / Math.max(dt, 1e-3); truocY = lacY;
        vanToc.set(-v * .9, -1.2, 0);                 // trong luc keo ngon long xuong + lech nguoc chieu quay
        lech.lerp(vanToc, Math.min(1, dt * 6));
        u.uLuc.value.copy(lech).multiplyScalar(.35);
      },
    });
  }, undefined, loi));
}
