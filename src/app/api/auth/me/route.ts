import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const name = process.env.SESSION_COOKIE_NAME || "abilitix_s";
    const cookieStore = await cookies();
    const token = cookieStore.get(name)?.value;
    
    if (!token) {
      return NextResponse.json({ detail: "No session" }, { status: 401 });
    }

    const base = process.env.ADMIN_API_BASE;
    if (!base) {
      console.error('ADMIN_API_BASE environment variable not set');
      return NextResponse.json(
        { detail: { code: 'CONFIGURATION_ERROR', message: 'Server configuration error' } },
        { status: 500 }
      );
    }

    // Forward the cookie to Admin API
    const r = await fetch(`${base}/auth/me`, {
      headers: { cookie: `${name}=${token}` },
      cache: "no-store",
    });

    const body = await r.json().catch(() => ({}));
    return NextResponse.json(body, { status: r.status });
  } catch (error) {
    console.error('Auth me API error:', error);
    return NextResponse.json(
      { detail: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}