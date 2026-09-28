/**
 * Slide Engine - AI Live Sensei Classroom
 * Quản lý 5 phân môn sư phạm toàn diện:
 * 1. 📚 Từ vựng (Vocabulary): Danh sách từ, Furigana, Romaji, Loại từ, Nghĩa tiếng Việt, Trọng âm, Audio phát âm
 * 2. 🈸 Chữ Hán (Kanji): Flashcard chữ Hán, Âm On/Kun, Hán Việt, Số nét, Nghĩa, Từ ghép Jukugo
 * 3. 📖 Ngữ pháp (Grammar Slides): Slide chuyên sâu từng mẫu câu, Công thức, Lời giảng Sensei, Ví dụ Token Ruby, Lưu ý sư phạm
 * 4. 💬 Hội thoại (Kaiwa): Đàm thoại ngữ cảnh thực tế giữa các nhân vật có Furigana, Audio phát âm và dịch nghĩa
 * 5. ✍️ Bài tập (Practice Quiz): Trắc nghiệm tương tác kiểm tra ngay, giải thích sư phạm chi tiết
 */

// Global SpeechSynthesis pronunciation helper với cơ chế nạp voices bất đồng bộ
let cachedJaVoices = [];
function updateJaVoices() {
  if (!window.speechSynthesis) return;
  try {
    const allVoices = window.speechSynthesis.getVoices();
    cachedJaVoices = allVoices.filter(v => v.lang && (v.lang.startsWith('ja') || v.lang === 'ja_JP'));
  } catch (e) {}
}
if (window.speechSynthesis) {
  updateJaVoices();
  window.speechSynthesis.onvoiceschanged = updateJaVoices;
}

// Lan doc gan nhat (va muc cua no) — de su kien ket thuc cua cau CU khong go nham dau cua cau moi
let cauDangDoc = null;
let mucDangDoc = null;

window.playSpeech = function(text, targetId = null) {
  if (!window.speechSynthesis || !text) return;
  // Dừng bất kỳ âm thanh nào đang phát từ Gemini Live để tránh 2 giọng nói chèn nhau
  if (window.__audioEngine) {
    try { window.__audioEngine.stopPlayback(); } catch (e) {}
  }
  try {
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ja-JP';
    utter.rate = 0.90; // Nhịp độ vừa phải cho người học
    if (!cachedJaVoices.length) updateJaVoices();
    if (cachedJaVoices.length > 0) {
      utter.voice = cachedJaVoices[0];
    }

    cauDangDoc = utter;
    mucDangDoc = targetId;

    if (targetId && window.__slideEngine) {
      window.__slideEngine.prepareReadingTarget(targetId);
      // Doc xong chi go dau "dang doc" cua CHINH lan doc nay. Truoc day goi
      // clearReadingFocus() -> muc dang duoc roi (the ben trai dang mo) bi dong theo.
      const xong = () => {
        const se = window.__slideEngine;
        if (!se) return;
        // cancel() cau cu de doc lai CHINH muc nay -> loi 'interrupted' cua cau cu
        // khong duoc go dau cua cau moi dang doc
        if (cauDangDoc !== utter && mucDangDoc === targetId) return;
        if (se.activeFocusId === targetId) {
          // Muc dang roi (spotlight / Sensei): giu vien sang + the, chi bo huy hieu
          const el = se.resolveElement(targetId);
          const b = el && el.querySelector('.reading-badge-indicator');
          if (b) b.remove();
          return;
        }
        se.clearFocusClasses(targetId);
      };
      utter.onend = xong;
      utter.onerror = xong;
    }

    window.speechSynthesis.speak(utter);
  } catch (e) {
    console.warn("SpeechSynthesis error:", e);
  }
};

// Global Image Lightbox Modal helpers
window.openImageLightbox = function(src, title, caption) {
  const modal = document.getElementById('imageLightboxModal');
  const img = document.getElementById('lightboxImg');
  const titleEl = document.getElementById('lightboxTitle');
  const captionEl = document.getElementById('lightboxCaption');
  if (!modal || !img || !src) return;

  img.src = src;
  if (titleEl) titleEl.innerText = title || 'Tranh minh họa trực quan';
  if (captionEl) captionEl.innerText = caption || '';
  modal.classList.remove('hidden');
};

window.closeImageLightbox = function(e) {
  const modal = document.getElementById('imageLightboxModal');
  if (modal) modal.classList.add('hidden');
};

// Đóng modal khi bấm phím ESC.
// Moi Esc chi dong MOT lop — lop tren cung. Lop nao da xu ly thi goi preventDefault(), cac bo nghe
// sau (bang chon bai, o chat trong app.js, the ron) thay e.defaultPrevented thi thoi. Anh phong to
// (z 96) nam tren het, va bo nghe nay dang ky som nhat nen luon xet truoc.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || e.defaultPrevented) return;
  const modal = document.getElementById('imageLightboxModal');
  if (!modal || modal.classList.contains('hidden')) return;
  e.preventDefault();
  window.closeImageLightbox();
});

/**
 * Nhan dien chu Nhat: hiragana, katakana, kanji, dau lap 々 va truong am ー.
 * Dung de biet doan chu nao cho phep boi den va phat am.
 */
const CO_CHU_NHAT = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\u3005\u30FC]/;

/** Moi class vien sang ma applyFocusStyle co the gan (the va chu trong cau) */
const LOP_DEN_ROI = ['hl-grammar', 'hl-vocab', 'hl-warning', 'hl-reading-inline',
                     'hl-card-grammar', 'hl-card-vocab', 'hl-card-warning', 'reading-focus'];

class SlideEngine {
  constructor(loader) {
    this.loader = loader;
    this.currentLevel = "N5";
    this.currentLesson = 1;
    this.currentSlideIndex = 0;
    this.activeTab = "grammar"; // "vocab" | "kanji" | "grammar" | "kaiwa" | "quiz"
    this.activeFocusId = null;  // moi luc CHI MOT muc duoc roi sang
    this._gocCamXuc = null;     // muc co sac thai (data-emotion) vua xin doi mat meo, va luc xin
    this._lucCamXuc = 0;
    this.spotEl = null;
    this.spotCard = null;
    this.spotOpenId = null;
    window.__slideEngine = this;

    // DOM Elements cache
    this.levelBadge = document.getElementById('levelBadge');
    this.lessonNum = document.getElementById('lessonNum');
    this.slideIndexLabel = document.getElementById('slideIndexLabel');
    this.slideContent = document.getElementById('slideContent');
    this.highlightNotice = document.getElementById('highlightNotice');
    this.errorDock = document.getElementById('errorDock');
    this.errWrong = document.getElementById('errWrong');
    this.errCorrect = document.getElementById('errCorrect');
    this.errExplain = document.getElementById('errExplain');
    this.lessonSelect = document.getElementById('lessonSelect');

    // Tab buttons
    this.tabVocabBtn = document.getElementById('tabVocabBtn');
    this.tabKanjiBtn = document.getElementById('tabKanjiBtn');
    this.tabGrammarBtn = document.getElementById('tabGrammarBtn') || document.getElementById('tabSlideBtn');
    this.tabKaiwaBtn = document.getElementById('tabKaiwaBtn');
    this.tabQuizBtn = document.getElementById('tabQuizBtn');
    this.tabReflexBtn = document.getElementById('tabReflexBtn');

    this.prevSlideBtn = document.getElementById('prevSlideBtn');
    this.nextSlideBtn = document.getElementById('nextSlideBtn');

    // KHONG goi initTabEvents() o day: app.js da gan handleManualTabChange cho ca 5 tab.
    // Gan ca hai noi se khien moi lan bam tab bi render 2 lan.
    this.initTextSelectionSpeaker();
    this.initCardClickToSpotlight();
  }

  /**
   * Tính năng phát âm đoạn bôi đen:
   * Khi người học bôi đen bất kỳ chữ/từ nào trong khung bài học, hiển thị biểu tượng loa nổi
   * Bấm vào loa để phát âm đúng chính xác đoạn chữ được bôi đen đó!
   */
  /**
   * Quet mot luot sau khi render, danh dau nhung the CO CHU NHAT bang .jp-sel.
   * CSS khoa boi den ca vung roi mo lai dung nhung the nay, nen hoc vien chi
   * quet duoc chu Nhat.
   *
   * Lam bang mot luot quet thay vi sua tung ham render: cac ham render sinh
   * HTML bang chuoi o hang chuc cho, gan class tay se sot.
   */
  danhDauChuNhat() {
    if (!this.slideContent) return;
    this.slideContent.querySelectorAll('.jp-sel').forEach(el => el.classList.remove('jp-sel'));

    // Chi danh dau the NHO NHAT chua chu Nhat truc tiep, khong danh dau ca
    // the cha — danh dau the cha thi keo mot phat la quet luon ca nghia tieng Viet.
    this.slideContent.querySelectorAll('*').forEach(el => {
      for (const nut of el.childNodes) {
        if (nut.nodeType === 3 && CO_CHU_NHAT.test(nut.nodeValue || '')) {
          el.classList.add('jp-sel');
          // Mau chua gan lang: chi gan khi ca the toan chu Nhat (the tron Viet + Nhat ma gan ja
          // thi phan tieng Viet doi sang font Nhat, vo dau)
          if (!el.closest('[lang="ja"]') && !/[A-Za-zÀ-ɏḀ-ỿ]/.test(el.textContent || '')) el.lang = 'ja';
          return;
        }
      }
    });
  }

  initTextSelectionSpeaker() {
    let badge = document.getElementById('selectionSpeakerBadge');
    if (!badge) {
      badge = document.createElement('button');
      badge.id = 'selectionSpeakerBadge';
      badge.type = 'button';
      badge.className = 'fixed z-50 transform -translate-x-1/2 -translate-y-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-2xl border border-indigo-400/50 flex items-center gap-2 cursor-pointer transition active:scale-95 animate-zoom-in backdrop-blur-md hidden';
      badge.style.pointerEvents = 'auto';
      document.body.appendChild(badge);
    }

    let activeSelectedText = "";

    badge.onmousedown = (e) => {
      // Giữ vùng bôi đen (không bị mất selection khi click nút)
      e.preventDefault();
      e.stopPropagation();
    };

    badge.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (activeSelectedText) {
        window.playSpeech(activeSelectedText);
      }
    };

    const updateBadgePosition = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        badge.classList.add('hidden');
        activeSelectedText = "";
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        badge.classList.add('hidden');
        activeSelectedText = "";
        return;
      }

      // Lop chan thu hai sau CSS: co lot ra duoc mot manh tieng Viet thi cung
      // khong doc. Khong co chu Nhat nao -> khong co gi de phat am.
      if (!CO_CHU_NHAT.test(text)) {
        badge.classList.add('hidden');
        activeSelectedText = "";
        return;
      }

      // Chỉ kích hoạt khi vùng bôi đen nằm trong vùng nội dung bài học
      const range = selection.getRangeAt(0);
      const slideContent = this.slideContent || document.getElementById('slideContent');
      if (!slideContent || !slideContent.contains(range.commonAncestorContainer)) {
        badge.classList.add('hidden');
        activeSelectedText = "";
        return;
      }

      activeSelectedText = text;

      const rect = range.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        badge.classList.add('hidden');
        return;
      }

      // Đặt vị trí nổi bật phía trên vùng bôi đen
      const x = rect.left + rect.width / 2;
      let y = rect.top - 8;

      if (rect.top < 60) {
        y = rect.bottom + 36;
      }

      badge.style.left = `${Math.round(x)}px`;
      badge.style.top = `${Math.round(y)}px`;

      const preview = text.length > 15 ? text.slice(0, 15) + '…' : text;
      badge.innerHTML = `
        <i class="fa-solid fa-volume-high text-amber-300 text-xs"></i>
        <span>Phát âm: <strong class="text-amber-200 font-bold" lang="ja">"${this.escapeHtml(preview)}"</strong></span>
      `;
      badge.classList.remove('hidden');
    };

    // Dang keo chuot thi CHI AN o phat am di, khong hien.
    // Truoc day bat selectionchange de hien luon -> o nhay theo tung ky tu
    // duoc quet, che mat chinh doan chu dang chon.
    document.addEventListener('selectionchange', () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        badge.classList.add('hidden');
        activeSelectedText = '';
      }
    });

    // Tha chuot xong moi hien — luc do vung chon da xong xuoi
    document.addEventListener('mouseup', () => {
      setTimeout(updateBadgePosition, 20);
    });

    // Boi den bang ban phim (Shift + mui ten) thi lay luc nha phim lam moc
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Shift' || e.key.startsWith('Arrow')) setTimeout(updateBadgePosition, 20);
    });

    document.addEventListener('mousedown', (e) => {
      if (e.target !== badge && !badge.contains(e.target)) {
        badge.classList.add('hidden');
      }
    });
  }

  /**
   * Bam vao bat ky the noi dung nao la mo spotlight cua muc do —
   * khong phai cho bai giang chay toi moi xem duoc.
   * Dung uy quyen su kien tren #slideContent nen khong phai sua tung ham render.
   */
  initCardClickToSpotlight() {
    if (!this.slideContent) return;

    this.slideContent.addEventListener('click', (e) => {
      // Bam vao nut / o nhap / anh co onclick rieng thi de chung tu xu ly
      if (e.target.closest('button, input, select, textarea, a, [onclick]')) return;

      const card = e.target.closest('[id]');
      if (!card) return;

      const id = card.id;
      if (!/^(voc-|kan-|ex-|dia-|card-|t-)/.test(id)) return;

      // doBam: hoc vien TU bam. Rieng chuong Hoi thoai chi mo the trong truong hop nay.
      this.focusItem(id, 'reading_focus', null, { doBam: true });
    });
  }

  initTabEvents() {
    if (this.tabVocabBtn) this.tabVocabBtn.onclick = () => this.setTab('vocab');
    if (this.tabKanjiBtn) this.tabKanjiBtn.onclick = () => this.setTab('kanji');
    if (this.tabGrammarBtn) this.tabGrammarBtn.onclick = () => this.setTab('grammar');
    if (this.tabKaiwaBtn) this.tabKaiwaBtn.onclick = () => this.setTab('kaiwa');
    if (this.tabQuizBtn) this.tabQuizBtn.onclick = () => this.setTab('quiz');
    if (this.tabReflexBtn) this.tabReflexBtn.onclick = () => this.setTab('reflex');
  }

  setTab(tabName, subIndex = null) {
    // Chuẩn hóa tên tab
    if (tabName === 'slide') tabName = 'grammar';
    if (tabName === 'dialogue') tabName = 'kaiwa';
    if (tabName === 'exercise') tabName = 'quiz';

    this.activeTab = tabName;
    document.body.dataset.tab = tabName;   // CSS dung: vd chi hien nut truoc/sau o chuong ngu phap
    this.clearReadingFocus();   // sang chuong khac thi tat den roi dang bat

    // Cập nhật UI tabs
    const tabs = [
      { id: 'tabVocabBtn', el: this.tabVocabBtn, name: 'vocab' },
      { id: 'tabKanjiBtn', el: this.tabKanjiBtn, name: 'kanji' },
      { id: 'tabGrammarBtn', el: this.tabGrammarBtn, name: 'grammar' },
      { id: 'tabKaiwaBtn', el: this.tabKaiwaBtn, name: 'kaiwa' },
      { id: 'tabQuizBtn', el: this.tabQuizBtn, name: 'quiz' },
      { id: 'tabReflexBtn', el: this.tabReflexBtn, name: 'reflex' }
    ];

    tabs.forEach(t => {
      if (t.el) {
        if (t.name === tabName) {
          t.el.className = "chapter is-active";
        } else {
          t.el.className = "chapter";
        }
      }
    });

    // Ẩn/Hiện nút chuyển slide tuỳ theo phân môn
    if (this.prevSlideBtn && this.nextSlideBtn) {
      if (tabName === 'grammar') {
        this.prevSlideBtn.style.display = 'inline-flex';
        this.nextSlideBtn.style.display = 'inline-flex';
      } else {
        this.prevSlideBtn.style.display = 'none';
        this.nextSlideBtn.style.display = 'none';
      }
    }

    this._renderTabContentWhenReady(tabName, subIndex);
  }

  /**
   * Bai co the moi chi la muc luc nhe (chua co vocabList that su — xem
   * CurriculumLoader.ensureLessonLoaded). Cho nay tai not chi tiet day du
   * TRUOC khi ve, thay vi ve ngay tren du lieu rong.
   */
  async _renderTabContentWhenReady(tabName, subIndex) {
    const lvl = this.currentLevel, baiSo = this.currentLesson;
    const bai = this.loader.getLesson(lvl, baiSo);
    if (bai && !Array.isArray(bai.vocabList)) {
      if (this.slideContent) {
        this.slideContent.innerHTML = `
          <div class="text-center py-16 text-slate-400">
            <i class="fa-solid fa-spinner fa-spin text-2xl mb-2 text-indigo-400"></i>
            <p class="font-medium">Đang tải bài học…</p>
          </div>`;
      }
      await this.loader.ensureLessonLoaded(lvl, baiSo);
      // Trong luc cho, hoc vien da chuyen sang bai/tab khac roi thi thoi,
      // khong ve de nay chong len muc hien tai nua.
      if (this.currentLevel !== lvl || this.currentLesson !== baiSo || this.activeTab !== tabName) return;

      // Loader da thu lai ma van hong: bao loi + nut thu lai, KHONG de spinner
      // treo mai hay de cac chuong kia bao nham "chua co noi dung".
      const baiSau = this.loader.getLesson(lvl, baiSo);
      if (!baiSau || !Array.isArray(baiSau.vocabList)) {
        this._veLoiTaiBai(tabName, subIndex);
        return;
      }
    }
    this._renderTabContentNow(tabName, subIndex);
  }

  /** The bao loi tai bai. Loi khong bi ghi nho, nen bam thu lai la tai lai tu dau. */
  _veLoiTaiBai(tabName, subIndex) {
    if (this.levelBadge) this.levelBadge.innerText = this.currentLevel;
    if (this.lessonNum) this.lessonNum.innerText = this.currentLesson;
    if (this.slideIndexLabel) this.slideIndexLabel.innerText = '—';
    if (!this.slideContent) return;
    this.slideContent.className = "deck-content slide-fade-enter";
    this.slideContent.innerHTML = `
      <div class="text-center py-16 text-slate-400">
        <i class="fa-solid fa-triangle-exclamation text-2xl mb-2 text-rose-400"></i>
        <p class="font-medium">Không tải được bài học. Kiểm tra mạng rồi thử lại.</p>
        <button type="button" data-thu-lai class="ctl ctl-ghost mt-3">
          <i class="fa-solid fa-rotate-right"></i> Thử lại
        </button>
      </div>`;
    const nut = this.slideContent.querySelector('[data-thu-lai]');
    if (nut) nut.addEventListener('click', () => this.setTab(tabName, subIndex));
    this.reapplyBusy();
    if (this.prevSlideBtn) this.prevSlideBtn.disabled = true;
    if (this.nextSlideBtn) this.nextSlideBtn.disabled = true;
    if (window.SenseiBoard && window.SenseiBoard.donMoCoi) window.SenseiBoard.donMoCoi();
    // Van bao doi tab nhu _renderTabContentNow: app.js tat phan xa/mic, huy dong ho
    // viet tay, ve lai lop cho. Bo 'quiz': khiDoiTab se goi AI soan de tren bai rong.
    if (typeof this.onTabChange === 'function' && tabName !== 'quiz') this.onTabChange(tabName);
  }

  _renderTabContentNow(tabName, subIndex) {
    if (tabName === 'vocab') {
      this.renderVocab();
    } else if (tabName === 'kanji') {
      this.renderKanji();
    } else if (tabName === 'kaiwa') {
      this.renderKaiwa();
    } else if (tabName === 'reflex') {
      this.renderReflex();
    } else if (tabName === 'quiz') {
      this.renderQuiz(subIndex !== null && subIndex !== undefined ? Number(subIndex) : null);
    } else {
      this.renderGrammar(subIndex !== null ? Number(subIndex) : this.currentSlideIndex);
    }

    // Bao ra ngoai SAU khi render: ben goi quyet dinh chuong nay co dang
    // cho viec gi khong (soan de / long tieng) de bat lai lop cho.
    this.danhDauChuNhat();
    this.reapplyBusy();
    if (window.SenseiBoard && window.SenseiBoard.donMoCoi) window.SenseiBoard.donMoCoi();
    if (typeof this.onTabChange === 'function') this.onTabChange(tabName);
  }

  renderCurrentSlide() {
    this.setTab(this.activeTab);
  }

  /** @returns {boolean} false khi cap/bai khong ton tai (vd N4 bai 1) — khong doi gi ca */
  renderSlide(level, lessonId, slideIdx) {
    const lvl = (level || "N5").toUpperCase();
    const n = Number(lessonId) || 1;
    // Bai khong co that thi getLesson() tut ve bai dau cap -> hien noi dung bai
    // khac duoi so bai sai. Chan tu dau va bao that bai cho ben goi (tool Gemini).
    if (!this.loader.getLessonsForLevel(lvl).some(l => l.lessonNumber === n)) return false;
    this.currentLevel = lvl;
    this.currentLesson = n;
    this.currentSlideIndex = Number(slideIdx) || 0;
    this.setTab('grammar', this.currentSlideIndex);
    return true;
  }

  // 1. Phân môn Từ vựng (Vocabulary)
  renderVocab() {
    const vocabs = this.loader.getVocabList(this.currentLevel, this.currentLesson);

    if (this.levelBadge) this.levelBadge.innerText = this.currentLevel;
    if (this.lessonNum) this.lessonNum.innerText = this.currentLesson;
    if (this.slideIndexLabel) this.slideIndexLabel.innerText = `${vocabs.length} từ vựng`;

    this.clearHighlights();

    if (!vocabs || vocabs.length === 0) {
      if (this.slideContent) {
        this.slideContent.innerHTML = `
          <div class="text-center py-12 text-slate-400">
            <i class="fa-solid fa-book-open text-3xl mb-2 text-indigo-400"></i>
            <p class="font-medium">Chưa có danh sách từ vựng cho bài này.</p>
          </div>
        `;
      }
      return;
    }

    // Loai tu hien bang chu xam tron (thong tin phu, khong can chip mau).
    // Giao trinh thuc te ghi loai tu bang tieng Anh day du (adjective, adverb...)
    // — thieu khoa thi hien nguyen chu Anh.
    const typeLabels = {
      "noun": "Danh từ",
      "verb": "Động từ",
      "adj-i": "Tính từ -i",
      "adj-na": "Tính từ -na",
      "particle": "Trợ từ",
      "adnominal": "Đại từ chỉ định",
      "counter": "Lượng từ đếm",
      "phrase": "Thành ngữ / Câu",
      "adjective": "Tính từ",
      "adverb": "Phó từ",
      "pronoun": "Đại từ",
      "expression": "Cụm từ / Mẫu câu",
      "determiner": "Từ chỉ định"
    };

    const vocabCardsHtml = vocabs.map((v) => {
      const typeText = typeLabels[v.wordType] || this.escapeHtml(v.wordType) || "Từ vựng";
      const kanjiOrWord = v.kanji || v.word;
      // lang="ja" dat thang len ruby/span: quy tac `ruby { serif }` trong styles.css
      // thang ke thua, dat o the cha thi chu Han lai ra Mincho.
      const displayWord = v.kanji && v.furigana && v.furigana !== v.kanji
        ? `<ruby lang="ja" class="vc-word">${this.escapeHtml(v.kanji)}<rt>${this.escapeHtml(v.furigana)}</rt></ruby>`
        : `<span lang="ja" class="vc-word">${this.escapeHtml(v.word)}</span>`;

      // Mot dong phu: romaji · loai tu (chu tron, khong ngoac, khong monospace)
      const metaHtml = [v.romaji ? this.escapeHtml(v.romaji) : '', typeText].filter(Boolean).join(' · ');
      // Ghi chu toi da 2 dong; title giu ban day du de di chuot doc het (F149/F169)
      const accentHtml = v.accentNote ? `
            <div class="vc-note" title="${this.escapeHtml(v.accentNote)}">${this.escapeHtml(v.accentNote)}</div>` : '';

      // Anh nho: anh that -> hinh ve SVG -> khong co gi (khong lap lai chu cua tu).
      // Giu .shrink-0: choGanHuyHieu() dung no de khong gan "Dang doc…" vao o anh.
      const artSvg = v.imageUrl ? null : this.artFor(v);
      const visualThumbnailHtml = v.imageUrl ? `
          <div class="vc-thumb shrink-0"
               onclick="window.openImageLightbox('${this.jsAttr(v.imageUrl)}', '${this.jsAttr(kanjiOrWord)} (${this.jsAttr(v.furigana || v.word)})', '${this.jsAttr(v.meaningVi)}')"
               title="Bấm để xem ảnh phóng to">
            <img src="${this.escapeHtml(v.imageUrl)}" alt="${this.escapeHtml(v.imageAlt || v.meaningVi)}" loading="lazy"
                 onerror="this.parentElement.remove()" />
          </div>`
        : (artSvg ? `
          <div class="sensei-art sensei-art-sm shrink-0" title="Minh hoạ: ${this.escapeHtml(v.meaningVi || "")}">${artSvg}</div>` : '');

      // Chu dung truoc, cot phai (loa tren, anh duoi) dung sau: the co anh hay
      // khong thi tu van thang mep trai, loa van o goc phai tren.
      return `
        <div id="${this.escapeHtml(v.id)}" class="deck-card vc-card p-3"${this.camXucAttr(v)}>
          <div class="vc-body">
            <div class="vc-word-row">${displayWord}</div>
            <div class="vc-meta">${metaHtml}</div>
            <div class="vc-mean">${this.escapeHtml(v.meaningVi)}</div>${accentHtml}
          </div>
          <div class="vc-side">
            <button type="button" class="icon-btn"
                    onclick="window.playSpeech('${this.jsAttr(v.kanji || v.word)}', '${this.jsAttr(v.id)}')"
                    title="Nghe phát âm chuẩn" aria-label="Nghe phát âm">
              <i class="fa-solid fa-volume-high"></i>
            </button>${visualThumbnailHtml}
          </div>
        </div>`;
    }).join("");

    if (this.slideContent) {
      this.slideContent.className = "deck-content slide-fade-enter";
      this.slideContent.innerHTML = `
        <header class="deck-head" title="Bấm biểu tượng loa để nghe phát âm giọng bản xứ. Bấm vào thẻ để xem hình minh hoạ và ghi chú.">
          <h2 class="deck-h2">Từ vựng</h2>
          <span class="deck-meta">${vocabs.length} từ · bấm loa để nghe</span>
        </header>
        <div class="vc-list grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 deck-scroll custom-scrollbar">
          ${vocabCardsHtml}
        </div>
      `;
    }
  }

  // 2. Phân môn Chữ Hán (Kanji)
  renderKanji() {
    const kanjis = this.loader.getKanjiList(this.currentLevel, this.currentLesson);

    if (this.levelBadge) this.levelBadge.innerText = this.currentLevel;
    if (this.lessonNum) this.lessonNum.innerText = this.currentLesson;
    if (this.slideIndexLabel) this.slideIndexLabel.innerText = `${kanjis.length} chữ Hán`;

    this.clearHighlights();

    if (!kanjis || kanjis.length === 0) {
      if (this.slideContent) {
        this.slideContent.innerHTML = `
          <div class="text-center py-12 text-slate-400">
            <i class="fa-solid fa-square-pen text-3xl mb-2 text-indigo-400"></i>
            <p class="font-medium">Chưa có danh sách chữ Hán cho bài này.</p>
          </div>
        `;
      }
      return;
    }

    let coNetViet = false;   // co chu nao co du lieu net -> the mo ra se viet tung net
    const kanjiCardsHtml = kanjis.map(k => {
      // Tu ghep: danh sach phang, gach manh giua cac dong; nghia nam ngay canh tu
      // (luoi auto/1fr), khong day ra tan mep phai the.
      const commonWordsHtml = (k.commonWords || []).map(cw => `
              <li>
                <span class="kj-wj"><span lang="ja" class="kj-w">${this.escapeHtml(cw.word)}</span>${cw.furigana ? `<span lang="ja" class="kj-r">${this.escapeHtml(cw.furigana)}</span>` : ''}</span>
                <span class="kj-m">${this.escapeHtml(cw.meaningVi)}</span>
              </li>`).join("");
      const doc = (arr) => (arr || []).map(x => this.escapeHtml(x)).join(', ') || '—';
      if (this._coVietNet(k.character)) coNetViet = true;

      // O chu KHONG mang .font-bold / span: choGanHuyHieu() lay phan tu khop dau tien
      // lam cho gan "Dang doc…" — o chu 64px ma bi gan vao thi vo dong.
      return `
        <div id="${this.escapeHtml(k.id)}" class="deck-card kj-card p-4">
          <div class="kj-top">
            <div class="kj-glyph jp-serif shrink-0" lang="ja">${this.escapeHtml(k.character)}</div>
            <div class="kj-id">
              <div class="kj-line1"><span class="kj-hv" title="Âm Hán Việt">${this.escapeHtml(k.hanViet)}</span><span class="kj-strokes"> · ${this.escapeHtml(String(k.strokeCount ?? '?'))} nét</span></div>
              <div class="kj-mean">${this.escapeHtml(k.meaningVi)}</div>
            </div>
            <button type="button" class="icon-btn"
                    onclick="window.playSpeech('${this.jsAttr(k.character)}', '${this.jsAttr(k.id)}')"
                    title="Phát âm chữ Hán" aria-label="Phát âm chữ Hán">
              <i class="fa-solid fa-volume-high"></i>
            </button>
          </div>
          <dl class="kj-read">
            <dt title="Âm On (âm Hán)">Âm On</dt><dd lang="ja">${doc(k.onyomi)}</dd>
            <dt title="Âm Kun (âm Nhật)">Âm Kun</dt><dd lang="ja">${doc(k.kunyomi)}</dd>
          </dl>${commonWordsHtml ? `
          <div class="kj-words-box">
            <div class="kj-label">Từ ghép</div>
            <ul class="kj-words">${commonWordsHtml}
            </ul>
          </div>` : ''}
        </div>`;
    }).join("");

    if (this.slideContent) {
      this.slideContent.className = "deck-content slide-fade-enter";
      this.slideContent.innerHTML = `
        <header class="deck-head" title="Âm Hán Việt, cách đọc On / Kun và các từ ghép thường gặp trong đề thi JLPT.">
          <h2 class="deck-h2">Chữ Hán</h2>
          <span class="deck-meta">${kanjis.length} chữ · ${coNetViet ? 'bấm thẻ để xem cách viết' : 'bấm thẻ để xem chi tiết'}</span>
        </header>
        <div class="kj-list grid grid-cols-1 md:grid-cols-2 gap-3 deck-scroll custom-scrollbar">
          ${kanjiCardsHtml}
        </div>
      `;
    }
  }

  // 3. Phân môn Ngữ pháp (Grammar Slide)
  renderGrammar(slideIdx = 0) {
    this.currentSlideIndex = Number(slideIdx) || 0;
    const data = this.loader.getSlide(this.currentLevel, this.currentLesson, this.currentSlideIndex);

    if (!data || !data.slide) {
      console.warn("Slide not found:", { level: this.currentLevel, lesson: this.currentLesson, slideIdx });
      // Khong de nguyen DOM cu (spinner / chuong truoc) duoi tab Ngu phap
      if (this.levelBadge) this.levelBadge.innerText = this.currentLevel;
      if (this.lessonNum) this.lessonNum.innerText = this.currentLesson;
      if (this.slideIndexLabel) this.slideIndexLabel.innerText = '0 slide';
      if (this.prevSlideBtn) this.prevSlideBtn.disabled = true;
      if (this.nextSlideBtn) this.nextSlideBtn.disabled = true;
      this.clearHighlights();
      if (this.slideContent) {
        this.slideContent.innerHTML = `
          <div class="text-center py-12 text-slate-400">
            <i class="fa-solid fa-chalkboard-user text-3xl mb-2 text-indigo-400"></i>
            <p class="font-medium">Chưa có slide ngữ pháp cho bài này.</p>
          </div>
        `;
      }
      return false;
    }

    const { slide, slideIndex, totalSlides, lesson } = data;
    this.currentSlideIndex = slideIndex;

    if (this.levelBadge) this.levelBadge.innerText = this.currentLevel;
    if (this.lessonNum) this.lessonNum.innerText = this.currentLesson;
    // Chi so: chu "Slide" chiem cho tren thanh duoi dien thoai
    if (this.slideIndexLabel) this.slideIndexLabel.innerText = `${slideIndex + 1}/${totalSlides}`;
    // Chan hai dau: nut bi disabled thi khong bam duoc, ben app.js cung khong
    // tam dung bai giang / cat tieng vi mot cu bam khong di dau ca.
    if (this.prevSlideBtn) this.prevSlideBtn.disabled = slideIndex <= 0;
    if (this.nextSlideBtn) this.nextSlideBtn.disabled = slideIndex >= totalSlides - 1;

    this.clearHighlights();

    // Vi du: token co ruby, tro tu trong tam to nen nhe; dau cau dinh vao chu truoc
    const examplesHtml = (slide.examples || []).map((ex) => {
      const fullSentenceText = (ex.tokens || []).map(tok => tok.kanji || tok.text || "").join("");
      const tokensHtml = this.ghepTokenCau(ex.tokens, (tok, i, ds) => {
        const rt = this.rtCua(tok);
        const inner = rt
          ? this.rubyCau(tok, rt, i, ds)
          : this.escapeHtml(tok.text || "");
        return `<span id="${this.escapeHtml(tok.id)}" onclick="window.playSpeech('${this.jsAttr(tok.kanji || tok.text)}', '${this.jsAttr(tok.id)}'); event.stopPropagation();" class="jp-tok${tok.isKeyGrammar ? ' is-key' : ''}" title="Bấm để nghe đọc: ${this.escapeHtml(tok.text)}">${inner}</span>`;
      });

      const exImageHtml = ex.imageUrl ? `
        <div class="gp-ex-img"
             onclick="window.openImageLightbox('${this.jsAttr(ex.imageUrl)}', 'Tình huống ví dụ', '${this.jsAttr(ex.meaningVi || "")}')"
             title="Bấm để xem ảnh tình huống phóng to">
          <img src="${ex.imageUrl}" alt="${this.escapeHtml(ex.meaningVi || '')}" loading="lazy"
               onerror="this.parentElement.style.display='none'" />
        </div>` : '';

      return `
        <div id="${this.escapeHtml(ex.id)}" class="deck-card gp-ex"${this.camXucAttr(ex)}>
          ${exImageHtml}
          <div class="gp-ex-body">
            <div class="gp-ex-line">
              <div class="jp-sentence" lang="ja">${tokensHtml}</div>
              <button type="button" class="icon-btn"
                      onclick="window.playSpeech('${this.jsAttr(fullSentenceText)}', '${this.jsAttr(ex.id)}')"
                      title="Nghe câu ví dụ" aria-label="Nghe câu ví dụ">
                <i class="fa-solid fa-volume-high"></i>
              </button>
            </div>
            <div class="gp-ex-mean">${this.escapeHtml(ex.meaningVi || "")}</div>
          </div>
        </div>`;
    }).join("");

    const teacherTipHtml = slide.teacherTips
      ? `<p class="deck-note gp-note"><b>Lời khuyên:</b> ${this.escapeHtml(slide.teacherTips)}</p>` : '';
    const culturalNoteHtml = slide.culturalNotes
      ? `<p class="deck-note is-gold gp-note"><b>Văn hóa Nhật:</b> ${this.escapeHtml(slide.culturalNotes)}</p>` : '';
    const soViDu = (slide.examples || []).length;

    if (this.slideContent) {
      this.slideContent.className = "deck-content slide-fade-enter";
      // Tieu de o ngoai, con lai nam trong vung cuon — giai thich dai khong
      // chiem cho co dinh tren man hinh thap (dien thoai ngang)
      this.slideContent.innerHTML = `
        <header class="deck-head">
          <h2 class="deck-h2 jp-keep">${this.escapeHtml(slide.title)}</h2>
          ${soViDu ? `<span class="deck-meta" title="Bấm vào từng từ để nghe đọc">${soViDu} ví dụ</span>` : ''}
        </header>
        <div class="deck-scroll custom-scrollbar gp-list">
          ${slide.explanation ? `<p class="gp-explain">${this.escapeHtml(slide.explanation)}</p>` : ''}
          ${slide.grammarFormula ? `
          <div class="gp-formula">
            <span class="gp-formula-label">Cấu trúc</span>
            <span class="gp-formula-text">${this.escapeHtml(slide.grammarFormula).replace(/[　-ヿ㐀-䶿一-鿿！-｠]+/g, '<span lang="ja">$&</span>')}</span>
          </div>` : ''}
          ${examplesHtml}
          ${teacherTipHtml}
          ${culturalNoteHtml}
        </div>
      `;
      // Next/Prev/focusItem goi thang ham nay, khong qua _renderTabContentNow:
      // phai tu danh dau .jp-sel (khong thi khong boi den duoc) va bat lai lop cho.
      this.danhDauChuNhat();
      this.reapplyBusy();
      // Net khoanh cua slide cu khong con cho bam -> xoa, khong de treo lo lung
      if (window.SenseiBoard && window.SenseiBoard.donMoCoi) window.SenseiBoard.donMoCoi();
    }

    return true;
  }

  // 4. Phân môn Hội thoại (Kaiwa Dialogue)
  renderKaiwa() {
    const dialogue = this.loader.getDialogue(this.currentLevel, this.currentLesson);
    const lesson = this.loader.getLesson(this.currentLevel, this.currentLesson);

    if (this.levelBadge) this.levelBadge.innerText = this.currentLevel;
    if (this.lessonNum) this.lessonNum.innerText = this.currentLesson;
    if (this.slideIndexLabel) this.slideIndexLabel.innerText = `${dialogue.length} lượt thoại`;

    this.clearHighlights();

    if (!dialogue || dialogue.length === 0) {
      if (this.slideContent) {
        this.slideContent.innerHTML = `
          <div class="text-center py-12 text-slate-400">
            <i class="fa-solid fa-comments text-3xl mb-2 text-indigo-400"></i>
            <p class="font-medium">Chưa có bài hội thoại cho bài này.</p>
          </div>
        `;
      }
      return;
    }

    // Ben trai / phai chon THEO NGUOI NOI, khong theo tung cau: mot nguoi luc
    // personA luc personB (N5-1: 佐藤) thi van giu mot ben. Lay vai chiem da so
    // cua nguoi do; vai ghi bang chu ("Đồng nghiệp"...) thi theo thu tu xuat hien.
    const thuTuNguoi = new Map();
    const diemVai = new Map();   // >0: nghieng ve A (trai), <0: nghieng ve B (phai)
    dialogue.forEach(l => {
      if (!thuTuNguoi.has(l.speaker)) thuTuNguoi.set(l.speaker, thuTuNguoi.size);
      const d = (l.speakerRole === 'personA' || l.speakerRole === 'sensei') ? 1
        : (l.speakerRole === 'personB' ? -1 : 0);
      diemVai.set(l.speaker, (diemVai.get(l.speaker) || 0) + d);
    });
    const benPhaiCua = (nguoi) => {
      const d = diemVai.get(nguoi) || 0;
      return d !== 0 ? d < 0 : (thuTuNguoi.get(nguoi) || 0) % 2 === 1;
    };
    // Ba nguoi tro len: nguoi thu hai cung mot ben (N5-1: 佐藤 roi 山田 deu ben phai) dung vong chu vien,
    // khong nen dac -> hai luot lien nhau cung ben khong doc thanh mot nguoi
    const nguoiThu2 = new Set();
    const soBen = [0, 0];
    thuTuNguoi.forEach((_, nguoi) => { if (soBen[+benPhaiCua(nguoi)]++ > 0) nguoiThu2.add(nguoi); });

    const dialogueHtml = dialogue.map((line) => {
      const fullText = (line.tokens || []).map(tok => tok.kanji || tok.text || "").join("");
      const tokensHtml = this.ghepTokenCau(line.tokens, (tok, i, ds) => {
        const rt = this.rtCua(tok);
        const inner = rt
          ? this.rubyCau(tok, rt, i, ds)
          : this.escapeHtml(tok.text || "");
        return `<span id="${this.escapeHtml(tok.id)}" onclick="window.playSpeech('${this.jsAttr(tok.kanji || tok.text)}', '${this.jsAttr(tok.id)}'); event.stopPropagation();" class="jp-tok" title="Bấm để nghe đọc">${inner}</span>`;
      });

      const benPhai = benPhaiCua(line.speaker);
      const ten = String(line.speaker || '');
      const chuDau = Array.from(ten.trim())[0] || '';

      // Chi co anh that moi hien anh; khong thi mot vong tron chu cai dau nho
      const avatarHtml = line.avatarUrl ? `
        <div class="kw-ava is-anh"
             onclick="window.openImageLightbox('${this.jsAttr(line.avatarUrl)}', '${this.jsAttr(ten)}', 'Nhân vật hội thoại')"
             title="${this.escapeHtml(ten)}">
          <img src="${line.avatarUrl}" alt="${this.escapeHtml(ten)}"
               onerror="const o=this.parentElement; o.className='kw-ava is-chu${nguoiThu2.has(line.speaker) ? ' is-vien' : ''}'; o.textContent='${this.jsAttr(chuDau)}';" />
        </div>` : `
        <div class="kw-ava is-chu${nguoiThu2.has(line.speaker) ? ' is-vien' : ''}" aria-hidden="true">${this.escapeHtml(chuDau)}</div>`;

      // id nam tren bong thoai (khong phai ca hang): vien sang / rọi den bam dung the
      return `
        <div class="kw-row${benPhai ? ' is-b' : ''}">
          ${avatarHtml}
          <div id="${this.escapeHtml(line.id)}" class="deck-card kw-bubble"${this.camXucAttr(line)}>
            <div class="kw-top">
              <span class="kw-name">${this.escapeHtml(ten)}</span>
              <button type="button" class="icon-btn"
                      onclick="window.playSpeech('${this.jsAttr(fullText)}', '${this.jsAttr(line.id)}')"
                      title="Nghe câu thoại" aria-label="Nghe câu thoại">
                <i class="fa-solid fa-volume-high"></i>
              </button>
            </div>
            <div class="jp-sentence" lang="ja">${tokensHtml}</div>
            <div class="kw-mean">${this.escapeHtml(line.meaningVi)}</div>
          </div>
        </div>`;
    }).join("");

    if (this.slideContent) {
      this.slideContent.className = "deck-content slide-fade-enter";
      this.slideContent.innerHTML = `
        <header class="deck-head" title="Luyện đàm thoại theo ngữ cảnh thực tế — Sensei đóng vai cùng học viên. Bấm vào câu để xem kỹ.">
          <h2 class="deck-h2">Hội thoại</h2>
          <span class="deck-meta">${dialogue.length} lượt · ${thuTuNguoi.size} người nói</span>
        </header>
        <div class="deck-scroll custom-scrollbar kw-list">
          ${dialogueHtml}
        </div>
      `;
    }
  }

  // 5. Phân môn Luyện bài tập (Quiz Mode)
  renderQuiz(targetExerciseIndex = null) {
    const exercises = this.loader.getExercises(this.currentLevel, this.currentLesson);
    const lesson = this.loader.getLesson(this.currentLevel, this.currentLesson);

    if (this.levelBadge) this.levelBadge.innerText = this.currentLevel;
    if (this.lessonNum) this.lessonNum.innerText = this.currentLesson;
    if (this.slideIndexLabel) this.slideIndexLabel.innerText = `${exercises.length} câu hỏi`;

    this.clearHighlights();

    const soCau = (exercises || []).length;
    const quizHtml = (exercises || []).map((ex, qIdx) => {
      const questionImageHtml = ex.imageUrl ? `
        <div class="qz-img"
             onclick="window.openImageLightbox('${this.jsAttr(ex.imageUrl)}', 'Tranh tình huống: Câu ${qIdx + 1}', '${this.jsAttr(ex.question)}')"
             title="Bấm để xem tranh tình huống đầy đủ">
          <img src="${ex.imageUrl}" alt="Tranh tình huống câu hỏi" loading="lazy"
               onerror="this.parentElement.style.display='none'" />
        </div>` : '';

      const optionsHtml = (ex.options || []).map((opt, optIdx) => `
          <button type="button" class="qz-opt"
                  onclick="window.handleSelectOption('${this.jsAttr(ex.id)}', ${optIdx}, ${ex.correctIndex})"
                  id="btn-opt-${ex.id}-${optIdx}">
            <span class="qz-key">${String.fromCharCode(65 + optIdx)}</span>
            <span class="qz-opt-text">${this.escapeHtml(opt)}</span>
            <i class="fa-solid fa-circle-check opacity-0 text-emerald-400" id="icon-opt-${ex.id}-${optIdx}"></i>
          </button>`).join("");

      // De AI gan san muc do "[Vừa] ..." vao dau cau hoi: dua sang dong so cau,
      // khong de thanh the rieng truoc cau hoi (du lieu goc giu nguyen)
      const mMuc = /^\[(Dễ|Vừa|Khó)\]\s*/.exec(ex.question || '');
      const cauHoi = mMuc ? ex.question.slice(mMuc[0].length) : ex.question;

      return `
        <div id="card-${ex.id}" class="deck-card qz-card${targetExerciseIndex === qIdx ? ' is-target' : ''}">
          <div class="qz-q">
            <div class="qz-q-top"><span class="qz-no">Câu ${qIdx + 1}/${soCau}${mMuc ? ' · ' + mMuc[1] : ''}</span></div>
            <p class="qz-text">${this.escapeHtml(cauHoi)}</p>
          </div>
          ${questionImageHtml}
          <div class="qz-opts grid grid-cols-1 md:grid-cols-2 gap-2">
            ${optionsHtml}
          </div>
          <div id="explain-${ex.id}" class="hidden"></div>
        </div>`;
    }).join("");

    // Ba phan trong mot vung cuon dai -> thanh nhay nhanh dinh tren dau vung cuon
    const phatAmHtml = this.buildPronunciationBlock();
    const vietTayHtml = this.buildHandwritingBlock();
    const phan = [];
    if (soCau) phan.push({ id: 'qz-trac-nghiem', ten: 'Trắc nghiệm', so: soCau });
    if (phatAmHtml) phan.push({ id: 'qz-phat-am', ten: 'Phát âm', so: (this.pronunciationSet || []).length });
    if (vietTayHtml) phan.push({ id: 'qz-viet-tay', ten: 'Viết tay', so: (this.handwritingSet || []).length });
    const navHtml = phan.length > 1 ? `
          <div class="qz-jump">
            <nav class="deck-seg" aria-label="Các phần bài tập">
              ${phan.map((p, i) => `<button type="button" data-qz-toi="${p.id}"${i === 0 ? ' class="is-active"' : ''}>${p.ten} · ${p.so}</button>`).join('')}
            </nav>
          </div>` : '';

    const coAI = (exercises || []).some(ex => ex.generated);
    const meta = [];
    if (!navHtml && soCau) meta.push(`${soCau} câu`);
    if (soCau) meta.push(coAI ? 'soạn bởi AI' : 'đề theo giáo trình');

    const tracNghiemHtml = soCau
      ? `<section id="qz-trac-nghiem" class="qz-sec">${quizHtml}</section>`
      // Van giu phan luyen phat am / viet tay: chung lay tu giao trinh, khong
      // dinh gi toi bo de trac nghiem.
      : `<p class="qz-trong">Chưa có câu trắc nghiệm nào cho bài này.</p>`;

    if (this.slideContent) {
      this.slideContent.className = "deck-content slide-fade-enter";
      this.slideContent.innerHTML = `
        <header class="deck-head" title="Chọn đáp án đúng — Sensei nhận xét và giải thích.">
          <h2 class="deck-h2">Bài tập</h2>
          ${meta.length ? `<span class="deck-meta">${meta.join(' · ')}</span>` : ''}
          ${soCau ? `
          <button type="button" id="quizRegenBtn"
                  onclick="window.regenerateQuiz && window.regenerateQuiz()"
                  class="ctl ctl-ghost shrink-0" title="Nhờ AI soạn một bộ đề khác">
            <i class="fa-solid fa-rotate"></i><span>Đổi đề khác</span>
          </button>` : ''}
        </header>
        <div class="deck-scroll custom-scrollbar qz-list">
          ${navHtml}
          ${tracNghiemHtml}
          ${phatAmHtml}
          ${vietTayHtml}
        </div>
      `;
      this.ganNhayPhanBaiTap();
    }

    if (!soCau) return;

    if (targetExerciseIndex !== null) {
      const targetCard = document.getElementById(`card-${exercises[targetExerciseIndex]?.id}`);
      if (targetCard) targetCard.scrollIntoView({ behavior: this._itChuyenDong() ? 'auto' : 'smooth', block: 'center' });
    }
  }

  /**
   * Khoi luyen phat am o cuoi chuong Bai tap.
   * Cau lay tu giao trinh (bai dang hoc + cac bai da hoc), khong goi AI.
   */

  /**
   * Khoi LUYEN VIET TAY o cuoi chuong Bai tap.
   *
   * Cho 10 giay de viet lai chu bang tay tren khung, roi Sensei nhin anh cham.
   * De lay tu giao trinh (getHandwritingSet), khong goi AI de ra de.
   */

  /**
   * Chuong PHAN XA — luyen phan xa cap toc, Sensei (phien live) cham truc tiep.
   *
   * Chi dung vo: toan bo noi dung tung muc do app.js bom vao #pxThan theo
   * tung nhip cua vong luyen (xem phanXa trong app.js).
   */
  renderReflex() {
    if (this.levelBadge) this.levelBadge.innerText = this.currentLevel;
    if (this.lessonNum) this.lessonNum.innerText = this.currentLesson;
    // Nhan o thanh duoi chi dung cho ngu phap; 'phản xạ' chi lap lai ten tab
    if (this.slideIndexLabel) this.slideIndexLabel.innerText = '';
    this.clearHighlights();
    if (!this.slideContent) return;

    // Boc trong vung cuon: the cau hoi (khung ve + nut nop + loi phan) cao hon
    // man hinh dien thoai thap -> truoc day bi cat mat, khong cuon toi duoc.
    this.slideContent.className = "deck-content slide-fade-enter";
    // Tieu de nam ngoai cot giua (nhu cac chuong khac) -> khong nhay ngang khi doi tab
    this.slideContent.innerHTML = `
      <header class="deck-head" title="Không có thời gian nghĩ. Đề hiện ra là làm luôn — Sensei nghe/nhìn rồi phán ngay tại chỗ.">
        <h2 class="deck-h2">Phản xạ nhanh</h2>
        <span class="deck-meta">đề hiện ra là làm luôn</span>
      </header>
      <div class="deck-scroll custom-scrollbar rx-scroll">
        <div class="rx-wrap max-w-2xl mx-auto">
          <div class="deck-seg rx-seg" role="group" aria-label="Chế độ luyện">
            <button type="button" id="pxCheViet"
                    onclick="window.doiCheDoPhanXa && window.doiCheDoPhanXa('viet')">
              <i class="fa-solid fa-pen-nib"></i>Viết nhanh
            </button>
            <button type="button" id="pxCheNoi"
                    onclick="window.doiCheDoPhanXa && window.doiCheDoPhanXa('noi')">
              <i class="fa-solid fa-microphone-lines"></i>Nói nhanh
            </button>
          </div>

          <div id="pxThan" class="rx-than"></div>
        </div>
      </div>`;

    if (typeof window.veManPhanXa === 'function') window.veManPhanXa();
  }

  /**
   * Ghep token thanh cau tieng Nhat, KHONG chen dau cach giua cac tu.
   * Dau cau (、。！？」…) dinh vao tu dung truoc, ngoac mo (「『（) dinh vao tu
   * dung sau; ca cum boc trong .jp-tok-nhom (nowrap) nen dau cau khong bao
   * gio bi day xuong dau dong. Dau cau giu id nhung khong bam / khong phat am.
   * @param veTu (tok, i, tokens) => HTML cua mot token chu (i, tokens: de rubyCau xet token ben canh)
   */
  ghepTokenCau(tokens, veTu) {
    const DAU_DONG = /^[、。，．,.！？!?・…‥」』）)】〉》]+$/;
    const DAU_MO = /^[「『（(【〈《]+$/;
    const cum = [];
    let choMo = [];
    const dau = (tok, chu, mo) =>
      `<span${tok.id ? ` id="${this.escapeHtml(tok.id)}"` : ''} class="tok-dau${mo ? ' tok-mo' : ''}">${this.escapeHtml(chu)}</span>`;

    (tokens || []).forEach((tok, i, ds) => {
      const chu = String(tok.text || tok.kanji || '');
      if (DAU_MO.test(chu)) { choMo.push(dau(tok, chu, true)); return; }
      if (DAU_DONG.test(chu)) {
        const html = dau(tok, chu, false);
        if (cum.length && !choMo.length) cum[cum.length - 1].push(html);
        else { cum.push([...choMo, html]); choMo = []; }
        return;
      }
      cum.push([...choMo, veTu(tok, i, ds)]);
      choMo = [];
    });
    if (choMo.length) cum.push(choMo);

    return cum.map(c => c.length > 1 ? `<span class="jp-tok-nhom">${c.join('')}</span>` : c[0]).join('');
  }

  /**
   * Thanh nhay nhanh cua chuong Bai tap: bam la cuon DUNG vung cuon toi phan do
   * (khong dung scrollIntoView — no con xo lech .deck-canvas overflow:hidden),
   * cuon tay thi danh dau phan dang xem.
   */
  ganNhayPhanBaiTap() {
    const vung = this.slideContent && this.slideContent.querySelector('.qz-list');
    const thanh = vung && vung.querySelector('.qz-jump');
    if (!vung || !thanh) return;
    const nut = [...thanh.querySelectorAll('[data-qz-toi]')];
    const danhDau = (id) => nut.forEach(b => b.classList.toggle('is-active', b.dataset.qzToi === id));
    // Man thap (dien thoai ngang) thanh khong dinh (lesson.css) -> khong tru chieu cao thanh
    const caoThanh = () => (getComputedStyle(thanh).position === 'sticky' ? thanh.offsetHeight : 0);

    nut.forEach(b => b.addEventListener('click', () => {
      const phan = document.getElementById(b.dataset.qzToi);
      if (!phan) return;
      const dinh = phan.getBoundingClientRect().top - vung.getBoundingClientRect().top
        + vung.scrollTop - caoThanh() - 6;
      danhDau(b.dataset.qzToi);
      vung.scrollTo({ top: Math.max(0, dinh), behavior: 'smooth' });
    }));

    let cho = false;
    vung.addEventListener('scroll', () => {
      if (cho) return;
      cho = true;
      setTimeout(() => {
        cho = false;
        const moc = vung.getBoundingClientRect().top + caoThanh() + 24;
        let dang = nut[0] && nut[0].dataset.qzToi;
        nut.forEach(b => {
          const phan = document.getElementById(b.dataset.qzToi);
          if (phan && phan.getBoundingClientRect().top <= moc) dang = b.dataset.qzToi;
        });
        // Cuon het day ma phan cuoi ngan -> van danh dau phan cuoi
        if (vung.scrollTop + vung.clientHeight >= vung.scrollHeight - 4 && nut.length) {
          dang = nut[nut.length - 1].dataset.qzToi;
        }
        danhDau(dang);
      }, 90);
    }, { passive: true });
  }

  buildHandwritingBlock() {
    if (!this.loader.getHandwritingSet) return '';
    const bo = this.loader.getHandwritingSet(
      this.currentLevel, this.currentLesson, this.handwritingRound || 0);
    if (!bo.length) return '';

    this.handwritingSet = bo;

    const the = bo.map((c) => {
      const id = this.escapeHtml(c.id);
      const goiYKana = (c.kana && c.kana !== c.dapAn)
        ? `<span class="qz-vt-kana" lang="ja">${this.escapeHtml(c.kana)}</span>` : '';
      const goiYDoc = c.doc ? `<span class="muted">${this.escapeHtml(c.doc)}</span>` : '';
      const deBai = c.kieu === 'khuyet'
        ? `<div class="qz-vt-de" lang="ja">${this.escapeHtml(c.cauHoi)}</div>`
        : `<div class="qz-vt-hoi">Viết lại chữ của từ này</div>`;
      // "Ôn bài N" chi hien khi chu lay tu bai truoc — chu cua bai nay thi khoi ghi
      const onBai = c.tuBai !== this.currentLesson ? `<span class="qz-on">Ôn bài ${this.escapeHtml(c.tuBai)}</span>` : '';

      return `
      <div class="deck-card qz-vt">
        <div class="qz-vt-top">
          ${onBai}
          <span id="vtdem-${id}" class="qz-timer font-mono text-sm">10s</span>
        </div>
        ${deBai}
        <div class="qz-vt-goiy">
          ${goiYKana}${goiYDoc}
          <span>${this.escapeHtml(c.nghia)}</span>
        </div>
        <canvas id="vtkhung-${id}" width="320" height="320"
                class="qz-khung w-full aspect-square cursor-crosshair mx-auto block"
                style="touch-action:none;background:#fffdf7;max-width:210px"></canvas>
        <div class="qz-vt-nut">
          <button type="button" id="vtbd-${id}" onclick="window.batDauVietTay && window.batDauVietTay('${this.jsAttr(c.id)}')"
                  class="ctl ctl-connect flex-1 justify-center">
            <i class="fa-solid fa-play"></i>Bắt đầu 10 giây
          </button>
          <button type="button" onclick="window.xoaNetViet && window.xoaNetViet('${this.jsAttr(c.id)}')"
                  class="ctl ctl-ghost" title="Xoá nét đã viết" aria-label="Xoá nét đã viết">
            <i class="fa-solid fa-eraser"></i>
          </button>
          <button type="button" onclick="window.nopChuViet && window.nopChuViet('${this.jsAttr(c.id)}')"
                  class="ctl ctl-ghost" title="Nộp cho Sensei chấm" aria-label="Nộp cho Sensei chấm">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </div>
        <div id="vtkq-${id}" class="hidden"></div>
      </div>`;
    }).join('');

    return `
      <section id="qz-viet-tay" class="qz-sec">
        <header class="qz-sec-head" title="Bấm &quot;Bắt đầu&quot; rồi viết lại chữ bằng tay trong 10 giây — hết giờ tự nộp. Sensei sẽ nhìn nét chữ rồi phán. Có cả chữ của bài này lẫn chữ ôn lại bài trước.">
          <div class="min-w-0">
            <h3 class="qz-h3">Luyện viết tay</h3>
            <p class="qz-sec-meta">10 giây mỗi chữ</p>
          </div>
          <button type="button" onclick="window.doiChuVietTay && window.doiChuVietTay()"
                  class="ctl ctl-ghost shrink-0" title="Lấy bộ chữ khác">
            <i class="fa-solid fa-rotate"></i><span>Đổi chữ khác</span>
          </button>
        </header>
        <div class="qz-vt-luoi grid gap-3 md:grid-cols-2">${the}</div>
      </section>`;
  }

  buildPronunciationBlock() {
    if (!this.loader.getPronunciationSet) return '';
    const bo = this.loader.getPronunciationSet(
      this.currentLevel, this.currentLesson, this.pronunciationRound || 0);
    if (!bo.length) return '';

    this.pronunciationSet = bo;

    // Cau ghep lien nhu ngu phap / hoi thoai (dau cau dinh vao chu truoc). Bo id
    // token: day la chinh token cua vi du / cau thoai, giu id se trung id o chuong khac.
    const cauLien = (tokens) => this.ghepTokenCau((tokens || []).map(t => ({ ...t, id: '' })), (tk, i, ds) => {
      const rt = this.rtCua(tk);
      const inner = rt
        ? this.rubyCau(tk, rt, i, ds)
        : this.escapeHtml(tk.text || '');
      return `<span class="stok${tk.isKeyGrammar ? ' is-key' : ''}">${inner}</span>`;
    });

    const the = bo.map((c) => `
      <div id="${this.escapeHtml(c.id)}" class="deck-card qz-pa">
        <div class="qz-pa-row">
          <div class="qz-pa-chu min-w-0">
            ${c.tuBai !== this.currentLesson ? `<span class="qz-on" title="Ôn lại mẫu câu đã học">Ôn bài ${this.escapeHtml(c.tuBai)}</span>` : ''}
            <div class="jp-sentence qz-pa-cau" lang="ja">${cauLien(c.tokens)}</div>
            <div class="qz-mean">${this.escapeHtml(c.meaningVi)}</div>
          </div>
          <div class="qz-pa-nut">
            <button type="button" onclick="window.playSpeech('${this.jsAttr(c.jp)}')"
                    class="icon-btn" title="Nghe mẫu trước khi đọc" aria-label="Nghe mẫu">
              <i class="fa-solid fa-volume-high"></i>
            </button>
            <button type="button" id="rec-${this.escapeHtml(c.id)}"
                    onclick="window.thuAmPhatAm && window.thuAmPhatAm('${this.jsAttr(c.id)}')"
                    class="qz-rec"
                    title="Bấm để thu âm, bấm lại để gửi cho Sensei chấm" aria-label="Thu âm">
              <i class="fa-solid fa-microphone" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <div id="kq-${this.escapeHtml(c.id)}" class="hidden"></div>
      </div>`).join('');

    return `
      <section id="qz-phat-am" class="qz-sec">
        <header class="qz-sec-head" title="Bấm loa nghe mẫu, rồi bấm micro đọc to cả câu. Bấm lại lần nữa để Sensei nghe và chấm. Có cả câu của bài này lẫn câu ôn lại từ những bài trước.">
          <div class="min-w-0">
            <h3 class="qz-h3">Luyện phát âm cả câu</h3>
          </div>
          <button type="button" onclick="window.doiCauPhatAm && window.doiCauPhatAm()"
                  class="ctl ctl-ghost shrink-0" title="Lấy bộ câu khác từ các bài đã học">
            <i class="fa-solid fa-rotate"></i><span>Đổi câu khác</span>
          </button>
        </header>
        <div class="qz-stack">${the}</div>
      </section>`;
  }

  /** @returns {boolean} false khi cap/bai khong ton tai — giong renderSlide */
  openExercise(level, lessonId, exerciseIdx = 0) {
    const lvl = (level || this.currentLevel).toUpperCase();
    const n = Number(lessonId) || this.currentLesson;
    if (!this.loader.getLessonsForLevel(lvl).some(l => l.lessonNumber === n)) return false;
    this.currentLevel = lvl;
    this.currentLesson = n;
    this.setTab('quiz', Number(exerciseIdx) || 0);
    return true;
  }

  resolveElement(targetId) {
    if (!targetId) return null;
    let el = document.getElementById(targetId);
    if (!el) {
      el = document.getElementById(`vocab-${targetId}`) ||
           document.getElementById(`kanji-${targetId}`) ||
           document.getElementById(`tok-${targetId}`) ||
           document.getElementById(`ex-${targetId}`) ||
           document.getElementById(`line-${targetId}`) ||
           document.getElementById(`dia-${targetId}`) ||
           document.getElementById(`card-${targetId}`);
    }
    return el;
  }

  prepareReadingTarget(targetId) {
    if (!targetId) return;
    // Chi go class cua muc truoc. KHONG goi clearReadingFocus() o day:
    // ham do con dong spotlight, ma spotlight moi sap duoc mo ngay sau -> tu tat chinh minh.
    this.clearFocusClasses();
    let el = this.resolveElement(targetId);
    if (!el) return;

    const isBlockCard = el.tagName === 'DIV' || el.classList.contains('p-3') || el.classList.contains('p-4') || el.id.startsWith('vocab-') || el.id.startsWith('kanji-') || el.id.startsWith('ex-') || el.id.startsWith('line-') || el.id.startsWith('dia-') || el.id.startsWith('card-');

    if (isBlockCard) {
      el.classList.add('reading-focus');
      if (!el.querySelector('.reading-badge-indicator')) {
        const badge = document.createElement('span');
        badge.className = 'reading-badge-indicator inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-600/90 text-white font-bold text-[12px] shadow-md ml-2';
        badge.innerHTML = '<i class="fa-solid fa-volume-high text-[11px] animate-pulse"></i> Đang đọc...';
        const titleArea = this.choGanHuyHieu(el, 'h2, h3, .font-bold, .text-xs, ruby, span');
        if (titleArea && titleArea.parentElement) {
          titleArea.parentElement.appendChild(badge);
        }
      }
    }
    el.scrollIntoView({ behavior: this._itChuyenDong() ? 'auto' : 'smooth', block: 'center' });
  }

  /**
   * Cho gan huy hieu "Dang doc": phan tu khop dau tien KHONG nam trong anh nho
   * (o chu thay hinh cua the tu vung la .shrink-0, hinh ve la .sensei-art) —
   * gan vao do thi huy hieu chui vao o 64px, vo dong va de len chu.
   */
  choGanHuyHieu(el, chon) {
    for (const n of el.querySelectorAll(chon)) {
      const hop = n.parentElement && n.parentElement.closest('.shrink-0, .sensei-art');
      if (!hop || hop === el || !el.contains(hop)) return n;
    }
    return null;
  }

  focusReadingElement(targetId) {
    return this.focusItem(targetId, 'reading_focus');
  }

  /** Chi go hieu ung tren the, khong dung toi spotlight */
  clearFocusClasses(targetId = null) {
    const strip = (el) => {
      if (!el) return;
      el.classList.remove('reading-focus', 'hl-reading-inline');
      const badge = el.querySelector('.reading-badge-indicator');
      if (badge) badge.remove();
    };
    if (targetId) {
      strip(this.resolveElement(targetId));
    } else {
      document.querySelectorAll('.reading-focus, .hl-reading-inline').forEach(strip);
    }
  }

  /**
   * Tat han den roi: go class + dong spotlight.
   * Go ca vien sang kieu khac (hl-card-vocab / -grammar / -warning do focusItem, highlightElement dat),
   * khong chi 'reading-focus': dong the (X / Esc) ma the nguon van giu vien sang la con treo den.
   */
  clearReadingFocus(targetId = null) {
    if (targetId && targetId !== this.activeFocusId) {
      this.clearFocusClasses(targetId);
      return;
    }
    this.activeFocusId = null;
    if (targetId) {
      this.clearFocusClasses(targetId);
      const el = this.resolveElement(targetId);
      if (el) el.classList.remove(...LOP_DEN_ROI);
    } else {
      this.clearHighlights();
    }
    this.closeSpotlight();
  }

  /**
   * LOI DUY NHAT de roi den vao mot muc.
   *
   * Moi nguon deu phai di qua day: tool highlight_element cua Sensei,
   * bo bam theo loi giang, va buoc mo dau moi chuong. Nho vay man hinh
   * luon chi co DUNG MOT muc dang sang, va luon kem spotlight.
   */
  focusItem(targetId, styleType = 'reading_focus', comment = null, opts = {}) {
    if (!targetId) return false;
    // Dang roi dung muc nay va spotlight dang mo -> khong lam lai, tranh giat man hinh
    if (this.activeFocusId === targetId && this.spotOpenId === targetId) return true;

    const found = this.findItemById(targetId);
    if (!found) {
      // Sensei goi mot id khong co that (thuong do bia id). Khong lam gi con hon
      // la xoa sach highlight dang dung roi de man hinh trong tron.
      console.warn('[focusItem] khong tim thay id:', targetId);
      return false;
    }

    // Muc nam o chuong khac -> mo dung chuong (va dung slide ngu phap) truoc da.
    // setTab() se goi clearReadingFocus(), nen phai lam TRUOC khi dat activeFocusId.
    if (found.tab && found.tab !== this.activeTab) {
      this.setTab(found.tab, found.slideIndex !== undefined ? found.slideIndex : null);
    } else if (found.tab === 'grammar' && found.slideIndex !== undefined
               && found.slideIndex !== this.currentSlideIndex) {
      this.renderGrammar(found.slideIndex);
    }

    this.activeFocusId = targetId;
    this.applyFocusStyle(targetId, styleType, opts);
    this.setCaption(comment, styleType);
    this.openSpotlight(targetId, found, opts);
    this.tuKhoanhNguPhap(found);
    // Meo Sensei: truyen PHAN TU (khong phai id) — el.closest('[data-emotion]') co khoa thi doi mat theo cau / tu.
    // Chi chi tay, KHONG doi mat khi: hoc vien tu bam (khong ai dang noi), nguoi goi tu hen mat (opts.khongMat:
    // nhip giang hen mat luc Sensei cat loi), hay roi lai cung muc co sac thai trong 8 s (mat da doi roi).
    const elMuc = this.resolveElement(targetId);
    const av = window.SenseiAvatar;
    if (av && elMuc) {
      const goc = elMuc.closest('[data-emotion]');
      const boMat = !!goc && (opts.doBam || opts.khongMat
        || (goc === this._gocCamXuc && Date.now() - this._lucCamXuc < 8000));
      if (goc && (opts.khongMat || !boMat)) { this._gocCamXuc = goc; this._lucCamXuc = Date.now(); }
      if (boMat) av.chiVao(elMuc); else av.khiRoiMuc(elMuc, styleType, found);
    }
    return true;
  }

  /**
   * Chuong Ngu phap khong con the ben trai, nen phai co thu khac chi ra dau la
   * tro tu. Toi cau vi du nao thi tu khoanh do dung nhung token duoc danh dau
   * isKeyGrammar trong giao trinh — chinh la は, です, も, の...
   *
   * Lam o client chu khong cho Sensei goi draw_on_board, vi day la thu BAT BUOC
   * phai co moi giang duoc ngu phap, khong the de tuy luc model nho luc quen.
   */
  tuKhoanhNguPhap(found) {
    if (!window.SenseiBoard) return;
    if (!found || found.tab !== 'grammar') return;

    const cau = found.type === 'example' ? found.data
              : found.type === 'token' ? found.sentence
              : null;
    if (!cau) return;

    const trongTam = (cau.tokens || []).filter(t => t.isKeyGrammar && t.id);
    if (!trongTam.length) return;

    // Cho layout on dinh (vua doi slide / vua cuon) roi moi do toa do
    clearTimeout(this._khoanhTimer);
    this._khoanhTimer = setTimeout(() => {
      if (this.activeFocusId !== found.data.id && found.type === 'example') return;
      trongTam.slice(0, 3).forEach(t => window.SenseiBoard.veLen(t.id, 'khoanh'));
    }, 420);
  }

  /**
   * Chuong nao duoc dung the ben trai.
   *
   *   Ngu phap  : khong — slide da bay san cong thuc, cau vi du co ruby, so do cau truc
   *   Bai tap   : khong — the cau hoi trong danh sach da bam chon dap an duoc roi
   *   Hoi thoai : chi khi hoc vien TU BAM. Luc giang thi chi to sang cau dang doc,
   *               vi ca doan thoai phai nhin lien mach moi theo duoc mach chuyen
   *   Tu vung   : co — the mang them hinh ve minh hoa
   *   Chu Han   : co — the viet ra tung net theo dung thu tu
   *
   * @param {boolean} doBam  true khi hoc vien tu bam vao the, false khi bai giang tu roi den
   */
  boQuaTheTrai(found, doBam = false) {
    if (!found) return true;
    if (found.tab === 'grammar' || found.tab === 'quiz') return true;
    if (found.tab === 'kaiwa' && !doBam) return true;
    return false;
  }

  /** Giu chu ky cu de cac loi goi san co van chay; nay chi la vo boc cua focusItem */
  highlightElement(targetId, styleType = 'grammar_focus', comment = null) {
    return this.focusItem(targetId, styleType, comment);
  }

  applyFocusStyle(targetId, styleType, opts = {}) {
    this.clearHighlights();
    let el = document.getElementById(targetId);

    // Fuzzy ID fallback nếu AI truyền thiếu prefix
    if (!el) {
      el = document.getElementById(`vocab-${targetId}`) ||
           document.getElementById(`kanji-${targetId}`) ||
           document.getElementById(`tok-${targetId}`) ||
           document.getElementById(`ex-${targetId}`) ||
           document.getElementById(`line-${targetId}`) ||
           document.getElementById(`card-${targetId}`);
    }

    if (el) {
      const isBlockCard = el.tagName === 'DIV' || el.classList.contains('p-3') || el.classList.contains('p-4') || el.id.startsWith('vocab-') || el.id.startsWith('kanji-') || el.id.startsWith('ex-') || el.id.startsWith('line-') || el.id.startsWith('card-');

      if (isBlockCard) {
        if (styleType === 'warning') {
          el.classList.add('hl-card-warning');
        } else if (styleType === 'vocab_highlight') {
          el.classList.add('hl-card-vocab');
        } else if (styleType === 'reading_focus') {
          el.classList.add('reading-focus');
        } else {
          el.classList.add('hl-card-grammar');
        }
      } else {
        if (styleType === 'warning') {
          el.classList.add('hl-warning');
        } else if (styleType === 'vocab_highlight') {
          el.classList.add('hl-vocab');
        } else if (styleType === 'reading_focus') {
          el.classList.add('hl-reading-inline');
        } else {
          el.classList.add('hl-grammar');
        }
      }
      // Hoc vien tu bam (doBam) thi khong co gi dang doc ca -> khong gan "Dang doc…",
      // chi giu vien sang cho biet the nao dang chon.
      if (styleType === 'reading_focus' && isBlockCard && !(opts && opts.doBam) && !el.querySelector('.reading-badge-indicator')) {
        const badge = document.createElement('span');
        badge.className = 'reading-badge-indicator inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-white font-bold text-[12px] shadow-md ml-2';
        badge.innerHTML = '<i class="fa-solid fa-volume-high text-[11px]"></i> Đang đọc…';
        const anchor = this.choGanHuyHieu(el, 'h2, h3, .font-bold, ruby, span');
        if (anchor && anchor.parentElement) anchor.parentElement.appendChild(badge);
      }
      el.scrollIntoView({ behavior: this._itChuyenDong() ? 'auto' : 'smooth', block: 'center' });
    } else {
      console.warn(`Element with ID '${targetId}' not found on current view.`);
    }
  }

  /**
   * Bat/tat lop cho cho chuong dang mo (Bai tap khi soan de, Hoi thoai khi
   * long tieng). Lam mo noi dung cu va phu mot the bao dang chay, de nguoi
   * hoc biet he thong dang lam viec chu khong phai treo.
   *
   * Goi qua veLaiCho() trong app.js chu dung goi thang: trang thai cho thuoc
   * ve tung chuong, goi thang se tat nham lop cho cua chuong khac.
   */
  setBusy(on, title, note, nhe = false) {
    const canvas = document.querySelector('.deck-canvas');
    if (!canvas) return;

    // Nho lai de con dung sau moi lan render: cac ham render gan lai
    // className cua slideContent, quet mat lop mo neu khong dat lai.
    // nhe (long tieng Hoi thoai): noi dung van doc / bam duoc (loa tam dung giong trinh duyet),
    // chi hien mot nhan nho o tieu de chuong — khong mo ca chuong, khong phu the len loi thoai.
    this.busyState = on ? { title, note, nhe } : null;
    if (this.slideContent) this.slideContent.classList.toggle('is-busy', !!on && !nhe);

    let ov = document.getElementById('deckBusy');
    // Doi kieu (the phu <-> nhan nho) hoac tat: go cai cu
    if (ov && (!on || ov.classList.contains('deck-busy-chip') !== !!nhe)) { ov.remove(); ov = null; }
    if (!on) return;

    if (ov) {
      // Da co san: chi thay chu. Gan lai innerHTML se chay lai animation
      // hien ra tu dau, dem tien do nhay 10 lan trong lam giat.
      const t = ov.querySelector('.deck-busy-title');
      const n = ov.querySelector('.deck-busy-note');
      if (t) t.textContent = title || 'Đang xử lý…';
      if (n) n.textContent = note || '';
      if (nhe) ov.title = note || '';
      return;
    }

    if (nhe) {
      const head = this.slideContent && this.slideContent.querySelector('.deck-head');
      if (!head) return;
      ov = document.createElement('span');
      ov.id = 'deckBusy';
      ov.className = 'deck-busy-chip deck-head-end';
      ov.setAttribute('role', 'status');
      ov.title = note || '';
      ov.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i>'
        + `<span class="deck-busy-title">${this.escapeHtml(title || 'Đang xử lý…')}</span>`;
      head.appendChild(ov);
      return;
    }

    ov = document.createElement('div');
    ov.id = 'deckBusy';
    ov.className = 'deck-busy';
    ov.innerHTML = `
      <div class="deck-busy-card">
        <i class="fa-solid fa-circle-notch fa-spin"></i>
        <div class="deck-busy-text">
          <strong class="deck-busy-title">${this.escapeHtml(title || 'Đang xử lý…')}</strong>
          <span class="deck-busy-note">${this.escapeHtml(note || '')}</span>
        </div>
      </div>`;
    canvas.appendChild(ov);
  }

  /** Dat lai lop mo sau khi render — render vua gan de className moi */
  reapplyBusy() {
    const s = this.busyState;
    if (!s || !this.slideContent) return;
    // Nhan nho nam trong tieu de chuong -> render vua thay ca noi dung thi gan lai
    if (s.nhe) { if (!this.slideContent.querySelector('#deckBusy')) this.setBusy(true, s.title, s.note, true); }
    else this.slideContent.classList.add('is-busy');
  }

  setCaption(comment, styleType) {
    if (this.highlightNotice) {
      if (comment) {
        const icon = styleType === 'warning' ? 'fa-triangle-exclamation text-rose-400'
                   : styleType === 'vocab_highlight' ? 'fa-star text-amber-400'
                   : styleType === 'reading_focus' ? 'fa-volume-high text-indigo-400 animate-pulse'
                   : 'fa-wand-magic-sparkles text-cyan-400';
        const borderBg = styleType === 'warning' ? 'bg-rose-950/80 border-rose-500/60 text-rose-200'
                       : styleType === 'vocab_highlight' ? 'bg-amber-950/80 border-amber-500/60 text-amber-200'
                       : 'bg-indigo-950/80 border-indigo-500/60 text-indigo-200';

        this.highlightNotice.innerHTML = `
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg ${borderBg} border text-xs shadow-md animate-zoom-in">
            <i class="fa-solid ${icon}"></i>
            <span>${this.escapeHtml(comment)}</span>
          </span>
        `;
      } else {
        this.highlightNotice.innerHTML = '';
      }
    }
  }

  clearHighlights() {
    document.querySelectorAll(LOP_DEN_ROI.map(c => '.' + c).join(', ')).forEach(el => {
      el.classList.remove(...LOP_DEN_ROI);
      const badge = el.querySelector('.reading-badge-indicator');
      if (badge) badge.remove();
    });
    if (this.highlightNotice) this.highlightNotice.innerHTML = '';
  }

  markError(wrongPhrase, correctedPhrase, explanation) {
    if (!this.errorDock) return;
    if (this.errWrong) this.errWrong.innerText = wrongPhrase || '';
    if (this.errCorrect) this.errCorrect.innerText = correctedPhrase || '';
    if (this.errExplain) this.errExplain.innerText = explanation || '';

    this.errorDock.classList.remove('hidden');
    // Rung lai tu dau moi lan sua loi (bo class, ep reflow, gan lai) — khong thi chi lan dau rung
    this.errorDock.classList.remove('roast-shake');
    void this.errorDock.offsetWidth;
    this.errorDock.classList.add('roast-shake');
    this.errorDock.scrollIntoView({ behavior: this._itChuyenDong() ? 'auto' : 'smooth', block: 'center' });
  }

  dismissError() {
    if (this.errorDock) {
      this.errorDock.classList.add('hidden');
    }
  }

  nextSlide() {
    if (this.activeTab !== 'grammar') {
      this.setTab('grammar');
      return;
    }
    // getSlide() kep chi so ve slide cuoi -> phai so slideIndex that, khong thi
    // bam Next o slide cuoi van ve lai chinh no (mat cuon, mat lop cho...)
    const data = this.loader.getSlide(this.currentLevel, this.currentLesson, this.currentSlideIndex + 1);
    if (data && data.slide && data.slideIndex > this.currentSlideIndex) {
      this.renderGrammar(data.slideIndex);
    }
  }

  prevSlide() {
    if (this.activeTab !== 'grammar') {
      this.setTab('grammar');
      return;
    }
    if (this.currentSlideIndex > 0) {
      this.renderGrammar(this.currentSlideIndex - 1);
    }
  }

  /* ======================================================================
     SPOTLIGHT — rọi đèn sân khấu
     Khi Sensei đọc tới một mục, mục đó bay từ đúng vị trí của nó ra giữa
     màn hình, phóng to, nền phía sau mờ đi. Mỗi lúc CHỈ MỘT mục được rọi.
     ====================================================================== */

  ensureSpotlight() {
    if (this.spotEl) return this.spotEl;

    const el = document.createElement('div');
    el.id = 'spotlight';
    el.className = 'spotlight hidden';
    el.innerHTML =
      '<svg class="spot-noi" aria-hidden="true"></svg>'
      + '<aside class="spot-dock">'
      + '  <button type="button" class="spot-dong" title="Đóng thẻ (Esc)" aria-label="Đóng thẻ"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>'
      + '  <div class="spot-card"></div>'
      + '</aside>';
    document.body.appendChild(el);

    // Hoc vien dong the = tat han den roi: go luon vien sang + huy hieu tren the
    // nguon, khong de "Dang doc…" treo lai sau khi the da dong.
    el.querySelector('.spot-dong').addEventListener('click', () => this.clearReadingFocus());
    document.addEventListener('keydown', (e) => {
      // Esc la phim chung (lightbox, o chat...) — chi xu ly khi the dang mo va chua lop nao
      // phia tren (anh phong to, bang chon bai, o chat) nhan phim nay (xem bo nghe Esc o dau tep)
      if (e.key !== 'Escape' || e.defaultPrevented || !this.spotOpenId) return;
      if (e.isComposing || e.keyCode === 229) return;   // Esc bo chu dang go IME (vd trong o chat)
      e.preventDefault();
      this.clearReadingFocus();
    });

    // Mui ten noi the voi muc that — phai bam theo khi cuon trang hay doi co
    // man hinh, khong thi no tro vao khoang khong.
    let cho = false;
    const veLai = (e) => {
      // Cuon ben trong chinh the thi muc that khong xe dich, khoi ve lai
      if (e && e.type === 'scroll' && e.target && e.target.closest && e.target.closest('.spot-card')) return;
      if (cho) return;
      cho = true;
      requestAnimationFrame(() => { cho = false; this.veMuiTenNoi(false); });
    };
    window.addEventListener('scroll', veLai, true);
    window.addEventListener('resize', veLai);

    this.spotEl = el;
    this.spotCard = el.querySelector('.spot-card');
    this.spotNoi = el.querySelector('.spot-noi');
    return el;
  }

  /**
   * Ve mui ten tu the ben trai sang dung muc dang noi toi.
   * Muc cuon khuat khoi man hinh thi an mui ten di — tro vao mep man hinh
   * con kho hieu hon la khong tro gi.
   */
  veMuiTenNoi(hoatHinh = false) {
    if (!this.spotEl || this.spotEl.classList.contains('hidden') || !this.spotNoi) return;
    const an = () => { this.spotNoi.style.display = 'none'; };
    // Muc moi mo, dang cho lan ve dau (openSpotlight hen ~340ms, co hieu ung):
    // cuon trang luc nay chi an mui ten cu di, khong ve truoc. Het hen ma muc
    // van khuat (cuon muot chua xong) thi khung hinh cuon sau se ve lan dau.
    if (!hoatHinh && this._noiCho && this._noiId !== this.spotOpenId) return an();

    const dock = this.spotEl.querySelector('.spot-dock');
    const dich = this.resolveElement(this.spotOpenId);
    if (!dock || !dich) return an();

    // Man hinh hep: the nam duoi day, khong con cho ma keo mui ten
    if (window.innerWidth < 860) return an();

    // Man rong the cao theo noi dung (thap hon lan cua no): mui ten moc vao mep the, khong vao khoang trong duoi the
    const d = (this.spotCard && this.spotCard.offsetHeight ? this.spotCard : dock).getBoundingClientRect();
    const t = dich.getBoundingClientRect();
    if (t.width < 2 || t.bottom < 8 || t.top > window.innerHeight - 8) return an();

    const x1 = d.right - 2;
    const y1 = Math.min(Math.max(t.top + t.height / 2, d.top + 24), d.bottom - 24);
    const x2 = t.left - 9;
    const y2 = t.top + t.height / 2;
    const giua = (x1 + x2) / 2;

    // Muc o cot xa (vd cot 2 cua luoi tu vung): duong noi phai cat ngang the o giua, trong nhu
    // gach ngang chu cua the do -> khong ve, vien sang cua muc da du chi ra muc nao dang mo.
    const x0 = Math.min(x1, x2), xN = Math.max(x1, x2);
    const yA = Math.min(y1, y2) - 3, yB = Math.max(y1, y2) + 3;
    const vuong = this.slideContent && [...this.slideContent.querySelectorAll('.deck-card')].some((c) => {
      if (c === dich || c.contains(dich) || dich.contains(c)) return false;
      const r = c.getBoundingClientRect();
      return r.right > x0 && r.left < xN && r.bottom > yA && r.top < yB;
    });
    if (vuong) return an();

    const NS = 'http://www.w3.org/2000/svg';
    const duong = `M${x1},${y1} C${giua},${y1} ${giua},${y2} ${x2},${y2}`;

    // Tao 3 net MOT LAN cho moi muc; cuon trang / doi co chi sua 'd' tai cho.
    // Truoc day moi khung hinh cuon lai dung net moi -> hieu ung chay tu dau,
    // mui ten nhap nhay gan nhu khong thay.
    let [nen, than, dau] = this.spotNoi.children;
    const moi = !dau || this._noiId !== this.spotOpenId;
    if (moi) {
      this.spotNoi.innerHTML = '';
      // Net nen mau giay, day hon, nam duoi: duong noi di ngang qua cac the o
      // giua nen khong co no thi doc nham thanh gach ngang chu.
      nen = document.createElementNS(NS, 'path');
      nen.setAttribute('class', 'spot-noi-nen');
      this.spotNoi.appendChild(nen);

      than = document.createElementNS(NS, 'path');
      than.setAttribute('class', 'spot-noi-than');
      // Net dut chuan hoa theo pathLength=1: doi 'd' (dai ngan khac) khong ho khuc
      than.setAttribute('pathLength', '1');
      than.style.strokeDasharray = '1';
      this.spotNoi.appendChild(than);

      dau = document.createElementNS(NS, 'path');
      dau.setAttribute('class', 'spot-noi-dau');
      this.spotNoi.appendChild(dau);
    }
    this._noiId = this.spotOpenId;

    nen.setAttribute('d', duong);
    than.setAttribute('d', duong);
    dau.setAttribute('d', `M${x2},${y2} l-8,-5 M${x2},${y2} l-8,5`);
    this.spotNoi.style.display = '';

    if (hoatHinh || moi) {
      than.style.strokeDashoffset = '1';
      than.style.animation = 'none';
      void than.getBoundingClientRect();   // ep nhan 'none' roi moi chay lai tu dau
      than.style.animation = 'spotNoiChay .45s ease-out forwards';
    }
  }

  /** Vai trò của trợ từ / đuôi câu — để vẽ sơ đồ cấu trúc cho dễ hiểu */
  tokenRole(text) {
    const map = {
      'は': 'chủ đề', 'が': 'chủ ngữ', 'を': 'tân ngữ', 'に': 'đích / thời điểm',
      'で': 'nơi chốn / phương tiện', 'へ': 'hướng tới', 'と': 'cùng với / và',
      'も': 'cũng', 'の': 'của', 'から': 'từ', 'まで': 'đến', 'や': 'và (liệt kê)',
      'か': 'nghi vấn', 'ね': 'nhỉ', 'よ': 'nhấn mạnh',
      'です': 'lịch sự (là)', 'ですか': 'hỏi lịch sự', 'ます': 'lịch sự (động từ)',
      'ません': 'phủ định lịch sự', 'でした': 'quá khứ',
      'じゃ ありません': 'phủ định', 'では ありません': 'phủ định (trang trọng)',
      'じゃありません': 'phủ định', 'ではありません': 'phủ định (trang trọng)',
    };
    return map[String(text || '').trim()] || '';
  }

  /** Sơ đồ cấu trúc câu: mỗi token là một khối, trợ từ được gắn nhãn vai trò */
  buildDiagram(tokens) {
    const blocks = (tokens || [])
      .filter(tk => (tk.text || '').trim() && !/^[、。，．]$/.test(tk.text.trim()))
      .map(tk => {
        const role = this.tokenRole(tk.text);
        const key = tk.isKeyGrammar || role;
        const word = tk.kanji || tk.text;
        return `
          <div class="dblock${key ? ' is-key' : ''}">
            <span class="dword" lang="ja">${this.escapeHtml(word)}</span>
            ${role ? `<span class="drole">${this.escapeHtml(role)}</span>` : ''}
          </div>`;
      }).join('<span class="dplus">+</span>');

    if (!blocks) return '';
    return `
      <div class="spot-diagram">
        <div class="spot-diagram-label">Cấu trúc câu</div>
        <div class="diagram">${blocks}</div>
      </div>`;
  }

  /**
   * Chu nho tren dau (rt) cua mot token, '' = khong ve ruby.
   * Giao trinh co ~200 token furigana TRUNG chinh chu (山田さん / 山田さん) ->
   * in lap hai tang. Trung thi lay text (cach doc) neu khac, khong thi bo ruby.
   */
  rtCua(tk) {
    if (!tk || !tk.kanji || !tk.furigana) return '';
    if (tk.furigana !== tk.kanji) return tk.furigana;
    return (tk.text && tk.text !== tk.kanji) ? tk.text : '';
  }

  /**
   * Ruby cua token trong cau (ghepTokenCau). Furigana dai hon chu (上昇 / じょうしょう) thi Chrome gian
   * o chu bang be ngang furigana -> trong nhu co dau cach hai ben. Cho furigana tran sang token ben canh
   * (margin am, lesson.css): toi da nua chu moi ben, va khong qua cho trong tren dau token ben canh
   * neu no cung co furigana (hai tang chu nho khong de len nhau).
   */
  rubyCau(tk, rt, i, ds) {
    const soChu = (s) => Array.from(String(s || '')).length;
    const m = soChu(tk.kanji), n = soChu(rt);
    let kieu = '';
    if (n * .5 > m) {
      const trong = (j) => {
        const k = ds && ds[j];
        const r2 = k && this.rtCua(k);
        return r2 ? Math.max(0, (soChu(k.kanji) - soChu(r2) * .57) / 2) : .5;
      };
      const trai = Math.min(.5, trong(i - 1)), phai = Math.min(.5, trong(i + 1));
      if (trai > 0 || phai > 0) {
        kieu = ` style="--rt:${n};--cj:${m};--tl:${trai.toFixed(2)}em;--tp:${phai.toFixed(2)}em"`;
      }
    }
    return `<ruby${kieu}>${this.escapeHtml(tk.kanji)}<rt>${this.escapeHtml(rt)}</rt></ruby>`;
  }

  /** Câu đầy đủ có ruby, token trọng tâm được tô sáng */
  buildSentence(tokens, focusTokenId = null) {
    return (tokens || []).map(tk => {
      const rt = this.rtCua(tk);
      const inner = rt
        ? `<ruby>${this.escapeHtml(tk.kanji)}<rt>${this.escapeHtml(rt)}</rt></ruby>`
        : this.escapeHtml(tk.text || '');
      const cls = (focusTokenId && tk.id === focusTokenId) ? 'stok is-focus'
                : (tk.isKeyGrammar ? 'stok is-key' : 'stok');
      return `<span class="${cls}">${inner}</span>`;
    }).join('');
  }

  /** Hình vẽ minh hoạ cho một từ (nếu thư viện đã vẽ) */
  artFor(v) {
    if (!window.SenseiArt || !v) return null;
    return window.SenseiArt.get(v.kanji, v.word, v.furigana);
  }

  /** Ảnh minh hoạ cỡ lớn */
  buildImage(url, alt) {
    if (!url) return '';
    return `
      <div class="spot-image">
        <img src="${this.jsAttr(url)}" alt="${this.escapeHtml(alt || '')}" loading="eager"
             onerror="this.closest('.spot-image').remove()" />
      </div>`;
  }

  /** Tìm dữ liệu gốc của một id bất kỳ trên màn hình */
  findItemById(id) {
    const lvl = this.currentLevel, no = this.currentLesson;
    const lesson = this.loader.getLesson(lvl, no) || {};

    const vo = (lesson.vocabList || []).find(x => x.id === id);
    if (vo) return { type: 'vocab', data: vo, tab: 'vocab' };

    const ka = (lesson.kanjiList || []).find(x => x.id === id);
    if (ka) return { type: 'kanji', data: ka, tab: 'kanji' };

    const dl = (lesson.dialogue || []).find(x => x.id === id);
    if (dl) return { type: 'kaiwa', data: dl, tab: 'kaiwa' };

    const slides = lesson.slides || [];
    for (let si = 0; si < slides.length; si++) {
      const sl = slides[si];
      const e = (sl.examples || []).find(x => x.id === id);
      if (e) return { type: 'example', data: e, slide: sl, tab: 'grammar', slideIndex: si };
      for (const e2 of (sl.examples || [])) {
        const tk = (e2.tokens || []).find(t => t.id === id);
        if (tk) return { type: 'token', data: tk, sentence: e2, slide: sl, tab: 'grammar', slideIndex: si };
      }
    }
    for (const d2 of (lesson.dialogue || [])) {
      const tk = (d2.tokens || []).find(t => t.id === id);
      if (tk) return { type: 'token', data: tk, sentence: d2, tab: 'kaiwa' };
    }

    const qz = (lesson.exercises || []).find(x => x.id === id || ('card-' + x.id) === id);
    if (qz) return { type: 'quiz', data: qz, tab: 'quiz' };

    return null;
  }

  buildSpotlightHtml(found) {
    this._huyVietNet();   // noi dung the sap thay -> bo hen viet net cua chu truoc
    const speak = (text, label) => `
      <button type="button" class="spot-speak" onclick="window.playSpeech('${this.jsAttr(text)}')">
        <i class="fa-solid fa-volume-high"></i><span>${this.escapeHtml(label)}</span>
      </button>`;

    if (found.type === 'vocab') {
      const v = found.data;
      const word = v.kanji || v.word;
      const head = (v.kanji && v.furigana && v.furigana !== v.kanji)
        ? `<ruby>${this.escapeHtml(v.kanji)}<rt>${this.escapeHtml(v.furigana)}</rt></ruby>`
        : this.escapeHtml(v.word);
      // Thu tu uu tien: anh co san trong giao trinh -> hinh ve SVG.
      const artSvg = this.artFor(v);
      const visual = v.imageUrl
        ? this.buildImage(v.imageUrl, v.imageAlt || v.meaningVi)
        : (artSvg ? `<div class="sensei-art sensei-art-lg">${artSvg}</div>` : '');

      // Nut nghe ngay duoi nghia, ghi chu sau cung: tren dien thoai the thap, nut
      // nghe khong bi ghi chu dai day xuong duoi mep (khong can `order`).
      return `
        ${visual}
        <div class="spot-head" lang="ja">${head}</div>
        ${v.romaji ? `<div class="spot-sub"><span class="spot-romaji">${this.escapeHtml(v.romaji)}</span></div>` : ''}
        <div class="spot-meaning">${this.escapeHtml(v.meaningVi)}</div>
        ${speak(word, 'Nghe phát âm')}
        ${v.accentNote ? `<div class="spot-note"><span>${this.escapeHtml(v.accentNote)}</span></div>` : ''}`;
    }

    if (found.type === 'kanji') {
      const k = found.data;
      const words = (k.commonWords || []).map(cw => `
        <div class="spot-row">
          <span class="spot-row-jp"><span lang="ja">${this.escapeHtml(cw.word)}</span>${cw.furigana ? `<em lang="ja">${this.escapeHtml(cw.furigana)}</em>` : ''}</span>
          <span class="spot-row-vi">${this.escapeHtml(cw.meaningVi)}</span>
        </div>`).join('');
      // Co du lieu net thi viet ra tung net ngay trong spotlight — day moi la
      // thu giao trinh thieu: no ghi "8 net" ma khong chi duoc 8 net do la gi.
      const coNet = this._coVietNet(k.character);
      if (coNet) {
        // Mot hen gio cho ca engine (_huyVietNet o dau ham): doi chu nhanh (bam 私
        // roi 人) thi hen cua chu cu khong duoc viet 私 vao the cua 人.
        this._vietNetTimer = setTimeout(() => {
          if (this.spotOpenId !== k.id) return;
          const o = this.spotCard && this.spotCard.querySelector('[data-viet-net]');
          if (!o) return;
          const viet = () => {
            if (this.spotOpenId !== k.id || !o.isConnected) return;
            o.innerHTML = '';
            window.SenseiBoard.vietChuHan(k.character, { noi: o });
          };
          // Dien thoai: o viet net nam duoi nut nghe, co khi phai cuon moi thay ->
          // doi o hien ra mot nua roi moi viet, khong thi net da viet xong tu truoc.
          if (!window.IntersectionObserver) { viet(); return; }
          this._vietNetIO = new IntersectionObserver((es) => {
            if (!es.some(e => e.isIntersecting)) return;
            this._huyVietNet();
            viet();
          }, { threshold: 0.5 });
          this._vietNetIO.observe(o);
        }, 220);   // cho hieu ung mo spotlight bay xong roi moi viet
      }

      const origin = window.SenseiArt ? window.SenseiArt.kanji(k.character) : null;
      const originHtml = origin ? `
        <div class="sensei-art sensei-art-lg">${origin.svg}</div>
        <div class="spot-note spot-origin">
          <span><strong>Gốc chữ:</strong> ${this.escapeHtml(origin.note)}</span>
        </div>` : '';
      // Thu tu HTML = thu tu doc tren may tinh (trinh doc man hinh, phim Tab doc
      // dung nhu mat thay). Dien thoai: lesson.css muc 1 dua chu + nghia + nut nghe
      // len truoc bang `order`. Co o viet net thi so net da ghi duoi o
      // ("私 — 7 nét") -> bo chip so net, khong noi hai lan.
      return `
        ${coNet ? '<div class="spot-viet-net" data-viet-net="1"></div>' : ''}
        <div class="spot-kanji jp-serif" lang="ja">${this.escapeHtml(k.character)}</div>
        <div class="spot-sub">
          <span class="spot-chip">Hán Việt <b>${this.escapeHtml(k.hanViet)}</b></span>
          ${coNet ? '' : `<span class="spot-chip">${this.escapeHtml(String(k.strokeCount ?? '?'))} nét</span>`}
        </div>
        <div class="spot-meaning">${this.escapeHtml(k.meaningVi)}</div>
        <div class="spot-readings">
          <div><span class="spot-rlabel">Âm On</span><span lang="ja">${this.escapeHtml((k.onyomi || []).join(', ') || '—')}</span></div>
          <div><span class="spot-rlabel">Âm Kun</span><span lang="ja">${this.escapeHtml((k.kunyomi || []).join(', ') || '—')}</span></div>
        </div>
        ${speak(k.character, 'Nghe đọc chữ Hán')}
        ${words ? `<div class="spot-words"><div class="spot-diagram-label">Từ ghép</div>${words}</div>` : ''}
        ${originHtml}`;
    }

    if (found.type === 'example' || found.type === 'kaiwa') {
      const d = found.data;
      const plain = (d.tokens || []).map(t => t.kanji || t.text).join('');
      // Voi cau ngu phap, SO DO CAU TRUC moi la thu giai thich duoc.
      return `
        ${this.buildImage(d.imageUrl, d.meaningVi)}
        ${found.type === 'kaiwa' ? `<div class="spot-speaker">${this.escapeHtml(d.speaker || '')}</div>` : ''}
        <div class="spot-sentence" lang="ja">${this.buildSentence(d.tokens)}</div>
        <div class="spot-meaning">${this.escapeHtml(d.meaningVi || '')}</div>
        ${this.buildDiagram(d.tokens)}
        ${speak(plain, 'Nghe đọc cả câu')}`;
    }

    if (found.type === 'token') {
      const tk = found.data, sen = found.sentence || {};
      const role = this.tokenRole(tk.text);
      const rt = this.rtCua(tk);
      const head = rt
        ? `<ruby>${this.escapeHtml(tk.kanji)}<rt>${this.escapeHtml(rt)}</rt></ruby>`
        : this.escapeHtml(tk.text || '');
      return `
        <div class="spot-head" lang="ja">${head}</div>
        ${role ? `<div class="spot-sub"><span class="spot-chip is-key">${this.escapeHtml(role)}</span></div>` : ''}
        <div class="spot-incontext">
          <div class="spot-diagram-label">Trong câu</div>
          <div class="spot-sentence is-small" lang="ja">${this.buildSentence(sen.tokens, tk.id)}</div>
          <div class="spot-meaning is-small">${this.escapeHtml(sen.meaningVi || '')}</div>
        </div>
        ${this.buildDiagram(sen.tokens)}
        ${speak(tk.kanji || tk.text, 'Nghe phát âm')}`;
    }

    if (found.type === 'quiz') {
      const q = found.data;
      // Dap an trong spotlight phai BAM CHON DUOC — truoc day chi la the tinh,
      // hoc vien dang hoc ma khong tra loi duoc.
      const opts = (q.options || []).map((o, i) => `
        <button type="button" class="spot-opt" id="spot-opt-${this.escapeHtml(q.id)}-${i}"
                onclick="window.answerFromSpotlight('${this.jsAttr(q.id)}', ${i}, ${q.correctIndex})">
          <span>${String.fromCharCode(65 + i)}</span>${this.escapeHtml(o)}
        </button>`).join('');
      return `
        ${this.buildImage(q.imageUrl, q.question)}
        <div class="spot-question">${this.escapeHtml(q.question)}</div>
        <div class="spot-opts">${opts}</div>
        <div id="spot-result-${this.escapeHtml(q.id)}" class="spot-result hidden"></div>`;
    }

    return '';
  }

  /** To mau dap an trong spotlight sau khi hoc vien chon */
  markSpotlightAnswer(exId, chosen, correct, explanation) {
    if (!this.spotCard) return;
    const btns = this.spotCard.querySelectorAll(`[id^="spot-opt-${exId}-"]`);
    btns.forEach((b, i) => {
      b.disabled = true;
      b.classList.add('is-locked');
      if (i === correct) b.classList.add('is-correct');
      if (i === chosen && chosen !== correct) b.classList.add('is-wrong');
    });

    const box = this.spotCard.querySelector(`#spot-result-${exId}`);
    if (box) {
      const ok = chosen === correct;
      box.className = 'spot-result ' + (ok ? 'is-ok' : 'is-no');
      box.innerHTML = `
        <strong>${ok ? '✓ Chính xác!' : '✗ Chưa đúng — đáp án là ' + String.fromCharCode(65 + correct)}</strong>
        ${explanation ? `<span>${this.escapeHtml(explanation)}</span>` : ''}`;
    }
  }

  /** He dieu hanh dang bat "giam chuyen dong" */
  _itChuyenDong() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /** Chu nay viet duoc tung net trong the: co du lieu net VA co bang de ve */
  _coVietNet(ch) {
    return !!(window.SenseiStrokes && window.SenseiStrokes.get(ch) &&
      window.SenseiBoard && window.SenseiBoard.vietChuHan);
  }

  /** Bo hen viet net dang cho (hen gio + doi o hien ra) */
  _huyVietNet() {
    clearTimeout(this._vietNetTimer);
    if (this._vietNetIO) { this._vietNetIO.disconnect(); this._vietNetIO = null; }
  }

  /**
   * Mo / dong the trai lam luoi the dan lai (3 cot -> 2 cot) ngay trong mot khung
   * hinh. Mo nhe noi dung roi hien lai de cu nhay cot thanh mot nhip mo, khong giat.
   * Chi opacity. Man hep: the nam duoi day, luoi khong doi cot -> bo qua.
   */
  _lamDiuDoiCot() {
    const sc = this.slideContent;
    if (!sc || !sc.animate || this._itChuyenDong() || window.innerWidth <= 860) return;
    if (this._diuCot) this._diuCot.cancel();
    this._diuCot = sc.animate([{ opacity: .35 }, { opacity: 1 }],
      { duration: 180, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
  }

  openSpotlight(targetId, preFound = null, opts = {}) {
    const found = preFound || this.findItemById(targetId);
    if (!found) return false;

    // Chan o DAY chu khong o focusItem, de phu ca hai duong vao: bai giang tu
    // roi den, va hoc vien tu bam vao the.
    if (this.boQuaTheTrai(found, opts.doBam)) {
      this.closeSpotlight();
      return false;
    }

    const src = this.resolveElement(targetId);
    const el = this.ensureSpotlight();

    const html = this.buildSpotlightHtml(found);
    if (!html) return false;

    // Huy moi animation con dang chay tren the. Neu con animation DONG (fill:both)
    // sot lai, no se giu the o opacity 0 -> spotlight mo ra nhung khong thay gi.
    clearTimeout(this._spotCloseTimer);
    if (this.spotCard.getAnimations) this.spotCard.getAnimations().forEach(a => a.cancel());

    const moiMo = el.classList.contains('hidden');
    const daMoTheTrai = document.body.classList.contains('co-the-trai');
    const itDong = this._itChuyenDong();
    this.spotCard.className = 'spot-card spot-type-' + found.type;
    this.spotCard.innerHTML = html;
    el.classList.remove('hidden');
    el.classList.remove('is-closing');
    // Dat SAU khi bo .hidden: luc con display:none thi scrollTop = 0 khong an,
    // mo lai the se dung o vi tri cuon cu cua the truoc (mat chu + nghia o dau).
    this.spotCard.scrollTop = 0;
    document.body.classList.add('co-the-trai');
    if (!daMoTheTrai) this._lamDiuDoiCot();
    this.spotOpenId = targetId;
    // Hoc vien tu bam mo the: dong the thi tra focus ve dung the do (bai giang tu roi den thi khong)
    this._spotMoTu = opts.doBam ? src : null;

    // Lan dau mo thi the truot vao tu trai. Doi muc thi KHONG truot lai —
    // giang lien mach vai chuc muc ma the cu truot ra truot vao thi chong mat.
    // Giam chuyen dong: hien ngay, khong animate.
    if (!itDong && moiMo && this.spotCard.animate) {
      this.spotCard.animate(
        [{ transform: 'translateX(-14px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 300, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' }
      );
    } else if (!itDong && this.spotCard.animate) {
      // Doi muc: chi nhap nhe mot cai cho biet noi dung vua thay
      this.spotCard.animate(
        [{ opacity: .35 }, { opacity: 1 }],
        { duration: 220, easing: 'ease-out' }
      );
    }

    // Muc that phai nam trong tam nhin thi mui ten moi co cho ma tro.
    // Man hep: the trai nam o day man hinh -> dua muc len dau vung cuon cho khoi bi che.
    if (src) src.scrollIntoView({ behavior: itDong ? 'auto' : 'smooth', block: window.innerWidth <= 860 ? 'start' : 'center' });
    // Cho cuon va layout on dinh roi moi do toa do
    clearTimeout(this._noiTimer);
    this._noiCho = true;
    this._noiTimer = setTimeout(() => { this._noiCho = false; this.veMuiTenNoi(true); }, 340);
    return true;
  }

  closeSpotlight() {
    if (!this.spotEl || this.spotEl.classList.contains('hidden')) return;
    this.spotOpenId = null;
    // Focus dang o trong the (nut dong) hay da roi ve body: dua ve the da mo no, khong de Tab bat dau lai
    // tu dau trang. The khong nhan focus san -> tabindex=-1 (chi focus bang lenh, khong chen vao vong Tab).
    const moTu = this._spotMoTu;
    this._spotMoTu = null;
    const f = document.activeElement;
    if (moTu && moTu.isConnected && (!f || f === document.body || this.spotEl.contains(f))) {
      if (!moTu.hasAttribute('tabindex')) moTu.setAttribute('tabindex', '-1');
      moTu.focus({ preventScroll: true });
    }
    this._huyVietNet();
    if (this.spotNoi) this.spotNoi.innerHTML = '';
    this._noiId = null;
    this._noiCho = false;
    clearTimeout(this._noiTimer);
    document.body.classList.remove('co-the-trai');
    this._lamDiuDoiCot();
    const card = this.spotCard;
    if (card && card.getAnimations) card.getAnimations().forEach(a => a.cancel());
    this.spotEl.classList.add('is-closing');
    if (card && card.animate && !this._itChuyenDong()) {
      const a = card.animate(
        [{ transform: 'none', opacity: 1 }, { transform: 'translateX(-12px)', opacity: 0 }],
        { duration: 200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' }
      );
      a.onfinish = () => {
        // Trong luc animation dong chay, mot muc khac co the da duoc mo ra.
        // Chi an neu that su khong con gi dang mo.
        if (this.spotOpenId) return;
        this.spotEl.classList.add('hidden');
        this.spotEl.classList.remove('is-closing');
      };
    } else {
      this.spotEl.classList.add('hidden');
      this.spotEl.classList.remove('is-closing');
    }

    // Luoi an toan: neu animation khong bao finish (tab an, giam chuyen dong...)
    // thi van phai dong sau 260ms, khong de lop phu treo che mat man hinh.
    clearTimeout(this._spotCloseTimer);
    this._spotCloseTimer = setTimeout(() => {
      if (this.spotEl && !this.spotOpenId) {
        this.spotEl.classList.add('hidden');
        this.spotEl.classList.remove('is-closing');
      }
    }, 260);
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Escape chuỗi để nhúng vào literal JS nằm trong thuộc tính HTML: onclick="fn('...')".
   * Phải escape theo đúng thứ tự: JS trước (\\ và '), HTML sau (& < > ").
   * Dùng escapeHtml() ở đây là SAI vì &#039; sẽ được giải mã ngược thành ' và làm vỡ câu lệnh.
   */
  jsAttr(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r?\n/g, '\\n')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** ` data-emotion="<khoa>"` khi muc giao trinh co "emotion" (vd de_biu) — meo Sensei doc luc roi den */
  camXucAttr(muc) {
    const k = String((muc && muc.emotion) || '').trim().toLowerCase().replace(/[-\s]+/g, '_');
    return /^[a-z_]{2,24}$/.test(k) ? ` data-emotion="${k}"` : '';
  }
}

window.SlideEngine = SlideEngine;
