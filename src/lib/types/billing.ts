// TypeScript interfaces for Billing System
// All response models from Admin API billing endpoints

export interface Plan {
  id: string; // UUID
  code: string; // Unique identifier
  name: string;
  description?: string;
  status: 'active' | 'archived' | 'draft';
  max_seats: number;
  monthly_token_quota: number;
  features: Record<string, any>; // JSONB object
  stripe_product_id?: string;
  stripe_price_id_monthly?: string;
  stripe_price_id_annual?: string;
  price_monthly_cents?: number;
  price_annual_cents?: number;
  display_order: number;
  is_popular: boolean;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

export interface TenantBilling {
  tenant_id: string; // UUID
  plan_id: string; // UUID
  plan_code: string;
  plan_name: string;
  max_seats_override?: number;
  monthly_token_quota_override?: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_subscription_status?: string; // "active", "past_due", "canceled", etc.
  payment_overdue_since?: string; // ISO 8601 (PR-B10)
  period_start: string; // ISO 8601
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

export interface Usage {
  tenant_id: string; // UUID
  month: string; // YYYY-MM-01
  tokens_used: number;
  requests: number;
  invites_sent: number;
  last_updated_at: string; // ISO 8601
}

export interface Quota {
  tenant_id: string; // UUID
  effective_quota: number;
  effective_seat_cap: number;
  current_usage: number;
  remaining_tokens: number;
  current_seats: number;
  remaining_seats: number;
}

export interface EnforcementSettings {
  enforcement_mode: 'hard' | 'soft' | 'off';
  payment_grace_period_days: number;
}

export interface PlanListResponse {
  ok: boolean;
  plans: Plan[];
}

export interface PlanResponse {
  ok: boolean;
  plan: Plan;
}

export interface TenantBillingResponse {
  ok: boolean;
  tenant_billing: TenantBilling;
}

export interface UsageResponse {
  ok: boolean;
  usage: Usage;
}

export interface QuotaResponse {
  ok: boolean;
  quota: Quota;
}

export interface EnforcementSettingsResponse {
  ok: boolean;
  enforcement_mode: 'hard' | 'soft' | 'off';
  payment_grace_period_days: number;
}

export interface ArchivePlanResponse {
  ok: boolean;
  plan_id: string;
  status: 'archived';
  tenants_using: number;
  warning?: string;
}

export interface StripeCheckoutPayload {
  tenant_id: string;
  plan_id: string;
  success_url: string;
  cancel_url: string;
  mode: 'subscription' | 'payment';
  customer_email?: string;
}

export interface StripePortalPayload {
  tenant_id: string;
  return_url: string;
}

export interface StripeCheckoutResponse {
  ok: boolean;
  checkout_url: string;
}

export interface StripePortalResponse {
  ok: boolean;
  portal_url: string;
}

export interface CreatePlanPayload {
  code: string;
  name: string;
  description?: string;
  max_seats: number;
  monthly_token_quota: number;
  features?: Record<string, any>;
  stripe_product_id?: string;
  stripe_price_id_monthly?: string;
  stripe_price_id_annual?: string;
  price_monthly_cents?: number;
  price_annual_cents?: number;
  display_order?: number;
  is_popular?: boolean;
}

export interface UpdatePlanPayload {
  name?: string;
  description?: string;
  max_seats?: number;
  monthly_token_quota?: number;
  features?: Record<string, any>;
  stripe_product_id?: string;
  stripe_price_id_monthly?: string;
  stripe_price_id_annual?: string;
  price_monthly_cents?: number;
  price_annual_cents?: number;
  display_order?: number;
  is_popular?: boolean;
}

export interface UpdatePlanStatusPayload {
  status: 'active' | 'archived' | 'draft';
}

export interface AssignPlanPayload {
  plan_id: string;
}

export interface SetOverridesPayload {
  max_seats_override?: number | null;
  monthly_token_quota_override?: number | null;
}

export interface UpdateTenantStatusPayload {
  status: 'active' | 'suspended' | 'inactive' | 'expired';
  suspended_reason?: string;
}

export interface UpdateEnforcementSettingsPayload {
  enforcement_mode: 'hard' | 'soft' | 'off';
  payment_grace_period_days?: number;
}

// Tenant list response from GET /admin/billing/tenants
export interface TenantBillingListItem {
  tenant_id: string; // UUID
  tenant_name: string;
  tenant_slug: string;
  tenant_status: 'active' | 'suspended' | 'inactive' | 'expired';
  suspended_at?: string | null; // ISO 8601
  suspended_reason?: string | null;
  tenant_created_at: string; // ISO 8601
  plan_id: string; // UUID
  plan_code: string;
  plan_name: string;
  max_seats: number;
  monthly_token_quota: number;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_subscription_status?: string | null;
  payment_overdue_since?: string | null; // ISO 8601
  tokens_used: number;
  requests: number;
  seats_used: number;
}

export interface TenantsListResponse {
  ok: boolean;
  tenants: TenantBillingListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface StandardErrorResponse {
  detail: {
    error: string;
    message: string;
    code?: string;
  };
}

