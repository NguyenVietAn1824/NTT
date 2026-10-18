'use client';

import { useRef, useState, type FormEvent } from 'react';
import type { Dict, Lang } from '@/content';
import Icon from './Icon';
import { apiUrl } from '@/lib/endpoint';

type Status = 'idle' | 'sending' | 'done' | 'error';
type Errors = Partial<Record<string, string>>;

const PHONE_RE = /^[+\d\s().-]{8,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({
  name,
  label,
  error,
  required,
  requiredLabel,
  full,
  children,
}: {
  name: string;
  label: string;
  error?: string;
  required?: boolean;
  requiredLabel: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`field${full ? ' field--full' : ''}${error ? ' has-error' : ''}`}>
      <label htmlFor={`f-${name}`}>
        {label}
        {required && (
          <span className="req" title={requiredLabel}>
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <span className="field__error" id={`f-${name}-err`}>
          {error}
        </span>
      )}
    </div>
  );
}

const inputProps = (name: string, errors: Errors) => ({
  id: `f-${name}`,
  name,
  'aria-invalid': errors[name] ? true : undefined,
  'aria-describedby': errors[name] ? `f-${name}-err` : undefined,
});

async function submit(url: string, body: BodyInit, json: boolean): Promise<'ok' | 'rate' | 'fail'> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      body,
      headers: json ? { 'Content-Type': 'application/json' } : undefined,
    });
    if (res.ok) return 'ok';
    return res.status === 429 ? 'rate' : 'fail';
  } catch {
    return 'fail';
  }
}

function Success({ text, again, onAgain }: { text: string; again: string; onAgain: () => void }) {
  return (
    <div className="form-success" role="status">
      <span className="form-success__icon">
        <Icon name="check" />
      </span>
      <p>{text}</p>
      <button type="button" className="btn btn--outline" onClick={onAgain}>
        {again}
      </button>
    </div>
  );
}

// ---------- Form yêu cầu báo giá ----------
export function QuoteForm({ lang, f, forms }: { lang: Lang; f: Dict['contact']['form']; forms: Dict['forms'] }) {
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState('');
  const ref = useRef<HTMLFormElement>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const errs: Errors = {};
    if ((data.name || '').trim().length < 2) errs.name = forms.nameErr;
    if (!PHONE_RE.test((data.phone || '').trim())) errs.phone = forms.phoneErr;
    if (data.email && !EMAIL_RE.test(data.email.trim())) errs.email = forms.emailErr;
    setErrors(errs);
    if (Object.keys(errs).length) {
      setMessage(forms.invalid);
      ref.current?.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`)?.focus();
      return;
    }
    setStatus('sending');
    setMessage('');
    const r = await submit(apiUrl('/quotes'), JSON.stringify({ ...data, lang }), true);
    if (r === 'ok') return setStatus('done');
    setStatus('error');
    setMessage(r === 'rate' ? forms.tooMany : forms.failed);
  }

  return (
    <div className="quote-form" id="quote">
      <h2>{f.title}</h2>
      <p className="quote-form__sub">{f.sub}</p>
      {status === 'done' ? (
        <Success text={forms.success} again={forms.sendAnother} onAgain={() => setStatus('idle')} />
      ) : (
        <form ref={ref} onSubmit={onSubmit} noValidate>
          <div className="form-grid">
            <Field name="name" label={f.name} error={errors.name} required requiredLabel={forms.required}>
              <input {...inputProps('name', errors)} autoComplete="name" required maxLength={100} />
            </Field>
            <Field name="company" label={f.company} requiredLabel={forms.required}>
              <input {...inputProps('company', errors)} autoComplete="organization" maxLength={150} />
            </Field>
            <Field name="phone" label={f.phone} error={errors.phone} required requiredLabel={forms.required}>
              <input {...inputProps('phone', errors)} type="tel" autoComplete="tel" required maxLength={20} />
            </Field>
            <Field name="email" label={f.email} error={errors.email} requiredLabel={forms.required}>
              <input {...inputProps('email', errors)} type="email" autoComplete="email" maxLength={150} />
            </Field>
            <Field name="service" label={f.service} requiredLabel={forms.required}>
              <select {...inputProps('service', errors)}>
                {f.serviceOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field name="route" label={f.route} requiredLabel={forms.required}>
              <input {...inputProps('route', errors)} placeholder={f.routePh} maxLength={200} />
            </Field>
            <Field name="message" label={f.message} full requiredLabel={forms.required}>
              <textarea {...inputProps('message', errors)} rows={5} placeholder={f.messagePh} maxLength={3000} />
            </Field>
            {/* Honeypot chống bot — ẩn với người dùng */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
          </div>
          {message && (
            <p className="form-error" role="alert">
              {message}
            </p>
          )}
          <button className="btn btn--primary btn--lg" type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? forms.sending : f.submit} <Icon name="arrow" />
          </button>
          <p className="quote-form__note">{f.note}</p>
        </form>
      )}
    </div>
  );
}

// ---------- Form ứng tuyển ----------
const CV_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

export function ApplyForm({
  jobs,
  selected,
  c,
  forms,
}: {
  jobs: { id: number; title: string }[];
  selected?: number;
  c: Dict['careers']['form'];
  forms: Dict['forms'];
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState('');
  const ref = useRef<HTMLFormElement>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const errs: Errors = {};
    if (String(fd.get('name') || '').trim().length < 2) errs.name = forms.nameErr;
    if (!PHONE_RE.test(String(fd.get('phone') || '').trim())) errs.phone = forms.phoneErr;
    const email = String(fd.get('email') || '').trim();
    if (email && !EMAIL_RE.test(email)) errs.email = forms.emailErr;
    const cv = fd.get('cv') as File | null;
    if (cv && cv.size > 0 && (cv.size > 5 * 1024 * 1024 || !CV_TYPES.includes(cv.type))) errs.cv = forms.fileErr;
    if (cv && cv.size === 0) fd.delete('cv');
    if (!fd.get('jobId')) fd.delete('jobId');
    setErrors(errs);
    if (Object.keys(errs).length) {
      setMessage(forms.invalid);
      ref.current?.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`)?.focus();
      return;
    }
    setStatus('sending');
    setMessage('');
    const r = await submit(apiUrl('/applications'), fd, false);
    if (r === 'ok') return setStatus('done');
    setStatus('error');
    setMessage(r === 'rate' ? forms.tooMany : forms.failed);
  }

  return (
    <div className="quote-form" id="apply">
      <h2>{c.title}</h2>
      <p className="quote-form__sub">{c.sub}</p>
      {status === 'done' ? (
        <Success text={forms.success} again={forms.sendAnother} onAgain={() => setStatus('idle')} />
      ) : (
        <form ref={ref} onSubmit={onSubmit} noValidate encType="multipart/form-data">
          <div className="form-grid">
            <Field name="jobId" label={c.position} full requiredLabel={forms.required}>
              <select {...inputProps('jobId', errors)} key={selected} defaultValue={selected ? String(selected) : ''}>
                <option value="">{c.general}</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field name="name" label={c.name} error={errors.name} required requiredLabel={forms.required}>
              <input {...inputProps('name', errors)} autoComplete="name" required maxLength={100} />
            </Field>
            <Field name="phone" label={c.phone} error={errors.phone} required requiredLabel={forms.required}>
              <input {...inputProps('phone', errors)} type="tel" autoComplete="tel" required maxLength={20} />
            </Field>
            <Field name="email" label={c.email} error={errors.email} full requiredLabel={forms.required}>
              <input {...inputProps('email', errors)} type="email" autoComplete="email" maxLength={150} />
            </Field>
            <Field name="message" label={c.message} full requiredLabel={forms.required}>
              <textarea {...inputProps('message', errors)} rows={4} placeholder={c.messagePh} maxLength={3000} />
            </Field>
            <Field name="cv" label={c.cv} error={errors.cv} full requiredLabel={forms.required}>
              <input {...inputProps('cv', errors)} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
            </Field>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
          </div>
          {message && (
            <p className="form-error" role="alert">
              {message}
            </p>
          )}
          <button className="btn btn--primary btn--lg" type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? forms.sending : c.submit} <Icon name="arrow" />
          </button>
        </form>
      )}
    </div>
  );
}
