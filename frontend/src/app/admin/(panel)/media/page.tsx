'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { Dropzone, MediaGrid, SearchBox, useMediaList } from '@/components/admin/media';
import { Empty, Loading, Modal, PageTitle, Pager, Toast } from '@/components/admin/ui';
import { api, ApiError, errMsg, fmtBytes, fmtDateTime, type MediaItem } from '@/lib/admin-api';

type Usage = { type: 'news' | 'album'; id: number; slug: string; title: string };
type Detail = MediaItem & { uploadedBy: string | null; usage: Usage[] };

export default function MediaLibraryPage() {
  const { data, error, reload, setQ, setPage } = useMediaList(30);
  const [open, setOpen] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone?: 'ok' | 'error' }>({ msg: '' });

  const s = data?.stats;
  const saved = s && s.originalBytes ? Math.round((1 - s.storedBytes / s.originalBytes) * 100) : 0;

  return (
    <>
      <PageTitle
        title="Thư viện ảnh"
        sub={s ? `${s.count} ảnh · đang chiếm ${fmtBytes(s.storedBytes)}${saved > 0 ? ` (nhẹ hơn ảnh gốc ${saved}%)` : ''}` : 'Ảnh dùng cho tin tức và website'}
      />
      <Dropzone
        onUploaded={(items) => {
          reload();
          setToast({ msg: `Đã tải lên ${items.length} ảnh` });
        }}
      />
      <div className="a-toolbar a-toolbar--spaced">
        <SearchBox onSearch={setQ} />
      </div>
      {error && <p className="a-alert a-alert--error">{error}</p>}
      {!data ? (
        <Loading />
      ) : data.items.length === 0 ? (
        <Empty>Chưa có ảnh nào. Kéo thả ảnh vào khung phía trên để bắt đầu.</Empty>
      ) : (
        <>
          <MediaGrid items={data.items} onPick={(m) => setOpen(m.id)} />
          <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
        </>
      )}

      <Modal open={open !== null} title="Chi tiết ảnh" onClose={() => setOpen(null)} wide>
        {open !== null && (
          <MediaDetail
            id={open}
            onChanged={reload}
            onDeleted={() => {
              setOpen(null);
              reload();
              setToast({ msg: 'Đã xóa ảnh' });
            }}
            onToast={(msg, tone) => setToast({ msg, tone })}
          />
        )}
      </Modal>
      <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast({ msg: '' })} />
    </>
  );
}

function MediaDetail({
  id,
  onChanged,
  onDeleted,
  onToast,
}: {
  id: number;
  onChanged: () => void;
  onDeleted: () => void;
  onToast: (msg: string, tone?: 'ok' | 'error') => void;
}) {
  const [m, setM] = useState<Detail | null>(null);
  const [alt, setAlt] = useState('');

  useEffect(() => {
    api<Detail>(`/admin/media/${id}`)
      .then((d) => {
        setM(d);
        setAlt(d.alt);
      })
      .catch((e) => onToast(errMsg(e), 'error'));
    // chỉ tải lại khi đổi ảnh (onToast là hàm inline của trang cha)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!m) return <Loading />;
  const absolute = (u: string) => (u.startsWith('http') ? u : `${window.location.origin}${u}`);

  async function saveAlt() {
    try {
      await api(`/admin/media/${id}`, { method: 'PATCH', json: { alt } });
      onToast('Đã lưu mô tả');
      onChanged();
    } catch (e) {
      onToast(errMsg(e), 'error');
    }
  }

  async function remove(force = false) {
    if (!force && !confirm('Xóa ảnh này khỏi thư viện? Tất cả kích cỡ sẽ bị xóa khỏi kho lưu trữ.')) return;
    try {
      await api(`/admin/media/${id}${force ? '?force=1' : ''}`, { method: 'DELETE' });
      onDeleted();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        if (confirm('Ảnh đang được dùng trong bài viết hoặc album. Vẫn xóa? (ảnh sẽ biến mất khỏi những nơi đó)')) remove(true);
        return;
      }
      onToast(errMsg(e), 'error');
    }
  }

  return (
    <div className="a-media-detail">
      <div className="a-media-detail__preview">
        <img src={m.variants[Math.min(1, m.variants.length - 1)]?.url || m.url} alt={m.alt} />
      </div>
      <div className="a-media-detail__info">
        <dl className="a-dl">
          <div>
            <dt>Tên file gốc</dt>
            <dd>{m.filename}</dd>
          </div>
          <div>
            <dt>Kích thước</dt>
            <dd>
              {m.width} × {m.height}px
            </dd>
          </div>
          <div>
            <dt>Dung lượng</dt>
            <dd>
              {fmtBytes(m.size)} <span className="a-muted">(gốc {fmtBytes(m.originalSize)})</span>
            </dd>
          </div>
          <div>
            <dt>Tải lên</dt>
            <dd>
              {fmtDateTime(m.createdAt)}
              {m.uploadedBy ? ` · ${m.uploadedBy}` : ''}
            </dd>
          </div>
        </dl>

        <label className="a-field">
          <span>Mô tả ảnh (alt) — giúp Google hiểu ảnh và hỗ trợ người khiếm thị</span>
          <div className="a-inline">
            <input value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} placeholder="VD: Đội xe tải Isuzu của NTT tại KCN Thăng Long 3" />
            <button type="button" className="a-btn a-btn--primary" onClick={saveAlt} disabled={alt === m.alt}>
              Lưu
            </button>
          </div>
        </label>

        <div className="a-field">
          <span>Các kích cỡ đã tạo</span>
          <ul className="a-variants">
            {m.variants.map((v) => (
              <li key={v.w}>
                <a href={v.url} target="_blank" rel="noopener">
                  {v.w}×{v.h}
                </a>
                <span className="a-muted">{fmtBytes(v.size)}</span>
                <button
                  type="button"
                  className="a-icon-btn"
                  title="Sao chép đường dẫn"
                  onClick={() => navigator.clipboard.writeText(absolute(v.url)).then(() => onToast('Đã sao chép đường dẫn'))}
                >
                  <Icon name="copy" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="a-field">
          <span>Đang dùng trong</span>
          {m.usage.length ? (
            <ul className="a-usage">
              {m.usage.map((u) => (
                <li key={`${u.type}-${u.id}`}>
                  <Link href={u.type === 'album' ? '/admin/albums' : `/admin/news/${u.id}`}>
                    <Icon name={u.type === 'album' ? 'image' : 'news'} /> {u.type === 'album' ? 'Album: ' : ''}
                    {u.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="a-muted">Chưa được bài viết hay album nào sử dụng.</p>
          )}
        </div>

        <div className="a-actions">
          <button type="button" className="a-btn a-btn--danger-ghost" onClick={() => remove()}>
            <Icon name="trash" /> Xóa ảnh
          </button>
          <span className="a-spacer" />
          <a className="a-btn a-btn--ghost" href={m.url} target="_blank" rel="noopener">
            <Icon name="external" /> Mở ảnh gốc
          </a>
        </div>
      </div>
    </div>
  );
}
