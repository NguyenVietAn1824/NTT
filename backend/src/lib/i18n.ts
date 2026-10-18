import { z } from 'zod';
import { LANGS, isLang, type Lang } from '../config';

export const langOf = (v: unknown): Lang => (isLang(v) ? v : 'vi');

// Chọn bản dịch theo ngôn ngữ, mặc định về tiếng Việt
export function pickTranslation<T extends { lang: string }>(list: T[], lang: Lang): T | undefined {
  return list.find((t) => t.lang === lang) || list.find((t) => t.lang === 'vi') || list[0];
}

// { vi: {...}, en?: {...}, ja?: {...} } — tiếng Việt bắt buộc
export const translationsSchema = <S extends z.ZodTypeAny>(item: S) =>
  z.object({ vi: item, en: item.optional(), ja: item.optional() });

export const toTranslationRows = <T extends object>(tr: Partial<Record<Lang, T | undefined>>) =>
  LANGS.flatMap((lang) => (tr[lang] ? [{ lang, ...(tr[lang] as T) }] : []));
