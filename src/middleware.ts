import { NextRequest, NextResponse } from 'next/server';

const PUBLIC = ["/","/signin","/signup","/favicon.ico","/robots.txt","/_next","/assets"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Skip API routes
  if (pathname.startsWith("/api/")) return NextResponse.next();
  
  // Skip public routes
  if (PUBLIC.some(p => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();

  // For /admin/* only, do a cheap local cookie presence check
  if (pathname.startsWith("/admin")) {
    const hasSess = !!req.cookies.get("aa_sess")?.value;
    if (!hasSess) {
      const url = req.nextUrl.clone();
      url.pathname = "/signin";
      url.search = "";
      const res = NextResponse.redirect(url);
      res.headers.set("Cache-Control", "no-store");
      res.headers.set("Vary", "Cookie");
      return res;
    }
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("Vary", "Cookie");
    return res;
  }
  
  return NextResponse.next();
}

// only run on app pages
export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:png|jpg|svg|ico|css|js)).*)'],
};
