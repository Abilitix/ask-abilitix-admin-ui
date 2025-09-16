import { NextRequest, NextResponse } from 'next/server';
import { adminGet, adminPut } from '@/lib/api/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get tenant context from user session
    const ADMIN_API = process.env.ADMIN_API;
    if (!ADMIN_API) {
      return NextResponse.json(
        { error: 'Admin API not configured' },
        { status: 500 }
      );
    }

    // Get user session to determine tenant context
    const authResponse = await fetch(`${ADMIN_API}/auth/me`, {
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

    const userData = await authResponse.json();
    
    // Get settings for the user's tenant
    const data = await adminGet(`/admin/tenants/${userData.tenant_id}/settings`, request);
    
    return NextResponse.json({ 
      ...(data && typeof data === 'object' ? data : {}), 
      tenant_id: userData.tenant_id, 
      tenant_slug: `tenant-${userData.tenant_id.slice(0, 8)}` // Generate readable slug
    }, { headers: { 'Cache-Control': 'no-store' } });

  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get tenant context from user session
    const ADMIN_API = process.env.ADMIN_API;
    if (!ADMIN_API) {
      return NextResponse.json(
        { error: 'Admin API not configured' },
        { status: 500 }
      );
    }

    // Get user session to determine tenant context
    const authResponse = await fetch(`${ADMIN_API}/auth/me`, {
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

    const userData = await authResponse.json();
    const body = await request.json();
    
    // Update settings for the user's tenant
    const data = await adminPut(`/admin/tenants/${userData.tenant_id}/settings`, body, request);
    
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });

  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
