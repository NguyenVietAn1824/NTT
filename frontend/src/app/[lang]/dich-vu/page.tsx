import { CtaBand, PageHero, Process, SectionHead, ServiceCard } from '@/components/site';
import { getDict, type Lang } from '@/content';
import { pageMeta } from '@/lib/seo';

export function generateMetadata({ params }: { params: { lang: Lang } }) {
  const t = getDict(params.lang);
  return pageMeta({ lang: params.lang, path: 'dich-vu', title: t.meta.services.title, description: t.meta.services.desc, image: '/img/services/kho-van.jpg' });
}

export default function ServicesPage({ params }: { params: { lang: Lang } }) {
  const { lang } = params;
  const t = getDict(lang);
  return (
    <>
      <PageHero lang={lang} t={t} title={t.servicesPage.hero.title} sub={t.servicesPage.hero.sub} crumbs={[[t.nav.services]]} img="/img/services/kho-van.jpg" />
      <section className="section">
        <div className="container">
          <SectionHead {...t.home.services} />
          <div className="svc-grid svc-grid--2">
            {t.services.map((s) => (
              <ServiceCard key={s.slug} lang={lang} t={t} s={s} />
            ))}
          </div>
        </div>
      </section>
      <section className="section section--mist">
        <div className="container">
          <SectionHead eyebrow={t.home.process.eyebrow} title={t.home.process.title} />
          <Process steps={t.home.process.steps} />
        </div>
      </section>
      <CtaBand lang={lang} t={t} />
    </>
  );
}
