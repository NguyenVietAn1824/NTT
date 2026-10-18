import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db';
import { ah, idParam, parse } from '../../lib/http';
import { toTranslationRows, translationsSchema } from '../../lib/i18n';

const router = Router();

const tr = z.object({
  title: z.string().trim().min(3).max(250),
  excerpt: z.string().trim().max(600).default(''),
  body: z.string().max(100_000).default(''),
});

const newsSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang'),
  coverImage: z.string().max(500).nullable().optional(),
  gallery: z.array(z.string().max(500)).max(40).default([]),
  published: z.boolean().default(true),
  publishedAt: z.coerce.date().optional(),
  translations: translationsSchema(tr),
});

const serialize = <T extends { gallery: string }>(n: T) => ({ ...n, gallery: JSON.parse(n.gallery || '[]') as string[] });

router.get(
  '/',
  ah(async (_req, res) => {
    const items = await prisma.news.findMany({
      orderBy: { publishedAt: 'desc' },
      include: { translations: { select: { lang: true, title: true } } },
    });
    res.json({ items });
  }),
);

router.get(
  '/:id',
  ah(async (req, res) => {
    const n = await prisma.news.findUniqueOrThrow({ where: { id: idParam(req) }, include: { translations: true } });
    res.json(serialize(n));
  }),
);

router.post(
  '/',
  ah(async (req, res) => {
    const { translations, gallery, ...data } = parse(newsSchema, req.body);
    const n = await prisma.news.create({
      data: { ...data, gallery: JSON.stringify(gallery), translations: { create: toTranslationRows(translations) } },
      include: { translations: true },
    });
    res.status(201).json(serialize(n));
  }),
);

router.put(
  '/:id',
  ah(async (req, res) => {
    const id = idParam(req);
    const { translations, gallery, ...data } = parse(newsSchema, req.body);
    const n = await prisma.$transaction(async (tx) => {
      await tx.newsTranslation.deleteMany({ where: { newsId: id } });
      return tx.news.update({
        where: { id },
        data: { ...data, gallery: JSON.stringify(gallery), translations: { create: toTranslationRows(translations) } },
        include: { translations: true },
      });
    });
    res.json(serialize(n));
  }),
);

router.delete(
  '/:id',
  ah(async (req, res) => {
    await prisma.news.delete({ where: { id: idParam(req) } });
    res.json({ ok: true });
  }),
);

export default router;
