import { InboxPageClient } from '@/components/inbox/InboxPageClient';
import { Toaster } from '@/components/ui/sonner';
import { getAuthUser } from '@/lib/auth';
import { getTenantSettingsServer, mapSettingsToFlags } from '@/lib/server/adminSettings';
import { getAdminApiBase } from '@/lib/env';
import { headers, cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function probeInboxApiShape(): Promise<boolean> {
  try {
    const cookieHeader = (await cookies()).get('cookie')?.value || '';
    const hdrs = await headers();
    const proto = hdrs.get('x-forwarded-proto') ?? 'https';
    const host = hdrs.get('host');
    const baseUrl = host ? `${proto}://${host}` : undefined;

    if (!baseUrl) return false;

    const probeUrl = `${baseUrl}/api/admin/inbox?limit=1`;
    const response = await fetch(probeUrl, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: 'no-store',
    });

    if (!response.ok) return false;

    const data = await response.json().catch(() => null);
    // Accept both {items:[...]} and [...] (defensive)
    return Array.isArray(data?.items) || Array.isArray(data);
  } catch {
    return false;
  }
}

export default async function AdminInboxPage() {
  const user = await getAuthUser();
  const settings = await getTenantSettingsServer([
    'ADMIN_INBOX_API',
    'ENABLE_REVIEW_PROMOTE',
    'ALLOW_EMPTY_CITATIONS',
  ]);
  const { flags, tenantId } = mapSettingsToFlags(settings);

  // Safety-belt: only render modern inbox if API probe confirms expected shape
  const probeOk = flags.adminInboxApiEnabled ? await probeInboxApiShape() : false;
  const shouldRenderModern = flags.adminInboxApiEnabled && probeOk;

  return (
    <>
      <InboxPageClient
        initialFlags={{
          ...flags,
          // Override to false if probe failed
          adminInboxApiEnabled: shouldRenderModern,
        }}
        tenantId={tenantId}
        tenantSlug={settings?.tenant_slug ?? user?.tenant_slug}
        userRole={user?.role ?? 'viewer'}
      />
      <Toaster />
    </>
  );
}