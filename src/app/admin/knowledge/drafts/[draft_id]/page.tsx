import { requireAuth } from '@/lib/auth';
import { DraftEditorClient } from '@/components/knowledge/DraftEditorClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function DraftEditorPage({
  params,
}: {
  params: Promise<{ draft_id: string }>;
}) {
  const user = await requireAuth();
  const resolvedParams = await params;
  const draftId = resolvedParams.draft_id;

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Edit Draft</h1>
          <p className="text-sm text-slate-600 mt-1">
            Review and edit draft content, citations, and metadata
          </p>
        </div>
      </div>

      <DraftEditorClient draftId={draftId} />
    </div>
  );
}

