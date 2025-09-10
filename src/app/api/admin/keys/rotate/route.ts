import { NextResponse } from 'next/server';
import { adminPost } from '@/lib/api/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const TENANT_ID = process.env.TENANT_ID!;
  const { kind } = await req.json();
  const data = await adminPost(`/admin/tenants/${TENANT_ID}/keys/rotate`, { kind });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
