// chung.mjs — tien ich dung chung cua bo quay video bai giang day du (kich-ban.mjs, tao-tieng.mjs, quay.mjs)
// Chay tren mock ?noLive&moPhong (KHONG mo Gemini Live). Rieng tao-tieng.mjs goi Gemini qua trang ?taoTiengDemo (trang tu doc khoa).
import { sleep } from '../khung/cdp-lib.mjs';

export const THAM_SO_MOCK = '&kana=0&mat=0&rung=0';   // loi doc sach: khong ghi kana / ghi sai (tieng that khong co "loi ghi")

/** Bam nut "Bat dau giang" tu dau bai, chay het bai (khong den) */
export async function batDauGiang(t) {
  await t.ev(`__moPhong.datDen(null)`);
  await t.bam('#autoLectureBtn');
  return t.cho(`__lecture.state().lectureState === 'PLAYING' && (__motion.trangThai() || {}).che !== 'tat'`, 20000);
}
/** Bam dap an (dung) the bai tap that dang hien */
export async function traLoiDung(t) {
  const p = await t.ev(`(() => { const c = document.querySelector('#sanKhauGiang .qz-card[id^="card-"]'); if (!c) return null;
    const id = c.id.replace(/^card-/, ''); const b = __lecture.beats().find((x) => x.kind === 'quiz' && x.data && x.data.id === id);
    const k = b ? b.data.correctIndex : 0; const nut = document.getElementById('btn-opt-' + id + '-' + k); if (!nut) return null;
    const r = nut.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, id, k }; })()`);
  if (p) await t.click(p.x, p.y);
  return p;
}
/** Chay den het bai: gap cho bai tap thi tra loi dung. Tra { nhip, giay } */
export async function chayDenHet(t, { timeoutMs = 3600000, onNhip = null } = {}) {
  const t0 = Date.now();
  let truoc = -1, daTraLoi = '';
  while (Date.now() - t0 < timeoutMs) {
    const s = await t.ev(`({ i: __lecture.index(), st: __lecture.state().lectureState, che: (__motion.trangThai() || {}).che })`);
    if (s.i !== truoc) { truoc = s.i; if (onNhip) onNhip(s.i); }
    if (s.st !== 'PLAYING') return { nhip: s.i, giay: (Date.now() - t0) / 1000, st: s.st };
    if (s.che === 'cho' && daTraLoi !== 'i' + s.i) {
      await sleep(1200);   // nguoi hoc "suy nghi" mot chut
      const p = await traLoiDung(t);
      if (p) daTraLoi = 'i' + s.i;
    }
    await sleep(300);
  }
  return { nhip: truoc, giay: (Date.now() - t0) / 1000, st: 'timeout' };
}
