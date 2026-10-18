import { createApp } from './app';
import { config } from './config';
import { prisma } from './db';
import { storage, waitForStorage } from './lib/storage';

// Kiểm tra kết nối storage trước khi nhận request
waitForStorage()
  .then(() => console.log(`[storage] driver=${storage.driver}${config.storage.driver === 's3' ? ` bucket=${config.storage.bucket} endpoint=${config.storage.endpoint || 'aws'}` : ''}`))
  .catch((e) => {
    console.error('[storage] cannot reach storage:', e?.message || e);
    process.exit(1);
  });

const server = createApp().listen(config.port, () => {
  console.log(`NTT API listening on http://localhost:${config.port}`);
});

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
