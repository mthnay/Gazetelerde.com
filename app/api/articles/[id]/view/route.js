import { prisma } from '@/lib/db';
import { findPublishedArticle } from '@/lib/articleApi';
import { ok, fail, rateLimit, clientIp } from '@/lib/api';

// Okunma sayacı. Sayfa önbellekten sunulduğu için sayım tarayıcıdan gelen bu istekle yapılır.
export async function POST(request, { params }) {
    const article = await findPublishedArticle(params);
    if (!article) return fail('Haber bulunamadı.', 404);
    // Aynı IP'den aynı habere 10 dakikada 1 sayım
    if (rateLimit(`view:${clientIp(request)}:${article.id}`, 1, 10 * 60 * 1000)) {
        await prisma.article.update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } });
    }
    return ok();
}
