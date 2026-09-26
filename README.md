# AI Live Sensei Classroom (N5–N1)

Hệ thống lớp học tiếng Nhật tương tác thời gian thực ứng dụng **Gemini Live (Interleaved Reasoning & Bidirectional Audio Streaming)** trên **Antigravity IDE**.

Hệ thống kết hợp trình diễn bài giảng trực quan (Slide & Ruby Furigana) với khả năng AI Sensei tự động điều khiển giáo án, highlight từ vựng/ngữ pháp và sửa lỗi ngữ pháp phát âm khi học viên đàm thoại hoặc ngắt lời (Barge-in VAD).

---

## 🌟 Tính Năng Nổi Bật

1. **Live Audio Streaming hai chiều:**
   - **Audio In:** Thu âm Microphone $\to$ Downsample thành PCM 16-bit Mono, 16kHz $\to$ Stream liên tục qua WebSocket `realtimeInput.mediaChunks`.
   - **Audio Out:** Nhận luồng PCM 24kHz Native từ Gemini $\to$ Chuyển đổi Float32 $\to$ Phát liên tục không ngắt quãng qua Web Audio API buffer scheduling.
2. **Barge-in Tức Thì (Ngắt lời tự nhiên):**
   - Khi học viên phát biểu, Gemini kích hoạt VAD và trả về `serverContent.interrupted: true`.
   - Client lập tức hủy toàn bộ buffer đang phát của Sensei, đặt lại timeline để đón nhận câu nói của học viên.
3. **Interleaved Reasoning:**
   - Hiển thị suy luận ngầm (`parts[].thought`) của Sensei trước khi đưa ra câu trả lời, giúp người học thấy được phân tích sư phạm chuyên sâu.
4. **Bộ 3 Công cụ Function Calling:**
   - `change_slide(level, lesson_id, slide_index)`: Chuyển slide theo lộ trình N5 $\to$ N1.
   - `highlight_element(target_id, style_type, comment)`: Rọi sáng từ vựng (vàng), ngữ pháp (xanh neon), hoặc cảnh báo (đỏ) bằng CSS glow.
   - `mark_error(wrong_phrase, corrected_phrase, explanation)`: Ghi nhận câu sai của học viên, mở bảng sửa lỗi và hiển thị câu mẫu chuẩn xác.
5. **Cơ sở dữ liệu bài học N5–N1 hoàn chỉnh:**
   - Toàn bộ từ vựng, Kanji, Furigana và trợ từ đều được gắn `id` duy nhất (`tok-*`, `ex-*`) giúp AI định vị và trỏ chính xác từng token trong DOM.

---

## 📂 Cấu Trúc Dự Án

```
f:\Project Ai\TecherAiJapanese\
├── index.html                  # Giao diện chính lớp học
├── css/
│   └── styles.css              # Hiệu ứng Neon Highlights, Ruby Furigana, Waveform
├── js/
│   ├── app.js                  # Bộ điều khiển chính (Controller & UI Bindings)
│   ├── gemini-live.js          # Client WebSocket Gemini Live BidiGenerateContent
│   ├── audio-engine.js         # Xử lý Web Audio API (PCM 16kHz In & PCM 24kHz Out)
│   ├── slide-engine.js         # Render Slide tương tác & Dynamic DOM Highlighting
│   └── curriculum-loader.js    # Quản lý & nạp giáo án N5 -> N1
├── curriculum/                 # Dữ liệu bài giảng gán ID token
│   ├── n5.json                 # Bài học N5 (Bài 1: Khẳng định/Trợ từ は/です, Bài 2: Chỉ thị từ, ...)
│   ├── n4.json                 # Bài học N4 (Thể て, Yêu cầu, Cho phép, ...)
│   ├── n3.json                 # Bài học N3 (わけがない, ようにする, ...)
│   ├── n2.json                 # Bài học N2 (に際して, ざるを得ない, ...)
│   └── n1.json                 # Bài học N1 (極まりない, にたえない, ...)
├── server.py                   # Local HTTP server (CORS & chuẩn MIME types)
├── start.bat                   # File kích hoạt 1-click trên Windows
├── package.json                # Cấu hình Node.js / scripts
└── README.md                   # Tài liệu hướng dẫn
```

---

## 🚀 Hướng Dẫn Khởi Động Nhanh

### Bước 0 (bắt buộc, chỉ làm 1 lần sau khi clone): tải thư viện frontend
Thư mục `vendor/` (Tailwind CSS, Font Awesome) **không được commit vào git**
(theo `.gitignore`, đúng thông lệ). Nếu thiếu thư mục này, trang sẽ **vỡ layout
hoàn toàn** — không có style, icon hiện thành ô trống. Chạy lệnh sau một lần
duy nhất sau khi clone:
```bash
python tools/setup_vendor.py
```

### Bước 0b (bắt buộc, chỉ làm 1 lần): tạo file `.env` chứa API key
Sao chép `.env.example` thành `.env` rồi điền Gemini API key vào (lấy tại
[aistudio.google.com/apikey](https://aistudio.google.com/apikey)). File `.env`
**không được commit** — server.py tự sinh `env.js` từ đó cho trình duyệt đọc,
nên không cần nhập key thủ công trên UI mỗi lần mở trang.
```bash
cp .env.example .env
```
Sau đó mở `.env` và điền `GEMINI_KEY1` / `GEMINI_KEY2` (xem chú thích trong
file để biết vai trò của từng key).

### Cách 1: Chạy bằng file Batch (Windows)
Click đúp vào file **`start.bat`**. Trình duyệt sẽ tự động mở `http://localhost:3000`.

### Cách 2: Chạy bằng Python Server
Mở terminal tại thư mục dự án và chạy:
```bash
python server.py
```
Sau đó truy cập: [http://localhost:3000](http://localhost:3000)

Mặc định server **chỉ nghe trên máy này** (127.0.0.1) và chỉ phục vụ các thư mục
app cần (`css/`, `js/`, `curriculum/`, `vendor/`, `assets/`). Muốn mở cho điện
thoại trong cùng mạng LAN (mic qua HTTPS cổng 3443) thì chạy `python server.py --lan`
— khi đó mọi máy trong mạng đều đọc được `env.js` (API key), nên chỉ bật trên mạng
tin cậy.

> ⚠️ **Không** mở server này ra internet (Tailscale Funnel, ngrok, mở cổng router…)
> và **không** dùng các server tĩnh khác kiểu `npx serve .`: chúng phục vụ cả thư mục
> dự án, kể cả `.env`. Đây là server để phát triển, không phải để chạy production.

---

## 🎧 Cách Thao Tác & Kiểm Thử

1. **Kết nối:**
   - Nhập **Gemini API Key** vào ô input trên thanh header.
   - Chọn mô hình (mặc định: `models/gemini-3.8-live` hoặc `models/gemini-2.0-flash-exp`).
   - Chọn giọng đọc (Aoede, Puck, Charon, Kore, Fenrir).
   - Bấm nút **"Bắt đầu phiên"**.
2. **Kích hoạt Mic:**
   - Bấm nút **"Bật Mic để đàm thoại"**. Khi nút chuyển màu đỏ và nhấp nháy, Mic đang truyền âm thanh 16kHz.
3. **Thử nghiệm Kịch bản Barge-in & Sửa lỗi:**
   - Khi Sensei đang giảng bài bằng âm thanh, hãy nói vào mic:
     > *"Sensei ơi, watashi wa gakusei ja arimasen ka?"*
   - Bạn sẽ thấy:
     1. Giọng Sensei dừng ngay lập tức (`interrupted: true`).
     2. Tab **Interleaved Reasoning** xuất hiện phân tích lý do sai trợ từ/kính ngữ.
     3. Bảng đỏ **SENSEI GHI CHÚ SỬA LỖI** xuất hiện trên slide so sánh câu sai và câu đúng.
     4. Sensei giải thích ngắn gọn rồi tiếp tục bài học.
4. **Thử nghiệm Đổi Slide & Highlight:**
   - Bạn có thể dùng các nút mẫu bên dưới slide (Quick Test Scenarios) như *"Dạy bài 1 N5"*, *"Highlight từ vựng"*, *"Đổi sang bài N3"*, *"Đổi sang bài N1"*.
