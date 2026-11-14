// Voleybol veri merkezi: oyuncu, kulüp, kadro, istatistik (sunucu)
import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/db';
import { toMatch } from '@/lib/matchCenter';

// Güncel sezon: VOLLEY_SEASON ile sabitlenebilir; yoksa tarihten (Ağustos'ta yeni sezon başlar, ör. Kasım 2026 -> 2026-27)
export function seasonFor(date = new Date()) {
    const y = date.getUTCFullYear(), start = date.getUTCMonth() >= 7 ? y : y - 1;
    return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}
export const SEASON = () => process.env.VOLLEY_SEASON || seasonFor();
export const POSITIONS = { pasor: 'Pasör', smacor: 'Smaçör', orta: 'Orta oyuncu', 'pasor-capraz': 'Pasör çaprazı', libero: 'Libero' };
export const TRANSFER_STATUS = { soylenti: 'Söylenti', gorusme: 'Görüşmeler sürüyor', resmi: 'Resmi' };

const matchSelect = {
    id: true, startAt: true, week: true, venue: true, status: true, homeScore: true, awayScore: true, sets: true, broadcaster: true, round: true, group: true,
    home: { select: { id: true, name: true, shortName: true, logo: true, clubId: true } },
    away: { select: { id: true, name: true, shortName: true, logo: true, clubId: true } },
    league: { select: { slug: true, name: true, sport: true } },
    article: { select: { slug: true, live: true, status: true } },
};
export const toMatchFull = (m) => ({ ...toMatch(m), broadcaster: m.broadcaster || '', round: m.round || '', group: m.group || '' });

const articleSel = {
    id: true, slug: true, title: true, summary: true, image: true, publishedAt: true, featured: true, sponsored: true, format: true,
    authorName: true, author: { select: { name: true } }, category: { select: { slug: true, label: true } },
};
const toCard = (a) => ({
    id: a.id, slug: a.slug, title: a.title, summary: a.summary, img: a.image, featured: a.featured, sponsored: a.sponsored, format: a.format,
    publishedAt: a.publishedAt?.toISOString() ?? null, author: a.authorName || a.author?.name || 'Gazetelerde', category: a.category.slug, categoryLabel: a.category.label,
});

// Adı geçen haberler (başlık ya da özette)
async function newsMentioning(terms, take = 8) {
    const t = terms.filter((x) => x && x.length >= 4);
    if (!t.length) return [];
    const rows = await prisma.article.findMany({
        where: { status: 'PUBLISHED', publishedAt: { lte: new Date() }, OR: t.flatMap((x) => [{ title: { contains: x, mode: 'insensitive' } }, { summary: { contains: x, mode: 'insensitive' } }]) },
        orderBy: { publishedAt: 'desc' }, take, select: articleSel,
    });
    return rows.map(toCard);
}

// Oyuncu istatistik toplamı (bir maç kümesinde)
export function sumStats(stats) {
    return stats.reduce((a, s) => ({ matches: a.matches + 1, points: a.points + s.points, attack: a.attack + s.attack, block: a.block + s.block, ace: a.ace + s.ace, mvp: a.mvp + (s.mvp ? 1 : 0) }),
        { matches: 0, points: 0, attack: 0, block: 0, ace: 0, mvp: 0 });
}

export const getPlayer = cache(async (slug) => {
    const p = await prisma.player.findUnique({
        where: { slug },
        include: {
            roster: { orderBy: { season: 'desc' }, include: { club: { select: { slug: true, name: true, logo: true } } } },
            transfers: { orderBy: { date: 'desc' }, include: { fromClub: { select: { slug: true, name: true } }, toClub: { select: { slug: true, name: true } } } },
            stats: { orderBy: { match: { startAt: 'desc' } }, take: 60, include: { match: { select: matchSelect } } },
        },
    });
    if (!p) return null;
    const season = SEASON();
    const current = p.roster.find((r) => r.season === season) || p.roster[0] || null;
    const seasonStats = p.stats.filter((s) => s.match.startAt >= seasonStart(season));
    const news = await newsMentioning([p.name, p.name.split(' ').slice(-1)[0].length >= 6 ? p.name.split(' ').slice(-1)[0] : null]);
    return { player: p, current, total: sumStats(seasonStats), recent: p.stats.slice(0, 10), news };
});

// "2025-26" -> 1 Ağustos 2025
export const seasonStart = (season) => new Date(Date.UTC(Number(String(season).slice(0, 4)) || new Date().getUTCFullYear(), 7, 1));

export const getClub = cache(async (slug) => {
    const c = await prisma.club.findUnique({
        where: { slug },
        include: {
            teams: { select: { id: true, league: { select: { slug: true, name: true, season: true, active: true } } } },
            roster: { where: { season: SEASON() }, orderBy: [{ number: 'asc' }], include: { player: true } },
        },
    });
    if (!c) return null;
    const teamIds = c.teams.map((t) => t.id);
    const now = new Date();
    const [upcoming, results, transfers, news] = await Promise.all([
        prisma.match.findMany({ where: { OR: [{ homeId: { in: teamIds } }, { awayId: { in: teamIds } }], status: { in: ['SCHEDULED', 'LIVE'] }, startAt: { gte: new Date(now.getTime() - 4 * 3600e3) } }, orderBy: { startAt: 'asc' }, take: 6, select: matchSelect }),
        prisma.match.findMany({ where: { OR: [{ homeId: { in: teamIds } }, { awayId: { in: teamIds } }], status: 'FINISHED' }, orderBy: { startAt: 'desc' }, take: 8, select: matchSelect }),
        prisma.transfer.findMany({ where: { OR: [{ fromClubId: c.id }, { toClubId: c.id }] }, orderBy: { date: 'desc' }, take: 12, include: { player: { select: { slug: true, name: true, position: true } }, fromClub: { select: { slug: true, name: true } }, toClub: { select: { slug: true, name: true } } } }),
        newsMentioning([c.name, c.shortName, c.name.split(' ')[0]]),
    ]);
    return { club: c, upcoming: upcoming.map(toMatchFull), results: results.map(toMatchFull), transfers, news };
});

// İstatistik liderleri: sezon (ve isteğe bağlı lig) bazında
export async function statLeaders({ leagueId, season = SEASON(), take = 10 } = {}) {
    const where = { match: { status: 'FINISHED', startAt: { gte: seasonStart(season) }, ...(leagueId ? { leagueId } : {}) } };
    const [points, block, ace] = await Promise.all(['points', 'block', 'ace'].map((k) =>
        prisma.matchStat.groupBy({ by: ['playerId'], where, _sum: { [k]: true }, _count: true, orderBy: { _sum: { [k]: 'desc' } }, take })));
    const ids = [...new Set([...points, ...block, ...ace].map((r) => r.playerId))];
    const players = await prisma.player.findMany({
        where: { id: { in: ids } },
        select: { id: true, slug: true, name: true, position: true, roster: { where: { season }, take: 1, select: { club: { select: { name: true, slug: true } } } } },
    });
    const byId = new Map(players.map((p) => [p.id, p]));
    const rows = (list, k) => list.filter((r) => (r._sum[k] || 0) > 0).map((r) => ({ player: byId.get(r.playerId), value: r._sum[k], matches: r._count })).filter((r) => r.player);
    return { points: rows(points, 'points'), block: rows(block, 'block'), ace: rows(ace, 'ace') };
}
