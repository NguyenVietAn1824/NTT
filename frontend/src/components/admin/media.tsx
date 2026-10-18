'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { api, errMsg, fmtBytes, uploadMedia, type MediaItem } from '@/lib/admin-api';
import { Empty, Loading, Modal, Pager } from './ui';

export interface MediaList {
  items: MediaItem[];
  total: number;
  page: number;
  pageSize: number;
  stats: { count: number; storedBytes: number; originalBytes: number };
}

export function useMediaList(pageSize = 30) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<MediaList | null>(null);
  const [error, setError] = useState('');

  const reload = useCallback(() => {
    const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize), ...(q && { q }) });
    api<MediaList>(`/admin/media?${qs}`)
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch((e) => setError(errMsg(e)));
  }, [q, page, pageSize]);
  useEffect(reload, [reload]);

  return { data, error, reload, q, setQ: (v: string) => (setQ(v), setPage(1)), page, setPage };
}

// Vùng kéo-thả / bấm để chọn ảnh
export function Dropzone({ onUploaded, compact }: { onUploaded: (items: MediaItem[]) => void; compact?: boolean }) {
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState<string>('');
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);

  async function handle(files: FileList | File[] | null) {
    const list = Array.from(files || []).filter((f) => f.type.startsWith('image/'));
    if (!list.length) return setError('Chỉ nhận file ảnh (JPG, PNG, WEBP, GIF, AVIF).');
    if (list.some((f) => f.size > 15 * 1024 * 1024)) return setError('Mỗi ảnh tối đa 15MB.');
    setError('');
    const uploaded: MediaItem[] = [];
    const failed: string[] = [];
    // Gửi theo lô 5 ảnh để không quá tải
    for (let i = 0; i < list.length; i += 5) {
      setBusy(`Đang tải lên và tối ưu ${Math.min(i + 5, list.length)}/${list.length} ảnh…`);
      try {
        const r = await uploadMedia(list.slice(i, i + 5));
        uploaded.push(...r.items);
        failed.push(...r.failed.map((f) => f.filename));
      } catch (e) {
        failed.push(...list.slice(i, i + 5).map((f) => f.name));
        setError(errMsg(e));
      }
    }
    setBusy('');
    if (failed.length) setError(`Không tải được: ${failed.join(', ')}`);
    if (uploaded.length) onUploaded(uploaded);
  }

  return (
    <div
      className={`a-drop${over ? ' is-over' : ''}${compact ? ' a-drop--compact' : ''}${busy ? ' is-busy' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!busy) handle(e.dataTransfer.files);
      }}
      onClick={() => !busy && input.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
    >
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = '';
        }}
      />
      {busy ? (
        <>
          <span className="a-spinner" /> <span>{busy}</span>
        </>
      ) : (
        <>
          <Icon name="upload" />
          <div>
            <strong>Kéo thả ảnh vào đây hoặc bấm để chọn</strong>
            {!compact && <span>Chọn nhiều ảnh cùng lúc · tối đa 15MB/ảnh · tự nén sang WebP và tạo các kích cỡ 400/800/1600px</span>}
          </div>
        </>
      )}
      {error && (
        <p className="a-drop__error" role="alert" onClick={(e) => e.stopPropagation()}>
          {error}
        </p>
      )}
    </div>
  );
}

export function MediaGrid({
  items,
  selected = [],
  onPick,
}: {
  items: MediaItem[];
  selected?: number[];
  onPick: (m: MediaItem) => void;
}) {
  return (
    <ul className="a-media-grid">
      {items.map((m) => {
        const idx = selected.indexOf(m.id);
        return (
          <li key={m.id}>
            <button type="button" className={`a-media${idx >= 0 ? ' is-selected' : ''}`} onClick={() => onPick(m)} title={m.filename}>
              <img src={m.thumb} alt={m.alt} loading="lazy" />
              {idx >= 0 && <span className="a-media__check">{selected.length > 1 ? idx + 1 : <Icon name="check" />}</span>}
              <span className="a-media__meta">
                {m.width}×{m.height} · {fmtBytes(m.variants[m.variants.length - 1]?.size || m.size)}
              </span>
              {!m.alt && <span className="a-media__warn" title="Chưa có mô tả (alt)">alt</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function SearchBox({ onSearch, placeholder = 'Tìm theo tên file hoặc mô tả…' }: { onSearch: (q: string) => void; placeholder?: string }) {
  const [v, setV] = useState('');
  return (
    <form
      className="a-search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(v.trim());
      }}
    >
      <Icon name="search" />
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} aria-label="Tìm ảnh" />
    </form>
  );
}

// Hộp chọn ảnh từ thư viện (dùng trong trình soạn tin)
export function MediaPicker({
  open,
  multiple,
  title,
  onClose,
  onSelect,
}: {
  open: boolean;
  multiple?: boolean;
  title?: string;
  onClose: () => void;
  onSelect: (items: MediaItem[]) => void;
}) {
  return (
    <Modal open={open} title={title || (multiple ? 'Chọn ảnh (có thể chọn nhiều)' : 'Chọn ảnh')} onClose={onClose} wide>
      <PickerBody multiple={multiple} onClose={onClose} onSelect={onSelect} />
    </Modal>
  );
}

function PickerBody({ multiple, onClose, onSelect }: { multiple?: boolean; onClose: () => void; onSelect: (items: MediaItem[]) => void }) {
  const { data, error, reload, setQ, setPage } = useMediaList(24);
  const [picked, setPicked] = useState<MediaItem[]>([]);

  const toggle = (m: MediaItem) =>
    setPicked((p) => (p.some((x) => x.id === m.id) ? p.filter((x) => x.id !== m.id) : multiple ? [...p, m] : [m]));

  return (
    <div className="a-picker">
      <Dropzone
        compact
        onUploaded={(items) => {
          reload();
          setPicked((p) => (multiple ? [...p, ...items] : items.slice(0, 1)));
        }}
      />
      <SearchBox onSearch={setQ} />
      {error && <p className="a-alert a-alert--error">{error}</p>}
      {!data ? <Loading /> : data.items.length === 0 ? <Empty>Không có ảnh nào.</Empty> : <MediaGrid items={data.items} selected={picked.map((p) => p.id)} onPick={toggle} />}
      {data && <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      <div className="a-actions a-picker__foot">
        <span className="a-muted">{picked.length ? `Đã chọn ${picked.length} ảnh` : 'Bấm vào ảnh để chọn'}</span>
        <span className="a-spacer" />
        <button type="button" className="a-btn a-btn--ghost" onClick={onClose}>
          Hủy
        </button>
        <button
          type="button"
          className="a-btn a-btn--primary"
          disabled={!picked.length}
          onClick={() => {
            onSelect(picked);
            onClose();
          }}
        >
          {multiple ? `Thêm ${picked.length || ''} ảnh` : 'Chọn ảnh này'}
        </button>
      </div>
    </div>
  );
}
