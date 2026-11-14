import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { revalidateLeague } from '@/lib/matchAdmin';

export async function PATCH(request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const team = id && (await prisma.team.findUnique({ where: { id } }));
    if (!team) return fail('Takım bulunamadı.', 404);
    const b = (await readJson(request)) || {};
    const data = {};
    if (b.name !== undefined) data.name = String(b.name).trim().slice(0, 80) || team.name;
    if (b.shortName !== undefined) data.shortName = String(b.shortName).trim().slice(0, 6);
    if (b.penalty !== undefined) data.penalty = Math.max(0, Math.min(99, Number(b.penalty) || 0));
    if (b.logo !== undefined) data.logo = /^(\/media\/[a-z0-9]+|https:\/\/\S+)$/i.test(String(b.logo)) ? String(b.logo) : null;
    await prisma.team.update({ where: { id }, data });
    await revalidateLeague(team.leagueId);
    return ok();
}

export async function DELETE(_request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const team = id && (await prisma.team.findUnique({ where: { id } }));
    if (!team) return fail('Takım bulunamadı.', 404);
    await prisma.team.delete({ where: { id } }); // maçları da silinir
    await revalidateLeague(team.leagueId);
    return ok();
}
