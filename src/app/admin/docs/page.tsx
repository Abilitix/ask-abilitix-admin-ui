import { requireAuth, canManageDocs } from '@/lib/auth';
import { DocsStatsCard } from '@/components/docs/DocsStatsCard';
import { DocumentManagementClient } from '@/components/docs/DocumentManagementClient';
import { ReembedButton } from '@/components/docs/ReembedButton';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AdminDocsPage() {
  const user = await requireAuth();
  const canManage = canManageDocs(user.role);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Documents</h1>
        <div className="text-sm text-slate-600">
          Signed in as {user.email} ({user.role})
        </div>
      </div>
      
      {canManage ? (
        <div className="space-y-6">
          {/* Document Statistics */}
          <DocsStatsCard />
          
          {/* Complete Document Management */}
          <DocumentManagementClient />
          
          {/* Re-embed Button */}
          <ReembedButton />
        </div>
      ) : (
        <div className="rounded-md bg-blue-50 p-4">
          <div className="text-sm text-blue-700">
            You have read-only access to documents. Contact an administrator for management permissions.
          </div>
        </div>
      )}
    </div>
  );
}

