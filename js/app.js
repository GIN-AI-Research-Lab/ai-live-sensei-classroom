/**
 * Main Application Controller - AI Live Sensei Classroom
 * Điều phối Slide Engine, Audio Engine, Gemini Live WebSocket và tương tác UI
 * Hỗ trợ chế độ Auto-Lecture (Tự động dạy hết bài) và bảo đảm nhất quán giọng đọc
 */

/* ==========================================================================
   LUOI AN TOAN KHOI DONG

   Ca phan khoi dong nam trong mot ham async duy nhat, ma lenh hien danh sach
   bai hoc lai o gan cuoi. Mot loi o giua la trang trang, khong loi bao —
   toast loi da duoc tat de khong lam phien nguoi hoc.

   Day la truong hop DUY NHAT bat buoc phai hien loi ra man hinh: khong co no
   thi khong dung duoc gi ca, im lang chi khien nguoi dung tuong may hong.
   ========================================================================== */
function baoHongKhoiDong(loi, o) {
  console.error('[khoi dong]', o || '', loi);
  try {
    if (window.__errors) window.__errors();   // van ghi vao nhat ky neu co
  } catch (e) {}

  if (document.getElementById('bangHongKhoiDong')) return;
  const el = document.createElement('div');
  el.id = 'bangHongKhoiDong';
  el.className = 'hong-khoi-dong';
  // Chi tiet ky thuat (ten model, key, thong diep loi goc) CHI ghi vao console
  // va nhat ky noi bo — man hinh chi hien mot cau chung chung, khong lo gi ca.
  el.innerHTML =
    '<strong>Lớp học chưa mở được</strong>'
    + '<span>Đã có trục trặc khi khởi động. Vui lòng tải lại trang.</span>'
    + '<button type="button">Tải lại trang</button>';
  el.querySelector('button').addEventListener('click', () => location.reload());
  (document.body || document.documentElement).appendChild(el);
}

// Khoi dong xong (cuoi khoi try ben duoi) thi thoi hien bang hong: loi le
// ve sau (mot cu bam, may khong co WebGL...) khong phai "lop chua mo".
let daKhoiDong = false;

window.addEventListener('error', (e) => {
  // Tep script tai thieu cung vao day (e.target la the script, khong co message).
  // Script nap SAU app.js chi con nhan vat hoat hinh (tuy chon) — tep loi thi bo
  // qua, khong chan lop; tep loi chinh da co canh gac trong index.html bao.
  if (e.target && e.target.tagName === 'SCRIPT') {
    console.warn('[khoi dong] không tải được', e.target.src || 'một tệp mã');
    return;
  }
  if (!e.error) return;
  if (daKhoiDong) console.error('[loi sau khoi dong]', e.error);
  else baoHongKhoiDong(e.error, 'runtime');
}, true);

window.addEventListener('unhandledrejection', (e) => {
  if (daKhoiDong) console.error('[loi sau khoi dong]', e.reason);
  else baoHongKhoiDong(e.reason, 'promise');
});

document.addEventListener('DOMContentLoaded', async () => {
 try {
  // 1. Khởi tạo Modules
  const curriculumLoader = new CurriculumLoader();
  await curriculumLoader.init();

  const slideEngine = new SlideEngine(curriculumLoader);
  // Ten cap do hien cho nguoi hoc (KANA -> "Nhập môn"), ten chuong chu, nhan dien muc kana:
  // mot cho duy nhat (curriculum-loader.js, nap cung tep voi CurriculumLoader nen luon co).
  const CAP_DO = window.SenseiCapDo;


  // 2. DOM Elements
  // Key doc tu .env qua env.js — khong con nhap tay tren UI.
  //   key1 -> phien Sensei (uu tien)
  //   key2 -> dan dien vien long tieng + soan de (uu tien)
  //   key3, key4 -> du phong, dung khi cac key tren rong hoac het quota
  // Tach TAI KHOAN de khong tranh suat phien Live cua nhau (loi ma 1000);
  // co them key3/key4 thi vong lap thu lai (soanDeBangAI, dan dien vien)
  // co nhieu suat quota hon de xoay vong khi mot vai key bi 429.
  // ?noLive tren dia chi trang (kiem thu giao dien): bo qua moi key -> khong tu mo phien Live luc tai trang,
  // khong long tieng, khong soan de AI (y nhu mo trang qua server tinh khong co env.js)
  const ENV = /[?&]noLive\b/i.test(location.search) ? {} : (window.SENSEI_ENV || {});
  /** Tat ca key da dien trong .env, giu dung thu tu uu tien, bo trung/rong. */
  function allKeys() {
    return [ENV.key1, ENV.key2, ENV.key3, ENV.key4]
      .map(k => String(k || '').trim())
      .filter((k, i, a) => k && a.indexOf(k) === i);
  }
  // Phien Sensei het han muc (mã 1011) thi phai XOAY SANG KEY KHAC — truoc day
  // senseiKey() luon tra ve key1 vinh vien du key do dang het quota, lam ca
  // lop tac tu (mic khong ai tra loi) ma khong bao gio tu choi sang key con
  // song. senseiKeyIdx tro vao allKeys(), day len khi phat hien dong phien
  // vi het han muc — xem onClose ben duoi.
  let senseiKeyIdx = 0;
  const senseiKey = () => {
    const keys = allKeys();
    return keys[senseiKeyIdx] || keys[0] || String(ENV.key1 || ENV.key2 || ENV.key3 || ENV.key4 || '').trim();
  };
  const helperKey = () => String(ENV.key2 || ENV.key1 || ENV.key3 || ENV.key4 || '').trim();
  // Giong Sensei chot cung: Charon — nam tram, ro chu, hop tieng Nhat nhat.
  // Khong con o chon tren UI nua.
  const SENSEI_VOICE = 'Charon';
  // Bao cho kho giong biet, de khong cap trung giong nay cho nhan vat nao
  if (window.SenseiVoices) SenseiVoices.setSenseiVoice(SENSEI_VOICE);
  const micStatusText = document.getElementById('micStatusText');

  // Luồng hỏi bài: Giơ tay → thu âm → Gửi hoặc Hủy
  const askSendBtn = document.getElementById('askSendBtn');
  const askCancelBtn = document.getElementById('askCancelBtn');

  // Bảng cấu hình & ô gõ câu hỏi
  const chatToggleBtn = document.getElementById('chatToggleBtn');
  const chatDock = document.getElementById('chatDock');
  const chatCloseBtn = document.getElementById('chatCloseBtn');
  const toastHost = document.getElementById('toastHost');
  const chatInput = document.getElementById('chatInput');
  const sendChatBtn = document.getElementById('sendChatBtn');

  // Navigation manual controls
  const levelSelect = document.getElementById('levelSelect');
  const lessonSelect = document.getElementById('lessonSelect');
  const prevSlideBtn = document.getElementById('prevSlideBtn');
  const nextSlideBtn = document.getElementById('nextSlideBtn');
  const dismissErrBtn = document.getElementById('dismissErrBtn');
  const tabSlideBtn = document.getElementById('tabSlideBtn');
  const tabQuizBtn = document.getElementById('tabQuizBtn');

  // Auto-Lecture & Raise Hand Elements & State
  const autoLectureBtn = document.getElementById('autoLectureBtn');
  const autoLectureIcon = document.getElementById('autoLectureIcon');
  const autoLectureText = document.getElementById('autoLectureText');
  const raiseHandBtn = document.getElementById('raiseHandBtn');
  const raiseHandIcon = document.getElementById('raiseHandIcon');
  const raiseHandText = document.getElementById('raiseHandText');
  const nextStepBtn = document.getElementById('nextStepBtn');

  // State Machine for Lecture: 'IDLE' | 'PLAYING' | 'PAUSED'
  let lectureState = 'IDLE';
  let giangDaBaoMeo = null;   // lan cuoi bao meo Sensei (SenseiAvatar.trangThai) dang ban hay khong
  let henBaoMeo = null;       // setInterval(baoMeoBan) — dat o cuoi khoi tao
  let lectureCheckpoint = {
    stepIndex: 0,
    sectionName: 'vocab',
    subIndex: null,
    level: 'N5',
    lessonNum: 1
  };
  let isRaisingHand = false;
  let luotGioTay = 0;   // tang moi lan gio tay: lan mo mic cu (con dang cho quyen) thay lech thi thoi
  let currentLectureSteps = [];
  let currentLectureStepIndex = -1;
  let autoStepTransitionTimer = null;
  let currentStepStartTime = 0;
  let currentStepRetryCount = 0;
  let lastTabSwitchTime = 0;
  // Ma nhip: tang moi lan executeLectureStep; maNhipDaGui = ma cua nhip da gui
  // loi cho Sensei (sendToSensei). Dung de xet lai nhip sau khi dung tieng tay.
  let maNhip = 0;
  let maNhipDaGui = -1;
  let xetLaiSauDungTayTimer = null;
  // San khau giang (js/motion.js): nhip dau tien sau Bat dau / Giang tiep (ctx.laBatDau),
  // va nhip bai tap dang cho hoc vien chon ({ ma, exId, since, daTraLoi, soChu, hen }).
  // Khai bao som o day (khong canh checkAutoLectureStepComplete) de khoi vuong TDZ.
  let batDauMoi = false;
  let choHocVien = null;
  let vuaDungGiangTimer = null;   // body.vua-dung-giang: ~1 s sau khi tat san khau, luoi ve lai khong hieu ung vao
  // The ket bai: 5 chi so + dong "Luyện tiếp" can ~4.5-5 s moi doc het (2.4 s cu: the vua hien da tat -> cut)
  const KET_BAI_MS = 5000;
  // San khau mo dan ve luoi (motion.js, 160-240 ms) XONG moi cuon xuong Phat am: hai chuyen dong noi tiep
  const KET_BAI_TRE_CUON = 280;
  let ketBaiDangHen = false;      // the ket bai dang hien, autoStepTransitionTimer = hen finishLecture
  let ketBaiCuonTimer = null;     // finishLecture -> nhay xuong Phat am sau khi san khau mo het

  // Bộ đệm bản ghi lời nói (transcription) để gom thành 1 dòng log thay vì spam từng mảnh
  let senseiTranscript = "";
  let userTranscript = "";
  // Bài giảng có đang chạy trước khi học viên giơ tay không?
  // Dùng để biết có phải giảng tiếp sau khi bấm Hủy hay không.
  let lectureWasPlayingBeforeAsk = false;
  // Lời hứa đang chờ phiên sẵn sàng (bấm "Giảng bài" khi chưa kết nối)
  let pendingReady = null;
  let isConnecting = false;
  // App dang TU ngat phien (ngatPhienChuDong) — onClose khong bao "mat ket noi"
  let tuNgatPhien = false;

  // Cập nhật danh sách bài học động theo cấp độ
  function populateLessons(level, selectedLessonNum = 1) {
    if (!lessonSelect) return;
    const lessons = curriculumLoader.getLessonsForLevel(level);
    lessonSelect.innerHTML = '';
    lessons.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.lessonNumber;
      opt.innerText = l.title;
      if (l.lessonNumber === Number(selectedLessonNum)) {
        opt.selected = true;
      }
      lessonSelect.appendChild(opt);
    });
  }

  // Khởi động bài đầu tiên N5
  populateLessons("N5", 1);
  slideEngine.renderSlide("N5", 1, 0);

  // Giơ tay hỏi TỰ kết nối khi bấm (xem handleRaiseHandClick/ensureConnected)
  // — không khoá nút chờ kết nối có sẵn, và "Bắt đầu giảng bài" chỉ để điều
  // khiển việc GIẢNG, không phải điều kiện để được hỏi bài.

  // Key doc tu .env — khong con o nhap, cung khong con bang cau hinh de bao tin.
  const savedApiKey = senseiKey();
  console.info('[sensei] key .env:', savedApiKey ? 'da doc duoc' : 'THIEU GEMINI_KEY1');

  // Co danh dau Sensei dang noi mot cau NGOAI bai giang (cham bai / cham phat
  // am). Khai bao TRUOC AudioEngine vi callback am thanh ben duoi doc no.
  let senseiChenNgang = false;
  let chenNgangTimer = null;
  let dangThuAm = null;        // id cau luyen phat am dang thu, null = khong thu
  let dangChoChamPhatAm = null; // id hop ket qua dang cho Sensei cham xong (sau khi bam gui luyen phat am)
  let choChamPhatAmTimer = null; // het gio (80s) chua thay cham xong -> tu ket noi lai
  // Ngoai gio giang, turnComplete ve khi loa con doc dở: hen tat den toi luc
  // loa doc xong han (onPlayStateChange), khong tat ngay giua cau tra loi.
  let tatDenKhiHetTieng = false;

  // Muc am thanh CAO NHAT tung thay duoc trong lan thu am hien tai — dat lai
  // ve 0 moi khi mo mic. Neu bam Gui ma so nay van thap le te, gan chac hoc
  // vien da noi nhung mic khong bat duoc gi ra hon — server tu dong nhan
  // dien hoat dong (VAD) se khong bao gio thay "co nguoi noi" nen im lang
  // MAI MAI, chu khong phai chi cham nhu binh thuong. Day la trieu chung
  // NGOAI PHAN CUNG/QUYEN MIC that su, khac voi do tre xu ly binh thuong.
  let mucAmThanhCaoNhat = 0;
  const NGUONG_AM_THANH_RO = 6; // trung voi nguong da dung o updateLiveMicVolume

  // Dan dien vien dang doc thoai qua loa (playDialogueLine). Khong tat hang
  // mic that su (cham, phai xin quyen lai) — chi tam ngung GUI tieng loa lai
  // cho Sensei nghe. Thieu buoc nay: may khong deo tai nghe se de mic bat lai
  // chinh giong nhan vat, Gemini tuong hoc vien dang noi va tu dung xen vao
  // giang giua luc nhan vat con dang thoai.
  let dangPhatGiongNhanVat = false;

  // San khau giang (motion design, js/motion.js). null khi chua nap, init loi hoac ?khongSanKhau:
  // moi loi goi SK()?.x() khi do la no-op, bai giang chay y nhu truoc.
  const SK = () => (window.SenseiMotion && window.SenseiMotion.bat ? window.SenseiMotion : null);

  // 3. Audio Engine
  const audioEngine = new AudioEngine({
    onAudioChunk: (base64Pcm) => {
      if (dangPhatGiongNhanVat) return;
      geminiClient.sendRealtimeAudio(base64Pcm);
    },
    onPlayStateChange: (isPlaying, meta) => {
      setWaveformActive(isPlaying);

      if (!isPlaying) {
        // Bi cat ngang (doi tab / prompt moi) -> cac hen roi den theo loi con lai vo nghia
        // Cat ngang thi luot do khong bao gio "doc xong" nua -> bo hen tat den,
        // khong thi hen cu tat nham den cua cau tra loi sau (giu den dang sang).
        if (meta && meta.manual) { clearPendingFocus(); tatDenKhiHetTieng = false; SK()?.khiXaHang(); }
        // Loa doc XONG cau tra loi ngoai gio giang -> gio moi tat den (xem onTurnComplete)
        if (tatDenKhiHetTieng && !(meta && (meta.manual || meta.clip)) && lectureState !== 'PLAYING') {
          tatDenKhiHetTieng = false;
          clearPendingFocus();
          slideEngine.clearReadingFocus();
        }
      }

      // Sensei vua noi xong mot cau NGOAI bai giang (cham bai / cham phat am).
      // Lan tat tieng nay la cua cau do, khong phai cua nhip dang giang —
      // tinh nham thi bai giang nhay sang muc sau ma chua giang muc nay.
      if (!isPlaying && senseiChenNgang && !(meta && (meta.manual || meta.clip))) {
        ketThucChenNgang();
        return;
      }
      // CHI xet "Sensei giang xong nhip" khi chinh tieng cua SENSEI ket thuc tu nhien.
      // Hai truong hop KHONG duoc tinh:
      //   meta.manual — code chu dong dung (doi tab / gui prompt moi / barge-in)
      //   meta.clip   — vua phat xong LOI THOAI NHAN VAT, Sensei con chua noi gi.
      //                 Bo sot cai nay thi luot 2 cua chuong Hoi thoai chay vut
      //                 qua ca 10 cau, loi giang cua Sensei roi lech sang nhip khac.
      const boQua = meta && (meta.manual || meta.clip);
      if (!isPlaying && !boQua && lectureState === 'PLAYING') {
        checkAutoLectureStepComplete();
      }
      // Dung tay (bam loa, chon dap an, loa cham bai) SAU khi turnComplete da ve:
      // khong con su kien "doc xong" nao nua -> bai giang treo o PLAYING. Hen xet
      // lai khi giong trinh duyet doc xong (xem xetLaiSauDungTay).
      if (!isPlaying && meta && meta.manual && lectureState === 'PLAYING') {
        xetLaiSauDungTay();
      }
    },
    onMicVolume: (volume) => {
      updateLiveMicVolume(volume);
    },
    onError: (err) => {
      addLog("System", `Lỗi Microphone: ${err.message}`);
      updateMicUI(false, false);
    }
  });
  window.__audioEngine = audioEngine;

  // 4. Gemini Live Client
  const geminiClient = new GeminiLiveClient({
    onBeforeUserMessage: () => {
      // Trước khi gửi bất kỳ tin nhắn mới nào, lập tức ngắt toàn bộ âm thanh đang phát dở
      if (audioEngine) {
        audioEngine.stopPlayback();
        // Luot moi (go chat, nhip giang, cham bai, anh viet tay) luon phai nghe
        // duoc: tam dung / huy cau hoi truoc do co the dang dong cong am thanh.
        audioEngine.setSuppressed(false);
      }
      SK()?.khiGuiLuot();            // san khau: mo dong thoi gian luot moi (bo qua khi dang cho / tat)
      boQuaLuotHuy = false;          // luot moi thay cho luot vua huy
      tatDenKhiHetTieng = false;     // cau tra loi moi tu lo den cua no
      if (window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
    },
    onOpen: () => {
      updateMicUI(true, false);
    },
    // Server đã xác nhận cấu hình — từ giây này mới gửi được nội dung bài giảng
    onReady: () => {
      tuNgatPhien = false;   // phien moi: lan ngat chu dong truoc (neu socket da chet san) het hieu luc
      if (pendingReady) {
        const r = pendingReady; pendingReady = null;
        clearTimeout(r.timer);
        r.resolve();
      }
      updateSessionState();
    },
    // Nhan ca "e" (ma dong + ly do) de biet phien dong vi HET HAN MUC (mã
    // 1011) hay chi la dong binh thuong — het han muc thi phai TU XOAY sang
    // key khac va vao lop lai, khong thi hoc vien ket noi lai cung trung
    // dung key vua het, im lang y het lan truoc.
    onClose: (e) => {
      // Luoi an toan: socket CU dong tre sau khi connect() da mo socket moi —
      // phien moi dang vao, khong duoc don dep hay cuop loi hua cho cua no.
      const wsDong = e && e.target;
      if (wsDong && geminiClient.ws && wsDong !== geminiClient.ws) return;
      // App tu ngat (ngatPhienChuDong) thi khong phai mat ket noi bat ngo
      const tuNgat = tuNgatPhien;
      tuNgatPhien = false;

      // Dong khi CHUA toi setupComplete: go loi hua cho ra, khong thi
      // ensureConnected() cu tra lai loi hua cu (khong mo socket voi key moi)
      // va nut treo "Đang vào lớp…" toi het 20s.
      const cho = pendingReady;
      if (cho) { pendingReady = null; clearTimeout(cho.timer); isConnecting = false; }

      updateMicUI(false, false);
      updateSessionState();

      const dangGiang = lectureState === 'PLAYING';
      // Giu PAUSED, khong ve IDLE: nut hien "Giảng tiếp", bam la vao lop lai
      // va hoc tiep dung nhip dang dở thay vi giang lai tu dau chuong.
      if (dangGiang) pauseLecture(false);   // luu checkpoint truoc khi don sach
      // Dang thu cau hoi / ban doc phat am ma mat ket noi -> tra nut ve nhu cu,
      // khong de Gui/Huy treo tren mot mic da tat (bam Gui la cho suong 80s).
      let baoMatKhiThu = '';
      if (isRaisingHand) {
        isRaisingHand = false;
        lectureWasPlayingBeforeAsk = false;
        updateAskUI();
        baoMatKhiThu = 'Mất kết nối trong lúc thu âm — bấm "Giơ tay hỏi" để hỏi lại nhé.';
      }
      if (dangThuAm) {
        const idThu = dangThuAm;
        dangThuAm = null;
        veNutThuAm(idThu, false);
        veTinPhatAm(idThu, '<i class="fa-solid fa-triangle-exclamation"></i><span>Mất kết nối trong lúc thu âm — bấm lại để thử.</span>', 'amber');
      }
      updateLectureControlsUI();
      // Chi dung tieng + tat mic, KHONG dong AudioContext loa (cleanup): iPhone
      // chi mo khoa context trong cu cham — dong o day thi lan vao lop tu dong
      // sau (xoay key, Giang tiep) tao context moi bi khoa, lop cam tieng.
      audioEngine.stopPlayback();
      audioEngine.stopMic();

      // Mat ket noi giua chung khi dang cho tra loi -> tat bao "dang cho" va
      // bao that bai, khong de nguoi hoc nhin spinner/dai cho vinh vien.
      anChoTraLoi();
      if (dangChoChamPhatAm) {
        clearTimeout(choChamPhatAmTimer);
        veTinPhatAm(dangChoChamPhatAm, '<i class="fa-solid fa-triangle-exclamation"></i><span>Mất kết nối trước khi Sensei chấm xong — thử lại nhé.</span>', 'amber');
        dangChoChamPhatAm = null;
      }
      if (typeof pxKhiMatKetNoi === 'function') pxKhiMatKetNoi();   // vong Phan xa dang chay
      if (baoMatKhiThu) showToast(baoMatKhiThu, 'info', 6000);

      const lyDo = (e && e.reason) || '';
      // Chi xet chu trong ly do, KHONG xet ma 1011: 1011 con la "Internal error
      // encountered" thoang qua — tinh la het quota thi xoay key vo co, bao nham
      // "hết hạn mức" (cung mau voi hetQuota o prefetchDialogueAudio)
      const hetHanMuc = /quota|RESOURCE_EXHAUSTED|\b429\b/i.test(lyDo);

      if (hetHanMuc && senseiKeyIdx < allKeys().length - 1) {
        senseiKeyIdx++;
        showToast('Tài khoản Sensei tạm hết hạn mức — đang chuyển sang tài khoản khác…', 'info', 5000);
        const p = ensureConnected();
        // Ai dang cho lan vao lop vua hong (tu vao lop luc mo trang, gio tay...)
        // thi cho luon ket qua cua key moi, khong bao loi som.
        if (cho) p.then(cho.resolve, cho.reject);
        p.then(() => { if (dangGiang) resumeLecture(); }).catch((err) => {
          // Key moi cung khong vao duoc ma khong ai cho ket qua -> phien dang hoc
          // mat han (lan vao lop hong ben duoi khong bao, xem !cho o duoi)
          if (!cho && lectureState === 'PAUSED' && err && (err.message === 'timeout' || err.message === 'closed')) {
            showToast('Mất kết nối với Sensei — bấm "Giảng tiếp" để học tiếp từ chỗ dừng.', 'info', 6000);
          }
        });
        return;
      }
      if (hetHanMuc) {
        showToast(`Cả ${allKeys().length} tài khoản Gemini đều đã hết hạn mức — thử lại sau ít phút.`, 'info', 9000);
      } else if (!cho && !tuNgat && !baoMatKhiThu && lectureState === 'PAUSED') {
        // Co cho = lan VAO LOP dang thu bi hong (khong phai mat phien dang hoc) —
        // noi goi ensureConnected tu bao "Không vào được lớp…", khong bao doi.
        showToast('Mất kết nối với Sensei — bấm "Giảng tiếp" để học tiếp từ chỗ dừng.', 'info', 6000);
      }
      if (cho) cho.reject(new Error(hetHanMuc ? 'quota' : 'closed'));
    },
    onError: (err) => {
      addLog("Error", `Lỗi kết nối: ${err.message || 'Không thể kết nối'}`);
    },
    onBargeIn: () => {
      addLog("Barge-in", "Phát hiện học viên lên tiếng! Đã dừng ngay âm thanh giảng bài của Sensei.");
      audioEngine.stopPlayback();
      cancelStepTransition();
      // Giu nguyen den roi: hoc vien ngat loi la de hoi ve DUNG muc dang sang
      if (lectureState === 'PLAYING') {
        pauseLecture(false);
      }
    },
    // Gemini cũng báo interrupted khi CHÍNH ta gửi prompt cho bước giảng kế tiếp.
    // Trước đây bị hiểu nhầm là học viên ngắt lời -> bài giảng tự tắt ngay sau Phần 1.
    onSelfInterrupt: () => {
      audioEngine.stopPlayback();
      SK()?.khiTuNgat();   // goi / chu cua luot cu con bay toi trong 500 ms dau -> bo
    },
    onTranscript: (chunk) => {
      // Luot tra loi cho cau / ban thu hoc vien da HUY: tieng da chan, chu cung
      // bo luon — khong de no doi tab, roi den hay cham to cau da bo.
      if (boQuaLuotHuy) return;
      // San khau: manh loi + cuoi hang doi am thanh luc toi (0 = khong con goi nao xep lich)
      SK()?.khiCoLoi(chunk, audioEngine.scheduledTime || 0);
      // Ghép thêm ~60 ký tự cũ để không hụt từ bị cắt đôi giữa hai mảnh,
      // nhưng KHÔNG quét lại toàn bộ bản ghi (sẽ rọi lại những từ đã đọc từ lâu).
      const overlap = senseiTranscript.slice(-60);
      senseiTranscript += chunk;
      const window_ = overlap + chunk;
      pxMatSom(senseiTranscript);   // cau phan xa dang cho phan: DUNG / SAI -> mat meo ngay
      autoTrackSenseiSpeech(window_);
      detectAndSwitchTabFromIntent(window_, 'sensei');
    },
    onUserTranscript: (chunk) => {
      userTranscript += chunk;
    },
    // Model vẫn suy luận nội bộ, nhưng KHÔNG hiển thị ra giao diện nữa.
    onReasoning: () => {},
    onAudioData: (base64PcmChunk) => {
      anChoTraLoi(); // tieng dau tien cua Sensei ve toi -> het "dang cho"
      if (matChoNoi && !audioEngine.suppressed) apMatChoNoi();   // mat hen cho luot nay (cham bai / muc giang)
      const sk = SK();
      if (!sk) { audioEngine.playPCM24k(base64PcmChunk); return; }
      // Bao san khau goi nay phat o [t0, t1) theo dong ho AudioContext: chi doc scheduledTime
      // truoc/sau va byte le con giu (leftoverBytes) — khong doi cach playPCM24k phat
      const truoc = audioEngine.scheduledTime;
      const du = audioEngine.leftoverBytes ? audioEngine.leftoverBytes.length : 0;
      const pad = base64PcmChunk.endsWith('==') ? 2 : base64PcmChunk.endsWith('=') ? 1 : 0;
      const bytes = Math.floor(base64PcmChunk.length * 3 / 4) - pad;
      audioEngine.playPCM24k(base64PcmChunk);
      const sau = audioEngine.scheduledTime;
      if (sau !== truoc) sk.khiCoAmThanh(base64PcmChunk, sau - Math.floor((du + bytes) / 2) / 24000, sau);
      else if (bytes > 1) sk.khiMatAmThanh(base64PcmChunk, audioEngine.suppressed ? 'chan' : audioEngine.clipPlaying ? 'clip' : 'khoa');
    },
    onText: (text) => {
      addLog("Sensei", text);
      autoTrackSenseiSpeech(text);
      detectAndSwitchTabFromIntent(text, 'sensei');
    },
    onToolCall: (call) => {
      return handleToolCall(call);
    },
    onTurnComplete: () => {
      SK()?.khiLuotXong(audioEngine.scheduledTime || 0);   // san khau: chot luot, hoc L / r, chot cue con treo
      // KHONG tat den o day khi dang giang bai.
      // Mot nhip thuong trai qua nhieu luot noi, va luc turnComplete ve thi loa
      // van con doc dở goi am thanh trong hang doi. Tat o day gay ra dung canh
      // "vua mo da tat" va "doc sang tu khac ma van sang tu cu".
      // Den chi tat khi: sang nhip khac, doi chuong/bai, hoac ket thuc bai giang.
      // Ngoai gio giang cung vay: loa con doc thi hen tat toi luc doc xong han
      // (onPlayStateChange), khong tat ngay khi Sensei moi noi toi nua cau.
      if (lectureState === 'PLAYING') {
        clearPendingFocus();
      } else if (audioEngine.isPlaybackActive()) {
        tatDenKhiHetTieng = true;
      } else {
        clearPendingFocus();
        slideEngine.clearReadingFocus();
      }
      if (userTranscript.trim()) {
        addLog("Học viên", userTranscript.trim());
        userTranscript = "";
      }
      const loiSenseiVuaNoi = senseiTranscript.trim();
      if (loiSenseiVuaNoi) {
        addLog("Sensei", loiSenseiVuaNoi);
        senseiTranscript = "";
      }
      // Luot noi da xong (co the la luot am thanh khong sinh MODEL_AUDIO nao,
      // vi du bi loc/rong) -> vẫn phải tắt bao "dang cho", khong thi ket qua
      // giu spinner vinh vien du that ra da xong.
      anChoTraLoi();
      // Cau phan xa dang doi Sensei phan thi lay loi do cham diem luon
      if (typeof pxNhanLoiPhan === 'function' && pxNhanLoiPhan(loiSenseiVuaNoi)) return;
      if (dangChoChamPhatAm) {
        clearTimeout(choChamPhatAmTimer);
        const idChoCham = dangChoChamPhatAm;
        dangChoChamPhatAm = null;
        veTinPhatAm(idChoCham, `<i class="fa-solid fa-comment-dots"></i><span>${escapeHtml(loiSenseiVuaNoi || 'Sensei đã chấm xong — nghe lại phần vừa nói ở trên.')}</span>`, 'cyan');
      }
      // Khi lượt nói của Gemini hoàn tất trên server
      if (lectureState === 'PLAYING') {
        checkAutoLectureStepComplete();
      }
    },
    onLog: (sender, msg) => {
      addLog(sender, msg);
    }
  });

  // Tự động phân tích Intent & chuyển Active Tab khi Sensei hoặc học viên muốn xem lại mục bài học
  function detectAndSwitchTabFromIntent(text, source = 'sensei') {
    if (!text || typeof text !== 'string') return;
    // Dang giang theo giao an: moi nhip tu mo dung chuong / roi dung muc, Sensei
    // con co change_section. Nghe loi giang ("nhìn vào chữ Hán này...") ma doi
    // tab thi ve lai chuong va tat den giua nhip.
    if (source === 'sensei' && lectureState === 'PLAYING') return;
    const now = Date.now();
    if (now - lastTabSwitchTime < 2000) return; // Debounce 2s tránh giật nhảy tab liên tục

    const lower = text.toLowerCase();

    // Nhận diện từ khóa mang ý định chuyển/mở/quay lại
    const hasIntent = /(quay lại|xem lại|về phần|mở lại|nhìn vào|chuyển sang|mở phần|cho em xem|chúng ta cùng nhìn|chuyển qua|trở lại|về lại|về mục)/i.test(lower);
    if (!hasIntent) return;

    // Dang mo san dung chuong (va dung slide) roi thi thoi — setTab ve lai tu
    // dau va tat den dang roi, du chang doi gi.
    const dangMo = (tab, slide) => slideEngine.activeTab === tab
      && (tab !== 'grammar' || slide === undefined || slide === slideEngine.currentSlideIndex);

    // 1. Phân môn Ngữ pháp (Grammar) với số slide cụ thể
    const slideMatch = lower.match(/(?:ngữ pháp|grammar|slide|mẫu câu)\s*(?:số\s*)?(\d+)/i);
    if (slideMatch && slideMatch[1]) {
      const targetSlide = Math.max(0, parseInt(slideMatch[1], 10) - 1);
      if (dangMo('grammar', targetSlide)) return;
      lastTabSwitchTime = now;
      slideEngine.setTab('grammar', targetSlide);
      lectureCheckpoint.sectionName = 'grammar';
      lectureCheckpoint.subIndex = targetSlide;
      addLog("System", `🔄 [Tự động chuyển tab]: Đã mở Slide ${targetSlide + 1} Ngữ pháp theo ngữ cảnh.`);
      return;
    }

    // 2. Phân môn Từ vựng (Vocab)
    if (/(?:từ vựng|vocab|từ mới|danh sách từ)/i.test(lower)) {
      if (dangMo('vocab')) return;
      lastTabSwitchTime = now;
      slideEngine.setTab('vocab');
      lectureCheckpoint.sectionName = 'vocab';
      lectureCheckpoint.subIndex = null;
      addLog("System", "🔄 [Tự động chuyển tab]: Đã chuyển sang tab Từ vựng theo ngữ cảnh.");
      return;
    }

    // 3. Phân môn Chữ Hán (Kanji) — bai Nhap mon: "chữ cái", "hiragana", "katakana" cung mo chuong nay
    if (/(?:chữ hán|kanji|hán tự|bảng chữ hán)/i.test(lower)
        || (CAP_DO.laKana(slideEngine.currentLevel) && /(?:chữ cái|bảng chữ|hiragana|katakana)/i.test(lower))) {
      if (dangMo('kanji')) return;
      lastTabSwitchTime = now;
      slideEngine.setTab('kanji');
      lectureCheckpoint.sectionName = 'kanji';
      lectureCheckpoint.subIndex = null;
      addLog("System", `🔄 [Tự động chuyển tab]: Đã chuyển sang tab ${tenChuong('kanji')} theo ngữ cảnh.`);
      return;
    }

    // 4. Phân môn Ngữ pháp chung (Grammar)
    if (/(?:ngữ pháp|grammar|cấu trúc câu|mẫu ngữ pháp)/i.test(lower)) {
      if (dangMo('grammar')) return;
      lastTabSwitchTime = now;
      const targetSlide = slideEngine.currentSlideIndex || 0;
      slideEngine.setTab('grammar', targetSlide);
      lectureCheckpoint.sectionName = 'grammar';
      lectureCheckpoint.subIndex = targetSlide;
      addLog("System", "🔄 [Tự động chuyển tab]: Đã chuyển sang tab Ngữ pháp theo ngữ cảnh.");
      return;
    }

    // 5. Phân môn Hội thoại (Kaiwa)
    if (/(?:hội thoại|kaiwa|đàm thoại|đoạn đối thoại)/i.test(lower)) {
      if (dangMo('kaiwa')) return;
      lastTabSwitchTime = now;
      slideEngine.setTab('kaiwa');
      lectureCheckpoint.sectionName = 'kaiwa';
      lectureCheckpoint.subIndex = null;
      addLog("System", "🔄 [Tự động chuyển tab]: Đã chuyển sang tab Hội thoại Kaiwa theo ngữ cảnh.");
      return;
    }

    // 6. Phân môn Bài tập (Quiz)
    if (/(?:bài tập|quiz|trắc nghiệm|luyện tập|câu hỏi ôn tập)/i.test(lower)) {
      if (dangMo('quiz')) return;
      lastTabSwitchTime = now;
      slideEngine.setTab('quiz');
      lectureCheckpoint.sectionName = 'quiz';
      lectureCheckpoint.subIndex = 0;
      addLog("System", "🔄 [Tự động chuyển tab]: Đã chuyển sang tab Bài tập theo ngữ cảnh.");
      return;
    }
  }

  // Smart Real-time Speech Tracker: Tự động cuộn & rọi sáng phần tử Sensei đang đọc/giảng
  let lastTrackedTargetId = null;

  // Bản ghi lời nói (transcription) được sinh NGAY khi model tạo câu,
  // trong khi âm thanh còn nằm trong hàng đợi phát — thường trễ vài giây.
  // Muốn đèn rọi đúng lúc Sensei đọc tới thì phải hoãn đúng bằng độ trễ đó.
  let pendingFocusTimers = [];
  let lastFocusAt = 0;
  // Mốc lần cuối Sensei tự gọi highlight_element.
  // Trong lúc Sensei đang tự điều khiển, bộ bám theo lời giảng phải đứng yên,
  // nếu không hai nguồn sẽ tranh nhau và đèn nhảy loạn xạ.
  let lastToolFocusAt = 0;
  const TOOL_PRIORITY_MS = 25000;
  const MIN_FOCUS_GAP_MS = 1100;   // hai muc lien tiep cach nhau it nhat ngan nay

  function clearPendingFocus() {
    pendingFocusTimers.forEach(t => clearTimeout(t));
    pendingFocusTimers = [];
  }

  function triggerSyncedFocus(targetId, dismissMs = 5000) {
    if (!targetId || !slideEngine) return;

    const queueLatencySec = window.__audioEngine ? window.__audioEngine.getPlaybackQueueLatency() : 0;
    // Trừ 120ms để đèn sáng ngay trước khi phát âm — mắt kịp bắt vào đúng chỗ.
    // Trần 9s thay vì 2.5s: khi Sensei giảng dài, hàng đợi âm thanh dài hơn nhiều.
    const delayMs = Math.min(9000, Math.max(0, Math.round((queueLatencySec - 0.12) * 1000)));

    const fire = () => {
      lastFocusAt = Date.now();
      slideEngine.focusReadingElement(targetId);
    };

    if (delayMs > 60) {
      const t = setTimeout(() => {
        pendingFocusTimers = pendingFocusTimers.filter(x => x !== t);
        fire();
      }, delayMs);
      pendingFocusTimers.push(t);
    } else {
      fire();
    }
  }

  // Chan viec nhay muc lien tuc: giua hai lan roi den phai cach nhau du lau
  function canFocusNow() {
    return (Date.now() - lastFocusAt) >= MIN_FOCUS_GAP_MS;
  }

  // Tìm mục được nhắc đến MUỘN NHẤT trong đoạn lời vừa nghe.
  // Trước đây lấy mục đầu tiên KHỚP theo thứ tự danh sách, nên Sensei đang nói từ thứ 12
  // mà đèn lại nhảy về từ thứ 1 chỉ vì từ đó còn sót trong đoạn transcript.
  function pickLatestMatch(haystack, candidates) {
    let best = null, bestPos = -1;
    for (const c of candidates) {
      for (const needle of c.keys) {
        if (!needle) continue;
        const pos = haystack.lastIndexOf(needle);
        if (pos > bestPos) { bestPos = pos; best = c; }
      }
    }
    return best;
  }

  function autoTrackSenseiSpeech(text) {
    if (!text || typeof text !== 'string') return;
    // Dang giang: moi nhip dung MOT muc va client da tu roi den muc do
    // (executeLectureStep) — bam theo loi giang chi lam den nhay lung tung.
    if (lectureState === 'PLAYING') return;
    // Sensei đang tự gọi highlight_element -> để Sensei dẫn, không chen vào
    if (Date.now() - lastToolFocusAt < TOOL_PRIORITY_MS) return;
    if (!canFocusNow()) return;
    const lower = text.toLowerCase();
    const currentTab = slideEngine.activeTab;
    const lvl = slideEngine.currentLevel;
    const lessonNum = slideEngine.currentLesson;

    if (currentTab === 'vocab') {
      const vocabs = curriculumLoader.getVocabList(lvl, lessonNum);
      const cands = vocabs
        .filter(v => v.id !== lastTrackedTargetId)
        .map(v => ({
          id: v.id,
          keys: [
            (v.kanji || "").toLowerCase(),
            (v.word || "").toLowerCase(),
            (v.furigana || "").toLowerCase(),
            (v.romaji || "").toLowerCase(),
          ].filter(x => x.length >= 3)   // <3 ký tự dễ khớp bậy trong câu tiếng Việt
        }));
      const hit = pickLatestMatch(lower, cands);
      if (hit) {
        lastTrackedTargetId = hit.id;
        triggerSyncedFocus(hit.id);
      }
    } else if (currentTab === 'kanji') {
      const kanjis = curriculumLoader.getKanjiList(lvl, lessonNum);
      const cands = kanjis
        .filter(k => k.id !== lastTrackedTargetId)
        .map(k => ({
          id: k.id,
          // Chi khop MAT CHU. Am Han Viet la mot tieng Viet thuong ("học", "tiên",
          // "nhật") — khop tran thi "học viên", "đầu tiên", "tiếng Nhật" roi nham chu.
          // Chu kana (bai Nhap mon): bo han — あ, し, きゃ nam trong gan nhu moi cau tieng Nhat.
          keys: CAP_DO.laChuKana(k) ? [] : [k.character || ""].filter(Boolean)
        }));
      const hit = pickLatestMatch(lower, cands);
      if (hit) {
        lastTrackedTargetId = hit.id;
        triggerSyncedFocus(hit.id);
      }
    } else if (currentTab === 'grammar') {
      const slideData = curriculumLoader.getSlide(lvl, lessonNum, slideEngine.currentSlideIndex || 0);
      const examples = slideData?.slide?.examples || [];
      const cands = examples
        .filter(e => e.id !== lastTrackedTargetId)
        .map(e => {
          const full = (e.tokens || []).map(t => t.kanji || t.text || "").join("").toLowerCase();
          // Dùng ĐOẠN GIỮA câu làm dấu nhận biết: phần đầu các câu ví dụ hay trùng nhau
          // (私は… / 私は…) nên lấy 5 ký tự đầu là dính nhầm liên tục.
          const keys = [];
          if (full.length >= 6) keys.push(full.slice(Math.floor(full.length / 3), Math.floor(full.length / 3) + 6));
          if (full.length >= 4) keys.push(full.slice(-5));
          return { id: e.id, keys: keys.filter(x => x.length >= 4) };
        });
      const hit = pickLatestMatch(lower, cands);
      if (hit) {
        lastTrackedTargetId = hit.id;
        triggerSyncedFocus(hit.id);
      }
    } else if (currentTab === 'kaiwa') {
      const dialogue = curriculumLoader.getDialogue(lvl, lessonNum);
      const cands = dialogue
        .filter(d => d.id !== lastTrackedTargetId)
        .map(d => {
          const full = (d.tokens || []).map(t => t.kanji || t.text || "").join("").toLowerCase();
          const keys = [];
          if (full.length >= 6) keys.push(full.slice(Math.floor(full.length / 3), Math.floor(full.length / 3) + 6));
          if (full.length >= 4) keys.push(full.slice(-5));
          return { id: d.id, keys: keys.filter(x => x.length >= 4) };
        });
      const hit = pickLatestMatch(lower, cands);
      if (hit) {
        lastTrackedTargetId = hit.id;
        triggerSyncedFocus(hit.id);
      }
    }
  }

  /** Cap co bai so nay that khong (getLesson tut ve bai dau cap neu khong co) */
  function coBai(lvl, no) {
    return curriculumLoader.getLessonsForLevel(lvl).some(l => l.lessonNumber === Number(no));
  }
  /** Tra loi tool khi Sensei goi sai bai: kem khoang so bai co that de goi lai */
  function loiKhongCoBai(lvl, no) {
    const so = curriculumLoader.getLessonsForLevel(lvl).map(l => l.lessonNumber);
    const res = { success: false, error: `khong co bai ${lvl}-${no}`,
                  validLessons: so.length ? `${Math.min(...so)}-${Math.max(...so)}` : '' };
    if (!so.length) res.validLevels = curriculumLoader.getAvailableLevels().join(',');
    return res;
  }

  /* Mat / dong tac meo Sensei (clip nua nguoi, qua window.SenseiAvatar).
     Khoa chuan: mat vui, de_biu, that_vong, ngac_nhien, buon, gian, suy_nghi, xau_ho;
     dong tac chao, cui_chao, liem_tay, ngu_gat, suy_nghi, noi_tay_trai, noi_tay_phai.
     Ten cu cua cac ban tool truoc van nhan: doi ve khoa chuan. */
  const MAT_MEO = ['vui', 'de_biu', 'that_vong', 'ngac_nhien', 'buon', 'gian', 'suy_nghi', 'xau_ho'];
  const MAT_MEO_CU = { happy: 'vui', proud: 'vui', excited: 'vui', sad: 'buon', angry: 'gian',
    surprised: 'ngac_nhien', dizzy: 'ngac_nhien', thinking: 'suy_nghi', love: 'xau_ho', shy: 'xau_ho',
    speechless: 'that_vong', disappointed: 'that_vong', smug: 'de_biu', mocking: 'de_biu' };
  const DONG_TAC_MEO = ['chao', 'cui_chao', 'liem_tay', 'ngu_gat', 'suy_nghi', 'noi_tay_trai', 'noi_tay_phai'];
  const DONG_TAC_MEO_CU = { vay: 'chao', cui: 'cui_chao', ngu: 'ngu_gat', nghi: 'suy_nghi' };
  const khoaMeo = (s) => String(s || '').trim().toLowerCase().replace(/[-\s]+/g, '_');
  const chuanMatMeo = (s) => { const k = khoaMeo(s); return MAT_MEO.includes(k) ? k : (MAT_MEO_CU[k] || null); };

  let lucMatMeo = 0;     // luc doi mat meo gan nhat (set_emotion / nhan xet)
  let lucSenseiMat = 0;  // luc Sensei tu goi set_emotion gan nhat
  function matMeo(ten) {
    const k = chuanMatMeo(ten);
    if (!k || !window.SenseiAvatar) return false;
    lucMatMeo = Date.now();
    return !!window.SenseiAvatar.camXuc(k);
  }

  // Mat doi luc im lang thi meo bo sau ~2.5 s -> toi luc Sensei noi da mat. Hen mat cho TIENG DAU TIEN
  // cua luot sap toi (onAudioData); goi am luot cu con bay toi trong 500 ms dau thi bo qua.
  // Hen trong luc giang thi gan voi nhip do: tam dung / sang nhip khac truoc khi Sensei noi -> bo.
  let matChoNoi = null;   // { k, luc, nhip }
  const khoaSacThai = (s) => { const c = khoaMeo(s); return chuanMatMeo(c) || (c === 'chao' || c === 'cui_chao' ? c : null); };
  /** Sac thai cua muc mot nhip giang (vocab / vi du / cau thoai co "emotion") */
  const sacThaiNhip = (beat) => (beat && beat.data && !Array.isArray(beat.data) ? khoaSacThai(beat.data.emotion) : null);
  function henMatKhiNoi(ten) {
    const k = khoaSacThai(ten);
    matChoNoi = k ? { k, luc: Date.now(), nhip: lectureState === 'PLAYING' ? maNhip : null } : null;
  }
  function apMatChoNoi() {
    const m = matChoNoi, bay = Date.now();
    if (!m || bay - m.luc < 500) return;
    matChoNoi = null;
    if (bay - m.luc > 25000 || lucSenseiMat > m.luc) return;   // qua lau / Sensei da tu dat mat
    if (m.nhip != null && (lectureState !== 'PLAYING' || maNhip !== m.nhip)) return;
    if (MAT_MEO.includes(m.k)) matMeo(m.k); else dongTacMeo(m.k);
  }

  /** act_out: dong tac chuan / ten cu; ten cu la mat (vui, gian...) thi doi mat */
  function dongTacMeo(ten) {
    const av = window.SenseiAvatar;
    if (!av) return false;
    const k = khoaMeo(ten);
    if (DONG_TAC_MEO.includes(k) || DONG_TAC_MEO_CU[k]) return !!av.dienDongTac(DONG_TAC_MEO_CU[k] || k);
    if (chuanMatMeo(k)) return matMeo(k);
    return !!av.dienDongTac(k);   // ten cu khac (an, uong...): hub tu doi sang dong tac gan nhat
  }

  // Nhan xet bai lam: dung -> vui; sai -> luan phien de_biu / that_vong, sai lien tiep >= 3 -> that_vong.
  // tuDong: doan tu loi Sensei / mark_error — mat vua doi (< 4s) thi giu mat do; lan doan trong 4s sau
  // lan dem truoc la CUNG mot loi (phan xa: transcript roi mark_error) -> khong dem lai.
  // Chuoi sai het han sau 2 phut khong sai (mark_error luc giang / phat am khong co lan dung de xoa).
  // Tra ve khoa mat da chon (null = giu mat Sensei vua dat).
  let meoSaiLienTiep = 0, meoLanSai = 0, lucMeoSai = 0;
  function matMeoNhanXet(dung, saiLienTiep, tuDong = false) {
    const bay = Date.now();
    if (dung) meoSaiLienTiep = 0;
    else if (!(tuDong && bay - lucMeoSai < 4000)) {
      if (bay - lucMeoSai > 120000) meoSaiLienTiep = 0;
      meoSaiLienTiep++;
      lucMeoSai = bay;
    }
    if (tuDong && bay - lucMatMeo < 4000) return null;
    const n = saiLienTiep != null ? saiLienTiep : meoSaiLienTiep;
    const k = dung ? 'vui' : n >= 3 || meoLanSai++ % 2 ? 'that_vong' : 'de_biu';
    matMeo(k);
    return k;
  }

  // 5. Xử lý Function Calling (Tool Calls)
  function handleToolCall(call) {
    const { name, args, id } = call;
    addLog("Tool", `Gọi công cụ [${name}]: ${JSON.stringify(args)}`);
    // Luot cua cau / ban thu da huy: khong cho ve bang, doi tab, danh loi
    if (boQuaLuotHuy) return { success: false, error: 'hoc vien da huy luot nay' };
    // San khau dang giang: bang / chu Han / roi den di vao san khau (xem motion.js khiCongCu).
    // null = san khau khong lo tool nay, app xu ly nhu cu.
    const skr = SK()?.dangGiang() ? SK().khiCongCu(name, args || {}) : null;
    if (skr) return skr;
    // Dang CHO hoc vien chon: chinh the bai tap cua luoi dang nam tren san khau (portal, motion-spec bo sung C).
    // Doi chuong / mo bai tap / doi slide cung bai / roi den se ve lai luoi (hoac doi chuong) -> the tren
    // san khau mat cho ve, id trung. Giu nguyen man hinh; doi bai khac thi de nhanh duoi tu choi nhu cu.
    if (SK()?.dangCho()) {
      const a = args || {};
      const doiBaiKhac = name === 'change_slide' && (CAP_DO.ma(a.level, 'N5') !== slideEngine.currentLevel
        || (Number(a.lesson_id) || 1) !== Number(slideEngine.currentLesson));
      if (['change_section', 'open_exercise', 'highlight_element'].includes(name) || (name === 'change_slide' && !doiBaiKhac)) {
        return { success: true, ghiChu: 'học viên đang chọn đáp án — màn hình giữ nguyên' };
      }
    }

    if (name === "section_complete") {
      // Nhip giang do client cam — chi xac nhan cho Sensei, khong dieu khien gi
      return { success: true, acknowledged: args && args.section };
    }
    else if (name === "change_section") {
      const { section, sub_index } = args;
      // Sensei hoat hinh di toi bam vao nut tab (chi la hinh anh, tab van doi ngay)
      const nutTab = { vocab: 'tabVocabBtn', kanji: 'tabKanjiBtn', grammar: 'tabGrammarBtn',
                       kaiwa: 'tabKaiwaBtn', quiz: 'tabQuizBtn' }[section];
      if (window.SenseiAvatar && nutTab) window.SenseiAvatar.bamVao(nutTab);
      slideEngine.setTab(section, sub_index !== undefined ? sub_index : null);
      return { success: true, activeSection: section, subIndex: sub_index };
    }
    else if (name === "change_slide") {
      const { level, lesson_id, slide_index } = args;
      const lvl = CAP_DO.ma(level, 'N5');   // "Nhập môn" / "kana" -> KANA
      const no = Number(lesson_id) || 1;
      // Dang giang theo giao an: sang bai khac giua chung thi cac nhip sau van
      // la cua bai cu (roi sai id, prompt lech bai) -> khong cho doi bai.
      const doiBai = lvl !== slideEngine.currentLevel || no !== Number(slideEngine.currentLesson);
      if (doiBai && lectureState === 'PLAYING') {
        return { success: false, error: 'dang giang bai hien tai theo giao an, khong doi bai giua chung' };
      }
      if (!coBai(lvl, no) || slideEngine.renderSlide(lvl, no, slide_index) === false) {
        return loiKhongCoBai(lvl, no);
      }
      if (levelSelect) levelSelect.value = lvl;
      populateLessons(lvl, no);
      return { success: true, currentLevel: lvl, lesson: no, slide: slide_index };
    }
    else if (name === "highlight_element") {
      const { target_id, style_type, comment } = args;
      // Sensei tự chỉ đích thì đây là nguồn CHÍNH XÁC NHẤT — ghi mốc để
      // bộ bám theo transcript ngừng can thiệp trong một khoảng.
      lastToolFocusAt = Date.now();
      clearPendingFocus();
      slideEngine.focusItem(target_id, style_type || 'reading_focus', comment);
      return { success: true, highlighted: target_id };
    }
    else if (name === "open_exercise") {
      const { level, lesson_id, exercise_index } = args;
      const lvl = CAP_DO.ma(level, slideEngine.currentLevel);
      const no = Number(lesson_id) || Number(slideEngine.currentLesson);
      // Bai khong co that: bao lai, KHONG dung vao o chon cap / bai
      if (!coBai(lvl, no)) return loiKhongCoBai(lvl, no);
      if (levelSelect) levelSelect.value = lvl;
      populateLessons(lvl, no);
      const ok = slideEngine.openExercise(lvl, no, exercise_index || 0);

      // Khi đã mở phần bài tập, dừng tự động giục slide
      // KHÔNG tạm dừng ở đây: mở bài tập là MỘT BƯỚC của giáo án.
      // Chuyển sang PAUSED sẽ làm Sensei tắt tiếng giữa chừng.
      if (ok) addLog("System", "Sensei đã mở bảng bài tập thực hành củng cố kiến thức!");
      return { success: ok, openedQuiz: ok, level: lvl, lesson: no };
    }
    else if (name === "mark_error") {
      const { wrong_phrase, corrected_phrase, explanation } = args;
      // Vua cham sai cau trac nghiem: khung nhan xet trong the da ghi dap an dung + loi nhac ->
      // khong mo them bang sua loi de len chinh the do (dien thoai: che ca nhan xet lan dap an C/D)
      const vuaChamSai = slideEngine.activeTab === 'quiz' && Date.now() - lucChamSai < 60000;
      if (!vuaChamSai) slideEngine.markError(wrong_phrase, corrected_phrase, explanation);
      // Meo che / that vong (cau trac nghiem thi mat da doi luc cham, khong tinh them mot lan sai)
      if (!vuaChamSai) matMeoNhanXet(false, undefined, true);
      return { success: true, marked: wrong_phrase };
    }
    // act_out / set_emotion chi la trang tri: khoa hop le thi luon bao thanh cong (meo dang an / chua nap
    // thi thoi) — bao loi moi lan lai lam Sensei goi lai hoac xin loi thanh tieng
    else if (name === "act_out") {
      const k = khoaMeo(args && args.action);
      const ok = dongTacMeo(k);
      return ok || DONG_TAC_MEO.includes(k) || DONG_TAC_MEO_CU[k] || chuanMatMeo(k)
        ? { success: true, acted: k }
        : { success: false, error: 'action hop le: ' + DONG_TAC_MEO.join(', ') };
    }
    else if (name === "set_emotion") {
      const k = chuanMatMeo(args && args.emotion);
      if (!k) return { success: false, error: 'emotion hop le: ' + MAT_MEO.join(', ') };
      lucSenseiMat = Date.now();
      matMeo(k);
      return { success: true, emotion: k };
    }
    else if (name === "draw_on_board") {
      const { target_id, kind, to_id } = args;
      if (!window.SenseiBoard) return { success: false, error: "chua nap lop bang" };
      const ok = SenseiBoard.veLen(target_id, kind || 'khoanh', { toId: to_id });
      return { success: ok, drew: kind, on: target_id };
    }
    else if (name === "write_kanji") {
      const { character } = args;
      if (!window.SenseiBoard) return { success: false, error: "chua nap lop bang" };
      const ok = SenseiBoard.vietChuHan(character);
      // Chua co net chu nay thi bao lai de Sensei biet ma giang bang loi
      return ok ? { success: true, wrote: character }
                : { success: false, error: `chua co du lieu net cua chu ${character}` };
    }
    else if (name === "write_on_board") {
      const { text, style } = args;
      if (!window.SenseiBoard) return { success: false, error: "chua nap lop bang" };
      // Luoi an toan: san khau dang chay ma khong nhan tool nay -> van ghi ngam, khong mo bang giua nhip
      return { success: SenseiBoard.vietBang(text, style || 'thuong', { im: !!SK()?.dangGiang() }) };
    }
    else if (name === "clear_board") {
      if (window.SenseiBoard) SenseiBoard.xoaBang();
      return { success: true };
    }

    return { success: false, error: "Unknown tool call" };
  }

  // 6. Điều phối Chế độ Giảng bài Theo Kịch bản (Start / Pause / Resume / Raise Hand)
  function updateLectureControlsUI() {
    // Bat bien san khau: khong con PLAYING thi tat san khau, tra luoi ve tinh (motion.js dongBo)
    SK()?.dongBo(lectureState, { isRaisingHand });
    // Moi lan doi lectureState deu goi ham nay -> bao meo Sensei ngay (dang giang thi khong ngu gat / liem tay).
    // henBaoMeo chi co sau khi khoi tao xong het bien trang thai (baoMeoBan doc ca phanXa, pxChoPhan...)
    if (henBaoMeo) baoMeoBan();

    // 1. Cập nhật nút autoLectureBtn (Start / Pause / Resume)
    if (autoLectureBtn) {
      const currentStep = currentLectureSteps[currentLectureStepIndex];
      const chapter = currentStep ? tenChuong(currentStep.chapter) : null;

      if (isConnecting) {
        autoLectureBtn.className = "ctl ctl-go";
        autoLectureBtn.disabled = true;
        if (autoLectureIcon) autoLectureIcon.className = "fa-solid fa-circle-notch fa-spin";
        if (autoLectureText) autoLectureText.innerText = "Đang vào lớp…";
      } else if (lectureState === 'PLAYING') {
        autoLectureBtn.disabled = false;
        autoLectureBtn.className = "ctl ctl-pause";
        if (autoLectureIcon) autoLectureIcon.className = "fa-solid fa-pause";
        if (autoLectureText) autoLectureText.innerText = chapter ? `Tạm dừng — ${chapter}` : "Tạm dừng";
      } else if (lectureState === 'PAUSED') {
        autoLectureBtn.disabled = false;
        autoLectureBtn.className = "ctl ctl-resume";
        if (autoLectureIcon) autoLectureIcon.className = "fa-solid fa-play";
        if (autoLectureText) autoLectureText.innerText = chapter ? `Giảng tiếp — ${chapter}` : "Giảng tiếp";
      } else {
        autoLectureBtn.disabled = false;
        autoLectureBtn.className = "ctl ctl-go";
        if (autoLectureIcon) autoLectureIcon.className = "fa-solid fa-play";
        if (autoLectureText) autoLectureText.innerText = "Bắt đầu giảng bài";
      }
      // Dang thu cau hoi: giang tiep luc nay la Sensei noi vao mic dang mo va
      // nhip khong bao gio sang (dang gio tay) — phai Gui hoac Huy truoc.
      if (isRaisingHand) autoLectureBtn.disabled = true;
    }

    // 2. Nút giơ tay (ẩn khi đang thu âm — lúc đó hiện Gửi/Hủy). KHÔNG khoá
    // theo geminiClient.isConnected — bấm nút la tu ensureConnected(), không
    // cần đã kết nối sẵn hay đã bấm "Bắt đầu giảng bài".
    if (raiseHandBtn) {
      raiseHandBtn.className = "ctl ctl-warn";
      if (raiseHandIcon) raiseHandIcon.className = "fa-solid fa-hand";
      if (raiseHandText) raiseHandText.innerText = "Giơ tay hỏi";
      raiseHandBtn.classList.toggle('hidden', isRaisingHand);
    }
    if (askSendBtn) askSendBtn.classList.toggle('hidden', !isRaisingHand);
    if (askCancelBtn) askCancelBtn.classList.toggle('hidden', !isRaisingHand);
  }

  function cancelStepTransition() {
    clearPendingFocus();
    ketBaiDangHen = false;
    if (autoStepTransitionTimer) {
      clearTimeout(autoStepTransitionTimer);
      autoStepTransitionTimer = null;
    }
    if (nextStepBtn) {
      nextStepBtn.classList.add('hidden');
    }
  }

  /* ======================================================================
     BỘ ĐIỀU PHỐI BÀI GIẢNG — chạy theo NHỊP (beat), mỗi nhịp đúng MỘT mục.

     Thiết kế cũ: một bước = trọn một chương ("Từ vựng" = cả 30 từ).
     Hệ quả là client mù hoàn toàn:
       - Không biết Sensei đang đọc từ nào  -> phải đoán qua transcript / chờ
         Sensei tự gọi highlight_element -> đèn rọi sai hoặc không hiện.
       - Coi "model kết thúc lượt nói" = "giảng xong chương". Nhưng model Live
         kết thúc lượt liên tục khi đi qua 30 từ -> bị nhắc, bị cắt lời, rồi
         nhảy sang Ngữ pháp khi mới đọc được vài từ.

     Thiết kế mới: client cầm kịch bản. Mỗi mục trong giáo án là một nhịp.
     Client tự rọi đèn (nên LUÔN đúng mục), gửi prompt cho đúng mục đó, chờ
     Sensei nói xong rồi mới sang nhịp kế. Không cần model tự báo, không đoán.
     ====================================================================== */

  const CHAPTER_LABEL = {
    vocab: 'Từ vựng',
    kanji: 'Chữ Hán',
    grammar: 'Ngữ pháp',
    kaiwa: 'Hội thoại',
    quiz: 'Bài tập',
  };
  /** Ten chuong hien cho nguoi hoc: bai Nhap mon goi chuong chu la "Chữ cái" */
  const tenChuong = (chapter, lvl = slideEngine.currentLevel) =>
    (chapter === 'kanji' ? CAP_DO.tenChuongChu(lvl) : CHAPTER_LABEL[chapter]);

  function buildLecturePlan(lvl, lessonNum) {
    const lesson = curriculumLoader.getLesson(lvl, lessonNum);
    if (!lesson) return [];

    const beats = [];
    const add = (b) => { b.index = beats.length; beats.push(b); };

    // --- Chương 1: Từ vựng — mỗi từ một nhịp ---
    const vocabs = lesson.vocabList || [];
    vocabs.forEach((v, i) => add({
      chapter: 'vocab', tab: 'vocab', kind: 'vocab',
      targetId: v.id, data: v,
      label: `Từ vựng ${i + 1}/${vocabs.length}`,
      isChapterStart: i === 0,
    }));

    // --- Chương 2: Chữ Hán (bai Nhap mon: chu cai kana, nhan "Hiragana 3/15" / "Katakana ..." / "Chữ cái ...") ---
    const kanjis = lesson.kanjiList || [];
    kanjis.forEach((k, i) => add({
      chapter: 'kanji', tab: 'kanji', kind: 'kanji',
      targetId: k.id, data: k,
      label: `${CAP_DO.laChuKana(k) ? (CAP_DO.bangChu(k) || 'Chữ cái') : 'Chữ Hán'} ${i + 1}/${kanjis.length}`,
      isChapterStart: i === 0,
    }));

    // --- Chương 3: Ngữ pháp — mỗi slide mở bằng công thức, rồi từng ví dụ ---
    const slides = lesson.slides || [];
    slides.forEach((sl, si) => {
      add({
        chapter: 'grammar', tab: 'grammar', kind: 'grammar-intro',
        subIndex: si, targetId: null, data: sl,
        label: `Ngữ pháp ${si + 1}/${slides.length} — công thức`,
        isChapterStart: si === 0,
      });
      (sl.examples || []).forEach((ex, ei) => add({
        chapter: 'grammar', tab: 'grammar', kind: 'example',
        subIndex: si, targetId: ex.id, data: ex, slide: sl,
        label: `Ngữ pháp ${si + 1} — ví dụ ${ei + 1}/${(sl.examples || []).length}`,
      }));
    });

    // --- Chương 4: Hội thoại — chạy hai lượt ---
    //   Lượt 1: các nhân vật đối thoại liền mạch bằng giọng riêng, không ai cắt ngang.
    //   Lượt 2: Sensei đi lại từng câu, đọc lại và giảng kỹ.
    const dialogue = lesson.dialogue || [];
    if (dialogue.length) {
      add({
        chapter: 'kaiwa', tab: 'kaiwa', kind: 'kaiwa-intro',
        targetId: null, data: dialogue,
        label: 'Hội thoại — bối cảnh & nhân vật',
        isChapterStart: true,
      });
      add({
        chapter: 'kaiwa', tab: 'kaiwa', kind: 'kaiwa-run',
        targetId: null, data: dialogue,
        label: `Hội thoại — nghe trọn đoạn (${dialogue.length} lượt)`,
      });
    }
    dialogue.forEach((d, i) => add({
      chapter: 'kaiwa', tab: 'kaiwa', kind: 'kaiwa',
      targetId: d.id, data: d,
      label: `Giảng kỹ câu ${i + 1}/${dialogue.length}`,
    }));

    // --- Chương 5: Bài tập — mỗi câu một nhịp ---
    const exercises = lesson.exercises || [];
    exercises.forEach((q, i) => add({
      chapter: 'quiz', tab: 'quiz', kind: 'quiz',
      subIndex: i, targetId: 'card-' + q.id, data: q,
      label: `Bài tập ${i + 1}/${exercises.length}`,
      isChapterStart: i === 0,
    }));

    return beats;
  }

  /** Soạn lời dặn cho Sensei ứng với đúng MỘT mục */
  function buildBeatPrompt(beat, lesson, lvl) {
    const head = `[LỚP ${CAP_DO.ten(lvl)} — ${lesson.title}] [${beat.label}]`;
    const common =
      '\n\nDẶN SENSEI: Màn hình đã tự phóng to đúng mục này rồi nên KHÔNG cần gọi highlight_element. ' +
      'Nhưng BẢNG thì vẫn là của thầy: cứ dùng write_on_board / write_kanji / draw_on_board ' +
      'khi có thứ đáng cho học viên NHÌN chứ không chỉ nghe. ' +
      'Chỉ giảng DUY NHẤT mục này rồi dừng — hệ thống sẽ tự chuyển sang mục kế tiếp. ' +
      'Tuyệt đối không giảng lướt sang mục khác, không đọc lại danh sách.' +
      // Muc co "emotion": bao Sensei doc dung giong; mat meo app tu doi luc Sensei cat loi (henMatKhiNoi)
      (sacThaiNhip(beat) ? `\n\nSẮC THÁI: mục này mang sắc thái ${sacThaiNhip(beat)} — đọc nó đúng giọng đó. ` +
        'Mặt mèo tự đổi lúc bắt đầu nói, KHÔNG cần gọi set_emotion.' : '');

    // Goi y rieng cho tung dang nhip. Viet gi len bang phu thuoc vao dang bai
    // dang day, dan chung chung mot cau thi Sensei hoac khong ghi gi, hoac ghi
    // bua lam day bang.
    const BANG = {
      vocab:
        '\n\nBẢNG: nếu mẹo nhớ của từ này gói được thành MỘT dòng ngắn thì gọi ' +
        'write_on_board(mẹo đó, "thuong"). Mẹo dài dòng thì thôi, nói miệng là đủ — ' +
        'đừng chép cả câu giải thích lên bảng.',
      // Hai muc nay ghi THANG gia tri that vao lenh. De o trong ("<chu Han nay>")
      // thi Sensei phai tu suy ra tham so — them mot buoc la them mot cho sai.
      kanjiCua: (ch) =>
        `\n\nBẢNG (BẮT BUỘC): gọi write_kanji("${ch}") NGAY TRƯỚC khi giảng mặt chữ. ` +
        'Nói suông "tám nét" thì học viên không biết nét nào trước nét nào — phải cho nó nhìn thấy ' +
        'từng nét chạy ra. Viết xong mới kể chuyện chiết tự.',
      congThuc: () =>
        '\n\nBẢNG: công thức ĐÃ được ghi sẵn lên bảng rồi, đừng ghi lại. ' +
        'Cứ vừa giảng vừa chỉ vào bảng. Muốn bổ sung thì ghi thêm một dòng ' +
        'write_on_board(..., "nhat") — ví dụ một lỗi hay gặp.',
      example:
        '\n\nBẢNG: các trợ từ trọng tâm của câu này ĐÃ được khoanh đỏ sẵn trên màn hình. ' +
        'Cứ giảng thẳng vào chỗ đã khoanh. Muốn chỉ thêm quan hệ giữa hai thành phần thì ' +
        'gọi draw_on_board(<id A>, "mui_ten", <id B>).',
      kaiwa:
        '\n\nBẢNG: khoanh chỗ trọng tâm bằng draw_on_board(<id trọng tâm>, "khoanh") khi giảng tới nó. ' +
        'Nêu cách nói thay thế thì ghi câu thay thế lên bảng bằng write_on_board để học viên đối chiếu.',
      quiz:
        '\n\nBẢNG: giảng xong đáp án thì ghi MỘT dòng chốt lên bảng — mẹo để lần sau không sai nữa. ' +
        'Học viên chọn sai thì gạch bỏ đáp án sai bằng draw_on_board(<id câu>, "gach_xoa") cho nó nhớ mặt.',
    };

    if (beat.kind === 'vocab') {
      const v = beat.data;
      return `${head}
Dạy từ vựng: ${v.kanji || v.word}${v.furigana ? ` (${v.furigana})` : ''} [${v.romaji || ''}] — ${v.meaningVi}
${v.wordType ? `Từ loại: ${v.wordType}. ` : ''}${v.accentNote ? `Trọng âm: ${v.accentNote}` : ''}

Hãy: (1) đọc to CHUẨN giọng Tokyo 2 lần thật chậm cho học viên nhại theo;
(2) giải nghĩa tiếng Việt; (3) cho một mẹo nhớ dí dỏm; (4) đặt MỘT câu ví dụ ngắn dùng từ này rồi dịch.${common}${BANG.vocab}`;
    }

    if (beat.kind === 'kanji' && CAP_DO.laChuKana(beat.data)) {
      // Chu cai kana (bai Nhap mon): KHONG Han Viet / On / Kun / chiet tu — chi mat chu, cach doc,
      // meo hinh dang, chu de nham, 2 tu vi du va thu tu net.
      const k = beat.data;
      const ch = String(k.character || '');
      const bang = CAP_DO.bangChu(k);
      const ghep = Array.from(ch).length > 1;
      const dsTu = (k.commonWords || []).filter(cw => cw && cw.word).slice(0, 2);
      const tu = dsTu.map(cw => `${cw.word}${cw.meaningVi ? ` = ${cw.meaningVi}` : ''}`).join('; ');
      return `${head}
Dạy chữ cái ${bang ? bang + ' ' : ''}${ghep ? '(âm ghép) ' : ''}${ch}${k.romaji ? ` — đọc "${k.romaji}"` : ''}
${k.meaningVi ? `Cách phát âm (so với tiếng Việt): ${k.meaningVi}\n` : ''}${k.meoNho ? `Mẹo nhớ mặt chữ: ${k.meoNho}\n` : ''}${k.sosanh ? `Dễ nhầm: ${k.sosanh}\n` : ''}${tu ? `Từ ví dụ: ${tu}\n` : ''}
Hãy: (1) gọi tên chữ ${ch}${k.romaji ? ` và đọc to "${k.romaji}"` : ''} 2 lần thật rõ cho học viên nhại theo, so với âm tiếng Việt gần nhất;
(2) kể mẹo nhớ mặt chữ; (3) cảnh báo chữ dễ nhầm và chỉ ra chỗ khác nhau;
(4) đọc ${tu ? `${dsTu.length} từ ví dụ` : 'một từ ví dụ ngắn có chữ này'} và giải nghĩa.
Đây là bảng chữ cái: KHÔNG nói âm Hán Việt, âm On/Kun hay chiết tự.${common}

BẢNG (BẮT BUỘC): gọi write_kanji("${ch}") NGAY TRƯỚC khi kể mẹo nhớ để học viên thấy thứ tự nét${ghep ? ' (chữ lớn trước, chữ nhỏ sau)' : ''}.`;
    }

    if (beat.kind === 'kanji') {
      const k = beat.data;
      const words = (k.commonWords || []).map(cw => `${cw.word} (${cw.furigana}) = ${cw.meaningVi}`).join('; ');
      return `${head}
Dạy chữ Hán: ${k.character} — Hán Việt ${k.hanViet}, ${k.strokeCount} nét — nghĩa: ${k.meaningVi}
Âm On: ${(k.onyomi || []).join(', ') || '—'} | Âm Kun: ${(k.kunyomi || []).join(', ') || '—'}
Từ ghép: ${words || '—'}

Hãy: (1) kể câu chuyện chiết tự giúp nhớ mặt chữ; (2) đọc rõ âm On và âm Kun;
(3) đọc các từ ghép và giải nghĩa.${common}${BANG.kanjiCua(k.character)}`;
    }

    if (beat.kind === 'grammar-intro') {
      const sl = beat.data;
      // Tu dung cong thuc len bang, khong cho Sensei nho goi. Cong thuc la thu
      // hoc vien phai nhin suot ca mau cau — khong the de tuy hung.
      if (window.SenseiBoard && sl.grammarFormula) {
        // Dang co san khau: ghi ngam vao bang (khong mo bang, khong day canh mep 390 px giua nhip)
        const im = !!SK()?.dangGiang();
        SenseiBoard.xoaBang();
        SenseiBoard.vietBang(sl.title || 'Mẫu câu', 'nhat', { im });
        SenseiBoard.vietBang(sl.grammarFormula, 'dam', { im });
        if (sl.teacherTips) SenseiBoard.vietBang('⚠ ' + sl.teacherTips, 'nhat', { im });
      }
      return `${head}
Mở mẫu ngữ pháp: ${sl.title}
Công thức: ${sl.grammarFormula}
Bản chất: ${sl.explanation}
${sl.teacherTips ? `Lưu ý: ${sl.teacherTips}` : ''}

Hãy giảng kỹ Ý NGHĨA và CÁCH DÙNG của công thức này (chưa đọc ví dụ, ví dụ sẽ tới ngay sau).${common}${BANG.congThuc(sl.grammarFormula)}`;
    }

    if (beat.kind === 'example') {
      const ex = beat.data;
      const jp = (ex.tokens || []).map(t => t.kanji || t.text).join('');
      const parts = (ex.tokens || []).map(t => {
        const w = t.kanji && t.furigana ? `${t.kanji}(${t.furigana})` : t.text;
        // Kem id de Sensei co cai ma khoanh — khong co id thi no bia ra id sai
        return w + (t.isKeyGrammar ? ` ←trọng tâm [id: ${t.id}]` : '');
      }).join(' + ');
      return `${head}
Phân tích câu ví dụ: 「${jp}」 [id câu: ${ex.id}]
Dịch: ${ex.meaningVi}
Tách thành phần: ${parts}

Hãy: (1) đọc to diễn cảm cả câu 2 lần; (2) tách từng thành phần và nói rõ vai trò của trợ từ;
(3) dịch nghĩa.${common}${BANG.example}`;
    }

    if (beat.kind === 'kaiwa-intro') {
      const cast = (window.SenseiVoices ? window.SenseiVoices.castOf(beat.data) : [])
        .map(c => `${c.speaker}${c.ten && c.ten !== c.speaker ? ' – ' + c.ten : ''} (${c.genderVi})`).join(', ');
      const flow = beat.data.map(d => `${d.speaker}: ${d.meaningVi}`).join(' → ');
      return `${head}
Sắp vào đoạn hội thoại. Dàn nhân vật: ${cast || 'chưa rõ'}
Mạch câu chuyện theo nghĩa tiếng Việt: ${flow}

Hãy DẪN CHUYỆN ngắn gọn bằng tiếng Việt: giới thiệu từng nhân vật là ai, nam hay nữ,
họ đang ở đâu, chuyện gì sắp diễn ra, và dặn học viên chú ý điều gì khi nghe.
CHƯA đọc câu tiếng Nhật nào — ngay sau đây học viên sẽ nghe trọn đoạn thoại.${common}`;
    }

    if (beat.kind === 'kaiwa-run') {
      // Chi dung khi chua dung duoc giong nhan vat; con lai client tu phat, khong goi Sensei
      const gv = (d) => (window.SenseiVoices && SenseiVoices.genderOf(d.speaker, d.speakerGender) === 'f' ? 'nữ' : 'nam');
      const lines = beat.data.map(d => `${d.speaker} (${gv(d)}): 「${(d.tokens || []).map(t => t.kanji || t.text).join('')}」`).join('\n');
      return `${head}
Đọc TRỌN đoạn hội thoại sau một mạch, đóng đủ các vai, không dừng giữa chừng,
không dịch, không giải thích — để học viên nghe cảm giác hội thoại thật:
${lines}

Đổi chất giọng giữa các vai theo đúng giới tính ghi trong ngoặc, mỗi nhân vật một chất giọng riêng.${common}`;
    }

    if (beat.kind === 'kaiwa') {
      const d = beat.data;
      const jp = (d.tokens || []).map(t => t.kanji || t.text).join('');
      const g = window.SenseiVoices ? window.SenseiVoices.genderOf(d.speaker, d.speakerGender) : 'm';
      const parts = (d.tokens || []).map(t => {
        const w = t.kanji && t.furigana ? `${t.kanji}(${t.furigana})` : t.text;
        return w + (t.isKeyGrammar ? ` ←trọng tâm [id: ${t.id}]` : '');
      }).join(' + ');
      return `${head}
Học viên vừa nghe trọn đoạn hội thoại. Giờ mổ xẻ câu này:
${d.speaker} (${g === 'f' ? 'nữ' : 'nam'}): 「${jp}」
Dịch: ${d.meaningVi}
Tách thành phần: ${parts}

Hãy: (1) ĐỌC LẠI câu này thật chậm và rõ để học viên nhại theo;
(2) giải thích NGỮ CẢNH — vì sao ở tình huống này lại nói như vậy;
(3) nêu các TRƯỜNG HỢP DÙNG khác của mẫu câu/từ khoá trong câu;
(4) đưa MỘT câu thay thế nói được cùng ý (trang trọng hơn hoặc thân mật hơn) và chỉ rõ khác nhau ở đâu.${common}${BANG.kaiwa}`;
    }

    if (beat.kind === 'quiz') {
      const q = beat.data;
      const opts = (q.options || []).map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join(' | ');
      return `${head}
Câu hỏi: ${q.question}
Các lựa chọn: ${opts}

Hãy đọc to câu hỏi và các lựa chọn, gợi ý hướng suy nghĩ nhưng TUYỆT ĐỐI KHÔNG tiết lộ đáp án.
Khích lệ học viên tự bấm chọn trên màn hình.${common}`;
    }

    return `${head}${common}`;
  }

  function executeLectureStep(stepIndex, isResume = false) {
    if (lectureState !== 'PLAYING' || !geminiClient.isConnected) return;

    if (stepIndex >= currentLectureSteps.length) {
      finishLecture();
      return;
    }

    const beat = currentLectureSteps[stepIndex];
    const lvl = slideEngine.currentLevel;
    const lessonNum = slideEngine.currentLesson;
    const lesson = curriculumLoader.getLesson(lvl, lessonNum);
    if (!lesson) return;

    // Mo lai cong am thanh cho nhip moi
    if (audioEngine) audioEngine.setSuppressed(false);

    currentLectureStepIndex = stepIndex;
    const ma = ++maNhip;
    currentStepStartTime = Date.now();
    currentStepRetryCount = 0;
    // Nhip moi thay cho loi cham bai con dở (vd bam "Giảng tiếp" khi Sensei
    // chua cham xong): khong de co "dang chen ngang" cu chan nhip nay mai.
    senseiChenNgang = false;
    clearTimeout(chenNgangTimer);
    cancelStepTransition();
    if (choHocVien) { clearTimeout(choHocVien.hen); choHocVien = null; }   // luoi an toan: nhip moi thay cho cho cu

    lectureCheckpoint = {
      stepIndex: stepIndex,
      sectionName: beat.tab,
      subIndex: beat.subIndex,
      level: lvl,
      lessonNum: lessonNum,
    };

    // 1. Mở đúng chương / đúng slide
    const needTab = beat.tab !== slideEngine.activeTab;
    const needSlide = beat.tab === 'grammar' && beat.subIndex !== undefined
                      && beat.subIndex !== slideEngine.currentSlideIndex;
    if (needTab || needSlide) {
      slideEngine.setTab(beat.tab, beat.subIndex !== undefined ? beat.subIndex : null);
    }

    // 1b. San khau giang: dung + dua canh cua nhip nay vao TRUOC focusItem, de den roi /
    //     meo chi tay tim thay phan tu st-<id> tren san khau (resolveElement chuyen huong).
    const sk = SK();
    if (sk) {
      const cungChuong = currentLectureSteps.filter(b => b.chapter === beat.chapter);
      sk.batDauNhip(beat, {
        i: stepIndex,
        n: currentLectureSteps.length,
        chuong: { ten: tenChuong(beat.chapter, lvl), i: cungChuong.indexOf(beat) + 1, n: cungChuong.length },
        bai: lesson,
        capDo: lvl,
        isResume,
        laBatDau: batDauMoi,
        truoc: currentLectureSteps[stepIndex - 1] || null,
        cacNhip: currentLectureSteps,
      });
    }
    batDauMoi = false;

    // 2. Rọi đèn vào ĐÚNG mục sắp giảng.
    //    Client tự làm nên luôn khớp — không còn phụ thuộc Sensei gọi tool hay
    //    dò theo transcript. Cũng khoá bộ bám transcript lại để khỏi chen ngang.
    lastToolFocusAt = Date.now();
    clearPendingFocus();
    if (beat.targetId) {
      // khongMat: meo chi chi tay; mat theo sac thai muc hen toi luc Sensei cat loi (sendToSensei)
      slideEngine.focusItem(beat.targetId, 'reading_focus', null, { khongMat: true });
    } else {
      slideEngine.clearReadingFocus();
    }

    updateLectureControlsUI();

    // 3. Với lượt thoại đã dựng sẵn giọng nhân vật: phát TRƯỚC, rồi Sensei mới phân tích
    const sendToSensei = () => {
      if (lectureState !== 'PLAYING' || currentLectureStepIndex !== stepIndex) return;
      let prompt = buildBeatPrompt(beat, lesson, lvl);
      if (isResume) prompt = '[HỌC TIẾP SAU KHI TẠM DỪNG]\n' + prompt;
      // Thoi gian phat giong nhan vat khong duoc tinh vao "Sensei da noi bao lau"
      currentStepStartTime = Date.now();
      henMatKhiNoi(sacThaiNhip(beat));   // null = xoa mat hen cua nhip truoc
      geminiClient.sendUserMessage(prompt);
      maNhipDaGui = ma;
    };

    // Khong doi TAT CA cau deu dung duoc: cau nao thieu thi lui ve giong
    // trinh duyet theo gioi tinh. Mot cau hong khong con lam ca doan mat giong.
    const hasVoices = beat.kind === 'kaiwa-run' && (beat.data || []).length > 0;

    if (hasVoices) {
      // Lượt 1: client tự phát trọn đoạn, KHÔNG gọi Sensei. Phát xong thì sang nhịp kế.
      beat.clientOnly = true;
      playWholeDialogue(beat.data, stepIndex).then(ok => {
        if (lectureState !== 'PLAYING' || currentLectureStepIndex !== stepIndex) return;
        if (ok) scheduleAutoNextStep();
        else { beat.clientOnly = false; sendToSensei(); }
      });
    } else if (beat.kind === 'kaiwa') {
      // Luot 2: nghe lai chinh giong nhan vat, XONG HAN roi Sensei moi mo xe.
      // Hai giong khong bao gio chong len nhau.
      slideEngine.focusItem(beat.targetId, 'reading_focus', null, { khongMat: true });
      audioEngine.stopPlayback();
      SK()?.khiDongThoai(beat.data, 0);
      playDialogueLine(beat.data)
        .then(() => {
          if (lectureState === 'PLAYING' && currentLectureStepIndex === stepIndex) SK()?.khiXongDong(beat.data.id);
          return new Promise(r => setTimeout(r, 300));
        })
        .then(sendToSensei)
        .catch(sendToSensei);
    } else {
      sendToSensei();
    }
  }

  // Phep thu doi giong giua phien. Go trong Console:  await __voice.try('Kore')
  // Canh bao: neu server khong cho, phien co the bi dong va phai vao lop lai.
  window.__voice = {
    /** Xem ngay tinh trang long tieng: dung duoc bao nhieu cau, hong o dau */
    status: () => {
      const dia = curriculumLoader.getDialogue(slideEngine.currentLevel, slideEngine.currentLesson) || [];
      return {
        bai: `${slideEngine.currentLevel} bài ${slideEngine.currentLesson}`,
        tongLuotThoai: dia.length,
        daDungGiong: dia.filter(d => audioDongConDung(d)).length,
        modelDangDung: actorModel(),
        daTatLongTieng: ttsDisabled,
        loiGanNhat: lastActorError,
        senseiDangKetNoi: geminiClient.isConnected,
        phanVai: window.SenseiVoices ? SenseiVoices.castOf(dia) : null,
      };
    },
    /** Dung lai giong tu dau cho bai dang mo (dung de thu tay) */
    rebuild: async () => {
      const lvl = slideEngine.currentLevel, no = slideEngine.currentLesson;
      (curriculumLoader.getDialogue(lvl, no) || []).forEach(d => { delete dialogueAudio[d.id]; delete dialogueAudioVoice[d.id]; });
      ttsDisabled = false;
      actorModelIdx = 0;
      soloRetryDone = false;
      lastActorError = null;
      closeAllActorPools();
      await prefetchDialogueAudio(lvl, no, { verbose: true });
      return window.__voice.status();
    },
    current: () => geminiClient.voiceName,
    list: () => (window.SenseiVoices ? { nam: SenseiVoices.MALE, nu: SenseiVoices.FEMALE } : null),
    cast: () => (window.SenseiVoices
      ? SenseiVoices.castOf(curriculumLoader.getDialogue(slideEngine.currentLevel, slideEngine.currentLesson))
      : null),
    try: async (voiceName) => {
      const r = await geminiClient.trySetVoice(voiceName);
      showToast(r.ok ? `Đổi giọng giữa phiên ĐƯỢC: ${r.reason}` : `Không đổi được giọng: ${r.reason}`,
                r.ok ? 'info' : 'error', 10000);
      console.log('[voice probe]', r);
      return r;
    },
  };

  // Cua so chan doan: xem nhanh kich ban nhip cua bai dang mo.
  // Go vao Console:  __lecture.plan()   /  __lecture.state()
  window.__lecture = {
    plan: () => buildLecturePlan(slideEngine.currentLevel, slideEngine.currentLesson)
      .map(b => ({ i: b.index, chapter: b.chapter, label: b.label, target: b.targetId })),
    state: () => ({
      lectureState,
      beat: currentLectureStepIndex,
      total: currentLectureSteps.length,
      current: currentLectureSteps[currentLectureStepIndex] || null,
    }),
    startFrom: (i) => startLecture(i),
    firstBeat: () => {
      currentLectureSteps = buildLecturePlan(slideEngine.currentLevel, slideEngine.currentLesson);
      return firstBeatOfCurrentView();
    },
    beats: () => currentLectureSteps,
    index: () => currentLectureStepIndex,
    // Che do mo phong (?moPhong, js/mo-phong.js): nap giong thoai tong hop thay long tieng that
    ...(/[?&]moPhong\b/i.test(location.search) ? {
      datGiongThoai: (id, pcm) => { dialogueAudio[id] = pcm; delete dialogueAudioVoice[id]; },
    } : {}),
  };
  // San khau giang: khiTiepTuc / khiBoQua = nut "Tiếp tục ▸" / "Bỏ qua" o thanh ray khi cho hoc vien.
  // khiKetBai(dich): nut tren the ket bai (dich 'phat-am' | 'xem-lai') -> xong bai ngay, khong doi het gio
  SK()?.init({ audioEngine, slideEngine, khiTiepTuc: tiepSauCho, khiBoQua: tiepSauCho, khiKetBai: ketBaiNgay });

  /**
   * opts.dich: 'phat-am' (mac dinh: dang o chuong Bai tap thi nhay xuong Phat am) | 'xem-lai' (o yen luoi).
   * Co san khau: nhay sau khi san khau mo het (KET_BAI_TRE_CUON); khong co: ngay nhu cu.
   */
  function finishLecture(opts = {}) {
    const coSan = !!SK();
    if (audioEngine) audioEngine.setSuppressed(false);
    if (choHocVien) { clearTimeout(choHocVien.hen); choHocVien = null; }
    lectureState = 'IDLE';
    SK()?.dung();   // tat san khau + don bo nho canh / cham bai tap, luoi ve tinh ngay
    cancelStepTransition();
    slideEngine.clearReadingFocus();
    updateLectureControlsUI();
    if (nextStepBtn) nextStepBtn.classList.add('hidden');
    showToast('Đã học xong toàn bộ bài. Mời bạn làm bài tập để kiểm tra lại!');
    // The ket bai hen "Luyện tiếp: Phát âm · Viết tay — ngay bên dưới": dang o chuong Bai tap
    // thi nhay xuong muc Phat am (nut nhay san co cua chuong, cuon muot nhu bam tay)
    clearTimeout(ketBaiCuonTimer);
    ketBaiCuonTimer = null;
    const dich = opts.dich || 'phat-am';
    if (dich !== 'phat-am') return;
    const bai = slideEngine.currentLevel + '/' + slideEngine.currentLesson;
    const nhay = () => {
      ketBaiCuonTimer = null;
      // hoc vien da mo bai khac / doi chuong / giang lai trong luc cho -> thoi
      if (lectureState !== 'IDLE' || slideEngine.activeTab !== 'quiz' || bai !== slideEngine.currentLevel + '/' + slideEngine.currentLesson) return;
      try { document.querySelector('#slideContent [data-qz-toi="qz-phat-am"]')?.click(); } catch (e) {}
    };
    if (!opts.moTab && slideEngine.activeTab !== 'quiz') return;
    if (opts.moTab && slideEngine.activeTab !== 'quiz') slideEngine.setTab('quiz');
    if (coSan || opts.moTab) ketBaiCuonTimer = setTimeout(nhay, KET_BAI_TRE_CUON); else nhay();
  }

  /** Nut tren the ket bai (motion.js goi qua init.khiKetBai): chi khi the ket bai dang hien (da hen xong bai) */
  function ketBaiNgay(dich) {
    if (lectureState !== 'PLAYING' || !autoStepTransitionTimer || !ketBaiDangHen) return false;
    finishLecture({ dich: dich === 'xem-lai' ? 'xem-lai' : 'phat-am', moTab: dich === 'phat-am' });
    return true;
  }

  function checkAutoLectureStepComplete() {
    if (lectureState !== 'PLAYING' || !geminiClient.isConnected) return;
    if (isRaisingHand) return;
    if (senseiChenNgang) return;   // dang cham bai / cham phat am, chua ve nhip

    // Nhịp do client tự phát (nghe trọn đoạn hội thoại) tự lo việc chuyển nhịp
    const cur = currentLectureSteps[currentLectureStepIndex];
    if (cur && cur.clientOnly) return;
    // Dang cho hoc vien chon dap an: tiepSauCho lo viec sang nhip
    if (choHocVien) return;

    // Sensei còn đang sinh lời hoặc loa còn gói âm thanh -> chưa xong nhịp này
    if (geminiClient.isTurnActive()) return;
    if (audioEngine.isPlaybackActive()) return;

    // Một nhịp chỉ có một mục nên rất ngắn. Nếu Sensei mới nói chưa tới 2.5 giây
    // thì nhiều khả năng lượt nói bị đứt, nhắc nói tiếp ĐÚNG MỘT LẦN.
    const durationSec = (Date.now() - currentStepStartTime) / 1000;
    if (durationSec < 2.5 && currentStepRetryCount < 1) {
      currentStepRetryCount++;
      geminiClient.sendUserMessage('Sensei ơi, em chưa nghe rõ. Thầy/cô nói tiếp phần còn dở của mục này giúp em nhé!');
      return;
    }

    // San khau: cau bai tap chua lam -> Sensei doc de xong thi CHO hoc vien chon (luoi mo khoa dung the do)
    if (SK() && cur && cur.kind === 'quiz' && !daTraLoiQuiz(cur)) {
      vaoChoHocVien(cur);
      return;
    }

    // Het bai: scheduleAutoNextStep tu lo (co san khau thi hien the ket bai truoc khi dung)
    scheduleAutoNextStep();
  }

  /* ----------------------------------------------------------------------
     CHO HOC VIEN TRA LOI (chi khi co san khau giang)

     Nhip bai tap: Sensei doc de xong thi bai giang KHONG tu sang cau sau ma
     mo khoa dung the cau hoi tren luoi cho hoc vien bam. Chon xong: dung ->
     doi doc nhan xet roi sang; sai -> Sensei cham bai (giu PLAYING, khong tam
     dung), cham xong doi 2.5 s roi sang. "Bỏ qua" / "Tiếp tục ▸" sang ngay.
     ---------------------------------------------------------------------- */
  function daTraLoiQuiz(b) {
    return !!(b && b.data && b.data.id &&
      document.querySelector(`[id^="btn-opt-${CSS.escape(b.data.id)}-"].opt-locked`));
  }

  function vaoChoHocVien(b) {
    choHocVien = { ma: maNhip, exId: b.data.id, since: Date.now(), daTraLoi: false, soChu: 0, hen: null };
    const card = document.getElementById('card-' + b.data.id);
    // Cuon the vao giua NGAY (khong muot), luc the con nam tren luoi: san khau dua chinh the nay len
    // (portal, motion-spec bo sung C); tam dung / het cho the ve cho cu thi da nam giua vung nhin
    if (card) try { cuonTrongBaiTap(card, card, true, true); } catch (e) {}
    SK()?.vaoCho(b);
  }

  /** Hen sang nhip sau khi da cham. msCoDinh: sau loi cham bai cua Sensei (ketThucChenNgang). */
  function henTiepSauTraLoi(msCoDinh) {
    if (!choHocVien || !choHocVien.daTraLoi) return;
    clearTimeout(choHocVien.hen);
    // Sensei dang cham bai thanh tieng -> doi cham xong (ketThucChenNgang goi lai)
    if (senseiChenNgang) { SK()?.datDemTiep(null); return; }
    const ms = msCoDinh || Math.max(2500, Math.min(8000, 40 * (choHocVien.soChu || 0)));
    SK()?.datDemTiep(ms);
    choHocVien.hen = setTimeout(tiepSauCho, ms);
  }

  /** Het cho: "Tiếp tục ▸" / "Bỏ qua" / hen sau khi cham -> sang nhip ke */
  function tiepSauCho() {
    if (!choHocVien) return;
    clearTimeout(choHocVien.hen);
    choHocVien = null;
    SK()?.raCho();
    if (lectureState === 'PLAYING') scheduleAutoNextStep();
  }

  /** So muc cua bai (the ket bai): tu / chu Han / mau cau / vi du / cau thoai / cau hoi */
  function demTongKet() {
    const dem = (kind) => currentLectureSteps.filter(b => b.kind === kind).length;
    return { tu: dem('vocab'), chu: dem('kanji'), mau: dem('grammar-intro'), cau: dem('example'),
             thoai: dem('kaiwa'), bt: dem('quiz') };
  }

  /**
   * Tieng Sensei bi dung TAY (bam loa doc tu, chon dap an, loa cham bai...) khi
   * turnComplete cua nhip da ve: audio-engine khong bao "doc xong tu nhien" nua
   * nen khong ai goi checkAutoLectureStepComplete -> bai giang treo o PLAYING.
   * Doi giong trinh duyet / loa doc xong (hoi 300ms, toi da 15s) roi xet lai
   * nhip — chi khi van dung nhip do, chua co luot moi va chua hen sang nhip.
   */
  // Da gui luot cho Sensei ma chua co turnComplete THAT cua luot do. Khac
  // isTurnActive(): interrupted cua luot cu cung ha isTurnActive ve false trong
  // khi loi cua luot vua gui chua ve (resume / huy cau hoi / bam sang nhip).
  function dangChoSensei() {
    if (typeof geminiClient.dangChoTraLoi === 'function') return !!geminiClient.dangChoTraLoi();
    return !!geminiClient._choTraLoi;
  }

  function xetLaiSauDungTay() {
    // Nhip chua gui loi cho Sensei (vd nhip Hoi thoai dang phat giong nhan vat),
    // Sensei con dang noi, hoac loi cua luot vua gui chua ve: duong tu nhien lo
    if (lectureState !== 'PLAYING' || maNhipDaGui !== maNhip
        || geminiClient.isTurnActive() || dangChoSensei()) return;
    const ma = maNhip;
    const batDau = Date.now();
    clearTimeout(xetLaiSauDungTayTimer);
    const xet = () => {
      xetLaiSauDungTayTimer = null;
      if (lectureState !== 'PLAYING' || maNhip !== ma) return;
      if (geminiClient.isTurnActive() || dangChoSensei() || autoStepTransitionTimer) return;
      const ss = window.speechSynthesis;
      const conTieng = (ss && (ss.speaking || ss.pending)) || audioEngine.isPlaybackActive();
      if (conTieng && Date.now() - batDau < 15000) {
        xetLaiSauDungTayTimer = setTimeout(xet, 300);
        return;
      }
      checkAutoLectureStepComplete();
    };
    xetLaiSauDungTayTimer = setTimeout(xet, 300);
  }

  function scheduleAutoNextStep() {
    cancelStepTransition();

    const nextIdx = currentLectureStepIndex + 1;
    if (nextIdx >= currentLectureSteps.length) {
      const sk = SK();
      if (sk) {
        // Het bai: san khau hien the ket bai (so muc + bai tap dung/sai) KET_BAI_MS roi moi dung
        // (nut tren the -> ketBaiNgay xong som)
        sk.khiHetNhip({ tiep: null, gapMs: KET_BAI_MS, tongKet: demTongKet() });
        ketBaiDangHen = true;
        autoStepTransitionTimer = setTimeout(() => {
          autoStepTransitionTimer = null;
          ketBaiDangHen = false;
          if (lectureState === 'PLAYING') finishLecture();
        }, KET_BAI_MS);
        return;
      }
      finishLecture();
      return;
    }

    const next = currentLectureSteps[nextIdx];

    // KHONG hien nut "Tiếp theo" trong khoang nghi nay: no chi hien 0.7-1.6s
    // (bam khong kip), lai lam nut Tam dung nhay qua lai / xuong dong moi nhip.
    // Nhịp nhỏ nên đệm ngắn; sang chương mới thì nghỉ lâu hơn một chút
    const gap = next.isChapterStart ? 1600 : 700;
    // San khau: giu khung cuoi cua nhip trong khoang nghi; sang chuong moi thi hien the chuong
    SK()?.khiHetNhip({
      tiep: next,
      gapMs: gap,
      cacNhipChuongTiep: next.isChapterStart ? currentLectureSteps.filter(b => b.chapter === next.chapter) : null,
    });
    autoStepTransitionTimer = setTimeout(() => {
      cancelStepTransition();
      if (lectureState === 'PLAYING') executeLectureStep(nextIdx);
    }, gap);
  }

  /** Nhịp đầu tiên của chương đang mở trên màn hình */
  function firstBeatOfCurrentView() {
    const tab = slideEngine.activeTab;
    const slideIdx = slideEngine.currentSlideIndex || 0;

    if (tab === 'grammar') {
      const i = currentLectureSteps.findIndex(b => b.chapter === 'grammar' && b.subIndex === slideIdx);
      if (i !== -1) return i;
    }
    const i = currentLectureSteps.findIndex(b => b.chapter === tab);
    return i === -1 ? 0 : i;
  }

  async function startLecture(forceStepIndex = null) {
    if (audioEngine) audioEngine.ensureOutContext();

    const lvl = slideEngine.currentLevel;
    const lessonNum = slideEngine.currentLesson;

    // Bai co the vua duoc chon qua dropdown/lenh thoai va chua kip tai xong
    // chi tiet (chi la muc luc nhe) — cho tai xong roi moi dung buildLecturePlan.
    // Che do san khau (js/che-do/che-do.js, lua chon cua nguoi hoc cho moi bai): nap truoc nhip dau, toi da ~2,5 s
    await Promise.all([
      curriculumLoader.ensureLessonLoaded(lvl, lessonNum),
      window.SenseiCheDo ? window.SenseiCheDo.apDung() : null,
    ]);
    if (slideEngine.currentLevel !== lvl || slideEngine.currentLesson !== lessonNum) return;

    currentLectureSteps = buildLecturePlan(lvl, lessonNum);

    if (!currentLectureSteps.length) {
      showToast('Không tìm thấy giáo án của bài này.', 'info');
      return;
    }

    const startIdx = (forceStepIndex !== null && forceStepIndex >= 0 && forceStepIndex < currentLectureSteps.length)
      ? forceStepIndex
      : firstBeatOfCurrentView();

    lectureState = 'PLAYING';
    updateLectureControlsUI();

    const b = currentLectureSteps[startIdx];
    // Co san khau: dong dau ngay tren the da ghi "chuong · dem" — toast nua chi che dong do, noi lai lan hai
    if (!SK()) showToast(`Bắt đầu giảng từ: ${tenChuong(b.chapter)} — ${b.label}`);
    else donToast();   // "Đã tạm dừng tại…" con 4,2 s thi de len dong dau san khau
    batDauMoi = true;   // san khau: nhip dau -> the muc bay tu luoi len san khau
    executeLectureStep(startIdx);
  }

  function pauseLecture(isManual = true) {
    // Chan cong TRUOC khi don hang doi: Gemini con dang stream, khong chan thi
    // goi moi toi lai duoc phat va Sensei cu the noi tiep du da bam tam dung.
    if (audioEngine) {
      audioEngine.setSuppressed(true);
      audioEngine.stopPlayback();
    }
    // Giu den roi o dung muc dang dở de hoc vien biet dang dung o dau
    if (window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    cancelStepTransition();

    const currentStep = currentLectureSteps[currentLectureStepIndex] || {};
    lectureCheckpoint = {
      stepIndex: Math.max(0, currentLectureStepIndex),
      sectionName: currentStep.tab || slideEngine.activeTab,
      subIndex: currentStep.subIndex !== undefined ? currentStep.subIndex : slideEngine.currentSlideIndex,
      level: slideEngine.currentLevel,
      lessonNum: slideEngine.currentLesson
    };

    // Dung han cho hoc vien (neu dang cho) + tat san khau: luoi hien lai, tinh, bam duoc ngay
    if (choHocVien) { clearTimeout(choHocVien.hen); choHocVien = null; }
    // Chinh cu bam lam dung bai (doi tab, → , doi bai...) ve lai luoi ngay sau: ve TINH, khong cardIn
    // so le (§1.10.2 "no entrance animation", T3). slide-engine _lopNoiDung() doc lop nay.
    if (SK() && lectureState === 'PLAYING') {
      document.body.classList.add('vua-dung-giang');
      clearTimeout(vuaDungGiangTimer);
      vuaDungGiangTimer = setTimeout(() => { vuaDungGiangTimer = null; document.body.classList.remove('vua-dung-giang'); }, 1000);
    }
    SK()?.tamDung();

    lectureState = 'PAUSED';
    updateLectureControlsUI();

    if (isManual) {
      showToast(`Đã tạm dừng tại: ${currentStep.label || 'phần hiện tại'}`);
    }
  }

  function resumeLecture() {
    if (audioEngine) {
      audioEngine.ensureOutContext();
    }


    const lvl = slideEngine.currentLevel;
    const lessonNum = slideEngine.currentLesson;

    if (lectureCheckpoint && lectureCheckpoint.level === lvl && lectureCheckpoint.lessonNum === lessonNum) {
      currentLectureSteps = buildLecturePlan(lvl, lessonNum);
      let stepIdx = Math.min(Math.max(0, lectureCheckpoint.stepIndex), currentLectureSteps.length - 1);
      // San khau: cau bai tap hoc vien da tu lam luc tam dung thi khong doc lai de, sang cau sau
      if (SK()) {
        while (stepIdx < currentLectureSteps.length && currentLectureSteps[stepIdx].kind === 'quiz'
               && daTraLoiQuiz(currentLectureSteps[stepIdx])) stepIdx++;
      }
      if (stepIdx >= currentLectureSteps.length) { finishLecture(); return; }
      lectureState = 'PLAYING';
      updateLectureControlsUI();
      if (SK()) { SK().tiepTuc(); donToast(); }   // toast con treo (tam dung...) khong che dong dau san khau
      batDauMoi = true;
      executeLectureStep(stepIdx, true);
    } else {
      startLecture();
    }
  }

  function updateSessionState() {
    // Khong con o hien trang thai tren UI — lop tu vao khi mo trang.
    // Giu ham nay lam mot cho de xem trang thai: window.__phien()
    const live = geminiClient.isConnected && geminiClient.isSetupComplete;
    document.body.dataset.phien = isConnecting ? 'dang-vao' : (live ? 'trong-lop' : 'ngoai-lop');
  }
  window.__phien = () => ({
    trangThai: document.body.dataset.phien,
    daNoi: geminiClient.isConnected,
    daBatTay: geminiClient.isSetupComplete,
    giong: SENSEI_VOICE,
  });

  /**
   * App TU ngat phien (tu lam moi khi treo, tam roi lop de long tieng...).
   * Dung ham nay thay vi goi geminiClient.disconnect() tran, de onClose biet
   * day khong phai mat ket noi bat ngo va khong bao "Mất kết nối" thua.
   * giuNguCanh=true: giu handle noi phien (lan vao lop sau nho hoi thoai cu).
   */
  function ngatPhienChuDong(giuNguCanh = false) {
    tuNgatPhien = true;
    try { geminiClient.disconnect(giuNguCanh); } catch (e) {}
  }

  /**
   * Bảo đảm phiên đã sẵn sàng. Chưa kết nối thì tự kết nối và chờ setupComplete.
   * Không còn nút "Bắt đầu phiên" riêng nữa — bấm giảng bài là vào lớp luôn.
   */
  function ensureConnected() {
    if (geminiClient.isConnected && geminiClient.isSetupComplete) return Promise.resolve();
    if (pendingReady) return pendingReady.promise;

    const key = senseiKey();
    if (!key) {
      // Thieu key thi ca trang khong chay duoc — day la thu duy nhat van phai
      // hien ra man hinh du da bo thong bao loi.
      showToast('Chưa đọc được GEMINI_KEY1 từ .env — mở trang qua server.py rồi tải lại.', 'info', 10000);
      return Promise.reject(new Error('missing-key'));
    }

    if (audioEngine) audioEngine.ensureOutContext();

    isConnecting = true;
    updateSessionState();
    updateLectureControlsUI();

    const model = SENSEI_MODELS.sensei;
    const voice = SENSEI_VOICE;

    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    const timer = setTimeout(() => {
      if (pendingReady) {
        pendingReady = null;
        // Bo han socket dang treo: de nguyen thi no co the toi setupComplete
        // muon (phien ma khong ai cho) hoac dong muon, bao "Mất kết nối" thua.
        // Socket chua mo (ket o mang): setup kem handle chua toi server, handle
        // khong phai thu pham -> giu ngu canh. Da mo, gui setup ma server im ->
        // vao lai tu dau, cung chinh sach "phien treo" cua connect(); giu handle
        // o day thi handle lam treo se treo mai moi lan vao lop.
        ngatPhienChuDong(!geminiClient.isConnected);
        isConnecting = false;
        updateSessionState();
        updateLectureControlsUI();
        reject(new Error('timeout'));
      }
    }, 20000);
    pendingReady = { resolve, reject, timer, promise };

    // Xong (duoc hay hong) deu phai ve lai nut giang: khong thi no ket o
    // "Đang vào lớp…" (disabled) cho toi khi hoc vien tinh co bam tab khac.
    promise.then(() => { isConnecting = false; updateSessionState(); updateLectureControlsUI(); })
           .catch(() => { isConnecting = false; updateSessionState(); updateLectureControlsUI(); });

    try {
      geminiClient.connect(key, model, voice);
    } catch (err) {
      clearTimeout(timer);
      pendingReady = null;
      isConnecting = false;
      updateSessionState();
      updateLectureControlsUI();
      return Promise.reject(err);
    }
    return promise;
  }

  async function handleAutoLectureClick() {
    if (isRaisingHand) return;   // dang thu cau hoi: Gui hoac Huy truoc (nut cung da khoa)
    if (lectureState === 'PLAYING') {
      pauseLecture(true);
      return;
    }
    if (isConnecting) return;

    try {
      await ensureConnected();
    } catch (err) {
      // 'closed' = server dong phien truoc khi vao lop (sai key, mat mang);
      // 'quota' da co bao rieng trong onClose, 'missing-key' trong ensureConnected
      if (err && (err.message === 'timeout' || err.message === 'closed')) {
        showToast('Không vào được lớp — kiểm tra lại API Key và mạng.', 'info', 6000);
      }
      updateLectureControlsUI();
      return;
    }

    if (lectureState === 'PAUSED') resumeLecture();
    else startLecture();
  }

  // Hiện/ẩn bộ nút theo trạng thái đang thu âm câu hỏi
  function updateAskUI() {
    if (raiseHandBtn) raiseHandBtn.classList.toggle('hidden', isRaisingHand);
    if (askSendBtn) askSendBtn.classList.toggle('hidden', !isRaisingHand);
    if (askCancelBtn) askCancelBtn.classList.toggle('hidden', !isRaisingHand);
    if (micVolumeWrapper) micVolumeWrapper.classList.toggle('hidden', !isRaisingHand);
  }

  // Bấm "Gửi câu hỏi": chốt lượt nói để Sensei dừng bài và giải đáp
  function submitQuestion() {
    if (!isRaisingHand) return;
    // Sensei sap tra loi -> phai mo cong, khong thi cau tra loi bi nuot
    if (audioEngine) audioEngine.setSuppressed(false);
    boQuaLuotHuy = false;   // cau hoi moi thay cho luot vua huy (neu co)
    isRaisingHand = false;
    if (audioEngine.isMicActive) audioEngine.stopMic();
    const khongNgheRo = mucAmThanhCaoNhat <= NGUONG_AM_THANH_RO;
    geminiClient.sendAudioStreamEnd();
    updateAskUI();
    updateLectureControlsUI();
    if (khongNgheRo) {
      // Ca luot thu am khong co tieng nao vuot nguong ro — gan chac server
      // se khong nhan dien duoc gio noi (VAD), Sensei se im MAI MAI chu
      // khong phai cham nhu binh thuong. Bao ngay, dung de hoc vien tuong
      // dang xu ly roi cho vo ich.
      showToast('Không nghe rõ giọng nói trong lúc thu âm — kiểm tra quyền micro hoặc thử nói to, gần micro hơn. Có thể gõ câu hỏi bằng chữ thay thế.', 'info', 9000);
    } else {
      showToast('Đã gửi câu hỏi — Sensei đang giải đáp cho bạn…');
      hienThiChoTraLoi();
    }
  }

  // Bấm "Hủy": bỏ câu hỏi, Sensei giảng tiếp từ chỗ đang dở
  function cancelQuestion() {
    if (!isRaisingHand) return;
    isRaisingHand = false;
    if (audioEngine.isMicActive) audioEngine.stopMic();
    // activityEnd van phai gui (khong thi server treo), nhung no CHOT luot nen
    // Sensei van se tra loi cau vua huy -> chan tieng + chu + tool cua luot do
    // (pxNhanLoiPhan mo lai o turnComplete, luot moi mo lai o onBeforeUserMessage).
    // Giang tiep thi thoi: nhip giang gui ngay sau se de len luot do.
    if (!lectureWasPlayingBeforeAsk && geminiClient.isConnected) {
      boQuaLuotHuy = true;
      audioEngine.setSuppressed(true);
    }
    geminiClient.sendAudioStreamEnd();   // dong moc "dang noi" du la huy
    updateAskUI();
    stopAllAudio();

    if (lectureWasPlayingBeforeAsk) {
      lectureWasPlayingBeforeAsk = false;
      // Co san khau: san khau hien lai la du bao — toast se bi resumeLecture don ngay (nhay mot cai)
      if (!SK()) showToast('Đã hủy câu hỏi — Sensei giảng tiếp.');
      resumeLecture();   // executeLectureStep tu mo lai cong am thanh
    } else {
      updateLectureControlsUI();
      showToast('Đã hủy câu hỏi.');
    }
  }

  async function handleRaiseHandClick() {
    try {
      await ensureConnected();
    } catch (err) {
      // Bam nut ma khong co gi xay ra thi hoc vien khong hieu vi sao
      if (err && (err.message === 'timeout' || err.message === 'closed')) {
        showToast('Không vào được lớp — kiểm tra lại API Key và mạng.', 'info', 6000);
      }
      return;
    }
    if (isRaisingHand) return;
    anChoTraLoi(); // hoi cau moi -> bo dai "dang cho" cua cau truoc (neu con)

    // Bắt đầu giơ tay hỏi bài:
    // 1. Dừng âm thanh đang phát ngay lập tức
    if (audioEngine) audioEngine.stopPlayback();
    if (window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    cancelStepTransition();

    // 2. Tạm dừng bài giảng nếu đang chạy để lưu checkpoint
    lectureWasPlayingBeforeAsk = (lectureState === 'PLAYING');
    if (lectureState === 'PLAYING') {
      pauseLecture(false);
    }

    isRaisingHand = true;
    updateAskUI();
    updateLectureControlsUI();

    // 3. Chuẩn bị ngữ cảnh chi tiết bài học đang mở trên màn hình
    const lvl = slideEngine.currentLevel;
    const lessonNum = slideEngine.currentLesson;
    const lesson = curriculumLoader.getLesson(lvl, lessonNum) || {};
    const tab = slideEngine.activeTab;

    let tabDisplayName = "Từ vựng";
    let screenContent = "";

    if (tab === 'vocab') {
      tabDisplayName = "Từ vựng trọng tâm";
      const vocabs = curriculumLoader.getVocabList(lvl, lessonNum);
      screenContent = vocabs.slice(0, 15).map((v, i) => `${i + 1}. ${v.kanji || v.word} (${v.furigana || v.word}): ${v.meaningVi}`).join('\n');
    } else if (tab === 'kanji') {
      const kanjis = curriculumLoader.getKanjiList(lvl, lessonNum);
      if (CAP_DO.laKana(lvl)) {
        // Chu cai kana: khong co Han Viet / On / Kun
        tabDisplayName = "Chữ cái (bảng chữ kana)";
        screenContent = kanjis.length
          ? kanjis.map((k, i) => `${i + 1}. [${k.character}] đọc "${k.romaji || ''}": ${k.meaningVi || ''}${k.sosanh ? ` (Dễ nhầm: ${k.sosanh})` : ''}`).join('\n')
          : 'Bài này không học chữ mới.';
      } else {
        tabDisplayName = "Chữ Hán Kanji";
        screenContent = kanjis.map((k, i) => `${i + 1}. [${k.character}] (${k.hanViet}): ${k.meaningVi} (On: ${(k.onyomi || []).join(', ')} | Kun: ${(k.kunyomi || []).join(', ')})`).join('\n');
      }
    } else if (tab === 'grammar') {
      const slideIdx = slideEngine.currentSlideIndex || 0;
      const slideData = curriculumLoader.getSlide(lvl, lessonNum, slideIdx);
      const slide = slideData?.slide || {};
      tabDisplayName = `Ngữ pháp (Slide ${slideIdx + 1}: ${slide.title || ''})`;
      const exStr = (slide.examples || []).map((ex, i) => {
        const jp = (ex.tokens || []).map(t => t.kanji || t.text).join('');
        return `   - Ví dụ ${i + 1}: ${jp} (${ex.meaningVi})`;
      }).join('\n');
      screenContent = `Điểm ngữ pháp: ${slide.title || ''}\nCông thức: ${slide.grammarFormula || ''}\nGiải thích: ${slide.explanation || ''}\nVí dụ:\n${exStr}`;
    } else if (tab === 'kaiwa') {
      tabDisplayName = "Hội thoại thực tế (Kaiwa)";
      const dialogue = curriculumLoader.getDialogue(lvl, lessonNum);
      screenContent = dialogue.map((d, i) => `${i + 1}. [${d.speaker}]: ${(d.tokens || []).map(t => t.text).join('')} (${d.meaningVi})`).join('\n');
    } else if (tab === 'quiz') {
      tabDisplayName = "Bài tập trắc nghiệm (Quiz)";
      const exercises = curriculumLoader.getExercises(lvl, lessonNum);
      screenContent = exercises.map((e, i) => `Câu ${i + 1}: ${e.question} (Đáp án: ${e.options ? e.options[e.correctIndex] : ''})`).join('\n');
    } else if (tab === 'reflex') {
      tabDisplayName = `Phản xạ nhanh (${phanXa.che === 'noi' ? 'Nói nhanh' : 'Viết nhanh'})`;
      const c = phanXa.dangChay ? pxCauHienTai() : null;
      screenContent = c
        ? `Câu ${phanXa.viTri + 1}/${phanXa.dsCau.length}: ${c.kieu === 'khuyet' ? c.cauHoi : 'Từ có nghĩa "' + c.nghia + '"'} (Đáp án: ${c.dapAn}${c.kana ? ', đọc ' + c.kana : ''})`
        : 'Chưa bắt đầu vòng luyện.';
      // Dang chay vong thi dung han: dem nguoc 7s ma con chay se tu nop, tat
      // mat mic cua cau hoi va lay loi giai dap lam loi phan cau phan xa.
      if (phanXa.dangChay || phanXa.demTimer) {
        dungPhanXaKhiRoiTab();
        if (window.veManPhanXa) window.veManPhanXa();
      }
    }

    const contextPrompt = `[HỌC SINH GIƠ TAY CÓ Ý KIẾN / ĐẶT CÂU HỎI TRONG LỚP]
Sensei ơi! Em vừa bấm nút 'Giơ tay có ý kiến' ✋ để hỏi thầy/cô về bài học.
Toàn bộ bài giảng đã được tạm dừng.
DƯỚI ĐÂY LÀ NỘI DUNG MÀN HÌNH BÀI HỌC EM ĐANG NHÌN THẤY:
- Cấp độ & Bài: ${CAP_DO.ten(lvl)} - Bài ${lessonNum}: ${lesson.title || ''}
- Phân môn đang mở: ${tabDisplayName}
- Dữ liệu chi tiết đang hiển thị trên màn hình:
${screenContent}

CHỈ DẪN QUAN TRỌNG DÀNH CHO SENSEI:
0. Chỉ trả lời chuyện liên quan tới tiếng Nhật và bài đang học. Hỏi mày là model gì / AI của hãng nào / chuyện nhạy cảm / nhờ làm việc ngoài môn — gạt một câu rồi kéo về bài, đúng như luật đã dặn.
1. Học sinh đang bật Micro để nói câu hỏi trực tiếp (hoặc gõ trong ô chat).
2. Hãy lắng nghe thật kỹ câu hỏi của học sinh và giải đáp thật nhiệt tình, cặn kẽ, chính xác dựa trên đúng kiến thức đang hiển thị ở trên.
2b. DÙNG BẢNG MÀ TRẢ LỜI. Giải thích suông bằng lời thì học viên nghe xong quên ngay:
   - So sánh hai thứ dễ nhầm (は với が, に với で...) -> write_on_board từng dòng cho nó nhìn thấy hai bên cạnh nhau.
   - Hỏi về cách viết / mặt chữ Hán -> write_kanji("<chữ đó>") rồi vừa chỉ vừa giảng.
   - Hỏi "chỗ này là gì" về một mục đang trên màn hình -> draw_on_board(<id mục đó>, "khoanh") rồi mới nói.
   - Học viên nói sai một câu -> draw_on_board(<id>, "gach_xoa") rồi write_on_board câu đúng.
   Đừng ghi cả bài giảng lên bảng — chỉ ghi thứ đáng nhìn.
3. Nếu học sinh muốn xem lại mục nào (Từ vựng, Chữ Hán, Ngữ pháp, Hội thoại, Bài tập): Hãy nói rõ bằng lời: "Thầy/cô sẽ mở lại phần [Từ vựng / Chữ Hán / Ngữ pháp / Hội thoại] cho em nhé" HOẶC gọi tool change_section để màn hình tự động chuyển tới phân môn đó!
4. Cuối câu trả lời, hãy dặn: "Em đã hiểu rõ chưa? Khi nào hiểu rồi thì bấm 'Tiếp tục bài giảng' để thầy/cô giảng tiếp bài nhé!".`;

    // 4. Nạp ngữ cảnh màn hình nhưng KHÔNG kết thúc lượt nói,
    // để Sensei im lặng chờ học viên hỏi xong rồi mới giải đáp.
    geminiClient.sendContextNote(contextPrompt);

    // 5. Mở Micro
    mucAmThanhCaoNhat = 0;
    const luot = ++luotGioTay;
    const micDaMoSan = audioEngine.isMicActive;
    try {
      const moDuoc = await audioEngine.startMic();
      // Trong luc cho mo mic (hop xin quyen dang mo...), hoc vien co the da
      // bam Gui/Huy, go chat, hoac mat ket noi: khong mo luot "dang noi" nao
      // nua — khong thi mic cu thu va activityStart treo ma khong con nut tat.
      // Lan gio tay moi hon da thay cho lan nay thi de lan do tu lo.
      if (luot !== luotGioTay) return;
      if (!isRaisingHand) {
        if (!micDaMoSan && !dangThuAm && audioEngine.isMicActive) audioEngine.stopMic();
        updateMicUI(true, false);
        return;
      }
      // Lan mo mic bi stopMic() cho khac huy giua chung: khong co mic thi
      // activityStart treo — tra nut Gio tay ve nhu cu (bai giang van tam dung)
      if (!moDuoc) {
        isRaisingHand = false;
        lectureWasPlayingBeforeAsk = false;
        updateAskUI();
        updateLectureControlsUI();
        updateMicUI(true, false);
        return;
      }
      geminiClient.sendActivityStart();   // thieu cai nay thi server bo qua het tieng gui len
      updateMicUI(true, true);
      addLog("System", "✋ Bạn đã giơ tay hỏi bài! Bài giảng đã tạm dừng. Mic đã bật — nói câu hỏi xong hãy bấm lại nút để gửi cho Sensei!");
    } catch (err) {
      if (luot !== luotGioTay) return;
      isRaisingHand = false;
      updateAskUI();
      updateLectureControlsUI();
      // Day la loi HANH DONG cua chinh hoc vien vua bam (khong mo duoc mic) —
      // phai cho thay, khac voi loi ky thuat noi bo. addLog("Error",...) se
      // di qua showToast(kind='error') va bi an mat, hoc vien bam nut xong
      // khong hieu vi sao khong co gi xay ra.
      showToast('Không mở được micro: ' + (err.message || 'không rõ lý do') + '. Thử tải lại trang.', 'info', 7000);
    }
  }

  function handleManualTabChange(section, subIndex = null) {
    if (dangThuAm) huyThuAm();   // dang thu am ma doi tab -> tat mic di
    huyMoMicPA();                // ...hoac con dang cho quyen mic
    // Net ve bam theo phan tu cu — sang chuong khac la chung tro nen vo nghia
    if (window.SenseiBoard) SenseiBoard.xoaHetGhiChu();
    if (lectureState === 'PLAYING') {
      pauseLecture(false);
    }
    stopAllAudio();
    cancelStepTransition();
    slideEngine.setTab(section, subIndex);

    // Cập nhật checkpoint theo tab người dùng chọn thủ công
    lectureCheckpoint.sectionName = section;
    lectureCheckpoint.subIndex = subIndex;
    if (currentLectureSteps && currentLectureSteps.length) {
      // Tim nhip dau tien cua chuong vua chon (Ngu phap thi theo slide dang mo)
      let idx = -1;
      if (section === 'grammar') {
        idx = currentLectureSteps.findIndex(b => b.chapter === 'grammar' && b.subIndex === (subIndex || 0));
      }
      if (idx === -1) idx = currentLectureSteps.findIndex(b => b.chapter === section);
      // Bam lai dung chuong (va dung slide) dang dở thi giu nguyen cho dung —
      // khong phai doi chuong, "Giảng tiếp" van phai hoc tiep tu do.
      const dangDo = currentLectureSteps[lectureCheckpoint.stepIndex];
      const cungCho = dangDo && dangDo.chapter === section
        && (section !== 'grammar' || dangDo.subIndex === (subIndex || 0));
      if (idx !== -1 && !cungCho) {
        // Nguoi hoc chu dong doi chuong -> khong "hoc tiep" o cho cu nua,
        // ma bat dau lai tu DAU chuong vua chon.
        lectureCheckpoint.stepIndex = idx;
        lectureCheckpoint.sectionName = section;
        lectureCheckpoint.subIndex = subIndex;
        lectureCheckpoint.nhipDangDo = undefined;   // bo nhip nho khi lat slide (dongBoCheckpointTheoSlide)
        currentLectureStepIndex = idx;
      }
    }
    updateLectureControlsUI();
  }

  if (autoLectureBtn) {
    autoLectureBtn.addEventListener('click', handleAutoLectureClick);
  }
  if (raiseHandBtn) raiseHandBtn.addEventListener('click', handleRaiseHandClick);
  if (askSendBtn) askSendBtn.addEventListener('click', submitQuestion);
  if (askCancelBtn) askCancelBtn.addEventListener('click', cancelQuestion);

  // 7. AI Quiz Feedback Engine (Quota dồi dào qua Gemini 2.0 Flash REST API)
  let streakWrongCount = 0;
  let streakCorrectCount = 0;
  // Luc vua cham sai mot cau trac nghiem (mark_error ngay sau do khong mo bang sua loi de len the)
  let lucChamSai = 0;

  // Global phát âm câu nhận xét dí dỏm bằng tiếng Việt
  /* ----------------------------------------------------------------------
     SENSEI NOI NGOAI BAI GIANG

     Dung cho nhung luc Sensei phai len tieng ma khong phai dang giang: cham
     mot cau tra loi sai, cham mot lan doc phat am. Phien Live van la phien
     cu (giong quen, ngu canh bai hoc con nguyen), chi khac la nhip giang
     phai biet ma bo qua luot noi nay.
     ---------------------------------------------------------------------- */
  function ketThucChenNgang() {
    senseiChenNgang = false;
    clearTimeout(chenNgangTimer);
    // Loi cham cau vua lam (luc dang cho hoc vien) da xong -> cau sau BAT DAU 2.5 s sau luc het tieng
    // (motion-spec T2): het tieng -> 350 ms debounce loa (onPlayStateChange) -> 1450 ms -> tiepSauCho
    // -> 700 ms khoang nghi giua nhip. The vua lam van hien trong ca 2.5 s do (raCho giu body.sk-cho).
    if (choHocVien && choHocVien.daTraLoi) henTiepSauTraLoi(2500 - 350 - 700);
  }

  /**
   * @param {string} loiNhac  Lenh gui cho Sensei
   * @param {number} hanGiay  Sau chung nay giay ma Sensei van chua noi gi thi
   *                          tu go co, de bai giang khong bi ket cung.
   * @param {object} opts     giuGiang: cham cau dang CHO tren san khau -> khong tam dung,
   *                          cham xong ketThucChenNgang tu hen sang cau sau
   */
  function senseiNoiNgoaiBai(loiNhac, hanGiay = 30, opts = {}) {
    if (!loiNhac) return false;
    if (!geminiClient.isConnected || !geminiClient.isSetupComplete) return false;

    // Dang giang thi tam dung han (nhu luc cham phat am): loi cham bai de len
    // nhip dang giang, xong loi cham thi khong ai chay lai nhip do nua -> bai
    // giang dung im o "Tạm dừng". Tam dung thi "Giảng tiếp" hoc lai dung nhip.
    if (lectureState === 'PLAYING' && !opts.giuGiang) pauseLecture(false);

    senseiChenNgang = true;
    clearTimeout(chenNgangTimer);
    chenNgangTimer = setTimeout(ketThucChenNgang, hanGiay * 1000);

    audioEngine.setSuppressed(false);   // dang tam dung thi van phai nghe duoc loi cham bai
    geminiClient.sendUserMessage(loiNhac);
    return true;
  }

  window.playSpeechRoast = function(text) {
    if (!window.speechSynthesis || !text) return;
    // Dừng ngay lập tức bất kỳ âm thanh nào đang phát từ Gemini Live để tránh 2 giọng nói đè lên nhau
    if (audioEngine) audioEngine.stopPlayback();
    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'vi-VN';
      utter.rate = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find(v => v.lang && (v.lang.startsWith('vi') || v.lang === 'vi_VN'));
      if (viVoice) utter.voice = viVoice;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn("Speech roast error:", e);
    }
  };

  // Lam dung = luc duy nhat Sensei ha giong, doi sang "to/cau"
  const fallbackPraises = [
    "Ừ, chuẩn. Cậu nhớ nhanh phết đấy, tớ khen thật.",
    "Đúng rồi. Câu này bẫy khối đứa mà cậu khoanh cái một, được.",
    "Ngon. Tớ bắt đầu thấy cậu có tương lai ở cái tiếng Nhật này.",
    "Chính xác. Giữ cái đà này thì N1 không xa đâu cậu.",
    "Đúng luôn. Tập trung vào là khác hẳn ngay, thấy chưa.",
    "Được đấy. Tớ công nhận, câu này không dễ ăn.",
    "Chuẩn không cần chỉnh. Nay não cậu chạy tốt phết.",
    "Ừ đúng. Thôi tao khen một câu thế thôi, câu sau nhé mày."
  ];

  const fallbackMildRoasts = [
    "Dễ vãi mà cũng sai. Mày có nhìn màn hình không đấy?",
    "Tao vừa giảng xong đấy. Vừa xong. Mày trả chữ cho tao nhanh thế?",
    "Khoanh bừa đúng không? Mặt mày đang viết chữ 'bừa' kìa.",
    "Sai. Đọc lại cái cấu trúc đi, nó nằm chình ình ra đấy.",
    "Học kiểu này sang Tokyo mua bánh mì cũng gọi nhầm thành 'tôi là sinh viên' cho xem.",
    "Ơ hay. Mắt để ngắm crush hay để đọc đề vậy mày?",
    "Sai rồi. Bình tĩnh, đọc lại lần nữa, đừng bấm như đang cày game."
  ];

  const fallbackSevereRoasts = [
    "Đm ba câu sai cả ba. Mày đang học hay đang bấm cho vui vậy?",
    "Ngu vãi. Tao nói lại lần nữa thôi đấy, lần này nghe cho kỹ vào.",
    "Não mày để ở nhà quên lắp vào à? Chép phạt cái cấu trúc này mười lần đi.",
    "Vl thật. Tao mà ngồi cạnh là gõ đầu mày rồi. Ngồi im tao giảng lại.",
    "Học kiểu này thì JLPT của mày đổi tên thành N-Nợ nhé. Tỉnh lại đi.",
    "Tao giảng đến hòn đất cũng hiểu mà mày vẫn sai. Đứng dậy rửa mặt rồi vào làm lại.",
    "Ba gậy liên tiếp. Nghỉ năm giây, hít thở, rồi tao dạy lại từ đầu."
  ];

  async function generateQuizRoast(question, chosenText, correctText, isCorrect, streakWrong, explanation) {
    const key = helperKey();

    if (!key) {
      if (isCorrect) {
        const roast = fallbackPraises[Math.floor(Math.random() * fallbackPraises.length)];
        return { roast, tip: explanation || "Nắm chắc cấu trúc ngữ pháp này nhé!" };
      } else if (streakWrong >= 3) {
        const roast = fallbackSevereRoasts[Math.floor(Math.random() * fallbackSevereRoasts.length)];
        return { roast, tip: explanation || "Xem lại cấu trúc trên slide ngay!" };
      } else {
        const roast = fallbackMildRoasts[Math.floor(Math.random() * fallbackMildRoasts.length)];
        return { roast, tip: explanation || "Chú ý kỹ trợ từ và ngữ cảnh nhé!" };
      }
    }

    try {
      const prompt = `Mày là Sensei — thầy dạy tiếng Nhật kiểu GenZ bố láo, xưng "tao" gọi học viên là "mày", tự coi mình bề trên đang dạy một đứa chưa biết gì. Mồm độc, chửi tục được, nhưng là chửi yêu kiểu ông anh mắng thằng em.
Học sinh vừa làm câu trắc nghiệm:
- Câu hỏi: "${question}"
- Học sinh chọn: "${chosenText}"
- Kết quả: ${isCorrect ? "CHÍNH XÁC" : "SAI"} (Đáp án đúng là: "${correctText}")
- Số câu sai liên tiếp hiện tại: ${streakWrong}
- Lời giải thích: "${explanation}"

YÊU CẦU:
Viết một câu nhận xét tiếng Việt thật đời, thật mặn, đúng chất mày:
${isCorrect
  ? "- Nó LÀM ĐÚNG: đây là lúc duy nhất mày hạ giọng. Đổi sang xưng \"tớ\" gọi \"cậu\", khen thật lòng một câu ngắn, ấm (dưới 25 từ). Khen xong thôi, đừng nịnh."
  : streakWrong >= 3
    ? `- Nó SAI LIÊN TIẾP ${streakWrong} CÂU: bốc hỏa. Chửi thẳng, được dùng tiếng tục (đm, vl, ngu vãi...), giọng ông anh sắp tăng xông (dưới 35 từ). Chửi chứ không hạ nhục — không đụng gia đình, ngoại hình, hoàn cảnh.`
    : "- Nó LÀM SAI: cà khịa kiểu kẻ cả, khinh khỉnh, trống không (dưới 25 từ). Kiểu \"dễ vãi mà cũng sai\"."}

Kèm 1 câu giải thích ngắn gọn, dễ hiểu — phần này nói tử tế, đừng đùa nữa.
Trả về JSON duy nhất:
{"items": [{"roast": "câu nhận xét hài hước", "tip": "câu giải thích ngắn gọn"}]}`;

      // REST: model Live khong sinh duoc chu (ma 1007). Hong thi dung cau soan san.
      // callTextModel chi nhan MANG (layMang) — mot object tran {roast, tip} bi
      // coi la hong nen truoc day luon roi ve cau soan san. Xin boc trong "items".
      const out = await callTextModel(key, SENSEI_MODELS.roast, prompt, 400);
      const kq = out.ok && out.items && out.items[0];
      if (kq && kq.roast && kq.tip) return kq;
    } catch (err) {
      console.warn("Không sinh được câu nhận xét, dùng câu soạn sẵn:", err);
    }

    // Fallback nếu gọi REST API gặp lỗi
    if (isCorrect) {
      const roast = fallbackPraises[Math.floor(Math.random() * fallbackPraises.length)];
      return { roast, tip: explanation || "Nắm chắc cấu trúc ngữ pháp này nhé!" };
    } else if (streakWrong >= 3) {
      const roast = fallbackSevereRoasts[Math.floor(Math.random() * fallbackSevereRoasts.length)];
      return { roast, tip: explanation || "Xem lại cấu trúc trên slide ngay!" };
    } else {
      const roast = fallbackMildRoasts[Math.floor(Math.random() * fallbackMildRoasts.length)];
      return { roast, tip: explanation || "Chú ý kỹ trợ từ và ngữ cảnh nhé!" };
    }
  }

  /**
   * Chon dap an tu trong spotlight.
   * Van chay qua handleSelectOption de the bai tap phia sau cung duoc cham,
   * roi to mau ket qua ngay tren spotlight cho hoc vien thay lien.
   */
  window.answerFromSpotlight = (exId, chosen, correct) => {
    const ex = (curriculumLoader.getExercises(slideEngine.currentLevel, slideEngine.currentLesson) || [])
      .find(q => q.id === exId);
    slideEngine.markSpotlightAnswer(exId, chosen, correct, ex && ex.explanation);
    if (window.handleSelectOption) window.handleSelectOption(exId, chosen, correct);
  };

  // Cuon DUNG vung .qz-list de hien `el` (khong scrollIntoView: no xo lech .deck-canvas overflow:hidden va
  // day dau the cau hoi lot xuong duoi thanh nhay dinh .qz-jump). giua = dua the vao giua cho con lai.
  // Dau the (card) luon nam duoi thanh nhay.
  // tucThi: cuon ngay (behavior 'auto') — san khau do vi tri the ngay sau lenh cuon (vaoChoHocVien)
  function cuonTrongBaiTap(el, card, giua = false, tucThi = false) {
    const giam = tucThi || matchMedia('(prefers-reduced-motion: reduce)').matches;
    // The dang duoc dua len san khau (cho hoc vien chon, motion-spec bo sung C): KHONG scrollIntoView —
    // no cuon .deck-stage (overflow:hidden) lech ca man. Chi cuon trong khung cuon cua san khau (neu co).
    const sk = el && el.closest && el.closest('#sanKhauGiang');
    if (sk) {
      let p = el.parentElement;
      while (p && p !== sk) {
        const oy = getComputedStyle(p).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight + 1) break;
        p = p.parentElement;
      }
      if (p && p !== sk) {
        const rp = p.getBoundingClientRect(), re = el.getBoundingClientRect();
        // Khung nhan xet con display:none (canh C cho hien sau): hop 0 -> tinh ra cuon nguoc len dinh. Bo qua
        if (!re.width && !re.height) return;
        let them = re.bottom > rp.bottom - 8 ? Math.min(re.bottom - rp.bottom + 8, re.top - rp.top - 8)
          : (re.top < rp.top ? re.top - rp.top - 8 : 0);
        // Dien thoai: khung nhan xet cao hon cho con lai -> cuon toi no day mat dap an dung ra khoi khung.
        // Giu dap an dung (is-answer / is-correct) trong khung; phan nhan xet con lai hoc vien tu cuon.
        const dung = card && card.querySelector && card.querySelector('.qz-opt.is-answer, .qz-opt.is-correct');
        if (dung && them > 0) them = Math.min(them, Math.max(0, dung.getBoundingClientRect().top - rp.top - 8));
        if (Math.abs(them) >= 1) p.scrollBy({ top: them, behavior: giam ? 'auto' : 'smooth' });
      }
      return;
    }
    const vung = el && el.closest('.qz-list');
    if (!vung) {
      try { if (el) el.scrollIntoView({ behavior: giam ? 'auto' : 'smooth', block: giua ? 'center' : 'nearest' }); } catch (e) {}
      return;
    }
    const thanh = vung.querySelector('.qz-jump');
    const rv = vung.getBoundingClientRect();
    const tren = rv.top + (thanh && getComputedStyle(thanh).position === 'sticky' ? thanh.offsetHeight : 0) + 6;
    const duoi = rv.bottom - 8;
    const re = el.getBoundingClientRect(), rt = (card || el).getBoundingClientRect();
    let them = giua ? (rt.top + rt.bottom) / 2 - (tren + duoi) / 2
      : (re.bottom > duoi ? re.bottom - duoi : (re.top < tren ? re.top - tren : 0));
    them = Math.min(them, rt.top - tren);
    if (Math.abs(them) >= 1) vung.scrollBy({ top: them, behavior: giam ? 'auto' : 'smooth' });
  }

  // Xử lý trả lời câu hỏi trắc nghiệm tương tác
  window.handleSelectOption = async (exerciseId, chosenIdx, correctIdx) => {
    const isCorrect = chosenIdx === correctIdx;
    const btn = document.getElementById(`btn-opt-${exerciseId}-${chosenIdx}`);
    const icon = document.getElementById(`icon-opt-${exerciseId}-${chosenIdx}`);
    const explainBox = document.getElementById(`explain-${exerciseId}`);

    const card = document.getElementById(`card-${exerciseId}`);

    // Dừng âm thanh đang phát trước đó nếu có để giao diện yên tĩnh cho học viên xem đáp án
    if (audioEngine) audioEngine.stopPlayback();
    if (window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }

    // Tự động cuộn và focus đưa câu hỏi đang làm vào trung tâm màn hình
    if (card) cuonTrongBaiTap(card, card, true);

    // Vô hiệu hóa các nút của câu này sau khi chọn
    document.querySelectorAll(`[id^="btn-opt-${exerciseId}-"]`).forEach(b => {
      b.disabled = true;
      b.classList.add('opt-locked');
    });

    if (isCorrect) {
      streakWrongCount = 0;
      streakCorrectCount++;
      if (card) {
        card.classList.remove('hl-card-warning', 'border-slate-800');
        card.classList.add('hl-card-grammar');
      }
      // Mau dung / sai nam o css/lesson.css (.qz-opt.is-correct / .is-wrong / .is-answer)
      if (btn) btn.classList.add('is-correct');
      if (icon) {
        icon.className = "fa-solid fa-circle-check text-emerald-400 opacity-100 text-sm";
      }
      addLog("Học viên", `Đã chọn đáp án ${String.fromCharCode(65 + chosenIdx)} - [Chính xác]`);
    } else {
      streakWrongCount++;
      streakCorrectCount = 0;
      lucChamSai = Date.now();
      if (card) {
        card.classList.remove('hl-card-grammar', 'border-slate-800');
        card.classList.add('hl-card-warning', 'roast-shake');
      }
      if (btn) btn.classList.add('is-wrong');
      if (icon) {
        icon.className = "fa-solid fa-circle-xmark text-rose-400 opacity-100 text-sm";
      }

      // Tô viền xanh nhẹ đáp án đúng để học viên học hỏi
      const correctBtn = document.getElementById(`btn-opt-${exerciseId}-${correctIdx}`);
      if (correctBtn) correctBtn.classList.add('is-answer');
      // Khong ghi them thanh canh bao vao #highlightNotice: khung nhan xet trong the
      // + dap an dung to reu da noi roi, thanh noi o day man che mat loi nhac (F-review)

      addLog("Học viên", `Đã chọn đáp án ${String.fromCharCode(65 + chosenIdx)} - [Chưa chính xác] (Đã sai ${streakWrongCount} câu liên tiếp)`);
    }
    // San khau: ghi ket qua (cham bai tap o thanh ray, the ket bai); cau dang cho thi danh dau da lam
    SK()?.khiTraLoi(exerciseId, isCorrect);
    const traLoiLucCho = !!(choHocVien && choHocVien.exId === exerciseId);
    if (traLoiLucCho) choHocVien.daTraLoi = true;
    // Meo Sensei doi mat ngay luc cham: dung -> vui, sai -> de_biu / that_vong (sai: hen lai luc Sensei noi, duoi)
    const matCham = matMeoNhanXet(isCorrect, streakWrongCount);

    if (explainBox) {
      // Khung nhan xet: mot mat nen phang trong the cau hoi (khong vien hop long hop)
      explainBox.className = "qz-fb is-cho slide-fade-enter";
      explainBox.innerHTML = `
        <div class="qz-fb-dong"><i class="fa-solid fa-spinner fa-spin"></i><span>Sensei đang chấm bài và nghĩ văn cà khịa…</span></div>
      `;

      // Lấy chi tiết câu hỏi để tạo prompt AI
      const exercises = curriculumLoader.getExercises(slideEngine.currentLevel, slideEngine.currentLesson);
      const ex = exercises.find(e => e.id === exerciseId);
      const qText = ex ? ex.question : "Câu hỏi";
      const chosenText = ex && ex.options ? ex.options[chosenIdx] : "";
      const correctText = ex && ex.options ? ex.options[correctIdx] : "";
      const baseExplain = ex ? ex.explanation : "";

      // Sinh nhận xét từ Gemini Flash REST API (hoặc fallback)
      const aiResult = await generateQuizRoast(qText, chosenText, correctText, isCorrect, streakWrongCount, baseExplain);
      // KHÔNG nhúng câu nhận xét vào inline onclick nữa:
      // chỉ cần một dấu nháy đơn là vỡ cả câu lệnh. Gắn listener bằng JS sau khi render.
      const safeRoast = escapeHtml(aiResult.roast || "");
      const safeTip = escapeHtml(aiResult.tip || "");

      // Ba muc: dung (reu), sai (dat nung), sai 3 cau lien tiep (dat nung dam + rung mot lan)
      const fb = isCorrect
        ? { lop: 'is-ok', nhan: `Sensei tung hô · đúng ${streakCorrectCount} câu liên tiếp`,
            icon: 'fa-circle-check', nghe: 'Nghe Sensei khen', loiNhac: 'Giải thích ngữ pháp:' }
        : streakWrongCount >= 3
          ? { lop: 'is-no is-gat roast-shake', nhan: `Sensei bốc hỏa · sai ${streakWrongCount} câu liên tiếp`,
              icon: 'fa-fire', nghe: 'Nghe Sensei mắng thành tiếng', loiNhac: 'Sensei gõ đầu giảng lại:' }
          : { lop: 'is-no', nhan: `Sensei cà khịa · đáp án đúng là ${String.fromCharCode(65 + correctIdx)}`,
              icon: 'fa-circle-xmark', nghe: 'Nghe Sensei cà khịa', loiNhac: 'Sensei nhắc bài:' };
      explainBox.className = `qz-fb ${fb.lop} slide-fade-enter`;
      explainBox.innerHTML = `
          <div class="qz-fb-dau">
            <span class="qz-fb-nhan"><i class="fa-solid ${fb.icon}"></i>${fb.nhan}</span>
            <button type="button" data-roast-speak="1" class="icon-btn" title="${fb.nghe}" aria-label="${fb.nghe}">
              <i class="fa-solid fa-volume-high"></i>
            </button>
          </div>
          <p class="qz-fb-loi">“${safeRoast}”</p>
          ${safeTip ? `<p class="qz-fb-tip"><b>${fb.loiNhac}</b> ${safeTip}</p>` : ''}
        `;
      // Gắn sự kiện cho nút "nghe Sensei nói" sau khi đã render xong HTML
      const roastSpeakBtn = explainBox.querySelector('[data-roast-speak]');
      if (roastSpeakBtn) {
        roastSpeakBtn.addEventListener('click', () => window.playSpeechRoast(aiResult.roast || ""));
      }

      // Chon SAI thi Sensei len tieng ngay, khong doi bam nut. Dung chinh phien
      // Live dang mo nen van la giong quen va van nho ngu canh bai hoc.
      // Cau dang CHO tren san khau (van con cho — tam dung giua luc soan nhan xet thi thoi):
      // cham bai KHONG tam dung bai giang; cham xong ketThucChenNgang tu hen sang cau sau
      const conCho = () => !!(choHocVien && choHocVien.exId === exerciseId);
      if (!isCorrect) {
        const noi = senseiNoiNgoaiBai(`[CHẤM BÀI — NÓI NGAY, ĐỪNG CHÀO HỎI, ĐỪNG ĐỌC LẠI ĐỀ]
Học viên vừa chọn SAI một câu trắc nghiệm.
- Câu hỏi: ${qText}
- Em chọn: ${chosenText}
- Đáp án đúng: ${correctText}
- Đã sai liên tiếp: ${streakWrongCount} câu
- Câu cà khịa đang hiện trên màn hình: "${aiResult.roast || ''}"

Hãy NÓI, theo đúng thứ tự:
1. Nhắc lại ý câu cà khịa trên bằng lời của thầy/cô, một câu ngắn thôi${streakWrongCount >= 3 ? ', và lần này gắt hơn vì em sai liên tiếp' : ''}.
2. Giảng cách làm câu này: vì sao "${correctText}" mới đúng, còn "${chosenText}" sai ở chỗ nào, dựa vào điểm ngữ pháp nào của bài. Nói 2–3 câu, dễ hiểu, có ví dụ ngắn nếu cần.

Nói tiếng Việt tự nhiên; phần tiếng Nhật phải phát âm chuẩn giọng Nhật. Không nói "chào em", không tóm tắt lại đề.${matCham ? `
Mặt mèo tự đổi sang ${matCham} lúc bắt đầu nói — không cần gọi set_emotion.` : ''}`, 30, { giuGiang: conCho() });

        // Mat luc cham chay trong im lang (REST + do tre Live) -> hen lai dung luc Sensei cat loi
        if (noi) henMatKhiNoi(matCham);
        if (!noi) {
          // Chua vao lop duoc thi van con giong may cua trinh duyet
          window.playSpeechRoast(`${aiResult.roast || ''}. ${aiResult.tip || ''}`);
        }
      }

      // Khung nhan xet da xong: hen sang cau sau theo do dai loi nhan xet. Dat SAU loi cham bai
      // (senseiNoiNgoaiBai bat senseiChenNgang) de cau sai doi Sensei cham xong, khong sang giua chung.
      if (conCho()) {
        choHocVien.soChu = (aiResult.roast || '').length + (aiResult.tip || '').length;
        henTiepSauTraLoi();
      }

      try { cuonTrongBaiTap(explainBox, card); } catch (e) {}
    }
  };

  // 8. UI Handlers
  const micVolumeWrapper = document.getElementById('micVolumeWrapper');
  const micVolumeBar = document.getElementById('micVolumeBar');
  const micVolumePercent = document.getElementById('micVolumePercent');

  function updateLiveMicVolume(volume) {
    if (volume > mucAmThanhCaoNhat) mucAmThanhCaoNhat = volume;
    if (micVolumeBar) micVolumeBar.style.transform = `scaleX(${Math.max(0, Math.min(100, volume)) / 100})`;
    if (micVolumePercent) micVolumePercent.innerText = `${volume}%`;

    if (audioEngine && audioEngine.isMicActive && micStatusText) {
      micStatusText.innerText = volume > NGUONG_AM_THANH_RO ? 'Đang nghe bạn nói…' : 'Đang thu âm câu hỏi…';
    }
  }

  // Mở khóa AudioContext tự động cho các thiết bị truy cập từ xa (Tailscale, Mobile Safari, Autoplay Policy)
  const unlockAudioOnUserGesture = () => {
    if (audioEngine) {
      audioEngine.ensureOutContext();
    }
    if (window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  };
  ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'].forEach(evt => {
    window.addEventListener(evt, unlockAudioOnUserGesture, { passive: true });
  });

  // Không còn nút mic riêng: mic chỉ mở trong lúc học viên giơ tay hỏi bài.
  // Hàm này giờ chỉ điều khiển dải "đang thu âm" ở thanh dưới.
  function updateMicUI(canUse, isRecording) {
    if (micVolumeWrapper) {
      micVolumeWrapper.classList.toggle('hidden', !isRecording);
    }
    if (!isRecording) {
      if (micVolumeBar) micVolumeBar.style.transform = 'scaleX(0)';
      if (micVolumePercent) micVolumePercent.innerText = '0%';
      if (micStatusText) micStatusText.innerText = 'Đang thu âm câu hỏi…';
    }
  }

  // Cau tra loi bang GIONG NOI (hoi qua mic) co the mat 20-90 giay — lau hon
  // han so voi tin nhan go chu (gan nhu tuc thi), vi Sensei phai nghe+dich
  // truoc khi tra loi. Toast bao "da gui" chi hien 4 giay roi tat, sau do neu
  // khong co gi khac tren man hinh thi hoc vien tuong cau hoi bi mat/loi. Dai
  // "dang thu am" duoc tai su dung o day de bao "dang cho" cho toi khi tieng
  // dau tien cua Sensei phat ra (anChoTraLoi goi tu onAudioData/onTurnComplete).
  let dangChoTraLoi = false;
  let choTraLoiTimer = null;
  let choTraLoiTimer2 = null;
  let choTraLoiTimer3 = null;
  function hienThiChoTraLoi() {
    dangChoTraLoi = true;
    if (micVolumeWrapper) {
      micVolumeWrapper.classList.remove('hidden');
      micVolumeWrapper.classList.add('is-waiting');
    }
    if (micVolumeBar) micVolumeBar.style.transform = 'scaleX(0)';
    if (micVolumePercent) micVolumePercent.innerText = '';
    if (micStatusText) micStatusText.innerText = 'Sensei đang xử lý câu trả lời…';
    clearTimeout(choTraLoiTimer);
    clearTimeout(choTraLoiTimer2);
    clearTimeout(choTraLoiTimer3);
    choTraLoiTimer = setTimeout(() => {
      if (dangChoTraLoi && micStatusText) {
        micStatusText.innerText = 'Câu hỏi bằng giọng nói cần thêm chút thời gian, Sensei vẫn đang xử lý…';
      }
    }, 12000);
    // Doi qua lau (60s+) ma van chua co gi — cau tra loi qua mic thuong toi
    // trong khoang 20-90s, nhung neu qua moc nay van im thi kha nang cao la
    // ket noi/mic co van de that su, khong phai chi cham. Goi y ngay loi
    // thoat: go chu (kenh nay luon phan hoi gan nhu tuc thi).
    choTraLoiTimer2 = setTimeout(() => {
      if (dangChoTraLoi && micStatusText) {
        micStatusText.innerText = 'Đợi hơi lâu rồi — nếu vẫn không thấy gì, thử gõ câu hỏi bằng chữ thay vì nói.';
      }
    }, 60000);
    // 80s+ van im lang tuyet doi: da xac nhan qua thuc te la LUOT HOI DAU TIEN
    // tren MOT ket noi luon duoc tra loi, nhung mot luot hoi KE TIEP tren
    // CUNG ket noi do doi khi treo vinh vien du gui dung dinh dang. Chua ro
    // nguyen nhan goc (co the la trang thai noi bo phia server sau turn dau
    // tien) — nhung ngat va ket noi lai cho "luot dau" moi la cach phuc hoi
    // dang tin cay nhat da quan sat duoc, con hon la cho vo han.
    choTraLoiTimer3 = setTimeout(() => {
      if (dangChoTraLoi) {
        showToast('Kết nối có vẻ bị đơ — đang tự làm mới, bạn hỏi lại (giơ tay hoặc gõ chữ) nhé.', 'info', 8000);
        // Tat dai "dang cho" ngay, khong trong vao onClose: socket da chet san
        // thi disconnect() khong ban onclose nua va dai cho se treo mai.
        anChoTraLoi();
        ngatPhienChuDong();
      }
    }, 80000);
  }
  function anChoTraLoi() {
    if (!dangChoTraLoi) return;
    dangChoTraLoi = false;
    clearTimeout(choTraLoiTimer);
    clearTimeout(choTraLoiTimer2);
    clearTimeout(choTraLoiTimer3);
    if (micVolumeWrapper) {
      micVolumeWrapper.classList.add('hidden');
      micVolumeWrapper.classList.remove('is-waiting');
    }
  }

  function setWaveformActive(active) {
    const bars = document.querySelectorAll('.wave-bar');
    bars.forEach(b => {
      if (active) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  // 9. Thông báo
  //
  // Bảng "Interleaved Reasoning & Events" đã bỏ khỏi giao diện.
  // addLog() giữ nguyên chữ ký để không phải sửa hàng chục lời gọi,
  // nhưng giờ chỉ đẩy ra console; riêng lỗi thì nổi thành toast để không im lặng.
  let toastSeq = 0;

  // Nhat ky loi: KHONG day len man hinh nua, chi giu lai de chan doan.
  // Go trong Console:  __errors()
  const errorLog = [];
  window.__errors = () => errorLog.slice(-30);

  function showToast(text, kind = 'info', ms = 4200) {
    if (!text) return;

    // Loi khong hien ra man hinh — hoc vien dang hoc, khong can thay chuyen noi bo
    if (kind === 'error') {
      errorLog.push({ luc: new Date().toLocaleTimeString(), noiDung: String(text) });
      console.warn('[sensei]', text);
      return;
    }

    if (!toastHost) return;
    const el = document.createElement('div');
    el.className = 'toast toast-' + kind;
    const icon = kind === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info';
    el.innerHTML = `<i class="fa-solid ${icon}"></i><span></span>`;
    el.querySelector('span').textContent = text;
    toastHost.appendChild(el);

    const id = ++toastSeq;
    el.dataset.toastId = String(id);
    setTimeout(() => {
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 320);
    }, ms);
  }
  window.__showToast = showToast;

  // Don moi toast dang hien (mo dan .3s). San khau giang bat lai: toast nam dung cho dong dau + thanh tien do.
  function donToast() {
    if (!toastHost) return;
    toastHost.querySelectorAll('.toast:not(.is-out)').forEach((el) => {
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 320);
    });
  }

  function addLog(sender, text) {
    if (sender === 'Error') {
      showToast(String(text), 'error', 6500);
      return;
    }
    console.debug('[' + sender + ']', text);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // 10. Chat Input & Quick Action Prompts
  let dangGuiChat = false;   // dang cho vao lop de gui cau go -> Enter/bam them khong gui trung
  async function handleSendMessage() {
    const text = chatInput.value.trim();
    if (!text || dangGuiChat) return;
    if (!geminiClient.isConnected || !geminiClient.isSetupComplete) {
      // Go chu cung TU vao lop nhu gio tay — "Bắt đầu giảng bài" chi dieu
      // khien viec GIANG, khong phai dieu kien de duoc hoi. Chu van giu trong o.
      dangGuiChat = true;
      showToast('Đang vào lớp để gửi câu hỏi…');
      try {
        await ensureConnected();
      } catch (err) {
        // 'missing-key' / 'quota' da co bao rieng
        if (!err || (err.message !== 'missing-key' && err.message !== 'quota')) {
          showToast('Chưa vào được lớp — kiểm tra API Key hoặc mạng rồi gửi lại.', 'info', 6000);
        }
        return;
      } finally {
        dangGuiChat = false;
      }
      if (!geminiClient.isSetupComplete) return;
    }

    cancelStepTransition();

    // Tự động phân tích ý định chuyển/quay lại tab từ câu hỏi học viên
    detectAndSwitchTabFromIntent(text, 'user');

    // Nếu học viên đang trong chế độ giơ tay
    if (isRaisingHand) {
      isRaisingHand = false;
      if (audioEngine.isMicActive) {
        audioEngine.stopMic();
      }
      // Dong moc activityStart mo luc gio tay (automaticActivityDetection da
      // tat): thieu cai nay thi server cho mai, luot noi sau mo chong len.
      geminiClient.sendAudioStreamEnd();
      updateMicUI(true, false);
      updateLectureControlsUI();
    }

    const lower = text.toLowerCase();

    // Nếu học viên gõ "tiếp tục" / "next" khi bài giảng đang tạm dừng
    if (lectureState === 'PAUSED' && (lower.includes("tiếp tục") || lower.includes("tiếp theo") || lower === "next" || lower.includes("học tiếp"))) {
      resumeLecture();
      chatInput.value = '';
      return;
    }

    // Nếu học viên hỏi khi bài giảng đang phát: Tạm dừng bài giảng & gửi câu hỏi kèm ngữ cảnh bài học
    if (lectureState === 'PLAYING') {
      pauseLecture(false);
      const lvl = slideEngine.currentLevel;
      const lessonNum = slideEngine.currentLesson;
      const lesson = curriculumLoader.getLesson(lvl, lessonNum) || {};
      const tabName = slideEngine.activeTab;
      const enrichedMsg = `[CÂU HỎI TỪ HỌC VIÊN KHI ĐANG HỌC BÀI ${CAP_DO.ten(lvl)} - BÀI ${lessonNum} (${tabName})]:
"${text}"
(Sensei hãy giải đáp cặn kẽ câu hỏi này cho học viên nhé!)`;

      if (audioEngine) audioEngine.setSuppressed(false);
      geminiClient.sendUserMessage(enrichedMsg);
      addLog("Học viên", text);
      chatInput.value = '';
      closeChat();
      showToast('Đã gửi câu hỏi — Sensei dừng bài để giải đáp cho bạn…');
      return;
    }

    geminiClient.sendUserMessage(text);
    addLog("Học viên", text);
    chatInput.value = '';
    closeChat();
  }

  if (sendChatBtn) sendChatBtn.addEventListener('click', handleSendMessage);
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      // Dang go IME (tieng Nhat / Telex tren Mac): Enter la chot chu, Esc la bo
      // chu dang go — thuoc ve bo go. Safari bao keyCode 229 ma isComposing=false.
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === 'Enter') handleSendMessage();
      // Esc: de noi len bo nghe chung o document (dong dung MOT lop tren cung, xem "Phim tat")
    });
  }

  // Manual Navigation & Listeners
  if (levelSelect) {
    levelSelect.addEventListener('change', (e) => {
      const selectedLevel = e.target.value;
      // N4 bắt đầu từ bài 26 chứ không phải bài 1 -> phải lấy số bài thực tế,
      // nếu không nhãn hiện "Bài 1" trong khi nội dung là bài 26.
      const firstLesson = (curriculumLoader.getLessonsForLevel(selectedLevel) || [])[0];
      const firstNum = firstLesson ? firstLesson.lessonNumber : 1;
      // Di chung duong voi man chon bai: dung giang, lau bang, mo Từ vựng,
      // dung lai giao an va long tieng hoi thoai cho bai moi.
      openLesson(selectedLevel, firstNum);
    });
  }

  const stopAllAudio = () => {
    if (audioEngine) audioEngine.stopPlayback();
    if (window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
  };

  if (lessonSelect) {
    lessonSelect.addEventListener('change', (e) => {
      const lvl = levelSelect ? levelSelect.value : "N5";
      const chosenLessonNum = Number(e.target.value) || 1;
      openLesson(lvl, chosenLessonNum);   // nhu man chon bai (xem levelSelect)
    });
  }

  const tabReflexBtn = document.getElementById('tabReflexBtn');
  const tabVocabBtn = document.getElementById('tabVocabBtn');
  const tabKanjiBtn = document.getElementById('tabKanjiBtn');
  const tabGrammarBtn = document.getElementById('tabGrammarBtn') || document.getElementById('tabSlideBtn');
  const tabKaiwaBtn = document.getElementById('tabKaiwaBtn');

  if (tabVocabBtn) tabVocabBtn.addEventListener('click', () => handleManualTabChange('vocab'));
  if (tabKanjiBtn) tabKanjiBtn.addEventListener('click', () => handleManualTabChange('kanji'));
  if (tabGrammarBtn) tabGrammarBtn.addEventListener('click', () => handleManualTabChange('grammar', slideEngine.currentSlideIndex || 0));
  if (tabKaiwaBtn) tabKaiwaBtn.addEventListener('click', () => handleManualTabChange('kaiwa'));
  if (tabQuizBtn) tabQuizBtn.addEventListener('click', () => handleManualTabChange('quiz'));
  if (tabReflexBtn) tabReflexBtn.addEventListener('click', () => handleManualTabChange('reflex'));

  // Lat slide bang tay -> "Giảng tiếp" hoc tu slide dang mo (nhu bam tab
  // Ngữ pháp), khong nhay ve slide cu. resumeLecture chi doc stepIndex.
  function dongBoCheckpointTheoSlide() {
    lectureCheckpoint.sectionName = 'grammar';
    lectureCheckpoint.subIndex = slideEngine.currentSlideIndex;
    if (currentLectureSteps.length) {
      // Nho nhip dang dở THAT (truoc lan lat dau; checkpoint moi o
      // executeLectureStep / pauseLecture / openLesson tu xoa no). Lat di roi
      // lat ve dung slide do -> hoc tiep tu nhip do (vd vi du 3), khong giang
      // lai tu phan gioi thieu (nhu bam lai dung tab o handleManualTabChange).
      if (lectureCheckpoint.nhipDangDo === undefined) lectureCheckpoint.nhipDangDo = lectureCheckpoint.stepIndex;
      const dangDo = currentLectureSteps[lectureCheckpoint.nhipDangDo];
      const i = (dangDo && dangDo.chapter === 'grammar' && dangDo.subIndex === (slideEngine.currentSlideIndex || 0))
        ? lectureCheckpoint.nhipDangDo
        : firstBeatOfCurrentView();
      lectureCheckpoint.stepIndex = i;
      currentLectureStepIndex = i;
    }
  }
  if (prevSlideBtn) prevSlideBtn.addEventListener('click', () => {
    if (lectureState === 'PLAYING') pauseLecture(false);
    stopAllAudio();
    slideEngine.prevSlide();
    dongBoCheckpointTheoSlide();
    updateLectureControlsUI();
  });
  if (nextSlideBtn) nextSlideBtn.addEventListener('click', () => {
    if (lectureState === 'PLAYING') pauseLecture(false);
    stopAllAudio();
    slideEngine.nextSlide();
    dongBoCheckpointTheoSlide();
    updateLectureControlsUI();
  });
  if (dismissErrBtn) dismissErrBtn.addEventListener('click', () => slideEngine.dismissError());

  // Syllabus Modal Control
  /* ======================================================================
     DỰNG SẴN GIỌNG NHÂN VẬT CHO ĐOẠN HỘI THOẠI

     Live API khoá một giọng cho cả phiên. Ngắt phiên rồi nối lại cho từng câu
     thì mỗi câu phải chờ dựng lại WebSocket — đoạn thoại đứt quãng liên tục.
     Lời thoại lại là văn bản cố định, nên ta dựng sẵn ngay khi mở bài (lúc học
     viên còn đang ở chương Từ vựng), mỗi nhân vật một giọng, bằng cách mở SONG
     SONG nhiều phiên Live — mỗi phiên khoá sẵn một giọng và giữ mở suốt buổi.
     Không dùng model TTS vì TTS không nằm trong nhóm quota Unlimited.
     ====================================================================== */

  // Nguon giong hoi thoai: dan dien vien Live.
  // KHONG dung model TTS — TTS khong nam trong nhom quota Unlimited.
  // Thu model chinh truoc; hong thi tut xuong du phong va nho lai.
  //
  // Co tu 2 key .env tro len VA hoi thoai co tu 2 giong tro len: moi giong
  // duoc giao mot key rieng (vong tron), cac giong o KEY KHAC NHAU chay
  // SONG SONG — gioi han "so phien Live dong thoi" la tinh THEO TUNG KEY nen
  // khong cham tran. Chi con 1 key hoac 1 giong thi dung duong tuan tu don,
  // da kiem chung ky qua nhieu loi thuc te (xem chayLongTieng ben duoi).
  const ACTOR_MODELS = [SENSEI_MODELS.actor, SENSEI_MODELS.actorFallback];
  let actorModelIdx = 0;            // chi de hien thi chan doan (__voice.status)
  function actorModel() { return ACTOR_MODELS[actorModelIdx]; }

  let actorPool = null;             // duong du phong: chi 1 key hoac chi 1 giong
  const actorPools = new Map();     // duong song song: key -> VoiceActorPool rieng
  function closeAllActorPools() {
    if (actorPool) { actorPool.closeAll(); actorPool = null; }
    actorPools.forEach(p => p.closeAll());
    actorPools.clear();
  }
  let lastActorError = null;      // loi gan nhat khi dung giong
  let soloRetryDone = false;      // da thu "dong Sensei roi dung giong" chua
  const dialogueAudio = {};        // 'dia-n5-1-3' -> base64 PCM 24kHz
  // Giong da dung de dung tung cau ('dia-n5-1-3' -> 'Orus'): ban audio chi duoc phat khi
  // van dung giong hien hanh cua nhan vat trong bang curriculum/nhan-vat.json. Doi giong
  // (bang cap nhat) thi ban cu bi bo, khong bao gio phat nham giong.
  const dialogueAudioVoice = {};
  const dialogueAudioInFlight = {};
  const giongCuaDong = (line) => (window.SenseiVoices
    ? window.SenseiVoices.voiceFor(line.speaker, line.speakerGender) : null);
  /** Ban audio cua cau con dung giong hien hanh khong (khong ghi nhan giong = ban mo phong, chap nhan) */
  function audioDongConDung(line) {
    if (!dialogueAudio[line.id]) return false;
    const da = dialogueAudioVoice[line.id];
    return !da || !giongCuaDong(line) || da === giongCuaDong(line);
  }
  function xoaAudioSaiGiong() {
    let bo = 0;
    const dia = curriculumLoader.getDialogue(slideEngine.currentLevel, slideEngine.currentLesson) || [];
    dia.forEach((l) => {
      if (dialogueAudio[l.id] && !audioDongConDung(l)) {
        delete dialogueAudio[l.id]; delete dialogueAudioVoice[l.id]; bo++;
      }
    });
    return bo;   // cau cua bai khac (neu con) da duoc audioDongConDung chan luc phat
  }
  // Bang nhan vat tai tu tep khac ban nhung san (chu bai vua sua giong): bo audio sai giong, dung lai bai dang mo
  if (window.SenseiVoices && SenseiVoices.onRosterChange) {
    SenseiVoices.onRosterChange(() => {
      const bo = xoaAudioSaiGiong();
      if (bo && slideEngine.currentLevel) {
        console.log(`[giong] bang nhan vat doi giong: bo ${bo} cau da dung sai giong, dung lai`);
        prefetchDialogueAudio(slideEngine.currentLevel, slideEngine.currentLesson).catch(() => {});
      }
    });
  }
  let ttsDisabled = false;         // key khong co quyen TTS -> thoi, khong thu lai

  async function synthLine(apiKey, model, text, voiceName) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: ctrl.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName } },
              },
            },
          }),
        }
      );
      clearTimeout(timer);
      if (!res.ok) return { ok: false, status: res.status };
      const data = await res.json();
      const b64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!b64) return { ok: false, status: 'empty' };
      return { ok: true, audio: b64 };
    } catch (err) {
      clearTimeout(timer);
      return { ok: false, status: String((err && err.message) || err) };
    }
  }

  /**
   * Dựng sẵn toàn bộ lượt thoại của bài bằng dàn diễn viên Live, chạy ngầm.
   * Bắt đầu ngay khi mở bài — cách chương Hội thoại vài chục nhịp nên tới nơi
   * là giọng đã nằm sẵn trong bộ nhớ, phát ra là liền mạch.
   */
  async function prefetchDialogueAudio(lvl, lessonNum, opts = {}) {
    // Moi bai chi MOT luot long tieng mot luc: goi chong (mo lai bai dang long
    // tieng, dong danh sach, __voice) thi dung chung luot dang chay, khong mo
    // them phien dien vien tren cung key (de cham tran mã 1000). Luot solo goi
    // tu BEN TRONG luot dang chay nen phai lach qua, khong thi no cho chinh no.
    const k = String(lvl).toUpperCase() + '-' + Number(lessonNum);
    if (!opts.soloMode && dialogueAudioInFlight[k]) return dialogueAudioInFlight[k];
    const p = (async () => {
      // Boc mot lop chi de chac chan tat duoc lop cho: ben trong co toi bon
      // duong thoat (doi model, tam roi lop, loi vinh vien, xong xuoi).
      try {
        return await chayLongTieng(lvl, lessonNum, opts);
      } finally {
        // Lop cho la cua bai dang mo: luot cu cua bai da roi di khong duoc tat
        // lop cho cua luot bai moi dang chay.
        const kNay = String(slideEngine.currentLevel).toUpperCase() + '-' + Number(slideEngine.currentLesson);
        if (kNay === k || !dialogueAudioInFlight[kNay]) datCho('kaiwa', null);
      }
    })();
    if (!opts.soloMode) {
      dialogueAudioInFlight[k] = p;
      p.finally(() => { if (dialogueAudioInFlight[k] === p) delete dialogueAudioInFlight[k]; }).catch(() => {});
    }
    return p;
  }

  async function chayLongTieng(lvl, lessonNum, opts = {}) {
    if (ttsDisabled) return;
    if (!window.SenseiVoices || !window.VoiceActorPool) return;
    const keys = allKeys();
    if (!keys.length) return;
    // Cho bang nhan vat (curriculum/nhan-vat.json) nap xong, toi da ~2,5 giay, de khong dung
    // bang ban nhung roi phai dung lai neu tep co doi giong.
    try { await window.SenseiVoices.ready; } catch (e) {}

    const dialogue = curriculumLoader.getDialogue(lvl, lessonNum) || [];
    if (!dialogue.length) return;

    // Gom cac luot thoai theo giong.
    const byVoice = new Map();
    for (const line of dialogue) {
      if (audioDongConDung(line)) continue;
      delete dialogueAudio[line.id]; delete dialogueAudioVoice[line.id];   // ban cu sai giong thi dung lai
      const jp = (line.tokens || []).map(t => t.kanji || t.text).join('');
      if (!jp.trim()) continue;
      // Giong co dinh cua nhan vat theo bang curriculum/nhan-vat.json (khong xao tron theo bai)
      const voice = window.SenseiVoices.voiceFor(line.speaker, line.speakerGender);
      if (!byVoice.has(voice)) byVoice.set(voice, []);
      byVoice.get(voice).push({ line, jp });
    }
    const voices = [...byVoice.keys()];
    const todo = [...byVoice.values()].reduce((n, a) => n + a.length, 0);
    if (!todo) return;

    // Tu 2 key tro len la chay song song duoc — KHONG con khoa cung theo so
    // giong nua. Neu mot nhan vat noi nhieu cau han han cac nhan vat khac,
    // xe le cau cua giong do ra nhieu manh cho nhieu key cung doc, thay vi
    // giu nguyen ca giong do tren MOT key trong khi cac key khac da xong
    // ngoi cho khong. Gioi han "so phien Live dong thoi" la tinh THEO TUNG
    // KEY (tai khoan), khong phai toan cuc, nen nhieu key thi chay cung luc
    // ma khong cham tran mã 1000.
    const dungSongSong = keys.length > 1 && todo > 1;

    // Xe cau cua tung giong thanh nhieu manh (khi giong do dai hon han cac
    // giong khac) roi rai deu cac manh cho tung key theo kieu "manh dai nhat
    // vao key dang it viec nhat" (LPT scheduling) — de key cham nhat trong
    // dot chay cung it viec nhat co the.
    function chiaCongViec() {
      let manh = voices.map(voice => ({ voice, items: byVoice.get(voice).slice() }));
      const soManhMucTieu = Math.min(keys.length, todo);
      while (manh.length < soManhMucTieu) {
        let idx = -1, max = 1;
        manh.forEach((m, i) => { if (m.items.length > max) { max = m.items.length; idx = i; } });
        if (idx === -1) break;   // khong con manh nao du dai de cat nua
        const m = manh[idx];
        const giua = Math.ceil(m.items.length / 2);
        manh.splice(idx, 1,
          { voice: m.voice, items: m.items.slice(0, giua) },
          { voice: m.voice, items: m.items.slice(giua) });
      }
      manh.sort((a, b) => b.items.length - a.items.length);
      const gio = keys.map(() => ({ nhom: [], tai: 0 }));
      manh.forEach(m => {
        let idx = 0;
        for (let i = 1; i < gio.length; i++) if (gio[i].tai < gio[idx].tai) idx = i;
        gio[idx].nhom.push(m);
        gio[idx].tai += m.items.length;
      });
      return gio.map(g => g.nhom).filter(nhom => nhom.length);
    }

    // Long tieng la viec nen tu dong, hoc vien khong can thay tien trinh noi
    // bo nay tren man hinh — chi ghi console de chan doan khi can.
    console.log(dungSongSong
      ? `[long tieng] bắt đầu ${todo} lượt thoại, ${voices.length} giọng `
        + `(song song trên tối đa ${Math.min(keys.length, todo)} tài khoản)`
      : `[long tieng] bắt đầu ${todo} lượt thoại, ${voices.length} giọng`);

    let made = 0;
    // keyHetHan/hong: key nao het quota giua chung va nhung cau no bo lai —
    // de sau dot song song dua cho cac key con han muc doc lai.
    const ketQua = { permanentFail: false, sessionLimitHit: false, keyHetHan: new Set(), hong: [] };
    const vanOBaiNay = () => slideEngine.currentLevel === lvl && slideEngine.currentLesson === Number(lessonNum);
    // Chi chu het quota that. KHONG khop ma 1011 tran: Gemini cung dong 1011
    // cho loi noi bo nhat thoi — loi do van phai thu lai nhu thuong.
    const hetQuota = /quota|RESOURCE_EXHAUSTED|\b429\b/i;

    /**
     * Doc het loi cua MOT nhom, tuan tu trong nhom (dung nhu duong cu). Mot
     * "nhom" la danh sach cac manh {voice, items} — CO THE la nhieu manh
     * CUNG mot giong (khi giong do bi xe le cho nhieu key), nen van phai
     * dong phien cua giong nay truoc khi mo phien giong khac trong CUNG mot
     * nhom, tranh mo hai phien tren CUNG mot key.
     * candidateKeys: cac key duoc phep thu cho nhom nay, theo dung thu tu —
     * nhom song song chi nhan DUNG MOT key (khong tranh voi nhom khac); nhom
     * don (khong song song) nhan CA DANH SACH de con xoay key khi het quota.
     */
    async function chayNhom(candidateKeys, danhSachManh) {
      let keyIdx = 0, modelIdx = 0;
      const moPool = () => new VoiceActorPool({ apiKey: candidateKeys[keyIdx], model: ACTOR_MODELS[modelIdx] });
      let pool = moPool();
      if (dungSongSong) actorPools.set(candidateKeys[0], pool); else actorPool = pool;

      for (const { voice, items } of danhSachManh) {
        if (slideEngine.currentLevel !== lvl || slideEngine.currentLesson !== Number(lessonNum)) break;

        for (const { line, jp } of items) {
          // Xet tung cau chu khong chi tung manh: moi key thuong chi co mot
          // manh, xet o ngoai thi bai cu van doc het tren cung key voi bai moi.
          if (!vanOBaiNay()) break;
          if (audioDongConDung(line)) { made++; continue; }
          // Nhan ngan (vong quay da noi "dang"): vua hang tieu de ca o 360px, chi tiet nam o title
          datCho('kaiwa', `Lồng tiếng ${made + 1}/${todo} lượt thoại…`,
            `${line.speaker || 'Nhân vật'} — giọng ${voice}.`
            + (dungSongSong ? ' Đang chạy song song nhiều giọng trên nhiều tài khoản.'
                            : ' Mỗi nhân vật một giọng riêng nên phải dựng lần lượt.'));

          // Thu lai vai lan: loi WebSocket nhat thoi rat hay gap khi phien vua
          // bat tay xong. Bo cuoc ngay lan dau la ca buoi mat giong nhan vat.
          let res = null;
          for (let attempt = 1; attempt <= 3; attempt++) {
            res = await pool.speak(voice, jp);
            if (res.ok) break;
            if (hetQuota.test(res.reason || '')) break;   // het quota: thu lai cung cho la vo ich
            if (attempt < 3) {
              console.warn(`[long tieng] thu lai lan ${attempt + 1} (${voice}):`, res.reason);
              pool.close(voice);
              await new Promise(r => setTimeout(r, 1200 * attempt));
            }
          }

          // Het 3 lan van hong -> tut model du phong CHO RIENG NHOM NAY, thu 1 lan.
          if (!res.ok && modelIdx < ACTOR_MODELS.length - 1) {
            modelIdx++;
            actorModelIdx = modelIdx;   // chi de __voice.status() hien dung
            console.warn('[long tieng] doi sang', ACTOR_MODELS[modelIdx], '-', res.reason);
            pool.closeAll();
            pool = moPool();
            if (dungSongSong) actorPools.set(candidateKeys[0], pool); else actorPool = pool;
            res = await pool.speak(voice, jp);
          }

          // Van hong sau khi het model -> con key du phong trong danh sach
          // duoc giao (chi co o nhom don) thi xoay sang key do, tu model dau.
          if (!res.ok && keyIdx < candidateKeys.length - 1) {
            keyIdx++;
            modelIdx = 0;
            actorModelIdx = 0;
            console.warn('[long tieng] doi sang key khac (idx', keyIdx, ') -', res.reason);
            pool.closeAll();
            pool = moPool();
            actorPool = pool;
            res = await pool.speak(voice, jp);
          }

          if (res && res.ok) {
            dialogueAudio[line.id] = res.pcm;
            dialogueAudioVoice[line.id] = voice;   // ghi nhan de audio khong song sot khi doi giong
            made++;
            continue;
          }

          // Cau nay chiu — GHI NHAN loi va BO QUA, khong nuke ca bai hoc vi
          // mot cau; Sensei se tu doc doan nay khi den luot (xem sendToSensei).
          lastActorError = `${ACTOR_MODELS[modelIdx].replace('models/', '')}/${voice}: ${(res && res.reason) || 'không rõ'}`;
          console.warn('[long tieng] bỏ qua 1 câu:', lastActorError);
          if (/mã 1000/.test((res && res.reason) || '')) ketQua.sessionLimitHit = true;
          if (/không được phép|permission|API key|not found|không tìm thấy|403|404/i.test((res && res.reason) || '')) {
            ketQua.permanentFail = true;
          }
          if (hetQuota.test((res && res.reason) || '')) {
            ketQua.keyHetHan.add(candidateKeys[keyIdx]);
            ketQua.hong.push({ voice, line, jp });
          }
        }

        pool.close(voice);   // xong giong nay thi dong phien lai roi moi sang giong ke
      }
    }

    if (dungSongSong) {
      const nhomTheoKey = chiaCongViec();
      await Promise.all(nhomTheoKey.map((nhom, i) => chayNhom([keys[i]], nhom)));

      // Nhom song song chi co MOT key: key do het quota giua chung thi cau cua
      // no bi bo trong khi key khac da xong ngoi khong. Dua cac cau con thieu
      // cho cac key con han muc doc lai MOT lan (tuan tu, xoay key khi can).
      const conSong = keys.filter(k => !ketQua.keyHetHan.has(k));
      const conThieu = ketQua.hong.filter(h => !audioDongConDung(h.line));
      if (conThieu.length && conSong.length && vanOBaiNay()) {
        const theoGiong = new Map();
        conThieu.forEach(h => {
          if (!theoGiong.has(h.voice)) theoGiong.set(h.voice, []);
          theoGiong.get(h.voice).push({ line: h.line, jp: h.jp });
        });
        console.log(`[long tieng] thu lai ${conThieu.length} câu trên ${conSong.length} tài khoản còn hạn mức`);
        await chayNhom(conSong, [...theoGiong].map(([voice, items]) => ({ voice, items })));
      }
    } else {
      await chayNhom(keys, voices.map(voice => ({ voice, items: byVoice.get(voice) })));
    }

    // Hoc vien da sang bai khac trong luc long tieng: dung o day — khong ngat
    // Sensei (solo) hay bao loi cho mot bai ho da roi di.
    if (!vanOBaiNay()) {
      if (ketQua.permanentFail) ttsDisabled = true;
      return;
    }

    // Xu ly hau ky CHUNG cho ca hai duong chay.
    // Dang co ai dung phien Sensei (gio tay, thu am, phan xa, cho tra loi,
    // Sensei dang noi...) thi KHONG ngat ngang giua chung — bo qua lan nay,
    // Sensei tu doc phan thieu, lan mo bai sau se thu lai.
    const dangBan = isRaisingHand || dangThuAm || dangMoMicPA || dangChoChamPhatAm || dangChoTraLoi
      || phanXa.dangChay || pxChoPhan || senseiChenNgang || isConnecting
      || audioEngine.isMicActive || geminiClient.isTurnActive() || audioEngine.isPlaybackActive();
    if (ketQua.sessionLimitHit && !soloRetryDone && !dangBan
        && geminiClient.isConnected && lectureState !== 'PLAYING') {
      soloRetryDone = true;
      closeAllActorPools();
      ttsDisabled = false;
      showToast('Tạm rời lớp một lát để lồng tiếng hội thoại…');
      // Tu ngat (khong bao "Mất kết nối"); onClose giu nguyen PAUSED nen
      // vao lop lai la "Giảng tiếp" van con, khong can tra trang thai tay.
      ngatPhienChuDong();
      await new Promise(r => setTimeout(r, 600));
      await prefetchDialogueAudio(lvl, lessonNum, { soloMode: true });
      showToast('Lồng tiếng xong — đang vào lớp lại…');
      ensureConnected().catch(() => {});
      return;
    }

    if (ketQua.permanentFail) ttsDisabled = true;
    if (lastActorError && made < todo) {
      // Loi kind='error' khong hien man hinh (showToast da chan) — chi ghi
      // console/nhat ky de chan doan, hoc vien khong bi lam phien.
      showToast(`Chưa lồng tiếng được hết — ${lastActorError}. Sensei sẽ tự đọc phần còn thiếu.`
        + (ketQua.permanentFail ? '' : ' Sẽ thử lại khi bạn mở lại bài.'), 'error', 9000);
    }

    // Xong viec nen thi chi ghi console — khong noi cho hoc vien, day la chi
    // tiet van hanh noi bo, khong phai thu ho can biet de hoc.
    if (made) {
      const cast = window.SenseiVoices.castOf(dialogue)
        .map(c => `${c.speaker} → ${c.voice} (${c.genderVi})`).join(', ');
      console.log(`[long tieng] xong ${made}/${todo} luot thoai — ${cast}`
        + (dungSongSong ? ' (chạy song song)' : ''));
    }
  }

  /**
   * Lượt 1 của chương Hội thoại: phát liền mạch cả đoạn bằng giọng từng nhân vật.
   * Đèn rọi chạy theo từng câu. Sensei không xen vào lượt này.
   */
  async function playWholeDialogue(dialogue, stepIndex) {
    // Sensei phai im han truoc khi dan nhan vat vao thoai, khong de hai ben chong nhau
    audioEngine.stopPlayback();
    await new Promise(r => setTimeout(r, 250));

    for (let i = 0; i < dialogue.length; i++) {
      const line = dialogue[i];
      if (lectureState !== 'PLAYING' || currentLectureStepIndex !== stepIndex) return false;
      lastToolFocusAt = Date.now();
      slideEngine.focusItem(line.id, 'reading_focus');
      SK()?.khiDongThoai(line, i);   // san khau: bong thoai i vao luong, karaoke theo clip
      const played = await playDialogueLine(line);
      if (lectureState === 'PLAYING' && currentLectureStepIndex === stepIndex) SK()?.khiXongDong(line.id);
      if (!played) return false;

      // Nhịp nghỉ ngắn giữa hai lượt thoại cho giống đối đáp thật
      await new Promise(r => setTimeout(r, 320));
    }
    return true;
  }

  /* ----------------------------------------------------------------------
     TRANG THAI CHO CUA HAI CHUONG CHAY NGAM

     Soan de va long tieng deu chay ngam va lau. Giu trang thai o day roi ve
     lai moi khi doi tab, nho vay:
       - dang o tab do      -> thay ngay vong quay + lop mo
       - di tab khac roi ve -> van con, khong bi mat
       - viec xong          -> tu tat, khong can ai goi don
     ---------------------------------------------------------------------- */
  const dangCho = { quiz: null, kaiwa: null };

  function datCho(tab, title, note) {
    dangCho[tab] = title ? { title, note } : null;
    veLaiCho();
  }

  function veLaiCho() {
    const s = dangCho[slideEngine.activeTab];
    // Long tieng: loi thoai van doc / nghe duoc (giong trinh duyet) -> chi nhan nho o tieu de, khong mo chuong.
    // Soan de: de cu sap bi thay -> van mo + khoa nhu cu.
    if (s) slideEngine.setBusy(true, s.title, s.note, slideEngine.activeTab === 'kaiwa');
    else slideEngine.setBusy(false);
  }

  function khiDoiTab(tab) {
    // Moi lan ve (ke ca ve lai chinh Bai tap) la khung viet tay cu bi thay:
    // dung dong ho cu, khong thi het gio no nop khung trong / khung da mat.
    huyVietTay();
    // Roi chuong Phan xa giua chung: tat dong ho va dong mic lai, khong
    // thi dem nguoc van chay ngam va mic van bat o chuong khac.
    if (tab !== 'reflex') dungPhanXaKhiRoiTab();

    // Nap ngam chi tiet vai bai lien truoc cho phan on bai (Bai tap / Phan xa)
    // — muc luc nhe khong co cau/tu nao de on. Da nap roi thi khong tai lai.
    if (curriculumLoader.ensureReviewLoaded) {
      curriculumLoader.ensureReviewLoaded(slideEngine.currentLevel, slideEngine.currentLesson).catch(() => {});
    }

    veLaiCho();
    // KHONG tu soan de khi mo chuong Bai tap (nguoi hoc: "vua vo da bi load de khac").
    // Chi nut "Doi de khac" moi goi AI. Bo de chinh ho da bam tao (kho 7 ngay) thi gan
    // san ngay tu chuong dau tien cua bai, nen luc mo Bai tap de da on dinh, khong ve lai truoc mat.
    apDungDeDaLuu(slideEngine.currentLevel, slideEngine.currentLesson);
  }

  slideEngine.onTabChange = khiDoiTab;

  /* ----------------------------------------------------------------------
     LUYEN PHAT AM CA CAU

     Hoc vien doc to mot cau, Sensei nghe roi cham. Duong di cua tieng noi
     giong het luc "gio tay hoi": mic -> phien Live dang mo -> Sensei tra loi
     bang giong cua no. Khac o cho nap ngu canh truoc: noi ro day la mot lan
     KIEM TRA PHAT AM, va cau dung phai doc la cau nao.
     ---------------------------------------------------------------------- */
  function timCauPhatAm(id) {
    return (slideEngine.pronunciationSet || []).find(c => c.id === id) || null;
  }

  function veNutThuAm(id, dangThu) {
    const btn = document.getElementById('rec-' + id);
    if (!btn) return;
    // Dang nut: .qz-rec trong css/lesson.css (dang thu = .is-rec, nen dat nung dac)
    btn.className = dangThu ? 'qz-rec is-rec' : 'qz-rec';
    btn.innerHTML = dangThu
      ? '<i class="fa-solid fa-stop" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-microphone" aria-hidden="true"></i>';
    btn.title = dangThu ? 'Đang thu — bấm để gửi cho Sensei chấm' : 'Bấm để thu âm';
  }

  // Hop tin duoi the phat am: dang .rx-kq chung voi Phan xa (css/lesson.css muc 2.4).
  // cyan = tin cua Sensei / dang cho cham, rose = dang thu am, amber = loi (mat ket noi, mic).
  const MAU_TIN = { cyan: 'is-tin', rose: 'is-no', amber: 'is-no' };

  function veTinPhatAm(id, html, mau = 'cyan') {
    const box = document.getElementById('kq-' + id);
    if (!box) return;
    box.className = 'rx-kq slide-fade-enter ' + (MAU_TIN[mau] || MAU_TIN.cyan);
    box.innerHTML = html;
  }

  let dangMoMicPA = false;   // dang vao lop / cho quyen mic cho mot ban thu — bam them thi bo qua

  // Ban thu dang MO (dangThuAm chua dat) ma doi bai / doi chuong: tat mic dang
  // cho quyen -> startMic tra false, moMicPhatAm tu go hop "Đang vào lớp…".
  // Luc con cho vao lop thi moMicPhatAm tu thoi (the cau da mat khoi trang).
  function huyMoMicPA() {
    if (dangMoMicPA && !dangThuAm && !isRaisingHand && audioEngine.isMicActive) audioEngine.stopMic();
  }

  window.thuAmPhatAm = async (id) => {
    // Bam lan hai tren chinh cau dang thu = ket thuc, gui cho Sensei cham
    if (dangThuAm === id) return ketThucThuAm();
    // Bam them luc dang cho (hop xin quyen mic dang mo...) thi bo qua, khong
    // thi gui hai lan ngu canh va mo hai luong mic, luong dau khong tat duoc.
    if (dangMoMicPA) return;
    dangMoMicPA = true;
    try { await moMicPhatAm(id); } finally { dangMoMicPA = false; }
  };

  async function moMicPhatAm(id) {
    // Dang thu cau khac ma bam sang cau moi: bo ban thu do di
    if (dangThuAm) huyThuAm();

    const cau = timCauPhatAm(id);
    if (!cau) return;
    // The cau nay con dung cho cu: chua doi bai / doi chuong, hop ket qua con tren trang
    const lvl0 = slideEngine.currentLevel, bai0 = slideEngine.currentLesson, tab0 = slideEngine.activeTab;
    const conThe = () => slideEngine.currentLevel === lvl0 && slideEngine.currentLesson === bai0
      && slideEngine.activeTab === tab0 && !!document.getElementById('kq-' + id);

    // Tu ket noi neu chua vao lop — khong bat buoc phai bam "Bắt đầu giảng
    // bài" truoc, nut do chi de dieu khien viec GIANG, khong phai dieu kien
    // de duoc dung mic cham phat am.
    veTinPhatAm(id, '<i class="fa-solid fa-spinner fa-spin"></i><span>Đang vào lớp…</span>', 'cyan');
    try {
      await ensureConnected();
    } catch (err) {
      veTinPhatAm(id, '<i class="fa-solid fa-plug"></i><span>Không vào lớp được — kiểm tra API Key hoặc mạng.</span>', 'amber');
      return;
    }
    // Trong luc cho vao lop, hoc vien co the da bam sang cau khac roi
    if (dangThuAm) return;
    // ...hoac da doi bai / doi chuong: khong nap ngu canh, khong mo mic cho the da mat
    if (!conThe()) {
      const box = document.getElementById('kq-' + id);
      if (box) box.className = 'hidden';
      return;
    }

    // Dang giang bai thi dung lai da, khong de hai giong chong len nhau
    if (lectureState === 'PLAYING') pauseLecture(false);
    stopAllAudio();
    // KHONG mo lai tieng o day: ban thu vua huy (huyThuAm o tren) chua cham
    // xong — mo o ketThucThuAm, luc gui ban thu moi.

    // Nap ngu canh TRUOC, chua ket thuc luot -> Sensei im lang cho hoc vien doc
    geminiClient.sendContextNote(`[KIỂM TRA PHÁT ÂM — HỌC VIÊN SẮP ĐỌC TO MỘT CÂU]
Câu học viên phải đọc: ${cau.jp}
Nghĩa: ${cau.meaningVi}
Câu này lấy từ ${cau.tuBai === slideEngine.currentLesson ? 'chính bài đang học' : 'bài ' + cau.tuBai + ' đã học trước đó'}.

Nghe xong tiếng nó đọc thì CHẤM ngay, theo đúng thứ tự:
1. Phán một câu thật xấc về màn đọc vừa rồi. Đọc tốt thì hạ giọng "tớ/cậu" khen một câu ngắn; đọc sai be bét thì cứ chửi thẳng.
2. Chỉ ĐÍCH DANH chỗ sai: âm nào sai, trường âm (おばさん/おばあさん), âm ngắt っ, âm mũi ん, hay pitch accent lên xuống sai chỗ. Nói cụ thể, đừng chê chung chung.
3. Đọc mẫu lại CẢ CÂU thật chậm và chuẩn giọng Tokyo, rồi bảo nó đọc theo.
Trước khi phán gọi set_emotion: đọc tốt -> vui; sai -> de_biu; sai be bét / sai lại lỗi cũ -> that_vong.
Nếu nó đọc sai hẳn thì gọi tool mark_error(wrong_phrase, corrected_phrase, explanation).
Nói ngắn thôi, dưới 45 giây. Đừng đọc lại phần nghĩa tiếng Việt.`);

    mucAmThanhCaoNhat = 0;
    try {
      // Lan mo mic bi stopMic() huy giua chung: go bao "Đang vào lớp…", khong
      // mo luot "dang noi" (activityStart khong co mic la treo)
      if (!(await audioEngine.startMic())) {
        const box = document.getElementById('kq-' + id);
        if (box) box.className = 'hidden';
        return;
      }
      // Cho quyen mic xong thi the da mat (Sensei doi chuong / doi bai): tra mic lai
      if (!conThe()) {
        if (!isRaisingHand && audioEngine.isMicActive) audioEngine.stopMic();
        return;
      }
      geminiClient.sendActivityStart();   // thieu cai nay thi server bo qua het tieng gui len
      dangThuAm = id;
      veNutThuAm(id, true);
      veTinPhatAm(id, '<i class="fa-solid fa-circle text-rose-400 animate-pulse"></i><span>Đang nghe… đọc to cả câu, xong bấm nút vuông để gửi.</span>', 'rose');
      addLog('System', `🎤 Đang thu âm câu luyện phát âm: ${cau.jp}`);
    } catch (err) {
      veTinPhatAm(id, '<i class="fa-solid fa-triangle-exclamation"></i><span>Không mở được micro: ' + escapeHtml(err.message || '') + '</span>', 'amber');
    }
  }

  function ketThucThuAm() {
    const id = dangThuAm;
    if (!id) return;
    dangThuAm = null;

    if (audioEngine.isMicActive) audioEngine.stopMic();
    veNutThuAm(id, false);
    // Gui ban thu MOI (ca hai nhanh duoi) -> mo lai tieng / chu da chan cho
    // ban thu huy truoc do; luot nay la cua ban nay, phai nghe duoc loi cham.
    boQuaLuotHuy = false;
    audioEngine.setSuppressed(false);

    if (mucAmThanhCaoNhat <= NGUONG_AM_THANH_RO) {
      // Khong co tieng nao vuot nguong ro suot luot thu. Van phai dong moc
      // "dang noi" lai, khong thi server cu treo cho tiep den het phien.
      geminiClient.sendAudioStreamEnd();
      veTinPhatAm(id, '<i class="fa-solid fa-triangle-exclamation"></i><span>Không nghe rõ giọng nói — kiểm tra quyền micro hoặc nói to, gần micro hơn rồi thử lại.</span>', 'amber');
      return;
    }

    veTinPhatAm(id, '<i class="fa-solid fa-spinner fa-spin"></i><span>Sensei đang nghe lại và chuẩn bị phán…</span>');
    dangChoChamPhatAm = id; // onTurnComplete se dien loi cham that vao day khi xong

    // Danh dau la luot noi NGOAI bai giang, khong thi nhip giang tuong Sensei
    // vua giang xong mot muc va nhay sang muc sau
    senseiChenNgang = true;
    clearTimeout(chenNgangTimer);
    chenNgangTimer = setTimeout(ketThucChenNgang, 45000);

    // 80s+ khong thay cham xong: cung mot kieu treo da quan sat duoc o luot
    // gio tay hoi (luot dau tren 1 ket noi thi duoc, luot sau doi khi treo
    // vinh vien) — ngat phien (lan bam sau tu vao lop lai). Tu ghi bao loi
    // TRUOC khi ngat: socket da chet san thi onClose khong bao gio chay.
    clearTimeout(choChamPhatAmTimer);
    choChamPhatAmTimer = setTimeout(() => {
      if (dangChoChamPhatAm === id) {
        dangChoChamPhatAm = null;
        veTinPhatAm(id, '<i class="fa-solid fa-triangle-exclamation"></i><span>Sensei chấm lâu quá không xong — bấm lại để thử lần nữa nhé.</span>', 'amber');
        ngatPhienChuDong();
      }
    }, 80000);

    geminiClient.sendAudioStreamEnd();
  }


  /* ----------------------------------------------------------------------
     LUYEN VIET TAY

     Hoc vien co 10 giay viet lai chu bang tay tren khung canvas, het gio tu
     nop. Sensei NHIN ANH de cham (model co thi giac), vi kho net chu KanjiVG
     trong may chi co 78 chu Han va khong co kana nao — khong the doi chieu
     net cho da so truong hop.
     ---------------------------------------------------------------------- */
  const vietTay = {};   // id -> { ctx, dangVe, demTimer, conLai, daNop }

  /** Bo het cac luot viet tay dang do (dong ho + trang thai) — khung da bi ve lai. */
  function huyVietTay() {
    Object.keys(vietTay).forEach(k => { clearInterval(vietTay[k].demTimer); delete vietTay[k]; });
  }

  function timChuVietTay(id) {
    return (slideEngine.handwritingSet || []).find(c => c.id === id) || null;
  }

  function veKhungGiay(ctx, w, h) {
    ctx.fillStyle = '#fffdf7';
    ctx.fillRect(0, 0, w, h);
    // Duong ke mo kieu giay tap viet: chia doi ngang doc
    ctx.save();
    ctx.strokeStyle = '#d9cfbb';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.restore();
  }

  function veLaiTrang(id) {
    const cv = document.getElementById('vtkhung-' + id);
    if (!cv) return null;
    const ctx = cv.getContext('2d');
    veKhungGiay(ctx, cv.width, cv.height);
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1f1d19';
    return ctx;
  }

  window.xoaNetViet = (id) => {
    veLaiTrang(id);
    const t = vietTay[id];
    if (t) t.coNet = false;
  };

  function ganTayVe(id) {
    const cv = document.getElementById('vtkhung-' + id);
    if (!cv || cv.__daGanTay) return;
    cv.__daGanTay = true;

    const toaDo = (e) => {
      const r = cv.getBoundingClientRect();
      return [(e.clientX - r.left) * (cv.width / r.width),
              (e.clientY - r.top) * (cv.height / r.height)];
    };
    cv.addEventListener('pointerdown', (e) => {
      const t = vietTay[id];
      if (!t || !t.dangChay) return;   // chua bam "Bat dau" thi khong viet duoc
      cv.setPointerCapture(e.pointerId);
      t.dangVe = true; t.coNet = true;
      const xy = toaDo(e);
      t.ctx.beginPath(); t.ctx.moveTo(xy[0], xy[1]);
    });
    cv.addEventListener('pointermove', (e) => {
      const t = vietTay[id];
      if (!t || !t.dangVe) return;
      const xy = toaDo(e);
      t.ctx.lineTo(xy[0], xy[1]); t.ctx.stroke();
    });
    const nhacTay = () => { const t = vietTay[id]; if (t) t.dangVe = false; };
    cv.addEventListener('pointerup', nhacTay);
    cv.addEventListener('pointercancel', nhacTay);
    cv.addEventListener('pointerleave', nhacTay);
  }

  window.batDauVietTay = (id) => {
    const ctx = veLaiTrang(id);
    if (!ctx) return;
    if (vietTay[id]) clearInterval(vietTay[id].demTimer);
    vietTay[id] = { ctx, dangChay: true, dangVe: false, coNet: false, conLai: 10, daNop: false };
    ganTayVe(id);

    const nhan = document.getElementById('vtdem-' + id);
    const nut = document.getElementById('vtbd-' + id);
    if (nut) nut.innerHTML = '<i class="fa-solid fa-pen"></i>Đang viết…';
    const veDem = () => {
      if (!nhan || !vietTay[id]) return;
      nhan.innerText = vietTay[id].conLai + 's';
      // Dong ho chu muc khi dang dem, con 3 giay thi dat nung (.qz-timer trong css/lesson.css)
      nhan.className = 'qz-timer font-mono text-sm ' + (vietTay[id].conLai <= 3 ? 'is-gap' : 'is-chay');
    };
    veDem();
    vietTay[id].demTimer = setInterval(() => {
      const t = vietTay[id];
      if (!t) return;
      t.conLai--;
      veDem();
      if (t.conLai <= 0) {
        clearInterval(t.demTimer);
        // het gio thi tu nop; loi o day khong duoc leo len thanh bang "loi khoi dong"
        window.nopChuViet(id).catch(e => console.warn('[viet tay]', e));
      }
    }, 1000);
  };

  function veKetQuaViet(id, mau, html) {
    const box = document.getElementById('vtkq-' + id);
    if (!box) return;
    // Dang .rx-kq chung voi Phan xa: dung = is-ok, sai / chua viet = is-no, dang cham = is-tin
    const bang = { sage: 'is-ok', amber: 'is-no', cyan: 'is-tin' };
    box.className = 'rx-kq ' + (bang[mau] || bang.cyan);
    box.innerHTML = html;
  }

  window.nopChuViet = async (id) => {
    const t = vietTay[id];
    const cau = timChuVietTay(id);
    if (!cau) return;
    if (!t || t.daNop) return;
    // Chi cham DUNG khung da bat dau viet; khung do da bi ve lai / roi chuong
    // thi bo luot nay (khong gui khung trong moi, khong vo vi khung da mat).
    const cv = t.ctx && t.ctx.canvas;
    if (!cv || !cv.isConnected) { clearInterval(t.demTimer); delete vietTay[id]; return; }
    t.daNop = true;
    t.dangChay = false;
    clearInterval(t.demTimer);

    const nhan = document.getElementById('vtdem-' + id);
    if (nhan) {
      nhan.innerText = 'hết giờ';
      nhan.className = 'qz-timer font-mono text-sm';
    }
    const nut = document.getElementById('vtbd-' + id);
    if (nut) nut.innerHTML = '<i class="fa-solid fa-rotate-left"></i>Viết lại';

    if (!t.coNet) {
      veKetQuaViet(id, 'amber', 'Chưa viết nét nào — bấm "Viết lại" rồi thử nhé.');
      return;
    }

    veKetQuaViet(id, 'cyan', '<i class="fa-solid fa-spinner fa-spin"></i> Sensei đang nhìn nét chữ…');
    const anh = cv.toDataURL('image/png').split(',')[1];
    const kq = await chamChuVietBangAI(anh, cau);
    if (kq.ok) {
      matMeoNhanXet(!!kq.dung);   // meo Sensei: dung -> vui, sai -> de_biu / that_vong
      const dau = kq.dung ? '<i class="fa-solid fa-check"></i> ' : '<i class="fa-solid fa-xmark"></i> ';
      const loi = escapeHtml(kq.phan || (kq.dung ? 'Đúng rồi.' : 'Chưa đúng.'));
      veKetQuaViet(id, kq.dung ? 'sage' : 'amber',
        dau + loi + ' <span class="opacity-70">(đáp án: ' + escapeHtml(cau.dapAn) + ')</span>');
    } else {
      veKetQuaViet(id, 'amber', 'Chưa chấm được lúc này — đáp án là ' + escapeHtml(cau.dapAn) + '.');
    }
  };

  window.doiChuVietTay = () => {
    huyVietTay();
    slideEngine.handwritingRound = (slideEngine.handwritingRound || 0) + 1;
    slideEngine.setTab('quiz');
  };

  /** Gui anh net chu cho model co thi giac cham. */
  async function chamChuVietBangAI(anhBase64, cau) {
    const moTa = cau.kieu === 'khuyet'
      ? 'Cau hoi khoet tu: "' + cau.cauHoi + '". Tu dung de dien vao cho trong la "' + cau.dapAn + '".'
      : 'Hoc vien phai viet tu co nghia "' + cau.nghia + '", doc la "' + (cau.doc || cau.kana) + '".';

    const prompt = [
      'Anh dinh kem la chu VIET TAY cua mot hoc vien tieng Nhat, viet tren khung giay co duong ke mo.',
      'Bo qua cac duong ke dut net mo nhat — do la duong dan giay, khong phai net chu.',
      moTa,
      'Dap an dung la: "' + cau.dapAn + '".',
      '',
      'Cham nhu mot ong thay kho tinh nhung cong bang:',
      '- Net xieu veo, ty le xau nhung VAN DOC RA dung chu thi van tinh la DUNG.',
      '- Viet ra chu khac, thieu net lam sai chu, hoac khong doc duoc thi la SAI.',
      'Tra ve JSON: {"dung": true/false, "docDuoc": "ky tu doc duoc tu anh", "phan": "mot cau nhan xet ngan bang tieng Viet, xung tao-may, hoi ca khia nhung phai chi ra cho sai neu sai"}',
    ].join('\n');

    for (const key of allKeys()) {
      for (const model of (SENSEI_MODELS.quizModels || [SENSEI_MODELS.quiz])) {
        // Moi cap mot han 30s (tinh ca luc doc than) — treo thi sang cap sau, khong quay mai
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 30000);
        try {
          const res = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/' + model + ':generateContent?key=' + key,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: ctrl.signal,
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: 'image/png', data: anhBase64 } }] }],
                generationConfig: { temperature: 0.6, maxOutputTokens: 400, responseMimeType: 'application/json' },
              }),
            }
          );
          if (!res.ok) continue;   // het han muc / model tu choi -> thu cap tiep theo
          const data = await res.json();
          const txt = data && data.candidates && data.candidates[0]
            && data.candidates[0].content && data.candidates[0].content.parts
            && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
          if (!txt) continue;
          const o = JSON.parse(stripFence(txt));
          return { ok: true, dung: !!o.dung, phan: String(o.phan || '').trim(), docDuoc: o.docDuoc };
        } catch (e) { /* thu cap ke tiep */ }
        finally { clearTimeout(timer); }
      }
    }
    return { ok: false };
  }


  /* ----------------------------------------------------------------------
     CHUONG PHAN XA

     Hai bai tap cap toc, deu do CHINH PHIEN LIVE cua Sensei (gemini-3.8-live)
     cham — khong dung model REST nao khac:
       - 'viet': hien de, 7 giay viet tay, het gio tu chup khung gui ANH vao
                 phien live (clientContent + inlineData)
       - 'noi' : hien nghia tieng Viet, 7 giay noi tu tieng Nhat, tieng di qua
                 realtimeInput (activityStart -> audio -> activityEnd)
     Loi phan cua Sensei phat ra bang giong noi; ban ghi loi do (onTranscript)
     duoc bat lai o onTurnComplete de cham diem va hien len man hinh.
     ---------------------------------------------------------------------- */
  const PX_SO_CAU = 6;
  const PX_GIAY = 7;

  const phanXa = {
    che: 'viet',        // 'viet' | 'noi'
    dsCau: [],
    viTri: 0,
    diem: 0,
    dangChay: false,
    dangCho: false,     // dang doi Sensei phan
    ctx: null,
    coNet: false,
    dangVe: false,
    demTimer: null,
    conLai: 0,
    luot: 0,            // tang moi khi bat dau / dung vong: hen gio cu thay lech thi thoi
  };

  function dungPhanXaKhiRoiTab() {
    pxHuyCho();
    phanXa.luot++;
    if (!phanXa.dangChay && !phanXa.demTimer) return;
    pxDungDongHo();
    if (phanXa.che === 'noi' && audioEngine && audioEngine.isMicActive) {
      audioEngine.stopMic();
      // Bo giua chung: van dong moc "dang noi" nhung chan tieng luot tra loi
      // do, khong de Sensei cham to cau bo do o chuong khac.
      if (geminiClient.isConnected) { boQuaLuotHuy = true; audioEngine.setSuppressed(true); }
      geminiClient.sendAudioStreamEnd();   // dong moc "dang noi" lai
    }
    phanXa.dangChay = false;
    phanXa.dangCho = false;
    pxChoPhan = false;
  }

  function pxThan() { return document.getElementById('pxThan'); }

  function pxCauHienTai() { return phanXa.dsCau[phanXa.viTri] || null; }

  function pxDungDongHo() {
    clearInterval(phanXa.demTimer);
    phanXa.demTimer = null;
  }

  window.doiCheDoPhanXa = (che) => {
    // Dung chung cach don cua luc roi tab: dong mic + activityEnd (chi khi dang
    // noi nhanh, khong dung mic cua Gio tay hoi), bo cho phan, doi luot.
    dungPhanXaKhiRoiTab();
    phanXa.che = che;
    veManPhanXa();
  };

  /** Ve lai toan bo than chuong theo trang thai hien tai. */
  window.veManPhanXa = () => {
    const than = pxThan();
    if (!than) return;

    // Hai nut che do nam trong .deck-seg (css/lesson.css): chi doi .is-active
    [['pxCheViet', 'viet'], ['pxCheNoi', 'noi']].forEach(([id, che]) => {
      const nut = document.getElementById(id);
      if (!nut) return;
      nut.classList.toggle('is-active', phanXa.che === che);
      nut.setAttribute('aria-pressed', phanXa.che === che ? 'true' : 'false');
    });

    if (!phanXa.dangChay) { than.innerHTML = pxManChuanBi(); return; }
    if (phanXa.viTri >= phanXa.dsCau.length) { than.innerHTML = pxManKetThuc(); return; }
    than.innerHTML = pxManCauHoi();
    if (phanXa.che === 'viet') pxChuanBiKhungVe();
  };

  function pxManChuanBi() {
    const moTa = phanXa.che === 'viet'
      ? `Đề hiện ra, mày có <b>${PX_GIAY} giây</b> viết lại chữ bằng tay. Hết giờ tự nộp, Sensei nhìn nét chữ rồi phán.`
      : `Hiện nghĩa tiếng Việt, mày có <b>${PX_GIAY} giây</b> nói to từ tiếng Nhật. Hết giờ tự gửi, Sensei nghe rồi phán.`;
    // Nhan nut de tran (khong boc <span>): man hep an <span> trong .ctl
    return `
      <div class="deck-card rx-panel rx-giua">
        <p class="rx-mo-ta">${moTa}</p>
        <p class="rx-phu">${PX_SO_CAU} câu liên tiếp · lấy từ bài đang học và các bài đã học</p>
        <button type="button" onclick="window.batDauPhanXa && window.batDauPhanXa()"
                class="ctl ctl-connect w-full justify-center rx-cta">
          <i class="fa-solid fa-bolt"></i>Vào luyện
        </button>
      </div>`;
  }

  function pxManKetThuc() {
    const d = phanXa.diem, t = phanXa.dsCau.length;
    const loi = d === t ? 'Sạch bài. Được đấy.' : (d >= t / 2 ? 'Tạm được, còn phải luyện.' : 'Yếu. Làm lại đi.');
    return `
      <div class="deck-card rx-panel rx-giua">
        <div class="rx-diem font-mono">${d}/${t}</div>
        <p class="rx-phu">${loi}</p>
        <button type="button" onclick="window.batDauPhanXa && window.batDauPhanXa()"
                class="ctl ctl-connect w-full justify-center rx-cta">
          <i class="fa-solid fa-rotate"></i>Luyện vòng khác
        </button>
      </div>`;
  }

  function pxManCauHoi() {
    const c = pxCauHienTai();
    if (!c) return '';
    // Tien do la chu thuong mau nhat; dong ho to, mau muc (lop .rx-dem, xem pxVaoCau)
    const tien = `<div class="rx-tien">
        <span class="rx-tien-so">${phanXa.viTri + 1}/${phanXa.dsCau.length} · ${phanXa.diem} đúng</span>
        <span id="pxDem" class="rx-dem font-mono">${PX_GIAY}s</span>
      </div>`;

    if (phanXa.che === 'viet') {
      const goiY = (c.kana && c.kana !== c.dapAn) ? escapeHtml(c.kana) : '';
      const de = c.kieu === 'khuyet'
        ? `<div class="rx-de" lang="ja">${escapeHtml(c.cauHoi)}</div>`
        : `<div class="rx-hoi">Viết lại chữ của từ này</div>`;
      return `
        <div class="deck-card rx-panel">
          ${tien}
          ${de}
          <div class="rx-goiy">${goiY ? '<span lang="ja">' + goiY + '</span> · ' : ''}${escapeHtml(c.nghia)}</div>
          <canvas id="pxKhung" width="320" height="320"
                  class="rx-khung w-full aspect-square cursor-crosshair mx-auto block"
                  style="touch-action:none;background:#fffdf7"></canvas>
          <button type="button" onclick="window.nopPhanXa && window.nopPhanXa()"
                  class="ctl ctl-ghost w-full justify-center rx-nop">
            <i class="fa-solid fa-paper-plane"></i>Nộp sớm
          </button>
          <div id="pxKq" class="hidden"></div>
        </div>`;
    }

    return `
      <div class="deck-card rx-panel">
        ${tien}
        <div class="rx-noi">
          <div class="rx-phu">Nói to bằng tiếng Nhật</div>
          <div class="rx-nghia">${escapeHtml(c.nghia)}</div>
        </div>
        <div id="pxSong" class="rx-song">
          <div id="pxSongTrong" class="rx-song-trong" style="width:0%"></div>
        </div>
        <button type="button" onclick="window.nopPhanXa && window.nopPhanXa()"
                class="ctl ctl-ghost w-full justify-center rx-nop">
          <i class="fa-solid fa-paper-plane"></i>Nói xong rồi
        </button>
        <div id="pxKq" class="hidden"></div>
      </div>`;
  }

  function pxChuanBiKhungVe() {
    const cv = document.getElementById('pxKhung');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    veKhungGiay(ctx, cv.width, cv.height);
    ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1f1d19';
    phanXa.ctx = ctx; phanXa.coNet = false; phanXa.dangVe = false;

    const toaDo = (e) => {
      const r = cv.getBoundingClientRect();
      return [(e.clientX - r.left) * (cv.width / r.width), (e.clientY - r.top) * (cv.height / r.height)];
    };
    cv.addEventListener('pointerdown', (e) => {
      if (!phanXa.dangChay || phanXa.dangCho) return;
      cv.setPointerCapture(e.pointerId);
      phanXa.dangVe = true; phanXa.coNet = true;
      const xy = toaDo(e); ctx.beginPath(); ctx.moveTo(xy[0], xy[1]);
    });
    cv.addEventListener('pointermove', (e) => {
      if (!phanXa.dangVe) return;
      const xy = toaDo(e); ctx.lineTo(xy[0], xy[1]); ctx.stroke();
    });
    const nhac = () => { phanXa.dangVe = false; };
    cv.addEventListener('pointerup', nhac);
    cv.addEventListener('pointercancel', nhac);
    cv.addEventListener('pointerleave', nhac);
  }

  let pxDangMo = false;   // dang cho vao lop / nap bai cho vong moi — bam lan hai thi bo qua

  window.batDauPhanXa = async () => {
    if (pxDangMo || phanXa.dangChay) return;
    pxDangMo = true;
    try {
      try {
        await ensureConnected();
      } catch (err) {
        // 'quota' / 'missing-key' da co bao rieng (onClose / ensureConnected)
        if (!err || (err.message !== 'quota' && err.message !== 'missing-key')) {
          showToast('Chưa vào được lớp — kiểm tra mạng rồi thử lại.', 'info', 6000);
        }
        return;
      }
      const lvl = slideEngine.currentLevel, no = slideEngine.currentLesson;
      // Phan on bai lay tu cac bai lien truoc — muc luc nhe chua co chi tiet nen
      // nap them (co gioi han) truoc khi boc de. Mang cham thi khong doi qua 4s.
      await Promise.all([
        curriculumLoader.ensureLessonLoaded(lvl, no),
        Promise.race([curriculumLoader.ensureReviewLoaded ? curriculumLoader.ensureReviewLoaded(lvl, no) : null, nghi(4000)]),
      ]);
      // Trong luc cho, hoc vien da roi chuong / doi bai thi thoi — khong mo mic o cho khac
      if (slideEngine.currentLevel !== lvl || slideEngine.currentLesson !== no || slideEngine.activeTab !== 'reflex') return;
      const kho = curriculumLoader.getHandwritingSet(lvl, no, phanXa.vong || 0, PX_SO_CAU);
      if (!kho.length) { showToast('Bài này chưa có từ nào hợp để luyện phản xạ.', 'info'); return; }
      phanXa.vong = (phanXa.vong || 0) + 1;
      phanXa.dsCau = kho;
      phanXa.viTri = 0;
      phanXa.diem = 0;
      phanXa.luot++;
      phanXa.dangChay = true;
      phanXa.dangCho = false;
      veManPhanXa();
      pxVaoCau();
    } finally {
      pxDangMo = false;
    }
  };

  /** Bat dau dem gio cho cau dang hien. */
  async function pxVaoCau() {
    if (!phanXa.dangChay) return;   // vong da dung (roi tab / doi che do) thi khong mo mic nua
    const c = pxCauHienTai();
    if (!c) { veManPhanXa(); return; }
    const luot = phanXa.luot;
    phanXa.conLai = PX_GIAY;
    phanXa.dangCho = false;

    if (phanXa.che === 'noi') {
      // Nap ngu canh TRUOC (chua ket thuc luot) roi moi mo mic, giong luong
      // gio tay hoi — nho vay Sensei biet dang cham cai gi.
      geminiClient.sendContextNote(
        '[PHAN XA — NOI NHANH] Tao dang cho hoc vien ' + PX_GIAY + ' giay de noi TU TIENG NHAT co nghia "' + c.nghia + '". '
        + 'Dap an dung la "' + c.dapAn + '" (doc: ' + (c.kana || c.doc) + '). '
        + 'Nghe xong tieng no noi thi cham NGAY: mo dau bang dung mot tu DUNG hoac SAI, roi mot cau ngan kieu mày-tao. Khong giang dai.'
      );
      try {
        mucAmThanhCaoNhat = 0;
        const micDaMoSan = audioEngine.isMicActive;
        const moDuoc = await audioEngine.startMic();
        // Trong luc cho mo mic, vong da dung / da nop / da sang cau khac: tat
        // mic cua minh di, khong mo luot "dang noi" nao nua.
        if (!phanXa.dangChay || luot !== phanXa.luot || phanXa.dangCho || pxCauHienTai() !== c) {
          if (!micDaMoSan && audioEngine.isMicActive) audioEngine.stopMic();
          return;
        }
        // Mic bi stopMic() cho khac huy giua chung: khong mo luot "dang noi"
        if (!moDuoc) {
          veKetQuaPhanXa('amber', 'Micro bị tắt giữa chừng — thử lại nhé.');
          return;
        }
        geminiClient.sendActivityStart();
      } catch (err) {
        veKetQuaPhanXa('amber', 'Không mở được micro: ' + (err.message || ''));
        return;
      }
    }

    const nhan = () => {
      const el = document.getElementById('pxDem');
      if (!el) return;
      el.innerText = phanXa.conLai + 's';
      el.className = 'rx-dem font-mono' + (phanXa.conLai <= 2 ? ' is-gap' : '');
      const song = document.getElementById('pxSongTrong');
      if (song) song.style.width = Math.round((1 - phanXa.conLai / PX_GIAY) * 100) + '%';
    };
    nhan();
    pxDungDongHo();
    phanXa.demTimer = setInterval(() => {
      phanXa.conLai--;
      nhan();
      if (phanXa.conLai <= 0) { pxDungDongHo(); window.nopPhanXa(); }
    }, 1000);
  }

  window.nopPhanXa = async () => {
    if (!phanXa.dangChay || phanXa.dangCho) return;
    const c = pxCauHienTai();
    if (!c) return;
    pxDungDongHo();
    phanXa.dangCho = true;

    if (phanXa.che === 'viet') {
      const cv = document.getElementById('pxKhung');
      if (!cv || !phanXa.coNet) { pxChotCau(false, 'Không viết gì cả.'); return; }
      veKetQuaPhanXa('cyan', '<i class="fa-solid fa-spinner fa-spin"></i> Sensei đang nhìn…');
      const anh = cv.toDataURL('image/png').split(',')[1];
      const loiNhac = '[PHAN XA — VIET NHANH] Anh dinh kem la chu VIET TAY cua hoc vien (bo qua cac duong ke dut net mo). '
        + 'Dap an dung la "' + c.dapAn + '". Net xau nhung doc ra dung chu thi van tinh DUNG. '
        + 'Cham ngay: mo dau bang dung mot tu DUNG hoac SAI, roi mot cau ngan kieu mày-tao. Khong giang dai.';
      // Lop dang tam dung thi cong tieng dang chan — mo ra ngay truoc luot can
      // nghe, khong thi chi thay chu ma khong nghe Sensei phan.
      boQuaLuotHuy = false;
      audioEngine.setSuppressed(false);
      // false ma van con ket noi = dang xep hang cho bat tay xong, se tu gui
      if (!geminiClient.sendImageTurn(loiNhac, anh) && !geminiClient.isConnected) {
        pxChotCau(false, 'Mất kết nối — chưa gửi được bài.');
        return;
      }
      pxBatDauCho(60000);
    } else {
      if (audioEngine.isMicActive) audioEngine.stopMic();
      boQuaLuotHuy = false;
      audioEngine.setSuppressed(false);
      geminiClient.sendAudioStreamEnd();     // = activityEnd
      if (mucAmThanhCaoNhat <= NGUONG_AM_THANH_RO) { pxChotCau(false, 'Không nghe thấy tiếng nào.'); return; }
      if (!geminiClient.isConnected) { pxChotCau(false, 'Mất kết nối — chưa gửi được câu trả lời.'); return; }
      veKetQuaPhanXa('cyan', '<i class="fa-solid fa-spinner fa-spin"></i> Sensei đang nghe lại…');
      pxBatDauCho(90000);   // luot mic von cham hon luot chu nhieu
    }
  };

  let pxChoPhan = false;   // dang doi loi phan cua Sensei cho cau phan xa
  let pxChoTimer = null;   // luoi an toan: Sensei khong phan thi khong treo mai
  // Vua huy ban thu phat am: activityEnd da dong luot nen Sensei van tra loi
  // ban thu do -> chan tieng den het luot, khong cham to ban hoc vien da bo.
  let boQuaLuotHuy = false;
  let pxDaDoiMat = false;  // loi phan cua cau dang cho da doi mat meo Sensei chua

  // Bao meo Sensei "dang ban" (khong liem tay / ngu gat / ngu; dang ngu thi day): dang giang, gio tay / thu am,
  // cho Sensei tra loi (mic 20-90 s), cham phat am, luyen phan xa. Mic khong phai hoat dong chuot / phim nen
  // meo khong tu biet. Doi moi giay + moi lan doi lectureState (updateLectureControlsUI); chi goi khi doi.
  function baoMeoBan() {
    const av = window.SenseiAvatar;
    if (!av || !av.trangThai) return;   // hub chua nap: lan sau thu lai
    const ban = lectureState === 'PLAYING' || isRaisingHand || !!dangThuAm || dangMoMicPA || !!dangChoChamPhatAm
      || dangChoTraLoi || senseiChenNgang || phanXa.dangChay || pxChoPhan || !!(audioEngine && audioEngine.isMicActive);
    if (ban === giangDaBaoMeo) return;
    giangDaBaoMeo = ban;
    av.trangThai({ giang: ban });
  }
  henBaoMeo = setInterval(baoMeoBan, 1000);
  baoMeoBan();

  function pxHuyCho() {
    pxChoPhan = false;
    clearTimeout(pxChoTimer);
    pxChoTimer = null;
  }

  /** Loi phan dang ve (transcript): tu dau DUNG / SAI da tron thi doi mat meo ngay, khong doi het luot */
  function pxMatSom(chu) {
    if (!pxChoPhan || pxDaDoiMat) return;
    const m = String(chu || '').normalize('NFC').toUpperCase()
      .match(/^[^\p{L}\p{N}]*([\p{L}\p{M}\p{N}]+)[^\p{L}\p{M}\p{N}]/u);
    if (!m) return;   // tu dau chua ve tron
    pxDaDoiMat = true;
    matMeoNhanXet(m[1] === 'ĐÚNG' || m[1] === 'DUNG', undefined, true);
  }

  /** Bat dau doi loi phan; qua han ma chua co thi tinh la bo qua cau nay. */
  function pxBatDauCho(ms) {
    pxHuyCho();
    pxChoPhan = true;
    pxDaDoiMat = false;
    const luot = phanXa.luot, vt = phanXa.viTri;
    pxChoTimer = setTimeout(() => {
      if (!pxChoPhan || luot !== phanXa.luot || vt !== phanXa.viTri) return;
      pxHuyCho();
      pxChotCau(false, 'Sensei chưa phán kịp — tính là bỏ qua.');
    }, ms);
  }

  /** Goi tu onClose: mat ket noi giua vong thi dung ca vong, khong treo spinner. */
  function pxKhiMatKetNoi() {
    if (!phanXa.dangChay) { pxHuyCho(); return; }
    const dangCho = pxChoPhan;
    dungPhanXaKhiRoiTab();
    veKetQuaPhanXa('amber', 'Mất kết nối' + (dangCho ? ' trước khi Sensei phán xong' : '') + ' — bấm lại để luyện tiếp.');
    setTimeout(() => { if (!phanXa.dangChay) veManPhanXa(); }, 2500);
  }

  /** Goi tu onTurnComplete khi Sensei phan xong mot cau phan xa. */
  function pxNhanLoiPhan(loiSensei) {
    // onTurnComplete goi ham nay o MOI luot: het luot cua ban thu vua huy thi mo tieng lai
    if (boQuaLuotHuy) { boQuaLuotHuy = false; audioEngine.setSuppressed(false); }
    if (!pxChoPhan) return false;
    pxHuyCho();
    const txt = String(loiSensei || '').trim();
    // Da dan Sensei mo dau bang DUNG hoac SAI — chi xet tu dau tien. \b cua JS
    // chi hieu ASCII nen /\bĐÚNG/ khong bao gio khop: so ca tu, giu nguyen dau
    // (bo dau thi "Dũng", "Dùng", "Đụng" cung thanh DUNG).
    const m = txt.normalize('NFC').toUpperCase().match(/^[^\p{L}\p{N}]*([\p{L}\p{M}\p{N}]+)/u);
    const tuDau = m ? m[1] : '';
    const dung = tuDau === 'ĐÚNG' || tuDau === 'DUNG';
    if (!pxDaDoiMat) { pxDaDoiMat = true; matMeoNhanXet(dung, undefined, true); }   // transcript khong ve kip
    pxChotCau(dung, txt || (dung ? 'Đúng.' : 'Sai.'));
    return true;
  }

  function pxChotCau(dung, loi) {
    // KHONG tra dangCho ve false o day: con giu den khi sang cau sau (pxVaoCau
    // tu tra), khong thi bam "Nộp sớm" lan nua luc dang hien loi phan se nhay
    // cau / cong diem hai lan.
    if (!phanXa.dangChay) return;
    if (dung) phanXa.diem++;
    veKetQuaPhanXa(dung ? 'sage' : 'amber',
      (dung ? '<i class="fa-solid fa-check"></i> ' : '<i class="fa-solid fa-xmark"></i> ')
      + escapeHtml(loi) + ' <span class="opacity-70">(đáp án: ' + escapeHtml((pxCauHienTai() || {}).dapAn || '') + ')</span>');
    const luot = phanXa.luot, batDau = Date.now();
    const tiepTuc = () => {
      if (!phanXa.dangChay || luot !== phanXa.luot) return;   // da roi tab / doi che do / vong moi
      // Sensei con doc loi phan thi doi doc xong (toi da 15s) moi sang cau,
      // khong thi dem gio va mic cua cau sau chong len tieng Sensei.
      if (audioEngine.isPlaybackActive() && Date.now() - batDau < 15000) { setTimeout(tiepTuc, 250); return; }
      setTimeout(() => {
        if (!phanXa.dangChay || luot !== phanXa.luot) return;
        phanXa.viTri++;
        if (phanXa.viTri >= phanXa.dsCau.length) {
          // Ve thang man ket thuc: veManPhanXa thay dangChay=false se ve man chuan bi
          phanXa.dangChay = false;
          const than = pxThan();
          if (than) than.innerHTML = pxManKetThuc();
          return;
        }
        veManPhanXa();
        pxVaoCau();
      }, 300);   // de tieng vang qua loa tat han roi moi mo mic
    };
    setTimeout(tiepTuc, 2600);
  }

  function veKetQuaPhanXa(mau, html) {
    const box = document.getElementById('pxKq');
    if (!box) return;
    // sage = dung, amber = sai / loi, cyan = dang cho Sensei (mau o css/lesson.css)
    const bang = { sage: 'is-ok', amber: 'is-no', cyan: 'is-cho' };
    box.className = 'rx-kq ' + (bang[mau] || bang.cyan);
    box.innerHTML = html;
    // Loi phan nam cuoi the: man thap thi cuon VUNG CUON cua chuong toi do (khong
    // dung scrollIntoView — no xo lech ca .deck-canvas), truoc khi tu sang cau sau
    const vung = box.closest('.deck-scroll');
    if (vung) {
      const r = box.getBoundingClientRect(), v = vung.getBoundingClientRect();
      if (r.bottom > v.bottom - 8) vung.scrollTo({ top: vung.scrollTop + (r.bottom - v.bottom) + 16, behavior: 'smooth' });
    }
  }

  function huyThuAm() {
    const id = dangThuAm;
    dangThuAm = null;
    if (!id) return;
    if (audioEngine.isMicActive) audioEngine.stopMic();
    // activityEnd dong luot nen Sensei van se cham ban thu nay: chan tieng den
    // het luot do (pxNhanLoiPhan mo lai o turnComplete ke tiep).
    if (geminiClient.isConnected) { boQuaLuotHuy = true; audioEngine.setSuppressed(true); }
    geminiClient.sendAudioStreamEnd();   // dong moc "dang noi" du la huy
    veNutThuAm(id, false);
    const box = document.getElementById('kq-' + id);
    if (box) box.className = 'hidden';
  }

  window.doiCauPhatAm = () => {
    if (dangThuAm) huyThuAm();
    huyMoMicPA();
    slideEngine.pronunciationRound = (slideEngine.pronunciationRound || 0) + 1;
    slideEngine.setTab('quiz');
  };

  // Nut "Doi de khac" tren dau chuong Bai tap
  window.regenerateQuiz = () => {
    const lvl = slideEngine.currentLevel, no = slideEngine.currentLesson;
    // Khong xoa cache: verbose da bo qua nhanh "co san", con giu cache thi soan
    // hong van con de cu, lan mo chuong sau khong tu dot them mot luot soan.
    prefetchGeneratedQuiz(lvl, no, true);
  };

  /**
   * Phát một lượt thoại bằng giọng của nhân vật.
   * Ưu tiên bản đã dựng bằng API; không có thì lùi về giọng trình duyệt
   * phân theo giới tính — kém hơn nhưng vẫn ra hai chất giọng khác nhau,
   * còn hơn để Sensei đọc hết bằng một giọng.
   */
  async function playDialogueLine(line) {
    dangPhatGiongNhanVat = true;
    try {
      // Chi phat ban audio da dung DUNG giong hien hanh cua nhan vat nay
      const clip = audioDongConDung(line) ? dialogueAudio[line.id] : null;
      if (clip && audioEngine.playPcmClip) {
        try {
          const p = audioEngine.playPcmClip(clip);   // bat dau dong bo (src.start()) ngay trong lenh nay
          // San khau: karaoke chinh xac theo PCM cua clip, moc t0 = luc clip bat dau (dong ho AudioContext)
          const sk = SK();
          if (sk && audioEngine.clipPlaying) {
            const ctx = audioEngine.outCtx;
            const s = clip instanceof Uint8Array ? '' : String(clip);
            const n = clip instanceof Uint8Array ? clip.length
              : Math.floor(s.length * 3 / 4) - (s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0);
            sk.khiClip(line.id, { t0: ctx ? ctx.currentTime : 0, dur: Math.floor(n / 2) / 24000, pcm: clip });
          }
          await p;
          return true;
        } catch (e) {}
      }
      return await playLineWithBrowserVoice(line);
    } finally {
      // Cho tieng vang qua loa tat han truoc khi mo lai mic, khong ngat qua som
      await new Promise(r => setTimeout(r, 200));
      dangPhatGiongNhanVat = false;
    }
  }

  function playLineWithBrowserVoice(line, opts = {}) {
    return new Promise((resolve) => {
      // opts.text: chi doc mot tu trong cau (bam tu o tab Hoi thoai); opts.khongSanKhau: khong bao san khau giang
      const jp = opts.text != null ? String(opts.text) : (line.tokens || []).map(t => t.kanji || t.text).join('');
      const sk = () => (opts.khongSanKhau ? null : SK());
      if (!jp.trim() || !window.speechSynthesis || !window.SenseiVoices) return resolve(false);

      try {
        audioEngine.stopPlayback();
        speechSynthesis.cancel();
        if (speechSynthesis.paused) speechSynthesis.resume();

        // Cao do theo vi tri nhan vat trong bang curriculum/nhan-vat.json: moi nhan vat mot cao do rieng
        const pick = SenseiVoices.browserVoice(line.speaker, line.speakerGender);
        const u = new SpeechSynthesisUtterance(jp);
        u.lang = 'ja-JP';
        u.rate = pick.rate;
        u.pitch = pick.pitch;
        if (pick.voice) u.voice = pick.voice;

        let done = false;
        const finish = (ok) => {
          if (done) return;
          done = true;
          sk()?.khiGiongMay(line.id, 'xong');
          resolve(ok);
        };
        // San khau: karaoke theo giong may (bat dau / ranh gioi tu; khong co ranh gioi thi uoc theo do dai)
        u.onstart = () => sk()?.khiGiongMay(line.id, 'bat-dau');
        u.onboundary = (e) => sk()?.khiGiongMay(line.id, 'ranh-gioi', e.charIndex);
        u.onend = () => finish(true);
        u.onerror = () => finish(false);
        // Luoi an toan: speechSynthesis thinh thoang khong ban onend
        setTimeout(() => finish(true), Math.max(3000, jp.length * 260));

        speechSynthesis.speak(u);
      } catch (e) {
        resolve(false);
      }
    });
  }

  /**
   * Tab Hoi thoai: bam nut loa cua mot cau (hoac mot tu trong cau) thi phai nghe DUNG giong
   * cua nhan vat noi cau do — cung giong da dat trong curriculum/nhan-vat.json. Truoc day
   * playSpeech (slide-engine.js) doc moi cau bang mot giong may duy nhat cho ca hai nguoi.
   * Cac cho khac (tu vung, kanji, vi du) van dung playSpeech goc.
   */
  function timDongThoaiTheoId(id) {
    if (!id) return null;
    const dia = curriculumLoader.getDialogue(slideEngine.currentLevel, slideEngine.currentLesson) || [];
    for (const l of dia) {
      if (l.id === id) return { line: l, caCau: true };
      if ((l.tokens || []).some(tk => tk.id === id)) return { line: l, caCau: false };
    }
    return null;
  }
  let lanBamTay = 0;
  async function phatDongBamTay(line, text, targetId, caCau) {
    if (!text) return;
    const lan = ++lanBamTay;
    try { audioEngine.stopPlayback(); } catch (e) {}
    try {
      if (window.speechSynthesis) {
        speechSynthesis.cancel();
        if (speechSynthesis.paused) speechSynthesis.resume();
      }
    } catch (e) {}
    if (targetId) { try { slideEngine.prepareReadingTarget(targetId); } catch (e) {} }
    const truoc = dangPhatGiongNhanVat;
    dangPhatGiongNhanVat = true;
    try {
      // Ca cau: uu tien ban da dung bang giong API cua nhan vat (chi khi dung giong hien hanh)
      const clip = caCau && audioDongConDung(line) ? dialogueAudio[line.id] : null;
      if (clip && audioEngine.playPcmClip) {
        try { await audioEngine.playPcmClip(clip); return; } catch (e) {}
      }
      if (lan !== lanBamTay) return;   // co lan bam moi hon -> khong doc them
      await playLineWithBrowserVoice(line, { text, khongSanKhau: true });
    } finally {
      if (!truoc) dangPhatGiongNhanVat = false;
      if (targetId && lan === lanBamTay) {
        try {
          if (slideEngine.activeFocusId === targetId) {
            const el = slideEngine.resolveElement(targetId);
            const b = el && el.querySelector('.reading-badge-indicator');
            if (b) b.remove();
          } else slideEngine.clearFocusClasses(targetId);
        } catch (e) {}
      }
    }
  }
  const playSpeechGoc = window.playSpeech;
  if (typeof playSpeechGoc === 'function') {
    window.playSpeech = function (text, targetId) {
      const tim = window.SenseiVoices ? timDongThoaiTheoId(targetId) : null;
      if (!tim) return playSpeechGoc.apply(this, arguments);
      phatDongBamTay(tim.line, text, targetId, tim.caCau);
    };
  }

  /* ======================================================================
     SOẠN THÊM BÀI TẬP BẰNG AI
     Nạp ngầm ngay khi mở bài. Đề trộn dễ / trung bình / khó, thiên về suy luận
     chứ không phải thế công thức. Không có key hoặc gọi hỏng thì im lặng dùng
     bộ đề đã soạn tay — không bao giờ chặn việc học.
     ====================================================================== */

  // Model Live thuong KHONG phuc vu REST generateContent (tra 404), nen bo soan de
  // chay qua chinh Live API — dung dung quota Live ma nguoi dung dang co.
  // 'gemini-3.8-live' de cuoi cung vi da chay duoc THAT tren key nay

  const quizGenCache = {};
  const quizGenInFlight = {};
  const quizGenNghiDen = {};   // bai nao vua that bai thi nghi mot lat moi thu lai

  // Moi lan soan lai chon mot goc khac, de hai lan sinh khong ra de na na nhau
  const QUIZ_ANGLES = [
    'Nhấn vào các lỗi mà người Việt học tiếng Nhật hay mắc nhất ở mẫu câu này.',
    'Nhấn vào việc phân biệt những cặp từ / mẫu câu dễ nhầm lẫn với nhau.',
    'Đặt câu hỏi trong bối cảnh công sở và giao tiếp với người lạ.',
    'Đặt câu hỏi trong bối cảnh đời sống hằng ngày: nhà cửa, mua sắm, bạn bè.',
    'Nhấn vào sắc thái lịch sự — cùng một ý nhưng nói trang trọng hay thân mật.',
    'Nhấn vào trật tự từ và vai trò của trợ từ trong câu.',
  ];

  /** Model hay boc JSON trong khoi ma markdown — go rao truoc khi parse */
  function stripFence(text) {
    return String(text || '')
      .replace(new RegExp('^' + '```' + '(?:json)?', 'i'), '')
      .replace(new RegExp('```' + '\\s*$'), '')
      .trim();
  }

  /**
   * Goi model sinh chu qua REST generateContent.
   * KHONG dung phien Live cho viec nay: model Live o day audio-only.
   */
  async function callTextModel(apiKey, model, prompt, maxTokens) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: ctrl.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.95,
              // 10 cau + giai thich ngan chi het ~3-4k token. De 25k khong lam
              // model sinh nhanh hon, chi khien no viet dai dong va lau hon.
              maxOutputTokens: maxTokens || 6000,
              responseMimeType: 'application/json',
            },
          }),
        }
      );
      // KHONG tat hen gio o day: doc than (res.json) cung phai nam trong han
      // 45s, khong thi than treo la de ket "dang soan" mai.
      if (!res.ok) {
        let detail = res.status;
        try {
          const body = await res.json();
          if (body?.error?.message) detail = `${res.status} ${body.error.message}`;
        } catch (e) {}
        return { ok: false, status: detail };
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return { ok: false, status: 'không trả về nội dung' };

      let parsed;
      try {
        parsed = JSON.parse(stripFence(text));
      } catch (e) {
        return { ok: false, status: 'JSON hỏng: ' + String(e.message || e).slice(0, 80) };
      }

      const items = layMang(parsed);
      if (!items) {
        return { ok: false, status: 'trả về không phải danh sách: ' + moTaHinhDang(parsed) };
      }
      return { ok: true, items };
    } catch (err) {
      return { ok: false, status: String((err && err.message) || err) };
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Tra ve mang cau hoi du model boc no trong hinh dang nao.
   * responseMimeType:'application/json' chi hua la JSON hop le, KHONG hua la
   * mang — Gemini rat hay boc lai thanh {"questions": [...]}.
   */
  function layMang(parsed) {
    if (Array.isArray(parsed)) return parsed;
    if (!parsed || typeof parsed !== 'object') return null;
    for (const khoa of ['items', 'questions', 'quiz', 'exercises', 'data', 'cauHoi']) {
      if (Array.isArray(parsed[khoa])) return parsed[khoa];
    }
    // Khong doan duoc ten khoa: lay mang dai nhat trong object
    const cacMang = Object.values(parsed).filter(Array.isArray);
    if (cacMang.length) return cacMang.sort((a, b) => b.length - a.length)[0];
    return null;
  }

  function moTaHinhDang(v) {
    if (Array.isArray(v)) return 'mảng ' + v.length;
    if (v && typeof v === 'object') return 'object {' + Object.keys(v).slice(0, 4).join(', ') + '}';
    return typeof v;
  }

  // Goc ra de rieng cho bai Nhap mon (bang chu kana): khong co mau ngu phap de xoay quanh
  const QUIZ_ANGLES_KANA = [
    'Nhấn vào các cặp chữ trông giống nhau (さ/ち, ぬ/め, シ/ツ, ソ/ン...) mà người mới học hay nhầm.',
    'Nhấn vào âm đục ゛, bán đục ゜ và âm ghép ゃゅょ viết nhỏ: đổi một dấu là đổi cả cách đọc.',
    'Nhấn vào âm ngắt っ và trường âm (ああ, おう, ー): đếm nhịp, nghe dài hay ngắn.',
    'Nhấn vào đọc hiểu: cho một từ viết bằng kana, hỏi đọc là gì hoặc nghĩa là gì.',
    'Nhấn vào chiều ngược lại: cho romaji hoặc cách đọc, hỏi viết bằng chữ nào.',
  ];

  /** Tap chu kana da hoc toi bai nay (bai truoc chua nap chi tiet thi lay tieu de bai lam pham vi) */
  function kanaDaHoc(lesson, lvl) {
    const ds = (curriculumLoader.getLessonsForLevel(lvl) || [])
      .filter(l => l.lessonNumber <= lesson.lessonNumber)
      .sort((a, b) => a.lessonNumber - b.lessonNumber);
    const chu = [], bai = [];
    ds.forEach(l => {
      if (Array.isArray(l.kanjiList)) l.kanjiList.forEach(k => { if (k && k.character) chu.push(k.character); });
      else bai.push(l.title);
    });
    return { chu: [...new Set(chu)], bai };
  }

  function buildQuizPromptKana(lesson, lvl) {
    const angle = QUIZ_ANGLES_KANA[Math.floor(Math.random() * QUIZ_ANGLES_KANA.length)];
    const vocab = (lesson.vocabList || [])
      .map(v => `${v.word}[${v.romaji || ''}]=${v.meaningVi}`).join('; ');
    const chuMoi = (lesson.kanjiList || [])
      .map(k => `${k.character}=${k.romaji || ''}${k.sosanh ? ` (${k.sosanh})` : ''}`).join('; ');
    const quyTac = (lesson.slides || [])
      .map(s => `${s.title} → ${s.grammarFormula || ''}`).join('\n');
    const hoc = kanaDaHoc(lesson, lvl);

    return `Bạn là giáo viên tiếng Nhật dạy người Việt MỚI BẮT ĐẦU học bảng chữ cái (hiragana, katakana).
Soạn 10 câu trắc nghiệm cho bài Nhập môn sau. Trả lời bằng JSON đúng schema.

BÀI: ${lesson.title}
CHỮ MỚI CỦA BÀI: ${chuMoi || '(bài này không học chữ mới — ôn chữ đã học)'}
TỪ VỰNG: ${vocab}
QUY TẮC / MẪU:
${quyTac}

CHỈ ĐƯỢC DÙNG các chữ kana đã học tới bài này: ${hoc.chu.join(' ') || '(xem tên các bài)'}
${hoc.bai.length ? `Các bài trước (chưa có danh sách chữ — dùng đúng phạm vi tên bài): ${hoc.bai.join(' | ')}\n` : ''}KHÔNG dùng chữ Hán trong câu hỏi, lựa chọn hay đáp án. Chữ kana ngoài phạm vi trên thì KHÔNG được xuất hiện.

YÊU CẦU RA ĐỀ (trộn các dạng, mỗi dạng ít nhất 1 câu nếu bài có chất liệu):
- "Chữ này đọc là gì?": cho một chữ / âm ghép kana, 4 lựa chọn romaji.
- "Romaji → chữ": cho romaji, chọn đúng chữ kana (các lựa chọn sai là chữ trông giống).
- Phân biệt chữ giống nhau (ví dụ さ/ち, シ/ツ, ソ/ン, ね/れ/わ).
- Âm đục ゛/ bán đục ゜, âm ghép ゃゅょ nhỏ, âm ngắt っ, trường âm — chỉ khi bài đã học tới.
- Bài có katakana: đọc một từ mượn viết bằng katakana rồi chọn nghĩa tiếng Việt.
- 3 câu "de", 4 câu "vua", 3 câu "kho" (khó = bẫy chữ giống nhau, chữ nhỏ/to, dài/ngắn, đếm nhịp).
- Mỗi câu đúng 4 lựa chọn KHÁC NHAU, correctIndex là chỉ số 0-3.
- Câu hỏi viết bằng tiếng Việt, chữ Nhật chỉ là kana.
- explanation: TỐI ĐA 2 câu, nói rõ vì sao đáp án kia sai. hint: MỘT câu ngắn, không lộ đáp án.
- KHÔNG hỏi âm Hán Việt, âm On/Kun hay ngữ pháp.
- JSON là MỘT MẢNG 10 phần tử dạng {"level": "de"|"vua"|"kho", "question": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0, "explanation": "...", "hint": "..."}.

GÓC RA ĐỀ LẦN NÀY: ${angle}
Mã ngẫu nhiên để tránh trùng đề với lần trước: ${Math.random().toString(36).slice(2, 10)}`;
  }

  function buildQuizPrompt(lesson, lvl) {
    if (CAP_DO.laKana(lvl)) return buildQuizPromptKana(lesson, lvl);
    const angle = QUIZ_ANGLES[Math.floor(Math.random() * QUIZ_ANGLES.length)];
    const vocab = (lesson.vocabList || [])
      .map(v => `${v.kanji || v.word}(${v.furigana || ''})=${v.meaningVi}`).join('; ');
    const kanji = (lesson.kanjiList || [])
      .map(k => `${k.character}=${k.meaningVi}`).join('; ');
    const grammar = (lesson.slides || [])
      .map(s => `${s.title} → ${s.grammarFormula}`).join('\n');

    return `Bạn là người ra đề JLPT ${lvl} nhiều kinh nghiệm.
Soạn 10 câu trắc nghiệm cho bài học sau. Trả lời bằng JSON đúng schema.

BÀI: ${lesson.title}
TỪ VỰNG: ${vocab}
CHỮ HÁN: ${kanji}
NGỮ PHÁP:
${grammar}

YÊU CẦU RA ĐỀ:
- 3 câu "de": nhận diện trực tiếp từ vựng / cách đọc kanji.
- 4 câu "vua": áp dụng mẫu ngữ pháp vào ngữ cảnh mới chưa có trong bài.
- 3 câu "kho": BẮT BUỘC phải suy luận, KHÔNG được thế công thức là ra. Dùng các dạng:
  · cả 4 đáp án đều đúng ngữ pháp nhưng chỉ 1 hợp ngữ cảnh/sắc thái;
  · tìm chỗ SAI trong một câu cho sẵn;
  · cho câu trả lời, suy ngược ra câu hỏi phù hợp;
  · phân biệt hai mẫu gần nghĩa dễ nhầm.
- Mỗi câu đúng 4 lựa chọn, correctIndex là chỉ số 0-3.
- Câu hỏi viết bằng tiếng Việt xen tiếng Nhật, đúng phong cách đề thi.
- explanation: TỐI ĐA 2 câu, nói rõ vì sao đáp án kia sai. Không dài dòng.
- hint: MỘT câu ngắn, không lộ đáp án.
- Viết gọn: đây là đề trắc nghiệm, không phải bài giảng.
- Tuyệt đối không lặp lại nguyên văn câu ví dụ đã có trong bài.

GÓC RA ĐỀ LẦN NÀY: ${angle}
Mã ngẫu nhiên để tránh trùng đề với lần trước: ${Math.random().toString(36).slice(2, 10)}`;
  }

  const LEVEL_TAG = { de: 'Dễ', vua: 'Vừa', kho: 'Khó' };

  // Model doi khi cho hai lua chon y het nhau (vd dap an dung lap lai o D):
  // chon ban lap cung dung ma bi cham sai vi chi tinh correctIndex -> bo cau do.
  function luaChonHong(options) {
    const o = (options || []).map(s => String(s).trim());
    return o.some(s => !s) || new Set(o).size !== o.length;
  }

  function normalizeGeneratedQuiz(items, lvl, lessonNum) {
    return (items || [])
      .map(q => {
        // Model hay tra correctIndex dang chuoi "2". Loc cu cho lot vi >= 0
        // co ep kieu, nhung luc cham bai lai so sanh === voi so -> cau nao
        // cung bao sai. Ep ve so ngay tu day.
        if (!q || typeof q !== 'object') return null;
        const dap = Number(q.correctIndex);
        if (!q.question || !Array.isArray(q.options) || q.options.length !== 4) return null;
        if (!Number.isInteger(dap) || dap < 0 || dap > 3) return null;
        if (luaChonHong(q.options)) return null;
        return { ...q, options: q.options.map(s => String(s).trim()), correctIndex: dap };
      })
      .filter(Boolean)
      .map((q, i) => ({
        // Moc thoi gian trong id: de moi phai la the MOI trong DOM, khong de
        // trinh duyet dung lai trang thai da chon cua de cu.
        id: `ex-ai-${lvl.toLowerCase()}-${lessonNum}-${Date.now().toString(36)}-${i + 1}`,
        question: `[${LEVEL_TAG[String(q.level || '').toLowerCase()] || 'Vừa'}] ${q.question}`,
        options: q.options.map(o => String(o)),
        correctIndex: q.correctIndex,
        explanation: q.explanation || '',
        hint: q.hint || '',
        generated: true,
      }));
  }

  /* ----------------------------------------------------------------------
     KHO DE DA SOAN — giu qua nhung lan tai lai trang

     Han muc free tier rat chat (20 luot/phut). Soan xong ma khong luu thi moi
     lan F5 lai ton them mot luot cho DUNG bo de vua co. Giu 7 ngay.
     ---------------------------------------------------------------------- */
  // v2: tu 2026-09-28 chi luu bo de nguoi hoc tu bam "Doi de khac". Kho v1 con lan bo de app tu soan
  // luc mo chuong (nguoi hoc khong yeu cau) nen bo han.
  const KHO_DE = 'sensei_quiz_v2';
  const KHO_DE_HAN = 7 * 24 * 60 * 60 * 1000;
  try { localStorage.removeItem('sensei_quiz_v1'); } catch (e) {}

  function docKhoDe() {
    try {
      const o = JSON.parse(localStorage.getItem(KHO_DE) || '{}');
      const now = Date.now();
      for (const k of Object.keys(o)) {
        if (!o[k] || now - o[k].at > KHO_DE_HAN) delete o[k];
      }
      return o;
    } catch (e) { return {}; }
  }

  function luuKhoDe(key, items) {
    try {
      const o = docKhoDe();
      o[key] = { at: Date.now(), items };
      localStorage.setItem(KHO_DE, JSON.stringify(o));
    } catch (e) { /* het cho trong localStorage — khong sao, chi mat cache */ }
  }

  // Nap lai nhung bo de da soan tu lan truoc
  (() => {
    const o = docKhoDe();
    for (const k of Object.keys(o)) {
      // Bo luu tu truoc khi co bo loc van co the con cau trung lua chon — loc lai
      const items = (Array.isArray(o[k].items) ? o[k].items : [])
        .filter(q => q && Array.isArray(q.options) && !luaChonHong(q.options));
      if (items.length) quizGenCache[k] = items;
    }
  })();

  /**
   * Goi model soan de, thu lan luot tung cap (model x key).
   *
   * Hai key trong .env la cua HAI tai khoan khac nhau nen han muc tach roi:
   * key nay 429 thi key kia van con luot. Thu het moi kha nang roi moi chiu thua.
   */
  /** Ba loai that bai, ba cach chua khac nhau */
  function phanLoaiLoi(status) {
    const t = String(status || '');
    if (/429|quota|rate.?limit/i.test(t)) return 'hetQuota';
    if (/50[0234]|overload|high demand|unavailable|timeout|aborted|network|failed to fetch/i.test(t)) return 'quaTai';
    return 'khac';
  }

  const nghi = (ms) => new Promise(r => setTimeout(r, ms));

  let luotSoanDe = 0;          // dem de xen ke model
  const modelHong = {};        // model 404/khong co quyen -> khong goi lai nua

  /**
   * Goi model soan de, thu lan luot tung cap (model x key).
   *
   *   429 het quota -> sang KEY khac. Moi key la mot tai khoan, han muc tach
   *                    rieng — dien cang nhieu key trong .env (toi da 4) thi
   *                    cang nhieu suat de xoay khi mot vai key bi 429.
   *   503 qua tai   -> doi key vo ich (qua tai nam o phia model). Cho roi thu lai.
   *   loi khac      -> xuong model du phong.
   */
  async function soanDeBangAI(prompt, baoTien) {
    const keys = allKeys();
    if (!keys.length) return { ok: false, status: 'chưa đọc được key từ .env' };

    const daThu = [];
    let cuoi = { ok: false, status: 'chưa thử', loai: 'khac' };

    // Xen ke: moi lan soan de bat dau tu mot model khac, de hai ben chia deu
    // han muc thay vi don het vao model dau danh sach.
    const dsModel = (SENSEI_MODELS.quizModels || [SENSEI_MODELS.quiz]).filter(m => !modelHong[m]);
    if (!dsModel.length) return { ok: false, status: 'không còn model nào dùng được', loai: 'khac' };
    const batDau = luotSoanDe++ % dsModel.length;

    for (let mi = 0; mi < dsModel.length; mi++) {
      const model = dsModel[(batDau + mi) % dsModel.length];
      const ten = model.replace('models/', '');

      for (let i = 0; i < keys.length; i++) {
        let loai = 'khac';

        // Qua tai thi cho roi thu lai chinh cap nay — toi 3 luot, gian dan.
        for (let lan = 1; lan <= 3; lan++) {
          const out = await callTextModel(keys[i], model, prompt);
          if (out.ok) return out;

          loai = phanLoaiLoi(out.status);
          daThu.push(`${ten}/key${i + 1} lần ${lan}: ${out.status}`);
          cuoi = { ok: false, status: `${ten}: ${out.status}`, loai, daThu };

          // Model khong ton tai / khong co quyen: gach ten han, dung goi lai
          // ca buoi. Khong thi cu xen ke la lai dam vao no mot lan nua.
          if (/404|not found|không tìm thấy|permission|403/i.test(String(out.status))) {
            modelHong[model] = true;
            console.warn('[quiz] bỏ hẳn model', ten, '—', out.status);
          }

          if (loai !== 'quaTai' || lan === 3) break;
          if (baoTien) baoTien(`${ten} đang quá tải — thử lại lần ${lan + 1}/3…`);
          await nghi(1800 * lan);
        }

        // Chi doi key khi het quota; qua tai hay loi cau hinh thi doi key vo ich
        if (loai !== 'hetQuota') break;
      }
    }

    console.warn('[quiz] đã thử hết:', daThu.join(' | '));
    return cuoi;
  }

  /** "Please retry in 51.05s" -> "52 giây" */
  function doiBaoLau(status) {
    const m = String(status || '').match(/retry in ([\d.]+)s/i);
    if (!m) return '';
    const giay = Math.ceil(Number(m[1]));
    return giay > 90 ? ` Thử lại sau ~${Math.ceil(giay / 60)} phút.` : ` Thử lại sau ~${giay} giây.`;
  }

  async function prefetchGeneratedQuiz(lvl, lessonNum, verbose = false) {
    const key = `${lvl}-${lessonNum}`;
    // Dang co mot luot soan chay roi: dung goi them, nhung phai ve lai lop cho
    // — truoc day ham thoat im lang o day nen bam "Doi de khac" nhu khong an gi.
    if (quizGenInFlight[key]) { veLaiCho(); return; }
    if (quizGenCache[key] && !verbose) {
      // Da co de soan san (trong phien nay hoac tu kho localStorage lan
      // truoc) — phai GAN vao bai hoc chu khong chi thoat ra. Truoc day
      // thoat thang o day nen de luu 7 ngay thuc te khong bao gio hien
      // len sau khi tai lai trang: kho co du lieu ma man hinh van chi co
      // 10 cau soan tay.
      apDungDeDaSoan(lvl, lessonNum, quizGenCache[key]);
      return;
    }
    // Vua that bai thi nghi mot lat — dang het quota ma cu doi tab la goi lai
    // thi chi to dot them luot. Nguoi hoc tu bam nut (verbose) thi van cho thu.
    if (!verbose && Date.now() < (quizGenNghiDen[key] || 0)) return;

    const lesson = curriculumLoader.getLesson(lvl, lessonNum);
    if (!lesson) return;
    // Moi co muc luc (bai chua tai xong): soan luc nay thi prompt rong tu vung
    if (!Array.isArray(lesson.vocabList)) return;

    quizGenInFlight[key] = true;
    datCho('quiz', 'Đang soạn bộ đề mới…',
      'Sensei nghĩ 10 câu mới cho bài này — thường mất 10–30 giây.');
    const regenBtn = document.getElementById('quizRegenBtn');
    if (regenBtn) regenBtn.disabled = true;
    // Nhap mon: de chi duoc dung chu da hoc -> nap chi tiet cac bai truoc de biet du danh sach chu
    if (CAP_DO.laKana(lvl)) {
      try { await curriculumLoader.ensureReviewLoaded(lvl, lessonNum, 9); } catch (e) { /* thieu thi lay ten bai */ }
    }
    const prompt = buildQuizPrompt(lesson, lvl);

    // Model Live la AUDIO-ONLY (ma 1007 neu doi TEXT), nen viec sinh chu
    // bat buoc di REST.
    const res = await soanDeBangAI(prompt, (tin) => {
      // Cho lau la vi dang thu lai — phai noi ra, khong de nguoi hoc ngoi doan
      datCho('quiz', 'Đang soạn bộ đề mới…', tin);
    });
    delete quizGenInFlight[key];
    datCho('quiz', null);
    const doneBtn = document.getElementById('quizRegenBtn');
    if (doneBtn) doneBtn.disabled = false;

    if (!res.ok) {
      quizGenNghiDen[key] = Date.now() + 90 * 1000;
      console.warn('[quiz] khong soan them duoc:', res.status);
      if (verbose) {
        // Nguoi hoc vua bam nut va dang cho: phai bao ket qua, du la that bai.
        // Het quota la truong hop rieng — noi ngan gon, kem thoi gian cho.
        const loi =
          res.loai === 'hetQuota'
            ? `Hết lượt gọi miễn phí của cả hai tài khoản.${doiBaoLau(res.status)} Vẫn dùng bộ đề soạn tay.`
          : res.loai === 'quaTai'
            ? 'Hệ thống soạn đề đang quá tải — đã thử lại vài lần. '
              + 'Đây là lỗi nhất thời, thử lại sau vài phút. Vẫn dùng bộ đề soạn tay.'
            // Chi tiet ky thuat (ten model, ma loi API) chi ghi console.warn o
            // tren, khong dua vao thong bao hien man hinh cho hoc vien.
            : 'Chưa soạn được đề mới lúc này. Vẫn dùng bộ đề soạn tay.';
        showToast(loi, 'info', 9000);
      }
      return;
    }

    const items = normalizeGeneratedQuiz(res.items, lvl, lessonNum);
    if (!items.length) {
      // Truoc day return im lang o day: loading tat, de giu nguyen, khong
      // mot dau hieu nao. Do dung la thu nguoi hoc bao cao.
      const soThô = Array.isArray(res.items) ? res.items.length : 0;
      console.warn('[quiz] model tra ve', soThô, 'cau nhung khong cau nao dung dinh dang');
      if (verbose) {
        showToast(soThô
          ? `Bộ đề mới sai định dạng (${soThô} câu bị loại) — giữ nguyên đề cũ.`
          : 'Chưa soạn được đề mới — giữ nguyên đề cũ.', 'info', 7000);
      }
      return;
    }

    quizGenCache[key] = items;
    luuKhoDe(key, items);
    delete quizGenNghiDen[key];

    if (apDungDeDaSoan(lvl, lessonNum, items)) {
      showToast(`Đã soạn thêm ${items.length} câu bài tập cho bài này.`);
    }
  }

  /** Gan bo de da luu (tu lan bam "Doi de khac" truoc) — khong goi AI. Bai moi co muc luc thi doi lan sau. */
  function apDungDeDaLuu(lvl, lessonNum) {
    let items;
    try { items = quizGenCache[`${lvl}-${lessonNum}`]; } catch (e) { return; }   // luc khoi dong chua khai bao kho
    const lesson = items && curriculumLoader.getLesson(lvl, lessonNum);
    if (lesson && Array.isArray(lesson.vocabList)) apDungDeDaSoan(lvl, lessonNum, items);
  }

  /**
   * Gan bo de AI da soan vao bai hoc dang mo va ve lai man hinh.
   *
   * Dung chung cho hai duong: vua soan xong, va lay lai tu kho da luu.
   * Tra ve true neu vua gan moi (de ben goi biet co nen bao gi khong).
   */
  function apDungDeDaSoan(lvl, lessonNum, items) {
    if (!items || !items.length) return false;
    // Chi gan vao bai dang mo, va chi khi chua bat dau giang de ke hoach nhip con dung
    const stillHere = slideEngine.currentLevel === lvl && slideEngine.currentLesson === Number(lessonNum);
    if (!stillHere) return false;

    const lesson = curriculumLoader.getLesson(lvl, lessonNum);
    if (!lesson) return false;

    // Dung bo nay da gan roi thi thoi — gan lai se keo theo setTab() va tao
    // vong lap vo tan (setTab -> onTabChange -> prefetchGeneratedQuiz -> gan
    // lai -> ...). Chi so bo dang gan voi bo moi (id co moc thoi gian nen hai
    // bo khac nhau khong trung id): chan moi bo AI thi "Đổi đề khác" vo dung.
    const dangGan = (lesson.exercises || []).find(q => q.generated);
    if (dangGan && dangGan.id === items[0].id) return false;

    const base = (lesson.exercises || []).filter(q => !q.generated);
    // De AI len TRUOC. Neu de sau thi 10 cau dau van y nguyen moi lan mo,
    // nguoi hoc nhin vao tuong nhu khong co gi moi.
    lesson.exercises = items.concat(base);

    if (lectureState === 'IDLE') {
      currentLectureSteps = buildLecturePlan(lvl, lessonNum);
    }
    // San khau dang giang chuong Bai tap: ve lai luoi se xoa cho giu cho cua the dang dua len san khau
    // (va de moi khong con khop nhip dang giang) -> tam dung truoc (san khau tra the ve, luoi tinh)
    if (slideEngine.activeTab === 'quiz' && lectureState === 'PLAYING' && SK()?.dangGiang()) pauseLecture(false);
    if (slideEngine.activeTab === 'quiz') slideEngine.setTab('quiz');
    return true;
  }

  /* ======================================================================
     MÀN CHỌN BÀI HỌC
     ====================================================================== */

  const LEVEL_INFO = {
    KANA: { title: 'Nhập môn — Bảng chữ cái',
          desc: 'Hiragana, katakana, âm đục, âm ghép, âm ngắt っ, trường âm và câu chào đầu tiên — nền móng trước N5.' },
    N5: { title: 'Sơ cấp 1 — Khởi đầu',
          desc: 'Minna no Nihongo I. Câu danh từ です, chỉ thị từ, động từ ます, tính từ, trợ từ nền tảng.' },
    N4: { title: 'Sơ cấp 2 — Giao tiếp hằng ngày',
          desc: 'Minna no Nihongo II. Thể て, thể thường, thể khả năng, bị động, kính ngữ sơ cấp.' },
    N3: { title: 'Trung cấp — Bản lề',
          desc: 'Shin Kanzen Master N3. Nối câu dài, sắc thái biểu đạt, đọc hiểu văn bản đời sống.' },
    N2: { title: 'Trung cao cấp',
          desc: 'Shin Kanzen Master N2. Văn viết trang trọng, mẫu câu tin tức, thành ngữ công sở.' },
    N1: { title: 'Cao cấp',
          desc: 'Shin Kanzen Master N1. Văn chương, học thuật, sắc thái tinh tế và cổ văn hiện đại.' },
  };

  const pickerEl = document.getElementById('lessonPicker');
  const pickerBody = document.getElementById('pickerBody');
  const pickerBtn = document.getElementById('pickerBtn');
  const pickerCloseBtn = document.getElementById('pickerCloseBtn');
  const pickerSearch = document.getElementById('pickerSearch');
  const pickerJump = document.getElementById('pickerJump');
  // Da mo bai nao chua (bam the bai, hoac dong danh sach de hoc bai hien san).
  // Chua thi khong gan nhan "ĐANG HỌC" — lan dau vao trang chua hoc gi ca.
  // Phai khai bao TRUOC lan openPicker() dau tien ben duoi (TDZ).
  let daMoBai = false;

  // l chi la muc luc nhe (chua bam mo bao gio) thi dung dem so co san trong
  // index (vocabCount...); bai nao da tung mo roi thi mang that (vocabList...)
  // co san va chinh xac hon (vi du sau khi soan them de AI vao exercises).
  function lessonStats(l) {
    return {
      vocab: l.vocabList ? l.vocabList.length : (l.vocabCount || 0),
      kanji: l.kanjiList ? l.kanjiList.length : (l.kanjiCount || 0),
      slides: l.slides ? l.slides.length : (l.slideCount || 0),
      quiz: l.exercises ? l.exercises.length : (l.exerciseCount || 0),
    };
  }

  // Tim khong dau: "gioi thieu" van ra "Giới thiệu". Tach dau (NFD) roi bo dau ghep, đ -> d;
  // lam CA HAI phia (o tim + noi dung bai). Chu Nhat qua NFD cung tach giong nhau nen van khop.
  const boDau = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd').toLowerCase();

  function renderPicker(filter = '') {
    if (!pickerBody) return;
    const q = boDau(filter.trim());
    let shown = 0;

    // Nhap mon (KANA) dung dau, roi N5 -> N1
    const html = CAP_DO.THU_TU.map(lvl => {
      const lessons = curriculumLoader.getLessonsForLevel(lvl) || [];
      const hits = q
        ? lessons.filter(l => boDau(`${l.lessonNumber} ${l.title} ${l.description || ''}`).includes(q))
        : lessons;
      if (!hits.length) return '';
      shown += hits.length;

      const info = LEVEL_INFO[lvl] || { title: '', desc: '' };
      const cards = hits.map(l => {
        const st = lessonStats(l);
        // Bài chỉ có một từ vựng / một slide là bài mới dựng khung, chưa soạn đủ.
        // Khong xet so chu: bai Nhap mon 10 (chao hoi, so dem) co y de trong kanjiList.
        const thin = st.vocab <= 2 || st.slides <= 1;
        const laKana = CAP_DO.laKana(lvl);
        const isCurrent = daMoBai && slideEngine.currentLevel === lvl && slideEngine.currentLesson === l.lessonNumber;
        const title = l.title.includes(':') ? l.title.split(':').slice(1).join(':').trim() : l.title;
        // So lieu la mot dong chu mo, CSS noi bang " · " -> ghep lien, khong de khoang trang giua cac the.
        // Bai dang hoc: "Đang học" thay cho so slide (it can nhat) de dong van vua mot hang, the khong cao hon hang
        const stats = [
          isCurrent ? '<span class="lesson-stat lesson-now">Đang học</span>' : '',
          `<span class="lesson-stat">${st.vocab} từ</span>`,
          // Nhap mon: dem chu cai (bai 10 khong day chu moi thi bo han, khong ghi "0 chữ")
          laKana ? (st.kanji ? `<span class="lesson-stat">${st.kanji} chữ</span>` : '')
                 : `<span class="lesson-stat">${st.kanji} kanji</span>`,
          isCurrent ? '' : `<span class="lesson-stat">${st.slides} slide</span>`,
          `<span class="lesson-stat">${st.quiz} bài tập</span>`,
          thin ? '<span class="lesson-stat is-thin">chưa soạn đủ</span>' : '',
        ].join('');
        return `
          <button type="button" class="lesson-card${isCurrent ? ' is-current' : ''}"
                  data-level="${lvl}" data-lesson="${l.lessonNumber}"${isCurrent ? ' aria-current="true"' : ''}>
            <span class="lesson-no">${l.lessonNumber}</span>
            <span class="lesson-main">
              <span class="lesson-title">${slideEngine.escapeHtml(title)}</span>
              <span class="lesson-stats">${stats}</span>
            </span>
          </button>`;
      }).join('');

      return `
        <section class="picker-level lv-${lvl.toLowerCase()}" id="pk-${lvl}" data-level="${lvl}">
          <div class="picker-level-head" title="${slideEngine.escapeHtml(info.desc)}">
            <div class="picker-level-mark lv-${lvl.toLowerCase()}"${CAP_DO.laKana(lvl) ? ' lang="ja"' : ''}>${slideEngine.escapeHtml(CAP_DO.dau(lvl))}</div>
            <div>
              <h2 class="picker-level-title">
                ${info.title}
                <span class="picker-level-count">${hits.length} bài</span>
              </h2>
              <p class="picker-level-desc">${info.desc}</p>
            </div>
          </div>
          <div class="picker-grid">${cards}</div>
        </section>`;
    }).join('');

    // Co cap do nao khong nap duoc thi phai noi ra. Im lang thi nguoi hoc chi
    // thay danh sach ngan di ma khong hieu vi sao.
    const thieu = curriculumLoader.capDoThieu || [];
    const bangThieu = thieu.length ? `
      <div class="picker-thieu">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>Chưa nạp được giáo trình ${thieu.map(CAP_DO.ten).join(', ')} — có thể do mạng chập chờn.</span>
        <button type="button" id="napLaiGiaoTrinh">Nạp lại</button>
      </div>` : '';

    pickerBody.innerHTML = bangThieu + (shown ? html : `
      <div class="picker-empty">
        <i class="fa-solid fa-magnifying-glass"></i>
        Không tìm thấy bài nào khớp với “${slideEngine.escapeHtml(filter)}”.
      </div>`);

    const nutNapLai = document.getElementById('napLaiGiaoTrinh');
    if (nutNapLai) {
      nutNapLai.addEventListener('click', async () => {
        nutNapLai.disabled = true;
        nutNapLai.textContent = 'Đang nạp…';
        await curriculumLoader.init();       // chi nap lai, khong phai tai lai ca trang
        populateLessons(slideEngine.currentLevel, slideEngine.currentLesson);
        renderPicker(pickerSearch ? pickerSearch.value : '');
      });
    }

    pickerBody.querySelectorAll('.lesson-card').forEach(btn => {
      btn.addEventListener('click', () => {
        openLesson(btn.dataset.level, Number(btn.dataset.lesson));
      });
    });

    // Thanh nhay cap do: cap nao bi loc het bai thi khoa nut do
    if (pickerJump) {
      pickerJump.querySelectorAll('[data-jump]').forEach(nut => {
        nut.disabled = !document.getElementById('pk-' + nut.dataset.jump);
      });
    }
    danhDauCapDangXem();
  }

  // ---- Thanh nhay nhanh N5 … N1 ----
  // Cap dang xem = section cuoi cung da cuon toi mep tren vung cuon (dau cap do dinh o do)
  function danhDauCapDangXem() {
    if (!pickerJump || !pickerBody) return;
    const dinh = pickerBody.getBoundingClientRect().top + 48;
    let dangXem = null;
    pickerBody.querySelectorAll('.picker-level[data-level]').forEach(sec => {
      if (!dangXem || sec.getBoundingClientRect().top <= dinh) dangXem = sec.dataset.level;
    });
    // Cuon het day thi cap cuoi cung co the khong bao gio cham dinh — van danh dau no.
    // Chi khi danh sach THAT SU cuon duoc va da cuon: loc con it bai (khong tran) thi dieu kien
    // "cham day" luon dung, cap cuoi bi danh dau du cap dau dang nam tren cung.
    const cuonDuoc = pickerBody.scrollHeight > pickerBody.clientHeight + 4;
    if (cuonDuoc && pickerBody.scrollTop > 0 &&
        pickerBody.scrollTop + pickerBody.clientHeight >= pickerBody.scrollHeight - 4) {
      const cuoi = pickerBody.querySelectorAll('.picker-level[data-level]');
      if (cuoi.length) dangXem = cuoi[cuoi.length - 1].dataset.level;
    }
    pickerJump.querySelectorAll('[data-jump]').forEach(nut => {
      const la = nut.dataset.jump === dangXem;
      nut.classList.toggle('is-active', la);
      if (la) nut.setAttribute('aria-current', 'true'); else nut.removeAttribute('aria-current');
    });
  }
  if (pickerJump) {
    pickerJump.addEventListener('click', (e) => {
      const nut = e.target.closest('[data-jump]');
      if (!nut || nut.disabled) return;
      const sec = document.getElementById('pk-' + nut.dataset.jump);
      if (!sec) return;
      const giam = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      sec.scrollIntoView({ block: 'start', behavior: giam ? 'auto' : 'smooth' });
    });
  }
  if (pickerBody) {
    let choKhung = false;
    pickerBody.addEventListener('scroll', () => {
      if (choKhung) return;
      choKhung = true;
      requestAnimationFrame(() => { choKhung = false; danhDauCapDangXem(); });
    }, { passive: true });
  }

  /**
   * Mở một bài học. LUÔN bắt đầu ở chương Từ vựng — đó là điểm vào tự nhiên
   * của mọi bài. Muốn giảng từ chương khác thì bấm chương đó rồi mới bấm giảng.
   */
  async function openLesson(lvl, lessonNum) {
    daMoBai = true;
    // Dang thu am phat am / dang gio tay hoi thi tat mic, huy luot do truoc —
    // khong thi mic van mo va Sensei cham/tra loi cau cua bai vua roi di
    if (dangThuAm) huyThuAm();
    if (isRaisingHand) { lectureWasPlayingBeforeAsk = false; cancelQuestion(); }
    huyMoMicPA();   // ban thu con dang mo mic (cho quyen) cho the cua bai cu
    if (lectureState !== 'IDLE') {
      pauseLecture(false);
      lectureState = 'IDLE';
    }
    SK()?.dung();   // bai moi: tat san khau, bo bo nho canh / cham bai tap cua bai cu
    stopAllAudio();
    slideEngine.clearReadingFocus();
    if (window.SenseiBoard) SenseiBoard.lauSach();   // bai moi thi bang trong

    populateLessons(lvl, lessonNum);
    if (levelSelect) levelSelect.value = lvl;

    slideEngine.currentLevel = lvl;
    slideEngine.currentLesson = Number(lessonNum);
    slideEngine.currentSlideIndex = 0;
    window.SenseiCheDo?.apDung();   // nap truoc che do san khau da chon (san khau da tat)
    // setTab tu lo viec hien "dang tai bai hoc..." neu chi tiet chua co san
    slideEngine.setTab('vocab');

    closePicker();

    // Ke hoach giang bai (buildLecturePlan) can DU vocabList/kanjiList/slides/
    // dialogue/exercises — phai cho tai xong chi tiet moi duoc dung tiep,
    // khong thi ra ke hoach rong (bai vua mo tren picker chi la muc luc nhe).
    await curriculumLoader.ensureLessonLoaded(lvl, lessonNum);
    // Trong luc cho, hoc vien da bam sang bai khac thi thoi, de bai do tu lo.
    if (slideEngine.currentLevel !== lvl || slideEngine.currentLesson !== Number(lessonNum)) return;

    currentLectureSteps = buildLecturePlan(lvl, lessonNum);
    currentLectureStepIndex = -1;
    lectureCheckpoint = { stepIndex: 0, sectionName: 'vocab', subIndex: null, level: lvl, lessonNum: Number(lessonNum) };
    updateLectureControlsUI();

    // Khong bao ten bai bang toast nua: o chon bai tren dau va tieu de chuong
    // da hien san, toast lai de dung len tieu de do.

    // Bai tap: KHONG soan o day nua. Mo bai chi de luot xem cung ton mot luot
    // goi, ma han muc free tier chi 20 luot. Doi den khi mo chuong Bai tap.

    // Long tieng: chay ngay, vi day la viec lau nhat (30-60 giay). Cho phien
    // Sensei bat tay xong roi moi mo phien dien vien — chay ngay lap tuc thi
    // WebSocket hay loi nhat thoi.
    if ((curriculumLoader.getDialogue(lvl, Number(lessonNum)) || []).length) {
      datCho('kaiwa', 'Chuẩn bị lồng tiếng…',
        'Đang chờ phiên Sensei vào lớp xong rồi mới mở phiên diễn viên.');
    }
    // Toi luc chay ma hoc vien da sang bai khac thi thoi — khong mo phien long
    // tieng cho bai da roi (bai moi tu hen luot cua no)
    setTimeout(() => {
      if (slideEngine.currentLevel !== lvl || slideEngine.currentLesson !== Number(lessonNum)) return;
      prefetchDialogueAudio(lvl, Number(lessonNum), { verbose: true });
    }, 2500);
  }

  // Danh sach bai la hop thoai phu kin: phan phia sau phai 'inert', khong thi Tab / Shift+Tab
  // lot ra sau toi nut Bat dau giang / Gio tay (dang bi che) va bam nham duoc.
  const sauPicker = () => [document.querySelector('.deck-top'), document.querySelector('.deck-stage'),
    document.querySelector('.deck-bottom'), chatDock, document.getElementById('spotlight'),
    document.getElementById('bangPhan'), document.querySelector('.sensei-nut')].filter(Boolean);

  function openPicker() {
    if (!pickerEl) return;
    renderPicker(pickerSearch ? pickerSearch.value : '');
    pickerEl.classList.remove('hidden');
    sauPicker().forEach(el => { el.inert = true; });
    // Cuon toi bai dang hoc — phai SAU khi bo 'hidden', luc con display:none
    // thi scrollIntoView khong lam gi. Bi loc mat the do thi thoi.
    const theDangHoc = pickerBody && pickerBody.querySelector('.lesson-card.is-current');
    if (theDangHoc) {
      // Dua dau cap cua bai dang hoc len mep tren (thanh nhay danh dau dung cap do); bai nam sau
      // trong cap, ra ngoai khung nhin thi moi cuon the bai vao giua nhu cu
      const capBai = theDangHoc.closest('.picker-level');
      if (capBai) capBai.scrollIntoView({ block: 'start' });
      const khung = pickerBody.getBoundingClientRect(), rThe = theDangHoc.getBoundingClientRect();
      if (!capBai || rThe.bottom > khung.bottom - 12) theDangHoc.scrollIntoView({ block: 'center' });
    }
    danhDauCapDangXem();
    // Chi tu dat con tro vao o tim khi co chuot: may cam ung ma focus la bat
    // ban phim ao len che nua danh sach.
    const coChuot = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (pickerSearch && coChuot) setTimeout(() => pickerSearch.focus(), 60);
    else {
      // Van phai dua focus vao hop (nut vua bam da 'inert', focus roi ve body): dat vao tieu de
      // (tabindex=-1) — trinh doc man hinh vao dung hop thoai, ban phim ao khong bat len
      const tieuDe = document.getElementById('pickerTitle');
      if (tieuDe) tieuDe.focus({ preventScroll: true });
    }
  }

  function closePicker() {
    if (!pickerEl) return;
    const focusTrongPicker = pickerEl.contains(document.activeElement);
    pickerEl.classList.add('hidden');
    sauPicker().forEach(el => { el.inert = false; });
    // Focus dang o the bai vua an thi roi ve body — dua ve nut mo danh sach cho ban phim di tiep
    if (focusTrongPicker && pickerBtn) pickerBtn.focus({ preventScroll: true });
  }

  // Dong danh sach (nut X / Esc) ma chua bam bai nao — lan dau vao trang: coi
  // nhu hoc bai dang hien san phia sau, luc do moi long tieng cho bai do.
  // Truoc day long tieng chay ngay luc tai trang, khi hoc vien con o man chon bai.
  function dongPickerVeBaiDangHoc() {
    closePicker();
    if (daMoBai) return;
    daMoBai = true;
    // Luc khoi dong renderSlide() de bai hien san o Ngu phap; mo bai (openLesson)
    // thi luon vao Tu vung — lan dong dau nay cung vao Tu vung cho giong nhau
    if (slideEngine.activeTab !== 'vocab') slideEngine.setTab('vocab');
    const lvl = slideEngine.currentLevel, no = slideEngine.currentLesson;
    setTimeout(() => {
      if (slideEngine.currentLevel === lvl && slideEngine.currentLesson === no) prefetchDialogueAudio(lvl, no);
    }, 2500);
  }

  // Mo danh sach bai NGAY o day, khong doi toi cuoi ham khoi dong. Tu day den
  // cuoi con hang chuc doan dang ky su kien; mot doan gay la truoc day khong
  // bao gio toi duoc lenh mo danh sach -> trang trang.
  // Phoi ra window luon, de nhanh catch cua luoi an toan con goi lai duoc.
  window.openSyllabusModal = openPicker;
  window.closeSyllabusModal = closePicker;
  openPicker();

  if (pickerBtn) pickerBtn.addEventListener('click', openPicker);
  if (pickerCloseBtn) pickerCloseBtn.addEventListener('click', dongPickerVeBaiDangHoc);
  if (pickerSearch) {
    pickerSearch.addEventListener('input', () => renderPicker(pickerSearch.value));
    pickerSearch.addEventListener('keydown', (e) => {
      // O dang co chu: Esc chi xoa o tim, khong de noi len document dong luon
      // danh sach. O trong roi thi Esc lan nua moi dong.
      if (e.key !== 'Escape' || !pickerSearch.value) return;
      e.preventDefault();
      e.stopPropagation();
      pickerSearch.value = '';
      renderPicker('');
    });
  }

  /* ======================================================================
     BẢNG CẤU HÌNH · Ô GÕ CÂU HỎI · PHÍM TẮT · KHỞI ĐỘNG
     ====================================================================== */

  // ---- Ô gõ câu hỏi ----
  function openChat() {
    if (!chatDock) return;
    chatDock.classList.remove('hidden');
    if (chatInput) chatInput.focus();
  }
  function closeChat() {
    if (!chatDock) return;
    // Focus dang o trong o chat (o nhap, nut X): tra ve nut mo o chat, khong de roi ve body
    const f = document.activeElement;
    const traFocus = !f || f === document.body || chatDock.contains(f);
    chatDock.classList.add('hidden');
    if (traFocus && chatToggleBtn) chatToggleBtn.focus({ preventScroll: true });
  }
  if (chatToggleBtn) chatToggleBtn.addEventListener('click', () => {
    const open = chatDock && !chatDock.classList.contains('hidden');
    open ? closeChat() : openChat();
  });
  if (chatCloseBtn) chatCloseBtn.addEventListener('click', closeChat);

  // ---- Nut bat/tat bang cua Sensei ----
  const boardToggleBtn = document.getElementById('boardToggleBtn');
  if (boardToggleBtn) {
    boardToggleBtn.addEventListener('click', () => {
      if (!window.SenseiBoard) return;
      const dangMo = SenseiBoard.trangThai().bangDangMo;
      if (dangMo) {
        SenseiBoard.dongBang();
      } else {
        SenseiBoard.moBang();
        // Bang trong thi noi cho hoc vien biet no dung de lam gi, thay vi
        // mo ra mot o xanh rong khong hieu de lam gi. Ten bang da o thanh tieu de -> chi mot dong nhat.
        if (SenseiBoard.trangThai().soDongTrenBang === 0) {
          SenseiBoard.vietBang('Sensei sẽ ghi công thức, mẹo nhớ và viết chữ Hán theo nét lên đây trong lúc giảng.', 'nhat');
        }
      }
      // Trang thai sang / tat cua nut (.is-live, aria-pressed) do js/ui-shell.js dong bo theo
      // body.co-bang — dung ca khi bang dong bang nut x, lau bang khi doi bai, Sensei tu mo bang.
    });
  }

  // ---- Phím tắt: Esc đóng lớp phủ đang mở (theo thứ tự ưu tiên) ----
  // Moi Esc chi dong MOT lop: anh phong to (slide-engine, xet truoc) > bang chon bai > o chat > the ron
  // (slide-engine, dang ky sau bo nay). Lop nao dong thi preventDefault() de lop sau bo qua —
  // truoc day o chat + the ron cung mo thi mot Esc dong ca hai.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    // Dang go IME (tieng Nhat / Telex): Esc la bo chu dang go, thuoc ve bo go. Safari bao keyCode 229.
    if (e.isComposing || e.keyCode === 229) return;
    if (pickerEl && !pickerEl.classList.contains('hidden')) { e.preventDefault(); dongPickerVeBaiDangHoc(); return; }
    if (chatDock && !chatDock.classList.contains('hidden')) { e.preventDefault(); closeChat(); }
  });

  // ======================================================================
  // KHỞI ĐỘNG
  // ======================================================================
  updateSessionState();

  if (savedApiKey) {
    // Vào lớp ngay khi mở trang, chạy ngầm. Từ đây nút Bắt đầu / Tạm dừng
    // chỉ còn điều khiển BUỔI GIẢNG, không dính tới việc kết nối nữa.
    ensureConnected().catch((err) => {
      // 'quota' da co bao rieng trong onClose, 'missing-key' trong ensureConnected
      if (err && (err.message === 'quota' || err.message === 'missing-key')) return;
      showToast('Chưa vào được lớp — kiểm tra API Key hoặc mạng.', 'info', 6000);
    });
  } else if (!/[?&]noLive\b/i.test(location.search)) {   // ?noLive: co y bo key, khong bao thieu
    showToast('Chưa đọc được GEMINI_KEY1 từ .env — mở trang qua server.py rồi tải lại.', 'info', 10000);
  }

  // Dien thoai khoa am thanh cho toi cu cham dau tien — gan san bay mo khoa
  // ngay khi mo trang, truoc ca man chon bai (chinh cu cham chon bai se mo).
  audioEngine.installUnlockOnFirstGesture();
  window.__amThanh = () => audioEngine.trangThaiAmThanh();

  // (Danh sach bai da duoc mo som hon, ngay sau khi openPicker san sang)

  // Khong soan de, cung KHONG long tieng luc khoi dong: nguoi hoc dang o man
  // chon bai, chua biet se hoc bai nao. Long tieng chay khi mo bai (openLesson)
  // hoac khi dong danh sach de hoc bai hien san (dongPickerVeBaiDangHoc).

  // Giữ tương thích cho các lời gọi cũ
  window.jumpToLesson = openLesson;   // openSyllabusModal/closeSyllabusModal da gan som hon

  daKhoiDong = true;   // tu day loi le chi ghi console, khong hien bang "chua mo duoc"
 } catch (err) {
   // Khoi dong gay giua chung: van co gang dung lai man chon bai, de con
   // duong vao lop. Dung duoc thi nguoi hoc khong mat gi ngoai vai tinh nang.
   baoHongKhoiDong(err, 'khoi dong');
   try { if (window.openSyllabusModal) window.openSyllabusModal(); } catch (e) {}
 }
});
