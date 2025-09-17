import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/', '/signin', '/signup',
  '/api/public', '/favicon.ico', '/robots.txt',
  '/_next', '/assets'
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip all public routes early
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // For /admin/* and /debug/* only, do a cheap local cookie presence check.
  if (pathname.startsWith('/admin') || pathname.startsWith('/debug')) {
    const hasSess = !!req.cookies.get('aa_sess')?.value;
    if (!hasSess) {
      const url = req.nextUrl.clone();
      url.pathname = '/signin';
      url.search = ''; // keep it clean
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// only run on app pages
export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:png|jpg|svg|ico|css|js)).*)'],
};
