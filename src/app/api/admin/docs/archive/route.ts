export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

import { getAdminApiBase } from '@/lib/env';

export async function POST(req: Request) {
  const ADMIN_API = getAdminApiBase();

  const body = await req.json().catch(() => ({}));

  // Forward cookies for session-based authentication
  const cookieHeader = req.headers.get('cookie') || '';

  const r = await fetch(`${ADMIN_API}/admin/docs/archive`, {
    method: 'POST',
    headers: {
      'Cookie': cookieHeader,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status, headers: { 'Cache-Control': 'no-store' } });
}

