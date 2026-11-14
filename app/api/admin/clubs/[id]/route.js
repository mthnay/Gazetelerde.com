import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { parseClub, revalidateVolley } from '@/lib/volleyAdmin';

// Bilgi güncelle; { teamIds: [..] } ile lig takım kayıtlarını bağla
export async function PATCH(request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const club = id && (await prisma.club.findUnique({ where: { id } }));
    if (!club) return fail('Kulüp bulunamadı.', 404);
    const b = (await readJson(request)) || {};
    if (Array.isArray(b.teamIds)) {
        const ids = b.teamIds.map(Number).filter(Number.isInteger);
        await prisma.$transaction([
            prisma.team.updateMany({ where: { clubId: id, id: { notIn: ids } }, data: { clubId: null } }),
            prisma.team.updateMany({ where: { id: { in: ids } }, data: { clubId: id } }),
        ]);
    }
    if (b.name !== undefined) {
        const p = parseClub({ ...club, ...b });
        if (p.error) return fail(p.error);
        await prisma.club.update({ where: { id }, data: p.data });
    }
    revalidateVolley({ clubSlug: club.slug });
    return ok();
}

export async function DELETE(_request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const club = id && (await prisma.club.findUnique({ where: { id } }));
    if (!club) return fail('Kulüp bulunamadı.', 404);
    await prisma.club.delete({ where: { id } });
    revalidateVolley({ clubSlug: club.slug });
    return ok();
}
