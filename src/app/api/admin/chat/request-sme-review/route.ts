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

    // Add timeout wrapper (30 seconds) to handle slow deduplication queries
    const TIMEOUT_MS = 30000; // 30 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${adminApi}/admin/chat/request-sme-review`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Check if it's a timeout/abort error
      if (fetchError.name === 'AbortError' || fetchError.message?.includes('aborted')) {
        console.error('[SME Review] Request timed out after 30 seconds (likely slow deduplication query)');
        return NextResponse.json(
          {
            error: 'timeout',
            details: 'The request timed out. The deduplication check is taking longer than expected. This may indicate a duplicate question exists. Please check the inbox or try again in a moment.',
          },
          { status: 504 } // Gateway Timeout
        );
      }
      
      // Re-throw other fetch errors
      throw fetchError;
    }

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
      let errorCode = 'admin_proxy_error';
      
      // Check error message, details, and raw text for duplicate key violations
      const errorText = text || '';
      // Admin API returns errors in { detail: { error: { code, message, ... } } } format
      const detailError = data?.detail?.error;
      const flatError = data?.error;
      const errorMessage = detailError?.message || flatError?.message || flatError || data?.details || errorText;
      const fullErrorText = JSON.stringify(data) + ' ' + errorText;
      
      console.log('[SME Review] Error details:', {
        status: response.status,
        errorText: errorText.substring(0, 500),
        errorMessage,
        detailErrorCode: detailError?.code,
        flatErrorCode: flatError?.code,
        hasUniqueViolation: fullErrorText.includes('UniqueViolation') || fullErrorText.includes('duplicate key') || fullErrorText.includes('qa_inbox_dedupe'),
      });
      
      // Handle structured errors: { detail: { error: { code, message } } } or { error: { code, message } }
      if (detailError) {
        if (typeof detailError === 'object' && detailError.message) {
          errorDetails = detailError.message;
          errorCode = detailError.code || errorCode;
        }
      } else if (flatError) {
        if (typeof flatError === 'object' && flatError.message) {
          errorDetails = flatError.message;
          errorCode = flatError.code || errorCode;
        } else if (typeof flatError === 'string') {
          errorDetails = flatError;
        }
      }
      
      // Fallback to details if available
      if (data?.details && !errorDetails) {
        errorDetails = data.details;
      }
      
      // Handle specific error cases
      // Admin API returns 409 with duplicate_review_request or duplicate_inbox_item error codes
      // Also handle legacy 500 with UniqueViolation (for backwards compatibility)
      const isDuplicateError = 
        errorCode === 'duplicate_review_request' ||
        errorCode === 'duplicate_inbox_item' ||
        detailError?.code === 'duplicate_review_request' ||
        detailError?.code === 'duplicate_inbox_item' ||
        flatError?.code === 'duplicate_review_request' ||
        flatError?.code === 'duplicate_inbox_item' ||
        fullErrorText.includes('UniqueViolation') ||
        fullErrorText.includes('duplicate key') ||
        fullErrorText.includes('qa_inbox_dedupe') ||
        errorDetails.includes('UniqueViolation') ||
        errorDetails.includes('duplicate key') ||
        errorDetails.includes('qa_inbox_dedupe') ||
        errorMessage.includes('UniqueViolation') ||
        errorMessage.includes('duplicate key') ||
        errorMessage.includes('qa_inbox_dedupe') ||
        errorMessage.includes('already requested');
      
      if ((response.status === 409 || response.status === 500) && isDuplicateError) {
        console.log('[SME Review] Detected duplicate review request, returning 409');
        // Use Admin API's error message if available, otherwise use default
        const duplicateMessage = detailError?.message || 
                                 flatError?.message ||
                                 (errorDetails.includes('already') ? errorDetails : null) ||
                                 'A review request for this question already exists. Please check the inbox.';
        
        return NextResponse.json(
          {
            error: 'duplicate_review_request',
            details: duplicateMessage,
            inbox_id: detailError?.inbox_id || flatError?.inbox_id || data?.inbox_id, // Include existing inbox_id if provided
            status: detailError?.status || flatError?.status || data?.status, // Include status if provided
          },
          { status: 409 } // Return 409 Conflict
        );
      }
      
      return NextResponse.json(
        {
          error: errorCode,
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
      
      // Check if it's a timeout/abort error (shouldn't reach here if handled above, but just in case)
      if (error instanceof Error && (error.name === 'AbortError' || message.includes('aborted'))) {
        return NextResponse.json(
          {
            error: 'timeout',
            details: 'The request timed out. The deduplication check is taking longer than expected. Please check the inbox or try again.',
          },
          { status: 504 }
        );
      }
      
      return NextResponse.json({ error: 'admin_proxy_error', details: message }, { status: 502 });
    }
  } catch (error) {
    console.error('[SME Review] Outer error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'admin_proxy_error', details: message }, { status: 500 });
  }
}

