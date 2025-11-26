import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase } from '@/lib/env';

type RouteParams = { id: string };

export async function POST(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const adminApi = getAdminApiBase();
  if (!adminApi) {
    return NextResponse.json(
      { error: 'config_error', details: 'ADMIN_API_BASE not configured' },
      { status: 500 }
    );
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { error: 'invalid_request', details: 'Inbox id is required' },
      { status: 400 }
    );
  }

  let payload: any = null;
  try {
    payload = await request.json();
  } catch {
    // Optional note is allowed, so empty body is fine
  }

  const note = typeof payload?.note === 'string' ? payload.note.trim() : undefined;

  const cookieHeader = request.headers.get('cookie') || '';

  try {
    const requestBody: any = {};
    if (note !== undefined) requestBody.note = note;

    const response = await fetch(
      `${adminApi}/admin/inbox/${encodeURIComponent(id)}/mark-reviewed`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
        },
        body: JSON.stringify(requestBody),
        cache: 'no-store',
      }
    );

    const text = await response.text();
    let data: any = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'admin_proxy_error',
          details:
            data?.details ||
            data?.error?.message ||
            data?.error ||
            `Admin API returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data || { ok: true });
  } catch (error) {
    console.error('Mark reviewed proxy error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'admin_proxy_error', details: message },
      { status: 502 }
    );
  }
}

