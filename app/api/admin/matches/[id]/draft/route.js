import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { aiEnabled } from '@/lib/ai';
import { draftMatchReport } from '@/lib/matchDraft';

export const maxDuration = 120;

// Maç sonu taslağını (ör. istatistikler girildikten sonra) yeniden oluştur
export async function POST(_request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    if (!aiEnabled()) return fail('Yapay zekâ yardımcısı kapalı.', 503);
    const id = await idParam(params);
    const m = id && (await prisma.match.findUnique({ where: { id }, select: { status: true, article: { select: { status: true } } } }));
    if (!m) return fail('Maç bulunamadı.', 404);
    if (m.status !== 'FINISHED') return fail('Taslak yalnızca bitmiş maç için oluşturulur.');
    if (m.article?.status === 'PUBLISHED') return fail('Bu maçın yayımlanmış haberi zaten var.', 409);
    await prisma.match.update({ where: { id }, data: { draftedAt: null, articleId: m.article ? undefined : null } });
    const article = await draftMatchReport(id);
    return article ? ok({ id: article.id }) : fail('Taslak oluşturulamadı; birazdan tekrar deneyin.', 502);
}
