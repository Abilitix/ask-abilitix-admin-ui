export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

import { getAdminApiBase } from '@/lib/env';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ADMIN_API = getAdminApiBase();

    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Forward cookies for session-based authentication
    const cookieHeader = req.headers.get('cookie') || '';

    console.log('[Open Document] Request:', { docId: id, adminApi: ADMIN_API });

    const response = await fetch(`${ADMIN_API}/admin/docs/${encodeURIComponent(id)}/open`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'Cache-Control': 'no-store'
      },
      cache: 'no-store',
    });

    console.log('[Open Document] Response:', { status: response.status, ok: response.ok });

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      console.error('[Open Document] Error:', { status: response.status, data });
      
      // Preserve backend error structure if available
      // Backend may return: { detail: { error: { code, message } } } or { error: { code, message } }
      const errorCode = data?.detail?.error?.code || data?.error?.code || data?.detail?.code;
      const errorMessage = data?.detail?.error?.message || data?.error?.message || data?.detail?.message || data?.message;
      
      return NextResponse.json(
        { 
          error: {
            code: errorCode || (response.status === 404 ? 'no_original_file' : 'open_failed'),
            message: errorMessage || 'Failed to open document'
          },
          detail: data.detail || data.error || { message: `Admin API returned ${response.status}` },
          status: response.status
        },
        { status: response.status, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(data, { 
      status: response.status, 
      headers: { 'Cache-Control': 'no-store' } 
    });
  } catch (error) {
    console.error('[Open Document] Exception:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}


