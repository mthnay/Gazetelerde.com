import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff, idParam } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';

// Konu sayfasının açıklaması / öne çıkarma / ad düzeltme; ya da başka etiketle birleştirme
export async function PATCH(request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const tag = id && (await prisma.tag.findUnique({ where: { id } }));
    if (!tag) return fail('Etiket bulunamadı.', 404);
    const b = (await readJson(request)) || {};

    if (b.mergeInto) {
        const target = await prisma.tag.findUnique({ where: { id: Number(b.mergeInto) } });
        if (!target || target.id === tag.id) return fail('Birleştirilecek etiket bulunamadı.');
        const links = await prisma.articleTag.findMany({ where: { tagId: tag.id }, select: { articleId: true } });
        await prisma.$transaction([
            prisma.articleTag.createMany({ data: links.map((l) => ({ articleId: l.articleId, tagId: target.id })), skipDuplicates: true }),
            prisma.tag.delete({ where: { id: tag.id } }),
        ]);
        revalidatePath(`/etiket/${tag.slug}`); revalidatePath(`/etiket/${target.slug}`);
        return ok();
    }
    const data = {};
    if (b.name !== undefined) {
        const name = String(b.name).replace(/\s+/g, ' ').trim().slice(0, 60);
        if (!name) return fail('Ad boş olamaz.');
        data.name = name; // adres (slug) değişmez, bağlantılar bozulmasın
    }
    if (b.description !== undefined) data.description = String(b.description).slice(0, 500);
    if (b.featured !== undefined) data.featured = !!b.featured;
    await prisma.tag.update({ where: { id }, data });
    revalidatePath(`/etiket/${tag.slug}`); revalidatePath('/');
    return ok();
}

export async function DELETE(_request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idParam(params);
    const tag = id && (await prisma.tag.findUnique({ where: { id } }));
    if (!tag) return fail('Etiket bulunamadı.', 404);
    await prisma.tag.delete({ where: { id } });
    revalidatePath(`/etiket/${tag.slug}`);
    return ok();
}
