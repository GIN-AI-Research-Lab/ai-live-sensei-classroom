/**
 * BO DIEU PHOI NHAN VAT SENSEI.
 *
 * Cho phep chay mot hoac nhieu nhan vat cung luc (de so sanh). app.js,
 * slide-engine.js va tool cua Gemini chi goi window.SenseiAvatar — o day
 * chuyen lenh do toi MOI nhan vat dang hien.
 *
 * Che do (luu o localStorage.senseiAvatarKieu, hoac tam thoi bang ?sensei=<che do> tren dia chi trang):
 *   that   : meo 3D that (dung tu anh, long nhieu lop, 23 xuong) — mac dinh
 *   video  : meo lam tu video AI (Veo), giong het anh goc
 *   ca-hai : meo 2D + meo 3D dung canh nhau      meo   : chi meo 2D
 *   meo3d  : chi meo 3D                          an    : an het
 *   nguoi  : co gai anime 3D (VRM)
 * Nut tron o goc phai (dien thoai: tren thanh tren) chi bat / tat (1 lan bam la an, bam lai hien che do
 * truoc do). Cac che do so sanh khac chi mo bang localStorage / ?sensei=.
 * Nhan vat nao nap loi (khong co WebGL, mat mang CDN, hong tep) goi hub.loi(kieu) -> tu doi sang meo 2D.
 *
 * Moi nhan vat tu dang ky bang SenseiAvatarHub.dangKy(api), api co:
 *   kieu, uuTien (so nho dung ben phai), san, tat, an(bool), rongHienTai(),
 *   chiVao, bamVao, dienDongTac, camXuc, khiRoiMuc, dongTacChoTu
 */
(function () {
  'use strict';

  const TEP = {
    meo:   { src: 'js/sensei-cat.js' },
    'meo-video': { src: 'js/sensei-cat-video.js' },
    'meo3d-that': { src: 'js/sensei-cat3d-that.js', module: true },
    meo3d: { src: 'js/sensei-cat3d.js', module: true },
    nguoi: { src: 'js/sensei-avatar.js', module: true },
  };
  const CAN = { that: ['meo3d-that'], video: ['meo-video'], 'ca-hai': ['meo', 'meo3d'], meo: ['meo'], meo3d: ['meo3d'], nguoi: ['nguoi'], an: [] };
  const NHAN = { that: '🐈', video: '🎬', 'ca-hai': '🐱🐯', meo: '🐱', meo3d: '🐯', nguoi: '🧑‍🏫', an: '🙈' };
  const TEN = { that: 'Mèo 3D', video: 'Mèo video AI', 'ca-hai': 'Cả hai mèo', meo: 'Mèo 2D', meo3d: 'Mèo 3D', nguoi: 'Người anime 3D', an: 'Đang ẩn' };

  // Moi lan them kieu nhan vat moi thi tang PHIEN_BAN: may nao dang nho che do cu
  // se duoc dua ve mac dinh moi mot lan, de thay ngay nhan vat vua them.
  // (4: nut bo vong doi che do, chi con bat / tat -> may dang o che do so sanh cung ve mac dinh)
  const PHIEN_BAN = '4', MAC_DINH = 'that';
  let cheDo = MAC_DINH;
  try {
    if (localStorage.getItem('senseiAvatarPhienBan') !== PHIEN_BAN) {
      localStorage.setItem('senseiAvatarPhienBan', PHIEN_BAN);
      // Nguoi da chu y an Sensei thi giu nguyen; chi dua cac che do khac (so sanh) ve mac dinh
      if (localStorage.getItem('senseiAvatarKieu') !== 'an') localStorage.setItem('senseiAvatarKieu', MAC_DINH);
    }
    cheDo = localStorage.getItem('senseiAvatarKieu') || MAC_DINH;
  } catch (e) {}
  if (!CAN[cheDo]) cheDo = MAC_DINH;
  // ?sensei=video ... tren dia chi trang: xem thu mot che do, khong luu lai
  const tuUrl = new URLSearchParams(location.search).get('sensei');
  if (CAN[tuUrl]) cheDo = tuUrl;
  let hienTruoc = cheDo === 'an' ? MAC_DINH : cheDo;   // che do hien lai khi bam nut lan nua

  const ds = [];            // nhan vat da nap
  const daNap = {};         // kieu -> true khi da chen the script
  const hong = {};          // kieu -> true khi nap loi (khong co WebGL / CDN / tep mo hinh)

  const dangHien = () => ds.filter((a) => !a.tat && CAN[cheDo].includes(a.kieu))
                           .sort((a, b) => (a.uuTien || 0) - (b.uuTien || 0));

  const hub = window.SenseiAvatarHub = {
    dangKy(api) {
      ds.push(api);
      api.an(!CAN[cheDo].includes(api.kieu));
      return api;
    },
    /** Thu tu cua nhan vat trong hang dang hien: 0 = sat mep phai */
    thuTu(api) { return Math.max(0, dangHien().indexOf(api)); },
    soLuong() { return dangHien().length; },
    /** Tong be rong cac nhan vat dung ben phai no (de xep hang o goc) */
    rongTruoc(api) {
      let t = 0;
      for (const a of dangHien()) { if (a === api) break; t += a.rongHienTai?.() || 0; }
      return t;
    },
    get cheDo() { return cheDo; },
    datCheDo,
    /** Nhan vat bao khong chay duoc: danh dau hong, dang hien thi thay bang meo 2D (khong luu lua chon) */
    loi(kieu) {
      if (hong[kieu]) return;
      hong[kieu] = true;
      if (CAN[cheDo].includes(kieu)) datCheDo(cheDo, false);
    },
  };

  const moiCai = (ten) => (...a) => dangHien().map((x) => x[ten]?.(...a)).some(Boolean);
  window.SenseiAvatar = {
    kieu: 'hub',
    chiVao: moiCai('chiVao'),
    bamVao: moiCai('bamVao'),
    dienDongTac: moiCai('dienDongTac'),
    camXuc: moiCai('camXuc'),
    khiRoiMuc: (...a) => { dangHien().forEach((x) => x.khiRoiMuc?.(...a)); },
    dongTacChoTu: (r) => (ds[0] ? ds[0].dongTacChoTu(r) : null),
    get san() { return dangHien().some((x) => x.san); },
    get DANH_SACH_DONG_TAC() { return ds[0]?.DANH_SACH_DONG_TAC || []; },
    an(anDi = true) { datCheDo(anDi ? 'an' : hienTruoc, !CAN[tuUrl]); },
    _ds: ds,
  };

  function napKieu(kieu) {
    if (daNap[kieu] || !TEP[kieu]) return;
    daNap[kieu] = true;
    const sc = document.createElement('script');
    if (TEP[kieu].module) sc.type = 'module';
    sc.src = TEP[kieu].src;
    // Tai khong duoc (mat mang, CDN three.js bi chan) -> doi sang nhan vat khac
    sc.onerror = () => hub.loi(kieu);
    document.body.appendChild(sc);
  }

  let nut;
  function datCheDo(moi, luu = true) {
    if (!CAN[moi]) return;
    if (luu) try { localStorage.setItem('senseiAvatarKieu', moi); } catch (e) {}
    if (moi !== 'an') hienTruoc = moi;
    // Nhan vat can dung da hong -> hien meo 2D thay (van nho lua chon goc cho lan sau)
    if (CAN[moi].some((k) => hong[k])) moi = 'meo';
    cheDo = moi;
    CAN[moi].forEach(napKieu);
    ds.forEach((a) => a.an(!CAN[moi].includes(a.kieu)));
    capNhatNut();
  }

  function capNhatNut() {
    if (!nut) return;
    const an = cheDo === 'an';
    nut.innerHTML = `<span aria-hidden="true">${NHAN[cheDo]}</span>`;
    const nhan = an ? `Hiện Sensei hoạt hình (${TEN[hienTruoc]})` : `Ẩn Sensei hoạt hình (${TEN[cheDo]})`;
    nut.title = nhan;
    nut.setAttribute('aria-label', nhan);
  }

  function taoNut() {
    nut = document.createElement('button');
    nut.type = 'button';
    // Dang nut bieu tuong chung cua app (.ctl-icon trong css/styles.css); chi vi tri dat o day.
    // Lop 4: ngay tren meo (3) nhung duoi bang sua loi, bang phan, o chat, the ron, chon bai
    nut.className = 'ctl-icon sensei-nut';
    // Dien thoai (doc <= 640px / nam ngang thap): nut noi o goc phai de len cot loa / anh / mic cua the cuoi
    // danh sach, hay ngay canh bang phan -> dat han tren thanh tren, canh nut chon bai (thanh duoi da kin cho)
    const mqTren = matchMedia('(max-width: 640px), (max-height: 500px)');
    const datViTri = () => {
      const tren = mqTren.matches && document.querySelector('.deck-top-tools');
      if (tren) {
        if (nut.parentElement !== tren) tren.insertBefore(nut, document.getElementById('pickerBtn'));
        nut.classList.add('is-tren');
        Object.assign(nut.style, { position: '', right: '', bottom: '', zIndex: '' });
        return;
      }
      if (nut.parentElement !== document.body) document.body.appendChild(nut);
      nut.classList.remove('is-tren');
      Object.assign(nut.style, { position: 'fixed', zIndex: '4' });
      const day = document.querySelector('.deck-bottom')?.offsetHeight || 64;
      nut.style.bottom = (day + 10) + 'px';
      // Bang phan mo thanh cot phai (man rong) thi dung ben trai bang, khong bi bang che. Xet theo cho that
      // cua bang (khong theo moc be ngang): man doc bang la tam o day, rong het man.
      const bang = document.body.classList.contains('co-bang') && document.getElementById('bangPhan');
      const cotPhai = bang && bang.offsetWidth > 0 && bang.offsetLeft > innerWidth * .35;
      nut.style.right = (cotPhai ? Math.max(10, innerWidth - bang.offsetLeft + 10) : 10) + 'px';
    };
    // Mot lan bam: an / hien lai che do truoc do (dang xem thu bang ?sensei= thi khong luu)
    nut.addEventListener('click', () => datCheDo(cheDo === 'an' ? hienTruoc : 'an', !CAN[tuUrl]));
    addEventListener('resize', datViTri);
    // Thanh duoi doi chieu cao (xuong dong khi mo bai, xoay may) va bang phan mo / dong
    const day = document.querySelector('.deck-bottom');
    if (day && window.ResizeObserver) new ResizeObserver(datViTri).observe(day);
    new MutationObserver(datViTri).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    datViTri();                     // gan nut vao trang (thanh tren hoac noi tren body)
    setTimeout(datViTri, 800);
  }

  function batDau() {
    taoNut();
    datCheDo(cheDo, !CAN[tuUrl]);
  }
  if (document.body) batDau(); else addEventListener('DOMContentLoaded', batDau);
})();
