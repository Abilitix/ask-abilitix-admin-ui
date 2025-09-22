export const dynamic = "force-dynamic";

import * as React from "react";
import { RagNewPageClient } from "@/components/rag/RagNewPageClient";

export default function AdminRagNewPage() {
  // Unique per render/visit to force a clean client mount & state reset
  const instanceKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return (
    <React.Suspense
      fallback={
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
              <p>Loading RAG Testing page...</p>
            </div>
          </div>
        </div>
      }
    >
      <RagNewPageClient instanceKey={instanceKey} />
    </React.Suspense>
  );
}
