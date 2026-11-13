/* ==========================================================================
   Che do san khau B — "Dien anh" (port theo khung concept B trong
   docs/concept-moi/luoi-20-concept.jpg: phong chieu toi, den spotlight am,
   chu serif lon, vang #dcb65e + do dat nung, phu de noi dung o day khung).
   Hop dong: docs/che-do/HUONG-DAN-API.md. Mau tham khao: js/che-do/s.js.
   Chi viet file nay + css/che-do/b.css; khong sua file khung.
   ========================================================================== */
(function () {
  'use strict';
  const SC = window.SenseiCheDo;
  if (!SC) return;

  const ID = 'b';
  let L = null, C = null, G = null;            // lop, ctx CDH, gsap
  const st = {
    W: 0, H: 0, k: 1, dt: false, meo: null, ngan: false,
    nhip: null, api: null, m: null, canh: null, td: null,
    tren: null, rail: null, duoi: null, tt: null, ngay: false,
  };

  // --------------------------------------------------------------- tien ich
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const kep = (x, a, b) => Math.max(a, Math.min(b, x));
  const giam = () => !!(C && C.giam) || st.ngay;
  const D = (s) => (giam() ? 0 : s);
  const SZ = (v) => Math.max(9, Math.round(v * st.k));            // co chu theo khung 1440x776
  const chuTok = (t) => String((t && (t.kanji || t.text)) || '').trim();
  const cauThanh = (s) => String(s || '').split(/(?<=[.!?。！？…])\s+/).map((x) => x.trim()).filter(Boolean);
  const viet1 = (s) => { s = String(s || '').trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; };
  const DOC_TRO = { 'は': 'wa', 'へ': 'e', 'を': 'o' };
  const LA_TRO = ['は', 'が', 'を', 'に', 'で', 'と', 'も', 'の', 'へ', 'か', 'や', 'から', 'まで', 'より', 'ので', 'のに'];
  const LA_DUOI = ['です', 'ます', 'でした', 'ました', 'ません', 'でしょう', 'ましょう', 'ください', 'たい', 'ない', 'なかった'];

  function mk(tag, cls, cha, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (cha) cha.appendChild(e);
    return e;
  }
  function doKhung() {
    const k = C.khung();
    st.W = k.w; st.H = k.h;
    st.dt = st.W < 640 || (st.W < 820 && st.H > st.W * 1.2);
    st.k = st.dt ? kep(Math.min(st.W / 390, st.H / 679), 0.62, 1.15) : kep(Math.min(st.W / 1440, st.H / 776), 0.55, 1.3);
    st.ngan = st.H < 430;
    st.meo = C.meo();
    return k;
  }
  /** Cho meo that: day khung duoi sang trai neu meo chiem goc phai duoi */
  function leDuoi() {
    const m = st.meo;
    if (!m) return 24;
    const chongDay = m.y + m.h > st.H - Math.max(120, st.H * 0.2);
    return chongDay ? Math.round(m.w + 28) : 24;
  }

  // ------------------------------------------------- do chu: thu phong vua hop
  /** Dat font-size lon nhat <= mx ma noi dung van vua (rong w, cao h neu co). Tra co da dat. */
  function vuaChu(el, mx, mn, w, h) {
    if (!el) return mx;
    let fs = mx;
    el.style.fontSize = fs + 'px';
    let bao = 0;
    while (fs > mn && bao++ < 40) {
      const tran = (w && el.scrollWidth > w + 2) || (h && el.scrollHeight > h + 2);
      if (!tran) break;
      fs = Math.max(mn, fs - Math.max(2, Math.round(fs * 0.08)));
      el.style.fontSize = fs + 'px';
    }
    return fs;
  }
  /** Dang ky mot lan do lai (chay ngay + chay lai khi phong chu tai xong) */
  function dangKyDo(c, fn) {
    c.dos.push(fn);
    fn();
  }

  // ------------------------------------------------------------ cong (gate)
  // Noi dung "doi duoc noi den": an san (class b-cho), mo bang cue hoac du phong.
  // moc() mo ngay sau delay giay (0 = ngay); het() mo tat ca.
  function moc(c, khoa, delay, fn) {
    const g = c.cong[khoa] || (c.cong[khoa] = { xong: false, h: null, fn: null });
    if (g.xong) return;
    if (fn) g.fn = fn;
    const mo = () => {
      if (g.xong || !c.el.isConnected) return;
      g.xong = true;
      if (g.fn) g.fn();
    };
    if (st.ngay || !delay || delay <= 0) { mo(); return; }
    g.h = c.api.hen(mo, Math.round(delay * 1000));
  }
  function huyMoc(c, khoa) {
    const g = c.cong[khoa];
    if (g && g.h) { try { c.api.huyHen(g.h); } catch (e) {} g.h = null; }
  }
  function moHet(c) {
    Object.keys(c.cong).forEach((k) => {
      const g = c.cong[k];
      if (!g.xong) {
        huyMoc(c, k);
        g.xong = true;
        if (g.fn) { try { g.fn(); } catch (e) {} }
      }
    });
    c.el.querySelectorAll('.b-cho').forEach((e) => e.classList.remove('b-cho'));
    c.el.querySelectorAll('.b-mc-doc').forEach((e) => e.classList.add('b-doc-hien'));
  }

  // --------------------------------------------------------------- canh
  function canhMoi(api) {
    const el = mk('div', 'b-canh', L.querySelector('.b-san'));
    const c = { el, api, cong: {}, dos: [], nh: null, kind: '', qzSlot: null, daHet: false };
    el.style.visibility = 'hidden';
    return c;
  }
  function canhVao(c, tre) {
    c.el.style.visibility = '';
    if (st.canh && st.canh !== c) boCanh(st.canh, true);
    st.canh = c;
    if (G && !giam()) {
      G.fromTo(c.el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.32, delay: tre || 0, ease: 'power1.out', overwrite: 'auto' });
    } else if (G) G.set(c.el, { autoAlpha: 1 });
  }
  function boCanh(c, mo) {
    if (!c) return;
    Object.keys(c.cong).forEach((k) => huyMoc(c, k));
    if (st.canh === c) st.canh = null;
    if (!c.el.isConnected) return;
    if (G && mo && !giam()) {
      G.to(c.el, { autoAlpha: 0, duration: 0.2, ease: 'power1.out', overwrite: 'auto', onComplete: () => c.el.remove() });
    } else c.el.remove();
  }
  /** Vao mot phan tu: hien (bo b-cho) + troi nhe len, theo tre tuyet doi trong canh */
  function vao(e, c, t, d) {
    if (!e) return;
    e.classList.remove('b-cho');
    if (!G || giam()) return;
    G.fromTo(e, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: d || 0.45, delay: Math.max(0, t || 0), ease: 'power2.out', overwrite: 'auto' });
  }
  /** Tieu diem: vong vang + phong nhe <= 200 ms, delay tre (giay, tu api.tre) */
  function tieuDiem(e, tre, manh) {
    if (!e || !G) return;
    e.classList.add('b-td');
    if (giam()) return;
    const tl = C.tl();
    if (!tl) return;
    const d = Math.max(0, tre || 0);
    tl.fromTo(e, { scale: 1 }, { scale: manh ? 1.045 : 1.025, duration: 0.16, delay: d, ease: 'power2.out', yoyo: true, repeat: 1, transformOrigin: '50% 50%' }, 0);
  }
  function hetTieuDiem(c) {
    if (c) c.el.querySelectorAll('.b-td').forEach((e) => e.classList.remove('b-td'));
  }

  // ------------------------------------------------------------- khung nen
  const FONT_URL = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,500;1,600&family=Shippori+Mincho+B1:wght@600;700;800&family=Be+Vietnam+Pro:wght@500;600;700&display=swap';
  let fontLink = null;
  function napFont() {
    if (fontLink) return fontLink;
    fontLink = new Promise((ok) => {
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = FONT_URL;
      l.onload = () => ok(true); l.onerror = () => ok(false);
      document.head.appendChild(l);
    });
    // phong tai xong: do lai chu cua canh dang hien (co chu serif khac phong du phong)
    try {
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {
        if (L && st.canh) st.canh.dos.forEach((f) => { try { f(); } catch (e) {} });
      });
    } catch (e) {}
    return fontLink;
  }

  function dungKhungNen() {
    L.textContent = '';
    mk('div', 'b-nen', L);
    const tren = mk('div', 'b-tren', L);
    st.tren = {
      trai: mk('div', 'b-tren-trai', tren),
      giua: mk('div', 'b-tren-giua', tren),
      phai: mk('div', 'b-tren-phai', tren),
    };
    const rail = mk('div', 'b-rail', L);
    st.rail = {
      so: mk('div', 'b-rail-so', rail),
      nhan: mk('div', 'b-rail-nhan', rail),
      doc: mk('div', 'b-rail-doc', rail),
    };
    mk('div', 'b-san', L);
    const duoi = mk('div', 'b-duoi', L);
    st.duoi = { hop: duoi, chu: mk('div', 'b-duoi-chu', duoi) };
    st.tt = mk('div', 'b-tt b-cho', L);
    capNhatTren(null);
  }
  function capNhatTren(nh) {
    if (!st.tren) return;
    const bai = (nh && nh.bai) || {};
    const cd = String((nh && nh.capDo) || '').toUpperCase();
    st.tren.trai.innerHTML = '<b>SENSEI MÈO</b><span>' + esc((cd === 'KANA' ? 'Nhập môn' : cd) + (bai.lessonNumber != null ? ' · Bài ' + bai.lessonNumber : '') + (bai.title ? ' — ' + bai.title : '')) + '</span>';
    if (nh && nh.n > 1) {
      let s = '';
      for (let i = 0; i < nh.n; i++) s += '<i class="' + (i < nh.i ? 'da' : i === nh.i ? 'dang' : '') + '"></i>';
      st.tren.giua.innerHTML = s;
      st.tren.phai.textContent = String(nh.i + 1).padStart(2, '0') + ' / ' + String(nh.n).padStart(2, '0');
      st.rail.so.innerHTML = String(nh.i + 1).padStart(2, '0') + '<small>/' + String(nh.n).padStart(2, '0') + '</small>';
      st.rail.nhan.textContent = nh.chuong ? String(nh.chuong.ten || '').toUpperCase() : '';
    }
  }
  function datRailDoc(chu) {
    if (st.rail) st.rail.doc.innerHTML = chu ? '<span lang="ja">' + esc(chu) + '</span>' : '';
  }
  /** Dong phu de noi dung o day khung (nghia / giai thich — khong phai loi Sensei) */
  function datPhuDe(html) {
    if (!st.duoi) return;
    st.duoi.hop.style.paddingRight = leDuoi() + 'px';
    if (!html) { st.duoi.chu.innerHTML = ''; st.duoi.hop.classList.add('b-trong'); return; }
    st.duoi.hop.classList.remove('b-trong');
    st.duoi.chu.innerHTML = html;
    vuaChu(st.duoi.chu, SZ(st.dt ? 17 : 21), 12, st.W - leDuoi() - 60, SZ(64));
  }

  // ------------------------------------------------------------ the tieu de
  function dungTieuDe(nh, c) {
    const bai = nh.bai || {};
    const cd = String(nh.capDo || '').toUpperCase();
    const hop = mk('div', 'b-td-khung', c.el);
    mk('div', 'b-eyebrow', hop, 'SENSEI MÈO TRÌNH CHIẾU · ' + esc(cd === 'KANA' ? 'NHẬP MÔN' : cd) + (bai.lessonNumber != null ? ' · BÀI ' + bai.lessonNumber : ''));
    const t = mk('h2', 'b-td-ten', hop, esc(bai.title || 'Bài học'));
    const gach = mk('div', 'b-td-gach', hop);
    const sao = (bai.vocabList || []).slice(0, 5).map((v) => v.kanji || v.word).filter(Boolean);
    if (sao.length) mk('div', 'b-td-sao', hop, 'Với các từ&nbsp; ' + sao.map((s) => '<span lang="ja">' + esc(s) + '</span>').join('<i>·</i>'));
    if (nh.chuong) mk('div', 'b-td-chuong', hop, 'Mở đầu · ' + esc(nh.chuong.ten || ''));
    dangKyDo(c, () => vuaChu(t, SZ(st.dt ? 44 : 92), 26, hop.clientWidth - 40, SZ(st.dt ? 150 : 240)));
    [hop.children[0], t, gach, hop.children[3], hop.children[4]].forEach((e, i) => { if (e) vao(e, c, giam() ? 0 : 0.12 + i * 0.14, 0.6); });
  }

  // ------------------------------------------------------------ TU VUNG
  function dungTuVung(nh, c, m) {
    const d = nh.data || {};
    const khung = mk('div', 'b-tv', c.el);
    // trai: khung anh "diem anh" (co thuoc phim tren/duoi); khong anh -> o chu lon
    const anhHop = mk('div', 'b-tv-anh', khung);
    if (d.imageUrl) {
      const im = mk('img', 'b-tv-img', anhHop);
      im.alt = ''; im.decoding = 'async'; im.src = d.imageUrl;
      mk('i', 'b-tv-bar tren', anhHop); mk('i', 'b-tv-bar duoi', anhHop);
      if (C.taiAnh) C.taiAnh(d.imageUrl);
    } else {
      mk('div', 'b-tv-thieu', anhHop, '<span lang="ja">' + esc(String(d.kanji || d.word || '？').slice(0, 2)) + '</span>');
    }
    const phai = mk('div', 'b-tv-phai', khung);
    const dem = nh.chuong ? (nh.chuong.i + ' / ' + nh.chuong.n) : '';
    mk('div', 'b-eyebrow', phai, esc(C.loaiTu(d.wordType) || 'Từ vựng') + (dem ? ' · TỪ ' + esc(dem) : ''));
    const chu = mk('div', 'b-tv-chu', phai);
    chu.innerHTML = C.ruby(d.kanji || d.word || '', d.furigana || '');
    if (d.romaji) mk('div', 'b-tv-romaji', phai, esc(d.romaji));
    const nghia = mk('div', 'b-tv-nghia b-cho', phai, esc(viet1(d.meaningVi || '')));
    const ghi = mk('div', 'b-tv-ghi b-cho', phai);
    const chiTiet = [];
    if (d.accentNote) chiTiet.push(['note', esc(d.accentNote)]);
    if (d.dictionaryForm) chiTiet.push(['dict', 'Thể từ điển: <span lang="ja">' + esc(d.dictionaryForm) + '</span>']);
    ghi.innerHTML = chiTiet.map((x) => '<p data-k="' + x[0] + '">' + x[1] + '</p>').join('');
    if (!chiTiet.length) ghi.remove();
    c.tv = { chu, nghia, ghi, anhHop };
    datRailDoc(d.kanji || d.word || '');
    datPhuDe('');
    dangKyDo(c, () => {
      vuaChu(chu, SZ(st.dt ? 64 : 168), 30, phai.clientWidth - 8, SZ(st.dt ? 150 : 300));
      vuaChu(nghia, SZ(st.dt ? 24 : 46), 15, phai.clientWidth - 8, SZ(130));
    });
    vao(anhHop, c, 0.05, 0.6); vao(chu, c, 0.14, 0.55);
    // nghia: cue V3, du phong 1,8 s sau V1 / 3,2 s sau vao nhip
    moc(c, 'nghia', 3.2, () => vao(nghia, c, 0, 0.5));
    if (chiTiet.length) moc(c, 'ghi', 4.2, () => vao(ghi, c, 0, 0.5));
  }
  function cueTuVung(m, id, tt, api, nh, c) {
    if (!c.tv) return;
    const tre = api.tre(tt);
    if (id === 'V1') {
      tieuDiem(c.tv.chu, tre, true);
      moc(c, 'nghia', (tt && tt.T ? Math.max(0, tt.T - api.bayGio()) : 0) + 1.8, () => vao(c.tv.nghia, c, 0, 0.5));
    } else if (id === 'V2' || id === 'V2b') tieuDiem(c.tv.chu, tre);
    else if (id === 'V3') { moc(c, 'nghia', tre, () => vao(c.tv.nghia, c, 0, 0.5)); tieuDiem(c.tv.nghia, tre); }
    else if (id === 'V4') { moc(c, 'ghi', tre, () => vao(c.tv.ghi, c, 0, 0.5)); }
    else if (id === 'V5') { moc(c, 'ghi', tre, () => vao(c.tv.ghi, c, 0, 0.5)); }
  }

  // ------------------------------------------------------- KANJI / KANA
  function dungChuHan(nh, c, m) {
    const d = nh.data || {};
    const kana = !!nh.laKana;
    const khung = mk('div', 'b-kj', c.el);
    const trai = mk('div', 'b-kj-trai', khung);
    mk('div', 'b-eyebrow', trai, kana ? 'Chữ cái · Kana' : 'Chữ Hán · Kanji');
    const hv = mk('div', 'b-kj-hv', trai, esc(kana ? (d.romaji || '') : (d.hanViet || '')));
    const nghiaEl = mk('div', 'b-kj-nghia', trai, esc(viet1(d.meaningVi || d.meoNho || '')));
    const giua = mk('div', 'b-kj-giua', khung);
    const o = mk('div', 'b-kj-o', giua);
    const chuEl = mk('div', 'b-kj-chu', o, '<span lang="ja">' + esc(d.character || '') + '</span>');
    mk('div', 'b-kj-net-note', giua, kana ? 'Nét viết' : (d.strokeCount ? d.strokeCount + ' nét' : 'Thứ tự nét'));
    const phai = mk('div', 'b-kj-phai', khung);
    const dong = (nhan, giaTri) => {
      if (!giaTri || !giaTri.length) return null;
      const r = mk('div', 'b-kj-dong', phai);
      mk('span', 'b-kj-nhan', r, nhan);
      mk('span', 'b-kj-gt', r, Array.isArray(giaTri) ? giaTri.map((x) => '<span lang="ja">' + esc(x) + '</span>').join(' · ') : '<span lang="ja">' + esc(giaTri) + '</span>');
      return r;
    };
    if (kana) {
      dong('Đọc', d.romaji);
    } else {
      dong('Âm On', d.onyomi);
      dong('Âm Kun', d.kunyomi);
    }
    const duoi = mk('div', 'b-kj-duoi', c.el);
    const tu = kana ? (d.viDu || d.commonWords || []) : (d.commonWords || []);
    const chipEls = tu.slice(0, 4).map((w, i) => {
      const chip = mk('div', 'b-kj-chip', duoi);
      chip.innerHTML = '<b lang="ja">' + esc(w.word || w.text || '') + '</b>' + (w.furigana ? '<span class="b-kj-chip-doc" lang="ja">' + esc(w.furigana) + '</span>' : '') + (w.meaningVi ? '<span class="b-kj-chip-n">' + esc(w.meaningVi) + '</span>' : '');
      return chip;
    });
    c.kj = { o, chuEl, hv, nghiaEl, chipEls, daNet: false, kana, d };
    datRailDoc(d.character || '');
    datPhuDe(kana
      ? (d.meoNho ? esc(d.meoNho) : (d.sosanh ? esc(d.sosanh) : ''))
      : (d.meaningVi ? '<span lang="ja">' + esc(d.character || '') + '</span> — ' + esc(d.meaningVi) : ''));
    dangKyDo(c, () => {
      vuaChu(chuEl, SZ(st.dt ? 150 : 330), 60, o.clientWidth - 10, o.clientHeight - 10);
      vuaChu(hv, SZ(st.dt ? 34 : 64), 20, trai.clientWidth - 8, SZ(120));
    });
    vao(o, c, 0.05, 0.6); vao(hv, c, 0.16, 0.5);
    chipEls.forEach((e, i) => vao(e, c, 0.25 + i * 0.09, 0.45));
    // net chu: cue K1/K1b; du phong het nhip (het() goi veNetNgay)
    c.veNetNgay = (treS) => {
      if (c.kj.daNet || !c.kj.o) return;
      c.kj.daNet = true;
      const r = C.vietNet(c.kj.o, d.character || '', { tocDo: 0.45, tre: treS || 0 });
      if (r) { c.kj.chuEl.style.display = 'none'; c.kj.o.classList.add('b-co-net'); }
    };
  }
  function cueChuHan(m, id, tt, api, nh, c) {
    if (!c.kj) return;
    const tre = api.tre(tt);
    if (id === 'K1' || id === 'K1b') c.veNetNgay(tre);
    else if (id === 'K1m') tieuDiem(c.kj.chuEl, tre, true);
    else if (id === 'K2') tieuDiem(c.kj.hv, tre, true);
    else if (id === 'K3') tieuDiem(c.kj.nghiaEl, tre);
    else if (id.indexOf('K7.') === 0) {
      const i = parseInt(id.slice(3), 10);
      if (c.kj.chipEls[i]) tieuDiem(c.kj.chipEls[i], tre);
    } else if (id === 'K4' || id === 'K5' || id === 'K6') {
      const dongEls = c.el.querySelectorAll('.b-kj-dong');
      const idx = id === 'K4' ? 0 : id === 'K5' ? 0 : 1;
      if (dongEls[idx]) tieuDiem(dongEls[idx], tre);
    }
  }

  // ---------------------------------------------------------- MAU CAU
  function dungMauCau(nh, c, m) {
    const d = nh.data || {};
    const ct = nh.congThuc;
    const khung = mk('div', 'b-mc', c.el);
    mk('div', 'b-eyebrow b-mc-eyebrow', khung, 'Ngữ pháp' + (d.title ? ' · ' + esc(d.title) : ''));
    const hang = mk('div', 'b-mc-hang', khung);
    const phan = ct && Array.isArray(ct.phan) && ct.phan.length ? ct.phan : null;
    const khoiEls = [];
    if (phan) {
      let soChu = -1, soO = -1;
      phan.forEach((p, j) => {
        if (p.loai === 'chu') soChu++; else soO++;
        const laTroTu = LA_TRO.indexOf(p.chu) >= 0;
        const laDuoiCau = LA_DUOI.indexOf(p.chu) >= 0;
        const k = mk('div', 'b-mc-khoi b-cho ' + (p.loai === 'o' ? 'la-o' : laTroTu ? 'la-tro' : laDuoiCau ? 'la-duoi' : 'la-chu'), hang);
        k.dataset.j = j; k.dataset.loai = p.loai;
        k.dataset.idx = p.loai === 'chu' ? soChu : soO;
        const chuEl = mk('div', 'b-mc-chu', k, p.loai === 'o' ? esc(p.nhan || p.chu) : '<span lang="ja">' + esc(p.chu) + '</span>');
        let vai = '';
        if (p.loai === 'o') {
          const sau = phan.slice(j + 1).find((x) => x.loai === 'chu');
          vai = sau ? (C.vaiTro(sau.chu) || '') : '';
          mk('i', 'b-mc-gachdoc', k);
          mk('div', 'b-mc-vai', k, esc(vai || 'thành phần'));
        } else {
          const doc = DOC_TRO[p.chu] || '';
          mk('div', 'b-mc-doc', k, esc(doc));
          mk('div', 'b-mc-vai', k, esc(C.vaiTro(p.chu) || ''));
        }
        khoiEls.push(k);
        dangKyDo(c, () => vuaChu(chuEl, SZ(st.dt ? 52 : 128), 26, st.dt ? 150 : 300, SZ(st.dt ? 90 : 170)));
      });
    } else {
      const k = mk('div', 'b-mc-khoi la-chu', hang);
      const chuEl = mk('div', 'b-mc-chu', k, '<span lang="ja">' + esc(d.grammarFormula || d.title || '') + '</span>');
      khoiEls.push(k);
      dangKyDo(c, () => vuaChu(chuEl, SZ(st.dt ? 44 : 110), 24, hang.clientWidth - 30, SZ(200)));
    }
    // hang bien hinh (neu cong thuc chua ->): cac buoc nho phia duoi
    let buocEls = [];
    const goc = (ct && ct.goc) || d.grammarFormula || '';
    if (/[→⇒]/.test(goc) && phan) {
      const cac = goc.split(/[→⇒]/).map((x) => x.trim()).filter(Boolean);
      if (cac.length > 1) {
        const hb = mk('div', 'b-mc-buoc', khung);
        buocEls = cac.map((x, i) => {
          const b = mk('span', 'b-mc-buoc-muc' + (i === 0 ? ' dang' : ''), hb, '<span lang="ja">' + esc(x) + '</span>');
          if (i < cac.length - 1) mk('span', 'b-mc-buoc-ten', hb, '→');
          return b;
        });
      }
    }
    c.mc = { khoiEls, buocEls, giaiThichDa: 0 };
    datRailDoc(phan ? phan.filter((p) => p.loai === 'chu').map((p) => p.chu).join('・') : '');
    datPhuDe('');
    // cong thuc vao theo cue G2/G3; du phong G0+1,2 s / vao nhip +2,3 s (moc theo tung khoi)
    khoiEls.forEach((k, j) => moc(c, 'khoi' + j, 2.3, () => vao(k, c, 0, 0.5)));
    // giai thich: tung cau theo G4.s; du phong so le tu 2,6 s
    const cau = cauThanh(d.explanation || '');
    c.mc.cau = cau;
    cau.forEach((_, s2) => moc(c, 'gt' + s2, 2.6 + s2 * 1.4, () => hienGiaiThich(c, s2)));
    if (d.teacherTips) moc(c, 'tips', 5.0, () => hienMeo(c, d.teacherTips, d.culturalNotes));
    else if (d.culturalNotes) moc(c, 'tips', 5.4, () => hienMeo(c, '', d.culturalNotes));
  }
  function hienGiaiThich(c, s2) {
    if (!c.mc || !c.mc.cau || s2 == null || s2 < c.mc.giaiThichDa) return;
    c.mc.giaiThichDa = s2 + 1;
    datPhuDe(esc(c.mc.cau[s2]));
  }
  function hienMeo(c, tips, vh) {
    const phan = [];
    if (tips) phan.push('<b>Lưu ý:</b> ' + esc(tips));
    if (vh) phan.push('<b>Văn hoá:</b> ' + esc(vh));
    if (phan.length) datPhuDe(phan.join(' &nbsp;·&nbsp; '));
  }
  function cueMauCau(m, id, tt, api, nh, c) {
    if (!c.mc) return;
    const tre = api.tre(tt);
    if (id === 'G0') c.mc.khoiEls.forEach((k, j) => moc(c, 'khoi' + j, 1.2, () => vao(k, c, 0, 0.5)));
    else if (id.indexOf('G2.') === 0 || id.indexOf('G2p.') === 0) {
      const j2 = parseInt(id.split('.')[1], 10);
      // G2.j dem theo phan 'chu'; tim khoi co data-loai=chu va data-idx=j2
      const k = c.mc.khoiEls.find((x) => x.dataset.loai === 'chu' && +x.dataset.idx === j2) || c.mc.khoiEls[j2];
      if (k) { moc(c, 'khoi' + c.mc.khoiEls.indexOf(k), tre, () => vao(k, c, 0, 0.5)); tieuDiem(k, tre, true); }
    } else if (id.indexOf('G3.') === 0) {
      const j3 = parseInt(id.split('.')[1], 10);
      const k = c.mc.khoiEls.find((x) => x.dataset.loai === 'o' && +x.dataset.idx === j3) || c.mc.khoiEls[j3];
      if (k) { moc(c, 'khoi' + c.mc.khoiEls.indexOf(k), tre, () => vao(k, c, 0, 0.5)); tieuDiem(k, tre, true); }
    } else if (id.indexOf('G2c.') === 0) {
      const j4 = parseInt(id.split('.')[1], 10);
      const k = c.mc.khoiEls.find((x) => x.dataset.loai === 'chu' && +x.dataset.idx === j4);
      if (k) { const doc = k.querySelector('.b-mc-doc'); if (doc) { doc.classList.add('b-doc-hien'); tieuDiem(doc, tre); } }
    } else if (id.indexOf('GM.') === 0) {
      const kk = parseInt(id.split('.')[1], 10);
      c.mc.buocEls.forEach((b, i) => b.classList.toggle('dang', i === Math.min(kk + 1, c.mc.buocEls.length - 1)));
    } else if (id.indexOf('G4.') === 0) {
      const s2 = parseInt(id.split('.')[1], 10);
      moc(c, 'gt' + s2, tre, () => hienGiaiThich(c, s2));
    } else if (id === 'G5' || id === 'G6') {
      const d = nh.data || {};
      moc(c, 'tips', tre, () => hienMeo(c, id === 'G5' ? d.teacherTips : '', id === 'G6' ? d.culturalNotes : ''));
    }
  }

  // ------------------------------------------------------------- VI DU
  function dungViDu(nh, c, m) {
    const d = nh.data || {};
    const toks = d.tokens || [];
    const khung = mk('div', 'b-vd', c.el);
    mk('div', 'b-eyebrow', khung, 'Ví dụ' + (nh.beat && nh.beat.label ? ' · ' + esc(nh.beat.label) : ''));
    // dai cong thuc nho phia tren (slide ngu phap chua mau cau nay)
    const ct = nh.congThuc;
    if (ct && Array.isArray(ct.phan) && ct.phan.length) {
      const dai = mk('div', 'b-vd-dai', khung);
      c.vdDai = ct.phan.map((p) => {
        const s = mk('span', 'b-vd-dai-muc ' + (p.loai === 'o' ? 'la-o' : 'la-chu'), dai, p.loai === 'o' ? esc(p.nhan || p.chu) : '<span lang="ja">' + esc(p.chu) + '</span>');
        return s;
      });
    }
    const anhUrl = C.anhCau ? C.anhCau(toks, nh.bai) : null;
    if (anhUrl) {
      const ah = mk('div', 'b-vd-anh', khung);
      const im = mk('img', '', ah); im.alt = ''; im.decoding = 'async'; im.src = anhUrl;
      if (C.taiAnh) C.taiAnh(anhUrl);
      c.vdAnh = ah;
    }
    const cau = mk('div', 'b-vd-cau', khung);
    const tokEls = toks.map((t, i) => {
      const s = mk('span', 'b-vd-tok' + (t.isKeyGrammar ? ' la-khoa' : ''), cau);
      s.innerHTML = C.tok(t, i, toks);
      s.dataset.i = i;
      return s;
    });
    // nhan ghep: token thuoc cong thuc thi hien vai tro nho phia tren khi E3 goi
    c.vd = { tokEls, cau };
    datRailDoc(toks.slice(0, 3).map(chuTok).join(''));
    datPhuDe('');
    dangKyDo(c, () => vuaChu(cau, SZ(st.dt ? 34 : 88), 22, khung.clientWidth - (st.dt ? 24 : 120), SZ(st.dt ? 260 : 300)));
    vao(cau, c, 0.08, 0.55);
    if (c.vdAnh) vao(c.vdAnh, c, 0.2, 0.6);
    if (d.meaningVi) moc(c, 'nghia', 4.0, () => datPhuDe(esc(d.meaningVi)));
  }
  function karaokeViDu(m, c, ds) {
    if (!c.vd) return;
    karaokeDong(m, c, ds, c.vd.tokEls);
  }
  function cueViDu(m, id, tt, api, nh, c) {
    if (!c.vd) return;
    const tre = api.tre(tt);
    if (id === 'E1' || id === 'E2' || id === 'E2b') tieuDiem(c.vd.cau, tre);
    else if (id.indexOf('E3') === 0) {
      // ghep: danh dau cac token thuoc nhom ghep (nh.ghep.gan) — sang vang nhe
      const g = nh.ghep;
      if (g && Array.isArray(g.gan)) {
        g.gan.forEach((nhom) => (nhom.tok || []).forEach((i) => { if (c.vd.tokEls[i]) c.vd.tokEls[i].classList.add('b-ghep'); }));
      }
      if (c.vdDai) c.vdDai.forEach((s) => s.classList.add('b-sang'));
    } else if (id.indexOf('E4.') === 0) {
      const k = parseInt(id.split('.')[1], 10);
      if (c.vd.tokEls[k]) tieuDiem(c.vd.tokEls[k], tre, true);
    } else if (id === 'E5') {
      const d = nh.data || {};
      if (d.meaningVi) moc(c, 'nghia', tre, () => datPhuDe(esc(d.meaningVi)));
    }
  }

  // ------------------------------------------------------- HOI THOAI
  function avatarHtml(line, cls) {
    const ten = String((line && line.speaker) || '?').trim();
    const chuDau = esc(ten.slice(0, 1) || '?');
    if (line && line.avatarUrl) return '<span class="' + cls + ' co-anh"><img alt="" src="' + esc(line.avatarUrl) + '" onerror="this.parentNode.classList.remove(\'co-anh\');this.remove();"></span>';
    return '<span class="' + cls + '">' + chuDau + '</span>';
  }
  function dungKaiwaIntro(nh, c, m) {
    const ds = Array.isArray(nh.data) ? nh.data : [];
    const khung = mk('div', 'b-kwi', c.el);
    mk('div', 'b-eyebrow', khung, 'Hội thoại · Dàn nhân vật');
    const nguoi = [];
    ds.forEach((l) => { if (l && !nguoi.some((x) => x.speaker === l.speaker)) nguoi.push(l); });
    const dan = mk('div', 'b-kwi-dan', khung);
    c.kwiNguoi = nguoi.map((l, p) => {
      const o = mk('div', 'b-kwi-nguoi', dan);
      o.innerHTML = avatarHtml(l, 'b-ava') + '<div class="b-kwi-ten"><b>' + esc(l.speaker || '') + '</b>'
        + (l.speakerRole ? '<span>' + esc(l.speakerRole) + '</span>' : '') + '</div>'
        + '<div class="b-kwi-so">' + ds.filter((x) => x.speaker === l.speaker).length + ' lượt</div>';
      vao(o, c, 0.1 + p * 0.12, 0.5);
      return o;
    });
    const cac = mk('div', 'b-kwi-dong', khung);
    c.kwiDong = ds.map((l, i) => {
      const r = mk('div', 'b-kwi-luot', cac);
      r.innerHTML = avatarHtml(l, 'b-ava nho') + '<p>' + (l.tokens || []).map((t, j) => C.tok(t, j, l.tokens)).join('') + '</p>';
      vao(r, c, 0.25 + i * 0.07, 0.45);
      return r;
    });
    datPhuDe(ds.length ? 'Đoạn hội thoại gồm ' + ds.length + ' lượt thoại.' : '');
  }
  function cueKaiwaIntro(m, id, tt, api, nh, c) {
    const tre = api.tre(tt);
    if (id.indexOf('C1.') === 0) {
      const p = parseInt(id.split('.')[1], 10);
      if (c.kwiNguoi && c.kwiNguoi[p]) tieuDiem(c.kwiNguoi[p], tre, true);
    } else if (id.indexOf('C2.') === 0) {
      const i = parseInt(id.split('.')[1], 10);
      if (c.kwiDong && c.kwiDong[i]) tieuDiem(c.kwiDong[i], tre);
    }
  }

  function dongHtml(line) {
    return (line.tokens || []).map((t, j) => {
      return '<span class="b-kw-tok" data-i="' + j + '">' + C.tok(t, j, line.tokens) + '</span>';
    }).join('');
  }
  function dungKaiwaRun(nh, c, m) {
    const ds = Array.isArray(nh.data) ? nh.data : [];
    const khung = mk('div', 'b-kwr', c.el);
    mk('div', 'b-eyebrow', khung, 'Hội thoại');
    const san = mk('div', 'b-kwr-san', khung);
    const trong = mk('div', 'b-kwr-trong', san);
    c.kwr = { ds, trong, dang: -1, dongEls: [], tokEls: [] };
    ds.forEach((l, i) => {
      const r = mk('div', 'b-kwr-dong', trong);
      r.innerHTML = '<div class="b-kwr-dau">' + avatarHtml(l, 'b-ava nho')
        + '<b>' + esc(l.speaker || '') + '</b>' + (l.speakerRole ? '<span>' + esc(l.speakerRole) + '</span>' : '') + '</div>'
        + '<p class="b-kwr-cau">' + dongHtml(l) + '</p>'
        + (l.meaningVi ? '<p class="b-kwr-nghia">' + esc(l.meaningVi) + '</p>' : '');
      c.kwr.dongEls.push(r);
      c.kwr.tokEls.push(Array.from(r.querySelectorAll('.b-kw-tok')));
      vao(r, c, 0.06 + i * 0.05, 0.4);
    });
    datPhuDe('');
    c.kwrChon = (i) => {
      if (!c.kwr || i === c.kwr.dang || !c.kwr.dongEls[i]) return;
      c.kwr.dang = i;
      c.kwr.dongEls.forEach((r, j) => {
        r.classList.toggle('dang', j === i);
        r.classList.toggle('da-qua', j < i);
      });
      const r = c.kwr.dongEls[i];
      const sanEl = r.parentElement.parentElement;
      const dich = Math.max(0, r.offsetTop - sanEl.clientHeight * 0.34);
      if (G && !giam()) G.to(c.kwr.trong, { y: -dich, duration: 0.55, ease: 'power2.out', overwrite: 'auto' });
      else c.kwr.trong.style.transform = 'translateY(' + (-dich) + 'px)';
    };
    if (ds.length) c.kwrChon(0);
  }
  function dungKaiwa(nh, c, m) {
    const d = nh.data || {};
    const khung = mk('div', 'b-kw1', c.el);
    const dau = mk('div', 'b-kw1-dau', khung);
    dau.innerHTML = avatarHtml(d, 'b-ava lon') + '<div><b>' + esc(d.speaker || '') + '</b>'
      + (d.speakerRole ? '<span>' + esc(d.speakerRole) + '</span>' : '') + '</div>';
    const cau = mk('div', 'b-kw1-cau', khung);
    cau.innerHTML = dongHtml(d);
    c.kw1 = { tokEls: Array.from(cau.querySelectorAll('.b-kw-tok')), cau };
    vao(dau, c, 0.05, 0.5); vao(cau, c, 0.14, 0.55);
    dangKyDo(c, () => vuaChu(cau, SZ(st.dt ? 32 : 76), 20, khung.clientWidth - (st.dt ? 24 : 140), SZ(st.dt ? 240 : 280)));
    if (d.meaningVi) {
      datPhuDe('');
      moc(c, 'nghia', 2.6, () => datPhuDe(esc(d.meaningVi)));
    }
    datRailDoc((d.tokens || []).slice(0, 2).map(chuTok).join(''));
  }
  function karaokeDong(m, c, ds, tokEls) {
    if (!tokEls) return;
    const sap = (ds || []).slice().sort((a, b) => (a.T || 0) - (b.T || 0));
    sap.forEach((x, vi) => {
      const e = tokEls[x.i];
      if (!e) return;
      const tre = m.api ? m.api.treT(x.T) : 0;
      const ke = sap[vi + 1];
      const dur = kep((ke ? ke.T - x.T : 0.5), 0.22, 1.4);
      m.api.hen(() => e.classList.add('b-kr'), Math.round(tre * 1000));
      m.api.hen(() => e.classList.remove('b-kr'), Math.round((tre + dur) * 1000));
    });
  }
  function cueKaiwa(m, id, tt, api, nh, c) {
    const tre = api.tre(tt);
    if (id.indexOf('F3.') === 0 && c.kw1) {
      const khoa = (nh.data.tokens || []).map((t, i) => (t.isKeyGrammar ? i : -1)).filter((i) => i >= 0);
      const k = parseInt(id.split('.')[1], 10);
      const idx = khoa[k] != null ? khoa[k] : k;
      if (c.kw1.tokEls[idx]) tieuDiem(c.kw1.tokEls[idx], tre, true);
    } else if (id === 'F4' && c.kw1) {
      const d = nh.data || {};
      if (d.meaningVi) moc(c, 'nghia', tre, () => datPhuDe(esc(d.meaningVi)));
    } else if (id === 'F2' && c.kw1) tieuDiem(c.kw1.cau, tre);
  }

  // ------------------------------------------------------------- QUIZ
  function dungQuiz(nh, c, m) {
    const d = nh.data || {};
    const khung = mk('div', 'b-qz', c.el);
    const trai = mk('div', 'b-qz-trai', khung);
    mk('div', 'b-eyebrow', trai, 'Thử thách · Bài tập');
    const cauHoi = mk('div', 'b-qz-cau', trai, C.jp(String(d.question || '').replace(/^\[(Dễ|Vừa|Khó)\]\s*/, '')));
    const ds = mk('div', 'b-qz-opts', trai);
    c.qzOpts = (d.options || []).map((op, o) => {
      const r = mk('div', 'b-qz-opt', ds);
      r.innerHTML = '<span class="b-qz-key">' + 'ABCD'[o] + '</span><span class="b-qz-op">' + C.jp(String(op)) + '</span>';
      vao(r, c, 0.15 + o * 0.08, 0.45);
      return r;
    });
    const phai = mk('div', 'b-qz-phai', khung);
    mk('div', 'b-qz-slot-nhan', phai, 'Đến lượt bạn trả lời');
    const slot = mk('div', 'b-qz-slot', phai);
    c.qzSlot = slot;
    if (d.hint) moc(c, 'hint', 5.0, () => datPhuDe('<b>Gợi ý:</b> ' + esc(d.hint)));
    c.qz = { cauHoi, dung: null };
    datPhuDe('');
    dangKyDo(c, () => vuaChu(cauHoi, SZ(st.dt ? 26 : 52), 18, trai.clientWidth - 10, SZ(220)));
    vao(cauHoi, c, 0.06, 0.55);
  }
  function cueQuiz(m, id, tt, api, nh, c) {
    if (!c.qz) return;
    const tre = api.tre(tt);
    if (id === 'Q1') tieuDiem(c.qz.cauHoi, tre, true);
    else if (id.indexOf('Q2.') === 0) {
      const o = parseInt(id.split('.')[1], 10);
      if (c.qzOpts && c.qzOpts[o]) tieuDiem(c.qzOpts[o], tre);
    } else if (id === 'Q3') {
      const d = nh.data || {};
      if (d.hint) moc(c, 'hint', tre, () => datPhuDe('<b>Gợi ý:</b> ' + esc(d.hint)));
    }
  }

  // ------------------------------------------------- THE CHUONG / KET BAI
  function dungTheChuong(info, c) {
    const hop = mk('div', 'b-td-khung', c.el);
    mk('div', 'b-eyebrow', hop, 'Chương mới');
    const t = mk('h2', 'b-td-ten', hop, esc(info.tenMoi || ''));
    mk('div', 'b-td-gach', hop);
    const ds = Array.isArray(info.ds) ? info.ds : [];
    const sao = [];
    ds.forEach((x) => {
      const d2 = x && x.data;
      if (!d2) return;
      if (d2.word) sao.push(d2.kanji || d2.word);
      else if (d2.character) sao.push(d2.character);
    });
    if (sao.length) mk('div', 'b-td-sao', hop, 'Trong chương này&nbsp; ' + sao.slice(0, 6).map((s) => '<span lang="ja">' + esc(s) + '</span>').join('<i>·</i>'));
    if (info.tenCu) mk('div', 'b-td-chuong', hop, 'Đã qua · ' + esc(info.tenCu));
    dangKyDo(c, () => vuaChu(t, SZ(st.dt ? 42 : 88), 26, hop.clientWidth - 40, SZ(230)));
    Array.from(hop.children).forEach((e, i) => vao(e, c, giam() ? 0 : 0.1 + i * 0.13, 0.6));
    return true;
  }
  function dungTheXong(info, c) {
    const hop = mk('div', 'b-td-khung', c.el);
    mk('div', 'b-eyebrow', hop, 'Kết thúc buổi học');
    const t = mk('h2', 'b-td-ten', hop, '<span lang="ja">おつかれさまでした</span>');
    mk('div', 'b-td-chuong', hop, 'Hoàn thành' + (info.bai && info.bai.title ? ' · ' + esc(info.bai.title) : ''));
    mk('div', 'b-td-gach', hop);
    const hang = Array.isArray(info.hang) ? info.hang : [];
    if (hang.length) {
      const bang = mk('div', 'b-xong-bang', hop);
      hang.forEach((h, i) => {
        const r = mk('div', 'b-xong-dong', bang);
        r.innerHTML = '<span>' + esc(h.nhan || '') + '</span><b>' + esc(String(h.so != null ? h.so : '')) + '</b>'
          + (h.jp ? '<span lang="ja">' + esc(h.jp) + '</span>' : '');
        vao(r, c, 0.25 + i * 0.1, 0.5);
      });
    }
    const qz = Array.isArray(info.quiz) ? info.quiz : [];
    if (qz.length) {
      const dung = qz.filter((q) => q.ketQua === true || q.ketQua === 'dung' || q.dung).length;
      mk('div', 'b-td-sao', hop, 'Bài tập đúng ' + dung + ' / ' + qz.length);
    }
    dangKyDo(c, () => vuaChu(t, SZ(st.dt ? 38 : 84), 24, hop.clientWidth - 40, SZ(200)));
    return true;
  }

  // --------------------------------------------------------- bang dieu phoi
  const DUNG = {
    vocab: dungTuVung,
    kanji: dungChuHan,
    'grammar-intro': dungMauCau,
    example: dungViDu,
    'kaiwa-intro': dungKaiwaIntro,
    'kaiwa-run': dungKaiwaRun,
    kaiwa: dungKaiwa,
    quiz: dungQuiz,
  };
  const CUE = {
    vocab: cueTuVung,
    kanji: cueChuHan,
    'grammar-intro': cueMauCau,
    example: cueViDu,
    'kaiwa-intro': cueKaiwaIntro,
    kaiwa: cueKaiwa,
    quiz: cueQuiz,
  };

  function taoM(nh, api) {
    const m = {
      nhip_: nh, api, c: null,
      cue(id, tt) {
        if (st.td) moTieuDe();
        const g = CUE[nh.kind];
        if (g && m.c) { try { g(m, id, tt, api, nh, m.c); } catch (e) { console.warn('[b] cue', id, e); } }
      },
      karaoke(ds, o) {
        if (st.td) moTieuDe();
        if (!m.c) return;
        try {
          if (nh.kind === 'example') karaokeViDu(m, m.c, ds);
          else if (nh.kind === 'kaiwa-run' && m.c.kwr) karaokeDong(m, m.c, ds, m.c.kwr.tokEls[m.c.kwr.dang]);
          else if (nh.kind === 'kaiwa' && m.c.kw1) karaokeDong(m, m.c, ds, m.c.kw1.tokEls);
        } catch (e) { console.warn('[b] karaoke', e); }
      },
      loi(doan, raw) { if (st.td) moTieuDe(); },
      dongThoai(line, i) {
        if (m.c && m.c.kwrChon) { try { m.c.kwrChon(i); } catch (e) {} }
      },
      clip(id, info) {},
      ghi(text, kieu) {},
      congCu(name, args, o) {},
      tro(idMuc, o) {},
      het(o) {
        if (m.c) {
          moHet(m.c);
          if (m.c.veNetNgay) m.c.veNetNgay(0);
          m.c.daHet = true;
        }
      },
      oBaiTap(card) {
        return m.c && m.c.qzSlot ? m.c.qzSlot : null;
      },
      vaoCho(card, beat) {
        if (m.c && m.c.el) m.c.el.classList.add('b-den-luot');
      },
      raCho() {
        if (m.c && m.c.el) m.c.el.classList.remove('b-den-luot');
      },
      traLoi(exId, dung) {
        if (!m.c || !m.c.qz) return;
        m.c.el.classList.add(dung ? 'b-qz-dung' : 'b-qz-sai');
        api.hen(() => { if (m.c) m.c.el.classList.remove('b-qz-dung', 'b-qz-sai'); }, 1600);
      },
      roi() {
        if (st.td && st.td.nh === nh) { boCanh(st.td, true); st.td = null; }
        if (m.c) { boCanh(m.c, true); if (st.m === m) st.m = null; }
      },
    };
    return m;
  }

  // Mo the tieu de -> hien canh nhip 0 da dung san ben duoi
  function moTieuDe() {
    if (!st.td) return;
    const td = st.td;
    st.td = null;
    if (st.m && st.m.c && st.m.c !== td) canhVao(st.m.c, 0);   // canhVao tu go canh cu (chinh la td)
    else boCanh(td, true);
  }

  napFont();
  SC.dangKy({
    id: ID,
    ten: 'Điện ảnh',
    can: ['gsap'],
    batDau(lop, ctx) {
      L = lop; C = ctx; G = ctx.gsap;
      doKhung();
      dungKhungNen();
      napFont();
    },
    ketThuc() {
      if (st.canh) boCanh(st.canh, false);
      if (st.td) { boCanh(st.td, false); st.td = null; }
      L = null; C = null; G = null;
      st.m = null; st.nhip = null; st.canh = null; st.tren = null; st.rail = null; st.duoi = null; st.tt = null;
    },
    dungNhip(nh, api) {
      if (!L || !DUNG[nh.kind]) return null;
      doKhung();
      if (st.ngan) return null;              // man hinh qua thap: nhuong the mac dinh
      if (st.td) { boCanh(st.td, false); st.td = null; }   // the tieu de con sot cua nhip truoc
      st.nhip = nh; st.api = api;
      capNhatTren(nh);
      hetTieuDiem(st.canh);
      const m = taoM(nh, api);
      st.m = m;
      const c = canhMoi(api);
      c.nh = nh; c.kind = nh.kind;
      m.c = c;
      try { DUNG[nh.kind](nh, c, m); } catch (e) { console.warn('[b] dung nhip', nh.kind, e); boCanh(c, false); return null; }
      // Nhịp mở đầu buổi: phủ thẻ tiêu đề, giữ tới cue đầu tiên / lời đầu / tối đa 4,5 s
      const moDau = !!(nh.laBatDau && !nh.isResume && nh.i === 0 && nh.bai);
      if (moDau && !st.td) {
        const td = canhMoi(api);
        td.nh = nh; td.kind = 'tieu-de';
        try { dungTieuDe(nh, td); } catch (e) { boCanh(td, false); }
        if (td.el.isConnected) {
          st.td = td;
          canhVao(td, 0);
          api.hen(() => moTieuDe(), 4500);
          return m;
        }
      }
      canhVao(c, 0);
      return m;
    },
    theChuong(info, api) {
      if (!L) return false;
      doKhung();
      if (st.ngan) return false;
      const c = canhMoi(api);
      c.kind = 'chuong';
      let ok = false;
      try { ok = dungTheChuong(info, c); } catch (e) { console.warn('[b] the chuong', e); }
      if (!ok) { boCanh(c, false); return false; }
      canhVao(c, 0);
      datPhuDe('');
      return true;
    },
    theXong(info, api) {
      if (!L) return false;
      doKhung();
      if (st.ngan) return false;
      const c = canhMoi(api);
      c.kind = 'xong';
      let ok = false;
      try { ok = dungTheXong(info, c); } catch (e) { console.warn('[b] the xong', e); }
      if (!ok) { boCanh(c, false); return false; }
      canhVao(c, 0);
      datPhuDe('');
      return true;
    },
    trangThai(text, kieu) {
      if (!st.tt) return;
      if (!text) { st.tt.classList.add('b-cho'); st.tt.textContent = ''; return; }
      st.tt.textContent = text;
      st.tt.classList.remove('b-cho');
    },
    doiCo(lop, ctx) {
      if (!L || !st.nhip || !st.m) return;
      doKhung();
      const nh = st.nhip, m = st.m, api = st.api;
      if (!api || !DUNG[nh.kind]) return;
      capNhatTren(nh);
      // giu the bai tap that neu dang trong luot hoc vien
      let theThat = null;
      if (m.c && m.c.qzSlot) theThat = m.c.qzSlot.querySelector('.sk-cong');
      const c = canhMoi(api);
      c.nh = nh; c.kind = nh.kind;
      st.ngay = true;
      try { DUNG[nh.kind](nh, c, m); moHet(c); } catch (e) { console.warn('[b] doiCo', e); }
      st.ngay = false;
      if (theThat && c.qzSlot) c.qzSlot.appendChild(theThat);
      const cuC = m.c;
      m.c = c;
      canhVao(c, 0);
      if (cuC && cuC !== c) boCanh(cuC, false);
    },
  });
})();
