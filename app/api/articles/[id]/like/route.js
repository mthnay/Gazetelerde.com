import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { findPublishedArticle } from '@/lib/articleApi';
import { ok, fail } from '@/lib/api';

async function toggle(params, on) {
    const me = await getCurrentUser();
    if (!me) return fail('Bu işlem için giriş yapmalısınız.', 401);
    const article = await findPublishedArticle(params);
    if (!article) return fail('Haber bulunamadı.', 404);

    const where = { userId_articleId: { userId: me.id, articleId: article.id } };
    if (on) {
        await prisma.like.upsert({ where, update: {}, create: { userId: me.id, articleId: article.id } });
    } else {
        await prisma.like.deleteMany({ where: { userId: me.id, articleId: article.id } });
    }
    const count = await prisma.like.count({ where: { articleId: article.id } });
    return ok({ liked: on, count });
}

export async function POST(_request, { params }) {
    return toggle(params, true);
}

export async function DELETE(_request, { params }) {
    return toggle(params, false);
}
