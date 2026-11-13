/**
 * SenseiLazy — nap dong cac kho du lieu NANG theo nhu cau (P0-2b).
 *
 * Truoc day index.html nap eager ngay tu dau, du hoc vien chua bao gio mo toi:
 *   - js/kanji-strokes.js (370 KB) + js/kana-strokes.js (50 KB): chi can khi
 *     mo chuong Chu Han / viet chu len bang / spotlight chu.
 *   - 15 tep js/illustrations-<cap>-batch*.js (~414 KB): moi cap chi can khi
 *     hoc bai cua cap do (SenseiArt.extend() mo rong bang hinh theo tu).
 *   - js/mo-phong.js van nap eager o index thi tu kiem tra co ?moPhong roi
 *     dung yen — phan nap cua no nam ngay trong index.html (khoi inline canh
 *     vi tri the cu), khong qua file nay vi no phai chay truoc DOMContentLoaded.
 *
 * Moi ham o day KHONG BAO GIO nem loi: nap hong thi tra false, ben goi tu lui
 * ve hanh vi cu (chu tinh khong co net, the tu khong co hinh ve SVG) — dung
 * nhu khi du lieu chua kip toi. Goi chong nhau duoc khong trung bang Promise
 * cache theo tung tep / tung cap.
 */
(function () {
  'use strict';

  const dangNap = new Map();   // src -> Promise<boolean>

  /** Nap mot tep script mot lan duy nhat; true neu xong (ke ca da nap tu truoc). */
  function nap(src) {
    if (dangNap.has(src)) return dangNap.get(src);
    const p = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve(true);
      s.onerror = () => {
        console.warn('[lazy] khong nap duoc', src);
        dangNap.delete(src);   // cho lan goi sau thu lai
        resolve(false);
      };
      document.head.appendChild(s);
    });
    dangNap.set(src, p);
    return p;
  }

  // ---------------------------------------------------------------- net chu
  let pNet = null;

  /**
   * Nap du lieu net viet: kanji TRUOC, kana SAU (dung thu tu eager cu —
   * kana-strokes gop SenseiKanaNet vao he thong tra net cua kanji-strokes).
   * @returns {Promise<boolean>} true khi window.SenseiStrokes da san sang.
   */
  function napNetChu() {
    if (window.SenseiStrokes) return Promise.resolve(true);
    if (!pNet) {
      pNet = (async () => {
        await nap('js/kanji-strokes.js');
        await nap('js/kana-strokes.js');
        const ok = !!window.SenseiStrokes;
        if (!ok) pNet = null;   // hong han thi khong ghi nho, lan sau thu lai
        return ok;
      })();
    }
    return pNet;
  }

  // ------------------------------------------------------------ minh hoa SVG
  // Danh sach batch theo cap — trung ten tep trong js/. Cap khong co batch
  // (KANA, N2, N1) thi bo qua an toan.
  const MINH_HOA = {
    N5: ['batch1', 'batch2', 'batch3', 'batch4', 'batch5'],
    N4: ['batch1', 'batch2a', 'batch2b', 'batch3'],
    N3: ['batch1', 'batch2', 'batch3', 'batch4', 'batch5', 'batch6'],
  };
  const capXong = new Set();

  /**
   * Nap toan bo batch minh hoa cua mot cap (song song) truoc khi ve bai.
   * @returns {Promise<boolean>} false neu cap khong co batch hoac nap hong.
   */
  function napMinhHoa(cap) {
    const lvl = String(cap || '').toUpperCase();
    const ds = MINH_HOA[lvl];
    if (!ds) return Promise.resolve(false);
    if (capXong.has(lvl)) return Promise.resolve(true);
    return Promise.all(ds.map((b) => nap(`js/illustrations-${lvl.toLowerCase()}-${b}.js`)))
      .then((kq) => {
        const ok = kq.every(Boolean);
        if (ok) capXong.add(lvl);
        return ok;
      });
  }

  window.SenseiLazy = { nap, napNetChu, napMinhHoa };
})();
