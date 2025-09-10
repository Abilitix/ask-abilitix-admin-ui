import { NextRequest, NextResponse } from 'next/server';
import { adminFetch } from '@/lib/api/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await adminFetch(`/admin/tenants`);
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = await adminFetch(`/admin/tenants`, {
    method: 'POST',
    headers: { 'X-Operator': '1' }, // server-only
    body: JSON.stringify(body),
  });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
