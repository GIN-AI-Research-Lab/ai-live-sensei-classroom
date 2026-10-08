import { moServer, moChrome, Trang, donDep } from './cdp-lib.mjs';
const goc = await moServer(); const ch = await moChrome();
try {
  const t = new Trang(ch.cdp, goc); await t.batDau();
  for (const [cap, so] of [['N5', 1], ['KANA', 1]]) {
    await t.moApp({ bai: [cap, so] });
    const r = await t.ev(`(() => { const bs = __lecture.beats(); const dem = {}; bs.forEach(b => dem[b.kind] = (dem[b.kind]||0)+1);
      const mau = {}; bs.forEach((b,i) => { if (!mau[b.kind]) mau[b.kind] = { i, keys: Object.keys(b), chapter: b.chapter, label: b.label, subIndex: b.subIndex, targetId: b.targetId, isChapterStart: b.isChapterStart,
        data: Array.isArray(b.data) ? ('mang ' + b.data.length + ' ' + JSON.stringify(b.data[0]).slice(0,300)) : JSON.stringify(b.data).slice(0, 500) }; });
      return { n: bs.length, dem, mau }; })()`);
    console.log(cap, so, JSON.stringify(r, null, 1));
  }
} finally { await ch.dong(); await donDep(); }
