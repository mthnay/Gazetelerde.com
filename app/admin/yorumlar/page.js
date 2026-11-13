import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canModerate } from '@/lib/permissions';
import CommentModeration from '@/components/admin/CommentModeration';

export const metadata = { title: 'Yorumlar | Yönetim' };

export default async function AdminComments({ searchParams }) {
    await requirePageUser(canModerate);
    const sp = await searchParams;
    const status = ['HIDDEN', 'VISIBLE', 'REPORTED'].includes(sp.durum) ? sp.durum : undefined;
    const q = String(sp.q || '').trim().slice(0, 100);

    const filter = status === 'REPORTED' ? { reportCount: { gt: 0 } } : status ? { status } : {};
    const where = { ...filter, ...(q ? { text: { contains: q, mode: 'insensitive' } } : {}) };
    const [rows, counts, reported] = await Promise.all([
        prisma.comment.findMany({
            where, orderBy: status === 'REPORTED' ? [{ reportCount: 'desc' }, { createdAt: 'desc' }] : { createdAt: 'desc' }, take: 100,
            select: {
                id: true, text: true, status: true, createdAt: true, reportCount: true, parentId: true,
                reports: { select: { reason: true }, where: { reason: { not: '' } }, take: 3 },
                user: { select: { name: true, email: true } },
                article: { select: { title: true, slug: true } },
            },
        }),
        prisma.comment.groupBy({ by: ['status'], _count: true }),
        prisma.comment.count({ where: { reportCount: { gt: 0 } } }),
    ]);
    const c = (s) => (s === 'REPORTED' ? reported : s ? counts.find((x) => x.status === s)?._count ?? 0 : counts.reduce((n, x) => n + x._count, 0));

    const comments = rows.map((r) => ({
        id: r.id, text: r.text, status: r.status, createdAt: r.createdAt.toISOString(),
        user: r.user.name, email: r.user.email, articleTitle: r.article.title, articleSlug: r.article.slug,
        reportCount: r.reportCount, isReply: !!r.parentId, reasons: r.reports.map((x) => x.reason),
    }));

    return (
        <>
            <header className="admin-header">
                <div><h1>Yorumlar</h1><p>Gizlenen yorumlar sitede görünmez. 3 farklı kullanıcının şikayet ettiği yorumlar otomatik gizlenir; uygunsa tekrar yayına alabilirsiniz.</p></div>
            </header>
            <div className="admin-toolbar">
                <nav className="admin-tabs">
                    {[[undefined, 'Tümü'], ['REPORTED', 'Şikayet edilen'], ['VISIBLE', 'Yayında'], ['HIDDEN', 'Gizli']].map(([s, label]) => (
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
