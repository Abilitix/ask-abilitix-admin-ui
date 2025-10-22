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

  const upstream = await fetch(`${BASE}/public/signin`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
    redirect: "manual",
  });

  if (!upstream.ok && (upstream.status < 300 || upstream.status >= 400)) {
    const err = await upstream.json().catch(() => ({}));
    return NextResponse.json({ detail: err.detail || "Login failed" }, { status: upstream.status });
  }

  // Extract cookie from Admin API response
  const setCookieHeader = upstream.headers.get('set-cookie');
  if (!setCookieHeader) return NextResponse.json({ detail: "No session cookie from Admin API" }, { status: 502 });
  
  // Extract cookie value
  const cookieValue = pickCookieValue([setCookieHeader], NAME);
  if (!cookieValue) return NextResponse.json({ detail: "Invalid session cookie format" }, { status: 502 });

  // Set cookie on UI domain using Next.js cookies helper
  const cookieStore = await cookies();
  cookieStore.set(NAME, cookieValue, {
    domain: '.abilitix.com.au',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: TTL
  });

  return NextResponse.json({ ok: true });
}