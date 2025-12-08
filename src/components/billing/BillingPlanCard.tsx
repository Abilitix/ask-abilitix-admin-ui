'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { getMyBilling, getMyUsage, getMyQuota } from '@/lib/api/billing';
import type { TenantBilling, Usage, Quota } from '@/lib/types/billing';
import { Badge } from '@/components/ui/badge';

export function BillingPlanCard() {
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<TenantBilling | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [hasError, setHasError] = useState(false);

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

      // Reset error state
      setHasError(false);

      // Fetch billing, usage, and quota in parallel
      // Use tenant self-serve endpoints (session-based auth, no tenant_id parameter)
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const [billingResult, usageResult, quotaResult] = await Promise.allSettled([
        getMyBilling(),
        getMyUsage(currentMonth),
        getMyQuota(),
      ]);

      // Handle results
      if (billingResult.status === 'fulfilled') {
        setBilling(billingResult.value);
      } else {
        console.error('Failed to load billing data:', billingResult.reason);
        setBilling(null);
        setHasError(true);
      }

      if (usageResult.status === 'fulfilled') {
        setUsage(usageResult.value);
      } else {
        console.error('Failed to load usage data:', usageResult.reason);
        setUsage(null);
      }

      if (quotaResult.status === 'fulfilled') {
        setQuota(quotaResult.value);
      } else {
        console.error('Failed to load quota data:', quotaResult.reason);
        setQuota(null);
      }
    } catch (error) {
      console.error('Failed to load billing data:', error);
      setHasError(true);
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

  const getQuotaWarningLevel = () => {
    if (!usage || !quota || quota.effective_quota === 0) return null;
    const percentage = getUsagePercentage(usage.tokens_used, quota.effective_quota);
    if (percentage >= 100) return 'critical';
    if (percentage >= 90) return 'high';
    if (percentage >= 80) return 'medium';
    return null;
  };

  const getDescription = () => {
    if (loading) {
      return 'Loading billing information...';
    }
    if (hasError) {
      return 'Unable to load billing information. Please contact support if this persists.';
    }
    if (billing && usage && quota) {
      const percentage = getUsagePercentage(usage.tokens_used, quota.effective_quota);
      return `${billing.plan_name || 'No plan'} • ${formatTokens(usage.tokens_used)} / ${formatTokens(quota.effective_quota)} tokens (${percentage}%)`;
    }
    if (billing) {
      return `${billing.plan_name || 'No plan'} • View usage and manage your subscription`;
    }
    return 'Manage your subscription, view usage, and upgrade your plan.';
  };

  const warningLevel = getQuotaWarningLevel();

  return (
    <Card className="mb-8 hover:shadow-md transition-shadow border-blue-100">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-blue-100 rounded-lg flex-shrink-0">
            <CreditCard className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Billing & Plan
              </CardTitle>
              {warningLevel && (
                <Badge
                  variant={warningLevel === 'critical' ? 'destructive' : warningLevel === 'high' ? 'destructive' : 'outline'}
                  className={`text-xs ${
                    warningLevel === 'critical'
                      ? 'bg-red-100 text-red-700 border-red-300'
                      : warningLevel === 'high'
                      ? 'bg-orange-100 text-orange-700 border-orange-300'
                      : 'bg-amber-100 text-amber-700 border-amber-300'
                  }`}
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {warningLevel === 'critical' ? 'Quota Exceeded' : warningLevel === 'high' ? 'Quota High' : 'Quota Warning'}
                </Badge>
              )}
            </div>
            <CardDescription className="text-sm text-gray-600 mt-1">
              {getDescription()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Link href="/admin/settings/billing">
          <Button 
            variant="default" 
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Manage Billing
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}