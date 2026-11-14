import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { findPublishedArticle } from '@/lib/articleApi';
import { containsProfanity } from '@/lib/profanity';
import { revalidateCommentArticle } from '@/lib/revalidate';
import { ok, fail, readJson, rateLimit } from '@/lib/api';

const commentSelect = { id: true, text: true, createdAt: true, parentId: true, user: { select: { name: true } } };

export async function GET(_request, { params }) {
    const article = await findPublishedArticle(params);
    if (!article) return fail('Haber bulunamadı.', 404);
    const comments = await prisma.comment.findMany({
        where: { articleId: article.id, status: 'VISIBLE' },
        orderBy: { createdAt: 'desc' },
        take: 200,
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
    if (containsProfanity(text)) return fail('Yorumunuz uygunsuz ifadeler içeriyor. Lütfen saygılı bir dil kullanın.', 422);

    // Cevaplar tek seviye: cevaba cevap verilirse ana yoruma bağlanır
    let parentId = null;
    let replyTo = null; // yanıt verilen yorumun sahibi (bildirim için)
    if (body?.parentId) {
        const parent = await prisma.comment.findFirst({
            where: { id: Number(body.parentId), articleId: article.id, status: 'VISIBLE' },
            select: { id: true, parentId: true, userId: true },
        });
        if (!parent) return fail('Cevap verdiğiniz yorum bulunamadı.', 404);
        parentId = parent.parentId ?? parent.id;
        replyTo = parent.userId;
    }

    const comment = await prisma.comment.create({
        data: { text, articleId: article.id, userId: me.id, parentId },
        select: commentSelect,
    });
    await revalidateCommentArticle(comment.id);
    // Yorumuna yanıt gelen kişiye site içi bildirim (kendine yanıt verene değil)
    if (replyTo && replyTo !== me.id) {
        const excerpt = text.length > 80 ? `${text.slice(0, 80)}…` : text;
        await prisma.userNotification.create({
            data: { userId: replyTo, type: 'yanit', text: `${me.name} yorumunuza yanıt verdi: “${excerpt}”`, url: `/haber/${article.slug}#yorumlar` },
        }).catch(() => {});
    }
    return ok({ comment }, 201);
}
