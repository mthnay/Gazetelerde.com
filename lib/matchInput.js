import { prisma } from '@/lib/db';
import { parseSets, setsToScore } from '@/lib/standings';

const STATUSES = ['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED'];

// Maç formu doğrulaması; { data } ya da { error }
export async function parseMatchInput(b, existing = null) {
    const data = {};
    if (b.homeId !== undefined || b.awayId !== undefined) {
        const homeId = Number(b.homeId ?? existing?.homeId), awayId = Number(b.awayId ?? existing?.awayId);
        if (!homeId || !awayId || homeId === awayId) return { error: 'İki farklı takım seçin.' };
        const leagueId = Number(b.leagueId ?? existing?.leagueId);
        const n = await prisma.team.count({ where: { id: { in: [homeId, awayId] }, leagueId } });
        if (n !== 2) return { error: 'Takımlar bu ligde değil.' };
        Object.assign(data, { homeId, awayId });
    }
    if (b.startAt !== undefined) {
        const d = new Date(b.startAt);
        if (Number.isNaN(d.getTime())) return { error: 'Geçerli bir tarih/saat girin.' };
        data.startAt = d;
    }
    if (b.week !== undefined) data.week = b.week === '' || b.week == null ? null : Math.max(1, Math.min(99, Number(b.week) || 1));
    if (b.venue !== undefined) data.venue = String(b.venue).trim().slice(0, 100);
    if (b.status !== undefined) {
        if (!STATUSES.includes(b.status)) return { error: 'Geçersiz durum.' };
        data.status = b.status;
    }
    if (b.sets !== undefined) {
        const sets = parseSets(b.sets);
        if (sets === null) return { error: 'Set skorlarını "25-21, 23-25, …" biçiminde yazın.' };
        data.sets = sets;
        if (sets.length) [data.homeScore, data.awayScore] = setsToScore(sets); // voleybolda maç skoru setlerden
    }
    for (const k of ['homeScore', 'awayScore']) {
        if (b[k] !== undefined && !(b.sets && parseSets(b.sets)?.length)) data[k] = b[k] === '' || b[k] == null ? null : Math.max(0, Math.min(999, Number(b[k]) || 0));
    }
    if (b.articleSlug !== undefined) {
        const slug = String(b.articleSlug).trim().replace(/^.*\/haber\//, '').replace(/[?#].*$/, '');
        if (!slug) data.articleId = null;
        else {
            const a = await prisma.article.findUnique({ where: { slug }, select: { id: true } });
            if (!a) return { error: 'Bağlanacak haber bulunamadı (haber adresini yapıştırın).' };
            data.articleId = a.id;
        }
    }
    return { data };
}
