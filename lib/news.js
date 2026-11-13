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

// Son dakika: editörün işaretlediği son 24 saatin haberleri; yoksa en yeni haberler
export async function getBreakingNews(take = 6) {
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const flagged = await prisma.article.findMany({
        where: { ...published(), breaking: true, publishedAt: { gte: since, lte: new Date() } },
        orderBy: { publishedAt: 'desc' }, take, select: cardSelect,
    });
    if (flagged.length) return { flagged: true, items: flagged.map(toCard) };
    return { flagged: false, items: await getLatestNews({ take }) };
}

// Son 30 günde yayınlanan haberler arasında en çok okunanlar
export async function getMostRead(take = 5) {
    const since = new Date(Date.now() - 30 * 864e5);
    const rows = await prisma.article.findMany({
        where: { ...published(), publishedAt: { gte: since, lte: new Date() } },
        orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
        take,
        select: { ...cardSelect, viewCount: true },
    });
    return rows.map((r) => ({ ...toCard(r), views: r.viewCount }));
}

export const getArticleBySlug = cache(async (slug) => {
    const a = await prisma.article.findFirst({
        where: { slug, ...published() },
        select: { ...cardSelect, content: true, sourceUrl: true, layout: true, categoryId: true, updatedAt: true, _count: { select: { likes: true } } },
    });
    if (!a) return null;
    return { ...toCard(a), content: a.content, sourceUrl: a.sourceUrl, layout: a.layout, categoryId: a.categoryId, updatedAt: a.updatedAt.toISOString(), likeCount: a._count.likes };
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
