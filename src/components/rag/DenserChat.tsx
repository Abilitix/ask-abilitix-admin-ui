"use client";

import * as React from "react";

/** Minimal source shape returned with the final SSE 'done' event */
type Source = {
  id?: string | number;
  title?: string;
  url?: string;
};

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  ts: string; // HH:MM
  sources?: Source[];
};

type Props = {
  /** SSE endpoint that streams content + final citations */
  streamUrl: string;
  /** Link to docs upload (shows a small CTA above chat) */
  uploadHref?: string;
  /**
   * Callback to populate the TopK table when a question is asked.
   * We call this with the exact question text after the user sends it.
   */
  onQuestionAsked?: (q: string) => void;
  /**
   * Optional analytics endpoint (not used in this restore; added for future)
   * If you want thumbs, wire it in later — keeping UI clean for now.
   */
  feedbackUrl?: string;
};

// ---------- Utilities ----------
const VALID_ROLES = new Set<"user" | "assistant" | "system">([
  "user",
  "assistant",
  "system",
]);

const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
};

const coerceSources = (raw: any): Source[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((r) => {
      if (r && typeof r === "object") {
        return {
          id: r.id ?? r.doc_id ?? r.slug ?? undefined,
          title: r.title ?? r.name ?? r.filename ?? "Source",
          url: r.url ?? r.href ?? undefined,
        };
      }
      return { title: String(r ?? "Source") };
    });
  }
  // single object
  if (typeof raw === "object") return [coerceSources([raw])[0]];
  return [{ title: String(raw) }];
};

// ---------- Component ----------
export default function DenserChat({
  streamUrl,
  uploadHref = "/admin/docs",
  onQuestionAsked,
}: Props) {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "hello",
      role: "assistant",
      content: "Hello, how can I help you today?",
      ts: nowHHMM(),
    },
  ]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Send on Enter (shift+enter = newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      triggerSend();
    }
  };

  const triggerSend = async () => {
    const q = input.trim();
    if (!q || busy) return;

    // Add user message
    const user: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: q,
      ts: nowHHMM(),
    };
    setMessages((prev) => [...prev, user]);
    setInput("");

    // Call TopK updater (table) in parent
    onQuestionAsked?.(q);

    // Create an empty assistant message to stream into
    const assistantId = crypto.randomUUID();
    const assistant: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      ts: nowHHMM(),
      sources: [],
    };
    setMessages((prev) => [...prev, assistant]);

    try {
      setBusy(true);
      await streamAnswer(assistantId, q);
    } catch (err) {
      console.error("Streaming failed:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Sorry—there was an error." }
            : m
        )
      );
    } finally {
      setBusy(false);
    }
  };

  // Core SSE reader — handles both "event:" + "data:" style and data-only style
  const streamAnswer = async (assistantId: string, question: string) => {
    const resp = await fetch(streamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      // NOTE: if your API expects { question } or { query } instead of { q },
      // change the payload key here:
      body: JSON.stringify({ q: question, question, query: question }),
    });

    if (!resp.ok || !resp.body) {
      throw new Error(`SSE HTTP ${resp.status}`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let currentEvent: string | null = null;
    let done = false;
    let finalSources: Source[] = [];

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      if (streamDone) break;
      buffer += decoder.decode(value, { stream: true });

      // Process line-by-line
      const lines = buffer.split("\n");
      // keep the last partial line in buffer
      buffer = lines.pop() ?? "";

      for (const raw of lines) {
        const line = raw.trim();
        if (!line) {
          // blank line separates SSE events — reset event type
          currentEvent = null;
          continue;
        }

        if (line.startsWith("event:")) {
          currentEvent = line.slice(6).trim();
          continue;
        }

        if (!line.startsWith("data:")) {
          continue;
        }

        const dataStr = line.slice(5).trim();
        if (!dataStr) continue;

        // Some servers send "[DONE]" to end — ignore, we end when stream closes
        if (dataStr === "[DONE]") continue;

        try {
          const json = JSON.parse(dataStr);

          // If no event was set, assume content (older servers)
          const evt = (currentEvent ?? "content").toLowerCase();

          if (evt === "content" && json.delta) {
            const delta: string = String(json.delta);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + delta } : m
              )
            );
          }

          if ((evt === "done" || json.citations) && typeof json === "object") {
            finalSources = coerceSources(json.citations);
          }
        } catch (e) {
          // ignore bad chunks
        }
      }
    }

    // Attach final sources if present
    if (finalSources.length) {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, sources: finalSources } : m))
      );
    }
  };

  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      {/* Header line with small CTA */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="text-sm font-semibold">RAG Chat</div>
        <a
          href={uploadHref}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
        >
          <span role="img" aria-label="upload">📤</span>
          Upload docs
        </a>
      </div>

      {/* Scrollable conversation */}
      <div
        ref={scrollerRef}
        className="max-h-[60vh] overflow-y-auto px-4 py-3"
      >
        <div className="space-y-6">
          {messages.map((m) => {
            const isUser = m.role === "user";
            const bubbleBase =
              "inline-block rounded-2xl px-3 py-2 text-sm leading-relaxed max-w-[75%]";
            const bubble = isUser
              ? `${bubbleBase} bg-blue-600 text-white`
              : `${bubbleBase} bg-slate-100 text-slate-900`;

            return (
              <div
                key={m.id}
                className={isUser ? "flex justify-end" : "flex justify-start"}
              >
                <div>
                  <div className={bubble}>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                  {/* Time + sources (assistant only) */}
                  <div
                    className={[
                      "mt-2 flex items-center gap-2",
                      isUser ? "justify-end" : "justify-start",
                      "text-xs text-slate-500",
                    ].join(" ")}
                  >
                    <span>{m.ts}</span>
                    {!isUser && m.sources && m.sources.length > 0 && (
                      <>
                        {m.sources.map((s, i) => (
                          <a
                            key={`${m.id}-src-${i}`}
                            href={s.url ?? "#"}
                            target={s.url ? "_blank" : undefined}
                            rel={s.url ? "noreferrer" : undefined}
                            className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[11px] text-slate-700 hover:bg-slate-50"
                          >
                            {s.title ? `Source ${i + 1}` : `Source ${i + 1}`}
                          </a>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question here…"
            rows={1}
            className="min-h-[40px] max-h-[140px] flex-1 resize-y rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={triggerSend}
            disabled={busy || !input.trim()}
            className="inline-flex select-none items-center gap-2 rounded-md border border-blue-600 bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <span role="img" aria-label="send">📤</span>
            Send
          </button>
        </div>
      </div>
    </section>
  );
}
