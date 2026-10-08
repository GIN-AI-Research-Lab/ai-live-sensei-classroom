// kiem-luong.mjs — kiem thu LUONG BAI GIANG tren mock ?noLive&moPhong: khong bo sot muc nao + do dong bo loi <-> hinh.
//
//   node tools/che-do/khung/kiem-luong.mjs [tuy chon]
//     --bai N5-1,N3-1,N1-1   cac bai (moi bai mot Chrome rieng, chay song song)
//     --loi on|off|ca        bat loi gia lap cua mock (rong / chiCc / thieu / ngan / ngat / im / tcCu) — mac dinh ca hai
//     --muc-loi "&rong=.."   thay bo loi mac dinh
//     --che h,a,j            che do san khau (moi che do x moi bai x moi muc loi = mot viec)
//     --song 4               so Chrome chay cung luc
//     --doan 0-20            chi chay cac nhip nay (mac dinh ca bai, bat dau bang nut "Bắt đầu giảng bài")
//     --tam-dung 0.08        xac suat moi nhip bi bam Tam dung giua chung roi Giang tiep (mac dinh 0.06 khi loi=on)
//     --them "&k=v"          them tham so URL (vd "&r=0.12")
//     --han 30               han moi viec (phut)
//     --ra DIR               thu muc ket qua (mac dinh E:/sensei-tam/tmp/luong/kq) -> DIR/ket-qua.json + DIR/<viec>.json
//     --goc DIR              goc cua http server (mac dinh du an)
//     --viec N5-1:h,N3-1:a   cap bai:che do cu the (thay cho tich --bai x --che)
//   Khang dinh moi viec: moi nhip duoc tham theo dung thu tu (khong nhay coc), moi nhip tu / chu / ngu phap / vi du /
//   cau thoai / bai tap co it nhat MOT luot Sensei noi tron noi dung muc (tieng >= nguong, ban ghi nhac toi muc),
//   bai giang toi het bai (the ket bai -> IDLE), khong loi console. Kem so do dong bo cue (mode) va khoang nghi nhip.
// Khong bao gio mo Gemini Live: luon ?noLive&moPhong (http.server khong sinh env.js -> khong co key).
import { moChrome, Trang, donDep, sleep, giet, congTrong, DU_AN, TAM } from './cdp-lib.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// http.server rieng: ThreadingHTTPServer voi hang cho ket noi 256 (mac dinh cua python la 5 -> nhieu Chrome
// cung tai tai nguyen thi Windows tra ERR_CONNECTION_REFUSED: che do mat du lieu / am thanh giua chung)
const PY_SERVER = `import http.server, sys, functools
class S(http.server.ThreadingHTTPServer):
    request_queue_size = 256
    daemon_threads = True
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
S(('127.0.0.1', int(sys.argv[1])), functools.partial(H, directory=sys.argv[2])).serve_forever()`;
let pidServer = null;
async function moServerRong() {
  const port = await congTrong(9750, 9799);
  const p = spawn('python', ['-c', PY_SERVER, String(port), TUY.goc || DU_AN], { stdio: 'ignore', windowsHide: true,
    env: Object.assign({}, process.env, { TEMP: TAM.replace(/\//g, '\\'), TMP: TAM.replace(/\//g, '\\') }) });
  pidServer = p.pid;
  const goc = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 60; i++) { try { const r = await fetch(goc + '/'); if (r.ok) return goc; } catch {} await sleep(200); }
  throw new Error('server khong len');
}

const av = process.argv.slice(2);
const TUY = { bai: ['N5-1', 'N3-1', 'N1-1'], loi: 'ca', mucLoi: null, che: ['h'], song: 4, doan: null, tamDung: null, them: '', han: 30, ra: 'E:/sensei-tam/tmp/luong/kq' };
for (let i = 0; i < av.length; i++) {
  const a = av[i];
  if (a === '--bai') TUY.bai = av[++i].split(',').map((x) => x.trim()).filter(Boolean);
  else if (a === '--loi') TUY.loi = av[++i];
  else if (a === '--muc-loi') TUY.mucLoi = av[++i];
  else if (a === '--che') TUY.che = av[++i].split(',').map((x) => x.trim()).filter(Boolean);
  else if (a === '--song') TUY.song = +av[++i];
  else if (a === '--doan') TUY.doan = av[++i].split('-').map(Number);
  else if (a === '--tam-dung') TUY.tamDung = +av[++i];
  else if (a === '--them') TUY.them += av[++i];
  else if (a === '--han') TUY.han = +av[++i];
  else if (a === '--ra') TUY.ra = av[++i];
  else if (a === '--goc') TUY.goc = av[++i];
  else if (a === '--viec') TUY.cap = av[++i].split(',').map((x) => x.trim().split(':')).filter((x) => x.length === 2);   // N5-1:h,N3-1:a          // thu muc goc server (mac dinh du an) — vd ban sao code cu de so truoc / sau
}
fs.mkdirSync(TUY.ra, { recursive: true });
const LOI_MAC_DINH = '&rong=0.06&chiCc=0.07&thieu=0.06&ngan=0.06&ngat=0.03&im=0.03&tcCu=0.6';
const locLoi = (ds) => ds.filter((x) => !/favicon|env\.js|tailwindcss\.com should not/.test(x.text));

// ------------------------------------------------------------------ phan tich trong trang
// Tra ve: nhip (moi nhip: kind, luot, tieng, nhac toi muc, da day tron), tham (thu tu nhip da tham), dong bo cue, khoang nghi
const PHAN_TICH = `(() => {
  const M = window.SenseiMotion && SenseiMotion.tienIch;
  const J = (s) => (M ? M.chuanJP(s) : String(s || ''));
  const Vn = (s) => (M ? M.chuanVN(s) : String(s || '').toLowerCase());
  const beats = __lecture.beats();
  const luot = __moPhong.luot(true);
  const lenh = __moPhong.lenhGiang();
  const nk = (window.__motion ? __motion.nhatKy() : []) || [];
  const canh = (window.__motion ? __motion.canhDaQua() : []) || [];
  const appNk = (__lecture.nhatKyNhip ? __lecture.nhatKyNhip() : null);
  const perfNay = performance.now(), ctxNay = __moPhong.bayGio();
  const ctxCua = (perf) => (ctxNay == null ? null : ctxNay - (perfNay - perf) / 1000);
  // ---- khoa nhac toi muc (doc lap voi app.js): chuoi Nhat chuan hoa / tieng Viet
  const jpRun = (s) => (String(s || '').match(/[぀-ヿ一-鿿々ー]+/g) || []).map(J).filter(Boolean);
  function khoaMuc(b) {
    const d = b.data || {};
    if (b.kind === 'vocab') return { jp: [d.kanji, d.word, d.furigana].map(J).filter(Boolean), can: 1 };
    if (b.kind === 'kanji') {
      if (d.loai === 'kana' || (window.SenseiCapDo && SenseiCapDo.laChuKana && SenseiCapDo.laChuKana(d))) return { jp: [J(d.character), ...(d.commonWords || []).map((w) => J(w.word))].filter(Boolean), can: 1 };
      return { jp: [J(d.character), ...(d.commonWords || []).map((w) => J(w.word))].filter(Boolean), can: 1 };
    }
    if (b.kind === 'grammar-intro') { const f = jpRun(d.grammarFormula).filter((x) => x.length >= 1); return f.length ? { jp: f, can: 1 } : { vn: [Vn(d.title)], can: 1 }; }
    if (b.kind === 'example' || b.kind === 'kaiwa') {
      const tk = (d.tokens || []).map((t) => J(t.kanji || t.text)).filter(Boolean);
      return { jp: tk, can: Math.max(1, Math.ceil(tk.length * (b.kind === 'kaiwa' ? 0.4 : 0.5))), toks: true };
    }
    if (b.kind === 'quiz') { const f = [...jpRun(d.question), ...(d.options || []).flatMap(jpRun)].filter((x) => x.length >= 1); return f.length ? { jp: f, can: 1 } : { vn: [Vn(d.question).split(' ').slice(0, 3).join(' ')], can: 1 }; }
    return null;   // kaiwa-intro / kaiwa-run: chi xet tieng
  }
  const coJP = (h, k) => { if (!k) return false; if (h.includes(k)) return true; if (k.length < 3) return false; for (let i = 0; i < k.length; i++) if (h.includes(k.slice(0, i) + k.slice(i + 1))) return true; return false; };
  function nhacToi(b, chu) {
    const k = khoaMuc(b);
    if (!k) return null;
    const hj = J(chu), hv = Vn(chu);
    let n = 0;
    (k.jp || []).forEach((x) => { if (coJP(hj, x)) n++; });
    (k.vn || []).forEach((x) => { if (x && hv.includes(x)) n++; });
    return n >= k.can;
  }
  const NGUONG = { vocab: 3, kanji: 3, 'grammar-intro': 4, example: 3, 'kaiwa-intro': 3, kaiwa: 3, quiz: 2.5, 'kaiwa-run': 3 };
  const LOI_KHONG_DAY = new Set(['thieu', 'rong', 'im', 'chiCc', 'ngan']);
  const nhip = beats.map((b) => {
    const ls = luot.filter((l) => l.nhip === b.index && (l.loai === 'giang' || l.loai === 'giang-tiep'));
    const tieng = ls.reduce((a, l) => a + (l.amGui || 0), 0);
    const chu = ls.map((l) => l.chuGui || '').join(' ');
    const tron = ls.some((l) => !LOI_KHONG_DAY.has(l.loi) && l.xong && !l.biNgat && (l.amGui || 0) >= (NGUONG[b.kind] || 3) * 0.8);
    const nl = lenh.filter((x) => x.nhip === b.index);
    return { i: b.index, kind: b.kind, label: b.label, soLenh: nl.length, nhacLai: nl.filter((x) => /NHẮC LẠI/.test(x.text)).length,
      soLuot: ls.length, loi: ls.map((l) => l.loi).filter(Boolean), tieng: +tieng.toFixed(2), nhac: nhacToi(b, chu), tron,
      tFirst: ls.map((l) => l.tFirst).filter((x) => x != null).sort((a, c) => a - c)[0] ?? null,
      tEnd: ls.map((l) => l.tEnd).filter((x) => x != null).sort((a, c) => c - a)[0] ?? null };
  });
  // kaiwa-run: client tu phat giong nhan vat — da phat du cac cau trong nhip nay?
  beats.filter((b) => b.kind === 'kaiwa-run').forEach((b) => {
    const ds = (b.data || []).map((d) => __moPhong.karaokeThat(d.id));
    const lp = ds.map((k) => (k && k.lanPhat || []).find((p) => p.nhip === b.index));
    const x = nhip[b.index];
    x.clip = lp.filter(Boolean).length; x.soCau = ds.length;
    if (!x.soLuot) { x.tron = x.clip === x.soCau; x.nhac = x.tron; x.tieng = +ds.reduce((a, k, j) => a + (lp[j] ? k.dur : 0), 0).toFixed(2); }
    const t0 = lp.filter(Boolean).map((p) => p.t0);
    if (t0.length) { x.tFirst = Math.min(...t0); const j = lp.length - 1; x.tEnd = lp[j] ? lp[j].t0 + ds[j].dur : x.tEnd; }
  });
  // thu tu tham: moi lenh giang (nhip) + moi canh san khau dung (batDauNhip) theo thoi gian
  const tham = canh.map((c) => c.nhip);
  // ---- dong bo cue: hinh bat dau (che do: max(ban, T - 80 ms)) so voi luc tu do vang that
  const LEAD_CD = 0.08;
  const viewCua = (s) => { const jv = [], jvM = [], vv = [], vvM = []; Array.from(s).forEach((ch, i) => { const n = ch.normalize('NFKC');
    for (const d of n) { const x = J(d); if (x) { jv.push(x); jvM.push(i); } }
    const v = n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
    for (const d of v) { if (/[a-z0-9]/.test(d)) { vv.push(d); vvM.push(i); } else if (vv.length && vv[vv.length - 1] !== ' ') { vv.push(' '); vvM.push(i); } } });
    return { jv: jv.join(''), jvM, vv: vv.join(''), vvM }; };
  const sachNhip = {};
  luot.forEach((l) => { if (l.nhip == null || !l.sach) return; (sachNhip[l.nhip] = sachNhip[l.nhip] || []).push(l); });
  /** luc that (ctx) cua lan dau khoa xuat hien trong ban sach cua nhip, tu moc 'sauLuc' tro di */
  function thatTheoKhoa(i, khoa, sauLuc) {
    let best = null;
    for (const l of sachNhip[i] || []) {
      const v = l._v || (l._v = viewCua(l.sach));
      const thu = (hay, M2, k) => { let p = hay.indexOf(k); while (p >= 0) { const T = l.sT[M2[p]]; if (T != null && (sauLuc == null || T >= sauLuc - 0.05)) return T; p = hay.indexOf(k, p + 1); } return null; };
      for (const k of khoa.jp || []) { const T = thu(v.jv, v.jvM, k); if (T != null && (best == null || T < best)) best = T; }
      for (const k of khoa.vn || []) { const T = thu(' ' + v.vv, [0, ...v.vvM], ' ' + k); if (T != null && (best == null || T < best)) best = T; }
    }
    return best;
  }
  const cue = [];
  const thatCua = {};
  for (const e of nk) {
    if (e.firedCtx == null) {
      // bo: dao dien biet khop qua muon (> 0.4 s sau luc noi) -> tre bao nhieu so voi luc tu do vang that
      const that = e.luot != null && e.viTri != null ? __moPhong.thoiDiemThat(e.luot, e.viTri) : null;
      cue.push({ nhip: e.nhip, kind: e.kind, id: e.id, loai: e.loai, via: 'bo', treBiet: that != null && e.boCtx != null ? +(e.boCtx - that).toFixed(3) : null });
      continue;
    }
    const T = e.T != null ? e.T : e.firedCtx + 0.12;
    const vis = Math.max(e.firedCtx, T - LEAD_CD);
    let that = null, nguon = null;
    if (e.via === 'khop' && e.viTri != null) { that = __moPhong.thoiDiemThat(e.luot, e.viTri); nguon = 'khop'; }
    else if (e.via === 'dauTien') { const x = nhip[e.nhip]; that = x ? x.tFirst : null; nguon = 'dau'; }
    else if (e.khoa && (e.khoa.jp.length || e.khoa.vn.length)) { that = thatTheoKhoa(e.nhip, e.khoa, e.sau ? thatCua[e.nhip + ':' + e.sau] : null); nguon = 'sach'; }
    if (that != null) thatCua[e.nhip + ':' + e.id] = that;
    cue.push({ nhip: e.nhip, kind: e.kind, id: e.id, loai: e.loai, via: e.via, nguon, err: that != null ? +(vis - (that - LEAD_CD)).toFixed(4) : null,
      treBiet: nguon === 'khop' && that != null && e.khopCtx != null ? +(e.khopCtx - that).toFixed(3) : null });
  }
  // ---- khoang nghi giua nhip: tieng nhip i het -> canh nhip ke vao (som = san khau doi canh khi con tieng) / tieng nhip ke bat dau
  const vao = {};
  canh.forEach((c) => { if (vao[c.nhip] == null) vao[c.nhip] = ctxCua(c.vaoPerf); });
  // tieng dau cua nhip (ke ca giong nhan vat doc truoc o nhip Hoi thoai)
  const tieng0 = (b) => {
    const x = nhip[b.index];
    let t = x.tFirst;
    if (b.kind === 'kaiwa' && b.data && b.data.id) { const k = __moPhong.karaokeThat(b.data.id); const p = k && k.lanPhat.find((q) => q.nhip === b.index); if (p && (t == null || p.t0 < t)) t = p.t0; }
    return t;
  };
  const nghi = [];
  for (let i = 0; i + 1 < nhip.length; i++) {
    const a = nhip[i], b = nhip[i + 1];
    if (a.tEnd == null || vao[i + 1] == null) continue;
    const t1 = tieng0(beats[i + 1]);
    // bai tap: khoang nghi do hoc vien chon dap an (khong phai Sensei im) -> khong tinh im lang
    nghi.push({ i, kind: a.kind, doiCanhSauTieng: +(vao[i + 1] - a.tEnd).toFixed(3), imLang: t1 != null && a.kind !== 'quiz' ? +(t1 - a.tEnd).toFixed(3) : null });
  }
  return { n: beats.length, nhip, tham, cue, nghi, lenh: lenh.map((x) => ({ nhip: x.nhip, kind: x.kind, dau: x.text.slice(0, 40), nhac: /NHẮC LẠI/.test(x.text) })), appNk,
    luot: luot.map((l) => ({ so: l.so, nhip: l.nhip, loai: l.loai, kind: l.kind, lan: l.lan, loi: l.loi, amGui: l.amGui, xong: l.xong, biNgat: l.biNgat, tcCu: l.tcCu, matTiep: l.matTiep, tiepCua: l.tiepCua })),
    gui: __moPhong.nhatKyGui().filter((x) => x.loai === 'dong-phien').length };
})()`;

// ------------------------------------------------------------------ mot viec
let khoaNap = Promise.resolve();
function napLanLuot(fn) { const p = khoaNap.then(fn); khoaNap = p.catch(() => {}); return p; }
async function chayViec(goc, v) {
  const ch = await moChrome({ w: 1440, h: 900 });
  const t = new Trang(ch.cdp, goc);
  const kq = { viec: v.ten, bai: v.bai, che: v.che, cheLoi: v.loi, them: v.them, tamDung: 0, noiLai: 0, traLoi: 0 };
  const t0 = Date.now();
  try {
    await t.batDau(1440, 900);
    const [cap, so] = v.bai.split('-');
    // Nap trang lan luot (khoa chung): nhieu Chrome cung nap app mot luc thi http.server cham qua 30 s
    await napLanLuot(async () => {
      for (let lan = 1; ; lan++) {
        try { await t.moApp({ them: `&phongCach=${v.che}${v.them}`, bai: [cap, +so] }); return; }
        catch (e) { if (lan >= 3) throw e; await sleep(2000); }
      }
    });
    const n = await t.ev('__lecture.beats().length');
    const tu = TUY.doan ? TUY.doan[0] : 0, den = TUY.doan ? Math.min(TUY.doan[1], n - 1) : n - 1;
    kq.tu = tu; kq.den = den;
    await t.ev(`__moPhong.datDen(${den >= n - 1 ? 'null' : den})`);
    if (tu === 0) await t.bam('#autoLectureBtn'); else await t.ev(`__lecture.startFrom(${tu}).then(() => true)`);
    await t.cho(`__lecture.state().lectureState === 'PLAYING'`, 10000);
    const han = TUY.han * 60000;
    let daCho = -1, iCu = -1, harnessDung = false, henTam = null, soCho = 0;
    let rng = 1234567 + v.ten.length * 7919;
    const ngau = () => { rng ^= rng << 13; rng >>>= 0; rng ^= rng >>> 17; rng ^= rng << 5; rng >>>= 0; return rng / 4294967296; };
    const pTam = v.tamDung;
    while (Date.now() - t0 < han) {
      const s = await t.ev(`({ st: __lecture.state().lectureState, i: __lecture.index(), che: (__motion.trangThai() || {}).che, dung: __moPhong.daDung, dang: __moPhong.dangPhat() })`);
      if (s.dung) break;                         // mock dung o nhip "den"
      if (s.st === 'IDLE' && Date.now() - t0 > 3000) break;   // xong bai
      if (s.i !== iCu) { iCu = s.i; if (pTam && ngau() < pTam && s.st === 'PLAYING') henTam = Date.now() + 900 + ngau() * 2500; }
      if (s.st === 'PAUSED' && !harnessDung) {
        // server dong phien (loi ngat) -> hoc vien bam "Giảng tiếp"
        await sleep(900);
        const s2 = await t.ev(`__lecture.state().lectureState`);
        if (s2 === 'PAUSED') { kq.noiLai++; await t.bam('#autoLectureBtn'); await t.cho(`__lecture.state().lectureState === 'PLAYING'`, 6000); }
        continue;
      }
      if (henTam && Date.now() >= henTam && s.st === 'PLAYING' && s.che !== 'cho' && s.dang) {
        henTam = null; harnessDung = true; kq.tamDung++;
        await t.bam('#autoLectureBtn');
        await sleep(1000 + ngau() * 1500);
        await t.bam('#autoLectureBtn');
        await t.cho(`__lecture.state().lectureState === 'PLAYING'`, 6000);
        harnessDung = false;
        continue;
      }
      if (s.che === 'cho' && daCho !== s.i) {
        daCho = s.i; soCho++;
        await sleep(500);
        const dung = soCho % 3 !== 0;   // moi cau thu ba tra loi sai -> Sensei cham bai
        const q = await t.ev(`(() => { const b = __lecture.beats()[${s.i}]; return b && b.data ? { id: b.data.id, k: b.data.correctIndex, n: (b.data.options || []).length } : null; })()`);
        if (q) { kq.traLoi++; await t.bam(`#btn-opt-${q.id}-${dung ? q.k : (q.k + 1) % q.n}`); }
      }
      await sleep(200);
    }
    kq.giay = Math.round((Date.now() - t0) / 1000);
    kq.hetHan = Date.now() - t0 >= han;
    kq.cuoi = await t.ev(`({ st: __lecture.state().lectureState, i: __lecture.index() })`);
    const pt = await t.ev(PHAN_TICH);
    Object.assign(kq, danhGia(pt, kq));
    kq.loiConsole = locLoi(t.loi()).slice(0, 12);
    kq.canhBaoLuong = t.log.filter((x) => /\[luong\]/.test(x.text)).map((x) => x.text).slice(0, 30);
    kq.dat = kq.dat && !kq.loiConsole.length;
    fs.writeFileSync(path.join(TUY.ra, v.ten + '.json'), JSON.stringify({ kq, pt }, null, 1));
  } catch (e) {
    kq.hong = String(e && e.stack || e).slice(0, 800);
    kq.dat = false;
  } finally {
    await ch.dong();
  }
  return kq;
}

const trungVi = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const phanVi = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
const r3 = (x) => (x == null ? null : +x.toFixed(3));

function danhGia(pt, kq) {
  const tu = kq.tu, den = kq.den;
  const loi = [];
  // 1) tham theo thu tu, khong nhay coc
  const th = pt.tham.filter((i) => i >= tu && i <= den);
  let nhay = [], lui = [];
  for (let k = 1; k < th.length; k++) { if (th[k] > th[k - 1] + 1) nhay.push([th[k - 1], th[k]]); if (th[k] < th[k - 1]) lui.push([th[k - 1], th[k]]); }
  const daTham = new Set(th);
  const chuaTham = [];
  for (let i = tu; i <= den; i++) if (!daTham.has(i)) chuaTham.push(i);
  if (nhay.length) loi.push('nhay coc: ' + JSON.stringify(nhay.slice(0, 6)));
  if (lui.length) loi.push('lui nhip: ' + JSON.stringify(lui.slice(0, 6)));
  if (chuaTham.length) loi.push('nhip chua tham: ' + chuaTham.slice(0, 12).join(','));
  // 2) moi nhip co mot luot day tron + tieng du + ban ghi nhac toi muc
  const boSot = [], itTieng = [], khongNhac = [];
  const NGUONG = { vocab: 3, kanji: 3, 'grammar-intro': 4, example: 3, 'kaiwa-intro': 3, kaiwa: 3, quiz: 2.5, 'kaiwa-run': 3 };
  for (const x of pt.nhip) {
    if (x.i < tu || x.i > den) continue;
    if (!x.tron) boSot.push({ i: x.i, kind: x.kind, loi: x.loi, tieng: x.tieng, soLuot: x.soLuot });
    if (x.tieng < (NGUONG[x.kind] || 3)) itTieng.push({ i: x.i, kind: x.kind, tieng: x.tieng });
    if (x.nhac === false) khongNhac.push({ i: x.i, kind: x.kind });
  }
  if (boSot.length) loi.push(boSot.length + ' nhip khong co luot day tron: ' + JSON.stringify(boSot.slice(0, 8)));
  if (itTieng.length) loi.push(itTieng.length + ' nhip it tieng: ' + JSON.stringify(itTieng.slice(0, 8)));
  if (khongNhac.length) loi.push(khongNhac.length + ' nhip ban ghi khong nhac toi muc: ' + JSON.stringify(khongNhac.slice(0, 8)));
  // 3) toi het bai
  const xongBai = den === pt.n - 1 ? kq.cuoi.st === 'IDLE' && daTham.has(den) : daTham.has(den);
  if (!xongBai) loi.push('khong toi het bai: ' + JSON.stringify(kq.cuoi));
  if (kq.hetHan) loi.push('het han');
  // 4) dong bo cue
  const khop = pt.cue.filter((c) => c.nguon === 'khop' && c.err != null).map((c) => c.err);
  const sach = pt.cue.filter((c) => c.nguon === 'sach' && c.err != null).map((c) => c.err);
  const via = pt.cue.reduce((o, c) => { o[c.via] = (o[c.via] || 0) + 1; return o; }, {});
  const xau = pt.cue.filter((c) => c.err != null && Math.abs(c.err) > 0.6).sort((a, b) => Math.abs(b.err) - Math.abs(a.err)).slice(0, 10);
  const nghi = pt.nghi;
  const doiSom = nghi.filter((x) => x.doiCanhSauTieng < -0.05);
  const imLau = nghi.filter((x) => x.imLang != null && x.imLang > 3.5);
  return {
    dat: !loi.length, loi,
    soNhip: den - tu + 1, nhacLai: pt.nhip.reduce((a, x) => a + (x.nhacLai || 0), 0),
    loiGap: pt.luot.reduce((o, l) => { if (l.loi) o[l.loi] = (o[l.loi] || 0) + 1; if (l.tcCu) o.tcCu = (o.tcCu || 0) + 1; return o; }, {}),
    dongBo: {
      khop: { n: khop.length, trungVi: r3(trungVi(khop)), p95Tuyet: r3(phanVi(khop.map(Math.abs), 0.95)), som: khop.filter((x) => x < -0.15).length, muon: khop.filter((x) => x > 0.15).length },
      duPhong: { n: sach.length, trungVi: r3(trungVi(sach)), p95Tuyet: r3(phanVi(sach.map(Math.abs), 0.95)), som: sach.filter((x) => x < -0.3).length, muon: sach.filter((x) => x > 0.3).length },
      via, xau,
    },
    nghi: { n: nghi.length, doiCanhSom: doiSom.length, doiSomMau: doiSom.slice(0, 5), imLangTrungVi: r3(trungVi(nghi.map((x) => x.imLang).filter((x) => x != null))), imLangP95: r3(phanVi(nghi.map((x) => x.imLang).filter((x) => x != null), 0.95)), imLau: imLau.length, imLauMau: imLau.slice(0, 5) },
  };
}

// ------------------------------------------------------------------ chay
const mucLoi = TUY.mucLoi || LOI_MAC_DINH;
const dsLoi = TUY.loi === 'on' ? ['on'] : TUY.loi === 'off' ? ['off'] : ['off', 'on'];
const viec = [];
const cap = TUY.cap || TUY.bai.flatMap((bai) => TUY.che.map((che) => [bai, che]));
for (const [bai, che] of cap) for (const l of dsLoi) {
  viec.push({ ten: `${bai}-${che}-${l}`, bai, che, loi: l, them: (l === 'on' ? mucLoi : '') + TUY.them,
    tamDung: TUY.tamDung != null ? TUY.tamDung : (l === 'on' ? 0.06 : 0) });
}
const goc = await moServerRong();
const ketQua = [];
try {
  let k = 0;
  const tho = async () => { while (k < viec.length) { const v = viec[k++]; const t0 = Date.now(); const r = await chayViec(goc, v); ketQua.push(r); console.error(`[${v.ten}] ${r.dat ? 'DAT' : 'HONG'} ${Math.round((Date.now() - t0) / 1000)}s ${(r.loi || []).join(' | ').slice(0, 300)}${r.hong ? ' ' + r.hong.slice(0, 200) : ''}`); } };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(TUY.song, viec.length)) }, tho));
} finally {
  await donDep();
  await giet(pidServer);
}
ketQua.sort((a, b) => a.viec.localeCompare(b.viec));
const tong = { luc: new Date().toISOString(), tuy: TUY, mucLoi, dat: ketQua.every((r) => r.dat), viec: ketQua };
fs.writeFileSync(path.join(TUY.ra, 'ket-qua.json'), JSON.stringify(tong, null, 1));
console.log(JSON.stringify(tong.viec.map((r) => ({ viec: r.viec, dat: r.dat, giay: r.giay, soNhip: r.soNhip, nhacLai: r.nhacLai, loiGap: r.loiGap, tamDung: r.tamDung, noiLai: r.noiLai, loi: r.loi, hong: r.hong, dongBo: r.dongBo && { khop: r.dongBo.khop, duPhong: r.dongBo.duPhong, via: r.dongBo.via }, nghi: r.nghi && { doiCanhSom: r.nghi.doiCanhSom, imLangTrungVi: r.nghi.imLangTrungVi, imLangP95: r.nghi.imLangP95, imLau: r.nghi.imLau }, loiConsole: r.loiConsole })), null, 1));
