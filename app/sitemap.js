import { prisma, buildSafe } from '@/lib/db';
import { absoluteUrl } from '@/lib/site';
import { xmlEscape } from '@/lib/xml';
import { GUIDES } from '@/lib/guides';

export const revalidate = 300;

// Tüm yayındaki haberler + kategoriler (Google 50.000 URL'e kadar tek dosya kabul eder)
export default async function sitemap() {
    const now = new Date();
    const [articles, categories, tags, authors, players, clubs, leagues] = await buildSafe(() => Promise.all([
        prisma.article.findMany({
            where: { status: 'PUBLISHED', publishedAt: { lte: now } },
            orderBy: { publishedAt: 'desc' },
            take: 45000,
            select: { slug: true, updatedAt: true, image: true },
        }),
        prisma.category.findMany({ select: { slug: true } }),
        prisma.tag.findMany({ where: { articles: { some: {} } }, select: { slug: true } }),
        prisma.user.findMany({ where: { slug: { not: null }, articles: { some: { status: 'PUBLISHED', authorName: null } } }, select: { slug: true } }),
        prisma.player.findMany({ where: { active: true }, select: { slug: true } }),
        prisma.club.findMany({ select: { slug: true } }),
        prisma.league.findMany({ where: { active: true }, select: { slug: true } }),
    ]), [[], [], [], [], [], [], []]);
    return [
        { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'always', priority: 1 },
        { url: absoluteUrl('/arsiv'), lastModified: now, changeFrequency: 'daily', priority: 0.4 },
        { url: absoluteUrl('/video'), lastModified: now, changeFrequency: 'daily', priority: 0.5 },
        { url: absoluteUrl('/galeri'), lastModified: now, changeFrequency: 'daily', priority: 0.5 },
        { url: absoluteUrl('/mac-merkezi'), lastModified: now, changeFrequency: 'hourly', priority: 0.6 },
        ...categories.map((c) => ({ url: absoluteUrl(`/category/${c.slug}`), lastModified: now, changeFrequency: 'hourly', priority: 0.7 })),
        ...['/voleybol', '/oyuncular', '/transfer', '/tahmin-ligi', '/rehber'].map((p) => ({ url: absoluteUrl(p), lastModified: now, changeFrequency: 'daily', priority: 0.7 })),
        ...GUIDES.map((g) => ({ url: absoluteUrl(`/rehber/${g.slug}`), changeFrequency: 'monthly', priority: 0.5 })),
        ...leagues.map((l) => ({ url: absoluteUrl(`/mac-merkezi/${l.slug}`), lastModified: now, changeFrequency: 'hourly', priority: 0.7 })),
        ...clubs.map((c) => ({ url: absoluteUrl(`/takim/${c.slug}`), lastModified: now, changeFrequency: 'daily', priority: 0.6 })),
        ...players.map((p) => ({ url: absoluteUrl(`/oyuncu/${p.slug}`), lastModified: now, changeFrequency: 'weekly', priority: 0.5 })),
        ...authors.map((a) => ({ url: absoluteUrl(`/yazar/${a.slug}`), lastModified: now, changeFrequency: 'weekly', priority: 0.5 })),
        ...tags.map((t) => ({ url: absoluteUrl(`/etiket/${t.slug}`), lastModified: now, changeFrequency: 'daily', priority: 0.6 })),
        ...articles.map((a) => ({
            url: absoluteUrl(`/haber/${a.slug}`),
            lastModified: a.updatedAt,
            changeFrequency: 'daily',
            priority: 0.8,
            ...(a.image ? { images: [xmlEscape(a.image.startsWith('/') ? absoluteUrl(a.image) : a.image)] } : {}),
        })),
    ];
}
