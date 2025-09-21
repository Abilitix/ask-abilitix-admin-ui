"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
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
  FolderOpen,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

// ----- Types -----
type Role = "user" | "assistant" | "system";
type Source = { id: string; title: string; url?: string; snippet?: string };
type ChatMsg = { id: string; role: Role; text: string; time?: string; sources?: Source[] };

type Props = {
  documentTitle?: string;
  initialMessages?: ChatMsg[];
  uploadHref?: string;
  manageHref?: string;
  defaultTopK?: number;
  streaming?: boolean;                        // true -> /api/ask/stream (SSE)
  askUrl?: string;                            // optional override
  onAsked?: (q: string, k: number) => void;   // notify page to run /api/smoke/rag in parallel
};

// ---------- Helpers ----------
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
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function DenserChat(props: Props) {
  const {
    documentTitle = "Chat Session",
    initialMessages = [{ id: "m1", role: "assistant", text: "Hello, how can I help you?", time: nowHHMM() }],
    uploadHref = "/admin/docs",
    manageHref = "/admin/docs",
    defaultTopK = 6,
    streaming = true,
    askUrl,
    onAsked,
  } = props || {};

  const [messages, setMessages] = useState<ChatMsg[]>(() => coerceMsgs(initialMessages));
  const [input, setInput] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [topK, setTopK] = useState<number>(defaultTopK);
  const [advOpen, setAdvOpen] = useState<boolean>(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight + 1000;
  }, [messages, busy]);

  async function handleSend() {
    const text = (input || "").trim();
    if (!text || busy) return;
    setInput("");

    const userMsg: ChatMsg = { id: `u_${Date.now()}`, role: "user", text, time: nowHHMM() };
    setMessages((m) => [...m, userMsg]);

    // Optional: parallel RAG search on the page
    try {
      if (typeof onAsked === "function") onAsked(text, topK);
    } catch {
      /* no-op */
    }

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

  async function runNonStreamingAsk(question: string) {
    const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.text }));
    const url = askUrl ?? "/api/ask/stream?stream=false";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, history, topk: topK }),
    });
    const data = await safeJson(res);

    if (Array.isArray(data?.messages)) {
      const msgs: ChatMsg[] = data.messages.map((m: any, i: number) => ({
        id: String(m?.id ?? `srv_${Date.now()}_${i}`),
        role: isValidRole(m?.role) ? (m.role as Role) : "assistant",
        text: typeof m?.text === "string" ? m.text : typeof m?.content === "string" ? m.content : "",
        time: nowHHMM(),
        sources: coerceSources(data?.sources || data?.docs || data?.citations),
      }));
      setMessages(coerceMsgs(msgs));
      return;
    }

    const answer =
      typeof data?.answer === "string"
        ? data.answer
        : typeof data?.reply === "string"
        ? data.reply
        : typeof data === "string"
        ? data
        : "";

    const sources = coerceSources(data?.sources || data?.docs || data?.citations);

    setMessages((m) => [...m, { id: `a_${Date.now()}`, role: "assistant", text: String(answer ?? ""), time: nowHHMM(), sources }]);
  }

  async function runStreamingAsk(question: string) {
    const tempId = `a_${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, role: "assistant", text: "", time: nowHHMM(), sources: [] }]);

    const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.text }));
    const url = askUrl ?? "/api/ask/stream";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, history, topk: topK, session_id: "ui-rag-stream-test" }),
    });
    if (!res.ok || !res.body) throw new Error(`Streaming failed: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let assistantText = "";
    let finalSources: Source[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") break;
        try {
          const json = JSON.parse(data);
          if (typeof json.delta === "string") {
            assistantText += json.delta;
            setMessages((m) => m.map((x) => (x.id === tempId ? { ...x, text: assistantText } : x)));
          }
          if (json.sources || json.docs || json.citations) {
            finalSources = coerceSources(json.sources || json.docs || json.citations);
          }
        } catch {
          /* ignore bad lines */
        }
      }
    }

    if (finalSources.length) {
      setMessages((m) => m.map((x) => (x.id === tempId ? { ...x, sources: finalSources } : x)));
    }
  }

  return (
    <div className="mx-auto max-w-screen-md px-3 pb-[calc(64px+env(safe-area-inset-bottom))] pt-4 sm:pt-6">
      {/* Upload CTA Bar */}
      <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border bg-muted/40 p-3">
        <div>
          <div className="text-sm font-medium">Documents</div>
          <div className="text-xs text-muted-foreground">Upload or manage the sources used for answers.</div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={uploadHref} className="inline-flex items-center gap-1">
              <Upload className="h-4 w-4" /> Upload docs
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={manageHref} className="inline-flex items-center gap-1">
              <FolderOpen className="h-4 w-4" /> Manage
            </Link>
          </Button>
        </div>
      </div>

      {/* Header */}
      <Card className="sticky top-0 z-10 border-muted/60 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <CardContent className="flex items-center gap-3 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{documentTitle}</div>
            <div className="text-xs text-muted-foreground">Conversational test</div>
          </div>

          {/* Simple inline “Advanced” toggle (no Popover) */}
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

      {/* Inline Advanced Panel */}
      {advOpen && (
        <div className="mt-2 rounded-xl border bg-muted/30 p-3">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">TopK</label>
            <Input
              inputMode="numeric"
              pattern="[0-9]*"
              value={topK}
              onChange={(e) => setTopK(Math.max(1, Math.min(20, parseInt(e.target.value || "6") || 6)))}
            />
            <div className="text-[11px] text-muted-foreground">How many docs to search (1–20).</div>
          </div>
        </div>
      )}

      {/* Transcript */}
      <div ref={listRef} className="mt-3 h-[calc(100dvh-240px)] overflow-y-auto rounded-xl border p-3 sm:h-[calc(100dvh-280px)]">
        <div className="space-y-3">
          {(Array.isArray(messages) ? messages : []).map((m) => (
            <MessageBubble key={m?.id ?? Math.random().toString(36)} msg={coerceMsg(m)} />
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

      {/* Composer */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 px-3 pb-[max(0px,env(safe-area-inset-bottom))] pt-2 sm:px-4">
        <div className="mx-auto flex w-full max-w-screen-md items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e?.target?.value ?? "")}
            placeholder="Type your question here…"
            rows={1}
            className="min-h-[44px] resize-none rounded-2xl pr-12"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button onClick={handleSend} disabled={!input.trim() || busy} className="h-11 rounded-2xl px-4">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ----- Presentational bits -----
function MessageBubble({ msg }: { msg: ChatMsg }) {
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
            <BubbleAction icon={<ThumbsUp className="h-3.5 w-3.5" />} label="Helpful" />
            <BubbleAction icon={<ThumbsDown className="h-3.5 w-3.5" />} label="Not helpful" />
            <BubbleAction
              icon={<Copy className="h-3.5 w-3.5" />}
              label="Copy"
              onClick={() => {
                try {
                  navigator?.clipboard?.writeText?.(String(m.text ?? ""));
                } catch {
                  /* no-op */
                }
              }}
            />
            <BubbleAction icon={<MoreVertical className="h-3.5 w-3.5" />} label="More" />
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
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs hover:bg-muted/70"
      aria-label={label || "action"}
      type="button"
    >
      {icon}
    </button>
  );
}
