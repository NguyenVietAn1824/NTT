// Dữ liệu ban đầu: tài khoản admin, tin tức và vị trí tuyển dụng (lấy từ website cũ).
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/db';
import { storeImage } from '../src/lib/media';
import { publicUrl, waitForStorage } from '../src/lib/storage';

// Ảnh mẫu được nạp vào thư viện ảnh (storage) — mỗi file chỉ nạp một lần
const imageCache = new Map<string, string>();
const ALTS: Record<string, string> = {
  '10-nam.jpg': 'Phông sự kiện kỷ niệm 10 năm NTT “Khát vọng vươn xa”',
  'mo-rong.jpg': 'Đội xe tải Isuzu của NTT Logistics',
  'le-ban-giao-xe-isuzu-thang-long.jpg': 'Lễ bàn giao xe Isuzu Thăng Long – NTT Việt Nam: đại diện hai bên trao chìa khóa trước dàn xe tải Isuzu mới',
  'kn-0.jpg': 'Lẵng hoa chúc mừng 10 năm thành lập NTT',
  'kn-1.jpg': 'Phông sự kiện 10 năm NTT ngoài trời',
  'kn-3.jpg': 'Hội trường lễ kỷ niệm 10 năm NTT tại Hạ Long',
  'kn-4.jpg': 'Sân khấu lễ kỷ niệm 10 năm NTT',
  'kn-5.jpg': 'Bàn tiệc gala lễ kỷ niệm 10 năm NTT',
  'kn-6.jpg': 'Hoa chúc mừng trước phông sự kiện 10 năm',
};
async function seedImage(file: string, uploadedById: number): Promise<string> {
  if (imageCache.has(file)) return imageCache.get(file)!;
  const buf = await fs.readFile(path.join(__dirname, 'seed-images', file));
  const m = await storeImage(buf, file, uploadedById);
  if (ALTS[file]) await prisma.media.update({ where: { id: m.id }, data: { alt: ALTS[file] } });
  const url = publicUrl(m.key);
  imageCache.set(file, url);
  return url;
}

type Tr = { title: string; excerpt: string; body: string };

const news: { slug: string; coverImage: string; gallery: string[]; publishedAt: string; tr: Record<'vi' | 'en' | 'ja', Tr> }[] = [
  {
    slug: 'ntt-ky-niem-10-nam-khat-vong-vuon-xa',
    coverImage: '10-nam.jpg',
    gallery: ['kn-1.jpg', 'kn-3.jpg', 'kn-4.jpg', 'kn-5.jpg', 'kn-6.jpg', 'kn-0.jpg'],
    publishedAt: '2025-07-19T09:00:00+07:00',
    tr: {
      vi: {
        title: 'NTT kỷ niệm 10 năm “Khát vọng vươn xa” tại Hạ Long',
        excerpt: 'Ngày 19/7/2025, tại TP. Hạ Long (Quảng Ninh), NTT long trọng tổ chức lễ kỷ niệm 10 năm thành lập với chủ đề “Khát vọng vươn xa”.',
        body: `Ngày **19/7/2025**, tại **TP. Hạ Long (Quảng Ninh)**, NTT long trọng tổ chức lễ kỷ niệm **10 năm thành lập** với chủ đề **“Khát vọng vươn xa”**. Sự kiện đánh dấu một thập kỷ nỗ lực không ngừng, bền bỉ và khát khao đổi mới của NTT.

Chương trình diễn ra trong không khí trang trọng mà ấm áp, với sự tham gia của **Ban lãnh đạo NTT**, các đối tác chiến lược, khách hàng thân thiết và toàn thể cán bộ nhân viên từ các chi nhánh trên cả nước. Đây không chỉ là dịp nhìn lại chặng đường 10 năm, mà còn là dịp để NTT tri ân những đóng góp quý báu của tập thể đã đồng hành và xây dựng thương hiệu như ngày hôm nay.

> 10 năm là một cột mốc quan trọng, đánh dấu sự trưởng thành và khẳng định vị thế của NTT. “Khát vọng vươn xa” không chỉ là khẩu hiệu, mà là kim chỉ nam cho chiến lược phát triển bền vững, đổi mới và mở rộng trong tương lai.
>
> — Đại diện Ban lãnh đạo NTT

Bên cạnh phần nghi lễ, sự kiện còn có nhiều hoạt động ý nghĩa:

- Tổng kết chặng đường 10 năm phát triển
- Vinh danh cá nhân và tập thể có đóng góp xuất sắc
- Giao lưu, kết nối nội bộ
- Gala dinner và chương trình nghệ thuật đặc sắc

Lễ kỷ niệm 10 năm “Khát vọng vươn xa” tại Hạ Long để lại nhiều ấn tượng sâu sắc, tiếp thêm động lực để NTT tiếp tục **bứt phá, đổi mới và chinh phục những cột mốc mới** trên hành trình phía trước.`,
      },
      en: {
        title: 'NTT celebrates its 10th anniversary, “Aspiration to Reach Further”, in Ha Long',
        excerpt: 'On July 19, 2025, in Ha Long City (Quang Ninh), NTT celebrated its 10th anniversary with the theme “Aspiration to Reach Further”.',
        body: `On **July 19, 2025**, in **Ha Long City (Quang Ninh)**, NTT solemnly celebrated its **10th anniversary** with the theme **“Aspiration to Reach Further”**. The event marked a decade of continuous effort, perseverance and a burning desire for innovation.

The program took place in a formal yet warm atmosphere, with **NTT’s leadership**, strategic partners, loyal customers and staff from branches nationwide. It was a chance to look back on the past 10 years and to thank everyone who has helped build the brand into what it is today.

> Ten years is a significant milestone, marking NTT’s growth and establishing its position. “Aspiration to Reach Further” is not just a slogan, but a guiding principle for our sustainable development, innovation and expansion in the future.
>
> — Representative of NTT’s leadership

Besides the ceremony, the event featured many meaningful activities:

- A review of 10 years of development
- Honoring individuals and teams with outstanding contributions
- Internal networking and exchange
- Gala dinner and artistic performances

The celebration in Ha Long left a deep impression and gave NTT fresh motivation to **break through, innovate and conquer new milestones** on the journey ahead.`,
      },
      ja: {
        title: 'NTT、ハロンで創立10周年記念式典「さらなる高みへ」を開催',
        excerpt: '2025年7月19日、NTTはクアンニン省ハロン市にて、「さらなる高みへ」をテーマに創立10周年記念式典を開催しました。',
        body: `**2025年7月19日**、NTTは**クアンニン省ハロン市**にて、**「さらなる高みへ（Khát vọng vươn xa）」**をテーマに**創立10周年記念式典**を盛大に開催しました。本式典は、たゆまぬ努力と挑戦、そして革新への強い思いを重ねてきた10年間の節目となりました。

式典は厳かでありながら温かな雰囲気の中で行われ、**NTT経営陣**をはじめ、戦略的パートナー、長年ご愛顧いただいているお客様、全国の拠点から集まった社員が参加しました。これまでの10年を振り返るとともに、ブランドを共に築いてきたすべての方々へ感謝を伝える機会となりました。

> 10年は、NTTの成長と地位を示す重要な節目です。「さらなる高みへ」は単なるスローガンではなく、持続的な発展、革新、そして今後の事業拡大に向けた指針です。
>
> — NTT経営陣代表

式典では、以下のような催しも行われました。

- 10年間の歩みの振り返り
- 優れた貢献をした個人・チームの表彰
- 社内交流プログラム
- ガラディナーと芸術公演

ハロンでの10周年記念式典は深い感動を残し、NTTがこれからも**変革し、挑戦し、新たな目標を達成していく**ための大きな原動力となりました。`,
      },
    },
  },
  {
    slug: 'ntt-viet-nam-mo-rong-hoat-dong-phia-nam',
    coverImage: 'mo-rong.jpg',
    gallery: [],
    publishedAt: '2026-02-25T09:00:00+07:00',
    tr: {
      vi: {
        title: 'NTT Việt Nam mở rộng hoạt động vào phía Nam',
        excerpt: 'Công ty TNHH Thương mại và Vận tải NTT Việt Nam chính thức triển khai kế hoạch mở rộng hoạt động tại TP. Hồ Chí Minh và Bình Dương.',
        body: `Nhằm đáp ứng nhu cầu ngày càng tăng của khách hàng và hướng tới phát triển bền vững trong giai đoạn mới, **Công ty TNHH Thương mại và Vận tải NTT Việt Nam** chính thức triển khai **kế hoạch mở rộng hoạt động vào phía Nam**, tập trung tại **TP. Hồ Chí Minh và Bình Dương**.

Đây là **bước đi quan trọng trong chiến lược phát triển dài hạn**, khẳng định cam kết nâng cao năng lực vận tải, mở rộng mạng lưới dịch vụ và tăng cường khả năng phục vụ khách hàng tại các vùng kinh tế trọng điểm phía Nam.

## Nâng cao năng lực – tối ưu dịch vụ

TP. Hồ Chí Minh và Bình Dương là các trung tâm công nghiệp, logistics và thương mại lớn của cả nước. Hiện diện mạnh mẽ tại đây giúp NTT Việt Nam:

- Rút ngắn thời gian vận chuyển
- Tối ưu chi phí logistics
- Nâng cao chất lượng dịch vụ và phản hồi nhanh nhu cầu khách hàng

Đồng thời, công ty tiếp tục đầu tư vào **phương tiện vận tải, nhân sự chuyên môn và hệ thống quản lý** để đảm bảo vận hành an toàn, hiệu quả và đúng tiến độ.

## Đồng hành cùng khách hàng và đối tác

Với phương châm **“Uy tín – An toàn – Hiệu quả”**, NTT Việt Nam cam kết cung cấp giải pháp vận tải và thương mại phù hợp từng nhu cầu, đồng hành cùng sự phát triển của khách hàng và đối tác tại khu vực phía Nam.

## Hướng tới phát triển bền vững

Việc mở rộng không chỉ thể hiện năng lực và tầm nhìn của NTT Việt Nam mà còn là nền tảng để hoàn thiện hệ sinh thái dịch vụ, góp phần thúc đẩy logistics và thương mại trong nước. Trong thời gian tới, công ty sẽ tiếp tục đổi mới, nâng cao chất lượng dịch vụ và khẳng định vị thế **đối tác vận tải tin cậy** tại thị trường Việt Nam.`,
      },
      en: {
        title: 'NTT Vietnam expands operations to the south',
        excerpt: 'NTT Vietnam Trading and Transportation Co., Ltd. officially launches its plan to expand southward, focusing on Ho Chi Minh City and Binh Duong.',
        body: `To meet growing customer demand and pursue sustainable development in a new phase, **NTT Vietnam Trading and Transportation Co., Ltd.** has officially launched its **expansion plan to the south**, focusing on **Ho Chi Minh City and Binh Duong province**.

This marks **a significant step in our long-term development strategy**, reaffirming our commitment to stronger transport capacity, a wider service network and better service for customers in southern Vietnam’s key economic regions.

## Enhancing capability, optimizing service

Ho Chi Minh City and Binh Duong are major industrial, logistics and commercial centers. A strong presence there helps NTT Vietnam:

- Reduce shipping time
- Optimize logistics costs
- Improve service quality and respond quickly to customer needs

The company also continues to invest in **vehicles, specialized personnel and management systems** to ensure safe, efficient and on-schedule operations.

## Working alongside customers and partners

With the motto **“Reputation – Safety – Efficiency”**, NTT Vietnam is committed to tailored transport and trading solutions, growing together with customers and partners in the south.

## Toward sustainable development

This expansion demonstrates NTT Vietnam’s capability and vision, and lays the foundation for a more complete service ecosystem. In the coming period, the company will continue to innovate, improve service quality and affirm its position as **a reliable transport partner** in Vietnam.`,
      },
      ja: {
        title: 'NTTベトナム、南部へ事業を拡大',
        excerpt: 'NTTベトナム貿易運輸有限会社は、ホーチミン市およびビンズオン省を中心とした南部への事業拡大計画を正式に開始しました。',
        body: `お客様の増え続けるニーズにお応えし、新たな段階での持続的な成長を目指すため、**NTTベトナム貿易運輸有限会社**は**ホーチミン市およびビンズオン省**を中心とした**南部への事業拡大計画**を正式に開始しました。

本計画は**当社の長期成長戦略における重要な一歩**であり、輸送能力の強化、サービスネットワークの拡大、そして南部主要経済圏のお客様へのサービス向上に対する当社の決意を示すものです。

## 能力の強化とサービスの最適化

ホーチミン市とビンズオン省は、ベトナム有数の工業・物流・商業の中心地です。この地域での体制強化により、NTTベトナムは次のことを実現します。

- 輸送リードタイムの短縮
- 物流コストの最適化
- サービス品質の向上とお客様ニーズへの迅速な対応

同時に、安全・効率的かつ計画どおりの運行を確保するため、**車両、専門人材、管理システム**への投資を継続してまいります。

## お客様・パートナーと共に

**「信頼・安全・効率」**をモットーに、NTTベトナムはお客様一社一社のニーズに合わせた輸送・貿易ソリューションを提供し、南部地域のお客様・パートナーの発展に寄り添ってまいります。

## 持続的な発展に向けて

今回の事業拡大は、当社の能力とビジョンを示すとともに、サービス体制をさらに充実させる基盤となります。今後も革新とサービス品質の向上に努め、ベトナム市場における**信頼される輸送パートナー**としての地位を確立してまいります。`,
      },
    },
  },
  {
    slug: "ntt-le-ban-giao-xe-hanh-trinh-phat-trien-moi",
    coverImage: 'le-ban-giao-xe-isuzu-thang-long.jpg',
    gallery: [],
    publishedAt: '2026-10-14T09:00:00+07:00',
    tr: {
      vi: { title: "NTT tại lễ bàn giao xe cho hành trình phát triển mới", excerpt: "Công ty TNHH Thương mại và Vận tải NTT Việt Nam tiếp nhận lô xe tải Isuzu mới từ Isuzu Thăng Long, tiếp tục nâng cao năng lực đội xe cho chặng đường phát triển tiếp theo.", body: "Tại đại lý **Isuzu Thăng Long**, **Công ty TNHH Thương mại và Vận tải NTT Việt Nam** đã tham dự **lễ bàn giao xe** và chính thức tiếp nhận lô xe tải Isuzu mới. Đây là những phương tiện sẽ đồng hành cùng NTT trên hành trình phát triển mới.\n\nTrong không khí trang trọng, đại diện Isuzu Thăng Long và đại diện NTT Việt Nam đã thực hiện nghi thức trao chìa khóa xe, đánh dấu việc các phương tiện chính thức gia nhập đội xe của NTT Logistics.\n\n## Bổ sung năng lực cho đội xe\n\nLô xe được bàn giao gồm các dòng xe tải Isuzu với nhiều tải trọng, thùng kín mang nhận diện **NTT Logistics**. Các phương tiện mới được bổ sung vào đội xe hiện có, giúp NTT:\n\n- Đáp ứng linh hoạt hơn nhu cầu vận chuyển nội thành, liên tỉnh và hàng công nghiệp\n- Nâng cao chất lượng, độ an toàn và tính đúng giờ của dịch vụ\n- Duy trì đội xe đồng nhất, thuận lợi cho công tác bảo dưỡng định kỳ\n\n## Đối tác tin cậy\n\nIsuzu là thương hiệu xe tải được đánh giá cao về độ bền và hiệu quả vận hành. Việc lựa chọn Isuzu Thăng Long làm đối tác cung cấp phương tiện thể hiện cam kết của NTT trong việc đầu tư nghiêm túc vào **phương tiện đạt chuẩn** cho dịch vụ ổn định, lâu dài.\n\n## Sẵn sàng cho hành trình mới\n\nLễ bàn giao là một bước đi cụ thể trong chiến lược nâng cao năng lực vận tải của NTT, song song với kế hoạch mở rộng hoạt động vào phía Nam. Với phương châm **“Uy tín – An toàn – Hiệu quả”**, NTT Việt Nam tiếp tục đồng hành cùng khách hàng và đối tác trên chặng đường phát triển tiếp theo." },
      en: { title: "NTT at the vehicle handover ceremony for a new journey of growth", excerpt: "NTT Vietnam Trading and Transportation Co., Ltd. took delivery of new Isuzu trucks from Isuzu Thang Long, further strengthening its fleet for the next stage of growth.", body: "At the **Isuzu Thang Long** dealership, **NTT Vietnam Trading and Transportation Co., Ltd.** attended a **vehicle handover ceremony** and officially took delivery of a new batch of Isuzu trucks — vehicles that will accompany NTT on its new journey of growth.\n\nIn a formal atmosphere, representatives of Isuzu Thang Long and NTT Vietnam performed the key handover, marking the vehicles’ official entry into the NTT Logistics fleet.\n\n## Strengthening the fleet\n\nThe handover included Isuzu trucks in a range of load capacities, with box bodies carrying the **NTT Logistics** livery. Added to the existing fleet, the new vehicles help NTT:\n\n- Respond more flexibly to urban, inter-provincial and industrial transport needs\n- Improve service quality, safety and on-time performance\n- Keep a uniform fleet that is easier to maintain on a regular schedule\n\n## A trusted partner\n\nIsuzu is a truck brand highly regarded for durability and operating efficiency. Choosing Isuzu Thang Long as its vehicle partner reflects NTT’s commitment to investing in **qualified vehicles** for stable, long-term service.\n\n## Ready for a new journey\n\nThe handover is a concrete step in NTT’s strategy to strengthen its transport capacity, alongside its plan to expand operations to southern Vietnam. With the motto **“Reputation – Safety – Efficiency”**, NTT Vietnam continues to grow together with its customers and partners." },
      ja: { title: "NTT、新たな成長に向けた車両納車式に出席", excerpt: "NTTベトナム貿易運輸有限会社は、いすゞタンロンより新型いすゞトラックの納車を受け、次の成長段階に向けて車両体制をさらに強化しました。", body: "**NTTベトナム貿易運輸有限会社**は、**いすゞタンロン**の販売拠点にて行われた**車両納車式**に出席し、新たないすゞトラックを正式に受領しました。これらの車両は、NTTの新たな成長の歩みを支えていきます。\n\n厳かな雰囲気の中、いすゞタンロンとNTTベトナムの代表者によるキーの引き渡しが行われ、車両が正式にNTT Logisticsの車両群に加わりました。\n\n## 車両体制の強化\n\n今回納車されたのは、さまざまな積載量のいすゞトラックで、**NTT Logistics**のロゴをまとったバン型車両です。既存の車両群に加わることで、NTTは次のことを実現します。\n\n- 市内配送・省間輸送・工業製品輸送へのより柔軟な対応\n- サービス品質、安全性、定時性の向上\n- 統一された車両構成による定期整備の効率化\n\n## 信頼できるパートナー\n\nいすゞは、耐久性と運行効率に定評のあるトラックブランドです。いすゞタンロンを車両パートナーに選んだことは、安定した長期サービスのために**基準を満たした車両**へ投資するというNTTの姿勢を示しています。\n\n## 新たな歩みに向けて\n\n今回の納車式は、南部への事業拡大計画と並行して進める、輸送能力強化戦略の具体的な一歩です。**「信頼・安全・効率」**をモットーに、NTTベトナムはこれからもお客様・パートナーの皆様とともに成長してまいります。" },
    },
  },
];

const VP = { vi: 'Lô D8, KCN Thăng Long 3, Thiện Kế, Bình Xuyên, Vĩnh Phúc', en: 'Lot D8, Thang Long 3 IP, Thien Ke, Binh Xuyen, Vinh Phuc', ja: 'ビンフック省ビンスエン県ティエンケー、タンロン第3工業団地 D8区画' };

const jobs: { icon: string; tr: Record<'vi' | 'en' | 'ja', { title: string; location: string }> }[] = [
  { icon: 'route', tr: { vi: { title: 'Quản lý vận tải', location: 'Long Biên (Hà Nội), Bắc Ninh, Hải Phòng, Vĩnh Phúc' }, en: { title: 'Transport manager', location: 'Long Bien (Hanoi), Bac Ninh, Hai Phong, Vinh Phuc' }, ja: { title: '輸送管理者', location: 'ハノイ（ロンビエン）、バクニン、ハイフォン、ビンフック' } } },
  { icon: 'box', tr: { vi: { title: 'Nhân viên giao hàng', location: 'Ninh Bình, Vĩnh Phúc, Hải Phòng' }, en: { title: 'Delivery staff', location: 'Ninh Binh, Vinh Phuc, Hai Phong' }, ja: { title: '配送スタッフ', location: 'ニンビン、ビンフック、ハイフォン' } } },
  { icon: 'truck', tr: { vi: { title: 'Lái xe', location: VP.vi }, en: { title: 'Truck driver', location: VP.en }, ja: { title: 'トラックドライバー', location: VP.ja } } },
  { icon: 'warehouse', tr: { vi: { title: 'Công nhân kho bao bì giấy', location: VP.vi }, en: { title: 'Packaging warehouse worker', location: VP.en }, ja: { title: '段ボール倉庫作業員', location: VP.ja } } },
  { icon: 'forklift', tr: { vi: { title: 'Lái xe nâng kho bao bì giấy', location: VP.vi }, en: { title: 'Forklift operator, packaging warehouse', location: VP.en }, ja: { title: 'フォークリフトオペレーター（段ボール倉庫）', location: VP.ja } } },
];

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@nttvietnam.vn').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe@2026';
  await waitForStorage();
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: process.env.ADMIN_NAME || 'Quản trị viên', role: 'ADMIN', passwordHash: await bcrypt.hash(password, 12) },
  });

  for (const n of news) {
    const exists = await prisma.news.findUnique({ where: { slug: n.slug } });
    if (exists) continue;
    const coverImage = await seedImage(n.coverImage, admin.id);
    const gallery = [];
    for (const g of n.gallery) gallery.push(await seedImage(g, admin.id));
    await prisma.news.create({
      data: {
        slug: n.slug,
        coverImage,
        gallery: JSON.stringify(gallery),
        publishedAt: new Date(n.publishedAt),
        translations: { create: (['vi', 'en', 'ja'] as const).map((lang) => ({ lang, ...n.tr[lang] })) },
      },
    });
  }

  if ((await prisma.job.count()) === 0) {
    for (const [i, j] of jobs.entries()) {
      await prisma.job.create({
        data: { icon: j.icon, sortOrder: i, translations: { create: (['vi', 'en', 'ja'] as const).map((lang) => ({ lang, ...j.tr[lang] })) } },
      });
    }
  }

  console.log(`Seed xong. Admin: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
