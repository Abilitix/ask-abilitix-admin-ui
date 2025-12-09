import { requireAuth } from '@/lib/auth';
import { TaggingListClient } from '@/components/knowledge/TaggingListClient';

export const dynamic = 'force-dynamic';

export default async function KnowledgeTaggingPage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
            Needs Tagging
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
            Tag JDs and CVs with role and candidate so recruiter generators can select the right documents.
          </p>
        </div>
      </div>

      <TaggingListClient />
    </div>
  );
}

