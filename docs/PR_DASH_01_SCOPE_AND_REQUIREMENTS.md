# PR-DASH-01: Scope & Requirements

**PR Title**: Add Dashboard Summary Endpoint + Greeting + Metrics Strip  
**Estimated Time**: 2-3 hours (Frontend) + Backend time  
**Status**: Ready to implement

---

## Scope Summary

### What This PR Includes ✅

1. **Backend (Admin API)**: New `GET /admin/dashboard/summary` endpoint
2. **Frontend (Admin UI)**:
   - Personalized greeting component
   - Governance metrics strip (4-6 cards)
   - Integration into existing dashboard page

### What This PR Does NOT Include ❌

- ❌ Quick actions bar (PR-DASH-02)
- ❌ Feature card redesign (PR-DASH-03)
- ❌ Welcome page (PR-WELCOME-01)
- ❌ Activity feed (Phase 3)
- ❌ Recommendations (Phase 3)
- ❌ Any changes to existing feature cards

---

## What We Need from Admin API

### New Endpoint: `GET /admin/dashboard/summary`

**Route**: `/admin/dashboard/summary`  
**Method**: `GET`  
**Auth**: Same as other admin endpoints (JWT + tenant scoping)  
**Query Params**: None (v1)

### Response Schema

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

### Field Requirements

#### Metrics

1. **`cited_pct`** (number | null)
   - Percentage of answers with citations in last 24h
   - Source: Metrics/events table (if available)
   - **v1**: Can stub with `null` if metrics not ready
   - Example: `72.5` means 72.5%

2. **`faq_hit_pct`** (number | null)
   - Percentage of answers served from FAQ fast-path (Redis)
   - Source: Metrics/events table (if available)
   - **v1**: Can stub with `null` if metrics not ready
   - Example: `61.2` means 61.2%

3. **`runtime_p95`** (number | null)
   - 95th percentile latency in seconds
   - Source: Metrics/events table (if available)
   - **v1**: Can stub with `null` if metrics not ready
   - Example: `2.3` means 2.3 seconds

4. **`pending_reviews`** (number, required)
   - Count of inbox items with `status = 'pending'`
   - Source: `inbox` table, filter by tenant, count where status = 'pending'
   - **v1**: Must be real (not null)

5. **`faq_count`** (number, required)
   - Total count of FAQs for tenant
   - Source: `faqs` table, filter by tenant, count all
   - **v1**: Must be real (not null)

6. **`docs_active`** (number, required)
   - Count of active documents (not deleted, status = 'active')
   - Source: `documents` table, filter by tenant, count where status = 'active'
   - **v1**: Must be real (not null)

#### User

1. **`name`** (string | null)
   - User's display name
   - Source: `users` table, from current authenticated user
   - **v1**: Can be `null` if not available

#### Tenant

1. **`name`** (string | null)
   - Tenant/company name
   - Source: `tenants` table or tenant settings
   - **v1**: Can be `null` if not available

2. **`industry`** (string | null)
   - Tenant's industry
   - Source: Tenant context/profile (TCMP)
   - **v1**: Can be `null` if not available

3. **`tone`** (string | null)
   - Tenant's communication tone preference
   - Source: Tenant context/profile (TCMP)
   - **v1**: Can be `null` if not available

### Implementation Notes for Admin API

**Composition Strategy**:
- `faq_count`, `pending_reviews`, `docs_active`: **Must be real** (query existing tables)
- `cited_pct`, `faq_hit_pct`, `runtime_p95`: **Can stub with `null`** if metrics tables not ready
- Frontend will show `"—"` for null values and handle gracefully

**Tenant Scoping**:
- Use same auth mechanism as other admin endpoints
- Derive `tenant_id` from JWT or `X-Tenant-Id` header
- Filter all queries by tenant

**Error Handling**:
- Return 503 if Admin API not configured
- Return 401 if unauthorized
- Return 500 for unexpected errors
- Follow existing Admin API error response format

**Smoke Test**:
```cmd
curl -X GET ^
  -H "Authorization: Bearer YOUR_ADMIN_JWT" ^
  -H "X-Tenant-Id: TENANT_ID" ^
  https://admin-api.abilitix.com/admin/dashboard/summary
```

---

## What Frontend (Admin UI) Will Do

### 1. Create API Route Proxy

**File**: `src/app/api/admin/dashboard/summary/route.ts`

**Purpose**: Proxy requests to Admin API

**Tasks**:
- Create Next.js API route
- Forward request to Admin API with auth headers
- Handle errors gracefully
- Return response to client

**Effort**: 30 minutes

---

### 2. Create Data Hook

**File**: `src/hooks/useDashboardSummary.ts`

**Purpose**: Fetch dashboard summary data with SWR

**Tasks**:
- Define TypeScript interface matching API response
- Create `useDashboardSummary()` hook using `useSWR`
- Return `{ summary, isLoading, isError }`

**Effort**: 30 minutes

---

### 3. Create Greeting Component

**File**: `src/components/dashboard/DashboardGreeting.tsx`

**Purpose**: Personalized welcome message

**Features**:
- Time-based greeting ("Good morning/afternoon/evening")
- User name personalization
- Tenant context subline ("Helping {company} deliver cited answers for {industry}")

**Props**:
- `name?: string | null`
- `tenantName?: string | null`
- `industry?: string | null`

**Effort**: 30 minutes

---

### 4. Create Metrics Strip Component

**File**: `src/components/dashboard/DashboardMetricsStrip.tsx`

**Purpose**: Display governance and usage metrics

**Features**:
- 4 primary governance metrics (cited_pct, faq_hit_pct, pending_reviews, runtime_p95)
- 2 secondary usage metrics (faq_count, docs_active)
- Status indicators (good/warn/bad) with color coding
- Loading skeleton state
- Graceful fallback for null values (`"—"`)

**Status Thresholds**:
- **Cited answers %**: Good ≥70%, Warn 50-69%, Bad <50%
- **FAQ fast-path**: Good ≥50%, Warn <50%
- **Inbox to review**: Good 0, Warn 1-10, Bad >10
- **Runtime p95**: Good ≤2.5s, Warn 2.5-4s, Bad >4s

**Effort**: 1-1.5 hours

---

### 5. Integrate into Dashboard

**File**: `src/components/DashboardClient.tsx`

**Changes**:
- Import new components and hook
- Add greeting at top
- Add metrics strip below greeting
- Keep existing feature cards unchanged
- Handle loading and error states

**Effort**: 30 minutes

---

### 6. Mobile Optimization

**Tasks**:
- Ensure metrics grid stacks on mobile (2 columns → 1 column)
- Touch-friendly card sizes (≥44px height)
- Responsive text sizing
- Test on mobile viewport

**Effort**: 30 minutes

---

## Frontend Implementation Checklist

### Backend Dependencies
- [ ] Admin API endpoint `GET /admin/dashboard/summary` is live
- [ ] Endpoint returns correct schema
- [ ] Endpoint handles auth and tenant scoping
- [ ] Smoke test passes

### Frontend Tasks
- [ ] Create `/api/admin/dashboard/summary/route.ts` proxy
- [ ] Create `useDashboardSummary.ts` hook
- [ ] Create `DashboardGreeting.tsx` component
- [ ] Create `DashboardMetricsStrip.tsx` component
- [ ] Integrate into `DashboardClient.tsx`
- [ ] Add loading states
- [ ] Add error handling
- [ ] Mobile responsive layout
- [ ] Test with real/null data
- [ ] Test on mobile devices

---

## Expected Outcome

After PR-DASH-01:

**Dashboard will show**:
1. Personalized greeting: "Good morning, John! 👋"
2. Subline: "Helping Acme Corp deliver cited answers for Technology."
3. Metrics strip with 6 cards:
   - Cited answers: 72% (green)
   - FAQ fast-path: 61% (green)
   - Inbox to review: 12 items (red badge)
   - Runtime p95: 2.3s (green)
   - Total FAQs: 127
   - Active Documents: 45
4. Existing feature cards (unchanged)

**User Experience**:
- Immediate visibility into governance metrics
- Clear status indicators (green/yellow/red)
- Personalized, context-aware greeting
- Professional, world-class appearance

---

## Dependencies & Blockers

### Can Start Immediately ✅
- Frontend component structure
- TypeScript interfaces
- UI layout and styling
- Mobile responsive design

### Needs Admin API First ⏳
- Actual data fetching (can use mock data for development)
- Real metrics (cited_pct, faq_hit_pct, runtime_p95) - can stub with null
- Real counts (pending_reviews, faq_count, docs_active) - must be real

### Non-Blocking
- Governance metrics (cited_pct, faq_hit_pct, runtime_p95) can be `null` in v1
- Frontend will handle gracefully with `"—"` display

---

## Next Steps

1. **Admin API Team**: Implement `GET /admin/dashboard/summary` endpoint
2. **Frontend Team**: Start building components (can use mock data initially)
3. **Integration**: Wire up real API when ready
4. **Testing**: Test with real/null data, mobile devices
5. **Deploy**: Ship PR-DASH-01

---

## Questions for Admin API Team

1. **Metrics Availability**: Are `cited_pct`, `faq_hit_pct`, `runtime_p95` available now, or should we stub with `null` for v1?
2. **Tenant Context**: Where is tenant name/industry/tone stored? (TCMP profile?)
3. **User Name**: Is user display name available in user object, or do we need to query separately?
4. **Performance**: Any caching strategy for this endpoint? (Summary data can be cached for 1-5 minutes)








