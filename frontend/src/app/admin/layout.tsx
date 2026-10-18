import type { Metadata } from 'next';
import '@/styles/admin.css';

export const metadata: Metadata = {
  title: { default: 'Quản trị — NTT Logistics', template: '%s — Quản trị NTT' },
  robots: { index: false, follow: false },
  icons: { icon: '/img/logo.png' },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap" />
      </head>
      <body className="adm">{children}</body>
    </html>
  );
}
