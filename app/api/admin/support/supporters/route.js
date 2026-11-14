import { prisma } from '@/lib/db';
import { ok, fail, readJson, isEmail } from '@/lib/api';
import { requireStaff } from '@/lib/adminApi';
import { canPublish } from '@/lib/permissions';

// Ödemesi alınan destekçiyi kaydet: e-posta bir üyeyle eşleşirse reklamsız okuma hemen açılır
export async function POST(request) {
    const { error } = await requireStaff(canPublish);
    if (error) return error;
    const b = (await readJson(request)) || {};
    const email = String(b.email || '').trim().toLowerCase();
    if (!isEmail(email)) return fail('Geçerli bir e-posta girin.');
    const tier = b.tierId ? await prisma.supportTier.findUnique({ where: { id: Number(b.tierId) } }) : null;
    let until = null;
    if (b.until) {
        until = new Date(b.until);
        if (Number.isNaN(until.getTime())) return fail('Geçersiz bitiş tarihi.');
    } else if (tier?.period === 'aylik') until = new Date(Date.now() + 31 * 864e5);
    else if (tier?.period === 'yillik') until = new Date(Date.now() + 366 * 864e5);
    else if (tier?.period === 'tek') until = new Date(Date.now() + 31 * 864e5); // tek seferlik destek: 1 ay reklamsız teşekkür
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });
    const s = await prisma.supporter.create({
        data: {
            email, userId: user?.id ?? null, name: String(b.name || user?.name || '').slice(0, 80),
            tier: tier?.name || String(b.tier || '').slice(0, 60), amount: Math.max(0, Math.round(Number(b.amount ?? tier?.amount) || 0)),
            until, note: String(b.note || '').slice(0, 300),
        },
        select: { id: true },
    });
    return ok({ id: s.id, linked: Boolean(user) }, 201);
}
