import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';

// Gelen kutusu öğesini yok say / geri al
export async function PATCH(request, { params }) {
    const { error } = await requireStaff();
    if (error) return error;
    const id = await idParam(params);
    const body = await readJson(request);
    if (!['NEW', 'IGNORED'].includes(body?.status)) return fail('Geçersiz durum.');
    const res = await prisma.feedItem.updateMany({ where: { id: id ?? -1, articleId: null }, data: { status: body.status } });
    return res.count ? ok({ status: body.status }) : fail('Öğe bulunamadı ya da zaten taslağa dönüştürülmüş.', 404);
}
