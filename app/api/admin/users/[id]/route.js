import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canManageUsers, ROLE_LABELS } from '@/lib/permissions';

async function target(params) {
    const { id } = await params;
    return prisma.user.findUnique({ where: { id: String(id) }, select: { id: true, role: true } });
}

// Son yöneticinin yetkisi alınamaz / silinemez
async function isLastAdmin(u) {
    return u.role === 'ADMIN' && (await prisma.user.count({ where: { role: 'ADMIN' } })) <= 1;
}

export async function PATCH(request, { params }) {
    const { user, error } = await requireStaff(canManageUsers);
    if (error) return error;
    const t = await target(params);
    if (!t) return fail('Kullanıcı bulunamadı.', 404);
    const body = await readJson(request);
    if (!Object.keys(ROLE_LABELS).includes(body?.role)) return fail('Geçersiz rol.');
    if (t.id === user.id) return fail('Kendi rolünüzü değiştiremezsiniz.', 403);
    if (body.role !== 'ADMIN' && (await isLastAdmin(t))) return fail('Son yöneticinin yetkisi alınamaz.', 403);

    await prisma.user.update({ where: { id: t.id }, data: { role: body.role } });
    return ok({ role: body.role });
}

export async function DELETE(_request, { params }) {
    const { user, error } = await requireStaff(canManageUsers);
    if (error) return error;
    const t = await target(params);
    if (!t) return fail('Kullanıcı bulunamadı.', 404);
    if (t.id === user.id) return fail('Kendi hesabınızı buradan silemezsiniz.', 403);
    if (await isLastAdmin(t)) return fail('Son yönetici silinemez.', 403);
    await prisma.user.delete({ where: { id: t.id } });
    return ok();
}
