// Veritabanı tabanlı oturum sistemi.
// Çereze rastgele bir token yazılır; veritabanında yalnızca SHA-256 özeti tutulur,
// böylece veritabanı sızsa bile oturumlar ele geçirilemez.
import 'server-only';
import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';
import { cache } from 'react';
import { prisma } from '@/lib/db';

export const SESSION_COOKIE = 'session';
export const SESSION_DAYS = 30;

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

const publicUser = (u) => u && { id: u.id, name: u.name, email: u.email, role: u.role };

export async function createSession(userId) {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
    await prisma.session.create({ data: { id: hashToken(token), userId, expiresAt } });
    // Bu kullanıcının süresi dolmuş eski oturumlarını temizle (tablo şişmesin)
    await prisma.session.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } }).catch(() => { });

    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: expiresAt,
    });
}

export async function destroySession() {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (token) await prisma.session.deleteMany({ where: { id: hashToken(token) } });
    store.delete(SESSION_COOKIE);
}

// Aynı istek içinde birden çok kez çağrılsa da veritabanına tek sorgu gider
export const getCurrentUser = cache(async () => {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const session = await prisma.session.findUnique({
        where: { id: hashToken(token) },
        include: { user: true },
    });
    if (!session || session.expiresAt < new Date()) {
        if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => { });
        return null;
    }
    return publicUser(session.user);
});

export const STAFF_ROLES = ['AUTHOR', 'EDITOR', 'ADMIN'];
export const isStaff = (user) => !!user && STAFF_ROLES.includes(user.role);
export const isAdmin = (user) => user?.role === 'ADMIN';
