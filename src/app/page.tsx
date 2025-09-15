import { requireAuth } from '@/lib/auth';
import DashboardClient from '@/components/DashboardClient';

export default async function Page() {
  const user = await requireAuth();
  return <DashboardClient user={user} />;
}