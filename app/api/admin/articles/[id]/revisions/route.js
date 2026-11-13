import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canEditArticle } from '@/lib/permissions';

// Sürüm geçmişi: ?rev=<id> verilirse o sürümün tam içeriği döner
export async function GET(request, { params }) {
    const { user, error } = await requireStaff();
    if (error) return error;
    const id = await idParam(params);
    const article = id ? await prisma.article.findUnique({ where: { id }, select: { id: true, authorId: true, status: true } }) : null;
    if (!article) return fail('Haber bulunamadı.', 404);
    if (!canEditArticle(user, article)) return fail('Yetkiniz yok.', 403);

    const revId = Number(new URL(request.url).searchParams.get('rev'));
    if (revId) {
        const rev = await prisma.articleRevision.findFirst({
            where: { id: revId, articleId: id },
            select: { id: true, kind: true, title: true, summary: true, content: true, image: true, createdAt: true },
        });
        return rev ? ok({ revision: rev }) : fail('Sürüm bulunamadı.', 404);
    }
    const revisions = await prisma.articleRevision.findMany({
        where: { articleId: id }, orderBy: { createdAt: 'desc' }, take: 50,
        select: { id: true, kind: true, title: true, createdAt: true, user: { select: { name: true } } },
    });
    return ok({ revisions: revisions.map((r) => ({ ...r, user: r.user?.name || '—' })) });
}
