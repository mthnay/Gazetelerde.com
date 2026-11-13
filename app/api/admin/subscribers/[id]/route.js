import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';

// Aboneyi pasifleştir ya da tamamen sil (KVKK silme talebi)
export async function PATCH(request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const b = (await readJson(request)) || {};
    if (b.active !== false) return fail('Aboneler yalnızca pasifleştirilebilir; yeniden abonelik okurun kendi onayıyla olur.');
    const r = await prisma.subscriber.updateMany({ where: { id: id || 0 }, data: { active: false, unsubscribedAt: new Date() } });
    return r.count ? ok() : fail('Abone bulunamadı.', 404);
}

export async function DELETE(_request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const r = await prisma.subscriber.deleteMany({ where: { id: id || 0 } });
    return r.count ? ok() : fail('Abone bulunamadı.', 404);
}
