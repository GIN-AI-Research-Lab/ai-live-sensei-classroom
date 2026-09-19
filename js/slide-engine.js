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

    if (targetId && window.__slideEngine) {
      window.__slideEngine.prepareReadingTarget(targetId);
      utter.onend = () => {
        if (window.__slideEngine) window.__slideEngine.clearReadingFocus(targetId);
      };
      utter.onerror = () => {
        if (window.__slideEngine) window.__slideEngine.clearReadingFocus(targetId);
      };
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

// Đóng modal khi bấm phím ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.closeImageLightbox();
  }
});

/**
 * Nhan dien chu Nhat: hiragana, katakana, kanji, dau lap 々 va truong am ー.
 * Dung de biet doan chu nao cho phep boi den va phat am.
 */
const CO_CHU_NHAT = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\u3005\u30FC]/;

class SlideEngine {
  constructor(loader) {
    this.loader = loader;
    this.currentLevel = "N5";
    this.currentLesson = 1;
    this.currentSlideIndex = 0;
    this.activeTab = "grammar"; // "vocab" | "kanji" | "grammar" | "kaiwa" | "quiz"
    this.activeFocusId = null;  // moi luc CHI MOT muc duoc roi sang
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
        <span>Phát âm: <strong class="text-amber-200 font-serif font-bold">"${this.escapeHtml(preview)}"</strong></span>
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
    }
    this._renderTabContentNow(tabName, subIndex);
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
    if (typeof this.onTabChange === 'function') this.onTabChange(tabName);
  }

  renderCurrentSlide() {
    this.setTab(this.activeTab);
  }

  renderSlide(level, lessonId, slideIdx) {
    this.currentLevel = (level || "N5").toUpperCase();
    this.currentLesson = Number(lessonId) || 1;
    this.currentSlideIndex = Number(slideIdx) || 0;
    this.setTab('grammar', this.currentSlideIndex);
  }

  // 1. Phân môn Từ vựng (Vocabulary)
  renderVocab() {
    const vocabs = this.loader.getVocabList(this.currentLevel, this.currentLesson);
    const lesson = this.loader.getLesson(this.currentLevel, this.currentLesson);

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

    const typeLabels = {
      "noun": { text: "Danh từ", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
      "verb": { text: "Động từ", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
      "adj-i": { text: "Tính từ -i", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
      "adj-na": { text: "Tính từ -na", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
      "particle": { text: "Trợ từ", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
      "adnominal": { text: "Đại từ chỉ định", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
      "counter": { text: "Lượng từ đếm", color: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
      "phrase": { text: "Thành ngữ / Câu", color: "bg-pink-500/20 text-pink-300 border-pink-500/30" }
    };

    const typeIcons = {
      "noun": "fa-cube",
      "verb": "fa-person-running",
      "adj-i": "fa-wand-magic-sparkles",
      "adj-na": "fa-palette",
      "particle": "fa-link",
      "adnominal": "fa-hand-pointer",
      "counter": "fa-arrow-down-1-9",
      "phrase": "fa-comment-dots"
    };

    const vocabCardsHtml = vocabs.map((v, idx) => {
      const typeInfo = typeLabels[v.wordType] || { text: v.wordType || "Từ vựng", color: "bg-slate-700/50 text-slate-300 border-slate-600" };
      const iconClass = typeIcons[v.wordType] || "fa-book";
      const kanjiOrWord = v.kanji || v.word;
      const displayWord = v.kanji && v.furigana 
        ? `<ruby class="text-xl md:text-2xl font-bold text-ink">${this.escapeHtml(v.kanji)}<rt class="text-[11px] text-indigo-300 font-normal font-sans">${this.escapeHtml(v.furigana)}</rt></ruby>`
        : `<span class="text-xl md:text-2xl font-bold text-ink">${this.escapeHtml(v.word)}</span>`;

      const romajiHtml = v.romaji ? `<span class="text-xs text-slate-400 font-mono">[${this.escapeHtml(v.romaji)}]</span>` : '';
      const accentHtml = v.accentNote ? `
        <div class="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
          <i class="fa-solid fa-circle-info text-[10px] text-indigo-400 shrink-0"></i>
          <span class="truncate">${this.escapeHtml(v.accentNote)}</span>
        </div>
      ` : '';

      // Visual Thumbnail or Fallback Themed Badge
      const visualThumbnailHtml = v.imageUrl ? `
        <div 
          class="relative w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/70 shrink-0 group/img cursor-pointer shadow-sm"
          onclick="window.openImageLightbox('${this.jsAttr(v.imageUrl)}', '${this.jsAttr(kanjiOrWord)} (${this.jsAttr(v.furigana || v.word)})', '${this.jsAttr(v.meaningVi)}')"
          title="Bấm để xem ảnh phóng to"
        >
          <img 
            src="${v.imageUrl}" 
            alt="${this.escapeHtml(v.imageAlt || v.meaningVi)}" 
            class="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-110" 
            loading="lazy" 
            onerror="this.parentElement.innerHTML = \`<div class='w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 to-slate-900 text-indigo-300 border border-indigo-500/30 text-center p-1'><i class='fa-solid ${iconClass} text-xs mb-0.5 text-indigo-400'></i><span class='text-[10px] font-bold font-serif leading-tight text-slate-200'>${this.escapeHtml(kanjiOrWord.slice(0, 2))}</span></div>\`;"
          />
          <div class="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-ink text-xs">
            <i class="fa-solid fa-magnifying-glass-plus"></i>
          </div>
        </div>
      ` : (this.artFor(v) ? `
        <div class="sensei-art sensei-art-sm shrink-0" title="Minh hoạ: ${this.escapeHtml(v.meaningVi || "")}">${this.artFor(v)}</div>
      ` : `
        <div class="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center shrink-0 shadow-inner group-hover:border-indigo-500/40 transition">
          <i class="fa-solid ${iconClass} text-xs text-indigo-400 mb-0.5"></i>
          <span class="text-[11px] font-bold font-serif text-slate-300 leading-tight">${this.escapeHtml(kanjiOrWord.slice(0, 2))}</span>
        </div>
      `);

      return `
        <div id="${this.escapeHtml(v.id)}" class="p-3 bg-slate-950/70 border border-slate-800/90 hover:border-indigo-500/60 rounded-xl transition duration-200 flex items-start gap-3 group">
          ${visualThumbnailHtml}
          <div class="flex-1 min-w-0 flex flex-col justify-between h-full">
            <div>
              <div class="flex items-start justify-between gap-1.5 mb-1">
                <div class="flex items-baseline gap-1.5 flex-wrap min-w-0">
                  ${displayWord}
                  ${romajiHtml}
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <span class="text-[10px] px-2 py-0.5 rounded-md border font-medium ${typeInfo.color}">
                    ${typeInfo.text}
                  </span>
                  <button 
                    type="button"
                    onclick="window.playSpeech('${this.jsAttr(v.kanji || v.word)}', '${this.jsAttr(v.id)}')"
                    class="w-7 h-7 rounded-lg bg-indigo-950/60 hover:bg-indigo-700 text-indigo-300 hover:text-white border border-indigo-500/30 flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0"
                    title="Nghe phát âm chuẩn"
                  >
                    <i class="fa-solid fa-volume-high text-xs"></i>
                  </button>
                </div>
              </div>
              <div class="text-sm md:text-base text-slate-200 font-medium leading-relaxed">
                ${this.escapeHtml(v.meaningVi)}
              </div>
            </div>
            ${accentHtml}
          </div>
        </div>
      `;
    }).join("");

    if (this.slideContent) {
      this.slideContent.className = "deck-content slide-fade-enter";
      this.slideContent.innerHTML = `
        <div class="mb-3 flex items-center justify-between">
          <div>
            <h2 class="text-xl md:text-2xl font-bold text-ink flex items-center gap-2.5">
              <i class="fa-solid fa-book text-indigo-400"></i>
              <span>Từ vựng trọng tâm: ${this.escapeHtml(lesson?.title || '')}</span>
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">Bấm biểu tượng loa để nghe phát âm giọng bản xứ chuẩn. Sensei sẽ giảng dạy và giải thích cách dùng.</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 deck-scroll custom-scrollbar">
          ${vocabCardsHtml}
        </div>
      `;
    }
  }

  // 2. Phân môn Chữ Hán (Kanji)
  renderKanji() {
    const kanjis = this.loader.getKanjiList(this.currentLevel, this.currentLesson);
    const lesson = this.loader.getLesson(this.currentLevel, this.currentLesson);

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

    const kanjiCardsHtml = kanjis.map(k => {
      const commonWordsHtml = (k.commonWords || []).map(cw => `
        <div class="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
          <div class="flex items-baseline gap-1.5">
            <span class="font-bold text-indigo-200">${this.escapeHtml(cw.word)}</span>
            <span class="text-[11px] text-slate-400 font-sans">(${this.escapeHtml(cw.furigana)})</span>
          </div>
          <div class="text-slate-300 text-[11px]">${this.escapeHtml(cw.meaningVi)}</div>
        </div>
      `).join("");

      return `
        <div id="${this.escapeHtml(k.id)}" class="p-4 bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl transition space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/40 flex items-center justify-center text-4xl font-serif text-amber-300 font-bold shadow-inner">
                ${this.escapeHtml(k.character)}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-amber-400 tracking-wider font-mono">HÁN VIỆT: ${this.escapeHtml(k.hanViet)}</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">${k.strokeCount} nét</span>
                </div>
                <div class="text-xs text-slate-300 font-medium mt-0.5">${this.escapeHtml(k.meaningVi)}</div>
              </div>
            </div>
            <button 
              type="button"
              onclick="window.playSpeech('${this.jsAttr(k.character)}', '${this.jsAttr(k.id)}')"
              class="w-8 h-8 rounded-xl bg-slate-900 hover:bg-amber-600 hover:text-white text-amber-400 border border-slate-800 flex items-center justify-center transition cursor-pointer active:scale-95"
              title="Phát âm chữ Hán"
            >
              <i class="fa-solid fa-volume-high text-xs"></i>
            </button>
          </div>

          <!-- On / Kun Readings -->
          <div class="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
            <div>
              <span class="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Âm On (Âm Hán):</span>
              <span class="text-indigo-300 font-medium">${(k.onyomi || []).map(x => this.escapeHtml(x)).join(', ') || '-'}</span>
            </div>
            <div>
              <span class="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Âm Kun (Âm Nhật):</span>
              <span class="text-emerald-300 font-medium">${(k.kunyomi || []).map(x => this.escapeHtml(x)).join(', ') || '-'}</span>
            </div>
          </div>

          <!-- Common Words (Jukugo) -->
          <div>
            <span class="text-[11px] font-bold text-slate-400 block mb-1.5 flex items-center gap-1">
              <i class="fa-solid fa-cubes text-[10px] text-amber-400"></i>
              <span>Từ ghép thực tế (Jukugo):</span>
            </span>
            <div class="space-y-1">
              ${commonWordsHtml}
            </div>
          </div>
        </div>
      `;
    }).join("");

    if (this.slideContent) {
      this.slideContent.className = "deck-content slide-fade-enter";
      this.slideContent.innerHTML = `
        <div class="mb-3 flex items-center justify-between">
          <div>
            <h2 class="text-xl md:text-2xl font-bold text-ink flex items-center gap-2.5">
              <i class="fa-solid fa-square-pen text-amber-400"></i>
              <span>Chữ Hán Kanji trọng tâm: ${this.escapeHtml(lesson?.title || '')}</span>
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">Nắm vững âm Hán Việt, cách đọc On/Kun và các từ ghép thường xuất hiện trong đề thi JLPT.</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 deck-scroll custom-scrollbar">
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
      return false;
    }

    const { slide, slideIndex, totalSlides, lesson } = data;
    this.currentSlideIndex = slideIndex;

    if (this.levelBadge) this.levelBadge.innerText = this.currentLevel;
    if (this.lessonNum) this.lessonNum.innerText = this.currentLesson;
    if (this.slideIndexLabel) this.slideIndexLabel.innerText = `Slide ${slideIndex + 1}/${totalSlides}`;

    this.clearHighlights();

    // Render Ví dụ & Tokens có ruby annotation
    const examplesHtml = (slide.examples || []).map((ex, exIdx) => {
      let fullSentenceText = "";
      const tokensHtml = (ex.tokens || []).map(tok => {
        fullSentenceText += (tok.kanji || tok.text || "");

        let innerText = "";
        if (tok.kanji && tok.furigana) {
          innerText = `<ruby>${this.escapeHtml(tok.kanji)}<rt class="text-[10px] text-slate-400 font-sans">${this.escapeHtml(tok.furigana)}</rt></ruby>`;
        } else {
          innerText = this.escapeHtml(tok.text || "");
        }

        const baseClass = tok.isKeyGrammar 
          ? "inline-block px-1.5 py-0.5 rounded transition border border-indigo-500/60 bg-indigo-950/50 text-indigo-200 font-bold cursor-pointer hover:border-indigo-400 hover:text-ink"
          : "inline-block px-1 py-0.5 rounded transition cursor-pointer text-slate-200 hover:text-ink hover:bg-slate-800/60";

        return `<span id="${this.escapeHtml(tok.id)}" onclick="window.playSpeech('${this.jsAttr(tok.kanji || tok.text)}', '${this.jsAttr(tok.id)}'); event.stopPropagation();" class="${baseClass}" title="Bấm để nghe đọc: ${this.escapeHtml(tok.text)}">${innerText}</span>`;
      }).join(" ");

      const exImageHtml = ex.imageUrl ? `
        <div 
          class="w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden bg-slate-900 border border-indigo-500/30 shrink-0 cursor-pointer group/eximg relative shadow-md"
          onclick="window.openImageLightbox('${this.jsAttr(ex.imageUrl)}', 'Tình huống ví dụ', '${this.jsAttr(ex.meaningVi || "")}')"
          title="Bấm để xem ảnh tình huống phóng to"
        >
          <img 
            src="${ex.imageUrl}" 
            alt="${this.escapeHtml(ex.meaningVi || '')}" 
            class="w-full h-full object-cover transition duration-300 group-hover/eximg:scale-110" 
            loading="lazy" 
            onerror="this.parentElement.style.display='none'"
          />
          <div class="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/eximg:opacity-100 transition flex items-center justify-center text-ink text-xs">
            <i class="fa-solid fa-magnifying-glass-plus"></i>
          </div>
        </div>
      ` : '';

      return `
        <div id="${this.escapeHtml(ex.id)}" class="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1.5 hover:border-slate-700 transition">
          <div class="flex items-start gap-3">
            ${exImageHtml}
            <div class="flex-1 min-w-0 space-y-1.5">
              <div class="flex items-start justify-between gap-2">
                <div class="text-lg md:text-2xl text-ink font-medium flex flex-wrap items-end gap-x-1.5 gap-y-3">
                  ${tokensHtml}
                </div>
                <button 
                  type="button"
                  onclick="window.playSpeech('${this.jsAttr(fullSentenceText)}', '${this.jsAttr(ex.id)}')"
                  class="w-7 h-7 rounded-lg bg-indigo-950/60 hover:bg-indigo-700 text-indigo-300 hover:text-white border border-indigo-500/30 flex items-center justify-center transition cursor-pointer shrink-0 active:scale-95"
                  title="Nghe câu ví dụ"
                >
                  <i class="fa-solid fa-volume-high text-xs"></i>
                </button>
              </div>
              <div class="text-sm text-slate-400 italic flex items-center gap-1.5">
                <i class="fa-solid fa-language text-slate-500 text-[11px]"></i>
                <span>${this.escapeHtml(ex.meaningVi || "")}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    const teacherTipHtml = slide.teacherTips ? `
      <div class="mt-2.5 p-2.5 bg-indigo-950/20 border border-indigo-500/30 rounded-xl text-xs text-indigo-200/90 flex items-start gap-2">
        <i class="fa-solid fa-graduation-cap text-indigo-400 text-sm mt-0.5 shrink-0"></i>
        <div>
          <span class="font-bold text-indigo-300">Lời khuyên của Sensei:</span>
          <span class="text-slate-300 ml-1">${this.escapeHtml(slide.teacherTips)}</span>
        </div>
      </div>
    ` : '';

    const culturalNoteHtml = slide.culturalNotes ? `
      <div class="mt-2 p-2.5 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-200/90 flex items-start gap-2">
        <i class="fa-solid fa-lightbulb text-amber-400 text-sm mt-0.5 shrink-0"></i>
        <div>
          <span class="font-bold text-amber-300">Văn hóa & Ứng xử Nhật Bản:</span>
          <span class="text-slate-300 ml-1">${this.escapeHtml(slide.culturalNotes)}</span>
        </div>
      </div>
    ` : '';

    if (this.slideContent) {
      this.slideContent.className = "deck-content slide-fade-enter";
      this.slideContent.innerHTML = `
        <div class="mb-3">
          <h2 class="text-xl md:text-3xl font-bold text-ink mb-2 flex items-center gap-2.5">
            <i class="fa-solid fa-chalkboard-user text-indigo-400"></i>
            <span>${this.escapeHtml(slide.title)}</span>
          </h2>
          <p class="text-sm md:text-base text-slate-300 leading-relaxed max-w-4xl">${this.escapeHtml(slide.explanation)}</p>
        </div>

        <div class="inline-flex items-center gap-2 text-xs bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-lg mb-3 font-mono font-semibold shadow-inner">
          <span class="text-indigo-400 uppercase text-[10px] font-sans font-bold tracking-wider">Cấu trúc:</span>
          <span>${this.escapeHtml(slide.grammarFormula)}</span>
        </div>

        <div class="space-y-2.5 mt-2 deck-scroll custom-scrollbar">
          ${examplesHtml}
          ${teacherTipHtml}
          ${culturalNoteHtml}
        </div>
      `;
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

    const dialogueHtml = dialogue.map((line, idx) => {
      let fullText = "";
      const tokensHtml = (line.tokens || []).map(tok => {
        fullText += (tok.kanji || tok.text || "");

        let innerText = "";
        if (tok.kanji && tok.furigana) {
          innerText = `<ruby>${this.escapeHtml(tok.kanji)}<rt class="text-[10px] text-slate-400 font-sans">${this.escapeHtml(tok.furigana)}</rt></ruby>`;
        } else {
          innerText = this.escapeHtml(tok.text || "");
        }
        return `<span id="${this.escapeHtml(tok.id)}" onclick="window.playSpeech('${this.jsAttr(tok.kanji || tok.text)}', '${this.jsAttr(tok.id)}'); event.stopPropagation();" class="inline-block hover:text-indigo-300 hover:bg-slate-800/50 px-1 py-0.5 rounded transition cursor-pointer" title="Bấm để nghe đọc">${innerText}</span>`;
      }).join(" ");

      const isPersonA = line.speakerRole === 'personA' || line.speakerRole === 'sensei';
      const bubbleClass = isPersonA
        ? "bg-slate-900 border border-indigo-500/30 rounded-2xl rounded-tl-none p-3.5"
        : "bg-slate-950 border border-slate-800 rounded-2xl rounded-tr-none p-3.5";

      const avatarBg = isPersonA ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white";

      const avatarHtml = line.avatarUrl ? `
        <div 
          class="w-9 h-9 rounded-full overflow-hidden border-2 ${isPersonA ? 'border-indigo-500' : 'border-emerald-500'} shrink-0 shadow-md cursor-pointer"
          onclick="window.openImageLightbox('${this.jsAttr(line.avatarUrl)}', '${this.jsAttr(line.speaker)}', 'Nhân vật hội thoại')"
          title="${this.escapeHtml(line.speaker)}"
        >
          <img src="${line.avatarUrl}" alt="${this.escapeHtml(line.speaker)}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML = \`<div class='w-full h-full ${avatarBg} flex items-center justify-center font-bold text-xs'>${this.escapeHtml(line.speaker.slice(0, 2))}</div>\`;" />
        </div>
      ` : `
        <div class="w-9 h-9 rounded-full ${avatarBg} flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
          ${this.escapeHtml(line.speaker.slice(0, 2))}
        </div>
      `;

      return `
        <div id="${this.escapeHtml(line.id)}" class="flex items-start gap-3 p-1">
          ${avatarHtml}
          <div class="flex-1 ${bubbleClass}">
            <div class="flex items-center justify-between mb-1 gap-2">
              <span class="text-xs font-bold text-indigo-400">${this.escapeHtml(line.speaker)}</span>
              <button 
                type="button"
                onclick="window.playSpeech('${this.jsAttr(fullText)}', '${this.jsAttr(line.id)}')"
                class="w-6 h-6 rounded-md bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white flex items-center justify-center text-xs transition cursor-pointer active:scale-95"
                title="Nghe câu thoại"
              >
                <i class="fa-solid fa-volume-high text-[10px]"></i>
              </button>
            </div>
            <div class="text-lg md:text-2xl text-ink font-medium leading-relaxed mb-1.5">
              ${tokensHtml}
            </div>
            <div class="text-sm text-slate-400 italic">
              ${this.escapeHtml(line.meaningVi)}
            </div>
          </div>
        </div>
      `;
    }).join("");

    if (this.slideContent) {
      this.slideContent.className = "deck-content slide-fade-enter";
      this.slideContent.innerHTML = `
        <div class="mb-3 flex items-center justify-between">
          <div>
            <h2 class="text-xl md:text-2xl font-bold text-ink flex items-center gap-2.5">
              <i class="fa-solid fa-comments text-indigo-400"></i>
              <span>Hội thoại thực tế (Kaiwa): ${this.escapeHtml(lesson?.title || '')}</span>
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">Luyện tập đàm thoại tự nhiên theo ngữ cảnh thực tế. Sensei sẽ đóng vai cùng học sinh.</p>
          </div>
        </div>
        <div class="space-y-3 deck-scroll custom-scrollbar">
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

    if (!exercises || exercises.length === 0) {
      // Van giu phan luyen phat am: no lay cau tu giao trinh, khong dinh gi
      // toi bo de trac nghiem.
      if (this.slideContent) {
        this.slideContent.innerHTML = `
          <div class="text-center py-10 text-slate-400">
            <i class="fa-solid fa-file-circle-question text-3xl mb-2 text-indigo-400"></i>
            <p class="font-medium">Chưa có câu trắc nghiệm nào cho bài này.</p>
          </div>
          ${this.buildPronunciationBlock()}
          ${this.buildHandwritingBlock()}
        `;
      }
      return;
    }

    const quizHtml = exercises.map((ex, qIdx) => {
      const isTarget = targetExerciseIndex === qIdx;
      const targetBorder = isTarget ? "border-indigo-500 shadow-lg shadow-indigo-500/20" : "border-slate-800";

      const questionImageHtml = ex.imageUrl ? `
        <div 
          class="my-2 rounded-xl overflow-hidden bg-slate-900/90 border border-slate-800 max-h-48 flex items-center justify-center relative group/qimg cursor-pointer shadow-md"
          onclick="window.openImageLightbox('${this.jsAttr(ex.imageUrl)}', 'Tranh tình huống: Câu ${qIdx + 1}', '${this.jsAttr(ex.question)}')"
          title="Bấm để xem tranh tình huống đầy đủ"
        >
          <img 
            src="${ex.imageUrl}" 
            alt="Tranh tình huống câu hỏi" 
            class="max-h-44 w-auto object-contain transition duration-300 group-hover/qimg:scale-105" 
            loading="lazy" 
            onerror="this.parentElement.style.display='none'"
          />
          <span class="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-[10px] text-slate-300 border border-slate-700 flex items-center gap-1 backdrop-blur-sm">
            <i class="fa-solid fa-magnifying-glass-plus text-indigo-400"></i> Bấm để phóng to
          </span>
        </div>
      ` : '';

      const optionsHtml = (ex.options || []).map((opt, optIdx) => {
        return `
          <button 
            type="button"
            onclick="window.handleSelectOption('${this.jsAttr(ex.id)}', ${optIdx}, ${ex.correctIndex})"
            id="btn-opt-${ex.id}-${optIdx}"
            class="w-full text-left px-4 py-3 rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-800 hover:border-slate-700 text-sm md:text-base text-slate-200 transition flex items-center justify-between group cursor-pointer"
          >
            <span class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-md bg-slate-800 text-slate-400 group-hover:text-ink flex items-center justify-center font-mono font-bold text-[11px]">
                ${String.fromCharCode(65 + optIdx)}
              </span>
              <span>${this.escapeHtml(opt)}</span>
            </span>
            <i class="fa-solid fa-circle-check opacity-0 text-emerald-400" id="icon-opt-${ex.id}-${optIdx}"></i>
          </button>
        `;
      }).join("");

      return `
        <div id="card-${ex.id}" class="p-4 bg-slate-950/80 border ${targetBorder} rounded-2xl space-y-3 transition">
          <div class="flex items-start justify-between gap-2">
            <div class="font-bold text-base md:text-lg text-ink flex items-start gap-2.5">
              <span class="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono text-xs shrink-0">Câu ${qIdx + 1}</span>
              ${ex.generated ? '<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] shrink-0" title="Đề do AI soạn riêng cho lần học này">AI</span>' : ''}
              <span class="whitespace-pre-line">${this.escapeHtml(ex.question)}</span>
            </div>
          </div>

          ${questionImageHtml}

          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            ${optionsHtml}
          </div>

          <div id="explain-${ex.id}" class="hidden p-3 rounded-xl text-xs space-y-1"></div>
        </div>
      `;
    }).join("");

    if (this.slideContent) {
      this.slideContent.className = "deck-content slide-fade-enter";
      this.slideContent.innerHTML = `
        <div class="mb-3 flex items-center justify-between">
          <div>
            <h2 class="text-xl md:text-2xl font-bold text-ink flex items-center gap-2.5">
              <i class="fa-solid fa-pen-clip text-indigo-400"></i>
              <span>Bài tập thực hành: ${this.escapeHtml(lesson?.title || '')}</span>
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">Chọn đáp án đúng. Sensei sẽ lắng nghe, nhận xét và giải thích.</p>
          </div>
          <button type="button" id="quizRegenBtn"
                  onclick="window.regenerateQuiz && window.regenerateQuiz()"
                  class="ctl ctl-ghost shrink-0" title="Nhờ AI soạn một bộ đề khác">
            <i class="fa-solid fa-rotate"></i><span>Đổi đề khác</span>
          </button>
        </div>
        <div class="space-y-3 deck-scroll custom-scrollbar">
          ${quizHtml}
          ${this.buildPronunciationBlock()}
          ${this.buildHandwritingBlock()}
        </div>
      `;
    }

    if (targetExerciseIndex !== null) {
      const targetCard = document.getElementById(`card-${exercises[targetExerciseIndex]?.id}`);
      if (targetCard) targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    if (this.slideIndexLabel) this.slideIndexLabel.innerText = 'phản xạ';
    this.clearHighlights();
    if (!this.slideContent) return;

    this.slideContent.innerHTML = `
      <div class="max-w-2xl mx-auto">
        <div class="mb-4">
          <h2 class="text-xl md:text-2xl font-bold text-ink flex items-center gap-2.5">
            <i class="fa-solid fa-bolt text-amber-400"></i>
            <span>Phản xạ nhanh</span>
          </h2>
          <p class="text-xs text-slate-400 mt-1">
            Không có thời gian nghĩ. Đề hiện ra là làm luôn — Sensei nghe/nhìn rồi phán ngay tại chỗ.
          </p>
        </div>

        <div class="flex gap-2 mb-4">
          <button type="button" id="pxCheViet"
                  onclick="window.doiCheDoPhanXa && window.doiCheDoPhanXa('viet')"
                  class="flex-1 py-2.5 rounded-xl border text-sm font-medium transition cursor-pointer active:scale-95">
            <i class="fa-solid fa-pen-nib text-xs mr-1.5"></i>Viết nhanh
          </button>
          <button type="button" id="pxCheNoi"
                  onclick="window.doiCheDoPhanXa && window.doiCheDoPhanXa('noi')"
                  class="flex-1 py-2.5 rounded-xl border text-sm font-medium transition cursor-pointer active:scale-95">
            <i class="fa-solid fa-microphone-lines text-xs mr-1.5"></i>Nói nhanh
          </button>
        </div>

        <div id="pxThan"></div>
      </div>`;

    if (typeof window.veManPhanXa === 'function') window.veManPhanXa();
  }

  buildHandwritingBlock() {
    if (!this.loader.getHandwritingSet) return '';
    const bo = this.loader.getHandwritingSet(
      this.currentLevel, this.currentLesson, this.handwritingRound || 0);
    if (!bo.length) return '';

    this.handwritingSet = bo;

    const the = bo.map((c, i) => {
      const id = this.escapeHtml(c.id);
      const goiYKana = (c.kana && c.kana !== c.dapAn)
        ? `<span class="text-ink font-medium">${this.escapeHtml(c.kana)}</span>` : '';
      const goiYDoc = c.doc ? `<span class="text-slate-400 font-mono text-xs">${this.escapeHtml(c.doc)}</span>` : '';
      const deBai = c.kieu === 'khuyet'
        ? `<div class="text-lg md:text-xl text-ink leading-relaxed">${this.escapeHtml(c.cauHoi)}</div>`
        : `<div class="text-sm text-slate-300">Viết lại chữ của từ này:</div>`;

      return `
      <div class="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2.5">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px] shrink-0">Chữ ${i + 1}</span>
          <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] shrink-0">
            ${c.tuBai === this.currentLesson ? 'Bài này' : 'Ôn bài ' + c.tuBai}
          </span>
          <span id="vtdem-${id}" class="ml-auto px-2 py-0.5 rounded bg-slate-800 text-slate-500 font-mono text-[11px]">10s</span>
        </div>
        ${deBai}
        <div class="flex items-center gap-2 text-xs flex-wrap">
          ${goiYKana}${goiYDoc}
          <span class="text-slate-400">— ${this.escapeHtml(c.nghia)}</span>
        </div>
        <canvas id="vtkhung-${id}" width="320" height="320"
                class="w-full aspect-square rounded-xl border border-slate-700 cursor-crosshair mx-auto block"
                style="touch-action:none;background:#fffdf7;max-width:210px"></canvas>
        <div class="flex gap-2">
          <button type="button" id="vtbd-${id}" onclick="window.batDauVietTay && window.batDauVietTay('${this.jsAttr(c.id)}')"
                  class="flex-1 py-2 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-200 text-xs font-medium transition cursor-pointer active:scale-95">
            <i class="fa-solid fa-play text-[10px] mr-1"></i>Bắt đầu 10 giây
          </button>
          <button type="button" onclick="window.xoaNetViet && window.xoaNetViet('${this.jsAttr(c.id)}')"
                  class="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs transition cursor-pointer active:scale-95"
                  title="Xoá nét đã viết">
            <i class="fa-solid fa-eraser text-[10px]"></i>
          </button>
          <button type="button" onclick="window.nopChuViet && window.nopChuViet('${this.jsAttr(c.id)}')"
                  class="px-3 py-2 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs transition cursor-pointer active:scale-95"
                  title="Nộp cho Sensei chấm">
            <i class="fa-solid fa-paper-plane text-[10px]"></i>
          </button>
        </div>
        <div id="vtkq-${id}" class="hidden"></div>
      </div>`;
    }).join('');

    return `
      <div class="pt-5 mt-2 border-t border-slate-800">
        <div class="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 class="text-lg md:text-xl font-bold text-ink flex items-center gap-2.5">
              <i class="fa-solid fa-pen-nib text-amber-400"></i>
              <span>Luyện viết tay</span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Bấm "Bắt đầu" rồi viết lại chữ bằng tay trong 10 giây — hết giờ tự nộp.
              Sensei sẽ nhìn nét chữ rồi phán. Có cả chữ của bài này lẫn chữ ôn lại bài trước.
            </p>
          </div>
          <button type="button" onclick="window.doiChuVietTay && window.doiChuVietTay()"
                  class="shrink-0 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs transition cursor-pointer active:scale-95">
            <i class="fa-solid fa-rotate text-[10px] mr-1"></i>Đổi chữ khác
          </button>
        </div>
        <div class="grid gap-3 md:grid-cols-2">${the}</div>
      </div>`;
  }

  buildPronunciationBlock() {
    if (!this.loader.getPronunciationSet) return '';
    const bo = this.loader.getPronunciationSet(
      this.currentLevel, this.currentLesson, this.pronunciationRound || 0);
    if (!bo.length) return '';

    this.pronunciationSet = bo;

    const the = bo.map((c, i) => `
      <div id="${this.escapeHtml(c.id)}" class="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2.5 transition">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[11px] shrink-0">Câu ${i + 1}</span>
              <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] shrink-0"
                    title="${c.tuBai === this.currentLesson ? 'Mẫu câu của bài đang học' : 'Ôn lại mẫu câu đã học'}">
                ${c.tuBai === this.currentLesson ? 'Bài này' : 'Ôn bài ' + c.tuBai}
              </span>
            </div>
            <div class="text-lg md:text-xl text-ink leading-relaxed">${this.buildSentence(c.tokens)}</div>
            <div class="text-xs text-slate-400 mt-1">${this.escapeHtml(c.meaningVi)}</div>
          </div>
          <div class="flex flex-col gap-1.5 shrink-0">
            <button type="button" onclick="window.playSpeech('${this.jsAttr(c.jp)}')"
                    class="w-9 h-9 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer active:scale-95"
                    title="Nghe mẫu trước khi đọc">
              <i class="fa-solid fa-volume-high text-xs"></i>
            </button>
            <button type="button" id="rec-${this.escapeHtml(c.id)}"
                    onclick="window.thuAmPhatAm && window.thuAmPhatAm('${this.jsAttr(c.id)}')"
                    class="w-9 h-9 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 flex items-center justify-center transition cursor-pointer active:scale-95"
                    title="Bấm để thu âm, bấm lại để gửi cho Sensei chấm">
              <i class="fa-solid fa-microphone text-xs"></i>
            </button>
          </div>
        </div>
        <div id="kq-${this.escapeHtml(c.id)}" class="hidden"></div>
      </div>`).join('');

    return `
      <div class="pt-5 mt-2 border-t border-slate-800">
        <div class="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 class="text-lg md:text-xl font-bold text-ink flex items-center gap-2.5">
              <i class="fa-solid fa-microphone-lines text-cyan-400"></i>
              <span>Luyện phát âm cả câu</span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Bấm loa nghe mẫu, rồi bấm micro đọc to cả câu. Bấm lại lần nữa để Sensei nghe và chấm.
              Có cả câu của bài này lẫn câu ôn lại từ những bài trước.
            </p>
          </div>
          <button type="button" onclick="window.doiCauPhatAm && window.doiCauPhatAm()"
                  class="ctl ctl-ghost shrink-0" title="Lấy bộ câu khác từ các bài đã học">
            <i class="fa-solid fa-rotate"></i><span>Đổi câu khác</span>
          </button>
        </div>
        <div class="space-y-3">${the}</div>
      </div>`;
  }

  openExercise(level, lessonId, exerciseIdx = 0) {
    this.currentLevel = (level || this.currentLevel).toUpperCase();
    this.currentLesson = Number(lessonId) || this.currentLesson;
    this.setTab('quiz', Number(exerciseIdx) || 0);
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
        badge.className = 'reading-badge-indicator inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-600/90 text-white font-bold text-[10px] shadow-md ml-2';
        badge.innerHTML = '<i class="fa-solid fa-volume-high text-[9px] animate-pulse"></i> Đang đọc...';
        const titleArea = el.querySelector('h2, h3, .font-bold, .text-xs, ruby, span');
        if (titleArea && titleArea.parentElement) {
          titleArea.parentElement.appendChild(badge);
        }
      }
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  /** Tat han den roi: go class + dong spotlight */
  clearReadingFocus(targetId = null) {
    if (targetId && targetId !== this.activeFocusId) {
      this.clearFocusClasses(targetId);
      return;
    }
    this.activeFocusId = null;
    this.clearFocusClasses(targetId);
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
    this.applyFocusStyle(targetId, styleType);
    this.setCaption(comment, styleType);
    this.openSpotlight(targetId, found, opts);
    this.tuKhoanhNguPhap(found);
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

  applyFocusStyle(targetId, styleType) {
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
      if (styleType === 'reading_focus' && isBlockCard && !el.querySelector('.reading-badge-indicator')) {
        const badge = document.createElement('span');
        badge.className = 'reading-badge-indicator inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-white font-bold text-[10px] shadow-md ml-2';
        badge.innerHTML = '<i class="fa-solid fa-volume-high text-[9px]"></i> Đang đọc…';
        const anchor = el.querySelector('h2, h3, .font-bold, ruby, span');
        if (anchor && anchor.parentElement) anchor.parentElement.appendChild(badge);
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  setBusy(on, title, note) {
    const canvas = document.querySelector('.deck-canvas');
    if (!canvas) return;

    // Nho lai de con dung sau moi lan render: cac ham render gan lai
    // className cua slideContent, quet mat lop mo neu khong dat lai.
    this.busyState = on ? { title, note } : null;
    if (this.slideContent) this.slideContent.classList.toggle('is-busy', !!on);

    let ov = document.getElementById('deckBusy');
    if (!on) { if (ov) ov.remove(); return; }

    if (ov) {
      // Da co san: chi thay chu. Gan lai innerHTML se chay lai animation
      // hien ra tu dau, dem tien do nhay 10 lan trong lam giat.
      const t = ov.querySelector('.deck-busy-title');
      const n = ov.querySelector('.deck-busy-note');
      if (t) t.textContent = title || 'Đang xử lý…';
      if (n) n.textContent = note || '';
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
    if (this.busyState && this.slideContent) this.slideContent.classList.add('is-busy');
  }

  setCaption(comment, styleType) {
    if (this.highlightNotice) {
      if (comment) {
        const icon = styleType === 'warning' ? 'fa-triangle-exclamation text-rose-400'
                   : styleType === 'vocab_highlight' ? 'fa-star text-amber-400'
                   : styleType === 'reading_focus' ? 'fa-volume-high text-indigo-400 animate-pulse'
                   : 'fa-sparkles text-cyan-400';
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
    document.querySelectorAll('.hl-grammar, .hl-vocab, .hl-warning, .hl-reading-inline, .hl-card-grammar, .hl-card-vocab, .hl-card-warning, .reading-focus').forEach(el => {
      el.classList.remove('hl-grammar', 'hl-vocab', 'hl-warning', 'hl-reading-inline', 'hl-card-grammar', 'hl-card-vocab', 'hl-card-warning', 'reading-focus');
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
    this.errorDock.classList.add('slide-fade-enter', 'roast-shake');
    this.errorDock.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    const data = this.loader.getSlide(this.currentLevel, this.currentLesson, this.currentSlideIndex + 1);
    if (data && data.slide) {
      this.renderGrammar(this.currentSlideIndex + 1);
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
      + '  <button type="button" class="spot-dong" title="Đóng thẻ (Esc)"><i class="fa-solid fa-xmark"></i></button>'
      + '  <div class="spot-card"></div>'
      + '</aside>';
    document.body.appendChild(el);

    el.querySelector('.spot-dong').addEventListener('click', () => this.closeSpotlight());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeSpotlight();
    });

    // Mui ten noi the voi muc that — phai bam theo khi cuon trang hay doi co
    // man hinh, khong thi no tro vao khoang khong.
    let cho = false;
    const veLai = () => {
      if (cho) return;
      cho = true;
      requestAnimationFrame(() => { cho = false; this.veMuiTenNoi(); });
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
  veMuiTenNoi() {
    if (!this.spotEl || this.spotEl.classList.contains('hidden') || !this.spotNoi) return;
    this.spotNoi.innerHTML = '';

    const dock = this.spotEl.querySelector('.spot-dock');
    const dich = this.resolveElement(this.spotOpenId);
    if (!dock || !dich) return;

    // Man hinh hep: the nam duoi day, khong con cho ma keo mui ten
    if (window.innerWidth < 860) return;

    const d = dock.getBoundingClientRect();
    const t = dich.getBoundingClientRect();
    if (t.width < 2 || t.bottom < 8 || t.top > window.innerHeight - 8) return;

    const x1 = d.right - 2;
    const y1 = Math.min(Math.max(t.top + t.height / 2, d.top + 24), d.bottom - 24);
    const x2 = t.left - 9;
    const y2 = t.top + t.height / 2;
    const giua = (x1 + x2) / 2;

    const NS = 'http://www.w3.org/2000/svg';
    const duong = `M${x1},${y1} C${giua},${y1} ${giua},${y2} ${x2},${y2}`;

    // Net nen mau giay, day hon, nam duoi: duong noi di ngang qua cac the o
    // giua nen khong co no thi doc nham thanh gach ngang chu.
    const nen = document.createElementNS(NS, 'path');
    nen.setAttribute('d', duong);
    nen.setAttribute('class', 'spot-noi-nen');
    this.spotNoi.appendChild(nen);

    const than = document.createElementNS(NS, 'path');
    than.setAttribute('d', duong);
    than.setAttribute('class', 'spot-noi-than');
    this.spotNoi.appendChild(than);

    const dau = document.createElementNS(NS, 'path');
    dau.setAttribute('d', `M${x2},${y2} l-8,-5 M${x2},${y2} l-8,5`);
    dau.setAttribute('class', 'spot-noi-dau');
    this.spotNoi.appendChild(dau);

    const dai = than.getTotalLength();
    than.style.strokeDasharray = dai;
    than.style.strokeDashoffset = dai;
    than.style.animation = 'spotNoiChay .45s ease-out forwards';
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
            <span class="dword">${this.escapeHtml(word)}</span>
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

  /** Câu đầy đủ có ruby, token trọng tâm được tô sáng */
  buildSentence(tokens, focusTokenId = null) {
    return (tokens || []).map(tk => {
      const inner = (tk.kanji && tk.furigana)
        ? `<ruby>${this.escapeHtml(tk.kanji)}<rt>${this.escapeHtml(tk.furigana)}</rt></ruby>`
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
    const speak = (text, label) => `
      <button type="button" class="spot-speak" onclick="window.playSpeech('${this.jsAttr(text)}')">
        <i class="fa-solid fa-volume-high"></i><span>${this.escapeHtml(label)}</span>
      </button>`;

    if (found.type === 'vocab') {
      const v = found.data;
      const word = v.kanji || v.word;
      const head = (v.kanji && v.furigana)
        ? `<ruby>${this.escapeHtml(v.kanji)}<rt>${this.escapeHtml(v.furigana)}</rt></ruby>`
        : this.escapeHtml(v.word);
      // Thu tu uu tien: anh co san trong giao trinh -> hinh ve SVG.
      const artSvg = this.artFor(v);
      const visual = v.imageUrl
        ? this.buildImage(v.imageUrl, v.imageAlt || v.meaningVi)
        : (artSvg ? `<div class="sensei-art sensei-art-lg">${artSvg}</div>` : '');

      return `
        ${visual}
        <div class="spot-head">${head}</div>
        <div class="spot-sub">${v.romaji ? `<span class="spot-romaji">[${this.escapeHtml(v.romaji)}]</span>` : ''}</div>
        <div class="spot-meaning">${this.escapeHtml(v.meaningVi)}</div>
        ${v.accentNote ? `<div class="spot-note"><i class="fa-solid fa-circle-info"></i><span>${this.escapeHtml(v.accentNote)}</span></div>` : ''}
        ${speak(word, 'Nghe phát âm')}`;
    }

    if (found.type === 'kanji') {
      const k = found.data;
      const words = (k.commonWords || []).map(cw => `
        <div class="spot-row">
          <span class="spot-row-jp">${this.escapeHtml(cw.word)} <em>(${this.escapeHtml(cw.furigana)})</em></span>
          <span class="spot-row-vi">${this.escapeHtml(cw.meaningVi)}</span>
        </div>`).join('');
      // Co du lieu net thi viet ra tung net ngay trong spotlight — day moi la
      // thu giao trinh thieu: no ghi "8 net" ma khong chi duoc 8 net do la gi.
      const coNet = !!(window.SenseiStrokes && window.SenseiStrokes.get(k.character));
      if (coNet) {
        setTimeout(() => {
          const o = this.spotCard && this.spotCard.querySelector('[data-viet-net]');
          if (o && window.SenseiBoard) {
            o.innerHTML = '';
            window.SenseiBoard.vietChuHan(k.character, { noi: o });
          }
        }, 220);   // cho hieu ung mo spotlight bay xong roi moi viet
      }

      const origin = window.SenseiArt ? window.SenseiArt.kanji(k.character) : null;
      const originHtml = origin ? `
        <div class="sensei-art sensei-art-lg">${origin.svg}</div>
        <div class="spot-note spot-origin">
          <i class="fa-solid fa-lightbulb"></i>
          <span><strong>Gốc chữ:</strong> ${this.escapeHtml(origin.note)}</span>
        </div>` : '';
      return `
        ${coNet ? '<div class="spot-viet-net" data-viet-net="1"></div>' : ''}
        ${originHtml}
        <div class="spot-kanji">${this.escapeHtml(k.character)}</div>
        <div class="spot-sub">
          <span class="spot-chip">HÁN VIỆT: ${this.escapeHtml(k.hanViet)}</span>
          <span class="spot-chip">${k.strokeCount} nét</span>
        </div>
        <div class="spot-meaning">${this.escapeHtml(k.meaningVi)}</div>
        <div class="spot-readings">
          <div><span class="spot-rlabel">Âm On</span>${this.escapeHtml((k.onyomi || []).join(', ') || '—')}</div>
          <div><span class="spot-rlabel">Âm Kun</span>${this.escapeHtml((k.kunyomi || []).join(', ') || '—')}</div>
        </div>
        ${words ? `<div class="spot-words"><div class="spot-diagram-label">Từ ghép thực tế</div>${words}</div>` : ''}
        ${speak(k.character, 'Nghe đọc chữ Hán')}`;
    }

    if (found.type === 'example' || found.type === 'kaiwa') {
      const d = found.data;
      const plain = (d.tokens || []).map(t => t.kanji || t.text).join('');
      // Voi cau ngu phap, SO DO CAU TRUC moi la thu giai thich duoc.
      return `
        ${this.buildImage(d.imageUrl, d.meaningVi)}
        ${found.type === 'kaiwa' ? `<div class="spot-speaker">${this.escapeHtml(d.speaker || '')}</div>` : ''}
        <div class="spot-sentence">${this.buildSentence(d.tokens)}</div>
        <div class="spot-meaning">${this.escapeHtml(d.meaningVi || '')}</div>
        ${this.buildDiagram(d.tokens)}
        ${speak(plain, 'Nghe đọc cả câu')}`;
    }

    if (found.type === 'token') {
      const tk = found.data, sen = found.sentence || {};
      const role = this.tokenRole(tk.text);
      const head = (tk.kanji && tk.furigana)
        ? `<ruby>${this.escapeHtml(tk.kanji)}<rt>${this.escapeHtml(tk.furigana)}</rt></ruby>`
        : this.escapeHtml(tk.text || '');
      return `
        <div class="spot-head">${head}</div>
        ${role ? `<div class="spot-sub"><span class="spot-chip is-key">${this.escapeHtml(role)}</span></div>` : ''}
        <div class="spot-incontext">
          <div class="spot-diagram-label">Trong câu</div>
          <div class="spot-sentence is-small">${this.buildSentence(sen.tokens, tk.id)}</div>
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
    this.spotCard.className = 'spot-card spot-type-' + found.type;
    this.spotCard.innerHTML = html;
    this.spotCard.scrollTop = 0;
    el.classList.remove('hidden');
    el.classList.remove('is-closing');
    document.body.classList.add('co-the-trai');
    this.spotOpenId = targetId;

    // Lan dau mo thi the truot vao tu trai. Doi muc thi KHONG truot lai —
    // giang lien mach vai chuc muc ma the cu truot ra truot vao thi chong mat.
    if (moiMo && this.spotCard.animate) {
      this.spotCard.animate(
        [{ transform: 'translateX(-14px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 300, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' }
      );
    } else if (this.spotCard.animate) {
      // Doi muc: chi nhap nhe mot cai cho biet noi dung vua thay
      this.spotCard.animate(
        [{ opacity: .35 }, { opacity: 1 }],
        { duration: 220, easing: 'ease-out' }
      );
    }

    // Muc that phai nam trong tam nhin thi mui ten moi co cho ma tro
    if (src) src.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Cho cuon va layout on dinh roi moi do toa do
    setTimeout(() => this.veMuiTenNoi(), 340);
    return true;
  }

  closeSpotlight() {
    if (!this.spotEl || this.spotEl.classList.contains('hidden')) return;
    this.spotOpenId = null;
    if (this.spotNoi) this.spotNoi.innerHTML = '';
    document.body.classList.remove('co-the-trai');
    const card = this.spotCard;
    if (card && card.getAnimations) card.getAnimations().forEach(a => a.cancel());
    this.spotEl.classList.add('is-closing');
    if (card && card.animate) {
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
}

window.SlideEngine = SlideEngine;
