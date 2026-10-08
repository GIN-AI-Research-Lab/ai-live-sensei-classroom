/**
 * Avatar noi — chan dung nhan vat hoi thoai NHEP MIENG DUNG PHAT AM, bieu cam + ngu dieu ap len hinh.
 *
 * Gom 4 phan trong mot tep (tu du; phan thuan chay duoc trong Node bang vm, xem tools/kiem_avatar.test.mjs):
 *   A. NGU DIEU (prosody): F0 (YIN, khung 25 ms) + nang luong tren PCM 24 kHz -> do cao trung vi, bien do, doc cuoi cau,
 *      nhip noi, quang nghi, dinh to.
 *   B. BIEU CAM: tron 3 nguon — the `emotion` trong giao trinh, dau cau / tro tu tieng Nhat, ngu dieu do duoc —
 *      ra 1 trong 7 bieu cam (binh_thuong vui hoi gian ngac_nhien hao_hung buon) + cuong do 0..1 + su kien
 *      ('?' '!' 'gian' 'sang' 'mo_hoi' 'nghi') co moc thoi gian.
 *   C. KHUON MAT + MIENG: doc assets/minh-hoa/nv/rig.json (tools/do_khuon_mat.py), ve chan dung len canvas 2D phu len <img>,
 *      xoa net cuoi goc bang mang da, ve mieng vector phang theo nguyen am (chuoi 120 Hz tu SenseiKhauHinh.phanTichTron).
 *   D. PHAT: vong rAF doc dong ho AudioContext (tru do tre dau ra) -> mieng / bieu cam / ky hieu truyen tranh khop tieng.
 *
 * API (chi tiet: E:\sensei-tam\gemini\HUONG-DAN-AVATAR.md):
 *   var ct = SenseiAvatarNoi.gan(imgHoacKhung, { nhanVat:'miller', lineId:'dia-n5-1-3' })  // gan mot avatar, tra ve bo dieu khien
 *   ct.go()                                   // go (khoi phuc <img> goc)
 *   SenseiAvatarNoi.phatLuot({ lineId, nhanVat, t0, pcm, ctx, text, the })   // bat dau chay khop tieng (audio-engine goi qua khiClip)
 *   SenseiAvatarNoi.khiDung()                 // tieng dung / bi cat -> moi avatar ve nghi
 *   SenseiAvatarNoi.chuanBi(lineId, pcm, {text, the, nhanVat})  // phan tich truoc (cache theo lineId)
 *   SenseiAvatarNoi.phatGia({ lineId, nhanVat, text, the })      // giong trinh duyet (khong co PCM): nhep theo kana, khong bao gio che giong
 * Chi avatar cua NGUOI DANG NOI chuyen dong; cac avatar khac giu nguyen <img>.
 */
(function (g) {
  'use strict';

  // ====================================================================================================================
  // A. NGU DIEU
  // ====================================================================================================================
  var BIEU_CAM = ['binh_thuong', 'vui', 'hoi', 'gian', 'ngac_nhien', 'hao_hung', 'buon'];

  function trungVi(a) {
    if (!a.length) return 0;
    var b = Array.prototype.slice.call(a).sort(function (x, y) { return x - y; });
    var m = b.length >> 1;
    return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2;
  }
  function phanVi(a, p) {
    if (!a.length) return 0;
    var b = Array.prototype.slice.call(a).sort(function (x, y) { return x - y; });
    return b[Math.min(b.length - 1, Math.max(0, Math.round(p * (b.length - 1))))];
  }
  function kep(v, a, b) { return v < a ? a : v > b ? b : v; }
  function banTon(f) { return 12 * Math.log(f / 100) / Math.LN2; }   // Hz -> ban cung so voi 100 Hz

  /** Ha tan so ve ~8 kHz (loc tam giac) cho YIN nhanh. */
  function ha8k(x, sr) {
    var D = Math.max(1, Math.round(sr / 8000));
    if (D === 1) return { y: x, sr: sr };
    var n = Math.floor(x.length / D), y = new Float32Array(n), h = D;   // cua so trung binh 2D - 1 diem, dang tam giac
    for (var i = 0; i < n; i++) {
      var c = i * D + (D >> 1), s = 0, w = 0;
      for (var k = -h + 1; k < h; k++) {
        var j = c + k;
        if (j < 0 || j >= x.length) continue;
        var wt = h - Math.abs(k);
        s += x[j] * wt; w += wt;
      }
      y[i] = w ? s / w : 0;
    }
    return { y: y, sr: sr / D };
  }

  /**
   * F0 bang YIN (de Cheveigne 2002) khung 25 ms, buoc 10 ms, 70-450 Hz, noi suy parabol.
   * Tra ve { hop, f0: Float32Array (0 = vo thanh), cf: do tin cay 0..1, db: Float32Array muc (dB, cua so 20 ms, tren mau goc) }.
   */
  function f0Yin(x, sr) {
    sr = sr || 24000;
    var H = 0.010;
    var n = Math.floor(x.length / (sr * H));
    var db = new Float32Array(n), f0 = new Float32Array(n), cf = new Float32Array(n);
    var w20 = Math.round(0.02 * sr), hop = Math.round(H * sr), maxDb = -200, i, j;
    for (i = 0; i < n; i++) {
      var c = i * hop + (hop >> 1), a = Math.max(0, c - (w20 >> 1)), b = Math.min(x.length, a + w20), e = 0;
      for (j = a; j < b; j++) e += x[j] * x[j];
      db[i] = 10 * Math.log10(e / Math.max(1, b - a) + 1e-12);
      if (db[i] > maxDb) maxDb = db[i];
    }
    var r = ha8k(x, sr), y = r.y, fs = r.sr;
    var W = Math.round(0.025 * fs), tMin = Math.floor(fs / 450), tMax = Math.ceil(fs / 70), step = Math.round(H * fs);
    var d = new Float32Array(tMax + 2), cm = new Float32Array(tMax + 2);
    for (i = 0; i < n; i++) {
      if (db[i] < maxDb - 38) continue;
      var s0 = i * step + (step >> 1) - (W >> 1);
      if (s0 < 0 || s0 + W + tMax >= y.length) continue;
      for (var tau = 1; tau <= tMax; tau++) {
        var acc = 0;
        for (j = 0; j < W; j++) { var df = y[s0 + j] - y[s0 + j + tau]; acc += df * df; }
        d[tau] = acc;
      }
      var run = 0; cm[0] = 1;
      for (tau = 1; tau <= tMax; tau++) { run += d[tau]; cm[tau] = run > 0 ? d[tau] * tau / run : 1; }
      var best = -1;
      for (tau = tMin; tau < tMax; tau++) {
        if (cm[tau] < 0.15) {
          while (tau + 1 < tMax && cm[tau + 1] < cm[tau]) tau++;
          best = tau; break;
        }
      }
      if (best < 0) {   // khong co duong duoi 0.15: lay cuc tieu toan cuc neu du thap
        var mn = 1e9, at = -1;
        for (tau = tMin; tau < tMax; tau++) if (cm[tau] < mn) { mn = cm[tau]; at = tau; }
        if (mn < 0.32) best = at;
      }
      if (best < 0) continue;
      var t = best, a0 = cm[t - 1], b0 = cm[t], c0 = cm[t + 1], den = a0 - 2 * b0 + c0;
      var off = Math.abs(den) > 1e-9 ? 0.5 * (a0 - c0) / den : 0;
      f0[i] = fs / (t + kep(off, -1, 1));
      cf[i] = 1 - kep(cm[best], 0, 1);
    }
    // sua nhay quang tam (F0 gap doi / nua hang xom) + bo dot vo thanh qua ngan
    fixOctave(f0);
    khuMeo(f0, 3);
    return { hop: H, f0: f0, cf: cf, db: db, maxDb: maxDb };
  }
  function fixOctave(f0) {
    var n = f0.length, i, j;
    for (var lan = 0; lan < 2; lan++) {
      for (i = 0; i < n; i++) {
        if (!f0[i]) continue;
        var nb = [];
        for (j = Math.max(0, i - 6); j <= Math.min(n - 1, i + 6); j++) if (j !== i && f0[j]) nb.push(f0[j]);
        if (nb.length < 3) continue;
        var m = trungVi(nb), r = f0[i] / m;
        if (r > 1.8 && r < 2.25) f0[i] /= 2;
        else if (r > 0.44 && r < 0.56) f0[i] *= 2;
      }
    }
  }
  function khuMeo(f0, toiThieu) {   // bo cac dot vo thanh-> co tieng < toiThieu khung
    var n = f0.length;
    for (var i = 0; i < n;) {
      if (!f0[i]) { i++; continue; }
      var e = i; while (e < n && f0[e]) e++;
      if (e - i < toiThieu) for (var j = i; j < e; j++) f0[j] = 0;
      i = e;
    }
  }

  /**
   * Dac trung ngu dieu cua mot cau. f = ket qua f0Yin. Tra ve { ok, ... } (ok=false neu qua it khung co thanh).
   * Don vi F0 la ban cung (st) so voi 100 Hz.
   */
  function dacTrungNguDieu(f, sr) {
    var H = f.hop, n = f.f0.length, i;
    var out = { ok: false, dur: n * H, hop: H, f0Yin: f };
    var thanh = [];
    for (i = 0; i < n; i++) if (f.f0[i] > 0) thanh.push(i);
    // vung co tieng theo nang luong
    var nguongNoi = f.maxDb - 28, dau = -1, cuoi = -1;
    for (i = 0; i < n; i++) if (f.db[i] > nguongNoi) { if (dau < 0) dau = i; cuoi = i; }
    out.tDau = dau < 0 ? 0 : dau * H;
    out.tCuoi = cuoi < 0 ? 0 : (cuoi + 1) * H;
    out.tNoi = Math.max(0, out.tCuoi - out.tDau);
    // nang luong
    var dbNoi = [];
    for (i = Math.max(0, dau); i <= cuoi; i++) if (f.db[i] > nguongNoi) dbNoi.push(f.db[i]);
    out.dbTrungVi = dbNoi.length ? trungVi(dbNoi) : -100;
    out.dbDinh = f.maxDb;
    out.dinhHon = f.maxDb - out.dbTrungVi;                 // dB dinh vuot muc noi binh thuong
    // quang nghi (im giua tieng >= 150 ms)
    var nghi = [];
    for (i = Math.max(0, dau); i <= cuoi;) {
      if (f.db[i] > f.maxDb - 30) { i++; continue; }
      var e = i; while (e <= cuoi && f.db[e] <= f.maxDb - 30) e++;
      if ((e - i) * H >= 0.15 && i > dau && e <= cuoi) nghi.push({ t: i * H, dur: (e - i) * H });
      i = e;
    }
    out.nghi = nghi;
    var tNghi = 0; nghi.forEach(function (q) { tNghi += q.dur; });
    // nhip noi: dem dinh cua duong bao 50 ms (am tiet / mora) tren thoi gian noi tru quang nghi
    var env = lamMuot(f.db, 5), dinh = [], thr = f.maxDb - 22;
    for (i = 2; i < n - 2; i++) {
      if (env[i] < thr || env[i] < env[i - 1] || env[i] <= env[i + 1]) continue;
      // thung lung gan nhat hai ben sau it nhat 3 dB
      var lo1 = env[i], lo2 = env[i], k;
      for (k = i - 1; k >= Math.max(0, i - 12); k--) lo1 = Math.min(lo1, env[k]);
      for (k = i + 1; k <= Math.min(n - 1, i + 12); k++) lo2 = Math.min(lo2, env[k]);
      if (env[i] - Math.max(lo1, lo2) < 3) continue;
      if (dinh.length && i * H - dinh[dinh.length - 1].t < 0.09) { if (env[i] > dinh[dinh.length - 1].db) dinh[dinh.length - 1] = { t: i * H, db: env[i] }; continue; }
      dinh.push({ t: i * H, db: env[i] });
    }
    out.dinh = dinh;
    out.nhip = out.tNoi - tNghi > 0.3 ? dinh.length / (out.tNoi - tNghi) : 0;
    // dinh to noi bat (cach dinh truoc >= 300 ms, vuot muc noi >= 6 dB)
    var to = [];
    dinh.forEach(function (q) {
      if (q.db - out.dbTrungVi < 6) return;
      if (to.length && q.t - to[to.length - 1].t < 0.3) { if (q.db > to[to.length - 1].db) to[to.length - 1] = q; return; }
      to.push(q);
    });
    out.dinhTo = to;
    // F0
    if (thanh.length < 8) return out;
    var st = new Float32Array(n), stList = [];
    for (i = 0; i < n; i++) if (f.f0[i] > 0) { st[i] = banTon(f.f0[i]); stList.push(st[i]); }
    out.ok = true;
    out.f0TrungVi = 100 * Math.pow(2, trungVi(stList) / 12);
    out.stTrungVi = trungVi(stList);
    out.bienDo = phanVi(stList, 0.9) - phanVi(stList, 0.1);            // ban cung
    out.tiLeThanh = thanh.length / Math.max(1, cuoi - dau + 1);
    // vung thanh cuoi: lay khung co thanh trong 350 ms cuoi cua vung thanh
    var last = thanh[thanh.length - 1], win = [];
    for (i = thanh.length - 1; i >= 0 && thanh[i] >= last - 35; i--) win.unshift(thanh[i]);
    // bo cac khung thuoc dot thanh truoc do neu co quang nghi lon (> 120 ms) trong cua so
    for (i = win.length - 1; i > 0; i--) if (win[i] - win[i - 1] > 12) { win = win.slice(i); break; }
    out.tCuoiThanh = (last + 1) * H;
    if (win.length >= 6) {
      var sx = 0, sy = 0, sxx = 0, sxy = 0;
      win.forEach(function (k) { var tt = k * H; sx += tt; sy += st[k]; sxx += tt * tt; sxy += tt * st[k]; });
      var m = win.length, den = m * sxx - sx * sx;
      out.doc = den > 1e-9 ? (m * sxy - sx * sy) / den : 0;           // ban cung / giay
      var dauWin = win.slice(0, Math.max(3, win.length >> 1)), cuoiWin = win.slice(-Math.max(3, Math.min(8, win.length >> 1)));
      var md = 0, mc = 0;
      dauWin.forEach(function (k) { md += st[k]; }); md /= dauWin.length;
      cuoiWin.forEach(function (k) { mc += st[k]; }); mc /= cuoiWin.length;
      out.leoCuoi = mc - md;                                           // ban cung: duong = doc len cuoi cau
      var mn = 1e9, at = win[0]; win.forEach(function (k) { if (st[k] < mn) { mn = st[k]; at = k; } });
      out.tBatDauLen = at * H;                                          // diem thap nhat trong cua so cuoi = cho bat dau len
    } else { out.doc = 0; out.leoCuoi = 0; out.tBatDauLen = out.tCuoiThanh - 0.3; }
    // mo dau: F0 6 khung thanh dau so voi khung 25-60
    var dau6 = thanh.slice(0, 6), giua = thanh.slice(Math.min(thanh.length - 1, 12), Math.min(thanh.length, 40));
    var md6 = 0; dau6.forEach(function (k) { md6 += st[k]; }); md6 /= dau6.length;
    var mg = 0; giua.forEach(function (k) { mg += st[k]; }); mg = giua.length ? mg / giua.length : md6;
    out.nhayDau = md6 - mg;
    // tang dot ngot: tang nhat trong 100 ms (>= 5 ban cung)
    var maxUp = 0, tUp = 0;
    for (i = 0; i < thanh.length; i++) {
      var k0 = thanh[i];
      for (var q = i + 1; q < thanh.length && thanh[q] - k0 <= 12; q++) {
        var up = st[thanh[q]] - st[k0];
        if (up > maxUp) { maxUp = up; tUp = k0 * H; }
      }
    }
    out.tangNhanh = maxUp; out.tTangNhanh = tUp;
    // dinh F0
    var mx = -99, tMx = 0; for (i = 0; i < thanh.length; i++) if (st[thanh[i]] > mx) { mx = st[thanh[i]]; tMx = thanh[i] * H; }
    out.tDinhF0 = tMx;
    // to ngay luc vao: muc lon nhat trong 250 ms dau cua vung noi so voi muc noi
    var mo = -200; for (i = Math.max(0, dau); i < Math.min(n, dau + 25); i++) if (f.db[i] > mo) mo = f.db[i];
    out.daoDauTo = mo - out.dbTrungVi;
    return out;
  }
  function lamMuot(a, w) {
    var n = a.length, o = new Float32Array(n), h = w >> 1;
    for (var i = 0; i < n; i++) {
      var s = 0, c = 0;
      for (var j = Math.max(0, i - h); j <= Math.min(n - 1, i + h); j++) { s += a[j]; c++; }
      o[i] = s / c;
    }
    return o;
  }

  // ====================================================================================================================
  // B. BIEU CAM
  // ====================================================================================================================
  // The `emotion` cua giao trinh (khoa cat con meo) -> bieu cam avatar + trong so + su kien kem theo
  //   bang ANH XA sang 7 tep anh bieu cam cua nhan vat: vui/chao/de_biu->vui, suy_nghi->hoi, gian->gian, ngac_nhien->ngac_nhien,
  //   buon/that_vong/xau_ho/cui_chao->buon (xau_ho co them giot mo hoi), khong co the -> binh_thuong. (hao_hung do ngu dieu/dau cau quyet dinh)
  //   w phai > 0.3 thi the moi tu quyet dinh bieu cam (nguong chon trong giaiCamXuc)
  var THE_DU_LIEU = {
    vui: { e: 'vui', w: 0.55 },
    de_biu: { e: 'vui', w: 0.35 },
    that_vong: { e: 'buon', w: 0.6 },
    ngac_nhien: { e: 'ngac_nhien', w: 0.7 },
    buon: { e: 'buon', w: 0.6 },
    gian: { e: 'gian', w: 0.7 },
    suy_nghi: { e: 'hoi', w: 0.4, su: 'nghi' },
    xau_ho: { e: 'buon', w: 0.4, su: 'mo_hoi' },
    chao: { e: 'vui', w: 0.35 },
    cui_chao: { e: 'buon', w: 0.35 },
  };
  function chuanKhoaThe(t) { return String(t || '').trim().toLowerCase().replace(/[-\s]+/g, '_'); }

  var TU = {
    vuiTu: /すごい|やった|やったー|たのしい|楽しい|おいしい|美味しい|すき|好き|うれしい|嬉しい|さいこう|最高|わあ|ありがとう|いいね|いい！|よかった|素晴らしい|すばらしい/,
    ngac: /えっ|え？|え！|ええ？|まさか|うそ|ほんとう?に?[？?！!]|本当に?[？?！!]|なに[？?！!]|何[？?！!]|なんだって|あれ|うわ|へえ|へー|あっ|ああっ/,
    gian: /ばか|バカ|馬鹿|だめ|ダメ|駄目|ひどい|酷い|ふざけ|いいかげん|いい加減|許せ|許さ|うるさい|やめ[てろ]|怒|腹が立|無礼|極まり(?:ない|な)|けしからん/,
    buon: /ざんねん|残念|かなしい|悲しい|つらい|辛い|さびしい|寂しい|悲惨|情けな|なさけな|がっかり/,
    xin: /すみません|ごめん|申し訳|もうしわけ|失礼しました/,
    nghi: /…|\.\.\.|うーん|そうですね|えっと|ええと|あのう?/,
    chao: /おはよう|こんにちは|こんばんは|はじめまして|よろしくお願い|よろしくおねがい/,
    hoiCuoi: /(?:ですか|ますか|でしょうか|かな|かしら|の|だろう|よね|でしょう|ね)$/,
  };

  /** Doc dau hieu trong cau tieng Nhat. Tra ve { diem:{emo:0..1}, hoi, cham, nghi, xin } */
  function docVanBan(text) {
    var t = String(text || '').normalize ? String(text || '').normalize('NFKC') : String(text || '');
    var s = t.replace(/\s+/g, '');
    var d = { vui: 0, hoi: 0, gian: 0, ngac_nhien: 0, hao_hung: 0, buon: 0 };
    var cham = /[!！]$/.test(s) || /[!！]/.test(s.slice(-3)), hoi = /[?？]$/.test(s) || /[?？]/.test(s.slice(-3));
    var co = {};
    if (hoi) d.hoi += 0.8;
    else if (/か[。.]?$/.test(s) && s.length > 2) d.hoi += 0.55;
    else if (/の[。.]?$/.test(s) && s.length > 4) d.hoi += 0.2;
    if (TU.ngac.test(s)) { d.ngac_nhien += cham || hoi ? 0.75 : 0.45; co.ngac = 1; }
    if (/^あ[、,！!]/.test(s)) d.ngac_nhien += 0.3;
    if (TU.gian.test(s)) d.gian += cham ? 0.75 : 0.5;
    if (TU.buon.test(s)) d.buon += 0.6;
    if (TU.xin.test(s)) { d.buon += 0.25; co.xin = 1; }
    if (cham && TU.vuiTu.test(s)) d.hao_hung += 0.7;
    else if (cham) d.hao_hung += 0.3;
    else if (TU.vuiTu.test(s)) d.vui += 0.35;
    if (TU.chao.test(s)) d.vui += 0.35;
    return { diem: d, hoi: hoi || /か[。.]?$/.test(s), cham: cham, nghi: TU.nghi.test(t), xin: !!co.xin };
  }

  function softNor() { return { f0St: null, db: null, n: 0 }; }   // nen theo nhan vat (cap nhat dan)

  /**
   * Tron the du lieu + van ban + ngu dieu ra bieu cam cuoi. pro co the null (chua co am thanh).
   * nen: { f0St, db } trung binh cac cau truoc cua chinh nhan vat (hoac null).
   * Tra ve { emotion, cuongDo, diem:{..}, nguon:{the, vanBan, nguDieu} }
   */
  function giaiCamXuc(o) {
    var S = { binh_thuong: 0.12, vui: 0, hoi: 0, gian: 0, ngac_nhien: 0, hao_hung: 0, buon: 0 }, k;
    var the = THE_DU_LIEU[chuanKhoaThe(o.the)];
    var vb = docVanBan(o.text), pro = o.pro && o.pro.ok ? o.pro : null, nen = o.nen && o.nen.n >= 3 ? o.nen : null;
    var nguon = { the: the ? the.e : null, vanBan: null, nguDieu: null };
    if (the && the.w) S[the.e] += the.w;
    for (k in vb.diem) S[k] += vb.diem[k];
    var top = function (obj) { var b = null, m = 0.3; for (var q in obj) if (q !== 'binh_thuong' && obj[q] > m) { m = obj[q]; b = q; } return b; };
    nguon.vanBan = top(vb.diem);
    var nd = { hoi: 0, hao_hung: 0, ngac_nhien: 0, gian: 0, buon: 0 };
    if (pro) {
      // cau hoi: doc len o cuoi cau (ban cung). Japanese '?' = tang >= ~2 st trong 300 ms cuoi.
      var len = Math.max(pro.leoCuoi || 0, (pro.doc || 0) * 0.25);
      if (len >= 1.5) nd.hoi += kep((len - 1.0) / 4, 0, 1) * 0.8;
      else if (pro.doc < -4 && !vb.hoi) nd.hoi -= 0.15;              // roi manh cuoi cau = khang dinh
      // hao hung: bien do F0 rong + dinh to + noi nhanh
      // (do tren SAPI + Gemini tieng Nhat: noi binh thuong bien do 6.5-10.5 st, dinh 5-11 dB, nhip 2.5-5.5/s)
      var exc = kep((pro.bienDo - 10) / 5, 0, 1) * 0.4 + kep((pro.dinhHon - 9) / 7, 0, 1) * 0.3 + kep((pro.nhip - 5) / 2.5, 0, 1) * 0.3;
      nd.hao_hung += exc * 0.8;
      // ngac nhien: nhay F0 dau cau / tang dot ngot + to ngay luc vao
      // (nhay F0 dau cau binh thuong toi +4.5 st; 'tang nhanh 100 ms' khong dung duoc vi loi quang tam / trong am tu nhien)
      var nhay = (pro.nhayDau || 0) - 4.5;
      nd.ngac_nhien += nhay > 0 ? kep(nhay / 4, 0, 1) * 0.8 + (pro.daoDauTo >= 9 ? 0.25 : 0) : 0;
      // gian: to, F0 thap hon nen / hep, it lay o cao
      var to = kep((pro.dinhHon - 8) / 6, 0, 1), thap = nen ? kep((nen.f0St - pro.stTrungVi - 1) / 3, 0, 1) : 0, hep = kep((6 - pro.bienDo) / 4, 0, 1);
      nd.gian += to * (0.35 + 0.25 * thap + 0.2 * hep);
      // buon: nho hon nen, cham, hep, roi
      var nho = nen ? kep((nen.db - pro.dbTrungVi - 3) / 6, 0, 1) : 0, cham = kep((3.0 - pro.nhip) / 2, 0, 1), roi = pro.doc < -1 ? 1 : 0;
      nd.buon += (nho * 0.3 + cham * 0.25 + hep * 0.25 + roi * 0.2) * 0.8 * (nen ? 1 : 0.5) * (1 - 0.8 * to);   // khong co nen nhan vat: chi dua vao ngu dieu thi yeu hon
      if (nd.hoi > 0.5 && exc < 0.6) nd.hao_hung *= 0.6;
      for (k in nd) if (nd[k] > 0) S[k] += nd[k];
      nguon.nguDieu = top(nd);
    }
    // chon
    var best = 'binh_thuong', bs = 0.3;
    for (k in S) if (k !== 'binh_thuong' && S[k] > bs) { bs = S[k]; best = k; }
    return { emotion: best, cuongDo: best === 'binh_thuong' ? 0 : kep(bs * 1.1, 0.25, 1), diem: S, nguon: nguon, vanBan: vb, the: the || null };
  }

  /**
   * Su kien bieu cam co moc thoi gian (giay tu luc cau bat dau):
   *   '?' sang chu, '!' , 'gian' (gan xanh + rung), 'sang' (lap lanh), 'mo_hoi' (giot mo hoi), 'nghi' (ba cham)
   * pro co the null (ke hoach dua vao van ban / do dai dur).
   */
  function suKienBieuCam(kq, pro, dur) {
    var ev = [], e = kq.emotion, vb = kq.vanBan || {}, the = kq.the, dau = pro && pro.ok ? pro.tDau : 0, cuoi = pro && pro.ok ? pro.tCuoi : dur, ci = kq.cuongDo;
    var tHoi = pro && pro.ok && (pro.leoCuoi >= 1.5 || e === 'hoi') ? Math.max(dau, pro.tBatDauLen - 0.05) : null;
    if (vb.hoi || (e === 'hoi' && !(the && the.su === 'nghi'))) {   // suy_nghi (ba cham) khong phai cau hoi: khong to '?'
      if (tHoi == null) tHoi = Math.max(dau, cuoi - 0.3);
      ev.push({ t: tHoi, kind: '?' });
    }
    var to = pro && pro.ok && pro.dinhTo && pro.dinhTo.length ? pro.dinhTo : null;
    var tTo = to ? to.reduce(function (a, b) { return b.db > a.db ? b : a; }).t : dau + 0.12;
    if (e === 'ngac_nhien') {
      ev.push({ t: Math.max(dau, tTo - 0.05), kind: '!' });
    } else if ((e === 'hao_hung' || vb.cham) && e !== 'gian' && e !== 'buon' && e !== 'hoi') {
      ev.push({ t: Math.max(dau, tTo - 0.05), kind: '!' });
    }
    if (e === 'gian') { ev.push({ t: Math.max(dau, tTo - 0.08), kind: 'gian' }); ev.push({ t: Math.max(dau, tTo - 0.08), kind: 'rung', dur: 0.45 }); }
    if (e === 'hao_hung' || (e === 'vui' && ci >= 0.6)) {
      var tS = pro && pro.ok ? pro.tDinhF0 : dau + (cuoi - dau) * 0.4;
      ev.push({ t: Math.max(dau, tS - 0.05), kind: 'sang' });
      if (e === 'hao_hung' && cuoi - dau > 1.4) ev.push({ t: Math.max(tS + 0.6, dau + (cuoi - dau) * 0.75), kind: 'sang' });
    }
    if ((e === 'buon' && ci >= 0.4) || (the && the.su === 'mo_hoi') || (vb.xin && e === 'buon')) ev.push({ t: dau + 0.25, kind: 'mo_hoi' });
    else if (the && the.su === 'mo_hoi') ev.push({ t: dau + 0.25, kind: 'mo_hoi' });
    if ((the && the.su === 'nghi') || vb.nghi) {
      var q = pro && pro.ok && pro.nghi && pro.nghi.length ? pro.nghi[0].t + 0.05 : Math.max(dau, cuoi - 0.2);
      ev.push({ t: q, kind: 'nghi' });
    }
    ev.sort(function (a, b) { return a.t - b.t; });
    return ev;
  }

  /** Mot cho duy nhat tinh: { emotion, cuongDo, su kien, ... } tu PCM + van ban + the. */
  function phanTichCauNoi(o) {
    var pro = null;
    if (o.pcm && o.pcm.length > 2400) {
      try { pro = dacTrungNguDieu(f0Yin(o.pcm, o.sr || 24000), o.sr || 24000); } catch (e) { pro = null; }
    }
    var kq = giaiCamXuc({ the: o.the, text: o.text, pro: pro, nen: o.nen });
    var dur = o.pcm ? o.pcm.length / (o.sr || 24000) : (o.dur || 2);
    kq.su = suKienBieuCam(kq, pro, dur);
    kq.pro = pro;
    kq.dur = dur;
    return kq;
  }

  // ====================================================================================================================
  // C. KHUON MAT + MIENG (chi trong trinh duyet)
  // ====================================================================================================================
  var API = {
    BIEU_CAM: BIEU_CAM,
    phanTichCauNoi: phanTichCauNoi,
    _t: { f0Yin: f0Yin, dacTrungNguDieu: dacTrungNguDieu, giaiCamXuc: giaiCamXuc, docVanBan: docVanBan, suKienBieuCam: suKienBieuCam,
          phanTichCauNoi: phanTichCauNoi, THE_DU_LIEU: THE_DU_LIEU, softNor: softNor },
  };
  g.SenseiAvatarNoi = API;
  if (typeof document === 'undefined') return;

  var RIG_URL = 'assets/minh-hoa/nv/rig.json';
  var DIR_ANH = 'assets/minh-hoa/nv/';
  var rig = null, rigCho = null;
  function napRig() {
    if (!rigCho) rigCho = fetch(RIG_URL).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
      .then(function (j) { rig = j || {}; return rig; });
    return rigCho;
  }
  var GIAM_CHUYEN = false;
  try { var mq = g.matchMedia('(prefers-reduced-motion: reduce)'); GIAM_CHUYEN = mq.matches; if (mq.addEventListener) mq.addEventListener('change', function (e) { GIAM_CHUYEN = e.matches; }); } catch (e) {}

  function chuanDuongDan(src) {
    if (!src) return '';
    var s = String(src).split('#')[0].split('?')[0];
    try {
      var u = new URL(s, location.href), base = new URL('./', location.href).pathname;
      s = u.pathname.indexOf(base) === 0 ? u.pathname.slice(base.length) : u.pathname.replace(/^\//, '');
    } catch (e) {}
    return s.replace(/^\.\//, '');
  }
  function idTuDuongDan(p) {
    var m = /\/nv-([a-z0-9_-]+)\.webp$/i.exec(p) || /\/nv\/([^/]+)\//.exec(p);
    return m ? m[1] : '';
  }
  function anhBieuCam(id, emo) {
    var p = DIR_ANH + id + '/' + emo + '.webp';
    return rig && rig[p] ? p : null;
  }

  // ---- mau
  function hexRgb(h) { h = String(h || '#888888'); return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function rgbCss(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a == null ? 1 : a) + ')'; }
  function tronMau(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  // ---- hinh mieng: tham so cua tung nguyen am (don vi = do rong mieng dong w)
  //   sw rong (x w), h cao mo toi da (x w), up ti le mo len phia tren, rd do tron 0..1, luoi 0..1, rang 0..1
  var HINH = {
    kin: { sw: 1.00, h: 0.00, up: 0.30, rd: 0.0, luoi: 0.0, rang: 0 },
    a: { sw: 1.02, h: 0.62, up: 0.26, rd: 0.35, luoi: 0.75, rang: 0.5 },
    e: { sw: 1.14, h: 0.34, up: 0.30, rd: 0.12, luoi: 0.35, rang: 0.9 },
    i: { sw: 1.20, h: 0.19, up: 0.30, rd: 0.05, luoi: 0.0, rang: 1.0 },
    o: { sw: 0.60, h: 0.54, up: 0.40, rd: 0.95, luoi: 0.45, rang: 0.0 },
    u: { sw: 0.44, h: 0.36, up: 0.40, rd: 1.0, luoi: 0.0, rang: 0.0 },
    o2: { sw: 0.86, h: 0.38, up: 0.32, rd: 0.55, luoi: 0.4, rang: 0.3 },
  };
  var KHOA_H = ['kin', 'a', 'e', 'i', 'o', 'u', 'o2'];
  // bieu cam -> nhan cho mieng: cur (do cong khoe mieng, + = nhech len), sw (x rong), h (x mo), rd (+ tron hon), nghieng (do)
  var MIENG_CAM = {
    binh_thuong: { cur: 0.00, sw: 1.00, h: 1.00, rd: 0.00, nghieng: 0 },
    vui: { cur: 0.17, sw: 1.10, h: 1.00, rd: 0.00, nghieng: 1 },
    hoi: { cur: 0.02, sw: 0.98, h: 1.00, rd: 0.00, nghieng: 3 },
    gian: { cur: -0.13, sw: 0.90, h: 0.85, rd: -0.1, nghieng: 0 },
    ngac_nhien: { cur: 0.00, sw: 0.88, h: 1.35, rd: 0.40, nghieng: 0 },
    hao_hung: { cur: 0.24, sw: 1.18, h: 1.15, rd: 0.00, nghieng: 1.5 },
    buon: { cur: -0.16, sw: 0.90, h: 0.78, rd: 0.00, nghieng: -1.5 },
  };

  // ---- ve mieng tren canvas (goc toa do = tam mieng, truc x theo duong mieng)
  function veDuongNu(c, w, lift, hw) {   // net cuoi cong: tam thap hon hai khoe khi lift > 0
    c.beginPath();
    c.moveTo(-hw, -lift / 3);                       // parabol y = lift * (1/6 - u^2/2): ends -lift/3, giua +lift/6 (trung binh 0 = tam net)
    c.quadraticCurveTo(0, lift * 2 / 3, hw, -lift / 3);
  }
  function diemMieng(w, P) {
    // duong bao mo: mang diem tren (trai->phai) va duoi (trai->phai)
    var N = 22, hw = w * P.sw / 2, lift = P.cur * w, H = P.h * w, up = H * P.up, lo = H - up;
    var qU = 1.1 + (0.55 - 1.1) * P.rd, qL = 0.75 + (0.5 - 0.75) * P.rd;
    var tren = [], duoi = [];
    for (var i = 0; i <= N; i++) {
      var u = -1 + 2 * i / N, f = Math.max(0, 1 - u * u), ys = lift * (1 / 6 - 0.5 * u * u);
      tren.push([u * hw, ys - up * Math.pow(f, qU)]);
      duoi.push([u * hw, ys + lo * Math.pow(f, qL)]);
    }
    return { tren: tren, duoi: duoi };
  }
  function duongMo(c, d) {
    c.beginPath();
    c.moveTo(d.tren[0][0], d.tren[0][1]);
    var i;
    for (i = 1; i < d.tren.length; i++) c.lineTo(d.tren[i][0], d.tren[i][1]);
    for (i = d.duoi.length - 1; i >= 0; i--) c.lineTo(d.duoi[i][0], d.duoi[i][1]);
    c.closePath();
  }
  function veMieng(c, m, P, C, lw) {
    c.save();
    c.translate(m.cx, m.cy); c.rotate(m.rot);
    c.lineJoin = 'round'; c.lineCap = 'round';
    var w = m.w, H = P.h * w;
    if (H < Math.max(lw * 1.2, 0.05 * w)) {          // dong: mot net cong
      veDuongNu(c, w, P.cur * w, w * P.sw / 2);
      c.strokeStyle = C.line; c.lineWidth = lw; c.stroke();
      c.restore(); return;
    }
    var d = diemMieng(w, P);
    duongMo(c, d);
    c.fillStyle = C.toi; c.fill();
    c.save(); c.clip();
    var hw = w * P.sw / 2, lo = H * (1 - P.up), upH = H * P.up, y0 = P.cur * w / 6;
    if (P.rang > 0.05) {                              // hang rang tren
      c.fillStyle = rgbCss(C.rang, 0.96);
      c.fillRect(-hw, y0 - upH - lw, hw * 2, Math.min(upH * 0.9 * P.rang + lw * 0.8, H * 0.5 + lw));
    }
    if (P.luoi > 0.05) {                              // luoi
      c.fillStyle = rgbCss(C.luoi, 1);
      c.beginPath();
      c.ellipse(0, y0 + lo * 0.95, hw * 0.62, lo * 0.72 * Math.min(1, 0.4 + P.luoi), 0, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
    duongMo(c, d);
    c.strokeStyle = C.line; c.lineWidth = lw * 1.05; c.stroke();
    c.restore();
  }
  // Xoa net mieng goc: to mang da doc theo duong cong goc (3 lop mem dan)
  function xoaMiengGoc(c, m, skin, lw0) {
    c.save();
    c.translate(m.cx, m.cy); c.rotate(m.rot);
    c.lineCap = 'round';
    var f = 1.2 + 0.5 * Math.min(1, Math.abs(m.lift0) / m.w0), w0 = m.w0 * f, lift = m.lift0 * f * f, pw = lw0 * 3.0 + 1.5;   // mo rong net (duoi cuon them) thi giu nguyen do cong tai dau net goc
    var passes = [[pw * 1.45, 0.3], [pw, 1]];
    for (var i = 0; i < passes.length; i++) {
      veDuongNu(c, w0, lift, w0 / 2);
      c.strokeStyle = rgbCss(skin, passes[i][1]); c.lineWidth = passes[i][0]; c.stroke();
    }
    c.restore();
  }
  // ---- Xoa net mieng goc CHINH XAC tung diem anh (uu tien hon xoaMiengGoc): trong dai quanh duong cong cua mieng, diem toi hon da >= 22%
  // tuong phan cua net -> thay bang mau noi suy doc (giua diem da tren / duoi), giu nguyen moi, bong, rang cua ... Ket qua la mot "mieng va" RGBA nho.
  var boVa = {};
  function luma(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }
  function taoVa(im, rg) {
    var W = im.naturalWidth, H = im.naturalHeight, m = rg.mouth;
    if (!W || !H || !m) return null;
    var cx = m.x * W, cy = m.y * H, w0 = m.w * W, lift = (m.curve || 0) * W, rot = m.rot || 0, cr = Math.cos(rot), sr = Math.sin(rot);
    var R = w0 * 0.85 + 8 + Math.abs(lift);
    var x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(W, Math.ceil(cx + R)), y0 = Math.max(0, Math.floor(cy - R * 0.75)), y1 = Math.min(H, Math.ceil(cy + R * 0.75));
    if (m.clipTop != null) y0 = Math.max(y0, Math.floor(m.clipTop * H));   // ria mep / khan che net tren: khong xoa
    var bw = x1 - x0, bh = y1 - y0;
    if (bw < 8 || bh < 8) return null;
    var src = document.createElement('canvas'); src.width = W; src.height = H;
    var sc = src.getContext('2d', { willReadFrequently: true });
    sc.drawImage(im, 0, 0);
    var id = sc.getImageData(x0, y0, bw, bh), d = id.data, n = bw * bh;
    var skin = hexRgb(rg.skin || rg.daMat), line = hexRgb(rg.line || '#3a2a20');
    var Ls = luma(skin[0], skin[1], skin[2]), C = Math.max(30, Ls - luma(line[0], line[1], line[2]));
    var t0 = 0.22 * C, t1 = 0.55 * C, band = 0.014 * W + 0.3 * Math.abs(lift);
    var a = new Float32Array(n), i, x, y;
    for (y = 0; y < bh; y++) for (x = 0; x < bw; x++) {
      var dx = x + x0 - cx, dy = y + y0 - cy, xr = dx * cr + dy * sr, yr = -dx * sr + dy * cr, u = xr / (w0 / 2);
      if (Math.abs(u) > 1.5) continue;
      var yc = lift * (1 / 6 - 0.5 * u * u);
      if (Math.abs(yr - yc) > band * (1 + 0.6 * Math.max(0, Math.abs(u) - 1))) continue;
      i = (y * bw + x) * 4;
      var drop = Ls - luma(d[i], d[i + 1], d[i + 2]);
      if (drop > t0) a[y * bw + x] = Math.min(1, (drop - t0) / (t1 - t0));
    }
    // nong 1 diem anh (vien khu rang cua)
    var b2 = new Float32Array(n);
    for (y = 0; y < bh; y++) for (x = 0; x < bw; x++) {
      var mx = a[y * bw + x];
      if (mx < 1) for (var yy = Math.max(0, y - 1); yy <= Math.min(bh - 1, y + 1); yy++) for (var xx = Math.max(0, x - 1); xx <= Math.min(bw - 1, x + 1); xx++) mx = Math.max(mx, a[yy * bw + xx] * 0.85);
      b2[y * bw + x] = mx;
    }
    var out = document.createElement('canvas'); out.width = bw; out.height = bh;
    var oc = out.getContext('2d'), od = oc.createImageData(bw, bh), o = od.data;
    var darkLim = Ls - t0, F = new Float32Array(n * 3), ok = new Uint8Array(n);
    for (x = 0; x < bw; x++) {
      for (y = 0; y < bh; y++) {
        var k = y * bw + x;
        if (b2[k] < 0.12) continue;
        var ya = y, yb = y;
        while (ya > 0 && b2[(ya - 1) * bw + x] >= 0.12) ya--;
        while (yb < bh - 1 && b2[(yb + 1) * bw + x] >= 0.12) yb++;
        var ca = skin, cb = skin, t;
        if (ya > 0) { i = ((ya - 1) * bw + x) * 4; if (luma(d[i], d[i + 1], d[i + 2]) > darkLim) ca = [d[i], d[i + 1], d[i + 2]]; }
        if (yb < bh - 1) { i = ((yb + 1) * bw + x) * 4; if (luma(d[i], d[i + 1], d[i + 2]) > darkLim) cb = [d[i], d[i + 1], d[i + 2]]; }
        t = (y - ya + 0.5) / (yb - ya + 1);
        F[k * 3] = ca[0] + (cb[0] - ca[0]) * t; F[k * 3 + 1] = ca[1] + (cb[1] - ca[1]) * t; F[k * 3 + 2] = ca[2] + (cb[2] - ca[2]) * t;
        ok[k] = 1;
      }
    }
    // lam mem ngang 5 diem (tranh soc doc do noi suy doc tung cot)
    for (y = 0; y < bh; y++) for (x = 0; x < bw; x++) {
      var k2 = y * bw + x;
      if (!ok[k2]) continue;
      var sr = 0, sg = 0, sb = 0, cn = 0;
      for (var xx2 = Math.max(0, x - 2); xx2 <= Math.min(bw - 1, x + 2); xx2++) {
        var kk = y * bw + xx2;
        if (ok[kk]) { sr += F[kk * 3]; sg += F[kk * 3 + 1]; sb += F[kk * 3 + 2]; cn++; }
      }
      i = k2 * 4;
      o[i] = sr / cn; o[i + 1] = sg / cn; o[i + 2] = sb / cn;
      o[i + 3] = Math.round(255 * Math.min(1, b2[k2] * 1.15));
    }
    oc.putImageData(od, 0, 0);
    return { cv: out, x0: x0, y0: y0, W: W, H: H };
  }
  function vaMieng(path, im, rg) {
    if (!rg || !rg.mouth) return null;
    var v = boVa[path];
    if (v !== undefined) return v;
    if (!im || !im.naturalWidth) return null;   // chua tai xong: lan sau thu lai (khong luu)
    try { v = taoVa(im, rg); } catch (e) { v = null; }
    boVa[path] = v;
    return v;
  }
  /** Xoa net mieng goc cua MOT lop anh da ve: mieng va chinh xac (neu tao duoc), khong thi ve net mau da theo duong cong. */
  function xoaMieng(c, path, im, rg, fr, cw, ch) {
    if (!rg || !rg.mouth) return;
    var v = vaMieng(path, im, rg);
    if (v) {
      var s = fr.dw / v.W;
      c.drawImage(v.cv, fr.dx + v.x0 * s, fr.dy + v.y0 * (fr.dh / v.H), v.cv.width * s, v.cv.height * (fr.dh / v.H));
      return;
    }
    xoaMiengLop(c, rg, fr, cw, ch);
  }
  // Chop mat: phu mat bang mau da, ve net mi nham
  function veChopMat(c, mat, b, skin, eyeCol, lw) {
    if (b < 0.05) return;
    mat.forEach(function (e) {
      var r = Math.max(2, e.r) * 1.45;
      c.save();
      c.fillStyle = rgbCss(skin, 1);
      c.beginPath(); c.rect(e.x - r * 1.15, e.y - r * 1.2, r * 2.3, r * 2.4 * Math.min(1, b * 1.15)); c.clip();
      c.beginPath(); c.ellipse(e.x, e.y, r * 1.15, r * 1.2, 0, 0, Math.PI * 2); c.fill();
      c.restore();
      if (b > 0.55) {
        c.save(); c.strokeStyle = eyeCol; c.lineWidth = lw * 1.1; c.lineCap = 'round';
        c.beginPath(); c.moveTo(e.x - r * 0.85, e.y + r * 0.05); c.quadraticCurveTo(e.x, e.y + r * 0.5, e.x + r * 0.85, e.y + r * 0.05); c.stroke();
        c.restore();
      }
    });
  }

  // ---- anh: tai va giu
  var boAnh = {};
  function taiAnh(p) {
    if (boAnh[p]) return boAnh[p];
    var im = new Image();
    im.decoding = 'async';
    var o = { im: im, xong: false };
    im.onload = function () { o.xong = true; };
    im.src = p;
    boAnh[p] = o;
    return o;
  }
  function khungAnh(cw, ch, iw, ih, fit) {
    var s;
    if (fit === 'fill') return { dx: 0, dy: 0, dw: cw, dh: ch };
    s = fit === 'contain' ? Math.min(cw / iw, ch / ih) : Math.max(cw / iw, ch / ih);
    return { dx: (cw - iw * s) / 2, dy: (ch - ih * s) / 2, dw: iw * s, dh: ih * s };
  }

  // ---- ky hieu truyen tranh (SVG phang, MOT mau nhan tu --accent)
  var FONT_KH = "font-family=\"'Arial Rounded MT Bold','Hiragino Maru Gothic ProN','Segoe UI',sans-serif\" font-weight=\"900\" text-anchor=\"middle\"";
  var SVG_KH = {
    '?': '<text x="12" y="20" font-size="26" ' + FONT_KH + ' fill="var(--avn-mau)" stroke="var(--avn-vien)" stroke-width="3.2" paint-order="stroke" stroke-linejoin="round">?</text>',
    '!': '<text x="12" y="21" font-size="28" ' + FONT_KH + ' fill="var(--avn-mau)" stroke="var(--avn-vien)" stroke-width="3.2" paint-order="stroke" stroke-linejoin="round">!</text>',
    gian: '<path d="M9 2.5Q9 9 2.5 9M15 2.5Q15 9 21.5 9M2.5 15Q9 15 9 21.5M21.5 15Q15 15 15 21.5" fill="none" stroke="var(--avn-vien)" stroke-width="6" stroke-linecap="round"/><path d="M9 2.5Q9 9 2.5 9M15 2.5Q15 9 21.5 9M2.5 15Q9 15 9 21.5M21.5 15Q15 15 15 21.5" fill="none" stroke="var(--avn-mau)" stroke-width="3.2" stroke-linecap="round"/>',
    sang: '<path d="M12 1C13 8 16 11 23 12C16 13 13 16 12 23C11 16 8 13 1 12C8 11 11 8 12 1Z" fill="var(--avn-mau)" stroke="var(--avn-vien)" stroke-width="2" stroke-linejoin="round"/>',
    mo_hoi: '<path d="M12 1.5C12 1.5 4.5 11 4.5 15.5A7.5 7.5 0 0 0 19.5 15.5C19.5 11 12 1.5 12 1.5Z" fill="var(--avn-mau)" stroke="var(--avn-vien)" stroke-width="2" stroke-linejoin="round"/><path d="M8.6 15.5A3.4 3.4 0 0 0 11.6 19" fill="none" stroke="var(--avn-vien)" stroke-width="1.6" stroke-linecap="round"/>',
    nghi: '<circle cx="4.5" cy="14" r="2.6" fill="var(--avn-mau)" stroke="var(--avn-vien)" stroke-width="1.4"/><circle cx="12" cy="14" r="3.2" fill="var(--avn-mau)" stroke="var(--avn-vien)" stroke-width="1.4"/><circle cx="20" cy="14" r="3.8" fill="var(--avn-mau)" stroke="var(--avn-vien)" stroke-width="1.4"/>',
  };
  var tang = null;
  function chenCss() {
    if (document.getElementById('avn-css')) return;
    var st = document.createElement('style'); st.id = 'avn-css';
    st.textContent = '.avn-noi{position:absolute;pointer-events:none;display:none}.avn-dang-noi>.avn-noi{display:block}'
      + '#avn-tang{position:fixed;left:0;top:0;width:0;height:0;z-index:2147483000;pointer-events:none;'
      + '--avn-mau:var(--accent,#c96442);--avn-vien:var(--paper,#faf6ee)}'
      + '#avn-tang svg{position:fixed;overflow:visible;transform-origin:50% 60%;will-change:transform,opacity}';
    document.head.appendChild(st);
  }
  function tangKyHieu() {
    if (tang && tang.isConnected) return tang;
    chenCss();
    tang = document.createElement('div'); tang.id = 'avn-tang'; tang.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tang);
    return tang;
  }

  // ====================================================================================================================
  // D. AVATAR + PHAT KHOP TIENG
  // ====================================================================================================================
  var DS = [];                 // moi avatar da gan
  var choi = null;             // luot dang phat
  var boCache = {};            // lineId:len -> ket qua phan tich
  var nenNV = {};              // nhanVat -> nen ngu dieu { f0St, db, n }
  var boKhauHinh = {};         // nhanVat -> SenseiKhauHinh.taoMoi() (giu bu giong giua cac cau)

  function hamBam(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  var lam01 = function (a, b, x) { var t = kep((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /** Dong ho nghe thay: thoi diem AudioContext cua mau DANG ra loa (da tru do tre dau ra). */
  function gioNghe(ctx) {
    if (!ctx) return performance.now() / 1000;
    var KH = g.SenseiKhauHinh;
    try { if (KH && KH.bayGio) { var t = KH.bayGio(ctx); if (t > 0) return t; } } catch (e) {}
    return ctx.currentTime - (ctx.outputLatency || 0) - (ctx.baseLatency || 0);
  }


  /** Tham so mieng muc tieu tu khung khau hinh f = {a,b,t,mo} + bieu cam (cam, do dam A) + do rong anh ve (px). */
  function mucTieu(f, cam, A, dw, cur0) {
    cur0 = cur0 || 0;
    var a = HINH[KHOA_H[f.a]] || HINH.kin, b = HINH[KHOA_H[f.b]] || HINH.kin, K = HINH.kin;
    var op = lam01(0.05, 0.6, f.mo);
    var ea = f.a === 0 ? 0 : op, eb = f.b === 0 ? 0 : op, t = f.t;
    var mix = function (k) { var va = K[k] + (a[k] - K[k]) * ea, vb = K[k] + (b[k] - K[k]) * eb; return va + (vb - va) * t; };
    var amp = dw < 140 ? 1.3 : 1;   // avatar nho: mieng mo to hon mot chut cho de thay
    var tgt = { sw: mix('sw'), h: mix('h') * amp, up: mix('up'), rd: mix('rd'), luoi: mix('luoi'), rang: mix('rang'), cur: cur0 + cam.cur * A };
    tgt.sw *= 1 + (cam.sw - 1) * A; tgt.h *= 1 + (cam.h - 1) * A; tgt.rd = kep(tgt.rd + cam.rd * A, 0, 1);
    return tgt;
  }
  /** Anh bieu cam (nv/<id>/<cam xuc>.webp) da co net mieng mang dung cam xuc (cuoi, mếu...) va rig da do lai net do: khong cong them do cong / do rong
   *  cua bang MIENG_CAM (se thanh cuoi hai lan); chi giu do mo (h), do tron (rd) va nghieng dau. */
  function camTheoAnh(cam) { return { cur: 0, sw: 1, h: cam.h, rd: cam.rd, nghieng: cam.nghieng }; }
  function laAnhBieuCam(path) { return /\/nv\/[^/]+\/[^/]+\.webp$/.test(path || ''); }
  /** Dung hinh hoc mieng tu rig: w0 = be rong net goc (dung de xoa), w = be rong mieng ve (trong khoang 0.8 - 1.4 x be rong trung tinh: net 'ngac nhien' rat ngan, net 'hao hung' cuoi rat rong). */
  function hinhHocMieng(m, fr) {
    var w0 = m.w * fr.dw, wg = (m.wGoc || m.w) * fr.dw, wv = Math.min(Math.max(w0, 0.8 * wg), 1.4 * wg);
    return { cx: fr.dx + m.x * fr.dw, cy: fr.dy + m.y * fr.dh, rot: m.rot || 0, w: wv, w0: w0, lift0: (m.curve || 0) * fr.dw };
  }
  /** Xoa net mieng goc cua MOT lop anh (mau da + toa do cua chinh anh do). */
  function xoaMiengLop(c, rg, fr, cw, ch) {
    if (!rg || !rg.mouth) return;
    var m = rg.mouth, skin = hexRgb(rg.skin || rg.daMat), lw = Math.max(1.0, 0.0062 * fr.dw);
    if (m.clipTop != null) { c.save(); c.beginPath(); c.rect(0, fr.dy + m.clipTop * fr.dh, cw, ch); c.clip(); }
    xoaMiengGoc(c, hinhHocMieng(m, fr), skin, lw);
    if (m.clipTop != null) c.restore();
  }
  function mauMieng(rg, skin) {
    var line = hexRgb(rg.line || '#8a4a3a');
    return { line: rgbCss(line), toi: rgbCss(tronMau(line, [38, 14, 18], 0.62)), rang: [252, 244, 236], luoi: tronMau([216, 112, 102], skin, 0.12) };
  }
  /** Ve TINH mot khung (khong am thanh): dung cho bang mau kiem tra. opt = {a,b,t,mo,emo,cuongDo,chop,rong}. */
  API.veTinh = function (cv, path, opt) {
    return napRig().then(function () {
      var o = taiAnh(path);
      return new Promise(function (ok) { var t = function () { if (o.xong) ok(); else setTimeout(t, 20); }; if (o.im.complete && o.im.naturalWidth) o.xong = true; t(); });
    }).then(function () {
      var o = boAnh[path], rg = rig[path], c = cv.getContext('2d'), W = cv.width, H = cv.height;
      var fr = khungAnh(W, H, o.im.naturalWidth, o.im.naturalHeight, opt.fit || 'cover');
      c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = (rg && rg.bg) || '#f0ebe1'; c.fillRect(0, 0, W, H);
      if (opt.zoom) { c.translate(W / 2, H / 2); c.scale(opt.zoom, opt.zoom); c.translate(-(fr.dx + 0.5 * fr.dw), -(fr.dy + 0.43 * fr.dh)); }
      c.drawImage(o.im, fr.dx, fr.dy, fr.dw, fr.dh);
      if (!rg || !rg.mouth || opt.khongPhu) return;   // khongPhu: anh goc, de so sanh
      var m = rg.mouth, skin = hexRgb(rg.skin || rg.daMat), lw = Math.max(1.0, 0.0062 * fr.dw);
      var geo = hinhHocMieng(m, fr);
      xoaMieng(c, path, o.im, rg, fr, W, H);
      var cam = MIENG_CAM[opt.emo || 'binh_thuong'];
      if (laAnhBieuCam(path)) cam = camTheoAnh(cam);
      var tgt = mucTieu({ a: KHOA_H.indexOf(opt.a || 'kin'), b: KHOA_H.indexOf(opt.b || opt.a || 'kin'), t: opt.t || 0, mo: opt.mo == null ? 1 : opt.mo }, cam, opt.cuongDo == null ? 1 : opt.cuongDo, fr.dw, (m.curve || 0) / Math.max(1e-6, m.w));
      if (m.clipTop != null) { c.save(); c.beginPath(); c.rect(0, fr.dy + m.clipTop * fr.dh, W, H); c.clip(); }
      veMieng(c, geo, tgt, mauMieng(rg, skin), lw);
      if (m.clipTop != null) c.restore();
      if (opt.chop && rg.blink) veChopMat(c, (rg.eyes || []).map(function (e) { return { x: fr.dx + e.x * fr.dw, y: fr.dy + e.y * fr.dh, r: e.r * fr.dw }; }), opt.chop, hexRgb(rg.daMat || rg.skin), rg.eye || '#2a2a2a', lw);
    });
  };

  // ---------------------------------------------------------------------------------------------- Avatar
  function Avatar(el, opt) {
    opt = opt || {};
    this.img = el && el.tagName === 'IMG' ? el : (el && el.querySelector ? el.querySelector('img') : null);
    this.nhanVat = opt.nhanVat || '';
    this.lineId = opt.lineId || null;
    this.cfg = opt;
    this.hoat = false;
    this.P = null;
    this.cur = null; this.prev = null; this.fade = 1;
    this.tilt = 0; this.amt = 0; this.emo = 'binh_thuong';
    this.chop = { t0: 0, tiep: 0 };
    this.canvas = null;
    if (!this.img) return;
    this.basePath = chuanDuongDan(this.img.getAttribute('src') || this.img.currentSrc || '');
    var id = idTuDuongDan(this.basePath);
    this.ids = [this.nhanVat, id, id === 'sensei' ? 'giao-vien' : ''].filter(Boolean);
    if (!this.nhanVat) this.nhanVat = id;
    var self = this;
    this.ctl = {
      el: this.img, nhanVat: this.nhanVat, lineId: this.lineId,
      go: function () { self.go(); },
      dangNoi: function () { return self.hoat; },
    };
  }
  Avatar.prototype.duongAnh = function (emo) {
    for (var i = 0; i < this.ids.length; i++) { var p = anhBieuCam(this.ids[i], emo); if (p) return p; }
    return this.basePath;
  };
  Avatar.prototype.dungCanvas = function () {
    if (this.canvas) return;
    var cv = document.createElement('canvas');
    cv.className = 'avn-noi'; cv.setAttribute('aria-hidden', 'true');
    this.img.parentNode.insertBefore(cv, this.img.nextSibling);
    this.canvas = cv; this.c = cv.getContext('2d');
  };
  /** Dat canvas trung khit <img> (vi tri, kich thuoc, transform, bo goc), tinh do phan giai. */
  Avatar.prototype.dat = function () {
    var im = this.img, cv = this.canvas, cs = getComputedStyle(im), host = im.parentNode;
    if (host.nodeType === 1 && getComputedStyle(host).position === 'static') host.style.position = 'relative';
    cv.style.left = im.offsetLeft + 'px'; cv.style.top = im.offsetTop + 'px';
    cv.style.width = im.offsetWidth + 'px'; cv.style.height = im.offsetHeight + 'px';
    cv.style.transform = cs.transform === 'none' ? '' : cs.transform;
    cv.style.transformOrigin = cs.transformOrigin;
    cv.style.borderRadius = cs.borderRadius;
    this.fit = cs.objectFit || 'fill';
    var r = cv.getBoundingClientRect(), k = im.offsetWidth ? r.width / im.offsetWidth : 1;
    var dpr = Math.min(g.devicePixelRatio || 1, 2);
    var bw = Math.round(kep(im.offsetWidth * k * dpr, 48, 1000)), bh = Math.round(kep(im.offsetHeight * k * dpr, 48, 1000));
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
    this.k = k;
  };
  Avatar.prototype.bat = function (p) {
    if (!this.img || !this.img.isConnected) return false;
    this.dungCanvas();
    this.img.parentNode.classList.add('avn-dang-noi');   // canvas phai hien thi thi moi do duoc kich thuoc thuc
    this.dat();
    var self = this;
    this.hoat = true;
    this.p = p;
    this.P = this.P || null;
    this.tilt = 0; this.amt = 0; this.suDa = {};
    this.chop = { t0: 0, tiep: performance.now() / 1000 + 1.0 + Math.random() * 1.5 };
    this.cur = this.cur || { emo: 'binh_thuong', path: this.basePath };
    ['binh_thuong', p.emotion].forEach(function (e) { taiAnh(self.duongAnh(e)); });
    this.img.style.visibility = 'hidden';
    this.img.parentNode.classList.add('avn-dang-noi');
    return true;
  };
  Avatar.prototype.go = function () {
    this.tat();
    var i = DS.indexOf(this);
    if (i >= 0) DS.splice(i, 1);
    if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    this.canvas = null;
  };
  Avatar.prototype.tat = function () {
    this.hoat = false;
    if (!this.img) return;
    this.img.style.visibility = '';
    if (this.img.parentNode && this.img.parentNode.classList) this.img.parentNode.classList.remove('avn-dang-noi');
    this.prev = null;
    this.cur = { emo: 'binh_thuong', path: this.basePath };
  };
  /** Dam bao dang hien anh cho bieu cam `emo` (cross-fade <= 110 ms). */
  Avatar.prototype.doiAnh = function (emo) {
    var path = this.duongAnh(emo);
    if (this.cur && this.cur.path === path) { this.cur.emo = emo; return; }
    var o = path === this.basePath ? { im: this.img, xong: this.img.complete && this.img.naturalWidth > 0 } : taiAnh(path);
    if (!o.xong) return;   // chua tai xong: giu anh cu, lan sau thu lai
    this.prev = this.cur && (this.cur.o || this.cur.path === this.basePath) ? this.cur : null;
    this.cur = { emo: emo, path: path, o: o };
    this.fade = GIAM_CHUYEN ? 1 : 0;
    if (!this.prev) this.fade = 1;
  };
  Avatar.prototype.rigCur = function () { return (rig && this.cur && rig[this.cur.path]) || (rig && rig[this.basePath]) || null; };
  Avatar.prototype.anhGoc = function (c) {
    if (c && c.o) return c.o.im;
    return this.img;
  };

  /** Ve mot khung. T = giay tu luc cau bat dau (am thanh nghe thay), now = giay dong ho trinh duyet. */
  Avatar.prototype.ve = function (T, p, dt, now) {
    if (!this.hoat || !this.canvas) return;
    var cv = this.canvas, c = this.c, W = cv.width, H = cv.height, self = this;
    var rg = this.rigCur();
    // ---- bieu cam hien tai + do dam
    var emo = p.emoTai(T), amt = p.amtTai(T);
    this.doiAnh(emo);
    if (this.fade < 1) this.fade = Math.min(1, this.fade + dt / 0.11);
    this.amt += (amt - this.amt) * (1 - Math.exp(-dt / 0.06));
    var cam = MIENG_CAM[emo] || MIENG_CAM.binh_thuong, A = this.amt * p.cuongDo;
    if (laAnhBieuCam(this.cur && this.cur.path)) cam = camTheoAnh(cam);   // anh bieu cam da co khoe mieng / do rong rieng
    // ---- nen + anh
    var im = this.anhGoc(this.cur);
    var iw = im.naturalWidth || 512, ih = im.naturalHeight || 512;
    var fr = khungAnh(W, H, iw, ih, this.fit);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, W, H);
    var bg = rg && rg.bg ? rg.bg : '#f0ebe1';
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    // dau nghieng / tho / rung
    var nghieng = GIAM_CHUYEN ? 0 : cam.nghieng * A * (hamBam(this.nhanVat) & 1 ? 1 : -1) * Math.PI / 180;
    this.tilt += (nghieng - this.tilt) * (1 - Math.exp(-dt / 0.12));
    var tho = GIAM_CHUYEN ? 0 : Math.sin(now * 2 * Math.PI / 3.8) * 0.004 * H * Math.min(1, this.amt + 0.3);
    var rung = 0;
    if (!GIAM_CHUYEN) p.su.forEach(function (e) {
      if (e.kind === 'rung' && T >= e.t && T < e.t + e.dur) rung += Math.sin((T - e.t) * 2 * Math.PI * 17) * (1 - (T - e.t) / e.dur) * 0.014 * W;
    });
    c.save();
    var px = W / 2, py = H * 0.9;
    c.translate(px, py); c.rotate(this.tilt); c.scale(1 + Math.abs(this.tilt) * 0.9, 1 + Math.abs(this.tilt) * 0.9); c.translate(-px + rung, -py + tho);
    // Moi lop anh duoc xoa net mieng goc CUA CHINH NO (toa do + mau da cua anh do) roi moi tron: khong con net mieng cu trong luc cross-fade
    if (this.prev && this.fade < 1) {
      var ip = this.anhGoc(this.prev), fp = khungAnh(W, H, ip.naturalWidth || iw, ip.naturalHeight || ih, this.fit);
      try { c.drawImage(ip, fp.dx, fp.dy, fp.dw, fp.dh); } catch (e) {}
      var kp = rig && rig[this.prev.path] ? this.prev.path : this.basePath;
      xoaMieng(c, kp, ip, rig && rig[kp], fp, W, H);
      c.globalAlpha = this.fade;
    }
    try { c.drawImage(im, fr.dx, fr.dy, fr.dw, fr.dh); } catch (e) {}
    if (rg && rg.mouth) xoaMieng(c, rig[this.cur.path] ? this.cur.path : this.basePath, im, rg, fr, W, H);
    c.globalAlpha = 1;
    if (rg && rg.mouth) this.veKhuonMat(c, rg, fr, T, p, cam, A, dt, now);
    c.restore();
    // ---- ky hieu
    p.ev.forEach(function (e, i) {
      if (self.suDa[i] || e.t > T || e.kind === 'rung') return;
      self.suDa[i] = true;
      if (T - e.t > 0.3) return;   // tre qua (nhay qua, tab bi an) thi bo
      self.kyHieu(e.kind, rg, fr, p);
    });
  };
  Avatar.prototype.veKhuonMat = function (c, rg, fr, T, p, cam, A, dt, now) {
    var m = rg.mouth, skin = hexRgb(rg.skin || rg.daMat), eyeCol = rg.eye || '#2a2a2a';
    var lw = Math.max(1.0, 0.0062 * fr.dw);
    var geo = hinhHocMieng(m, fr);
    // 1. tham so muc tieu tu nguyen am
    var f = p.mieng(T);
    var tgt = mucTieu(f, cam, A, fr.dw, (m.curve || 0) / Math.max(1e-6, m.w));
    if (!this.P) this.P = { sw: 1, h: 0, up: 0.3, rd: 0, luoi: 0, rang: 0, cur: tgt.cur };
    // Lam muot (<= 60 ms de chuyen hinh): mo nhanh hon mot chut (16 ms), khep nhanh (10 ms) de m b p thay ro
    var P = this.P, dong = tgt.h < P.h;
    var al = 1 - Math.exp(-dt / (dong ? 0.010 : 0.016)), am = 1 - Math.exp(-dt / 0.022);
    for (var k in tgt) P[k] += (tgt[k] - P[k]) * (k === 'h' || k === 'up' ? al : am);
    var C = mauMieng(rg, skin);
    // 2. chop mat: chi khi rig bao mat la cham don gian (anh 'ngac nhien' / 'hao hung' co mat co diem sang, anh 'vui' mat nham: bo qua)
    if (rg.eyes && rg.blink) {
      var ch = this.chop, bl = 0;
      if (ch.t0 && now - ch.t0 < 0.15) bl = Math.sin(Math.PI * (now - ch.t0) / 0.15);
      else if (ch.t0 && now - ch.t0 >= 0.15) { ch.t0 = 0; ch.tiep = now + 3 + Math.random() * 2; }
      else if (now >= ch.tiep) ch.t0 = now;
      if (bl > 0.05) {
        var mats = rg.eyes.map(function (e) { return { x: fr.dx + e.x * fr.dw, y: fr.dy + e.y * fr.dh, r: e.r * fr.dw }; });
        veChopMat(c, mats, bl, hexRgb(rg.daMat || rg.skin), eyeCol, lw);
      }
    }
    // 3. mieng (chi ve ben duoi clipTop: ria mep / khan che net tren)
    if (m.clipTop != null) { c.save(); c.beginPath(); c.rect(0, fr.dy + m.clipTop * fr.dh, this.canvas.width, this.canvas.height); c.clip(); }
    veMieng(c, geo, P, C, lw);
    if (m.clipTop != null) c.restore();
    this.dxNhin = fr;
  };
  /** To ky hieu truyen tranh len canh dau (lop co dinh, khong bi vong tron avatar cat). */
  Avatar.prototype.kyHieu = function (kind, rg, fr, p) {
    if (!SVG_KH[kind] || !this.canvas) return;
    var lop = tangKyHieu(), r = this.canvas.getBoundingClientRect();
    if (r.width < 2 || r.bottom < 0 || r.top > g.innerHeight) return;
    // chan dung dang an / mo dan (lop cu cua o san khau dang thoat, the bi an): khong ve ky hieu lac giua o khac
    for (var el = this.canvas, i = 0; el && el.nodeType === 1 && i < 12; el = el.parentElement, i++) {
      var cs = g.getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.35) return;
    }
    var W = this.canvas.width, H = this.canvas.height;
    var e0 = rg && rg.eyes ? rg.eyes : [{ x: 0.42, y: 0.37, r: 0.02 }, { x: 0.58, y: 0.37, r: 0.02 }];
    var mx = (e0[0].x + e0[1].x) / 2, my = (e0[0].y + e0[1].y) / 2, E = Math.abs(e0[1].x - e0[0].x) || 0.14;
    var OFF = { '?': [1.25, -1.95], '!': [1.3, -1.9], gian: [0.95, -1.3], sang: [-1.45, -1.05], mo_hoi: [1.5, -0.35], nghi: [1.3, -1.85] };
    var o = OFF[kind] || [1.3, -1.8];
    if (kind === 'sang' && this.sangLan) o = [1.55, -0.75];
    if (kind === 'sang') this.sangLan = !this.sangLan;
    var nx = mx + o[0] * E, ny = my + o[1] * E;
    var sx = r.left + (fr.dx + nx * fr.dw) / W * r.width, sy = r.top + (fr.dy + ny * fr.dh) / H * r.height;
    var sz = kep(E * fr.dw / W * r.width * 1.25, (kind === '?' || kind === '!') ? 26 : 22, 96);   // avatar nho (36-40 px): ky hieu van phai doc duoc ngay
    sx = kep(sx, sz / 2 + 2, g.innerWidth - sz / 2 - 2); sy = kep(sy, sz / 2 + 2, g.innerHeight - sz / 2 - 2);
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', sz); s.setAttribute('height', sz);
    s.style.left = (sx - sz / 2) + 'px'; s.style.top = (sy - sz / 2) + 'px';
    s.innerHTML = SVG_KH[kind];
    lop.appendChild(s);
    var giu = { '?': 1100, '!': 850, gian: 950, sang: 800, mo_hoi: 1250, nghi: 1300 }[kind] || 900;
    var xoa = function () { if (s.parentNode) s.parentNode.removeChild(s); };
    if (!s.animate) { setTimeout(xoa, giu); return; }
    var vao = GIAM_CHUYEN
      ? s.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, fill: 'forwards' })
      : s.animate([{ transform: 'scale(.2) rotate(-14deg)', opacity: 0 }, { transform: 'scale(1.28) rotate(6deg)', opacity: 1, offset: 0.45 },
        { transform: 'scale(.96) rotate(-2deg)', offset: 0.7 }, { transform: 'scale(1) rotate(0)', opacity: 1 }], { duration: 240, easing: 'ease-out', fill: 'forwards' });
    vao.onfinish = function () {
      var ra = GIAM_CHUYEN ? [{ opacity: 1 }, { opacity: 0 }]
        : kind === 'mo_hoi' ? [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(' + (sz * 0.6) + 'px)' }]
        : [{ opacity: 1, transform: 'translateY(0) scale(1)' }, { opacity: 0, transform: 'translateY(-' + (sz * 0.3) + 'px) scale(.9)' }];
      var an = s.animate(ra, { duration: 320, delay: giu - 240 - 320 > 0 ? giu - 560 : 0, fill: 'forwards' });
      an.onfinish = xoa;
    };
  };

  // ---------------------------------------------------------------------------------------------- Phan tich mot cau
  function pcmSangFloat32(pcm) {
    if (pcm instanceof Float32Array) return pcm;
    var bytes = pcm;
    if (typeof pcm === 'string') { var bin = atob(pcm); bytes = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); }
    var n = bytes.length >> 1, dv = new DataView(bytes.buffer, bytes.byteOffset, n * 2), o = new Float32Array(n);
    for (var j = 0; j < n; j++) { var s = dv.getInt16(j * 2, true); o[j] = s < 0 ? s / 32768 : s / 32767; }
    return o;
  }
  function chuoiTuNangLuong(pro, dur) {   // khong co SenseiKhauHinh: mo mieng theo nang luong, nguyen am luan phien
    var FPS = 120, n = Math.ceil((dur + 0.25) * FPS), A = new Uint8Array(n), B = new Uint8Array(n), T = new Uint8Array(n), M = new Uint8Array(n);
    var f = pro && pro.f0Yin;
    for (var i = 0; i < n; i++) {
      var k = f ? Math.min(f.db.length - 1, Math.floor(i / FPS / f.hop)) : 0;
      var lv = f ? kep((f.db[k] - (f.maxDb - 30)) / 24, 0, 1) : 0;
      var v = (Math.floor(i / FPS / 0.16) % 3 === 0) ? 1 : (Math.floor(i / FPS / 0.16) % 3 === 1 ? 6 : 2);
      A[i] = B[i] = lv > 0.05 ? v : 0; M[i] = Math.round(255 * lv);
    }
    return { fps: FPS, n: n, dur: dur, a: A, b: B, t: T, mo: M };
  }
  function phanTichCau(o) {
    var pcm = pcmSangFloat32(o.pcm), key = (o.lineId || '') + ':' + pcm.length + ':' + hamBam(String(o.text || '') + '|' + String(o.the || ''));
    if (o.lineId && boCache[key]) return boCache[key];
    var id = o.nhanVat || '_';
    var kq = phanTichCauNoi({ pcm: pcm, sr: 24000, text: o.text, the: o.the, nen: nenNV[id] || null });
    var tl = null, KH = g.SenseiKhauHinh;
    if (KH && KH.taoMoi) {
      try { var bo = boKhauHinh[id] || (boKhauHinh[id] = KH.taoMoi()); tl = bo.phanTichTron(pcm, 24000); } catch (e) { console.warn('[avatar-noi] khau hinh', e); }
    }
    if (!tl) tl = chuoiTuNangLuong(kq.pro, kq.dur);
    // cap nhat nen cua nhan vat (SAU khi da dung nen cu)
    if (kq.pro && kq.pro.ok) {
      var nv = nenNV[id] || (nenNV[id] = softNor());
      nv.n++; var w = 1 / Math.min(nv.n, 8);
      nv.f0St = nv.f0St == null ? kq.pro.stTrungVi : nv.f0St + (kq.pro.stTrungVi - nv.f0St) * w;
      nv.db = nv.db == null ? kq.pro.dbTrungVi : nv.db + (kq.pro.dbTrungVi - nv.db) * w;
    }
    // doan bieu cam theo thoi gian: cau hoi chi chuyen mat sang 'hoi' luc bat dau len giong
    var seg = [{ t: -0.12, emo: kq.emotion }];
    if (kq.emotion === 'hoi') {
      var q = kq.su.filter(function (e) { return e.kind === '?'; })[0];
      if (q && q.t > 0.9) seg = [{ t: -0.12, emo: 'binh_thuong' }, { t: q.t - 0.18, emo: 'hoi' }];
    }
    var out = { tl: tl, kq: kq, seg: seg, key: key };
    if (o.lineId) boCache[key] = out;
    return out;
  }

  // ---------------------------------------------------------------------------------------------- Luot phat
  function taoLuot(o, pt) {
    var kq = pt.kq, dur = kq.dur, tl = pt.tl;
    var p = {
      lineId: o.lineId, nhanVat: o.nhanVat, t0: o.t0, ctx: o.ctx || null, dur: dur, emotion: kq.emotion, cuongDo: Math.max(0.35, kq.cuongDo || 0),
      su: kq.su.map(function (e) { return { t: e.t, kind: e.kind, dur: e.dur, da: false }; }), ev: null, tDung: null, batDau: performance.now() / 1000,
      emoTai: function (T) {
        if (this.tDung != null && T > this.tDung + 0.05) return 'binh_thuong';
        if (T > this.dur + 0.4) return 'binh_thuong';
        var e = pt.seg[0].emo;
        for (var i = 0; i < pt.seg.length; i++) if (T >= pt.seg[i].t) e = pt.seg[i].emo;
        return e;
      },
      amtTai: function (T) {
        var a = lam01(-0.15, 0.06, T);
        var cuoi = this.tDung != null ? this.tDung : this.dur;
        if (T > cuoi) a *= 1 - lam01(cuoi, cuoi + 0.45, T);
        return a;
      },
      mieng: function (T) {
        var i = T * tl.fps;
        if (i < 0 || i >= tl.n - 1) return { a: 0, b: 0, t: 0, mo: 0 };
        // giu khung (zero-order hold): noi suy t / mo giua hai khung khac (a, b) cho ra hinh sai; lam muot da co avatar lo
        var i0 = Math.floor(i);
        return { a: tl.a[i0], b: tl.b[i0], t: tl.t[i0] / 255, mo: tl.mo[i0] / 255 };
      },
    };
    p.ev = p.su;
    return p;
  }
  function chon(lineId, nhanVat) {
    DS = DS.filter(function (a) { return a.img && a.img.isConnected; });
    var theoDong = lineId ? DS.filter(function (a) { return a.lineId === lineId; }) : [];
    if (theoDong.length) return theoDong;
    return DS.filter(function (a) { return !a.lineId && a.nhanVat === nhanVat; });
  }
  var lapLai = 0, lanCuoi = 0;
  function vong(ts) {
    lapLai = 0;
    var p = choi;
    if (!p) return;
    var now = ts / 1000, dt = Math.min(0.1, Math.max(0.001, now - (lanCuoi || now - 0.016)));
    lanCuoi = now;
    var T = gioNghe(p.ctx) - p.t0 + 0.008;   // +8 ms: khung rAF hien ~1 vsync sau khi ve (do trong Chrome that: mieng di truoc tieng p50 -6 ms)
    if (!p.ctx) T = performance.now() / 1000 - p.t0;
    p.ctl.forEach(function (a) { a.ve(T, p, dt, now); });
    if (API._quay && p.ctl[0]) API._quay(p.ctl[0].canvas, T, p);
    if (API._vet) { var a0 = p.ctl[0], P0 = a0 && a0.P; API._vet.push([now, T, P0 ? P0.h : 0, P0 ? P0.sw : 0, P0 ? P0.cur : 0, p.ctx ? p.ctx.currentTime : 0]); }
    var het = (p.tDung != null ? p.tDung : p.dur) + 0.65;
    if (T > het) { ketThucLuot(); return; }
    lapLai = requestAnimationFrame(vong);
  }
  function ketThucLuot() {
    var p = choi; choi = null;
    if (p) p.ctl.forEach(function (a) { a.tat(); });
  }

  // ---------------------------------------------------------------------------------------------- API
  API.gan = function (el, opt) {
    chenCss();
    var a = new Avatar(el, opt);
    if (!a.img) return { go: function () {}, dangNoi: function () { return false; } };
    DS.push(a);
    napRig();
    return a.ctl;
  };
  API.chuanBi = function (lineId, pcm, opt) {
    opt = opt || {};
    try { return phanTichCau({ lineId: lineId, pcm: pcm, nhanVat: opt.nhanVat, text: opt.text, the: opt.the }); } catch (e) { return null; }
  };
  API.phatLuot = function (o) {
    return napRig().then(function () { return batDauLuot(o); });
  };
  function batDauLuot(o) {
    if (choi) ketThucLuot();
    var ctl = chon(o.lineId, o.nhanVat);
    if (!ctl.length) return null;
    var pt = phanTichCau({ lineId: o.lineId, pcm: o.pcm, nhanVat: o.nhanVat, text: o.text, the: o.the });
    var p = taoLuot(o, pt);
    p.ctl = ctl.filter(function (a) { return a.bat(p); });
    if (!p.ctl.length) return null;
    choi = p;
    lanCuoi = 0;
    if (!lapLai) lapLai = requestAnimationFrame(vong);
    return p;
  }
  API.khiClip = function (info) {
    var m = info.meta || {};
    if (info.kind !== 'nhan-vat') { API.khiDung(); return; }
    // Phan tich dong bo (~20-60 ms) roi chay; dong ho AudioContext nen khong lech du bat dau tre.
    var pcm = info.pcm;
    if (!rig) { napRig().then(function () { batDauLuot({ lineId: m.lineId, nhanVat: m.nhanVat, t0: info.t0, pcm: pcm, ctx: info.ctx, text: m.text, the: m.the }); }); return; }
    batDauLuot({ lineId: m.lineId, nhanVat: m.nhanVat, t0: info.t0, pcm: pcm, ctx: info.ctx, text: m.text, the: m.the });
  };
  API.khiDung = function () {
    var p = choi;
    if (!p) return;
    var T = p.ctx ? gioNghe(p.ctx) - p.t0 : performance.now() / 1000 - p.t0;
    p.tDung = Math.min(Math.max(T, 0), p.dur);
  };
  API.dangPhat = function () { return choi ? { lineId: choi.lineId, nhanVat: choi.nhanVat, emotion: choi.emotion } : null; };

  // Giong trinh duyet (khong co PCM): nhep theo kana, dong ho trinh duyet. Chi dung khi khong co giong that.
  var NGUYEN_AM = { a: 'あかさたなはまやらわがざだばぱぁゃゎ', i: 'いきしちにひみりぎじぢびぴぃ', u: 'うくすつぬふむゆるぐずづぶぷぅゅ', e: 'えけせてねへめれげぜでべぺぇ', o: 'おこそとのほもよろをごぞどぼぽぉょ' };
  var MOI_DONG = 'まみむめもばびぶべぼぱぴぷぺぽ';
  function kanaSangChuoi(text) {
    var t = String(text || '').replace(/[ァ-ヶ]/g, function (ch) { return String.fromCharCode(ch.charCodeAt(0) - 0x60); });
    var FPS = 120, seq = [], i, ch;
    for (i = 0; i < t.length; i++) {
      ch = t[i];
      var v = null;
      for (var k in NGUYEN_AM) if (NGUYEN_AM[k].indexOf(ch) >= 0) v = k;
      if (v) seq.push({ v: v, d: 0.125, dong: MOI_DONG.indexOf(ch) >= 0 });
      else if (ch === 'ん') seq.push({ v: 'kin', d: 0.1 });
      else if (ch === 'っ') seq.push({ v: 'kin', d: 0.07 });
      else if (ch === 'ー' && seq.length) seq[seq.length - 1].d += 0.11;
      else if (/[、,，]/.test(ch)) seq.push({ v: 'kin', d: 0.22, nghi: true });
      else if (/[。！？!?.…]/.test(ch)) seq.push({ v: 'kin', d: 0.35, nghi: true });
      else if (/[一-鿿]/.test(ch)) { seq.push({ v: 'a', d: 0.13 }); seq.push({ v: 'o2', d: 0.12 }); }
    }
    var tong = seq.reduce(function (s, q) { return s + q.d; }, 0) + 0.2, n = Math.ceil(tong * FPS);
    var A = new Uint8Array(n), B = new Uint8Array(n), T = new Uint8Array(n), M = new Uint8Array(n), at = 0.05;
    seq.forEach(function (q) {
      var k0 = Math.round(at * FPS), k1 = Math.min(n, Math.round((at + q.d) * FPS)), idx = KHOA_H.indexOf(q.v);
      for (var j = k0; j < k1; j++) {
        var rel = (j - k0) / Math.max(1, k1 - k0);
        var dong = q.dong && rel < 0.3;
        A[j] = B[j] = dong || idx < 0 || q.v === 'kin' ? 0 : idx;
        M[j] = dong || q.v === 'kin' ? 0 : Math.round(255 * (0.55 + 0.35 * Math.sin(Math.PI * rel)));
      }
      at += q.d;
    });
    return { fps: FPS, n: n, dur: tong, a: A, b: B, t: T, mo: M };
  }
  API.phatGia = function (o) {
    return napRig().then(function () {
      if (choi) ketThucLuot();
      var ctl = chon(o.lineId, o.nhanVat);
      if (!ctl.length) return null;
      var tl = kanaSangChuoi(o.text);
      var kq = giaiCamXuc({ the: o.the, text: o.text, pro: null, nen: null });
      kq.dur = tl.dur; kq.su = suKienBieuCam(kq, null, tl.dur);
      var p = taoLuot({ lineId: o.lineId, nhanVat: o.nhanVat, t0: performance.now() / 1000, ctx: null }, { kq: kq, tl: tl, seg: [{ t: -0.12, emo: kq.emotion }] });
      p.ctl = ctl.filter(function (a) { return a.bat(p); });
      if (!p.ctl.length) return null;
      choi = p; lanCuoi = 0;
      if (!lapLai) lapLai = requestAnimationFrame(vong);
      return p;
    });
  };

  /** Gan san cac avatar cua tab Hoi thoai (slide-engine goi sau moi lan render): moi .kw-row mot avatar, lineId = id bong thoai. */
  API.ganKaiwa = function (goc) {
    (goc || document).querySelectorAll('.kw-row').forEach(function (row) {
      var img = row.querySelector('.kw-ava.is-anh img'), bb = row.querySelector('.kw-bubble[id]');
      if (!img || !bb || img.dataset.avn) return;
      img.dataset.avn = '1';
      API.gan(img, { lineId: bb.id });
    });
  };
  API.xoaTatCa = function () { DS.slice().forEach(function (a) { a.go(); }); };
  API._ds = function () { return DS; };
  API._rig = function () { return rig; };
  API.napRig = napRig;
  API._khungKana = kanaSangChuoi;
  API.datGiamChuyen = function (b) { GIAM_CHUYEN = !!b; };
  napRig();
})(typeof window !== 'undefined' ? window : globalThis);
