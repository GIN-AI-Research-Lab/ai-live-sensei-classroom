/**
 * VO GIAO DIEN — nhung viec cua khung man hinh ma CSS khong tu lam duoc:
 *
 *  1. Do chieu cao THAT cua thanh tren / duoi -> --top-h / --bottom-h tren :root.
 *     Thanh duoi co luc cao gap doi (dien thoai 2 dong, dang gio tay...), moi lop phu neo day
 *     (o chat, the ron, bang phan) dat theo bien nay nen khong bao gio de len nut chuong.
 *     Chieu cao DAT cua thanh nam o --bar-top / --bar-bottom — hai bien khac nhau, khong thi
 *     ghi so do vao chinh min-height cua thanh se lam no chi lon ma khong nho lai duoc.
 *  2. Do chieu cao the ron / bang phan (tam truot o day tren dien thoai) / o chat -> --spot-h / --bang-h / --chat-h.
 *  3. Dong bo trang thai nut: bang phan mo <-> #boardToggleBtn.is-live (theo body.co-bang,
 *     moi duong dong / mo — nut x tren bang, lau bang khi doi bai, Sensei tu viet — deu dung);
 *     o chat mo <-> body.co-chat + #chatToggleBtn.is-live.
 *  4. Phim <- / -> doi slide o chuong Ngu phap (bam dung nut truoc / sau san co).
 */
(function () {
  'use strict';

  function batDau() {
    const root = document.documentElement.style;
    const body = document.body;
    const thanhTren = document.querySelector('.deck-top');
    const thanhDuoi = document.querySelector('.deck-bottom');
    const coRO = typeof ResizeObserver !== 'undefined';

    // ---------------------------------------------------------------- 1. hai thanh
    function doThanh() {
      if (thanhTren) root.setProperty('--top-h', thanhTren.offsetHeight + 'px');
      if (thanhDuoi) root.setProperty('--bottom-h', thanhDuoi.offsetHeight + 'px');
    }
    doThanh();
    if (coRO) {
      const ro = new ResizeObserver(doThanh);
      if (thanhTren) ro.observe(thanhTren);
      if (thanhDuoi) ro.observe(thanhDuoi);
    }
    addEventListener('resize', doThanh);

    // ---------------------------------------------------------------- 2. the ron + bang phan
    // Ca hai do JS khac tao ve sau (lan dau mo) -> tim lai moi khi body doi class.
    // O chat co san trong trang: dien thoai nam ngang mo ca the + bang + chat thi hai lan ngan lai
    // nhuong day cho o chat (styles.css) theo --chat-h.
    let bang = null, the = null;
    const chatEl = document.getElementById('chatDock');
    const roKhung = coRO ? new ResizeObserver(doKhung) : null;
    if (roKhung && chatEl) roKhung.observe(chatEl);
    function doKhung() {
      if (bang) root.setProperty('--bang-h', bang.offsetHeight + 'px');
      if (the) root.setProperty('--spot-h', the.offsetHeight + 'px');
      if (chatEl) root.setProperty('--chat-h', chatEl.offsetHeight + 'px');
    }
    function timKhung() {
      const b = document.getElementById('bangPhan');
      if (b && b !== bang) { if (roKhung && bang) roKhung.unobserve(bang); bang = b; if (roKhung) roKhung.observe(b); }
      const t = document.querySelector('#spotlight .spot-dock');
      if (t && t !== the) { if (roKhung && the) roKhung.unobserve(the); the = t; if (roKhung) roKhung.observe(t); }
      doKhung();
    }

    // ---------------------------------------------------------------- 3. trang thai nut
    const nutBang = document.getElementById('boardToggleBtn');
    const nutChat = document.getElementById('chatToggleBtn');
    const oChat = document.getElementById('chatDock');
    function dongBo() {
      const coBang = body.classList.contains('co-bang');
      if (nutBang) {
        nutBang.classList.toggle('is-live', coBang);
        nutBang.setAttribute('aria-pressed', coBang ? 'true' : 'false');
      }
      const moChat = !!oChat && !oChat.classList.contains('hidden');
      // toggle(ten, dung) khi class da dung trang thai thi khong ghi lai thuoc tinh -> khong lap vo han
      body.classList.toggle('co-chat', moChat);
      if (nutChat) {
        nutChat.classList.toggle('is-live', moChat);
        nutChat.setAttribute('aria-expanded', moChat ? 'true' : 'false');
      }
      timKhung();
    }
    const theoClass = { attributes: true, attributeFilter: ['class'] };
    new MutationObserver(dongBo).observe(body, theoClass);
    if (oChat) new MutationObserver(dongBo).observe(oChat, theoClass);
    dongBo();

    // ---------------------------------------------------------------- 4. phim <- / ->
    const dangMo = (id) => { const el = document.getElementById(id); return !!el && !el.classList.contains('hidden'); };
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (body.dataset.tab !== 'grammar') return;
      // Dang go chu / chon trong o chon / dang mo hop thoai thi phim mui ten la cua cho do
      const t = e.target;
      if (t && t.closest && t.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="slider"]')) return;
      if (dangMo('lessonPicker') || dangMo('imageLightboxModal')) return;
      const nut = document.getElementById(e.key === 'ArrowLeft' ? 'prevSlideBtn' : 'nextSlideBtn');
      if (!nut || nut.disabled || !nut.getClientRects().length) return;
      e.preventDefault();
      nut.click();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', batDau);
  else batDau();
})();
