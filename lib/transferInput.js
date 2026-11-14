import { prisma } from '@/lib/db';

export async function parseTransfer(b) {
    const player = await prisma.player.findUnique({ where: { id: Number(b.playerId) }, select: { id: true, slug: true } });
    if (!player) return { error: 'Oyuncu seçin.' };
    const fromClubId = b.fromClubId ? Number(b.fromClubId) : null, toClubId = b.toClubId ? Number(b.toClubId) : null;
    if (!toClubId && !String(b.toName || '').trim()) return { error: 'Gideceği kulübü seçin ya da yazın.' };
    const date = b.date ? new Date(b.date) : new Date();
    if (Number.isNaN(date.getTime())) return { error: 'Geçersiz tarih.' };
    return { player, data: {
        playerId: player.id, fromClubId, toClubId, fromName: String(b.fromName || '').slice(0, 80), toName: String(b.toName || '').slice(0, 80),
        status: ['soylenti', 'gorusme', 'resmi'].includes(b.status) ? b.status : 'soylenti', season: String(b.season || '').slice(0, 9),
        date, note: String(b.note || '').slice(0, 500), sourceUrl: /^https?:\/\/\S+$/.test(String(b.sourceUrl || '')) ? String(b.sourceUrl).slice(0, 300) : null,
    } };
}

