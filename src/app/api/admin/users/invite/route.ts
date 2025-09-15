import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const ADMIN_API = process.env.ADMIN_API;
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
    const TENANT_ID = process.env.TENANT_ID;
    
    if (!ADMIN_API || !ADMIN_TOKEN || !TENANT_ID) {
      return new Response(JSON.stringify({ error: 'Missing required environment variables' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { email, role } = body;
    
    if (!email || !role) {
      return new Response(JSON.stringify({ error: 'Email and role are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!['admin', 'viewer'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Role must be admin or viewer' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Inviting user:', { email, role });

    const response = await fetch(`${ADMIN_API}/admin/users/invite`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'X-Tenant-Id': TENANT_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, role }),
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
