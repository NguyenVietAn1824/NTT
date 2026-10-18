import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db';
import { ah, idParam, parse } from '../../lib/http';
import { toTranslationRows, translationsSchema } from '../../lib/i18n';

const router = Router();

export const JOB_ICONS = ['truck', 'route', 'box', 'warehouse', 'forklift', 'users'] as const;

const tr = z.object({
  title: z.string().trim().min(2).max(200),
  location: z.string().trim().min(2).max(300),
  description: z.string().max(10_000).nullable().optional(),
});

const jobSchema = z.object({
  icon: z.enum(JOB_ICONS).default('truck'),
  openings: z.coerce.number().int().min(1).max(999).default(1),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
  translations: translationsSchema(tr),
});

router.get(
  '/',
  ah(async (_req, res) => {
    const items = await prisma.job.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: { translations: true, _count: { select: { applications: true } } },
    });
    res.json({ items });
  }),
);

router.get(
  '/:id',
  ah(async (req, res) => {
    res.json(await prisma.job.findUniqueOrThrow({ where: { id: idParam(req) }, include: { translations: true } }));
  }),
);

router.post(
  '/',
  ah(async (req, res) => {
    const { translations, ...data } = parse(jobSchema, req.body);
    const job = await prisma.job.create({ data: { ...data, translations: { create: toTranslationRows(translations) } }, include: { translations: true } });
    res.status(201).json(job);
  }),
);

router.put(
  '/:id',
  ah(async (req, res) => {
    const id = idParam(req);
    const { translations, ...data } = parse(jobSchema, req.body);
    const job = await prisma.$transaction(async (tx) => {
      await tx.jobTranslation.deleteMany({ where: { jobId: id } });
      return tx.job.update({ where: { id }, data: { ...data, translations: { create: toTranslationRows(translations) } }, include: { translations: true } });
    });
    res.json(job);
  }),
);

router.delete(
  '/:id',
  ah(async (req, res) => {
    await prisma.job.delete({ where: { id: idParam(req) } });
    res.json({ ok: true });
  }),
);

export default router;
