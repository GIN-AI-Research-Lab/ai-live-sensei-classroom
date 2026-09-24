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

export function napMeoNangCap(url, scene) {
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
      uDai: { value: cao * .016 }, uThoiGian: { value: 0 }, uLuc: { value: new THREE.Vector3() },
      // Goc duoi: phia sau-ben phai, thap (uoc luong tu khung bao)
      uDuoi: { value: new THREE.Vector4(bb.min.x + (bb.max.x - bb.min.x) * .62, bb.min.y + cao * .3,
                                        (bb.min.z + bb.max.z) / 2, .18) },
    };
    vl.userData.u = u;
    luoi.material = vatLieuLop(vl, 0);
    const cacLop = [];
    for (let i = 1; i <= SO_LOP; i++) {
      const lop = new THREE.Mesh(luoi.geometry, vatLieuLop(vl, i / SO_LOP));
      lop.renderOrder = i;
      luoi.add(lop);
      cacLop.push(lop);
    }

    scene.add(goc);
    let truocY = 0, vanToc = new THREE.Vector3(), lech = new THREE.Vector3();
    ok({
      doiTuong: goc,
      /** Giu lai n lop (rai deu tu goc den ngon) — dung de ha chat luong khi may cham */
      datSoLop(n) {
        n = Math.max(4, Math.min(SO_LOP, Math.round(n)));
        cacLop.forEach((l, i) => { l.visible = (i % Math.ceil(SO_LOP / n)) === 0 || i === SO_LOP - 1; });
      },
      huy() {
        goc.traverse((o) => { if (o.isMesh) { o.material.dispose?.(); } });
        luoi.geometry.dispose();
      },
      capNhat(t, dt) {
        u.uThoiGian.value = t;
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
