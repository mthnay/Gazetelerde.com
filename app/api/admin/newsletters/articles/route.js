import { prisma } from '@/lib/db';
import { ok } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';

// Bülten için haber seçici: yayındaki haberlerde arama (varsayılan: en yeniler)
export async function GET(request) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const sp = new URL(request.url).searchParams;
    const q = String(sp.get('q') || '').trim().slice(0, 100);
    const ids = String(sp.get('ids') || '').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 50);
    const select = { id: true, title: true, image: true, publishedAt: true, viewCount: true, category: { select: { label: true } } };
    const map = (a) => ({ id: a.id, title: a.title, image: a.image, publishedAt: a.publishedAt?.toISOString(), views: a.viewCount, category: a.category.label });
    if (ids.length) {
        const rows = await prisma.article.findMany({ where: { id: { in: ids } }, select });
        return ok({ articles: rows.map(map) });
    }
    const rows = await prisma.article.findMany({
        where: { status: 'PUBLISHED', publishedAt: { lte: new Date() }, ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}) },
        orderBy: { publishedAt: 'desc' }, take: 30, select,
    });
    return ok({ articles: rows.map(map) });
}
