import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish } from '@/lib/permissions';
import { SEASON } from '@/lib/volley';
import VolleyAdmin from '@/components/admin/volley/VolleyAdmin';

export const metadata = { title: 'Voleybol verisi | Yönetim' };

export default async function VolleyAdminPage({ searchParams }) {
    await requirePageUser(canPublish);
    const tab = ['kulupler', 'oyuncular', 'transferler'].includes((await searchParams).sekme) ? (await searchParams).sekme : 'kulupler';
    const [clubs, players, transfers, teams] = await Promise.all([
        prisma.club.findMany({ orderBy: [{ national: 'desc' }, { name: 'asc' }], include: { _count: { select: { roster: { where: { season: SEASON() } } } }, teams: { select: { id: true } } } }),
        prisma.player.findMany({ orderBy: { name: 'asc' }, include: { roster: { orderBy: { season: 'desc' }, include: { club: { select: { id: true, name: true } } } } } }),
        prisma.transfer.findMany({ orderBy: { date: 'desc' }, take: 100, include: { player: { select: { name: true, slug: true } }, fromClub: { select: { name: true } }, toClub: { select: { name: true } } } }),
        prisma.team.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, clubId: true, league: { select: { name: true, season: true } } } }),
    ]);
    const iso = (d) => d?.toISOString() ?? null;
    return (
        <VolleyAdmin
            tab={tab}
            season={SEASON()}
            clubs={clubs.map((c) => ({ ...c, createdAt: iso(c.createdAt), rosterCount: c._count.roster, teamIds: c.teams.map((t) => t.id) }))}
            players={players.map((p) => ({ ...p, createdAt: iso(p.createdAt), roster: p.roster.map((r) => ({ id: r.id, season: r.season, number: r.number, captain: r.captain, club: r.club })) }))}
            transfers={transfers.map((t) => ({ ...t, date: iso(t.date) }))}
            teams={teams.map((t) => ({ id: t.id, label: `${t.name} — ${t.league.name} ${t.league.season}`, clubId: t.clubId }))}
        />
    );
}
