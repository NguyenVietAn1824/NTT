# NTT Logistics — Spec thiết kế lại website

> Website: nttvietnam.vn · Chủ sở hữu: Công ty TNHH Thương mại và Vận tải NTT Việt Nam
> Phiên bản spec: 1.0 · 11/10/2026

---

## 1. Mục tiêu

| # | Mục tiêu | Đo bằng |
|---|----------|---------|
| 1 | Tạo cảm giác **một đối tác logistics chuyên nghiệp, đáng tin** ngay trong 5 giây đầu | Hero thể hiện đội xe thật, số liệu năng lực, logo khách hàng lớn |
| 2 | Phục vụ **khách hàng Nhật Bản** (Canon, Ricoh, OJI, Kanepackage…) | Website có 3 ngôn ngữ: Tiếng Việt · English · 日本語 |
| 3 | Biến người xem thành **yêu cầu báo giá** | CTA "Yêu cầu báo giá" luôn hiển thị (header, cuối mỗi trang, nút nổi Hotline/Zalo) |
| 4 | Nhanh, chuẩn SEO, dễ bảo trì | Trang tĩnh, không framework nặng, Lighthouse ≥ 90 |

## 2. Đối tượng người dùng

1. **Bộ phận mua hàng / logistics của doanh nghiệp FDI Nhật** trong các KCN miền Bắc — đọc tiếng Nhật hoặc tiếng Anh, cần thấy: năng lực đội xe, kho, giấy phép, chính sách bồi thường, sự tuân thủ pháp luật.
2. **Doanh nghiệp sản xuất / thương mại Việt Nam** — cần báo giá nhanh, gọi điện / Zalo.
3. **Ứng viên** (lái xe, công nhân kho, quản lý vận tải) — cần xem vị trí và cách ứng tuyển.

> Người Nhật đánh giá cao: thông tin **chính xác, có số liệu, có quy trình, trình bày gọn gàng**. Thiết kế đi theo hướng "corporate Nhật": nhiều khoảng trắng, lưới chặt chẽ, ít hiệu ứng thừa.

## 3. Vấn đề của website hiện tại

| Vấn đề | Cách xử lý |
|--------|-----------|
| Chỉ có VI/EN, không có tiếng Nhật dù khách chính là doanh nghiệp Nhật | Thêm bản 日本語 đầy đủ |
| Bài tin tức nằm ở bản tiếng Việt nhưng nội dung lại bằng tiếng Anh | Dịch đúng theo từng ngôn ngữ |
| Phần "Cảm nhận khách hàng" là nội dung mẫu (3 người, cùng một câu) | **Bỏ**, thay bằng logo khách hàng thật + quy trình làm việc. Khi có lời chứng thực thật thì bổ sung |
| Tin tức chép từ báo khác (DHL, Singapore…) | Chỉ giữ tin của chính công ty |
| Các trang con trả về 404 khi URL có dấu `/` ở cuối | URL dạng `ten-trang.html`, không phụ thuộc dấu `/` |
| Lỗi chính tả "Dịch vu vận tải", chữ bị ngắt từng từ ở phần Triết lý | Sửa toàn bộ |
| Bộ đếm truy cập, nhiều popup form trùng lặp | Bỏ; chỉ giữ 1 form báo giá + nút Hotline/Zalo nổi |
| Năng lực thật (100 xe, 3 kho KCN, 10 năm) bị giấu trong trang con | Đưa lên trang chủ |

## 4. Kiến trúc thông tin (sitemap)

```
/vi  /en  /ja                         (vào "/" tự chọn theo ngôn ngữ trình duyệt)
├── /                                Trang chủ
├── /gioi-thieu                      Giới thiệu (Về chúng tôi · CEO · Chặng đường · Triết lý · Cam kết · Pháp lý)
├── /dich-vu                         Tổng quan dịch vụ
│   ├── /dich-vu/dich-vu-van-tai         Vận tải đường bộ
│   ├── /dich-vu/kho-van-phan-phoi       Kho vận & phân phối
│   ├── /dich-vu/san-pham-carton         Bao bì carton công nghệ Nhật
│   └── /dich-vu/hoat-dong-thuong-mai    Hoạt động thương mại
├── /chinh-sach                      Chính sách (Ngành vận tải · Ngành sản xuất carton)
├── /tin-tuc                         Tin tức (từ database)
│   └── /tin-tuc/[slug]
├── /thu-vien                        Thư viện: video công ty + album ảnh (từ database)
├── /tuyen-dung                      Vị trí tuyển (từ database) + form nộp hồ sơ
└── /lien-he                         Liên hệ + form báo giá + bản đồ

/admin                               Trang quản trị (đăng nhập)
```

Thứ tự menu: **Giới thiệu · Dịch vụ ▾ · Chính sách · Tin tức · Tuyển dụng · Liên hệ** + nút **Yêu cầu báo giá**.
Gộp 4 trang Giới thiệu cũ thành 1 trang dài có mục lục — người đọc không phải bấm 4 lần.

## 5. Design system (v2 — trẻ trung, sáng, bo tròn)

Phong cách "travel landing": nền sáng, tiêu đề serif đậm, thẻ bo lớn + bóng mềm, mảng màu và họa tiết trang trí (blob, chấm, dấu +), icon/chip trôi nhẹ. Chữ **không bao giờ đè lên ảnh**.

| Token | Mã | Dùng cho |
|---|---|---|
| `--navy` | `#181E4B` | Tiêu đề, dải số liệu, nút outline |
| `--text` | `#5E6282` | Chữ thường |
| `--brand` | `#F5C518` | Vàng NTT (ấm) — nút chính, ô icon, nhấn |
| `--coral` | `#DF6951` | Nhãn (eyebrow), gạch chân tiêu đề hero, nút phát video, link |
| `--teal` / `--purple` | `#13867F` / `#7064E9` | Màu phụ cho icon, tiến độ, ô "gọi lại" |
| `--tint` / `--lilac` | `#F8F7FC` / `#F0ECFC` | Nền section xen kẽ / khối CTA |

- **Font:** tiêu đề *Noticia Text* (serif đậm, có tiếng Việt — thay Volkhov vốn không có dấu), chữ thường *Be Vietnam Pro*, tiếng Nhật *Noto Sans JP*.
- **Bo góc:** thẻ 24px, khung ảnh 40px/140px (hình giọt), nút 10px. **Bóng:** mềm, xanh navy 7–13%.
- **Thành phần:** hero 2 cột (ảnh trong khung blob + chip số liệu nổi), thẻ dịch vụ dạng icon, các bước quy trình với ô icon màu, thẻ "hành trình mẫu", khối thông điệp CEO kiểu testimonial, logo khách hàng màu, khối "Gọi lại cho tôi" (tên + SĐT → lưu thành yêu cầu báo giá), banner trang con 2 cột.
- **Chuyển động:** hiện dần khi cuộn, chip/icon trôi nhẹ, khung blob đổi dáng chậm; tắt hết khi `prefers-reduced-motion`.

## 6. Nội dung từng trang

### Trang chủ
1. **Hero** — ảnh đội xe Isuzu thật, tiêu đề "Vận tải & kho vận tin cậy cho doanh nghiệp sản xuất", 2 CTA, 3 điểm tin cậy (từ 2015 · 100 xe · 3 kho KCN).
2. **Dải số liệu** — 10+ năm · 100 xe · 50.000 m² kho · 24.000 chuyến hàng · 130 khách hàng · 5 trung tâm.
3. **Logo khách hàng** — Canon, Ricoh, OJI, Kanepackage, Hanel, Miki Caretech, Trung Sơn…
4. **4 dịch vụ** — thẻ có ảnh, mô tả ngắn, link chi tiết.
5. **Năng lực đội xe** — bảng 3,5T / 5T / 8T / 15T + xe đưa đón, có thanh tỷ lệ.
6. **Mạng lưới kho** — Hà Nội (VP), KCN Thăng Long 3 (Vĩnh Phúc), Đồng Văn III (Hà Nam), Nomura (Hải Phòng), mở rộng TP.HCM – Bình Dương.
7. **Lý do chọn NTT** — 6 lý do (giữ từ site cũ).
8. **Quy trình hợp tác** — 5 bước (nội dung mới, cần chú xác nhận).
9. **Tin tức** — 2 tin mới nhất.
10. **CTA báo giá** — dải tối + nút.

### Giới thiệu
Về chúng tôi → Thông điệp CEO (Nguyễn Tất Công, Tổng giám đốc) → Mốc phát triển (2015, 2025, 2026) → Triết lý kinh doanh (4 giá trị) → Cam kết dịch vụ → Thông tin pháp lý.

### Dịch vụ (4 trang chi tiết)
Mỗi trang: banner + mô tả + các mục nội dung gốc + thanh bên (mục lục, dịch vụ khác, hộp liên hệ) + CTA cuối trang.

### Chính sách
2 nhóm (Vận tải 5 mục · Sản xuất carton 6 mục), có mục lục bên trái để nhảy nhanh.

### Tin tức / Tuyển dụng / Liên hệ
- Tin tức: lưới thẻ; trang chi tiết có ảnh sự kiện.
- Tuyển dụng: 5 vị trí, địa điểm, cách ứng tuyển (gọi / email CV).
- Liên hệ: thông tin + form báo giá (loại dịch vụ, tuyến, loại hàng) + bản đồ Google.

## 7. Nội dung cần chú bổ sung / xác nhận

- [ ] Quy trình hợp tác 5 bước (đang viết theo thông lệ ngành)
- [ ] Lời chứng thực **thật** của khách hàng (tên, chức vụ, công ty — có đồng ý)
- [ ] Ảnh thật: kho bãi, xưởng carton, tài xế, văn phòng (ảnh hiện tại có ảnh minh họa)
- [ ] Logo khách hàng số 2 và 3 (chưa rõ tên công ty) — kiểm tra quyền dùng logo
- [ ] Bản dịch tiếng Nhật nên được người Nhật / phiên dịch đọc lại trước khi đăng
- [ ] Địa chỉ cụ thể các kho, diện tích từng kho
- [ ] Email nhận thông báo form + tài khoản SMTP gửi mail

## 8. Kiến trúc kỹ thuật

```
Trình duyệt ──► Nginx (HTTPS, nttvietnam.vn)
                  └─► frontend  Next.js 14 (SSR)      :3000
                        ├─ /vi /en /ja      website public
                        ├─ /admin           trang quản trị
                        └─ /api/*, /media/* ──► backend  Express + Prisma  :4000
                                                  ├─► PostgreSQL (prod) / SQLite (dev)
                                                  └─► MinIO / Cloudflare R2 / S3 (ảnh, CV)
```

| Phần | Công nghệ | Ghi chú |
|---|---|---|
| Frontend | Next.js 14 App Router, TypeScript | SSR/SSG cho SEO; nội dung tĩnh 3 ngôn ngữ trong `src/content` |
| Backend | Express 4, TypeScript, Zod | REST API, validate mọi input |
| Database | Prisma 5 — SQLite (dev), PostgreSQL (prod) | Bảng: User, Quote, News(+Translation), Job(+Translation), Application, Media, Video, Album(+AlbumPhoto) |
| Lưu trữ file | Object storage chuẩn S3 — MinIO (tự host) hoặc Cloudflare R2 / AWS S3 | Ảnh: `media/…` (công khai qua `/media`), CV: `cv/…` (riêng tư) |
| Xử lý ảnh | sharp | WebP, 400/800/1600/≤2400px, xoay EXIF, xóa metadata GPS |
| Auth | JWT trong cookie httpOnly, bcrypt | Giới hạn 10 lần đăng nhập / 15 phút |
| Chống spam | Rate limit 5 form / 10 phút / IP + honeypot | |
| File | Ảnh ≤ 15MB (tự nén), CV ≤ 5MB, kiểm tra loại file | CV chỉ admin tải qua API |
| Email | Nodemailer (SMTP) | Báo về email công ty khi có báo giá / ứng tuyển |
| Triển khai | Docker Compose (db + api + web) | |

### Phân chia nội dung

- **Quản trị được (database + object storage):** tin tức, ảnh, vị trí tuyển dụng, yêu cầu báo giá, hồ sơ ứng tuyển.
- **Trong code (`frontend/src/content`):** giới thiệu, dịch vụ, chính sách, số liệu, thông tin liên hệ — ít thay đổi, cần chuẩn SEO, sửa xong deploy lại.

### Trang quản trị `/admin`

| Mục | Chức năng |
|---|---|
| Tổng quan | Số báo giá mới, phễu trạng thái (Mới → Đã liên hệ → Đã báo giá → Chốt / Không thành), hồ sơ mới |
| Yêu cầu báo giá | Lọc theo trạng thái, tìm kiếm, ghi chú nội bộ, xuất Excel (CSV) |
| Tin tức | Soạn bài 3 ngôn ngữ (Markdown, có xem trước), chọn ảnh đại diện / thư viện ảnh / chèn ảnh từ Thư viện ảnh, nháp / hẹn ngày đăng |
| Video | Upload MP4 có tiến trình, chọn khung hình làm ảnh bìa ngay trên trình duyệt, tiêu đề/mô tả 3 ngôn ngữ, đánh dấu video nổi bật (trang chủ) |
| Album ảnh | Tạo album từ Thư viện ảnh, sắp xếp, chọn ảnh bìa |
| Thư viện ảnh | Kéo-thả upload nhiều ảnh, tự nén WebP, tìm kiếm, sửa alt, xem nơi đang dùng, chặn xóa ảnh đang dùng |
| Tuyển dụng | Thêm/sửa vị trí 3 ngôn ngữ, bật/tắt hiển thị |
| Hồ sơ ứng tuyển | Trạng thái, tải CV |
| Tài khoản | Đổi mật khẩu |

### SEO & chất lượng

- `title`/`description` riêng từng trang, canonical, `hreflang` vi/en/ja/x-default, Open Graph, JSON-LD `Organization` và `NewsArticle`, `sitemap.xml`, `robots.txt`.
- Tự chọn ngôn ngữ theo trình duyệt khi vào `/` (người dùng Nhật → `/ja`), nhớ lựa chọn bằng cookie.
- Accessibility: tương phản AA, điều hướng bàn phím, skip link, nhãn form, thông báo lỗi gắn với trường.
- Responsive: mobile-first, đã kiểm tra không tràn ngang ở 390px.
