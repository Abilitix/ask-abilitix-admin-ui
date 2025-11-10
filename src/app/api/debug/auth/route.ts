import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const ADMIN_API = getAdminApiBase();
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
    
    return NextResponse.json({
      status: response.status,
      ok: response.ok,
      cookieLength: cookieHeader.length,
      hasCookie: cookieHeader.length > 0,
      response: responseText,
      adminApi: ADMIN_API
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
