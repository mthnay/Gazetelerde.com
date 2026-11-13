import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { MAX_ARTICLES } from '@/lib/newsletter/service';

// Taslak / zamanlanmış sayının içeriğini günceller
export async function PATCH(request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const issue = id && (await prisma.newsletterIssue.findUnique({ where: { id } }));
    if (!issue) return fail('Sayı bulunamadı.', 404);
    if (!['DRAFT', 'SCHEDULED'].includes(issue.status)) return fail('Gönderilmiş ya da gönderilmekte olan sayı değiştirilemez.', 409);
    const b = (await readJson(request)) || {};
    const data = {};
    if (b.subject !== undefined) {
        const s = String(b.subject).trim();
        if (!s) return fail('Konu boş olamaz.');
        data.subject = s.slice(0, 150);
    }
    if (b.preheader !== undefined) data.preheader = String(b.preheader).slice(0, 200);
    if (b.intro !== undefined) data.intro = String(b.intro).slice(0, 2000);
    if (b.articleIds !== undefined) {
        if (!Array.isArray(b.articleIds)) return fail('Geçersiz haber listesi.');
        data.articleIds = [...new Set(b.articleIds.map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, MAX_ARTICLES);
    }
    const saved = await prisma.newsletterIssue.update({ where: { id }, data });
    return ok({ issue: { id: saved.id, updatedAt: saved.updatedAt } });
}

export async function DELETE(_request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const r = await prisma.newsletterIssue.deleteMany({ where: { id: id || 0, status: { in: ['DRAFT', 'CANCELLED'] } } });
    if (!r.count) return fail('Yalnızca taslak ya da iptal edilmiş sayılar silinebilir.', 409);
    return ok();
}
