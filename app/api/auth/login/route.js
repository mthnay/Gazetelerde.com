import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { createSession } from '@/lib/auth';
import { ok, fail, readJson, rateLimit, clientIp } from '@/lib/api';
import { isLocked, recordAttempt } from '@/lib/loginGuard';
import { verifyTotp, decryptSecret, hashCode } from '@/lib/totp';

// Giriş. İki adımlı doğrulama açıksa ilk istek { needs2fa: true } döner; istemci aynı bilgileri kodla tekrar gönderir.
export async function POST(request) {
    const body = await readJson(request);
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const code = String(body?.code || '').trim();
    if (!email || !password) return fail('E-posta ve şifre gerekli.');
    const ip = clientIp(request);

    // Hızlı bellek içi sınır + veritabanı kayıtlı kilit (yeniden başlatmada sıfırlanmaz)
    if (!rateLimit(`login:${ip}:${email}`, 20) || (await isLocked(email, ip))) {
        await recordAttempt(email, ip, false, 'kilitli');
        return fail('Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin.', 429);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    // Kullanıcı yoksa da aynı mesaj: hangi e-postaların kayıtlı olduğu sızmasın
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
        await recordAttempt(email, ip, false, 'sifre');
        return fail('E-posta veya şifre hatalı.', 401);
    }

    if (user.totpEnabledAt && user.totpSecret) {
        if (!code) return ok({ needs2fa: true });
        let valid = false;
        try { valid = verifyTotp(decryptSecret(user.totpSecret), code); } catch { valid = false; }
        // Kurtarma kodu: tek kullanımlık
        if (!valid && /^[a-z0-9]{4}-?[a-z0-9]{4}$/i.test(code)) {
            const h = hashCode(code);
            if (user.recoveryCodes.includes(h)) {
                await prisma.user.update({ where: { id: user.id }, data: { recoveryCodes: user.recoveryCodes.filter((x) => x !== h) } });
                valid = true;
            }
        }
        if (!valid) {
            await recordAttempt(email, ip, false, '2fa');
            return fail('Doğrulama kodu hatalı.', 401);
        }
    }

    await recordAttempt(email, ip, true, 'basarili');
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await createSession(user.id);
    const publicUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    return ok({ user: publicUser, role: user.role, redirectUrl: '/' }); // yöneticiler de siteyle başlar; panele menüden geçerler
}
