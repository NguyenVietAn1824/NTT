'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { api, errMsg } from '@/lib/admin-api';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    setError('');
    try {
      await api('/auth/login', { method: 'POST', json: { email: fd.get('email'), password: fd.get('password') } });
      const next = params.get('next');
      router.replace(next && next.startsWith('/admin') ? next : '/admin');
      router.refresh();
    } catch (err) {
      setError(errMsg(err) === 'Invalid email or password' ? 'Email hoặc mật khẩu không đúng.' : errMsg(err));
      setLoading(false);
    }
  }

  return (
    <form className="login__card" onSubmit={onSubmit}>
      <div className="login__brand">
        <Image src="/img/logo.png" alt="" width={72} height={49} />
        <div>
          <strong>NTT Logistics</strong>
          <span>Trang quản trị</span>
        </div>
      </div>
      <label className="a-field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="username" required autoFocus />
      </label>
      <label className="a-field">
        <span>Mật khẩu</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {error && (
        <p className="a-alert a-alert--error" role="alert">
          {error}
        </p>
      )}
      <button className="a-btn a-btn--primary a-btn--block" disabled={loading}>
        {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </button>
      <a className="login__back" href="/">
        ← Về website
      </a>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="login">
      <div className="login__stripe" aria-hidden="true" />
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
