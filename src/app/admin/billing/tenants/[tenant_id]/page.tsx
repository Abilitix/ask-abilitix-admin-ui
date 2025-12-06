'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Loader2, Users, RefreshCw, ShieldCheck, ArrowLeft, CreditCard, X, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  getTenantBilling,
  getTenantUsage,
  getTenantQuota,
  assignPlanToTenant,
  setTenantOverrides,
  listPlans,
  updateTenantStatus,
} from '@/lib/api/billing';
import type { TenantBilling, Usage, Quota, Plan } from '@/lib/types/billing';

export default function TenantBillingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const tenantId = params?.tenant_id as string;

  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<TenantBilling | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tenantName, setTenantName] = useState<string>('');

  // Form states
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [seatsOverride, setSeatsOverride] = useState<string>('');
  const [quotaOverride, setQuotaOverride] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Load all data
  const loadData = useCallback(async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      
      // Load active plans for dropdown
      const plansData = await listPlans('active');
      setPlans(plansData);

      // Load tenant billing
      const billingData = await getTenantBilling(tenantId);
      setBilling(billingData);
      setSelectedPlanId(billingData.plan_id);
      setSeatsOverride(billingData.max_seats_override?.toString() || '');
      setQuotaOverride(billingData.monthly_token_quota_override?.toString() || '');

      // Load usage (current month)
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const usageData = await getTenantUsage(tenantId, currentMonth).catch(() => null);
      setUsage(usageData);

      // Load quota
      const quotaData = await getTenantQuota(tenantId).catch(() => null);
      setQuota(quotaData);

      // Set tenant name (use tenant_id as fallback)
      setTenantName(`Tenant ${tenantId.slice(0, 8)}`);
    } catch (error: any) {
      console.error('Failed to load tenant billing:', error);
      toast.error(error.message || 'Failed to load tenant billing data');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Check SuperAdmin auth
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) {
          router.push('/signin');
          return;
        }
        const user = await res.json();
        
        const SUPERADMIN_EMAILS = process.env.NEXT_PUBLIC_SUPERADMIN_EMAILS?.split(',') ?? [];
        const isSuperAdmin = SUPERADMIN_EMAILS.includes(user?.email ?? '');
        
        if (!isSuperAdmin) {
          router.push('/admin/docs?error=insufficient_permissions');
          return;
        }
        
        await loadData();
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/signin');
      }
    })();
  }, [router, loadData]);

  // Handle plan assignment
  const handleAssignPlan = async () => {
    if (!selectedPlanId || selectedPlanId === billing?.plan_id) {
      toast.info('No changes to save');
      return;
    }

    try {
      setSaving(true);
      await assignPlanToTenant(tenantId, { plan_id: selectedPlanId });
      toast.success('Plan assigned successfully');
      await loadData();
    } catch (error: any) {
      console.error('Failed to assign plan:', error);
      toast.error(error.message || 'Failed to assign plan');
    } finally {
      setSaving(false);
    }
  };

  // Handle overrides
  const handleSaveOverrides = async () => {
    try {
      setSaving(true);
      const payload: any = {};
      
      if (seatsOverride.trim()) {
        const seats = parseInt(seatsOverride);
        if (isNaN(seats) || seats < 0) {
          toast.error('Seats override must be a positive number');
          return;
        }
        payload.max_seats_override = seats;
      } else {
        payload.max_seats_override = null;
      }

      if (quotaOverride.trim()) {
        const quota = parseInt(quotaOverride);
        if (isNaN(quota) || quota < 0) {
          toast.error('Quota override must be a positive number');
          return;
        }
        payload.monthly_token_quota_override = quota;
      } else {
        payload.monthly_token_quota_override = null;
      }

      await setTenantOverrides(tenantId, payload);
      toast.success('Overrides updated successfully');
      await loadData();
    } catch (error: any) {
      console.error('Failed to update overrides:', error);
      toast.error(error.message || 'Failed to update overrides');
    } finally {
      setSaving(false);
    }
  };

  // Format tokens
  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toLocaleString();
  };

  // Get status badge
  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="outline">No Status</Badge>;
    
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Past Due</Badge>;
      case 'canceled':
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate usage percentage
  const getUsagePercentage = (used: number, total: number) => {
    if (total === 0) return 0;
    return Math.min((used / total) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Loading tenant billing details...</p>
        </div>
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        <div className="text-center py-16">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tenant not found</h3>
          <p className="text-sm text-gray-600 mb-6">This tenant does not have billing information.</p>
          <Button onClick={() => router.push('/admin/billing/tenants')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenants
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/billing/tenants"
              className="h-10 w-10 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-colors flex-shrink-0"
              title="Back to Tenants"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Billing</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage billing for {tenantName || tenantId}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Superadmin
          </Badge>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-gray-200 mt-6">
          <Link
            href="/admin/billing/plans"
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              pathname === '/admin/billing/plans'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <CreditCard className="h-4 w-4 inline mr-2" />
            Plans
          </Link>
          <Link
            href="/admin/billing/tenants"
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              pathname?.startsWith('/admin/billing/tenants')
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Tenants
          </Link>
        </div>
      </div>

      {/* Current Plan Card */}
      <Card className="bg-white rounded-xl border border-gray-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Current Plan</CardTitle>
          <CardDescription>Assign or change the billing plan for this tenant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plan-select">Select Plan</Label>
              <Select
                id="plan-select"
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="min-h-[44px] sm:min-h-0"
              >
                <option value="">Select a plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} ({plan.code})
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAssignPlan}
                disabled={saving || selectedPlanId === billing.plan_id}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white min-h-[44px] sm:min-h-0"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Assign Plan
                  </>
                )}
              </Button>
            </div>
          </div>
          {billing.plan_name && (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Current Plan</div>
                  <div className="font-semibold text-gray-900">{billing.plan_name}</div>
                  <div className="text-xs text-gray-500 mt-1">{billing.plan_code}</div>
                </div>
                {getStatusBadge(billing.stripe_subscription_status)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage & Quota Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Usage Card */}
        <Card className="bg-white rounded-xl border border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Current Month Usage
            </CardTitle>
            <CardDescription>Token and request usage for the current billing period</CardDescription>
          </CardHeader>
          <CardContent>
            {usage ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Tokens Used</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatTokens(usage.tokens_used)}
                    </span>
                  </div>
                  {quota && (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${getUsagePercentage(usage.tokens_used, quota.effective_quota)}%`,
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatTokens(usage.tokens_used)} of {formatTokens(quota.effective_quota)} tokens
                      </div>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <div className="text-xs text-gray-600">Requests</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {usage.requests.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Invites Sent</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {usage.invites_sent.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No usage data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quota Card */}
        <Card className="bg-white rounded-xl border border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Quota & Limits
            </CardTitle>
            <CardDescription>Current quota and seat limits</CardDescription>
          </CardHeader>
          <CardContent>
            {quota ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Token Quota</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatTokens(quota.effective_quota)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${getUsagePercentage(quota.current_usage, quota.effective_quota)}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatTokens(quota.current_usage)} used • {formatTokens(quota.remaining_tokens)} remaining
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Seat Limit</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {quota.effective_seat_cap}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {quota.current_seats} used • {quota.remaining_seats} remaining
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No quota data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overrides Card */}
      <Card className="bg-white rounded-xl border border-gray-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Plan Overrides</CardTitle>
          <CardDescription>
            Override plan limits for this tenant. Leave empty to use plan defaults.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="seats-override">Max Seats Override</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="seats-override"
                  type="number"
                  placeholder="Leave empty for plan default"
                  value={seatsOverride}
                  onChange={(e) => setSeatsOverride(e.target.value)}
                  className="min-h-[44px] sm:min-h-0"
                />
                {seatsOverride && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSeatsOverride('')}
                    className="min-h-[44px] sm:min-h-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {billing.max_seats_override && (
                <p className="text-xs text-gray-500 mt-1">
                  Current: {billing.max_seats_override} seats
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="quota-override">Token Quota Override</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="quota-override"
                  type="number"
                  placeholder="Leave empty for plan default"
                  value={quotaOverride}
                  onChange={(e) => setQuotaOverride(e.target.value)}
                  className="min-h-[44px] sm:min-h-0"
                />
                {quotaOverride && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuotaOverride('')}
                    className="min-h-[44px] sm:min-h-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {billing.monthly_token_quota_override && (
                <p className="text-xs text-gray-500 mt-1">
                  Current: {formatTokens(billing.monthly_token_quota_override)}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button
              onClick={handleSaveOverrides}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white min-h-[44px] sm:min-h-0"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save Overrides
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

