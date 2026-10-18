// Ảnh trong thư viện được lưu nhiều kích cỡ: <tên>-400.webp, -800, -1600 và bản lớn nhất (≤ 2400).
// Từ URL bản lớn nhất suy ra srcset để trình duyệt tự chọn cỡ phù hợp màn hình.
const WIDTHS = [400, 800, 1600];
const RE = /^(.*\/media\/.+)-(\d+)\.webp$/;

export function srcSet(url?: string | null): string | undefined {
  const m = url ? RE.exec(url) : null;
  if (!m) return undefined;
  const top = Number(m[2]);
  return [...WIDTHS.filter((w) => w < top), top].map((w) => `${m[1]}-${w}.webp ${w}w`).join(', ');
}

// Bản có chiều rộng ≤ maxW (VD 400 cho thumbnail). Ảnh ngoài thư viện giữ nguyên URL.
export function sized(url: string | null | undefined, maxW: number): string | undefined {
  const m = url ? RE.exec(url) : null;
  if (!m) return url || undefined;
  const top = Number(m[2]);
  if (top <= maxW) return url!;
  const w = [...WIDTHS].reverse().find((x) => x <= maxW) || WIDTHS[0];
  return `${m[1]}-${w}.webp`;
}

export const thumb = (url?: string | null) => sized(url, 400);
