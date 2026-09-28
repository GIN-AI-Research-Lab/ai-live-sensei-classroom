/**
 * MEO SENSEI CLIP — meo nua than (nguc tro len) dien bang cac clip ngan 60 fps lam san (Veo + noi khung).
 *
 * Moi clip BAT DAU va KET THUC o cung tu the nghi (tru chuoi ngu: ngu-vao -> ngu -> ngu-day), nen clip nao
 * noi tiep clip nao cung khong giat. Nen xanh deu (clip.json: mauNen) xoa tren GPU (WebGL); hai <video>
 * luan phien: mot cai dang chay, cai kia nap san clip sap toi, doi giua chung thi tron cheo.
 *
 *   Dang noi (do tu loa AudioEngine, hoac dong thoi gian khau hinh bao tieng sap ra loa trong 0.45 s):
 *     noi -> noi-tay-trai -> noi -> noi-tay-phai -> ...
 *     co bo khau hinh (mieng.json + atlas + <clip>.mieng.json): dung ban "kin" (noi-kin, noi-kin-tay-*: mieng
 *     gan nhu khep) + lop mom ve de len theo tieng Sensei (xem KHAU HINH ben duoi); thieu thi dung clip noi cu
 *   Cam xuc (set_emotion / muc bai co "emotion"): thay clip noi ngay (tron <= 250 ms)
 *   Im lang: nghi; khong giang bai thi thinh thoang liem-tay, treo lau thi ngu-gat, lau nua ngu-vao -> ngu
 *   Chi vao muc: gio tay ve phia muc + tia laser tu ban tay (do tu clip that) toi muc luc tay dang gio
 *   Giam chuyen dong / khong co WebGL / hong clip nghi: anh tinh nghi.webp (nen trong suot)
 *
 * KHAU HINH (lop mom): luot ve thu hai, chi khi clip kin dang chay, chi trong khung bao quanh mom.
 *   - Hinh mieng: SenseiKhauHinh.layLuc(dong ho AudioContext cua audioEngine.outCtx) -> tron 7 o atlas
 *     (kin a e i o u o2) theo a -> b / t / do mo (mieng.json khuyen_nghi_do_mo). Im lang: o 'kin' (che mieng
 *     video luon). Khong co dong thoi gian (loi thoai nhan vat...): chi theo do to loa.
 *   - Vi tri: moi o video dung tracking cua clip / khung cua no ([tx,ty,s,r,conf,occ,kL,kR], khung = khung
 *     da dua len GPU); gain theo khung + bao ve mau (mieng.json, bat buoc); tron cheo hai clip: tron dung
 *     tung lop (mom A tren clip A, mom B tren clip B) trong mot shader.
 *   - Clip kin chua cat duoi (khung > hetTu + 1): coi hetTu la het clip (sau do dau cui xuong) — dung / doi
 *     clip truoc khung hetTu, khong bao gio de trinh duyet tu lap / chay qua.
 *
 * Dang ky qua SenseiAvatarHub (js/sensei-avatar-hub.js). Xem thu: window.__senseiClip, ?meoToc=<k> (hen gio nhanh k lan).
 */
(function () {
  'use strict';

  const THU_MUC = 'assets/sensei-meo/clip/';
  const TI_LE = 540 / 494;                       // rong / cao khung clip
  // 'noi' = clip noi cua luot nay (noi-kin khi co bo khau hinh, xem banNoi); tai sau khi biet bo khau hinh co khong
  const NAP_TRUOC = ['nghi', 'chao'];
  // Nap dan luc ranh, theo thu tu hay dung (ten clip noi cu -> ban kin qua banNoi)
  const NAP_SAU = ['noi-tay-phai', 'noi-tay-trai', 'vui', 'de-biu', 'that-vong', 'liem-tay', 'ngu-gat', 'ngac-nhien',
    'suy-nghi', 'cui-chao', 'buon', 'gian', 'xau-ho', 'ngu-vao', 'ngu', 'ngu-day'];
  // Loai clip -> ai duoc ngat ngang (coTheNgat). Khong co ten o day = cam xuc ('cx').
  const LOAI = { nghi: 'nen', noi: 'noi', 'noi-tay-trai': 'tay', 'noi-tay-phai': 'tay', 'noi-kin': 'noi',
    'noi-kin-tay-trai': 'tay', 'noi-kin-tay-phai': 'tay', 'liem-tay': 'ranh',
    'ngu-gat': 'ranh', 'ngu-vao': 'ngu', ngu: 'ngu', 'ngu-day': 'day', chao: 'chao', 'cui-chao': 'chao' };
  const LAP = new Set(['nghi', 'noi', 'ngu']);   // chay tiep chinh no thi de trinh duyet tu lap (khong hut khung)
  const XOAY = ['noi', 'noi-tay-trai', 'noi', 'noi-tay-phai'];
  // Clip noi -> ban mieng khep cho lop mom (cung cu chi). Tracking: <ten>.mieng.json (cung thu muc).
  const KIN = { noi: 'noi-kin', 'noi-tay-trai': 'noi-kin-tay-trai', 'noi-tay-phai': 'noi-kin-tay-phai' };
  const LA_KIN = new Set(Object.values(KIN));
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
    // Clip kin: do lai tren clip that (diem xa vai nhat ngoai than, tam cum 30 px; bo tai meo o y < .36)
    'noi-kin-tay-trai': [
      { ben: 'phai', d: [[.6, .87, .7], [.73, .89, .56], [.8, .9, .53], [.87, .9, .52], [1.23, .91, .54], [2.57, .91, .54],
        [2.67, .92, .57], [2.8, .92, .66], [2.9, .92, .69], [3, .91, .66], [3.1, .91, .65], [4.4, .92, .66], [4.47, .91, .67],
        [4.57, .9, .71]] },
    ],
    'noi-kin-tay-phai': [
      { ben: 'trai', d: [[.67, .15, .69], [.7, .14, .64], [.73, .14, .58], [.8, .15, .5], [.83, .15, .48], [.9, .14, .47],
        [1.07, .1, .49], [2.5, .1, .49], [2.6, .1, .51], [2.8, .09, .59], [3.07, .07, .53], [3.83, .07, .53], [3.9, .09, .54],
        [3.93, .11, .57], [4, .13, .66], [4.03, .14, .69]] },
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
    gatMoc: -1, daChao: false, xoay: 0, i: -1, sau: null, muc: null, cho: null, chi: null, lanPhat: 0, daVe: false, imTu: null, lich: 0,
    x: 0, tx: null, ty: null, doRo: 1, xetLuc: 0, moDen: 0, nutDen: 0, dem: 0, cssCu: '', khungMH: 0, veLai: false,
    toc: Math.max(1, Number(new URLSearchParams(location.search).get('meoToc')) || 1),
  };
  const TG = (giay) => giay / S.toc;
  S.henLiem = bayGio() + TG(ngauNhien(...LIEM));

  const KHO = {};                 // ten clip -> { p, url, hong }: tai ca tep thanh blob (tua / lap khong can mang)
  let MF = null;                  // clip.json
  let hop, anh, khung, laser, ctx2d, laserBan = false, mauLaser = '#c96442';
  let gl = null, BV = null;       // BV = bo ve (taoBoVe): chuong trinh nen + lop mom
  const O = [];                   // 2 o video: { i, v, ten, the, tex, tg, tgNap, co, lan, daXet }
  // Bo khau hinh: tt 'chua' -> 'dang' -> 'san' (atlas + shader mom san sang) | 'hong'. trk[ten] = tracking da kiem.
  const M = { tt: 'chua', meta: null, trkTho: {}, trk: {}, hongClip: {}, am: 0, amLuc: 0, khoaVe: '' };

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
    if (M.tt === 'chua' || M.tt === 'dang') { setTimeout(napDan, 500); return; }   // chua biet dung clip noi nao
    const ke = NAP_SAU.map(banNoi).find((t) => !KHO[t] && co(t));
    if (!ke) return;
    // Dang tai clip can ngay (cam xuc / chi tay xin luc chua co): nhuong mang, xong moi nap tiep
    if (Object.values(KHO).some((k) => !k.url && !k.hong)) { setTimeout(napDan, 500); return; }
    const ranh = window.requestIdleCallback || ((f) => setTimeout(f, 400));
    ranh(() => napClip(ke).then(() => setTimeout(napDan, 200)), { timeout: 5000 });
  }

  // -------------------------------------------------------------------------
  // BO KHAU HINH: mieng.json (o atlas, mat na, gain) + atlas 1x + tracking 3 clip kin (~140 KB ca bo).
  // Thieu / hong bat ky phan chung nao -> clip noi cu (noi, noi-tay-*), khong lop mom.
  // -------------------------------------------------------------------------
  const layJson = (f) => fetch(THU_MUC + f)
    .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + f); return r.json(); });
  // Atlas alpha THANG: giai ma khong nhan truoc alpha, khong doi khong gian mau (shader tu nhan)
  function docAtlas(f) {
    return fetch(THU_MUC + f).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + f); return r.blob(); })
      .then((b) => (window.createImageBitmap
        ? createImageBitmap(b, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' })
        : new Promise((ok, loi) => {
          const im = new Image();
          im.onload = () => ok(im);
          im.onerror = () => loi(new Error('khong giai ma duoc ' + f));
          im.src = URL.createObjectURL(b);
        })));
  }
  function napMieng() {
    if (M.tt !== 'chua') return;
    M.tt = 'dang';
    // Tai cham qua 12 s: tam dung clip cu; bo khau hinh toi muon van bat len (luot xoay sau dung ban kin)
    const xong = (ok, e) => {
      if (M.tt === 'san' || (!ok && M.tt !== 'dang')) return;
      M.tt = ok ? 'san' : 'hong';
      if (!ok) console.warn('[MeoClip] khong co khau hinh, dung clip noi cu:', (e && e.message) || e);
      napClip(banNoi('noi'));
    };
    const hen = setTimeout(() => xong(false, new Error('tai qua lau')), 12000);
    // Tracking tung clip: thieu clip nao thi clip do dung ban cu (banNoi)
    const trk = [...LA_KIN].map((ten) => layJson(ten + '.mieng.json')
      .then((d) => { M.trkTho[ten] = d; })
      .catch((e) => { M.hongClip[ten] = true; console.warn('[MeoClip] khong nap duoc tracking', ten, e.message || e); }));
    layJson('mieng.json').then((meta) => {
      const a1 = meta && meta.atlas_1x;
      if (!a1 || !a1.cells || !a1.atlas || !meta.anchor || !meta.size) throw new Error('mieng.json thieu atlas_1x / anchor');
      return docAtlas(a1.file).catch(() => docAtlas(a1.file.replace(/\.webp$/, '.png')))
        .then((anhAtlas) => Promise.all(trk).then(() => [meta, anhAtlas]));
    }).then(([meta, anhAtlas]) => {
      clearTimeout(hen);
      if (!BV) throw new Error('khong co WebGL');
      BV.batMom(meta, anhAtlas);             // loi bien dich shader -> throw -> clip noi cu
      M.meta = meta;
      xong(true);
    }).catch((e) => { clearTimeout(hen); xong(false, e); });
  }
  // Tracking da kiem cua clip kin (null: chua co / hong). Kiem mot lan khi dung lan dau.
  function trkCua(ten) {
    if (M.tt !== 'san' || !LA_KIN.has(ten) || M.hongClip[ten]) return null;
    if (M.trk[ten]) return M.trk[ten];
    const d = M.trkTho[ten];
    if (!d) return null;
    const f = Array.isArray(d.f) ? d.f : null;
    const kh = MF && MF.clip && MF.clip[ten] && MF.clip[ten].khung;
    const loi = !f || !f.length || f.some((r) => !Array.isArray(r) || r.length < 6) ? 'hang tracking hong'
      : kh && d.khung && kh !== d.khung ? 'tracking cho mp4 ' + d.khung + ' khung, clip.json ghi ' + kh : '';
    if (loi) { M.hongClip[ten] = true; console.warn('[MeoClip] bo tracking', ten + ':', loi); return null; }
    if (f.some((r) => r.length < 8)) console.warn('[MeoClip] tracking', ten, 'thieu cot kL/kR: coi k = 1 (vien mom co the lech)');
    const khung = d.khung || f.length;
    const het = Number.isInteger(d.hetTu) && d.hetTu > 0 && d.hetTu < f.length ? d.hetTu : f.length - 1;
    const G = M.meta && M.meta.gain && M.meta.gain[ten];
    if (!G) console.warn('[MeoClip] mieng.json thieu gain cho', ten, '- khong bu sang');
    // Do lech tu the moi khung so voi tu the nghi (px, 4 diem quanh mom) — khung 0 cua moi clip khong ngu trung
    // noi-kin#0 trong 0.1 px. Dung de chi doi sang clip khac luc im khi dau da ve cho (khong bong ma khi tron cheo).
    const truc = +d.truc || 282;
    const lech = new Float32Array(f.length);
    f.forEach((r, i) => {
      const s = r[2] || 1, c = Math.cos(r[3]), sn = Math.sin(r[3]), kL = r.length >= 8 ? r[6] : 1, kR = r.length >= 8 ? r[7] : 1;
      let m = 0;
      for (const [x, y] of [[250, 262], [320, 262], [284.5, 258], [284.5, 300]]) {
        const xq = truc + (x - truc) * (x < truc ? kL : kR);
        m = Math.max(m, Math.hypot(s * (c * xq - sn * y) + r[0] - x, s * (sn * xq + c * y) + r[1] - y));
      }
      lech[i] = m;
    });
    // Chua cat duoi (khung > hetTu + 1): het clip la het khung hetTu (sau do dau cui xuong)
    return (M.trk[ten] = { f, truc, khung, het, lech, G: G || null, catDuoi: het + 1 < khung,
      hetGiay: het + 1 < khung ? (het + 1) / ((MF && MF.fps) || 60) : 0 });
  }
  // Clip kin o khung i..i+n dau con gan tu the nghi (<= 3 px)? Clip khac: luon dung (doi nhu cu).
  // Chi xet toi khung cuoi con HIEN: clip chua cat duoi dung o hetTu (cac hang sau do la luc dau cui xuong).
  function gioTuThe(o, n = 16) {
    const t = o && o.ten && LA_KIN.has(o.ten) ? trkCua(o.ten) : null;
    if (!t) return true;
    const i = o.iK || 0, cuoi = t.catDuoi ? t.het : t.lech.length - 1;
    for (let j = i; j <= i + n; j++) if (t.lech[Math.min(cuoi, j)] > 3) return false;
    return true;
  }
  // Ten clip noi dung cho luot nay: ban kin neu bo khau hinh + tracking cua no san sang
  function banNoi(ten) {
    const k = KIN[ten];
    return k && co(k) && trkCua(k) ? k : ten;
  }
  // Thoi diem (giay) coi la het clip cua o: clip kin chua cat duoi -> het khung hetTu, con lai -> het video
  function hetGiay(o) {
    const t = o.ten && LA_KIN.has(o.ten) ? trkCua(o.ten) : null;
    return (t && t.hetGiay) || o.v.duration || 0;
  }
  // Da toi het clip (video het that, hoac clip kin da dung o hetTu)
  const daHet = (o) => o.v.ended || !!o.dungHet;

  // -------------------------------------------------------------------------
  // WEBGL: xoa nen xanh deu + khu vien xanh, tron cheo hai clip (mau da nhan alpha); luot 2: lop mom (khau hinh)
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
  // Tui bong nen: nen xanh bi toi (khe giua tay va than, duoi nach, giua tay gio va mat) co sac do nho theo do sang nen
  // cach xa mau nen -> luat tren giu dac, bo khu xanh bien thanh mang xanh ket. Xoa them diem xanh toi ro: g vuot max(r, b)
  // (.08 -> .14), do gan 0 (r < .2-.4 g: nen xanh khong co do; mong mat xanh ngoc co r/g ~ .4-.7), g < .45-.65 (xanh sang
  // da do luat sac do), va co it nhat 1-2 trong 8 hang xom (+-2 texel) cung xanh toi — diem le o vien mong mat khong bi
  // dong. Do tren ca 22 clip (mo phong numpy, moi 6 khung): chi cham tui nen, 0 diem o mat / mieng / ao.
  // Dung chung cho luot nen va luot mom (luot mom tinh lai dung mau nen o vung no ve).
  const KEY = `
    const vec2 px = vec2(2. / 540., 2. / 494.);
    vec2 chroma(vec3 c){ return vec2(-.169*c.r - .331*c.g + .5*c.b, .5*c.r - .419*c.g - .081*c.b); }
    vec3 mauNen(sampler2D s){
      vec3 g1 = texture2D(s, vec2(.006, .006)).rgb, g2 = texture2D(s, vec2(.994, .006)).rgb;
      vec2 ck = chroma(k);
      float d1 = distance(chroma(g1), ck), d2 = distance(chroma(g2), ck);
      return min(d1, d2) < .12 ? (d1 <= d2 ? g1 : g2) : k;
    }
    // hang xom: (la nen sang, la xanh toi)
    vec2 hx(sampler2D s, vec2 p, vec2 kc){
      vec3 q = texture2D(s, p).rgb;
      return vec2(step(distance(chroma(q), kc), .05), step(.07, q.g - max(q.r, q.b)) * step(q.g, .65) * step(q.r, .3 * q.g));
    }
    vec4 key(sampler2D s, vec2 uv){
      vec3 kk = mauNen(s);
      vec2 kc = chroma(kk);
      vec3 c = texture2D(s, uv).rgb;
      float al = smoothstep(.03, .16, distance(chroma(c), kc));
      vec2 h = hx(s, uv + vec2(px.x, 0.), kc) + hx(s, uv - vec2(px.x, 0.), kc) + hx(s, uv + vec2(0., px.y), kc)
        + hx(s, uv - vec2(0., px.y), kc) + hx(s, uv + px, kc) + hx(s, uv - px, kc) + hx(s, uv + vec2(px.x, -px.y), kc)
        + hx(s, uv + vec2(-px.x, px.y), kc);
      float gan = h.x, ex = c.g - max(c.r, c.b);
      if (gan > 0.) al = min(al, 1. - smoothstep(.10, .36, ex));
      al = min(al, 1. - smoothstep(.08, .14, ex) * (1. - smoothstep(.45, .65, c.g))
        * (1. - smoothstep(.2, .4, c.r / max(c.g, .05))) * smoothstep(.5, 2.5, h.y));
      vec3 p = max(c - (1. - al) * kk, 0.);
      float m = max(p.r, p.b);
      p.g = min(min(p.g, max(m, p.g * al)), m * (gan > 0. ? 1. : 1.08));
      return vec4(min(p, vec3(al)), al);
    }`;
  const FS = `precision mediump float; varying vec2 uv;
    uniform sampler2D a, b; uniform float t; uniform vec3 k;` + KEY + `
    void main(){
      vec4 x = key(a, uv);
      gl_FragColor = t > 0. ? mix(x, key(b, uv), t) : x;
    }`;
  // Lop mom: ve hinh chu nhat bao quanh mom (toa do khung clip 540x494, lien tuc: diem anh k phu [k, k+1]).
  // Moi diem anh chieu nguoc ve toa do tham chieu (noi-kin khung 0) theo tracking cua TUNG clip:
  //   q = nghich dao dong dang(p) = (ia*x + ib*y + cx, -ib*x + ia*y + cy); ref = (truc + (q.x-truc)/(q.x<truc ? kL : kR), q.y)
  // roi lay mau cac o atlas (alpha thang -> nhan truoc), gain theo khung, bao ve mau (mieng dan / long cam /
  // nen xanh cua CHINH clip do lot vao vien mat na), mo dan khi che mom. Ket qua ghep dung tung lop:
  //   mix(momA + (1-momA.a)*nenA, momB + (1-momB.a)*nenB, t) — ghi de (khong blend); ngoai mat na thi bo (giu luot 1).
  // Hang so (anchor, size, tam gain...) chen vao tu mieng.json luc bien dich. 13 hang vec4 uniform (WebGL1 toi thieu 16).
  const VS_MOM = `attribute vec2 p; uniform vec4 bb; varying highp vec2 fp;
    void main(){ fp = bb.xy + (p * .5 + .5) * bb.zw; vec2 v = fp / vec2(540., 494.);
      gl_Position = vec4(v.x * 2. - 1., 1. - v.y * 2., 0., 1.); }`;
  const fsMom = (C) => `precision mediump float;
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    #define HP highp
    #else
    #define HP mediump
    #endif
    varying HP vec2 fp;
    uniform sampler2D a, b, atl; uniform float t; uniform vec3 k;
    uniform HP vec4 oc[4]; uniform vec4 ow;        // 4 o atlas (x, y, w, h chuan hoa) + trong so (tong = 1)
    uniform HP vec4 mA, mB;                        // nghich dao dong dang (ia, ib, cx, cy)
    uniform HP vec4 pA, pB;                        // (kL, kR, do hien 0..1, gain doc gy)
    uniform vec4 gA, gB;                           // (gain r, g, b, gain ngang gx)
    uniform HP vec2 tr;                            // truc mui cua lop A, B` + KEY + `
    const HP vec2 ANCHOR = vec2(${C.anchor}), SIZE = vec2(${C.size}), TAM = vec2(${C.tam}), CHUAN = vec2(${C.chuan});
    vec4 o4(HP vec4 c, HP vec2 u){ vec4 s = texture2D(atl, c.xy + u * c.zw); return vec4(s.rgb * s.a, s.a); }
    float gb(sampler2D s, vec2 q){ vec3 v = texture2D(s, q).rgb; return v.g - v.b; }
    vec4 lop(sampler2D s, HP vec4 m, HP vec4 p, vec4 g, HP float truc, vec2 uv){
      if (p.z <= 0.) return vec4(0.);
      HP vec2 q = vec2(m.x * fp.x + m.y * fp.y + m.z, -m.y * fp.x + m.x * fp.y + m.w);
      HP vec2 r = vec2(truc + (q.x - truc) / (q.x < truc ? p.x : p.y), q.y);
      HP vec2 u = (r - ANCHOR) / SIZE;
      if (u.x < 0. || u.y < 0. || u.x > 1. || u.y > 1.) return vec4(0.);
      vec4 c = ow.x * o4(oc[0], u) + ow.y * o4(oc[1], u) + ow.z * o4(oc[2], u) + ow.w * o4(oc[3], u);
      float f = clamp(1. + g.w * (r.x - TAM.x) / CHUAN.x + p.w * (r.y - TAM.y) / CHUAN.y, .7, 1.3);
      c.rgb *= g.rgb * f;
      vec2 h = .5 / vec2(540., 494.);
      float d = max(max(gb(s, uv - h), gb(s, uv + vec2(h.x, -h.y))), max(gb(s, uv + vec2(-h.x, h.y)), gb(s, uv + h)));
      HP vec2 e = (r - vec2(284.5, 282.)) / vec2(40., 17.);
      return c * ((1. - smoothstep(.8, 1.1, dot(e, e)) * smoothstep(.075, .11, d)) * p.z);
    }
    void main(){
      vec2 uv = fp / vec2(540., 494.);
      vec4 la = lop(a, mA, pA, gA, tr.x, uv);
      vec4 lb = t > 0. ? lop(b, mB, pB, gB, tr.y, uv) : vec4(0.);
      if (max(la.a, lb.a) <= 0.) discard;
      vec4 x = la + (1. - la.a) * key(a, uv);
      if (t > 0.) x = mix(x, lb + (1. - lb.a) * key(b, uv), t);
      gl_FragColor = x;
    }`;

  // Bo ve: chuong trinh nen (+ lop mom khi batMom). Dung chung cho app va dung demo offline
  // (__senseiClip.mieng.taoBoVe) de demo ve DUNG nhu app. Don vi texture: 0, 1 = hai o video, 2 = atlas mom.
  const THU_TU_O = ['kin', 'a', 'e', 'i', 'o', 'u', 'o2'];
  const smooth = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const LOP_TAT = { m: [1, 0, 0, 0], p: [1, 1, 0, 0], g: [1, 1, 1, 0], truc: 282, bb: null };
  function taoBoVe(gl) {
    const sh = (loai, src) => {
      const s = gl.createShader(loai); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const ct = (vs, fs) => {
      const p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
      gl.bindAttribLocation(p, 0, 'p');        // hai chuong trinh dung chung bo dinh o vi tri 0
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return p;
    };
    const ten = (p, ds) => Object.fromEntries(ds.map((x) => [x, gl.getUniformLocation(p, x)]));
    const pN = ct(VS, FS);
    const N = ten(pN, ['a', 'b', 't', 'k']);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.clearColor(0, 0, 0, 0);
    let mau = [0, 177 / 255, 64 / 255], mom = null;
    const bv = {
      gl,
      get coMom() { return !!mom; },
      datMauNen(m) {
        mau = m.map((x) => x / 255);
        gl.useProgram(pN); gl.uniform3fv(N.k, mau);
        if (mom) { gl.useProgram(mom.p); gl.uniform3fv(mom.u.k, mau); }
      },
      // Bien dich shader mom (hang so tu mieng.json) + dua atlas 1x len don vi 2. Loi -> throw.
      batMom(meta, anhAtlas) {
        const s = (v) => v.map((x) => Number(x).toFixed(4)).join(', ');
        const G = meta.gain || {};
        const p = ct(VS_MOM, fsMom({ anchor: s(meta.anchor), size: s(meta.size), tam: s(G.tam || [284.5, 280]),
          chuan: s(G.chuan || [50, 25]) }));
        const u = ten(p, ['a', 'b', 'atl', 't', 'k', 'oc', 'ow', 'mA', 'mB', 'pA', 'pB', 'gA', 'gB', 'tr', 'bb']);
        gl.activeTexture(gl.TEXTURE2);
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        for (const [kk, v] of [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE],
          [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]]) gl.texParameteri(gl.TEXTURE_2D, kk, v);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, anhAtlas);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);
        gl.activeTexture(gl.TEXTURE0);
        const e = gl.getError();
        if (e) throw new Error('khong dua duoc atlas len GPU (' + e + ')');
        const a1 = meta.atlas_1x, AW = a1.atlas[0], AH = a1.atlas[1];
        const o = {};
        for (const kk of THU_TU_O) {
          const c = a1.cells[kk];
          if (!c) throw new Error('atlas thieu o ' + kk);
          o[kk] = [c[0] / AW, c[1] / AH, c[2] / AW, c[3] / AH];
        }
        mom = { p, u, tex, o, meta };
        gl.useProgram(p);
        gl.uniform1i(u.atl, 2); gl.uniform3fv(u.k, mau);
      },
      // Trong so o atlas cho luc khau hinh { a, b, t, mo } (mieng.json khuyen_nghi_do_mo): tm = smoothstep(.15,.6,mo);
      // mo_rong(X, m): a/e/i/o -> kin->o2 (m < .5) roi o2->X; o2/u -> kin->X; kin -> kin.
      //   hai hinh deu mo (a -> o, e -> i ...): mix(mo_rong(a, tm), mo_rong(b, tm), t)
      //   dung mot ben la kin (khep / mo moi): KHONG tron cheo kin voi hinh mo (long mom toi nua dac chong len mieng
      //   khep = mom xam trong suot) ma coi la doc do mo: mo_rong(X, tm * (b = kin ? 1 - t : t)) -> kin -> o2 -> X.
      // Tra { oc (4 o), ow (4 trong so), khoa } — toi da 4 o khac 0 (kin, o2, X_a, X_b).
      trongSo(luc) {
        const w = { kin: 0, a: 0, e: 0, i: 0, o: 0, u: 0, o2: 0 };
        const tm = smooth(.15, .6, luc ? luc.mo || 0 : 0);
        const moRong = (X, k, m) => {
          if (!k) return;
          if (!(X in w) || X === 'kin') { w.kin += k; return; }
          if (X === 'o2' || X === 'u') { w.kin += k * (1 - m); w[X] += k * m; return; }
          if (m < .5) { w.kin += k * (1 - 2 * m); w.o2 += k * 2 * m; } else { w.o2 += k * (2 - 2 * m); w[X] += k * (2 * m - 1); }
        };
        const tt = luc ? Math.max(0, Math.min(1, luc.t || 0)) : 0;
        const A = luc ? luc.a : 'kin', B = luc ? luc.b : 'kin';
        const kinA = !(A in w) || A === 'kin', kinB = !(B in w) || B === 'kin';
        if (kinA !== kinB) moRong(kinA ? B : A, 1, tm * (kinB ? 1 - tt : tt));
        else { moRong(A, 1 - tt, tm); moRong(B, tt, tm); }
        const ds = THU_TU_O.filter((x) => w[x] > 1e-4).sort((x, y) => w[y] - w[x]).slice(0, 4);
        const oc = new Float32Array(16), ow = new Float32Array(4);
        let tong = 0;
        ds.forEach((x) => { tong += w[x]; });
        ds.forEach((x, j) => { oc.set(mom ? mom.o[x] : [0, 0, 0, 0], j * 4); ow[j] = w[x] / (tong || 1); });
        if (!ds.length) { oc.set(mom ? mom.o.kin : [0, 0, 0, 0], 0); ow[0] = 1; }
        return { oc, ow, khoa: ds.length ? ds.map((x) => x + (w[x] / (tong || 1)).toFixed(3)).join('|') : 'kin1.000' };
      },
      // Tham so lop mom o khung i (trk = tracking da kiem { f, truc, G }), do hien an (0..1).
      lop(trk, i, an) {
        const f = trk.f, r = f[Math.max(0, Math.min(f.length - 1, i))];
        const s = r[2] || 1, c = Math.cos(r[3]), sn = Math.sin(r[3]);
        const kL = r.length >= 8 ? r[6] : 1, kR = r.length >= 8 ? r[7] : 1;
        const ia = c / s, ib = sn / s, tru = trk.truc;
        const G = trk.G, j = G ? Math.max(0, Math.min(G.r.length - 1, i)) : 0;
        const g = G ? [1 + G.r[j] / 1000, 1 + G.g[j] / 1000, 1 + G.b[j] / 1000, G.gx[j] / 1000] : [1, 1, 1, 0];
        // Khung bao: anh xa xuoi 4 goc + 2 diem tren truc cua o tham chieu (nua trai / phai la hai hinh binh hanh)
        const me = mom ? mom.meta : null;
        const ax = me ? me.anchor[0] : 217, ay = me ? me.anchor[1] : 249, sw = me ? me.size[0] : 135, shh = me ? me.size[1] : 63;
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        for (const [x, y] of [[ax, ay], [ax + sw, ay], [ax, ay + shh], [ax + sw, ay + shh], [tru, ay], [tru, ay + shh]]) {
          const xq = tru + (x - tru) * (x < tru ? kL : kR);
          const X = s * (c * xq - sn * y) + r[0], Y = s * (sn * xq + c * y) + r[1];
          x0 = Math.min(x0, X); y0 = Math.min(y0, Y); x1 = Math.max(x1, X); y1 = Math.max(y1, Y);
        }
        return { m: [ia, ib, -(ia * r[0] + ib * r[1]), ib * r[0] - ia * r[1]], p: [kL, kR, an, G ? G.gy[j] / 1000 : 0], g,
          truc: tru, bb: [Math.max(0, Math.floor(x0) - 2), Math.max(0, Math.floor(y0) - 2), Math.min(540, Math.ceil(x1) + 2),
            Math.min(494, Math.ceil(y1) + 2)] };
      },
      // Ve mot khung: nen (o ia, tron sang o ib theo t) + lop mom cua tung o (la / lb: bv.lop(...) hoac null, ts: trongSo).
      // Tra true neu co ve lop mom.
      ve(w, h, ia, ib, t, la, lb, ts) {
        gl.viewport(0, 0, w, h);
        gl.useProgram(pN);
        gl.uniform1i(N.a, ia); gl.uniform1i(N.b, ib); gl.uniform1f(N.t, t);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        if (!mom || !ts || !(la || lb)) return false;
        const A = la || LOP_TAT, B = lb || LOP_TAT, U = mom.u;
        const bb = [A.bb, B.bb].filter(Boolean);
        const x0 = Math.min(...bb.map((q) => q[0])), y0 = Math.min(...bb.map((q) => q[1]));
        const x1 = Math.max(...bb.map((q) => q[2])), y1 = Math.max(...bb.map((q) => q[3]));
        if (x1 <= x0 || y1 <= y0) return false;
        gl.useProgram(mom.p);
        gl.uniform1i(U.a, ia); gl.uniform1i(U.b, ib); gl.uniform1f(U.t, t);
        gl.uniform4fv(U.oc, ts.oc); gl.uniform4fv(U.ow, ts.ow);
        gl.uniform4fv(U.mA, A.m); gl.uniform4fv(U.pA, A.p); gl.uniform4fv(U.gA, A.g);
        gl.uniform4fv(U.mB, B.m); gl.uniform4fv(U.pB, B.p); gl.uniform4fv(U.gB, B.g);
        gl.uniform2f(U.tr, A.truc, B.truc);
        gl.uniform4f(U.bb, x0, y0, x1 - x0, y1 - y0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        return true;
      },
    };
    bv.datMauNen([0, 177, 64]);
    return bv;
  }

  function dungGL() {
    gl = khung.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, depth: false,
      stencil: false, powerPreference: 'low-power' });
    if (!gl) return false;
    BV = taoBoVe(gl);
    BV.datMauNen((MF && MF.mauNen) || [0, 177, 64]);
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
  // Khung dua len GPU -> nho luon chi so khung (tracking cua lop mom theo DUNG khung nay)
  function napAnh(o) {
    if (o.v.readyState < 2) return;
    gl.activeTexture(gl.TEXTURE0 + o.i);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, o.v);
    o.co = true;
    o.iK = chiSoKhung(o);
  }
  // Chi so khung dang hien (= khung texImage2D dua len) = floor(currentTime*60 + .001) + lech, lech = khung rVFC bao
  // (round(mediaTime*60)) tru floor(currentTime*60) ngay trong callback rVFC gan nhat. Do tren Chrome 153 (doc lai
  // texture qua FBO, so voi khung ffmpeg): currentTime mot minh cham 2 khung o ~55% so lan; rVFC mot minh dung 98%
  // (sai khi rVFC gop khung), currentTime + lech dung 99%. Chua co rVFC cho nguon nay: lech 0.
  function chiSoKhung(o) {
    const fps = (MF && MF.fps) || 60;
    return Math.max(0, Math.floor(o.v.currentTime * fps + .001) + (o.lech || 0));
  }

  // -------------------------------------------------------------------------
  // LOP MOM: hinh mieng theo tieng + tracking theo khung
  // -------------------------------------------------------------------------
  const LUC_KIN = { a: 'kin', b: 'kin', t: 0, mo: 0, co: false };
  // Dong ho tieng Sensei: t = thoi diem AudioContext cua mau dang ra loa (SenseiKhauHinh.bayGio: da tru do tre dau ra),
  // het = cuoi phan tieng da xep lich (audioEngine.scheduledTime). Doc truoc (t + d) chi toi het: layLuc qua cuoi du
  // lieu cua doan dang mo se chot doan do (khau-hinh.js coi la dut tieng) -> khong duoc doc vuot.
  function dongHoAm() {
    const KH = window.SenseiKhauHinh, eng = window.__audioEngine, ctx = eng && eng.outCtx;
    if (!KH || !KH.layLuc || !ctx || ctx.state !== 'running') return null;
    let t;
    try { t = KH.bayGio ? KH.bayGio(ctx) : ctx.currentTime; } catch (e) { return null; }
    if (!(t > 0)) t = ctx.currentTime;
    return { KH, t, het: +eng.scheduledTime || 0 };
  }
  const docTruoc = (d, dt) => (d.het > d.t ? Math.min(d.t + dt, d.het - .002) : d.t);
  // Tieng Sensei sap ra loa trong ~0.45 s toi (dong thoi gian da phan tich luc xep lich, truoc khi phat): coi nhu dang
  // noi som de clip kin kip len man truoc am tiet dau, va khong roi ve nghi giua hai cau lien nhau. 0.45 s >= nhip toi
  // 100 ms + play() ra khung dau 30-60 ms + tron nghi -> kin 150-200 ms (do 0.3 s + tron 200 ms: tron moi xong 82-98% luc
  // nguyen am dau ra loa). Goi dau cua luot chi xep truoc ~35 ms: vong ve xet ngay khi co goi moi (S.lich) + tron 150 ms.
  const SAP_NOI = .45;
  function sapNoi() {
    const d = dongHoAm();
    if (!d || !(d.het > d.t)) return false;
    try {
      for (let j = 0; j <= SAP_NOI / .05 + 1e-6; j++) {
        const l = d.KH.layLuc(docTruoc(d, j * .05));
        if (l && l.co && l.mo > .05) return true;
      }
    } catch (e) {}
    return false;
  }
  // Sensei da im han: loa khong keu va khong con goi tieng nao xep lich phia truoc (audioEngine.scheduledTime <= luc dang
  // ra loa). Khong co bo khau hinh / AudioContext: khong biet -> false (giu cach cu).
  function daImHan() {
    const d = dongHoAm(), eng = window.__audioEngine;
    if (!d || d.het > d.t) return false;
    return !((eng && eng.getOutputLevel ? eng.getOutputLevel() || 0 : 0) > NGUONG_NOI);
  }
  // Hinh mieng luc khung nay LEN MAN: dong ho tieng + ~1.5 khung man (canvas ve bay gio hien o lan lam tuoi sau).
  // Khong co dong thoi gian (loi thoai nhan vat phat tron clip, ...) ma loa dang keu: chi theo do to.
  function lucMieng() {
    const eng = window.__audioEngine, d = dongHoAm();
    if (d) {
      try {
        const l = d.KH.layLuc(docTruoc(d, Math.min(.04, Math.max(.01, 1.5 * (S.khungMH || 16.7) / 1000))));
        if (l && l.co) { M.am = 0; return l; }
      } catch (e) {}
    }
    if (!S.noi || !eng || !eng.getOutputLevel) { M.am = 0; return LUC_KIN; }
    // Do to -> do mo (len nhanh ~25 ms, xuong ~70 ms), hinh 'a' (qua o2 khi mo it)
    const now = performance.now(), dt = Math.min(.1, (now - (M.amLuc || now)) / 1000);
    M.amLuc = now;
    const muc = Math.max(0, Math.min(1, ((eng.getOutputLevel() || 0) - .015) / .1));
    M.am += (muc - M.am) * (1 - Math.exp(-dt / (muc > M.am ? .025 : .07)));
    return { a: 'a', b: 'a', t: 0, mo: M.am, co: false };
  }
  // Tham so lop mom cua o video (null: khong ve — clip khong phai kin / chua san / dang che mom het)
  function lopMieng(o, now) {
    const trk = o && o.co && o.ten && LA_KIN.has(o.ten) && BV && BV.coMom ? trkCua(o.ten) : null;
    if (!trk) return null;
    const r = trk.f[Math.min(trk.f.length - 1, o.iK || 0)];
    // occ = 1 (da dem 3 khung moi phia) / conf < .3: mo dan ~100 ms; khong nhan alpha voi conf
    const dich = r[5] >= 1 || r[4] < .3 ? 0 : 1;
    if (o.an == null || o.anLan !== o.lan) { o.an = dich; o.anLan = o.lan; }
    else {
      const dt = Math.min(.1, Math.max(0, now - (o.anLuc || now)) / 1000);
      o.an = dich > o.an ? Math.min(dich, o.an + dt / .1) : Math.max(dich, o.an - dt / .1);
    }
    o.anLuc = now;
    return o.an > 0 ? BV.lop(trk, o.iK || 0, o.an) : null;
  }

  function ve() {
    const cur = hienTai();
    if (!BV || S.dung || S.tinh || !cur || !cur.co) return;
    let t = 0, b = cur;
    if (S.sau) { t = Math.min(1, (performance.now() - S.sau.bd) / S.sau.ms); b = S.sau.o; }
    const tt = b.co ? t : 0, now = performance.now();
    const la = lopMieng(cur, now), lb = tt > 0 ? lopMieng(b, now) : null;
    const ts = la || lb ? BV.trongSo(lucMieng()) : null;
    M.khoaVe = ts ? ts.khoa : '';
    BV.ve(khung.width, khung.height, cur.i, b.i, tt, la, lb, ts);
    if (!S.daVe) { S.daVe = true; hienKhung(); }
    veLaser();
    if (S.sau && t >= 1) xongTron();
  }
  // Lop mom dang can ve lai theo tieng (du video khong co khung moi: man > 60 Hz, clip kin dung o hetTu cho clip sau)
  function momDong() {
    if (!BV || !BV.coMom) return false;
    const cur = hienTai();
    if (!cur || !LA_KIN.has(cur.ten) || !trkCua(cur.ten)) return false;
    if (S.noi) return true;
    const d = dongHoAm();
    let co = false;
    try { co = !!(d && d.KH.layLuc(d.t).co); } catch (e) {}
    return co || !/^kin1/.test(M.khoaVe);    // da im: ve them cho toi khi mom ve lai o 'kin'
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
    o.v.requestVideoFrameCallback((ts, md) => {
      o.rvCho = false; o.moi = true; o.rvLuc = performance.now();
      if (md && md.mediaTime >= 0 && o.rvNguon === o.the) {
        const fps = (MF && MF.fps) || 60;
        o.lech = Math.max(-3, Math.min(3, Math.round(md.mediaTime * fps) - Math.floor(o.v.currentTime * fps + .001)));
      }
      o.rvNguon = o.the;
      henRv(o);
    });
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
      const t = o.v.currentTime;
      // Clip kin chua cat duoi: dung o khung hetTu - 1 / hetTu (sau do dau cui xuong); tron cheo / clip sau di tiep tu day.
      // Tab giat lam lo qua het: lui ve khung hetTu, khong dua khung cui dau len GPU.
      if (o.hetK) {
        const k = chiSoKhung(o);
        if (k >= o.hetK - 1) {
          o.v.pause(); o.dungHet = true;
          if (k > o.hetK) { o.v.currentTime = (o.hetK + .5) / ((MF && MF.fps) || 60) - (o.lech || 0) / 60; continue; }
        }
      }
      chay = true;
      if (khiCoKhung(o, t)) nap = true;
    }
    // Goi tieng Sensei moi vua xep lich luc dang im: xet giong noi ngay, khoi doi nhip (toi 100 ms) — clip kin kip len
    // man truoc am tiet dau (goi dau cua luot thuong chi xep truoc ~35 ms + khoang lang dau goi)
    const eng = window.__audioEngine, lich = eng ? +eng.scheduledTime || 0 : 0;
    if (lich !== S.lich) { S.lich = lich; if (!S.noi && sapNoi()) nhip(true); }
    // Khong khung moi, khong tron, mom khong doi: khoi ve lai (canvas giu hinh cu, trinh duyet khoi ghep lop)
    const md = momDong();
    if (nap || S.sau || md) ve(); else if (S.chi || laserBan) veLaser();
    if (chay || S.sau || md) henVe();
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
      const con = o.hetK ? (o.hetK + 1 - chiSoKhung(o)) / ((MF && MF.fps) || 60) : o.v.duration - t;
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
      o.an = null;                           // lop mom cua luot moi: do hien lay lai theo khung dau
      o.dungHet = false; o.lech = 0;         // lech rVFC do lai cho nguon / lan tua moi (o.the vua tang)
      if (o.ten === ten && v.readyState >= 2) {
        o.hetK = hetKin(o);
        if (v.currentTime < .02 && !v.ended) return xong(true);
        v.addEventListener('seeked', () => xong(the === o.the), { once: true });
        v.currentTime = 0;
        return;
      }
      const bo = () => { v.removeEventListener('loadeddata', duoc); v.removeEventListener('error', loi); };
      const duoc = () => { bo(); kiemKhung(o); o.hetK = hetKin(o); xong(the === o.the); };
      const loi = () => {
        bo();
        if (the === o.the) { o.ten = null; if (KHO[ten]) KHO[ten].hong = true; console.warn('[MeoClip] clip hong', ten); }
        xong(false);
      };
      o.ten = ten; o.co = false; o.hetK = 0;
      v.addEventListener('loadeddata', duoc); v.addEventListener('error', loi);
      v.loop = false;
      v.src = url;
    }));
  }

  // Clip kin chua cat duoi: khung coi la het (hetTu); 0 = het video that
  function hetKin(o) {
    const t = o.ten && LA_KIN.has(o.ten) ? trkCua(o.ten) : null;
    return t && t.catDuoi ? t.het : 0;
  }
  // Tracking phai dung so khung cua chinh mp4 nay (mp4 da cat duoi / tracking cu -> bo lop mom cua clip do)
  function kiemKhung(o) {
    const t = o.ten && LA_KIN.has(o.ten) ? trkCua(o.ten) : null;
    const n = o.v.duration * ((MF && MF.fps) || 60);
    if (!t || !isFinite(n) || Math.abs(n - t.khung) <= 1.5) return;
    M.hongClip[o.ten] = true; delete M.trk[o.ten];
    console.warn('[MeoClip] tracking', o.ten, 'cho', t.khung, 'khung, video co', Math.round(n), '- bo lop mom clip nay');
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
      if (!cur || daHet(cur)) cuoiClip();
    }, 3000);
    datVao(o, ten).then((ok) => {
      if (S.muc !== m) return;
      if (!ok || S.dung) {
        S.muc = null;
        if (!ok && ten === 'nghi' && !co('nghi')) { S.nghiHong = true; capNhatTinh(); return; }
        if (!ok && cur && daHet(cur)) cuoiClip();       // clip hong: giu clip cu, chon clip khac
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
    // Clip noi het ma Sensei da im han (S.noi chi con do giu .4 s): ve nghi luon tu day (dau dang o tu the nghi), khong
    // mo them mot clip noi ~5.7 s — luc im, clip kin chi ve duoc nghi o cuoi clip (gioTuThe), meo se gat gu khep mieng
    // them toi ~4.5 s. Tieng moi toi (S.hetNoi doi) thi lai xoay clip noi nhu thuong.
    if (S.noi && (LOAI[cur.ten] === 'noi' || LOAI[cur.ten] === 'tay') && daImHan()) S.imTu = S.hetNoi;
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
  // Dang noi de chon clip: S.noi, tru khi cuoiClip da xet la im han trong luc giu .4 s nay (S.imTu)
  const dangNoi = () => S.noi && S.imTu !== S.hetNoi;
  const canDay = (now) => S.noi || S.giang || !!S.cho || !!S.chi || now - Math.max(S.hoatDong, S.mocKhac) < 1.5;
  function xoayTiep(lay) {
    for (let k = 0; k < XOAY.length; k++) {
      const j = (S.xoay + k) % XOAY.length, ten = banNoi(XOAY[j]);
      if (sanSang(ten)) { if (lay) S.xoay = j + 1; return ten; }             // chua tai xong: bo qua luot nay
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
    if (dangNoi()) return xoayTiep(lay);
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
    return cur.ten === 'nghi' ? banNoi('noi') : LOAI[cur.ten] === 'noi' ? banNoi('noi-tay-trai')
      : cur.ten === 'ngu' ? 'ngu-day' : null;
  }
  // Clip dang chay co cho yeu cau loai nay chen ngang (tron cheo) khong?
  function coTheNgat(o, loai) {
    const k = LOAI[o.ten] || 'cx';
    if (k === 'ngu') return false;                         // phai qua ngu-day (xetTuDo / keTiep)
    if (daHet(o) || o.daXet || k === 'nen' || k === 'ranh' || k === 'noi') return true;
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
    if (daHet(cur)) return cuoiClip();                     // clip het ma chua co clip tiep (vd clip tiep dang tai)
    const k = LOAI[cur.ten] || 'cx';
    if (cur.ten === 'ngu' && canDay(now)) return batDau(sanSang('ngu-day') ? 'ngu-day' : 'nghi', 250);
    if (S.cho) return xetCho();
    // nghi -> clip noi: tron 150 ms (hai tu the nghi gan trung nhau) cho kip am tiet dau; ranh / day: 200 ms
    if (dangNoi() && !cur.yeu && (k === 'nen' || k === 'ranh' || (k === 'day' && cur.tg > 3))) {
      return batDau(keTiep(true), k === 'nen' ? 150 : 200);
    }
    // Im han ~1.2 s: clip noi -> nghi; gio tay thi doi tay ha; cam xuc noi da hien du 2.5 s. Clip kin: doi them toi khi
    // dau ve gan tu the nghi (gioTuThe; mieng van khep nho lop 'kin') — dau lech toi 30-40 px giua clip, tron 200 ms
    // luc do ra hai cai dau chong nhau. Chu y thiet ke: tieng dut giua clip kin thi meo "gat gu nghe" khep mieng toi khi
    // clip ve tu the nghi (do: 0.9-1.7 s sau tieng, xau nhat ~4.5 s neu dut ngay dau clip). Khong co cho tron som: giua
    // clip noi-kin dau chi xuong <= 12 px o vai khung le roi lech lai 20-40 px (tron dai 450 ms cung ra hai cai dau); tay
    // clip thi con dang gio tay. cuoiClip bo truong hop te nhat: da im han luc het clip thi khong mo clip noi moi.
    if (!S.noi && now - S.hetNoi > .8 && ((k === 'noi' && gioTuThe(cur))
      || (k === 'tay' && !S.chi && !doanTay(cur.ten, null, cur.tg, .25) && !(cur.yeu && cur.tg < hetTay(cur.ten))
        && gioTuThe(cur))
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
    const clip = banNoi(ben === 'trai' ? 'noi-tay-phai' : 'noi-tay-trai');
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
    ten = banNoi(ten);                                       // noi-tay-* -> ban kin khi co khau hinh
    if (!S.san || !co(ten)) return false;
    const now = bayGio();
    S.mocKhac = now;
    if (S.tinh) return true;                                 // anh tinh: nhan lenh, khong co gi de dien
    const cur = hienTai();
    // Clip nay dang chay / sap chay roi: khoi xin lai (act_out thi danh dau de luat tu dong khong cat)
    const dang = cur && cur.ten === ten && !S.sau && !daHet(cur) && cur.tg < (hetGiay(cur) || 6) - 1.5 ? cur
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
      dung: S.dung, cho: S.cho ? S.cho.ten : null, chi: S.chi ? S.chi.ben : null, sau: S.sau ? S.sau.o.ten : null,
      khauHinh: M.tt, mom: M.khoaVe || null, khung: cur ? cur.iK : null };
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
        if (daHet(cur)) cuoiClip(); else cur.v.play().catch(() => {});     // clip kin dung o hetTu: khong chay tiep
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
      if (muc > NGUONG_NOI || sapNoi()) S.hetNoi = now + TRE_NOI;
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
      if (momDong()) henVe();
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
    napMieng();                  // xong (hay hong) thi tai clip noi dung (noi-kin / noi)
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
        if (BV && Array.isArray(m.mauNen)) BV.datMauNen(m.mauNen);
      }
    }).catch(() => {});
    doiCo();
    nhip(true);
  }

  // Xem thu / kiem tra: window.__senseiClip.tangToc(20) -> hen liem / ngu gat / ngu nhanh 20 lan
  window.__senseiClip = {
    S, O, KHO, api, trangThai,
    // Khau hinh: taoBoVe dung chung cho demo offline (ve dung nhu app), trkCua / banNoi / lucMieng de kiem tra
    mieng: { M, taoBoVe, trkCua, banNoi, lucMieng, get BV() { return BV; } },
    tangToc(k) { S.toc = Math.max(1, Number(k) || 1); S.henLiem = bayGio() + TG(ngauNhien(...LIEM)); return S.toc; },
  };

  if (document.body) batDau0(); else addEventListener('DOMContentLoaded', batDau0);
})();
