// API công khai cho website
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../db';
import { ah, HttpError, parse } from '../lib/http';
import { langOf, pickTranslation } from '../lib/i18n';
import { notify } from '../lib/mailer';
import { cvUpload, storeCv } from '../lib/upload';
import { serializeAlbum, serializeVideo } from '../lib/library';

const router = Router();

// Chống spam form: 5 lần / 10 phút / IP
const formLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many requests, please try again later' } });

const phone = z.string().trim().min(8).max(20).regex(/^[+\d\s().-]+$/, 'Invalid phone number');
const optStr = (max: number) => z.string().trim().max(max).optional().transform((v) => v || undefined);

// ---------- Quotes ----------
const quoteSchema = z.object({
  name: z.string().trim().min(2).max(100),
  company: optStr(150),
  phone,
  email: z.string().trim().email().max(150).optional().or(z.literal('').transform(() => undefined)),
  service: optStr(100),
  route: optStr(200),
  message: optStr(3000),
  lang: z.enum(['vi', 'en', 'ja']).default('vi'),
  website: z.string().optional(), // honeypot — người thật để trống
});

router.post(
  '/quotes',
  formLimiter,
  ah(async (req, res) => {
    const { website, ...data } = parse(quoteSchema, req.body);
    if (website) return res.status(201).json({ ok: true }); // bot: giả vờ thành công
    const quote = await prisma.quote.create({ data: { ...data, ip: req.ip } });
    void notify(`[Báo giá #${quote.id}] ${data.name} — ${data.service || 'Chưa chọn dịch vụ'}`, {
      'Họ tên': data.name,
      'Công ty': data.company,
      'Điện thoại': data.phone,
      Email: data.email,
      'Dịch vụ': data.service,
      'Tuyến / địa điểm': data.route,
      'Nội dung': data.message,
      'Ngôn ngữ': data.lang,
    });
    res.status(201).json({ ok: true, id: quote.id });
  }),
);

// ---------- News ----------
const parseGallery = (g: string): string[] => {
  try {
    const v = JSON.parse(g);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

router.get(
  '/news',
  ah(async (req, res) => {
    const lang = langOf(req.query.lang);
    const limit = Math.min(50, Number(req.query.limit) || 12);
    const items = await prisma.news.findMany({
      where: { published: true, publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: { translations: true },
    });
    res.json({
      items: items.map((n) => {
        const t = pickTranslation(n.translations, lang)!;
        return { slug: n.slug, coverImage: n.coverImage, publishedAt: n.publishedAt, title: t.title, excerpt: t.excerpt };
      }),
    });
  }),
);

router.get(
  '/news/:slug',
  ah(async (req, res) => {
    const lang = langOf(req.query.lang);
    const n = await prisma.news.findFirst({
      where: { slug: req.params.slug, published: true, publishedAt: { lte: new Date() } },
      include: { translations: true },
    });
    if (!n) throw new HttpError(404, 'Not found');
    const t = pickTranslation(n.translations, lang)!;
    res.json({
      slug: n.slug,
      coverImage: n.coverImage,
      gallery: parseGallery(n.gallery),
      publishedAt: n.publishedAt,
      title: t.title,
      excerpt: t.excerpt,
      body: t.body,
      lang: t.lang,
    });
  }),
);

// ---------- Jobs ----------
router.get(
  '/jobs',
  ah(async (req, res) => {
    const lang = langOf(req.query.lang);
    const jobs = await prisma.job.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: { translations: true },
    });
    res.json({
      items: jobs.map((j) => {
        const t = pickTranslation(j.translations, lang)!;
        return { id: j.id, icon: j.icon, openings: j.openings, title: t.title, location: t.location, description: t.description };
      }),
    });
  }),
);

// ---------- Thư viện (video + album ảnh) ----------
router.get(
  '/library',
  ah(async (req, res) => {
    const lang = langOf(req.query.lang);
    const [videos, albums] = await Promise.all([
      prisma.video.findMany({ where: { published: true }, orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }] }),
      prisma.album.findMany({
        where: { published: true },
        orderBy: [{ sortOrder: 'asc' }, { date: 'desc' }],
        include: { photos: { orderBy: { sortOrder: 'asc' }, include: { media: true } } },
      }),
    ]);
    res.json({ videos: videos.map((v) => serializeVideo(v, lang)), albums: albums.map((a) => serializeAlbum(a, lang)) });
  }),
);

router.get(
  '/videos/featured',
  ah(async (req, res) => {
    const v = await prisma.video.findFirst({ where: { published: true, featured: true } });
    res.json({ video: v ? serializeVideo(v, langOf(req.query.lang)) : null });
  }),
);

// ---------- Applications (multipart: cv tùy chọn) ----------
const applicationSchema = z.object({
  jobId: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(2).max(100),
  phone,
  email: z.string().trim().email().max(150).optional().or(z.literal('').transform(() => undefined)),
  message: optStr(3000),
  website: z.string().optional(),
});

router.post(
  '/applications',
  formLimiter,
  cvUpload.single('cv'),
  ah(async (req, res) => {
    const { website, jobId, ...data } = parse(applicationSchema, req.body);
    if (website) return res.status(201).json({ ok: true });
    const job = jobId ? await prisma.job.findFirst({ where: { id: jobId, active: true }, include: { translations: { where: { lang: 'vi' } } } }) : null;
    const cvFile = req.file ? await storeCv(req.file) : undefined;
    const app = await prisma.application.create({
      data: { ...data, jobId: job?.id, cvFile, cvName: req.file?.originalname },
    });
    void notify(`[Ứng tuyển #${app.id}] ${data.name} — ${job?.translations[0]?.title || 'Ứng tuyển chung'}`, {
      'Họ tên': data.name,
      'Điện thoại': data.phone,
      Email: data.email,
      'Vị trí': job?.translations[0]?.title,
      'Lời nhắn': data.message,
      CV: req.file ? `${req.file.originalname} (tải trong trang quản trị)` : 'Không đính kèm',
    });
    res.status(201).json({ ok: true, id: app.id });
  }),
);

export default router;
