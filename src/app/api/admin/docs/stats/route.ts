import { NextRequest, NextResponse } from 'next/server';
import { adminGet } from '@/lib/api/admin';

export async function GET(request: NextRequest) {
  try {
    // Debug logging for stats issues
    console.log('Document Stats Debug:', {
      cookieHeader: request.headers.get('cookie')?.substring(0, 50) + '...'
    });

    const data = await adminGet('/admin/docs/stats', request);
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Document Stats Error:', err);
    return NextResponse.json(
      { error: 'admin_proxy_error', details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
