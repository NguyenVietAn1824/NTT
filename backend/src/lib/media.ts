// Xử lý ảnh upload: chuẩn hóa sang WebP, xoay theo EXIF, bỏ metadata (GPS…), tạo nhiều kích cỡ.
import crypto from 'crypto';
import sharp from 'sharp';
import type { Media } from '@prisma/client';
import { prisma } from '../db';
import { publicUrl, storage } from './storage';

export const WIDTHS = [400, 800, 1600] as const;
const MAX_WIDTH = 2400;

export interface Variant {
  w: number;
  h: number;
  key: string;
  size: number;
}

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'image';

export async function storeImage(input: Buffer, originalName: string, uploadedById?: number): Promise<Media> {
  const img = sharp(input, { failOn: 'error', animated: false }).rotate();
  const meta = await img.metadata();
  if (!meta.width || !meta.height) throw new Error('Unreadable image');
  // Kích thước thật sau khi xoay theo EXIF
  const swap = (meta.orientation || 1) >= 5;
  const srcW = swap ? meta.height : meta.width;

  const now = new Date();
  const base = `media/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${crypto.randomBytes(5).toString('hex')}-${slugify(originalName)}`;

  // Các mốc nhỏ hơn ảnh gốc + một bản lớn nhất (≤ 2400px)
  const top = Math.min(srcW, MAX_WIDTH);
  const widths = [...new Set([...WIDTHS.filter((w) => w < top), top])];

  const variants: Variant[] = [];
  for (const w of widths) {
    const { data, info } = await img
      .clone()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: w <= 400 ? 76 : 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    const key = `${base}-${w}.webp`;
    await storage.put(key, data, 'image/webp');
    variants.push({ w: info.width, h: info.height, key, size: info.size });
  }

  const largest = variants[variants.length - 1];
  return prisma.media.create({
    data: {
      key: largest.key,
      filename: originalName.slice(0, 200),
      mime: 'image/webp',
      width: largest.w,
      height: largest.h,
      size: variants.reduce((a, v) => a + v.size, 0),
      originalSize: input.length,
      variants: JSON.stringify(variants),
      alt: '',
      uploadedById,
    },
  });
}

export const parseVariants = (m: Pick<Media, 'variants'>): Variant[] => {
  try {
    return JSON.parse(m.variants) as Variant[];
  } catch {
    return [];
  }
};

// Dữ liệu trả cho client
export const serializeMedia = (m: Media) => {
  const variants = parseVariants(m);
  return {
    id: m.id,
    url: publicUrl(m.key),
    filename: m.filename,
    alt: m.alt,
    width: m.width,
    height: m.height,
    size: m.size,
    originalSize: m.originalSize,
    createdAt: m.createdAt,
    variants: variants.map((v) => ({ w: v.w, h: v.h, url: publicUrl(v.key), size: v.size })),
    thumb: publicUrl((variants[0] || { key: m.key }).key),
  };
};

// Các bài viết đang dùng ảnh (ảnh đại diện, thư viện ảnh hoặc chèn trong nội dung)
export async function mediaUsage(m: Media) {
  const urls = parseVariants(m).map((v) => publicUrl(v.key));
  if (!urls.length) urls.push(publicUrl(m.key));
  const or = urls.flatMap((u) => [
    { coverImage: u },
    { gallery: { contains: u } },
    { translations: { some: { body: { contains: u } } } },
  ]);
  const news = await prisma.news.findMany({
    where: { OR: or },
    select: { id: true, slug: true, translations: { where: { lang: 'vi' }, select: { title: true } } },
  });
  const albums = await prisma.album.findMany({ where: { photos: { some: { mediaId: m.id } } }, select: { id: true, titleVi: true } });
  return [
    ...news.map((n) => ({ type: 'news' as const, id: n.id, slug: n.slug, title: n.translations[0]?.title || n.slug })),
    ...albums.map((a) => ({ type: 'album' as const, id: a.id, slug: '', title: a.titleVi })),
  ];
}

export async function deleteMediaFiles(m: Media) {
  await storage.delete(parseVariants(m).map((v) => v.key));
}
