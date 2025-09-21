import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getAuthUser } from "@/lib/auth";

export const runtime = "nodejs";

type Source = { id: string; title: string; url?: string };
type Payload = {
  messageId: string;
  question?: string;
  answer?: string;
  helpful: boolean;
  sources?: Source[];
  ts: string;
  path?: string;
  model?: string;
  topk?: number;
  session_id?: string;
  metadata?: Record<string, unknown>;
};

function isString(x: unknown) { return typeof x === "string"; }
function isBool(x: unknown) { return typeof x === "boolean"; }
function isSource(x: any): x is Source {
  return x && isString(x.id) && isString(x.title) && (x.url === undefined || isString(x.url));
}

function validate(body: any): { ok: true; data: Payload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid JSON" };
  const { messageId, question, answer, helpful, sources, ts, path, model, topk, session_id, metadata } = body as Payload;

  if (!isString(messageId) || !messageId) return { ok: false, error: "messageId required" };
  if (!isBool(helpful)) return { ok: false, error: "helpful required" };
  if (!isString(ts)) return { ok: false, error: "ts required (ISO)" };
  if (question !== undefined && !isString(question)) return { ok: false, error: "question invalid" };
  if (answer !== undefined && !isString(answer)) return { ok: false, error: "answer invalid" };
  if (path !== undefined && !isString(path)) return { ok: false, error: "path invalid" };
  if (model !== undefined && !isString(model)) return { ok: false, error: "model invalid" };
  if (topk !== undefined && typeof topk !== "number") return { ok: false, error: "topk invalid" };
  if (session_id !== undefined && !isString(session_id)) return { ok: false, error: "session_id invalid" };

  let srcs: Source[] | undefined;
  if (Array.isArray(sources)) {
    const ok = sources.every(isSource);
    if (!ok) return { ok: false, error: "sources invalid" };
    srcs = sources;
  }

  return { ok: true, data: { messageId, question, answer, helpful, sources: srcs, ts, path, model, topk, session_id, metadata } };
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const v = validate(json);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  // Optional tenant/user context
  const user = await getAuthUser().catch(() => null);
  const tenantId: string | null = (user as any)?.tenant?.id ?? null;
  const userId: string | null = (user as any)?.id ?? null;
  const userEmail: string | null = (user as any)?.email ?? null;

  // Build the row
  const row = {
    tenant_id: tenantId,
    user_id: userId,
    user_email: userEmail,
    message_id: v.data.messageId,
    question: v.data.question ?? null,
    answer: v.data.answer ?? null,
    helpful: v.data.helpful,
    sources: v.data.sources ?? null,
    path: v.data.path ?? null,
    model: v.data.model ?? null,
    topk: v.data.topk ?? null,
    session_id: v.data.session_id ?? null,
    metadata: v.data.metadata ?? null,
    updated_at: new Date().toISOString(),
    created_at: new Date(v.data.ts).toISOString(),
  };

  // If Supabase envs missing, log only (graceful no-op)
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
    console.warn("Supabase env not set; logging only");
    console.log("[feedback]", JSON.stringify(row));
    return NextResponse.json({ ok: true, logged: true });
  }

  const supabase = supabaseAdmin();
  const conflictCols = tenantId ? "tenant_id,message_id" : "message_id";

  const { data, error } = await supabase
    .from("feedback")
    .upsert(row, { onConflict: conflictCols })
    .select()
    .maybeSingle();

  if (error) {
    console.error("supabase upsert error:", error);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data?.id ?? null });
}
