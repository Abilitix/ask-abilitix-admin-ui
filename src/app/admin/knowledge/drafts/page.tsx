import { requireAuth } from '@/lib/auth';
import { DraftsListClient } from '@/components/knowledge/DraftsListClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function KnowledgeDraftsPage() {
  const user = await requireAuth();

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Knowledge Studio Drafts</h1>
          <p className="text-sm text-slate-600 mt-1">
            Review, edit, and approve drafts generated from templates
          </p>
        </div>
      </div>

      <DraftsListClient />
    </div>
  );
}

