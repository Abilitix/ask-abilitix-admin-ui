import { requireAuth } from '@/lib/auth';
import { FAQManagementClient } from '@/components/faq-lifecycle/FAQManagementClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AdminFAQsPage() {
  const user = await requireAuth();

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">FAQ Lifecycle Management</h1>
      </div>

      <FAQManagementClient />
    </div>
  );
}

