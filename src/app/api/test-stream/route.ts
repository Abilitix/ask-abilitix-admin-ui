import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return new Response("GET test working", { status: 200 });
}

export async function POST(req: NextRequest) {
  return new Response("POST test working", { status: 200 });
}
