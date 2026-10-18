const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  // Upload video lớn đi qua rewrite /api → backend: nới thời gian chờ (mặc định 30s)
  experimental: { proxyTimeout: 15 * 60 * 1000 },
  // Trình duyệt gọi /api/* và /media/* cùng origin → Next chuyển tiếp sang backend (ảnh đọc từ MinIO/S3).
  // Nhờ vậy cookie đăng nhập admin là first-party, không cần CORS.
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` },
      { source: '/media/:path*', destination: `${BACKEND_URL}/media/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
