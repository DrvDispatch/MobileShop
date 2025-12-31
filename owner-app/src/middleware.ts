import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const token = req.cookies.get('auth_token');

    const isLoginPage = req.nextUrl.pathname.startsWith('/login');

    // If no token and not on login page, redirect to login
    if (!token && !isLoginPage) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // If has token and on login page, redirect to dashboard
    if (token && isLoginPage) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
}

export const config = {
    // Match all routes except static files and API routes
    matcher: ['/((?!_next|favicon.ico|api).*)'],
};
