"use client";

import * as React from "react";

type Source = { label: string; url?: string; snippet?: string };
type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  time?: string;
  sources?: Source[];
};

type Props = {
  /** SSE endpoint (your app: POST /api/ask/stream) */
  streamUrl?: string;
  /** Upload docs link placed at the very top */
  uploadHref?: string;
  /** Called when a question is sent so parent can do a RAG search in parallel */
  onQuestionAsked?: (q: string) => void;
};

const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function DenserChat({
  streamUrl = "/api/ask/stream",
  uploadHref = "/admin/docs",
  onQuestionAsked,
}: Props) {
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [input, setInput] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);

  // Keep the scroll pinned to bottom as new tokens arrive
  const listRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isStreaming]);

  async function handleSend() {
    const q = input.trim();
    if (!q || isStreaming) return;

    // Allow parent to perform RAG search in parallel
    onQuestionAsked?.(q);

    const userMsg: ChatMsg = {
      id: `u_${Date.now()}`,
      role: "user",
      content: q,
      time: nowHHMM(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setInput("");

    // Create a placeholder assistant message we will stream into
    const aId = `a_${Date.now()}`;
    const assistantMsg: ChatMsg = {
      id: aId,
      role: "assistant",
      content: "",
      time: nowHHMM(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsStreaming(true);

    try {
      const res = await fetch(streamUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          session_id: "rag-new-ui",
        }),
      });
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let currentEvent: string | null = null;
      let acc = ""; // accumulated assistant text
      let finalSources: Source[] | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Robust SSE parse: handle "event:" and "data:" lines.
        // Server may emit:
        //   event: content
        //   data: {"delta":"..."}
        // or:
        //   data: {"content":"..."} / {"text":"..."}
        // and a final:
        //   event: done
        //   data: {"citations":[...]}
        const lines = chunk.split(/\r?\n/);
        for (const line of lines) {
          const l = line.trim();
          if (!l) continue;

          if (l.startsWith("event:")) {
            currentEvent = l.slice(6).trim();
            continue;
          }
          if (l.startsWith("data:")) {
            const payload = l.slice(5).trim();
            if (payload === "[DONE]") {
              currentEvent = "done";
              continue;
            }
            try {
              const json = JSON.parse(payload);

              // Token handling: accept delta | content | text
              const delta: string =
                (typeof json.delta === "string" && json.delta) ||
                (typeof json.content === "string" && json.content) ||
                (typeof json.text === "string" && json.text) ||
                "";

              if (delta) {
                acc += delta;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aId ? { ...m, content: acc } : m
                  )
                );
              }

              // Citations may show at the end or intermittently
              if (Array.isArray(json.citations)) {
                // Normalize citations into {label,url?,snippet?}
                finalSources = json.citations.map((c: any, i: number) => {
                  const label =
                    c?.title ||
                    c?.label ||
                    c?.name ||
                    c?.url ||
                    `Source ${i + 1}`;
                  return {
                    label: String(label),
                    url: typeof c?.url === "string" ? c.url : undefined,
                    snippet:
                      typeof c?.snippet === "string" ? c.snippet : undefined,
                  } as Source;
                });
              }
            } catch {
              // ignore malformed json
            }
          }
        }
      }

      // Close out the assistant message with final sources (if any)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aId ? { ...m, sources: finalSources } : m
        )
      );
    } catch (err) {
      // Surface a small error bubble
      setMessages((prev) =>
        prev.map((m) =>
          m.id === `a_${assistantMsg.id}` ? m : m
        )
      );
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content:
            "Sorry—there was a problem streaming the answer. Please try again.",
        },
      ]);
      console.error("stream error:", err);
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white">
      {/* Top actions bar */}
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="text-sm font-medium text-slate-800">
          Chat with your documents
        </div>
        <a
          href={uploadHref}
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
        >
          Upload docs
        </a>
      </div>

      {/* Transcript */}
      <div
        ref={listRef}
        className="max-h-[60vh] overflow-y-auto px-4 py-4 pb-24"
      >
        {messages.length === 0 ? (
          <div className="text-sm text-slate-500">
            Ask a question to begin.
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={[
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start",
                ].join(" ")}
              >
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-900",
                  ].join(" ")}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="text-[11px] font-semibold opacity-70">
                        Sources
                      </div>
                      <ul className="space-y-1">
                        {m.sources.map((s, i) => (
                          <li key={i} className="text-[11px]">
                            {s.url ? (
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noreferrer"
                                className="underline"
                              >
                                {s.label}
                              </a>
                            ) : (
                              <span>{s.label}</span>
                            )}
                            {s.snippet ? (
                              <span className="opacity-70"> — {s.snippet}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isStreaming && (
              <div className="text-[11px] text-slate-500">…streaming</div>
            )}
          </div>
        )}
      </div>

      {/* Composer — sticky; avoids footer collisions */}
      <div className="sticky bottom-0 left-0 right-0 border-t bg-white px-3 py-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            placeholder="Type your question…"
            className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isStreaming}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
