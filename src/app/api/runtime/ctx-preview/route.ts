import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get runtime API base URL (server-only)
    const runtimeApiBase = process.env.NEXT_PUBLIC_ASK_BASE || process.env.RUNTIME_API_BASE;
    if (!runtimeApiBase) {
      return NextResponse.json(
        { error: 'Runtime API not configured' },
        { status: 500 }
      );
    }

    // Get debug key (server-only, never exposed to client)
    const debugKey = process.env.X_DEBUG_KEY;
    if (!debugKey) {
      return NextResponse.json(
        { error: 'Debug key not configured' },
        { status: 500 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const tenantSlug = searchParams.get('tenantSlug');
    const query = searchParams.get('q');

    if (!tenantSlug || !query) {
      return NextResponse.json(
        { error: 'tenantSlug and q parameters are required' },
        { status: 400 }
      );
    }

    // Get user session to ensure authenticated
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });

    if (!authResponse.ok) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Call Runtime API debug endpoint
    const runtimeUrl = `${runtimeApiBase.replace(/\/+$/, '')}/debug/ctx?q=${encodeURIComponent(query)}`;
    const response = await fetch(runtimeUrl, {
      method: 'GET',
      headers: {
        'X-Tenant-Slug': tenantSlug,
        'X-Debug-Key': debugKey,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        { error: 'Runtime API error', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(data, { 
      headers: { 
        'Cache-Control': 'no-store' 
      } 
    });

  } catch (error) {
    console.error('[ctx-preview] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preview' },
      { status: 500 }
    );
  }
}

