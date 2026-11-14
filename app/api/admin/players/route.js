import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { parsePlayer, uniqueSlug, revalidateVolley } from '@/lib/volleyAdmin';

export async function POST(request) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const p = parsePlayer((await readJson(request)) || {});
    if (p.error) return fail(p.error);
    const player = await prisma.player.create({ data: { ...p.data, slug: await uniqueSlug('player', p.data.name) } });
    revalidateVolley({ playerSlug: player.slug });
    return ok({ id: player.id, slug: player.slug }, 201);
}
