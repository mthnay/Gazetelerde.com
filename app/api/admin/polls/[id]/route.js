import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { revalidateArticle } from '@/lib/revalidate';

// { close: true } hemen kapat ; { correctId } tahmini elle sonuçlandır ; { reopen: true }
export async function PATCH(request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const poll = id && (await prisma.poll.findUnique({ where: { id }, include: { options: true } }));
    if (!poll) return fail('Anket bulunamadı.', 404);
    const b = (await readJson(request)) || {};
    const data = {};
    if (b.close) data.closesAt = new Date();
    if (b.reopen) { data.closesAt = null; data.correctId = null; }
    if (b.correctId !== undefined) {
        if (b.correctId !== null && !poll.options.some((o) => o.id === Number(b.correctId))) return fail('Geçersiz seçenek.');
        data.correctId = b.correctId === null ? null : Number(b.correctId);
    }
    await prisma.poll.update({ where: { id }, data });
    if (poll.articleId) await revalidateArticle(poll.articleId);
    return ok();
}

export async function DELETE(_request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const poll = id && (await prisma.poll.findUnique({ where: { id } }));
    if (!poll) return fail('Anket bulunamadı.', 404);
    await prisma.poll.delete({ where: { id } });
    if (poll.articleId) await revalidateArticle(poll.articleId);
    return ok();
}
