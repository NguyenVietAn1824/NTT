import type { Metadata } from 'next';
import { LANG_META, LANGS, type Lang } from '@/content';
import { site } from '@/content/shared';

// Metadata chuẩn cho mỗi trang: canonical, hreflang vi/en/ja, Open Graph
export function pageMeta({
  lang,
  path = '',
  title,
  description,
  image = '/img/hero-fleet.jpg',
  absoluteTitle = false,
}: {
  lang: Lang;
  path?: string;
  title: string;
  description: string;
  image?: string;
  absoluteTitle?: boolean;
}): Metadata {
  const url = (l: Lang) => `/${l}${path ? `/${path}` : ''}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url(lang),
      languages: { ...Object.fromEntries(LANGS.map((l) => [LANG_META[l].htmlLang, url(l)])), 'x-default': url('vi') },
    },
    openGraph: {
      type: 'website',
      siteName: 'NTT Logistics',
      title,
      description,
      url: url(lang),
      locale: LANG_META[lang].locale,
      images: [{ url: image }],
    },
  };
}

export const metadataBase = new URL(site.url);
