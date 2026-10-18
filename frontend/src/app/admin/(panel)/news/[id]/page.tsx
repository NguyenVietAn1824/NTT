import { notFound } from 'next/navigation';
import NewsEditor from '@/components/admin/NewsEditor';

export default function EditNewsPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <NewsEditor id={id} />;
}
