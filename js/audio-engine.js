/**
 * Audio Engine - AI Live Sensei Classroom
 * Xử lý Web Audio API: PCM 16kHz Thu âm & PCM 24kHz Phát âm thanh thời gian thực
 * Bảo toàn 100% căn chỉnh byte 16-bit PCM tránh lệch pha biến âm
 * Hỗ trợ ngắt lời tức thì (Barge-in VAD cancellation)
 */

class AudioEngine {
  constructor(options = {}) {
    this.onAudioChunk = options.onAudioChunk || (() => {});
    this.onPlayStateChange = options.onPlayStateChange || (() => {});
    this.onMicVolume = options.onMicVolume || (() => {});
    this.onError = options.onError || console.error;

    // Audio Output Context (24kHz Native Gemini Output)
    this.outCtx = null;
    this.scheduledTime = 0;
    this.activeSources = [];
    this.leftoverBytes = null; // Lưu byte lẻ giữa các gói để tránh lệch pha âm thanh

    // Audio Input (16kHz PCM In)
    this.inCtx = null;
    this.micStream = null;
    this.micProcessor = null;
    this.micSource = null;
    this.micMuteGain = null;
    this.isMicActive = false;

    this.isPlaying = false;
    this.idleTimeout = null;

    // Khi tam dung: Gemini VAN tiep tuc stream goi am thanh ve. Don hang doi
    // khong du — phai chan ngay o cong vao, khong thi Sensei noi tiep nhu thuong.
    this.suppressed = false;
  }

  ensureOutContext() {
    if (!this.outCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        console.error("Trình duyệt không hỗ trợ Web Audio API!");
        return;
      }
      try {
        // Thử khởi tạo AudioContext 24kHz
        this.outCtx = new AudioContextClass({ sampleRate: 24000 });
      } catch (err) {
        // iOS Safari và nhiều thiết bị Android/PC không cho phép tạo AudioContext 24000Hz trực tiếp
        console.warn("AudioContext 24kHz không được hỗ trợ bởi phần cứng, chuyển về tần số mặc định:", err);
        try {
          this.outCtx = new AudioContextClass();
        } catch (err2) {
          console.error("Không thể khởi tạo AudioContext:", err2);
          return;
        }
      }
    }

    if (this.outCtx && this.outCtx.state === 'suspended') {
      // KHONG duoc tin vao viec resume() co bi tu choi hay khong. Tren dien
      // thoai, goi ngoai cu cham thi no resolve binh thuong ma trang thai van
      // la 'suspended'. Phai xem lai trang thai that sau do.
      this.outCtx.resume().catch(() => {}).finally(() => {
        if (this.outCtx && this.outCtx.state === 'running') this.hideAudioUnlockPrompt();
        else this.showAudioUnlockPrompt();
      });
    }
  }

  /**
   * Mo khoa am thanh o cu cham DAU TIEN bat ky cho nao tren trang.
   *
   * Dien thoai chi cho chay AudioContext khi lenh resume nam trong tay mot cu
   * cham that. Trang nay tu vao lop khi mo nen khong co nut nao de bam —
   * vay thi lay chinh cu cham dau tien cua nguoi dung, du ho cham vao dau.
   */
  installUnlockOnFirstGesture() {
    if (this._daGanMoKhoa) return;
    this._daGanMoKhoa = true;

    // iPhone: nut gat im lang ben canh may khoa luon tieng cua Web Audio, du
    // may da mo khoa va da tang am. Khai bao day la tieng "phat lai" thi thoat.
    try {
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
    } catch (e) {}

    const moKhoa = () => {
      this.ensureOutContext();
      if (!this.outCtx) return;

      // iOS doi hoi phai THUC SU phat mot cai gi do NGAY TRONG tay cu cham thi
      // moi chiu mo. Mot doan im lang dai mot mau la du. Phai lam truoc, dong bo.
      try {
        const im = this.outCtx.createBuffer(1, 1, this.outCtx.sampleRate);
        const nguon = this.outCtx.createBufferSource();
        nguon.buffer = im;
        nguon.connect(this.outCtx.destination);
        nguon.start(0);
      } catch (e) {}

      // resume() la bat dong bo — xet state ngay bay gio van doc ra 'suspended'
      // du no sap chay. Doi xong roi moi ket luan.
      this.outCtx.resume().catch(() => {}).finally(() => {
        if (this.outCtx && this.outCtx.state === 'running') {
          this.hideAudioUnlockPrompt();
          goBay();
        }
      });
    };

    const goBay = () => {
      ['pointerdown', 'touchend', 'click', 'keydown'].forEach(
        ten => document.removeEventListener(ten, moKhoa, true));
    };

    ['pointerdown', 'touchend', 'click', 'keydown'].forEach(
      ten => document.addEventListener(ten, moKhoa, true));
  }

  /** Xem nhanh tinh trang am thanh — go window.__amThanh() trong Console */
  trangThaiAmThanh() {
    return {
      coAudioContext: !!this.outCtx,
      trangThai: this.outCtx ? this.outCtx.state : 'chưa tạo',
      tanSo: this.outCtx ? this.outCtx.sampleRate : null,
      dangPhat: this.isPlaying,
      dangChan: this.suppressed,
      micDangBat: this.isMicActive,
      trangAnToan: window.isSecureContext,
    };
  }

  showAudioUnlockPrompt() {
    let el = document.getElementById('audioUnlockPrompt');
    if (!el) {
      el = document.createElement('div');
      el.id = 'audioUnlockPrompt';
      // Dat giua man hinh chu khong nem goc: tren dien thoai, o nho o goc phai
      // gan nhu khong ai thay, ma khong cham vao no thi ca buoi hoc im tieng.
      el.className = 'fixed left-1/2 bottom-24 -translate-x-1/2 z-50 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm cursor-pointer border-2 border-indigo-300 animate-bounce transition text-center';
      el.innerHTML = '<i class="fa-solid fa-volume-high text-lg"></i> <span>Chạm để bật tiếng Sensei 🔊</span>';
      el.onclick = () => {
        this.ensureOutContext();
        if (this.outCtx && this.outCtx.state === 'suspended') {
          this.outCtx.resume().then(() => this.hideAudioUnlockPrompt()).catch(() => {});
        } else {
          this.hideAudioUnlockPrompt();
        }
      };
      document.body.appendChild(el);
    }
    el.style.display = 'flex';
  }

  hideAudioUnlockPrompt() {
    const el = document.getElementById('audioUnlockPrompt');
    if (el) el.style.display = 'none';
  }

  /**
   * Phát gói âm thanh PCM 24kHz Base64 từ Gemini Live
   * Có cơ chế căn chỉnh 2-byte chuẩn xác tuyệt đối, tránh hiện tượng đảo byte làm méo/thay đổi giọng đọc
   */
  /** Bat/tat cong chan: dang tam dung thi bo het goi am thanh toi */
  setSuppressed(on) {
    this.suppressed = !!on;
    if (on) this.stopPlayback(true);
  }

  playPCM24k(base64Chunk) {
    if (this.suppressed) return;   // dang tam dung -> bo goi nay di
    try {
      this.ensureOutContext();
      if (!this.outCtx) return;

      // Sensei dang noi ma may van khoa tieng -> phai bao ra man hinh, khong
      // thi nguoi hoc ngoi nhin mot buoi giang im lang khong hieu vi sao.
      if (this.outCtx.state !== 'running') {
        this.showAudioUnlockPrompt();
        return;
      }

      // Giải mã Base64 thành byte array mới
      const binaryString = atob(base64Chunk);
      const newBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        newBytes[i] = binaryString.charCodeAt(i);
      }

      // Ghép với byte dư thừa từ gói trước (nếu có)
      let combinedBytes;
      if (this.leftoverBytes && this.leftoverBytes.length > 0) {
        combinedBytes = new Uint8Array(this.leftoverBytes.length + newBytes.length);
        combinedBytes.set(this.leftoverBytes, 0);
        combinedBytes.set(newBytes, this.leftoverBytes.length);
        this.leftoverBytes = null;
      } else {
        combinedBytes = newBytes;
      }

      // Đảm bảo số lượng byte chia hết cho 2 (16-bit PCM = 2 bytes/sample)
      const remainder = combinedBytes.length % 2;
      const validByteCount = combinedBytes.length - remainder;

      if (remainder > 0) {
        // Lưu 1 byte lẻ lại cho gói tiếp theo
        this.leftoverBytes = combinedBytes.slice(validByteCount);
      }

      if (validByteCount === 0) return;

      // Đọc các mẫu 16-bit Little-Endian
      const sampleCount = validByteCount / 2;
      const dataView = new DataView(combinedBytes.buffer, combinedBytes.byteOffset, validByteCount);
      const float32Array = new Float32Array(sampleCount);

      for (let i = 0; i < sampleCount; i++) {
        // Luôn đọc little-endian (true) theo chuẩn PCM của Gemini
        const s16 = dataView.getInt16(i * 2, true);
        float32Array[i] = s16 < 0 ? s16 / 32768.0 : s16 / 32767.0;
      }

      // Tạo AudioBuffer 1 kênh (Mono), 24000Hz (trình duyệt tự động resample lên tần số của AudioContext)
      const audioBuffer = this.outCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.copyToChannel(float32Array, 0);

      const source = this.outCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outCtx.destination);

      // Tự động ngắt Web Speech API nếu đang đọc dở để tránh 2 giọng nói đè lên nhau
      if (window.speechSynthesis && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }

      const now = this.outCtx.currentTime;
      // Thêm 35ms lookahead buffer để chống underrun giật cục khi bắt đầu hoặc trễ nhịp
      if (this.scheduledTime < now) {
        this.scheduledTime = now + 0.035;
      }

      source.start(this.scheduledTime);
      this.scheduledTime += audioBuffer.duration;

      this.activeSources.push(source);
      if (this.idleTimeout) {
        clearTimeout(this.idleTimeout);
        this.idleTimeout = null;
      }
      if (!this.isPlaying) {
        this.isPlaying = true;
        this.onPlayStateChange(true);
      }

      source.onended = () => {
        this.activeSources = this.activeSources.filter(s => s !== source);
        if (this.activeSources.length === 0) {
          // Debounce 350ms phòng trường hợp gói âm thanh tiếp theo đang truyền qua WebSocket
          if (this.idleTimeout) clearTimeout(this.idleTimeout);
          this.idleTimeout = setTimeout(() => {
            if (this.activeSources.length === 0 && (!this.outCtx || this.scheduledTime <= this.outCtx.currentTime + 0.05)) {
              this.isPlaying = false;
              this.onPlayStateChange(false);
            }
          }, 350);
        }
      };
    } catch (err) {
      console.error("Lỗi khi phát PCM 24kHz:", err);
    }
  }

  /**
   * Phat tron mot doan PCM 24kHz base64 (loi thoai da dung san bang TTS).
   * Khac playPCM24k o cho day la mot khoi hoan chinh, khong phai luong stream,
   * nen tra ve Promise ket thuc dung luc phat xong de bo dieu phoi cho duoc.
   */
  playPcmClip(clip) {
    return new Promise((resolve, reject) => {
      if (this.suppressed) return resolve();
      try {
        this.ensureOutContext();
        if (!this.outCtx) return reject(new Error('khong co AudioContext'));

        // Nhan ca chuoi base64 (REST TTS) lan Uint8Array (dan dien vien Live)
        let bytes;
        if (clip instanceof Uint8Array) {
          bytes = clip;
        } else {
          const bin = atob(clip);
          bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        }

        const sampleCount = Math.floor(bytes.length / 2);
        if (!sampleCount) return resolve();

        const view = new DataView(bytes.buffer, bytes.byteOffset, sampleCount * 2);
        const pcm = new Float32Array(sampleCount);
        for (let i = 0; i < sampleCount; i++) {
          const s16 = view.getInt16(i * 2, true);
          pcm[i] = s16 < 0 ? s16 / 32768 : s16 / 32767;
        }

        const buf = this.outCtx.createBuffer(1, sampleCount, 24000);
        buf.copyToChannel(pcm, 0);

        const src = this.outCtx.createBufferSource();
        src.buffer = buf;
        src.connect(this.outCtx.destination);

        this.activeSources.push(src);
        if (!this.isPlaying) { this.isPlaying = true; this.onPlayStateChange(true); }

        src.onended = () => {
          this.activeSources = this.activeSources.filter(x => x !== src);
          if (!this.activeSources.length) {
            this.isPlaying = false;
            this.onPlayStateChange(false, { clip: true });
          }
          resolve();
        };
        this.clipSource = src;
        src.start();
      } catch (err) {
        reject(err);
      }
    });
  }

  isPlaybackActive() {
    if (this.activeSources.length > 0) return true;
    if (this.outCtx && this.scheduledTime > this.outCtx.currentTime + 0.05) return true;
    return false;
  }

  /**
   * Tính toán độ trễ hàng đợi âm thanh (giây) đang xếp lịch phát phía trước
   */
  getPlaybackQueueLatency() {
    if (!this.outCtx || this.scheduledTime <= this.outCtx.currentTime) return 0;
    return Math.max(0, this.scheduledTime - this.outCtx.currentTime);
  }

  /**
   * Hủy toàn bộ âm thanh đang phát ngay lập tức (Barge-in)
   */
  stopPlayback(isManual = true) {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
    this.isPlaying = false;
    this.activeSources.forEach(src => {
      try {
        src.stop();
        src.disconnect();
      } catch (e) {}
    });
    this.activeSources = [];
    this.scheduledTime = 0;
    this.leftoverBytes = null;
    this.onPlayStateChange(false, { manual: isManual });
  }

  /**
   * Bộ lọc Downsampling chuẩn từ tần số phần cứng bất kỳ (48kHz, 44.1kHz) về chuẩn 16kHz của Gemini
   */
  downsampleTo16k(inputData, inputSampleRate) {
    if (!inputData || inputData.length === 0) return new Float32Array(0);
    if (inputSampleRate === 16000) return inputData;

    const sampleRateRatio = inputSampleRate / 16000;
    const newLength = Math.round(inputData.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < inputData.length; i++) {
        accum += inputData[i];
        count++;
      }
      result[offsetResult] = count > 0 ? (accum / count) : inputData[offsetBuffer];
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }

  async startMic() {
    if (this.isMicActive) return true;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const isHttps = window.location.protocol === 'https:';
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      let msg = "Trình duyệt không hỗ trợ Microphone qua kết nối này.";
      if (!isHttps && !isLocalhost) {
        msg = `Quyền Microphone bị trình duyệt chặn do truy cập qua HTTP (${window.location.host}). Trình duyệt chỉ cho phép bật Mic qua HTTPS hoặc localhost. Hãy truy cập qua https://${window.location.hostname}:3443 hoặc cấu hình chrome://flags/#unsafely-treat-insecure-origin-as-secure.`;
      }
      const err = new Error(msg);
      this.onError(err);
      throw err;
    }

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      try {
        this.inCtx = new AudioContextClass({ sampleRate: 16000 });
      } catch (errCtx) {
        console.warn("Input AudioContext 16kHz không được phần cứng hỗ trợ, fallback default rate:", errCtx);
        this.inCtx = new AudioContextClass();
      }

      // Đảm bảo AudioContext đang chạy, mở khóa trạng thái suspended
      if (this.inCtx.state === 'suspended') {
        await this.inCtx.resume();
      }

      const inputRate = this.inCtx.sampleRate || 48000;
      console.log(`[AudioEngine] Mic khởi động thành công: Hardware Rate = ${inputRate}Hz -> Gemini Target = 16000Hz`);

      this.micSource = this.inCtx.createMediaStreamSource(this.micStream);

      // ScriptProcessor 2048 buffersize để stream thời gian thực
      this.micProcessor = this.inCtx.createScriptProcessor(2048, 1, 1);

      this.micProcessor.onaudioprocess = (e) => {
        if (!this.isMicActive) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // 1. Tính toán âm lượng thời gian thực (RMS Volume 0-100%)
        let sumSquares = 0;
        for (let i = 0; i < inputData.length; i++) {
          sumSquares += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sumSquares / inputData.length);
        const volume = Math.min(100, Math.round(rms * 300));
        this.onMicVolume(volume);

        // 2. Downsample về chuẩn 16000Hz nếu phần cứng không phải 16kHz
        const resampled16k = this.downsampleTo16k(inputData, inputRate);
        const pcm16 = new Int16Array(resampled16k.length);

        for (let i = 0; i < resampled16k.length; i++) {
          const s = Math.max(-1, Math.min(1, resampled16k[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // 3. Chuyển Int16Array thành chuỗi nhị phân rồi Base64
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = '';
        const chunkLen = 8192;
        for (let i = 0; i < bytes.length; i += chunkLen) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkLen));
        }

        const base64Audio = btoa(binary);
        this.onAudioChunk(base64Audio);
      };

      // Để tránh tiếng vọng từ Mic ra loa của máy (Acoustic Feedback Loop),
      // gắn một Mute Gain Node có âm lượng = 0 trước khi nối vào destination
      this.micMuteGain = this.inCtx.createGain();
      this.micMuteGain.gain.value = 0;

      this.micSource.connect(this.micProcessor);
      this.micProcessor.connect(this.micMuteGain);
      this.micMuteGain.connect(this.inCtx.destination);

      this.isMicActive = true;
      return true;
    } catch (err) {
      this.onError(err);
      this.stopMic();
      throw err;
    }
  }

  /**
   * Tắt thu âm Micro
   */
  stopMic() {
    this.isMicActive = false;
    this.onMicVolume(0);
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.micProcessor) {
      try { this.micProcessor.disconnect(); } catch (e) {}
      this.micProcessor = null;
    }
    if (this.micMuteGain) {
      try { this.micMuteGain.disconnect(); } catch (e) {}
      this.micMuteGain = null;
    }
    if (this.micSource) {
      try { this.micSource.disconnect(); } catch (e) {}
      this.micSource = null;
    }
    if (this.inCtx) {
      try { this.inCtx.close(); } catch (e) {}
      this.inCtx = null;
    }
  }

  cleanup() {
    this.stopPlayback();
    this.stopMic();
    if (this.outCtx) {
      try { this.outCtx.close(); } catch (e) {}
      this.outCtx = null;
    }
  }
}

window.AudioEngine = AudioEngine;
