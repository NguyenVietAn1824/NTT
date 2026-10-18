// Gọi backend từ Server Components (SSR). Dữ liệu được cache và làm mới mỗi 60 giây.
import type { Lang } from '@/content';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export interface NewsSummary {
  slug: string;
  coverImage: string | null;
  publishedAt: string;
  title: string;
  excerpt: string;
}
export interface NewsDetail extends NewsSummary {
  gallery: string[];
  body: string;
  lang: Lang;
}
export interface JobItem {
  id: number;
  icon: string;
  openings: number;
  title: string;
  location: string;
  description: string | null;
}

async function get<T>(path: string, fallback: T): Promise<T> {
  try {
    // Timeout 8s: API đang khởi động (VD Render free "ngủ") thì trả nội dung dự phòng thay vì treo trang
    const res = await fetch(`${BACKEND_URL}${path}`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(8000) });
    if (res.status === 404) return fallback;
    if (!res.ok) throw new Error(`${res.status} ${path}`);
    return (await res.json()) as T;
  } catch (err) {
    // Backend tạm lỗi → trang vẫn hiển thị phần nội dung tĩnh
    console.error('[api]', err);
    return fallback;
  }
}

export const getNews = async (lang: Lang, limit = 12) =>
  (await get<{ items: NewsSummary[] }>(`/api/news?lang=${lang}&limit=${limit}`, { items: [] })).items;

export const getNewsDetail = (lang: Lang, slug: string) =>
  get<NewsDetail | null>(`/api/news/${encodeURIComponent(slug)}?lang=${lang}`, null);

export const getJobs = async (lang: Lang) => (await get<{ items: JobItem[] }>(`/api/jobs?lang=${lang}`, { items: [] })).items;

export interface VideoItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  url: string;
  poster: string | null;
  duration: number;
  width: number;
  height: number;
  featured: boolean;
  recordedAt: string | null;
}
export interface AlbumPhoto {
  id: number;
  url: string;
  thumb: string;
  width: number;
  height: number;
  alt: string;
}
export interface AlbumItem {
  id: number;
  slug: string;
  title: string;
  date: string | null;
  photos: AlbumPhoto[];
}

export const getLibrary = (lang: Lang) => get<{ videos: VideoItem[]; albums: AlbumItem[] }>(`/api/library?lang=${lang}`, { videos: [], albums: [] });

export const getFeaturedVideo = async (lang: Lang) => (await get<{ video: VideoItem | null }>(`/api/videos/featured?lang=${lang}`, { video: null })).video;
