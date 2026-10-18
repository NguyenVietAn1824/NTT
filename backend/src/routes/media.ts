import type { Request, Response } from 'express';
import { storage, type ByteRange } from '../lib/storage';

const TYPES: Record<string, string> = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  avif: 'image/avif',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

// "bytes=100-200" | "bytes=100-" | "bytes=-500" (500 byte cuối) — chỉ hỗ trợ một đoạn
function parseRange(header: string | undefined): ByteRange | 'suffix' | null {
  const m = header ? /^bytes=(\d*)-(\d*)$/.exec(header.trim()) : null;
  if (!m || (!m[1] && !m[2])) return null;
  if (!m[1]) return 'suffix';
  return { start: Number(m[1]), end: m[2] ? Number(m[2]) : undefined };
}

// Trả ảnh/video từ storage.
// Hỗ trợ HTTP Range để trình duyệt tua video.
export async function mediaHandler(req: Request, res: Response) {
  const key = decodeURIComponent(req.path.slice(1)); // "media/2026/10/...webp"
  if (!/^media\/[\w./-]+$/.test(key) || key.includes('..')) return res.status(400).end();
  const type = TYPES[key.split('.').pop()?.toLowerCase() || ''];
  try {
    let range = parseRange(req.headers.range);
    if (range === 'suffix') {
      // Cần biết tổng dung lượng để tính "N byte cuối"
      const head = await storage.get(key, { start: 0, end: 0 });
      if (!head) return res.status(404).end();
      head.body.destroy();
      const n = Number(/-(\d+)$/.exec(req.headers.range!)![1]);
      range = { start: Math.max(0, (head.totalSize || 0) - n) };
    }
    const obj = await storage.get(key, range || undefined);
    if (!obj) return res.status(404).end();
    if (!range && obj.etag && req.headers['if-none-match'] === obj.etag) {
      obj.body.destroy();
      return res.status(304).end();
    }
    res.setHeader('Content-Type', obj.contentType || type || 'application/octet-stream');
    // Ảnh thư viện có mã ngẫu nhiên trong tên → cache vĩnh viễn. Video/ảnh bìa có tên cố định (có thể bị thay) → cache 1 ngày + kiểm tra ETag.
    res.setHeader('Cache-Control', key.startsWith('media/videos/') ? 'public, max-age=86400, must-revalidate' : 'public, max-age=31536000, immutable');
    res.setHeader('Accept-Ranges', 'bytes');
    if (obj.etag) res.setHeader('ETag', obj.etag);
    if (range && obj.range && obj.totalSize !== undefined) {
      res.status(206);
      res.setHeader('Content-Range', `bytes ${obj.range.start}-${obj.range.end}/${obj.totalSize}`);
    }
    if (obj.contentLength !== undefined) res.setHeader('Content-Length', String(obj.contentLength));
    obj.body.on('error', () => res.destroy());
    obj.body.pipe(res);
  } catch (e) {
    if ((e as { status?: number }).status === 416) return res.status(416).end();
    console.error('[media]', e);
    res.status(502).end();
  }
}
