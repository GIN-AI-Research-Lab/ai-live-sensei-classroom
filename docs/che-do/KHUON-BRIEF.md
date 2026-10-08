# TASK BRIEF — stage mode "{k}" ({ten})

Read FIRST, in this order:
1. E:\sensei-tam\gemini\QUY-TAC.md (rules, definition of done, report format)
2. {SP}\che-do\HUONG-DAN.md (the mode contract: API, events, helpers, quiz portal)
3. The reference implementation js/che-do/s.js + css/che-do/s.css. It is a finished mode. Copy its structure and how it handles
   beats, cues, the quiz slot, chapter/finish cards, phone and reduced motion.
4. The prototype of THIS mode: {proto}\index.html (+ its js/css), its frames in strip-{k}.jpg and its video video-{k}.mp4.

## Goal
Make mode "{k}" a real, selectable stage mode that looks like its prototype video but runs LIVE from Sensei's cues and real
lesson data for ANY lesson. The header "Chế độ" menu already lists it (js/che-do/che-do.js); the framework lazy-loads
js/che-do/{k}.js and css/che-do/{k}.css and registers the mode with SenseiCheDo.dangKy({...}).

## Look to reproduce
{look}

Extra note: {risk}

## You may edit (ONLY these)
- js/che-do/{k}.js    (new)
- css/che-do/{k}.css  (new)
- assets/che-do/{k}/  (optional, small files, prefer CSS/SVG)
- {SP}\che-do\{k}\   (your work folder: screenshots, report)
Everything else is READ-ONLY. If the framework or the director needs a change, write it under "Requests" in the report; do not edit it.

## Must implement (every beat kind, real curriculum data, any lesson)
1. vocab: headword + furigana + romaji + meaning + tip; illustration from item.imageUrl (if missing, hide the tile gracefully and re-flow).
2. kanji and kana beats: glyph tile with stroke animation (use api.vietNet like mode A), readings / romaji / mnemonic.
3. grammar-intro: the formula as blocks; the particle (は, が, を ...) is highlighted with its reading when spoken.
4. example: the sentence with tokens, furigana and meaning; tokens highlight as they are spoken (the karaoke event).
5. kaiwa-intro / kaiwa-run / kaiwa: speaker avatars from avatarUrl (fallback: the initial in a circle), the current line big.
6. quiz: put the REAL card into the slot returned by m.oBaiTap (never clone it); restyle it with CSS only.
7. chapter card and finish card through theChuong / theXong.
8. Pause: the mode layer disappears and the static grid shows. Resume and mode switching are clean. Reduced motion. Phone 390x844.
9. dungNhip may return null for a beat kind you truly cannot do; then the default scene shows. List these in the report.

## Timing rules (the owner complains that highlights lag behind the voice)
- Schedule every highlight / focus with api.tre(tt) (cue time minus ~80 ms). Focus / highlight motion <= 200 ms, ease-out.
- Never wait before showing something Sensei is saying right now. Never delay a cue for a decorative animation.
- No element may sit half-transparent as a "waiting" placeholder. It is either fully visible or not shown.

## Layout rules
- The frame must look FULL at every moment: no big empty areas, composed edge to edge like a professional video frame.
- Nothing clipped at the edges. Long meanings and long sentences wrap and auto-fit; short content is scaled up.
- api.meo() gives the real cat's rectangle: keep that corner free.
- Vocab illustrations are webp on a flat cream #f0ebe1 background: put them on a matching cream tile, or use
  mix-blend-mode: multiply on light backgrounds; on dark backgrounds put them on a light rounded tile.

## Performance rules
- Animate only transform and opacity (plus stroke-dashoffset / clip-path where the look needs it).
- No full-screen live blur or backdrop-filter, no per-frame canvas, no giant DOM scaled every frame. Target 60 fps.
- Give phones a lighter variant.


## Type scale minimums (1440x900 frame; the owner rejects small type and empty space)
- Headword / main kanji: >= 200px (vocab), sentence in an example beat: >= 84px, formula blocks: >= 110px.
- Meaning (Vietnamese): >= 44px as the main line of a vocab beat (auto-fit down to 32px only for very long text).
- Any secondary line (tip, romaji, explanation): >= 20px. Nothing readable below 14px; tiny decorative eyebrow labels may be 11-12px.
- On 390x844: main text >= 28px, secondary >= 15px, nothing below 13px.
- If the content is short, SCALE UP to fill the region (the block must look full); if long, auto-fit down but never below the minimums; wrap between words.

## Automatic checks that will run after you (a script, not you): fix what they report
- syntax check (node --check), console errors, pause, quiz portal;
- layout probe: any visible text wider/taller than its box or outside the frame, any text overlapping the cat's rectangle, any text smaller than the minimums above,
  and any large empty region (more than 25% of the frame area with no content).

## Tests you must run and attach
1. `node --check js/che-do/{k}.js`
2. `node {SP}\che-do\khung\kiem-che-do.mjs {k} all` (read its header first). Lessons: N5-1 and one of N4-30 / KANA-5.
3. It writes a side-by-side sheet, live vs prototype: {SP}\che-do\{k}\so-sanh.jpg. OPEN IT and compare. Fix until the live frames
   have the same composition, colours and type as the prototype. Do at least 2 fix rounds and say what each round changed.
4. Default look untouched: `node {SP}\motion\kiem-thu.mjs smoke T1 T3 T13 T14 --them "&phongCach=mac-dinh"`

Write your report (format in QUY-TAC.md) to {SP}\che-do\{k}\bao-cao-gemini.md
