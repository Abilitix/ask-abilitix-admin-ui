// Client-safe API helpers for billing endpoints
// These functions can be called from both client and server code
// Follows the same pattern as superadmin.ts

import type {
  Plan,
  PlanListResponse,
  PlanResponse,
  TenantBilling,
  TenantBillingResponse,
  TenantBillingListItem,
  TenantsListResponse,
  Usage,
  UsageResponse,
  Quota,
  QuotaResponse,
  EnforcementSettings,
  EnforcementSettingsResponse,
  ArchivePlanResponse,
  StripeCheckoutPayload,
  StripeCheckoutResponse,
  StripePortalPayload,
  StripePortalResponse,
  CreatePlanPayload,
  UpdatePlanPayload,
  UpdatePlanStatusPayload,
  AssignPlanPayload,
  SetOverridesPayload,
  UpdateTenantStatusPayload,
  UpdateEnforcementSettingsPayload,
  StandardErrorResponse,
} from '@/lib/types/billing';

// Helper to parse error responses
function parseError(response: Response, defaultMessage: string): Error {
  return new Error(
    `Failed: ${response.status} ${response.statusText}. ${defaultMessage}`
  );
}

// Helper to handle API errors consistently
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as StandardErrorResponse;
    const message = errorData.detail?.message || errorData.detail?.error || `Request failed: ${response.status}`;
    throw new Error(message);
  }
  return response.json();
}

// ============================================================================
// Plan Management (SuperAdmin Only)
// ============================================================================

/**
 * List all billing plans
 * @param status Filter by status (optional)
 * @param includeArchived Include archived plans (default: false)
 */
export async function listPlans(
  status?: 'active' | 'archived' | 'draft',
  includeArchived: boolean = false
): Promise<Plan[]> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('include_archived', includeArchived.toString());

  const response = await fetch(`/api/admin/billing/plans?${params}`, {
    cache: 'no-store',
  });

  const data = await handleResponse<PlanListResponse>(response);
  return data.plans;
}

/**
 * Get a single plan by ID
 */
export async function getPlan(planId: string): Promise<Plan> {
  const response = await fetch(`/api/admin/billing/plans/${planId}`, {
    cache: 'no-store',
  });

  const data = await handleResponse<PlanResponse>(response);
  return data.plan;
}

/**
 * Create a new plan
 */
export async function createPlan(payload: CreatePlanPayload): Promise<Plan> {
  const response = await fetch('/api/admin/billing/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const data = await handleResponse<PlanResponse>(response);
  return data.plan;
}

/**
 * Update an existing plan
 */
export async function updatePlan(
  planId: string,
  payload: UpdatePlanPayload
): Promise<Plan> {
  const response = await fetch(`/api/admin/billing/plans/${planId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const data = await handleResponse<PlanResponse>(response);
  return data.plan;
}

/**
 * Archive a plan (soft delete)
 */
export async function archivePlan(planId: string): Promise<ArchivePlanResponse> {
  const response = await fetch(`/api/admin/billing/plans/${planId}`, {
    method: 'DELETE',
    cache: 'no-store',
  });

  return handleResponse<ArchivePlanResponse>(response);
}

/**
 * Update plan status
 */
export async function updatePlanStatus(
  planId: string,
  payload: UpdatePlanStatusPayload
): Promise<Plan> {
  const response = await fetch(`/api/admin/billing/plans/${planId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const data = await handleResponse<PlanResponse>(response);
  return data.plan;
}

// ============================================================================
// Tenant Billing Management (SuperAdmin Only)
// ============================================================================

/**
 * List all tenants with billing information
 * @param page Page number (default: 1)
 * @param limit Results per page (default: 50, max: 200)
 * @param status Filter by tenant status (optional)
 * @param planId Filter by plan ID (optional)
 */
export async function listTenantsWithBilling(
  page: number = 1,
  limit: number = 50,
  status?: 'active' | 'suspended' | 'inactive' | 'expired',
  planId?: string
): Promise<{ tenants: TenantBillingListItem[]; pagination: TenantsListResponse['pagination'] }> {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('limit', Math.min(limit, 200).toString());
  if (status) params.set('status', status);
  if (planId) params.set('plan_id', planId);

  const response = await fetch(`/api/admin/billing/tenants?${params}`, {
    cache: 'no-store',
  });

  const data = await handleResponse<TenantsListResponse>(response);
  
  // Defensive: Ensure we have valid data structure
  if (!data || typeof data !== 'object') {
    console.error('Invalid response structure from /admin/billing/tenants:', data);
    return {
      tenants: [],
      pagination: { page: 1, limit: 50, total: 0, total_pages: 0 },
    };
  }
  
  return {
    tenants: Array.isArray(data.tenants) ? data.tenants : [],
    pagination: data.pagination || { page: 1, limit: 50, total: 0, total_pages: 0 },
  };
}

/**
 * Get tenant billing information
 */
export async function getTenantBilling(tenantId: string): Promise<TenantBilling> {
  const response = await fetch(`/api/admin/billing/tenants/${tenantId}`, {
    cache: 'no-store',
  });

  const data = await handleResponse<TenantBillingResponse>(response);
  return data.tenant_billing;
}

/**
 * Assign a plan to a tenant
 */
export async function assignPlanToTenant(
  tenantId: string,
  payload: AssignPlanPayload
): Promise<TenantBilling> {
  const response = await fetch(`/api/admin/billing/tenants/${tenantId}/plan`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const data = await handleResponse<TenantBillingResponse>(response);
  return data.tenant_billing;
}

/**
 * Set tenant overrides (seats, quota)
 */
export async function setTenantOverrides(
  tenantId: string,
  payload: SetOverridesPayload
): Promise<TenantBilling> {
  const response = await fetch(`/api/admin/billing/tenants/${tenantId}/overrides`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const data = await handleResponse<TenantBillingResponse>(response);
  return data.tenant_billing;
}

/**
 * Get tenant usage for a specific month
 * @param tenantId Tenant ID
 * @param month Month in YYYY-MM format (defaults to current month)
 */
export async function getTenantUsage(
  tenantId: string,
  month?: string
): Promise<Usage> {
  const params = new URLSearchParams();
  if (month) params.set('month', month);

  const response = await fetch(`/api/admin/billing/tenants/${tenantId}/usage?${params}`, {
    cache: 'no-store',
  });

  const data = await handleResponse<UsageResponse>(response);
  return data.usage;
}

/**
 * Get tenant quota information
 */
export async function getTenantQuota(tenantId: string): Promise<Quota> {
  const response = await fetch(`/api/admin/billing/tenants/${tenantId}/quota`, {
    cache: 'no-store',
  });

  const data = await handleResponse<QuotaResponse>(response);
  return data.quota;
}

/**
 * Update tenant status
 */
export async function updateTenantStatus(
  tenantId: string,
  payload: UpdateTenantStatusPayload
): Promise<TenantBilling> {
  const response = await fetch(`/api/admin/billing/tenants/${tenantId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const data = await handleResponse<TenantBillingResponse>(response);
  return data.tenant_billing;
}

// ============================================================================
// Enforcement Settings (SuperAdmin Only)
// ============================================================================

/**
 * Get enforcement settings
 */
export async function getEnforcementSettings(): Promise<EnforcementSettings> {
  const response = await fetch('/api/admin/billing/settings', {
    cache: 'no-store',
  });

  const data = await handleResponse<EnforcementSettingsResponse>(response);
  
  // Debug: Log the actual response to see what we're getting
  console.log('getEnforcementSettings response:', data);
  console.log('payment_grace_period_days from API:', data.payment_grace_period_days);
  
  // Extract fields from response (response has ok, enforcement_mode, payment_grace_period_days)
  // Provide defaults if fields are missing
  return {
    enforcement_mode: data.enforcement_mode ?? 'off',
    payment_grace_period_days: data.payment_grace_period_days ?? 0,
  };
}

/**
 * Update enforcement settings
 */
export async function updateEnforcementSettings(
  payload: UpdateEnforcementSettingsPayload
): Promise<EnforcementSettings> {
  const response = await fetch('/api/admin/billing/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const data = await handleResponse<EnforcementSettingsResponse>(response);
  // Extract fields from response (response has ok, enforcement_mode, payment_grace_period_days)
  // Provide defaults if fields are missing
  return {
    enforcement_mode: data.enforcement_mode ?? 'off',
    payment_grace_period_days: data.payment_grace_period_days ?? 0,
  };
}

// ============================================================================
// Stripe Integration (SuperAdmin Only, if enabled)
// ============================================================================

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(
  payload: StripeCheckoutPayload
): Promise<StripeCheckoutResponse> {
  const response = await fetch('/api/admin/billing/stripe/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  // Handle 501 (Stripe disabled) gracefully
  if (response.status === 501) {
    throw new Error('Online payments are not enabled yet. Please contact support to change plan.');
  }

  return handleResponse<StripeCheckoutResponse>(response);
}

/**
 * Create Stripe portal session
 */
export async function createPortalSession(
  payload: StripePortalPayload
): Promise<StripePortalResponse> {
  const response = await fetch('/api/admin/billing/stripe/create-portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  // Handle 501 (Stripe disabled) gracefully
  if (response.status === 501) {
    throw new Error('Online payments are not enabled yet. Please contact support to change plan.');
  }

  return handleResponse<StripePortalResponse>(response);
}

// ============================================================================
// Tenant Self-Serve Functions (use with session tenant_id)
// ============================================================================

/**
 * Get current tenant's billing information
 * @param tenantId Current tenant ID from session
 */
export async function getMyBilling(tenantId: string): Promise<TenantBilling> {
  return getTenantBilling(tenantId);
}

/**
 * Get current tenant's usage
 * @param tenantId Current tenant ID from session
 * @param month Month in YYYY-MM format (defaults to current month)
 */
export async function getMyUsage(tenantId: string, month?: string): Promise<Usage> {
  return getTenantUsage(tenantId, month);
}

/**
 * Get current tenant's quota
 * @param tenantId Current tenant ID from session
 */
export async function getMyQuota(tenantId: string): Promise<Quota> {
  return getTenantQuota(tenantId);
}

