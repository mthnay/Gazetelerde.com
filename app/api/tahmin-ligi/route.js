import { ok } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { leaderboard } from '@/lib/predictions';

export const dynamic = 'force-dynamic';

// Okurun kendi sırası (sayfanın kendisi önbellekten gelir; bu uç kişiye özel)
export async function GET(request) {
    const me = await getCurrentUser();
    if (!me) return ok({ me: null });
    const period = new URL(request.url).searchParams.get('donem') === 'hafta' ? 'hafta' : 'sezon';
    const rows = await leaderboard(period, 1000);
    const mine = rows.find((r) => r.userId === me.id);
    return ok({ me: mine ? { rank: mine.rank, points: mine.points, correct: mine.correct, exact: mine.exact, total: mine.total, of: rows.length } : { rank: null } });
}
