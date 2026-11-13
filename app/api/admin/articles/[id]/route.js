import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { parseArticleInput, uniqueSlug } from '@/lib/articleInput';
import { canEditArticle, canDeleteArticle } from '@/lib/permissions';

async function load(params) {
    const id = await idParam(params);
    return id ? prisma.article.findUnique({ where: { id } }) : null;
}

export async function PATCH(request, { params }) {
    const { user, error } = await requireStaff();
    if (error) return error;
    const existing = await load(params);
    if (!existing) return fail('Haber bulunamadı.', 404);
    if (!canEditArticle(user, existing)) return fail('Bu haberi düzenleme yetkiniz yok.', 403);

    const body = await readJson(request);
    const parsed = await parseArticleInput(body, user, existing);
    if (parsed.error) return fail(parsed.error);

    // Slug yalnızca yayınlanmamış haberlerde başlıkla birlikte güncellenir (yayındaki linkler bozulmasın)
    const slug = existing.status === 'PUBLISHED' || existing.title === parsed.data.title
        ? existing.slug
        : await uniqueSlug(parsed.data.title, existing.id);

    const article = await prisma.article.update({
        where: { id: existing.id },
        data: { ...parsed.data, slug },
        select: { id: true, slug: true, status: true },
    });
    revalidatePath(`/haber/${article.slug}`);
    return ok({ article });
}

export async function DELETE(_request, { params }) {
    const { user, error } = await requireStaff();
    if (error) return error;
    const existing = await load(params);
    if (!existing) return fail('Haber bulunamadı.', 404);
    if (!canDeleteArticle(user, existing)) return fail('Bu haberi silme yetkiniz yok.', 403);
    await prisma.article.delete({ where: { id: existing.id } });
    return ok();
}
