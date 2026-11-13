// Haber veri katmanı (yalnızca sunucuda kullanılır).
import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/db';

const published = () => ({ status: 'PUBLISHED', publishedAt: { lte: new Date() } });

const cardSelect = {
    id: true, slug: true, title: true, summary: true, image: true, featured: true, publishedAt: true,
    authorName: true,
    author: { select: { name: true } },
    category: { select: { slug: true, label: true } },
};

// Bileşenlerin beklediği düz yapıya çevir
function toCard(a) {
    return {
        id: a.id,
        slug: a.slug,
        title: a.title,
        summary: a.summary,
        img: a.image,
        featured: a.featured,
        publishedAt: a.publishedAt?.toISOString() ?? null,
        author: a.author?.name || a.authorName || 'Gazetelerde',
        category: a.category.slug,
        categoryLabel: a.category.label,
    };
}

export const getCategories = cache(() =>
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { slug: true, label: true, description: true } })
);

export const getCategory = cache((slug) =>
    prisma.category.findUnique({ where: { slug }, select: { slug: true, label: true, description: true } })
);

export async function getLatestNews({ take = 30, category } = {}) {
    const rows = await prisma.article.findMany({
        where: { ...published(), ...(category ? { category: { slug: category } } : {}) },
        orderBy: { publishedAt: 'desc' },
        take,
        select: cardSelect,
    });
    return rows.map(toCard);
}

export async function getMostRead(take = 5) {
    const rows = await prisma.article.findMany({
        where: published(),
        orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
        take,
        select: cardSelect,
    });
    return rows.map(toCard);
}

export const getArticleBySlug = cache(async (slug) => {
    const a = await prisma.article.findFirst({
        where: { slug, ...published() },
        select: { ...cardSelect, content: true, categoryId: true, _count: { select: { likes: true } } },
    });
    if (!a) return null;
    return { ...toCard(a), content: a.content, categoryId: a.categoryId, likeCount: a._count.likes };
});

export async function getRelatedNews(article, take = 3) {
    const rows = await prisma.article.findMany({
        where: { ...published(), categoryId: article.categoryId, id: { not: article.id } },
        orderBy: { publishedAt: 'desc' },
        take,
        select: cardSelect,
    });
    return rows.map(toCard);
}

export async function searchNews(query, take = 30) {
    const q = String(query || '').trim();
    if (!q) return [];
    const rows = await prisma.article.findMany({
        where: {
            ...published(),
            OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { summary: { contains: q, mode: 'insensitive' } },
                { content: { contains: q, mode: 'insensitive' } },
            ],
        },
        orderBy: { publishedAt: 'desc' },
        take,
        select: cardSelect,
    });
    return rows.map(toCard);
}

export async function incrementViews(id) {
    await prisma.article.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => { });
}
