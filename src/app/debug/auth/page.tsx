import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const ADMIN_API = process.env.ADMIN_API || 'https://api.abilitix.com.au';
    const cookieHeader = request.headers.get('cookie') || '';
    
    console.log('Auth debug - Cookie header:', cookieHeader);
    
    const response = await fetch(`${ADMIN_API}/auth/me`, {
      method: 'GET',
      headers: { 
        'Cookie': cookieHeader,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    const responseText = await response.text();
    
    return new NextResponse(JSON.stringify({
      status: response.status,
      ok: response.ok,
      cookieLength: cookieHeader.length,
      hasCookie: cookieHeader.length > 0,
      response: responseText,
      adminApi: ADMIN_API
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new NextResponse(JSON.stringify({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : String(error)
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
