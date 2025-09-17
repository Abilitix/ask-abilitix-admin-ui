import { requireAuth } from '@/lib/auth';
import AdminV2Client from './AdminV2Client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AdminV2Page() {
  const user = await requireAuth();
  return <AdminV2Client user={user} />;
}
