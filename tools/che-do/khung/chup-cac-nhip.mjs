// chup-cac-nhip.mjs — chup moi dang nhip (vocab, kanji, grammar-intro, example, kaiwa-intro, kaiwa, quiz) cua MOT bai, 1440x900 + 390x844.
// node chup-cac-nhip.mjs --bai N5-1 --them "&phongCach=h" --ra DIR [--cho 7000] [--dang vocab,kanji] [--chi 1440|390] [--css "..."]
//   --css : chen them CSS vao trang (vd. thu tang co chu: ".cd-lop{font-size:120%}")
import { moServer, moChrome, Trang, donDep, sleep } from './cdp-lib.mjs';
import fs from 'node:fs';
import path from 'node:path';
const A = {}; const av = process.argv.slice(2);
for (let i = 0; i < av.length; i += 2) A[av[i].replace(/^--/, '')] = av[i + 1];
const them = A.them || '&phongCach=h', [cap, so] = (A.bai || 'N5-1').split('-');
const ra = A.ra || 'E:/sensei-tam/tmp/chup-nhip', cho = +(A.cho || 7000);
const DANG = (A.dang || 'vocab,kanji,grammar-intro,example,kaiwa-intro,kaiwa,quiz').split(',');
const MAN = [[1440, 900], [390, 844]].filter(([w]) => !A.chi || String(w) === A.chi);
fs.mkdirSync(ra, { recursive: true });
const goc = await moServer();
try {
  for (const [w, h] of MAN) {
    const ch = await moChrome({ w, h });
    const t = new Trang(ch.cdp, goc); await t.batDau(w, h);
    await t.moApp({ them, bai: [cap, +so] });
    if (A.css) await t.ev(`(() => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(A.css)}; document.head.appendChild(s); return 1; })()`);
    const idx = await t.ev(`(() => { const bs = __lecture.beats(); const o = {}; ${JSON.stringify(DANG)}.forEach((k) => { o[k] = bs.findIndex((b) => b.kind === k); }); return o; })()`);
    for (const k of DANG) {
      const i = idx[k];
      if (i == null || i < 0) { console.log(`${w} ${k}: khong co`); continue; }
      await t.ev(`__moPhong.datDen(${i + 1})`);
      await t.ev(`__lecture.startFrom(${i}).then(() => true)`);
      await t.cho(`__lecture.state().lectureState === 'PLAYING'`, 10000);
      await sleep(cho);
      const f = path.join(ra, `${cap}-${so}-${k}-${w}.jpg`);
      await t.chup(f);
      console.log(`${w} ${k} (#${i}) -> ${f}`);
    }
    await ch.dong();   // chi dong Chrome nay; donDep() se giet ca server
  }
} finally { await donDep(); }
process.exit(0);
