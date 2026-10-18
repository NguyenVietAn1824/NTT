// Thư viện ảnh
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db';
import { ah, HttpError, idParam, pageParams, parse } from '../../lib/http';
import { deleteMediaFiles, mediaUsage, serializeMedia, storeImage } from '../../lib/media';
import { imageUpload } from '../../lib/upload';

const router = Router();

router.get(
  '/',
  ah(async (req, res) => {
    const { page, pageSize, skip, take } = pageParams(req);
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const where = q ? { OR: [{ filename: { contains: q } }, { alt: { contains: q } }] } : {};
    const [items, total, agg] = await Promise.all([
      prisma.media.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.media.count({ where }),
      prisma.media.aggregate({ _sum: { size: true, originalSize: true }, _count: true }),
    ]);
    res.json({
      items: items.map(serializeMedia),
      total,
      page,
      pageSize,
      stats: { count: agg._count, storedBytes: agg._sum.size || 0, originalBytes: agg._sum.originalSize || 0 },
    });
  }),
);

// Upload nhiều ảnh một lúc (field "files")
router.post(
  '/',
  imageUpload.array('files', 20),
  ah(async (req, res) => {
    const files = (req.files as Express.Multer.File[] | undefined) || [];
    if (!files.length) throw new HttpError(400, 'Chưa chọn ảnh');
    const created = [];
    const failed: { filename: string; error: string }[] = [];
    for (const f of files) {
      try {
        created.push(serializeMedia(await storeImage(f.buffer, f.originalname, req.user?.id)));
      } catch (e) {
        console.error('[media]', f.originalname, e);
        failed.push({ filename: f.originalname, error: 'Không đọc được ảnh' });
      }
    }
    res.status(created.length ? 201 : 400).json({ items: created, failed });
  }),
);

router.get(
  '/:id',
  ah(async (req, res) => {
    const m = await prisma.media.findUniqueOrThrow({ where: { id: idParam(req) }, include: { uploadedBy: { select: { name: true } } } });
    res.json({ ...serializeMedia(m), uploadedBy: m.uploadedBy?.name || null, usage: await mediaUsage(m) });
  }),
);

router.patch(
  '/:id',
  ah(async (req, res) => {
    const data = parse(z.object({ alt: z.string().trim().max(300) }), req.body);
    res.json(serializeMedia(await prisma.media.update({ where: { id: idParam(req) }, data })));
  }),
);

// Không cho xóa ảnh đang được bài viết sử dụng (trừ khi ?force=1)
router.delete(
  '/:id',
  ah(async (req, res) => {
    const m = await prisma.media.findUniqueOrThrow({ where: { id: idParam(req) } });
    const usage = await mediaUsage(m);
    if (usage.length && req.query.force !== '1') throw new HttpError(409, 'Ảnh đang được sử dụng', { usage });
    await prisma.media.delete({ where: { id: m.id } });
    await deleteMediaFiles(m);
    res.json({ ok: true });
  }),
);

export default router;
