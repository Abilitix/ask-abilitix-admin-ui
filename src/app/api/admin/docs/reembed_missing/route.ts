import { NextResponse } from 'next/server';
import { adminPost } from '@/lib/api/admin';

export async function POST() {
  try {
    const data = await adminPost('/admin/docs/reembed_missing', {});
    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'admin_proxy_error', details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
