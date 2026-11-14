import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { createSession } from '@/lib/auth';
import { ok, fail, readJson, rateLimit, clientIp } from '@/lib/api';

export async function POST(request) {
    const body = await readJson(request);
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    if (!email || !password) return fail('E-posta ve şifre gerekli.');

    if (!rateLimit(`login:${clientIp(request)}:${email}`, 10)) {
        return fail('Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin.', 429);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    // Kullanıcı yoksa da aynı mesaj: hangi e-postaların kayıtlı olduğu sızmasın
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
        return fail('E-posta veya şifre hatalı.', 401);
    }

    await createSession(user.id);
    const publicUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    return ok({ user: publicUser, role: user.role, redirectUrl: '/' }); // yöneticiler de siteyle başlar; panele menüden geçerler
}
