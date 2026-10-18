// Chuyển Thư viện (video + album ảnh) từ website cũ nttvietnam.vn sang hệ thống mới.
//   npm run library:import [-- --intro duong-dan/video-gioi-thieu.mp4]
// Chạy lại nhiều lần an toàn: video/album đã có (theo slug) sẽ bỏ qua; ảnh đã có trong thư viện (cùng tên) được dùng lại.
import 'dotenv/config';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { prisma } from '../src/db';
import { storePoster, storeVideoFile } from '../src/lib/library';
import { storeImage } from '../src/lib/media';
import { waitForStorage } from '../src/lib/storage';

const OLD = process.env.OLD_SITE_URL || 'https://nttvietnam.vn';
const TMP = path.join(os.tmpdir(), 'ntt-import');

type VideoDef = {
  slug: string;
  file?: string; // đường dẫn trên web cũ
  thumb?: string;
  title: [string, string, string];
  desc: [string, string, string];
  duration: number;
  width: number;
  height: number;
  featured?: boolean;
  sortOrder: number;
  recordedAt?: string;
};

const INTRO: VideoDef = {
  slug: 'ntt-viet-nam-muoi-nam-mot-hanh-trinh',
  title: ['NTT Việt Nam — Mười năm, một hành trình', 'NTT Vietnam — Ten years, one journey', 'NTTベトナム — 10年の歩み'],
  desc: [
    'Phim giới thiệu chặng đường 10 năm phát triển, năng lực vận hành và những giá trị cốt lõi làm nên thương hiệu NTT Việt Nam.',
    'A film about NTT Vietnam’s ten-year journey, its operating capabilities and the core values behind the brand.',
    'NTTベトナムの10年の歩み、運営体制、そしてブランドを支える価値観を紹介する映像です。',
  ],
  duration: 402.1,
  width: 854,
  height: 480,
  featured: true,
  sortOrder: 0,
};

const VIDEOS: VideoDef[] = [
  {
    slug: 'le-ky-niem-10-nam-khat-vong-vuon-xa',
    file: '/storage/uploads/files/video-1-6-file.mp4',
    thumb: '/storage/uploads/noidung/thumb/video-1-0.jpg',
    title: ['Lễ kỷ niệm 10 năm “Khát vọng vươn xa” – Hạ Long 2025', '10th anniversary “Aspiration to Reach Further” – Ha Long 2025', '創立10周年記念式典「さらなる高みへ」– ハロン 2025'],
    desc: [
      'Những khoảnh khắc đáng nhớ của tập thể NTT tại lễ kỷ niệm 10 năm thành lập, ngày 19/7/2025 tại Hạ Long.',
      'Memorable moments of the NTT team at the 10th anniversary celebration in Ha Long on July 19, 2025.',
      '2025年7月19日、ハロンで開催された創立10周年記念式典でのNTTメンバーの思い出の瞬間。',
    ],
    duration: 51.3,
    width: 1920,
    height: 1080,
    sortOrder: 1,
    recordedAt: '2025-07-19T18:00:00+07:00',
  },
  {
    slug: 'doan-xe-ntt-logistics-lan-banh',
    file: '/storage/uploads/files/cac-xe-di-chuyen-vao-kho-32-file.mp4',
    thumb: '/storage/uploads/noidung/thumb/cac-xe-di-chuyen-vao-kho-0.jpg',
    title: ['Đoàn xe NTT Logistics lăn bánh', 'NTT Logistics fleet on the move', '出発するNTT Logisticsの車両'],
    desc: [
      'Đoàn xe tải mang nhận diện NTT Logistics nối đuôi nhau xuất phát, sẵn sàng cho những chuyến hàng mới.',
      'NTT Logistics trucks set off one after another, ready for new deliveries.',
      'NTT Logisticsのトラックが次々と出発し、新たな配送に向かいます。',
    ],
    duration: 46.1,
    width: 768,
    height: 576,
    sortOrder: 2,
  },
  {
    slug: 'doi-xe-ntt-tai-kho-hang',
    file: '/storage/uploads/files/chao-mung-50-nam-giai-phong-84-file.mp4',
    thumb: '/storage/uploads/noidung/thumb/chao-mung-50-nam-giai-phong-0.png',
    title: ['Đội xe NTT tại kho hàng', 'NTT fleet at the warehouse', '倉庫でのNTT車両'],
    desc: [
      'Xe tải NTT ra vào khu kho, đội xe xếp hàng ngay ngắn trước dock nhận hàng.',
      'NTT trucks moving in and out of the warehouse, with the fleet lined up at the loading docks.',
      '倉庫に出入りするNTTのトラックと、荷受けドック前に整列した車両。',
    ],
    duration: 30.65,
    width: 1018,
    height: 576,
    sortOrder: 3,
  },
];

const ALBUM = {
  slug: 'ky-niem-10-nam-khat-vong-vuon-xa',
  title: ['Kỷ niệm 10 năm “Khát vọng vươn xa” – Hạ Long', '10th anniversary “Aspiration to Reach Further” – Ha Long', '創立10周年「さらなる高みへ」– ハロン'],
  date: '2025-07-19T18:00:00+07:00',
  // Ảnh tập thể lên đầu (làm ảnh bìa)
  photos: [10, 12, 13, 14, 11, 3, 4, 5, 1, 6, 8, 9, 0],
  alts: {
    10: 'Tập thể NTT chụp ảnh lưu niệm trước phông sự kiện 10 năm',
    12: 'Cán bộ nhân viên NTT trên sân khấu lễ kỷ niệm 10 năm',
    13: 'Tập thể NTT trên sân khấu “Khát vọng vươn xa”',
    14: 'Ảnh tập thể NTT tại lễ kỷ niệm 10 năm, Hạ Long 2025',
    11: 'Gia đình NTT chụp ảnh chung tại lễ kỷ niệm 10 năm',
    3: 'Hội trường lễ kỷ niệm 10 năm NTT tại Hạ Long',
    4: 'Sân khấu lễ kỷ niệm 10 năm NTT',
    5: 'Bàn tiệc gala lễ kỷ niệm 10 năm NTT',
    1: 'Phông sự kiện 10 năm NTT ngoài trời',
    6: 'Hoa chúc mừng trước phông sự kiện 10 năm',
    8: 'Lẵng hoa chúc mừng 10 năm thành lập NTT',
    9: 'Hoa chúc mừng trên sân khấu lễ kỷ niệm',
    0: 'Lẵng hoa chúc mừng 10 năm thành lập NTT',
  } as Record<number, string>,
};

async function download(url: string, dest: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
  return dest;
}

async function importVideo(def: VideoDef, localFile?: string, adminId?: number) {
  if (await prisma.video.findUnique({ where: { slug: def.slug } })) return console.log(`= video đã có: ${def.slug}`);
  const file = localFile || (await download(OLD + def.file, path.join(TMP, `${def.slug}.mp4`)));
  const stored = await storeVideoFile(file, def.slug);
  const posterKey = def.thumb ? await storePoster(await fs.readFile(await download(OLD + def.thumb, path.join(TMP, `${def.slug}-thumb`))), def.slug) : null;
  await prisma.video.create({
    data: {
      slug: def.slug,
      key: stored.key,
      posterKey,
      size: stored.size,
      titleVi: def.title[0],
      titleEn: def.title[1],
      titleJa: def.title[2],
      descVi: def.desc[0],
      descEn: def.desc[1],
      descJa: def.desc[2],
      duration: def.duration,
      width: def.width,
      height: def.height,
      featured: !!def.featured,
      sortOrder: def.sortOrder,
      recordedAt: def.recordedAt ? new Date(def.recordedAt) : null,
      uploadedById: adminId,
    },
  });
  console.log(`+ video ${def.slug} (${(stored.size / 1024 / 1024).toFixed(1)} MB${stored.faststart ? '' : ', CHƯA faststart'})`);
}

async function main() {
  await fs.mkdir(TMP, { recursive: true });
  await waitForStorage();
  const admin = await prisma.user.findFirst({ orderBy: { id: 'asc' } });

  const introIdx = process.argv.indexOf('--intro');
  if (introIdx > 0) await importVideo(INTRO, process.argv[introIdx + 1], admin?.id);
  for (const v of VIDEOS) await importVideo(v, undefined, admin?.id);

  if (await prisma.album.findUnique({ where: { slug: ALBUM.slug } })) {
    console.log(`= album đã có: ${ALBUM.slug}`);
  } else {
    const mediaIds: number[] = [];
    for (const n of ALBUM.photos) {
      // Ảnh seed cũ tên kn-N.jpg / ảnh web cũ ki-niem-10-nam-N.jpg là cùng một ảnh → dùng lại
      const existing = await prisma.media.findFirst({ where: { filename: { in: [`kn-${n}.jpg`, `ki-niem-10-nam-${n}.jpg`] } } });
      let id = existing?.id;
      if (!id) {
        const buf = await fs.readFile(await download(`${OLD}/storage/uploads/noidung/ki-niem-10-nam-${n}.jpg`, path.join(TMP, `kn-${n}.jpg`)));
        id = (await storeImage(buf, `ki-niem-10-nam-${n}.jpg`, admin?.id)).id;
        console.log(`+ ảnh ki-niem-10-nam-${n}.jpg`);
      }
      const m = await prisma.media.findUniqueOrThrow({ where: { id } });
      if (!m.alt && ALBUM.alts[n]) await prisma.media.update({ where: { id }, data: { alt: ALBUM.alts[n] } });
      mediaIds.push(id);
    }
    await prisma.album.create({
      data: {
        slug: ALBUM.slug,
        titleVi: ALBUM.title[0],
        titleEn: ALBUM.title[1],
        titleJa: ALBUM.title[2],
        date: new Date(ALBUM.date),
        photos: { create: mediaIds.map((mediaId, i) => ({ mediaId, sortOrder: i })) },
      },
    });
    console.log(`+ album ${ALBUM.slug} (${mediaIds.length} ảnh)`);
  }
  await fs.rm(TMP, { recursive: true, force: true });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
