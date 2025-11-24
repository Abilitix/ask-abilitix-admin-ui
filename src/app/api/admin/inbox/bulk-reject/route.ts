import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { error: 'invalid_request', details: 'ids array is required' },
        { status: 400 }
      );
    }

    const adminApi = getAdminApiBase();
    const cookieHeader = request.headers.get('cookie') || '';

    const response = await fetch(`${adminApi}/admin/inbox/bulk-reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ ids: body.ids }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return NextResponse.json(
        {
          error: 'admin_proxy_error',
          details: errorText || `Admin API returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Inbox bulk reject error:', err);
    return NextResponse.json(
      { error: 'admin_proxy_error', details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}

