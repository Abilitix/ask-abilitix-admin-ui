import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (
      !body ||
      typeof body.new_faq_id !== 'string' ||
      !Array.isArray(body.obsolete_ids) ||
      body.obsolete_ids.length === 0
    ) {
      return NextResponse.json(
        { error: 'invalid_request', details: 'new_faq_id and obsolete_ids are required' },
        { status: 400 }
      );
    }

    const adminApi = getAdminApiBase();
    const cookieHeader = request.headers.get('cookie') || '';

    const response = await fetch(`${adminApi}/admin/faqs/bulk-supersede`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        new_faq_id: body.new_faq_id,
        obsolete_ids: body.obsolete_ids,
        reason: body.reason,
      }),
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
    console.error('FAQs bulk supersede error:', err);
    return NextResponse.json(
      { error: 'admin_proxy_error', details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}

