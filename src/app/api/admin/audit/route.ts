export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase } from '@/lib/env';

export async function GET(req: NextRequest) {
  try {
    const ADMIN_API = getAdminApiBase();
    
    if (!ADMIN_API) {
      return NextResponse.json(
        { error: 'Admin API not configured' },
        { status: 500 }
      );
    }

    // Get tenant context from user session
    const authResponse = await fetch(`${ADMIN_API}/auth/me`, {
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
    const url = new URL(req.url);
    const limit = url.searchParams.get('limit') ?? '5';

    const r = await fetch(`${ADMIN_API}/admin/audit?action=docs.uploaded&limit=${limit}`, {
      headers: {
        'Cookie': req.headers.get('cookie') || '', // Use session auth
      },
      cache: 'no-store',
    });

    let data: any = {};
    try { data = await r.json(); } catch {}
    return NextResponse.json(data, { status: r.status, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Audit fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit data' },
      { status: 500 }
    );
  }
}

