// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCookieDomain } from "@/lib/env";

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

export async function GET(req: NextRequest) {
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
    // Rewrite cookie domain for preview environments (same as login route)
    const requestHost = req.nextUrl.hostname;
    const previewFlag =
      process.env.PREVIEW_LOGIN_PROXY === '1' ||
      process.env.PREVIEW_LOGIN_PROXY === 'true';
    const isPreviewHost =
      previewFlag && (process.env.VERCEL_ENV === 'preview' || requestHost.includes('vercel.app'));
    
    if (isPreviewHost) {
      try {
        const rewrittenCookie = rewriteSetCookieForPreview(setCookieHeader, requestHost);
        if (rewrittenCookie) {
          response.headers.set('set-cookie', rewrittenCookie);
        }
      } catch (error) {
        console.warn('Failed to rewrite preview cookie, forwarding original header:', error);
        response.headers.set('set-cookie', setCookieHeader);
      }
    } else {
      response.headers.set('set-cookie', setCookieHeader);
    }
  }
  
  return response;
}

function rewriteSetCookieForPreview(setCookieHeader: string, hostname: string): string {
  // Only handle single cookie header (Admin API sets one session cookie)
  const [cookiePart, ...attributeParts] = setCookieHeader.split(';').map(part => part.trim());
  const [cookieName, ...valueParts] = cookiePart.split('=');
  if (!cookieName || valueParts.length === 0) {
    throw new Error('Invalid Set-Cookie header structure');
  }

  const cookieValue = valueParts.join('=');

  const attributes = attributeParts.reduce<Record<string, string | true>>((acc, part) => {
    const [key, ...rest] = part.split('=');
    if (!key) return acc;
    const normalizedKey = key.toLowerCase();
    if (rest.length === 0) {
      acc[normalizedKey] = true;
    } else {
      acc[normalizedKey] = rest.join('=');
    }
    return acc;
  }, {});

  const domain = getCookieDomain(hostname);
  const path = typeof attributes['path'] === 'string' ? attributes['path'] : '/';
  const httpOnly = Object.prototype.hasOwnProperty.call(attributes, 'httponly');
  const secure = Object.prototype.hasOwnProperty.call(attributes, 'secure');

  let sameSite: 'lax' | 'strict' | 'none' | undefined;
  if (typeof attributes['samesite'] === 'string') {
    const normalized = (attributes['samesite'] as string).toLowerCase();
    if (normalized === 'lax' || normalized === 'strict' || normalized === 'none') {
      sameSite = normalized;
    }
  }

  let maxAge: number | undefined;
  if (typeof attributes['max-age'] === 'string') {
    const parsed = Number(attributes['max-age']);
    if (!Number.isNaN(parsed)) {
      maxAge = parsed;
    }
  }

  let expires: string | undefined;
  if (typeof attributes['expires'] === 'string') {
    expires = attributes['expires'] as string;
  }

  const parts: string[] = [];
  parts.push(`${cookieName}=${cookieValue}`);

  if (domain) {
    parts.push(`Domain=${domain}`);
  }

  if (path) {
    parts.push(`Path=${path}`);
  }

  if (maxAge !== undefined) {
    parts.push(`Max-Age=${maxAge}`);
  }

  if (expires) {
    parts.push(`Expires=${expires}`);
  }

  if (sameSite) {
    parts.push(`SameSite=${capitalize(sameSite)}`);
  }

  if (secure) {
    parts.push('Secure');
  }

  if (httpOnly) {
    parts.push('HttpOnly');
  }

  return parts.join('; ');
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}