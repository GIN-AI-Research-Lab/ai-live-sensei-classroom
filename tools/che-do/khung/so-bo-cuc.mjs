// so-bo-cuc.mjs — bang do lech bo cuc: ban mau (demo2/h, __seek) vs song (che do h) tai cac khoanh tuong ung.
//   node so-bo-cuc.mjs [--w 1440 --h 900] [--ra file.json]
// Moi vung (vom, treo, gap, dan, bang, hoa, ruy, giay, the-bai) -> hinh chu nhat chuan hoa theo khung (x,y,w,h tinh bang % chieu rong/cao khung);
// ghep theo thu tu (y, x) trong cung loai; lech = max(|dx|,|dy|,|dw|,|dh|) tinh bang % khung. Dat neu <= 10.
import { moServer, moChrome, Trang, donDep, sleep } from './cdp-lib.mjs';
import fs from 'node:fs';
const A = {}; const av = process.argv.slice(2);
for (let i = 0; i < av.length; i += 2) A[av[i].replace(/^--/, '')] = av[i + 1];
const w = +(A.w || 1440), h = +(A.h || 900);
const LOAI = ['vom', 'treo', 'gap', 'dan', 'bang', 'hoa', 'ruy-wrap', 'the-bai'];
// bieu thuc do: tien to '' (ban mau) hoac 'h-' (song); goc = vung khung
const DO = (tt, goc) => `(() => {
  const khung = ${goc};
  const out = {};
  const hien = (e) => { let op = 1, v = e; while (v && v !== document.body) { const cs = getComputedStyle(v); op *= +cs.opacity; if (cs.visibility === 'hidden' || cs.display === 'none') return 0; v = v.parentElement; } return op; };
  ${JSON.stringify(LOAI)}.forEach((loai) => {
    const sel = loai === 'the-bai' ? (${JSON.stringify(tt)} ? '.h-the-bai' : '#the-bai') : ('.' + ${JSON.stringify(tt)} + loai);
    const ds = [];
    document.querySelectorAll(sel).forEach((e) => {
      if (${JSON.stringify(tt)} && !e.closest('.cd-lop')) return;
      if (hien(e) < 0.6) return;
      const r = e.getBoundingClientRect();
      if (r.width < 20 || r.height < 14) return;
      if (r.right < khung.x || r.left > khung.x + khung.w || r.bottom < khung.y || r.top > khung.y + khung.h) return;
      ds.push([ (r.left - khung.x) / khung.w * 100, (r.top - khung.y) / khung.h * 100, r.width / khung.w * 100, r.height / khung.h * 100 ]);
    });
    ds.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    out[loai] = ds.map((q) => q.map((x) => +x.toFixed(1)));
  });
  return out;
})()`;
const KHOANH = [
  { ten: 'tieu-de', t: 4.9, live: { i: 0, title: true } },
  { ten: 'tu-vung', t: 10.4, live: { kind: 'vocab', n: 1 } },
  { ten: 'mau-cau', t: 28.0, live: { kind: 'grammar-intro', n: 0 } },
  { ten: 'vi-du', t: 35.9, live: { kind: 'example', n: 0 } },
  { ten: 'bai-tap', t: 46.9, live: { kind: 'quiz', n: 0 } },
];
const goc = await moServer('E:/sensei-tam/demo2');
const ch = await moChrome({ w: 1920, h: 1080 });
const mau = {};
try {
  const t = new Trang(ch.cdp, goc); await t.batDau(1920, 1080);
  await t.c.send('Page.navigate', { url: `${goc}/h/index.html?render=1` });
  await t.cho('!!(window.__ready)', 30000);
  await t.ev('window.__ready.then(() => true)');
  for (const k of KHOANH) { await t.ev(`window.__seek(${k.t}); true`); await sleep(200); mau[k.ten] = await t.ev(DO('', '{x:0,y:0,w:1920,h:1080}')); }
} finally { await ch.dong(); }
const goc2 = await moServer();
const ch2 = await moChrome({ w, h });
const song = {};
try {
  const t = new Trang(ch2.cdp, goc2); await t.batDau(w, h);
  await t.moApp({ them: '&phongCach=h', bai: ['N5', 1] });
  const kinds = await t.ev(`__lecture.beats().map((b) => b.kind)`);
  for (const k of KHOANH) {
    let i = k.live.title ? 0 : kinds.map((x, j) => (x === k.live.kind ? j : -1)).filter((j) => j >= 0)[k.live.n || 0];
    await t.ev(`__moPhong.datDen(${i + 1})`);
    if (k.live.title) await t.bam('#autoLectureBtn'); else await t.ev(`__lecture.startFrom(${i}).then(() => true)`);
    await t.cho(`(() => { const m = window.__cdH && __cdH.m(); return !!(m); })()`, 8000, 80);
    await sleep(k.live.title ? 2500 : 1500);
    if (!k.live.title) { await t.ev(`__cdH.het(); gsap.globalTimeline.timeScale(40); true`); await sleep(1200); await t.ev(`gsap.globalTimeline.timeScale(1); true`); await sleep(150); }
    const f = await t.ev(`(() => { const l = document.querySelector('.cd-lop').getBoundingClientRect(); return { x: l.left, y: l.top, w: l.width, h: l.height }; })()`);
    song[k.ten] = await t.ev(DO('h-', JSON.stringify(f)));
    await t.dungGiang();
  }
} finally { await ch2.dong(); await donDep(); }
const hang = []; let dat = 0, tong = 0;
for (const k of KHOANH) for (const loai of LOAI) {
  const a = mau[k.ten][loai] || [], b = song[k.ten][loai] || [];
  const n = Math.max(a.length, b.length);
  for (let j = 0; j < n; j++) {
    const p = a[j], q = b[j];
    if (!p || !q) { hang.push({ khoanh: k.ten, loai, j, mau: p || null, song: q || null, lech: null, ghiChu: p ? 'chi co o ban mau' : 'chi co o ban song' }); continue; }
    const lech = Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1]), Math.abs(p[2] - q[2]), Math.abs(p[3] - q[3]));
    tong++; if (lech <= 10) dat++;
    hang.push({ khoanh: k.ten, loai, j, mau: p, song: q, lech: +lech.toFixed(1) });
  }
}
const ra = { w, h, tong, dat, hang };
if (A.ra) fs.writeFileSync(A.ra, JSON.stringify(ra, null, 1));
console.log(`ghep duoc ${tong} vung, lech <= 10 %: ${dat}`);
hang.forEach((r) => console.log(`${r.khoanh.padEnd(8)} ${r.loai.padEnd(8)} #${r.j} mau=${r.mau ? r.mau.join(',') : '-'} song=${r.song ? r.song.join(',') : '-'} lech=${r.lech == null ? r.ghiChu : r.lech}`));
