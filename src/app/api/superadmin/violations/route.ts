import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireSuperadminAuth();

    const ADMIN_API = process.env.ADMIN_API;
    const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;
    if (!ADMIN_API || !ADMIN_API_TOKEN) {
      return NextResponse.json({ detail: { error: 'service_unavailable', reason: 'Admin API not configured' } }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const tenant_id = searchParams.get('tenant_id') || '';
    const limit = searchParams.get('limit') || '25';
    const offset = searchParams.get('offset') || '0';

    const url = new URL('/admin/violations', ADMIN_API);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    if (tenant_id) url.searchParams.set('tenant_id', tenant_id);
    if (limit) url.searchParams.set('limit', limit);
    if (offset) url.searchParams.set('offset', offset);

    const r = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ADMIN_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const text = await r.text();
    if (!r.ok) {
      return new NextResponse(text || JSON.stringify({ detail: { error: 'service_unavailable', reason: 'Upstream error' } }), { status: r.status, headers: { 'Content-Type': 'application/json' } });
    }
    return new NextResponse(text, { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ detail: { error: 'service_unavailable', reason: 'Unexpected error' } }, { status: 503 });
  }
}


