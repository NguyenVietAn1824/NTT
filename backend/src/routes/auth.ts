import bcrypt from 'bcryptjs';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { config } from '../config';
import { prisma } from '../db';
import { ah, HttpError, parse } from '../lib/http';
import { requireAuth, signToken } from '../middleware/auth';

const router = Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false });

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: config.cookieSecure,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.post(
  '/login',
  loginLimiter,
  ah(async (req, res) => {
    const { email, password } = parse(z.object({ email: z.string().email(), password: z.string().min(1) }), req.body);
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new HttpError(401, 'Invalid email or password');
    const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
    res.cookie(config.cookieName, signToken(payload), cookieOpts);
    res.json({ user: payload });
  }),
);

router.post('/logout', (_req, res) => {
  res.clearCookie(config.cookieName, { ...cookieOpts, maxAge: undefined });
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Token ngắn hạn để trình duyệt upload thẳng lên API (khi frontend chạy trên Vercel — Vercel giới hạn ~4,5MB/request)
router.get('/upload-token', requireAuth, (req, res) => {
  const u = req.user!;
  res.json({ token: jwt.sign({ sub: String(u.id), email: u.email, name: u.name, role: u.role }, config.jwtSecret, { expiresIn: '1h' }) });
});

router.post(
  '/change-password',
  requireAuth,
  ah(async (req, res) => {
    const { current, next } = parse(z.object({ current: z.string(), next: z.string().min(8) }), req.body);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    if (!(await bcrypt.compare(current, user.passwordHash))) throw new HttpError(400, 'Current password is incorrect');
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 12) } });
    res.json({ ok: true });
  }),
);

export default router;
