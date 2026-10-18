'use client';

import { useEffect, useRef } from 'react';
import Icon from '@/components/Icon';

export function PageTitle({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="a-title">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {actions && <div className="a-title__actions">{actions}</div>}
    </div>
  );
}

export function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`a-badge a-badge--${tone}`}>{children}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="a-empty">{children}</div>;
}

export function Loading() {
  return (
    <div className="a-loading" role="status">
      <span className="a-spinner" /> Đang tải…
    </div>
  );
}

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="a-pager">
      <button className="a-btn a-btn--ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        ← Trước
      </button>
      <span>
        Trang {page} / {pages}
      </span>
      <button className="a-btn a-btn--ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Sau →
      </button>
    </div>
  );
}

// Hộp thoại dùng <dialog> gốc của trình duyệt (focus trap, Esc để đóng)
export function Modal({ open, title, onClose, children, wide }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className={`a-modal${wide ? ' a-modal--wide' : ''}`} onClose={onClose} onCancel={onClose}>
      <div className="a-modal__head">
        <h2>{title}</h2>
        <button type="button" className="a-icon-btn" onClick={onClose} aria-label="Đóng">
          <Icon name="x" />
        </button>
      </div>
      <div className="a-modal__body">{open && children}</div>
    </dialog>
  );
}

export function Toast({ message, tone = 'ok', onDone }: { message: string; tone?: 'ok' | 'error'; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onDone, 3500);
    return () => clearTimeout(id);
  }, [message, onDone]);
  if (!message) return null;
  return (
    <div className={`a-toast a-toast--${tone}`} role="status">
      {message}
    </div>
  );
}
