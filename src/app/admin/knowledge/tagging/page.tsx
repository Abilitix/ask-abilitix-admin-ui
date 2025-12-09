import { requireAuth } from '@/lib/auth';
import { TaggingListClient } from '@/components/knowledge/TaggingListClient';

export const dynamic = 'force-dynamic';

export default async function KnowledgeTaggingPage() {
  await requireAuth();

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6">
      <TaggingListClient />
    </div>
  );
}

