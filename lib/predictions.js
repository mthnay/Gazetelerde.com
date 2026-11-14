// Tahmin ligi: sonuçlanmış maç tahminlerinde doğru tahmin başına 10 puan
import 'server-only';
import { prisma } from '@/lib/db';
import { seasonStart, SEASON } from '@/lib/volley';

export const POINTS = 10;
// Gizlilik: sıralamada yalnızca ad ve soyadın baş harfi
export const publicName = (name = '') => { const [first, ...rest] = String(name).trim().split(/\s+/); return rest.length ? `${first} ${rest[rest.length - 1][0].toLocaleUpperCase('tr')}.` : first; };

export function periodStart(period) {
    if (period === 'hafta') {
        // İstanbul saatine göre bu haftanın pazartesisi
        const now = new Date(Date.now() + 3 * 3600e3);
        const day = (now.getUTCDay() + 6) % 7;
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day, -3));
    }
    return seasonStart(SEASON());
}

export async function leaderboard(period = 'sezon', take = 50) {
    const since = periodStart(period);
    const rows = await prisma.$queryRaw`
        SELECT v."userId" AS "userId",
               count(*) FILTER (WHERE v."optionId" = p."correctId")::int AS correct,
               count(*)::int AS total
        FROM "PollVote" v JOIN "Poll" p ON p.id = v."pollId"
        WHERE p.kind = 'tahmin' AND p."correctId" IS NOT NULL AND v."userId" IS NOT NULL AND p."createdAt" >= ${since}
        GROUP BY v."userId"
        ORDER BY correct DESC, total ASC
        LIMIT ${take}`;
    const users = await prisma.user.findMany({ where: { id: { in: rows.map((r) => r.userId) } }, select: { id: true, name: true } });
    const byId = new Map(users.map((u) => [u.id, u.name]));
    let rank = 0, prev = null;
    return rows.map((r, i) => {
        if (r.correct !== prev) { rank = i + 1; prev = r.correct; }
        return { rank, userId: r.userId, name: publicName(byId.get(r.userId)), correct: r.correct, total: r.total, points: r.correct * POINTS, accuracy: r.total ? Math.round((r.correct / r.total) * 100) : 0 };
    });
}
