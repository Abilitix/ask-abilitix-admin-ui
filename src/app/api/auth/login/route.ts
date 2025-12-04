import { NextRequest, NextResponse } from "next/server";
import { getCookieDomain } from "@/lib/env";

export const runtime = "nodejs";

const BASE = process.env.ADMIN_API_BASE || process.env.ADMIN_API;

export async function POST(req: NextRequest) {
  if (!BASE) {
    return NextResponse.json(
      { detail: "ADMIN_API_BASE not configured" },
      { status: 500 }
    );
  }

  const { email, password } = await req.json();

  const upstream = await fetch(`${BASE}/public/signin`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
    redirect: "manual",
  });

  if (!upstream.ok && (upstream.status < 300 || upstream.status >= 400)) {
    const err = await upstream.json().catch(() => ({}));
    return NextResponse.json(
      { detail: err.detail || "Login failed" },
      { status: upstream.status }
    );
  }

  // Forward backend's Set-Cookie header (preserves 24h Max-Age)
  const setCookieHeader = upstream.headers.get('set-cookie');
  
  // Get backend's actual response data (user info, tenant, etc.)
  const responseData = await upstream.json().catch(() => ({ ok: true }));
  const response = NextResponse.json(responseData);
  
  if (setCookieHeader) {
    // Rewrite cookie domain for preview environments (same as verify route)
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