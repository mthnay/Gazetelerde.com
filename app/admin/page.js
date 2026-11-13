import Link from 'next/link';
import { FileText, Eye, MessageSquare, Users, PlusCircle, Mail } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish } from '@/lib/permissions';
import { formatShortDate } from '@/lib/format';

export const metadata = { title: 'Genel Bakış | Yönetim' };

const nf = new Intl.NumberFormat('tr-TR');
const daysAgo = (n) => new Date(Date.now() - n * 864e5);

export default async function AdminDashboard() {
    const user = await requirePageUser();
    const weekAgo = daysAgo(7);
    const mine = canPublish(user) ? {} : { authorId: user.id };

    const [statusCounts, views, users, newUsers, comments, newComments, topArticles, recentComments, drafts, byCategory] = await Promise.all([
        prisma.article.groupBy({ by: ['status'], where: mine, _count: true }),
        prisma.article.aggregate({ where: mine, _sum: { viewCount: true } }),
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.comment.count(),
        prisma.comment.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.article.findMany({
            where: { ...mine, status: 'PUBLISHED' }, orderBy: { viewCount: 'desc' }, take: 5,
            select: { id: true, title: true, slug: true, viewCount: true },
        }),
        prisma.comment.findMany({
            orderBy: { createdAt: 'desc' }, take: 5,
            select: { id: true, text: true, createdAt: true, user: { select: { name: true } }, article: { select: { title: true, slug: true } } },
        }),
        prisma.article.findMany({
            where: { ...mine, status: 'DRAFT' }, orderBy: { updatedAt: 'desc' }, take: 5,
            select: { id: true, title: true, updatedAt: true },
        }),
        prisma.article.groupBy({ by: ['categoryId'], where: { ...mine, status: 'PUBLISHED' }, _sum: { viewCount: true }, _count: true }),
    ]);

    const subscribers = await prisma.subscriber.count({ where: { active: true } });
    const count = (s) => statusCounts.find((x) => x.status === s)?._count ?? 0;
    const categories = await prisma.category.findMany({ select: { id: true, label: true } });
    const catRows = byCategory
        .map((r) => ({ label: categories.find((c) => c.id === r.categoryId)?.label ?? '?', views: r._sum.viewCount ?? 0, n: r._count }))
        .sort((a, b) => b.views - a.views);
    const maxViews = Math.max(1, ...catRows.map((r) => r.views));

    const stats = [
        { icon: FileText, label: 'Yayındaki haber', value: count('PUBLISHED'), sub: `${count('DRAFT')} taslak · ${count('ARCHIVED')} arşiv` },
        { icon: Eye, label: 'Toplam okunma', value: views._sum.viewCount ?? 0, sub: canPublish(user) ? 'tüm haberler' : 'sizin haberleriniz' },
        { icon: MessageSquare, label: 'Yorum', value: comments, sub: `son 7 günde ${newComments}` },
        { icon: Users, label: 'Üye', value: users, sub: `son 7 günde ${newUsers}` },
        { icon: Mail, label: 'Bülten abonesi', value: subscribers, sub: 'aktif abonelik' },
    ];

    return (
        <>
            <header className="admin-header">
                <div>
                    <h1>Hoş geldin, {user.name.split(' ')[0]}</h1>
                    <p>Sitenin güncel durumu</p>
                </div>
                <Link href="/admin/haberler/yeni" className="admin-btn primary"><PlusCircle size={16} /> Yeni Haber</Link>
            </header>

            <div className="admin-stats">
                {stats.map(({ icon: Icon, label, value, sub }) => (
                    <div key={label} className="admin-panel admin-stat">
                        <span className="label"><Icon size={16} /> {label}</span>
                        <span className="value">{nf.format(value)}</span>
                        <span className="sub">{sub}</span>
                    </div>
                ))}
            </div>

            <div className="admin-grid-2" style={{ marginBottom: 16 }}>
                <section className="admin-panel">
                    <h2>En çok okunanlar</h2>
                    {topArticles.length === 0 ? <p className="admin-empty">Henüz yayında haber yok.</p> : (
                        <div className="admin-list">
                            {topArticles.map((a) => (
                                <div key={a.id} className="admin-list-row">
                                    <Link href={`/admin/haberler/${a.id}`}>{a.title}</Link>
                                    <span className="badge">{nf.format(a.viewCount)} okunma</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
                <section className="admin-panel">
                    <h2>Kategorilere göre okunma</h2>
                    <div className="admin-bars">
                        {catRows.map((r) => (
                            <div key={r.label} className="admin-bar-row">
                                <span>{r.label}</span>
                                <div className="admin-bar-track"><div className="admin-bar-fill" style={{ width: `${(r.views / maxViews) * 100}%` }} /></div>
                                <span style={{ textAlign: 'right' }}>{nf.format(r.views)}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div className="admin-grid-2">
                <section className="admin-panel">
                    <h2>Son yorumlar</h2>
                    {recentComments.length === 0 ? <p className="admin-empty">Henüz yorum yok.</p> : (
                        <div className="admin-list">
                            {recentComments.map((c) => (
                                <div key={c.id} className="admin-list-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 4 }}>
                                    <span><strong>{c.user.name}</strong> · <Link href={`/haber/${c.article.slug}#yorumlar`} target="_blank">{c.article.title}</Link></span>
                                    <span style={{ color: 'var(--text-muted)' }}>{c.text.length > 140 ? `${c.text.slice(0, 140)}…` : c.text}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
                <section className="admin-panel">
                    <h2>Bekleyen taslaklar</h2>
                    {drafts.length === 0 ? <p className="admin-empty">Taslak yok.</p> : (
                        <div className="admin-list">
                            {drafts.map((d) => (
                                <div key={d.id} className="admin-list-row">
                                    <Link href={`/admin/haberler/${d.id}`}>{d.title}</Link>
                                    <span className="muted" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatShortDate(d.updatedAt)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}
