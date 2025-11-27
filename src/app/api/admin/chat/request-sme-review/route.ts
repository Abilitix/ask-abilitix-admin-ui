import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const adminApi = getAdminApiBase();
    if (!adminApi) {
      console.error('[SME Review] ADMIN_API_BASE not configured');
      return NextResponse.json({ error: 'config_error', details: 'ADMIN_API_BASE not configured' }, { status: 500 });
    }

    let payload: any = null;
    try {
      payload = await request.json();
    } catch (parseError) {
      console.error('[SME Review] JSON parse error:', parseError);
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
    // Reason: Admin API requires this field (20-500 chars) and calls .strip() on it
    // So it must be a string, never null/undefined
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

    console.log('[SME Review] Request headers:', {
      hasCookie: cookieHeader.length > 0,
      cookieLength: cookieHeader.length,
      cookiePreview: cookieHeader.substring(0, 50) + (cookieHeader.length > 50 ? '...' : ''),
      hasAuth: authHeader.length > 0,
    });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Forward session cookie if present (always include, even if empty)
      headers['Cookie'] = cookieHeader;

    // Forward bearer token if present (for admin token testing)
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Forward tenant ID header if present
    const tenantId = request.headers.get('x-tenant-id');
    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }

    // Ensure reason is always a valid string (20-500 chars)
    // Admin API requires reason field and calls .strip() on it, so it must be a string
    let finalReason = reason.trim();
    if (!finalReason || finalReason.length < 20) {
      // Use default reason if not provided or too short
      finalReason = 'Please review this answer for accuracy and completeness.';
    }

    // Validate reason length one more time (Admin API requires 20-500 chars)
    if (finalReason.length < 20 || finalReason.length > 500) {
      console.error('[SME Review] Invalid reason length:', {
        length: finalReason.length,
        reason: finalReason.substring(0, 100),
      });
      // Force a valid default if somehow invalid
      finalReason = 'Please review this answer for accuracy and completeness.';
    }

    const requestBody: any = {
      question,
      answer,
      assignees,
      reason: finalReason, // Always include reason (required by Admin API)
    };

    console.log('[SME Review] Request body reason field:', {
      reasonType: typeof finalReason,
      reasonLength: finalReason.length,
      reasonPreview: finalReason.substring(0, 50) + (finalReason.length > 50 ? '...' : ''),
      isString: typeof finalReason === 'string',
      isNull: finalReason === null,
      isUndefined: finalReason === undefined,
    });

    if (citations.length > 0) {
      requestBody.citations = citations;
    }

    if (conversationId) {
      requestBody.conversation_id = conversationId;
    }

    if (messageId) {
      requestBody.message_id = messageId;
    }

    console.log('[SME Review] Calling Admin API:', {
      url: `${adminApi}/admin/chat/request-sme-review`,
      hasCookie: headers['Cookie']?.length > 0,
      cookieLength: headers['Cookie']?.length || 0,
      requestBodyKeys: Object.keys(requestBody),
      assigneesCount: requestBody.assignees?.length || 0,
    });

    const response = await fetch(`${adminApi}/admin/chat/request-sme-review`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      cache: 'no-store',
    });

    console.log('[SME Review] Admin API response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
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
      console.error('[SME Review] Proxy error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;
      console.error('[SME Review] Error stack:', stack);
      return NextResponse.json({ error: 'admin_proxy_error', details: message }, { status: 502 });
    }
  } catch (error) {
    console.error('[SME Review] Outer error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'admin_proxy_error', details: message }, { status: 500 });
  }
}

