# Host website NTT miễn phí (Vercel + Render + Neon + Cloudflare R2)

Không cần máy chủ riêng. Mỗi phần chạy ở một dịch vụ có gói miễn phí:

```
Khách ──► Vercel (giao diện Next.js) ──► Render (API Express) ──► Neon (PostgreSQL)
                                                            └──► Cloudflare R2 (ảnh, video, CV)
```

| Dịch vụ | Dùng cho | Hạn mức free | Cần thẻ? |
|---|---|---|---|
| GitHub | chứa code | không giới hạn repo private | không |
| Neon | database | 0,5GB | không |
| Cloudflare R2 | ảnh, video, CV | 10GB, không tính phí lượt tải | **có** (để xác minh, không trừ tiền trong hạn mức) |
| Render | API | 750 giờ/tháng, 512MB RAM | không |
| Vercel | giao diện | 100GB băng thông/tháng | không |
| cron-job.org | giữ API không "ngủ" | miễn phí | không |

> ⚠️ **Cần biết trước**
> - Gói Hobby (free) của Vercel theo điều khoản là cho mục đích **phi thương mại**. Web công ty dùng được về mặt kỹ thuật nhưng Vercel có quyền yêu cầu nâng lên gói Pro (20 USD/tháng).
> - API trên Render free **ngủ sau 15 phút** không có ai gọi; bước 7 cài lịch "đánh thức" để tránh việc này.
> - Muốn chuyển sang máy chủ riêng sau này: làm theo [DEPLOY.md](DEPLOY.md), code không phải sửa.

Làm lần lượt từ bước 1 đến bước 8, mỗi bước ghi lại các giá trị **in đậm** vào một file nháp — các bước sau cần dùng.

---

## Bước 1 — Đưa code lên GitHub

1. Tạo tài khoản tại <https://github.com> (nếu chưa có).
2. Bấm **New repository** → tên `ntt-website` → chọn **Private** → **Create repository** (không tích thêm README).
3. Trên máy tính, trong thư mục dự án:
   ```bash
   cd ~/Learn/NTT
   git init -b main
   git add .
   git status            # kiểm tra: KHÔNG được có file .env, .env.local, *.db, *.mp4
   git commit -m "Website NTT"
   git remote add origin https://github.com/TÊN-CỦA-BẠN/ntt-website.git
   git push -u origin main
   ```
   Khi hỏi mật khẩu: GitHub không nhận mật khẩu đăng nhập, phải dùng **Personal access token** (GitHub → Settings → Developer settings → Personal access tokens → Generate, tích quyền `repo`) hoặc cài [GitHub CLI](https://cli.github.com) rồi chạy `gh auth login`.

## Bước 2 — Database: Neon ✅ (đã làm)

Project Neon `rough-recipe-67479814`, nhánh `production`, đã được liên kết bằng Neon CLI (`neon init` + `neon deploy`) và đã kiểm tra: tạo đủ 11 bảng, ghi/đọc/xóa thử thành công.

Chuỗi kết nối nằm trong file **`.env.local`** ở thư mục gốc dự án (file này không lên Git). Lấy dòng **`DATABASE_URL_UNPOOLED`** → ghi lại là **DATABASE_URL** cho bước 5.

> Dùng bản *UNPOOLED* (kết nối trực tiếp) vì khi khởi động API chạy `prisma db push` — lệnh này không chạy qua pooler. Lấy lại chuỗi khi cần: `npx neon@latest env pull`, hoặc Neon Console → **Connect** → tắt *Connection pooling*.

## Bước 3 — Kho ảnh/video: Cloudflare R2

1. Vào <https://dash.cloudflare.com/sign-up> → tạo tài khoản (không cần tên miền).
2. Menu trái **R2 Object Storage** → **Purchase R2 Plan / Add payment** → nhập thẻ (gói free, không bị trừ tiền nếu dưới 10GB).
3. **Create bucket** → tên `ntt` → Location: **Asia-Pacific (APAC)** → **Create**. Không bật Public access (ảnh đi qua API).
4. Quay lại trang R2 → **Manage R2 API Tokens** (hoặc *API → Manage API tokens*) → **Create API token**:
   - Permissions: **Object Read & Write**
   - Specify bucket: **Apply to specific buckets only** → `ntt`
   - **Create API Token**
5. Trang kết quả hiện **một lần duy nhất** — ghi lại:
   - *Access Key ID* → **S3_ACCESS_KEY_ID**
   - *Secret Access Key* → **S3_SECRET_ACCESS_KEY**
   - *Endpoint* dạng `https://<account-id>.r2.cloudflarestorage.com` → **S3_ENDPOINT** (bỏ phần `/ntt` ở cuối) — của NTT: `https://181d0f93d4df8cb9abedfc2ec715d05c.r2.cloudflarestorage.com`

> Không muốn dùng Cloudflare? Thay bằng **Backblaze B2** (free 10GB, không cần thẻ): tạo bucket Private, tạo *Application Key* quyền Read & Write cho bucket đó; `S3_ENDPOINT=https://s3.<region>.backblazeb2.com` (xem ở trang bucket), và ở bước 4 đổi `S3_REGION` thành `<region>` (VD `us-west-004`). Lưu ý B2 free giới hạn ~1GB lượt tải mỗi ngày — video nhiều người xem có thể chạm mức này.

## Bước 4 — Đặt tên cho website trên Vercel (trước, để lấy địa chỉ)

Địa chỉ web free sẽ là `https://<tên-project>.vercel.app`. Chọn trước một tên chưa ai dùng, VD `ntt-logistics` → địa chỉ dự kiến **SITE = https://ntt-logistics.vercel.app** (kiểm tra lại ở bước 6, nếu Vercel đổi tên thì sửa theo).

## Bước 5 — API: Render

1. Vào <https://render.com> → **Get Started** → đăng nhập bằng GitHub, cho phép truy cập repo `ntt-website`.
2. **New +** → **Blueprint** → chọn repo `ntt-website` → Render đọc file `render.yaml` và hiện form điền biến:

   | Biến | Giá trị |
   |---|---|
   | `DATABASE_URL` | giá trị `DATABASE_URL_UNPOOLED` trong `.env.local` (bước 2) |
   | `CORS_ORIGIN` | **SITE** ở bước 4, VD `https://ntt-logistics.vercel.app` (không có `/` cuối) |
   | `S3_ENDPOINT` | ở bước 3 |
   | `S3_ACCESS_KEY_ID` | ở bước 3 |
   | `S3_SECRET_ACCESS_KEY` | ở bước 3 |
   | `ADMIN_EMAIL` | email đăng nhập quản trị, VD `admin@nttvietnam.vn` |
   | `ADMIN_PASSWORD` | mật khẩu quản trị (≥ 8 ký tự, đổi lại sau khi đăng nhập) |

3. **Apply** → đợi 5–10 phút. Lần chạy đầu API sẽ tự: tạo bảng, nạp dữ liệu mẫu, và **tải video + ảnh từ web cũ nttvietnam.vn** sang R2 (xem tiến độ ở tab **Logs**).
4. Khi trạng thái **Live**, copy địa chỉ dịch vụ ở góc trên (VD `https://ntt-api.onrender.com` — có thể có thêm đuôi ngẫu nhiên) → ghi lại là **API**.
   Kiểm tra: mở `API/api/health` trên trình duyệt → thấy `{"ok":true,...}` là được.
5. Sau khi Logs báo nhập thư viện xong: vào **Environment** → đổi `IMPORT_OLD_LIBRARY` thành `false` → **Save Changes** (để lần khởi động sau không chạy lại, cho nhanh hơn).

## Bước 6 — Giao diện: Vercel

1. Vào <https://vercel.com/signup> → chọn **Hobby** → đăng nhập bằng GitHub.
2. **Add New… → Project** → **Import** repo `ntt-website`.
3. Cấu hình:
   - **Project Name**: tên đã chọn ở bước 4 (VD `ntt-logistics`)
   - **Root Directory**: bấm *Edit* → chọn **`frontend`**
   - **Environment Variables** — thêm 3 biến:

     | Name | Value |
     |---|---|
     | `BACKEND_URL` | **API** (VD `https://ntt-api.onrender.com`) |
     | `NEXT_PUBLIC_API_URL` | **API** (giống trên) |
     | `NEXT_PUBLIC_SITE_URL` | **SITE** (VD `https://ntt-logistics.vercel.app`) |
4. **Deploy** → đợi 2–4 phút → bấm vào ảnh xem trước để mở web.
5. Nếu địa chỉ thật khác **SITE** đã đoán: sửa `CORS_ORIGIN` trên Render và `NEXT_PUBLIC_SITE_URL` trên Vercel cho đúng (Vercel: *Settings → Environment Variables*, rồi *Deployments → ⋯ → Redeploy*).

## Bước 7 — Giữ API luôn thức

1. Vào <https://cron-job.org> → đăng ký miễn phí.
2. **Create cronjob**:
   - URL: `API/api/health` (VD `https://ntt-api.onrender.com/api/health`)
   - Schedule: **Every 10 minutes**
   - **Create**

(Một dịch vụ chạy liên tục cả tháng ≈ 744 giờ, vẫn dưới mức 750 giờ free của Render.)

## Bước 8 — Nạp nội dung

1. Mở `SITE/admin` → đăng nhập bằng `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
2. **Tài khoản** → đổi mật khẩu ngay.
3. **Video → Tải video lên** → chọn file video giới thiệu `.mp4` → tua tới khung hình đẹp, bấm *Dùng khung hình này làm ảnh bìa* → tích **★ Video nổi bật** → Tải lên. Video này sẽ hiện ở trang chủ.
4. Kiểm tra: trang chủ, Thư viện, gửi thử một form Báo giá (xem trong admin → Báo giá).

✅ Xong — website đã chạy.

---

## Gắn tên miền nttvietnam.vn (khi sẵn sàng)

1. Vercel → project → **Settings → Domains** → nhập `nttvietnam.vn` → **Add** (chọn thêm cả `www.nttvietnam.vn`).
2. Vercel hiện các bản ghi DNS cần tạo (thường: `A @ 76.76.21.21` và `CNAME www cname.vercel-dns.com`). Vào nơi quản lý tên miền (Mắt Bão, PA Việt Nam, Nhân Hòa…) → sửa đúng như vậy, xóa bản ghi A cũ của `@` và `www`. **Không xóa bản ghi MX** (email công ty).
3. Đợi Vercel báo *Valid Configuration* (vài phút tới vài giờ) — HTTPS tự có.
4. Cập nhật địa chỉ mới:
   - Render → Environment → `CORS_ORIGIN` = `https://nttvietnam.vn,https://www.nttvietnam.vn,https://ntt-logistics.vercel.app`
   - Vercel → `NEXT_PUBLIC_SITE_URL` = `https://nttvietnam.vn` → Redeploy

## Cập nhật website sau này

Sửa code trên máy → `git add . && git commit -m "mô tả" && git push`. Vercel và Render **tự động build lại** trong vài phút. Nội dung (tin tức, việc làm, ảnh, video) thì sửa trong trang `/admin`, không cần push.

## Sao lưu

- **Ảnh/video**: R2 lưu trữ bền vững, không cần làm gì.
- **Database**: Neon free giữ lịch sử khôi phục ngắn (~1 ngày). Nên sao lưu định kỳ về máy (cần cài `postgresql-client`):
  ```bash
  pg_dump "DATABASE_URL-của-Neon" | gzip > ntt-db-$(date +%F).sql.gz
  ```

## Xử lý sự cố

| Hiện tượng | Cách xử lý |
|---|---|
| Render build lỗi / API không Live | Tab **Logs**: thường do nhập sai `DATABASE_URL` hoặc khóa R2. Sửa trong Environment → Save (tự deploy lại) |
| Log báo `[storage] chưa sẵn sàng` lặp lại | Sai `S3_ENDPOINT` / khóa R2, hoặc token chưa được cấp quyền cho bucket `ntt` |
| Gửi form / tải ảnh báo lỗi, Console trình duyệt có chữ **CORS** | `CORS_ORIGIN` trên Render phải trùng **chính xác** địa chỉ web (có `https://`, không có `/` cuối) |
| Trang chủ không có tin tức / video | API đang ngủ hoặc lỗi → mở `API/api/health`; kiểm tra lịch cron-job.org còn chạy. Nội dung tự hiện lại sau tối đa 1 phút |
| Đăng nhập admin xong bị đẩy ra | Mở web bằng đúng địa chỉ `https://…vercel.app` (không mở thẳng địa chỉ Render) |
| Upload video lâu rồi lỗi | Render free có 512MB RAM; video nên dưới ~300MB. Nén video trước (HandBrake, preset *Fast 1080p30*) |
