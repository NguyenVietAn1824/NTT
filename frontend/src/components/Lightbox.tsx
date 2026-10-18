'use client';

import { useCallback, useEffect, useRef } from 'react';
import Icon from './Icon';

// ---------- Lightbox dùng chung (video / ảnh) ----------
export default function Lightbox({
  count,
  index,
  onIndex,
  onClose,
  t,
  label,
  children,
  caption,
}: {
  count: number;
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  t: { close: string; prev: string; next: string };
  label: string;
  children: React.ReactNode;
  caption?: React.ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const touch = useRef<number | null>(null);
  const go = useCallback((d: number) => onIndex((index + d + count) % count), [index, count, onIndex]);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (count > 1 && e.key === 'ArrowRight') go(1);
      if (count > 1 && e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prevFocus?.focus();
    };
  }, [go, onClose, count]);

  return (
    <div
      className="lb"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null || count < 2) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      <div className="lb__bar">
        <span className="lb__count">{count > 1 ? `${index + 1} / ${count}` : ''}</span>
        <button ref={closeRef} type="button" className="lb__btn" onClick={onClose} aria-label={t.close}>
          <Icon name="x" />
        </button>
      </div>
      <div className="lb__stage" onClick={(e) => e.target === e.currentTarget && onClose()}>
        {children}
      </div>
      {caption && <div className="lb__caption">{caption}</div>}
      {count > 1 && (
        <>
          <button type="button" className="lb__nav lb__nav--prev" onClick={() => go(-1)} aria-label={t.prev}>
            <Icon name="chevron" />
          </button>
          <button type="button" className="lb__nav lb__nav--next" onClick={() => go(1)} aria-label={t.next}>
            <Icon name="chevron" />
          </button>
        </>
      )}
    </div>
  );
}

