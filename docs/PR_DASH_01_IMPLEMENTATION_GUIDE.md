# PR-DASH-01 Implementation Guide

**PR Title**: Add dashboard summary endpoint + greeting + metrics strip  
**Scope**: Introduce `/admin/dashboard/summary` + governance metrics strip + greeting  
**Explicitly Out of Scope**: Quick actions, feature cards, welcome page, activity feed, recommendations

---

## Backend (Admin API)

### Endpoint: `GET /admin/dashboard/summary`

**Type Definition** (pseudo-TS for spec):
```typescript
type DashboardSummary = {
  metrics: {
    cited_pct: number | null;
    faq_hit_pct: number | null;
    runtime_p95: number | null;
    pending_reviews: number;
    faq_count: number;
    docs_active: number;
  };
  user: {
    name: string | null;
  };
  tenant: {
    name: string | null;
    industry: string | null;
    tone: string | null;
  };
};
```

**Response (v1)**:
```json
{
  "metrics": {
    "cited_pct": 72.5,
    "faq_hit_pct": 61.2,
    "runtime_p95": 2.3,
    "pending_reviews": 12,
    "faq_count": 127,
    "docs_active": 45
  },
  "user": {
    "name": "John Doe"
  },
  "tenant": {
    "name": "Acme Corp",
    "industry": "Technology",
    "tone": "concise, no hype"
  }
}
```

**Composition from Existing Sources**:
- `faq_count`: Count of FAQs for tenant (existing `faqs` table)
- `pending_reviews`: Count of inbox items with `status = 'pending'`
- `docs_active`: Count of documents with `status = 'active'` / not deleted
- `cited_pct`, `faq_hit_pct`, `runtime_p95`: Wire to metrics/events tables if ready, or stub with `null` for v1

**Auth & Tenant Scoping**:
- Require same auth as other admin endpoints
- Derive `tenant_id` from JWT / header (`X-Tenant-Id`) as already done
- No query params in v1

**Smoke Test** (Windows-friendly):
```cmd
curl -X GET ^
  -H "Authorization: Bearer YOUR_ADMIN_JWT" ^
  -H "X-Tenant-Id: TENANT_ID" ^
  https://admin-api.abilitix.com/admin/dashboard/summary
```

---

## Frontend (Admin UI)

### 1. Create Data Hook: `useDashboardSummary.ts`

**Location**: `src/hooks/useDashboardSummary.ts`

```typescript
import useSWR from "swr";

export interface DashboardSummary {
  metrics: {
    cited_pct: number | null;
    faq_hit_pct: number | null;
    runtime_p95: number | null;
    pending_reviews: number;
    faq_count: number;
    docs_active: number;
  };
  user: {
    name: string | null;
  };
  tenant: {
    name: string | null;
    industry: string | null;
    tone: string | null;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useDashboardSummary() {
  const { data, error, isLoading } = useSWR<DashboardSummary>(
    "/api/admin/dashboard/summary",
    fetcher
  );

  return {
    summary: data,
    isLoading,
    isError: !!error,
  };
}
```

---

### 2. Create Greeting Component: `DashboardGreeting.tsx`

**Location**: `src/components/dashboard/DashboardGreeting.tsx`

```typescript
interface DashboardGreetingProps {
  name?: string | null;
  tenantName?: string | null;
  industry?: string | null;
}

export function DashboardGreeting({
  name,
  tenantName,
  industry,
}: DashboardGreetingProps) {
  const now = new Date();
  const hour = now.getHours();
  const timeOfDay =
    hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  return (
    <div className="mb-4">
      <h1 className="text-2xl font-semibold">
        Good {timeOfDay}
        {name ? `, ${name}` : ""}! 👋
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        {tenantName
          ? `Helping ${tenantName} deliver cited answers${
              industry ? ` for ${industry}` : ""
            }.`
          : "Helping you deliver cited answers with Abilitix."}
      </p>
    </div>
  );
}
```

---

### 3. Create Metrics Strip Component: `DashboardMetricsStrip.tsx`

**Location**: `src/components/dashboard/DashboardMetricsStrip.tsx`

```typescript
import { DashboardSummary } from "@/hooks/useDashboardSummary";

interface MetricCardProps {
  label: string;
  value: string;
  sublabel?: string;
  status?: "good" | "warn" | "bad" | "neutral";
}

function MetricCard({ label, value, sublabel, status = "neutral" }: MetricCardProps) {
  const statusClasses =
    status === "good"
      ? "border-emerald-500/50 bg-emerald-50/50"
      : status === "warn"
      ? "border-amber-500/50 bg-amber-50/50"
      : status === "bad"
      ? "border-red-500/50 bg-red-50/50"
      : "border-border";

  return (
    <div className={`rounded-2xl border p-3 md:p-4 ${statusClasses}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
      {sublabel && (
        <div className="mt-1 text-xs text-muted-foreground">{sublabel}</div>
      )}
    </div>
  );
}

interface DashboardMetricsStripProps {
  metrics?: DashboardSummary["metrics"];
  isLoading: boolean;
}

export function DashboardMetricsStrip({ metrics, isLoading }: DashboardMetricsStripProps) {
  if (isLoading && !metrics) {
    return (
      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <div className="h-20 rounded-2xl bg-muted animate-pulse" />
        <div className="h-20 rounded-2xl bg-muted animate-pulse" />
        <div className="h-20 rounded-2xl bg-muted animate-pulse" />
        <div className="h-20 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!metrics) return null;

  const fmtPct = (v: number | null) =>
    v == null ? "—" : `${v.toFixed(0)}%`;
  const fmtLatency = (v: number | null) =>
    v == null ? "—" : `${v.toFixed(1)}s`;

  const citedStatus =
    metrics.cited_pct == null
      ? "neutral"
      : metrics.cited_pct >= 70
      ? "good"
      : metrics.cited_pct >= 50
      ? "warn"
      : "bad";

  const faqStatus =
    metrics.faq_hit_pct == null
      ? "neutral"
      : metrics.faq_hit_pct >= 50
      ? "good"
      : "warn";

  const runtimeStatus =
    metrics.runtime_p95 == null
      ? "neutral"
      : metrics.runtime_p95 <= 2.5
      ? "good"
      : metrics.runtime_p95 <= 4
      ? "warn"
      : "bad";

  const inboxStatus =
    metrics.pending_reviews > 10
      ? "bad"
      : metrics.pending_reviews > 0
      ? "warn"
      : "good";

  return (
    <div className="space-y-4 mb-6">
      {/* Primary Governance Metrics */}
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard
          label="Cited answers (24h)"
          value={fmtPct(metrics.cited_pct)}
          sublabel="Governance quality"
          status={citedStatus}
        />
        <MetricCard
          label="FAQ fast-path"
          value={fmtPct(metrics.faq_hit_pct)}
          sublabel="Answered from FAQs"
          status={faqStatus}
        />
        <MetricCard
          label="Inbox to review"
          value={metrics.pending_reviews.toString()}
          sublabel="Items pending"
          status={inboxStatus}
        />
        <MetricCard
          label="Runtime p95"
          value={fmtLatency(metrics.runtime_p95)}
          sublabel="Last 24h"
          status={runtimeStatus}
        />
      </div>

      {/* Secondary Usage Metrics */}
      <div className="grid gap-3 md:grid-cols-2">
        <MetricCard
          label="Total FAQs"
          value={metrics.faq_count.toString()}
          sublabel="Live FAQs"
          status="neutral"
        />
        <MetricCard
          label="Active Documents"
          value={metrics.docs_active.toString()}
          sublabel="In knowledge base"
          status="neutral"
        />
      </div>
    </div>
  );
}
```

---

### 4. Create API Route: `/api/admin/dashboard/summary/route.ts`

**Location**: `src/app/api/admin/dashboard/summary/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    
    const ADMIN_API = process.env.ADMIN_API;
    const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;
    if (!ADMIN_API || !ADMIN_API_TOKEN) {
      return NextResponse.json(
        { detail: { error: 'service_unavailable', reason: 'Admin API not configured' } },
        { status: 503 }
      );
    }

    const url = new URL('/admin/dashboard/summary', ADMIN_API);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ADMIN_API_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Tenant-Id': user.tenant_id || '',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: { error: 'service_unavailable', reason: 'Upstream error' }
      }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (e) {
    console.error('Dashboard summary error:', e);
    return NextResponse.json(
      { detail: { error: 'service_unavailable', reason: 'Unexpected error' } },
      { status: 503 }
    );
  }
}
```

---

### 5. Wire into Dashboard Page

**Location**: `src/components/DashboardClient.tsx`

```typescript
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { DashboardMetricsStrip } from "@/components/dashboard/DashboardMetricsStrip";

export default function DashboardClient({ user }: DashboardClientProps) {
  const { summary, isLoading, isError } = useDashboardSummary();

  // ... existing code for cards filtering ...

  return (
    <div className="mx-auto max-w-6xl px-4 space-y-10">
      {/* Greeting */}
      <DashboardGreeting
        name={summary?.user.name || user.name}
        tenantName={summary?.tenant.name}
        industry={summary?.tenant.industry}
      />

      {/* Metrics Strip */}
      {!isError && (
        <DashboardMetricsStrip
          metrics={summary?.metrics}
          isLoading={isLoading}
        />
      )}

      {/* Existing feature cards section - unchanged */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">
          Dashboard Features
        </h2>
        {/* ... existing cards code ... */}
      </section>
    </div>
  );
}
```

---

## Status Thresholds

**Cited Answers %**:
- Good: ≥ 70%
- Warn: 50-69%
- Bad: < 50%

**FAQ Fast-Path Hit Rate**:
- Good: ≥ 50%
- Warn: < 50%

**Inbox to Review**:
- Good: 0 items
- Warn: 1-10 items
- Bad: > 10 items

**Runtime p95**:
- Good: ≤ 2.5s
- Warn: 2.5-4s
- Bad: > 4s

---

## Testing Checklist

- [ ] API endpoint returns correct schema
- [ ] Greeting shows correct time of day
- [ ] Greeting personalizes with user name
- [ ] Greeting shows tenant name and industry
- [ ] Metrics cards display correct values
- [ ] Status indicators show correct colors
- [ ] Loading state shows skeleton
- [ ] Graceful fallback for null values (`—`)
- [ ] Responsive grid stacks on mobile
- [ ] Mobile touch targets are ≥44px
- [ ] Error state handled gracefully

---

## PR Description Template

```markdown
## PR-DASH-01: Add Dashboard Summary + Greeting + Metrics Strip

### Scope
Introduce `/admin/dashboard/summary` endpoint + governance metrics strip + personalized greeting.

### Changes

**Backend (Admin API)**:
- New endpoint: `GET /admin/dashboard/summary`
- Returns governance metrics (cited_pct, faq_hit_pct, runtime_p95, pending_reviews)
- Returns usage metrics (faq_count, docs_active)
- Returns user and tenant context

**Frontend (Admin UI)**:
- New hook: `useDashboardSummary.ts`
- New component: `DashboardGreeting.tsx`
- New component: `DashboardMetricsStrip.tsx`
- Integrated into `DashboardClient.tsx`

### Out of Scope
- Quick actions bar (PR-DASH-02)
- Feature card redesign (PR-DASH-03)
- Welcome page (PR-WELCOME-01)
- Activity feed (Phase 3)
- Recommendations (Phase 3)

### Testing
- [ ] API endpoint tested with curl
- [ ] Greeting shows correct time/name
- [ ] Metrics display with status indicators
- [ ] Mobile responsive
- [ ] Loading/error states handled
```








