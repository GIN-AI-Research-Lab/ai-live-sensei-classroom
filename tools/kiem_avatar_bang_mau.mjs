// Bang mau kiem tra avatar: ve TINH bang dung duong ve that (SenseiAvatarNoi.veTinh) trong Chrome headless.
//   node tools/kiem_avatar_bang_mau.mjs [--ra E:/sensei-tam/tmp/avn2/bang] [--id gupta,karina] [--rong 256] [--phong 3.2]
// Moi nhan vat ra 2 tep:
//   <id>-256.png   7 bieu cam (cot) x 3 hang (kin = nghi, 'a' = mo to, 'o' = tron) o 256 px, ca dau
//   <id>-zoom.png  7 bieu cam (hang) x 8 cot (anh goc khong phu, kin, a, e, i, u, o, o2), cat quanh mieng, phong to
// Dung de NHIN bang mat: net mieng goc con sot, mieng lech cho, quang mau da, mieng ra ngoai mat (rau, khan).
import fs from 'node:fs';
import path from 'node:path';
import { moTrinhDuyet } from './_kiem_chrome.mjs';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const RA = arg('--ra', 'E:/sensei-tam/tmp/avn2/bang');
const RONG = Number(arg('--rong', '256'));
const PHONG = Number(arg('--phong', '3.2'));
const CHON = arg('--id', '');
const EMO = ['binh_thuong', 'vui', 'hoi', 'gian', 'ngac_nhien', 'hao_hung', 'buon'];
fs.mkdirSync(RA, { recursive: true });

const t = await moTrinhDuyet({ duong: '/index.html?noLive&moPhong', w: 1280, h: 800, dpr: 1 });
try {
  await t.cho('!!window.SenseiAvatarNoi && !!SenseiAvatarNoi.veTinh', 30000);
  await t.ev('SenseiAvatarNoi.napRig().then(() => 1)');
  const ds = JSON.parse(await t.ev(`fetch('curriculum/nhan-vat.json').then(r => r.json()).then(j => JSON.stringify(j.nhanVat.map(n => ({ id: n.id, anh: n.anh }))))`));
  for (const nv of ds) {
    if (CHON && !CHON.split(',').includes(nv.id)) continue;
    const thuMuc = nv.id;
    // ---- bang 256 px
    const b1 = await t.ev(`(async () => {
      const EMO = ${JSON.stringify(EMO)}, W = ${RONG}, HANG = [['kin', 0], ['a', 1], ['o', 1]];
      const big = document.createElement('canvas'); big.width = W * EMO.length; big.height = W * HANG.length; const g = big.getContext('2d');
      for (let c = 0; c < EMO.length; c++) for (let r = 0; r < HANG.length; r++) {
        const cv = document.createElement('canvas'); cv.width = W; cv.height = W;
        await SenseiAvatarNoi.veTinh(cv, 'assets/minh-hoa/nv/${thuMuc}/' + EMO[c] + '.webp', { a: HANG[r][0], mo: HANG[r][1], emo: EMO[c], cuongDo: 1, fit: 'contain' });
        g.drawImage(cv, c * W, r * W);
        g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(c * W, r * W, 120, 12); g.fillStyle = '#c00'; g.font = '10px sans-serif'; g.fillText(EMO[c] + ' ' + HANG[r][0], c * W + 2, r * W + 10);
      }
      return big.toDataURL('image/png');
    })()`);
    fs.writeFileSync(path.join(RA, nv.id + '-256.png'), Buffer.from(b1.split(',')[1], 'base64'));
    // ---- bang zoom quanh mieng
    const b2 = await t.ev(`(async () => {
      const EMO = ${JSON.stringify(EMO)}, CW = 192, CH = 128, Z = ${PHONG}, COT = ['goc', 'kin', 'a', 'e', 'i', 'u', 'o', 'o2'];
      const rig = SenseiAvatarNoi._rig();
      const big = document.createElement('canvas'); big.width = CW * COT.length; big.height = CH * EMO.length; const g = big.getContext('2d');
      for (let r = 0; r < EMO.length; r++) {
        const p = 'assets/minh-hoa/nv/${thuMuc}/' + EMO[r] + '.webp', rg = rig[p], m = rg.mouth, S = 512;
        for (let c = 0; c < COT.length; c++) {
          const cv = document.createElement('canvas'); cv.width = S; cv.height = S;
          if (COT[c] === 'goc') { await SenseiAvatarNoi.veTinh(cv, p, { a: 'kin', mo: 0, emo: EMO[r], fit: 'contain', khongPhu: true }); }
          else await SenseiAvatarNoi.veTinh(cv, p, { a: COT[c], mo: COT[c] === 'kin' ? 0 : 1, emo: EMO[r], cuongDo: 1, fit: 'contain' });
          const sw = CW / Z, sh = CH / Z;
          g.imageSmoothingEnabled = true;
          g.drawImage(cv, m.x * S - sw / 2, m.y * S - sh / 2, sw, sh, c * CW, r * CH, CW, CH);
          g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(c * CW, r * CH, 96, 11); g.fillStyle = '#c00'; g.font = '10px sans-serif'; g.fillText(EMO[r] + ' ' + COT[c], c * CW + 2, r * CH + 9);
        }
      }
      return big.toDataURL('image/png');
    })()`);
    fs.writeFileSync(path.join(RA, nv.id + '-zoom.png'), Buffer.from(b2.split(',')[1], 'base64'));
    console.log('xong', nv.id);
  }
  const loi = t.loi();
  if (loi.length) console.log('LOI TRANG:', loi.slice(0, 5));
} finally {
  await t.dong();
}
