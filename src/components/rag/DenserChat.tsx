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
  /** If omitted, we try /api/ask/stream, then fall back to /api/rag/stream */
  streamUrl?: string;
  uploadHref?: string;
  defaultTopK?: number;
  onQuestionAsked?: (q: string) => void;
};

const hhmm = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

/** Convert your `citations` shape to UI sources */
function citationsToSources(citations: any[] | undefined): Source[] | undefined {
  if (!Array.isArray(citations)) return undefined;
  return citations.map((c, i) => ({
    label:
      typeof c?.doc_id === "string"
        ? `Source ${i + 1} (${c.doc_id.slice(0, 8)})`
        : `Source ${i + 1}`,
  }));
}

export default function DenserChat({
  streamUrl,
  uploadHref = "/admin/docs",
  defaultTopK = 8,
  onQuestionAsked,
}: Props) {
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
  }, [messages, busy]);

  async function postWithFallback(q: string, topk: number) {
    const body = {
      // Send both keys so either server variant works
      question: q,
      q,
      topk,
      stream: true,
      session_id: "rag-new-ui",
    };

    const tryOne = async (url: string) => {
      // Don't add stream=true to URL if it's already in the body
      return fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(body),
      });
    };

    if (streamUrl) return tryOne(streamUrl);

    // Your canonical endpoint:
    let res = await tryOne("/api/ask/stream");
    if (res.status === 404 || res.status === 405) {
      // Fallback to the older path if present
      res = await tryOne("/api/rag/stream");
    }
    return res;
  }

  async function send() {
    const q = input.trim();
    if (!q || busy) return;

    onQuestionAsked?.(q);

    const u: ChatMsg = { id: `u_${Date.now()}`, role: "user", content: q, time: hhmm() };
    const aid = `a_${Date.now()}`;
    setMessages((m) => [...m, u, { id: aid, role: "assistant", content: "", time: hhmm() }]);
    setInput("");
    setBusy(true);

    try {
      const res = await postWithFallback(q, defaultTopK);
      if (!res.ok || !res.body) throw new Error(`stream ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      // SSE state (aligned to your payload)
      let acc = "";
      let finalCitations: any[] | undefined;
      let currentEvent = ""; // "", "content", "done"
      let buffer = "";
      let dataLines: string[] = [];

      const flushEvent = () => {
        // join data lines and parse
        const raw = dataLines.join("\n").trim();
        if (!raw) {
          currentEvent = "";
          dataLines = [];
          return;
        }
        try {
          const json = JSON.parse(raw);

          // 1) initial match info (no 'event:')
          if (!currentEvent && json?.source === "docs.rag" && json?.match) {
            // You can store/display json.match if desired
          }

          // 2) streaming content
          if (currentEvent === "content" && typeof json?.delta === "string") {
            acc += json.delta;
            setMessages((prev) =>
              prev.map((m) => (m.id === aid ? { ...m, content: acc } : m))
            );
          }

          // 3) final citations
          if (currentEvent === "done" && Array.isArray(json?.citations)) {
            finalCitations = json.citations;
          }
        } catch {
          // ignore bad JSON; your endpoint always sends JSON
        }
        currentEvent = "";
        dataLines = [];
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process as SSE: split by lines, events separated by blank line
        let idx: number;
        while ((idx = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, idx).replace(/\r$/, "");
          buffer = buffer.slice(idx + 1);

          if (line.startsWith("event:")) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trim());
          } else if (line.trim() === "") {
            // end of one event
            flushEvent();
          } else {
            // ignore other fields (id:, retry:, etc.)
          }
        }
      }
      // flush any trailing event
      if (dataLines.length) flushEvent();

      // attach citations to the last assistant message
      const sources = citationsToSources(finalCitations);
      setMessages((prev) =>
        prev.map((m) => (m.id === aid ? { ...m, sources } : m))
      );
    } catch (e) {
      console.error(e);
      setMessages((prev) =>
        prev.map((m) => (m.id === aid ? { ...m, content: "Sorry—there was a problem streaming the answer." } : m))
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white">
      {/* header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="text-sm font-medium text-slate-800">Chat with your documents</div>
        <a
          href={uploadHref}
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
        >
          Upload docs
        </a>
      </div>

      {/* transcript */}
      <div ref={scrollerRef} className="max-h-[60vh] overflow-y-auto px-4 py-4 pb-24">
        {messages.length === 0 ? (
          <div className="text-sm text-slate-500">Ask a question to begin.</div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={["flex", m.role === "user" ? "justify-end" : "justify-start"].join(" ")}
              >
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    m.role === "user" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-900",
                  ].join(" ")}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="text-[11px] font-semibold opacity-70">Sources</div>
                      <ul className="space-y-1">
                        {m.sources.map((s, i) => (
                          <li key={i} className="text-[11px]">
                            {s.url ? (
                              <a href={s.url} target="_blank" rel="noreferrer" className="underline">
                                {s.label}
                              </a>
                            ) : (
                              <span>{s.label}</span>
                            )}
                            {s.snippet ? <span className="opacity-70"> — {s.snippet}</span> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="text-[11px] text-slate-500">…streaming</div>}
          </div>
        )}
      </div>

      {/* composer */}
      <div className="sticky bottom-0 left-0 right-0 border-t bg-white px-3 py-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type your question…"
            className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            disabled={busy}
          />
          <button
            onClick={send}
            disabled={!input.trim() || busy}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}