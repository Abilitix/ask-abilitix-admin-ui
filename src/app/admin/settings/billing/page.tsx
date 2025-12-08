'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Loader2, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  getMyBilling,
  getMyUsage,
  getMyQuota,
  getMyPlans,
  createCheckoutSession,
  createPortalSession,
} from '@/lib/api/billing';
import type { TenantBilling, Usage, Quota, Plan } from '@/lib/types/billing';
import { UsageCharts } from '@/components/billing/UsageCharts';
import { ContactSupportModal } from '@/components/billing/ContactSupportModal';

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<TenantBilling | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [tenantName, setTenantName] = useState<string | undefined>(undefined);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get current user and tenant ID
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!authRes.ok) {
        router.push('/signin');
        return;
      }

      const authData = await authRes.json();
      const userRole = authData.role;
      const tId = authData.tenant_id;

      // Check if user is Owner/Admin
      if (!['owner', 'admin'].includes(userRole)) {
        toast.error('Only owners and admins can access billing');
        router.push('/admin/settings');
        return;
      }

      setCurrentUser({ role: userRole });
      setTenantId(tId);

      if (!tId) {
        setLoading(false);
        return;
      }

      // Reset error states
      setBillingError(null);
      setUsageError(null);
      setQuotaError(null);

      // Fetch billing, usage, quota, and plans in parallel
      // Use tenant self-serve endpoints (session-based auth, no tenant_id parameter)
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const [billingResult, usageResult, quotaResult, plansResult] = await Promise.allSettled([
        getMyBilling(),
        getMyUsage(currentMonth),
        getMyQuota(),
        getMyPlans(),
      ]);

      // Handle billing data
      if (billingResult.status === 'fulfilled') {
        setBilling(billingResult.value);
      } else {
        console.error('Failed to load billing data:', billingResult.reason);
        setBillingError('Unable to load billing information. Please contact support if this persists.');
        setBilling(null);
      }

      // Handle usage data
      if (usageResult.status === 'fulfilled') {
        setUsage(usageResult.value);
      } else {
        console.error('Failed to load usage data:', usageResult.reason);
        setUsageError('Unable to load usage data.');
        setUsage(null);
      }

      // Handle quota data
      if (quotaResult.status === 'fulfilled') {
        setQuota(quotaResult.value);
      } else {
        console.error('Failed to load quota data:', quotaResult.reason);
        setQuotaError('Unable to load quota information.');
        setQuota(null);
      }

      // Handle plans data
      if (plansResult.status === 'fulfilled') {
        setPlans(plansResult.value);
      } else {
        console.error('Failed to load plans:', plansResult.reason);
        setPlans([]);
        // Don't show error toast for plans - it's not critical
      }
    } catch (error: any) {
      console.error('Failed to load billing data:', error);
      toast.error('Failed to load billing information. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: Plan) => {
    if (!tenantId) return;

    // If plan has Stripe price ID, use Stripe checkout
    if (plan.stripe_price_id_monthly) {
      try {
        setProcessingCheckout(true);
        const result = await createCheckoutSession({
          tenant_id: tenantId,
          plan_id: plan.id,
          success_url: `${window.location.origin}/admin/settings/billing?success=true`,
          cancel_url: `${window.location.origin}/admin/settings/billing?canceled=true`,
          mode: 'subscription',
        });

        // Redirect to Stripe Checkout
        window.location.href = result.checkout_url;
      } catch (error: any) {
        console.error('Checkout failed:', error);
        toast.error(error.message || 'Failed to start checkout. Please contact support.');
        setProcessingCheckout(false);
      }
    } else {
      // Manual plan - open contact modal
      setSelectedPlan(plan);
      setContactModalOpen(true);
    }
  };

  const handleManageSubscription = async () => {
    if (!tenantId) return;

    try {
      setProcessingCheckout(true);
      const result = await createPortalSession({
        tenant_id: tenantId,
        return_url: `${window.location.origin}/admin/settings/billing`,
      });

      // Redirect to Stripe Customer Portal
      window.location.href = result.portal_url;
    } catch (error: any) {
      console.error('Portal failed:', error);
      toast.error(error.message || 'Failed to open customer portal. Please contact support.');
      setProcessingCheckout(false);
    }
  };

  const formatTokens = (tokens: number | null | undefined) => {
    if (tokens == null || isNaN(tokens)) return '0';
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toLocaleString();
  };

  const formatPrice = (cents?: number) => {
    if (!cents) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getUsagePercentage = (used: number | null | undefined, total: number | null | undefined) => {
    if (!used || !total || total === 0) return 0;
    return Math.min(100, Math.round((used / total) * 100));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Billing & Plan</h1>
        </div>
        <p className="text-sm text-gray-600">
          Manage your subscription, view usage, and upgrade your plan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Current Plan & Usage */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Plan Card */}
          <Card className="bg-white rounded-xl border border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Current Plan
              </CardTitle>
              <CardDescription>Your active subscription and billing details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {billingError ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-amber-900 mb-1">
                        Billing Information Unavailable
                      </div>
                      <div className="text-sm text-amber-700">{billingError}</div>
                    </div>
                  </div>
                </div>
              ) : billing ? (
                <>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Plan Name</div>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold text-gray-900">
                        {billing.plan_name || 'No Plan Assigned'}
                      </div>
                      {billing.stripe_subscription_status && (
                        <Badge
                          variant={
                            billing.stripe_subscription_status === 'active'
                              ? 'default'
                              : billing.stripe_subscription_status === 'past_due'
                              ? 'destructive'
                              : 'outline'
                          }
                          className="text-sm"
                        >
                          {billing.stripe_subscription_status}
                        </Badge>
                      )}
                    </div>
                    {billing.plan_code && (
                      <div className="text-sm text-gray-500 mt-1">{billing.plan_code}</div>
                    )}
                  </div>

                  {billing.stripe_subscription_id && (
                    <div className="pt-4 border-t border-gray-100">
                      <Button
                        onClick={handleManageSubscription}
                        disabled={processingCheckout}
                        variant="outline"
                        className="w-full min-h-[44px] sm:min-h-0"
                      >
                        {processingCheckout ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Opening...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Manage Subscription
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No billing information available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Card */}
          <Card className="bg-white rounded-xl border border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Usage This Month
              </CardTitle>
              <CardDescription>Token and request usage for the current billing period</CardDescription>
            </CardHeader>
            <CardContent>
              {usageError || quotaError ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-amber-900 mb-1">
                        Usage Data Unavailable
                      </div>
                      <div className="text-sm text-amber-700">
                        {usageError || quotaError || 'Unable to load usage information.'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : usage && quota ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Tokens Used</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatTokens(usage.tokens_used)} / {formatTokens(quota.effective_quota)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          getUsagePercentage(usage.tokens_used, quota.effective_quota) >= 90
                            ? 'bg-red-500'
                            : getUsagePercentage(usage.tokens_used, quota.effective_quota) >= 75
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                        }`}
                        style={{
                          width: `${getUsagePercentage(usage.tokens_used, quota.effective_quota)}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getUsagePercentage(usage.tokens_used, quota.effective_quota)}% of quota used
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <div className="text-xs text-gray-600">Requests</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {(usage.requests ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Seats Used</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {quota.current_seats ?? 0} / {quota.effective_seat_cap ?? 0}
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

          {/* Usage Analytics Charts */}
          {tenantId && (
            <UsageCharts 
              quota={quota?.effective_quota}
            />
          )}
        </div>

        {/* Right Column: Available Plans */}
        <div className="space-y-6">
          <Card className="bg-white rounded-xl border border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Available Plans</CardTitle>
              <CardDescription>Upgrade or change your plan</CardDescription>
            </CardHeader>
            <CardContent>
              {plans.length > 0 ? (
                <div className="space-y-3">
                  {plans.map((plan) => {
                    const isCurrentPlan = billing?.plan_id === plan.id;
                    const hasStripe = !!plan.stripe_price_id_monthly;

                    return (
                      <div
                        key={plan.id}
                        className={`p-4 rounded-lg border-2 ${
                          isCurrentPlan
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-gray-900">{plan.name}</div>
                              {plan.is_popular && (
                                <Badge variant="default" className="text-xs">
                                  Popular
                                </Badge>
                              )}
                              {isCurrentPlan && (
                                <Badge variant="outline" className="text-xs">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">{plan.description}</div>
                          </div>
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                              {formatPrice(plan.price_monthly_cents)}
                            </span>
                            <span className="text-sm text-gray-600">/month</span>
                          </div>
                          {plan.price_annual_cents && plan.price_annual_cents > 0 && (
                            <div className="text-xs text-gray-500">
                              or {formatPrice(plan.price_annual_cents)}/year
                            </div>
                          )}
                        </div>
                        <div className="mt-3 text-xs text-gray-600 space-y-1">
                          <div>• {plan.max_seats} seats</div>
                          <div>• {formatTokens(plan.monthly_token_quota)} tokens/month</div>
                        </div>
                        {!isCurrentPlan && (
                          <Button
                            onClick={() => handleUpgrade(plan)}
                            disabled={processingCheckout}
                            className={`w-full mt-4 min-h-[44px] sm:min-h-0 ${
                              hasStripe
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-gray-600 hover:bg-gray-700'
                            }`}
                          >
                            {processingCheckout ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : hasStripe ? (
                              'Upgrade Now'
                            ) : (
                              'Contact Us'
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No plans available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Support Modal */}
      <ContactSupportModal
        open={contactModalOpen}
        onClose={() => {
          setContactModalOpen(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        tenantName={tenantName}
      />
    </div>
  );
}

