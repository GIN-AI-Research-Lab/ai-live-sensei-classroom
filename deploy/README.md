# Auto-deploy lên VPS khi merge vào `main`

Pipeline gồm 3 mảnh trong repo:

| File | Vai trò |
|---|---|
| `.github/workflows/deploy.yml` | GitHub Actions: mỗi lần `push` vào `main` (tức là khi merge PR) sẽ SSH vào VPS và gọi script deploy. Cũng chạy tay được bằng nút **Run workflow** trong tab Actions. |
| `deploy/server-deploy.sh` | Chạy trên VPS: pull `main` → setup vendor nếu thiếu → build CSS nếu có node → restart service → health check, **tự rollback về commit trước nếu server không sống**. |
| `deploy/sensei.service` | systemd unit mẫu để `server.py` chạy nền, tự khởi động lại khi sập/mở máy. |

Các bước dưới đây chỉ làm **một lần** khi đấu nối VPS. Sau đó quy trình hằng ngày chỉ là: merge PR vào `main` → chờ Actions chạy xanh → xong.

---

## ⚠️ ĐỌC TRƯỚC — cảnh báo bảo mật về API key và host công khai

`server.py` hiện **chủ động chặn cấp `env.js`** (file chứa Gemini API key để trình duyệt gọi Live) cho các host công khai: chỉ localhost / mạng nội bộ / các host trong `ALLOWED_HOSTS` mới lấy được key. Đây là thiết kế chống lộ key có chủ đích.

Hệ quả thực tế khi đưa lên VPS:

- Nếu mở site ra **domain công khai** thì giao diện vẫn chạy, nhưng tính năng **Live sẽ không lấy được key** → không dùng được.
- **TUYỆT ĐỐI KHÔNG** đặt `ALLOWED_HOSTS=*` trong `.env` để "lách" qua lớp chặn này: bất kỳ ai mở trang cũng tải được Gemini key của bạn về máy họ.
- Hai chế độ vận hành an toàn được khuyến nghị:
  - **(a) Dùng Live với key thật:** chạy nội bộ — qua Tailscale/VPN, hoặc đặt một lớp đăng nhập phía trước ở reverse proxy (ví dụ basic auth của Caddy/nginx) và thêm đúng tên host đó vào `ALLOWED_HOSTS`. Chỉ người được cấp quyền mới vào được trang, key không lộ ra internet mở.
  - **(b) Mở công khai:** chỉ ở **chế độ mô phỏng không key** (`?noLive&moPhong...`) cho người ngoài xem thử.
- Muốn mở Live công khai cho nhiều người dùng thật thì **phải làm backend proxy key riêng trước** (server giữ key, trình duyệt không bao giờ thấy key). Việc đó nằm ngoài pipeline deploy này.

---

## 1. Chuẩn bị VPS (làm 1 lần)

Giả định Ubuntu/Debian. App sẽ nằm ở `/srv/sensei` (nếu để chỗ khác, xem biến `VPS_APP_DIR` ở mục 3).

```bash
# Cai cong cu
sudo apt update && sudo apt install -y git python3 curl
# (Tuy chon) node/npm neu muon VPS tu build lai CSS khi deploy:
# sudo apt install -y nodejs npm

# Tao user rieng cho app
sudo useradd --system --home /srv/sensei --shell /usr/sbin/nologin sensei
sudo mkdir -p /srv/sensei

# Clone repo (VPS chi can QUYEN DOC: dung HTTPS neu repo public,
# hoac tao Deploy key chi-doc trong repo Settings > Deploy keys roi clone bang SSH)
sudo git clone https://github.com/GIN-AI-Research-Lab/ai-live-sensei-classroom.git /srv/sensei
sudo chown -R sensei:sensei /srv/sensei
```

Nếu user SSH mà GitHub Actions dùng để deploy (mục 2) **khác** user `sensei`, hãy bảo đảm user đó ghi được vào `/srv/sensei` (đơn giản nhất: dùng chính user `sensei` làm user deploy và cấp cho nó shell đăng nhập, hoặc thêm user deploy vào group `sensei` và `chmod -R g+w /srv/sensei`).

```bash
# Tao .env tren VPS (file nay KHONG co trong git, deploy khong bao gio dung vao)
cd /srv/sensei
sudo cp .env.example .env
sudo nano .env        # dien GEMINI_KEY1 (va ALLOWED_HOSTS neu theo che do (a) o tren)
sudo chown sensei:sensei .env && sudo chmod 600 .env

# Tai vendor (Tailwind/FontAwesome...) — deploy script se tu lam neu thieu,
# nhung chay truoc 1 lan de lan deploy dau tien nhanh va lo loi som:
sudo -u sensei python3 tools/setup_vendor.py

# Cai systemd service
sudo cp deploy/sensei.service /etc/systemd/system/sensei.service
sudo systemctl daemon-reload
sudo systemctl enable --now sensei
systemctl status sensei        # phai thay active (running)
curl -fsS http://127.0.0.1:3000/ >/dev/null && echo SERVER-OK
```

### Cho phép user deploy restart service không cần mật khẩu

Script deploy chạy `sudo systemctl restart sensei`. Cấp đúng **một lệnh duy nhất** đó, không cấp sudo toàn quyền:

```bash
# Thay "sensei" bang dung user ma GitHub Actions se SSH vao (VPS_USER o muc 2)
echo 'sensei ALL=(root) NOPASSWD: /usr/bin/systemctl restart sensei' | sudo tee /etc/sudoers.d/sensei-deploy
sudo chmod 440 /etc/sudoers.d/sensei-deploy
sudo visudo -cf /etc/sudoers.d/sensei-deploy   # phai bao "parsed OK"
```

## 2. SSH key riêng cho GitHub Actions

Tạo một keypair **riêng cho việc deploy** (không dùng key cá nhân của bạn):

```bash
# Tren may cua ban (hoac ngay tren VPS trong home cua user deploy):
ssh-keygen -t ed25519 -f ~/.ssh/sensei-deploy -N "" -C "github-actions-deploy"

# Public key -> them vao authorized_keys cua user deploy TREN VPS:
cat ~/.ssh/sensei-deploy.pub >> ~/.ssh/authorized_keys   # chay tren VPS, dung user deploy
chmod 600 ~/.ssh/authorized_keys
```

Sau đó vào GitHub repo → **Settings → Secrets and variables → Actions** và tạo các **Repository secrets**:

| Secret | Giá trị |
|---|---|
| `VPS_HOST` | IP hoặc hostname của VPS (vd `203.0.113.10`) |
| `VPS_USER` | User SSH mà Actions đăng nhập (user đã gắn public key ở trên, vd `sensei`) |
| `VPS_PORT` | Cổng SSH (thường `22`) |
| `VPS_SSH_KEY` | Toàn bộ nội dung **private key** `sensei-deploy` (file không có đuôi `.pub`) |

Tuỳ chọn: nếu app không nằm ở `/srv/sensei`, tạo **Repository variable** (tab Variables, không phải Secrets) tên `VPS_APP_DIR` với đường dẫn thật. Không đặt thì mặc định là `/srv/sensei`.

Giữ private key ở nơi an toàn sau khi đã dán vào Secrets; lộ key này đồng nghĩa người lạ SSH được vào VPS bằng user deploy.

## 3. Cách hoạt động & kiểm tra

1. Merge PR vào `main` (hoặc push thẳng vào `main`, hoặc bấm **Actions → Deploy lên VPS → Run workflow**).
2. Actions SSH vào VPS, `cd` tới thư mục app, chạy `bash deploy/server-deploy.sh`.
3. Script ghi lại commit hiện tại → pull `main` → restart `sensei` → gọi `http://127.0.0.1:3000/` tối đa 15 lần (mỗi giây 1 lần).
   - Server sống → in commit mới, workflow xanh.
   - Server không sống → script **tự reset về commit trước**, restart lại bản cũ và exit 1 → workflow đỏ, vào tab Actions đọc log để biết nguyên nhân.

Muốn xem log trên VPS: `journalctl -u sensei -f`.

## 4. Gắn domain + HTTPS (reverse proxy)

`server.py` chỉ nghe cổng 3000 ở localhost. Muốn có domain, đặt reverse proxy phía trước. **Trình duyệt chỉ cấp quyền mic trên HTTPS** (hoặc localhost), nên HTTPS là bắt buộc nếu dùng tính năng nói chuyện — và nhớ đọc lại cảnh báo bảo mật ở đầu file trước khi mở ra domain công khai.

**Caddy** (tự xin & gia hạn Let's Encrypt, ngắn nhất):

```caddyfile
sensei.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

**nginx** (HTTPS xin bằng `certbot --nginx -d sensei.example.com`):

```nginx
server {
    listen 80;
    server_name sensei.example.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
