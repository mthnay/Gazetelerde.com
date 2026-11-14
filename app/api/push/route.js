import { prisma } from '@/lib/db';
import { ok, fail, readJson, rateLimit, clientIp } from '@/lib/api';
import { pushEnabled } from '@/lib/push';
import { getCurrentUser } from '@/lib/auth';

// Tarayıcı bildirim aboneliği kaydı. Kişisel veri tutulmaz: yalnızca tarayıcının verdiği uç nokta ve anahtarlar.
export async function POST(request) {
    if (!pushEnabled()) return fail('Bildirimler şu an kapalı.', 503);
    if (!rateLimit(`push:${clientIp(request)}`, 10, 60 * 60 * 1000)) return fail('Çok fazla deneme.', 429);
    const b = (await readJson(request)) || {};
    const endpoint = String(b.endpoint || '');
    const p256dh = String(b.keys?.p256dh || ''), auth = String(b.keys?.auth || '');
    if (!/^https:\/\/\S+$/.test(endpoint) || endpoint.length > 1000 || !p256dh || !auth || p256dh.length > 200 || auth.length > 100) {
        return fail('Geçersiz abonelik.');
    }
    // Giriş yapmış okurun aboneliği hesabına bağlanır (takım bildirimleri için)
    const userId = (await getCurrentUser())?.id ?? null;
    await prisma.pushSubscription.upsert({
        where: { endpoint }, update: { p256dh, auth, failures: 0, ...(userId ? { userId } : {}) }, create: { endpoint, p256dh, auth, categories: [], userId },
    });
    return ok();
}

export async function DELETE(request) {
    const b = (await readJson(request)) || {};
    await prisma.pushSubscription.deleteMany({ where: { endpoint: String(b.endpoint || '') } });
    return ok();
}
