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
  DeleteTenantRequest,
  DeleteTenantResponse,
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
 * Uses PATCH /admin/billing/plans/{plan_id}/status endpoint
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
  // Ensure we always return a valid TenantBilling object
  if (!data.tenant_billing) {
    throw new Error('Tenant billing data not found in response');
  }
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
  // Ensure we always return a valid Usage object, even if response structure is unexpected
  return data.usage || {
    tenant_id: tenantId,
    month: month || new Date().toISOString().slice(0, 7),
    tokens_used: 0,
    requests: 0,
    invites_sent: 0,
    last_updated_at: new Date().toISOString(),
  };
}

/**
 * Get tenant quota information
 */
export async function getTenantQuota(tenantId: string): Promise<Quota> {
  const response = await fetch(`/api/admin/billing/tenants/${tenantId}/quota`, {
    cache: 'no-store',
  });

  const data = await handleResponse<QuotaResponse>(response);
  // Ensure we always return a valid Quota object, even if response structure is unexpected
  return data.quota || {
    tenant_id: tenantId,
    effective_quota: 0,
    effective_seat_cap: 0,
    current_usage: 0,
    remaining_tokens: 0,
    current_seats: 0,
    remaining_seats: 0,
  };
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
// Tenant Self-Serve Endpoints (Session-based auth, no tenant_id parameter)
// ============================================================================

/**
 * Get current tenant's billing information (tenant self-serve)
 * Uses session-based authentication - tenant_id comes from session
 */
export async function getMyBilling(): Promise<TenantBilling> {
  const response = await fetch(`/api/admin/billing/me`, {
    cache: 'no-store',
  });

  const data = await handleResponse<TenantBillingResponse>(response);
  // Ensure we always return a valid TenantBilling object
  if (!data.tenant_billing) {
    throw new Error('Tenant billing data not found in response');
  }
  return data.tenant_billing;
}

/**
 * Get current tenant's usage for a specific month (tenant self-serve)
 * Uses session-based authentication - tenant_id comes from session
 * @param month Month in YYYY-MM format (defaults to current month)
 * @param includeHistory Optional: include historical data
 */
export async function getMyUsage(
  month?: string,
  includeHistory?: boolean
): Promise<Usage> {
  const params = new URLSearchParams();
  if (month) params.set('month', month);
  if (includeHistory !== undefined) params.set('include_history', includeHistory.toString());

  const response = await fetch(`/api/admin/billing/me/usage?${params}`, {
    cache: 'no-store',
  });

  const data = await handleResponse<UsageResponse>(response);
  // Ensure we always return a valid Usage object, even if response structure is unexpected
  return data.usage || {
    tenant_id: '', // Will be populated from session
    month: month || new Date().toISOString().slice(0, 7),
    tokens_used: 0,
    requests: 0,
    invites_sent: 0,
    last_updated_at: new Date().toISOString(),
  };
}

/**
 * Get current tenant's quota information (tenant self-serve)
 * Uses session-based authentication - tenant_id comes from session
 */
export async function getMyQuota(): Promise<Quota> {
  const response = await fetch(`/api/admin/billing/me/quota`, {
    cache: 'no-store',
  });

  const data = await handleResponse<any>(response);
  
  // Handle both nested structure (expected) and flat structure (actual backend response)
  if (data.quota && typeof data.quota === 'object') {
    // Nested structure: { ok: true, quota: { effective_quota: ..., ... } }
    return data.quota;
  } else {
    // Flat structure: { ok: true, quota: 1000000, used: 0, remaining: 1000000, max_seats: 5, ... }
    // Map flat structure to nested Quota object
    const effectiveQuota = typeof data.quota === 'number' ? data.quota : (data.effective_quota || 0);
    const effectiveSeatCap = data.max_seats || data.effective_seat_cap || 0;
    const currentUsage = data.used !== undefined ? data.used : (data.current_usage || 0);
    const remainingTokens = data.remaining !== undefined ? data.remaining : (data.remaining_tokens || 0);
    // Try multiple possible field names for current_seats
    const currentSeats = data.current_seats !== undefined 
      ? data.current_seats 
      : (data.seats_used !== undefined 
          ? data.seats_used 
          : (data.seats || 0));
    
    // Log for debugging (remove in production if needed)
    if (process.env.NODE_ENV === 'development') {
      console.log('[getMyQuota] Backend response:', data);
      console.log('[getMyQuota] Mapped quota:', {
        effective_quota: effectiveQuota,
        effective_seat_cap: effectiveSeatCap,
        current_usage: currentUsage,
        remaining_tokens: remainingTokens,
        current_seats: currentSeats,
      });
    }
    
    return {
      tenant_id: '', // Will be populated from session
      effective_quota: effectiveQuota,
      effective_seat_cap: effectiveSeatCap,
      current_usage: currentUsage,
      remaining_tokens: remainingTokens,
      current_seats: currentSeats,
      remaining_seats: Math.max(0, effectiveSeatCap - currentSeats),
    };
  }
  
  // Fallback to empty quota if structure is completely unexpected
  return {
    tenant_id: '', // Will be populated from session
    effective_quota: 0,
    effective_seat_cap: 0,
    current_usage: 0,
    remaining_tokens: 0,
    current_seats: 0,
    remaining_seats: 0,
  };
}

/**
 * Get current tenant's available plans for upgrade (tenant self-serve)
 * Uses session-based authentication - tenant_id comes from session
 * Returns only active plans
 */
export async function getMyPlans(): Promise<Plan[]> {
  const response = await fetch(`/api/admin/billing/me/plans`, {
    cache: 'no-store',
  });

  const data = await handleResponse<PlanListResponse>(response);
  return data.plans || [];
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
  console.log('getEnforcementSettings raw response:', JSON.stringify(data, null, 2));
  console.log('payment_grace_period_days type:', typeof data.payment_grace_period_days);
  console.log('payment_grace_period_days value:', data.payment_grace_period_days);
  
  // Extract fields from response (response has ok, enforcement_mode, payment_grace_period_days)
  // Handle both null/undefined and ensure we preserve 0 as a valid value
  const gracePeriod = data.payment_grace_period_days;
  const gracePeriodValue = (gracePeriod === null || gracePeriod === undefined) ? 0 : Number(gracePeriod);
  
  console.log('Final grace period value:', gracePeriodValue);
  
  return {
    enforcement_mode: data.enforcement_mode ?? 'off',
    payment_grace_period_days: gracePeriodValue,
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
  
  // Debug: Log the actual response to see what we're getting back after save
  console.log('updateEnforcementSettings raw response:', JSON.stringify(data, null, 2));
  console.log('payment_grace_period_days after save:', data.payment_grace_period_days);
  
  // Extract fields from response (response has ok, enforcement_mode, payment_grace_period_days)
  // Handle both null/undefined and ensure we preserve 0 as a valid value
  // If API returns null/undefined, use the value we sent (it should have been saved)
  const gracePeriod = data.payment_grace_period_days;
  const gracePeriodValue = (gracePeriod === null || gracePeriod === undefined) 
    ? payload.payment_grace_period_days ?? 0 
    : Number(gracePeriod);
  
  console.log('Final grace period value after save:', gracePeriodValue);
  
  return {
    enforcement_mode: data.enforcement_mode ?? payload.enforcement_mode ?? 'off',
    payment_grace_period_days: gracePeriodValue,
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
// Tenant Deletion (SuperAdmin Only)
// ============================================================================

/**
 * Delete a tenant completely (SuperAdmin only)
 * @param tenantId Tenant ID to delete
 * @param options Deletion options (delete_documents, reason)
 */
export async function deleteTenant(
  tenantId: string,
  options: DeleteTenantRequest = {}
): Promise<DeleteTenantResponse> {
  const response = await fetch(`/api/admin/tenants/${tenantId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      delete_documents: options.delete_documents || false,
      reason: options.reason || null,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as StandardErrorResponse;
    const message = errorData.detail?.message || errorData.detail?.error || `Delete failed: ${response.status}`;
    throw new Error(message);
  }

  return handleResponse<DeleteTenantResponse>(response);
}


