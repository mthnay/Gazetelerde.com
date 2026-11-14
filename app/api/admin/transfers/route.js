import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { revalidateVolley } from '@/lib/volleyAdmin';
import { parseTransfer } from '@/lib/transferInput';

export async function POST(request) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const p = await parseTransfer((await readJson(request)) || {});
    if (p.error) return fail(p.error);
    const t = await prisma.transfer.create({ data: p.data, select: { id: true } });
    revalidateVolley({ playerSlug: p.player.slug });
    return ok({ id: t.id }, 201);
}
