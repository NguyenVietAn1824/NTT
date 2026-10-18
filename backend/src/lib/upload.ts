import crypto from 'crypto';
import path from 'path';
import multer from 'multer';
import { HttpError } from './http';
import { storage } from './storage';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const CV_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/jpeg': '.jpg',
  'image/png': '.png',
};

// Ảnh: nhận vào RAM rồi xử lý bằng sharp (lib/media.ts). Ảnh điện thoại thường 5–12MB nên cho tới 15MB.
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, cb) =>
    IMAGE_TYPES.includes(file.mimetype) ? cb(null, true) : cb(new HttpError(400, `“${file.originalname}” không phải ảnh JPG, PNG, WEBP, GIF hoặc AVIF`)),
});

// CV ứng viên — lưu vào storage dưới cv/ (riêng tư)
export const cvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => (CV_TYPES[file.mimetype] ? cb(null, true) : cb(new HttpError(400, 'CV must be PDF, DOC, DOCX, JPG or PNG'))),
});

export async function storeCv(file: Express.Multer.File): Promise<string> {
  const ext = CV_TYPES[file.mimetype] || path.extname(file.originalname).toLowerCase();
  const key = `cv/${new Date().toISOString().slice(0, 7)}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  await storage.put(key, file.buffer, file.mimetype);
  return key;
}
