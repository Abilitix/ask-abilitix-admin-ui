import { NextRequest, NextResponse } from 'next/server';

function getRuntimeBase() {
  const base = process.env.NEXT_PUBLIC_ASK_BASE;
  if (!base) {
    throw new Error('Missing NEXT_PUBLIC_ASK_BASE');
  }
  return base.replace(/\/+$/, '');
}

export async function POST(request: NextRequest) {
  try {
    const { question, tenantSlug, refId } = (await request.json().catch(() => ({}))) as {
      question?: string;
      tenantSlug?: string;
      refId?: string;
    };

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'question_required' }, { status: 400 });
    }

    const runtimeBase = getRuntimeBase();
    const url = `${runtimeBase}/ask?debug=1`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(tenantSlug ? { 'x-tenant-slug': tenantSlug } : {}),
      },
      body: JSON.stringify({
        q: question,
        metadata: refId ? { inbox_ref_id: refId } : undefined,
      }),
    });

    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    console.error('[test-ask] failed', error);
    return NextResponse.json({ error: 'test_ask_failed' }, { status: 500 });
  }
}


