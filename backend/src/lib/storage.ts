// Lớp lưu trữ file. Hai driver cùng một giao diện:
//  - "s3":    object storage chuẩn S3 (Cloudflare R2, AWS S3, MinIO…) — khuyên dùng cho production
//  - "local": ổ đĩa server (backend/storage/) — tiện khi chạy thử
// Key bắt đầu bằng "media/" là ảnh công khai, "cv/" là file riêng tư (chỉ admin tải qua API).
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type GetObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { config } from '../config';

export interface StoredObject {
  body: Readable;
  contentType?: string;
  contentLength?: number; // độ dài phần trả về
  totalSize?: number; // tổng dung lượng file (khi đọc theo Range)
  range?: { start: number; end: number };
  etag?: string;
}

// Đọc một đoạn file (HTTP Range) — cần để tua video
export interface ByteRange {
  start: number;
  end?: number; // tính cả byte cuối
}

export interface Storage {
  readonly driver: 'local' | 's3';
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  // Upload file lớn (video) theo stream, không nạp hết vào RAM
  putFile(key: string, filePath: string, contentType: string): Promise<void>;
  get(key: string, range?: ByteRange): Promise<StoredObject | null>;
  delete(keys: string[]): Promise<void>;
  check(): Promise<void>;
}

const safeKey = (key: string) => {
  const k = path.posix.normalize(key).replace(/^\/+/, '');
  if (k.startsWith('..') || k.includes('/../')) throw new Error('Invalid storage key');
  return k;
};

// ---------- local disk ----------
class LocalStorage implements Storage {
  readonly driver = 'local' as const;
  constructor(private root: string) {}
  private file(key: string) {
    return path.join(this.root, safeKey(key));
  }
  async put(key: string, body: Buffer) {
    const f = this.file(key);
    await fsp.mkdir(path.dirname(f), { recursive: true });
    await fsp.writeFile(f, body);
  }
  async putFile(key: string, filePath: string) {
    const f = this.file(key);
    await fsp.mkdir(path.dirname(f), { recursive: true });
    await fsp.copyFile(filePath, f);
  }
  async get(key: string, range?: ByteRange) {
    const f = this.file(key);
    let st: fs.Stats;
    try {
      st = await fsp.stat(f);
    } catch {
      return null;
    }
    const etag = `"${st.size}-${Math.round(st.mtimeMs)}"`;
    if (!range) return { body: fs.createReadStream(f), contentLength: st.size, totalSize: st.size, etag };
    if (range.start >= st.size) throw Object.assign(new Error('Range not satisfiable'), { status: 416 });
    const end = Math.min(range.end ?? st.size - 1, st.size - 1);
    return {
      body: fs.createReadStream(f, { start: range.start, end }),
      contentLength: end - range.start + 1,
      totalSize: st.size,
      range: { start: range.start, end },
      etag,
    };
  }
  async delete(keys: string[]) {
    await Promise.all(keys.map((k) => fsp.rm(this.file(k), { force: true })));
  }
  async check() {
    await fsp.mkdir(this.root, { recursive: true });
  }
}

// ---------- S3 compatible ----------
class S3Storage implements Storage {
  readonly driver = 's3' as const;
  private client: S3Client;
  constructor(
    private bucket: string,
    opts: { endpoint?: string; region: string; accessKeyId: string; secretAccessKey: string; forcePathStyle: boolean },
    private autoCreate = false,
  ) {
    this.client = new S3Client({
      region: opts.region,
      endpoint: opts.endpoint || undefined,
      forcePathStyle: opts.forcePathStyle,
      credentials: { accessKeyId: opts.accessKeyId, secretAccessKey: opts.secretAccessKey },
    });
  }
  async put(key: string, body: Buffer, contentType: string) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: safeKey(key),
        Body: body,
        ContentType: contentType,
        CacheControl: key.startsWith('media/videos/') ? 'public, max-age=86400, must-revalidate' : key.startsWith('media/') ? 'public, max-age=31536000, immutable' : 'private, no-store',
      }),
    );
  }
  async putFile(key: string, filePath: string, contentType: string) {
    const { size } = await fsp.stat(filePath);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: safeKey(key),
        Body: fs.createReadStream(filePath),
        ContentLength: size,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
  }
  async get(key: string, range?: ByteRange) {
    let out: GetObjectCommandOutput;
    try {
      out = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: safeKey(key), Range: range ? `bytes=${range.start}-${range.end ?? ''}` : undefined }),
      );
    } catch (e) {
      const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) return null;
      if (err.$metadata?.httpStatusCode === 416) throw Object.assign(new Error('Range not satisfiable'), { status: 416 });
      throw e;
    }
    // ContentRange: "bytes 0-1023/49207932"
    const cr = /bytes (\d+)-(\d+)\/(\d+)/.exec(out.ContentRange || '');
    return {
      body: out.Body as Readable,
      contentType: out.ContentType,
      contentLength: out.ContentLength,
      totalSize: cr ? Number(cr[3]) : out.ContentLength,
      range: cr ? { start: Number(cr[1]), end: Number(cr[2]) } : undefined,
      etag: out.ETag,
    };
  }
  async delete(keys: string[]) {
    if (!keys.length) return;
    await this.client.send(new DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects: keys.map((k) => ({ Key: safeKey(k) })), Quiet: true } }));
  }
  async check() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (e) {
      const code = (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      // Token chỉ có quyền đọc/ghi object (VD R2 "Object Read & Write") không được HeadBucket → thử liệt kê 1 object
      if (code === 403) {
        await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, MaxKeys: 1 }));
        return;
      }
      if (code !== 404 || !this.autoCreate) throw e;
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      console.log(`[storage] created bucket "${this.bucket}"`);
    }
  }
}

const s = config.storage;
export const storage: Storage =
  s.driver === 's3'
    ? new S3Storage(
        s.bucket,
        { endpoint: s.endpoint, region: s.region, accessKeyId: s.accessKeyId, secretAccessKey: s.secretAccessKey, forcePathStyle: s.forcePathStyle },
        s.autoCreateBucket,
      )
    : new LocalStorage(path.join(config.storageDir, 'objects'));

// URL công khai của ảnh. Mặc định đi qua backend (/media/...) để URL ổn định khi đổi nhà cung cấp;
// đặt STORAGE_PUBLIC_URL (VD domain CDN của R2) để trình duyệt tải thẳng từ storage.
export const publicUrl = (key: string) => (s.publicUrl ? `${s.publicUrl.replace(/\/$/, '')}/${key}` : `/${key}`);

// Chờ storage sẵn sàng (MinIO có thể khởi động chậm hơn API khi chạy docker compose lần đầu)
export async function waitForStorage(tries = 30, delayMs = 2000) {
  for (let i = 1; ; i++) {
    try {
      return await storage.check();
    } catch (e) {
      if (i >= tries) throw e;
      console.log(`[storage] chưa sẵn sàng, thử lại (${i}/${tries})…`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}
