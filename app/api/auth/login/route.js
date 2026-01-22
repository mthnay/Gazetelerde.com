import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
    const body = await request.json();
    const { username, password } = body;

    // HARDCODED CREDENTIALS as requested for now
    if (username === 'admin' && password === '12345') {
        // Set a cookie
        const cookieStore = await cookies();
        cookieStore.set('admin_token', 'secret-token-value-123', {
            httpOnly: true,
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false }, { status: 401 });
}
