import { NextRequest } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ADMIN_BASE = process.env.ADMIN_BASE;
    const SIGNUP_KEY = process.env.PUBLIC_SIGNUP_KEY;
    
    console.log('Environment check:', { ADMIN_BASE, SIGNUP_KEY: SIGNUP_KEY ? 'SET' : 'NOT SET' });
    
    if (!ADMIN_BASE || !SIGNUP_KEY) {
      return new Response(JSON.stringify({ error: 'Missing environment variables' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await req.json();
    console.log('Request body:', body);

    const r = await fetch(`${ADMIN_BASE}/public/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Signup-Key": SIGNUP_KEY, // server-side only
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    console.log('Admin service response status:', r.status);
    
    // If signup was successful, send welcome email
    if (r.ok) {
      const signupData = await r.json();
      
      // Try to send welcome email (non-blocking)
      try {
        const dashboardUrl = `${process.env.NEXT_PUBLIC_ASK_BASE}/admin?tenant=${signupData.tenant_slug}`;
        await sendWelcomeEmail(
          body.email,
          body.company,
          signupData.tenant_slug,
          dashboardUrl
        );
        console.log('Welcome email sent successfully');
      } catch (emailError) {
        console.warn('Welcome email skipped:', emailError);
        // Continue without failing the signup
      }
      
      // Return the original response
      return new Response(JSON.stringify(signupData), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }
    
    return new Response(r.body, {
      status: r.status,
      headers: {
        "Content-Type": r.headers.get("Content-Type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error('Signup API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Internal server error', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
