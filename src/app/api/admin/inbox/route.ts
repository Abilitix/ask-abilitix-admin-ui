import { NextRequest, NextResponse } from 'next/server';
import { adminGet } from '@/lib/api/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    
    // Debug logging for inbox issues
    console.log('Inbox GET Debug:', {
      status: status,
      cookieHeader: request.headers.get('cookie')?.substring(0, 50) + '...',
      url: request.url
    });
    
    const data = await adminGet(`/admin/inbox?status=${status}`, request);
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Inbox GET Error:', err);
    return NextResponse.json(
      { error: 'admin_proxy_error', details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}