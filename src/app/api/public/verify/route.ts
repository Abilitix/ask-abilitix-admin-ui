import { NextRequest, NextResponse } from 'next/server';
import { getAdminApiBase, getAppUrl, getCookieDomain } from '@/lib/env';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const next = searchParams.get('next') || '/';

    console.log('Magic link verification:', { token: token?.substring(0, 10) + '...', next });

    if (!token) {
      console.log('No token provided, redirecting to signin');
      return NextResponse.redirect(new URL('/signin?error=invalid_token', request.url));
    }

    const adminApiBase = process.env.NEXT_PUBLIC_ADMIN_API ?? getAdminApiBase();
    const nextTarget = next === '/' ? (getAppUrl() ?? next) : next;
    const adminApiUrl = `${adminApiBase}/public/verify?token=${encodeURIComponent(token)}&next=${encodeURIComponent(nextTarget)}`;

    const requestHost = request.nextUrl.hostname;
    const previewFlag =
      process.env.PREVIEW_LOGIN_PROXY === '1' ||
      process.env.PREVIEW_LOGIN_PROXY === 'true';

    const isPreviewHost =
      previewFlag && (process.env.VERCEL_ENV === 'preview' || requestHost.includes('vercel.app'));

    if (!isPreviewHost) {
      console.log('Redirecting to Admin API (prod mode):', adminApiUrl);
      return NextResponse.redirect(adminApiUrl);
    }

    console.log('Proxying verify request for preview environment:', {
      adminApiUrl,
      requestHost,
    });

    const upstream = await fetch(adminApiUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'Cookie': request.headers.get('cookie') ?? '',
      },
    });

    const upstreamLocation = upstream.headers.get('location');
    let redirectTarget = nextTarget ?? '/';

    if (upstreamLocation) {
      try {
        const parsed = new URL(upstreamLocation, adminApiBase);
        if (parsed.hostname === requestHost) {
          redirectTarget = parsed.toString();
        } else {
          const previewUrl = new URL(nextTarget ?? '/', request.url);
          // Preserve upstream path/search but keep preview host
          previewUrl.pathname = parsed.pathname;
          previewUrl.search = parsed.search;
          redirectTarget = previewUrl.toString();
        }
      } catch (error) {
        console.warn('Preview verify: failed to parse upstream location, using nextTarget', {
          upstreamLocation,
          error: error instanceof Error ? error.message : error,
        });
      }
    }

    if (upstream.status >= 300 && upstream.status < 400) {
      const response = NextResponse.redirect(redirectTarget);

      const setCookieHeader = upstream.headers.get('set-cookie');
      if (setCookieHeader) {
        try {
          const rewrittenCookies = rewriteSetCookieForPreview(setCookieHeader, requestHost);
          if (rewrittenCookies) {
            response.headers.set('set-cookie', rewrittenCookies);
          }
        } catch (error) {
          console.warn('Failed to rewrite preview cookie, forwarding original header:', error);
          response.headers.set('set-cookie', setCookieHeader);
        }
      }

      console.log('Preview verify redirect response:', {
        upstreamStatus: upstream.status,
        upstreamLocation,
        redirectTarget,
        hasSetCookie: Boolean(setCookieHeader),
      });

      return response;
    }

    const responseBody = await upstream.text();
    const headers = new Headers();
    const contentType = upstream.headers.get('content-type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    }

    if (upstream.headers.has('set-cookie')) {
      const rewritten = rewriteSetCookieForPreview(upstream.headers.get('set-cookie') as string, requestHost);
      if (rewritten) {
        headers.set('set-cookie', rewritten);
      }
    }

    return new NextResponse(responseBody || null, {
      status: upstream.status,
      headers,
    });

  } catch (error) {
    console.error('Magic link verification error:', error);
    return NextResponse.redirect(new URL('/signin?error=server_error', request.url));
  }
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
