import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const ADMIN_API = process.env.ADMIN_API;
    
    if (!ADMIN_API) {
      return new Response(JSON.stringify({ error: 'ADMIN_API not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await req.json();
    console.log('Signin request body:', body);

    const r = await fetch(`${ADMIN_API}/public/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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