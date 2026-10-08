// chup-mau.mjs — chup khung ban mau (E:/sensei-tam/demo2/h) tai cac giay cho truoc.  node chup-mau.mjs <ra-dir> t1 t2 ...
import { moServer, moChrome, Trang, donDep, sleep } from './cdp-lib.mjs';
import fs from 'node:fs';
import path from 'node:path';
const [ra, ...ts] = process.argv.slice(2);
fs.mkdirSync(ra, { recursive: true });
const goc = await moServer('E:/sensei-tam/demo2');
const ch = await moChrome({ w: 1920, h: 1080 });
try {
  const t = new Trang(ch.cdp, goc);
  await t.batDau(1920, 1080);
  await t.c.send('Page.navigate', { url: `${goc}/h/index.html?render=1` });
  await t.cho('!!(window.__ready)', 30000);
  await t.ev('window.__ready.then(() => true)');
  for (const s of ts) {
    await t.ev(`window.__seek(${+s}); true`);
    await sleep(150);
    await t.chup(path.join(ra, `mau-${String(s).replace('.', '_')}.jpg`));
  }
  console.log('xong', ts.length);
} finally { await ch.dong(); await donDep(); }
