import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const ADMIN_BASE = process.env.ADMIN_BASE;
    
    if (!ADMIN_BASE) {
      return NextResponse.json({ error: 'ADMIN_BASE not configured' }, { status: 500 });
    }

    // Forward the request to Admin API with cookies
    const cookieHeader = request.headers.get('cookie') || '';
    
    const response = await fetch(`${ADMIN_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const userData = await response.json();
      return NextResponse.json(userData, { status: 200 });
    }
    
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}