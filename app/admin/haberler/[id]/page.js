import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish, canEditArticle } from '@/lib/permissions';
import ArticleStudio from '@/components/admin/ArticleStudio';

export const metadata = { title: 'Haberi Düzenle | Yönetim' };

export default async function EditArticlePage({ params }) {
    const user = await requirePageUser();
    const { id } = await params;
    const n = Number(id);
    if (!Number.isInteger(n)) notFound();

    const [a, categories] = await Promise.all([
        prisma.article.findUnique({ where: { id: n }, include: { category: { select: { slug: true } }, tags: { select: { tag: { select: { name: true } } } } } }),
        prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { slug: true, label: true } }),
    ]);
    if (!a) notFound();
    if (!canEditArticle(user, a)) redirect('/admin/haberler');

    const article = {
        id: a.id, slug: a.slug, title: a.title, summary: a.summary, content: a.content, image: a.image,
        status: a.status, featured: a.featured, breaking: a.breaking, sourceUrl: a.sourceUrl, layout: a.layout, updatedAt: a.updatedAt.toISOString(), authorName: a.authorName, category: a.category.slug,
        publishedAt: a.publishedAt?.toISOString() ?? null,
        tags: a.tags.map((t) => t.tag.name),
    };

    return (
        <>
            <ArticleStudio article={article} categories={categories} canPublish={canPublish(user)} />
        </>
    );
}
