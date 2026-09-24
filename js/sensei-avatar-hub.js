/**
 * BO DIEU PHOI NHAN VAT SENSEI.
 *
 * Cho phep chay mot hoac nhieu nhan vat cung luc (de so sanh). app.js,
 * slide-engine.js va tool cua Gemini chi goi window.SenseiAvatar — o day
 * chuyen lenh do toi MOI nhan vat dang hien.
 *
 * Che do (luu o localStorage.senseiAvatarKieu):
 *   ca-hai : meo 2D + meo 3D dung canh nhau      meo   : chi meo 2D
 *   meo3d  : chi meo 3D                          an    : an het
 *   nguoi  : co gai anime 3D (VRM) — chi bat bang tay, khong nam trong vong bam
 *
 * Moi nhan vat tu dang ky bang SenseiAvatarHub.dangKy(api), api co:
 *   kieu, uuTien (so nho dung ben phai), san, tat, an(bool), rongHienTai(),
 *   chiVao, bamVao, dienDongTac, camXuc, khiRoiMuc, dongTacChoTu
 */
(function () {
  'use strict';

  const TEP = {
    meo:   { src: 'js/sensei-cat.js' },
    meo3d: { src: 'js/sensei-cat3d.js', module: true },
    nguoi: { src: 'js/sensei-avatar.js', module: true },
  };
  const CAN = { 'ca-hai': ['meo', 'meo3d'], meo: ['meo'], meo3d: ['meo3d'], nguoi: ['nguoi'], an: [] };
  const VONG = ['ca-hai', 'meo', 'meo3d', 'an'];
  const NHAN = { 'ca-hai': '🐱🐯', meo: '🐱', meo3d: '🐯', nguoi: '🧑‍🏫', an: '🙈' };
  const TEN = { 'ca-hai': 'Cả hai mèo', meo: 'Mèo 2D', meo3d: 'Mèo 3D', nguoi: 'Người anime 3D', an: 'Đang ẩn' };

  let cheDo = 'ca-hai';
  try { cheDo = localStorage.getItem('senseiAvatarKieu') || 'ca-hai'; } catch (e) {}
  if (!CAN[cheDo]) cheDo = 'ca-hai';

  const ds = [];            // nhan vat da nap
  const daNap = {};         // kieu -> true khi da chen the script

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
    an(anDi = true) { datCheDo(anDi ? 'an' : 'ca-hai'); },
    _ds: ds,
  };

  function napKieu(kieu) {
    if (daNap[kieu] || !TEP[kieu]) return;
    daNap[kieu] = true;
    const sc = document.createElement('script');
    if (TEP[kieu].module) sc.type = 'module';
    sc.src = TEP[kieu].src;
    document.body.appendChild(sc);
  }

  let nut;
  function datCheDo(moi) {
    if (!CAN[moi]) return;
    cheDo = moi;
    try { localStorage.setItem('senseiAvatarKieu', moi); } catch (e) {}
    CAN[moi].forEach(napKieu);
    ds.forEach((a) => a.an(!CAN[moi].includes(a.kieu)));
    if (nut) { nut.textContent = NHAN[moi]; nut.title = `Sensei hoạt hình: ${TEN[moi]} (bấm để đổi)`; }
  }

  function taoNut() {
    nut = document.createElement('button');
    nut.type = 'button';
    Object.assign(nut.style, { position: 'fixed', right: '10px', zIndex: '87', minWidth: '34px', height: '34px',
      padding: '0 6px', borderRadius: '17px', border: '1px solid rgba(0,0,0,.12)',
      background: 'rgba(255,255,255,.88)', fontSize: '16px', cursor: 'pointer',
      boxShadow: '0 2px 6px rgba(0,0,0,.12)' });
    const datViTri = () => {
      const day = document.querySelector('.deck-bottom')?.offsetHeight || 64;
      nut.style.bottom = (day + 10) + 'px';
    };
    nut.addEventListener('click', () => {
      const i = VONG.indexOf(cheDo);
      datCheDo(VONG[(i + 1) % VONG.length]);
    });
    addEventListener('resize', datViTri);
    datViTri();
    setTimeout(datViTri, 800);
    document.body.appendChild(nut);
  }

  function batDau() {
    taoNut();
    datCheDo(cheDo);
  }
  if (document.body) batDau(); else addEventListener('DOMContentLoaded', batDau);
})();
