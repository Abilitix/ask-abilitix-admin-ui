import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ADMIN_API_URL = process.env.ADMIN_API;
    const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;
    const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID;

    if (!ADMIN_API_URL || !ADMIN_API_TOKEN || !DEFAULT_TENANT_ID) {
      return NextResponse.json(
        { error: 'Server configuration missing' },
        { status: 500 }
      );
    }

    const body = await req.text();
    
    const response = await fetch(`${ADMIN_API_URL}/admin/docs/init`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_API_TOKEN}`,
        'X-Tenant-Id': DEFAULT_TENANT_ID,
        'Content-Type': 'application/json',
      },
      body,
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
    console.error('Admin API proxy error (docs/init):', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
