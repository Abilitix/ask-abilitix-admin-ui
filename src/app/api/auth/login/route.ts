// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function baseUrl() {
  return process.env.ADMIN_API_BASE || process.env.ADMIN_API || "https://ask-abilitix-admin-api.onrender.com";
}

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const base = baseUrl();
  if (!base) return NextResponse.json({ detail: "ADMIN_API_BASE not configured" }, { status: 500 });

  try {
    // Call Admin API - it handles session cookies automatically
    const response = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));

    // Forward the response from Admin API
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Login proxy error:', error);
    return NextResponse.json(
      { detail: "Unable to connect to authentication service" },
      { status: 500 }
    );
  }
}