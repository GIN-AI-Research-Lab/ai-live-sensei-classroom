/**
 * Curriculum Loader - AI Live Sensei Classroom
 * Quản lý và nạp dữ liệu giáo án N5 - N1
 */

class CurriculumLoader {
  constructor() {
    this.database = {
      "N5": [],
      "N4": [],
      "N3": [],
      "N2": [],
      "N1": []
    };
    this.isLoaded = false;
  }

  /**
   * Nap giao trinh 5 cap do.
   *
   * MOI CAP DO NAP DOC LAP. Truoc day dung Promise.all: chi mot tep hong la do
   * ca cum, roi tut xuong bo du phong (von chi co DUNG MOT bai) — nen danh sach
   * bai giang trong tron, phai tai lai nhieu lan moi trung duoc lan ca 5 tep
   * trot lot. Mang cham hay di qua duong ham (Tailscale Funnel, wifi yeu) thi
   * gap lien tuc.
   *
   * Tep hong thi thu lai vai lan roi moi chiu thua, va chi cap do do phai dung
   * bo du phong — bon cap do kia da tai xong thi giu nguyen.
   */
  async init() {
    const levels = ["n5", "n4", "n3", "n2", "n1"];

    const napMot = async (lvl) => {
      let loiCuoi = null;
      for (let lan = 1; lan <= 3; lan++) {
        try {
          const res = await fetch(`curriculum/${lvl}.json`, { cache: 'no-store' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (!Array.isArray(data) || !data.length) throw new Error('tep rong hoac sai dinh dang');
          this.database[lvl.toUpperCase()] = data;
          return { lvl, ok: true, lan };
        } catch (err) {
          loiCuoi = err;
          // Loi nhat thoi rat hay gap khi trang vua mo: hang chuc yeu cau cung
          // luc. Cho mot nhip roi thu lai thuong la qua.
          if (lan < 3) await new Promise(r => setTimeout(r, 250 * lan));
        }
      }
      return { lvl, ok: false, loi: String((loiCuoi && loiCuoi.message) || loiCuoi) };
    };

    const kq = await Promise.all(levels.map(napMot));
    const hong = kq.filter(k => !k.ok);
    const thuLai = kq.filter(k => k.ok && k.lan > 1);

    if (thuLai.length) {
      console.info('[giao trinh] phai thu lai:',
        thuLai.map(k => `${k.lvl} (lan ${k.lan})`).join(', '));
    }

    if (hong.length) {
      console.warn('[giao trinh] khong nap duoc:',
        hong.map(k => `${k.lvl}: ${k.loi}`).join(' | '));
      // Chi cap do that su hong moi phai dung bo du phong. Cac cap do da tai
      // xong thi giu nguyen — truoc day chung bi xoa sach oan.
      const coN5 = hong.some(k => k.lvl === 'n5');
      if (coN5 && !this.database.N5.length) this.loadFallbackBundle();
    }

    this.isLoaded = kq.some(k => k.ok);
    this.capDoThieu = hong.map(k => k.lvl.toUpperCase());

    const tong = Object.values(this.database).reduce((n, a) => n + a.length, 0);
    console.log(`[giao trinh] xong: ${tong} bai`,
      hong.length ? `(thieu ${this.capDoThieu.join(', ')})` : '');
  }

  getLesson(level, lessonNumber) {
    const lvl = (level || "N5").toUpperCase();
    const list = this.database[lvl] || [];
    return list.find(l => l.lessonNumber === Number(lessonNumber)) || list[0] || null;
  }

  getSlide(level, lessonNumber, slideIndex) {
    const lesson = this.getLesson(level, lessonNumber);
    if (!lesson || !lesson.slides) return null;
    const idx = Math.max(0, Math.min(Number(slideIndex) || 0, lesson.slides.length - 1));
    return {
      slide: lesson.slides[idx],
      slideIndex: idx,
      totalSlides: lesson.slides.length,
      lesson
    };
  }

  getAvailableLevels() {
    return Object.keys(this.database).filter(lvl => this.database[lvl].length > 0);
  }

  getLessonsForLevel(level) {
    return this.database[(level || "N5").toUpperCase()] || [];
  }

  getExercises(level, lessonNumber) {
    const lesson = this.getLesson(level, lessonNumber);
    return lesson ? (lesson.exercises || []) : [];
  }

  getVocabList(level, lessonNumber) {
    const lesson = this.getLesson(level, lessonNumber);
    return lesson ? (lesson.vocabList || []) : [];
  }

  getKanjiList(level, lessonNumber) {
    const lesson = this.getLesson(level, lessonNumber);
    return lesson ? (lesson.kanjiList || []) : [];
  }

  getDialogue(level, lessonNumber) {
    const lesson = this.getLesson(level, lessonNumber);
    return lesson ? (lesson.dialogue || []) : [];
  }

  /**
   * Bo cau luyen phat am: tron cau cua bai DANG HOC voi cau cua nhung bai DA HOC.
   *
   * Vi sao tron: doc mai cau cua moi bai hien tai thi chi luyen duoc mot mau ngu
   * phap. Bai 6 ma on lai cau cua bai 1-5 moi ra duoc phan xa that.
   *
   * @param {number} doi  Doi so de "doi cau khac" lay duoc bo khac
   */
  getPronunciationSet(level, lessonNumber, doi = 0, soCau = 6) {
    const lvl = (level || 'N5').toUpperCase();
    const no = Number(lessonNumber) || 1;
    const ds = this.database[lvl] || [];

    // Gom cau cua mot bai. Cau vi du ngu phap va cau thoai hay trung nhau
    // tung chu nen phai loc trung ngay tu day.
    const cauCuaBai = (bai) => {
      const daCo = new Set();
      const out = [];
      const day = (tokens, meaningVi, id) => {
        const jp = (tokens || []).map(t => t.kanji || t.text || '').join('').trim();
        if (jp.length < 4 || daCo.has(jp)) return;
        daCo.add(jp);
        out.push({ id, jp, tokens, meaningVi: meaningVi || '', tuBai: bai.lessonNumber });
      };
      (bai.slides || []).forEach(sl => (sl.examples || []).forEach(e => day(e.tokens, e.meaningVi, 'pa-' + e.id)));
      (bai.dialogue || []).forEach(d => day(d.tokens, d.meaningVi, 'pa-' + d.id));
      return out;
    };

    const baiNay = ds.find(l => l.lessonNumber === no);
    const nguonNay = baiNay ? cauCuaBai(baiNay) : [];

    // Cac bai da hoc: lay XOAY VONG tung bai mot chu khong noi duoi nhau.
    // Noi duoi nhau thi bai 1 (28 cau) nuot het suat, bai 2-5 khong bao gio
    // duoc goi ten — trong khi y la on lai ca 1,2,3,4,5.
    const theoBai = ds.filter(l => l.lessonNumber < no).map(cauCuaBai).filter(a => a.length);
    const nguonCu = [];
    for (let v = 0; theoBai.some(a => v < a.length); v++) {
      for (const a of theoBai) if (v < a.length) nguonCu.push(a[v]);
    }

    // Xoay theo `doi` thay vi boc ngau nhien: bam "doi cau khac" thi chac chan
    // ra cau khac, chu khong phai may rui trung lai cau vua doc.
    const lay = (kho, can, lech) => {
      const ra = [];
      for (let i = 0; i < Math.min(can, kho.length); i++) ra.push(kho[(lech + i) % kho.length]);
      return ra;
    };

    const canNay = nguonCu.length ? Math.ceil(soCau / 2) : soCau;
    const phanNay = lay(nguonNay, canNay, doi * canNay);
    // Bai dang hoc it cau thi lay bu tu cac bai cu, dung lap lai cho du so
    const phanCu = lay(nguonCu, soCau - phanNay.length, doi * (soCau - canNay) + no);

    const daCo = new Set();
    return [...phanNay, ...phanCu].filter(c => {
      if (daCo.has(c.jp)) return false;
      daCo.add(c.jp);
      return true;
    });
  }

  getAllCurriculumSummary() {
    return Object.keys(this.database).map(lvl => ({
      level: lvl,
      lessons: (this.database[lvl] || []).map(l => ({
        lessonNumber: l.lessonNumber,
        title: l.title,
        slideCount: (l.slides || []).length,
        exerciseCount: (l.exercises || []).length
      }))
    }));
  }

  loadFallbackBundle() {
    // Fallback nếu chạy trực tiếp tệp file:/// mà không qua web server
    this.database["N5"] = [
      {
        level: "N5",
        lessonNumber: 1,
        title: "Bài 1: Khẳng định, Phủ định & Nghi vấn với です",
        slides: [
          {
            slideId: "n5-l1-s0",
            title: "1. Khẳng định: N1 は N2 です",
            grammarFormula: "N1 [chủ ngữ] + は + N2 [vị ngữ/danh từ] + です",
            explanation: "Trợ từ は (đọc là 'wa') đánh dấu chủ đề của câu. です đặt ở cuối câu để biểu thị sự lịch sự và khẳng định danh từ đi trước.",
            examples: [
              {
                id: "ex-n5-l1-1",
                tokens: [
                  { id: "tok-watashi-1", text: "わたし", kanji: "私", furigana: "わたし" },
                  { id: "tok-wa-1", text: "は", isKeyGrammar: true },
                  { id: "tok-name-1", text: "Nam" },
                  { id: "tok-desu-1", text: "です", isKeyGrammar: true }
                ],
                meaningVi: "Tôi là Nam."
              },
              {
                id: "ex-n5-l1-2",
                tokens: [
                  { id: "tok-watashi-2", text: "わたし", kanji: "私", furigana: "わたし" },
                  { id: "tok-wa-2", text: "は", isKeyGrammar: true },
                  { id: "tok-gakusei-1", text: "がくせい", kanji: "学生", furigana: "がくせい" },
                  { id: "tok-desu-2", text: "です", isKeyGrammar: true }
                ],
                meaningVi: "Tôi là sinh viên."
              }
            ],
            culturalNotes: "Trợ từ は khi làm trợ từ đánh dấu chủ đề luôn được phát âm là 'wa', không phải 'ha'."
          }
        ]
      }
    ];
    this.isLoaded = true;
  }
}

window.CurriculumLoader = CurriculumLoader;
