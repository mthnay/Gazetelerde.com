import { prisma } from '@/lib/db';
import { ok } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';

// Etiket önerisi (haber stüdyosu)
export async function GET(request) {
    const { error } = await requireStaff();
    if (error) return error;
    const q = String(new URL(request.url).searchParams.get('q') || '').trim().slice(0, 60);
    const rows = await prisma.tag.findMany({
        where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
        orderBy: { articles: { _count: 'desc' } }, take: 10,
        select: { id: true, name: true, slug: true, _count: { select: { articles: true } } },
    });
    return ok({ tags: rows.map((t) => ({ id: t.id, name: t.name, slug: t.slug, count: t._count.articles })) });
}
