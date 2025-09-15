import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const config = { matcher: ['/admin/:path*'] };

const ADMIN_API = process.env.ADMIN_API || 'https://api.abilitix.com.au';

export async function middleware(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const resp = await fetch(`${ADMIN_API}/auth/me`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });

  // TEMP: add headers so we can see results in Network tab
  const next = resp.ok ? NextResponse.next()
                       : NextResponse.redirect(new URL('/signin', req.url));
  next.headers.set('x-auth-check', String(resp.status));
  next.headers.set('x-cookie-len', String(cookieHeader.length));
  return next;
}
