// kich-ban.mjs — luot 1: chay mock bai giang N5-1 den het, lay loi doc cua moi luot giang cua Sensei + cac cau hoi thoai
// (giong nhan vat co dinh, kieu doc theo cam xuc) -> kich-ban-<bai>.json de tao tieng that.
//   node tools/che-do/video/kich-ban.mjs [--cap N5 --so 1] [--che s] [--ra DIR]
import { moServer, moChrome, Trang, donDep, sleep } from '../khung/cdp-lib.mjs';
import { THAM_SO_MOCK, batDauGiang, chayDenHet } from './chung.mjs';
import fs from 'node:fs';
import path from 'node:path';

const av = process.argv.slice(2);
const opt = (k, d) => { const i = av.indexOf(k); return i >= 0 ? av[i + 1] : d; };
const CAP = opt('--cap', 'N5'), SO = +opt('--so', 1), CHE = opt('--che', 's');
const RA = opt('--ra', 'E:/sensei-tam/video/n5-1');
fs.mkdirSync(RA, { recursive: true });

const goc = await moServer();
const ch = await moChrome({ w: 1440, h: 900 });
const t = new Trang(ch.cdp, goc);
try {
  await t.batDau(1440, 900);
  await t.moApp({ them: `&phongCach=${CHE}${THAM_SO_MOCK}&r=0.03`, bai: [CAP, SO] });
  await t.cho(`window.SenseiVoices && window.SenseiVoices.ready`, 8000).catch(() => {});
  await t.ev(`(window.SenseiVoices && SenseiVoices.ready ? Promise.resolve(SenseiVoices.ready).catch(()=>0) : 0).then(() => true)`);
  const beats = await t.ev(`__lecture.beats().map((b, i) => ({ i, kind: b.kind, id: b.id || (b.data && b.data.id) || null }))`);
  console.log('nhip:', beats.length, JSON.stringify(beats.reduce((a, b) => (a[b.kind] = (a[b.kind] || 0) + 1, a), {})));
  await batDauGiang(t);
  const kq = await chayDenHet(t, { onNhip: (i) => process.stdout.write(i + ' ') });
  console.log('\nket thuc', JSON.stringify(kq));
  const luot = await t.ev(`__moPhong.noiLuot()`);
  const thoai = await t.ev(`(() => { const out = []; const seen = new Set();
    __lecture.beats().forEach((b, i) => { if (b.kind !== 'kaiwa-run' && b.kind !== 'kaiwa') return;
      (Array.isArray(b.data) ? b.data : [b.data]).forEach((l) => { if (!l || !l.id || seen.has(l.id)) return; seen.add(l.id);
        const jp = (l.tokens || []).map((x) => x.kanji || x.text).join('');
        let voice = null, kieu = null; try { voice = SenseiVoices.voiceFor(l.speaker, l.speakerGender); kieu = SenseiVoices.kieuDoc(jp, l.emotion); } catch (e) {}
        out.push({ id: l.id, nhip: i, speaker: l.speaker, gender: l.speakerGender || null, emotion: l.emotion || null, voice, style: kieu && kieu.chiDan || '', styleKey: kieu && kieu.key || '', text: jp }); }); });
    return out; })()`);
  const loi = t.loi().filter((x) => !/favicon|env\.js|tailwindcss/.test(x.text));
  const ra = { bai: `${CAP}-${SO}`, luc: new Date().toISOString(), nhip: beats, ketThuc: kq, luot, thoai, loi: loi.slice(0, 10) };
  fs.writeFileSync(path.join(RA, `kich-ban-${CAP.toLowerCase()}-${SO}.json`), JSON.stringify(ra, null, 1));
  console.log('luot sensei:', luot.length, '| cau hoi thoai:', thoai.length, '| loi console:', loi.length);
  const chu = luot.reduce((n, x) => n + x.text.length, 0) + thoai.reduce((n, x) => n + x.text.length, 0);
  console.log('tong ky tu doc:', chu, '(~', Math.round(chu / 14 / 60), 'phut tieng neu ~14 ky tu/giay)');
} finally { await ch.dong(); await donDep(); }
