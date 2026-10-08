// chup-the.mjs <k> : chup the chuong (tu vung -> chu Han) + the ket bai cua N5-1 o 1440x900 va 390x844
import { moServer, moChrome, Trang, donDep, sleep, SCR } from './cdp-lib.mjs';
import path from 'node:path';
const K = process.argv[2] || 'a';
const RA = path.join(SCR, 'che-do', K);
const goc = await moServer(); const ch = await moChrome();
try {
  const t = new Trang(ch.cdp, goc); await t.batDau();
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    await t.coManHinh(w, h);
    await t.moApp({ them: '&phongCach=' + K, bai: ['N5', 1] });
    const v = await t.ev(`(() => { const bs = __lecture.beats(); return { tuCuoi: bs.map((b,i)=>b.kind==='vocab'?i:-1).filter(i=>i>=0).pop(), n: bs.length }; })()`);
    await t.ev(`__moPhong.datDen(${v.tuCuoi + 1})`); await t.ev(`__lecture.startFrom(${v.tuCuoi}).then(() => true)`);
    await t.cho(`(__motion.trangThai()||{}).che === 'chuyen'`, 40000, 60);
    await sleep(900);
    await t.chup(path.join(RA, `the-chuong-${w}.jpg`));
    await t.dungGiang();
    await t.ev(`__moPhong.datDen(null)`); await t.ev(`__lecture.startFrom(${v.n - 1}).then(() => true)`);
    await t.cho(`(__motion.trangThai()||{}).che === 'cho'`, 40000, 150); await sleep(1400);
    await t.bam(`=[...document.querySelectorAll('#sanKhauGiang .qz-card[id^="card-"] .qz-opt')][0]`);
    await sleep(800);
    await t.bam(`=[...document.querySelectorAll('#sanKhauGiang button')].find(b => /Tiếp tục/.test(b.textContent))`);
    await t.cho(`!!document.querySelector('.cd-lop .a-tk, .sk-the-xong')`, 20000, 100);
    await sleep(1800);
    await t.chup(path.join(RA, `the-xong-${w}.jpg`));
    await t.dungGiang();
  }
  console.log('loi', JSON.stringify(t.loi().filter(x => !/favicon|env\.js/.test(x.text)).slice(0, 5)));
} finally { await ch.dong(); await donDep(); }
