import { NextRequest, NextResponse } from 'next/server';
import { adminPost } from '@/lib/api/admin';
import { getAdminApiBase } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
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
    const { kind } = await req.json();
    
    const data = await adminPost(`/admin/tenants/${userData.tenant_id}/keys/rotate`, { kind }, req);
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Keys rotate error:', error);
    return NextResponse.json(
      { error: 'Failed to rotate keys' },
      { status: 500 }
    );
  }
}
