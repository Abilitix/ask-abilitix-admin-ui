// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function baseUrl() {
  return process.env.ADMIN_API_BASE || process.env.ADMIN_API;
}

export async function GET() {
  const base = baseUrl();
  const name = process.env.SESSION_COOKIE_NAME || "abilitix_s";
  if (!base) return NextResponse.json({ detail: "ADMIN_API_BASE not configured" }, { status: 500 });

  const cookieStore = await cookies();
  const token = cookieStore.get(name)?.value;
  if (!token) return NextResponse.json({ detail: "No session" }, { status: 401 });

  const r = await fetch(`${base}/auth/me`, {
    headers: { cookie: `${name}=${token}` },
    cache: "no-store",
  });

  const body = await r.json().catch(() => ({}));
  return NextResponse.json(body, { status: r.status });
}