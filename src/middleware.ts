import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Skip static assets and API routes early
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/api') || 
      pathname === '/favicon.ico' ||
      pathname === '/robots.txt') {
    return NextResponse.next();
  }

  // For /admin/* only, do a cheap local cookie presence check
  if (pathname.startsWith("/admin")) {
    const hasSess = !!req.cookies.get("aa_sess")?.value;
    if (!hasSess) {
      const url = req.nextUrl.clone();
      url.pathname = "/signin";
      url.search = "";
      return NextResponse.redirect(url);
    }
    
    // Set no-store headers for admin routes
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("Vary", "Cookie");
    return res;
  }
  
  return NextResponse.next();
}

// Scope strictly to admin routes only
export const config = {
  matcher: ['/admin/:path*'],
};
