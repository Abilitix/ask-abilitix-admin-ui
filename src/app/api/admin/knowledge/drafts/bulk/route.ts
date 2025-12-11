import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase } from '@/lib/env';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.draft_ids) || body.draft_ids.length === 0) {
      return NextResponse.json(
        { error: 'invalid_request', details: 'draft_ids array is required' },
        { status: 400 }
      );
    }

    if (body.draft_ids.length > 100) {
      return NextResponse.json(
        { error: 'invalid_request', details: 'Maximum 100 drafts per request' },
        { status: 400 }
      );
    }

    const adminApi = getAdminApiBase();
    const cookieHeader = request.headers.get('cookie') || '';

    const response = await fetch(`${adminApi}/admin/knowledge/drafts/bulk`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ draft_ids: body.draft_ids }),
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
    console.error('Drafts bulk delete error:', err);
    return NextResponse.json(
      { error: 'admin_proxy_error', details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}

