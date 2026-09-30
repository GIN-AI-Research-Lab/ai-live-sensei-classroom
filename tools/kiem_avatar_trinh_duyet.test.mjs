// Kiem thu avatar nhan vat trong Chrome headless THAT (khong goi API):
//   node tools/kiem_avatar_trinh_duyet.test.mjs [--thoi-gian]
// - chi avatar cua nguoi noi chuyen dong, cac avatar khac giu nguyen <img>; xong thi khoi phuc
// - meo IM khi nhan vat noi (dong khau-hinh + canvas mieng meo), nhep khi Sensei noi, avatar dung yen
// - bieu cam -> ky hieu truyen tranh ('?' '!' gan giun, sang, mo hoi), dau nghieng khi hoi, tat nghieng/rung khi giam chuyen dong
// - avatar vong 36 px (tab Hoi thoai) va canh san khau deu ve duoc mieng
// - (--thoi-gian) do do lech mo / khep mieng DA VE so voi dap an doc lap (SAPI Haruka + Gemini Charon tieng Nhat), trong Chrome that
import fs from 'node:fs';
import path from 'node:path';
import { moTrinhDuyet, ngu } from './_kiem_chrome.mjs';

const thoiGian = process.argv.includes('--thoi-gian');
const LIP = process.env.SENSEI_LIPSYNC_DIR || 'C:/Users/OS/AppData/Local/Temp/claude/E--ai-live-sensei-classroom/85f3af15-28af-4f9f-8bfc-2fc053ff9125/scratchpad/lipsync/';
const bang = [];
const kt = (nhom, ten, ok, ct = '') => bang.push({ nhom, ten, ok: !!ok, ct: String(ct) });

const TRANG = String.raw`
window.__vowel = function (text, f0b) {
  const SR = 24000, F = { a: [720, 1200], i: [300, 2250], u: [330, 1150], e: [500, 1850], o: [480, 850] }, V = 'aiueo';
  const hira = 'あかさたなはまやらわ|いきしちにひみり|うくすつぬふむゆる|えけせてねへめれ|おこそとのほもよろを'.split('|');
  const seq = []; for (const ch of String(text)) { const k = hira.findIndex(r => r.includes(ch)); if (k >= 0) seq.push(V[k]); else if (/[\u4e00-\u9fff]/.test(ch)) seq.push('a', 'o'); }
  const s = seq.length ? seq.slice(0, 16) : ['a', 'i', 'u', 'e', 'o'];
  const dur = 0.15, n = Math.round((s.length * dur + 0.4) * SR), x = new Float32Array(n);
  s.forEach((v, i) => { const s0 = Math.round((0.12 + i * dur) * SR), len = Math.round(dur * SR), [f1, f2] = F[v];
    for (let j = 0; j < len; j++) { const t = (s0 + j) / SR, env = Math.pow(Math.sin(Math.PI * j / len), 0.6), f0 = f0b * (1 - 0.05 * i / s.length); let w = 0;
      for (let h = 1; h * f0 < 4000; h++) { const f = h * f0; w += (Math.exp(-Math.pow((f - f1) / 110, 2)) + 0.8 * Math.exp(-Math.pow((f - f2) / 160, 2))) / h * Math.sin(2 * Math.PI * f * t); }
      x[s0 + j] = 0.18 * env * w; } });
  const u8 = new Uint8Array(n * 2), dv = new DataView(u8.buffer);
  for (let i = 0; i < n; i++) dv.setInt16(i * 2, Math.max(-1, Math.min(1, x[i])) * 32000, true);
  return u8;
};
window.__s = null;
window.__batDau = () => { window.__s = { act: 0, maxAct: 0, anCuaKhac: 0, tilt: 0, sym: 0, kh: 0, khoa: {}, emo: {}, tim: [] }; };
setInterval(() => {
  const S = window.__s, ae = window.__audioEngine; if (!S || !ae || !ae.outCtx) return;
  const ds = SenseiAvatarNoi._ds(), hoat = ds.filter(a => a.hoat);
  S.act = hoat.length; S.maxAct = Math.max(S.maxAct, hoat.length);
  if (hoat.length) S.anCuaKhac = Math.max(S.anCuaKhac, ds.filter(a => !a.hoat && a.img && a.img.style.visibility === 'hidden').length);
  hoat.forEach(a => { S.tilt = Math.max(S.tilt, Math.abs(a.tilt || 0)); });
  S.sym = Math.max(S.sym, document.querySelectorAll('#avn-tang svg').length);
  const p = SenseiAvatarNoi.dangPhat(); if (p) S.emo[p.emotion] = 1;
  if (ae.clipPlaying) { try { const KH = SenseiKhauHinh, l = KH.layLuc(KH.bayGio(ae.outCtx)); if (l && l.co && l.mo > 0.12) S.kh++; } catch (e) {}
    try { const C = window.__senseiClip; if (C && C.mieng && C.mieng.M && C.mieng.M.khoaVe != null) S.khoa[C.mieng.M.khoaVe] = 1; } catch (e) {} }
}, 16);
1`;

async function phat(t, lineId, nv, text, the, kind = 'nhan-vat', f0 = 130) {
  await t.ev(`window.__batDau()`);
  await t.ev(`(() => { const u = window.__vowel(${JSON.stringify(text)}, ${f0}); window.__pr = __audioEngine.playPcmClip(u, { kind: ${JSON.stringify(kind)}, lineId: ${JSON.stringify(lineId)}, nhanVat: ${JSON.stringify(nv)}, text: ${JSON.stringify(text)}, the: ${JSON.stringify(the)} }); return 1; })()`);
  await t.ev(`window.__pr.then(() => new Promise(r => setTimeout(r, 900)))`);
  return JSON.parse(await t.ev(`JSON.stringify(Object.assign({}, window.__s, { khoa: Object.keys(window.__s.khoa).length, emo: Object.keys(window.__s.emo) }))`));
}

const t = await moTrinhDuyet({ duong: '/index.html?noLive&sensei=video', w: 1280, h: 800, dpr: 2 });
try {
  await t.cho('!!window.__slideEngine && !!window.__audioEngine', 30000);
  await t.ev(`document.getElementById('pickerCloseBtn').click()`);
  await t.ev(TRANG);
  await t.ev(`(async () => { __audioEngine.ensureOutContext(); await __audioEngine.outCtx.resume(); })()`);
  const meoSan = await t.cho(`!!window.__senseiClip && window.__senseiClip.mieng && window.__senseiClip.mieng.M && window.__senseiClip.mieng.M.tt === 'san'`, 25000, 250);
  await t.ev(`__slideEngine.setTab('kaiwa')`); await ngu(1000);
  const ds = await t.ev(`JSON.stringify([...document.querySelectorAll('.kw-row')].map(r => r.querySelector('.kw-bubble').id))`);
  const dong = JSON.parse(ds);
  kt('gan', `moi hang thoai co 1 avatar (${dong.length} hang)`, dong.length >= 4 && (await t.ev(`SenseiAvatarNoi._ds().length`)) === dong.length, '');

  // -------- chi nguoi noi chuyen dong
  let r = await phat(t, dong[1], 'yamada', 'みなさん、こちらはミラーさんです', '');
  kt('nguoi-noi', 'chi 1 avatar chuyen dong trong luc noi (toi da cung luc = 1)', r.maxAct === 1, JSON.stringify(r));
  kt('nguoi-noi', 'cac avatar khac giu nguyen <img> (khong bi an)', r.anCuaKhac === 0, JSON.stringify(r));
  const sau = await t.ev(`JSON.stringify({ act: SenseiAvatarNoi._ds().filter(a => a.hoat).length, an: [...document.querySelectorAll('.kw-ava img')].filter(i => i.style.visibility === 'hidden').length, lop: document.querySelectorAll('.avn-dang-noi').length })`);
  kt('nguoi-noi', 'noi xong: avatar ve nghi, <img> hien lai, bo lop .avn-dang-noi', JSON.parse(sau).act === 0 && JSON.parse(sau).an === 0 && JSON.parse(sau).lop === 0, sau);
  // -------- meo
  kt('meo', 'nhan vat noi: dong khau-hinh cua meo IM (0 khung mo)', r.kh === 0, JSON.stringify(r));
  if (meoSan) kt('meo', `nhan vat noi: mieng meo khong doi hinh (so khoa ve ${r.khoa} <= 1)`, r.khoa <= 1, JSON.stringify(r));
  const rs = await phat(t, null, '', 'わたしは がくせいです', '', 'sensei', 120);
  kt('meo', 'Sensei doc: meo nhep mieng (khau-hinh co tieng), avatar khong chuyen dong', rs.kh > 10 && rs.maxAct === 0, JSON.stringify(rs));
  if (meoSan) kt('meo', `Sensei doc: mieng meo doi hinh (so khoa ve ${rs.khoa} >= 2)`, rs.khoa >= 2, JSON.stringify(rs));
  const r2 = await phat(t, dong[1], 'yamada', 'もういちど おねがいします', '');
  kt('meo', 'nhan vat noi lai sau Sensei: meo lai im (cong chan khau-hinh duoc ha roi bat lai)', r2.kh === 0, JSON.stringify(r2));

  // -------- bieu cam + ky hieu + nghieng
  const k1 = await phat(t, dong[0], 'sato', 'これ あなたが つくったんですか？', 'suy_nghi');
  kt('bieu-cam', "cau hoi: avatar doi sang 'hoi' + hien ky hieu '?'", k1.emo.includes('hoi') && k1.sym >= 1, JSON.stringify(k1));
  kt('bieu-cam', 'cau hoi: dau nghieng ~3 do (0.02-0.08 rad)', k1.tilt > 0.02 && k1.tilt < 0.08, k1.tilt);
  const k2 = await phat(t, dong[1], 'yamada', 'ばか！ いいかげんに しろ！', 'gian', 'nhan-vat', 95);
  kt('bieu-cam', "the gian + '!': bieu cam gian + hien gan giun/ky hieu", k2.emo.includes('gian') && k2.sym >= 1, JSON.stringify(k2));
  const k3 = await phat(t, dong[2], 'miller', 'えっ！ ほんとうですか！', 'ngac_nhien');
  kt('bieu-cam', "ngac nhien: bieu cam ngac_nhien + ky hieu '!'", k3.emo.includes('ngac_nhien') && k3.sym >= 1, JSON.stringify(k3));
  const k4 = await phat(t, dong[1], 'yamada', 'ごめんなさい', 'buon');
  kt('bieu-cam', 'buon / xin loi: bieu cam buon + giot mo hoi', k4.emo.includes('buon') && k4.sym >= 1, JSON.stringify(k4));
  await t.ev(`SenseiAvatarNoi.datGiamChuyen(true)`);
  const g1 = await phat(t, dong[0], 'sato', 'これ あなたが つくったんですか？', 'suy_nghi');
  const g2 = await phat(t, dong[1], 'yamada', 'ばか！ いいかげんに しろ！', 'gian', 'nhan-vat', 95);
  kt('giam-chuyen-dong', 'prefers-reduced-motion: khong nghieng dau, van doi bieu cam', g1.tilt === 0 && g1.emo.includes('hoi'), JSON.stringify(g1));
  kt('giam-chuyen-dong', 'prefers-reduced-motion: van hien ky hieu (chi mo dan, khong nay)', g2.sym >= 1, JSON.stringify(g2));
  await t.ev(`SenseiAvatarNoi.datGiamChuyen(false)`);

  // -------- 36 px: mieng co ve
  const px = JSON.parse(await t.ev(`(async () => {
    const a = SenseiAvatarNoi._ds()[1]; a.dungCanvas && 0;
    SenseiAvatarNoi._vet = [];
    const u = window.__vowel('あいうえお', 130);
    await __audioEngine.playPcmClip(u, { kind: 'nhan-vat', lineId: a.lineId, nhanVat: 'yamada', text: 'あいうえお', the: '' });
    const h = SenseiAvatarNoi._vet.map(f => f[2]);
    return JSON.stringify({ max: Math.max(...h), n: h.length, w: a.canvas && a.canvas.width, css: a.img.offsetWidth });
  })()`));
  kt('nho', `avatar ${px.css} px: canvas ${px.w} px, do mo mieng toi da ${px.max.toFixed(2)} (> 0.1)`, px.max > 0.1 && px.w >= 48, JSON.stringify(px));

  if (thoiGian && fs.existsSync(LIP)) {
    const ids = fs.readdirSync(path.join(LIP, 'do/ref')).filter(f => /^(ja_\d+|lt_ja_.*)\.json$/.test(f)).map(f => f.slice(0, -5));
    const wavCua = (id) => { const s = path.join(LIP, 'do/sapi', id + '_24k.wav'); return fs.existsSync(s) ? s : path.join(LIP, 'A/tts', id + '.wav'); };
    const b64 = (f) => { const b = fs.readFileSync(f); let o = 12, d = null; while (o < b.length) { const id = b.toString('ascii', o, o + 4), n = b.readUInt32LE(o + 4); if (id === 'data') { d = b.subarray(o + 8, o + 8 + n); break; } o += 8 + n + (n & 1); } return d.toString('base64'); };
    const vet = {};
    for (const id of ids) {
      const v = await t.ev(`(async () => { SenseiAvatarNoi._vet = []; await __audioEngine.playPcmClip(${JSON.stringify(b64(wavCua(id)))}, { kind: 'nhan-vat', lineId: ${JSON.stringify(dong[1])}, nhanVat: 'yamada', text: '', the: '' }); await new Promise(r => setTimeout(r, 200)); return JSON.stringify(SenseiAvatarNoi._vet.map(f => [f[1], f[2]])); })()`);
      vet[id] = JSON.parse(v);
    }
    const NHOM = { kin: 'K', a: 'M', e: 'M', i: 'M', o2: 'M', o: 'T', u: 'T' };
    const qt = (a, p) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.round(p * (s.length - 1)))]; };
    const G = { 'SAPI Haruka': { Mo: [], Khep: [] }, 'Gemini Charon ja': { Mo: [], Khep: [] } };
    const TH = 0.08;
    for (const id of ids) {
      const R = JSON.parse(fs.readFileSync(path.join(LIP, 'do/ref', id + '.json'), 'utf8')), fr = vet[id], gp = /^ja_/.test(id) ? 'SAPI Haruka' : 'Gemini Charon ja';
      const mo = (tt) => { let lo = 0, hi = fr.length - 1; if (tt <= fr[0][0]) return 0; if (tt >= fr[hi][0]) return fr[hi][1]; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (fr[m][0] <= tt) lo = m; else hi = m; } const a = fr[lo], b = fr[hi]; return a[1] + (b[1] - a[1]) * (tt - a[0]) / (b[0] - a[0]); };
      const isOpen = (ms) => mo(ms / 1000) > TH;
      const lab = R.lab, n = lab.length, runs = [];
      for (let k = 0; k < n;) { let e = k; while (e < n && lab[e] === lab[k]) e++; runs.push({ a: k, b: e, L: lab[k] }); k = e; }
      const def = runs.filter(u => u.L !== 'dc' && u.b - u.a >= 3);
      for (let j = 1; j < def.length; j++) {
        const u = def[j], p = def[j - 1]; if (u.a - p.b > 15) continue;
        const isMo = p.L === 'kin' && u.L !== 'kin', isKhep = u.L === 'kin' && p.L !== 'kin'; if (!isMo && !isKhep) continue;
        const ts = u.a * 10, G0 = p.b * 10, kc = (i) => (i < G0 ? G0 - i : i > ts ? i - ts : 0); let tot = null;
        for (let i = Math.max(1, G0 - 150); i <= ts + 150; i++) {
          if (!(isMo ? (isOpen(i) && !isOpen(i - 1)) : (!isOpen(i) && isOpen(i - 1)))) continue;
          let ok = true; for (let q = i; q < i + 30; q++) if (isOpen(q) !== isMo) { ok = false; break; }
          if (ok && (tot == null || kc(i) < kc(tot))) tot = i;
        }
        if (tot != null) G[gp][isMo ? 'Mo' : 'Khep'].push(tot < G0 ? tot - G0 : tot > ts ? tot - ts : 0);
      }
    }
    console.log('\nLech thoi gian mieng DA VE (Chrome that, 60 Hz; am = mieng di truoc tieng), nguong mo = 0.08 x rong mieng:');
    for (const g in G) for (const k of ['Mo', 'Khep']) console.log(`  ${g.padEnd(18)} ${k.padEnd(5)} n=${String(G[g][k].length).padStart(2)}  p10 ${qt(G[g][k], .1)}  p50 ${qt(G[g][k], .5)}  p90 ${qt(G[g][k], .9)} ms`);
    const c = G['Gemini Charon ja'], sp = G['SAPI Haruka'];
    kt('thoi-gian', `Charon ja: mo mieng tre toi da p90 ${qt(c.Mo, .9)} ms (<= 30)`, qt(c.Mo, .9) <= 30, '');
    kt('thoi-gian', `Charon ja: mo mieng p50 ${qt(c.Mo, .5)} ms trong +-40; duoi som (p10) ${qt(c.Mo, .1)} ms >= -50`, Math.abs(qt(c.Mo, .5)) <= 40 && qt(c.Mo, .1) >= -50, '');
    kt('thoi-gian', `SAPI: mo mieng p90 ${qt(sp.Mo, .9)} ms (<= 30), p50 ${qt(sp.Mo, .5)}`, qt(sp.Mo, .9) <= 30 && Math.abs(qt(sp.Mo, .5)) <= 40, '');
    kt('thoi-gian', `khep mieng p90 ${qt(c.Khep, .9)} ms (Charon), ${qt(sp.Khep, .9)} ms (SAPI) <= 40`, qt(c.Khep, .9) <= 40 && qt(sp.Khep, .9) <= 40, '');
  }
  const loi = t.loi();
  kt('nen', 'khong co loi console', loi.length === 0, loi.slice(0, 3).join(' | '));
} catch (e) {
  kt('nen', 'chay bai kiem thu khong loi', false, e && e.stack || e);
} finally { await t.dong(); }

let hong = 0;
for (const b of bang) { if (!b.ok) hong++; console.log(`${b.ok ? 'DAT ' : 'HONG'}  [${b.nhom}] ${b.ten}${b.ok ? '' : '  <-- ' + b.ct.slice(0, 300)}`); }
console.log(`\n${bang.length - hong}/${bang.length} dat`);
process.exit(hong ? 1 : 0);
