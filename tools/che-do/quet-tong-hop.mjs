// quet-tong-hop.mjs — TONG HOP cac tep ket qua cua quet-bai.mjs (quet-<k>-<man>.json) thanh MOT bao cao Markdown.
//
//   node tools/che-do/quet-tong-hop.mjs [--vao DIR | tep.json ...] [--ra FILE] [--top 12]
//     --vao DIR  doc moi quet-*.json trong DIR (mac dinh E:/sensei-tam/tmp/quet; bo tep -t*/thu)
//     --ra FILE  mac dinh <DIR>/TONG-HOP.md
//     --top N    so nhom van de moi che do (mac dinh 12)
// Moi che do: tong FAIL / WARN theo loai va man hinh, N nhom (loai, phan tu, dang nhip) xau nhat (FAIL truoc, roi so lan), moi nhom:
// so lan, so bai, man hinh, vi du (bai#nhip cach-chon @man hinh), mot dong NGUYEN NHAN CO THE (suy tu so do: hop cat, canh, vat che...);
// cuoi cung: diem khong do duoc (het gio / thieu canh) va loi console.
import fs from 'node:fs';
import path from 'node:path';

const av = process.argv.slice(2);
let vao = 'E:/sensei-tam/tmp/quet', ra = null, top = 12;
const tep = [];
for (let i = 0; i < av.length; i++) {
  if (av[i] === '--vao') vao = av[++i];
  else if (av[i] === '--ra') ra = av[++i];
  else if (av[i] === '--top') top = +av[++i] || 12;
  else tep.push(av[i]);
}
const ds = tep.length ? tep : fs.readdirSync(vao).filter((f) => /^quet-[a-z]-(1440|390|ca)\.json$/.test(f)).map((f) => path.join(vao, f));
if (!ds.length) { console.error('khong co tep quet-*.json'); process.exit(2); }
ra = ra || path.join(tep.length ? path.dirname(tep[0]) : vao, 'TONG-HOP.md');

const ORD = { FAIL: 0, WARN: 1, INFO: 2 };
const KQ = ds.map((f) => ({ f, j: JSON.parse(fs.readFileSync(f, 'utf8')) }));
// Cung quy tac haChuBiChe() cua quet-bai.mjs (ap lai cho JSON cu): chu bi lop mo duc che >= 67 % (OCCLUDED) tai mot diem do
// -> cac van de khac cua chinh no o diem do (chong chu, cat, nho...) khong nhin thay -> INFO
for (const { j } of KQ) {
  const che = new Map();
  for (const x of j.vanDe) if (x.loai === 'OCCLUDED' && x.so && x.so.f >= 0.67) { const k = `${x.man}|${x.bai}|${x.i}|${x.chon}`; if (!che.has(k)) che.set(k, new Set()); che.get(k).add(x.path); }
  for (const x of j.vanDe) {
    if (x.loai === 'OCCLUDED' || x.sev === 'INFO') continue;
    const s = che.get(`${x.man}|${x.bai}|${x.i}|${x.chon}`);
    if (s && String(x.path || '').split(' + ').some((p) => s.has(p))) { x.sev = 'INFO'; x.mo = '[hidden under an opaque layer] ' + x.mo; }
  }
}
const theoChe = new Map();
for (const { f, j } of KQ) { if (!theoChe.has(j.che)) theoChe.set(j.che, []); theoChe.get(j.che).push({ f, j }); }

const phut = (s) => `${Math.floor(s / 3600)}h${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`;
const dem = (a, kf) => { const m = new Map(); a.forEach((x) => { const k = kf(x); if (k == null) return; m.set(k, (m.get(k) || 0) + 1); }); return [...m.entries()].sort((x, y) => y[1] - x[1]); };
const nhieuNhat = (a, kf, n = 2) => dem(a, kf).slice(0, n).map(([k, c]) => `${k} (${c})`).join(', ');

/** Mot dong nguyen nhan co the, suy tu so do cua cac van de trong nhom */
function nguyenNhan(g) {
  const v = g.tat;
  const so = (k) => v.map((x) => x.so && x.so[k]).filter((x) => x != null);
  const tb = (a) => (a.length ? Math.round(a.reduce((p, q) => p + q, 0) / a.length * 10) / 10 : 0);
  switch (g.loai) {
    case 'CLIPPED': case 'CLIPPED-ELLIPSIS': {
      const bo = nhieuNhat(v, (x) => x.so && x.so.bo, 1), canh = nhieuNhat(v, (x) => x.so && x.so.side, 1);
      const tran = v.filter((x) => x.so && x.so.sh != null && x.so.ch != null && x.so.sh > x.so.ch + 2).length;
      return `text taller/wider than its overflow-hidden box ${bo} — cut at ${canh}, avg ${tb(so('cut'))}px${tran ? `; ${tran}x scrollHeight > clientHeight (content does not fit, the fit/size step undershoots)` : ''}`;
    }
    case 'ON-CAT': return `block extends into the cat's bottom-right rectangle (api.meo()) — avg overlap ${tb(so('ix'))}x${tb(so('iy'))}px, ${Math.round(tb(so('f')) * 100)}% of the line; layout does not reserve the cat corner for this beat`;
    case 'UNDER-DECOR': return `content placed below the front decor line (${nhieuNhat(v, (x) => x.so && x.so.vung, 1)}, from layer y≈${tb(so('zt'))}) — avg ${tb(so('iy'))}px under it; the block's bottom is not clamped above the grass`;
    case 'TEXT-OVERLAP': return `two absolutely-placed text blocks share space (avg ${Math.round(tb(so('f')) * 100)}% of the smaller); partner: ${nhieuNhat(v, (x) => x.so && x.so.b, 2)}`;
    case 'SMALL-TYPE': return `computed font ${tb(so('fs'))}px (css ${tb(so('fs0'))}px${tb(so('sc')) !== 1 ? ` x scale ${tb(so('sc'))}` : ''}) below the ${tb(so('min'))}px minimum — a fit()/clamp() step shrinks it for long content`;
    case 'HIDDEN-TEXT': return 'text with opacity > 0 fully clipped inside the stage (parked in an overflow-hidden box / never revealed)';
    case 'ORPHAN': return `the box wraps so the last line holds only ${nhieuNhat(v, (x) => x.so && x.so.cuoi && '"' + x.so.cuoi + '"', 3)} (last line ≈${tb(so('wCuoi'))}px of ${tb(so('wMax'))}px) — width/font chosen without balancing lines (text-wrap: balance / pretty, or shrink one step)`;
    case 'WORD-SPLIT': return `a word/token breaks across lines (${nhieuNhat(v, (x) => x.so && x.so.dang, 2)}), e.g. ${nhieuNhat(v, (x) => x.so && x.so.phan && '"' + x.so.phan + '"', 2)} — token box narrower than the word (or overflow-wrap:anywhere); use word-break: keep-all / nowrap per token and shrink the font instead`;
    case 'EDGE': return `ink ${tb(so('gap'))}px from the ${nhieuNhat(v, (x) => x.so && x.so.canh, 1)} edge of ${nhieuNhat(v, (x) => x.so && x.so.the, 1)} — padding eaten by a font size fitted to the full box width/height`;
    case 'OVERFLOW-BOX': return `text sticks out of its visible card ${nhieuNhat(v, (x) => x.so && x.so.the, 1)} by avg ${tb(so('ra'))}px at ${nhieuNhat(v, (x) => x.so && x.so.canh, 2)} (no clipping) — fitted font/width larger than the card`;
    case 'OCCLUDED': return `painted over by ${nhieuNhat(v, (x) => x.so && x.so.vat, 2)}${v.some((x) => x.so && x.so.vatTrangTri) ? ' (decor layer)' : ''} — stacking order / overlapping regions`;
    case 'CLIP-PATH': return `text outside the visible shape of ${nhieuNhat(v, (x) => x.so && (x.so.boi || 'clip-path/mask'), 1)} — slanted/rounded clip cuts it`;
    default: return '';
  }
}

const L = [];
L.push('# Tong hop quet bo cuc — moi bai, che do h / a / j', '');
L.push(`Generated ${new Date().toISOString()} from ${KQ.length} result files (${ds.map((f) => path.basename(f)).join(', ')}). Tool: tools/che-do/quet-bai.mjs (measurements = doTrang() of tools/che-do/do-bo-cuc.mjs + doThem() of tools/che-do/quet-trang.mjs).`, '');
L.push('Counts are issue INSTANCES (one element at one measured point; every point is measured twice 0.6 s apart and only issues present in both are kept). A "group" = same type + element class + beat kind. INFO items (intentional ellipsis, cuts <= 3 px, do-bo-cuc baseline, offstage scenes, back faces / collapsed flip elements, issues of text that is itself >= 67% hidden under an opaque layer) are not counted.', '');
// tong quat
L.push('## Overview', '');
L.push('| mode | screen | lessons | points measured | not measured | FAIL | WARN | run time | finished |', '|---|---|---:|---:|---:|---:|---:|---:|---|');
for (const [che, ks] of [...theoChe.entries()].sort()) {
  for (const { j } of ks.sort((a, b) => String(b.j.tuy.man).localeCompare(String(a.j.tuy.man)))) {
    const diem = j.bai.flatMap((b) => b.diem);
    const t = j.vanDe.filter((x) => x.sev !== 'INFO');
    L.push(`| ${che} | ${j.tuy.man.join('+')} | ${new Set(j.bai.map((b) => b.bai)).size} | ${diem.filter((d) => d.ok).length} | ${diem.filter((d) => !d.ok).length} | ${t.filter((x) => x.sev === 'FAIL').length} | ${t.filter((x) => x.sev === 'WARN').length} | ${phut(j.giay || 0)} | ${j.xong ? j.xong.slice(0, 16).replace('T', ' ') : 'RUNNING'} |`);
  }
}
L.push('');
for (const [che, ks] of [...theoChe.entries()].sort()) {
  const vd = ks.flatMap(({ j }) => j.vanDe).filter((x) => x.sev !== 'INFO');
  const bai = ks.flatMap(({ j }) => j.bai);
  L.push(`## Mode ${che}`, '');
  // theo loai x man hinh
  const loai = [...new Set(vd.map((x) => x.loai))];
  const mans = [...new Set(vd.map((x) => x.man))].sort((a, b) => b - a);
  const tk = (x, l, m, s) => x.filter((v) => v.loai === l && v.man === m && v.sev === s).length;
  L.push(`| type | ${mans.map((m) => `${m} FAIL | ${m} WARN`).join(' | ')} | lessons |`, `|---|${mans.map(() => '---:|---:').join('|')}|---:|`);
  loai.map((l) => ({ l, F: vd.filter((v) => v.loai === l && v.sev === 'FAIL').length, n: vd.filter((v) => v.loai === l).length }))
    .sort((a, b) => b.F - a.F || b.n - a.n)
    .forEach(({ l }) => L.push(`| ${l} | ${mans.map((m) => `${tk(vd, l, m, 'FAIL')} | ${tk(vd, l, m, 'WARN')}`).join(' | ')} | ${new Set(vd.filter((v) => v.loai === l).map((v) => v.bai)).size} |`));
  L.push('');
  // nhom
  const g = new Map();
  for (const x of vd) {
    const k = `${x.loai}|${x.el}|${x.kind}`;
    let e = g.get(k);
    if (!e) { e = { loai: x.loai, el: x.el, kind: x.kind, F: 0, W: 0, bai: new Set(), man: new Set(), tat: [] }; g.set(k, e); }
    if (x.sev === 'FAIL') e.F++; else e.W++;
    e.bai.add(x.bai); e.man.add(x.man); e.tat.push(x);
  }
  const G = [...g.values()].map((e) => Object.assign(e, { sev: e.F ? 'FAIL' : 'WARN', n: e.F + e.W }));
  G.sort((a, b) => (ORD[a.sev] - ORD[b.sev]) || (b.F - a.F) || (b.n - a.n));
  L.push(`### Top ${Math.min(top, G.length)} of ${G.length} issue groups (FAIL first)`, '');
  G.slice(0, top).forEach((e, k) => {
    const v = e.tat.slice().sort((a, b) => (ORD[a.sev] - ORD[b.sev]) || b.score - a.score);
    const vdu = v.slice(0, 2).map((x) => `${x.bai}#${x.i} ${x.chon} @${x.man}: ${String(x.mo).slice(0, 170)}${x.anh ? ` [${x.anh}]` : ''}`);
    const baiDs = [...e.bai];
    L.push(`${k + 1}. **[${e.sev}] ${e.loai}** — \`${e.el}\` in **${e.kind}** beats: ${e.F ? e.F + ' FAIL / ' : ''}${e.W} WARN in ${e.bai.size} lessons (${[...e.man].sort((a, b) => b - a).join(' + ')})${baiDs.length <= 6 ? ': ' + baiDs.join(', ') : ', e.g. ' + baiDs.slice(0, 6).join(', ') + ' …'}`);
    L.push(`   - worst: ${vdu[0]}`);
    if (vdu[1]) L.push(`   - also: ${vdu[1]}`);
    L.push(`   - likely cause: ${nguyenNhan(e)}`);
  });
  L.push('');
  // khong do duoc
  const hong = bai.flatMap((b) => b.diem.filter((d) => !d.ok).map((d) => Object.assign({ bai: b.bai, man: b.man }, d)));
  const baiHong = bai.filter((b) => b.hong);
  if (hong.length || baiHong.length) {
    L.push(`### Not measured (${hong.length} points${baiHong.length ? `, ${baiHong.length} whole lesson runs` : ''})`, '');
    baiHong.forEach((b) => L.push(`- lesson ${b.bai}@${b.man}: ${b.hong}`));
    const m = new Map();
    hong.forEach((d) => { const k = `${d.kind} (${String(d.nhan).split(':')[0].replace(/^(dai|ngan)(-\d+)?(\+.*)?$/, 'beat').replace(/^the-chuong.*/, 'chapter card')}${String(d.nhan).includes(':') && !String(d.nhan).startsWith('the-') ? ':' + String(d.nhan).split(':')[1] : ''}): ${d.lyDo}`; if (!m.has(k)) m.set(k, []); m.get(k).push(`${d.bai}#${d.i}@${d.man}`); });
    [...m.entries()].sort((a, b) => b[1].length - a[1].length).forEach(([k, a]) => L.push(`- ${a.length}x ${k} — ${a.slice(0, 8).join(', ')}${a.length > 8 ? ', …' : ''}`));
    L.push('');
  }
  const loi = bai.filter((b) => b.loi && b.loi.length);
  if (loi.length) {
    L.push(`### Console errors during the sweep (${loi.length} lesson runs)`, '');
    dem(loi.flatMap((b) => b.loi.map((x) => x.replace(/\d+/g, 'N').slice(0, 160))), (x) => x).slice(0, 6).forEach(([k, c]) => L.push(`- ${c}x ${k}`));
    L.push('');
  }
  // phien ban tep da do: moi lan chay (START trong tep .log) = mot doan bai do tren ma nap luc do; hash cua tep che do o lan nap dau doan
  for (const { f, j } of ks) {
    const log = f.replace(/\.json$/i, '.log');
    if (!fs.existsSync(log)) continue;
    const st = [];
    for (const l of fs.readFileSync(log, 'utf8').split('\n')) {
      const m = /^\[(\d\d:\d\d:\d\d) [^\]]*\] START /.exec(l);
      if (!m) continue;
      const r = /resume \((\d+) done\)/.exec(l);
      const tu = r ? +r[1] : 0;
      if (st.length && st[st.length - 1].tu === tu) st[st.length - 1].luc = m[1];   // lan chay khong tien them bai nao: lay lan sau
      else st.push({ tu, luc: m[1] });
    }
    if (st.length < 2) continue;
    const loads = Object.entries(j.phienBan || {}).map(([k, v]) => ({ t: k.split('@')[1], v })).sort((a, b) => a.t.localeCompare(b.t));
    const tenTep = `js/che-do/${che}.js`;
    L.push(`Note (${path.basename(f)}): the sweep was resumed ${st.length - 1}x (disk full / hung page; --tiep reloads the page, so later lessons were measured on newer code) — ` + st.map((d, k) => {
      const den = k + 1 < st.length ? st[k + 1].tu : j.bai.length;
      const ld = loads.find((x) => x.t.slice(11, 19) >= d.luc) || null;
      return `lesson runs ${d.tu + 1}-${den}: code loaded ${d.luc} UTC (${tenTep} ${ld && ld.v[tenTep] ? ld.v[tenTep].split(' ')[0] : '?'})`;
    }).join('; ') + '.', '');
  }
  const pb = ks.flatMap(({ j }) => Object.entries(j.phienBan || {}));
  if (pb.length) {
    L.push('<details><summary>Code versions measured (sha1 + mtime at page load)</summary>', '');
    pb.forEach(([k, v]) => L.push(`- ${k}: ${Object.entries(v).map(([f, h]) => `${f} ${h || '-'}`).join('; ')}`));
    L.push('', '</details>', '');
  }
}
fs.writeFileSync(ra, L.join('\n') + '\n');
console.log('-> ' + ra);
