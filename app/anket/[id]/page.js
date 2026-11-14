import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import PollWidget from '@/components/PollWidget';

export const revalidate = 60;
export function generateStaticParams() {
    return [];
}

const load = (id) => prisma.poll.findUnique({ where: { id }, select: { id: true, question: true, kind: true, article: { select: { slug: true, title: true, status: true } } } });

export async function generateMetadata({ params }) {
    const id = Number((await params).id);
    const p = Number.isInteger(id) && (await load(id));
    if (!p) return {};
    return { title: `${p.kind === 'tahmin' ? 'Tahmin' : 'Anket'}: ${p.question} | Gazetelerde`, description: 'Oyunuzu verin, okurların ne düşündüğünü görün.', alternates: { canonical: `/anket/${p.id}` } };
}

// Paylaşılabilir anket sayfası
export default async function PollPage({ params }) {
    const id = Number((await params).id);
    const p = Number.isInteger(id) && (await load(id));
    if (!p) notFound();
    return (
        <div className="container" style={{ maxWidth: 720, paddingBlock: 'clamp(32px, 6vw, 72px)' }}>
            <PollWidget pollId={p.id} standalone />
            {p.article?.status === 'PUBLISHED' && <p className="field-hint" style={{ marginTop: 16 }}>İlgili haber: <Link href={`/haber/${p.article.slug}`}>{p.article.title}</Link></p>}
        </div>
    );
}
