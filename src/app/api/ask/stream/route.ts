import { NextRequest } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

  return new Response(r.body, {
    status: r.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      "Connection": "keep-alive",
    },
  });
}
