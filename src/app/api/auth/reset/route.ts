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
    const { token, new_password } = body;

    if (!token || !new_password) {
      return NextResponse.json({ 
        detail: 'Token and new password are required' 
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call the Admin API password reset endpoint
    const r = await fetch(`${BASE}/auth/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, new_password }),
      cache: "no-store",
    });

    const responseText = await r.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { detail: responseText || 'Reset failed' };
    }

    if (!r.ok) {
      return NextResponse.json(data, {
        status: r.status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    // Success
    return NextResponse.json({ ok: true }, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error('Password reset API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      detail: 'An error occurred. Please try again.' 
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

