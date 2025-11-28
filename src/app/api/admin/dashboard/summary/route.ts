import { NextRequest, NextResponse } from 'next/server';
import { adminGet } from '@/lib/api/admin';

export async function GET(request: NextRequest) {
  try {
    const data = await adminGet('/admin/dashboard/summary', request);
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Dashboard Summary Error:', err);
    return NextResponse.json(
      { error: 'admin_proxy_error', details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}

