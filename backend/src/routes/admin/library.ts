// Quản trị thư viện: video + album ảnh
import fsp from 'fs/promises';
import os from 'os';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../../db';
import { ah, HttpError, idParam, parse } from '../../lib/http';
import { albumPhoto, deleteVideoFiles, serializeVideoAdmin, slugify, storePoster, storeVideoFile } from '../../lib/library';
import { storage } from '../../lib/storage';

// Video ghi tạm ra đĩa rồi stream lên storage (không nạp cả file vào RAM)
const videoUpload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 600 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === 'video') return file.mimetype === 'video/mp4' ? cb(null, true) : cb(new HttpError(400, 'Video phải là file MP4 (H.264)'));
    if (file.fieldname === 'poster') return file.mimetype.startsWith('image/') ? cb(null, true) : cb(new HttpError(400, 'Ảnh bìa phải là file ảnh'));
    cb(new HttpError(400, 'Trường file không hợp lệ'));
  },
});
const fields = videoUpload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'poster', maxCount: 1 },
]);

const bool = z.preprocess((v) => v === true || v === 'true' || v === '1' || v === 'on', z.boolean());
const optDate = z.preprocess((v) => (v ? v : null), z.coerce.date().nullable());

const videoSchema = z.object({
  titleVi: z.string().trim().min(2).max(200),
  titleEn: z.string().trim().max(200).default(''),
  titleJa: z.string().trim().max(200).default(''),
  descVi: z.string().trim().max(2000).default(''),
  descEn: z.string().trim().max(2000).default(''),
  descJa: z.string().trim().max(2000).default(''),
  duration: z.coerce.number().min(0).default(0),
  width: z.coerce.number().int().min(0).default(0),
  height: z.coerce.number().int().min(0).default(0),
  featured: bool.default(false),
  published: bool.default(true),
  sortOrder: z.coerce.number().int().default(0),
  recordedAt: optDate.optional(),
});

type Files = Record<string, Express.Multer.File[] | undefined>;
const cleanup = (files: Files) => Promise.all(Object.values(files).flat().map((f) => f && fsp.rm(f.path, { force: true })));

const router = Router();

// ---------- Videos ----------
router.get(
  '/videos',
  ah(async (_req, res) => {
    const items = await prisma.video.findMany({ orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }] });
    res.json({ items: items.map(serializeVideoAdmin) });
  }),
);

router.post(
  '/videos',
  fields,
  ah(async (req, res) => {
    const files = (req.files || {}) as Files;
    try {
      const data = parse(videoSchema, req.body);
      const video = files.video?.[0];
      if (!video) throw new HttpError(400, 'Chưa chọn file video');
      let slug = slugify(data.titleVi);
      if (await prisma.video.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
      const stored = await storeVideoFile(video.path, slug);
      const posterKey = files.poster?.[0] ? await storePoster(await fsp.readFile(files.poster[0].path), slug) : null;
      if (data.featured) await prisma.video.updateMany({ data: { featured: false } });
      const v = await prisma.video.create({
        data: { ...data, slug, key: stored.key, size: stored.size, posterKey, uploadedById: req.user?.id },
      });
      res.status(201).json({ ...serializeVideoAdmin(v), warning: stored.faststart ? undefined : 'Video chưa tối ưu "faststart" — trình duyệt phải tải hết mới phát.' });
    } finally {
      await cleanup(files);
    }
  }),
);

router.put(
  '/videos/:id',
  fields,
  ah(async (req, res) => {
    const files = (req.files || {}) as Files;
    try {
      const id = idParam(req);
      const old = await prisma.video.findUniqueOrThrow({ where: { id } });
      const data = parse(videoSchema, req.body);
      const patch: Record<string, unknown> = { ...data };
      if (files.video?.[0]) {
        const stored = await storeVideoFile(files.video[0].path, old.slug);
        Object.assign(patch, { key: stored.key, size: stored.size });
      }
      if (files.poster?.[0]) patch.posterKey = await storePoster(await fsp.readFile(files.poster[0].path), old.slug);
      if (data.featured) await prisma.video.updateMany({ where: { id: { not: id } }, data: { featured: false } });
      const v = await prisma.video.update({ where: { id }, data: patch });
      // Xóa file cũ đã bị thay
      const stale = [patch.key && old.key, patch.posterKey && old.posterKey].filter(Boolean) as string[];
      if (stale.length) await storage.delete(stale).catch((e) => console.error('[video:cleanup]', e));
      res.json(serializeVideoAdmin(v));
    } finally {
      await cleanup(files);
    }
  }),
);

router.delete(
  '/videos/:id',
  ah(async (req, res) => {
    const v = await prisma.video.delete({ where: { id: idParam(req) } });
    await deleteVideoFiles(v).catch((e) => console.error('[video:delete]', e));
    res.json({ ok: true });
  }),
);

// ---------- Albums ----------
const albumSchema = z.object({
  titleVi: z.string().trim().min(2).max(200),
  titleEn: z.string().trim().max(200).default(''),
  titleJa: z.string().trim().max(200).default(''),
  date: optDate.optional(),
  published: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
  mediaIds: z.array(z.number().int().positive()).max(300).default([]),
});

const albumInclude = { photos: { orderBy: { sortOrder: 'asc' as const }, include: { media: true } } };

router.get(
  '/albums',
  ah(async (_req, res) => {
    const items = await prisma.album.findMany({ orderBy: [{ sortOrder: 'asc' }, { date: 'desc' }], include: albumInclude });
    res.json({
      items: items.map((a) => ({ ...a, photos: undefined, count: a.photos.length, cover: a.photos[0] ? albumPhoto(a.photos[0].media).thumb : null })),
    });
  }),
);

router.get(
  '/albums/:id',
  ah(async (req, res) => {
    const a = await prisma.album.findUniqueOrThrow({ where: { id: idParam(req) }, include: albumInclude });
    res.json({ ...a, photos: a.photos.map((p) => albumPhoto(p.media)) });
  }),
);

async function saveAlbum(id: number | null, body: unknown) {
  const { mediaIds, ...data } = parse(albumSchema, body);
  const unique = [...new Set(mediaIds)];
  const found = await prisma.media.count({ where: { id: { in: unique } } });
  if (found !== unique.length) throw new HttpError(400, 'Có ảnh không còn tồn tại trong thư viện');
  const photos = { create: unique.map((mediaId, i) => ({ mediaId, sortOrder: i })) };
  return prisma.$transaction(async (tx) => {
    if (id === null) {
      let slug = slugify(data.titleVi);
      if (await tx.album.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
      return tx.album.create({ data: { ...data, slug, photos } });
    }
    await tx.albumPhoto.deleteMany({ where: { albumId: id } });
    return tx.album.update({ where: { id }, data: { ...data, photos } });
  });
}

router.post(
  '/albums',
  ah(async (req, res) => {
    res.status(201).json(await saveAlbum(null, req.body));
  }),
);

router.put(
  '/albums/:id',
  ah(async (req, res) => {
    res.json(await saveAlbum(idParam(req), req.body));
  }),
);

router.delete(
  '/albums/:id',
  ah(async (req, res) => {
    // Chỉ xóa album; ảnh vẫn nằm trong Thư viện ảnh
    await prisma.album.delete({ where: { id: idParam(req) } });
    res.json({ ok: true });
  }),
);

export default router;
