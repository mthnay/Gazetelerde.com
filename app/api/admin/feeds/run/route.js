import { ok, rateLimit } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { pollAll } from '@/lib/feeds';

// "Şimdi tara" düğmesi
export async function POST() {
    const { user, error } = await requireStaff();
    if (error) return error;
    if (!rateLimit(`feeds-run:${user.id}`, 6, 10 * 60 * 1000)) return ok({ results: [], throttled: true });
    return ok({ results: await pollAll() });
}
