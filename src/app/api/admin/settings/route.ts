import { NextResponse } from 'next/server';
import { adminGet, adminPut } from '@/lib/api/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const TENANT_ID = process.env.TENANT_ID!;
  const TENANT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG!;
  const data = await adminGet(`/admin/tenants/${TENANT_ID}/settings`);
  return NextResponse.json({ ...data, tenant_id: TENANT_ID, tenant_slug: TENANT_SLUG }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(req: Request) {
  const TENANT_ID = process.env.TENANT_ID!;
  const body = await req.json();
  const data = await adminPut(`/admin/tenants/${TENANT_ID}/settings`, body);
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
