import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const ADMIN_API = process.env.ADMIN_API;
    const { user_id } = await params;
    
    if (!ADMIN_API) {
      return NextResponse.json(
        { error: 'Admin API not configured' },
        { status: 500 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
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

    console.log('Offboarding user:', { user_id, tenantId: userData.tenant_id });

    // Call Admin API to offboard user
    const response = await fetch(`${ADMIN_API}/admin/members/${user_id}`, {
      method: 'DELETE',
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
    
    // Handle specific error responses
    if (response.status === 400) {
      try {
        const errorData = JSON.parse(responseText);
        return NextResponse.json(
          { error: errorData.detail?.error || 'Invalid request' },
          { status: 400 }
        );
      } catch {
        return NextResponse.json(
          { error: 'Invalid request' },
          { status: 400 }
        );
      }
    }
    
    if (response.status === 404) {
      try {
        const errorData = JSON.parse(responseText);
        return NextResponse.json(
          { error: errorData.detail?.error || 'User not found' },
          { status: 404 }
        );
      } catch {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to remove user' }, 
      { status: response.status }
    );
    
  } catch (error) {
    console.error('User offboarding error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage }, 
      { status: 500 }
    );
  }
}
