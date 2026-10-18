# Đưa website NTT lên mạng

Toàn bộ website (trang web, API, database, kho ảnh/video, HTTPS) chạy bằng **một lệnh Docker Compose** trên một máy chủ Linux. Dùng được cho Oracle Cloud Free, VPS (Vultr, DigitalOcean, Hetzner, BizFly…) hay máy chủ riêng.

```
Internet ──► Caddy (80/443, HTTPS tự động) ──► web (Next.js) ──► api (Express) ──► db (PostgreSQL)
                                                                              └──► minio (ảnh, video, CV)
```

---

## 1. Chuẩn bị máy chủ

**Cấu hình tối thiểu:** Ubuntu 22.04 hoặc 24.04, **2GB RAM** (bước build cần ~2GB), 20GB ổ trống. Chạy được trên cả máy Intel/AMD lẫn ARM.

### Nếu dùng Oracle Cloud Free

1. Đăng ký tại <https://www.oracle.com/cloud/free/> (cần thẻ Visa/Master để xác minh, không bị trừ tiền). Chọn **Home Region: Japan East (Tokyo)** hoặc **Singapore** — không đổi được sau này.
2. **Compute → Instances → Create instance**
   - Image: **Canonical Ubuntu 24.04**
   - Shape: **Ampere → VM.Standard.A1.Flex**, chọn **2 OCPU, 12GB RAM** (nằm trong gói miễn phí)
   - Tải về **SSH private key** khi được hỏi — mất là không vào được máy
   - Nếu báo *Out of capacity*: thử lại sau vài giờ, hoặc chọn Availability Domain khác
3. Mở cổng 80/443: vào instance → **Subnet → Security List → Add Ingress Rules**
   - Source CIDR `0.0.0.0/0`, TCP, Destination port `80`
   - Thêm một rule nữa với port `443`
4. SSH vào máy (thay `IP` bằng Public IP của instance):
   ```bash
   ssh -i duong-dan/ssh-key.key ubuntu@IP
   ```
5. Ubuntu của Oracle **tự chặn cổng bằng iptables** — phải mở thêm trong máy:
   ```bash
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
   sudo netfilter-persistent save
   ```

### Nếu dùng VPS khác
Tạo máy Ubuntu, SSH vào: `ssh root@IP`. Hầu hết VPS mở sẵn cổng 80/443.

### Máy ít RAM (1–2GB): tạo swap để build không bị treo
```bash
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 2. Cài Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
exit        # thoát rồi SSH vào lại để quyền có hiệu lực
docker compose version   # kiểm tra
```

## 3. Đưa code lên máy chủ

Chạy **trên máy tính của bạn**, tại thư mục chứa project (thay `IP`, đường dẫn key):

```bash
rsync -avz --progress -e "ssh -i duong-dan/ssh-key.key" \
  --exclude node_modules --exclude .next --exclude dist \
  --exclude 'backend/.env' --exclude 'frontend/.env.local' --exclude '*.db' \
  --exclude 'backend/storage' --exclude backups --exclude '/*.mp4' --exclude '/*.jpg' \
  ./ ubuntu@IP:~/ntt/
```
(Với VPS đăng nhập root: thay `ubuntu@IP` bằng `root@IP` và bỏ phần `-e "ssh -i …"` nếu không dùng key.)

## 4. Cấu hình

Trên máy chủ:

```bash
cd ~/ntt
cp .env.production.example .env
nano .env
```

Điền các mật khẩu — tạo chuỗi ngẫu nhiên bằng `openssl rand -hex 24` (JWT_SECRET dùng `openssl rand -hex 32`).

**Lần đầu, chưa trỏ tên miền** → chạy thử bằng IP:
```ini
SITE_DOMAIN=:80
SITE_URL=http://IP-MÁY-CHỦ
COOKIE_SECURE=false
```

## 5. Chạy

```bash
docker compose up -d --build
```

Lần đầu mất 5–15 phút (build website). Xong thì mở **http://IP-MÁY-CHỦ** trên trình duyệt.

Kiểm tra: `docker compose ps` — cả 5 dịch vụ `caddy, web, api, db, minio` đều phải **Up**.

## 6. Nạp nội dung

1. **Thư viện từ website cũ** (3 video + album 13 ảnh):
   ```bash
   docker compose exec api npx tsx scripts/import-old-library.ts
   ```
2. **Video giới thiệu 6 phút** (không có trên web cũ): đăng nhập **http://IP/admin** → **Video → Tải video lên** → chọn file `.mp4` → tua tới khung hình đẹp, bấm *Dùng khung hình này làm ảnh bìa* → tích **★ Video nổi bật** → Tải lên.
3. **Đổi mật khẩu admin** ngay: Admin → Tài khoản.

## 7. Gắn tên miền + HTTPS

1. Vào nơi quản lý tên miền `nttvietnam.vn` (nhà đăng ký .vn: Mắt Bão, PA Việt Nam, Nhân Hòa…), sửa bản ghi DNS:

   | Loại | Tên | Giá trị |
   |---|---|---|
   | A | `@` | IP máy chủ |
   | A | `www` | IP máy chủ |

   Xóa các bản ghi A/AAAA cũ của `@` và `www` (đang trỏ về web cũ). **Không xóa bản ghi MX** nếu công ty dùng email theo tên miền.
2. Đợi DNS cập nhật (vài phút tới vài giờ). Kiểm tra: `ping nttvietnam.vn` ra đúng IP máy chủ.
3. Sửa `.env`:
   ```ini
   SITE_DOMAIN=nttvietnam.vn, www.nttvietnam.vn
   SITE_URL=https://nttvietnam.vn
   COOKIE_SECURE=true
   ```
4. Chạy lại (build lại vì địa chỉ website thay đổi):
   ```bash
   docker compose up -d --build
   ```
   Caddy tự xin chứng chỉ HTTPS và tự gia hạn. Mở **https://nttvietnam.vn** ✅

## 8. Sao lưu tự động (rất nên làm)

```bash
cd ~/ntt
./scripts/backup.sh          # chạy thử — tạo file trong ~/ntt/backups
crontab -e                   # thêm dòng dưới để chạy 2h sáng mỗi ngày, giữ 14 bản
0 2 * * * cd /home/ubuntu/ntt && ./scripts/backup.sh >> backups/backup.log 2>&1
```

Nên định kỳ tải thư mục `backups/` về máy khác (bản sao lưu nằm cùng máy chủ thì máy hỏng vẫn mất):
```bash
rsync -avz -e "ssh -i duong-dan/ssh-key.key" ubuntu@IP:~/ntt/backups/ ./ntt-backups/
```

Khôi phục (ghi đè dữ liệu hiện tại):
```bash
./scripts/restore.sh backups/db-NGÀY.sql.gz backups/media-NGÀY.tar.gz
```

## 9. Vận hành hằng ngày

| Việc | Lệnh (trong `~/ntt`) |
|---|---|
| Xem trạng thái | `docker compose ps` |
| Xem log | `docker compose logs -f --tail 100 api` (hoặc `web`, `caddy`) |
| Khởi động lại | `docker compose restart` |
| Cập nhật code mới | rsync code lên như bước 3, rồi `docker compose up -d --build` |
| Dừng website | `docker compose down` (dữ liệu vẫn giữ nguyên) |
| Dọn image cũ sau nhiều lần build | `docker image prune -f` |

⚠️ **Không chạy `docker compose down -v`** — tham số `-v` xóa luôn database và toàn bộ ảnh/video.

## Xử lý sự cố

| Hiện tượng | Nguyên nhân / cách xử lý |
|---|---|
| Không vào được web bằng IP | Chưa mở cổng 80: kiểm tra Security List (Oracle) + iptables ở bước 1 |
| Đăng nhập admin xong lại bị đẩy về trang login | Đang chạy `http://` mà `COOKIE_SECURE=true` → đặt `false` (hoặc bật HTTPS) rồi `docker compose up -d` |
| HTTPS không lên, log Caddy báo lỗi chứng chỉ | DNS chưa trỏ đúng IP, hoặc cổng 80/443 bị chặn. Xem `docker compose logs caddy` |
| Build bị treo / “Killed” | Thiếu RAM → tạo swap (bước 1) |
| `api` khởi động lại liên tục | `docker compose logs api` — thường do thiếu biến trong `.env` |
| Không nhận email báo giá | Điền `SMTP_*` trong `.env` (Gmail cần “Mật khẩu ứng dụng”), rồi `docker compose up -d` |
