import { NextRequest, NextResponse } from 'next/server';
import { askGet } from '@/lib/api/ask';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const topk = searchParams.get('topk') || '8';
    
    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter "q"' },
        { status: 400 }
      );
    }

    // Get tenant context from user session (same as unified endpoint)
    const ADMIN_API = process.env.ADMIN_API;
    if (!ADMIN_API) {
      return NextResponse.json(
        { error: 'Admin API not configured' },
        { status: 500 }
      );
    }

    // Get user session to determine tenant context
    const authResponse = await fetch(`${ADMIN_API}/auth/me`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });

    if (!authResponse.ok) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
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
        question: query,
        session_id: 'ui-rag-test',
        topk: parseInt(topk)
      })
    });

    if (!askResponse.ok) {
      throw new Error(`Ask API failed: ${askResponse.status} ${askResponse.statusText}`);
    }

    const askData = await askResponse.json();
    
    // Debug logging to check tenant isolation
    console.log('RAG Smoke Test Debug:', {
      tenantId: userData.tenant_id,
      query: query,
      answerLength: askData.answer?.length || 0,
      citationsCount: askData.citations?.length || 0,
      citations: askData.citations?.map((c: any) => ({ doc_id: c.doc_id, score: c.score })) || []
    });
    
    // Get document names from Admin API for better user experience
    let documentNames: Record<string, string> = {};
    try {
      const docsResponse = await fetch(`${ADMIN_API}/admin/docs?limit=100`, {
        headers: {
          'Cookie': request.headers.get('cookie') || '' // Use session auth instead of token
        }
      });
      
      if (docsResponse.ok) {
        const docsData = await docsResponse.json();
        documentNames = (docsData.docs || []).reduce((acc: Record<string, string>, doc: any) => {
          acc[doc.id] = doc.title || `Document ${doc.id}`;
          return acc;
        }, {});
        console.log('Document names loaded:', documentNames);
      }
    } catch (error) {
      console.warn('Failed to fetch document names:', error);
    }

    // Transform ask response to RAG hits format
    const ragResults = askData.citations?.map((citation: any, index: number) => ({
      idx: index + 1,
      score: citation.score || 0,
      vec_sim: citation.score || 0,
      trgm_sim: 0, // Not available in ask response
      preview: documentNames[citation.doc_id] || citation.preview || `Document ${citation.doc_id}`
    })) || [];
    
    return NextResponse.json({ hits: ragResults });
  } catch (error) {
    console.error('RAG smoke test failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RAG results', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

