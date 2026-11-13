import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canModerate } from '@/lib/permissions';
import CommentModeration from '@/components/admin/CommentModeration';

export const metadata = { title: 'Yorumlar | Yönetim' };

export default async function AdminComments({ searchParams }) {
    await requirePageUser(canModerate);
    const sp = await searchParams;
    const status = sp.durum === 'HIDDEN' ? 'HIDDEN' : sp.durum === 'VISIBLE' ? 'VISIBLE' : undefined;
    const q = String(sp.q || '').trim().slice(0, 100);

    const where = { ...(status ? { status } : {}), ...(q ? { text: { contains: q, mode: 'insensitive' } } : {}) };
    const [rows, counts] = await Promise.all([
        prisma.comment.findMany({
            where, orderBy: { createdAt: 'desc' }, take: 100,
            select: {
                id: true, text: true, status: true, createdAt: true,
                user: { select: { name: true, email: true } },
                article: { select: { title: true, slug: true } },
            },
        }),
        prisma.comment.groupBy({ by: ['status'], _count: true }),
    ]);
    const c = (s) => (s ? counts.find((x) => x.status === s)?._count ?? 0 : counts.reduce((n, x) => n + x._count, 0));

    const comments = rows.map((r) => ({
        id: r.id, text: r.text, status: r.status, createdAt: r.createdAt.toISOString(),
        user: r.user.name, email: r.user.email, articleTitle: r.article.title, articleSlug: r.article.slug,
    }));

    return (
        <>
            <header className="admin-header">
                <div><h1>Yorumlar</h1><p>Gizlenen yorumlar sitede görünmez; istediğiniz zaman tekrar yayına alabilirsiniz.</p></div>
            </header>
            <div className="admin-toolbar">
                <nav className="admin-tabs">
                    {[[undefined, 'Tümü'], ['VISIBLE', 'Yayında'], ['HIDDEN', 'Gizli']].map(([s, label]) => (
                        <Link key={label} href={`/admin/yorumlar${s ? `?durum=${s}` : ''}`} className={`admin-tab ${status === s ? 'active' : ''}`}>
                            {label}<span className="count">{c(s)}</span>
                        </Link>
                    ))}
                </nav>
                <form className="admin-search" action="/admin/yorumlar">
                    {status && <input type="hidden" name="durum" value={status} />}
                    <input className="admin-input" type="search" name="q" defaultValue={q} placeholder="Yorumlarda ara..." aria-label="Yorumlarda ara" />
                </form>
            </div>
            <CommentModeration initial={comments} />
        </>
    );
}
