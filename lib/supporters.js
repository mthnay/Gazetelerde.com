import { prisma } from '@/lib/db';

// Okurun aktif destekçiliği (reklamsız okuma) var mı?
export async function getSupport(userId) {
    if (!userId) return null;
    return prisma.supporter.findFirst({
        where: { userId, OR: [{ until: null }, { until: { gt: new Date() } }] },
        orderBy: { createdAt: 'desc' },
        select: { tier: true, until: true },
    });
}
