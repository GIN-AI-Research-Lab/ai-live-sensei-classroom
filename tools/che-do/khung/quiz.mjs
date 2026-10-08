// quiz.mjs — quiz trong che do h: cong that, tra loi sai roi dung, chup + kiem tra nhan xet Sensei bi an. node quiz.mjs [--w 1440 --h 900] [--ra DIR]
import { moServer, moChrome, Trang, donDep, sleep } from './cdp-lib.mjs';
import fs from 'node:fs';
const A = {}; const av = process.argv.slice(2);
for (let i = 0; i < av.length; i += 2) A[av[i].replace(/^--/, '')] = av[i + 1];
const w = +(A.w || 1440), h = +(A.h || 900), ra = A.ra || '../chup/quiz';
fs.mkdirSync(ra, { recursive: true });
const goc = await moServer(); const ch = await moChrome({ w, h });
try {
  const t = new Trang(ch.cdp, goc); await t.batDau(w, h);
  await t.moApp({ them: '&phongCach=h', bai: ['N5', 1] });
  const qz = await t.ev(`__lecture.beats().findIndex((b) => b.kind === 'quiz')`);
  await t.ev(`__moPhong.datDen(${qz + 2})`);
  await t.ev(`__lecture.startFrom(${qz}).then(() => true)`);
  await t.cho(`(__motion.trangThai() || {}).che === 'cho'`, 60000, 150);
  await sleep(1500);
  await t.chup(`${ra}/1-cho.jpg`);
  const kt = (tag) => t.ev(`(() => { const c = document.querySelector('#sanKhauGiang .qz-card'); const vis = (e) => !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
    const fb = c && c.querySelector('.qz-fb'); const chan = document.querySelector('.cd-lop .sk-the-chan.cd-chan'); const chu = chan && chan.querySelector('.sk-chan-chu');
    return { tag: ${JSON.stringify(tag)}, fbHienThi: vis(fb), chanClass: chan && chan.className, chanChuHienThi: vis(chu), chanChu: chu && chu.textContent, nutTiep: !![...document.querySelectorAll('.cd-chan button')].find((b) => /Tiếp tục/.test(b.textContent)),
      giaiThich: (() => { const g = [...document.querySelectorAll('.cd-lop .h-gap')].find((e) => /Giải thích/.test(e.textContent)); return g ? g.textContent.replace(/\\s+/g, ' ').slice(0, 160) : null; })(), dung: !!(c && c.querySelector('.is-correct')), sai: !!(c && c.querySelector('.is-wrong')) }; })()`);
  console.log(JSON.stringify(await kt('truoc')));
  const bam = async (dung) => {
    const r = await t.ev(`(() => { const c = document.querySelector('#sanKhauGiang .qz-card[id^="card-"]'); const id = c.id.replace(/^card-/, ''); const b = __lecture.beats().find((x) => x.kind === 'quiz' && x.data && x.data.id === id); const k = b.data.correctIndex; const i = ${dung ? 'k' : '(k + 1) % 4'}; const nut = document.getElementById('btn-opt-' + id + '-' + i); const r = nut.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    await t.click(r.x, r.y);
  };
  await bam(false); await sleep(2500);
  await t.chup(`${ra}/2-sai.jpg`);
  console.log(JSON.stringify(await kt('sau-sai')));
  await t.bam(`=[...document.querySelectorAll('#sanKhauGiang button')].find(b => /Tiếp tục/.test(b.textContent))`);
  await t.cho(`(__motion.trangThai() || {}).che === 'cho' && __lecture.index() === ${qz + 1}`, 40000, 150);
  await sleep(1800);
  await bam(true); await sleep(2500);
  await t.chup(`${ra}/3-dung.jpg`);
  console.log(JSON.stringify(await kt('sau-dung')));
  console.log('LOI', JSON.stringify(t.loi().filter((x) => !/favicon|env\.js/.test(x.text)).slice(0, 5)));
  await t.dungGiang();
} finally { await ch.dong(); await donDep(); }
