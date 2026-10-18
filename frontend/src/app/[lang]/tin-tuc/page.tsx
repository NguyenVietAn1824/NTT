import { CtaBand, NewsCard, PageHero } from '@/components/site';
import { getDict, type Lang } from '@/content';
import { getNews } from '@/lib/api';
import { pageMeta } from '@/lib/seo';

export function generateMetadata({ params }: { params: { lang: Lang } }) {
  const t = getDict(params.lang);
  return pageMeta({ lang: params.lang, path: 'tin-tuc', title: t.meta.news.title, description: t.meta.news.desc, image: '/img/news/kn-3.jpg' });
}

export default async function NewsPage({ params }: { params: { lang: Lang } }) {
  const { lang } = params;
  const t = getDict(lang);
  const items = await getNews(lang, 50);
  return (
    <>
      <PageHero lang={lang} t={t} title={t.newsPage.hero.title} sub={t.newsPage.hero.sub} crumbs={[[t.nav.news]]} img="/img/news/kn-3.jpg" pos="center 62%" />
      <section className="section">
        <div className="container">
          {items.length ? (
            <div className="news-grid">
              {items.map((n) => (
                <NewsCard key={n.slug} lang={lang} t={t} n={n} />
              ))}
            </div>
          ) : (
            <p className="empty">{t.newsPage.empty}</p>
          )}
        </div>
      </section>
      <CtaBand lang={lang} t={t} />
    </>
  );
}
