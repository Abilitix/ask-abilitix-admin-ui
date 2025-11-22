import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase } from '@/lib/env';

function forwardHeaders(request: NextRequest) {
  const headers: Record<string, string> = {};
  const cookie = request.headers.get('cookie');
  if (cookie) {
    headers['cookie'] = cookie;
  }
  headers['content-type'] = request.headers.get('content-type') ?? 'application/json';
  return headers;
}

export async function POST(request: NextRequest) {
  try {
    const adminApi = getAdminApiBase();
    if (!adminApi) {
      return NextResponse.json(
        { error: 'Admin API not configured' },
        { status: 500 }
      );
    }

    const body = await request.text();
    const response = await fetch(`${adminApi}/admin/widget/rotate-key`, {
      method: 'POST',
      headers: forwardHeaders(request),
      body,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[widget/rotate-key][POST] Admin API error:', {
        status: response.status,
        error: errorText,
      });
      return NextResponse.json(
        { error: 'Failed to rotate widget key' },
        { status: response.status }
      );
    }

    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    console.error('[widget/rotate-key][POST] proxy failed', error);
    return NextResponse.json(
      { error: 'widget_rotate_key_proxy_error' },
      { status: 500 }
    );
  }
}

