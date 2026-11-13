import { NextResponse } from 'next/server';

// Hızlı ön kontrol: oturum çerezi yoksa admin sayfalarına hiç girmeden giriş sayfasına yönlendir.
// Asıl yetki kontrolü (rol, oturum geçerliliği) app/admin/layout.js ve API route'larında yapılır.
export function proxy(request) {
    if (request.cookies.get('session')?.value) return NextResponse.next();
    const url = new URL('/login', request.url);
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
}

export const config = {
    matcher: ['/admin/:path*'],
};
