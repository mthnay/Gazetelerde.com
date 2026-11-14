import { prisma } from '@/lib/db';
import { findPublishedArticle } from '@/lib/articleApi';
import { ok, fail, rateLimit, clientIp } from '@/lib/api';
import { isBot, istanbulDay } from '@/lib/analytics';

// Okunma sayacı. Sayfa önbellekten sunulduğu için sayım tarayıcıdan gelen bu istekle yapılır.
export async function POST(request, { params }) {
    const article = await findPublishedArticle(params);
    if (!article) return fail('Haber bulunamadı.', 404);
    // Aynı IP'den aynı habere 10 dakikada 1 sayım
    if (isBot(request.headers.get('user-agent') || '')) return ok();
    if (rateLimit(`view:${clientIp(request)}:${article.id}`, 1, 10 * 60 * 1000)) {
        const day = istanbulDay();
        await prisma.$transaction([
            prisma.article.update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } }),
            // Günlük okunma (istatistik paneli için)
            prisma.$executeRaw`INSERT INTO "ArticleDailyStat" ("articleId", day, views) VALUES (${article.id}, ${day}, 1)
                ON CONFLICT ("articleId", day) DO UPDATE SET views = "ArticleDailyStat".views + 1`,
        ]);
    }
    return ok();
}
