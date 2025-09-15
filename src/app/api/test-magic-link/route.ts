import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }

    // Test Admin API verification directly
    const adminApiUrl = `${process.env.ADMIN_BASE}/public/verify?token=${encodeURIComponent(token)}&next=https://app.abilitix.com.au/admin`;
    
    console.log('Testing magic link verification:', {
      token: token.substring(0, 10) + '...',
      adminApiUrl
    });

    // Make request to Admin API
    const response = await fetch(adminApiUrl, {
      method: 'GET',
      redirect: 'manual', // Don't follow redirects automatically
    });

    console.log('Admin API response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Check if cookie is set in response
    const setCookieHeader = response.headers.get('set-cookie');
    console.log('Set-Cookie header:', setCookieHeader);

    return NextResponse.json({
      message: 'Magic link test completed',
      adminApiStatus: response.status,
      setCookie: setCookieHeader,
      redirectUrl: response.headers.get('location')
    });

  } catch (error) {
    console.error('Magic link test error:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
