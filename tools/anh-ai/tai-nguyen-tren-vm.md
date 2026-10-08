# Tài nguyên trên VM `a100-benchmark-runner` (kiểm kê 2026-10-01)

Kiểm kê bằng SSH chỉ-đọc (không đọc `~/.config`, `~/.ssh`, `~/.bash_history`, token hay biến môi trường). VM tạo 2026-09-23 (`us-central1-a`, `a2-highgpu-1g`, đĩa boot 150 GB `pd-ssd`, ảnh `ubuntu-2204-jammy-v20260918`), đã **TERMINATED** sau khi kiểm kê. Không có gì bị xóa hay sửa trên VM (chỉ thêm 2 script kiểm kê `~/thu.sh`, `~/thu2.sh` + kết quả và `/tmp/vm-ma.tgz` do phiên này tạo).

Đĩa gốc: `df -h /` = 146 GB, đã dùng 144 GB (100 %, còn 1,2 GB).

## 1. Danh mục

| Đường dẫn | Kích thước | Là gì | Tái tạo được? |
|---|---|---|---|
| `~/hf/Qwen-Image-2512` | 54 GB | model `Qwen/Qwen-Image-2512` (revision `25468b98...`): text_encoder 16,6 GB, transformer 41 GB, vae 0,25 GB | Có: tải lại 262 s (mục 3 README) |
| `~/hf/Qwen-Image-Edit-2511` | 39 GB | transformer Edit (5 shard) + processor + scheduler; `text_encoder`, `tokenizer`, `vae` là symlink sang 2512 | Có: `vm/setup-edit.sh` |
| `~/hf/Qwen-Image-Edit-2511-Lightning` | 1,6 GB | LoRA 8 bước + 4 bước (sha256 trong `config.json`) | Có |
| `~/venv-qi` | 5,3 GB | venv Python 3.10.12 | Có: `vm/requirements-venv-qi.txt` |
| `~/anh` | 1,1 GB | `anh/full/{n5,canh,n4,n3,n2n1}`: **PNG 1024 x 1024 của 1.267 ảnh (seed 11)**, log chạy (`run-full.log` 2,8 MB, `run-tao-lai.log` 0,7 MB, các `run-v*.log`), `da-gui*.txt` (danh sách PNG đã kéo về) | PNG: sinh lại được từ prompt + seed nhưng mất ~7 giờ GPU (~15 USD) và không chắc giống từng pixel. Log: không lưu |
| `~/nv` | 0,75 GB | máy chủ biểu cảm: `gen-edit*.py`, job `j*.json`, `inbox/*.xong`, `srv.log`, **ảnh đã sinh** (`f1`, `h1-h7`, `r1`, `r2`, `ed1-ed6`, `base` + các `*.tar`), `refs28/` (28 ảnh tham chiếu 1024), 3 ảnh thử (`miller.png`, `sato.png`, `hyoronka.png`) | Script / job: đã lưu trong repo. Ảnh: webp 512 thành phẩm đã nằm trong `assets/minh-hoa/nv/`; PNG 1024 chỉ có trên VM; có thể sinh lại ~1,35 giờ GPU (~3 USD) |
| `~/p` | 1,9 MB | prompt + style + `tl/dot-*.json` đã dùng (khớp md5 với repo) | Đã lưu (`prompts/`) |
| `~/*.sh`, `~/gen.py`, `~/probe-items*.json`, `~/style-chung*.json`, `~/xoa-vat*` | ~0,1 MB | script / prompt thử | Đã lưu (`vm/`, `prompts/`); khớp md5 với bản local |
| `~/som.tar` | 24 MB | gói PNG (29-09 05:46), nhiều khả năng là lô ảnh thử sớm | Chưa mở; khả năng thừa |
| `~/cuda-keyring_1.1-1_all.deb` | 8 KB | gói apt repo CUDA (dấu vết cài CUDA toolkit 12.4 của việc benchmark LLM) | Không cần |
| `~/check_he.py`, `~/test_gsm8k_1200.py`, `~/test_one_gsm8k.py` | ~2 KB | script thuộc benchmark LLM (23-09), không phải pipeline ảnh | Không thuộc pipeline |
| **`~/cloud_benchmark`** | **26 GB** | benchmark LLM cũ, **không phải của pipeline ảnh** (mục 2) | Xem mục 2 |
| `/usr` 14 GB, `/opt` 2,1 GB, `/var` 2,1 GB | | hệ điều hành, driver NVIDIA 580, CUDA toolkit 12.4 (không cần cho PyTorch) | Có |

Không có crontab và không có service systemd tự đặt (chỉ service mặc định của Ubuntu / GCP). Không có tiến trình pipeline đang chạy lúc kiểm kê; `~/nv/inbox/STOP` đã có sẵn.

## 2. `~/cloud_benchmark` (26 GB): kết luận kiểm kê

Chỉ **liệt kê tên, kích thước, ngày**, không chép và **không đọc nội dung** các tệp README / báo cáo (nội dung chưa được xem).

- **Là gì**: một đợt benchmark LLM đối đầu (head-to-head) chạy trên chính VM này **ngày 2026-09-23** (toàn bộ 16.311 tệp có mtime cùng ngày, 08:33-10:09), 6 ngày trước khi làm ảnh. Không liên quan đến Qwen-Image / ảnh minh họa của app.
- Thành phần:
  - `models/Qwen2.5-32B-Instruct-Q4_K_M.gguf` **19,85 GB** và `models/Qwen3.8-27B-TMS-IQ1S.gguf` **6,19 GB** (hai file GGUF lượng tử hóa; tên file đầu là model công khai của Qwen; nguồn của file thứ hai không rõ, tên không chuẩn: "TMS-IQ1S"), cộng thư mục `.cache`. Chiếm gần hết 26 GB.
  - `llama.cpp/` 1,3 GB (bản checkout git đã build trong `build/`).
  - `venv/` 361 MB.
  - `results/` 420 KB: `HEAD_TO_HEAD_SCORECARD.md` (2,7 KB), `head_to_head_fast.json` (0,9 KB), `head_to_head_fast_detailed.json` (417 KB).
  - Script: `run_a100_head_to_head_harness.py` (18 KB), `generate_head_to_head_report.py`, `analyze_results.py`, `breakdown_he.py`, `diagnose_tms.py`, `regrade_detailed.py`, `inspect_he.py`, `inspect_mmlu.py`, `test_anti_think.py`, `test_humaneval_format.py`, `test_mmlu_*.py`, `test_natalia_fix.py`, `setup_a100_bench.sh`, `download_baseline_q4.sh` và `README.md` (2 KB).
- **Có phải dữ liệu quý của người dùng không?** Trông giống kết quả thử nghiệm riêng, nhưng **chỉ phần nhỏ (kết quả + script, khoảng 0,5 MB) có thể là độc nhất**; còn lại (llama.cpp, venv, GGUF Qwen2.5 công khai) tải lại được. Điểm chưa rõ: nguồn gốc `Qwen3.8-27B-TMS-IQ1S.gguf` (có thể là file tự dựng / từ nguồn khác, không chắc tải lại được). Không thấy tệp tên kiểu khóa / thông tin đăng nhập ở cấp trên cùng.
- **Quyết định thuộc chủ VM**: nếu muốn giữ kết quả, sao chép riêng thư mục nhỏ trước khi xóa, ví dụ:
  `gcloud compute scp --recurse a100-benchmark-runner:./cloud_benchmark/results ./cloud_benchmark-results --zone us-central1-a`
  (và các `*.py`, `*.sh`, `README.md` ở cấp trên cùng; bỏ `models/`, `llama.cpp/`, `venv/`). Phiên này không sao chép gì từ thư mục đó.

## 3. Những gì KHÔNG nằm trong kho lưu trữ

| Hạng mục | Lý do | Cách cứu nếu cần |
|---|---|---|
| PNG 1024 của 1.267 ảnh (`~/anh/full`, 1,1 GB) | ảnh nhị phân > 1 MB; repo giữ webp 512 q82 | trước khi xóa VM: `~/goi-moi.sh full` (đóng gói) rồi scp, hoặc tar cả `~/anh/full` |
| Ảnh biểu cảm / nhân vật PNG 1024 (`~/nv/{f1,h*,r*,ed*,base}` + `*.tar`, `refs28`) | như trên | `tools/dieu-khien/pull.sh <thư-mục>` |
| Log chạy (`run-*.log`, `srv.log`) | theo yêu cầu bỏ log | chỉ chứa thời gian / tiến độ; số đo chính đã ghi ở README mục 7 |
| `*.bak` prompt gốc, `qa-tu-dong.json`, các phiên bản `-v1/-v2/-v3` của script, `prompt-n3-truoc.json`, `prompt-n2n1-truoc.json` | theo yêu cầu bỏ / lịch sử | `qa-tu-dong.json` tạo lại bằng `tools/qa/tu-dong.py` |
| Model đã tải (94 GB) | tải lại từ Hugging Face đúng revision | `config.json` > `models` |
| `~/cloud_benchmark` | không thuộc pipeline, không được sao chép | mục 2 |

## 4. Lệnh xóa đề xuất (CHƯA chạy, chờ chủ VM quyết định)

```bash
# chỉ xóa VM (đĩa boot autoDelete = true nên bị xóa cùng VM)
gcloud compute instances delete a100-benchmark-runner --zone us-central1-a --project <GCP_PROJECT_ID>
# kiểm tra không còn đĩa mồ côi
gcloud compute disks list --project <GCP_PROJECT_ID>
```

Nếu muốn giữ khả năng quay lại đúng môi trường (kể cả 94 GB model và cloud_benchmark) mà không giữ VM, có thể tạo snapshot đĩa trước (tốn phí lưu trữ hằng tháng nhỏ hơn đĩa pd-ssd nhưng không bằng 0); nếu chỉ cần pipeline thì làm theo README và không cần snapshot.
