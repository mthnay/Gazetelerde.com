// Arşiv: tarih bazlı haber listeleri ve dönemlik en çok okunanlar (İstanbul saatine göre)
import 'server-only';
import { prisma } from '@/lib/db';

const pub = () => ({ status: 'PUBLISHED', publishedAt: { lte: new Date() } });
const cardSelect = {
    id: true, slug: true, title: true, summary: true, image: true, publishedAt: true, sponsored: true, format: true, featured: true,
    authorName: true, author: { select: { name: true, slug: true } }, category: { select: { slug: true, label: true } },
};
export const toCard = (a) => ({
    id: a.id, slug: a.slug, title: a.title, summary: a.summary, img: a.image, featured: a.featured, sponsored: a.sponsored, format: a.format,
    publishedAt: a.publishedAt?.toISOString() ?? null, author: a.authorName || a.author?.name || 'Gazetelerde',
    category: a.category.slug, categoryLabel: a.category.label,
});

// İstanbul (UTC+3, yaz saati yok) gün sınırları
const istStart = (y, m, d = 1) => new Date(Date.UTC(y, m - 1, d, -3));

// Yıl/ay bazında haber sayıları
export async function archiveMonths() {
    return prisma.$queryRaw`
        SELECT extract(year FROM "publishedAt" AT TIME ZONE 'Europe/Istanbul')::int AS y,
               extract(month FROM "publishedAt" AT TIME ZONE 'Europe/Istanbul')::int AS m, count(*)::int AS n
        FROM "Article" WHERE status = 'PUBLISHED' AND "publishedAt" <= now()
        GROUP BY 1, 2 ORDER BY 1 DESC, 2 DESC`;
}

// Ayın günlere göre sayıları
export async function archiveDays(y, m) {
    return prisma.$queryRaw`
        SELECT extract(day FROM "publishedAt" AT TIME ZONE 'Europe/Istanbul')::int AS d, count(*)::int AS n
        FROM "Article" WHERE status = 'PUBLISHED' AND "publishedAt" >= ${istStart(y, m)} AND "publishedAt" < ${istStart(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1)} AND "publishedAt" <= now()
        GROUP BY 1 ORDER BY 1`;
}

export async function archiveArticles({ y, m, d }, take = 200) {
    const from = d ? istStart(y, m, d) : istStart(y, m);
    const to = d ? new Date(from.getTime() + 864e5) : istStart(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1);
    const rows = await prisma.article.findMany({
        where: { ...pub(), publishedAt: { gte: from, lt: to, lte: new Date() } },
        orderBy: { publishedAt: 'desc' }, take, select: cardSelect,
    });
    return rows.map(toCard);
}

// Son N günün en çok okunanları (günlük okunma kayıtlarından)
export async function topRead(days, take = 10) {
    const since = new Date(Date.now() - days * 864e5);
    const top = await prisma.articleDailyStat.groupBy({
        by: ['articleId'], where: { day: { gte: since } }, _sum: { views: true }, orderBy: { _sum: { views: 'desc' } }, take: take * 2,
    });
    const rows = await prisma.article.findMany({ where: { id: { in: top.map((t) => t.articleId) }, ...pub() }, select: cardSelect });
    const byId = new Map(rows.map((r) => [r.id, r]));
    return top.map((t) => byId.get(t.articleId) && { ...toCard(byId.get(t.articleId)), views: t._sum.views }).filter(Boolean).slice(0, take);
}
