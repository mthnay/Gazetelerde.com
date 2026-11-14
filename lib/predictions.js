// Tahmin ligi: doğru kazanan tahmini 10, doğru set skoru tahmini 25 puan
import 'server-only';
import { prisma } from '@/lib/db';
import { seasonStart, SEASON } from '@/lib/volley';

export const POINTS = 10; // kazananı bilmek
export const SCORE_POINTS = 25; // set skorunu tam bilmek
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

export async function leaderboard(period = 'sezon', take = 50, userIds = null) {
    const since = periodStart(period);
    const rows = await prisma.$queryRaw`
        SELECT v."userId" AS "userId",
               count(*) FILTER (WHERE v."optionId" = p."correctId")::int AS correct,
               count(*) FILTER (WHERE v."optionId" = p."correctId" AND p.kind = 'skor')::int AS exact,
               count(*)::int AS total,
               (count(*) FILTER (WHERE v."optionId" = p."correctId" AND p.kind = 'tahmin') * ${POINTS}
                + count(*) FILTER (WHERE v."optionId" = p."correctId" AND p.kind = 'skor') * ${SCORE_POINTS})::int AS points
        FROM "PollVote" v JOIN "Poll" p ON p.id = v."pollId"
        WHERE p.kind IN ('tahmin', 'skor') AND p."correctId" IS NOT NULL AND v."userId" IS NOT NULL AND p."createdAt" >= ${since}
          AND (${userIds === null} OR v."userId" = ANY(${userIds ?? []}::text[]))
        GROUP BY v."userId"
        ORDER BY points DESC, correct DESC, total ASC
        LIMIT ${take}`;
    const users = await prisma.user.findMany({ where: { id: { in: rows.map((r) => r.userId) } }, select: { id: true, name: true } });
    const byId = new Map(users.map((u) => [u.id, u.name]));
    let rank = 0, prev = null;
    return rows.map((r, i) => {
        if (r.points !== prev) { rank = i + 1; prev = r.points; }
        return { rank, userId: r.userId, name: publicName(byId.get(r.userId)), correct: r.correct, exact: r.exact, total: r.total, points: r.points, accuracy: r.total ? Math.round((r.correct / r.total) * 100) : 0 };
    });
}

// Geçen haftanın (pazartesi-pazar) en iyi tahmincisi
export async function predictorOfLastWeek() {
    const thisWeek = periodStart('hafta');
    const lastWeek = new Date(thisWeek.getTime() - 7 * 864e5);
    const [top] = await prisma.$queryRaw`
        SELECT v."userId" AS "userId",
               (count(*) FILTER (WHERE v."optionId" = p."correctId" AND p.kind = 'tahmin') * ${POINTS}
                + count(*) FILTER (WHERE v."optionId" = p."correctId" AND p.kind = 'skor') * ${SCORE_POINTS})::int AS points
        FROM "PollVote" v JOIN "Poll" p ON p.id = v."pollId"
        WHERE p.kind IN ('tahmin', 'skor') AND p."correctId" IS NOT NULL AND v."userId" IS NOT NULL AND p."createdAt" >= ${lastWeek} AND p."createdAt" < ${thisWeek}
        GROUP BY v."userId" HAVING count(*) FILTER (WHERE v."optionId" = p."correctId") > 0
        ORDER BY points DESC LIMIT 1`;
    if (!top) return null;
    const u = await prisma.user.findUnique({ where: { id: top.userId }, select: { name: true } });
    return { userId: top.userId, name: publicName(u?.name), points: top.points };
}
