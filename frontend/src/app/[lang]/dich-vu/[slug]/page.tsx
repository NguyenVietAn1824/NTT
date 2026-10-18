import Link from 'next/link';
import { notFound } from 'next/navigation';
import Icon from '@/components/Icon';
import { Blocks, ContactCard, CtaBand, Html, PageHero, tocFrom } from '@/components/site';
import { getDict, LANGS, type Lang } from '@/content';
import { serviceMeta } from '@/content/shared';
import { href, stripTags } from '@/lib/format';
import { pageMeta } from '@/lib/seo';

type Params = { lang: Lang; slug: string };

export const dynamicParams = false;
export const generateStaticParams = () => LANGS.flatMap((lang) => getDict(lang).services.map((s) => ({ lang, slug: s.slug })));

const find = (p: Params) => getDict(p.lang).services.find((s) => s.slug === p.slug);

export function generateMetadata({ params }: { params: Params }) {
  const s = find(params);
  if (!s) return {};
  return pageMeta({ lang: params.lang, path: `dich-vu/${s.slug}`, title: stripTags(s.title), description: stripTags(s.short), image: serviceMeta[s.slug].img });
}

export default function ServiceDetailPage({ params }: { params: Params }) {
  const { lang } = params;
  const t = getDict(lang);
  const s = find(params);
  if (!s) notFound();
  const m = serviceMeta[s.slug];
  const toc = tocFrom(s.body);

  return (
    <>
      <PageHero lang={lang} t={t} title={s.title} sub={s.short} crumbs={[[t.nav.services, 'dich-vu'], [s.title]]} img={m.img} />
      <section className="section">
        <div className="container with-side">
          <article className="prose">
            <Html as="p" className="lead" html={s.lead} />
            <Blocks blocks={s.body} lang={lang} t={t} />
            <div className="callout">
              <Icon name="chat" />
              <div>
                <p>{s.ctaText}</p>
                <Link className="btn btn--primary" href={href(lang, 'lien-he#quote')}>
                  {t.ui.quote}
                </Link>
              </div>
            </div>
          </article>
          <aside className="side">
            <div className="side-card side-card--toc">
              <h2>{t.ui.onThisPage}</h2>
              <ol>
                {toc.map((x) => (
                  <li key={x.id}>
                    <a href={`#${x.id}`}>{x.label}</a>
                  </li>
                ))}
              </ol>
            </div>
            <ContactCard lang={lang} t={t} />
            <div className="side-card">
              <h2>{t.ui.otherServices}</h2>
              <ul className="side-links">
                {t.services
                  .filter((o) => o.slug !== s.slug)
                  .map((o) => (
                    <li key={o.slug}>
                      <Link href={href(lang, `dich-vu/${o.slug}`)}>
                        <Icon name={serviceMeta[o.slug].icon} />
                        <span>{o.title}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
      <CtaBand lang={lang} t={t} />
    </>
  );
}
