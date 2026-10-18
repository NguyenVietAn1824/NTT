import Icon from '@/components/Icon';
import { ApplyForm } from '@/components/forms';
import { PageHero, SectionHead } from '@/components/site';
import { getDict, type Lang } from '@/content';
import { site } from '@/content/shared';
import { getJobs } from '@/lib/api';
import { href } from '@/lib/format';
import { pageMeta } from '@/lib/seo';

export function generateMetadata({ params }: { params: { lang: Lang } }) {
  const t = getDict(params.lang);
  return pageMeta({ lang: params.lang, path: 'tuyen-dung', title: t.meta.careers.title, description: t.meta.careers.desc, image: '/img/careers-team.jpg' });
}

export default async function CareersPage({ params, searchParams }: { params: { lang: Lang }; searchParams: { job?: string } }) {
  const { lang } = params;
  const t = getDict(lang);
  const C = t.careers;
  const jobs = await getJobs(lang);
  const selected = Number(searchParams.job) || undefined;

  return (
    <>
      <PageHero lang={lang} t={t} title={C.hero.title} sub={C.hero.sub} crumbs={[[t.nav.careers]]} img="/img/careers-team.jpg" pos="center 30%" fit="contain" />
      <section className="section">
        <div className="container">
          <SectionHead eyebrow={C.eyebrow} title={C.title} sub={C.intro} />
          {jobs.length ? (
            <ul className="jobs">
              {jobs.map((j) => (
                <li className="job reveal" key={j.id}>
                  <span className="job__icon">
                    <Icon name={j.icon} />
                  </span>
                  <div className="job__main">
                    <h3>{j.title}</h3>
                    <p>
                      <Icon name="pin" />
                      <span>
                        <span className="sr-only">{C.location}: </span>
                        {j.location}
                      </span>
                    </p>
                    {j.description && <p className="job__desc">{j.description}</p>}
                  </div>
                  <span className="job__count">
                    {j.openings} {C.openings}
                  </span>
                  <a className="btn btn--outline" href={`${href(lang, 'tuyen-dung')}?job=${j.id}#apply`}>
                    {C.apply}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">{C.empty}</p>
          )}
        </div>
      </section>
      <section className="section section--mist">
        <div className="container contact">
          <div className="contact__info">
            <h2 className="h-sm">{t.ui.needHelp}</h2>
            <ul className="contact__list">
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
            </ul>
          </div>
          <ApplyForm jobs={jobs.map((j) => ({ id: j.id, title: j.title }))} selected={selected} c={C.form} forms={t.forms} />
        </div>
      </section>
    </>
  );
}
