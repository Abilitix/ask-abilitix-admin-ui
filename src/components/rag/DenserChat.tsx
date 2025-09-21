"use client";

import * as React from "react";
import Link from "next/link";
import {
  Send,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Loader2,
  FileText,
  Upload,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type Role = "user" | "assistant" | "system";
type Source = { id: string; title: string; url?: string; snippet?: string };
type ChatMsg = { id: string; role: Role; text: string; time?: string; sources?: Source[] };

type FeedbackPayload = {
  messageId: string;
  question?: string;
  answer?: string;
  helpful: boolean;
  sources?: Source[];
  ts: string;
};

type Props = {
  documentTitle?: string;
  initialMessages?: ChatMsg[];
  uploadHref?: string;
  defaultTopK?: number;
  streaming?: boolean;
  /** Server SSE endpoint. Your app exposes POST /api/ask/stream */
  askUrl?: string;
  /** Optional analytics endpoint */
  feedbackUrl?: string;
  onAsked?: (q: string, k: number) => void;
  onFeedback?: (payload: FeedbackPayload) => void;
};

// ---------- helpers ----------
const VALID_ROLES = new Set<Role>(["user", "assistant", "system"]);
const isValidRole = (role: unknown): role is Role =>
  typeof role === "string" && (VALID_ROLES as Set<string>).has(role);

const nowHHMM = (): string => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

function coerceSources(s: any): Source[] {
  const arr = Array.isArray(s) ? s : Array.isArray(s?.items) ? s.items : [];
  return arr.map((x: any, i: number) => ({
    id: String(x?.id ?? i),
    title: String(x?.title ?? x?.name ?? x?.url ?? `Source ${i + 1}`),
    url: typeof x?.url === "string" ? x.url : undefined,
    snippet: typeof x?.snippet === "string" ? x.snippet : undefined,
  }));
}
function coerceMsg(msg: any, ix = 0): ChatMsg {
  if (!msg || typeof msg !== "object") {
    return { id: `auto_${Date.now()}_${ix}`, role: "assistant", text: "", time: undefined };
  }
  const id = typeof msg.id === "string" && msg.id ? msg.id : `auto_${Date.now()}_${ix}`;
  const role: Role = isValidRole(msg.role) ? msg.role : "assistant";
  const text =
    typeof msg.text === "string"
      ? msg.text
      : typeof msg.content === "string"
      ? msg.content
      : "";
  const time = typeof msg.time === "string" ? msg.time : undefined;
  const sources = Array.isArray(msg.sources) ? (msg.sources as Source[]) : undefined;
  return { id, role, text, time, sources };
}
const coerceMsgs = (arr: any): ChatMsg[] => (Array.isArray(arr) ? arr.map((m, i) => coerceMsg(m, i)) : []);
async function safeJson(res: Response): Promise<any> {
  try { return await res.json(); } catch { return null; }
}

export default function DenserChat(props: Props) {
  const {
    documentTitle = "RAG Chat",
    initialMessages = [{ id: "m1", role: "assistant", text: "Hello, how can I help you?", time: nowHHMM() }],
    uploadHref = "/admin/docs",
    defaultTopK = 6,
    streaming = true,
    askUrl = "/api/ask/stream",      // ✅ correct default for your app
    feedbackUrl,
    onAsked,
    onFeedback,
  } = props || {};

  const [messages, setMessages] = React.useState<ChatMsg[]>(() => coerceMsgs(initialMessages));
  const [input, setInput] = React.useState<string>("");
  const [busy, setBusy] = React.useState<boolean>(false);
  const [topK, setTopK] = React.useState<number>(defaultTopK);
  const [advOpen, setAdvOpen] = React.useState<boolean>(false);
  const listRef = React.useRef<HTMLDivElement | null>(null);

  // feedback submission state per message id
  const [feedback, setFeedback] =
    React.useState<Record<string, "idle" | "submitting" | "done" | "error">>({});

  // Auto-scroll transcript
  React.useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight + 1000;
  }, [messages, busy]);

  async function handleSend() {
    const text = (input || "").trim();
    if (!text || busy) return;
    setInput("");

    const userMsg: ChatMsg = { id: `u_${Date.now()}`, role: "user", text, time: nowHHMM() };
    setMessages((m) => [...m, userMsg]);

    try { onAsked?.(text, topK); } catch {}

    setBusy(true);
    try {
      if (streaming) {
        await runStreamingAsk(text);
      } else {
        await runNonStreamingAsk(text);
      }
    } catch (err) {
      console.error("ask failed:", err);
      setMessages((m) => [
        ...m,
        { id: `e_${Date.now()}`, role: "assistant", text: "Sorry—there was an error.", time: nowHHMM() },
      ]);
    } finally {
      setBusy(false);
    }
  }

  // ---- call utils (with 405/404 fallback to /api/ask/stream) ----
  async function postWithFallback(url: string, body: any) {
    const req = (u: string) =>
      fetch(u, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

    let res = await req(url);
    if ((res.status === 405 || res.status === 404) && url !== "/api/ask/stream") {
      console.warn(`[DenserChat] ${res.status} on ${url} → falling back to /api/ask/stream`);
      res = await req("/api/ask/stream");
    }
    return res;
  }

  // ---- Non-streaming (for completeness) ----
  async function runNonStreamingAsk(question: string) {
    const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.text }));
    const res = await postWithFallback(`${askUrl}?stream=false`, { question, history, topk: topK });
    const data = await safeJson(res);

    const answer =
      typeof data?.answer === "string"
        ? data.answer
        : typeof data?.reply === "string"
        ? data.reply
        : typeof data === "string"
        ? data
        : "";

    const sources = coerceSources(data?.sources || data?.docs || data?.citations);
    setMessages((m) => [
      ...m,
      { id: `a_${Date.now()}`, role: "assistant", text: String(answer ?? ""), time: nowHHMM(), sources },
    ]);
  }

  // ---- Streaming (SSE) ----
  async function runStreamingAsk(question: string) {
    const tempId = `a_${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, role: "assistant", text: "", time: nowHHMM(), sources: [] }]);

    const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.text }));
    const res = await postWithFallback(askUrl, { question, history, topk: topK, session_id: "ui-rag-stream-test" });
    if (!res.ok || !res.body) throw new Error(`Streaming failed: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let assistantText = "";
    let finalSources: Source[] = [];
    let currentEvent = "content";

    const extractChunkText = (json: any): string => {
      if (!json) return "";
      if (typeof json === "string") return json;
      if (typeof json.delta === "string") return json.delta;
      if (typeof json.token === "string") return json.token;
      if (typeof json.content === "string") return json.content;
      if (typeof json.text === "string") return json.text;
      const openAI = json?.choices?.[0]?.delta?.content;
      if (typeof openAI === "string") return openAI;
      const anthropic = json?.message?.content;
      if (typeof anthropic === "string") return anthropic;
      return "";
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      for (const rawLine of chunk.split("\n")) {
        const line = rawLine.trim();
        if (!line) continue;

        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
          continue;
        }

        if (line.startsWith("data: ")) {
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;

          try {
            const json = JSON.parse(payload);

            if (currentEvent === "content" || !currentEvent) {
              const piece = extractChunkText(json);
              if (piece) {
                assistantText += piece;
                setMessages((m) => m.map((x) => (x.id === tempId ? { ...x, text: assistantText } : x)));
              }
            }

            const cites = json.citations || json.sources || json.docs;
            if (cites) finalSources = coerceSources(cites);

            if (json.event === "done" || currentEvent === "done") {
              if (finalSources.length) {
                setMessages((m) => m.map((x) => (x.id === tempId ? { ...x, sources: finalSources } : x)));
              }
            }
          } catch {
            // ignore partial JSON lines
          }
        }
      }
    }

    if (finalSources.length) {
      setMessages((m) => m.map((x) => (x.id === tempId ? { ...x, sources: finalSources } : x)));
    }
  }

  // ---------- feedback ----------
  async function sendFeedback(msg: ChatMsg, helpful: boolean) {
    const status = feedback[msg.id] || "idle";
    if (status === "submitting" || status === "done") return;

    setFeedback((f) => ({ ...f, [msg.id]: "submitting" }));

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const payload: FeedbackPayload = {
      messageId: msg.id,
      question: lastUser?.text,
      answer: msg.text,
      helpful,
      sources: msg.sources,
      ts: new Date().toISOString(),
    };

    try {
      if (feedbackUrl) {
        await fetch(feedbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      onFeedback?.(payload);
      setFeedback((f) => ({ ...f, [msg.id]: "done" }));
    } catch {
      setFeedback((f) => ({ ...f, [msg.id]: "error" }));
    }
  }

  /**
   * LAYOUT FIX:
   * - Wrapper is a column that grows to viewport height and scrolls the page.
   * - Transcript uses flex-1 + overflow-y-auto.
   * - Composer is position: sticky (not fixed) so it never collides with the site footer.
   */
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-screen-md flex-col px-3">
      {/* Upload CTA Bar */}
      <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border bg-muted/40 p-3">
        <div>
          <div className="text-sm font-medium">Documents</div>
          <div className="text-xs text-muted-foreground">Upload the sources used for answers.</div>
        </div>
        <Button asChild>
          <Link href={uploadHref} className="inline-flex items-center gap-1">
            <Upload className="h-4 w-4" /> Upload docs
          </Link>
        </Button>
      </div>

      {/* Header */}
      <Card className="z-10 border-muted/60">
        <CardContent className="flex items-center gap-3 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{documentTitle}</div>
            <div className="text-xs text-muted-foreground">Conversational test</div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            aria-label="options"
            onClick={() => setAdvOpen((o) => !o)}
            aria-expanded={advOpen}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Advanced panel */}
      {advOpen && (
        <div className="mt-2 rounded-xl border bg-muted/30 p-3">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">TopK</label>
            <Input
              inputMode="numeric"
              pattern="[0-9]*"
              value={topK}
              onChange={(e) =>
                setTopK(Math.max(1, Math.min(20, parseInt(e.target.value || "6") || 6)))
              }
            />
            <div className="text-[11px] text-muted-foreground">How many docs to search (1–20).</div>
          </div>
        </div>
      )}

      {/* Transcript (flex-1; scrolls) */}
      <div ref={listRef} className="mt-3 flex-1 overflow-y-auto rounded-xl border p-4">
        <div className="space-y-3">
          {(Array.isArray(messages) ? messages : []).map((m) => (
            <MessageBubble
              key={m?.id ?? Math.random().toString(36)}
              msg={coerceMsg(m)}
              status={feedback[m.id] || "idle"}
              onFeedback={sendFeedback}
            />
          ))}
          {busy && (
            <div className="flex w-full justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm leading-relaxed text-muted-foreground">
                <Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin" /> Generating…
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer (sticky; never overlaps footer) */}
      <div className="sticky bottom-0 z-[5] mt-3 border-t bg-background/95 pb-3 pt-2">
        <div className="flex w-full items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e?.target?.value ?? "")}
            placeholder="Type your question here…"
            rows={1}
            className="min-h-[48px] resize-none rounded-2xl pr-12"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button onClick={handleSend} disabled={!input.trim() || busy} className="h-12 rounded-2xl px-4">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- Presentational ----------
function MessageBubble({
  msg,
  status,
  onFeedback,
}: {
  msg: ChatMsg;
  status: "idle" | "submitting" | "done" | "error";
  onFeedback?: (msg: ChatMsg, helpful: boolean) => void;
}) {
  const m = coerceMsg(msg);
  const isUser = m.role === "user";
  return (
    <div className={"flex w-full " + (isUser ? "justify-end" : "justify-start")}>
      <div className="flex flex-col items-end gap-1">
        <div
          className={[
            "max-w-[85%] whitespace-pre-wrap text-[15px] leading-relaxed",
            "px-3 py-2",
            "rounded-2xl",
            isUser ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-muted",
          ].join(" ")}
        >
          {m.text}
          {m.time && <div className={"mt-1 text-xs opacity-60"}>{m.time}</div>}
          {Array.isArray(m.sources) && m.sources.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {m.sources.map((s) => (
                <SourceChip key={s.id} title={s.title} url={s.url} />
              ))}
            </div>
          )}
        </div>
        {!isUser && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <BubbleAction
              icon={<ThumbsUp className="h-3.5 w-3.5" />}
              label="Helpful"
              disabled={status === "submitting" || status === "done"}
              onClick={() => onFeedback?.(m, true)}
            />
            <BubbleAction
              icon={<ThumbsDown className="h-3.5 w-3.5" />}
              label="Not helpful"
              disabled={status === "submitting" || status === "done"}
              onClick={() => onFeedback?.(m, false)}
            />
            <BubbleAction
              icon={<Copy className="h-3.5 w-3.5" />}
              label="Copy"
              onClick={() => {
                try {
                  navigator?.clipboard?.writeText?.(String(m.text ?? ""));
                } catch {}
              }}
            />
            <BubbleAction icon={<MoreVertical className="h-3.5 w-3.5" />} label="More" />
            {status === "done" && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Recorded
              </span>
            )}
            {status === "error" && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-rose-600">
                <AlertCircle className="h-3.5 w-3.5" /> Error
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SourceChip({ title, url }: { title: string; url?: string }) {
  const content = (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
      {title}
    </span>
  );
  return url ? (
    <a href={url} target="_blank" rel="noreferrer" className="hover:underline">
      {content}
    </a>
  ) : (
    content
  );
}

function BubbleAction({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs hover:bg-muted/70 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={label || "action"}
      type="button"
    >
      {icon}
    </button>
  );
}
