import { NextResponse } from 'next/server';
import { adminGet } from '@/lib/api/admin';

export async function GET() {
  try {
    const data = await adminGet('/admin/docs/stats');
    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'admin_proxy_error', details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
