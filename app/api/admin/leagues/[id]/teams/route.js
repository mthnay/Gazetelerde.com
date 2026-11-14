import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { revalidateLeague } from '@/lib/matchAdmin';

// Toplu takım ekleme: her satıra bir takım; "Tam ad | KISA" biçiminde kısa ad da verilebilir
export async function POST(request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const leagueId = await idParam(params);
    if (!leagueId || !(await prisma.league.findUnique({ where: { id: leagueId } }))) return fail('Lig bulunamadı.', 404);
    const b = (await readJson(request)) || {};
    const rows = String(b.names || '').split('\n').map((l) => l.split('|').map((x) => x.trim())).filter(([n]) => n).slice(0, 40);
    if (!rows.length) return fail('En az bir takım adı yazın.');
    const r = await prisma.team.createMany({
        data: rows.map(([name, short]) => ({ leagueId, name: name.slice(0, 80), shortName: (short || '').slice(0, 6) })),
        skipDuplicates: true,
    });
    await revalidateLeague(leagueId);
    return ok({ added: r.count });
}
