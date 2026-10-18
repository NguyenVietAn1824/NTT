import 'dotenv/config';
import path from 'path';

const required = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
};

const isProd = process.env.NODE_ENV === 'production';
const jwtSecret = required('JWT_SECRET');
if (isProd && (jwtSecret.length < 32 || jwtSecret.startsWith('change-me'))) {
  throw new Error('JWT_SECRET must be a random string of at least 32 characters in production');
}

export const config = {
  port: Number(process.env.PORT || 4000),
  isProd,
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((s) => s.trim()),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: 'ntt_token',
  // Cookie chỉ gửi qua HTTPS. Đặt COOKIE_SECURE=false khi chạy thử bằng http://IP
  cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProd,
  storageDir: path.resolve(__dirname, '..', 'storage'),
  storage: {
    driver: (process.env.STORAGE_DRIVER === 's3' ? 's3' : 'local') as 'local' | 's3',
    bucket: process.env.S3_BUCKET || 'ntt-media',
    endpoint: process.env.S3_ENDPOINT || '',
    region: process.env.S3_REGION || 'auto',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
    publicUrl: process.env.STORAGE_PUBLIC_URL || '',
    autoCreateBucket: process.env.S3_AUTO_CREATE_BUCKET === 'true',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'NTT Logistics <no-reply@nttvietnam.vn>',
    notify: process.env.NOTIFY_EMAIL || '',
  },
};

export const LANGS = ['vi', 'en', 'ja'] as const;
export type Lang = (typeof LANGS)[number];
export const isLang = (v: unknown): v is Lang => typeof v === 'string' && (LANGS as readonly string[]).includes(v);
