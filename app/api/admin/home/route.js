import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { normalizeLayout } from '@/lib/homeLayout';
import { getHomeLayout, HOME_KEY } from '@/lib/homeData';

export async function GET() {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    return ok(await getHomeLayout());
}

// Düzeni kaydet: doğrulanır, kaydedilir, ana sayfa hemen tazelenir
export async function PUT(request) {
    const { user, error } = await requireStaff(canPublish);
    if (error) return error;
    const body = await readJson(request);
    const blocks = normalizeLayout(body?.blocks);
    if (!blocks.length) return fail('Ana sayfada en az bir blok olmalı.');
    if (!blocks.some((b) => b.enabled)) return fail('En az bir blok açık olmalı.');
    await prisma.siteSetting.upsert({
        where: { key: HOME_KEY },
        create: { key: HOME_KEY, value: blocks, updatedById: user.id },
        update: { value: blocks, updatedById: user.id },
    });
    revalidatePath('/');
    return ok({ blocks });
}

// Özgün düzene dön
export async function DELETE() {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    await prisma.siteSetting.deleteMany({ where: { key: HOME_KEY } });
    revalidatePath('/');
    return ok(await getHomeLayout());
}
