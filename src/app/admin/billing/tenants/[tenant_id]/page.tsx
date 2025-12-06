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
import { Loader2, Users, RefreshCw, ShieldCheck, ArrowLeft, CreditCard, X, CheckCircle2, AlertCircle, TrendingUp, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getTenantBilling,
  getTenantUsage,
  getTenantQuota,
  assignPlanToTenant,
  setTenantOverrides,
  listPlans,
  updateTenantStatus,
  deleteTenant,
  listTenantsWithBilling,
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
  
  // Tenant status management
  const [tenantStatus, setTenantStatus] = useState<'active' | 'suspended' | 'inactive' | 'expired' | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [suspendedReason, setSuspendedReason] = useState('');
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);

  // Delete tenant states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDocuments, setDeleteDocuments] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');

  // Load all data (optimized with parallel requests)
  const loadData = useCallback(async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      
      // Load active plans for dropdown
      const plansPromise = listPlans('active');
      
      // Load tenant billing, usage, and quota in parallel
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const billingPromise = getTenantBilling(tenantId);
      const usagePromise = getTenantUsage(tenantId, currentMonth).catch(() => null);
      const quotaPromise = getTenantQuota(tenantId).catch(() => null);

      // Wait for all requests in parallel
      const [plansData, billingData, usageData, quotaData] = await Promise.all([
        plansPromise,
        billingPromise,
        usagePromise,
        quotaPromise,
      ]);

      // Update state
      setPlans(plansData);
      setBilling(billingData);
      setSelectedPlanId(billingData.plan_id);
      setSeatsOverride(billingData.max_seats_override?.toString() || '');
      setQuotaOverride(billingData.monthly_token_quota_override?.toString() || '');
      setUsage(usageData);
      setQuota(quotaData);

      // Set tenant name (use tenant_id as fallback)
      setTenantName(`Tenant ${tenantId?.slice(0, 8) || 'Unknown'}`);
      
      // Fetch tenant status from tenant list
      try {
        const tenantsData = await listTenantsWithBilling(1, 200);
        const tenant = tenantsData.tenants.find(t => t.tenant_id === tenantId);
        if (tenant) {
          setTenantStatus(tenant.tenant_status);
          setTenantName(tenant.tenant_name || `Tenant ${tenantId?.slice(0, 8) || 'Unknown'}`);
        }
      } catch (statusError) {
        console.warn('Failed to load tenant status:', statusError);
        // Continue without status
      }
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

  // Handle tenant status update
  const handleUpdateStatus = async (newStatus: 'active' | 'suspended' | 'inactive' | 'expired', reason?: string) => {
    try {
      setUpdatingStatus(true);
      await updateTenantStatus(tenantId, {
        status: newStatus,
        suspended_reason: reason,
      });
      toast.success(`Tenant status updated to ${newStatus}`);
      setTenantStatus(newStatus);
      setShowSuspendDialog(false);
      setSuspendedReason('');
      await loadData(); // Refresh all data
    } catch (error: any) {
      console.error('Failed to update tenant status:', error);
      toast.error(error.message || 'Failed to update tenant status');
    } finally {
      setUpdatingStatus(false);
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

  // Format tokens (handle null/undefined)
  const formatTokens = (tokens: number | null | undefined) => {
    if (tokens == null || isNaN(tokens)) return '0';
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

  // Calculate usage percentage (handle null/undefined)
  const getUsagePercentage = (used: number | null | undefined, total: number | null | undefined) => {
    const usedValue = used ?? 0;
    const totalValue = total ?? 0;
    if (totalValue === 0) return 0;
    return Math.min((usedValue / totalValue) * 100, 100);
  };

  // Handle tenant deletion
  const handleDeleteTenant = async () => {
    if (!tenantId) return;

    setIsDeleting(true);
    try {
      const result = await deleteTenant(tenantId, {
        delete_documents: deleteDocuments,
        reason: deletionReason || undefined,
      });

      toast.success(result.message || 'Tenant deleted successfully');
      
      // Redirect to tenant list after successful deletion
      router.push('/admin/billing/tenants');
    } catch (error: any) {
      console.error('Failed to delete tenant:', error);
      toast.error(error.message || 'Failed to delete tenant');
      // Don't close dialog on error - let user try again or cancel
    } finally {
      setIsDeleting(false);
    }
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
                disabled={saving || selectedPlanId === billing?.plan_id || !billing}
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
          {billing?.plan_name && (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Current Plan</div>
                  <div className="font-semibold text-gray-900">{billing?.plan_name}</div>
                  <div className="text-xs text-gray-500 mt-1">{billing?.plan_code}</div>
                </div>
                {getStatusBadge(billing?.stripe_subscription_status)}
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
                      {formatTokens(usage?.tokens_used)}
                    </span>
                  </div>
                  {quota && (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${getUsagePercentage(usage?.tokens_used, quota?.effective_quota)}%`,
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatTokens(usage?.tokens_used)} of {formatTokens(quota?.effective_quota)} tokens
                      </div>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <div className="text-xs text-gray-600">Requests</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {(usage.requests ?? 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Invites Sent</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {(usage.invites_sent ?? 0).toLocaleString()}
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
                      {formatTokens(quota?.effective_quota)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${getUsagePercentage(quota?.current_usage, quota?.effective_quota)}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatTokens(quota?.current_usage)} used • {formatTokens(quota?.remaining_tokens)} remaining
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Seat Limit</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {quota?.effective_seat_cap ?? 0}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {quota?.current_seats ?? 0} used • {quota?.remaining_seats ?? 0} remaining
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
              {billing?.max_seats_override && (
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
              {billing?.monthly_token_quota_override && (
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

      {/* Tenant Status Management */}
      <Card className="bg-white rounded-xl border border-gray-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Tenant Status Management
          </CardTitle>
          <CardDescription>Manage tenant account status and access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-600">Current Status</div>
              <div className="mt-1">
                {tenantStatus ? (
                  <Badge
                    variant={
                      tenantStatus === 'active'
                        ? 'default'
                        : tenantStatus === 'suspended'
                        ? 'destructive'
                        : 'outline'
                    }
                    className="text-sm"
                  >
                    {tenantStatus.charAt(0).toUpperCase() + tenantStatus.slice(1)}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-sm">
                    Unknown
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Status Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-100">
            {tenantStatus !== 'active' && (
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('active')}
                disabled={updatingStatus}
                className="min-h-[44px] sm:min-h-0"
              >
                {updatingStatus ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Activate Tenant
                  </>
                )}
              </Button>
            )}

            {tenantStatus !== 'suspended' && (
              <Button
                variant="outline"
                onClick={() => setShowSuspendDialog(true)}
                disabled={updatingStatus}
                className="min-h-[44px] sm:min-h-0 border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Suspend Tenant
              </Button>
            )}

            {tenantStatus !== 'inactive' && (
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('inactive')}
                disabled={updatingStatus}
                className="min-h-[44px] sm:min-h-0"
              >
                {updatingStatus ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Set Inactive
                  </>
                )}
              </Button>
            )}

            {tenantStatus !== 'expired' && (
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('expired')}
                disabled={updatingStatus}
                className="min-h-[44px] sm:min-h-0"
              >
                {updatingStatus ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Mark Expired
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Suspend Tenant Dialog */}
      {showSuspendDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in-0">
          <Card className="w-full max-w-md mx-4 bg-white shadow-2xl border-0 animate-in zoom-in-95 fade-in-0 slide-in-from-bottom-2">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold text-slate-900 leading-tight">
                    Suspend Tenant
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 mt-1">
                    Suspend this tenant's access to the platform
                  </CardDescription>
                </div>
                {!updatingStatus && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowSuspendDialog(false);
                      setSuspendedReason('');
                    }}
                    className="h-8 w-8 rounded-full hover:bg-slate-100 -mt-1 -mr-1"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-6">
              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="suspend-reason" className="mb-2">
                    Reason for Suspension (optional)
                  </Label>
                  <textarea
                    id="suspend-reason"
                    value={suspendedReason}
                    onChange={(e) => setSuspendedReason(e.target.value)}
                    placeholder="e.g., Payment overdue, Terms violation"
                    disabled={updatingStatus}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSuspendDialog(false);
                    setSuspendedReason('');
                  }}
                  disabled={updatingStatus}
                  className="min-w-[80px] min-h-[44px] sm:min-h-0"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleUpdateStatus('suspended', suspendedReason || undefined)}
                  disabled={updatingStatus}
                  className="min-w-[80px] bg-orange-600 hover:bg-orange-700 text-white min-h-[44px] sm:min-h-0"
                >
                  {updatingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Suspending...
                    </>
                  ) : (
                    'Suspend Tenant'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Danger Zone - Delete Tenant */}
      <Card className="bg-white rounded-xl border-2 border-red-200 shadow-md">
        <CardHeader className="border-b border-red-100">
          <CardTitle className="text-lg font-semibold text-red-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-sm text-red-700">
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Tenant</h3>
              <p className="text-sm text-gray-600 mb-4">
                Permanently delete this tenant and all associated data. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="min-h-[44px] sm:min-h-0"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Tenant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Tenant Confirmation Dialog */}
      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in-0"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              setShowDeleteDialog(false);
              setDeleteDocuments(false);
              setDeletionReason('');
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <Card
            className="w-full max-w-md mx-4 bg-white shadow-2xl border-2 border-red-200 animate-in zoom-in-95 fade-in-0"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="pb-4 border-b border-red-100">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold text-red-900">
                    Delete Tenant
                  </CardTitle>
                </div>
                {!isDeleting && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setDeleteDocuments(false);
                      setDeletionReason('');
                    }}
                    className="h-8 w-8 rounded-full hover:bg-slate-100"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-6">
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                ⚠️ This action cannot be undone. All tenant data will be permanently deleted.
              </p>

              {/* Delete Documents Checkbox */}
              <div className="mb-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="delete-documents"
                    checked={deleteDocuments}
                    onChange={(e) => setDeleteDocuments(e.target.checked)}
                    disabled={isDeleting}
                    className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="delete-documents"
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    <span className="font-medium">Also delete all documents</span>
                    <p className="text-xs text-gray-500 mt-1">
                      This will permanently remove all uploaded documents and files associated with this tenant.
                    </p>
                  </label>
                </div>
              </div>

              {/* Deletion Reason Textarea */}
              <div className="mb-6">
                <label
                  htmlFor="deletion-reason"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Reason for deletion (optional)
                </label>
                <textarea
                  id="deletion-reason"
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder="e.g., Customer requested account closure"
                  disabled={isDeleting}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!isDeleting) {
                      setShowDeleteDialog(false);
                      setDeleteDocuments(false);
                      setDeletionReason('');
                    }
                  }}
                  disabled={isDeleting}
                  className="min-w-[80px] min-h-[44px] sm:min-h-0"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteTenant}
                  disabled={isDeleting}
                  className="min-w-[80px] bg-red-600 hover:bg-red-700 text-white min-h-[44px] sm:min-h-0"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Tenant'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

