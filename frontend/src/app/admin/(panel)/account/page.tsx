'use client';

import { useState, type FormEvent } from 'react';
import { PageTitle } from '@/components/admin/ui';
import { useUser } from '@/components/admin/Shell';
import { api, errMsg } from '@/lib/admin-api';

export default function AccountPage() {
  const user = useUser();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const fd = new FormData(f);
    if (fd.get('next') !== fd.get('confirm')) return setMsg({ text: 'Mật khẩu nhập lại không khớp.', ok: false });
    try {
      await api('/auth/change-password', { method: 'POST', json: { current: fd.get('current'), next: fd.get('next') } });
      f.reset();
      setMsg({ text: 'Đã đổi mật khẩu.', ok: true });
    } catch (err) {
      const m = errMsg(err);
      setMsg({ text: m.includes('incorrect') ? 'Mật khẩu hiện tại không đúng.' : m.includes('next') ? 'Mật khẩu mới cần ít nhất 8 ký tự.' : m, ok: false });
    }
  }

  return (
    <>
      <PageTitle title="Tài khoản" sub={user ? `${user.name} · ${user.email}` : undefined} />
      <form className="a-panel a-narrow" onSubmit={onSubmit}>
        <h2 className="a-h2">Đổi mật khẩu</h2>
        <label className="a-field">
          <span>Mật khẩu hiện tại</span>
          <input name="current" type="password" autoComplete="current-password" required />
        </label>
        <label className="a-field">
          <span>Mật khẩu mới (ít nhất 8 ký tự)</span>
          <input name="next" type="password" autoComplete="new-password" minLength={8} required />
        </label>
        <label className="a-field">
          <span>Nhập lại mật khẩu mới</span>
          <input name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        </label>
        {msg && <p className={`a-alert ${msg.ok ? 'a-alert--ok' : 'a-alert--error'}`}>{msg.text}</p>}
        <button className="a-btn a-btn--primary">Cập nhật</button>
      </form>
    </>
  );
}
