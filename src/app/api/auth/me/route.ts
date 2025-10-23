// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

type Me = {
  ok: boolean;
  email: string | null;
  user: { id?: string; email: string | null };
  tenant?: { id?: string; slug?: string; role?: string } | null;
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
  
  // Normalize successful response shape
  const normalized: Me = {
    ok: body.ok ?? !!body.user,
    email: body.email ?? body.user?.email ?? null,
    user: body.user ?? { email: body.email ?? null },
    tenant: body.tenant ?? body.currentTenant ?? null,
    role: body.role ?? body.user?.role ?? body.tenant?.role ?? null,
    tenants: body.tenants ?? body.memberships ?? [],
  };

  return NextResponse.json(normalized, { status: r.status });
}