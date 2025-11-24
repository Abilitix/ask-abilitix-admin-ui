import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { new_faq_id, obsolete_faq_ids, reason } = body;

    if (!new_faq_id || !obsolete_faq_ids || !Array.isArray(obsolete_faq_ids) || obsolete_faq_ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: new_faq_id and obsolete_faq_ids' },
        { status: 400 }
      );
    }

    const adminApi = getAdminApiBase();
    const cookieHeader = request.headers.get('cookie') || '';

    const response = await fetch(`${adminApi}/admin/faqs/supersede`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        new_faq_id,
        obsolete_faq_ids,
        reason: reason || undefined,
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
    console.error('FAQ Supersede Error:', err);
    return NextResponse.json(
      { error: 'admin_proxy_error', details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}

