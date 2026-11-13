import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ok, fail, readJson, rateLimit } from '@/lib/api';

// Bu kadar farklı kullanıcı şikayet ederse yorum otomatik gizlenir (editör tekrar açabilir)
const AUTO_HIDE_AT = 3;

export async function POST(request, { params }) {
    const me = await getCurrentUser();
    if (!me) return fail('Şikayet için giriş yapmalısınız.', 401);
    if (!rateLimit(`report:${me.id}`, 20, 60 * 60 * 1000)) return fail('Çok fazla şikayet gönderdiniz.', 429);

    const { id } = await params;
    const comment = await prisma.comment.findUnique({ where: { id: Number(id) || -1 }, select: { id: true, userId: true } });
    if (!comment) return fail('Yorum bulunamadı.', 404);
    if (comment.userId === me.id) return fail('Kendi yorumunuzu şikayet edemezsiniz.');

    const body = await readJson(request);
    const reason = String(body?.reason || '').trim().slice(0, 200);

    await prisma.commentReport.upsert({
        where: { commentId_userId: { commentId: comment.id, userId: me.id } },
        update: { reason },
        create: { commentId: comment.id, userId: me.id, reason },
    });
    const reportCount = await prisma.commentReport.count({ where: { commentId: comment.id } });
    await prisma.comment.update({
        where: { id: comment.id },
        data: { reportCount, ...(reportCount >= AUTO_HIDE_AT ? { status: 'HIDDEN' } : {}) },
    });
    return ok({ reported: true });
}
