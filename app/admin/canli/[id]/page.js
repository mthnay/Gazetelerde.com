import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canEditArticle } from '@/lib/permissions';
import { getLiveEntries } from '@/lib/live';
import { pushEnabled } from '@/lib/push';
import LiveComposer from '@/components/admin/LiveComposer';

export const metadata = { title: 'Canlı anlatım | Yönetim' };
export const dynamic = 'force-dynamic';

export default async function LiveAdmin({ params }) {
    const user = await requirePageUser();
    const id = Number((await params).id);
    const a = Number.isInteger(id) && (await prisma.article.findUnique({ where: { id }, select: { id: true, slug: true, title: true, status: true, live: true, authorId: true } }));
    if (!a) notFound();
    if (!canEditArticle(user, a) && !['EDITOR', 'ADMIN'].includes(user.role)) redirect('/admin/haberler');
    return <LiveComposer article={a} initial={await getLiveEntries(a.id)} canPush={pushEnabled() && a.status === 'PUBLISHED'} />;
}
