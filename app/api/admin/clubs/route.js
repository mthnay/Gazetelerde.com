import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { parseClub, uniqueSlug, revalidateVolley } from '@/lib/volleyAdmin';

export async function POST(request) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const p = parseClub((await readJson(request)) || {});
    if (p.error) return fail(p.error);
    const club = await prisma.club.create({ data: { ...p.data, slug: await uniqueSlug('club', p.data.name) } });
    // Aynı adlı lig takımlarını kulübe bağla
    await prisma.team.updateMany({ where: { name: { equals: club.name, mode: 'insensitive' }, clubId: null }, data: { clubId: club.id } });
    revalidateVolley({ clubSlug: club.slug });
    return ok({ id: club.id, slug: club.slug }, 201);
}
