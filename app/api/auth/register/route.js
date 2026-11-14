import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { createSession } from '@/lib/auth';
import { ok, fail, readJson, isEmail, MIN_PASSWORD, rateLimit, clientIp } from '@/lib/api';

export async function POST(request) {
    if (!rateLimit(`register:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
        return fail('Çok fazla deneme. Lütfen daha sonra tekrar deneyin.', 429);
    }
    const body = await readJson(request);
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (name.length < 2 || name.length > 60) return fail('Ad soyad 2-60 karakter olmalı.');
    if (!isEmail(email)) return fail('Geçerli bir e-posta adresi girin.');
    if (password.length < MIN_PASSWORD) return fail(`Şifre en az ${MIN_PASSWORD} karakter olmalı.`);
    if (!body?.consent) return fail('KVKK ve Açık Rıza metinlerini onaylamanız gerekiyor.');

    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) return fail('Bu e-posta adresiyle zaten bir hesap var.', 409);

    const user = await prisma.user.create({
        data: { name, email, passwordHash: await hashPassword(password) },
        select: { id: true, name: true, email: true, role: true },
    });
    // Ödemeyi üye olmadan önce yapan destekçinin kaydını hesaba bağla (reklamsız okuma)
    await prisma.supporter.updateMany({ where: { email, userId: null }, data: { userId: user.id } });
    await createSession(user.id);
    return ok({ user, redirectUrl: '/' }, 201);
}
