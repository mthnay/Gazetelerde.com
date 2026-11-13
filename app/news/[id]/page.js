import { notFound, permanentRedirect } from 'next/navigation';
import { prisma } from '@/lib/db';

// Eski /news/<id> adreslerini yeni /haber/<slug> adreslerine yönlendir
export default async function LegacyNewsRedirect({ params }) {
    const { id } = await params;
    const n = Number(id);
    if (!Number.isInteger(n)) notFound();
    const a = await prisma.article.findUnique({ where: { id: n }, select: { slug: true } });
    if (!a) notFound();
    permanentRedirect(`/haber/${a.slug}`);
}
