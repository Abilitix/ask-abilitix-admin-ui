import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Establish SSE connection for EventSource
  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST",
      "Access-Control-Allow-Headers": "Content-Type, x-tenant-slug, x-widget-key",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const ASK_BASE = process.env.ASK_BASE!;
    const body = await req.text(); // raw for SSE
    const tenantSlug = req.headers.get("x-tenant-slug") || process.env.TENANT_SLUG || "";

    const r = await fetch(`${ASK_BASE}/ask/stream`, {
      method: "POST",
      headers: {
        "Accept": "text/event-stream",
        "Content-Type": "application/json",
        "x-tenant-slug": tenantSlug,
        // Optionally forward widget key header if present in the client request
        "X-Widget-Key": req.headers.get("x-widget-key") || "",
      },
      body,
      cache: "no-store",
    });

    return new NextResponse(r.body, {
      status: r.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Streaming failed", details: error instanceof Error ? error.message : String(error) }, {
      status: 500
    });
  }
}

