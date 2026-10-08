// dbg.mjs — mo app (mo phong) che do h, chay tu nhip `tu`, cho `cho` ms roi: chay biểu thuc JS (--ev, nhieu lan), chup anh (--chup)
// node dbg.mjs --bai N5-1 --tu 0 --den 3 --cho 4000 --w 1440 --h 900 --ev "expr" --chup file.jpg [--them "&x=1"] [--giam 1]
import { moServer, moChrome, Trang, donDep, sleep } from './cdp-lib.mjs';
import fs from 'node:fs';
const A = { ev: [], chup: [] }; const av = process.argv.slice(2);
for (let i = 0; i < av.length; i += 2) { const k = av[i].replace(/^--/, ''); if (k === 'ev' || k === 'chup') A[k].push(av[i + 1]); else A[k] = av[i + 1]; }
const them = (/phongCach=/.test(A.them || '') ? '' : '&phongCach=h') + (A.them || ''), [cap, so] = (A.bai || 'N5-1').split('-');
const tu = +(A.tu || 0), den = A.den != null ? +A.den : tu + 2, cho = +(A.cho || 3000);
const w = +(A.w || 1440), h = +(A.h || 900);
const goc = await moServer(); const ch = await moChrome({ w, h });
try {
  const t = new Trang(ch.cdp, goc); await t.batDau(w, h);
  if (A.giam) await t.media(true);
  await t.moApp({ them, bai: [cap, +so] });
  await t.ev(`__moPhong.datDen(${den})`);
  if (tu === 0) await t.bam('#autoLectureBtn'); else await t.ev(`__lecture.startFrom(${tu}).then(() => true)`);
  await t.cho(`__lecture.state().lectureState === 'PLAYING'`, 8000);
  const steps = (A.steps || String(cho)).split(',').map(Number);
  let n = 0;
  for (const s of steps) {
    await sleep(s);
    for (const e of A.ev) { try { console.log('EV', JSON.stringify(await t.ev(e))); } catch (er) { console.log('EV-LOI', String(er).slice(0, 300)); } }
    if (A.chup[n]) { fs.mkdirSync(A.chup[n].replace(/[\\/][^\\/]*$/, ''), { recursive: true }); await t.chup(A.chup[n]); }
    n++;
  }
  console.log('LOI', JSON.stringify(t.loi().filter(x => !/favicon|env\.js/.test(x.text)).slice(0, 12), null, 1));
  console.log('LOG', JSON.stringify(t.log.filter(x => /che-do|\[h\]/.test(x.text)).slice(0, 8)));
} finally { await ch.dong(); await donDep(); }
