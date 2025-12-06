# Backend Fix Required: Tenant Self-Serve Access to Usage Endpoint

## Issue
Tenants are getting **401 Unauthorized** errors when trying to access their own usage data via `/admin/billing/tenants/{tenant_id}/usage`.

## Current Behavior
- **Frontend:** Tenant self-serve billing page (`/admin/settings/billing`) tries to fetch usage data
- **Endpoint Called:** `GET /admin/billing/tenants/{tenant_id}/usage?month=YYYY-MM`
- **Error:** `401 Unauthorized` from Admin API
- **Backend Logs Show:** `tenant_id` is present in logs, but request is still rejected

## Expected Behavior
Tenants should be able to access their **own** usage data when:
1. The `tenant_id` in the path matches their session `tenant_id`
2. The user has `owner` or `admin` role
3. The request includes `X-Tenant-Id` header (frontend proxy adds this)

## Frontend Implementation
The frontend proxy (`src/app/api/admin/[...path]/route.ts`) has been updated to:
- ✅ Detect tenant self-serve usage requests: `/admin/billing/tenants/{tenant_id}/usage`
- ✅ Verify tenant_id in path matches session tenant_id (security check)
- ✅ Add `X-Tenant-Id` header to requests
- ✅ **NOT** require SuperAdmin token for tenant self-serve usage endpoint
- ✅ Block access if tenant tries to access another tenant's data (403)

## Backend Fix Required

### Option 1: Allow Tenant Access to Own Usage (Recommended)
Update the Admin API endpoint `/admin/billing/tenants/{tenant_id}/usage` to:
1. Check if request has `X-Tenant-Id` header
2. If `X-Tenant-Id` matches the `tenant_id` in the path, allow access (no SuperAdmin required)
3. If `X-Tenant-Id` doesn't match or is missing, require SuperAdmin authentication
4. Verify user has `owner` or `admin` role for tenant access

### Option 2: Create New Tenant-Scoped Endpoint (Alternative)
Create a new endpoint: `/admin/billing/me/usage?month=YYYY-MM`
- Uses session tenant context (no tenant_id in path)
- No SuperAdmin required
- Returns current tenant's usage data

## Request Flow

### Current (Failing)
```
Frontend → Proxy → Admin API
  ↓           ↓         ↓
Tenant ID  X-Tenant-Id  ❌ 401 (Requires SuperAdmin)
```

### Expected (After Fix)
```
Frontend → Proxy → Admin API
  ↓           ↓         ↓
Tenant ID  X-Tenant-Id  ✅ 200 (Tenant access allowed)
```

## Security Considerations
- ✅ Frontend already verifies tenant_id matches session
- ✅ Frontend blocks cross-tenant access (403)
- ✅ Backend should also verify tenant_id matches X-Tenant-Id header
- ✅ Backend should verify user role (owner/admin) for tenant access

## Related Endpoints
The same fix may be needed for:
- `/admin/billing/tenants/{tenant_id}/quota` - Tenant quota access
- `/admin/billing/tenants/{tenant_id}` - Tenant billing info access

## Testing
After backend fix, verify:
1. ✅ Tenant can access their own usage data (200 OK)
2. ✅ Tenant cannot access another tenant's usage data (403 Forbidden)
3. ✅ SuperAdmin can still access any tenant's usage data (200 OK)
4. ✅ Unauthenticated requests are rejected (401 Unauthorized)

## Frontend Status
- ✅ Frontend proxy updated and deployed to preview
- ✅ UsageCharts component ready to display data
- ⏳ Waiting for backend fix to enable tenant self-serve access

## Contact
If backend team needs clarification or has questions about the frontend implementation, please reach out.

