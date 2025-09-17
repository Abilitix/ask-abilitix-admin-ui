import { InboxPageClient } from '@/components/inbox/InboxPageClient';
import { Toaster } from '@/components/ui/sonner';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminInboxPage() {
  return (
    <>
      <InboxPageClient />
      <Toaster />
    </>
  );
}