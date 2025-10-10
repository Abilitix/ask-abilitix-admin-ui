import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
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
    
    // Check user role for viewer access control
    try {
      const adminApi = process.env.ADMIN_API;
      if (adminApi) {
        const authResponse = await fetch(`${adminApi}/auth/me`, {
          headers: {
            'Cookie': req.headers.get('cookie') || ''
          }
        });
        
        if (authResponse.ok) {
          const userData = await authResponse.json();
          const userRole = userData?.role;
          
          // Redirect viewers away from restricted pages
          if (userRole === 'viewer') {
            const restrictedPaths = ['/admin/inbox', '/admin/docs', '/admin/settings'];
            const isRestricted = restrictedPaths.some(path => pathname.startsWith(path));
            
            if (isRestricted) {
              const url = req.nextUrl.clone();
              url.pathname = "/admin/ai";
              url.search = "";
              return NextResponse.redirect(url);
            }
            
            // Redirect dashboard to AI Assistant for viewers
            if (pathname === '/') {
              const url = req.nextUrl.clone();
              url.pathname = "/admin/ai";
              url.search = "";
              return NextResponse.redirect(url);
            }
          }
        }
      }
    } catch (error) {
      // If role check fails, continue with normal flow (fail-safe)
      console.warn('Role check failed in middleware:', error);
    }
    
    // Set no-store headers for admin routes
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("Vary", "Cookie");
    return res;
  }
  
  return NextResponse.next();
}

// Scope to admin routes and root for viewer redirects
export const config = {
  matcher: ['/admin/:path*', '/'],
};
