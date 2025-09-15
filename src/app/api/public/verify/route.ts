import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const next = searchParams.get('next') || '/admin';

    if (!token) {
      return NextResponse.redirect(new URL('/signin?error=invalid_token', request.url));
    }

    // Redirect browser directly to Admin API for verification
    // This allows Admin API to set the httpOnly cookie properly
    const adminApiUrl = `${process.env.ADMIN_BASE}/public/verify?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`;
    
    return NextResponse.redirect(adminApiUrl);

  } catch (error) {
    console.error('Magic link verification error:', error);
    return NextResponse.redirect(new URL('/signin?error=server_error', request.url));
  }
}
