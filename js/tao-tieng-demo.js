/**
 * TAO TIENG SENSEI CHO VIDEO DEMO — cong cu CHU BAI tu chay, chi nap khi co ?taoTiengDemo=1 tren dia chi trang
 * (index.html nap tep nay theo yeu cau, giong ?ngheGiong cua js/nghe-giong.js).
 *
 * Muc dich: 10 video demo dung CHUNG mot kich ban loi Sensei (E:\sensei-tam\demo2\kich-ban.json, 21 dong).
 * Cong cu nay tong hop tieng that cua Sensei (Gemini Live, giong Charon) cho tung dong, xu ly am thanh
 * trong trinh duyet roi xuat mot tep ZIP (21 WAV 24 kHz mono 16-bit + manifest.json) de buoc ghep video dung.
 *
 * DUONG TONG HOP la DUONG SAN XUAT cua app (khong viet lai):
 *   - VoiceActorPool (js/voice-actors.js): phien Live khoa san mot giong (Charon), ACTOR_BRIEF khong dich / khong them bot,
 *     doc dung ngon ngu cua tung cau (tieng Viet xen chu Nhat deu doc dung);
 *   - model: SENSEI_MODELS.actor roi actorFallback (giong nghe-giong.js / sensei-doc.js), khoa: key1..key4 trong window.SENSEI_ENV;
 *   - bo nho tiep tuc: SenseiDoc.layBoNho / luuBoNho (IndexedDB 'sensei_tts', cung khoa voice|kieu|van ban) neu co SenseiDoc.
 *     Khong co SenseiDoc hoac IndexedDB loi thi chi giu trong RAM cua trang nay.
 *
 * An toan: khoa chi doc luc bam nut, khong bao gio ghi ra DOM / console / manifest / ZIP; moi thong bao loi deu duoc che
 * (mau 'key=...', 'AIza...', va chinh gia tri cua khoa). Moi lan chi mo MOT phien Live.
 *
 * Kiem thu (khong goi API that): TaoTiengDemo.datTongHop(fn) — fn({voice, text, id, lan}) -> Uint8Array PCM 24 kHz mono 16-bit.
 */
(function () {
  'use strict';

  const SENSEI_VOICE = 'Charon';        // giong Sensei chot cung (js/app.js SENSEI_VOICE)
  const PHIEN_BAN = 1;
  const SR = 24000;
  const CAU_HINH = {
    nguongDB: -45,        // duoi muc nay (dinh moi khung) la im lang
    khungMs: 5,
    dauMs: 60,            // giu lai truoc tieng dau tien
    duoiMs: 120,          // giu lai sau tieng cuoi cung
    dinhDB: -3,           // chuan hoa dinh
    fadeMs: 5,
    tyLeQuaDai: 0.15,     // dai hon ke hoach hon 15% thi canh bao
    giaTriToiDaDB: 30,    // khong khuech dai qua muc nay (chong khuech dai tieng on)
    gapMs: 800,           // nghi giua hai dong (khong tinh dong lay tu bo nho)
    thuLaiToiDa: 2,       // thu lai toi da 2 lan sau lan dau
  };

  // ---------------------------------------------------------------- kich ban noi bo (sao tu E:\sensei-tam\demo2\kich-ban.json, bai n5-1)
  // doc: ban DOC thanh tieng neu khac phu de (dong 'cau-hoi-1' co cho trong ___ khong doc duoc thanh tieng)
  const KICH_BAN_NOI_BO = {
    bai: 'n5-1', tenZip: 'tieng-sensei-bai1.zip', tongThoiGian: 59.2, nguon: 'kich-ban.json (nhúng sẵn)',
    dong: [
      { id: 'mo-dau-1', t: 0.3, dur: 2.4, text: 'Chào các bạn! Mình là Sensei Mèo đây.' },
      { id: 'mo-dau-2', t: 2.8, dur: 2.6, text: 'Hôm nay mình học Bài 1: Giới thiệu bản thân.' },
      { id: 'tu-watashi-1', t: 5.7, dur: 2.6, text: 'Từ đầu tiên: 私, đọc là わたし.' },
      { id: 'tu-watashi-2', t: 8.4, dur: 2.6, text: 'Nghĩa là “tôi”, dùng được trong mọi tình huống.' },
      { id: 'tu-gakusei-1', t: 11.3, dur: 2.3, text: 'Tiếp theo: 学生, がくせい.' },
      { id: 'tu-gakusei-2', t: 13.7, dur: 2.3, text: 'Là học sinh, sinh viên.' },
      { id: 'tu-sensei-1', t: 16.3, dur: 2.2, text: 'Còn đây là 先生, せんせい.' },
      { id: 'tu-sensei-2', t: 18.6, dur: 1.8, text: 'Thầy cô giáo, giống mình nè!' },
      { id: 'tu-sensei-3', t: 20.5, dur: 2.0, text: 'Nhưng chỉ dùng để GỌI người khác thôi nhé.' },
      { id: 'mau-cau-1', t: 22.7, dur: 2.6, text: 'Ghép lại, ta có mẫu câu: N1 は N2 です.' },
      { id: 'mau-cau-2', t: 25.4, dur: 3.0, text: 'N1 là chủ đề, N2 là vị ngữ, です kết câu lịch sự.' },
      { id: 'mau-cau-3', t: 28.5, dur: 3.0, text: 'Chú ý: は ở đây đọc là “wa”, không phải “ha”!' },
      { id: 'vi-du-khang-dinh-1', t: 31.7, dur: 2.8, text: 'Ví dụ: わたしはマイク・ミラーです.' },
      { id: 'vi-du-khang-dinh-2', t: 34.7, dur: 3.1, text: 'Nghĩa là: Tôi là Mike Miller.' },
      { id: 'vi-du-phu-dinh-1', t: 38.1, dur: 2.6, text: 'Muốn phủ định, đổi です thành じゃありません.' },
      { id: 'vi-du-phu-dinh-2', t: 40.8, dur: 4.0, text: 'サントスさんはがくせいじゃありません: anh Santos không phải sinh viên.' },
      { id: 'cau-hoi-1', t: 45.1, dur: 3.0, text: 'Thử nhé: わたし ___ ナムです. Điền trợ từ nào?', doc: 'Thử nhé: わたし, chỗ trống, ナムです. Điền trợ từ nào?' },
      { id: 'cau-hoi-2', t: 48.2, dur: 1.8, text: 'が à? Chưa đúng rồi!' },
      { id: 'cau-hoi-3', t: 50.1, dur: 3.3, text: 'Đáp án là は, đọc là “wa”. Chính xác!' },
      { id: 'ket-bai-1', t: 53.7, dur: 2.9, text: 'Tóm lại: 私, 学生, 先生 và mẫu câu N1 は N2 です.' },
      { id: 'ket-bai-2', t: 56.7, dur: 2.3, text: 'Hẹn gặp lại ở bài sau nhé. またね!' },
    ],
  };

  // ---------------------------------------------------------------- khoa + che khoa (mau cua nghe-giong.js)
  const layKhoa = () => {
    const e = window.SENSEI_ENV || {};
    return [e.key1, e.key2, e.key3, e.key4].map(k => String(k || '').trim()).filter(Boolean);
  };
  const che = (msg) => {
    let s = String(msg == null ? '' : msg);
    layKhoa().forEach((k) => { if (k.length >= 4) s = s.split(k).join('***'); });
    return s.replace(/key=[^&\s"']+/gi, 'key=***').replace(/AIza[0-9A-Za-z_-]{20,}/g, '***');
  };
  const ngu = (ms) => new Promise(res => setTimeout(res, ms));

  // ---------------------------------------------------------------- xu ly am thanh (thuan tuy)
  /** Int16 little-endian -> Float32 [-1,1] */
  function pcmSangFloat(bytes) {
    const n = Math.floor(bytes.length / 2);
    const view = new DataView(bytes.buffer, bytes.byteOffset, n * 2);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = view.getInt16(i * 2, true) / 32768;
    return out;
  }
  function dinhTuyetDoi(f) {
    let m = 0;
    for (let i = 0; i < f.length; i++) { const a = Math.abs(f[i]); if (a > m) m = a; }
    return m;
  }
  const sangDB = (x) => (x > 0 ? 20 * Math.log10(x) : -Infinity);

  /**
   * Cat im lang dau / duoi (nguong -45 dBFS tren dinh moi khung 5 ms; giu 60 ms dau, 120 ms duoi),
   * chuan hoa dinh ve -3 dBFS, fade 5 ms hai dau. Tra PCM Int16 LE + so do.
   */
  function xuLy(pcmBytes, cfg) {
    cfg = Object.assign({}, CAU_HINH, cfg || {});
    const f = pcmSangFloat(pcmBytes);
    const goc = { giay: f.length / SR, dinhDB: sangDB(dinhTuyetDoi(f)) };
    if (!f.length || !(dinhTuyetDoi(f) > 0)) throw new Error('âm thanh trống hoặc im lặng hoàn toàn');
    const khung = Math.max(1, Math.round(SR * cfg.khungMs / 1000));
    const nguong = Math.pow(10, cfg.nguongDB / 20);
    let dau = -1, cuoi = -1;
    for (let s = 0; s < f.length; s += khung) {
      const e = Math.min(f.length, s + khung);
      let m = 0;
      for (let i = s; i < e; i++) { const a = Math.abs(f[i]); if (a > m) m = a; }
      if (m >= nguong) { if (dau < 0) dau = s; cuoi = e; }
    }
    if (dau < 0) throw new Error('âm thanh toàn dưới ' + cfg.nguongDB + ' dBFS (im lặng)');
    const giuDau = Math.round(SR * cfg.dauMs / 1000), giuDuoi = Math.round(SR * cfg.duoiMs / 1000);
    const a = Math.max(0, dau - giuDau), b = Math.min(f.length, cuoi + giuDuoi);
    const x = f.slice(a, b);
    const dinhCat = dinhTuyetDoi(x);
    let gain = Math.pow(10, cfg.dinhDB / 20) / dinhCat;
    const gainToiDa = Math.pow(10, cfg.giaTriToiDaDB / 20);
    let biChan = false;
    if (gain > gainToiDa) { gain = gainToiDa; biChan = true; }
    for (let i = 0; i < x.length; i++) x[i] *= gain;
    const nf = Math.min(Math.round(SR * cfg.fadeMs / 1000), x.length >> 1);
    for (let i = 0; i < nf; i++) {
      const k = i / nf;
      x[i] *= k;
      x[x.length - 1 - i] *= k;
    }
    const ra = new Uint8Array(x.length * 2), dv = new DataView(ra.buffer);
    let dinhInt = 0;
    for (let i = 0; i < x.length; i++) {
      let v = Math.round(x[i] * 32768);
      if (v > 32767) v = 32767; else if (v < -32768) v = -32768;
      dv.setInt16(i * 2, v, true);
      if (Math.abs(v) > dinhInt) dinhInt = Math.abs(v);
    }
    return {
      pcm: ra,
      giay: x.length / SR,
      dinhDB: sangDB(dinhInt / 32768),
      goc,
      catDau: a / SR,
      catDuoi: (f.length - b) / SR,
      gainDB: sangDB(gain),
      biChanGain: biChan,
    };
  }

  /** WAV 24 kHz mono 16-bit PCM, header RIFF 44 byte */
  function taoWav(pcm) {
    const n = pcm.length, out = new Uint8Array(44 + n), dv = new DataView(out.buffer);
    const w4 = (o, s) => { for (let i = 0; i < 4; i++) out[o + i] = s.charCodeAt(i); };
    w4(0, 'RIFF'); dv.setUint32(4, 36 + n, true); w4(8, 'WAVE');
    w4(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, SR, true); dv.setUint32(28, SR * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
    w4(36, 'data'); dv.setUint32(40, n, true);
    out.set(pcm, 44);
    return out;
  }

  // ---------------------------------------------------------------- ZIP toi thieu (STORE, khong thu vien)
  const BANG_CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(u8) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < u8.length; i++) c = BANG_CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  /** files: [{ ten, du: Uint8Array }] -> Uint8Array zip (STORE, ten UTF-8) */
  function taoZip(files, ngay) {
    const d = ngay || new Date();
    const gioDos = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF;
    const ngayDos = ((Math.max(0, d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
    const enc = new TextEncoder();
    const muc = files.map((f) => ({ ten: enc.encode(f.ten), du: f.du, crc: crc32(f.du), vt: 0 }));
    let tong = 22;
    muc.forEach((m) => { tong += 30 + m.ten.length + m.du.length + 46 + m.ten.length; });
    const out = new Uint8Array(tong), dv = new DataView(out.buffer);
    let p = 0;
    muc.forEach((m) => {
      m.vt = p;
      dv.setUint32(p, 0x04034b50, true); dv.setUint16(p + 4, 20, true); dv.setUint16(p + 6, 0x0800, true); dv.setUint16(p + 8, 0, true);
      dv.setUint16(p + 10, gioDos, true); dv.setUint16(p + 12, ngayDos, true); dv.setUint32(p + 14, m.crc, true);
      dv.setUint32(p + 18, m.du.length, true); dv.setUint32(p + 22, m.du.length, true);
      dv.setUint16(p + 26, m.ten.length, true); dv.setUint16(p + 28, 0, true);
      p += 30; out.set(m.ten, p); p += m.ten.length; out.set(m.du, p); p += m.du.length;
    });
    const batDauCd = p;
    muc.forEach((m) => {
      dv.setUint32(p, 0x02014b50, true); dv.setUint16(p + 4, 20, true); dv.setUint16(p + 6, 20, true); dv.setUint16(p + 8, 0x0800, true);
      dv.setUint16(p + 10, 0, true); dv.setUint16(p + 12, gioDos, true); dv.setUint16(p + 14, ngayDos, true); dv.setUint32(p + 16, m.crc, true);
      dv.setUint32(p + 20, m.du.length, true); dv.setUint32(p + 24, m.du.length, true);
      dv.setUint16(p + 28, m.ten.length, true); dv.setUint16(p + 30, 0, true); dv.setUint16(p + 32, 0, true);
      dv.setUint16(p + 34, 0, true); dv.setUint16(p + 36, 0, true); dv.setUint32(p + 38, 0, true); dv.setUint32(p + 42, m.vt, true);
      p += 46; out.set(m.ten, p); p += m.ten.length;
    });
    const cdLen = p - batDauCd;
    dv.setUint32(p, 0x06054b50, true); dv.setUint16(p + 4, 0, true); dv.setUint16(p + 6, 0, true);
    dv.setUint16(p + 8, muc.length, true); dv.setUint16(p + 10, muc.length, true);
    dv.setUint32(p + 12, cdLen, true); dv.setUint32(p + 16, batDauCd, true); dv.setUint16(p + 20, 0, true);
    return out;
  }

  // ---------------------------------------------------------------- trang thai
  let kichBan = null;            // { bai, tenZip, tongThoiGian, nguon, dong:[...] }
  let dong = [];                 // hang: { id, text, doc, t, dur, tt, pcm, giay, dinhDB, goc, ..., loi, lan, tr, o:{} }
  let fake = null;
  let dangChay = false, huy = false, batDauChay = 0, thoiGianDong = [];
  let phien = null;              // { pool, key, model }
  let thuTuModel = null;
  let ui = {};
  const toiDaLan = () => 1 + CAU_HINH.thuLaiToiDa;

  function datKichBan(kb, giuDaXong) {
    const cu = new Map(dong.map(d => [d.id, d]));
    kichBan = kb;
    dong = kb.dong.map((l) => {
      const d = { id: l.id, text: l.text, doc: l.doc || '', t: l.t, dur: l.dur, tt: 'cho', pcm: null, giay: 0, dinhDB: 0, goc: null, catDau: 0, catDuoi: 0, gainDB: 0, quaDai: false, tyLe: 0, tuBoNho: false, model: '', loi: '', lan: 0 };
      const c = cu.get(l.id);
      if (giuDaXong && c && c.tt === 'xong' && c.text === d.text && c.doc === d.doc) Object.assign(d, c, { t: l.t, dur: l.dur, tr: null, o: null });
      return d;
    });
    dong.forEach(tinhTyLe);
  }
  function tinhTyLe(d) {
    if (d.tt !== 'xong') return;
    d.tyLe = d.dur > 0 ? d.giay / d.dur - 1 : 0;
    d.quaDai = d.dur > 0 && d.giay > d.dur * (1 + CAU_HINH.tyLeQuaDai);
  }

  // ---------------------------------------------------------------- tong hop (duong san xuat: phien Live khoa giong Charon)
  function dongPhien() {
    if (!phien) return;
    try { phien.pool.closeAll(); } catch (e) {}
    phien = null;
  }
  async function tongHopThat(van, lan) {
    const keys = layKhoa();
    if (!keys.length) throw new Error('Không thấy khóa API trong env.js (trang chưa nạp được env.js).');
    if (!window.VoiceActorPool) throw new Error('Thiếu js/voice-actors.js.');
    const mac = window.SENSEI_MODELS ? [SENSEI_MODELS.actor, SENSEI_MODELS.actorFallback].filter(Boolean) : ['models/gemini-3.1-flash-live-preview'];
    const models = (thuTuModel || mac).slice();
    const key = keys[(lan - 1) % keys.length];     // moi lan thu lai doi sang khoa khac (neu co nhieu khoa)
    const loiDs = [];
    for (const model of models) {
      if (huy) throw new Error('đã dừng');
      if (phien && (phien.key !== key || phien.model !== model)) dongPhien();
      if (!phien) phien = { pool: new window.VoiceActorPool({ apiKey: key, model }), key, model };
      const r = await phien.pool.speak(SENSEI_VOICE, van, '');
      if (r && r.ok) { thuTuModel = [model].concat(mac.filter(m => m !== model)); return { pcm: r.pcm, model: String(model).replace(/^models\//, '') }; }
      const loi = (r && r.reason) || 'không rõ';
      loiDs.push(String(model).replace(/^models\//, '') + ': ' + loi);
      try { phien.pool.close(SENSEI_VOICE); } catch (e) {}   // bo phien hong, lan sau mo lai
      if (/quota|RESOURCE_EXHAUSTED|\b429\b/i.test(loi)) break;
    }
    throw new Error(che(loiDs.join(' · ') || 'không rõ'));
  }

  async function layPcm(d, boQuaBoNho) {
    const van = d.doc || d.text;
    const D = window.SenseiDoc;
    if (!fake && !boQuaBoNho && D && D.layBoNho) {
      try {
        const hit = await D.layBoNho(SENSEI_VOICE, '', van);
        if (hit && hit.length > 1000) return { pcm: hit, tuBoNho: true, model: 'bộ nhớ' };
      } catch (e) {}
    }
    if (fake) {
      const pcm = await fake({ voice: SENSEI_VOICE, text: van, id: d.id, lan: d.lan });
      if (!pcm || !pcm.length) throw new Error('bộ tổng hợp giả trả về rỗng');
      return { pcm: pcm instanceof Uint8Array ? pcm : new Uint8Array(pcm.buffer || pcm), tuBoNho: false, model: 'tong-hop-gia' };
    }
    const kq = await tongHopThat(van, d.lan);
    if (D && D.luuBoNho) { try { D.luuBoNho(SENSEI_VOICE, '', van, kq.pcm); } catch (e) {} }
    return { pcm: kq.pcm, tuBoNho: false, model: kq.model };
  }

  /** Tao mot dong (toi da 1 + 2 lan thu). Tra 'ok' | 'bo-nho' | 'loi' | 'huy' */
  async function xuLyDong(d, boQuaBoNho) {
    d.tt = 'dang'; d.loi = ''; ve(d);
    const toiDa = toiDaLan();
    for (let lan = 1; lan <= toiDa; lan++) {
      if (huy) { d.tt = 'cho'; d.loi = ''; d.lan = 0; ve(d); return 'huy'; }
      d.lan = lan; ve(d);
      const t0 = Date.now();
      try {
        const kq = await layPcm(d, boQuaBoNho || lan > 1);
        const x = xuLy(kq.pcm);
        Object.assign(d, { pcm: x.pcm, giay: x.giay, dinhDB: x.dinhDB, goc: x.goc, catDau: x.catDau, catDuoi: x.catDuoi, gainDB: x.gainDB, biChanGain: x.biChanGain, tuBoNho: kq.tuBoNho, model: kq.model, tt: 'xong', loi: '' });
        tinhTyLe(d);
        if (!kq.tuBoNho) thoiGianDong.push(Date.now() - t0);
        ve(d);
        return kq.tuBoNho ? 'bo-nho' : 'ok';
      } catch (e) {
        if (huy) { d.tt = 'cho'; d.loi = ''; d.lan = 0; ve(d); return 'huy'; }
        d.loi = che(e && e.message || e);
        ve(d);
        if (lan < toiDa) await ngu(CAU_HINH.gapMs);
      }
    }
    d.tt = 'loi'; ve(d);
    return 'loi';
  }

  function capNhatNut() {
    const coKhoa = !!(fake || layKhoa().length);
    ui.btnTatCa.disabled = dangChay || !coKhoa;
    ui.btnDung.disabled = !dangChay;
    ui.btnZip.disabled = !dong.some(d => d.tt === 'xong');
    ui.fileKb.disabled = dangChay;
    dong.forEach((d) => {
      if (!d.o) return;
      d.o.btnLai.disabled = dangChay || !coKhoa;
      d.o.btnNghe.disabled = d.tt !== 'xong';
    });
    ui.baoKhoa.hidden = coKhoa;
  }

  async function chayTatCa() {
    if (dangChay) return;
    dangChay = true; huy = false; batDauChay = Date.now(); thoiGianDong = [];
    capNhatNut(); dungPhat();
    let canNghi = false;      // nghi 800 ms sau moi dong da goi API (dong lay tu bo nho thi khong)
    try {
      for (const d of dong) {
        if (huy) break;
        if (d.tt === 'xong') continue;
        if (canNghi) { await ngu(CAU_HINH.gapMs); if (huy) break; }
        const r = await xuLyDong(d, false);
        if (r === 'huy') break;
        canNghi = r !== 'bo-nho';
        capNhatTong();
      }
    } finally {
      dongPhien();
      dangChay = false;
      capNhatNut(); capNhatTong();
    }
    const loiN = dong.filter(d => d.tt === 'loi').length, xongN = dong.filter(d => d.tt === 'xong').length;
    ui.ketThuc.textContent = huy ? 'Đã dừng. Bấm “Tạo tất cả” để chạy tiếp (các dòng đã xong được giữ).'
      : (loiN ? `Xong ${xongN}/${dong.length}, còn ${loiN} dòng lỗi: bấm “Tạo tất cả” để thử lại các dòng lỗi.` : `Đã tạo đủ ${xongN}/${dong.length} dòng. Bấm “Tải tất cả (.zip)”.`);
  }

  async function chayMot(d) {
    if (dangChay) return;
    dangChay = true; huy = false; batDauChay = Date.now(); thoiGianDong = [];
    capNhatNut(); dungPhat();
    try { await xuLyDong(d, true); } finally { dongPhien(); dangChay = false; capNhatNut(); capNhatTong(); }
  }

  function dung() {
    if (!dangChay) return;
    huy = true;
    dongPhien();   // dong phien Live: cau dang doi bi huy ngay, khong cho het han 30 s
  }

  // ---------------------------------------------------------------- phat thu
  let ctxPhat = null, nguonPhat = null, dongDangNghe = null;
  function dungPhat() {
    try { if (nguonPhat) { nguonPhat.onended = null; nguonPhat.stop(); } } catch (e) {}
    nguonPhat = null;
    if (dongDangNghe) { const d = dongDangNghe; dongDangNghe = null; if (d.o) d.o.btnNghe.textContent = 'Nghe'; }
  }
  async function nghe(d) {
    if (dongDangNghe === d) { dungPhat(); return; }
    dungPhat();
    if (!d.pcm) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { d.o.tdTt.title = 'Trình duyệt không có AudioContext'; return; }
    if (!ctxPhat) ctxPhat = new AC();
    if (ctxPhat.state === 'suspended') { try { await ctxPhat.resume(); } catch (e) {} }
    const f = pcmSangFloat(d.pcm);
    const buf = ctxPhat.createBuffer(1, f.length, SR);
    buf.copyToChannel(f, 0);
    const src = ctxPhat.createBufferSource();
    src.buffer = buf; src.connect(ctxPhat.destination);
    nguonPhat = src; dongDangNghe = d; d.o.btnNghe.textContent = 'Dừng nghe';
    src.onended = () => { if (nguonPhat === src) dungPhat(); };
    src.start();
  }

  // ---------------------------------------------------------------- xuat
  function dungManifest(dsXong) {
    const dem = {};
    dsXong.forEach((d) => { dem[d.model] = (dem[d.model] || 0) + 1; });
    const model = Object.keys(dem).sort((a, b) => dem[b] - dem[a])[0] || '';
    return {
      phienBan: PHIEN_BAN,
      giong: SENSEI_VOICE,
      model,
      dinhDang: { tanSo: SR, kenh: 1, bit: 16 },
      bai: kichBan.bai,
      tongThoiGianKichBan: kichBan.tongThoiGian || null,
      xuLy: { nguongDB: CAU_HINH.nguongDB, giuDauMs: CAU_HINH.dauMs, giuDuoiMs: CAU_HINH.duoiMs, dinhDB: CAU_HINH.dinhDB, fadeMs: CAU_HINH.fadeMs, canhBaoQuaDai: CAU_HINH.tyLeQuaDai },
      clips: dsXong.map((d) => {
        const c = {
          id: d.id, text: d.text, file: d.id + '.wav',
          doDaiGiay: Math.round(d.giay * 1000) / 1000,
          dinhDBFS: Math.round(d.dinhDB * 100) / 100,
          ketHoach: { t: d.t, dur: d.dur },
          tyLeSoVoiKeHoach: Math.round(d.tyLe * 1000) / 1000,
          quaDai: !!d.quaDai,
        };
        if (d.doc) c.vanBanDoc = d.doc;
        return c;
      }),
    };
  }
  function dungZip() {
    const dsXong = dong.filter(d => d.tt === 'xong');
    const man = dungManifest(dsXong);
    const enc = new TextEncoder();
    const files = dsXong.map(d => ({ ten: d.id + '.wav', du: taoWav(d.pcm) }));
    files.push({ ten: 'manifest.json', du: enc.encode(JSON.stringify(man, null, 2) + '\n') });
    const u8 = taoZip(files);
    return { blob: new Blob([u8], { type: 'application/zip' }), soDong: dsXong.length, tenTep: kichBan.tenZip || ('tieng-sensei-' + String(kichBan.bai || 'bai').replace(/[^a-z0-9_-]+/gi, '') + '.zip') };
  }
  function taiZip() {
    const z = dungZip();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(z.blob); a.download = z.tenTep;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 20000);
    ui.baoZip.textContent = z.soDong === dong.length
      ? `Đã tải ${z.tenTep}: ${z.soDong} dòng + manifest.json.`
      : `Đã tải ${z.tenTep} nhưng mới có ${z.soDong}/${dong.length} dòng — nên tạo đủ rồi tải lại.`;
  }

  // ---------------------------------------------------------------- doc kich ban khac
  function phanTichKichBan(j, tenTep) {
    let ds = [];
    if (Array.isArray(j)) ds = j.map((l, i) => ({ id: String(l.id || ('dong-' + (i + 1))), t: +l.t || 0, dur: +l.dur || 0, text: String(l.text || ''), doc: l.doc ? String(l.doc) : '' }));
    else if (j && Array.isArray(j.beats)) {
      j.beats.forEach((b) => (b.loi || []).forEach((l, i) => ds.push({ id: String(b.id || 'beat') + '-' + (i + 1), t: +l.t || 0, dur: +l.dur || 0, text: String(l.text || ''), doc: l.doc ? String(l.doc) : '' })));
    } else throw new Error('Không đúng định dạng kich-ban.json (cần beats[].loi[] có t, dur, text).');
    ds = ds.filter(l => l.text.trim());
    if (!ds.length) throw new Error('Kịch bản không có dòng lời nào.');
    const trung = ds.map(l => l.id).filter((x, i, a) => a.indexOf(x) !== i);
    if (trung.length) throw new Error('Trùng id dòng: ' + trung.slice(0, 3).join(', '));
    const bai = (j && j.bai) ? String(j.bai) : 'bai';
    return { bai, tenZip: 'tieng-sensei-' + bai.replace(/[^a-z0-9_-]+/gi, '') + '.zip', tongThoiGian: (j && j.tongThoiGian) || null, nguon: tenTep || 'kịch bản khác', dong: ds };
  }

  // ---------------------------------------------------------------- giao dien
  const h = (tag, thuocTinh, ...con) => {
    const el = document.createElement(tag);
    Object.entries(thuocTinh || {}).forEach(([k, v]) => {
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    });
    con.flat().forEach(c => el.append(c == null ? '' : c.nodeType ? c : document.createTextNode(String(c))));
    return el;
  };
  const so = (x, n) => Number(x).toFixed(n).replace('.', ',');
  const dB = (x) => (isFinite(x) ? so(x, 1).replace('-', '−') : '−∞');
  const mmss = (ms) => { const s = Math.round(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  const CSS = `
  #tao-tieng{position:fixed;inset:0;z-index:2147483000;overflow:auto;background:#0b1220;color:#e5e7eb;font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
  #tao-tieng *{box-sizing:border-box}
  #tao-tieng .vo{max-width:1280px;margin:0 auto;padding:20px 24px 40px}
  #tao-tieng h1{margin:0;font-size:22px;font-weight:700;letter-spacing:.2px}
  #tao-tieng .phu{color:#94a3b8}
  #tao-tieng .dau{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 16px}
  #tao-tieng .the{display:inline-block;padding:1px 9px;border:1px solid #334155;border-radius:999px;font-size:12px;color:#cbd5e1;background:#111b2e}
  #tao-tieng ol{list-style:decimal outside;margin:12px 0 0;padding:12px 16px 12px 40px;background:#111b2e;border:1px solid #1e293b;border-radius:10px;color:#cbd5e1}
  #tao-tieng ol li{display:list-item;margin:2px 0}
  #tao-tieng ol b{color:#fff}
  #tao-tieng .bao{margin:12px 0 0;padding:10px 14px;border-radius:10px;border:1px solid #7f1d1d;background:#2a1215;color:#fecaca}
  #tao-tieng .bao[hidden]{display:none}
  #tao-tieng .thanh{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:16px 0 8px}
  #tao-tieng button,#tao-tieng .nut-tep{background:#2563eb;color:#fff;border:0;border-radius:8px;padding:8px 16px;cursor:pointer;font:inherit;font-weight:600}
  #tao-tieng button:hover:not(:disabled),#tao-tieng .nut-tep:hover{filter:brightness(1.1)}
  #tao-tieng button.pn,#tao-tieng .nut-tep{background:#1e293b;color:#e2e8f0;font-weight:500;border:1px solid #334155}
  #tao-tieng button.nho{padding:3px 10px;font-size:13px;font-weight:500}
  #tao-tieng button:disabled{opacity:.4;cursor:default}
  #tao-tieng .nut-tep input{display:none}
  #tao-tieng .tien{height:6px;border-radius:999px;background:#1e293b;overflow:hidden;margin:6px 0}
  #tao-tieng .tien>div{height:100%;width:0;background:#2563eb;transition:width .25s}
  #tao-tieng .tong{display:flex;flex-wrap:wrap;gap:4px 18px;font-size:13px;color:#94a3b8}
  #tao-tieng .khung-bang{margin-top:12px;border:1px solid #1e293b;border-radius:10px;overflow:hidden}
  #tao-tieng table{width:100%;border-collapse:collapse}
  #tao-tieng th,#tao-tieng td{padding:7px 10px;border-bottom:1px solid #162033;text-align:left;vertical-align:top}
  #tao-tieng th{position:sticky;top:0;background:#111b2e;color:#94a3b8;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.4px;z-index:1}
  #tao-tieng tr:last-child td{border-bottom:0}
  #tao-tieng td.id{font-family:ui-monospace,Consolas,monospace;font-size:12px;color:#94a3b8;white-space:nowrap}
  #tao-tieng td.kh{white-space:nowrap;color:#94a3b8;font-variant-numeric:tabular-nums}
  #tao-tieng td.vb .doc{display:block;font-size:12px;color:#94a3b8;margin-top:2px}
  #tao-tieng td.tt{min-width:380px}
  #tao-tieng td.tt .chi{display:block;font-size:12px;color:#94a3b8;margin-top:2px;font-variant-numeric:tabular-nums}
  #tao-tieng td.hd{white-space:nowrap}
  #tao-tieng td.hd button+button{margin-left:6px}
  #tao-tieng .cho{color:#94a3b8}#tao-tieng .dang{color:#93c5fd}#tao-tieng .xong{color:#6ee7b7}#tao-tieng .loi{color:#fca5a5}
  #tao-tieng .dai{display:inline-block;margin-left:6px;padding:0 7px;border-radius:6px;background:#3b2a07;color:#fcd34d;font-size:12px}
  #tao-tieng tr.dai-hang{background:rgba(251,191,36,.05)}
  #tao-tieng tr.loi-hang{background:rgba(248,113,113,.07)}
  #tao-tieng tr.dang-hang{background:rgba(59,130,246,.08)}
  #tao-tieng .chan{margin-top:14px;font-size:12px;color:#64748b}
  `;

  function veHang(d) {
    const o = d.o;
    const hang = o.tr;
    hang.className = d.tt === 'loi' ? 'loi-hang' : d.tt === 'dang' ? 'dang-hang' : (d.quaDai ? 'dai-hang' : '');
    o.tdTt.textContent = '';
    if (d.tt === 'cho') o.tdTt.append(h('span', { class: 'cho' }, 'chờ'));
    else if (d.tt === 'dang') {
      o.tdTt.append(h('span', { class: 'dang' }, 'đang tạo…' + (d.lan > 1 ? ` (lần ${d.lan}/${toiDaLan()})` : '')));
      if (d.loi) o.tdTt.append(h('span', { class: 'chi loi' }, 'lần trước lỗi: ' + d.loi));
    } else if (d.tt === 'xong') {
      o.tdTt.append(h('span', { class: 'xong' }, `xong · ${so(d.giay, 2)} s · ${dB(d.dinhDB)} dBFS`));
      if (d.tuBoNho) o.tdTt.append(h('span', { class: 'phu' }, ' · từ bộ nhớ'));
      if (d.quaDai) o.tdTt.append(h('span', { class: 'dai', title: 'Dài hơn kế hoạch hơn ' + Math.round(CAU_HINH.tyLeQuaDai * 100) + '%: bước ghép video sẽ co thời gian trong giới hạn cho phép' }, `dài hơn kế hoạch ${so(d.tyLe * 100, 0)}%`));
      else if (d.dur > 0) o.tdTt.append(h('span', { class: 'phu' }, ` · ${d.tyLe >= 0 ? '+' : '−'}${so(Math.abs(d.tyLe) * 100, 0)}% so với kế hoạch`));
      o.tdTt.append(h('span', { class: 'chi', title: 'Số đo trước khi xử lý và phần đã cắt / khuếch đại' },
        `gốc ${so(d.goc.giay, 2)} s, ${dB(d.goc.dinhDB)} dBFS · cắt ${so(d.catDau, 2)} / ${so(d.catDuoi, 2)} s · ${d.gainDB >= 0 ? '+' : '−'}${so(Math.abs(d.gainDB), 1)} dB`
        + (d.biChanGain ? ' (chặn khuếch đại)' : '')));
    } else {
      o.tdTt.append(h('span', { class: 'loi' }, 'lỗi: ' + (d.loi || 'không rõ')));
    }
    o.btnNghe.disabled = d.tt !== 'xong';
    o.btnLai.disabled = dangChay || !(fake || layKhoa().length);
  }
  function ve(d) { if (d.o) veHang(d); capNhatTong(); }

  function capNhatTong() {
    if (!ui.tong) return;
    const n = dong.length, xongN = dong.filter(d => d.tt === 'xong').length, loiN = dong.filter(d => d.tt === 'loi').length;
    const dangN = dong.filter(d => d.tt === 'dang').length, daiN = dong.filter(d => d.quaDai).length;
    ui.thanhTien.style.width = (n ? xongN / n * 100 : 0) + '%';
    const goiY = [];
    goiY.push(h('span', {}, `Xong ${xongN}/${n}`));
    goiY.push(h('span', {}, `lỗi ${loiN}`));
    goiY.push(h('span', {}, `quá dài ${daiN}`));
    const tongKe = dong.reduce((s, d) => s + (d.dur || 0), 0);
    goiY.push(h('span', {}, `kế hoạch ${so(tongKe, 1)} s nói / ${so(kichBan.tongThoiGian || 0, 1)} s video`));
    if (dangChay) {
      const con = n - xongN, tb = thoiGianDong.length ? thoiGianDong.reduce((a, b) => a + b, 0) / thoiGianDong.length : 0;
      goiY.push(h('span', {}, `đã chạy ${mmss(Date.now() - batDauChay)}` + (tb && con ? ` · còn ~${mmss(tb * con + CAU_HINH.gapMs * con)}` : '')));
      if (dangN) goiY.push(h('span', {}, 'đang tạo 1 dòng'));
    }
    ui.tong.textContent = '';
    goiY.forEach(x => ui.tong.append(x));
  }

  function dungBang() {
    ui.tbody.textContent = '';
    dong.forEach((d, i) => {
      const o = {};
      o.tdTt = h('td', { class: 'tt' });
      o.btnNghe = h('button', { class: 'pn nho', disabled: 'disabled' }, 'Nghe');
      o.btnLai = h('button', { class: 'pn nho' }, 'Tạo lại dòng này');
      o.btnNghe.addEventListener('click', () => nghe(d));
      o.btnLai.addEventListener('click', () => chayMot(d));
      const vb = h('td', { class: 'vb' }, d.text);
      if (d.doc) vb.append(h('span', { class: 'doc' }, 'đọc thành: ' + d.doc));
      o.tr = h('tr', { 'data-id': d.id },
        h('td', { class: 'id' }, `${i + 1}. ${d.id}`),
        h('td', { class: 'kh' }, `${so(d.t, 1)} s · ${so(d.dur, 1)} s`),
        vb, o.tdTt, h('td', { class: 'hd' }, o.btnNghe, o.btnLai));
      d.o = o;
      ui.tbody.append(o.tr);
      veHang(d);
    });
    ui.nguon.textContent = `Kịch bản: ${kichBan.nguon} · ${dong.length} dòng · bài ${kichBan.bai}`;
    capNhatNut(); capNhatTong();
  }

  function xayBang() {
    if (document.getElementById('tao-tieng')) return;
    document.head.append(h('style', {}, CSS));
    ui.nguon = h('span', { class: 'phu' });
    ui.baoKhoa = h('div', { class: 'bao', role: 'alert' },
      h('b', {}, 'Không thấy khóa API. '),
      'Trang này đọc khóa Gemini từ env.js (do server.py sinh ra từ tệp .env). Hãy chạy ứng dụng bằng start.bat hoặc python server.py, mở bằng địa chỉ 127.0.0.1 hoặc localhost '
      + '(không dùng http.server thường), và kiểm tra tệp .env đã có khóa Gemini. Khóa không bao giờ được hiển thị ở đây.');
    ui.btnTatCa = h('button', {}, 'Tạo tất cả');
    ui.btnDung = h('button', { class: 'pn', disabled: 'disabled' }, 'Dừng');
    ui.btnZip = h('button', { class: 'pn', disabled: 'disabled' }, 'Tải tất cả (.zip)');
    ui.fileKb = h('input', { type: 'file', accept: '.json,application/json' });
    const nhanFile = h('label', { class: 'nut-tep', title: 'Tùy chọn: dùng một kich-ban.json khác (cùng định dạng beats[].loi[])' }, 'Dùng kịch bản khác…', ui.fileKb);
    ui.ketThuc = h('span', { class: 'phu' });
    ui.baoZip = h('span', { class: 'phu' });
    ui.tong = h('div', { class: 'tong' });
    ui.thanhTien = h('div');
    ui.tbody = h('tbody');
    ui.btnTatCa.addEventListener('click', () => { ui.ketThuc.textContent = ''; ui.baoZip.textContent = ''; chayTatCa(); });
    ui.btnDung.addEventListener('click', dung);
    ui.btnZip.addEventListener('click', () => { try { taiZip(); } catch (e) { ui.baoZip.textContent = 'Không tạo được ZIP: ' + che(e && e.message || e); } });
    ui.fileKb.addEventListener('change', async () => {
      const f = ui.fileKb.files && ui.fileKb.files[0];
      ui.fileKb.value = '';
      if (!f || dangChay) return;
      try {
        const kb = phanTichKichBan(JSON.parse(await f.text()), f.name);
        datKichBan(kb, true);
        ui.ketThuc.textContent = `Đã nạp ${f.name}: ${kb.dong.length} dòng (dòng đã tạo mà văn bản không đổi được giữ lại).`;
        dungBang();
      } catch (e) { ui.ketThuc.textContent = 'Không đọc được kịch bản: ' + che(e && e.message || e); }
    });

    const goc = h('div', { id: 'tao-tieng', role: 'dialog', 'aria-label': 'Tạo tiếng Sensei cho video demo' },
      h('div', { class: 'vo' },
        h('div', { class: 'dau' }, h('h1', {}, 'Tạo tiếng Sensei cho video demo'),
          h('span', { class: 'the' }, 'giọng ' + SENSEI_VOICE), h('span', { class: 'the' }, '24 kHz · mono · 16-bit'), ui.nguon),
        h('ol', {},
          h('li', {}, h('b', {}, 'Bấm “Tạo tất cả”'), ' và để tab này mở: khoảng 3–6 phút (mỗi dòng 10–20 giây). Có thể “Dừng” rồi chạy tiếp, dòng đã xong được giữ.'),
          h('li', {}, h('b', {}, 'Nghe thử'), ' từng dòng; chưa ưng thì “Tạo lại dòng này”. Dòng nhãn “dài hơn kế hoạch” sẽ được co thời gian khi ghép video.'),
          h('li', {}, h('b', {}, 'Bấm “Tải tất cả (.zip)”'), ' rồi giải nén vào thư mục tieng\\ của video demo (E:\\sensei-tam\\demo2\\final\\tieng\\).')),
        ui.baoKhoa,
        h('div', { class: 'thanh' }, ui.btnTatCa, ui.btnDung, ui.btnZip, nhanFile, ui.ketThuc, ui.baoZip),
        h('div', { class: 'tien' }, ui.thanhTien), ui.tong,
        h('div', { class: 'khung-bang' }, h('table', {},
          h('thead', {}, h('tr', {}, ...['Dòng', 'Kế hoạch (bắt đầu · dài)', 'Lời Sensei', 'Trạng thái', ''].map(x => h('th', {}, x)))), ui.tbody)),
        h('p', { class: 'chan' }, 'Xử lý trước khi xuất: cắt im lặng dưới −45 dBFS (giữ 60 ms đầu, 120 ms cuối), chuẩn hóa đỉnh −3 dBFS, fade 5 ms hai đầu. '
          + 'Khóa API chỉ được đọc lúc bấm nút, không bao giờ hiển thị, ghi log hay đưa vào tệp xuất.')));
    document.body.append(goc);
    dungBang();
  }

  // ---------------------------------------------------------------- API (kiem thu / dung lai)
  const api = {
    datTongHop(fn) { fake = fn || null; if (ui.btnTatCa) { capNhatNut(); dong.forEach(d => d.o && veHang(d)); } },
    chayTatCa, dung, taiZip,
    zipBlob: dungZip,
    docKichBan(j, ten) { datKichBan(phanTichKichBan(j, ten), true); if (ui.tbody) dungBang(); return dong.length; },
    cauHinh: CAU_HINH,
    giong: SENSEI_VOICE,
    kichBanNoiBo: KICH_BAN_NOI_BO,
    get dong() { return dong.map(d => ({ id: d.id, tt: d.tt, giay: d.giay, dinhDB: d.dinhDB, quaDai: d.quaDai, lan: d.lan, loi: d.loi, tuBoNho: d.tuBoNho, model: d.model })); },
    _t: { xuLy, taoWav, taoZip, crc32, che, pcmSangFloat, phanTichKichBan, dungManifest },
  };
  window.TaoTiengDemo = api;

  datKichBan(KICH_BAN_NOI_BO, false);
  const khoiDong = () => xayBang();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', khoiDong);
  else khoiDong();
})();
