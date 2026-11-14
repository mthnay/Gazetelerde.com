import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { applyPoint, trimSets } from '@/lib/volleyScore';
import { resolveMatchPolls } from '@/lib/polls';
import { queueMatchPush } from '@/lib/push';

// Canlı skor: { side: 'home'|'away', delta: 1|-1 }. Set ve maç sonu kurallar gereği otomatik.
export async function POST(request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const b = (await readJson(request)) || {};
    if (!['home', 'away'].includes(b.side)) return fail('Taraf seçin.');
    const delta = b.delta === -1 ? -1 : 1;

    // Aynı anda iki editör basarsa sayı kaybolmasın diye satır kilidiyle oku-yaz
    const result = await prisma.$transaction(async (tx) => {
        const [m] = await tx.$queryRaw`SELECT id, sets, status, "homeScore", "awayScore", "leagueId", "articleId" FROM "Match" WHERE id = ${id} FOR UPDATE`;
        if (!m) return null;
        const sets = Array.isArray(m.sets) ? m.sets : [];
        const r = applyPoint(sets, b.side, delta);
        const status = r.matchEnded ? 'FINISHED' : 'LIVE';
        await tx.match.update({ where: { id }, data: { sets: r.matchEnded ? trimSets(r.sets) : r.sets, homeScore: r.home, awayScore: r.away, status } });
        return { before: m.status, status, ...r, leagueId: m.leagueId, articleId: m.articleId };
    });
    if (!result) return fail('Maç bulunamadı.', 404);

    if (result.before !== result.status) {
        const m = { id, status: result.status, homeScore: result.home, awayScore: result.away };
        await resolveMatchPolls(m);
        await queueMatchPush(m, result.before);
    }
    // Sayfaları her sayıda değil, set ve maç sonunda tazele (canlı ekranlar API'den yoklar)
    if (result.setEnded || result.matchEnded || result.before !== result.status) {
        const l = await prisma.league.findUnique({ where: { id: result.leagueId }, select: { slug: true } });
        revalidatePath(`/mac/${id}`); revalidatePath('/mac-merkezi'); revalidatePath('/'); revalidatePath('/voleybol');
        if (l) revalidatePath(`/mac-merkezi/${l.slug}`);
    }
    return ok({ sets: result.sets, home: result.home, away: result.away, status: result.status, setEnded: result.setEnded, matchEnded: result.matchEnded });
}
