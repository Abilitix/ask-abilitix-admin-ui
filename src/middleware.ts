import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROD_ADMIN_PREFIX = "/admin";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith(PROD_ADMIN_PREFIX)) return NextResponse.next();

  // Check for session cookie
  const cookie = req.cookies.get('aa_sess');
  console.log('Middleware checking session:', { 
    path: pathname,
    hasCookie: !!cookie,
    cookieValue: cookie?.value?.substring(0, 20) + '...'
  });

  if (!cookie) {
    console.log('No session cookie found, redirecting to signin');
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  // Verify session with Admin API
  const adminApi = process.env.ADMIN_BASE!;
  try {
    const response = await fetch(`${adminApi}/auth/me`, {
      headers: { 
        'Cookie': `aa_sess=${cookie.value}`,
        'Content-Type': 'application/json'
      },
      cache: "no-store",
    });
    
    console.log('Admin API response:', { 
      status: response.status,
      ok: response.ok 
    });

    if (!response.ok) {
      console.log('Session validation failed, redirecting to signin');
      const url = req.nextUrl.clone();
      url.pathname = "/signin";
      return NextResponse.redirect(url);
    }
    
    console.log('Session valid, allowing access');
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }
}

export const config = { matcher: ["/admin/:path*"] };
