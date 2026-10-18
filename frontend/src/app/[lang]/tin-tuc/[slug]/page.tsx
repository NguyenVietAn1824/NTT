import Link from 'next/link';
import { notFound } from 'next/navigation';
import Icon from '@/components/Icon';
import { ContactCard, Markdown, PageHero } from '@/components/site';
import { getDict, type Lang } from '@/content';
import { getNews, getNewsDetail } from '@/lib/api';
import { fmtDate, href } from '@/lib/format';
import { srcSet } from '@/lib/media';
import { pageMeta } from '@/lib/seo';

type Params = { lang: Lang; slug: string };

export async function generateMetadata({ params }: { params: Params }) {
  const n = await getNewsDetail(params.lang, params.slug);
  if (!n) return {};
  return pageMeta({ lang: params.lang, path: `tin-tuc/${n.slug}`, title: n.title, description: n.excerpt, image: n.coverImage || undefined });
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { lang } = params;
  const t = getDict(lang);
  const [n, all] = await Promise.all([getNewsDetail(lang, params.slug), getNews(lang, 6)]);
  if (!n) notFound();
  const others = all.filter((x) => x.slug !== n.slug).slice(0, 4);

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: n.title,
    description: n.excerpt,
    datePublished: n.publishedAt,
    image: n.coverImage ? [n.coverImage] : undefined,
    inLanguage: lang,
    publisher: { '@type': 'Organization', name: t.company.legal },
  };

  return (
    <>
      <PageHero lang={lang} t={t} title={n.title} crumbs={[[t.nav.news, 'tin-tuc'], [n.title]]} img={n.coverImage || '/img/news/kn-3.jpg'} pos="center 30%" />
      <section className="section">
        <div className="container with-side">
          <article className="prose">
            <p className="meta">
              <Icon name="calendar" /> {t.ui.published}: <time dateTime={n.publishedAt}>{fmtDate(n.publishedAt, lang)}</time>
            </p>
            <Markdown source={n.body} />
            {n.gallery.length > 0 && (
              <>
                <h2>{t.ui.gallery}</h2>
                <div className="gallery">
                  {n.gallery.map((g) => (
                    <a key={g} href={g} target="_blank" rel="noopener">
                      <img src={g} srcSet={srcSet(g)} sizes="(max-width: 640px) 50vw, 250px" alt="" loading="lazy" />
                    </a>
                  ))}
                </div>
              </>
            )}
          </article>
          <aside className="side">
            <ContactCard lang={lang} t={t} />
            {others.length > 0 && (
              <div className="side-card">
                <h2>{t.ui.related}</h2>
                <ul className="side-links side-links--news">
                  {others.map((o) => (
                    <li key={o.slug}>
                      <Link href={href(lang, `tin-tuc/${o.slug}`)}>
                        <span>{o.title}</span>
                        <time dateTime={o.publishedAt}>{fmtDate(o.publishedAt, lang)}</time>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
    </>
  );
}
