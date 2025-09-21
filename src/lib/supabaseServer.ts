// src/lib/supabaseServer.ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Admin (service-role) client. Use ONLY from server code (API routes,
 * server actions). Never import this in client components.
 */
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
