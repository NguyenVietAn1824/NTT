'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LANG_META, LANGS, type Dict, type Lang } from '@/content';
import { serviceMeta, site } from '@/content/shared';
import { href } from '@/lib/format';
import Icon from './Icon';

const NAV = [
  ['about', 'gioi-thieu'],
  ['services', 'dich-vu'],
  ['policies', 'chinh-sach'],
  ['news', 'tin-tuc'],
  ['library', 'thu-vien'],
  ['careers', 'tuyen-dung'],
  ['contact', 'lien-he'],
] as const;

export function LangSwitch({ lang, label }: { lang: Lang; label: string }) {
  const pathname = usePathname() || `/${lang}`;
  const rest = pathname.split('/').slice(2).join('/');
  return (
    <div className="lang" role="navigation" aria-label={label}>
      <Icon name="globe" />
      {LANGS.map((l) =>
        l === lang ? (
          <span key={l} className="lang__item is-active" aria-current="true">
            {LANG_META[l].label}
          </span>
        ) : (
          <a key={l} className="lang__item" href={href(l, rest)} hrefLang={l} lang={l} title={LANG_META[l].name}>
            {LANG_META[l].label}
          </a>
        ),
      )}
    </div>
  );
}

// Chỉ truyền phần chữ cần thiết xuống client, không gửi cả dictionary
export interface HeaderText {
  nav: Dict['nav'];
  ui: Dict['ui'];
  company: Dict['company'];
  services: { slug: string; title: string }[];
}

export default function Header({ lang, t }: { lang: Lang; t: HeaderText }) {
  const pathname = usePathname() || '';
  const [open, setOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [navTop, setNavTop] = useState<number>();

  const section = pathname.split('/')[2] || '';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Đóng menu khi chuyển trang / nhấn Esc / màn hình rộng
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const mq = window.matchMedia('(min-width: 1024px)');
    const onMq = (e: MediaQueryListEvent) => e.matches && setOpen(false);
    document.addEventListener('keydown', onKey);
    mq.addEventListener('change', onMq);
    return () => {
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onMq);
    };
  }, []);
  useEffect(() => {
    document.body.classList.toggle('nav-open', open);
    if (open && headerRef.current) setNavTop(headerRef.current.getBoundingClientRect().bottom);
  }, [open]);

  return (
    <>
      <header ref={headerRef} className={`header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="container header__inner">
          <Link className="brand" href={href(lang)} aria-label={`${t.company.brand} — ${t.ui.home}`}>
            <Image src="/img/logo.png" alt="" width={62} height={42} priority />
            <span className="brand__text">
              <strong>NTT</strong>
              <span>LOGISTICS</span>
            </span>
          </Link>

          <nav
            className={`nav${open ? ' is-open' : ''}`}
            id="site-nav"
            aria-label="Main"
            style={navTop ? ({ '--nav-top': `${navTop}px` } as React.CSSProperties) : undefined}
          >
            <ul className="nav__list">
              {NAV.map(([key, path]) => {
                const current = section === path ? 'page' : undefined;
                if (key !== 'services')
                  return (
                    <li key={key}>
                      <Link href={href(lang, path)} aria-current={current}>
                        {t.nav[key]}
                      </Link>
                    </li>
                  );
                return (
                  <li key={key} className="has-sub">
                    <Link href={href(lang, path)} aria-current={current}>
                      {t.nav.services}
                    </Link>
                    <button className="sub-toggle" type="button" aria-expanded={subOpen} aria-label={t.nav.services} onClick={() => setSubOpen((v) => !v)}>
                      <Icon name="chevron" />
                    </button>
                    <ul className={`sub${subOpen ? ' is-open' : ''}`}>
                      {t.services.map((s) => (
                        <li key={s.slug}>
                          <Link href={href(lang, `dich-vu/${s.slug}`)}>
                            <Icon name={serviceMeta[s.slug].icon} />
                            <span>{s.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
            <div className="nav__mobile-extra">
              <Link className="btn btn--primary btn--block" href={href(lang, 'lien-he#quote')}>
                {t.ui.quote}
              </Link>
              <a className="btn btn--ghost-dark btn--block" href={`tel:${site.phones[0].intl}`}>
                <Icon name="phone" /> {site.phones[0].display}
              </a>
              <LangSwitch lang={lang} label={t.ui.language} />
            </div>
          </nav>

          <div className="header__tools">
            <LangSwitch lang={lang} label={t.ui.language} />
            <Link className="btn btn--outline btn--sm header__cta" href={href(lang, 'lien-he#quote')}>
              {t.ui.navCta}
            </Link>
          </div>
          <button
            className="burger"
            type="button"
            aria-controls="site-nav"
            aria-expanded={open}
            aria-label={open ? t.ui.close : t.ui.menu}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="burger__open">
              <Icon name="menu" />
            </span>
            <span className="burger__close">
              <Icon name="x" />
            </span>
          </button>
        </div>
      </header>
    </>
  );
}
