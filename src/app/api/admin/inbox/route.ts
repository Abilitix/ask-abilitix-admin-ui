import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase } from '@/lib/env';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Allow legacy status param while supporting new filters
    const forwardParams = new URLSearchParams();

    const status = searchParams.get('status');
    if (status) {
      forwardParams.set('status', status);
    }

    const limit = searchParams.get('limit');
    if (limit) {
      forwardParams.set('limit', limit);
    }

    const cursor = searchParams.get('cursor');
    if (cursor) {
      forwardParams.set('cursor', cursor);
    }

    const tag = searchParams.get('tag');
    if (tag) {
      forwardParams.set('tag', tag);
    }

    const ref = searchParams.get('ref');
    if (ref) {
      forwardParams.set('ref', ref);
    }

    const qHash = searchParams.get('q_hash');
    if (qHash) {
      forwardParams.set('q_hash', qHash);
    }

    const assignedToMe = searchParams.get('assigned_to_me');
    if (assignedToMe) {
      forwardParams.set('assigned_to_me', assignedToMe);
    }

    const queryString = forwardParams.toString();
    const path = `/admin/inbox${queryString ? `?${queryString}` : ''}`;

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

    // Handle 204 No Content or empty responses
    if (response.status === 204) {
      return NextResponse.json({ items: [], next_cursor: null });
    }

    // Check content-type to ensure we're getting JSON
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      // If it's not JSON, return a safe error shape
      if (!isJson) {
        return NextResponse.json(
          {
            items: [],
            next_cursor: null,
            error: 'admin_proxy_error',
            details: errorText || `Admin API returned ${response.status}`,
          },
          { status: response.status }
        );
      }
      return NextResponse.json(
        {
          error: 'admin_proxy_error',
          details: errorText || `Admin API returned ${response.status}`,
        },
        { status: response.status }
      );
    }

    // If not JSON, return safe empty shape
    if (!isJson) {
      const text = await response.text().catch(() => '');
      console.warn('Inbox GET: Non-JSON response from Admin API', { contentType, text: text.substring(0, 200) });
      return NextResponse.json({ items: [], next_cursor: null });
    }

    // Try to parse JSON, but handle empty responses
    const text = await response.text();
    let data: any = null;

    if (text && text.trim().length > 0) {
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error('Inbox GET: Failed to parse JSON:', parseErr);
        return NextResponse.json({ items: [], next_cursor: null });
      }
    }

    // Ensure we always return a safe shape
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ items: [], next_cursor: null });
    }

    // Normalize the response shape - accept both {items:[...]} and [...] (defensive)
    const items = Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.rows)
        ? data.rows
        : Array.isArray(data)
          ? data
          : [];

    const nextCursor =
      typeof data.next_cursor === 'string' && data.next_cursor.length > 0
        ? data.next_cursor
        : null;

    return NextResponse.json({ items, next_cursor: nextCursor });
  } catch (err: unknown) {
    console.error('Inbox GET Error:', err);
    return NextResponse.json(
      { error: 'admin_proxy_error', details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}