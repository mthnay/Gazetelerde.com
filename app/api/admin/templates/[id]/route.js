import { prisma } from '@/lib/db';
import { ok, fail } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';

// Şablonu yalnızca oluşturan ya da editör/yönetici silebilir
export async function DELETE(_request, { params }) {
    const { user, error } = await requireStaff();
    if (error) return error;
    const id = await idParam(params);
    const t = id ? await prisma.articleTemplate.findUnique({ where: { id }, select: { createdById: true } }) : null;
    if (!t) return fail('Şablon bulunamadı.', 404);
    if (t.createdById !== user.id && !canPublish(user)) return fail('Bu şablonu silme yetkiniz yok.', 403);
    await prisma.articleTemplate.delete({ where: { id } });
    return ok();
}
