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
  const statusClasses =
    status === 'good'
      ? 'border-emerald-500/50 bg-emerald-50/50'
      : status === 'warn'
      ? 'border-amber-500/50 bg-amber-50/50'
      : status === 'bad'
      ? 'border-red-500/50 bg-red-50/50'
      : 'border-slate-200 bg-white';

  return (
    <div
      className={`rounded-2xl border p-3 sm:p-4 transition-colors ${statusClasses}`}
    >
      <div className="text-xs sm:text-sm text-slate-600 font-medium">
        {label}
      </div>
      <div className="mt-1 sm:mt-2 text-lg sm:text-xl md:text-2xl font-semibold text-slate-900">
        {value}
      </div>
      {sublabel && (
        <div className="mt-1 text-xs text-slate-500">{sublabel}</div>
      )}
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
      <div className={`grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 ${userRole === 'curator' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} mb-6`}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            className="h-20 sm:h-24 rounded-2xl bg-slate-100 animate-pulse"
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
    <div className={`grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 ${metricsToShow.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} mb-6`}>
      {metricsToShow}
    </div>
  );
}

