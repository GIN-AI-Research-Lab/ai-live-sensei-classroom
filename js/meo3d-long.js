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
  uniform sampler2D uMatMieng;    // R vung mat, G vi tri doc trong mat, B/A vi tri trong mieng
  uniform vec2 uMi;               // x: mi tren khep (0..1), y: mi duoi day len (0..1)
  uniform float uMieng;           // do mo mieng 0..1
  uniform vec3 uMauMi;
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
  // clone() sao chep userData bang JSON -> mat tham chieu. Dung THANG bo uniform cua vat lieu goc
  // de moi lop long cung nhan cap nhat (thoi gian, quan tinh, mi mat, mieng) va giu dung kieu du lieu.
  const uChung = goc.userData.u;
  // Chi lop nen can lop bong mat; bat cho ca 24 lop long thi nang gap doi ma khong de lam gi
  if (h > 0) m.clearcoat = 0;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uChung);
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
        vec4 mm = texture2D(uMatMieng, vMapUv);
        vung *= 1. - step(.3, mm.r);                       // khong moc long len mat
        if (uH == 0.) {
          // Mi mat: mi tren phu tu mep tren xuong toi uMi.x, mi duoi tu mep duoi len
          float trongMat = smoothstep(.3, .6, mm.r);
          float phu = max(1. - smoothstep(uMi.x - .04, uMi.x + .04, mm.g), smoothstep(1. - uMi.y - .04, 1. - uMi.y + .04, mm.g));
          phu *= trongMat * step(.001, uMi.x + uMi.y);
          diffuseColor.rgb = mix(diffuseColor.rgb, uMauMi, phu);
          // Vien mi toi o mep mi tren (nhu long mi)
          float vien = (1. - smoothstep(.0, .045, abs(mm.g - uMi.x))) * step(.03, uMi.x) * trongMat;
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.08, .05, .03), vien * .85);
          // Mieng mo khi noi: elip toi, luoi hong o nua duoi
          if (mm.b > .05 && uMieng > .02) {
            float mu = (mm.b - .1) / .9, mv = (mm.a - .2) / .8;
            vec2 d = vec2((mu - .5) / .27, (mv - .52) / (.08 + .46 * uMieng));
            float trong = 1. - smoothstep(.8, 1., length(d));
            vec3 mauMieng = mix(vec3(.18, .03, .03), vec3(.75, .32, .36), smoothstep(.1, .9, d.y * .5 + .5));
            diffuseColor.rgb = mix(diffuseColor.rgb, mauMieng, trong);
          }
        }
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
function taoDieuKhien(goc, skeleton, u) {
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
  let chop = 0, moMieng = 0, dauYTruoc = 0, taiLech = 0, taiVT = 0, muiMi = 0, miDuoi = 0;
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
    /** Do to cua giong dang phat (0..~0.3) -> mieng mo */
    mieng(muc) { moMieng += (Math.min(1, muc * 7) - moMieng) * .45; },
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
      const ngu = dang === 'ngu', cui = dang === 'cui', suyNghi = dang === 'nghi', an = dang === 'an';
      const cuiK = cui ? Math.max(0, Math.sin(Math.min(tt, 1.6) / 1.6 * Math.PI)) * tron.v : 0;
      if (cuiK) { xoay(X.bung, truc(1, 0, 0, cuiK * .25)); xoay(X.nguc, truc(1, 0, 0, cuiK * .3)); }
      const dauY = Math.sin(t * .45) * .08 + nhinX * .35 + lacDau;
      xoay(X.dau, truc(0, 1, 0, dauY)
        .multiply(truc(1, 0, 0, Math.sin(t * .7) * .04 - nhinY * .2 + gat + (ngu ? .18 : 0) * tron.v + cuiK * .35
                              + (an ? Math.max(0, Math.sin(tt * 5)) * .06 : 0)))
        .multiply(truc(0, 0, 1, Math.sin(t * .33) * .05 + ((ngu ? .3 : 0) + (suyNghi ? .16 : 0)) * tron.v)));
      // Tai lo xo: dau quay nhanh thi tai bi keo tre lai roi nay ve
      const vDau = (dauY - dauYTruoc) * 60; dauYTruoc = dauY;
      taiVT += (-vDau * .6 - taiLech) * .25 - taiVT * .18; taiLech += taiVT * .5;
      // Mi mat: chop ngau nhien; ngu nham han; vui hip mat (mi duoi); lac dau / nghi thi lim dim
      if (t > chop) chop = t + 2.2 + Math.random() * 3.5;
      const dangChop = 1 - Math.min(1, Math.abs(chop - t - .08) / .08);
      const miTren = Math.max(dangChop, ngu ? tron.v : 0, dang === 'lac' || suyNghi ? .38 * tron.v : 0, cuiK * .9);
      miDuoi += (((vui ? .42 : 0) + (an ? .3 : 0)) * tron.v - miDuoi) * .2;
      muiMi += (miTren - muiMi) * .5;
      if (u) {
        u.uMi.value.set(muiMi, miDuoi);
        const nhai = an ? Math.max(0, Math.sin(tt * 5)) * .7 * tron.v : 0;
        u.uMieng.value = Math.max(moMieng * (.6 + .4 * Math.abs(Math.sin(t * 13))), nhai, vui ? .35 * tron.v : 0);
      }
      // Tai: thinh thoang giat mot cai
      if (t > giatTai) giatTai = t + 2.5 + Math.random() * 4;
      const giat = Math.max(0, 1 - Math.abs(giatTai - t - .1) * 12);
      const cup = ngu ? .25 * tron.v : 0;          // ngu: tai cup xuong
      xoay(X.taiL, truc(0, 0, 1, -giat * .35 * (Math.floor(giatTai) % 2) + taiLech - cup));
      xoay(X.taiR, truc(0, 0, 1, giat * .35 * (1 - Math.floor(giatTai) % 2) + taiLech + cup));
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
      } else if (an) {
        // Dua mon an len mieng roi ha xuong, lap lai
        const len = Math.max(0, Math.sin(tt * 5));
        nham(X.baptayR, new THREE.Vector3(-.2, -.55, .8), tron.v);
        nham(X.cangtayR, new THREE.Vector3(.45 * len + .1, .35 + .5 * len, .6), tron.v);
        nham(X.baptayL, new THREE.Vector3(.2, -.55, .8), tron.v * .8);
        nham(X.cangtayL, new THREE.Vector3(-.2, .1, .95), tron.v * .8);
      } else if (suyNghi) {
        // Chong cam suy nghi
        nham(X.baptayR, new THREE.Vector3(-.2, -.5, .85), tron.v);
        nham(X.cangtayR, new THREE.Vector3(.5, .8, .3), tron.v);
      } else if (ngu) {
        // Hai tay chap lai ke ma
        nham(X.baptayL, new THREE.Vector3(.1, -.5, .85), tron.v); nham(X.cangtayL, new THREE.Vector3(-.4, .8, .3), tron.v);
        nham(X.baptayR, new THREE.Vector3(-.1, -.5, .85), tron.v); nham(X.cangtayR, new THREE.Vector3(.2, .85, .4), tron.v);
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
  // Ban do mat-mieng (neu co): <ten>-mat-mieng.png
  const matMieng = { value: KHONG_CAM };
  new THREE.TextureLoader().load(url.replace(/.glb$/, '-mat-mieng.png'), (t) => {
    t.flipY = false; t.colorSpace = THREE.NoColorSpace; t.premultiplyAlpha = false;
    t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; matMieng.value = t;
  }, undefined, () => {});
  const uMat = { uMatMieng: matMieng, uMi: { value: new THREE.Vector2() }, uMieng: { value: 0 },
                 uMauMi: { value: new THREE.Color(0xcd9669).convertSRGBToLinear() } };
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
      ...uMat,
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
    const dc = coXuong ? taoDieuKhien(goc, luoi.skeleton, u) : null;

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
