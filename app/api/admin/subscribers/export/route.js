import { prisma } from '@/lib/db';
import { requireStaff } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';

const cell = (v) => {
    const s = v == null ? '' : v instanceof Date ? v.toISOString() : String(v);
    // CSV enjeksiyonuna karşı (=, +, -, @ ile başlayan hücreler)
    return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

export async function GET() {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const rows = await prisma.subscriber.findMany({ orderBy: { createdAt: 'asc' } });
    const csv = ['e-posta,durum,kayit,onay,ayrilma',
        ...rows.map((r) => [r.email, !r.active ? 'ayrildi' : r.confirmedAt ? 'onayli' : 'onay-bekliyor', r.createdAt, r.confirmedAt, r.unsubscribedAt].map(cell).join(','))].join('\n');
    return new Response('﻿' + csv, {
        headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="bulten-aboneleri.csv"', 'Cache-Control': 'no-store' },
    });
}
