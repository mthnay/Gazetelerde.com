import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { mediaUsage, mediaArticles } from '@/lib/mediaUsage';

const idOf = async (params) => String((await params).id || '').replace(/[^a-z0-9]/gi, '');

// Ayrıntı: kullanıldığı haberler
export async function GET(_request, { params }) {
    const { error } = await requireStaff();
    if (error) return error;
    const id = await idOf(params);
    return ok({ articles: await mediaArticles(id) });
}

// Alternatif metin (erişilebilirlik ve görsel arama için)
export async function PATCH(request, { params }) {
    const { error } = await requireStaff();
    if (error) return error;
    const id = await idOf(params);
    const b = (await readJson(request)) || {};
    const r = await prisma.media.updateMany({ where: { id }, data: { alt: String(b.alt || '').trim().slice(0, 200) } });
    return r.count ? ok() : fail('Görsel bulunamadı.', 404);
}

// Yalnızca hiçbir yerde kullanılmayan görseller silinebilir (bozuk görsel bırakmamak için)
export async function DELETE(_request, { params }) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const id = await idOf(params);
    const uses = (await mediaUsage([id])).get(id);
    if (uses === undefined) return fail('Görsel bulunamadı.', 404);
    if (uses > 0) return fail(`Bu görsel ${uses} yerde kullanılıyor; önce oradan kaldırın.`, 409);
    await prisma.media.delete({ where: { id } });
    return ok();
}
