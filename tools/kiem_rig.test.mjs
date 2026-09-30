// Kiem rig khuon mat (assets/minh-hoa/nv/rig.json) so voi bo anh that:
//   node tools/kiem_rig.test.mjs
// - rig phu DU: 28 chan dung nv-<id>.webp + moi anh trong chi-muc.json (28 nhan vat x 8 tep)
// - moi ban ghi co mieng (x y w rot curve wGoc hop le), hai mat, mau da / net hex, co `blink` (bool)
// - mieng cua anh bieu cam khop neo trung tinh (binh_thuong.webp) trong 0.03 (toa do chuan hoa)
// - moi cau thoai cua giao trinh co avatarUrl == anh cua nhan vat (kiem ky hon o tools/kiem_nhan_vat.py)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const doc = (p) => JSON.parse(fs.readFileSync(path.join(GOC, p), 'utf8'));
const bang = [];
const kt = (ten, ok, ct = '') => bang.push({ ten, ok: !!ok, ct: String(ct) });

const rig = doc('assets/minh-hoa/nv/rig.json');
const chiMuc = doc('assets/minh-hoa/nv/chi-muc.json');
const nhanVat = doc('curriculum/nhan-vat.json').nhanVat;
const hex = /^#[0-9a-f]{6}$/i;
const hopLe = (k) => k && k.mouth && ['x', 'y', 'w', 'rot', 'curve'].every(f => Number.isFinite(k.mouth[f])) && Number.isFinite(k.mouth.wGoc)
  && k.mouth.x > 0.3 && k.mouth.x < 0.7 && k.mouth.y > 0.3 && k.mouth.y < 0.7 && k.mouth.w > 0.02 && k.mouth.w < 0.3
  && Array.isArray(k.eyes) && k.eyes.length === 2 && k.eyes.every(e => e.x > 0.2 && e.x < 0.8 && e.r > 0.003 && e.r < 0.05)
  && hex.test(k.skin || '') && hex.test(k.line || '') && typeof k.blink === 'boolean';

const thieu = [], hong = [], lech = [];
let nAnh = 0, nBieuCam = 0, nBlinkIdle = 0, nNeo = 0;
for (const n of nhanVat) {
  const goc = 'assets/minh-hoa/nv-' + (n.id === 'giao-vien' ? 'sensei' : n.id) + '.webp';
  if (n.anh !== goc) thieu.push('anh != ' + goc + ' (' + n.id + ')');
  const ds = [goc, ...Object.values(chiMuc[n.id] || {})];
  if (Object.keys(chiMuc[n.id] || {}).length !== 8) thieu.push(n.id + ': chi-muc khong du 8 anh');
  const neo = rig['assets/minh-hoa/nv/' + n.id + '/binh_thuong.webp'];
  for (const p of ds) {
    nAnh++;
    if (!fs.existsSync(path.join(GOC, p))) { thieu.push('khong co tep ' + p); continue; }
    const k = rig[p];
    if (!k) { thieu.push('rig thieu ' + p); continue; }
    if (!hopLe(k)) { hong.push(p); continue; }
    if (p.includes('/nv/')) {
      nBieuCam++;
      if (neo && p !== 'assets/minh-hoa/nv/' + n.id + '/binh_thuong.webp') {
        const dx = Math.abs(k.mouth.x - neo.mouth.x), dy = Math.abs(k.mouth.y - neo.mouth.y);
        if (dx > 0.03 || dy > 0.03) lech.push(p + ' (' + dx.toFixed(3) + ',' + dy.toFixed(3) + ')');
      }
    }
  }
  if (neo && neo.blink) nBlinkIdle++;
  if (neo) nNeo++;
}
kt(`rig phu du ${nAnh} anh (28 chan dung + ${nBieuCam} anh bieu cam)`, thieu.length === 0 && nBieuCam === 224, thieu.slice(0, 5).join('; '));
kt('moi ban ghi hop le (mieng, mat, mau, blink)', hong.length === 0, hong.slice(0, 5).join('; '));
kt('mieng anh bieu cam khop neo trung tinh <= 0.03', lech.length === 0, lech.slice(0, 5).join('; '));
kt(`28 neo trung tinh; ${nBlinkIdle} neo co chop mat don gian`, nNeo === 28 && nBlinkIdle >= 20, nNeo + ' / ' + nBlinkIdle);
kt('khong anh nao nhan chop mat khi mat co diem sang (ngac_nhien / hao_hung cua 28 nhan vat)',
  nhanVat.every(n => ['ngac_nhien', 'hao_hung'].every(e => rig['assets/minh-hoa/nv/' + n.id + '/' + e + '.webp'].blink === false)), '');

// ---- avatarUrl cua moi cau thoai
const theoAnh = new Map(nhanVat.map(n => [n.id, n.anh]));
const chuan = (s) => { let t = String(s ?? '').normalize('NFKC'); const tn = (t.match(/\(([^)]*)\)/) || [])[1] || ''; t = t.replace(/\([^)]*\)/g, '').replace(/[\s　]+/g, '').toLowerCase(); if (!t && tn) t = tn.replace(/[\s　]+/g, '').toLowerCase(); return t; };
const alias = new Map();
for (const n of nhanVat) for (const a of [n.ten_ja, n.ten, ...(n.biDanh || [])]) { const k = chuan(a); if (k && !alias.has(k)) alias.set(k, n.id); }
const HAU = /(さん|くん|ちゃん|君|様|さま|氏|先生)$/;
const tra = (sp) => { const k = chuan(sp); if (alias.has(k)) return alias.get(k); let t = k; for (let i = 0; i < 2; i++) { const m = t.match(HAU); if (!m || t.length <= m[0].length) break; t = t.slice(0, -m[0].length); if (alias.has(t)) return alias.get(t); } return null; };
let nDong = 0; const sai = [];
for (const lv of ['kana', 'n5', 'n4', 'n3', 'n2', 'n1']) {
  const dir = path.join(GOC, 'curriculum', lv);
  for (const f of fs.readdirSync(dir).filter(x => /^\d+\.json$/.test(x))) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    for (const l of j.dialogue || []) {
      nDong++;
      const id = tra(l.speaker);
      if (!id || l.avatarUrl !== theoAnh.get(id)) sai.push(lv + '/' + f + ' ' + l.speaker + ' -> ' + l.avatarUrl);
    }
  }
}
kt(`${nDong} cau thoai deu co avatarUrl == anh cua nhan vat`, nDong > 1000 && sai.length === 0, sai.slice(0, 5).join('; '));

let loi = 0;
for (const b of bang) { console.log((b.ok ? 'DAT  ' : 'HONG ') + ' ' + b.ten + (b.ok || !b.ct ? '' : '  <-- ' + b.ct)); if (!b.ok) loi++; }
console.log(`\n${bang.length - loi}/${bang.length} dat`);
process.exit(loi ? 1 : 0);
