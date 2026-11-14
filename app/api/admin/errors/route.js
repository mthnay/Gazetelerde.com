import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canManageUsers } from '@/lib/permissions';

// { id, resolved } tek hata; { all: true } tümünü çözüldü işaretle; { id, remove: true } sil
export async function PATCH(request) {
    const { error } = await requireStaff(canManageUsers);
    if (error) return error;
    const b = (await readJson(request)) || {};
    if (b.all) {
        const r = await prisma.errorEvent.updateMany({ where: { resolved: false }, data: { resolved: true } });
        return ok({ count: r.count });
    }
    const id = Number(b.id);
    if (!Number.isInteger(id)) return fail('Geçersiz kayıt.');
    if (b.remove) await prisma.errorEvent.deleteMany({ where: { id } });
    else await prisma.errorEvent.updateMany({ where: { id }, data: { resolved: !!b.resolved } });
    return ok();
}
