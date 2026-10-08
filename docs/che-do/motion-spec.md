# Lecture stage (sân khấu giảng) — BINDING implementation spec

Owner request, verbatim: "làm tất cả theo motion design để đẹp, khớp với lời nói, kiểu thế để bài sinh động và không bị cụt. và motion chỉ chạy khi bài giảng đang chạy, nếu để im thì giữ nguyên layout màn hình để người dùng thao tác và bấm. khi giảng thì k thao tác gì ở khung content chính. khi hỏi bài hoặc dừng thì mới thao tác được"

This spec merges Proposal 0 ("one scene per beat, teaching clarity first") and Proposal 1 ("Cinematic Flow"). Where they disagree, this document decides. Builders implement exactly what is written here. Line numbers refer to the working tree as of this spec; always re-locate by function name before editing.

Coverage numbers were measured over all 100 `curriculum/*/*.json` lessons by running the exact algorithms of §3.3 and §3.4 (throwaway scripts, not kept) and the earlier `scratchpad/artcov.js`.

---

## 0. Ground rules

### 0.1 Principles (apply to every scene)

1. **One motion, one teaching job.** Each motion answers one of three questions: "what is Sensei saying now?", "which part is this?", or "how does this piece fit the pattern?". Nothing loops except live states (the "Sensei đang chuẩn bị…" dots, the waiting dot, the speaking ring in dialogue playback). Nothing moves in the background.
2. **Scenes only grow while Sensei speaks.** An element appears when it is spoken and stays until the scene leaves. A scene leaves only in the post-beat gap, never while the beat's audio is playing. This is what "không cụt" means here.
3. **At most one emphasis at a time.** Emphasis pulses at most twice. A new emphasis relaxes the previous one to a static tint. Each emphasis is held for at least 600 ms.
4. **Every beat ends on a complete frame.** Before a scene leaves, every content cue has fired (§1.6.5).
5. **Everything is laid out when the scene is built.** Content that has not been revealed yet is `opacity:0` and keeps its box, so a reveal never reflows the scene. Exceptions: the dialogue thread (translated with transforms) and the notes rail (fixed reserved height).
6. **Animate only `translate`, `scale`, `opacity`.** Use the individual transform properties, which this codebase already uses (`cardIn`, styles.css 343). The one exception is `stroke-dashoffset` on at most 20 small SVG paths (kanji strokes through the existing `bangVeRa`, and illustration draw-on).
7. **The final state is applied first; animation only decorates it.** Every effect sets its final class or style synchronously, then plays a WAAPI animation with `fill:'backwards'`. Never wait on `animationend` or `transitionend`. All sequencing runs on the director's `setTimeout` timers, so the logic is correct even where rAF or CSS animations do not advance (test pane, hidden tab).
8. **No motion when not lecturing.** In IDLE and PAUSED the stage is `display:none` and the chapter grid is the normal static, fully interactive layout. Normal feedback to the user's own clicks (hover, the 200 ms tab fade, existing quiz tints) is unchanged.
9. **Design system.** Colours come from the existing `:root` tokens (styles.css 16–65):
   - emphasis: `--accent` as a 12% tint layer or a 3px underline
   - variable slots: dashed `--line-strong`; filled slots `--paper-deep`
   - `--sage` / `--clay` only for right and wrong
   - `--gold` only for culture notes

   Fonts: `--font-jp` for Japanese; `.jp-serif` only for single display glyphs (the kanji tile and the vocab headword). Vietnamese text is never below 12px.

### 0.2 Decisions that resolve the proposals

| Topic | Decision | Why |
|---|---|---|
| Stage DOM location | `<section id="sanKhauGiang" class="deck-canvas san-khau-giang">`, created by motion.js as the next sibling of the existing `.deck-canvas` inside `main.deck-stage` (P1) | Inherits all 18 `.deck-canvas` lane rules (cat lane, board, ≤980, ≥1500, landscape) for free. It sits outside the canvas scroll container, so `scrollIntoView` nudges on the hidden grid cannot shift it. `setBusy`'s `querySelector('.deck-canvas')` still returns the original canvas, because it comes first in the DOM |
| When the frame appears | The scene frame (identity: headword, glyph tile, formula frame, sentence, question and options) **enters at beat start**, during the ~1 s pre-roll. Spoken details are speech cues (P1) | No blank stage. The learner reads, then listens |
| When transitions run | At `executeLectureStep` only (P0), plus the chapter card inside the 1600 ms gap | A transition never overlaps speech |
| Unmatched emphasis | Dropped. Only content and action cues fall back to time fractions | A reading sweep at a guessed time would teach the wrong timing |
| Vietnamese keyword matching | Allowed only for keys of ≥ 8 normalised characters and ≥ 2 syllables, or with a lead-in phrase (P1); otherwise "next phrase" (P0) | Short meanings like "Tôi" occur everywhere |
| Quiz waiting UI | Hand-off to the **real grid card**: a FLIP of the stage block onto the card rect, then the grid is shown with only that card live (P0). Stage option buttons are not built as clickable controls (not P1) | Reuses all grading UI, has no duplicate ids, and keeps the explain box and its speaker button working |
| Wrong answer while waiting | Grade **without pausing** (`senseiNoiNgoaiBai(..., {giuGiang:true})`); continue after the grading speech plus reading time (both proposals) | "Giảng tiếp" no longer replays an answered question |
| Pronunciation / handwriting | **Not lecture beats in this pass.** They stay IDLE/PAUSED features. The lecture's finish card hands off to them (§3.10) | Mic grading takes 20–90 s (memory note) and would stall the lecture |
| Kanji radicals (休 = 亻 + 木) | Only the ~12 kanji with `SenseiArt.kanji(ch).note` naming parts in brackets. **No invented decompositions** | Local KanjiVG has no radical groups |
| Conjugation morph | Only forms **attested in the data**: formula `X→Y` chains, `accentNote` "Thể từ điển: X", and forms found in example tokens against lesson vocab. No conjugation engine | Never display a wrong form |
| Board panel during the stage | Never auto-opens. `write_on_board` goes to the stage notes rail and silently into the board history; `write_kanji` draws into the stage | Opening the panel adds `body.co-bang` and pushes the canvas edge 390 px mid-beat |
| Spotlight during the stage | Suppressed (`boQuaTheTrai` → true) | The stage replaces it. Its phone bottom sheet would cover the stage |
| New Gemini tool | **None. Zero prompt growth.** Transcripts, audio clock and beat data are enough | Keeps the session prompt stable |

---

## 1. Architecture

### 1.1 Modules and load order

| File (all new except where noted) | Global | Owner |
|---|---|---|
| `js/motion.js` | `window.SenseiMotion`, `window.__motion` | A |
| `js/motion-canh-chu.js` (vocab, kanji, grammar-intro, example) | registers via `SenseiMotion.dangKyCanh` | B |
| `js/motion-canh-hoi.js` (kaiwa-intro, kaiwa-run, kaiwa, quiz) | registers via `SenseiMotion.dangKyCanh` | C |
| `js/mo-phong.js` (mock lecture, inert unless `?moPhong`) | `window.__moPhong` | D |
| `css/motion.css`, `css/motion-chu.css`, `css/motion-hoi.css` | — | A, B, C |

**`index.html` edits.** Only D edits index.html, with two `Edit` insertions on unique anchors, re-reading the file just before each edit. Another team is adding a script tag concurrently, so never rewrite the file.

1. After `<link rel="stylesheet" href="css/lesson.css" />`:
   ```html
   <link rel="stylesheet" href="css/motion.css" />
   <link rel="stylesheet" href="css/motion-chu.css" />
   <link rel="stylesheet" href="css/motion-hoi.css" />
   ```
2. After `<script src="js/ui-shell.js"></script>`:
   ```html
   <!-- San khau giang (motion design) + che do mo phong bai giang (?moPhong) -->
   <script src="js/motion.js"></script>
   <script src="js/motion-canh-chu.js"></script>
   <script src="js/motion-canh-hoi.js"></script>
   <script src="js/mo-phong.js"></script>
   ```

app.js builds its clients inside its `DOMContentLoaded` handler (after `await curriculumLoader.init()`). All static scripts run before that event, so:
- `SenseiMotion` exists when app.js first calls it;
- mo-phong.js can swap the `GeminiLiveClient` binding in time (§4.1).

**Kill switch.** With `?khongSanKhau` in the URL:
- `SenseiMotion.bat === false` and every method is a no-op;
- app.js reaches it only through `SK()` (§2.0), which then returns `null`;
- the lecture behaves exactly as today, with no stage, no lock and no quiz waiting.

**Dependencies.** motion.js must work whether or not `window.SenseiKhauHinh` is loaded, because another team owns it.

### 1.2 Director modes

`SenseiMotion` keeps `che` (mode):

| `che` | Meaning | Entered by | Left by |
|---|---|---|---|
| `tat` | Stage off; grid normal | init, `tamDung`, `dung`, `dongBo(state≠PLAYING)` | `batDauNhip` |
| `giang` | A scene is live and speech cues are running | `batDauNhip` | `khiHetNhip`, `vaoCho`, `tamDung`, `dung` |
| `chuyen` | Post-beat gap; final frame held, chapter or finish card may show | `khiHetNhip` | `batDauNhip`, `tamDung`, `dung` |
| `cho` | A quiz beat waits for the learner; the grid's current card is live | `vaoCho` | `raCho` → then `khiHetNhip`; `tamDung`, `dung` |

`lectureState` in app.js stays `'PLAYING'` for `giang`, `chuyen` and `cho`.

Every mode change bumps `epoch`. All director timers are registered with the epoch they were created in, and are dropped when it changes.

### 1.3 Public API (A implements exactly; D calls exactly)

```js
window.SenseiMotion = {
  bat,                                // boolean; false under ?khongSanKhau or if init threw
  init({ audioEngine, slideEngine, khiTiepTuc, khiBoQua }),   // called once by app.js
  // --- lecture lifecycle
  batDauNhip(beat, ctx),              // at executeLectureStep, BEFORE focusItem; builds + enters the scene
  khiHetNhip({ tiep, gapMs, cacNhipChuongTiep, tongKet }),     // at scheduleAutoNextStep (tiep null = lesson end)
  tamDung(),                          // PAUSED (any cause)
  tiepTuc(),                          // resume requested; next batDauNhip shows the stage with a fade
  dung(),                             // IDLE (finish, openLesson)
  dongBo(lectureState, { isRaisingHand }),   // invariant from updateLectureControlsUI; turns the stage off if state !== 'PLAYING'
  // --- speech / audio signals
  khiGuiLuot(),                       // a user turn is being sent (onBeforeUserMessage)
  khiCoAmThanh(b64, t0, t1),          // a Sensei chunk was scheduled at [t0,t1) AudioContext time
  khiMatAmThanh(b64, lyDo),           // chunk dropped by playPCM24k: 'chan' | 'clip' | 'khoa'
  khiCoLoi(doan, qEnd),               // transcript fragment; qEnd = audioEngine.scheduledTime at arrival (0 = none queued)
  khiTuNgat(),                        // onSelfInterrupt (stale audio of the previous turn)
  khiXaHang(),                        // stopPlayback manual flush (scheduledTime reset to 0)
  khiLuotXong(tEnd),                  // onTurnComplete; tEnd = audioEngine.scheduledTime
  khiCongCu(name, args) -> result | null,   // tool interception; null = let app.js handle it
  // --- dialogue
  khiDongThoai(line, i),              // a dialogue line is about to play (kaiwa-run / kaiwa)
  khiClip(lineId, { t0, dur, pcm }),  // voiced clip started at t0 (AudioContext), dur seconds, pcm Uint8Array|base64
  khiGiongMay(lineId, su, charIndex), // browser voice: su = 'bat-dau' | 'ranh-gioi' | 'xong'
  khiXongDong(lineId),                // the line finished playing
  // --- quiz waiting
  vaoCho(beat), raCho(),
  khiTraLoi(exId, dung),              // an answer was graded
  datDemTiep(ms | null),              // show the auto-continue countdown in the rail (null = waiting for speech)
  // --- queries
  dangGiang() -> boolean,             // che !== 'tat'
  dangCho() -> boolean,               // che === 'cho'
  trangThai() -> { che, epoch, nhip: beat.index, kind, cues: [...summary], luot: n },
  // --- for scene modules
  dangKyCanh(kind, { dung(beat, ctx) -> Canh }),
  hu,                                 // motion primitives, §1.8
};
```

Every method is exception-safe: A wraps each in try/catch, logs `console.warn('[motion]', ...)`, and must never throw into app.js.

**`ctx` passed to `batDauNhip`** (built by D):
```js
{ i: stepIndex, n: currentLectureSteps.length,
  chuong: { ten: CHAPTER_LABEL[beat.chapter], i: posInChapter1Based, n: countInChapter },
  bai: lesson, capDo: lvl, isResume, laBatDau: /* first beat after start/resume */,
  truoc: currentLectureSteps[stepIndex-1] || null, cacNhip: currentLectureSteps }
```

### 1.4 Scene contract (A defines; B and C implement)

A scene module registers one builder per beat kind:
```js
SenseiMotion.dangKyCanh('vocab', { dung(beat, c) { ...; return canh; } });
```

**The `c` object A passes to a builder:**
```js
c = {
  beat, ctx,                         // the ctx from batDauNhip
  canhTruoc,                         // previous Canh object, or null
  giuLai,                            // Element[] handed over by canhTruoc.giu(beat), or null
  giam,                              // prefers-reduced-motion at build time
  kho: 'rong' | 'hep' | 'thap',      // hep: innerWidth <= 640; thap: innerHeight <= 500; else rong
  se: slideEngine,                   // read-only helpers
  hu,                                // primitives (§1.8)
  hen(fn, ms),                       // epoch-bound setTimeout
  donVi(text) -> number,             // unit weight (§1.5.3)
  r() -> number,                     // current seconds-per-unit estimate
  chiVao(el),                        // guarded SenseiAvatar.chiVao(el); at most once per 4 s
  ghiChu(text, kieu),                // push a chip into the notes rail
  idSt: (id) => 'st-' + id,
}
```

The read-only `se` helpers are `ghepTokenCau`, `rtCua`, `rubyCau`, `escapeHtml`, `camXucAttr`, `tokenRole`, `artFor`. **Always pass tokens mapped to `{...t, id: t.id ? 'st-' + t.id : ''}`.** Otherwise `ghepTokenCau` writes grid ids onto punctuation tokens and creates duplicates.

**The `Canh` object a builder returns:**
```js
canh = {
  el,                     // root: <div class="sk-canh sk-canh-<kind>">, not yet attached (A attaches it)
  cues: [Cue, ...],       // declarative cue list (§1.6)
  sr: 'Từ vựng 7/30: 私 — tôi',   // one-line text for the aria-live region (announced once)
  heroEl,                 // main element: carry-in target, and the default cat pointing target
  vao(tuCanh) -> ms,      // optional custom entrance (carry); return its duration. Absent → A's transition table
  giu(beatTiep) -> Element[] | null,   // optional: elements to keep and carry into the next scene
  congCu(name, args) -> result | null, // optional scene-level tool handling
  xong(),                 // optional: called once after all cues have fired (settle / final frame)
  cho: null | { loai: 'quiz', exId, cardId },                 // quiz only
  vaoCho(onXong), raCho(),                                     // quiz hand-off hooks (C)
  khiDongThoai, khiClip, khiGiongMay, khiXongDong, khiTraLoi,  // optional forwarders
  huy(),                  // teardown: timers, observers
}
```

Builders must not attach nodes to the document, read layout, or start animations. A attaches `el`, runs the fit pass (§1.7.4), then calls `vao` or the generic transition.

**Scene ids.** A node that tools may target carries `id="st-<gridId>"`. That covers the vocab and kanji hero, the example root and its tokens, dialogue bubbles and their tokens, and the quiz block. Clones created for motion carry no id and `aria-hidden="true"`. Any node that copies an item with an `emotion` must also copy `se.camXucAttr(item)`. The cat's emotion logic reads `closest('[data-emotion]')` from the element that `resolveElement` returns.

### 1.5 Timing source

#### 1.5.1 Clock

```js
dongHo() = (window.SenseiKhauHinh && typeof SenseiKhauHinh.bayGio === 'function')
  ? SenseiKhauHinh.bayGio(audioEngine.outCtx)
  : ownBayGio(audioEngine.outCtx);
```

`ownBayGio` is the same logic as khau-hinh.js `bayGio` (~L583):
1. Use `getOutputTimestamp()` as `contextTime + (performance.now() − performanceTime)/1000`.
2. Accept it only if it lies in `[currentTime − 0.5, currentTime + 0.01]`.
3. Otherwise use `currentTime − (outputLatency || 0) − (baseLatency || 0)`.

If `outCtx` is null or not `'running'`, the beat runs in **wall mode**: times are `performance.now()/1000` and audio positions map one-to-one from the first-receipt wall time.

#### 1.5.2 Per-turn timeline (A)

A **turn** (`luot`) starts at `khiGuiLuot()` while `che ∈ {giang, chuyen}`. The first `khiGuiLuot` after `batDauNhip` belongs to the new beat. It is ignored in `tat` and `cho`.

Each turn keeps:
- **Chunk table** `[{t0, t1, a0, a1}]`, where `a` is cumulative audio seconds received in this turn. It is appended by `khiCoAmThanh`.
- **Envelope.** 20 ms RMS frames in dBFS, decoded from the chunk's base64 (Int16 LE). Stored as `{t0, db: Float32Array}` per chunk.
- **Fragments** `[{u1, A, qEnd, perf}]`:
  - `u1`: cumulative units at the end of the fragment;
  - `A`: audio seconds received when it arrived;
  - `qEnd`: the value passed to `khiCoLoi`.
- `T_first`: `t0` of the first chunk. `T_end`: set by `khiLuotXong`.
- The turn's slice of the beat transcript (§1.6.1).

**Stale data rule.**
- Chunks and fragments received in the first 500 ms after `khiGuiLuot` are *provisional*.
- `khiTuNgat()` inside that window discards them.
- At the 500 ms mark they are committed and any pending cues resolve.

This is the same rule as `apMatChoNoi` (app.js 782).

**Flushes.** `khiXaHang()` marks a flush. The next chunk starts a new segment, but `a` keeps accumulating, and the chunk table absorbs the gap exactly.

**Dropped audio.** `khiMatAmThanh` adds the chunk's duration to `a` and switches the turn to wall mode for positions from that point on.

#### 1.5.3 Units

Units are counted on the raw transcript characters. `u(i)` is the prefix sum within the turn.

| Character | Weight |
|---|---|
| Hiragana or katakana (after NFKC) | 1 |
| Small kana ゃゅょぁぃぅぇぉゎ (and katakana small) | 0 |
| ー, っ | 1 |
| Kanji (U+4E00–9FFF, 々) | 1.7 |
| Latin letter that starts a word (previous char not a letter) | 1.3 |
| Other letters | 0 |
| Digit | 1 |
| Punctuation, whitespace | 0; marks a phrase boundary |

#### 1.5.4 Text position → AudioContext time

**Parameters.**
- `L`: how far the transcript trails the received audio, in seconds. Default 0; clamped to ±1.5.
- `r`: seconds per unit. Default 0.15.
- Both are learned (§1.5.6).

**Audio position of unit `u`** (a match at raw offset `i` has `u = u(i)` and fell in fragment k):
```
anchors: (U_{k-1}, A_{k-1} − L) and (U_k, A_k − L)       // (0, 0) for k = 0
a(u)   = linear interpolation between the anchors; clamp to [0, ∞); monotone non-decreasing
```

**Audio position → time `T(a)`:**
- If a chunk has `a0 ≤ a < a1`: `T = t0 + (a − a0)`.
- If `a ≥ A_now`: `T = lastChunk.t1 + (a − A_now)` (the audio will be appended to the queue).
- If there are no chunks yet: pending. Resolve on the next chunk.

**Pause snap.** Apply only when the key starts a phrase: the raw character before the match is punctuation or whitespace, the start of the turn, or a JP↔Latin script switch.
1. Silence frames are `db < max(−50, p90(turn) − 28)`.
2. Find silence runs of at least 120 ms whose end lies in `[T − 0.35, T + 0.25]`.
3. Set `T` to the end of the nearest run (the voice onset).

#### 1.5.5 Tool calls and first audio

- **Tool time.** `T = max(dongHo(), audioEngine.scheduledTime)` at the moment `khiCongCu` runs. The model calls a tool just before it speaks the related words, so the queue end is when those words start.
- **First audio.** `T_first` (exact, ±20 ms).

#### 1.5.6 Learning at `khiLuotXong(tEnd)`

1. `A_total` = total audio of the turn.
2. `s_tail` = trailing silence from the envelope. `A_eff = A_total − s_tail`.
3. `L_i = A_i − A_eff · U_i / U_total`; `L_turn = median(L_i)`. Then `L ← 0.7·L + 0.3·L_turn`.
4. `r_turn = A_eff / U_total`, if `U_total ≥ 20`. Then `r ← 0.7·r + 0.3·r_turn`, clamped to [0.08, 0.3].
5. Persist `{L, r}` in `localStorage['sk.dongBo']`. Wrap every read and write in try/catch; this is a per-viewer convenience only.
6. Re-resolve every matched-but-unfired cue with the new `L`.
7. Apply fallbacks (§1.6.4).

### 1.6 Cue engine (A)

#### 1.6.1 Beat transcript and normalisation

The beat transcript `R` is the raw text of all turns of this beat joined with `'\n'`. Each raw index knows its turn. Two search views are maintained incrementally with index maps back to `R`:
- **JP view.** NFKC; katakana U+30A1–30F6 → hiragana (−0x60); keep only `[\u3040-\u309f\u4e00-\u9fff\u3005ー]`; ぢ→じ, づ→ず.
- **VN/Latin view.** NFKC → lowercase → NFD → strip `\u0300-\u036f` → `đ→d`. Runs of anything else than `[a-z0-9]` become one space.

Keys are normalised the same way.

- **JP keys** match anywhere, unless flagged `rieng:true`: the raw characters on both sides must then be non-JP (for a single-kana particle said on its own, e.g. "trợ từ は").
- **VN keys** must start on a word boundary.
- **Vietnamese content keys** (meanings, explanations) are only accepted if they have ≥ 8 normalised characters and ≥ 2 words: take the first 3 syllables of the text. Lead-in phrases are always allowed:

  | Lead-in list | Normalised phrases |
  |---|---|
  | `NGHIA` | `"nghia la"`, `"co nghia"`, `"dich la"`, `"y la"`, `"tuc la"` |
  | `MEO` | `"meo"`, `"de nho"`, `"cach nho"` |
  | `LUU_Y` | `"luu y"`, `"chu y"`, `"can than"` |
  | `VAN_HOA` | `"van hoa"`, `"nguoi nhat"` |
  | `GOI_Y` | `"goi y"` |

#### 1.6.2 Cue object

```js
{ id: 'V3',
  loai: 'hien' | 'lam' | 'nhan' | 'doc',
  //  hien = content reveal (mandatory)      lam = action, e.g. draw strokes (mandatory)
  //  nhan = emphasis (droppable)            doc = reading sweep / karaoke (droppable)
  khi: { dauTien: true }                              // at T_first
     | { luc: 'vao', ms: 200 }                        // relative to scene entrance (not speech)
     | { khop: { jp: [...], vn: [...] }, lan: 1, rieng: false }   // nth match after the cursor
     | { congCu: 'write_kanji' }                      // tool time (§1.5.5)
     | { sauCue: 'V1', ms: 1800 }                     // fixed offset after another cue fired
     | { cumSau: 'V2' },                              // first phrase boundary after cue V2's matched end
  sau: 'V1',              // optional: cursor and ordering reference
  tiLe: 0.35,             // fallback fraction of [T_first, T_end] (hien / lam only)
  docLap: false,          // true: exempt from content ordering (e.g. kanji strokes)
  khopCuoi: {...},        // optional (doc): a second key whose END sets the sweep duration
  lam(tt) {}              // tt = { T, via, dur }; must be idempotent; the director calls it at most once
}
```

- `via` is one of `'dauTien' | 'khop' | 'congCu' | 'luc' | 'sauCue' | 'cumSau' | 'tiLe' | 'nen'`.
- `dur` is only set for `doc` cues:
  - if `khopCuoi` matched: `T(end of khopCuoi) − T`;
  - else `units(key) × r × 1.2`;
  - clamped to 350–3500 ms.

**Cursor.** A `khop` search starts at the end of the `sau` cue's match, if it matched; otherwise at the beat start. `lan` counts matches from the cursor.

#### 1.6.3 Firing

- A cue fires at `T − LEAD` with `LEAD = 0.12 s`.
- Scheduling:
  1. `setTimeout((T − LEAD − dongHo())·1000 − 30)`.
  2. On wake, if `dongHo() < T − LEAD − 0.02`, re-arm a short timeout.
  - No rAF anywhere.
- **Late matches.** If `T` has already passed when the cue resolves:
  - `hien` / `lam` fire now;
  - `nhan` / `doc` fire now only if `now − T ≤ 0.40 s`, else they are dropped (`via:'bo'`).
- **Content order.** Non-`docLap` `hien` / `lam` cues of a scene fire in array order. When one fires, earlier unfired ones fire first, 120 ms apart.
- **Emphasis channel.** Only one `nhan` is active at a time. A new `nhan` less than 600 ms after the previous one is delayed to the 600 ms mark; if that makes it late by more than 0.40 s, it is dropped.
- **Cost logging.** Each `lam` call is timed with `performance.now()` and logged; the budget is ≤ 8 ms.

#### 1.6.4 Fallbacks

1. **No audio.** If there is still no audio 2.5 s after the beat's first `khiGuiLuot`:
   - the rail shows "Sensei đang chuẩn bị…" with 3 dots (a live state);
   - at 12 s the text becomes "Sensei vẫn đang soạn lời…";
   - both clear at the first chunk;
   - `dauTien` cues fire at the 2.5 s mark anyway.
2. **Before `khiLuotXong`.** An unmatched `hien` / `lam` cue gets a deadline `T_first + (tiLe + 0.15) × PRIOR[kind] × 1.6`, and fires then if still unmatched.

   `PRIOR` seconds (seed values; A logs real durations): vocab 14, kanji 24, grammar-intro 30, example 20, kaiwa-intro 20, kaiwa 18, quiz 16.
3. **At `khiLuotXong(tEnd)`.** Every unfired `hien` / `lam` gets `T = T_first + tiLe × (T_end − T_first)`, capped at `T_end − 0.30`. If that is in the past, they fire in content order, 150 ms apart, within `[now, T_end − 0.30]`. Unmatched `nhan` / `doc` cues are dropped.
4. **Short-turn retry** (app 1437). It is a new turn in the same beat. The scene and its fired cues are kept, and matching continues in the new turn.
5. **Compression** at `khiHetNhip`:
   - any unfired `hien` / `lam` fires immediately with `via:'nen'`, as 200 ms reveals staggered 60 ms, capped at 480 ms total;
   - `canh.xong()` runs after the last one.

#### 1.6.5 Completion guarantee ("không cụt"), measurable

- Every `hien` / `lam` cue has a non-null `firedAt` before the scene's exit starts.
- The scene's exit starts no earlier than the next `batDauNhip`, or the chapter or finish card at gap + 500 ms.
- In normal runs, `via:'nen'` stays at or below 5% of mandatory cues. Normally everything has fired by `T_end − 0.3`, which is 650 ms or more before the beat-done pass, because `onPlayStateChange` is debounced 350 ms after the true audio end.

#### 1.6.6 Invalidation

Cues and timers die when:
- `epoch` changes;
- the scene changes;
- `tamDung` or `dung` is called.

They survive `khiXaHang` inside a beat, and the retry turn.

### 1.7 Stage DOM and layout contract (A)

#### 1.7.1 Structure

```html
<section id="sanKhauGiang" class="deck-canvas san-khau-giang" role="region"
         aria-label="Bài giảng đang chạy" hidden data-che="tat">
  <div class="sk-khung">
    <header class="sk-rail">
      <span class="sk-nhan-nhip"></span>                  <!-- beat.label, e.g. "Từ vựng 7/30" -->
      <span class="sk-trang-thai" aria-live="polite"></span>  <!-- "Sensei đang chuẩn bị…" / "Đến lượt bạn…" -->
      <span class="sk-cham"></span>                       <!-- quiz dots (quiz chapter only) -->
      <span class="sk-nut"></span>                        <!-- cho: [Bỏ qua] / [Tiếp tục ▸] + countdown hairline -->
      <i class="sk-tien-do"></i>                          <!-- 2px hairline, scaleX(i/n) of chapter -->
    </header>
    <div class="sk-san"><!-- .sk-canh layers, absolutely stacked --></div>
    <aside class="sk-ghi"><!-- ≤2 note chips --></aside>
  </div>
  <div class="sk-lop-bay" aria-hidden="true"></div>       <!-- fly clones -->
  <p class="sk-sr" aria-live="polite"></p>                  <!-- visually hidden, one text per beat -->
</section>
```

**Core CSS rules (A, in css/motion.css; everything scoped to `.san-khau-giang` or `body.dang-giang`):**
```css
.san-khau-giang { position:absolute; inset:0; z-index:2; overflow:clip; }   /* inherits .deck-canvas padding/max-width/margin */
.san-khau-giang[hidden] { display:none !important; }   /* .deck-canvas sets display:flex, which beats [hidden] */
body.dang-giang #slideContent { visibility:hidden; }    /* JS also sets inert */
body.dang-giang.sk-cho #slideContent { visibility:visible; }
body.dang-giang .deck-canvas > #deckBusy { visibility:hidden; }
.sk-khung { display:grid; grid-template-rows: auto 1fr auto; height:100%; max-width:880px; margin-inline:auto; width:100%; }
.sk-an { opacity:0; }                                   /* laid out, not yet revealed */
```

`overflow:clip` means `scrollIntoView` from the board or cat on stage nodes can never scroll the stage.

**Stacking.** Stage z 2 is above the grid canvas (z 1) and below the cat (3), `#highlightNotice` (4), `#errorDock` (5), the bars (30), the board overlay (35) and the docks.

**Rail.**
- 28 px tall (20 px when `thap`).
- Shows `beat.label` in 13px/600 muted.
- The hairline animates `scaleX` over 300 ms with `--ease-out`.

**Notes rail `.sk-ghi`.**
- Reserved height: 2 chips × 30 px.
- Width `calc(100% - var(--sensei-rong, 0px) - 8px)` below 1000 px, so it stays clear of the cat's corner.
- A new chip fades in over 220 ms; the oldest chip beyond 2 fades out over 160 ms.

#### 1.7.2 Grid underneath

When the stage turns on:
1. Add `body.dang-giang`.
2. Set `#slideContent.inert = true`.

The grid keeps its layout (visibility, not display), so:
- `focusItem`'s `scrollIntoView` still parks the current card in view;
- PAUSED reveals it with no reflow;
- the quiz hand-off can measure the real card.

Put `inert` on `#slideContent`, not `.deck-stage`: `sauPicker` (app 4656) clears the latter.

**Tab switches under the stage.** `setTab` / `renderGrammar` re-renders under the stage stay invisible. Their `.slide-fade-enter` animations finish while hidden.

#### 1.7.3 Id redirect

D adds this at the top of `SlideEngine.resolveElement` (slide-engine 1249):
```js
if (targetId && document.body.classList.contains('dang-giang')) {
  const st = document.getElementById('st-' + targetId);
  if (st) return st;
}
```

This one lookup covers:
- board `timPhanTu` (board 67), so `draw_on_board` lands on stage nodes;
- the cat's `timPhanTu` (cat 614), which delegates to `resolveElement`;
- `focusItem`'s cat pointing (`elMuc`, slide-engine 1379).

`applyFocusStyle` still uses `getElementById` (1445), so the grid card keeps its `reading-focus` ring for PAUSED.

#### 1.7.4 Fit pass

After attaching a scene, A compares `canh.el.scrollHeight` with `.sk-san.clientHeight`. If the content is taller:
1. Set `--sk-co: .85` on the scene root.
2. If still taller, set `--sk-co: .72` and add `.is-gon-2`, which hides elements marked `.sk-phu-bo` (optional extras such as romaji or the third compound's meaning).

B and C write all major sizes as `calc(var(--sk-co,1) * Npx)`. This is the only layout read before the entrance.

A re-runs the fit on stage resize (ResizeObserver, debounced 150 ms). It also re-runs when the learner toggles the board, which is allowed during the lecture. There is no animation on resize.

### 1.8 Motion primitives `SenseiMotion.hu` (A)

All primitives set the final state first (class or style), then play `el.animate(keyframes, {duration, easing, fill:'backwards', delay})`. Under reduced motion they skip the animation or use the replacement in §1.12. They return the duration in ms.

A registers every Animation it creates, so `tamDung` can call `finish()` on all of them.

**Tokens** on `.san-khau-giang`:
```css
--sk-e-out: cubic-bezier(.22,1,.36,1);
--sk-e-in: cubic-bezier(.4,0,1,1);
--sk-e-io: cubic-bezier(.65,0,.35,1);
--sk-e-spring: cubic-bezier(.34,1.4,.5,1);
```

| Primitive | Effect | Duration / easing |
|---|---|---|
| `hu.vao(els, {kieu:'len'\|'ben'\|'mo'})` | Scene frame enters. `len`: `translate 0 8px` → 0 + fade. `ben`: from `+32px 0`. Stagger 40 ms, at most 3 blocks | 280 ms out |
| `hu.hien(el, {tre})` | Remove `.sk-an`, add `.is-hien`; `translate 0 6px` + fade | 220 ms out |
| `hu.nhan(el, {lon})` | Relax the previous emphasis to a static tint. Show a 12% accent tint layer (pseudo-element opacity) + `scale 1→1.06→1` (1.03 if `lon`), once | 360 ms spring |
| `hu.quet(el, ms, {mo})` | 3px accent bar under `el` (child `.sk-vach`), `scaleX 0→1` from the left, linear; `mo`: bar at 60% opacity (second reading) | `ms` (350–3500) |
| `hu.karaoke(tokEls, times[])` | At each time, token k gets `.is-doc`: ink .55→1 over 120 ms + its own `.sk-vach` `scaleX` over its span | per token |
| `hu.chip(anchorEl, text, {ben:'tren'\|'duoi'})` | Creates `.sk-chip` positioned absolutely relative to the anchor's offsetParent; `scale .9→1` + fade | 260 ms spring |
| `hu.bay(srcEls, dichEls, {buoc:90})` | FLIP. Measure all rects first, then write: set the destination text immediately; add clones (no id) in `.sk-lop-bay` at the source rects; animate `translate`/`scale` to the destination rects; remove clones at the end by timer | 420 ms out, 90 ms stagger |
| `hu.doi(oldEl, newEl)` | Swap: old `translate 0 -40%` + fade (160 ms in); new from `0 40%` (220 ms out); the stem never moves | 380 ms |
| `hu.mo(els, on)` | Dim to opacity .45, or back to 1 | 200 ms |
| `hu.truot(outEl, inEl)` | Content shift: out `-12px 0` + fade 180 ms in; in from `+12px 0`, 240 ms out; 60 ms overlap | 360 ms |
| `hu.mang(el, fromRect)` | Carry: FLIP from `fromRect` to the current rect (translate + uniform scale) | 520 ms io (420 ms for start/resume carry-in) |
| `hu.ra(el)` | Scene exit: fade (and 8 px drop for `len` scenes) | 200 ms in |
| `hu.ve(svgEl, ms)` | Illustration draw-on: if the SVG has ≤ 12 `path|line|polyline|circle`, set `pathLength=1`, `stroke-dasharray:1`, animate `stroke-dashoffset 1→0` + fill-opacity; else a fade | 600 ms total |
| `hu.nhay(el)` | One nudge using the existing `nudge` keyframe style, 2 iterations | 2×300 ms |

Performance rules:
- Measure-then-write in one frame for every FLIP.
- `will-change` only while an animation runs (added and removed by the primitive).
- `.sk-canh { contain: layout paint; }`.
- At most 12 concurrently running animations; queue beyond that.

### 1.9 Scene-to-scene transitions (A generic; B/C special)

A runs a transition inside `batDauNhip`, after building and fitting the new scene:

| From → to | Transition | Owner |
|---|---|---|
| Stage off → any (start or resume) | If `beat.targetId`'s grid card has a non-zero rect: the new `heroEl` carries in from that rect (`hu.mang`, 420 ms) while the rest fades in (200 ms). Otherwise the stage fades in over 200 ms. The grid is hidden from the first frame | A |
| Same kind (vocab→vocab, kanji→kanji, quiz→quiz, kaiwa→kaiwa) | `hu.truot(old, new)` (360 ms); the rail hairline advances | A |
| grammar-intro → its first example | **Shared element.** The formula row (from `giu`) carries from hero size to the 18px template row (520 ms). The sentence `vao`s 120 ms later | B |
| example → example (same slide) | Filled slots empty (150 ms fade of the fill); sentence `truot` | B |
| example → next grammar-intro | The template row does `hu.ra` (upwards); the new title and formula `vao` | B/A |
| kaiwa-intro → kaiwa-run | Cast portraits carry to the thread avatars (520 ms); story tiles fade | C |
| kaiwa-run → kaiwa (line 1) | The thread collapses: bubble 1 carries to hero size; the others fade | C |
| Chapter change | Chapter card (§3.9) during the gap, then the card label carries into the rail (520 ms) while the first scene `vao`s | A |
| Any other | Old `hu.ra` (200 ms); new `vao` starts 120 ms later (overlap, never a blank frame) | A |

Also:
- The old scene is removed after its exit animation (timer), then `canh.huy()` runs.
- A calls `SenseiBoard.xoaHetGhiChu()` at every `batDauNhip`, so board circles never float over the next scene.
- After any `bay` / `mang` / `truot` completes (timer), A calls `SenseiBoard.veLaiTatCa()` if `SenseiBoard.ghiChu.length`.

### 1.10 Pause, resume and idle

**`tamDung()` and `dung()`** (also used by `dongBo(state≠PLAYING)`):
1. `epoch++`; cancel all timers and cues; `finish()` every registered animation.
2. **In the same frame:**
   - remove `body.dang-giang` and `body.sk-cho`;
   - set `#slideContent.inert = false`;
   - undo waiting-mode inert/dim on grid siblings;
   - the grid is visible with **no entrance animation**.
3. The stage fades out over 160 ms (instant under reduced motion), then gets `hidden` and `data-che="tat"`. It has `pointer-events:none` from the first frame.
4. Remove `.reading-badge-indicator` elements inside `#slideContent`. The "Đang đọc…" badge has an `animate-pulse` icon, which would be motion in PAUSED. Keep the static `reading-focus` ring.
5. `SenseiBoard.xoaHetGhiChu()`.
6. `dung()` also resets the scene cache, carry candidates and quiz dots.

After this, nothing in `#slideContent` or the stage moves on its own. Raise-hand, tab clicks, prev/next, typed chat, barge-in, `onClose` and `openLesson` all go through `pauseLecture` or IDLE, so they all land here.

**`tiepTuc()`** only marks `laBatDau` for the next `batDauNhip`. The beat restarts from scratch, which is what `resumeLecture` already does, and the scene rebuilds from its first cue.

### 1.11 Interaction lock rules

| State (app) | `che` | `#slideContent` | Stage | Footer, chat dock, board toggle, picker |
|---|---|---|---|---|
| IDLE | `tat` | Visible, fully interactive | Hidden | Live |
| PLAYING, Sensei teaching or in the gap | `giang`/`chuyen` | `inert`, visibility hidden (in the gap right after a quiz `cho`: visible but inert until the next scene) | Visible; no interactive children. A `pointerdown` on the stage shows a rail hint "Đang giảng — bấm Tạm dừng để thao tác" for 2.5 s, once per 30 s | Live (pause, raise hand, tabs, prev/next, chat all pause the lecture as today) |
| PLAYING, quiz waiting | `cho` | Visible; only `card-<exId>` and its ancestor chain are live. Every sibling along that chain is `inert` + `.sk-mo-di` (opacity .45). Quiz buttons and the explanation speaker button work | Only the rail is visible; the stage root is `pointer-events:none`, the rail `pointer-events:auto`. Keys A–D / 1–4 click `#btn-opt-<exId>-<i>` (ignored when focus is in input/textarea/select or a modifier is held) | Live |
| PAUSED (any cause, incl. raise-hand) | `tat` | Visible, fully interactive, static | Hidden | Live |

**Inert chain (A):**
```js
let n = card;
while (n && n !== slideContent) {
  for (const s of n.parentElement.children)
    if (s !== n && !s.inert) { s.inert = true; s.classList.add('sk-mo-di'); khoa.push(s); }
  n = n.parentElement;
}
```
Restore from `khoa` on `raCho`, `tamDung` and `dung`.

**Beats that unlock controls:** only `quiz` beats whose card is not answered yet, and only from the beat-done pass (Sensei has finished reading) until `raCho`.

Pronunciation (`#qz-phat-am`) and handwriting (`#qz-viet-tay`) are reachable only in IDLE and PAUSED. In `cho` they are inert siblings.

### 1.12 Reduced motion

`giam = matchMedia('(prefers-reduced-motion: reduce)').matches` is read at each `batDauNhip`; a `change` listener updates it. The global CSS override (styles 880) does not affect WAAPI, so every primitive checks `giam` itself.

**Cue timing is unchanged.** Pacing the information is the teaching; only movement is removed.

| Primitive | Reduced replacement |
|---|---|
| `vao`, `hien`, `truot`, `ra`, `mang`, carry-in | 120 ms opacity only (no translate/scale) |
| `nhan` | Tint only, no scale |
| `quet`, `karaoke` | Static underline that steps from token to token at the same times; no sweep |
| `chip` | Instant |
| `bay` | Slots fill in place instantly + tint; the sentence does not dim |
| `doi` | Instant ending change, highlighted in accent |
| Kanji strokes | `vietChuHan(ch, {noi, tocDo: 0.01})`: full glyph with all stroke numbers at once |
| Illustration `ve` | Instant |
| Quiz feedback | No burst, no shake; static ✓, strike line and tints |
| Quiz hand-off | Instant cross-over |
| Chapter card | Text only, no carry; it simply replaces the rail text |

### 1.13 Mobile and small screens

The content box comes from `.deck-canvas` padding plus the cat lane (`kichThuoc()`, cat 100). Approximate values:

| Viewport | Content box | Kind of layout |
|---|---|---|
| 1440×900 | ≈1010×730 (cat lane ≈142 px) | `rong` |
| 1280×720 | ≈980×550 | `rong` |
| 1024×768 | ≈760×600 | `rong` |
| 390×844 | ≈358×620 (no lane; cat ≈150 px tall, shows ≈70–100 px above the bar) | `hep` |
| 360×740 | ≈328×520 | `hep` |
| 844×390 | ≈720×250 (landscape lane) | `thap` |

**`hep`** (width ≤ 640):
- Stage `padding-bottom: calc(var(--sensei-cao, 40px) + 36px)`. The 36 px covers the cat's `noiLen` rise (≈29 px) while it talks.
- Hero content left-aligned.
- The notes rail avoids the bottom-right corner (§1.7.1).

**`thap`** (height ≤ 500):
- Two columns: hero 55% on the left, support 45% on the right.
- Rail 20 px.
- Chapter card on one line.

Per-kind sizes are in each scene's table in §3. All major sizes are multiplied by `--sk-co` (§1.7.4). No horizontal scroll at any listed viewport.

### 1.14 Diagnostics `window.__motion` (A)

```js
__motion.nhatKy()      // [{nhip, kind, id, loai, via, T, firedCtx, firedPerf, luot, viTri, msLam}]
__motion.cues()        // cues of the current scene with state
__motion.trangThai()   // same as SenseiMotion.trangThai()
__motion.luotHienTai() // current turn id (the mock tags its turns with it)
__motion.datThamSo({L, r, LEAD})    // tests only
__motion.xoaNhatKy()
```

`viTri` is the raw offset of the match start inside that turn's transcript. It is null for non-match cues.

---

## 2. Integration points (owner D)

### 2.0 Helper (app.js, inside the closure, near the audio engine setup)

```js
const SK = () => (window.SenseiMotion && window.SenseiMotion.bat ? window.SenseiMotion : null);
```

Every call below is `SK()?.method(...)`. None may throw or change behaviour when `SK()` is null.

### 2.1 js/app.js

| # | Where | Change |
|---|---|---|
| 1 | After `window.__lecture` (1395), once | `SK()?.init({ audioEngine, slideEngine, khiTiepTuc: tiepSauCho, khiBoQua: tiepSauCho });` |
| 2 | `onAudioData` (435) | Replace `audioEngine.playPCM24k(b64)` with the chunk-timing wrapper below |
| 3 | `onTranscript` (417), right after the `boQuaLuotHuy` gate | `SK()?.khiCoLoi(chunk, audioEngine.scheduledTime || 0);` |
| 4 | `onTurnComplete` (448), first line | `SK()?.khiLuotXong(audioEngine.scheduledTime || 0);` |
| 5 | `onBeforeUserMessage` (283), after `setSuppressed(false)` | `SK()?.khiGuiLuot();` |
| 6 | `onSelfInterrupt` (414) | Add `SK()?.khiTuNgat();` |
| 7 | `onPlayStateChange` (231), in the `meta && meta.manual` branch | `SK()?.khiXaHang();` |
| 8 | `handleToolCall` (821), right after the `boQuaLuotHuy` gate | `const skr = SK()?.dangGiang() ? SK().khiCongCu(name, args \|\| {}) : null; if (skr) return skr;` |
| 9 | `buildBeatPrompt` grammar-intro (1165–1170) | `const im = !!SK()?.dangGiang();` and pass `{ im }` as the 3rd argument of the three `vietBang` calls. Keep `xoaBang()` |
| 10 | `executeLectureStep` (1255), after the tab switch block (1291–1296), before `lastToolFocusAt = Date.now()` (1301) | `SK()?.batDauNhip(beat, {...ctx §1.3})`. Compute `chuong.i/n` from `currentLectureSteps.filter(b => b.chapter === beat.chapter)`. `laBatDau` = true when called from `startLecture` / `resumeLecture` (a module flag `batDauMoi` set there and cleared here) |
| 11 | `executeLectureStep` kaiwa branch (1336–1344) | `SK()?.khiDongThoai(beat.data, 0)` before `playDialogueLine`; `SK()?.khiXongDong(beat.data.id)` in the `.then` before the 300 ms wait |
| 12 | `playWholeDialogue` (2975) loop | `SK()?.khiDongThoai(line, i)` before `playDialogueLine(line)`; `SK()?.khiXongDong(line.id)` after it resolves (use `dialogue.forEach`-style index `i`) |
| 13 | `playDialogueLine` (3915) | Clip path wrapper below |
| 14 | `playLineWithBrowserVoice` (3930) | `u.onstart = () => SK()?.khiGiongMay(line.id,'bat-dau'); u.onboundary = (e) => SK()?.khiGiongMay(line.id,'ranh-gioi', e.charIndex);` and in `finish` → `SK()?.khiGiongMay(line.id,'xong')` |
| 15 | `checkAutoLectureStepComplete` (1421) | After the `clientOnly` check: `if (choHocVien) return;`. After the short-turn retry block: `if (SK() && cur && cur.kind === 'quiz' && !daTraLoiQuiz(cur)) { vaoChoHocVien(cur); return; }`. Replace `if (currentLectureStepIndex >= len − 1) { finishLecture(); return; }` with `scheduleAutoNextStep(); return;` (the end is handled there) |
| 16 | `scheduleAutoNextStep` (1489) | Last-beat branch: if `SK()`, then `SK().khiHetNhip({ tiep: null, gapMs: 2400, tongKet: demTongKet() })` and `autoStepTransitionTimer = setTimeout(() => { autoStepTransitionTimer = null; if (lectureState === 'PLAYING') finishLecture(); }, 2400); return;`. Without `SK()`, keep `finishLecture()`. Normal branch: after computing `gap`, `SK()?.khiHetNhip({ tiep: next, gapMs: gap, cacNhipChuongTiep: next.isChapterStart ? currentLectureSteps.filter(b => b.chapter === next.chapter) : null })` |
| 17 | `pauseLecture` (1553) | Before `lectureState = 'PAUSED'`: `if (choHocVien) { clearTimeout(choHocVien.hen); choHocVien = null; } SK()?.tamDung();` |
| 18 | `resumeLecture` (1583) | After computing `stepIdx`: `if (SK()) while (stepIdx < currentLectureSteps.length && currentLectureSteps[stepIdx].kind === 'quiz' && daTraLoiQuiz(currentLectureSteps[stepIdx])) stepIdx++;` then `if (stepIdx >= length) { finishLecture(); return; }` (change `const` to `let`). Call `SK()?.tiepTuc();` and set `batDauMoi = true` before `executeLectureStep` |
| 19 | `startLecture` (1523) | `batDauMoi = true` before `executeLectureStep(startIdx)` |
| 20 | `finishLecture` (1411) | `SK()?.dung();` after `lectureState = 'IDLE'`. Then, if the quiz tab is active, `document.querySelector('#slideContent [data-qz-toi="qz-phat-am"]')?.click()` (hand-off to practice, §3.10) |
| 21 | `updateLectureControlsUI` (936), first line | `SK()?.dongBo(lectureState, { isRaisingHand });` |
| 22 | `senseiNoiNgoaiBai` (1993) | Signature `(loiNhac, hanGiay = 30, opts = {})`; `if (lectureState === 'PLAYING' && !opts.giuGiang) pauseLecture(false);` |
| 23 | `ketThucChenNgang` (1983) | Append `if (choHocVien && choHocVien.daTraLoi) henTiepSauTraLoi(2500);` |
| 24 | `handleSelectOption` (2156) | See the waiting-state block below |
| 25 | `window.__lecture` (1395) | Add `beats: () => currentLectureSteps`, `index: () => currentLectureStepIndex`, and when `/[?&]moPhong\b/i.test(location.search)`: `datGiongThoai: (id, pcm) => { dialogueAudio[id] = pcm; }` |

**Chunk-timing wrapper (#2).** It depends only on `scheduledTime` and the public `leftoverBytes`; it must not change `playPCM24k` behaviour.
```js
onAudioData: (b64) => {
  anChoTraLoi();
  if (matChoNoi && !audioEngine.suppressed) apMatChoNoi();
  const sk = SK();
  if (!sk) { audioEngine.playPCM24k(b64); return; }
  const truoc = audioEngine.scheduledTime;
  const du = audioEngine.leftoverBytes ? audioEngine.leftoverBytes.length : 0;
  const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  const bytes = Math.floor(b64.length * 3 / 4) - pad;
  audioEngine.playPCM24k(b64);
  const sau = audioEngine.scheduledTime;
  if (sau !== truoc) sk.khiCoAmThanh(b64, sau - Math.floor((du + bytes) / 2) / 24000, sau);
  else if (bytes > 1) sk.khiMatAmThanh(b64, audioEngine.suppressed ? 'chan' : audioEngine.clipPlaying ? 'clip' : 'khoa');
},
```

**Clip wrapper (#13):**
```js
if (clip && audioEngine.playPcmClip) {
  try {
    const p = audioEngine.playPcmClip(clip);             // starts synchronously (src.start())
    const ctx = audioEngine.outCtx;
    const n = clip instanceof Uint8Array ? clip.length
      : Math.floor(String(clip).length * 3 / 4) - (String(clip).endsWith('==') ? 2 : String(clip).endsWith('=') ? 1 : 0);
    SK()?.khiClip(line.id, { t0: ctx ? ctx.currentTime : 0, dur: Math.floor(n / 2) / 24000, pcm: clip });
    await p; return true;
  } catch (e) {}
}
```

**Waiting state** (new, next to `checkAutoLectureStepComplete`):
```js
let choHocVien = null;   // { ma, exId, since, daTraLoi, soChu, hen }
const daTraLoiQuiz = (b) => !!(b && b.data && b.data.id &&
  document.querySelector(`[id^="btn-opt-${CSS.escape(b.data.id)}-"].opt-locked`));
function vaoChoHocVien(b) {
  choHocVien = { ma: maNhip, exId: b.data.id, since: Date.now(), daTraLoi: false, soChu: 0, hen: null };
  const card = document.getElementById('card-' + b.data.id);
  // D adds a 4th param `tucThi` to cuonTrongBaiTap (2137) that forces behavior 'auto': the FLIP measures right after
  if (card) try { cuonTrongBaiTap(card, card, true, true); } catch (e) {}
  SK()?.vaoCho(b);
}
function henTiepSauTraLoi(msCoDinh) {
  if (!choHocVien || !choHocVien.daTraLoi) return;
  clearTimeout(choHocVien.hen);
  if (senseiChenNgang) { SK()?.datDemTiep(null); return; }      // wait for the grading speech (#23 calls back)
  const ms = msCoDinh || Math.max(2500, Math.min(8000, 40 * (choHocVien.soChu || 0)));
  SK()?.datDemTiep(ms);
  choHocVien.hen = setTimeout(tiepSauCho, ms);
}
function tiepSauCho() {
  if (!choHocVien) return;
  clearTimeout(choHocVien.hen); choHocVien = null;
  SK()?.raCho();
  if (lectureState === 'PLAYING') scheduleAutoNextStep();
}
```

Inside `handleSelectOption`:
- **After the correct/wrong class block:**
  ```js
  SK()?.khiTraLoi(exerciseId, isCorrect);
  if (choHocVien && choHocVien.exId === exerciseId) choHocVien.daTraLoi = true;
  ```
- **After the explain box's final `innerHTML` is set:**
  ```js
  if (choHocVien && choHocVien.exId === exerciseId) {
    choHocVien.soChu = (aiResult.roast || '').length + (aiResult.tip || '').length;
    henTiepSauTraLoi();
  }
  ```
- **Wrong branch:** `senseiNoiNgoaiBai(prompt, 30, { giuGiang: !!(choHocVien && choHocVien.exId === exerciseId) })`.

`generateQuizRoast` is awaited before the explain box is final. If the answer came from a waiting state that was cancelled meanwhile (pause), `choHocVien` is null and nothing continues automatically.

**`demTongKet()`** returns counts from `currentLectureSteps`:
```js
{ tu: vocab, chu: kanji, mau: grammar-intro, cau: example, thoai: kaiwa, bt: quiz }
```
Quiz right/wrong counts come from the director's own `khiTraLoi` log.

### 2.2 js/slide-engine.js

1. `resolveElement` (1249): the redirect in §1.7.3.
2. `boQuaTheTrai` (1431), first line: `if (document.body.classList.contains('dang-giang')) return true;`
3. `tuKhoanhNguPhap` (1399), first line: `if (document.body.classList.contains('dang-giang')) return;`

The stage's own emphasis replaces the auto-circles.

Nothing else changes. `initTabEvents` is dead code (memory note); don't touch it.

### 2.3 js/board.js

`vietBang(text, kieu = 'thuong', opts = {})` (475): replace `const b = this.moBang();` with `const b = opts.im ? this._bangAn() : this.moBang();`.

Add `_bangAn()`:
- If `this.bang` exists, return it unchanged, whatever its visibility.
- Otherwise build the panel exactly like `moBang()`, with `khung.classList.add('hidden')` and **without** adding `body.co-bang`.
- Factor the shared construction into `_taoBang()` so `moBang()` keeps its current behaviour.

No other board changes.

### 2.4 js/gemini-live.js

**No change.** No new tool is added. The mock (§4) subclasses the client.

### 2.5 Tool interception (A, `khiCongCu`)

This runs only while `dangGiang()`. `T` is the tool time from §1.5.5. The scene's `canh.congCu(name, args)` is tried first; if it returns non-null, that result is used.

| Tool | Behaviour while `giang` / `chuyen` | Behaviour while `cho` | Return |
|---|---|---|---|
| `write_kanji(character)` | Kanji scene with the same character: fire its `congCu` cue at `T`. Otherwise draw an 88 px tile via `SenseiBoard.vietChuHan(ch, {noi: noteSlot, tocDo:.3})` in the notes rail at `T` | `null` (app handles) | `{success: !!SenseiStrokes.get(ch), wrote: ch}` or `{success:false, error:'chua co du lieu net cua chu ' + ch}` |
| `write_on_board(text, style)` | `SenseiBoard.vietBang(text, style, {im:true})` now (history); a notes-rail chip at `T` | Same, the chip goes into the rail status (1 line, ellipsis) | `{success:true}` |
| `draw_on_board(target_id, kind, to_id)` | At `max(T, settle(target))`, where `settle` is the end of the target's running stage animation, at most 450 ms: `SenseiBoard.veLen(target_id, kind, {toId: to_id})` | `null` | `{success: !!(byId('st-'+id) \|\| byId(id))}` |
| `clear_board` | `SenseiBoard.xoaBang()`; clear the notes rail | `null` | `{success:true}` |
| `highlight_element(target_id, …)` | If `#st-<id>` exists: `hu.nhan` at `T`; else no-op | `null` | `{success:true, highlighted: target_id}` |
| `change_section`, `open_exercise` | No-op (the hidden grid must not drift from the beat) | `null` | `{success:true, ghiChu:'màn hình tự chuyển theo giáo án'}` |
| `change_slide` | Same lesson: no-op, return `{success:true}`. Other lesson: `null` (app refuses it while PLAYING) | `null` | — |
| `mark_error`, `act_out`, `set_emotion`, `section_complete` | `null` | `null` | — |

---

## 3. Scene catalogue

### 3.0 Common conventions

- Keys are written as `{jp:[...], vn:[...]}` before normalisation.
- `NGHIA`, `MEO`, `LUU_Y`, `VAN_HOA` and `GOI_Y` are the lead-in lists in §1.6.1.
- `vn3(text)` means the first 3 syllables of `text`, used only if the §1.6.1 length rule passes.
- Cues with `hien`/`lam` without an explicit `tiLe` use the values given here.

### 3.1 `vocab` (B)

**Data:** `{word, kanji, furigana, romaji, wordType, meaningVi, accentNote, emotion?, imageUrl?}`.

**Illustration:** `se.artFor(v)` (N5–N3 100%, N2 57%, N1 42%). `imageUrl` is used by 0 of 2097 items; if present, show it as an `<img>` and fade it instead of drawing.

**Layout.** The hero root has `id="st-<v.id>"` + `camXucAttr`.

| | `rong` | `hep` | `thap` |
|---|---|---|---|
| Illustration box (reserved even before reveal) | 200 px (160 at ≤1100 wide), left column | 96 px, right of the headword row | 110 px, left column |
| Headword `ruby` (`.jp-serif` 700, furigana `max(12px,.36em)` muted) | `clamp(56px, 4vw + 12px, 96px)` | 44 px | 44 px |
| Romaji · wordType (VN label as in the grid) | 15 px muted, one line | 13 px | 13 px |
| Meaning | 24 px ink-2 | 18 px | 18 px |
| accentNote (`.deck-note`, ≤2 lines) + morph row | 15 px | 14 px | right column |

With no illustration, the headword block is centred.

**Dictionary-form morph row** (only when `wordType === 'verb'` and `accentNote` matches `/Thể từ điển:\s*([\u3040-\u30ff\u4e00-\u9fff々ー]+)/`; 36 verbs):
- `masu = v.kanji || v.word`, `D = match[1]`, `stem = lcp(masu, D)` (code points; must be ≥ 1 character, else no row).
- Row: `stem | ending(masu)` with a reel slot that will show `ending(D)`, e.g. 遊|びます → 遊|ぶ.
- Labels "thể ます" → "thể từ điển" (12 px muted).

| # | Cue | `loai` | `khi` | Fallback | Effect |
|---|---|---|---|---|---|
| V0 | Frame | — | scene `vao` | — | Headword + romaji line enter (`len`); illustration box, meaning and note are `.sk-an` |
| V1 | 1st reading | `doc` | `khop {jp:[kanji,word,furigana], vn:[romaji]} lan 1` | dropped | `hu.quet(headword, dur)` + `hu.nhan(headword,{lon:true})` |
| V2 | 2nd reading | `doc` | same, `lan 2`, `sau V1` | `{sauCue:'V1', ms:1800}` only if V1 fired via `khop` | `hu.quet(headword, dur, {mo:true})` |
| V3 | Meaning + picture | `hien` | `khop {vn: NGHIA ∪ vn3(meaningVi)}`, `sau V1` | `tiLe .35` | `hu.hien(meaning)`; `hu.ve(svg)` (or fade the img) in the same frame |
| V4 | Tip | `hien` | `khop {vn: MEO ∪ ["trong am","doc bang","luu y"] ∪ vn3(accentNote)}`, `sau V3` | `tiLe .6` | `hu.hien(note)` |
| V5 | Dictionary form (only with the morph row) | `hien` | `khop {jp:[D], vn:["the tu dien"]}`, `sau V1` | `tiLe .7` | `hu.doi(ending masu, ending D)`; labels swap |

The cat is not re-pointed: `focusItem` already points at `st-<id>` through the redirect. Sensei's spoken example sentence is **not** shown as text (the transcript may be kana or wrong). `write_on_board` goes to the notes rail (§2.5).

### 3.2 `kanji` (B)

**Data:** `{character, hanViet, strokeCount, onyomi[], kunyomi[], meaningVi, commonWords[≤3]}`.

**Strokes:** `SenseiStrokes.get(ch)`. Coverage: N5 52/137, N4 14/125, N3 1/100, N2 5/75, N1 3/75.

**Origin:** `SenseiArt.kanji(ch)` → `{svg, note}`, about 12 characters. Components are the bracketed CJK runs in `note`, e.g. `(禾)` and `(厶)` for 私.

**Layout.** The root has `id="st-<k.id>"`.

| | `rong` | `hep` | `thap` |
|---|---|---|---|
| Stroke tile `.sk-kj-o` (`id="st-<k.id>-net"`), 4 guide lines | `min(280px, 40vh)` left | 168 px centred | 150 px left |
| Hán Việt (700, letter-spacing .06em) + " · N nét" muted | 28 px | 22 px | 20 px |
| Meaning | 20 px | 16 px | 15 px |
| On / Kun `dl` (label 12 px muted, value `lang=ja`) | 20 px | 16 px, 2 columns | 15 px |
| Compounds, ≤3 rows: word `lang=ja`, reading muted, meaning | 20 / 13 / 15 px | 16 / 12 / 13 px, as 3 rows | 15 / 12 / 13 px |
| Origin (only if it exists): pictogram 96 px + chips `禾 + 厶 → 私` | under the tile | under the tile, 72 px | hidden (`.sk-phu-bo`) |

**Strokes in the stage:** `SenseiBoard.vietChuHan(ch, { noi: tile, tocDo: clamp(.25, .55, 4.5 / n) })`.

B's CSS in the stage:
- hides `.bang-kanji-chan` and `.bang-kanji-tap` (no tracing while lecturing);
- keeps `.bang-kanji-o-mo .bang-kanji-duong` at opacity .9 and numbers at .45 (the glyph is content; it is not ghosted);
- sizes `.bang-kanji-o` to the tile.

**Without stroke data:** a `.jp-serif` glyph at 72% of the tile on `--paper-deep`.

| # | Cue | `loai` | `khi` | Fallback | Effect |
|---|---|---|---|---|---|
| K0 | Frame | — | `vao` | — | Tile with guides (`scale .96→1`, 360 ms) + Hán Việt + stroke count. With stroke data the glyph shows as a .08 outline; meaning, readings, compounds and origin are `.sk-an` |
| K1 | Strokes | `lam`, `docLap` | `congCu 'write_kanji'` | `khop {jp:[character], vn:["han viet "+hv, "chu "+hv]}` + 400 ms; else `tiLe .12` | Call `vietChuHan` into the tile; the outline fades; `c.chiVao(tile)` once. Without stroke data: glyph ink-in (opacity + `scale .98→1`, 480 ms) at `dauTien` instead |
| K2 | Hán Việt said | `nhan` | `khop {vn:["han viet "+hv, "chu "+hv, "am "+hv, "nghia la "+hv]}` | dropped | `hu.nhan(hvLabel)` |
| K3 | Meaning | `hien` | `khop {vn: NGHIA ∪ vn3(meaningVi)}` | `tiLe .3` | `hu.hien` |
| K4 | Origin (only if present) | `hien` | `khop {jp: components, vn:["chiet tu","cau tao","gom co","ghep tu"]}` | `tiLe .4` | Pictogram `hien`; chips `hien` 250 ms apart; then `→` and the glyph `nhan` |
| K5 | On row | `hien` | `khop {jp: onyomi kana (strip "(…)"), vn: ["am on","onyomi"] ∪ romaji inside "(…)"}` | `tiLe .5` | `hien` + `nhan(value)` |
| K6 | Kun row | `hien` | `khop {jp: kunyomi (strip okurigana dots), vn:["am kun","kunyomi"]}` | `tiLe .6` | `hien` + `nhan(value)` |
| K7.i | Compound i | `hien` | `khop {jp:[cw.word, cw.furigana]}` | `tiLe .68 + .08·i` | Row `hien`; the kanji character inside the word gets `.is-nhan` (accent) |

With empty On or Kun readings, the row shows "—" and its cue is removed.

### 3.3 `grammar-intro` (B)

**Data:** slide `{title, grammarFormula, explanation, teacherTips, culturalNotes, examples[]}`.

**Formula parse** (deterministic; 144 of 409 slides produce a chain):
1. `main = grammarFormula.split(/\s{2,}|\u3000|\(|（| \/ |—|→| vs |=|;/)[0]`. If `main` has no `+`, there is no chain.
2. For each `+` part `p` (index `pi`), scan elements with
   ```
   /(\[[^\]]*\])|(N\d?|V[\-る(（]?[^\s+\u3040-\u30ff\u4e00-\u9fff\[\]]{0,6}|A[いな]?|S\d?)(?![a-zà-ỹ])|([\u3040-\u30ff\u4e00-\u9fff々ー]+)/g
   ```
   - group 1 `[role]`: attach as the caption of the preceding slot if it has none; else a slot `…` with that caption;
   - group 2: a variable slot (label = the match);
   - group 3: a literal chip; consecutive JP runs **within the same part** merge.
3. Require at least one slot and at least one literal.
4. Trailing `↗` in the formula → a rising-arrow glyph after the last chip.

**No chain:** the formula shows as a single pill (`.gp-formula` look, JP 26 px). Each JP run inside the pill is wrapped in a `span.sk-np-jp` so it can be emphasised.

**Morph variant.** Replaces the slot row when any row below exists.

- **(a) Formula chains.** Find chains `J(\s*[(（][^)）]*[)）])?(\s*(→|->|⇒)\s*J(…)?)+` in `grammarFormula`, where `J` = `[\u3040-\u30ff\u4e00-\u9fff々ー〜]+`.
  - Words `w0..wn`, `stem = lcp(all)`.
  - Accept as a **word row** if `stem.length ≥ 1` and every `w ≤ 10` characters.
  - Accept as a **rule row** if `stem` is empty and every `w ≤ 4` characters. The stem then shows as a generic muted "V", e.g. `V|う → V|って`.
  - Measured: 12 slides with word rows, 4 with rule-only rows.
- **(b) Form-teaching slides without chains** (the formula contains `V(て|ない|た|る|辞書形|từ điển|可能|れる|られる|よう|ば|ろ|たら|ている|せる|させる)` or the title contains `thể (て|ない|た|từ điển|khả năng|ý chí|mệnh lệnh|bị động|sai khiến|điều kiện|masu|ます)`; 74 slides):
  1. Scan the slide's examples in order, key tokens first, for a lesson vocab verb `v` with `(v.kanji||v.word)` ending in ます.
  2. `stem = masu minus ます` (≥ 1 character). A token (`kanji || text`) must start with `stem`. If the token equals `stem`, join the next token.
  3. The remainder must be one of: `る て で た だ ない なかった ました ません ましょう られる れる よう ろ ば れば たら ている ています ていた`.
  4. Row forms: `[D (if the accentNote dictionary form exists), masu, found form]`, deduplicated, all sharing `stem`.

  About 25 slides after the ending filter. False positives such as 説明書 and 申し上げます are removed by it.
- **Limit:** 3 rows. The top row is the "demo" row.

**Layout:**

| | `rong` | `hep` | `thap` |
|---|---|---|---|
| Title | 20 px / 600 ink-2 | 16 px | 15 px |
| Formula row: slot min 88×64 dashed 1.5 px `--line-strong`, label 22 px, caption 12 px muted; literal chip `--paper-deep` JP 28 px (は/へ/を/です in `--accent-deep`); `+` 18 px muted; wraps | as described | slot min 56×52, literal 22 px | slot 48×44, literal 20 px |
| Morph rows: `stem` + ending reel + trail of visited endings (12 px muted chips) | 36 px JP | 26 px | 24 px |
| Explanation, split into ≤3 sentences (on `. ! ?` followed by a space) | 17 px, 68ch | 15 px | right column 14 px |
| Tip `.deck-note` "⚠"; culture `.deck-note.is-gold` | 15 px | 14 px | `.sk-phu-bo` |

| # | Cue | `loai` | `khi` | Fallback | Effect |
|---|---|---|---|---|---|
| G0 | Frame | — | `vao` | — | Title + formula frame (separators + empty dashed slots with captions) enter |
| G1 | Literal chips | `hien` | `luc vao +200` | — | Chips drop in L→R (`translate 0 -10px` + fade, 280 ms, 90 ms apart). The formula is already on the board by design, so it is not tied to speech; it gives read-then-listen |
| G2.j | Literal j said | `nhan` | `khop {jp:[lit], rieng: lit.length === 1, vn: READ[lit]}` with `READ = {は:["wa","chu ha"], へ:["e"], を:["o","wo"], です:["desu"]}` | dropped | `hu.nhan(chip)`. First literal only: `c.chiVao(chip)` |
| G2c.j | Particle reading chip (lit ∈ {は,へ,を}) | `hien` | same match as G2.j | `tiLe .25` | `hu.chip(chip, 'đọc: wa'/'đọc: e'/'đọc: o', {ben:'tren'})` |
| G3.j | Slot j said | `nhan` | `khop {vn:[slot label lowercased, e.g. "n1","n 1"] ∪ ({N:["danh tu"],V:["dong tu"],A:["tinh tu"]}[label[0]]||[]) ∪ vn3(caption)}` | dropped | Slot outline + caption brighten (opacity layer) |
| G4.s | Explanation sentence s | `hien` | `khop {vn: vn3(sentence s)}` | `tiLe .15 + .45·s/n` | `hu.hien` |
| G5 | Tip | `hien` | `khop {vn: LUU_Y ∪ MEO ∪ ["sai"] ∪ vn3(tips)}` | `tiLe .7` | `hu.hien` |
| G6 | Culture | `hien` | `khop {vn: VAN_HOA ∪ vn3(culturalNotes)}` | `tiLe .85` | `hu.hien` |
| GM.k | Morph step k of the demo row (k ≥ 1) | `hien` | `khop {jp:[form k, ending k]}`, `sau GM.(k−1)` | `tiLe .2 + .5·k/n` | `hu.doi(ending)`; append the previous ending to the trail. Other rows `hien` their final form at the same time |

`giu(beatTiep)`: if `beatTiep.kind === 'example'` and `beatTiep.subIndex === beat.subIndex` and the slide has a chain, return `[formulaRow]`.

### 3.4 `example` (B), the flagship

**Data:** `{id, tokens[{id, text, kanji?, furigana?, isKeyGrammar}], meaningVi, emotion?}`. Median 6 tokens, max 20; 857 of 867 have a key token.

**Template row:**
- **Carried:** from `giuLai` (FLIP to 18 px, §1.9).
- **Else, if the slide has a chain:** built fresh (static).
- **Else:** none.

**Alignment → ASSEMBLE mode** (≈119 of 867 examples; N5 53/271):
1. Tokens: drop punctuation tokens (`/^[、。，．,.！？!?・…‥」』）)】〉》「『（(【〈《]+$/`).
2. Compare on `norm(text)` or `norm(kanji || text)` (whitespace removed).
3. Walk the formula elements in order. **Consecutive literal chips with no slot between them match as one concatenated literal**, e.g. です+か ⇐ token ですか.
4. A literal must equal the concatenation of 1–4 consecutive tokens starting at the cursor or later. Tokens skipped before it go into the preceding slot; if there is no preceding slot, or that slot would be empty, the alignment fails.
5. Tokens after the last literal go into the last slot if the formula ends with a slot; otherwise they form a tail shown after the template row.
6. Every slot must receive at least one token.
7. Anything else → **DIAGRAM mode.**

The reference case `ex-n5-l1-s1-1` must align as N1←わたし(私), は, N2←マイク・ミラー, です.

**Layout.** The root has `id="st-<ex.id>"` + `camXucAttr`; tokens come from `se.ghepTokenCau(mapped tokens, …)` with `st-` ids and `rubyCau`.

| | `rong` | `hep` | `thap` |
|---|---|---|---|
| Template row (carried formula) | 18 px chips at the top | 15 px, wraps | inline above the sentence, 14 px |
| Sentence `.jp-sentence` | `clamp(28px, 1.6vw + 14px, 40px)` | 24 px | 22 px, left column |
| Key tokens (static tint from E0; the prompt says "đã khoanh sẵn") | `.is-key` tint | same | same |
| Role / reading chips | 12 px | 11 px | 11 px |
| Translation | 22 px ink-2 | 17 px | right column 15 px |

| # | Cue | `loai` | `khi` | Fallback | Effect |
|---|---|---|---|---|---|
| E0 | Frame | — | `vao` | — | Token groups rise in reading order (40 ms, ≤8); template slots empty |
| E1 | Reading 1 | `doc` | `khop {jp:[first 2 non-punct tokens joined]} lan 1`, `khopCuoi {jp:[last 2 tokens joined]}` | dropped | `hu.karaoke(tokens, times ∝ morae of furigana‖text over dur)` |
| E2 | Reading 2 | `doc` | same, `lan 2`, `sau E1` | `{sauCue:'E1', ms: E1.dur + 600}` if E1 fired | Karaoke at 60% |
| E3 (ASSEMBLE) | Assembly | `hien` | first match after E2 of any key token `{jp:[text, kanji]}` (particles `rieng` or with their preceding token joined) | `tiLe .4` | `hu.bay(token groups → slots, {buoc:90})`; sources `hu.mo(on)`; slot captions brighten |
| E3.k (DIAGRAM) | Key token k | `hien` | `khop {jp:[prevToken+text, text(rieng if 1 char), kanji]}`, `sau E2` | `tiLe .35 + .1k` | Token lifts (`translate 0 -6px`, stays); role chip `hu.chip(tok, tokenRole(text), {ben:'duoi'})` if the role is non-empty |
| E4 | Particle reading (token ∈ {は,へ,を} and `isKeyGrammar`) | `hien` | the particle's match (`{jp:[prev+は], vn:["wa"]}`) | with E3 | `hu.chip(tok, 'đọc: wa')` + `hu.nhan(tok)`; `c.chiVao(tok)` once |
| E5 | Translation | `hien` | `khop {vn: NGHIA ∪ vn3(meaningVi)}`, `sau E2` | `tiLe .75` | `hu.hien(meaning)`; sources `hu.mo(off)` |

**Final frame:** sentence, filled template (ASSEMBLE) or role chips (DIAGRAM), reading chips, translation.

`giu(beatTiep)`: the same-slide next example keeps the template row.

Board: `draw_on_board(A, "mui_ten", B)` resolves to `st-` tokens (§2.5).

### 3.5 `kaiwa-intro` (C)

**Data:** `dialogue[]` (10 lines in every lesson; 2 speakers in 93 lessons, 3 in 6, 4 in 1) + `SenseiVoices.castOf`.

**Layout:**
- **Cast row:** 2–4 cards: 72 px initial circle (or `avatarUrl`), name = `speaker` (e.g. "佐藤 (Satou)") 15 px, gender/role 12 px muted.
- **Sides:** follow `renderKaiwa`'s rule (slide-engine 800–819): majority `speakerRole`, with a ring for a second speaker on the same side. C re-implements this 15-line rule locally; it does not edit slide-engine.
- **Storyboard:** 10 tiles (`rong`: 5×2; `hep`: 10 compact rows of 28 px; `thap`: 5×2 at 12 px). Each tile has the speaker initial and `meaningVi` cut to 28 characters.

| # | Cue | `loai` | `khi` | Fallback | Effect |
|---|---|---|---|---|---|
| C0 | Cast | — | `vao` | — | Cards enter, 90 ms apart |
| C1.p | Speaker p named | `nhan` | `khop {jp:[name kanji], vn:[romaji inside "( )"]}` | dropped | Card `nhan` |
| C2.i | Tile i | `hien` | `khop {vn: vn3(meaningVi_i)}` | `tiLe .2 + .7·i/10` | Tile `hien` |

No Japanese line text is shown yet, matching the prompt's "CHƯA đọc câu tiếng Nhật nào".

`giu`: portraits, for the carry into kaiwa-run.

### 3.6 `kaiwa-run` (C), client playback with exact timing

**Layout:**
- Thread viewport `.sk-ht-luong`, full hero height. Bubbles `.deck-card` alternate sides; max-width `min(78%, 720px)` (`hep` 86%).
- JP `.jp-sentence` at 26 px (`hep` 20 px); meaning 14 px at .8 opacity.
- 36 px avatar; bubble `id="st-<line.id>"` + `camXucAttr(line)`, tokens `st-` ids.
- Visible: the current bubble + the previous 2 (`hep`/`thap`: 1). Older bubbles are translated out of view.

**Line playback:**
1. **`khiDongThoai(line, i)`:**
   - bubble i enters from its speaker's side (`∓16px 8px` + fade, 320 ms);
   - the thread translates up by the new bubble's height (420 ms, io);
   - the previous bubble dims to .55;
   - its avatar gets a speaking ring (live-state loop, only until `khiXongDong`).
2. **Karaoke on `khiClip(lineId, {t0, dur, pcm})`:**
   1. Decode PCM (Int16 LE) and build a 10 ms dB envelope.
   2. Voiced frames: `db > max(−50, p95 − 30)`.
   3. Audio phrases: voiced runs separated by ≥ 120 ms of silence; merge runs < 60 ms.
   4. Text phrases: split the tokens at punctuation tokens.
   5. If the phrase counts are equal, map 1:1. Otherwise place text-phrase boundaries at cumulative-mora proportions and snap each to the nearest audio-phrase boundary within ±200 ms.
   6. Inside a phrase, token start times ∝ morae (furigana length, else text length).
   7. `hu.karaoke(tokens, t0 + times)` on the AudioContext clock.
   - Expected accuracy: phrase ±50 ms, token ±80–150 ms.
3. **Browser voice** (`khiGiongMay`):
   - `bat-dau` sets `t0 = performance.now()`;
   - `ranh-gioi` maps `charIndex` → token by cumulative `kanji||text` length;
   - without boundary events: `len × 0.13 s` from `t0`.
4. **`khiXongDong(lineId)`:** the meaning `hien`s (240 ms) inside the existing 320 ms gap (listen first, then read). The ring stops.

The cat still reacts to `data-emotion`: app 2983 calls `focusItem(line.id)` without `khongMat`, and the redirect returns the stage bubble, which carries `data-emotion`.

This beat has no speech cues.

`giu`: the thread, for kaiwa line 1.

### 3.7 `kaiwa` (one line; C)

**Layout:**
- Hero bubble, JP 34 px (`hep` 24 px), speaker label 12 px/600 muted, meaning.
- Previous and next bubbles above and below at scale .86, opacity .35 (`hep`: hidden).

| # | Cue | `loai` | `khi` | Fallback | Effect |
|---|---|---|---|---|---|
| F0 | Focus | — | `vao` (from the kaiwa-run thread: carry, else `truot`) | — | Bubble to hero size |
| F1 | Replay | — | `khiClip` / `khiGiongMay` of this line | — | Exact karaoke (§3.6) |
| F2 | Sensei re-reads slowly | `doc` | `khop {jp:[first 2 tokens]}`, `khopCuoi {jp:[last 2 tokens]}` | dropped | Karaoke at 60% |
| F3.k | Key token k (`isKeyGrammar`) | `hien` | `khop {jp:[prev+text, text, kanji]}`, `sau F2` | `tiLe .3 + .1k` | Lift + role chip |
| F4 | Meaning | `nhan` | `khop {vn: NGHIA ∪ vn3(meaningVi)}` | dropped | Meaning `nhan` |

**Tool handling (`congCu`):**
- `write_on_board(text)` whose text contains JP characters → at `T`, a dashed ghost bubble "Cách nói khác" slides out under the hero (`translate 0 -8px` + fade, 360 ms) with a `⇄` glyph. Return `{success:true}`, and also write `vietBang(text, style, {im:true})`.
- Other `write_on_board` calls go to the notes rail.
- `draw_on_board(id, 'khoanh')` lands on `st-` tokens through the redirect.

### 3.8 `quiz` (C + A)

**Data:** `{id, question, options[4], correctIndex, explanation, hint}`.

**Layout.** The block `.sk-bt-khoi` has `id="st-card-<id>"`, removed at hand-off.
- Header "Câu i/n" 13 px muted.
- Question 22 px (`hep` 18 px).
- Options: 2×2 when `rong` and the longest option ≤ 28 characters, else 1 column. Min-height 56 px (`hep` 48), each with an A–D key chip.
- Hint row `.sk-an`.

| # | Cue | `loai` | `khi` | Fallback | Effect |
|---|---|---|---|---|---|
| Q0 | Frame | — | `vao` | — | Question, then options (60 ms apart). All four are readable at once |
| Q1 | Question said | `nhan` | `khop {vn: vn3(question), jp:[JP run of question ≥ 2 chars]}` | dropped | Underline grows under the question |
| Q2.o | Option o read | `nhan` | `khop {vn:["dap an "+L, "cau "+L] ∪ [romaji inside "( )"], jp:[JP part of option (≥1 char, rieng if 1)]}`, `sau` Q2.(o−1) | dropped | "Being read" ring on option o (outline; must not look selected) |
| Q3 | Hint | `hien`, **not mandatory** | `khop {vn: GOI_Y}` | none (only shown if Sensei says it) | Hint row `hien` |

**Waiting (A + C):**
1. `vaoCho(beat)`:
   1. C measures the `.sk-bt-khoi` rect and `#card-<id>`'s rect. The grid is laid out, and D scrolled the card into view.
   2. C runs a FLIP of the block onto the card rect (translate + uniform scale, 320 ms out). Its opacity goes 1→0 over the last 120 ms.
   3. At 60% of the FLIP, A adds `body.sk-cho` (grid visible) and plays a 200 ms opacity fade-in on `#slideContent`.
   4. At the end, A sets `che='cho'`, applies the inert chain (§1.11), strips `st-` ids from the stage, and focuses `#btn-opt-<id>-0` (`preventScroll`).
   - Reduced motion: instant cross-over.
2. **Rail in `cho`:**
   - "Đến lượt bạn — chọn A, B, C hoặc D" with a breathing dot (live state);
   - a ghost button "Bỏ qua" → `init.khiBoQua()`;
   - at 20 s with no answer: `q.hint` as a muted line + one `hu.nhay(card)`; nothing after that.
3. **`khiTraLoi(exId, dung)`:**
   - the rail becomes "Đúng rồi!" (sage) or "Chưa đúng — nghe Sensei giảng" (clay) + a primary "Tiếp tục ▸" → `init.khiTiepTuc()`;
   - the quiz dot for this question fills sage or clay;
   - `datDemTiep(ms)` draws a hairline under "Tiếp tục" filling linearly over `ms`; `datDemTiep(null)` shows "…" while grading speech plays.
4. `raCho()`:
   - set `che = 'chuyen'`, remove the rail buttons, restore the sibling chain;
   - set `#slideContent.inert = true` again, but keep `body.sk-cho` so the answered card stays visible (no blank frame during the gap);
   - the next `batDauNhip` (or the finish card, §3.10) removes `sk-cho` in its first frame, hiding the grid, and runs the quiz→quiz `truot` from the card rect.

**Feedback on the real card** (C, css/motion-hoi.css, all under `body.dang-giang`, i.e. only while lecturing):

| Result | Motion |
|---|---|
| Correct (`.qz-opt.is-correct`) | Sage fill layer (opacity 200 ms); the check icon pops (`scale .6→1`, spring 320 ms); a 6-dot burst from a `::after` with radial box-shadows (`scale .4→1` + opacity 1→0, 450 ms, once); the other options fade to .5 |
| Wrong (`.qz-opt.is-wrong`) | Option shake `translate ±6px` ×3 over 300 ms; strike line `.qz-opt-text::after` `scaleX 0→1` over 240 ms (clay); after 200 ms `.qz-opt.is-answer` gets a sage outline + check pop |
| Card | `body.dang-giang .qz-card.roast-shake { animation: none; }` (no double shake); the explain box keeps its existing `slide-fade-enter` |

**Quiz dots** (A): in the quiz chapter the rail shows n dots of 6 px, hollow, sage or clay. At scene build they are initialised from grid cards already answered (`.qz-opt.is-correct` / `.is-wrong` inside `#card-<id>`).

### 3.9 Chapter card (A)

At `khiHetNhip({tiep})` with `tiep.isChapterStart` (gap 1600 ms):
1. At gap + 500 ms: the old scene `hu.ra`s.
2. `.sk-the-chuong` `hien`s (260 ms):
   - "Xong {chương cũ} ✓" in 14 px muted;
   - `CHAPTER_LABEL[tiep.chapter]` in 40 px / 700 (`hep` 28, `thap` 22 on one line);
   - a meta line (15 px muted) from `cacNhipChuongTiep`: "N từ", "N chữ", "N mẫu câu · M ví dụ", "N câu thoại", "N câu hỏi";
   - a hairline that grows (`scaleX`, 480 ms).
3. At `batDauNhip`: the label carries into the rail label (520 ms) while the first scene `vao`s.

Under reduced motion the card is text only. The rail text simply changes.

### 3.10 Finish card and practice hand-off (A + D)

At `khiHetNhip({tiep: null, tongKet})` (final gap 2400 ms):
1. The old scene `hu.ra`s at +300 ms.
2. `.sk-the-xong`:
   - "Xong bài {n}" 32 px;
   - stats rows appearing 80 ms apart: "{tu} từ · {chu} chữ Hán · {mau} mẫu câu · {thoai} câu thoại · Bài tập {dung}/{bt}";
   - a line "Luyện tiếp: Phát âm · Viết tay — ngay bên dưới".
3. At 2400 ms D's timer calls `finishLecture()` → `SK().dung()` → the grid is restored. If the quiz tab is active, D clicks the jump-nav button `[data-qz-toi="qz-phat-am"]`, which scrolls to the pronunciation section (the existing smooth `scrollTo`).

This is the only pronunciation/handwriting "prompt" in this pass.

### 3.11 Lecture progress (A)

| Element | What it shows |
|---|---|
| Rail label | `beat.label` |
| Rail hairline | `scaleX(chuong.i / chuong.n)` |
| Chapter card | Chapter just finished + next chapter with its size |
| Quiz dots | Results in the quiz chapter |
| Finish card | Lesson totals |

No separate lesson-wide dot row: "say each thing once".

---

## 4. Mock-lecture test mode `?moPhong` (owner D, `js/mo-phong.js`)

Tests never open a Gemini Live session. Always use `?noLive&moPhong`: `noLive` empties `ENV`, so there is no dubbing, AI quiz or REST roast network traffic.

### 4.1 Client substitution

If `!/[?&]moPhong\b/i.test(location.search)`, do nothing. Otherwise:
```js
class MoPhongClient extends GeminiLiveClient {
  constructor(o) { super(o); this._gan(); }
  _gan() {
    this.ws = { readyState: 1, send: (s) => this._nhan(JSON.parse(s)), close() {} };
    this.isConnected = true; this.isSetupComplete = true;
  }
  connect() { this._gan(); setTimeout(() => this.handleMessage({ setupComplete: {} }), 30); }
  disconnect(g) { super.disconnect(g); }      // real cleanup; connect() re-arms
}
window.GeminiLiveClient = MoPhongClient;
GeminiLiveClient = MoPhongClient;   // reassigns the global class binding (classic script, runs before DOMContentLoaded)
```

Everything else is the real client: `sendUserMessage`, `safeSend`, `handleMessage` (ordering, `interrupted`, `_coNoiDungMoi`, tool acknowledgement). The mock feeds genuine server message objects to `this.handleMessage(msg)`:
- `{serverContent:{modelTurn:{parts:[{inlineData:{data}}]}, outputTranscription:{text}}}`
- `{toolCall:{functionCalls:[{id,name,args}]}}`
- `{serverContent:{turnComplete:true}}`
- `{serverContent:{interrupted:true}}`

`ensureConnected()` (app 1631) resolves immediately because both flags are true.

The mock shows a fixed, non-interactive badge "MÔ PHỎNG" at the top-left (11 px, muted).

### 4.2 Parameters (URL)

| Param | Default | Meaning |
|---|---|---|
| `moPhong` | — | Enables the mode |
| `tre` | 0.35 | True transcript lag `L_true` (s; negative = transcript first) |
| `rung` | 0.15 | Per-fragment jitter (s, uniform ±) |
| `nhanh` | 2.5 | Streaming speed vs real time |
| `r` | 0.15 | True seconds per unit |
| `som` | 1.5 | Maximum tool lead (tools arrive U[0.3, som] s of audio early) |
| `kana` | 0.3 | Probability a kanji word is transcribed as kana |
| `mat` | 0.1 | Probability a JP word is mis-transcribed (drop one kana), to exercise fallbacks |
| `hat` | 7 | Seed (xorshift) |
| `tu`, `den` | — | Start at / stop after beat index (the harness calls `__lecture.startFrom(tu)`) |

### 4.3 Turn scripts

`_nhan(payload)`:
- **`clientContent` with `turnComplete:true`:**
  1. If a turn is streaming, stop it and emit `interrupted` first.
  2. Read `text = turns[0].parts[0].text`.
  3. Tag the turn with `__motion.luotHienTai()`.
  4. Pick a script:
     - text starts with `[LỚP` or `[HỌC TIẾP` → `window.__lecture.state().current` → the script for its kind (below);
     - `Sensei ơi, em chưa nghe rõ` → a 3 s VN continuation;
     - `[CHẤM BÀI` → a 2-sentence VN grading line;
     - otherwise → a short VN answer.
- **`realtimeInput.activityEnd`:** a VN answer turn (raise-hand test).
- **`clientContent` with `turnComplete:false`, `toolResponse`, `realtimeInput.audio`:** ignored.

**Scripts** are segment lists `{loai:'vn'|'jp'|'lang'|'cong-cu', hien (transcript text), doc (reading for units), args}`. The pause segment `lang` is 250 ms at punctuation and 150 ms at a VN↔JP switch. JP words use the kanji form, or kana with probability `kana`.

| Kind | Script (the prompt's order) | Tools |
|---|---|---|
| vocab | "Từ tiếp theo là {JP}." {JP}. "{JP}, nghĩa là {meaningVi}." "Mẹo nhớ: {accentNote or a stock line}." "Ví dụ: {stock JP sentence with the word}." | `write_on_board(tip)` with probability 0.4, before the tip |
| kanji | "Chữ {ch}, Hán Việt là {hv}, có {n} nét." "Câu chuyện chiết tự: {origin note or stock}." "Âm On là {on}. Âm Kun là {kun}." "Từ ghép: {w} nghĩa là {m}." ×≤3 | `write_kanji(ch)`: 60% before any audio, else before "Câu chuyện" |
| grammar-intro | "Mẫu câu: {title}." "Công thức: {slots and literals read aloud, は read "wa" with p = 0.5}." Explanation sentences (verbatim with p = 0.6, else paraphrased). "Lưu ý: {tips}." "Về văn hoá, {culturalNotes}." | `write_on_board(line, 'nhat')`, p = 0.3 |
| example | "Câu ví dụ:" {sentence}. {sentence}. "Tách ra: {token} là …; trợ từ {は} đọc là wa; …" "Dịch: {meaningVi}." | `draw_on_board(tokA, 'mui_ten', tokB)`, p = 0.3 |
| kaiwa-intro | Cast names with romaji, then "{speaker}: {meaningVi}" for the 10 lines | — |
| kaiwa-run | Only reached if client playback failed | — |
| kaiwa | {line} slowly, context sentence, key-token explanation, "Cũng có thể nói: {alt JP}" | `draw_on_board(key,'khoanh')`, `write_on_board(alt JP)` |
| quiz | "Câu hỏi: {question}." "Đáp án A: {o1}. B: {o2}. C: {o3}. D: {o4}." "Gợi ý: {hint}." "Em chọn đi nhé." | `write_on_board(summary)`, p = 0.3 |

### 4.4 Synthetic audio and streaming

**PCM (24 kHz Int16 LE).**
- Each unit is a burst of `r_true × weight` seconds: f0 110–140 Hz plus 2 harmonics, amplitude .25, 15 ms attack / 40 ms release.
- A 25 ms micro-gap separates VN syllables; pause segments are digital silence.
- Every unit's audio offset `[a0, a1]` and its transcript raw offset are recorded, so the truth is exact.

**Streaming (`setTimeout` pacing):**
- Chunks of random 40–400 ms audio, emitted at wall time `start + a0/nhanh`.
- A transcript fragment (2–12 characters, split at random but never inside a surrogate pair) is emitted when streamed audio reaches `a_end(fragment) + tre + U(−rung, +rung)`, never before the turn starts.
- A fragment rides in the same frame as audio with p = 0.5 (audio parts first, as Gemini does), else in its own frame.
- A tool call is emitted when streamed audio reaches `a_tool − U(0.3, som)`.
- `turnComplete` comes 50 ms after the last chunk.

**Truth table.** After each audio frame the mock reads `window.__audioEngine.scheduledTime` → that chunk's true `t1`, and `t0 = t1 − dur`. It keeps a per-turn `{chunks, units, tools}` table.

```js
__moPhong.thoiDiemThat(luot, rawOffset) -> AudioContext time the character at rawOffset starts being heard
__moPhong.thoiDiemCongCu(luot, name)    -> true audio time of the tool's script position
__moPhong.luot()                        -> list of turns with metadata
```

**Dialogue clips.** At the first `kaiwa-run` beat (detected from `__lecture.beats()` at the first prompt), the mock synthesises every line (JP bursts per mora, 120 ms silences at punctuation) and calls `__lecture.datGiongThoai(id, Uint8Array)`. It records true token start times as `__moPhong.karaokeThat(lineId)`.

**WAV mode (smoke test, no truth).** The harness reads `scratchpad/lipsync/A/tts/*.wav` (Charon TTS, 24 kHz mono; `cau_01..10` are mixed VN/JP sentences, e.g. `cau_05` "私はベトナム人です。 nghĩa là tôi là người Việt Nam.", texts in `stt_cau.txt`). It calls `__moPhong.napWav(id, base64Pcm, text)`, and the next beat's turn uses that audio. The transcript is streamed proportional to length.

This mode is for visual checks only. server.py cannot serve scratchpad files, which is why the harness injects the data.

### 4.5 Harness (D, `scratchpad/motion/kiem-thu.mjs`; not in the project)

1. Reuse the launcher pattern of `scratchpad/e_cdp.mjs` (headless Chrome, own profile, CDP) and add `--autoplay-policy=no-user-gesture-required`.
2. Start `python server.py` (port 3000, per `.claude/launch.json`) if it is not running.
3. Open `http://127.0.0.1:3000/?noLive&moPhong&hat=7`.
4. `await window.jumpToLesson('N5', 1)`.
5. Click `#autoLectureBtn` (a real click, via `Input.dispatchMouseEvent`).
6. Collect `__motion.nhatKy()` plus `__moPhong` truth, and emulate media and viewport per test.
7. Output a JSON report to `scratchpad/motion/ket-qua/*.json` and screenshots.

rAF runs in headless Chrome, but the director does not depend on it. The Claude Browser test pane can be used only for class/DOM assertions (memory: rAF does not fire there).

---

## 5. File ownership (4 parallel builders)

**Forbidden to all motion builders:** `js/sensei-cat-video.js`, `js/khau-hinh.js`, `js/audio-engine.js` (another team is editing them). Also forbidden in this pass: `css/styles.css`, `css/lesson.css`, `js/gemini-live.js`, `js/sensei-avatar-hub.js`, `js/ui-shell.js`. Nobody edits another builder's files.

| Builder | Owns (create / edit) | Must deliver |
|---|---|---|
| **A: director** | `js/motion.js`, `css/motion.css` | §1.2–1.14 in full, §2.5 tool interception, §3.8 waiting rail + inert chain + quiz dots, §3.9 chapter card, §3.10 finish card, §3.11 progress, `window.__motion`. Must run with zero registered scenes (it shows a generic scene with the beat label and fires no cues) so B and C can be integrated in any order |
| **B: text scenes** | `js/motion-canh-chu.js`, `css/motion-chu.css` | Builders for `vocab`, `kanji`, `grammar-intro`, `example` (§3.1–3.4), including the formula parser, alignment, morph rows, the formula carry, and the stage kanji stroke styling. Export pure helpers for tests on `window.__motionChu = { tachCongThuc(fm), canhCau(parts, tokens), timBienHinh(slide, lesson), timTuDien(v) }` |
| **C: dialogue and quiz scenes** | `js/motion-canh-hoi.js`, `css/motion-hoi.css` | Builders for `kaiwa-intro`, `kaiwa-run`, `kaiwa`, `quiz` (§3.5–3.8), clip karaoke, the browser-voice path, the quiz FLIP hand-off (`vaoCho`/`raCho` hooks), and the real-card feedback CSS under `body.dang-giang`. Export `window.__motionHoi = { karaokeTuPcm(pcm, tokens) }` |
| **D: integration and mock** | `js/app.js`, `js/slide-engine.js`, `js/board.js`, `index.html` (tags only, §1.1), `js/mo-phong.js`; scratchpad `motion/kiem-thu.mjs` + reports | §2.1–2.3, §4. Runs §6 once A, B and C report done. Fixes in own files only; reports cross-file defects to their owner with a failing assertion |

**Contract discipline:**
- A implements §1.3/§1.4/§1.8 signatures verbatim.
- B and C code only against `SenseiMotion.dangKyCanh`, `c.*` and `hu.*`, plus the read-only `slideEngine` helpers.
- D calls only §1.3 methods.
- If a builder needs a new API, they add it in their own file behind a feature check and record it in their final report. No cross-file edits.

**Naming:**
- Stage classes are prefixed `sk-` (A generic: `sk-rail`, `sk-canh`, `sk-an`…; B: `sk-tv-*` vocab, `sk-kj-*` kanji, `sk-np-*` grammar, `sk-vd-*` example; C: `sk-ht-*` dialogue, `sk-bt-*` quiz).
- CSS custom properties are prefixed `--sk-`, declared on `.san-khau-giang`, never on `:root`.
- Comments and identifiers follow the codebase (Vietnamese without diacritics in code).

---

## 6. Acceptance tests (D runs them; all with `?noLive&moPhong`, never a live session)

Default setup: 1440×900, N5-1 (84 beats), `hat=7`. All times use the AudioContext clock unless noted.

| # | Test | Pass criterion |
|---|---|---|
| T1 | Lock while teaching | At 5 random instants in each of 10 sampled `giang` beats: `body.dang-giang`, `#slideContent.inert === true`, computed `visibility === 'hidden'`, stage visible. `elementFromPoint` at 9 grid points returns nothing inside `#slideContent`. A synthetic click at a grid card's centre changes nothing (`slideEngine.activeFocusId` unchanged, no `.opt-locked` added) |
| T2 | Quiz waiting | Within 450 ms of the quiz beat-done pass: `trangThai().che === 'cho'`, `#slideContent.inert === false`, `elementFromPoint(option centre)` is `#btn-opt-<id>-k`, other cards are inert. **Correct answer:** the next beat starts (`__lecture.index()` +1) within `max(2.5, 0.04·chars) + 1.2` s, and `lectureState` never becomes PAUSED. **Wrong answer:** the mock grading turn plays while PLAYING; the next beat starts 2.5 s (±0.5) after the grading audio ends. "Bỏ qua" and "Tiếp tục" advance within 900 ms. Keys A–D answer |
| T3 | Pause returns the static layout | For each path (pause button, raise hand, tab click, → key on grammar, chat send, `jumpToLesson`, mock `ws` close → `onClose`), measured in the next frame: no `body.dang-giang`, stage `pointer-events:none`, `#slideContent` visible and non-inert. 250 ms later, `document.getAnimations()` has nothing running whose target is inside `#slideContent` or the stage (excluding `.deck-wave`). No `nhatKy` entry has `firedPerf` after the pause time. No `.reading-badge-indicator` remains |
| T4 | Speech sync | Per match cue: `err = (firedCtx + LEAD) − thoiDiemThat(luot, viTri)`, excluding beats 0–1 (L learning). **`tre=0.35, rung=0.15`:** \|err\| median ≤ 150 ms, p90 ≤ 350 ms. **`tre=−0.3`:** same thresholds. **`tre=0.8`:** p90 ≤ 450 ms. First-audio cues: \|firedCtx + LEAD − T_first\| ≤ 50 ms. Tool cues: \|firedCtx + LEAD − thoiDiemCongCu\| p90 ≤ 300 ms. Kaiwa-run karaoke vs `karaokeThat`: token p90 ≤ 150 ms |
| T5 | Không cụt | Full N5-1 run: 100% of `hien`/`lam` cues fired before their scene's exit; `via:'nen'` ≤ 5% of them; 0 cues fired with an epoch or beat different from the one that created them. With `mat=0.5` (heavy mis-transcription): still 100% fired before exit, `nen` ≤ 15% |
| T6 | Final frames | At each scene exit, DOM checks: vocab meaning visible (`.sk-an` absent); kanji meaning + On + Kun + compounds; grammar chips + all explanation sentences; `ex-n5-l1-s1-1` ASSEMBLE slots contain 私/わたし · は · マイク・ミラー · です, the "đọc: wa" chip and the translation; quiz shows 4 options. `__motionChu.canhCau` on all 867 examples returns ASSEMBLE for 110–130 of them and never throws |
| T7 | Motion properties | Every Animation in the stage (and the real quiz card during `cho`) animates only `translate`, `scale`, `opacity` (`getKeyframes()` property names), except `stroke-dashoffset` / `fill-opacity` on `.bang-kanji-duong` and `.sk-ve *`, with ≤ 20 such paths at once |
| T8 | Performance | Mock run of 60 beats: `msLam` p99 ≤ 8 ms; `PerformanceObserver('longtask')` entries > 50 ms during the stage ≤ 2; ≤ 12 concurrent running animations at any sample; rAF frame gaps > 24 ms ≤ 5% during active animations |
| T9 | Reduced motion | `Emulation.setEmulatedMedia(prefers-reduced-motion: reduce)`: no running Animation with `translate`/`scale` keyframes on the stage; cue fire times match the normal run with the same seed within ±20 ms |
| T10 | Layout | At 1440×900, 1280×720, 1024×768, 390×844, 360×740, 844×390, for a vocab, kanji, grammar-intro, example (ASSEMBLE), kaiwa-run and quiz beat: `scrollWidth ≤ innerWidth`; every visible stage text rect lies inside the stage content box. Below 1000 px, no stage text rect intersects the cat region (right `--sensei-rong` × bottom `--sensei-cao + 36px` above `.deck-bottom`). At ≥ 1000 px, stage rects stay left of the lane (`innerWidth − --sensei-rong`). Screenshots saved |
| T11 | Unique ids | At every `batDauNhip` and during `cho`: `querySelectorAll('[id]')` has no duplicate ids |
| T12 | Tools | `write_on_board` never adds `body.co-bang` while lecturing; `vietBang(...,{im:true})` lines appear in `#bangPhan` when the learner opens it after pausing. `write_kanji` draws inside the stage tile. `change_section` while PLAYING leaves `slideEngine.activeTab` unchanged |
| T13 | Kill switch | `?noLive&moPhong&khongSanKhau`: no `#sanKhauGiang` shown, no `dang-giang`, quiz beats do not wait, and behaviour matches the current app (beat sequence identical to `__lecture.plan()`) |
| T14 | Clean console | No uncaught exceptions or `console.error` during T1–T13 (warnings tagged `[motion]` allowed ≤ 5) |
| T15 | Resume | Pause during `cho` of quiz 3, answer quiz 3 in the grid, press "Giảng tiếp": the lecture resumes at quiz 4 (the answered beat is skipped) |
