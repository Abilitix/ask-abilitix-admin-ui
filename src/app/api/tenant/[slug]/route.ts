import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Tenant slug is required' },
        { status: 400 }
      );
    }

    // Get tenant data from authenticated session
    const ADMIN_API = process.env.ADMIN_API;
    if (!ADMIN_API) {
      return NextResponse.json({ error: 'Admin API not configured' }, { status: 500 });
    }

    const response = await fetch(`${ADMIN_API}/auth/me`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userData = await response.json();
    
    // Fetch tenant details from Admin API using tenant ID
    let tenantSlug = `tenant-${userData.tenant_id.slice(0, 8)}`;
    let tenantName = `Tenant ${userData.tenant_id.slice(0, 8)}`;
    
    try {
      const tenantResponse = await fetch(`${ADMIN_API}/admin/tenants/${userData.tenant_id}`, {
        headers: {
          'Cookie': request.headers.get('cookie') || ''
        }
      });
      
      if (tenantResponse.ok) {
        const tenantData = await tenantResponse.json();
        tenantSlug = tenantData.slug || tenantSlug;
        tenantName = tenantData.name || tenantName;
      }
    } catch (error) {
      console.error('Failed to fetch tenant details:', error);
      // Use fallback values
    }
    
    return NextResponse.json({
      id: userData.tenant_id,
      slug: tenantSlug,
      name: tenantName,
      type: 'pilot' // Always show as pilot mode for now
    }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' }
    });

  } catch (error) {
    console.error('Tenant fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
