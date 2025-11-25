import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'invalid_request', details: 'Request body is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.question || typeof body.question !== 'string') {
      return NextResponse.json(
        { error: 'invalid_request', details: 'question is required' },
        { status: 400 }
      );
    }

    if (!body.answer || typeof body.answer !== 'string') {
      return NextResponse.json(
        { error: 'invalid_request', details: 'answer is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.citations) || body.citations.length === 0) {
      return NextResponse.json(
        { error: 'invalid_request', details: 'citations array is required and must not be empty' },
        { status: 400 }
      );
    }

    const adminApi = getAdminApiBase();
    const cookieHeader = request.headers.get('cookie') || '';

    const response = await fetch(`${adminApi}/admin/inbox/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        question: body.question,
        answer: body.answer,
        citations: body.citations,
        tags: body.tags || [],
        as_faq: body.as_faq !== false, // Default to true
        request_sme_review: body.request_sme_review === true,
        assignees: body.assignees || [],
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
    console.error('Inbox manual creation error:', err);
    return NextResponse.json(
      { error: 'admin_proxy_error', details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}

