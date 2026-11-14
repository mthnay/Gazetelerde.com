// Haber veri katmanı (yalnızca sunucuda kullanılır).
import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/db';

const published = () => ({ status: 'PUBLISHED', publishedAt: { lte: new Date() } });

const cardSelect = {
    id: true, slug: true, title: true, summary: true, image: true, featured: true, publishedAt: true,
    authorName: true,
    author: { select: { name: true, slug: true } },
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
        author: a.authorName || a.author?.name || 'Gazetelerde',
        // Görünen ad elle değiştirildiyse (ör. ajans) yazar sayfasına bağlanmaz
        authorSlug: !a.authorName && a.author?.slug ? a.author.slug : null,
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

export async function getLatestNews({ take = 30, skip = 0, category, tag, authorId } = {}) {
    const rows = await prisma.article.findMany({
        where: {
            ...published(),
            ...(category ? { category: { slug: category } } : {}),
            ...(tag ? { tags: { some: { tag: { slug: tag } } } } : {}),
            ...(authorId ? { authorId, authorName: null } : {}),
        },
        orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
        take,
        skip,
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
        select: { ...cardSelect, imageCredit: true, content: true, sourceUrl: true, layout: true, categoryId: true, updatedAt: true, _count: { select: { likes: true } }, tags: { select: { tag: { select: { slug: true, name: true } } } } },
    });
    if (!a) return null;
    return { ...toCard(a), imageCredit: a.imageCredit, content: a.content, sourceUrl: a.sourceUrl, layout: a.layout, categoryId: a.categoryId, updatedAt: a.updatedAt.toISOString(), likeCount: a._count.likes, tags: a.tags.map((t) => t.tag) };
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

// Tam metin arama (Türkçe kök bulma: "voleybolcular" -> "voleybolcu", "maçları" -> "maç").
// Alaka sırası: başlık > özet > metin, yeni haberler hafif öne çekilir. Eşleşme yoksa / çok kısa sorguda
// başlıkta "içeriyor" aramasına düşer (ör. kısaltmalar, yarım kelimeler).
export async function searchNews(query, { take = 20, skip = 0 } = {}) {
    const q = String(query || '').trim().slice(0, 100);
    if (!q) return { items: [], total: 0 };
    const advanced = /["-]|\bor\b/i.test(q);
    const rows = await prisma.$queryRaw`
        SELECT a.id, count(*) OVER()::int AS total,
          ts_headline('simple', regexp_replace(a.summary || ' ' || a.content, '<[^>]+>', ' ', 'g'), qq.query,
            'StartSel=<mark>, StopSel=</mark>, MaxWords=32, MinWords=14, MaxFragments=1') AS snippet
        FROM "Article" a, (
          -- Gelişmiş sözdizimi (tırnak, eksi) yoksa: Türkçe kök eşleşmesi VEYA köklerin önek eşleşmesi (maç:* -> maçları)
          SELECT CASE WHEN ${advanced} OR numnode(plainto_tsquery('turkish', ${q})) = 0
            THEN websearch_to_tsquery('turkish', ${q})
            ELSE websearch_to_tsquery('turkish', ${q}) || to_tsquery('simple', (
              SELECT string_agg(quote_literal(lexeme) || ':*', ' & ') FROM unnest(to_tsvector('turkish', ${q}))))
            END AS query
        ) qq
        WHERE a.search @@ qq.query AND a.status = 'PUBLISHED' AND a."publishedAt" <= now()
        ORDER BY ts_rank_cd(a.search, qq.query) * (1 + 1 / (1 + extract(epoch FROM now() - a."publishedAt") / 604800)) DESC
        LIMIT ${take} OFFSET ${skip}`;
    if (!rows.length && skip === 0) {
        const where = { ...published(), title: { contains: q, mode: 'insensitive' } };
        const [found, total] = await Promise.all([
            prisma.article.findMany({ where, orderBy: { publishedAt: 'desc' }, take, select: cardSelect }),
            prisma.article.count({ where }),
        ]);
        return { items: found.map(toCard), total };
    }
    const cards = await prisma.article.findMany({ where: { id: { in: rows.map((r) => r.id) } }, select: cardSelect });
    const byId = new Map(cards.map((c) => [c.id, toCard(c)]));
    return {
        total: rows[0]?.total ?? 0,
        // Vurgu yalnızca <mark> içerebilir; geri kalan HTML kaçırılır
        items: rows.map((r) => byId.get(r.id) && { ...byId.get(r.id), snippet: safeSnippet(r.snippet) }).filter(Boolean),
    };
}

const safeSnippet = (s = '') => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/&lt;mark&gt;/g, '<mark>').replace(/&lt;\/mark&gt;/g, '</mark>')
    .replace(/\s+/g, ' ').trim();

export const getTag = cache((slug) =>
    prisma.tag.findUnique({ where: { slug }, select: { id: true, slug: true, name: true, description: true } })
);

// Öne çıkan konular (ana sayfa / menü şeridi); yoksa son 7 günün en çok kullanılan etiketleri
export async function getTrendingTags(take = 10) {
    const featured = await prisma.tag.findMany({ where: { featured: true }, orderBy: { name: 'asc' }, take, select: { slug: true, name: true } });
    if (featured.length >= take) return featured;
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const popular = await prisma.tag.findMany({
        where: { featured: false, articles: { some: { article: { ...published(), publishedAt: { gte: since, lte: new Date() } } } } },
        orderBy: { articles: { _count: 'desc' } }, take: take - featured.length, select: { slug: true, name: true },
    });
    return [...featured, ...popular];
}

// Yazar sayfası
export const getAuthor = cache((slug) =>
    prisma.user.findFirst({
        where: { slug, role: { not: 'READER' } },
        select: { id: true, slug: true, name: true, title: true, bio: true, avatar: true, createdAt: true },
    })
);

export async function getAuthorNews(userId, take = 40) {
    const rows = await prisma.article.findMany({
        where: { ...published(), authorId: userId, authorName: null },
        orderBy: { publishedAt: 'desc' }, take, select: cardSelect,
    });
    return rows.map(toCard);
}
