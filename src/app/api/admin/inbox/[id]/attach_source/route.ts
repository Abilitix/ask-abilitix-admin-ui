import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase } from '@/lib/env';

function forwardHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  const cookie = request.headers.get('cookie');
  if (cookie) {
    headers.cookie = cookie;
  }
  return headers;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: 'admin_proxy_error', details: 'Missing inbox id' },
        { status: 400 }
      );
    }

    const adminApi = getAdminApiBase();
    const body = await request.text();

    const response = await fetch(
      `${adminApi}/admin/inbox/${encodeURIComponent(id)}/attach_source`,
      {
        method: 'POST',
        headers: forwardHeaders(request),
        body,
        cache: 'no-store',
      }
    );

    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    console.error('Inbox attach_source POST error:', error);
    return NextResponse.json({ error: 'admin_proxy_error' }, { status: 500 });
  }
}

