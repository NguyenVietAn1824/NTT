'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { Badge, Empty, Loading, PageTitle, Toast } from '@/components/admin/ui';
import { api, errMsg, fmtDateTime } from '@/lib/admin-api';

interface Item {
  id: number;
  slug: string;
  coverImage: string | null;
  published: boolean;
  publishedAt: string;
  translations: { lang: string; title: string }[];
}

export default function NewsListPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [toast, setToast] = useState('');

  const load = () =>
    api<{ items: Item[] }>('/admin/news')
      .then((r) => setItems(r.items))
      .catch((e) => setToast(errMsg(e)));
  useEffect(() => {
    load();
  }, []);

  async function remove(n: Item) {
    if (!confirm(`Xóa bài “${n.translations.find((t) => t.lang === 'vi')?.title}”?`)) return;
    await api(`/admin/news/${n.id}`, { method: 'DELETE' }).catch((e) => setToast(errMsg(e)));
    load();
  }

  return (
    <>
      <PageTitle
        title="Tin tức"
        sub="Bài viết hiển thị ở trang Tin tức và trang chủ"
        actions={
          <Link className="a-btn a-btn--primary" href="/admin/news/new">
            <Icon name="plus" /> Viết bài mới
          </Link>
        }
      />
      {!items ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty>Chưa có bài viết.</Empty>
      ) : (
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th style={{ width: 88 }}>Ảnh</th>
                <th>Tiêu đề</th>
                <th>Ngôn ngữ</th>
                <th>Ngày đăng</th>
                <th>Trạng thái</th>
                <th aria-label="Thao tác" />
              </tr>
            </thead>
            <tbody>
              {items.map((n) => {
                const vi = n.translations.find((t) => t.lang === 'vi');
                return (
                  <tr key={n.id}>
                    <td>{n.coverImage ? <img className="a-thumb" src={n.coverImage} alt="" /> : <span className="a-thumb a-thumb--empty" />}</td>
                    <td>
                      <Link href={`/admin/news/${n.id}`} className="a-link-strong">
                        {vi?.title || n.slug}
                      </Link>
                      <span className="a-sub">/{n.slug}</span>
                    </td>
                    <td>
                      <div className="a-langs">
                        {['vi', 'en', 'ja'].map((l) => (
                          <span key={l} className={n.translations.some((t) => t.lang === l) ? 'is-on' : undefined}>
                            {l.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{fmtDateTime(n.publishedAt)}</td>
                    <td>{n.published ? <Badge tone="green">Đã đăng</Badge> : <Badge tone="gray">Nháp</Badge>}</td>
                    <td className="a-row-actions">
                      <a className="a-icon-btn" href={`/vi/tin-tuc/${n.slug}`} target="_blank" rel="noopener" title="Xem trên website">
                        <Icon name="external" />
                      </a>
                      <Link className="a-icon-btn" href={`/admin/news/${n.id}`} title="Sửa">
                        <Icon name="edit" />
                      </Link>
                      <button className="a-icon-btn a-icon-btn--danger" onClick={() => remove(n)} title="Xóa">
                        <Icon name="trash" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Toast message={toast} tone="error" onDone={() => setToast('')} />
    </>
  );
}
