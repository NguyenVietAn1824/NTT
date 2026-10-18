import Image from 'next/image';
import Icon from '@/components/Icon';
import { Checks, CtaBand, Html, PageHero, SectionHead } from '@/components/site';
import { getDict, type Lang } from '@/content';
import { stats } from '@/content/shared';
import { fmtNum } from '@/lib/format';
import { pageMeta } from '@/lib/seo';

export function generateMetadata({ params }: { params: { lang: Lang } }) {
  const t = getDict(params.lang);
  return pageMeta({ lang: params.lang, path: 'gioi-thieu', title: t.meta.about.title, description: t.meta.about.desc });
}

export default function AboutPage({ params }: { params: { lang: Lang } }) {
  const { lang } = params;
  const t = getDict(lang);
  const A = t.about;
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US';

  return (
    <>
      <PageHero lang={lang} t={t} title={A.hero.title} sub={A.hero.sub} crumbs={[[t.nav.about]]} img="/img/hero-fleet.jpg" />
      <nav className="subnav" aria-label={t.ui.onThisPage}>
        <div className="container">
          <ul>
            {Object.entries(A.toc).map(([k, v]) => (
              <li key={k}>
                <a href={`#${k}`}>{v}</a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <section className="section" id="intro">
        <div className="container split split--top">
          <div className="reveal">
            <SectionHead eyebrow={A.intro.eyebrow} title={A.intro.title} />
            {A.intro.body.map((p) => (
              <Html key={p} as="p" html={p} />
            ))}
          </div>
          <div className="about-media reveal">
            <Image src="/img/services/van-tai.png" alt={t.company.brand} width={600} height={450} />
            <div className="about-media__badge">
              <strong>{stats[0].value}+</strong>
              <span>{t.stats.years}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--mist" id="ceo">
        <div className="container ceo reveal">
          <p className="eyebrow">{A.ceo.eyebrow}</p>
          <blockquote className="ceo__quote">{A.ceo.quote}</blockquote>
          <div className="ceo__body">
            {A.ceo.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className="ceo__sign">
            <span className="ceo__avatar" aria-hidden="true">
              NTC
            </span>
            <div>
              <strong>{A.ceo.name}</strong>
              <span>{A.ceo.role}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="timeline">
        <div className="container">
          <SectionHead eyebrow={A.timeline.eyebrow} title={A.timeline.title} />
          <ol className="timeline">
            {A.timeline.items.map((x) => (
              <li className="timeline__item reveal" key={x.year}>
                <span className="timeline__year">{x.year}</span>
                <h3>{x.t}</h3>
                <p>{x.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--dark" id="values">
        <div className="container">
          <SectionHead eyebrow={A.values.eyebrow} title={A.values.title} light />
          <div className="values">
            {A.values.items.map((v, i) => (
              <div className="value reveal" key={v.t}>
                <span className="value__num">0{i + 1}</span>
                <span className="value__icon">
                  <Icon name={v.icon} />
                </span>
                <h3>{v.t}</h3>
                <p>{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="commitment">
        <div className="container split split--top">
          <div className="reveal">
            <SectionHead eyebrow={A.commitment.eyebrow} title={A.commitment.title} />
            {A.commitment.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <Checks items={A.commitment.points} />
          </div>
          <div className="stats-box reveal">
            {stats.slice(1).map((s) => (
              <div className="stat stat--boxed" key={s.key}>
                <div className="stat__num">
                  <span data-count={s.value} data-locale={locale}>
                    {fmtNum(s.value, lang)}
                  </span>
                  {s.suffix}
                </div>
                <div className="stat__label">{t.stats[s.key]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--mist" id="legal">
        <div className="container narrow reveal">
          <h2 className="h-sm">{A.legal.title}</h2>
          <dl className="legal">
            {A.legal.rows.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <CtaBand lang={lang} t={t} />
    </>
  );
}
