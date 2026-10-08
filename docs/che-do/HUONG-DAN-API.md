# Chế độ sân khấu (SenseiCheDo) — hướng dẫn port cho 10 concept

Tài liệu này dành cho người port concept B–J. Mode S "Bảng đen lớp học" là bản mẫu (A và J đã bị xóa 2026-10-06): đọc `js/che-do/a.js` + `css/che-do/a.css` song song với tài liệu này.

Mỗi concept trở thành một **chế độ sân khấu** mà người học chọn được trong nút "Chế độ" trên thanh trên. Chế độ **chiếm cả vùng sân khấu** (giữa thanh trên và thanh dưới) và vẽ bố cục full-frame giống video mẫu. Nó được đạo diễn (`js/motion.js`) điều khiển **sống**: cue theo lời Sensei, dữ liệu thật của bất kỳ bài nào.

Quy tắc chung (bắt buộc):
- Không mở Gemini Live, không đọc `.env` / `env.js`.
- Không commit / stash / reset git.
- Không sửa `js/khau-hinh.js`, `js/sensei-cat-video.js`, `js/audio-engine.js` (agent khác đang sửa).
- Comment trong code viết tiếng Việt **không dấu**; chữ trên giao diện viết tiếng Việt **có dấu**.
- Chỉ sửa file của chế độ mình: `js/che-do/<k>.js` + `css/che-do/<k>.css`. Cần thêm gì vào đạo diễn / API thì ghi vào báo cáo, đừng tự sửa `motion.js` / `che-do.js`.

---

## 1. Các file

| File | Vai trò |
|---|---|
| `js/che-do/che-do.js` | `window.SenseiCheDo`: danh mục, đăng ký, nạp lười (lazy load) file + thư viện, nút/menu "Chế độ", lưu `localStorage['sensei_che_do']`, `apDung()` cho app.js. Không còn tự gán phong cách theo bài (N5 bài 1–7). |
| `css/che-do/chung.css` | Lớp `.cd-lop`, luật `[data-cd-phu]`, ô bài tập, nét chữ `.cd-net`, nút + menu. Nạp sẵn trong `index.html`. |
| `js/motion.js` (mục "che do san khau") | Cầu nối: `CD`, `CDH` (tiện ích), `cdChuanBi` / `cdDung` / `cdThe` / `cdOBaiTap` / `cdTat`, chuyển tiếp mọi sự kiện nhịp. |
| `js/che-do/<k>.js`, `css/che-do/<k>.css` | **Việc của bạn**: một chế độ, `k` là `b`…`j`. |
| `vendor/gsap/` | GSAP 3.15.0 (`gsap.min.js`, `CustomEase`, `SplitText`, `Flip`, `DrawSVGPlugin`), kèm `LICENSE.txt`. Chỉ nạp khi chế độ khai báo `can: ['gsap', ...]`. |

Danh mục (id → tên hiển thị): `mac-dinh` Mặc định · `a` Bento động · `b` Điện ảnh · `c` Bản đồ tư duy · `d` Vui nhộn game · `e` Kính cực quang · `f` Sổ tay phác thảo · `g` Poster Nhật Bản · `h` Giấy cắt lớp · `i` Chương trình TV · `j` Truyện tranh manga. Menu chỉ có 11 mục này. **Không còn phong cách cũ nào**: các phong cách cũ đã bị xoá khỏi code (file, menu, `?phongCach=`); giá trị lưu cũ trong `localStorage` coi như "Mặc định". Đừng tham chiếu, import hay bắt chước hợp đồng cũ nào ngoài hợp đồng trong tài liệu này.

Swatch (ô màu trong menu) nằm trong `DS` của `che-do.js`, dạng `mau: [nen, nhan]`. Muốn đổi thì ghi vào báo cáo.

Chọn chế độ:
- Mặc định lấy lựa chọn đã lưu, áp cho **mọi bài**.
- `?phongCach=<id>` (hoặc `?cheDo=<id>`) ghi đè khi kiểm thử và không được lưu; chỉ nhận `a`…`j` và `mac-dinh` (`?phongCach=mac-dinh` ép sân khấu mặc định; id khác bị bỏ qua).
- Đổi lựa chọn khi đang giảng: áp ở **ranh giới nhịp kế tiếp** (menu hiện "Sẽ đổi từ phần giảng tiếp theo"). Khi sân khấu tắt thì áp ngay.

---

## 2. Hợp đồng chế độ

```js
SenseiCheDo.dangKy({
  id: 'b',                        // 'a'..'j' (trung DS)
  ten: 'Điện ảnh',
  can: ['gsap'],                  // thu vien can nap truoc: 'gsap' | 'CustomEase' | 'SplitText' | 'Flip' | 'DrawSVGPlugin'
  batDau(lop, ctx) {},            // bat che do: lop = <div class="cd-lop" data-che-do="b"> tran het san khau, rong
  ketThuc(lop) {},                // tat (doi che do / tam dung / dung): go moi thu cua minh; dao dien tu kill tween + go lop
  dungNhip(nh, api) { return m },  // MOI NHIP: ve bo cuc nhip nay, tra doi tuong nhip m (null = de the mac dinh ve nhip nay)
  theChuong(info, api) { return true },   // the chuong (tuy chon): true = da ve; false / thieu = the mac dinh hien
  theXong(info, api) { return true },     // the ket bai (tuy chon), nhu tren
  trangThai(text, kieu) {},       // (tuy chon) "Sensei đang chuẩn bị" (kieu 'chuan-bi') / '' khi het
  doiCo(lop, ctx) {},             // (tuy chon) cua so doi co
});
```

Vòng đời:
1. **Chế độ bật / tắt** chỉ diễn ra ở ranh giới nhịp, tức lúc đầu `batDauNhip`.
   - Đạo diễn tạo `lop` (`#sanKhauGiang > .cd-lop[data-che-do]`), rồi gọi `batDau(lop, ctx)`.
   - Lúc tắt: `ketThuc(lop)`, kill mọi timeline trong `api.tl()` và `gsap.killTweensOf(lop *)`, rồi gỡ `lop`. Khi đổi chế độ lúc đang giảng, lớp cũ mờ đi trong 200 ms.
2. **Mỗi nhịp:**
   - Đạo diễn **vẫn dựng cảnh mặc định** dưới lớp (ẩn bằng `visibility`), nên máy khớp chữ, cue, khoá, máy trạng thái, T8 giữ nguyên hoàn toàn.
   - Sau đó gọi `dungNhip(nh, api)`. Hàm này **phải đồng bộ và nhanh** (< 8 ms): chỉ dựng DOM rồi đặt tween.
   - Chế độ **giữ DOM của mình xuyên các nhịp** (ô / tile tồn tại lâu), để tự biên đạo chuyển cảnh từ nhịp trước sang nhịp này (FLIP, morph). Đừng xoá sạch rồi vẽ lại mỗi nhịp.
3. **Đối tượng nhịp `m`** nhận sự kiện (mục 4) cho tới khi nhịp sau thay nó (`m.roi()`), hoặc tới khi tạm dừng / dừng.
4. **Tạm dừng / dừng / hết bài (T3):**
   - Chế độ bị **gỡ hẳn** (`ketThuc`, lớp mờ đi 160 ms), lưới tĩnh hiện lại, bấm được, y như mặc định.
   - Giảng tiếp: nhịp kế tiếp gọi lại `batDau` + `dungNhip`, với `nh.laBatDau = true`. Hãy vẽ lại bố cục của nhịp đó ngay, không cần "chuyển từ" trạng thái cũ.
5. **Nhịp không có builder** (`dungNhip` trả `null`, hoặc ném lỗi):
   - Sân khấu nhịp đó dùng thẻ mặc định (`data-cd-phu=""`, lớp ẩn).
   - Các file port **phải có builder cho mọi kind**. Fallback chỉ là lưới an toàn.

**Giữ nguyên nhịp độ, khoá và máy trạng thái của đạo diễn.** Chế độ chỉ đổi cách trình bày: không gọi `__lecture`, không bấm nút, không tự chuyển nhịp.

### 2.1 Vùng vẽ, mèo, thanh
- `lop` chiếm toàn bộ `#sanKhauGiang`, tức vùng giữa `.deck-top` và `.deck-bottom`. Khi chế độ vẽ một nhịp, sân khấu được đặt `[data-cd-phu="1"]` và **tràn hết bề ngang**, bỏ `max-width: 1180px`.
- Kích thước lấy bằng `api.khung()` → `{ w, h }`. Ví dụ: 1440×900 → 1440×776; 390×844 → 390×679.
- Hai thanh (trên và dưới) không bao giờ bị phủ, vì `lop` nằm trong sân khấu.
- **Mèo thật** (`js/sensei-cat-video.js`, `position: fixed`, `z-index` trên sân khấu) giữ nguyên chỗ app đặt, ở góc phải dưới.
  - `api.meo()` trả `{ x, y, w, h, W, H }` là hình chữ nhật góc mèo **trong toạ độ lop**, hoặc `null` nếu mèo ẩn.
  - Ví dụ: 1440×900 → khoảng `{x:1165,y:498..554,w:275}`; 390×844 → khoảng `{x:259,y:574,w:131}`.
  - Bố cục phải **chừa góc này**, không để chữ quan trọng dưới mèo.
  - Mode A đặt ô "Sensei" (lời thoại) ở góc phải dưới và đệm chữ bên phải bằng phần giao với góc mèo (`choMeo()`), nên mèo trông như đang ngồi trong ô của mình.
  - Không có API "đặt mèo chỗ khác", vì file mèo đang bị khoá.
- Phần tử của chế độ **không mang `id`** (trùng id là lỗi T-test). Dùng class có tiền tố riêng (`b-`, `c-` …), hoặc `data-*`.
- CSS **luôn** scope dưới `.cd-lop[data-che-do="<k>"]`. Không dùng `:root`, không đụng `.sk-*` của đạo diễn, trừ ô bài tập (mục 5).
- Phông: nạp bằng `@import` Google Fonts ở đầu `css/che-do/<k>.css` (xem `a.css`). Chữ Nhật dùng `var(--font-jp)` và bọc `lang="ja"` (`api.jp()` tự bọc).

### 2.2 Điện thoại 390×844
- Làm bố cục riêng cho dọc hẹp. Mode A: `st.dt = W < 640 || (W < 820 && H > W * 1.2)`, bản thiết kế 390×679, lề 10, khe 8.
- Không cuộn ngang, không chữ < 12 px (nhãn phụ được phép 10.5 px in hoa).
- Dải dưới cùng (khoảng y 573–669 trên 679) là chỗ mèo: đặt ô lời Sensei ở đó, chừa bên phải `api.meo().w`.

### 2.3 Giảm chuyển động
- `api.giam` là `true` khi `prefers-reduced-motion`.
- Khi đó: không FLIP, không nảy, không lắc. Đặt trạng thái cuối ngay (`gsap.set`), chỉ cho phép fade opacity ≤ 120 ms.
- `api.vietNet` tự vẽ nét ngay khi `giam` bật.
- Mode A dùng `const D = (s) => giam() ? 0 : s` và nhánh `if (giam())` trong `vaoO` / `hieu`.

### 2.4 Hiệu năng (60 fps máy trung bình)
- Chỉ tween `transform` / `opacity` / `clip-path`. Riêng ô bento được FLIP bằng `left/top/width/height` giống video: ≤ 10 ô, nội dung trong ô dùng đơn vị `cq*`.
- Không `filter: blur` trên vùng lớn, không `backdrop-filter`.
- Mọi tween nằm trong GSAP (`gsap.to/fromTo` hoặc `api.tl()`). Không `setInterval` / rAF riêng. Hẹn giờ theo nhịp thì dùng `api.hen(fn, ms)`: nó chết khi đổi nhịp / tạm dừng.
- Ảnh: `imageUrl` (webp Qwen 1:1) và `avatarUrl`. Dùng `object-fit: cover` trong ô, và Ken Burns chỉ `scale` (`kb`).

---

## 3. Thông tin nhịp `nh` và tiện ích `api` / `ctx`

`dungNhip(nh, api)` — các trường của `nh`:

| Trường | Ý nghĩa |
|---|---|
| `kind` | `vocab` · `kanji` · `grammar-intro` · `example` · `kaiwa-intro` · `kaiwa-run` · `kaiwa` · `quiz` |
| `data` | Mục giáo trình thật. **vocab** `{id, word, kanji, furigana, romaji, wordType, meaningVi, imageUrl?, accentNote?}`. **kanji** `{character, hanViet, strokeCount, onyomi[], kunyomi[], meaningVi, commonWords[{word,furigana,meaningVi}]}`; bài KANA thêm `{loai:'kana', romaji, meoNho, sosanh}` và `nh.laKana = true`. **grammar-intro** `{title, grammarFormula, explanation, teacherTips?, culturalNotes?}`. **example** `{id, tokens[{id,text,kanji?,furigana?,isKeyGrammar}], meaningVi}`. **kaiwa** một dòng `{id, speaker, speakerRole, avatarUrl, tokens[], meaningVi}`. **kaiwa-intro / kaiwa-run** = **mảng** dòng thoại. **quiz** `{id, question, options[4], correctIndex, explanation, hint?}` |
| `beat` | Nhịp gốc: `index`, `chapter` (`vocab`/`kanji`/`grammar`/`kaiwa`/`quiz`), `subIndex` (số slide ngữ pháp), `label`, `slide` (example: slide ngữ pháp chứa `grammarFormula`), `isChapterStart` |
| `congThuc` | grammar-intro / example: `{ phan:[{loai:'o'\|'chu', nhan, chu}], goc }` (tách từ `grammarFormula`, cùng chỉ số với cue G2/G3) hoặc `null` |
| `ghep` | example: `{ kieu:'ASSEMBLE', gan:[{loai, ei, tok:[i..]}], duoi:[i..] }` (câu ghép vào công thức) hoặc `{kieu:'DIAGRAM'}` |
| `ctx`, `i`, `n` | Vị trí nhịp trong buổi. `ctx.cacNhip` = mọi nhịp của bài (dùng cho dải "từ mới", thẻ chương…) |
| `chuong` | `{ ten, i, n }`, ví dụ `Từ vựng`, 2/30 |
| `bai` | Bài học: `title`, `lessonNumber`, `sceneImageUrl?` (tranh cảnh bài; bài KANA không có), `vocabList`, `kanjiList`, `slides`, `dialogue`, `exercises` |
| `capDo` | `N5`…`N1`, `KANA` |
| `laBatDau` | Nhịp đầu sau khi sân khấu bật: bắt đầu giảng / giảng tiếp / chế độ vừa bật. `nh.i === 0 && laBatDau && !isResume` là mở đầu buổi giảng: nên có bố cục **tiêu đề bài** như giây 0–5.6 của video. Mode A giữ tiêu đề tới khi Sensei đọc từ đầu tiên (V1), dự phòng 3.2 s sau tiếng đầu |
| `isResume`, `truoc` | Giảng tiếp; nhịp trước |
| `cues` | `[{id, loai, batBuoc}]`: các cue nhịp này sẽ bắn (xem mục 4.1) |

`api` (mỗi nhịp) = `ctx` (của `batDau`) + hẹn giờ theo nhịp. Các thành viên:

| Thành viên | Ý nghĩa |
|---|---|
| `gsap` | GSAP đã nạp (`can: ['gsap']`) |
| `giam`, `kho` | Giảm chuyển động; `'rong'\|'hep'\|'thap'` |
| `khung()`, `meo()` | Kích thước lop; góc mèo (mục 2.1) |
| `bayGio()` | Đồng hồ đạo diễn (giây, AudioContext = lúc **đang nghe thấy**) |
| `LEAD` | 0.08 s |
| `tre(tt, lead?)` | **Giây delay cho tween để tiêu điểm tới đúng lúc nghe**: `max(0, tt.T - lead - bayGio())` |
| `treT(T, lead?)` | Như trên, với thời điểm T tuyệt đối (karaoke) |
| `hen(fn, ms)` / `huyHen(id)` | setTimeout gắn thế hệ nhịp (chết khi đổi nhịp / tạm dừng) |
| `henLuc(T, fn, lead?)` | Chạy fn lúc `bayGio() >= T - lead` |
| `song()` | Nhịp còn sống? |
| `tl(opts?)` | `gsap.timeline` được đạo diễn kill khi tắt chế độ |
| `esc(s)`, `jp(s)` | Escape; escape + bọc cụm Nhật `<span lang="ja">` |
| `ruby(chu, doc)` | Ruby một từ (furigana chỉ trên chữ Hán, okurigana viết thẳng: luật RB) |
| `tok(t, i, ds)` | Html một token câu, có ruby đúng luật |
| `loaiTu(wordType)` | `noun` → `Danh từ`… |
| `tenChuong(ch, capDo)` | Tên chương (`kanji` ở bài KANA → `Chữ cái`) |
| `vaiTro(chu)` | Vai trò trợ từ / đuôi câu (`は` → `chủ đề`, `です` → `lịch sự (là)`) |
| `nghiaTu(tok, bai)` | Nghĩa ngắn của token nếu trùng từ vựng bài |
| `congThuc(fm)`, `ghepCau(ch, toks)` | Tách công thức / ghép câu (hàm thuần của `motion-canh-chu.js`) |
| `anhCau(toks, bai)` | Ảnh minh hoạ cho câu: từ vựng của bài trùng token và có `imageUrl`, không có thì `null` |
| `taiAnh(url)` | Nạp trước + decode ảnh → Promise, không reject |
| `vietNet(el, ch, {tocDo, tre})` | Vẽ chữ Hán / kana theo **thứ tự nét** (SenseiStrokes / KanjiVG) vào `el` bằng SVG `.cd-net` (lưới + nét mờ + nét vẽ dần bằng GSAP) → `{dur, svg}` hoặc `null`. Màu qua `--cd-net`, `--cd-net-mo`, `--cd-net-ke` |

---

## 4. Sự kiện gửi cho đối tượng nhịp `m`

Mọi phương thức đều **tuỳ chọn**. Lỗi trong đó được bắt và cảnh báo, không làm hỏng bài giảng.

| Phương thức | Khi nào |
|---|---|
| `m.cue(id, tt)` | Một cue của cảnh mặc định bắn. `tt = { T, via, dur, nen, con }`. **T** = lúc câu / từ đó **vang lên** (giây, đồng hồ đạo diễn). Cue bắn khoảng 120 ms trước T; `con` = T − lúc bắn. `via`: `khop` (nghe thấy chữ), `dauTien`, `congCu`, `tiLe`/`sauCue` (ước lượng), `thuTu`, `nen` (nén cuối nhịp: làm cho đủ khung cuối, **không chờ**). `dur` (ms) cho cue kiểu `doc` |
| `m.karaoke(ds, o)` | Cảnh mặc định chạy karaoke. `ds = [{ i, k, id, T, chu }]`: `i` = chỉ số token trong `data.tokens` (example / kaiwa), `T` = lúc token vang. `o = { ket, lan }` (`lan` 1 = đọc lần đầu, 2 = đọc lại) |
| `m.tro(idMuc, {T})` | Đạo diễn đưa con trỏ tới phần tử `st-<idMuc>` (vd `highlight_element` / `draw_on_board` của Sensei). `idMuc` là id giáo trình (token id, vocab id) |
| `m.loi(doan, raw, {luot})` | Lời Sensei (bản ghi sống). `raw` = toàn bộ lượt hiện tại. Dùng cho phụ đề / ô Sensei |
| `m.ghi(text, kieu)` | Sensei `write_on_board` |
| `m.congCu(name, args, {T})` | Mọi tool Sensei gọi (sau khi đạo diễn xử lý) |
| `m.dongThoai(line, i)`, `m.clip(id, info)` | kaiwa-run: dòng thoại đang phát; clip lồng tiếng |
| `m.het({tiep, gapMs})` | Hết nhịp (còn khoảng nghỉ trước nhịp sau). **Làm cho khung cuối đủ ngay** (mọi thứ chờ cue thì hiện), không làm ô trống |
| `m.oBaiTap(card)` | quiz, đến lượt học viên: trả **phần tử ô** mà đạo diễn sẽ đặt THẺ THẬT `#card-<id>` vào (mục 5) |
| `m.vaoCho(card, beat)`, `m.raCho()` | Vào / ra lượt học viên |
| `m.traLoi(exId, dung)` | Học viên trả lời (sau khi thẻ tự chấm) |
| `m.roi()` | Nhịp này bị thay / chế độ tắt |

`def.theChuong(info, api)`, với `info = { tenCu, tenMoi, chuong, meta, ds, tiep, capDo }`:
- `ds` = các nhịp của chương mới.
- Gọi trong khoảng nghỉ trước nhịp mở chương, sau `m.het()`.

`def.theXong(info, api)`, với `info = { bai, oBaiTap, hang: [{nhan, so, mau, jp, cham}], quiz: [{id, ketQua}], tongKet }`:
- Gọi sau nhịp cuối.

### 4.1 Khoá cue theo dạng nhịp (id do cảnh mặc định đặt)

Cue đến theo thứ tự nói, và **mọi cue bắt buộc chắc chắn đến**: bằng khớp chữ, hoặc dự phòng `tiLe` / `nen`. Cue loại `nhan` / `doc` có thể **bị bỏ** nếu lỡ quá 0.4 s: đừng để nội dung chỉ hiện nhờ các cue này. Một số id có thêm biến thể đuôi `r` (khớp riêng), vd `E3r`, `E3.1r`: so khớp theo tiền tố.

| Dạng | Id | Nghĩa (ví dụ N5-1) |
|---|---|---|
| vocab | `V0` | Sensei bắt đầu nói nhịp này ("Từ đầu tiên:") |
| | `V1` | Đọc từ lần 1 (私 / わたし) |
| | `V2` / `V2b` | Đọc lại (V2b là dự phòng 1.8 s sau V1) |
| | `V3` | Nói nghĩa ("nghĩa là tôi") |
| | `V4` | Mẹo / trọng âm (`accentNote`) |
| | `V5` | Thể từ điển (động từ) |
| kanji | `K0` | Bắt đầu |
| | `K1` | Tool `write_kanji` |
| | `K1b` | Nghe thấy chữ / Hán Việt: vẽ nét |
| | `K1m` | Chữ không có dữ liệu nét |
| | `K2` | Gọi tên Hán Việt ("Hán Việt là TƯ") |
| | `K3` | Nghĩa |
| | `K4` | Chiết tự |
| | `K5` | Âm On |
| | `K6` | Âm Kun |
| | `K7.i` | Từ ghép thứ i |
| kana (`laKana`) | `K0`, `K1`/`K1b`/`K1m` | Như kanji |
| | `K2` | Đọc romaji ("đọc là a") |
| | `K3` | Cách phát âm / nghĩa |
| | `K4` | Mẹo nhớ (`meoNho`) |
| | `K5` | Dễ nhầm (`sosanh`) |
| | `K7.i` | Từ ví dụ thứ i |
| grammar-intro | `G0` | Bắt đầu ("Mẫu câu: …") |
| | `G2.j` | Nói phần chữ thứ j của công thức (`congThuc.phan` với `loai:'chu'`, vd は, です) |
| | `G2c.j` | Hiện cách đọc trợ từ j (は → wa) |
| | `G3.j` | Nói ô thứ j (`loai:'o'`: N1, N2) |
| | `G2p.j` | Công thức không tách được: cụm Nhật thứ j |
| | `GM.k` | Bước biến hình thứ k (bảng chia) |
| | `G4.s` | Câu giải thích thứ s (`explanation` tách câu) |
| | `G5` | Lưu ý (`teacherTips`) |
| | `G6` | Văn hoá (`culturalNotes`) |
| example | `E0` | Bắt đầu ("Ví dụ:") |
| | `E1` | Đọc câu lần 1: kèm `m.karaoke` từng token |
| | `E2` / `E2b` | Đọc lại |
| | `E3*` | Ghép / vai trò token |
| | `E4.k` | Đọc trợ từ token k |
| | `E5` | Nói nghĩa câu |
| kaiwa-intro | `C1.p` | Gọi tên nhân vật p (theo thứ tự xuất hiện trong `data`) |
| | `C2.i` | Kể tới lượt thoại i |
| kaiwa-run | `R.i` | Tuỳ chọn: Sensei tự đọc dòng i khi lồng tiếng hỏng |
| | `m.dongThoai(line, i)` | Mỗi dòng đang phát |
| | `m.karaoke` | Token theo PCM thật |
| kaiwa | `F2` | Sensei đọc chậm lại (karaoke) |
| | `F3.k` | Token trọng tâm thứ k (theo thứ tự `isKeyGrammar`) |
| | `F4` | Nghĩa |
| quiz | `Q1` | Đọc câu hỏi |
| | `Q2.o` | Đọc đáp án o (0–3) |
| | `Q3` | Gợi ý (tuỳ chọn) |
| | `m.vaoCho` → `m.oBaiTap` → `m.traLoi` | Lượt học viên |

Ví dụ (Mode A, vocab):
```js
cue(id, tt) {
  const tre = api.tre(tt);          // delay de chuyen dong TOI CUNG luc nghe (lead 80 ms)
  if (id === 'V1') { tieuDiem('D', tre); }                 // phong o chu 160 ms + vien 160 ms
  else if (id === 'V3') { hienCho('C', 'V3', tre); tieuDiem('C', tre); }
}
karaoke(ds) { ds.forEach((x) => nhip(khoiCuaToken[x.i], api.treT(x.T))); }
```

### 4.2 Luật thời gian ("nhiều cái bị chậm")
- **Tiêu điểm / highlight phải tới cùng tiếng nói.** Luôn đặt tween bằng `delay: api.tre(tt)`, tức T − 80 ms. Không `setTimeout` thêm, không xếp hàng 600 ms như thẻ mặc định.
- Tween "vào" của phần tử tiêu điểm **≤ 200 ms**: phồng 140 ms + đàn hồi, viền 160 ms, mặt nạ chữ trồi 0.7 s nhưng thấy chữ ngay khung đầu. Phần "lắng" (settle) được phép dài hơn.
- Không **nối đuôi** hiệu ứng của cue sau vào hiệu ứng của cue trước. Hai cue gần nhau thì chạy song song.
- Nội dung **nhận diện** của nhịp (chữ, ảnh, cách đọc, âm On/Kun, từ ghép, dòng thoại, câu hỏi, đáp án) **hiện ngay khi vào nhịp** (so le 0.1–0.2 s). Cue chỉ đưa tiêu điểm.
- Nội dung "đợi được nói" (nghĩa, lưu ý, khối công thức) có **dự phòng**, để không có ô trống quá khoảng 3 s. Mode A: nghĩa hiện ở V3, hoặc 1.8 s sau V1, hoặc 3.2 s sau khi vào nhịp; khối công thức vào đúng G2/G3, dự phòng 1.2 s sau G0 / 2.3 s sau khi vào nhịp.

---

## 5. Bài tập: cổng thẻ thật

Khi tới lượt học viên (`vaoCho`):
1. Đạo diễn gọi `m.oBaiTap(card)`. Chế độ **trả về một phần tử bên trong lop** (vd ô lớn của câu hỏi, đã FLIP to ra).
2. Đạo diễn chuyển **chính** `#card-<id>` (bọc trong `.sk-cong.cd-cong`) vào ô đó. Kèm theo là **chân thẻ** `.sk-the-chan.cd-chan`: dòng "Đến lượt bạn…", gợi ý, "Đúng rồi!", nút **Bỏ qua** / **Tiếp tục ▸** với đếm ngược.
   - Handler, phím A–D / 1–4, chấm bài và nhận xét của thẻ **giữ nguyên**. Id vẫn duy nhất (lưới giữ chỗ bằng comment).
   - Khi ra khỏi lượt, tạm dừng hoặc dừng: thẻ và chân thẻ về chỗ cũ.
3. Chế độ chỉ **đổi kiểu** bằng CSS (xem `a.css` mục "o bai tap"):
   - `.cd-lop[data-che-do="k"] .sk-cong .qz-card`, `.qz-text`, `.qz-opts`, `.qz-opt` (+ `.is-correct`, `.is-wrong`), `.qz-key`, `.qz-opt-text`, `.qz-fb`.
   - Không đổi DOM của thẻ, không gắn listener lên thẻ.
4. `m.traLoi(exId, dung)`: phản hồi riêng của chế độ (tone ô, ✓ / ✕ trên ảnh, sóng tròn…).
- Trả `null` từ `oBaiTap` thì thẻ vào `.sk-the` mặc định, vốn đang ẩn dưới lớp. **Đừng làm vậy.**
- Ô bài tập cần `pointer-events: auto`. `chung.css` đã bật cho `.sk-cong` và `.cd-chan` trong lop khi `data-che="cho"`. Mọi thứ khác trong lop là `pointer-events: none`.

---

## 6. Khung mẫu (copy)

### `js/che-do/<k>.js`
```js
/* ==========================================================================
   Che do san khau <K> — "<Tên>" (port tu ban mau <duong dan>/index.html).
   Hop dong: scratchpad che-do/HUONG-DAN.md. Mau tham khao: js/che-do/s.js.
   ========================================================================== */
(function () {
  'use strict';
  const SC = window.SenseiCheDo;
  if (!SC) return;
  let L = null, C = null, G = null;          // lop, ctx (CDH), gsap
  const st = { W: 0, H: 0, dt: false, meo: null, nhip: null };

  function doKhung() {
    const k = C.khung();
    st.W = k.w; st.H = k.h;
    st.dt = st.W < 640 || (st.W < 820 && st.H > st.W * 1.2);
    st.meo = C.meo();                         // chua goc nay cho meo that
  }
  const D = (s) => (C.giam ? 0 : s);

  // ---- mot builder cho MOI dang nhip (vao nhip = bien dao tu trang thai cu -> bo cuc moi)
  const DUNG = {
    vocab(nh, api, m) { /* ve anh (nh.data.imageUrl), chu, cach doc, nghia ... */ },
    kanji(nh, api, m) { /* api.vietNet(o, nh.data.character, { tocDo: .45 }) luc K1 / K1b */ },
    'grammar-intro'(nh, api, m) { /* khoi theo nh.congThuc.phan; G2.j / G3.j dua khoi vao */ },
    example(nh, api, m) { /* token -> khoi (nh.ghep), karaoke */ },
    'kaiwa-intro'(nh, api, m) {}, 'kaiwa-run'(nh, api, m) {}, kaiwa(nh, api, m) {},
    quiz(nh, api, m) { /* cau hoi + 4 dap an; m.oBaiTap tra o cho the that */ },
  };
  const CUE = {
    vocab(m, id, tt, api) { const tre = api.tre(tt); if (id === 'V1') { /* tieu diem <= 200 ms, delay tre */ } },
  };

  SC.dangKy({
    id: '<k>',
    ten: '<Tên>',
    can: ['gsap'],
    batDau(lop, ctx) { L = lop; C = ctx; G = ctx.gsap; doKhung(); /* nen + o tinh (vd o Sensei) */ },
    ketThuc() { L = null; C = null; st.nhip = null; },
    dungNhip(nh, api) {
      const f = DUNG[nh.kind];
      if (!f || !L) return null;
      doKhung();
      st.nhip = nh;
      const m = {
        cue(id, tt) { const g = CUE[nh.kind]; if (g) g(m, id, tt, api); },
        karaoke(ds) { /* ds[k].T -> api.treT(T) */ },
        loi(doan, raw) { /* phu de / o Sensei */ },
        het() { /* khung cuoi du: hien moi thu dang cho cue */ },
        oBaiTap(card) { return nh.kind === 'quiz' ? /* phan tu trong L */ null : null; },
        traLoi(exId, dung) {},
        roi() {},
      };
      f(nh, api, m);
      return m;
    },
    theChuong(info, api) { /* bo cuc the chuong */ return true; },
    theXong(info, api) { /* bo cuc ket bai */ return true; },
  });
})();
```

### `css/che-do/<k>.css`
```css
/* Che do <K> — "<Tên>". Moi quy tac duoi .cd-lop[data-che-do="<k>"]; khong :root, khong id. */
@import url("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;600;700;800&display=swap");

.cd-lop[data-che-do="<k>"] {
  --k-nen: #...; --k-muc: #...; --k-nhan: #...;
  --cd-net: var(--k-muc);                     /* mau net chu cua api.vietNet */
  background: var(--k-nen);
  color: var(--k-muc);
  font-family: "Be Vietnam Pro", Inter, sans-serif;
}
.cd-lop[data-che-do="<k>"] [lang="ja"] { font-family: var(--font-jp); }
/* trang thai truoc khi GSAP chay (immediateRender) dat bang CSS: an san, khong nhap nhay */
.cd-lop[data-che-do="<k>"] .k-o { position: absolute; visibility: hidden; opacity: 0; }
/* o bai tap: the that doi kieu (khong doi DOM) */
.cd-lop[data-che-do="<k>"] .sk-cong .qz-card { background: transparent; border: 0; box-shadow: none; }
.cd-lop[data-che-do="<k>"] .sk-cong .qz-opt.is-correct { /* ... */ }
.cd-lop[data-che-do="<k>"] .sk-cong .qz-opt.is-wrong { /* ... */ }
/* dien thoai: lop co the dat data-hep="1" tu JS (vd a.js) */
@media (prefers-reduced-motion: reduce) { .cd-lop[data-che-do="<k>"] * { animation: none !important; } }
```

---

## 7. Harness kiểm thử

Thư mục `scratchpad/che-do/khung/` gồm:
- `cdp-lib.mjs`: Chrome headless qua `--remote-debugging-pipe`, http.server riêng ở cổng 3900–3999, TEMP ở `E:\sensei-tam\tmp`, giết đúng PID khi xong.
- `kiem-che-do.mjs`: harness chính.
- `chup-chuoi.mjs`: chuỗi ảnh để soi nhanh, xem mục 7.2.

### 7.1 `kiem-che-do.mjs`
```
node kiem-che-do.mjs <k> [kiem|anh|so-sanh|video|all] [--ra DIR] [--proto FILE] [--giay 20] [--them "&k=v"]
```

- **`kiem`** (khoảng 12 phút). Tất cả dùng `?noLive&moPhong&phongCach=<k>`:
  - N5-1 nhịp 0–6 liền mạch, không lỗi console.
  - Tạm dừng giữa nhịp: lưới tĩnh hiện, lop gỡ, `#slideContent` bấm được. Giảng tiếp: chế độ bật lại.
  - Quiz: thẻ thật nằm trong lop cùng chân thẻ. Trả lời sai rồi **Tiếp tục**, câu 2 trả lời đúng. Không trùng id. Dừng thì thẻ về lưới.
  - Đổi chế độ giữa bài: `SenseiCheDo.chon('mac-dinh')` giữ tới hết nhịp rồi đổi ở nhịp sau; chọn lại `<k>` thì bật lại.
  - Mỗi dạng nhịp của N5-10, N4-30, N1-3, KANA-1, KANA-5 đều do chế độ vẽ, không lỗi. Ảnh `kiem-<bai>-<kind>.jpg`.
  - Giảm chuyển động: vẫn chạy.
- **`anh`**: chụp 6 khoảnh khắc của video trên N5-1 thật (tiêu đề, 私, 先生, công thức, ví dụ, bài tập đúng) ở 1440×900 và 390×844 → `<khoanh>-1440.jpg`, `<khoanh>-390.jpg`.
- **`so-sanh`**: mở bản mẫu `index.html?render=1`, `__seek(4.9 / 10.4 / 21.1 / 28.0 / 35.9 / 51.5)`, chụp 1920×1080 → `mau-*.jpg`, ghép `[bản mẫu | 1440 | 390]` × 6 hàng → **`so-sanh.jpg`**. **XEM KỸ** và lặp tới khi giống video. Cần chạy `anh` trước.
- **`video`**: CDP screencast khoảng 20 s bài giảng mô phỏng N5-1 từ đầu (tự trả lời đúng khi tới quiz) → **`demo-<k>.mp4`** (30 fps, x264).
- Kết quả gom vào `ket-qua.json` (`phan.kiem.buoc[].dat`). Ảnh và video mặc định nằm trong `scratchpad/che-do/<k>/`.

### 7.2 Soi nhanh bằng `chup-chuoi.mjs`
```
node chup-chuoi.mjs --them "&phongCach=<k>" --bai N5-1 --tu 0 --den 3 --n 10 --buoc 1500 --ra E:/sensei-tam/tmp/x
```
Chụp một chuỗi ảnh mỗi 1.5 s. Ghép lưới bằng `ffmpeg -i c%02d.jpg -vf "scale=720:-1,tile=2x4"`.

Thêm hai script nhỏ:
- `node chup-the.mjs <k>`: thẻ chương (Từ vựng → Chữ Hán) và thẻ kết bài N5-1, ở 1440 và 390 → `the-chuong-*.jpg`, `the-xong-*.jpg`.
- `node kiem-menu.mjs`: nút / menu "Chế độ" (mở, phím ↓ / Esc, menu chỉ còn 11 mục, giá trị lưu cũ → Mặc định, chọn chế độ chưa có file, lưu qua nạp lại trang, điện thoại).

`kiem-che-do.mjs <k> video --tu np --ten -ngu-phap` quay đoạn bắt đầu từ mẫu câu đầu (`--tu` nhận `tu1 | kj | np | vd | kwi | kw | qz`).

### 7.3 Hồi quy mặc định (bắt buộc pass)
```
node scratchpad/motion/kiem-thu.mjs smoke T1 T3 T11 T13 T14 A2 A5 RB --them "&phongCach=mac-dinh"
```
Mất khoảng 40 phút.

### 7.4 Chẩn đoán trong trang
- `__motion.cheDo()` → `{ id, lop, phu, coCanh, meo, tl }`.
- `__motion.nhatKy()`: nhật ký cue (`nhip`, `id`, `via`, `T`, `firedCtx`).
- `SenseiCheDo.muon()` / `hienTai()`.

---

## 8. Checklist trước khi nộp (lời chủ dự án)
- [ ] Mọi khung hình kín khung như video: **không ô trống quá khoảng 3 s**, không nửa sân khấu trống ("trống").
- [ ] Không chữ mờ nửa chừng làm placeholder, không phần tử nảy bật đột ngột, không chữ bị cắt hoặc tràn ô ("nhìn hơi lỗi"). Soi ở cả 1440×900 và 390×844, với bài chữ dài (N1-3) và bài không ảnh (KANA).
- [ ] Highlight / tiêu điểm **tới cùng tiếng**: `delay = api.tre(tt)`, vào ≤ 200 ms ("nhiều cái bị chậm").
- [ ] Mọi dạng nhịp có builder; thẻ chương và thẻ kết bài có bố cục riêng.
- [ ] Quiz: thẻ thật trong ô, chấm đúng / sai, nút Tiếp tục / Bỏ qua bấm được.
- [ ] Tạm dừng → lưới tĩnh. Đổi chế độ giữa bài sạch. Giảm chuyển động chạy được.
- [ ] Mèo thật không che chữ quan trọng; không id trùng; CSS scope đúng.
- [ ] `kiem-che-do.mjs <k> all`: mọi `buoc.dat = true`, `so-sanh.jpg` giống video, có `demo-<k>.mp4`.
