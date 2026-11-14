import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish } from '@/lib/permissions';
import { SEASON } from '@/lib/volley';
import MatchStatsEditor from '@/components/admin/volley/MatchStatsEditor';

export const metadata = { title: 'Maç istatistiği | Yönetim' };

export default async function MatchStatsPage({ params }) {
    await requirePageUser(canPublish);
    const id = Number((await params).id);
    const m = Number.isInteger(id) && (await prisma.match.findUnique({
        where: { id },
        include: { home: { include: { club: true } }, away: { include: { club: true } }, league: true, stats: true },
    }));
    if (!m) notFound();
    const roster = async (club) => (club ? prisma.rosterEntry.findMany({
        where: { clubId: club.id, season: m.league.season || SEASON() }, orderBy: { number: 'asc' },
        select: { number: true, player: { select: { id: true, name: true, position: true } } },
    }) : []);
    const [homeRoster, awayRoster] = await Promise.all([roster(m.home.club), roster(m.away.club)]);
    return (
        <MatchStatsEditor
            match={{ id: m.id, leagueId: m.leagueId, home: m.home.name, away: m.away.name, homeClub: m.home.club?.name ?? null, awayClub: m.away.club?.name ?? null, score: m.homeScore != null ? `${m.homeScore}-${m.awayScore}` : '' }}
            homeRoster={homeRoster.map((r) => ({ ...r.player, number: r.number }))}
            awayRoster={awayRoster.map((r) => ({ ...r.player, number: r.number }))}
            initial={m.stats}
        />
    );
}
