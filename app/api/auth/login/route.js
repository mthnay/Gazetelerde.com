import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, SESSION_MAX_AGE, createAdminToken, getAdminCredentials } from '@/lib/auth';

export async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ success: false, message: 'Geçersiz istek.' }, { status: 400 });
    }

    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (!email || !password) {
        return NextResponse.json({ success: false, message: 'E-posta ve şifre gerekli.' }, { status: 400 });
    }

    const secure = process.env.NODE_ENV === 'production';
    const admin = getAdminCredentials();

    // 1. Admin girişi (bilgiler .env.local dosyasından okunur)
    if (admin && (email === 'admin' || email === admin.email.toLowerCase()) && password === admin.password) {
        const res = NextResponse.json({
            success: true,
            role: 'admin',
            redirectUrl: '/admin',
            user: { name: 'Yönetici', email: admin.email, role: 'admin' },
        });
        res.cookies.set(ADMIN_COOKIE, await createAdminToken(), {
            httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: SESSION_MAX_AGE,
        });
        res.cookies.set('user_token', 'admin', { secure, sameSite: 'lax', path: '/', maxAge: SESSION_MAX_AGE });
        return res;
    }

    // 2. Standart kullanıcı girişi (MOCK – veritabanı bağlanana kadar her e-posta/şifre kabul edilir)
    const res = NextResponse.json({
        success: true,
        role: 'user',
        redirectUrl: '/',
        user: { name: email.split('@')[0], email, role: 'user' },
    });
    // Normal kullanıcı girişinde eski bir admin oturumu kalmasın
    res.cookies.delete(ADMIN_COOKIE);
    res.cookies.set('user_token', 'user', { secure, sameSite: 'lax', path: '/', maxAge: SESSION_MAX_AGE });
    return res;
}
