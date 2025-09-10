import { NextResponse } from 'next/server';
import { adminPost } from '@/lib/api/admin';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.title || !body?.text) {
      return NextResponse.json(
        { error: 'bad_request', details: 'title and text are required' },
        { status: 400 }
      );
    }
    const data = await adminPost('/admin/docs/upload_text', body);
    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'admin_proxy_error', details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
