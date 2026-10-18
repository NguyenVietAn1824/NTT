// Dữ liệu không phụ thuộc ngôn ngữ: liên hệ, số liệu, hình ảnh.
export const site = {
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://nttvietnam.vn',
  phones: [
    { display: '0982 059 111', intl: '+84982059111' },
    { display: '0908 688 336', intl: '+84908688336' },
  ],
  emails: ['director2015@nttvietnam.vn', 'ntt20101984@gmail.com'],
  zalo: 'https://zalo.me/0982059111',
  regNo: '0106860975',
  transportLicense: '7756/GPKDVT',
  founded: 2015,
  mapEmbed:
    'https://maps.google.com/maps?q=FLC%20Landmark%20265%20C%E1%BA%A7u%20Gi%E1%BA%A5y%20H%C3%A0%20N%E1%BB%99i&z=16&output=embed',
};

// Số liệu KPI (key khớp với nhãn `stats` trong file ngôn ngữ)
export const stats = [
  { key: 'years', value: 10, suffix: '+' },
  { key: 'trucks', value: 100, suffix: '' },
  { key: 'warehouse', value: 50000, suffix: '' },
  { key: 'shipments', value: 24000, suffix: '' },
  { key: 'clients', value: 130, suffix: '' },
  { key: 'centers', value: 5, suffix: '' },
] as const;

// Đội xe (nguồn: trang Dịch vụ vận tải)
export const fleet = [
  { key: 't35', count: 20, load: 3.5 },
  { key: 't5', count: 25, load: 5 },
  { key: 't8', count: 15, load: 8 },
  { key: 't15', count: 30, load: 15 },
] as const;

export const partners = [
  { name: 'Canon Electronics Vietnam', img: 'canon.jpg' },
  { name: 'Ricoh', img: 'ricoh.jpg' },
  { name: 'OJI', img: 'oji.jpg' },
  { name: 'Kanepackage Vietnam', img: 'kanepackage.jpg' },
  { name: 'Hanel Plastics', img: 'hanel.jpg' },
  { name: 'Miki Caretech Vietnam', img: 'miki.jpg' },
  { name: 'Trung Sơn Corp', img: 'trung-son.jpg' },
  { name: 'Partner', img: 'partner-sk.jpg' },
  { name: 'Partner', img: 'partner-t.jpg' },
];

export const serviceMeta: Record<string, { img: string; icon: IconName }> = {
  'dich-vu-van-tai': { img: '/img/services/van-tai.png', icon: 'truck' },
  'kho-van-phan-phoi': { img: '/img/services/kho-van.jpg', icon: 'warehouse' },
  'san-pham-carton': { img: '/img/services/carton.png', icon: 'box' },
  'hoat-dong-thuong-mai': { img: '/img/services/thuong-mai.jpg', icon: 'handshake' },
};

import type { IconName } from '@/components/Icon';
