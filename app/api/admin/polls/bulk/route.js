import { prisma } from '@/lib/db';
import { ok } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';
import { ensureMatchPolls } from '@/lib/polls';

// Önümüzdeki 7 günün maçları için, henüz yoksa kazanan ve set skoru tahminleri oluşturur.
// Tahmin maç başladığında kapanır; maç bitince kendiliğinden sonuçlanır.
export async function POST() {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const now = new Date();
    const matches = await prisma.match.findMany({
        where: { status: 'SCHEDULED', startAt: { gt: now, lte: new Date(now.getTime() + 7 * 864e5) }, league: { active: true } },
        include: { home: true, away: true, league: true },
    });
    let created = 0;
    for (const m of matches) created += await ensureMatchPolls(m);
    revalidatePath('/tahmin-ligi');
    return ok({ created, total: matches.length });
}
