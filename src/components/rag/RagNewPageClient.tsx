"use client";

import * as React from "react";
import DenserChat from "@/components/rag/DenserChat";
import { RagHitsTable, type Hit } from "@/components/rag/RagHitsTable";

type Props = {
  /** Optional key from page.tsx to force a clean mount on revisit */
  instanceKey?: string;
};

export function RagNewPageClient({ instanceKey }: Props) {
  const [hits, setHits] = React.useState<Hit[]>([]);
  const [topScore, setTopScore] = React.useState<number | undefined>();
  const [loadingHits, setLoadingHits] = React.useState(false);
  const TOPK = 8;

  // Clear results whenever this page remounts (or instanceKey changes)
  React.useEffect(() => {
    setHits([]);
    setTopScore(undefined);
    setLoadingHits(false);
  }, [instanceKey]);

  const runRagSearch = React.useCallback(async (q: string) => {
    try {
      setLoadingHits(true);
      setHits([]);
      setTopScore(undefined);

      const res = await fetch(
        `/api/smoke/rag?q=${encodeURIComponent(q)}&topk=${TOPK}`
      );
      if (!res.ok) throw new Error(`RAG search failed: ${res.status}`);
      const data = await res.json();

      const transformed: Hit[] =
        data?.hits?.map((h: any, i: number) => ({
          idx: i + 1,
          score: Number(h?.score ?? 0),
          vec_sim: Number(h?.vec_sim ?? 0),
          trgm_sim: Number(h?.trgm_sim ?? 0),
          preview: String(h?.preview ?? h?.text ?? "No preview available"),
        })) ?? [];

      setHits(transformed);
      setTopScore(transformed.length ? transformed[0].score : undefined);
    } catch (err) {
      console.error("RAG search error:", err);
    } finally {
      setLoadingHits(false);
    }
  }, []);

  return (
    <div key={instanceKey ?? "rag-new"} className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">RAG Testing (New)</h1>
      </div>

      <DenserChat
        streamUrl="/api/ask/stream"
        uploadHref="/admin/docs"
        onQuestionAsked={runRagSearch}
      />

      <div className="mt-6">
        <RagHitsTable hits={hits} topScore={topScore} loading={loadingHits} />
      </div>
    </div>
  );
}
