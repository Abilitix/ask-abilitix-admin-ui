import { InboxPageClient } from '@/components/inbox/InboxPageClient';
import { Toaster } from '@/components/ui/sonner';
import { getAuthUser } from '@/lib/auth';
import { getTenantSettingsServer, mapSettingsToFlags } from '@/lib/server/adminSettings';

export const dynamic = 'force-dynamic';

export default async function AdminInboxPage() {
  const user = await getAuthUser();
  const settings = await getTenantSettingsServer([
    'ADMIN_INBOX_API',
    'ENABLE_REVIEW_PROMOTE',
    'ALLOW_EMPTY_CITATIONS',
  ]);
  const { flags, tenantId } = mapSettingsToFlags(settings);

  return (
    <>
      <InboxPageClient
        initialFlags={flags}
        tenantId={tenantId}
        tenantSlug={settings?.tenant_slug ?? user?.tenant_slug}
        userRole={user?.role ?? 'viewer'}
      />
      <Toaster />
    </>
  );
}