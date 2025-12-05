import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase } from '@/lib/env';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'DELETE');
}

async function handleRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const ADMIN_API = getAdminApiBase();
    
    if (!ADMIN_API) {
      return NextResponse.json(
        { error: 'ADMIN_API not configured' },
        { status: 500 }
      );
    }

    // Prepend /admin to the path since all Admin API endpoints are under /admin
    const path = `/admin/${pathSegments.join('/')}`;
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    const fullPath = `${path}${searchParams ? `?${searchParams}` : ''}`;
    
    const targetUrl = `${ADMIN_API}${fullPath}`;
    
    // Forward cookies for authentication
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Get tenant context from user session (for X-Tenant-Id header)
    // Skip for SuperAdmin endpoints (billing, governance, superadmin) - they don't need tenant_id
    const isSuperAdminEndpoint = pathSegments[0] === 'billing' || 
                                  pathSegments[0] === 'governance' || 
                                  pathSegments[0] === 'superadmin';
    
    let tenantId: string | undefined;
    if (!isSuperAdminEndpoint) {
      try {
        const authResponse = await fetch(`${ADMIN_API}/auth/me`, {
          headers: {
            'Cookie': cookieHeader
          },
          cache: 'no-store',
        });

        if (authResponse.ok) {
          const userData = await authResponse.json();
          tenantId = userData.tenant_id;
        }
        // If auth fails, continue without tenant_id (some endpoints may not need it)
      } catch (authError) {
        // If auth check fails, continue without tenant_id
        // This allows endpoints that don't require authentication to still work
        console.warn('Failed to get tenant_id for catch-all proxy:', authError);
      }
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
    };

    // Add X-Tenant-Id header if available (required for storage endpoints)
    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }

    const body = method !== 'GET' ? await request.text() : undefined;

    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { 
          error: 'admin_proxy_error', 
          details: `Admin API ${method} failed: ${response.status} ${response.statusText}`,
          response: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json(
      { 
        error: 'admin_proxy_error', 
        details: err instanceof Error ? err.message : String(err) 
      },
      { status: 502 }
    );
  }
}
