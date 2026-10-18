import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import SiteEffects from '@/components/SiteEffects';
import { FloatingCta, Footer } from '@/components/site';
import { getDict, isLang, LANG_META, LANGS } from '@/content';
import { site } from '@/content/shared';
import { metadataBase } from '@/lib/seo';
import '@/styles/globals.css';

// Google Fonts nạp ở trình duyệt (build không cần mạng). Noto Sans JP chỉ tải cho trang /ja.
const fontHref = (lang: string) =>
  `https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Noticia+Text:wght@400;700${lang === 'ja' ? '&family=Noto+Sans+JP:wght@400;500;700' : ''}&display=swap`;

export const generateStaticParams = () => LANGS.map((lang) => ({ lang }));

export const viewport: Viewport = { themeColor: '#FFFFFF' };

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLang(params.lang) ? params.lang : 'vi';
  const t = getDict(lang);
  return {
    metadataBase,
    title: { default: t.meta.home.title, template: `%s | ${t.company.brand}` },
    description: t.meta.home.desc,
    icons: { icon: '/img/logo.png' },
  };
}

export default function LangLayout({ children, params }: { children: React.ReactNode; params: { lang: string } }) {
  if (!isLang(params.lang)) notFound();
  const lang = params.lang;
  const t = getDict(lang);

  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: t.company.legal,
    alternateName: t.company.brand,
    url: site.url,
    logo: `${site.url}/img/logo.png`,
    foundingDate: String(site.founded),
    email: site.emails[0],
    telephone: site.phones.map((p) => p.intl),
    address: { '@type': 'PostalAddress', streetAddress: t.company.address, addressLocality: 'Hà Nội', addressCountry: 'VN' },
  };

  return (
    <html lang={LANG_META[lang].htmlLang} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={fontHref(lang)} />
      </head>
      <body>
        {/* Bật hiệu ứng hiện dần chỉ khi có JS — không JS vẫn thấy đủ nội dung */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <a className="skip" href="#main">
          {t.ui.skip}
        </a>
        <Header lang={lang} t={{ nav: t.nav, ui: t.ui, company: t.company, services: t.services.map((s) => ({ slug: s.slug, title: s.title })) }} />
        <main id="main">{children}</main>
        <Footer lang={lang} t={t} />
        <FloatingCta t={t} />
        <SiteEffects />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      </body>
    </html>
  );
}
