import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { findPublishedArticle } from '@/lib/articleApi';
import { ok, fail, readJson, rateLimit } from '@/lib/api';

const commentSelect = { id: true, text: true, createdAt: true, user: { select: { name: true } } };

export async function GET(_request, { params }) {
    const article = await findPublishedArticle(params);
    if (!article) return fail('Haber bulunamadı.', 404);
    const comments = await prisma.comment.findMany({
        where: { articleId: article.id, status: 'VISIBLE' },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: commentSelect,
    });
    return ok({ comments });
}

export async function POST(request, { params }) {
    const me = await getCurrentUser();
    if (!me) return fail('Yorum yapmak için giriş yapmalısınız.', 401);
    if (!rateLimit(`comment:${me.id}`, 5, 60 * 1000)) return fail('Çok hızlı yorum yapıyorsunuz, biraz bekleyin.', 429);

    const article = await findPublishedArticle(params);
    if (!article) return fail('Haber bulunamadı.', 404);

    const body = await readJson(request);
    const text = String(body?.text || '').trim();
    if (text.length < 2) return fail('Yorum çok kısa.');
    if (text.length > 1000) return fail('Yorum en fazla 1000 karakter olabilir.');

    const comment = await prisma.comment.create({
        data: { text, articleId: article.id, userId: me.id },
        select: commentSelect,
    });
    return ok({ comment }, 201);
}
