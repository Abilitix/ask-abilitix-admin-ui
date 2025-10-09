// Client-safe API helpers for superadmin endpoints
// These functions can be called from both client and server code

export type MetricsSummary = {
  calls: number;
  in_tokens: number;
  out_tokens: number;
  no_store_pct: number;
  p95_latency_ms: number;
  violations_count: number;
};

export type TenantMetrics = {
  tenant_id: string;
  calls: number;
  tokens: number;
  p95_ms: number;
};

export type Violation = {
  ts: string;
  tenant_id: string;
  route: string;
  kind: string;
  model: string;
  latency_ms: number;
  violations: string[];
};

export type Budget = {
  tenant_id: string;
  date: string;
  cap: number;
  used: number;
  allowed: boolean;
  used_pct: number;
};

export type RollupResponse = {
  ok: boolean;
  date: string;
  rows_upserted: number;
  warning?: string;
};

// Helper to format date for API calls (Sydney timezone)
export function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Helper to get today's date in Sydney timezone
export function getTodaySydney(): Date {
  const now = new Date();
  // Convert to Sydney timezone (UTC+10/+11)
  const sydneyTime = new Date(now.toLocaleString("en-US", {timeZone: "Australia/Sydney"}));
  return sydneyTime;
}

// Helper to get date range for last 24h
export function getLast24Hours(): { from: string; to: string } {
  const now = getTodaySydney();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  return {
    from: formatDateForAPI(yesterday),
    to: formatDateForAPI(now)
  };
}

// Fetch metrics summary
export async function fetchMetricsSummary(from?: string, to?: string): Promise<MetricsSummary> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  
  const response = await fetch(`/api/superadmin/metrics/summary?${params}`, {
    cache: 'no-store',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: { error: 'service_unavailable', reason: 'Unknown error' } }));
    throw new Error(error.detail?.reason || `Failed to fetch metrics: ${response.status}`);
  }
  
  return response.json();
}

// Fetch tenant metrics
export async function fetchTenantMetrics(from?: string, to?: string, limit: number = 100): Promise<TenantMetrics[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  params.set('limit', limit.toString());
  
  const response = await fetch(`/api/superadmin/metrics/tenants?${params}`, {
    cache: 'no-store',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: { error: 'service_unavailable', reason: 'Unknown error' } }));
    throw new Error(error.detail?.reason || `Failed to fetch tenant metrics: ${response.status}`);
  }
  
  return response.json();
}

// Fetch violations
export async function fetchViolations(
  from?: string, 
  to?: string, 
  tenantId?: string, 
  limit: number = 25, 
  offset: number = 0
): Promise<Violation[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (tenantId) params.set('tenant_id', tenantId);
  params.set('limit', limit.toString());
  params.set('offset', offset.toString());
  
  const response = await fetch(`/api/superadmin/violations?${params}`, {
    cache: 'no-store',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: { error: 'service_unavailable', reason: 'Unknown error' } }));
    throw new Error(error.detail?.reason || `Failed to fetch violations: ${response.status}`);
  }
  
  return response.json();
}

// Fetch today's budgets
export async function fetchBudgetsToday(): Promise<Budget[]> {
  const response = await fetch('/api/superadmin/budgets/today', {
    cache: 'no-store',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: { error: 'service_unavailable', reason: 'Unknown error' } }));
    throw new Error(error.detail?.reason || `Failed to fetch budgets: ${response.status}`);
  }
  
  return response.json();
}

// Run daily rollup
export async function runDailyRollup(date: string): Promise<RollupResponse> {
  const response = await fetch(`/api/superadmin/metrics/rollup?date=${date}`, {
    method: 'POST',
    cache: 'no-store',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: { error: 'service_unavailable', reason: 'Unknown error' } }));
    throw new Error(error.detail?.reason || `Failed to run rollup: ${response.status}`);
  }
  
  return response.json();
}

// Batch fetch all KPIs for governance page
export async function fetchGovernanceKPIs(from?: string, to?: string) {
  const [summary, tenants, violations, budgets] = await Promise.allSettled([
    fetchMetricsSummary(from, to),
    fetchTenantMetrics(from, to, 20),
    fetchViolations(from, to, undefined, 25, 0),
    fetchBudgetsToday()
  ]);

  return {
    summary: summary.status === 'fulfilled' ? summary.value : null,
    tenants: tenants.status === 'fulfilled' ? tenants.value : [],
    violations: violations.status === 'fulfilled' ? violations.value : [],
    budgets: budgets.status === 'fulfilled' ? budgets.value : [],
    errors: {
      summary: summary.status === 'rejected' ? summary.reason.message : null,
      tenants: tenants.status === 'rejected' ? tenants.reason.message : null,
      violations: violations.status === 'rejected' ? violations.reason.message : null,
      budgets: budgets.status === 'rejected' ? budgets.reason.message : null,
    }
  };
}
