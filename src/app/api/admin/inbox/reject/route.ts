import { NextRequest, NextResponse } from 'next/server';
import { adminPost } from '@/lib/api/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    if (!body?.id) {
      return NextResponse.json(
        { error: 'bad_request', details: 'id is required' },
        { status: 400 }
      );
    }

    // Debug logging for rejection issues
    console.log('Inbox Rejection Debug:', {
      inboxId: body.id,
      cookieHeader: request.headers.get('cookie')?.substring(0, 50) + '...',
      userAgent: request.headers.get('user-agent')?.substring(0, 50) + '...'
    });

    const data = await adminPost(`/admin/inbox/${body.id}/reject`, body, request);
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Inbox Rejection Error:', err);
    return NextResponse.json(
      { error: 'admin_proxy_error', details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}