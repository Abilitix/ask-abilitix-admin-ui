import { NextRequest } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ADMIN_BASE = process.env.ADMIN_BASE!;
  const SIGNUP_KEY = process.env.PUBLIC_SIGNUP_KEY!;
  const body = await req.json();

  const r = await fetch(`${ADMIN_BASE}/public/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Signup-Key": SIGNUP_KEY, // server-side only
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return new Response(r.body, {
    status: r.status,
    headers: {
      "Content-Type": r.headers.get("Content-Type") || "application/json",
      "Cache-Control": "no-store",
    },
  });
}
