import { NextRequest } from "next/server";
import { getAdminApiBase, getAppUrl } from '@/lib/env';

export async function POST(req: NextRequest) {
  try {
    const ADMIN_API = getAdminApiBase();
    
    if (!ADMIN_API) {
      return new Response(JSON.stringify({ error: 'ADMIN_API not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const rawBody = await req.json().catch(() => ({}));

    let next: string | undefined =
      typeof rawBody?.next === 'string' && rawBody.next.trim().length > 0
        ? rawBody.next
        : undefined;

    if (!next && process.env.VERCEL_ENV === 'preview') {
      const proto = req.headers.get("x-forwarded-proto") ?? "https";
      const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
      if (host) {
        const origin = `${proto}://${host}`;
        next = `${origin}/`;
      } else {
        const appUrl = getAppUrl();
        if (appUrl && appUrl.trim().length > 0) {
          next = appUrl.endsWith('/') ? appUrl : `${appUrl}/`;
        }
      }
    }

    const payload = {
      ...rawBody,
      ...(next
        ? {
            next,
            next_url: next,
          }
        : {}),
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (process.env.VERCEL_ENV === 'preview') {
      const proto = req.headers.get("x-forwarded-proto") ?? "https";
      const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
      if (host) {
        headers["Origin"] = `${proto}://${host}`;
      }
    }

    const r = await fetch(`${ADMIN_API}/public/signin`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const responseText = await r.text();
    
    if (r.ok) {
      const adminApiResponse = JSON.parse(responseText);
      
      return new Response(JSON.stringify(adminApiResponse), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }
    
    return new Response(responseText, {
      status: r.status,
      headers: {
        "Content-Type": r.headers.get("Content-Type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Internal server error', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}