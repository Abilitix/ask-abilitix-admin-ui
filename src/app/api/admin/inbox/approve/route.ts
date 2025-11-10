import { NextRequest, NextResponse } from 'next/server';
import { adminPost } from '@/lib/api/admin';
import { getAdminApiBase } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    if (!body?.id) {
      return NextResponse.json(
        { error: 'bad_request', details: 'id is required' },
        { status: 400 }
      );
    }

    // Debug logging for approval issues
    console.log('Inbox Approval Debug:', {
      inboxId: body.id,
      requestBody: body,
      cookieHeader: request.headers.get('cookie')?.substring(0, 50) + '...',
      userAgent: request.headers.get('user-agent')?.substring(0, 50) + '...'
    });

    // Try to get more info about the Admin API call
    const ADMIN_API = getAdminApiBase();
    console.log('Calling Admin API:', `${ADMIN_API}/admin/inbox/${body.id}/approve`);

    const data = await adminPost(`/admin/inbox/${body.id}/approve`, body, request);
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Inbox Approval Error:', err);
    return NextResponse.json(
      { error: 'admin_proxy_error', details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}