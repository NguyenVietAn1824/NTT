import type { IconName } from '@/components/Icon';

// Khối nội dung cho trang dịch vụ
export type Block =
  | string
  | { h: string }
  | { ul: string[] }
  | { check: string[] }
  | { grid: { t: string; d?: string; items?: string[] }[] }
  | { fleet: true }
  | { locations: string[] }
  | { quote: string; by: string };

export interface Service {
  slug: string;
  title: string;
  short: string;
  lead: string;
  body: Block[];
  ctaText: string;
}

export interface IconItem {
  icon: IconName;
  t: string;
  d: string;
}
