export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const ADMIN_API = process.env.ADMIN_API!;
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN!;
  const TENANT_ID = process.env.TENANT_ID!;
  
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';
  const status = url.searchParams.get('status') || 'all';
  const limit = url.searchParams.get('limit') || '25';
  const offset = url.searchParams.get('offset') || '0';

  const queryParams = new URLSearchParams({
    q,
    status,
    limit,
    offset
  });

  const r = await fetch(`${ADMIN_API}/admin/docs?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'X-Tenant-Id': TENANT_ID,
      'Cache-Control': 'no-store'
    },
    cache: 'no-store',
  });

  const data = await r.json().catch(() => ({}));
  
  // Handle Admin API errors gracefully
  if (!r.ok) {
    console.error('Admin API error:', r.status, data);
    return NextResponse.json(
      { 
        error: 'Admin API error', 
        status: r.status, 
        details: data.detail || data.message || 'Unknown error',
        documents: [] // Return empty array so UI doesn't break
      }, 
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  
  return NextResponse.json(data, { status: r.status, headers: { 'Cache-Control': 'no-store' } });
}
