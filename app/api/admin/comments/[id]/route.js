import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canModerate } from '@/lib/permissions';

export async function PATCH(request, { params }) {
    const { error } = await requireStaff(canModerate);
    if (error) return error;
    const id = await idParam(params);
    const body = await readJson(request);
    if (!['VISIBLE', 'HIDDEN'].includes(body?.status)) return fail('Geçersiz durum.');
    // Editör yorumu tekrar yayına alırsa şikayetler temizlenir (yeniden otomatik gizlenmesin)
    if (body.status === 'VISIBLE' && id) await prisma.commentReport.deleteMany({ where: { commentId: id } });
    const res = await prisma.comment.updateMany({
        where: { id: id ?? -1 },
        data: { status: body.status, ...(body.status === 'VISIBLE' ? { reportCount: 0 } : {}) },
    });
    if (!res.count) return fail('Yorum bulunamadı.', 404);
    return ok({ status: body.status });
}

export async function DELETE(_request, { params }) {
    const { error } = await requireStaff(canModerate);
    if (error) return error;
    const id = await idParam(params);
    const res = await prisma.comment.deleteMany({ where: { id: id ?? -1 } });
    if (!res.count) return fail('Yorum bulunamadı.', 404);
    return ok();
}
