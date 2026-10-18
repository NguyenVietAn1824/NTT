import { notFound } from 'next/navigation';

// Mọi đường dẫn không khớp trong một ngôn ngữ → trang 404 có header/footer
export default function CatchAll() {
  notFound();
}
