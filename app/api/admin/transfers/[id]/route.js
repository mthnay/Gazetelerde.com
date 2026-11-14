import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { revalidateVolley } from '@/lib/volleyAdmin';

// Durum değiştir ({ status }); resmileşen transferde oyuncu yeni kulübün kadrosuna eklenebilir ({ addToRoster: season })
export async function PATCH(request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const t = id && (await prisma.transfer.findUnique({ where: { id }, include: { player: { select: { slug: true } } } }));
    if (!t) return fail('Transfer bulunamadı.', 404);
    const b = (await readJson(request)) || {};
    if (b.status && ['soylenti', 'gorusme', 'resmi'].includes(b.status)) await prisma.transfer.update({ where: { id }, data: { status: b.status } });
    if (b.addToRoster && t.toClubId && /^\d{4}-\d{2}$/.test(b.addToRoster)) {
        await prisma.rosterEntry.upsert({
            where: { playerId_clubId_season: { playerId: t.playerId, clubId: t.toClubId, season: b.addToRoster } },
            update: {}, create: { playerId: t.playerId, clubId: t.toClubId, season: b.addToRoster },
        });
    }
    revalidateVolley({ playerSlug: t.player.slug });
    return ok();
}

export async function DELETE(_request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const t = id && (await prisma.transfer.findUnique({ where: { id }, include: { player: { select: { slug: true } } } }));
    if (!t) return fail('Transfer bulunamadı.', 404);
    await prisma.transfer.delete({ where: { id } });
    revalidateVolley({ playerSlug: t.player.slug });
    return ok();
}
