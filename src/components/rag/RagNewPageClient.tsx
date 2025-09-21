"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { RagHitsTable, type Hit } from "@/components/rag/RagHitsTable";
import { toast } from "sonner";

const DenserChat = dynamic(() => import("@/components/rag/DenserChat"), { ssr: false });

export function RagNewPageClient() {
  const [hits, setHits] = useState<Hit[]>([]);
  const [topScore, setTopScore] = useState<number | undefined>();
  const [ragBusy, setRagBusy] = useState(false);

  const runRagSearch = useCallback(async (q: string, topk: number) => {
    try {
      setRagBusy(true);
      setHits([]);
      setTopScore(undefined);

      const res = await fetch(`/api/smoke/rag?q=${encodeURIComponent(q)}&topk=${topk}`);
      if (!res.ok) throw new Error(`RAG search failed: ${res.status}`);
      const ragData = await res.json();

      const transformed: Hit[] =
        ragData.hits?.map((hit: any, idx: number) => ({
          idx: idx + 1,
          score: hit?.score || 0,
          vec_sim: hit?.vec_sim || 0,
          trgm_sim: hit?.trgm_sim || 0,
          preview: hit?.preview || hit?.text || "No preview available",
        })) ?? [];

      setHits(transformed);
      setTopScore(transformed[0]?.score);
      if (transformed.length === 0) toast.message("No RAG results found");
    } catch (e: any) {
      toast.error(`RAG search error: ${e?.message || e}`);
    } finally {
      setRagBusy(false);
    }
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6 pb-40">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">RAG Testing (New)</h1>
      </div>

      {/* Desktop: side-by-side; Mobile: chat first */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sources */}
        <div className="order-2 md:order-1 pb-40">
          <RagHitsTable hits={hits} topScore={topScore} loading={ragBusy} />
        </div>

        {/* Chat */}
        <div className="order-1 md:order-2">
          <DenserChat
            documentTitle="RAG Chat"
            uploadHref="/admin/docs"
            defaultTopK={8}
            streaming={true}
            // stream endpoint is /api/rag/stream by default inside DenserChat
            onAsked={(q: string, k: number) => runRagSearch(q, k)}
            feedbackUrl="/api/analytics/feedback"
          />
        </div>
      </div>
    </div>
  );
}
