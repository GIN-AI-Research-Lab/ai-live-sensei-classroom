---
name: trien-khai-che-do-san-khau
description: Quy trinh + yeu cau cua chu du an de lam / sua / duyet mot "che do san khau" (SenseiCheDo, concept A-J) cho app JLPT Sensei. Doc file nay truoc khi dung vao js/che-do/*.
---

# Triển khai "chế độ sân khấu" (SenseiCheDo) — tài liệu bàn giao

Tài liệu này để một AI khác (hoặc người) tiếp tục công việc mà không cần biết lịch sử hội thoại.
Ngày lập: 2026-10-01. Repo: `E:\ai-live-sensei-classroom`. Chủ dự án nói tiếng Việt; trả lời họ bằng tiếng Việt, ngắn gọn, nói thật số đo.

---

## 0. Trạng thái hiện tại (đọc đầu tiên)

| Hạng mục | Trạng thái |
|---|---|
| Khung `SenseiCheDo` (`js/che-do/che-do.js`, `css/che-do/chung.css`) + cầu nối trong `js/motion.js` | Xong, đã commit |
| Chế độ **A** Bento động | Xong, đã commit (`02c86a3`). Cần: bỏ phụ đề lời Sensei + ẩn nhận xét giáo viên ở bài tập (yêu cầu mới, chưa làm) |
| Chế độ **J** Truyện tranh manga | **Dở**, commit `5e32cb2` (WIP). Còn 11 nhịp ví dụ chạm vùng mèo, chưa bỏ phụ đề lời giảng. Chủ dự án bảo dừng để tập trung H |
| Chế độ **H** Giấy cắt lớp | **Đang làm, chưa commit**. `js/che-do/h.js`, `css/che-do/h.css`, `assets/che-do/h/` (nhạc + 13 SFX), `curriculum/che-do/h/`, `tools/tinh-chinh-che-do.mjs`. Chưa đạt: probe 41–63 FAIL, chuyển nhịp có khung trống ~700 ms, p95 frame 19 ms, khung >33 ms ~10/phút. Xem `bao-cao-h-hien-tai.md` |
| Chế độ B, C, D, E, F, G, I | Chỉ có **prototype video/HTML** (`E:\sensei-tam\demo2\<chữ>\`), chưa port |
| Đã đề nghị (chưa làm) | Hai sửa cho H: (1) thêm `BAL_MAC_DINH.h = ['.h-khong-bong']` vào `tools/che-do/do-bo-cuc.mjs`; (2) sửa nhỏ `js/motion.js` để khung mặc định KHÔNG dựng ngầm dưới lớp khi chế độ đã tự dựng nhịp (nguyên nhân chính khung >33 ms). Phải chạy lại hồi quy mặc định + A + J sau sửa |

Việc tiếp theo hợp lý: (a) hoàn thiện H đến 0 FAIL + 60 fps rồi commit; (b) chủ dự án kiểm tra H trên 1 bài; (c) áp bộ yêu cầu §2 cho A và J; (d) port các chế độ còn lại theo thứ tự đã gợi ý G, H, E, B, D, I, F, C (H làm trước); (e) chạy `tools/tinh-chinh-che-do.mjs` cho mọi bài.

---

## 1. Dự án là gì

Web JLPT tiếng Việt (HTML/CSS/JS thuần, `server.py`, không build). Một "Sensei" (mèo, clip Veo nửa người, nhép miệng theo PCM) giảng bài qua Gemini Live; "sân khấu bài giảng" đồng bộ hình với lời nói (cue). Trình độ: Nhập môn (KANA, 10 bài) → N5 → N4 → N3 → N2 → N1 (~100 bài, curriculum/<cấp>/<n>.json). Hội thoại có 28 nhân vật cố định (curriculum/nhan-vat.json), mỗi người một giọng Gemini cố định, chân dung 7 biểu cảm, nhép miệng bằng `js/avatar-noi.js`. Nút loa: câu thoại → giọng nhân vật; mọi thứ khác (từ vựng, ngữ pháp, kanji, bôi đen) → Sensei đọc và mèo nhép miệng (`js/sensei-doc.js`).

"Chế độ sân khấu" = 10 concept hình ảnh (A–J), chọn ở nút "Chế độ" trên header; mỗi chế độ chiếm cả vùng sân khấu, vẽ full-frame giống video mẫu nhưng chạy **sống** theo cue của Sensei với dữ liệu thật của bất kỳ bài nào.

10 concept: A Bento động · B Điện ảnh · C Bản đồ tư duy · D Vui nhộn game · E Kính cực quang · F Sổ tay phác thảo · G Poster Nhật Bản · H Giấy cắt lớp · I Chương trình TV · J Truyện tranh manga. Video mẫu (bài N5-1, 59 s, có giọng + nhạc): `E:\sensei-tam\demo2\final\video-<chữ>-am-thanh.mp4`; prototype HTML: `E:\sensei-tam\demo2\<chữ>\` (bản H cũng sao trong `tools/che-do/prototype-h/`). Tổng hợp: `tong-hop-a-j-ngan.mp4`, `tong-hop-a-j-chi-tiet.mp4`.

---

## 2. YÊU CẦU CỦA CHỦ DỰ ÁN (tổng hợp, bắt buộc)

### 2.1 Giống video mẫu
- "Phải giống hệt video": bố cục, màu, thang cỡ chữ, đường cong chuyển động, hiệu ứng chuyển cảnh. Dùng cùng hằng số GSAP/ease/duration với prototype; bảng đo vị trí các vùng so với prototype, **lệch ≤ 10 %**; làm sheet so sánh cạnh nhau (live vs prototype) và MỞ NHÌN bằng mắt.
- Không được: chữ to nhỏ lộn xộn, màu khó nhìn, animation khó nhìn, chữ bị đè/cắt/che, vùng trống lớn ("trống", "lỗi"). Khung phải luôn **đầy** như video chuyên nghiệp.
- Các lần bị từ chối trước đó: pc1–pc7 (bị xóa) vì "trống và lỗi"; A/J lần đầu vì chữ lộn xộn, đè, ngữ pháp rối.

### 2.2 Nội dung hiển thị
- **Bỏ** phụ đề lời Sensei đang nói (dải 2 dòng, bong bóng chữ chạy theo lời) vì chậm và không khớp.
- **Bỏ** lời nhận xét của giáo viên sau khi trả lời bài tập ("Đúng rồi!", "Chưa đúng…"); chỉ hiện đáp án đúng, lời giải thích vì sao, gợi ý. Thầy nói miệng.
- **Giữ nguyên** mọi nội dung bài: từ vựng (chữ, furigana, romaji, nghĩa, mẹo), kanji (nét, âm On/Kun, từ ghép), ngữ pháp (công thức, trợ từ được tô khi nói, giải thích), ví dụ (token + furigana + nghĩa), hội thoại, ghi chú.
- Từ vựng thiếu ảnh: ẩn ô ảnh và dàn lại bố cục, không để trống. Ảnh minh họa Qwen là webp nền kem `#f0ebe1`: đặt trên ô kem cùng màu hoặc `mix-blend-mode: multiply` (nền sáng).

### 2.3 Đồng bộ lời nói
- Highlight/focus phải theo kịp giọng: bắn tại `cue − ~80 ms` (`api.tre(tt)`), chuyển động nhấn ≤ 200 ms (H dùng 140 ms), ease-out. Không bao giờ chờ trang trí trước khi hiện thứ Sensei đang nói. Không có phần tử nửa trong suốt "chờ" (hoặc hiện hẳn hoặc không hiện).
- Hội thoại: **nhân vật nhép miệng đúng lượt**, đúng giọng cố định, chân dung dùng `SenseiAvatarNoi` + `avatarUrl` từng dòng. Mọi thứ khác: Sensei (mèo) đọc và nhép.
- Nhép miệng đã đo (open p50 −14 ms, p90 +16 ms, giọng Charon). Không được làm hỏng cổng đọc `SenseiDoc`.

### 2.4 Bài tập (quiz)
- Dùng **thẻ thật** `#card-<id>` chuyển vào ô `m.oBaiTap` (không bao giờ clone), chỉ đổi giao diện bằng CSS. Đề AI chỉ sinh khi bấm "Đổi đề khác" (không tự sinh khi mở tab). Đề có sẵn nằm ở `exercises[]` của bài (question, options, correctIndex, explanation, hint).
- Tinh chỉnh trước được cho đề có sẵn; đề AI dùng tự co chữ lúc chạy.

### 2.5 Tinh chỉnh theo từng bài (quyết định mới)
- Phần chung (màu, nút, font, nền) là file chung. Cỡ chữ, vị trí, hiệu ứng, độ trễ **tinh chỉnh riêng từng bài**, lưu `curriculum/che-do/<chế độ>/<cấp>-<bài>.json` kèm `hash` nội dung bài (FNV-1a). Thiếu file hoặc hash lệch → tự co chữ (không bao giờ hỏng). Công cụ tự đo `tools/tinh-chinh-che-do.mjs` ghi các file này; chỉ bài còn lỗi mới xử lý tay. Nhịp đầu phải dùng cấu hình (nạp trước), không rơi về auto-fit.
- Chữ AI sinh (đề trắc nghiệm mới, lời giảng) không tinh chỉnh trước được.

### 2.6 Âm thanh
- Mỗi chế độ có nhạc nền riêng (loop, ≤ ~1,5 MB mp3/ogg) và SFX chuyển cảnh/điểm nhấn, tái tạo từ bộ nhạc/SFX của video mẫu (`E:\sensei-tam\demo2\final\mayam\`, `nhac\`, `sfx\`). WebAudio, dùng `AudioContext` của `__audioEngine` nếu có; **không** đi qua bus phân tích nhép miệng của mèo. Nhạc tự hạ khi Sensei nói (≈ −20 dB so với giọng; attack 60 ms, giữ 280 ms, nhả 350 ms), dừng khi tạm dừng/đổi chế độ, có nút tắt tiếng nhỏ (localStorage), mở khóa theo cử chỉ đầu tiên. SFX không được trễ so với chuyển động.

### 2.7 Hiệu năng (cực kỳ quan trọng — chủ dự án thấy giật nhẹ bằng mắt)
- Mục tiêu 60 fps ổn định: p95 ≤ 16,7 ms, không khung > 33 ms khi chuyển cảnh, ở máy thường; giảm CPU 4× vẫn chấp nhận được. Chỉ animate `transform`/`opacity` (thêm `stroke-dashoffset`/`clip-path` nếu cần); không blur/backdrop-filter/filter cả màn hình; không canvas vẽ mỗi khung; không đổi width/top/left; ít will-change; DOM nhỏ; `contain: layout paint style` cho lớp. Có bản nhẹ cho điện thoại.
- Ghi nhận ở H: dựng nhịp từng 85–170 ms (đã xuống 2–8 ms nhờ đo chữ bằng canvas, dựng cảnh rời rồi gắn theo lô); còn lại: đạo diễn dựng ngầm cảnh mặc định dưới lớp + tính lại style ~28 ms/lần (~940 phần tử).

### 2.8 Responsive
- Điện thoại 360×740, 390×844, 430×932 (kể cả xoay ngang 844×390: chữ ≥ 13 px, không đè), máy tính bảng, laptop 1280×720, 1440×900, 1920×1080, siêu rộng 2560×1080 (21:9), cửa sổ cao hẹp. Không chỗ trống, không đè, không bị cắt ở mọi cỡ.
- Thang cỡ chữ tối thiểu (1440×900): từ chính ≥ 200 px (vocab), câu ví dụ ≥ 84 px, công thức ≥ 110 px, nghĩa tiếng Việt ≥ 44 px (co xuống 32 chỉ khi rất dài), dòng phụ ≥ 20 px, không gì < 14 px (nhãn trang trí 11–12 px). Điện thoại: chính ≥ 28 px, phụ ≥ 15 px, không gì < 13 px. Nội dung ngắn thì phóng to cho đầy, dài thì co xuống nhưng không dưới mức tối thiểu, ngắt giữa các từ.
- Vùng mèo (`api.meo()`) luôn để trống, không chữ nào chạm vào. Nội dung phải dành ≥ 16 px cách vùng mèo.

### 2.9 Chung
- Giao diện mặc định (`&phongCach=mac-dinh`) không được đổi; tạm dừng → quay về lưới tĩnh; đổi chế độ sạch; reduced motion; id duy nhất.
- Bản commit: kết thúc bằng `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` (hoặc model đang dùng). Không commit khi chưa kiểm tra độc lập.

---

## 3. AN TOÀN (không thương lượng)

- KHÔNG đọc/mở/in `.env` hoặc `env.js` hay bất kỳ khóa API nào; không ghi khóa vào đâu. KHÔNG mở phiên Gemini Live trong test (dùng `?noLive&moPhong`; xem thêm `&hat=7&sensei=video`).
- Không bật Funnel khi `ALLOWED_HOSTS` chứa tên ts.net. Máy ảo GCP: chỉ spot, luôn dừng/xóa khi xong, hỏi trước khi đổi chi phí (hiện **đã xóa hết VM và ổ đĩa**; pipeline lưu ở `tools/anh-ai/`).
- Ổ C: gần đầy → `set TEMP=E:\sensei-tam\tmp`, `TMP` tương tự. Không ghi gì vào C:.
- Chrome headless CHỈ bằng `--remote-debugging-pipe` + `--user-data-dir` riêng (nhiều agent chạy song song, cổng cố định bị cướp). Agent song song dùng dải cổng khác nhau (H đã dùng 9700–9749, server tĩnh 3900–3999).
- Không `git commit/stash/reset` bên trong agent con; người điều phối mới commit sau khi tự kiểm.
- Không sửa `js/khau-hinh.js`, `js/sensei-cat-video.js`, `js/audio-engine.js`, `server.py`, nội dung `curriculum/*.json` trừ khi được yêu cầu rõ. `vendor/` (GSAP 3.15 ở `vendor/gsap/`) bị git-ignore **có chủ ý**; nhớ đây là phụ thuộc phải có sẵn khi triển khai.
- Chỉ ngoại lệ đã được chủ dự án cho phép riêng: chạy `js/tao-tieng-demo.js` trong Chrome headless để tạo giọng Sensei thật cho video demo. Không áp dụng cho việc khác.

---

## 4. Kiến trúc chế độ (tóm tắt; chi tiết đầy đủ: `HUONG-DAN-API.md`)

- `window.SenseiCheDo.dangKy({id, ten, can, batDau, ketThuc, dungNhip, theChuong, theXong, ...})`. Khung nạp lười `js/che-do/<k>.js` + `css/che-do/<k>.css`, nút/menu "Chế độ" trên header, lưu `localStorage['sensei_che_do']`; ép thử qua URL `?phongCach=<id|mac-dinh>`.
- Mỗi nhịp (beat) có sự kiện: `cue`, `karaoke`, `tro`, `loi`, `ghi`, `congCu`, `dongThoai`, `clip`, `het`, `oBaiTap`, `traLoi`, `raCho`, `roi`. Các loại nhịp: tiêu đề/chapter, vocab, kanji/kana, grammar-intro, example, kaiwa-intro/kaiwa-run/kaiwa, quiz, finish. `dungNhip` có thể trả `null` cho loại nhịp không làm được (khi đó cảnh mặc định hiện) — phải ghi trong báo cáo.
- `js/motion.js` có ~15 móc nối (bridge) gọi vào chế độ. Mốc thời gian: `api.tre(tt)` = cue − ~80 ms. `api.meo()` = hình chữ nhật mèo thật. `api.vietNet` để hoạt hình nét kanji.
- Thẻ chương và thẻ kết đi qua `theChuong`/`theXong`.
- Mẫu tham khảo đã hoàn chỉnh: `js/che-do/a.js` + `css/che-do/a.css` (thang chữ cố định, hằng số GSAP của prototype). H có nguồn gốc tách file: `src/h-1..8.js` + `h.src.css` trong thư mục làm việc của agent, ghép bằng `build.py` (⚠ thư mục này nằm ở scratchpad tạm, **có thể mất**; nếu mất, sửa trực tiếp `js/che-do/h.js`/`css/che-do/h.css`).
- Dữ liệu: `curriculum/<cấp>/<n>.json` có `title, vocabList, kanjiList, slides, dialogue, exercises`. Mỗi từ có `imageUrl`; mỗi câu thoại có `avatarUrl`. Chạy lại `tools/gan_anh.py` mỗi khi build lại curriculum.

---

## 5. Công cụ đo/kiểm (đã sao vào repo: `tools/che-do/`)

> ⚠ Một số script còn **đường dẫn scratchpad cứng** (tìm chuỗi `Temp\claude` / `scratchpad`; ví dụ `tools/che-do/do-bo-cuc.mjs` dòng ~84, mặc định thư mục `khung`). Sửa lại cho khớp máy mới, hoặc đặt biến môi trường nếu script hỗ trợ. Luôn đọc phần đầu mỗi script trước khi chạy.

| Công cụ | Việc | Ghi chú |
|---|---|---|
| `tools/che-do/do-bo-cuc.mjs <chế độ> --ra out.json [--bong <css>]` | **Probe bố cục tự động**: bài đại diện + nội dung xấu nhất ("stress"), 1440×900 và 390×844. Báo FAIL/WARN: CLIPPED, TEXT-OVERLAP, ON-CAT, SMALL, EMPTY-AREA, MISSING-TOKENS, PLACEHOLDER, FADED-TEXT, BLANK-FLASH, BALLOON-*; chuyển cảnh lấy mẫu mỗi 100 ms (thời gian tới nội dung đầu, số phần tử chuyển động đồng thời) | exit 1 nếu còn FAIL, ghi `.md` cạnh `.json`. Mục tiêu 0 FAIL |
| `tools/che-do/khung/kiem-che-do.mjs <k> all` | Harness: 14 bước (nạp, từng loại nhịp, tạm dừng, quiz portal, đổi chế độ, console) cho N5-1 và N4-30/KANA-5, ra `so-sanh.jpg` | 14/14 phải đạt |
| `tools/che-do/khung/kiem-man-hinh.mjs` | Ma trận 10 cỡ × 7 loại nhịp | ra `chup/man-final` |
| `tools/che-do/khung/perf.mjs` | Đo frame: p50/p95/p99, số khung >20/>33 ms mỗi phút, longtask; CPU 1× và 4× | chạy lúc máy rảnh, lặp ≥ 3 lần |
| `tools/che-do/khung/quiz.mjs`, `quiz-geom.mjs`, `do-quiz.mjs` | Kiểm thẻ bài tập, hình học, ẩn nhận xét | |
| `tools/che-do/khung/chup-*.mjs`, `xem-nhanh.mjs` | Chụp khung / dải khung | để MỞ XEM bằng mắt |
| `tools/che-do/motion/kiem-thu.mjs smoke T1 T3 T11 T13 T14 A2 A5 RB --them "&phongCach=mac-dinh"` | Hồi quy giao diện mặc định | phải đạt hết |
| `tools/tinh-chinh-che-do.mjs <chế độ> <bài…>` | Đo từng nhịp, ghi cấu hình riêng từng bài | |
| `node --check js/che-do/<k>.js` | Cú pháp | luôn chạy |
| Test chung của repo | `tools/kiem_*.test.mjs`, `kiem_nhan_vat.py` (giọng/nhân vật), `kiem_loa.test.mjs` (nút loa 29/29) | chạy khi đụng audio/avatar |

Server tĩnh để test: `python -m http.server <cổng 3900–3999> --bind 127.0.0.1` ở gốc repo (hoặc `server.py`, người dùng đang chạy cổng 3000). URL test: `http://127.0.0.1:<cổng>/?noLive&moPhong&hat=7&sensei=video&phongCach=<k>`.

---

## 6. QUY TRÌNH LÀM MỘT CHẾ ĐỘ (đã dùng để làm H, tuần tự)

**Bước 0 — chuẩn bị**: đọc `HUONG-DAN-API.md`, `QUY-TAC-AGENT.md`, `KHUON-BRIEF.md` (rules chung), mode A làm mẫu, prototype của concept (index.html + js/css + video + strip). Xác định vùng bố cục từ video: đo từng vùng (x,y,w,h theo % khung), thang chữ, bảng màu, các tween (target, duration, ease).

**Bước 1 — viết brief** (nếu giao cho agent): dùng `KHUON-BRIEF.md`, điền concept `{k}`, mô tả "look", rủi ro riêng, danh sách file được sửa (chỉ `js/che-do/<k>.js`, `css/che-do/<k>.css`, `assets/che-do/<k>/`, `curriculum/che-do/<k>/`), yêu cầu §2, an toàn §3. Nói rõ lệnh test bắt buộc và định dạng báo cáo (§7).

**Bước 2 — dựng bản đầu**: đăng ký chế độ; làm builder cho từng loại nhịp (vocab, kanji/kana, grammar-intro, example, kaiwa×3, quiz, chapter, finish); lấy hằng số tween của prototype; định tuyến cue qua `api.tre`; portal thẻ quiz thật vào `oBaiTap`; kaiwa dùng `SenseiAvatarNoi`; tạm dừng → lưới tĩnh. Cảnh nền nặng (ví dụ diorama H) vẽ 1 lần ra ảnh.

**Bước 3 — probe + sửa**: chạy `do-bo-cuc.mjs`; sửa theo thứ tự FAIL trước (CLIPPED, TEXT-OVERLAP, ON-CAT, MISSING-TOKENS, EMPTY, BLANK-FLASH, SMALL), rồi WARN rẻ. Mỗi lần sửa chạy lại cả probe lẫn harness. Lặp ≥ 3 vòng. Phân biệt lỗi thật với "probe đo lúc đang animate": làm cho phép đo hợp lệ (đợi ổn định) chứ không che lỗi; bằng chứng bằng ảnh.

**Bước 4 — so với video**: sheet cạnh nhau cùng nhịp; bảng đo vùng lệch ≤ 10 %; so chuyển động (tween, thời lượng, ease, thứ tự) bằng cách chụp chuỗi khung của cả hai. MỞ ẢNH XEM. Người làm cuối cùng của H nhận là "chưa mở bảng ảnh cuối" — đừng lặp lại sai đó.

**Bước 5 — responsive**: chạy ma trận cỡ màn hình (§2.8), cả xoay ngang. Sửa chỗ trống (phóng nội dung), đè/cắt (co chữ, xuống dòng giữa từ, tối thiểu §2.8).

**Bước 6 — hiệu năng**: `perf.mjs` trước/sau, ≥ 3 lần, máy rảnh. Săn thủ phạm: filter/blur/shadow lớn, `mix-blend-mode`, `clip-path` lớp lớn, SVG filter, quá nhiều lớp `will-change`, animate thuộc tính layout, JS trong tween tick, DOM lớn, dựng cảnh mặc định ngầm. Sửa → đo lại.

**Bước 7 — âm thanh**: làm nhạc nền + SFX (xem §2.6); đo gain khi Sensei nói/im, độ lệch SFX; đảm bảo dừng sạch.

**Bước 8 — tinh chỉnh theo bài**: cài loader (hash) + chạy `tinh-chinh-che-do.mjs` cho bài mẫu (N5-1, N5-10, N4-30, N1-3, KANA-5), rồi toàn bộ; xử lý tay các bài còn lỗi.

**Bước 9 — hồi quy** (do người điều phối tự chạy, không tin báo cáo): smoke mặc định, harness của A và J, test avatar/loa nếu đụng.

**Bước 10 — chủ dự án kiểm**: báo "H xong bài N5-1" kèm cách mở (`?phongCach=h` hoặc menu Chế độ → H); chỉ commit sau khi họ xem hoặc đã đo độc lập đạt. Ghi ghi nhớ (memory) khi có quyết định mới.

---

## 7. QUY TRÌNH REVIEW (người điều phối, dừng ở lỗi đầu tiên)

1. **Phạm vi**: `git diff --stat`; file nằm ngoài danh sách được sửa → loại phần đó; đụng `.env`, `env.js`, `server.py`, curriculum → loại cả task.
2. **Bí mật/an toàn**: grep diff tìm `apiKey`, `AIza`, `key=`, `eval(`, `innerHTML` với dữ liệu thô, URL CDN.
3. **Cú pháp**: `node --check`.
4. **Test độc lập** (tự chạy, không tin báo cáo): hồi quy mặc định; `kiem-che-do.mjs <k> all`; `do-bo-cuc.mjs <k>`; `perf.mjs`.
5. **Nhìn ảnh**: mở sheet so sánh + 3–4 ảnh gốc ở 1440×900 và 390×844 (và 844×390). Loại nếu: vùng trống, chữ nửa mờ, chữ cắt, chữ đè, mèo bị che, furigana sai, tương phản kém.
6. **Thời gian**: highlight rơi đúng chữ đang nói (cue − ~80 ms); focus ≤ 200 ms; xem log harness.
7. **Hiệu năng**: p95 ≤ 16,7 ms; khung >33 ms khi chuyển cảnh = 0.
8. **Kết luận**: ACCEPT (người điều phối commit) / FIX (danh sách đánh số trả lại) / REJECT. Ghi 1 dòng nhật ký: task, kết luận, số vòng sửa, lỗi hay gặp.

Bài học đã thấy:
- Agent hay báo "đạt" khi chỉ test một phần; luôn tự chạy lại. Báo cáo phải tách **đã đo** và **chưa kiểm**.
- Khi bàn giao cho model yếu hơn (đã thử Gemini 3.8 Flash qua Antigravity CLI `agy`): chất lượng kém, từng làm hỏng cú pháp (thừa dấu `}`) vì không chạy được `node --check`, lệnh shell bị tự từ chối ở chế độ print; chủ dự án quyết định **bỏ Gemini**, dùng Claude (Sonnet 5.5, effort high) làm trực tiếp. Không quay lại hướng đó nếu không được yêu cầu.
- Probe có thể có dương tính giả (nhãn ghi chú bị nhầm là bong bóng → dùng `--bong`); phần tử chỉ mờ 0,7 trong 100 ms có thể lọt (quy tắc FADED cần ≥ 600 ms).

---

## 8. Tài sản liên quan (ngoài chế độ)

- Ảnh minh họa Qwen: `assets/minh-hoa/` (1.249 webp); pipeline GCP lưu ở `tools/anh-ai/` (README, config, prompts) — VM đã xóa.
- Nhân vật: `curriculum/nhan-vat.json`, `assets/minh-hoa/nv/` (rig 252 ảnh, 7 biểu cảm), `js/avatar-noi.js`, `js/voices.js`, `js/voice-actors.js`; trang nghe thử `index.html?ngheGiong=1`.
- Video demo có tiếng: `E:\sensei-tam\demo2\final\` (`ghep-tieng.py`, `dung-tong-hop.py`, `loi-doc-sua.json`, `HUONG-DAN-GHEP.md`, `HUONG-DAN-TAO-TIENG.md`). Lưu ý 5 dòng lời đọc không khớp phụ đề từng chữ (mau-cau-1, mau-cau-2, vi-du-phu-dinh-1, cau-hoi-1, ket-bai-1); `js/tao-tieng-demo.js` còn nhúng bản lời dài cũ.
- Bản ghi nhớ của Claude: `C:\Users\OS\.claude\projects\E--ai-live-sensei-classroom\memory\` (chỉ mục MEMORY.md; đặc biệt `project_che_do.md`, `feedback_stage_style_direction.md`, `project_avatar_noi.md`, `project_headless_harness.md`).

## 9. Việc chưa làm / cần chủ dự án

- Nghe thử các video có tiếng (chưa ai nghe, mới đo bằng số); chọn giữ phụ đề hay dựng lại theo lời đọc mới.
- Nghe giọng 30 giọng Gemini (`?ngheGiong=1`) để xác nhận giới tính; "Nghe thử cảm xúc", "Nghe thử nút loa".
- Quyết định có làm giáo viên 3D (VRM/three.js) thay mèo hay chỉ nâng cấp chân dung ảnh phẳng (thở, chớp mắt, nghiêng đầu). Mới đề xuất; chưa làm.
- Chưa commit: `tools/anh-ai/`, `.geminiignore`, `GEMINI.md` (có thể xóa), `assets/sensei-meo/3d/meo-1234-chi-tiet-*.png`, toàn bộ H, thư mục `docs/che-do/` và `tools/che-do/` mới sao vào.
- WSL: chủ dự án tự chạy lệnh thu vhdx (`wsl --shutdown`, diskpart compact, `wsl --manage Ubuntu --set-sparse true`).
