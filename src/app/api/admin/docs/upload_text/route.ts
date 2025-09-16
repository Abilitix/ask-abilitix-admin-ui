import { NextRequest, NextResponse } from 'next/server';
import { adminPost } from '@/lib/api/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.title || !body?.text) {
      return NextResponse.json(
        { error: 'bad_request', details: 'title and text are required' },
        { status: 400 }
      );
    }

    // Debug logging for upload issues
    console.log('Document Upload Debug:', {
      title: body.title,
      textLength: body.text?.length || 0,
      cookieHeader: req.headers.get('cookie')?.substring(0, 50) + '...'
    });

    const data = await adminPost('/admin/docs/upload_text', body, req);
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Document Upload Error:', err);
    return NextResponse.json(
      { error: 'admin_proxy_error', details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
