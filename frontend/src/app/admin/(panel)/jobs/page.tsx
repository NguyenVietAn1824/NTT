'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { Badge, Empty, Loading, Modal, PageTitle, Toast } from '@/components/admin/ui';
import { api, errMsg, LANG_LABEL } from '@/lib/admin-api';

type Lang = 'vi' | 'en' | 'ja';
type Tr = { title: string; location: string; description: string };
interface Job {
  id: number;
  icon: string;
  openings: number;
  active: boolean;
  sortOrder: number;
  translations: ({ lang: Lang } & Tr)[];
  _count?: { applications: number };
}
interface JobForm {
  icon: string;
  openings: number;
  active: boolean;
  sortOrder: number;
  translations: Record<Lang, Tr>;
}

const ICONS: [string, string][] = [
  ['truck', 'Xe tải'],
  ['route', 'Tuyến đường'],
  ['box', 'Hàng hóa'],
  ['warehouse', 'Kho'],
  ['forklift', 'Xe nâng'],
  ['users', 'Nhân sự'],
];
const emptyTr = (): Tr => ({ title: '', location: '', description: '' });

export default function JobsPage() {
  const [items, setItems] = useState<Job[] | null>(null);
  const [editing, setEditing] = useState<{ id?: number; form: JobForm } | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone?: 'ok' | 'error' }>({ msg: '' });

  const load = () =>
    api<{ items: Job[] }>('/admin/jobs')
      .then((r) => setItems(r.items))
      .catch((e) => setToast({ msg: errMsg(e), tone: 'error' }));
  useEffect(() => {
    load();
  }, []);

  const openNew = () =>
    setEditing({ form: { icon: 'truck', openings: 1, active: true, sortOrder: (items?.length || 0) + 1, translations: { vi: emptyTr(), en: emptyTr(), ja: emptyTr() } } });

  const openEdit = (j: Job) => {
    const translations = { vi: emptyTr(), en: emptyTr(), ja: emptyTr() };
    j.translations.forEach((t) => (translations[t.lang] = { title: t.title, location: t.location, description: t.description || '' }));
    setEditing({ id: j.id, form: { icon: j.icon, openings: j.openings, active: j.active, sortOrder: j.sortOrder, translations } });
  };

  async function toggle(j: Job) {
    const tr = Object.fromEntries(j.translations.map((t) => [t.lang, { title: t.title, location: t.location, description: t.description }]));
    await api(`/admin/jobs/${j.id}`, { method: 'PUT', json: { icon: j.icon, openings: j.openings, sortOrder: j.sortOrder, active: !j.active, translations: tr } }).catch((e) =>
      setToast({ msg: errMsg(e), tone: 'error' }),
    );
    load();
  }

  async function remove(j: Job) {
    const title = j.translations.find((t) => t.lang === 'vi')?.title;
    if (!confirm(`Xóa vị trí “${title}”? Hồ sơ đã nộp vẫn được giữ lại.`)) return;
    await api(`/admin/jobs/${j.id}`, { method: 'DELETE' }).catch((e) => setToast({ msg: errMsg(e), tone: 'error' }));
    load();
  }

  return (
    <>
      <PageTitle
        title="Tuyển dụng"
        sub="Các vị trí hiển thị ở trang Tuyển dụng"
        actions={
          <button className="a-btn a-btn--primary" onClick={openNew}>
            <Icon name="plus" /> Thêm vị trí
          </button>
        }
      />
      {!items ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty>Chưa có vị trí nào.</Empty>
      ) : (
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Vị trí</th>
                <th>Nơi làm việc</th>
                <th>Số lượng</th>
                <th>Hồ sơ</th>
                <th>Hiển thị</th>
                <th aria-label="Thao tác" />
              </tr>
            </thead>
            <tbody>
              {items.map((j) => {
                const vi = j.translations.find((t) => t.lang === 'vi');
                return (
                  <tr key={j.id}>
                    <td>
                      <div className="a-with-icon">
                        <span className="a-icon-box">
                          <Icon name={j.icon} />
                        </span>
                        <button className="a-link-strong" onClick={() => openEdit(j)}>
                          {vi?.title}
                        </button>
                      </div>
                    </td>
                    <td className="a-wrap">{vi?.location}</td>
                    <td>{j.openings}</td>
                    <td>{j._count?.applications ?? 0}</td>
                    <td>
                      <button className="a-switch" role="switch" aria-checked={j.active} onClick={() => toggle(j)} aria-label="Hiển thị trên website">
                        <span />
                      </button>
                    </td>
                    <td className="a-row-actions">
                      <button className="a-icon-btn" onClick={() => openEdit(j)} title="Sửa">
                        <Icon name="edit" />
                      </button>
                      <button className="a-icon-btn a-icon-btn--danger" onClick={() => remove(j)} title="Xóa">
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

      <Modal open={!!editing} title={editing?.id ? 'Sửa vị trí tuyển dụng' : 'Thêm vị trí tuyển dụng'} onClose={() => setEditing(null)} wide>
        {editing && (
          <JobEditor
            initial={editing.form}
            onCancel={() => setEditing(null)}
            onSave={async (form) => {
              const translations: Partial<Record<Lang, Tr>> = {};
              (['vi', 'en', 'ja'] as Lang[]).forEach((l) => {
                const t = form.translations[l];
                if (t.title.trim() && t.location.trim()) translations[l] = { ...t, description: t.description || '' };
              });
              if (!translations.vi) return setToast({ msg: 'Cần nhập tên vị trí và nơi làm việc bằng tiếng Việt', tone: 'error' });
              try {
                await api(editing.id ? `/admin/jobs/${editing.id}` : '/admin/jobs', { method: editing.id ? 'PUT' : 'POST', json: { ...form, translations } });
                setEditing(null);
                setToast({ msg: 'Đã lưu' });
                load();
              } catch (e) {
                setToast({ msg: errMsg(e), tone: 'error' });
              }
            }}
          />
        )}
      </Modal>
      <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast({ msg: '' })} />
    </>
  );
}

function JobEditor({ initial, onSave, onCancel }: { initial: JobForm; onSave: (f: JobForm) => void; onCancel: () => void }) {
  const [form, setForm] = useState(initial);
  const [lang, setLang] = useState<Lang>('vi');
  const tr = form.translations[lang];
  const setTr = (p: Partial<Tr>) => setForm({ ...form, translations: { ...form.translations, [lang]: { ...tr, ...p } } });

  return (
    <form
      className="a-detail"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <div className="a-form-row">
        <label className="a-field">
          <span>Biểu tượng</span>
          <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
            {ICONS.map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="a-field">
          <span>Số lượng cần tuyển</span>
          <input type="number" min={1} value={form.openings} onChange={(e) => setForm({ ...form, openings: Number(e.target.value) })} />
        </label>
        <label className="a-field">
          <span>Thứ tự hiển thị</span>
          <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
        </label>
      </div>
      <label className="a-check">
        <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
        <span>Đang tuyển (hiển thị trên website)</span>
      </label>

      <div className="a-tabs a-tabs--lang" role="tablist">
        {(['vi', 'en', 'ja'] as Lang[]).map((l) => (
          <button type="button" key={l} role="tab" aria-selected={lang === l} className={lang === l ? 'is-active' : undefined} onClick={() => setLang(l)}>
            {LANG_LABEL[l]}
            {form.translations[l].title ? ' ✓' : l === 'vi' ? ' *' : ''}
          </button>
        ))}
      </div>
      <label className="a-field">
        <span>Tên vị trí{lang === 'vi' && ' *'}</span>
        <input value={tr.title} onChange={(e) => setTr({ title: e.target.value })} lang={lang} />
      </label>
      <label className="a-field">
        <span>Nơi làm việc{lang === 'vi' && ' *'}</span>
        <input value={tr.location} onChange={(e) => setTr({ location: e.target.value })} lang={lang} />
      </label>
      <label className="a-field">
        <span>Mô tả ngắn (tùy chọn)</span>
        <textarea rows={3} value={tr.description} onChange={(e) => setTr({ description: e.target.value })} lang={lang} />
      </label>
      <div className="a-actions">
        <span className="a-spacer" />
        <Badge tone={form.active ? 'green' : 'gray'}>{form.active ? 'Đang tuyển' : 'Tạm ẩn'}</Badge>
        <button type="button" className="a-btn a-btn--ghost" onClick={onCancel}>
          Hủy
        </button>
        <button className="a-btn a-btn--primary">Lưu</button>
      </div>
    </form>
  );
}
