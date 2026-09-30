// Kiem thu phan thuan cua js/avatar-noi.js (ngu dieu, bieu cam, su kien) + khop mieng (khau-hinh.js phanTichTron).
//   node tools/kiem_avatar.test.mjs                 nhanh: tong hop (am thanh sinh ra), khong can server / Chrome
//   node tools/kiem_avatar.test.mjs --thoi-gian     them: do lech thoi gian mo / khep mieng so voi dap an doc lap
//                                                   (can thu muc kiem thu khop mieng: SENSEI_LIPSYNC_DIR hoac mac dinh trong scratchpad)
//   node tools/kiem_avatar.test.mjs --mau           them: in bieu cam giai ra cho cac cau TTS / SAPI co san
// Khong goi API. Tieng tong hop: chuoi hai hoa-am co bao formant /a/ (F1 700, F2 1200), F0 va bien do theo ham cho truoc.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const bang = [];
const kt = (nhom, ten, ok, chiTiet = '') => bang.push({ nhom, ten, ok: !!ok, chiTiet: String(chiTiet) });

function napJs(tep, bo = {}) {
  const sb = { console, performance, ...bo };
  sb.window = sb; vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(GOC, 'js', tep), 'utf8'), sb, { filename: tep });
  return sb;
}
const A = napJs('avatar-noi.js').SenseiAvatarNoi;
const KH = napJs('khau-hinh.js').SenseiKhauHinh;
const T = A._t;
const st = (hz) => 12 * Math.log2(hz / 100);

// ------------------------------------------------------------------ am thanh tong hop
const SR = 24000;
/** f0(t) Hz, amp(t) 0..1 (tuyen tinh), thoi luong s. Vowel /a/ (F1 700, F2 1200) qua cac hoa-am. */
function sinh(dur, f0Fn, ampFn, F = [700, 1200]) {
  const n = Math.round(dur * SR), x = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, f0 = f0Fn(t), a = ampFn(t);
    ph += 2 * Math.PI * f0 / SR;
    if (a <= 0) continue;
    let v = 0;
    for (let h = 1; h * f0 < 4500; h++) {
      const f = h * f0;
      v += (Math.exp(-(((f - F[0]) / 120) ** 2)) + 0.8 * Math.exp(-(((f - F[1]) / 170) ** 2))) / h * Math.sin(h * ph);
    }
    x[i] = 0.22 * a * v;
  }
  return x;
}
const db = (d) => Math.pow(10, d / 20);
/** bao am tiet: rate am tiet / s, do sau (0..1) */
const am = (rate, sau = 0.85, dau = 0.06, cuoi = 0.1) => (dur) => (t) => {
  if (t < dau || t > dur - cuoi) return 0;
  const ph = (t - dau) * rate; const f = ph - Math.floor(ph);
  return (1 - sau) + sau * Math.pow(Math.sin(Math.PI * f), 1.2);
};

// ------------------------------------------------------------------ 1. F0 (YIN)
{
  const dur = 1.5, f = (t) => 100 * Math.pow(2, t / dur);          // 100 -> 200 Hz
  const x = sinh(dur, f, () => 1);
  const r = T.f0Yin(x, SR);
  let sai = [], n = 0;
  for (let i = 12; i < r.f0.length - 12; i++) { if (!r.f0[i]) continue; const that = f((i * 10 + 5) / 1000); sai.push(Math.abs(r.f0[i] / that - 1)); n++; }
  sai.sort((a, b) => a - b);
  kt('f0', `YIN: doan truot 100->200 Hz, sai so trung vi ${(100 * sai[sai.length >> 1]).toFixed(2)}% (p90 ${(100 * sai[Math.floor(sai.length * 0.9)]).toFixed(2)}%)`, sai[sai.length >> 1] < 0.015 && sai[Math.floor(sai.length * 0.9)] < 0.04, n);
  kt('f0', 'YIN: phu >= 90% khung co thanh', n / (r.f0.length - 24) > 0.9, (n / (r.f0.length - 24)).toFixed(2));
  // nu 240 Hz khong bi nhay quang tam
  const x2 = sinh(1.0, () => 240, () => 1);
  const r2 = T.f0Yin(x2, SR); const v = Array.from(r2.f0).filter(Boolean);
  kt('f0', 'YIN: 240 Hz giu nguyen (khong nhay quang tam)', v.length > 70 && Math.abs(v.sort((a, b) => a - b)[v.length >> 1] / 240 - 1) < 0.02, v[v.length >> 1]);
}

// ------------------------------------------------------------------ 2. ngu dieu + bieu cam tren am thanh tong hop
function phan(x, o = {}) { return A.phanTichCauNoi({ pcm: x, sr: SR, text: o.text || '', the: o.the || '', nen: o.nen || null }); }
// nen nhan vat = do tu mot cau binh thuong CUNG bo tong hop (muc tuyet doi cua am tong hop khong co y nghia tuyet doi)
const nenTu = (x) => { const p = phan(x).pro; return { f0St: p.stTrungVi, db: p.dbTrungVi, n: 5 }; };
const nenBinhThuong = (() => { const d = 1.6; return nenTu(sinh(d, () => 130, (t) => am(4.5, 0.6)(d)(t))); })();

{ // phang
  const dur = 1.4, x = sinh(dur, () => 120, (t) => am(4, 0.6)(dur)(t));
  const r = phan(x);
  kt('ngu-dieu', `phang 120 Hz: leoCuoi ${r.pro.leoCuoi.toFixed(2)} st (|.|<1), bien do ${r.pro.bienDo.toFixed(1)} st (<2.5)`, Math.abs(r.pro.leoCuoi) < 1 && r.pro.bienDo < 2.5, JSON.stringify([r.pro.leoCuoi, r.pro.bienDo]));
  kt('bieu-cam', 'phang, khong the / van ban -> binh_thuong', r.emotion === 'binh_thuong', r.emotion + ' ' + r.cuongDo.toFixed(2));
}
{ // doc cuoi len 5 st
  const dur = 1.4, f = (t) => (t < 1.0 ? 120 : 120 * Math.pow(2, 5 / 12 * (t - 1.0) / 0.3));
  const x = sinh(dur, (t) => Math.min(f(t), 120 * Math.pow(2, 5 / 12)), (t) => am(4, 0.5)(dur)(t));
  const r = phan(x);
  kt('ngu-dieu', `len giong cuoi +5 st: leoCuoi ${r.pro.leoCuoi.toFixed(2)} (>= 2.5), doc ${r.pro.doc.toFixed(1)} st/s (> 4)`, r.pro.leoCuoi >= 2.5 && r.pro.doc > 4, JSON.stringify([r.pro.leoCuoi, r.pro.doc]));
  kt('bieu-cam', 'len giong cuoi (khong the) -> hoi', r.emotion === 'hoi', r.emotion + ' ' + r.cuongDo.toFixed(2));
  const q = r.su.filter(e => e.kind === '?')[0];
  kt('su-kien', `'?' dat luc bat dau len giong (${q ? q.t.toFixed(2) : '-'} s, ky vong 0.85-1.15)`, q && q.t > 0.85 && q.t < 1.15, JSON.stringify(r.su));
}
{ // roi cuoi cau
  const dur = 1.4, x = sinh(dur, (t) => (t < 0.9 ? 140 : 140 * Math.pow(2, -5 / 12 * Math.min(1, (t - 0.9) / 0.4))), (t) => am(4, 0.5)(dur)(t));
  const r = phan(x);
  kt('ngu-dieu', `roi giong cuoi: leoCuoi ${r.pro.leoCuoi.toFixed(2)} (< -2)`, r.pro.leoCuoi < -2, r.pro.leoCuoi);
  kt('bieu-cam', 'roi giong cuoi -> khong phai hoi', r.emotion !== 'hoi', r.emotion);
  kt('su-kien', "khong co '?' khi roi giong", !r.su.some(e => e.kind === '?'), JSON.stringify(r.su));
}
{ // hao hung: bien do rong, noi nhanh, dinh to
  const dur = 1.6, x = sinh(dur, (t) => 150 * Math.pow(2, 8 / 12 * Math.sin(2 * Math.PI * 2.2 * t) * Math.min(1, (dur - 0.25 - t) / 0.3)), (t) => am(7, 0.9)(dur)(t) * (Math.sin(t * 9) > 0.6 ? 1.8 : 1));
  const r = phan(x);
  kt('ngu-dieu', `hao hung: bien do ${r.pro.bienDo.toFixed(1)} st (>= 10), nhip ${r.pro.nhip.toFixed(1)}/s (>= 5), dinh ${r.pro.dinhHon.toFixed(1)} dB`, r.pro.bienDo >= 10 && r.pro.nhip >= 5, JSON.stringify([r.pro.bienDo, r.pro.nhip, r.pro.dinhHon]));
  kt('bieu-cam', 'bien do rong + nhanh -> hao_hung', r.emotion === 'hao_hung', r.emotion + ' ' + r.cuongDo.toFixed(2) + ' ' + JSON.stringify(r.diem));
  kt('su-kien', "hao_hung co 'sang'", r.su.some(e => e.kind === 'sang'), JSON.stringify(r.su));
}
{ // ngac nhien: nhay F0 luc vao + to luc vao
  const dur = 1.2, x = sinh(dur, (t) => (t < 0.14 ? 120 * Math.pow(2, 8 / 12) : 120 * Math.pow(2, 1 / 12 * Math.max(0, 1 - (t - 0.14) / 0.3))), (t) => (t < 0.06 || t > 1.05 ? 0 : (t < 0.3 ? 2.4 : 0.7) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 3.5 * t) ** 2)));
  const r = phan(x);
  kt('ngu-dieu', `ngac nhien: nhay F0 dau ${r.pro.nhayDau.toFixed(1)} st (>= 4), to luc vao ${r.pro.daoDauTo.toFixed(1)} dB`, r.pro.nhayDau >= 4 && r.pro.daoDauTo >= 5, JSON.stringify([r.pro.nhayDau, r.pro.daoDauTo]));
  kt('bieu-cam', 'nhay F0 + to luc vao -> ngac_nhien', r.emotion === 'ngac_nhien', r.emotion + ' ' + JSON.stringify(r.diem));
  const e = r.su.filter(v => v.kind === '!')[0];
  kt('su-kien', `'!' gan luc vao (${e ? e.t.toFixed(2) : '-'} s < 0.6)`, e && e.t < 0.6, JSON.stringify(r.su));
}
{ // gian: thap hon nen, hep, dinh to thua (mot nhip gat moi 0.55 s)
  const dur = 1.6, x = sinh(dur, (t) => 98 * (1 + 0.01 * Math.sin(t * 20)), (t) => (t < 0.05 || t > 1.5 ? 0 : ((t % 0.55) < 0.14 ? 3.0 : 0.8)));
  const r = phan(x, { nen: nenBinhThuong });
  kt('bieu-cam', `to (dinh ${r.pro.dinhHon.toFixed(1)} dB) + thap hon nen + hep -> gian (${r.emotion} ${r.cuongDo.toFixed(2)})`, r.emotion === 'gian', JSON.stringify(r.diem));
  kt('su-kien', "gian co 'gian' (gan xanh) + 'rung'", r.su.some(e => e.kind === 'gian') && r.su.some(e => e.kind === 'rung'), JSON.stringify(r.su));
}
{ // buon: nho hon nen, cham, roi, hep
  const dur = 2.2, x = sinh(dur, (t) => 120 * Math.pow(2, -2 / 12 * t / dur), (t) => 0.3 * am(2.2, 0.6)(dur)(t));
  const r = phan(x, { nen: nenBinhThuong });
  kt('bieu-cam', `nho + cham + roi (co nen nhan vat) -> buon (${r.emotion} ${r.cuongDo.toFixed(2)})`, r.emotion === 'buon', JSON.stringify(r.diem));
  const r0 = phan(x, { nen: null });
  kt('bieu-cam', `khong co nen nhan vat: buon CHI tu ngu dieu yeu hon (${r0.emotion}, buon ${r0.diem.buon.toFixed(2)} < ${r.diem.buon.toFixed(2)})`, r0.diem.buon < r.diem.buon, '');
}

// ------------------------------------------------------------------ 3. van ban + the
const cam = (text, the = '', pro = null) => T.giaiCamXuc({ text, the, pro });
kt('van-ban', '本当ですか？ -> hoi', cam('本当ですか？').emotion === 'hoi', JSON.stringify(cam('本当ですか？').diem));
kt('van-ban', 'これ、あなたが作ったんですか。 (khong ?) -> hoi (tro tu か cuoi)', cam('これ、あなたが作ったんですか。').emotion === 'hoi', '');
kt('van-ban', 'え？さかな？ -> ngac_nhien hoac hoi', ['ngac_nhien', 'hoi'].includes(cam('え？さかな？').emotion), cam('え？さかな？').emotion);
kt('van-ban', 'えっ！ -> ngac_nhien', cam('えっ！').emotion === 'ngac_nhien', cam('えっ！').emotion);
kt('van-ban', 'すごい！ -> hao_hung', cam('すごい！').emotion === 'hao_hung', cam('すごい！').emotion);
kt('van-ban', 'いいかげんにしろ！ -> gian', cam('いいかげんにしろ！').emotion === 'gian', cam('いいかげんにしろ！').emotion);
kt('van-ban', '残念です。 -> buon', cam('残念です。').emotion === 'buon', cam('残念です。').emotion);
kt('van-ban', 'おはようございます。 -> vui nhe (<= 0.5)', cam('おはようございます。').emotion === 'vui' && cam('おはようございます。').cuongDo <= 0.5, JSON.stringify(cam('おはようございます。')));
kt('van-ban', 'これはペンです。 -> binh_thuong', cam('これはペンです。').emotion === 'binh_thuong', cam('これはペンです。').emotion);
kt('the', 'the gian -> gian', cam('あ', 'gian').emotion === 'gian', cam('あ', 'gian').emotion);
kt('the', 'the ngac_nhien -> ngac_nhien', cam('あ', 'ngac_nhien').emotion === 'ngac_nhien', cam('あ', 'ngac_nhien').emotion);
kt('the', 'the that_vong -> buon', cam('あ', 'that_vong').emotion === 'buon', cam('あ', 'that_vong').emotion);
kt('the', 'the vui -> vui', cam('あ', 'vui').emotion === 'vui', cam('あ', 'vui').emotion);
kt('the', 'the de_biu, cui_chao -> binh_thuong', cam('あ', 'de_biu').emotion === 'binh_thuong' && cam('あ', 'cui_chao').emotion === 'binh_thuong', '');
kt('the', 'the xau_ho -> binh_thuong + giot mo hoi', T.suKienBieuCam(cam('すみません', 'xau_ho'), null, 2).some(e => e.kind === 'mo_hoi'), JSON.stringify(T.suKienBieuCam(cam('すみません', 'xau_ho'), null, 2)));
kt('the', "the suy_nghi -> hoi nhe + 'nghi'", T.suKienBieuCam(cam('うーん', 'suy_nghi'), null, 2).some(e => e.kind === 'nghi'), '');
{ // the + ngu dieu cung chieu: vui + hao hung -> cuong do tang
  const dur = 1.6, x = sinh(dur, (t) => 150 * Math.pow(2, 8 / 12 * Math.sin(2 * Math.PI * 2.2 * t) * Math.min(1, (dur - 0.25 - t) / 0.3)), (t) => am(7, 0.9)(dur)(t) * (Math.sin(t * 9) > 0.6 ? 1.8 : 1));
  const a = phan(x), b = phan(x, { the: 'vui', text: 'やった！' });
  kt('bieu-cam', `the vui + van ban ! + ngu dieu hao hung -> hao_hung manh hon ( ${a.cuongDo.toFixed(2)} -> ${b.cuongDo.toFixed(2)})`, b.emotion === 'hao_hung' && b.cuongDo >= a.cuongDo, b.emotion);
}
// su kien luon trong khoang thoi gian va sap xep
{
  const dur = 1.6, x = sinh(dur, (t) => 150 * Math.pow(2, 6 / 12 * Math.sin(2 * Math.PI * 2.2 * t)), (t) => am(6.5, 0.9)(dur)(t));
  const r = phan(x, { text: 'すごい？！' });
  let tang = true; for (let i = 1; i < r.su.length; i++) if (r.su[i].t < r.su[i - 1].t) tang = false;
  kt('su-kien', 'su kien sap xep theo thoi gian, nam trong [0, dur + 0.5]', tang && r.su.every(e => e.t >= 0 && e.t <= r.dur + 0.5), JSON.stringify(r.su));
}

// ------------------------------------------------------------------ 4. chuoi khau hinh 120 Hz
{
  const dur = 1.2, x = sinh(dur, () => 130, (t) => (t < 0.2 || t > 1.0 ? 0 : 1));
  const tl = KH.taoMoi().phanTichTron(x, SR);
  const moGiua = tl.mo[Math.round(0.6 * tl.fps)] / 255, moDau = tl.mo[Math.round(0.05 * tl.fps)] / 255, moCuoi = tl.mo[Math.round(1.1 * tl.fps)] / 255;
  kt('khau-hinh', `phanTichTron: fps ${tl.fps}, mo giua ${moGiua.toFixed(2)} > .4, im dau ${moDau.toFixed(2)} / cuoi ${moCuoi.toFixed(2)} < .15`, tl.fps === 120 && moGiua > 0.4 && moDau < 0.15 && moCuoi < 0.15, '');
  // mieng mo truoc tieng <= 50 ms (khong tre): cat mo ~ 0.2 s
  let i = 0; while (i < tl.n && tl.mo[i] / 255 < 0.3) i++;
  kt('khau-hinh', `mo mieng o ${(i / tl.fps * 1000).toFixed(0)} ms (tieng vao 200 ms): khong tre qua 40 ms`, i / tl.fps <= 0.24, '');
  // cong chan loi thoai: layLuc im khi datThoai(true), phanTichTron van tinh duoc
  const bo = KH.taoMoi(); bo.nap(x, 0, SR); bo.ketThuc();
  const truoc = bo.layLuc(0.6).mo; bo.datThoai(true); const cuaChan = bo.layLuc(0.6); bo.datThoai(false);
  kt('khau-hinh', 'cong chan loi thoai: layLuc -> kin, mo 0, co:true', truoc > 0.3 && cuaChan.mo === 0 && cuaChan.a === 'kin' && cuaChan.co === true, JSON.stringify(cuaChan));
  const tl2 = bo.phanTichTron(x, SR);
  kt('khau-hinh', 'phanTichTron khong bi cong chan va khong doi dong thoi gian cua bo', tl2.mo[Math.round(0.6 * tl2.fps)] > 100, '');
}

// ------------------------------------------------------------------ 4b. giong theo cam xuc (voices.js + voice-actors.js)
{
  const store = {};
  const win = { SenseiAvatarNoi: A, localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } } };
  const sb = { window: win, console: { log() {}, warn() {}, error() {} }, setTimeout, clearTimeout, fetch: async () => { throw new Error('khong mang'); }, localStorage: win.localStorage };
  win.window = win; vm.createContext(sb); Object.assign(sb, win); sb.window = sb;
  vm.runInContext(fs.readFileSync(path.join(GOC, 'js', 'voices.js'), 'utf8'), sb);
  const V = sb.SenseiVoices;
  kt('giong-cam-xuc', 'mac dinh BAT (localStorage chua dat)', V.camXucBat() === true, '');
  const k = (text, the) => V.kieuDoc(text, the);
  kt('giong-cam-xuc', 'cau hoi (か) -> kieu hoi, chi dan noi ve giong len', k('これ、あなたが作ったんですか。', '').key === 'hoi' && /rise/.test(k('これ、あなたが作ったんですか。', '').chiDan), JSON.stringify(k('これ、あなたが作ったんですか。', '')));
  kt('giong-cam-xuc', 'the gian -> kieu gian (cung, gat)', k('だめです', 'gian').key === 'gian' && /clipped/.test(k('だめです', 'gian').chiDan), JSON.stringify(k('だめです', 'gian')));
  kt('giong-cam-xuc', 'the ngac_nhien -> kieu ngac nhien', k('あ、いぬ！', 'ngac_nhien').key === 'ngac_nhien', JSON.stringify(k('あ、いぬ！', 'ngac_nhien')));
  kt('giong-cam-xuc', 'すごい！ -> hao_hung (sang, nhanh)', k('すごい！', '').key === 'hao_hung' && /fast/.test(k('すごい！', '').chiDan), JSON.stringify(k('すごい！', '')));
  kt('giong-cam-xuc', 'the buon -> kieu buon (nho, thap)', k('すみません。', 'buon').key === 'buon' && /soft/.test(k('すみません。', 'buon').chiDan), JSON.stringify(k('すみません。', 'buon')));
  kt('giong-cam-xuc', 'cau trung tinh -> khong chi dan (giu nguyen duong cu)', k('これはペンです。', '').key === '' && k('これはペンです。', '').chiDan === '', JSON.stringify(k('これはペンです。', '')));
  V.datCamXuc(false);
  kt('giong-cam-xuc', 'cong tac TAT (sensei_giong_cam_xuc=0) -> khong co chi dan o moi cau', V.camXucBat() === false && k('すごい！', 'gian').key === '' && store.sensei_giong_cam_xuc === '0', JSON.stringify(k('すごい！', 'gian')));
  V.datCamXuc(true);
  kt('giong-cam-xuc', 'bat lai -> co chi dan', V.camXucBat() && k('すごい！', '').key === 'hao_hung', '');

  // voice-actors.js: luot noi + systemInstruction (khong doc chi dan ra thanh tieng)
  const guiDi = [];
  class WS { constructor() { setTimeout(() => this.onopen && this.onopen(), 0); } send(m) { guiDi.push(JSON.parse(m)); if (guiDi.length === 1) setTimeout(() => this.onmessage({ data: JSON.stringify({ setupComplete: {} }) }), 0); } close() {} }
  const sb2 = { window: {}, console, setTimeout, clearTimeout, WebSocket: WS, atob, Blob: class {} };
  sb2.window = sb2; vm.createContext(sb2);
  vm.runInContext(fs.readFileSync(path.join(GOC, 'js', 'voice-actors.js'), 'utf8'), sb2);
  const dung = sb2.VoiceActorLuotNoi;
  kt('giong-cam-xuc', 'luot noi TRUNG TINH giu dung dang cu "Doc nguyen van cau nay:\n<van ban>"', dung('こんにちは', '') === 'Đọc nguyên văn câu này:\nこんにちは', JSON.stringify(dung('こんにちは', '')));
  const luot = dung('本当ですか', 'a genuine question');
  kt('giong-cam-xuc', 'luot noi co kieu: dong [STAGE DIRECTION ...NEVER read aloud] + van ban trong 「」', /^\[STAGE DIRECTION[^\]]*NEVER read aloud[^\]]*\]\n/.test(luot) && luot.endsWith('「本当ですか」'), JSON.stringify(luot));
  const pool = new sb2.VoiceActorPool({ apiKey: 'k', model: 'models/x' });
  const done = pool.speak('Fenrir', '本当ですか', 'a genuine question'); setTimeout(() => {}, 0);
  await new Promise(r => setTimeout(r, 30));
  const setup = guiDi.find(m => m.setup), noi = guiDi.find(m => m.clientContent);
  const brief = setup && setup.setup.systemInstruction.parts[0].text;
  kt('giong-cam-xuc', 'ACTOR_BRIEF cam doc chi dan + giu luat doc nguyen van + khong dich', /STAGE DIRECTION/.test(brief) && /KHÔNG đọc ra thành tiếng/.test(brief) && /NGUYÊN VĂN/.test(brief) && /KHÔNG dịch/.test(brief), brief);
  kt('giong-cam-xuc', 'ACTOR_BRIEF khong gan cung tieng Nhat (Sensei doc tieng Viet duoc)', /tiếng Việt/.test(brief) && /đúng ngôn ngữ/.test(brief), '');
  kt('giong-cam-xuc', 'luot gui di qua Live co chi dan', noi && /STAGE DIRECTION/.test(noi.clientContent.turns[0].parts[0].text), noi && JSON.stringify(noi.clientContent));
}

// ------------------------------------------------------------------ 5. tuy chon: mau that + thoi gian
const LIP = process.env.SENSEI_LIPSYNC_DIR || 'C:/Users/OS/AppData/Local/Temp/claude/E--ai-live-sensei-classroom/85f3af15-28af-4f9f-8bfc-2fc053ff9125/scratchpad/lipsync/';
function docWav(p) { const b = fs.readFileSync(p); let o = 12, sr = 24000, data = null; while (o < b.length) { const id = b.toString('ascii', o, o + 4), n = b.readUInt32LE(o + 4); if (id === 'fmt ') sr = b.readUInt32LE(o + 12); if (id === 'data') { data = b.subarray(o + 8, o + 8 + n); break; } o += 8 + n + (n & 1); } const x = new Float32Array(data.length >> 1); for (let i = 0; i < x.length; i++) { const s = data.readInt16LE(2 * i); x[i] = s < 0 ? s / 32768 : s / 32767; } return { x, sr }; }
if (args.has('--mau') && fs.existsSync(LIP)) {
  console.log('\nBieu cam giai ra cho mau co san (khong kiem khang dinh, de xem):');
  const ds = fs.readdirSync(path.join(LIP, 'do/ref')).filter(f => /^(ja_\d+|lt_ja_lien)\.json$/.test(f)).map(f => f.slice(0, -5));
  const nen = { f0St: null, db: null, n: 0 };
  for (const id of ds) {
    const R = JSON.parse(fs.readFileSync(path.join(LIP, 'do/ref', id + '.json'), 'utf8'));
    const w = fs.existsSync(path.join(LIP, 'do/sapi', id + '_24k.wav')) ? path.join(LIP, 'do/sapi', id + '_24k.wav') : path.join(LIP, 'A/tts', id + '.wav');
    const { x, sr } = docWav(w);
    const r = A.phanTichCauNoi({ pcm: x, sr, text: R.text || '', the: '', nen: nen.n >= 3 ? nen : null });
    if (r.pro && r.pro.ok) { nen.n++; nen.f0St = nen.f0St == null ? r.pro.stTrungVi : (nen.f0St * (nen.n - 1) + r.pro.stTrungVi) / nen.n; nen.db = nen.db == null ? r.pro.dbTrungVi : (nen.db * (nen.n - 1) + r.pro.dbTrungVi) / nen.n; }
    console.log(`  ${id.padEnd(12)} ${(R.text || '').slice(0, 22).padEnd(24)} -> ${r.emotion.padEnd(11)} ${r.cuongDo.toFixed(2)}  leo ${r.pro && r.pro.ok ? r.pro.leoCuoi.toFixed(1).padStart(5) : '  -'} st  bien do ${r.pro && r.pro.ok ? r.pro.bienDo.toFixed(1).padStart(4) : ' -'}  ${r.su.map(e => e.kind + '@' + e.t.toFixed(2)).join(' ')}`);
  }
}
if (args.has('--thoi-gian') && fs.existsSync(LIP)) {
  const O7 = ['kin', 'a', 'e', 'i', 'o', 'u', 'o2'], NHOM = { kin: 'K', a: 'M', e: 'M', i: 'M', o2: 'M', o: 'T', u: 'T' };
  const sm = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const trongSo = (luc) => { const w = { kin: 0, a: 0, e: 0, i: 0, o: 0, u: 0, o2: 0 }; const tm = sm(.15, .6, luc.mo || 0); const mr = (X, k, m) => { if (!k) return; if (!(X in w) || X === 'kin') { w.kin += k; return; } if (X === 'o2' || X === 'u') { w.kin += k * (1 - m); w[X] += k * m; return; } if (m < .5) { w.kin += k * (1 - 2 * m); w.o2 += k * 2 * m; } else { w.o2 += k * (2 - 2 * m); w[X] += k * (2 * m - 1); } }; const tt = Math.max(0, Math.min(1, luc.t || 0)); const kA = luc.a === 'kin', kB = luc.b === 'kin'; if (kA !== kB) mr(kA ? luc.b : luc.a, 1, tm * (kB ? 1 - tt : tt)); else { mr(luc.a, 1 - tt, tm); mr(luc.b, tt, tm); } return w; };
  const hien = (luc) => { const w = trongSo(luc); if (w.kin >= .5) return 'kin'; let c = (luc.t || 0) >= .5 ? luc.b : luc.a; if (c === 'kin') c = c === luc.a ? luc.b : luc.a; return c; };
  const qt = (a, p) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.round(p * (s.length - 1)))]; };
  const nhomCua = (L) => (L === 'dc' ? null : new Set(L.split('/').map(v => NHOM[v])));
  const G = {};
  const ids = fs.readdirSync(path.join(LIP, 'do/ref')).filter(f => /^(ja_\d+|lt_ja_.*)\.json$/.test(f)).map(f => f.slice(0, -5));
  for (const id of ids) {
    const gp = /^ja_/.test(id) ? 'SAPI Haruka (moc may doc)' : 'Gemini Charon tieng Nhat';
    const out = (G[gp] ||= { Mo: [], Khep: [], Doi: [], truot: 0, n: 0 });
    const R = JSON.parse(fs.readFileSync(path.join(LIP, 'do/ref', id + '.json'), 'utf8'));
    const w = fs.existsSync(path.join(LIP, 'do/sapi', id + '_24k.wav')) ? path.join(LIP, 'do/sapi', id + '_24k.wav') : path.join(LIP, 'A/tts', id + '.wav');
    const { x, sr } = docWav(w);
    const tl = KH.taoMoi().phanTichTron(x, sr);
    const N = Math.ceil((x.length / sr + 0.6) * 1000), c = new Array(N);
    for (let i = 0; i < N; i++) { const i0 = Math.min(tl.n - 1, Math.floor(i / 1000 * tl.fps)); c[i] = i0 >= tl.n - 2 ? 'kin' : hien({ a: O7[tl.a[i0]], b: O7[tl.b[i0]], t: tl.t[i0] / 255, mo: tl.mo[i0] / 255 }); }
    const lab = R.lab, n = lab.length, runs = [];
    for (let k = 0; k < n;) { let e = k; while (e < n && lab[e] === lab[k]) e++; runs.push({ a: k, b: e, L: lab[k] }); k = e; }
    const def = runs.filter(u => u.L !== 'dc' && u.b - u.a >= 3);
    for (let j = 1; j < def.length; j++) {
      const u = def[j], p = def[j - 1]; if (u.a - p.b > 15) continue;
      const ts = u.a * 10, G0 = p.b * 10, gu = nhomCua(u.L), gp2 = nhomCua(p.L);
      if (!([...gu].some(g => !gp2.has(g)) && ![...gp2].some(g => gu.has(g)))) continue;
      const hop = v => gu.has(NHOM[v]); let tot = null; const kc = (i) => (i < G0 ? G0 - i : i > ts ? i - ts : 0);
      for (let i = Math.max(1, G0 - 150); i <= Math.min(N - 31, ts + 150); i++) if (hop(c[i]) && !hop(c[i - 1])) { let ok = true; for (let q = i; q < i + 30; q++) if (!hop(c[q])) { ok = false; break; } if (ok && (tot == null || kc(i) < kc(tot))) tot = i; }
      const loai = u.L === 'kin' ? 'Khep' : p.L === 'kin' ? 'Mo' : 'Doi'; out.n++;
      if (tot == null) { out.truot++; continue; }
      out[loai].push(tot < G0 ? tot - G0 : tot > ts ? tot - ts : 0);
    }
  }
  console.log('\nLech thoi gian CHUOI KHAU HINH 120 Hz so voi dap an (ms; am = mieng di truoc tieng):');
  for (const g in G) { const o = G[g]; console.log(' ', g, `- ${o.n} su kien, truot ${o.truot}`); for (const k of ['Mo', 'Khep', 'Doi']) if (o[k].length) console.log('    ', k.padEnd(5), `n=${o[k].length}  p10 ${qt(o[k], .1)}  p50 ${qt(o[k], .5)}  p90 ${qt(o[k], .9)}`); }
  const ch = G['Gemini Charon tieng Nhat'];
  if (ch) kt('thoi-gian', `Charon JA: mo mieng p90 ${qt(ch.Mo, .9)} ms <= +35 (dich: <= 30 tre tai p90 sau lam muot)`, qt(ch.Mo, .9) <= 35, '');
  if (ch) kt('thoi-gian', `Charon JA: mo mieng p50 ${qt(ch.Mo, .5)} ms trong +-40`, Math.abs(qt(ch.Mo, .5)) <= 40, '');
}

let hong = 0;
for (const b of bang) { if (!b.ok) hong++; console.log(`${b.ok ? 'DAT ' : 'HONG'}  [${b.nhom}] ${b.ten}${b.ok ? '' : '  <-- ' + b.chiTiet.slice(0, 400)}`); }
console.log(`\n${bang.length - hong}/${bang.length} dat`);
process.exit(hong ? 1 : 0);
