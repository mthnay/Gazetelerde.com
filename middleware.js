import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/auth';

export async function middleware(request) {
    const { pathname } = request.nextUrl;
    const isAdmin = await verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value);

    if (isAdmin) return NextResponse.next();

    // Yönetim API'leri: yetkisiz isteklere 401
    if (pathname.startsWith('/api/scrape') || pathname.startsWith('/api/automation')) {
        return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 });
    }

    // Admin sayfaları: giriş sayfasına yönlendir
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname);
    const res = NextResponse.redirect(url);
    res.cookies.delete(ADMIN_COOKIE); // süresi geçmiş / sahte token'ı temizle
    return res;
}

export const config = {
    matcher: ['/admin/:path*', '/api/scrape/:path*', '/api/automation/:path*'],
};
