import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const ADMIN_BASE = process.env.ADMIN_BASE;
    
    if (!ADMIN_BASE) {
      return new Response(JSON.stringify({ error: 'ADMIN_BASE not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Forward the logout request to Admin API with cookies
    const cookieHeader = request.headers.get('cookie') || '';
    
    const response = await fetch(`${ADMIN_BASE}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
    });

    if (response.ok) {
      // Forward any set-cookie headers from Admin API to clear the session
      const setCookieHeader = response.headers.get('set-cookie');
      
      const nextResponse = NextResponse.json({ ok: true });
      
      if (setCookieHeader) {
        nextResponse.headers.set('set-cookie', setCookieHeader);
      }
      
      return nextResponse;
    }

    return NextResponse.json({ error: 'Logout failed' }, { status: response.status });
    
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}