import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { pollSource } from '@/lib/feeds';

export async function PATCH(request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const body = await readJson(request);
    const data = {};
    if (typeof body?.active === 'boolean') data.active = body.active;
    if (body?.category !== undefined) {
        const c = body.category ? await prisma.category.findUnique({ where: { slug: String(body.category) } }) : null;
        data.categoryId = c?.id ?? null;
    }
    const res = await prisma.feedSource.updateMany({ where: { id: id ?? -1 }, data });
    if (!res.count) return fail('Kaynak bulunamadı.', 404);
    if (body?.poll) {
        const s = await prisma.feedSource.findUnique({ where: { id } });
        return ok({ poll: await pollSource(s) });
    }
    return ok();
}

export async function DELETE(_request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const res = await prisma.feedSource.deleteMany({ where: { id: id ?? -1 } });
    return res.count ? ok() : fail('Kaynak bulunamadı.', 404);
}
