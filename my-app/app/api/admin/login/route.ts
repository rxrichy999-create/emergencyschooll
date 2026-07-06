import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, authenticate, createSessionValue } from '@/lib/adminAuth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const account = authenticate(body.username, body.password, 'admin');

    if (!account) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, account });
    response.cookies.set(AUTH_COOKIE_NAME, createSessionValue(account), {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Failed to login' }, { status: 400 });
  }
}
