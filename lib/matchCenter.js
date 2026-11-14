// Maç merkezi veri katmanı (sunucu)
import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/db';
import { computeStandings } from '@/lib/standings';

const matchSelect = {
    id: true, startAt: true, week: true, venue: true, status: true, homeScore: true, awayScore: true, sets: true,
    home: { select: { id: true, name: true, shortName: true, logo: true } },
    away: { select: { id: true, name: true, shortName: true, logo: true } },
    league: { select: { slug: true, name: true, sport: true } },
    article: { select: { slug: true, live: true, status: true } },
};

// İstemciye giden düz yapı
export const toMatch = (m) => ({
    id: m.id, startAt: m.startAt.toISOString(), week: m.week, venue: m.venue, status: m.status,
    homeScore: m.homeScore, awayScore: m.awayScore, sets: Array.isArray(m.sets) ? m.sets : [],
    home: m.home, away: m.away, league: m.league,
    articleSlug: m.article?.status === 'PUBLISHED' ? m.article.slug : null, live: Boolean(m.article?.live),
});

export const getLeagues = cache(() =>
    prisma.league.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], select: { id: true, slug: true, name: true, season: true, sport: true } })
);

export const getLeague = cache(async (slug) => {
    const league = await prisma.league.findUnique({
        where: { slug },
        select: { id: true, slug: true, name: true, season: true, sport: true, active: true, teams: { orderBy: { name: 'asc' }, select: { id: true, name: true, shortName: true, logo: true } } },
    });
    if (!league || !league.active) return null;
    const matches = await prisma.match.findMany({ where: { leagueId: league.id }, orderBy: [{ startAt: 'asc' }], select: matchSelect });
    const standings = computeStandings(league.teams, matches.map((m) => ({ ...m, homeId: m.home.id, awayId: m.away.id })), league.sport);
    return { league, matches: matches.map(toMatch), standings };
});

// Ana sayfa / maç merkezi: canlı + bugün + önümüzdeki 7 gün ve son sonuçlar
export async function getMatchDay() {
    const now = new Date();
    const [live, upcoming, results] = await Promise.all([
        prisma.match.findMany({ where: { status: 'LIVE', league: { active: true } }, orderBy: { startAt: 'asc' }, select: matchSelect }),
        prisma.match.findMany({
            where: { status: 'SCHEDULED', startAt: { gte: new Date(now.getTime() - 3 * 3600e3), lte: new Date(now.getTime() + 7 * 864e5) }, league: { active: true } },
            orderBy: { startAt: 'asc' }, take: 30, select: matchSelect,
        }),
        prisma.match.findMany({ where: { status: 'FINISHED', league: { active: true } }, orderBy: { startAt: 'desc' }, take: 12, select: matchSelect }),
    ]);
    return { live: live.map(toMatch), upcoming: upcoming.map(toMatch), results: results.map(toMatch) };
}
