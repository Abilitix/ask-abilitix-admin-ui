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
    const search = request.nextUrl.search ?? '';
    const response = await fetch(`${adminApi}/admin/tenant-settings${search}`, {
      method: 'GET',
      headers: forwardHeaders(request),
      cache: 'no-store',
    });

    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    console.error('[tenant-settings][GET] proxy failed', error);
    return NextResponse.json({ error: 'tenant_settings_proxy_error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminApi = getAdminApiBase();
    const body = await request.text();
    const response = await fetch(`${adminApi}/admin/tenant-settings`, {
      method: 'POST',
      headers: forwardHeaders(request),
      body,
      cache: 'no-store',
    });

    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    console.error('[tenant-settings][POST] proxy failed', error);
    return NextResponse.json({ error: 'tenant_settings_proxy_error' }, { status: 500 });
  }
}


