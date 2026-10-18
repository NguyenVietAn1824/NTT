// Các khối giao diện dùng chung (Server Components)
import Image from 'next/image';
import Link from 'next/link';
import { marked } from 'marked';
import type { Dict, Lang } from '@/content';
import { fleet, serviceMeta, site } from '@/content/shared';
import type { Block, Service } from '@/content/types';
import type { NewsSummary } from '@/lib/api';
import { fmtDate, href, stripTags } from '@/lib/format';
import { srcSet } from '@/lib/media';
import Icon from './Icon';
import QuickQuote from './QuickQuote';

// Nội dung tĩnh có thẻ <strong> do chính mình viết
export function Html({ as: Tag = 'span', html, className }: { as?: keyof JSX.IntrinsicElements; html: string; className?: string }) {
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Footer({ lang, t }: { lang: Lang; t: Dict }) {
  const company = [
    ['about', 'gioi-thieu'],
    ['policies', 'chinh-sach'],
    ['news', 'tin-tuc'],
    ['library', 'thu-vien'],
    ['careers', 'tuyen-dung'],
    ['contact', 'lien-he'],
  ] as const;
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Link className="brand" href={href(lang)}>
            <Image src="/img/logo.png" alt="" width={62} height={42} />
            <span className="brand__text">
              <strong>NTT</strong>
              <span>LOGISTICS</span>
            </span>
          </Link>
          <p>{t.ui.footerTagline}</p>
          <div className="footer__social">
            <a href={site.zalo} target="_blank" rel="noopener" aria-label="Zalo">
              <Icon name="chat" />
            </a>
            <a href={`tel:${site.phones[0].intl}`} aria-label={t.ui.hotline}>
              <Icon name="phone" />
            </a>
            <a href={`mailto:${site.emails[0]}`} aria-label={t.ui.email}>
              <Icon name="mail" />
            </a>
          </div>
        </div>
        <div>
          <h2 className="footer__title">{t.ui.footerServices}</h2>
          <ul className="footer__links">
            {t.services.map((s) => (
              <li key={s.slug}>
                <Link href={href(lang, `dich-vu/${s.slug}`)}>{s.title}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="footer__title">{t.ui.footerCompany}</h2>
          <ul className="footer__links">
            {company.map(([k, p]) => (
              <li key={k}>
                <Link href={href(lang, p)}>{t.nav[k]}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="footer__title">{t.ui.footerContact}</h2>
          <ul className="footer__contact">
            <li>
              <Icon name="pin" />
              <span>{t.company.address}</span>
            </li>
            {site.phones.map((p) => (
              <li key={p.intl}>
                <Icon name="phone" />
                <a href={`tel:${p.intl}`}>{p.display}</a>
              </li>
            ))}
            {site.emails.map((e) => (
              <li key={e}>
                <Icon name="mail" />
                <a href={`mailto:${e}`}>{e}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>
          © {new Date().getFullYear()} {t.company.legal}. {t.ui.rights}
        </span>
        <span>
          {t.ui.regNo}: {site.regNo} · {t.ui.license}: {site.transportLicense}
        </span>
      </div>
    </footer>
  );
}

export function FloatingCta({ t }: { t: Dict }) {
  return (
    <div className="float-cta">
      <a className="float-cta__btn float-cta__btn--zalo" href={site.zalo} target="_blank" rel="noopener" aria-label={t.ui.zalo}>
        <Icon name="chat" />
        <span>Zalo</span>
      </a>
      <a className="float-cta__btn float-cta__btn--phone" href={`tel:${site.phones[0].intl}`} aria-label={`${t.ui.callNow} ${site.phones[0].display}`}>
        <Icon name="phone" />
        <span>{t.ui.callNow}</span>
      </a>
    </div>
  );
}

export function SectionHead({ eyebrow, title, sub, light, center }: { eyebrow?: string; title: string; sub?: string; light?: boolean; center?: boolean }) {
  return (
    <header className={`section-head${light ? ' section-head--light' : ''}${center ? ' section-head--center' : ''}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {sub && <p className="section-head__sub">{sub}</p>}
    </header>
  );
}

export function PageHero({
  lang,
  t,
  title,
  sub,
  crumbs = [],
  img,
  pos,
}: {
  lang: Lang;
  t: Dict;
  title: string;
  sub?: string;
  crumbs?: [string, string?][];
  img?: string;
  /** Điểm lấy nét của ảnh, VD "center 70%" */
  pos?: string;
  /** (giữ tương thích) */
  fit?: 'contain';
}) {
  // Bố cục 2 cột: chữ bên trái, ảnh trong khung bo tròn bên phải — chữ không bao giờ đè lên ảnh
  return (
    <section className={`page-hero${img ? '' : ' page-hero--plain'}`}>
      <span className="deco-blob page-hero__blob" aria-hidden="true" />
      <div className="container page-hero__inner">
        <div className="page-hero__text">
          <nav className="crumbs" aria-label="Breadcrumb">
            <ol>
              <li>
                <Link href={href(lang)}>{t.ui.home}</Link>
              </li>
              {crumbs.map(([label, path]) => (
                <li key={label} aria-current={path ? undefined : 'page'}>
                  {path ? <Link href={href(lang, path)}>{label}</Link> : label}
                </li>
              ))}
            </ol>
          </nav>
          <h1>{title}</h1>
          {sub && <p className="page-hero__sub">{sub}</p>}
        </div>
        {img && (
          <div className="page-hero__media" aria-hidden="true">
            <div className="page-hero__img" style={{ backgroundImage: `url('${img}')`, backgroundPosition: pos || 'center' }} />
          </div>
        )}
      </div>
    </section>
  );
}

export function FleetTable({ lang, t }: { lang: Lang; t: Dict }) {
  const f = t.home.fleet;
  const max = Math.max(...fleet.map((x) => x.count));
  return (
    <div className="fleet">
      {fleet.map((x) => (
        <div className="fleet__row" key={x.key}>
          <div className="fleet__load">
            <strong>{lang === 'vi' ? String(x.load).replace('.', ',') : x.load}</strong>
            <span>{f.ton}</span>
          </div>
          <div className="fleet__info">
            <div className="fleet__label">{f.labels[x.key]}</div>
            <div className="fleet__use">{f.uses[x.key]}</div>
            <div className="fleet__bar" style={{ '--w': `${Math.round((x.count / max) * 100)}%` } as React.CSSProperties}>
              <span />
            </div>
          </div>
          <div className="fleet__count">
            <strong>{x.count}</strong> {f.unit}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CtaBand({ lang, t }: { lang: Lang; t: Dict }) {
  const c = t.home.cta;
  return (
    <section className="cta-wrap">
      <div className="container">
        <div className="cta-box reveal">
          <span className="cta-box__badge" aria-hidden="true">
            <Icon name="phone" />
          </span>
          <span className="cta-box__ring cta-box__ring--1" aria-hidden="true" />
          <span className="cta-box__ring cta-box__ring--2" aria-hidden="true" />
          <h2>{c.title}</h2>
          <p>{c.sub}</p>
          <QuickQuote lang={lang} c={c} />
          <p className="cta-box__or">
            {c.or}: <a href={`tel:${site.phones[0].intl}`}>{site.phones[0].display}</a> ·{' '}
            <Link href={href(lang, 'lien-he#quote')}>{t.ui.quote}</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

// variant "icon": thẻ dịch vụ kiểu icon (trang chủ) · "photo": thẻ có ảnh (trang Dịch vụ)
export function ServiceCard({ lang, t, s, variant = 'photo', index = 0 }: { lang: Lang; t: Dict; s: Service; variant?: 'icon' | 'photo'; index?: number }) {
  const m = serviceMeta[s.slug];
  if (variant === 'icon')
    return (
      <article className="svc-icon reveal">
        <Link href={href(lang, `dich-vu/${s.slug}`)}>
          <span className={`svc-icon__art tone-${index % 4}`}>
            <Icon name={m.icon} />
          </span>
          <h3>{s.title}</h3>
          <p>{s.short}</p>
          <span className="svc-icon__more">
            {t.ui.readMore} <Icon name="arrow" />
          </span>
        </Link>
      </article>
    );
  return (
    <article className="svc-card reveal">
      <Link href={href(lang, `dich-vu/${s.slug}`)} className="svc-card__link">
        <div className="svc-card__media">
          <Image src={m.img} alt={stripTags(s.title)} width={600} height={450} sizes="(max-width: 640px) 100vw, 50vw" />
        </div>
        <div className="svc-card__body">
          <span className="svc-card__icon">
            <Icon name={m.icon} />
          </span>
          <h3>{s.title}</h3>
          <p>{s.short}</p>
          <span className="link-arrow">
            {t.ui.readMore} <Icon name="arrow" />
          </span>
        </div>
      </Link>
    </article>
  );
}

export function NewsCard({ lang, t, n }: { lang: Lang; t: Dict; n: NewsSummary }) {
  return (
    <article className="news-card reveal">
      <Link href={href(lang, `tin-tuc/${n.slug}`)}>
        <div className="news-card__media">
          {n.coverImage && <img src={n.coverImage} srcSet={srcSet(n.coverImage)} sizes="(max-width: 640px) 100vw, 400px" alt="" loading="lazy" />}
        </div>
        <div className="news-card__body">
          <h3>{n.title}</h3>
          <p>{n.excerpt}</p>
          <div className="news-card__meta">
            <time dateTime={n.publishedAt}>
              <Icon name="calendar" /> {fmtDate(n.publishedAt, lang)}
            </time>
            <span className="news-card__go" aria-label={t.ui.readMore}>
              <Icon name="arrow" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function Checks({ items, small }: { items: string[]; small?: boolean }) {
  return (
    <ul className={`checks${small ? ' checks--sm' : ''}`}>
      {items.map((x) => (
        <li key={x}>
          <Icon name="check" />
          <Html html={x} />
        </li>
      ))}
    </ul>
  );
}

// Render nội dung trang dịch vụ
export function Blocks({ blocks, lang, t }: { blocks: Block[]; lang: Lang; t: Dict }) {
  let h = 0;
  return (
    <>
      {blocks.map((b, i) => {
        if (typeof b === 'string') return <Html key={i} as="p" html={b} />;
        if ('h' in b) return <h2 key={i} id={`s-${++h}`}>{b.h}</h2>;
        if ('ul' in b)
          return (
            <ul key={i} className="list">
              {b.ul.map((x) => <Html key={x} as="li" html={x} />)}
            </ul>
          );
        if ('check' in b) return <Checks key={i} items={b.check} />;
        if ('grid' in b)
          return (
            <div key={i} className="mini-grid">
              {b.grid.map((g) => (
                <div key={g.t} className="mini-card">
                  <h3>{g.t}</h3>
                  {g.d && <p>{g.d}</p>}
                  {g.items && <Checks items={g.items} small />}
                </div>
              ))}
            </div>
          );
        if ('fleet' in b) return <FleetTable key={i} lang={lang} t={t} />;
        if ('locations' in b)
          return (
            <ul key={i} className="loc-list">
              {b.locations.map((x) => (
                <li key={x}>
                  <Icon name="pin" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          );
        if ('quote' in b)
          return (
            <blockquote key={i} className="quote">
              <p>{b.quote}</p>
              <cite>— {b.by}</cite>
            </blockquote>
          );
        return null;
      })}
    </>
  );
}

export const tocFrom = (blocks: Block[]) =>
  blocks.filter((b): b is { h: string } => typeof b === 'object' && 'h' in b).map((b, i) => ({ id: `s-${i + 1}`, label: stripTags(b.h) }));

// Markdown do admin soạn → HTML. Chặn HTML thô và link javascript:.
const renderer = new marked.Renderer();
renderer.html = () => '';
const safeUrl = (u: string) => (/^(https?:|mailto:|tel:|\/|#)/i.test(u) ? u : '#');
renderer.link = function ({ href: url, title, tokens }) {
  const text = this.parser.parseInline(tokens);
  const external = /^https?:/i.test(url);
  return `<a href="${safeUrl(url)}"${title ? ` title="${title}"` : ''}${external ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
};
renderer.image = ({ href: url, text }) => {
  const set = srcSet(url);
  return `<img src="${safeUrl(url)}"${set ? ` srcset="${set}" sizes="(max-width: 800px) 100vw, 760px"` : ''} alt="${text.replace(/"/g, '&quot;')}" loading="lazy">`;
};

export function Markdown({ source }: { source: string }) {
  const html = marked.parse(source, { renderer, async: false, gfm: true, breaks: false }) as string;
  return <div className="md" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function ContactCard({ lang, t }: { lang: Lang; t: Dict }) {
  return (
    <div className="side-card side-card--accent">
      <span className="side-card__icon" aria-hidden="true">
        <Icon name="chat" />
      </span>
      <h2>{t.ui.needHelp}</h2>
      <p>{t.ui.needHelpText}</p>
      <Link className="btn btn--primary btn--block" href={href(lang, 'lien-he#quote')}>
        {t.ui.quote}
      </Link>
      {site.phones.map((p) => (
        <a key={p.intl} className="side-card__phone" href={`tel:${p.intl}`}>
          <Icon name="phone" /> {p.display}
        </a>
      ))}
    </div>
  );
}

const STEP_ICONS = ['chat', 'file', 'handshake', 'truck', 'target'] as const;

// Các bước dạng danh sách: ô icon màu + tiêu đề + mô tả
export function Process({ steps }: { steps: { t: string; d: string }[] }) {
  return (
    <ol className="steps">
      {steps.map((s, i) => (
        <li className="steps__item reveal" key={s.t}>
          <span className={`steps__icon tone-${i % 5}`}>
            <Icon name={STEP_ICONS[i % STEP_ICONS.length]} />
          </span>
          <div>
            <h3>
              <span className="steps__num">{String(i + 1).padStart(2, '0')}</span> {s.t}
            </h3>
            <p>{s.d}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
