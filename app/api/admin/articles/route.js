import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { parseArticleInput, uniqueSlug } from '@/lib/articleInput';
import { revalidateArticle } from '@/lib/revalidate';

export async function POST(request) {
    const { user, error } = await requireStaff();
    if (error) return error;

    const body = await readJson(request);
    const parsed = await parseArticleInput(body, user);
    if (parsed.error) return fail(parsed.error);

    const article = await prisma.article.create({
        data: { ...parsed.data, slug: await uniqueSlug(parsed.data.title), authorId: user.id },
        select: { id: true, slug: true, status: true },
    });
    if (article.status === 'PUBLISHED') await revalidateArticle(article.id);
    return ok({ article }, 201);
}
