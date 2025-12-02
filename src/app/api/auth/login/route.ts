import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BASE = process.env.ADMIN_API_BASE || process.env.ADMIN_API;

export async function POST(req: Request) {
  if (!BASE) {
    return NextResponse.json(
      { detail: "ADMIN_API_BASE not configured" },
      { status: 500 }
    );
  }

  const { email, password } = await req.json();

  // Call the password login endpoint
  const upstream = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
    redirect: "manual",
  });

  if (!upstream.ok && (upstream.status < 300 || upstream.status >= 400)) {
    const err = await upstream.json().catch(() => ({}));
    return NextResponse.json(
      { detail: err.detail || "Login failed" },
      { status: upstream.status }
    );
  }

  // Forward backend's Set-Cookie header (preserves 24h Max-Age)
  const setCookieHeader = upstream.headers.get('set-cookie');
  
  // Get backend's actual response data (user info, tenant, etc.)
  const responseData = await upstream.json().catch(() => ({ ok: true }));
  const response = NextResponse.json(responseData);
  
  if (setCookieHeader) {
    response.headers.set('set-cookie', setCookieHeader);
  }
  
  return response;
}