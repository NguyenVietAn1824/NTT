import type { MetadataRoute } from 'next';
import { getDict, LANGS } from '@/content';
import { site } from '@/content/shared';
import { getNews } from '@/lib/api';

const STATIC = ['', 'gioi-thieu', 'dich-vu', 'chinh-sach', 'tin-tuc', 'thu-vien', 'tuyen-dung', 'lien-he'];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const news = await getNews('vi', 50);
  const paths = [
    ...STATIC,
    ...getDict('vi').services.map((s) => `dich-vu/${s.slug}`),
    ...news.map((n) => `tin-tuc/${n.slug}`),
  ];
  const url = (lang: string, p: string) => `${site.url}/${lang}${p ? `/${p}` : ''}`;
  return paths.flatMap((p) =>
    LANGS.map((lang) => ({
      url: url(lang, p),
      changeFrequency: p.startsWith('tin-tuc/') ? ('monthly' as const) : ('weekly' as const),
      priority: p === '' ? 1 : 0.7,
      alternates: { languages: Object.fromEntries(LANGS.map((l) => [l, url(l, p)])) },
    })),
  );
}
