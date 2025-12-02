import { requireAuth, canManageDocs } from '@/lib/auth';
import { DocumentsClient } from '@/components/documents/DocumentsClient';
import { DocsStatsCard } from '@/components/docs/DocsStatsCard';
import { ReembedButton } from '@/components/docs/ReembedButton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AdminDocsPage() {
  const user = await requireAuth();
  const canManage = canManageDocs(user.role);

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Documents</h1>
        {canManage && (
          <Link href="/admin/docs/generate-faqs" className="w-full sm:w-auto">
            <Button 
              variant="default" 
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm min-h-[44px]"
            >
              <Sparkles className="h-4 w-4" />
              Generate FAQs
            </Button>
          </Link>
        )}
      </div>
      
      {canManage ? (
        <div className="space-y-6">
          {/* Document Statistics */}
          <DocsStatsCard />
          
          {/* New Document Management System */}
          <DocumentsClient showActions={true} />
          
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

