import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const config = { matcher: ['/admin/:path*'] };

const ADMIN_API = process.env.ADMIN_API || 'https://api.abilitix.com.au';

export async function middleware(req: NextRequest) {
  const cookie = req.headers.get('cookie') ?? '';
  const resp = await fetch(`${ADMIN_API}/auth/me`, {
    headers: { cookie },
    cache: 'no-store',
  });
  return resp.ok ? NextResponse.next()
                 : NextResponse.redirect(new URL('/signin', req.url));
}
