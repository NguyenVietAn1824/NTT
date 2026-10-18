// Thư viện: video công ty + album ảnh
import crypto from 'crypto';
import fsp from 'fs/promises';
import sharp from 'sharp';
import type { Album, AlbumPhoto, Media, Video } from '@prisma/client';
import type { Lang } from '../config';
import { HttpError } from './http';
import { parseVariants } from './media';
import { publicUrl, storage } from './storage';

export const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'video';

// Kiểm tra file là MP4 và có "faststart" (moov trước mdat) để trình duyệt phát ngay
export async function inspectMp4(filePath: string) {
  const fh = await fsp.open(filePath, 'r');
  try {
    const head = Buffer.alloc(4 * 1024 * 1024);
    const { bytesRead } = await fh.read(head, 0, head.length, 0);
    const buf = head.subarray(0, bytesRead);
    if (buf.subarray(4, 8).toString() !== 'ftyp') throw new HttpError(400, 'File không phải video MP4');
    const moov = buf.indexOf('moov');
    const mdat = buf.indexOf('mdat');
    const codec = ['avc1', 'hvc1', 'hev1', 'av01'].find((c) => buf.includes(c)) || 'unknown';
    return { faststart: moov > 0 && (mdat < 0 || moov < mdat), codec };
  } finally {
    await fh.close();
  }
}

const newBase = (slug: string) => `media/videos/${crypto.randomBytes(4).toString('hex')}-${slug}`;

export async function storeVideoFile(filePath: string, slug: string) {
  const info = await inspectMp4(filePath);
  const key = `${newBase(slug)}.mp4`;
  await storage.putFile(key, filePath, 'video/mp4');
  const { size } = await fsp.stat(filePath);
  return { key, size, ...info };
}

export async function storePoster(input: Buffer, slug: string) {
  const webp = await sharp(input, { failOn: 'error' }).rotate().resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const key = `${newBase(slug)}-poster.webp`;
  await storage.put(key, webp, 'image/webp');
  return key;
}

const pick = <T extends Record<string, unknown>>(row: T, base: string, lang: Lang) =>
  (row[`${base}${lang === 'vi' ? 'Vi' : lang === 'en' ? 'En' : 'Ja'}`] as string) || (row[`${base}Vi`] as string) || '';

export const serializeVideo = (v: Video, lang: Lang) => ({
  id: v.id,
  slug: v.slug,
  title: pick(v, 'title', lang),
  description: pick(v, 'desc', lang),
  url: publicUrl(v.key),
  poster: v.posterKey ? publicUrl(v.posterKey) : null,
  duration: v.duration,
  width: v.width,
  height: v.height,
  featured: v.featured,
  recordedAt: v.recordedAt,
});

export const serializeVideoAdmin = (v: Video) => ({
  ...v,
  url: publicUrl(v.key),
  poster: v.posterKey ? publicUrl(v.posterKey) : null,
});

type AlbumFull = Album & { photos: (AlbumPhoto & { media: Media })[] };

export const albumPhoto = (m: Media) => {
  const variants = parseVariants(m);
  return {
    id: m.id,
    url: publicUrl(m.key),
    thumb: publicUrl((variants.find((v) => v.w >= 800) || variants[variants.length - 1] || { key: m.key }).key),
    width: m.width,
    height: m.height,
    alt: m.alt,
  };
};

export const serializeAlbum = (a: AlbumFull, lang: Lang) => ({
  id: a.id,
  slug: a.slug,
  title: pick(a, 'title', lang),
  date: a.date,
  photos: a.photos.map((p) => albumPhoto(p.media)),
});

export async function deleteVideoFiles(v: Pick<Video, 'key' | 'posterKey'>) {
  await storage.delete([v.key, ...(v.posterKey ? [v.posterKey] : [])]);
}
