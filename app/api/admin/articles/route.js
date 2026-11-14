import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { parseArticleInput, uniqueSlug } from '@/lib/articleInput';
import { revalidateArticle } from '@/lib/revalidate';
import { syncArticleTags } from '@/lib/tags';
import { ensureAuthorSlug } from '@/lib/authors';
import { notifyStatusChange } from '@/lib/workflow';
import { queueArticlePush } from '@/lib/push';

export async function POST(request) {
    const { user, error } = await requireStaff();
    if (error) return error;

    const body = await readJson(request);
    const parsed = await parseArticleInput(body, user);
    if (parsed.error) return fail(parsed.error);

    const article = await prisma.article.create({
        data: { ...parsed.data, slug: await uniqueSlug(parsed.data.title), authorId: user.id },
        select: { id: true, slug: true, status: true, title: true, authorId: true, reviewNote: true },
    });
    await notifyStatusChange({ article, before: 'DRAFT', actor: user });
    await prisma.articleRevision.create({
        data: { kind: 'SAVE', articleId: article.id, userId: user.id, title: parsed.data.title, summary: parsed.data.summary, content: parsed.data.content, image: parsed.data.image },
    });
    // RSS gelen kutusundan oluşturulduysa öğeyi bu habere bağla
    if (Number.isInteger(body?.feedItemId)) {
        await prisma.feedItem.updateMany({ where: { id: body.feedItemId, articleId: null }, data: { articleId: article.id, status: 'DRAFTED' } });
    }
    await syncArticleTags(article.id, body?.tags);
    await ensureAuthorSlug(user.id);
    if (article.status === 'PUBLISHED') {
        await revalidateArticle(article.id);
        await queueArticlePush(article.id);
    }
    return ok({ article }, 201);
}
