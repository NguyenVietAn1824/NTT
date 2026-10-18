'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { Badge, Loading, PageTitle } from '@/components/admin/ui';
import { useUser } from '@/components/admin/Shell';
import { api, fmtDateTime, QUOTE_STATUS } from '@/lib/admin-api';

interface Stats {
  newQuotes: number;
  quotes30d: number;
  quotesByStatus: Record<string, number>;
  newApplications: number;
  activeJobs: number;
  publishedNews: number;
  mediaCount: number;
  recentQuotes: { id: number; name: string; company: string | null; phone: string; service: string | null; status: string; createdAt: string; lang: string }[];
}

export default function Dashboard() {
  const user = useUser();
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    api<Stats>('/admin/stats').then(setS).catch(() => {});
  }, []);

  if (!s) return <Loading />;

  const total = Object.values(s.quotesByStatus).reduce((a, b) => a + b, 0);
  const won = s.quotesByStatus.WON || 0;

  const cards = [
    { label: 'Báo giá mới chưa xử lý', value: s.newQuotes, href: '/admin/quotes?status=NEW', icon: 'inbox', accent: s.newQuotes > 0 },
    { label: 'Báo giá 30 ngày qua', value: s.quotes30d, href: '/admin/quotes', icon: 'calendar' },
    { label: 'Hồ sơ ứng tuyển mới', value: s.newApplications, href: '/admin/applications', icon: 'file', accent: s.newApplications > 0 },
    { label: 'Vị trí đang tuyển', value: s.activeJobs, href: '/admin/jobs', icon: 'users' },
    { label: 'Tin tức đã đăng', value: s.publishedNews, href: '/admin/news', icon: 'news' },
    { label: 'Ảnh trong thư viện', value: s.mediaCount, href: '/admin/media', icon: 'image' },
  ];

  return (
    <>
      <PageTitle title={`Xin chào${user ? `, ${user.name}` : ''}`} sub="Tình hình website hôm nay" />

      <div className="a-cards">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className={`a-stat${c.accent ? ' a-stat--accent' : ''}`}>
            <span className="a-stat__icon">
              <Icon name={c.icon} />
            </span>
            <strong>{c.value}</strong>
            <span>{c.label}</span>
          </Link>
        ))}
      </div>

      <div className="a-grid-2">
        <section className="a-panel">
          <div className="a-panel__head">
            <h2>Báo giá gần đây</h2>
            <Link href="/admin/quotes" className="a-link">
              Xem tất cả →
            </Link>
          </div>
          {s.recentQuotes.length ? (
            <ul className="a-list">
              {s.recentQuotes.map((q) => (
                <li key={q.id}>
                  <Link href={`/admin/quotes?open=${q.id}`}>
                    <div>
                      <strong>{q.name}</strong>
                      <span>
                        {[q.company, q.service].filter(Boolean).join(' · ') || q.phone} · {q.lang.toUpperCase()}
                      </span>
                    </div>
                    <div className="a-list__meta">
                      <Badge tone={QUOTE_STATUS[q.status]?.tone || 'gray'}>{QUOTE_STATUS[q.status]?.label || q.status}</Badge>
                      <time>{fmtDateTime(q.createdAt)}</time>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="a-muted">Chưa có yêu cầu báo giá nào.</p>
          )}
        </section>

        <section className="a-panel">
          <div className="a-panel__head">
            <h2>Phễu báo giá</h2>
            <span className="a-muted">Tỷ lệ chốt: {total ? Math.round((won / total) * 100) : 0}%</span>
          </div>
          <ul className="a-funnel">
            {Object.entries(QUOTE_STATUS).map(([k, v]) => {
              const n = s.quotesByStatus[k] || 0;
              return (
                <li key={k}>
                  <div className="a-funnel__row">
                    <span>{v.label}</span>
                    <strong>{n}</strong>
                  </div>
                  <div className="a-funnel__bar">
                    <span className={`tone-${v.tone}`} style={{ width: `${total ? (n / total) * 100 : 0}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
