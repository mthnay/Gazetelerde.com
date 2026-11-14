import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

// Maç istatistiklerini toptan kaydet: { rows: [{ playerId, side, points, attack, block, ace, mvp }] }
export async function PUT(request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const match = id && (await prisma.match.findUnique({ where: { id }, select: { id: true, league: { select: { slug: true } } } }));
    if (!match) return fail('Maç bulunamadı.', 404);
    const rows = ((await readJson(request))?.rows || []).slice(0, 60);
    const n = (v) => Math.max(0, Math.min(99, Number(v) || 0));
    const clean = rows.filter((r) => Number.isInteger(Number(r.playerId)) && ['home', 'away'].includes(r.side))
        .map((r) => ({ matchId: id, playerId: Number(r.playerId), side: r.side, points: n(r.points), attack: n(r.attack), block: n(r.block), ace: n(r.ace), mvp: !!r.mvp }))
        .filter((r) => r.points || r.attack || r.block || r.ace || r.mvp);
    if (clean.filter((r) => r.mvp).length > 1) return fail('Maçın oyuncusu (MVP) yalnızca bir kişi olabilir.');
    await prisma.$transaction([prisma.matchStat.deleteMany({ where: { matchId: id } }), prisma.matchStat.createMany({ data: clean })]);
    const players = await prisma.player.findMany({ where: { id: { in: clean.map((r) => r.playerId) } }, select: { slug: true } });
    players.forEach((p) => revalidatePath(`/oyuncu/${p.slug}`));
    revalidatePath(`/mac/${id}`); revalidatePath(`/mac-merkezi/${match.league.slug}`); revalidatePath('/voleybol');
    return ok({ saved: clean.length });
}
