import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase } from '@/lib/env';

export async function POST(req: NextRequest) {
  try {
    const ADMIN_API = getAdminApiBase();
    
    if (!ADMIN_API) {
      return NextResponse.json(
        { error: 'ADMIN_API not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const cookieHeader = req.headers.get('cookie') || '';

    const response = await fetch(`${ADMIN_API}/auth/account/request-deletion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify(body),
      credentials: 'include',
      cache: 'no-store',
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      return NextResponse.json(
        JSON.parse(responseText || '{}'),
        { status: response.status }
      );
    }

    return NextResponse.json(JSON.parse(responseText || '{}'), { status: 200 });
  } catch (error: any) {
    console.error('Request deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to request account deletion', message: error.message },
      { status: 500 }
    );
  }
}

