import { NextRequest, NextResponse } from 'next/server';
import { adminGet } from '@/lib/api/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: 'admin_proxy_error', details: 'Missing inbox id' },
        { status: 400 }
      );
    }

    const data = await adminGet(`/admin/inbox/${encodeURIComponent(id)}`, request);
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Inbox detail GET Error:', err);
    const status =
      typeof (err as { status?: number })?.status === 'number'
        ? (err as { status?: number }).status!
        : 502;

    return NextResponse.json(
      {
        error: 'admin_proxy_error',
        details: err instanceof Error ? err.message : String(err),
      },
      { status }
    );
  }
}

