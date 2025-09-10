export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const ADMIN_BASE = process.env.ADMIN_BASE!;
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN!;
  const TENANT_ID = process.env.TENANT_ID!;

  const body = await req.json().catch(() => ({}));

  const r = await fetch(`${ADMIN_BASE}/admin/docs/unarchive`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'X-Tenant-Id': TENANT_ID,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status, headers: { 'Cache-Control': 'no-store' } });
}
