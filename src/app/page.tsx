import { requireAuth } from '@/lib/auth';
import DashboardClient from '@/components/DashboardClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await requireAuth();
  return <DashboardClient user={user} />;
}