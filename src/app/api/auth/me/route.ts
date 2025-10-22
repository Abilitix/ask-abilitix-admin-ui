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
  const name = process.env.SESSION_COOKIE_NAME || "abilitix_s";
  if (!base) return NextResponse.json({ detail: "ADMIN_API_BASE not configured" }, { status: 500 });

  const cookieStore = await cookies();
  const token = cookieStore.get(name)?.value;
  
  console.log('Auth me cookie check:', {
    cookieName: name,
    hasToken: !!token,
    tokenLength: token?.length || 0,
    allCookies: cookieStore.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
  });
  
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
  
  // Normalize response shape to prevent UI regressions
  const normalized: Me = {
    ok: body.ok ?? !!body.user,
    email: body.email ?? body.user?.email ?? null,
    user: body.user ?? { email: body.email ?? null },
    tenant: body.tenant ?? body.currentTenant ?? null,
    role: body.role ?? body.user?.role ?? body.tenant?.role ?? null,
    tenants: body.tenants ?? body.memberships ?? [],
  };

  // Log warning on payload drift
  if (!("email" in body) && !body.user?.email) {
    console.warn("auth/me: email missing in both root and user", { bodyKeys: Object.keys(body) });
  }

  return NextResponse.json(normalized, { status: r.status });
}