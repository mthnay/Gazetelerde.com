import { NextResponse } from 'next/server';

export function middleware(request) {
    // Check if we are on an admin route
    if (request.nextUrl.pathname.startsWith('/admin')) {

        // Allow access to login page without auth
        if (request.nextUrl.pathname === '/admin/login') {
            return NextResponse.next();
        }

        const token = request.cookies.get('admin_token');

        // If no token, redirect to login
        if (!token) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/admin/:path*',
};
