import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import { ok, fail, readJson, isEmail, rateLimit, clientIp } from '@/lib/api';
import { sendConfirmation } from '@/lib/newsletter/service';

// Bülten aboneliği (çift onay): kayıt + onay e-postası. Onaylanana kadar bülten gönderilmez.
export async function POST(request) {
    if (!rateLimit(`newsletter:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
        return fail('Çok fazla deneme. Lütfen daha sonra tekrar deneyin.', 429);
    }
    const body = await readJson(request);
    const email = String(body?.email || '').trim().toLowerCase();
    if (!isEmail(email) || email.length > 200) return fail('Lütfen geçerli bir e-posta adresi girin.');

    const existing = await prisma.subscriber.findUnique({ where: { email } });
    const sub = existing
        ? (existing.active && existing.confirmedAt ? existing
            : await prisma.subscriber.update({ where: { id: existing.id }, data: { active: true, unsubscribedAt: null, confirmedAt: existing.active ? existing.confirmedAt : null } }))
        : await prisma.subscriber.create({ data: { email, token: randomBytes(24).toString('base64url') } });

    if (!sub.confirmedAt) {
        try {
            await sendConfirmation(sub);
        } catch (e) {
            console.error('[bülten] onay e-postası gönderilemedi:', e?.message);
            return fail('Onay e-postası şu an gönderilemedi. Lütfen biraz sonra tekrar deneyin.', 503);
        }
    }
    // Zaten kayıtlıysa da aynı yanıt: hangi adreslerin abone olduğu dışarı sızmasın
    return ok({ message: 'Neredeyse tamam! Aboneliği başlatmak için e-postanıza gelen bağlantıya tıklayın.' });
}
