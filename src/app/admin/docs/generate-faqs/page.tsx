import { requireAuth, canManageDocs } from '@/lib/auth';
import { FAQGenerationClient } from '@/components/faq-generation/FAQGenerationClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function GenerateFAQsPage() {
  const user = await requireAuth();
  const canManage = canManageDocs(user.role);

  if (!canManage) {
    return (
      <div className="container mx-auto p-3 sm:p-4 md:p-6">
        <div className="rounded-md bg-blue-50 p-4">
          <div className="text-sm text-blue-700">
            You need document management permissions to generate FAQs. Contact an administrator for access.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Generate FAQs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate FAQs from your active documents
          </p>
        </div>
      </div>
      
      <FAQGenerationClient />
    </div>
  );
}

