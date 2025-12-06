'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getTenantBilling, getTenantUsage, getTenantQuota } from '@/lib/api/billing';
import type { TenantBilling, Usage, Quota } from '@/lib/types/billing';

export function BillingPlanCard() {
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<TenantBilling | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      // Get tenant ID from auth
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!authRes.ok) return;
      
      const authData = await authRes.json();
      const tenantId = authData.tenant_id;
      if (!tenantId) return;

      // Fetch billing, usage, and quota in parallel
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const [billingData, usageData, quotaData] = await Promise.all([
        getTenantBilling(tenantId).catch(() => null),
        getTenantUsage(tenantId, currentMonth).catch(() => null),
        getTenantQuota(tenantId).catch(() => null),
      ]);

      setBilling(billingData);
      setUsage(usageData);
      setQuota(quotaData);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTokens = (tokens: number | null | undefined) => {
    if (tokens == null || isNaN(tokens)) return '0';
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toLocaleString();
  };

  const getUsagePercentage = (used: number | null | undefined, total: number | null | undefined) => {
    if (!used || !total || total === 0) return 0;
    return Math.min(100, Math.round((used / total) * 100));
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          Billing & Plan
        </CardTitle>
        <CardDescription>
          Manage your subscription, view usage, and upgrade your plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : billing ? (
          <div className="space-y-4">
            {/* Current Plan */}
            <div>
              <div className="text-sm text-gray-600 mb-1">Current Plan</div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold text-gray-900">
                  {billing.plan_name || 'No Plan'}
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
                    className="text-xs"
                  >
                    {billing.stripe_subscription_status}
                  </Badge>
                )}
              </div>
              {billing.plan_code && (
                <div className="text-xs text-gray-500 mt-1">{billing.plan_code}</div>
              )}
            </div>

            {/* Usage Summary */}
            {usage && quota && (
              <div>
                <div className="text-sm text-gray-600 mb-2">Usage This Month</div>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">Tokens</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatTokens(usage.tokens_used)} / {formatTokens(quota.effective_quota)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
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
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="text-xs text-gray-600">Requests</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {(usage.requests ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Seats Used</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {quota.current_seats ?? 0} / {quota.effective_seat_cap ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Manage Billing Button */}
            <Button asChild className="w-full min-h-[44px] sm:min-h-0 bg-blue-600 hover:bg-blue-700">
              <Link href="/admin/settings/billing">
                Manage Billing
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 mb-4">Unable to load billing information</p>
            <Button asChild variant="outline" className="min-h-[44px] sm:min-h-0">
              <Link href="/admin/settings/billing">
                View Billing
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

