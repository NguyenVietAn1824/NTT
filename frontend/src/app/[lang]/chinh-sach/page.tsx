import { Checks, CtaBand, PageHero } from '@/components/site';
import { getDict, type Lang } from '@/content';
import { pageMeta } from '@/lib/seo';

export function generateMetadata({ params }: { params: { lang: Lang } }) {
  const t = getDict(params.lang);
  return pageMeta({ lang: params.lang, path: 'chinh-sach', title: t.meta.policies.title, description: t.meta.policies.desc });
}

export default function PoliciesPage({ params }: { params: { lang: Lang } }) {
  const { lang } = params;
  const t = getDict(lang);
  const P = t.policies;
  return (
    <>
      <PageHero lang={lang} t={t} title={P.hero.title} sub={P.hero.sub} crumbs={[[t.nav.policies]]} img="/img/hero-fleet.jpg" pos="center 90%" />
      <section className="section">
        <div className="container with-side with-side--left">
          <aside className="side">
            <div className="side-card side-card--toc">
              <h2>{t.ui.onThisPage}</h2>
              {P.groups.map((g) => (
                <div key={g.id}>
                  <p className="side-card__group">
                    <a href={`#${g.id}`}>{g.title}</a>
                  </p>
                  <ol>
                    {g.items.map((it, i) => (
                      <li key={it.t}>
                        <a href={`#${g.id}-${i + 1}`}>{it.t}</a>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </aside>
          <div className="policies">
            {P.groups.map((g) => (
              <section className="policy-group" id={g.id} key={g.id}>
                <h2>{g.title}</h2>
                {g.items.map((it, i) => (
                  <article className="policy reveal" id={`${g.id}-${i + 1}`} key={it.t}>
                    <h3>
                      <span>{i + 1}</span>
                      {it.t}
                    </h3>
                    <Checks items={it.list} />
                  </article>
                ))}
              </section>
            ))}
          </div>
        </div>
      </section>
      <CtaBand lang={lang} t={t} />
    </>
  );
}
