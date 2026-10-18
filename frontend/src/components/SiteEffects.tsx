'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Hiệu ứng hiện dần, đếm số KPI và tô sáng mục lục — chạy lại mỗi khi đổi trang
export default function SiteEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $$ = (s: string) => Array.from(document.querySelectorAll<HTMLElement>(s));

    if (!('IntersectionObserver' in window)) {
      $$('.reveal').forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    $$('.reveal:not(.is-visible)').forEach((el, i) => {
      el.style.transitionDelay = `${(i % 4) * 60}ms`;
      io.observe(el);
    });

    const countUp = (el: HTMLElement) => {
      const target = Number(el.dataset.count);
      if (reduce || !target) return;
      const fmt = new Intl.NumberFormat(el.dataset.locale || 'en-US');
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / 1400);
        el.textContent = fmt.format(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const cio = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          countUp(en.target as HTMLElement);
          cio.unobserve(en.target);
        }),
      { threshold: 0.6 },
    );
    $$('[data-count]').forEach((el) => cio.observe(el));

    const links = $$('.subnav a, .side-card--toc a') as HTMLAnchorElement[];
    const map = new Map<Element, HTMLAnchorElement[]>();
    links.forEach((a) => {
      const target = document.getElementById(decodeURIComponent(a.hash.slice(1)));
      if (target) map.set(target, [...(map.get(target) || []), a]);
    });
    const sio = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          links.forEach((a) => a.classList.remove('is-active'));
          (map.get(en.target) || []).forEach((a) => a.classList.add('is-active'));
        }),
      { rootMargin: '-30% 0px -60% 0px' },
    );
    map.forEach((_, el) => sio.observe(el));

    return () => {
      io.disconnect();
      cio.disconnect();
      sio.disconnect();
    };
  }, [pathname]);

  return null;
}
