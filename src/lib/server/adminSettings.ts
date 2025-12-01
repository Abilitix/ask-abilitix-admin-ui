import { cookies, headers } from 'next/headers';
import { getAdminApiBase } from '@/lib/env';

type TenantSettingKey =
  | 'ADMIN_INBOX_API'
  | 'ENABLE_REVIEW_PROMOTE'
  | 'INBOX.ENABLE_REVIEW_PROMOTE'
  | 'ALLOW_EMPTY_CITATIONS';

export type TenantSettingsResponse = {
  tenant_id?: string;
  tenant_slug?: string;
  settings: Record<TenantSettingKey, number | boolean | undefined>;
};

async function buildCookieHeader() {
  const hdrs = await headers();
  return hdrs.get('cookie') ?? '';
}

export async function getTenantSettingsServer(
  keys: TenantSettingKey[]
): Promise<TenantSettingsResponse | null> {
  try {
    const adminApi = getAdminApiBase();
    if (!adminApi) {
      console.error('[tenant-settings] Missing ADMIN_API base');
      return null;
    }

    const params = new URLSearchParams();
    if (keys.length) {
      params.set('keys', keys.join(','));
    }

    const cookieHeader = await buildCookieHeader();
    const requestHeaders: Record<string, string> = {};
    if (cookieHeader) {
      requestHeaders['Cookie'] = cookieHeader;
    }

    // Fetch tenant settings directly from Admin API
    const response = await fetch(`${adminApi}/admin/tenant-settings?${params.toString()}`, {
      method: 'GET',
      headers: requestHeaders,
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('[tenant-settings] Admin API error', response.status);
      return null;
    }

    const data = await response.json().catch(() => null);
    if (!data || typeof data !== 'object') {
      return null;
    }

    // Check for namespaced key first, fall back to non-namespaced for backward compatibility
    const enableReviewPromote = 
      data['INBOX.ENABLE_REVIEW_PROMOTE'] ?? data.ENABLE_REVIEW_PROMOTE;

    const settings: Record<TenantSettingKey, number | boolean | undefined> = {
      ADMIN_INBOX_API: data.ADMIN_INBOX_API,
      ENABLE_REVIEW_PROMOTE: enableReviewPromote,
      'INBOX.ENABLE_REVIEW_PROMOTE': enableReviewPromote,
      ALLOW_EMPTY_CITATIONS: data.ALLOW_EMPTY_CITATIONS,
    } as Record<TenantSettingKey, number | boolean | undefined>;

    return {
      tenant_id: data.tenant_id,
      tenant_slug: data.tenant_slug,
      settings,
    };
  } catch (error) {
    console.error('[tenant-settings] Failed to fetch settings', error);
    return null;
  }
}

export type InitialInboxFlags = {
  adminInboxApiEnabled: boolean;
  enableReviewPromote: boolean;
  allowEmptyCitations: boolean;
  enableFaqCreation: boolean;
};

export function mapSettingsToFlags(
  settings: TenantSettingsResponse | null
): { flags: InitialInboxFlags; tenantId?: string } {
  const defaults: InitialInboxFlags = {
    adminInboxApiEnabled: false,
    enableReviewPromote: true, // Always enabled - attach & promote is core workflow
    allowEmptyCitations: false,
    enableFaqCreation: true, // Always enabled - FAQ creation is core workflow
  };

  if (!settings) {
    return { flags: defaults, tenantId: undefined };
}

  const { settings: raw } = settings;

  const parseFlag = (value: unknown) => {
    if (typeof value === 'number') {
      return value === 1;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value === '1' || value.toLowerCase() === 'true';
    }
    return false;
  };

  return {
    flags: {
      adminInboxApiEnabled: parseFlag(raw.ADMIN_INBOX_API),
      enableReviewPromote: true, // Always enabled - attach & promote is core workflow (ignore backend value)
      allowEmptyCitations: parseFlag(raw.ALLOW_EMPTY_CITATIONS),
      enableFaqCreation: true, // Always enabled - FAQ creation is core workflow (ignore backend value)
    },
    tenantId: settings.tenant_id,
  };
}

