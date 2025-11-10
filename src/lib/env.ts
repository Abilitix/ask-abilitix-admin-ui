const rawPreviewAdminApi =
  process.env.PREVIEW_ADMIN_API && process.env.PREVIEW_ADMIN_API.trim().length > 0
    ? process.env.PREVIEW_ADMIN_API.trim()
    : null;

const rawAdminApi =
  process.env.ADMIN_API && process.env.ADMIN_API.trim().length > 0
    ? process.env.ADMIN_API.trim()
    : null;

if (!rawPreviewAdminApi && !rawAdminApi) {
  throw new Error('Missing required environment variables: ADMIN_API or PREVIEW_ADMIN_API');
}

const PROD_COOKIE_DOMAIN = '.abilitix.com.au';

export function getAdminApiBase(): string {
  return rawPreviewAdminApi ?? rawAdminApi!;
}

export function getAppUrl(): string | undefined {
  return (
    process.env.PREVIEW_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim()
  );
}

function domainMatchesHost(domain: string, hostname: string): boolean {
  const host = hostname.toLowerCase();
  const normalizedDomain = domain.toLowerCase();
  const bareDomain = normalizedDomain.startsWith('.') ? normalizedDomain.slice(1) : normalizedDomain;

  if (normalizedDomain.startsWith('.')) {
    return host === bareDomain || host.endsWith(normalizedDomain);
  }

  return host === bareDomain || host.endsWith(`.${bareDomain}`);
}

export function getCookieDomain(hostname: string): string | undefined {
  const lowerHost = hostname.toLowerCase();
  const previewDomain = process.env.PREVIEW_COOKIE_DOMAIN?.trim();

  if (previewDomain && previewDomain.length > 0) {
    if (!domainMatchesHost(previewDomain, lowerHost)) {
      throw new Error(
        `PREVIEW_COOKIE_DOMAIN "${previewDomain}" must correspond to the preview host "${hostname}".`
      );
    }

    const barePreview = previewDomain.startsWith('.') ? previewDomain.slice(1) : previewDomain;
    if (
      (previewDomain === PROD_COOKIE_DOMAIN || barePreview === 'abilitix.com.au') &&
      !lowerHost.endsWith('abilitix.com.au')
    ) {
      throw new Error(
        `PREVIEW_COOKIE_DOMAIN "${previewDomain}" cannot use the production domain when serving "${hostname}".`
      );
    }

    return previewDomain;
  }

  const configured = process.env.COOKIE_DOMAIN?.trim();
  if (configured && configured.length > 0) {
    return configured;
  }

  if (lowerHost === 'localhost' || lowerHost === '127.0.0.1') {
    return hostname;
  }

  if (lowerHost.endsWith('abilitix.com.au')) {
    return PROD_COOKIE_DOMAIN;
  }

  return hostname;
}

