import Icon from '@/components/Icon';
import { QuoteForm } from '@/components/forms';
import { PageHero } from '@/components/site';
import { getDict, type Lang } from '@/content';
import { site } from '@/content/shared';
import { pageMeta } from '@/lib/seo';

export function generateMetadata({ params }: { params: { lang: Lang } }) {
  const t = getDict(params.lang);
  return pageMeta({ lang: params.lang, path: 'lien-he', title: t.meta.contact.title, description: t.meta.contact.desc });
}

export default function ContactPage({ params }: { params: { lang: Lang } }) {
  const { lang } = params;
  const t = getDict(lang);
  const C = t.contact;
  return (
    <>
      <PageHero lang={lang} t={t} title={C.hero.title} sub={C.hero.sub} crumbs={[[t.nav.contact]]} img="/img/hero-fleet.jpg" pos="center 22%" />
      <section className="section">
        <div className="container contact">
          <div className="contact__info">
            <h2 className="h-sm">{C.infoTitle}</h2>
            <p className="contact__company">{t.company.legal}</p>
            <ul className="contact__list">
              <li>
                <Icon name="pin" />
                <div>
                  <span>{t.ui.address}</span>
                  {t.company.address}
                </div>
              </li>
              <li>
                <Icon name="phone" />
                <div>
                  <span>{t.ui.hotline}</span>
                  {site.phones.map((p) => (
                    <a key={p.intl} href={`tel:${p.intl}`}>
                      {p.display}
                      <br />
                    </a>
                  ))}
                </div>
              </li>
              <li>
                <Icon name="mail" />
                <div>
                  <span>{t.ui.email}</span>
                  {site.emails.map((e) => (
                    <a key={e} href={`mailto:${e}`}>
                      {e}
                      <br />
                    </a>
                  ))}
                </div>
              </li>
              <li>
                <Icon name="clock" />
                <div>
                  <span>{C.hoursLabel}</span>
                  {C.hours}
                </div>
              </li>
            </ul>
            <div className="contact__quick">
              <a className="btn btn--primary" href={`tel:${site.phones[0].intl}`}>
                <Icon name="phone" /> {t.ui.callNow}
              </a>
              <a className="btn btn--outline" href={site.zalo} target="_blank" rel="noopener">
                <Icon name="chat" /> {t.ui.zalo}
              </a>
            </div>
          </div>
          <QuoteForm lang={lang} f={C.form} forms={t.forms} />
        </div>
      </section>
      <section className="map" aria-label={C.mapTitle}>
        <iframe title={C.mapTitle} src={site.mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </section>
    </>
  );
}
