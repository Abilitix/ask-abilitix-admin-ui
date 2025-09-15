import { Suspense } from 'react';
import { RagPageClient } from '@/components/rag/RagPageClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AdminRagPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading RAG Hygiene page...</p>
          </div>
        </div>
      </div>
    }>
      <RagPageClient />
    </Suspense>
  );
}
