import { NextRequest, NextResponse } from 'next/server';

const ADMIN_BASE = process.env.ADMIN_BASE;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const TENANT_ID = process.env.TENANT_ID;

if (!ADMIN_BASE || !ADMIN_TOKEN || !TENANT_ID) {
  throw new Error('Missing required environment variables: ADMIN_BASE, ADMIN_TOKEN, or TENANT_ID');
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'DELETE');
}

async function handleRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const path = `/${pathSegments.join('/')}`;
    const url = new URL(request.url);
    const searchParams = url.searchParams.toString();
    const fullPath = `${path}${searchParams ? `?${searchParams}` : ''}`;
    
    const targetUrl = `${ADMIN_BASE}${fullPath}`;
    
    const headers = {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'X-Tenant-Id': TENANT_ID,
      'Content-Type': 'application/json',
    };

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
