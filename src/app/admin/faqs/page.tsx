import { requireAuth } from '@/lib/auth';
import { FAQManagementClient } from '@/components/faq-lifecycle/FAQManagementClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AdminFAQsPage() {
  const user = await requireAuth();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">FAQ Lifecycle Management</h1>
      </div>

      <FAQManagementClient />
    </div>
  );
}

