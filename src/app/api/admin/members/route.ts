import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase } from '@/lib/env';

export async function GET(request: NextRequest) {
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

    // Fetch members list from Admin API
    const response = await fetch(`${ADMIN_API}/admin/members`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Content-Type': 'application/json',
        'X-Tenant-Id': userData.tenant_id,
      },
      cache: 'no-store',
    });

    console.log('Admin API response status:', response.status);
    
    const responseText = await response.text();
    console.log('Admin API response body:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      return NextResponse.json(data, { status: 200 });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch members' }, 
      { status: response.status }
    );
    
  } catch (error) {
    console.error('Members fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage }, 
      { status: 500 }
    );
  }
}
