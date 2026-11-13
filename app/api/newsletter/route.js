import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import { ok, fail, readJson, isEmail, rateLimit, clientIp } from '@/lib/api';

// Bülten aboneliği. E-posta gönderimi henüz bağlı değil; aboneler veritabanında birikir.
export async function POST(request) {
    if (!rateLimit(`newsletter:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
        return fail('Çok fazla deneme. Lütfen daha sonra tekrar deneyin.', 429);
    }
    const body = await readJson(request);
    const email = String(body?.email || '').trim().toLowerCase();
    if (!isEmail(email) || email.length > 200) return fail('Lütfen geçerli bir e-posta adresi girin.');

    // Zaten kayıtlıysa da aynı yanıt: hangi adreslerin abone olduğu dışarı sızmasın
    await prisma.subscriber.upsert({
        where: { email },
        update: { active: true },
        create: { email, token: randomBytes(24).toString('base64url') },
    });
    return ok({ message: 'Teşekkürler! Bültene abone oldunuz.' });
}
