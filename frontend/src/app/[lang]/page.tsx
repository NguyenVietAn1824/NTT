import Image from 'next/image';
import Link from 'next/link';
import HeroVideo from '@/components/HeroVideo';
import Icon from '@/components/Icon';
import IntroVideo from '@/components/IntroVideo';
import { Checks, CtaBand, FleetTable, Html, NewsCard, Process, SectionHead, ServiceCard } from '@/components/site';
import { getDict, type Lang } from '@/content';
import { partners, stats } from '@/content/shared';
import { getFeaturedVideo, getNews } from '@/lib/api';
import { fmtNum, href } from '@/lib/format';
import { pageMeta } from '@/lib/seo';

export function generateMetadata({ params }: { params: { lang: Lang } }) {
  const t = getDict(params.lang);
  return pageMeta({ lang: params.lang, title: t.meta.home.title, description: t.meta.home.desc, absoluteTitle: true });
}

export default async function HomePage({ params }: { params: { lang: Lang } }) {
  const { lang } = params;
  const t = getDict(lang);
  const H = t.home;
  const [news, featured] = await Promise.all([getNews(lang, 3), getFeaturedVideo(lang)]);
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US';

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div className="container">
          <figure className="hero__photo">
            <Image src="/img/hero-fleet.jpg" alt={t.company.brand} fill priority sizes="(max-width: 1280px) 100vw, 1240px" />
          </figure>
        </div>
        <div className="container hero__body">
          <div className="hero__inner">
            <div className="hero__head">
              <p className="eyebrow eyebrow--coral">{H.hero.eyebrow}</p>
              <Html as="h1" className="hero__title" html={H.hero.title} />
            </div>
            <div className="hero__text">
              <p className="hero__sub">{H.hero.sub}</p>
              <div className="hero__actions">
                <Link className="btn btn--primary btn--lg" href={href(lang, 'lien-he#quote')}>
                  {t.ui.quote}
                </Link>
                {featured ? (
                  <HeroVideo video={featured} label={H.hero.play} t={t.libraryPage} />
                ) : (
                  <Link className="btn btn--ghost btn--lg" href={href(lang, 'dich-vu')}>
                    {H.hero.cta2}
                  </Link>
                )}
              </div>
              <ul className="hero__trust">
                {H.hero.trust.map((x) => (
                  <li key={x}>
                    <Icon name="check" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <ul className="hero__facts">
            <li>
              <Icon name="truck" /> <b>100</b> {t.stats.trucks}
            </li>
            <li>
              <Icon name="warehouse" /> <b>{fmtNum(50000, lang)}</b> m²
            </li>
            <li>
              <Icon name="shield" /> <b>10+</b> {t.stats.years}
            </li>
          </ul>
        </div>
      </section>

      {/* ---------- Khách hàng ---------- */}
      <section className="partners">
        <div className="container">
          <p className="partners__title">{H.partners.title}</p>
          <ul className="partners__grid">
            {partners.map((p) => (
              <li key={p.img}>
                <Image src={`/img/partners/${p.img}`} alt={p.name} width={168} height={120} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Dịch vụ ---------- */}
      <section className="section section--deco">
        <span className="deco-plus deco-plus--tr" aria-hidden="true" />
        <div className="container">
          <SectionHead eyebrow={H.services.eyebrow} title={H.services.title} sub={H.services.sub} center />
          <div className="svc-icons">
            {t.services.map((s, i) => (
              <ServiceCard key={s.slug} lang={lang} t={t} s={s} variant="icon" index={i} />
            ))}
          </div>
          {featured && <IntroVideo video={featured} t={H.video} />}
        </div>
      </section>

      {/* ---------- Số liệu ---------- */}
      <section className="stats" aria-label={H.fleet.eyebrow}>
        <div className="container stats__grid">
          {stats.map((s) => (
            <div className="stat reveal" key={s.key}>
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
      </section>

      {/* ---------- Quy trình + hành trình mẫu ---------- */}
      <section className="section">
        <div className="container split">
          <div className="reveal">
            <SectionHead eyebrow={H.process.eyebrow} title={H.process.title} />
            <Process steps={H.process.steps} />
          </div>
          <div className="trip reveal" aria-hidden="true">
            <span className="trip__glow" />
            <div className="trip__card">
              <div className="trip__img">
                <Image src="/img/services/van-tai.png" alt="" fill sizes="380px" />
              </div>
              <p className="trip__label">{H.track.label}</p>
              <h3>{H.track.title}</h3>
              <p className="trip__meta">{H.track.meta}</p>
              <div className="trip__icons">
                <span>
                  <Icon name="truck" />
                </span>
                <span>
                  <Icon name="file" />
                </span>
                <span>
                  <Icon name="shield" />
                </span>
              </div>
              <p className="trip__foot">
                <Icon name="file" /> {H.track.people}
              </p>
            </div>
            <div className="trip__mini">
              <span className="trip__mini-icon">
                <Icon name="route" />
              </span>
              <div>
                <small>{H.track.status}</small>
                <strong>{H.track.title.split('→')[1]?.trim() || H.track.title}</strong>
                <div className="trip__bar">
                  <span style={{ width: '72%' }} />
                </div>
                <small className="trip__pct">{H.track.progress}</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Đội xe ---------- */}
      <section className="section section--tint">
        <div className="container split">
          <div className="reveal">
            <SectionHead eyebrow={H.fleet.eyebrow} title={H.fleet.title} sub={H.fleet.sub} />
            <div className="passenger">
              <h3>
                <Icon name="users" /> {H.fleet.passenger.title}
              </h3>
              <p>{H.fleet.passenger.text}</p>
              <Checks items={H.fleet.passenger.items} small />
            </div>
            <Link className="link-arrow" href={href(lang, 'dich-vu/dich-vu-van-tai')}>
              {H.fleet.cta} <Icon name="arrow" />
            </Link>
          </div>
          <div className="reveal">
            <FleetTable lang={lang} t={t} />
          </div>
        </div>
      </section>

      {/* ---------- Mạng lưới ---------- */}
      <section className="section">
        <div className="container">
          <SectionHead eyebrow={H.network.eyebrow} title={H.network.title} sub={H.network.sub} center />
          <ol className="network">
            {H.network.items.map((n, i) => (
              <li key={n.name} className={`network__item reveal${i === H.network.items.length - 1 ? ' network__item--future' : ''}`}>
                <span className="network__pin">
                  <Icon name="pin" />
                </span>
                <span className="network__tag">{n.tag}</span>
                <h3>{n.name}</h3>
                <p>{n.place}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Vì sao chọn NTT ---------- */}
      <section className="section section--tint section--deco">
        <div className="container">
          <SectionHead eyebrow={H.why.eyebrow} title={H.why.title} center />
          <div className="why-grid">
            {H.why.items.map((w, i) => (
              <div className="why reveal" key={w.t}>
                <span className={`why__icon tone-${i % 5}`}>
                  <Icon name={w.icon} />
                </span>
                <h3>{w.t}</h3>
                <p>{w.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Thông điệp CEO (kiểu testimonial) ---------- */}
      <section className="section">
        <div className="container split split--top">
          <div className="reveal">
            <SectionHead eyebrow={H.ceo.eyebrow} title={H.ceo.title} />
            <Link className="link-arrow" href={href(lang, 'gioi-thieu#ceo')}>
              {H.ceo.more} <Icon name="arrow" />
            </Link>
          </div>
          <div className="quote-stack reveal">
            <div className="quote-card quote-card--back" aria-hidden="true">
              <p>{t.about.values.items.map((v) => v.t).join(' · ')}</p>
            </div>
            <figure className="quote-card">
              <span className="quote-card__avatar" aria-hidden="true">
                <Image src="/img/logo.png" alt="" width={48} height={32} />
              </span>
              <blockquote>“{t.about.ceo.quote}”</blockquote>
              <figcaption>
                <strong>{t.about.ceo.name}</strong>
                <span>
                  {t.about.ceo.role} · {t.company.brand}
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ---------- Tin tức ---------- */}
      {news.length > 0 && (
        <section className="section section--tint">
          <div className="container">
            <SectionHead eyebrow={H.news.eyebrow} title={H.news.title} center />
            <div className="news-grid">
              {news.map((n) => (
                <NewsCard key={n.slug} lang={lang} t={t} n={n} />
              ))}
            </div>
            <p className="center-link">
              <Link className="btn btn--outline" href={href(lang, 'tin-tuc')}>
                {t.ui.allNews} <Icon name="arrow" />
              </Link>
            </p>
          </div>
        </section>
      )}

      <CtaBand lang={lang} t={t} />
    </>
  );
}
