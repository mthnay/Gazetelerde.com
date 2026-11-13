import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ok, fail } from '@/lib/api';

// Takip edilen kategorilerdeki son haberler; zil en son açıldıktan sonra çıkanlar "yeni"
export async function GET() {
    const me = await getCurrentUser();
    if (!me) return fail('Giriş yapmalısınız.', 401);

    const user = await prisma.user.findUnique({
        where: { id: me.id },
        select: { notificationsSeenAt: true, follows: { select: { categoryId: true } } },
    });
    const categoryIds = user.follows.map((f) => f.categoryId);
    if (!categoryIds.length) return ok({ following: 0, unread: 0, items: [] });

    const now = new Date();
    const base = { status: 'PUBLISHED', categoryId: { in: categoryIds }, publishedAt: { lte: now } };
    const [items, unread] = await Promise.all([
        prisma.article.findMany({
            where: base, orderBy: { publishedAt: 'desc' }, take: 10,
            select: { id: true, slug: true, title: true, publishedAt: true, category: { select: { label: true } } },
        }),
        prisma.article.count({ where: { ...base, publishedAt: { gt: user.notificationsSeenAt, lte: now } } }),
    ]);

    return ok({
        following: categoryIds.length,
        unread,
        items: items.map((a) => ({
            id: a.id, slug: a.slug, title: a.title, category: a.category.label,
            publishedAt: a.publishedAt.toISOString(),
            isNew: a.publishedAt > user.notificationsSeenAt,
        })),
    });
}
