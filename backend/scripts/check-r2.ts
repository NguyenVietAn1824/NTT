// Kiểm tra kết nối kho S3/R2: ghi → đọc → đọc theo Range → xóa một file thử.
//   npx tsx scripts/check-r2.ts   (đọc R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, S3_ENDPOINT, S3_BUCKET từ ../.env.local)
import { config as load } from 'dotenv';
import path from 'path';
import { DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

load({ path: path.resolve(__dirname, '../../.env.local') });
const endpoint = process.env.S3_ENDPOINT || 'https://181d0f93d4df8cb9abedfc2ec715d05c.r2.cloudflarestorage.com';
const Bucket = process.env.S3_BUCKET || 'ntt';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
if (!accessKeyId || !secretAccessKey) {
  console.error('Thiếu R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY trong .env.local');
  process.exit(1);
}
const s3 = new S3Client({ region: 'auto', endpoint, forcePathStyle: true, credentials: { accessKeyId, secretAccessKey } });

(async () => {
  console.log('endpoint:', endpoint, '| bucket:', Bucket);
  try {
    await s3.send(new HeadBucketCommand({ Bucket }));
    console.log('HeadBucket: ok');
  } catch (e) {
    const code = (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    console.log('HeadBucket:', code, code === 403 ? '(token chỉ có quyền object — app tự dùng ListObjects, bình thường)' : '');
    await s3.send(new ListObjectsV2Command({ Bucket, MaxKeys: 1 }));
    console.log('ListObjects: ok');
  }
  const Key = `media/_check/${Date.now()}.txt`;
  const body = 'NTT R2 check — 0123456789';
  await s3.send(new PutObjectCommand({ Bucket, Key, Body: body, ContentType: 'text/plain; charset=utf-8' }));
  console.log('Put:', Key);
  const got = await (await s3.send(new GetObjectCommand({ Bucket, Key }))).Body!.transformToString();
  console.log('Get:', got === body ? 'nội dung khớp' : `SAI: ${got}`);
  const part = await s3.send(new GetObjectCommand({ Bucket, Key, Range: 'bytes=0-6' }));
  console.log('Range:', part.ContentRange, JSON.stringify(await part.Body!.transformToString()));
  await s3.send(new DeleteObjectCommand({ Bucket, Key }));
  console.log('Delete: ok — R2 hoạt động');
})().catch((e) => {
  console.error('LỖI:', e.name, e.$metadata?.httpStatusCode || '', e.message);
  process.exit(1);
});
