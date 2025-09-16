import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const ADMIN_API = process.env.ADMIN_API;
    
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
    
    const body = await request.json();
    const { email, role } = body;
    
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }
    
    if (!['admin', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be admin or viewer' },
        { status: 400 }
      );
    }

    console.log('Inviting user:', { email, role, tenantId: userData.tenant_id });

    // Try session auth first, fallback to admin token if needed
    const response = await fetch(`${ADMIN_API}/admin/users/invite`, {
      method: 'POST',
      headers: {
        'Cookie': request.headers.get('cookie') || '', // Use session auth
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email, 
        role,
        tenant_id: userData.tenant_id // Include tenant_id in body
      }),
      cache: 'no-store',
    });

    console.log('Admin API response status:', response.status);
    
    const responseText = await response.text();
    console.log('Admin API response body:', responseText);
    
    if (response.ok) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    
    return NextResponse.json(
      { error: 'Failed to invite user' }, 
      { status: response.status }
    );
    
  } catch (error) {
    console.error('User invitation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage }, 
      { status: 500 }
    );
  }
}
