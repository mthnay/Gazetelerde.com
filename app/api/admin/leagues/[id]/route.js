import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { revalidateLeague } from '@/lib/matchAdmin';

export async function PATCH(request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const b = (await readJson(request)) || {};
    const data = {};
    if (b.name !== undefined) data.name = String(b.name).trim().slice(0, 80);
    if (b.season !== undefined) data.season = String(b.season).trim().slice(0, 20);
    if (b.active !== undefined) data.active = !!b.active;
    if (b.sortOrder !== undefined) data.sortOrder = Number(b.sortOrder) || 0;
    if (b.kind !== undefined && ['lig', 'kupa', 'avrupa', 'milli'].includes(b.kind)) data.kind = b.kind;
    if (b.gender !== undefined) data.gender = b.gender === 'erkek' ? 'erkek' : 'kadin';
    if (b.featured !== undefined) data.featured = !!b.featured;
    const r = await prisma.league.updateMany({ where: { id: id || 0 }, data });
    if (!r.count) return fail('Lig bulunamadı.', 404);
    await revalidateLeague(id);
    return ok();
}

export async function DELETE(_request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const l = id && (await prisma.league.findUnique({ where: { id }, select: { slug: true } }));
    if (!l) return fail('Lig bulunamadı.', 404);
    await prisma.league.delete({ where: { id } });
    await revalidateLeague(id);
    return ok();
}
