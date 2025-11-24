import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase } from '@/lib/env';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Forward query parameters to Admin API
    const forwardParams = new URLSearchParams();

    const status = searchParams.get('status');
    if (status) {
      forwardParams.set('status', status);
    }

    const search = searchParams.get('search');
    if (search) {
      forwardParams.set('search', search);
    }

    const limit = searchParams.get('limit');
    if (limit) {
      forwardParams.set('limit', limit);
    }

    const offset = searchParams.get('offset');
    if (offset) {
      forwardParams.set('offset', offset);
    }

    const docId = searchParams.get('doc_id');
    if (docId) {
      forwardParams.set('doc_id', docId);
    }

    const queryString = forwardParams.toString();
    const path = `/admin/faqs${queryString ? `?${queryString}` : ''}`;

    const adminApi = getAdminApiBase();
    const cookieHeader = request.headers.get('cookie') || '';

    const response = await fetch(`${adminApi}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      cache: 'no-store',
    });

    // Handle non-OK responses
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

    // Parse JSON response
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!isJson) {
      const text = await response.text().catch(() => '');
      console.warn('FAQs GET: Non-JSON response from Admin API', { contentType, text: text.substring(0, 200) });
      return NextResponse.json({ items: [], total: 0, limit: 50, offset: 0 });
    }

    const text = await response.text();
    let data: any = null;

    if (text && text.trim().length > 0) {
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error('FAQs GET: Failed to parse JSON:', parseErr);
        return NextResponse.json({ items: [], total: 0, limit: 50, offset: 0 });
      }
    }

    // Ensure we always return a safe shape
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ items: [], total: 0, limit: 50, offset: 0 });
    }

    // Normalize the response shape
    const items = Array.isArray(data.items) ? data.items : [];
    const total = typeof data.total === 'number' ? data.total : items.length;
    const responseLimit = typeof data.limit === 'number' ? data.limit : 50;
    const responseOffset = typeof data.offset === 'number' ? data.offset : 0;

    return NextResponse.json({ items, total, limit: responseLimit, offset: responseOffset });
  } catch (err: unknown) {
    console.error('FAQs GET Error:', err);
    return NextResponse.json(
      { error: 'admin_proxy_error', details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}

