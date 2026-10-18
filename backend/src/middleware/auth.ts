import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { HttpError } from '../lib/http';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const signToken = (u: AuthUser) =>
  jwt.sign({ sub: String(u.id), email: u.email, name: u.name, role: u.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = req.cookies?.[config.cookieName] || (header?.startsWith('Bearer ') ? header.slice(7) : undefined);
  if (!token) return next(new HttpError(401, 'Unauthorized'));
  try {
    const p = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    req.user = { id: Number(p.sub), email: p.email, name: p.name, role: p.role };
    next();
  } catch {
    next(new HttpError(401, 'Session expired'));
  }
}

export const requireRole =
  (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction) =>
    req.user && roles.includes(req.user.role) ? next() : next(new HttpError(403, 'Forbidden'));
