'use client';

import type { DashboardSummary } from '@/hooks/useDashboardSummary';
import type { UserRole } from '@/lib/roles';

interface MetricCardProps {
  label: string;
  value: string;
  sublabel?: string;
  status?: 'good' | 'warn' | 'bad' | 'neutral';
}

function MetricCard({
  label,
  value,
  sublabel,
  status = 'neutral',
}: MetricCardProps) {
  const statusConfig = {
    good: {
      border: 'border-emerald-200/60',
      bg: 'bg-gradient-to-br from-emerald-50/80 to-emerald-50/40',
      accent: 'before:bg-emerald-500',
      text: 'text-emerald-700',
    },
    warn: {
      border: 'border-amber-200/60',
      bg: 'bg-gradient-to-br from-amber-50/80 to-amber-50/40',
      accent: 'before:bg-amber-500',
      text: 'text-amber-700',
    },
    bad: {
      border: 'border-red-200/60',
      bg: 'bg-gradient-to-br from-red-50/80 to-red-50/40',
      accent: 'before:bg-red-500',
      text: 'text-red-700',
    },
    neutral: {
      border: 'border-slate-200/80',
      bg: 'bg-gradient-to-br from-slate-50/60 to-white',
      accent: 'before:bg-slate-400',
      text: 'text-slate-600',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`relative rounded-xl border ${config.border} ${config.bg} p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group`}
    >
      {/* Accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${config.accent} opacity-60 group-hover:opacity-100 transition-opacity`}
      />
      
      <div className="relative">
        <div className={`text-xs sm:text-sm font-medium ${config.text} mb-2 tracking-wide uppercase`}>
          {label}
        </div>
        <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
          {value}
        </div>
        {sublabel && (
          <div className="mt-2 text-xs text-slate-500 font-medium">{sublabel}</div>
        )}
      </div>
    </div>
  );
}

interface DashboardMetricsStripProps {
  metrics?: DashboardSummary['metrics'];
  isLoading: boolean;
  userRole?: UserRole;
}

export function DashboardMetricsStrip({
  metrics,
  isLoading,
  userRole,
}: DashboardMetricsStripProps) {
  // Viewers: Hide metrics strip entirely
  if (userRole === 'viewer') {
    return null;
  }

  if (isLoading && !metrics) {
    // Determine how many skeleton cards to show based on role
    const skeletonCount = userRole === 'curator' ? 3 : 4;
    return (
      <div className={`grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 ${userRole === 'curator' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} mb-6`}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            className="h-28 sm:h-32 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/50 animate-pulse shadow-sm"
          />
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const fmtPct = (v: number | null) => (v == null ? '—' : `${v.toFixed(0)}%`);
  const fmtLatency = (v: number | null) =>
    v == null ? '—' : `${v.toFixed(1)}s`;

  const citedStatus =
    metrics.cited_pct == null
      ? 'neutral'
      : metrics.cited_pct >= 70
      ? 'good'
      : metrics.cited_pct >= 50
      ? 'warn'
      : 'bad';

  const faqStatus =
    metrics.faq_hit_pct == null
      ? 'neutral'
      : metrics.faq_hit_pct >= 50
      ? 'good'
      : 'warn';

  const runtimeStatus =
    metrics.runtime_p95 == null
      ? 'neutral'
      : metrics.runtime_p95 <= 2.5
      ? 'good'
      : metrics.runtime_p95 <= 4
      ? 'warn'
      : 'bad';

  const inboxStatus =
    metrics.pending_reviews > 10
      ? 'bad'
      : metrics.pending_reviews > 0
      ? 'warn'
      : 'good';

  // Determine which metrics to show based on role
  const isAdminOrOwner = userRole === 'admin' || userRole === 'owner';
  const isCurator = userRole === 'curator';

  const metricsToShow = [];

  // Governance metrics (only for admin/owner)
  if (isAdminOrOwner) {
    metricsToShow.push(
      <MetricCard
        key="cited"
        label="Cited answers (24h)"
        value={fmtPct(metrics.cited_pct)}
        sublabel="Governance quality"
        status={citedStatus}
      />,
      <MetricCard
        key="faq-hit"
        label="FAQ fast-path"
        value={fmtPct(metrics.faq_hit_pct)}
        sublabel="Answered from FAQs"
        status={faqStatus}
      />,
      <MetricCard
        key="runtime"
        label="Runtime p95"
        value={fmtLatency(metrics.runtime_p95)}
        sublabel="Last 24h"
        status={runtimeStatus}
      />
    );
  }

  // Inbox count (for curators and admins/owners)
  if (isCurator || isAdminOrOwner) {
    metricsToShow.push(
      <MetricCard
        key="inbox"
        label="Inbox to review"
        value={metrics.pending_reviews.toString()}
        sublabel="Items pending"
        status={inboxStatus}
      />
    );
  }

  // Basic counts for curators (if not already shown)
  if (isCurator) {
    metricsToShow.push(
      <MetricCard
        key="faqs"
        label="Total FAQs"
        value={metrics.faq_count.toString()}
        sublabel="Live FAQs"
        status="neutral"
      />,
      <MetricCard
        key="docs"
        label="Active docs"
        value={metrics.docs_active.toString()}
        sublabel="Documents"
        status="neutral"
      />
    );
  }

  if (metricsToShow.length === 0) return null;

  return (
    <div className={`grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 ${metricsToShow.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} mb-8`}>
      {metricsToShow}
    </div>
  );
}

