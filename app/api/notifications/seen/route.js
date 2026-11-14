import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ok, fail } from '@/lib/api';

export async function POST() {
    const me = await getCurrentUser();
    if (!me) return fail('Giriş yapmalısınız.', 401);
    const now = new Date();
    await prisma.$transaction([
        prisma.user.update({ where: { id: me.id }, data: { notificationsSeenAt: now } }),
        prisma.userNotification.updateMany({ where: { userId: me.id, readAt: null }, data: { readAt: now } }),
    ]);
    return ok();
}
