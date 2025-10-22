import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { detail: { code: 'MISSING_CREDENTIALS', message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    const base = process.env.ADMIN_API_BASE;
    if (!base) {
      console.error('ADMIN_API_BASE environment variable not set');
      return NextResponse.json(
        { detail: { code: 'CONFIGURATION_ERROR', message: 'Server configuration error - ADMIN_API_BASE not set' } },
        { status: 500 }
      );
    }

    const name = process.env.SESSION_COOKIE_NAME || "abilitix_s";
    const ttl = Number(process.env.SESSION_TTL_MINUTES || "60") * 60;

    // Tell Admin API we're proxying so it returns a JSON token, not Set-Cookie
    const r = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-auth-proxy": "1" },
      body: JSON.stringify({ email, password }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return NextResponse.json({ detail: data?.detail || "Invalid credentials" }, { status: r.status });
    }

    const token = data?.session_token;
    if (!token) {
      return NextResponse.json({ detail: "Missing session_token from upstream" }, { status: 502 });
    }

    // Mint cookie on the **UI domain**
    cookies().set({
      name,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax",
      path: "/",
      // IMPORTANT: omit domain for preview/staging; add only in prod if you need a parent domain
      ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
      maxAge: ttl,
    });

    return NextResponse.json({ ok: true, user: data.user, tenant: data.tenant, tenants: data.tenants });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { detail: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
