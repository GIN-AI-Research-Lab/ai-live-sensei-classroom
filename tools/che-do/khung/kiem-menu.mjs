// kiem-menu.mjs: nut "Chế độ" tren thanh tren — mo / phim / chon / luu / Ban cu / dien thoai
import { moServer, moChrome, Trang, donDep, sleep, SCR } from './cdp-lib.mjs';
import path from 'node:path';
const RA = path.join(SCR, 'che-do');
const goc = await moServer(); const ch = await moChrome();
const out = [];
try {
  const t = new Trang(ch.cdp, goc); await t.batDau();
  await t.moApp({ bai: ['N5', 1], truocTrang: `try { if (!sessionStorage.getItem('kt')) { localStorage.removeItem('sensei_che_do'); sessionStorage.setItem('kt','1'); } } catch (e) {}` });
  out.push(['mac dinh ban dau', await t.ev(`SenseiCheDo.muon()`)]);
  await t.bam('#cheDoBtn'); await sleep(300);
  out.push(['menu mo', await t.ev(`({ mo: !document.getElementById('cheDoMenu').hidden, exp: document.getElementById('cheDoBtn').getAttribute('aria-expanded'), focus: document.activeElement && document.activeElement.dataset.id, so: document.querySelectorAll('.cd-muc').length })`)]);
  await t.chup(path.join(RA, 'menu-1440.png'));
  await t.c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 });
  await t.c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 });
  out.push(['phim xuong', await t.ev(`document.activeElement.dataset.id`)]);
  await t.c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  out.push(['esc dong', await t.ev(`({ an: document.getElementById('cheDoMenu').hidden, focus: document.activeElement.id })`)]);
  out.push(['khong con nhom Ban cu', await t.ev(`({ nhom: [...document.querySelectorAll('.cd-nhom-ten')].map(e => e.textContent), so: document.querySelectorAll('.cd-muc').length, coPc: !!document.querySelector('.cd-muc[data-id^="pc"]') })`)]);
  await t.c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  // gia tri luu la id cu (pc3) + ?phongCach=pc5 -> deu la Mac dinh
  await t.ev(`localStorage.setItem('sensei_che_do', 'pc3'); true`);
  await t.moApp({ them: '&phongCach=pc5', bai: ['N5', 1], truocTrang: `try { localStorage.setItem('sensei_che_do', 'pc3'); } catch (e) {}` });
  out.push(['id cu -> mac dinh', await t.ev(`({ muon: SenseiCheDo.muon(), luu: localStorage.getItem('sensei_che_do'), phongCach: typeof SenseiPhongCach, attr: document.body.getAttribute('data-phong-cach') })`)]);
  await t.ev(`__moPhong.datDen(2)`); await t.ev(`__lecture.startFrom(1).then(() => true)`);
  await t.cho(`(__motion.trangThai() || {}).che === 'giang'`, 15000); await sleep(800);
  out.push(['giang mac dinh', await t.ev(`({ cd: __motion.cheDo().id, the: !!document.querySelector('#sanKhauGiang .sk-the'), phu: document.getElementById('sanKhauGiang').dataset.cdPhu || '' })`)]);
  await t.dungGiang();
  // chon che do chua co (b) -> giu pc3
  await t.ev(`SenseiCheDo.chon('b')`); await sleep(1500);
  out.push(['chon b (chua co)', await t.ev(`({ muon: SenseiCheDo.muon(), tb: document.querySelector('.cd-tb').textContent })`)]);
  // chon a, nap lai trang -> van la a (luu)
  await t.ev(`SenseiCheDo.chon('a')`); await sleep(1500);
  await t.moApp({ bai: ['N5', 3] });
  out.push(['luu sau nap lai', await t.ev(`({ muon: SenseiCheDo.muon(), dang: SenseiCheDo.hienTai() })`)]);
  await t.ev(`__moPhong.datDen(1)`); await t.ev(`__lecture.startFrom(0).then(() => true)`);
  await t.cho(`(__motion.trangThai() || {}).che === 'giang'`, 15000); await sleep(800);
  out.push(['bai khac cung che do', await t.ev(`({ id: __motion.cheDo().id, che: __motion.trangThai().che, st: __lecture.state().lectureState })`)]);
  await t.dungGiang();
  await t.coManHinh(390, 844);
  await t.moApp({ bai: ['N5', 1] });
  await t.bam('#cheDoBtn'); await sleep(300);
  out.push(['dien thoai', await t.ev(`(() => { const m = document.getElementById('cheDoMenu').getBoundingClientRect(), b = document.getElementById('cheDoBtn').getBoundingClientRect(); return { menu: [m.left, m.top, m.width, m.height].map(Math.round), nut: [b.left, b.top, b.width].map(Math.round), cuonNgang: document.documentElement.scrollWidth > innerWidth }; })()`)]);
  await t.chup(path.join(RA, 'menu-390.png'));
  out.push(['loi', t.loi().filter((x) => !/favicon|env\.js|che-do\/b\./.test(x.text)).slice(0, 5)]);
} finally { await ch.dong(); await donDep(); }
console.log(JSON.stringify(out, null, 1));
