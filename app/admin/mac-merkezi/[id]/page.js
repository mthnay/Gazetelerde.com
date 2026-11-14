import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish } from '@/lib/permissions';
import LeagueAdmin from '@/components/admin/matches/LeagueAdmin';

export const metadata = { title: 'Lig | Maç Merkezi' };

export default async function AdminLeague({ params }) {
    await requirePageUser(canPublish);
    const id = Number((await params).id);
    const l = Number.isInteger(id) && (await prisma.league.findUnique({
        where: { id },
        include: {
            teams: { orderBy: { name: 'asc' } },
            matches: { orderBy: { startAt: 'asc' }, include: { article: { select: { slug: true } } } },
        },
    }));
    if (!l) notFound();
    return (
        <LeagueAdmin
            league={{ id: l.id, slug: l.slug, name: l.name, season: l.season, sport: l.sport, active: l.active }}
            teams={l.teams.map((t) => ({ id: t.id, name: t.name, shortName: t.shortName, logo: t.logo }))}
            matches={l.matches.map((m) => ({
                id: m.id, homeId: m.homeId, awayId: m.awayId, startAt: m.startAt.toISOString(), week: m.week, venue: m.venue, status: m.status,
                homeScore: m.homeScore, awayScore: m.awayScore, sets: Array.isArray(m.sets) ? m.sets : [], articleSlug: m.article?.slug ?? '',
            }))}
        />
    );
}
