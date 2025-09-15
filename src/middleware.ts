import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROD_ADMIN_PREFIX = "/admin";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith(PROD_ADMIN_PREFIX)) return NextResponse.next();

  const adminApi = process.env.ADMIN_BASE!;
  const me = await fetch(`${adminApi}/auth/me`, {
    headers: { cookie: req.headers.get("cookie") || "" },
    cache: "no-store",
  });
  if (!me.ok) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
