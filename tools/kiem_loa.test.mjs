// Kiem thu nut loa / vung boi den (js/sensei-doc.js) trong Chrome headless that, KHONG goi Gemini:
//   node tools/kiem_loa.test.mjs [--giu]     (--giu: in them nhat ky; chup anh vao E:/sensei-tam/tmp/kiem-loa)
// Bo tong hop gia ghi lai (voice, van ban, kieu) va tra PCM 24 kHz kieu nguyen am (formant) de khau-hinh / avatar co cai de chay.
// Kiem: cau thoai -> giong nhan vat (Miller Fenrir, 田中 Kore, サントス Orus); tu vung / vi du ngu phap / chu boi den ngoai hoi thoai -> Charon;
// boi den TRONG cau thoai -> giong nhan vat do; bo nho (RAM roi IndexedDB) khong goi lai; meo nhep mieng khi Sensei doc va IM khi nhan vat doc;
// avatar chan dung nhep mieng khi nhan vat doc va DUNG YEN khi Sensei doc; khong co loi console; lap lai cho cap Nhap mon (kana).
import { moTrinhDuyet, ngu } from './_kiem_chrome.mjs';

const giu = process.argv.includes('--giu');
const bang = [];
const kt = (nhom, ten, ok, chiTiet = '') => { bang.push({ nhom, ten, ok: !!ok, chiTiet: String(chiTiet) }); };

const MA_TRONG = String.raw`
window.__sy = [];
window.__vowelPcm = function (text, voice) {
  const SR = 24000, F = { a: [720, 1200], i: [300, 2250], u: [330, 1150], e: [500, 1850], o: [480, 850] };
  const hira = 'あかさたなはまやらわがざだばぱぁゃゎ|いきしちにひみりぎじぢびぴぃ|うくすつぬふむゆるぐずづぶぷぅゅ|えけせてねへめれげぜでべぺぇ|おこそとのほもよろをごぞどぼぽぉょ'.split('|');
  const V = 'aiueo';
  const seq = [];
  for (const ch0 of String(text)) {
    const ch = ch0.replace(/[\u30a1-\u30f6]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
    const k = hira.findIndex(r => r.includes(ch));
    if (k >= 0) seq.push({ v: V[k], b: 'まみむめもばびぶべぼぱぴぷぺぽ'.includes(ch) });
    else if (/[\u4e00-\u9fff]/.test(ch)) { seq.push({ v: 'a' }); seq.push({ v: 'o' }); }
    else if (/[a-zA-Zà-ỹ]/.test(ch)) seq.push({ v: V[(ch.charCodeAt(0)) % 5] });
  }
  const seqc = seq.slice(0, 18);
  let h = 0; for (const c of voice) h = (h * 31 + c.charCodeAt(0)) | 0;
  const f0b = 105 + Math.abs(h) % 120;
  const dur = 0.13, n = Math.round(seqc.length * dur * SR) + Math.round(0.3 * SR);
  const x = new Float32Array(n);
  seqc.forEach((m, i) => {
    const s0 = Math.round((0.1 + i * dur) * SR), len = Math.round(dur * SR), [f1, f2] = F[m.v];
    for (let j = 0; j < len; j++) {
      const t = (s0 + j) / SR, env = Math.pow(Math.sin(Math.PI * j / len), 0.6) * (m.b && j < len * 0.35 ? 0.05 : 1);
      const f0 = f0b * (1 - 0.06 * i / seqc.length);
      let w = 0;
      for (let hh = 1; hh * f0 < 4000; hh++) {
        const f = hh * f0, a = (Math.exp(-Math.pow((f - f1) / 110, 2)) + 0.8 * Math.exp(-Math.pow((f - f2) / 160, 2))) / hh;
        w += a * Math.sin(2 * Math.PI * f * t);
      }
      x[s0 + j] = 0.18 * env * w;
    }
  });
  const u8 = new Uint8Array(n * 2), dv = new DataView(u8.buffer);
  for (let i = 0; i < n; i++) dv.setInt16(i * 2, Math.max(-1, Math.min(1, x[i])) * 32000, true);
  return u8;
};
SenseiDoc.datTongHop(async (q) => { window.__sy.push({ voice: q.voice, text: q.text, style: q.style }); return window.__vowelPcm(q.text, q.voice); });
window.__cat = { kh: 0, khoa: {}, ava: 0, n: 0 };
window.__lay = () => JSON.stringify({ kh: window.__cat.kh, khoa: Object.keys(window.__cat.khoa).length, ava: window.__cat.ava, n: window.__cat.n });
window.__dat0 = () => { window.__cat = { kh: 0, khoa: {}, ava: 0, n: 0 }; };
setInterval(() => {
  const ae = window.__audioEngine, KH = window.SenseiKhauHinh;
  if (!ae || !ae.outCtx || !ae.clipPlaying) return;
  window.__cat.n++;
  try { const l = KH.layLuc(KH.bayGio(ae.outCtx)); if (l && l.co && l.mo > 0.12) window.__cat.kh++; } catch (e) {}
  try { const C = window.__senseiClip; if (C && C.mieng && C.mieng.M && C.mieng.M.khoaVe != null) window.__cat.khoa[C.mieng.M.khoaVe] = 1; } catch (e) {}
  try { if (window.SenseiAvatarNoi._ds().some(a => a.hoat && a.canvas && a.canvas.offsetWidth > 0)) window.__cat.ava++; } catch (e) {}
}, 16);
'window.__sy ok'`;

async function doiHetDoc(t, soKyTruoc) {
  // cho ban ghi 'doc' moi va phat xong
  await t.cho(`SenseiDoc.nhatKy.filter(r => r.loai === 'doc').length > ${soKyTruoc}`, 20000, 50);
  await t.cho(`!__audioEngine.clipPlaying`, 20000, 50);
  await ngu(150);
}
async function bam(t, bieuThuc) {
  const truoc = await t.ev(`SenseiDoc.nhatKy.filter(r => r.loai === 'doc').length`);
  const sy0 = await t.ev(`__sy.length`);
  await t.ev(`window.__dat0()`);
  const ok = await t.ev(`(() => { const el = (${bieuThuc}); if (!el) return false; el.click(); return true; })()`);
  if (!ok) return { khongTimThay: true };
  await doiHetDoc(t, truoc);
  const ky = await t.ev(`JSON.stringify(SenseiDoc.nhatKy.filter(r => r.loai === 'doc').slice(-1)[0])`);
  const sy1 = await t.ev(`__sy.length`);
  const moi = await t.ev(`JSON.stringify(__sy.slice(${sy0}))`);
  const cat = JSON.parse(await t.ev(`window.__lay()`));
  return { ky: JSON.parse(ky), goi: sy1 - sy0, moi: JSON.parse(moi), cat };
}
async function boiDen(t, bieuThucChon) {
  await t.ev(`(() => { ${bieuThucChon} })()`);
  await ngu(120);
  return bam(t, `document.getElementById('selectionSpeakerBadge')`);
}
const hangThoai = (ten) => `[...document.querySelectorAll('.kw-row')].filter(r => r.querySelector('.kw-name').textContent.includes(${JSON.stringify(ten)}))[0]?.querySelector('.kw-top .icon-btn')`;

async function moBai(t, cap, bai) {
  await t.ev(`document.querySelector('.lesson-card[data-level="${cap}"][data-lesson="${bai}"]').click()`);
  await t.cho(`__slideEngine.currentLevel === ${JSON.stringify(cap)} && __slideEngine.currentLesson === ${bai}`, 15000);
  await ngu(700);
}

const t = await moTrinhDuyet({ duong: '/index.html?noLive&sensei=video', w: 1280, h: 800, hienLog: false });
try {
  await t.cho('!!window.__slideEngine && !!window.__audioEngine && !!window.SenseiDoc && SenseiDoc.san()', 30000);
  await t.ev(`document.getElementById('pickerCloseBtn').click()`);
  await t.ev(MA_TRONG);
  await t.ev(`(async () => { __audioEngine.ensureOutContext(); await __audioEngine.outCtx.resume(); return __audioEngine.outCtx.state; })()`);
  await t.ev(`SenseiDoc.xoaBoNho().then(() => 1)`);
  // cho meo clip san sang (neu khong thi van kiem bang dong khau-hinh)
  const meoSan = await t.cho(`!!window.__senseiClip && window.__senseiClip.mieng && window.__senseiClip.mieng.M && window.__senseiClip.mieng.M.tt === 'san'`, 25000, 250);
  kt('nen', 'meo clip san sang de do canvas mieng', meoSan, meoSan ? '' : 'khong doi duoc meo — chi kiem dong khau-hinh');

  // ------------------------------------------------ N5 bai 1 (Miller)
  await moBai(t, 'N5', 1);
  await t.ev(`__slideEngine.setTab('kaiwa')`); await ngu(700);
  let r = await bam(t, hangThoai('ミラー'));
  kt('hoi-thoai', 'nut loa cau Miller -> Fenrir', r.ky && r.ky.voice === 'Fenrir', JSON.stringify(r.ky));
  kt('hoi-thoai', 'Miller: kieu doc trung tinh hoac theo the, khong rong van ban', r.moi && r.moi[0] && r.moi[0].text.length > 3, r.moi && r.moi[0] && r.moi[0].text);
  kt('hinh-meo', 'nhan vat doc: khau-hinh (dong cua meo) IM', r.cat.kh === 0, JSON.stringify(r.cat));
  kt('hinh-avatar', 'nhan vat doc: chan dung nhep mieng (canvas hien)', r.cat.ava > 10, JSON.stringify(r.cat));
  // Bam lai CUNG cau: clip da luu (dialogueAudio) va bo nho -> khong goi tong hop lai
  const r2 = await bam(t, hangThoai('ミラー'));
  kt('bo-nho', 'bam lai cau Miller: khong goi tong hop', r2.goi === 0, JSON.stringify({ goi: r2.goi, nguon: r2.ky && r2.ky.nguon }));
  kt('bo-nho', 'bam lai cau Miller: dung clip da dung san (khop giong + kieu)', r2.ky && r2.ky.nguon === 'clip-san', r2.ky && r2.ky.nguon);

  // boi den TRONG cau thoai (token dau cau 2 cua Yamada) -> giong Yamada (Achird)
  const r4 = await boiDen(t, `
    const row = [...document.querySelectorAll('.kw-row')].filter(r => r.querySelector('.kw-name').textContent.includes('山田'))[0];
    const tok = row.querySelector('.jp-tok');
    const rg = document.createRange(); rg.selectNodeContents(tok);
    const s = getSelection(); s.removeAllRanges(); s.addRange(rg);
    document.dispatchEvent(new Event('mouseup'));`);
  kt('hoi-thoai', 'boi den trong cau cua Yamada -> Achird', r4.ky && r4.ky.voice === 'Achird', JSON.stringify(r4.ky));

  // bam vao mot TU trong cau (token) -> giong nhan vat
  const r5 = await bam(t, `[...document.querySelectorAll('.kw-row')].filter(r => r.querySelector('.kw-name').textContent.includes('ミラー'))[0].querySelector('.jp-tok')`);
  kt('hoi-thoai', 'bam mot tu trong cau Miller -> Fenrir', r5.ky && r5.ky.voice === 'Fenrir', JSON.stringify(r5.ky));

  // ------------------------------------------------ tu vung
  await t.ev(`__slideEngine.setTab('vocab')`); await ngu(700);
  const r6 = await bam(t, `document.querySelector('.vc-card .icon-btn')`);
  kt('sensei', 'nut loa tu vung -> Charon (doc kana)', r6.ky && r6.ky.voice === 'Charon', JSON.stringify(r6.ky));
  kt('hinh-meo', 'Sensei doc: meo nhep mieng (khau-hinh co tieng)', r6.cat.kh > 10, JSON.stringify(r6.cat));
  kt('hinh-avatar', 'Sensei doc: chan dung dung yen', r6.cat.ava === 0, JSON.stringify(r6.cat));
  if (meoSan) kt('hinh-meo', 'Sensei doc: canvas mieng meo doi hinh (khoa trong so)', r6.cat.khoa >= 2, JSON.stringify(r6.cat));

  // Bo nho: lan 2 (RAM), xoa RAM roi lan 3 (IndexedDB) khong goi tong hop
  const v2 = await bam(t, `document.querySelector('.vc-card .icon-btn')`);
  kt('bo-nho', 'tu vung bam lan 2: khong goi tong hop (RAM)', v2.goi === 0, JSON.stringify({ goi: v2.goi }));
  await t.ev(`SenseiDoc._t.ram.clear(); 1`);
  const v3 = await bam(t, `document.querySelector('.vc-card .icon-btn')`);
  kt('bo-nho', 'xoa RAM: bam lai van khong goi tong hop (IndexedDB)', v3.goi === 0, JSON.stringify({ goi: v3.goi }));
  const nk = await t.ev(`SenseiDoc.nhatKy.filter(x => x.loai === 'bo-nho').length`);
  kt('bo-nho', 'nhat ky ghi nhan >= 2 lan trung bo nho', +nk >= 2, nk);
  const dbSo = await t.ev(`(async () => { try { const db = await new Promise((ok, no) => { const q = indexedDB.open('sensei_tts'); q.onsuccess = () => ok(q.result); q.onerror = no; }); const n = await new Promise(ok => { const q = db.transaction('clips').objectStore('clips').count(); q.onsuccess = () => ok(q.result); }); return n; } catch (e) { return -1; } })()`);
  kt('bo-nho', 'IndexedDB sensei_tts co muc da luu', dbSo > 0, dbSo);

  // ------------------------------------------------ ngu phap
  await t.ev(`__slideEngine.setTab('grammar')`); await ngu(700);
  const r7 = await bam(t, `document.querySelector('.gp-ex .icon-btn')`);
  kt('sensei', 'nut loa vi du ngu phap -> Charon', r7.ky && r7.ky.voice === 'Charon', JSON.stringify(r7.ky));
  const r8 = await boiDen(t, `
    const el = document.querySelector('.gp-ex .jp-sentence');
    const rg = document.createRange(); rg.selectNodeContents(el);
    const s = getSelection(); s.removeAllRanges(); s.addRange(rg);
    document.dispatchEvent(new Event('mouseup'));`);
  kt('sensei', 'boi den trong slide ngu phap -> Charon', r8.ky && r8.ky.voice === 'Charon', JSON.stringify(r8.ky));
  kt('sensei', 'boi den: khong lan furigana (rt)', r8.moi && r8.moi[0] && !/^[ぁ-ん]+(?=[一-龥])/.test(r8.moi[0].text), r8.moi && r8.moi[0] && r8.moi[0].text);
  const r9 = await bam(t, `document.querySelector('.gp-ex .jp-tok')`);
  kt('sensei', 'bam mot tu trong vi du ngu phap -> Charon', r9.ky && r9.ky.voice === 'Charon', JSON.stringify(r9.ky));

  // ------------------------------------------------ kanji
  await t.ev(`__slideEngine.setTab('kanji')`); await ngu(700);
  const r10 = await bam(t, `document.querySelector('.kj-card .icon-btn')`);
  kt('sensei', 'nut loa kanji -> Charon', r10.ky && r10.ky.voice === 'Charon', JSON.stringify(r10.ky));

  // ------------------------------------------------ N3 bai 1: 田中 va サントス
  await moBai(t, 'N3', 1);
  await t.ev(`__slideEngine.setTab('kaiwa')`); await ngu(800);
  const r11 = await bam(t, hangThoai('田中'));
  kt('hoi-thoai', 'nut loa cau 田中 -> Kore', r11.ky && r11.ky.voice === 'Kore', JSON.stringify(r11.ky));
  const r12 = await bam(t, hangThoai('サントス'));
  kt('hoi-thoai', 'nut loa cau サントス -> Orus', r12.ky && r12.ky.voice === 'Orus', JSON.stringify(r12.ky));
  kt('hinh-avatar', 'N3: サントス doc -> avatar nhep mieng, meo im', r12.cat.ava > 10 && r12.cat.kh === 0, JSON.stringify(r12.cat));

  // ------------------------------------------------ Nhap mon (kana)
  await moBai(t, 'KANA', 2);
  await t.ev(`__slideEngine.setTab('vocab')`); await ngu(700);
  const k1 = await bam(t, `document.querySelector('.vc-card .icon-btn')`);
  kt('kana', 'kana bai 2: tu vung -> Charon', k1.ky && k1.ky.voice === 'Charon', JSON.stringify(k1.ky));
  await t.ev(`__slideEngine.setTab('kanji')`); await ngu(700);
  const k2 = await bam(t, `document.querySelector('.kj-card .icon-btn')`);
  kt('kana', 'kana bai 2: the chu kana -> Charon', k2.ky && k2.ky.voice === 'Charon', JSON.stringify(k2.ky));
  await t.ev(`__slideEngine.setTab('kaiwa')`); await ngu(700);
  const k3 = await bam(t, `document.querySelector('.kw-row .kw-top .icon-btn')`);
  const vk = await t.ev(`(() => { const r = document.querySelector('.kw-row'); return r ? r.querySelector('.kw-name').textContent : ''; })()`);
  const vtheo = await t.ev(`SenseiVoices.voiceFor(${JSON.stringify(vk)})`);
  kt('kana', 'kana bai 2: cau thoai dau -> giong nhan vat theo bang (' + vk + ' -> ' + vtheo + ')', k3.ky && k3.ky.voice === vtheo, JSON.stringify(k3.ky));

  // ------------------------------------------------ console
  const loi = t.loi();
  kt('nen', 'khong co loi console', loi.length === 0, loi.slice(0, 3).join(' | '));
  if (giu) console.log(await t.ev(`JSON.stringify(SenseiDoc.nhatKy.slice(-12))`));
} catch (e) {
  kt('nen', 'chay bai kiem thu khong loi', false, e && e.stack || e);
} finally {
  await t.dong();
}

let hong = 0;
for (const b of bang) {
  if (!b.ok) hong++;
  console.log(`${b.ok ? 'DAT ' : 'HONG'}  [${b.nhom}] ${b.ten}${b.ok ? '' : '  <-- ' + b.chiTiet.slice(0, 300)}`);
}
console.log(`\n${bang.length - hong}/${bang.length} dat`);
process.exit(hong ? 1 : 0);
