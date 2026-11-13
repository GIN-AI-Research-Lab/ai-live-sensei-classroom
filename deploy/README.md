# Auto-deploy lên VPS khi merge vào `main`

Pipeline gồm 2 mảnh trong repo (cộng 1 file workflow thêm bằng tay):

| File | Vai trò |
|---|---|
| `.github/workflows/deploy.yml` | GitHub Actions: mỗi lần `push` vào `main` (tức là khi merge PR) sẽ SSH vào VPS và gọi script deploy. Cũng chạy tay được bằng nút **Run workflow** trong tab Actions. File này Joseph thêm bằng tay trên web GitHub (xem mục 1) vì Muse GitHub App không có quyền Workflows. |
| `deploy/server-deploy.sh` | Chạy trên VPS: pull `main` → setup vendor nếu thiếu → build CSS nếu có node → restart **chỉ service nào có code đổi** → health check cả hai service, **tự rollback về commit trước nếu server không sống**. |

Bản này đã đối chiếu với VPS thật ngày 2026-11-13 (xem mục 4). **Đừng dùng lại bản nháp cũ** (`/srv/sensei`, service `sensei`): VPS thật không có những thứ đó.

---

## 1. Các bước làm một lần (thứ tự quan trọng)

1. **Merge file deploy đã sửa vào `main` trước** — tức là `deploy/server-deploy.sh` và `deploy/README.md` bản này, qua một PR như các PR trước. Đồng thời **xóa `deploy/sensei.service`** (file mẫu cho VPS mới, không khớp VPS thật; cài nó đè lên service đang chạy sẽ làm sập site).
2. **Thêm workflow bằng tay trên web GitHub:** repo → Add file → Create new file → đường dẫn `.github/workflows/deploy.yml` → dán nội dung file `deploy.yml` kèm theo → Commit trực tiếp vào `main`. (Không push qua git thường được: GitHub App của Muse thiếu quyền Workflows nên push file này bị 403.)
3. **Cấp quyền restart không mật khẩu trên VPS** (SSH vào VPS bằng user `ubuntu`, chạy 1 lần):
   ```bash
   echo 'ubuntu ALL=(root) NOPASSWD: /usr/bin/systemctl restart sensei-web, /usr/bin/systemctl restart gl-proxy' | sudo tee /etc/sudoers.d/sensei-deploy
   sudo chmod 440 /etc/sudoers.d/sensei-deploy
   sudo visudo -cf /etc/sudoers.d/sensei-deploy   # phai bao "parsed OK"
   ```
4. **Tạo SSH key riêng cho GitHub Actions** (không dùng key cá nhân):
   ```bash
   # Tren may cua ban:
   ssh-keygen -t ed25519 -f ~/.ssh/sensei-deploy -N "" -C "github-actions-deploy"
   # Public key -> them vao authorized_keys cua user ubuntu TREN VPS:
   cat ~/.ssh/sensei-deploy.pub >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```
5. **Đặt Secrets + Variable trên GitHub** (repo → Settings → Secrets and variables → Actions):

   | Secret / Variable | Giá trị |
   |---|---|
   | `VPS_HOST` (secret) | `155.248.202.229` |
   | `VPS_USER` (secret) | `ubuntu` |
   | `VPS_PORT` (secret) | `22` (xác nhận lại nếu SSH VPS của bạn không dùng cổng 22) |
   | `VPS_SSH_KEY` (secret) | Toàn bộ nội dung **private key** `sensei-deploy` (file không có đuôi `.pub`) |
   | `VPS_APP_DIR` (variable, tab Variables) | `/home/ubuntu/sensei` — có thể bỏ qua vì workflow đã mặc định đúng đường dẫn này |

6. **Thử một lần:** vào tab Actions → Deploy lên VPS → Run workflow. Phải thấy xanh; nếu đỏ, đọc log Actions rồi kiểm tra trên VPS bằng `systemctl status sensei-web gl-proxy`.

Sau đó quy trình hằng ngày chỉ là: merge PR vào `main` → chờ Actions chạy xanh → xong. Không cần SSH pull tay nữa.

---

## 2. Cách hoạt động & kiểm tra

1. Merge PR vào `main` (hoặc push thẳng vào `main`, hoặc bấm **Actions → Deploy lên VPS → Run workflow**).
2. Actions SSH vào VPS, `cd /home/ubuntu/sensei`, chạy `bash deploy/server-deploy.sh`.
3. Script ghi lại commit hiện tại → pull `main` → restart service theo file đổi:
   - Chỉ đổi js/css/html → không restart gì (đúng như deploy tay PR #5, PR #6).
   - Đổi `server.py` → restart `sensei-web`; đổi `gl_proxy.py` → restart `gl-proxy`; đổi file `.py` khác → restart cả hai.
   - Sau đó health check: `http://127.0.0.1:3000/` phải trả 200, và `gl-proxy` phải active + trả mã HTTP ở cổng 3001.
   - Server không sống → script **tự reset về commit trước**, restart lại bản cũ và exit 1 → workflow đỏ, vào tab Actions đọc log để biết nguyên nhân.

Muốn xem log trên VPS: `journalctl -u sensei-web -f` và `journalctl -u gl-proxy -f`.

---

## 3. Bảo mật — key Gemini và host công khai

Site đang chạy **PROXY_MODE=1**: trình duyệt chỉ nhận key giữ chỗ (`@1`–`@4`), key thật `GEMINI_KEY1–4` nằm trong `.env` trên VPS và chỉ `gl_proxy.py` giữ. Vì vậy Live công khai qua `https://sensei.gin.info.vn` hoạt động được mà không lộ key — khác với bản nháp pipeline cũ viết trước khi có proxy (bản đó cảnh báo không mở Live công khai).

Những gì vẫn phải giữ:

- `.env` **không bao giờ** vào git; script deploy không bao giờ đụng vào `.env` hay `.venv` (cả hai nằm trong `/home/ubuntu/sensei`).
- `VPS_SSH_KEY` chỉ cấp cho user `ubuntu` và chỉ được phép restart đúng 2 service trên (mục 1.3) — không cấp sudo toàn quyền.
- Lộ private key `sensei-deploy` đồng nghĩa người lạ SSH được vào VPS bằng user `ubuntu`: giữ file key ở nơi an toàn sau khi dán vào Secrets, và thu hồi bằng cách xóa dòng public key khỏi `~/.ssh/authorized_keys` trên VPS nếu cần.

---

## 4. Cấu hình thật trên VPS (đối chiếu ngày 2026-11-13)

| Hạng mục | Giá trị thật | Bản nháp cũ (sai) |
|---|---|---|
| Thư mục app | `/home/ubuntu/sensei` (git clone của `main`) | `/srv/sensei` |
| Web server | `sensei-web.service` — `server.py`, 127.0.0.1:3000 | service `sensei` (không tồn tại) |
| Key proxy | `gl-proxy.service` — `gl_proxy.py` chạy bằng `~/sensei/.venv`, 127.0.0.1:3001 | không có |
| User chạy app / SSH deploy | `ubuntu` | user hệ thống `sensei` |
| Vào site công khai | Cloudflare Tunnel → `https://sensei.gin.info.vn` | nginx/Caddy tự dựng (chưa có) |

File `deploy/sensei.service` trong repo là mẫu cho một VPS mới toanh (user `sensei`, `/srv/sensei`, chỉ chạy `server.py` bằng python hệ thống, không có proxy) — **không khớp VPS hiện tại và không được cài lên đó**. Nó sẽ bị xóa khi merge bản sửa này; nếu sau này dựng VPS mới thì viết lại unit theo đúng bảng trên.
