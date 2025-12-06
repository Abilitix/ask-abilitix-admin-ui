'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

  const getDescription = () => {
    if (loading) {
      return 'Loading billing information...';
    }
    if (billing && usage && quota) {
      return `${billing.plan_name || 'No plan'} • ${formatTokens(usage.tokens_used)} / ${formatTokens(quota.effective_quota)} tokens used this month`;
    }
    if (billing) {
      return `${billing.plan_name || 'No plan'} • View usage and manage your subscription`;
    }
    return 'Manage your subscription, view usage, and upgrade your plan.';
  };

  return (
    <Card className="mb-8 hover:shadow-md transition-shadow border-blue-100">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-blue-100 rounded-lg flex-shrink-0">
            <CreditCard className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
              Billing & Plan
            </CardTitle>
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