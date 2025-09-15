import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROD_ADMIN_PREFIX = "/admin";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith(PROD_ADMIN_PREFIX)) return NextResponse.next();

  const cookieHeader = req.headers.get("cookie") || "";
  console.log('Middleware checking session:', { 
    path: pathname,
    hasCookie: !!cookieHeader,
    cookieLength: cookieHeader.length,
    cookieValue: cookieHeader.substring(0, 50) + '...'
  });

  const adminApi = process.env.ADMIN_BASE!;
  const me = await fetch(`${adminApi}/auth/me`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });
  
  console.log('Admin API response:', { 
    status: me.status,
    ok: me.ok 
  });

  if (!me.ok) {
    console.log('Session validation failed, redirecting to signin');
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }
  
  console.log('Session valid, allowing access');
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
