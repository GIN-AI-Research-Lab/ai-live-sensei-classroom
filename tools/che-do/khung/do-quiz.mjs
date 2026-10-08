import { moServer, moChrome, Trang, donDep, sleep } from './cdp-lib.mjs';
const goc = await moServer(); const ch = await moChrome();
try {
  const t = new Trang(ch.cdp, goc); await t.batDau();
  await t.moApp({ them: '&phongCach=a', bai: ['N5', 1] });
  const qz = await t.ev(`__lecture.beats().findIndex(b => b.kind === 'quiz')`);
  await t.ev(`__moPhong.datDen(${qz + 1})`); await t.ev(`__lecture.startFrom(${qz}).then(() => true)`);
  await t.cho(`(__motion.trangThai() || {}).che === 'cho'`, 40000, 150); await sleep(1500);
  const r = await t.ev(`(() => { const c = document.querySelector('#sanKhauGiang .qz-card[id^="card-"]'); const id = c.id.replace('card-',''); const b = document.getElementById('btn-opt-' + id + '-0'); const q = b.getBoundingClientRect();
    const e = document.elementFromPoint(q.left + q.width/2, q.top + q.height/2);
    const pe = []; for (let n = b; n; n = n.parentElement) pe.push((n.className && n.className.baseVal === undefined ? n.className : n.tagName) + ':' + getComputedStyle(n).pointerEvents);
    return { rect: [q.left, q.top, q.width, q.height], hit: e && (e.className || e.tagName), hitInCard: c.contains(e), pe: pe.slice(0, 9), disabled: b.disabled, onclick: b.getAttribute('onclick') }; })()`);
  console.log(JSON.stringify(r, null, 1));
} finally { await ch.dong(); await donDep(); }
