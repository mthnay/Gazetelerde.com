import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
    const body = await request.json();
    const { email, password } = body;

    // Unified Auth Logic
    const cookieStore = await cookies();

    // 1. Check for Admin Login
    // Admin can login with "admin" username or specific email
    if ((email === 'admin' || email === 'admin@gazetelerde.com') && password === '12345') {
        cookieStore.set('admin_token', 'secret-admin-token-123', {
            httpOnly: true,
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });
        
        // Also set user token for general site access
        cookieStore.set('user_token', 'admin-user-token', {
            path: '/',
            maxAge: 60 * 60 * 24
        });

        return NextResponse.json({ 
            success: true, 
            role: 'admin',
            redirectUrl: '/admin',
            user: { name: 'Administrator', email: 'admin@gazetelerde.com' }
        });
    }

    // 2. Check for Standard User Login (Mock)
    // For now, accepting any non-empty inputs as valid user
    if (email && password) {
        cookieStore.set('user_token', 'demo-user-token', {
            path: '/',
            maxAge: 60 * 60 * 24
        });

        return NextResponse.json({ 
            success: true, 
            role: 'user', 
            redirectUrl: '/',
            user: { name: email.split('@')[0], email }
        });
    }

    return NextResponse.json({ success: false, message: 'Hatalı e-posta veya şifre!' }, { status: 401 });
}
