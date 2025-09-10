// Client-safe API helpers for ask endpoints
// These functions can be called from both client and server code

const ASK_BASE = process.env.NEXT_PUBLIC_ASK_BASE;
const TENANT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG;

if (!ASK_BASE || !TENANT_SLUG) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_ASK_BASE or NEXT_PUBLIC_TENANT_SLUG');
}

export type AskResponse = {
  answer: string;
  source: 'docs.rag' | 'qa.model' | 'model+inbox_pending';
  citations?: Array<{doc_id: string; chunk_idx: number; score: number}>;
  match?: { matched: boolean; id: string | null; similarity?: number };
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
  const url = `${ASK_BASE}/ask`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-slug': TENANT_SLUG!,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Ask API POST failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
