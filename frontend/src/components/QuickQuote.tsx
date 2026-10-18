'use client';

import { useState, type FormEvent } from 'react';
import type { Dict, Lang } from '@/content';
import Icon from './Icon';
import { apiUrl } from '@/lib/endpoint';

// Form “gọi lại cho tôi”: chỉ cần tên + số điện thoại → lưu thành yêu cầu báo giá
export default function QuickQuote({ lang, c }: { lang: Lang; c: Dict['home']['cta'] }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') || '').trim();
    const phone = String(fd.get('phone') || '').trim();
    if (name.length < 2 || !/^[+\d\s().-]{8,20}$/.test(phone)) return setState('error');
    setState('sending');
    try {
      const res = await fetch(apiUrl('/quotes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, lang, message: c.submit, website: fd.get('website') || '' }),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'done')
    return (
      <p className="qq__done" role="status">
        <Icon name="check" /> {c.done}
      </p>
    );

  return (
    <form className="qq" onSubmit={onSubmit} noValidate>
      <label className="qq__field">
        <span className="sr-only">{c.name}</span>
        <Icon name="users" />
        <input name="name" placeholder={c.name} autoComplete="name" maxLength={100} required />
      </label>
      <label className="qq__field">
        <span className="sr-only">{c.phone}</span>
        <Icon name="phone" />
        <input name="phone" type="tel" placeholder={c.phone} autoComplete="tel" maxLength={20} required />
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
      <button className="btn btn--coral" disabled={state === 'sending'}>
        {state === 'sending' ? c.sending : c.submit}
      </button>
      {state === 'error' && (
        <p className="qq__error" role="alert">
          {c.error}
        </p>
      )}
    </form>
  );
}
