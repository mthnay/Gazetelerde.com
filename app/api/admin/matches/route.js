import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { parseMatchInput } from '@/lib/matchInput';
import { revalidateLeague } from '@/lib/matchAdmin';

export async function POST(request) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const b = (await readJson(request)) || {};
    const leagueId = Number(b.leagueId);
    if (!leagueId || !(await prisma.league.findUnique({ where: { id: leagueId } }))) return fail('Lig bulunamadı.', 404);
    if (!b.startAt) return fail('Maç tarihini girin.');
    const parsed = await parseMatchInput({ ...b, leagueId });
    if (parsed.error) return fail(parsed.error);
    const m = await prisma.match.create({ data: { leagueId, ...parsed.data }, select: { id: true } });
    await revalidateLeague(leagueId);
    return ok({ id: m.id }, 201);
}
