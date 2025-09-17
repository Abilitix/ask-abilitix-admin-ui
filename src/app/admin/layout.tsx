import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import TopNav from '@/components/TopNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect('/signin');
  
  return (
    <>
      <TopNav userRole={user.role} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </>
  );
}
