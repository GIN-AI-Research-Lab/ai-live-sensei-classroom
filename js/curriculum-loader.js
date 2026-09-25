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
   * Nap MUC LUC 5 cap do — moi bai chi co lessonNumber/title/description va
   * cac dem so (vocabCount, kanjiCount...), KHONG co vocabList/slides/dialogue/
   * exercises. Nhe (vai chuc KB moi cap) nen trang chon bai hien ra ngay.
   * Chi tiet tung bai duoc tai RIENG, khi hoc vien thuc su bam vao — xem
   * ensureLessonLoaded().
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
      const L = lvl.toUpperCase();
      // Lan nap lai (nut 'Nap lai'): cap do da co muc luc that thi giu nguyen
      // object cu — thay bang muc luc moi la mat chi tiet cac bai da tai.
      if (this.capDoThieu && !this.capDoThieu.includes(L) && this.database[L].length) {
        return { lvl, ok: true, lan: 0 };
      }
      let loiCuoi = null;
      for (let lan = 1; lan <= 3; lan++) {
        try {
          const res = await fetch(`curriculum/${lvl}/index.json`, { cache: 'no-store' });
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
    console.log(`[giao trinh] xong: ${tong} bai (chi muc luc)`,
      hong.length ? `(thieu ${this.capDoThieu.join(', ')})` : '');
  }

  /**
   * Tai CHI TIET day du cua MOT bai (vocabList, kanjiList, slides, dialogue,
   * exercises) neu chua co, roi gop vao DUNG object dang nam trong
   * this.database — giu nguyen tham chieu de moi cho khac da luu lesson nay
   * (vi du currentLectureSteps) tu dong thay duoc du lieu moi.
   *
   * An toan goi nhieu lan / goi chong: neu dang co 1 lan tai dang chay cho
   * dung bai nay thi tra ve DUNG promise do, khong bay them yeu cau thu hai.
   */
  async ensureLessonLoaded(level, lessonNumber) {
    const lvl = (level || "N5").toUpperCase();
    const no = Number(lessonNumber);
    const list = this.database[lvl] || [];
    const entry = list.find(l => l.lessonNumber === no);
    if (!entry) return null;
    if (Array.isArray(entry.vocabList)) return entry;   // da co chi tiet day du roi

    this._dangTai = this._dangTai || new Map();
    const key = `${lvl}-${no}`;
    if (this._dangTai.has(key)) return this._dangTai.get(key);

    const p = (async () => {
      try {
        // Thu lai 3 lan giong init(): mang cham / duong ham hay rot le mot yeu cau.
        // Van hong thi entry khong co vocabList — ben goi tu nhan ra va bao loi.
        for (let lan = 1; lan <= 3; lan++) {
          try {
            const res = await fetch(`curriculum/${lvl.toLowerCase()}/${no}.json`, { cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const full = await res.json();
            Object.assign(entry, full);   // giu nguyen object entry, chi bom them khoa
            break;
          } catch (err) {
            if (lan < 3) { await new Promise(r => setTimeout(r, 250 * lan)); continue; }
            console.warn(`[giao trinh] khong tai duoc chi tiet ${lvl} bai ${no}:`, err.message || err);
          }
        }
      } finally {
        this._dangTai.delete(key);
      }
      return entry;
    })();
    this._dangTai.set(key, p);
    return p;
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
   * Nap chi tiet cac bai DA HOC gan nhat (toi da soBai bai lien truoc, cung cap
   * do) cho phan on bai cua getPronunciationSet / getHandwritingSet. Muc luc nhe
   * khong co slides/dialogue/vocabList, nen bai cu chua nap thi coi nhu khong co
   * gi de on — truoc day chi on duoc nhung bai tinh co da mo trong phien.
   *
   * Co gioi han de khong tai ca cap do (moi bai ~40-50KB). Bai nao nap roi thi
   * bo qua; goi chong van an toan vi ensureLessonLoaded tu gop yeu cau trung.
   * Khong bao gio tu choi: bai tai hong chi thieu phan on cua bai do.
   */
  ensureReviewLoaded(level, lessonNumber, soBai = 5) {
    const lvl = (level || 'N5').toUpperCase();
    const no = Number(lessonNumber) || 1;
    const truoc = (this.database[lvl] || [])
      .filter(l => l.lessonNumber < no)
      .sort((a, b) => a.lessonNumber - b.lessonNumber)
      .slice(-soBai)
      .filter(l => !Array.isArray(l.vocabList));
    return Promise.all(truoc.map(l => this.ensureLessonLoaded(lvl, l.lessonNumber).catch(() => null)));
  }

  /**
   * Bo cau luyen phat am: tron cau cua bai DANG HOC voi cau cua nhung bai DA HOC.
   *
   * Vi sao tron: doc mai cau cua moi bai hien tai thi chi luyen duoc mot mau ngu
   * phap. Bai 6 ma on lai cau cua bai 1-5 moi ra duoc phan xa that.
   * Chi tron duoc bai cu DA nap chi tiet — goi ensureReviewLoaded() truoc.
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


  /**
   * Bo de LUYEN VIET TAY cho chuong Bai tap.
   *
   * Lay tu vung cua bai dang hoc + cac bai da hoc (xoay vong theo `doi` giong
   * getPronunciationSet), KHONG goi AI de ra de. Moi muc co hai kieu hoi:
   *   - 'khuyet'  : cho mot cau that trong giao trinh, khoet di dung tu do
   *   - 'phatam'  : chi cho cach doc + nghia, nguoi hoc tu nho mat chu
   * Chi lay tu NGAN (toi da 3 ky tu) vi chi co 10 giay de viet.
   * Bai cu phai DA nap chi tiet moi co tu de on — goi ensureReviewLoaded() truoc.
   */
  getHandwritingSet(level, lessonNumber, doi = 0, soChu = 5) {
    const lvl = (level || 'N5').toUpperCase();
    const no = Number(lessonNumber) || 1;
    const ds = this.database[lvl] || [];

    const cauCuaBai = (bai) => {
      const out = [];
      const day = (tokens) => {
        const jp = (tokens || []).map(t => t.kanji || t.text || '').join('').trim();
        if (jp.length >= 4) out.push({ jp, tokens: tokens || [] });
      };
      (bai.slides || []).forEach(sl => (sl.examples || []).forEach(e => day(e.tokens)));
      (bai.dialogue || []).forEach(d => day(d.tokens));
      return out;
    };

    const tuCuaBai = (bai) => {
      const cauMau = cauCuaBai(bai);
      const chuCua = (t) => t.kanji || t.text || '';
      return (bai.vocabList || []).map(v => {
        const kanji = String(v.kanji || '').trim();
        const word = String(v.word || '').trim();
        const dapAn = (kanji && kanji !== word) ? kanji : word;
        if (!dapAn || dapAn.length > 3) return null;
        // Uu tien cau co MOT TOKEN dung bang dap an: khoet dung token do. Cat theo
        // chuoi thi khoet ca cho nam giua tu khac (犯＿＿はあの＿＿) va ra nhieu o trong.
        const khop = cauMau.find(c => c.tokens.some(t => chuCua(t) === dapAn));
        const cau = khop || cauMau.find(c => c.jp.includes(dapAn));
        let cauHoi = '';
        if (khop) {
          let daKhoet = false;
          cauHoi = khop.tokens.map(t => {
            if (!daKhoet && chuCua(t) === dapAn) { daKhoet = true; return '＿＿'; }
            return chuCua(t);
          }).join('').trim();
        } else if (cau) {
          cauHoi = cau.jp.replace(dapAn, '＿＿');   // chi o dau tien
        }
        return {
          id: 'vt-' + lvl + '-' + bai.lessonNumber + '-' + (v.id || dapAn),
          dapAn,
          kana: String(v.furigana || word || '').trim(),
          doc: String(v.romaji || '').trim(),
          nghia: String(v.meaningVi || '').trim(),
          kieu: cau ? 'khuyet' : 'phatam',
          cauHoi,
          tuBai: bai.lessonNumber,
        };
      }).filter(Boolean);
    };

    const baiNay = ds.find(l => l.lessonNumber === no);
    const nguonNay = baiNay ? tuCuaBai(baiNay) : [];

    const theoBai = ds.filter(l => l.lessonNumber < no).map(tuCuaBai).filter(a => a.length);
    const nguonCu = [];
    for (let v = 0; theoBai.some(a => v < a.length); v++) {
      for (const a of theoBai) if (v < a.length) nguonCu.push(a[v]);
    }

    const lay = (kho, can, lech) => {
      const ra = [];
      for (let i = 0; i < Math.min(can, kho.length); i++) ra.push(kho[(lech + i) % kho.length]);
      return ra;
    };

    const canNay = nguonCu.length ? Math.ceil(soChu / 2) : soChu;
    const phanNay = lay(nguonNay, canNay, doi * canNay);
    const phanCu = lay(nguonCu, soChu - phanNay.length, doi * (soChu - canNay) + no);

    const daCo = new Set();
    return [...phanNay, ...phanCu].filter(c => {
      if (daCo.has(c.dapAn)) return false;
      daCo.add(c.dapAn);
      return true;
    });
  }

  getAllCurriculumSummary() {
    // l.slideCount/exerciseCount la dem so tu index.json (luon co san). Neu
    // bai da duoc tai chi tiet day du thi l.slides/l.exercises cung co that,
    // uu tien do vi luc do moi la con so chinh xac nhat.
    return Object.keys(this.database).map(lvl => ({
      level: lvl,
      lessons: (this.database[lvl] || []).map(l => ({
        lessonNumber: l.lessonNumber,
        title: l.title,
        slideCount: l.slides ? l.slides.length : (l.slideCount || 0),
        exerciseCount: l.exercises ? l.exercises.length : (l.exerciseCount || 0)
      }))
    }));
  }

  loadFallbackBundle() {
    // Fallback nếu chạy trực tiếp tệp file:/// mà không qua web server. Cho
    // du day chi la 1 bai mau, van phai co du 4 mang rong (vocabList...) de
    // ensureLessonLoaded() biet bai nay COI NHU da tai xong, khong di fetch
    // chi tiet nua — fetch() cung se hong y het trong moi truong file:///.
    this.database["N5"] = [
      {
        level: "N5",
        lessonNumber: 1,
        title: "Bài 1: Khẳng định, Phủ định & Nghi vấn với です",
        vocabList: [],
        kanjiList: [],
        dialogue: [],
        exercises: [],
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
