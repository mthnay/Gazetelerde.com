import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';

export const dynamic = 'force-dynamic';

// Canlı maç ekranının yokladığı hafif uç: skor, setler, durum
export async function GET(_request, { params }) {
    const id = Number((await params).id);
    const m = Number.isInteger(id) && (await prisma.match.findUnique({ where: { id }, select: { id: true, status: true, homeScore: true, awayScore: true, sets: true, updatedAt: true } }));
    if (!m) return fail('Maç bulunamadı.', 404);
    return ok({ match: { ...m, sets: Array.isArray(m.sets) ? m.sets : [], updatedAt: m.updatedAt.toISOString() } }, 200);
}
