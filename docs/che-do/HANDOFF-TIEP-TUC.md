# Bàn giao để tiếp tục (tạo 2026-10-05 08:30, trước khi đổi tài khoản Claude)

Đọc file này TRƯỚC. Bản sao: `E:/sensei-tam/handoff/HANDOFF-TIEP-TUC.md`. Trả lời chủ dự án bằng **tiếng Việt**.

## 1. Dự án và quyết định của chủ dự án
- App JLPT tiếng Việt, mèo "Sensei" giảng qua Gemini Live. Các **chế độ sân khấu** (full-frame, `js/che-do/<k>.js` + `css/che-do/<k>.css`) do đạo diễn `js/motion.js` điều khiển theo lời Sensei.
- Đã chốt: **bỏ A và J** (code còn trong repo, chưa commit, còn trong menu: chưa quyết ẩn hay xóa). **Giữ H "Giấy cắt lớp" và S "Bảng đen lớp học"** và làm tới mức production.
- 20 concept video (A–T) nằm ở `docs/concept-moi/` (lưới, tổng hợp). Chủ dự án chọn S để thử và đã port thành chế độ thật `s`.
- Tiêu chuẩn chất lượng (cứng): 0 FAIL và 0 WARN; không đè lớp; chữ dễ đọc, không cắt/che/chạm viền; lề cân đối; không thừa chỗ trống; hiệu ứng phù hợp, không lỗi; không có phụ đề lời Sensei trên sân khấu. Xem bộ nhớ `feedback_layout_quality_bar.md`.
- Yêu cầu mới nhất: **giao diện lúc chưa giảng (thẻ tĩnh) phải đồng nhất với chế độ đang chọn: nền GIỐNG HỆT bản đang giảng (có thể động) và bố cục vừa màn hình.**
- Chưa commit (chủ dự án chưa yêu cầu). Không đọc `.env`/`env.js`. Không mở Gemini Live thật: chỉ `?noLive&moPhong&phongCach=<k>`. Tải file cần hỏi phép. Trả lời tiến độ kèm bảng và ETA, không đoán kết quả chưa có.

## 2. Trạng thái (08:30 ngày 2026-10-05)
| Hạng mục | H | S |
|---|---|---|
| Sân khấu, bộ 13 bài (KANA-1,KANA-5,KANA-10,N5-1,N5-13,N4-29,N4-35,N3-2,N3-20,N2-4,N2-8,N1-3,N1-15) | 0 FAIL / 0 WARN (sau sửa vòng 1) | 0 FAIL / 0 WARN |
| Kiểm lại trên 24 bài mới (set B, C) | CHƯA | S set B và C: 0 FAIL / 0 WARN ở lần chạy trước. Sau đó S qua thêm 1 vòng soát + sửa (bị dừng giữa chừng) → cần kiểm lại |
| Soát thị giác 5 góc (desktop, phone, motion, stress, robustness) | 69 phát hiện (10 blocker, 28 major, 31 minor): `E:/sensei-tam/handoff/findings-h-stage.json`. Agent sửa vòng 2 bị cắt giữa chừng → code H có thể chứa sửa DỞ chưa kiểm | 55 phát hiện đã sửa (vòng 1); vòng soát lặp lần 2 bị dừng giữa chừng |
| Giao diện tĩnh (`h-tinh.css/js`, `s-tinh.css/js`) | Xuất bản, nền khớp 0 sai biệt điểm ảnh, 9 kích thước màn hình đạt | Xuất bản, tương tự |
| Quét đủ 110 bài × 2 màn hình | CHƯA (lần quét cũ lúc code cũ: 7 FAIL / 698 WARN, đã lỗi thời) | CHƯA |
Kiểm tra hồi quy `kiem-che-do` (14 bước) ở thời điểm bàn giao: xem `E:/sensei-tam/handoff/kiem-h.log`, `kiem-s.log` và mục 7.

## 3. Bản đồ file
- Chế độ: `js/che-do/h.js` `s.js`, `css/che-do/h.css` `s.css`, ảnh `assets/che-do/s/*.webp`, `assets/che-do/h/`.
- Giao diện tĩnh: `js/che-do/h-tinh.js` `s-tinh.js`, `css/che-do/h-tinh.css` `s-tinh.css`. **Móc nối:** `js/che-do/che-do.js` (tập `CO_TINH={h,s}`, hàm `datDauTinh()` đặt `<html data-che-do="h|s">` ngay khi chọn chế độ, `nap()` nạp thêm `<k>-tinh.css/js`). Lớp nền tĩnh KHÔNG được mang class `cd-lop` (công cụ dùng `document.querySelector('.cd-lop')`).
- Các file chung đã sửa trong chuỗi việc: `js/motion.js` (api.coMeo...), `js/sensei-cat-video.js` (datCo), `js/sensei-avatar-hub.js`, `js/avatar-noi.js`, `js/app.js`, `js/gemini-live.js`, `js/mo-phong.js`, `js/kanji-strokes.js`, `curriculum/n4/31.json`, `tools/n4_b31.py`.
- Công cụ: `tools/che-do/` (`quet-bai.mjs`, `do-bo-cuc.mjs`, `quet-trang.mjs`, `khung/kiem-che-do.mjs`, `khung/cdp-lib.mjs`, `khung/dbg.mjs`, `khung/chup-cac-nhip.mjs`). Công cụ đã nới để nhận id `s` (regex `[a-z]`), `BAL_MAC_DINH.s = ['.s-khong-bong']`.
- Sao lưu code lúc bàn giao: `E:/sensei-tam/backup-che-do-0510-0830/` (MD5.txt kèm theo). Bản trước đó: `backup-che-do-0510-0730/`.
- Báo cáo agent: `E:/sensei-tam/tmp/hs-final/<h|s>/*report*.md`, `E:/sensei-tam/tmp/hs-tinh/<h|s>/build-report.md, build2-report.md, fix2-report.md`. Kết quả workflow: `E:/sensei-tam/handoff/workflow1-output.json`, `workflow2-output.json`. Script workflow: `E:/sensei-tam/handoff/*.js`.

## 4. Việc còn lại, theo thứ tự
1. **Kiểm sức khỏe code** (vì agent bị dừng giữa chừng): `node --check` cho `h.js s.js h-tinh.js s-tinh.js che-do.js`; `node tools/che-do/khung/kiem-che-do.mjs h kiem` và `s kiem` phải 14/14.
2. **Chạy workflow tiếp tục**: `E:/sensei-tam/handoff/tiep-tuc-h-s.js` (H: sửa nốt 69 phát hiện + kiểm lại hai vòng trên set B/C; S: kiểm lại hai vòng trên set B/C). Ước tính 4–6 giờ. Chạy bằng công cụ Workflow với `scriptPath` = file đó (KHÔNG dùng `resumeFromRunId`: chỉ dùng được trong cùng phiên). Nếu không dùng được Workflow: tự điều phối từng bước bằng subagent, dùng đúng các prompt trong file script.
3. **Móc nối nền cho H lúc bấm "Bắt đầu giảng bài"** (hiện nền mất 0,2–2,2 s, chỉ còn trời phẳng): vá khoảng 9 dòng trong `h.js` hàm `dungNen`, diff có sẵn ở `E:/sensei-tam/tmp/hs-tinh/h/v3/patch/h-hook.diff`. Chỉ áp SAU khi H sửa xong (tránh đụng agent đang sửa `h.js`). Sau khi áp, chạy lại `kiem-che-do h` và quét thử 2 bài.
4. **Quét đủ 110 bài** mỗi chế độ (~6 giờ): `node tools/che-do/quet-bai.mjs h --anh --ra E:/sensei-tam/tmp/full-h` và tương tự `s`. Sửa những gì còn lại tới 0/0.
5. **Quyết định đang chờ chủ dự án** (xem mục 6).
6. Cập nhật bộ nhớ dự án (`project_che_do_tinh.md`, `project_che_do_h.md`), sau đó mới hỏi commit.

## 5. Lệnh hữu ích (cwd `E:/ai-live-sensei-classroom`)
- Bộ 13 bài: `KANA-1,KANA-5,KANA-10,N5-1,N5-13,N4-29,N4-35,N3-2,N3-20,N2-4,N2-8,N1-3,N1-15`
- Set B (24): `KANA-3,KANA-7,KANA-9,N5-3,N5-7,N5-10,N5-17,N5-21,N5-23,N5-25,N4-26,N4-31,N4-38,N4-44,N4-50,N3-6,N3-12,N3-16,N2-2,N2-11,N1-5,N1-9,N1-13,N1-14`
- Set C (24): `KANA-2,KANA-6,KANA-8,N5-2,N5-5,N5-9,N5-14,N5-18,N5-22,N4-27,N4-30,N4-32,N4-41,N4-46,N3-4,N3-8,N3-18,N2-1,N2-5,N2-10,N1-1,N1-7,N1-11,N1-12`
- Quét: `node tools/che-do/quet-bai.mjs <h|s> --bai <danh sách> --ra <thư mục> [--anh]` (~3 phút/bài/màn hình). Đọc phần đầu file để biết các tùy chọn.
- Probe bố cục: `node tools/che-do/do-bo-cuc.mjs <k>` (0 FAIL). Hồi quy: `node tools/che-do/khung/kiem-che-do.mjs <k> kiem` (14/14).
- Chụp ảnh các nhịp: `node tools/che-do/khung/chup-cac-nhip.mjs --bai N5-1 --them "&phongCach=<k>" --ra DIR [--chi 1440|390]`.
- Xem tay: `http://localhost:3000/?noLive&moPhong&phongCach=<k>` (server.py thường đã chạy ở cổng 3000), rồi `jumpToLesson('N5',1)` trong console.

## 6. Câu hỏi mở cần chủ dự án quyết
- Gộp mã dựng nền thành MỘT nguồn (hiện `h-tinh.js`/`s-tinh.js` SAO CHÉP code vẽ nền từ `h.js`/`s.js`; sửa nền sân khấu thì phải dựng lại file tĩnh): cho phép sửa `h.js` và `s.js` để xuất hàm dựng nền?
- Màn hình nhỏ (<1920×1080) không đủ chỗ cho 30 thẻ từ vựng ở cỡ chữ tối thiểu: giữ **cuộn bên trong bảng** (hiện tại) hay **chia trang bằng nút Trước/Sau**? (S đã vừa 30 thẻ ở 1440×900; H chỉ vừa ở 1920×1080.)
- A và J: ẩn khỏi menu, xóa file, hay để nguyên?
- Có commit chưa (rất nhiều file chưa commit).

## 7. Cạm bẫy đã gặp
- **Ổ E: nhỏ** (có lúc còn 0,9 GB). Hồ sơ Chrome tạm `E:/sensei-tam/tmp/prof-*` của tiến trình đã chết phải dọn thường xuyên (PowerShell: xóa thư mục `prof-<tên>-<PID>-*` nếu PID không còn). Đã xóa ảnh cũ trong `tmp/a` và `tmp/j`; giữ lại `a.truoc.js`, `a.moi.js` (bản sao A).
- Giới hạn Opus làm agent chết nhiều lần: đặt model rẻ hơn hoặc chia nhỏ việc; luôn ghi báo cáo ra file để phiên sau đọc.
- Agent không được giết tiến trình không phải của mình; khi dừng workflow, phải tự dọn Chrome/node/python do agent bỏ lại (dùng `taskkill /T /F /PID` đúng cây tiến trình).
- Công cụ quét báo `BALLOON-NOT-FOUND` cho H và S (không có bong bóng lời Sensei theo thiết kế): là cảnh báo của công cụ, không phải lỗi; mỗi chế độ giữ phần tử ẩn `.h-khong-bong` / `.s-khong-bong`.
- Jev (TypeSafe AI, Cloudflare) đã được xem xét: chỉ phân loại, chưa rõ hỗ trợ Việt/Nhật, không giúp việc layout. Không dùng.

## 8. Câu mở đầu để dán vào phiên mới (cùng thư mục `E:\ai-live-sensei-classroom`)
> Đọc `docs/che-do/HANDOFF-TIEP-TUC.md` và bộ nhớ dự án, rồi tiếp tục theo mục 4. Trả lời bằng tiếng Việt. Bắt đầu bằng kiểm sức khỏe code (bước 1), báo tôi kết quả rồi chạy workflow tiếp tục.
