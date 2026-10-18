import en from './en';
import ja from './ja';
import vi, { type Dict } from './vi';

export const LANGS = ['vi', 'en', 'ja'] as const;
export type Lang = (typeof LANGS)[number];
export type { Dict };

export const LANG_META: Record<Lang, { label: string; name: string; htmlLang: string; locale: string; intl: string }> = {
  vi: { label: 'VI', name: 'Tiếng Việt', htmlLang: 'vi', locale: 'vi_VN', intl: 'vi-VN' },
  en: { label: 'EN', name: 'English', htmlLang: 'en', locale: 'en_US', intl: 'en-US' },
  ja: { label: 'JA', name: '日本語', htmlLang: 'ja', locale: 'ja_JP', intl: 'ja-JP' },
};

const dicts: Record<Lang, Dict> = { vi, en, ja };

export const isLang = (v: string): v is Lang => (LANGS as readonly string[]).includes(v);
export const getDict = (lang: Lang): Dict => dicts[lang];
