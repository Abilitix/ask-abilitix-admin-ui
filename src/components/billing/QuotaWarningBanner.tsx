'use client';

import { AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Usage, Quota, Plan } from '@/lib/types/billing';
import Link from 'next/link';

interface QuotaWarningBannerProps {
  usage: Usage | null;
  quota: Quota | null;
  plans: Plan[];
  onUpgradeClick?: () => void;
}

export function QuotaWarningBanner({ usage, quota, plans, onUpgradeClick }: QuotaWarningBannerProps) {
  if (!usage || !quota || quota.effective_quota === 0) {
    return null;
  }

  const usagePercentage = Math.min(100, Math.round((usage.tokens_used / quota.effective_quota) * 100));
  const remainingTokens = quota.remaining_tokens;
  const remainingPercentage = Math.max(0, 100 - usagePercentage);

  // Determine warning level
  const getWarningLevel = () => {
    if (usagePercentage >= 100) return 'critical'; // 100% - Critical
    if (usagePercentage >= 90) return 'high'; // 90-99% - High
    if (usagePercentage >= 80) return 'medium'; // 80-89% - Medium
    return null; // No warning
  };

  const warningLevel = getWarningLevel();
  if (!warningLevel) return null;

  // Get next available plan for upgrade suggestion
  const currentQuota = quota.effective_quota;
  const nextPlan = plans
    .filter((p) => p.status === 'active' && p.monthly_token_quota > currentQuota)
    .sort((a, b) => a.monthly_token_quota - b.monthly_token_quota)[0];

  // Warning configurations
  const warningConfig = {
    critical: {
      title: 'Quota Exceeded',
      message: 'You have exceeded your monthly token quota. Upgrade your plan to continue using Abilitix.',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      textColor: 'text-red-900',
      subtextColor: 'text-red-700',
      showUpgrade: true,
    },
    high: {
      title: 'Quota Almost Full',
      message: `You've used ${usagePercentage}% of your monthly token quota. Consider upgrading to avoid service interruption.`,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-900',
      subtextColor: 'text-orange-700',
      showUpgrade: true,
    },
    medium: {
      title: 'Quota Usage High',
      message: `You've used ${usagePercentage}% of your monthly token quota. ${remainingTokens.toLocaleString()} tokens remaining.`,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600',
      textColor: 'text-amber-900',
      subtextColor: 'text-amber-700',
      showUpgrade: nextPlan ? true : false,
    },
  };

  const config = warningConfig[warningLevel];

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-2 rounded-lg shadow-sm`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-semibold ${config.textColor} mb-1`}>
              {config.title}
            </div>
            <div className={`text-sm ${config.subtextColor} mb-3`}>
              {config.message}
            </div>
            {config.showUpgrade && nextPlan && (
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Button
                  onClick={onUpgradeClick}
                  variant="default"
                  size="sm"
                  className={`${warningLevel === 'critical' ? 'bg-red-600 hover:bg-red-700' : warningLevel === 'high' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-amber-600 hover:bg-amber-700'} text-white min-h-[36px] sm:min-h-0`}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Upgrade to {nextPlan.name}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <div className="text-xs text-gray-600 sm:ml-2">
                  {nextPlan.monthly_token_quota.toLocaleString()} tokens/month
                </div>
              </div>
            )}
            {config.showUpgrade && !nextPlan && (
              <Link href="/admin/settings/billing">
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[36px] sm:min-h-0"
                >
                  View Plans
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

