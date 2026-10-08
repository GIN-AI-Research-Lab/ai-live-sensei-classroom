// chup-chuoi.mjs --them "&phongCach=a" --bai N5-1 --tu 0 --den 3 --n 10 --buoc 1500 --w 1440 --h 900 --ra <thu muc>
import { moServer, moChrome, Trang, donDep, sleep } from './cdp-lib.mjs';
import fs from 'node:fs';
const A = {}; const av = process.argv.slice(2);
for (let i = 0; i < av.length; i += 2) A[av[i].replace(/^--/, '')] = av[i + 1];
const them = A.them || '&phongCach=a', [cap, so] = (A.bai || 'N5-1').split('-');
const tu = +(A.tu || 0), den = A.den != null ? +A.den : tu + 2, n = +(A.n || 10), buoc = +(A.buoc || 1500);
const w = +(A.w || 1440), h = +(A.h || 900), ra = A.ra || '.';
fs.mkdirSync(ra, { recursive: true });
const goc = await moServer(); const ch = await moChrome({ w, h });
try {
  const t = new Trang(ch.cdp, goc); await t.batDau(w, h);
  await t.moApp({ them, bai: [cap, +so] });
  await t.ev(`__moPhong.datDen(${den})`);
  if (tu === 0) await t.bam('#autoLectureBtn'); else await t.ev(`__lecture.startFrom(${tu}).then(() => true)`);
  await t.cho(`__lecture.state().lectureState === 'PLAYING'`, 8000);
  for (let k = 0; k < n; k++) {
    await sleep(buoc);
    const s = await t.ev(`({ i: __lecture.index(), st: __lecture.state().lectureState, cd: __motion.cheDo ? __motion.cheDo() : null, che: __motion.trangThai().che })`);
    await t.chup(`${ra}/c${String(k).padStart(2, '0')}.jpg`);
    console.log(k, JSON.stringify(s));
    if (s.che === 'cho') { const b = await t.bam(`=[...document.querySelectorAll('#sanKhauGiang .qz-opt')].find(b => !b.disabled)`); console.log('bam dap an', !!b); }
    if (s.st !== 'PLAYING') break;
  }
  console.log('LOI', JSON.stringify(t.loi().filter(x => !/favicon|env\.js/.test(x.text)).slice(0, 12), null, 1));
  console.log('WARN', JSON.stringify(t.log.filter(x => x.loai === 'warning').slice(0, 12).map(x => x.text)));
} finally { await ch.dong(); await donDep(); }
