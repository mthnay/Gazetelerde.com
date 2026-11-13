import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ok, fail } from '@/lib/api';

async function toggle(params, on) {
    const me = await getCurrentUser();
    if (!me) return fail('Takip etmek için giriş yapmalısınız.', 401);
    const { slug } = await params;
    const cat = await prisma.category.findUnique({ where: { slug: String(slug) }, select: { id: true } });
    if (!cat) return fail('Kategori bulunamadı.', 404);

    if (on) {
        await prisma.categoryFollow.upsert({
            where: { userId_categoryId: { userId: me.id, categoryId: cat.id } },
            update: {}, create: { userId: me.id, categoryId: cat.id },
        });
    } else {
        await prisma.categoryFollow.deleteMany({ where: { userId: me.id, categoryId: cat.id } });
    }
    return ok({ following: on });
}

export const POST = (_r, { params }) => toggle(params, true);
export const DELETE = (_r, { params }) => toggle(params, false);
