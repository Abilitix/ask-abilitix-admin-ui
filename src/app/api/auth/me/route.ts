// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

type Me = {
  ok: boolean;
  email: string | null;
  user: { id?: string; email: string | null };
  tenant?: { id?: string; slug?: string; role?: string } | null;
  tenant_id?: string | null;
  tenants?: Array<any>;
  role?: string | null;
};

function baseUrl() {
  return process.env.ADMIN_API_BASE || process.env.ADMIN_API;
}

export async function GET() {
  const base = baseUrl();
  const name = process.env.SESSION_COOKIE_NAME || "aa_sess";
  if (!base) return NextResponse.json({ detail: "ADMIN_API_BASE not configured" }, { status: 500 });

  const cookieStore = await cookies();
  const token = cookieStore.get(name)?.value;
  
  if (!token) {
    return NextResponse.json(
      { ok: false, email: null, user: null, tenant: null, role: null, tenants: [] },
      { status: 401 }
    );
  }

  const r = await fetch(`${base}/auth/me`, {
    headers: { cookie: `${name}=${token}` },
    cache: "no-store",
  });

  const body = await r.json().catch(() => ({}));
  
  // If Admin API returned an error, return normalized error response
  if (!r.ok || body.error) {
    return NextResponse.json(
      { ok: false, email: null, user: { email: null }, tenant: null, role: null, tenants: [] },
      { status: r.status }
    );
  }
  
  // Forward backend's Set-Cookie header if present (for cookie refresh when backend enables it)
  const setCookieHeader = r.headers.get('set-cookie');
  const response = NextResponse.json({
    ...body,  // Include all fields from Admin API
    tenant_id: body.tenant_id,  // Explicitly include tenant_id
    tenant: body.tenant_slug ? { slug: body.tenant_slug } : null,  // Map flat to nested structure
  }, { status: r.status });
  
  if (setCookieHeader) {
    response.headers.set('set-cookie', setCookieHeader);
  }
  
  return response;
}