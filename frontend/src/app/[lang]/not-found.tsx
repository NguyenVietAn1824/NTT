'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Giữ chữ ngay tại đây để không phải tải cả dictionary xuống trình duyệt
const TEXT = {
  vi: { title: 'Không tìm thấy trang', text: 'Trang bạn tìm không tồn tại hoặc đã được di chuyển.', back: 'Về trang chủ' },
  en: { title: 'Page not found', text: 'The page you are looking for does not exist or has moved.', back: 'Back to home' },
  ja: { title: 'ページが見つかりません', text: 'お探しのページは存在しないか、移動した可能性があります。', back: 'ホームへ戻る' },
};

export default function NotFound() {
  const seg = usePathname()?.split('/')[1] as keyof typeof TEXT;
  const lang = seg in TEXT ? seg : 'vi';
  const t = TEXT[lang];
  return (
    <section className="section not-found">
      <div className="container narrow">
        <p className="not-found__code">404</p>
        <h1>{t.title}</h1>
        <p>{t.text}</p>
        <Link className="btn btn--primary" href={`/${lang}`}>
          {t.back}
        </Link>
      </div>
    </section>
  );
}
