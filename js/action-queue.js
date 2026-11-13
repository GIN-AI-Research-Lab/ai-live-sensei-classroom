/**
 * Action Queue - AI Live Sensei Classroom (P1b)
 *
 * Hang doi hanh dong DOM cho DUONG TRUC TIEP (ngoai gio giang): tool trinh
 * dien cua Sensei (doi slide, roi den, bang loi, mat meo...) thay vi thi
 * hanh NGAY khi WebSocket message toi — luc tieng cua cau do con nam trong
 * hang doi phat — thi duoc neo vao mot moc tren truc AudioContext (atCtx)
 * va chi chay khi dong ho "luc dang nghe thay" (audioEngine.heardTime())
 * di qua moc do. Khi dang giang, san khau (motion.js) da co bo cue rieng;
 * hang doi nay chi phuc vu duong con lai.
 *
 * Item: { id, atCtx, run, via } — epoch do hang doi tu gan luc push:
 * moi lan huyLuot() (hoc vien ngat loi / gui luot moi) epoch tang va toan
 * bo item dang cho bi huy, item cua luot cu khong bao gio chay nua du
 * dispatcher co tick tre.
 */
(function () {
  'use strict';

  // Chay som toi da 60ms truoc moc: mat vua kip thay hanh dong dung luc tieng toi,
  // cung triet ly LEAD cua motion nhung nho hon vi duong truc tiep neo vao CUOI
  // hang doi (diem bat dau doan noi tiep theo), khong phai giua doan.
  var LEAD = 0.06;
  var KY_TICK_MS = 25;   // dispatcher tu hen lai moi 25-30ms khi con item

  var epoch = 0;
  var hang = [];         // sap xep tang dan theo atCtx
  var henGio = null;     // id setTimeout cua dispatcher (null = dang dung)
  var dem = { daNhan: 0, daChay: 0, daHuy: 0 };
  var _idTuTang = 0;

  /** Dong ho nghe thay: uu tien audioEngine.heardTime() (truc AudioContext) */
  function dongHoNghe() {
    var ae = window.__audioEngine;
    if (ae && typeof ae.heardTime === 'function') {
      try { return ae.heardTime(); } catch (e) {}
    }
    // Chua co engine/context: truc tuong — chi dung duoc voi atCtx cung truc tuong
    return performance.now() / 1000;
  }

  function chayItem(it) {
    dem.daChay++;
    try { it.run(); }
    catch (e) { console.warn('[ActionQueue] Loi khi thi hanh hanh dong', it.id, e); }
  }

  function batDispatcher() {
    if (henGio !== null) return;
    henGio = setTimeout(tick, KY_TICK_MS);
  }

  function tick() {
    henGio = null;
    var bay = dongHoNghe();
    while (hang.length && hang[0].atCtx - LEAD <= bay) {
      var it = hang.shift();
      // Kiem epoch NGAY TRUOC khi chay: luot bi huy giua hai tick thi item chet o day
      if (it.epoch !== epoch) { dem.daHuy++; continue; }
      chayItem(it);
    }
    if (hang.length) batDispatcher();
  }

  /**
   * Them hanh dong vao hang doi. Tra ve false neu item khong hop le.
   * Neu moc atCtx da o qua khu theo dong ho nghe thay (hang doi tieng rong,
   * Sensei khong dang noi) thi chay NGAY dong bo — khong cho vo ich.
   */
  function push(item) {
    if (!item || typeof item.run !== 'function') return false;
    var it = {
      id: item.id || ('aq-' + (++_idTuTang)),
      epoch: epoch,
      atCtx: (typeof item.atCtx === 'number' && isFinite(item.atCtx)) ? item.atCtx : 0,
      run: item.run,
      via: item.via || 'qEnd',
    };
    dem.daNhan++;
    if (dongHoNghe() >= it.atCtx - LEAD) { chayItem(it); return true; }
    // Chen giu thu tu tang dan theo atCtx
    var i = hang.length;
    while (i > 0 && hang[i - 1].atCtx > it.atCtx) i--;
    hang.splice(i, 0, it);
    batDispatcher();
    return true;
  }

  /** Huy toan bo hanh dong dang cho cua luot hien tai (barge-in / luot moi) */
  function huyLuot() {
    epoch++;
    dem.daHuy += hang.length;
    hang = [];
    if (henGio !== null) { clearTimeout(henGio); henGio = null; }
  }

  /**
   * Huy MOT hanh dong dang cho theo id (da chay roi / khong co thi tra false).
   * App dung cho cac muc focus theo loi giang: clearPendingFocus() phai don
   * duoc dung muc cua no ma khong dung vao tool dang cho cua luot.
   */
  function huyTheoId(id) {
    for (var i = 0; i < hang.length; i++) {
      if (hang[i].id === id) {
        hang.splice(i, 1);
        dem.daHuy++;
        if (!hang.length && henGio !== null) { clearTimeout(henGio); henGio = null; }
        return true;
      }
    }
    return false;
  }

  function stats() {
    return {
      epoch: epoch,
      dangCho: hang.length,
      daNhan: dem.daNhan,
      daChay: dem.daChay,
      daHuy: dem.daHuy,
    };
  }

  window.SenseiActionQueue = { push: push, huyLuot: huyLuot, huyTheoId: huyTheoId, stats: stats };
})();
