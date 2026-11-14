import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canManageUsers } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';
import { parseTier } from '@/lib/supportInput';

export async function PATCH(request, { params }) {
    const { error } = await requireStaff(canManageUsers);
    if (error) return error;
    const id = await idParam(params);
    const t = id && (await prisma.supportTier.findUnique({ where: { id } }));
    if (!t) return fail('Paket bulunamadı.', 404);
    const p = parseTier({ ...t, ...((await readJson(request)) || {}) });
    if (p.error) return fail(p.error);
    await prisma.supportTier.update({ where: { id }, data: p.data });
    revalidatePath('/destek');
    return ok();
}

export async function DELETE(_request, { params }) {
    const { error } = await requireStaff(canManageUsers);
    if (error) return error;
    const id = await idParam(params);
    await prisma.supportTier.deleteMany({ where: { id: id || 0 } });
    revalidatePath('/destek');
    return ok();
}
