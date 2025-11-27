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
    // Empty body is allowed (Admin API accepts empty body)
  }

  // Optional fields for conversion (Admin API accepts empty body, but we can pass these if provided)
  const answer = typeof payload?.answer === 'string' ? payload.answer.trim() : undefined;
  const citations = Array.isArray(payload?.citations) ? payload.citations : undefined;
  const title = typeof payload?.title === 'string' ? payload.title.trim() : undefined;

  const cookieHeader = request.headers.get('cookie') || '';

  try {
    const requestBody: any = {};
    // Only include fields if provided (Admin API accepts empty body)
    if (answer !== undefined) requestBody.answer = answer;
    if (citations !== undefined) requestBody.citations = citations;
    if (title !== undefined) requestBody.title = title;

    const response = await fetch(
      `${adminApi}/admin/inbox/${encodeURIComponent(id)}/convert-to-faq`,
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
    console.error('Convert to FAQ proxy error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'admin_proxy_error', details: message },
      { status: 502 }
    );
  }
}

