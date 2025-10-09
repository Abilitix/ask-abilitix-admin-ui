import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await requireSuperadminAuth();

    const ADMIN_API = process.env.ADMIN_API;
    const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;
    if (!ADMIN_API || !ADMIN_API_TOKEN) {
      return NextResponse.json({ detail: { error: 'service_unavailable', reason: 'Admin API not configured' } }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const url = new URL('/admin/metrics/rollup', ADMIN_API);
    if (date) url.searchParams.set('date', date);

    const r = await fetch(url.toString(), {
      method: 'POST',
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


