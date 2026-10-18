'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { api } from '@/lib/admin-api';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

const UserCtx = createContext<User | null>(null);
export const useUser = () => useContext(UserCtx);

const NAV = [
  { href: '/admin', label: 'Tổng quan', icon: 'dashboard' },
  { href: '/admin/quotes', label: 'Yêu cầu báo giá', icon: 'inbox' },
  { href: '/admin/news', label: 'Tin tức', icon: 'news' },
  { href: '/admin/media', label: 'Thư viện ảnh', icon: 'image' },
  { href: '/admin/albums', label: 'Album ảnh', icon: 'copy' },
  { href: '/admin/videos', label: 'Video', icon: 'play' },
  { href: '/admin/jobs', label: 'Tuyển dụng', icon: 'users' },
  { href: '/admin/applications', label: 'Hồ sơ ứng tuyển', icon: 'file' },
] as const;

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api<{ user: User }>('/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => {});
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    router.replace('/admin/login');
    router.refresh();
  }

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  return (
    <UserCtx.Provider value={user}>
      <div className={`shell${open ? ' shell--open' : ''}`}>
        <aside className="shell__side">
          <Link href="/admin" className="shell__brand">
            <Image src="/img/logo.png" alt="" width={48} height={32} />
            <div>
              <strong>NTT</strong>
              <span>Quản trị</span>
            </div>
          </Link>
          <nav className="shell__nav">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={isActive(n.href) ? 'is-active' : undefined} aria-current={isActive(n.href) ? 'page' : undefined}>
                <Icon name={n.icon} />
                <span>{n.label}</span>
              </Link>
            ))}
          </nav>
          <div className="shell__foot">
            <a href="/" target="_blank" rel="noopener">
              <Icon name="external" />
              <span>Xem website</span>
            </a>
            <Link href="/admin/account" className={pathname === '/admin/account' ? 'is-active' : undefined}>
              <Icon name="shield" />
              <span>Tài khoản</span>
            </Link>
            <button type="button" onClick={logout}>
              <Icon name="logout" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>
        <div className="shell__scrim" onClick={() => setOpen(false)} aria-hidden="true" />
        <div className="shell__main">
          <header className="shell__top">
            <button className="shell__burger" type="button" aria-label="Mở menu" onClick={() => setOpen(true)}>
              <Icon name="menu" />
            </button>
            <div className="shell__user">
              <span className="shell__avatar" aria-hidden="true">
                {(user?.name || '?').trim().charAt(0).toUpperCase()}
              </span>
              <div>
                <strong>{user?.name || '…'}</strong>
                <span>{user?.email}</span>
              </div>
            </div>
          </header>
          <div className="shell__content">{children}</div>
        </div>
      </div>
    </UserCtx.Provider>
  );
}
