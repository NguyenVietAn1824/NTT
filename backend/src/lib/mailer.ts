import nodemailer from 'nodemailer';
import { config } from '../config';

const transport = config.smtp.host
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    })
  : null;

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// Gửi email thông báo nội bộ. Không chặn request nếu gửi lỗi.
export async function notify(subject: string, fields: Record<string, string | null | undefined>) {
  const rows = Object.entries(fields).filter(([, v]) => v);
  if (!transport || !config.smtp.notify) {
    console.info(`[mail:skipped] ${subject}\n${rows.map(([k, v]) => `  ${k}: ${v}`).join('\n')}`);
    return;
  }
  const html = `<h2 style="font-family:sans-serif">${escapeHtml(subject)}</h2><table style="font-family:sans-serif;border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="padding:6px 12px;color:#666">${escapeHtml(k)}</td><td style="padding:6px 12px"><b>${escapeHtml(String(v))}</b></td></tr>`)
    .join('')}</table>`;
  try {
    await transport.sendMail({ from: config.smtp.from, to: config.smtp.notify, subject, html, text: rows.map(([k, v]) => `${k}: ${v}`).join('\n') });
  } catch (err) {
    console.error('[mail:error]', err);
  }
}
