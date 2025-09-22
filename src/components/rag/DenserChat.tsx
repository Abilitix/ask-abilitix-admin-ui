"use client";

import * as React from "react";

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
  onAsked?: (q: string, k: number) => void; // caller can run RAG table below
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

export default function DenserChat({
  documentTitle = "RAG Chat",
  uploadHref = "/admin/docs",
  defaultTopK = 8,
  askUrl = "/api/ask/stream",
  onAsked,
}: Props) {
  const [topK, setTopK] = React.useState<number>(defaultTopK);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);

  // seed with a friendly opener
  const [messages, setMessages] = React.useState<ChatMsg[]>([
    { id: "m0", role: "assistant", text: "Hello, how can I help you?", time: nowHHMM() },
  ]);

  const chatRef = React.useRef<HTMLDivElement | null>(null);

  const scrollToBottom = React.useCallback(() => {
    // scroll the scrollable chat area
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ---------- STREAMING ----------
  async function streamAsk(question: string) {
    setSending(true);

    // Push user message
    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "user",
      text: question,
      time: nowHHMM(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Create placeholder assistant message we’ll update live
    const assistantId = crypto.randomUUID();
    let assistantBuffer = "";
    let citations: Source[] = [];

    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        text: "",
        time: nowHHMM(),
        sources: [],
      },
    ]);

    const updateAssistant = (text: string, src?: Source[]) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, text, sources: src ?? m.sources } : m))
      );
    };

    // Helper: non-streaming fallback
    const askNonStreaming = async () => {
      const res = await fetch(`${askUrl}?stream=false`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, topk: topK, session_id: "rag-new" }),
      });
      if (!res.ok) throw new Error(`Ask (non-stream) failed: ${res.status}`);
      const json = await res.json();
      const answer = json?.answer ?? json?.content ?? "";
      const srcs = normalizeSources(json?.citations ?? json?.sources);
      assistantBuffer = String(answer ?? "");
      citations = srcs;
      updateAssistant(assistantBuffer, citations);
    };

    // Main SSE path
    try {
      const res = await fetch(askUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Some backends prefer this; harmless otherwise:
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ question, topk: topK, session_id: "rag-new" }),
      });

      // If this endpoint is not streaming (405/404 etc.), fall back
      if (!res.ok || !res.body) {
        await askNonStreaming();
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let partial = "";     // carry across chunks for line-splitting
      let currentEvent = ""; // remember the last "event:" value

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partial += decoder.decode(value, { stream: true });

        // Split into lines; keep trailing partial if the chunk ends mid-line
        const lines = partial.split(/\r?\n/);
        partial = lines.pop() ?? ""; // remainder carried to next read

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;

          if (line.startsWith("event:")) {
            currentEvent = line.slice(6).trim();
            continue;
          }

          if (line.startsWith("data:")) {
            const dataStr = line.slice(5).trim();

            // Many providers use a sentinel
            if (dataStr === "[DONE]") {
              // finalize
              updateAssistant(assistantBuffer, citations);
              continue;
            }

            // Robust parsing: try JSON; if not JSON, treat as plain text token
            try {
              const payload = JSON.parse(dataStr);

              // Common shapes:
              // { delta: "text" }   // streaming token
              // { content: "..." }  // sometimes used
              // { citations: [...] } // on "done"
              // Or OpenAI’s choices[].delta.content, but we don’t expect that here

              const token =
                payload?.delta ??
                payload?.content ??
                (typeof payload === "string" ? payload : "");

              if (token) {
                assistantBuffer += String(token);
                updateAssistant(assistantBuffer);
              }

              // Attach sources when provided (often on final "done" event)
              if (payload?.citations || payload?.sources) {
                citations = normalizeSources(payload.citations ?? payload.sources);
                updateAssistant(assistantBuffer, citations);
              }

              // Some servers label content with event: content
              if (currentEvent === "content" && typeof payload === "string") {
                assistantBuffer += payload;
                updateAssistant(assistantBuffer);
              }
            } catch {
              // Not JSON — treat as literal text token
              assistantBuffer += dataStr;
              updateAssistant(assistantBuffer);
            }
          }
        }
      }

      // Stream ended; ensure final text/sources are applied
      updateAssistant(assistantBuffer, citations);
    } catch (err) {
      console.error("SSE error, falling back:", err);
      // fallback path
      try {
        await askNonStreaming();
      } catch (e) {
        console.error("Non-stream ask failed:", e);
        updateAssistant("Sorry—there was an error.");
      }
    } finally {
      setSending(false);
    }
  }

  // ---------- Handlers ----------
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || sending) return;
    setInput("");
    onAsked?.(q, topK);
    await streamAsk(q);
  };

  // ---------- UI ----------
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

      {/* Chat body (scrollable) */}
      <div className="flex max-h-[65vh] flex-col">
        <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-6">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={[
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words",
                    isUser
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-900",
                  ].join(" ")}
                >
                  <div>{m.text}</div>
                  {m.sources && m.sources.length > 0 && !isUser && (
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

        {/* Composer (stays inside the card, no footer collision) */}
        <form
          onSubmit={onSubmit}
          className="sticky bottom-0 z-[1] flex items-end gap-2 border-t bg-white px-3 py-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question here…"
            className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || input.trim().length === 0}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            title="Send"
          >
            {sending ? "Sending…" : "Send"}
          </button>

          {/* Mini TopK control */}
          <div className="ml-2 inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-xs">
            <span>TopK</span>
            <input
              type="number"
              min={1}
              max={20}
              value={topK}
              onChange={(e) =>
                setTopK(Math.max(1, Math.min(20, parseInt(e.target.value || "8", 10))))
              }
              className="w-12 rounded border px-1 py-0.5 text-center"
              disabled={sending}
              title="Number of sources to search"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
