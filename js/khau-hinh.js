/**
 * Khau hinh — doc tieng Sensei (PCM cua Gemini Live) ra hinh mieng cho meo clip.
 *
 * Ket noi:
 *   audio-engine xep lich moi goi PCM thi goi
 *     SenseiKhauHinh.nap(mauFloat32, thoiDiemBatDau, tanSo, audioCtx)
 *   (thoiDiemBatDau = thoi diem AudioContext ma goi do bat dau phat), va goi
 *     SenseiKhauHinh.xoa()
 *   khi dung / cat ngang tieng. Bo ve goi
 *     SenseiKhauHinh.layLuc(t)   // t = thoi gian AudioContext, nen dung bayGio()
 *   -> { a, b, t, mo, co }
 *      a, b : hai hinh mieng dang tron ('kin','a','e','i','o','u','o2'), a -> b
 *      t    : 0..1 muc tron sang b
 *      mo   : 0..1 do mo mieng (theo do to), 0 khi khep
 *      co   : true neu dong thoi gian co du lieu o thoi diem t (false -> tu dung do to,
 *             vd. luc phat loi thoai nhan vat / giong trinh duyet)
 *   bayGio() = thoi gian AudioContext cua mau DANG ra loa (tru do tre dau ra) — truyen vao layLuc.
 *
 * Cach lam (buoc 10 ms, cua so 25 ms), chay luc goi duoc xep lich — tuc la TRUOC khi phat:
 *   1. RMS + do nghieng pho (nang luong hieu so / nang luong) tren mau goc; muc tham chieu
 *      (dinh nguyen am) tu thich nghi.
 *   2. Ha tan so xuong ~12 kHz (loc FIR), nhan manh cao tan, cua so Hamming, LPC bac 12
 *      (tu tuong quan + Levinson), giai nghiem da thuc (Laguerre) -> cong huong
 *      (tan so + bang thong) -> F1, F2 (+ F3 de bu giong).
 *   3. Nhan tho moi buoc: im -> kin; am mui (m n ng: cong huong thap ~250 Hz, vung 1-2 kHz bi
 *      nuot) -> kin; xat vo thanh (s x ch th) -> 'i' nho; khong doc duoc cong huong (h, dau
 *      nguyen am) -> theo hang xom; con lai la nguyen am -> tam F1/F2 gan nhat (thang Bark,
 *      tam do tren giong Charon cho tieng Viet + tieng Nhat, co gian theo F3 neu giong khac),
 *      co tre (hysteresis) khi doi nguyen am, tre lon hon khi tieng nho (duoi van).
 *   4. Chot: moi lan nap tinh lai nhan cho ~300 ms cuoi (lag 30 buoc) — layLuc van doc ngay nhan
 *      tam cua cac buoc nay nen khong them tre hien thi, chi la nhan co the doi khi co them du lieu.
 *      Giu moi co tieng (Viterbi nguyen am / khep tren moi chuoi co tieng, xem giuMoi; duoi van
 *      khong co dinh thap that thi khong khep), khep moi giua hai nguyen am (muc tieng tut sau +
 *      F1 thap), buoc khong doc duoc cong huong lay theo hang xom, gop doan qua ngan (thoi luong
 *      toi thieu), tinh do mo (len nhanh, xuong cham, khep nhanh), luu theo thoi gian AudioContext.
 *
 * Pham vi 'kin' RONG HON bang viseme (m b p / ん / im): buoc giu moi khep mieng o moi tieng ri co
 * tieng tan so thap — n ng nh (dau / cuoi am tiet), l truoc nguyen am sau (lu lô lư), i ngan sau
 * ngh / qu, b hu hoa — vi LPC toan cuc khong tach duoc moi (m b) voi luoi (n ng l): dac trung m cua
 * giong Kore trung voi l cua Charon. Khung to (lv > -10 dB) bi ve khep: cau 12%, cau giu lai 16%
 * (truoc khi co buoc nay: 2-3%); doi lai khep b m p bat buoc 96% (truoc: 85%). giuMoi:false -> chi
 * con khep theo cho tut muc + am mui.
 *
 * Do tren bo TTS (Gemini TTS; bang nham lan + moc thoi gian: scratchpad lipsync/A/ketqua_*.txt).
 * "co so" = diem khi tron ngau nhien nhan nguyen am giua cac doan phat hien (muc may rui cua cach cham):
 *   Charon (giong Live cua app), moi tep mot bo moi: nguyen am keo dai 99.8% khung (tam hieu chinh tren
 *   chinh bo nay — lac quan); am tiet luyen (nhan chiem da so) 92.7%; can chinh chuoi: luyen 82.9%
 *   (co so 41%), cau giang 74.5% (co so 47%), cau giu lai khong dung de chinh 82.5% (co so 48%).
 *   Kore (giong nu, khong hieu chinh), phien chung: keo dai 86.6%, cau 74.6% (co so 49%) nho bu giong
 *   (he so 1.17); tat bu giong: cau 47.8% (co so 42%) — bu giong can ~20 s tieng moi co tac dung.
 *   Moc: nguyen am tong hop bat dau / doi a->i / tat: +3 / +10 / +3 ms; am tiet mo dau bang nguyen am
 *   hoac phu am vo thanh: mieng mo som hon tieng 10 ms (p10 -14, p90 -6).
 *   CPU (nap + chot, chia cho so buoc CO TIENG, dao dong giua cac lan do): Chrome 0.044-0.049 ms / 10 ms,
 *   Node (vm) 0.11-0.14; xau nhat (nguyen am tong hop lien tuc, Node) 0.14-0.16 ms / 10 ms — ngan sach 0.5.
 *
 * Hien som (layLuc): bien mo mieng / doi nguyen am hien som somMo (20 ms), bien khep som somKhep (0), doan khep
 * giu toi thieu khepToiThieu (50 ms) — hinh mieng di truoc tieng mot chut nhu chuan khop mieng phim (hinh som
 * <= 30 ms kho thay, tre thi thay ngay). Bo ve (sensei-cat-video.js) con tu doc truoc ~1.5 khung man cho do tre len man.
 * Do lai 2026-09-30 voi dap an doc lap (scratchpad lipsync/do: SAPI Haruka co moc viseme cua may doc cho tieng Nhat;
 * can chinh cuong buc chu -> am hoc, formant Burg rieng, cho Charon Viet / Nhat; khung 10 ms, goi 40-400 ms toi truoc
 * 80 ms): mo mieng p50 / p90 so voi tieng: Charon Viet -9 / +43 ms (truoc +6 / +70), Charon Nhat -13 / +21 (truoc +3 / +41);
 * doi nguyen am p90 Charon Nhat +21 ms (truoc +81); khep m b p (su kien) Viet 98.6%, Nhat 87.5% (khong doi).
 * Trong Chrome (app that, tre len man gia dinh 1 khung): mo mieng p50 -9 ms, khep -4, doi nguyen am 0.
 * Tep tu du, khong phu thuoc gi; chay duoc ca trong Node (vm) de do dac / dung demo:
 *   var bo = SenseiKhauHinh.taoMoi(); bo.nap(mau, 0, 24000); bo.ketThuc(); bo.layLuc(t)
 */
(function (g) {
  'use strict';

  var KHOA = ['kin', 'a', 'e', 'i', 'o', 'u', 'o2'];
  var KIN = 0, A = 1, E = 2, I = 3, O = 4, U = 5, O2 = 6;
  var XAT = 7;               // noi bo: phu am xat vo thanh -> hien 'i' mo nho
  var CHUA = 8;              // noi bo: co tieng ma khong doc duoc cong huong (h, dau nguyen am) -> lay theo hang xom
  var KHOA_RA = ['kin', 'a', 'e', 'i', 'o', 'u', 'o2', 'i', 'kin'];

  // Tam nguyen am (Hz) — [nhan, F1, F2, do rong Bark F1, do rong Bark F2 (tuy chon)].
  // Do tren giong Charon (giong Live mac dinh cua app) doc nguyen am keo dai bang Gemini TTS
  // (bo do: scratchpad lipsync/A). Cac tam cung nhan gop lai (lay tam gan nhat).
  var TAM_MAC_DINH = [
    // tieng Viet
    [A, 701, 1353],   // a
    [A, 806, 1180],   // ă
    [O2, 572, 1279],  // â
    [E, 535, 1859],   // e
    [E, 412, 2051],   // ê
    [I, 298, 2258],   // i, y
    [O, 580, 863],    // o
    [O, 439, 757],    // ô
    [O2, 430, 1126],  // ơ
    [U, 325, 748],    // u
    [O2, 282, 1249],  // ư
    // tieng Nhat
    [A, 587, 1073],   // あ
    [I, 265, 2104],   // い
    [U, 300, 1080],   // う (lien cau: F2 ~1100-1250; tam cu 284/987 do tren う keo dai qua lui)
    [E, 460, 1823],   // え
    [O, 416, 783],    // お
  ];

  var MAC_DINH = {
    buoc: 0.010,         // s — buoc phan tich
    cuaSo: 0.025,        // s — cua so LPC
    cuaSoDo: 0.020,      // s — cua so do RMS / do nghieng
    tanSoPT: 12000,      // Hz — tan so phan tich LPC (sau khi ha)
    bac: 12,             // bac LPC
    nhanManh: 0.97,      // he so nhan manh cao tan
    thamChieuDau: -22,   // dBFS — muc tieng nguyen am ban dau (tu thich nghi)
    thamChieuSan: -45,   // dBFS — muc tham chieu thap nhat
    thamChieuTha: 0.02,  // dB / buoc — toc do ha muc tham chieu khi tieng nho di
    nguongTuyetDoi: -60, // dBFS — duoi muc nay la im han
    nguongIm: 32,        // dB duoi tham chieu -> im (kin)
    treIm: 3,            // dB tre bat / tat im
    nguongXat: 0.9,      // do nghieng pho > nguong -> xat vo thanh
    rongF1: 0.5,         // Bark — do rong mac dinh cua moi tam theo F1
    rongF2: 1.2,         // Bark — ... theo F2
    tre: 0.35,           // don vi khoang cach: doi nguyen am khi nguyen am moi gan hon ngan nay
    xaNhat: 1.6,         // khoang cach toi da toi tam gan nhat; xa hon -> giu nguyen am truoc
    treNho: 0.6,         // tre them khi tieng nho (tu -6 dB den -16 dB duoi tham chieu)
    giuDuoi: -18,        // dB duoi tham chieu: khong doi nguyen am nua (chi con khep / xat)
    f2Cach: 80,          // Hz — F2 cach F1 it nhat
    f2BangRong: 450,     // Hz — F2 (> 1600 Hz) rong hon -> coi la khong co F2
    f2Yeu: 22,           // dB — F2 (> 1600 Hz) yeu hon F1 chung nay -> coi la khong co F2
    muiF1: 275,          // Hz — F1 duoi muc nay + khong co cong huong hep toi muiF2 -> am mui
    muiF2: 2450,         // Hz
    muiHep: 350,         // Hz — khong co cong huong nao duoi 2 kHz hep hon muc nay -> am mui
    toiThieu: [3, 4, 5, 4, 5, 5, 4, 3, 1], // so buoc toi thieu moi nhan (kin, a, e, i, o, u, o2, xat, chua); e / o / u 50 ms: bot nhay hinh
    lag: 30,             // so buoc cuoi con de ngo (chua chot) — du dai de thay diem nha moi sau doan giu moi ~300 ms
    // Giu moi co tieng (m n ng, b hu hoa, d g, ん): Viterbi 2 trang thai V (nguyen am) / M (khep) tren moi chuoi co tieng.
    // Bang chung M moi buoc = gmGoc + gmNghieng*(nguong - do nghieng) + gmDinh*(tan so dinh thap - ...) + gmTuongDoi*(nghieng
    // hon nguyen am to gan do ...). Do tren vung giu moi / nhan nguyen am da danh dau (bo do scratchpad lipsync/A/fix).
    giuMoi: true,
    gmGoc: -0.5,
    gmNghieng: 0.85, gmNguongNghieng: -22.5,   // dB — do nghieng pho (nang luong hieu so / nang luong): m ~ -26, u/i ~ -21, a ~ -13
    gmDinh: 0.77, gmDinhThap: 265,             // Hz — dinh bao pho LPC vung 150-500 Hz: m ~ 190, i/u/ư ~ 280-320
    gmTuongDoi: 0.8, gmTuongDoiNguong: 5,      // dB — nghieng hon nguyen am to (lv > gmMucNA) trong +-gmCua buoc cung chuoi
    gmMucNA: -12, gmCua: 25, gmMax: 3,
    gmVao: 25,           // phat vao M khong co bien khep (gan nhu cam: tranh khep o duoi van / giua nguyen am)
    gmThuong: 8,         // thuong vao M o bien khep manh
    gmRa: 6,             // phat ra M khong co bien nha
    gmTut: [3, 5],       // bien khep: muc cao tan (dB + nghieng) tut > 3 dB trong 20 ms bat dau tinh, du o 8 dB
    gmLen: [2, 5],       // bien nha: muc cao tan nhay len > 2 dB, du o 7 dB
    gmDau: 0.5,          // phat bat dau chuoi o M
    // Duoi van (nguyen am nho dan / hoi / khan truoc khi im) khong phai giu moi: khung khong co dinh bao pho thap that
    // (dinh vung 150-500 Hz ghim o bien 150 Hz — nang luong nam o F0) ma khong doc duoc cong huong, hoac da qua dinh
    // nguyen am cua chuoi ma do nghieng chua that thap / F1 van mo -> bang chung M bi chan o gmDuoiTran.
    gmDuoi: true,
    gmDuoiNghieng: -25,  // dB — do nghieng tren muc nay: khong phai giu moi (b hu hoa ~ -28, m ~ -26)
    gmDuoiF1: 380, gmDuoiNghieng2: -27.5,   // Hz, dB — F1 con mo (> 380 Hz) va do nghieng chua toi muc thanh ghi b
    gmDuoiTran: -0.5,
    gmDinhLv: -8, gmDinhTl: -22,   // dB — dinh nguyen am cua chuoi: to (lv > -8) va pho phang (nghieng > -22)
    moF1Duoi: 180, moF1Tren: 250, moF1San: 0.35,   // Hz — F1 rat thap (< ~230 Hz, giong m) thi khong ve mieng mo to
    hoCua: 12,           // so buoc moi ben de tim dinh tieng quanh cho tut (khep moi lien)
    hoSau: 5.5,          // dB — tut sau hon ca hai dinh chung nay ...
    hoF1: 330,           // Hz — ... va F1 thap hon muc nay -> khep moi (kin)
    tronNA: 0.050,       // s — thoi gian tron giua hai nguyen am
    tronKin: 0.045,      // s — thoi gian tron khi khep / mo moi (bo ve coi la doc do mo kin -> o2 -> X): 2-3 khung 60 Hz
    somMo: 0.020,        // s — bien mo mieng / doi nguyen am hien som hon tieng (layLuc doc truoc)
    somKhep: 0.000,      // s — bien khep hien som (bo tach da khep som ~10 ms: khong doi them)
    khepToiThieu: 0.05,  // s — mo som khong duoc lam doan khep hien ngan hon muc nay
    moDuoi: -30,         // dB so voi tham chieu: do mo = 0
    moTren: -8,          // dB so voi tham chieu: do mo = 1
    moXat: 0.35,         // do mo khi xat
    moLen: 0.7,          // he so len (moi buoc)
    moXuong: 0.4,        // he so xuong (moi buoc)
    moKhep: 0.65,        // he so xuong khi da khep / im (khep nhanh hon)
    giuDoan: 30,         // s — giu dong thoi gian bao lau
    toiDaBuoc: 60000,    // doan lien mach dai hon (10 phut) thi cat sang doan moi (gioi han bo nho)
    buGiong: true,       // tu co gian vung nguyen am theo giong dang noi (giong nu / giong khac Charon)
    giongGoc: 7.820,     // ln(2490 Hz): F3 trung binh cua Charon (nguyen am keo dai / luyen / cau: 2449-2552)
    buGiongCua: 2000,    // so buoc nguyen am lay trung binh dai han (~20 s tieng)
    buGiongCo: 800,      // so buoc "tin truoc" vao giong goc (co lai ve 1 khi moi nghe it)
    ghiDac: false,       // true: luu them dac trung tung buoc (F1, F2, dB...) de do dac
  };

  function bark(f) { return 26.81 * f / (1960 + f) - 0.53; }
  function lon(a, n) {
    if (n <= a.length) return a;
    var b = new a.constructor(Math.max(n, a.length * 2 | 0, 64));
    b.set(a);
    return b;
  }
  function smoothstep(a, b, x) {
    var t = (x - a) / (b - a);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return t * t * (3 - 2 * t);
  }

  // ------------------------------------------------------------------
  // Nghiem da thuc (Laguerre + ha bac + danh bong), he so thuc c[0..m], c[m] = 1
  // ------------------------------------------------------------------
  var FRAC = [0, 0.5, 0.25, 0.75, 0.13, 0.38, 0.62, 0.88, 1];
  function laguer(ar, ai, m, x) {   // x = [re, im] -> sua tai cho
    var MR = 8, MT = 10, MAXIT = MT * MR, EPSS = 1e-7;
    var xr = x[0], xi = x[1];
    for (var it = 1; it <= MAXIT; it++) {
      var br = ar[m], bi = ai[m];
      var err = Math.sqrt(br * br + bi * bi);
      var dr = 0, di = 0, fr = 0, fi = 0;
      var abx = Math.sqrt(xr * xr + xi * xi);
      for (var j = m - 1; j >= 0; j--) {
        // f = x*f + d
        var t1 = xr * fr - xi * fi + dr;
        fi = xr * fi + xi * fr + di; fr = t1;
        // d = x*d + b
        t1 = xr * dr - xi * di + br;
        di = xr * di + xi * dr + bi; dr = t1;
        // b = x*b + a[j]
        t1 = xr * br - xi * bi + ar[j];
        bi = xr * bi + xi * br + ai[j]; br = t1;
        err = Math.sqrt(br * br + bi * bi) + abx * err;
      }
      err *= EPSS;
      var bb = br * br + bi * bi;
      if (Math.sqrt(bb) <= err) break;
      // g = d/b ; h = g^2 - 2 f/b
      var gr = (dr * br + di * bi) / bb, gi = (di * br - dr * bi) / bb;
      var g2r = gr * gr - gi * gi, g2i = 2 * gr * gi;
      var fbr = (fr * br + fi * bi) / bb, fbi = (fi * br - fr * bi) / bb;
      var hr = g2r - 2 * fbr, hi = g2i - 2 * fbi;
      // sq = sqrt((m-1)*(m*h - g2))
      var qr = (m - 1) * (m * hr - g2r), qi = (m - 1) * (m * hi - g2i);
      var qm = Math.sqrt(qr * qr + qi * qi);
      var sr = Math.sqrt(Math.max(0, (qm + qr) / 2));
      var si = Math.sqrt(Math.max(0, (qm - qr) / 2));
      if (qi < 0) si = -si;
      var gpr = gr + sr, gpi = gi + si, gmr = gr - sr, gmi = gi - si;
      var abp = Math.sqrt(gpr * gpr + gpi * gpi), abm = Math.sqrt(gmr * gmr + gmi * gmi);
      if (abp < abm) { gpr = gmr; gpi = gmi; }
      var dxr, dxi, mx = Math.max(abp, abm);
      if (mx > 0) {
        var den = gpr * gpr + gpi * gpi;
        dxr = m * gpr / den; dxi = -m * gpi / den;
      } else {
        dxr = (1 + abx) * Math.cos(it); dxi = (1 + abx) * Math.sin(it);
      }
      var x1r = xr - dxr, x1i = xi - dxi;
      if (x1r === xr && x1i === xi) break;
      if (it % MT) { xr = x1r; xi = x1i; }
      else { var fr2 = FRAC[(it / MT) | 0]; xr -= fr2 * dxr; xi -= fr2 * dxi; }
    }
    x[0] = xr; x[1] = xi;
  }

  function taoGiaiNghiem(bacToiDa) {
    var n1 = bacToiDa + 1;
    var adr = new Float64Array(n1), adi = new Float64Array(n1);
    var cr = new Float64Array(n1), ci = new Float64Array(n1);
    var x = [0, 0];
    var rr = new Float64Array(bacToiDa), ri = new Float64Array(bacToiDa);
    var kq = { re: rr, im: ri, n: 0 };   // dung lai moi lan goi (khong cap phat trong vong nong)
    // c: he so thuc c[0..m]; tra ve so nghiem, nghiem trong rr/ri
    return function (c, m) {
      for (var j = 0; j <= m; j++) { adr[j] = c[j]; adi[j] = 0; cr[j] = c[j]; ci[j] = 0; }
      for (j = m; j >= 1; j--) {
        x[0] = 0; x[1] = 0;
        laguer(adr, adi, j, x);
        if (Math.abs(x[1]) <= 2e-7 * Math.abs(x[0])) x[1] = 0;
        rr[j - 1] = x[0]; ri[j - 1] = x[1];
        // ha bac
        var br = adr[j], bi = adi[j];
        for (var jj = j - 1; jj >= 0; jj--) {
          var tr = adr[jj], ti = adi[jj];
          adr[jj] = br; adi[jj] = bi;
          var nbr = x[0] * br - x[1] * bi + tr;
          bi = x[0] * bi + x[1] * br + ti; br = nbr;
        }
      }
      // danh bong tren da thuc goc
      for (j = 0; j < m; j++) {
        x[0] = rr[j]; x[1] = ri[j];
        laguer(cr, ci, m, x);
        rr[j] = x[0]; ri[j] = x[1];
      }
      kq.n = m;
      return kq;
    };
  }

  // ------------------------------------------------------------------
  // Bo phan tich
  // ------------------------------------------------------------------
  function taoBo(tuyChon) {
    var P = {};
    var k;
    for (k in MAC_DINH) P[k] = MAC_DINH[k];
    if (tuyChon) for (k in tuyChon) if (k !== 'tam') P[k] = tuyChon[k];
    var TAM = (tuyChon && tuyChon.tam) || TAM_MAC_DINH;

    var giai = taoGiaiNghiem(24);
    var tamB = [];          // tam o thang Bark
    function dungTam() {
      // [nhan, Bark F1, Bark F2, do rong F1, do rong F2, la nguyen am sau tron moi]
      tamB = TAM.map(function (r) {
        return [r[0], bark(r[1]), bark(r[2]), r[3] || P.rongF1, r[4] || P.rongF2, (r[0] === O || r[0] === U) && r[2] < 1100 ? 1 : 0];
      });
    }
    dungTam();

    // cac hang so theo tan so vao (tinh lai khi tan so doi)
    var S = null;
    function hangSo(sr) {
      if (S && S.sr === sr) return S;
      var D = Math.max(1, Math.round(sr / P.tanSoPT));
      var fsA = sr / D;
      var hop = Math.round(P.buoc * sr);
      var winA = Math.round(P.cuaSo * fsA);
      var winDo = Math.round(P.cuaSoDo * sr);
      // bo loc FIR thong thap (Blackman-sinc) de ha tan so
      var L = D > 1 ? 8 * D + 1 : 1;
      var h = new Float64Array(L);
      if (D > 1) {
        var fc = 0.42 / D, tong = 0;
        for (var i = 0; i < L; i++) {
          var n = i - (L - 1) / 2;
          var s = n === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * n) / (Math.PI * n);
          var w = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (L - 1)) + 0.08 * Math.cos(4 * Math.PI * i / (L - 1));
          h[i] = s * w; tong += h[i];
        }
        for (i = 0; i < L; i++) h[i] /= tong;
      } else h[0] = 1;
      var ham = new Float64Array(winA);
      for (i = 0; i < winA; i++) ham[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (winA - 1));
      var p = P.bac;
      var lagW = new Float64Array(p + 1);
      for (i = 0; i <= p; i++) { var a0 = 2 * Math.PI * 40 * i / fsA; lagW[i] = Math.exp(-0.5 * a0 * a0); }
      // luoi 150-500 Hz (10 Hz) de tim dinh bao pho vung thap: bang cos/sin san
      var nLuoi = 36, luoiF = new Float64Array(nLuoi);
      var luoiCos = new Float64Array(nLuoi * (p + 1)), luoiSin = new Float64Array(nLuoi * (p + 1));
      for (var q = 0; q < nLuoi; q++) {
        luoiF[q] = 150 + 10 * q;
        for (i = 0; i <= p; i++) {
          var wq = 2 * Math.PI * luoiF[q] / fsA * i;
          luoiCos[q * (p + 1) + i] = Math.cos(wq); luoiSin[q * (p + 1) + i] = Math.sin(wq);
        }
      }
      // mau goc can cho mot buoc: tam +- (winA*D/2 + L/2)
      var nuaCan = Math.ceil(Math.max(winA * D / 2 + (L - 1) / 2 + 1, winDo / 2 + 1));
      S = {
        sr: sr, D: D, fsA: fsA, hop: hop, winA: winA, winDo: winDo, L: L, h: h, ham: ham, lagW: lagW,
        nLuoi: nLuoi, luoiF: luoiF, luoiCos: luoiCos, luoiSin: luoiSin,
        nuaCan: nuaCan,
        tam: new Float64Array(2 * nuaCan + 2),
        y: new Float64Array(winA), r: new Float64Array(p + 1),
        a: new Float64Array(p + 1), a2: new Float64Array(p + 1), c: new Float64Array(p + 1),
        ds: new Float64Array(2 * p + 2),
      };
      return S;
    }

    var doanDs = [];        // cac doan (lien mach) — cu -> moi
    var doanMo = null;      // doan dang nhan them mau
    var ref = P.thamChieuDau;
    var heSo = 1, tbGiong = P.giongGoc, soGiong = 0;   // bu giong (co gian tan so cong huong)
    var ctxAm = null;
    var thongKe = { buoc: 0, ms: 0 };   // so buoc da tinh + thoi gian CPU (ms)
    var dem = (typeof performance !== 'undefined' && performance.now) ? function () { return performance.now(); } : Date.now;

    function moDoan(t0, sr) {
      var C = hangSo(sr);
      var d = {
        t0: t0, sr: sr, n: 0, K: 0, chot: 0, dong: false, buoc: C.hop / sr,
        buf: new Float32Array(Math.max(4096, 4 * C.nuaCan)), bufDau: 0, bufLen: 0,
        tho: new Int8Array(256), nhan: new Int8Array(256), mo: new Float32Array(256),
        lv: new Float32Array(256), kc: new Float32Array(256), fa: new Float32Array(256),
        db: new Float32Array(256), tl: new Float32Array(256), pf: new Float32Array(256),
        vo: new Int8Array(256), mm: new Int8Array(256), dd: new Int8Array(256),
        f1: P.ghiDac ? new Float32Array(256) : null, f2: P.ghiDac ? new Float32Array(256) : null,
        ng: P.ghiDac ? new Float32Array(256) : null,
        thoTruoc: KIN, naTruoc: KIN,
      };
      doanDs.push(d);
      doanMo = d;
      return d;
    }

    function themMau(d, x) {
      // bo mau cu khong con can (truoc tam buoc ke tiep - nuaCan)
      var C = S;
      var canTu = Math.floor((d.K + 0.5) * C.hop) - C.nuaCan - 2;
      if (canTu > d.bufDau) {
        var bo = Math.min(canTu - d.bufDau, d.bufLen);
        if (bo > 0) {
          d.buf.copyWithin(0, bo, d.bufLen);
          d.bufLen -= bo; d.bufDau += bo;
        }
      }
      if (d.bufLen + x.length > d.buf.length) {
        var b = new Float32Array(Math.max(d.buf.length * 2, d.bufLen + x.length + 1024));
        b.set(d.buf.subarray(0, d.bufLen));
        d.buf = b;
      }
      d.buf.set(x, d.bufLen);
      d.bufLen += x.length;
      d.n += x.length;
    }

    // chep doan mau goc [tu, tu+len) (chi so tuyet doi trong doan) vao C.tam, ngoai vung = 0
    function layMau(d, tu, len) {
      var C = S, out = C.tam;
      for (var i = 0; i < len; i++) {
        var j = tu + i - d.bufDau;
        out[i] = (j >= 0 && j < d.bufLen && tu + i < d.n) ? d.buf[j] : 0;
      }
      return out;
    }

    // --------------------------------------------------------------
    // Mot buoc phan tich -> nhan tho
    // --------------------------------------------------------------
    var ketQuaF = [0, 0, 0, 0, 0];   // F1, F2, sau (khong co F2), mui (am mui), F3
    var ungVienCuoi = null;
    var dinhThapCuoi = 0;            // Hz — dinh bao pho LPC vung 150-500 Hz cua buoc vua tinh (0: khong co)
    // bien do (dB) cua bao pho LPC 1/|A(e^jw)|^2 tai tan so f
    function bienDo(a, p, f, fs) {
      var w = 2 * Math.PI * f / fs, re = 0, im = 0;
      for (var i = 0; i <= p; i++) { re += a[i] * Math.cos(w * i); im -= a[i] * Math.sin(w * i); }
      return -10 * Math.log10(re * re + im * im + 1e-20);
    }
    function formant(d, tam) {
      var C = S, p = P.bac, i, j;
      dinhThapCuoi = 0;
      var tu = tam - C.nuaCan;
      var x = layMau(d, tu, 2 * C.nuaCan + 1);
      // ha tan so: y[j] = sum h[m] x[goc + D*j + m]
      var goc = C.nuaCan - Math.floor(C.winA * C.D / 2) - (C.L - 1) / 2;
      var y = C.y, h = C.h, L = C.L, D = C.D, winA = C.winA;
      for (j = 0; j < winA; j++) {
        var s = 0, b0 = goc + D * j;
        for (var m = 0; m < L; m++) s += h[m] * x[b0 + m];
        y[j] = s;
      }
      // nhan manh + cua so (lui tu cuoi ve dau de dung y[j-1] goc)
      for (j = winA - 1; j > 0; j--) y[j] = (y[j] - P.nhanManh * y[j - 1]) * C.ham[j];
      y[0] = y[0] * (1 - P.nhanManh) * C.ham[0];
      // tu tuong quan
      var r = C.r;
      for (i = 0; i <= p; i++) {
        var acc = 0;
        for (j = i; j < winA; j++) acc += y[j] * y[j - i];
        r[i] = acc * C.lagW[i];
      }
      if (r[0] <= 1e-12) return null;
      r[0] *= 1.0001;
      // Levinson-Durbin
      var a = C.a, a2 = C.a2, e = r[0];
      a[0] = 1;
      for (i = 1; i <= p; i++) a[i] = 0;
      for (i = 1; i <= p; i++) {
        var acc2 = r[i];
        for (j = 1; j < i; j++) acc2 += a[j] * r[i - j];
        var kk = -acc2 / e;
        for (j = 1; j < i; j++) a2[j] = a[j] + kk * a[i - j];
        for (j = 1; j < i; j++) a[j] = a2[j];
        a[i] = kk;
        e *= (1 - kk * kk);
        if (e <= 0) return null;
      }
      // dinh bao pho vung thap: giu moi (m, b hu hoa) cong huong ~150-250 Hz, i / u / ư ~270-330 Hz
      var pwMin = 1e30, lc = C.luoiCos, ls = C.luoiSin, p1 = p + 1;
      for (var q = 0; q < C.nLuoi; q++) {
        var cr = 0, ci = 0, o = q * p1;
        for (i = 0; i <= p; i++) { cr += a[i] * lc[o + i]; ci += a[i] * ls[o + i]; }
        var pw = cr * cr + ci * ci;
        if (pw < pwMin) { pwMin = pw; dinhThapCuoi = C.luoiF[q]; }
      }
      // da thuc z^p + a1 z^(p-1) + ... + ap  -> c[i] = a[p-i]
      var c = C.c;
      for (i = 0; i <= p; i++) c[i] = a[p - i];
      var ng = giai(c, p);
      // chon cong huong: tan so tang dan, bang thong hep
      var fs = C.fsA, ds = C.ds, nds = 0;
      for (i = 0; i < ng.n; i++) {
        var im = ng.im[i];
        if (im <= 1e-4) continue;
        var re = ng.re[i];
        var f = Math.atan2(im, re) * fs / (2 * Math.PI);
        var rad = Math.sqrt(re * re + im * im);
        var bw = -Math.log(rad) * fs / Math.PI;
        if (f < 150 || f > fs / 2 - 250 || bw > 700) continue;
        ds[nds++] = f; ds[nds++] = bw;
      }
      // sap xep theo tan so (it phan tu — chen)
      var nn = nds / 2;
      for (i = 1; i < nn; i++) {
        var fi = ds[2 * i], bi = ds[2 * i + 1];
        for (j = i - 1; j >= 0 && ds[2 * j] > fi; j--) { ds[2 * j + 2] = ds[2 * j]; ds[2 * j + 3] = ds[2 * j + 1]; }
        ds[2 * j + 2] = fi; ds[2 * j + 3] = bi;
      }
      if (P.ghiDac) {
        ungVienCuoi = [];
        for (i = 0; i < nn; i++) ungVienCuoi.push(Math.round(ds[2 * i]), Math.round(ds[2 * i + 1]), +bienDo(a, p, ds[2 * i], fs).toFixed(1));
      }
      // F1: cong huong thap nhat hop le; F2: cong huong ke tiep (co the sat F1 voi nguyen am sau)
      var F1 = 0, F2 = 0, aF1 = 0, sau = 0, iF1 = -1, iF2 = -1;
      for (i = 0; i < nn; i++) {
        var fq = ds[2 * i], bq = ds[2 * i + 1];
        if (fq >= 200 && fq <= 1100 && bq < 500) { F1 = fq; iF1 = i; break; }
      }
      // am mui (m n ng — voi m la khep moi): moi cong huong duoi 2 kHz deu rong, hoac F1 rat thap
      // ma tu F1 toi ~2.4 kHz khong co cong huong hep nao (phan cong huong cua khoang mui nuot mat)
      // (h bat hoi cung khong co cong huong hep duoi 2 kHz nhung khong co cong huong mui thap ~250 Hz)
      var hepDuoi = 0, hepGiua = 0, thap = 0;
      for (i = 0; i < nn; i++) {
        var fm = ds[2 * i], bm = ds[2 * i + 1];
        if (fm < 2000 && bm < P.muiHep) hepDuoi++;
        if (fm < 350) thap++;
        if (F1 && fm > F1 + P.f2Cach && fm < P.muiF2 * heSo && bm < 400) hepGiua++;
      }
      ketQuaF[3] = ((!hepDuoi && thap) || (F1 && F1 < P.muiF1 * heSo && !hepGiua)) ? 1 : 0;
      if (ketQuaF[3]) { ketQuaF[0] = F1; ketQuaF[1] = 0; ketQuaF[2] = 0; return ketQuaF; }
      if (!F1) return null;
      aF1 = bienDo(a, p, F1, fs);
      for (i = iF1 + 1; i < nn; i++) {
        var f2 = ds[2 * i], b2 = ds[2 * i + 1];
        if (f2 < F1 + P.f2Cach || f2 < 500 || f2 > 3200 || b2 >= 650) continue;
        // F2 cao ma yeu / rong -> thuc ra la F3, F2 that da nhap vao F1 (nguyen am sau tron moi: u, o)
        if (f2 > 1600 && (b2 > P.f2BangRong || aF1 - bienDo(a, p, f2, fs) > P.f2Yeu)) { sau = 1; break; }
        F2 = f2; iF2 = i; break;
      }
      if (!F2) sau = 1;
      // F3 (it doi theo nguyen am, doi theo do dai thanh quan) — dung de bu giong
      var F3 = 0;
      if (F2) for (i = iF2 + 1; i < nn; i++) {
        var f3 = ds[2 * i];
        if (f3 > F2 + 250 && f3 < 3900 && ds[2 * i + 1] < 500) { F3 = f3; break; }
      }
      ketQuaF[2] = sau;
      ketQuaF[4] = F3;
      if (sau) F2 = 0;
      ketQuaF[0] = F1; ketQuaF[1] = F2;
      return ketQuaF;
    }

    // tra ve nhan; kcCuoi = khoang cach toi tam thang
    var kcCuoi = 0;
    function phanLoai(F1, F2, sau, truoc, lv) {
      var b1 = bark(F1), b2 = sau ? 0 : bark(F2);
      var tot = -1, dTot = 1e9, dTruoc = 1e9;
      for (var i = 0; i < tamB.length; i++) {
        var t = tamB[i];
        if (sau && !t[5]) continue;          // khong co F2 -> chi xet nguyen am sau tron moi
        var x1 = (b1 - t[1]) / t[3], x2 = sau ? 0 : (b2 - t[2]) / t[4];
        var dd = Math.sqrt(x1 * x1 + x2 * x2);
        if (dd < dTot) { dTot = dd; tot = t[0]; }
        if (t[0] === truoc && dd < dTruoc) dTruoc = dd;
      }
      var laNA = truoc >= A && truoc <= O2;
      if (laNA && tot !== truoc) {
        // qua xa moi tam (cong huong sai) hoac tieng dang nho dan (duoi van: hoi, khan) -> giu nguyen am truoc
        if (dTot > P.xaNhat || lv < P.giuDuoi) { kcCuoi = dTruoc; return truoc; }
        // tre: giu nguyen am truoc neu no chi xa hon mot chut; tieng cang nho, tre cang lon
        var nho = (-lv - 6) / 10;
        var tre = P.tre + P.treNho * (nho < 0 ? 0 : nho > 1 ? 1 : nho);
        if (dTruoc - dTot < tre) { kcCuoi = dTruoc; return truoc; }
      }
      kcCuoi = dTot;
      return tot;
    }

    function tinhBuoc(d, dongLai) {
      var C = S;
      var t0 = dem();
      var maxK = dongLai ? Math.ceil(d.n / C.hop) : Math.floor((d.n - C.nuaCan - 1) / C.hop - 0.5) + 1;
      if (maxK <= d.K) return;
      var n = maxK;
      d.tho = lon(d.tho, n); d.nhan = lon(d.nhan, n); d.mo = lon(d.mo, n);
      d.lv = lon(d.lv, n); d.kc = lon(d.kc, n); d.fa = lon(d.fa, n);
      d.db = lon(d.db, n); d.tl = lon(d.tl, n); d.pf = lon(d.pf, n); d.vo = lon(d.vo, n); d.mm = lon(d.mm, n); d.dd = lon(d.dd, n);
      if (P.ghiDac) { d.f1 = lon(d.f1, n); d.f2 = lon(d.f2, n); d.ng = lon(d.ng, n); }
      for (var kk = d.K; kk < maxK; kk++) {
        var tam = Math.floor((kk + 0.5) * C.hop);
        // RMS + do nghieng pho tren cua so do
        var nua = C.winDo >> 1;
        var x = layMau(d, tam - nua - 1, C.winDo + 1);
        var e = 0, ed = 0;
        for (var i = 1; i <= C.winDo; i++) { var v = x[i], dv = v - x[i - 1]; e += v * v; ed += dv * dv; }
        var db = 10 * Math.log10(e / C.winDo + 1e-12);
        var ngh = ed / (e + 1e-12);
        // nhan truoc de so tre: qua cac buoc CHUA (h, dau van) van nho nguyen am truoc -> duoi van nho van dong bang
        var truoc = d.thoTruoc === CHUA ? d.naTruoc : d.thoTruoc;
        var f = null;
        dinhThapCuoi = 0;
        // muc tham chieu (dB nguyen am manh) — len nhanh, xuong cham
        if (db > ref) ref += 0.5 * (db - ref);
        else if (db > ref - 20) ref = Math.max(P.thamChieuSan, ref - P.thamChieuTha);
        var lv = db - ref;
        var nguong = -P.nguongIm + (d.thoTruoc === KIN ? P.treIm : -P.treIm);
        var nhan, kc = 0, F1 = 0, F2 = 0;
        if (db < P.nguongTuyetDoi || lv < nguong) nhan = KIN;
        else if (ngh > P.nguongXat) nhan = XAT;
        else {
          f = formant(d, tam);
          if (!f) nhan = CHUA;
          else if (f[3]) { nhan = KIN; F1 = f[0]; }
          else {
            F1 = f[0]; F2 = f[1];
            // bu giong: F3 gan nhu khong doi theo nguyen am ma doi theo do dai thanh quan (giong nu ~ +20%)
            // -> trung binh dai han ln F3 so voi Charon = he so co gian vung nguyen am.
            // Co lai ve 1 khi moi nghe it (tin truoc vao giong goc).
            // (bo nguyen am tron moi — F2 thap: tron moi keo F3 xuong)
            if (P.buGiong && f[4] > 0 && lv > -12 && F2 > 1100 * heSo) {
              soGiong++;
              tbGiong += (Math.log(f[4]) - tbGiong) / Math.min(soGiong, P.buGiongCua);
              var lk = (tbGiong - P.giongGoc) * soGiong / (soGiong + P.buGiongCo);
              heSo = Math.exp(lk < -0.22 ? -0.22 : lk > 0.3 ? 0.3 : lk);
            }
            nhan = phanLoai(F1 / heSo, F2 / heSo, f[2], truoc, lv); kc = kcCuoi;
          }
        }
        d.tho[kk] = nhan; d.lv[kk] = lv; d.kc[kk] = kc; d.fa[kk] = F1;
        // cho buoc giu moi: muc, do nghieng (dB), dinh thap, co tieng (khong im, khong xat)
        d.db[kk] = db; d.tl[kk] = 10 * Math.log10(ngh + 1e-9); d.pf[kk] = dinhThapCuoi;
        d.vo[kk] = (nhan === XAT || (nhan === KIN && !f)) ? 0 : 1; d.mm[kk] = 0;
        // chuoi co tieng nay da qua dinh nguyen am chua (tinh ca buoc nay) — cho luat duoi van cua giuMoi
        d.dd[kk] = d.vo[kk] && ((kk > 0 && d.vo[kk - 1] && d.dd[kk - 1]) ||
          (nhan >= A && nhan <= O2 && lv > P.gmDinhLv && d.tl[kk] > P.gmDinhTl)) ? 1 : 0;
        if (P.ghiDac) { d.f1[kk] = F1; d.f2[kk] = F2; d.ng[kk] = ngh; (d.f3 || (d.f3 = []))[kk] = f && !f[3] ? f[4] : 0; (d.uv || (d.uv = []))[kk] = ungVienCuoi; ungVienCuoi = null; }
        d.thoTruoc = nhan;
        if (nhan >= A && nhan <= O2) d.naTruoc = nhan; else if (nhan !== CHUA) d.naTruoc = KIN;
      }
      thongKe.buoc += maxK - d.K;
      d.K = maxK;
      thongKe.ms += dem() - t0;
    }

    // --------------------------------------------------------------
    // Chot nhan: gop doan ngan, tinh do mo
    // --------------------------------------------------------------
    // --------------------------------------------------------------
    // Giu moi co tieng: m n ng (dau / cuoi am tiet), b hu hoa (thanh ghi truoc khi nha), d g, ん.
    // Luc nay cong huong thap (~200 Hz) con manh ma nang luong tren ~1 kHz gan nhu mat -> mieng phai KHEP,
    // du muc tieng chi nho hon nguyen am vai dB. Moi chuoi co tieng (giua hai khoang im / xat) chay Viterbi
    // 2 trang thai V (nguyen am) / M (khep): bang chung M moi buoc tu do nghieng pho, dinh bao pho thap va do
    // nghieng so voi nguyen am to gan do; chi vao M o dau chuoi hoac o bien khep (muc cao tan tut dot ngot,
    // co thuong), ra M re o bien nha (muc cao tan nhay len). Nho vay duoi van nho dan khong bi khep som,
    // con doan m / b giua hai nguyen am thi khep tron ven tu luc khep toi luc nha.
    // --------------------------------------------------------------
    var vtV = new Int8Array(64), vtM = new Int8Array(64);   // con tro lui (dung lai)
    function catKhoang(v, a, b) { return v < a ? a : v > b ? b : v; }
    function giuMoi(d, tu, K, het) {
      var vo = d.vo, tl = d.tl, db = d.db, pf = d.pf, lv = d.lv, mm = d.mm;
      var W = P.gmCua, AM = -1e9;
      var nguongDinh = P.gmDinhThap * heSo;
      if (vtV.length < K - tu + 1) { vtV = new Int8Array(2 * (K - tu + 1)); vtM = new Int8Array(2 * (K - tu + 1)); }
      var i = tu;
      while (i < K) {
        if (!vo[i]) { mm[i] = 0; i++; continue; }
        var i0 = i, e = i;
        while (e < K && vo[e]) e++;
        // dau that cua chuoi (co the nam trong phan da chot) — chi can lui toi W buoc
        var s = i0; while (s > 0 && vo[s - 1] && i0 - s < W + 2) s--;
        var noi = i0 > 0 && vo[i0 - 1];            // noi tiep phan da chot: trang thai truoc da biet
        var sV, sM;
        if (noi) { sV = mm[i0 - 1] ? AM : 0; sM = mm[i0 - 1] ? 0 : AM; }
        else { sV = 0; sM = -P.gmDau; }
        for (var k = i0; k < e; k++) {
          var j = k - i0;
          if (k > i0 || noi) {
            var k2 = k - 2 < s ? s : k - 2;
            var D = (db[k] + tl[k]) - (db[k2] + tl[k2]);
            var eD = catKhoang((-D - P.gmTut[0]) / P.gmTut[1], 0, 1), eU = catKhoang((D - P.gmLen[0]) / P.gmLen[1], 0, 1);
            var pVM = P.gmVao * (1 - eD) - P.gmThuong * eD, pMV = P.gmRa * (1 - eU);
            var tuM = sM - pMV, tuV = sV - pVM;
            if (sV >= tuM) vtV[j] = 0; else { vtV[j] = 1; }
            var nV = sV >= tuM ? sV : tuM;
            if (sM >= tuV) vtM[j] = 1; else { vtM[j] = 0; }
            var nM = sM >= tuV ? sM : tuV;
            sV = nV; sM = nM;
          } else { vtV[j] = 0; vtM[j] = 1; }
          // bang chung M
          var tlV = -99, q0 = k - W < s ? s : k - W, q1 = k + W + 1 > e ? e : k + W + 1;
          for (var q = q0; q < q1; q++) if (lv[q] > P.gmMucNA && tl[q] > tlV) tlV = tl[q];
          if (tlV < -90) tlV = tl[k];
          var bc = P.gmGoc + P.gmNghieng * catKhoang(P.gmNguongNghieng - tl[k], -4, 4)
            + (pf[k] > 0 ? P.gmDinh * catKhoang((nguongDinh - pf[k]) / 30, -2, 2) : 0)
            + P.gmTuongDoi * catKhoang((tlV - tl[k] - P.gmTuongDoiNguong) / 2, -2, 2);
          // duoi van: khong co dinh thap that (ghim o bien 150 Hz) + (khong cong huong, hoac sau dinh nguyen am
          // ma do nghieng chua thap / F1 con mo) -> khong phai giu moi (tranh khep som 60-200 ms o cuoi a / o / u / ơ)
          if (P.gmDuoi && !(pf[k] > 150) && (d.tho[k] === CHUA || (k > 0 && vo[k - 1] && d.dd[k - 1] &&
              (tl[k] > P.gmDuoiNghieng || (d.fa[k] > P.gmDuoiF1 && tl[k] > P.gmDuoiNghieng2))))) bc = Math.min(bc, P.gmDuoiTran);
          sM += catKhoang(bc, -P.gmMax, P.gmMax);
        }
        // lan nguoc (chuoi cuoi con mo: tam thoi theo trang thai tot nhat hien gio)
        var st = sM > sV ? 1 : 0;
        for (k = e - 1; k >= i0; k--) { mm[k] = st; st = st ? vtM[k - i0] : vtV[k - i0]; }
        i = e;
      }
    }

    function chot(d, het) {
      var K = d.K;
      if (!K) return;
      // cac buoc truoc d.chot da chot — khong dong toi nua
      var tu = d.chot;
      var nhan = d.nhan, tho = d.tho, tt = P.toiThieu, lvA = d.lv;
      for (var i = tu; i < K; i++) nhan[i] = tho[i];
      // giu moi co tieng -> kin (buoc am mui ma Viterbi cho la nguyen am: de hang xom quyet)
      if (P.giuMoi) {
        giuMoi(d, tu, K, het);
        for (i = tu; i < K; i++) {
          if (d.mm[i]) nhan[i] = KIN;
          else if (nhan[i] === KIN && d.vo[i]) nhan[i] = CHUA;
        }
      }
      // khep moi giua hai nguyen am (b, m, p doc lien): muc tieng tut sau so voi ca hai ben + F1 thap
      var fa = d.fa, W = P.hoCua, sau = P.hoSau;
      for (i = tu; i < K; i++) {
        var lb0 = nhan[i];
        if (lb0 === KIN || lb0 === XAT || !(fa[i] > 0 && fa[i] < P.hoF1 * heSo)) continue;
        var trM = -99, phM = -99, jj;
        for (jj = Math.max(0, i - W); jj < i; jj++) if (lvA[jj] > trM) trM = lvA[jj];
        for (jj = i + 1; jj <= Math.min(K - 1, i + W); jj++) if (lvA[jj] > phM) phM = lvA[jj];
        if (Math.min(trM, phM) - lvA[i] > sau) nhan[i] = KIN;
      }
      // buoc co tieng ma khong doc duoc cong huong: theo nguyen am ngay sau (mieng da vao the),
      // khong co thi theo nguyen am truoc, con lai la khep. Run cuoi chua biet ben phai -> chua chot.
      var dungChot = K;
      for (i = tu; i < K;) {
        if (nhan[i] !== CHUA) { i++; continue; }
        var j0 = i;
        while (i < K && nhan[i] === CHUA) i++;
        var tr = j0 > 0 ? nhan[j0 - 1] : KIN, ph = i < K ? nhan[i] : -1;
        // nguyen am ben phai chi duoc keo ca doan khi no vung (du dai, du to): mot buoc on o muc rat nho
        // cuoi am tiet khong duoc bien duoi van thanh 'a' mo to — khi do lay nguyen am ben trai
        if (ph >= A && ph <= O2) {
          var r1 = i, lvMax = -99;
          while (r1 < K && nhan[r1] === ph) { if (lvA[r1] > lvMax) lvMax = lvA[r1]; r1++; }
          if (r1 - i < tt[ph] || lvMax < P.giuDuoi) {
            if (r1 === K && !het) dungChot = j0;       // co the con dai ra: chua chot
            if (tr >= A && tr <= O2) ph = -2;
            else if (lvMax < P.giuDuoi) ph = -2;
          }
        }
        var gan = (ph >= A && ph <= O2) ? ph : (tr >= A && tr <= O2) ? tr : (ph === XAT || tr === XAT) ? XAT : KIN;
        if (ph === -1 && !het) dungChot = j0;
        for (var j1 = j0; j1 < i; j1++) nhan[j1] = gan;
      }
      // vai luot: gop run ngan vao hang xom
      for (var luot = 0; luot < 3; luot++) {
        var doi = false;
        var i0 = tu;
        while (i0 < K) {
          var lb = nhan[i0], i1 = i0 + 1;
          while (i1 < K && nhan[i1] === lb) i1++;
          var dai = i1 - i0;
          var cuoiMo = (i1 === K && !het);   // run cuoi con dang dai ra — chua xet
          var noiTiep = (i0 === tu && tu > 0 && nhan[tu - 1] === lb);  // noi tiep run da chot
          if (dai < tt[lb] && !cuoiMo && !noiTiep) {
            var trai = i0 > 0 ? nhan[i0 - 1] : -1;
            var phai = i1 < K ? nhan[i1] : -1;
            var moi;
            if (trai < 0) moi = phai; else if (phai < 0) moi = trai;
            else if (trai === phai) moi = trai;
            else if (lb !== KIN && (trai === KIN || phai === KIN)) moi = trai === KIN ? phai : trai;
            else {
              // dai hon thi thang; kin chi thang khi ca doan la im
              var dt = 0, dp = 0, j;
              for (j = i0 - 1; j >= 0 && nhan[j] === trai; j--) dt++;
              for (j = i1; j < K && nhan[j] === phai; j++) dp++;
              moi = dt >= dp ? trai : phai;
            }
            if (moi >= 0 && moi !== lb) {
              for (j = i0; j < i1; j++) nhan[j] = moi;
              doi = true;
            }
          }
          i0 = i1;
        }
        if (!doi) break;
      }
      // do mo
      var mo = d.mo, lv = d.lv;
      var m0 = tu > 0 ? mo[tu - 1] : 0;
      for (i = tu; i < K; i++) {
        var lb2 = nhan[i], muc;
        if (lb2 === KIN) muc = 0;
        else {
          muc = smoothstep(P.moDuoi, P.moTren, lv[i]);
          if (lb2 === XAT) muc *= P.moXat;
          else if (fa[i] > 0) muc *= P.moF1San + (1 - P.moF1San) * smoothstep(P.moF1Duoi, P.moF1Tren, fa[i] / heSo);
        }
        m0 += (muc > m0 ? P.moLen : lb2 === KIN ? P.moKhep : P.moXuong) * (muc - m0);
        mo[i] = m0;
      }
      d.chot = het ? K : Math.max(d.chot, Math.min(K - P.lag, dungChot));
    }

    function dongDoan(d) {
      if (!d || d.dong) return;
      hangSo(d.sr);
      tinhBuoc(d, true);
      chot(d, true);
      d.dong = true;
      d.buf = null;
      if (doanMo === d) doanMo = null;
    }

    function donDep(tMoi) {
      while (doanDs.length > 1 && doanDs[0].dong && doanDs[0].t0 + doanDs[0].K * doanDs[0].buoc < tMoi - P.giuDoan) doanDs.shift();
    }

    // --------------------------------------------------------------
    // API
    // --------------------------------------------------------------
    function nap(x, t0, sr, ctx) {
      if (!x || !x.length || !(t0 >= 0)) return;
      sr = sr || 24000;
      if (ctx) ctxAm = ctx;
      var d = doanMo;
      // goi khong noi tiep goi truoc (dung, hut hang, doi tan so) hoac doan qua dai -> doan moi
      if (d && (d.sr !== sr || Math.abs(d.t0 + d.n / d.sr - t0) > 0.0015 || d.K > P.toiDaBuoc)) { dongDoan(d); d = null; }
      if (!d) d = moDoan(t0, sr);
      hangSo(sr);
      themMau(d, x);
      tinhBuoc(d, false);
      chot(d, false);
      donDep(t0);
    }

    function xoa() {
      doanDs = [];
      doanMo = null;
    }

    function ketThuc() { if (doanMo) dongDoan(doanMo); }

    function rong() { return { a: 'kin', b: 'kin', t: 0, mo: 0, co: false }; }
    function layLuc(t) {
      var d = null;
      for (var i = doanDs.length - 1; i >= 0; i--) {
        var di = doanDs[i];
        if (t >= di.t0) { d = di; break; }
      }
      if (!d) return rong();
      // phat da vuot het du lieu cua doan dang mo -> goi sau chac chan khong lien mach: chot luon
      if (!d.dong && t > d.t0 + d.n / d.sr) dongDoan(d);
      var buoc = d.buoc;
      var kf = (t - d.t0) / buoc;
      var k = Math.floor(kf);
      // vai ms cuoi cua goi moi nhat chua du mau de tinh (goi sau dang toi): giu buoc cuoi
      if (k >= d.K && !d.dong && d.K && t <= d.t0 + d.n / d.sr) { k = d.K - 1; kf = k + 0.5; }
      if (k >= d.K || k < 0) return rong();
      var nh = d.nhan, K = d.K;
      // Mieng di truoc tieng mot chut (nhu chuan khop mieng phim: hinh som <= 30 ms de nhin tu nhien hon tre):
      // bien mo mieng / doi nguyen am hien som P.somMo, bien khep som P.somKhep; mo sau doan khep thi som it hon de doan
      // khep hien con >= P.khepToiThieu (m b p). Doc them duoc vi nhan da tinh truoc luc phat.
      var sM = P.somMo, sK = P.somKhep;
      var W = Math.ceil(Math.max(P.tronNA, P.tronKin) / 2 / buoc) + Math.ceil(Math.max(sM, sK, 0) / buoc) + 2;
      var j0 = Math.max(1, k - W), j1 = Math.min(K - 1, k + W);
      var c = nh[j0 - 1], tot = -1, kcTot = 1e9, teTot = 0;
      for (var j = j0; j <= j1; j++) {
        if (nh[j] === nh[j - 1]) continue;
        var lech = sM;
        if (nh[j] === KIN) lech = sK;
        else if (nh[j - 1] === KIN) {
          // mo sau doan khep: som sM nhung giu doan khep hien toi thieu P.khepToiThieu (m b p phai thay ro)
          var ja = j - 1, han = Math.ceil((sM + P.khepToiThieu) / buoc) + 1;
          while (ja > 0 && nh[ja - 1] === KIN && j - ja < han) ja--;
          var dK = (j - ja) * buoc + (ja > 0 && nh[ja - 1] !== KIN ? sK : 0);
          lech = Math.min(sM, Math.max(sK, dK - P.khepToiThieu));
        }
        var te = d.t0 + j * buoc - lech;
        if (te <= t) c = nh[j];
        var kcj = Math.abs(t - te);
        if (kcj < kcTot) { kcTot = kcj; tot = j; teTot = te; }
      }
      // do mo: noi suy tuyen tinh giua tam cac buoc; lay lon hon cua hai moc doc truoc (mo som, khep khong som hon sK)
      var moTai = function (tq) {
        var u = (tq - d.t0) / buoc - 0.5, k0 = Math.floor(u), w = u - k0;
        var m0 = d.mo[Math.max(0, Math.min(K - 1, k0))], m1 = d.mo[Math.max(0, Math.min(K - 1, k0 + 1))];
        return m0 + (m1 - m0) * w;
      };
      var mo = Math.max(moTai(t + sK), moTai(t + sM));
      // bien (da doi som) gan nhat trong +- nua thoi gian tron
      var tron = P.tronNA, a = c, b = c, tb = 0;
      if (tot > 0) {
        var la = nh[tot - 1], lb = nh[tot];
        tron = (la === KIN || lb === KIN) ? P.tronKin : P.tronNA;
        if (kcTot < tron / 2) {
          a = la; b = lb;
          tb = smoothstep(0, 1, (t - (teTot - tron / 2)) / tron);
        }
      }
      return { a: KHOA_RA[a], b: KHOA_RA[b], t: tb, mo: mo, co: true };
    }

    // thoi diem AudioContext cua mau dang thuc su ra loa (tru do tre dau ra)
    function bayGio(ctx) {
      ctx = ctx || ctxAm;
      if (!ctx) return 0;
      try {
        if (ctx.getOutputTimestamp) {
          var ts = ctx.getOutputTimestamp();
          if (ts && ts.contextTime > 0 && ts.performanceTime > 0 && typeof performance !== 'undefined') {
            var tt2 = ts.contextTime + (performance.now() - ts.performanceTime) / 1000;
            // khong tin gia tri lech qua xa currentTime
            if (tt2 <= ctx.currentTime + 0.01 && tt2 > ctx.currentTime - 0.5) return tt2;
          }
        }
      } catch (e) {}
      return ctx.currentTime - (ctx.outputLatency || 0) - (ctx.baseLatency || 0);
    }

    // do dac: tra cac buoc cua moi doan
    function khung() {
      return doanDs.map(function (d) {
        var o = { t0: d.t0, buoc: d.buoc, K: d.K, nhan: Array.from(d.nhan.subarray(0, d.K)),
          tho: Array.from(d.tho.subarray(0, d.K)), mo: Array.from(d.mo.subarray(0, d.K)) };
        if (P.ghiDac) {
          o.f1 = Array.from(d.f1.subarray(0, d.K)); o.f2 = Array.from(d.f2.subarray(0, d.K));
          o.db = Array.from(d.db.subarray(0, d.K)); o.ng = Array.from(d.ng.subarray(0, d.K));
          o.lv = Array.from(d.lv.subarray(0, d.K));
          o.uv = d.uv || [];
          o.f3 = d.f3 || [];
          o.tl = Array.from(d.tl.subarray(0, d.K)); o.pf = Array.from(d.pf.subarray(0, d.K));
          o.mm = Array.from(d.mm.subarray(0, d.K)); o.vo = Array.from(d.vo.subarray(0, d.K)); o.dd = Array.from(d.dd.subarray(0, d.K));
        }
        return o;
      });
    }

    return {
      nap: nap, xoa: xoa, ketThuc: ketThuc, layLuc: layLuc, bayGio: bayGio, khung: khung,
      thongKe: function () { return { buoc: thongKe.buoc, ms: thongKe.ms, heSoGiong: heSo }; },
      thamSo: P,
      datTam: function (t) { TAM = t; dungTam(); },
    };
  }

  var chung = taoBo();
  g.SenseiKhauHinh = {
    KHOA: KHOA.slice(),
    nap: chung.nap,
    xoa: chung.xoa,
    ketThuc: chung.ketThuc,
    layLuc: chung.layLuc,
    bayGio: chung.bayGio,
    khung: chung.khung,
    thongKe: chung.thongKe,
    taoMoi: taoBo,          // bo doc lap (demo / do dac)
  };
})(typeof window !== 'undefined' ? window : globalThis);
