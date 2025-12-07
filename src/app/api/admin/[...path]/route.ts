import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase } from '@/lib/env';
import { getAuthUser } from '@/lib/auth';

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'PATCH');
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
    // Skip for SuperAdmin endpoints (billing, governance, superadmin, tenants DELETE) - they don't need tenant_id
    // DELETE /admin/tenants/{tenant_id} is SuperAdmin-only (tenant deletion)
    // Exception: /admin/billing/tenants/{tenant_id}/usage is allowed for tenants accessing their own data
    // Exception: /admin/billing/me/* are tenant self-serve endpoints (session-based auth)
    const isTenantSelfServeUsage = pathSegments[0] === 'billing' && 
                                    pathSegments[1] === 'tenants' && 
                                    pathSegments[3] === 'usage' &&
                                    pathSegments.length === 4;
    
    const isTenantSelfServeMe = pathSegments[0] === 'billing' && 
                                 pathSegments[1] === 'me';
    
    const isSuperAdminEndpoint = (pathSegments[0] === 'billing' && !isTenantSelfServeUsage && !isTenantSelfServeMe) || 
                                  pathSegments[0] === 'governance' || 
                                  pathSegments[0] === 'superadmin' ||
                                  (pathSegments[0] === 'tenants' && method === 'DELETE' && pathSegments.length === 2);
    
    let tenantId: string | undefined;
    let isSuperAdmin = false;
    let requestTenantId: string | undefined;
    
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
        
        // For tenant self-serve usage endpoint, verify the tenant_id in path matches the user's tenant_id
        if (isTenantSelfServeUsage && tenantId) {
          requestTenantId = pathSegments[2]; // Extract tenant_id from path
          if (requestTenantId !== tenantId) {
            // Tenant trying to access another tenant's data - deny access
            return NextResponse.json(
              { error: 'Forbidden', details: 'You can only access your own usage data' },
              { status: 403 }
            );
          }
        }
      } catch (authError) {
        // If auth check fails, continue without tenant_id
        // This allows endpoints that don't require authentication to still work
        console.warn('Failed to get tenant_id for catch-all proxy:', authError);
      }
    } else {
      // For SuperAdmin endpoints, verify user is SuperAdmin and get ADMIN_API_TOKEN
      // Create a Headers object from the request headers for getAuthUser
      try {
        const headers = new Headers();
        if (cookieHeader) {
          headers.set('cookie', cookieHeader);
        }
        const user = await getAuthUser(headers);
        if (user) {
          // Check if user email is in superadmin list (server-side)
          const SUPERADMIN_EMAILS = process.env.NEXT_PUBLIC_SUPERADMIN_EMAILS?.split(',') ?? [];
          isSuperAdmin = SUPERADMIN_EMAILS.includes(user.email);
        }
      } catch (authError) {
        // If auth check fails, continue without SuperAdmin token
        // The Admin API will return 401/403 if SuperAdmin access is required
        console.warn('Failed to verify SuperAdmin status:', authError);
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

    // Add ADMIN_API_TOKEN for SuperAdmin endpoints (required by Admin API)
    if (isSuperAdminEndpoint && isSuperAdmin) {
      const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;
      if (ADMIN_API_TOKEN) {
        headers['Authorization'] = `Bearer ${ADMIN_API_TOKEN}`;
      }
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
