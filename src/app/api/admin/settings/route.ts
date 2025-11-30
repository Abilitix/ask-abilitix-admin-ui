import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const ADMIN_API = process.env.ADMIN_API;
    if (!ADMIN_API) {
      return NextResponse.json(
        { error: 'Admin API not configured' },
        { status: 500 }
      );
    }

    // Get user session to determine tenant context
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

    const userData = await authResponse.json();
    
    // Call Admin API directly with correct endpoint
    const response = await fetch(`${ADMIN_API}/admin/tenants/${userData.tenant_id}/settings`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Admin API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({ 
      ...(data && typeof data === 'object' ? data : {}), 
      tenant_id: userData.tenant_id, 
      tenant_slug: `tenant-${userData.tenant_id.slice(0, 8)}`
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
    const ADMIN_API = process.env.ADMIN_API;
    if (!ADMIN_API) {
      return NextResponse.json(
        { error: 'Admin API not configured' },
        { status: 500 }
      );
    }

    // Get user session to determine tenant context
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

    const userData = await authResponse.json();
    const body = await request.json();
    
    // Call Admin API directly with correct endpoint
    const response = await fetch(`${ADMIN_API}/admin/tenants/${userData.tenant_id}/settings`, {
      method: 'PUT',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Admin API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });

  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ADMIN_API = getAdminApiBase();
    if (!ADMIN_API) {
      return NextResponse.json(
        { error: 'Admin API not configured' },
        { status: 500 }
      );
    }

    // Get user session to determine tenant context
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

    const userData = await authResponse.json();
    const body = await request.json();
    
    // Call Admin API with PATCH for partial updates (supports ctx)
    const response = await fetch(`${ADMIN_API}/admin/tenants/${userData.tenant_id}/settings`, {
      method: 'PATCH',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Return error with detail for context-specific errors
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });

  } catch (error) {
    console.error('Settings PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}