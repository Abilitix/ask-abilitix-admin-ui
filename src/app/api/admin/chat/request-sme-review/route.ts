import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase } from '@/lib/env';

export async function POST(request: NextRequest) {
  const adminApi = getAdminApiBase();
  if (!adminApi) {
    return NextResponse.json({ error: 'config_error', details: 'ADMIN_API_BASE not configured' }, { status: 500 });
  }

  let payload: any = null;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request', details: 'Invalid JSON payload' }, { status: 400 });
  }

  // Validate required fields
  const question = typeof payload?.question === 'string' ? payload.question.trim() : '';
  const answer = typeof payload?.answer === 'string' ? payload.answer.trim() : '';
  const assignees = Array.isArray(payload?.assignees) ? payload.assignees : [];

  if (question.length < 10 || question.length > 500) {
    return NextResponse.json(
      { error: 'invalid_request', details: 'Question must be between 10 and 500 characters.' },
      { status: 400 }
    );
  }

  if (answer.length < 20 || answer.length > 5000) {
    return NextResponse.json(
      { error: 'invalid_request', details: 'Answer must be between 20 and 5000 characters.' },
      { status: 400 }
    );
  }

  if (!assignees.length) {
    return NextResponse.json(
      { error: 'invalid_request', details: 'At least one assignee is required.' },
      { status: 400 }
    );
  }

  // Optional fields
  const citations = Array.isArray(payload?.citations) ? payload.citations : [];
  const reason = typeof payload?.reason === 'string' ? payload.reason.trim() : '';
  const conversationId = typeof payload?.conversation_id === 'string' ? payload.conversation_id : undefined;
  const messageId = typeof payload?.message_id === 'string' ? payload.message_id : undefined;

  // Validate citations structure if provided
  if (citations.length > 0) {
    for (const citation of citations) {
      if (!citation?.doc_id || typeof citation.doc_id !== 'string') {
        return NextResponse.json(
          { error: 'invalid_request', details: 'Each citation must have a valid doc_id.' },
          { status: 400 }
        );
      }
    }
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const authHeader = request.headers.get('authorization') || '';

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Forward session cookie if present
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    // Forward bearer token if present (for admin token testing)
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Forward tenant ID header if present
    const tenantId = request.headers.get('x-tenant-id');
    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }

    const requestBody: any = {
      question,
      answer,
      assignees,
    };

    if (citations.length > 0) {
      requestBody.citations = citations;
    }

    if (reason) {
      requestBody.reason = reason;
    }

    if (conversationId) {
      requestBody.conversation_id = conversationId;
    }

    if (messageId) {
      requestBody.message_id = messageId;
    }

    const response = await fetch(`${adminApi}/admin/chat/request-sme-review`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      cache: 'no-store',
    });

    const text = await response.text();
    let data: any = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      // Backend returns structured errors: { error: { code: string, message: string } }
      // Or flat errors: { error: string, details: string }
      let errorDetails = `Admin API returned ${response.status}`;
      
      if (data?.error) {
        if (typeof data.error === 'object' && data.error.message) {
          // Structured error: { error: { code, message } }
          errorDetails = data.error.message;
        } else if (typeof data.error === 'string') {
          // Flat error string
          errorDetails = data.error;
        }
      }
      
      // Fallback to details if available
      if (data?.details) {
        errorDetails = data.details;
      }
      
      return NextResponse.json(
        {
          error: 'admin_proxy_error',
          details: errorDetails,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data || { ok: true, message: 'SME review request sent.' });
  } catch (error) {
    console.error('Chat SME review request proxy error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'admin_proxy_error', details: message }, { status: 502 });
  }
}

