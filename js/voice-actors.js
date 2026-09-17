/**
 * Dàn diễn viên lồng tiếng — mỗi nhân vật một phiên Live riêng
 *
 * Live API khoá MỘT giọng cho mỗi phiên: đặt lúc setup, không đổi giữa chừng.
 * Ngắt rồi nối lại cho từng câu thì mỗi câu phải chờ dựng lại WebSocket,
 * đoạn thoại đứt quãng.
 *
 * Cách ở đây: dựng sẵn toàn bộ lời thoại TRƯỚC, ngay khi mở bài. Gom các câu
 * theo giọng rồi làm LẦN LƯỢT từng giọng: mở phiên cho giọng A, đọc hết phần
 * của A, đóng phiên, rồi mới sang giọng B.
 *
 * Vì sao tuần tự chứ không song song: số phiên Live mở cùng lúc có giới hạn.
 * Mở Sensei + 3 diễn viên một lúc thì phiên mới bị server đóng với mã 1000
 * (đóng "bình thường", không kèm lý do nào). Tuần tự thì luôn chỉ có 2 phiên:
 * Sensei và một diễn viên. Việc dựng chạy ngầm từ chương Từ vựng nên tới lúc
 * học hội thoại là audio đã nằm sẵn, phát ra vẫn liền mạch.
 */
(function () {
  'use strict';

  const ENDPOINT = 'wss://generativelanguage.googleapis.com/ws/'
    + 'google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';

  const ACTOR_BRIEF =
    'Bạn là diễn viên lồng tiếng cho giáo trình tiếng Nhật. '
    + 'Nhiệm vụ duy nhất: ĐỌC LẠI ĐÚNG NGUYÊN VĂN câu tiếng Nhật được giao, '
    + 'bằng giọng người bản xứ, đúng ngữ điệu hội thoại đời thường của nhân vật. '
    + 'TUYỆT ĐỐI KHÔNG dịch, KHÔNG giải thích, KHÔNG chào hỏi, KHÔNG thêm bớt một chữ nào. '
    + 'Đọc xong là dừng.';

  function b64ToBytes(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function concatBytes(chunks) {
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const out = new Uint8Array(total);
    let at = 0;
    for (const c of chunks) { out.set(c, at); at += c.length; }
    return out;
  }

  /** Một diễn viên = một phiên Live khoá sẵn một giọng */
  class VoiceActor {
    constructor({ apiKey, model, voiceName }) {
      this.apiKey = apiKey;
      this.model = model;
      this.voiceName = voiceName;
      this.ws = null;
      this.ready = false;
      this.readyPromise = null;
      this.pending = null;      // { resolve, chunks, timer }
    }

    connect() {
      if (this.readyPromise) return this.readyPromise;

      this.readyPromise = new Promise((resolve) => {
        let settled = false;
        const done = (result) => {
          if (settled) return;
          settled = true;
          resolve(result);
        };

        try {
          this.ws = new WebSocket(`${ENDPOINT}?key=${this.apiKey}`);
        } catch (err) {
          return done({ ok: false, reason: String(err && err.message || err) });
        }

        const timer = setTimeout(() => done({ ok: false, reason: 'quá hạn mở phiên' }), 20000);

        this.ws.onopen = () => {
          this.ws.send(JSON.stringify({
            setup: {
              model: this.model,
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: this.voiceName } },
                },
              },
              systemInstruction: { parts: [{ text: ACTOR_BRIEF }] },
            },
          }));
        };

        this.ws.onmessage = async (e) => {
          let raw = e.data;
          if (raw instanceof Blob) raw = await raw.text();
          let msg;
          try { msg = JSON.parse(raw); } catch (err) { return; }

          if (msg.setupComplete) {
            this.ready = true;
            clearTimeout(timer);
            return done({ ok: true });
          }

          if (msg.error || msg.serverContent?.error) {
            const err = msg.error || msg.serverContent.error;
            clearTimeout(timer);
            if (this.pending) this._finishLine({ ok: false, reason: err.message || 'lỗi' });
            return done({ ok: false, reason: err.message || JSON.stringify(err) });
          }

          for (const part of (msg.serverContent?.modelTurn?.parts || [])) {
            if (part.inlineData?.data && this.pending) {
              this.pending.chunks.push(b64ToBytes(part.inlineData.data));
            }
          }

          if (msg.serverContent?.turnComplete && this.pending) {
            const bytes = concatBytes(this.pending.chunks);
            this._finishLine(bytes.length
              ? { ok: true, pcm: bytes }
              : { ok: false, reason: 'không nhận được âm thanh' });
          }
        };

        this.ws.onerror = () => {
          clearTimeout(timer);
          done({ ok: false, reason: 'lỗi kết nối WebSocket' });
        };

        this.ws.onclose = (ev) => {
          this.ready = false;
          this.readyPromise = null;
          clearTimeout(timer);
          const who = `${this.model.replace('models/', '')}/${this.voiceName}`;
          if (this.pending) this._finishLine({ ok: false, reason: `${who}: phiên đóng (mã ${ev.code}${ev.reason ? ': ' + ev.reason : ''})` });
          done({ ok: false, reason: `phiên đóng khi chưa sẵn sàng (mã ${ev.code}${ev.reason ? ': ' + ev.reason : ''})` });
        };
      });

      return this.readyPromise;
    }

    _finishLine(result) {
      const p = this.pending;
      this.pending = null;
      if (!p) return;
      clearTimeout(p.timer);
      p.resolve(result);
    }

    /** Giao một câu cho diễn viên đọc; trả về PCM 24kHz thô */
    async speak(jpText) {
      const conn = await this.connect();
      if (!conn.ok) return { ok: false, reason: conn.reason };
      if (this.pending) return { ok: false, reason: 'diễn viên đang đọc câu khác' };

      return new Promise((resolve) => {
        this.pending = {
          resolve,
          chunks: [],
          timer: setTimeout(() => this._finishLine({ ok: false, reason: 'quá hạn chờ đọc' }), 30000),
        };
        try {
          this.ws.send(JSON.stringify({
            clientContent: {
              turns: [{ role: 'user', parts: [{ text: `Đọc nguyên văn câu này:\n${jpText}` }] }],
              turnComplete: true,
            },
          }));
        } catch (err) {
          this._finishLine({ ok: false, reason: String(err && err.message || err) });
        }
      });
    }

    close() {
      try { if (this.ws) this.ws.close(); } catch (e) {}
      this.ws = null;
      this.ready = false;
      this.readyPromise = null;
    }
  }

  /** Quản lý cả dàn: mỗi giọng một diễn viên, giữ mở để dùng lại */
  class VoiceActorPool {
    constructor({ apiKey, model }) {
      this.apiKey = apiKey;
      this.model = model || (window.SENSEI_MODELS && SENSEI_MODELS.actor) || 'models/gemini-3.8-live';
      this.actors = new Map();
    }

    actorFor(voiceName) {
      if (!this.actors.has(voiceName)) {
        this.actors.set(voiceName, new VoiceActor({
          apiKey: this.apiKey, model: this.model, voiceName,
        }));
      }
      return this.actors.get(voiceName);
    }

    speak(voiceName, jpText) {
      return this.actorFor(voiceName).speak(jpText);
    }

    /** Dong rieng mot dien vien — dung xong giong nao dong giong do */
    close(voiceName) {
      const a = this.actors.get(voiceName);
      if (a) { a.close(); this.actors.delete(voiceName); }
    }

    closeAll() {
      this.actors.forEach(a => a.close());
      this.actors.clear();
    }

    get size() { return this.actors.size; }
  }

  window.VoiceActor = VoiceActor;
  window.VoiceActorPool = VoiceActorPool;
})();
