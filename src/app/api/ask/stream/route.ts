import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Establish SSE connection for EventSource
  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST",
      "Access-Control-Allow-Headers": "Content-Type, x-tenant-slug, x-widget-key",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, session_id, max_tokens, topk } = body;
    const { searchParams } = new URL(req.url);
    const stream = searchParams.get('stream') !== 'false'; // Default to streaming unless explicitly disabled

    if (!question) {
      return new NextResponse('Missing question', { status: 400 });
    }

    // Get tenant context from user session
    const ADMIN_API = process.env.ADMIN_API;
    if (!ADMIN_API) {
      return new NextResponse('Admin API not configured', { status: 500 });
    }

    // Get user session to determine tenant context
    const authResponse = await fetch(`${ADMIN_API}/auth/me`, {
      headers: {
        'Cookie': req.headers.get('cookie') || ''
      }
    });

    if (!authResponse.ok) {
      return new NextResponse('Authentication required', { status: 401 });
    }

    const userData = await authResponse.json();
    
    // Call Ask API with tenant context from session
    const askResponse = await fetch(`${process.env.NEXT_PUBLIC_ASK_BASE}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': userData.tenant_id, // Use tenant ID from session
      },
      body: JSON.stringify({
        question,
        session_id: session_id || 'ui-rag-stream',
        ...(max_tokens ? { max_tokens } : {}),
        ...(topk ? { topk } : {}),
      }),
    });

    if (!askResponse.ok) {
      throw new Error(`Ask API failed: ${askResponse.status}`);
    }

    const askData = await askResponse.json();
    
    // Debug logging to check tenant isolation and answer source
    console.log('Ask API Response Debug:', {
      tenantId: userData.tenant_id,
      question: question,
      answerLength: askData.answer?.length || 0,
      citationsCount: askData.citations?.length || 0,
      citations: askData.citations?.map((c: any) => ({ doc_id: c.doc_id, score: c.score })) || [],
      source: askData.source,
      source_detail: askData.source_detail,
      match: askData.match ? {
        matched: askData.match.matched,
        source_detail: askData.match.source_detail,
        id: askData.match.id
      } : null
    });

    // Return response based on streaming preference
    if (stream) {
      // Return as streaming data
      const streamResponse = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(askData)}\n\n`));
          controller.close();
        }
      });

      return new NextResponse(streamResponse, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-store",
          "Connection": "keep-alive",
        },
      });
    } else {
      // Return as regular JSON response
      return new NextResponse(JSON.stringify(askData), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

  } catch (error) {
    console.error('Ask stream error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

