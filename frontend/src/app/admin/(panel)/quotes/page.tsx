'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { Badge, Empty, Loading, Modal, PageTitle, Pager, Toast } from '@/components/admin/ui';
import { api, errMsg, fmtDateTime, QUOTE_STATUS } from '@/lib/admin-api';

interface Quote {
  id: number;
  name: string;
  company: string | null;
  phone: string;
  email: string | null;
  service: string | null;
  route: string | null;
  message: string | null;
  lang: string;
  status: string;
  note: string | null;
  createdAt: string;
}
interface ListRes {
  items: Quote[];
  total: number;
  page: number;
  pageSize: number;
}

function QuotesInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState(params.get('status') || '');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListRes | null>(null);
  const [open, setOpen] = useState<Quote | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone?: 'ok' | 'error' }>({ msg: '' });

  const qs = new URLSearchParams({ page: String(page), pageSize: '20', ...(status && { status }), ...(query && { q: query }) }).toString();

  const load = useCallback(() => {
    api<ListRes>(`/admin/quotes?${qs}`).then(setData).catch((e) => setToast({ msg: errMsg(e), tone: 'error' }));
  }, [qs]);
  useEffect(load, [load]);

  // Mở chi tiết từ dashboard (?open=id)
  useEffect(() => {
    const id = params.get('open');
    if (id) api<Quote>(`/admin/quotes/${id}`).then(setOpen).catch(() => {});
  }, [params]);

  async function update(id: number, body: Partial<Pick<Quote, 'status' | 'note'>>) {
    try {
      const updated = await api<Quote>(`/admin/quotes/${id}`, { method: 'PATCH', json: body });
      setData((d) => d && { ...d, items: d.items.map((x) => (x.id === id ? updated : x)) });
      if (open?.id === id) setOpen(updated);
      setToast({ msg: 'Đã lưu' });
    } catch (e) {
      setToast({ msg: errMsg(e), tone: 'error' });
    }
  }

  async function remove(id: number) {
    if (!confirm('Xóa yêu cầu báo giá này? Không thể hoàn tác.')) return;
    try {
      await api(`/admin/quotes/${id}`, { method: 'DELETE' });
      setOpen(null);
      load();
      setToast({ msg: 'Đã xóa' });
    } catch (e) {
      setToast({ msg: errMsg(e), tone: 'error' });
    }
  }

  const closeModal = () => {
    setOpen(null);
    if (params.get('open')) router.replace('/admin/quotes');
  };

  return (
    <>
      <PageTitle
        title="Yêu cầu báo giá"
        sub="Khách hàng gửi từ form trên website"
        actions={
          <a className="a-btn a-btn--ghost" href={`/api/admin/quotes/export.csv?${new URLSearchParams({ ...(status && { status }), ...(query && { q: query }) })}`}>
            <Icon name="download" /> Xuất Excel (CSV)
          </a>
        }
      />

      <div className="a-toolbar">
        <div className="a-tabs" role="tablist">
          {[['', 'Tất cả'], ...Object.entries(QUOTE_STATUS).map(([k, v]) => [k, v.label])].map(([k, label]) => (
            <button
              key={k}
              role="tab"
              aria-selected={status === k}
              className={status === k ? 'is-active' : undefined}
              onClick={() => {
                setStatus(k);
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <form
          className="a-search"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(q.trim());
            setPage(1);
          }}
        >
          <Icon name="search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên, SĐT, công ty, email…" aria-label="Tìm kiếm" />
        </form>
      </div>

      {!data ? (
        <Loading />
      ) : data.items.length === 0 ? (
        <Empty>Không có yêu cầu nào.</Empty>
      ) : (
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Liên hệ</th>
                <th>Dịch vụ</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((x) => (
                <tr key={x.id} onClick={() => setOpen(x)} className={x.status === 'NEW' ? 'is-new' : undefined}>
                  <td>
                    <strong>{x.name}</strong>
                    <span className="a-sub">{x.company || '—'}</span>
                  </td>
                  <td>
                    <a href={`tel:${x.phone}`} onClick={(e) => e.stopPropagation()}>
                      {x.phone}
                    </a>
                    <span className="a-sub">{x.email || ''}</span>
                  </td>
                  <td>
                    {x.service || '—'}
                    <span className="a-sub">{x.lang.toUpperCase()}</span>
                  </td>
                  <td>{fmtDateTime(x.createdAt)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select className={`a-status a-status--${QUOTE_STATUS[x.status]?.tone}`} value={x.status} onChange={(e) => update(x.id, { status: e.target.value })} aria-label="Trạng thái">
                      {Object.entries(QUOTE_STATUS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
        </div>
      )}

      <Modal open={!!open} title={open ? `Yêu cầu #${open.id}` : ''} onClose={closeModal}>
        {open && <QuoteDetail q={open} onSave={(b) => update(open.id, b)} onDelete={() => remove(open.id)} />}
      </Modal>
      <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast({ msg: '' })} />
    </>
  );
}

function QuoteDetail({ q, onSave, onDelete }: { q: Quote; onSave: (b: Partial<Quote>) => void; onDelete: () => void }) {
  const [note, setNote] = useState(q.note || '');
  const [status, setStatus] = useState(q.status);
  const rows: [string, React.ReactNode][] = [
    ['Họ tên', q.name],
    ['Công ty', q.company],
    ['Điện thoại', <a key="p" href={`tel:${q.phone}`}>{q.phone}</a>],
    ['Email', q.email && <a key="e" href={`mailto:${q.email}`}>{q.email}</a>],
    ['Dịch vụ', q.service],
    ['Tuyến / địa điểm', q.route],
    ['Ngôn ngữ', q.lang.toUpperCase()],
    ['Ngày gửi', fmtDateTime(q.createdAt)],
  ];
  return (
    <div className="a-detail">
      <dl className="a-dl">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v || '—'}</dd>
          </div>
        ))}
      </dl>
      {q.message && (
        <div className="a-message">
          <span>Nội dung</span>
          <p>{q.message}</p>
        </div>
      )}
      <label className="a-field">
        <span>Trạng thái</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {Object.entries(QUOTE_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </label>
      <label className="a-field">
        <span>Ghi chú nội bộ</span>
        <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Đã gọi 10h, khách cần báo giá tuyến Vĩnh Phúc – Hải Phòng…" />
      </label>
      <div className="a-actions">
        <button className="a-btn a-btn--danger-ghost" type="button" onClick={onDelete}>
          <Icon name="trash" /> Xóa
        </button>
        <span className="a-spacer" />
        <Badge tone={QUOTE_STATUS[q.status]?.tone || 'gray'}>{QUOTE_STATUS[q.status]?.label}</Badge>
        <button className="a-btn a-btn--primary" type="button" onClick={() => onSave({ status, note: note || null })}>
          Lưu
        </button>
      </div>
    </div>
  );
}

export default function QuotesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <QuotesInner />
    </Suspense>
  );
}
