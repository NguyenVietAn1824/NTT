// Địa chỉ API cho các request gửi file/form từ trình duyệt.
// - Self-host (docker compose): để trống → gọi cùng origin "/api/..." (Next rewrite sang backend).
// - Vercel: đặt NEXT_PUBLIC_API_URL=https://<api>.onrender.com → gửi thẳng tới API, tránh giới hạn ~4,5MB/request của Vercel.
export const API_ORIGIN = (() => {
  const v = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
  if (!v) return '';
  return /^https?:\/\//.test(v) ? v : `https://${v}`;
})();

export const apiUrl = (path: string) => `${API_ORIGIN}/api${path}`;

// Video phát thẳng từ API (khi API ở domain khác, VD Render) thay vì đi qua rewrite của Vercel:
// file lớn + HTTP Range không nên đi qua CDN của Vercel.
export const videoSrc = (url: string) => (API_ORIGIN && url.startsWith('/media/') ? `${API_ORIGIN}${url}` : url);
