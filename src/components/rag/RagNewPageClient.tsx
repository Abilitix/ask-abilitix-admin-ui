"use client";

import * as React from "react";
import DenserChat from "@/components/rag/DenserChat";
import { RagHitsTable, type Hit } from "@/components/rag/RagHitsTable";

type Props = {
  /** unique per page render; used to reset state on revisit */
  instanceKey: string;
};

export function RagNewPageClient({ instanceKey }: Props) {
  const [hits, setHits] = React.useState<Hit[]>([]);
  const [topScore, setTopScore] = React.useState<number | undefined>(undefined);
  const [loadingHits, setLoadingHits] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Clear state when instanceKey changes (fresh visit)
  React.useEffect(() => {
    setHits([]);
    setTopScore(undefined);
    setError(null);
  }, [instanceKey]);

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
        <h1 className="text-2xl md:text-3xl font-bold">RAG Testing (New)</h1>
      </div>

      {/* Denser-style chat; triggers the table below on each ask */}
      <DenserChat
        documentTitle="RAG Chat"
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
