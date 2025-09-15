import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const ADMIN_BASE = process.env.ADMIN_BASE;
    
    if (!ADMIN_BASE) {
      return NextResponse.json({ error: 'ADMIN_BASE not configured' }, { status: 500 });
    }

    console.log('Testing Admin UI API route...');
    console.log('ADMIN_BASE:', ADMIN_BASE);
    console.log('Cookie header:', request.headers.get('cookie'));

    // Test direct call to Admin API
    const response = await fetch(`${ADMIN_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
      cache: 'no-store',
    });

    console.log('Admin API response status:', response.status);
    console.log('Admin API response ok:', response.ok);

    if (response.ok) {
      const userData = await response.json();
      return NextResponse.json({ 
        success: true, 
        message: 'Admin UI API route working correctly',
        userData 
      }, { status: 200 });
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Admin API returned error',
      status: response.status 
    }, { status: response.status });
    
  } catch (error) {
    console.error('Admin UI API test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
