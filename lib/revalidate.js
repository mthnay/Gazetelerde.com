import 'server-only';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

// Haber yayınlanınca / değişince ilgili önbellekli sayfaları hemen tazele.
// (Aksi halde en geç 60 sn içinde zaten yenilenirler.)
export async function revalidateArticle(articleId, extraSlugs = []) {
    const a = await prisma.article.findUnique({
        where: { id: articleId },
        select: { slug: true, category: { select: { slug: true } } },
    });
    const paths = new Set(['/', '/sitemap.xml', '/news-sitemap.xml', '/rss.xml', ...extraSlugs.map((s) => `/haber/${s}`)]);
    if (a) {
        paths.add(`/haber/${a.slug}`);
        paths.add(`/category/${a.category.slug}`);
    }
    paths.forEach((p) => revalidatePath(p));
}

export async function revalidateCommentArticle(commentId) {
    const c = await prisma.comment.findUnique({ where: { id: commentId }, select: { article: { select: { slug: true } } } });
    if (c) revalidatePath(`/haber/${c.article.slug}`);
}
