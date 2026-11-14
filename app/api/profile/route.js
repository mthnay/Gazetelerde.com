import { prisma } from '@/lib/db';
import { getCurrentUser, destroySession, createSession } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/password';
import { ok, fail, readJson, MIN_PASSWORD } from '@/lib/api';
import { ensureAuthorSlug } from '@/lib/authors';

// Profil güncelle: { name } ve/veya { currentPassword, newPassword }
export async function PATCH(request) {
    const me = await getCurrentUser();
    if (!me) return fail('Giriş yapmalısınız.', 401);
    const body = await readJson(request);
    const data = {};

    if (body?.name !== undefined) {
        const name = String(body.name).trim();
        if (name.length < 2 || name.length > 60) return fail('Ad soyad 2-60 karakter olmalı.');
        data.name = name;
    }

    // Yazar sayfası bilgileri (yalnızca personel)
    if (me.role !== 'READER') {
        if (body?.title !== undefined) data.title = String(body.title).trim().slice(0, 80);
        if (body?.bio !== undefined) data.bio = String(body.bio).trim().slice(0, 1000);
    }

    if (body?.newPassword !== undefined) {
        const user = await prisma.user.findUnique({ where: { id: me.id } });
        if (!(await verifyPassword(String(body.currentPassword || ''), user.passwordHash))) {
            return fail('Mevcut şifre hatalı.', 403);
        }
        if (String(body.newPassword).length < MIN_PASSWORD) return fail(`Yeni şifre en az ${MIN_PASSWORD} karakter olmalı.`);
        data.passwordHash = await hashPassword(String(body.newPassword));
    }

    if (!Object.keys(data).length) return fail('Güncellenecek bilgi yok.');
    const user = await prisma.user.update({
        where: { id: me.id }, data, select: { id: true, name: true, email: true, role: true },
    });

    if (me.role !== 'READER') await ensureAuthorSlug(me.id);

    // Şifre değiştiyse diğer cihazlardaki oturumları kapat, bu cihaza yenisini aç
    if (data.passwordHash) {
        await prisma.session.deleteMany({ where: { userId: me.id } });
        await createSession(me.id);
    }
    return ok({ user });
}

// Hesabı sil: { password }
export async function DELETE(request) {
    const me = await getCurrentUser();
    if (!me) return fail('Giriş yapmalısınız.', 401);
    if (me.role === 'ADMIN') {
        const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
        if (admins <= 1) return fail('Son yönetici hesabı silinemez.', 403);
    }
    const body = await readJson(request);
    const user = await prisma.user.findUnique({ where: { id: me.id } });
    if (!(await verifyPassword(String(body?.password || ''), user.passwordHash))) {
        return fail('Şifre hatalı.', 403);
    }
    await destroySession();
    await prisma.user.delete({ where: { id: me.id } });
    return ok();
}
