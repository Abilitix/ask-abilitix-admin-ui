// Client-safe API helpers for ask endpoints
// These functions can be called from both client and server code

const ASK_BASE = process.env.NEXT_PUBLIC_ASK_BASE;

if (!ASK_BASE) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_ASK_BASE');
}

export type AskResponse = {
  answer: string;
  source: 'docs.rag' | 'qa.model' | 'model+inbox_pending' | 'db';
  /**
   * More detailed source info from runtime, e.g.:
   * - "docs"    → document RAG answer
   * - "qa_pair" → approved FAQ / KB answer
   */
  source_detail?: string;
  /**
   * TODO: Runtime will add this field to distinguish FAQ vs QA Pair answers.
   * Once runtime implements `is_faq` field, update `getAnswerTypeLabel()` logic
   * in ChatInterface.tsx and AskResultCard.tsx to use `is_faq` instead of `match` data.
   * See: docs/RUNTIME_ASK_API_ENHANCEMENT_REQUEST.md
   */
  is_faq?: boolean; // Whether this answer is from an FAQ (fresh or cached)
  citations?: Array<{ doc_id: string; chunk_idx: number; score: number }>;
  match?: {
    matched: boolean;
    id: string | null;
    similarity?: number;
    /** Mirrors runtime match.source_detail, e.g. "docs" or "qa_pair". */
    source_detail?: string;
  };
  inbox_id?: string;
};

export async function askGet<T>(path: string): Promise<T> {
  const url = `${ASK_BASE}${path}`;
  
  const response = await fetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Ask API GET failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function askPost(
  body: { question: string; session_id: string }
): Promise<AskResponse> {
  // Use the unified endpoint with tenant context instead of direct Ask API
  const response = await fetch('/api/ask/stream?stream=false', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Ask API POST failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
