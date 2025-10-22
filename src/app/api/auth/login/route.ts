// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function baseUrl() {
  return process.env.ADMIN_API_BASE || process.env.ADMIN_API;
}

function pickCookieValue(rawSetCookie: string[] | null, name: string): string | null {
  if (!rawSetCookie || !rawSetCookie.length) return null;
  const hit = rawSetCookie.find(c => c.trim().toLowerCase().startsWith(`${name.toLowerCase()}=`));
  if (!hit) return null;
  const first = hit.split(";")[0]; // "abilitix_s=VALUE"
  const eq = first.indexOf("=");
  return eq > -1 ? first.slice(eq + 1) : null;
}

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const base = baseUrl();
  if (!base) return NextResponse.json({ detail: "ADMIN_API_BASE not configured" }, { status: 500 });

  const name = process.env.SESSION_COOKIE_NAME || "abilitix_s";
  const ttl = Number(process.env.SESSION_TTL_MINUTES || "60") * 60;

  const upstream = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-auth-proxy": "1" }, // proxy hint (optional)
    body: JSON.stringify({ email, password }),
    redirect: "manual", // don't lose Set-Cookie on 30x
  });

  // Redirects during login are treated as errors (cookie often dropped in 30x)
  if (upstream.status >= 300 && upstream.status < 400) {
    const loc = upstream.headers.get("location") || "";
    return NextResponse.json(
      { detail: `Upstream redirected during login (${upstream.status}) to ${loc}. Login must return 200.` },
      { status: 502 },
    );
  }

  let token: string | null = null;

  // Try JSON token first
  const ct = upstream.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const data = await upstream.json().catch(() => ({}));
    token = data?.session_token || null;
    if (!upstream.ok && !token) {
      return NextResponse.json({ detail: data?.detail || "Invalid credentials" }, { status: upstream.status });
    }
  }

  // Fallback: read upstream Set-Cookie if present
  // @ts-ignore - getSetCookie is available in Next.js Node runtime
  const rawSetCookie: string[] | null = upstream.headers.getSetCookie?.() ?? null;
  if (!token) token = pickCookieValue(rawSetCookie, name);

  if (!token) {
    const bodyText = upstream.ok ? await upstream.text().catch(() => "") : "";
    return NextResponse.json(
      { detail: "Missing session token from upstream", hint: bodyText.slice(0, 200) },
      { status: upstream.ok ? 502 : upstream.status },
    );
  }

  // Mint cookie on UI origin
  const cookieStore = await cookies();
  cookieStore.set({
    name,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    // safest: omit domain so it defaults to current host (works on previews too)
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
    maxAge: ttl,
  });

  return NextResponse.json({ ok: true });
}