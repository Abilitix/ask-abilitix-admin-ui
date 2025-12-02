import { requireAuth, canManageDocs } from '@/lib/auth';
import { DocumentsClient } from '@/components/documents/DocumentsClient';
import { ReembedButton } from '@/components/docs/ReembedButton';
import { DocumentsPageHeader } from '@/components/documents/DocumentsPageHeader';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AdminDocsPage() {
  const user = await requireAuth();
  const canManage = canManageDocs(user.role);

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Page Header with Primary Actions */}
      <DocumentsPageHeader canManage={canManage} />
      
      {canManage ? (
        <div className="space-y-6">
          {/* Document Management System */}
          <DocumentsClient showActions={true} />
          
          {/* Re-embed Button */}
          <ReembedButton />
        </div>
      ) : (
        <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
          <div className="text-sm text-blue-700">
            You have read-only access to documents. Contact an administrator for management permissions.
          </div>
        </div>
      )}
    </div>
  );
}

