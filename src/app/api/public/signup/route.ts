import { NextRequest } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";
import { getAdminApiBase } from '@/lib/env';
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ADMIN_API = getAdminApiBase();
    const SIGNUP_KEY = process.env.PUBLIC_SIGNUP_KEY;
    
    console.log('Environment check:', { ADMIN_API, SIGNUP_KEY: SIGNUP_KEY ? 'SET' : 'NOT SET' });
    
    if (!ADMIN_API) {
      return new Response(JSON.stringify({ error: 'ADMIN_API not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Note: SIGNUP_KEY can be empty if Admin API doesn't require it
    
    const body = await req.json();
    console.log('Request body:', body);
    
    // Transform the request body to match Admin API expectations
    const adminApiBody = {
      company_name: body.company,
      email: body.email
    };
    console.log('Admin API body:', adminApiBody);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Only add X-Signup-Key header if SIGNUP_KEY is provided
    if (SIGNUP_KEY) {
      headers["X-Signup-Key"] = SIGNUP_KEY;
    }

    const r = await fetch(`${ADMIN_API}/public/signup-new`, {
      method: "POST",
      headers,
      body: JSON.stringify(adminApiBody),
      cache: "no-store",
    });

    console.log('Admin service response status:', r.status);
    
    // Log the response body for debugging
    const responseText = await r.text();
    console.log('Admin service response body:', responseText);
    
    // If signup was successful, send welcome email
    if (r.ok) {
      const signupData = JSON.parse(responseText);
      
      // Admin UI email sending disabled - Admin API will send the welcome email
      // try {
      //   const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin?tenant=${signupData.tenant_slug}`;
      //   await sendWelcomeEmail(
      //     body.email,
      //     body.company,
      //     signupData.tenant_slug,
      //     dashboardUrl
      //   );
      //   console.log('Welcome email sent successfully');
      // } catch (emailError) {
      //   console.warn('Welcome email skipped:', emailError);
      //   // Continue without failing the signup
      // }
      
      console.log('Admin UI email sending disabled - Admin API will send welcome email');
      
      // Return the original response with additional UI data
      const uiResponse = {
        ...signupData,
        tenant_slug: signupData.tenant_slug || 'unknown',
        widget_key_once: signupData.widget_key_once || 'no-key-returned'
      };
      
      return new Response(JSON.stringify(uiResponse), {
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
    console.error('Signup API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Internal server error', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
