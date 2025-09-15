import { requireAuth, canManageDocs } from '@/lib/auth';

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
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Documents Management</h2>
          <p className="text-slate-600">Document management features are available for admin users.</p>
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

