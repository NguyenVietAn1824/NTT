'use client';

import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { Empty, Loading, Modal, PageTitle, Pager, Toast } from '@/components/admin/ui';
import { api, APP_STATUS, errMsg, fmtDateTime } from '@/lib/admin-api';

interface App {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  cvFile: string | null;
  cvName: string | null;
  status: string;
  createdAt: string;
  jobTitle: string | null;
}
interface ListRes {
  items: App[];
  total: number;
  page: number;
  pageSize: number;
}

export default function ApplicationsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListRes | null>(null);
  const [open, setOpen] = useState<App | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone?: 'ok' | 'error' }>({ msg: '' });

  const load = useCallback(() => {
    const qs = new URLSearchParams({ page: String(page), ...(status && { status }) });
    api<ListRes>(`/admin/applications?${qs}`).then(setData).catch((e) => setToast({ msg: errMsg(e), tone: 'error' }));
  }, [page, status]);
  useEffect(load, [load]);

  async function setAppStatus(id: number, s: string) {
    try {
      await api(`/admin/applications/${id}`, { method: 'PATCH', json: { status: s } });
      setData((d) => d && { ...d, items: d.items.map((x) => (x.id === id ? { ...x, status: s } : x)) });
      setOpen((o) => (o && o.id === id ? { ...o, status: s } : o));
    } catch (e) {
      setToast({ msg: errMsg(e), tone: 'error' });
    }
  }

  async function remove(a: App) {
    if (!confirm(`Xóa hồ sơ của ${a.name}? CV đính kèm cũng sẽ bị xóa.`)) return;
    await api(`/admin/applications/${a.id}`, { method: 'DELETE' }).catch((e) => setToast({ msg: errMsg(e), tone: 'error' }));
    setOpen(null);
    load();
  }

  return (
    <>
      <PageTitle title="Hồ sơ ứng tuyển" sub="Ứng viên nộp qua trang Tuyển dụng" />
      <div className="a-toolbar">
        <div className="a-tabs" role="tablist">
          {[['', 'Tất cả'], ...Object.entries(APP_STATUS).map(([k, v]) => [k, v.label])].map(([k, label]) => (
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
      </div>

      {!data ? (
        <Loading />
      ) : data.items.length === 0 ? (
        <Empty>Chưa có hồ sơ nào.</Empty>
      ) : (
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Ứng viên</th>
                <th>Vị trí</th>
                <th>CV</th>
                <th>Ngày nộp</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((a) => (
                <tr key={a.id} onClick={() => setOpen(a)} className={a.status === 'NEW' ? 'is-new' : undefined}>
                  <td>
                    <strong>{a.name}</strong>
                    <span className="a-sub">
                      <a href={`tel:${a.phone}`} onClick={(e) => e.stopPropagation()}>
                        {a.phone}
                      </a>
                      {a.email ? ` · ${a.email}` : ''}
                    </span>
                  </td>
                  <td>{a.jobTitle || <span className="a-muted">Ứng tuyển chung</span>}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {a.cvFile ? (
                      <a className="a-link" href={`/api/admin/applications/${a.id}/cv`}>
                        <Icon name="download" /> Tải CV
                      </a>
                    ) : (
                      <span className="a-muted">—</span>
                    )}
                  </td>
                  <td>{fmtDateTime(a.createdAt)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select className={`a-status a-status--${APP_STATUS[a.status]?.tone}`} value={a.status} onChange={(e) => setAppStatus(a.id, e.target.value)} aria-label="Trạng thái">
                      {Object.entries(APP_STATUS).map(([k, v]) => (
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

      <Modal open={!!open} title={open ? `Hồ sơ: ${open.name}` : ''} onClose={() => setOpen(null)}>
        {open && (
          <div className="a-detail">
            <dl className="a-dl">
              <div>
                <dt>Vị trí</dt>
                <dd>{open.jobTitle || 'Ứng tuyển chung'}</dd>
              </div>
              <div>
                <dt>Điện thoại</dt>
                <dd>
                  <a href={`tel:${open.phone}`}>{open.phone}</a>
                </dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{open.email ? <a href={`mailto:${open.email}`}>{open.email}</a> : '—'}</dd>
              </div>
              <div>
                <dt>Ngày nộp</dt>
                <dd>{fmtDateTime(open.createdAt)}</dd>
              </div>
            </dl>
            {open.message && (
              <div className="a-message">
                <span>Giới thiệu</span>
                <p>{open.message}</p>
              </div>
            )}
            <label className="a-field">
              <span>Trạng thái</span>
              <select value={open.status} onChange={(e) => setAppStatus(open.id, e.target.value)}>
                {Object.entries(APP_STATUS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="a-actions">
              <button className="a-btn a-btn--danger-ghost" type="button" onClick={() => remove(open)}>
                <Icon name="trash" /> Xóa hồ sơ
              </button>
              <span className="a-spacer" />
              {open.cvFile && (
                <a className="a-btn a-btn--primary" href={`/api/admin/applications/${open.id}/cv`}>
                  <Icon name="download" /> Tải CV {open.cvName ? `(${open.cvName})` : ''}
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
      <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast({ msg: '' })} />
    </>
  );
}
