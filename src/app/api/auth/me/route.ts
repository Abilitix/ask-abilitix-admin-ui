import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const ADMIN_BASE = process.env.ADMIN_BASE;
    
    if (!ADMIN_BASE) {
      return NextResponse.json({ error: 'ADMIN_BASE not configured' }, { status: 500 });
    }

    // Get the session cookie specifically
    const sessionCookie = request.cookies['aa_sess'];
    
    if (!sessionCookie) {
      console.log('No session cookie found in /api/auth/me');
      return NextResponse.json({ error: 'No session cookie' }, { status: 401 });
    }

    console.log('Forwarding session to Admin API:', {
      cookieValue: sessionCookie.substring(0, 20) + '...',
      adminBase: ADMIN_BASE
    });

    // Forward the request to Admin API with the session cookie
    const response = await fetch(`${ADMIN_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': `aa_sess=${sessionCookie}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
    });

    console.log('Admin API response in /api/auth/me:', {
      status: response.status,
      ok: response.ok
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