import { InboxPageClient } from '@/components/inbox/InboxPageClient';
import { Toaster } from '@/components/ui/sonner';

export default function AdminInboxPage() {
  return (
    <>
      <InboxPageClient />
      <Toaster />
    </>
  );
}