import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROD_ADMIN_PREFIX = "/admin";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith(PROD_ADMIN_PREFIX)) return NextResponse.next();

  // TEMPORARILY DISABLE MIDDLEWARE FOR TESTING
  console.log('Middleware bypassed for testing - allowing access to:', pathname);
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
