/**
 * NGHE THU GIONG — cong cu tu kiem cua CHU BAI, chi nap khi co ?ngheGiong=1 tren dia chi trang
 * (index.html nap tep nay theo yeu cau, xem doan "nap luoi" cuoi index.html).
 *
 * Vi sao co: nhan gioi tinh cua 30 giong Gemini lay tu tai lieu cong khai, khong the tu kiem
 * neu khong goi API. Cong cu nay chay trong trinh duyet CUA CHU BAI, voi khoa da co san trong
 * env.js (window.SENSEI_ENV), va:
 *   1. tong hop cung mot cau tieng Nhat co dinh bang tung trong 30 giong,
 *   2. do cao do co ban F0 cua am thanh tra ve (tu tuong quan tren PCM, lay trung vi cac khung
 *      co tieng) roi doan nam / nu theo cao do, so voi gioi tinh ghi trong tai lieu; lech mau do,
 *   3. liet ke bang nhan vat (curriculum/nhan-vat.json): moi hang co nut "Nghe thu" doc mot cau
 *      thoai THAT cua nhan vat do bang giong da chot, va do F0 de doi chieu voi gioi tinh nhan vat,
 *   4. nut "Tai JSON" xuat {giong: {f0, gioiTinhDoc, gioiTinhDo}}.
 *
 * Duong tong hop la DUONG SAN XUAT cua app: VoiceActorPool (js/voice-actors.js, phien Live khoa
 * san mot giong) voi model SENSEI_MODELS.actor roi actorFallback. KHONG dung REST generateContent
 * vi model Live tra 404 tren REST va app.js/synthLine khong con duoc goi o dau.
 *
 * An toan: khoa chi doc luc bam nut, khong bao gio ghi ra DOM / console / tep xuat; moi thong
 * bao loi deu duoc che khoa. Moi lan chi mo MOT phien Live (tranh dong ma 1000).
 */
(function () {
  'use strict';

  const CAU_MAU = 'こんにちは。今日はいい天気ですね。';
  const NGUONG_F0 = 160;   // Hz: duoi = nam, tren = nu
  const BIEN_F0 = 15;      // Hz: quanh nguong thi chi bao "gan nguong", khong to do

  // ---------------------------------------------------------------- do cao do (thuan tuy, kiem thu bang node)
  /** Int16 little-endian 24kHz -> Float32 [-1,1] */
  function pcmSangFloat(bytes) {
    const n = Math.floor(bytes.length / 2);
    const view = new DataView(bytes.buffer, bytes.byteOffset, n * 2);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const s = view.getInt16(i * 2, true);
      out[i] = s < 0 ? s / 32768 : s / 32767;
    }
    return out;
  }

  /**
   * Uoc luong F0 (Hz) bang tuong quan tu than chuan hoa tren tung khung 40 ms, buoc 20 ms,
   * chi xet khung du to (RMS) va tuong quan du cao (co tieng). Lay TRUNG VI cac khung co tieng.
   * Chon lag NHO NHAT co tuong quan >= 0,9 lan dinh de tranh nham sang bac tam thap hon.
   * Tra { f0, khungCoTieng, tongKhung } — f0 = null neu khong du khung.
   */
  function uocLuongF0(x, sr) {
    sr = sr || 24000;
    const lagMin = Math.floor(sr / 400), lagMax = Math.ceil(sr / 60);
    const N = Math.round(sr * 0.04), hop = Math.round(sr * 0.02);
    // Tong binh phuong luy ke de tinh nang luong cua cua so dich lag nhanh
    const pre = new Float64Array(x.length + 1);
    for (let i = 0; i < x.length; i++) pre[i + 1] = pre[i] + x[i] * x[i];
    const nangLuong = (a, b) => pre[b] - pre[a];

    const khung = [];
    let maxRms = 0;
    for (let s = 0; s + N + lagMax <= x.length; s += hop) {
      const rms = Math.sqrt(nangLuong(s, s + N) / N);
      khung.push({ s, rms });
      if (rms > maxRms) maxRms = rms;
    }
    const f0s = [];
    const nguongRms = Math.max(0.005, maxRms * 0.12);
    for (const k of khung) {
      if (k.rms < nguongRms) continue;
      const s = k.s;
      const r0 = nangLuong(s, s + N);
      const nr = new Float32Array(lagMax + 1);
      let best = 0;
      for (let lag = lagMin; lag <= lagMax; lag++) {
        let r = 0;
        for (let i = 0; i < N; i++) r += x[s + i] * x[s + i + lag];
        const d = Math.sqrt(r0 * nangLuong(s + lag, s + lag + N));
        const v = d > 0 ? r / d : 0;
        nr[lag] = v;
        if (v > best) best = v;
      }
      if (best < 0.55) continue;   // khung khong co tieng (xat / lang)
      let lagChon = -1;
      for (let lag = lagMin + 1; lag < lagMax; lag++) {
        if (nr[lag] >= best * 0.9 && nr[lag] >= nr[lag - 1] && nr[lag] >= nr[lag + 1]) { lagChon = lag; break; }
      }
      if (lagChon > 0) f0s.push(sr / lagChon);
    }
    if (f0s.length < 3) return { f0: null, khungCoTieng: f0s.length, tongKhung: khung.length };
    f0s.sort((a, b) => a - b);
    const giua = f0s.length >> 1;
    const f0 = f0s.length % 2 ? f0s[giua] : (f0s[giua - 1] + f0s[giua]) / 2;
    return { f0: Math.round(f0 * 10) / 10, khungCoTieng: f0s.length, tongKhung: khung.length };
  }

  /** 'm' | 'f' | null theo cao do; gan nguong tra them co 'chuaChac' */
  function gioiTinhTheoF0(f0) {
    if (f0 == null) return { gt: null, chuaChac: true };
    return { gt: f0 >= NGUONG_F0 ? 'f' : 'm', chuaChac: Math.abs(f0 - NGUONG_F0) < BIEN_F0 };
  }

  const api = { CAU_MAU, NGUONG_F0, pcmSangFloat, uocLuongF0, gioiTinhTheoF0 };
  window.NgheGiong = api;

  if (typeof document === 'undefined' || !/[?&]ngheGiong\b/i.test((window.location || {}).search || '')) return;

  // ---------------------------------------------------------------- tong hop (duong san xuat: phien Live)
  const layKhoa = () => {
    const e = window.SENSEI_ENV || {};
    return [e.key1, e.key2, e.key3, e.key4].map(k => String(k || '').trim()).filter(Boolean);
  };
  let khoaDangDung = '';
  const che = (msg) => {
    let s = String(msg == null ? '' : msg);
    if (khoaDangDung) s = s.split(khoaDangDung).join('***');
    return s.replace(/key=[^&\s"']+/gi, 'key=***').replace(/AIza[0-9A-Za-z_-]{20,}/g, '***');
  };

  let hangDoi = Promise.resolve();
  const xepHang = (fn) => {
    const p = hangDoi.then(fn, fn);
    hangDoi = p.catch(() => {});
    return p;
  };

  const boNho = new Map();   // "giong|cau" -> Uint8Array PCM 24kHz (chi trong phien trang nay)

  async function tongHop(giong, cau) {
    const k = giong + '|' + cau;
    if (boNho.has(k)) return boNho.get(k);
    const keys = layKhoa();
    if (!keys.length) throw new Error('Không thấy khóa API trong env.js (hoặc trang chưa nạp env.js).');
    if (!window.VoiceActorPool) throw new Error('Thiếu js/voice-actors.js.');
    const models = window.SENSEI_MODELS ? [SENSEI_MODELS.actor, SENSEI_MODELS.actorFallback] : ['models/gemini-3.1-flash-live-preview'];
    let loi = 'không rõ';
    for (const model of models) {
      khoaDangDung = keys[0];
      const pool = new VoiceActorPool({ apiKey: keys[0], model });
      try {
        for (let lan = 1; lan <= 2; lan++) {
          const r = await pool.speak(giong, cau);
          if (r && r.ok) { boNho.set(k, r.pcm); return r.pcm; }
          loi = (r && r.reason) || loi;
          pool.close(giong);
          await new Promise(res => setTimeout(res, 800));
        }
      } finally { pool.closeAll(); }
    }
    throw new Error(che(loi));
  }

  // ---------------------------------------------------------------- phat
  let ctxPhat = null, nguonPhat = null;
  function dungPhat() { try { if (nguonPhat) nguonPhat.stop(); } catch (e) {} nguonPhat = null; }
  async function phat(pcm) {
    dungPhat();
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error('Trình duyệt không có AudioContext.');
    if (!ctxPhat) ctxPhat = new AC();
    if (ctxPhat.state === 'suspended') await ctxPhat.resume();
    const f = pcmSangFloat(pcm);
    const buf = ctxPhat.createBuffer(1, f.length, 24000);
    buf.copyToChannel(f, 0);
    const src = ctxPhat.createBufferSource();
    src.buffer = buf;
    src.connect(ctxPhat.destination);
    nguonPhat = src;
    await new Promise((res) => { src.onended = res; src.start(); });
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
  const tenGt = (g) => (g === 'f' ? 'nữ' : g === 'm' ? 'nam' : '—');

  const css = `
  #nghe-giong{position:fixed;top:8px;right:8px;bottom:8px;width:min(780px,calc(100vw - 16px));z-index:2147483000;display:flex;flex-direction:column;
    background:#111827;color:#e5e7eb;border:1px solid #374151;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.55);font:13px/1.45 system-ui,sans-serif}
  #nghe-giong.thu{bottom:auto}
  #nghe-giong header{display:flex;gap:8px;align-items:center;padding:10px 12px;border-bottom:1px solid #374151}
  #nghe-giong header h2{font-size:15px;margin:0;flex:1}
  #nghe-giong .thanh{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 12px;border-bottom:1px solid #374151}
  #nghe-giong .cuon{overflow:auto;flex:1;padding:0 12px 12px}
  #nghe-giong h3{margin:14px 0 6px;font-size:13px;color:#93c5fd}
  #nghe-giong table{width:100%;border-collapse:collapse}
  #nghe-giong th,#nghe-giong td{padding:4px 6px;border-bottom:1px solid #1f2937;text-align:left;vertical-align:middle}
  #nghe-giong th{color:#9ca3af;font-weight:600;position:sticky;top:0;background:#111827}
  #nghe-giong button{background:#2563eb;color:#fff;border:0;border-radius:6px;padding:4px 10px;cursor:pointer;font:inherit}
  #nghe-giong button.phu{background:#374151}
  #nghe-giong button:disabled{opacity:.5;cursor:default}
  #nghe-giong .ok{color:#34d399}#nghe-giong .lech{color:#f87171;font-weight:700}#nghe-giong .ngo{color:#fbbf24}
  #nghe-giong .mo{color:#9ca3af}#nghe-giong .cau{max-width:230px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#9ca3af}
  #nghe-giong .lech-hang{background:rgba(248,113,113,.08)}
  `;

  const trangThai = {};   // giong -> { f0, gtDoc, gtDo }

  function xayBang(rosterJson) {
    if (document.getElementById('nghe-giong')) return;
    document.head.append(h('style', {}, css));
    const V = window.SenseiVoices;
    const MALE = V ? V.MALE : [], FEMALE = V ? V.FEMALE : [];
    const tatCa = MALE.map(v => [v, 'm']).concat(FEMALE.map(v => [v, 'f']));

    const trangThaiChung = h('span', { class: 'mo' }, layKhoa().length ? 'Có khóa trong env.js (không hiển thị).' : 'CHƯA thấy khóa trong env.js — không tổng hợp được.');
    const btnTatCa = h('button', {}, 'Đo cả 30 giọng');
    const btnDung = h('button', { class: 'phu', disabled: 'disabled' }, 'Dừng');
    const btnJson = h('button', { class: 'phu' }, 'Tải JSON');
    const btnDong = h('button', { class: 'phu', 'aria-label': 'Đóng' }, '×');
    const tien = h('span', { class: 'mo' }, '');

    const tbGiong = h('tbody');
    const dongGiong = {};
    tatCa.forEach(([giong, gt]) => {
      const tdF0 = h('td', {}, '—'), tdDo = h('td', {}, '—'), tdKq = h('td', {}, '—');
      const btn = h('button', {}, 'Nghe');
      const tr = h('tr', {}, h('td', {}, giong), h('td', {}, tenGt(gt)), tdF0, tdDo, tdKq, h('td', {}, btn));
      tbGiong.append(tr);
      dongGiong[giong] = { tr, tdF0, tdDo, tdKq, btn, gt };
      btn.addEventListener('click', () => chayGiong(giong, false));
    });

    const tbNv = h('tbody');
    const dongNv = {};
    const ds = rosterJson && rosterJson.nhanVat ? rosterJson.nhanVat : (V ? V.danhSach().map(n => ({ id: n.id, ten: n.ten, ten_ja: n.tenJa, gioiTinh: n.gioiTinh, giong: n.giong, xuatHien: [] })) : []);
    ds.forEach((n) => {
      const tdCau = h('td', { class: 'cau' }, '…');
      const tdF0 = h('td', {}, '—'), tdKq = h('td', {}, '—');
      const btn = h('button', {}, 'Nghe thử');
      const tr = h('tr', {}, h('td', {}, `${n.ten_ja} `, h('span', { class: 'mo' }, n.ten)), h('td', {}, tenGt(n.gioiTinh)),
        h('td', {}, n.giong), tdCau, tdF0, tdKq, h('td', {}, btn));
      tbNv.append(tr);
      dongNv[n.id] = { tr, tdCau, tdF0, tdKq, btn, n, cau: null };
      btn.addEventListener('click', () => chayNhanVat(n.id));
    });

    const panel = h('div', { id: 'nghe-giong', role: 'dialog', 'aria-label': 'Nghe thử giọng' },
      h('header', {}, h('h2', {}, 'Nghe thử giọng Gemini và giọng nhân vật'), btnDong),
      h('div', { class: 'thanh' }, btnTatCa, btnDung, btnJson, tien, trangThaiChung),
      h('div', { class: 'cuon' },
        h('p', { class: 'mo' }, `Câu mẫu: 「${CAU_MAU}」. Cao độ F0 là trung vị các khung có tiếng; dưới ${NGUONG_F0} Hz đoán là nam, từ ${NGUONG_F0} Hz đoán là nữ. `
          + 'Mỗi lúc chỉ mở một phiên Live. Nên mở kèm &noLive để Sensei không chiếm phiên. Khóa API không bao giờ được in ra.'),
        h('h3', {}, '30 giọng dựng sẵn'),
        h('table', {}, h('thead', {}, h('tr', {}, ...['Giọng', 'Giới tính (tài liệu)', 'F0 (Hz)', 'Giới tính (đo)', 'Kết quả', ''].map(x => h('th', {}, x)))), tbGiong),
        h('h3', {}, 'Nhân vật hội thoại (giọng đã chốt trong curriculum/nhan-vat.json)'),
        h('table', {}, h('thead', {}, h('tr', {}, ...['Nhân vật', 'Giới tính', 'Giọng', 'Câu thoại thật', 'F0 (Hz)', 'Kết quả', ''].map(x => h('th', {}, x)))), tbNv)));
    document.body.append(panel);

    let dangChay = false, huy = false;
    const khoaNut = (b) => { [btnTatCa].forEach(x => { x.disabled = b; }); btnDung.disabled = !b; };
    btnDong.addEventListener('click', () => { huy = true; dungPhat(); panel.remove(); });
    btnDung.addEventListener('click', () => { huy = true; dungPhat(); });

    function to(td, lop, chu) { td.className = lop || ''; td.textContent = chu; }

    function ghiKetQua(tdF0, tdDo, tdKq, gtChuan, f0, tuKhoa) {
      const r = gioiTinhTheoF0(f0);
      tdF0.textContent = f0 == null ? 'không đo được' : f0.toFixed(1);
      if (tdDo) tdDo.textContent = tenGt(r.gt) + (r.chuaChac && r.gt ? ' (?)' : '');
      if (r.gt == null) return to(tdKq, 'ngo', 'không đo được');
      if (r.gt === gtChuan) return to(tdKq, r.chuaChac ? 'ngo' : 'ok', r.chuaChac ? 'khớp, gần ngưỡng' : 'khớp');
      if (r.chuaChac) return to(tdKq, 'ngo', `lệch nhẹ (đo ${tenGt(r.gt)}, gần ngưỡng)`);
      return to(tdKq, 'lech', `LỆCH: ${tuKhoa} là ${tenGt(gtChuan)} nhưng đo ra ${tenGt(r.gt)}`);
    }

    async function chayGiong(giong, imLang) {
      const d = dongGiong[giong];
      d.btn.disabled = true; to(d.tdKq, 'mo', 'đang tổng hợp…');
      try {
        const pcm = await xepHang(() => tongHop(giong, CAU_MAU));
        const { f0 } = uocLuongF0(pcmSangFloat(pcm), 24000);
        const r = gioiTinhTheoF0(f0);
        trangThai[giong] = { f0, gioiTinhDoc: d.gt, gioiTinhDo: r.gt };
        ghiKetQua(d.tdF0, d.tdDo, d.tdKq, d.gt, f0, giong);
        d.tr.classList.toggle('lech-hang', r.gt && r.gt !== d.gt && !r.chuaChac);
        if (!imLang) await phat(pcm);
      } catch (e) {
        to(d.tdKq, 'lech', che(e && e.message || e));
      } finally { d.btn.disabled = false; }
    }

    btnTatCa.addEventListener('click', async () => {
      if (dangChay) return;
      dangChay = true; huy = false; khoaNut(true);
      let i = 0;
      for (const [giong] of tatCa) {
        if (huy) break;
        tien.textContent = `Đang đo ${++i}/${tatCa.length}: ${giong}`;
        await chayGiong(giong, true);
      }
      const lech = Object.entries(trangThai).filter(([g, t]) => t.gioiTinhDo && t.gioiTinhDo !== t.gioiTinhDoc && !gioiTinhTheoF0(t.f0).chuaChac).map(([g]) => g);
      tien.textContent = huy ? 'Đã dừng.' : `Xong: ${Object.keys(trangThai).length}/${tatCa.length} giọng đã đo, ${lech.length} lệch${lech.length ? ' (' + lech.join(', ') + ')' : ''}.`;
      dangChay = false; khoaNut(false);
    });

    btnJson.addEventListener('click', () => {
      const ra = {};
      tatCa.forEach(([giong, gt]) => {
        const t = trangThai[giong];
        ra[giong] = t ? { f0: t.f0, gioiTinhDoc: t.gioiTinhDoc, gioiTinhDo: t.gioiTinhDo } : { f0: null, gioiTinhDoc: gt, gioiTinhDo: null };
      });
      const blob = new Blob([JSON.stringify(ra, null, 2) + '\n'], { type: 'application/json' });
      const a = h('a', { href: URL.createObjectURL(blob), download: 'gemini-giong-f0.json' });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });

    // ---- nhan vat: lay mot cau thoai THAT (cau dau tien cua nhan vat o bai dau tien no xuat hien)
    async function timCau(id) {
      const d = dongNv[id];
      if (d.cau) return d.cau;
      const ho = (d.n.xuatHien || [])[0] || '';
      const m = ho.match(/^([a-z0-9]+):\s*bài\s*(\d+)/i);
      if (m) {
        try {
          const r = await fetch(`curriculum/${m[1]}/${m[2]}.json`);
          const j = await r.json();
          const dong = (j.dialogue || []).find(l => V && V.thongTin(l.speaker).id === id);
          if (dong) {
            d.cau = (dong.tokens || []).map(t => t.kanji || t.text).join('');
            d.speaker = dong.speaker;
          }
        } catch (e) {}
      }
      if (!d.cau) { d.cau = CAU_MAU; d.speaker = d.n.ten_ja; }
      return d.cau;
    }

    async function chayNhanVat(id) {
      const d = dongNv[id];
      d.btn.disabled = true; to(d.tdKq, 'mo', 'đang tổng hợp…');
      try {
        const cau = await timCau(id);
        d.tdCau.textContent = cau; d.tdCau.title = cau;
        const giong = V ? V.voiceFor(d.speaker || d.n.ten_ja) : d.n.giong;   // qua dung duong tra cuu cua app
        const pcm = await xepHang(() => tongHop(giong, cau));
        const { f0 } = uocLuongF0(pcmSangFloat(pcm), 24000);
        ghiKetQua(d.tdF0, null, d.tdKq, d.n.gioiTinh, f0, d.n.ten_ja);
        const r = gioiTinhTheoF0(f0);
        d.tr.classList.toggle('lech-hang', r.gt && r.gt !== d.n.gioiTinh && !r.chuaChac);
        await phat(pcm);
      } catch (e) {
        to(d.tdKq, 'lech', che(e && e.message || e));
      } finally { d.btn.disabled = false; }
    }

    // Hien san cau thoai that (khong goi API) de nguoi dung biet se nghe gi
    ds.forEach((n) => { timCau(n.id).then(c => { dongNv[n.id].tdCau.textContent = c; dongNv[n.id].tdCau.title = c; }); });
  }

  function khoiDong() {
    const nap = () => fetch(window.SenseiVoices ? SenseiVoices.ROSTER_URL : 'curriculum/nhan-vat.json', { cache: 'no-cache' })
      .then(r => r.json()).catch(() => null);
    Promise.all([nap(), window.SenseiVoices && SenseiVoices.ready ? SenseiVoices.ready : null])
      .then(([j]) => xayBang(j));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', khoiDong);
  else khoiDong();
})();
