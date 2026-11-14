import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { parsePlayer, revalidateVolley } from '@/lib/volleyAdmin';

// Bilgi güncelle; { roster: { clubId, season, number, captain } } kadro ekle; { removeRoster: id } kadrodan çıkar
export async function PATCH(request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const player = id && (await prisma.player.findUnique({ where: { id } }));
    if (!player) return fail('Oyuncu bulunamadı.', 404);
    const b = (await readJson(request)) || {};
    let clubSlug;
    if (b.roster) {
        const club = await prisma.club.findUnique({ where: { id: Number(b.roster.clubId) } });
        const season = String(b.roster.season || '').trim();
        if (!club || !/^\d{4}-\d{2}$/.test(season)) return fail('Kulüp ve sezon (ör. 2025-26) gerekli.');
        const num = b.roster.number === '' || b.roster.number == null ? null : Math.max(0, Math.min(99, Number(b.roster.number) || 0));
        await prisma.rosterEntry.upsert({
            where: { playerId_clubId_season: { playerId: id, clubId: club.id, season } },
            update: { number: num, captain: !!b.roster.captain }, create: { playerId: id, clubId: club.id, season, number: num, captain: !!b.roster.captain },
        });
        clubSlug = club.slug;
    }
    if (b.removeRoster) {
        const r = await prisma.rosterEntry.findFirst({ where: { id: Number(b.removeRoster), playerId: id }, include: { club: { select: { slug: true } } } });
        if (r) { await prisma.rosterEntry.delete({ where: { id: r.id } }); clubSlug = r.club.slug; }
    }
    if (b.name !== undefined) {
        const p = parsePlayer({ ...player, ...b });
        if (p.error) return fail(p.error);
        await prisma.player.update({ where: { id }, data: p.data });
    }
    revalidateVolley({ playerSlug: player.slug, clubSlug });
    return ok();
}

export async function DELETE(_request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const player = id && (await prisma.player.findUnique({ where: { id } }));
    if (!player) return fail('Oyuncu bulunamadı.', 404);
    await prisma.player.delete({ where: { id } });
    revalidateVolley({ playerSlug: player.slug });
    return ok();
}
