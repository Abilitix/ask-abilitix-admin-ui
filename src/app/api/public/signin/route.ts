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
    console.log('Signin request body:', rawBody);

    let next: string | undefined =
      typeof rawBody?.next === 'string' && rawBody.next.trim().length > 0
        ? rawBody.next
        : undefined;

    if (!next && process.env.VERCEL_ENV === 'preview') {
      const appUrl = getAppUrl();
      if (appUrl && appUrl.trim().length > 0) {
        next = appUrl.endsWith('/') ? appUrl : `${appUrl}/`;
      } else {
        const proto = req.headers.get("x-forwarded-proto") ?? "https";
        const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
        if (host) {
          next = `${proto}://${host}/`;
        }
      }
    }

    const payload = {
      ...rawBody,
      ...(next ? { next } : {}),
    };

    const r = await fetch(`${ADMIN_API}/public/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    console.log('Admin service response status:', r.status);
    
    const responseText = await r.text();
    console.log('Admin service response body:', responseText);
    
    if (r.ok) {
      // Parse Admin API response to get structured data
      const adminApiResponse = JSON.parse(responseText);
      
      // Return the Admin API response as-is (it now has proper structure)
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
    console.error('Signin API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Internal server error', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}