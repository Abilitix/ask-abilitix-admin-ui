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

    const data = await adminPost(`/admin/inbox/${body.id}/approve`, body);
    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'admin_proxy_error', details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}