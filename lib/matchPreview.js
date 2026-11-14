// Maç önü eşleşme kartı: form, aradaki maçlar, puan durumundaki yer
import 'server-only';
import { prisma } from '@/lib/db';
import { getLeague } from '@/lib/matchCenter';

const sel = {
    id: true, startAt: true, homeScore: true, awayScore: true, homeId: true, awayId: true,
    home: { select: { id: true, name: true, clubId: true } }, away: { select: { id: true, name: true, clubId: true } },
    league: { select: { name: true } },
};

// Bir takımın (kulübün tüm lig kayıtlarıyla) son maçları
async function lastMatches(team, before, take = 5) {
    const ids = team.clubId ? (await prisma.team.findMany({ where: { clubId: team.clubId }, select: { id: true } })).map((t) => t.id) : [team.id];
    const rows = await prisma.match.findMany({
        where: { status: 'FINISHED', homeScore: { not: null }, startAt: { lt: before }, OR: [{ homeId: { in: ids } }, { awayId: { in: ids } }] },
        orderBy: { startAt: 'desc' }, take, select: sel,
    });
    return rows.map((m) => {
        const isHome = ids.includes(m.homeId);
        const my = isHome ? m.homeScore : m.awayScore, their = isHome ? m.awayScore : m.homeScore;
        return { id: m.id, date: m.startAt.toISOString(), opponent: isHome ? m.away.name : m.home.name, home: isHome, score: `${my}-${their}`, result: my > their ? 'G' : 'M' };
    });
}

export async function getPreview(match) {
    const before = match.status === 'SCHEDULED' ? new Date(8.64e15) : match.startAt;
    const ids = async (t) => (t.clubId ? (await prisma.team.findMany({ where: { clubId: t.clubId }, select: { id: true } })).map((x) => x.id) : [t.id]);
    const [homeIds, awayIds] = await Promise.all([ids(match.home), ids(match.away)]);
    const [homeForm, awayForm, h2h, league] = await Promise.all([
        lastMatches(match.home, before),
        lastMatches(match.away, before),
        prisma.match.findMany({
            where: {
                status: 'FINISHED', homeScore: { not: null }, id: { not: match.id }, startAt: { lt: before },
                OR: [{ homeId: { in: homeIds }, awayId: { in: awayIds } }, { homeId: { in: awayIds }, awayId: { in: homeIds } }],
            },
            orderBy: { startAt: 'desc' }, take: 5, select: sel,
        }),
        getLeague(match.league.slug),
    ]);
    const pos = (teamId) => {
        const i = league?.standings?.findIndex((r) => r.team.id === teamId) ?? -1;
        return i < 0 ? null : { rank: i + 1, ...league.standings[i] };
    };
    // Aradaki maçlarda galibiyet sayıları (bu maçın ev sahibi açısından)
    let hw = 0, aw = 0;
    for (const m of h2h) {
        const homeSideIsOurHome = homeIds.includes(m.homeId);
        const ourHomeWon = homeSideIsOurHome ? m.homeScore > m.awayScore : m.awayScore > m.homeScore;
        if (ourHomeWon) hw++; else aw++;
    }
    return {
        home: { form: homeForm, table: pos(match.home.id) },
        away: { form: awayForm, table: pos(match.away.id) },
        h2h: { homeWins: hw, awayWins: aw, matches: h2h.map((m) => ({ id: m.id, date: m.startAt.toISOString(), home: m.home.name, away: m.away.name, score: `${m.homeScore}-${m.awayScore}`, league: m.league.name })) },
    };
}
