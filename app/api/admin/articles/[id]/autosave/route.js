import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canEditArticle } from '@/lib/permissions';
import { sanitizeArticleHtml } from '@/lib/html';

const KEEP = 20; // haber başına saklanan en fazla otomatik kayıt

// Otomatik kayıt: yayındaki haberi DEĞİŞTİRMEZ, yalnızca bir sürüm olarak saklar
export async function POST(request, { params }) {
    const { user, error } = await requireStaff();
    if (error) return error;
    const id = await idParam(params);
    const article = id ? await prisma.article.findUnique({ where: { id }, select: { id: true, authorId: true, status: true } }) : null;
    if (!article) return fail('Haber bulunamadı.', 404);
    if (!canEditArticle(user, article)) return fail('Bu haberi düzenleme yetkiniz yok.', 403);

    const body = await readJson(request);
    const data = {
        title: String(body?.title || '').slice(0, 200),
        summary: String(body?.summary || '').slice(0, 500),
        content: sanitizeArticleHtml(String(body?.content || '').slice(0, 200_000)),
        image: String(body?.image || '').slice(0, 500) || null,
    };

    // Son otomatik kayıtla aynıysa yenisini yazma
    const last = await prisma.articleRevision.findFirst({ where: { articleId: id, kind: 'AUTOSAVE' }, orderBy: { createdAt: 'desc' } });
    if (last && last.title === data.title && last.summary === data.summary && last.content === data.content && last.image === data.image) {
        return ok({ savedAt: last.createdAt, unchanged: true });
    }
    const rev = await prisma.articleRevision.create({ data: { ...data, kind: 'AUTOSAVE', articleId: id, userId: user.id }, select: { createdAt: true } });

    // Eski otomatik kayıtları temizle
    const old = await prisma.articleRevision.findMany({
        where: { articleId: id, kind: 'AUTOSAVE' }, orderBy: { createdAt: 'desc' }, skip: KEEP, select: { id: true },
    });
    if (old.length) await prisma.articleRevision.deleteMany({ where: { id: { in: old.map((r) => r.id) } } });
    return ok({ savedAt: rev.createdAt });
}
