import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish, canEditArticle, STATUS_LABELS } from '@/lib/permissions';
import { formatShortDate } from '@/lib/format';
import ArticleRowActions from '@/components/admin/ArticleRowActions';

export const metadata = { title: 'Haberler | Yönetim' };
const PAGE_SIZE = 20;

export default async function AdminArticles({ searchParams }) {
    const user = await requirePageUser();
    const sp = await searchParams;
    const status = ['PUBLISHED', 'DRAFT', 'ARCHIVED'].includes(sp.durum) ? sp.durum : undefined;
    const q = String(sp.q || '').trim().slice(0, 100);
    const page = Math.max(1, Number(sp.sayfa) || 1);

    const scope = canPublish(user) ? {} : { authorId: user.id };
    const where = {
        ...scope,
        ...(status ? { status } : {}),
        ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
    };

    const [rows, total, counts] = await Promise.all([
        prisma.article.findMany({
            where, orderBy: [{ updatedAt: 'desc' }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
            select: {
                id: true, slug: true, title: true, status: true, publishedAt: true, updatedAt: true, viewCount: true, featured: true, authorId: true,
                authorName: true, author: { select: { name: true } }, category: { select: { label: true } },
                _count: { select: { comments: true } },
            },
        }),
        prisma.article.count({ where }),
        prisma.article.groupBy({ by: ['status'], where: scope, _count: true }),
    ]);

    const countOf = (s) => (s ? counts.find((c) => c.status === s)?._count ?? 0 : counts.reduce((n, c) => n + c._count, 0));
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const href = (o) => {
        const p = new URLSearchParams();
        const v = { durum: status, q, sayfa: undefined, ...o };
        Object.entries(v).forEach(([k, val]) => val && p.set(k, val));
        const s = p.toString();
        return `/admin/haberler${s ? `?${s}` : ''}`;
    };
    const now = new Date();

    return (
        <>
            <header className="admin-header">
                <div>
                    <h1>Haberler</h1>
                    <p>{canPublish(user) ? 'Tüm haberler' : 'Yazdığınız haberler — yayınlamak için editör onayı gerekir'}</p>
                </div>
                <Link href="/admin/haberler/yeni" className="admin-btn primary"><PlusCircle size={16} /> Yeni Haber</Link>
            </header>

            <div className="admin-toolbar">
                <nav className="admin-tabs">
                    {[undefined, 'PUBLISHED', 'DRAFT', 'ARCHIVED'].map((s) => (
                        <Link key={s || 'all'} href={href({ durum: s })} className={`admin-tab ${status === s ? 'active' : ''}`}>
                            {s ? STATUS_LABELS[s] : 'Tümü'}<span className="count">{countOf(s)}</span>
                        </Link>
                    ))}
                </nav>
                <form className="admin-search" action="/admin/haberler">
                    {status && <input type="hidden" name="durum" value={status} />}
                    <input className="admin-input" type="search" name="q" defaultValue={q} placeholder="Başlıkta ara..." aria-label="Başlıkta ara" />
                </form>
            </div>

            <div className="admin-panel" style={{ padding: 0 }}>
                {rows.length === 0 ? <p className="admin-empty">Haber bulunamadı.</p> : (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr><th>Başlık</th><th>Kategori</th><th>Yazar</th><th>Durum</th><th>Tarih</th><th>Okunma</th><th></th></tr>
                            </thead>
                            <tbody>
                                {rows.map((a) => {
                                    const scheduled = a.status === 'PUBLISHED' && a.publishedAt > now;
                                    const editable = canEditArticle(user, a);
                                    return (
                                        <tr key={a.id}>
                                            <td className="title-cell">
                                                {editable ? <Link href={`/admin/haberler/${a.id}`}>{a.title}</Link> : a.title}
                                                {a.featured && <span className="badge" style={{ marginLeft: 8 }}>Manşet</span>}
                                            </td>
                                            <td className="muted">{a.category.label}</td>
                                            <td className="muted">{a.author?.name || a.authorName || '—'}</td>
                                            <td><span className={`badge ${scheduled ? 'SCHEDULED' : a.status}`}>{scheduled ? 'Zamanlandı' : STATUS_LABELS[a.status]}</span></td>
                                            <td className="muted">{formatShortDate(a.publishedAt || a.updatedAt)}</td>
                                            <td className="muted">{a.viewCount.toLocaleString('tr-TR')} · {a._count.comments} yorum</td>
                                            <td><ArticleRowActions article={{ id: a.id, slug: a.slug, status: a.status, title: a.title }} canEdit={editable} /></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {pages > 1 && (
                <div className="admin-toolbar" style={{ justifyContent: 'center', marginTop: 16 }}>
                    {page > 1 && <Link className="admin-btn" href={href({ sayfa: page - 1 })}>← Önceki</Link>}
                    <span className="muted" style={{ color: 'var(--text-muted)' }}>Sayfa {page} / {pages}</span>
                    {page < pages && <Link className="admin-btn" href={href({ sayfa: page + 1 })}>Sonraki →</Link>}
                </div>
            )}
        </>
    );
}
