"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { stripMarkdown } from "@/lib/text/markdown";
import { RENDER_MD } from "@/lib/text/flags";

// Token sync utility function
function getTokenLimitForRagTopK(ragTopK: number): number {
  if (ragTopK <= 2) return 250;
  if (ragTopK <= 4) return 400;
  if (ragTopK <= 6) return 600;
  if (ragTopK <= 8) return 800;
  if (ragTopK <= 12) return 1000;
  return 1200; // Max tokens
}

type ChatRole = "user" | "assistant" | "system";

type Source = {
  id?: string;
  title?: string;
  url?: string;
};

type ChatMsg = {
  id: string;
  role: ChatRole;
  text: string;
  time?: string;
  sources?: Source[];
};

type Props = {
  documentTitle?: string;
  uploadHref?: string;
  defaultTopK?: number;
  askUrl?: string;                 // e.g. "/api/ask/stream"
  onAsked?: (q: string, k: number) => void; // parent can run RAG search table
};

const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const normalizeSources = (raw: any): Source[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((s) => ({
      id: s?.id ?? s?.doc_id ?? undefined,
      title: s?.title ?? s?.name ?? `Source`,
      url: s?.url ?? s?.href ?? undefined,
    }));
  }
  return [];
};

/** Try hard to extract a text token from many possible payload shapes */
function extractToken(payload: any, currentEvent: string): string | undefined {
  if (payload == null) return undefined;

  // common direct keys
  if (typeof payload.delta === "string") return payload.delta;
  if (typeof payload.content === "string") return payload.content;
  if (typeof payload.text === "string") return payload.text;
  if (typeof payload.answer === "string") return payload.answer;

  // OpenAI chat-completions style partials
  const c0 = payload.choices?.[0];
  const openaiDelta = c0?.delta?.content;
  if (typeof openaiDelta === "string") return openaiDelta;

  // Some servers do event: content with a plain string data
  if (currentEvent === "content" && typeof payload === "string") return payload;

  // Fallback: any first string field with "delta" in the name
  for (const [k, v] of Object.entries(payload)) {
    if (typeof v === "string" && /delta|chunk|part/i.test(k)) return v;
  }
  return undefined;
}

export default function ChatInterface({
  documentTitle = "RAG Chat",
  uploadHref = "/admin/docs",
  defaultTopK = 8,
  askUrl = "/api/ask/stream",
  onAsked,
}: Props) {
  const [topK, setTopK] = React.useState<number>(defaultTopK);
  const [sessionMaxTokens, setSessionMaxTokens] = React.useState<number | null>(null);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const [messages, setMessages] = React.useState<ChatMsg[]>([
    { id: "m0", role: "assistant", text: "Hello, how can I help you?", time: nowHHMM() },
  ]);

  // Auto-sync tokens when TopK changes (with 50% buffer, capped at 20)
  React.useEffect(() => {
    const baseTokens = getTokenLimitForRagTopK(topK);
    const bufferTokens = Math.floor(baseTokens * 1.5);
    const cappedTokens = Math.min(bufferTokens, 1200); // Max 1200 tokens
    setSessionMaxTokens(cappedTokens);
  }, [topK]);

  const chatRef = React.useRef<HTMLDivElement | null>(null);
  const scrollToBottom = React.useCallback(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, []);
  React.useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  async function streamAsk(question: string) {
    setSending(true);

    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "user",
      text: question,
      time: nowHHMM(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const assistantId = crypto.randomUUID();
    let buffer = "";
    let citations: Source[] = [];
    let sawContent = false;

    const updateAssistant = (text: string, src?: Source[]) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, text, sources: src ?? m.sources } : m))
      );
    };

    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", text: "", time: nowHHMM(), sources: [] },
    ]);

    // Non-stream fallback
    const askNonStreaming = async () => {
      const res = await fetch(`${askUrl}?stream=false`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question, 
          topk: topK, 
          session_id: "ai",
          ...(sessionMaxTokens ? { max_tokens: sessionMaxTokens } : {})
        }),
      });
      if (!res.ok) throw new Error(`Ask (non-stream) failed: ${res.status}`);
      const json = await res.json();
      const answer =
        json?.answer ??
        json?.content ??
        json?.text ??
        json?.choices?.[0]?.message?.content ??
        "";
      const srcs = normalizeSources(json?.citations ?? json?.sources);
      buffer = String(answer ?? "");
      citations = srcs;
      updateAssistant(buffer, citations);
    };

    try {
      const res = await fetch(askUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ 
          question, 
          topk: topK, 
          session_id: "ai",
          ...(sessionMaxTokens ? { max_tokens: sessionMaxTokens } : {})
        }),
      });

      if (!res.ok || !res.body) {
        await askNonStreaming();
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let partial = "";
      let currentEvent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partial += decoder.decode(value, { stream: true });
        const lines = partial.split(/\r?\n/);
        partial = lines.pop() ?? "";

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;

          if (line.startsWith("event:")) {
            currentEvent = line.slice(6).trim();
            continue;
          }

          if (line.startsWith("data:")) {
            const dataStr = line.slice(5).trim();

            if (dataStr === "[DONE]") continue;

            // Try JSON first
            let payload: any = dataStr;
            try { payload = JSON.parse(dataStr); } catch { /* keep as string */ }

            // Citations can arrive with final data
            const maybeSources = payload?.citations ?? payload?.sources;
            if (maybeSources) {
              citations = normalizeSources(maybeSources);
            }

            const token = extractToken(payload, currentEvent);
            if (typeof token === "string" && token.length > 0) {
              buffer += token;
              sawContent = true;
              updateAssistant(buffer, citations);
            }
          }
        }
      }

      // Stream ended. If we never received content, fetch the full answer once.
      if (!sawContent) {
        try {
          await askNonStreaming();
        } catch (e) {
          console.error("Non-stream fallback also failed:", e);
          updateAssistant("Sorry—there was an error.", citations);
        }
      } else {
        updateAssistant(buffer, citations);
      }
    } catch (err) {
      console.error("SSE error:", err);
      try {
        await askNonStreaming();
      } catch (e) {
        console.error("Non-stream ask failed:", e);
        updateAssistant("Sorry—there was an error.", citations);
      }
    } finally {
      setSending(false);
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || sending) return;
    setInput("");
    onAsked?.(q, topK);
    await streamAsk(q);
  };

  return (
    <div className="rounded-xl border bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="font-semibold">{documentTitle}</div>
        <a
          href={uploadHref}
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          ⬆ Upload docs
        </a>
      </div>

      {/* Chat body */}
      <div className="flex max-h-[65vh] flex-col">
        <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-6">
          {/* Screen reader announcements */}
          {sending && (
            <div aria-live="polite" aria-atomic="true" className="sr-only">
              Asking your AI Assistant...
            </div>
          )}
          {messages.map((m) => {
            const isUser = m.role === "user";
            const displayContent = isUser ? (
              m.text
            ) : RENDER_MD ? (
              <div className="prose prose-slate max-w-none text-[15px] prose-headings:text-slate-900 prose-strong:text-slate-900 prose-p:text-slate-900 prose-li:text-slate-900 prose-a:text-blue-600 hover:prose-a:text-blue-700">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize]}
                >
                  {m.text}
                </ReactMarkdown>
              </div>
            ) : (
              stripMarkdown(m.text)
            );
            return (
              <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={[
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm break-words",
                    isUser ? "bg-blue-600 text-white whitespace-pre-wrap" : "bg-slate-100 text-slate-900",
                  ].join(" ")}
                >
                  <div>{displayContent}</div>

                  {!isUser && m.sources && m.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.sources.map((s, i) => (
                        <a
                          key={`${m.id}-src-${i}`}
                          href={s.url ?? "#"}
                          target={s.url ? "_blank" : undefined}
                          rel={s.url ? "noreferrer" : undefined}
                          className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-slate-700 hover:bg-white"
                          title={s.title ?? undefined}
                        >
                          {`Source ${i + 1}`}
                        </a>
                      ))}
                    </div>
                  )}

                  {m.time && (
                    <div
                      className={[
                        "mt-1.5 text-[11px]",
                        isUser ? "text-blue-100/80" : "text-slate-500",
                      ].join(" ")}
                    >
                      {m.time}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Composer */}
        <form
          onSubmit={onSubmit}
          className="sticky bottom-0 z-[1] bg-white/80 backdrop-blur border-t pt-3 px-3 pb-2"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your AI Assistant anything…"
              className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || input.trim().length === 0}
              className="w-full sm:w-auto min-h-11 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              title="Ask"
              aria-label="Ask"
            >
              {sending ? "Asking…" : "Ask"}
            </button>
            
            <div className="order-last sm:order-none w-full sm:w-auto">
              <div className="inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-xs mx-auto sm:mx-0">
                <span>TopK</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={topK}
                  onChange={(e) => {
                    const newTopK = Math.max(1, Math.min(20, parseInt(e.target.value || "8", 10)));
                    setTopK(newTopK);
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-12 rounded border px-1 py-0.5 text-center focus:ring-2 focus:ring-blue-200"
                  disabled={sending}
                  title={`Number of sources to search (Session max tokens: ${sessionMaxTokens || 'auto'})`}
                />
              </div>
              {sessionMaxTokens && (
                <div className="text-xs text-gray-500 text-center mt-1 sm:text-left">
                  Max tokens: {sessionMaxTokens}
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
