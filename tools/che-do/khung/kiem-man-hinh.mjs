// kiem-man-hinh.mjs — kiem tra bo cuc che do h tren nhieu kich thuoc: chong (cat / de / meo) + khoang trong + anh.
//   node kiem-man-hinh.mjs [--bai N5-1] [--man 360x740,390x844,...] [--nhip vocab,kanji,...] [--ra DIR] [--phongcach h]
// Bien the san khau: --phongcach <h|s|mac-dinh> hoac bien moi truong PHONG_CACH (mac dinh: h, nhu truoc day).
//   Tham so duoc truyen vao URL mo app la &phongCach=<id> (dung id ma js/che-do/che-do.js nhan: 'h', 's', 'mac-dinh').
//   LUU Y: do-trang.js chi do duoc che do h (class h-*, __cdH) — bien the khac chi CHUP ANH + gom loi console,
//   khong co so van/trong; dung de soi truc quan bo cuc mac-dinh / bang den, khong so sanh nguong voi ban h.
// Moi (man hinh, dang nhip): startFrom -> het() -> tua nhanh GSAP -> do:
//   van  : chu bi cat / ra khung / de len meo / hai khoi chu de len nhau (> 20 % cai nho hon)
//   trong: luoi 24x16 tren .cd-lop; mot o "co noi dung" neu chua phan tu noi dung nhin thay (khong tinh lop nen); % o trong + hinh chu nhat trong lien tuc lon nhat (% khung)
// Dat: khong van, trong <= 28 % o, hinh chu nhat trong lon nhat <= 22 % khung (nguong ghi trong bao cao).
import { moServer, moChrome, Trang, donDep, sleep } from './cdp-lib.mjs';
import fs from 'node:fs';
import path from 'node:path';
const A = {}; const av = process.argv.slice(2);
for (let i = 0; i < av.length; i += 2) A[av[i].replace(/^--/, '')] = av[i + 1];
const [cap, so] = (A.bai || 'N5-1').split('-');
// Bien the san khau (P2): CLI --phongcach thang bien moi truong PHONG_CACH; mac dinh 'h' nhu truoc.
const PC_RAW = String(A.phongcach || process.env.PHONG_CACH || 'h').trim().toLowerCase();
const PC = (PC_RAW === 'macdinh' || PC_RAW === 'default') ? 'mac-dinh' : PC_RAW;
if (!['h', 's', 'mac-dinh'].includes(PC)) { console.error(`phongcach khong hop le: "${PC_RAW}" — chi nhan: h | s | mac-dinh`); process.exit(2); }
const MAN = (A.man || '360x740,390x844,430x932,844x390,1280x720,1366x768,1440x900,1920x1080,1024x768,768x1024,2560x1080,900x1000').split(',').map((s) => s.split('x').map(Number));
const KIND = (A.nhip || 'vocab,kanji,grammar-intro,example,kaiwa-intro,kaiwa-run,quiz').split(',');
const ra = A.ra || (PC === 'h' ? 'chup/man' : `chup/man-${PC}`);
fs.mkdirSync(ra, { recursive: true });
const DO = fs.readFileSync(new URL('./do-trang.js', import.meta.url), 'utf8');
const goc = await moServer();
const KQ = [];
for (const [w, h] of MAN) {
  const ch = await moChrome({ w, h });
  try {
    const t = new Trang(ch.cdp, goc); await t.batDau(w, h);
    await t.moApp({ them: `&phongCach=${PC}`, bai: [cap, +so] });
    const kinds = await t.ev(`__lecture.beats().map((b) => b.kind)`);
    for (const k of KIND) {
      const i = kinds.indexOf(k);
      if (i < 0) continue;
      await t.ev(`__moPhong.datDen(${i + 1})`);
      await t.ev(`__lecture.startFrom(${i}).then(() => true)`);
      const f = path.join(ra, `${w}x${h}-${k}.jpg`);
      if (PC !== 'h') {
        // Bien the mac-dinh / s: khong co __cdH va do-trang.js chi biet class h-* -> chi chup anh de soi truc quan.
        await t.cho(`__lecture.state().lectureState === 'PLAYING'`, 8000, 100);
        await sleep(1500);
        await t.chup(f);
        KQ.push({ man: `${w}x${h}`, nhip: k, phongCach: PC, anh: f, ghiChu: 'do-trang.js chi do che do h — bien the nay chi chup anh, khong do van/trong' });
        console.log(`${w}x${h} ${k} [${PC}]: chi chup anh (do-trang chi danh cho h)`);
        await t.dungGiang();
        continue;
      }
      await t.cho(`(() => { const m = window.__cdH && __cdH.m(); const n = window.__cdH && __cdH.nh(); return !!(m && n && n.i === ${i}); })()`, 8000, 80);
      await sleep(500);
      await t.ev(`__cdH.het(); gsap.globalTimeline.timeScale(40); true`);
      await sleep(900);
      await t.ev(`gsap.globalTimeline.timeScale(1); true`);
      await sleep(150);
      const r = await t.ev(DO);
      await t.chup(f);
      KQ.push({ man: `${w}x${h}`, nhip: k, van: (r.van || []).length, vanChiTiet: (r.van || []).slice(0, 4), trongPhanTram: r.trong, hinhTrong: r.hinhTrong, anh: f });
      console.log(`${w}x${h} ${k}: van=${(r.van || []).length} trong=${r.trong}% hinh=${r.hinhTrong}%`);
      await t.dungGiang();
    }
    const loi = t.loi().filter((x) => !/favicon|env\.js/.test(x.text));
    if (loi.length) KQ.push({ man: `${w}x${h}`, loiConsole: loi.slice(0, 3) });
  } finally { await ch.dong(); }
}
await donDep();
fs.writeFileSync(path.join(ra, 'ket-qua.json'), JSON.stringify(KQ, null, 1));
const xau = KQ.filter((x) => x.van > 0 || x.trongPhanTram > 28 || x.hinhTrong > 22);
console.log('TONG', KQ.length, 'diem do;', xau.length, 'diem vuot nguong');
