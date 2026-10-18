import Library from '@/components/Library';
import { CtaBand, PageHero } from '@/components/site';
import { getDict, type Lang } from '@/content';
import { getLibrary } from '@/lib/api';
import { pageMeta } from '@/lib/seo';

export async function generateMetadata({ params }: { params: { lang: Lang } }) {
  const t = getDict(params.lang);
  const { videos } = await getLibrary(params.lang);
  return pageMeta({ lang: params.lang, path: 'thu-vien', title: t.meta.library.title, description: t.meta.library.desc, image: videos[0]?.poster || '/img/news/kn-3.jpg' });
}

export default async function LibraryPage({ params }: { params: { lang: Lang } }) {
  const { lang } = params;
  const t = getDict(lang);
  const { videos, albums } = await getLibrary(lang);
  const L = t.libraryPage;

  // Dữ liệu có cấu trúc cho Google (VideoObject)
  const videoLd = videos.map((v) => ({
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.title,
    description: v.description || v.title,
    thumbnailUrl: v.poster ? [v.poster] : undefined,
    contentUrl: v.url,
    duration: `PT${Math.round(v.duration)}S`,
    uploadDate: v.recordedAt || undefined,
  }));

  return (
    <>
      <PageHero lang={lang} t={t} title={L.hero.title} sub={L.hero.sub} crumbs={[[t.nav.library]]} img="/img/news/kn-3.jpg" pos="center 62%" />
      <Library videos={videos} albums={albums} t={L} lang={lang} />
      <CtaBand lang={lang} t={t} />
      {videoLd.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd) }} />}
    </>
  );
}
