import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db';
import { ah, idParam, pageParams, parse } from '../../lib/http';

export const QUOTE_STATUSES = ['NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST'] as const;

const router = Router();

const whereFrom = (q: Record<string, unknown>) => {
  const status = typeof q.status === 'string' && (QUOTE_STATUSES as readonly string[]).includes(q.status) ? q.status : undefined;
  const search = typeof q.q === 'string' && q.q.trim() ? q.q.trim() : undefined;
  return {
    ...(status && { status }),
    ...(search && {
      OR: [{ name: { contains: search } }, { phone: { contains: search } }, { company: { contains: search } }, { email: { contains: search } }],
    }),
  };
};

router.get(
  '/',
  ah(async (req, res) => {
    const { page, pageSize, skip, take } = pageParams(req);
    const where = whereFrom(req.query);
    const [items, total] = await Promise.all([
      prisma.quote.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.quote.count({ where }),
    ]);
    res.json({ items, total, page, pageSize });
  }),
);

// Xuất CSV (mở được bằng Excel)
router.get(
  '/export.csv',
  ah(async (req, res) => {
    const items = await prisma.quote.findMany({ where: whereFrom(req.query), orderBy: { createdAt: 'desc' } });
    const cols = ['id', 'createdAt', 'status', 'name', 'company', 'phone', 'email', 'service', 'route', 'message', 'note', 'lang'] as const;
    const cell = (v: unknown) => {
      let s = v instanceof Date ? v.toISOString() : String(v ?? '');
      if (/^[=+\-@]/.test(s)) s = `'${s}`; // chặn CSV injection
      return `"${s.replace(/"/g, '""')}"`;
    };
    const csv = '﻿' + [cols.join(','), ...items.map((q) => cols.map((c) => cell(q[c])).join(','))].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="bao-gia-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  }),
);

router.get(
  '/:id',
  ah(async (req, res) => {
    res.json(await prisma.quote.findUniqueOrThrow({ where: { id: idParam(req) } }));
  }),
);

router.patch(
  '/:id',
  ah(async (req, res) => {
    const data = parse(z.object({ status: z.enum(QUOTE_STATUSES).optional(), note: z.string().max(3000).nullable().optional() }), req.body);
    res.json(await prisma.quote.update({ where: { id: idParam(req) }, data }));
  }),
);

router.delete(
  '/:id',
  ah(async (req, res) => {
    await prisma.quote.delete({ where: { id: idParam(req) } });
    res.json({ ok: true });
  }),
);

export default router;
