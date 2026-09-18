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

window.addEventListener('error', (e) => {
  // Tep script tai thieu cung vao day (e.target la the script, khong co message)
  if (e.target && e.target.tagName === 'SCRIPT') {
    baoHongKhoiDong(new Error('không tải được ' + (e.target.src || 'một tệp mã')), 'script');
    return;
  }
  if (e.error) baoHongKhoiDong(e.error, 'runtime');
}, true);

window.addEventListener('unhandledrejection', (e) => baoHongKhoiDong(e.reason, 'promise'));

document.addEventListener('DOMContentLoaded', async () => {
 try {
  // 1. Khởi tạo Modules
  const curriculumLoader = new CurriculumLoader();
  await curriculumLoader.init();

  const slideEngine = new SlideEngine(curriculumLoader);


  // 2. DOM Elements
  // Key doc tu .env qua env.js — khong con nhap tay tren UI.
  //   key1 -> phien Sensei (uu tien)
  //   key2 -> dan dien vien long tieng + soan de (uu tien)
  //   key3, key4 -> du phong, dung khi cac key tren rong hoac het quota
  // Tach TAI KHOAN de khong tranh suat phien Live cua nhau (loi ma 1000);
  // co them key3/key4 thi vong lap thu lai (soanDeBangAI, dan dien vien)
  // co nhieu suat quota hon de xoay vong khi mot vai key bi 429.
  const ENV = window.SENSEI_ENV || {};
  /** Tat ca key da dien trong .env, giu dung thu tu uu tien, bo trung/rong. */
  function allKeys() {
    return [ENV.key1, ENV.key2, ENV.key3, ENV.key4]
      .map(k => String(k || '').trim())
      .filter((k, i, a) => k && a.indexOf(k) === i);
  }
  const senseiKey = () => String(ENV.key1 || ENV.key2 || ENV.key3 || ENV.key4 || '').trim();
  const helperKey = () => String(ENV.key2 || ENV.key1 || ENV.key3 || ENV.key4 || '').trim();
  // Giong Sensei chot cung: Charon — nam tram, ro chu, hop tieng Nhat nhat.
  // Khong con o chon tren UI nua.
  const SENSEI_VOICE = 'Charon';
  // Bao cho kho giong biet, de khong cap trung giong nay cho nhan vat nao
  if (window.SenseiVoices) SenseiVoices.setSenseiVoice(SENSEI_VOICE);
  const connectBtn = document.getElementById('connectBtn');
  const connectIcon = document.getElementById('connectIcon');
  const connectText = document.getElementById('connectText');
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
  const syllabusModal = document.getElementById('syllabusModal');

  // Auto-Lecture & Raise Hand Elements & State
  const autoLectureBtn = document.getElementById('autoLectureBtn');
  const autoLectureIcon = document.getElementById('autoLectureIcon');
  const autoLectureText = document.getElementById('autoLectureText');
  const raiseHandBtn = document.getElementById('raiseHandBtn');
  const raiseHandIcon = document.getElementById('raiseHandIcon');
  const raiseHandText = document.getElementById('raiseHandText');
  const nextStepBtn = document.getElementById('nextStepBtn');
  const nextStepText = document.getElementById('nextStepText');

  // State Machine for Lecture: 'IDLE' | 'PLAYING' | 'PAUSED'
  let lectureState = 'IDLE';
  let lectureCheckpoint = {
    stepIndex: 0,
    sectionName: 'vocab',
    subIndex: null,
    level: 'N5',
    lessonNum: 1
  };
  let isAutoLectureActive = false; // backward compatibility
  let isRaisingHand = false;
  let currentLectureSteps = [];
  let currentLectureStepIndex = -1;
  let autoStepTransitionTimer = null;
  let currentStepStartTime = 0;
  let currentStepRetryCount = 0;
  // Sensei đã gọi section_complete cho bước hiện tại chưa?
  // Không có cờ này thì một lượt nói kết thúc đã bị hiểu nhầm là "giảng xong chương",
  // trong khi một chương 30 từ vựng thường phải trải qua nhiều lượt.
  // Sensei van co the goi section_complete, nhung nhip gio do client cam,
  // co nay chi con de ghi nhan chu khong dieu khien viec chuyen buoc nua.
  let stepSignaledDone = false;
  let lastTabSwitchTime = 0;

  // Bộ đệm bản ghi lời nói (transcription) để gom thành 1 dòng log thay vì spam từng mảnh
  let senseiTranscript = "";
  let userTranscript = "";
  // Bài giảng có đang chạy trước khi học viên giơ tay không?
  // Dùng để biết có phải giảng tiếp sau khi bấm Hủy hay không.
  let lectureWasPlayingBeforeAsk = false;
  // Lời hứa đang chờ phiên sẵn sàng (bấm "Giảng bài" khi chưa kết nối)
  let pendingReady = null;
  let isConnecting = false;

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

  // Chưa kết nối thì không cho giơ tay hỏi bài
  if (raiseHandBtn) raiseHandBtn.disabled = true;

  // Key doc tu .env — khong con o nhap, cung khong con bang cau hinh de bao tin.
  const savedApiKey = senseiKey();
  console.info('[sensei] key .env:', savedApiKey ? 'da doc duoc' : 'THIEU GEMINI_KEY1');

  // Co danh dau Sensei dang noi mot cau NGOAI bai giang (cham bai / cham phat
  // am). Khai bao TRUOC AudioEngine vi callback am thanh ben duoi doc no.
  let senseiChenNgang = false;
  let chenNgangTimer = null;
  let dangThuAm = null;        // id cau luyen phat am dang thu, null = khong thu

  // Dan dien vien dang doc thoai qua loa (playDialogueLine). Khong tat hang
  // mic that su (cham, phai xin quyen lai) — chi tam ngung GUI tieng loa lai
  // cho Sensei nghe. Thieu buoc nay: may khong deo tai nghe se de mic bat lai
  // chinh giong nhan vat, Gemini tuong hoc vien dang noi va tu dung xen vao
  // giang giua luc nhan vat con dang thoai.
  let dangPhatGiongNhanVat = false;

  // 3. Audio Engine
  const audioEngine = new AudioEngine({
    onAudioChunk: (base64Pcm) => {
      if (dangPhatGiongNhanVat) return;
      geminiClient.sendRealtimeAudio(base64Pcm);
    },
    onPlayStateChange: (isPlaying, meta) => {
      setWaveformActive(isPlaying);

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
      if (!isPlaying && !boQua && (isAutoLectureActive || lectureState === 'PLAYING')) {
        checkAutoLectureStepComplete();
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
      if (audioEngine) audioEngine.stopPlayback();
      if (window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
    },
    onOpen: () => {
      updateConnectUI(true);
      updateMicUI(true, false);
    },
    // Server đã xác nhận cấu hình — từ giây này mới gửi được nội dung bài giảng
    onReady: () => {
      if (pendingReady) {
        const r = pendingReady; pendingReady = null;
        clearTimeout(r.timer);
        r.resolve();
      }
      updateSessionState();
    },
    onClose: () => {
      updateConnectUI(false);
      updateMicUI(false, false);
      updateSessionState();
      if (lectureState === 'PLAYING') {
        pauseLecture(false);
      }
      lectureState = 'IDLE';
      updateLectureControlsUI();
      audioEngine.cleanup();
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
    },
    onTranscript: (chunk) => {
      // Ghép thêm ~60 ký tự cũ để không hụt từ bị cắt đôi giữa hai mảnh,
      // nhưng KHÔNG quét lại toàn bộ bản ghi (sẽ rọi lại những từ đã đọc từ lâu).
      const overlap = senseiTranscript.slice(-60);
      senseiTranscript += chunk;
      const window_ = overlap + chunk;
      autoTrackSenseiSpeech(window_);
      detectAndSwitchTabFromIntent(window_, 'sensei');
    },
    onUserTranscript: (chunk) => {
      userTranscript += chunk;
    },
    // Model vẫn suy luận nội bộ, nhưng KHÔNG hiển thị ra giao diện nữa.
    onReasoning: () => {},
    onAudioData: (base64PcmChunk) => {
      audioEngine.playPCM24k(base64PcmChunk);
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
      // KHONG tat den o day khi dang giang bai.
      // Mot nhip thuong trai qua nhieu luot noi, va luc turnComplete ve thi loa
      // van con doc dở goi am thanh trong hang doi. Tat o day gay ra dung canh
      // "vua mo da tat" va "doc sang tu khac ma van sang tu cu".
      // Den chi tat khi: sang nhip khac, doi chuong/bai, hoac ket thuc bai giang.
      clearPendingFocus();
      if (lectureState !== 'PLAYING') {
        slideEngine.clearReadingFocus();
      }
      if (userTranscript.trim()) {
        addLog("Học viên", userTranscript.trim());
        userTranscript = "";
      }
      if (senseiTranscript.trim()) {
        addLog("Sensei", senseiTranscript.trim());
        senseiTranscript = "";
      }
      // Khi lượt nói của Gemini hoàn tất trên server
      if (isAutoLectureActive || lectureState === 'PLAYING') {
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
    const now = Date.now();
    if (now - lastTabSwitchTime < 2000) return; // Debounce 2s tránh giật nhảy tab liên tục

    const lower = text.toLowerCase();

    // Nhận diện từ khóa mang ý định chuyển/mở/quay lại
    const hasIntent = /(quay lại|xem lại|về phần|mở lại|nhìn vào|chuyển sang|mở phần|cho em xem|chúng ta cùng nhìn|chuyển qua|trở lại|về lại|về mục)/i.test(lower);
    if (!hasIntent) return;

    // 1. Phân môn Ngữ pháp (Grammar) với số slide cụ thể
    const slideMatch = lower.match(/(?:ngữ pháp|grammar|slide|mẫu câu)\s*(?:số\s*)?(\d+)/i);
    if (slideMatch && slideMatch[1]) {
      const targetSlide = Math.max(0, parseInt(slideMatch[1], 10) - 1);
      lastTabSwitchTime = now;
      slideEngine.setTab('grammar', targetSlide);
      lectureCheckpoint.sectionName = 'grammar';
      lectureCheckpoint.subIndex = targetSlide;
      addLog("System", `🔄 [Tự động chuyển tab]: Đã mở Slide ${targetSlide + 1} Ngữ pháp theo ngữ cảnh.`);
      return;
    }

    // 2. Phân môn Từ vựng (Vocab)
    if (/(?:từ vựng|vocab|từ mới|danh sách từ)/i.test(lower)) {
      lastTabSwitchTime = now;
      slideEngine.setTab('vocab');
      lectureCheckpoint.sectionName = 'vocab';
      lectureCheckpoint.subIndex = null;
      addLog("System", "🔄 [Tự động chuyển tab]: Đã chuyển sang tab Từ vựng theo ngữ cảnh.");
      return;
    }

    // 3. Phân môn Chữ Hán (Kanji)
    if (/(?:chữ hán|kanji|hán tự|bảng chữ hán)/i.test(lower)) {
      lastTabSwitchTime = now;
      slideEngine.setTab('kanji');
      lectureCheckpoint.sectionName = 'kanji';
      lectureCheckpoint.subIndex = null;
      addLog("System", "🔄 [Tự động chuyển tab]: Đã chuyển sang tab Chữ Hán theo ngữ cảnh.");
      return;
    }

    // 4. Phân môn Ngữ pháp chung (Grammar)
    if (/(?:ngữ pháp|grammar|cấu trúc câu|mẫu ngữ pháp)/i.test(lower)) {
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
      lastTabSwitchTime = now;
      slideEngine.setTab('kaiwa');
      lectureCheckpoint.sectionName = 'kaiwa';
      lectureCheckpoint.subIndex = null;
      addLog("System", "🔄 [Tự động chuyển tab]: Đã chuyển sang tab Hội thoại Kaiwa theo ngữ cảnh.");
      return;
    }

    // 6. Phân môn Bài tập (Quiz)
    if (/(?:bài tập|quiz|trắc nghiệm|luyện tập|câu hỏi ôn tập)/i.test(lower)) {
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
          keys: [(k.character || "").toLowerCase(), (k.hanViet || "").toLowerCase()]
                  .filter(x => x.length >= 1)
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

  // 5. Xử lý Function Calling (Tool Calls)
  function handleToolCall(call) {
    const { name, args, id } = call;
    addLog("Tool", `Gọi công cụ [${name}]: ${JSON.stringify(args)}`);

    if (name === "section_complete") {
      stepSignaledDone = true;
      return { success: true, acknowledged: args && args.section };
    }
    else if (name === "change_section") {
      const { section, sub_index } = args;
      slideEngine.setTab(section, sub_index !== undefined ? sub_index : null);
      return { success: true, activeSection: section, subIndex: sub_index };
    }
    else if (name === "change_slide") {
      const { level, lesson_id, slide_index } = args;
      const lvl = (level || "N5").toUpperCase();
      if (levelSelect) levelSelect.value = lvl;
      populateLessons(lvl, lesson_id);
      const success = slideEngine.renderSlide(lvl, lesson_id, slide_index);
      return { success: success, currentLevel: lvl, lesson: lesson_id, slide: slide_index };
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
      const lvl = (level || slideEngine.currentLevel).toUpperCase();
      if (levelSelect) levelSelect.value = lvl;
      populateLessons(lvl, lesson_id || slideEngine.currentLesson);
      slideEngine.openExercise(lvl, lesson_id || slideEngine.currentLesson, exercise_index || 0);

      // Khi đã mở phần bài tập, dừng tự động giục slide
      // KHÔNG tạm dừng ở đây: mở bài tập là MỘT BƯỚC của giáo án.
      // Chuyển sang PAUSED sẽ làm Sensei tắt tiếng giữa chừng.
      addLog("System", "Sensei đã mở bảng bài tập thực hành củng cố kiến thức!");
      return { success: true, openedQuiz: true, level: lvl, lesson: lesson_id };
    }
    else if (name === "mark_error") {
      const { wrong_phrase, corrected_phrase, explanation } = args;
      slideEngine.markError(wrong_phrase, corrected_phrase, explanation);
      return { success: true, marked: wrong_phrase };
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
      return { success: SenseiBoard.vietBang(text, style || 'thuong') };
    }
    else if (name === "clear_board") {
      if (window.SenseiBoard) SenseiBoard.xoaBang();
      return { success: true };
    }

    return { success: false, error: "Unknown tool call" };
  }

  // 6. Điều phối Chế độ Giảng bài Theo Kịch bản (Start / Pause / Resume / Raise Hand)
  function updateLectureControlsUI() {
    isAutoLectureActive = (lectureState === 'PLAYING');

    // 1. Cập nhật nút autoLectureBtn (Start / Pause / Resume)
    if (autoLectureBtn) {
      const currentStep = currentLectureSteps[currentLectureStepIndex];
      const chapter = currentStep ? CHAPTER_LABEL[currentStep.chapter] : null;

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
    }

    // 2. Nút giơ tay (ẩn khi đang thu âm — lúc đó hiện Gửi/Hủy)
    if (raiseHandBtn) {
      raiseHandBtn.className = "ctl ctl-warn";
      if (raiseHandIcon) raiseHandIcon.className = "fa-solid fa-hand";
      if (raiseHandText) raiseHandText.innerText = "Giơ tay hỏi";
      raiseHandBtn.disabled = !geminiClient.isConnected;
      raiseHandBtn.classList.toggle('hidden', isRaisingHand);
    }
    if (askSendBtn) askSendBtn.classList.toggle('hidden', !isRaisingHand);
    if (askCancelBtn) askCancelBtn.classList.toggle('hidden', !isRaisingHand);
  }

  // Tương thích ngược với các lời gọi cũ
  function updateAutoLectureUI(active, statusText = null) {
    if (active) {
      lectureState = 'PLAYING';
    } else if (lectureState === 'PLAYING') {
      lectureState = 'PAUSED';
    }
    updateLectureControlsUI();
  }

  function cancelStepTransition() {
    clearPendingFocus();
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

    // --- Chương 2: Chữ Hán ---
    const kanjis = lesson.kanjiList || [];
    kanjis.forEach((k, i) => add({
      chapter: 'kanji', tab: 'kanji', kind: 'kanji',
      targetId: k.id, data: k,
      label: `Chữ Hán ${i + 1}/${kanjis.length}`,
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
    const head = `[LỚP ${lvl} — ${lesson.title}] [${beat.label}]`;
    const common =
      '\n\nDẶN SENSEI: Màn hình đã tự phóng to đúng mục này rồi nên KHÔNG cần gọi highlight_element. ' +
      'Nhưng BẢNG thì vẫn là của thầy: cứ dùng write_on_board / write_kanji / draw_on_board ' +
      'khi có thứ đáng cho học viên NHÌN chứ không chỉ nghe. ' +
      'Chỉ giảng DUY NHẤT mục này rồi dừng — hệ thống sẽ tự chuyển sang mục kế tiếp. ' +
      'Tuyệt đối không giảng lướt sang mục khác, không đọc lại danh sách.';

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
        SenseiBoard.xoaBang();
        SenseiBoard.vietBang(sl.title || 'Mẫu câu', 'nhat');
        SenseiBoard.vietBang(sl.grammarFormula, 'dam');
        if (sl.teacherTips) SenseiBoard.vietBang('⚠ ' + sl.teacherTips, 'nhat');
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
        .map(c => `${c.speaker} (${c.genderVi})`).join(', ');
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
      const lines = beat.data.map(d => `${d.speaker}: 「${(d.tokens || []).map(t => t.kanji || t.text).join('')}」`).join('\n');
      return `${head}
Đọc TRỌN đoạn hội thoại sau một mạch, đóng đủ các vai, không dừng giữa chừng,
không dịch, không giải thích — để học viên nghe cảm giác hội thoại thật:
${lines}

Đổi chất giọng giữa các vai cho phân biệt được nam/nữ.${common}`;
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
    currentStepStartTime = Date.now();
    currentStepRetryCount = 0;
    cancelStepTransition();

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

    // 2. Rọi đèn vào ĐÚNG mục sắp giảng.
    //    Client tự làm nên luôn khớp — không còn phụ thuộc Sensei gọi tool hay
    //    dò theo transcript. Cũng khoá bộ bám transcript lại để khỏi chen ngang.
    lastToolFocusAt = Date.now();
    clearPendingFocus();
    if (beat.targetId) {
      slideEngine.focusItem(beat.targetId, 'reading_focus');
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
      geminiClient.sendUserMessage(prompt);
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
      slideEngine.focusItem(beat.targetId, 'reading_focus');
      audioEngine.stopPlayback();
      playDialogueLine(beat.data)
        .then(() => new Promise(r => setTimeout(r, 300)))
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
        daDungGiong: dia.filter(d => dialogueAudio[d.id]).length,
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
      (curriculumLoader.getDialogue(lvl, no) || []).forEach(d => delete dialogueAudio[d.id]);
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
  };

  function finishLecture() {
    if (audioEngine) audioEngine.setSuppressed(false);
    lectureState = 'IDLE';
    isAutoLectureActive = false;
    cancelStepTransition();
    slideEngine.clearReadingFocus();
    updateLectureControlsUI();
    if (nextStepBtn) nextStepBtn.classList.add('hidden');
    showToast('Đã học xong toàn bộ bài. Mời bạn làm bài tập để kiểm tra lại!');
  }

  function checkAutoLectureStepComplete() {
    if (lectureState !== 'PLAYING' || !geminiClient.isConnected) return;
    if (isRaisingHand) return;
    if (senseiChenNgang) return;   // dang cham bai / cham phat am, chua ve nhip

    // Nhịp do client tự phát (nghe trọn đoạn hội thoại) tự lo việc chuyển nhịp
    const cur = currentLectureSteps[currentLectureStepIndex];
    if (cur && cur.clientOnly) return;

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

    if (currentLectureStepIndex >= currentLectureSteps.length - 1) {
      finishLecture();
      return;
    }

    scheduleAutoNextStep();
  }

  function scheduleAutoNextStep() {
    cancelStepTransition();

    const nextIdx = currentLectureStepIndex + 1;
    if (nextIdx >= currentLectureSteps.length) {
      finishLecture();
      return;
    }

    const next = currentLectureSteps[nextIdx];

    if (nextStepBtn) {
      nextStepBtn.className = 'ctl ctl-next';
      if (nextStepText) nextStepText.textContent = next.isChapterStart
        ? `Sang ${CHAPTER_LABEL[next.chapter]}`
        : 'Tiếp theo';
      nextStepBtn.onclick = () => {
        cancelStepTransition();
        executeLectureStep(nextIdx);
      };
    }

    // Nhịp nhỏ nên đệm ngắn; sang chương mới thì nghỉ lâu hơn một chút
    const gap = next.isChapterStart ? 1600 : 700;
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

  function startLecture(forceStepIndex = null) {
    if (audioEngine) audioEngine.ensureOutContext();

    const lvl = slideEngine.currentLevel;
    const lessonNum = slideEngine.currentLesson;
    currentLectureSteps = buildLecturePlan(lvl, lessonNum);

    if (!currentLectureSteps.length) {
      showToast('Không tìm thấy giáo án của bài này.', 'error');
      return;
    }

    const startIdx = (forceStepIndex !== null && forceStepIndex >= 0 && forceStepIndex < currentLectureSteps.length)
      ? forceStepIndex
      : firstBeatOfCurrentView();

    lectureState = 'PLAYING';
    isAutoLectureActive = true;
    updateLectureControlsUI();

    const b = currentLectureSteps[startIdx];
    showToast(`Bắt đầu giảng từ: ${CHAPTER_LABEL[b.chapter]} — ${b.label}`);
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

    lectureState = 'PAUSED';
    isAutoLectureActive = false;
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
      const stepIdx = Math.min(Math.max(0, lectureCheckpoint.stepIndex), currentLectureSteps.length - 1);
      lectureState = 'PLAYING';
      isAutoLectureActive = true;
      updateLectureControlsUI();
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
        isConnecting = false;
        updateSessionState();
        updateLectureControlsUI();
        reject(new Error('timeout'));
      }
    }, 20000);
    pendingReady = { resolve, reject, timer, promise };

    promise.then(() => { isConnecting = false; updateSessionState(); })
           .catch(() => { isConnecting = false; updateSessionState(); });

    try {
      geminiClient.connect(key, model, voice);
    } catch (err) {
      clearTimeout(timer);
      pendingReady = null;
      isConnecting = false;
      updateSessionState();
      return Promise.reject(err);
    }
    return promise;
  }

  async function handleAutoLectureClick() {
    if (lectureState === 'PLAYING') {
      pauseLecture(true);
      return;
    }
    if (isConnecting) return;

    try {
      await ensureConnected();
    } catch (err) {
      if (err && err.message === 'timeout') {
        showToast('Không vào được lớp — kiểm tra lại API Key và mạng.', 'error', 6000);
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
    isRaisingHand = false;
    if (audioEngine.isMicActive) audioEngine.stopMic();
    geminiClient.sendTurnComplete();
    updateAskUI();
    updateLectureControlsUI();
    showToast('Đã gửi câu hỏi — Sensei đang giải đáp cho bạn…');
  }

  // Bấm "Hủy": bỏ câu hỏi, Sensei giảng tiếp từ chỗ đang dở
  function cancelQuestion() {
    if (!isRaisingHand) return;
    if (audioEngine) audioEngine.setSuppressed(false);
    isRaisingHand = false;
    if (audioEngine.isMicActive) audioEngine.stopMic();
    updateAskUI();
    stopAllAudio();

    if (lectureWasPlayingBeforeAsk) {
      lectureWasPlayingBeforeAsk = false;
      showToast('Đã hủy câu hỏi — Sensei giảng tiếp.');
      resumeLecture();
    } else {
      updateLectureControlsUI();
      showToast('Đã hủy câu hỏi.');
    }
  }

  async function handleRaiseHandClick() {
    try {
      await ensureConnected();
    } catch (err) { return; }
    if (isRaisingHand) return;

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
      tabDisplayName = "Chữ Hán Kanji";
      const kanjis = curriculumLoader.getKanjiList(lvl, lessonNum);
      screenContent = kanjis.map((k, i) => `${i + 1}. [${k.character}] (${k.hanViet}): ${k.meaningVi} (On: ${(k.onyomi || []).join(', ')} | Kun: ${(k.kunyomi || []).join(', ')})`).join('\n');
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
    }

    const contextPrompt = `[HỌC SINH GIƠ TAY CÓ Ý KIẾN / ĐẶT CÂU HỎI TRONG LỚP]
Sensei ơi! Em vừa bấm nút 'Giơ tay có ý kiến' ✋ để hỏi thầy/cô về bài học.
Toàn bộ bài giảng đã được tạm dừng.
DƯỚI ĐÂY LÀ NỘI DUNG MÀN HÌNH BÀI HỌC EM ĐANG NHÌN THẤY:
- Cấp độ & Bài: ${lvl} - Bài ${lessonNum}: ${lesson.title || ''}
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
    try {
      await audioEngine.startMic();
      updateMicUI(true, true);
      addLog("System", "✋ Bạn đã giơ tay hỏi bài! Bài giảng đã tạm dừng. Mic đã bật — nói câu hỏi xong hãy bấm lại nút để gửi cho Sensei!");
    } catch (err) {
      isRaisingHand = false;
      updateAskUI();
      updateLectureControlsUI();
      addLog("Error", "Không thể mở Microphone: " + err.message);
    }
  }

  function handleManualTabChange(section, subIndex = null) {
    if (dangThuAm) huyThuAm();   // dang thu am ma doi tab -> tat mic di
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
      if (idx !== -1) {
        // Nguoi hoc chu dong doi chuong -> khong "hoc tiep" o cho cu nua,
        // ma bat dau lai tu DAU chuong vua chon.
        lectureCheckpoint.stepIndex = idx;
        lectureCheckpoint.sectionName = section;
        lectureCheckpoint.subIndex = subIndex;
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
  }

  /**
   * @param {string} loiNhac  Lenh gui cho Sensei
   * @param {number} hanGiay  Sau chung nay giay ma Sensei van chua noi gi thi
   *                          tu go co, de bai giang khong bi ket cung.
   */
  function senseiNoiNgoaiBai(loiNhac, hanGiay = 30) {
    if (!loiNhac) return false;
    if (!geminiClient.isConnected || !geminiClient.isSetupComplete) return false;

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
{"roast": "câu nhận xét hài hước", "tip": "câu giải thích ngắn gọn"}`;

      // REST: model Live khong sinh duoc chu (ma 1007). Hong thi dung cau soan san.
      const out = await callTextModel(key, SENSEI_MODELS.roast, prompt, 400);
      if (out.ok && out.items && out.items.roast && out.items.tip) return out.items;
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
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

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
      if (btn) {
        btn.classList.remove('bg-slate-900/90', 'border-slate-800');
        btn.classList.add('bg-emerald-950/80', 'border-emerald-500', 'text-emerald-300', 'font-bold');
      }
      if (icon) {
        icon.className = "fa-solid fa-circle-check text-emerald-400 opacity-100 text-sm";
      }
      addLog("Học viên", `Đã chọn đáp án ${String.fromCharCode(65 + chosenIdx)} - [Chính xác]`);
    } else {
      streakWrongCount++;
      streakCorrectCount = 0;
      if (card) {
        card.classList.remove('hl-card-grammar', 'border-slate-800');
        card.classList.add('hl-card-warning', 'roast-shake');
      }
      if (btn) {
        btn.classList.remove('bg-slate-900/90', 'border-slate-800');
        btn.classList.add('bg-rose-950/80', 'border-rose-500', 'text-rose-300', 'font-bold');
      }
      if (icon) {
        icon.className = "fa-solid fa-circle-xmark text-rose-400 opacity-100 text-sm";
      }

      // Tô viền xanh nhẹ đáp án đúng để học viên học hỏi
      const correctBtn = document.getElementById(`btn-opt-${exerciseId}-${correctIdx}`);
      if (correctBtn) {
        correctBtn.classList.add('border-emerald-500/80', 'bg-emerald-950/30');
      }

      // Hiển thị thanh cảnh báo câu sai
      if (slideEngine && slideEngine.highlightNotice) {
        slideEngine.highlightNotice.innerHTML = `
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs shadow-md animate-zoom-in">
            <i class="fa-solid fa-triangle-exclamation text-rose-400"></i>
            <span>⚠️ Chú ý câu sai: Xem lại đáp án đúng và lời nhắc của Sensei bên dưới!</span>
          </span>
        `;
      }

      addLog("Học viên", `Đã chọn đáp án ${String.fromCharCode(65 + chosenIdx)} - [Chưa chính xác] (Đã sai ${streakWrongCount} câu liên tiếp)`);
    }

    if (explainBox) {
      explainBox.className = "p-3 rounded-xl text-xs bg-slate-900/90 border border-slate-700 text-slate-300 flex items-center gap-2 slide-fade-enter";
      explainBox.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin text-indigo-400"></i>
        <span>Sensei đang chấm bài và nghĩ văn cà khịa...</span>
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

      if (isCorrect) {
        explainBox.className = "p-3.5 rounded-xl text-xs bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 slide-fade-enter space-y-2";
        explainBox.innerHTML = `
          <div class="flex items-center justify-between font-bold text-emerald-300">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono">
                🎉 SENSEI TUNG HÔ (ĐÚNG ${streakCorrectCount} CÂU LIÊN TIẾP)
              </span>
            </div>
            <button type="button" data-roast-speak="1" class="w-6 h-6 rounded-md bg-emerald-900/70 hover:bg-emerald-900 text-emerald-300 flex items-center justify-center transition cursor-pointer active:scale-95" title="Nghe Sensei khen">
              <i class="fa-solid fa-volume-high text-xs"></i>
            </button>
          </div>
          <p class="text-sm font-semibold text-emerald-100 italic font-sans leading-relaxed">"${safeRoast}"</p>
          <div class="pt-1.5 border-t border-emerald-500/20 text-[11px] text-slate-300">
            <strong>💡 Giải thích ngữ pháp:</strong> ${safeTip}
          </div>
        `;
      } else if (streakWrongCount >= 3) {
        explainBox.className = "p-4 rounded-xl text-xs bg-rose-950/60 border-2 border-rose-500 text-rose-200 roast-shake flame-border slide-fade-enter space-y-2";
        explainBox.innerHTML = `
          <div class="flex items-center justify-between font-bold text-rose-300">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-md bg-rose-600 text-white font-bold text-[11px] tracking-wider animate-pulse flex items-center gap-1.5 shadow-md shadow-rose-600/50">
                <i class="fa-solid fa-fire"></i> SENSEI BỐC HỎA / CHỬI YÊU (SAI ${streakWrongCount} CÂU LIÊN TIẾP!)
              </span>
            </div>
            <button type="button" data-roast-speak="1" class="w-7 h-7 rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition cursor-pointer active:scale-95 shadow-md" title="Nghe Sensei mắng thành tiếng">
              <i class="fa-solid fa-volume-high text-xs"></i>
            </button>
          </div>
          <p class="text-sm md:text-base font-extrabold text-rose-100 italic font-sans leading-relaxed bg-rose-900/30 p-2.5 rounded-lg border border-rose-500/30">"${safeRoast}"</p>
          <div class="pt-1.5 border-t border-rose-500/30 text-xs text-slate-200">
            <strong class="text-amber-300">💡 Sensei gõ đầu giảng lại:</strong> ${safeTip}
          </div>
        `;
      } else {
        explainBox.className = "p-3.5 rounded-xl text-xs bg-amber-950/40 border border-amber-500/50 text-amber-200 slide-fade-enter space-y-2";
        explainBox.innerHTML = `
          <div class="flex items-center justify-between font-bold text-amber-300">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono">
                🧐 SENSEI CÀ KHỊA (ĐÁP ÁN ĐÚNG LÀ ${String.fromCharCode(65 + correctIdx)})
              </span>
            </div>
            <button type="button" data-roast-speak="1" class="w-6 h-6 rounded-md bg-amber-900/70 hover:bg-amber-900 text-amber-300 flex items-center justify-center transition cursor-pointer active:scale-95" title="Nghe Sensei cà khịa">
              <i class="fa-solid fa-volume-high text-xs"></i>
            </button>
          </div>
          <p class="text-sm font-semibold text-amber-100 italic font-sans leading-relaxed">"${safeRoast}"</p>
          <div class="pt-1.5 border-t border-amber-500/20 text-[11px] text-slate-300">
            <strong>💡 Sensei nhắc bài:</strong> ${safeTip}
          </div>
        `;
      }
      // Gắn sự kiện cho nút "nghe Sensei nói" sau khi đã render xong HTML
      const roastSpeakBtn = explainBox.querySelector('[data-roast-speak]');
      if (roastSpeakBtn) {
        roastSpeakBtn.addEventListener('click', () => window.playSpeechRoast(aiResult.roast || ""));
      }

      // Chon SAI thi Sensei len tieng ngay, khong doi bam nut. Dung chinh phien
      // Live dang mo nen van la giong quen va van nho ngu canh bai hoc.
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

Nói tiếng Việt tự nhiên; phần tiếng Nhật phải phát âm chuẩn giọng Nhật. Không nói "chào em", không tóm tắt lại đề.`);

        if (!noi) {
          // Chua vao lop duoc thi van con giong may cua trinh duyet
          window.playSpeechRoast(`${aiResult.roast || ''}. ${aiResult.tip || ''}`);
        }
      }

      try {
        explainBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (e) {}
    }
  };

  // 8. UI Handlers
  window.toggleConnection = () => {
    // Mở khóa AudioContext ngay trong thao tác click của người dùng
    if (audioEngine) {
      audioEngine.ensureOutContext();
    }

    if (geminiClient.isConnected) {
      geminiClient.disconnect();
      audioEngine.cleanup();
      updateAutoLectureUI(false);
    } else {
      const key = senseiKey();
      if (!key) { showToast('Chưa đọc được key từ .env', 'info', 8000); return; }
      const model = SENSEI_MODELS.sensei;
      const voice = SENSEI_VOICE;

      try {
        geminiClient.connect(key, model, voice);
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  };

  const micVolumeWrapper = document.getElementById('micVolumeWrapper');
  const micVolumeBar = document.getElementById('micVolumeBar');
  const micVolumePercent = document.getElementById('micVolumePercent');

  function updateLiveMicVolume(volume) {
    if (micVolumeBar) micVolumeBar.style.width = `${volume}%`;
    if (micVolumePercent) micVolumePercent.innerText = `${volume}%`;

    if (audioEngine && audioEngine.isMicActive && micStatusText) {
      micStatusText.innerText = volume > 6 ? 'Đang nghe bạn nói…' : 'Đang thu âm câu hỏi…';
    }
  }

  window.toggleMic = async () => {
    if (audioEngine) {
      audioEngine.ensureOutContext();
    }

    if (!geminiClient.isConnected) {
      showToast("Cần bấm 'Bắt đầu phiên' trước khi mở Microphone.", 'error');
      return;
    }

    if (audioEngine.isMicActive) {
      audioEngine.stopMic();
      updateMicUI(true, false);
      geminiClient.sendTurnComplete();
      addLog("System", "Đã tắt Microphone và gửi câu hỏi. Sensei đang xử lý câu trả lời...");
    } else {
      try {
        await audioEngine.startMic();
        updateMicUI(true, true);
        addLog("System", "Microphone đang mở (16kHz PCM). Bạn có thể nói để đàm thoại hoặc ngắt lời Sensei.");
      } catch (err) {
        showToast("Không thể khởi động Microphone: " + err.message, 'error', 6000);
      }
    }
  };

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

  function updateConnectUI(connected) {
    if (connectBtn) connectBtn.classList.toggle('is-live', connected);
    if (connectIcon) connectIcon.className = connected ? "fa-solid fa-power-off" : "fa-solid fa-plug";
    if (connectText) connectText.innerText = connected ? "Ngắt phiên" : "Bắt đầu phiên";
    if (raiseHandBtn) raiseHandBtn.disabled = !connected;
  }

  // Không còn nút mic riêng: mic chỉ mở trong lúc học viên giơ tay hỏi bài.
  // Hàm này giờ chỉ điều khiển dải "đang thu âm" ở thanh dưới.
  function updateMicUI(canUse, isRecording) {
    if (micVolumeWrapper) {
      micVolumeWrapper.classList.toggle('hidden', !isRecording);
    }
    if (!isRecording) {
      if (micVolumeBar) micVolumeBar.style.width = '0%';
      if (micVolumePercent) micVolumePercent.innerText = '0%';
      if (micStatusText) micStatusText.innerText = 'Đang thu âm câu hỏi…';
    }
    if (raiseHandBtn) raiseHandBtn.disabled = !canUse;
  }

  function setWaveformActive(active) {
    const bars = document.querySelectorAll('.wave-bar');
    bars.forEach(b => {
      if (active) {
        b.classList.add('active', 'bg-indigo-400');
      } else {
        b.classList.remove('active', 'bg-indigo-400');
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

  function addLog(sender, text) {
    if (sender === 'Error') {
      showToast(String(text), 'error', 6500);
      return;
    }
    console.debug('[' + sender + ']', text);
    if (true) return;
    const item = document.createElement('div');
    item.className = "p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1";

    let headerBadge = "";
    if (sender === "Sensei") {
      headerBadge = '<span class="text-emerald-400 font-bold flex items-center gap-1.5"><i class="fa-solid fa-user-graduate"></i> Sensei:</span>';
    } else if (sender === "Học viên") {
      headerBadge = '<span class="text-indigo-400 font-bold flex items-center gap-1.5"><i class="fa-solid fa-microphone"></i> Học viên:</span>';
    } else if (sender === "Thinking") {
      headerBadge = '<span class="text-amber-400 italic font-semibold flex items-center gap-1.5"><i class="fa-solid fa-brain"></i> Interleaved Reasoning:</span>';
    } else if (sender === "Tool") {
      headerBadge = '<span class="text-purple-400 font-bold flex items-center gap-1.5"><i class="fa-solid fa-wand-magic-sparkles"></i> Function Calling:</span>';
    } else if (sender === "Barge-in") {
      headerBadge = '<span class="text-rose-400 font-bold flex items-center gap-1.5"><i class="fa-solid fa-bolt"></i> Barge-in Triggered:</span>';
    } else {
      headerBadge = `<span class="text-slate-400 font-semibold flex items-center gap-1.5"><i class="fa-solid fa-circle-info"></i> ${sender}:</span>`;
    }

    item.innerHTML = `
      <div class="flex items-center justify-between">
        ${headerBadge}
        <span class="text-[10px] text-slate-500 font-mono">${new Date().toLocaleTimeString()}</span>
      </div>
      <div class="text-slate-300 whitespace-pre-wrap leading-relaxed">${escapeHtml(text)}</div>
    `;

    logArea.appendChild(item);
    logArea.scrollTop = logArea.scrollHeight;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // 10. Chat Input & Quick Action Prompts
  function handleSendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    if (!geminiClient.isConnected) {
      showToast("Cần kết nối phiên trước khi gửi câu hỏi.", 'error');
      return;
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
      const enrichedMsg = `[CÂU HỎI TỪ HỌC VIÊN KHI ĐANG HỌC BÀI ${lvl} - BÀI ${lessonNum} (${tabName})]:
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
      if (e.key === 'Enter') handleSendMessage();
    });
  }

  // Quick Action Buttons
  document.querySelectorAll('.quick-prompt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const promptText = btn.getAttribute('data-prompt');
      if (promptText) {
        if (!geminiClient.isConnected) {
          alert("Vui lòng bấm 'Bắt đầu phiên' trước khi gửi câu hỏi mẫu.");
          return;
        }
        cancelStepTransition();
        if (lectureState === 'PLAYING') {
          pauseLecture(false);
        }
        geminiClient.sendUserMessage(promptText);
        addLog("Học viên", promptText);
      }
    });
  });

  // Manual Navigation & Listeners
  if (levelSelect) {
    levelSelect.addEventListener('change', (e) => {
      const selectedLevel = e.target.value;
      if (lectureState === 'PLAYING') pauseLecture(false);
      lectureState = 'IDLE';
      updateLectureControlsUI();
      // N4 bắt đầu từ bài 26 chứ không phải bài 1 -> phải lấy số bài thực tế,
      // nếu không nhãn hiện "Bài 1" trong khi nội dung là bài 26.
      const firstLesson = (curriculumLoader.getLessonsForLevel(selectedLevel) || [])[0];
      const firstNum = firstLesson ? firstLesson.lessonNumber : 1;
      populateLessons(selectedLevel, firstNum);
      slideEngine.renderSlide(selectedLevel, firstNum, 0);
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
      if (lectureState === 'PLAYING') pauseLecture(false);
      lectureState = 'IDLE';
      updateLectureControlsUI();
      stopAllAudio();
      slideEngine.renderSlide(lvl, chosenLessonNum, 0);
    });
  }

  const tabVocabBtn = document.getElementById('tabVocabBtn');
  const tabKanjiBtn = document.getElementById('tabKanjiBtn');
  const tabGrammarBtn = document.getElementById('tabGrammarBtn') || document.getElementById('tabSlideBtn');
  const tabKaiwaBtn = document.getElementById('tabKaiwaBtn');

  if (tabVocabBtn) tabVocabBtn.addEventListener('click', () => handleManualTabChange('vocab'));
  if (tabKanjiBtn) tabKanjiBtn.addEventListener('click', () => handleManualTabChange('kanji'));
  if (tabGrammarBtn) tabGrammarBtn.addEventListener('click', () => handleManualTabChange('grammar', slideEngine.currentSlideIndex || 0));
  if (tabKaiwaBtn) tabKaiwaBtn.addEventListener('click', () => handleManualTabChange('kaiwa'));
  if (tabQuizBtn) tabQuizBtn.addEventListener('click', () => handleManualTabChange('quiz'));

  if (prevSlideBtn) prevSlideBtn.addEventListener('click', () => {
    if (lectureState === 'PLAYING') pauseLecture(false);
    stopAllAudio();
    slideEngine.prevSlide();
    lectureCheckpoint.sectionName = 'grammar';
    lectureCheckpoint.subIndex = slideEngine.currentSlideIndex;
    updateLectureControlsUI();
  });
  if (nextSlideBtn) nextSlideBtn.addEventListener('click', () => {
    if (lectureState === 'PLAYING') pauseLecture(false);
    stopAllAudio();
    slideEngine.nextSlide();
    lectureCheckpoint.sectionName = 'grammar';
    lectureCheckpoint.subIndex = slideEngine.currentSlideIndex;
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
  const dialogueAudioInFlight = {};
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
    // Boc mot lop chi de chac chan tat duoc lop cho: ben trong co toi bon
    // duong thoat (doi model, tam roi lop, loi vinh vien, xong xuoi).
    try {
      return await chayLongTieng(lvl, lessonNum, opts);
    } finally {
      datCho('kaiwa', null);
    }
  }

  async function chayLongTieng(lvl, lessonNum, opts = {}) {
    if (ttsDisabled) return;
    if (!window.SenseiVoices || !window.VoiceActorPool) return;
    const keys = allKeys();
    if (!keys.length) return;

    const dialogue = curriculumLoader.getDialogue(lvl, lessonNum) || [];
    if (!dialogue.length) return;

    // Gom cac luot thoai theo giong.
    const byVoice = new Map();
    for (const line of dialogue) {
      if (dialogueAudio[line.id]) continue;
      const jp = (line.tokens || []).map(t => t.kanji || t.text).join('');
      if (!jp.trim()) continue;
      const voice = window.SenseiVoices.voiceFor(line.speaker, line.speakerGender);
      if (!byVoice.has(voice)) byVoice.set(voice, []);
      byVoice.get(voice).push({ line, jp });
    }
    const voices = [...byVoice.keys()];
    const todo = [...byVoice.values()].reduce((n, a) => n + a.length, 0);
    if (!todo) return;

    // Co tu 2 giong VA tu 2 key tro len: giao moi giong mot key (vong tron),
    // cac KHOI o KHAC KEY chay SONG SONG — gioi han "so phien Live dong thoi"
    // la tinh THEO TUNG KEY (tai khoan), khong phai toan cuc, nen nhieu key
    // thi chay cung luc ma khong cham tran mã 1000. Chi 1 giong hoac 1 key
    // thi dung mot khoi tuan tu don, chinh la duong cu da kiem chung ky.
    const dungSongSong = voices.length > 1 && keys.length > 1;

    // Long tieng la viec nen tu dong, hoc vien khong can thay tien trinh noi
    // bo nay tren man hinh — chi ghi console de chan doan khi can.
    console.log(dungSongSong
      ? `[long tieng] bắt đầu ${todo} lượt thoại, ${voices.length} giọng `
        + `(song song trên ${Math.min(keys.length, voices.length)} tài khoản)`
      : `[long tieng] bắt đầu ${todo} lượt thoại, ${voices.length} giọng`);

    let made = 0;
    const ketQua = { permanentFail: false, sessionLimitHit: false };

    /**
     * Doc het loi cua MOT nhom giong, tuan tu trong nhom (dung nhu duong cu).
     * candidateKeys: cac key duoc phep thu cho nhom nay, theo dung thu tu —
     * nhom song song chi nhan DUNG MOT key (khong tranh voi nhom khac); nhom
     * don (khong song song) nhan CA DANH SACH de con xoay key khi het quota.
     */
    async function chayNhom(candidateKeys, danhSachGiong) {
      let keyIdx = 0, modelIdx = 0;
      const moPool = () => new VoiceActorPool({ apiKey: candidateKeys[keyIdx], model: ACTOR_MODELS[modelIdx] });
      let pool = moPool();
      if (dungSongSong) actorPools.set(candidateKeys[0], pool); else actorPool = pool;

      for (const voice of danhSachGiong) {
        if (slideEngine.currentLevel !== lvl || slideEngine.currentLesson !== Number(lessonNum)) break;

        for (const { line, jp } of byVoice.get(voice)) {
          if (dialogueAudio[line.id]) { made++; continue; }
          datCho('kaiwa', `Đang lồng tiếng ${made + 1}/${todo} lượt thoại…`,
            `${line.speaker || 'Nhân vật'} — giọng ${voice}.`
            + (dungSongSong ? ' Đang chạy song song nhiều giọng trên nhiều tài khoản.'
                            : ' Mỗi nhân vật một giọng riêng nên phải dựng lần lượt.'));

          // Thu lai vai lan: loi WebSocket nhat thoi rat hay gap khi phien vua
          // bat tay xong. Bo cuoc ngay lan dau la ca buoi mat giong nhan vat.
          let res = null;
          for (let attempt = 1; attempt <= 3; attempt++) {
            res = await pool.speak(voice, jp);
            if (res.ok) break;
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
        }

        pool.close(voice);   // xong giong nay thi dong phien lai roi moi sang giong ke
      }
    }

    if (dungSongSong) {
      const nhom = new Map();     // key -> [giong,...], chia vong tron
      voices.forEach((voice, i) => {
        const key = keys[i % keys.length];
        if (!nhom.has(key)) nhom.set(key, []);
        nhom.get(key).push(voice);
      });
      await Promise.all([...nhom.entries()].map(([key, ds]) => chayNhom([key], ds)));
    } else {
      await chayNhom(keys, voices);
    }

    // Xu ly hau ky CHUNG cho ca hai duong chay.
    if (ketQua.sessionLimitHit && !soloRetryDone
        && geminiClient.isConnected && lectureState !== 'PLAYING') {
      soloRetryDone = true;
      closeAllActorPools();
      ttsDisabled = false;
      showToast('Tạm rời lớp một lát để lồng tiếng hội thoại…');
      geminiClient.disconnect();
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

    for (const line of dialogue) {
      if (lectureState !== 'PLAYING' || currentLectureStepIndex !== stepIndex) return false;
      lastToolFocusAt = Date.now();
      slideEngine.focusItem(line.id, 'reading_focus');
      const played = await playDialogueLine(line);
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
    if (s) slideEngine.setBusy(true, s.title, s.note);
    else slideEngine.setBusy(false);
  }

  function khiDoiTab(tab) {
    veLaiCho();
    // Chi soan de khi nguoi hoc thuc su mo chuong Bai tap — de khong dot han
    // muc vao nhung bai ho chi luot qua.
    if (tab === 'quiz') {
      prefetchGeneratedQuiz(slideEngine.currentLevel, slideEngine.currentLesson);
    }
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
    btn.className = dangThu
      ? 'w-9 h-9 rounded-lg bg-rose-600 hover:bg-rose-700 border border-rose-400 text-white flex items-center justify-center transition cursor-pointer active:scale-95 animate-pulse'
      : 'w-9 h-9 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 flex items-center justify-center transition cursor-pointer active:scale-95';
    btn.innerHTML = dangThu
      ? '<i class="fa-solid fa-stop text-xs"></i>'
      : '<i class="fa-solid fa-microphone text-xs"></i>';
    btn.title = dangThu ? 'Đang thu — bấm để gửi cho Sensei chấm' : 'Bấm để thu âm';
  }

  // Ten class viet san tung bo — KHONG ghep chuoi, vi Tailwind quet ten class
  // theo van ban nen ten ghep tu bien co the khong duoc sinh style.
  const MAU_TIN = {
    cyan:  'bg-cyan-950/40 border-cyan-500/40 text-cyan-200',
    rose:  'bg-rose-950/40 border-rose-500/40 text-rose-200',
    amber: 'bg-amber-950/40 border-amber-500/40 text-amber-200',
  };

  function veTinPhatAm(id, html, mau = 'cyan') {
    const box = document.getElementById('kq-' + id);
    if (!box) return;
    box.className = 'p-2.5 rounded-xl text-xs border flex items-center gap-2 slide-fade-enter '
      + (MAU_TIN[mau] || MAU_TIN.cyan);
    box.innerHTML = html;
  }

  window.thuAmPhatAm = async (id) => {
    // Bam lan hai tren chinh cau dang thu = ket thuc, gui cho Sensei cham
    if (dangThuAm === id) return ketThucThuAm();
    // Dang thu cau khac ma bam sang cau moi: bo ban thu do di
    if (dangThuAm) huyThuAm();

    const cau = timCauPhatAm(id);
    if (!cau) return;

    if (!geminiClient.isConnected || !geminiClient.isSetupComplete) {
      veTinPhatAm(id, '<i class="fa-solid fa-plug"></i><span>Chưa vào lớp được nên chưa chấm phát âm được. Thử tải lại trang.</span>', 'amber');
      return;
    }

    // Dang giang bai thi dung lai da, khong de hai giong chong len nhau
    if (lectureState === 'PLAYING') pauseLecture(false);
    stopAllAudio();
    audioEngine.setSuppressed(false);

    // Nap ngu canh TRUOC, chua ket thuc luot -> Sensei im lang cho hoc vien doc
    geminiClient.sendContextNote(`[KIỂM TRA PHÁT ÂM — HỌC VIÊN SẮP ĐỌC TO MỘT CÂU]
Câu học viên phải đọc: ${cau.jp}
Nghĩa: ${cau.meaningVi}
Câu này lấy từ ${cau.tuBai === slideEngine.currentLesson ? 'chính bài đang học' : 'bài ' + cau.tuBai + ' đã học trước đó'}.

Nghe xong tiếng nó đọc thì CHẤM ngay, theo đúng thứ tự:
1. Phán một câu thật xấc về màn đọc vừa rồi. Đọc tốt thì hạ giọng "tớ/cậu" khen một câu ngắn; đọc sai be bét thì cứ chửi thẳng.
2. Chỉ ĐÍCH DANH chỗ sai: âm nào sai, trường âm (おばさん/おばあさん), âm ngắt っ, âm mũi ん, hay pitch accent lên xuống sai chỗ. Nói cụ thể, đừng chê chung chung.
3. Đọc mẫu lại CẢ CÂU thật chậm và chuẩn giọng Tokyo, rồi bảo nó đọc theo.
Nếu nó đọc sai hẳn thì gọi tool mark_error(wrong_phrase, corrected_phrase, explanation).
Nói ngắn thôi, dưới 45 giây. Đừng đọc lại phần nghĩa tiếng Việt.`);

    try {
      await audioEngine.startMic();
      dangThuAm = id;
      veNutThuAm(id, true);
      veTinPhatAm(id, '<i class="fa-solid fa-circle text-rose-400 animate-pulse"></i><span>Đang nghe… đọc to cả câu, xong bấm nút vuông để gửi.</span>', 'rose');
      addLog('System', `🎤 Đang thu âm câu luyện phát âm: ${cau.jp}`);
    } catch (err) {
      veTinPhatAm(id, '<i class="fa-solid fa-triangle-exclamation"></i><span>Không mở được micro: ' + escapeHtml(err.message || '') + '</span>', 'amber');
    }
  };

  function ketThucThuAm() {
    const id = dangThuAm;
    if (!id) return;
    dangThuAm = null;

    if (audioEngine.isMicActive) audioEngine.stopMic();
    veNutThuAm(id, false);
    veTinPhatAm(id, '<i class="fa-solid fa-spinner fa-spin"></i><span>Sensei đang nghe lại và chuẩn bị phán…</span>');

    // Danh dau la luot noi NGOAI bai giang, khong thi nhip giang tuong Sensei
    // vua giang xong mot muc va nhay sang muc sau
    senseiChenNgang = true;
    clearTimeout(chenNgangTimer);
    chenNgangTimer = setTimeout(ketThucChenNgang, 45000);

    geminiClient.sendTurnComplete();
  }

  function huyThuAm() {
    const id = dangThuAm;
    dangThuAm = null;
    if (!id) return;
    if (audioEngine.isMicActive) audioEngine.stopMic();
    veNutThuAm(id, false);
    const box = document.getElementById('kq-' + id);
    if (box) box.className = 'hidden';
  }

  window.doiCauPhatAm = () => {
    if (dangThuAm) huyThuAm();
    slideEngine.pronunciationRound = (slideEngine.pronunciationRound || 0) + 1;
    slideEngine.setTab('quiz');
  };

  // Nut "Doi de khac" tren dau chuong Bai tap
  window.regenerateQuiz = () => {
    const lvl = slideEngine.currentLevel, no = slideEngine.currentLesson;
    delete quizGenCache[`${lvl}-${no}`];
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
      const clip = dialogueAudio[line.id];
      if (clip && audioEngine.playPcmClip) {
        try { await audioEngine.playPcmClip(clip); return true; } catch (e) {}
      }
      return await playLineWithBrowserVoice(line);
    } finally {
      // Cho tieng vang qua loa tat han truoc khi mo lai mic, khong ngat qua som
      await new Promise(r => setTimeout(r, 200));
      dangPhatGiongNhanVat = false;
    }
  }

  function playLineWithBrowserVoice(line) {
    return new Promise((resolve) => {
      const jp = (line.tokens || []).map(t => t.kanji || t.text).join('');
      if (!jp.trim() || !window.speechSynthesis || !window.SenseiVoices) return resolve(false);

      try {
        audioEngine.stopPlayback();
        speechSynthesis.cancel();
        if (speechSynthesis.paused) speechSynthesis.resume();

        const pick = SenseiVoices.browserVoice(line.speaker, line.speakerGender);
        const u = new SpeechSynthesisUtterance(jp);
        u.lang = 'ja-JP';
        u.rate = pick.rate;
        u.pitch = pick.pitch;
        if (pick.voice) u.voice = pick.voice;

        let done = false;
        const finish = (ok) => { if (!done) { done = true; resolve(ok); } };
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
      clearTimeout(timer);
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
      clearTimeout(timer);
      return { ok: false, status: String((err && err.message) || err) };
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

  function buildQuizPrompt(lesson, lvl) {
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
        return { ...q, correctIndex: dap };
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
  const KHO_DE = 'sensei_quiz_v1';
  const KHO_DE_HAN = 7 * 24 * 60 * 60 * 1000;

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
    for (const k of Object.keys(o)) quizGenCache[k] = o[k].items;
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
    if (quizGenCache[key] && !verbose) return;
    // Vua that bai thi nghi mot lat — dang het quota ma cu doi tab la goi lai
    // thi chi to dot them luot. Nguoi hoc tu bam nut (verbose) thi van cho thu.
    if (!verbose && Date.now() < (quizGenNghiDen[key] || 0)) return;

    const lesson = curriculumLoader.getLesson(lvl, lessonNum);
    if (!lesson) return;

    quizGenInFlight[key] = true;
    datCho('quiz', 'Đang soạn bộ đề mới…',
      'Sensei nghĩ 10 câu mới cho bài này — thường mất 10–30 giây.');
    const regenBtn = document.getElementById('quizRegenBtn');
    if (regenBtn) regenBtn.disabled = true;
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

    // Chi gan vao bai dang mo, va chi khi chua bat dau giang de ke hoach nhip con dung
    const stillHere = slideEngine.currentLevel === lvl && slideEngine.currentLesson === Number(lessonNum);
    if (!stillHere) return;

    const base = (lesson.exercises || []).filter(q => !q.generated);
    // De AI len TRUOC. Neu de sau thi 10 cau dau van y nguyen moi lan mo,
    // nguoi hoc nhin vao tuong nhu khong co gi moi.
    lesson.exercises = items.concat(base);

    if (lectureState === 'IDLE') {
      currentLectureSteps = buildLecturePlan(lvl, lessonNum);
    }
    if (slideEngine.activeTab === 'quiz') slideEngine.setTab('quiz');

    showToast(`Đã soạn thêm ${items.length} câu bài tập cho bài này.`);
  }

  /* ======================================================================
     MÀN CHỌN BÀI HỌC
     ====================================================================== */

  const LEVEL_INFO = {
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

  function lessonStats(l) {
    return {
      vocab: (l.vocabList || []).length,
      kanji: (l.kanjiList || []).length,
      slides: (l.slides || []).length,
      quiz: (l.exercises || []).length,
    };
  }

  function renderPicker(filter = '') {
    if (!pickerBody) return;
    const q = filter.trim().toLowerCase();
    let shown = 0;

    const html = ['N5', 'N4', 'N3', 'N2', 'N1'].map(lvl => {
      const lessons = curriculumLoader.getLessonsForLevel(lvl) || [];
      const hits = q
        ? lessons.filter(l => (`${l.lessonNumber} ${l.title} ${l.description || ''}`).toLowerCase().includes(q))
        : lessons;
      if (!hits.length) return '';
      shown += hits.length;

      const info = LEVEL_INFO[lvl] || { title: '', desc: '' };
      const cards = hits.map(l => {
        const st = lessonStats(l);
        // Bài chỉ có một từ vựng / một slide là bài mới dựng khung, chưa soạn đủ
        const thin = st.vocab <= 2 || st.slides <= 1;
        const isCurrent = slideEngine.currentLevel === lvl && slideEngine.currentLesson === l.lessonNumber;
        const title = l.title.includes(':') ? l.title.split(':').slice(1).join(':').trim() : l.title;
        return `
          <button type="button" class="lesson-card${isCurrent ? ' is-current' : ''}"
                  data-level="${lvl}" data-lesson="${l.lessonNumber}">
            ${isCurrent ? '<span class="lesson-now">ĐANG HỌC</span>' : ''}
            <span class="lesson-no">${l.lessonNumber}</span>
            <span class="lesson-main">
              <span class="lesson-title">${slideEngine.escapeHtml(title)}</span>
              <span class="lesson-stats">
                <span class="lesson-stat">${st.vocab} từ</span>
                <span class="lesson-stat">${st.kanji} kanji</span>
                <span class="lesson-stat">${st.slides} slide</span>
                <span class="lesson-stat">${st.quiz} bài tập</span>
                ${thin ? '<span class="lesson-stat is-thin">chưa soạn đủ</span>' : ''}
              </span>
            </span>
          </button>`;
      }).join('');

      return `
        <section class="picker-level">
          <div class="picker-level-head">
            <div class="picker-level-mark lv-${lvl.toLowerCase()}">${lvl}</div>
            <div>
              <h2 class="picker-level-title">
                ${info.title}
                <span class="picker-level-count">${hits.length}${q ? '' : ' bài'}</span>
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
        <span>Chưa nạp được giáo trình ${thieu.join(', ')} — có thể do mạng chập chờn.</span>
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
  }

  /**
   * Mở một bài học. LUÔN bắt đầu ở chương Từ vựng — đó là điểm vào tự nhiên
   * của mọi bài. Muốn giảng từ chương khác thì bấm chương đó rồi mới bấm giảng.
   */
  function openLesson(lvl, lessonNum) {
    if (lectureState !== 'IDLE') {
      pauseLecture(false);
      lectureState = 'IDLE';
    }
    stopAllAudio();
    slideEngine.clearReadingFocus();
    if (window.SenseiBoard) SenseiBoard.lauSach();   // bai moi thi bang trong

    populateLessons(lvl, lessonNum);
    if (levelSelect) levelSelect.value = lvl;

    slideEngine.currentLevel = lvl;
    slideEngine.currentLesson = Number(lessonNum);
    slideEngine.currentSlideIndex = 0;
    slideEngine.setTab('vocab');

    currentLectureSteps = buildLecturePlan(lvl, lessonNum);
    currentLectureStepIndex = -1;
    lectureCheckpoint = { stepIndex: 0, sectionName: 'vocab', subIndex: null, level: lvl, lessonNum: Number(lessonNum) };
    updateLectureControlsUI();

    closePicker();

    const lesson = curriculumLoader.getLesson(lvl, lessonNum);
    if (lesson) showToast(`${lvl} · Bài ${lessonNum} — ${lesson.title.split(':').slice(1).join(':').trim() || lesson.title}`);

    // Bai tap: KHONG soan o day nua. Mo bai chi de luot xem cung ton mot luot
    // goi, ma han muc free tier chi 20 luot. Doi den khi mo chuong Bai tap.

    // Long tieng: chay ngay, vi day la viec lau nhat (30-60 giay). Cho phien
    // Sensei bat tay xong roi moi mo phien dien vien — chay ngay lap tuc thi
    // WebSocket hay loi nhat thoi.
    if ((curriculumLoader.getDialogue(lvl, Number(lessonNum)) || []).length) {
      datCho('kaiwa', 'Chuẩn bị lồng tiếng hội thoại…',
        'Đang chờ phiên Sensei vào lớp xong rồi mới mở phiên diễn viên.');
    }
    setTimeout(() => prefetchDialogueAudio(lvl, Number(lessonNum), { verbose: true }), 2500);
  }

  function openPicker() {
    if (!pickerEl) return;
    renderPicker(pickerSearch ? pickerSearch.value : '');
    pickerEl.classList.remove('hidden');
    if (pickerSearch) setTimeout(() => pickerSearch.focus(), 60);
  }

  function closePicker() {
    if (pickerEl) pickerEl.classList.add('hidden');
  }

  // Mo danh sach bai NGAY o day, khong doi toi cuoi ham khoi dong. Tu day den
  // cuoi con hang chuc doan dang ky su kien; mot doan gay la truoc day khong
  // bao gio toi duoc lenh mo danh sach -> trang trang.
  // Phoi ra window luon, de nhanh catch cua luoi an toan con goi lai duoc.
  window.openSyllabusModal = openPicker;
  window.closeSyllabusModal = closePicker;
  openPicker();

  if (pickerBtn) pickerBtn.addEventListener('click', openPicker);
  if (pickerCloseBtn) pickerCloseBtn.addEventListener('click', closePicker);
  if (pickerSearch) {
    pickerSearch.addEventListener('input', () => renderPicker(pickerSearch.value));
    pickerSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { pickerSearch.value = ''; renderPicker(''); }
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
    if (chatDock) chatDock.classList.add('hidden');
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
        // mo ra mot o xanh rong khong hieu de lam gi
        if (SenseiBoard.trangThai().soDongTrenBang === 0) {
          SenseiBoard.vietBang('Bảng của Sensei', 'dam');
          SenseiBoard.vietBang('Sensei sẽ ghi công thức, mẹo nhớ và viết chữ Hán theo nét lên đây trong lúc giảng.', 'nhat');
        }
      }
      boardToggleBtn.classList.toggle('is-live', !dangMo);
    });
  }

  // ---- Phím tắt: Esc đóng lớp phủ đang mở (theo thứ tự ưu tiên) ----
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (pickerEl && !pickerEl.classList.contains('hidden')) { closePicker(); return; }
    if (chatDock && !chatDock.classList.contains('hidden') && document.activeElement !== chatInput) closeChat();
  });

  // ======================================================================
  // KHỞI ĐỘNG
  // ======================================================================
  updateSessionState();

  if (savedApiKey) {
    // Vào lớp ngay khi mở trang, chạy ngầm. Từ đây nút Bắt đầu / Tạm dừng
    // chỉ còn điều khiển BUỔI GIẢNG, không dính tới việc kết nối nữa.
    ensureConnected().catch(() => {
      showToast('Chưa vào được lớp — kiểm tra API Key hoặc mạng.', 'error', 6000);
    });
  } else {
    showToast('Chưa đọc được GEMINI_KEY1 từ .env — mở trang qua server.py rồi tải lại.', 'info', 10000);
  }

  // Dien thoai khoa am thanh cho toi cu cham dau tien — gan san bay mo khoa
  // ngay khi mo trang, truoc ca man chon bai (chinh cu cham chon bai se mo).
  audioEngine.installUnlockOnFirstGesture();
  window.__amThanh = () => audioEngine.trangThaiAmThanh();

  // (Danh sach bai da duoc mo som hon, ngay sau khi openPicker san sang)

  // Khong soan de luc khoi dong: nguoi hoc dang o man chon bai, chua biet
  // se hoc bai nao. Doi den khi ho mo chuong Bai tap.
  setTimeout(() => prefetchDialogueAudio(slideEngine.currentLevel, slideEngine.currentLesson), 3000);

  // Giữ tương thích cho các lời gọi cũ
  window.jumpToLesson = openLesson;   // openSyllabusModal/closeSyllabusModal da gan som hon

 } catch (err) {
   // Khoi dong gay giua chung: van co gang dung lai man chon bai, de con
   // duong vao lop. Dung duoc thi nguoi hoc khong mat gi ngoai vai tinh nang.
   baoHongKhoiDong(err, 'khoi dong');
   try { if (window.openSyllabusModal) window.openSyllabusModal(); } catch (e) {}
 }
});
