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

export async function GET(request: NextRequest) {
  try {
    const adminApi = getAdminApiBase();
    if (!adminApi) {
      return NextResponse.json(
        { error: 'Admin API not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${adminApi}/admin/widget/config`, {
      method: 'GET',
      headers: forwardHeaders(request),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[widget/config][GET] Admin API error:', {
        status: response.status,
        error: errorText,
      });
      return NextResponse.json(
        { error: 'Failed to fetch widget config' },
        { status: response.status }
      );
    }

    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    console.error('[widget/config][GET] proxy failed', error);
    return NextResponse.json(
      { error: 'widget_config_proxy_error' },
      { status: 500 }
    );
  }
}

