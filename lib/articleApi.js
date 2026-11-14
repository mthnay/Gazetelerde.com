import 'server-only';
import { prisma } from '@/lib/db';

// URL'deki id'yi doğrula ve yayındaki haberi bul
export async function findPublishedArticle(params) {
    const { id } = await params;
    const articleId = Number(id);
    if (!Number.isInteger(articleId) || articleId <= 0) return null;
    return prisma.article.findFirst({ where: { id: articleId, status: 'PUBLISHED' }, select: { id: true, slug: true } });
}
