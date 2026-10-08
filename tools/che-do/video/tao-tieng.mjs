// tao-tieng.mjs — luot 2: tao tieng THAT (Gemini Live qua trang ?taoTiengDemo, giong co dinh) cho moi luot giang cua Sensei
// va moi cau hoi thoai trong kich-ban-<bai>.json. Trang tu doc khoa tu env.js luc chay; script nay KHONG doc / in / ghi khoa.
//   node tools/che-do/video/tao-tieng.mjs [--bai n5-1] [--ra E:/sensei-tam/video/n5-1] [--toi-da N] [--thu]
//   --thu : chi nap kich ban va in so dong / so ky tu, KHONG goi API.
// Ket qua: <ra>/tieng/<id>.wav (24 kHz mono 16-bit, da cat im lang + chuan hoa dinh) + tieng/manifest.json. Chay lai thi bo qua dong da co.
import { moServer, moChrome, Trang, donDep, sleep } from '../khung/cdp-lib.mjs';
import fs from 'node:fs';
import path from 'node:path';

const av = process.argv.slice(2);
const opt = (k, d) => { const i = av.indexOf(k); return i >= 0 ? av[i + 1] : d; };
const BAI = opt('--bai', 'n5-1'), RA = opt('--ra', 'E:/sensei-tam/video/n5-1'), TOI_DA = +opt('--toi-da', 0), THU = av.includes('--thu');
const kb = JSON.parse(fs.readFileSync(path.join(RA, `kich-ban-${BAI}.json`), 'utf8'));
const thuTieng = path.join(RA, 'tieng');
fs.mkdirSync(thuTieng, { recursive: true });
const manPath = path.join(thuTieng, 'manifest.json');
const man = fs.existsSync(manPath) ? JSON.parse(fs.readFileSync(manPath, 'utf8')) : { lines: {} };

export const idLuot = (khoa) => 'sensei_' + khoa.replace(/[^0-9a-z-]+/gi, '_');
const dong = [];
for (const l of kb.luot) dong.push({ id: idLuot(l.khoa), text: l.text, voice: 'Charon', style: '', loai: 'luot', khoa: l.khoa });
for (const d of kb.thoai) dong.push({ id: 'thoai_' + d.id, text: d.text, voice: d.voice || 'Charon', style: d.style || '', loai: 'thoai', idCau: d.id, speaker: d.speaker });
// Luot dai / co ky hieu la hay lam phien Live loi: lam sach ky hieu (↗ ← → — danh sach danh so) va tach thanh cac doan <= ~250 ky tu.
// Cac doan duoc noi lai khi ghep (manifest: khoaLuot giong nhau, phan = thu tu, vanGoc = van ban nguyen cua luot).
const lamSach = (x) => x.replace(/[↗↘→←↑↓]/g, ' ').replace(/\s[—–]\s/g, ', ').replace(/(^|[.!?]\s)\d+\.\s/g, '$1').replace(/\s+/g, ' ').trim();
function chiaDoan(text, toiDa = 250) {
  const cau = text.match(/[^.!?;]+[.!?;]+\s*|[^.!?;]+$/g) || [text];
  const out = []; let cur = '';
  for (const c of cau) { if (cur && (cur + c).length > toiDa) { out.push(cur.trim()); cur = ''; } cur += c; }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
// ---- kiem tra chat luong: tieng bi CAT CUT (model dung som) -> dong bi bo va tao lai, tach nho hon (cap nho: 0 -> <=110 ky tu, 1 -> <=60)
// Luot Sensei: doc binh thuong 7-20 ky tu/giay; > 22 ky tu/giay la bi cat. Cau hoi thoai (tieng Nhat): >= 0.07 giay / ky tu.
const DAT = (l) => (l.loai === 'thoai' ? l.giay >= 0.07 * l.text.length : (l.text.length < 40 || l.text.length / l.giay <= 22));
man.nho = man.nho || {};
const khoaGoc = (l) => (l.loai === 'luot' ? l.khoaLuot : l.idCau);
const huy = new Set();
for (const l of Object.values(man.lines)) if (!DAT(l)) huy.add(khoaGoc(l));
for (const l of Object.values(man.lines)) {
  if (huy.has(khoaGoc(l))) {
    delete man.lines[l.id];
    try { fs.unlinkSync(path.join(thuTieng, l.id + '.wav')); } catch (e) {}
  }
}
huy.forEach((k) => { man.nho[k] = (k in man.nho) ? man.nho[k] + 1 : 0; });
if (huy.size) console.log('bo', huy.size, 'luot nghi cat cut, tao lai tach nho:', [...huy].slice(0, 30).join(' '));
const MUC_NHO = [110, 60, 35];
const dongCoDoan = [];
for (const d of dong) {
  const key = d.loai === 'luot' ? d.khoa : d.idCau;
  const nho = man.nho[key];
  const dai = d.loai === 'luot' && (d.text.length > 390 || /[↗↘→←]/.test(d.text) || /(^|[.!?]\s)\d+\.\s/.test(d.text));
  if (d.loai === 'luot' && (nho != null || dai)) {
    const ph = chiaDoan(lamSach(d.text), nho != null ? MUC_NHO[Math.min(nho, MUC_NHO.length - 1)] : 250);
    if (ph.length > 1 || nho != null) { ph.forEach((t, i) => dongCoDoan.push({ ...d, id: d.id + '__' + (i + 1), text: t, phan: i + 1, soPhan: ph.length, vanGoc: d.text, goc: d.id })); continue; }
  }
  dongCoDoan.push(d);
}
// manifest: xoa dong cu khong con trong ke hoach (van ban doi / cach tach doi) de khong noi nham doan cu
const idCoHieuLuc = new Set(dongCoDoan.map((d) => d.id));
for (const l of Object.values(man.lines)) if (!idCoHieuLuc.has(l.id) || l.text !== (dongCoDoan.find((d) => d.id === l.id) || {}).text) { delete man.lines[l.id]; try { fs.unlinkSync(path.join(thuTieng, l.id + '.wav')); } catch (e) {} }
fs.writeFileSync(manPath, JSON.stringify(man, null, 1));
const ds = TOI_DA ? dongCoDoan.slice(0, TOI_DA) : dongCoDoan;
const ky = ds.reduce((n, d) => n + d.text.length, 0);
console.log(`dong: ${ds.length} (luot Sensei ${ds.filter(d => d.loai === 'luot').length}, hoi thoai ${ds.filter(d => d.loai === 'thoai').length}) | ky tu: ${ky} | giong: ${[...new Set(ds.map(d => d.voice))].join(', ')}`);
if (THU) process.exit(0);

const cho = ds.filter(d => !(man.lines[d.id] && fs.existsSync(path.join(thuTieng, d.id + '.wav')) && man.lines[d.id].text === d.text && man.lines[d.id].voice === d.voice));
console.log('can tao:', cho.length, '| da co:', ds.length - cho.length);
if (!cho.length) process.exit(0);

function taoWav(pcm) {
  const n = pcm.length, out = Buffer.alloc(44 + n);
  out.write('RIFF', 0); out.writeUInt32LE(36 + n, 4); out.write('WAVE', 8); out.write('fmt ', 12); out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22); out.writeUInt32LE(24000, 24); out.writeUInt32LE(48000, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34);
  out.write('data', 36); out.writeUInt32LE(n, 40); pcm.copy(out, 44);
  return out;
}

// Can server.py cua ung dung (cung cap env.js cho trang); http.server thuong khong co khoa -> --goc http://127.0.0.1:3000
const goc = opt('--goc', null) || await moServer();
const ch = await moChrome({ w: 1200, h: 800 });
const t = new Trang(ch.cdp, goc);
try {
  await t.batDau(1200, 800);
  await t.c.send('Page.navigate', { url: `${goc}/?noLive&taoTiengDemo=1` });
  const ok = await t.cho(`!!(window.TaoTiengDemo && window.TaoTiengDemo.docKichBan)`, 30000, 200);
  if (!ok) throw new Error('trang tao tieng chua san sang');
  const n = await t.ev(`TaoTiengDemo.docKichBan(${JSON.stringify(cho.map((d, i) => ({ id: d.id, t: i, dur: 0, text: d.text, voice: d.voice, style: d.style })))}, 'kich-ban-${BAI}.json')`);
  console.log('da nap', n, 'dong vao cong cu');
  await t.ev(`setTimeout(() => TaoTiengDemo.chayTatCa(), 50), true`);
  const t0 = Date.now();
  let lanChay = 1, xong = 0;
  for (;;) {
    await sleep(10000);
    const tt = await t.ev(`TaoTiengDemo.dong`);
    // lay PCM dong da xong, luu ngay
    for (const x of tt) {
      if (x.tt !== 'xong' || man.lines[x.id] && fs.existsSync(path.join(thuTieng, x.id + '.wav')) && man.lines[x.id].khoa === 'ok') continue;
      const b64 = await t.ev(`TaoTiengDemo.pcmB64(${JSON.stringify(x.id)})`);
      if (!b64) continue;
      const pcm = Buffer.from(b64, 'base64');
      const d = ds.find(z => z.id === x.id);
      fs.writeFileSync(path.join(thuTieng, x.id + '.wav'), taoWav(pcm));
      man.lines[x.id] = { id: x.id, loai: d.loai, khoa: 'ok', idCau: d.idCau || null, khoaLuot: d.khoa || null, phan: d.phan || 0, soPhan: d.soPhan || 0, vanGoc: d.vanGoc || null, goc: d.goc || null, text: d.text, voice: d.voice, style: d.style, giay: +(pcm.length / 48000).toFixed(3), tuBoNho: x.tuBoNho, model: x.model };
      xong++;
    }
    fs.writeFileSync(manPath, JSON.stringify(man, null, 1));
    const dem = tt.reduce((a, x) => (a[x.tt] = (a[x.tt] || 0) + 1, a), {});
    const phut = ((Date.now() - t0) / 60000).toFixed(1);
    console.log(`[${phut} ph] ${JSON.stringify(dem)} | da luu ${xong}/${cho.length}`);
    const dang = await t.ev(`!!document.querySelector('#tao-tieng')`) && await t.ev(`(() => { const b = [...document.querySelectorAll('#tao-tieng button')].find(x => /Tạo tất cả/.test(x.textContent)); return b ? b.disabled : null; })()`);
    if (dem.xong === cho.length) break;
    if (dang === false) {   // da ngung chay ma con dong loi -> chay lai (toi da 4 lan)
      if (lanChay >= 4) { console.log('con dong loi sau 4 lan chay:', tt.filter(x => x.tt === 'loi').map(x => x.id + ': ' + x.loi).slice(0, 8).join(' | ')); break; }
      lanChay++; console.log('chay lai lan', lanChay);
      await t.ev(`setTimeout(() => TaoTiengDemo.chayTatCa(), 50), true`);
    }
  }
  console.log('xong:', Object.keys(man.lines).length, 'dong co WAV');
  const nghi = Object.values(man.lines).filter((l) => !DAT(l));
  if (nghi.length) console.log('NGHI CAT CUT:', nghi.length, 'dong -> chay lai lenh nay de tao lai tach nho hon:', nghi.map((l) => l.id + '(' + l.giay + 's/' + l.text.length + 'ch)').join(' '));
  else console.log('KIEM TRA DO DAI: dat (khong dong nao nghi cat cut)');
} finally { await ch.dong(); await donDep(); }
