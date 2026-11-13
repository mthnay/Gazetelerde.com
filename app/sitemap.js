import { prisma } from '@/lib/db';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 300;

// Tüm yayındaki haberler + kategoriler (Google 50.000 URL'e kadar tek dosya kabul eder)
export default async function sitemap() {
    const now = new Date();
    const [articles, categories] = await Promise.all([
        prisma.article.findMany({
            where: { status: 'PUBLISHED', publishedAt: { lte: now } },
            orderBy: { publishedAt: 'desc' },
            take: 45000,
            select: { slug: true, updatedAt: true, image: true },
        }),
        prisma.category.findMany({ select: { slug: true } }),
    ]);
    return [
        { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'always', priority: 1 },
        ...categories.map((c) => ({ url: absoluteUrl(`/category/${c.slug}`), lastModified: now, changeFrequency: 'hourly', priority: 0.7 })),
        ...articles.map((a) => ({
            url: absoluteUrl(`/haber/${a.slug}`),
            lastModified: a.updatedAt,
            changeFrequency: 'daily',
            priority: 0.8,
            ...(a.image ? { images: [a.image] } : {}),
        })),
    ];
}
