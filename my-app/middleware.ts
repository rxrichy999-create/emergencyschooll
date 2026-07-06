import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, parseSessionValue } from './lib/adminAuth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = parseSessionValue(request.cookies.get(AUTH_COOKIE_NAME)?.value);

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  if (session?.role === 'admin') {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/admin/login';
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};
