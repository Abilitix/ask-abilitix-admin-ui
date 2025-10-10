"use client";

import * as React from "react";
import DenserChat from "@/components/rag/DenserChat";
import { RagHitsTable, type Hit } from "@/components/rag/RagHitsTable";
import type { UserRole } from "@/lib/roles";

type Props = {
  /** unique per page render; used to reset state on revisit */
  instanceKey: string;
};

export function RagNewPageClient({ instanceKey }: Props) {
  const [hits, setHits] = React.useState<Hit[]>([]);
  const [topScore, setTopScore] = React.useState<number | undefined>(undefined);
  const [loadingHits, setLoadingHits] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [userRole, setUserRole] = React.useState<UserRole | undefined>();

  // Clear state when instanceKey changes (fresh visit)
  React.useEffect(() => {
    setHits([]);
    setTopScore(undefined);
    setError(null);
  }, [instanceKey]);

  // Get user role for viewer instructions
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok && alive) {
          const data = await res.json();
          const role = data?.role;
          if (role === 'owner' || role === 'admin' || role === 'curator' || role === 'viewer' || role === 'guest') {
            setUserRole(role);
          }
        }
      } catch {
        // Ignore errors, role will remain undefined
      }
    })();
    return () => { alive = false; };
  }, []);

  // Optional: when navigating back/forward from bfcache, ensure we reset
  React.useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      // if persisted, it was loaded from bfcache
      if ((e as any).persisted) {
        setHits([]);
        setTopScore(undefined);
        setError(null);
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  // RAG search (called after each question is asked in the chat)
  const runRagSearch = React.useCallback(async (q: string, k: number) => {
    if (!q.trim()) return;
    try {
      setLoadingHits(true);
      setError(null);

      const url = `/api/smoke/rag?q=${encodeURIComponent(q)}&topk=${k}`;
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) {
        throw new Error(`RAG search failed: ${res.status}`);
      }
      const json = await res.json();

      const transformed: Hit[] =
        json?.hits?.map((h: any, i: number) => ({
          idx: i + 1,
          score: h?.score ?? 0,
          vec_sim: h?.vec_sim ?? 0,
          trgm_sim: h?.trgm_sim ?? 0,
          preview: h?.preview ?? h?.text ?? "No preview available",
        })) ?? [];

      setHits(transformed);
      setTopScore(transformed.length > 0 ? transformed[0].score : undefined);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "RAG search error";
      setError(msg);
      setHits([]);
      setTopScore(undefined);
      // Non-fatal: allow chat to continue even if search view errors
      // console.error("RAG search error:", e);
    } finally {
      setLoadingHits(false);
    }
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">AI Assistant</h1>
      </div>

      {/* Viewer Instructions */}
      {userRole === 'viewer' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Welcome, Viewer!
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Welcome! You're here to test our chatbot and see how well it answers questions from your team's documents. 
                  Document uploads and settings are handled by your administrators.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Denser-style chat; triggers the table below on each ask */}
      <DenserChat
        documentTitle="Ask Assistant"
        uploadHref="/admin/docs"
        askUrl="/api/ask/stream"
        onAsked={runRagSearch}
      />

      {/* Search results table shown under chat */}
      <div className="mt-4">
        <RagHitsTable hits={hits} topScore={topScore} loading={loadingHits} />
        {error && (
          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
