// Địa chỉ API cho các request gửi file/form từ trình duyệt.
// - Self-host (docker compose): để trống → gọi cùng origin "/api/..." (Next rewrite sang backend).
// - Vercel: đặt NEXT_PUBLIC_API_URL=https://<api>.onrender.com → gửi thẳng tới API, tránh giới hạn ~4,5MB/request của Vercel.
export const API_ORIGIN = (() => {
  const v = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
  if (!v) return '';
  return /^https?:\/\//.test(v) ? v : `https://${v}`;
})();

export const apiUrl = (path: string) => `${API_ORIGIN}/api${path}`;
