export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const ADMIN_BASE = process.env.ADMIN_BASE!;
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN!;
  const TENANT_ID = process.env.TENANT_ID!;
  const url = new URL(req.url);
  const limit = url.searchParams.get('limit') ?? '5';

  const r = await fetch(`${ADMIN_BASE}/admin/audit?action=docs.uploaded&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'X-Tenant-Id': TENANT_ID
    },
    cache: 'no-store',
  });

  let data: any = {};
  try { data = await r.json(); } catch {}
  return NextResponse.json(data, { status: r.status, headers: { 'Cache-Control': 'no-store' } });
}

