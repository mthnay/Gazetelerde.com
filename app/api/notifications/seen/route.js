import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ok, fail } from '@/lib/api';

export async function POST() {
    const me = await getCurrentUser();
    if (!me) return fail('Giriş yapmalısınız.', 401);
    await prisma.user.update({ where: { id: me.id }, data: { notificationsSeenAt: new Date() } });
    return ok();
}
