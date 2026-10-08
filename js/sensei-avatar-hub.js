/**
 * BO DIEU PHOI NHAN VAT SENSEI.
 *
 * app.js, slide-engine.js va tool cua Gemini chi goi window.SenseiAvatar — o day chuyen lenh toi nhan vat
 * dang hien: meo Sensei nua than dien bang clip (js/sensei-cat-video.js).
 *
 * Che do (luu o localStorage.senseiAvatarKieu, hoac tam thoi bang ?sensei=<che do> tren dia chi trang):
 *   video : meo clip — mac dinh          an : an Sensei
 * Nut tron o goc phai (dien thoai: tren thanh tren): 1 lan bam la an, bam lai hien.
 * Tep nhan vat tai loi (mat mang / hong tep) -> hien anh tinh cua meo thay (khong luu lua chon).
 *
 * Nhan vat tu dang ky bang SenseiAvatarHub.dangKy(api), api co:
 *   kieu, san, tat, an(bool), rongHienTai(), chiVao, bamVao, dienDongTac, camXuc, khiRoiMuc, trangThai, dongTacChoTu
 */
(function () {
  'use strict';

  const TEP = { 'meo-video': { src: 'js/sensei-cat-video.js' } };
  const CAN = { video: ['meo-video'], an: [] };
  const NHAN = { video: '🐱', an: '🙈' };
  const TEN = { video: 'Mèo Sensei', an: 'Đang ẩn' };
  const ANH_TINH = 'assets/sensei-meo/clip/nghi.webp';

  // Moi lan doi bo nhan vat thi tang PHIEN_BAN: may dang nho che do cu duoc dua ve mac dinh mot lan.
  // (5: bo meo 2D / meo 3D / nguoi anime, chi con meo clip -> 'that', 'meo', 'meo3d', 'ca-hai', 'nguoi' ve 'video')
  const PHIEN_BAN = '5', MAC_DINH = 'video';
  let cheDo = MAC_DINH;
  try {
    if (localStorage.getItem('senseiAvatarPhienBan') !== PHIEN_BAN) {
      localStorage.setItem('senseiAvatarPhienBan', PHIEN_BAN);
      // Nguoi da chu y an Sensei thi giu nguyen
      if (localStorage.getItem('senseiAvatarKieu') !== 'an') localStorage.setItem('senseiAvatarKieu', MAC_DINH);
    }
    cheDo = localStorage.getItem('senseiAvatarKieu') || MAC_DINH;
  } catch (e) {}
  if (!CAN[cheDo]) cheDo = MAC_DINH;
  // ?sensei=an / ?sensei=video: xem thu, khong luu lai
  const tuUrl = new URLSearchParams(location.search).get('sensei');
  if (CAN[tuUrl]) cheDo = tuUrl;
  const luuDuoc = !CAN[tuUrl];

  const ds = [];            // nhan vat da nap
  const daNap = {};         // kieu -> true khi da chen the script
  const hong = {};          // kieu -> true khi tep tai loi
  let giang = false;        // bai giang dang PLAYING (app.js bao qua trangThai)

  const dangHien = () => ds.filter((a) => !a.tat && CAN[cheDo].includes(a.kieu));

  const hub = window.SenseiAvatarHub = {
    dangKy(api) {
      ds.push(api);
      api.an(!CAN[cheDo].includes(api.kieu));
      return api;
    },
    get cheDo() { return cheDo; },
    get giang() { return giang; },
    datCheDo,
    /** Nhan vat bao khong chay duoc: danh dau hong, hien anh tinh thay */
    loi(kieu) {
      if (hong[kieu]) return;
      hong[kieu] = true;
      hienAnhTinh();
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
    /** datCo(k) — che do san khau xin co meo (1 = chuan theo man hinh) */
    datCo: (k) => { dangHien().forEach((x) => x.datCo?.(k)); },
    /** trangThai({ giang }) — bai giang dang chay hay khong (meo chi ngu gat / ngu khi khong giang). Tra ve trang thai meo. */
    trangThai(o) {
      if (o && 'giang' in o) giang = !!o.giang;
      let kq = null;
      ds.forEach((x) => { const r = x.trangThai?.(o); if (!kq && r) kq = r; });
      return Object.assign({ cheDo, giang }, kq || {});
    },
    dongTacChoTu: (r) => (ds[0] ? ds[0].dongTacChoTu(r) : null),
    get san() { return dangHien().some((x) => x.san); },
    get DANH_SACH_DONG_TAC() { return ds[0]?.DANH_SACH_DONG_TAC || []; },
    an(anDi = true) { datCheDo(anDi ? 'an' : MAC_DINH, luuDuoc); },
    _ds: ds,
  };

  function napKieu(kieu) {
    if (daNap[kieu] || !TEP[kieu]) return;
    daNap[kieu] = true;
    const sc = document.createElement('script');
    sc.src = TEP[kieu].src;
    sc.onerror = () => hub.loi(kieu);
    document.body.appendChild(sc);
  }

  // Du phong khi tep nhan vat khong tai duoc: anh tinh o goc phai tren thanh duoi (khong chua lan, khong dien)
  let anhTinh = null;
  function hienAnhTinh() {
    const hien = CAN[cheDo].some((k) => hong[k]);
    if (hien && !anhTinh) {
      anhTinh = new Image();
      anhTinh.alt = '';
      anhTinh.setAttribute('aria-hidden', 'true');
      anhTinh.src = ANH_TINH;
      Object.assign(anhTinh.style, { position: 'fixed', right: '10px', bottom: 'var(--bottom-h, 64px)', zIndex: '3',
        height: 'clamp(96px, 24vh, 220px)', pointerEvents: 'none' });
      anhTinh.onerror = () => anhTinh.remove();
      document.body.appendChild(anhTinh);
    }
    if (anhTinh) anhTinh.style.display = hien ? '' : 'none';
  }

  let nut;
  function datCheDo(moi, luu = true) {
    if (!CAN[moi]) return;
    if (luu) try { localStorage.setItem('senseiAvatarKieu', moi); } catch (e) {}
    cheDo = moi;
    CAN[moi].forEach(napKieu);
    ds.forEach((a) => a.an(!CAN[moi].includes(a.kieu)));
    hienAnhTinh();
    capNhatNut();
  }

  function capNhatNut() {
    if (!nut) return;
    const an = cheDo === 'an';
    nut.innerHTML = `<span aria-hidden="true">${NHAN[cheDo]}</span>`;
    const nhan = an ? `Hiện ${TEN[MAC_DINH]}` : `Ẩn ${TEN[cheDo]}`;
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
    // Mot lan bam: an / hien (dang xem thu bang ?sensei= thi khong luu)
    nut.addEventListener('click', () => datCheDo(cheDo === 'an' ? MAC_DINH : 'an', luuDuoc));
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
    datCheDo(cheDo, luuDuoc);
  }
  if (document.body) batDau(); else addEventListener('DOMContentLoaded', batDau);
})();
