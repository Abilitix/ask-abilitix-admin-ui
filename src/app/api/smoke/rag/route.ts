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

    const tenantId = process.env.TENANT_ID;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'TENANT_ID not configured' },
        { status: 500 }
      );
    }

    // Use the working /ask endpoint with POST method
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Only add tenant slug header if it exists
    if (process.env.NEXT_PUBLIC_TENANT_SLUG) {
      headers['X-Tenant-Slug'] = process.env.NEXT_PUBLIC_TENANT_SLUG;
    }
    
    // Only add widget key header if it exists
    if (process.env.ADMIN_TOKEN) {
      headers['X-Widget-Key'] = process.env.ADMIN_TOKEN;
    }
    
    const askResponse = await fetch(`${process.env.NEXT_PUBLIC_ASK_BASE}/ask`, {
      method: 'POST',
      headers,
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
    
    // Get document names from Admin API for better user experience
    let documentNames: Record<string, string> = {};
    try {
      const docsResponse = await fetch(`${process.env.ADMIN_API}/admin/docs?limit=100`, {
        headers: {
          'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`,
          'X-Tenant-Id': tenantId
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

