# NTT Logistics — Website

Website mới cho **Công ty TNHH Thương mại và Vận tải NTT Việt Nam** (nttvietnam.vn): 3 ngôn ngữ (Tiếng Việt · English · 日本語), form báo giá và ứng tuyển lưu vào database, trang quản trị để nhân viên tự cập nhật nội dung.

Thiết kế và phạm vi: xem [SPEC.md](SPEC.md).

## Cấu trúc

```
NTT/
├── backend/            REST API — Node.js · Express · TypeScript · Prisma
│   ├── prisma/         schema.prisma (database), seed.ts + seed-images/ (dữ liệu ban đầu)
│   ├── src/routes/     auth · public (quotes, news, jobs, applications) · admin/* · media
│   └── src/lib/        storage.ts (MinIO/S3/R2 hoặc ổ đĩa) · media.ts (xử lý ảnh)
├── frontend/           Next.js 14 (App Router, SSR)
│   ├── src/app/[lang]/ website public: /vi, /en, /ja
│   ├── src/app/admin/  trang quản trị: /admin
│   ├── src/content/    nội dung tĩnh 3 ngôn ngữ (giới thiệu, dịch vụ, chính sách…)
│   └── public/img/     ảnh lấy từ website cũ
├── docker-compose.dev.yml   MinIO cho môi trường dev
├── docker-compose.yml  production: Caddy (HTTPS) + Web + API + PostgreSQL + MinIO
├── DEPLOY.md           hướng dẫn đưa lên máy chủ (docker compose)
├── DEPLOY-FREE.md      hướng dẫn host miễn phí (Vercel + Render + Neon + R2)
├── render.yaml         cấu hình API cho Render
├── scripts/            backup.sh, restore.sh
└── SPEC.md
```

**Nội dung nào sửa ở đâu**

| Nội dung | Sửa ở |
|---|---|
| Tin tức, tuyển dụng, ảnh, video, album | Trang quản trị `/admin` |
| Yêu cầu báo giá, hồ sơ ứng tuyển | Xem/xử lý ở `/admin` (xuất Excel được) |
| Giới thiệu, dịch vụ, chính sách, số liệu, số điện thoại | `frontend/src/content/*.ts` rồi deploy lại |

## Chạy trên máy (development)

Yêu cầu: Node.js 20+, Docker.

```bash
# 0. Kho lưu ảnh MinIO — cổng 9000 (S3 API), 9001 (giao diện, ntt / ntt-dev-secret)
docker compose -f docker-compose.dev.yml up -d

# 1. Backend — cổng 4000
cd backend
npm install
cp .env.example .env          # sửa JWT_SECRET, ADMIN_PASSWORD
npm run setup                 # tạo database SQLite + bucket MinIO + dữ liệu mẫu + tài khoản admin
npm run dev

# 2. Frontend — cổng 3000 (terminal khác)
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Mở:
- Website: http://localhost:3000 (tự chuyển sang /vi, /en hoặc /ja theo ngôn ngữ trình duyệt)
- Quản trị: http://localhost:3000/admin — đăng nhập bằng `ADMIN_EMAIL` / `ADMIN_PASSWORD` trong `backend/.env` (mặc định `admin@nttvietnam.vn` / `ChangeMe@2026` — **đổi ngay** ở mục Tài khoản)

Frontend chuyển tiếp `/api/*` và `/media/*` sang backend, nên trình duyệt chỉ làm việc với một domain.

> Không muốn chạy Docker: đặt `STORAGE_DRIVER=local` trong `backend/.env` — ảnh lưu vào `backend/storage/objects/`, mọi chức năng giữ nguyên.

## Lưu trữ ảnh & bài viết

| Dữ liệu | Lưu ở đâu |
|---|---|
| Bài viết (tiêu đề, tóm tắt, nội dung Markdown — 3 ngôn ngữ) | Database: bảng `News` + `NewsTranslation` |
| Thông tin ảnh (tên, kích thước, dung lượng, alt, người upload) | Database: bảng `Media` |
| File ảnh | **Object storage** (MinIO / Cloudflare R2 / AWS S3) dưới `media/YYYY/MM/…` |
| CV ứng viên | Object storage dưới `cv/…` — **riêng tư**, chỉ admin tải qua API |

Khi upload, ảnh được xoay đúng chiều, xóa metadata (vị trí GPS…), đổi sang **WebP** và lưu 4 kích cỡ (400 / 800 / 1600 / tối đa 2400px) — thường nhẹ hơn ảnh gốc 60–80%. Website tự dùng `srcset` để điện thoại tải bản nhỏ, màn hình lớn tải bản lớn.

Ảnh được phục vụ qua `/media/...` của chính website (backend đọc từ storage, cache 1 năm), nên **đổi nhà cung cấp lưu trữ không làm hỏng đường dẫn** trong bài viết. Muốn tải thẳng từ CDN của R2, đặt `STORAGE_PUBLIC_URL`.

**Thư viện** (`/thu-vien`): video công ty và album ảnh, quản lý trong admin:
- **Video** (`/admin/videos`): tải MP4 (H.264, ≤ 600MB) có thanh tiến trình; trình duyệt tự đọc thời lượng/độ phân giải và cho chọn khung hình làm ảnh bìa (server không cần ffmpeg). Đánh dấu **★ nổi bật** để video hiện ở trang chủ.
- **Album ảnh** (`/admin/albums`): chọn ảnh từ Thư viện ảnh, sắp xếp, ảnh đầu tiên là ảnh bìa.
- Video phục vụ qua `/media/videos/...`, hỗ trợ tua (HTTP Range), chỉ tải khi người xem bấm phát.

Chuyển Thư viện từ website cũ (3 video + album 13 ảnh) sang hệ thống mới — chạy một lần, chạy lại không tạo trùng:

```bash
cd backend
npm run library:import -- --intro duong-dan/video-gioi-thieu.mp4   # --intro: video giới thiệu 6:42 (tùy chọn)
```

Trang **Thư viện ảnh** (`/admin/media`): kéo-thả nhiều ảnh, tìm kiếm, sửa mô tả (alt), sao chép đường dẫn, xem ảnh đang dùng ở bài nào, chặn xóa ảnh đang được dùng. Trình soạn tin chọn ảnh đại diện / thư viện ảnh / chèn ảnh vào nội dung từ thư viện này.

## API

| Method | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/api/health` | Kiểm tra server |
| POST | `/api/quotes` | Gửi yêu cầu báo giá (giới hạn 5 lần/10 phút/IP, có honeypot chống bot) |
| GET | `/api/news?lang=ja&limit=12` | Danh sách tin đã đăng |
| GET | `/api/news/:slug?lang=en` | Chi tiết tin (Markdown) |
| GET | `/api/jobs?lang=vi` | Vị trí đang tuyển |
| POST | `/api/applications` | Nộp hồ sơ (multipart, `cv` tùy chọn ≤ 5MB) |
| POST | `/api/auth/login` · `/logout` · GET `/me` · POST `/change-password` | Đăng nhập admin (cookie httpOnly, JWT) |
| GET | `/api/admin/stats` | Số liệu dashboard |
| GET/PATCH/DELETE | `/api/admin/quotes[/:id]`, GET `/export.csv` | Quản lý báo giá |
| CRUD | `/api/admin/news`, `/api/admin/jobs` | Quản lý tin tức, tuyển dụng (3 ngôn ngữ) |
| GET/PATCH/DELETE | `/api/admin/applications[/:id]`, GET `/:id/cv` | Hồ sơ ứng tuyển, tải CV |
| GET/POST | `/api/admin/media` | Danh sách / upload nhiều ảnh (field `files`, ≤ 15MB/ảnh, ≤ 20 ảnh/lần) |
| GET/PATCH/DELETE | `/api/admin/media/:id` | Chi tiết + nơi đang dùng / sửa alt / xóa (409 nếu đang dùng, `?force=1` để ép) |
| GET | `/api/library?lang=` · `/api/videos/featured` | Thư viện công khai: video + album / video nổi bật |
| CRUD | `/api/admin/videos` (multipart `video`, `poster`) · `/api/admin/albums` | Quản lý video, album |
| GET | `/media/*` | Ảnh công khai (chỉ prefix `media/`; CV không bao giờ đi qua đây) |

Email thông báo khi có báo giá/ứng tuyển mới: điền `SMTP_*` và `NOTIFY_EMAIL` trong `backend/.env` (ví dụ Gmail: `smtp.gmail.com`, cổng 587, dùng App Password). Để trống thì chỉ ghi log.

## Triển khai production

Host miễn phí không cần máy chủ: xem **[DEPLOY-FREE.md](DEPLOY-FREE.md)**.

Có máy chủ riêng: xem **[DEPLOY.md](DEPLOY.md)** — hướng dẫn từng bước đưa lên máy chủ (Oracle Cloud Free hoặc VPS bất kỳ): một lệnh `docker compose up -d --build` chạy toàn bộ website, database, MinIO và **Caddy (HTTPS tự động)**; kèm sao lưu/khôi phục (`scripts/backup.sh`, `scripts/restore.sh`).
