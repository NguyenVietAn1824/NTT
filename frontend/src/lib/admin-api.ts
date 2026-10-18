'use client';

import { API_ORIGIN } from './endpoint';

// Gọi API quản trị từ trình duyệt (cookie phiên httpOnly đi kèm tự động)
export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: Record<string, unknown>) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...rest,
    headers: json !== undefined ? { 'Content-Type': 'application/json', ...headers } : headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (res.status === 401 && !path.startsWith('/auth/login')) {
    window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
    throw new ApiError(401, 'Unauthorized');
  }
  const data = res.headers.get('content-type')?.includes('application/json') ? await res.json() : null;
  if (!res.ok) throw new ApiError(res.status, data?.error || `HTTP ${res.status}`, data?.details);
  return data as T;
}

export interface MediaItem {
  id: number;
  url: string;
  thumb: string;
  filename: string;
  alt: string;
  width: number;
  height: number;
  size: number;
  originalSize: number;
  createdAt: string;
  variants: { w: number; h: number; url: string; size: number }[];
}

// Upload nhiều ảnh vào thư viện; server nén sang WebP và tạo các kích cỡ
export async function uploadMedia(files: File[] | FileList): Promise<{ items: MediaItem[]; failed: { filename: string; error: string }[] }> {
  const fd = new FormData();
  Array.from(files).forEach((f) => fd.append('files', f));
  if (!API_ORIGIN) return api('/admin/media', { method: 'POST', body: fd });
  const res = await fetch(`${API_ORIGIN}/api/admin/media`, { method: 'POST', body: fd, headers: { Authorization: `Bearer ${await uploadToken()}` } });
  const data = res.headers.get('content-type')?.includes('application/json') ? await res.json() : null;
  if (!res.ok) throw new ApiError(res.status, data?.error || (res.status === 413 ? 'File quá lớn' : `HTTP ${res.status}`), data?.details);
  return data;
}

// Khi API ở domain khác (Vercel + Render): upload gửi thẳng tới API kèm token ngắn hạn thay cho cookie
async function uploadToken(): Promise<string> {
  return (await api<{ token: string }>('/auth/upload-token')).token;
}

export const fmtBytes = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export const errMsg = (e: unknown) => {
  if (e instanceof ApiError && e.details && !('usage' in e.details)) return Object.entries(e.details).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`).join(' · ');
  return e instanceof Error ? e.message : 'Có lỗi xảy ra';
};

export const fmtDateTime = (iso: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(iso));

export const QUOTE_STATUS: Record<string, { label: string; tone: string }> = {
  NEW: { label: 'Mới', tone: 'yellow' },
  CONTACTED: { label: 'Đã liên hệ', tone: 'blue' },
  QUOTED: { label: 'Đã báo giá', tone: 'purple' },
  WON: { label: 'Chốt hợp đồng', tone: 'green' },
  LOST: { label: 'Không thành', tone: 'gray' },
};

export const APP_STATUS: Record<string, { label: string; tone: string }> = {
  NEW: { label: 'Mới', tone: 'yellow' },
  REVIEWING: { label: 'Đang xem xét', tone: 'blue' },
  INTERVIEW: { label: 'Hẹn phỏng vấn', tone: 'purple' },
  HIRED: { label: 'Đã tuyển', tone: 'green' },
  REJECTED: { label: 'Không phù hợp', tone: 'gray' },
};

export const LANG_LABEL = { vi: 'Tiếng Việt', en: 'English', ja: '日本語' } as const;

// Upload multipart có báo tiến độ (video vài trăm MB)
export async function uploadWithProgress<T>(path: string, method: 'POST' | 'PUT', body: FormData, onProgress: (pct: number) => void): Promise<T> {
  const token = API_ORIGIN ? await uploadToken() : '';
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${API_ORIGIN}/api${path}`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    else xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data: { error?: string; details?: Record<string, unknown> } | null = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* không phải JSON */
      }
      if (xhr.status === 401) {
        window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
        return reject(new ApiError(401, 'Unauthorized'));
      }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data as T);
      reject(new ApiError(xhr.status, data?.error || (xhr.status === 413 ? 'File quá lớn' : `HTTP ${xhr.status}`), data?.details));
    };
    xhr.onerror = () => reject(new ApiError(0, 'Mất kết nối khi tải lên'));
    xhr.send(body);
  });
}

export const fmtDur = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
