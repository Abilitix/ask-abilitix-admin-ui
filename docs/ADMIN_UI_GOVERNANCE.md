# Admin UI Governance & Telemetry Console

## Overview

The Admin UI Governance & Telemetry Console provides platform superadmins with comprehensive visibility into system health, privacy posture, usage metrics, and policy violations across all tenants. This is a **strictly additive, non-breaking** feature that requires no changes to existing functionality.

## Architecture

### Security Model
- **Email-based access control**: Only users with emails in `NEXT_PUBLIC_SUPERADMIN_EMAILS` can access these pages
- **Server-side only**: All API calls are made server-side, tokens never exposed to browser
- **Metadata only**: No prompt/answer content is ever displayed
- **Tenant isolation**: All data is properly scoped by tenant context

### Pages

#### 1. Governance Console (`/admin/governance`)
**Purpose**: Cross-tenant KPIs, usage analytics, and policy monitoring

**Features**:
- **KPI Cards**: No-store %, p95 latency, violations count, total tokens
- **Top Tenants Table**: Ranked by token usage with CSV export
- **Violations Table**: Recent policy violations with detailed breakdown
- **Date Filters**: Custom date range selection with "Last 24h" quick filter
- **Manual Rollup**: Trigger daily metrics aggregation
- **CSV Export**: Download data for external analysis

**Data Sources**:
- `GET /admin/metrics/summary` - Platform-wide KPIs
- `GET /admin/metrics/tenants` - Tenant usage rankings
- `GET /admin/violations` - Policy violation logs
- `GET /admin/budgets/today` - Current budget status
- `POST /admin/metrics/rollup` - Manual rollup trigger

#### 2. Superadmin Console (`/admin/superadmin`)
**Purpose**: Tenant posture monitoring and system health

**Features**:
- **Tenant Cards**: Privacy posture, data freshness, activity metrics per tenant
- **Audit Feed**: Deferred - placeholder for future administrative event logs
- **Quick Actions**: Manual rollup and other administrative tasks
- **Refresh Controls**: Real-time data updates

**Data Sources**:
- `GET /admin/metrics/tenants` - Tenant health and activity metrics

## Implementation Details

### File Structure
```
src/
├── app/admin/
│   ├── governance/page.tsx          # Governance console UI
│   └── superadmin/page.tsx          # Superadmin console UI
├── app/api/superadmin/              # Server-side API proxies
│   ├── metrics/summary/route.ts
│   ├── metrics/tenants/route.ts
│   ├── violations/route.ts
│   ├── budgets/today/route.ts
│   └── metrics/rollup/route.ts
├── lib/
│   ├── api/superadmin.ts            # Client-side API helpers
│   ├── auth.ts                      # Updated with superadmin helpers
│   └── roles.ts                     # Updated with superadmin nav items
└── components/
    └── TopNav.tsx                   # Updated with superadmin links
```

### API Design

#### Client-Side Helpers (`src/lib/api/superadmin.ts`)
```typescript
// Batch fetch all governance data
fetchGovernanceKPIs(from?: string, to?: string)

// Individual endpoints
fetchMetricsSummary(from?: string, to?: string)
fetchTenantMetrics(from?: string, to?: string, limit?: number)
fetchViolations(from?: string, to?: string, tenantId?: string, limit?: number, offset?: number)
fetchBudgetsToday()
runDailyRollup(date: string)

// Utility functions
getTodaySydney(): Date
formatDateForAPI(date: Date): string
getLast24Hours(): { from: string; to: string }
```

#### Server-Side Proxies (`src/app/api/superadmin/*`)
- All routes enforce email-based superadmin authentication
- Forward requests to Admin API with proper headers
- Set `cache: 'no-store'` for real-time data
- Handle errors gracefully with detailed logging

### Data Contracts

#### MetricsSummary
```typescript
{
  calls: number;
  in_tokens: number;
  out_tokens: number;
  no_store_pct: number;
  p95_latency_ms: number;
  violations_count: number;
}
```

#### TenantMetrics
```typescript
{
  tenant_id: string;
  calls: number;
  tokens: number;
  p95_ms: number;
}
```

#### Violation
```typescript
{
  ts: string;
  tenant_id: string;
  route: string;
  kind: string;
  model: string;
  latency_ms: number;
  violations: string[];
}
```

#### Budget
```typescript
{
  tenant_id: string;
  date: string;
  cap: number;
  used: number;
  allowed: boolean;
  used_pct: number;
}
```

## Environment Variables

### Required
```bash
# Admin API configuration
ADMIN_API=https://ask-abilitix-admin-api.onrender.com
ADMIN_API_TOKEN=your_admin_api_token

# Superadmin access control
NEXT_PUBLIC_SUPERADMIN_EMAILS=admin@abilitix.com.au,other@example.com
```

### Optional
```bash
# Timezone for date handling (defaults to Australia/Sydney)
TZ_DEFAULT=Australia/Sydney
```

## Security Considerations

### Access Control
- **Email-based whitelist**: Only specified emails can access superadmin pages
- **Server-side validation**: Authentication checked on every API call
- **Graceful degradation**: Non-superadmin users see standard admin interface

### Data Privacy
- **No content exposure**: Only metadata and metrics are displayed
- **Tenant isolation**: All data properly scoped by tenant context
- **Server-side tokens**: API tokens never sent to browser

### Error Handling
- **Per-fetch try/catch**: Individual API failures don't break entire page
- **User-friendly messages**: Clear error states with retry options
- **Debug logging**: Server-side logging for troubleshooting

## Accessibility Features

### ARIA Support
- **Loading states**: `role="status"` and `aria-live="polite"` for screen readers
- **Table headers**: Proper `scope="col"` attributes
- **Button labels**: Descriptive `aria-label` attributes
- **Icon hiding**: `aria-hidden="true"` for decorative icons

### Keyboard Navigation
- **Tab order**: Logical focus flow through all interactive elements
- **Button states**: Clear disabled states with loading indicators
- **Table navigation**: Proper table structure for screen readers

### Visual Design
- **Hover states**: Subtle hover effects for interactive elements
- **Loading indicators**: Clear visual feedback during data fetching
- **Error states**: Distinct styling for error conditions
- **Empty states**: Helpful messages when no data is available

## Usage Examples

### Accessing the Console
1. Ensure your email is in `NEXT_PUBLIC_SUPERADMIN_EMAILS`
2. Navigate to `/admin/governance` or `/admin/superadmin`
3. System will verify access and redirect if unauthorized

### Viewing Metrics
1. **Governance Console**: See platform-wide KPIs and top tenants
2. **Superadmin Console**: Monitor individual tenant health
3. **Date Filtering**: Use custom date ranges or "Last 24h" quick filter
4. **CSV Export**: Download data for external analysis

### Running Manual Rollup
1. Click "Run Daily Rollup" in either console
2. System will aggregate metrics for today's date
3. Success/error notifications will appear
4. Data will refresh automatically after completion

## Troubleshooting

### Common Issues

#### "Insufficient permissions" redirect
- **Cause**: Email not in `NEXT_PUBLIC_SUPERADMIN_EMAILS`
- **Fix**: Add email to environment variable and restart

#### API errors in console
- **Cause**: Admin API unavailable or misconfigured
- **Fix**: Check `ADMIN_API` and `ADMIN_API_TOKEN` environment variables

#### No data showing
- **Cause**: No activity in selected date range
- **Fix**: Try "Last 24h" filter or expand date range

#### CSV export not working
- **Cause**: No data to export
- **Fix**: Ensure data is loaded before attempting export

### Debug Information
- Check browser console for client-side errors
- Check server logs for API call failures
- Verify environment variables are set correctly
- Ensure Admin API is accessible from your deployment

## Future Enhancements

### Planned Features
- **Audit Feed**: Real-time administrative event logs
- **Advanced Filtering**: More granular tenant and date filters
- **Real-time Updates**: WebSocket-based live data updates
- **Custom Dashboards**: Configurable KPI layouts
- **Alerting**: Automated notifications for threshold breaches

### Extension Points
- **New Metrics**: Easy to add additional KPI cards
- **Custom Tables**: Simple to add new data tables
- **Additional Actions**: Straightforward to add new administrative functions
- **Theme Support**: Ready for dark mode and custom styling

## Deployment Notes

### Production Checklist
- [ ] Set `NEXT_PUBLIC_SUPERADMIN_EMAILS` environment variable
- [ ] Verify `ADMIN_API` and `ADMIN_API_TOKEN` are correct
- [ ] Test access with superadmin email
- [ ] Verify data loads correctly
- [ ] Test CSV export functionality
- [ ] Test manual rollup action

### Rollback Plan
- All changes are additive and non-breaking
- Can be disabled by removing superadmin emails from environment
- No impact on existing admin functionality
- Can be reverted by removing new files and reverting modified files

## Support

For issues or questions regarding the Governance & Telemetry Console:
1. Check this documentation first
2. Review browser console and server logs
3. Verify environment configuration
4. Contact the development team with specific error details
