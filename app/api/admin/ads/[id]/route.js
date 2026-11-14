import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { parseAd } from '@/lib/adInput';

export async function PATCH(request, { params }) {
    const { user, error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const ad = id && (await prisma.adSlot.findUnique({ where: { id } }));
    if (!ad) return fail('Reklam bulunamadı.', 404);
    if (ad.kind === 'kod' && user.role !== 'ADMIN') return fail('Kod reklamlarını yalnızca yönetici düzenleyebilir.', 403);
    const b = (await readJson(request)) || {};
    if (Object.keys(b).length === 1 && 'active' in b) {
        await prisma.adSlot.update({ where: { id }, data: { active: !!b.active } });
        return ok();
    }
    const parsed = parseAd({ ...ad, ...b }, user);
    if (parsed.error) return fail(parsed.error);
    await prisma.adSlot.update({ where: { id }, data: parsed.data });
    return ok();
}

export async function DELETE(_request, { params }) {
    const { user, error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const ad = id && (await prisma.adSlot.findUnique({ where: { id } }));
    if (!ad) return fail('Reklam bulunamadı.', 404);
    if (ad.kind === 'kod' && user.role !== 'ADMIN') return fail('Kod reklamlarını yalnızca yönetici silebilir.', 403);
    await prisma.adSlot.delete({ where: { id } });
    return ok();
}
