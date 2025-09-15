import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const next = searchParams.get('next') || '/admin';

    if (!token) {
      return NextResponse.redirect(new URL('/signin?error=invalid_token', request.url));
    }

    // Forward to Admin API with all headers and cookies
    const adminApiUrl = `${process.env.ADMIN_BASE}/public/verify?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`;
    
    const response = await fetch(adminApiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('user-agent') || '',
        'Accept': request.headers.get('accept') || '*/*',
        'Accept-Language': request.headers.get('accept-language') || '',
        'Accept-Encoding': request.headers.get('accept-encoding') || '',
        'Connection': request.headers.get('connection') || '',
        'Upgrade-Insecure-Requests': request.headers.get('upgrade-insecure-requests') || '',
      },
    });

    // If Admin API redirects (302), follow it and preserve the cookie
    if (response.status === 302) {
      const location = response.headers.get('location');
      const setCookie = response.headers.get('set-cookie');
      
      if (location) {
        const redirectUrl = new URL(location, request.url);
        
        // Create redirect response with the cookie from Admin API
        const redirectResponse = NextResponse.redirect(redirectUrl);
        
        // Forward the httpOnly cookie from Admin API
        if (setCookie) {
          redirectResponse.headers.set('set-cookie', setCookie);
        }
        
        return redirectResponse;
      }
    }

    // If not a redirect, handle other responses
    if (response.ok) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Handle errors
    return NextResponse.redirect(new URL('/signin?error=verification_failed', request.url));

  } catch (error) {
    console.error('Magic link verification error:', error);
    return NextResponse.redirect(new URL('/signin?error=server_error', request.url));
  }
}
