import { prisma } from '@/lib/db';
import { requirePageUser } from '@/lib/adminPage';
import { canPublish } from '@/lib/permissions';
import PollAdmin from '@/components/admin/PollAdmin';

export const metadata = { title: 'Anketler | Yönetim' };

export default async function PollsPage() {
    await requirePageUser(canPublish);
    const [polls, matches] = await Promise.all([
        prisma.poll.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { options: { orderBy: { sort: 'asc' } }, article: { select: { slug: true, title: true } } } }),
        prisma.match.findMany({
            where: { status: { in: ['SCHEDULED', 'LIVE'] } }, orderBy: { startAt: 'asc' }, take: 40,
            select: { id: true, startAt: true, home: { select: { name: true } }, away: { select: { name: true } }, league: { select: { name: true } } },
        }),
    ]);
    return (
        <>
            <header className="admin-header">
                <div><h1>Anketler ve tahminler</h1><p>Haberlere bağlanan anketler haberin altında görünür; her anketin paylaşılabilir bir sayfası da vardır (/anket/…). Maç tahminleri maç bitince kendiliğinden sonuçlanır.</p></div>
            </header>
            <PollAdmin
                polls={polls.map((p) => ({
                    id: p.id, question: p.question, kind: p.kind, correctId: p.correctId, matchId: p.matchId,
                    closesAt: p.closesAt?.toISOString() ?? null, createdAt: p.createdAt.toISOString(), article: p.article,
                    options: p.options.map((o) => ({ id: o.id, text: o.text, votes: o.votes })),
                }))}
                matches={matches.map((m) => ({ id: m.id, label: `${m.home.name} - ${m.away.name} (${m.league.name}, ${new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }).format(m.startAt)})` }))}
            />
        </>
    );
}
