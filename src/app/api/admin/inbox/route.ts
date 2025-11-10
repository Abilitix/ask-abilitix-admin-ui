import { NextRequest, NextResponse } from 'next/server';
import { adminGet } from '@/lib/api/admin';

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

    const queryString = forwardParams.toString();
    const path = `/admin/inbox${queryString ? `?${queryString}` : ''}`;

    const data = await adminGet(path, request);
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Inbox GET Error:', err);
    return NextResponse.json(
      { error: 'admin_proxy_error', details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}