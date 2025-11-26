import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase } from '@/lib/env';

type RouteParams = { id: string };

export async function POST(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const params = await context.params;
  const adminApi = getAdminApiBase();
  if (!adminApi) {
    return NextResponse.json({ error: 'config_error', details: 'ADMIN_API_BASE not configured' }, { status: 500 });
  }

  const inboxId = params?.id;
  if (!inboxId) {
    return NextResponse.json({ error: 'invalid_request', details: 'Inbox id is required' }, { status: 400 });
  }

  let payload: any = null;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request', details: 'Invalid JSON payload' }, { status: 400 });
  }

  const reason = typeof payload?.reason === 'string' ? payload.reason.trim() : '';
  const assignees = Array.isArray(payload?.assignees) ? payload.assignees : [];

  if (reason.length < 20 || reason.length > 500) {
    return NextResponse.json(
      { error: 'invalid_request', details: 'Reason must be between 20 and 500 characters.' },
      { status: 400 }
    );
  }

  if (!assignees.length) {
    return NextResponse.json(
      { error: 'invalid_request', details: 'At least one assignee is required.' },
      { status: 400 }
    );
  }

  const cookieHeader = request.headers.get('cookie') || '';

  try {
    const response = await fetch(`${adminApi}/admin/inbox/${encodeURIComponent(inboxId)}/request-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ reason, assignees }),
      cache: 'no-store',
    });

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
          details: data?.details || data?.error || `Admin API returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data || { ok: true });
  } catch (error) {
    console.error('SME request proxy error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'admin_proxy_error', details: message }, { status: 502 });
  }
}


