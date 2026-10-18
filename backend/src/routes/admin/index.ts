import { Router } from 'express';
import { prisma } from '../../db';
import { ah } from '../../lib/http';
import { requireAuth } from '../../middleware/auth';
import applications from './applications';
import jobs from './jobs';
import library from './library';
import media from './media';
import news from './news';
import quotes from './quotes';

const router = Router();
router.use(requireAuth);

// Số liệu cho dashboard
router.get(
  '/stats',
  ah(async (_req, res) => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [newQuotes, quotes30d, quotesByStatus, newApplications, activeJobs, publishedNews, recentQuotes, mediaCount] = await Promise.all([
      prisma.quote.count({ where: { status: 'NEW' } }),
      prisma.quote.count({ where: { createdAt: { gte: since } } }),
      prisma.quote.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.application.count({ where: { status: 'NEW' } }),
      prisma.job.count({ where: { active: true } }),
      prisma.news.count({ where: { published: true } }),
      prisma.quote.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.media.count(),
    ]);
    res.json({
      newQuotes,
      quotes30d,
      quotesByStatus: Object.fromEntries(quotesByStatus.map((g) => [g.status, g._count._all])),
      newApplications,
      activeJobs,
      publishedNews,
      recentQuotes,
      mediaCount,
    });
  }),
);


router.use('/quotes', quotes);
router.use('/news', news);
router.use('/jobs', jobs);
router.use('/applications', applications);
router.use('/media', media);
router.use('/', library); // /videos, /albums

export default router;
