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
  // Simple test response first
  return NextResponse.json({ message: "POST handler working", timestamp: new Date().toISOString() });
}

