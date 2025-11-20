import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase } from '@/lib/env';

function forwardHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  const cookie = request.headers.get('cookie');
  if (cookie) {
    headers.cookie = cookie;
  }
  return headers;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: 'admin_proxy_error', details: 'Missing inbox id' },
        { status: 400 }
      );
    }

    const adminApi = getAdminApiBase();
    const body = await request.text();

    // Debug logging for promotion issues
    let parsedBody: any = {};
    try {
      parsedBody = JSON.parse(body);
    } catch (e) {
      // Body might not be JSON
    }
    
    console.log('Inbox Promote Debug:', {
      inboxId: id,
      requestBody: parsedBody,
      hasCitations: Array.isArray(parsedBody.citations),
      citationsCount: Array.isArray(parsedBody.citations) ? parsedBody.citations.length : 0,
      isFaq: parsedBody.is_faq,
      hasAnswer: !!parsedBody.answer,
      cookieHeader: request.headers.get('cookie')?.substring(0, 50) + '...',
    });

    const response = await fetch(
      `${adminApi}/admin/inbox/${encodeURIComponent(id)}/promote`,
      {
        method: 'POST',
        headers: forwardHeaders(request),
        body,
        cache: 'no-store',
      }
    );

    const responseBody = await response.text();
    
    // Log error responses for debugging
    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = JSON.parse(responseBody);
      } catch (e) {
        // Response might not be JSON
      }
      
      console.error('Inbox Promote Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        requestBody: parsedBody,
      });
    }

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    console.error('Inbox promote POST error:', error);
    return NextResponse.json({ error: 'admin_proxy_error' }, { status: 500 });
  }
}

