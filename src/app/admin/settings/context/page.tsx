import { requireAuth } from '@/lib/auth';
import { ContextManagementPage } from '@/components/context/ContextManagementPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ContextSettingsPage() {
  const user = await requireAuth();
  return <ContextManagementPage />;
}

