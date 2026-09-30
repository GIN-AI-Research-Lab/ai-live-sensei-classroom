/**
 * SenseiDoc — MOT cho doc duy nhat cho moi nut loa / bam de nghe / vung boi den trong app.
 *
 * Quy tac giong (xac dinh, khong ngau nhien, khong dung giong trinh duyet lam duong chinh):
 *   a. Bam tren mot CAU THOAI (tab Hoi thoai, san khau kaiwa), tren mot tu thuoc cau thoai, hoac boi den chu nam trong
 *      cau thoai  => giong cua NHAN VAT noi cau do (bang curriculum/nhan-vat.json, js/voices.js) — dung giong da dung khi giang.
 *      Co san clip dung truoc (dialogueAudio) va khop giong + kieu doc thi phat luon; khong thi tong hop NGAY theo yeu cau.
 *   b. Moi thu con lai (tu vung, ngu phap, kanji, kana, tu ghep, bai tap, bat ky vung boi den ngoai hoi thoai)
 *      => giong SENSEI (Charon). Tu vung doc cach doc kana; vi du ngu phap doc tu cac token (dang kana); chu boi den doc nguyen van
 *      (tieng Viet thi Sensei doc tieng Viet).
 *   Tong hop hong: hien thong bao ngan "Chưa tạo được giọng <ten>" roi MOI dung giong trinh duyet (nhan vat giu cao do cua
 *   nhan vat), danh dau la du phong.
 *
 * Am thanh di cung duong voi bai giang (audio-engine.playPcmClip):
 *   - Sensei (kind 'sensei')  : qua analyser + khau-hinh => MEO nhep mieng dung nguyen am; chan dung nhan vat dung yen.
 *   - Nhan vat (kind 'nhan-vat'): khong qua analyser (meo im), avatar-noi.js nhep mieng chan dung nguoi noi.
 *
 * Tong hop: hang doi tuan tu qua VoiceActorPool (mot phien Live khoa giong, giu mo ~60 s de bam nhieu lan khong noi lai),
 * khong bao gio mo phien chat Sensei. Nap truoc (pointerenter / touchstart / focus, tre 150 ms, toi da 2 yeu cau).
 * Bo nho: Map trong RAM + IndexedDB 'sensei_tts' (khoa = giong|kieu|van ban NFKC; LRU ~150 MB / 3000 muc; loi IndexedDB
 * khong bao gio lam hong viec doc). Doi giong / kieu doc tu dong tha bo nho (khoa co ca hai).
 *
 * API: SenseiDoc.doc(text, {targetId, muc, selection, nut, ngonNgu}) -> Promise<boolean>; datNguon({...}) (app.js);
 *      datTongHop(fn) (kiem thu: fn({voice,text,style}) -> Uint8Array PCM 24 kHz); xoaBoNho(); nhatKy.
 */
(function (g) {
  'use strict';

  var V_BO_NHO = 1;                       // tang khi doi chi dan kieu doc: bo nho cu tu bo
  var GIAY_GIU_PHIEN = 60000;
  var TOI_DA_MUC = 3000, TOI_DA_BYTE = 150 * 1024 * 1024;
  var nguon = null;                       // app.js cung cap: keys(), models(), senseiVoice, timDong(id), timMuc(id), clipSan(line), luuClip(...), toast(...), batCo(b)
  var khoaPhu = null;                     // nghe-giong.js: cung cap khoa khi trang mo voi ?noLive (app.js khong co khoa)
  var fake = null;                        // ham tong hop gia (kiem thu)
  var nhatKy = [];
  var lan = 0;                            // so lan bam moi nhat — ket qua cu khong duoc phat
  var dangNut = null;

  function ghi(o) { o.luc = Date.now(); nhatKy.push(o); if (nhatKy.length > 200) nhatKy.shift(); return o; }

  // ---------------------------------------------------------------------------------------------- van ban
  function chuanHoa(s) {
    s = String(s == null ? '' : s);
    try { s = s.normalize('NFKC'); } catch (e) {}
    return s.replace(/\s+/g, ' ').trim();
  }
  function ngonNguCua(s) {
    if (/[぀-ヿ㐀-鿿]/.test(s)) return 'ja';
    return 'vi';
  }
  function khoaBoNho(voice, style, text) { return voice + '|' + (style || '') + '|' + chuanHoa(text); }

  // ---------------------------------------------------------------------------------------------- IndexedDB (moi lenh trong try/catch)
  var db = null, dbCho = null, chiMuc = null;       // chiMuc: Map k -> {bytes, ts}
  var ram = new Map();                              // k -> Uint8Array
  var ramByte = 0;
  function moDb() {
    if (dbCho) return dbCho;
    dbCho = new Promise(function (ok) {
      try {
        if (!g.indexedDB) return ok(null);
        var rq = g.indexedDB.open('sensei_tts', 1);
        rq.onupgradeneeded = function () {
          var d = rq.result;
          if (!d.objectStoreNames.contains('clips')) d.createObjectStore('clips', { keyPath: 'k' });
          if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta', { keyPath: 'k' });
        };
        rq.onsuccess = function () { db = rq.result; ok(db); };
        rq.onerror = function () { ok(null); };
        rq.onblocked = function () { ok(null); };
      } catch (e) { ok(null); }
    });
    return dbCho;
  }
  function giaoDich(ten, che, fn) {
    return moDb().then(function (d) {
      if (!d) return null;
      return new Promise(function (ok) {
        try {
          var tx = d.transaction(ten, che), kq = null;
          fn(tx, function (v) { kq = v; });
          tx.oncomplete = function () { ok(kq); };
          tx.onerror = tx.onabort = function () { ok(null); };
        } catch (e) { ok(null); }
      });
    }).catch(function () { return null; });
  }
  function napChiMuc() {
    if (chiMuc) return Promise.resolve(chiMuc);
    chiMuc = new Map();
    return giaoDich('meta', 'readonly', function (tx, xong) {
      var rq = tx.objectStore('meta').openCursor();
      rq.onsuccess = function () { var c = rq.result; if (c) { chiMuc.set(c.value.k, { bytes: c.value.bytes, ts: c.value.ts, v: c.value.v }); c.continue(); } else xong(true); };
    }).then(function () { return chiMuc; });
  }
  function layBoNho(voice, style, text) {
    var k = khoaBoNho(voice, style, text);
    if (ram.has(k)) return Promise.resolve(ram.get(k));
    return napChiMuc().then(function (ci) {
      var m = ci.get(k);
      if (!m || m.v !== V_BO_NHO) return null;
      return giaoDich('clips', 'readonly', function (tx, xong) {
        var rq = tx.objectStore('clips').get(k);
        rq.onsuccess = function () { xong(rq.result || null); };
      }).then(function (r) {
        if (!r || !r.pcm) return null;
        var u8 = new Uint8Array(r.pcm);
        ramDat(k, u8);
        giaoDich('meta', 'readwrite', function (tx) { tx.objectStore('meta').put({ k: k, bytes: m.bytes, ts: Date.now(), v: V_BO_NHO, voice: r.voice, style: r.style, len: r.len }); });
        m.ts = Date.now();
        return u8;
      });
    });
  }
  function ramDat(k, u8) {
    if (ram.has(k)) ramByte -= ram.get(k).length;
    ram.set(k, u8); ramByte += u8.length;
    while (ramByte > 40 * 1024 * 1024 && ram.size > 1) {      // RAM: toi da ~40 MB, bo muc cu nhat
      var cu = ram.keys().next().value;
      ramByte -= ram.get(cu).length; ram.delete(cu);
    }
  }
  function luuBoNho(voice, style, text, u8) {
    var k = khoaBoNho(voice, style, text);
    ramDat(k, u8);
    return napChiMuc().then(function (ci) {
      var copy = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
      var meta = { k: k, bytes: u8.length, ts: Date.now(), v: V_BO_NHO, voice: voice, style: style || '', len: u8.length / 2 / 24000 };
      ci.set(k, { bytes: meta.bytes, ts: meta.ts, v: V_BO_NHO });
      return giaoDich('clips', 'readwrite', function (tx) { tx.objectStore('clips').put({ k: k, pcm: copy, voice: voice, style: style || '', len: meta.len, ts: meta.ts, v: V_BO_NHO }); })
        .then(function () { return giaoDich('meta', 'readwrite', function (tx) { tx.objectStore('meta').put(meta); }); })
        .then(function () { return tia(ci); });
    }).catch(function () {});
  }
  function tia(ci) {   // LRU: bo muc cu nhat khi vuot 3000 muc hoac 150 MB
    var tong = 0; ci.forEach(function (m) { tong += m.bytes; });
    if (ci.size <= TOI_DA_MUC && tong <= TOI_DA_BYTE) return null;
    var ds = Array.from(ci.entries()).sort(function (a, b) { return a[1].ts - b[1].ts; }), bo = [];
    for (var i = 0; i < ds.length && (ci.size - bo.length > TOI_DA_MUC * 0.9 || tong > TOI_DA_BYTE * 0.9); i++) { bo.push(ds[i][0]); tong -= ds[i][1].bytes; }
    bo.forEach(function (k) { ci.delete(k); ram.delete(k); });
    return giaoDich('clips', 'readwrite', function (tx) { bo.forEach(function (k) { tx.objectStore('clips').delete(k); }); })
      .then(function () { return giaoDich('meta', 'readwrite', function (tx) { bo.forEach(function (k) { tx.objectStore('meta').delete(k); }); }); });
  }
  function xoaBoNho() {
    ram.clear(); ramByte = 0; chiMuc = new Map();
    return giaoDich('clips', 'readwrite', function (tx) { tx.objectStore('clips').clear(); })
      .then(function () { return giaoDich('meta', 'readwrite', function (tx) { tx.objectStore('meta').clear(); }); });
  }

  // ---------------------------------------------------------------------------------------------- tong hop (hang doi tuan tu)
  var phien = null;             // { pool, key, model, voice, hen }
  function dongPhien() {
    if (!phien) return;
    clearTimeout(phien.hen);
    try { phien.pool.closeAll(); } catch (e) {}
    phien = null;
  }
  function giuPhien() {
    clearTimeout(phien.hen);
    phien.hen = setTimeout(dongPhien, GIAY_GIU_PHIEN);
  }
  async function tongHopThat(voice, text, chiDan) {
    var keys = nguon && nguon.keys ? nguon.keys() : [];
    if (!keys.length && khoaPhu) { try { keys = khoaPhu() || []; } catch (e) { keys = []; } }
    var models = nguon && nguon.models ? nguon.models() : (g.SENSEI_MODELS ? [g.SENSEI_MODELS.actor, g.SENSEI_MODELS.actorFallback] : []);
    if (!keys.length) throw new Error('chưa có khóa API');
    if (!g.VoiceActorPool) throw new Error('thiếu voice-actors.js');
    var loi = 'không rõ';
    for (var ki = 0; ki < keys.length; ki++) {
      for (var mi = 0; mi < models.length; mi++) {
        // chi MOT phien doc: doi giong / key / model thi dong phien cu truoc
        if (phien && (phien.key !== keys[ki] || phien.model !== models[mi] || phien.voice !== voice)) dongPhien();
        if (!phien) phien = { pool: new g.VoiceActorPool({ apiKey: keys[ki], model: models[mi] }), key: keys[ki], model: models[mi], voice: voice, hen: 0 };
        for (var lanThu = 1; lanThu <= 2; lanThu++) {
          var r = await phien.pool.speak(voice, text, chiDan || '');
          if (r && r.ok) { giuPhien(); return r.pcm; }
          loi = (r && r.reason) || loi;
          if (/quota|RESOURCE_EXHAUSTED|\b429\b/i.test(loi)) break;
          try { phien.pool.close(voice); } catch (e) {}
          await new Promise(function (ok) { setTimeout(ok, 700 * lanThu); });
        }
        dongPhien();
      }
    }
    throw new Error(String(loi).replace(/key=[^&\s"']+/gi, 'key=***'));
  }
  // Hang doi uu tien: yeu cau BAM (uu tien 0) di truoc nap truoc (uu tien 1). Mot cong viec chay mot luc.
  var hang = [], dangChay = false, dangBay = {};
  function tongHop(voice, style, text, chiDan, uuTien) {
    var k = khoaBoNho(voice, style, text);
    if (dangBay[k]) return dangBay[k].p;
    var m = { k: k, uuTien: uuTien, huy: false }, p = new Promise(function (ok, hong) { m.ok = ok; m.hong = hong; });
    m.p = p;
    m.chay = async function () {
      var hit = await layBoNho(voice, style, text).catch(function () { return null; });
      if (hit) { ghi({ loai: 'bo-nho', voice: voice, style: style, text: text }); return hit; }
      var pcm;
      if (fake) pcm = await fake({ voice: voice, text: chuanHoa(text), style: style || '', chiDan: chiDan || '' });
      else pcm = await tongHopThat(voice, text, chiDan);
      ghi({ loai: 'tong-hop', voice: voice, style: style, text: text });
      if (pcm && pcm.length) luuBoNho(voice, style, text, pcm);
      return pcm;
    };
    dangBay[k] = m;
    hang.push(m);
    hang.sort(function (a, b) { return a.uuTien - b.uuTien; });
    chayHang();
    return p;
  }
  async function chayHang() {
    if (dangChay) return;
    dangChay = true;
    try {
      while (hang.length) {
        var m = hang.shift();
        try { m.ok(await m.chay()); } catch (e) { m.hong(e); }
        delete dangBay[m.k];
      }
    } finally { dangChay = false; }
  }

  // ---------------------------------------------------------------------------------------------- quyet dinh ai doc, doc gi
  function dongTuPhanTu(el) {
    if (!el || !el.closest) return null;
    var e = el.nodeType === 1 ? el : el.parentElement;
    if (!e) return null;
    var h = e.closest('[data-dong]');
    if (h) return h.getAttribute('data-dong');
    var b = e.closest('.kw-bubble[id]');
    if (b) return b.id;
    var s = e.closest('.sk-ht-bong[id^="st-"]');
    if (s) return s.id.slice(3);
    return null;
  }
  function vanBanBoiDen() {
    try {
      var sel = g.getSelection();
      if (!sel || !sel.rangeCount || sel.isCollapsed) return { text: '', node: null };
      var frag = sel.getRangeAt(0).cloneContents(), tmp = document.createElement('div');
      tmp.appendChild(frag);
      tmp.querySelectorAll('rt, rp, .reading-badge-indicator').forEach(function (n) { n.remove(); });
      var t = tmp.textContent || sel.toString();
      return { text: chuanHoa(t), node: sel.anchorNode, node2: sel.focusNode };
    } catch (e) { return { text: '', node: null }; }
  }
  function tokenKana(t) { return t.furigana || t.text || t.kanji || ''; }
  function cauTuToken(ds) { return (ds || []).map(function (t) { return t.text || t.kanji || ''; }).join(''); }
  function cauThoai(line) { return (line.tokens || []).map(function (t) { return t.kanji || t.text; }).join(''); }
  function docKanji(k) {
    if (!k) return '';
    if (k.loai === 'kana' || !(k.kunyomi && k.kunyomi.length) && !(k.onyomi && k.onyomi.length)) return k.character;
    var kun = (k.kunyomi || [])[0];
    if (kun) return String(kun).replace(/[.\-（(].*$/, '').replace(/\./g, '');
    var on = String((k.onyomi || [])[0] || '').split(/[ （(]/)[0];
    return on || k.character;
  }
  function giongSensei() { return (nguon && nguon.senseiVoice) || 'Charon'; }
  function tenNhanVat(id, line) {
    try { var V = g.SenseiVoices; var tt = V.thongTin(line.speaker, line.speakerGender); return tt.ten || line.speaker || id; } catch (e) { return (line && line.speaker) || id || ''; }
  }

  /** Tra ve ke hoach doc: { kind, voice, nhanVat, lineId, line, text, style:{key,chiDan}, ngonNgu, the, tenGiong, targetId, caCau } */
  function giaiQuyet(text, o) {
    o = o || {};
    var V = g.SenseiVoices, se = g.__slideEngine;
    var id = o.targetId || o.muc || null, dong = null, caCau = false, muc = null, doc = chuanHoa(text);
    // 1. cau thoai qua id (ca cau hoac mot token cua cau)
    if (id && nguon && nguon.timDong) { var t = nguon.timDong(id); if (t) { dong = t.line; caCau = !!t.caCau; } }
    // 2. vung boi den nam trong cau thoai
    var bd = null;
    if (!dong && o.selection) {
      bd = vanBanBoiDen();
      if (bd.text) doc = bd.text;
      var lid = dongTuPhanTu(bd.node) || dongTuPhanTu(bd.node2);
      if (lid && nguon && nguon.timDong) { var t2 = nguon.timDong(lid); if (t2) { dong = t2.line; caCau = false; } }
    }
    // 3. muc khac (tu vung, kanji, vi du...) de doc dung cach doc
    if (!dong && id && se && se.findItemById) { try { muc = se.findItemById(id); } catch (e) { muc = null; } }
    if (dong) {
      var voice = V.voiceFor(dong.speaker, dong.speakerGender), ttin = V.thongTin(dong.speaker, dong.speakerGender);
      var van = caCau ? cauThoai(dong) : (id ? '' : doc);
      if (!caCau && id && nguon.timDong) {
        var tk = (dong.tokens || []).filter(function (x) { return x.id === id; })[0];
        van = tk ? tokenKana(tk) : doc;
      }
      if (!van) van = doc;
      var kieu = caCau ? V.kieuDoc(van, dong.emotion) : { key: '', chiDan: '' };
      return { kind: 'nhan-vat', voice: voice, nhanVat: ttin.id || '', lineId: dong.id, line: dong, text: van, style: kieu, ngonNgu: 'ja',
        the: dong.emotion || '', tenGiong: tenNhanVat(ttin.id, dong), targetId: id, caCau: caCau };
    }
    var van2 = doc;
    if (muc) {
      var d = muc.data || {};
      if (muc.type === 'vocab') van2 = d.furigana || d.word || doc;
      else if (muc.type === 'kanji') van2 = docKanji(d) || doc;
      else if (muc.type === 'example') van2 = cauTuToken(d.tokens) || doc;
      else if (muc.type === 'token') van2 = tokenKana(d) || doc;
    }
    return { kind: 'sensei', voice: giongSensei(), nhanVat: '', lineId: null, line: null, text: van2, style: { key: '', chiDan: '' },
      ngonNgu: o.ngonNgu || ngonNguCua(van2), the: '', tenGiong: 'Sensei', targetId: id, caCau: false };
  }

  // ---------------------------------------------------------------------------------------------- phat
  function dungTatCa() {
    var ae = g.__audioEngine;
    try { if (ae) ae.stopPlayback(true); } catch (e) {}
    try { if (g.speechSynthesis) g.speechSynthesis.cancel(); } catch (e) {}
  }
  function chiBao(nut, bat) {
    if (dangNut && dangNut !== nut) { dangNut.removeAttribute('aria-busy'); dangNut.classList.remove('sd-tai'); }
    dangNut = bat ? nut : null;
    if (!nut) return;
    if (bat) { nut.setAttribute('aria-busy', 'true'); nut.classList.add('sd-tai'); }
    else { nut.removeAttribute('aria-busy'); nut.classList.remove('sd-tai'); }
  }
  function nutTuSuKien(o) {
    if (o && o.nut) return o.nut;
    try {
      var ev = g.event, t = ev && ev.target;
      return t && t.closest ? t.closest('button, .jp-tok, .icon-btn, [data-doc]') : null;
    } catch (e) { return null; }
  }
  function chenCss() {
    if (document.getElementById('sd-css')) return;
    var st = document.createElement('style'); st.id = 'sd-css';
    st.textContent = '@keyframes sd-nhap{0%,100%{opacity:1}50%{opacity:.45}}.sd-tai{animation:sd-nhap .9s ease-in-out infinite;cursor:progress}'
      + '@media (prefers-reduced-motion:reduce){.sd-tai{animation:none;opacity:.55}}';
    document.head.appendChild(st);
  }

  function giongTrinhDuyet(plan) {
    return new Promise(function (ok) {
      try {
        var ss = g.speechSynthesis;
        if (!ss || !plan.text) return ok(false);
        ss.cancel();
        var u = new SpeechSynthesisUtterance(plan.text);
        u.lang = plan.ngonNgu === 'vi' ? 'vi-VN' : 'ja-JP';
        if (plan.kind === 'nhan-vat' && g.SenseiVoices && plan.line) {
          var p = g.SenseiVoices.browserVoice(plan.line.speaker, plan.line.speakerGender);
          u.rate = p.rate; u.pitch = p.pitch; if (p.voice) u.voice = p.voice;
        } else {
          u.rate = plan.ngonNgu === 'vi' ? 1.0 : 0.9;
          var vs = ss.getVoices().filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf(plan.ngonNgu === 'vi' ? 'vi' : 'ja') === 0; });
          if (vs.length) u.voice = vs[0];
        }
        var xong = false, fin = function (r) { if (!xong) { xong = true; ok(r); } };
        u.onend = function () { fin(true); }; u.onerror = function () { fin(false); };
        setTimeout(function () { fin(true); }, Math.max(3000, plan.text.length * 260));
        ss.speak(u);
      } catch (e) { ok(false); }
    });
  }

  async function phatPlan(plan, tuDo) {
    var ae = g.__audioEngine, lanNay = ++lan;
    var o = tuDo || {};
    var nut = nutTuSuKien(o);
    chenCss();
    dungTatCa();
    if (g.SenseiAvatarNoi && g.SenseiAvatarNoi.khiDung) { try { g.SenseiAvatarNoi.khiDung(); } catch (e) {} }
    var muc = plan.targetId && g.__slideEngine && g.__slideEngine.prepareReadingTarget ? plan.targetId : null;
    if (muc) { try { g.__slideEngine.prepareReadingTarget(muc); } catch (e) {} }
    chiBao(nut, true);
    var xong = function () {
      chiBao(nut, false);
      if (nguon && nguon.batCo) { try { nguon.batCo(false); } catch (e) {} }
      if (muc && g.__slideEngine) {
        try {
          var se = g.__slideEngine;
          if (se.activeFocusId === muc) { var el = se.resolveElement(muc), b = el && el.querySelector('.reading-badge-indicator'); if (b) b.remove(); }
          else se.clearFocusClasses(muc);
        } catch (e) {}
      }
    };
    var ket = ghi({ loai: 'doc', kind: plan.kind, voice: plan.voice, text: plan.text, style: plan.style.key, lineId: plan.lineId, nhanVat: plan.nhanVat, nguon: '', fallback: false });
    try {
      var pcm = null;
      if (plan.kind === 'nhan-vat' && plan.caCau && nguon && nguon.clipSan) {
        try { pcm = nguon.clipSan(plan.line); } catch (e) { pcm = null; }
        if (pcm) ket.nguon = 'clip-san';
      }
      if (!pcm) {
        try {
          pcm = await tongHop(plan.voice, plan.style.key, plan.text, plan.style.chiDan, 0);
          if (!ket.nguon) ket.nguon = 'tong-hop/bo-nho';
        } catch (e) {
          // tong hop hong — thu lai khong chi dan neu co chi dan (chi dan co the lam hong cau)
          if (plan.style.chiDan && !/quota|429|khóa|key/i.test(String(e && e.message))) {
            try { pcm = await tongHop(plan.voice, '', plan.text, '', 0); ket.nguon = 'trung-tinh'; } catch (e2) { pcm = null; }
          }
          if (!pcm) ket.loi = String(e && e.message || e).replace(/key=[^&\s"']+/gi, 'key=***').slice(0, 200);
        }
      }
      if (lanNay !== lan) { xong(); return false; }          // co lan bam moi hon
      if (!pcm) {
        ket.fallback = true;
        if (nguon && nguon.toast) nguon.toast('Chưa tạo được giọng ' + plan.tenGiong + ' — tạm dùng giọng trình duyệt.', 'info', 3500);
        if (nguon && nguon.batCo && plan.kind === 'nhan-vat') nguon.batCo(true);
        if (plan.kind === 'nhan-vat' && g.SenseiAvatarNoi && g.SenseiAvatarNoi.phatGia) {
          g.SenseiAvatarNoi.phatGia({ lineId: plan.lineId, nhanVat: plan.nhanVat, text: plan.text, the: plan.the });
        }
        var okB = await giongTrinhDuyet(plan);
        if (g.SenseiAvatarNoi && g.SenseiAvatarNoi.khiDung) g.SenseiAvatarNoi.khiDung();
        xong();
        return okB;
      }
      if (plan.kind === 'nhan-vat' && plan.caCau && nguon && nguon.luuClip) { try { nguon.luuClip(plan.line, pcm, plan.voice, plan.style.key); } catch (e) {} }
      if (nguon && nguon.batCo && plan.kind === 'nhan-vat') nguon.batCo(true);
      var meta = plan.kind === 'nhan-vat'
        ? { kind: 'nhan-vat', lineId: plan.lineId, nhanVat: plan.nhanVat, text: plan.text, the: plan.caCau ? plan.the : '' }
        : { kind: 'sensei', text: plan.text };
      chiBao(nut, false);
      await ae.playPcmClip(pcm, meta);
      xong();
      return true;
    } catch (e) {
      xong();
      ket.loi = String(e && e.message || e);
      return false;
    }
  }

  // ---------------------------------------------------------------------------------------------- nap truoc khi re chuot / cham / focus
  var tienDo = { hen: 0, nut: null, dem: 0 };
  function lenhCuaNut(el) {
    // nut tao boi slide-engine: onclick="window.playSpeech('van ban', 'id')" — doc hai chuoi (khong eval)
    var s = el && el.getAttribute && el.getAttribute('onclick');
    if (!s || s.indexOf('playSpeech(') < 0) return null;
    var i = s.indexOf('playSpeech(') + 11, args = [];
    for (var n = 0; n < 2; n++) {
      while (i < s.length && /[\s,]/.test(s[i])) i++;
      var q = s[i];
      if (q !== "'" && q !== '"') break;
      var out = ''; i++;
      while (i < s.length && s[i] !== q) { if (s[i] === '\\' && i + 1 < s.length) i++; out += s[i]; i++; }
      i++; args.push(out);
    }
    var mm = /muc:\s*'([^']*)'/.exec(s);
    return args.length ? { text: args[0], id: (args[1] && args[1] !== 'null' ? args[1] : null) || (mm && mm[1]) || null } : null;
  }
  function napTruoc(e) {
    if (!nguon) return;
    var el = e.target && e.target.closest ? e.target.closest('[onclick*="playSpeech"]') : null;
    if (!el || el === tienDo.nut) return;
    tienDo.nut = el;
    clearTimeout(tienDo.hen);
    tienDo.hen = setTimeout(function () {
      var l = lenhCuaNut(el);
      if (!l || tienDo.dem >= 2) return;
      try {
        var plan = giaiQuyet(l.text, { targetId: l.id });
        if (!plan.text || (!fake && !(nguon.keys && nguon.keys().length) && !khoaPhu)) return;
        tienDo.dem++;
        tongHop(plan.voice, plan.style.key, plan.text, plan.style.chiDan, 1).catch(function () {}).then(function () { tienDo.dem = Math.max(0, tienDo.dem - 1); });
        ghi({ loai: 'nap-truoc', voice: plan.voice, text: plan.text });
      } catch (err) {}
    }, 150);
  }
  ['pointerenter', 'touchstart', 'focusin'].forEach(function (ev) { document.addEventListener(ev, napTruoc, { capture: true, passive: true }); });

  // ---------------------------------------------------------------------------------------------- API
  var API = {
    /** Doc mot doan van ban theo quy tac giong. opts: { targetId, muc, selection, nut, ngonNgu } */
    doc: function (text, opts) {
      opts = opts || {};
      var V = g.SenseiVoices;
      var vao = function () { var plan = giaiQuyet(text, opts); if (!plan.text) return false; return phatPlan(plan, opts); };
      return (V && V.ready ? V.ready : Promise.resolve()).then(vao, vao);
    },
    /** Doc theo ke hoach dung san (nghe-giong.js: { kind, voice, text, nhanVat, styleKey, tenGiong, ngonNgu }) */
    docKe: function (ke) {
      var plan = { kind: ke.kind || 'sensei', voice: ke.voice || giongSensei(), nhanVat: ke.nhanVat || '', lineId: ke.lineId || null, line: ke.line || null,
        text: chuanHoa(ke.text), style: { key: ke.styleKey || '', chiDan: ke.chiDan || '' }, ngonNgu: ke.ngonNgu || ngonNguCua(ke.text), the: '', tenGiong: ke.tenGiong || ke.voice, targetId: null, caCau: false };
      return phatPlan(plan, { nut: ke.nut });
    },
    giaiQuyet: giaiQuyet,
    /** app.js cung cap nguon du lieu: keys(), models(), senseiVoice, timDong(id), clipSan(line), luuClip(line,pcm,voice,key), toast(), batCo(b) */
    datNguon: function (n) { nguon = n; },
    san: function () { return !!nguon; },
    datTongHop: function (fn) { fake = fn || null; },
    datKhoaPhu: function (fn) { khoaPhu = fn || null; },
    /** Bo nho cho bai giang: bai giang kiem tra bo nho truoc khi goi API (cung khoa voice|kieu|van ban) */
    layBoNho: layBoNho,
    luuBoNho: luuBoNho,
    xoaBoNho: xoaBoNho,
    dung: function () { lan++; dungTatCa(); chiBao(null, false); },
    nhatKy: nhatKy,
    khoa: khoaBoNho,
    _t: { lenhCuaNut: lenhCuaNut, vanBanBoiDen: vanBanBoiDen, dongTuPhanTu: dongTuPhanTu, tongHop: tongHop, ram: ram },
  };
  g.SenseiDoc = API;
})(typeof window !== 'undefined' ? window : globalThis);
