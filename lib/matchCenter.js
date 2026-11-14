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
    broadcaster: true, round: true, group: true, slot: true,
};

// İstemciye giden düz yapı
export const toMatch = (m) => ({
    id: m.id, startAt: m.startAt.toISOString(), week: m.week, venue: m.venue, status: m.status,
    homeScore: m.homeScore, awayScore: m.awayScore, sets: Array.isArray(m.sets) ? m.sets : [],
    home: m.home, away: m.away, league: m.league,
    articleSlug: m.article?.status === 'PUBLISHED' ? m.article.slug : null, live: Boolean(m.article?.live),
    broadcaster: m.broadcaster || '', round: m.round || '', group: m.group || '', slot: m.slot ?? null,
});

export const getLeagues = cache(() =>
    prisma.league.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], select: { id: true, slug: true, name: true, season: true, sport: true, kind: true, gender: true, featured: true } })
);

export const getLeague = cache(async (slug) => {
    const league = await prisma.league.findUnique({
        where: { slug },
        select: { id: true, slug: true, name: true, season: true, sport: true, active: true, kind: true, gender: true, teams: { orderBy: { name: 'asc' }, select: { id: true, name: true, shortName: true, logo: true, penalty: true, club: { select: { slug: true } } } } },
    });
    if (!league || !league.active) return null;
    const matches = await prisma.match.findMany({ where: { leagueId: league.id }, orderBy: [{ startAt: 'asc' }], select: matchSelect });
    const flat = matches.map((m) => ({ ...m, homeId: m.home.id, awayId: m.away.id }));
    // Grup aşaması: her grubun kendi puan durumu (gruplar maçlardaki "group" alanından)
    const groupNames = [...new Set(matches.map((m) => m.group).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr'));
    const groups = groupNames.map((g) => {
        const gm = flat.filter((m) => m.group === g);
        const ids = new Set(gm.flatMap((m) => [m.homeId, m.awayId]));
        return { name: g, standings: computeStandings(league.teams.filter((t) => ids.has(t.id)), gm, league.sport) };
    });
    // Ana puan durumu: grup ve eleme maçları hariç normal sezon
    const regular = flat.filter((m) => !m.group && !m.round);
    const standings = regular.length || !groups.length ? computeStandings(league.teams, regular, league.sport) : [];
    return { league, matches: matches.map(toMatch), standings, groups, bracket: buildBracket(matches.filter((m) => m.round).map(toMatch)) };
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

// Eleme ağacı: turlar ilk maç tarihine göre sıralanır; aynı iki takımın maçları tek seri olarak toplanır (ör. 3 maç üzerinden)
export function buildBracket(matches) {
    const rounds = new Map();
    for (const m of matches) {
        if (!rounds.has(m.round)) rounds.set(m.round, []);
        rounds.get(m.round).push(m);
    }
    return [...rounds.entries()]
        .map(([name, ms]) => {
            const series = new Map();
            for (const m of ms) {
                const key = [m.home.id, m.away.id].sort((a, b) => a - b).join('-');
                if (!series.has(key)) series.set(key, { a: m.home, b: m.away, matches: [], slot: m.slot ?? 99 });
                series.get(key).matches.push(m);
            }
            const list = [...series.values()].map((s) => {
                let wa = 0, wb = 0;
                for (const m of s.matches) {
                    if (m.status !== 'FINISHED' || m.homeScore == null) continue;
                    const aHome = m.home.id === s.a.id;
                    const aWon = aHome ? m.homeScore > m.awayScore : m.awayScore > m.homeScore;
                    if (aWon) wa++; else wb++;
                }
                return { ...s, wa, wb, first: Math.min(...s.matches.map((m) => Date.parse(m.startAt))) };
            }).sort((x, y) => x.slot - y.slot || x.first - y.first);
            return { name, series: list, first: Math.min(...list.map((x) => x.first)) };
        })
        .sort((x, y) => x.first - y.first);
}

// Ana sayfa / voleybol merkezi için öne çıkan liglerin kısa puan durumları
export async function getFeaturedStandings(limit = 3) {
    const leagues = await prisma.league.findMany({ where: { active: true, featured: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], take: limit, select: { slug: true } });
    const out = [];
    for (const l of leagues) {
        const d = await getLeague(l.slug);
        if (d?.standings?.length) out.push({ league: d.league, standings: d.standings.slice(0, 8) });
    }
    return out;
}
