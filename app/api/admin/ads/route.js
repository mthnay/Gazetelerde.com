import { prisma } from '@/lib/db';
import { ok, fail, readJson } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';
import { parseAd } from '@/lib/adInput';

export async function POST(request) {
    const { user, error } = await requireStaff(canPublish);
    if (error) return error;
    const parsed = parseAd((await readJson(request)) || {}, user);
    if (parsed.error) return fail(parsed.error);
    const ad = await prisma.adSlot.create({ data: parsed.data, select: { id: true } });
    return ok({ id: ad.id }, 201);
}
