import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ADMIN_API_URL = process.env.ADMIN_API;
    const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;

    if (!ADMIN_API_URL || !ADMIN_API_TOKEN) {
      return NextResponse.json(
        { error: 'Server configuration missing' },
        { status: 500 }
      );
    }

    // Resolve tenant from authenticated session
    const authResponse = await fetch(`${req.nextUrl.origin}/api/auth/me`, {
      headers: {
        'Cookie': req.headers.get('cookie') || ''
      }
    });

    if (!authResponse.ok) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userData = await authResponse.json();

    const response = await fetch(`${ADMIN_API_URL}/admin/uploads/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_API_TOKEN}`,
        'X-Tenant-Id': userData.tenant_id,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store',
      },
    });

  } catch (error) {
    console.error('Admin API proxy error (uploads/token):', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
