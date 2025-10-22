// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function baseUrl() {
  return process.env.ADMIN_API_BASE || process.env.ADMIN_API || "https://ask-abilitix-admin-api.onrender.com";
}

function extractCookieValue(setCookieHeader: string, cookieName: string): string | null {
  const match = setCookieHeader.match(new RegExp(`${cookieName}=([^;]+)`));
  return match ? match[1] : null;
}

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const base = baseUrl();
  if (!base) return NextResponse.json({ detail: "ADMIN_API_BASE not configured" }, { status: 500 });

  try {
    // Call Admin API - it sets session cookie on its domain
    const response = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));

    // Extract cookie from Admin API response and set on UI domain
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      const cookieValue = extractCookieValue(setCookieHeader, 'abilitix_s');
      if (cookieValue) {
        // Set cookie on UI domain for cross-subdomain access
        const cookieStore = await cookies();
        cookieStore.set('abilitix_s', cookieValue, {
          domain: '.abilitix.com.au',  // UI domain
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 60 * 60 // 1 hour
        });
      }
    }

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