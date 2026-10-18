'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { MediaPicker } from '@/components/admin/media';
import { Badge, Empty, Loading, Modal, PageTitle, Toast } from '@/components/admin/ui';
import { api, errMsg, LANG_LABEL } from '@/lib/admin-api';

interface AlbumRow {
  id: number;
  slug: string;
  titleVi: string;
  titleEn: string;
  titleJa: string;
  date: string | null;
  published: boolean;
  sortOrder: number;
  count: number;
  cover: string | null;
}
interface Photo {
  id: number;
  url: string;
  thumb: string;
  alt: string;
}

export default function AlbumsPage() {
  const [items, setItems] = useState<AlbumRow[] | null>(null);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone?: 'ok' | 'error' }>({ msg: '' });

  const load = () =>
    api<{ items: AlbumRow[] }>('/admin/albums')
      .then((r) => setItems(r.items))
      .catch((e) => setToast({ msg: errMsg(e), tone: 'error' }));
  useEffect(() => {
    load();
  }, []);

  async function remove(a: AlbumRow) {
    if (!confirm(`Xóa album “${a.titleVi}”? Ảnh vẫn được giữ trong Thư viện ảnh.`)) return;
    await api(`/admin/albums/${a.id}`, { method: 'DELETE' }).catch((e) => setToast({ msg: errMsg(e), tone: 'error' }));
    load();
  }

  return (
    <>
      <PageTitle
        title="Album ảnh"
        sub="Hiển thị ở trang Thư viện. Ảnh lấy từ Thư viện ảnh."
        actions={
          <button className="a-btn a-btn--primary" onClick={() => setEditing('new')}>
            <Icon name="plus" /> Tạo album
          </button>
        }
      />
      {!items ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty>Chưa có album nào.</Empty>
      ) : (
        <ul className="a-albums">
          {items.map((a) => (
            <li key={a.id} className="a-album">
              <button type="button" className="a-album__cover" onClick={() => setEditing(a.id)}>
                {a.cover ? <img src={a.cover} alt="" /> : <Icon name="image" />}
                <span>{a.count} ảnh</span>
              </button>
              <div className="a-album__body">
                <strong>{a.titleVi}</strong>
                <span className="a-sub">
                  {a.date ? new Date(a.date).toLocaleDateString('vi-VN') : 'Chưa có ngày'}
                  {!a.published && (
                    <>
                      {' '}
                      · <Badge tone="gray">Đang ẩn</Badge>
                    </>
                  )}
                </span>
              </div>
              <div className="a-row-actions">
                <button className="a-icon-btn" onClick={() => setEditing(a.id)} title="Sửa">
                  <Icon name="edit" />
                </button>
                <button className="a-icon-btn a-icon-btn--danger" onClick={() => remove(a)} title="Xóa album">
                  <Icon name="trash" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal open={editing !== null} title={editing === 'new' ? 'Tạo album' : 'Sửa album'} onClose={() => setEditing(null)} wide>
        {editing !== null && (
          <AlbumEditor
            id={editing === 'new' ? null : editing}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              load();
              setToast({ msg: 'Đã lưu album' });
            }}
          />
        )}
      </Modal>
      <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast({ msg: '' })} />
    </>
  );
}

type Lang = 'vi' | 'en' | 'ja';
const L = { vi: 'Vi', en: 'En', ja: 'Ja' } as const;

function AlbumEditor({ id, onCancel, onSaved }: { id: number | null; onCancel: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ titleVi: '', titleEn: '', titleJa: '', date: '', published: true, sortOrder: 0 });
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(id !== null);
  const [lang, setLang] = useState<Lang>('vi');
  const [picker, setPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id === null) return;
    api<AlbumRow & { photos: Photo[] }>(`/admin/albums/${id}`)
      .then((a) => {
        setForm({ titleVi: a.titleVi, titleEn: a.titleEn, titleJa: a.titleJa, date: a.date ? a.date.slice(0, 10) : '', published: a.published, sortOrder: a.sortOrder });
        setPhotos(a.photos);
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;

  const move = (i: number, to: number) => {
    const p = [...photos];
    const [x] = p.splice(i, 1);
    p.splice(to, 0, x);
    setPhotos(p);
  };

  async function save() {
    if (form.titleVi.trim().length < 2) return setError('Cần tên album tiếng Việt.');
    setSaving(true);
    setError('');
    try {
      await api(id === null ? '/admin/albums' : `/admin/albums/${id}`, {
        method: id === null ? 'POST' : 'PUT',
        json: { ...form, date: form.date || null, mediaIds: photos.map((p) => p.id) },
      });
      onSaved();
    } catch (e) {
      setError(errMsg(e));
      setSaving(false);
    }
  }

  const key = `title${L[lang]}` as 'titleVi' | 'titleEn' | 'titleJa';

  return (
    <div className="a-detail">
      <div className="a-tabs a-tabs--lang" role="tablist">
        {(['vi', 'en', 'ja'] as Lang[]).map((l) => (
          <button type="button" key={l} role="tab" aria-selected={lang === l} className={lang === l ? 'is-active' : undefined} onClick={() => setLang(l)}>
            {LANG_LABEL[l]}
            {form[`title${L[l]}` as typeof key] ? ' ✓' : l === 'vi' ? ' *' : ''}
          </button>
        ))}
      </div>
      <label className="a-field">
        <span>Tên album{lang === 'vi' && ' *'}</span>
        <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} maxLength={200} lang={lang} />
      </label>
      <div className="a-form-row">
        <label className="a-field">
          <span>Ngày sự kiện</span>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </label>
        <label className="a-field">
          <span>Thứ tự hiển thị</span>
          <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
        </label>
        <div className="a-field">
          <span>&nbsp;</span>
          <label className="a-check">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            <span>Hiển thị</span>
          </label>
        </div>
      </div>

      <div className="a-field">
        <div className="a-field__row">
          <span>Ảnh trong album ({photos.length}) — ảnh đầu tiên là ảnh bìa</span>
          <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => setPicker(true)}>
            <Icon name="plus" /> Thêm ảnh
          </button>
        </div>
        {photos.length ? (
          <ul className="a-album-photos">
            {photos.map((p, i) => (
              <li key={p.id} className={i === 0 ? 'is-cover' : undefined}>
                <img src={p.thumb} alt={p.alt} />
                {i === 0 && <span className="a-album-photos__cover">Ảnh bìa</span>}
                <div className="a-album-photos__tools">
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Lên trước">
                    ‹
                  </button>
                  {i > 0 && (
                    <button type="button" onClick={() => move(i, 0)} title="Đặt làm ảnh bìa">
                      ★
                    </button>
                  )}
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === photos.length - 1} aria-label="Ra sau">
                    ›
                  </button>
                  <button type="button" onClick={() => setPhotos(photos.filter((x) => x.id !== p.id))} aria-label="Bỏ khỏi album" className="is-danger">
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="a-muted">Chưa có ảnh. Bấm “Thêm ảnh” để chọn từ Thư viện ảnh hoặc tải ảnh mới.</p>
        )}
      </div>

      {error && <p className="a-alert a-alert--error">{error}</p>}
      <div className="a-actions">
        <span className="a-spacer" />
        <button type="button" className="a-btn a-btn--ghost" onClick={onCancel}>
          Hủy
        </button>
        <button type="button" className="a-btn a-btn--primary" onClick={save} disabled={saving}>
          {saving ? 'Đang lưu…' : 'Lưu album'}
        </button>
      </div>

      <MediaPicker
        open={picker}
        multiple
        title="Thêm ảnh vào album"
        onClose={() => setPicker(false)}
        onSelect={(items) => setPhotos((p) => [...p, ...items.filter((m) => !p.some((x) => x.id === m.id)).map((m) => ({ id: m.id, url: m.url, thumb: m.thumb, alt: m.alt }))])}
      />
    </div>
  );
}
