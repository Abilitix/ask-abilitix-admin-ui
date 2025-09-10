// Server-only API helpers for admin endpoints
// These functions must only be called from server-side code (Route Handlers, Server Actions)

const ADMIN_BASE = process.env.ADMIN_BASE;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const TENANT_ID = process.env.TENANT_ID;

if (!ADMIN_BASE || !ADMIN_TOKEN || !TENANT_ID) {
  throw new Error('Missing required environment variables: ADMIN_BASE, ADMIN_TOKEN, or TENANT_ID');
}

const defaultHeaders = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'X-Tenant-Id': TENANT_ID,
  'Content-Type': 'application/json',
};

export async function adminGet<T>(path: string): Promise<T> {
  const url = `${ADMIN_BASE}${path}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: defaultHeaders,
  });

  if (!response.ok) {
    throw new Error(`Admin API GET failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function adminPost<T>(path: string, body: unknown): Promise<T> {
  const url = `${ADMIN_BASE}${path}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Admin API POST failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function adminPut<T>(path: string, body: unknown): Promise<T> {
  const url = `${ADMIN_BASE}${path}`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: defaultHeaders,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Admin API PUT failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${ADMIN_BASE}${path}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Admin API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

