import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish, canEditArticle } from '@/lib/permissions';
import ArticleForm from '@/components/admin/ArticleForm';

export const metadata = { title: 'Haberi Düzenle | Yönetim' };

export default async function EditArticlePage({ params }) {
    const user = await requirePageUser();
    const { id } = await params;
    const n = Number(id);
    if (!Number.isInteger(n)) notFound();

    const [a, categories] = await Promise.all([
        prisma.article.findUnique({ where: { id: n }, include: { category: { select: { slug: true } } } }),
        prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { slug: true, label: true } }),
    ]);
    if (!a) notFound();
    if (!canEditArticle(user, a)) redirect('/admin/haberler');

    const article = {
        id: a.id, slug: a.slug, title: a.title, summary: a.summary, content: a.content, image: a.image,
        status: a.status, featured: a.featured, authorName: a.authorName, category: a.category.slug,
        publishedAt: a.publishedAt?.toISOString() ?? null,
    };

    return (
        <>
            <header className="admin-header">
                <div>
                    <h1>Haberi Düzenle</h1>
                    <p>Son güncelleme: {a.updatedAt.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })} · {a.viewCount.toLocaleString('tr-TR')} okunma</p>
                </div>
            </header>
            <ArticleForm article={article} categories={categories} canPublish={canPublish(user)} />
        </>
    );
}
