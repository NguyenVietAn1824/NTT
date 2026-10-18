import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db';
import { ah, HttpError, idParam, pageParams, parse } from '../../lib/http';
import { storage } from '../../lib/storage';

export const APPLICATION_STATUSES = ['NEW', 'REVIEWING', 'INTERVIEW', 'HIRED', 'REJECTED'] as const;

const router = Router();

router.get(
  '/',
  ah(async (req, res) => {
    const { page, pageSize, skip, take } = pageParams(req);
    const status = typeof req.query.status === 'string' && (APPLICATION_STATUSES as readonly string[]).includes(req.query.status) ? req.query.status : undefined;
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { job: { include: { translations: { where: { lang: 'vi' }, select: { title: true } } } } },
      }),
      prisma.application.count({ where }),
    ]);
    res.json({
      items: items.map(({ job, ...a }) => ({ ...a, jobTitle: job?.translations[0]?.title ?? null })),
      total,
      page,
      pageSize,
    });
  }),
);

router.patch(
  '/:id',
  ah(async (req, res) => {
    const data = parse(z.object({ status: z.enum(APPLICATION_STATUSES) }), req.body);
    res.json(await prisma.application.update({ where: { id: idParam(req) }, data }));
  }),
);

// Tải CV — chỉ admin
router.get(
  '/:id/cv',
  ah(async (req, res) => {
    const a = await prisma.application.findUniqueOrThrow({ where: { id: idParam(req) } });
    const obj = a.cvFile ? await storage.get(a.cvFile) : null;
    if (!obj) throw new HttpError(404, 'No CV');
    const name = a.cvName || a.cvFile!.split('/').pop()!;
    res.setHeader('Content-Type', obj.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(name)}`);
    res.setHeader('Cache-Control', 'private, no-store');
    if (obj.contentLength) res.setHeader('Content-Length', String(obj.contentLength));
    obj.body.pipe(res);
  }),
);

router.delete(
  '/:id',
  ah(async (req, res) => {
    const a = await prisma.application.delete({ where: { id: idParam(req) } });
    if (a.cvFile) await storage.delete([a.cvFile]).catch((e) => console.error('[cv:delete]', e));
    res.json({ ok: true });
  }),
);

export default router;
