import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canManageUsers } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';
import { parseTier } from '@/lib/supportInput';

// Ödeme bağlantısı değiştirmek finansal bir ayar olduğu için yalnızca yönetici
export async function POST(request) {
    const { error } = await requireStaff(canManageUsers);
    if (error) return error;
    const p = parseTier((await readJson(request)) || {});
    if (p.error) return fail(p.error);
    await prisma.supportTier.create({ data: p.data });
    revalidatePath('/destek');
    return ok({}, 201);
}
