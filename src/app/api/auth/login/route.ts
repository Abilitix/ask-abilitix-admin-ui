import { NextResponse } from "next/server";
import { cookies } from "next/headers";
export const runtime = "nodejs";

const BASE = process.env.ADMIN_API_BASE || process.env.ADMIN_API;
const NAME = process.env.SESSION_COOKIE_NAME || "abilitix_s";
const TTL  = (Number(process.env.SESSION_TTL_MINUTES || "60") * 60) | 0;

function pickCookieValue(raw: string[] | null, name: string): string | null {
  if (!raw || !raw.length) return null;
  const hit = raw.find(h => h.toLowerCase().startsWith(`${name.toLowerCase()}=`));
  if (!hit) return null;
  const first = hit.split(";")[0];
  const eq = first.indexOf("=");
  return eq > -1 ? first.slice(eq + 1) : null;
}

export async function POST(req: Request) {
  if (!BASE) return NextResponse.json({ detail: "ADMIN_API_BASE not configured" }, { status: 500 });
  const { email, password } = await req.json();

  const upstream = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
    redirect: "manual",
  });

  if (!upstream.ok && (upstream.status < 300 || upstream.status >= 400)) {
    const err = await upstream.json().catch(() => ({}));
    return NextResponse.json({ detail: err.detail || "Login failed" }, { status: upstream.status });
  }

  // @ts-ignore – Node runtime exposes getSetCookie()
  const rawSetCookie: string[] | null = upstream.headers.getSetCookie?.() ?? null;
  const token = pickCookieValue(rawSetCookie, NAME);
  if (!token) return NextResponse.json({ detail: "Missing session cookie" }, { status: 502 });

  // ✅ Mint cookie on UI domain with explicit domain setting
  const cookieStore = await cookies();
  
  // Set cookie with explicit domain to ensure cross-subdomain access
  cookieStore.set(NAME, token, {
    domain: ".abilitix.com.au",
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: TTL,
  });

  return NextResponse.json({ ok: true });
}