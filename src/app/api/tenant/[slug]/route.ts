import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Tenant slug is required' },
        { status: 400 }
      );
    }

    // Forward to Admin API to get tenant information
    const adminApiUrl = `${process.env.ADMIN_BASE}/admin/tenant/${slug}`;
    
    const response = await fetch(adminApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`,
        'X-Tenant-Id': process.env.TENANT_ID,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: response.status }
      );
    }

    const tenantData = await response.json();
    
    return NextResponse.json(tenantData, {
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
