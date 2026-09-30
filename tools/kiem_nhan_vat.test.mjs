// Kiem thu js/voices.js voi bang nhan vat curriculum/nhan-vat.json.
// Chay:  node tools/kiem_nhan_vat.test.mjs        (khong can server, khong dung API)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const goc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsonBang = JSON.parse(fs.readFileSync(path.join(goc, 'curriculum', 'nhan-vat.json'), 'utf8'));
const ma = fs.readFileSync(path.join(goc, 'js', 'voices.js'), 'utf8');

let soKiem = 0;
const ok = (dieuKien, moTa) => { soKiem++; assert.ok(dieuKien, moTa); };
// Qua JSON de bo khac biet prototype giua cac realm cua vm
const bang = (a, b, moTa) => { soKiem++; assert.equal(JSON.stringify(a), JSON.stringify(b), moTa); };

/** Nap voices.js trong cua so gia; fetchGia quyet dinh viec nap tep JSON */
function nap(fetchGia) {
  const canhBao = [];
  const win = {};
  const ctx = {
    window: win,
    console: { log() {}, warn: (...a) => canhBao.push(a.join(' ')), error() {} },
    setTimeout, clearTimeout,
    fetch: fetchGia,
  };
  vm.runInNewContext(ma, ctx);
  return { V: win.SenseiVoices, canhBao };
}

const fetchDoc = async () => ({ ok: true, json: async () => JSON.parse(JSON.stringify(jsonBang)) });
const { V, canhBao } = nap(fetchDoc);

// 1. Ban nhung san khop tep JSON (id, gioi tinh, giong, anh, ten_ja, bi danh)
const nhungRut = V.EMBEDDED.nhanVat.map(n => ({ id: n.id, g: n.gioiTinh, v: n.giong, anh: n.anh, ja: n.ten_ja, bd: n.biDanh }));
const jsonRut = jsonBang.nhanVat.map(n => ({ id: n.id, g: n.gioiTinh, v: n.giong, anh: n.anh, ja: n.ten_ja, bd: n.biDanh }));
bang(nhungRut, jsonRut, 'ban nhung san trong voices.js phai khop curriculum/nhan-vat.json');

// 2. Bang: giong duy nhat, khong Charon, dung kho gioi tinh
const dung = new Set();
for (const n of jsonBang.nhanVat) {
  ok(!dung.has(n.giong), 'trung giong ' + n.giong); dung.add(n.giong);
  ok(n.giong !== 'Charon', 'nhan vat dung giong Sensei: ' + n.id);
  ok((n.gioiTinh === 'f' ? V.FEMALE : V.MALE).includes(n.giong), n.id + ' sai kho gioi tinh');
}

// 3. Mau ten khap cac cap: cung nhan vat -> cung giong
const roster = (id) => jsonBang.nhanVat.find(n => n.id === id);
const mauCungNguoi = [
  ['miller', ['ミラー (Miller)', 'ミラー', 'ミラーさん', ' ミラー　', 'ミラー（Miller）', 'マイク・ミラー', 'Miller']],   // kana, N5
  ['sato', ['さとう (Satou)', '佐藤 (Satou)', '佐藤', '佐藤さん']],
  ['yamada', ['山田', '山田 (Yamada)', '山田一郎', '山田 一郎']],
  ['giao-vien', ['せんせい (Sensei)', '先生']],
  ['tenin', ['てんいん (Nhân viên)', '店員']],
  ['nguyen', ['グエン (Nguyễn)', 'グエン']],
  ['tanaka', ['田中', '田中さん', '田中先生']],                                       // N4 .. N1
  ['santos', ['サントス', 'サントスさん']],                                            // N5 .. N1
  ['wang', ['ワン']],
  ['shacho', ['社長']],
];
let soMau = 0;
for (const [id, cacTen] of mauCungNguoi) {
  const nv = roster(id);
  for (const ten of cacTen) {
    soMau++;
    ok(V.voiceFor(ten) === nv.giong, `${ten} -> ${V.voiceFor(ten)} (mong ${nv.giong})`);
    ok(V.genderOf(ten) === nv.gioiTinh, `${ten} sai gioi tinh`);
    ok(V.thongTin(ten).id === id, `${ten} khong ra nhan vat ${id}`);
  }
}
ok(soMau >= 10, 'can it nhat 10 mau');

// 4. Khong xao tron: castOf cung mot nhan vat o hai doan khac nhau -> cung giong
const doanA = [{ speaker: 'サントス' }, { speaker: 'ワン' }, { speaker: '先生' }];
const doanB = [{ speaker: 'ワン' }, { speaker: '山田' }, { speaker: '田中' }, { speaker: 'サントス' }];
const ca = V.castOf(doanA), cb = V.castOf(doanB);
bang(ca.find(c => c.speaker === 'サントス').voice, cb.find(c => c.speaker === 'サントス').voice, 'Santos doi giong giua hai doan');
bang(ca.find(c => c.speaker === 'ワン').voice, cb.find(c => c.speaker === 'ワン').voice, 'Wang doi giong giua hai doan');
ok(new Set(cb.map(c => c.voice)).size === cb.length, 'doan co hai vai trung giong');
bang(V.castOf([{ speaker: '山田' }, { speaker: '山田一郎' }]).length, 1, '山田 va 山田一郎 la mot nguoi');
bang(V.castOf(doanB).find(c => c.speaker === '田中').genderVi, 'nữ', '田中 phai la nu');
bang(V.voiceFor('サントス', undefined, doanA), roster('santos').giong, 'voiceFor voi doan thoai van ra giong bang');

// 5. Giong trinh duyet: moi nhan vat cung gioi mot cao do rieng
for (const g of ['m', 'f']) {
  const pitch = jsonBang.nhanVat.filter(n => n.gioiTinh === g).map(n => V.browserVoice(n.ten_ja).pitch);
  ok(new Set(pitch.map(p => p.toFixed(4))).size === pitch.length, 'cao do trung nhau o nhom ' + g);
  ok(pitch.every(p => p > 0.3 && p < 2), 'cao do ngoai khoang');
}
ok(V.browserVoice('サントス').pitch !== V.browserVoice('ワン').pitch, 'Santos/Wang cung cao do');
ok(V.browserVoice('サントス').pitch < V.browserVoice('田中').pitch, 'nam phai tram hon nu');

// 6. Ten la: van tra ve giong hop le, khong Charon, canh bao dung MOT lan
const truoc = canhBao.length;
const la1 = V.voiceFor('謎の人'), la2 = V.voiceFor('謎の人'), la3 = V.genderOf('謎の人');
ok(la1 === la2 && la1 !== 'Charon', 'ten la phai on dinh va khong Charon');
ok(canhBao.length === truoc + 1, 'ten la phai canh bao dung mot lan');
ok(V.thongTin('謎の人').coTrongBang === false, 'ten la khong duoc coi la trong bang');

// 7. Nap tu tep xong thi khong doi gi khi khop; tep hong thi dung ban nhung
const daNap = await V.ready;
ok(daNap === true, 'phai nap duoc tep nhan-vat.json');
const hong = nap(async () => ({ ok: false, status: 404, json: async () => ({}) }));
ok((await hong.V.ready) === false, 'tep loi -> dung ban nhung');
bang(hong.V.voiceFor('ミラー'), roster('miller').giong, 'ban nhung phai dung duoc khi offline');
ok(hong.canhBao.some(w => /nhan-vat\.json/.test(w)), 'tep loi phai canh bao');
const xau = JSON.parse(JSON.stringify(jsonBang));
xau.nhanVat[1].giong = xau.nhanVat[0].giong;   // hai nhan vat trung giong
const tuChoi = nap(async () => ({ ok: true, json: async () => xau }));
ok((await tuChoi.V.ready) === false, 'bang trung giong phai bi tu choi');

// 8. Tep JSON doi giong thi bao qua onRosterChange va tra giong moi
const doiGiong = JSON.parse(JSON.stringify(jsonBang));
const nvDoi = doiGiong.nhanVat.find(n => n.id === 'gupta');
nvDoi.giong = 'Zubenelgenubi';   // giong nam con du
let daBao = 0;
const hai = nap(async () => ({ ok: true, json: async () => doiGiong }));
hai.V.onRosterChange(() => { daBao++; });
await hai.V.ready;
await new Promise(r => setTimeout(r, 5));
bang(hai.V.voiceFor('グプタ'), 'Zubenelgenubi', 'bang moi phai co hieu luc');
ok(daBao === 1, 'onRosterChange phai duoc goi mot lan');


// 9. Cong cu nghe thu giong: bo do cao do F0 chay dung tren tin hieu tong hop (khong dung API)
const maNghe = fs.readFileSync(path.join(goc, 'js', 'nghe-giong.js'), 'utf8');
const winNghe = { location: { search: '' } };
vm.runInNewContext(maNghe, { window: winNghe, console, setTimeout, clearTimeout });
const NG = winNghe.NgheGiong;
ok(NG && typeof NG.uocLuongF0 === 'function', 'nghe-giong.js phai dua ra uocLuongF0 khi khong co ?ngheGiong');
function giong(f0, giay = 1.5, sr = 24000) {
  const n = Math.round(giay * sr), x = new Float32Array(n);
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) - 0.5;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    let v = 0;
    for (let k = 1; k <= 8; k++) v += Math.sin(2 * Math.PI * f0 * k * t) / k;
    x[i] = 0.3 * v * (0.7 + 0.3 * Math.sin(2 * Math.PI * 3 * t)) + 0.01 * rnd();
  }
  return x;
}
for (const f0 of [95, 120, 150, 190, 230, 280]) {
  const r = NG.uocLuongF0(giong(f0), 24000);
  ok(r.f0 && Math.abs(r.f0 - f0) / f0 < 0.03, `F0 ${f0} Hz do ra ${r.f0}`);
  bang(NG.gioiTinhTheoF0(r.f0).gt, f0 >= 160 ? 'f' : 'm', `gioi tinh theo F0 ${f0}`);
}
bang(NG.uocLuongF0(new Float32Array(24000), 24000).f0, null, 'im lang khong co F0');
const on = new Float32Array(24000).map((_, i) => Math.sin(i * i * 0.37) * 0.3);   // gan nhu nhieu
ok(NG.uocLuongF0(on, 24000).f0 === null || NG.uocLuongF0(on, 24000).khungCoTieng < 10, 'nhieu khong duoc coi la co tieng');

console.log(`kiem_nhan_vat.test.mjs: ${soKiem} phep kiem ra ket qua dung (${jsonBang.nhanVat.length} nhan vat, ${soMau} mau ten).`);
