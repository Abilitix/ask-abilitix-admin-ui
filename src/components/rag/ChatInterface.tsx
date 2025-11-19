"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { stripMarkdown } from "@/lib/text/markdown";
import { RENDER_MD } from "@/lib/text/flags";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";

// Token sync utility function
function getTokenLimitForRagTopK(ragTopK: number): number {
  if (ragTopK <= 2) return 250;
  if (ragTopK <= 4) return 400;
  if (ragTopK <= 6) return 600;
  if (ragTopK <= 8) return 800;
  if (ragTopK <= 12) return 1000;
  return 1200; // Max tokens
}

// Governance calculation helper
function getGovernanceMaxTopK(settingsTopK: number | null): number {
  if (!settingsTopK) return 20; // Fallback to current behavior
  const bufferTopK = Math.floor(settingsTopK * 1.5); // 50% buffer
  return Math.min(20, bufferTopK); // Cap at 20, but respect governance
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
  // Optional metadata about where the answer came from (docs RAG vs FAQ/db)
  source?: string;
  sourceDetail?: string;
  // Match information for determining answer type label
  match?: {
    matched: boolean;
    source_detail?: string;
  };
};

type StoredChat = {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    ts?: string;
  }>;
  lastUpdatedAt: string;
  tenantSlug?: string;
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

// Determine answer type label based on source and match information
function getAnswerTypeLabel(
  source?: string,
  sourceDetail?: string,
  match?: { matched: boolean; source_detail?: string }
): { label: string; color: string } | null {
  // FAQ fast path hit: match.matched === true AND match.source_detail === 'qa_pair'
  if (
    (source === 'db' || sourceDetail === 'qa_pair') &&
    match?.matched === true &&
    match?.source_detail === 'qa_pair'
  ) {
    return { label: 'Approved FAQ', color: 'text-emerald-700' };
  }

  // Regular QA pair (non-FAQ): source === 'db' BUT NOT FAQ fast path
  if (
    (source === 'db' || sourceDetail === 'qa_pair') &&
    (!match?.matched || match?.source_detail !== 'qa_pair')
  ) {
    return { label: 'Approved QA Pair', color: 'text-blue-700' };
  }

  // Document RAG: source === 'docs.rag' OR sourceDetail === 'docs'
  if (source === 'docs.rag' || sourceDetail === 'docs') {
    return { label: 'Document Search', color: 'text-green-700' };
  }

  // Model-generated or other: no label
  return null;
}

// localStorage helpers for sticky chat
function getStorageKey(tenantSlug?: string): string {
  const slug = tenantSlug || process.env.NEXT_PUBLIC_TENANT_SLUG || 'default';
  return `ask_abilitix_chat_${slug}`;
}

function loadChatFromStorage(tenantSlug?: string): StoredChat | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = getStorageKey(tenantSlug);
    const stored = window.localStorage.getItem(key);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored) as StoredChat;
    // Validate structure
    if (parsed && Array.isArray(parsed.messages) && typeof parsed.lastUpdatedAt === 'string') {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('[ChatInterface] Failed to load chat from localStorage:', err);
    return null;
  }
}

function saveChatToStorage(messages: ChatMsg[], tenantSlug?: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = getStorageKey(tenantSlug);
    const stored: StoredChat = {
      messages: messages.map((m) => ({
        role: m.role,
        content: m.text,
        ts: m.time,
      })),
      lastUpdatedAt: new Date().toISOString(),
      tenantSlug: tenantSlug || process.env.NEXT_PUBLIC_TENANT_SLUG,
    };
    window.localStorage.setItem(key, JSON.stringify(stored));
  } catch (err) {
    console.warn('[ChatInterface] Failed to save chat to localStorage:', err);
  }
}

function clearChatStorage(tenantSlug?: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = getStorageKey(tenantSlug);
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn('[ChatInterface] Failed to clear chat from localStorage:', err);
  }
}

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
  const [tenantSettings, setTenantSettings] = React.useState<{RAG_TOPK: number} | null>(null);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  // Tenant slug for localStorage isolation (critical for multi-tenant security)
  const [tenantSlug, setTenantSlug] = React.useState<string | undefined>(undefined);
  
  // Generate unique session ID for conversation memory (additive enhancement)
  const [sessionId] = React.useState(() => `ai-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  
  // Debug logging for session memory
  React.useEffect(() => {
    console.log('ChatInterface Debug - Session ID generated:', sessionId);
  }, [sessionId]);

  // Initialize messages from localStorage or default
  const [messages, setMessages] = React.useState<ChatMsg[]>(() => {
    // Start with default message; will reload from storage once tenant slug is known
    return [
      { id: "m0", role: "assistant", text: "Hello, how can I help you?", time: nowHHMM() },
    ];
  });

  // Fetch tenant info and settings on mount (critical for tenant isolation)
  React.useEffect(() => {
    const fetchTenantInfo = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          // Extract tenant slug from response (supports both nested and flat structures)
          const slug = data?.tenant?.slug || data?.tenant_slug || data?.tenant?.id || undefined;
          if (slug) {
            setTenantSlug(slug);
            // Load chat history for this specific tenant
            const stored = loadChatFromStorage(slug);
            if (stored && Array.isArray(stored.messages) && stored.messages.length > 0) {
              setMessages(stored.messages.map((m, idx) => ({
                id: `m${idx}`,
                role: m.role as ChatRole,
                text: m.content,
                time: m.ts,
                sources: [], // Sources not persisted
                source: undefined,
                sourceDetail: undefined,
                match: undefined, // Match data not persisted
              })));
            }
          }
        }
      } catch (error) {
        console.warn('[ChatInterface] Failed to fetch tenant info:', error);
      }
    };
    fetchTenantInfo();
  }, []);

  // Fetch tenant settings on mount (additive enhancement)
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data?.effective?.RAG_TOPK) {
            setTenantSettings({ RAG_TOPK: data.effective.RAG_TOPK });
            setTopK(data.effective.RAG_TOPK); // Use Settings value as starting point
          }
        }
      } catch (error) {
        // Silent fallback - use defaultTopK if API fails
        console.debug('Settings fetch failed, using default:', error);
      }
    };
    fetchSettings();
  }, []);

  // Auto-sync tokens when TopK changes (with 50% buffer, capped at 20)
  React.useEffect(() => {
    const baseTokens = getTokenLimitForRagTopK(topK);
    const bufferTokens = Math.floor(baseTokens * 1.5);
    const cappedTokens = Math.min(bufferTokens, 1200); // Max 1200 tokens
    setSessionMaxTokens(cappedTokens);
  }, [topK]);

  // Auto-save messages to localStorage whenever they change (only if tenant slug is known)
  React.useEffect(() => {
    if (messages.length > 0 && tenantSlug) {
      saveChatToStorage(messages, tenantSlug);
    }
  }, [messages, tenantSlug]);

  // Clear chat handler
  const handleClearChat = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      clearChatStorage(tenantSlug);
      setMessages([
        { id: "m0", role: "assistant", text: "Hello, how can I help you?", time: nowHHMM() },
      ]);
    }
  }, [tenantSlug]);

  // Copy latest assistant message handler
  const handleCopyLatestAssistant = React.useCallback(async (text: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      toast.error('Clipboard not available');
      return;
    }

    try {
      // Strip markdown formatting before copying
      const plainText = stripMarkdown(text);
      await navigator.clipboard.writeText(plainText);
      toast.success('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text:', err);
      toast.error('Failed to copy');
    }
  }, []);

  // Find the latest assistant message index
  const latestAssistantIndex = React.useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        return i;
      }
    }
    return -1;
  }, [messages]);

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
    // Metadata about answer origin (FAQ/db vs docs RAG)
    let answerSource: string | undefined;
    let answerSourceDetail: string | undefined;
    let answerMatch: { matched: boolean; source_detail?: string } | undefined;

    const updateAssistant = (text: string, src?: Source[]) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                text,
                sources: src ?? m.sources,
                // Attach any known source metadata from runtime
                source: answerSource ?? m.source,
                sourceDetail: answerSourceDetail ?? m.sourceDetail,
                match: answerMatch ?? m.match,
              }
            : m
        )
      );
    };

    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        text: "",
        time: nowHHMM(),
        sources: [],
        source: undefined,
        sourceDetail: undefined,
        match: undefined,
      },
    ]);

    // Non-stream fallback
    const askNonStreaming = async () => {
      const requestPayload = { 
        question, 
        topk: topK, 
        session_id: sessionId,
        ...(sessionMaxTokens ? { max_tokens: sessionMaxTokens } : {})
      };
      
      console.log('ChatInterface Debug - Non-stream request:', requestPayload);
      
      const res = await fetch(`${askUrl}?stream=false`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });
      if (!res.ok) throw new Error(`Ask (non-stream) failed: ${res.status}`);
      const json = await res.json();
      // Capture source metadata from non-streaming response (includes FAQ vs RAG flags)
      if (json && typeof json === 'object') {
        if (typeof json.source === 'string') {
          answerSource = json.source;
        }
        if (typeof json.source_detail === 'string') {
          answerSourceDetail = json.source_detail;
        }
        // Capture match information for answer type labeling
        if (json.match && typeof json.match === 'object') {
          answerMatch = {
            matched: Boolean(json.match.matched),
            source_detail: typeof json.match.source_detail === 'string' ? json.match.source_detail : undefined,
          };
        }
      }
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
      const streamingPayload = { 
        question, 
        topk: topK, 
        session_id: sessionId,
        ...(sessionMaxTokens ? { max_tokens: sessionMaxTokens } : {})
      };
      
      console.log('ChatInterface Debug - Streaming request:', streamingPayload);
      
      const res = await fetch(askUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(streamingPayload),
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

            // For meta / final events, capture source metadata when present
            if (payload && typeof payload === 'object') {
              if (typeof payload.source === 'string') {
                answerSource = payload.source;
              }
              if (typeof payload.source_detail === 'string') {
                answerSourceDetail = payload.source_detail;
              }
              // Capture match information for answer type labeling
              if (payload.match && typeof payload.match === 'object') {
                answerMatch = {
                  matched: Boolean((payload.match as any).matched),
                  source_detail: typeof (payload.match as any).source_detail === 'string' 
                    ? (payload.match as any).source_detail 
                    : undefined,
                };
                // Some runtimes nest source_detail under match
                const matchDetail = (payload.match as any)?.source_detail;
                if (typeof matchDetail === 'string') {
                  answerSourceDetail = matchDetail;
                }
              }
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            title="Clear chat"
            aria-label="Clear chat"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear chat
          </button>
          <a
            href={uploadHref}
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            ⬆ Upload docs
          </a>
        </div>
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
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            const isLatestAssistant = !isUser && idx === latestAssistantIndex;
            // Determine answer type label for assistant messages
            const answerType = !isUser
              ? getAnswerTypeLabel(m.source, m.sourceDetail, m.match)
              : null;
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
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm break-words relative",
                    isUser ? "bg-blue-600 text-white whitespace-pre-wrap" : "bg-slate-100 text-slate-900",
                  ].join(" ")}
                >
                  {/* Answer type label: shows appropriate label based on source and match */}
                  {answerType && (
                    <div className={`mb-1 text-[11px] font-medium ${answerType.color}`}>
                      Answer type: {answerType.label}
                    </div>
                  )}
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

                  {/* Footer with timestamp and copy button */}
                  <div className="mt-1.5 flex items-center gap-2">
                    {/* Copy button for latest assistant message - bottom left */}
                    {isLatestAssistant && (
                      <button
                        onClick={() => handleCopyLatestAssistant(m.text)}
                        className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
                        title="Copy message"
                        aria-label="Copy message"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {m.time && (
                      <div
                        className={[
                          "text-[11px]",
                          isUser ? "text-blue-100/80" : "text-slate-500",
                        ].join(" ")}
                      >
                        {m.time}
                      </div>
                    )}
                  </div>
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
                  max={getGovernanceMaxTopK(tenantSettings?.RAG_TOPK ?? null)}
                  value={topK}
                  onChange={(e) => {
                    const governanceMax = getGovernanceMaxTopK(tenantSettings?.RAG_TOPK ?? null);
                    const newTopK = Math.max(1, Math.min(governanceMax, parseInt(e.target.value || "8", 10)));
                    setTopK(newTopK);
                  }}
                  onKeyDown={(e) => {
                    // Prevent arrow keys from exceeding governance limits
                    const governanceMax = getGovernanceMaxTopK(tenantSettings?.RAG_TOPK ?? null);
                    if (e.key === 'ArrowUp' && topK >= governanceMax) {
                      e.preventDefault();
                    }
                    if (e.key === 'ArrowDown' && topK <= 1) {
                      e.preventDefault();
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-12 rounded border px-1 py-0.5 text-center focus:ring-2 focus:ring-blue-200"
                  disabled={sending}
                  title={`Number of sources to search (1-${getGovernanceMaxTopK(tenantSettings?.RAG_TOPK ?? null)})`}
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
