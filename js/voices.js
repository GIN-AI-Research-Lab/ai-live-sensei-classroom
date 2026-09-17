/**
 * Giọng nhân vật hội thoại
 *
 * Gemini Live chỉ cho MỘT giọng cho cả phiên — không đổi giữa chừng được.
 * Ngắt phiên rồi nối lại cho từng câu thì mỗi câu phải chờ dựng lại WebSocket,
 * đoạn thoại sẽ đứt quãng liên tục.
 *
 * Cách làm ở đây: lời thoại là văn bản cố định nên dựng sẵn audio bằng REST TTS
 * ngay khi mở bài, mỗi nhân vật một giọng theo giới tính. Tới lượt thoại nào thì
 * phát đúng bản đã dựng — không độ trễ, không đứt quãng, không giới hạn số vai.
 */
(function () {
  'use strict';

  // Giọng dựng sẵn của Gemini, phân theo chất giọng
  const MALE = ['Charon', 'Puck', 'Fenrir', 'Orus'];
  const FEMALE = ['Kore', 'Aoede', 'Leda'];

  /**
   * Giọng của Sensei — KHÔNG được cấp cho nhân vật nào trong hội thoại.
   * Đo thực tế: nhân vật "B (Người đáp)" từng bốc trúng Charon, thành ra
   * học viên nghe thầy giáo tự nói chuyện với chính mình.
   */
  let giongSensei = 'Charon';
  const khoGiong = (gioiTinh) => {
    const kho = (gioiTinh === 'f' ? FEMALE : MALE).filter(v => v !== giongSensei);
    // Phòng trường hợp Sensei đổi sang giọng nữ và kho nữ chỉ còn 2 — vẫn đủ dùng.
    return kho.length ? kho : (gioiTinh === 'f' ? FEMALE : MALE);
  };

  /**
   * Giới tính của các nhân vật quen thuộc trong Minna no Nihongo.
   * Tra bằng cách dò chuỗi con nên viết kiểu nào cũng nhận: 「ミラー」,
   * 「ミラーさん」, 「Miller」, 「マイク・ミラー」…
   */
  const KNOWN = [
    // --- nam ---
    ['ミラー', 'm'], ['miller', 'm'], ['マイク', 'm'],
    ['山田', 'm'], ['yamada', 'm'],
    ['サントス', 'm'], ['santos', 'm'],
    ['ワット', 'm'], ['watt', 'm'],
    ['グプタ', 'm'], ['gupta', 'm'],
    ['鈴木', 'm'], ['suzuki', 'm'],
    ['松本', 'm'], ['matsumoto', 'm'],
    ['田中', 'm'], ['tanaka', 'm'],
    ['伊藤', 'm'], ['ito', 'm'],
    ['カリム', 'm'], ['タワポン', 'm'], ['イー', 'm'],
    ['先生', 'm'], ['sensei', 'm'], ['店員', 'm'],

    // --- nữ ---
    ['佐藤', 'f'], ['satou', 'f'], ['sato', 'f'], ['けい子', 'f'],
    ['カリナ', 'f'], ['karina', 'f'],
    ['マリア', 'f'], ['maria', 'f'],
    ['テレサ', 'f'], ['teresa', 'f'],
    ['木村', 'f'], ['kimura', 'f'],
    ['ハンス', 'm'], ['シュミット', 'm'],
    ['渡辺', 'f'], ['watanabe', 'f'],
    ['中村', 'f'], ['nakamura', 'f'],
    ['さくら', 'f'], ['sakura', 'f'],
    ['あゆみ', 'f'], ['ゆき', 'f'], ['はなこ', 'f'], ['花子', 'f'],
  ];

  /** Hậu tố chỉ giới tính khá chắc trong tên tiếng Nhật */
  function guessByEnding(name) {
    if (/(子|美|香|奈|恵|絵|花|華)\s*$/.test(name)) return 'f';
    if (/(郎|夫|男|雄|太|樹|介|司)\s*$/.test(name)) return 'm';
    return null;
  }

  /** Băm tên thành số để cùng một nhân vật luôn nhận đúng một giọng */
  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }

  const overrides = {};   // người dùng ép giọng cho nhân vật cụ thể

  const SenseiVoices = {
    /** 'm' | 'f' — đoán giới tính của nhân vật */
    genderOf(speaker, explicit) {
      if (explicit === 'm' || explicit === 'f') return explicit;
      const name = String(speaker || '').toLowerCase();
      for (const [key, g] of KNOWN) {
        if (name.includes(key.toLowerCase())) return g;
      }
      const byEnding = guessByEnding(String(speaker || ''));
      if (byEnding) return byEnding;
      // Không đoán được thì chia đều theo tên để hai vai khác nhau không trùng giọng
      return (hash(String(speaker || '')) % 2) ? 'f' : 'm';
    },

    /**
     * Giọng cố định cho một nhân vật trong suốt bài học.
     * Cùng một tên luôn cho ra cùng một giọng (băm theo tên), nên Miller
     * ở bài 1 và bài 12 vẫn nghe là một người.
     */
    voiceFor(speaker, explicitGender) {
      const key = String(speaker || '').trim();
      if (overrides[key]) return overrides[key];
      const pool = khoGiong(this.genderOf(key, explicitGender));
      return pool[hash(key) % pool.length];
    },

    /** Báo giọng Sensei đang dùng, để không cấp trùng cho nhân vật nào */
    setSenseiVoice(v) {
      if (v) giongSensei = String(v).trim();
    },

    /** Ép giọng cho một nhân vật (nếu người dùng muốn đổi) */
    setVoice(speaker, voiceName) {
      overrides[String(speaker || '').trim()] = voiceName;
    },

    /** Bản tóm tắt dàn nhân vật của một đoạn hội thoại — dùng cho lời dẫn mở màn */
    castOf(dialogue) {
      const seen = new Map();
      (dialogue || []).forEach(line => {
        const name = (line.speaker || '').trim();
        if (!name || seen.has(name)) return;
        const gender = this.genderOf(name, line.speakerGender);
        seen.set(name, {
          speaker: name,
          gender,
          genderVi: gender === 'f' ? 'nữ' : 'nam',
          voice: this.voiceFor(name, line.speakerGender),
        });
      });
      return [...seen.values()];
    },

    /**
     * Lop do cuoi: giong tieng Nhat cua TRINH DUYET, phan theo gioi tinh.
     * Dung khi API khong long tieng duoc. Chat luong kem hon nhung van cho
     * ra hai chat giong khac nhau — van hon la mot nguoi doc het.
     *
     * May thuong chi cai 1-2 giong ja-JP, nen ngoai viec chon giong khac nhau
     * con chinh cao do (pitch) de hai vai nghe ra khac nhau chac chan.
     */
    browserVoice(speaker, explicitGender) {
      const gender = this.genderOf(speaker, explicitGender);
      let list = [];
      try {
        list = (window.speechSynthesis ? speechSynthesis.getVoices() : [])
          .filter(v => v.lang && v.lang.toLowerCase().startsWith('ja'));
      } catch (e) {}

      const maleHint = /ichiro|keita|male|otoya|男/i;
      const femaleHint = /ayumi|haruka|nanami|kyoko|sayaka|female|o-ren|女/i;
      const wanted = gender === 'f' ? femaleHint : maleHint;

      let voice = list.find(v => wanted.test(v.name));
      if (!voice && list.length > 1) {
        // Khong doan duoc ten thi chia deu: nam lay giong dau, nu lay giong sau
        voice = gender === 'f' ? list[1] : list[0];
      }
      if (!voice) voice = list[0] || null;

      return {
        voice,
        // Chenh cao do du de tai nghe ra hai nguoi khac nhau
        pitch: gender === 'f' ? 1.28 : 0.78,
        rate: 0.92,
      };
    },

    MALE, FEMALE,
  };

  window.SenseiVoices = SenseiVoices;
})();
