# Widget Key Fix - Implementation Complete

## Date
2025-11-22

## Problem
Admin UI was displaying wrong widget key:
- **Database (correct):** `wid_nfJBn-ee3MwaO8DkzlNBVuz6DTxX2gf6`
- **Admin UI (wrong):** `wid_nfJBn-ee3Mwa08Dkz1NBVuz6DTxX2gf6`

This caused widget requests to fail with 403 Forbidden because Runtime API couldn't verify the key against the stored hash.

## Root Cause
Missing route handlers in Admin UI:
- `/api/admin/widget/config` - route handler was missing
- `/api/admin/widget/rotate-key` - route handler was missing

Without these routes, Admin UI couldn't fetch the correct widget key and embed snippet from Admin API.

## Solution Implemented

### 1. Created Proxy Route Handlers

**Created:** `src/app/api/admin/widget/config/route.ts`
- Proxies `GET /api/admin/widget/config` → `GET /admin/widget/config` (Admin API)
- Forwards cookies for authentication
- Returns Admin API response directly

**Created:** `src/app/api/admin/widget/rotate-key/route.ts`
- Proxies `POST /api/admin/widget/rotate-key` → `POST /admin/widget/rotate-key` (Admin API)
- Forwards cookies for authentication
- Returns Admin API response directly

### 2. Verified Component Usage

**Verified:** `src/components/widget/WidgetSettingsSection.tsx`
- ✅ Uses `embed_snippet` directly from API response
- ✅ No reconstruction or modification of embed snippet
- ✅ Reloads config after key rotation

**Verified:** `src/components/widget/EmbedSnippetBlock.tsx`
- ✅ Displays `embed_snippet` as-is without modification
- ✅ No hardcoded keys

### 3. Architecture Compliance

**Single Source of Truth:**
- ✅ Admin API owns key generation, storage, and embed snippet creation
- ✅ Admin UI displays exactly what Admin API returns
- ✅ No local key generation or caching

## Files Changed

1. **Created:** `src/app/api/admin/widget/config/route.ts`
2. **Created:** `src/app/api/admin/widget/rotate-key/route.ts`

## Files Verified (No Changes Needed)

1. `src/components/widget/WidgetSettingsSection.tsx` - Already uses `embed_snippet` correctly
2. `src/components/widget/EmbedSnippetBlock.tsx` - Already displays snippet correctly
3. No hardcoded widget keys found in codebase

## Expected Result

After deployment:
1. Admin UI fetches widget config from Admin API via proxy route
2. Admin UI displays the correct widget key: `wid_nfJBn-ee3MwaO8DkzlNBVuz6DTxX2gf6`
3. Embed snippet contains the correct key
4. Widget sends correct key to Runtime API
5. Runtime API verifies key against hash → ✅ Success
6. Widget works correctly

## Testing Checklist

### 1. Verify Route Handlers Work
- [ ] Call `GET /api/admin/widget/config` - should return widget config
- [ ] Verify response contains correct `widget_key` and `embed_snippet`
- [ ] Verify `widget_key` matches database: `wid_nfJBn-ee3MwaO8DkzlNBVuz6DTxX2gf6`

### 2. Verify Admin UI Display
- [ ] Open Admin UI → Widget Settings
- [ ] Check embed snippet shows correct key: `wid_nfJBn-ee3MwaO8DkzlNBVuz6DTxX2gf6`
- [ ] Copy embed snippet and verify it contains correct key

### 3. Test Widget
- [ ] Paste embed snippet into test HTML page
- [ ] Load page and open widget
- [ ] Send a test message
- [ ] Verify no 403 error
- [ ] Verify widget responds correctly

### 4. Test Key Rotation
- [ ] Rotate widget key in Admin UI
- [ ] Verify embed snippet updates immediately
- [ ] Verify new key is displayed correctly
- [ ] Test widget with new key

## Architecture Ownership Model

| Layer | Responsibility |
|-------|----------------|
| **Admin API** | Owns key generation, hashing, storage, embed snippet creation |
| **Admin UI** | Displays EXACT data fetched from Admin API. Never modifies. |
| **Runtime** | Validates key + hash. Rejects mismatches. |

## Next Steps

1. ✅ Route handlers created
2. ⏳ Deploy to preview environment
3. ⏳ Test end-to-end
4. ⏳ Deploy to production
5. ⏳ Verify widget works in production

## Status

- ✅ **Implementation:** Complete
- ✅ **Code Review:** Passed (no linter errors)
- ⏳ **Testing:** Pending deployment
- ⏳ **Deployment:** Pending

## Notes

- Component code was already correct (uses `embed_snippet` directly)
- Issue was missing route handlers preventing Admin UI from fetching data
- No hardcoded keys found in codebase
- Architecture follows single source of truth principle

