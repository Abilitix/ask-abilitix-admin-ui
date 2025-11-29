import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const BASE = process.env.ADMIN_API_BASE || process.env.ADMIN_API;
    
    if (!BASE) {
      return NextResponse.json({ error: 'ADMIN_API_BASE not configured' }, {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await req.json();
    const { email } = body;

    // Call the Admin API password reset request endpoint
    const r = await fetch(`${BASE}/auth/request-reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });

    // Always return success (non-enumerating UX)
    // Backend handles the actual email sending
    return NextResponse.json({ ok: true }, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error('Password reset request API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Still return success for non-enumerating UX
    return NextResponse.json({ ok: true }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

