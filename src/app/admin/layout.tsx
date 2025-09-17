import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect('/signin');
  
  // Neutralize admin layout: let root layout own TopNav/wrappers
  return children;
}
