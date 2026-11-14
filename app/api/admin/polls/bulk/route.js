import { prisma } from '@/lib/db';
import { ok } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

// Önümüzdeki 7 günün (öne çıkan liglerdeki) maçları için, henüz yoksa tahmin oluşturur.
// Tahmin maç başladığında kapanır; maç bitince kendiliğinden sonuçlanır.
export async function POST() {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const now = new Date();
    const matches = await prisma.match.findMany({
        where: { status: 'SCHEDULED', startAt: { gt: now, lte: new Date(now.getTime() + 7 * 864e5) }, league: { active: true } },
        include: { home: true, away: true, league: true },
    });
    const existing = new Set((await prisma.poll.findMany({ where: { matchId: { in: matches.map((m) => m.id) } }, select: { matchId: true } })).map((p) => p.matchId));
    let created = 0;
    for (const m of matches) {
        if (existing.has(m.id)) continue;
        const options = [`${m.home.name} kazanır`, `${m.away.name} kazanır`, ...(m.league.sport === 'futbol' ? ['Berabere'] : [])];
        await prisma.poll.create({
            data: {
                question: `${m.home.name} - ${m.away.name}: kim kazanır?`, kind: 'tahmin', matchId: m.id, articleId: m.articleId, closesAt: m.startAt,
                options: { create: options.map((text, sort) => ({ text, sort })) },
            },
        });
        created++;
    }
    revalidatePath('/tahmin-ligi');
    return ok({ created, total: matches.length });
}
