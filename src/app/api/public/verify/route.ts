import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const next = searchParams.get('next') || '/admin';

    console.log('Magic link verification:', { token: token?.substring(0, 10) + '...', next });

    if (!token) {
      console.log('No token provided, redirecting to signin');
      return NextResponse.redirect(new URL('/signin?error=invalid_token', request.url));
    }

    // Redirect browser directly to Admin API for verification
    // This allows Admin API to set the httpOnly cookie properly
    const adminApiUrl = `${process.env.ADMIN_BASE}/public/verify?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`;
    
    console.log('Redirecting to Admin API:', adminApiUrl);
    return NextResponse.redirect(adminApiUrl);

  } catch (error) {
    console.error('Magic link verification error:', error);
    return NextResponse.redirect(new URL('/signin?error=server_error', request.url));
  }
}
