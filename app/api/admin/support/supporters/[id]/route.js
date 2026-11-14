import { prisma } from '@/lib/db';
import { ok } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';

export async function DELETE(_request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    await prisma.supporter.deleteMany({ where: { id: id || 0 } });
    return ok();
}
