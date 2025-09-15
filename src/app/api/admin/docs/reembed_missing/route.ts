import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const ADMIN_API = process.env.ADMIN_API;
    
    if (!ADMIN_API) {
      return NextResponse.json({ error: 'ADMIN_API not configured' }, { status: 500 });
    }

    // Get user session to determine tenant
    const cookieHeader = request.headers.get('cookie') || '';
    
    // First, get user info to determine tenant
    const userResponse = await fetch(`${ADMIN_API}/auth/me`, {
      method: 'GET',
      headers: { 'Cookie': cookieHeader },
      cache: 'no-store',
    });

    if (!userResponse.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await userResponse.json();
    const tenantId = userData.tenant_id;

    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found for user' }, { status: 400 });
    }

    // Call reembed endpoint with tenant context
    const response = await fetch(`${ADMIN_API}/admin/docs/reembed_missing`, {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader, // Pass the session cookie
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Reembed failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'admin_proxy_error', details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
