import { LANG_META, type Lang } from '@/content';

export const fmtNum = (n: number, lang: Lang) => n.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US');

export const fmtDate = (iso: string | Date, lang: Lang) =>
  new Intl.DateTimeFormat(LANG_META[lang].intl, {
    year: 'numeric',
    month: lang === 'en' ? 'long' : '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(iso));

export const stripTags = (s: string) => s.replace(/<[^>]+>/g, '');

// Đường dẫn trong site theo ngôn ngữ
export const href = (lang: Lang, path = '') => `/${lang}${path ? `/${path.replace(/^\//, '')}` : ''}`;

// 402.1 → "6:42"
export const fmtDuration = (sec: number) => {
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
};
