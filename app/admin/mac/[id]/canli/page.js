import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish } from '@/lib/permissions';
import LiveScoring from '@/components/admin/volley/LiveScoring';

export const metadata = { title: 'Canlı skor | Yönetim' };
export const dynamic = 'force-dynamic';

export default async function LiveScoringPage({ params }) {
    await requirePageUser(canPublish);
    const id = Number((await params).id);
    const m = Number.isInteger(id) && (await prisma.match.findUnique({ where: { id }, include: { home: true, away: true, league: true, article: { select: { id: true } } } }));
    if (!m) notFound();
    return <LiveScoring match={{ id: m.id, leagueId: m.leagueId, home: m.home.name, away: m.away.name, league: m.league.name, status: m.status, sets: Array.isArray(m.sets) ? m.sets : [], homeScore: m.homeScore ?? 0, awayScore: m.awayScore ?? 0, articleId: m.article?.id ?? null }} />;
}
