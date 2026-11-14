import QRCode from 'qrcode';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';
import { ok, fail, readJson, rateLimit } from '@/lib/api';
import { generateSecret, otpauthUrl, encryptSecret, decryptSecret, verifyTotp, generateRecoveryCodes, hashCode } from '@/lib/totp';

// İki adımlı doğrulama kurulumu: start -> (uygulamada QR okutulur) -> enable(code) ; disable(password, code)
export async function POST(request) {
    const me = await getCurrentUser();
    if (!me) return fail('Giriş yapmalısınız.', 401);
    if (!rateLimit(`2fa:${me.id}`, 20)) return fail('Çok fazla deneme. Biraz sonra tekrar deneyin.', 429);
    if (!process.env.AUTH_SECRET) return fail('Sunucuda AUTH_SECRET tanımlı değil; iki adımlı doğrulama kullanılamıyor.', 503);
    const b = (await readJson(request)) || {};
    const user = await prisma.user.findUnique({ where: { id: me.id } });

    if (b.action === 'start') {
        if (user.totpEnabledAt) return fail('İki adımlı doğrulama zaten açık.');
        const secret = generateSecret();
        await prisma.user.update({ where: { id: me.id }, data: { totpSecret: encryptSecret(secret) } });
        const url = otpauthUrl(secret, user.email);
        const qr = await QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
        return ok({ qr, secret: secret.match(/.{1,4}/g).join(' ') });
    }

    if (b.action === 'enable') {
        if (user.totpEnabledAt || !user.totpSecret) return fail('Önce kurulumu başlatın.');
        if (!verifyTotp(decryptSecret(user.totpSecret), b.code)) return fail('Kod doğrulanamadı. Telefonunuzun saatinin doğru olduğundan emin olun.');
        const codes = generateRecoveryCodes();
        await prisma.user.update({ where: { id: me.id }, data: { totpEnabledAt: new Date(), recoveryCodes: codes.map(hashCode) } });
        // Diğer cihazlardaki oturumlar kapatılmaz; bir sonraki girişte kod istenir
        return ok({ recoveryCodes: codes });
    }

    if (b.action === 'disable') {
        if (!user.totpEnabledAt) return fail('İki adımlı doğrulama zaten kapalı.');
        if (!(await verifyPassword(String(b.password || ''), user.passwordHash))) return fail('Şifre hatalı.', 403);
        if (!verifyTotp(decryptSecret(user.totpSecret), b.code) && !user.recoveryCodes.includes(hashCode(b.code || ''))) {
            return fail('Doğrulama kodu hatalı.', 403);
        }
        await prisma.user.update({ where: { id: me.id }, data: { totpEnabledAt: null, totpSecret: null, recoveryCodes: [] } });
        return ok();
    }
    return fail('Bilinmeyen işlem.');
}
