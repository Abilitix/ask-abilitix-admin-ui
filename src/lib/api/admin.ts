// Server-only API helpers for admin endpoints
// These functions must only be called from server-side code (Route Handlers, Server Actions)

const ADMIN_API = process.env.ADMIN_API;

if (!ADMIN_API) {
  throw new Error('Missing required environment variable: ADMIN_API');
}

const defaultHeaders = {
  'Content-Type': 'application/json',
};

// Helper function to get cookies from request
function getCookiesFromRequest(request?: Request): string {
  if (!request) {
    // If no request provided, try to get cookies from global context
    // This is a fallback for routes that don't pass the request object
    return '';
  }
  return request.headers.get('cookie') || '';
}

export async function adminGet<T>(path: string, request?: Request): Promise<T> {
  const cookieHeader = getCookiesFromRequest(request);
  const url = `${ADMIN_API}${path}`;
  
  console.log('AdminGet Debug:', {
    url: url,
    cookieLength: cookieHeader.length,
    path: path
  });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...defaultHeaders,
      'Cookie': cookieHeader,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Admin API GET Error Details:', {
      status: response.status,
      statusText: response.statusText,
      url: url,
      responseBody: errorText
    });
    throw new Error(`Admin API GET failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function adminPost<T>(path: string, body: unknown, request?: Request): Promise<T> {
  const cookieHeader = getCookiesFromRequest(request);
  
  console.log('AdminPost Debug:', {
    url: `${ADMIN_API}${path}`,
    cookieLength: cookieHeader.length,
    bodyKeys: body && typeof body === 'object' ? Object.keys(body) : 'not object'
  });

  const response = await fetch(`${ADMIN_API}${path}`, {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      'Cookie': cookieHeader,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Admin API Error Details:', {
      status: response.status,
      statusText: response.statusText,
      url: `${ADMIN_API}${path}`,
      responseBody: errorText
    });
    throw new Error(`Admin API POST failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function adminPut<T>(path: string, body: unknown, request?: Request): Promise<T> {
  const response = await fetch(`${ADMIN_API}${path}`, {
    method: 'PUT',
    headers: {
      ...defaultHeaders,
      'Cookie': getCookiesFromRequest(request),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Admin API PUT failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function adminFetch<T>(path: string, options: RequestInit = {}, request?: Request): Promise<T> {
  const response = await fetch(`${ADMIN_API}${path}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
      'Cookie': getCookiesFromRequest(request),
    },
  });

  if (!response.ok) {
    throw new Error(`Admin API ${options.method || 'GET'} failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

