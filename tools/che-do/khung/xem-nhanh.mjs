// xem-nhanh.mjs <them> <file-prefix> [cap so] [nhip] : chup san khau o nhip (1440x900 + 390x844)
import { moServer, moChrome, Trang, donDep, sleep } from './cdp-lib.mjs';
const [them = '', pre = 'xem', cap = 'N5', so = '1', nhipS = '1', choS = '3500'] = process.argv.slice(2);
const goc = await moServer();
const ch = await moChrome();
try {
  const t = new Trang(ch.cdp, goc); await t.batDau();
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    await t.coManHinh(w, h);
    await t.moApp({ them, bai: [cap, Number(so)] });
    await t.ev(`__moPhong.datDen(${Number(nhipS) + 1})`);
    await t.ev(`__lecture.startFrom(${nhipS}).then(() => true)`);
    await sleep(Number(choS));
    await t.chup(`${pre}-${w}.png`);
    const info = await t.ev(`(() => { const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
      return { san: r('#sanKhauGiang'), top: r('.deck-top, header'), bottom: r('.deck-bottom'), meo: r('#senseiAvatar, .sensei-avatar, [class*=sensei-hub], #senseiHub'), tt: __motion.trangThai().kind }; })()`);
    console.log(w, JSON.stringify(info));
    await t.dungGiang();
  }
  console.log('loi', JSON.stringify(t.loi().slice(0, 5)));
} finally { await ch.dong(); await donDep(); }
