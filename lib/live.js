import { prisma } from '@/lib/db';

export const LIVE_KINDS = { normal: 'Gelişme', onemli: 'Önemli', skor: 'Skor', son: 'Son durum' };

export const toEntry = (e) => ({
    id: e.id, text: e.text, kind: e.kind, image: e.image, pinned: e.pinned,
    createdAt: e.createdAt.toISOString(), updatedAt: e.updatedAt.toISOString(),
});

// Haberin canlı anlatım girişleri (yeniden eskiye; sabitlenenler ayrı gösterilir)
export async function getLiveEntries(articleId, take = 200) {
    const rows = await prisma.liveEntry.findMany({ where: { articleId }, orderBy: { createdAt: 'desc' }, take });
    return rows.map(toEntry);
}

// Habere bağlı maç(lar)ın skoru (canlı skor kutusu)
export async function getArticleMatches(articleId) {
    const rows = await prisma.match.findMany({
        where: { articleId },
        select: {
            id: true, startAt: true, status: true, homeScore: true, awayScore: true, sets: true, venue: true, week: true,
            home: { select: { id: true, name: true, shortName: true, logo: true } }, away: { select: { id: true, name: true, shortName: true, logo: true } },
            league: { select: { slug: true, name: true, sport: true } },
        },
    });
    return rows.map((m) => ({ ...m, startAt: m.startAt.toISOString(), sets: Array.isArray(m.sets) ? m.sets : [], articleSlug: null, live: false }));
}
