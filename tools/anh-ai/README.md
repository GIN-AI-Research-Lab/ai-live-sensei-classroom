# Pipeline ảnh AI (Qwen-Image) — bản lưu trữ để tái tạo

Lưu ngày 2026-10-01, trước khi xóa VM GCP `a100-benchmark-runner`. Làm theo tài liệu này + `config.json` là dựng lại được toàn bộ pipeline đã dùng để sinh ảnh minh họa của app. Mọi thứ trong thư mục này là **tài liệu + dữ liệu nhỏ** (prompt, style, script, cấu hình), không có ảnh PNG và không có khóa/token.

Tổng cộng 132 tệp, ~3,2 MB (không cần nén).

Các tệp liên quan nằm ngoài thư mục này: `tools/gan_anh.py` (gắn ảnh vào giáo trình), `curriculum/nhan-vat.json`, `tools/minh_hoa_chi_muc.json`, `assets/minh-hoa/` (ảnh webp thành phẩm).

## 1. Tổng quan

| Sản phẩm | Model | Số lượng | Chế độ |
|---|---|---|---|
| Ảnh từ vựng / cảnh hội thoại (N5, N4, N3, N2-N1, cảnh) | `Qwen/Qwen-Image-2512` (Apache-2.0) | 1.267 ảnh duy nhất (338 + 116 + 293 + 232 + 288) | `vm/gen.py`, mode base, 20 bước, CFG 4, 1024x1024, seed 11; tạo lại seed 22 / 33 |
| Chân dung gốc 11 nhân vật mới | Qwen-Image-2512 | 11 nhân vật x 3 seed | như trên, seed 11, 22, 33 |
| Biểu cảm 28 nhân vật x 7 khóa (bình thường, vui, hỏi, giận, ngạc nhiên, hào hứng, buồn) | `Qwen/Qwen-Image-Edit-2511` + LoRA `lightx2v/Qwen-Image-Edit-2511-Lightning` 8 bước (Apache-2.0) | 28 x 8 webp | `vm/gen-edit2.py` máy chủ job, 8 bước, true CFG 1, seed 7 (tạo lại 13 / 21) |
| Hậu xử lý | `vm/lam-nen.py` (ép nền về `#f0ebe1`) rồi webp 512x512 q82 | | chạy ở máy local |

Kết quả QA vòng đầu: 1.108 ảnh đạt ở seed 11; 159 mục bị gắn cờ được tạo lại (318 ảnh): 99 chọn seed 22, 42 chọn seed 33, 18 giữ SVG cũ (cả hai seed vẫn lỗi). Chi tiết ở `data/qa.json`.

### Cây thư mục

```
tools/anh-ai/
  README.md  config.json  tai-nguyen-tren-vm.md
  vm/                 # chạy TRÊN VM (chép vào ~ hoặc ~/nv, xem mục 4-5) + lam-nen.py chạy local
    setup.sh setup-edit.sh requirements-venv-qi.txt
    gen.py (ảnh từ vựng/cảnh)  gen-edit2.py (máy chủ biểu cảm)  gen-edit.py (bản cũ chạy 1 lần)
    lam-nen.py  tai-edit.py tai-lora.py
    chay-full.sh chay-tao-lai.sh khoi-dong.sh kiem-png.sh goi-moi.sh   # vòng chính + tạo lại + chống hỏng + đóng gói
    chay-base.sh chay-tai.sh chay-edit.sh                               # nhân vật gốc / tải model / chạy edit cũ
    chay-tiep.sh chay-v3*.sh chay-v4.sh chay-v5.sh chay-v7.sh tam-dung*.sh xoa-vat.sh xoa-vat-n5.txt   # lịch sử thử style (probe)
  prompts/
    prompt-n5.json prompt-n4.json prompt-n3.json prompt-n2n1.json prompt-canh.json   # 5 tệp prompt cuối
    style-chung.json    # style + negative dùng chung (styleRef), styleVat, quy ước biểu tượng manga
    style-lich-su/      # style v2, v3b, v4, v5, v6 (v7 = style-chung.json)
    tl/dot-01..03.json  # 3 đợt tạo lại (159 mục, styleRef ../style-chung.json)
    probe/              # bộ mục thử style (lịch sử)
    nhan-vat/           # builder biểu cảm: tao-jobs.py tao-full.py tao-hoi*.py tao-regen.py tao-var.py tao-inbox.py tao-base.py,
                        # ids28.json hoi-choice.json base-items.json, viec-da-chay/ (19 tệp job đã chạy thật, ví dụ)
  tools/
    tao-prompt/         # builder prompt từ giáo trình (tao-prompt-n5.py tao_prompt_canh.py build-n4.py build-n3.cjs),
                        # sua-prompt.py (v7: áp style chung / biểu tượng), ung-vien.py, data/
    qa/                 # xu-ly*.sh tu-dong.py to-lien-he.py to-tao-lai.py co.py tao-dot.py chon.py lap-qa.py webp-chi-muc.py ...,
                        # co-tay.json (159 cờ + lý do) tao-lai-kq.json (lựa chọn seed)
    nhan-vat/           # mk-refs.py sheet.py chars.py rows.py xuat.py
    dieu-khien/         # chạy từ máy local: vm-lib.sh giam-sat*.sh keo-tay.sh phien-*.sh pull.sh phut-vm.py start-v3.sh
    probe/              # tạo/ghép tờ thử style (lịch sử)
  data/                 # minh_hoa_chi_muc.json nhan-vat.json nv-chi-muc.json qa.json (bản sao dữ liệu repo + QA)
```

### Biến đường dẫn (khối PATHS ở đầu mỗi script)

| Biến | Mặc định | Dùng cho |
|---|---|---|
| `ANH_AI_WORK` | `~/anh-ai-work` | thư mục làm việc local, không đưa vào git: `anh/png`, `anh/nen`, `anh/tao-lai*`, `anh/webp`, `log/`, `goc/`, `nv/` (refs28, base/flat, expr/...) |
| `SENSEI_REPO` | 4 cấp trên tệp (gốc repo) | builder prompt đọc `curriculum/`; `nhan-vat/*` đọc `curriculum/nhan-vat.json` và ghi `assets/minh-hoa/nv/` |
| `ANH_AI_FONTS` | `C:/Windows/Fonts` | font cho tờ liên hệ (Segoe UI, Meiryo); đổi khi chạy Linux/Mac |
| `VM_NAME` `VM_ZONE` `VM_HOME` | `a100-benchmark-runner` `us-central1-a` `.` | `tools/dieu-khien/vm-lib.sh` (`.` = home của user SSH; pscp không hiểu `~`) |

Mọi lệnh `python tools/...`, `bash tools/...` trong tài liệu này chạy từ thư mục `tools/anh-ai` (trừ `tools/gan_anh.py` chạy từ gốc repo). Cần `gcloud config set project <PROJECT_ID>` (project cũ: `<GCP_PROJECT_ID>`). Máy local cần Python 3.12 + `numpy scipy pillow`, Git Bash (các `.sh`), và đặt `PYTHONIOENCODING=utf-8` khi in tiếng Việt trên Windows.

## 2. Tạo VM và cài driver GPU

VM cũ: `a2-highgpu-1g` (12 vCPU, 83 GiB RAM) + 1 x A100-SXM4-40GB, SPOT, Ubuntu 22.04, `us-central1-a`, mạng `default`, IP ngoài tạm thời.

```bash
gcloud compute instances create a100-benchmark-runner \
  --project=<PROJECT_ID> --zone=us-central1-a \
  --machine-type=a2-highgpu-1g \
  --accelerator=type=nvidia-tesla-a100,count=1 \
  --provisioning-model=SPOT --instance-termination-action=STOP \
  --maintenance-policy=TERMINATE --no-restart-on-failure \
  --image-family=ubuntu-2204-lts --image-project=ubuntu-os-cloud \
  --boot-disk-size=200GB --boot-disk-type=pd-ssd
```

- **Đĩa 200 GB pd-ssd, không phải 150 GB**: bản cũ 150 GB đã đầy 100 % (còn 1,2 GB). Tối thiểu lý thuyết cho riêng pipeline ~118-130 GB (2512 = 54 GB, Edit = 39 GB, LoRA 1,6 GB, venv 5,3 GB, hệ thống ~18 GB), nhưng cần dư cho PNG, log, cập nhật kernel/dkms. Có thể giảm bằng cách xóa `~/hf/Qwen-Image-2512/transformer` (~41 GB) sau khi xong ảnh từ vựng (xem mục 8).
- Cờ `--accelerator`: máy A2 gắn sẵn A100 theo machine type; nếu gcloud báo trùng thì bỏ cờ đó (chưa kiểm chứng).
- Cần quota GPU A100 spot ≥ 1 ở region `us-central1`. Hết tài nguyên (stockout) là chuyện thường: thử `start/create` lại mỗi ~3 phút (hàm `bat` trong `tools/dieu-khien/vm-lib.sh`), quá 30-60 phút thì đổi zone.
- **Luôn đặt watchdog tự tắt** ngay khi SSH vào: `sudo shutdown -h +90` (gia hạn mỗi ~5 phút khi còn giám sát; `giam-sat*.sh` làm việc này).
- Mọi `ssh/scp` bọc `timeout`, `< /dev/null`, `--strict-host-key-checking=no`. Trên Windows `gcloud compute ssh` dùng PuTTY (`plink`/`pscp`): đường dẫn đích phải **tương đối** (`$V:./p/`), không dùng `~`.

### Driver NVIDIA (khôi phục từ `dpkg -l`, lệnh gốc không được ghi lại)

VM cũ có `nvidia-driver-580-server 580.178.04` + `nvidia-dkms-580-server` (module `nvidia-srv/580.178.04`), `nvidia-smi` báo CUDA 13.0, kernel `6.8.0-1069-gcp`. PyTorch cu124 chỉ cần driver ≥ 550 và tự mang runtime CUDA, nên **không cần cài CUDA toolkit**.

```bash
sudo apt-get update
sudo apt-get install -y dkms linux-headers-$(uname -r) python3-venv
sudo apt-get install -y nvidia-driver-580-server nvidia-utils-580-server   # kéo theo nvidia-dkms-580-server
sudo reboot
nvidia-smi        # kỳ vọng: NVIDIA A100-SXM4-40GB, 40960MiB
```

Khuyến nghị (chưa áp dụng ở VM cũ): chặn cập nhật kernel tự động (`sudo apt-mark hold linux-image-gcp linux-headers-gcp`, hoặc tắt `unattended-upgrades`) vì kernel mới + đĩa đầy từng làm hỏng module (mục 8). Sửa khi hỏng:

```bash
dkms status
sudo dkms remove nvidia-srv/580.178.04 -k $(uname -r)
sudo dkms install nvidia-srv/580.178.04 -k $(uname -r)
sudo modprobe nvidia && nvidia-smi
```

## 3. Môi trường Python và tải model

```bash
# máy local, thư mục tools/anh-ai, Git Bash
V=a100-benchmark-runner; Z="--zone us-central1-a"
timeout 300 gcloud compute scp vm/setup.sh vm/gen.py vm/chay-full.sh vm/chay-tao-lai.sh vm/goi-moi.sh vm/khoi-dong.sh vm/kiem-png.sh $V:./ $Z
timeout 120 gcloud compute ssh $V $Z --command 'sudo shutdown -h +90; chmod +x ~/*.sh; nohup bash ~/setup.sh > ~/setup.log 2>&1 < /dev/null &'
# theo dõi: tail ~/setup.log  -> khi thấy SETUP_DONE (tải 2512 ~262 s)
```

`vm/setup.sh` tạo `~/venv-qi`, cài `torch` (cu124), `diffusers>=0.36 transformers accelerate peft safetensors sentencepiece pillow huggingface_hub`, tải `Qwen/Qwen-Image-2512` (đã ghim revision) vào `~/hf/Qwen-Image-2512` và LoRA Lightning 2512 (chỉ dùng khi thử mode `light`, không dùng ở bản cuối).

**Phiên bản đã chạy (ghim)**: Python 3.10.12, torch 2.6.0+cu124, torchvision 0.21.0+cu124, diffusers 0.40.0, transformers 5.17.0, accelerate 1.15.0, peft 0.21.0, safetensors 0.8.0, sentencepiece 0.2.2, huggingface_hub 1.33.0, numpy 2.2.6, pillow 12.3.0. Danh sách đầy đủ: `vm/requirements-venv-qi.txt`. Muốn y hệt: `pip install -r requirements-venv-qi.txt --extra-index-url https://download.pytorch.org/whl/cu124` (thay cho các lệnh `pip` trong `setup.sh`; `setup.sh` không ghim phiên bản nên bản mới của diffusers/transformers có thể khác API).

Model dùng cho biểu cảm (chạy sau `setup.sh`):

```bash
timeout 120 gcloud compute ssh $V $Z --command 'mkdir -p ~/nv/inbox'
timeout 300 gcloud compute scp vm/setup-edit.sh vm/gen-edit2.py vm/gen-edit.py vm/gen.py vm/lam-nen.py vm/tai-edit.py vm/tai-lora.py vm/chay-base.sh vm/chay-tai.sh vm/chay-edit.sh $V:./nv/ $Z
timeout 120 gcloud compute ssh $V $Z --command 'chmod +x ~/nv/*.sh; nohup bash ~/nv/setup-edit.sh > ~/nv/setup-edit.log 2>&1 < /dev/null &'
```

`setup-edit.sh` ghi lại các bước đã làm: cài `torchvision==0.21.0` (processor của Edit cần), tải transformer Edit (5 shard ~41 GB) + processor, tải LoRA `Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16.safetensors` (+ bản 4 bước), tạo symlink `text_encoder tokenizer vae` sang `~/hf/Qwen-Image-2512/` (sha256 trùng khớp, tiết kiệm ~17 GB).

| Repo Hugging Face | Revision (commit) | Ghi chú |
|---|---|---|
| `Qwen/Qwen-Image-2512` | `25468b98e3276ca6700de15c6628e51b7de54a26` | 54 GB, Apache-2.0 |
| `Qwen/Qwen-Image-Edit-2511` | `6f3ccc0b56e431dc6a0c2b2039706d7d26f22cb9` | chỉ tải transformer + processor + scheduler, 39 GB, Apache-2.0 |
| `lightx2v/Qwen-Image-Edit-2511-Lightning` | `d74eba145674fd7e31b949324e148e21e7118abd` | 8 bước sha256 `a9e81a58...1ba8`, 849.608.296 byte |
| `lightx2v/Qwen-Image-2512-Lightning` | không ghi lại | chỉ thử mode light, đã xóa khỏi VM |

Tải ẩn danh không cần token (có cảnh báo rate limit). Nếu cần token HF thì chỉ đặt bằng biến môi trường trên VM, **không bao giờ ghi vào repo**.

## 4. Công thức A — ảnh từ vựng và cảnh (`vm/gen.py`)

Các tham số đã dùng (xem cả `config.json` > `giaiDoan.vocabVaCanh`):

| Tham số | Giá trị |
|---|---|
| `--mode base --steps 20 --cfg 4` | **bắt buộc truyền tường minh**: mặc định của gen.py cho mode base là 50 bước (chỉ dùng để so sánh), mode light là 8 bước CFG 1 |
| `--size 1024`, `--storage bf16` (mặc định) | transformer bf16 trên GPU, đỉnh VRAM 38,7 GiB / 40 GiB: **không chạy thêm tiến trình GPU nào khác** |
| `--seeds 11` (lần đầu); `22,33` (tạo lại) | 1 seed: tên tệp `<ten>.png`; nhiều seed: `<ten>-s<seed>.png`; mục có trường `seed` riêng dùng seed đó |
| `--only ten1,ten2` | lọc theo `ten`; ghi đè style bằng `--style` (chỉ để thử) |
| `styleRef` trong tệp prompt | `gen.py` ghép `prompt + " " + style` (mục `vat: true` ghép `styleVat`) và negative = gộp không trùng của `negativeBase` + `negativeVat` (nếu vật) + `negative` của mục |

Thứ tự và lệnh đã dùng (vòng chính `vm/chay-full.sh`, chạy lại an toàn: ảnh đã có thì bỏ qua, ghi `*.tmp.png` rồi đổi tên):

```bash
# 1) đẩy prompt lên VM
timeout 300 gcloud compute ssh $V $Z --command 'mkdir -p ~/p/tl ~/anh/full'
timeout 300 gcloud compute scp prompts/prompt-n5.json prompts/prompt-canh.json prompts/prompt-n4.json prompts/prompt-n3.json prompts/prompt-n2n1.json prompts/style-chung.json $V:./p/ $Z
# 2) chạy (chờ tệp ~/p/DI để có thể tạm dừng khi thử style)
timeout 120 gcloud compute ssh $V $Z --command 'touch ~/p/DI; sudo shutdown -h +90; nohup ~/chay-full.sh > ~/chay-full.out 2>&1 < /dev/null &'
# chay-full.sh: for L in n5 canh n4 n3 n2n1 -> python ~/gen.py --items ~/p/prompt-$L.json --out ~/anh/full/$L --mode base --steps 20 --cfg 4 --seeds 11
# 3) theo dõi: grep -E '\] .*seed=' ~/anh/run-full.log | tail -1 ; find ~/anh/full -name '*.png' | wc -l   (đích 1267)
# 4) kéo ảnh về: ~/goi-moi.sh full  -> ~/anh/goi/moi-full.tar -> scp -> giải nén vào $ANH_AI_WORK/anh/png -> ~/goi-moi.sh full --xac-nhan
#    (tự động hóa: tools/dieu-khien/giam-sat2.sh, giám sát 5 phút/lần, bật lại khi spot bị thu hồi, trần chi phí, luôn tắt VM khi thoát)
```

Sau khi QA (mục 6): `python tools/qa/tao-dot.py` sinh `prompts/tl/dot-NN.json`; đẩy lên `~/p/tl/` rồi `nohup ~/chay-tao-lai.sh ...` (seed 22 và 33, ra `~/anh/tao-lai/s22|s33/<cấp>/`; script cũng bù ảnh seed 11 còn thiếu). `vm/kiem-png.sh` xóa PNG hỏng (0 byte / không mở được do VM bị thu hồi lúc ghi) và `vm/khoi-dong.sh` khởi động lại việc đang dở sau khi bật lại VM. Mỗi thao tác kết thúc bằng `sudo shutdown -h +90` và **tắt VM** (`gcloud compute instances stop`).

Style đã thử trước khi chốt (`prompts/style-lich-su/`, chạy bằng `chay-v3*.sh` ... `chay-v7.sh`): v2 (có mã hex, "vignette") -> v3b (nền phẳng, không khung/thẻ) -> v4 (da tự nhiên + tóc, không thẻ/khung, không chữ hiệu ứng) -> v5 (vật không có mặt người, nền cô lập) -> v6 (bỏ mặt kawaii trên đồ vật) -> v7 (style riêng `styleVat` cho đồ vật) = `style-chung.json` hiện hành. Bản cuối chọn 20 bước CFG 4 sau khi so `base50`, `light8` và `base20` trong các lượt thử (`vm/chay-tiep.sh`, `chay-v3.sh`...).

## 5. Công thức B — chân dung và biểu cảm nhân vật

Nhân vật: 28 (`prompts/nhan-vat/ids28.json`, `data/nhan-vat.json`). 17 đã có chân dung từ trước; 11 mới (`coach bengoshi hisho nguyen joshi hyoronka isha tsukonin gakusei shikai kisha`) sinh bằng Qwen-Image-2512.

**Bước 1: ảnh gốc 11 nhân vật mới**: `python prompts/nhan-vat/tao-base.py base-items.json` (mẫu `nhanVat.mau` trong `style-chung.json`, mô tả từng người trong chính script) -> chép `base-items.json` + `style-chung.json` vào `~/nv` -> `~/nv/chay-base.sh` (`gen.py --mode base --steps 20 --cfg 4 --seeds 11,22,33`). Chọn seed đẹp nhất (tờ liên hệ), kéo về, `lam-nen.py` ép nền, lưu `base/flat/<id>.png` (1024).

**Bước 2: ảnh tham chiếu 1024**: `python tools/nhan-vat/mk-refs.py` -> `$ANH_AI_WORK/nv/refs28/<id>.png` (từ `anh` trong `curriculum/nhan-vat.json`, hoặc `base/flat/<id>.png`; ảnh webp 512 trong repo sẽ bị phóng to lên 1024, mềm hơn bản PNG 1024 gốc đã chỉ còn trên VM cũ). Đẩy lên VM: `gcloud compute scp --recurse "$ANH_AI_WORK/nv/refs28" $V:./nv/ $Z` và `prompts/nhan-vat/*` (builder + `ids28.json`) vào `~/nv/`.

**Bước 3: bật máy chủ job** (nạp model một lần, ~4 phút; sau đó mỗi ảnh ~11 giây):

```bash
# VM
sudo shutdown -h +90
source ~/venv-qi/bin/activate; cd ~/nv; mkdir -p inbox
nohup python gen-edit2.py > srv.log 2>&1 < /dev/null &
tail -f srv.log   # chờ dòng "san sang"
```

`gen-edit2.py` đọc `~/nv/inbox/*.json` (tệp tên bắt đầu bằng `p-` được ưu tiên, các tệp khác nhường), mỗi tệp `{"out": "~/nv/f1", "steps": 8, "cfg": 1.0, "size": 1024, "jobs": [{"ten": "<id>__<khoa>", "ref": "~/nv/refs28/<id>.png", "prompt": "...", "seed": 7}]}`; xong đổi `.json` thành `.xong`; tệp `inbox/STOP` làm máy chủ thoát; ảnh đã có thì bỏ qua. Không tắt máy chủ giữa các đợt vì nạp lại rất tốn thời gian.

**Bước 4: tạo job** (builder chạy ngay trên VM, cùng thư mục `~/nv` với `tao-jobs.py`; chép `prompts/nhan-vat/*.py *.json` lên `~/nv`):

```bash
cd ~/nv; IDS=$(python -c "import json;print(' '.join(json.load(open('ids28.json'))))")
# 6 biểu cảm (kín miệng) cho 28 nhân vật, seed 7: ra ~/nv/f1/<id>__<khoa>.png
python tao-full.py jB.json ~/nv/refs28 7 binh_thuong,vui,gian,ngac_nhien,hao_hung,buon $IDS
python tao-inbox.py inbox/b-rest.json ~/nv/f1 8 1.0 1024 jB.json
# biểu cảm "hoi" bản cuối: văn bản H8, seed 7, cho 28 nhân vật: ra ~/nv/h5/
python tao-hoi2.py jH5.json 7 H8 $IDS ; python tao-inbox.py inbox/p-hoi5.json ~/nv/h5 8 1.0 1024 jH5.json
# tạo lại các biểu cảm hỏng (câu nhắc riêng cho từng nhân vật/biểu cảm trong tao-regen.py), seed 13 rồi 21
python tao-regen.py jR1.json 13 tanaka:ngac_nhien gupta:vui ... ; python tao-inbox.py inbox/p-r1.json ~/nv/r1 8 1.0 1024 jR1.json
```

Mẫu thực tế các job đã chạy (jB.json, jH5.json, jR1.json...) nằm ở `prompts/nhan-vat/viec-da-chay/`. Văn bản biểu cảm (`COMMON` + `EXPR[khoa]`) ở `tao-jobs.py`; biến thể `hoi` H7/H8 ở `tao-hoi2.py`; `hoi-choice.json` ghi lại 9 nhân vật phải dùng `hoi` tạo lại (h6 = H8 seed 13, h7 = H7 seed 21; còn lại dùng h5 = bản H8 seed 7). Tệp này chỉ là ghi chép, không script nào đọc (suy ra từ tên thư mục và nội dung job).

**Bước 5: chọn và xuất**: kéo `~/nv/<thư-mục>` về `$ANH_AI_WORK/nv/expr/<thư-mục>` (`tools/dieu-khien/pull.sh <thư-mục>`); xem tờ liên hệ `python tools/nhan-vat/chars.py expr/f1 sheets/x.png <id...>` (cột gốc + 7 biểu cảm) hoặc `rows.py`; ảnh chọn tay từ các lần tạo lại đặt vào `expr/rsel/`, bản `hoi` cuối ở `expr/hoi-final/`; rồi `python tools/nhan-vat/xuat.py` (chọn nguồn theo thứ tự `rsel` > `hoi-final` > `f1`, ép nền, xuất webp 512 q82 vào **`assets/minh-hoa/nv/<id>/<khoa>.webp` và `chi-muc.json` của repo**). `binh_thuong` = ảnh gốc, `binh_thuong_kin` = bản miệng kín do Edit sinh.

## 6. Hậu xử lý và QA

**Ép nền (`vm/lam-nen.py`)**: nền Qwen gần phẳng nhưng lệch nhẹ; script loang từ viền ảnh qua vùng gần màu nền và thay đúng `#f0ebe1` (240,235,225) bằng chuyển tiếp mềm, không chạm chủ thể. Mặc định `--tol 2.5 --chuyen 6 --mem 14 --lech 25 --lo 900`; ảnh có viền không đồng màu (cảnh tràn viền) bị **bỏ qua và chép nguyên** (in `BO QUA`). Cờ `--khung` gỡ thẻ/khung sáng nằm sau chủ thể (dùng cho ảnh từ vựng), `--moi` chỉ xử lý ảnh chưa có đầu ra, `--mask` ghi ảnh trọng số để kiểm tra.

**Quy trình QA ảnh từ vựng/cảnh** (chạy ở local, thư mục làm việc `$ANH_AI_WORK/anh`):

| Bước | Lệnh | Ra |
|---|---|---|
| 1. ép nền | `bash tools/qa/xu-ly.sh` (tao-lai: `xu-ly-tl.sh`) | `anh/nen/<cấp>/` + log (`BO QUA`, `GO_KHUNG`) |
| 2. kiểm tự động | `python tools/qa/tu-dong.py` | `anh/qa-tu-dong.json` |
| 3. tờ liên hệ | `python tools/qa/to-lien-he.py nen to` | `anh/to/to-NNN.jpg` (8x6 = 48 ô: số thứ tự, tên, từ Nhật, nghĩa) + `chi-so.json` |
| 4. gắn cờ tay | `python tools/qa/co.py <cấp>/<ten> "lý do" ["prompt mới"]` | `tools/qa/co-tay.json` |
| 5. đợt tạo lại | `python tools/qa/tao-dot.py [cấp,...]` | `prompts/tl/dot-NN.json` (thêm câu "chỉ chủ thể + bóng nhỏ, không tường/cửa sổ" cho lỗi khung/thẻ) |
| 6. so sánh | `python tools/qa/to-tao-lai.py` / `phong-to.py` | tờ 3 ô [s11 / s22 / s33] |
| 7. ghi lựa chọn | `python tools/qa/chon.py n4/oversleep=s33 n4/xxx=giu-svg:ghi chú` | `tools/qa/tao-lai-kq.json` |
| 8. gộp | `python tools/qa/lap-qa.py` | `anh/qa.json` (bản lưu: `data/qa.json`) |
| 9. xuất | `python tools/qa/webp-chi-muc.py` | `anh/webp/<ten>.webp` 512 q82 + `anh/chi-muc.json` (tên trùng giữa các cấp: tệp đầu giữ `<ten>.webp`, sau đó `<ten>-<cấp>.webp`) |
| 10. gắn vào app | `python tools/gan_anh.py` (ở gốc repo) | chạy lại sau mỗi lần build lại giáo trình |

**Tiêu chí loại / gắn cờ** (đã xem tay trên tờ liên hệ; tự động chỉ là cảnh báo): ảnh nằm trong **khung, thẻ, ô vuông bo góc hoặc tấm nền** phía sau (lý do phổ biến nhất: `khung` 71, `tile` 48, `the` 38 mục); cảnh cắt thẳng ở viền / tràn viền; viền bóng hoặc viền thẻ còn sót; có chữ, số, ký tự tiền tệ, chữ hiệu ứng; đồ vật có mặt kawaii hoặc có người trong đồ vật; bìa tạp chí giống ảnh thật; da màu terracotta; đầu trọc / không tóc; đám đông. Ngưỡng tự động (`tu-dong.py`): `gan-nhu-trong` > 97 % pixel là nền; `vung-toi-lon` > 4 % ảnh; `nghi-the-khung` vùng sáng > 18 %; `nghi-khung-chu-nhat` >= 3 cạnh thẳng; `nghi-o-vuong` lấp > 90 % bbox và > 15 % ảnh; `nen-chua-phang` khi lam-nen bỏ qua ảnh.

**Seed tạo lại**: ảnh gốc seed 11; mục bị cờ tạo lại với **22 và 33** (cùng prompt, hoặc `promptMoi` trong `co-tay.json`), chọn một trong ba hoặc giữ SVG cũ nếu cả hai vẫn lỗi (18 mục).

**QA nhân vật**: tờ liên hệ 7 cột (`rows.py`) hoặc 8 cột có ảnh gốc (`chars.py`, ô 200 px). Loại khi: miệng mở hoặc lộ răng (phải là một nét miệng kín), đổi kiểu tóc / quần áo / phụ kiện, đầu nghiêng khi biểu cảm `hoi` (đầu phải thẳng, chỉ một lông mày nhướng cao), tóc che mắt ở `ngac_nhien`, mất ria / râu (gupta, santos), viền trắng quanh người, chấm trắng / lấm tấm, ký hiệu thừa (giọt mồ hôi, lấp lánh). Tạo lại với seed 13 rồi 21 và câu nhắc riêng ở `tao-regen.py`.

## 7. Chi phí và tốc độ (đo thực tế)

| Hạng mục | Số đo |
|---|---|
| Giá A100 spot | ~2,20 USD/giờ (số do chủ dự án cung cấp), pd-ssd tính thêm theo GB-tháng kể cả khi VM tắt |
| Ảnh từ vựng/cảnh (base 20 bước CFG 4, 1024) | 19,6 s/ảnh (20,4 s trên lô nhân vật), đỉnh VRAM 38,7 GiB -> ~0,012 USD/ảnh, 1.267 ảnh ≈ 6,9 giờ ≈ 15 USD |
| Tạo lại | 318 ảnh ≈ 1,7 giờ ≈ 3,8 USD |
| Biểu cảm (Edit + Lightning 8 bước, CFG 1, fp8 layerwise) | 11,1 s/ảnh, đỉnh VRAM 35,6 GiB -> ~0,0068 USD/ảnh; 439 job đã chạy ≈ 1,35 giờ ≈ 3 USD |
| Nạp pipeline | ~4 phút (đọc ~100 GB từ đĩa); tải 2512 = 262 s; tải Edit ~3-4 phút |
| Tổng GPU thuần sinh ảnh | ≈ 10 giờ ≈ 22 USD (chưa gồm thử style, nạp model, thời gian chờ và đĩa) |
| Dựng lại từ đầu | ~25-30 phút tới khi có ảnh đầu tiên (ước tính từ các số đo trên, ~1 USD) |

## 8. Cạm bẫy đã gặp và cách xử lý

| Sự cố | Nguyên nhân / cách xử lý |
|---|---|
| Module NVIDIA thành tệp 0 byte, `nvidia-smi` hỏng | cập nhật kernel khi đĩa đầy: giải phóng chỗ rồi `dkms remove` + `dkms install` + `modprobe nvidia` (mục 2) |
| Đĩa đầy 100 % | transformer Edit ~41 GB; cần >= 150 GB (khuyến nghị 200 GB). Nếu thiếu: xóa **chỉ** `~/hf/Qwen-Image-2512/transformer` (~41 GB) sau khi xong ảnh từ vựng; **đừng xóa** `text_encoder`, `tokenizer`, `vae` của 2512 vì Edit symlink tới đó |
| Processor của Edit báo lỗi | cần `torchvision==0.21.0` (cu124, khớp torch 2.6.0); cài từ `https://download.pytorch.org/whl/cu124` |
| Spot bị thu hồi giữa chừng | script đều chạy lại an toàn: ghi `*.tmp.png` rồi đổi tên; `kiem-png.sh` xóa PNG hỏng; `khoi-dong.sh` khởi động lại đúng việc dở; giám sát bật lại VM |
| Hết tài nguyên khi start spot (stockout) | thử lại mỗi ~3 phút tối đa ~30-60 phút (`bat` trong `vm-lib.sh`) rồi đổi zone |
| Quên tắt VM | `sudo shutdown -h +90` ngay khi vào, gia hạn khi còn việc; `giam-sat*.sh` có `trap` tắt VM khi thoát và trần chi phí |
| `ssh` treo | bọc `timeout` + `< /dev/null` + `--strict-host-key-checking=no`; PuTTY lần đầu hỏi lưu host key |
| `pscp` không hiểu `~` | dùng đường dẫn tương đối `$V:./thu-muc/` |
| `pkill -f` tự khớp lệnh ssh của chính nó rồi giết job | dùng mẫu `gen[.]py`, `chay-full[.]sh` và để script chạy TRÊN VM (`khoi-dong.sh`) thay vì `ssh "pgrep -f ..."` |
| OOM trên A100 40 GB | base bf16 chiếm 38,7 GiB: không chạy hai tiến trình GPU; Edit dùng fp8 layerwise casting (35,6 GiB gồm text encoder) |
| Cảnh báo `HF_HUB_ENABLE_HF_TRANSFER`, `hf_transfer` extra | vô hại với huggingface_hub 1.x (dùng hf-xet); tải ẩn danh bị giới hạn tốc độ |
| `UnicodeEncodeError` khi in tiếng Việt trên Windows | `PYTHONIOENCODING=utf-8` |

## 9. Cách tổ chức prompt và thêm mục mới

**Tệp** (`prompts/`): `prompt-n5|n4|n3|n2n1|canh.json`, mỗi tệp `{styleRef: "style-chung.json", items: [...], skipped: [...], thongKe, ...}`. Trường mỗi mục:

| Trường | Ý nghĩa |
|---|---|
| `id` | id mục giáo trình (ví dụ `voc-n5-1-1`, `canh-n2-13`, `nv-santos`) |
| `ten` | **slug ảnh duy nhất trong tệp** (kebab-case ASCII, ví dụ `giao-vien`); tên tệp ảnh = `<ten>.png` -> `<ten>.webp` |
| `prompt` | câu mô tả tiếng Anh đã gồm biểu tượng manga nếu cần (sinh bởi `sua-prompt.py`); `promptCu` = bản trước khi sửa |
| `negative` | cụm negative riêng, gộp với `negativeBase` của style (CFG 4 mới có tác dụng) |
| `vat: true` | đồ vật vô tri -> dùng `styleVat` + `negativeVat` (cấm mặt, người, kawaii) |
| `dungLai` + `dungLaiTu` | mục này **dùng lại ảnh** của mục `dungLaiTu` (cùng `ten`); `gen.py` chỉ sinh mỗi `ten` một lần |
| `bieuTuong` | khóa trong `quyUocBieuTuong.bieuTuong` của `style-chung.json` (ví dụ `hieu`, `kho`, `nong`, `dat`/`re`) |
| `kho` | 1 dễ (vật cụ thể), 2 cần bố cục / rủi ro chữ-số, 3 quan hệ-trừu tượng (nên sinh nhiều seed và duyệt) |
| `skipped[]` | từ chức năng / trừu tượng (hậu tố, trợ từ...) không có hình thể: app giữ SVG |
| `loai` | `vocab`, `canh`, `nhanvat` (chân dung / mô tả người) |

`style-chung.json`: `style`, `negativeBase`, `styleVat`, `negativeVat`, `quyUocBieuTuong` (71 biểu tượng manga + `datRe` đắt/rẻ + câu kết cấm chữ), `nhanVat.mau` (mẫu chân dung `{d}` mô tả, `{m}` miệng), `canh.hauTo` (hậu tố cảnh nhỏ gọn giữa nền trống), `mauNenSauXuLy` (`#f0ebe1`, chỉ dùng sau khi sinh).

**Thêm một từ mới**: (1) thêm mục vào đúng `prompt-<cấp>.json` (có `ten` mới duy nhất, `prompt` một câu, một chủ thể rõ ràng; từ trạng thái / cảm xúc / so sánh thì thêm câu biểu tượng từ `quyUocBieuTuong`; đồ vật thì `vat: true`); nếu nghĩa trùng ảnh có sẵn dùng `dungLai`; (2) chạy `python vm/gen.py --items <tệp> --out <thư-mục> --mode base --steps 20 --cfg 4 --seeds 11 --only <ten>` trên VM (nhớ `styleRef` tìm `style-chung.json` cạnh tệp items); (3) kéo về, `lam-nen.py --khung`, xem, tạo lại seed 22/33 nếu hỏng; (4) `webp-chi-muc.py` rồi `tools/gan_anh.py`. Prompt gốc được sinh từ giáo trình bằng `tools/tao-prompt/*` rồi `sua-prompt.py` áp style (`sua-prompt.py` đọc bản `<tệp>.json.bak` = bản gốc của builder và ghi đè `<tệp>.json`; xem mục 11).

**Thêm một nhân vật mới**: (1) thêm vào `curriculum/nhan-vat.json` (id, tên, giới tính, giọng...); (2) mô tả trong `tao-base.py` (tóc, quần áo, tuổi, miệng kín `M_SMILE`/`M_CALM`) -> `base-items.json` -> `gen.py` 3 seed -> chọn -> `lam-nen.py` -> `base/flat/<id>.png`; (3) thêm id vào `ids28.json`; (4) `mk-refs.py`, rồi tạo job biểu cảm cho id mới (`tao-full.py`), đẩy vào `inbox/`; (5) tạo lại biểu cảm lỗi bằng `tao-regen.py` (thêm câu nhắc riêng nếu cần giữ râu / ria...); (6) `xuat.py`.

## 10. Quy tắc prompt (rút ra từ các vòng thử)

1. **Không đặt mã hex màu trong prompt** (`#c96442`...): mô hình vẽ chúng thành chữ / mảng màu lạ. Chỉ dùng tên màu; màu nền `#f0ebe1` chỉ được ép bằng `lam-nen.py` sau khi sinh (style v2 mắc lỗi này).
2. **Terracotta chỉ dành cho quần áo và đồ vật, không bao giờ cho da**: nêu rõ "natural light peach skin" và đặt `terracotta skin, orange skin` vào negative.
3. **Cấm các từ gây lỗi**: `vignette` (sinh thẻ / khung bo góc), `round head` / `round faces` (đầu tròn trọc không tóc: dùng "simple solid hair shapes"), `excited with open mouth` (hở miệng, lộ răng: dùng "closed smile drawn as one curved line").
4. **Đặt loại trừ vào chính prompt dương**, không trông chờ vào negative: ở CFG 1 (Edit + Lightning) negative không có tác dụng; ở CFG 4 vẫn nên lặp lại loại trừ quan trọng ("no walls, no windows, no backdrop", "the background stays plain and empty up to all four edges").
5. **Nền và bố cục**: "drawn directly on the plain flat light warm cream background", lề trống rộng, cảnh nhỏ gọn ở giữa trên "a small soft patch of floor / shadow", cấm `card, tile, frame, rounded square backdrop, picture frame`; ảnh bị khung thì tạo lại với câu "chỉ chủ thể, không tường / cửa sổ / phòng".
6. **Đồ vật không có mặt**: dùng `styleVat` ("lifeless everyday things"), negative `face on object, kawaii, eyes, mascot, person inside object`.
7. **Từ chỉ trạng thái / cảm xúc / so sánh cần biểu tượng manga** (bóng đèn = hiểu, `?` = không biết, `!` = chợt nhận ra, giọt mồ hôi = khó, tim = thích...), kèm câu "the only symbol is ..." và "no letters, words, numbers or sound-effect lettering"; chỉ mặt người thì không đủ nghĩa.
8. **Cấm chữ / số trong ảnh**: đồng hồ không số, giá tiền / bảng hiệu để trống, không chữ hiệu ứng (onomatopoeia).
9. **Biểu cảm (Edit)**: bắt đầu bằng "Change only the facial expression ... Everything else stays identical" (cùng tóc, da, quần áo, tư thế, kích thước, viền, nền); **miệng luôn là một nét kín** ("one simple thin line or curve at the same place"); `hoi`: đầu thẳng không nghiêng, một lông mày nhướng cao, một lông mày thấp, mắt chấm to nhìn lên; `ngac_nhien`: lông mày cao đối xứng, tóc không che mắt, miệng nét kín phẳng; `hao_hung`: mắt tròn lớn có điểm sáng, miệng cười kín; giữ ria / râu bằng câu nhắc riêng; không thêm ký hiệu (giọt mồ hôi, lấp lánh).
10. **Một chủ thể, một câu rõ ràng**: nhiều chi tiết / nhiều người dễ sinh đám đông, khung, chữ; mục kho 3 nên sinh nhiều seed và duyệt.
11. **Duyệt bằng mắt trên tờ liên hệ** là bắt buộc: cảnh báo tự động chỉ gợi ý.

## 11. Những phần chưa thể tái hiện chắc chắn

- Lệnh cài driver NVIDIA gốc không được ghi lại (mục 2 dựng lại từ `dpkg -l`); `setup-edit.sh` là bản ghi chép, chưa chạy lại nguyên văn; cờ `--accelerator` và quota / stockout / giá đĩa chưa đối chiếu lại.
- `sua-prompt.py` cần các bản gốc `prompt-*.json.bak` (không lưu, theo yêu cầu bỏ `*.bak`). Có thể dựng lại bản gốc cho n5 (`tao-prompt-n5.py`), n4 (`build-n4.py`), n3 (`build-n3.cjs`), cảnh (`tao_prompt_canh.py`); riêng **n2n1 không còn builder**, chỉ còn tệp prompt cuối. Không cần chạy lại sua-prompt để tạo ảnh vì 5 tệp prompt cuối đã được lưu.
- Ảnh PNG 1024 gốc (1,1 GB `~/anh/full` + các tệp `~/nv/*.tar`), `refs28/` và `base/flat` 1024 chỉ có trên VM cũ; repo giữ webp 512 q82. Các tệp lịch sử nhỏ (log, `qa-tu-dong.json`, bản `tao-jobs-v1/v2`, `lam-nen-v1.py`, `sua-prompt-v3.py`, `prompt-*-truoc.json`) không được lưu.
- Sinh ảnh phụ thuộc phần cứng / phiên bản: cùng seed trên GPU khác hoặc phiên bản thư viện khác có thể cho ảnh khác nhau một chút.
- `tools/probe/*` và `phien-v3d.sh`, `phien-v4.sh` là dụng cụ lịch sử thử style, đã sửa đường dẫn nhưng chưa chạy lại.
