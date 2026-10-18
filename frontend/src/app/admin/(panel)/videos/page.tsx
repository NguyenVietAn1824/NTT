'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { Badge, Empty, Loading, Modal, PageTitle, Toast } from '@/components/admin/ui';
import { api, errMsg, fmtBytes, fmtDur, LANG_LABEL, uploadWithProgress } from '@/lib/admin-api';

interface Video {
  id: number;
  slug: string;
  url: string;
  poster: string | null;
  titleVi: string;
  titleEn: string;
  titleJa: string;
  descVi: string;
  descEn: string;
  descJa: string;
  duration: number;
  width: number;
  height: number;
  size: number;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  recordedAt: string | null;
}

export default function VideosPage() {
  const [items, setItems] = useState<Video[] | null>(null);
  const [editing, setEditing] = useState<Video | 'new' | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone?: 'ok' | 'error' }>({ msg: '' });

  const load = () =>
    api<{ items: Video[] }>('/admin/videos')
      .then((r) => setItems(r.items))
      .catch((e) => setToast({ msg: errMsg(e), tone: 'error' }));
  useEffect(() => {
    load();
  }, []);

  async function remove(v: Video) {
    if (!confirm(`Xóa video “${v.titleVi}”? File video và ảnh bìa sẽ bị xóa khỏi kho lưu trữ.`)) return;
    await api(`/admin/videos/${v.id}`, { method: 'DELETE' }).catch((e) => setToast({ msg: errMsg(e), tone: 'error' }));
    load();
  }

  const total = items?.reduce((n, v) => n + v.size, 0) || 0;

  return (
    <>
      <PageTitle
        title="Video"
        sub={items ? `${items.length} video · ${fmtBytes(total)} · hiển thị ở trang Thư viện; video “nổi bật” hiện ở trang chủ` : undefined}
        actions={
          <button className="a-btn a-btn--primary" onClick={() => setEditing('new')}>
            <Icon name="upload" /> Tải video lên
          </button>
        }
      />
      {!items ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty>Chưa có video nào.</Empty>
      ) : (
        <ul className="a-videos">
          {items.map((v) => (
            <li key={v.id} className="a-video">
              <button type="button" className="a-video__thumb" onClick={() => setEditing(v)}>
                {v.poster ? <img src={v.poster} alt="" /> : <span />}
                <span className="a-video__dur">{fmtDur(v.duration)}</span>
              </button>
              <div className="a-video__body">
                <div className="a-video__badges">
                  {v.featured && <Badge tone="yellow">★ Nổi bật · trang chủ</Badge>}
                  {!v.published && <Badge tone="gray">Đang ẩn</Badge>}
                </div>
                <strong>{v.titleVi}</strong>
                <span className="a-sub">
                  {v.width}×{v.height} · {fmtBytes(v.size)}
                  {(!v.titleEn || !v.titleJa) && ' · thiếu bản dịch'}
                </span>
              </div>
              <div className="a-row-actions">
                <a className="a-icon-btn" href={v.url} target="_blank" rel="noopener" title="Mở video">
                  <Icon name="external" />
                </a>
                <button className="a-icon-btn" onClick={() => setEditing(v)} title="Sửa">
                  <Icon name="edit" />
                </button>
                <button className="a-icon-btn a-icon-btn--danger" onClick={() => remove(v)} title="Xóa">
                  <Icon name="trash" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editing !== null} title={editing === 'new' ? 'Tải video lên' : 'Sửa video'} onClose={() => setEditing(null)} wide>
        {editing !== null && (
          <VideoEditor
            video={editing === 'new' ? null : editing}
            onCancel={() => setEditing(null)}
            onSaved={(warning) => {
              setEditing(null);
              load();
              setToast(warning ? { msg: warning, tone: 'error' } : { msg: 'Đã lưu video' });
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

function VideoEditor({ video, onCancel, onSaved }: { video: Video | null; onCancel: () => void; onSaved: (warning?: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState<string | null>(video?.url || null);
  const [meta, setMeta] = useState({ duration: video?.duration || 0, width: video?.width || 0, height: video?.height || 0 });
  const [poster, setPoster] = useState<Blob | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(video?.poster || null);
  const [lang, setLang] = useState<Lang>('vi');
  const [form, setForm] = useState({
    titleVi: video?.titleVi || '',
    titleEn: video?.titleEn || '',
    titleJa: video?.titleJa || '',
    descVi: video?.descVi || '',
    descEn: video?.descEn || '',
    descJa: video?.descJa || '',
    featured: video?.featured || false,
    published: video?.published ?? true,
    sortOrder: video?.sortOrder || 0,
    recordedAt: video?.recordedAt ? video.recordedAt.slice(0, 10) : '',
  });
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const vref = useRef<HTMLVideoElement>(null);

  useEffect(() => () => {
    if (file && src) URL.revokeObjectURL(src);
  }, [file, src]);

  function pickFile(f: File | undefined) {
    if (!f) return;
    if (f.type !== 'video/mp4') return setError('Chỉ nhận video MP4 (H.264). Video .mov/.mkv cần xuất lại sang MP4.');
    if (f.size > 600 * 1024 * 1024) return setError('Video tối đa 600MB.');
    setError('');
    setFile(f);
    setSrc(URL.createObjectURL(f));
    setPoster(null);
    setPosterUrl(null);
    if (!form.titleVi) setForm((x) => ({ ...x, titleVi: f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') }));
  }

  // Chụp khung hình hiện tại làm ảnh bìa
  function capture() {
    const v = vref.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')!.drawImage(v, 0, 0);
    c.toBlob(
      (b) => {
        if (!b) return;
        setPoster(b);
        setPosterUrl(URL.createObjectURL(b));
      },
      'image/jpeg',
      0.92,
    );
  }

  async function save() {
    if (!video && !file) return setError('Chưa chọn file video.');
    if (form.titleVi.trim().length < 2) return setError('Cần tiêu đề tiếng Việt.');
    const fd = new FormData();
    Object.entries({ ...form, ...meta }).forEach(([k, v]) => fd.append(k, String(v)));
    if (file) fd.append('video', file);
    if (poster) fd.append('poster', poster, 'poster.jpg');
    setError('');
    setProgress(0);
    try {
      const r = await uploadWithProgress<{ warning?: string }>(video ? `/admin/videos/${video.id}` : '/admin/videos', video ? 'PUT' : 'POST', fd, setProgress);
      onSaved(r?.warning);
    } catch (e) {
      setError(errMsg(e));
      setProgress(null);
    }
  }

  const k = (base: 'title' | 'desc') => `${base}${L[lang]}` as keyof typeof form;

  return (
    <div className="a-detail">
      <div className="a-video-edit">
        <div>
          {src ? (
            <>
              <video
                ref={vref}
                src={src}
                controls
                preload="metadata"
                crossOrigin="anonymous"
                className="a-video-edit__player"
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  setMeta({ duration: Math.round(v.duration * 10) / 10, width: v.videoWidth, height: v.videoHeight });
                  if (!video && file) v.currentTime = Math.min(5, v.duration / 3);
                }}
                onSeeked={() => !poster && !video?.poster && capture()}
              />
              <div className="a-video-edit__tools">
                <span className="a-muted">
                  {meta.width}×{meta.height} · {fmtDur(meta.duration)}
                  {file && ` · ${fmtBytes(file.size)}`}
                </span>
                <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={capture}>
                  <Icon name="image" /> Dùng khung hình này làm ảnh bìa
                </button>
              </div>
            </>
          ) : (
            <label className="a-drop">
              <input type="file" accept="video/mp4" hidden onChange={(e) => pickFile(e.target.files?.[0])} />
              <Icon name="upload" />
              <div>
                <strong>Chọn video MP4</strong>
                <span>Tối đa 600MB · nên dùng H.264, ≥ 1280px, có “faststart”</span>
              </div>
            </label>
          )}
          {src && (
            <label className="a-link a-video-edit__replace">
              <input type="file" accept="video/mp4" hidden onChange={(e) => pickFile(e.target.files?.[0])} />
              {video ? 'Thay file video khác' : 'Chọn file khác'}
            </label>
          )}
        </div>
        <div>
          <span className="a-field__label">Ảnh bìa</span>
          <div className="a-video-edit__poster">{posterUrl ? <img src={posterUrl} alt="" /> : <span>Tua video tới khung hình đẹp rồi bấm “Dùng khung hình này”</span>}</div>
          <label className="a-link">
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setPoster(f);
                  setPosterUrl(URL.createObjectURL(f));
                }
              }}
            />
            hoặc tải ảnh bìa riêng
          </label>
        </div>
      </div>

      <div className="a-tabs a-tabs--lang" role="tablist">
        {(['vi', 'en', 'ja'] as Lang[]).map((l) => (
          <button type="button" key={l} role="tab" aria-selected={lang === l} className={lang === l ? 'is-active' : undefined} onClick={() => setLang(l)}>
            {LANG_LABEL[l]}
            {form[`title${L[l]}` as keyof typeof form] ? ' ✓' : l === 'vi' ? ' *' : ''}
          </button>
        ))}
      </div>
      <label className="a-field">
        <span>Tiêu đề{lang === 'vi' && ' *'}</span>
        <input value={String(form[k('title')])} onChange={(e) => setForm({ ...form, [k('title')]: e.target.value })} maxLength={200} lang={lang} />
      </label>
      <label className="a-field">
        <span>Mô tả ngắn</span>
        <textarea rows={2} value={String(form[k('desc')])} onChange={(e) => setForm({ ...form, [k('desc')]: e.target.value })} maxLength={2000} lang={lang} />
      </label>
      <div className="a-form-row">
        <label className="a-field">
          <span>Ngày quay (tùy chọn)</span>
          <input type="date" value={form.recordedAt} onChange={(e) => setForm({ ...form, recordedAt: e.target.value })} />
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
      <label className="a-check">
        <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
        <span>★ Video nổi bật — hiện ở trang chủ và đầu trang Thư viện (chỉ một video)</span>
      </label>

      {error && <p className="a-alert a-alert--error">{error}</p>}
      {progress !== null && (
        <div className="a-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${progress}%` }} />
          <em>{progress < 100 ? `Đang tải lên ${progress}%` : 'Đang lưu vào kho…'}</em>
        </div>
      )}
      <div className="a-actions">
        <span className="a-spacer" />
        <button type="button" className="a-btn a-btn--ghost" onClick={onCancel} disabled={progress !== null}>
          Hủy
        </button>
        <button type="button" className="a-btn a-btn--primary" onClick={save} disabled={progress !== null}>
          {video ? 'Lưu' : 'Tải lên'}
        </button>
      </div>
    </div>
  );
}
