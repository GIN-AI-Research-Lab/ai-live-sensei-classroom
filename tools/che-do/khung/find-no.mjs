import { moServer, moChrome, Trang, donDep, sleep } from './cdp-lib.mjs';
const goc = await moServer(); const ch = await moChrome({ w: 390, h: 844 });
try {
  const t = new Trang(ch.cdp, goc); await t.batDau(390, 844);
  await t.moApp({ them: '&phongCach=h', bai: ['N5', 1] });
  await t.ev(`__moPhong.datDen(1)`);
  await t.bam("#autoLectureBtn");
  await t.cho(`(window.__cdH && __cdH.m())`, 20000, 100);
  await sleep(7000);
  console.log(JSON.stringify(await t.ev(`(() => { const L = document.querySelector('.cd-lop').getBoundingClientRect(); const out = []; const w = document.createTreeWalker(document.querySelector('.cd-lop'), NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (!n.textContent.trim()) continue; const r = document.createRange(); r.selectNodeContents(n); const b = r.getBoundingClientRect(); if (b.width && b.right > L.right - 2 && b.left < L.right) out.push([n.textContent.trim().slice(0, 30), Math.round(b.left), Math.round(b.right), Math.round(b.top), n.parentElement.className, n.parentElement.parentElement.className, n.parentElement.closest('.h-canh') && n.parentElement.closest('.h-canh').style.left]); } return out; })()`)));
  await t.dungGiang();
} finally { await ch.dong(); await donDep(); }
