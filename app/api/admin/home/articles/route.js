import { prisma } from '@/lib/db';
import { ok } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';

const select = { id: true, title: true, publishedAt: true, status: true, image: true, category: { select: { label: true } }, sourceName: true };

// Sabitlenecek haberi seçmek için: ?q=başlıkta ara  ya da  ?ids=1,2,3 (seçili olanların bilgisi)
export async function GET(request) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const url = new URL(request.url);
    const ids = String(url.searchParams.get('ids') || '').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 50);
    if (ids.length) return ok({ articles: await prisma.article.findMany({ where: { id: { in: ids } }, select }) });
    const q = String(url.searchParams.get('q') || '').trim().slice(0, 100);
    const articles = await prisma.article.findMany({
        where: { status: 'PUBLISHED', publishedAt: { lte: new Date() }, ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}) },
        orderBy: { publishedAt: 'desc' }, take: 20, select,
    });
    return ok({ articles });
}
